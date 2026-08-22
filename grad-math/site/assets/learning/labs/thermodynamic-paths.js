(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("thermodynamic-paths", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("thermodynamic-paths self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("thermodynamic-paths self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "thermodynamic-paths-lab-styles";
  var INSTANCE = 0;
  var LIMITS = { V2: [1.2, 3.5], gamma: [1.4, 1.8] };
  var DEFAULTS = { V1: 1, T1: 1, nR: 1, gamma: 5 / 3 };
  var PATHS = {
    isothermal: {
      label: "可逆等温",
      kind: "reversible",
      description: "T=1，p=1/V"
    },
    twoleg: {
      label: "可逆两段",
      kind: "reversible",
      description: "先等容冷却，再等压膨胀"
    },
    linear: {
      label: "可逆直线",
      kind: "reversible",
      description: "平衡态 PV 平面上的直线"
    },
    free: {
      label: "真空自由膨胀",
      kind: "irreversible",
      description: "中间阶段非平衡，边界仅作示意"
    },
    adiabatic: {
      label: "可逆绝热",
      kind: "reversible",
      description: "pV^γ=常数，Q=0"
    }
  };
  var PRESETS = [
    { id: "isothermal", label: "等温", pathId: "isothermal", V2: 2 },
    { id: "twoleg", label: "两段", pathId: "twoleg", V2: 2 },
    { id: "linear", label: "直线", pathId: "linear", V2: 2 },
    { id: "free", label: "自由膨胀", pathId: "free", V2: 2 },
    { id: "adiabatic", label: "绝热", pathId: "adiabatic", V2: 2 }
  ];

  var STYLE_TEXT = [
    ".tp-lab{--tp-blue:var(--cl-blue,#315f9d);--tp-gold:var(--cl-gold,#9b6a12);--tp-green:var(--cl-green,#39734d);--tp-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere}",
    ".tp-lab *,.tp-lab *::before,.tp-lab *::after{box-sizing:border-box}",
    ".tp-lab [hidden]{display:none!important}",
    ".tp-lab button,.tp-lab input{font:inherit}",
    ".tp-lab button{min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}",
    ".tp-lab button:hover{border-color:var(--accent)}",
    ".tp-lab button:focus-visible,.tp-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}",
    ".tp-lab button[aria-pressed=true],.tp-lab .tp-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}",
    ".tp-lab .tp-note{color:var(--fg-soft);font-size:13px;line-height:1.65}",
    ".tp-lab .tp-prediction{margin-top:14px;padding:13px 14px;border-left:3px solid var(--tp-gold);background:var(--bg)}",
    ".tp-lab .tp-prediction h3{margin:0 0 10px;font-size:14px}",
    ".tp-lab fieldset{min-width:0;margin:0 0 10px;padding:10px;border:1px solid var(--border);border-radius:6px}",
    ".tp-lab legend{max-width:100%;padding:0 5px;color:var(--fg);font-size:13px;font-weight:750;line-height:1.5}",
    ".tp-lab .tp-choices,.tp-lab .tp-actions,.tp-lab .tp-presets{display:flex;flex-wrap:wrap;gap:8px}",
    ".tp-lab .tp-choices button,.tp-lab .tp-presets button,.tp-lab .tp-actions>*{flex:1 1 150px}",
    ".tp-lab .tp-feedback{min-height:2em;margin:9px 0 0;color:var(--fg-soft);font-size:13px;font-weight:700}",
    ".tp-lab .tp-pass{color:var(--tp-green)}.tp-lab .tp-warn{color:var(--tp-red)}",
    ".tp-lab .tp-controls{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(220px,.7fr);gap:12px;margin-top:16px}",
    ".tp-lab .tp-control-group{display:grid;gap:8px;min-width:0;padding:11px;border:1px solid var(--border);border-radius:6px;background:var(--bg)}",
    ".tp-lab .tp-control-group label{color:var(--fg-soft);font-size:12.5px;font-weight:700}",
    ".tp-lab .tp-control-group output{color:var(--accent);font-variant-numeric:tabular-nums}",
    ".tp-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent)}",
    ".tp-lab .tp-results{margin-top:18px;padding-top:15px;border-top:1px solid var(--border)}",
    ".tp-lab .tp-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:10px 0 14px}",
    ".tp-lab .tp-metric{min-width:0;padding:8px;border-top:2px solid var(--border);background:var(--bg)}",
    ".tp-lab .tp-metric span{display:block;color:var(--fg-soft);font-size:11.5px}",
    ".tp-lab .tp-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".tp-lab svg{display:block;width:100%;height:auto;max-width:100%;border:1px solid var(--border);border-radius:6px;background:var(--bg)}",
    ".tp-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}",
    ".tp-lab .tp-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.55}",
    ".tp-lab .tp-axis{stroke:currentColor;stroke-width:1.25;opacity:.75}",
    ".tp-lab .tp-path{fill:none;stroke:var(--tp-blue);stroke-width:3;stroke-linejoin:round;stroke-linecap:round}",
    ".tp-lab .tp-boundary{fill:none;stroke:var(--tp-red);stroke-width:2.5;stroke-dasharray:7 5;stroke-linecap:round}",
    ".tp-lab .tp-reference{fill:none;stroke:var(--tp-gold);stroke-width:1.6;stroke-dasharray:5 4}",
    ".tp-lab .tp-point{fill:var(--tp-green);stroke:var(--bg);stroke-width:1.5}",
    ".tp-lab .tp-ledger{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:13px}",
    ".tp-lab table{width:100%;min-width:800px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}",
    ".tp-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft);font-size:12px}",
    ".tp-lab th,.tp-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;white-space:nowrap}",
    ".tp-lab th{color:var(--fg-soft);font-size:11.5px}",
    "@media(max-width:760px){.tp-lab .tp-controls{grid-template-columns:minmax(0,1fr)}.tp-lab .tp-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}",
    "@media(max-width:480px){.tp-lab .tp-metrics{grid-template-columns:minmax(0,1fr)}.tp-lab .tp-choices button,.tp-lab .tp-presets button{flex-basis:100%}}",
    "@media(prefers-reduced-motion:reduce){.tp-lab *{animation:none!important;transition:none!important}}"
  ].join("\n");

  function assert(condition, message) {
    if (!condition) throw new Error("thermodynamic-paths self-test failed: " + message);
  }

  function near(a, b, tolerance) {
    return Math.abs(a - b) <= (tolerance === undefined ? 1e-9 : tolerance) * Math.max(1, Math.abs(a), Math.abs(b));
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function idealGasState(volume, temperature, nR) {
    var V = Math.max(1e-9, Number(volume));
    var T = Math.max(1e-9, Number(temperature));
    var gasConstant = Number.isFinite(Number(nR)) ? Number(nR) : DEFAULTS.nR;
    return { V: V, T: T, p: gasConstant * T / V };
  }

  function normalizeConfig(config) {
    config = config || {};
    return {
      pathId: PATHS[config.pathId] ? config.pathId : "isothermal",
      V1: DEFAULTS.V1,
      T1: DEFAULTS.T1,
      nR: DEFAULTS.nR,
      V2: clamp(Number.isFinite(Number(config.V2)) ? Number(config.V2) : 2, LIMITS.V2[0], LIMITS.V2[1]),
      gamma: clamp(Number.isFinite(Number(config.gamma)) ? Number(config.gamma) : DEFAULTS.gamma, LIMITS.gamma[0], LIMITS.gamma[1])
    };
  }

  function heatCapacity(config) {
    var state = normalizeConfig(config);
    return state.nR / (state.gamma - 1);
  }

  function endpointState(config) {
    var state = normalizeConfig(config);
    var T2;
    if (state.pathId === "adiabatic") T2 = state.T1 * Math.pow(state.V2 / state.V1, 1 - state.gamma);
    else T2 = state.T1;
    return {
      initial: idealGasState(state.V1, state.T1, state.nR),
      final: idealGasState(state.V2, T2, state.nR),
      T2: T2
    };
  }

  function pathPoint(config, fraction) {
    var state = normalizeConfig(config);
    var s = clamp(Number(fraction), 0, 1);
    var finalState = endpointState(state);
    var volume;
    var pressure;
    var temperature;
    var equilibrium = true;
    if (state.pathId === "isothermal") {
      volume = state.V1 + (state.V2 - state.V1) * s;
      temperature = state.T1;
      pressure = state.nR * temperature / volume;
    } else if (state.pathId === "twoleg") {
      var intermediateTemperature = state.T1 * state.V1 / state.V2;
      if (s <= 0.5) {
        volume = state.V1;
        temperature = state.T1 + (intermediateTemperature - state.T1) * (2 * s);
        pressure = state.nR * temperature / volume;
      } else {
        volume = state.V1 + (state.V2 - state.V1) * (2 * s - 1);
        pressure = finalState.final.p;
        temperature = intermediateTemperature + (finalState.T2 - intermediateTemperature) * (2 * s - 1);
      }
    } else if (state.pathId === "linear") {
      volume = state.V1 + (state.V2 - state.V1) * s;
      pressure = finalState.initial.p + (finalState.final.p - finalState.initial.p) * s;
      temperature = pressure * volume / state.nR;
    } else if (state.pathId === "adiabatic") {
      volume = state.V1 + (state.V2 - state.V1) * s;
      pressure = finalState.initial.p * Math.pow(volume / state.V1, -state.gamma);
      temperature = state.T1 * Math.pow(volume / state.V1, 1 - state.gamma);
    } else {
      volume = state.V1 + (state.V2 - state.V1) * s;
      pressure = finalState.initial.p + (finalState.final.p - finalState.initial.p) * s;
      temperature = null;
      equilibrium = false;
    }
    return {
      V: volume,
      p: pressure,
      T: temperature,
      equilibrium: equilibrium,
      fraction: s
    };
  }

  function pathProfile(config, samples) {
    var state = normalizeConfig(config);
    var count = Math.max(2, Math.round(Number(samples) || 80));
    var points = [];
    for (var i = 0; i <= count; i += 1) points.push(pathPoint(state, i / count));
    return points;
  }

  function workOnFormula(config) {
    var state = normalizeConfig(config);
    var ratio = state.V2 / state.V1;
    if (state.pathId === "isothermal") return -state.nR * state.T1 * Math.log(ratio);
    if (state.pathId === "twoleg") return -state.nR * state.T1 * (ratio - 1) / ratio;
    if (state.pathId === "linear") {
      var p1 = state.nR * state.T1 / state.V1;
      var p2 = state.nR * state.T1 / state.V2;
      return -0.5 * (p1 + p2) * (state.V2 - state.V1);
    }
    if (state.pathId === "adiabatic") {
      return -state.nR * state.T1 * (1 - Math.pow(ratio, 1 - state.gamma)) / (state.gamma - 1);
    }
    return 0;
  }

  function integratedWorkOn(profile) {
    if (!profile || profile.length < 2) return { value: 0, valid: false };
    for (var i = 0; i < profile.length; i += 1) {
      if (!profile[i].equilibrium || !Number.isFinite(profile[i].p)) return { value: null, valid: false };
    }
    var work = 0;
    for (var j = 1; j < profile.length; j += 1) {
      work -= 0.5 * (profile[j - 1].p + profile[j].p) * (profile[j].V - profile[j - 1].V);
    }
    return { value: work, valid: true };
  }

  function entropyChange(config) {
    var state = normalizeConfig(config);
    var endpoint = endpointState(state);
    return state.nR * Math.log(state.V2 / state.V1) +
      heatCapacity(state) * Math.log(endpoint.T2 / state.T1);
  }

  function processLedger(config) {
    var state = normalizeConfig(config);
    var endpoint = endpointState(state);
    var deltaU = heatCapacity(state) * (endpoint.T2 - state.T1);
    var workOn = workOnFormula(state);
    var heat = deltaU - workOn;
    var deltaS = entropyChange(state);
    var surroundingsEntropy = PATHS[state.pathId].kind === "reversible" ? -deltaS : 0;
    var entropyGenerated = deltaS + surroundingsEntropy;
    var profileCheck = integratedWorkOn(pathProfile(state, 160));
    return {
      pathId: state.pathId,
      label: PATHS[state.pathId].label,
      kind: PATHS[state.pathId].kind,
      description: PATHS[state.pathId].description,
      V1: state.V1,
      V2: state.V2,
      T1: state.T1,
      T2: endpoint.T2,
      p1: endpoint.initial.p,
      p2: endpoint.final.p,
      gamma: state.gamma,
      Cv: heatCapacity(state),
      workOn: workOn,
      heat: heat,
      deltaU: deltaU,
      deltaS: deltaS,
      surroundingsEntropy: surroundingsEntropy,
      entropyGenerated: entropyGenerated,
      firstLawResidual: deltaU - heat - workOn,
      profileWorkOn: profileCheck.value,
      profileWorkValid: profileCheck.valid,
      stateQuantities: "ΔU, ΔS",
      pathQuantities: "ΔW, ΔQ",
      reversibleFormula: state.pathId === "isothermal"
        ? "ΔW=−nRT ln(V₂/V₁)"
        : state.pathId === "adiabatic"
          ? "pV^γ=const，Q=0"
          : state.pathId === "free"
            ? "非平衡边界：不用 ∫p dV"
            : "按所选平衡态路径积分"
    };
  }

  function formatNumber(value, digits) {
    if (value === null || value === undefined || !Number.isFinite(value)) return "不可定义";
    if (Math.abs(value) < 5e-10) return "0";
    var places = digits === undefined ? 5 : digits;
    if (Math.abs(value) >= 10000 || Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4));
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", value);
      else if (key === "htmlFor") node.setAttribute("for", value);
      else if (key === "text") node.textContent = String(value);
      else if (key.slice(0, 2) === "on" && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function svgElement(doc, tag, attrs, text) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null) return;
      node.setAttribute(key === "className" ? "class" : key, String(value));
    });
    if (text !== undefined) node.textContent = String(text);
    return node;
  }

  function installStyles(doc) {
    if (!doc || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    (doc.head || doc.documentElement).appendChild(style);
  }

  function announce(api, rootNode, message) {
    if (api && typeof api.announce === "function") api.announce(rootNode, message);
  }

  function mapX(value, left, right, min, max) {
    return left + (value - min) / (max - min) * (right - left);
  }

  function mapY(value, top, bottom, min, max) {
    return bottom - (value - min) / (max - min) * (bottom - top);
  }

  function plotSvg(doc, ledger, prefix) {
    var svg = svgElement(doc, "svg", {
      viewBox: "0 0 640 330",
      role: "img",
      "aria-labelledby": prefix + "-plot-title " + prefix + "-plot-desc"
    });
    svg.appendChild(svgElement(doc, "title", { id: prefix + "-plot-title" }, "理想气体过程的 P-V 路径"));
    svg.appendChild(svgElement(doc, "desc", { id: prefix + "-plot-desc" }, ledger.kind === "irreversible" ? "红色虚线是非平衡自由膨胀边界，不用于压力积分。" : "蓝线是所选平衡态过程，端点标出初态与终态。"));
    var left = 54;
    var right = 588;
    var top = 34;
    var bottom = 266;
    var minV = 1;
    var maxV = ledger.V2 * 1.04;
    var maxP = Math.max(1.05, ledger.p1 * 1.08, ledger.p2 * 1.08);
    [1, 0.5, 0].forEach(function (fraction) {
      var p = fraction * maxP;
      var y = mapY(p, top, bottom, 0, maxP);
      svg.appendChild(svgElement(doc, "line", { x1: left, x2: right, y1: y, y2: y, className: "tp-grid" }));
      svg.appendChild(svgElement(doc, "text", { x: left - 8, y: y + 4, "font-size": 11, "text-anchor": "end" }, formatNumber(p, 2)));
    });
    svg.appendChild(svgElement(doc, "line", { x1: left, x2: left, y1: top, y2: bottom, className: "tp-axis" }));
    svg.appendChild(svgElement(doc, "line", { x1: left, x2: right, y1: bottom, y2: bottom, className: "tp-axis" }));
    var points = pathProfile({ pathId: ledger.pathId, V2: ledger.V2, gamma: ledger.gamma }, 100);
    var path = points.map(function (point, index) {
      var x = mapX(point.V, left, right, minV, maxV);
      var y = mapY(point.p, top, bottom, 0, maxP);
      return (index ? "L " : "M ") + x.toFixed(2) + " " + y.toFixed(2);
    }).join(" ");
    svg.appendChild(svgElement(doc, "path", { d: path, className: ledger.kind === "irreversible" ? "tp-boundary" : "tp-path" }));
    if (ledger.pathId !== "isothermal" && ledger.kind === "reversible") {
      var isoConfig = { pathId: "isothermal", V2: ledger.V2, gamma: ledger.gamma };
      var isoPoints = pathProfile(isoConfig, 80);
      var isoPath = isoPoints.map(function (point, index) {
        return (index ? "L " : "M ") +
          mapX(point.V, left, right, minV, maxV).toFixed(2) + " " +
          mapY(point.p, top, bottom, 0, maxP).toFixed(2);
      }).join(" ");
      svg.appendChild(svgElement(doc, "path", { d: isoPath, className: "tp-reference" }));
    }
    [
      { V: ledger.V1, p: ledger.p1, label: "初态" },
      { V: ledger.V2, p: ledger.p2, label: "终态" }
    ].forEach(function (point) {
      var x = mapX(point.V, left, right, minV, maxV);
      var y = mapY(point.p, top, bottom, 0, maxP);
      svg.appendChild(svgElement(doc, "circle", { cx: x, cy: y, r: 4.2, className: "tp-point" }));
      svg.appendChild(svgElement(doc, "text", { x: x + 7, y: y - 8, "font-size": 11 }, point.label));
    });
    svg.appendChild(svgElement(doc, "text", { x: right, y: 25, "font-size": 11, "text-anchor": "end" }, ledger.kind === "irreversible" ? "红虚线：非平衡边界，不积分" : "蓝：所选路径；金虚线：等温参照"));
    svg.appendChild(svgElement(doc, "text", { x: right, y: 310, "font-size": 11, "text-anchor": "end" }, "V；p 纵轴，工作符号：ΔW=−∫p_ext dV"));
    return svg;
  }

  function renderTable(doc, parent, V2, gamma) {
    var wrap = element(doc, "div", { className: "tp-ledger" });
    var table = element(doc, "table", { "aria-label": "热力学过程账本" });
    table.appendChild(element(doc, "caption", { text: "本页符号：dU=δQ+δW，δW=−p_ext dV；ΔU、ΔS 为状态量，ΔW、ΔQ 为过程量" }));
    var head = element(doc, "tr");
    ["过程", "类型", "ΔW（系统功）", "ΔQ", "ΔU", "ΔS", "总熵产生", "公式/边界"].forEach(function (label) {
      head.appendChild(element(doc, "th", { scope: "col", text: label }));
    });
    table.appendChild(element(doc, "thead", {}, [head]));
    var body = element(doc, "tbody");
    Object.keys(PATHS).forEach(function (pathId) {
      var ledger = processLedger({ pathId: pathId, V2: V2, gamma: gamma });
      var row = [
        ledger.label,
        ledger.kind === "reversible" ? "可逆/平衡" : "不可逆/边界",
        formatNumber(ledger.workOn, 6),
        formatNumber(ledger.heat, 6),
        formatNumber(ledger.deltaU, 6),
        formatNumber(ledger.deltaS, 6),
        formatNumber(ledger.entropyGenerated, 6),
        ledger.reversibleFormula
      ];
      var tr = element(doc, "tr");
      row.forEach(function (value) { tr.appendChild(element(doc, "td", { text: value })); });
      body.appendChild(tr);
    });
    table.appendChild(body);
    wrap.appendChild(table);
    parent.appendChild(wrap);
  }

  function mount(rootNode, api) {
    if (!rootNode || rootNode.getAttribute("data-tp-mounted") === "true") return;
    rootNode.setAttribute("data-tp-mounted", "true");
    var doc = rootNode.ownerDocument;
    installStyles(doc);
    INSTANCE += 1;
    var prefix = "tp-" + INSTANCE;
    var state = { pathId: PRESETS[0].pathId, V2: PRESETS[0].V2, gamma: DEFAULTS.gamma };
    var activePreset = PRESETS[0].id;
    var answers = [null, null, null];
    var revealed = false;
    var shell = element(doc, "div", { className: "tp-lab" });
    shell.innerHTML = [
      '<p class="tp-note">先统一功的符号，再揭示 PV 路径。蓝线是平衡态路径；自由膨胀的红虚线只作边界示意，不能借一条虚构压力曲线计算功。</p>',
      '<div class="tp-prediction"><h3>预测门：三项都作答后才能揭示</h3>',
      '<fieldset data-question="0"><legend>1. 同端点改变路径，哪些量必相同？</legend><div class="tp-choices">',
      '<button type="button" data-question="0" data-answer="state">ΔU、ΔS；Q、ΔW 可变</button><button type="button" data-question="0" data-answer="path">Q、ΔW；ΔU、ΔS 可变</button><button type="button" data-question="0" data-answer="all">四者都相同</button>',
      '</div></fieldset>',
      '<fieldset data-question="1"><legend>2. 可逆等温膨胀 V:1→2 的符号？</legend><div class="tp-choices">',
      '<button type="button" data-question="1" data-answer="isothermal">ΔW=−ln2，ΔQ=+ln2，ΔU=0</button><button type="button" data-question="1" data-answer="positive">ΔW=+ln2，ΔQ=0</button><button type="button" data-question="1" data-answer="zero">三者都为 0</button>',
      '</div></fieldset>',
      '<fieldset data-question="2"><legend>3. 真空自由膨胀（理想气体）怎样记账？</legend><div class="tp-choices">',
      '<button type="button" data-question="2" data-answer="reversible">ΔS=0，因为 Q=W=0</button><button type="button" data-question="2" data-answer="entropy">Q=W=ΔU=0，但 ΔS>0 且有熵产生</button><button type="button" data-question="2" data-answer="curve">可用一条平衡态曲线积分</button>',
      '</div></fieldset>',
      '<div class="tp-actions"><button class="tp-primary" type="button" data-action="reveal">核对预测并揭示</button><button type="button" data-action="reset">重置</button></div>',
      '<p class="tp-feedback" role="status" aria-live="polite" aria-atomic="true">请先完成三项预测。</p></div>',
      '<div class="tp-controls" hidden><div class="tp-control-group"><label>过程预设</label><div class="tp-presets" data-presets></div></div>',
      '<div class="tp-control-group"><label for="' + prefix + '-v2">终体积 V₂：<output data-output="V2">2</output></label><input id="' + prefix + '-v2" data-input="V2" type="range" min="1.2" max="3.5" step="0.1" value="2">',
      '<span class="tp-note">归一化：nR=1，T₁=V₁=1，γ=<output data-output="gamma">1.667</output></span></div></div>',
      '<div class="tp-results" hidden><div data-metrics></div><div data-stage></div><div data-table></div><p class="tp-note">有限路径图和梯形积分是数值证据；状态函数公式、可逆熵公式和自由膨胀熵产生分别依赖理想气体、平衡/准静态或不可逆边界的假设。</p></div>'
    ].join("");
    rootNode.replaceChildren(shell);
    var lab = shell;
    var controls = lab.querySelector(".tp-controls");
    var results = lab.querySelector(".tp-results");
    var feedback = lab.querySelector(".tp-feedback");
    var vInput = lab.querySelector('[data-input="V2"]');
    var presetRow = lab.querySelector("[data-presets]");
    PRESETS.forEach(function (preset) {
      presetRow.appendChild(element(doc, "button", {
        type: "button",
        text: preset.label,
        "data-preset": preset.id,
        "aria-pressed": preset.id === activePreset ? "true" : "false"
      }));
    });

    function renderPrediction() {
      lab.querySelectorAll("button[data-question]").forEach(function (button) {
        var question = Number(button.getAttribute("data-question"));
        button.setAttribute("aria-pressed", answers[question] === button.getAttribute("data-answer") ? "true" : "false");
      });
    }

    function render() {
      var ledger = processLedger(state);
      var activePresetItem = PRESETS.filter(function (item) { return item.id === activePreset; })[0];
      var activePathId = activePresetItem ? activePresetItem.pathId : null;
      vInput.value = String(state.V2);
      lab.querySelector('[data-output="V2"]').textContent = formatNumber(state.V2, 1);
      lab.querySelector('[data-output="gamma"]').textContent = formatNumber(state.gamma, 3);
      lab.querySelectorAll("button[data-preset]").forEach(function (button) {
        button.setAttribute("aria-pressed", button.getAttribute("data-preset") === activePreset && state.pathId === activePathId ? "true" : "false");
      });
      controls.hidden = !revealed;
      results.hidden = !revealed;
      renderPrediction();
      if (!revealed) return;
      var metrics = lab.querySelector("[data-metrics]");
      metrics.className = "tp-metrics";
      metrics.innerHTML = [
        ["当前过程", ledger.label],
        ["类型", ledger.kind === "reversible" ? "可逆/平衡" : "不可逆/非平衡边界"],
        ["ΔW（系统功）", formatNumber(ledger.workOn, 6)],
        ["ΔQ", formatNumber(ledger.heat, 6)],
        ["ΔU（state）", formatNumber(ledger.deltaU, 6)],
        ["ΔS（state）", formatNumber(ledger.deltaS, 6)],
        ["熵产生", formatNumber(ledger.entropyGenerated, 6)],
        ["第一律残差", formatNumber(ledger.firstLawResidual, 8)]
      ].map(function (item) {
        return '<div class="tp-metric"><span>' + item[0] + '</span><strong>' + item[1] + '</strong></div>';
      }).join("");
      var stage = lab.querySelector("[data-stage]");
      stage.replaceChildren(plotSvg(doc, ledger, prefix));
      var table = lab.querySelector("[data-table]");
      table.replaceChildren();
      renderTable(doc, table, state.V2, state.gamma);
    }

    lab.addEventListener("click", function (event) {
      var choice = event.target.closest("button[data-question]");
      if (choice) {
        answers[Number(choice.getAttribute("data-question"))] = choice.getAttribute("data-answer");
        renderPrediction();
        return;
      }
      var presetButton = event.target.closest("button[data-preset]");
      if (presetButton) {
        var preset = PRESETS.filter(function (item) { return item.id === presetButton.getAttribute("data-preset"); })[0];
        if (!preset) return;
        activePreset = preset.id;
        state.pathId = preset.pathId;
        state.V2 = preset.V2;
        render();
        return;
      }
      var action = event.target.closest("button[data-action]");
      if (!action) return;
      if (action.getAttribute("data-action") === "reset") {
        answers = [null, null, null];
        revealed = false;
        activePreset = PRESETS[0].id;
        state = { pathId: PRESETS[0].pathId, V2: PRESETS[0].V2, gamma: DEFAULTS.gamma };
        feedback.className = "tp-feedback";
        feedback.textContent = "请先完成三项预测。";
        render();
        return;
      }
      if (answers.some(function (answer) { return answer === null; })) {
        feedback.className = "tp-feedback tp-warn";
        feedback.textContent = "还差 " + answers.filter(function (answer) { return answer === null; }).length + " 项预测。";
        announce(api, rootNode, feedback.textContent);
        return;
      }
      var expected = ["state", "isothermal", "entropy"];
      var score = answers.reduce(function (sum, answer, index) { return sum + (answer === expected[index] ? 1 : 0); }, 0);
      revealed = true;
      feedback.className = "tp-feedback " + (score === 3 ? "tp-pass" : "tp-warn");
      feedback.textContent = "预测命中 " + score + "/3；现在逐行核对状态量、过程量与不可逆边界。";
      render();
      announce(api, rootNode, feedback.textContent);
    });
    vInput.addEventListener("input", function () {
      state.V2 = clamp(Number(vInput.value), LIMITS.V2[0], LIMITS.V2[1]);
      activePreset = "custom";
      render();
    });
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      assert(condition, message);
    }
    var iso = processLedger({ pathId: "isothermal", V2: 2 });
    check(near(iso.workOn, -Math.log(2), 1e-12), "isothermal work sign");
    check(near(iso.heat, Math.log(2), 1e-12) && near(iso.deltaU, 0, 1e-12), "isothermal first law");
    check(near(iso.deltaS, Math.log(2), 1e-12) && near(iso.entropyGenerated, 0, 1e-12), "reversible entropy");
    var twoleg = processLedger({ pathId: "twoleg", V2: 2 });
    check(near(twoleg.workOn, -0.5, 1e-12) && near(twoleg.heat, 0.5, 1e-12), "two-leg path work");
    check(near(twoleg.deltaU, iso.deltaU, 1e-12) && near(twoleg.deltaS, iso.deltaS, 1e-12), "state functions share endpoints");
    var twolegCorner = pathPoint({ pathId: "twoleg", V2: 2 }, 0.5);
    check(near(twolegCorner.T, 0.5, 1e-12) && near(twolegCorner.p * twolegCorner.V, twolegCorner.T, 1e-12), "two-leg equilibrium corner");
    var linear = processLedger({ pathId: "linear", V2: 2 });
    check(near(linear.workOn, -0.75, 1e-12), "linear path work");
    var free = processLedger({ pathId: "free", V2: 2 });
    check(near(free.workOn, 0, 1e-12) && near(free.heat, 0, 1e-12) && near(free.deltaU, 0, 1e-12), "free expansion first law");
    check(near(free.deltaS, Math.log(2), 1e-12) && near(free.entropyGenerated, Math.log(2), 1e-12), "free expansion entropy");
    check(free.profileWorkValid === false && free.profileWorkOn === null, "free boundary not integrated");
    var adiabatic = processLedger({ pathId: "adiabatic", V2: 2 });
    check(near(adiabatic.heat, 0, 1e-12) && near(adiabatic.deltaS, 0, 1e-12), "reversible adiabatic");
    check(near(adiabatic.workOn, adiabatic.deltaU, 1e-12), "adiabatic first law");
    var profile = pathProfile({ pathId: "isothermal", V2: 2 }, 100);
    check(profile.every(function (point) { return point.equilibrium && point.p > 0 && point.V >= 1 && point.V <= 2; }), "physical equilibrium profile");
    check(near(integratedWorkOn(profile).value, iso.workOn, 2e-5), "profile integration");
    check(near(idealGasState(2, 1, 1).p, 0.5, 1e-12), "ideal gas state");
    check(Object.keys(PATHS).length === 5 && PRESETS.length === 5, "teaching paths");
    return { checks: checks, paths: Object.keys(PATHS).length };
  }

  return {
    DEFAULTS: DEFAULTS,
    PATHS: PATHS,
    PRESETS: PRESETS,
    idealGasState: idealGasState,
    endpointState: endpointState,
    pathPoint: pathPoint,
    pathProfile: pathProfile,
    workOnFormula: workOnFormula,
    integratedWorkOn: integratedWorkOn,
    entropyChange: entropyChange,
    processLedger: processLedger,
    mount: mount,
    selfTest: selfTest
  };
});
