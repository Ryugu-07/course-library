(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("maxwell-constraints", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("maxwell-constraints self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("maxwell-constraints self-test: FAIL\n" + error.stack);
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
    var STYLE_ID = "maxwell-constraints-lab-styles";
    var INSTANCE = 0;
    var EPS = 1e-9;
    var TWO_PI = 2 * Math.PI;

    var PRESETS = [
      {
        id: "linear",
        label: "线偏振",
        note: "E₀=x̂，B₀=ŷ；三条方向构成右手系。",
        k: [0, 0, 1],
        omega: 1,
        c: 1,
        eReal: [1, 0, 0],
        eImag: [0, 0, 0],
        bReal: [0, 1, 0],
        bImag: [0, 0, 0],
        displacementCurrent: true
      },
      {
        id: "circular",
        label: "圆偏振",
        note: "E₀=x̂+iŷ，B₀=ŷ−ix̂；相位推进时 E 在横平面旋转。",
        k: [0, 0, 1],
        omega: 1,
        c: 1,
        eReal: [1, 0, 0],
        eImag: [0, 1, 0],
        bReal: [0, 1, 0],
        bImag: [-1, 0, 0],
        displacementCurrent: true
      },
      {
        id: "longitudinal",
        label: "非法纵向 E",
        note: "E₀=ẑ，B₀=0；Gauss 约束已拒绝这条无源波。",
        k: [0, 0, 1],
        omega: 1,
        c: 1,
        eReal: [0, 0, 1],
        eImag: [0, 0, 0],
        bReal: [0, 0, 0],
        bImag: [0, 0, 0],
        displacementCurrent: true
      },
      {
        id: "wrong-b",
        label: "错误 B 方向",
        note: "E₀=x̂ 但 B₀=−ŷ；能流反向，Faraday 残差为 2。",
        k: [0, 0, 1],
        omega: 1,
        c: 1,
        eReal: [1, 0, 0],
        eImag: [0, 0, 0],
        bReal: [0, -1, 0],
        bImag: [0, 0, 0],
        displacementCurrent: true
      },
      {
        id: "no-displacement",
        label: "关闭位移电流",
        note: "场仍取线偏振，但 Ampère 方程被改成 k×B=0。",
        k: [0, 0, 1],
        omega: 1,
        c: 1,
        eReal: [1, 0, 0],
        eImag: [0, 0, 0],
        bReal: [0, 1, 0],
        bImag: [0, 0, 0],
        displacementCurrent: false
      }
    ];

    var STYLE_TEXT = [
      ".mx-lab{max-width:100%;min-width:0;color:var(--fg,#20252b);line-height:1.55;overflow-wrap:anywhere;}",
      ".mx-lab *,.mx-lab *::before,.mx-lab *::after{box-sizing:border-box;}.mx-lab [hidden]{display:none!important;}",
      ".mx-lab h3,.mx-lab h4{margin:0;color:var(--fg,#20252b);letter-spacing:0;}.mx-lab h3{font-size:1.12rem;}.mx-lab h4{font-size:1rem;}",
      ".mx-lab p{margin:8px 0;}.mx-lab .mx-note,.mx-lab .mx-feedback,.mx-lab .mx-detail{color:var(--fg-soft,var(--muted,#5d6873));font-size:13px;line-height:1.65;}",
      ".mx-lab button,.mx-lab input{font:inherit;}.mx-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#c8cdd3);border-radius:6px;background:var(--bg,#fff);color:var(--fg,#20252b);line-height:1.35;cursor:pointer;overflow-wrap:anywhere;}",
      ".mx-lab button:hover{border-color:var(--accent,#1769aa);}.mx-lab button:focus-visible,.mx-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}.mx-lab button[aria-pressed=true],.mx-lab button.mx-primary{border-color:var(--accent,#1769aa);background:var(--accent,#1769aa);color:var(--bg,#fff);font-weight:750;}.mx-lab button:disabled{cursor:not-allowed;opacity:.55;}",
      ".mx-lab fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#c8cdd3);}.mx-lab legend{max-width:100%;padding:0 4px;color:var(--fg,#20252b);font-size:13px;font-weight:750;line-height:1.5;}.mx-lab .mx-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}.mx-lab .mx-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;}.mx-lab .mx-actions>*{flex:1 1 160px;}",
      ".mx-lab .mx-prediction{margin:14px 0;padding:12px 14px;border-left:3px solid var(--cl-gold,#9a6b12);background:var(--block-bg,var(--bg,#fff));}.mx-lab .mx-prediction-title{display:block;margin-bottom:8px;font-size:13px;}.mx-lab .mx-feedback{min-height:2em;margin:8px 0 0;font-weight:700;}.mx-lab .mx-pass{color:var(--cl-green,#2f7547);}.mx-lab .mx-warn{color:var(--cl-red,#b43d32);}",
      ".mx-lab .mx-presets{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px;margin:12px 0;}.mx-lab .mx-presets button{font-size:12px;}",
      ".mx-lab .mx-controls{display:grid;grid-template-columns:minmax(0,1fr) minmax(170px,.7fr);gap:12px;margin:12px 0;align-items:end;}.mx-lab .mx-control{min-width:0;display:grid;gap:4px;}.mx-lab .mx-control label{color:var(--fg-soft,var(--muted,#5d6873));font-size:12.5px;font-weight:700;}.mx-lab .mx-control output{color:var(--accent,#1769aa);font-variant-numeric:tabular-nums;}.mx-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent,#1769aa);}.mx-lab .mx-phase-actions{display:flex;flex-wrap:wrap;gap:7px;align-items:center;}.mx-lab .mx-phase-actions button{flex:0 1 150px;}",
      ".mx-lab .mx-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border,#c8cdd3);}.mx-lab .mx-results h4{margin:14px 0 7px;}.mx-lab .mx-stage{min-width:0;padding:8px;border:1px solid var(--border,#c8cdd3);border-radius:6px;background:var(--block-bg,var(--bg,#fff));}.mx-lab .mx-svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg,#20252b);}.mx-lab .mx-svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}.mx-lab .mx-plane{fill:var(--bg,#fff);stroke:var(--border,#c8cdd3);stroke-width:1;}.mx-lab .mx-axis{stroke:currentColor;stroke-width:1;stroke-opacity:.55;}.mx-lab .mx-grid{stroke:var(--border,#c8cdd3);stroke-width:1;stroke-dasharray:2 4;stroke-opacity:.7;}.mx-lab .mx-vector{fill:none;stroke-width:2.7;stroke-linecap:round;stroke-linejoin:round;}.mx-lab .mx-vector-e{stroke:var(--mx-e,#c24b4b);}.mx-lab .mx-vector-b{stroke:var(--mx-b,#2c6aa0);}.mx-lab .mx-vector-k{stroke:var(--mx-k,#2f7547);}.mx-lab .mx-marker-e{fill:var(--mx-e,#c24b4b);}.mx-lab .mx-marker-b{fill:var(--mx-b,#2c6aa0);}.mx-lab .mx-marker-k{fill:var(--mx-k,#2f7547);}.mx-lab .mx-plane-title{font-size:11px;font-weight:750;text-anchor:middle;}.mx-lab .mx-vector-label{font-size:10px;font-weight:750;}.mx-lab .mx-axis-label{font-size:9px;fill:var(--fg-soft,var(--muted,#5d6873));}",
      ".mx-lab .mx-legend{display:flex;flex-wrap:wrap;gap:10px;margin:7px 0 0;color:var(--fg-soft,var(--muted,#5d6873));font-size:12px;}.mx-lab .mx-legend span{display:inline-flex;align-items:center;gap:4px;}.mx-lab .mx-swatch{display:inline-block;width:10px;height:3px;border-radius:2px;}.mx-lab .mx-swatch-e{background:var(--mx-e,#c24b4b);}.mx-lab .mx-swatch-b{background:var(--mx-b,#2c6aa0);}.mx-lab .mx-swatch-k{background:var(--mx-k,#2f7547);}",
      ".mx-lab .mx-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0;}.mx-lab .mx-metric{min-width:0;padding:8px;border-top:2px solid var(--border,#c8cdd3);background:var(--block-bg,var(--bg,#fff));}.mx-lab .mx-metric:nth-child(3n+1){border-color:var(--mx-e,#c24b4b);}.mx-lab .mx-metric:nth-child(3n+2){border-color:var(--mx-b,#2c6aa0);}.mx-lab .mx-metric:nth-child(3n){border-color:var(--cl-gold,#9a6b12);}.mx-lab .mx-metric span{display:block;color:var(--fg-soft,var(--muted,#5d6873));font-size:11px;line-height:1.4;}.mx-lab .mx-metric strong{display:block;margin-top:3px;font-size:13px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}",
      ".mx-lab .mx-ledger-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;}.mx-lab table{width:100%;min-width:650px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}.mx-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft,var(--muted,#5d6873));font-size:12px;}.mx-lab th,.mx-lab td{padding:7px 8px;border-bottom:1px solid var(--border,#c8cdd3);text-align:left;vertical-align:top;}.mx-lab th{color:var(--fg-soft,var(--muted,#5d6873));font-size:11.5px;}.mx-lab td strong{font-weight:750;}.mx-lab .mx-status{white-space:nowrap;font-weight:750;}.mx-lab .mx-status-pass{color:var(--cl-green,#2f7547);}.mx-lab .mx-status-fail{color:var(--cl-red,#b43d32);}.mx-lab .mx-interpretation{margin-top:10px;padding:10px 12px;border-left:3px solid var(--cl-green,#2f7547);background:var(--block-bg,var(--bg,#fff));font-size:13px;line-height:1.65;}",
      "@media(max-width:900px){.mx-lab .mx-presets{grid-template-columns:repeat(3,minmax(0,1fr));}.mx-lab .mx-metrics{grid-template-columns:repeat(2,minmax(0,1fr));}}",
      "@media(max-width:620px){.mx-lab .mx-choice-grid{grid-template-columns:minmax(0,1fr);}.mx-lab .mx-controls{grid-template-columns:minmax(0,1fr);}.mx-lab .mx-presets{grid-template-columns:repeat(2,minmax(0,1fr));}}",
      "@media(max-width:420px){.mx-lab .mx-presets,.mx-lab .mx-metrics{grid-template-columns:minmax(0,1fr);}.mx-lab .mx-prediction{padding:10px;}.mx-lab .mx-stage{padding:4px;}}",
      "@media(prefers-reduced-motion:reduce){.mx-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important;}}"
    ].join("\n");

    function finite(value) {
      return typeof value === "number" && Number.isFinite(value);
    }

    function clamp(value, minimum, maximum) {
      return Math.max(minimum, Math.min(maximum, value));
    }

    function wrapPhase(value) {
      var phase = Number(value);
      if (!finite(phase)) return 0;
      phase %= TWO_PI;
      return phase < 0 ? phase + TWO_PI : phase;
    }

    function copyVector(value) {
      return [value[0], value[1], value[2]];
    }

    function isVector(value) {
      return Array.isArray(value) && value.length === 3 && value.every(finite);
    }

    function readVector(value, fallback) {
      return isVector(value) ? copyVector(value) : copyVector(fallback);
    }

    function add(a, b) {
      return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    }

    function subtract(a, b) {
      return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    }

    function scale(vectorValue, factor) {
      return [vectorValue[0] * factor, vectorValue[1] * factor, vectorValue[2] * factor];
    }

    function dot(a, b) {
      return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    }

    function cross(a, b) {
      return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0]
      ];
    }

    function magnitude(vectorValue) {
      return Math.sqrt(dot(vectorValue, vectorValue));
    }

    function unit(vectorValue) {
      var length = magnitude(vectorValue);
      return length > EPS ? scale(vectorValue, 1 / length) : null;
    }

    function phaseVector(realPart, imaginaryPart, phase) {
      return add(scale(realPart, Math.cos(phase)), scale(imaginaryPart, -Math.sin(phase)));
    }

    function complexMagnitude(realPart, imaginaryPart) {
      return Math.hypot(magnitude(realPart), magnitude(imaginaryPart));
    }

    function complexDot(vectorValue, realPart, imaginaryPart) {
      var real = dot(vectorValue, realPart);
      var imaginary = dot(vectorValue, imaginaryPart);
      return { real: real, imaginary: imaginary, magnitude: Math.hypot(real, imaginary) };
    }

    function complexResidual(realA, imaginaryA, realB, imaginaryB) {
      return Math.hypot(magnitude(subtract(realA, realB)), magnitude(subtract(imaginaryA, imaginaryB)));
    }

    function normalizeConfig(input) {
      var raw = input || {};
      var omega = Number(raw.omega === undefined ? 1 : raw.omega);
      var c = Number(raw.c === undefined ? 1 : raw.c);
      var k = readVector(raw.k, [0, 0, 1]);
      if (!finite(omega) || omega <= 0 || !finite(c) || c <= 0) {
        throw new RangeError("omega and c must be positive finite values");
      }
      return {
        id: raw.id || "custom",
        label: raw.label || "自定义场",
        note: raw.note || "",
        k: k,
        omega: omega,
        c: c,
        eReal: readVector(raw.eReal, [1, 0, 0]),
        eImag: readVector(raw.eImag, [0, 0, 0]),
        bReal: readVector(raw.bReal, [0, 1, 0]),
        bImag: readVector(raw.bImag, [0, 0, 0]),
        phase: wrapPhase(raw.phase),
        displacementCurrent: raw.displacementCurrent !== false
      };
    }

    function evaluate(input) {
      var config = normalizeConfig(input);
      var k = config.k;
      var eReal = config.eReal;
      var eImag = config.eImag;
      var bReal = config.bReal;
      var bImag = config.bImag;
      var expectedBReal = scale(cross(k, eReal), 1 / config.omega);
      var expectedBImag = scale(cross(k, eImag), 1 / config.omega);
      var kDotE = complexDot(k, eReal, eImag);
      var kDotB = complexDot(k, bReal, bImag);
      var eAmplitude = complexMagnitude(eReal, eImag);
      var bAmplitude = complexMagnitude(bReal, bImag);
      var ratio = bAmplitude > EPS ? eAmplitude / (config.c * bAmplitude) : (eAmplitude > EPS ? Infinity : 0);
      var ampereLeftReal = cross(k, bReal);
      var ampereLeftImag = cross(k, bImag);
      var ampereMaxwellTargetReal = scale(eReal, -config.omega / (config.c * config.c));
      var ampereMaxwellTargetImag = scale(eImag, -config.omega / (config.c * config.c));
      var ampereMaxwellResidual = complexResidual(
        ampereLeftReal,
        ampereLeftImag,
        ampereMaxwellTargetReal,
        ampereMaxwellTargetImag
      );
      var ampereNoDisplacementResidual = Math.hypot(magnitude(ampereLeftReal), magnitude(ampereLeftImag));
      var activeAmpereResidual = config.displacementCurrent
        ? ampereMaxwellResidual
        : ampereNoDisplacementResidual;
      var poynting = add(cross(eReal, bReal), cross(eImag, bImag));
      var eAtPhase = phaseVector(eReal, eImag, config.phase);
      var bAtPhase = phaseVector(bReal, bImag, config.phase);
      var instantaneousPoynting = cross(eAtPhase, bAtPhase);
      var kLength = magnitude(k);
      var kUnit = unit(k);
      var poyntingUnit = unit(poynting);
      var tolerance = 1e-8;
      var checks = {
        transverseE: kDotE.magnitude <= tolerance,
        transverseB: kDotB.magnitude <= tolerance,
        faraday: complexResidual(bReal, bImag, expectedBReal, expectedBImag) <= tolerance,
        amplitude: finite(ratio) && Math.abs(ratio - 1) <= tolerance,
        direction: Boolean(poyntingUnit && kUnit && dot(poyntingUnit, kUnit) > 1 - tolerance),
        dispersion: Math.abs(kLength - config.omega / config.c) <= tolerance,
        ampereMaxwell: activeAmpereResidual <= tolerance
      };
      return {
        config: config,
        kMagnitude: kLength,
        eAmplitude: eAmplitude,
        bAmplitude: bAmplitude,
        eAtPhase: eAtPhase,
        bAtPhase: bAtPhase,
        instantaneousPoynting: instantaneousPoynting,
        expectedBReal: expectedBReal,
        expectedBImag: expectedBImag,
        kDotE: kDotE,
        kDotB: kDotB,
        faradayResidual: complexResidual(bReal, bImag, expectedBReal, expectedBImag),
        ratio: ratio,
        poynting: poynting,
        poyntingDirection: poyntingUnit,
        ampereMaxwellResidual: ampereMaxwellResidual,
        ampereNoDisplacementResidual: ampereNoDisplacementResidual,
        activeAmpereResidual: activeAmpereResidual,
        checks: checks,
        valid: Object.keys(checks).every(function (key) { return checks[key]; })
      };
    }

    function nearly(a, b, tolerance) {
      return Math.abs(a - b) <= (tolerance === undefined ? 1e-9 : tolerance);
    }

    function assert(condition, message) {
      if (!condition) throw new Error(message);
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) {
        checks += 1;
        assert(condition, "maxwell-constraints self-test failed: " + message);
      }

      check(nearly(dot([1, 2, 3], [2, 0, 1]), 5), "dot product");
      check(cross([0, 0, 1], [1, 0, 0])[1] === 1, "right-hand cross product");
      check(nearly(magnitude([3, 4, 0]), 5), "vector magnitude");
      check(nearly(phaseVector([1, 0, 0], [0, 1, 0], Math.PI / 2)[1], -1), "phase convention");

      var linear = evaluate(PRESETS[0]);
      check(linear.checks.transverseE && linear.checks.transverseB, "linear transversality");
      check(linear.faradayResidual < EPS && nearly(linear.ratio, 1), "linear Faraday and amplitude");
      check(linear.checks.ampereMaxwell && linear.poyntingDirection[2] > 0, "linear Ampere and energy flow");
      check(linear.ampereNoDisplacementResidual > 0.9, "linear needs displacement current");

      var circular = evaluate(PRESETS[1]);
      var circularQuarter = evaluate({
        id: PRESETS[1].id,
        k: PRESETS[1].k,
        omega: PRESETS[1].omega,
        c: PRESETS[1].c,
        eReal: PRESETS[1].eReal,
        eImag: PRESETS[1].eImag,
        bReal: PRESETS[1].bReal,
        bImag: PRESETS[1].bImag,
        phase: Math.PI / 2
      });
      check(circular.valid && nearly(circular.ratio, 1), "circular plane wave");
      check(circularQuarter.eAtPhase[1] < -0.99 && circularQuarter.bAtPhase[0] > 0.99, "circular phase rotation");

      var longitudinal = evaluate(PRESETS[2]);
      check(longitudinal.kDotE.magnitude === 1, "longitudinal Gauss residual");
      check(!longitudinal.valid && longitudinal.activeAmpereResidual === 1, "longitudinal rejection");

      var wrongB = evaluate(PRESETS[3]);
      check(nearly(wrongB.faradayResidual, 2) && wrongB.poyntingDirection[2] < 0, "wrong B direction");
      check(nearly(wrongB.ampereMaxwellResidual, 2), "wrong B Ampere residual");

      var noDisplacement = evaluate(PRESETS[4]);
      check(noDisplacement.faradayResidual < EPS, "disabled preset keeps Faraday");
      check(noDisplacement.ampereMaxwellResidual < EPS && noDisplacement.activeAmpereResidual > 0.9, "disabled displacement current");
      check(!noDisplacement.valid, "disabled preset is not a self-sustained wave");
      check(PRESETS.length >= 5, "teaching presets");
      return { checks: checks, presets: PRESETS.length };
    }

    function setAttributes(node, attrs) {
      Object.keys(attrs || {}).forEach(function (key) {
        var value = attrs[key];
        if (value === undefined || value === null || value === false) return;
        if (key === "className") node.setAttribute("class", String(value));
        else if (key === "htmlFor") node.setAttribute("for", String(value));
        else if (key === "text") node.textContent = String(value);
        else if (key === "checked" || key === "selected") {
          if (value) node.setAttribute(key, "");
        } else if (value === true) node.setAttribute(key, "");
        else node.setAttribute(key, String(value));
      });
      return node;
    }

    function appendChildren(node, doc, children) {
      if (children === undefined || children === null) return node;
      (Array.isArray(children) ? children : [children]).forEach(function (child) {
        if (child === undefined || child === null || child === false) return;
        node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
      });
      return node;
    }

    function element(doc, tag, attrs, children) {
      return appendChildren(setAttributes(doc.createElement(tag), attrs), doc, children);
    }

    function svgElement(doc, tag, attrs, children) {
      return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attrs), doc, children);
    }

    function replaceChildren(node, children, doc) {
      while (node.firstChild) node.removeChild(node.firstChild);
      appendChildren(node, doc, children);
    }

    function formatNumber(value, digits) {
      if (value === Infinity) return "∞";
      if (value === -Infinity) return "−∞";
      if (!finite(value)) return "—";
      var places = digits === undefined ? 3 : digits;
      if (value !== 0 && Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4));
      return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
    }

    function formatVector(vectorValue) {
      if (!vectorValue) return "—";
      return "(" + vectorValue.map(function (value) { return formatNumber(value, 2); }).join(", ") + ")";
    }

    function formatComplex(value) {
      var real = Math.abs(value.real) < EPS ? 0 : value.real;
      var imaginary = Math.abs(value.imaginary) < EPS ? 0 : value.imaginary;
      if (imaginary === 0) return formatNumber(real, 3);
      if (real === 0) return formatNumber(imaginary, 3) + "i";
      return formatNumber(real, 3) + (imaginary < 0 ? " − " : " + ") + formatNumber(Math.abs(imaginary), 3) + "i";
    }

    function directionText(result) {
      var direction = result.poyntingDirection;
      var kDirection = unit(result.config.k);
      if (!direction) return "0（无净能流方向）";
      if (kDirection) {
        var alignment = dot(direction, kDirection);
        if (alignment > 1 - 1e-6) return "+k（" + formatVector(direction) + "）";
        if (alignment < -1 + 1e-6) return "−k（" + formatVector(direction) + "）";
      }
      return formatVector(direction);
    }

    function installStyles(doc) {
      if (doc.getElementById(STYLE_ID)) return;
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent = STYLE_TEXT;
      (doc.head || doc.documentElement).appendChild(style);
    }

    function marker(doc, id, markerClass) {
      var node = svgElement(doc, "marker", {
        id: id,
        markerWidth: 7,
        markerHeight: 7,
        refX: 6,
        refY: 3.5,
        orient: "auto",
        markerUnits: "strokeWidth",
        viewBox: "0 0 7 7"
      });
      node.appendChild(svgElement(doc, "path", { d: "M 0 0 L 7 3.5 L 0 7 z", className: markerClass }));
      return node;
    }

    function drawVectorArrow(doc, group, vectorValue, axes, centerX, centerY, scaleValue, markerId, vectorClass, label) {
      var x = vectorValue[axes[0]];
      var y = vectorValue[axes[1]];
      var length = Math.hypot(x, y);
      if (length <= EPS) return;
      var endX = centerX + x * scaleValue;
      var endY = centerY - y * scaleValue;
      group.appendChild(svgElement(doc, "line", {
        x1: centerX,
        y1: centerY,
        x2: endX,
        y2: endY,
        className: "mx-vector " + vectorClass,
        "marker-end": "url(#" + markerId + ")"
      }));
      group.appendChild(svgElement(doc, "text", {
        x: endX + (x >= 0 ? 4 : -14),
        y: endY + (y >= 0 ? -4 : 12),
        className: "mx-vector-label " + vectorClass,
        text: label
      }));
    }

    function projectionSvg(doc, result, prefix) {
      var svg = svgElement(doc, "svg", {
        className: "mx-svg",
        viewBox: "0 0 720 222",
        role: "img",
        "aria-label": "E、B、k 的 xy、xz、yz 投影视图"
      });
      var defs = svgElement(doc, "defs");
      defs.appendChild(marker(doc, prefix + "-e", "mx-marker-e"));
      defs.appendChild(marker(doc, prefix + "-b", "mx-marker-b"));
      defs.appendChild(marker(doc, prefix + "-k", "mx-marker-k"));
      svg.appendChild(defs);
      var planes = [
        { axes: [0, 1], labels: ["x", "y"], title: "xy 投影" },
        { axes: [0, 2], labels: ["x", "z"], title: "xz 投影" },
        { axes: [1, 2], labels: ["y", "z"], title: "yz 投影" }
      ];
      var vectors = [
        { value: result.eAtPhase, marker: prefix + "-e", className: "mx-vector-e", label: "E" },
        { value: result.bAtPhase, marker: prefix + "-b", className: "mx-vector-b", label: "B" },
        { value: result.config.k, marker: prefix + "-k", className: "mx-vector-k", label: "k" }
      ];
      planes.forEach(function (plane, index) {
        var x0 = 8 + index * 236;
        var group = svgElement(doc, "g", { "aria-label": plane.title });
        group.appendChild(svgElement(doc, "rect", { x: x0, y: 8, width: 224, height: 188, rx: 5, className: "mx-plane" }));
        group.appendChild(svgElement(doc, "text", { x: x0 + 112, y: 25, className: "mx-plane-title", text: plane.title }));
        var cx = x0 + 112;
        var cy = 108;
        group.appendChild(svgElement(doc, "line", { x1: x0 + 26, y1: cy, x2: x0 + 198, y2: cy, className: "mx-axis" }));
        group.appendChild(svgElement(doc, "line", { x1: cx, y1: 42, x2: cx, y2: 174, className: "mx-axis" }));
        group.appendChild(svgElement(doc, "line", { x1: cx - 58, y1: 47, x2: cx - 58, y2: 169, className: "mx-grid" }));
        group.appendChild(svgElement(doc, "line", { x1: x0 + 31, y1: cy - 42, x2: x0 + 193, y2: cy - 42, className: "mx-grid" }));
        group.appendChild(svgElement(doc, "text", { x: x0 + 195, y: cy - 4, className: "mx-axis-label", text: plane.labels[0] }));
        group.appendChild(svgElement(doc, "text", { x: cx + 4, y: 43, className: "mx-axis-label", text: plane.labels[1] }));
        vectors.forEach(function (vectorValue) {
          drawVectorArrow(doc, group, vectorValue.value, plane.axes, cx, cy, 47, vectorValue.marker, vectorValue.className, vectorValue.label);
        });
        svg.appendChild(group);
      });
      return svg;
    }

    function metric(doc, label, value, detail) {
      var node = element(doc, "div", { className: "mx-metric" });
      node.appendChild(element(doc, "span", { text: label }));
      node.appendChild(element(doc, "strong", { text: value }));
      if (detail) node.appendChild(element(doc, "span", { className: "mx-detail", text: detail }));
      return node;
    }

    function statusCell(doc, passed) {
      return element(doc, "td", { className: "mx-status " + (passed ? "mx-status-pass" : "mx-status-fail"), text: passed ? "通过" : "失败" });
    }

    function ledgerRow(doc, label, value, detail, passed) {
      var row = element(doc, "tr");
      row.appendChild(element(doc, "th", { scope: "row", text: label }));
      row.appendChild(element(doc, "td", { text: value }));
      row.appendChild(element(doc, "td", { className: "mx-detail", text: detail }));
      row.appendChild(statusCell(doc, passed));
      return row;
    }

    function renderLedger(doc, result) {
      var table = element(doc, "table", { "aria-label": "Maxwell 约束账本" });
      table.appendChild(element(doc, "caption", { text: "约束账本（复振幅；残差阈值 10⁻⁸）" }));
      var head = element(doc, "tr");
      ["约束", "当前值", "判定说明", "状态"].forEach(function (label) {
        head.appendChild(element(doc, "th", { scope: "col", text: label }));
      });
      table.appendChild(element(doc, "thead", {}, head));
      var body = element(doc, "tbody");
      body.appendChild(ledgerRow(doc, "k·E", formatComplex(result.kDotE), "|k·E| = " + formatNumber(result.kDotE.magnitude, 4), result.checks.transverseE));
      body.appendChild(ledgerRow(doc, "k·B", formatComplex(result.kDotB), "|k·B| = " + formatNumber(result.kDotB.magnitude, 4), result.checks.transverseB));
      body.appendChild(ledgerRow(doc, "B=(1/ω)k×E", "残差 " + formatNumber(result.faradayResidual, 4), "给定 B 与 Faraday 预测的复振幅差", result.checks.faraday));
      body.appendChild(ledgerRow(doc, "|E|/(c|B|)", formatNumber(result.ratio, 4), "无源真空平面波应为 1", result.checks.amplitude));
      body.appendChild(ledgerRow(doc, "Poynting 方向", directionText(result), "时间平均方向；预期与 +k 同向", result.checks.direction));
      body.appendChild(ledgerRow(
        doc,
        "Ampère–Maxwell 一致性",
        "残差 " + formatNumber(result.activeAmpereResidual, 4),
        result.config.displacementCurrent
          ? "含位移电流：|k×B+(ω/c²)E|"
          : "关闭位移电流：|k×B|；此处不再等于传播波所需项",
        result.checks.ampereMaxwell
      ));
      body.appendChild(ledgerRow(doc, "色散 |k|=ω/c", formatNumber(result.kMagnitude, 4), "|k|/(ω/c) = " + formatNumber(result.kMagnitude / (result.config.omega / result.config.c), 4), result.checks.dispersion));
      table.appendChild(body);
      return table;
    }

    function interpretation(result) {
      var config = result.config;
      if (config.id === "no-displacement") {
        return "这个预设保留了 Faraday 关系和横向场，只把 Ampère 方程中的位移电流项拿掉。在真空无源区，删项后要求 k×B=0；当前波却有 k×B=−(ω/c²)E，所以有限频率的自持波被破坏。准静态低频导体中若位移项相对传导电流很小，删项可以是受控近似；这里不是那种情形。";
      }
      if (config.id === "longitudinal") {
        return "B=0 让 Faraday 的叉乘式暂时没有残差，但 k·E=1 已违反无源 Gauss 约束；同时 Ampère–Maxwell 仍要求非零的 k×B=−(ω/c²)E，因此它不是这类真空传播波。";
      }
      if (config.id === "wrong-b") {
        return "B 反向后，|E|/(c|B|) 仍可能碰巧等于 1，但方向账本不接受它：Faraday 残差为 2，时间平均 Poynting 向 −k，Ampère–Maxwell 也同步失败。";
      }
      return "这组场同时满足横向性、Faraday 叉乘关系、真空振幅比、正向能流和含位移电流的 Ampère–Maxwell 关系；圆偏振只是在横平面内改变两个复振幅的相位关系。";
    }

    function renderResults(doc, resultsNode, result, prefix) {
      var config = result.config;
      replaceChildren(resultsNode, [
        element(doc, "h4", { text: "揭晓：" + config.label }),
        element(doc, "p", { className: "mx-note", text: config.note + " 固定点相位 φ=" + formatNumber(config.phase * 180 / Math.PI, 0) + "°；" + (config.displacementCurrent ? "位移电流开启。" : "位移电流已关闭。") }),
        element(doc, "div", { className: "mx-stage" }, [projectionSvg(doc, result, prefix), element(doc, "div", { className: "mx-legend" }, [
          element(doc, "span", {}, [element(doc, "i", { className: "mx-swatch mx-swatch-e" }), "E"]),
          element(doc, "span", {}, [element(doc, "i", { className: "mx-swatch mx-swatch-b" }), "B"]),
          element(doc, "span", {}, [element(doc, "i", { className: "mx-swatch mx-swatch-k" }), "k"])
        ])]),
        element(doc, "div", { className: "mx-metrics", "aria-label": "场的动态读数" }, [
          metric(doc, "E(φ)", formatVector(result.eAtPhase), "固定观察点的实场"),
          metric(doc, "B(φ)", formatVector(result.bAtPhase), "固定观察点的实场"),
          metric(doc, "S(φ)∝E×B", formatVector(result.instantaneousPoynting), "瞬时方向读数"),
          metric(doc, "⟨S⟩方向", directionText(result), "时间平均 Poynting")
        ]),
        element(doc, "div", { className: "mx-ledger-wrap" }, renderLedger(doc, result)),
        element(doc, "p", { className: "mx-interpretation", text: interpretation(result) })
      ], doc);
    }

    function motionReduced(doc) {
      var view = doc.defaultView || host;
      return Boolean(view && typeof view.matchMedia === "function" && view.matchMedia("(prefers-reduced-motion: reduce)").matches);
    }

    function mount(root, api) {
      if (!root || !root.ownerDocument) return;
      var doc = root.ownerDocument;
      installStyles(doc);
      INSTANCE += 1;
      var prefix = "mx-" + INSTANCE;
      var state = {
        presetId: PRESETS[0].id,
        phase: 0,
        revealed: false,
        predictions: { transverse: null, faraday: null, displacement: null }
      };
      var predictionFeedback = "先选择三项预测，再点击“核对预测并揭晓”。";
      var predictionClass = "";
      var animationId = null;
      var animationStart = null;
      var reduced = motionReduced(doc);

      var shell = element(doc, "div", { className: "mx-lab" });
      shell.appendChild(element(doc, "h3", { text: "Maxwell 约束实验" }));
      shell.appendChild(element(doc, "p", { className: "mx-note", text: "模型固定在均匀无源线性真空的单色平面波；c=ω=|k|=1，k=ẑ。先预测，再揭晓投影图和约束账本。" }));

      var prediction = element(doc, "div", { className: "mx-prediction" });
      prediction.appendChild(element(doc, "strong", { className: "mx-prediction-title", text: "预测门：三项都作答后才能揭晓" }));
      var questions = [
        {
          key: "transverse",
          prompt: "1. 非零无源平面波中，E、B 相对 k 怎样？",
          choices: [["both", "E、B 都垂直于 k"], ["electric", "只有 E 必须垂直"], ["free", "方向不受约束"]],
          expected: "both"
        },
        {
          key: "faraday",
          prompt: "2. 已知 k 和 E，哪一个给出 B 的方向？",
          choices: [["cross", "(1/ω) k×E"], ["reverse", "(1/ω) E×k"], ["parallel", "与 E 平行"]],
          expected: "cross"
        },
        {
          key: "displacement",
          prompt: "3. 真空无源区关闭位移电流，会发生什么？",
          choices: [["breaks", "破坏有限频率自持波"], ["same", "只改记号，波不变"], ["stronger", "波速变快但约束仍全过"]],
          expected: "breaks"
        }
      ];
      var choiceButtons = [];
      questions.forEach(function (question) {
        var fieldset = element(doc, "fieldset");
        fieldset.appendChild(element(doc, "legend", { text: question.prompt }));
        var row = element(doc, "div", { className: "mx-choice-grid", role: "group", "aria-label": question.prompt });
        question.choices.forEach(function (choice) {
          var button = element(doc, "button", { type: "button", text: choice[1], "aria-pressed": "false" });
          button.addEventListener("click", function () {
            state.predictions[question.key] = choice[0];
            predictionFeedback = "预测已记录。";
            predictionClass = "";
            renderPrediction();
          });
          choiceButtons.push({ key: question.key, value: choice[0], node: button });
          row.appendChild(button);
        });
        fieldset.appendChild(row);
        prediction.appendChild(fieldset);
      });
      var actions = element(doc, "div", { className: "mx-actions" });
      var revealButton = element(doc, "button", { type: "button", className: "mx-primary", text: "核对预测并揭晓" });
      var resetButton = element(doc, "button", { type: "button", text: "重置" });
      actions.appendChild(revealButton);
      actions.appendChild(resetButton);
      prediction.appendChild(actions);
      var feedback = element(doc, "p", { className: "mx-feedback", "aria-live": "polite", "aria-atomic": "true", text: predictionFeedback });
      prediction.appendChild(feedback);
      shell.appendChild(prediction);

      var workspace = element(doc, "div");
      var presetPanel = element(doc, "div");
      presetPanel.appendChild(element(doc, "h4", { text: "预设" }));
      var presetRow = element(doc, "div", { className: "mx-presets", role: "group", "aria-label": "Maxwell 平面波预设" });
      var presetButtons = [];
      PRESETS.forEach(function (preset) {
        var button = element(doc, "button", { type: "button", text: preset.label, "aria-pressed": "false" });
        button.addEventListener("click", function () {
          stopAnimation();
          state.presetId = preset.id;
          state.phase = 0;
          render();
        });
        presetButtons.push({ id: preset.id, node: button });
        presetRow.appendChild(button);
      });
      presetPanel.appendChild(presetRow);
      workspace.appendChild(presetPanel);

      var controls = element(doc, "div", { className: "mx-controls" });
      var phaseId = prefix + "-phase";
      var phaseControl = element(doc, "div", { className: "mx-control" });
      var phaseLabel = element(doc, "label", { htmlFor: phaseId });
      var phaseOutput = element(doc, "output", { id: phaseId + "-value", for: phaseId });
      phaseLabel.appendChild(doc.createTextNode("固定观察点相位 φ："));
      phaseLabel.appendChild(phaseOutput);
      var phaseInput = element(doc, "input", { id: phaseId, type: "range", min: 0, max: 360, step: 1, "aria-label": "固定观察点相位" });
      phaseInput.addEventListener("input", function () {
        state.phase = Number(phaseInput.value) * Math.PI / 180;
        render();
      });
      phaseControl.appendChild(phaseLabel);
      phaseControl.appendChild(phaseInput);
      controls.appendChild(phaseControl);
      var phaseActions = element(doc, "div", { className: "mx-phase-actions" });
      var playButton = element(doc, "button", { type: "button", text: reduced ? "减弱动画已启用" : "播放相位" });
      if (reduced) {
        playButton.disabled = true;
        playButton.setAttribute("title", "系统偏好减弱动画，播放已停用");
      }
      phaseActions.appendChild(playButton);
      controls.appendChild(phaseActions);
      workspace.appendChild(controls);
      shell.appendChild(workspace);

      var results = element(doc, "section", { className: "mx-results", "aria-label": "Maxwell 约束揭晓结果" });
      shell.appendChild(results);
      replaceChildren(root, shell, doc);

      function currentPreset() {
        return PRESETS.filter(function (preset) { return preset.id === state.presetId; })[0] || PRESETS[0];
      }

      function announce(message) {
        if (api && typeof api.announce === "function") api.announce(root, message);
      }

      function renderPrediction() {
        choiceButtons.forEach(function (item) {
          item.node.setAttribute("aria-pressed", state.predictions[item.key] === item.value ? "true" : "false");
        });
        feedback.textContent = predictionFeedback;
        feedback.className = "mx-feedback" + (predictionClass ? " " + predictionClass : "");
      }

      function stopAnimation() {
        if (animationId !== null) {
          var view = doc.defaultView || host;
          if (view && typeof view.cancelAnimationFrame === "function") view.cancelAnimationFrame(animationId);
          else if (typeof clearTimeout === "function") clearTimeout(animationId);
        }
        animationId = null;
        animationStart = null;
        if (playButton && !reduced) playButton.textContent = "播放相位";
      }

      function animationFrame(timestamp) {
        if (animationStart === null) animationStart = timestamp;
        state.phase = ((timestamp - animationStart) / 1800 * TWO_PI) % TWO_PI;
        render();
        if (!animationId) return;
        var view = doc.defaultView || host;
        if (view && typeof view.requestAnimationFrame === "function") animationId = view.requestAnimationFrame(animationFrame);
        else animationId = setTimeout(function () { animationFrame(animationStart + 16); }, 16);
      }

      playButton.addEventListener("click", function () {
        if (reduced) return;
        if (animationId !== null) {
          stopAnimation();
          return;
        }
        playButton.textContent = "暂停相位";
        animationStart = null;
        var view = doc.defaultView || host;
        if (view && typeof view.requestAnimationFrame === "function") animationId = view.requestAnimationFrame(animationFrame);
        else animationId = setTimeout(function () { animationFrame(0); }, 16);
      });

      revealButton.addEventListener("click", function () {
        var missing = questions.filter(function (question) { return !state.predictions[question.key]; });
        if (missing.length) {
          predictionFeedback = "还差 " + missing.length + " 项预测，请逐项选择。";
          predictionClass = "mx-warn";
          renderPrediction();
          announce(predictionFeedback);
          return;
        }
        var correct = questions.filter(function (question) { return state.predictions[question.key] === question.expected; }).length;
        state.revealed = true;
        predictionFeedback = "已揭晓：" + correct + "/" + questions.length + " 命中。现在可以切换预设并检查每一项约束。";
        predictionClass = correct === questions.length ? "mx-pass" : "mx-warn";
        render();
        announce(predictionFeedback);
      });

      resetButton.addEventListener("click", function () {
        stopAnimation();
        state.presetId = PRESETS[0].id;
        state.phase = 0;
        state.revealed = false;
        state.predictions = { transverse: null, faraday: null, displacement: null };
        predictionFeedback = "先选择三项预测，再点击“核对预测并揭晓”。";
        predictionClass = "";
        render();
      });

      function render() {
        var preset = currentPreset();
        var config = normalizeConfig({
          id: preset.id,
          label: preset.label,
          note: preset.note,
          k: preset.k,
          omega: preset.omega,
          c: preset.c,
          eReal: preset.eReal,
          eImag: preset.eImag,
          bReal: preset.bReal,
          bImag: preset.bImag,
          phase: state.phase,
          displacementCurrent: preset.displacementCurrent
        });
        var result = evaluate(config);
        presetPanel.hidden = !state.revealed;
        controls.hidden = !state.revealed;
        results.hidden = !state.revealed;
        phaseInput.value = String(Math.round(config.phase * 180 / Math.PI));
        phaseOutput.textContent = Math.round(config.phase * 180 / Math.PI) + "°";
        presetButtons.forEach(function (item) {
          item.node.setAttribute("aria-pressed", item.id === state.presetId ? "true" : "false");
        });
        renderPrediction();
        if (state.revealed) renderResults(doc, results, result, prefix);
      }

      render();
    }

    return {
      PRESETS: PRESETS,
      add: add,
      subtract: subtract,
      scale: scale,
      dot: dot,
      cross: cross,
      magnitude: magnitude,
      phaseVector: phaseVector,
      evaluate: evaluate,
      mount: mount,
      selfTest: selfTest
    };
  }
);
