(function () {
  "use strict";

  if (
    typeof window === "undefined" ||
    !window.CourseLearning ||
    typeof window.CourseLearning.register !== "function"
  ) {
    return;
  }

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-reasoning-budget-styles";
  var INSTANCE_COUNT = 0;
  var TASK_COUNT = 1000;
  var MAX_N = 9;
  var SEED = 0x51eeda7;
  var DEFAULTS = {
    family: "mixed",
    n: 5,
    aggregator: "verifier",
    verifier: "high",
    stopping: "accept",
    adaptive: false
  };

  /* Fixed toy ledger: these are teaching parameters, not model measurements. */
  var FAMILIES = [
    { id: "easy", label: "Easy", weight: 0.4, count: 400, p: 0.78, rho: 0.05, tokens: 500, latency: 0.45 },
    { id: "medium", label: "Medium", weight: 0.4, count: 400, p: 0.58, rho: 0.25, tokens: 850, latency: 0.8 },
    { id: "hard", label: "Hard", weight: 0.2, count: 200, p: 0.38, rho: 0.55, tokens: 1300, latency: 1.35 }
  ];

  var VERIFIERS = {
    high: { label: "高质量 verifier", tpr: 0.9, fpr: 0.1 },
    borderline: { label: "临界 verifier", tpr: 0.65, fpr: 0.3 },
    weak: { label: "弱 verifier", tpr: 0.48, fpr: 0.42 }
  };

  var FAMILY_LOOKUP = Object.create(null);
  FAMILIES.forEach(function (family) {
    FAMILY_LOOKUP[family.id] = family;
  });

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function formatNumber(value, digits) {
    if (!finite(value)) return "—";
    var places = digits === undefined ? 2 : digits;
    var text = value.toFixed(places);
    text = text.replace(/0+$/, "").replace(/\.$/, "");
    return text === "-0" ? "0" : text;
  }

  function formatPercent(value, digits) {
    return finite(value) ? formatNumber(value * 100, digits === undefined ? 1 : digits) + "%" : "—";
  }

  function formatInterval(interval) {
    return formatPercent(interval.low) + "–" + formatPercent(interval.high);
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

  function appendChildren(node, children) {
    if (children === undefined || children === null) return node;
    var list = Array.isArray(children) ? children : [children];
    list.forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : document.createTextNode(String(child)));
    });
    return node;
  }

  function element(api, tag, attrs, children) {
    if (api && typeof api.el === "function") return api.el(tag, attrs || {}, children);
    return appendChildren(setAttributes(document.createElement(tag), attrs || {}), children);
  }

  function svgElement(api, tag, attrs, children) {
    if (api && typeof api.svg === "function") return api.svg(tag, attrs || {}, children);
    return appendChildren(setAttributes(document.createElementNS(SVG_NS, tag), attrs || {}), children);
  }

  function clear(node) {
    if (node && typeof node.replaceChildren === "function") node.replaceChildren();
    else if (node) while (node.firstChild) node.removeChild(node.firstChild);
  }

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      ".cl-reasoning-budget { --rb-bg: var(--bg, #fffdf8); --rb-panel: var(--block-bg, #f4f1e9); --rb-fg: var(--fg, #2e2b25); --rb-soft: var(--fg-soft, #70695e); --rb-border: var(--border, #d8d0c1); --rb-accent: var(--accent, #8a5a2b); --rb-blue: #326e9f; --rb-green: #39734d; --rb-gold: #9b6a12; --rb-red: #b64335; margin: 1.5rem 0 2rem; color: var(--rb-fg); font-size: .93rem; line-height: 1.5; }",
      "html[data-theme=\"dark\"] .cl-reasoning-budget { --rb-bg: var(--bg, #242424); --rb-panel: var(--block-bg, #303030); --rb-fg: var(--fg, #eee9df); --rb-soft: var(--fg-soft, #b8b2a7); --rb-border: var(--border, #55504a); --rb-blue: #83c8ff; --rb-green: #72bd8b; --rb-gold: #e2b458; --rb-red: #f08c7d; }",
      ".cl-reasoning-budget *, .cl-reasoning-budget *::before, .cl-reasoning-budget *::after { box-sizing: border-box; }",
      ".cl-reasoning-budget .rb-shell { overflow: hidden; border: 1px solid var(--rb-border); border-radius: 8px; background: var(--rb-bg); }",
      ".cl-reasoning-budget .rb-header { padding: 1.1rem 1.25rem .95rem; border-bottom: 1px solid var(--rb-border); background: var(--rb-panel); }",
      ".cl-reasoning-budget .rb-kicker { margin: 0 0 .25rem; color: var(--rb-accent); font-size: .75rem; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }",
      ".cl-reasoning-budget h3, .cl-reasoning-budget h4 { color: var(--rb-fg); }",
      ".cl-reasoning-budget .rb-header h3 { margin: 0; font-size: 1.2rem; }",
      ".cl-reasoning-budget .rb-header p { margin: .4rem 0 0; color: var(--rb-soft); }",
      ".cl-reasoning-budget .rb-controls { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .75rem; padding: .9rem 1.1rem; border-bottom: 1px solid var(--rb-border); background: var(--rb-panel); }",
      ".cl-reasoning-budget .rb-fieldset { min-width: 0; margin: 0; padding: .65rem .7rem .7rem; border: 1px solid var(--rb-border); border-radius: 6px; }",
      ".cl-reasoning-budget .rb-fieldset legend { padding: 0 .25rem; color: var(--rb-soft); font-size: .78rem; font-weight: 800; }",
      ".cl-reasoning-budget label, .cl-reasoning-budget .rb-label { color: var(--rb-soft); font-size: .82rem; font-weight: 700; }",
      ".cl-reasoning-budget select { width: 100%; min-height: 44px; margin-top: .3rem; padding: .45rem .6rem; border: 1px solid var(--rb-border); border-radius: 6px; background: var(--rb-bg); color: var(--rb-fg); font: inherit; }",
      ".cl-reasoning-budget input[type=\"range\"] { display: block; width: 100%; min-height: 44px; margin: .1rem 0 0; accent-color: var(--rb-accent); }",
      ".cl-reasoning-budget .rb-control-head { display: flex; align-items: baseline; justify-content: space-between; gap: .6rem; }",
      ".cl-reasoning-budget output { color: var(--rb-accent); font-variant-numeric: tabular-nums; font-weight: 800; text-align: right; }",
      ".cl-reasoning-budget .rb-scale { display: flex; justify-content: space-between; gap: .5rem; color: var(--rb-soft); font-size: .72rem; }",
      ".cl-reasoning-budget .rb-note { margin: .45rem 0 0; color: var(--rb-soft); font-size: .72rem; line-height: 1.45; }",
      ".cl-reasoning-budget .rb-note { margin: .5rem 0 0; color: var(--rb-soft); font-size: .74rem; line-height: 1.45; }",
      ".cl-reasoning-budget .rb-button-row { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: .7rem; padding: 0 1.1rem .85rem; background: var(--rb-panel); }",
      ".cl-reasoning-budget button { min-width: 0; min-height: 44px; padding: .5rem .72rem; border: 1px solid var(--rb-border); border-radius: 6px; background: var(--rb-bg); color: var(--rb-fg); cursor: pointer; font: inherit; font-size: .84rem; font-weight: 750; }",
      ".cl-reasoning-budget button:hover { border-color: var(--rb-accent); }",
      ".cl-reasoning-budget button[aria-pressed=\"true\"], .cl-reasoning-budget button.rb-primary { border-color: var(--rb-accent); background: var(--rb-accent); color: var(--rb-bg); }",
      ".cl-reasoning-budget button:disabled { cursor: not-allowed; opacity: .52; }",
      ".cl-reasoning-budget button:focus-visible, .cl-reasoning-budget select:focus-visible, .cl-reasoning-budget input:focus-visible { outline: 3px solid var(--cl-focus, #1769aa); outline-offset: 2px; }",
      ".cl-reasoning-budget .rb-main { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(280px, .95fr); gap: 1rem; align-items: start; padding: 1rem 1.1rem 1.1rem; }",
      ".cl-reasoning-budget .rb-card { min-width: 0; padding: .82rem; border: 1px solid var(--rb-border); border-radius: 6px; background: var(--rb-panel); }",
      ".cl-reasoning-budget .rb-card + .rb-card { margin-top: .75rem; }",
      ".cl-reasoning-budget .rb-card-title { display: flex; align-items: baseline; justify-content: space-between; gap: .55rem; margin: 0 0 .55rem; color: var(--rb-soft); font-size: .8rem; font-weight: 800; }",
      ".cl-reasoning-budget .rb-status { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem .7rem; margin-bottom: .75rem; padding: .65rem .75rem; border: 1px solid var(--rb-border); border-radius: 6px; background: var(--rb-bg); }",
      ".cl-reasoning-budget .rb-badge { display: inline-flex; align-items: center; min-height: 30px; padding: .2rem .55rem; border-radius: 99px; background: var(--rb-accent); color: var(--rb-bg); font-size: .76rem; font-weight: 850; }",
      ".cl-reasoning-budget .rb-badge.rb-good { background: var(--rb-green); }",
      ".cl-reasoning-budget .rb-badge.rb-warn { background: var(--rb-red); }",
      ".cl-reasoning-budget .rb-status-copy { min-width: 0; color: var(--rb-soft); font-size: .78rem; overflow-wrap: anywhere; }",
      ".cl-reasoning-budget .rb-metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .5rem; }",
      ".cl-reasoning-budget .rb-metric { min-width: 0; padding: .55rem .6rem; border-top: 2px solid var(--rb-border); background: var(--rb-bg); }",
      ".cl-reasoning-budget .rb-metric:nth-child(1) { border-top-color: var(--rb-blue); }",
      ".cl-reasoning-budget .rb-metric:nth-child(2) { border-top-color: var(--rb-green); }",
      ".cl-reasoning-budget .rb-metric:nth-child(3) { border-top-color: var(--rb-gold); }",
      ".cl-reasoning-budget .rb-metric:nth-child(4) { border-top-color: var(--rb-red); }",
      ".cl-reasoning-budget .rb-metric:nth-child(5) { border-top-color: var(--rb-accent); }",
      ".cl-reasoning-budget .rb-metric span { display: block; color: var(--rb-soft); font-size: .7rem; }",
      ".cl-reasoning-budget .rb-metric strong { display: block; margin-top: .12rem; color: var(--rb-fg); font-size: .95rem; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }",
      ".cl-reasoning-budget .rb-metric small { display: block; margin-top: .15rem; color: var(--rb-soft); font-size: .68rem; line-height: 1.35; }",
      ".cl-reasoning-budget .rb-legend { margin: .65rem 0 0; color: var(--rb-soft); font-size: .76rem; }",
      ".cl-reasoning-budget .rb-chart-wrap { min-width: 0; overflow-x: auto; padding: .25rem; border: 1px solid var(--rb-border); border-radius: 6px; background: var(--rb-bg); }",
      ".cl-reasoning-budget .rb-chart { display: block; width: 100%; min-width: 440px; height: auto; }",
      ".cl-reasoning-budget .rb-chart text { fill: var(--rb-soft); font-family: inherit; font-size: 12px; }",
      ".cl-reasoning-budget .rb-chart .rb-axis { stroke: var(--rb-border); stroke-width: 1; }",
      ".cl-reasoning-budget .rb-chart .rb-line-pass { fill: none; stroke: var(--rb-blue); stroke-width: 3; }",
      ".cl-reasoning-budget .rb-chart .rb-line-final { fill: none; stroke: var(--rb-green); stroke-width: 3; }",
      ".cl-reasoning-budget .rb-chart .rb-line-independent { fill: none; stroke: var(--rb-gold); stroke-width: 2; stroke-dasharray: 6 5; }",
      ".cl-reasoning-budget .rb-chart .rb-dot-pass { fill: var(--rb-blue); }",
      ".cl-reasoning-budget .rb-chart .rb-dot-final { fill: var(--rb-green); }",
      ".cl-reasoning-budget .rb-chart .rb-dot-independent { fill: var(--rb-gold); }",
      ".cl-reasoning-budget .rb-structure { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto minmax(0, 1fr); gap: .4rem; align-items: stretch; margin-top: .75rem; }",
      ".cl-reasoning-budget .rb-structure-node { min-width: 0; padding: .55rem .4rem; border: 1px solid var(--rb-border); border-radius: 6px; background: var(--rb-bg); color: var(--rb-soft); text-align: center; font-size: .73rem; }",
      ".cl-reasoning-budget .rb-structure-node strong { display: block; color: var(--rb-fg); font-size: .78rem; }",
      ".cl-reasoning-budget .rb-structure-arrow { align-self: center; color: var(--rb-accent); text-align: center; font-size: 1.1rem; }",
      ".cl-reasoning-budget .rb-ledger { max-width: 100%; overflow-x: auto; margin-top: .75rem; }",
      ".cl-reasoning-budget table { width: 100%; min-width: 480px; border-collapse: collapse; font-size: .78rem; }",
      ".cl-reasoning-budget th, .cl-reasoning-budget td { padding: .4rem .45rem; border-bottom: 1px solid var(--rb-border); text-align: left; vertical-align: top; }",
      ".cl-reasoning-budget th { color: var(--rb-soft); font-size: .72rem; }",
      ".cl-reasoning-budget td { color: var(--rb-fg); font-variant-numeric: tabular-nums; }",
      ".cl-reasoning-budget .rb-good-text { color: var(--rb-green); font-weight: 800; }",
      ".cl-reasoning-budget .rb-footnote { margin: .7rem 0 0; color: var(--rb-soft); font-size: .74rem; line-height: 1.5; }",
      ".cl-reasoning-budget .rb-sr-only { position: absolute !important; width: 1px !important; height: 1px !important; padding: 0 !important; margin: -1px !important; overflow: hidden !important; clip: rect(0, 0, 0, 0) !important; white-space: nowrap !important; border: 0 !important; }",
      "@media (max-width: 780px) { .cl-reasoning-budget .rb-controls { grid-template-columns: repeat(2, minmax(0, 1fr)); } .cl-reasoning-budget .rb-main { grid-template-columns: minmax(0, 1fr); } }",
      "@media (max-width: 520px) { .cl-reasoning-budget .rb-controls { grid-template-columns: minmax(0, 1fr); } .cl-reasoning-budget .rb-main { padding: .8rem .75rem .9rem; } .cl-reasoning-budget .rb-header { padding: .9rem .8rem .8rem; } .cl-reasoning-budget .rb-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); } .cl-reasoning-budget .rb-structure { grid-template-columns: 1fr; } .cl-reasoning-budget .rb-structure-arrow { transform: rotate(90deg); min-height: 1rem; } }"
    ].join("\n");
    document.head.appendChild(style);
  }

  function hash(seed) {
    var value = seed >>> 0;
    value ^= value >>> 16;
    value = Math.imul(value, 0x7feb352d);
    value ^= value >>> 15;
    value = Math.imul(value, 0x846ca68b);
    value ^= value >>> 16;
    return value >>> 0;
  }

  function unit(taskIndex, salt) {
    return hash(SEED + Math.imul(taskIndex + 1, 0x9e3779b1) + salt) / 4294967296;
  }

  function familyForTask(taskIndex) {
    if (taskIndex < FAMILIES[0].count) return FAMILIES[0];
    if (taskIndex < FAMILIES[0].count + FAMILIES[1].count) return FAMILIES[1];
    return FAMILIES[2];
  }

  function outcome(taskIndex, family, sampleIndex) {
    var shared = unit(taskIndex, 17) < family.rho;
    if (shared) return unit(taskIndex, 23) < family.p;
    return unit(taskIndex, 101 + sampleIndex * 13) < family.p;
  }

  function verifierAccept(taskIndex, sampleIndex, correct, verifier) {
    var threshold = correct ? verifier.tpr : verifier.fpr;
    return unit(taskIndex, 503 + sampleIndex * 29) < threshold;
  }

  function familyIncluded(family, selection) {
    return selection === "mixed" || selection === family.id;
  }

  function selectedTaskIndices(selection) {
    var indices = [];
    for (var taskIndex = 0; taskIndex < TASK_COUNT; taskIndex += 1) {
      if (familyIncluded(familyForTask(taskIndex), selection)) indices.push(taskIndex);
    }
    return indices;
  }

  function normalN(value) {
    var parsed = Number(value);
    if (!finite(parsed)) return DEFAULTS.n;
    parsed = Math.round(parsed);
    if (parsed % 2 === 0) parsed -= 1;
    return clamp(parsed, 1, MAX_N);
  }

  function taskCapacity(taskIndex, family, state) {
    if (!state.adaptive || state.family !== "mixed") return state.n;
    /*
     * The adaptive budget is measured in candidate slots. Under the
     * 40/40/20 mixture, each mapping has weighted mean capacity n:
     * 0.4*1 + 0.4*3 + 0.2*7 = 3 and
     * 0.4*3 + 0.4*5 + 0.2*9 = 5.
     * Per-family token/latency costs remain separate ledger columns.
     */
    var n = normalN(state.n);
    var allocation = n === 3
      ? { easy: 1, medium: 3, hard: 7 }
      : n === 5
        ? { easy: 3, medium: 5, hard: 9 }
        : { easy: n, medium: n, hard: n };
    return allocation[family.id];
  }

  function majorityLocked(correctCount, wrongCount, capacity) {
    var seen = correctCount + wrongCount;
    var remaining = capacity - seen;
    return correctCount > wrongCount + remaining ||
      wrongCount > correctCount + remaining;
  }

  function chooseFinal(taskIndex, family, state, verifier) {
    var capacity = taskCapacity(taskIndex, family, state);
    var correctCount = 0;
    var wrongCount = 0;
    var acceptedCorrect = false;
    var acceptedWrong = false;
    var used = 0;
    var final = null;
    for (var sampleIndex = 0; sampleIndex < capacity; sampleIndex += 1) {
      var correct = outcome(taskIndex, family, sampleIndex);
      used += 1;
      if (correct) correctCount += 1;
      else wrongCount += 1;
      if (state.aggregator === "verifier") {
        var accepted = verifierAccept(taskIndex, sampleIndex, correct, verifier);
        if (accepted && final === null) {
          final = correct;
          if (correct) acceptedCorrect = true;
          else acceptedWrong = true;
          if (state.stopping === "accept") break;
        }
      } else if (state.stopping === "locked" && majorityLocked(correctCount, wrongCount, capacity)) {
        break;
      }
    }
    if (state.aggregator === "majority") {
      final = correctCount > wrongCount;
      if (correctCount === wrongCount) final = null;
    } else if (final === null && state.stopping !== "accept") {
      final = null;
    }
    return {
      capacity: capacity,
      used: used,
      final: final,
      acceptedCorrect: acceptedCorrect,
      acceptedWrong: acceptedWrong,
      correctCount: correctCount,
      wrongCount: wrongCount
    };
  }

  function interval(successes, total) {
    if (!total) return { low: NaN, high: NaN };
    var value = successes / total;
    var z = 1.96;
    var denominator = 1 + (z * z) / total;
    var centre = (value + (z * z) / (2 * total)) / denominator;
    var spread = z * Math.sqrt((value * (1 - value) + (z * z) / (4 * total)) / total) / denominator;
    return { low: clamp(centre - spread, 0, 1), high: clamp(centre + spread, 0, 1) };
  }

  function evaluate(state) {
    var indices = selectedTaskIndices(state.family);
    var verifier = VERIFIERS[state.verifier] || VERIFIERS.high;
    var passCount = 0;
    var finalCorrect = 0;
    var finalWrong = 0;
    var abstain = 0;
    var usedTotal = 0;
    var capacityTotal = 0;
    var tokenTotal = 0;
    var latencyTotal = 0;
    var familyRows = Object.create(null);
    FAMILIES.forEach(function (family) {
      familyRows[family.id] = { family: family, total: 0, pass: 0, correct: 0, abstain: 0, used: 0, capacity: 0 };
    });
    indices.forEach(function (taskIndex) {
      var family = familyForTask(taskIndex);
      var capacity = taskCapacity(taskIndex, family, state);
      var hit = false;
      for (var sampleIndex = 0; sampleIndex < capacity; sampleIndex += 1) {
        if (outcome(taskIndex, family, sampleIndex)) {
          hit = true;
          break;
        }
      }
      var chosen = chooseFinal(taskIndex, family, state, verifier);
      var row = familyRows[family.id];
      row.total += 1;
      row.pass += hit ? 1 : 0;
      row.correct += chosen.final === true ? 1 : 0;
      row.abstain += chosen.final === null ? 1 : 0;
      row.used += chosen.used;
      row.capacity += chosen.capacity;
      passCount += hit ? 1 : 0;
      finalCorrect += chosen.final === true ? 1 : 0;
      finalWrong += chosen.final === false ? 1 : 0;
      abstain += chosen.final === null ? 1 : 0;
      usedTotal += chosen.used;
      capacityTotal += chosen.capacity;
      tokenTotal += chosen.used * family.tokens;
      latencyTotal += chosen.used * family.latency;
    });
    var total = indices.length;
    return {
      total: total,
      pass: passCount / total,
      final: finalCorrect / total,
      wrong: finalWrong / total,
      abstain: abstain / total,
      used: usedTotal / total,
      capacity: capacityTotal / total,
      tokens: tokenTotal / total,
      latency: latencyTotal / total,
      passInterval: interval(passCount, total),
      finalInterval: interval(finalCorrect, total),
      rows: familyRows,
      verifier: verifier
    };
  }

  function independentPass(family, n) {
    return 1 - Math.pow(1 - family.p, n);
  }

  function linePath(points) {
    return points.map(function (point, index) {
      return (index ? "L" : "M") + point[0].toFixed(2) + "," + point[1].toFixed(2);
    }).join(" ");
  }

  function buildChart(api, state, instanceId) {
    var width = 620;
    var height = 300;
    var left = 48;
    var right = 18;
    var top = 24;
    var bottom = 38;
    var plotWidth = width - left - right;
    var plotHeight = height - top - bottom;
    var values = [];
    for (var index = 0; index < 5; index += 1) {
      var n = 1 + index * 2;
      var localState = Object.assign({}, state, { n: n });
      var local = evaluate(localState);
      values.push({ n: n, pass: local.pass, final: local.final, state: localState });
    }
    var y = function (value) { return top + (1 - value) * plotHeight; };
    var x = function (index) { return left + (index / 4) * plotWidth; };
    var svg = svgElement(api, "svg", {
      class: "rb-chart",
      viewBox: "0 0 " + width + " " + height,
      role: "img",
      "aria-labelledby": instanceId + "-chart-title " + instanceId + "-chart-desc"
    });
    svg.appendChild(svgElement(api, "title", { id: instanceId + "-chart-title", text: "pass@n 与最终输出正确率" }));
    svg.appendChild(svgElement(api, "desc", { id: instanceId + "-chart-desc", text: "蓝线是当前预算策略下至少一条候选成功的比例，绿线是当前 verifier 或多数投票与停止规则实际交付正确的比例，金色虚线是在相同分配下把样本误当作独立时的公式对照。" }));
    [0, .25, .5, .75, 1].forEach(function (tick) {
      var yPos = y(tick);
      svg.appendChild(svgElement(api, "line", { class: "rb-axis", x1: left, x2: width - right, y1: yPos, y2: yPos }));
      svg.appendChild(svgElement(api, "text", { x: left - 8, y: yPos + 4, "text-anchor": "end", text: Math.round(tick * 100) + "%" }));
    });
    svg.appendChild(svgElement(api, "line", { class: "rb-axis", x1: left, x2: left, y1: top, y2: height - bottom }));
    svg.appendChild(svgElement(api, "line", { class: "rb-axis", x1: left, x2: width - right, y1: height - bottom, y2: height - bottom }));
    values.forEach(function (point, index) {
      svg.appendChild(svgElement(api, "text", { x: x(index), y: height - 13, "text-anchor": "middle", text: "n=" + point.n }));
    });
    var passPoints = values.map(function (point, index) { return [x(index), y(point.pass)]; });
    var finalPoints = values.map(function (point, index) { return [x(index), y(point.final)]; });
    var independentPoints = values.map(function (point, index) {
      var independent = state.family === "mixed"
        ? FAMILIES.reduce(function (sum, family) {
          return sum + family.weight * independentPass(
            family,
            taskCapacity(0, family, point.state)
          );
        }, 0)
        : independentPass(FAMILY_LOOKUP[state.family], point.n);
      return [x(index), y(independent)];
    });
    svg.appendChild(svgElement(api, "path", { class: "rb-line-independent", d: linePath(independentPoints) }));
    svg.appendChild(svgElement(api, "path", { class: "rb-line-pass", d: linePath(passPoints) }));
    svg.appendChild(svgElement(api, "path", { class: "rb-line-final", d: linePath(finalPoints) }));
    passPoints.forEach(function (point) { svg.appendChild(svgElement(api, "circle", { class: "rb-dot-pass", cx: point[0], cy: point[1], r: 4 })); });
    finalPoints.forEach(function (point) { svg.appendChild(svgElement(api, "circle", { class: "rb-dot-final", cx: point[0], cy: point[1], r: 4 })); });
    independentPoints.forEach(function (point) { svg.appendChild(svgElement(api, "circle", { class: "rb-dot-independent", cx: point[0], cy: point[1], r: 3 })); });
    svg.appendChild(svgElement(api, "text", { x: left + 8, y: top + 14, text: "比例" }));
    svg.appendChild(svgElement(api, "text", { x: width - right, y: 16, "text-anchor": "end", text: "固定 toy ledger；非模型事实" }));
    return svg;
  }

  function addMetric(parent, label, value, note) {
    parent.appendChild(element(null, "div", { className: "rb-metric" }, [
      element(null, "span", { text: label }),
      element(null, "strong", { text: value }),
      note ? element(null, "small", { text: note }) : null
    ]));
  }

  function aggregatorLabel(state) {
    return state.aggregator === "majority" ? "多数投票" : "verifier 首个接受";
  }

  function stoppingLabel(state) {
    if (state.stopping === "locked") return "多数锁定早停";
    if (state.stopping === "accept") return "首次接受早停";
    return "固定跑满 n";
  }

  function familyLabel(selection) {
    return selection === "mixed" ? "混合 40/40/20" : FAMILY_LOOKUP[selection].label;
  }

  function buildLab(root, api) {
    installStyles();
    root.classList.add("cl-reasoning-budget");
    INSTANCE_COUNT += 1;
    var instanceId = "rb-" + INSTANCE_COUNT;
    var state = Object.assign({}, DEFAULTS);
    var refs = { controls: {}, metrics: {}, chart: null, status: null, statusCopy: null, table: null, adaptive: null, adaptiveNote: null, note: null };

    function makeSelect(options, value, onChange) {
      var select = element(api, "select", { "aria-label": options.map(function (option) { return option[1]; }).join("；") });
      options.forEach(function (option) {
        select.appendChild(element(api, "option", { value: option[0], text: option[1] }));
      });
      select.value = value;
      select.addEventListener("change", onChange);
      return select;
    }

    function fieldset(title, children) {
      return element(api, "fieldset", { className: "rb-fieldset" }, [element(api, "legend", { text: title })].concat(children));
    }

    function renderShell() {
      clear(root);
      var header = element(api, "div", { className: "rb-header" }, [
        element(api, "p", { className: "rb-kicker", text: "REASONING BUDGET · FIXED TOY LEDGER" }),
        element(api, "h3", { text: "候选池、选择器与预算" }),
        element(api, "p", { text: "同一批确定性样本路径，分别观察 pass@n、最终交付和实际成本。所有数字只属于本实验。" })
      ]);
      var familySelect = makeSelect([
        ["mixed", "混合任务：40% / 40% / 20%"],
        ["easy", "只看 Easy"],
        ["medium", "只看 Medium"],
        ["hard", "只看 Hard"]
      ], state.family, function () { state.family = familySelect.value; render(true); });
      var nRange = element(api, "input", { type: "range", min: "1", max: String(MAX_N), step: "2", value: String(state.n), "aria-label": "最多候选数 n" });
      var nOutput = element(api, "output", { text: "n=" + state.n });
      nRange.addEventListener("input", function () { state.n = normalN(nRange.value); render(true); });
      var nField = element(api, "div", {}, [
        element(api, "div", { className: "rb-control-head" }, [element(api, "label", { htmlFor: instanceId + "-n", text: "最多候选数 n" }), nOutput]),
        nRange,
        element(api, "div", { className: "rb-scale" }, [element(api, "span", { text: "1" }), element(api, "span", { text: "9" })])
      ]);
      nRange.id = instanceId + "-n";
      var aggregatorSelect = makeSelect([
        ["majority", "多数投票"],
        ["verifier", "verifier：首个接受"]
      ], state.aggregator, function () {
        state.aggregator = aggregatorSelect.value;
        if (state.aggregator === "majority" && state.stopping === "accept") state.stopping = "locked";
        if (state.aggregator === "verifier" && state.stopping === "locked") state.stopping = "accept";
        render(true);
      });
      var aggregatorField = element(api, "div", {}, [element(api, "label", { htmlFor: instanceId + "-agg", text: "聚合方法" }), aggregatorSelect]);
      aggregatorSelect.id = instanceId + "-agg";
      var verifierSelect = makeSelect([
        ["high", "高质量：TPR 90% / FPR 10%"],
        ["borderline", "临界：TPR 65% / FPR 30%"],
        ["weak", "弱：TPR 48% / FPR 42%"]
      ], state.verifier, function () { state.verifier = verifierSelect.value; render(true); });
      var verifierField = element(api, "div", {}, [element(api, "label", { htmlFor: instanceId + "-verifier", text: "verifier 质量" }), verifierSelect]);
      verifierSelect.id = instanceId + "-verifier";
      var stopSelect = makeSelect([
        ["fixed", "固定跑满 n"],
        ["locked", "多数锁定早停"],
        ["accept", "首次接受早停"]
      ], state.stopping, function () { state.stopping = stopSelect.value; render(true); });
      var stopField = element(api, "div", {}, [element(api, "label", { htmlFor: instanceId + "-stop", text: "早停规则" }), stopSelect]);
      stopSelect.id = instanceId + "-stop";
      var adaptiveButton = element(api, "button", { type: "button", "aria-pressed": "false", text: "自适应预算：关", onclick: function () { state.adaptive = !state.adaptive; render(true); } });
      var adaptiveNote = element(api, "p", { className: "rb-note", text: "混合任务映射：n=3 → 1/3/7；n=5 → 3/5/9；n=1/7/9 → n/n/n。这里保持加权平均候选数，token/延迟另计。" });
      refs.adaptive = adaptiveButton;
      refs.adaptiveNote = adaptiveNote;
      var controls = element(api, "div", { className: "rb-controls" }, [
        fieldset("任务族", [familySelect]),
        fieldset("候选数", [nField]),
        fieldset("聚合器", [aggregatorField]),
        fieldset("verifier", [verifierField]),
        fieldset("停止规则", [stopField]),
        fieldset("策略对照", [adaptiveButton, adaptiveNote])
      ]);
      var reset = element(api, "button", { type: "button", className: "rb-primary", text: "重置固定账本", onclick: function () {
        state = Object.assign({}, DEFAULTS);
        familySelect.value = state.family;
        nRange.value = state.n;
        aggregatorSelect.value = state.aggregator;
        verifierSelect.value = state.verifier;
        stopSelect.value = state.stopping;
        render(true);
      } });
      var controlsFooter = element(api, "div", { className: "rb-button-row" }, [reset]);
      var shell = element(api, "div", { className: "rb-shell" }, [header, controls, controlsFooter]);
      var main = element(api, "div", { className: "rb-main" });
      var left = element(api, "div", {});
      var status = element(api, "div", { className: "rb-status" }, [
        element(api, "span", { className: "rb-badge", text: "确定性回放" }),
        element(api, "span", { className: "rb-status-copy", text: "" })
      ]);
      refs.status = status.querySelector(".rb-badge");
      refs.statusCopy = status.querySelector(".rb-status-copy");
      refs.metrics = element(api, "div", { className: "rb-metrics" });
      var chartWrap = element(api, "div", { className: "rb-chart-wrap" });
      refs.chart = chartWrap;
      var legend = element(api, "p", { className: "rb-legend", text: "蓝：当前预算策略下的 pass@n；绿：当前选择/停止规则的最终正确率；金色虚线：相同分配下把样本误当作独立时的公式对照。" });
      left.appendChild(status);
      left.appendChild(refs.metrics);
      left.appendChild(element(api, "h4", { className: "rb-card-title", text: "随 n 变化" }));
      left.appendChild(chartWrap);
      left.appendChild(legend);
      var right = element(api, "div", {});
      var structureCard = element(api, "div", { className: "rb-card" }, [element(api, "h4", { className: "rb-card-title", text: "结构图" })]);
      structureCard.appendChild(element(api, "div", { className: "rb-structure" }, [
        element(api, "div", { className: "rb-structure-node" }, [element(api, "strong", { text: "生成" }), "n 条路径"]),
        element(api, "div", { className: "rb-structure-arrow", text: "→" }),
        element(api, "div", { className: "rb-structure-node" }, [element(api, "strong", { text: "选择" }), "投票 / verifier"]),
        element(api, "div", { className: "rb-structure-arrow", text: "→" }),
        element(api, "div", { className: "rb-structure-node" }, [element(api, "strong", { text: "交付" }), "正确 / 错误 / abstain"])
      ]));
      var ledgerCard = element(api, "div", { className: "rb-card" }, [element(api, "h4", { className: "rb-card-title", text: "当前账本" })]);
      var ledger = element(api, "div", { className: "rb-ledger" });
      refs.table = ledger;
      ledgerCard.appendChild(ledger);
      right.appendChild(structureCard);
      right.appendChild(ledgerCard);
      main.appendChild(left);
      main.appendChild(right);
      shell.appendChild(main);
      root.appendChild(shell);
      refs.controls.family = familySelect;
      refs.controls.n = nRange;
      refs.controls.nOutput = nOutput;
      refs.controls.aggregator = aggregatorSelect;
      refs.controls.verifier = verifierSelect;
      refs.controls.stopping = stopSelect;
      refs.note = element(api, "p", { className: "rb-footnote rb-sr-only", "aria-live": "polite" });
      root.appendChild(refs.note);
    }

    function renderLedger(result) {
      var rows = [
        ["pass@n（候选机会）", formatPercent(result.pass), "Wilson 95%：" + formatInterval(result.passInterval)],
        ["final accuracy（交付正确）", formatPercent(result.final), "Wilson 95%：" + formatInterval(result.finalInterval)],
        ["final wrong", formatPercent(result.wrong), "选错候选"],
        ["abstain", formatPercent(result.abstain), "无交付"],
        ["实际样本 / 容量", formatNumber(result.used, 2) + " / " + formatNumber(result.capacity, 2), "每题平均"],
        ["tokens / latency", formatNumber(result.tokens, 0) + " / " + formatNumber(result.latency, 2), "每题平均；token / s"]
      ];
      var table = element(api, "table", {});
      table.appendChild(element(api, "thead", {}, [element(api, "tr", {}, [element(api, "th", { text: "观察量" }), element(api, "th", { text: "结果" }), element(api, "th", { text: "说明" })])]));
      var tbody = element(api, "tbody", {});
      rows.forEach(function (row) {
        tbody.appendChild(element(api, "tr", {}, [element(api, "td", { text: row[0] }), element(api, "td", { text: row[1], className: row[0].indexOf("final accuracy") >= 0 ? "rb-good-text" : "" }), element(api, "td", { text: row[2] })]));
      });
      table.appendChild(tbody);
      refs.table.replaceChildren(table);
    }

    function renderMetrics(result) {
      clear(refs.metrics);
      addMetric(refs.metrics, "pass@n", formatPercent(result.pass), "候选池命中至少一次");
      addMetric(refs.metrics, "最终正确", formatPercent(result.final), "用户实际收到的答案");
      addMetric(refs.metrics, "选择落差", formatPercent(Math.max(0, result.pass - result.final)), "pass@n − final");
      addMetric(refs.metrics, "实际样本", formatNumber(result.used, 2), "容量 " + formatNumber(result.capacity, 2));
      addMetric(refs.metrics, "token / 延迟", formatNumber(result.tokens, 0) + " / " + formatNumber(result.latency, 2), "每题平均");
    }

    function render(announceChange) {
      state.n = normalN(state.n);
      if (state.aggregator === "majority" && state.stopping === "accept") state.stopping = "locked";
      if (state.aggregator === "verifier" && state.stopping === "locked") state.stopping = "accept";
      var result = evaluate(state);
      refs.controls.family.value = state.family;
      refs.controls.n.value = String(state.n);
      refs.controls.nOutput.textContent = "n=" + state.n;
      refs.controls.aggregator.value = state.aggregator;
      refs.controls.verifier.value = state.verifier;
      refs.controls.stopping.value = state.stopping;
      refs.controls.verifier.disabled = state.aggregator === "majority";
      refs.controls.stopping.querySelector('option[value="locked"]').disabled = state.aggregator !== "majority";
      refs.controls.stopping.querySelector('option[value="accept"]').disabled = state.aggregator === "majority";
      refs.adaptive.setAttribute("aria-pressed", state.adaptive ? "true" : "false");
      refs.adaptive.textContent = state.adaptive ? "自适应预算：开" : "自适应预算：关";
      refs.adaptiveNote.textContent = state.family === "mixed"
        ? "混合映射：n=3 → 1/3/7；n=5 → 3/5/9；n=1/7/9 → n/n/n。保持加权平均候选数=n；token/延迟另计。"
        : "单任务族模式不重分配：自适应保持该族 n 个候选；映射只对混合 40/40/20 生效。";
      refs.status.className = "rb-badge " + (result.final >= result.pass - 0.03 ? "rb-good" : "rb-warn");
      refs.status.textContent = result.final >= result.pass - 0.03 ? "选择器接近候选上限" : "候选—交付有落差";
      refs.statusCopy.textContent = familyLabel(state.family) + " · " + aggregatorLabel(state) + " · " + stoppingLabel(state) + " · " + result.total + " 题固定回放";
      renderMetrics(result);
      refs.chart.replaceChildren(buildChart(api, state, instanceId));
      renderLedger(result);
      if (announceChange && api && typeof api.announce === "function") {
        api.announce(root, "pass@" + state.n + " " + formatPercent(result.pass) + "；最终正确 " + formatPercent(result.final) + "；每题平均 " + formatNumber(result.used, 2) + " 个样本。");
      }
    }

    renderShell();
    render(false);
  }

  window.CourseLearning.register("reasoning-budget", buildLab);
})();
