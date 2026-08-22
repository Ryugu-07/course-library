(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("accretion-eddington", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("accretion-eddington self-test: PASS (" + report.checks + " checks, " + report.efficiencies + " efficiency modes)");
    } catch (error) {
      console.error("accretion-eddington self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function (host) {
  "use strict";

  var G = 6.67430e-11;
  var C = 299792458;
  var M_P = 1.67262192369e-27;
  var SIGMA_T = 6.6524587321e-29;
  var SIGMA_SB = 5.670374419e-8;
  var M_SUN = 1.98847e30;
  var YEAR = 365.25 * 24 * 3600;
  var PI = Math.PI;
  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "accretion-eddington-lab-styles";
  var INSTANCE = 0;
  var EPS = 1e-12;

  var EFFICIENCIES = [
    { id: "surface", label: "Newtonian 表面估计", note: "η_N=GM/(Rc²)，输入 R/r_g；只适合表面势能量级。" },
    { id: "schwarzschild", label: "Schwarzschild ISCO", eta: 1 - Math.sqrt(8 / 9), note: "GR 中 ISCO 绑定能：η=1−E_ISCO≈0.057。" },
    { id: "extreme", label: "极端 Kerr（理想）", eta: 1 - 1 / Math.sqrt(3), note: "理想 prograde test-particle 极限，η≈0.423。" },
    { id: "thorne", label: "Thorne 辐射俘获上限", eta: 0.30, note: "考虑辐射俘获、自旋约 a≈0.998 的量级，η≈0.30。" }
  ];

  var STYLE_TEXT = [
    ".ae-lab{--ae-blue:var(--cl-blue,#315f9d);--ae-green:var(--cl-green,#39734d);--ae-gold:var(--cl-gold,#9b6a12);--ae-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere}",
    ".ae-lab *,.ae-lab *::before,.ae-lab *::after{box-sizing:border-box}.ae-lab [hidden]{display:none!important}.ae-lab h3,.ae-lab h4{margin:0;color:var(--fg);letter-spacing:0}.ae-lab h3{font-size:1.16rem}.ae-lab h4{margin-top:16px;font-size:1rem}.ae-lab p{margin:8px 0}.ae-lab .ae-note,.ae-lab .ae-feedback{color:var(--fg-soft);font-size:13px;line-height:1.65}.ae-lab button,.ae-lab select,.ae-lab input{font:inherit;letter-spacing:0}.ae-lab button,.ae-lab select{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.ae-lab button:hover{border-color:var(--accent)}.ae-lab button:focus-visible,.ae-lab select:focus-visible,.ae-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.ae-lab button[aria-pressed=true],.ae-lab button.ae-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}.ae-lab button:disabled{opacity:.55;cursor:not-allowed}",
    ".ae-lab .ae-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:12px 0}.ae-lab .ae-control{display:grid;gap:5px;min-width:0}.ae-lab .ae-control label{color:var(--fg-soft);font-size:12.5px;font-weight:700}.ae-lab .ae-control output{color:var(--accent);font-variant-numeric:tabular-nums}.ae-lab .ae-control select{width:100%}.ae-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent)}",
    ".ae-lab fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border)}.ae-lab legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}.ae-lab .ae-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.ae-lab .ae-options button{font-size:12px}.ae-lab .ae-prediction{margin:14px 0;padding:12px 14px;border-left:3px solid var(--ae-gold);background:var(--block-bg,var(--bg))}.ae-lab .ae-prediction-title{display:block;margin-bottom:7px;font-size:13px}.ae-lab .ae-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px}.ae-lab .ae-actions>*{flex:1 1 170px}.ae-lab .ae-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.ae-lab .ae-pass{color:var(--ae-green)}.ae-lab .ae-warn{color:var(--ae-red)}",
    ".ae-lab .ae-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.ae-lab .ae-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:8px;margin:0 0 12px}.ae-lab .ae-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.ae-lab .ae-metric:nth-child(4n+1){border-color:var(--ae-blue)}.ae-lab .ae-metric:nth-child(4n+2){border-color:var(--ae-green)}.ae-lab .ae-metric:nth-child(4n+3){border-color:var(--ae-gold)}.ae-lab .ae-metric:nth-child(4n){border-color:var(--ae-red)}.ae-lab .ae-metric span{display:block;color:var(--fg-soft);font-size:11.5px}.ae-lab .ae-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.ae-lab .ae-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden}.ae-lab .ae-svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg)}.ae-lab .ae-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.ae-lab .ae-svg .ae-grid{stroke:currentColor;stroke-opacity:.17;stroke-width:1}.ae-lab .ae-svg .ae-axis{stroke:currentColor;stroke-opacity:.55;stroke-width:1.1}.ae-lab .ae-svg .ae-temp{fill:none;stroke:var(--ae-blue);stroke-width:3}.ae-lab .ae-svg .ae-asymptote{fill:none;stroke:var(--ae-gold);stroke-width:2;stroke-dasharray:6 4}.ae-lab .ae-svg .ae-bar-dyn{fill:var(--ae-green)}.ae-lab .ae-svg .ae-bar-visc{fill:var(--ae-red)}.ae-lab .ae-svg .ae-title{font-size:13px;font-weight:750}.ae-lab .ae-svg .ae-small{font-size:10.5px;fill:var(--fg-soft)!important}.ae-lab .ae-svg .ae-value{font-size:12px;font-weight:750}",
    ".ae-lab .ae-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:12px}.ae-lab table{width:100%;min-width:930px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.ae-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft);font-size:12px}.ae-lab th,.ae-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}.ae-lab th{color:var(--fg-soft);font-size:11.5px}.ae-lab .ae-certificate{margin-top:11px;padding:10px 12px;border-left:3px solid var(--ae-green);background:var(--block-bg,var(--bg));font-size:13px;line-height:1.65}.ae-lab .ae-certificate.ae-blocked{border-color:var(--ae-red)}",
    "@media(max-width:900px){.ae-lab .ae-controls{grid-template-columns:repeat(2,minmax(0,1fr))}.ae-lab .ae-options{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.ae-lab .ae-controls{grid-template-columns:minmax(0,1fr)}.ae-lab .ae-options{grid-template-columns:minmax(0,1fr)}.ae-lab .ae-prediction{padding:10px}.ae-lab .ae-frame{padding:4px}}@media(prefers-reduced-motion:reduce){.ae-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function finite(value) { return typeof value === "number" && Number.isFinite(value); }
  function near(left, right, tolerance) { return Math.abs(left - right) <= (tolerance || 1e-8) * Math.max(1, Math.abs(left), Math.abs(right)); }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function efficiencyMode(id) { for (var index = 0; index < EFFICIENCIES.length; index += 1) if (EFFICIENCIES[index].id === id) return EFFICIENCIES[index]; return EFFICIENCIES[1]; }

  function eddingtonLuminosity(massSolar) {
    var mass = Math.max(0, Number(massSolar)) * M_SUN;
    return 4 * PI * G * mass * M_P * C / SIGMA_T;
  }

  function efficiency(id, surfaceRadiusRg) {
    var mode = efficiencyMode(id);
    if (mode.id === "surface") return 1 / Math.max(2, Number(surfaceRadiusRg) || 100);
    return mode.eta;
  }

  function massRateFromLuminosity(luminosity, eta) {
    return Number(luminosity) / (Math.max(EPS, Number(eta)) * C * C);
  }

  function massRateSolarYear(luminosity, eta) {
    return massRateFromLuminosity(luminosity, eta) * YEAR / M_SUN;
  }

  function gravitationalRadius(massSolar) {
    return G * Math.max(0, Number(massSolar)) * M_SUN / (C * C);
  }

  function innerBoundaryFactor(x, xIn) {
    var radius = Number(x);
    var inner = Number(xIn);
    if (!finite(radius) || !finite(inner) || radius <= inner) return 0;
    return 1 - Math.sqrt(inner / radius);
  }

  function thinDiskFlux(massSolar, mdot, x, xIn) {
    var mass = Math.max(0, Number(massSolar)) * M_SUN;
    var radius = Math.max(0, Number(x)) * gravitationalRadius(massSolar);
    var factor = innerBoundaryFactor(x, xIn);
    if (radius <= 0 || factor <= 0) return 0;
    return 3 * G * mass * Number(mdot) / (8 * PI * Math.pow(radius, 3)) * factor;
  }

  function thinDiskTemperature(massSolar, mdot, x, xIn) {
    var flux = thinDiskFlux(massSolar, mdot, x, xIn);
    return flux > 0 ? Math.pow(flux / SIGMA_SB, 0.25) : 0;
  }

  function temperatureShape(x, xIn) {
    var radius = Number(x);
    var inner = Number(xIn);
    if (!finite(radius) || !finite(inner) || radius <= inner || inner <= 0) return 0;
    return Math.pow(Math.pow(radius, -3) * innerBoundaryFactor(radius, inner), 0.25);
  }

  function timescales(massSolar, x, alpha, aspect) {
    var mass = Math.max(0, Number(massSolar)) * M_SUN;
    var radius = Math.max(EPS, Number(x)) * gravitationalRadius(massSolar);
    var tDyn = Math.sqrt(Math.pow(radius, 3) / (G * mass));
    var a = Math.max(EPS, Number(alpha));
    var h = Math.max(EPS, Number(aspect));
    return { dynamical: tDyn, viscous: tDyn / (a * h * h), alpha: a, aspect: h };
  }

  function evaluate(config) {
    var input = config || {};
    var massSolar = clamp(Number(input.massSolar), 1, 100);
    if (!finite(massSolar)) massSolar = 10;
    var lambda = clamp(Number(input.lambda), 0.05, 2.5);
    if (!finite(lambda)) lambda = 0.5;
    var modeId = input.efficiencyId || "schwarzschild";
    var surfaceRadiusRg = clamp(Number(input.surfaceRadiusRg), 2, 200);
    if (!finite(surfaceRadiusRg)) surfaceRadiusRg = 100;
    var xIn = clamp(Number(input.xIn), 3, 12);
    if (!finite(xIn)) xIn = 6;
    var x = clamp(Number(input.x), xIn, 30);
    if (!finite(x)) x = Math.max(xIn, 10);
    var alpha = clamp(Number(input.alpha), 0.003, 0.1);
    if (!finite(alpha)) alpha = 0.01;
    var aspect = clamp(Number(input.aspect), 0.03, 0.3);
    if (!finite(aspect)) aspect = 0.05;
    var Ledd = eddingtonLuminosity(massSolar);
    var luminosity = lambda * Ledd;
    var eta = efficiency(modeId, surfaceRadiusRg);
    var mdot = massRateFromLuminosity(luminosity, eta);
    var diskFlux = thinDiskFlux(massSolar, mdot, x, xIn);
    var temp = thinDiskTemperature(massSolar, mdot, x, xIn);
    var scales = timescales(massSolar, x, alpha, aspect);
    var thinDiskRegime = lambda <= 1 && aspect < 0.3;
    return {
      massSolar: massSolar,
      lambda: lambda,
      luminosity: luminosity,
      Ledd: Ledd,
      efficiencyId: modeId,
      efficiencyLabel: efficiencyMode(modeId).label,
      efficiencyNote: efficiencyMode(modeId).note,
      eta: eta,
      surfaceRadiusRg: surfaceRadiusRg,
      mdot: mdot,
      mdotSolarYear: mdot * YEAR / M_SUN,
      xIn: xIn,
      x: x,
      innerBoundary: innerBoundaryFactor(x, xIn),
      flux: diskFlux,
      temperature: temp,
      rG: gravitationalRadius(massSolar),
      alpha: alpha,
      aspect: aspect,
      tDyn: scales.dynamical,
      tVisc: scales.viscous,
      thinDiskRegime: thinDiskRegime,
      eddingtonStatus: lambda > 1 ? "超出球对称 Eddington toy 判据；不等于流体必然不存在。" : "低于或等于球对称 Eddington toy 判据；仍需模型假设。",
      mriStatus: "MRI 只在理想 MHD、差分转动且磁场耦合/波长条件满足时讨论；α 不是普适常数。"
    };
  }

  function formatNumber(value, digits) {
    if (!finite(value)) return "—";
    var text = Number(value).toFixed(digits === undefined ? 4 : digits);
    return text.replace(/0+$/, "").replace(/\.$/, "") || "0";
  }

  function formatScientific(value, digits) {
    if (!finite(value)) return "—";
    return Number(value).toExponential(digits === undefined ? 3 : digits);
  }

  function installStyles(doc) {
    if (!doc || !doc.createElement || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var style = doc.createElement("style"); style.id = STYLE_ID; style.textContent = STYLE_TEXT;
    (doc.head || doc.documentElement || doc.body).appendChild(style);
  }

  function setAttrs(node, attrs) {
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "htmlFor") node.setAttribute("for", String(value));
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }

  function append(node, children, doc) {
    if (children === undefined || children === null) return node;
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function element(doc, tag, attrs, children) { return append(setAttrs(doc.createElement(tag), attrs), children, doc); }
  function svgNode(doc, tag, attrs, children) { return append(setAttrs(doc.createElementNS(SVG_NS, tag), attrs), children, doc); }
  function clear(node) { if (typeof node.replaceChildren === "function") node.replaceChildren(); else while (node.firstChild) node.removeChild(node.firstChild); }
  function announce(root, api, message) { if (api && typeof api.announce === "function") api.announce(root, message); }

  function expectedAnswers(report) {
    return {
      inner: "zero",
      slope: "minus-three-fourths",
      efficiency: "lower",
      timescale: "viscous"
    };
  }

  function renderTemperaturePath(report) {
    var points = [];
    var maxX = 30;
    var maxTemp = 0;
    var values = [];
    var index;
    for (index = 0; index <= 60; index += 1) {
      var x = report.xIn + (maxX - report.xIn) * index / 60;
      var value = temperatureShape(x, report.xIn);
      values.push({ x: x, value: value });
      maxTemp = Math.max(maxTemp, value);
    }
    maxTemp = maxTemp || 1;
    values.forEach(function (item, itemIndex) {
      var px = 54 + (item.x - report.xIn) / (maxX - report.xIn) * 312;
      var py = 246 - item.value / maxTemp * 160;
      points.push((itemIndex === 0 ? "M " : "L ") + px.toFixed(2) + " " + py.toFixed(2));
    });
    return points.join(" ");
  }

  function renderAsymptoticPath(report) {
    var points = [];
    var maxX = 30;
    var anchor = Math.pow(Math.max(report.xIn, 1), -0.75);
    for (var index = 0; index <= 60; index += 1) {
      var x = report.xIn + (maxX - report.xIn) * index / 60;
      var yValue = Math.pow(x, -0.75) / anchor;
      var px = 54 + (x - report.xIn) / (maxX - report.xIn) * 312;
      var py = 246 - yValue * 160;
      points.push((index === 0 ? "M " : "L ") + px.toFixed(2) + " " + py.toFixed(2));
    }
    return points.join(" ");
  }

  function renderSvg(doc, report, serial) {
    var svg = svgNode(doc, "svg", { className: "ae-svg", viewBox: "0 0 760 370", role: "img", "aria-labelledby": "ae-svg-title-" + serial + " ae-svg-desc-" + serial });
    svg.appendChild(svgNode(doc, "title", { id: "ae-svg-title-" + serial }, "薄盘温度与吸积时标尺度"));
    svg.appendChild(svgNode(doc, "desc", { id: "ae-svg-desc-" + serial }, "左图比较含内边界项的温度剖面与远离内边界的负四分之三幂；右图比较动力学与黏性时标。"));
    svg.appendChild(svgNode(doc, "text", { x: "54", y: "33", className: "ae-title" }, "薄盘温度：T_eff⁴ ∝ r⁻³[1−√(r_in/r)]"));
    svg.appendChild(svgNode(doc, "text", { x: "54", y: "51", className: "ae-small" }, "蓝线含内边界；金色虚线只是在远离 r_in 时的 r⁻³/⁴ 读法"));
    svg.appendChild(svgNode(doc, "line", { x1: "54", y1: "246", x2: "366", y2: "246", className: "ae-axis" }));
    svg.appendChild(svgNode(doc, "line", { x1: "54", y1: "86", x2: "54", y2: "246", className: "ae-axis" }));
    svg.appendChild(svgNode(doc, "line", { x1: "54", y1: "86", x2: "366", y2: "86", className: "ae-grid" }));
    svg.appendChild(svgNode(doc, "path", { d: renderTemperaturePath(report), className: "ae-temp" }));
    svg.appendChild(svgNode(doc, "path", { d: renderAsymptoticPath(report), className: "ae-asymptote" }));
    svg.appendChild(svgNode(doc, "text", { x: "54", y: "266", className: "ae-small" }, "r_in=" + formatNumber(report.xIn, 1) + " r_g"));
    svg.appendChild(svgNode(doc, "text", { x: "366", y: "266", className: "ae-small", "text-anchor": "end" }, "30 r_g"));
    svg.appendChild(svgNode(doc, "text", { x: "42", y: "91", className: "ae-small", "text-anchor": "end" }, "归一化 T"));

    svg.appendChild(svgNode(doc, "text", { x: "440", y: "33", className: "ae-title" }, "时标：t_visc≈α⁻¹(H/R)⁻² t_dyn"));
    svg.appendChild(svgNode(doc, "text", { x: "440", y: "51", className: "ae-small" }, "当前 r=" + formatNumber(report.x, 1) + " r_g；这里只是薄盘 alpha toy"));
    var barMax = Math.max(report.tVisc, report.tDyn, EPS);
    var dynWidth = Math.max(4, 250 * report.tDyn / barMax);
    var viscWidth = Math.max(4, 250 * report.tVisc / barMax);
    svg.appendChild(svgNode(doc, "text", { x: "440", y: "96", className: "ae-small" }, "t_dyn"));
    svg.appendChild(svgNode(doc, "rect", { x: "510", y: "80", width: String(dynWidth), height: "22", className: "ae-bar-dyn" }));
    svg.appendChild(svgNode(doc, "text", { x: String(Math.min(748, 516 + dynWidth)), y: "96", className: "ae-value" }, formatScientific(report.tDyn, 2) + " s"));
    svg.appendChild(svgNode(doc, "text", { x: "440", y: "146", className: "ae-small" }, "t_visc"));
    svg.appendChild(svgNode(doc, "rect", { x: "510", y: "130", width: String(viscWidth), height: "22", className: "ae-bar-visc" }));
    svg.appendChild(svgNode(doc, "text", { x: String(Math.min(748, 516 + viscWidth)), y: "146", className: "ae-value" }, formatScientific(report.tVisc, 2) + " s"));
    svg.appendChild(svgNode(doc, "text", { x: "440", y: "204", className: "ae-title" }, "Eddington 与效率"));
    svg.appendChild(svgNode(doc, "text", { x: "440", y: "224", className: "ae-small" }, "λ=L/L_Edd=" + formatNumber(report.lambda, 2) + "；η=" + formatNumber(report.eta, 3) + "；ṁ=" + formatScientific(report.mdotSolarYear, 2) + " M☉/yr"));
    svg.appendChild(svgNode(doc, "text", { x: "440", y: "246", className: "ae-small" }, "温度、时标和流率共享输入，但不是 GRMHD 模拟"));
    svg.appendChild(svgNode(doc, "text", { x: "440", y: "296", className: "ae-small" }, "蓝：T(r)    绿：t_dyn    红：t_visc    金虚线：远离内边界的幂律"));
    return svg;
  }

  function renderResults(doc, hostNode, report, serial) {
    clear(hostNode);
    var metrics = element(doc, "div", { className: "ae-metrics" });
    [
      ["L/L_Edd", formatNumber(report.lambda, 3)],
      ["L_Edd", formatScientific(report.Ledd, 3) + " W"],
      ["效率 η", formatNumber(report.eta, 5)],
      ["ṁ", formatScientific(report.mdotSolarYear, 3) + " M☉/yr"],
      ["T_eff(r)", formatScientific(report.temperature, 3) + " K"],
      ["t_visc", formatScientific(report.tVisc, 3) + " s"]
    ].forEach(function (row) { metrics.appendChild(element(doc, "div", { className: "ae-metric" }, [element(doc, "span", {}, row[0]), element(doc, "strong", {}, row[1])])); });
    hostNode.appendChild(metrics);
    var frame = element(doc, "div", { className: "ae-frame" }); frame.appendChild(renderSvg(doc, report, serial)); hostNode.appendChild(frame);
    var tableWrap = element(doc, "div", { className: "ae-table-wrap" });
    var table = element(doc, "table"); table.appendChild(element(doc, "caption", {}, "Eddington、效率、薄盘、流率与时标逐项记账"));
    table.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, [element(doc, "th", { scope: "col" }, "项目"), element(doc, "th", { scope: "col" }, "公式"), element(doc, "th", { scope: "col" }, "当前值"), element(doc, "th", { scope: "col" }, "模型边界")] )));
    var rows = [
      ["Eddington 光度", "4πGMm_p c/σ_T", formatScientific(report.Ledd, 4) + " W", "球对称、稳态、完全电离、电子 Thomson 散射等假设；λ>1 不自动排除超 Eddington 流"],
      ["效率", report.efficiencyId === "surface" ? "η_N=GM/(Rc²)=1/(R/r_g)" : "η=1−E_ISCO（GR）", formatNumber(report.eta, 6), report.efficiencyNote],
      ["质量流率", "ṁ=L/(ηc²)", formatScientific(report.mdot, 4) + " kg/s", "同一 L 下，η 越高，所需 ṁ 越低"],
      ["内边界项", "f=1−√(r_in/r)", formatNumber(report.innerBoundary, 5) + " at r=" + formatNumber(report.x, 2) + " r_g", "r=r_in 时 T=0；r⁻³/⁴ 只在远离边界读"],
      ["薄盘温度", "σ_SB T_eff⁴=3GMṁ/(8πr³) f", formatScientific(report.temperature, 4) + " K", report.thinDiskRegime ? "当前参数仍像薄盘 toy；非 GRMHD" : "当前 λ 或 H/R 已越出此 toy 的舒适范围"],
      ["吸积时标", "t_dyn=(r³/GM)^1/2；t_visc≈α⁻¹(R/H)²t_dyn", formatScientific(report.tDyn, 3) + " / " + formatScientific(report.tVisc, 3) + " s", "α≈" + formatNumber(report.alpha, 3) + " 是输入示例，不是普适常数"],
      ["MRI", "理想 MHD + dΩ/dr<0 + 耦合/波长条件", "条件化 toy 标签", report.mriStatus]
    ];
    var body = element(doc, "tbody"); rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, row.map(function (value) { return element(doc, "td", {}, value); }))); }); table.appendChild(body); tableWrap.appendChild(table); hostNode.appendChild(tableWrap);
    var warning = report.lambda > 1 ? report.eddingtonStatus : "当前没有触发 λ>1 的 toy 警示；这仍不是对真实盘几何、辐射输运或 GRMHD 的结论。";
    hostNode.appendChild(element(doc, "div", { className: "ae-certificate" + (report.lambda > 1 ? " ae-blocked" : "") }, warning + " BZ 若加入物理图景，抽取的是黑洞总质量能中的转动部分；不能写成“不是质量能”。"));
  }

  function mount(root, api) {
    var doc = root && root.ownerDocument; if (!doc) return;
    installStyles(doc); root.classList.add("ae-lab");
    var serial = INSTANCE += 1;
    var state = { massSolar: 10, lambda: 0.5, efficiencyId: "schwarzschild", surfaceRadiusRg: 100, xIn: 6, x: 10, alpha: 0.01, aspect: 0.05, answers: { inner: null, slope: null, efficiency: null, timescale: null }, revealed: false };
    var shell = element(doc, "div", { className: "ae-shell" });
    shell.appendChild(element(doc, "h3", {}, "吸积账本：Eddington、η、薄盘温度与时标"));
    shell.appendChild(element(doc, "p", { className: "ae-note" }, "默认是 10 M☉、λ=0.5 的透明 toy。效率先选口径，质量流率再由 L/(ηc²) 得到；薄盘图不代表 GRMHD。"));
    var controls = element(doc, "div", { className: "ae-controls" });
    function rangeControl(labelText, key, min, max, step, aria) {
      var control = element(doc, "div", { className: "ae-control" }); var label = element(doc, "label", {}, labelText + " = "); var output = element(doc, "output", {}); label.appendChild(output); var input = element(doc, "input", { type: "range", min: String(min), max: String(max), step: String(step), "aria-label": aria }); control.appendChild(label); control.appendChild(input); return { control: control, input: input, output: output, key: key };
    }
    var modelControl = element(doc, "div", { className: "ae-control" }); modelControl.appendChild(element(doc, "label", { htmlFor: "ae-eff-" + serial }, "效率口径")); var modelSelect = element(doc, "select", { id: "ae-eff-" + serial, "aria-label": "选择效率口径" }); EFFICIENCIES.forEach(function (item) { modelSelect.appendChild(element(doc, "option", { value: item.id }, item.label)); }); modelControl.appendChild(modelSelect); controls.appendChild(modelControl);
    var mass = rangeControl("M/M☉", "massSolar", 1, 50, 1, "中心天体质量（太阳质量）"); var lambda = rangeControl("λ=L/L_Edd", "lambda", 0.05, 2.5, 0.05, "Eddington 比"); var surfaceRadius = rangeControl("R/r_g（表面估计）", "surfaceRadiusRg", 2, 200, 1, "Newtonian 表面估计半径"); var xIn = rangeControl("r_in/r_g", "xIn", 3, 12, 0.5, "薄盘内边界半径"); var x = rangeControl("r/r_g", "x", 3, 30, 0.5, "取样半径"); var alpha = rangeControl("α", "alpha", 0.003, 0.1, 0.001, "alpha 黏性参数"); var aspect = rangeControl("H/R", "aspect", 0.03, 0.3, 0.01, "盘厚度比");
    [mass, lambda, surfaceRadius, xIn, x, alpha, aspect].forEach(function (item) { controls.appendChild(item.control); }); shell.appendChild(controls);
    var prediction = element(doc, "section", { className: "ae-prediction", "aria-labelledby": "ae-prediction-title-" + serial }); prediction.appendChild(element(doc, "strong", { className: "ae-prediction-title", id: "ae-prediction-title-" + serial }, "预测门：四项回答后才揭示吸积账")); var questionList = element(doc, "div"); prediction.appendChild(questionList); var reveal = element(doc, "button", { type: "button", className: "ae-primary" }, "核对预测并揭示"); var reset = element(doc, "button", { type: "button" }, "重置实验"); prediction.appendChild(element(doc, "div", { className: "ae-actions" }, [reveal, reset])); var status = element(doc, "p", { className: "ae-feedback", "aria-live": "polite", "aria-atomic": "true" }, "先回答四项预测。"); prediction.appendChild(status); shell.appendChild(prediction);
    var results = element(doc, "section", { className: "ae-results", hidden: true, "aria-live": "polite", "aria-label": "吸积计算结果" }); shell.appendChild(results); root.replaceChildren(shell);

    function questionSpecs() {
      return [
        { key: "inner", prompt: "1. 在 r=r_in 处，边界因子与 T_eff？", choices: [{ value: "zero", label: "因子为 0，T→0" }, { value: "power", label: "仍按 r⁻³/⁴" }, { value: "infinite", label: "发散" }] },
        { key: "slope", prompt: "2. 远离内边界时 T_eff 的幂律？", choices: [{ value: "minus-three-fourths", label: "r⁻³/⁴" }, { value: "minus-three", label: "r⁻³" }, { value: "plus-three-fourths", label: "r³/⁴" }] },
        { key: "efficiency", prompt: "3. 固定 L，把 η 从 0.06 换成 0.30，ṁ 怎样？", choices: [{ value: "lower", label: "降低约 5 倍" }, { value: "higher", label: "升高约 5 倍" }, { value: "same", label: "不变" }] },
        { key: "timescale", prompt: "4. 薄盘 toy 的 t_visc 主要怎样依赖 α、H/R？", choices: [{ value: "viscous", label: "α⁻¹(H/R)⁻²" }, { value: "linear", label: "α(H/R)²" }, { value: "none", label: "与二者无关" }] }
      ];
    }
    function renderQuestions() { clear(questionList); questionSpecs().forEach(function (question) { var fieldset = element(doc, "fieldset"); fieldset.appendChild(element(doc, "legend", {}, question.prompt)); var options = element(doc, "div", { className: "ae-options", role: "group", "aria-label": question.prompt }); question.choices.forEach(function (choice) { var button = element(doc, "button", { type: "button", "aria-pressed": state.answers[question.key] === choice.value ? "true" : "false" }, choice.label); button.addEventListener("click", function () { state.answers[question.key] = choice.value; state.revealed = false; results.hidden = true; renderQuestions(); renderGate(); }); options.appendChild(button); }); fieldset.appendChild(options); questionList.appendChild(fieldset); }); }
    function renderGate() { reveal.disabled = !Object.keys(state.answers).every(function (key) { return state.answers[key] !== null; }); }
    function resetPredictions(message) { state.answers = { inner: null, slope: null, efficiency: null, timescale: null }; state.revealed = false; results.hidden = true; if (message) { status.className = "ae-feedback ae-warn"; status.textContent = message; announce(root, api, message); } }
    function render() { var report = evaluate(state); modelSelect.value = state.efficiencyId; [mass, lambda, surfaceRadius, xIn, x, alpha, aspect].forEach(function (item) { item.input.value = String(state[item.key]); item.output.textContent = formatNumber(state[item.key], item.key === "alpha" || item.key === "aspect" ? 3 : item.key === "lambda" ? 2 : 1); }); renderQuestions(); renderGate(); results.hidden = !state.revealed; if (state.revealed) renderResults(doc, results, report, serial); }
    function attachRange(item) { item.input.addEventListener("input", function () { state[item.key] = Number(item.input.value); if (item.key === "xIn" && state.x < state.xIn) state.x = state.xIn; resetPredictions("参数已改变，请重新预测。"); render(); }); }
    [mass, lambda, surfaceRadius, xIn, x, alpha, aspect].forEach(attachRange);
    modelSelect.addEventListener("change", function () { state.efficiencyId = modelSelect.value; resetPredictions("效率口径已改变，请重新预测质量流率。"); render(); });
    reveal.addEventListener("click", function () { var report = evaluate(state); var expected = expectedAnswers(report); var keys = Object.keys(state.answers); if (keys.some(function (key) { return state.answers[key] === null; })) { status.className = "ae-feedback ae-warn"; status.textContent = "请先回答四项预测。"; announce(root, api, status.textContent); return; } var score = keys.reduce(function (total, key) { return total + (state.answers[key] === expected[key] ? 1 : 0); }, 0); state.revealed = true; results.hidden = false; renderResults(doc, results, report, serial); status.className = "ae-feedback " + (score === keys.length ? "ae-pass" : "ae-warn"); status.textContent = "已揭示：命中 " + score + "/" + keys.length + "；把量纲、内边界与模型边界分开读。"; announce(root, api, status.textContent); });
    reset.addEventListener("click", function () { state = { massSolar: 10, lambda: 0.5, efficiencyId: "schwarzschild", surfaceRadiusRg: 100, xIn: 6, x: 10, alpha: 0.01, aspect: 0.05, answers: { inner: null, slope: null, efficiency: null, timescale: null }, revealed: false }; status.className = "ae-feedback"; status.textContent = "已重置到默认薄盘 toy；请重新预测。"; render(); announce(root, api, status.textContent); });
    render();
  }

  function assert(condition, message) { if (!condition) throw new Error("accretion-eddington: " + message); }
  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    check(near(eddingtonLuminosity(1), 1.26e31, 0.02), "Eddington luminosity scale");
    check(near(efficiency("schwarzschild"), 1 - Math.sqrt(8 / 9), 1e-12), "Schwarzschild ISCO efficiency");
    check(near(efficiency("extreme"), 1 - 1 / Math.sqrt(3), 1e-12), "extreme Kerr test-particle efficiency");
    check(near(efficiency("thorne"), 0.30, 1e-12), "Thorne radiative capture efficiency");
    check(near(efficiency("surface", 100), 0.01, 1e-12), "Newtonian surface estimate");
    var L = eddingtonLuminosity(10) * 0.5;
    check(near(massRateFromLuminosity(L, 0.1) / massRateFromLuminosity(L, 0.2), 2, 1e-12), "mass rate inverse efficiency");
    check(thinDiskFlux(10, 1e17, 6, 6) === 0 && thinDiskTemperature(10, 1e17, 6, 6) === 0, "inner boundary zero");
    check(innerBoundaryFactor(12, 6) > 0 && innerBoundaryFactor(12, 6) < 1, "inner boundary factor range");
    check(temperatureShape(12, 6) > 0 && temperatureShape(24, 6) < temperatureShape(12, 6), "temperature shape decreases outside peak range");
    var short = timescales(10, 10, 0.01, 0.05);
    var fasterAlpha = timescales(10, 10, 0.02, 0.05);
    check(near(short.viscous / fasterAlpha.viscous, 2, 1e-12), "viscous time inverse alpha");
    var report = evaluate({ massSolar: 10, lambda: 1.5, efficiencyId: "schwarzschild", xIn: 6, x: 10, alpha: 0.01, aspect: 0.05 });
    check(report.lambda > 1 && report.eddingtonStatus.indexOf("超出") >= 0, "super Eddington caveat");
    check(formatScientific(evaluate({ massSolar: 10, lambda: 0.5, efficiencyId: "schwarzschild", xIn: 6, x: 10, alpha: 0.01, aspect: 0.05 }).mdotSolarYear, 3) !== "0.000e+0", "small solar-mass rate retains its scientific scale");
    EFFICIENCIES.forEach(function (mode) { check(efficiency(mode.id, 100) > 0, mode.id + " positive efficiency"); });
    return { checks: checks, efficiencies: EFFICIENCIES.length };
  }

  return {
    CONSTANTS: { G: G, C: C, M_P: M_P, SIGMA_T: SIGMA_T, SIGMA_SB: SIGMA_SB, M_SUN: M_SUN },
    EFFICIENCIES: EFFICIENCIES,
    eddingtonLuminosity: eddingtonLuminosity,
    efficiency: efficiency,
    massRateFromLuminosity: massRateFromLuminosity,
    massRateSolarYear: massRateSolarYear,
    gravitationalRadius: gravitationalRadius,
    innerBoundaryFactor: innerBoundaryFactor,
    thinDiskFlux: thinDiskFlux,
    thinDiskTemperature: thinDiskTemperature,
    temperatureShape: temperatureShape,
    timescales: timescales,
    evaluate: evaluate,
    expectedAnswers: expectedAnswers,
    mount: mount,
    selfTest: selfTest
  };
});
