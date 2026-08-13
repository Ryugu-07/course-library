(function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var EPSILON = 1e-12;
  var instanceCount = 0;

  /* These sets are deliberately explicit: every preset has a stable oracle. */
  var MARKED_BY_KEY = {
    "4:1": [2],
    "8:1": [5],
    "16:1": [11],
    "16:3": [1, 6, 14]
  };

  var PRESETS = [
    {
      id: "n4-m1",
      label: "N=4, M=1",
      description: "一轮完整迭代正好到达标记态",
      N: 4,
      M: 1,
      marked: [2],
      maxK: 5
    },
    {
      id: "n8-m1",
      label: "N=8, M=1",
      description: "平方加速的单标记基准",
      N: 8,
      M: 1,
      marked: [5],
      maxK: 8
    },
    {
      id: "n16-m1",
      label: "N=16, M=1",
      description: "更小转角，需约 √N 次查询",
      N: 16,
      M: 1,
      marked: [11],
      maxK: 10
    },
    {
      id: "n16-m3",
      label: "N=16, M=3",
      description: "多解：转角由 M/N 决定",
      N: 16,
      M: 3,
      marked: [1, 6, 14],
      maxK: 8
    },
    {
      id: "overshoot",
      label: "过转：N=8, M=1",
      description: "继续执行会越过峰值，成功率回落",
      N: 8,
      M: 1,
      marked: [5],
      maxK: 9,
      recommendedK: 2
    }
  ];

  function finiteNumber(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function integer(value, fallback) {
    var parsed = Math.floor(finiteNumber(value, fallback));
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function closeEnough(left, right, tolerance) {
    return Math.abs(left - right) <= (tolerance === undefined ? 1e-10 : tolerance);
  }

  function copyArray(values) {
    return values.slice();
  }

  function copyPreset(preset) {
    var result = {};
    Object.keys(preset).forEach(function (key) {
      result[key] = Array.isArray(preset[key]) ? copyArray(preset[key]) : preset[key];
    });
    return result;
  }

  function presetById(id) {
    for (var i = 0; i < PRESETS.length; i += 1) {
      if (PRESETS[i].id === id) return PRESETS[i];
    }
    return null;
  }

  function getPreset(id) {
    var preset = presetById(id) || PRESETS[0];
    return copyPreset(preset);
  }

  function deterministicMarked(N, M) {
    var key = N + ":" + M;
    if (MARKED_BY_KEY[key]) return copyArray(MARKED_BY_KEY[key]);

    /* A tiny deterministic fallback for hand-built model tests. */
    var result = [];
    var cursor = (N * 17 + M * 31 + 7) % N;
    var stride = N % 2 === 0 ? N - 1 : N - 2;
    if (stride < 1) stride = 1;
    while (result.length < M) {
      if (result.indexOf(cursor) === -1) result.push(cursor);
      cursor = (cursor + stride) % N;
    }
    return result.sort(function (left, right) { return left - right; });
  }

  function normalizeMarked(N, M, requested) {
    var source = Array.isArray(requested) ? requested : deterministicMarked(N, M);
    var result = [];
    source.forEach(function (value) {
      var index = integer(value, -1);
      if (index < 0 || index >= N || result.indexOf(index) !== -1) {
        throw new Error("marked basis indices must be distinct integers in [0, N)");
      }
      result.push(index);
    });
    if (result.length !== M) {
      throw new Error("marked basis count must equal M");
    }
    return result.sort(function (left, right) { return left - right; });
  }

  function normalizeConfig(config) {
    var source = config || {};
    var preset = source.presetId ? presetById(source.presetId) : null;
    var merged = {};
    if (preset) {
      Object.keys(preset).forEach(function (key) { merged[key] = preset[key]; });
    }
    Object.keys(source).forEach(function (key) { merged[key] = source[key]; });

    var N = integer(merged.N, 4);
    var M = integer(merged.M, Array.isArray(merged.marked) ? merged.marked.length : 1);
    if (N < 2 || N > 256) throw new Error("N must be an integer between 2 and 256");
    if (M < 1 || M >= N) throw new Error("M must satisfy 1 <= M < N");
    var marked = normalizeMarked(N, M, merged.marked);
    var amplitudes = null;
    if (Array.isArray(merged.amplitudes)) {
      if (merged.amplitudes.length !== N) throw new Error("amplitudes must have length N");
      amplitudes = merged.amplitudes.map(function (value) {
        var parsed = finiteNumber(value, NaN);
        if (!Number.isFinite(parsed)) throw new Error("amplitudes must be finite real numbers");
        return parsed;
      });
    }
    return {
      N: N,
      M: M,
      marked: marked,
      amplitudes: amplitudes,
      presetId: merged.presetId || null
    };
  }

  function stateConfig(state) {
    return { N: state.N, M: state.M, marked: copyArray(state.marked) };
  }

  function makeState(amplitudes, config, metadata) {
    var values = copyArray(amplitudes);
    var normSquared = values.reduce(function (sum, value) { return sum + value * value; }, 0);
    var norm = Math.sqrt(normSquared);
    var total = values.reduce(function (sum, value) { return sum + value; }, 0);
    var markedSet = Object.create(null);
    config.marked.forEach(function (index) { markedSet[index] = true; });
    var markedSquared = values.reduce(function (sum, value, index) {
      return sum + (markedSet[index] ? value * value : 0);
    }, 0);
    var result = {
      N: config.N,
      M: config.M,
      marked: copyArray(config.marked),
      amplitudes: copyArray(values),
      signedAmplitudes: copyArray(values),
      norm: norm,
      normSquared: normSquared,
      mean: total / config.N,
      successProbability: normSquared > EPSILON ? markedSquared / normSquared : 0,
      queryCount: metadata.queryCount,
      iteration: metadata.iteration,
      phase: metadata.phase,
      pendingIteration: Boolean(metadata.pendingIteration),
      operation: metadata.operation
    };
    return result;
  }

  function init(config) {
    var normalized = normalizeConfig(config);
    var values = normalized.amplitudes;
    if (!values) {
      values = new Array(normalized.N).fill(1 / Math.sqrt(normalized.N));
    }
    return makeState(values, normalized, {
      queryCount: 0,
      iteration: 0,
      phase: "init",
      pendingIteration: false,
      operation: "init"
    });
  }

  function oracle(state) {
    var values = copyArray(state.amplitudes);
    state.marked.forEach(function (index) { values[index] = -values[index]; });
    return makeState(values, stateConfig(state), {
      queryCount: state.queryCount + 1,
      iteration: state.iteration,
      phase: "oracle",
      pendingIteration: false,
      operation: "oracle"
    });
  }

  function diffusion(state) {
    var values = copyArray(state.amplitudes);
    var mean = values.reduce(function (sum, value) { return sum + value; }, 0) / state.N;
    var reflected = values.map(function (value) { return 2 * mean - value; });
    return makeState(reflected, stateConfig(state), {
      queryCount: state.queryCount,
      iteration: state.iteration,
      phase: "diffusion",
      pendingIteration: state.phase === "oracle",
      operation: "diffusion"
    });
  }

  function finishIteration(state) {
    return makeState(state.amplitudes, stateConfig(state), {
      queryCount: state.queryCount,
      iteration: state.iteration + 1,
      phase: "iteration",
      pendingIteration: false,
      operation: "iteration"
    });
  }

  function iterate(state) {
    var afterOracle;
    var afterDiffusion;
    if (state.phase === "oracle") {
      afterDiffusion = diffusion(state);
      return finishIteration(afterDiffusion);
    }
    if (state.phase === "diffusion" && state.pendingIteration) {
      return finishIteration(state);
    }
    afterOracle = oracle(state);
    afterDiffusion = diffusion(afterOracle);
    return finishIteration(afterDiffusion);
  }

  function formulaProbability(N, M, k) {
    var theta = Math.asin(Math.sqrt(M / N));
    return Math.pow(Math.sin((2 * k + 1) * theta), 2);
  }

  function formulaAmplitudes(N, M, k) {
    var theta = Math.asin(Math.sqrt(M / N));
    var good = Math.sin((2 * k + 1) * theta) / Math.sqrt(M);
    var bad = Math.cos((2 * k + 1) * theta) / Math.sqrt(N - M);
    return { marked: good, unmarked: bad };
  }

  function trajectory(config, count) {
    var steps = Math.max(0, integer(count, 0));
    var result = [];
    var state = init(config);
    result.push(state);
    for (var k = 0; k < steps; k += 1) {
      state = iterate(state);
      result.push(state);
    }
    return result;
  }

  function run(config, count) {
    var path = trajectory(config, count);
    return path[path.length - 1];
  }

  function optimalIteration(N, M) {
    var theta = Math.asin(Math.sqrt(M / N));
    var estimate = Math.PI / (4 * theta) - 0.5;
    var candidates = [Math.max(0, Math.floor(estimate)), Math.max(0, Math.ceil(estimate))];
    var best = 0;
    var bestProbability = formulaProbability(N, M, 0);
    candidates.forEach(function (candidate) {
      var k = Math.max(0, candidate);
      var probability = formulaProbability(N, M, k);
      if (probability > bestProbability + 1e-12 || (closeEnough(probability, bestProbability, 1e-12) && k < best)) {
        best = k;
        bestProbability = probability;
      }
    });
    return best;
  }

  function approximateIterations(N, M) {
    return (Math.PI / 4) * Math.sqrt(N / M);
  }

  function predictNext(state) {
    var canonical = state.phase === "init" || state.phase === "iteration";
    if (!canonical) {
      return {
        available: false,
        fromK: state.iteration,
        toK: state.iteration + 1,
        currentProbability: null,
        nextProbability: null,
        direction: null,
        phase: state.phase
      };
    }
    var current = formulaProbability(state.N, state.M, state.iteration);
    var next = formulaProbability(state.N, state.M, state.iteration + 1);
    var direction = next > current + 1e-12 ? "up" : (next < current - 1e-12 ? "down" : "same");
    return {
      fromK: state.iteration,
      toK: state.iteration + 1,
      currentProbability: current,
      nextProbability: next,
      direction: direction,
      phase: state.phase,
      available: true
    };
  }

  function binaryLabel(index, N) {
    var width = Math.max(1, Math.ceil(Math.log(N) / Math.log(2)));
    var text = index.toString(2);
    while (text.length < width) text = "0" + text;
    return "|" + text + "⟩";
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      if (!condition) throw new Error("Grover self-test failed: " + message);
    }
    function checkClose(left, right, message, tolerance) {
      check(closeEnough(left, right, tolerance || 1e-10), message + " (" + left + " vs " + right + ")");
    }

    var initial = init({ N: 4, M: 1, marked: [2] });
    check(initial.queryCount === 0 && initial.iteration === 0, "initial counters");
    checkClose(initial.norm, 1, "initial norm");
    checkClose(initial.mean, 0.5, "initial mean");
    checkClose(initial.successProbability, 0.25, "initial success probability");

    var afterOracle = oracle(initial);
    check(afterOracle.queryCount === 1, "oracle increments query count");
    checkClose(afterOracle.amplitudes[2], -0.5, "oracle flips marked amplitude");
    checkClose(afterOracle.amplitudes[0], 0.5, "oracle preserves unmarked amplitude");
    checkClose(afterOracle.norm, 1, "oracle preserves norm");

    var afterDiffusion = diffusion(afterOracle);
    check(afterDiffusion.queryCount === 1, "diffusion does not query oracle");
    checkClose(afterDiffusion.mean, 0.25, "oracle mean");
    checkClose(afterDiffusion.amplitudes[2], 1, "diffusion reflects marked value");
    checkClose(afterDiffusion.amplitudes[0], 0, "diffusion reflects unmarked value");
    checkClose(afterDiffusion.successProbability, 1, "N=4 one-iteration success");
    checkClose(afterDiffusion.norm, 1, "diffusion preserves norm");

    var custom = init({ N: 4, M: 1, marked: [0], amplitudes: [0.25, -0.5, 0.75, 0] });
    var reflected = diffusion(custom);
    var expected = [0, 0.75, -0.5, 0.25];
    expected.forEach(function (value, index) {
      checkClose(reflected.amplitudes[index], value, "mean reflection at index " + index);
    });

    PRESETS.forEach(function (preset) {
      var path = trajectory(preset, 8);
      path.forEach(function (state, k) {
        var values = state.amplitudes;
        checkClose(state.norm, 1, preset.id + " norm at k=" + k, 5e-10);
        checkClose(state.successProbability, formulaProbability(preset.N, preset.M, k), preset.id + " formula at k=" + k, 5e-10);
        var amplitudes = formulaAmplitudes(preset.N, preset.M, k);
        state.marked.forEach(function (index) {
          checkClose(values[index], amplitudes.marked, preset.id + " marked amplitude at k=" + k, 5e-10);
        });
        for (var index = 0; index < preset.N; index += 1) {
          if (state.marked.indexOf(index) === -1) {
            checkClose(values[index], amplitudes.unmarked, preset.id + " unmarked amplitude at k=" + k, 5e-10);
          }
        }
        check(state.queryCount === k && state.iteration === k, preset.id + " query count at k=" + k);
      });
    });

    check(optimalIteration(4, 1) === 1, "exact integer optimum for N=4,M=1");
    check(optimalIteration(8, 1) === 2, "exact integer optimum for N=8,M=1");
    check(optimalIteration(16, 3) === 1, "exact integer optimum for N=16,M=3");
    checkClose(approximateIterations(16, 1), Math.PI, "pi/4 sqrt(N/M) approximation");

    var overshootPath = trajectory({ N: 8, M: 1, marked: [5] }, 5);
    check(overshootPath[4].successProbability < overshootPath[3].successProbability, "over-rotation lowers success probability");
    check(predictNext(overshootPath[3]).direction === "down", "prediction detects over-rotation");
    check(predictNext(initial).direction === "up", "prediction detects rising first step");
    check(predictNext(afterOracle).available === false, "half-step prediction is unavailable");
    check(iterate(afterOracle).queryCount === 1 && iterate(afterOracle).iteration === 1, "complete iteration after oracle half-step");
    check(oracle(oracle(initial)).queryCount === 2, "two oracle half-steps count twice");

    return { ok: true, checks: checks, presets: PRESETS.length };
  }

  var pureModel = {
    MARKED_BY_KEY: MARKED_BY_KEY,
    PRESETS: PRESETS,
    getPreset: getPreset,
    markedIndices: deterministicMarked,
    init: init,
    oracle: oracle,
    diffusion: diffusion,
    iterate: iterate,
    fullIteration: iterate,
    trajectory: trajectory,
    run: run,
    formulaProbability: formulaProbability,
    formulaAmplitudes: formulaAmplitudes,
    optimalIteration: optimalIteration,
    approximateIterations: approximateIterations,
    predictNext: predictNext,
    binaryLabel: binaryLabel,
    selfTest: selfTest
  };

  if (typeof module === "object" && module.exports) {
    module.exports = pureModel;
    if (typeof require !== "undefined" && require.main === module && process.argv.indexOf("--self-test") !== -1) {
      try {
        var report = selfTest();
        console.log("Grover amplification self-test: ok (" + report.checks + " checks, " + report.presets + " presets)");
      } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
      }
    }
    return;
  }

  if (!host || !host.CourseLearning || typeof host.CourseLearning.register !== "function") return;

  var doc = host.document;
  var api = host.CourseLearning.api || {};
  var STYLE_ID = "grover-amplification-styles";

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
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function el(tag, attrs, children) {
    if (api && typeof api.el === "function") return api.el(tag, attrs || {}, children);
    return appendChildren(setAttributes(doc.createElement(tag), attrs || {}), children);
  }

  function svgEl(tag, attrs, children) {
    if (api && typeof api.svg === "function") return api.svg(tag, attrs || {}, children);
    return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attrs || {}), children);
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function fmt(value, digits) {
    if (api && typeof api.format === "function") return api.format(value, digits);
    if (!Number.isFinite(value)) return "—";
    return Number(value).toFixed(digits === undefined ? 3 : digits).replace(/0+$/, "").replace(/\.$/, "");
  }

  function percent(value) {
    return fmt(value * 100, 1) + "%";
  }

  function announce(root, message) {
    if (api && typeof api.announce === "function") api.announce(root, message);
  }

  function injectStyles() {
    if (doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      ".ga-lab { --ga-bg: var(--bg, #fff); --ga-panel: var(--block-bg, #f4f1e9); --ga-fg: var(--fg, #292722); --ga-soft: var(--fg-soft, #6b6557); --ga-border: var(--border, #d7d0c2); --ga-accent: var(--accent, #315f9d); --ga-marked: var(--cl-red, #b64335); --ga-good: var(--cl-green, #39734d); --ga-gold: var(--cl-gold, #9b6a12); width: 100%; max-width: 100%; box-sizing: border-box; padding: 16px; border: 1px solid var(--ga-border); border-radius: 8px; background: var(--ga-bg); color: var(--ga-fg); font-size: .94rem; line-height: 1.5; overflow: hidden; }",
      ".ga-lab *, .ga-lab *::before, .ga-lab *::after { box-sizing: border-box; }",
      ".ga-lab .ga-shell { min-width: 0; }",
      ".ga-lab h3, .ga-lab h4 { margin: 0; color: var(--ga-fg); }",
      ".ga-lab .ga-heading { color: var(--ga-accent); font-size: 1.23rem; }",
      ".ga-lab .ga-intro, .ga-lab .ga-note, .ga-lab .ga-status { color: var(--ga-soft); }",
      ".ga-lab .ga-intro { margin: .45rem 0 1rem; }",
      ".ga-lab .ga-grid { display: grid; grid-template-columns: minmax(190px, .72fr) minmax(0, 1.28fr); gap: 16px; align-items: start; }",
      ".ga-lab .ga-controls, .ga-lab .ga-stage { min-width: 0; }",
      ".ga-lab .ga-section { margin-top: 1rem; padding-top: .9rem; border-top: 1px solid var(--ga-border); }",
      ".ga-lab .ga-section:first-child { margin-top: 0; padding-top: 0; border-top: 0; }",
      ".ga-lab .ga-section p { margin: .4rem 0; }",
      ".ga-lab .ga-preset-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; margin-top: .55rem; }",
      ".ga-lab button, .ga-lab input[type=range] { min-height: 44px; }",
      ".ga-lab button { width: 100%; min-width: 0; padding: 7px 9px; border: 1px solid var(--ga-border); border-radius: 6px; background: var(--ga-bg); color: var(--ga-fg); font: inherit; cursor: pointer; line-height: 1.3; overflow-wrap: anywhere; }",
      ".ga-lab button:hover:not(:disabled) { border-color: var(--ga-accent); }",
      ".ga-lab button[aria-pressed=true], .ga-lab button.ga-primary { border-color: var(--ga-accent); background: var(--ga-accent); color: var(--ga-bg); font-weight: 700; }",
      ".ga-lab button.ga-marked-action { border-color: var(--ga-marked); }",
      ".ga-lab button:disabled { cursor: not-allowed; opacity: .55; }",
      ".ga-lab button:focus-visible, .ga-lab input:focus-visible { outline: 3px solid var(--cl-focus, #1769aa); outline-offset: 2px; }",
      ".ga-lab .ga-preset { min-height: 54px; text-align: left; }",
      ".ga-lab .ga-preset small { display: block; margin-top: 3px; color: var(--ga-soft); font-size: 11px; line-height: 1.35; }",
      ".ga-lab .ga-preset[aria-pressed=true] small { color: var(--ga-bg); }",
      ".ga-lab .ga-action-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; margin-top: .55rem; }",
      ".ga-lab .ga-field { display: grid; gap: 5px; margin-top: .7rem; }",
      ".ga-lab .ga-field-caption { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 7px; color: var(--ga-soft); font-size: .88em; font-weight: 650; }",
      ".ga-lab .ga-output { color: var(--ga-accent); font-variant-numeric: tabular-nums; }",
      ".ga-lab input[type=range] { display: block; width: 100%; margin: 0; accent-color: var(--ga-accent); }",
      ".ga-lab .ga-guess-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; margin-top: .55rem; }",
      ".ga-lab .ga-status { min-height: 3.2em; margin: .9rem 0; padding: 9px 11px; border-left: 3px solid var(--ga-gold); background: var(--ga-panel); }",
      ".ga-lab .ga-stage-frame { min-width: 0; padding: 8px; border: 1px solid var(--ga-border); border-radius: 7px; background: var(--ga-panel); }",
      ".ga-lab .ga-svg { display: block; width: 100%; max-width: 100%; height: auto; color: var(--ga-fg); }",
      ".ga-lab .ga-svg text { fill: currentColor; font-family: inherit; letter-spacing: 0; }",
      ".ga-lab .ga-svg .ga-muted { fill: var(--ga-soft); }",
      ".ga-lab .ga-svg .ga-axis { stroke: var(--ga-border); stroke-width: 1.2; }",
      ".ga-lab .ga-svg .ga-zero { stroke: var(--ga-soft); stroke-width: 1.4; }",
      ".ga-lab .ga-svg .ga-mean { stroke: var(--ga-gold); stroke-width: 1.7; stroke-dasharray: 5 4; }",
      ".ga-lab .ga-svg .ga-bar-positive { fill: var(--ga-good); }",
      ".ga-lab .ga-svg .ga-bar-negative { fill: var(--ga-accent); }",
      ".ga-lab .ga-svg .ga-bar-marked { fill: var(--ga-marked); }",
      ".ga-lab .ga-svg .ga-bar-marked-negative { fill: var(--ga-gold); }",
      ".ga-lab .ga-svg .ga-operation { fill: var(--ga-bg); stroke: var(--ga-border); stroke-width: 1.2; }",
      ".ga-lab .ga-svg .ga-operation-active { stroke: var(--ga-accent); stroke-width: 2.3; }",
      ".ga-lab .ga-svg .ga-operation-query { fill: var(--ga-marked); }",
      ".ga-lab .ga-svg .ga-prob-grid { stroke: var(--ga-border); stroke-width: 1; stroke-dasharray: 3 4; }",
      ".ga-lab .ga-svg .ga-prob-line { fill: none; stroke: var(--ga-accent); stroke-width: 2.5; }",
      ".ga-lab .ga-svg .ga-prob-point { fill: var(--ga-bg); stroke: var(--ga-accent); stroke-width: 2; }",
      ".ga-lab .ga-svg .ga-prob-current { fill: var(--ga-marked); stroke: var(--ga-marked); }",
      ".ga-lab .ga-metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px; margin: .8rem 0 0; }",
      ".ga-lab .ga-metric { min-width: 0; padding: 8px; border-top: 2px solid var(--ga-border); background: var(--ga-bg); }",
      ".ga-lab .ga-metric span { display: block; color: var(--ga-soft); font-size: 11px; }",
      ".ga-lab .ga-metric strong { display: block; margin-top: 2px; color: var(--ga-fg); font-size: 15px; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }",
      ".ga-lab .ga-formula { margin: .75rem 0 0; padding: 8px 10px; border-left: 3px solid var(--ga-accent); background: var(--ga-bg); font-family: \"SF Mono\", Menlo, Consolas, monospace; font-size: .86em; overflow-x: auto; }",
      ".ga-lab .ga-prediction { margin: .7rem 0 0; padding: 8px 10px; border-left: 3px solid var(--ga-good); background: var(--ga-bg); color: var(--ga-fg); }",
      ".ga-lab .ga-prediction.ga-down { border-left-color: var(--ga-marked); }",
      ".ga-lab .ga-small { color: var(--ga-soft); font-size: .86em; }",
      "@media (max-width: 720px) { .ga-lab { margin-left: -8px; margin-right: -8px; padding: 14px; } .ga-lab .ga-grid { grid-template-columns: minmax(0, 1fr); } .ga-lab .ga-stage-frame { padding: 5px; } }",
      "@media (max-width: 420px) { .ga-lab .ga-preset-grid, .ga-lab .ga-action-grid, .ga-lab .ga-guess-grid { grid-template-columns: minmax(0, 1fr); } .ga-lab .ga-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); } }",
      "@media (prefers-reduced-motion: reduce) { .ga-lab * { scroll-behavior: auto !important; transition: none !important; animation: none !important; } }"
    ].join("\n");
    (doc.head || doc.documentElement || doc.body).appendChild(style);
  }

  function addSvgText(parent, x, y, text, attrs) {
    var merged = { x: x, y: y, "font-size": "12" };
    Object.keys(attrs || {}).forEach(function (key) { merged[key] = attrs[key]; });
    parent.appendChild(svgEl("text", merged, text));
  }

  function addSvgLine(parent, x1, y1, x2, y2, className) {
    parent.appendChild(svgEl("line", { x1: x1, y1: y1, x2: x2, y2: y2, className: className }));
  }

  function addSvgRect(parent, x, y, width, height, className, attrs) {
    var merged = { x: x, y: y, width: width, height: height, className: className };
    Object.keys(attrs || {}).forEach(function (key) { merged[key] = attrs[key]; });
    parent.appendChild(svgEl("rect", merged));
  }

  function phaseLabel(state) {
    if (state.phase === "oracle") return "Oracle 半步";
    if (state.phase === "diffusion") return "扩散半步";
    if (state.phase === "iteration") return "完整迭代";
    return "初始化";
  }

  function operationText(state, name) {
    if (name === "init") return "均匀叠加\nk=0";
    if (name === "oracle") return "Oracle\n标记项反相";
    if (name === "diffusion") return "Diffusion\n围绕均值反射";
    return "完整迭代\nO → D";
  }

  function renderFigure(svg, state, graphMaxK, titleId, descId) {
    clear(svg);
    svg.setAttribute("viewBox", "0 0 760 610");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Grover 振幅放大：带符号振幅、Oracle 与扩散、成功率振荡");
    svg.setAttribute("aria-labelledby", titleId + " " + descId);
    var title = svgEl("title", { id: titleId }, "Grover 振幅放大：带符号振幅、Oracle 与扩散、成功率振荡");
    var desc = svgEl("desc", { id: descId }, "上方是每个基态的正负实振幅，标记态用红色；中间是 Oracle 和扩散半步；下方是成功概率随完整迭代次数 k 的理论振荡。");
    svg.appendChild(title);
    svg.appendChild(desc);

    var left = 44;
    var right = 742;
    var base = 157;
    var maxAbs = state.amplitudes.reduce(function (maximum, value) { return Math.max(maximum, Math.abs(value)); }, 0);
    var amplitudeExtent = Math.max(0.15, maxAbs * 1.2);
    var amplitudeScale = 80 / amplitudeExtent;
    addSvgText(svg, left, 20, "签名振幅 aᵢ（红色 = marked；均值轴 = ā）", { "font-size": "14", "font-weight": "700" });
    addSvgText(svg, left, 38, "Oracle 只翻转 marked 项的符号；Diffusion 再围绕均值反射。", { className: "ga-muted", "font-size": "11" });
    addSvgLine(svg, left, base, right, base, "ga-zero");
    var meanY = base - state.mean * amplitudeScale;
    addSvgLine(svg, left, meanY, right, meanY, "ga-mean");
    addSvgText(svg, right - 2, meanY - 5, "ā=" + fmt(state.mean, 3), { className: "ga-muted", "text-anchor": "end", "font-size": "11" });
    addSvgText(svg, left - 7, base - amplitudeScale, "+", { className: "ga-muted", "text-anchor": "end" });
    addSvgText(svg, left - 7, base + amplitudeScale + 4, "−", { className: "ga-muted", "text-anchor": "end" });

    var count = state.N;
    var plotWidth = right - left;
    var gap = count > 12 ? 3 : 6;
    var barWidth = Math.max(7, (plotWidth - gap * (count - 1)) / count);
    state.amplitudes.forEach(function (value, index) {
      var x = left + index * (barWidth + gap);
      var height = Math.abs(value) * amplitudeScale;
      var marked = state.marked.indexOf(index) !== -1;
      var className;
      if (marked && value < 0) className = "ga-bar-marked-negative";
      else if (marked) className = "ga-bar-marked";
      else if (value < 0) className = "ga-bar-negative";
      else className = "ga-bar-positive";
      var y = value >= 0 ? base - height : base;
      var rect = svgEl("rect", { x: x, y: y, width: barWidth, height: Math.max(1, height), className: className, rx: 2 });
      rect.appendChild(svgEl("title", {}, binaryLabel(index, state.N) + ": a=" + fmt(value, 4) + (marked ? "，marked" : "，unmarked")));
      svg.appendChild(rect);
      addSvgText(svg, x + barWidth / 2, 183, String(index), { "text-anchor": "middle", "font-size": count > 12 ? "9" : "10" });
      if (marked) addSvgText(svg, x + barWidth / 2, 201, "★", { fill: "var(--ga-marked)", "text-anchor": "middle", "font-size": "11" });
    });
    addSvgText(svg, right, 218, "基态索引 i", { className: "ga-muted", "text-anchor": "end", "font-size": "11" });

    var boxes = [
      { key: "init", label: "INIT", x: 48, width: 140 },
      { key: "oracle", label: "O", x: 224, width: 140 },
      { key: "diffusion", label: "D", x: 400, width: 140 },
      { key: "iteration", label: "k→k+1", x: 576, width: 140 }
    ];
    addSvgText(svg, left, 242, "两个半步组成一次完整迭代；红点表示 Oracle 查询计数 +1。", { className: "ga-muted", "font-size": "11" });
    boxes.forEach(function (box, index) {
      var active = (state.phase === box.key) || (box.key === "iteration" && state.phase === "diffusion" && state.pendingIteration);
      addSvgRect(svg, box.x, 260, box.width, 54, active ? "ga-operation ga-operation-active" : "ga-operation", {});
      addSvgText(svg, box.x + 10, 279, box.label, { "font-size": "12", "font-weight": "700" });
      var lines = operationText(state, box.key).split("\n");
      addSvgText(svg, box.x + 10, 297, lines[0], { className: "ga-muted", "font-size": "11" });
      addSvgText(svg, box.x + 10, 310, lines[1], { className: "ga-muted", "font-size": "11" });
      if (index < boxes.length - 1) {
        addSvgLine(svg, box.x + box.width + 5, 287, boxes[index + 1].x - 8, 287, "ga-axis");
        addSvgText(svg, box.x + box.width + 8, 281, "→", { className: "ga-muted", "font-size": "14" });
      }
    });
    addSvgText(svg, 744, 328, "queries=" + state.queryCount, { className: "ga-operation-query", "text-anchor": "end", "font-size": "11", "font-weight": "700" });

    var chartLeft = 56;
    var chartRight = 732;
    var chartTop = 372;
    var chartBottom = 530;
    var maxK = Math.max(1, graphMaxK, state.iteration + 1);
    addSvgText(svg, left, 352, "成功率振荡  pₖ = sin²((2k+1)θ)", { "font-size": "14", "font-weight": "700" });
    addSvgText(svg, chartRight, 352, "θ=asin√(M/N),  M=" + state.M + ", N=" + state.N, { className: "ga-muted", "text-anchor": "end", "font-size": "11" });
    [0, 0.5, 1].forEach(function (value) {
      var y = chartBottom - value * (chartBottom - chartTop);
      addSvgLine(svg, chartLeft, y, chartRight, y, value === 0 ? "ga-zero" : "ga-prob-grid");
      addSvgText(svg, chartLeft - 8, y + 4, percent(value), { className: "ga-muted", "text-anchor": "end", "font-size": "10" });
    });
    addSvgLine(svg, chartLeft, chartTop, chartLeft, chartBottom, "ga-axis");
    var points = [];
    for (var k = 0; k <= maxK; k += 1) {
      var probability = formulaProbability(state.N, state.M, k);
      var xPoint = chartLeft + (chartRight - chartLeft) * k / maxK;
      var yPoint = chartBottom - probability * (chartBottom - chartTop);
      points.push({ x: xPoint, y: yPoint, probability: probability, k: k });
    }
    svg.appendChild(svgEl("polyline", { points: points.map(function (point) { return point.x + "," + point.y; }).join(" "), className: "ga-prob-line" }));
    points.forEach(function (point) {
      var current = (state.phase === "init" || state.phase === "iteration") && point.k === state.iteration;
      var circle = svgEl("circle", { cx: point.x, cy: point.y, r: current ? 5 : 3.5, className: current ? "ga-prob-point ga-prob-current" : "ga-prob-point" });
      circle.appendChild(svgEl("title", {}, "k=" + point.k + ": p=" + percent(point.probability)));
      svg.appendChild(circle);
      addSvgText(svg, point.x, 550, String(point.k), { className: current ? "ga-prob-current" : "ga-muted", "text-anchor": "middle", "font-size": "10", "font-weight": current ? "700" : "400" });
    });
    addSvgText(svg, chartRight, 570, "完整迭代 k", { className: "ga-muted", "text-anchor": "end", "font-size": "11" });
  }

  function buildLab(root) {
    injectStyles();
    root.classList.add("ga-lab");
    instanceCount += 1;
    var serial = instanceCount;
    var titleId = "ga-svg-title-" + serial;
    var descId = "ga-svg-desc-" + serial;
    var state = init(PRESETS[0]);
    var presetId = PRESETS[0].id;
    var graphMaxK = PRESETS[0].maxK;
    var guess = null;
    var guessMessage = "先预测下一次完整迭代的成功率会升还是降。";

    clear(root);
    var shell = el("div", { className: "ga-shell" });
    shell.appendChild(el("h3", { className: "ga-heading" }, "Grover 振幅放大镜：符号、反射与过转"));
    shell.appendChild(el("p", { className: "ga-intro" }, "模型只保存 N 个实振幅。Oracle 对固定的 M 个 marked 基态反相；Diffusion 用 aᵢ → 2ā−aᵢ。每次完整迭代只增加一次 Oracle query。"));

    var grid = el("div", { className: "ga-grid" });
    var controls = el("aside", { className: "ga-controls", "aria-label": "Grover 实验控制" });
    var stage = el("section", { className: "ga-stage", "aria-label": "Grover 可视化" });
    var presetSection = el("div", { className: "ga-section" });
    presetSection.appendChild(el("h4", {}, "教学预设"));
    presetSection.appendChild(el("p", { className: "ga-small" }, "marked 索引固定且可复现；先看 N、M 和推荐整数停步，再动手。"));
    var presetGrid = el("div", { className: "ga-preset-grid", role: "group", "aria-label": "Grover 预设" });
    var presetButtons = {};
    PRESETS.forEach(function (preset) {
      var button = el("button", { type: "button", className: "ga-preset", "aria-pressed": "false" });
      button.appendChild(doc.createTextNode(preset.label));
      button.appendChild(el("small", {}, preset.description));
      button.addEventListener("click", function () {
        presetId = preset.id;
        graphMaxK = preset.maxK;
        state = init(preset);
        guess = null;
        guessMessage = "先预测下一次完整迭代的成功率会升还是降。";
        render();
        announce(root, "已切换到 " + preset.label + "，当前为初始化 k=0。");
      });
      presetButtons[preset.id] = button;
      presetGrid.appendChild(button);
    });
    presetSection.appendChild(presetGrid);
    controls.appendChild(presetSection);

    var actionSection = el("div", { className: "ga-section" });
    actionSection.appendChild(el("h4", {}, "逐步运行"));
    var actionNote = el("p", { className: "ga-small" }, "");
    actionSection.appendChild(actionNote);
    var actionGrid = el("div", { className: "ga-action-grid" });
    var initButton = el("button", { type: "button", className: "ga-primary" }, "初始化");
    var oracleButton = el("button", { type: "button", className: "ga-marked-action" }, "Oracle 半步 O");
    var diffusionButton = el("button", { type: "button" }, "Diffusion 半步 D（闭合 k+1）");
    var iterateButton = el("button", { type: "button", className: "ga-primary" }, "完整迭代 O → D");
    actionGrid.appendChild(initButton);
    actionGrid.appendChild(oracleButton);
    actionGrid.appendChild(diffusionButton);
    actionGrid.appendChild(iterateButton);
    actionSection.appendChild(actionGrid);
    controls.appendChild(actionSection);

    var jumpSection = el("div", { className: "ga-section" });
    jumpSection.appendChild(el("h4", {}, "直接定位完整步"));
    var jumpCaption = el("div", { className: "ga-field-caption" });
    jumpCaption.appendChild(el("span", {}, "k（Oracle query 数）"));
    var jumpOutput = el("output", { className: "ga-output" }, "0");
    jumpCaption.appendChild(jumpOutput);
    jumpSection.appendChild(el("label", { className: "ga-field" }, [jumpCaption]));
    var jumpRange = el("input", { type: "range", min: "0", max: String(graphMaxK), step: "1", value: "0", "aria-label": "完整迭代次数 k" });
    jumpSection.lastChild.appendChild(jumpRange);
    var jumpButton = el("button", { type: "button" }, "定位到这个 k");
    jumpButton.style.marginTop = "7px";
    jumpSection.appendChild(jumpButton);
    controls.appendChild(jumpSection);

    var predictionSection = el("div", { className: "ga-section" });
    predictionSection.appendChild(el("h4", {}, "先预测，再揭晓"));
    var predictionNote = el("p", { className: "ga-small" }, "");
    predictionSection.appendChild(predictionNote);
    var guessGrid = el("div", { className: "ga-guess-grid", role: "group", "aria-label": "下一步成功率预测" });
    var upButton = el("button", { type: "button" }, "下一步 ↑ 升");
    var downButton = el("button", { type: "button" }, "下一步 ↓ 降");
    guessGrid.appendChild(upButton);
    guessGrid.appendChild(downButton);
    predictionSection.appendChild(guessGrid);
    var revealButton = el("button", { type: "button", className: "ga-primary" }, "揭晓并执行完整迭代 O → D");
    revealButton.style.marginTop = "7px";
    predictionSection.appendChild(revealButton);
    controls.appendChild(predictionSection);

    var status = el("p", { className: "ga-status", "aria-live": "polite" }, "");
    stage.appendChild(status);
    var frame = el("div", { className: "ga-stage-frame" });
    var svg = svgEl("svg", { className: "ga-svg", viewBox: "0 0 760 610", role: "img", "aria-label": "Grover 振幅放大：带符号振幅、Oracle 与扩散、成功率振荡", "aria-labelledby": titleId + " " + descId });
    frame.appendChild(svg);
    stage.appendChild(frame);
    var metrics = el("div", { className: "ga-metrics" });
    var metricNorm = el("div", { className: "ga-metric" });
    var metricMean = el("div", { className: "ga-metric" });
    var metricProbability = el("div", { className: "ga-metric" });
    var metricQuery = el("div", { className: "ga-metric" });
    var metricPhase = el("div", { className: "ga-metric" });
    var metricStop = el("div", { className: "ga-metric" });
    [metricNorm, metricMean, metricProbability, metricQuery, metricPhase, metricStop].forEach(function (metric) { metrics.appendChild(metric); });
    stage.appendChild(metrics);
    var formula = el("div", { className: "ga-formula" });
    stage.appendChild(formula);
    var prediction = el("p", { className: "ga-prediction" }, "");
    stage.appendChild(prediction);
    grid.appendChild(controls);
    grid.appendChild(stage);
    shell.appendChild(grid);
    root.appendChild(shell);

    function currentPreset() { return presetById(presetId) || PRESETS[0]; }

    function setMetric(node, label, value) {
      node.replaceChildren(el("span", {}, label), el("strong", {}, value));
    }

    function setInteractive(button, enabled) {
      button.disabled = !enabled;
      button.setAttribute("aria-disabled", enabled ? "false" : "true");
    }

    function render() {
      var preset = currentPreset();
      var canonical = state.phase === "init" || state.phase === "iteration";
      var oracleHalf = state.phase === "oracle";
      presetButtons[preset.id].setAttribute("aria-pressed", "true");
      Object.keys(presetButtons).forEach(function (id) {
        if (id !== preset.id) presetButtons[id].setAttribute("aria-pressed", "false");
      });
      setInteractive(oracleButton, canonical);
      setInteractive(diffusionButton, oracleHalf);
      setInteractive(iterateButton, canonical || oracleHalf);
      setInteractive(upButton, canonical);
      setInteractive(downButton, canonical);
      iterateButton.textContent = oracleHalf ? "完成扩散 D" : "完整迭代 O → D";
      revealButton.textContent = oracleHalf ? "补做 Diffusion D" : "揭晓并执行完整迭代 O → D";
      actionNote.textContent = oracleHalf
        ? "Oracle 已完成；现在只能执行 Diffusion，执行后立即闭合并计为完整 k+1。"
        : "当前是初始化或完整迭代后的 canonical 状态；先做 Oracle，再做 Diffusion。";
      predictionNote.textContent = oracleHalf
        ? "半步状态不接受下一步升降预测；点击 Diffusion 或“补做 Diffusion D”闭合当前迭代。"
        : "现在预测下一次完整迭代的成功率会升还是降，再揭晓。";
      jumpRange.max = String(graphMaxK);
      jumpRange.value = String(Math.min(state.iteration, graphMaxK));
      jumpOutput.textContent = String(state.iteration);
      renderFigure(svg, state, graphMaxK, titleId, descId);
      setMetric(metricNorm, "范数 ‖a‖₂", fmt(state.norm, 5));
      setMetric(metricMean, "当前均值 ā", fmt(state.mean, 5));
      setMetric(metricProbability, "marked 成功率", percent(state.successProbability));
      setMetric(metricQuery, "Oracle query", String(state.queryCount));
      setMetric(metricPhase, "状态", phaseLabel(state));
      setMetric(metricStop, "精确推荐 k*", String(optimalIteration(state.N, state.M)));
      var next = predictNext(state);
      formula.textContent = next.available
        ? "θ = asin√(" + state.M + "/" + state.N + ") = " + fmt(Math.asin(Math.sqrt(state.M / state.N)), 5) + ";  p_k = sin²((2k+1)θ);  π/4·√(N/M) ≈ " + fmt(approximateIterations(state.N, state.M), 3)
        : "Oracle 半步：当前柱是 O 后的 signed amplitudes；p_k 只用于 Diffusion 闭合后的完整步。先执行 D，再读 k=" + (state.iteration + 1) + " 的 p_k。";
      if (next.available) {
        var directionText = next.direction === "up" ? "上升 ↑" : (next.direction === "down" ? "下降 ↓" : "基本不变");
        prediction.className = "ga-prediction" + (next.direction === "down" ? " ga-down" : "");
        prediction.textContent = "下一完整步（k=" + next.toK + ") 的理论预测：" + directionText + "，" + percent(next.currentProbability) + " → " + percent(next.nextProbability) + "。" + (guess ? " 你的选择：" + (guess === "up" ? "上升" : "下降") + "。" : "");
      } else {
        prediction.className = "ga-prediction";
        prediction.textContent = "当前是 Oracle 半步；p_k 只解释完整迭代后的 canonical 状态。先执行 Diffusion 闭合 k=" + (state.iteration + 1) + "。";
      }
      status.textContent = phaseLabel(state) + "；当前完整步 k=" + state.iteration + "，marked=" + state.marked.map(function (index) { return binaryLabel(index, state.N); }).join(", ") + "。" + guessMessage;
    }

    function loadAtK() {
      var k = integer(jumpRange.value, 0);
      state = trajectory(currentPreset(), k)[k];
      guess = null;
      guessMessage = "已定位；现在预测下一次完整迭代。";
      render();
      announce(root, "已定位到完整步 k=" + k + "。");
    }

    initButton.addEventListener("click", function () {
      state = init(currentPreset());
      guess = null;
      guessMessage = "先预测下一次完整迭代的成功率会升还是降。";
      render();
      announce(root, "已初始化均匀叠加。");
    });
    oracleButton.addEventListener("click", function () {
      if (!(state.phase === "init" || state.phase === "iteration")) return;
      state = oracle(state);
      guess = null;
      guessMessage = "Oracle 已翻转 marked 项；接下来观察均值反射。";
      render();
      announce(root, "Oracle 半步完成，query count 加一。");
    });
    diffusionButton.addEventListener("click", function () {
      if (state.phase !== "oracle") return;
      state = iterate(diffusion(state));
      guess = null;
      guessMessage = "Diffusion 已闭合为完整迭代；现在继续预测下一步。";
      render();
      announce(root, "Diffusion 半步完成，已闭合为完整 k=" + state.iteration + "。");
    });
    iterateButton.addEventListener("click", function () {
      if (!(state.phase === "init" || state.phase === "iteration" || state.phase === "oracle")) return;
      state = iterate(state);
      guess = null;
      guessMessage = "完整迭代完成；重新预测下一步。";
      render();
      announce(root, "完整迭代完成，当前 k=" + state.iteration + "。");
    });
    jumpRange.addEventListener("input", function () { jumpOutput.textContent = jumpRange.value; });
    jumpButton.addEventListener("click", loadAtK);
    upButton.addEventListener("click", function () {
      if (!(state.phase === "init" || state.phase === "iteration")) return;
      guess = "up";
      guessMessage = "你预测下一步成功率上升；点击揭晓。";
      render();
    });
    downButton.addEventListener("click", function () {
      if (!(state.phase === "init" || state.phase === "iteration")) return;
      guess = "down";
      guessMessage = "你预测下一步成功率下降；点击揭晓。";
      render();
    });
    revealButton.addEventListener("click", function () {
      if (state.phase === "oracle") {
        state = iterate(state);
        guess = null;
        guessMessage = "Diffusion 已闭合为完整迭代；现在继续预测下一步。";
        render();
        announce(root, "已补做 Diffusion，当前为完整 k=" + state.iteration + "。");
        return;
      }
      if (!(state.phase === "init" || state.phase === "iteration")) return;
      {
        var next = predictNext(state);
        var actual = next.direction;
        var verdict = guess && guess === actual ? "预测正确" : (guess ? "预测不符" : "未先选择方向");
        state = iterate(state);
        guessMessage = verdict + "；现在继续预测下一步。";
        guess = null;
        render();
        announce(root, verdict + "，已执行完整迭代。");
      }
    });

    render();
  }

  host.CourseLearning.register("grover-amplification", buildLab);
}(typeof window !== "undefined" ? window : null));
