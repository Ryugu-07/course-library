(function (host, factory) {
  "use strict";

  var exported = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = exported;
    if (require.main === module) {
      exported.assertModel();
      console.log("retrieval-practice: model assertions passed");
    }
  }

  if (
    typeof window !== "undefined" &&
    window.CourseLearning &&
    typeof window.CourseLearning.register === "function"
  ) {
    window.CourseLearning.register("retrieval-practice", exported.buildLab);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-retrieval-practice-styles";
  var INSTANCE_COUNT = 0;
  var EPSILON = 1e-10;
  var DELAYS = [0, 1, 3, 7, 14];
  var DEFAULTS = {
    budget: 12,
    interval: 0.7,
    difficulty: 0.45,
    feedback: 0.85
  };
  var INITIAL_STATE = {
    familiarity: 0.08,
    retrieval: 0.04,
    support: 0.12
  };

  var STRATEGIES = {
    reread: {
      label: "重读",
      shortLabel: "重读",
      description: "再次看材料：迅速抬高熟悉感 F，但对闭卷检索强度 R 的更新很小。"
    },
    retrieval: {
      label: "检索 + 反馈",
      shortLabel: "检索+反馈",
      description: "先合上材料作答；反馈质量决定失败后能否把错误转成学习。"
    },
    mixed: {
      label: "混合安排",
      shortLabel: "混合",
      description: "固定循环：重读、检索、检索；12 个事件中仍与其他策略同预算。"
    }
  };

  var PRESETS = {
    "instant-vs-delay": {
      label: "即时重读占优 → 延迟检索占优",
      note: "中等难度、短间隔、有反馈：适合观察熟悉感与延迟保持分叉。",
      budget: 12,
      interval: 0.7,
      difficulty: 0.45,
      feedback: 0.85
    },
    "no-feedback-boundary": {
      label: "无反馈的检索失败边界",
      note: "难度高且没有反馈：费力不自动等于学习，检索可能反复失败。",
      budget: 12,
      interval: 1.5,
      difficulty: 0.9,
      feedback: 0
    },
    "spacing-feedback": {
      label: "间隔 + 反馈的延迟保持",
      note: "较长间隔、适中难度、有反馈：观察间隔带来的遗忘压力与反馈修复。",
      budget: 12,
      interval: 3.5,
      difficulty: 0.55,
      feedback: 0.9
    }
  };

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function number(value, fallback) {
    var parsed = Number(value);
    return finite(parsed) ? parsed : fallback;
  }

  function normalizeBudget(value) {
    return Math.round(clamp(number(value, DEFAULTS.budget), 1, 24));
  }

  function normalizeParams(input) {
    input = input || {};
    return {
      budget: normalizeBudget(input.budget),
      interval: clamp(number(input.interval, DEFAULTS.interval), 0, 7),
      difficulty: clamp(number(input.difficulty, DEFAULTS.difficulty), 0, 1),
      feedback: clamp(number(input.feedback, DEFAULTS.feedback), 0, 1)
    };
  }

  function spacingSignal(interval) {
    return clamp(number(interval, 0) / 4, 0, 1);
  }

  function actionFor(strategy, eventIndex) {
    if (strategy === "reread") return "reread";
    if (strategy === "retrieval") return "retrieval";
    return eventIndex % 3 === 0 ? "reread" : "retrieval";
  }

  function actionLabel(action) {
    return action === "reread" ? "重读" : "闭卷检索";
  }

  function safeState(value) {
    return clamp(finite(value) ? value : 0, 0, 1);
  }

  /*
   * Deterministic mechanism toy model. F, R, and S are unitless teaching
   * proxies, not observations of a learner. There is no random sampling.
   *
   * F = familiarity / fluency signal; rereading moves it quickly.
   * R = retrieval-strength signal; effortful retrieval moves it.
   * S = feedback/support signal; feedback raises stability and repairs errors.
   */
  function simulate(strategy, input) {
    var params = normalizeParams(input);
    var familiarity = INITIAL_STATE.familiarity;
    var retrieval = INITIAL_STATE.retrieval;
    var support = INITIAL_STATE.support;
    var events = [];
    var index;

    if (!STRATEGIES[strategy]) strategy = "mixed";

    for (index = 0; index < params.budget; index += 1) {
      var gap = index === 0 ? 0 : params.interval;
      var spacing = spacingSignal(params.interval);
      var action;
      var attempt = null;
      var learningGain = 0;
      var feedbackGain = 0;

      /* The same interval is applied before each later event for every arm. */
      familiarity *= Math.exp(
        -(0.012 + 0.015 * params.difficulty) * gap / (0.8 + 0.5 * support)
      );
      retrieval *= Math.exp(
        -(0.035 + 0.025 * params.difficulty) * gap / (0.7 + 1.1 * support)
      );

      action = actionFor(strategy, index);

      if (action === "reread") {
        familiarity +=
          (0.25 + 0.04 * (1 - params.difficulty)) * (1 - familiarity);
        retrieval +=
          0.025 * (1 - 0.3 * params.difficulty) * (1 - retrieval);
        support += 0.008 * (1 - support);
      } else {
        attempt = clamp(
          0.18 +
            0.50 * retrieval +
            0.18 * familiarity +
            0.12 * spacing -
            0.30 * params.difficulty,
          0.02,
          0.98
        );

        var directEffort = 0.03 * attempt;
        var feedbackEffort = params.feedback * (0.13 + 0.10 * (1 - attempt));
        var spacingMultiplier = 1 + 0.12 * spacing;
        learningGain =
          (directEffort + feedbackEffort) * spacingMultiplier * (1 - retrieval);
        feedbackGain = feedbackEffort * spacingMultiplier * (1 - retrieval);

        retrieval += learningGain;
        familiarity +=
          (0.04 * attempt + 0.02 * params.feedback * (1 - attempt)) *
          (1 - familiarity);
        support +=
          (0.06 * attempt + 0.14 * params.feedback) * (1 - support);
      }

      familiarity = safeState(familiarity);
      retrieval = safeState(retrieval);
      support = safeState(support);

      events.push({
        event: index + 1,
        gap: gap,
        action: action,
        attempt: attempt,
        learningGain: learningGain,
        feedbackGain: feedbackGain,
        familiarity: familiarity,
        retrieval: retrieval,
        support: support
      });
    }

    var immediate = safeState(
      0.10 + 0.72 * familiarity + 0.16 * retrieval + 0.04 * support
    );
    var delayedBase = safeState(
      0.03 + 0.68 * retrieval + 0.20 * support + 0.08 * familiarity
    );
    var decayRate = 0.06 + 0.045 * params.difficulty;
    var curve = DELAYS.map(function (delay) {
      return safeState(
        delayedBase *
          Math.exp(-decayRate * delay / (0.85 + 1.5 * support))
      );
    });

    return {
      strategy: strategy,
      label: STRATEGIES[strategy].label,
      params: params,
      events: events,
      finalState: {
        familiarity: familiarity,
        retrieval: retrieval,
        support: support
      },
      immediate: immediate,
      delayedBase: delayedBase,
      curve: curve,
      daySeven: curve[3],
      lastAttempt: events.length ? events[events.length - 1].attempt : null
    };
  }

  function allResults(input) {
    return {
      reread: simulate("reread", input),
      retrieval: simulate("retrieval", input),
      mixed: simulate("mixed", input)
    };
  }

  function maxStrategy(results, key) {
    var keys = ["reread", "retrieval", "mixed"];
    var winner = keys[0];
    keys.slice(1).forEach(function (keyName) {
      if (results[keyName][key] > results[winner][key] + EPSILON) winner = keyName;
    });
    return winner;
  }

  function deepEqual(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
  }

  function assert(condition, message) {
    if (!condition) throw new Error("retrieval-practice assertion failed: " + message);
  }

  function assertUnitInterval(value, label) {
    assert(finite(value), label + " must be finite");
    assert(value >= -EPSILON && value <= 1 + EPSILON, label + " must be in [0, 1]");
  }

  function assertModel() {
    var strategies = ["reread", "retrieval", "mixed"];
    var intervals = [0, 0.7, 2, 7];
    var difficulties = [0, 0.45, 1];
    var feedbacks = [0, 0.5, 1];
    var baseInput = { budget: 12, interval: 1.5, difficulty: 0.5, feedback: 0.8 };
    var i;
    var j;
    var k;

    assert(spacingSignal(0) <= spacingSignal(1) + EPSILON, "spacing signal monotone");
    assert(spacingSignal(1) <= spacingSignal(4) + EPSILON, "spacing signal monotone");
    assert(spacingSignal(4) <= spacingSignal(7) + EPSILON, "spacing signal bounded monotone");

    strategies.forEach(function (strategy) {
      var first = simulate(strategy, baseInput);
      var second = simulate(strategy, baseInput);
      assert(deepEqual(first, second), strategy + " must be deterministic");
      assert(first.events.length === 12, strategy + " must use the shared budget");
      assertUnitInterval(first.immediate, strategy + " immediate");
      first.curve.forEach(function (value, index) {
        assertUnitInterval(value, strategy + " curve[" + index + "]");
        if (index > 0) {
          assert(value <= first.curve[index - 1] + EPSILON, "delay curve must not rise");
        }
      });
      first.events.forEach(function (event) {
        assertUnitInterval(event.familiarity, strategy + " event familiarity");
        assertUnitInterval(event.retrieval, strategy + " event retrieval");
        assertUnitInterval(event.support, strategy + " event support");
        if (event.attempt !== null) assertUnitInterval(event.attempt, strategy + " attempt");
      });
    });

    intervals.forEach(function (interval) {
      difficulties.forEach(function (difficulty) {
        var noFeedback = simulate("retrieval", {
          budget: 12,
          interval: interval,
          difficulty: difficulty,
          feedback: 0
        });
        var fullFeedback = simulate("retrieval", {
          budget: 12,
          interval: interval,
          difficulty: difficulty,
          feedback: 1
        });
        assert(
          fullFeedback.daySeven + EPSILON >= noFeedback.daySeven,
          "feedback must not lower delayed retrieval"
        );
      });
    });

    for (i = 0; i < difficulties.length; i += 1) {
      for (j = 0; j < feedbacks.length; j += 1) {
        for (k = 0; k < intervals.length; k += 1) {
          var result = simulate("mixed", {
            budget: 1 + i + j,
            interval: intervals[k],
            difficulty: difficulties[i],
            feedback: feedbacks[j]
          });
          assert(result.events.length === 1 + i + j, "budget must bound event count");
        }
      }
    }

    var firstPreset = allResults(PRESETS["instant-vs-delay"]);
    assert(
      firstPreset.reread.immediate > firstPreset.retrieval.immediate,
      "first preset must make rereading win immediately"
    );
    assert(
      firstPreset.retrieval.daySeven > firstPreset.reread.daySeven,
      "first preset must make retrieval win after delay"
    );

    var boundary = allResults(PRESETS["no-feedback-boundary"]);
    assert(
      boundary.retrieval.daySeven < boundary.reread.daySeven,
      "no-feedback boundary must expose retrieval failure"
    );
    assert(
      boundary.retrieval.lastAttempt !== null && boundary.retrieval.lastAttempt < 0.1,
      "no-feedback boundary must have a low final attempt"
    );

    return true;
  }

  function formatNumber(value, digits) {
    if (!finite(value)) return "—";
    var places = digits === undefined ? 2 : digits;
    var text = value.toFixed(places);
    text = text.replace(/0+$/, "").replace(/\.$/, "");
    return text === "-0" ? "0" : text;
  }

  function formatPercent(value, digits) {
    return finite(value)
      ? formatNumber(value * 100, digits === undefined ? 1 : digits) + "%"
      : "—";
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
    if (children === undefined || children === null) return node;
    var list = Array.isArray(children) ? children : [children];
    list.forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : node.ownerDocument.createTextNode(String(child)));
    });
    return node;
  }

  function makeElement(api, tag, attrs, children) {
    if (api && typeof api.el === "function") return api.el(tag, attrs || {}, children);
    return appendChildren(
      setAttributes(document.createElement(tag), attrs || {}),
      children
    );
  }

  function makeSvg(api, tag, attrs, children) {
    if (api && typeof api.svg === "function") return api.svg(tag, attrs || {}, children);
    return appendChildren(
      setAttributes(document.createElementNS(SVG_NS, tag), attrs || {}),
      children
    );
  }

  function clear(node) {
    if (!node) return;
    if (typeof node.replaceChildren === "function") {
      node.replaceChildren();
      return;
    }
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function installStyles(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      ".cl-retrieval-practice { --rp-bg: var(--bg); --rp-fg: var(--fg); --rp-soft: var(--fg-soft); --rp-panel: var(--block-bg); --rp-border: var(--border); --rp-accent: var(--accent); --rp-reread: var(--cl-gold, #9b6a12); --rp-retrieval: var(--cl-green, #39734d); --rp-mixed: var(--cl-blue, #315f9d); margin: 0; color: var(--rp-fg); font-size: .94rem; line-height: 1.5; }",
      ".cl-retrieval-practice *, .cl-retrieval-practice *::before, .cl-retrieval-practice *::after { box-sizing: border-box; }",
      ".cl-retrieval-practice .rp-shell { min-width: 0; border: 1px solid var(--rp-border); border-radius: 8px; background: var(--rp-bg); overflow: hidden; }",
      ".cl-retrieval-practice .rp-header { padding: 1rem 1.1rem .9rem; border-bottom: 1px solid var(--rp-border); background: var(--rp-panel); }",
      ".cl-retrieval-practice .rp-kicker { margin: 0 0 .25rem; color: var(--rp-accent); font-size: .75rem; font-weight: 700; letter-spacing: .04em; }",
      ".cl-retrieval-practice h3, .cl-retrieval-practice h4 { color: var(--rp-fg); }",
      ".cl-retrieval-practice .rp-header h3 { margin: 0; font-size: 1.18rem; }",
      ".cl-retrieval-practice .rp-header p { margin: .45rem 0 0; color: var(--rp-soft); overflow-wrap: anywhere; }",
      ".cl-retrieval-practice .rp-disclaimer { padding: .55rem .7rem; border-left: 3px solid var(--rp-accent); background: var(--rp-bg); font-size: .82rem; }",
      ".cl-retrieval-practice .rp-controls { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .7rem; padding: .85rem 1.1rem; border-bottom: 1px solid var(--rp-border); background: var(--rp-panel); }",
      ".cl-retrieval-practice .rp-fieldset { min-width: 0; margin: 0; padding: .6rem .65rem .7rem; border: 1px solid var(--rp-border); border-radius: 6px; }",
      ".cl-retrieval-practice .rp-fieldset legend { padding: 0 .25rem; color: var(--rp-soft); font-size: .76rem; font-weight: 700; }",
      ".cl-retrieval-practice .rp-field-head { display: flex; align-items: baseline; justify-content: space-between; gap: .5rem; }",
      ".cl-retrieval-practice .rp-field-head label, .cl-retrieval-practice .rp-field-label { color: var(--rp-soft); font-size: .82rem; font-weight: 700; }",
      ".cl-retrieval-practice output { color: var(--rp-accent); font-variant-numeric: tabular-nums; font-weight: 700; text-align: right; }",
      ".cl-retrieval-practice select, .cl-retrieval-practice input[type='range'] { width: 100%; min-height: 44px; margin-top: .35rem; }",
      ".cl-retrieval-practice select { padding: .45rem .55rem; border: 1px solid var(--rp-border); border-radius: 6px; background: var(--rp-bg); color: var(--rp-fg); font: inherit; }",
      ".cl-retrieval-practice input[type='range'] { accent-color: var(--rp-accent); }",
      ".cl-retrieval-practice .rp-scale { display: flex; justify-content: space-between; gap: .4rem; color: var(--rp-soft); font-size: .7rem; }",
      ".cl-retrieval-practice .rp-control-note { min-height: 2.8em; margin: .28rem 0 0; color: var(--rp-soft); font-size: .71rem; line-height: 1.4; }",
      ".cl-retrieval-practice .rp-budget { display: grid; align-content: center; min-width: 0; padding: .6rem .65rem; border: 1px solid var(--rp-border); border-radius: 6px; background: var(--rp-bg); }",
      ".cl-retrieval-practice .rp-budget span, .cl-retrieval-practice .rp-budget small { color: var(--rp-soft); font-size: .76rem; }",
      ".cl-retrieval-practice .rp-budget strong { display: block; margin: .1rem 0; color: var(--rp-fg); font-size: 1.05rem; font-variant-numeric: tabular-nums; }",
      ".cl-retrieval-practice .rp-main { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(280px, .95fr); gap: 1rem; align-items: start; padding: 1rem 1.1rem 1.1rem; }",
      ".cl-retrieval-practice .rp-card { min-width: 0; padding: .78rem; border: 1px solid var(--rp-border); border-radius: 6px; background: var(--rp-panel); }",
      ".cl-retrieval-practice .rp-card + .rp-card { margin-top: .75rem; }",
      ".cl-retrieval-practice .rp-card-title { display: flex; align-items: baseline; justify-content: space-between; gap: .6rem; margin: 0 0 .55rem; color: var(--rp-soft); font-size: .81rem; font-weight: 700; }",
      ".cl-retrieval-practice .rp-card-title small { font-weight: 400; }",
      ".cl-retrieval-practice .rp-charts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .7rem; }",
      ".cl-retrieval-practice .rp-chart-block { min-width: 0; }",
      ".cl-retrieval-practice .rp-chart-block h4 { margin: 0 0 .35rem; color: var(--rp-fg); font-size: .84rem; }",
      ".cl-retrieval-practice .rp-chart { display: block; width: 100%; max-width: 100%; height: auto; color: var(--rp-fg); }",
      ".cl-retrieval-practice .rp-chart text { fill: var(--rp-fg); font-family: inherit; font-size: 12px; }",
      ".cl-retrieval-practice .rp-chart .rp-axis { stroke: var(--rp-border); stroke-width: 1; }",
      ".cl-retrieval-practice .rp-chart .rp-grid { stroke: var(--rp-border); stroke-width: 1; stroke-dasharray: 2 4; opacity: .7; }",
      ".cl-retrieval-practice .rp-chart .rp-bar-reread, .cl-retrieval-practice .rp-chart .rp-line-reread, .cl-retrieval-practice .rp-chart .rp-dot-reread { fill: var(--rp-reread); stroke: var(--rp-reread); }",
      ".cl-retrieval-practice .rp-chart .rp-bar-retrieval, .cl-retrieval-practice .rp-chart .rp-line-retrieval, .cl-retrieval-practice .rp-chart .rp-dot-retrieval { fill: var(--rp-retrieval); stroke: var(--rp-retrieval); }",
      ".cl-retrieval-practice .rp-chart .rp-bar-mixed, .cl-retrieval-practice .rp-chart .rp-line-mixed, .cl-retrieval-practice .rp-chart .rp-dot-mixed { fill: var(--rp-mixed); stroke: var(--rp-mixed); }",
      ".cl-retrieval-practice .rp-chart .rp-line-reread, .cl-retrieval-practice .rp-chart .rp-line-retrieval, .cl-retrieval-practice .rp-chart .rp-line-mixed { fill: none; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; }",
      ".cl-retrieval-practice .rp-chart .rp-line-retrieval { stroke-dasharray: 6 4; }",
      ".cl-retrieval-practice .rp-chart .rp-line-mixed { stroke-dasharray: 2 3; }",
      ".cl-retrieval-practice .rp-chart .rp-dot-reread, .cl-retrieval-practice .rp-chart .rp-dot-retrieval, .cl-retrieval-practice .rp-chart .rp-dot-mixed { stroke-width: 1.5; }",
      ".cl-retrieval-practice .rp-legend { display: flex; flex-wrap: wrap; gap: .35rem .8rem; margin: .45rem 0 0; color: var(--rp-soft); font-size: .76rem; }",
      ".cl-retrieval-practice .rp-legend-item { display: inline-flex; align-items: center; gap: .35rem; }",
      ".cl-retrieval-practice .rp-swatch { display: inline-block; width: 1.05rem; border-top: 3px solid currentColor; }",
      ".cl-retrieval-practice .rp-swatch-reread { color: var(--rp-reread); } .cl-retrieval-practice .rp-swatch-retrieval { color: var(--rp-retrieval); border-top-style: dashed; } .cl-retrieval-practice .rp-swatch-mixed { color: var(--rp-mixed); border-top-style: dotted; }",
      ".cl-retrieval-practice .rp-summary { margin: .65rem 0 0; padding: .55rem .65rem; border-left: 3px solid var(--rp-accent); background: var(--rp-bg); color: var(--rp-soft); font-size: .8rem; overflow-wrap: anywhere; }",
      ".cl-retrieval-practice .rp-metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .5rem; margin-top: .7rem; }",
      ".cl-retrieval-practice .rp-metric { min-width: 0; padding: .5rem .55rem; border-top: 2px solid var(--rp-border); background: var(--rp-bg); }",
      ".cl-retrieval-practice .rp-metric:nth-child(1) { border-top-color: var(--rp-accent); } .cl-retrieval-practice .rp-metric:nth-child(2) { border-top-color: var(--rp-retrieval); } .cl-retrieval-practice .rp-metric:nth-child(3) { border-top-color: var(--rp-reread); }",
      ".cl-retrieval-practice .rp-metric span { display: block; color: var(--rp-soft); font-size: .7rem; }",
      ".cl-retrieval-practice .rp-metric strong { display: block; margin-top: .1rem; color: var(--rp-fg); font-size: .94rem; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }",
      ".cl-retrieval-practice .rp-strategies { display: flex; flex-wrap: wrap; gap: .45rem; margin: .45rem 0 .7rem; }",
      ".cl-retrieval-practice button { min-width: 0; min-height: 44px; padding: .48rem .68rem; border: 1px solid var(--rp-border); border-radius: 6px; background: var(--rp-bg); color: var(--rp-fg); cursor: pointer; font: inherit; font-size: .82rem; }",
      ".cl-retrieval-practice button:hover { border-color: var(--rp-accent); }",
      ".cl-retrieval-practice button[aria-pressed='true'], .cl-retrieval-practice button.rp-primary { border-color: var(--rp-accent); background: var(--rp-accent); color: var(--rp-bg); }",
      ".cl-retrieval-practice button:focus-visible, .cl-retrieval-practice select:focus-visible, .cl-retrieval-practice input:focus-visible { outline: 3px solid var(--cl-focus, #1769aa); outline-offset: 2px; }",
      ".cl-retrieval-practice .rp-ledger-wrap { max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }",
      ".cl-retrieval-practice table { width: 100%; min-width: 560px; border-collapse: collapse; font-size: .75rem; }",
      ".cl-retrieval-practice th, .cl-retrieval-practice td { padding: .38rem .42rem; border-bottom: 1px solid var(--rp-border); text-align: left; vertical-align: top; font-variant-numeric: tabular-nums; }",
      ".cl-retrieval-practice th { color: var(--rp-soft); font-size: .7rem; font-weight: 700; white-space: nowrap; }",
      ".cl-retrieval-practice td { color: var(--rp-fg); }",
      ".cl-retrieval-practice .rp-ledger-note, .cl-retrieval-practice .rp-footnote { margin: .55rem 0 0; color: var(--rp-soft); font-size: .74rem; line-height: 1.5; overflow-wrap: anywhere; }",
      ".cl-retrieval-practice .rp-prediction { margin-top: .75rem; }",
      ".cl-retrieval-practice .rp-prediction-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .55rem; }",
      ".cl-retrieval-practice .rp-prediction label { display: block; color: var(--rp-soft); font-size: .78rem; font-weight: 700; }",
      ".cl-retrieval-practice .rp-prediction select { margin-top: .25rem; }",
      ".cl-retrieval-practice .rp-prediction button { margin-top: .6rem; width: 100%; }",
      ".cl-retrieval-practice .rp-feedback { min-height: 2.4em; margin: .55rem 0 0; padding: .5rem .6rem; border-left: 3px solid var(--rp-accent); background: var(--rp-bg); color: var(--rp-soft); font-size: .78rem; overflow-wrap: anywhere; }",
      ".cl-retrieval-practice .rp-sr-only { position: absolute !important; width: 1px !important; height: 1px !important; padding: 0 !important; margin: -1px !important; overflow: hidden !important; clip: rect(0, 0, 0, 0) !important; white-space: nowrap !important; border: 0 !important; }",
      "@media (max-width: 900px) { .cl-retrieval-practice .rp-controls { grid-template-columns: repeat(2, minmax(0, 1fr)); } .cl-retrieval-practice .rp-main { grid-template-columns: minmax(0, 1fr); } }",
      "@media (max-width: 560px) { .cl-retrieval-practice .rp-controls { grid-template-columns: minmax(0, 1fr); padding: .75rem; } .cl-retrieval-practice .rp-header { padding: .85rem .78rem; } .cl-retrieval-practice .rp-main { padding: .8rem .75rem .9rem; } .cl-retrieval-practice .rp-charts { grid-template-columns: minmax(0, 1fr); } .cl-retrieval-practice .rp-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); } .cl-retrieval-practice .rp-prediction-fields { grid-template-columns: minmax(0, 1fr); } }",
      "@media (prefers-reduced-motion: reduce) { .cl-retrieval-practice *, .cl-retrieval-practice *::before, .cl-retrieval-practice *::after { scroll-behavior: auto !important; transition: none !important; animation: none !important; } }"
    ].join("\n");
    doc.head.appendChild(style);
  }

  function makeId(prefix) {
    INSTANCE_COUNT += 1;
    return prefix + "-" + INSTANCE_COUNT;
  }

  function svgText(api, x, y, text, attrs) {
    attrs = attrs || {};
    attrs.x = x;
    attrs.y = y;
    attrs.text = text;
    return makeSvg(api, "text", attrs);
  }

  function chartScales(value) {
    var top = 28;
    var bottom = 208;
    return bottom - value * (bottom - top);
  }

  function drawAxes(api, svg, yTitle, xLabels) {
    var left = 48;
    var right = 347;
    var bottom = 208;
    [0, 0.5, 1].forEach(function (value) {
      var y = chartScales(value);
      svg.appendChild(makeSvg(api, "line", {
        x1: left,
        y1: y,
        x2: right,
        y2: y,
        className: value === 0 ? "rp-axis" : "rp-grid"
      }));
      svg.appendChild(svgText(api, left - 7, y + 4, formatPercent(value, 0), {
        "text-anchor": "end"
      }));
    });
    svg.appendChild(makeSvg(api, "line", {
      x1: left,
      y1: 28,
      x2: left,
      y2: bottom,
      className: "rp-axis"
    }));
    svg.appendChild(svgText(api, 12, 24, yTitle, { "text-anchor": "start" }));
    xLabels.forEach(function (label) {
      svg.appendChild(svgText(api, label.x, 230, label.text, {
        "text-anchor": "middle"
      }));
    });
  }

  function makeChartTitle(api, title, description) {
    return makeElement(api, "div", { className: "rp-chart-block" }, [
      makeElement(api, "h4", { text: title }),
      makeElement(api, "p", { className: "rp-sr-only", text: description })
    ]);
  }

  function drawImmediate(api, container, results, ids) {
    var block = makeChartTitle(
      api,
      "即时熟悉 / 表现代理",
      "柱形比较三种安排的即时熟悉与表现代理；它不是闭卷测验，也不是对个人记忆的测量。"
    );
    var svg = makeSvg(api, "svg", {
      className: "rp-chart",
      viewBox: "0 0 360 260",
      role: "img",
      "aria-labelledby": ids.title + " " + ids.desc
    });
    svg.appendChild(makeSvg(api, "title", { id: ids.title, text: "即时熟悉与表现代理比较" }));
    svg.appendChild(makeSvg(api, "desc", {
      id: ids.desc,
      text: "重读、检索加反馈、混合安排的即时代理值。代理值来自确定性机制玩具模型。"
    }));
    var labels = [
      { key: "reread", x: 100 },
      { key: "retrieval", x: 195 },
      { key: "mixed", x: 290 }
    ];
    drawAxes(api, svg, "即时", labels.map(function (item) {
      return { x: item.x, text: STRATEGIES[item.key].shortLabel };
    }));
    labels.forEach(function (item) {
      var value = results[item.key].immediate;
      var y = chartScales(value);
      svg.appendChild(makeSvg(api, "rect", {
        x: item.x - 23,
        y: y,
        width: 46,
        height: 208 - y,
        rx: 3,
        className: "rp-bar-" + item.key,
        "aria-label": STRATEGIES[item.key].label + "即时代理 " + formatPercent(value)
      }));
      svg.appendChild(svgText(api, item.x, Math.max(18, y - 7), formatPercent(value), {
        "text-anchor": "middle"
      }));
    });
    block.appendChild(svg);
    container.appendChild(block);
  }

  function drawCurve(api, container, results, ids) {
    var block = makeChartTitle(
      api,
      "延迟闭卷回忆曲线",
      "折线比较延迟 0、1、3、7、14 个抽象时间单位的闭卷回忆代理；时间刻度不是普适常数。"
    );
    var svg = makeSvg(api, "svg", {
      className: "rp-chart",
      viewBox: "0 0 360 260",
      role: "img",
      "aria-labelledby": ids.title + " " + ids.desc
    });
    svg.appendChild(makeSvg(api, "title", { id: ids.title, text: "延迟闭卷回忆曲线" }));
    svg.appendChild(makeSvg(api, "desc", {
      id: ids.desc,
      text: "三种安排在五个延迟点的回忆代理曲线。所有曲线来自机制玩具模型，不是 Ebbinghaus 普适曲线。"
    }));
    var xPositions = [48, 69, 112, 198, 347];
    drawAxes(api, svg, "回忆", DELAYS.map(function (delay, index) {
      return { x: xPositions[index], text: String(delay) };
    }));
    svg.appendChild(svgText(api, 198, 250, "延迟（抽象时间单位）", { "text-anchor": "middle" }));

    ["reread", "retrieval", "mixed"].forEach(function (key) {
      var points = results[key].curve.map(function (value, index) {
        return xPositions[index] + "," + chartScales(value);
      }).join(" ");
      svg.appendChild(makeSvg(api, "polyline", {
        points: points,
        className: "rp-line-" + key,
        "aria-label": STRATEGIES[key].label + "延迟回忆曲线"
      }));
      results[key].curve.forEach(function (value, index) {
        svg.appendChild(makeSvg(api, "circle", {
          cx: xPositions[index],
          cy: chartScales(value),
          r: 4,
          className: "rp-dot-" + key,
          "aria-label": STRATEGIES[key].label + "延迟 " + DELAYS[index] + "：" + formatPercent(value)
        }));
      });
    });
    block.appendChild(svg);
    container.appendChild(block);
  }

  function metric(api, label, value) {
    return makeElement(api, "div", { className: "rp-metric" }, [
      makeElement(api, "span", { text: label }),
      makeElement(api, "strong", { text: value })
    ]);
  }

  function strategyLegend(api) {
    return makeElement(api, "div", { className: "rp-legend", "aria-label": "图例" }, [
      makeElement(api, "span", { className: "rp-legend-item" }, [
        makeElement(api, "i", { className: "rp-swatch rp-swatch-reread", "aria-hidden": "true" }),
        "重读"
      ]),
      makeElement(api, "span", { className: "rp-legend-item" }, [
        makeElement(api, "i", { className: "rp-swatch rp-swatch-retrieval", "aria-hidden": "true" }),
        "检索 + 反馈"
      ]),
      makeElement(api, "span", { className: "rp-legend-item" }, [
        makeElement(api, "i", { className: "rp-swatch rp-swatch-mixed", "aria-hidden": "true" }),
        "混合"
      ])
    ]);
  }

  function selectOptions(api, values, selected) {
    return values.map(function (value) {
      return makeElement(api, "option", {
        value: value.value,
        selected: value.value === selected,
        text: value.label
      });
    });
  }

  function renderLedger(api, body, result) {
    clear(body);
    result.events.forEach(function (event) {
      body.appendChild(makeElement(api, "tr", {}, [
        makeElement(api, "td", { text: String(event.event) }),
        makeElement(api, "td", { text: formatNumber(event.gap, 1) }),
        makeElement(api, "td", { text: actionLabel(event.action) }),
        makeElement(api, "td", {
          text: event.attempt === null ? "—" : formatPercent(event.attempt)
        }),
        makeElement(api, "td", {
          text: event.feedbackGain === 0 ? "—" : "+" + formatPercent(event.feedbackGain, 1)
        }),
        makeElement(api, "td", { text: formatNumber(event.familiarity, 3) }),
        makeElement(api, "td", { text: formatNumber(event.retrieval, 3) }),
        makeElement(api, "td", { text: formatNumber(event.support, 3) })
      ]));
    });
  }

  function buildLab(root, api) {
    var doc = root.ownerDocument || document;
    installStyles(doc);
    root.classList.add("cl-retrieval-practice");
    var ids = {
      heading: makeId("rp-heading"),
      immediateTitle: makeId("rp-immediate-title"),
      immediateDesc: makeId("rp-immediate-desc"),
      curveTitle: makeId("rp-curve-title"),
      curveDesc: makeId("rp-curve-desc")
    };
    var state = {
      presetKey: "instant-vs-delay",
      params: normalizeParams(PRESETS["instant-vs-delay"]),
      selectedStrategy: "mixed",
      predictionImmediate: "",
      predictionDelayed: "",
      predictionSubmitted: false
    };

    clear(root);
    root.setAttribute("aria-labelledby", ids.heading);

    var heading = makeElement(api, "h3", { id: ids.heading, text: "机制玩具：熟悉感与延迟检索不是同一条线" });
    var presetSelect = makeElement(api, "select", { id: makeId("rp-preset"), "aria-label": "选择教学预设" });
    presetSelect.appendChild(makeElement(api, "option", { value: "", text: "请选择预设" }));
    Object.keys(PRESETS).forEach(function (key) {
      presetSelect.appendChild(makeElement(api, "option", {
        value: key,
        text: PRESETS[key].label
      }));
    });
    presetSelect.value = state.presetKey;

    var intervalInput;
    var difficultyInput;
    var feedbackInput;
    var intervalOutput;
    var difficultyOutput;
    var feedbackOutput;
    var predictionImmediate;
    var predictionDelayed;
    var predictionFeedback;
    var live;
    var immediateChart;
    var curveChart;
    var summary;
    var metricGrid;
    var ledgerBody;
    var selectedStrategyNote;
    var presetNote;
    var strategyButtons = [];

    function rangeField(legend, label, id, min, max, step, value, outputText, note) {
      var input = makeElement(api, "input", {
        id: id,
        type: "range",
        min: min,
        max: max,
        step: step,
        value: value,
        "aria-label": label
      });
      var output = makeElement(api, "output", { text: outputText(value) });
      var field = makeElement(api, "fieldset", { className: "rp-fieldset" }, [
        makeElement(api, "legend", { text: legend }),
        makeElement(api, "div", { className: "rp-field-head" }, [
          makeElement(api, "label", { htmlFor: id, text: label }),
          output
        ]),
        input,
        makeElement(api, "div", { className: "rp-scale" }, [
          makeElement(api, "span", { text: String(min) }),
          makeElement(api, "span", { text: String(max) })
        ]),
        makeElement(api, "p", { className: "rp-control-note", text: note })
      ]);
      return { field: field, input: input, output: output };
    }

    var intervalField = rangeField(
      "间隔",
      "相邻事件间隔",
      makeId("rp-interval"),
      0,
      7,
      0.1,
      state.params.interval,
      function (value) { return formatNumber(Number(value), 1) + " 单位"; },
      "首个事件间隔为 0；之后三种安排用同一间隔。"
    );
    intervalInput = intervalField.input;
    intervalOutput = intervalField.output;

    var difficultyField = rangeField(
      "难度",
      "检索难度",
      makeId("rp-difficulty"),
      0,
      1,
      0.05,
      state.params.difficulty,
      function (value) { return formatPercent(Number(value), 0); },
      "难度越高，闭卷尝试越容易失败；不是个人能力评分。"
    );
    difficultyInput = difficultyField.input;
    difficultyOutput = difficultyField.output;

    var feedbackField = rangeField(
      "反馈",
      "反馈质量",
      makeId("rp-feedback"),
      0,
      1,
      0.05,
      state.params.feedback,
      function (value) { return formatPercent(Number(value), 0); },
      "反馈只在检索事件中起作用；重读没有反馈事件。"
    );
    feedbackInput = feedbackField.input;
    feedbackOutput = feedbackField.output;

    var controls = makeElement(api, "div", { className: "rp-controls", role: "group", "aria-label": "模拟参数" }, [
      makeElement(api, "fieldset", { className: "rp-fieldset" }, [
        makeElement(api, "legend", { text: "情境" }),
        makeElement(api, "label", { className: "rp-field-label", htmlFor: presetSelect.id, text: "选择预设" }),
        presetSelect,
        presetNote = makeElement(api, "p", { className: "rp-control-note", text: PRESETS[state.presetKey].note })
      ]),
      intervalField.field,
      difficultyField.field,
      feedbackField.field,
      makeElement(api, "div", { className: "rp-budget", role: "status" }, [
        makeElement(api, "span", { text: "共享学习事件预算" }),
        makeElement(api, "strong", { text: String(DEFAULTS.budget) + " 次" }),
        makeElement(api, "small", { text: "三种安排都从同一起点执行相同次数" })
      ])
    ]);

    var header = makeElement(api, "div", { className: "rp-header" }, [
      makeElement(api, "p", { className: "rp-kicker", text: "LEARNING LAYER · 透明模拟" }),
      heading,
      makeElement(api, "p", { text: "先预测：重复看见会让材料变得熟悉，但合上材料从记忆中取出，才直接练习闭卷检索。" }),
      makeElement(api, "p", { className: "rp-disclaimer", text: "这是确定性的机制 toy model：F/R/S 是教学用代理量，不是对任何个人记忆的测量，也不能精确预测你的分数。延迟轴是抽象单位；这里不把 Ebbinghaus 曲线当作普适常数。" })
    ]);

    var chartCard = makeElement(api, "section", { className: "rp-card", "aria-label": "三种学习安排的图表比较" });
    var charts = makeElement(api, "div", { className: "rp-charts" });
    immediateChart = makeElement(api, "div", { className: "rp-chart-slot" });
    curveChart = makeElement(api, "div", { className: "rp-chart-slot" });
    charts.appendChild(immediateChart);
    charts.appendChild(curveChart);
    chartCard.appendChild(makeElement(api, "p", { className: "rp-card-title", text: "同一预算下的结果" }));
    chartCard.appendChild(charts);
    chartCard.appendChild(strategyLegend(api));
    summary = makeElement(api, "p", { className: "rp-summary", "aria-live": "polite" });
    chartCard.appendChild(summary);
    metricGrid = makeElement(api, "div", { className: "rp-metrics", "aria-label": "当前安排关键数值" });
    chartCard.appendChild(metricGrid);

    var predictionCard = makeElement(api, "section", { className: "rp-card rp-prediction", "aria-labelledby": makeId("rp-prediction-title") });
    var predictionTitle = predictionCard.getAttribute("aria-labelledby");
    predictionCard.appendChild(makeElement(api, "h4", { id: predictionTitle, className: "rp-card-title", text: "你的预测：哪个安排会赢？" }));
    predictionCard.appendChild(makeElement(api, "p", { className: "rp-ledger-note", text: "在看结果前选一个即时赢家和一个第 7 个抽象时间单位的延迟赢家，再提交。预测错也有信息：它暴露了把熟悉感当成保持的直觉。" }));
    var predictionFields = makeElement(api, "div", { className: "rp-prediction-fields" });
    predictionImmediate = makeElement(api, "select", {
      id: makeId("rp-prediction-immediate"),
      "aria-label": "预测即时表现赢家"
    });
    predictionDelayed = makeElement(api, "select", {
      id: makeId("rp-prediction-delayed"),
      "aria-label": "预测第七个抽象时间单位延迟回忆赢家"
    });
    var strategyOptions = [
      { value: "", label: "请选择" },
      { value: "reread", label: "重读" },
      { value: "retrieval", label: "检索 + 反馈" },
      { value: "mixed", label: "混合安排" }
    ];
    selectOptions(api, strategyOptions, "").forEach(function (option) { predictionImmediate.appendChild(option); });
    selectOptions(api, strategyOptions, "").forEach(function (option) { predictionDelayed.appendChild(option); });
    predictionFields.appendChild(makeElement(api, "div", {}, [
      makeElement(api, "label", { htmlFor: predictionImmediate.id, text: "即时熟悉 / 表现" }),
      predictionImmediate
    ]));
    predictionFields.appendChild(makeElement(api, "div", {}, [
      makeElement(api, "label", { htmlFor: predictionDelayed.id, text: "延迟回忆（第 7 单位）" }),
      predictionDelayed
    ]));
    predictionCard.appendChild(predictionFields);
    var predictionButton = makeElement(api, "button", { type: "button", className: "rp-primary", text: "提交我的预测" });
    predictionCard.appendChild(predictionButton);
    predictionFeedback = makeElement(api, "p", { className: "rp-feedback", "aria-live": "polite", text: "提交后，这里会把你的预测与模型账本并排比较。" });
    predictionCard.appendChild(predictionFeedback);

    var ledgerCard = makeElement(api, "section", { className: "rp-card", "aria-label": "事件账本" });
    var ledgerTitle = makeElement(api, "p", { className: "rp-card-title", text: "事件账本" });
    ledgerCard.appendChild(ledgerTitle);
    var strategies = makeElement(api, "div", { className: "rp-strategies", role: "group", "aria-label": "选择要查看的事件账本" });
    Object.keys(STRATEGIES).forEach(function (key) {
      var button = makeElement(api, "button", {
        type: "button",
        "aria-pressed": key === state.selectedStrategy ? "true" : "false",
        text: STRATEGIES[key].shortLabel
      });
      button.addEventListener("click", function () {
        state.selectedStrategy = key;
        strategyButtons.forEach(function (item) {
          item.setAttribute("aria-pressed", item.key === key ? "true" : "false");
        });
        render();
        if (api && typeof api.announce === "function") api.announce(root, "已切换到账本：" + STRATEGIES[key].label);
      });
      button.key = key;
      strategyButtons.push(button);
      strategies.appendChild(button);
    });
    ledgerCard.appendChild(strategies);
    selectedStrategyNote = makeElement(api, "p", { className: "rp-ledger-note" });
    ledgerCard.appendChild(selectedStrategyNote);
    var ledgerWrap = makeElement(api, "div", { className: "rp-ledger-wrap" });
    var table = makeElement(api, "table", { "aria-label": "当前安排的学习事件账本" });
    table.appendChild(makeElement(api, "caption", { className: "rp-sr-only", text: "当前策略逐事件账本：间隔、动作、检索尝试、反馈贡献以及 F/R/S 状态。" }));
    table.appendChild(makeElement(api, "thead", {}, [
      makeElement(api, "tr", {}, [
        makeElement(api, "th", { scope: "col", text: "事件" }),
        makeElement(api, "th", { scope: "col", text: "间隔" }),
        makeElement(api, "th", { scope: "col", text: "动作" }),
        makeElement(api, "th", { scope: "col", text: "检索尝试代理" }),
        makeElement(api, "th", { scope: "col", text: "反馈贡献" }),
        makeElement(api, "th", { scope: "col", text: "熟悉 F" }),
        makeElement(api, "th", { scope: "col", text: "检索 R" }),
        makeElement(api, "th", { scope: "col", text: "支持 S" })
      ])
    ]));
    ledgerBody = makeElement(api, "tbody");
    table.appendChild(ledgerBody);
    ledgerWrap.appendChild(table);
    ledgerCard.appendChild(ledgerWrap);
    ledgerCard.appendChild(makeElement(api, "p", { className: "rp-footnote", text: "F/R/S 只是无量纲账本状态；“检索尝试代理”是模型中的连续期望值，不是一次真实答题的对错记录。" }));

    var main = makeElement(api, "div", { className: "rp-main" }, [
      makeElement(api, "div", {}, [chartCard, predictionCard]),
      ledgerCard
    ]);
    live = makeElement(api, "p", { className: "rp-sr-only", "aria-live": "polite" });
    var shell = makeElement(api, "div", { className: "rp-shell" }, [header, controls, main, live]);
    root.appendChild(shell);

    function renderPrediction(results) {
      if (!state.predictionSubmitted) {
        predictionFeedback.textContent = "提交后，这里会把你的预测与模型账本并排比较。";
        return;
      }
      var actualImmediate = maxStrategy(results, "immediate");
      var actualDelayed = maxStrategy(results, "daySeven");
      var immediateText = state.predictionImmediate === actualImmediate
        ? "即时判断命中"
        : "即时判断未命中";
      var delayedText = state.predictionDelayed === actualDelayed
        ? "延迟判断命中"
        : "延迟判断未命中";
      predictionFeedback.textContent =
        immediateText + "（模型赢家：" + STRATEGIES[actualImmediate].label + "）；" +
        delayedText + "（第 7 单位赢家：" + STRATEGIES[actualDelayed].label + "）。" +
        "把两个赢家分开，是本实验的学习目标。";
    }

    function render() {
      var results = allResults(state.params);
      var current = results[state.selectedStrategy];
      intervalOutput.textContent = formatNumber(state.params.interval, 1) + " 单位";
      difficultyOutput.textContent = formatPercent(state.params.difficulty, 0);
      feedbackOutput.textContent = formatPercent(state.params.feedback, 0);
      presetNote.textContent = PRESETS[state.presetKey]
        ? PRESETS[state.presetKey].note
        : "当前为手动调节参数；仍保持相同事件预算。";

      clear(immediateChart);
      clear(curveChart);
      drawImmediate(api, immediateChart, results, {
        title: ids.immediateTitle,
        desc: ids.immediateDesc
      });
      drawCurve(api, curveChart, results, {
        title: ids.curveTitle,
        desc: ids.curveDesc
      });
      summary.textContent =
        "即时代理最高：" + STRATEGIES[maxStrategy(results, "immediate")].label +
        "；第 7 单位延迟回忆最高：" + STRATEGIES[maxStrategy(results, "daySeven")].label +
        "。当前查看“" + current.label + "”：" + STRATEGIES[state.selectedStrategy].description;
      clear(metricGrid);
      metricGrid.appendChild(metric(api, "当前即时代理", formatPercent(current.immediate)));
      metricGrid.appendChild(metric(api, "当前第 7 单位回忆", formatPercent(current.daySeven)));
      metricGrid.appendChild(metric(api, "最终检索 R", formatNumber(current.finalState.retrieval, 3)));
      selectedStrategyNote.textContent =
        "当前账本：" + current.label + "；模式为" +
        (state.selectedStrategy === "mixed" ? "重读 → 检索 → 检索的固定循环" : state.selectedStrategy === "reread" ? "12 次重读" : "12 次闭卷检索 + 反馈") +
        "。首个事件不计间隔，之后每次事件前都用 " + formatNumber(state.params.interval, 1) + " 单位。";
      renderLedger(api, ledgerBody, current);
      renderPrediction(results);
      live.textContent =
        "参数已更新；即时赢家为" + STRATEGIES[maxStrategy(results, "immediate")].label +
        "，第 7 单位延迟赢家为" + STRATEGIES[maxStrategy(results, "daySeven")].label + "。";
    }

    function updateParamsFromInputs() {
      state.params = normalizeParams({
        budget: DEFAULTS.budget,
        interval: Number(intervalInput.value),
        difficulty: Number(difficultyInput.value),
        feedback: Number(feedbackInput.value)
      });
      state.predictionSubmitted = false;
      render();
    }

    presetSelect.addEventListener("change", function () {
      if (!PRESETS[presetSelect.value]) return;
      state.presetKey = presetSelect.value;
      state.params = normalizeParams(PRESETS[state.presetKey]);
      intervalInput.value = state.params.interval;
      difficultyInput.value = state.params.difficulty;
      feedbackInput.value = state.params.feedback;
      state.predictionImmediate = "";
      state.predictionDelayed = "";
      predictionImmediate.value = "";
      predictionDelayed.value = "";
      state.predictionSubmitted = false;
      render();
      if (api && typeof api.announce === "function") api.announce(root, "已切换预设：" + PRESETS[state.presetKey].label);
    });
    intervalInput.addEventListener("input", updateParamsFromInputs);
    difficultyInput.addEventListener("input", updateParamsFromInputs);
    feedbackInput.addEventListener("input", updateParamsFromInputs);
    predictionButton.addEventListener("click", function () {
      state.predictionImmediate = predictionImmediate.value;
      state.predictionDelayed = predictionDelayed.value;
      state.predictionSubmitted = Boolean(state.predictionImmediate && state.predictionDelayed);
      render();
      if (api && typeof api.announce === "function") {
        api.announce(root, state.predictionSubmitted ? "预测已提交，反馈已更新。" : "请先选择两个预测。\n");
      }
    });

    render();
  }

  return {
    DEFAULTS: DEFAULTS,
    INITIAL_STATE: INITIAL_STATE,
    DELAYS: DELAYS,
    PRESETS: PRESETS,
    STRATEGIES: STRATEGIES,
    spacingSignal: spacingSignal,
    simulate: simulate,
    allResults: allResults,
    assertModel: assertModel,
    buildLab: buildLab
  };
});
