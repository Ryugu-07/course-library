(function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var TAU = 2 * Math.PI;
  var TSIRELSON_BOUND = 2 * Math.sqrt(2);
  var DEFAULT_SEED = 20260813;
  var EPSILON = 1e-10;
  var instanceCount = 0;

  var SETTING_ORDER = [
    { id: "ab", label: "E(a,b)", aKey: "a", bKey: "b", sign: 1 },
    { id: "abp", label: "E(a,b′)", aKey: "a", bKey: "bp", sign: 1 },
    { id: "apb", label: "E(a′,b)", aKey: "ap", bKey: "b", sign: 1 },
    { id: "apbp", label: "E(a′,b′)", aKey: "ap", bKey: "bp", sign: -1 }
  ];

  var DEFAULTS = {
    model: "quantum",
    shots: 1600,
    seed: DEFAULT_SEED,
    a: 0,
    ap: 90,
    b: 45,
    bp: -45
  };

  var PRESETS = [
    {
      id: "classical",
      label: "经典可达",
      description: "局域隐藏变量 toy；理论 |S|=2",
      values: { model: "classical", shots: 800, a: 0, ap: 90, b: 45, bp: -45 }
    },
    {
      id: "quantum-optimal",
      label: "量子最优",
      description: "singlet；|S|=2√2",
      values: { model: "quantum", shots: 1600, a: 0, ap: 90, b: 45, bp: -45 }
    },
    {
      id: "non-optimal",
      label: "非最优角",
      description: "仍为 singlet，但角度不最大化 S",
      values: { model: "quantum", shots: 800, a: 0, ap: 90, b: 15, bp: 75 }
    },
    {
      id: "finite-sample",
      label: "有限样本",
      description: "量子最优角；小 shots 看涨落",
      values: { model: "quantum", shots: 24, a: 0, ap: 90, b: 45, bp: -45 }
    }
  ];

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function asFinite(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function normalizeAngle(degrees) {
    var value = asFinite(degrees, 0) % 360;
    return value < 0 ? value + 360 : value;
  }

  function angleDistance(degreesA, degreesB) {
    var difference = Math.abs(normalizeAngle(degreesA) - normalizeAngle(degreesB));
    return Math.min(difference, 360 - difference);
  }

  function radians(degrees) {
    return (asFinite(degrees, 0) * Math.PI) / 180;
  }

  function quantumCorrelation(degreesA, degreesB) {
    return -Math.cos(radians(degreesA - degreesB));
  }

  /* A local toy model: λ is shared, A=sgn cos(λ-a), B=-sgn cos(λ-b). */
  function classicalCorrelation(degreesA, degreesB) {
    return -1 + (2 * angleDistance(degreesA, degreesB)) / 180;
  }

  function correlation(model, degreesA, degreesB) {
    return model === "classical"
      ? classicalCorrelation(degreesA, degreesB)
      : quantumCorrelation(degreesA, degreesB);
  }

  function jointProbabilities(model, degreesA, degreesB) {
    var e = correlation(model, degreesA, degreesB);
    return {
      pp: (1 + e) / 4,
      pm: (1 - e) / 4,
      mp: (1 - e) / 4,
      mm: (1 + e) / 4
    };
  }

  function makeRng(seed) {
    var state = (asFinite(seed, DEFAULT_SEED) >>> 0);
    return function () {
      state = (Math.imul(1664525, state) + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  function settingSeed(seed, index) {
    var mixed = ((asFinite(seed, DEFAULT_SEED) >>> 0) ^ Math.imul(index + 1, 0x9e3779b9)) >>> 0;
    mixed ^= mixed >>> 16;
    mixed = Math.imul(mixed, 0x85ebca6b) >>> 0;
    mixed ^= mixed >>> 13;
    return mixed >>> 0;
  }

  function emptyCounts() {
    return { pp: 0, pm: 0, mp: 0, mm: 0 };
  }

  function addOutcome(counts, alice, bob) {
    if (alice === 1 && bob === 1) counts.pp += 1;
    else if (alice === 1 && bob === -1) counts.pm += 1;
    else if (alice === -1 && bob === 1) counts.mp += 1;
    else counts.mm += 1;
  }

  function simulateSetting(model, degreesA, degreesB, shots, seed, index) {
    var counts = emptyCounts();
    var n = Math.max(0, Math.floor(asFinite(shots, 0)));
    if (n === 0) return counts;

    var rng = makeRng(settingSeed(seed, index));
    var aRadians = radians(degreesA);
    var bRadians = radians(degreesB);
    var probabilities = jointProbabilities(model, degreesA, degreesB);

    for (var shot = 0; shot < n; shot += 1) {
      if (model === "classical") {
        var lambda = TAU * rng();
        var alice = Math.cos(lambda - aRadians) >= 0 ? 1 : -1;
        var bob = Math.cos(lambda - bRadians) >= 0 ? -1 : 1;
        addOutcome(counts, alice, bob);
      } else {
        var draw = rng();
        if (draw < probabilities.pp) addOutcome(counts, 1, 1);
        else if (draw < probabilities.pp + probabilities.pm) addOutcome(counts, 1, -1);
        else if (draw < probabilities.pp + probabilities.pm + probabilities.mp) addOutcome(counts, -1, 1);
        else addOutcome(counts, -1, -1);
      }
    }
    return counts;
  }

  function countTotal(counts) {
    return counts.pp + counts.pm + counts.mp + counts.mm;
  }

  function estimateCorrelation(counts) {
    var total = countTotal(counts);
    return total === 0 ? null : (counts.pp + counts.mm - counts.pm - counts.mp) / total;
  }

  function estimateStandardError(counts) {
    var total = countTotal(counts);
    var estimate = estimateCorrelation(counts);
    if (total < 2 || estimate === null) return null;
    return Math.sqrt(Math.max(0, 1 - estimate * estimate) / (total - 1));
  }

  function marginalRate(counts, side) {
    var total = countTotal(counts);
    if (total === 0) return null;
    return side === "alice"
      ? (counts.pp + counts.pm) / total
      : (counts.pp + counts.mp) / total;
  }

  function signedCHSH(values) {
    return values[0] + values[1] + values[2] - values[3];
  }

  function theoreticalCHSH(model, angles) {
    return signedCHSH([
      correlation(model, angles.a, angles.b),
      correlation(model, angles.a, angles.bp),
      correlation(model, angles.ap, angles.b),
      correlation(model, angles.ap, angles.bp)
    ]);
  }

  function normalizedConfig(config) {
    var source = config || {};
    return {
      model: source.model === "classical" ? "classical" : "quantum",
      shots: clamp(Math.floor(asFinite(source.shots, DEFAULTS.shots)), 0, 20000),
      seed: asFinite(source.seed, DEFAULT_SEED) >>> 0,
      a: asFinite(source.a, DEFAULTS.a),
      ap: asFinite(source.ap, DEFAULTS.ap),
      b: asFinite(source.b, DEFAULTS.b),
      bp: asFinite(source.bp, DEFAULTS.bp)
    };
  }

  function simulate(config) {
    var settings = normalizedConfig(config);
    var rows = SETTING_ORDER.map(function (setting, index) {
      var degreesA = settings[setting.aKey];
      var degreesB = settings[setting.bKey];
      var counts = simulateSetting(
        settings.model,
        degreesA,
        degreesB,
        settings.shots,
        settings.seed,
        index
      );
      return {
        id: setting.id,
        label: setting.label,
        sign: setting.sign,
        a: degreesA,
        b: degreesB,
        counts: counts,
        n: countTotal(counts),
        estimate: estimateCorrelation(counts),
        standardError: estimateStandardError(counts),
        theory: correlation(settings.model, degreesA, degreesB),
        singletTheory: quantumCorrelation(degreesA, degreesB)
      };
    });

    var complete = rows.every(function (row) { return row.n > 0; });
    var uncertaintyAvailable = rows.every(function (row) { return row.n > 1; });
    var sampleS = complete ? signedCHSH(rows.map(function (row) { return row.estimate; })) : null;
    var standardError = uncertaintyAvailable
      ? Math.sqrt(rows.reduce(function (sum, row) {
        return sum + row.standardError * row.standardError;
      }, 0))
      : null;
    var singletS = theoreticalCHSH("quantum", settings);
    var modelS = theoreticalCHSH(settings.model, settings);

    return {
      model: settings.model,
      shots: settings.shots,
      seed: settings.seed,
      angles: { a: settings.a, ap: settings.ap, b: settings.b, bp: settings.bp },
      rows: rows,
      modelS: modelS,
      singletS: singletS,
      sampleS: sampleS,
      sampleAbsS: sampleS === null ? null : Math.abs(sampleS),
      standardError: standardError,
      ci95: sampleS === null || standardError === null ? null : {
        low: sampleS - 1.96 * standardError,
        high: sampleS + 1.96 * standardError
      },
      marginals: {
        aliceA: { b: marginalRate(rows[0].counts, "alice"), bp: marginalRate(rows[1].counts, "alice") },
        aliceAp: { b: marginalRate(rows[2].counts, "alice"), bp: marginalRate(rows[3].counts, "alice") },
        bobB: { a: marginalRate(rows[0].counts, "bob"), ap: marginalRate(rows[2].counts, "bob") },
        bobBp: { a: marginalRate(rows[1].counts, "bob"), ap: marginalRate(rows[3].counts, "bob") }
      }
    };
  }

  function closeEnough(left, right, tolerance) {
    return Math.abs(left - right) <= tolerance;
  }

  function assertTest(condition, message) {
    if (!condition) throw new Error("CHSH self-test failed: " + message);
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      assertTest(condition, message);
    }

    var optimal = simulate({
      model: "quantum", shots: 100, seed: DEFAULT_SEED, a: 0, ap: 90, b: 45, bp: -45
    });
    check(closeEnough(optimal.singletS, -TSIRELSON_BOUND, EPSILON), "singlet optimal sign");
    check(closeEnough(Math.abs(optimal.singletS), TSIRELSON_BOUND, EPSILON), "Tsirelson value");
    check(closeEnough(optimal.modelS, optimal.singletS, EPSILON), "quantum model equals singlet");

    var zero = simulate({ model: "quantum", shots: 0, seed: DEFAULT_SEED });
    check(zero.sampleS === null, "zero shots has no S estimate");
    check(zero.rows.every(function (row) { return row.n === 0 && countTotal(row.counts) === 0; }), "zero-shot counts");

    var one = simulate({ model: "quantum", shots: 1, seed: DEFAULT_SEED });
    check(one.rows.every(function (row) { return row.n === 1 && countTotal(row.counts) === 1; }), "one-shot counts");
    check(one.standardError === null && one.ci95 === null, "one-shot uncertainty is undefined");

    var two = simulate({ model: "quantum", shots: 2, seed: DEFAULT_SEED });
    check(two.standardError !== null && two.ci95 !== null, "two-shot uncertainty is available");

    var repeatA = simulate({ model: "quantum", shots: 37, seed: DEFAULT_SEED, a: 12, ap: 271, b: -44, bp: 181 });
    var repeatB = simulate({ model: "quantum", shots: 37, seed: DEFAULT_SEED, a: 12, ap: 271, b: -44, bp: 181 });
    check(JSON.stringify(repeatA.rows.map(function (row) { return row.counts; })) === JSON.stringify(repeatB.rows.map(function (row) { return row.counts; })), "fixed seed reproducibility");

    check(closeEnough(quantumCorrelation(17, 33), quantumCorrelation(377, 393), EPSILON), "quantum 360-degree periodicity");
    check(closeEnough(classicalCorrelation(-19, 41), classicalCorrelation(341, 401), EPSILON), "classical 360-degree periodicity");

    var joint = jointProbabilities("quantum", 0, 45);
    check(closeEnough(joint.pp + joint.pm + joint.mp + joint.mm, 1, EPSILON), "joint probabilities normalize");
    check(closeEnough(joint.pp + joint.pm, 0.5, EPSILON) && closeEnough(joint.pp + joint.mp, 0.5, EPSILON), "singlet no-signaling marginals");

    var grid = [-180, -120, -60, 0, 60, 120, 180];
    grid.forEach(function (a) {
      grid.forEach(function (ap) {
        grid.forEach(function (b) {
          grid.forEach(function (bp) {
            var angles = { a: a, ap: ap, b: b, bp: bp };
            check(Math.abs(theoreticalCHSH("quantum", angles)) <= TSIRELSON_BOUND + 1e-9, "quantum Tsirelson grid");
            check(Math.abs(theoreticalCHSH("classical", angles)) <= 2 + 1e-9, "classical CHSH grid");
          });
        });
      });
    });

    return { ok: true, checks: checks, seed: DEFAULT_SEED };
  }

  var pureModel = {
    DEFAULTS: DEFAULTS,
    PRESETS: PRESETS,
    SETTING_ORDER: SETTING_ORDER,
    TSIRELSON_BOUND: TSIRELSON_BOUND,
    quantumCorrelation: quantumCorrelation,
    classicalCorrelation: classicalCorrelation,
    jointProbabilities: jointProbabilities,
    theoreticalCHSH: theoreticalCHSH,
    simulate: simulate,
    selfTest: selfTest
  };

  if (typeof module === "object" && module.exports) {
    module.exports = pureModel;
    if (typeof require !== "undefined" && require.main === module && process.argv.indexOf("--self-test") !== -1) {
      try {
        var report = selfTest();
        console.log("CHSH self-test: ok (" + report.checks + " checks, seed " + report.seed + ")");
      } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
      }
    }
    return;
  }

  if (!host || !host.CourseLearning || typeof host.CourseLearning.register !== "function") return;

  var STYLE_ID = "chsh-experiment-styles";
  var STYLE_TEXT = [
    ".chsh-lab { --chsh-bg: var(--bg); --chsh-panel: var(--block-bg); --chsh-panel-2: var(--bg); --chsh-ink: var(--fg); --chsh-muted: var(--fg-soft); --chsh-border: var(--border); --chsh-accent: var(--accent); --chsh-green: var(--cl-green, #39734d); --chsh-amber: var(--cl-gold, #9b6a12); --chsh-red: var(--cl-red, #b64335); --chsh-pp: var(--link, var(--accent)); --chsh-pm: var(--cl-green, #39734d); --chsh-mp: var(--cl-gold, #9b6a12); --chsh-mm: var(--cl-red, #b64335); width: 100%; max-width: 100%; margin: 0; padding: 16px; border: 1px solid var(--chsh-border); border-radius: 8px; background: var(--chsh-bg); color: var(--chsh-ink); font-size: 14px; line-height: 1.55; overflow: hidden; }",
    ".chsh-lab *, .chsh-lab *::before, .chsh-lab *::after { box-sizing: border-box; }",
    ".chsh-lab .chsh-shell { min-width: 0; }",
    ".chsh-lab .chsh-heading { margin: 0 0 5px; color: var(--chsh-ink); font-size: 1.22rem; line-height: 1.35; }",
    ".chsh-lab .chsh-intro, .chsh-lab .chsh-note { margin: 7px 0; color: var(--chsh-muted); }",
    ".chsh-lab .chsh-preset-box { margin: 14px 0; padding: 0; border: 0; }",
    ".chsh-lab .chsh-preset-box legend { margin-bottom: 7px; color: var(--chsh-muted); font-weight: 700; }",
    ".chsh-lab .chsh-preset-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }",
    ".chsh-lab button, .chsh-lab select, .chsh-lab input[type=number] { min-height: 44px; border: 1px solid var(--chsh-border); border-radius: 6px; background: var(--chsh-panel); color: var(--chsh-ink); font: inherit; }",
    ".chsh-lab button { padding: 8px 10px; cursor: pointer; line-height: 1.3; }",
    ".chsh-lab button:hover:not(:disabled), .chsh-lab select:hover, .chsh-lab input:hover { border-color: var(--chsh-accent); }",
    ".chsh-lab button[aria-pressed=true], .chsh-lab .chsh-primary { border-color: var(--chsh-accent); background: var(--chsh-accent); color: var(--chsh-bg); font-weight: 700; }",
    ".chsh-lab button:disabled { cursor: not-allowed; opacity: .55; }",
    ".chsh-lab button:focus-visible, .chsh-lab select:focus-visible, .chsh-lab input:focus-visible { outline: 3px solid var(--chsh-accent); outline-offset: 2px; }",
    ".chsh-lab .chsh-preset { min-height: 54px; text-align: left; }",
    ".chsh-lab .chsh-preset small { display: block; margin-top: 3px; color: var(--chsh-muted); font-size: 11px; line-height: 1.3; }",
    ".chsh-lab .chsh-preset[aria-pressed=true] small { color: var(--chsh-bg); }",
    ".chsh-lab .chsh-controls { display: grid; gap: 10px; margin: 14px 0; padding: 12px; border: 1px solid var(--chsh-border); border-radius: 7px; background: var(--chsh-panel); }",
    ".chsh-lab .chsh-field { display: grid; gap: 5px; min-width: 0; }",
    ".chsh-lab .chsh-field-caption { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 6px; color: var(--chsh-muted); font-size: 12.5px; font-weight: 650; }",
    ".chsh-lab .chsh-output { color: var(--chsh-accent); font-variant-numeric: tabular-nums; }",
    ".chsh-lab select, .chsh-lab input[type=number] { width: 100%; padding: 7px 9px; }",
    ".chsh-lab input[type=range] { width: 100%; min-height: 44px; margin: 0; accent-color: var(--chsh-accent); }",
    ".chsh-lab .chsh-angle-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }",
    ".chsh-lab .chsh-action-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 2px; }",
    ".chsh-lab .chsh-formula { margin: 12px 0; padding: 10px 11px; border-left: 3px solid var(--chsh-accent); background: var(--chsh-panel); color: var(--chsh-ink); font-family: \"SF Mono\", Menlo, Consolas, monospace; font-size: 12px; line-height: 1.65; overflow-wrap: anywhere; }",
    ".chsh-lab .chsh-status { min-height: 3.1em; margin: 10px 0; padding: 9px 11px; border-left: 3px solid var(--chsh-amber); background: var(--chsh-panel-2); color: var(--chsh-ink); }",
    ".chsh-lab .chsh-subsection { margin-top: 16px; padding-top: 13px; border-top: 1px solid var(--chsh-border); }",
    ".chsh-lab h4 { margin: 0 0 7px; color: var(--chsh-ink); font-size: 1rem; }",
    ".chsh-lab .chsh-svg-wrap { padding: 7px; border: 1px solid var(--chsh-border); border-radius: 7px; background: var(--chsh-panel); }",
    ".chsh-lab svg { display: block; width: 100%; height: auto; color: var(--chsh-ink); }",
    ".chsh-lab svg text { fill: currentColor; font-family: inherit; letter-spacing: 0; }",
    ".chsh-lab .chsh-table-wrap { max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }",
    ".chsh-lab table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 11.5px; font-variant-numeric: tabular-nums; }",
    ".chsh-lab caption { padding: 0 0 7px; text-align: left; color: var(--chsh-muted); font-size: 12px; }",
    ".chsh-lab th, .chsh-lab td { padding: 7px 3px; border-bottom: 1px solid var(--chsh-border); text-align: center; overflow-wrap: anywhere; }",
    ".chsh-lab th { color: var(--chsh-muted); font-weight: 700; }",
    ".chsh-lab th:first-child, .chsh-lab td:first-child { width: 20%; text-align: left; }",
    ".chsh-lab .chsh-count-pp { color: var(--chsh-pp); } .chsh-lab .chsh-count-pm { color: var(--chsh-pm); } .chsh-lab .chsh-count-mp { color: var(--chsh-mp); } .chsh-lab .chsh-count-mm { color: var(--chsh-mm); }",
    ".chsh-lab .chsh-metric-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; margin: 12px 0; }",
    ".chsh-lab .chsh-metric { min-width: 0; padding: 9px; border-top: 2px solid var(--chsh-border); background: var(--chsh-panel); }",
    ".chsh-lab .chsh-metric span { display: block; color: var(--chsh-muted); font-size: 11px; line-height: 1.4; }",
    ".chsh-lab .chsh-metric strong { display: block; margin-top: 3px; color: var(--chsh-ink); font-size: 15px; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }",
    ".chsh-lab .chsh-metric small { display: block; margin-top: 3px; color: var(--chsh-muted); font-size: 10.5px; line-height: 1.35; }",
    ".chsh-lab .chsh-theory-note { margin: 9px 0; color: var(--chsh-muted); font-size: 12.5px; }",
    ".chsh-lab .chsh-warning { margin: 13px 0 0; padding: 10px 11px; border-left: 3px solid var(--chsh-red); background: var(--chsh-panel-2); color: var(--chsh-muted); font-size: 12.5px; line-height: 1.65; }",
    ".chsh-lab .chsh-warning strong { color: var(--chsh-red); }",
    ".chsh-lab .chsh-legend { display: flex; flex-wrap: wrap; gap: 5px 10px; margin: 7px 2px 0; color: var(--chsh-muted); font-size: 11px; }",
    ".chsh-lab .chsh-legend span { display: inline-flex; align-items: center; gap: 4px; }",
    ".chsh-lab .chsh-swatch { display: inline-block; width: 12px; height: 10px; border-radius: 2px; }",
    ".chsh-lab .chsh-muted { color: var(--chsh-muted); }",
    "@media (max-width: 390px) { .chsh-lab { padding: 12px; } .chsh-lab .chsh-angle-grid, .chsh-lab .chsh-action-row { grid-template-columns: minmax(0, 1fr); } .chsh-lab table { font-size: 10.5px; } .chsh-lab th, .chsh-lab td { padding-left: 2px; padding-right: 2px; } }",
    "@media (prefers-reduced-motion: reduce) { .chsh-lab * { scroll-behavior: auto !important; transition: none !important; animation: none !important; } }"
  ].join("\n");

  function installStyles(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }

  function make(api, tag, attrs, children) {
    return api.el(tag, attrs || {}, children);
  }

  function makeSvg(api, tag, attrs, children) {
    return api.svg(tag, attrs || {}, children);
  }

  function replaceContents(node, children) {
    if (typeof node.replaceChildren === "function") node.replaceChildren.apply(node, children);
    else {
      while (node.firstChild) node.removeChild(node.firstChild);
      children.forEach(function (child) { node.appendChild(child); });
    }
  }

  function formatNumber(api, value, digits) {
    if (value === null || value === undefined || !Number.isFinite(value)) return "—";
    return api && typeof api.format === "function" ? api.format(value, digits) : value.toFixed(digits || 3);
  }

  function formatSigned(api, value, digits) {
    if (value === null || value === undefined || !Number.isFinite(value)) return "—";
    if (Math.abs(value) < 0.5 * Math.pow(10, -(digits || 3))) return "0";
    return value > 0 ? "+" + formatNumber(api, value, digits) : formatNumber(api, value, digits);
  }

  function formatRate(value) {
    return value === null || value === undefined ? "—" : (100 * value).toFixed(1) + "%";
  }

  function formatCount(value) {
    return String(value);
  }

  function metric(api, label, value, note) {
    return make(api, "div", { className: "chsh-metric" }, [
      make(api, "span", { text: label }),
      make(api, "strong", { text: value }),
      make(api, "small", { text: note })
    ]);
  }

  function settingText(row) {
    return row.label;
  }

  function renderMetrics(api, node, result) {
    var currentLabel = result.model === "quantum" ? "当前 singlet 理论" : "当前局域模型理论";
    replaceContents(node, [
      metric(api, "局域隐藏变量上限", "|S| ≤ 2", "CHSH 的模型界"),
      metric(api, "singlet 理论", formatSigned(api, result.singletS, 3), "|S|≤2√2；带符号 S"),
      metric(api, currentLabel, formatSigned(api, result.modelS, 3), "当前四个角度的预测"),
      metric(api, "样本 Ŝ / |Ŝ|", result.sampleS === null ? "—" : formatSigned(api, result.sampleS, 3) + " / " + formatNumber(api, result.sampleAbsS, 3), "四组各 n=" + result.shots),
      metric(api, "标准误差 SE(Ŝ)", formatNumber(api, result.standardError, 3), "n<2 时不定义"),
      metric(api, "约 95% 区间", result.ci95 === null ? "—" : "[" + formatNumber(api, result.ci95.low, 3) + ", " + formatNumber(api, result.ci95.high, 3) + "]", "近似；小 shots 只作涨落提示")
    ]);
  }

  function renderCountsTable(api, node, result) {
    var table = make(api, "table", { "aria-label": "四组联合结果计数" });
    table.appendChild(make(api, "caption", { text: "四组联合结果（每个设置各发射 n=shots 对）" }));
    var headRow = make(api, "tr", {}, [
      make(api, "th", { scope: "col", text: "设置" }),
      make(api, "th", { scope: "col", className: "chsh-count-pp", text: "++" }),
      make(api, "th", { scope: "col", className: "chsh-count-pm", text: "+−" }),
      make(api, "th", { scope: "col", className: "chsh-count-mp", text: "−+" }),
      make(api, "th", { scope: "col", className: "chsh-count-mm", text: "−−" }),
      make(api, "th", { scope: "col", text: "n" }),
      make(api, "th", { scope: "col", text: "Ê" })
    ]);
    table.appendChild(make(api, "thead", {}, [headRow]));
    var body = make(api, "tbody");
    result.rows.forEach(function (row) {
      var cells = [
        make(api, "th", { scope: "row", text: settingText(row) }),
        make(api, "td", { className: "chsh-count-pp", text: formatCount(row.counts.pp) }),
        make(api, "td", { className: "chsh-count-pm", text: formatCount(row.counts.pm) }),
        make(api, "td", { className: "chsh-count-mp", text: formatCount(row.counts.mp) }),
        make(api, "td", { className: "chsh-count-mm", text: formatCount(row.counts.mm) }),
        make(api, "td", { text: formatCount(row.n) }),
        make(api, "td", { text: formatSigned(api, row.estimate, 3) })
      ];
      body.appendChild(make(api, "tr", {}, cells));
    });
    table.appendChild(body);
    replaceContents(node, [make(api, "div", { className: "chsh-table-wrap" }, [table])]);
  }

  function svgText(api, x, y, text, attrs) {
    var merged = { x: x, y: y, "font-size": "11", fill: "currentColor" };
    Object.keys(attrs || {}).forEach(function (key) { merged[key] = attrs[key]; });
    return makeSvg(api, "text", merged, [text]);
  }

  function renderVisual(api, node, result) {
    var svg = node;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.setAttribute("viewBox", "0 0 360 286");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "四组联合计数比例以及带符号 S 的位置");
    svg.appendChild(makeSvg(api, "title", {}, ["四组联合计数比例与 CHSH S"]));
    svg.appendChild(svgText(api, 2, 14, "四组结果的相对比例", { "font-size": "12", "font-weight": "700" }));

    var colors = ["var(--chsh-pp)", "var(--chsh-pm)", "var(--chsh-mp)", "var(--chsh-mm)"];
    var keys = ["pp", "pm", "mp", "mm"];
    result.rows.forEach(function (row, rowIndex) {
      var y = 24 + rowIndex * 29;
      svg.appendChild(svgText(api, 2, y + 14, row.label, { "font-size": "11" }));
      var total = row.n;
      var x = 72;
      if (total === 0) {
        svg.appendChild(makeSvg(api, "rect", { x: 72, y: y + 2, width: 218, height: 18, fill: "none", stroke: "var(--chsh-border)", "stroke-dasharray": "3 3", rx: 2 }));
      } else {
        keys.forEach(function (key, keyIndex) {
          var width = 218 * row.counts[key] / total;
          if (width <= 0) return;
          svg.appendChild(makeSvg(api, "rect", { x: x, y: y + 2, width: width, height: 18, fill: colors[keyIndex] }));
          x += width;
        });
      }
      svg.appendChild(svgText(api, 299, y + 15, "Ê=" + formatSigned(api, row.estimate, 2), { "font-size": "10.5" }));
    });

    var legendY = 151;
    ["++", "+−", "−+", "−−"].forEach(function (label, index) {
      var x = 4 + (index % 2) * 74;
      var y = legendY + Math.floor(index / 2) * 16;
      svg.appendChild(makeSvg(api, "rect", { x: x, y: y - 9, width: 10, height: 10, fill: colors[index], rx: 2 }));
      svg.appendChild(svgText(api, x + 14, y, label, { "font-size": "10.5" }));
    });
    svg.appendChild(svgText(api, 160, 168, "S 的带符号位置（本约定：前三项 +，最后一项 −）", { "font-size": "10.5", fill: "var(--chsh-muted)" }));

    var left = 27;
    var right = 335;
    var axisY = 244;
    function xForS(value) {
      return left + ((value + TSIRELSON_BOUND) / (2 * TSIRELSON_BOUND)) * (right - left);
    }
    svg.appendChild(makeSvg(api, "line", { x1: left, y1: axisY, x2: right, y2: axisY, stroke: "var(--chsh-border)", "stroke-width": 1.5 }));
    [-TSIRELSON_BOUND, -2, 0, 2, TSIRELSON_BOUND].forEach(function (tick) {
      var xTick = xForS(tick);
      svg.appendChild(makeSvg(api, "line", { x1: xTick, y1: axisY - 8, x2: xTick, y2: axisY + 8, stroke: Math.abs(tick) === 2 ? "var(--chsh-amber)" : "var(--chsh-border)", "stroke-width": Math.abs(tick) === 2 ? 2 : 1 }));
      var label = closeEnough(tick, -TSIRELSON_BOUND, 1e-6) ? "−2√2" : closeEnough(tick, TSIRELSON_BOUND, 1e-6) ? "2√2" : formatNumber(api, tick, 0);
      svg.appendChild(svgText(api, xTick, axisY + 22, label, { "text-anchor": "middle", "font-size": "10.5" }));
    });
    svg.appendChild(svgText(api, 2, axisY - 13, "S", { "font-size": "11", "font-weight": "700" }));
    svg.appendChild(svgText(api, right, axisY - 13, "橙色刻度 = 局域界 ±2", { "text-anchor": "end", "font-size": "10.5", fill: "var(--chsh-muted)" }));

    if (result.sampleS !== null) {
      var sampleX = xForS(clamp(result.sampleS, -TSIRELSON_BOUND, TSIRELSON_BOUND));
      svg.appendChild(makeSvg(api, "line", { x1: sampleX, y1: axisY - 31, x2: sampleX, y2: axisY + 8, stroke: "var(--chsh-accent)", "stroke-width": 2.5 }));
      svg.appendChild(svgText(api, sampleX, axisY - 35, "Ŝ", { "text-anchor": "middle", "font-size": "11", "font-weight": "700", fill: "var(--chsh-accent)" }));
    }
    var modelX = xForS(clamp(result.modelS, -TSIRELSON_BOUND, TSIRELSON_BOUND));
    svg.appendChild(makeSvg(api, "circle", { cx: modelX, cy: axisY - 8, r: 4, fill: "var(--chsh-green)" }));
    svg.appendChild(svgText(api, modelX, axisY - 13, "理论", { "text-anchor": "middle", "font-size": "9.5", fill: "var(--chsh-green)" }));
  }

  function deltaText(first, second) {
    if (first === null || second === null) return "—";
    return formatRate(Math.abs(first - second));
  }

  function renderMarginals(api, node, result) {
    var table = make(api, "table", { "aria-label": "no-signaling 边缘概率比较" });
    var modelLabel = result.model === "quantum" ? "理想 singlet" : "当前局域 toy";
    table.appendChild(make(api, "caption", { text: modelLabel + "：每个边缘的 + 率都是 50%；样本差异是涨落" }));
    table.appendChild(make(api, "thead", {}, [make(api, "tr", {}, [
      make(api, "th", { scope: "col", text: "边缘" }),
      make(api, "th", { scope: "col", text: "固定" }),
      make(api, "th", { scope: "col", text: "第一选项" }),
      make(api, "th", { scope: "col", text: "第二选项" }),
      make(api, "th", { scope: "col", text: "|Δ|" })
    ])]));
    var comparisons = [
      ["Alice +", "A=a", "B=b", "B=b′", result.marginals.aliceA.b, result.marginals.aliceA.bp],
      ["Alice +", "A=a′", "B=b", "B=b′", result.marginals.aliceAp.b, result.marginals.aliceAp.bp],
      ["Bob +", "B=b", "A=a", "A=a′", result.marginals.bobB.a, result.marginals.bobB.ap],
      ["Bob +", "B=b′", "A=a", "A=a′", result.marginals.bobBp.a, result.marginals.bobBp.ap]
    ];
    var body = make(api, "tbody");
    comparisons.forEach(function (comparison) {
      body.appendChild(make(api, "tr", {}, [
        make(api, "th", { scope: "row", text: comparison[0] }),
        make(api, "td", { text: comparison[1] }),
        make(api, "td", { text: comparison[2] + ": " + formatRate(comparison[4]) }),
        make(api, "td", { text: comparison[3] + ": " + formatRate(comparison[5]) }),
        make(api, "td", { text: deltaText(comparison[4], comparison[5]) })
      ]));
    });
    table.appendChild(body);
    replaceContents(node, [make(api, "div", { className: "chsh-table-wrap" }, [table])]);
  }

  function statusText(result) {
    if (result.shots === 0) {
      return "shots=0：四组计数均为空，所以 Ŝ、标准误差和区间都没有定义；理论曲线仍然可读。";
    }
    var uncertainty = result.ci95 === null
      ? "标准误差/区间：n<2，未定义。"
      : "约 95% 区间 [" + formatNumber(null, result.ci95.low, 3) + ", " + formatNumber(null, result.ci95.high, 3) + "]。";
    var text = "固定 seed " + result.seed + "：Ŝ=" + formatSigned(null, result.sampleS, 3) + "，|Ŝ|=" + formatNumber(null, result.sampleAbsS, 3) + "；" + uncertainty;
    if (result.model === "classical") {
      return text + " 当前抽样来自显式局域隐藏变量 toy，理论上不能超过 |S|=2；若样本短暂越过刻度，这里只能称为抽样涨落，仍不是 loophole-free Bell 证据。";
    }
    if (Math.abs(result.modelS) > 2 + EPSILON) {
      return text + " 当前样本是在估计一个理论上已越过局域界的 singlet 期望；但这只是本页理想 toy 抽样，不是实验认证。";
    }
    if (result.sampleAbsS > 2) {
      return text + " 本次样本越过 2 只是估计涨落，不能称为 loophole-free Bell 证据。";
    }
    return text + " 量子 singlet 的理论值与有限样本估计要分开读。";
  }

  function mount(root, api) {
    var doc = host.document;
    installStyles(doc);
    root.classList.add("chsh-lab");
    var uid = "cl-chsh-" + (instanceCount += 1);
    var state = { preset: "quantum-optimal" };
    var refs = {};
    var presetButtons = [];

    var shell = make(api, "div", { className: "chsh-shell" });
    shell.appendChild(make(api, "h3", { className: "chsh-heading", text: "CHSH 实验台：四组计数怎样组成 Bell 数？" }));
    shell.appendChild(make(api, "p", { className: "chsh-intro", text: "每个设置独立发射 n 对。固定 seed 让同一组角度与 shots 可复现；调小 shots 才会显出有限样本涨落。" }));

    var presetBox = make(api, "fieldset", { className: "chsh-preset-box" });
    presetBox.appendChild(make(api, "legend", { text: "预设（先比较模型，再改角度）" }));
    var presetGrid = make(api, "div", { className: "chsh-preset-grid" });
    PRESETS.forEach(function (preset) {
      var button = make(api, "button", { type: "button", className: "chsh-preset", "aria-pressed": "false" }, [
        preset.label,
        make(api, "small", { text: preset.description })
      ]);
      button.addEventListener("click", function () {
        state.preset = preset.id;
        refs.model.value = preset.values.model;
        refs.shots.value = String(preset.values.shots);
        ["a", "ap", "b", "bp"].forEach(function (key) {
          refs[key].value = String(preset.values[key]);
        });
        update(true);
      });
      presetButtons.push({ id: preset.id, node: button });
      presetGrid.appendChild(button);
    });
    presetBox.appendChild(presetGrid);
    shell.appendChild(presetBox);

    var controls = make(api, "div", { className: "chsh-controls" });
    var modelLabel = make(api, "label", { className: "chsh-field", htmlFor: uid + "-model" }, [
      make(api, "span", { className: "chsh-field-caption", text: "关联模型" })
    ]);
    refs.model = make(api, "select", { id: uid + "-model" }, [
      make(api, "option", { value: "quantum", text: "量子 singlet：E=−cos(Δ)" }),
      make(api, "option", { value: "classical", text: "局域隐藏变量 toy：|S|≤2" })
    ]);
    modelLabel.appendChild(refs.model);
    controls.appendChild(modelLabel);

    var shotsLabel = make(api, "label", { className: "chsh-field", htmlFor: uid + "-shots" }, [
      make(api, "span", { className: "chsh-field-caption" }, [
        make(api, "span", { text: "shots / 每个设置" }),
        make(api, "output", { className: "chsh-output", htmlFor: uid + "-shots", text: "0–20,000" })
      ])
    ]);
    refs.shots = make(api, "input", { id: uid + "-shots", type: "number", min: "0", max: "20000", step: "1", value: String(DEFAULTS.shots), inputmode: "numeric" });
    shotsLabel.appendChild(refs.shots);
    controls.appendChild(shotsLabel);

    var angleGrid = make(api, "div", { className: "chsh-angle-grid" });
    [
      ["a", "Alice a"], ["ap", "Alice a′"], ["b", "Bob b"], ["bp", "Bob b′"]
    ].forEach(function (item) {
      var key = item[0];
      var id = uid + "-" + key;
      var field = make(api, "label", { className: "chsh-field", htmlFor: id }, [
        make(api, "span", { className: "chsh-field-caption" }, [
          make(api, "span", { text: item[1] }),
          make(api, "output", { className: "chsh-output", "data-angle-output": key, text: "0°" })
        ])
      ]);
      refs[key] = make(api, "input", { id: id, type: "range", min: "-180", max: "180", step: "1", value: String(DEFAULTS[key]), "aria-label": item[1] + "（度）" });
      field.appendChild(refs[key]);
      angleGrid.appendChild(field);
    });
    controls.appendChild(angleGrid);

    var actionRow = make(api, "div", { className: "chsh-action-row" });
    var runButton = make(api, "button", { type: "button", className: "chsh-primary", text: "按固定 seed 运行" });
    var resetButton = make(api, "button", { type: "button", text: "回到量子最优" });
    actionRow.appendChild(runButton);
    actionRow.appendChild(resetButton);
    controls.appendChild(actionRow);
    shell.appendChild(controls);

    var formula = make(api, "div", { className: "chsh-formula", text: "符号约定：S = E(a,b) + E(a,b′) + E(a′,b) − E(a′,b′)；Bell value = |S|。前三组是 +，最后一组是 −。" });
    shell.appendChild(formula);

    var status = make(api, "p", { className: "chsh-status", "aria-live": "polite", "aria-atomic": "true" });
    shell.appendChild(status);

    var metrics = make(api, "div", { className: "chsh-metric-grid" });
    shell.appendChild(metrics);

    var visualSection = make(api, "section", { className: "chsh-subsection", "aria-labelledby": uid + "-visual-title" });
    visualSection.appendChild(make(api, "h4", { id: uid + "-visual-title", text: "比例图与 Bell 界" }));
    var visualWrap = make(api, "div", { className: "chsh-svg-wrap" });
    var visual = makeSvg(api, "svg", { viewBox: "0 0 360 286", preserveAspectRatio: "xMidYMid meet" });
    visualWrap.appendChild(visual);
    visualSection.appendChild(visualWrap);
    var legend = make(api, "div", { className: "chsh-legend", "aria-label": "计数颜色图例" });
    [["++", "chsh-pp"], ["+−", "chsh-pm"], ["−+", "chsh-mp"], ["−−", "chsh-mm"]].forEach(function (item) {
      legend.appendChild(make(api, "span", {}, [make(api, "i", { className: "chsh-swatch", style: "background:var(--" + item[1] + ");" }), item[0]]));
    });
    visualSection.appendChild(legend);
    shell.appendChild(visualSection);

    var countsSection = make(api, "section", { className: "chsh-subsection", "aria-labelledby": uid + "-counts-title" });
    countsSection.appendChild(make(api, "h4", { id: uid + "-counts-title", text: "四组相关计数与 Ê" }));
    var countsNode = make(api, "div");
    countsSection.appendChild(countsNode);
    shell.appendChild(countsSection);

    var marginalSection = make(api, "section", { className: "chsh-subsection", "aria-labelledby": uid + "-marginal-title" });
    marginalSection.appendChild(make(api, "h4", { id: uid + "-marginal-title", text: "no-signaling：只看单边边缘" }));
    marginalSection.appendChild(make(api, "p", { className: "chsh-note", text: "理想 singlet 的 Alice + 与 Bob + 都是 50%，不依赖远端选择；有限样本的 |Δ| 不必为零。" }));
    var marginalNode = make(api, "div");
    marginalSection.appendChild(marginalNode);
    shell.appendChild(marginalSection);

    shell.appendChild(make(api, "p", { className: "chsh-warning", innerHTML: "" }));
    var warning = shell.lastChild;
    warning.appendChild(make(api, "strong", { text: "证据边界：" }));
    warning.appendChild(doc.createTextNode("本台是理想概率模型的可复现实验，不含探测效率、时空分离、随机设置、预注册分析或漏洞审计。即使固定 seed 的有限样本偶然出现 |Ŝ|>2，也不能把它称为 loophole-free Bell 证据；标准误差只描述这个 toy 抽样的统计涨落。"));

    replaceContents(root, [shell]);

    function readSettings() {
      var settings = {
        model: refs.model.value,
        shots: clamp(Math.floor(asFinite(refs.shots.value, 0)), 0, 20000),
        seed: DEFAULT_SEED
      };
      ["a", "ap", "b", "bp"].forEach(function (key) {
        settings[key] = clamp(Math.round(asFinite(refs[key].value, 0)), -180, 180);
        refs[key].value = String(settings[key]);
        var output = root.querySelector("[data-angle-output=" + key + "]");
        if (output) output.textContent = settings[key] + "°";
      });
      refs.shots.value = String(settings.shots);
      return settings;
    }

    function update(announce) {
      var settings = readSettings();
      var result = simulate(settings);
      presetButtons.forEach(function (item) {
        item.node.setAttribute("aria-pressed", item.id === state.preset ? "true" : "false");
      });
      status.textContent = statusText(result);
      renderMetrics(api, metrics, result);
      renderVisual(api, visual, result);
      renderCountsTable(api, countsNode, result);
      renderMarginals(api, marginalNode, result);
      if (announce && api && typeof api.announce === "function") api.announce(root, status.textContent);
    }

    ["a", "ap", "b", "bp"].forEach(function (key) {
      refs[key].addEventListener("input", function () { state.preset = ""; update(true); });
    });
    refs.model.addEventListener("change", function () { state.preset = ""; update(true); });
    refs.shots.addEventListener("input", function () { state.preset = ""; update(true); });
    refs.shots.addEventListener("change", function () { state.preset = ""; update(true); });
    runButton.addEventListener("click", function () { update(true); });
    resetButton.addEventListener("click", function () {
      var preset = PRESETS[1];
      state.preset = preset.id;
      refs.model.value = preset.values.model;
      refs.shots.value = String(preset.values.shots);
      ["a", "ap", "b", "bp"].forEach(function (key) { refs[key].value = String(preset.values[key]); });
      update(true);
    });

    refs.model.value = DEFAULTS.model;
    refs.shots.value = String(DEFAULTS.shots);
    ["a", "ap", "b", "bp"].forEach(function (key) { refs[key].value = String(DEFAULTS[key]); });
    update(false);
  }

  host.CourseLearning.register("chsh-experiment", function (root, api) {
    mount(root, api);
  });
}(typeof window !== "undefined" ? window : null));
