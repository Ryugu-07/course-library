(function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "transport-duality-lab-styles";
  var INSTANCE = 0;
  var EPS = 1e-9;
  var RELAX_EPS = 1e-11;

  /*
   * These are deliberately small, exact-data teaching cases.  A problem may
   * either give positions plus a metric, or give an explicit cost matrix.
   * The latter makes the LP layer visible without pretending every cost is a
   * distance.
   */
  var PRESETS = [
    {
      id: "split",
      label: "拆分质量：一到两",
      description: "一个供给点必须把质量拆到两个需求点；Monge 映射不存在，Kantorovich 耦合存在。",
      problem: {
        id: "split",
        title: "Monge 受阻：一处供给拆到两处",
        metric: "absolute",
        sources: [{ label: "x₀=0", position: 0, supply: 1 }],
        targets: [
          { label: "y₀=−1", position: -1, demand: 0.5 },
          { label: "y₁=1", position: 1, demand: 0.5 }
        ]
      }
    },
    {
      id: "monotone",
      label: "一维单调：分位数",
      description: "|x−y| 成本下按位置排序；边不交叉，但 x₀ 的质量仍会拆成两段。",
      problem: {
        id: "monotone",
        title: "一维单调重排：分位数对分位数",
        metric: "absolute",
        monotone: true,
        sources: [
          { label: "x₀=0", position: 0, supply: 0.75 },
          { label: "x₁=1", position: 1, supply: 0.25 }
        ],
        targets: [
          { label: "y₀=0.25", position: 0.25, demand: 0.25 },
          { label: "y₁=1.25", position: 1.25, demand: 0.75 }
        ]
      }
    },
    {
      id: "quadratic",
      label: "凸成本：平方距离",
      description: "把同一维度换成 (x−y)²；交换论证仍偏爱单调耦合，但价格尺度改变。",
      problem: {
        id: "quadratic",
        title: "一维凸成本：平方距离的单调方案",
        metric: "quadratic",
        monotone: true,
        sources: [
          { label: "x₀=0", position: 0, supply: 0.5 },
          { label: "x₁=2", position: 2, supply: 0.5 }
        ],
        targets: [
          { label: "y₀=1", position: 1, demand: 0.25 },
          { label: "y₁=3", position: 3, demand: 0.75 }
        ]
      }
    },
    {
      id: "tie",
      label: "平局：多组最优计划",
      description: "所有边成本相同；脚本用固定顺序选一组最优耦合，同时提醒‘最优’不等于‘唯一’。",
      problem: {
        id: "tie",
        title: "退化运输表：原始最优计划不唯一",
        sources: [
          { label: "x₀", supply: 0.5 },
          { label: "x₁", supply: 0.5 }
        ],
        targets: [
          { label: "y₀", demand: 0.5 },
          { label: "y₁", demand: 0.5 }
        ],
        costs: [
          [1, 1],
          [1, 1]
        ]
      }
    }
  ];

  var STYLE_TEXT = [
    ".td-lab { --td-flow: var(--cl-blue, #315f9d); --td-dual: var(--cl-green, #39734d); --td-slack: var(--cl-gold, #9b6a12); --td-warn: var(--cl-red, #b64335); --td-muted: var(--fg-soft); max-width: 100%; min-width: 0; overflow: hidden; line-height: 1.55; }",
    "html[data-theme=\"dark\"] .td-lab { --td-flow: #83c8ff; --td-dual: #72bd8b; --td-slack: #e2b458; --td-warn: #f08c7d; }",
    ".td-lab *, .td-lab *::before, .td-lab *::after { box-sizing: border-box; }",
    ".td-lab .td-intro, .td-lab .td-note { color: var(--td-muted); font-size: 13px; line-height: 1.7; overflow-wrap: anywhere; }",
    ".td-lab .td-prompt { margin: 12px 0 16px; padding: 11px 13px; border-left: 3px solid var(--td-slack); background: var(--block-bg, var(--bg)); line-height: 1.7; }",
    ".td-lab .td-preset-box { min-width: 0; margin: 0 0 16px; padding: 0; border: 0; }",
    ".td-lab .td-preset-box legend { margin-bottom: 7px; color: var(--td-muted); font-size: 13px; font-weight: 700; }",
    ".td-lab .td-preset-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(145px, 1fr)); gap: 8px; min-width: 0; }",
    ".td-lab button { min-width: 0; min-height: 44px; padding: 8px 10px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); color: var(--fg); font: inherit; line-height: 1.3; cursor: pointer; overflow-wrap: anywhere; }",
    ".td-lab button:hover { border-color: var(--accent); }",
    ".td-lab button[aria-pressed=\"true\"], .td-lab button.td-primary { border-color: var(--accent); background: var(--accent); color: var(--bg); font-weight: 700; }",
    ".td-lab button:focus-visible, .td-lab input:focus-visible { outline: 3px solid var(--cl-focus, #1769aa); outline-offset: 2px; }",
    ".td-lab .td-layout { display: grid; grid-template-columns: minmax(205px, .72fr) minmax(0, 1.28fr); gap: 18px; align-items: start; min-width: 0; }",
    ".td-lab .td-controls, .td-lab .td-stage { min-width: 0; }",
    ".td-lab .td-controls { display: grid; gap: 12px; padding: 12px; border: 1px solid var(--border); border-radius: 7px; background: var(--bg); }",
    ".td-lab .td-control { display: grid; gap: 5px; min-width: 0; }",
    ".td-lab .td-control label { color: var(--td-muted); font-size: 13px; font-weight: 650; }",
    ".td-lab .td-control output { color: var(--accent); font-variant-numeric: tabular-nums; }",
    ".td-lab .td-control input[type=range] { display: block; width: 100%; min-height: 44px; margin: 0; accent-color: var(--accent); }",
    ".td-lab .td-button-row { display: flex; flex-wrap: wrap; gap: 8px; }",
    ".td-lab .td-button-row > * { flex: 1 1 120px; }",
    ".td-lab .td-stage-frame { min-width: 0; padding: 9px; border: 1px solid var(--border); border-radius: 7px; background: var(--bg); overflow: hidden; }",
    ".td-lab .td-stage-title { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; margin: 0 0 8px; color: var(--td-muted); font-size: 13px; }",
    ".td-lab .td-status { min-height: 1.7em; margin: 0 0 8px; color: var(--fg); font-size: 13px; font-weight: 650; line-height: 1.7; overflow-wrap: anywhere; }",
    ".td-lab .td-svg { display: block; width: 100%; max-width: 100%; height: auto; color: var(--fg); }",
    ".td-lab .td-svg text { fill: currentColor; font-family: inherit; letter-spacing: 0; }",
    ".td-lab .td-panel { fill: var(--bg); stroke: var(--border); stroke-width: 1.1; }",
    ".td-lab .td-axis { stroke: var(--border); stroke-width: 1; }",
    ".td-lab .td-edge-unused { stroke: var(--td-muted); stroke-width: 1.2; stroke-dasharray: 4 4; opacity: .45; }",
    ".td-lab .td-edge-used { stroke: var(--td-flow); stroke-linecap: round; opacity: .9; }",
    ".td-lab .td-edge-label { fill: var(--td-flow) !important; font-size: 10.5px; font-weight: 700; }",
    ".td-lab .td-node-source { fill: color-mix(in srgb, var(--td-flow) 16%, var(--bg)); stroke: var(--td-flow); stroke-width: 1.7; }",
    ".td-lab .td-node-target { fill: color-mix(in srgb, var(--td-dual) 16%, var(--bg)); stroke: var(--td-dual); stroke-width: 1.7; }",
    ".td-lab .td-node-label { fill: var(--fg) !important; font-size: 12px; font-weight: 700; }",
    ".td-lab .td-axis-label { fill: var(--td-muted) !important; font-size: 11px; }",
    ".td-lab .td-legend { display: flex; flex-wrap: wrap; gap: 6px 14px; margin: 7px 2px 0; color: var(--td-muted); font-size: 12px; line-height: 1.5; }",
    ".td-lab .td-legend-item { display: inline-flex; align-items: center; gap: 6px; min-width: 0; }",
    ".td-lab .td-swatch { display: inline-block; width: 25px; height: 0; flex: 0 0 auto; border-top: 3px solid currentColor; }",
    ".td-lab .td-swatch-flow { color: var(--td-flow); }",
    ".td-lab .td-swatch-unused { color: var(--td-muted); border-top-width: 1px; border-top-style: dashed; }",
    ".td-lab .td-swatch-dual { color: var(--td-dual); }",
    ".td-lab .td-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(125px, 1fr)); gap: 8px; margin-top: 12px; }",
    ".td-lab .td-metric { min-width: 0; padding: 9px 10px; border-top: 2px solid var(--border); background: var(--bg); }",
    ".td-lab .td-metric span, .td-lab .td-metric small { display: block; color: var(--td-muted); line-height: 1.45; }",
    ".td-lab .td-metric span { font-size: 11.5px; }",
    ".td-lab .td-metric strong { display: block; margin-top: 3px; color: var(--fg); font-size: 15px; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }",
    ".td-lab .td-metric small { margin-top: 3px; font-size: 11px; overflow-wrap: anywhere; }",
    ".td-lab .td-subtitle { margin: 16px 0 7px; color: var(--fg); font-size: 14px; font-weight: 700; }",
    ".td-lab .td-formula { max-width: 100%; overflow-x: auto; padding: 10px 12px; border-left: 3px solid var(--td-flow); background: var(--bg); color: var(--fg); font-family: \"SF Mono\", Menlo, Consolas, monospace; font-size: 12.5px; line-height: 1.7; white-space: pre-wrap; overflow-wrap: anywhere; }",
    ".td-lab .td-table-wrap { max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }",
    ".td-lab .td-table { width: 100%; min-width: 520px; border-collapse: separate; border-spacing: 0; table-layout: fixed; font-size: 12px; font-variant-numeric: tabular-nums; }",
    ".td-lab .td-table.td-matrix { min-width: 455px; }",
    ".td-lab .td-table caption { padding: 0 0 7px; text-align: left; color: var(--td-muted); font-size: 12.5px; }",
    ".td-lab .td-table th, .td-lab .td-table td { padding: 7px 6px; border-bottom: 1px solid var(--border); text-align: right; vertical-align: top; overflow-wrap: anywhere; }",
    ".td-lab .td-table th:first-child, .td-lab .td-table td:first-child { text-align: left; }",
    ".td-lab .td-table th { color: var(--td-muted); font-size: 11.5px; font-weight: 650; }",
    ".td-lab .td-table td.td-flow-cell { color: var(--td-flow); font-weight: 700; }",
    ".td-lab .td-table td.td-dual-cell { color: var(--td-dual); }",
    ".td-lab .td-table td.td-slack-cell { color: var(--td-slack); }",
    ".td-lab .td-table tr.td-used td { background: color-mix(in srgb, var(--td-flow) 9%, var(--bg)); }",
    ".td-lab .td-table tr.td-used td:first-child { color: var(--td-flow); font-weight: 700; }",
    ".td-lab .td-checklist { display: grid; gap: 7px; margin: 12px 0 0; padding: 0; list-style: none; }",
    ".td-lab .td-checklist li { display: grid; grid-template-columns: 24px minmax(0, 1fr); gap: 7px; align-items: start; }",
    ".td-lab .td-check-mark { font-weight: 800; text-align: center; }",
    ".td-lab .td-pass { color: var(--td-dual); }",
    ".td-lab .td-fail { color: var(--td-warn); }",
    ".td-lab .td-footnote { margin: 10px 0 0; padding: 9px 11px; border-left: 3px solid var(--td-slack); background: var(--block-bg, var(--bg)); color: var(--td-muted); font-size: 12.5px; line-height: 1.7; overflow-wrap: anywhere; }",
    "@supports not (color: color-mix(in srgb, white, black)) { .td-lab .td-node-source { fill: var(--bg); } .td-lab .td-node-target { fill: var(--bg); } .td-lab .td-table tr.td-used td { background: var(--block-bg, var(--bg)); } }",
    "@media (max-width: 760px) { .td-lab .td-layout { grid-template-columns: minmax(0, 1fr); } }",
    "@media (max-width: 480px) { .td-lab .td-stage-frame { padding: 6px; } .td-lab .td-table { font-size: 11.5px; } .td-lab .td-table th, .td-lab .td-table td { padding-left: 4px; padding-right: 4px; } }",
    "@media (prefers-reduced-motion: reduce) { .td-lab * { scroll-behavior: auto !important; transition: none !important; animation: none !important; } }"
  ].join("\n");

  function installStyles() {
    if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    document.head.appendChild(style);
  }

  function appendChildren(node, children) {
    if (children === undefined || children === null) return node;
    var list = Array.isArray(children) ? children : [children];
    list.forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : document.createTextNode(String(child)));
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
      else if (key.slice(0, 2) === "on" && typeof value === "function") {
        node.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }

  function makeElement(api, tag, attrs, children) {
    if (api && typeof api.el === "function") return api.el(tag, attrs || {}, children);
    return appendChildren(setAttributes(document.createElement(tag), attrs || {}), children);
  }

  function makeSvg(api, tag, attrs, children) {
    if (api && typeof api.svg === "function") return api.svg(tag, attrs || {}, children);
    return appendChildren(
      setAttributes(document.createElementNS(SVG_NS, tag), attrs || {}),
      children
    );
  }

  function replaceChildren(node, children) {
    if (node && typeof node.replaceChildren === "function") {
      node.replaceChildren.apply(node, Array.isArray(children) ? children : [children]);
      return;
    }
    while (node && node.firstChild) node.removeChild(node.firstChild);
    appendChildren(node, children);
  }

  function formatNumber(api, value, digits) {
    if (!Number.isFinite(value)) return "—";
    if (Math.abs(value) < 0.0005) value = 0;
    if (api && typeof api.format === "function") return api.format(value, digits === undefined ? 3 : digits);
    var places = digits === undefined ? 3 : digits;
    var text = value.toFixed(places);
    return text.indexOf(".") === -1 ? text : text.replace(/0+$/, "").replace(/\.$/, "");
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function sum(values) {
    return values.reduce(function (total, value) { return total + value; }, 0);
  }

  function copyMatrix(matrix) {
    return matrix.map(function (row) { return row.slice(); });
  }

  function copyProblem(problem) {
    return {
      id: problem.id,
      title: problem.title,
      metric: problem.metric,
      monotone: Boolean(problem.monotone),
      sources: problem.sources.map(function (source) {
        return {
          label: source.label,
          position: source.position,
          supply: source.supply
        };
      }),
      targets: problem.targets.map(function (target) {
        return {
          label: target.label,
          position: target.position,
          demand: target.demand
        };
      }),
      costs: problem.costs ? copyMatrix(problem.costs) : undefined
    };
  }

  function normalizeProblem(problem) {
    if (!problem || !Array.isArray(problem.sources) || !Array.isArray(problem.targets)) {
      throw new Error("transport problem needs sources and targets");
    }
    if (!problem.sources.length || !problem.targets.length) {
      throw new Error("transport problem needs at least one source and target");
    }
    var sources = problem.sources.map(function (source, index) {
      var supply = Number(source.supply);
      if (!Number.isFinite(supply) || supply < -EPS) throw new Error("invalid supply at source " + index);
      return {
        label: source.label || "x" + index,
        position: source.position === undefined ? undefined : Number(source.position),
        supply: Math.max(0, supply)
      };
    });
    var targets = problem.targets.map(function (target, index) {
      var demand = Number(target.demand);
      if (!Number.isFinite(demand) || demand < -EPS) throw new Error("invalid demand at target " + index);
      return {
        label: target.label || "y" + index,
        position: target.position === undefined ? undefined : Number(target.position),
        demand: Math.max(0, demand)
      };
    });
    var supplyTotal = sum(sources.map(function (source) { return source.supply; }));
    var demandTotal = sum(targets.map(function (target) { return target.demand; }));
    var balanceScale = Math.max(1, supplyTotal, demandTotal);
    if (Math.abs(supplyTotal - demandTotal) > 1e-8 * balanceScale) {
      throw new Error("unbalanced transport problem");
    }
    var normalized = {
      id: problem.id || "custom",
      title: problem.title || "离散运输问题",
      metric: problem.metric || "absolute",
      monotone: Boolean(problem.monotone),
      sources: sources,
      targets: targets
    };
    if (problem.costs) {
      if (!Array.isArray(problem.costs) || problem.costs.length !== sources.length) {
        throw new Error("cost matrix row count does not match sources");
      }
      normalized.costs = problem.costs.map(function (row, i) {
        if (!Array.isArray(row) || row.length !== targets.length) {
          throw new Error("cost matrix column count does not match targets at row " + i);
        }
        return row.map(function (value, j) {
          var cost = Number(value);
          if (!Number.isFinite(cost)) throw new Error("invalid cost at " + i + "," + j);
          return cost;
        });
      });
    }
    if (!normalized.costs && normalized.metric !== "absolute" && normalized.metric !== "quadratic") {
      throw new Error("unknown metric " + normalized.metric);
    }
    return normalized;
  }

  function buildCostMatrix(problem) {
    if (problem.costs) return copyMatrix(problem.costs);
    return problem.sources.map(function (source) {
      return problem.targets.map(function (target) {
        if (!Number.isFinite(source.position) || !Number.isFinite(target.position)) {
          throw new Error("positions are required when no explicit cost matrix is supplied");
        }
        var distance = source.position - target.position;
        return problem.metric === "quadratic" ? distance * distance : Math.abs(distance);
      });
    });
  }

  function addArc(graph, from, to, capacity, cost, kind) {
    var forward = {
      to: to,
      rev: graph[to].length,
      cap: capacity,
      cost: cost,
      kind: kind || "",
      flow: 0
    };
    var reverse = {
      to: from,
      rev: graph[from].length,
      cap: 0,
      cost: -cost,
      kind: kind ? kind + "-reverse" : "",
      flow: 0
    };
    forward.reverse = reverse;
    reverse.reverse = forward;
    graph[from].push(forward);
    graph[to].push(reverse);
    return forward;
  }

  function shortestPath(graph, start) {
    var distance = new Array(graph.length).fill(Infinity);
    var previous = new Array(graph.length).fill(null);
    distance[start] = 0;
    for (var pass = 0; pass < graph.length - 1; pass += 1) {
      var changed = false;
      for (var from = 0; from < graph.length; from += 1) {
        if (!Number.isFinite(distance[from])) continue;
        graph[from].forEach(function (edge) {
          if (edge.cap <= EPS) return;
          var candidate = distance[from] + edge.cost;
          if (candidate < distance[edge.to] - RELAX_EPS) {
            distance[edge.to] = candidate;
            previous[edge.to] = { from: from, edge: edge };
            changed = true;
          }
        });
      }
      if (!changed) break;
    }
    return { distance: distance, previous: previous };
  }

  function augmentPath(graph, start, finish, previous, amount) {
    var node = finish;
    var path = [];
    while (node !== start) {
      var step = previous[node];
      if (!step) throw new Error("residual network has no augmenting path");
      path.push(step);
      node = step.from;
      if (path.length > graph.length) throw new Error("cyclic predecessor in residual network");
    }
    path.forEach(function (step) {
      step.edge.cap -= amount;
      if (Math.abs(step.edge.cap) < EPS) step.edge.cap = 0;
      step.edge.reverse.cap += amount;
      if (step.edge.kind === "transport") {
        step.edge.flow += amount;
      } else if (step.edge.kind === "transport-reverse") {
        step.edge.reverse.flow -= amount;
      }
    });
    return path;
  }

  /* Successive shortest augmenting paths, with Bellman–Ford for the tiny
   * residual graph.  Forward transport arcs have capacity total+1, so they
   * remain present even when all mass uses one cell; this is useful when the
   * dual certificate is recovered from residual inequalities below. */
  function solvePrimal(problem, costs) {
    var sourceCount = problem.sources.length;
    var targetCount = problem.targets.length;
    var superSource = 0;
    var sourceOffset = 1;
    var targetOffset = sourceOffset + sourceCount;
    var superSink = targetOffset + targetCount;
    var nodeCount = superSink + 1;
    var graph = Array.from({ length: nodeCount }, function () { return []; });
    var total = sum(problem.sources.map(function (source) { return source.supply; }));
    var sourceArcs = [];
    var targetArcs = [];
    var transportArcs = [];
    var i;
    var j;

    for (i = 0; i < sourceCount; i += 1) {
      sourceArcs.push(addArc(graph, superSource, sourceOffset + i, problem.sources[i].supply, 0, "source"));
    }
    for (j = 0; j < targetCount; j += 1) {
      targetArcs.push(addArc(graph, targetOffset + j, superSink, problem.targets[j].demand, 0, "target"));
    }
    for (i = 0; i < sourceCount; i += 1) {
      transportArcs[i] = [];
      for (j = 0; j < targetCount; j += 1) {
        transportArcs[i][j] = addArc(
          graph,
          sourceOffset + i,
          targetOffset + j,
          total + 1,
          costs[i][j],
          "transport"
        );
      }
    }

    var sent = 0;
    var iterations = 0;
    while (sent < total - EPS) {
      var pathInfo = shortestPath(graph, superSource);
      if (!Number.isFinite(pathInfo.distance[superSink])) {
        throw new Error("transport residual network became infeasible");
      }
      var amount = total - sent;
      var node = superSink;
      var pathLength = 0;
      while (node !== superSource) {
        var step = pathInfo.previous[node];
        if (!step) throw new Error("missing augmenting path predecessor");
        amount = Math.min(amount, step.edge.cap);
        node = step.from;
        pathLength += 1;
        if (pathLength > nodeCount) throw new Error("cyclic augmenting path");
      }
      if (!(amount > EPS)) throw new Error("augmenting path has no positive capacity");
      augmentPath(graph, superSource, superSink, pathInfo.previous, amount);
      sent += amount;
      iterations += 1;
      if (iterations > sourceCount * targetCount * 4 + 8) {
        throw new Error("transport solver exceeded deterministic iteration bound");
      }
    }

    var coupling = Array.from({ length: sourceCount }, function () {
      return new Array(targetCount).fill(0);
    });
    for (i = 0; i < sourceCount; i += 1) {
      for (j = 0; j < targetCount; j += 1) {
        coupling[i][j] = Math.abs(transportArcs[i][j].flow) < EPS ? 0 : transportArcs[i][j].flow;
      }
    }
    return { coupling: coupling, iterations: iterations };
  }

  /* If x_ij>0, both i→j and the residual reverse arc j→i are available.
   * Shortest distances d therefore satisfy d_j-d_i≤c_ij and equality on
   * support.  Set φ_i=-d_i, ψ_j=d_j to obtain φ_i+ψ_j≤c_ij. */
  function deriveDual(costs, coupling) {
    var sourceCount = costs.length;
    var targetCount = costs[0].length;
    var nodeCount = sourceCount + targetCount;
    var arcs = Array.from({ length: nodeCount }, function () { return []; });
    var i;
    var j;
    for (i = 0; i < sourceCount; i += 1) {
      for (j = 0; j < targetCount; j += 1) {
        arcs[i].push({ to: sourceCount + j, cost: costs[i][j] });
        if (coupling[i][j] > EPS) {
          arcs[sourceCount + j].push({ to: i, cost: -costs[i][j] });
        }
      }
    }
    var distance = new Array(nodeCount).fill(0);
    for (var pass = 0; pass < nodeCount - 1; pass += 1) {
      var changed = false;
      for (i = 0; i < nodeCount; i += 1) {
        arcs[i].forEach(function (arc) {
          var candidate = distance[i] + arc.cost;
          if (candidate < distance[arc.to] - RELAX_EPS) {
            distance[arc.to] = candidate;
            changed = true;
          }
        });
      }
      if (!changed) break;
    }
    for (i = 0; i < nodeCount; i += 1) {
      for (j = 0; j < arcs[i].length; j += 1) {
        var edge = arcs[i][j];
        if (distance[i] + edge.cost < distance[edge.to] - RELAX_EPS) {
          throw new Error("negative residual cycle: primal plan is not optimal");
        }
      }
    }
    return {
      phi: distance.slice(0, sourceCount).map(function (value) { return -value; }),
      psi: distance.slice(sourceCount)
    };
  }

  function maxAbs(values) {
    return values.reduce(function (maximum, value) {
      return Math.max(maximum, Math.abs(value));
    }, 0);
  }

  function checkMonotone(coupling) {
    var used = [];
    coupling.forEach(function (row, i) {
      row.forEach(function (mass, j) {
        if (mass > EPS) used.push({ i: i, j: j });
      });
    });
    for (var a = 0; a < used.length; a += 1) {
      for (var b = a + 1; b < used.length; b += 1) {
        if (used[a].i < used[b].i && used[a].j > used[b].j) return false;
        if (used[b].i < used[a].i && used[b].j > used[a].j) return false;
      }
    }
    return true;
  }

  function checkInvariants(result, tolerance) {
    var tol = tolerance === undefined ? 1e-7 : tolerance;
    var rowResiduals = result.coupling.map(function (row, i) {
      return sum(row) - result.sources[i].supply;
    });
    var columnResiduals = result.targets.map(function (target, j) {
      return sum(result.coupling.map(function (row) { return row[j]; })) - target.demand;
    });
    var minSlack = Infinity;
    var complementaryResidual = 0;
    result.reducedSlack.forEach(function (row, i) {
      row.forEach(function (slack, j) {
        minSlack = Math.min(minSlack, slack);
        complementaryResidual = Math.max(
          complementaryResidual,
          Math.abs(result.coupling[i][j] * slack)
        );
      });
    });
    var gapScale = Math.max(1, Math.abs(result.primalCost), Math.abs(result.dualObjective));
    var checks = {
      supplyResidual: maxAbs(rowResiduals),
      demandResidual: maxAbs(columnResiduals),
      dualViolation: Math.max(0, -minSlack),
      complementaryResidual: complementaryResidual,
      gapAbs: Math.abs(result.primalDualGap),
      monotone: !result.monotoneExpected || checkMonotone(result.coupling)
    };
    checks.primalFeasible = checks.supplyResidual <= tol && checks.demandResidual <= tol;
    checks.dualFeasible = checks.dualViolation <= tol;
    checks.complementarySlackness = checks.complementaryResidual <= tol;
    checks.strongDuality = checks.gapAbs <= tol * gapScale * 10;
    checks.ok = checks.primalFeasible && checks.dualFeasible &&
      checks.complementarySlackness && checks.strongDuality && checks.monotone;
    return checks;
  }

  function assertInvariants(result, tolerance) {
    var checks = checkInvariants(result, tolerance);
    if (!checks.ok) {
      throw new Error(
        "transport invariant failed: " +
        JSON.stringify(checks)
      );
    }
    return checks;
  }

  function solveTransport(problem, gauge) {
    var normalized = normalizeProblem(problem);
    var costs = buildCostMatrix(normalized);
    var primal = solvePrimal(normalized, costs);
    var baseDual = deriveDual(costs, primal.coupling);
    var shift = Number.isFinite(Number(gauge)) ? Number(gauge) : 0;
    var phi = baseDual.phi.map(function (value) { return value + shift; });
    var psi = baseDual.psi.map(function (value) { return value - shift; });
    var reducedSlack = costs.map(function (row, i) {
      return row.map(function (cost, j) {
        var slack = cost - phi[i] - psi[j];
        return Math.abs(slack) < 5e-10 ? 0 : slack;
      });
    });
    var primalCost = 0;
    var transportEdges = [];
    var i;
    var j;
    for (i = 0; i < normalized.sources.length; i += 1) {
      for (j = 0; j < normalized.targets.length; j += 1) {
        var mass = primal.coupling[i][j];
        primalCost += mass * costs[i][j];
        transportEdges.push({
          source: i,
          target: j,
          mass: mass,
          cost: costs[i][j],
          contribution: mass * costs[i][j],
          slack: reducedSlack[i][j],
          tight: Math.abs(reducedSlack[i][j]) <= 1e-7
        });
      }
    }
    var dualObjective = sum(normalized.sources.map(function (source, index) {
      return source.supply * phi[index];
    })) + sum(normalized.targets.map(function (target, index) {
      return target.demand * psi[index];
    }));
    var result = {
      problemId: normalized.id,
      title: normalized.title,
      metric: normalized.metric,
      sources: normalized.sources,
      targets: normalized.targets,
      costs: costs,
      coupling: primal.coupling,
      transportEdges: transportEdges,
      iterations: primal.iterations,
      primalCost: primalCost,
      basePhi: baseDual.phi,
      basePsi: baseDual.psi,
      gauge: shift,
      phi: phi,
      psi: psi,
      reducedSlack: reducedSlack,
      dualObjective: dualObjective,
      primalDualGap: primalCost - dualObjective,
      monotoneExpected: normalized.monotone
    };
    result.splitSources = result.sources.map(function (source, sourceIndex) {
      return {
        index: sourceIndex,
        mass: result.coupling[sourceIndex].filter(function (mass) { return mass > EPS; }).reduce(function (a, b) { return a + b; }, 0),
        pieces: result.coupling[sourceIndex].filter(function (mass) { return mass > EPS; }).length
      };
    });
    result.splitTargets = result.targets.map(function (target, targetIndex) {
      var pieces = result.coupling.filter(function (row) { return row[targetIndex] > EPS; }).length;
      return { index: targetIndex, mass: target.demand, pieces: pieces };
    });
    result.invariants = checkInvariants(result);
    assertInvariants(result);
    return result;
  }

  function presetById(id) {
    return PRESETS.reduce(function (found, preset) {
      return found || (preset.id === id ? preset : null);
    }, null) || PRESETS[0];
  }

  function buildData(id, gauge) {
    var preset = typeof id === "string" ? presetById(id) : null;
    var problem = preset ? preset.problem : id;
    return solveTransport(problem, gauge);
  }

  function svgText(api, x, y, text, attrs) {
    var merged = {
      x: x,
      y: y,
      "font-size": "12",
      "text-anchor": "middle",
      fill: "currentColor"
    };
    Object.keys(attrs || {}).forEach(function (key) { merged[key] = attrs[key]; });
    return makeSvg(api, "text", merged, [text]);
  }

  function metric(api, label, value, note) {
    return makeElement(api, "div", { className: "td-metric" }, [
      makeElement(api, "span", {}, [label]),
      makeElement(api, "strong", {}, [value]),
      note ? makeElement(api, "small", {}, [note]) : null
    ]);
  }

  function renderTransportScene(api, data, uid) {
    var width = 760;
    var height = Math.max(255, 80 + Math.max(data.sources.length, data.targets.length) * 76);
    var leftX = 152;
    var rightX = 608;
    var top = 62;
    var bottom = height - 42;
    var sourceY = function (index) {
      return data.sources.length === 1
        ? (top + bottom) / 2
        : top + index / (data.sources.length - 1) * (bottom - top);
    };
    var targetY = function (index) {
      return data.targets.length === 1
        ? (top + bottom) / 2
        : top + index / (data.targets.length - 1) * (bottom - top);
    };
    var maxMass = Math.max.apply(null, data.coupling.reduce(function (all, row) { return all.concat(row); }, [0]));
    var titleId = uid + "-scene-title";
    var descId = uid + "-scene-desc";
    var svg = makeSvg(api, "svg", {
      className: "td-svg",
      viewBox: "0 0 " + width + " " + height,
      role: "img",
      focusable: "false",
      "aria-labelledby": titleId + " " + descId
    });
    svg.appendChild(makeSvg(api, "title", { id: titleId }, ["供给到需求的离散运输网络"]));
    svg.appendChild(makeSvg(api, "desc", { id: descId }, [
      "左侧节点是供给，右侧节点是需求；蓝色线宽表示耦合质量，虚线是未使用的可行运输边。"
    ]));
    svg.appendChild(makeSvg(api, "rect", {
      x: 12,
      y: 12,
      width: width - 24,
      height: height - 24,
      className: "td-panel"
    }));
    svg.appendChild(svgText(api, leftX, 32, "供给 xᵢ（行边缘）", { className: "td-axis-label" }));
    svg.appendChild(svgText(api, rightX, 32, "需求 yⱼ（列边缘）", { className: "td-axis-label" }));

    for (var i = 0; i < data.sources.length; i += 1) {
      for (var j = 0; j < data.targets.length; j += 1) {
        var mass = data.coupling[i][j];
        var y1 = sourceY(i);
        var y2 = targetY(j);
        svg.appendChild(makeSvg(api, "line", {
          x1: leftX + 29,
          y1: y1,
          x2: rightX - 29,
          y2: y2,
          className: mass > EPS ? "td-edge-used" : "td-edge-unused",
          "stroke-width": mass > EPS ? String(2.4 + 8 * mass / Math.max(maxMass, EPS)) : "1.2"
        }));
        if (mass > EPS) {
          var labelX = (leftX + rightX) / 2;
          var labelY = (y1 + y2) / 2 - 5;
          svg.appendChild(svgText(api, labelX, labelY, "π=" + formatNumber(api, mass, 3), {
            className: "td-edge-label"
          }));
        }
      }
    }
    for (i = 0; i < data.sources.length; i += 1) {
      var sourceYValue = sourceY(i);
      svg.appendChild(makeSvg(api, "rect", {
        x: leftX - 29,
        y: sourceYValue - 23,
        width: 58,
        height: 46,
        rx: 6,
        className: "td-node-source"
      }));
      svg.appendChild(svgText(api, leftX, sourceYValue - 3, data.sources[i].label, { className: "td-node-label" }));
      svg.appendChild(svgText(api, leftX, sourceYValue + 14, "a=" + formatNumber(api, data.sources[i].supply, 3), {
        className: "td-axis-label"
      }));
    }
    for (j = 0; j < data.targets.length; j += 1) {
      var targetYValue = targetY(j);
      svg.appendChild(makeSvg(api, "rect", {
        x: rightX - 29,
        y: targetYValue - 23,
        width: 58,
        height: 46,
        rx: 6,
        className: "td-node-target"
      }));
      svg.appendChild(svgText(api, rightX, targetYValue - 3, data.targets[j].label, { className: "td-node-label" }));
      svg.appendChild(svgText(api, rightX, targetYValue + 14, "b=" + formatNumber(api, data.targets[j].demand, 3), {
        className: "td-axis-label"
      }));
    }
    return svg;
  }

  function renderCouplingTable(api, data) {
    var table = makeElement(api, "table", { className: "td-table td-matrix" });
    var headerCells = [makeElement(api, "th", { scope: "col" }, ["供给 / 耦合 πᵢⱼ"])];
    data.targets.forEach(function (target) {
      headerCells.push(makeElement(api, "th", { scope: "col" }, [
        target.label + "，b=" + formatNumber(api, target.demand, 3)
      ]));
    });
    headerCells.push(makeElement(api, "th", { scope: "col" }, ["行和"]));
    table.appendChild(makeElement(api, "caption", {}, ["最优耦合矩阵：每个单元格同时是从 xᵢ 到 yⱼ 的运输边质量。"]));
    table.appendChild(makeElement(api, "thead", {}, [makeElement(api, "tr", {}, headerCells)]));
    var body = makeElement(api, "tbody");
    data.sources.forEach(function (source, i) {
      var cells = [makeElement(api, "th", { scope: "row" }, [
        source.label + "，a=" + formatNumber(api, source.supply, 3)
      ])];
      data.targets.forEach(function (target, j) {
        cells.push(makeElement(api, "td", {
          className: data.coupling[i][j] > EPS ? "td-flow-cell" : ""
        }, [formatNumber(api, data.coupling[i][j], 3)]));
      });
      cells.push(makeElement(api, "td", {}, [formatNumber(api, sum(data.coupling[i]), 3)]));
      body.appendChild(makeElement(api, "tr", {}, cells));
    });
    var demandCells = [makeElement(api, "th", { scope: "row" }, ["列和 / 需求"])];
    data.targets.forEach(function (target, j) {
      demandCells.push(makeElement(api, "td", {}, [formatNumber(api, sum(data.coupling.map(function (row) { return row[j]; })), 3)]));
    });
    demandCells.push(makeElement(api, "td", {}, [formatNumber(api, sum(data.coupling.reduce(function (all, row) { return all.concat(row); }, [])), 3)]));
    body.appendChild(makeElement(api, "tr", {}, demandCells));
    table.appendChild(body);
    return table;
  }

  function renderPotentialTable(api, data) {
    var table = makeElement(api, "table", { className: "td-table" });
    table.appendChild(makeElement(api, "caption", {}, [
      "当前对偶证书（平移规范 t=" + formatNumber(api, data.gauge, 2) + "）：φᵢ+t 与 ψⱼ−t 是同一证书族。"
    ]));
    table.appendChild(makeElement(api, "thead", {}, [makeElement(api, "tr", {}, [
      makeElement(api, "th", { scope: "col" }, ["节点"]),
      makeElement(api, "th", { scope: "col" }, ["边缘质量"]),
      makeElement(api, "th", { scope: "col" }, ["势"]),
      makeElement(api, "th", { scope: "col" }, ["角色"])
    ])]));
    var body = makeElement(api, "tbody");
    data.sources.forEach(function (source, i) {
      body.appendChild(makeElement(api, "tr", {}, [
        makeElement(api, "th", { scope: "row" }, [source.label]),
        makeElement(api, "td", {}, ["a=" + formatNumber(api, source.supply, 3)]),
        makeElement(api, "td", { className: "td-dual-cell" }, [formatNumber(api, data.phi[i], 4)]),
        makeElement(api, "td", {}, ["φᵢ（供给势）"])
      ]));
    });
    data.targets.forEach(function (target, j) {
      body.appendChild(makeElement(api, "tr", {}, [
        makeElement(api, "th", { scope: "row" }, [target.label]),
        makeElement(api, "td", {}, ["b=" + formatNumber(api, target.demand, 3)]),
        makeElement(api, "td", { className: "td-dual-cell" }, [formatNumber(api, data.psi[j], 4)]),
        makeElement(api, "td", {}, ["ψⱼ（需求势）"])
      ]));
    });
    table.appendChild(body);
    return table;
  }

  function renderEdgeLedger(api, data) {
    var table = makeElement(api, "table", { className: "td-table" });
    table.appendChild(makeElement(api, "caption", {}, [
      "逐边账本：sᵢⱼ=cᵢⱼ−φᵢ−ψⱼ 是 reduced slack；正运输边应当紧。"
    ]));
    table.appendChild(makeElement(api, "thead", {}, [makeElement(api, "tr", {}, [
      makeElement(api, "th", { scope: "col" }, ["边 xᵢ→yⱼ"]),
      makeElement(api, "th", { scope: "col" }, ["成本 cᵢⱼ"]),
      makeElement(api, "th", { scope: "col" }, ["质量 πᵢⱼ"]),
      makeElement(api, "th", { scope: "col" }, ["φᵢ+ψⱼ"]),
      makeElement(api, "th", { scope: "col" }, ["reduced slack sᵢⱼ"]),
      makeElement(api, "th", { scope: "col" }, ["πᵢⱼsᵢⱼ"]),
      makeElement(api, "th", { scope: "col" }, ["状态"])
    ])]));
    var body = makeElement(api, "tbody");
    data.transportEdges.forEach(function (edge) {
      var used = edge.mass > EPS;
      body.appendChild(makeElement(api, "tr", { className: used ? "td-used" : "" }, [
        makeElement(api, "th", { scope: "row" }, [data.sources[edge.source].label + "→" + data.targets[edge.target].label]),
        makeElement(api, "td", {}, [formatNumber(api, edge.cost, 4)]),
        makeElement(api, "td", { className: used ? "td-flow-cell" : "" }, [formatNumber(api, edge.mass, 4)]),
        makeElement(api, "td", {}, [formatNumber(api, data.phi[edge.source] + data.psi[edge.target], 4)]),
        makeElement(api, "td", { className: "td-slack-cell" }, [formatNumber(api, edge.slack, 4)]),
        makeElement(api, "td", {}, [formatNumber(api, edge.mass * edge.slack, 5)]),
        makeElement(api, "td", {}, [used ? "运输边 / 紧" : (edge.tight ? "未用但紧" : "未用 / 松")])
      ]));
    });
    table.appendChild(body);
    return table;
  }

  function renderMetrics(api, data) {
    var checks = data.invariants;
    var splitText = data.splitSources.filter(function (item) { return item.pieces > 1; }).map(function (item) {
      return data.sources[item.index].label + " 拆成 " + item.pieces + " 段";
    });
    return makeElement(api, "div", { className: "td-metrics" }, [
      metric(api, "原始成本 C(π)", formatNumber(api, data.primalCost, 5), "min transport cost"),
      metric(api, "对偶收入 D(φ,ψ)", formatNumber(api, data.dualObjective, 5), "feasible certificate"),
      metric(api, "primal–dual gap", formatNumber(api, data.primalDualGap, 7), "C−D，应为 0"),
      metric(api, "最大 reduced slack 违背", formatNumber(api, checks.dualViolation, 7), "应 ≤ 0（实际为 0 违背）"),
      metric(api, "互补松弛 max|πs|", formatNumber(api, checks.complementaryResidual, 7), "应为 0"),
      metric(api, "供给/需求残差", formatNumber(api, Math.max(checks.supplyResidual, checks.demandResidual), 7), "边缘约束"),
      metric(api, "拆分质量", splitText.length ? splitText.join("；") : "本例无行拆分", "Kantorovich 允许 πᵢⱼ 分散"),
      metric(api, "单调性", data.monotoneExpected ? (checks.monotone ? "通过：无交叉边" : "失败") : "本预设未要求", "一维凸成本预设")
    ]);
  }

  function renderChecks(api, data) {
    var checks = data.invariants;
    function item(ok, label, detail) {
      return makeElement(api, "li", {}, [
        makeElement(api, "span", { className: "td-check-mark " + (ok ? "td-pass" : "td-fail"), "aria-hidden": "true" }, [ok ? "✓" : "×"]),
        makeElement(api, "span", {}, [label + "：" + detail])
      ]);
    }
    return makeElement(api, "ul", { className: "td-checklist" }, [
      item(checks.primalFeasible, "primal 可行", "行和/列和残差 ≤ " + formatNumber(api, Math.max(checks.supplyResidual, checks.demandResidual), 7)),
      item(checks.dualFeasible, "dual 可行", "max(φᵢ+ψⱼ−cᵢⱼ) = " + formatNumber(api, checks.dualViolation, 7)),
      item(checks.complementarySlackness, "互补松弛", "max|πᵢⱼsᵢⱼ| = " + formatNumber(api, checks.complementaryResidual, 7)),
      item(checks.strongDuality, "强对偶账平", "C−D = " + formatNumber(api, data.primalDualGap, 7)),
      item(checks.monotone, "单调方案", data.monotoneExpected ? "运输边不交叉" : "本预设是 LP 对照，不强加一维顺序")
    ]);
  }

  function presetText(id) {
    return presetById(id).description;
  }

  var pureModel = {
    EPS: EPS,
    presets: PRESETS,
    normalizeProblem: normalizeProblem,
    buildCostMatrix: function (problem) { return buildCostMatrix(normalizeProblem(problem)); },
    solveTransport: solveTransport,
    buildData: buildData,
    checkInvariants: checkInvariants,
    assertInvariants: assertInvariants
  };

  if (typeof module === "object" && module.exports) {
    module.exports = pureModel;
    return;
  }

  if (!host || !host.CourseLearning || typeof host.CourseLearning.register !== "function") return;

  host.CourseLearning.register("transport-duality", function (root, api) {
    if (!root || typeof document === "undefined") return;
    installStyles();
    root.classList.add("td-lab");
    var uid = "cl-td-" + (INSTANCE += 1);
    var state = { presetId: "split", gauge: 0 };
    var refs = {};
    var presetButtons = [];

    var heading = makeElement(api, "h3", {}, ["运输账本：最小计划如何对上最大证书"]);
    var intro = makeElement(api, "p", { className: "td-intro" }, [
      "实验固定一个小型离散运输问题。蓝色网络边是原始耦合 π，绿色势 φ、ψ 是对偶报价；每条边都要满足 φᵢ+ψⱼ≤cᵢⱼ，而真正承载质量的边还应把这个不等式顶到等号。"
    ]);
    var prompt = makeElement(api, "div", { className: "td-prompt" }, [
      "先预测再点击：一处供给 a=1、两处需求各 b=1/2 时，Monge 映射能否完成？若允许拆分，哪两条运输边会出现？对偶势整体加 t、需求势整体减 t 后，成本账会改变吗？"
    ]);

    var presetBox = makeElement(api, "fieldset", { className: "td-preset-box" });
    presetBox.appendChild(makeElement(api, "legend", {}, ["教学预设（每个都重新求一个确定性最优解）"]));
    var presetRow = makeElement(api, "div", { className: "td-preset-row" });
    PRESETS.forEach(function (preset) {
      var button = makeElement(api, "button", {
        type: "button",
        text: preset.label,
        "aria-pressed": "false"
      });
      button.addEventListener("click", function () {
        state.presetId = preset.id;
        render();
        if (api && typeof api.announce === "function") api.announce(root, "已切换到" + preset.label + "。" + preset.description);
      });
      presetButtons.push({ id: preset.id, button: button });
      presetRow.appendChild(button);
    });
    presetBox.appendChild(presetRow);

    var gaugeId = uid + "-gauge";
    var gaugeOutput = makeElement(api, "output", { id: gaugeId + "-output", htmlFor: gaugeId }, [""]);
    var gaugeLabel = makeElement(api, "label", { htmlFor: gaugeId }, [
      "平移规范 t = ", gaugeOutput
    ]);
    var gaugeInput = makeElement(api, "input", {
      id: gaugeId,
      type: "range",
      min: "-2",
      max: "2",
      step: "0.1",
      value: "0",
      "aria-label": "对偶势平移规范 t"
    });
    gaugeInput.addEventListener("input", function () {
      state.gauge = Number(gaugeInput.value);
      render();
    });
    refs.gauge = gaugeInput;
    refs.gaugeOutput = gaugeOutput;
    var controls = makeElement(api, "div", { className: "td-controls" }, [
      makeElement(api, "div", { className: "td-control" }, [gaugeLabel, gaugeInput]),
      makeElement(api, "p", { className: "td-note" }, [
        "规范只改表示：φᵢ↦φᵢ+t、ψⱼ↦ψⱼ−t。约束、每个 reduced slack、对偶目标和 gap 都不变；因此实验展示的是一族证书，不宣称某个势唯一。"
      ])
    ]);
    var resetButton = makeElement(api, "button", { type: "button", className: "td-primary", text: "重置到拆分预设" });
    resetButton.addEventListener("click", function () {
      state.presetId = "split";
      state.gauge = 0;
      render();
      if (api && typeof api.announce === "function") api.announce(root, "已重置到拆分预设。");
    });
    controls.appendChild(makeElement(api, "div", { className: "td-button-row" }, [resetButton]));

    var status = makeElement(api, "p", { className: "td-status", "aria-live": "polite" }, [""]);
    var sceneHost = makeElement(api, "div");
    var matrixHost = makeElement(api, "div", { className: "td-table-wrap" });
    var potentialHost = makeElement(api, "div", { className: "td-table-wrap" });
    var edgeHost = makeElement(api, "div", { className: "td-table-wrap" });
    var metricsHost = makeElement(api, "div");
    var checksHost = makeElement(api, "div");
    var formulaHost = makeElement(api, "div");
    var legend = makeElement(api, "div", { className: "td-legend" }, [
      makeElement(api, "span", { className: "td-legend-item" }, [
        makeElement(api, "span", { className: "td-swatch td-swatch-flow", "aria-hidden": "true" }), "正运输边：线宽∝πᵢⱼ"
      ]),
      makeElement(api, "span", { className: "td-legend-item" }, [
        makeElement(api, "span", { className: "td-swatch td-swatch-unused", "aria-hidden": "true" }), "可行但未使用的边"
      ]),
      makeElement(api, "span", { className: "td-legend-item" }, [
        makeElement(api, "span", { className: "td-swatch td-swatch-dual", "aria-hidden": "true" }), "对偶势与可行性"
      ])
    ]);
    var stage = makeElement(api, "div", { className: "td-stage" }, [
      makeElement(api, "div", { className: "td-stage-frame" }, [
        makeElement(api, "div", { className: "td-stage-title" }, [
          makeElement(api, "span", {}, ["原始计划 ↔ 对偶证书"]),
          makeElement(api, "span", {}, ["确定性残差账本"])
        ]),
        status,
        sceneHost,
        legend,
        metricsHost,
        makeElement(api, "h4", { className: "td-subtitle" }, ["最优耦合与供需边缘"]),
        matrixHost,
        makeElement(api, "h4", { className: "td-subtitle" }, ["对偶势（不是唯一代表）"]),
        potentialHost,
        makeElement(api, "h4", { className: "td-subtitle" }, ["逐条运输边：成本、reduced slack、互补松弛"]),
        edgeHost,
        makeElement(api, "h4", { className: "td-subtitle" }, ["可检查不变量"]),
        checksHost,
        formulaHost,
        makeElement(api, "p", { className: "td-footnote" }, [
          "判读顺序：先看行和/列和确认 primal 可行；再看所有 sᵢⱼ≥0 确认 dual 可行；最后看正质量边上的 s≈0 与 C−D≈0。强对偶把两本账合成同一个最优值，但不保证原始计划或对偶势各自唯一。"
        ])
      ])
    ]);
    var layout = makeElement(api, "div", { className: "td-layout" }, [controls, stage]);
    replaceChildren(root, [heading, intro, prompt, presetBox, layout]);

    function syncControls() {
      refs.gauge.value = String(state.gauge);
      refs.gaugeOutput.textContent = formatNumber(api, state.gauge, 1);
      presetButtons.forEach(function (item) {
        item.button.setAttribute("aria-pressed", item.id === state.presetId ? "true" : "false");
      });
    }

    function render() {
      state.gauge = Math.round(clamp(Number(state.gauge), -2, 2) * 10) / 10;
      var data = buildData(state.presetId, state.gauge);
      var preset = presetById(state.presetId);
      status.textContent = preset.problem.title + "；" + presetText(state.presetId) +
        " 当前 C=" + formatNumber(api, data.primalCost, 5) +
        "，D=" + formatNumber(api, data.dualObjective, 5) +
        "，gap=" + formatNumber(api, data.primalDualGap, 7) + "。";
      replaceChildren(sceneHost, renderTransportScene(api, data, uid));
      replaceChildren(metricsHost, renderMetrics(api, data));
      replaceChildren(matrixHost, renderCouplingTable(api, data));
      replaceChildren(potentialHost, renderPotentialTable(api, data));
      replaceChildren(edgeHost, renderEdgeLedger(api, data));
      replaceChildren(checksHost, renderChecks(api, data));
      replaceChildren(formulaHost, makeElement(api, "div", { className: "td-formula" }, [
        "C(π)=Σᵢⱼ cᵢⱼπᵢⱼ = " + formatNumber(api, data.primalCost, 6) +
        "；D(φ,ψ)=Σᵢaᵢφᵢ+Σⱼbⱼψⱼ = " + formatNumber(api, data.dualObjective, 6) +
        "；sᵢⱼ=cᵢⱼ−φᵢ−ψⱼ；C−D=" + formatNumber(api, data.primalDualGap, 8)
      ]));
      syncControls();
    }

    syncControls();
    render();
  });
})(typeof window !== "undefined" ? window : null);
