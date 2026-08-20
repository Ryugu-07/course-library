(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("elliptic-coercivity", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("elliptic-coercivity self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("elliptic-coercivity self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  var PI = Math.PI;
  var FIRST_EIGENVALUE = PI * PI;
  var MODAL_LIMIT = 512;
  var RESONANCE_TOL = 1e-8;
  var FORCING_TOL = 1e-10;
  var STYLE_ID = "cl-elliptic-coercivity-styles";
  var SERIAL = 0;

  var FORCINGS = [
    { id: "generic", label: "一般强迫：f₁=0.85", firstMode: 0.85 },
    { id: "compatible", label: "第一模态相容：f₁=0", firstMode: 0 }
  ];

  var PRESETS = [
    { id: "coercive", label: "强制：c=0", c: 0, N: 5, forcing: "generic" },
    { id: "near-resonance", label: "近共振：c≈−π²", c: -FIRST_EIGENVALUE + 0.18, N: 5, forcing: "generic" },
    { id: "resonant-compatible", label: "共振相容：c=−π², f₁=0", c: -FIRST_EIGENVALUE, N: 5, forcing: "compatible" },
    { id: "resonant-incompatible", label: "共振不相容：c=−π², f₁≠0", c: -FIRST_EIGENVALUE, N: 5, forcing: "generic" },
    { id: "indefinite", label: "下方非共振：无 L–M 证书", c: -12, N: 5, forcing: "generic" },
    { id: "hidden-resonance", label: "截断陷阱：第二共振在 N 外", c: -4 * FIRST_EIGENVALUE, N: 1, forcing: "generic" }
  ];

  var STYLE_TEXT = [
    ".ec-lab{--ec-blue:var(--cl-blue,#315f9d);--ec-gold:var(--cl-gold,#9b6a12);--ec-green:var(--cl-green,#39734d);--ec-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere;}",
    "html[data-theme=\"dark\"] .ec-lab{--ec-blue:#83c8ff;--ec-gold:#e2b458;--ec-green:#72bd8b;--ec-red:#f08c7d;}",
    ".ec-lab *,.ec-lab *::before,.ec-lab *::after{box-sizing:border-box;}.ec-lab [hidden]{display:none!important;}",
    ".ec-lab h3,.ec-lab h4{margin:0;color:var(--fg);letter-spacing:0;}.ec-lab h3{font-size:1.18rem;}.ec-lab h4{margin-top:16px;font-size:1rem;}",
    ".ec-lab .ec-intro,.ec-lab .ec-note,.ec-lab .ec-feedback{color:var(--fg-soft);font-size:13px;line-height:1.7;}",
    ".ec-lab .ec-prompt{margin:14px 0;padding:12px 14px;border-left:3px solid var(--ec-gold);background:var(--bg);}",
    ".ec-lab fieldset{min-width:0;margin:0;padding:0;border:0;}.ec-lab legend{margin-bottom:8px;color:var(--fg);font-weight:750;}",
    ".ec-lab .ec-question{min-width:0;margin:11px 0;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg);}",
    ".ec-lab .ec-question legend{max-width:100%;color:var(--fg-soft);font-size:13px;line-height:1.5;overflow-wrap:anywhere;}",
    ".ec-lab .ec-choice-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}",
    ".ec-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere;}",
    ".ec-lab button:hover{border-color:var(--accent);}.ec-lab button[aria-pressed=true],.ec-lab button.ec-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750;}.ec-lab button:disabled{cursor:not-allowed;opacity:.55;}",
    ".ec-lab button:focus-visible,.ec-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}",
    ".ec-lab .ec-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0;}.ec-lab .ec-actions>*{flex:1 1 170px;}.ec-lab .ec-feedback{min-height:2em;margin:8px 0;font-weight:700;}.ec-lab .ec-pass{color:var(--ec-green);}.ec-lab .ec-warn{color:var(--ec-red);}",
    ".ec-lab .ec-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);}.ec-lab .ec-layout{display:grid;grid-template-columns:minmax(220px,.72fr) minmax(0,1.28fr);gap:16px;align-items:start;min-width:0;}.ec-lab .ec-controls,.ec-lab .ec-stage{min-width:0;}",
    ".ec-lab .ec-controls{display:grid;gap:12px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg);}.ec-lab .ec-controls h4{margin:0;}.ec-lab .ec-presets,.ec-lab .ec-forcings{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;}.ec-lab .ec-presets button,.ec-lab .ec-forcings button{font-size:12px;}",
    ".ec-lab .ec-control{display:grid;gap:5px;min-width:0;}.ec-lab .ec-control label,.ec-lab .ec-control-title{color:var(--fg-soft);font-size:13px;font-weight:700;}.ec-lab .ec-control output{color:var(--accent);font-variant-numeric:tabular-nums;}.ec-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent);}.ec-lab .ec-scale{display:flex;justify-content:space-between;gap:8px;color:var(--fg-soft);font-size:11px;}",
    ".ec-lab .ec-stage-frame{min-width:0;padding:9px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden;}.ec-lab .ec-formula{margin:0 0 12px;padding:9px 11px;border-left:3px solid var(--accent);background:var(--bg);font-family:\"SF Mono\",Menlo,Consolas,monospace;font-size:12px;line-height:1.7;overflow-x:auto;}",
    ".ec-lab .ec-status-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:10px 0 12px;}.ec-lab .ec-status-card{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}.ec-lab .ec-status-card span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4;}.ec-lab .ec-status-card strong{display:block;margin-top:3px;font-size:14px;line-height:1.45;overflow-wrap:anywhere;}.ec-lab .ec-status-card.ec-good{border-top-color:var(--ec-green);}.ec-lab .ec-status-card.ec-warn{border-top-color:var(--ec-red);}.ec-lab .ec-status-card.ec-neutral{border-top-color:var(--ec-gold);}",
    ".ec-lab .ec-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(122px,1fr));gap:8px;margin:10px 0 12px;}.ec-lab .ec-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}.ec-lab .ec-metric:nth-child(1),.ec-lab .ec-metric:nth-child(4){border-top-color:var(--ec-blue);}.ec-lab .ec-metric:nth-child(2),.ec-lab .ec-metric:nth-child(5){border-top-color:var(--ec-gold);}.ec-lab .ec-metric:nth-child(3),.ec-lab .ec-metric:nth-child(6){border-top-color:var(--ec-red);}.ec-lab .ec-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4;}.ec-lab .ec-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}",
    ".ec-lab .ec-chart-frame{min-width:0;padding:7px;border:1px solid var(--border);border-radius:6px;background:var(--bg);}.ec-lab .ec-svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg);}.ec-lab .ec-svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}.ec-lab .ec-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.68;}.ec-lab .ec-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.7;}.ec-lab .ec-zero{stroke:var(--ec-gold);stroke-width:1.5;stroke-dasharray:5 4;}.ec-lab .ec-bar{fill:var(--ec-blue);fill-opacity:.72;}.ec-lab .ec-bar.ec-negative{fill:var(--ec-red);}.ec-lab .ec-bar.ec-resonant{fill:var(--ec-gold);}.ec-lab .ec-chart-label{font-size:11px;}.ec-lab .ec-chart-title{font-size:12px;font-weight:750;}",
    ".ec-lab .ec-ledger{max-width:100%;margin-top:14px;overflow-x:auto;-webkit-overflow-scrolling:touch;}.ec-lab table{width:100%;min-width:790px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}.ec-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft);font-size:12px;line-height:1.55;}.ec-lab th,.ec-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;white-space:nowrap;}.ec-lab th{color:var(--fg-soft);font-size:11.5px;font-weight:750;}.ec-lab tr.ec-tail{color:var(--fg-soft);}.ec-lab tr.ec-resonant{background:color-mix(in srgb,var(--ec-gold) 10%,transparent);}",
    ".ec-lab .ec-interpretation{margin:12px 0 0;padding:10px 12px;border-left:3px solid var(--ec-green);background:var(--bg);font-size:13px;line-height:1.7;}.ec-lab .ec-caution{margin:10px 0 0;color:var(--fg-soft);font-size:12.5px;line-height:1.7;}",
    "@media(max-width:900px){.ec-lab .ec-layout{grid-template-columns:minmax(0,1fr);}}",
    "@media(max-width:700px){.ec-lab .ec-choice-row{grid-template-columns:minmax(0,1fr);}.ec-lab .ec-presets,.ec-lab .ec-forcings{grid-template-columns:minmax(0,1fr);}.ec-lab .ec-status-grid{grid-template-columns:minmax(0,1fr);}}",
    "@media(max-width:430px){.ec-lab .ec-stage-frame{padding:6px;}.ec-lab table{font-size:11.5px;}.ec-lab th,.ec-lab td{padding-left:5px;padding-right:5px;}}",
    "@media(prefers-reduced-motion:reduce){.ec-lab *{animation:none!important;transition:none!important;}}"
  ].join("\n");

  function finite(value, fallback) {
    return typeof value === "number" && isFinite(value) ? value : fallback;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function integer(value, fallback, min, max) {
    var result = Math.round(finite(Number(value), fallback));
    return clamp(result, min, max);
  }

  function near(left, right, tolerance) {
    var scale = Math.max(1, Math.abs(left), Math.abs(right));
    return Math.abs(left - right) <= (tolerance || 1e-10) * scale;
  }

  function forcingById(id) {
    return FORCINGS.filter(function (item) { return item.id === id; })[0] || FORCINGS[0];
  }

  function normalizeParams(input) {
    var source = input || {};
    var c = clamp(finite(Number(source.c), PRESETS[0].c), -40, 8);
    var N = integer(source.N, PRESETS[0].N, 1, 12);
    var forcing = forcingById(source.forcing);
    return { id: source.id || "custom", c: c, N: N, forcing: forcing.id };
  }

  function copyPreset(preset) {
    return { id: preset.id, c: preset.c, N: preset.N, forcing: preset.forcing };
  }

  function forcingCoefficient(k, forcingId) {
    var forcing = forcingById(forcingId);
    if (k === 1) return forcing.firstMode;
    return 0.8 * (k % 2 === 0 ? -1 : 1) / (k * k);
  }

  function eigenvalue(k) {
    return k * k * FIRST_EIGENVALUE;
  }

  function resonant(difference, eigen) {
    return Math.abs(difference) <= RESONANCE_TOL * Math.max(1, Math.abs(eigen));
  }

  function statusLabel(status) {
    if (status === "no-solution") return "无解";
    if (status === "multiple") return "多解";
    return "唯一";
  }

  function evaluate(input) {
    var params = normalizeParams(input);
    var allRows = [];
    var resonances = [];
    var finiteResonances = [];
    var minAbsMargin = Infinity;
    var alphaFinite = Infinity;
    var k;

    for (k = 1; k <= MODAL_LIMIT; k += 1) {
      var lambda = eigenvalue(k);
      var d = lambda + params.c;
      var f = forcingCoefficient(k, params.forcing);
      var isResonant = resonant(d, lambda);
      var row = {
        k: k,
        lambda: lambda,
        forcing: f,
        margin: d,
        ratio: d / lambda,
        resonant: isResonant,
        included: k <= params.N,
        exactCoefficient: null,
        finiteCoefficient: null,
        finiteResidual: null
      };
      if (Math.abs(d) < minAbsMargin) minAbsMargin = Math.abs(d);
      if (k <= params.N && row.ratio < alphaFinite) alphaFinite = row.ratio;
      if (isResonant) resonances.push(row);
      if (isResonant && k <= params.N) finiteResonances.push(row);
      allRows.push(row);
    }

    var compatible = resonances.every(function (row) {
      return Math.abs(row.forcing) <= FORCING_TOL;
    });
    var fullStatus = resonances.length === 0 ? "unique" : (compatible ? "multiple" : "no-solution");
    var finiteCompatible = finiteResonances.every(function (row) {
      return Math.abs(row.forcing) <= FORCING_TOL;
    });
    var finiteStatus = finiteResonances.length === 0 ? "unique" : (finiteCompatible ? "multiple" : "no-solution");
    var finiteComputable = finiteStatus !== "no-solution";
    var alphaInfinite = Math.min(1, 1 + params.c / FIRST_EIGENVALUE);
    var coercive = alphaInfinite > RESONANCE_TOL;
    var exactDefined = fullStatus !== "no-solution";
    var finiteResidualSquared = 0;
    var fullResidualSquared = 0;
    var h1TailSquared = 0;
    var signedEnergyTail = 0;
    var exactEnergy = 0;
    var finiteEnergy = 0;

    allRows.forEach(function (row) {
      if (row.resonant) {
        row.exactCoefficient = exactDefined ? 0 : null;
        row.finiteCoefficient = row.included && finiteCompatible ? 0 : (row.included ? null : 0);
      } else {
        row.exactCoefficient = exactDefined ? row.forcing / row.margin : null;
        row.finiteCoefficient = row.included ? row.forcing / row.margin : 0;
      }

      if (finiteComputable) {
        row.finiteResidual = row.margin * row.finiteCoefficient - row.forcing;
        if (row.included) finiteResidualSquared += row.finiteResidual * row.finiteResidual;
        fullResidualSquared += row.finiteResidual * row.finiteResidual;
        finiteEnergy += row.included ? row.margin * row.finiteCoefficient * row.finiteCoefficient : 0;
      }
      if (exactDefined && row.exactCoefficient !== null) {
        exactEnergy += row.margin * row.exactCoefficient * row.exactCoefficient;
        if (row.k > params.N) {
          h1TailSquared += row.lambda * row.exactCoefficient * row.exactCoefficient;
          signedEnergyTail += row.margin * row.exactCoefficient * row.exactCoefficient;
        }
      }
    });

    var displayLimit = Math.min(MODAL_LIMIT, Math.max(8, params.N + 3));
    var displayRows = allRows.slice(0, displayLimit);
    return {
      params: params,
      forcingLabel: forcingById(params.forcing).label,
      firstModalMargin: FIRST_EIGENVALUE + params.c,
      minimumModalMargin: FIRST_EIGENVALUE + params.c,
      minimumAbsoluteModalMargin: minAbsMargin,
      alphaInfinite: alphaInfinite,
      alphaFinite: alphaFinite,
      coercive: coercive,
      laxMilgramCertificate: coercive,
      resonances: resonances,
      finiteResonances: finiteResonances,
      fullStatus: fullStatus,
      finiteStatus: finiteStatus,
      fullStatusLabel: statusLabel(fullStatus),
      finiteStatusLabel: statusLabel(finiteStatus),
      compatible: compatible,
      finiteCompatible: finiteCompatible,
      finiteComputable: finiteComputable,
      exactDefined: exactDefined,
      finiteResidualL2: finiteComputable ? Math.sqrt(finiteResidualSquared) : null,
      fullResidualL2: finiteComputable ? Math.sqrt(fullResidualSquared) : null,
      h1TruncationError: exactDefined ? Math.sqrt(h1TailSquared) : null,
      signedEnergyTail: exactDefined ? signedEnergyTail : null,
      exactEnergy: exactDefined ? exactEnergy : null,
      finiteEnergy: finiteComputable ? finiteEnergy : null,
      conditionNumberFinite: finiteComputable && finiteResonances.length === 0
        ? allRows.slice(0, params.N).reduce(function (state, row) {
          state.max = Math.max(state.max, Math.abs(row.margin));
          state.min = Math.min(state.min, Math.abs(row.margin));
          return state;
        }, { min: Infinity, max: 0 }).max / allRows.slice(0, params.N).reduce(function (state, row) {
          return Math.min(state, Math.abs(row.margin));
        }, Infinity)
        : Infinity,
      firstCoefficient: displayRows[0].exactCoefficient,
      rows: displayRows
    };
  }

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      assert(condition, message);
    }

    var coercive = evaluate({ c: 0, N: 5, forcing: "generic" });
    check(coercive.fullStatus === "unique", "coercive problem should be unique");
    check(coercive.finiteStatus === "unique", "coercive finite problem should be unique");
    check(coercive.coercive && coercive.laxMilgramCertificate, "positive problem should have Lax-Milgram certificate");
    check(near(coercive.minimumModalMargin, FIRST_EIGENVALUE, 1e-12), "first modal margin at c=0");
    check(near(coercive.alphaInfinite, 1, 1e-12), "H1 coercivity constant at c=0");
    check(coercive.h1TruncationError > 0 && coercive.fullResidualL2 > 0, "coercive tail diagnostics");
    check(near(coercive.rows[1].margin * coercive.rows[1].exactCoefficient, coercive.rows[1].forcing, 1e-12), "modal ledger identity");

    var nearResonance = evaluate({ c: -FIRST_EIGENVALUE + 0.18, N: 5, forcing: "generic" });
    check(nearResonance.fullStatus === "unique", "near resonance should remain unique");
    check(nearResonance.coercive, "just above first eigenvalue should remain coercive");
    check(near(nearResonance.minimumModalMargin, 0.18, 1e-10), "near-resonance margin");
    check(nearResonance.minimumAbsoluteModalMargin < 0.19, "near-resonance absolute gap");

    var compatible = evaluate({ c: -FIRST_EIGENVALUE, N: 5, forcing: "compatible" });
    check(compatible.fullStatus === "multiple", "compatible resonance should be multiple");
    check(compatible.finiteStatus === "multiple", "compatible finite resonance should be multiple");
    check(compatible.resonances.length === 1 && compatible.resonances[0].k === 1, "first resonance detection");
    check(Math.abs(compatible.resonances[0].forcing) <= FORCING_TOL, "Fredholm compatibility datum");
    check(compatible.h1TruncationError !== null && compatible.rows[0].exactCoefficient === 0, "canonical compatible representative");

    var incompatible = evaluate({ c: -FIRST_EIGENVALUE, N: 5, forcing: "generic" });
    check(incompatible.fullStatus === "no-solution", "incompatible resonance should have no solution");
    check(incompatible.finiteStatus === "no-solution", "incompatible finite resonance should have no solution");
    check(incompatible.h1TruncationError === null && incompatible.fullResidualL2 === null, "no-solution diagnostics are undefined");

    var indefinite = evaluate({ c: -12, N: 5, forcing: "generic" });
    check(indefinite.fullStatus === "unique", "nonresonant indefinite problem should be unique");
    check(!indefinite.coercive && !indefinite.laxMilgramCertificate, "indefinite problem has no LM certificate");
    check(indefinite.minimumModalMargin < 0 && indefinite.finiteComputable, "negative first margin remains computable");

    var hidden = evaluate({ c: -4 * FIRST_EIGENVALUE, N: 1, forcing: "generic" });
    check(hidden.resonances.length === 1 && hidden.resonances[0].k === 2, "hidden second resonance detection");
    check(hidden.finiteStatus === "unique" && hidden.finiteComputable, "finite truncation can miss resonance");
    check(hidden.fullStatus === "no-solution", "full operator sees hidden incompatible resonance");
    check(hidden.fullResidualL2 > hidden.finiteResidualL2, "full residual exposes omitted modes");

    var repeated = evaluate({ c: -FIRST_EIGENVALUE + 0.18, N: 5, forcing: "generic" });
    check(JSON.stringify(repeated.rows) === JSON.stringify(nearResonance.rows), "deterministic model");
    check(PRESETS.length >= 5 && FORCINGS.length === 2, "teaching branches present");
    return { checks: checks, presets: PRESETS.length };
  }

  function installStyles(doc) {
    if (!doc || !doc.getElementById || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    (doc.head || doc.documentElement || doc.body).appendChild(style);
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
      else if (key.slice(0, 2) === "on" && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }

  function makeElement(doc, tag, attrs, children) {
    return appendChildren(setAttributes(doc.createElement(tag), attrs), children);
  }

  function makeSvg(doc, tag, attrs, children) {
    return appendChildren(setAttributes(doc.createElementNS("http://www.w3.org/2000/svg", tag), attrs), children);
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function format(value, digits) {
    if (value === null || value === undefined || !isFinite(value)) return "—";
    var places = digits === undefined ? 4 : digits;
    if (value !== 0 && Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4));
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function metric(doc, label) {
    var value = makeElement(doc, "strong", { text: "—" });
    return {
      node: makeElement(doc, "div", { className: "ec-metric" }, [makeElement(doc, "span", { text: label }), value]),
      value: value
    };
  }

  function statusCard(doc, label) {
    var value = makeElement(doc, "strong", { text: "—" });
    return {
      node: makeElement(doc, "div", { className: "ec-status-card" }, [makeElement(doc, "span", { text: label }), value]),
      value: value
    };
  }

  function announce(api, root, message) {
    if (api && typeof api.announce === "function") api.announce(root, message);
  }

  function marginChart(doc, result) {
    var width = 720;
    var height = 270;
    var left = 44;
    var right = 14;
    var top = 28;
    var bottom = 34;
    var chartWidth = width - left - right;
    var chartHeight = height - top - bottom;
    var count = Math.min(12, Math.max(8, result.params.N + 2));
    var values = result.rows.slice(0, count).map(function (row) { return row.margin; });
    var min = Math.min.apply(Math, [0].concat(values));
    var max = Math.max.apply(Math, [0].concat(values));
    var range = Math.max(1, max - min);
    var pad = range * 0.08;
    var yMin = min - pad;
    var yMax = max + pad;
    var zeroY = top + (yMax / (yMax - yMin)) * chartHeight;
    function mapY(value) {
      return top + ((yMax - value) / (yMax - yMin)) * chartHeight;
    }

    var svg = makeSvg(doc, "svg", {
      className: "ec-svg",
      width: width,
      height: height,
      viewBox: "0 0 " + width + " " + height,
      role: "img",
      "aria-label": "正弦模态双线性型余量图"
    });
    svg.appendChild(makeSvg(doc, "text", { x: left, y: 16, className: "ec-chart-title" }, "dₖ = λₖ + c；金色为共振，红色为负余量"));
    [0.25, 0.5, 0.75].forEach(function (fraction) {
      var y = top + chartHeight * fraction;
      svg.appendChild(makeSvg(doc, "line", { x1: left, y1: y, x2: left + chartWidth, y2: y, className: "ec-grid" }));
    });
    svg.appendChild(makeSvg(doc, "line", { x1: left, y1: zeroY, x2: left + chartWidth, y2: zeroY, className: "ec-zero" }));
    svg.appendChild(makeSvg(doc, "line", { x1: left, y1: top, x2: left, y2: top + chartHeight, className: "ec-axis" }));
    svg.appendChild(makeSvg(doc, "line", { x1: left, y1: top + chartHeight, x2: left + chartWidth, y2: top + chartHeight, className: "ec-axis" }));
    var step = chartWidth / count;
    values.forEach(function (value, index) {
      var row = result.rows[index];
      var x = left + index * step + step * 0.18;
      var barWidth = step * 0.64;
      var y = mapY(value);
      var className = "ec-bar" + (row.resonant ? " ec-resonant" : (value < 0 ? " ec-negative" : ""));
      svg.appendChild(makeSvg(doc, "rect", {
        x: x,
        y: Math.min(y, zeroY),
        width: barWidth,
        height: Math.max(1, Math.abs(zeroY - y)),
        className: className
      }));
      svg.appendChild(makeSvg(doc, "text", { x: x + barWidth / 2, y: top + chartHeight + 18, className: "ec-chart-label", "text-anchor": "middle" }, "k=" + row.k));
      if (row.resonant || index === 0) {
        svg.appendChild(makeSvg(doc, "text", { x: x + barWidth / 2, y: Math.max(top + 18, y - 5), className: "ec-chart-label", "text-anchor": "middle" }, format(value, 3)));
      }
    });
    svg.appendChild(makeSvg(doc, "text", { x: 7, y: top + 5, className: "ec-chart-label" }, format(yMax, 2)));
    svg.appendChild(makeSvg(doc, "text", { x: 7, y: top + chartHeight, className: "ec-chart-label" }, format(yMin, 2)));
    return svg;
  }

  function coefficientText(value, row, exact, result) {
    if (value === null) return exact && result.fullStatus === "no-solution" ? "不存在" : "—";
    if (row.resonant && exact && result.fullStatus === "multiple") return "0（可加 t）";
    if (row.resonant && !exact && result.finiteStatus === "multiple") return "0（取零）";
    return format(value, 5);
  }

  function renderLedger(doc, body, result) {
    clear(body);
    result.rows.forEach(function (row) {
      var tr = makeElement(doc, "tr", {
        className: (row.included ? "" : "ec-tail") + (row.resonant ? " ec-resonant" : "")
      });
      [
        row.k,
        format(row.lambda, 3),
        format(row.forcing, 5),
        format(row.margin, 5),
        coefficientText(row.finiteCoefficient, row, false, result),
        coefficientText(row.exactCoefficient, row, true, result),
        row.finiteResidual === null ? "—" : format(row.finiteResidual, 5)
      ].forEach(function (value) { tr.appendChild(makeElement(doc, "td", { text: String(value) })); });
      body.appendChild(tr);
    });
  }

  function interpretation(result) {
    var resonanceText = result.resonances.length
      ? "共振模态 k=" + result.resonances.map(function (row) { return row.k; }).join(",") + "。"
      : "本次参数没有落在 Dirichlet 特征值负点上。";
    if (result.fullStatus === "no-solution") {
      var finiteWarning = result.finiteStatus === "unique" && result.finiteComputable
        ? "第 " + result.params.N + " 阶有限矩阵仍可算，但它没有看见全模态相容性。"
        : "有限矩阵也报告不相容。";
      return resonanceText + " 对共振模态，fₖ≠0；Fredholm 相容性失败，所以全问题无解。" + finiteWarning + " 这不是有限维求解器报错，而是方程在核方向上的右端投影不为零。";
    }
    if (result.fullStatus === "multiple") {
      return resonanceText + " 右端在核上正交，因而有解；但可向任一共振特征函数加入自由参数，结论是多解。表中的 0 是规范代表，不是唯一系数。";
    }
    if (result.coercive) {
      return "全模态结论为唯一，且 α_H¹=" + format(result.alphaInfinite, 5) + ">0 给出 Lax–Milgram 证书。近共振时证书仍存在，但余量小，第一模态系数会对数据敏感。";
    }
    return resonanceText + " 全算子在本次非共振参数下仍可逆，所以结论是唯一；但双线性型不强制，Lax–Milgram 不能使用。" + (result.finiteComputable ? "本有限截断可算但无 Lax–Milgram 证书；有限模态演示不能冒充一般 PDE 证明。" : "");
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    installStyles(doc);
    SERIAL += 1;
    var prefix = "ec-" + SERIAL;
    var state = copyPreset(PRESETS[0]);
    var activePresetId = PRESETS[0].id;
    var predictions = { coercivity: null, near: null, compatible: null, incompatible: null, failure: null };
    var shell = makeElement(doc, "div", { className: "ec-lab" });
    shell.appendChild(makeElement(doc, "h3", { text: "正弦模态账本：强制性与共振" }));
    shell.appendChild(makeElement(doc, "p", { className: "ec-intro", text: "固定 Ω=(0,1)、u(0)=u(1)=0，用 φₖ=√2 sin(kπx) 对 −uʺ+cu=f 做确定性 Galerkin 计算。先预测 Fredholm 分支，再打开参数、余量、残差、系数和截断误差。" }));

    var form = makeElement(doc, "form", { className: "ec-prompt" });
    var fieldset = makeElement(doc, "fieldset");
    fieldset.appendChild(makeElement(doc, "legend", { text: "预测门：五项都回答后才揭示模态账本" }));
    var questions = [
      { key: "coercivity", prompt: "1. c>−π² 时，a(u,u)=∫(|u′|²+cu²) 在 H₀¹ 上是否强制？", expected: "yes", choices: [["yes", "是"], ["no", "否"], ["depends", "只看有限 N"]] },
      { key: "near", prompt: "2. c≈−π² 但不等于 −π²、f₁≠0 时，全问题更像哪一项？", expected: "unique-sensitive", choices: [["unique-sensitive", "唯一但敏感"], ["none", "无解"], ["many", "多解"]] },
      { key: "compatible", prompt: "3. c=−π² 且 f₁=0 时，第一模态的 Fredholm 结论是？", expected: "many", choices: [["unique", "唯一"], ["none", "无解"], ["many", "多解"]] },
      { key: "incompatible", prompt: "4. c=−π² 且 f₁≠0 时，第一模态方程 0·u₁=f₁ 会怎样？", expected: "none", choices: [["unique", "唯一"], ["none", "无解"], ["many", "多解"]] },
      { key: "failure", prompt: "5. c<−π² 但不在谱点：强制性失败是否自动推出算子不可逆？", expected: "no", choices: [["no", "不自动推出"], ["yes", "必然不可逆"], ["finite", "有限 N 可算就算可逆"]] }
    ];
    var choiceButtons = [];
    questions.forEach(function (question, index) {
      var questionSet = makeElement(doc, "fieldset", { className: "ec-question" });
      questionSet.appendChild(makeElement(doc, "legend", { text: question.prompt }));
      var row = makeElement(doc, "div", { className: "ec-choice-row", role: "group", "aria-label": question.prompt });
      question.choices.forEach(function (choice) {
        var button = makeElement(doc, "button", { type: "button", "aria-pressed": "false" }, choice[1]);
        button.addEventListener("click", function () {
          predictions[question.key] = choice[0];
          choiceButtons.forEach(function (item) {
            item.node.setAttribute("aria-pressed", predictions[item.key] === item.value ? "true" : "false");
          });
        });
        choiceButtons.push({ key: question.key, value: choice[0], node: button });
        row.appendChild(button);
      });
      questionSet.appendChild(row);
      fieldset.appendChild(questionSet);
    });
    form.appendChild(fieldset);
    var submit = makeElement(doc, "button", { type: "submit", className: "ec-primary" }, "提交预测并揭示");
    var clearPredictions = makeElement(doc, "button", { type: "button" }, "清空预测");
    form.appendChild(makeElement(doc, "div", { className: "ec-actions" }, [submit, clearPredictions]));
    var feedback = makeElement(doc, "p", { className: "ec-feedback", role: "status", "aria-live": "polite", text: "请完成五项预测。" });
    form.appendChild(feedback);
    shell.appendChild(form);

    var revealed = makeElement(doc, "section", { className: "ec-revealed", hidden: "hidden", "aria-label": "椭圆方程模态账本" });
    var layout = makeElement(doc, "div", { className: "ec-layout" });
    var controls = makeElement(doc, "div", { className: "ec-controls" });
    controls.appendChild(makeElement(doc, "h4", { text: "参数与教学分支" }));
    var presetGroup = makeElement(doc, "div", { className: "ec-presets", role: "group", "aria-label": "椭圆方程预设" });
    var presetButtons = [];
    PRESETS.forEach(function (preset) {
      var button = makeElement(doc, "button", { type: "button", "aria-pressed": "false" }, preset.label);
      button.addEventListener("click", function () {
        state = copyPreset(preset);
        activePresetId = preset.id;
        render();
      });
      presetButtons.push({ id: preset.id, node: button });
      presetGroup.appendChild(button);
    });
    controls.appendChild(presetGroup);

    var cId = prefix + "-c";
    var cOutput = makeElement(doc, "output", { for: cId, text: "" });
    var cInput = makeElement(doc, "input", { id: cId, type: "range", min: "-40", max: "8", step: "0.01", "aria-label": "零阶项 c" });
    controls.appendChild(makeElement(doc, "div", { className: "ec-control" }, [
      makeElement(doc, "label", { htmlFor: cId }, ["零阶项 c：", cOutput]),
      cInput,
      makeElement(doc, "div", { className: "ec-scale" }, [makeElement(doc, "span", { text: "−40" }), makeElement(doc, "span", { text: "8" })])
    ]));

    var nId = prefix + "-N";
    var nOutput = makeElement(doc, "output", { for: nId, text: "" });
    var nInput = makeElement(doc, "input", { id: nId, type: "range", min: "1", max: "12", step: "1", "aria-label": "Galerkin 截断阶数 N" });
    controls.appendChild(makeElement(doc, "div", { className: "ec-control" }, [
      makeElement(doc, "label", { htmlFor: nId }, ["Galerkin 截断 N：", nOutput]),
      nInput,
      makeElement(doc, "div", { className: "ec-scale" }, [makeElement(doc, "span", { text: "1" }), makeElement(doc, "span", { text: "12" })])
    ]));

    controls.appendChild(makeElement(doc, "div", { className: "ec-control" }, [makeElement(doc, "span", { className: "ec-control-title", text: "强迫分支" })]));
    var forcingGroup = makeElement(doc, "div", { className: "ec-forcings", role: "group", "aria-label": "强迫分支" });
    var forcingButtons = [];
    FORCINGS.forEach(function (forcing) {
      var button = makeElement(doc, "button", { type: "button", "aria-pressed": "false" }, forcing.label);
      button.addEventListener("click", function () {
        state.forcing = forcing.id;
        state.id = "custom";
        render();
      });
      forcingButtons.push({ id: forcing.id, node: button });
      forcingGroup.appendChild(button);
    });
    controls.appendChild(forcingGroup);
    var relock = makeElement(doc, "button", { type: "button" }, "重新预测");
    controls.appendChild(relock);
    layout.appendChild(controls);

    var stage = makeElement(doc, "div", { className: "ec-stage" });
    var frame = makeElement(doc, "div", { className: "ec-stage-frame" });
    frame.appendChild(makeElement(doc, "p", { className: "ec-formula", text: "φₖ=√2 sin(kπx),  λₖ=(kπ)²,  dₖ=a(φₖ,φₖ)=λₖ+c,  dₖuₖ=fₖ" }));
    var statusGrid = makeElement(doc, "div", { className: "ec-status-grid", "aria-label": "椭圆方程结论" });
    var fullStatus = statusCard(doc, "全模态 Fredholm 结论");
    var finiteStatus = statusCard(doc, "有限 N 矩阵");
    var certificateStatus = statusCard(doc, "Lax–Milgram 证书");
    statusGrid.appendChild(fullStatus.node);
    statusGrid.appendChild(finiteStatus.node);
    statusGrid.appendChild(certificateStatus.node);
    frame.appendChild(statusGrid);
    var metrics = [
      metric(doc, "最小模态余量 δ=π²+c"),
      metric(doc, "H₀¹ 强制常数 α"),
      metric(doc, "全谱最小 |dₖ|"),
      metric(doc, "第一模态系数 u₁"),
      metric(doc, "全方程残差 ||r_N||₂"),
      metric(doc, "能量/截断误差 ||(u−u_N)′||₂"),
      metric(doc, "有符号双线性型尾项 a(e_N,e_N)")
    ];
    frame.appendChild(makeElement(doc, "div", { className: "ec-metrics", "aria-label": "模态诊断" }, metrics.map(function (item) { return item.node; })));
    var chartFrame = makeElement(doc, "div", { className: "ec-chart-frame" });
    frame.appendChild(chartFrame);
    var ledger = makeElement(doc, "div", { className: "ec-ledger" });
    var table = makeElement(doc, "table");
    table.appendChild(makeElement(doc, "caption", { text: "模态账本：k≤N 是 Galerkin 系数；k>N 以零截断并显示精确模态尾项。" }));
    var head = makeElement(doc, "thead");
    var headRow = makeElement(doc, "tr");
    ["k", "λₖ", "fₖ", "dₖ=λₖ+c", "uₖ⁽ᴺ⁾", "uₖ（全模态）", "有限模态残差"].forEach(function (label) { headRow.appendChild(makeElement(doc, "th", { text: label })); });
    head.appendChild(headRow);
    table.appendChild(head);
    var body = makeElement(doc, "tbody");
    table.appendChild(body);
    ledger.appendChild(table);
    frame.appendChild(ledger);
    var interpretationNode = makeElement(doc, "p", { className: "ec-interpretation", role: "status", "aria-live": "polite", text: "" });
    frame.appendChild(interpretationNode);
    frame.appendChild(makeElement(doc, "p", { className: "ec-caution", text: "这里的误差来自已知正弦模态级数：它审计一维模型的代数与 Fredholm 分支，不是一般域上 Lax–Milgram、谱定理或正则性定理的证明。" }));
    stage.appendChild(frame);
    layout.appendChild(stage);
    revealed.appendChild(layout);
    shell.appendChild(revealed);
    clear(root);
    root.appendChild(shell);

    function updatePredictionButtons() {
      choiceButtons.forEach(function (item) {
        item.node.setAttribute("aria-pressed", predictions[item.key] === item.value ? "true" : "false");
      });
    }

    function setStatus(card, text, kind) {
      card.value.textContent = text;
      card.node.className = "ec-status-card " + (kind || "ec-neutral");
    }

    function render() {
      var result = evaluate(state);
      cInput.value = String(state.c);
      nInput.value = String(state.N);
      cOutput.textContent = format(state.c, 4) + "（−π²=" + format(-FIRST_EIGENVALUE, 4) + "）";
      nOutput.textContent = String(state.N);
      presetButtons.forEach(function (item) {
        item.node.setAttribute("aria-pressed", item.id === activePresetId && state.id !== "custom" ? "true" : "false");
      });
      forcingButtons.forEach(function (item) {
        item.node.setAttribute("aria-pressed", item.id === state.forcing ? "true" : "false");
      });
      setStatus(fullStatus, result.fullStatusLabel + (result.fullStatus === "multiple" ? "（核维数 " + result.resonances.length + "）" : ""), result.fullStatus === "unique" ? "ec-good" : "ec-warn");
      var finiteText = result.finiteStatusLabel;
      if (result.finiteComputable && !result.coercive && result.finiteStatus === "unique") finiteText = "本有限截断可算，但无 Lax–Milgram 证书";
      setStatus(finiteStatus, finiteText, result.finiteStatus === "no-solution" ? "ec-warn" : (result.finiteStatus === "multiple" ? "ec-neutral" : (result.coercive ? "ec-good" : "ec-warn")));
      setStatus(certificateStatus, result.laxMilgramCertificate ? "有（α>0）" : "无（强制性失败）", result.laxMilgramCertificate ? "ec-good" : "ec-warn");
      metrics[0].value.textContent = format(result.minimumModalMargin, 5);
      metrics[1].value.textContent = format(result.alphaInfinite, 5);
      metrics[2].value.textContent = format(result.minimumAbsoluteModalMargin, 5);
      metrics[3].value.textContent = result.firstCoefficient === null ? "—" : format(result.firstCoefficient, 5);
      metrics[4].value.textContent = result.fullResidualL2 === null ? "—（无解）" : format(result.fullResidualL2, 5);
      metrics[5].value.textContent = result.h1TruncationError === null ? "—（无解）" : format(result.h1TruncationError, 5);
      metrics[6].value.textContent = result.signedEnergyTail === null ? "—（无解）" : format(result.signedEnergyTail, 5);
      clear(chartFrame);
      chartFrame.appendChild(marginChart(doc, result));
      renderLedger(doc, body, result);
      interpretationNode.textContent = interpretation(result);
    }

    cInput.addEventListener("input", function () {
      state.c = Number(cInput.value);
      state.id = "custom";
      render();
    });
    nInput.addEventListener("input", function () {
      state.N = Number(nInput.value);
      state.id = "custom";
      render();
    });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var missing = questions.filter(function (question) { return !predictions[question.key]; });
      if (missing.length) {
        feedback.className = "ec-feedback ec-warn";
        feedback.textContent = "还差 " + missing.length + " 项预测。";
        return;
      }
      var correct = questions.filter(function (question) { return predictions[question.key] === question.expected; }).length;
      feedback.className = "ec-feedback " + (correct === questions.length ? "ec-pass" : "ec-warn");
      feedback.textContent = "已揭示：" + correct + "/" + questions.length + " 项与模态/Fredholm 账本一致。";
      revealed.removeAttribute("hidden");
      render();
      announce(api, root, feedback.textContent);
    });
    clearPredictions.addEventListener("click", function () {
      predictions = { coercivity: null, near: null, compatible: null, incompatible: null, failure: null };
      updatePredictionButtons();
      feedback.className = "ec-feedback";
      feedback.textContent = "预测已清空。";
    });
    relock.addEventListener("click", function () {
      revealed.setAttribute("hidden", "hidden");
      predictions = { coercivity: null, near: null, compatible: null, incompatible: null, failure: null };
      updatePredictionButtons();
      feedback.className = "ec-feedback";
      feedback.textContent = "已重新上锁，请再作五项预测。";
      announce(api, root, feedback.textContent);
    });
    render();
  }

  return {
    FIRST_EIGENVALUE: FIRST_EIGENVALUE,
    FORCINGS: FORCINGS,
    PRESETS: PRESETS,
    forcingCoefficient: forcingCoefficient,
    eigenvalue: eigenvalue,
    normalizeParams: normalizeParams,
    evaluate: evaluate,
    selfTest: selfTest,
    mount: mount
  };
});
