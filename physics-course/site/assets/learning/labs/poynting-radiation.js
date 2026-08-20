(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("poynting-radiation", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("poynting-radiation self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("poynting-radiation self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(
  typeof window !== "undefined"
    ? window
    : typeof globalThis !== "undefined"
      ? globalThis
      : this,
  function (host) {
    "use strict";

    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "poynting-radiation-lab-styles";
    var INSTANCE = 0;
    var EPS = 1e-10;
    var PI = Math.PI;

    var WAVE_PRESETS = [
      {
        id: "correct",
        label: "正确平面波",
        note: "E=x̂，B=ŷ，k=+ẑ；E×B 与 +k 同向。",
        e: [1, 0, 0],
        b: [0, 1, 0],
        k: [0, 0, 1]
      },
      {
        id: "reverse-b",
        label: "B 反向",
        note: "E=x̂，B=−ŷ；振幅比仍可能正确，但能流反向。",
        e: [1, 0, 0],
        b: [0, -1, 0],
        k: [0, 0, 1]
      },
      {
        id: "longitudinal",
        label: "纵向 E",
        note: "E 与 k 平行；它不是无源真空平面波。",
        e: [0, 0, 1],
        b: [0, 0, 0],
        k: [0, 0, 1]
      }
    ];

    var STYLE_TEXT = [
      ".pr-lab{max-width:100%;min-width:0;color:var(--fg,#20252b);line-height:1.55;overflow-wrap:anywhere}.pr-lab *,.pr-lab *::before,.pr-lab *::after{box-sizing:border-box}.pr-lab [hidden]{display:none!important}",
      ".pr-lab h3,.pr-lab h4{margin:0;color:var(--fg,#20252b);letter-spacing:0}.pr-lab h3{font-size:1.12rem}.pr-lab h4{font-size:1rem}.pr-lab p{margin:8px 0}.pr-lab .pr-note,.pr-lab .pr-feedback,.pr-lab .pr-status{color:var(--fg-soft,var(--muted,#5d6873));font-size:13px;line-height:1.65}",
      ".pr-lab button,.pr-lab input{font:inherit}.pr-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#c8cdd3);border-radius:6px;background:var(--bg,#fff);color:var(--fg,#20252b);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.pr-lab button:hover{border-color:var(--accent,#1769aa)}.pr-lab button:focus-visible,.pr-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.pr-lab button[aria-pressed=true],.pr-lab button.pr-primary{border-color:var(--accent,#1769aa);background:var(--accent,#1769aa);color:var(--bg,#fff);font-weight:750}.pr-lab button:disabled{cursor:not-allowed;opacity:.55}",
      ".pr-lab .pr-mode-tabs,.pr-lab .pr-presets{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin:10px 0}.pr-lab .pr-presets{grid-template-columns:repeat(3,minmax(0,1fr))}.pr-lab .pr-mode-tabs button,.pr-lab .pr-presets button{font-size:12px}.pr-lab .pr-controls{display:grid;grid-template-columns:minmax(0,1fr) minmax(210px,.75fr);gap:12px;align-items:end;margin:12px 0}.pr-lab .pr-control{min-width:0;display:grid;gap:4px}.pr-lab .pr-control label{color:var(--fg-soft,var(--muted,#5d6873));font-size:12.5px;font-weight:700}.pr-lab .pr-control output{color:var(--accent,#1769aa);font-variant-numeric:tabular-nums}.pr-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent,#1769aa)}",
      ".pr-lab .pr-prediction{margin:14px 0;padding:12px 14px;border-left:3px solid var(--cl-gold,#9a6b12);background:var(--block-bg,var(--bg,#fff))}.pr-lab .pr-prediction-title{display:block;margin-bottom:8px;font-size:13px}.pr-lab .pr-question{margin:10px 0}.pr-lab .pr-question-label{display:block;margin-bottom:6px;font-size:13px;font-weight:700}.pr-lab .pr-choice-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.pr-lab .pr-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.pr-lab .pr-pass{color:var(--cl-green,#2f7547)}.pr-lab .pr-warn{color:var(--cl-red,#b43d32)}.pr-lab .pr-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.pr-lab .pr-actions>*{flex:1 1 160px}",
      ".pr-lab .pr-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border,#c8cdd3)}.pr-lab .pr-metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:12px 0}.pr-lab .pr-metric{min-width:0;padding:8px;border-top:2px solid var(--border,#c8cdd3);background:var(--block-bg,var(--bg,#fff))}.pr-lab .pr-metric:nth-child(5n+1){border-color:var(--cl-blue,#2c6aa0)}.pr-lab .pr-metric:nth-child(5n+2){border-color:var(--cl-red,#b43d32)}.pr-lab .pr-metric:nth-child(5n+3){border-color:var(--cl-green,#2f7547)}.pr-lab .pr-metric:nth-child(5n+4){border-color:var(--cl-gold,#9a6b12)}.pr-lab .pr-metric:nth-child(5n){border-color:var(--cl-purple,#7052a3)}.pr-lab .pr-metric span{display:block;color:var(--fg-soft,var(--muted,#5d6873));font-size:11px;line-height:1.4}.pr-lab .pr-metric strong{display:block;margin-top:3px;font-size:13px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
      ".pr-lab .pr-stage{min-width:0;padding:8px;border:1px solid var(--border,#c8cdd3);border-radius:6px;background:var(--block-bg,var(--bg,#fff))}.pr-lab .pr-frame{max-width:100%;overflow-x:auto}.pr-lab .pr-svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg,#20252b)}.pr-lab .pr-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.pr-lab .pr-svg .pr-axis{stroke:currentColor;stroke-opacity:.58;stroke-width:1.1}.pr-lab .pr-svg .pr-grid{stroke:currentColor;stroke-opacity:.16;stroke-width:1}.pr-lab .pr-svg .pr-e{stroke:var(--cl-red,#b43d32);stroke-width:3;stroke-linecap:round}.pr-lab .pr-svg .pr-b{stroke:var(--cl-blue,#2c6aa0);stroke-width:3;stroke-linecap:round}.pr-lab .pr-svg .pr-k{stroke:var(--cl-green,#2f7547);stroke-width:3;stroke-linecap:round}.pr-lab .pr-svg .pr-s{stroke:var(--cl-gold,#9a6b12);stroke-width:3;stroke-linecap:round}.pr-lab .pr-svg .pr-lobe{fill:var(--cl-blue,#2c6aa0);fill-opacity:.16;stroke:var(--cl-blue,#2c6aa0);stroke-width:2}.pr-lab .pr-svg .pr-current{fill:var(--cl-red,#b43d32);stroke:var(--bg,#fff);stroke-width:2}.pr-lab .pr-svg .pr-text{font-size:11px}.pr-lab .pr-svg .pr-small{font-size:10px;fill:var(--fg-soft,var(--muted,#5d6873))}.pr-lab .pr-svg .pr-title{font-size:12px;font-weight:750}",
      ".pr-lab .pr-ledger-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:12px}.pr-lab table{width:100%;min-width:760px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.pr-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft,var(--muted,#5d6873));font-size:12px}.pr-lab th,.pr-lab td{padding:7px 8px;border-bottom:1px solid var(--border,#c8cdd3);text-align:left;vertical-align:top}.pr-lab th{color:var(--fg-soft,var(--muted,#5d6873));font-size:11.5px}.pr-lab .pr-interpretation{margin-top:10px;padding:10px 12px;border-left:3px solid var(--cl-green,#2f7547);background:var(--block-bg,var(--bg,#fff));font-size:13px;line-height:1.65}",
      "@media(max-width:940px){.pr-lab .pr-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}.pr-lab .pr-choice-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}",
      "@media(max-width:680px){.pr-lab .pr-controls{grid-template-columns:minmax(0,1fr)}}",
      "@media(max-width:500px){.pr-lab .pr-presets,.pr-lab .pr-metrics,.pr-lab .pr-choice-grid{grid-template-columns:minmax(0,1fr)}.pr-lab .pr-prediction{padding:10px}.pr-lab .pr-stage{padding:4px}}",
      "@media(prefers-reduced-motion:reduce){.pr-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
    ].join("\n");

    function finite(value) {
      return typeof value === "number" && Number.isFinite(value);
    }

    function close(a, b, tolerance) {
      return Math.abs(a - b) <= (tolerance === undefined ? 1e-9 : tolerance);
    }

    function clamp(value, minimum, maximum) {
      return Math.max(minimum, Math.min(maximum, value));
    }

    function add(a, b) {
      return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    }

    function subtract(a, b) {
      return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    }

    function scale(a, factor) {
      return [a[0] * factor, a[1] * factor, a[2] * factor];
    }

    function dot(a, b) {
      return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    }

    function cross(a, b) {
      return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    }

    function magnitude(a) {
      return Math.sqrt(dot(a, a));
    }

    function unit(a) {
      var length = magnitude(a);
      return length > EPS ? scale(a, 1 / length) : null;
    }

    function vectorError(a, b) {
      return magnitude(subtract(a, b));
    }

    function wavePresetById(id) {
      var found = WAVE_PRESETS[0];
      WAVE_PRESETS.forEach(function (preset) {
        if (preset.id === id) found = preset;
      });
      return found;
    }

    function normalizeWave(input) {
      var raw = input || {};
      var preset = wavePresetById(raw.preset || raw.presetId);
      var phase = Number(raw.phase === undefined ? 0 : raw.phase);
      var amplitude = Number(raw.amplitude === undefined ? 1 : raw.amplitude);
      return {
        presetId: preset.id,
        label: preset.label,
        note: preset.note,
        e: scale(preset.e, finite(amplitude) ? amplitude : 1),
        b: scale(preset.b, finite(amplitude) ? amplitude : 1),
        k: preset.k.slice(),
        phase: finite(phase) ? phase : 0,
        c: 1,
        mu0: 1
      };
    }

    function evaluateWave(input) {
      var config = normalizeWave(input);
      var kHat = unit(config.k);
      var expectedB = scale(cross(kHat, config.e), 1 / config.c);
      var eInstant = scale(config.e, Math.cos(config.phase));
      var bInstant = scale(config.b, Math.cos(config.phase));
      var instantaneousPoynting = scale(cross(eInstant, bInstant), 1 / config.mu0);
      var averagePoynting = scale(cross(config.e, config.b), 0.5 / config.mu0);
      var eMagnitude = magnitude(config.e);
      var bMagnitude = magnitude(config.b);
      var ratio = bMagnitude > EPS ? eMagnitude / (config.c * bMagnitude) : (eMagnitude > EPS ? Infinity : 0);
      var averageDirection = unit(averagePoynting);
      var checks = {
        transverseE: Math.abs(dot(kHat, config.e)) <= EPS,
        transverseB: Math.abs(dot(kHat, config.b)) <= EPS,
        faraday: vectorError(config.b, expectedB) <= EPS,
        amplitude: finite(ratio) && close(ratio, 1, EPS),
        poyntingDirection: Boolean(averageDirection && dot(averageDirection, kHat) > 1 - EPS),
        energyFlow: Boolean(averageDirection && magnitude(averagePoynting) > EPS),
        timeAverage: close(averagePoynting[2], 0.5 * cross(config.e, config.b)[2], EPS)
      };
      return {
        mode: "wave",
        config: config,
        expectedB: expectedB,
        eInstant: eInstant,
        bInstant: bInstant,
        instantaneousPoynting: instantaneousPoynting,
        averagePoynting: averagePoynting,
        ratio: ratio,
        checks: checks,
        valid: Object.keys(checks).every(function (key) { return checks[key]; })
      };
    }

    function complexMagnitude(value) {
      return Math.hypot(value.re, value.im);
    }

    function complexDifference(a, b) {
      return Math.hypot(a.re - b.re, a.im - b.im);
    }

    function realOfProductWithConjugate(a, b) {
      return a.re * b.re + a.im * b.im;
    }

    function dipoleZone(kr) {
      if (kr < 1) return { id: "near", label: "近场 / 源附近（kr<1）", note: "1/r³ 与 1/r² 项不可忽略；点偶极源尺寸仍须远小于 λ。" };
      if (kr < 6) return { id: "transition", label: "过渡区（kr≈1–6）", note: "近场和辐射项都可能可见，不能直接套纯远场方向图。" };
      return { id: "far", label: "辐射区（kr≫1 的教学阈值）", note: "1/r 辐射项主导；时间平均能流近似径向向外。" };
    }

    function normalizeDipole(input) {
      var raw = input || {};
      var theta = Number(raw.theta === undefined ? PI / 3 : raw.theta);
      var kr = Number(raw.kr === undefined ? 8 : raw.kr);
      var omega = Number(raw.omega === undefined ? 1 : raw.omega);
      var p0 = Number(raw.p0 === undefined ? 1 : raw.p0);
      return {
        theta: clamp(finite(theta) ? theta : PI / 3, 0, PI),
        kr: clamp(finite(kr) ? kr : 8, 0.2, 12),
        omega: finite(omega) && omega > 0 ? omega : 1,
        p0: finite(p0) && p0 > 0 ? p0 : 1,
        c: 1,
        epsilon0: 1,
        mu0: 1
      };
    }

    function evaluateDipole(input) {
      var config = normalizeDipole(input);
      var sinTheta = Math.sin(config.theta);
      var cosTheta = Math.cos(config.theta);
      var k = config.omega / config.c;
      var r = config.kr / k;
      var commonE = config.p0 / (4 * PI * config.epsilon0);
      var nearReal = 1 / (r * r * r);
      var nearImag = -k / (r * r);
      var eRadial = { re: commonE * 2 * cosTheta * nearReal, im: commonE * 2 * cosTheta * nearImag };
      var eTheta = { re: commonE * sinTheta * (nearReal - (k * k) / r), im: commonE * sinTheta * nearImag };
      var commonB = -config.mu0 * config.p0 * config.omega * sinTheta / (4 * PI);
      var bPhi = { re: commonB * k / r, im: commonB / (r * r) };
      var eFar = { re: -commonE * sinTheta * k * k / r, im: 0 };
      var bFar = { re: -config.mu0 * config.p0 * config.omega * sinTheta * k / (4 * PI * r), im: 0 };
      var radialS = 0.5 * realOfProductWithConjugate(eTheta, bPhi) / config.mu0;
      var thetaS = -0.5 * realOfProductWithConjugate(eRadial, bPhi) / config.mu0;
      var differentialPower = config.p0 * config.p0 * Math.pow(config.omega, 4) * sinTheta * sinTheta / (32 * PI * PI * config.epsilon0 * Math.pow(config.c, 3));
      var totalPower = config.p0 * config.p0 * Math.pow(config.omega, 4) / (12 * PI * config.epsilon0 * Math.pow(config.c, 3));
      var radiationFieldRatio = complexMagnitude(eFar) > EPS ? Math.hypot(complexMagnitude(eRadial), complexDifference(eTheta, eFar)) / complexMagnitude(eFar) : 0;
      var farRelationResidual = complexMagnitude(eTheta) > EPS ? complexDifference(bPhi, { re: eTheta.re / config.c, im: eTheta.im / config.c }) / Math.max(complexMagnitude(bPhi), complexMagnitude(eTheta) / config.c, EPS) : 0;
      var zone = dipoleZone(config.kr);
      var axis = Math.abs(sinTheta) <= 1e-8;
      var checks = {
        angularLaw: close(differentialPower, totalPower * sinTheta * sinTheta * (3 / (8 * PI)), 1e-12),
        totalPowerFormula: close(totalPower, config.p0 * config.p0 * Math.pow(config.omega, 4) / (12 * PI), 1e-12),
        outwardAverageFlow: axis || radialS > 0,
        radiationZone: zone.id === "far" ? farRelationResidual < 0.2 && complexMagnitude(eRadial) / Math.max(complexMagnitude(eTheta), EPS) < 0.2 : true,
        axisNode: axis ? differentialPower <= 1e-12 : differentialPower > 0
      };
      return {
        mode: "dipole",
        config: config,
        zone: zone,
        k: k,
        r: r,
        sinTheta: sinTheta,
        cosTheta: cosTheta,
        eRadial: eRadial,
        eTheta: eTheta,
        bPhi: bPhi,
        eFar: eFar,
        bFar: bFar,
        radialS: radialS,
        thetaS: thetaS,
        differentialPower: differentialPower,
        totalPower: totalPower,
        radiationFieldRatio: radiationFieldRatio,
        farRelationResidual: farRelationResidual,
        timeAverage: true,
        sourceModel: "p(t)=p0 cos(ωt) ẑ；点偶极、谐稳态、周期平均",
        checks: checks,
        valid: Object.keys(checks).every(function (key) { return checks[key]; })
      };
    }

    function evaluate(input) {
      var raw = input || {};
      return raw.mode === "dipole" ? evaluateDipole(raw) : evaluateWave(raw);
    }

    function assert(condition, message) {
      if (!condition) throw new Error(message);
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) {
        checks += 1;
        assert(condition, "poynting-radiation self-test failed: " + message);
      }

      var correct = evaluateWave({ preset: "correct", phase: 0 });
      check(correct.checks.transverseE && correct.checks.transverseB, "plane-wave transversality");
      check(correct.checks.faraday && correct.checks.amplitude, "E/B magnitude and direction relation");
      check(correct.averagePoynting[2] > 0 && correct.checks.poyntingDirection, "Poynting points with k");
      var quarter = evaluateWave({ preset: "correct", phase: PI / 2 });
      check(magnitude(quarter.instantaneousPoynting) < EPS && magnitude(quarter.averagePoynting) > 0, "instantaneous versus time-average flow");
      var reverse = evaluateWave({ preset: "reverse-b" });
      check(reverse.checks.amplitude && !reverse.checks.faraday && reverse.averagePoynting[2] < 0, "wrong B direction is rejected despite amplitude ratio");
      var longitudinal = evaluateWave({ preset: "longitudinal" });
      check(!longitudinal.checks.transverseE && !longitudinal.valid, "longitudinal source-free wave is rejected");

      var far = evaluateDipole({ theta: PI / 3, kr: 12, omega: 1, p0: 1 });
      check(far.zone.id === "far" && far.checks.radiationZone, "far-zone condition");
      check(far.checks.angularLaw && far.checks.totalPowerFormula, "dipole angular law and power formula");
      check(far.radialS > 0 && far.farRelationResidual < 0.2, "far-zone E/B/S directions");
      var axis = evaluateDipole({ theta: 0, kr: 12 });
      check(close(axis.differentialPower, 0, EPS), "dipole axis node");
      var near = evaluateDipole({ theta: PI / 3, kr: 0.25 });
      check(near.zone.id === "near" && near.radiationFieldRatio > far.radiationFieldRatio, "near-field terms are not radiation power");
      var doubled = evaluateDipole({ theta: PI / 3, kr: 12, omega: 2 });
      check(close(doubled.totalPower / far.totalPower, 16, 1e-10), "fixed dipole amplitude gives omega^4 scaling");
      check(WAVE_PRESETS.length === 3, "three plane-wave audits");
      return { checks: checks, presets: WAVE_PRESETS.length + 1 };
    }

    function setAttributes(node, attrs) {
      Object.keys(attrs || {}).forEach(function (key) {
        var value = attrs[key];
        if (value === undefined || value === null || value === false) return;
        if (key === "className") node.setAttribute("class", String(value));
        else if (key === "text") node.textContent = String(value);
        else if (key === "value") node.value = String(value);
        else node.setAttribute(key, String(value));
      });
    }

    function element(doc, tag, attrs, children) {
      var node = doc.createElement(tag);
      setAttributes(node, attrs || {});
      (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) {
        if (child === null || child === undefined) return;
        node.appendChild(typeof child === "string" ? doc.createTextNode(child) : child);
      });
      return node;
    }

    function svgElement(doc, tag, attrs, children) {
      var node = doc.createElementNS(SVG_NS, tag);
      setAttributes(node, attrs || {});
      (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) {
        if (child === null || child === undefined) return;
        node.appendChild(typeof child === "string" ? doc.createTextNode(child) : child);
      });
      return node;
    }

    function clear(node) {
      while (node.firstChild) node.removeChild(node.firstChild);
    }

    function injectStyles(doc) {
      if (doc.getElementById && doc.getElementById(STYLE_ID)) return;
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent = STYLE_TEXT;
      (doc.head || doc.documentElement || doc.body).appendChild(style);
    }

    function format(value, digits) {
      return finite(value) ? value.toFixed(digits === undefined ? 4 : digits) : "—";
    }

    function formatVector(value) {
      return "(" + value.map(function (component) { return format(component, 3); }).join(", ") + ")";
    }

    function makeMetric(doc, label) {
      var value = element(doc, "strong", {}, "-");
      return { card: element(doc, "div", { className: "pr-metric" }, [element(doc, "span", {}, label), value]), value: value };
    }

    function arrowMarker(doc, id, color) {
      var marker = svgElement(doc, "marker", { id: id, markerWidth: 8, markerHeight: 8, refX: 7, refY: 4, orient: "auto" });
      marker.appendChild(svgElement(doc, "path", { d: "M0,0 L8,4 L0,8 z", fill: color }));
      return marker;
    }

    function drawWaveSvg(doc, result) {
      var svg = svgElement(doc, "svg", { className: "pr-svg", viewBox: "0 0 720 300", role: "img", "aria-label": "平面波 E、B、k 与时间平均 Poynting 方向" });
      var defs = svgElement(doc, "defs");
      defs.appendChild(arrowMarker(doc, "pr-e-" + INSTANCE, "var(--cl-red,#b43d32)"));
      defs.appendChild(arrowMarker(doc, "pr-b-" + INSTANCE, "var(--cl-blue,#2c6aa0)"));
      defs.appendChild(arrowMarker(doc, "pr-k-" + INSTANCE, "var(--cl-green,#2f7547)"));
      defs.appendChild(arrowMarker(doc, "pr-s-" + INSTANCE, "var(--cl-gold,#9a6b12)"));
      svg.appendChild(defs);
      svg.appendChild(svgElement(doc, "rect", { x: 20, y: 20, width: 680, height: 250, fill: "var(--bg,#fff)", stroke: "var(--border,#c8cdd3)" }));
      svg.appendChild(svgElement(doc, "line", { className: "pr-axis", x1: 75, y1: 145, x2: 280, y2: 145 }));
      svg.appendChild(svgElement(doc, "line", { className: "pr-axis", x1: 178, y1: 55, x2: 178, y2: 235 }));
      svg.appendChild(svgElement(doc, "text", { className: "pr-small", x: 282, y: 149 }, "x̂"));
      svg.appendChild(svgElement(doc, "text", { className: "pr-small", x: 183, y: 51 }, "ŷ"));
      var origin = { x: 178, y: 145 };
      function vectorLine(value, className, markerId, label, dx, dy) {
        var endX = origin.x + (value[0] * 70) + (value[2] * dx);
        var endY = origin.y - (value[1] * 70) - (value[2] * dy);
        svg.appendChild(svgElement(doc, "line", { className: className, x1: origin.x, y1: origin.y, x2: endX, y2: endY, "marker-end": "url(#" + markerId + ")" }));
        svg.appendChild(svgElement(doc, "text", { className: "pr-text", x: endX + 7, y: endY - 5 }, label));
      }
      vectorLine(result.config.e, "pr-e", "pr-e-" + INSTANCE, "E", 0, 0);
      vectorLine(result.config.b, "pr-b", "pr-b-" + INSTANCE, "B", 0, 0);
      svg.appendChild(svgElement(doc, "text", { className: "pr-title", x: 92, y: 48 }, "横截面：E 与 B"));
      svg.appendChild(svgElement(doc, "text", { className: "pr-small", x: 92, y: 66 }, "红 E；蓝 B；二者应互相垂直"));
      var directionSign = result.averagePoynting[2] >= 0 ? 1 : -1;
      var kStart = 355;
      var kEnd = directionSign > 0 ? 610 : 355;
      var kOrigin = directionSign > 0 ? kStart : 610;
      svg.appendChild(svgElement(doc, "line", { className: "pr-k", x1: kOrigin, y1: 108, x2: kEnd, y2: 108, "marker-end": "url(#pr-k-" + INSTANCE + ")" }));
      svg.appendChild(svgElement(doc, "line", { className: "pr-s", x1: kOrigin, y1: 190, x2: kEnd, y2: 190, "marker-end": "url(#pr-s-" + INSTANCE + ")" }));
      svg.appendChild(svgElement(doc, "text", { className: "pr-text", x: directionSign > 0 ? 615 : 285, y: 104 }, "k"));
      svg.appendChild(svgElement(doc, "text", { className: "pr-text", x: directionSign > 0 ? 615 : 285, y: 186 }, "⟨S⟩"));
      svg.appendChild(svgElement(doc, "text", { className: "pr-title", x: 355, y: 48 }, "传播轴与能流"));
      svg.appendChild(svgElement(doc, "text", { className: "pr-small", x: 355, y: 68 }, "⟨S⟩=E₀×B₀/(2μ₀)；瞬时 S 还乘 cos²φ"));
      svg.appendChild(svgElement(doc, "text", { className: "pr-small", x: 355, y: 238 }, "平均方向=" + (directionSign > 0 ? "+k" : "−k") + "；phase=" + format(result.config.phase, 2)));
      return svg;
    }

    function drawDipoleSvg(doc, result) {
      var svg = svgElement(doc, "svg", { className: "pr-svg", viewBox: "0 0 760 330", role: "img", "aria-label": "偶极辐射 sin² theta 方向图与局部 E B S 方向" });
      var centerX = 150;
      var centerY = 155;
      var radius = 105;
      var points = [];
      var index;
      for (index = 0; index <= 180; index += 1) {
        var angle = (2 * PI * index) / 180;
        var rho = radius * Math.sin(angle) * Math.sin(angle);
        points.push((index === 0 ? "M" : "L") + (centerX + rho * Math.sin(angle)).toFixed(2) + "," + (centerY - rho * Math.cos(angle)).toFixed(2));
      }
      points.push("Z");
      svg.appendChild(svgElement(doc, "rect", { x: 20, y: 20, width: 720, height: 285, fill: "var(--bg,#fff)", stroke: "var(--border,#c8cdd3)" }));
      svg.appendChild(svgElement(doc, "path", { className: "pr-lobe", d: points.join(" ") }));
      svg.appendChild(svgElement(doc, "line", { className: "pr-axis", x1: centerX, y1: centerY - radius - 12, x2: centerX, y2: centerY + radius + 12 }));
      svg.appendChild(svgElement(doc, "text", { className: "pr-small", x: centerX + 7, y: centerY - radius - 16 }, "p̂ / ẑ"));
      var currentRho = radius * result.sinTheta * result.sinTheta;
      var currentX = centerX + currentRho * result.sinTheta;
      var currentY = centerY - currentRho * result.cosTheta;
      svg.appendChild(svgElement(doc, "circle", { className: "pr-current", cx: currentX, cy: currentY, r: 6 }));
      svg.appendChild(svgElement(doc, "line", { className: "pr-s", x1: centerX, y1: centerY, x2: currentX, y2: currentY }));
      svg.appendChild(svgElement(doc, "text", { className: "pr-text", x: currentX + 9, y: currentY - 8 }, "θ=" + format(result.config.theta * 180 / PI, 1) + "°"));
      svg.appendChild(svgElement(doc, "text", { className: "pr-title", x: 64, y: 285 }, "dP/dΩ ∝ sin²θ"));
      svg.appendChild(svgElement(doc, "text", { className: "pr-small", x: 70, y: 45 }, "轴向节点"));
      svg.appendChild(svgElement(doc, "text", { className: "pr-small", x: 205, y: 160 }, "赤道最强"));

      var localOriginX = 510;
      var localOriginY = 166;
      var rX = localOriginX + 72 * result.sinTheta;
      var rY = localOriginY - 72 * result.cosTheta;
      var eX = localOriginX + 62 * result.cosTheta;
      var eY = localOriginY + 62 * result.sinTheta;
      var sScale = 90 / Math.max(Math.abs(result.radialS), Math.abs(result.thetaS), EPS);
      var sX = localOriginX + (result.radialS * result.sinTheta - result.thetaS * result.cosTheta) * sScale;
      var sY = localOriginY - (result.radialS * result.cosTheta + result.thetaS * result.sinTheta) * sScale;
      svg.appendChild(svgElement(doc, "line", { className: "pr-k", x1: localOriginX, y1: localOriginY, x2: rX, y2: rY }));
      svg.appendChild(svgElement(doc, "line", { className: "pr-e", x1: localOriginX, y1: localOriginY, x2: eX, y2: eY }));
      svg.appendChild(svgElement(doc, "line", { className: "pr-s", x1: localOriginX, y1: localOriginY, x2: sX, y2: sY }));
      svg.appendChild(svgElement(doc, "circle", { cx: localOriginX - 65, cy: localOriginY - 62, r: 8, fill: "none", stroke: "var(--cl-blue,#2c6aa0)", "stroke-width": 2 }));
      svg.appendChild(svgElement(doc, "line", { className: "pr-b", x1: localOriginX - 71, y1: localOriginY - 68, x2: localOriginX - 59, y2: localOriginY - 56 }));
      svg.appendChild(svgElement(doc, "line", { className: "pr-b", x1: localOriginX - 71, y1: localOriginY - 56, x2: localOriginX - 59, y2: localOriginY - 68 }));
      svg.appendChild(svgElement(doc, "text", { className: "pr-text", x: rX + 7, y: rY - 5 }, "r̂"));
      svg.appendChild(svgElement(doc, "text", { className: "pr-text", x: eX + 7, y: eY - 5 }, "Eθ"));
      svg.appendChild(svgElement(doc, "text", { className: "pr-text", x: localOriginX - 53, y: localOriginY - 72 }, "Bφ（出/入纸面）"));
      svg.appendChild(svgElement(doc, "text", { className: "pr-text", x: sX + 7, y: sY - 5 }, "⟨S⟩"));
      svg.appendChild(svgElement(doc, "text", { className: "pr-title", x: 395, y: 48 }, "局部方向账"));
      svg.appendChild(svgElement(doc, "text", { className: "pr-small", x: 395, y: 68 }, "远场：B=r̂×E/c，⟨S⟩径向向外"));
      svg.appendChild(svgElement(doc, "text", { className: "pr-small", x: 395, y: 268 }, result.zone.label));
      svg.appendChild(svgElement(doc, "text", { className: "pr-small", x: 395, y: 286 }, "近场比=" + format(result.radiationFieldRatio, 3) + "；周期平均"));
      return svg;
    }

    function addLedgerRow(doc, body, cells) {
      var row = element(doc, "tr");
      cells.forEach(function (cell, index) { row.appendChild(element(doc, index === 0 ? "th" : "td", index === 0 ? { scope: "row" } : {}, cell)); });
      body.appendChild(row);
    }

    function buildLab(root, api) {
      var doc = root.ownerDocument || document;
      var state = { mode: "wave", wavePreset: "correct", phase: 0, theta: PI / 3, kr: 8, answers: { flow: null, axis: null, zone: null, frequency: null }, revealed: false };
      var modeButtons = [];
      var wavePresetButtons = [];
      var questionButtons = {};
      var waveControls;
      var dipoleControls;
      var phaseInput;
      var phaseOutput;
      var thetaInput;
      var thetaOutput;
      var krInput;
      var krOutput;
      var feedback;
      var results;
      var metricGrid;
      var metrics;
      var stage;
      var ledger;
      var status;

      INSTANCE += 1;
      injectStyles(doc);
      root.classList.add("pr-lab");

      function announce(message) {
        if (api && typeof api.announce === "function") api.announce(root, message);
      }

      function lock(message) {
        state.answers = { flow: null, axis: null, zone: null, frequency: null };
        state.revealed = false;
        if (results) results.hidden = true;
        if (feedback) {
          feedback.className = "pr-feedback";
          feedback.textContent = message || "参数已改变；预测门重新上锁。";
        }
        renderQuestionButtons();
      }

      function makeQuestion(key, label, choices) {
        var grid = element(doc, "div", { className: "pr-choice-grid", role: "group", "aria-label": label });
        var entries = [];
        choices.forEach(function (choice) {
          var button = element(doc, "button", { type: "button", "aria-pressed": "false" }, choice.label);
          button.addEventListener("click", function () {
            state.answers[key] = choice.value;
            renderQuestionButtons();
          });
          entries.push({ button: button, value: choice.value });
          grid.appendChild(button);
        });
        questionButtons[key] = entries;
        return element(doc, "div", { className: "pr-question" }, [element(doc, "span", { className: "pr-question-label" }, label), grid]);
      }

      function renderQuestionButtons() {
        Object.keys(questionButtons).forEach(function (key) {
          questionButtons[key].forEach(function (entry) { entry.button.setAttribute("aria-pressed", state.answers[key] === entry.value ? "true" : "false"); });
        });
      }

      function expectedAnswers() {
        var result = state.mode === "wave"
          ? evaluateWave({ preset: state.wavePreset, phase: state.phase })
          : evaluateDipole({ theta: state.theta, kr: state.kr });
        var flow = state.mode === "wave"
          ? (magnitude(result.averagePoynting) <= EPS ? "zero" : result.averagePoynting[2] > 0 ? "forward" : "backward")
          : (Math.abs(result.sinTheta) <= EPS ? "zero" : result.radialS > 0 ? "outward" : "inward");
        return { flow: flow, axis: "zero", zone: "far-condition", frequency: "omega4" };
      }

      function renderControls() {
        modeButtons.forEach(function (entry) { entry.button.setAttribute("aria-pressed", entry.value === state.mode ? "true" : "false"); });
        wavePresetButtons.forEach(function (button, index) { button.setAttribute("aria-pressed", WAVE_PRESETS[index].id === state.wavePreset ? "true" : "false"); });
        waveControls.hidden = state.mode !== "wave";
        dipoleControls.hidden = state.mode !== "dipole";
        phaseOutput.textContent = format(state.phase, 2);
        thetaOutput.textContent = format(state.theta * 180 / PI, 1) + "°";
        krOutput.textContent = format(state.kr, 2);
        renderQuestionButtons();
      }

      function renderResult(result) {
        clear(metricGrid);
        clear(stage);
        clear(ledger);
        var body = element(doc, "tbody");
        if (result.mode === "wave") {
          metrics = [makeMetric(doc, "B 关系残差"), makeMetric(doc, "E/B 振幅比"), makeMetric(doc, "瞬时 S_z"), makeMetric(doc, "⟨S⟩_z"), makeMetric(doc, "有效平面波")];
          metrics[0].value.textContent = format(vectorError(result.config.b, result.expectedB), 6);
          metrics[1].value.textContent = format(result.ratio, 4);
          metrics[2].value.textContent = format(result.instantaneousPoynting[2], 4);
          metrics[3].value.textContent = format(result.averagePoynting[2], 4);
          metrics[4].value.textContent = result.valid ? "通过" : "拒绝";
          metrics.forEach(function (metric) { metricGrid.appendChild(metric.card); });
          stage.appendChild(drawWaveSvg(doc, result));
          ledger.appendChild(element(doc, "caption", {}, "平面波的方向与能流逐项检查"));
          ledger.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, ["检查", "读数", "结论"].map(function (label) { return element(doc, "th", {}, label); }))));
          addLedgerRow(doc, body, ["k·E 与 k·B", format(dot(result.config.k, result.config.e), 4) + " / " + format(dot(result.config.k, result.config.b), 4), result.checks.transverseE && result.checks.transverseB ? "横向" : "不横向"]);
          addLedgerRow(doc, body, ["Faraday 方向", "B=" + formatVector(result.expectedB), result.checks.faraday ? "通过" : "失败"]);
          addLedgerRow(doc, body, ["振幅关系", "|E|/(c|B|)=" + format(result.ratio, 4), result.checks.amplitude ? "通过" : "失败"]);
          addLedgerRow(doc, body, ["Poynting 方向", "E×B=" + formatVector(result.averagePoynting), result.checks.poyntingDirection ? "+k 同向" : "不与 +k 同向"]);
          addLedgerRow(doc, body, ["时间平均", "S_inst=S₀cos²φ；⟨S⟩=S₀/2", result.checks.timeAverage ? "条件明确" : "失败"]);
          status.textContent = "平面波模式：先核对 E、B、k 的右手方向，再把瞬时 S 与周期平均 ⟨S⟩ 分开；源区的 J·E 不在这组无源波账本里。";
        } else {
          metrics = [makeMetric(doc, "区域"), makeMetric(doc, "sin²θ"), makeMetric(doc, "⟨S_r⟩"), makeMetric(doc, "近场/辐射项"), makeMetric(doc, "dP/dΩ"), makeMetric(doc, "P_rad")];
          metrics[0].value.textContent = result.zone.id === "far" ? "辐射区" : result.zone.id === "near" ? "近场" : "过渡区";
          metrics[1].value.textContent = format(result.sinTheta * result.sinTheta, 4);
          metrics[2].value.textContent = format(result.radialS, 6);
          metrics[3].value.textContent = format(result.radiationFieldRatio, 3);
          metrics[4].value.textContent = format(result.differentialPower, 6);
          metrics[5].value.textContent = format(result.totalPower, 6);
          metrics.forEach(function (metric) { metricGrid.appendChild(metric.card); });
          stage.appendChild(drawDipoleSvg(doc, result));
          ledger.appendChild(element(doc, "caption", {}, "偶极场的区域、方向、角分布与功率条件"));
          ledger.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, ["检查", "读数", "适用条件"].map(function (label) { return element(doc, "th", {}, label); }))));
          addLedgerRow(doc, body, ["源与区域", "kr=" + format(result.config.kr, 2) + "；" + result.zone.label, result.zone.note]);
          addLedgerRow(doc, body, ["远场方向", "B=r̂×E/c；⟨S⟩≈⟨S_r⟩r̂", result.zone.id === "far" ? "远场检查：" + (result.checks.radiationZone ? "通过" : "需增大 kr") : "近场不套用纯远场方向"]);
          addLedgerRow(doc, body, ["角分布", "dP/dΩ ∝ sin²θ", result.checks.angularLaw ? "通过；θ=0 轴向节点" : "失败"]);
          addLedgerRow(doc, body, ["辐射功率", "P=p₀²ω⁴/(12π ε₀c³)", result.checks.totalPowerFormula ? "固定 p₀、短偶极、非相对论、谐稳态" : "失败"]);
          addLedgerRow(doc, body, ["时间平均", "⟨S⟩=(1/2μ₀)Re(E×B*)", result.timeAverage ? "周期平均；不是任意瞬时场值" : "失败"]);
          status.textContent = "偶极模式：源附近的 1/r³、1/r² 项可储能并交换能量；只有辐射区的 1/r 项主导时，球面上的时间平均能流才直接读作净辐射功率。";
        }
        ledger.appendChild(body);
      }

      var shell = element(doc, "div", { className: "pr-shell" });
      shell.appendChild(element(doc, "h3", {}, "Poynting 与偶极辐射：方向先于功率"));
      shell.appendChild(element(doc, "p", { className: "pr-note" }, "实验采用归一化 c=ε₀=μ₀=1；它把 E/B/S 的方向、近场与远场条件、角分布和周期平均分开显示。"));
      var modeTabs = element(doc, "div", { className: "pr-mode-tabs", role: "tablist", "aria-label": "电磁实验模式" });
      [{ value: "wave", label: "平面波：E/B/S" }, { value: "dipole", label: "偶极：角分布/功率" }].forEach(function (choice) {
        var button = element(doc, "button", { type: "button", role: "tab", "aria-pressed": "false" }, choice.label);
        button.addEventListener("click", function () { state.mode = choice.value; lock("模式已改变；预测门重新上锁。"); renderControls(); });
        modeButtons.push({ button: button, value: choice.value });
        modeTabs.appendChild(button);
      });
      shell.appendChild(modeTabs);

      waveControls = element(doc, "section", {});
      waveControls.appendChild(element(doc, "h4", {}, "平面波预设"));
      var wavePresetGrid = element(doc, "div", { className: "pr-presets", role: "group", "aria-label": "平面波预设" });
      WAVE_PRESETS.forEach(function (preset) {
        var button = element(doc, "button", { type: "button", "aria-pressed": "false" }, preset.label);
        button.addEventListener("click", function () { state.wavePreset = preset.id; lock("平面波预设已改变；先预测能流方向。"); renderControls(); });
        wavePresetButtons.push(button);
        wavePresetGrid.appendChild(button);
      });
      waveControls.appendChild(wavePresetGrid);
      var waveControlsGrid = element(doc, "div", { className: "pr-controls" });
      var phaseControl = element(doc, "div", { className: "pr-control" });
      phaseOutput = element(doc, "output", {}, "0.00");
      phaseInput = element(doc, "input", { type: "range", min: "0", max: "6.28", step: "0.01", value: "0", "aria-label": "平面波相位" });
      phaseInput.addEventListener("input", function () { state.phase = Number(phaseInput.value); lock("相位已改变；先区分瞬时 S 与平均 ⟨S⟩。"); renderControls(); });
      phaseControl.appendChild(element(doc, "label", {}, ["相位 φ=", phaseOutput]));
      phaseControl.appendChild(phaseInput);
      waveControlsGrid.appendChild(phaseControl);
      waveControlsGrid.appendChild(element(doc, "p", { className: "pr-note" }, "无源平面波只检查横向 Maxwell 约束；真正有源区域要回到 Poynting 定理的 −J·E 源汇项。"));
      waveControls.appendChild(waveControlsGrid);
      shell.appendChild(waveControls);

      dipoleControls = element(doc, "section", { hidden: "hidden" });
      dipoleControls.appendChild(element(doc, "h4", {}, "短电偶极的观察位置"));
      var dipoleControlsGrid = element(doc, "div", { className: "pr-controls" });
      var thetaControl = element(doc, "div", { className: "pr-control" });
      thetaOutput = element(doc, "output", {}, "60.0°");
      thetaInput = element(doc, "input", { type: "range", min: "0", max: "180", step: "1", value: "60", "aria-label": "偶极观察角 theta" });
      thetaInput.addEventListener("input", function () { state.theta = Number(thetaInput.value) * PI / 180; lock("观察角已改变；先预测轴向节点与 sin²θ。"); renderControls(); });
      thetaControl.appendChild(element(doc, "label", {}, ["观察角 θ=", thetaOutput]));
      thetaControl.appendChild(thetaInput);
      dipoleControlsGrid.appendChild(thetaControl);
      var krControl = element(doc, "div", { className: "pr-control" });
      krOutput = element(doc, "output", {}, "8.00");
      krInput = element(doc, "input", { type: "range", min: "0.2", max: "12", step: "0.1", value: "8", "aria-label": "无量纲距离 kr" });
      krInput.addEventListener("input", function () { state.kr = Number(krInput.value); lock("kr 已改变；先判断当前是近场、过渡区还是辐射区。"); renderControls(); });
      krControl.appendChild(element(doc, "label", {}, ["无量纲距离 kr=", krOutput]));
      krControl.appendChild(krInput);
      dipoleControlsGrid.appendChild(krControl);
      dipoleControls.appendChild(dipoleControlsGrid);
      dipoleControls.appendChild(element(doc, "p", { className: "pr-note" }, "点偶极源要求源尺寸 ≪ λ；P_rad 是 p(t)=p₀cosωt 的周期平均辐射功率。近场的瞬时能量可返回源，不能把它全部叫作向外辐射。"));
      shell.appendChild(dipoleControls);

      var prediction = element(doc, "section", { className: "pr-prediction" });
      prediction.appendChild(element(doc, "strong", { className: "pr-prediction-title" }, "预测门：先写方向、区域和模型条件"));
      prediction.appendChild(makeQuestion("flow", "1. 当前设置的时间平均能流方向是？", [
        { value: "forward", label: "+k / 向外" }, { value: "backward", label: "−k / 向内" }, { value: "outward", label: "径向向外" }, { value: "zero", label: "零 / 轴向节点" }
      ]));
      prediction.appendChild(makeQuestion("axis", "2. 电偶极沿振荡轴 θ=0 的远场功率？", [
        { value: "zero", label: "零" }, { value: "max", label: "最大" }, { value: "constant", label: "与角度无关" }, { value: "undefined", label: "未定义" }
      ]));
      prediction.appendChild(makeQuestion("zone", "3. 什么时候可把时间平均 ⟨S⟩ 直接读成净辐射流？", [
        { value: "far-condition", label: "辐射区 kr≫1" }, { value: "near", label: "源旁 kr≪1" }, { value: "instant", label: "任意瞬时值" }, { value: "static", label: "静电极限" }
      ]));
      prediction.appendChild(makeQuestion("frequency", "4. 在固定 p₀、短偶极、非相对论和谐稳态条件下，P_rad 随频率？", [
        { value: "omega4", label: "ω⁴" }, { value: "omega2", label: "ω²" }, { value: "inverse", label: "1/ω⁴" }, { value: "none", label: "不依赖" }
      ]));
      feedback = element(doc, "p", { className: "pr-feedback", "aria-live": "polite", "aria-atomic": "true" }, "");
      prediction.appendChild(feedback);
      var actions = element(doc, "div", { className: "pr-actions" });
      var reveal = element(doc, "button", { type: "button", className: "pr-primary" }, "揭示账本");
      reveal.addEventListener("click", function () {
        var keys = Object.keys(state.answers);
        if (keys.some(function (key) { return state.answers[key] === null; })) {
          feedback.className = "pr-feedback pr-warn";
          feedback.textContent = "还有预测没有作答。";
          return;
        }
        var expected = expectedAnswers();
        var correct = keys.filter(function (key) { return state.answers[key] === expected[key]; }).length;
        state.revealed = true;
        results.hidden = false;
        feedback.className = "pr-feedback " + (correct === keys.length ? "pr-pass" : "pr-warn");
        feedback.textContent = "预测得分 " + correct + "/" + keys.length + "；下面分别查看方向、区域和功率条件。";
        renderResult(state.mode === "wave" ? evaluateWave({ preset: state.wavePreset, phase: state.phase }) : evaluateDipole({ theta: state.theta, kr: state.kr }));
        announce(feedback.textContent);
      });
      var reset = element(doc, "button", { type: "button" }, "重置实验");
      reset.addEventListener("click", function () {
        state.mode = "wave";
        state.wavePreset = "correct";
        state.phase = 0;
        state.theta = PI / 3;
        state.kr = 8;
        phaseInput.value = "0";
        thetaInput.value = "60";
        krInput.value = "8";
        lock("已重置；预测门重新上锁。");
        renderControls();
        announce("Poynting 辐射实验已重置。");
      });
      actions.appendChild(reveal);
      actions.appendChild(reset);
      prediction.appendChild(actions);
      shell.appendChild(prediction);

      results = element(doc, "section", { className: "pr-results", hidden: "hidden" });
      results.appendChild(element(doc, "h4", {}, "揭示后的方向图与条件账本"));
      metricGrid = element(doc, "div", { className: "pr-metrics" });
      results.appendChild(metricGrid);
      stage = element(doc, "div", { className: "pr-stage" });
      results.appendChild(element(doc, "div", { className: "pr-frame" }, stage));
      ledger = element(doc, "table", { "aria-label": "Poynting 与辐射账本" });
      results.appendChild(element(doc, "div", { className: "pr-ledger-wrap" }, ledger));
      status = element(doc, "p", { className: "pr-status", "aria-live": "polite" }, "");
      results.appendChild(status);
      results.appendChild(element(doc, "p", { className: "pr-interpretation" }, "三层读法：E/B/S 方向是局部向量关系；近场含可返回源的反应性能量；辐射功率是远场球面上的周期平均净能流。ω⁴ 只属于本页声明的固定振幅、短偶极、非相对论谐稳态模型。"));
      shell.appendChild(results);
      root.replaceChildren(shell);

      renderControls();
      feedback.textContent = "选择模式，先作答四项预测。";
    }

    return {
      WAVE_PRESETS: WAVE_PRESETS,
      dipoleZone: dipoleZone,
      evaluateWave: evaluateWave,
      evaluateDipole: evaluateDipole,
      evaluate: evaluate,
      selfTest: selfTest,
      mount: buildLab
    };
  }
);
