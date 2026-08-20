(function (root, factory) {
  "use strict";

  var exported = factory();
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("distribution-map", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("distribution-map self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("distribution-map self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "distribution-map-lab-styles";
  var INSTANCE = 0;
  var EPS = 1e-10;

  // Every preset is analytic. The seed is a provenance label, not a random source.
  var PRESETS = [
    {
      id: "discrete",
      label: "离散 · 三点分布",
      kind: "discrete",
      seed: 20260722,
      domain: [0, 2],
      chartDomain: [-0.25, 2.25],
      interval: [0.25, 1.5],
      probe: 1,
      atoms: [
        { x: 0, p: 0.2 },
        { x: 1, p: 0.5 },
        { x: 2, p: 0.3 }
      ],
      continuous: null,
      note: "用点质量和 PMF 记账；CDF 在每个原子处跳跃。"
    },
    {
      id: "uniform",
      label: "绝对连续 · U(0,1)",
      kind: "continuous",
      seed: 31415926,
      domain: [0, 1],
      chartDomain: [0, 1],
      interval: [0.2, 0.7],
      probe: 0.5,
      atoms: [],
      continuous: { type: "uniform", lower: 0, upper: 1, weight: 1 },
      note: "点概率为 0；区间概率由密度曲线下的面积给出。"
    },
    {
      id: "mixture",
      label: "混合 · 原子 + 密度",
      kind: "mixed",
      seed: 27182818,
      domain: [0, 1],
      chartDomain: [0, 1],
      interval: [0.2, 0.5],
      probe: 0.4,
      atoms: [{ x: 0.4, p: 0.3 }],
      continuous: { type: "uniform", lower: 0, upper: 1, weight: 0.7 },
      note: "X=0.4 有 0.3 的原子质量；连续部分的密度是 0.7，但它不是全分布的普通 PDF。"
    },
    {
      id: "square",
      label: "变换 · Y = X^2",
      kind: "continuous",
      transform: "square-uniform",
      seed: 1103515245,
      domain: [0, 1],
      chartDomain: [0, 1],
      interval: [0.25, 0.64],
      probe: 0.25,
      atoms: [],
      continuous: { type: "square-uniform", lower: 0, upper: 1, weight: 1 },
      note: "X~U(-1,1)，Y=X^2；对 y>0 要把 x=+sqrt(y) 和 x=-sqrt(y) 两个原像的贡献相加。"
    }
  ];

  var MIXTURE = PRESETS[2];
  var NONMONOTONE_CASE = PRESETS[3];

  var STYLE_TEXT = [
    ".dm-lab{--dm-blue:var(--accent,#2f668f);--dm-gold:var(--cl-gold,#a36b17);--dm-green:var(--cl-green,#34724a);--dm-red:var(--cl-red,#b74436);--dm-muted:var(--fg-soft,#706b62);color:var(--fg);line-height:1.55;min-width:0;}",
    ".dm-lab *,.dm-lab *::before,.dm-lab *::after{box-sizing:border-box;}",
    ".dm-lab [hidden]{display:none!important;}",
    ".dm-lab h3,.dm-lab h4{margin:0;color:var(--fg);letter-spacing:0;}",
    ".dm-lab h3{font-size:1.16rem;}.dm-lab h4{font-size:1rem;}",
    ".dm-lab button,.dm-lab input,.dm-lab select{font:inherit;}",
    ".dm-lab button,.dm-lab select{min-height:44px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);}",
    ".dm-lab button{padding:8px 10px;cursor:pointer;line-height:1.35;overflow-wrap:anywhere;}",
    ".dm-lab button:hover{border-color:var(--accent);}.dm-lab button:disabled{cursor:not-allowed;opacity:.55;}",
    ".dm-lab button:focus-visible,.dm-lab input:focus-visible,.dm-lab select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}",
    ".dm-lab button[aria-pressed=true],.dm-lab .dm-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750;}",
    ".dm-lab .dm-intro,.dm-lab .dm-note,.dm-lab .dm-feedback,.dm-lab .dm-chart-note{color:var(--dm-muted);font-size:13px;overflow-wrap:anywhere;}",
    ".dm-lab .dm-prediction{margin:14px 0;padding:12px 14px;border-left:3px solid var(--dm-gold);background:var(--block-bg,var(--bg));}",
    ".dm-lab .dm-prediction>strong{display:block;margin-bottom:10px;font-size:13px;}",
    ".dm-lab fieldset{min-width:0;margin:0;padding:0;border:0;}.dm-lab legend{max-width:100%;padding:0;font-weight:750;line-height:1.45;overflow-wrap:anywhere;}",
    ".dm-lab .dm-question-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}",
    ".dm-lab .dm-question{min-width:0;padding:9px;border:1px solid var(--border);border-radius:6px;}",
    ".dm-lab .dm-choice-list{display:grid;gap:6px;margin-top:8px;}.dm-lab .dm-choice-list button{width:100%;min-height:44px;text-align:left;font-size:12.5px;}",
    ".dm-lab .dm-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px;}.dm-lab .dm-actions>*{flex:1 1 155px;}",
    ".dm-lab .dm-feedback{min-height:1.8em;margin:9px 0 0;font-weight:700;}.dm-lab .dm-pass{color:var(--dm-green);}.dm-lab .dm-warn{color:var(--dm-red);}",
    ".dm-lab .dm-revealed{margin-top:16px;padding-top:16px;border-top:1px solid var(--border);}",
    ".dm-lab .dm-layout{display:grid;grid-template-columns:minmax(205px,.46fr) minmax(0,1.54fr);gap:14px;align-items:start;min-width:0;}",
    ".dm-lab .dm-controls,.dm-lab .dm-stage{min-width:0;}",
    ".dm-lab .dm-controls{display:grid;gap:11px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg);}",
    ".dm-lab .dm-controls h4{font-size:14px;}.dm-lab .dm-preset-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;}",
    ".dm-lab .dm-preset-grid button{font-size:12px;}.dm-lab .dm-control{display:grid;gap:5px;min-width:0;}",
    ".dm-lab .dm-control label{color:var(--dm-muted);font-size:12.5px;font-weight:700;}.dm-lab .dm-control output{color:var(--dm-blue);font-variant-numeric:tabular-nums;}",
    ".dm-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent);}",
    ".dm-lab .dm-scale{display:flex;justify-content:space-between;color:var(--dm-muted);font-size:11px;}",
    ".dm-lab .dm-formula{margin:0 0 10px;color:var(--dm-muted);font-size:12.5px;line-height:1.7;overflow-wrap:anywhere;}",
    ".dm-lab .dm-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:0 0 13px;}",
    ".dm-lab .dm-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}.dm-lab .dm-metric:nth-child(1){border-color:var(--dm-blue);}.dm-lab .dm-metric:nth-child(2){border-color:var(--dm-gold);}.dm-lab .dm-metric:nth-child(3){border-color:var(--dm-green);}.dm-lab .dm-metric:nth-child(4){border-color:var(--dm-red);}",
    ".dm-lab .dm-metric span{display:block;color:var(--dm-muted);font-size:11px;line-height:1.4;}.dm-lab .dm-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}",
    ".dm-lab .dm-chart-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;}",
    ".dm-lab .dm-chart{min-width:0;}.dm-lab .dm-chart h4{margin-bottom:3px;font-size:13.5px;}.dm-lab .dm-chart-note{min-height:2.9em;margin:0 0 6px;font-size:12px;line-height:1.5;}",
    ".dm-lab .dm-chart-frame{min-width:0;padding:7px;border:1px solid var(--border);border-radius:6px;background:var(--bg);}",
    ".dm-lab .dm-chart-svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg);}.dm-lab .dm-chart-svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}",
    ".dm-lab .dm-grid-line{stroke:currentColor;stroke-width:1;stroke-opacity:.14;}.dm-lab .dm-axis{stroke:currentColor;stroke-width:1.2;stroke-opacity:.62;}.dm-lab .dm-main-line{fill:none;stroke:var(--dm-blue);stroke-width:2.7;stroke-linecap:round;stroke-linejoin:round;}.dm-lab .dm-area{fill:var(--dm-gold);fill-opacity:.28;stroke:none;}.dm-lab .dm-atom-line{stroke:var(--dm-red);stroke-width:2.4;stroke-dasharray:6 4;}.dm-lab .dm-atom-bar{fill:var(--dm-red);fill-opacity:.72;}.dm-lab .dm-quantile-point{fill:var(--dm-green);stroke:var(--bg);stroke-width:1.4;}.dm-lab .dm-chart-label{font-size:11px;fill:var(--dm-muted)!important;}.dm-lab .dm-chart-title{font-size:13px;font-weight:750;}.dm-lab .dm-small-label{font-size:10.5px;fill:var(--dm-muted)!important;}",
    ".dm-lab .dm-interpretation{margin:12px 0 0;padding:10px 12px;border-left:3px solid var(--dm-green);background:var(--block-bg,var(--bg));font-size:13px;line-height:1.7;overflow-wrap:anywhere;}",
    ".dm-lab .dm-ledger{max-width:100%;margin-top:13px;overflow-x:auto;-webkit-overflow-scrolling:touch;}.dm-lab table{width:100%;min-width:680px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}.dm-lab th,.dm-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;}.dm-lab th{color:var(--dm-muted);font-size:11.5px;}.dm-lab .dm-caution{margin:10px 0 0;color:var(--dm-muted);font-size:12px;line-height:1.65;}",
    "@media(max-width:900px){.dm-lab .dm-layout{grid-template-columns:minmax(0,1fr);}.dm-lab .dm-controls{grid-template-columns:repeat(2,minmax(0,1fr));}.dm-lab .dm-controls h4,.dm-lab .dm-controls .dm-note,.dm-lab .dm-controls .dm-preset-grid,.dm-lab .dm-controls .dm-control:last-child{grid-column:1/-1;}}",
    "@media(max-width:700px){.dm-lab .dm-question-grid,.dm-lab .dm-chart-grid{grid-template-columns:minmax(0,1fr);}.dm-lab .dm-metrics{grid-template-columns:repeat(2,minmax(0,1fr));}.dm-lab .dm-controls{grid-template-columns:minmax(0,1fr);}.dm-lab .dm-controls>*{grid-column:auto!important;}.dm-lab .dm-preset-grid{grid-template-columns:minmax(0,1fr);}}",
    "@media(max-width:430px){.dm-lab .dm-prediction{padding:10px;}.dm-lab .dm-chart-frame{padding:4px;}.dm-lab table{font-size:11.5px;}.dm-lab th,.dm-lab td{padding-left:5px;padding-right:5px;}}",
    "@media(prefers-reduced-motion:reduce){.dm-lab *{animation:none!important;transition:none!important;}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function integer(value, fallback, min, max) {
    var result = Math.round(finite(Number(value)) ? Number(value) : fallback);
    return clamp(result, min, max);
  }

  function near(left, right, tolerance) {
    var scale = Math.max(1, Math.abs(left), Math.abs(right));
    return Math.abs(left - right) <= (tolerance || EPS) * scale;
  }

  function copyPreset(preset) {
    return {
      id: preset.id,
      label: preset.label,
      kind: preset.kind,
      transform: preset.transform || null,
      seed: preset.seed,
      domain: preset.domain.slice(),
      chartDomain: preset.chartDomain.slice(),
      interval: preset.interval.slice(),
      probe: preset.probe,
      atoms: (preset.atoms || []).map(function (atom) { return { x: atom.x, p: atom.p }; }),
      continuous: preset.continuous ? {
        type: preset.continuous.type,
        lower: preset.continuous.lower,
        upper: preset.continuous.upper,
        weight: preset.continuous.weight
      } : null,
      note: preset.note
    };
  }

  function modelById(id) {
    var wanted = id || "mixture";
    var found = PRESETS.filter(function (preset) { return preset.id === wanted; })[0];
    return found || PRESETS[2];
  }

  function resolveModel(input) {
    if (typeof input === "string") return modelById(input);
    if (input && input.id) return modelById(input.id);
    return PRESETS[2];
  }

  function sortedAtoms(model) {
    return (model.atoms || []).slice().sort(function (left, right) { return left.x - right.x; });
  }

  function uniformCDF(x, lower, upper) {
    if (x <= lower) return 0;
    if (x >= upper) return 1;
    return (x - lower) / (upper - lower);
  }

  function squareCDF(y) {
    if (y <= 0) return 0;
    if (y >= 1) return 1;
    return Math.sqrt(y);
  }

  function continuousCDF(input, x) {
    var model = resolveModel(input);
    var component = model.continuous;
    if (!component) return 0;
    if (component.type === "uniform") return component.weight * uniformCDF(x, component.lower, component.upper);
    if (component.type === "square-uniform") return component.weight * squareCDF(x);
    return 0;
  }

  function atomMass(input, x) {
    var model = resolveModel(input);
    if (!finite(Number(x))) return 0;
    return sortedAtoms(model).reduce(function (sum, atom) {
      return sum + (near(atom.x, Number(x)) ? atom.p : 0);
    }, 0);
  }

  function pointProbability(input, x) {
    return atomMass(input, x);
  }

  function pmf(input, x) {
    return pointProbability(input, x);
  }

  function cdf(input, x) {
    var model = resolveModel(input);
    var value = continuousCDF(model, x);
    sortedAtoms(model).forEach(function (atom) {
      if (atom.x <= x + EPS) value += atom.p;
    });
    return clamp(value, 0, 1);
  }

  function continuousDensity(input, x) {
    var model = resolveModel(input);
    var component = model.continuous;
    if (!component || !finite(Number(x))) return null;
    x = Number(x);
    if (component.type === "uniform") {
      return x >= component.lower && x <= component.upper
        ? component.weight / (component.upper - component.lower)
        : 0;
    }
    if (component.type === "square-uniform") {
      if (x < 0 || x > 1) return 0;
      if (x === 0) return Infinity;
      return component.weight / (2 * Math.sqrt(x));
    }
    return null;
  }

  // A mixed law does not have one ordinary Lebesgue PDF. Return null there.
  function density(input, x) {
    var model = resolveModel(input);
    if (!model.continuous || sortedAtoms(model).length) return null;
    return continuousDensity(model, x);
  }

  function densityInfo(input) {
    var model = resolveModel(input);
    var hasAtoms = sortedAtoms(model).length > 0;
    return {
      ordinaryDensityAvailable: Boolean(model.continuous && !hasAtoms),
      hasContinuousComponent: Boolean(model.continuous),
      hasAtoms: hasAtoms,
      note: hasAtoms
        ? "continuous density is only the absolutely continuous component; atom masses are separate"
        : (model.continuous ? "ordinary density represents the whole law" : "use point masses / PMF")
    };
  }

  function intervalProbability(input, left, right) {
    var model = resolveModel(input);
    var a = Number(left);
    var b = Number(right);
    if (!finite(a) || !finite(b)) return NaN;
    if (b < a) { var swap = a; a = b; b = swap; }
    if (near(a, b)) return 0;
    return clamp(cdf(model, b) - cdf(model, a), 0, 1);
  }

  function continuousIntervalArea(input, left, right) {
    var model = resolveModel(input);
    var component = model.continuous;
    var a = Number(left);
    var b = Number(right);
    if (!component || !finite(a) || !finite(b)) return 0;
    if (b < a) { var swap = a; a = b; b = swap; }
    if (component.type === "uniform") {
      var lo = Math.max(a, component.lower);
      var hi = Math.min(b, component.upper);
      return hi <= lo ? 0 : component.weight * (hi - lo) / (component.upper - component.lower);
    }
    if (component.type === "square-uniform") {
      var low = Math.max(0, a);
      var high = Math.min(1, b);
      return high <= low ? 0 : component.weight * (Math.sqrt(high) - Math.sqrt(low));
    }
    return 0;
  }

  function generalizedInverse(input, probability) {
    var model = resolveModel(input);
    var p = clamp(Number(probability), 0, 1);
    var atoms = sortedAtoms(model);
    var component = model.continuous;
    if (model.id === "discrete") {
      var cumulative = 0;
      for (var i = 0; i < atoms.length; i += 1) {
        cumulative += atoms[i].p;
        if (p <= cumulative + EPS) return atoms[i].x;
      }
      return atoms.length ? atoms[atoms.length - 1].x : model.domain[1];
    }
    if (model.id === "uniform") {
      return component.lower + p * (component.upper - component.lower);
    }
    if (model.id === "mixture") {
      var atom = atoms[0];
      var atomBefore = continuousCDF(model, atom.x);
      if (p <= atomBefore + EPS) return component.lower + (p / component.weight) * (component.upper - component.lower);
      if (p <= atomBefore + atom.p + EPS) return atom.x;
      return component.lower + ((p - atom.p) / component.weight) * (component.upper - component.lower);
    }
    if (model.id === "square") return p * p;
    if (component && component.type === "uniform") return component.lower + p * (component.upper - component.lower);
    return model.domain[0];
  }

  function quantile(input, probability) {
    return generalizedInverse(input, probability);
  }

  function quantileGrid(input, count) {
    var model = resolveModel(input);
    var n = integer(count, 12, 2, 64);
    var probabilities = [];
    var values = [];
    for (var i = 0; i < n; i += 1) {
      var p = (i + 0.5) / n;
      probabilities.push(p);
      values.push(generalizedInverse(model, p));
    }
    return {
      modelId: model.id,
      count: n,
      rule: "midpoint quantile grid",
      deterministic: true,
      iid: false,
      weight: 1 / n,
      probabilities: probabilities,
      values: values
    };
  }

  function quantileIntegral(input, fn, count) {
    if (typeof fn !== "function") throw new TypeError("quantileIntegral requires a function");
    var grid = quantileGrid(input, count);
    var total = grid.values.reduce(function (sum, value) { return sum + fn(value); }, 0);
    return { value: total / grid.count, grid: grid, deterministic: true };
  }

  function squarePreimages(y) {
    var value = Number(y);
    if (!finite(value) || value < 0 || value > 1) return [];
    if (value === 0) return [0];
    var root = Math.sqrt(value);
    return [-root, root];
  }

  function squareTransform(y) {
    var value = Number(y);
    var roots = squarePreimages(value);
    if (!roots.length) return { y: value, support: false, preimages: [], density: 0, cdf: value < 0 ? 0 : 1 };
    if (value === 0) {
      return {
        y: value,
        support: true,
        monotone: false,
        preimages: roots,
        contributionDensities: [Infinity],
        density: Infinity,
        cdf: 0,
        pointProbability: 0,
        note: "the derivative vanishes at y=0; the integrable density is singular there"
      };
    }
    var contribution = 1 / (4 * Math.sqrt(value));
    return {
      y: value,
      support: true,
      monotone: false,
      preimages: roots,
      contributionDensities: [contribution, contribution],
      density: contribution * roots.length,
      cdf: Math.sqrt(value),
      pointProbability: 0,
      note: "sum both inverse branches x=+sqrt(y) and x=-sqrt(y)"
    };
  }

  function linspace(left, right, count) {
    var result = [];
    var n = Math.max(2, Math.floor(count || 2));
    for (var i = 0; i < n; i += 1) result.push(left + (right - left) * i / (n - 1));
    return result;
  }

  function normalizeInput(input) {
    var source = typeof input === "string" ? { modelId: input } : (input || {});
    var model = modelById(source.modelId || source.id || "mixture");
    var lower = finite(Number(source.a)) ? Number(source.a) : model.interval[0];
    var upper = finite(Number(source.b)) ? Number(source.b) : model.interval[1];
    lower = clamp(lower, model.domain[0], model.domain[1]);
    upper = clamp(upper, model.domain[0], model.domain[1]);
    if (upper < lower) { var swap = lower; lower = upper; upper = swap; }
    return {
      modelId: model.id,
      a: lower,
      b: upper,
      gridSize: integer(source.gridSize, 12, 2, 64),
      seed: model.seed
    };
  }

  function fourRepresentations(input) {
    var params = normalizeInput(input);
    var model = modelById(params.modelId);
    var chartDomain = model.chartDomain;
    var xValues = linspace(chartDomain[0], chartDomain[1], 81);
    var cdfCurve = xValues.map(function (x) { return { x: x, y: cdf(model, x) }; });
    var densityCurve = model.continuous ? xValues.map(function (x) {
      return { x: x, y: continuousDensity(model, x) };
    }) : [];
    var grid = quantileGrid(model, params.gridSize);
    var interval = {
      event: "(a,b]",
      left: params.a,
      right: params.b,
      probability: intervalProbability(model, params.a, params.b),
      continuousArea: continuousIntervalArea(model, params.a, params.b),
      atomMass: sortedAtoms(model).reduce(function (sum, atom) {
        return sum + (atom.x > params.a + EPS && atom.x <= params.b + EPS ? atom.p : 0);
      }, 0)
    };
    var probe = model.probe;
    var ordinaryDensity = density(model, probe);
    return {
      params: params,
      model: copyPreset(model),
      deterministic: true,
      randomSamples: false,
      seed: model.seed,
      pointMasses: sortedAtoms(model),
      pmf: sortedAtoms(model),
      cdfCurve: cdfCurve,
      densityCurve: densityCurve,
      density: {
        ordinary: ordinaryDensity,
        ordinaryAvailable: densityInfo(model).ordinaryDensityAvailable,
        continuousComponent: continuousDensity(model, probe),
        info: densityInfo(model)
      },
      interval: interval,
      quantileGrid: grid,
      probe: {
        x: probe,
        pointProbability: pointProbability(model, probe),
        cdf: cdf(model, probe),
        ordinaryDensity: ordinaryDensity,
        continuousDensity: continuousDensity(model, probe)
      },
      squareTransform: model.id === "square" ? squareTransform(0.25) : null,
      representations: {
        pointMass: { available: sortedAtoms(model).length > 0, entries: sortedAtoms(model) },
        cdf: { available: true, equation: "F(x)=P(X<=x)" },
        densityArea: {
          available: Boolean(model.continuous),
          ordinaryDensityAvailable: densityInfo(model).ordinaryDensityAvailable,
          intervalEvent: "(a,b]"
        },
        quantile: { available: true, equation: "Q(p)=inf{x:F(x)>=p}", grid: grid }
      }
    };
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

  function element(doc, tag, attrs, children) {
    return appendChildren(setAttributes(doc.createElement(tag), attrs || {}), children);
  }

  function svgElement(doc, tag, attrs, children) {
    return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attrs || {}), children);
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function installStyles(doc) {
    if (!doc || !doc.getElementById || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    (doc.head || doc.documentElement || doc.body).appendChild(style);
  }

  function formatNumber(value, digits) {
    if (value === Infinity) return "∞";
    if (!finite(value)) return "—";
    var places = digits === undefined ? 3 : digits;
    if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4));
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function chartText(doc, x, y, text, className, attrs) {
    var options = attrs || {};
    options.x = x;
    options.y = y;
    if (className) options.className = className;
    options.text = text;
    return svgElement(doc, "text", options);
  }

  function line(doc, x1, y1, x2, y2, className, attrs) {
    var options = attrs || {};
    options.x1 = x1;
    options.y1 = y1;
    options.x2 = x2;
    options.y2 = y2;
    if (className) options.className = className;
    return svgElement(doc, "line", options);
  }

  function path(doc, d, className, attrs) {
    var options = attrs || {};
    options.d = d;
    if (className) options.className = className;
    return svgElement(doc, "path", options);
  }

  function scaleX(value, domain, plot) {
    return plot.left + (value - domain[0]) / (domain[1] - domain[0]) * (plot.right - plot.left);
  }

  function scaleY(value, domain, plot) {
    return plot.bottom - (value - domain[0]) / (domain[1] - domain[0]) * (plot.bottom - plot.top);
  }

  function pathFromPoints(points, xDomain, yDomain, plot) {
    return points.map(function (point, index) {
      var command = index === 0 ? "M" : "L";
      return command + scaleX(point.x, xDomain, plot).toFixed(2) + "," + scaleY(point.y, yDomain, plot).toFixed(2);
    }).join(" ");
  }

  function chartSvg(doc, ariaLabel) {
    return svgElement(doc, "svg", {
      className: "dm-chart-svg",
      viewBox: "0 0 760 330",
      role: "img",
      "aria-label": ariaLabel
    });
  }

  function tickValues(model) {
    return model.id === "discrete" ? [0, 1, 2] : [0, 0.5, 1];
  }

  function scaffold(doc, svg, title, xDomain, yDomain, xLabel, yLabel, model) {
    var plot = { left: 58, right: 735, top: 36, bottom: 262 };
    svg.appendChild(chartText(doc, plot.left, 20, title, "dm-chart-title"));
    var yTicks = yDomain[1] === 1 ? [0, 0.5, 1] : [0, yDomain[1] / 2, yDomain[1]];
    yTicks.forEach(function (value) {
      var y = scaleY(value, yDomain, plot);
      svg.appendChild(line(doc, plot.left, y, plot.right, y, "dm-grid-line"));
      svg.appendChild(chartText(doc, plot.left - 8, y + 4, formatNumber(value, 2), "dm-chart-label", { "text-anchor": "end" }));
    });
    tickValues(model).forEach(function (value) {
      if (value < xDomain[0] - EPS || value > xDomain[1] + EPS) return;
      var x = scaleX(value, xDomain, plot);
      svg.appendChild(line(doc, x, plot.top, x, plot.bottom, "dm-grid-line"));
      svg.appendChild(chartText(doc, x, plot.bottom + 19, formatNumber(value, 2), "dm-chart-label", { "text-anchor": "middle" }));
    });
    svg.appendChild(line(doc, plot.left, plot.bottom, plot.right, plot.bottom, "dm-axis"));
    svg.appendChild(line(doc, plot.left, plot.top, plot.left, plot.bottom, "dm-axis"));
    svg.appendChild(chartText(doc, (plot.left + plot.right) / 2, 304, xLabel, "dm-chart-label", { "text-anchor": "middle" }));
    svg.appendChild(chartText(doc, 15, (plot.top + plot.bottom) / 2, yLabel, "dm-chart-label", { transform: "rotate(-90 15 " + ((plot.top + plot.bottom) / 2) + ")", "text-anchor": "middle" }));
    return plot;
  }

  function pmfChart(doc, result) {
    var model = result.model;
    var svg = chartSvg(doc, "PMF and point masses");
    var max = result.pointMasses.reduce(function (value, atom) { return Math.max(value, atom.p); }, 0);
    var yMax = Math.max(0.6, max * 1.25);
    var plot = scaffold(doc, svg, "PMF / point masses", model.chartDomain, [0, yMax], "x", "P(X=x)", model);
    if (!result.pointMasses.length) {
      svg.appendChild(chartText(doc, plot.left + 18, plot.top + 28, "No atoms: P(X=x)=0", "dm-chart-label"));
      return svg;
    }
    result.pointMasses.forEach(function (atom) {
      var x = scaleX(atom.x, model.chartDomain, plot);
      var y = scaleY(atom.p, [0, yMax], plot);
      var width = Math.max(18, (plot.right - plot.left) / (model.id === "discrete" ? 8 : 14));
      svg.appendChild(svgElement(doc, "rect", { x: x - width / 2, y: y, width: width, height: plot.bottom - y, className: "dm-atom-bar", rx: 2 }));
      svg.appendChild(chartText(doc, x, y - 7, formatNumber(atom.p, 2), "dm-small-label", { "text-anchor": "middle" }));
    });
    if (model.kind === "mixed") svg.appendChild(chartText(doc, plot.right - 4, plot.top + 14, "atom mass only", "dm-small-label", { "text-anchor": "end" }));
    return svg;
  }

  function cdfPathPoints(model) {
    var x0 = model.chartDomain[0];
    var x1 = model.chartDomain[1];
    var atoms = sortedAtoms(model);
    var points = [{ x: x0, y: cdf(model, x0) }];
    atoms.forEach(function (atom) {
      if (atom.x <= x0 + EPS || atom.x >= x1 - EPS) return;
      points.push({ x: atom.x, y: cdf(model, atom.x) - atom.p });
      points.push({ x: atom.x, y: cdf(model, atom.x) });
    });
    points.push({ x: x1, y: cdf(model, x1) });
    return points;
  }

  function cdfChart(doc, result) {
    var model = result.model;
    var svg = chartSvg(doc, "CDF curve and jumps");
    var plot = scaffold(doc, svg, "CDF: F(x)=P(X<=x)", model.chartDomain, [0, 1], "x", "F(x)", model);
    var points = result.pointMasses.length ? cdfPathPoints(model) : result.cdfCurve;
    svg.appendChild(path(doc, pathFromPoints(points, model.chartDomain, [0, 1], plot), "dm-main-line"));
    result.pointMasses.forEach(function (atom) {
      var x = scaleX(atom.x, model.chartDomain, plot);
      var before = cdf(model, atom.x) - atom.p;
      var after = cdf(model, atom.x);
      svg.appendChild(svgElement(doc, "circle", { cx: x, cy: scaleY(before, [0, 1], plot), r: 4.5, fill: "var(--bg)", stroke: "var(--dm-red)", "stroke-width": 2 }));
      svg.appendChild(svgElement(doc, "circle", { cx: x, cy: scaleY(after, [0, 1], plot), r: 4.2, className: "dm-quantile-point" }));
      svg.appendChild(chartText(doc, x + 7, scaleY(after, [0, 1], plot) - 8, "jump=" + formatNumber(atom.p, 2), "dm-small-label"));
    });
    if (!result.pointMasses.length) svg.appendChild(chartText(doc, plot.right - 4, plot.top + 14, "continuous", "dm-small-label", { "text-anchor": "end" }));
    return svg;
  }

  function areaPath(model, left, right, plot, yMax) {
    var domain = model.domain;
    var a = clamp(left, domain[0], domain[1]);
    var b = clamp(right, domain[0], domain[1]);
    if (b <= a) return "";
    var values = linspace(a, b, 25).map(function (x) { return { x: x, y: continuousDensity(model, x) }; }).filter(function (point) { return finite(point.y); });
    if (!values.length) return "";
    var points = [{ x: values[0].x, y: 0 }].concat(values).concat([{ x: values[values.length - 1].x, y: 0 }]);
    return pathFromPoints(points, domain, [0, yMax], plot);
  }

  function densityChart(doc, result) {
    var model = result.model;
    var svg = chartSvg(doc, "Density curve and interval area");
    var plot;
    if (!model.continuous) {
      plot = scaffold(doc, svg, "Density / interval area", model.chartDomain, [0, 1], "x", "density", model);
      svg.appendChild(chartText(doc, plot.left + 18, plot.top + 28, "No density: use PMF / masses", "dm-chart-label"));
      return svg;
    }
    var finiteValues = result.densityCurve.map(function (point) { return point.y; }).filter(finite);
    var max = finiteValues.reduce(function (value, point) { return Math.max(value, point); }, 0);
    var yMax = Math.max(1, max * 1.25);
    plot = scaffold(doc, svg, "Density / interval area", model.domain, [0, yMax], "x", "density", model);
    var curvePoints = result.densityCurve.filter(function (point) { return finite(point.y); });
    svg.appendChild(path(doc, pathFromPoints(curvePoints, model.chartDomain, [0, yMax], plot), "dm-main-line"));
    var area = areaPath(model, result.interval.left, result.interval.right, plot, yMax);
    if (area) svg.appendChild(path(doc, area, "dm-area"));
    result.pointMasses.forEach(function (atom) {
      var x = scaleX(atom.x, model.domain, plot);
      svg.appendChild(line(doc, x, plot.bottom, x, plot.top + 30, "dm-atom-line"));
      svg.appendChild(chartText(doc, x + 6, plot.top + 24, "atom", "dm-small-label"));
    });
    svg.appendChild(chartText(doc, plot.right - 4, plot.top + 14, result.pointMasses.length ? "continuous part" : "area=(a,b]", "dm-small-label", { "text-anchor": "end" }));
    return svg;
  }

  function quantileChart(doc, result) {
    var model = result.model;
    var svg = chartSvg(doc, "Generalized inverse and deterministic quantile grid");
    var plot = scaffold(doc, svg, "Quantile: Q(p)=inf{x:F(x)>=p}", model.chartDomain, [0, 1], "quantile value", "p", model);
    var curve = linspace(0.01, 0.99, 80).map(function (p) { return { x: generalizedInverse(model, p), y: p }; });
    svg.appendChild(path(doc, pathFromPoints(curve, model.chartDomain, [0, 1], plot), "dm-main-line"));
    result.quantileGrid.probabilities.forEach(function (p, index) {
      svg.appendChild(svgElement(doc, "circle", {
        cx: scaleX(result.quantileGrid.values[index], model.chartDomain, plot),
        cy: scaleY(p, [0, 1], plot),
        r: 4,
        className: "dm-quantile-point"
      }));
    });
    svg.appendChild(chartText(doc, plot.right - 4, plot.top + 14, "midpoint grid; not IID samples", "dm-small-label", { "text-anchor": "end" }));
    return svg;
  }

  function chartPanel(doc, title, note, svg) {
    return element(doc, "section", { className: "dm-chart" }, [
      element(doc, "h4", { text: title }),
      element(doc, "p", { className: "dm-chart-note", text: note }),
      element(doc, "div", { className: "dm-chart-frame" }, svg)
    ]);
  }

  function metricNode(doc, label) {
    var value = element(doc, "strong", { text: "—" });
    return { node: element(doc, "div", { className: "dm-metric" }, [element(doc, "span", { text: label }), value]), value: value };
  }

  function interpretation(result) {
    var model = result.model;
    var intervalText = "P(" + formatNumber(result.interval.left, 2) + "<X<=" + formatNumber(result.interval.right, 2) + ")=" + formatNumber(result.interval.probability, 3);
    if (model.id === "mixture") {
      return "混合分布要分两本账：连续部分面积=" + formatNumber(result.interval.continuousArea, 3) + "，区间内原子质量=" + formatNumber(result.interval.atomMass, 3) + "，所以 " + intervalText + "。在 x=0.4，P(X=x)=0.3，但连续部分密度为 0.7；没有一个普通 PDF 能单独表示整个分布。";
    }
    if (model.id === "square") {
      return "Y=X^2 不是单调变换：例如 y=0.25 的原像是 x=+0.5 与 x=-0.5，两支的 Jacobian 贡献相加；" + intervalText + "。quantile grid 仍按解析 Q(p)=p^2 排列。";
    }
    if (model.id === "uniform") {
      return "连续均匀分布在每个点的概率都为 0，但区间面积仍可为正；当前 " + intervalText + "，且 Q(0.5)=0.5。";
    }
    return "离散分布用 PMF 的点质量求和，CDF 在原子处跳跃；当前 " + intervalText + "，Q(p) 在累计质量跨过某个点时会停在该点。";
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    installStyles(doc);
    INSTANCE += 1;
    var prefix = "dm-" + INSTANCE;
    var state = {
      modelId: "mixture",
      a: MIXTURE.interval[0],
      b: MIXTURE.interval[1],
      gridSize: 12,
      predictions: { cdf: null, mixture: null, quantile: null, square: null }
    };

    var shell = element(doc, "div", { className: "dm-lab" });
    shell.appendChild(element(doc, "h3", { text: "同一分布的四种表示" }));
    shell.appendChild(element(doc, "p", { className: "dm-intro", text: "固定解析预设把点质量、CDF、密度/面积和广义逆放在同一坐标账本里。先预测，提交后才揭示图形；quantile grid 是确定性积分/可视化网格，不是 IID 随机样本。" }));

    var form = element(doc, "form", { className: "dm-prediction", "aria-labelledby": prefix + "-prediction-title" });
    var fieldset = element(doc, "fieldset");
    fieldset.appendChild(element(doc, "legend", { id: prefix + "-prediction-title" }, "预测门：四项都回答后才揭示四种表示"));
    var questions = [
      {
        key: "cdf",
        prompt: "1. 离散三点分布在 x=1 处，CDF 会怎样？",
        expected: "jump",
        choices: [["jump", "出现高度为 P(X=1) 的跳跃"], ["smooth", "保持光滑并等于 PMF"], ["zero", "因为点很小所以跳跃为 0"]]
      },
      {
        key: "mixture",
        prompt: "2. 混合模型在 x=0.4 有原子时，点概率与区间面积如何记账？",
        expected: "atom-area",
        choices: [["atom-area", "点质量单列，区间还要把原子与连续面积相加"], ["all-pdf", "一个普通 PDF 的面积自动包含原子"], ["zero", "有密度所以点概率必为 0"]]
      },
      {
        key: "quantile",
        prompt: "3. p 落在原子造成的 CDF 跳跃段内，广义逆 Q(p) 取哪里？",
        expected: "atom",
        choices: [["atom", "取这个原子的位置"], ["interpolate", "在跳跃的竖线中线性插值 x"], ["left", "永远取跳跃左端"]]
      },
      {
        key: "square",
        prompt: "4. X~U(-1,1)，Y=X^2 在 y=0.25 有几个原像？",
        expected: "two-sum",
        choices: [["two-sum", "两个：±sqrt(y)，两支 Jacobian 贡献相加"], ["one", "一个：只取正平方根"], ["monotone", "直接套一条单调逆函数公式"]]
      }
    ];
    var choiceButtons = [];
    var questionGrid = element(doc, "div", { className: "dm-question-grid" });
    questions.forEach(function (question) {
      var questionSet = element(doc, "fieldset", { className: "dm-question" });
      questionSet.appendChild(element(doc, "legend", { text: question.prompt }));
      var choices = element(doc, "div", { className: "dm-choice-list", role: "group", "aria-label": question.prompt });
      question.choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", "aria-pressed": "false" }, choice[1]);
        button.addEventListener("click", function () {
          state.predictions[question.key] = choice[0];
          choiceButtons.forEach(function (item) {
            item.node.setAttribute("aria-pressed", state.predictions[item.key] === item.value ? "true" : "false");
          });
        });
        choiceButtons.push({ key: question.key, value: choice[0], node: button });
        choices.appendChild(button);
      });
      questionSet.appendChild(choices);
      questionGrid.appendChild(questionSet);
    });
    fieldset.appendChild(questionGrid);
    form.appendChild(fieldset);
    var predictionActions = element(doc, "div", { className: "dm-actions" });
    var revealButton = element(doc, "button", { type: "submit", className: "dm-primary" }, "提交预测并揭示");
    var clearButton = element(doc, "button", { type: "button" }, "清空预测");
    predictionActions.appendChild(revealButton);
    predictionActions.appendChild(clearButton);
    form.appendChild(predictionActions);
    var feedback = element(doc, "p", { className: "dm-feedback", role: "status", "aria-live": "polite", text: "请先完成四项预测。" });
    form.appendChild(feedback);
    shell.appendChild(form);

    var revealed = element(doc, "section", { className: "dm-revealed", hidden: true, "aria-label": "四种分布表示实验结果" });
    var layout = element(doc, "div", { className: "dm-layout" });
    var controls = element(doc, "div", { className: "dm-controls" });
    controls.appendChild(element(doc, "h4", { text: "预设与确定性网格" }));
    var presetGrid = element(doc, "div", { className: "dm-preset-grid", role: "group", "aria-label": "分布预设" });
    var presetButtons = [];
    PRESETS.forEach(function (preset) {
      var button = element(doc, "button", { type: "button", "aria-pressed": "false" }, preset.label);
      button.addEventListener("click", function () {
        state.modelId = preset.id;
        state.a = preset.interval[0];
        state.b = preset.interval[1];
        render();
      });
      presetButtons.push({ id: preset.id, node: button });
      presetGrid.appendChild(button);
    });
    controls.appendChild(presetGrid);
    controls.appendChild(element(doc, "p", { className: "dm-note", text: "预设输出来自解析公式；seed 只作固定来源标签，不驱动随机抽样。" }));

    var aId = prefix + "-a";
    var aOutput = element(doc, "output", { for: aId, text: "" });
    var aInput = element(doc, "input", { id: aId, type: "range", min: "0", max: "100", step: "1", "aria-label": "区间左端点" });
    var aControl = element(doc, "div", { className: "dm-control" }, [element(doc, "label", { htmlFor: aId }, ["区间左端 a：", aOutput]), aInput, element(doc, "div", { className: "dm-scale" }, [element(doc, "span", { text: "domain low" }), element(doc, "span", { text: "domain high" })])]);
    controls.appendChild(aControl);

    var bId = prefix + "-b";
    var bOutput = element(doc, "output", { for: bId, text: "" });
    var bInput = element(doc, "input", { id: bId, type: "range", min: "0", max: "100", step: "1", "aria-label": "区间右端点" });
    var bControl = element(doc, "div", { className: "dm-control" }, [element(doc, "label", { htmlFor: bId }, ["区间右端 b：", bOutput]), bInput, element(doc, "div", { className: "dm-scale" }, [element(doc, "span", { text: "domain low" }), element(doc, "span", { text: "domain high" })])]);
    controls.appendChild(bControl);

    var nId = prefix + "-n";
    var nOutput = element(doc, "output", { for: nId, text: "" });
    var nInput = element(doc, "input", { id: nId, type: "range", min: "6", max: "24", step: "1", "aria-label": "quantile grid size" });
    controls.appendChild(element(doc, "div", { className: "dm-control" }, [element(doc, "label", { htmlFor: nId }, ["quantile grid 点数 N：", nOutput]), nInput, element(doc, "div", { className: "dm-scale" }, [element(doc, "span", { text: "6" }), element(doc, "span", { text: "24" })])]));
    var relockButton = element(doc, "button", { type: "button" }, "重新预测");
    controls.appendChild(relockButton);
    layout.appendChild(controls);

    var stage = element(doc, "div", { className: "dm-stage" });
    var formula = element(doc, "p", { className: "dm-formula", text: "PMF: p(x)=P(X=x)  |  CDF: F(x)=P(X<=x)  |  area: P(a<X<=b)=F(b)-F(a)  |  Q(p)=inf{x:F(x)>=p}" });
    stage.appendChild(formula);
    var metrics = [
      metricNode(doc, "区间概率 P(a<X<=b)"),
      metricNode(doc, "连续部分面积"),
      metricNode(doc, "区间内原子质量"),
      metricNode(doc, "探针点的 P(X=x*)")
    ];
    stage.appendChild(element(doc, "div", { className: "dm-metrics", "aria-label": "概率账本" }, metrics.map(function (item) { return item.node; })));
    var chartGrid = element(doc, "div", { className: "dm-chart-grid" });
    stage.appendChild(chartGrid);
    var ledger = element(doc, "div", { className: "dm-ledger" });
    var table = element(doc, "table");
    table.appendChild(element(doc, "caption", { text: "四种表示的同一份概率账本" }));
    var head = element(doc, "thead");
    head.appendChild(element(doc, "tr", {}, [element(doc, "th", { text: "表示" }), element(doc, "th", { text: "当前读法" }), element(doc, "th", { text: "边界提醒" })]));
    table.appendChild(head);
    var ledgerBody = element(doc, "tbody");
    table.appendChild(ledgerBody);
    ledger.appendChild(table);
    stage.appendChild(ledger);
    var interpretationNode = element(doc, "p", { className: "dm-interpretation", role: "status", "aria-live": "polite", text: "" });
    stage.appendChild(interpretationNode);
    stage.appendChild(element(doc, "p", { className: "dm-caution", text: "图形只审计四个固定模型的定义与积分关系；它不替代一般测度分解、变换定理或随机模拟的证明。" }));
    layout.appendChild(stage);
    revealed.appendChild(layout);
    shell.appendChild(revealed);
    clear(root);
    root.appendChild(shell);

    function ratioFor(value, model) {
      return 100 * (value - model.domain[0]) / (model.domain[1] - model.domain[0]);
    }

    function valueFor(ratio, model) {
      return model.domain[0] + (model.domain[1] - model.domain[0]) * Number(ratio) / 100;
    }

    function syncControls() {
      var model = modelById(state.modelId);
      aInput.value = String(Math.round(ratioFor(state.a, model)));
      bInput.value = String(Math.round(ratioFor(state.b, model)));
      nInput.value = String(state.gridSize);
      aOutput.textContent = formatNumber(state.a, 3);
      bOutput.textContent = formatNumber(state.b, 3);
      nOutput.textContent = String(state.gridSize);
      presetButtons.forEach(function (item) {
        item.node.setAttribute("aria-pressed", item.id === state.modelId ? "true" : "false");
      });
    }

    function renderLedger(result) {
      clear(ledgerBody);
      var model = result.model;
      var pointText = result.pointMasses.length
        ? result.pointMasses.map(function (atom) { return "P(X=" + formatNumber(atom.x, 2) + ")=" + formatNumber(atom.p, 2); }).join("；")
        : "所有点概率为 0";
      var densityText = !model.continuous
        ? "无普通密度；对点质量求和。"
        : (result.density.ordinaryAvailable
          ? "密度可表示全分布；面积=" + formatNumber(result.interval.continuousArea, 3)
          : "只有连续部分密度=" + formatNumber(result.density.continuousComponent, 3) + "，原子另记。 ");
      var rows = [
        ["点质量 / PMF", pointText, model.kind === "discrete" ? "CDF 在原子处跳跃。" : "连续分布的点概率可为 0。"],
        ["CDF", "F(" + formatNumber(result.interval.right, 2) + ")-F(" + formatNumber(result.interval.left, 2) + ")=" + formatNumber(result.interval.probability, 3), "区间事件是 (a,b]。"],
        ["密度 / 区间面积", densityText, model.kind === "mixed" ? "普通 PDF 不能吞掉 atom。" : "面积不是单点概率。"],
        ["Quantile / generalized inverse", "Q(0.5)=" + formatNumber(generalizedInverse(model, 0.5), 3) + "；N=" + result.quantileGrid.count, "p_i=(i+1/2)/N，确定性而非 IID。"]
      ];
      rows.forEach(function (row) {
        ledgerBody.appendChild(element(doc, "tr", {}, row.map(function (value) { return element(doc, "td", { text: value }); })));
      });
    }

    function render() {
      var result = fourRepresentations({ modelId: state.modelId, a: state.a, b: state.b, gridSize: state.gridSize });
      syncControls();
      metrics[0].value.textContent = formatNumber(result.interval.probability, 3);
      metrics[1].value.textContent = formatNumber(result.interval.continuousArea, 3);
      metrics[2].value.textContent = formatNumber(result.interval.atomMass, 3);
      metrics[3].value.textContent = formatNumber(result.probe.pointProbability, 3);
      clear(chartGrid);
      chartGrid.appendChild(chartPanel(doc, "点质量 / PMF", "离散 PMF 是点质量；连续模型用 0 表示点概率，混合模型把 atom 单列。", pmfChart(doc, result)));
      chartGrid.appendChild(chartPanel(doc, "CDF", "右连续的 F(x) 统一记录跳跃、斜率和区间差。", cdfChart(doc, result)));
      chartGrid.appendChild(chartPanel(doc, "密度与区间面积", "金色区域只表示连续部分的面积；红色竖线表示 atom。", densityChart(doc, result)));
      chartGrid.appendChild(chartPanel(doc, "Quantile / generalized inverse", "绿色点是 p_i=(i+1/2)/N 的确定性 quantile grid，不是 IID 样本。", quantileChart(doc, result)));
      renderLedger(result);
      interpretationNode.textContent = interpretation(result);
    }

    aInput.addEventListener("input", function () {
      var model = modelById(state.modelId);
      state.a = valueFor(aInput.value, model);
      if (state.a >= state.b) state.a = Math.max(model.domain[0], state.b - (model.domain[1] - model.domain[0]) / 100);
      render();
    });
    bInput.addEventListener("input", function () {
      var model = modelById(state.modelId);
      state.b = valueFor(bInput.value, model);
      if (state.b <= state.a) state.b = Math.min(model.domain[1], state.a + (model.domain[1] - model.domain[0]) / 100);
      render();
    });
    nInput.addEventListener("input", function () {
      state.gridSize = integer(nInput.value, 12, 6, 24);
      render();
    });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var missing = questions.filter(function (question) { return !state.predictions[question.key]; });
      if (missing.length) {
        feedback.className = "dm-feedback dm-warn";
        feedback.textContent = "还差 " + missing.length + " 项预测。";
        return;
      }
      var correct = questions.filter(function (question) { return state.predictions[question.key] === question.expected; }).length;
      feedback.className = "dm-feedback " + (correct === questions.length ? "dm-pass" : "dm-warn");
      feedback.textContent = "已揭示：" + correct + "/" + questions.length + " 项预测与解析账本一致。";
      revealed.removeAttribute("hidden");
      render();
      if (api && typeof api.announce === "function") api.announce(root, feedback.textContent);
    });
    clearButton.addEventListener("click", function () {
      state.predictions = { cdf: null, mixture: null, quantile: null, square: null };
      choiceButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", "false"); });
      feedback.className = "dm-feedback";
      feedback.textContent = "预测已清空。";
    });
    relockButton.addEventListener("click", function () {
      revealed.setAttribute("hidden", "hidden");
      state.predictions = { cdf: null, mixture: null, quantile: null, square: null };
      choiceButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", "false"); });
      feedback.className = "dm-feedback";
      feedback.textContent = "已重新上锁，请再作四项预测。";
      if (api && typeof api.announce === "function") api.announce(root, feedback.textContent);
    });
    syncControls();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }
    var discrete = modelById("discrete");
    var uniform = modelById("uniform");
    var mixture = modelById("mixture");
    var square = modelById("square");
    check(near(discrete.atoms.reduce(function (sum, atom) { return sum + atom.p; }, 0), 1), "discrete masses normalize");
    check(near(pmf(discrete, 1), 0.5), "discrete PMF");
    check(near(cdf(discrete, 0.99), 0.2) && near(cdf(discrete, 1), 0.7), "discrete CDF jump");
    check(near(intervalProbability(discrete, 0.5, 1.5), 0.5), "discrete interval sum");
    check(quantile(discrete, 0.2) === 0 && quantile(discrete, 0.21) === 1, "discrete generalized inverse");
    check(near(density(uniform, 0.5), 1), "uniform density");
    check(near(pointProbability(uniform, 0.5), 0), "continuous point probability zero");
    check(near(intervalProbability(uniform, 0.2, 0.7), 0.5), "uniform interval area");
    check(near(quantile(uniform, 0.5), 0.5), "uniform quantile");
    check(near(atomMass(mixture, 0.4), 0.3), "mixture atom");
    check(near(cdf(mixture, 0.4 - 1e-6), 0.28, 1e-5) && near(cdf(mixture, 0.4), 0.58), "mixture CDF jump");
    check(density(mixture, 0.4) === null && near(continuousDensity(mixture, 0.4), 0.7), "mixture has no full PDF");
    check(near(intervalProbability(mixture, 0.2, 0.5), 0.51) && near(continuousIntervalArea(mixture, 0.2, 0.5), 0.21), "mixture area plus atom");
    check(quantile(mixture, 0.3) === 0.4 && near(quantile(mixture, 0.7), 4 / 7), "mixture generalized inverse");
    var transformed = squareTransform(0.25);
    check(transformed.preimages.length === 2 && near(transformed.preimages[0], -0.5) && near(transformed.preimages[1], 0.5), "square has two preimages");
    check(near(transformed.density, 1) && near(transformed.cdf, 0.5), "square transform density and CDF");
    check(near(intervalProbability(square, 0.25, 0.64), 0.3) && near(quantile(square, 0.5), 0.25), "square interval and quantile");
    check(near(pointProbability(square, 0.25), 0), "square point probability zero");
    var gridA = quantileGrid(mixture, 12);
    var gridB = quantileGrid(mixture, 12);
    check(JSON.stringify(gridA) === JSON.stringify(gridB) && gridA.deterministic && gridA.iid === false, "quantile grid deterministic and non-IID");
    check(near(gridA.probabilities[0], 1 / 24) && near(gridA.weight, 1 / 12), "quantile midpoint rule");
    check(near(quantileIntegral(uniform, function (x) { return x; }, 100).value, 0.5), "quantile integration");
    PRESETS.forEach(function (preset) {
      var result = fourRepresentations({ modelId: preset.id, gridSize: 12 });
      check(result.deterministic && result.randomSamples === false, preset.id + " analytic result");
      check(result.quantileGrid.values.length === 12, preset.id + " quantile grid length");
    });
    return { checks: checks, presets: PRESETS.length, deterministic: true };
  }

  return {
    PRESETS: PRESETS,
    MIXTURE: MIXTURE,
    NONMONOTONE_CASE: NONMONOTONE_CASE,
    modelById: modelById,
    normalizeInput: normalizeInput,
    pointProbability: pointProbability,
    atomMass: atomMass,
    pmf: pmf,
    cdf: cdf,
    density: density,
    continuousDensity: continuousDensity,
    densityInfo: densityInfo,
    intervalProbability: intervalProbability,
    continuousIntervalArea: continuousIntervalArea,
    quantile: quantile,
    generalizedInverse: generalizedInverse,
    quantileGrid: quantileGrid,
    quantileIntegral: quantileIntegral,
    squarePreimages: squarePreimages,
    squareTransform: squareTransform,
    fourRepresentations: fourRepresentations,
    evaluate: fourRepresentations,
    selfTest: selfTest,
    mount: mount
  };
});
