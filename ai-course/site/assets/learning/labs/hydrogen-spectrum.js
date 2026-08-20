(function (root, factory) {
  "use strict";

  var exported = factory();
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("hydrogen-spectrum", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("hydrogen-spectrum self-test: PASS (" + report.checks + " checks, " + report.states + " state presets)");
    } catch (error) {
      console.error("hydrogen-spectrum self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var RYDBERG_EV = 13.6;
  var MAX_N = 5;
  var INSTANCE = 0;
  var EPSILON = 1e-10;

  var TRANSITIONS = [
    {
      id: "2p-1s",
      label: "2p,m=0 → 1s,m=0 · E1 允许",
      from: { n: 2, l: 1, m: 0 },
      to: { n: 1, l: 0, m: 0 }
    },
    {
      id: "2s-1s",
      label: "2s,m=0 → 1s,m=0 · Δl=0 禁戒",
      from: { n: 2, l: 0, m: 0 },
      to: { n: 1, l: 0, m: 0 }
    },
    {
      id: "3d-2p-allowed",
      label: "3d,m=2 → 2p,m=1 · E1 允许",
      from: { n: 3, l: 2, m: 2 },
      to: { n: 2, l: 1, m: 1 }
    },
    {
      id: "3d-2p-forbidden",
      label: "3d,m=2 → 2p,m=0 · Δm=-2 禁戒",
      from: { n: 3, l: 2, m: 2 },
      to: { n: 2, l: 1, m: 0 }
    }
  ];

  var STATE_PRESETS = [
    { id: "1s", label: "1s", n: 1, l: 0, m: 0, transitionId: "2p-1s" },
    { id: "2s", label: "2s", n: 2, l: 0, m: 0, transitionId: "2s-1s" },
    { id: "2p", label: "2p,m=0", n: 2, l: 1, m: 0, transitionId: "2p-1s" },
    { id: "3d", label: "3d,m=2", n: 3, l: 2, m: 2, transitionId: "3d-2p-allowed" }
  ];

  var STYLE_TEXT = [
    ".hys-lab{--hys-blue:var(--cl-blue,#315f9d);--hys-green:var(--cl-green,#39734d);--hys-gold:var(--cl-gold,#9b6a12);--hys-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg,#292722);line-height:1.55;overflow-wrap:anywhere}",
    ".hys-lab *,.hys-lab *::before,.hys-lab *::after{box-sizing:border-box}.hys-lab [hidden]{display:none!important}.hys-lab h3,.hys-lab h4{margin:0;color:var(--fg,#292722);letter-spacing:0}.hys-lab h3{font-size:1.12rem}.hys-lab h4{font-size:1rem}.hys-lab p{margin:8px 0}.hys-lab .hys-note,.hys-lab .hys-feedback,.hys-lab .hys-detail{color:var(--fg-soft,var(--muted,#6b6557));font-size:13px;line-height:1.65}.hys-lab button{font:inherit;min-width:0;min-height:44px;padding:8px 10px;border:1px solid var(--border,#d7d0c2);border-radius:6px;background:var(--bg,#fff);color:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.hys-lab button:hover{border-color:var(--hys-blue)}.hys-lab button:focus-visible,.hys-lab input:focus-visible,.hys-lab select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.hys-lab button[aria-pressed=true],.hys-lab .hys-primary{border-color:var(--hys-blue);background:var(--hys-blue);color:var(--bg,#fff);font-weight:750}.hys-lab .hys-presets{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:10px 0 14px}.hys-lab .hys-presets button{font-size:12px}.hys-lab .hys-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px 12px;margin:11px 0;padding:12px;border:1px solid var(--border,#d7d0c2);background:var(--block-bg,var(--bg,#fff))}.hys-lab .hys-control{display:grid;gap:4px;min-width:0}.hys-lab .hys-control label{font-size:12.5px;font-weight:700;color:var(--fg-soft,var(--muted,#6b6557))}.hys-lab .hys-control output{color:var(--hys-blue);font-variant-numeric:tabular-nums}.hys-lab select{width:100%;height:44px;min-height:44px;padding:5px 7px;border:1px solid var(--border,#d7d0c2);border-radius:5px;background:var(--bg,#fff);color:inherit;font:inherit}.hys-lab input[type=range]{display:block;width:100%;height:44px;min-height:44px;margin:0;accent-color:var(--hys-blue)}.hys-lab .hys-predict{margin-top:12px;padding:12px;border:1px solid var(--border,#d7d0c2);background:var(--block-bg,var(--bg,#fff))}.hys-lab .hys-question{margin:10px 0 0;padding:9px;border:1px solid var(--border,#d7d0c2);min-width:0}.hys-lab .hys-question legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}.hys-lab .hys-choice-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.hys-lab .hys-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px}.hys-lab .hys-actions>*{flex:1 1 160px}.hys-lab .hys-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.hys-lab .hys-pass{color:var(--hys-green)}.hys-lab .hys-warn{color:var(--hys-red)}.hys-lab .hys-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border,#d7d0c2)}.hys-lab .hys-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:11px 0}.hys-lab .hys-metric{min-width:0;padding:8px;border-top:2px solid var(--border,#d7d0c2);background:var(--block-bg,var(--bg,#fff))}.hys-lab .hys-metric:nth-child(4n+1){border-color:var(--hys-blue)}.hys-lab .hys-metric:nth-child(4n+2){border-color:var(--hys-green)}.hys-lab .hys-metric:nth-child(4n+3){border-color:var(--hys-gold)}.hys-lab .hys-metric:nth-child(4n){border-color:var(--hys-red)}.hys-lab .hys-metric span{display:block;color:var(--fg-soft,var(--muted,#6b6557));font-size:11px;line-height:1.4}.hys-lab .hys-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.hys-lab .hys-charts{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;min-width:0}.hys-lab .hys-chart{min-width:0}.hys-lab .hys-frame{min-width:0;padding:7px;border:1px solid var(--border,#d7d0c2);border-radius:6px;background:var(--bg,#fff);overflow:hidden}.hys-lab svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg,#292722)}.hys-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.hys-lab .hys-axis{stroke:currentColor;stroke-opacity:.22;stroke-width:1}.hys-lab .hys-level{stroke:var(--hys-blue);stroke-width:2.4}.hys-lab .hys-level-selected{stroke:var(--hys-red);stroke-width:4}.hys-lab .hys-curve{fill:none;stroke:var(--hys-green);stroke-width:2.5}.hys-lab .hys-node{stroke:var(--hys-gold);stroke-width:1.2;stroke-dasharray:4 4}.hys-lab .hys-small-label{font-size:10px;fill:var(--fg-soft,var(--muted,#6b6557))}.hys-lab .hys-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:13px}.hys-lab table{width:100%;min-width:660px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.hys-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft,var(--muted,#6b6557));font-size:12px}.hys-lab th,.hys-lab td{padding:7px 8px;border-bottom:1px solid var(--border,#d7d0c2);text-align:left;vertical-align:top}.hys-lab th{color:var(--fg-soft,var(--muted,#6b6557));font-size:11.5px}.hys-lab .hys-callout{margin-top:12px;padding:9px 11px;border-left:3px solid var(--hys-gold);background:var(--block-bg,var(--bg,#fff));color:var(--fg-soft,var(--muted,#6b6557));font-size:12.5px;line-height:1.65}",
    "@media(max-width:900px){.hys-lab .hys-presets{grid-template-columns:repeat(2,minmax(0,1fr))}.hys-lab .hys-controls{grid-template-columns:repeat(2,minmax(0,1fr))}.hys-lab .hys-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}",
    "@media(max-width:650px){.hys-lab .hys-charts{grid-template-columns:minmax(0,1fr)}.hys-lab .hys-choice-row{grid-template-columns:minmax(0,1fr)}}",
    "@media(max-width:420px){.hys-lab .hys-presets,.hys-lab .hys-controls,.hys-lab .hys-metrics{grid-template-columns:minmax(0,1fr)}.hys-lab .hys-predict{padding:9px}.hys-lab .hys-frame{padding:4px}.hys-lab table{font-size:11.5px}.hys-lab th,.hys-lab td{padding-left:5px;padding-right:5px}}",
    "@media(prefers-reduced-motion:reduce){.hys-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function integer(value) {
    return typeof value === "number" && Number.isFinite(value) && Math.floor(value) === value;
  }

  function factorial(value) {
    if (!integer(value) || value < 0) throw new Error("factorial requires a nonnegative integer");
    var result = 1;
    for (var i = 2; i <= value; i += 1) result *= i;
    return result;
  }

  function allowedL(n) {
    if (!integer(n) || n < 1) return [];
    var values = [];
    for (var l = 0; l < n; l += 1) values.push(l);
    return values;
  }

  function allowedM(l) {
    if (!integer(l) || l < 0) return [];
    var values = [];
    for (var m = -l; m <= l; m += 1) values.push(m);
    return values;
  }

  function isAllowedState(n, l, m) {
    return integer(n) && n >= 1 && integer(l) && l >= 0 && l < n && integer(m) && m >= -l && m <= l;
  }

  function energy(n) {
    if (!integer(n) || n < 1) throw new Error("hydrogen energy requires n >= 1");
    return -RYDBERG_EV / (n * n);
  }

  function shellDegeneracy(n, includeSpin) {
    if (!integer(n) || n < 1) throw new Error("shell degeneracy requires n >= 1");
    return n * n * (includeSpin ? 2 : 1);
  }

  function radialNodes(n, l) {
    if (!isAllowedState(n, l, 0)) throw new Error("radial nodes require an allowed n,l pair");
    return n - l - 1;
  }

  function generalizedLaguerre(order, alpha, x) {
    if (!integer(order) || order < 0) throw new Error("Laguerre order must be nonnegative");
    if (order === 0) return 1;
    var previous = 1;
    var current = alpha + 1 - x;
    if (order === 1) return current;
    for (var k = 1; k < order; k += 1) {
      var next = ((2 * k + 1 + alpha - x) * current - (k + alpha) * previous) / (k + 1);
      previous = current;
      current = next;
    }
    return current;
  }

  function radialWavefunction(n, l, radius) {
    if (!isAllowedState(n, l, 0) || typeof radius !== "number" || !Number.isFinite(radius) || radius < 0) {
      throw new Error("radial wavefunction requires an allowed state and r >= 0");
    }
    var rho = 2 * radius / n;
    var normalization = Math.pow(2 / n, 1.5) * Math.sqrt(factorial(n - l - 1) / (2 * n * factorial(n + l)));
    return normalization * Math.exp(-rho / 2) * Math.pow(rho, l) * generalizedLaguerre(n - l - 1, 2 * l + 1, rho);
  }

  function radialProbability(n, l, radius) {
    var radial = radialWavefunction(n, l, radius);
    return radius * radius * radial * radial;
  }

  function radialGrid(n, l, options) {
    var config = options || {};
    var maxRadius = config.maxRadius === undefined ? 8 * n * n : config.maxRadius;
    var steps = config.steps === undefined ? 360 : config.steps;
    var points = [];
    for (var i = 0; i <= steps; i += 1) {
      var radius = maxRadius * i / steps;
      points.push({ r: radius, wavefunction: radialWavefunction(n, l, radius), probability: radialProbability(n, l, radius) });
    }
    return points;
  }

  function integrate(points) {
    var total = 0;
    for (var i = 1; i < points.length; i += 1) {
      var width = points[i].r - points[i - 1].r;
      total += 0.5 * width * (points[i].probability + points[i - 1].probability);
    }
    return total;
  }

  function radialSummary(n, l, steps) {
    var points = radialGrid(n, l, { steps: steps === undefined ? 360 : steps });
    var peak = points[0];
    points.forEach(function (point) { if (point.probability > peak.probability) peak = point; });
    return {
      n: n,
      l: l,
      nodes: radialNodes(n, l),
      points: points,
      normalization: integrate(points),
      peakRadius: peak.r,
      peakProbability: peak.probability
    };
  }

  function stateCopy(state) {
    return { n: Number(state.n), l: Number(state.l), m: Number(state.m) };
  }

  function transitionLedger(fromInput, toInput) {
    var from = stateCopy(fromInput);
    var to = stateCopy(toInput);
    var validStates = isAllowedState(from.n, from.l, from.m) && isAllowedState(to.n, to.l, to.m);
    var deltaL = to.l - from.l;
    var deltaM = to.m - from.m;
    var downward = from.n > to.n;
    var allowed = validStates && downward && Math.abs(deltaL) === 1 && Math.abs(deltaM) <= 1;
    return {
      from: from,
      to: to,
      validStates: validStates,
      downward: downward,
      deltaL: deltaL,
      deltaM: deltaM,
      allowed: allowed,
      photonEnergy: allowed ? energy(from.n) - energy(to.n) : null,
      reason: !validStates ? "量子数不合法" : !downward ? "需要从较高 n 向较低 n 记账" : allowed ? "Δl=±1 且 Δm=0,±1" : "不满足 E1 选择定则"
    };
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function normalizeState(input) {
    var source = input || { n: 3, l: 2, m: 2 };
    var n = Math.round(Number(source.n));
    if (!Number.isFinite(n)) n = 3;
    n = clamp(n, 1, MAX_N);
    var l = Math.round(Number(source.l));
    if (!Number.isFinite(l)) l = 0;
    l = clamp(l, 0, n - 1);
    var m = Math.round(Number(source.m));
    if (!Number.isFinite(m)) m = 0;
    m = clamp(m, -l, l);
    return { n: n, l: l, m: m };
  }

  function orbitalLetter(l) {
    return ["s", "p", "d", "f", "g", "h"][l] || "l=" + l;
  }

  function stateLabel(state) {
    return state.n + orbitalLetter(state.l) + ", m=" + state.m;
  }

  function getTransition(id) {
    for (var i = 0; i < TRANSITIONS.length; i += 1) if (TRANSITIONS[i].id === id) return TRANSITIONS[i];
    return TRANSITIONS[0];
  }

  function analyze(input) {
    var source = input || {};
    var state = normalizeState(source);
    var transition = source.transition || getTransition(source.transitionId);
    var summary = radialSummary(state.n, state.l, source.steps === undefined ? 360 : source.steps);
    return {
      state: state,
      stateLabel: stateLabel(state),
      energy: energy(state.n),
      allowedL: allowedL(state.n),
      allowedM: allowedM(state.l),
      orbitalDegeneracy: 2 * state.l + 1,
      shellOrbitalDegeneracy: shellDegeneracy(state.n, false),
      shellSpinDegeneracy: shellDegeneracy(state.n, true),
      radial: summary,
      shells: Array.from({ length: MAX_N }, function (_, index) {
        var n = index + 1;
        return { n: n, energy: energy(n), orbitalDegeneracy: shellDegeneracy(n, false), spinDegeneracy: shellDegeneracy(n, true) };
      }),
      transition: transitionLedger(transition.from, transition.to)
    };
  }

  function near(first, second, tolerance) {
    return Math.abs(first - second) <= (tolerance || 1e-8) * Math.max(1, Math.abs(first), Math.abs(second));
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }
    function checkClose(actual, expected, message, tolerance) {
      check(near(actual, expected, tolerance), message + " (expected " + expected + ", got " + actual + ")");
    }
    check(allowedL(3).join(",") === "0,1,2", "n=3 allowed l");
    check(allowedM(2).join(",") === "-2,-1,0,1,2", "l=2 allowed m");
    check(isAllowedState(3, 2, 2), "valid 3d m=2 state");
    check(!isAllowedState(3, 3, 0), "l=n is invalid");
    check(!isAllowedState(2, 1, 2), "m outside range is invalid");
    checkClose(energy(2), -3.4, "n=2 energy");
    checkClose(energy(2), energy(2), "same n is degenerate");
    check(shellDegeneracy(3, false) === 9, "n=3 orbital degeneracy");
    check(shellDegeneracy(3, true) === 18, "n=3 spin-counted degeneracy");
    check(radialNodes(3, 1) === 1, "3p radial node count");
    checkClose(radialWavefunction(1, 0, 0), 2, "1s radial normalization at origin");
    checkClose(radialSummary(3, 2, 720).normalization, 1, "3d radial normalization", 2e-3);
    check(radialProbability(3, 2, 1) >= 0, "radial probability nonnegative");
    var allowed = transitionLedger({ n: 3, l: 2, m: 2 }, { n: 2, l: 1, m: 1 });
    check(allowed.allowed, "3d to 2p E1 selection");
    checkClose(allowed.photonEnergy, 1.8888888889, "3d to 2p photon energy", 1e-8);
    check(!transitionLedger({ n: 3, l: 2, m: 2 }, { n: 2, l: 1, m: 0 }).allowed, "delta m selection rule");
    check(!transitionLedger({ n: 2, l: 0, m: 0 }, { n: 1, l: 0, m: 0 }).allowed, "delta l selection rule");
    var result = analyze({ n: 3, l: 2, m: 2, transitionId: "3d-2p-allowed", steps: 240 });
    check(result.allowedL.length === 3 && result.allowedM.length === 5, "analyze state ranges");
    check(result.transition.allowed, "analyze transition");
    check(result.shellOrbitalDegeneracy === 9 && result.shellSpinDegeneracy === 18, "analyze degeneracy ledger");
    return { checks: checks, states: STATE_PRESETS.length };
  }

  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "text") node.textContent = String(value);
      else if (key === "className") node.className = String(value);
      else if (key === "htmlFor") node.htmlFor = String(value);
      else node.setAttribute(key, value === true ? "" : String(value));
    });
    var list = children === undefined || children === null ? [] : (Array.isArray(children) ? children : [children]);
    list.forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function svgNode(doc, tag, attrs, children) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      node.setAttribute(key, value === true ? "" : String(value));
    });
    var list = children === undefined || children === null ? [] : (Array.isArray(children) ? children : [children]);
    list.forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function format(value, digits) {
    var places = digits === undefined ? 3 : digits;
    if (!Number.isFinite(value)) return "-";
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function metric(doc, label, value) {
    var box = element(doc, "div", { className: "hys-metric" });
    box.appendChild(element(doc, "span", { text: label }));
    box.appendChild(element(doc, "strong", { text: value }));
    return box;
  }

  function energyChart(doc, result) {
    var svg = svgNode(doc, "svg", { viewBox: "0 0 640 285", role: "img", "aria-label": "氢原子 n 能级与简并账本" });
    svg.appendChild(svgNode(doc, "title", {}, "非相对论 Coulomb 氢原子能级"));
    var left = 86, right = 330, bottom = 245, top = 34, baseEnergy = energy(1);
    function mapY(value) { return bottom - (value - baseEnergy) / (0 - baseEnergy) * (bottom - top); }
    [baseEnergy, -RYDBERG_EV / 4, -RYDBERG_EV / 9, -RYDBERG_EV / 16, -RYDBERG_EV / 25].forEach(function (value) {
      var y = mapY(value);
      svg.appendChild(svgNode(doc, "line", { x1: 56, y1: y, x2: right + 35, y2: y, class: "hys-axis" }));
      svg.appendChild(svgNode(doc, "text", { x: 50, y: y + 4, "text-anchor": "end", class: "hys-small-label" }, format(value, 2) + " eV"));
    });
    result.shells.forEach(function (shell) {
      var y = mapY(shell.energy);
      svg.appendChild(svgNode(doc, "line", { x1: left, y1: y, x2: right, y2: y, class: shell.n === result.state.n ? "hys-level hys-level-selected" : "hys-level" }));
      svg.appendChild(svgNode(doc, "text", { x: right + 45, y: y + 4, class: "hys-small-label" }, "n=" + shell.n + " · " + shell.orbitalDegeneracy + " / " + shell.spinDegeneracy));
    });
    svg.appendChild(svgNode(doc, "text", { x: left, y: 18, class: "hys-small-label" }, "轨道简并 / 计自旋简并"));
    return svg;
  }

  function radialChart(doc, result) {
    var svg = svgNode(doc, "svg", { viewBox: "0 0 640 285", role: "img", "aria-label": "氢原子径向概率分布" });
    svg.appendChild(svgNode(doc, "title", {}, result.stateLabel + " 的径向概率 r²|R|²"));
    var points = result.radial.points, left = 52, right = 605, bottom = 240, top = 35;
    var maxProbability = 0;
    points.forEach(function (point) { maxProbability = Math.max(maxProbability, point.probability); });
    maxProbability = Math.max(maxProbability, 1e-12);
    svg.appendChild(svgNode(doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, class: "hys-axis" }));
    svg.appendChild(svgNode(doc, "line", { x1: left, y1: top, x2: left, y2: bottom, class: "hys-axis" }));
    var polyline = points.filter(function (_, index) { return index % 3 === 0 || index === points.length - 1; }).map(function (point) {
      var x = left + (point.r / points[points.length - 1].r) * (right - left);
      var y = bottom - (point.probability / maxProbability) * (bottom - top);
      return x.toFixed(2) + "," + y.toFixed(2);
    }).join(" ");
    svg.appendChild(svgNode(doc, "polyline", { points: polyline, class: "hys-curve" }));
    svg.appendChild(svgNode(doc, "text", { x: left, y: 20, class: "hys-small-label" }, "P(r)=r²|R|²；节点数=" + result.radial.nodes));
    svg.appendChild(svgNode(doc, "text", { x: right, y: bottom + 25, "text-anchor": "end", class: "hys-small-label" }, "r / a₀"));
    svg.appendChild(svgNode(doc, "text", { x: left - 5, y: top - 8, "text-anchor": "end", class: "hys-small-label" }, "概率"));
    return svg;
  }

  function table(doc, caption, headers, rows) {
    var wrap = element(doc, "div", { className: "hys-table-wrap" });
    var node = element(doc, "table", {}); node.appendChild(element(doc, "caption", { text: caption }));
    var head = element(doc, "thead", {}), headRow = element(doc, "tr", {});
    headers.forEach(function (header) { headRow.appendChild(element(doc, "th", { scope: "col", text: header })); });
    head.appendChild(headRow); node.appendChild(head);
    var body = element(doc, "tbody", {});
    rows.forEach(function (row) { var tr = element(doc, "tr", {}); row.forEach(function (cell) { tr.appendChild(element(doc, "td", { text: cell })); }); body.appendChild(tr); });
    node.appendChild(body); wrap.appendChild(node); return wrap;
  }

  function mount(root, api) {
    if (!root || typeof document === "undefined") return;
    var doc = root.ownerDocument || document;
    if (!doc.getElementById("hydrogen-spectrum-styles")) {
      var style = element(doc, "style", { id: "hydrogen-spectrum-styles", text: STYLE_TEXT });
      (doc.head || doc.documentElement).appendChild(style);
    }
    INSTANCE += 1;
    var uid = "hys-" + INSTANCE;
    var state = { presetId: "3d", n: 3, l: 2, m: 2, transitionId: "3d-2p-allowed", predictions: {}, revealed: false };
    var shell = element(doc, "div", { className: "hys-shell" });
    shell.appendChild(element(doc, "p", { className: "hys-note", text: "先锁定量子数和候选跃迁；揭示后分别检查允许范围、Coulomb 能量/简并、径向节点与 E1 选择定则。" }));
    var presets = element(doc, "div", { className: "hys-presets", role: "group", "aria-label": "氢原子态预设" });
    var presetButtons = [];
    STATE_PRESETS.forEach(function (preset) {
      var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: preset.label });
      button.addEventListener("click", function () { state.presetId = preset.id; state.n = preset.n; state.l = preset.l; state.m = preset.m; state.transitionId = preset.transitionId; state.predictions = {}; state.revealed = false; render(); });
      presetButtons.push({ id: preset.id, node: button }); presets.appendChild(button);
    });
    shell.appendChild(presets);
    var controls = element(doc, "div", { className: "hys-controls", "aria-label": "氢原子量子数和跃迁控制" });
    function rangeControl(key, labelText, min, max, step, digits) {
      var input = element(doc, "input", { id: uid + "-" + key, type: "range", min: min, max: max, step: step, value: state[key], "aria-label": labelText });
      var output = element(doc, "output", { for: uid + "-" + key, text: "" });
      var label = element(doc, "label", { htmlFor: uid + "-" + key }, [labelText + " = ", output]);
      var box = element(doc, "div", { className: "hys-control" }); box.appendChild(label); box.appendChild(input);
      input.addEventListener("input", function () { state[key] = Number(input.value); if (key === "n") { state.l = clamp(state.l, 0, state.n - 1); state.m = clamp(state.m, -state.l, state.l); } if (key === "l") state.m = clamp(state.m, -state.l, state.l); state.presetId = ""; state.revealed = false; render(); });
      return { box: box, input: input, output: output, digits: digits };
    }
    var nControl = rangeControl("n", "主量子数 n", 1, MAX_N, 1, 0);
    var lControl = rangeControl("l", "轨道量子数 l", 0, 2, 1, 0);
    var mControl = rangeControl("m", "磁量子数 m", -2, 2, 1, 0);
    controls.appendChild(nControl.box); controls.appendChild(lControl.box); controls.appendChild(mControl.box);
    var transitionSelect = element(doc, "select", { id: uid + "-transition", "aria-label": "候选电偶极跃迁" });
    TRANSITIONS.forEach(function (transition) { transitionSelect.appendChild(element(doc, "option", { value: transition.id, text: transition.label })); });
    var transitionControl = element(doc, "div", { className: "hys-control" }); transitionControl.appendChild(element(doc, "label", { htmlFor: uid + "-transition", text: "候选 E1 跃迁" })); transitionControl.appendChild(transitionSelect); controls.appendChild(transitionControl); shell.appendChild(controls);

    var questions = [
      { id: "m-count", label: "给定 l 后，m 有多少个允许值？", choices: [["two-l-plus-one", "2l+1 个"], ["l-plus-one", "l+1 个"]] },
      { id: "energy", label: "理想 Coulomb 模型中能量主要依赖什么？", choices: [["n", "只依赖 n"], ["lm", "依赖 l 和 m"]] },
      { id: "selection", label: "E1 选择定则是否决定候选跃迁允许？", choices: [["rules", "看 Δl=±1、Δm=0,±1"], ["always", "所有向下跃迁都允许"]] }
    ];
    var prediction = element(doc, "section", { className: "hys-predict", "aria-labelledby": uid + "-predict-title" }); prediction.appendChild(element(doc, "h4", { id: uid + "-predict-title", text: "先预测三件事，再揭示谱账" }));
    var questionButtons = {};
    questions.forEach(function (question) {
      var fieldset = element(doc, "fieldset", { className: "hys-question" }); fieldset.appendChild(element(doc, "legend", { text: question.label }));
      var choices = element(doc, "div", { className: "hys-choice-row" }); questionButtons[question.id] = [];
      question.choices.forEach(function (choice) { var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: choice[1] }); button.addEventListener("click", function () { state.predictions[question.id] = choice[0]; state.revealed = false; renderPrediction(); renderStatus(); }); questionButtons[question.id].push({ value: choice[0], node: button }); choices.appendChild(button); });
      fieldset.appendChild(choices); prediction.appendChild(fieldset);
    });
    var actions = element(doc, "div", { className: "hys-actions" }); var reveal = element(doc, "button", { type: "button", className: "hys-primary", text: "揭示并核对" }); var reset = element(doc, "button", { type: "button", text: "重置预测" }); actions.appendChild(reveal); actions.appendChild(reset); prediction.appendChild(actions);
    var feedback = element(doc, "p", { className: "hys-feedback", "aria-live": "polite", text: "每题先作一个预测。" }); prediction.appendChild(feedback); shell.appendChild(prediction);

    var results = element(doc, "section", { className: "hys-results", hidden: true, "aria-labelledby": uid + "-results-title" }); results.appendChild(element(doc, "h4", { id: uid + "-results-title", text: "氢原子三本谱账" })); var metrics = element(doc, "div", { className: "hys-metrics" }); results.appendChild(metrics);
    var charts = element(doc, "div", { className: "hys-charts" }); var energyHost = element(doc, "div", { className: "hys-chart" }); var radialHost = element(doc, "div", { className: "hys-chart" }); charts.appendChild(energyHost); charts.appendChild(radialHost); results.appendChild(charts);
    var stateHost = element(doc, "div", {}); var transitionHost = element(doc, "div", {}); results.appendChild(stateHost); results.appendChild(transitionHost); results.appendChild(element(doc, "p", { className: "hys-callout", text: "边界：这是非相对论、球对称、单电子 Coulomb 参考模型。n²/2n² 的简并忽略精细结构、Lamb shift、超精细结构和外场；E1 规则也不覆盖磁偶极、电四极、多电子组态混合等过程。" }));
    shell.appendChild(results); root.classList.add("hys-lab"); clear(root); root.appendChild(shell);

    function renderPrediction() { questions.forEach(function (question) { questionButtons[question.id].forEach(function (item) { item.node.setAttribute("aria-pressed", state.predictions[question.id] === item.value ? "true" : "false"); }); }); }
    function renderStatus() { var count = Object.keys(state.predictions).length; feedback.className = "hys-feedback"; if (!state.revealed) feedback.textContent = count === 3 ? "三项预测已记录，点击“揭示并核对”。" : "已记录 " + count + "/3 项预测。"; }
    function renderControls() {
      var current = normalizeState(state); state.n = current.n; state.l = current.l; state.m = current.m;
      nControl.input.value = String(state.n); nControl.output.textContent = format(state.n, nControl.digits);
      lControl.input.max = String(state.n - 1); lControl.input.value = String(state.l); lControl.output.textContent = format(state.l, lControl.digits);
      mControl.input.min = String(-state.l); mControl.input.max = String(state.l); mControl.input.value = String(state.m); mControl.output.textContent = format(state.m, mControl.digits);
      transitionSelect.value = state.transitionId;
      presetButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", item.id === state.presetId ? "true" : "false"); });
    }
    function render() { renderControls(); renderPrediction(); renderStatus(); if (!state.revealed) { results.hidden = true; return; } var result = analyze({ n: state.n, l: state.l, m: state.m, transitionId: state.transitionId }); var expected = { "m-count": "two-l-plus-one", energy: "n", selection: "rules" }; var correct = questions.every(function (question) { return state.predictions[question.id] === expected[question.id]; }); feedback.className = "hys-feedback " + (correct ? "hys-pass" : "hys-warn"); feedback.textContent = (correct ? "三项预测都命中。" : "预测已揭示，请按量子数和选择定则复盘。") + " 当前态为 " + result.stateLabel + "。"; if (api && typeof api.announce === "function") api.announce(root, feedback.textContent); results.hidden = false;
      metrics.replaceChildren(metric(doc, "状态", result.stateLabel), metric(doc, "E_n", format(result.energy, 4) + " eV"), metric(doc, "允许 l", result.allowedL.join(", ")), metric(doc, "允许 m", result.allowedM.join(", ")), metric(doc, "本 l 轨道简并", String(result.orbitalDegeneracy)), metric(doc, "n² / 2n²", result.shellOrbitalDegeneracy + " / " + result.shellSpinDegeneracy), metric(doc, "径向节点", String(result.radial.nodes)), metric(doc, "峰值半径", format(result.radial.peakRadius, 2) + " a₀"));
      clear(energyHost); energyHost.appendChild(element(doc, "h4", { text: "能级与简并" })); energyHost.appendChild(element(doc, "div", { className: "hys-frame" }, energyChart(doc, result))); clear(radialHost); radialHost.appendChild(element(doc, "h4", { text: "径向概率分布" })); radialHost.appendChild(element(doc, "div", { className: "hys-frame" }, radialChart(doc, result)));
      clear(stateHost); stateHost.appendChild(table(doc, "量子数、能量和径向账本", ["项目", "结果"], [["n 的允许范围", "1,2,…"], ["l 的允许范围", result.allowedL.join(", ")], ["m 的允许范围", result.allowedM.join(", ")], ["E_n", format(result.energy, 6) + " eV"], ["有限窗口归一化（r≤8n²a₀）", format(result.radial.normalization, 5)], ["径向节点理论值", String(result.radial.nodes)]]));
      clear(transitionHost); var transition = result.transition; transitionHost.appendChild(table(doc, "E1 候选跃迁账本", ["项目", "结果"], [["from → to", stateLabel(transition.from) + " → " + stateLabel(transition.to)], ["Δl / Δm", transition.deltaL + " / " + transition.deltaM], ["状态合法", transition.validStates ? "是" : "否"], ["能量方向", transition.downward ? "向下" : "不是向下"], ["E1 结论", transition.allowed ? "允许" : "禁戒"], ["原因", transition.reason], ["光子能量", transition.photonEnergy === null ? "无 E1 读数" : format(transition.photonEnergy, 6) + " eV"]]));
    }
    transitionSelect.addEventListener("change", function () { state.transitionId = transitionSelect.value; state.presetId = ""; state.revealed = false; render(); });
    reveal.addEventListener("click", function () { if (Object.keys(state.predictions).length !== questions.length) { feedback.className = "hys-feedback hys-warn"; feedback.textContent = "请先完成三项预测，再揭示谱账。"; return; } state.revealed = true; render(); });
    reset.addEventListener("click", function () { state.predictions = {}; state.revealed = false; render(); });
    render();
  }

  return {
    RYDBERG_EV: RYDBERG_EV,
    MAX_N: MAX_N,
    TRANSITIONS: TRANSITIONS,
    STATE_PRESETS: STATE_PRESETS,
    factorial: factorial,
    allowedL: allowedL,
    allowedM: allowedM,
    isAllowedState: isAllowedState,
    energy: energy,
    shellDegeneracy: shellDegeneracy,
    generalizedLaguerre: generalizedLaguerre,
    radialNodes: radialNodes,
    radialWavefunction: radialWavefunction,
    radialProbability: radialProbability,
    radialGrid: radialGrid,
    radialSummary: radialSummary,
    transitionLedger: transitionLedger,
    analyze: analyze,
    mount: mount,
    selfTest: selfTest
  };
});
