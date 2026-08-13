(function (hostWindow) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var INSTANCE_COUNT = 0;
  var EPSILON = 1e-9;
  var INITIAL = {
    x: 0.8,
    y: 0.4,
    z: Math.sqrt(0.2)
  };
  var DEFAULTS = {
    channel: "combined",
    time: 2,
    omega: 1.4,
    T1: 2,
    Tphi: 1.5
  };
  var CHANNELS = [
    { key: "unitary", label: "幺正进动", short: "只转相位" },
    { key: "dephasing", label: "纯退相位", short: "C 下降，z 不动" },
    { key: "amplitude", label: "振幅阻尼", short: "p₁ 向 0" },
    { key: "combined", label: "合并 T₁/Tφ", short: "进动 + 两种耗散" }
  ];
  var METRICS = [
    { key: "population", label: "布居 p₁", short: "激发态概率" },
    { key: "coherence", label: "相干 C", short: "2|ρ₀₁|" },
    { key: "purity", label: "纯度 Tr ρ²", short: "纯/混合" },
    { key: "energy", label: "相对能量 E", short: "E/(ℏω₀)=p₁" }
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

  function positive(value, fallback) {
    var parsed = number(value, fallback);
    return parsed > 0 ? parsed : fallback;
  }

  function t2FromRates(T1, Tphi) {
    var tOne = positive(T1, DEFAULTS.T1);
    var tPhi = positive(Tphi, DEFAULTS.Tphi);
    return 1 / (1 / (2 * tOne) + 1 / tPhi);
  }

  function evolve(channel, time, omega, T1, Tphi, initial) {
    var start = initial || INITIAL;
    var t = Math.max(0, number(time, 0));
    var angularRate = number(omega, DEFAULTS.omega);
    var tOne = positive(T1, DEFAULTS.T1);
    var tPhi = positive(Tphi, DEFAULTS.Tphi);
    var transverse;
    var z;
    var x;
    var y;
    var phase;
    var baseX;
    var baseY;

    if (channel === "dephasing") {
      transverse = Math.exp(-t / tPhi);
      z = start.z;
      x = start.x * transverse;
      y = start.y * transverse;
    } else if (channel === "amplitude" || channel === "combined") {
      transverse = channel === "combined"
        ? Math.exp(-t / t2FromRates(tOne, tPhi))
        : Math.exp(-t / (2 * tOne));
      z = 1 + (start.z - 1) * Math.exp(-t / tOne);
      baseX = start.x * transverse;
      baseY = start.y * transverse;
      if (channel === "combined") {
        phase = angularRate * t;
        x = baseX * Math.cos(phase) - baseY * Math.sin(phase);
        y = baseX * Math.sin(phase) + baseY * Math.cos(phase);
      } else {
        x = baseX;
        y = baseY;
      }
    } else {
      phase = angularRate * t;
      x = start.x * Math.cos(phase) - start.y * Math.sin(phase);
      y = start.x * Math.sin(phase) + start.y * Math.cos(phase);
      z = start.z;
    }

    return { x: x, y: y, z: z };
  }

  function densityFromBloch(vector) {
    return {
      rho00: (1 + vector.z) / 2,
      rho01Real: vector.x / 2,
      rho01Imag: -vector.y / 2,
      rho11: (1 - vector.z) / 2
    };
  }

  function diagnostics(vector) {
    var density = densityFromBloch(vector);
    var radiusSquared = Math.max(0, vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
    var transverseSquared = Math.max(0, vector.x * vector.x + vector.y * vector.y);
    var radius = Math.sqrt(radiusSquared);
    var transverse = Math.sqrt(transverseSquared);
    return {
      trace: density.rho00 + density.rho11,
      population: density.rho11,
      coherence: transverse,
      rho01Abs: transverse / 2,
      purity: (1 + radiusSquared) / 2,
      minEigenvalue: (1 - radius) / 2,
      energy: density.rho11,
      radius: radius,
      density: density
    };
  }

  function close(left, right, tolerance) {
    return Math.abs(left - right) <= (tolerance || 1e-8);
  }

  function changeFlags(channel, time, omega, T1, Tphi) {
    var before = diagnostics(INITIAL);
    var after = diagnostics(evolve(channel, time, omega, T1, Tphi, INITIAL));
    return {
      population: !close(after.population, before.population, 1e-8),
      coherence: !close(after.coherence, before.coherence, 1e-8),
      purity: !close(after.purity, before.purity, 1e-8),
      energy: !close(after.energy, before.energy, 1e-8)
    };
  }

  function numericSelfChecks() {
    var checks = [];
    var channels = ["unitary", "dephasing", "amplitude", "combined"];
    var initialDiagnostics = diagnostics(INITIAL);
    var t2 = t2FromRates(DEFAULTS.T1, DEFAULTS.Tphi);

    function record(name, value, expected, tolerance) {
      checks.push({
        name: name,
        value: value,
        expected: expected,
        ok: close(value, expected, tolerance || 2e-8)
      });
    }

    record("initial trace", initialDiagnostics.trace, 1);
    record("initial purity", initialDiagnostics.purity, 1);
    record("initial smallest eigenvalue", initialDiagnostics.minEigenvalue, 0);
    record("T2 reciprocal identity", 1 / t2, 1 / (2 * DEFAULTS.T1) + 1 / DEFAULTS.Tphi);

    var sampleTime = 0.7;
    var sampleAmplitude = evolve(
      "amplitude", sampleTime, DEFAULTS.omega, DEFAULTS.T1, DEFAULTS.Tphi, INITIAL
    );
    var sampleCombined = evolve(
      "combined", sampleTime, DEFAULTS.omega, DEFAULTS.T1, DEFAULTS.Tphi, INITIAL
    );
    record(
      "amplitude z(t) equilibrium",
      sampleAmplitude.z,
      1 + (INITIAL.z - 1) * Math.exp(-sampleTime / DEFAULTS.T1)
    );
    record(
      "combined transverse rate",
      diagnostics(sampleCombined).coherence,
      initialDiagnostics.coherence * Math.exp(-sampleTime / t2)
    );
    record(
      "combined z(t) equilibrium",
      sampleCombined.z,
      1 + (INITIAL.z - 1) * Math.exp(-sampleTime / DEFAULTS.T1)
    );

    channels.forEach(function (channel) {
      var atZero = diagnostics(evolve(
        channel, 0, DEFAULTS.omega, DEFAULTS.T1, DEFAULTS.Tphi, INITIAL
      ));
      record(channel + " t=0 trace", atZero.trace, 1);
      record(channel + " t=0 purity", atZero.purity, 1);
      record(channel + " t=0 smallest eigenvalue", atZero.minEigenvalue, 0);
      record(channel + " t=0 x", evolve(
        channel, 0, DEFAULTS.omega, DEFAULTS.T1, DEFAULTS.Tphi, INITIAL
      ).x, INITIAL.x);
      record(channel + " t=0 z", evolve(
        channel, 0, DEFAULTS.omega, DEFAULTS.T1, DEFAULTS.Tphi, INITIAL
      ).z, INITIAL.z);
    });

    var longDephasing = diagnostics(evolve(
      "dephasing", 1e6, DEFAULTS.omega, DEFAULTS.T1, DEFAULTS.Tphi, INITIAL
    ));
    record("dephasing long-time z", longDephasing.population, (1 - INITIAL.z) / 2);
    record("dephasing long-time purity", longDephasing.purity, (1 + INITIAL.z * INITIAL.z) / 2);
    record("dephasing long-time smallest eigenvalue", longDephasing.minEigenvalue, (1 - INITIAL.z) / 2);
    record("dephasing long-time coherence", longDephasing.coherence, 0);

    ["amplitude", "combined"].forEach(function (channel) {
      var longDamping = diagnostics(evolve(
        channel, 1e6, DEFAULTS.omega, DEFAULTS.T1, DEFAULTS.Tphi, INITIAL
      ));
      record(channel + " long-time population", longDamping.population, 0);
      record(channel + " long-time purity", longDamping.purity, 1);
      record(channel + " long-time smallest eigenvalue", longDamping.minEigenvalue, 0);
      record(channel + " long-time coherence", longDamping.coherence, 0);
    });

    channels.forEach(function (channel) {
      [0, 0.3, 1, 3, 10].forEach(function (time) {
        var minimum = diagnostics(evolve(
          channel, time, DEFAULTS.omega, DEFAULTS.T1, DEFAULTS.Tphi, INITIAL
        )).minEigenvalue;
        checks.push({
          name: channel + " positivity at t=" + time,
          value: minimum,
          expected: 0,
          ok: minimum >= -2e-9
        });
      });
    });

    var passed = checks.filter(function (check) { return check.ok; }).length;
    return {
      passed: passed,
      total: checks.length,
      ok: passed === checks.length,
      checks: checks
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      INITIAL: INITIAL,
      DEFAULTS: DEFAULTS,
      t2FromRates: t2FromRates,
      evolve: evolve,
      diagnostics: diagnostics,
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
      setAttributes(doc.createElementNS(SVG_NS, tag), attrs || {}), children, doc
    );
  }

  function format(api, value, digits) {
    if (api && typeof api.format === "function") return api.format(value, digits);
    var places = digits === undefined ? 3 : digits;
    if (!finite(value)) return "—";
    if (Math.abs(value) < 0.0005) value = 0;
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function formatComplex(api, real, imaginary) {
    var realText = format(api, real, 3);
    var magnitude = Math.abs(imaginary);
    if (magnitude < 0.0005) return realText;
    return realText + (imaginary >= 0 ? " + " : " − ") + format(api, magnitude, 3) + "i";
  }

  function channelInfo(key) {
    return CHANNELS.filter(function (channel) { return channel.key === key; })[0] || CHANNELS[3];
  }

  function injectStyles(doc) {
    if (doc.querySelector && doc.querySelector("style[data-lindblad-qubit-style]")) return;
    var style = doc.createElement("style");
    style.setAttribute("data-lindblad-qubit-style", "true");
    style.textContent = [
      ".lq-lab{--lq-fg:var(--fg,#292722);--lq-muted:var(--fg-soft,#6b6557);--lq-bg:var(--bg,#fff);--lq-panel:var(--block-bg,#f4f1e9);--lq-border:var(--border,#ded7c7);--lq-accent:var(--accent,#315f9d);--lq-green:var(--cl-green,#39734d);--lq-gold:var(--cl-gold,#9b6a12);--lq-red:var(--cl-red,#b64335);box-sizing:border-box;min-width:0;overflow:hidden;color:var(--lq-fg);font-size:.95em;line-height:1.5}",
      ".lq-lab *,.lq-lab *::before,.lq-lab *::after{box-sizing:border-box}",
      ".lq-lab .lq-shell{min-width:0}",
      ".lq-lab .lq-heading{margin:0 0 .25rem;color:var(--lq-accent);font-size:1.22rem}",
      ".lq-lab .lq-intro,.lq-lab .lq-note,.lq-lab .lq-status{color:var(--lq-muted)}",
      ".lq-lab .lq-intro{margin:0 0 1rem}",
      ".lq-lab .lq-layout{display:grid;grid-template-columns:minmax(0,1fr);gap:18px;align-items:start}",
      ".lq-lab .lq-controls,.lq-lab .lq-stage{min-width:0}",
      ".lq-lab .lq-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;align-items:start}",
      ".lq-lab .lq-section{min-width:0;margin:0;padding:10px;border-top:1px solid var(--lq-border)}",
      ".lq-lab .lq-section:last-child{grid-column:1 / -1}",
      ".lq-lab h4{margin:0 0 .45rem;font-size:1rem}",
      ".lq-lab .lq-small{margin:.45rem 0;color:var(--lq-muted);font-size:.86em}",
      ".lq-lab .lq-channel-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}",
      ".lq-lab button{min-width:0;min-height:44px;padding:7px 9px;border:1px solid var(--lq-border);border-radius:6px;background:var(--lq-bg);color:inherit;cursor:pointer;font:inherit;line-height:1.35;overflow-wrap:anywhere}",
      ".lq-lab button:hover:not(:disabled){border-color:var(--lq-accent)}",
      ".lq-lab button[aria-pressed=true],.lq-lab button.lq-primary{border-color:var(--lq-accent);background:var(--lq-accent);color:var(--lq-bg)}",
      ".lq-lab button:disabled{cursor:not-allowed;opacity:.55}",
      ".lq-lab button:focus-visible,.lq-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}",
      ".lq-lab .lq-field{display:grid;gap:4px;margin-top:.65rem}",
      ".lq-lab .lq-field-caption{display:flex;flex-wrap:wrap;justify-content:space-between;gap:6px;color:var(--lq-muted);font-size:.89em;font-weight:650}",
      ".lq-lab .lq-output{color:var(--lq-accent);font-variant-numeric:tabular-nums}",
      ".lq-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--lq-accent)}",
      ".lq-lab .lq-action-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:7px;margin-top:.8rem}",
      ".lq-lab .lq-predictions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}",
      ".lq-lab .lq-pred-row{display:grid;grid-template-columns:minmax(0,1fr) 92px 92px;gap:5px;align-items:stretch}",
      ".lq-lab .lq-pred-label{display:flex;align-items:center;min-width:0;padding:6px 4px;color:var(--lq-muted);font-size:.86em}",
      ".lq-lab .lq-pred-button{padding:5px 6px;font-size:.82em}",
      ".lq-lab .lq-pred-button.lq-correct{border-color:var(--lq-green);box-shadow:inset 0 0 0 1px var(--lq-green)}",
      ".lq-lab .lq-pred-button.lq-wrong{border-color:var(--lq-red);box-shadow:inset 0 0 0 1px var(--lq-red)}",
      ".lq-lab .lq-status{min-height:1.55em;margin:.7rem 0 0;font-size:.88em}",
      ".lq-lab .lq-stage-frame{min-width:0;padding:10px;border:1px solid var(--lq-border);border-radius:6px;background:var(--lq-bg)}",
      ".lq-lab .lq-stage-title{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;margin-bottom:7px;color:var(--lq-muted);font-size:.88em}",
      ".lq-lab .lq-svg{display:block;width:100%;max-width:100%;height:auto;color:var(--lq-fg)}",
      ".lq-lab .lq-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}",
      ".lq-lab .lq-svg .lq-axis{stroke:var(--lq-muted);stroke-width:1.2;stroke-dasharray:4 5}",
      ".lq-lab .lq-svg .lq-boundary{fill:none;stroke:var(--lq-border);stroke-width:2}",
      ".lq-lab .lq-svg .lq-vector{stroke:var(--lq-accent);stroke-width:4;stroke-linecap:round}",
      ".lq-lab .lq-svg .lq-vector-dot{fill:var(--lq-accent)}",
      ".lq-lab .lq-svg .lq-trace-z{fill:none;stroke:var(--lq-accent);stroke-width:2.4}",
      ".lq-lab .lq-svg .lq-trace-c{fill:none;stroke:var(--lq-green);stroke-width:2.4}",
      ".lq-lab .lq-svg .lq-trace-p{fill:none;stroke:var(--lq-gold);stroke-width:2.4}",
      ".lq-lab .lq-svg .lq-gridline{stroke:var(--lq-border);stroke-width:1}",
      ".lq-lab .lq-svg .lq-label-muted{fill:var(--lq-muted)!important;font-size:11px}",
      ".lq-lab .lq-svg .lq-label-accent{fill:var(--lq-accent)!important;font-weight:700}",
      ".lq-lab .lq-svg .lq-label-green{fill:var(--lq-green)!important;font-weight:700}",
      ".lq-lab .lq-svg .lq-label-gold{fill:var(--lq-gold)!important;font-weight:700}",
      ".lq-lab .lq-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(116px,1fr));gap:8px;margin-top:11px}",
      ".lq-lab .lq-metric{min-width:0;padding:8px;border-top:2px solid var(--lq-border);background:var(--lq-panel)}",
      ".lq-lab .lq-metric span{display:block;color:var(--lq-muted);font-size:11.5px;line-height:1.35}",
      ".lq-lab .lq-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
      ".lq-lab .lq-diagnostics{display:grid;grid-template-columns:minmax(190px,.9fr) minmax(0,1.1fr);gap:12px;margin-top:12px;align-items:start}",
      ".lq-lab .lq-card{min-width:0;padding:9px;border:1px solid var(--lq-border);background:var(--lq-panel)}",
      ".lq-lab .lq-card h4{color:var(--lq-accent);font-size:.93rem}",
      ".lq-lab .lq-matrix{width:100%;border-collapse:separate;border-spacing:4px;table-layout:fixed;margin:0;font-family:" +
        "\"SF Mono\",Menlo,Consolas,monospace;font-size:.82em}",
      ".lq-lab .lq-matrix td{padding:7px 4px;border:1px solid var(--lq-border);border-radius:4px;text-align:center;overflow-wrap:anywhere}",
      ".lq-lab .lq-ledger-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}",
      ".lq-lab .lq-ledger{width:100%;min-width:650px;border-collapse:collapse;font-size:.78em;font-variant-numeric:tabular-nums}",
      ".lq-lab .lq-ledger th,.lq-lab .lq-ledger td{padding:5px 4px;border:1px solid var(--lq-border);text-align:right;white-space:nowrap}",
      ".lq-lab .lq-ledger th{color:var(--lq-muted);background:var(--lq-bg);font-weight:700}",
      ".lq-lab .lq-checks{margin:.7rem 0 0;color:var(--lq-muted);font-size:.82em}",
      ".lq-lab .lq-good{color:var(--lq-green);font-weight:700}",
      ".lq-lab .lq-boundary{margin-top:12px;padding:9px 10px;border-left:3px solid var(--lq-gold);background:var(--lq-panel);color:var(--lq-muted);font-size:.86em}",
      ".lq-lab .lq-formula{margin:.65rem 0 0;padding:8px 10px;overflow-x:auto;border-left:3px solid var(--lq-accent);background:var(--lq-bg);font-family:\"SF Mono\",Menlo,Consolas,monospace;font-size:.82em;line-height:1.55}",
      "@media (max-width:760px){.lq-lab .lq-controls,.lq-lab .lq-predictions,.lq-lab .lq-diagnostics{grid-template-columns:minmax(0,1fr)}.lq-lab .lq-section:last-child{grid-column:auto}.lq-lab .lq-stage-frame{padding:7px}}",
      "@media (max-width:520px){.lq-lab .lq-channel-grid{grid-template-columns:minmax(0,1fr)}.lq-lab .lq-pred-row{grid-template-columns:minmax(0,1fr) 78px 78px}.lq-lab .lq-action-row{grid-template-columns:minmax(0,1fr)}}",
      "@media (prefers-reduced-motion:reduce){.lq-lab *{scroll-behavior:auto!important;transition:none!important;animation:none!important}}"
    ].join("");
    var host = doc.head || doc.documentElement || doc.body;
    if (host) host.appendChild(style);
  }

  function rangeField(api, doc, serial, id, label, min, max, step, value) {
    var wrapper = makeElement(api, doc, "label", { className: "lq-field", htmlFor: id + "-" + serial });
    var caption = makeElement(api, doc, "span", { className: "lq-field-caption" });
    var output = makeElement(api, doc, "output", {
      className: "lq-output",
      htmlFor: id + "-" + serial
    });
    caption.appendChild(makeElement(api, doc, "span", { text: label }));
    caption.appendChild(output);
    wrapper.appendChild(caption);
    var input = makeElement(api, doc, "input", {
      id: id + "-" + serial,
      type: "range",
      min: min,
      max: max,
      step: step,
      value: value,
      "aria-label": label
    });
    wrapper.appendChild(input);
    return { wrapper: wrapper, input: input, output: output };
  }

  function metricGrid(api, doc) {
    var grid = makeElement(api, doc, "div", { className: "lq-metrics" });
    var refs = {};
    [
      ["population", "激发态布居 p₁"],
      ["coherence", "相干 C=2|ρ₀₁|"],
      ["purity", "纯度 Tr(ρ²)"],
      ["minEigenvalue", "最小本征值"],
      ["trace", "迹 Tr ρ"],
      ["energy", "相对能量 E/(ℏω₀)"]
    ].forEach(function (item) {
      var card = makeElement(api, doc, "div", { className: "lq-metric" });
      card.appendChild(makeElement(api, doc, "span", { text: item[1] }));
      var value = makeElement(api, doc, "strong", { text: "—" });
      card.appendChild(value);
      grid.appendChild(card);
      refs[item[0]] = value;
    });
    return { node: grid, refs: refs };
  }

  function svgText(api, doc, group, x, y, text, attrs) {
    var merged = { x: x, y: y, "font-size": 11 };
    Object.keys(attrs || {}).forEach(function (key) { merged[key] = attrs[key]; });
    group.appendChild(makeSvg(api, doc, "text", merged, text));
  }

  function svgLine(api, doc, group, x1, y1, x2, y2, className, extra) {
    var attrs = { x1: x1, y1: y1, x2: x2, y2: y2 };
    if (className) attrs.className = className;
    Object.keys(extra || {}).forEach(function (key) { attrs[key] = extra[key]; });
    group.appendChild(makeSvg(api, doc, "line", attrs));
  }

  function pathForSeries(series, mapX, mapY) {
    return series.map(function (value, index) {
      return (index === 0 ? "M" : "L") + mapX(index, series.length).toFixed(2) + "," + mapY(value).toFixed(2);
    }).join(" ");
  }

  function drawChart(api, doc, group, series, label, className, top, mapY, rangeLabel) {
    var left = 326;
    var right = 735;
    var bottom = top + 47;
    var mid = top + 23.5;
    var i;
    svgText(api, doc, group, 286, top + 15, label, { className: className === "lq-trace-z" ? "lq-label-accent" : className === "lq-trace-c" ? "lq-label-green" : "lq-label-gold" });
    svgText(api, doc, group, 286, top + 31, rangeLabel, { className: "lq-label-muted", "font-size": 10 });
    svgLine(api, doc, group, left, top, right, top, "lq-gridline");
    svgLine(api, doc, group, left, mid, right, mid, "lq-gridline");
    svgLine(api, doc, group, left, bottom, right, bottom, "lq-gridline");
    for (i = 0; i < 5; i += 1) {
      var tickX = left + (right - left) * i / 4;
      svgLine(api, doc, group, tickX, bottom, tickX, bottom + 4, "lq-gridline");
    }
    group.appendChild(makeSvg(api, doc, "path", {
      className: className,
      d: pathForSeries(series, function (index, length) {
        return left + (right - left) * index / Math.max(1, length - 1);
      }, mapY)
    }));
  }

  function drawSvg(api, doc, svg, art, state, result, series, description) {
    var centerX = 146;
    var centerY = 128;
    var radius = 86;
    var vectorX = centerX + radius * result.vector.x;
    var vectorY = centerY - radius * result.vector.y;
    var zTop = 39;
    var zBottom = 217;
    var zY = zTop + (1 - (result.vector.z + 1) / 2) * (zBottom - zTop);
    var i;

    art.replaceChildren();
    art.appendChild(makeSvg(api, doc, "rect", {
      x: 0, y: 0, width: 760, height: 270, fill: "transparent"
    }));
    svgText(api, doc, art, 54, 21, "Bloch 向量的 x–y 投影", { className: "lq-label-muted", "font-size": 12 });
    art.appendChild(makeSvg(api, doc, "circle", {
      cx: centerX, cy: centerY, r: radius, className: "lq-boundary"
    }));
    art.appendChild(makeSvg(api, doc, "ellipse", {
      cx: centerX, cy: centerY, rx: radius, ry: radius * .32, className: "lq-boundary"
    }));
    svgLine(api, doc, art, centerX - radius, centerY, centerX + radius, centerY, "lq-axis");
    svgLine(api, doc, art, centerX, centerY - radius, centerX, centerY + radius, "lq-axis");
    svgText(api, doc, art, centerX + radius + 7, centerY + 4, "x", { className: "lq-label-muted" });
    svgText(api, doc, art, centerX + 5, centerY - radius - 7, "y", { className: "lq-label-muted" });
    svgText(api, doc, art, centerX - radius - 13, centerY + 4, "−", { className: "lq-label-muted" });
    svgText(api, doc, art, centerX + 5, centerY + radius + 16, "−", { className: "lq-label-muted" });
    svgLine(api, doc, art, centerX, centerY, vectorX, vectorY, "lq-vector");
    art.appendChild(makeSvg(api, doc, "circle", {
      cx: vectorX, cy: vectorY, r: 5, className: "lq-vector-dot"
    }));
    svgText(api, doc, art, 53, 241, "C=√(x²+y²)=" + format(api, result.diagnostics.coherence, 3), { className: "lq-label-accent" });
    svgText(api, doc, art, 53, 257, "|r|=" + format(api, result.diagnostics.radius, 3) + "；z=" + format(api, result.vector.z, 3), { className: "lq-label-muted" });

    svgText(api, doc, art, 228, 21, "z 轴（+1 为基态）", { className: "lq-label-muted", "font-size": 12 });
    svgLine(api, doc, art, 243, zTop, 243, zBottom, "lq-axis");
    svgLine(api, doc, art, 235, zTop, 251, zTop, "lq-axis");
    svgLine(api, doc, art, 235, zBottom, 251, zBottom, "lq-axis");
    svgText(api, doc, art, 256, zTop + 4, "+1", { className: "lq-label-muted" });
    svgText(api, doc, art, 256, zBottom + 4, "−1", { className: "lq-label-muted" });
    art.appendChild(makeSvg(api, doc, "circle", { cx: 243, cy: zY, r: 5, className: "lq-vector-dot" }));
    svgText(api, doc, art, 228, 238, "p₁=(1−z)/2=" + format(api, result.diagnostics.population, 3), { className: "lq-label-accent" });

    svgText(api, doc, art, 326, 21, "时间迹线（同一解析解）", { className: "lq-label-muted", "font-size": 12 });
    drawChart(api, doc, art, series.z, "z", "lq-trace-z", 31, function (value) {
      return 78 - ((value + 1) / 2) * 47;
    }, "−1…+1");
    drawChart(api, doc, art, series.coherence, "C", "lq-trace-c", 93, function (value) {
      return 140 - value * 47;
    }, "0…1");
    drawChart(api, doc, art, series.purity, "P", "lq-trace-p", 155, function (value) {
      return 202 - ((value - .5) / .5) * 47;
    }, ".5…1");
    svgText(api, doc, art, 326, 218, "0", { className: "lq-label-muted", "font-size": 10 });
    svgText(api, doc, art, 735, 218, state.time === 0 ? "t=0" : "t", { className: "lq-label-muted", "font-size": 10, "text-anchor": "end" });
    for (i = 0; i < 4; i += 1) {
      var legendX = 326 + i * 100;
      var legendClass = i === 0 ? "lq-trace-z" : i === 1 ? "lq-trace-c" : "lq-trace-p";
      if (i < 3) {
        svgLine(api, doc, art, legendX, 246, legendX + 19, 246, legendClass);
        svgText(api, doc, art, legendX + 24, 250, i === 0 ? "z" : i === 1 ? "C" : "P", { className: "lq-label-muted" });
      }
    }
    svg.textContent = "";
    svg.appendChild(makeSvg(api, doc, "title", { id: svg.getAttribute("aria-labelledby").split(" ")[0] }, "单比特 Bloch 向量、z 轴与时间迹线"));
    var desc = makeSvg(api, doc, "desc", { id: svg.getAttribute("aria-labelledby").split(" ")[1] }, description);
    svg.appendChild(desc);
    svg.appendChild(art);
  }

  function blankPredictions() {
    return { population: null, coherence: null, purity: null, energy: null };
  }

  function mount(root, api) {
    var doc = root.ownerDocument || document;
    var serial;
    var ids;
    var state;
    var refs = {};
    var selfChecks = numericSelfChecks();

    injectStyles(doc);
    root.classList.add("lq-lab");
    INSTANCE_COUNT += 1;
    serial = INSTANCE_COUNT;
    ids = {
      time: "lq-time-" + serial,
      omega: "lq-omega-" + serial,
      T1: "lq-t1-" + serial,
      Tphi: "lq-tphi-" + serial,
      svgTitle: "lq-svg-title-" + serial,
      svgDesc: "lq-svg-desc-" + serial
    };
    state = {
      channel: DEFAULTS.channel,
      time: DEFAULTS.time,
      omega: DEFAULTS.omega,
      T1: DEFAULTS.T1,
      Tphi: DEFAULTS.Tphi,
      predictions: blankPredictions(),
      checked: false
    };

    var shell = makeElement(api, doc, "div", { className: "lq-shell" });
    shell.appendChild(makeElement(api, doc, "h3", { className: "lq-heading" }, "单比特 Lindblad 账本：哪一种“变坏”？"));
    shell.appendChild(makeElement(api, doc, "p", { className: "lq-intro" }, "先选一种动力学，再预测布居、相干、纯度和能量是否改变；随后拖动时间与时标，用同一条 Bloch 向量、时间迹线和密度矩阵核对。全部数值由解析半群直接计算。"));

    var layout = makeElement(api, doc, "div", { className: "lq-layout" });
    var controls = makeElement(api, doc, "aside", { className: "lq-controls", "aria-label": "单比特动力学控制" });
    var stage = makeElement(api, doc, "section", { className: "lq-stage", "aria-label": "单比特动力学读数" });

    var channelSection = makeElement(api, doc, "div", { className: "lq-section" });
    channelSection.appendChild(makeElement(api, doc, "h4", { text: "动力学通道" }));
    channelSection.appendChild(makeElement(api, doc, "p", { className: "lq-small", text: "合并通道含 z 轴幺正进动 + 振幅阻尼 + 纯退相位。" }));
    var channelGrid = makeElement(api, doc, "div", { className: "lq-channel-grid", role: "group", "aria-label": "选择动力学通道" });
    CHANNELS.forEach(function (channel) {
      var button = makeElement(api, doc, "button", {
        type: "button",
        "aria-pressed": channel.key === state.channel ? "true" : "false",
        title: channel.short
      }, channel.label);
      channel.button = button;
      channelGrid.appendChild(button);
    });
    channelSection.appendChild(channelGrid);
    controls.appendChild(channelSection);

    var ratesSection = makeElement(api, doc, "div", { className: "lq-section" });
    ratesSection.appendChild(makeElement(api, doc, "h4", { text: "时间与速率" }));
    var timeField = rangeField(api, doc, serial, "lq-time", "观察时间 t", 0, 10, .1, DEFAULTS.time);
    var omegaField = rangeField(api, doc, serial, "lq-omega", "进动速率 Ω", 0, 4, .05, DEFAULTS.omega);
    var t1Field = rangeField(api, doc, serial, "lq-t1", "T₁（振幅弛豫）", .2, 8, .1, DEFAULTS.T1);
    var tphiField = rangeField(api, doc, serial, "lq-tphi", "Tφ（纯退相位）", .2, 8, .1, DEFAULTS.Tphi);
    ratesSection.appendChild(timeField.wrapper);
    ratesSection.appendChild(omegaField.wrapper);
    ratesSection.appendChild(t1Field.wrapper);
    ratesSection.appendChild(tphiField.wrapper);
    refs.time = timeField;
    refs.omega = omegaField;
    refs.T1 = t1Field;
    refs.Tphi = tphiField;
    refs.t2 = makeElement(api, doc, "p", { className: "lq-formula" });
    ratesSection.appendChild(refs.t2);
    var actionRow = makeElement(api, doc, "div", { className: "lq-action-row" });
    refs.reset = makeElement(api, doc, "button", { type: "button", className: "lq-primary" }, "重置默认");
    refs.checkButton = makeElement(api, doc, "button", { type: "button" }, "核对预测");
    actionRow.appendChild(refs.reset);
    actionRow.appendChild(refs.checkButton);
    ratesSection.appendChild(actionRow);
    controls.appendChild(ratesSection);

    var predictionSection = makeElement(api, doc, "div", { className: "lq-section" });
    predictionSection.appendChild(makeElement(api, doc, "h4", { text: "先预测：会变还是不变？" }));
    predictionSection.appendChild(makeElement(api, doc, "p", { className: "lq-small", text: "以固定初态和当前 t>0 为准；“相干 C”只看非对角元的模，不看它的相位。" }));
    var predictions = makeElement(api, doc, "div", { className: "lq-predictions" });
    METRICS.forEach(function (metric) {
      var row = makeElement(api, doc, "div", { className: "lq-pred-row" });
      row.appendChild(makeElement(api, doc, "span", { className: "lq-pred-label", title: metric.short }, metric.label));
      [true, false].forEach(function (value) {
        var button = makeElement(api, doc, "button", {
          type: "button",
          className: "lq-pred-button",
          "data-lq-prediction": metric.key,
          "data-lq-value": value ? "changed" : "same",
          "aria-pressed": "false"
        }, value ? "会变" : "不变");
        button.addEventListener("click", function () {
          state.predictions[metric.key] = value;
          state.checked = false;
          refs.status.textContent = "已记录“" + metric.label + "”：" + (value ? "会变" : "不变") + "；四项都选好后再核对。";
          render();
        });
        row.appendChild(button);
      });
      predictions.appendChild(row);
    });
    predictionSection.appendChild(predictions);
    refs.status = makeElement(api, doc, "p", { className: "lq-status", "aria-live": "polite" }, "先写下四项预测。");
    predictionSection.appendChild(refs.status);
    controls.appendChild(predictionSection);

    var frame = makeElement(api, doc, "div", { className: "lq-stage-frame" });
    var stageTitle = makeElement(api, doc, "div", { className: "lq-stage-title" });
    refs.stageMode = makeElement(api, doc, "span", { text: "—" });
    stageTitle.appendChild(refs.stageMode);
    stageTitle.appendChild(makeElement(api, doc, "span", { text: "初态 r₀=(0.8, 0.4, √0.2)，纯态" }));
    frame.appendChild(stageTitle);
    refs.svg = makeSvg(api, doc, "svg", {
      className: "lq-svg",
      viewBox: "0 0 760 270",
      role: "img",
      "aria-labelledby": ids.svgTitle + " " + ids.svgDesc
    });
    refs.svg.appendChild(makeSvg(api, doc, "title", { id: ids.svgTitle }, "单比特 Bloch 向量、z 轴与时间迹线"));
    refs.svg.appendChild(makeSvg(api, doc, "desc", { id: ids.svgDesc }, "解析演化的 Bloch 向量与 z、相干、纯度三条时间迹线。"));
    refs.art = makeSvg(api, doc, "g", {});
    refs.svg.appendChild(refs.art);
    frame.appendChild(refs.svg);
    var metrics = metricGrid(api, doc);
    refs.metric = metrics.refs;
    frame.appendChild(metrics.node);
    var diagnosticsCard = makeElement(api, doc, "div", { className: "lq-diagnostics" });
    var matrixCard = makeElement(api, doc, "section", { className: "lq-card" });
    matrixCard.appendChild(makeElement(api, doc, "h4", { text: "当前密度矩阵 ρ" }));
    refs.matrix = makeElement(api, doc, "table", { className: "lq-matrix", "aria-label": "当前密度矩阵" });
    var matrixBody = makeElement(api, doc, "tbody");
    refs.matrixCells = [];
    [0, 1].forEach(function () {
      var row = makeElement(api, doc, "tr");
      [0, 1].forEach(function () {
        var cell = makeElement(api, doc, "td", { text: "—" });
        row.appendChild(cell);
        refs.matrixCells.push(cell);
      });
      matrixBody.appendChild(row);
    });
    refs.matrix.appendChild(matrixBody);
    matrixCard.appendChild(refs.matrix);
    matrixCard.appendChild(makeElement(api, doc, "p", { className: "lq-small", text: "ρ₀₁=(x−iy)/2；迹、纯度与本征值直接由这张 2×2 矩阵读出。" }));
    diagnosticsCard.appendChild(matrixCard);
    var ledgerCard = makeElement(api, doc, "section", { className: "lq-card" });
    ledgerCard.appendChild(makeElement(api, doc, "h4", { text: "确定性时间账本" }));
    var ledgerWrap = makeElement(api, doc, "div", { className: "lq-ledger-wrap" });
    refs.ledger = makeElement(api, doc, "table", { className: "lq-ledger", "aria-label": "单比特时间账本" });
    refs.ledger.appendChild(makeElement(api, doc, "thead", {}, makeElement(api, doc, "tr", {}, [
      makeElement(api, doc, "th", { scope: "col" }, "τ"),
      makeElement(api, doc, "th", { scope: "col" }, "x"),
      makeElement(api, doc, "th", { scope: "col" }, "y"),
      makeElement(api, doc, "th", { scope: "col" }, "z"),
      makeElement(api, doc, "th", { scope: "col" }, "p₁"),
      makeElement(api, doc, "th", { scope: "col" }, "C"),
      makeElement(api, doc, "th", { scope: "col" }, "P"),
      makeElement(api, doc, "th", { scope: "col" }, "λmin")
    ])));
    refs.ledgerBody = makeElement(api, doc, "tbody");
    refs.ledger.appendChild(refs.ledgerBody);
    ledgerWrap.appendChild(refs.ledger);
    ledgerCard.appendChild(ledgerWrap);
    diagnosticsCard.appendChild(ledgerCard);
    frame.appendChild(diagnosticsCard);
    refs.checkReadout = makeElement(api, doc, "p", { className: "lq-checks" });
    frame.appendChild(refs.checkReadout);
    frame.appendChild(makeElement(api, doc, "div", { className: "lq-boundary" }, "边界提醒：纯退相位让非对角元变小但不拿走能量；振幅阻尼改变 z、布居和能量；两者都不是一次性测量的条件坍缩。这里没有随机抽样，也没有用 Euler 步进。"));
    stage.appendChild(frame);
    layout.appendChild(controls);
    layout.appendChild(stage);
    shell.appendChild(layout);
    root.replaceChildren(shell);

    function readInputs() {
      state.time = clamp(number(refs.time.input.value, state.time), 0, 10);
      state.omega = clamp(number(refs.omega.input.value, state.omega), 0, 4);
      state.T1 = clamp(number(refs.T1.input.value, state.T1), .2, 8);
      state.Tphi = clamp(number(refs.Tphi.input.value, state.Tphi), .2, 8);
    }

    function announce(message) {
      if (api && typeof api.announce === "function") {
        try { api.announce(root, message); } catch (error) { /* optional */ }
      }
    }

    function renderPredictionButtons(expected) {
      Array.prototype.slice.call(root.querySelectorAll("[data-lq-prediction]")).forEach(function (button) {
        var key = button.getAttribute("data-lq-prediction");
        var value = button.getAttribute("data-lq-value") === "changed";
        var selected = state.predictions[key] === value;
        button.setAttribute("aria-pressed", selected ? "true" : "false");
        button.classList.remove("lq-correct", "lq-wrong");
        if (state.checked && selected) {
          button.classList.add(value === expected[key] ? "lq-correct" : "lq-wrong");
        }
      });
    }

    function renderMatrix(diagnosticsValue) {
      var density = diagnosticsValue.density;
      var cells = [
        format(api, density.rho00, 3),
        formatComplex(api, density.rho01Real, density.rho01Imag),
        formatComplex(api, density.rho01Real, -density.rho01Imag),
        format(api, density.rho11, 3)
      ];
      cells.forEach(function (value, index) { refs.matrixCells[index].textContent = value; });
    }

    function renderLedger() {
      var times = [0, state.time / 4, state.time / 2, state.time * 3 / 4, state.time];
      refs.ledgerBody.replaceChildren();
      times.forEach(function (time, index) {
        var vector = evolve(state.channel, time, state.omega, state.T1, state.Tphi, INITIAL);
        var value = diagnostics(vector);
        var cells = [
          index === 0 ? "0" : index === 4 ? "t" : "" + index + "t/4",
          format(api, vector.x, 3),
          format(api, vector.y, 3),
          format(api, vector.z, 3),
          format(api, value.population, 3),
          format(api, value.coherence, 3),
          format(api, value.purity, 3),
          format(api, value.minEigenvalue, 3)
        ];
        var row = makeElement(api, doc, "tr");
        cells.forEach(function (cell) { row.appendChild(makeElement(api, doc, "td", { text: cell })); });
        refs.ledgerBody.appendChild(row);
      });
    }

    function render() {
      var vector;
      var value;
      var expected;
      var info;
      var series = { z: [], coherence: [], purity: [] };
      var sampleCount = 61;
      var index;
      var sampleTime;
      readInputs();
      vector = evolve(state.channel, state.time, state.omega, state.T1, state.Tphi, INITIAL);
      value = diagnostics(vector);
      expected = changeFlags(state.channel, state.time, state.omega, state.T1, state.Tphi);
      info = channelInfo(state.channel);
      refs.stageMode.textContent = info.label + " · t=" + format(api, state.time, 2);
      refs.time.output.textContent = format(api, state.time, 2);
      refs.omega.output.textContent = format(api, state.omega, 2);
      refs.T1.output.textContent = format(api, state.T1, 2);
      refs.Tphi.output.textContent = format(api, state.Tphi, 2);
      refs.t2.textContent = "1/T₂ = 1/(2T₁)+1/Tφ = " + format(api, 1 / (2 * state.T1) + 1 / state.Tphi, 3) + "；T₂=" + format(api, t2FromRates(state.T1, state.Tphi), 3);
      CHANNELS.forEach(function (channel) {
        channel.button.setAttribute("aria-pressed", channel.key === state.channel ? "true" : "false");
      });
      refs.metric.population.textContent = format(api, value.population, 3);
      refs.metric.coherence.textContent = format(api, value.coherence, 3);
      refs.metric.purity.textContent = format(api, value.purity, 3);
      refs.metric.minEigenvalue.textContent = format(api, value.minEigenvalue, 3);
      refs.metric.trace.textContent = format(api, value.trace, 3);
      refs.metric.energy.textContent = format(api, value.energy, 3);
      renderMatrix(value);
      renderLedger();
      for (index = 0; index < sampleCount; index += 1) {
        sampleTime = state.time * index / (sampleCount - 1);
        var sampleVector = evolve(state.channel, sampleTime, state.omega, state.T1, state.Tphi, INITIAL);
        var sampleDiagnostics = diagnostics(sampleVector);
        series.z.push(sampleVector.z);
        series.coherence.push(sampleDiagnostics.coherence);
        series.purity.push(sampleDiagnostics.purity);
      }
      var description = info.label + "；当前 t=" + format(api, state.time, 2) + "，Bloch 向量为 (" +
        format(api, vector.x, 3) + ", " + format(api, vector.y, 3) + ", " + format(api, vector.z, 3) +
        ")；迹=" + format(api, value.trace, 3) + "，纯度=" + format(api, value.purity, 3) +
        "，最小本征值=" + format(api, value.minEigenvalue, 3) + "。";
      drawSvg(api, doc, refs.svg, refs.art, state, { vector: vector, diagnostics: value }, series, description);
      renderPredictionButtons(expected);
      if (state.checked) {
        var selected = METRICS.map(function (metric) { return state.predictions[metric.key] !== null; });
        if (selected.every(function (item) { return item; })) {
          var correct = METRICS.filter(function (metric) {
            return state.predictions[metric.key] === expected[metric.key];
          }).length;
          refs.status.textContent = "预测核对：" + correct + "/4 正确。答案按当前 t 与时标计算；“会变”指相对 t=0 的诊断量改变。";
        }
      }
      refs.checkReadout.textContent = "解析自检：" + selfChecks.passed + "/" + selfChecks.total + " 通过；t=0 保持 Trρ=1、纯度=1、λmin=0，长时间极限也保持半正定。";
    }

    CHANNELS.forEach(function (channel) {
      channel.button.addEventListener("click", function () {
        state.channel = channel.key;
        state.predictions = blankPredictions();
        state.checked = false;
        refs.status.textContent = "已切换到“" + channel.label + "”；先预测四个量。";
        render();
        announce("已切换到" + channel.label + "，请先预测四个诊断量。");
      });
    });
    [refs.time.input, refs.omega.input, refs.T1.input, refs.Tphi.input].forEach(function (input) {
      input.addEventListener("input", function () {
        state.checked = false;
        state.predictions = blankPredictions();
        render();
      });
    });
    refs.checkButton.addEventListener("click", function () {
      var complete = METRICS.every(function (metric) { return state.predictions[metric.key] !== null; });
      if (!complete) {
        refs.status.textContent = "还缺预测：请为布居、相干、纯度、能量各选“会变”或“不变”。";
        announce("请先完成四项预测。");
        return;
      }
      state.checked = true;
      render();
      announce(refs.status.textContent);
    });
    refs.reset.addEventListener("click", function () {
      state.channel = DEFAULTS.channel;
      state.time = DEFAULTS.time;
      state.omega = DEFAULTS.omega;
      state.T1 = DEFAULTS.T1;
      state.Tphi = DEFAULTS.Tphi;
      state.predictions = blankPredictions();
      state.checked = false;
      refs.time.input.value = DEFAULTS.time;
      refs.omega.input.value = DEFAULTS.omega;
      refs.T1.input.value = DEFAULTS.T1;
      refs.Tphi.input.value = DEFAULTS.Tphi;
      refs.status.textContent = "已重置；先写下合并通道的四项预测。";
      render();
      announce("实验台已重置。");
    });
    render();
  }

  if (hostWindow.CourseLearning && typeof hostWindow.CourseLearning.register === "function") {
    hostWindow.CourseLearning.register("lindblad-qubit", mount);
  }
})(typeof window !== "undefined" ? window : null);
