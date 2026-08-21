(function (root, factory) {
  "use strict";

  var exported = factory();
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("stellar-structure", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module && process.argv.indexOf("--self-test") !== -1) {
    try {
      var report = exported.selfTest();
      console.log("stellar-structure self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("stellar-structure self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "stellar-structure-lab-styles";
  var INSTANCE = 0;
  var EPSILON = 1e-10;

  var ASSUMPTIONS = {
    gravity: "Newtonian gravity",
    geometry: "static, spherically symmetric hydrostatic equilibrium",
    eos: "barotropic polytropic EOS P=Kρ^(1+1/n), with fixed n and K",
    opacity: "opacity is not specified in this toy",
    transport: "radiative/convective energy transport is not integrated",
    energy: "nuclear energy generation, luminosity, rotation, magnetic fields, and mass loss are omitted",
    boundary: "regular center m(0)=0, θ(0)=1, θ′(0)=0; first zero θ(ξ₁)=0 defines a zero-pressure surface"
  };

  var PRESETS = [
    { id: "n15-gas", label: "n=1.5 · 气体型", n: 1.5, rhoC: 1, K: 1, G: 1, step: 0.01, maxXi: 10, expected: "closes" },
    { id: "n3-radiative", label: "n=3 · 结构型", n: 3, rhoC: 1, K: 1, G: 1, step: 0.01, maxXi: 10, expected: "closes" },
    { id: "n15-dense", label: "n=1.5 · ρc=4", n: 1.5, rhoC: 4, K: 1, G: 1, step: 0.01, maxXi: 10, expected: "closes" }
  ];

  var STYLE_TEXT = [
    ".ss-lab{--ss-blue:var(--cl-blue,#315f9d);--ss-green:var(--cl-green,#39734d);--ss-gold:var(--cl-gold,#9b6a12);--ss-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg,#292722);line-height:1.55;overflow-wrap:anywhere}",
    ".ss-lab *,.ss-lab *::before,.ss-lab *::after{box-sizing:border-box}.ss-lab [hidden]{display:none!important}.ss-lab h3,.ss-lab h4{margin:0;letter-spacing:0;color:var(--fg,#292722)}.ss-lab h3{font-size:1.12rem}.ss-lab h4{font-size:1rem}.ss-lab p{margin:8px 0}.ss-lab .ss-note,.ss-lab .ss-feedback{color:var(--fg-soft,var(--muted,#6b6557));font-size:13px;line-height:1.65}",
    ".ss-lab button{font:inherit;min-width:0;min-height:44px;padding:8px 10px;border:1px solid var(--border,#d7d0c2);border-radius:6px;background:var(--bg,#fff);color:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.ss-lab button:hover{border-color:var(--ss-blue)}.ss-lab button:focus-visible,.ss-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.ss-lab button[aria-pressed=true],.ss-lab .ss-primary{border-color:var(--ss-blue);background:var(--ss-blue);color:var(--bg,#fff);font-weight:750}.ss-lab .ss-presets{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:10px 0 14px}.ss-lab .ss-presets button{font-size:12px}.ss-lab .ss-control{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8px;margin:10px 0;padding:9px 11px;border:1px solid var(--border,#d7d0c2);background:var(--block-bg,var(--bg,#fff))}.ss-lab .ss-control label{font-size:12.5px;font-weight:700}.ss-lab .ss-control output{color:var(--ss-blue);font-variant-numeric:tabular-nums}.ss-lab input[type=range]{grid-column:1/-1;width:100%;height:44px;margin:0;accent-color:var(--ss-blue)}",
    ".ss-lab .ss-predict{margin-top:12px;padding:12px;border:1px solid var(--border,#d7d0c2);background:var(--block-bg,var(--bg,#fff))}.ss-lab .ss-predict legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}.ss-lab .ss-choice-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.ss-lab .ss-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px}.ss-lab .ss-actions>*{flex:1 1 160px}.ss-lab .ss-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.ss-lab .ss-pass{color:var(--ss-green)}.ss-lab .ss-warn{color:var(--ss-red)}",
    ".ss-lab .ss-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border,#d7d0c2)}.ss-lab .ss-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:11px 0}.ss-lab .ss-metric{min-width:0;padding:8px;border-top:2px solid var(--border,#d7d0c2);background:var(--block-bg,var(--bg,#fff))}.ss-lab .ss-metric:nth-child(4n+1){border-color:var(--ss-blue)}.ss-lab .ss-metric:nth-child(4n+2){border-color:var(--ss-green)}.ss-lab .ss-metric:nth-child(4n+3){border-color:var(--ss-gold)}.ss-lab .ss-metric:nth-child(4n){border-color:var(--ss-red)}.ss-lab .ss-metric span{display:block;color:var(--fg-soft,var(--muted,#6b6557));font-size:11px;line-height:1.4}.ss-lab .ss-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".ss-lab .ss-visual{min-width:0;padding:7px;border:1px solid var(--border,#d7d0c2);border-radius:6px;background:var(--bg,#fff);overflow:hidden}.ss-lab svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg,#292722)}.ss-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.ss-lab .ss-grid{stroke:currentColor;stroke-opacity:.14;stroke-width:1}.ss-lab .ss-axis{stroke:currentColor;stroke-opacity:.55;stroke-width:1.2}.ss-lab .ss-pressure{fill:none;stroke:var(--ss-blue);stroke-width:2.6}.ss-lab .ss-density{fill:none;stroke:var(--ss-gold);stroke-width:2.4;stroke-dasharray:6 4}.ss-lab .ss-mass{fill:none;stroke:var(--ss-green);stroke-width:2.6}.ss-lab .ss-zero{stroke:var(--ss-red);stroke-width:1.5;stroke-dasharray:5 4}.ss-lab .ss-panel-title{font-size:13px;font-weight:750}.ss-lab .ss-small{font-size:11px;fill:var(--fg-soft,var(--muted,#6b6557))}",
    ".ss-lab .ss-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:13px}.ss-lab table{width:100%;min-width:760px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.ss-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft,var(--muted,#6b6557));font-size:12px}.ss-lab th,.ss-lab td{padding:7px 8px;border-bottom:1px solid var(--border,#d7d0c2);text-align:left;vertical-align:top}.ss-lab th{color:var(--fg-soft,var(--muted,#6b6557));font-size:11.5px}.ss-lab .ss-check{margin-top:11px;padding:8px 10px;border-left:3px solid var(--ss-green);background:var(--block-bg,var(--bg,#fff));font-size:12.5px}.ss-lab .ss-check.ss-fail{border-color:var(--ss-red)}",
    "@media(max-width:760px){.ss-lab .ss-presets{grid-template-columns:minmax(0,1fr)}.ss-lab .ss-summary{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:480px){.ss-lab .ss-summary,.ss-lab .ss-choice-row{grid-template-columns:minmax(0,1fr)}.ss-lab .ss-visual{padding:4px}.ss-lab th,.ss-lab td{padding-left:5px;padding-right:5px}}@media(prefers-reduced-motion:reduce){.ss-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function fail(message) {
    throw new Error("stellar-structure: " + message);
  }

  function finite(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function positive(value, label) {
    var number = Number(value);
    if (!finite(number) || number <= 0) fail(label + " must be positive and finite");
    return number;
  }

  function sourceTerm(theta, n) {
    return theta > 0 ? Math.pow(theta, n) : 0;
  }

  function rhs(xi, state, n) {
    return [state[1], -2 * state[1] / xi - sourceTerm(state[0], n)];
  }

  function rk4Step(xi, state, step, n) {
    var k1 = rhs(xi, state, n);
    var mid1 = [state[0] + step * k1[0] / 2, state[1] + step * k1[1] / 2];
    var k2 = rhs(xi + step / 2, mid1, n);
    var mid2 = [state[0] + step * k2[0] / 2, state[1] + step * k2[1] / 2];
    var k3 = rhs(xi + step / 2, mid2, n);
    var end = [state[0] + step * k3[0], state[1] + step * k3[1]];
    var k4 = rhs(xi + step, end, n);
    return [
      state[0] + step * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) / 6,
      state[1] + step * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) / 6
    ];
  }

  function dimensionlessRow(xi, theta, phi, pressureIntegral, n) {
    var positiveTheta = Math.max(0, theta);
    return {
      xi: xi,
      theta: positiveTheta,
      phi: phi,
      densityRatio: Math.pow(positiveTheta, n),
      pressureRatio: Math.pow(positiveTheta, n + 1),
      massDimensionless: -xi * xi * phi,
      pressureIntegralDimensionless: pressureIntegral
    };
  }

  function solveLaneEmden(nInput, options) {
    var config = options || {};
    var n = Number(nInput);
    if (!finite(n) || n <= 0 || n >= 5) fail("Lane-Emden toy requires 0 < n < 5");
    var step = config.step === undefined ? 0.01 : positive(config.step, "step");
    var maxXi = config.maxXi === undefined ? 12 : positive(config.maxXi, "maxXi");
    var rhoC = config.rhoC === undefined ? 1 : positive(config.rhoC, "rhoC");
    var K = config.K === undefined ? 1 : positive(config.K, "K");
    var G = config.G === undefined ? 1 : positive(config.G, "G");
    var epsilon = Math.min(step / 10, 1e-4);
    var theta = 1 - epsilon * epsilon / 6 + n * Math.pow(epsilon, 4) / 120;
    var phi = -epsilon / 3 + n * Math.pow(epsilon, 3) / 30;
    var xi = epsilon;
    var integral = 0;
    var rows = [dimensionlessRow(0, 1, 0, 0, n)];
    var previous = dimensionlessRow(xi, theta, phi, integral, n);
    rows.push(previous);
    var surface = null;
    while (xi < maxXi && !surface) {
      var nextXi = xi + step;
      var nextState = rk4Step(xi, [theta, phi], step, n);
      var nextTheta = nextState[0];
      var previousIntegrand = xi * xi * Math.pow(Math.max(0, theta), n + 1);
      var nextIntegrand = nextXi * nextXi * Math.pow(Math.max(0, nextTheta), n + 1);
      if (nextTheta <= 0) {
        var fraction = theta / (theta - nextTheta);
        var surfaceXi = xi + fraction * step;
        var surfacePhi = phi + fraction * (nextState[1] - phi);
        integral += 0.5 * (previousIntegrand + 0) * (surfaceXi - xi);
        surface = dimensionlessRow(surfaceXi, 0, surfacePhi, integral, n);
        rows.push(surface);
        break;
      }
      integral += 0.5 * (previousIntegrand + nextIntegrand) * step;
      xi = nextXi;
      theta = nextTheta;
      phi = nextState[1];
      previous = dimensionlessRow(xi, theta, phi, integral, n);
      rows.push(previous);
    }
    if (!surface) fail("maxXi ended before the first Lane-Emden zero");
    var xi1 = surface.xi;
    var mu1 = surface.massDimensionless;
    var scale = Math.sqrt((n + 1) * K * Math.pow(rhoC, 1 / n - 1) / (4 * Math.PI * G));
    var centralPressure = K * Math.pow(rhoC, 1 + 1 / n);
    var radius = scale * xi1;
    var mass = 4 * Math.PI * Math.pow(scale, 3) * rhoC * mu1;
    var pressureIntegral = 4 * Math.PI * Math.pow(scale, 3) * centralPressure * surface.pressureIntegralDimensionless;
    var gravitationalEnergy = -3 * G * mass * mass / ((5 - n) * radius);
    var virialPressureTerm = 3 * pressureIntegral;
    var virialResidual = virialPressureTerm + gravitationalEnergy;
    var internalProxy = n * pressureIntegral;
    var totalEnergyProxy = internalProxy + gravitationalEnergy;
    var physicalRows = rows.map(function (row) {
      return {
        xi: row.xi,
        radius: scale * row.xi,
        theta: row.theta,
        density: rhoC * row.densityRatio,
        pressure: centralPressure * row.pressureRatio,
        enclosedMass: 4 * Math.PI * Math.pow(scale, 3) * rhoC * row.massDimensionless,
        densityRatio: row.densityRatio,
        pressureRatio: row.pressureRatio,
        massFraction: row.massDimensionless / mu1
      };
    });
    return {
      n: n,
      rhoC: rhoC,
      K: K,
      G: G,
      step: step,
      boundaryReached: true,
      boundaryConditions: { center: "m(0)=0, θ(0)=1, θ′(0)=0", surface: "θ(ξ₁)=0 ⇒ P(R)=0" },
      rows: physicalRows,
      dimensionlessRows: rows,
      surface: { xi: xi1, massDimensionless: mu1, pressure: 0, density: 0 },
      scale: scale,
      centralPressure: centralPressure,
      radius: radius,
      mass: mass,
      pressureIntegral: pressureIntegral,
      virialPressureTerm: virialPressureTerm,
      gravitationalEnergy: gravitationalEnergy,
      virialResidual: virialResidual,
      virialRelativeResidual: Math.abs(virialResidual) / Math.max(Math.abs(gravitationalEnergy), EPSILON),
      internalProxy: internalProxy,
      totalEnergyProxy: totalEnergyProxy,
      assumptions: ASSUMPTIONS
    };
  }

  function presetById(id) {
    for (var index = 0; index < PRESETS.length; index += 1) if (PRESETS[index].id === id) return PRESETS[index];
    fail("unknown preset " + id);
  }

  function analyze(id, overrides) {
    var preset = presetById(id);
    var config = overrides || {};
    var model = solveLaneEmden(preset.n, {
      rhoC: config.rhoC === undefined ? preset.rhoC : config.rhoC,
      K: preset.K,
      G: preset.G,
      step: preset.step,
      maxXi: preset.maxXi
    });
    model.preset = preset;
    model.expected = preset.expected;
    return model;
  }

  function fixed(value, digits) {
    if (!finite(value)) return "—";
    if (Math.abs(value) < 5e-10) return "0";
    return Number(value).toFixed(digits === undefined ? 4 : digits);
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      if (!condition) fail("self-test failed: " + message);
    }
    var gas = analyze("n15-gas");
    var structure = analyze("n3-radiative");
    check(gas.boundaryReached && structure.boundaryReached, "both presets reach a first zero");
    check(gas.rows[0].enclosedMass === 0 && gas.rows[0].pressure > 0, "center boundary ledger");
    check(gas.surface.pressure === 0 && gas.surface.density === 0, "surface pressure boundary");
    check(gas.mass > 0 && gas.radius > 0 && gas.centralPressure > 0, "positive mass radius pressure");
    check(gas.rows.every(function (row, index, rows) { return index === 0 || row.enclosedMass >= rows[index - 1].enclosedMass - 1e-9; }), "enclosed mass is monotone");
    check(gas.virialRelativeResidual < 0.002, "n=1.5 virial closure");
    check(structure.virialRelativeResidual < 0.002, "n=3 virial closure");
    check(Math.abs(gas.surface.xi - 3.65375) < 0.01, "n=1.5 Lane-Emden zero");
    check(Math.abs(structure.surface.xi - 6.89685) < 0.02, "n=3 Lane-Emden zero");
    var dense = analyze("n15-dense");
    check(Math.abs(dense.surface.xi - gas.surface.xi) < 1e-10, "central density does not change dimensionless shape");
    check(dense.radius < gas.radius && dense.mass > gas.mass, "central density changes dimensional scale");
    PRESETS.forEach(function (preset) { check(analyze(preset.id).preset.id === preset.id, preset.id + " is analyzable"); });
    return { ok: true, checks: checks, presets: PRESETS.length };
  }

  function setAttributes(node, attributes) {
    Object.keys(attributes || {}).forEach(function (key) {
      var value = attributes[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
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

  function element(doc, tag, attributes, children) {
    return appendChildren(setAttributes(doc.createElement(tag), attributes), children, doc);
  }

  function svgElement(doc, tag, attributes, children) {
    return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attributes), children, doc);
  }

  function installStyles(doc) {
    if (doc.getElementById && doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }

  function metric(doc, label, value) {
    return element(doc, "div", { className: "ss-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]);
  }

  function path(points, x, y) {
    return points.map(function (point, index) { return (index ? "L" : "M") + x(point) + " " + y(point); }).join(" ");
  }

  function profileSvg(doc, model, serial) {
    var svg = svgElement(doc, "svg", { viewBox: "0 0 720 300", role: "img", "aria-label": "Lane-Emden 压力密度与包络质量剖面" });
    svg.appendChild(svgElement(doc, "title", {}, "无量纲压力、密度与包络质量随半径的剖面"));
    svg.appendChild(svgElement(doc, "line", { x1: 360, y1: 18, x2: 360, y2: 282, className: "ss-axis" }));
    svg.appendChild(svgElement(doc, "text", { x: 180, y: 25, "text-anchor": "middle", className: "ss-panel-title" }, "结构剖面：中心到 P(R)=0"));
    svg.appendChild(svgElement(doc, "text", { x: 540, y: 25, "text-anchor": "middle", className: "ss-panel-title" }, "质量账：m(r)/M"));
    var rows = model.rows;
    var maxXi = model.surface.xi;
    var xLeft = function (row) { return 45 + row.xi / maxXi * 270; };
    var yRatio = function (value) { return 238 - Math.max(0, Math.min(1, value)) * 185; };
    [0, 0.5, 1].forEach(function (level) {
      var y = yRatio(level);
      svg.appendChild(svgElement(doc, "line", { x1: 45, y1: y, x2: 315, y2: y, className: "ss-grid" }));
      svg.appendChild(svgElement(doc, "text", { x: 38, y: y + 4, "text-anchor": "end", className: "ss-small" }, String(level)));
    });
    svg.appendChild(svgElement(doc, "line", { x1: 45, y1: 238, x2: 315, y2: 238, className: "ss-axis" }));
    svg.appendChild(svgElement(doc, "path", { d: path(rows, xLeft, function (row) { return yRatio(row.pressureRatio); }), className: "ss-pressure" }));
    svg.appendChild(svgElement(doc, "path", { d: path(rows, xLeft, function (row) { return yRatio(row.densityRatio); }), className: "ss-density" }));
    svg.appendChild(svgElement(doc, "line", { x1: xLeft(rows[rows.length - 1]), y1: 45, x2: xLeft(rows[rows.length - 1]), y2: 250, className: "ss-zero" }));
    svg.appendChild(svgElement(doc, "text", { x: 180, y: 270, "text-anchor": "middle", className: "ss-small" }, "r/R"));
    svg.appendChild(svgElement(doc, "text", { x: 52, y: 47, className: "ss-small" }, "蓝 P/Pc · 金 ρ/ρc"));
    var xRight = function (row) { return 405 + row.xi / maxXi * 270; };
    var yMass = function (value) { return 238 - Math.max(0, Math.min(1, value)) * 185; };
    [0, 0.5, 1].forEach(function (level) {
      var y2 = yMass(level);
      svg.appendChild(svgElement(doc, "line", { x1: 405, y1: y2, x2: 675, y2: y2, className: "ss-grid" }));
      svg.appendChild(svgElement(doc, "text", { x: 398, y: y2 + 4, "text-anchor": "end", className: "ss-small" }, String(level)));
    });
    svg.appendChild(svgElement(doc, "line", { x1: 405, y1: 238, x2: 675, y2: 238, className: "ss-axis" }));
    svg.appendChild(svgElement(doc, "path", { d: path(rows, xRight, function (row) { return yMass(row.massFraction); }), className: "ss-mass" }));
    svg.appendChild(svgElement(doc, "text", { x: 540, y: 270, "text-anchor": "middle", className: "ss-small" }, "r/R"));
    svg.appendChild(svgElement(doc, "text", { x: 412, y: 47, className: "ss-small" }, "绿 m(r)/M"));
    return svg;
  }

  function ledgerTable(doc, model) {
    var rows = [
      ["多方指数 n", fixed(model.n, 2), "EOS 指定的 toy 参数"],
      ["第一零点 ξ₁", fixed(model.surface.xi, 5), "θ(ξ₁)=0 的表面边界"],
      ["尺度 a", fixed(model.scale, 5), "r=aξ；由 K,ρc,G 决定"],
      ["半径 R=aξ₁", fixed(model.radius, 5), "模型表面半径"],
      ["中心密度 ρc", fixed(model.rhoC, 4), "输入尺度"],
      ["中心压力 Pc", fixed(model.centralPressure, 5), "P=Kρ^(1+1/n)"],
      ["总质量 M", fixed(model.mass, 5), "m(R)"],
      ["表面压力 P(R)", fixed(0, 4), "零外压边界"],
      ["3∫P dV", fixed(model.virialPressureTerm, 5), "维里定理左侧的压力项"],
      ["−Ω", fixed(-model.gravitationalEnergy, 5), "Ω=−3GM²/((5−n)R)"],
      ["3∫P dV+Ω", fixed(model.virialResidual, 7), "数值维里残差"],
      ["内部能量 proxy U", fixed(model.internalProxy, 5), "n∫P dV；仅随 EOS 的记账量"]
    ];
    var table = element(doc, "table");
    table.appendChild(element(doc, "caption", { text: "质量—半径—压力—维里账本（K=G=1 的示范尺度）" }));
    var head = element(doc, "tr");
    ["量", "数值", "意义 / 边界"].forEach(function (label) { head.appendChild(element(doc, "th", { scope: "col", text: label })); });
    table.appendChild(element(doc, "thead", {}, head));
    var body = element(doc, "tbody");
    rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, row.map(function (value, index) { return element(doc, "td", { className: index === 1 ? "" : undefined, text: String(value) }); }))); });
    table.appendChild(body);
    return table;
  }

  function mount(rootNode, api) {
    var doc = rootNode.ownerDocument || (typeof document !== "undefined" ? document : null);
    if (!doc) return;
    installStyles(doc);
    rootNode.classList.add("ss-lab");
    INSTANCE += 1;
    var serial = INSTANCE;
    var state = { presetId: PRESETS[0].id, rhoC: PRESETS[0].rhoC, prediction: null, revealed: false };
    var announce = function (message) { if (api && typeof api.announce === "function") api.announce(rootNode, message); };

    function render() {
      var focusedId = doc.activeElement && doc.activeElement.id;
      var model = analyze(state.presetId, { rhoC: state.rhoC });
      var preset = model.preset;
      var shell = element(doc, "div", { className: "ss-shell" });
      shell.appendChild(element(doc, "h3", { text: "Lane–Emden toy：质量、半径与维里账本" }));
      shell.appendChild(element(doc, "p", { className: "ss-note", text: "这是透明的 Newtonian 球对称静力模型：先积分 θ，再把无量纲剖面换算成 M、R、P 与 virial ledger。它没有 opacity、transport 或 luminosity 方程。" }));
      var presets = element(doc, "div", { className: "ss-presets", role: "group", "aria-label": "选择多方模型" });
      PRESETS.forEach(function (item) {
        var button = element(doc, "button", { type: "button", "aria-pressed": item.id === state.presetId ? "true" : "false", "aria-label": "载入" + item.label }, item.label);
        button.addEventListener("click", function () {
          state.presetId = item.id;
          state.rhoC = item.rhoC;
          state.prediction = null;
          state.revealed = false;
          render();
          announce("已载入" + item.label + "；请先预测维里账本是否闭合。");
        });
        presets.appendChild(button);
      });
      shell.appendChild(presets);
      var control = element(doc, "div", { className: "ss-control" });
      control.appendChild(element(doc, "label", { for: "ss-rho-" + serial, text: "中心密度 ρc" }));
      control.appendChild(element(doc, "output", { for: "ss-rho-" + serial, text: fixed(model.rhoC, 1) }));
      var input = element(doc, "input", { id: "ss-rho-" + serial, type: "range", min: "0.5", max: "4", step: "0.5", value: String(model.rhoC), "aria-label": "调整中心密度" });
      input.addEventListener("input", function () {
        state.rhoC = Number(input.value);
        state.prediction = null;
        state.revealed = false;
        render();
      });
      control.appendChild(input);
      shell.appendChild(control);
      var predict = element(doc, "fieldset", { className: "ss-predict" });
      predict.appendChild(element(doc, "legend", { text: "边界条件 P(R)=0 且静力平衡时，哪本账应闭合？" }));
      var choices = element(doc, "div", { className: "ss-choice-row", role: "group", "aria-label": "维里预测选项" });
      [["closes", "3∫P dV + Ω ≈ 0"], ["does-not-close", "中心压力 + Ω ≈ 0"]].forEach(function (option) {
        var button = element(doc, "button", { type: "button", "aria-pressed": state.prediction === option[0] ? "true" : "false" }, option[1]);
        button.addEventListener("click", function () { state.prediction = option[0]; render(); });
        choices.appendChild(button);
      });
      predict.appendChild(choices);
      var actions = element(doc, "div", { className: "ss-actions" });
      var reveal = element(doc, "button", { type: "button", className: "ss-primary", text: "核对预测" });
      reveal.addEventListener("click", function () {
        if (!state.prediction) { announce("请先选择一个预测。"); return; }
        state.revealed = true;
        render();
        announce("预测已核对；现在可以阅读结构与维里账本。");
      });
      var reset = element(doc, "button", { type: "button", text: "重置实验" });
      reset.addEventListener("click", function () {
        state = { presetId: PRESETS[0].id, rhoC: PRESETS[0].rhoC, prediction: null, revealed: false };
        render();
        announce("恒星结构实验已重置。");
      });
      actions.appendChild(reveal);
      actions.appendChild(reset);
      predict.appendChild(actions);
      predict.appendChild(element(doc, "p", { className: "ss-feedback " + (state.revealed ? (state.prediction === preset.expected ? "ss-pass" : "ss-warn") : ""), "aria-live": "polite", text: state.revealed ? (state.prediction === preset.expected ? "预测命中。" : "预测未命中；请看压力项、引力能和残差三行。") : state.prediction ? "预测已记录；点击“核对预测”。" : "尚未作出预测。" }));
      shell.appendChild(predict);
      if (state.revealed) {
        var results = element(doc, "section", { className: "ss-results", "aria-live": "polite" });
        results.appendChild(element(doc, "h4", { text: "剖面可视化与结构账本" }));
        results.appendChild(element(doc, "div", { className: "ss-visual" }, profileSvg(doc, model, serial)));
        var summary = element(doc, "div", { className: "ss-summary" });
        summary.appendChild(metric(doc, "n", fixed(model.n, 2)));
        summary.appendChild(metric(doc, "ξ₁", fixed(model.surface.xi, 4)));
        summary.appendChild(metric(doc, "R", fixed(model.radius, 4)));
        summary.appendChild(metric(doc, "M", fixed(model.mass, 4)));
        results.appendChild(summary);
        results.appendChild(element(doc, "div", { className: "ss-table-wrap" }, ledgerTable(doc, model)));
        results.appendChild(element(doc, "p", { className: "ss-check", text: "边界条件：中心 m(0)=0 且 θ′(0)=0；表面取第一零点 θ(ξ₁)=0，因此 P(R)=0。维里闭合只是在这个 toy 的静力与边界假设下成立。" }));
        results.appendChild(element(doc, "p", { className: "ss-check ss-fail", text: "范围声明：这里没有 opacity、能量输运、核反应或 luminosity；图上的 M–R 曲线不是普遍恒星演化关系，也不能生成主序质光律。" }));
        shell.appendChild(results);
      }
      rootNode.replaceChildren(shell);
      if (focusedId) {
        var replacement = doc.getElementById(focusedId);
        if (replacement && typeof replacement.focus === "function") replacement.focus();
      }
    }
    render();
  }

  return {
    ASSUMPTIONS: ASSUMPTIONS,
    PRESETS: PRESETS,
    solveLaneEmden: solveLaneEmden,
    analyze: analyze,
    selfTest: selfTest,
    mount: mount
  };
});
