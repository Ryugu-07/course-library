(function () {
  "use strict";

  if (
    typeof window === "undefined" ||
    !window.CourseLearning ||
    typeof window.CourseLearning.register !== "function"
  ) {
    return;
  }

  var STYLE_ID = "cl-benchmark-contamination-styles";
  var EPSILON = 1e-12;
  var DIRECT_GAIN = 0.22;
  var PUBLIC_NOISE_SD = 0.18;
  var HOLDOUT_NOISE_SD = 0.18;
  var HOLDOUT_COUNT = 24;
  var REPEAT_COUNT = 64;
  var MAX_CANDIDATES = 32;
  var FAMILY_ORDER = ["推理", "代码", "知识", "写作"];

  /*
   * This is a fixed teaching bank, not a claim about any real benchmark.
   * `trueAbility` is a latent probability in the toy world.  `noise` is a
   * fixed item-level perturbation, and `deterministicHash` supplies the stable
   * rank used when the contamination slider selects direct exposures.
   */
  var ITEM_BANK = [
    { id: "R01", family: "推理", topic: "条件规划", trueAbility: 0.82, deterministicHash: "a91f3c7d", noise: -0.03, nearDuplicate: false },
    { id: "R02", family: "推理", topic: "反事实", trueAbility: 0.75, deterministicHash: "19d6b4e2", noise: 0.02, nearDuplicate: true },
    { id: "R03", family: "推理", topic: "数量估计", trueAbility: 0.68, deterministicHash: "6be2c811", noise: -0.04, nearDuplicate: false },
    { id: "R04", family: "推理", topic: "规则一致性", trueAbility: 0.86, deterministicHash: "e04a9f35", noise: 0.01, nearDuplicate: true },
    { id: "C01", family: "代码", topic: "API 边界", trueAbility: 0.78, deterministicHash: "3f9c0a62", noise: -0.02, nearDuplicate: false },
    { id: "C02", family: "代码", topic: "调试定位", trueAbility: 0.72, deterministicHash: "b8e1d740", noise: 0.03, nearDuplicate: true },
    { id: "C03", family: "代码", topic: "数据结构", trueAbility: 0.84, deterministicHash: "0c7d52ae", noise: -0.01, nearDuplicate: false },
    { id: "C04", family: "代码", topic: "并发语义", trueAbility: 0.61, deterministicHash: "4aa2f6d9", noise: -0.05, nearDuplicate: true },
    { id: "K01", family: "知识", topic: "术语辨析", trueAbility: 0.73, deterministicHash: "d2f8b103", noise: 0.00, nearDuplicate: false },
    { id: "K02", family: "知识", topic: "来源追溯", trueAbility: 0.66, deterministicHash: "7a31ce48", noise: 0.02, nearDuplicate: true },
    { id: "K03", family: "知识", topic: "因果解释", trueAbility: 0.81, deterministicHash: "f19b6d20", noise: -0.03, nearDuplicate: false },
    { id: "K04", family: "知识", topic: "时间边界", trueAbility: 0.58, deterministicHash: "52c4e87b", noise: 0.04, nearDuplicate: true },
    { id: "W01", family: "写作", topic: "结构重写", trueAbility: 0.79, deterministicHash: "8d02fa61", noise: -0.02, nearDuplicate: false },
    { id: "W02", family: "写作", topic: "风格约束", trueAbility: 0.71, deterministicHash: "c6e7a934", noise: 0.03, nearDuplicate: true },
    { id: "W03", family: "写作", topic: "证据措辞", trueAbility: 0.83, deterministicHash: "2b45d8f0", noise: -0.04, nearDuplicate: false },
    { id: "W04", family: "写作", topic: "多语境迁移", trueAbility: 0.64, deterministicHash: "a0de713c", noise: 0.01, nearDuplicate: true }
  ];

  var PUBLIC_WEIGHTS = {
    推理: 0.40,
    代码: 0.30,
    知识: 0.20,
    写作: 0.10
  };

  var TASK_PRESETS = {
    public: {
      label: "目标分布≈公开题",
      weights: { 推理: 0.40, 代码: 0.30, 知识: 0.20, 写作: 0.10 }
    },
    balanced: {
      label: "四类均匀",
      weights: { 推理: 0.25, 代码: 0.25, 知识: 0.25, 写作: 0.25 }
    },
    private: {
      label: "私人交付 / 写作重",
      weights: { 推理: 0.10, 代码: 0.20, 知识: 0.25, 写作: 0.45 }
    },
    engineering: {
      label: "私人工程 / 代码重",
      weights: { 推理: 0.15, 代码: 0.50, 知识: 0.20, 写作: 0.15 }
    }
  };

  var CANDIDATE_PROFILES = [
    { id: "A", label: "候选 A", abilities: { 推理: 0.88, 代码: 0.84, 知识: 0.60, 写作: 0.55 } },
    { id: "B", label: "候选 B", abilities: { 推理: 0.72, 代码: 0.68, 知识: 0.74, 写作: 0.90 } },
    { id: "C", label: "候选 C", abilities: { 推理: 0.75, 代码: 0.75, 知识: 0.75, 写作: 0.75 } }
  ];

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
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : document.createTextNode(String(child)));
    });
    return node;
  }

  function makeElement(api, tag, attrs, children) {
    if (api && typeof api.el === "function") return api.el(tag, attrs || {}, children);
    return appendChildren(setAttributes(document.createElement(tag), attrs || {}), children);
  }

  function clear(node) {
    if (!node) return;
    if (typeof node.replaceChildren === "function") {
      node.replaceChildren();
      return;
    }
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function mean(values) {
    if (!values.length) return NaN;
    return values.reduce(function (total, value) { return total + value; }, 0) / values.length;
  }

  function quantile(values, fraction) {
    if (!values.length) return NaN;
    var sorted = values.slice().sort(function (a, b) { return a - b; });
    var position = (sorted.length - 1) * clamp(fraction, 0, 1);
    var lower = Math.floor(position);
    var upper = Math.ceil(position);
    if (lower === upper) return sorted[lower];
    return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
  }

  function formatNumber(value, digits) {
    if (!finite(value)) return "—";
    var text = value.toFixed(digits === undefined ? 3 : digits);
    if (text.indexOf(".") !== -1) {
      text = text.replace(/0+$/, "").replace(/\.$/, "");
    }
    return text === "-0" ? "0" : text;
  }

  function formatPercent(value, digits) {
    return finite(value)
      ? formatNumber(value * 100, digits === undefined ? 1 : digits) + "%"
      : "—";
  }

  function formatSigned(value) {
    if (!finite(value)) return "—";
    return (value >= 0 ? "+" : "−") + formatNumber(Math.abs(value), 2);
  }

  function formatSignedPoints(value) {
    if (!finite(value)) return "—";
    return (value >= 0 ? "+" : "−") + formatNumber(Math.abs(value) * 100, 1) + "pp";
  }

  /* FNV-1a gives a small, auditable, deterministic hash for ledger keys. */
  function hash32(text) {
    var hash = 2166136261;
    var index;
    for (index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function hashUnit(text) {
    return hash32(text) / 4294967296;
  }

  /* Mulberry32 is seeded for every replay; Math.random is intentionally absent. */
  function mulberry32(seed) {
    var state = seed >>> 0;
    return function () {
      var value = (state += 0x6D2B79F5);
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function normal(rng) {
    var u1 = Math.max(EPSILON, rng());
    var u2 = rng();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      ".bc-lab { --bc-panel: var(--block-bg, #f4f1e9); --bc-border: var(--border, #d7d0c2); --bc-muted: var(--fg-soft, #6b6557); --bc-accent: var(--accent, #315f9d); --bc-good: #39734d; --bc-warn: #9b6a12; --bc-bad: #b64335; min-width: 0; margin: 1.5rem 0 2rem; color: var(--fg); color-scheme: light dark; line-height: 1.5; }",
      "html[data-theme=dark] .bc-lab { --bc-panel: #222833; --bc-border: #4b5565; --bc-muted: #b7bec9; --bc-good: #82d49e; --bc-warn: #e0c173; --bc-bad: #f08d83; }",
      ".bc-lab *, .bc-lab *::before, .bc-lab *::after { box-sizing: border-box; }",
      ".bc-lab .bc-shell { overflow: hidden; border: 1px solid var(--bc-border); border-radius: 8px; background: var(--bg); }",
      ".bc-lab .bc-header { padding: 1rem 1.1rem .9rem; border-bottom: 1px solid var(--bc-border); background: var(--bc-panel); }",
      ".bc-lab .bc-kicker { margin: 0 0 .2rem; color: var(--bc-accent); font-size: .75rem; font-weight: 800; letter-spacing: 0; text-transform: uppercase; }",
      ".bc-lab .bc-header h3 { margin: 0; color: var(--fg); font-size: 1.2rem; }",
      ".bc-lab .bc-header p { margin: .4rem 0 0; color: var(--bc-muted); }",
      ".bc-lab .bc-toolbar { display: flex; align-items: center; justify-content: space-between; gap: .75rem; padding: .75rem 1.1rem; border-bottom: 1px solid var(--bc-border); background: var(--bg); }",
      ".bc-lab .bc-toolbar p { margin: 0; color: var(--bc-muted); font-size: .8rem; }",
      ".bc-lab button, .bc-lab select { min-width: 0; min-height: 44px; border: 1px solid var(--bc-border); border-radius: 6px; background: var(--bg); color: var(--fg); font: inherit; }",
      ".bc-lab button { padding: .5rem .75rem; cursor: pointer; font-size: .83rem; font-weight: 700; line-height: 1.25; overflow-wrap: anywhere; }",
      ".bc-lab button:hover { border-color: var(--bc-accent); }",
      ".bc-lab button:focus-visible, .bc-lab select:focus-visible, .bc-lab input:focus-visible { outline: 3px solid var(--cl-focus, #1769aa); outline-offset: 2px; }",
      ".bc-lab button.bc-primary { border-color: var(--bc-accent); background: var(--bc-accent); color: var(--bg); }",
      ".bc-lab button:disabled, .bc-lab input:disabled { cursor: not-allowed; opacity: .55; }",
      ".bc-lab .bc-panel { padding: 1rem 1.1rem 1.1rem; border-bottom: 1px solid var(--bc-border); }",
      ".bc-lab .bc-panel:last-child { border-bottom: 0; }",
      ".bc-lab .bc-panel-heading { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: .5rem; margin-bottom: .75rem; }",
      ".bc-lab .bc-panel-heading h4 { margin: 0; color: var(--fg); font-size: 1rem; }",
      ".bc-lab .bc-panel-heading span { color: var(--bc-muted); font-size: .78rem; }",
      ".bc-lab .bc-control-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; margin-bottom: .9rem; }",
      ".bc-lab .bc-control { min-width: 0; padding: .65rem .7rem .7rem; border: 1px solid var(--bc-border); border-radius: 6px; background: var(--bc-panel); }",
      ".bc-lab .bc-control label, .bc-lab .bc-control legend { color: var(--bc-muted); font-size: .8rem; font-weight: 750; }",
      ".bc-lab .bc-control-head { display: flex; align-items: baseline; justify-content: space-between; gap: .75rem; }",
      ".bc-lab .bc-control output { color: var(--bc-accent); font-weight: 750; font-variant-numeric: tabular-nums; text-align: right; }",
      ".bc-lab input[type=range] { display: block; width: 100%; min-height: 44px; height: 44px; margin: .1rem 0 0; accent-color: var(--bc-accent); }",
      ".bc-lab select { width: 100%; margin-top: .2rem; padding: .45rem .55rem; }",
      ".bc-lab .bc-scale { display: flex; justify-content: space-between; color: var(--bc-muted); font-size: .7rem; font-variant-numeric: tabular-nums; }",
      ".bc-lab .bc-help, .bc-lab .bc-note { margin: .45rem 0 0; color: var(--bc-muted); font-size: .77rem; }",
      ".bc-lab .bc-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: .55rem; margin: .8rem 0; }",
      ".bc-lab .bc-metric { min-width: 0; padding: .6rem .65rem; border-top: 2px solid var(--bc-border); background: var(--bc-panel); }",
      ".bc-lab .bc-metric[data-kind=good] { border-top-color: var(--bc-good); }",
      ".bc-lab .bc-metric[data-kind=warn] { border-top-color: var(--bc-warn); }",
      ".bc-lab .bc-metric[data-kind=bad] { border-top-color: var(--bc-bad); }",
      ".bc-lab .bc-metric span { display: block; color: var(--bc-muted); font-size: .72rem; line-height: 1.35; }",
      ".bc-lab .bc-metric strong { display: block; margin-top: .15rem; color: var(--fg); font-size: 1rem; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }",
      ".bc-lab .bc-readout { margin: .75rem 0 0; padding: .65rem .7rem; border-left: 3px solid var(--bc-accent); background: var(--bc-panel); color: var(--bc-muted); font-size: .8rem; }",
      ".bc-lab .bc-table-wrap { max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; border: 1px solid var(--bc-border); border-radius: 6px; }",
      ".bc-lab table { width: 100%; border-collapse: collapse; font-size: .75rem; font-variant-numeric: tabular-nums; }",
      ".bc-lab th, .bc-lab td { padding: .4rem .45rem; border-bottom: 1px solid var(--bc-border); text-align: right; white-space: nowrap; }",
      ".bc-lab tr:last-child td { border-bottom: 0; }",
      ".bc-lab th { color: var(--bc-muted); font-weight: 750; }",
      ".bc-lab th:first-child, .bc-lab td:first-child, .bc-lab th:nth-child(2), .bc-lab td:nth-child(2), .bc-lab th:nth-child(3), .bc-lab td:nth-child(3) { text-align: left; }",
      ".bc-lab .bc-chip { display: inline-block; padding: .15rem .35rem; border: 1px solid currentColor; border-radius: 4px; font-size: .7rem; line-height: 1.35; }",
      ".bc-lab .bc-chip-clean { color: var(--bc-good); }",
      ".bc-lab .bc-chip-near { color: var(--bc-warn); }",
      ".bc-lab .bc-chip-direct, .bc-lab .bc-chip-both { color: var(--bc-bad); }",
      ".bc-lab .bc-candidate-grid, .bc-lab .bc-distribution-grid { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(250px, .8fr); gap: .9rem; align-items: start; }",
      ".bc-lab .bc-card { min-width: 0; padding: .75rem; border: 1px solid var(--bc-border); border-radius: 6px; background: var(--bc-panel); }",
      ".bc-lab .bc-card h5 { margin: 0 0 .55rem; color: var(--fg); font-size: .88rem; }",
      ".bc-lab .bc-histogram { display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: .3rem; align-items: end; min-height: 150px; padding: .6rem .45rem .25rem; border: 1px solid var(--bc-border); border-radius: 5px; background: var(--bg); }",
      ".bc-lab .bc-hist-bin { display: grid; grid-template-rows: 1fr auto; min-width: 0; height: 132px; align-items: end; }",
      ".bc-lab .bc-hist-bar-wrap { display: flex; align-items: end; height: 106px; }",
      ".bc-lab .bc-hist-bar { width: 100%; min-height: 2px; border-radius: 2px 2px 0 0; background: var(--bc-accent); }",
      ".bc-lab .bc-hist-label { overflow: hidden; color: var(--bc-muted); font-size: .62rem; text-align: center; text-overflow: ellipsis; white-space: nowrap; }",
      ".bc-lab .bc-hist-count { color: var(--fg); font-size: .68rem; text-align: center; font-variant-numeric: tabular-nums; }",
      ".bc-lab .bc-formula { margin-top: .65rem; padding: .55rem .65rem; border-left: 3px solid var(--bc-accent); background: var(--bg); color: var(--fg); font-family: \"SF Mono\", Menlo, Consolas, monospace; font-size: .76rem; line-height: 1.55; overflow-x: auto; }",
      ".bc-lab .bc-holdout { display: grid; gap: .6rem; }",
      ".bc-lab .bc-holdout .bc-lock { padding: .6rem .7rem; border: 1px dashed var(--bc-border); color: var(--bc-muted); font-size: .78rem; }",
      ".bc-lab .bc-holdout .bc-lock.bc-open { border-color: var(--bc-good); color: var(--bc-good); }",
      ".bc-lab .bc-weight-row { display: grid; grid-template-columns: 72px minmax(100px, 1fr) 64px minmax(100px, 1fr) 64px; gap: .45rem; align-items: center; margin: .45rem 0; font-size: .75rem; }",
      ".bc-lab .bc-weight-track { height: .7rem; overflow: hidden; border: 1px solid var(--bc-border); border-radius: 3px; background: var(--bg); }",
      ".bc-lab .bc-weight-fill { height: 100%; background: var(--bc-accent); }",
      ".bc-lab .bc-weight-fill.bc-private { background: var(--bc-warn); }",
      ".bc-lab .bc-weight-legend { display: grid; grid-template-columns: 72px 1fr 64px minmax(100px, 1fr) 64px; gap: .45rem; color: var(--bc-muted); font-size: .7rem; }",
      ".bc-lab .bc-weight-legend span:nth-child(2), .bc-lab .bc-weight-legend span:nth-child(4) { text-align: center; }",
      ".bc-lab .bc-rank-reverse { margin: .7rem 0 0; padding: .65rem .7rem; border-left: 3px solid var(--bc-warn); background: var(--bg); color: var(--bc-muted); font-size: .8rem; }",
      ".bc-lab .bc-status { min-height: 1.5em; margin: .75rem 0 0; color: var(--bc-muted); font-size: .8rem; }",
      "@media (max-width: 860px) { .bc-lab .bc-candidate-grid, .bc-lab .bc-distribution-grid { grid-template-columns: 1fr; } }",
      "@media (max-width: 620px) { .bc-lab .bc-toolbar { align-items: stretch; flex-direction: column; } .bc-lab .bc-toolbar button { width: 100%; } .bc-lab .bc-panel { padding: .8rem .75rem .9rem; } .bc-lab .bc-control-grid { grid-template-columns: 1fr; } .bc-lab .bc-weight-row, .bc-lab .bc-weight-legend { grid-template-columns: 54px minmax(74px, 1fr) 48px minmax(74px, 1fr) 48px; gap: .3rem; font-size: .68rem; } }",
      "@media (prefers-reduced-motion: reduce) { .bc-lab *, .bc-lab *::before, .bc-lab *::after { scroll-behavior: auto !important; transition: none !important; animation: none !important; } }"
    ].join("\n");
    (document.head || document.documentElement).appendChild(style);
  }

  function metricCard(api, label, kind) {
    var value = makeElement(api, "strong", { text: "—" });
    return {
      value: value,
      node: makeElement(api, "div", { className: "bc-metric", "data-kind": kind || "" }, [
        makeElement(api, "span", { text: label }),
        value
      ])
    };
  }

  function panelHeading(api, title, note) {
    return makeElement(api, "div", { className: "bc-panel-heading" }, [
      makeElement(api, "h4", { text: title }),
      makeElement(api, "span", { text: note })
    ]);
  }

  function evaluateContamination(contaminationRate, nearGain) {
    var rows = [];
    var observedTotal = 0;
    var oracleTotal = 0;
    var cleanTotal = 0;
    var cleanCount = 0;
    var directCount = 0;
    var nearCount = 0;
    var bothCount = 0;

    ITEM_BANK.forEach(function (item) {
      var direct = hashUnit("direct:" + item.deterministicHash) < contaminationRate;
      var near = item.nearDuplicate;
      var cleanProbability = clamp(item.trueAbility + item.noise, 0.01, 0.99);
      var uplift = (direct ? DIRECT_GAIN : 0) + (near ? nearGain : 0);
      var observedProbability = clamp(cleanProbability + uplift, 0.01, 0.99);
      var atRisk = direct || near;
      var statusKey = direct && near ? "both" : direct ? "direct" : near ? "near" : "clean";
      var statusText = statusKey === "both"
        ? "直接 + 近重复"
        : statusKey === "direct"
          ? "直接污染"
          : statusKey === "near"
            ? "近重复风险"
            : "clean";

      rows.push({
        item: item,
        direct: direct,
        near: near,
        atRisk: atRisk,
        statusKey: statusKey,
        statusText: statusText,
        cleanProbability: cleanProbability,
        observedProbability: observedProbability
      });
      observedTotal += observedProbability;
      oracleTotal += cleanProbability;
      if (direct) directCount += 1;
      if (near) nearCount += 1;
      if (direct && near) bothCount += 1;
      if (!atRisk) {
        cleanTotal += cleanProbability;
        cleanCount += 1;
      }
    });

    return {
      rows: rows,
      observedScore: observedTotal / rows.length,
      oracleScore: oracleTotal / rows.length,
      cleanScore: cleanCount ? cleanTotal / cleanCount : NaN,
      cleanCount: cleanCount,
      directCount: directCount,
      nearCount: nearCount,
      bothCount: bothCount,
      itemCount: rows.length
    };
  }

  function candidateTrueAbility(index) {
    return 0.685 + (((index * 11 + 4) % 13) / 12) * 0.055;
  }

  function candidateLabel(index) {
    return "C" + String(index + 1).padStart(2, "0");
  }

  function simulatePublicTrial(seed, candidateCount, testCount) {
    var rng = mulberry32(seed);
    var candidates = [];
    var candidateIndex;
    var itemIndex;
    var winner;

    for (candidateIndex = 0; candidateIndex < candidateCount; candidateIndex += 1) {
      var trueAbility = candidateTrueAbility(candidateIndex);
      var noiseTotal = 0;
      for (itemIndex = 0; itemIndex < testCount; itemIndex += 1) {
        noiseTotal += normal(rng) * PUBLIC_NOISE_SD;
      }
      var publicScore = clamp(trueAbility + noiseTotal / testCount, 0.01, 0.99);
      var candidate = {
        index: candidateIndex,
        id: candidateLabel(candidateIndex),
        trueAbility: trueAbility,
        publicScore: publicScore,
        optimism: publicScore - trueAbility
      };
      candidates.push(candidate);
      if (!winner || candidate.publicScore > winner.publicScore) winner = candidate;
    }

    return { candidates: candidates, winner: winner };
  }

  function repeatedWinnerSummary(candidateCount, testCount) {
    var publicScores = [];
    var winnerTruths = [];
    var optimism = [];
    var repeatIndex;

    for (repeatIndex = 0; repeatIndex < REPEAT_COUNT; repeatIndex += 1) {
      var seed = hash32("public-replay:" + candidateCount + ":" + testCount + ":" + repeatIndex);
      var trial = simulatePublicTrial(seed, candidateCount, testCount);
      publicScores.push(trial.winner.publicScore);
      winnerTruths.push(trial.winner.trueAbility);
      optimism.push(trial.winner.optimism);
    }

    return {
      publicScores: publicScores,
      winnerTruths: winnerTruths,
      optimism: optimism,
      publicMean: mean(publicScores),
      publicMedian: quantile(publicScores, 0.5),
      publicP10: quantile(publicScores, 0.10),
      publicP90: quantile(publicScores, 0.90),
      truthMean: mean(winnerTruths),
      optimismMean: mean(optimism),
      optimismMedian: quantile(optimism, 0.5)
    };
  }

  function evaluatePrivateHoldout(candidateIndex) {
    var rng = mulberry32(hash32("private-holdout:frozen:" + candidateLabel(candidateIndex)));
    var noiseTotal = 0;
    var index;
    for (index = 0; index < HOLDOUT_COUNT; index += 1) {
      noiseTotal += normal(rng) * HOLDOUT_NOISE_SD;
    }
    var trueAbility = candidateTrueAbility(candidateIndex);
    return {
      trueAbility: trueAbility,
      score: clamp(trueAbility + noiseTotal / HOLDOUT_COUNT, 0.01, 0.99),
      count: HOLDOUT_COUNT
    };
  }

  function weightedScore(abilities, weights) {
    return FAMILY_ORDER.reduce(function (total, family) {
      return total + abilities[family] * weights[family];
    }, 0);
  }

  function rankFor(scores, id) {
    var ordered = scores.slice().sort(function (a, b) { return b.score - a.score; });
    for (var index = 0; index < ordered.length; index += 1) {
      if (ordered[index].id === id) return index + 1;
    }
    return NaN;
  }

  function buildLab(root, api) {
    injectStyles();
    root.classList.add("bc-lab");

    var state = {
      contaminationRate: 0.25,
      nearGain: 0.12,
      candidateCount: 12,
      testCount: 10,
      taskPreset: "private",
      holdoutOpened: false,
      holdoutResult: null
    };

    var contaminationRange = makeElement(api, "input", {
      type: "range", min: 0, max: 1, step: 0.05, value: state.contaminationRate,
      "aria-label": "直接污染率"
    });
    var contaminationOutput = makeElement(api, "output", { text: "25%" });
    var nearRange = makeElement(api, "input", {
      type: "range", min: 0, max: 0.30, step: 0.01, value: state.nearGain,
      "aria-label": "近重复泄漏增益"
    });
    var nearOutput = makeElement(api, "output", { text: "+12pp" });
    var contaminationTableBody = makeElement(api, "tbody");
    var contaminationStatus = makeElement(api, "p", { className: "bc-status", role: "status", "aria-live": "polite" });
    var contaminationMetrics = [
      metricCard(api, "observed benchmark（全题）", "bad"),
      metricCard(api, "clean subset（剔除风险题）", "good"),
      metricCard(api, "oracle baseline（无泄漏增益）", "good"),
      metricCard(api, "直接 / 近重复风险题", "warn")
    ];

    var candidateRange = makeElement(api, "input", {
      type: "range", min: 1, max: MAX_CANDIDATES, step: 1, value: state.candidateCount,
      "aria-label": "候选模型或提示数量"
    });
    var candidateOutput = makeElement(api, "output", { text: "12 个" });
    var testRange = makeElement(api, "input", {
      type: "range", min: 3, max: 40, step: 1, value: state.testCount,
      "aria-label": "公开测试题数量"
    });
    var testOutput = makeElement(api, "output", { text: "10 题" });
    var holdoutButton = makeElement(api, "button", {
      type: "button", className: "bc-primary", text: "冻结并只开一次私有 holdout"
    });
    var winnerMetrics = [
      metricCard(api, "本次公开 winner 分", "bad"),
      metricCard(api, "本次 winner 潜在分", "good"),
      metricCard(api, "本次乐观差", "warn"),
      metricCard(api, "64 次回放平均乐观差", "warn"),
      metricCard(api, "回放 winner 分中位数", "good")
    ];
    var histogram = makeElement(api, "div", {
      className: "bc-histogram", role: "img",
      "aria-label": "64 次确定性重复实验的公开 winner 分布"
    });
    var winnerTableBody = makeElement(api, "tbody");
    var repeatTableBody = makeElement(api, "tbody");
    var winnerReadout = makeElement(api, "p", { className: "bc-readout" });
    var holdoutMetric = metricCard(api, "私有 holdout 分（仅一次）", "good");
    var holdoutLock = makeElement(api, "div", { className: "bc-lock", role: "status", "aria-live": "polite" });
    var holdoutReadout = makeElement(api, "p", { className: "bc-note" });

    var taskSelect = makeElement(api, "select", { id: "bc-task-profile", "aria-label": "私人目标任务分布" }, [
      makeElement(api, "option", { value: "public", text: TASK_PRESETS.public.label }),
      makeElement(api, "option", { value: "balanced", text: TASK_PRESETS.balanced.label }),
      makeElement(api, "option", { value: "private", text: TASK_PRESETS.private.label }),
      makeElement(api, "option", { value: "engineering", text: TASK_PRESETS.engineering.label })
    ]);
    var weightRows = makeElement(api, "div");
    var distributionTableBody = makeElement(api, "tbody");
    var distributionReadout = makeElement(api, "p", { className: "bc-rank-reverse" });

    function control(apiInstance, label, output, input, scaleLeft, scaleRight, help) {
      return makeElement(apiInstance, "div", { className: "bc-control" }, [
        makeElement(apiInstance, "div", { className: "bc-control-head" }, [
          makeElement(apiInstance, "label", { text: label }),
          output
        ]),
        input,
        makeElement(apiInstance, "div", { className: "bc-scale" }, [
          makeElement(apiInstance, "span", { text: scaleLeft }),
          makeElement(apiInstance, "span", { text: scaleRight })
        ]),
        makeElement(apiInstance, "p", { className: "bc-help", text: help })
      ]);
    }

    var contaminationPanel = makeElement(api, "section", { className: "bc-panel" }, [
      panelHeading(api, "1 · 固定题库：把分数拆回来源账本", "直接污染 ≠ 近重复；两者都要标记"),
      makeElement(api, "div", { className: "bc-control-grid" }, [
        control(api, "直接污染率（按固定 hash 选题）", contaminationOutput, contaminationRange, "0%", "100%", "直接命中题面/答案的玩具增益固定为 +22pp；滑杆只改变哪些题被标记。"),
        control(api, "近重复泄漏增益", nearOutput, nearRange, "0pp", "+30pp", "固定的 nearDuplicate 题不换 hash；只改变其额外得分增益。")
      ]),
      makeElement(api, "div", { className: "bc-metrics" }, contaminationMetrics.map(function (item) { return item.node; })),
      makeElement(api, "div", { className: "bc-table-wrap" }, [
        makeElement(api, "table", {}, [
          makeElement(api, "thead", {}, [makeElement(api, "tr", {}, [
            makeElement(api, "th", { scope: "col", text: "题" }),
            makeElement(api, "th", { scope: "col", text: "family" }),
            makeElement(api, "th", { scope: "col", text: "topic" }),
            makeElement(api, "th", { scope: "col", text: "真实能力 q" }),
            makeElement(api, "th", { scope: "col", text: "fixed hash / ε" }),
            makeElement(api, "th", { scope: "col", text: "污染标记" }),
            makeElement(api, "th", { scope: "col", text: "clean p" }),
            makeElement(api, "th", { scope: "col", text: "observed p" })
          ])]),
          contaminationTableBody
        ])
      ]),
      contaminationStatus
    ]);

    var repeatSummaryTable = makeElement(api, "div", { className: "bc-table-wrap" }, [
      makeElement(api, "table", {}, [
        makeElement(api, "thead", {}, [makeElement(api, "tr", {}, [
          makeElement(api, "th", { scope: "col", text: "64 次回放摘要" }),
          makeElement(api, "th", { scope: "col", text: "公开 winner 分" }),
          makeElement(api, "th", { scope: "col", text: "winner 潜在分" }),
          makeElement(api, "th", { scope: "col", text: "乐观差" })
        ])]),
        repeatTableBody
      ])
    ]);
    var candidateTable = makeElement(api, "div", { className: "bc-table-wrap" }, [
      makeElement(api, "table", {}, [
        makeElement(api, "thead", {}, [makeElement(api, "tr", {}, [
          makeElement(api, "th", { scope: "col", text: "候选" }),
          makeElement(api, "th", { scope: "col", text: "潜在能力" }),
          makeElement(api, "th", { scope: "col", text: "公开测试分" }),
          makeElement(api, "th", { scope: "col", text: "与潜在分差" }),
          makeElement(api, "th", { scope: "col", text: "选择" })
        ])]),
        winnerTableBody
      ])
    ]);
    var winnerPanel = makeElement(api, "section", { className: "bc-panel" }, [
      panelHeading(api, "2 · 多次试模型 / 提示：只报告最好测试分会发生什么？", "固定独立噪声；一次回放不是定理"),
      makeElement(api, "div", { className: "bc-control-grid" }, [
        control(api, "候选模型 / 提示数量", candidateOutput, candidateRange, "1", String(MAX_CANDIDATES), "每个候选有固定但略有差异的潜在能力；候选越多，最大噪声偏差越容易被选中。"),
        control(api, "公开测试题数量", testOutput, testRange, "3 题", "40 题", "每题噪声由 seeded PRNG 独立抽取；题越少，单个分数波动越大。")
      ]),
      makeElement(api, "div", { className: "bc-metrics" }, winnerMetrics.map(function (item) { return item.node; })),
      makeElement(api, "div", { className: "bc-candidate-grid" }, [
        makeElement(api, "section", { className: "bc-card" }, [
          makeElement(api, "h5", { text: "64 次固定重复实验：公开 winner 分布" }),
          histogram,
          makeElement(api, "p", { className: "bc-note", text: "柱高是重复次数，不是模型概率；均值、分位数和潜在能力要一起读。" }),
          repeatSummaryTable
        ]),
        makeElement(api, "section", { className: "bc-card" }, [
          makeElement(api, "h5", { text: "当前这一次公开选拔的候选账本" }),
          candidateTable,
          winnerReadout,
          makeElement(api, "div", { className: "bc-formula", text: "public_j = latent_j + mean(ξ_j1,…,ξ_jm)；winner = argmax_j public_j。" })
        ])
      ]),
      makeElement(api, "div", { className: "bc-card bc-holdout", style: "margin-top: .9rem;" }, [
        makeElement(api, "h5", { text: "对照：冻结私有 holdout，选完后只开一次" }),
        makeElement(api, "div", { className: "bc-holdout-row" }, [holdoutButton, holdoutMetric.node]),
        holdoutLock,
        holdoutReadout
      ])
    ]);

    var distributionPanel = makeElement(api, "section", { className: "bc-panel" }, [
      panelHeading(api, "3 · 任务分布错配：公开题赢，不代表目标任务赢", "无污染，只改变权重"),
      makeElement(api, "div", { className: "bc-control-grid" }, [
        makeElement(api, "div", { className: "bc-control" }, [
          makeElement(api, "label", { htmlFor: "bc-task-profile", text: "私人目标任务配比" }),
          taskSelect,
          makeElement(api, "p", { className: "bc-help", text: "公开 benchmark 的权重固定；下拉菜单只改变私人任务的目标权重。" })
        ]),
        makeElement(api, "div", { className: "bc-control" }, [
          makeElement(api, "div", { className: "bc-control-head" }, [
            makeElement(api, "span", { text: "评测协议" }),
            makeElement(api, "output", { text: "无污染" })
          ]),
          makeElement(api, "p", { className: "bc-help", text: "A/B/C 的分项能力固定，分数只按 family 权重加权；这不是模型排名。" })
        ])
      ]),
      makeElement(api, "div", { className: "bc-distribution-grid" }, [
        makeElement(api, "section", { className: "bc-card" }, [
          makeElement(api, "h5", { text: "公开题权重 vs 私人任务权重" }),
          makeElement(api, "div", { className: "bc-weight-legend" }, [
            makeElement(api, "span", { text: "family" }),
            makeElement(api, "span", { text: "公开题" }),
            makeElement(api, "span", { text: "权重" }),
            makeElement(api, "span", { text: "私人任务" }),
            makeElement(api, "span", { text: "权重" })
          ]),
          weightRows,
          makeElement(api, "div", { className: "bc-formula", text: "weighted score = Σ_family weight_family × ability_family。" })
        ]),
        makeElement(api, "section", { className: "bc-card" }, [
          makeElement(api, "h5", { text: "同一组分项能力的两套总分" }),
          makeElement(api, "div", { className: "bc-table-wrap" }, [
            makeElement(api, "table", {}, [
              makeElement(api, "thead", {}, [makeElement(api, "tr", {}, [
                makeElement(api, "th", { scope: "col", text: "候选" }),
                makeElement(api, "th", { scope: "col", text: "公开分 / 名次" }),
                makeElement(api, "th", { scope: "col", text: "私人分 / 名次" })
              ])]),
              distributionTableBody
            ])
          ]),
          distributionReadout
        ])
      ])
    ]);

    var resetButton = makeElement(api, "button", { type: "button", text: "重置未冻结实验" });
    var shell = makeElement(api, "div", { className: "bc-shell" }, [
      makeElement(api, "header", { className: "bc-header" }, [
        makeElement(api, "p", { className: "bc-kicker", text: "benchmark-contamination" }),
        makeElement(api, "h3", { text: "高分是证据，不是来源不明的结论" }),
        makeElement(api, "p", { text: "固定题库、固定 hash 与固定随机种子把分数拆成可审计账本：污染、选择偏差和目标分布错配分别记账。" })
      ]),
      makeElement(api, "div", { className: "bc-toolbar" }, [
        makeElement(api, "p", { text: "先预测，再调一个旋钮；私有 holdout 一旦打开，本页会话内保持锁定。" }),
        resetButton
      ]),
      contaminationPanel,
      winnerPanel,
      distributionPanel
    ]);

    clear(root);
    root.appendChild(shell);

    function renderContamination() {
      var result = evaluateContamination(state.contaminationRate, state.nearGain);
      contaminationRange.value = String(state.contaminationRate);
      nearRange.value = String(state.nearGain);
      contaminationOutput.textContent = formatPercent(state.contaminationRate, 0);
      nearOutput.textContent = "+" + formatNumber(state.nearGain * 100, 0) + "pp";
      contaminationMetrics[0].value.textContent = formatPercent(result.observedScore);
      contaminationMetrics[1].value.textContent = finite(result.cleanScore)
        ? formatPercent(result.cleanScore) + "（" + result.cleanCount + "/" + result.itemCount + "）"
        : "—（0 clean）";
      contaminationMetrics[2].value.textContent = formatPercent(result.oracleScore);
      contaminationMetrics[3].value.textContent = result.directCount + " 直接 / " + result.nearCount + " 近重复";
      contaminationRange.setAttribute("aria-valuetext", formatPercent(state.contaminationRate, 0));
      nearRange.setAttribute("aria-valuetext", "近重复泄漏增益 +" + formatNumber(state.nearGain * 100, 0) + " 个百分点");

      clear(contaminationTableBody);
      result.rows.forEach(function (row) {
        var item = row.item;
        var chipClass = "bc-chip bc-chip-" + row.statusKey;
        contaminationTableBody.appendChild(makeElement(api, "tr", {}, [
          makeElement(api, "td", { text: item.id }),
          makeElement(api, "td", { text: item.family }),
          makeElement(api, "td", { text: item.topic }),
          makeElement(api, "td", { text: formatPercent(item.trueAbility) }),
          makeElement(api, "td", { text: item.deterministicHash + " / " + formatSigned(item.noise) }),
          makeElement(api, "td", {}, [makeElement(api, "span", { className: chipClass, text: row.statusText })]),
          makeElement(api, "td", { text: formatPercent(row.cleanProbability) }),
          makeElement(api, "td", { text: formatPercent(row.observedProbability) })
        ]));
      });
      contaminationStatus.textContent = "固定题库 " + result.itemCount + " 题；direct 标记由 hash 阈值决定，nearDuplicate 是题库元数据。观察分数是固定概率账本；clean subset 排除了风险题，也可能改变 family/难度构成，不能把它与全题 oracle 的差直接当作污染量。";
    }

    function renderHistogram(summary) {
      clear(histogram);
      var binCount = 8;
      var lower = 0.55;
      var upper = 0.95;
      var counts = [];
      var maxCount = 0;
      var index;
      for (index = 0; index < binCount; index += 1) counts.push(0);
      summary.publicScores.forEach(function (score) {
        var bin = Math.floor((score - lower) / (upper - lower) * binCount);
        bin = clamp(bin, 0, binCount - 1);
        counts[bin] += 1;
        maxCount = Math.max(maxCount, counts[bin]);
      });
      counts.forEach(function (count, binIndex) {
        var start = lower + (upper - lower) * binIndex / binCount;
        var end = lower + (upper - lower) * (binIndex + 1) / binCount;
        var height = maxCount ? count / maxCount * 100 : 0;
        var bar = makeElement(api, "div", { className: "bc-hist-bar" });
        bar.style.height = Math.max(height, count ? 2 : 0) + "%";
        bar.setAttribute("aria-label", formatPercent(start, 0) + "–" + formatPercent(end, 0) + "：" + count + " 次");
        histogram.appendChild(makeElement(api, "div", { className: "bc-hist-bin" }, [
          makeElement(api, "div", { className: "bc-hist-bar-wrap" }, [bar]),
          makeElement(api, "div", { className: "bc-hist-count", text: String(count) }),
          makeElement(api, "div", { className: "bc-hist-label", text: formatPercent(start, 0) })
        ]));
      });
      histogram.setAttribute("aria-label", "64 次确定性重复：公开 winner 分数均值 " + formatPercent(summary.publicMean) + "，范围柱状分布");
    }

    function renderWinner() {
      var seed = hash32("public-current:" + state.candidateCount + ":" + state.testCount);
      var trial = simulatePublicTrial(seed, state.candidateCount, state.testCount);
      var summary = repeatedWinnerSummary(state.candidateCount, state.testCount);
      var winner = trial.winner;

      candidateRange.value = String(state.candidateCount);
      testRange.value = String(state.testCount);
      candidateOutput.textContent = state.candidateCount + " 个";
      testOutput.textContent = state.testCount + " 题";
      candidateRange.disabled = state.holdoutOpened;
      testRange.disabled = state.holdoutOpened;
      candidateRange.setAttribute("aria-valuetext", state.candidateCount + " 个候选");
      testRange.setAttribute("aria-valuetext", state.testCount + " 道公开测试题");
      winnerMetrics[0].value.textContent = formatPercent(winner.publicScore);
      winnerMetrics[1].value.textContent = formatPercent(winner.trueAbility);
      winnerMetrics[2].value.textContent = formatSignedPoints(winner.optimism);
      winnerMetrics[3].value.textContent = formatSignedPoints(summary.optimismMean);
      winnerMetrics[4].value.textContent = formatPercent(summary.publicMedian);

      renderHistogram(summary);
      clear(repeatTableBody);
      [
        ["P10", summary.publicP10, quantile(summary.winnerTruths, 0.10), quantile(summary.optimism, 0.10)],
        ["中位数", summary.publicMedian, quantile(summary.winnerTruths, 0.50), summary.optimismMedian],
        ["均值", summary.publicMean, summary.truthMean, summary.optimismMean],
        ["P90", summary.publicP90, quantile(summary.winnerTruths, 0.90), quantile(summary.optimism, 0.90)]
      ].forEach(function (row) {
        repeatTableBody.appendChild(makeElement(api, "tr", {}, [
          makeElement(api, "td", { text: row[0] }),
          makeElement(api, "td", { text: formatPercent(row[1]) }),
          makeElement(api, "td", { text: formatPercent(row[2]) }),
          makeElement(api, "td", { text: formatSignedPoints(row[3]) })
        ]));
      });

      clear(winnerTableBody);
      trial.candidates.forEach(function (candidate) {
        winnerTableBody.appendChild(makeElement(api, "tr", {}, [
          makeElement(api, "td", { text: candidate.id }),
          makeElement(api, "td", { text: formatPercent(candidate.trueAbility) }),
          makeElement(api, "td", { text: formatPercent(candidate.publicScore) }),
          makeElement(api, "td", { text: formatSignedPoints(candidate.optimism) }),
          makeElement(api, "td", { text: candidate.index === winner.index ? "← winner" : "" })
        ]));
      });

      winnerReadout.textContent = "本次固定种子选中 " + winner.id + "：公开分 " + formatPercent(winner.publicScore) + "，潜在分 " + formatPercent(winner.trueAbility) + "。下方 64 次回放的平均乐观差为 " + formatSignedPoints(summary.optimismMean) + "；它是本玩具协议的选择偏差读数，不是现实模型的概率定理。";
      holdoutButton.disabled = state.holdoutOpened;
      if (state.holdoutOpened && state.holdoutResult) {
        holdoutMetric.value.textContent = formatPercent(state.holdoutResult.score);
        holdoutLock.className = "bc-lock bc-open";
        holdoutLock.textContent = "已打开并冻结：" + winner.id + " 的私有 holdout（" + HOLDOUT_COUNT + " 题）。本次页面会话不再用它调参；重置不会重新隐藏它或解锁公开选择参数。";
        holdoutReadout.textContent = "私有分 " + formatPercent(state.holdoutResult.score) + "，潜在分 " + formatPercent(state.holdoutResult.trueAbility) + "；它只在公开选拔之后读取一次，不能被拿来反复挑选配置。";
      } else {
        holdoutMetric.value.textContent = "—（未打开）";
        holdoutLock.className = "bc-lock";
        holdoutLock.textContent = "私有 holdout 仍隐藏；先看公开账本，再决定是否只开一次。";
        holdoutReadout.textContent = "私有 holdout 固定为独立噪声的 " + HOLDOUT_COUNT + " 题集合；打开后会锁定候选数与测试题数。";
      }
    }

    function renderDistribution() {
      var preset = TASK_PRESETS[state.taskPreset];
      var privateWeights = preset.weights;
      taskSelect.value = state.taskPreset;
      clear(weightRows);
      FAMILY_ORDER.forEach(function (family) {
        var publicValue = PUBLIC_WEIGHTS[family];
        var privateValue = privateWeights[family];
        var publicFill = makeElement(api, "div", { className: "bc-weight-fill" });
        var privateFill = makeElement(api, "div", { className: "bc-weight-fill bc-private" });
        publicFill.style.width = formatPercent(publicValue, 0);
        privateFill.style.width = formatPercent(privateValue, 0);
        weightRows.appendChild(makeElement(api, "div", { className: "bc-weight-row" }, [
          makeElement(api, "span", { text: family }),
          makeElement(api, "div", { className: "bc-weight-track" }, [publicFill]),
          makeElement(api, "span", { text: formatPercent(publicValue, 0) }),
          makeElement(api, "div", { className: "bc-weight-track" }, [privateFill]),
          makeElement(api, "span", { text: formatPercent(privateValue, 0) })
        ]));
      });

      var publicScores = [];
      var privateScores = [];
      CANDIDATE_PROFILES.forEach(function (profile) {
        publicScores.push({ id: profile.id, label: profile.label, score: weightedScore(profile.abilities, PUBLIC_WEIGHTS) });
        privateScores.push({ id: profile.id, label: profile.label, score: weightedScore(profile.abilities, privateWeights) });
      });
      clear(distributionTableBody);
      CANDIDATE_PROFILES.forEach(function (profile) {
        var publicScore = publicScores.filter(function (item) { return item.id === profile.id; })[0];
        var privateScore = privateScores.filter(function (item) { return item.id === profile.id; })[0];
        distributionTableBody.appendChild(makeElement(api, "tr", {}, [
          makeElement(api, "td", { text: profile.label }),
          makeElement(api, "td", { text: formatPercent(publicScore.score) + " / #" + rankFor(publicScores, profile.id) }),
          makeElement(api, "td", { text: formatPercent(privateScore.score) + " / #" + rankFor(privateScores, profile.id) })
        ]));
      });

      var publicWinner = publicScores.slice().sort(function (a, b) { return b.score - a.score; })[0];
      var privateWinner = privateScores.slice().sort(function (a, b) { return b.score - a.score; })[0];
      if (publicWinner.id !== privateWinner.id) {
        distributionReadout.textContent = "排名反转：公开题偏好 " + publicWinner.label + "（" + formatPercent(publicWinner.score) + "），私人目标偏好 " + privateWinner.label + "（" + formatPercent(privateWinner.score) + "）。这里没有污染；改变的是目标分布。";
      } else {
        distributionReadout.textContent = "当前配比下两套分布的第一名都是 " + publicWinner.label + "；这不证明分布无关，继续换一个私人配比并看分项账本。";
      }
    }

    contaminationRange.addEventListener("input", function () {
      state.contaminationRate = clamp(Number(contaminationRange.value), 0, 1);
      renderContamination();
    });
    nearRange.addEventListener("input", function () {
      state.nearGain = clamp(Number(nearRange.value), 0, 0.30);
      renderContamination();
    });
    candidateRange.addEventListener("input", function () {
      if (state.holdoutOpened) return;
      state.candidateCount = clamp(Math.round(Number(candidateRange.value)), 1, MAX_CANDIDATES);
      renderWinner();
    });
    testRange.addEventListener("input", function () {
      if (state.holdoutOpened) return;
      state.testCount = clamp(Math.round(Number(testRange.value)), 3, 40);
      renderWinner();
    });
    taskSelect.addEventListener("change", function () {
      state.taskPreset = TASK_PRESETS[taskSelect.value] ? taskSelect.value : "private";
      renderDistribution();
    });
    holdoutButton.addEventListener("click", function () {
      if (state.holdoutOpened) return;
      var seed = hash32("public-current:" + state.candidateCount + ":" + state.testCount);
      var trial = simulatePublicTrial(seed, state.candidateCount, state.testCount);
      state.holdoutResult = evaluatePrivateHoldout(trial.winner.index);
      state.holdoutOpened = true;
      renderWinner();
    });
    resetButton.addEventListener("click", function () {
      state.contaminationRate = 0.25;
      state.nearGain = 0.12;
      state.taskPreset = "private";
      if (!state.holdoutOpened) {
        state.candidateCount = 12;
        state.testCount = 10;
        state.holdoutResult = null;
      }
      renderContamination();
      renderWinner();
      renderDistribution();
      if (api && typeof api.announce === "function") {
        api.announce(
          root,
          state.holdoutOpened
            ? "未冻结实验已重置；私有 holdout 与公开选择参数仍保持锁定。"
            : "实验已重置；私有 holdout 仍未打开。"
        );
      }
    });

    renderContamination();
    renderWinner();
    renderDistribution();
  }

  window.CourseLearning.register("benchmark-contamination", buildLab);
})();
