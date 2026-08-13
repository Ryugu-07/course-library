(function (hostWindow) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var INSTANCE_COUNT = 0;
  var FLOAT_EPSILON = 2.220446049250313e-16;
  var DEFAULTS = {
    gamma: 1,
    N: 32,
    T: 4,
    time: 1.5,
    seed: 20260714,
    trajectory: 1
  };
  var LIMITS = {
    gamma: 3,
    N: 128,
    T: 8
  };
  var PRESETS = [
    {
      key: "baseline",
      label: "基准：32 条",
      gamma: 1,
      N: 32,
      T: 4,
      time: 1.5,
      seed: 20260714,
      trajectory: 1
    },
    {
      key: "few",
      label: "小样本：4 条",
      gamma: 1,
      N: 4,
      T: 3,
      time: 1.2,
      seed: 20260715,
      trajectory: 1
    },
    {
      key: "censored",
      label: "窗口删失",
      gamma: 0.8,
      N: 16,
      T: 1,
      time: 0.8,
      seed: 20260716,
      trajectory: 1
    },
    {
      key: "zero",
      label: "边界：γ=0",
      gamma: 0,
      N: 8,
      T: 4,
      time: 2,
      seed: 20260717,
      trajectory: 1
    }
  ];

  function finite(value) {
    return Number.isFinite(value);
  }

  function number(value, fallback) {
    var parsed = Number(value);
    return finite(parsed) ? parsed : fallback;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function nonnegativeRate(value, fallback) {
    var parsed = number(value, fallback === undefined ? DEFAULTS.gamma : fallback);
    return parsed >= 0 ? parsed : 0;
  }

  function normalizeGamma(value, fallback) {
    return clamp(nonnegativeRate(value, fallback), 0, LIMITS.gamma);
  }

  function normalizeCount(value) {
    return clamp(Math.round(number(value, DEFAULTS.N)), 1, LIMITS.N);
  }

  function normalizeWindow(value) {
    return clamp(number(value, DEFAULTS.T), 0, LIMITS.T);
  }

  function normalizeSeed(value) {
    var parsed = number(value, DEFAULTS.seed);
    if (!finite(parsed)) return DEFAULTS.seed >>> 0;
    return (Math.floor(parsed) >>> 0);
  }

  function normalizeTime(value, window) {
    return clamp(number(value, DEFAULTS.time), 0, window);
  }

  function normalizeModelCount(value) {
    return Math.max(1, Math.round(number(value, DEFAULTS.N)));
  }

  function normalizeModelWindow(value) {
    return Math.max(0, number(value, DEFAULTS.T));
  }

  function normalizeConfig(options) {
    var input = options || {};
    var T = normalizeModelWindow(input.T);
    var N = normalizeModelCount(input.N);
    return {
      gamma: nonnegativeRate(input.gamma),
      N: N,
      T: T,
      time: clamp(number(input.time, DEFAULTS.time), 0, T),
      seed: normalizeSeed(input.seed),
      trajectory: clamp(Math.round(number(input.trajectory, DEFAULTS.trajectory)), 1, N)
    };
  }

  // Mulberry32 is deliberately small and specified here rather than delegated
  // to Math.random(), so the same seed produces the same ledger in Node and DOM.
  function createRng(seed) {
    var state = normalizeSeed(seed);
    return function () {
      var value;
      state = (state + 0x6d2b79f5) >>> 0;
      value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function uniformToJumpTime(gamma, uniform) {
    var rate = nonnegativeRate(gamma, 0);
    var u;
    if (rate === 0) return Infinity;
    u = clamp(number(uniform, 0.5), Number.MIN_VALUE, 1 - FLOAT_EPSILON);
    return -Math.log1p(-u) / rate;
  }

  function sampleJumpTime(gamma, rng) {
    var source = typeof rng === "function" ? rng : createRng(DEFAULTS.seed);
    return uniformToJumpTime(gamma, source());
  }

  function analyticP1(gamma, time) {
    var rate = nonnegativeRate(gamma, 0);
    var t = Math.max(0, number(time, 0));
    return rate === 0 ? 1 : Math.exp(-rate * t);
  }

  function noJumpAmplitude(gamma, time) {
    var rate = nonnegativeRate(gamma, 0);
    var t = Math.max(0, number(time, 0));
    return rate === 0 ? 1 : Math.exp(-0.5 * rate * t);
  }

  function noJumpProbability(gamma, time) {
    var amplitude = noJumpAmplitude(gamma, time);
    return amplitude * amplitude;
  }

  function conditionalNoJumpP1(gamma, time) {
    return noJumpProbability(gamma, time) > 0 ? 1 : null;
  }

  function trajectoryP1(jumpTime, time) {
    var t = Math.max(0, number(time, 0));
    return jumpTime > t ? 1 : 0;
  }

  function simulateEnsemble(options) {
    var config = normalizeConfig(options);
    var rng = createRng(config.seed);
    var trajectories = [];
    var observedJumpCount = 0;
    var censoredCount = 0;
    var structuralNoJumpCount = 0;
    var index;
    var uniform;
    var jumpTime;
    var observed;
    var outcome;

    for (index = 0; index < config.N; index += 1) {
      uniform = config.gamma === 0 ? null : rng();
      jumpTime = config.gamma === 0 ? Infinity : uniformToJumpTime(config.gamma, uniform);
      observed = finite(jumpTime) && jumpTime <= config.T;
      if (observed) {
        observedJumpCount += 1;
        outcome = "observed";
      } else if (config.gamma === 0) {
        structuralNoJumpCount += 1;
        outcome = "structural-no-jump";
      } else {
        censoredCount += 1;
        outcome = "right-censored";
      }
      trajectories.push({
        index: index + 1,
        uniform: uniform,
        jumpTime: jumpTime,
        observed: observed,
        rightCensored: outcome === "right-censored",
        structuralNoJump: outcome === "structural-no-jump",
        outcome: outcome
      });
    }

    return {
      gamma: config.gamma,
      N: config.N,
      T: config.T,
      time: config.time,
      seed: config.seed,
      trajectory: config.trajectory,
      trajectories: trajectories,
      observedJumpCount: observedJumpCount,
      censoredCount: censoredCount,
      structuralNoJumpCount: structuralNoJumpCount
    };
  }

  function empiricalP1(ensemble, time) {
    var trajectories = ensemble && ensemble.trajectories ? ensemble.trajectories : [];
    var t = Math.max(0, number(time, 0));
    var survivors = trajectories.filter(function (trajectory) {
      return trajectoryP1(trajectory.jumpTime, t) === 1;
    }).length;
    return trajectories.length ? survivors / trajectories.length : 0;
  }

  function snapshot(ensemble, time) {
    var t = clamp(Math.max(0, number(time, 0)), 0, ensemble.T);
    var sample = empiricalP1(ensemble, t);
    var analytic = analyticP1(ensemble.gamma, t);
    var error = sample - analytic;
    var standardError = Math.sqrt(Math.max(0, analytic * (1 - analytic)) / ensemble.N);
    return {
      time: t,
      empiricalP1: sample,
      analyticP1: analytic,
      error: error,
      absoluteError: Math.abs(error),
      standardError: standardError,
      empiricalGround: 1 - sample,
      analyticGround: 1 - analytic
    };
  }

  function close(left, right, tolerance) {
    return Math.abs(left - right) <= (tolerance === undefined ? 1e-10 : tolerance);
  }

  function numericSelfChecks() {
    var checks = [];
    var baselineA;
    var baselineB;
    var zeroRate;
    var one;
    var positive;
    var at;
    var previous;
    var index;

    function record(name, ok, value, expected) {
      checks.push({ name: name, ok: Boolean(ok), value: value, expected: expected });
    }

    record("P₁(0)=1", close(analyticP1(1, 0), 1), analyticP1(1, 0), 1);
    record("P₁(1/γ)=e⁻¹", close(analyticP1(1, 1), Math.exp(-1)), analyticP1(1, 1), Math.exp(-1));
    record("no-jump norm² equals survival", close(noJumpProbability(0.7, 1.3), analyticP1(0.7, 1.3)), noJumpProbability(0.7, 1.3), analyticP1(0.7, 1.3));
    record("conditional no-jump state stays |1⟩", conditionalNoJumpP1(2, 3) === 1, conditionalNoJumpP1(2, 3), 1);
    record("inverse exponential sample", close(uniformToJumpTime(2, 0.5), Math.log(2) / 2), uniformToJumpTime(2, 0.5), Math.log(2) / 2);

    baselineA = simulateEnsemble({ gamma: 1, N: 12, T: 3, seed: 9917, time: 1 });
    baselineB = simulateEnsemble({ gamma: 1, N: 12, T: 3, seed: 9917, time: 1 });
    record(
      "fixed seed reproduces the ledger",
      JSON.stringify(baselineA.trajectories) === JSON.stringify(baselineB.trajectories),
      JSON.stringify(baselineA.trajectories),
      JSON.stringify(baselineB.trajectories)
    );
    record("positive-rate ledger partitions N", baselineA.observedJumpCount + baselineA.censoredCount === baselineA.N, baselineA.observedJumpCount + baselineA.censoredCount, baselineA.N);

    zeroRate = simulateEnsemble({ gamma: 0, N: 3, T: 0, seed: 9917, time: 0 });
    record("γ=0 has no finite jump", zeroRate.trajectories.every(function (trajectory) { return trajectory.jumpTime === Infinity; }), zeroRate.trajectories.map(function (trajectory) { return trajectory.jumpTime; }).join(","), "∞,∞,∞");
    record("γ=0 has P₁=1", empiricalP1(zeroRate, 0) === 1 && empiricalP1(zeroRate, 10) === 1, empiricalP1(zeroRate, 10), 1);
    record("γ=0 ledger is structural", zeroRate.structuralNoJumpCount === zeroRate.N && zeroRate.censoredCount === 0, zeroRate.structuralNoJumpCount, zeroRate.N);

    one = simulateEnsemble({ gamma: 1, N: 1, T: 1, seed: 1, time: 1 });
    record("N=1 remains a Bernoulli trajectory", empiricalP1(one, 1) === 0 || empiricalP1(one, 1) === 1, empiricalP1(one, 1), "0 or 1");
    positive = simulateEnsemble({ gamma: 2, N: 8, T: 0, seed: 4, time: 0 });
    record("T=0 is handled as a fully right-censored window", positive.censoredCount === positive.N, positive.censoredCount, positive.N);

    previous = 1;
    for (index = 0; index <= 8; index += 1) {
      at = empiricalP1(baselineA, index * 0.35);
      record("empirical P₁ is monotone at t=" + index, at <= previous + 1e-12, at, "≤ previous");
      previous = at;
    }

    return {
      passed: checks.filter(function (check) { return check.ok; }).length,
      total: checks.length,
      ok: checks.every(function (check) { return check.ok; }),
      checks: checks
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      DEFAULTS: DEFAULTS,
      LIMITS: LIMITS,
      PRESETS: PRESETS,
      createRng: createRng,
      sampleJumpTime: sampleJumpTime,
      analyticP1: analyticP1,
      noJumpAmplitude: noJumpAmplitude,
      noJumpProbability: noJumpProbability,
      conditionalNoJumpP1: conditionalNoJumpP1,
      trajectoryP1: trajectoryP1,
      simulateEnsemble: simulateEnsemble,
      empiricalP1: empiricalP1,
      snapshot: snapshot,
      numericSelfChecks: numericSelfChecks
    };
  }

  if (!hostWindow || !hostWindow.CourseLearning || typeof hostWindow.CourseLearning.register !== "function") {
    return;
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

  function appendChildren(node, children, doc) {
    if (children === undefined || children === null) return node;
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function makeElement(api, doc, tag, attrs, children) {
    if (api && typeof api.el === "function") return api.el(tag, attrs || {}, children);
    return appendChildren(setAttributes(doc.createElement(tag), attrs || {}), children, doc);
  }

  function makeSvg(api, doc, tag, attrs, children) {
    if (api && typeof api.svg === "function") return api.svg(tag, attrs || {}, children);
    return appendChildren(
      setAttributes(doc.createElementNS(SVG_NS, tag), attrs || {}),
      children,
      doc
    );
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function format(api, value, digits) {
    var places = digits === undefined ? 3 : digits;
    var text;
    if (value === Infinity) return "∞";
    if (!finite(value)) return "—";
    if (api && typeof api.format === "function") return api.format(value, places);
    if (Math.abs(value) < Math.pow(10, -places - 1)) value = 0;
    text = value.toFixed(places);
    return text.replace(/0+$/, "").replace(/\.$/, "");
  }

  function svgText(api, doc, x, y, text, attrs) {
    var merged = { x: x, y: y, "font-size": 12, fill: "currentColor" };
    Object.keys(attrs || {}).forEach(function (key) { merged[key] = attrs[key]; });
    return makeSvg(api, doc, "text", merged, [text]);
  }

  function line(api, doc, x1, y1, x2, y2, className, attrs) {
    var merged = { x1: x1, y1: y1, x2: x2, y2: y2, className: className };
    Object.keys(attrs || {}).forEach(function (key) { merged[key] = attrs[key]; });
    return makeSvg(api, doc, "line", merged);
  }

  function numberPath(points) {
    return points.map(function (point, index) {
      return (index === 0 ? "M" : "L") + point[0].toFixed(3) + "," + point[1].toFixed(3);
    }).join(" ");
  }

  function analyticPath(gamma, T, xScale, yScale) {
    var points = [];
    var index;
    for (index = 0; index <= 48; index += 1) {
      var time = T === 0 ? 0 : T * index / 48;
      points.push([xScale(time), yScale(analyticP1(gamma, time))]);
    }
    return numberPath(points);
  }

  function ensemblePath(ensemble, xScale, yScale) {
    var jumps = ensemble.trajectories.filter(function (trajectory) {
      return trajectory.observed;
    }).sort(function (left, right) {
      return left.jumpTime - right.jumpTime;
    });
    var points = [[xScale(0), yScale(1)]];
    var survivors = ensemble.N;
    jumps.forEach(function (trajectory) {
      points.push([xScale(trajectory.jumpTime), yScale(survivors / ensemble.N)]);
      survivors -= 1;
      points.push([xScale(trajectory.jumpTime), yScale(survivors / ensemble.N)]);
    });
    points.push([xScale(ensemble.T), yScale(survivors / ensemble.N)]);
    return numberPath(points);
  }

  function singlePath(trajectory, T, xScale, yScale) {
    var end = trajectory.observed ? trajectory.jumpTime : T;
    var points = [[xScale(0), yScale(1)], [xScale(end), yScale(1)]];
    if (trajectory.observed) {
      points.push([xScale(end), yScale(0)]);
      points.push([xScale(T), yScale(0)]);
    }
    return numberPath(points);
  }

  function injectStyles(doc) {
    if (doc.querySelector && doc.querySelector("style[data-quantum-jump-style]")) return;
    var style = doc.createElement("style");
    style.setAttribute("data-quantum-jump-style", "true");
    style.textContent = [
      ".qj-lab{--qj-fg:var(--fg,#292722);--qj-muted:var(--fg-soft,#6b6557);--qj-bg:var(--bg,#fff);--qj-panel:var(--block-bg,#f4f1e9);--qj-border:var(--border,#ded7c7);--qj-accent:var(--accent,#315f9d);--qj-green:var(--cl-green,#39734d);--qj-gold:var(--cl-gold,#9b6a12);--qj-red:var(--cl-red,#b64335);box-sizing:border-box;min-width:0;max-width:100%;overflow:hidden;color:var(--qj-fg);font-size:.95em;line-height:1.5}",
      "html[data-theme='dark'] .qj-lab{--qj-fg:var(--fg,#f4f1e9);--qj-muted:var(--fg-soft,#b9b2a4);--qj-bg:var(--bg,#1e1d1a);--qj-panel:var(--block-bg,#2a2823);--qj-border:var(--border,#4a463c)}",
      ".qj-lab *,.qj-lab *::before,.qj-lab *::after{box-sizing:border-box}",
      ".qj-lab .qj-shell,.qj-lab .qj-controls,.qj-lab .qj-stage{min-width:0}",
      ".qj-lab .qj-heading{margin:0 0 .25rem;color:var(--qj-accent);font-size:1.25rem}",
      ".qj-lab .qj-intro,.qj-lab .qj-note,.qj-lab .qj-status{color:var(--qj-muted)}",
      ".qj-lab .qj-intro{margin:0 0 1rem}",
      ".qj-lab .qj-layout{display:grid;grid-template-columns:minmax(220px,.76fr) minmax(0,1.42fr);gap:18px;align-items:start}",
      ".qj-lab .qj-controls{display:grid;gap:13px}",
      ".qj-lab .qj-section{min-width:0;margin:0;padding-top:.85rem;border-top:1px solid var(--qj-border)}",
      ".qj-lab .qj-section:first-child{padding-top:0;border-top:0}",
      ".qj-lab h4{margin:0 0 .45rem;font-size:1rem}",
      ".qj-lab .qj-small{margin:.45rem 0;color:var(--qj-muted);font-size:.86em;overflow-wrap:anywhere}",
      ".qj-lab button{min-width:0;min-height:44px;padding:8px 10px;border:1px solid var(--qj-border);border-radius:6px;background:var(--qj-bg);color:inherit;cursor:pointer;font:inherit;line-height:1.35;overflow-wrap:anywhere}",
      ".qj-lab button:hover:not(:disabled){border-color:var(--qj-accent)}",
      ".qj-lab button[aria-pressed='true'],.qj-lab button.qj-primary{border-color:var(--qj-accent);background:var(--qj-accent);color:var(--qj-bg);font-weight:700}",
      ".qj-lab button.qj-correct{border-color:var(--qj-green);box-shadow:inset 0 0 0 2px var(--qj-green)}",
      ".qj-lab button.qj-wrong{border-color:var(--qj-red);box-shadow:inset 0 0 0 2px var(--qj-red)}",
      ".qj-lab button:focus-visible,.qj-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}",
      ".qj-lab .qj-preset-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}",
      ".qj-lab .qj-field{display:grid;gap:4px;margin-top:.65rem}",
      ".qj-lab .qj-field-caption{display:flex;flex-wrap:wrap;justify-content:space-between;gap:6px;color:var(--qj-muted);font-size:.89em;font-weight:650}",
      ".qj-lab .qj-output{color:var(--qj-accent);font-variant-numeric:tabular-nums}",
      ".qj-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--qj-accent)}",
      ".qj-lab .qj-action-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:.8rem}",
      ".qj-lab .qj-predictions{display:grid;gap:8px}",
      ".qj-lab .qj-pred-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(92px,1fr) minmax(92px,1fr);gap:6px;align-items:stretch}",
      ".qj-lab .qj-pred-label{display:flex;align-items:center;min-width:0;color:var(--qj-muted);font-size:.88em;overflow-wrap:anywhere}",
      ".qj-lab .qj-status{min-height:1.55em;margin:.7rem 0 0;font-size:.88em}",
      ".qj-lab .qj-stage-frame{min-width:0;padding:9px;border:1px solid var(--qj-border);border-radius:6px;background:var(--qj-bg)}",
      ".qj-lab .qj-stage-title{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;margin:0 0 7px;color:var(--qj-muted);font-size:.88em}",
      ".qj-lab .qj-svg{display:block;width:100%;max-width:100%;height:auto;color:var(--qj-fg)}",
      ".qj-lab .qj-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}",
      ".qj-lab .qj-panel{fill:var(--qj-bg);stroke:var(--qj-border);stroke-width:1.1}",
      ".qj-lab .qj-gridline{stroke:var(--qj-border);stroke-width:1;stroke-opacity:.7}",
      ".qj-lab .qj-axis{stroke:var(--qj-muted);stroke-width:1.2}",
      ".qj-lab .qj-guide{stroke:var(--qj-muted);stroke-width:1.1;stroke-dasharray:4 4;stroke-opacity:.8}",
      ".qj-lab .qj-analytic{fill:none;stroke:var(--qj-green);stroke-width:2.3;stroke-dasharray:6 4;stroke-linecap:round}",
      ".qj-lab .qj-ensemble{fill:none;stroke:var(--qj-accent);stroke-width:2.6;stroke-linejoin:miter}",
      ".qj-lab .qj-single{fill:none;stroke:var(--qj-gold);stroke-width:2.9;stroke-linecap:round;stroke-linejoin:miter}",
      ".qj-lab .qj-event{fill:var(--qj-accent);stroke:var(--qj-bg);stroke-width:1}",
      ".qj-lab .qj-event-censored{fill:none;stroke:var(--qj-muted);stroke-width:1.3}",
      ".qj-lab .qj-event-selected{fill:var(--qj-gold);stroke:var(--qj-bg);stroke-width:1.2}",
      ".qj-lab .qj-label-muted{fill:var(--qj-muted)!important;font-size:11px}",
      ".qj-lab .qj-label-main{fill:var(--qj-fg)!important;font-size:12px;font-weight:700}",
      ".qj-lab .qj-label-green{fill:var(--qj-green)!important;font-weight:700}",
      ".qj-lab .qj-label-accent{fill:var(--qj-accent)!important;font-weight:700}",
      ".qj-lab .qj-label-gold{fill:var(--qj-gold)!important;font-weight:700}",
      ".qj-lab .qj-legend{display:flex;flex-wrap:wrap;gap:7px 14px;margin:6px 2px 0;color:var(--qj-muted);font-size:12px}",
      ".qj-lab .qj-legend-item{display:inline-flex;align-items:center;gap:6px;overflow-wrap:anywhere}",
      ".qj-lab .qj-swatch{display:inline-block;width:23px;height:0;border-top:3px solid currentColor}",
      ".qj-lab .qj-swatch-analytic{color:var(--qj-green);border-top-style:dashed}",
      ".qj-lab .qj-swatch-ensemble{color:var(--qj-accent)}",
      ".qj-lab .qj-swatch-single{color:var(--qj-gold)}",
      ".qj-lab .qj-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(126px,1fr));gap:8px;margin-top:11px}",
      ".qj-lab .qj-metric{min-width:0;padding:8px;border-top:2px solid var(--qj-border);background:var(--qj-panel)}",
      ".qj-lab .qj-metric span{display:block;color:var(--qj-muted);font-size:11.5px;line-height:1.35}",
      ".qj-lab .qj-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
      ".qj-lab .qj-card{min-width:0;margin-top:12px;padding-top:9px;border-top:1px solid var(--qj-border)}",
      ".qj-lab .qj-card h4{margin-bottom:.5rem}",
      ".qj-lab .qj-formula{margin:.55rem 0;padding:8px 10px;border-left:3px solid var(--qj-accent);background:var(--qj-panel);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.86em;overflow-wrap:anywhere}",
      ".qj-lab .qj-matrix{width:100%;border-collapse:collapse;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-variant-numeric:tabular-nums}",
      ".qj-lab .qj-matrix td{width:50%;padding:7px 8px;border:1px solid var(--qj-border);text-align:center;overflow-wrap:anywhere}",
      ".qj-lab .qj-table-wrap{max-width:100%;max-height:290px;overflow:auto;-webkit-overflow-scrolling:touch}",
      ".qj-lab .qj-table{width:100%;min-width:455px;border-collapse:collapse;font-size:12.5px;font-variant-numeric:tabular-nums}",
      ".qj-lab .qj-table th,.qj-lab .qj-table td{padding:7px 8px;border-bottom:1px solid var(--qj-border);text-align:right;white-space:nowrap}",
      ".qj-lab .qj-table th:first-child,.qj-lab .qj-table td:first-child{text-align:left}",
      ".qj-lab .qj-table th{color:var(--qj-muted);font-size:11.5px;font-weight:650;position:sticky;top:0;background:var(--qj-bg)}",
      ".qj-lab .qj-table .qj-observed{color:var(--qj-accent);font-weight:700}",
      ".qj-lab .qj-table .qj-censored{color:var(--qj-muted)}",
      ".qj-lab .qj-boundary{margin-top:12px;padding:9px 10px;border-left:3px solid var(--qj-gold);background:var(--qj-panel);color:var(--qj-muted);font-size:.87em;line-height:1.65;overflow-wrap:anywhere}",
      ".qj-lab .qj-checks{margin:.8rem 0 0;color:var(--qj-muted);font-size:.82em;overflow-wrap:anywhere}",
      "@media (max-width:800px){.qj-lab .qj-layout{grid-template-columns:minmax(0,1fr)}}",
      "@media (max-width:500px){.qj-lab .qj-pred-row{grid-template-columns:minmax(0,1fr)}.qj-lab .qj-pred-row .qj-pred-label{margin-bottom:-2px}.qj-lab .qj-pred-row button{width:100%}.qj-lab .qj-action-row{grid-template-columns:minmax(0,1fr)}.qj-lab .qj-stage-frame{padding:6px}.qj-lab .qj-table{font-size:12px}}",
      "@media (prefers-reduced-motion:reduce){.qj-lab *{scroll-behavior:auto!important;transition:none!important;animation:none!important}}"
    ].join("\n");
    (doc.head || doc.documentElement || doc.body).appendChild(style);
  }

  function rangeField(api, doc, serial, key, label, min, max, step, value) {
    var id = "qj-" + key + "-" + serial;
    var wrapper = makeElement(api, doc, "label", { className: "qj-field", htmlFor: id });
    var caption = makeElement(api, doc, "span", { className: "qj-field-caption" });
    var labelText = makeElement(api, doc, "span", { text: label });
    var output = makeElement(api, doc, "output", { className: "qj-output", htmlFor: id, text: "—" });
    var input = makeElement(api, doc, "input", {
      id: id,
      type: "range",
      min: String(min),
      max: String(max),
      step: String(step),
      value: String(value),
      "aria-label": label
    });
    caption.appendChild(labelText);
    caption.appendChild(output);
    wrapper.appendChild(caption);
    wrapper.appendChild(input);
    return { wrapper: wrapper, input: input, output: output, id: id };
  }

  function metric(api, doc, label, key) {
    var box = makeElement(api, doc, "div", { className: "qj-metric" });
    var labelNode = makeElement(api, doc, "span", { text: label });
    var valueNode = makeElement(api, doc, "strong", { text: "—", "data-qj-value": key });
    box.appendChild(labelNode);
    box.appendChild(valueNode);
    return { node: box, value: valueNode };
  }

  function renderChart(api, doc, svg, ensemble, selected, time, description) {
    var width = 360;
    var height = 310;
    var left = 43;
    var right = 350;
    var top = 40;
    var bottom = 190;
    var eventY = 252;
    var xScale = function (value) {
      return ensemble.T === 0 ? left : left + (value / ensemble.T) * (right - left);
    };
    var yScale = function (value) { return bottom - clamp(value, 0, 1) * (bottom - top); };
    var currentX = xScale(time);
    clear(svg);
    svg.appendChild(makeSvg(api, doc, "title", { id: svg.getAttribute("aria-labelledby").split(" ")[0] }, "量子跳跃的单轨迹、有限系综与解析生存曲线"));
    svg.appendChild(makeSvg(api, doc, "desc", { id: svg.getAttribute("aria-labelledby").split(" ")[1] }, description));
    svg.appendChild(makeSvg(api, doc, "rect", { x: left, y: top, width: right - left, height: bottom - top, className: "qj-panel" }));
    [0, 0.5, 1].forEach(function (value) {
      var y = yScale(value);
      svg.appendChild(line(api, doc, left, y, right, y, "qj-gridline"));
      svg.appendChild(svgText(api, doc, left - 7, y + 4, format(null, value, 1), { className: "qj-label-muted", "text-anchor": "end" }));
    });
    [0, ensemble.T / 2, ensemble.T].forEach(function (value, tickIndex) {
      var x = xScale(value);
      svg.appendChild(line(api, doc, x, bottom, x, bottom + 5, "qj-axis"));
      svg.appendChild(svgText(api, doc, x, bottom + 18, tickIndex === 0 ? "0" : format(null, value, 2), { className: "qj-label-muted", "text-anchor": tickIndex === 0 ? "start" : tickIndex === 2 ? "end" : "middle" }));
    });
    svg.appendChild(line(api, doc, left, bottom, right, bottom, "qj-axis"));
    svg.appendChild(line(api, doc, left, top, left, bottom, "qj-axis"));
    svg.appendChild(svgText(api, doc, left, 25, "激发态布居 p₁", { className: "qj-label-main" }));
    svg.appendChild(svgText(api, doc, right, bottom + 32, "观察时间 t", { className: "qj-label-muted", "text-anchor": "end" }));
    svg.appendChild(svgText(api, doc, left - 32, top - 2, "1", { className: "qj-label-muted" }));
    svg.appendChild(makeSvg(api, doc, "path", { d: analyticPath(ensemble.gamma, ensemble.T, xScale, yScale), className: "qj-analytic", "aria-label": "解析 P1(t)=exp(-gamma t)" }));
    svg.appendChild(makeSvg(api, doc, "path", { d: ensemblePath(ensemble, xScale, yScale), className: "qj-ensemble", "aria-label": "N 条轨迹的经验平均" }));
    svg.appendChild(makeSvg(api, doc, "path", { d: singlePath(selected, ensemble.T, xScale, yScale), className: "qj-single", "aria-label": "固定种子的第 " + selected.index + " 条单轨迹" }));
    svg.appendChild(line(api, doc, currentX, top, currentX, bottom, "qj-guide"));
    svg.appendChild(svgText(api, doc, currentX, top - 7, "t", { className: "qj-label-muted", "text-anchor": currentX > right - 25 ? "end" : "start" }));
    if (selected.observed) {
      svg.appendChild(makeSvg(api, doc, "circle", { cx: xScale(selected.jumpTime), cy: yScale(0.5), r: 4.5, className: "qj-event-selected" }));
    }
    svg.appendChild(svgText(api, doc, left, eventY - 11, "跳跃时刻 τ（窗口内）", { className: "qj-label-muted" }));
    svg.appendChild(line(api, doc, left, eventY, right, eventY, "qj-axis"));
    ensemble.trajectories.forEach(function (trajectory) {
      var eventX = trajectory.observed ? xScale(trajectory.jumpTime) : right;
      svg.appendChild(makeSvg(api, doc, "circle", {
        cx: eventX,
        cy: eventY,
        r: trajectory.index === selected.index ? 4.3 : 2.2,
        className: trajectory.index === selected.index ? "qj-event-selected" : trajectory.observed ? "qj-event" : "qj-event-censored"
      }));
    });
    svg.appendChild(svgText(api, doc, right, eventY + 18, "T", { className: "qj-label-muted", "text-anchor": "end" }));
    svg.appendChild(svgText(api, doc, left, height - 7, "实心：已观测跳跃；空心：窗口右删失", { className: "qj-label-muted" }));
  }

  function mount(root, api) {
    var doc = root.ownerDocument || document;
    var serial;
    var ids;
    var state;
    var refs = {};
    var selfChecks = numericSelfChecks();
    var predictionQuestions = [
      {
        key: "single",
        prompt: "单条轨迹的 p₁(t) 怎么走？",
        choices: [
          { key: "step", label: "在 τ 处由 1 跳到 0" },
          { key: "smooth", label: "每条都平滑按 e⁻ᵞᵗ 降" }
        ],
        expected: "step"
      },
      {
        key: "average",
        prompt: "N 很大时平均的 P₁(t) 是？",
        choices: [
          { key: "survival", label: "e⁻ᵞᵗ（生存概率）" },
          { key: "cdf", label: "1−e⁻ᵞᵗ（跳跃 CDF）" }
        ],
        expected: "survival"
      },
      {
        key: "censor",
        prompt: "若 τ>T，窗口账本应写？",
        choices: [
          { key: "right", label: ">T：右删失，尚未见跳" },
          { key: "atT", label: "τ=T：把跳跃放在端点" }
        ],
        expected: "right"
      },
      {
        key: "conditional",
        prompt: "已知 no-jump，到 t 的条件态是？",
        choices: [
          { key: "excited", label: "仍为 |1⟩（已归一化）" },
          { key: "scaled", label: "e⁻ᵞᵗ/²|1⟩（仍未归一化）" }
        ],
        expected: "excited"
      }
    ];

    injectStyles(doc);
    root.classList.add("qj-lab");
    INSTANCE_COUNT += 1;
    serial = INSTANCE_COUNT;
    ids = {
      svgTitle: "qj-svg-title-" + serial,
      svgDesc: "qj-svg-desc-" + serial,
      time: "qj-time-" + serial,
      trajectory: "qj-trajectory-" + serial
    };
    state = {
      gamma: DEFAULTS.gamma,
      N: DEFAULTS.N,
      T: DEFAULTS.T,
      time: DEFAULTS.time,
      seed: DEFAULTS.seed,
      trajectory: DEFAULTS.trajectory,
      answers: Object.create(null),
      checked: false,
      presetKey: "baseline"
    };

    var shell = makeElement(api, doc, "div", { className: "qj-shell" });
    shell.appendChild(makeElement(api, doc, "h3", { className: "qj-heading" }, "量子跳跃：从一次轨迹到 Lindblad 密度矩阵"));
    shell.appendChild(makeElement(api, doc, "p", { className: "qj-intro" }, "固定种子生成 photon-counting jump unraveling：先读一条阶跃轨迹，再把 N 条轨迹平均；绿色解析线是 P₁(t)=e⁻ᵞᵗ。轨迹是给定监测方案下的条件记录，不是唯一客观历史。"));

    var layout = makeElement(api, doc, "div", { className: "qj-layout" });
    var controls = makeElement(api, doc, "aside", { className: "qj-controls", "aria-label": "量子跳跃实验控制" });
    var stage = makeElement(api, doc, "section", { className: "qj-stage", "aria-label": "量子跳跃实验读数" });

    var presetSection = makeElement(api, doc, "section", { className: "qj-section" });
    presetSection.appendChild(makeElement(api, doc, "h4", { text: "教学预设" }));
    presetSection.appendChild(makeElement(api, doc, "p", { className: "qj-small", text: "每个预设都锁定一个 seed；切换后可直接比较单轨迹、系综误差与删失。" }));
    var presetGrid = makeElement(api, doc, "div", { className: "qj-preset-grid", role: "group", "aria-label": "量子跳跃教学预设" });
    PRESETS.forEach(function (preset) {
      var button = makeElement(api, doc, "button", { type: "button", "data-qj-preset": preset.key, "aria-pressed": "false" }, preset.label);
      button.addEventListener("click", function () {
        state.gamma = preset.gamma;
        state.N = preset.N;
        state.T = preset.T;
        state.time = Math.min(preset.time, preset.T);
        state.seed = preset.seed;
        state.trajectory = Math.min(preset.trajectory, preset.N);
        gammaField.input.value = String(preset.gamma);
        countField.input.value = String(preset.N);
        windowField.input.value = String(preset.T);
        timeField.input.value = String(Math.min(preset.time, preset.T));
        trajectoryField.input.value = String(Math.min(preset.trajectory, preset.N));
        state.answers = Object.create(null);
        state.checked = false;
        state.presetKey = preset.key;
        render();
        announce("已切换到“" + preset.label + "”；请先预测，再读固定种子账本。");
      });
      preset.button = button;
      presetGrid.appendChild(button);
    });
    presetSection.appendChild(presetGrid);
    controls.appendChild(presetSection);

    var parameterSection = makeElement(api, doc, "section", { className: "qj-section" });
    parameterSection.appendChild(makeElement(api, doc, "h4", { text: "参数与观察" }));
    var gammaField = rangeField(api, doc, serial, "gamma", "跳跃率 γ", 0, LIMITS.gamma, .05, DEFAULTS.gamma);
    var countField = rangeField(api, doc, serial, "count", "轨迹数 N", 1, LIMITS.N, 1, DEFAULTS.N);
    var windowField = rangeField(api, doc, serial, "window", "观察窗 T", 0, LIMITS.T, .25, DEFAULTS.T);
    var timeField = rangeField(api, doc, serial, "time", "当前时刻 t", 0, LIMITS.T, .05, DEFAULTS.time);
    var trajectoryField = rangeField(api, doc, serial, "trajectory", "显示第 k 条轨迹", 1, LIMITS.N, 1, DEFAULTS.trajectory);
    parameterSection.appendChild(gammaField.wrapper);
    parameterSection.appendChild(countField.wrapper);
    parameterSection.appendChild(windowField.wrapper);
    parameterSection.appendChild(timeField.wrapper);
    parameterSection.appendChild(trajectoryField.wrapper);
    parameterSection.appendChild(makeElement(api, doc, "p", { className: "qj-small", text: "固定 PRNG seed：" + state.seed + "；同一 seed、γ、N、T 会得到同一跳跃时间账本。" }));
    var actionRow = makeElement(api, doc, "div", { className: "qj-action-row" });
    refs.reset = makeElement(api, doc, "button", { type: "button", className: "qj-primary" }, "重置基准");
    refs.check = makeElement(api, doc, "button", { type: "button" }, "核对预测");
    actionRow.appendChild(refs.reset);
    actionRow.appendChild(refs.check);
    parameterSection.appendChild(actionRow);
    controls.appendChild(parameterSection);

    var predictionSection = makeElement(api, doc, "section", { className: "qj-section" });
    predictionSection.appendChild(makeElement(api, doc, "h4", { text: "先预测，再看图" }));
    predictionSection.appendChild(makeElement(api, doc, "p", { className: "qj-small", text: "四个答案都可由右侧的闭式推导判决；错答会保留并标红，不会偷偷替换。" }));
    var predictionGrid = makeElement(api, doc, "div", { className: "qj-predictions" });
    predictionQuestions.forEach(function (question) {
      var row = makeElement(api, doc, "div", { className: "qj-pred-row", "data-qj-question": question.key });
      row.appendChild(makeElement(api, doc, "span", { className: "qj-pred-label", text: question.prompt }));
      question.choices.forEach(function (choice) {
        var button = makeElement(api, doc, "button", {
          type: "button",
          "data-qj-pred": question.key,
          "data-qj-choice": choice.key,
          "aria-pressed": "false"
        }, choice.label);
        button.addEventListener("click", function () {
          state.answers[question.key] = choice.key;
          state.checked = false;
          renderPredictions();
          refs.predictionStatus.textContent = "已记录“" + question.prompt + "”；四题都选好后核对。";
        });
        row.appendChild(button);
      });
      predictionGrid.appendChild(row);
    });
    predictionSection.appendChild(predictionGrid);
    refs.predictionStatus = makeElement(api, doc, "p", { className: "qj-status", "aria-live": "polite", "aria-atomic": "true" }, "先写下四项预测。");
    predictionSection.appendChild(refs.predictionStatus);
    controls.appendChild(predictionSection);

    var frame = makeElement(api, doc, "div", { className: "qj-stage-frame" });
    refs.stageTitle = makeElement(api, doc, "div", { className: "qj-stage-title" });
    refs.stageTitle.appendChild(makeElement(api, doc, "span", { text: "—" }));
    refs.stageTitle.appendChild(makeElement(api, doc, "span", { text: "金：一条轨迹；蓝：有限平均；绿：解析" }));
    frame.appendChild(refs.stageTitle);
    refs.svg = makeSvg(api, doc, "svg", {
      className: "qj-svg",
      viewBox: "0 0 360 310",
      role: "img",
      "aria-labelledby": ids.svgTitle + " " + ids.svgDesc
    });
    refs.svg.appendChild(makeSvg(api, doc, "title", { id: ids.svgTitle }, "量子跳跃的单轨迹、有限系综与解析生存曲线"));
    refs.svg.appendChild(makeSvg(api, doc, "desc", { id: ids.svgDesc }, "图中比较固定种子的一条 0/1 阶跃轨迹、N 条轨迹的经验平均和解析 P1(t)=exp(-gamma t)，下方标出观察窗内跳跃与右删失。"));
    frame.appendChild(refs.svg);
    var legend = makeElement(api, doc, "div", { className: "qj-legend", "aria-label": "曲线图例" });
    [
      ["qj-swatch-single", "金：单轨迹 p₁(t)"],
      ["qj-swatch-ensemble", "蓝：N 条平均"],
      ["qj-swatch-analytic", "绿虚线：e⁻ᵞᵗ"]
    ].forEach(function (item) {
      var legendItem = makeElement(api, doc, "span", { className: "qj-legend-item" });
      legendItem.appendChild(makeElement(api, doc, "i", { className: "qj-swatch " + item[0], "aria-hidden": "true" }));
      legendItem.appendChild(makeElement(api, doc, "span", { text: item[1] }));
      legend.appendChild(legendItem);
    });
    frame.appendChild(legend);

    var metrics = makeElement(api, doc, "div", { className: "qj-metrics" });
    refs.metricSample = metric(api, doc, "样本 P̂₁(t)", "sample");
    refs.metricAnalytic = metric(api, doc, "解析 P₁(t)", "analytic");
    refs.metricError = metric(api, doc, "有限样本误差", "error");
    refs.metricSe = metric(api, doc, "解析 1σ 参考", "se");
    refs.metricObserved = metric(api, doc, "窗口内已跳", "observed");
    refs.metricCensored = metric(api, doc, "右删失", "censored");
    [refs.metricSample, refs.metricAnalytic, refs.metricError, refs.metricSe, refs.metricObserved, refs.metricCensored].forEach(function (item) { metrics.appendChild(item.node); });
    frame.appendChild(metrics);

    var stateCard = makeElement(api, doc, "section", { className: "qj-card" });
    stateCard.appendChild(makeElement(api, doc, "h4", { text: "三种“状态”不要混写" }));
    refs.noJumpFormula = makeElement(api, doc, "div", { className: "qj-formula", role: "img", "aria-label": "未归一化 no-jump state 与条件态" });
    stateCard.appendChild(refs.noJumpFormula);
    refs.selectedReadout = makeElement(api, doc, "p", { className: "qj-small", "aria-live": "polite" });
    stateCard.appendChild(refs.selectedReadout);
    frame.appendChild(stateCard);

    var matrixCard = makeElement(api, doc, "section", { className: "qj-card" });
    matrixCard.appendChild(makeElement(api, doc, "h4", { text: "系综密度矩阵（当前 t）" }));
    refs.matrix = makeElement(api, doc, "table", { className: "qj-matrix", "aria-label": "当前系综密度矩阵" });
    var matrixBody = makeElement(api, doc, "tbody");
    refs.matrixCells = [];
    [0, 1].forEach(function () {
      var row = makeElement(api, doc, "tr");
      [0, 1].forEach(function () {
        var cell = makeElement(api, doc, "td", { text: "—" });
        refs.matrixCells.push(cell);
        row.appendChild(cell);
      });
      matrixBody.appendChild(row);
    });
    refs.matrix.appendChild(matrixBody);
    matrixCard.appendChild(refs.matrix);
    matrixCard.appendChild(makeElement(api, doc, "p", { className: "qj-small", text: "本零温初态下 ρ_N(t)=diag(1−P̂₁(t), P̂₁(t))；N→∞ 才回到解析 Lindblad ρ(t)。" }));
    frame.appendChild(matrixCard);

    var ledgerCard = makeElement(api, doc, "section", { className: "qj-card" });
    ledgerCard.appendChild(makeElement(api, doc, "h4", { text: "跳跃时间 / 观察窗账本" }));
    var tableWrap = makeElement(api, doc, "div", { className: "qj-table-wrap" });
    refs.ledger = makeElement(api, doc, "table", { className: "qj-table", "aria-label": "固定种子跳跃时间与删失账本" });
    refs.ledger.appendChild(makeElement(api, doc, "caption", { className: "qj-small", text: "真值 τ 是模拟器内部的完整时间；窗口记录只在 τ≤T 时可观测，否则写作 >T。" }));
    refs.ledger.appendChild(makeElement(api, doc, "thead", {}, makeElement(api, doc, "tr", {}, [
      makeElement(api, doc, "th", { scope: "col" }, "#"),
      makeElement(api, doc, "th", { scope: "col" }, "u"),
      makeElement(api, doc, "th", { scope: "col" }, "真值 τ"),
      makeElement(api, doc, "th", { scope: "col" }, "窗口记录"),
      makeElement(api, doc, "th", { scope: "col" }, "p₁(T)")
    ])));
    refs.ledgerBody = makeElement(api, doc, "tbody");
    refs.ledger.appendChild(refs.ledgerBody);
    tableWrap.appendChild(refs.ledger);
    ledgerCard.appendChild(tableWrap);
    frame.appendChild(ledgerCard);

    refs.boundary = makeElement(api, doc, "div", { className: "qj-boundary" });
    frame.appendChild(refs.boundary);
    refs.checks = makeElement(api, doc, "p", { className: "qj-checks" });
    frame.appendChild(refs.checks);
    stage.appendChild(frame);
    layout.appendChild(controls);
    layout.appendChild(stage);
    shell.appendChild(layout);
    root.replaceChildren(shell);

    function announce(message) {
      if (api && typeof api.announce === "function") {
        try { api.announce(root, message); } catch (error) { /* optional accessibility helper */ }
      }
    }

    function readInputs() {
      state.gamma = normalizeGamma(gammaField.input.value, state.gamma);
      state.N = normalizeCount(countField.input.value);
      state.T = normalizeWindow(windowField.input.value);
      state.time = normalizeTime(timeField.input.value, state.T);
      state.trajectory = clamp(Math.round(number(trajectoryField.input.value, state.trajectory)), 1, state.N);
    }

    function resetPredictions() {
      state.answers = Object.create(null);
      state.checked = false;
      refs.predictionStatus.textContent = "参数已改变；请重新写下四项预测。";
    }

    function renderPredictions() {
      Array.prototype.slice.call(root.querySelectorAll("[data-qj-pred]")).forEach(function (button) {
        var question = button.getAttribute("data-qj-pred");
        var choice = button.getAttribute("data-qj-choice");
        var selected = state.answers[question] === choice;
        var expected = predictionQuestions.filter(function (item) { return item.key === question; })[0].expected;
        button.setAttribute("aria-pressed", selected ? "true" : "false");
        button.classList.remove("qj-correct", "qj-wrong");
        if (state.checked && selected) button.classList.add(choice === expected ? "qj-correct" : "qj-wrong");
      });
      if (state.checked) {
        var complete = predictionQuestions.every(function (question) { return state.answers[question.key] !== undefined; });
        if (complete) {
          var correct = predictionQuestions.filter(function (question) { return state.answers[question.key] === question.expected; }).length;
          refs.predictionStatus.textContent = "预测反馈：" + correct + "/" + predictionQuestions.length + " 正确。绿色解析线判决的是系综概率；金色阶跃不是被平滑化的单次历史。";
        }
      }
    }

    function renderLedger(ensemble) {
      clear(refs.ledgerBody);
      ensemble.trajectories.forEach(function (trajectory) {
        var row = makeElement(api, doc, "tr");
        var statusClass = trajectory.observed ? "qj-observed" : "qj-censored";
        var windowRecord = trajectory.observed ? "τ=" + format(api, trajectory.jumpTime, 3) : trajectory.structuralNoJump ? "∞（γ=0）" : ">T（右删失）";
        var windowState = trajectoryP1(trajectory.jumpTime, ensemble.T);
        [
          String(trajectory.index),
          trajectory.uniform === null ? "—" : format(api, trajectory.uniform, 5),
          trajectory.structuralNoJump ? "∞" : format(api, trajectory.jumpTime, 3),
          windowRecord,
          format(api, windowState, 0)
        ].forEach(function (value, cellIndex) {
          var cell = makeElement(api, doc, cellIndex === 3 ? "td" : "td", { text: value });
          if (cellIndex === 3) cell.className = statusClass;
          row.appendChild(cell);
        });
        refs.ledgerBody.appendChild(row);
      });
    }

    function render() {
      var ensemble;
      var selected;
      var reading;
      var noJump;
      var selectedP1;
      var density;
      var complete;
      readInputs();
      ensemble = simulateEnsemble(state);
      state.N = ensemble.N;
      state.T = ensemble.T;
      state.time = ensemble.time;
      state.seed = ensemble.seed;
      state.trajectory = clamp(state.trajectory, 1, ensemble.N);
      selected = ensemble.trajectories[state.trajectory - 1];
      reading = snapshot(ensemble, state.time);
      noJump = noJumpProbability(ensemble.gamma, state.time);
      selectedP1 = trajectoryP1(selected.jumpTime, state.time);
      density = {
        rho00: 1 - reading.empiricalP1,
        rho11: reading.empiricalP1
      };
      gammaField.input.value = String(ensemble.gamma);
      countField.input.value = String(ensemble.N);
      windowField.input.value = String(ensemble.T);
      timeField.input.max = String(ensemble.T);
      timeField.input.value = String(ensemble.time);
      trajectoryField.input.max = String(ensemble.N);
      trajectoryField.input.value = String(state.trajectory);
      gammaField.output.textContent = "γ=" + format(api, ensemble.gamma, 2);
      countField.output.textContent = "N=" + ensemble.N;
      windowField.output.textContent = "T=" + format(api, ensemble.T, 2);
      timeField.output.textContent = "t=" + format(api, ensemble.time, 2);
      trajectoryField.output.textContent = "第 " + state.trajectory + " 条";
      timeField.input.setAttribute("aria-valuetext", "t=" + format(api, ensemble.time, 2) + "，观察窗 T=" + format(api, ensemble.T, 2));
      trajectoryField.input.setAttribute("aria-valuetext", "第 " + state.trajectory + " 条轨迹，共 " + ensemble.N + " 条");
      refs.stageTitle.firstChild.textContent = "γ=" + format(api, ensemble.gamma, 2) + " · N=" + ensemble.N + " · T=" + format(api, ensemble.T, 2) + " · seed=" + ensemble.seed;
      PRESETS.forEach(function (preset) {
        preset.button.setAttribute("aria-pressed", preset.key === state.presetKey ? "true" : "false");
      });
      refs.metricSample.value.textContent = format(api, reading.empiricalP1, 3);
      refs.metricAnalytic.value.textContent = format(api, reading.analyticP1, 3);
      refs.metricError.value.textContent = (reading.error >= 0 ? "+" : "") + format(api, reading.error, 3);
      refs.metricSe.value.textContent = "±" + format(api, reading.standardError, 3);
      refs.metricObserved.value.textContent = String(ensemble.observedJumpCount);
      refs.metricCensored.value.textContent = ensemble.gamma === 0 ? "0（结构性∞）" : String(ensemble.censoredCount);
      refs.noJumpFormula.textContent = "未归一化 no-jump：|ψ̃(t)⟩=" + format(api, noJumpAmplitude(ensemble.gamma, state.time), 3) + "|1⟩，‖ψ̃‖²=S(t)=e⁻ᵞᵗ=" + format(api, noJump, 3) + "；条件 no-jump：|ψ̃⟩/‖ψ̃‖=|1⟩（本模型 t 有限时）。";
      refs.selectedReadout.textContent = "第 " + selected.index + " 条：" + (selected.observed ? "τ=" + format(api, selected.jumpTime, 3) + "，已在窗口内跳到 |0⟩。" : selected.structuralNoJump ? "τ=∞（γ=0），保持 |1⟩。" : "真值 τ=" + format(api, selected.jumpTime, 3) + ">T，窗口内只知道右删失；当前 p₁=" + selectedP1 + "。");
      refs.matrixCells[0].textContent = format(api, density.rho00, 3);
      refs.matrixCells[1].textContent = "0";
      refs.matrixCells[2].textContent = "0";
      refs.matrixCells[3].textContent = format(api, density.rho11, 3);
      refs.boundary.textContent = "边界：未归一化 no-jump state 的范数平方是“还没跳”的概率，不是条件态的布居；条件态在已知 no-jump 时仍为 |1⟩。本台只实现 photon-counting jump unraveling；homodyne 等 diffusive unraveling 可给出不同的单轨迹，却必须平均到同一个 Lindblad ρ。轨迹是模型化的条件记录，不是唯一客观历史。";
      refs.checks.textContent = "解析/边界自检：" + selfChecks.passed + "/" + selfChecks.total + " 通过；包含固定 seed、γ=0、N=1、T=0、no-jump 范数和有限样本单调性。";
      renderChart(api, doc, refs.svg, ensemble, selected, state.time, "当前 γ=" + format(api, ensemble.gamma, 2) + "、N=" + ensemble.N + "、T=" + format(api, ensemble.T, 2) + "；金色单轨迹在 τ 处从 1 变为 0，蓝色阶梯是 N 条轨迹的平均，绿色虚线是解析生存概率。");
      renderLedger(ensemble);
      renderPredictions();
      complete = predictionQuestions.every(function (question) { return state.answers[question.key] !== undefined; });
      if (!complete && !state.checked) refs.predictionStatus.textContent = "先写下四项预测。";
    }

    [gammaField.input, countField.input, windowField.input, timeField.input, trajectoryField.input].forEach(function (input) {
      input.addEventListener("input", function () {
        state.presetKey = null;
        resetPredictions();
        render();
      });
    });
    refs.check.addEventListener("click", function () {
      var complete = predictionQuestions.every(function (question) { return state.answers[question.key] !== undefined; });
      if (!complete) {
        refs.predictionStatus.textContent = "还缺预测：请为四个问题各选一项。";
        announce("请先完成四项预测。");
        return;
      }
      state.checked = true;
      renderPredictions();
      announce(refs.predictionStatus.textContent);
    });
    refs.reset.addEventListener("click", function () {
      state.gamma = DEFAULTS.gamma;
      state.N = DEFAULTS.N;
      state.T = DEFAULTS.T;
      state.time = DEFAULTS.time;
      state.seed = DEFAULTS.seed;
      state.trajectory = DEFAULTS.trajectory;
      gammaField.input.value = String(DEFAULTS.gamma);
      countField.input.value = String(DEFAULTS.N);
      windowField.input.value = String(DEFAULTS.T);
      timeField.input.value = String(DEFAULTS.time);
      trajectoryField.input.value = String(DEFAULTS.trajectory);
      state.answers = Object.create(null);
      state.checked = false;
      state.presetKey = "baseline";
      render();
      announce("实验已重置为固定基准 seed、γ=1、N=32、T=4。");
    });
    render();
  }

  hostWindow.CourseLearning.register("quantum-jump", mount);
}(typeof window !== "undefined" ? window : null));
