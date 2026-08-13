(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (
    root &&
    root.CourseLearning &&
    typeof root.CourseLearning.register === "function"
  ) {
    root.CourseLearning.register("cosmological-horizons", exported.mount);
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
    var STYLE_ID = "cosmological-horizons-lab-styles";
    var SERIAL = 0;
    var DEFAULT_TOLERANCE = 1e-9;
    var MAX_SIMPSON_DEPTH = 20;

    var PRESETS = [
      {
        id: "radiation",
        label: "辐射主导",
        omegaR: 1,
        omegaM: 0,
        omegaLambda: 0,
        note: "Ωr=1；a(t)∝t¹ᐟ²；未来无事件视界。"
      },
      {
        id: "matter",
        label: "物质主导",
        omegaR: 0,
        omegaM: 1,
        omegaLambda: 0,
        note: "Ωm=1；a(t)∝t²ᐟ³；未来无事件视界。"
      },
      {
        id: "de-sitter",
        label: "de Sitter",
        omegaR: 0,
        omegaM: 0,
        omegaLambda: 1,
        note: "ΩΛ=1；H=H0；有有限事件视界，但此平坦坐标片没有有限粒子视界。"
      },
      {
        id: "lcdm",
        label: "ΛCDM toy",
        omegaR: 0.0001,
        omegaM: 0.2999,
        omegaLambda: 0.7,
        note: "Ωr=0.0001、Ωm=0.2999、ΩΛ=0.7；三个项都保留的教学 toy。"
      }
    ];

    function finite(value) {
      return typeof value === "number" && Number.isFinite(value);
    }

    function positivePart(value) {
      return finite(value) && value > 0 ? value : 0;
    }

    function readParameter(raw, primary, alias) {
      if (!raw) return 0;
      if (raw[primary] !== undefined) return Number(raw[primary]);
      if (alias && raw[alias] !== undefined) return Number(raw[alias]);
      return 0;
    }

    function normalizeParams(raw) {
      var omegaR = positivePart(readParameter(raw, "omegaR", "r"));
      var omegaM = positivePart(readParameter(raw, "omegaM", "m"));
      var omegaLambda = positivePart(readParameter(raw, "omegaLambda", "lambda"));
      var total = omegaR + omegaM + omegaLambda;
      if (!(total > 0)) {
        throw new RangeError("至少需要一个正的密度参数。");
      }
      return {
        omegaR: omegaR / total,
        omegaM: omegaM / total,
        omegaLambda: omegaLambda / total
      };
    }

    function cloneParams(raw) {
      var params = normalizeParams(raw);
      return {
        omegaR: params.omegaR,
        omegaM: params.omegaM,
        omegaLambda: params.omegaLambda
      };
    }

    function expansionENormalized(a, params) {
      if (!finite(a) || a < 0) return NaN;
      if (a === 0) {
        if (params.omegaR > 0 || params.omegaM > 0) return Infinity;
        return Math.sqrt(params.omegaLambda);
      }
      var inverseA = 1 / a;
      var squared =
        params.omegaR * Math.pow(inverseA, 4) +
        params.omegaM * Math.pow(inverseA, 3) +
        params.omegaLambda;
      return Math.sqrt(squared);
    }

    function expansionE(a, raw) {
      return expansionENormalized(a, normalizeParams(raw));
    }

    function simpsonEstimate(left, right, fLeft, fMid, fRight) {
      return ((right - left) / 6) * (fLeft + 4 * fMid + fRight);
    }

    function adaptiveSimpson(fn, left, right, tolerance, maxDepth) {
      if (left === right) return 0;
      var fLeft = fn(left);
      var fRight = fn(right);
      var mid = (left + right) / 2;
      var fMid = fn(mid);
      if (!finite(fLeft) || !finite(fMid) || !finite(fRight)) return Infinity;
      var whole = simpsonEstimate(left, right, fLeft, fMid, fRight);
      var target = tolerance === undefined ? DEFAULT_TOLERANCE : tolerance;
      var depthLimit = maxDepth === undefined ? MAX_SIMPSON_DEPTH : maxDepth;

      function recurse(a, b, fa, fm, fb, wholeEstimate, depth, localTolerance) {
        var middle = (a + b) / 2;
        var leftMid = (a + middle) / 2;
        var rightMid = (middle + b) / 2;
        var fLeftMid = fn(leftMid);
        var fRightMid = fn(rightMid);
        if (!finite(fLeftMid) || !finite(fRightMid)) return Infinity;
        var leftEstimate = simpsonEstimate(a, middle, fa, fLeftMid, fm);
        var rightEstimate = simpsonEstimate(middle, b, fm, fRightMid, fb);
        var refined = leftEstimate + rightEstimate;
        if (
          depth <= 0 ||
          Math.abs(refined - wholeEstimate) <= 15 * localTolerance
        ) {
          return refined + (refined - wholeEstimate) / 15;
        }
        var leftResult = recurse(
          a,
          middle,
          fa,
          fLeftMid,
          fm,
          leftEstimate,
          depth - 1,
          localTolerance / 2
        );
        var rightResult = recurse(
          middle,
          b,
          fm,
          fRightMid,
          fb,
          rightEstimate,
          depth - 1,
          localTolerance / 2
        );
        if (!finite(leftResult) || !finite(rightResult)) return Infinity;
        return leftResult + rightResult;
      }

      return recurse(left, right, fLeft, fMid, fRight, whole, depthLimit, target);
    }

    function particleIntegrandAfterSubstitution(u, a, params) {
      if (u === 0) {
        if (params.omegaR > 0) return 0;
        if (params.omegaM > 0) return 2 * Math.sqrt(a / params.omegaM);
        return Infinity;
      }
      var x = a * u * u;
      var radicand =
        params.omegaR +
        params.omegaM * x +
        params.omegaLambda * Math.pow(x, 4);
      return (2 * a * u) / Math.sqrt(radicand);
    }

    function eventIntegrandAfterSubstitution(u, params) {
      var radicand =
        params.omegaR * Math.pow(u, 4) +
        params.omegaM * Math.pow(u, 3) +
        params.omegaLambda;
      return 1 / Math.sqrt(radicand);
    }

    function particleComovingIntegral(a, raw) {
      var params = normalizeParams(raw);
      if (!finite(a) || a < 0) return NaN;
      if (params.omegaR === 0 && params.omegaM === 0) return Infinity;
      if (a === 0) return 0;
      return adaptiveSimpson(
        function (u) {
          return particleIntegrandAfterSubstitution(u, a, params);
        },
        0,
        1,
        DEFAULT_TOLERANCE,
        MAX_SIMPSON_DEPTH
      );
    }

    function eventComovingIntegral(a, raw) {
      var params = normalizeParams(raw);
      if (!finite(a) || a <= 0) return NaN;
      if (params.omegaLambda === 0) return Infinity;
      // u=1/a' maps the exact upper limit a'=∞ to u=0; this is not a
      // finite future cutoff.  The transformed integrand is regular when Λ>0.
      return adaptiveSimpson(
        function (u) {
          return eventIntegrandAfterSubstitution(u, params);
        },
        0,
        1 / a,
        DEFAULT_TOLERANCE,
        MAX_SIMPSON_DEPTH
      );
    }

    function finiteMetric(value) {
      return { value: value, finite: true, status: "finite" };
    }

    function divergentMetric(reason) {
      return {
        value: Infinity,
        finite: false,
        status: "divergent",
        reason: reason
      };
    }

    function undefinedMetric(reason) {
      return {
        value: NaN,
        finite: false,
        status: "undefined",
        reason: reason
      };
    }

    function distanceLedger(a, raw) {
      if (!finite(a) || a <= 0) {
        throw new RangeError("distanceLedger 需要正的尺度因子 a；a→0 请使用 asymptoticLimits。");
      }
      var params = normalizeParams(raw);
      var e = expansionENormalized(a, params);
      var hubbleValue = e === Infinity ? 0 : 1 / e;
      var particleIntegral = particleComovingIntegral(a, params);
      var eventIntegral = eventComovingIntegral(a, params);
      var particleValue = finite(particleIntegral) ? a * particleIntegral : Infinity;
      var eventValue = finite(eventIntegral) ? a * eventIntegral : Infinity;

      return {
        a: a,
        params: params,
        E: e,
        hubble: e === Infinity || finite(hubbleValue)
          ? finiteMetric(hubbleValue)
          : undefinedMetric("E(a) 无法定义"),
        particleIntegral: finite(particleIntegral)
          ? finiteMetric(particleIntegral)
          : divergentMetric("过去积分从 a'=0 开始发散"),
        particle: finite(particleValue)
          ? finiteMetric(particleValue)
          : divergentMetric("粒子视界的过去积分发散，因此没有有限粒子视界"),
        eventIntegral: finite(eventIntegral)
          ? finiteMetric(eventIntegral)
          : divergentMetric("未来积分到 a'=∞ 发散"),
        event: finite(eventValue)
          ? finiteMetric(eventValue)
          : divergentMetric("事件视界的未来积分发散，因此事件视界不存在")
      };
    }

    function asymptoticLimits(raw) {
      var params = normalizeParams(raw);
      var hasEarlyComponent = params.omegaR > 0 || params.omegaM > 0;
      var pureDeSitter = !hasEarlyComponent && params.omegaLambda > 0;
      var hubbleAtZero;
      if (params.omegaR > 0) hubbleAtZero = "0（∝a²）";
      else if (params.omegaM > 0) hubbleAtZero = "0（∝a³ᐟ²）";
      else hubbleAtZero = "1/√ΩΛ";

      var hubbleAtInfinity;
      if (params.omegaLambda > 0) hubbleAtInfinity = "1/√ΩΛ";
      else if (params.omegaR > 0) hubbleAtInfinity = "∞（∝a²）";
      else hubbleAtInfinity = "∞（∝a³ᐟ²）";

      return {
        aToZero: {
          hubble: hubbleAtZero,
          particle: pureDeSitter ? "∞（过去积分发散）" : "0",
          event: pureDeSitter ? "1/√ΩΛ" : params.omegaLambda > 0 ? "0" : "∞（不存在）"
        },
        aToInfinity: {
          hubble: hubbleAtInfinity,
          particle: "∞",
          event: params.omegaLambda > 0 ? "1/√ΩΛ" : "∞（不存在）"
        }
      };
    }

    function assertClose(actual, expected, tolerance, message) {
      if (!finite(actual) || Math.abs(actual - expected) > tolerance) {
        throw new Error(
          message + "；得到 " + String(actual) + "，期望 " + String(expected)
        );
      }
    }

    function assertDivergent(metric, message) {
      if (!metric || metric.status !== "divergent" || metric.value !== Infinity) {
        throw new Error(message + "；应为 Infinity/发散状态。");
      }
    }

    function assertAnalyticLimits() {
      var radiation = distanceLedger(1, PRESETS[0]);
      assertClose(radiation.hubble.value, 1, 1e-10, "辐射 a=1 的 Hubble 半径");
      assertClose(radiation.particle.value, 1, 1e-10, "辐射 a=1 的粒子视界");
      assertDivergent(radiation.event, "辐射没有事件视界");

      var matter = distanceLedger(1, PRESETS[1]);
      assertClose(matter.hubble.value, 1, 1e-10, "物质 a=1 的 Hubble 半径");
      assertClose(matter.particle.value, 2, 1e-9, "物质 a=1 的粒子视界");
      assertDivergent(matter.event, "物质没有事件视界");
      var matterEarly = distanceLedger(1e-4, PRESETS[1]);
      assertClose(
        matterEarly.particle.value / matterEarly.hubble.value,
        2,
        1e-8,
        "物质 a→0 时 Dp/DH=2"
      );

      var deSitter = distanceLedger(1, PRESETS[2]);
      assertClose(deSitter.hubble.value, 1, 1e-10, "de Sitter 的 Hubble 半径");
      assertDivergent(deSitter.particle, "de Sitter 平坦坐标片没有有限粒子视界");
      assertClose(deSitter.event.value, 1, 1e-9, "de Sitter 的事件视界");
      var deSitterHalf = distanceLedger(0.5, PRESETS[2]);
      assertClose(deSitterHalf.event.value, 1, 1e-9, "de Sitter 任意 a 的事件视界");

      var lcdm = distanceLedger(1, PRESETS[3]);
      if (!lcdm.particle.finite || !lcdm.event.finite) {
        throw new Error("ΛCDM toy 应同时有有限粒子视界和事件视界。");
      }
      if (asymptoticLimits(PRESETS[1]).aToInfinity.event.indexOf("不存在") === -1) {
        throw new Error("无 Λ 的未来极限必须标为事件视界不存在。");
      }
      if (asymptoticLimits(PRESETS[2]).aToZero.particle.indexOf("发散") === -1) {
        throw new Error("纯 de Sitter 的 a→0 粒子积分必须标为发散。");
      }
      return true;
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

    function formatNumber(value, digits) {
      if (!finite(value)) return "—";
      var places = digits === undefined ? 3 : digits;
      if (Math.abs(value) > 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) {
        return value.toExponential(Math.min(places, 4));
      }
      var text = value.toFixed(places);
      return text.replace(/0+$/, "").replace(/\.$/, "");
    }

    function metricText(metric, kind) {
      if (!metric || metric.status === "undefined") return "—";
      if (metric.status === "divergent") {
        return kind === "horizon" && metric.reason && metric.reason.indexOf("事件视界") !== -1
          ? "∞（发散；不存在）"
          : "∞（发散）";
      }
      return formatNumber(metric.value, 3);
    }

    function formulaParams(params) {
      return (
        "Ωr=" + formatNumber(params.omegaR, 4) +
        "，Ωm=" + formatNumber(params.omegaM, 4) +
        "，ΩΛ=" + formatNumber(params.omegaLambda, 4)
      );
    }

    function injectStyles(doc) {
      if (!doc || !doc.createElement || doc.getElementById(STYLE_ID)) return;
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent = [
        ".ch-lab{--ch-hubble:var(--cl-blue,var(--accent,#315f9d));--ch-particle:var(--cl-green,#39734d);--ch-event:var(--cl-red,#b64335);--ch-selected:var(--cl-gold,#9b6a12);color:var(--fg);font-size:.95em;line-height:1.5;min-width:0}",
        ".ch-lab *,.ch-lab *::before,.ch-lab *::after{box-sizing:border-box}",
        ".ch-lab .ch-shell{display:grid;gap:14px;min-width:0}",
        ".ch-lab .ch-heading{margin:0;color:var(--accent);font-size:1.2rem}",
        ".ch-lab .ch-intro,.ch-lab .ch-note,.ch-lab .ch-status{margin:0;color:var(--fg-soft)}",
        ".ch-lab .ch-control-layout{display:grid;grid-template-columns:minmax(220px,.78fr) minmax(0,1.5fr);gap:16px;align-items:start;min-width:0}",
        ".ch-lab .ch-controls,.ch-lab .ch-stage,.ch-lab .ch-panel{min-width:0}",
        ".ch-lab .ch-panel{padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg)}",
        ".ch-lab .ch-panel h4{margin:0 0 9px;font-size:1rem}",
        ".ch-lab .ch-control{display:grid;gap:5px;margin-bottom:13px;min-width:0}",
        ".ch-lab .ch-control-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px;flex-wrap:wrap}",
        ".ch-lab .ch-control-head label,.ch-lab .ch-label{color:var(--fg-soft);font-size:13px;font-weight:650}",
        ".ch-lab .ch-control output{color:var(--accent);font-variant-numeric:tabular-nums;white-space:nowrap}",
        ".ch-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent)}",
        ".ch-lab .ch-scale{display:flex;justify-content:space-between;gap:8px;color:var(--fg-soft);font-size:11px}",
        ".ch-lab .ch-preset-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}",
        ".ch-lab button{min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;line-height:1.25;cursor:pointer}",
        ".ch-lab button:hover{border-color:var(--accent)}",
        ".ch-lab button[aria-pressed=true],.ch-lab button.ch-primary{background:var(--accent);border-color:var(--accent);color:var(--bg);font-weight:700}",
        ".ch-lab button:focus-visible,.ch-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}",
        ".ch-lab .ch-prediction{display:grid;gap:8px;margin-top:15px;padding-top:12px;border-top:1px solid var(--border)}",
        ".ch-lab .ch-prediction-question{margin:0;color:var(--fg);font-weight:650}",
        ".ch-lab .ch-prediction-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}",
        ".ch-lab .ch-feedback{min-height:2.9em;margin:0;color:var(--fg-soft);font-size:13px}",
        ".ch-lab .ch-feedback.ch-good{color:var(--cl-green,#39734d)}",
        ".ch-lab .ch-feedback.ch-warn{color:var(--cl-red,#b64335)}",
        ".ch-lab .ch-chart-frame{min-width:0;padding:10px;border:1px solid var(--border);border-radius:7px;background:var(--bg)}",
        ".ch-lab .ch-chart-title{display:flex;justify-content:space-between;gap:10px;align-items:baseline;margin:0 0 8px;color:var(--fg-soft);font-size:13px}",
        ".ch-lab .ch-chart-svg{display:block;width:100%;height:auto;min-width:0;color:var(--fg)}",
        ".ch-lab .ch-grid-line{stroke:currentColor;stroke-opacity:.14;stroke-width:1}",
        ".ch-lab .ch-axis{stroke:currentColor;stroke-opacity:.6;stroke-width:1.2}",
        ".ch-lab .ch-series-hubble{fill:none;stroke:var(--ch-hubble);stroke-width:2.5}",
        ".ch-lab .ch-series-particle{fill:none;stroke:var(--ch-particle);stroke-width:2.5}",
        ".ch-lab .ch-series-event{fill:none;stroke:var(--ch-event);stroke-width:2.5}",
        ".ch-lab .ch-point-hubble{fill:var(--ch-hubble);stroke:var(--bg);stroke-width:2}",
        ".ch-lab .ch-point-particle{fill:var(--ch-particle);stroke:var(--bg);stroke-width:2}",
        ".ch-lab .ch-point-event{fill:var(--ch-event);stroke:var(--bg);stroke-width:2}",
        ".ch-lab .ch-chart-infinite-particle{fill:var(--ch-particle);font-weight:700}",
        ".ch-lab .ch-chart-infinite-event{fill:var(--ch-event);font-weight:700}",
        ".ch-lab .ch-chart-selected{stroke:var(--ch-selected);stroke-width:1.5;stroke-dasharray:5 4}",
        ".ch-lab .ch-svg-label{fill:currentColor;font-size:12px}",
        ".ch-lab .ch-legend{display:flex;flex-wrap:wrap;gap:7px 14px;margin-top:9px;color:var(--fg-soft);font-size:12px}",
        ".ch-lab .ch-legend-item{display:inline-flex;align-items:center;gap:6px;min-width:0}",
        ".ch-lab .ch-swatch{display:inline-block;width:23px;height:3px;flex:0 0 auto;background:currentColor}",
        ".ch-lab .ch-swatch-hubble{color:var(--ch-hubble)}",
        ".ch-lab .ch-swatch-particle{color:var(--ch-particle)}",
        ".ch-lab .ch-swatch-event{color:var(--ch-event)}",
        ".ch-lab .ch-infinity-swatch{height:0;border-top:2px dashed currentColor;background:transparent}",
        ".ch-lab .ch-chart-note{margin:8px 0 0;color:var(--fg-soft);font-size:12px}",
        ".ch-lab .ch-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:12px}",
        ".ch-lab .ch-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}",
        ".ch-lab .ch-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.35}",
        ".ch-lab .ch-metric strong{display:block;margin-top:3px;color:var(--fg);font-size:16px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
        ".ch-lab .ch-metric[data-status=divergent] strong{color:var(--cl-red,#b64335)}",
        ".ch-lab .ch-ledger-title{margin:15px 0 8px;font-size:1rem}",
        ".ch-lab .ch-table-scroll{max-width:100%;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;border:1px solid var(--border);border-radius:5px}",
        ".ch-lab .ch-ledger{width:100%;min-width:650px;border-collapse:collapse;table-layout:fixed;font-size:12.5px}",
        ".ch-lab .ch-ledger th,.ch-lab .ch-ledger td{padding:8px 9px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}",
        ".ch-lab .ch-ledger th{color:var(--fg-soft);font-weight:650;background:var(--block-bg,var(--bg))}",
        ".ch-lab .ch-ledger tr:last-child td{border-bottom:0}",
        ".ch-lab .ch-ledger td:nth-child(1){width:18%;font-weight:650}",
        ".ch-lab .ch-ledger td:nth-child(2){width:37%;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;overflow-wrap:anywhere}",
        ".ch-lab .ch-ledger td:nth-child(3){width:18%;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
        ".ch-lab .ch-ledger td:nth-child(4){width:27%;color:var(--fg-soft)}",
        ".ch-lab .ch-ledger [data-status=divergent]{color:var(--cl-red,#b64335);font-weight:650}",
        ".ch-lab .ch-concepts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:12px}",
        ".ch-lab .ch-concept{min-width:0;padding:10px;border-left:3px solid var(--border);background:var(--block-bg,var(--bg))}",
        ".ch-lab .ch-concept strong{display:block;margin-bottom:3px}",
        ".ch-lab .ch-concept p{margin:0;color:var(--fg-soft);font-size:12.5px}",
        ".ch-lab .ch-sr-only{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}",
        "@media (max-width:760px){.ch-lab .ch-control-layout{grid-template-columns:minmax(0,1fr)}.ch-lab .ch-concepts{grid-template-columns:minmax(0,1fr)}}",
        "@media (max-width:520px){.ch-lab .ch-preset-grid,.ch-lab .ch-prediction-options{grid-template-columns:minmax(0,1fr)}.ch-lab .ch-metrics{grid-template-columns:minmax(0,1fr)}.ch-lab .ch-panel{padding:10px}.ch-lab .ch-ledger{min-width:600px}}",
        "@media (prefers-reduced-motion:reduce){.ch-lab *,.ch-lab *::before,.ch-lab *::after{scroll-behavior:auto!important;transition:none!important;animation:none!important}}"
      ].join("");
      doc.head.appendChild(style);
    }

    function svgText(api, doc, x, y, value, attrs) {
      var merged = Object.assign(
        { x: x, y: y, className: "ch-svg-label", fill: "currentColor", "font-size": "12" },
        attrs || {}
      );
      return makeSvg(api, doc, "text", merged, [value]);
    }

    function makeMetric(api, doc, label) {
      var node = makeElement(api, doc, "div", { className: "ch-metric" });
      var name = makeElement(api, doc, "span", { text: label });
      var value = makeElement(api, doc, "strong", { text: "—" });
      node.appendChild(name);
      node.appendChild(value);
      return { node: node, value: value };
    }

    function formatA(value) {
      return "a=" + formatNumber(value, 2);
    }

    function formatCurrent(metric, kind) {
      return metricText(metric, kind);
    }

    function makePrediction(api, doc, root, title, choices, correctChoice, explanation) {
      var node = makeElement(api, doc, "div", { className: "ch-prediction" });
      node.appendChild(makeElement(api, doc, "p", { className: "ch-prediction-question" }, title));
      var options = makeElement(api, doc, "div", {
        className: "ch-prediction-options",
        role: "group",
        "aria-label": title
      });
      var feedback = makeElement(api, doc, "p", {
        className: "ch-feedback",
        "aria-live": "polite",
        "aria-atomic": "true",
        text: "先选一个预测；读数会在下方核对。"
      });
      var buttons = [];
      choices.forEach(function (choice) {
        var button = makeElement(api, doc, "button", {
          type: "button",
          "aria-pressed": "false"
        }, choice.label);
        button.addEventListener("click", function () {
          buttons.forEach(function (other) {
            other.setAttribute("aria-pressed", other === button ? "true" : "false");
          });
          var correct = choice.id === correctChoice();
          feedback.className = "ch-feedback " + (correct ? "ch-good" : "ch-warn");
          feedback.textContent = (correct ? "✓ 预测正确。" : "再检查一次积分的上下限。") + explanation();
          if (root && root.ownerDocument && host && host.CourseLearning && typeof host.CourseLearning.api !== "undefined") {
            if (typeof host.CourseLearning.api.announce === "function") {
              host.CourseLearning.api.announce(root, feedback.textContent);
            }
          }
        });
        buttons.push(button);
        options.appendChild(button);
      });
      node.appendChild(options);
      node.appendChild(feedback);
      return {
        node: node,
        feedback: feedback,
        reset: function () {
          buttons.forEach(function (button) { button.setAttribute("aria-pressed", "false"); });
          feedback.className = "ch-feedback";
          feedback.textContent = "模型或 a 已改变；请重新预测。";
        }
      };
    }

    function chartSamples(params, selectedA) {
      var values = [0.02, 0.04, 0.07, 0.12, 0.2, 0.32, 0.5, 0.75, 1, 1.35, 1.8, 2.4, 3.1, 4];
      if (values.indexOf(selectedA) === -1) values.push(selectedA);
      values.sort(function (left, right) { return left - right; });
      return values.map(function (value) {
        var ledger = distanceLedger(value, params);
        return { a: value, hubble: ledger.hubble, particle: ledger.particle, event: ledger.event };
      });
    }

    function drawPath(api, doc, data, key, xScale, yScale, className) {
      var paths = [];
      var points = [];

      function flush() {
        if (points.length < 2) {
          points = [];
          return;
        }
        paths.push(
          points
            .map(function (point, index) {
              return (index === 0 ? "M " : "L ") + point[0].toFixed(2) + " " + point[1].toFixed(2);
            })
            .join(" ")
        );
        points = [];
      }

      data.forEach(function (item) {
        var metric = item[key];
        if (!metric || !metric.finite) flush();
        else points.push([xScale(item.a), yScale(metric.value)]);
      });
      flush();
      return paths.map(function (path) {
        return makeSvg(api, doc, "path", { d: path, className: className });
      });
    }

    function drawChart(api, doc, svg, params, selectedA, selectedLedger) {
      var frame = svg.parentNode;
      var width = Math.max(300, Math.round((frame && frame.clientWidth) || 680));
      var height = width < 520 ? 390 : 360;
      var margin = { left: 58, right: 16, top: 30, bottom: 50 };
      var plotLeft = margin.left;
      var plotRight = width - margin.right;
      var plotTop = margin.top;
      var plotBottom = height - margin.bottom;
      var data = chartSamples(params, selectedA);
      var finiteValues = [];
      data.forEach(function (item) {
        [item.hubble, item.particle, item.event].forEach(function (metric) {
          if (metric && metric.finite) finiteValues.push(metric.value);
        });
      });
      if (selectedLedger) {
        [selectedLedger.hubble, selectedLedger.particle, selectedLedger.event].forEach(function (metric) {
          if (metric && metric.finite) finiteValues.push(metric.value);
        });
      }
      var maxValue = finiteValues.length ? Math.max.apply(Math, finiteValues) : 1;
      maxValue = Math.max(maxValue * 1.15, 1e-6);
      var minA = 0.02;
      var maxA = 4;
      var logMin = Math.log(minA);
      var logSpan = Math.log(maxA) - logMin;
      var xScale = function (value) {
        return plotLeft + ((Math.log(value) - logMin) / logSpan) * (plotRight - plotLeft);
      };
      var yScale = function (value) {
        return plotBottom - (value / maxValue) * (plotBottom - plotTop);
      };

      svg.setAttribute("viewBox", "0 0 " + width + " " + height);
      svg.setAttribute("width", "100%");
      svg.setAttribute("height", String(height));
      clear(svg);

      svg.appendChild(makeSvg(api, doc, "title", {}, "平坦 FRW 三种距离随尺度因子变化"));
      svg.appendChild(makeSvg(api, doc, "desc", {}, "横轴为对数尺度因子 a，三条曲线分别表示 Hubble 半径、粒子视界和事件视界；发散积分以无穷标记显示，不使用有限截断。"));

      [0, 0.25, 0.5, 0.75, 1].forEach(function (fraction) {
        var y = plotBottom - fraction * (plotBottom - plotTop);
        svg.appendChild(makeSvg(api, doc, "line", {
          x1: plotLeft,
          x2: plotRight,
          y1: y,
          y2: y,
          className: "ch-grid-line"
        }));
        svg.appendChild(svgText(api, doc, plotLeft - 7, y + 4, formatNumber(maxValue * fraction, 2), {
          "text-anchor": "end"
        }));
      });

      svg.appendChild(makeSvg(api, doc, "line", {
        x1: plotLeft,
        x2: plotLeft,
        y1: plotTop,
        y2: plotBottom,
        className: "ch-axis"
      }));
      svg.appendChild(makeSvg(api, doc, "line", {
        x1: plotLeft,
        x2: plotRight,
        y1: plotBottom,
        y2: plotBottom,
        className: "ch-axis"
      }));

      var xTicks = width < 520 ? [0.02, 0.2, 1, 4] : [0.02, 0.1, 0.5, 1, 2, 4];
      xTicks.forEach(function (value) {
        var x = xScale(value);
        svg.appendChild(makeSvg(api, doc, "line", {
          x1: x,
          x2: x,
          y1: plotBottom,
          y2: plotBottom + 5,
          className: "ch-axis"
        }));
        svg.appendChild(svgText(api, doc, x, plotBottom + 20, "a=" + formatNumber(value, value < 0.1 ? 2 : 1), {
          "text-anchor": "middle"
        }));
      });

      svg.appendChild(svgText(api, doc, plotLeft, 16, "距离 / (c/H₀)", {}));
      svg.appendChild(svgText(api, doc, plotRight, height - 9, "尺度因子 a（对数轴）", {
        "text-anchor": "end"
      }));

      drawPath(api, doc, data, "hubble", xScale, yScale, "ch-series-hubble").forEach(function (path) { svg.appendChild(path); });
      drawPath(api, doc, data, "particle", xScale, yScale, "ch-series-particle").forEach(function (path) { svg.appendChild(path); });
      drawPath(api, doc, data, "event", xScale, yScale, "ch-series-event").forEach(function (path) { svg.appendChild(path); });

      var selectedX = xScale(selectedA);
      svg.appendChild(makeSvg(api, doc, "line", {
        x1: selectedX,
        x2: selectedX,
        y1: plotTop,
        y2: plotBottom,
        className: "ch-chart-selected"
      }));
      [
        [selectedLedger.hubble, "ch-point-hubble"],
        [selectedLedger.particle, "ch-point-particle"],
        [selectedLedger.event, "ch-point-event"]
      ].forEach(function (item) {
        if (!item[0].finite) return;
        svg.appendChild(makeSvg(api, doc, "circle", {
          cx: selectedX,
          cy: yScale(item[0].value),
          r: 4.5,
          className: item[1]
        }));
      });
      svg.appendChild(svgText(api, doc, Math.min(plotRight - 5, selectedX + 7), plotTop + 15, formatA(selectedA), {
        "text-anchor": selectedX > plotRight - 70 ? "end" : "start"
      }));

      var infinityLabels = [];
      if (selectedLedger.particle.status === "divergent") infinityLabels.push(["∞  粒子视界：过去积分发散", "ch-chart-infinite-particle"]);
      if (selectedLedger.event.status === "divergent") infinityLabels.push(["∞  事件视界：未来积分发散 / 不存在", "ch-chart-infinite-event"]);
      infinityLabels.forEach(function (item, index) {
        svg.appendChild(svgText(api, doc, plotLeft + 8, plotTop + 18 + index * 22, item[0], {
          className: item[1]
        }));
      });
    }

    function mount(root, api) {
      var doc = root.ownerDocument || (typeof document !== "undefined" ? document : null);
      if (!doc) return;
      injectStyles(doc);
      root.classList.add("ch-lab");
      SERIAL += 1;
      var prefix = "ch-" + SERIAL;
      var state = {
        params: cloneParams(PRESETS[3]),
        presetId: PRESETS[3].id,
        a: 1
      };
      var refs = {};
      var predictions = [];

      clear(root);
      var shell = makeElement(api, doc, "div", { className: "ch-shell" });
      var heading = makeElement(api, doc, "h3", { className: "ch-heading", id: prefix + "-heading" }, "平坦 FRW toy model：三种“视界”的距离账本");
      shell.appendChild(heading);
      shell.appendChild(makeElement(api, doc, "p", { className: "ch-intro" }, "距离均以 c/H₀ 归一化；拖动 a 或切换预设，比较 c/H、粒子视界与事件视界。参数是教学 toy，不是最新精密宇宙学拟合。"));

      var layout = makeElement(api, doc, "div", { className: "ch-control-layout" });
      var controls = makeElement(api, doc, "aside", { className: "ch-controls", "aria-label": "FRW toy model 控制与预测" });
      var controlPanel = makeElement(api, doc, "section", { className: "ch-panel", "aria-labelledby": prefix + "-control-title" });
      controlPanel.appendChild(makeElement(api, doc, "h4", { id: prefix + "-control-title" }, "模型与尺度因子"));
      var presetLabel = makeElement(api, doc, "p", { className: "ch-label", text: "教学预设（平坦且 Ωr+Ωm+ΩΛ=1）" });
      controlPanel.appendChild(presetLabel);
      var presetGrid = makeElement(api, doc, "div", { className: "ch-preset-grid", role: "group", "aria-label": "FRW 教学预设" });
      PRESETS.forEach(function (preset) {
        var button = makeElement(api, doc, "button", {
          type: "button",
          "aria-pressed": preset.id === state.presetId ? "true" : "false"
        }, preset.label);
        button.addEventListener("click", function () {
          state.params = cloneParams(preset);
          state.presetId = preset.id;
          predictions.forEach(function (prediction) { prediction.reset(); });
          render();
          if (api && typeof api.announce === "function") api.announce(root, "已切换到" + preset.label + "预设。" + preset.note);
        });
        preset.button = button;
        presetGrid.appendChild(button);
      });
      controlPanel.appendChild(presetGrid);

      var aControl = makeElement(api, doc, "div", { className: "ch-control" });
      var aId = prefix + "-scale-factor";
      var aHead = makeElement(api, doc, "div", { className: "ch-control-head" });
      aHead.appendChild(makeElement(api, doc, "label", { htmlFor: aId }, "当前尺度因子 a"));
      refs.aOutput = makeElement(api, doc, "output", { for: aId, text: "a=1" });
      aHead.appendChild(refs.aOutput);
      aControl.appendChild(aHead);
      refs.aInput = makeElement(api, doc, "input", {
        id: aId,
        type: "range",
        min: "0.02",
        max: "4",
        step: "0.01",
        value: "1",
        "aria-label": "当前尺度因子 a；范围 0.02 到 4"
      });
      refs.aInput.addEventListener("input", function () {
        state.a = Number(refs.aInput.value);
        predictions.forEach(function (prediction) { prediction.reset(); });
        render();
      });
      aControl.appendChild(refs.aInput);
      aControl.appendChild(makeElement(api, doc, "div", { className: "ch-scale" }, [
        makeElement(api, doc, "span", { text: "早期 a→0" }),
        makeElement(api, doc, "span", { text: "现在 a=1" }),
        makeElement(api, doc, "span", { text: "未来 a>1" })
      ]));
      controlPanel.appendChild(aControl);
      controlPanel.appendChild(makeElement(api, doc, "p", { className: "ch-note" }, "滑杆避开精确的 a=0 奇点；a→0 的解析极限在学习层、账本边界说明和 Node 断言中单独处理。"));

      var eventPrediction = makePrediction(
        api,
        doc,
        root,
        "预测 1：未来无穷的光还能回到这里吗？",
        [
          { id: "finite", label: "有有限事件视界" },
          { id: "divergent", label: "发散，不存在" }
        ],
        function () { return state.params.omegaLambda > 0 ? "finite" : "divergent"; },
        function () {
          return state.params.omegaLambda > 0
            ? " 当前 ΩΛ>0，使 ∫ₐ^∞ da'/(a'²H) 收敛。"
            : " 当前 ΩΛ=0，未来积分发散；不能拿有限未来截断冒充事件视界。";
        }
      );
      predictions.push(eventPrediction);
      controlPanel.appendChild(eventPrediction.node);

      var causalPrediction = makePrediction(
        api,
        doc,
        root,
        "预测 2：Hubble sphere c/H 是因果边界吗？",
        [
          { id: "not-boundary", label: "通常不是" },
          { id: "boundary", label: "是" }
        ],
        function () { return "not-boundary"; },
        function () {
          return " c/H 是瞬时退行速度 H D=c 的尺度；因果问题要看过去/未来的光锥积分。";
        }
      );
      predictions.push(causalPrediction);
      controlPanel.appendChild(causalPrediction.node);
      controls.appendChild(controlPanel);
      layout.appendChild(controls);

      var stage = makeElement(api, doc, "section", { className: "ch-stage", "aria-labelledby": prefix + "-stage-title" });
      var chartFrame = makeElement(api, doc, "div", { className: "ch-chart-frame" });
      chartFrame.appendChild(makeElement(api, doc, "div", { className: "ch-chart-title", id: prefix + "-stage-title" }, [
        makeElement(api, doc, "strong", { text: "因果 / 距离图" }),
        makeElement(api, doc, "span", { text: "有限曲线随 a 变化；∞ 明确表示发散" })
      ]));
      refs.svg = makeSvg(api, doc, "svg", {
        className: "ch-chart-svg",
        role: "img",
        "aria-label": "平坦 FRW 三种距离随尺度因子变化",
        "aria-describedby": prefix + "-chart-note"
      });
      refs.svg.appendChild(makeSvg(api, doc, "title", { id: prefix + "-chart-title" }, "平坦 FRW 三种距离随尺度因子变化"));
      refs.svg.appendChild(makeSvg(api, doc, "desc", { id: prefix + "-chart-desc" }, "Hubble 半径、粒子视界、事件视界的距离曲线；没有有限视界的积分显示为发散标记。"));
      chartFrame.appendChild(refs.svg);
      var legend = makeElement(api, doc, "div", { className: "ch-legend", "aria-label": "距离图图例" });
      refs.legendHubble = makeElement(api, doc, "span", { className: "ch-legend-item" }, [
        makeElement(api, doc, "i", { className: "ch-swatch ch-swatch-hubble" }),
        makeElement(api, doc, "span", { text: "Hubble sphere D_H=c/H" })
      ]);
      refs.legendParticle = makeElement(api, doc, "span", { className: "ch-legend-item" }, [
        makeElement(api, doc, "i", { className: "ch-swatch ch-swatch-particle" }),
        makeElement(api, doc, "span", { text: "粒子视界 D_p" })
      ]);
      refs.legendEvent = makeElement(api, doc, "span", { className: "ch-legend-item" }, [
        makeElement(api, doc, "i", { className: "ch-swatch ch-swatch-event" }),
        makeElement(api, doc, "span", { text: "事件视界 D_e" })
      ]);
      legend.appendChild(refs.legendHubble);
      legend.appendChild(refs.legendParticle);
      legend.appendChild(refs.legendEvent);
      chartFrame.appendChild(legend);
      refs.chartNote = makeElement(api, doc, "p", { className: "ch-chart-note", id: prefix + "-chart-note" });
      chartFrame.appendChild(refs.chartNote);
      stage.appendChild(chartFrame);

      var metricGrid = makeElement(api, doc, "div", { className: "ch-metrics", "aria-label": "当前距离读数" });
      refs.metricHubble = makeMetric(api, doc, "当前 Hubble sphere D_H/(c/H₀)");
      refs.metricParticle = makeMetric(api, doc, "当前粒子视界 D_p/(c/H₀)");
      refs.metricEvent = makeMetric(api, doc, "当前事件视界 D_e/(c/H₀)");
      metricGrid.appendChild(refs.metricHubble.node);
      metricGrid.appendChild(refs.metricParticle.node);
      metricGrid.appendChild(refs.metricEvent.node);
      stage.appendChild(metricGrid);

      var ledgerTitle = makeElement(api, doc, "h4", { className: "ch-ledger-title" }, "积分账本（当前 a）");
      stage.appendChild(ledgerTitle);
      var tableScroll = makeElement(api, doc, "div", { className: "ch-table-scroll" });
      var table = makeElement(api, doc, "table", { className: "ch-ledger", "aria-label": "FRW 距离积分账本" });
      var thead = makeElement(api, doc, "thead");
      thead.appendChild(makeElement(api, doc, "tr", {}, [
        makeElement(api, doc, "th", { scope: "col", text: "对象" }),
        makeElement(api, doc, "th", { scope: "col", text: "定义 / 正则化后的积分" }),
        makeElement(api, doc, "th", { scope: "col", text: "当前读数" }),
        makeElement(api, doc, "th", { scope: "col", text: "回答的问题" })
      ]));
      table.appendChild(thead);
      var tbody = makeElement(api, doc, "tbody");

      function ledgerRow(key, object, formula, question) {
        var row = makeElement(api, doc, "tr");
        row.appendChild(makeElement(api, doc, "td", { text: object }));
        row.appendChild(makeElement(api, doc, "td", { text: formula }));
        var current = makeElement(api, doc, "td", { text: "—" });
        row.appendChild(current);
        row.appendChild(makeElement(api, doc, "td", { text: question }));
        tbody.appendChild(row);
        refs[key] = current;
      }

      ledgerRow("e", "E(a)", "√(Ωr a⁻⁴+Ωm a⁻³+ΩΛ)", "无量纲膨胀率");
      ledgerRow("hubble", "Hubble sphere", "D_H/(c/H₀)=1/E(a)", "瞬时 H D=c 的尺度，不等于因果边界");
      ledgerRow("particleIntegral", "过去积分 I_p", "∫₀ᵃ da'/(a'²E)=∫₀ᵃ dx/√(Ωr+Ωm x+ΩΛx⁴)", "过去光信号累计的共动距离");
      ledgerRow("particle", "粒子视界", "D_p/(c/H₀)=a I_p", "过去能否联系？");
      ledgerRow("eventIntegral", "未来积分 I_e", "∫ₐ^∞ da'/(a'²E)=∫₀¹ᐟᵃ du/√(Ωr u⁴+Ωm u³+ΩΛ)", "未来无穷的精确积分；∞ 不截断");
      ledgerRow("event", "事件视界", "D_e/(c/H₀)=a I_e", "未来能否联系？");
      table.appendChild(tbody);
      tableScroll.appendChild(table);
      stage.appendChild(tableScroll);

      var concepts = makeElement(api, doc, "div", { className: "ch-concepts", "aria-label": "三个概念的区别" });
      concepts.appendChild(makeElement(api, doc, "div", { className: "ch-concept" }, [
        makeElement(api, doc, "strong", { text: "Hubble sphere" }),
        makeElement(api, doc, "p", { text: "通常不是因果边界；D>c/H 的超光速退行不违反局域狭义相对论，因为这是整体膨胀的远距离速率。" })
      ]));
      concepts.appendChild(makeElement(api, doc, "div", { className: "ch-concept" }, [
        makeElement(api, doc, "strong", { text: "粒子视界" }),
        makeElement(api, doc, "p", { text: "由过去的 ∫₀ᵃ 决定：回答从大爆炸/模型起点到现在，哪些区域原则上已经能联系到我们。" })
      ]));
      concepts.appendChild(makeElement(api, doc, "div", { className: "ch-concept" }, [
        makeElement(api, doc, "strong", { text: "事件视界" }),
        makeElement(api, doc, "p", { text: "由未来的 ∫ₐ^∞ 决定：回答从现在发出的信号，未来是否仍有机会到达指定观察者。" })
      ]));
      stage.appendChild(concepts);
      layout.appendChild(stage);
      shell.appendChild(layout);
      refs.status = makeElement(api, doc, "p", { className: "ch-status", "aria-live": "polite", "aria-atomic": "true" });
      shell.appendChild(refs.status);
      root.appendChild(shell);

      function updateMetric(ref, metric, kind) {
        ref.value.textContent = formatCurrent(metric, kind);
        ref.node.setAttribute("data-status", metric.status);
      }

      function updateLedger(ledger) {
        refs.aOutput.textContent = formatA(state.a);
        refs.e.textContent = formatNumber(ledger.E, 4);
        refs.e.removeAttribute("data-status");
        refs.hubble.textContent = metricText(ledger.hubble, "distance");
        refs.hubble.setAttribute("data-status", ledger.hubble.status);
        refs.particleIntegral.textContent = metricText(ledger.particleIntegral, "integral");
        refs.particleIntegral.setAttribute("data-status", ledger.particleIntegral.status);
        refs.particle.textContent = metricText(ledger.particle, "horizon");
        refs.particle.setAttribute("data-status", ledger.particle.status);
        refs.eventIntegral.textContent = metricText(ledger.eventIntegral, "integral");
        refs.eventIntegral.setAttribute("data-status", ledger.eventIntegral.status);
        refs.event.textContent = metricText(ledger.event, "horizon");
        refs.event.setAttribute("data-status", ledger.event.status);
      }

      function updateLegend(ledger) {
        refs.legendParticle.lastChild.textContent = ledger.particle.status === "divergent"
          ? "粒子视界 D_p · 发散"
          : "粒子视界 D_p · 有限";
        refs.legendEvent.lastChild.textContent = ledger.event.status === "divergent"
          ? "事件视界 D_e · 发散 / 不存在"
          : "事件视界 D_e · 有限";
        refs.chartNote.textContent = ledger.event.status === "divergent"
          ? "图中的 ∞ 是未来积分发散的语义标记，不是把 a'=∞ 截在某个有限数值；因此此模型没有有限事件视界。"
          : ledger.particle.status === "divergent"
            ? "当前粒子积分从 a'=0 发散；图中 ∞ 不是有限纵轴上限，事件视界仍由未来无穷积分给出。"
            : "三条曲线都有限；Hubble sphere 只由瞬时 H(a) 定义，因果判断仍看两条光锥积分。";
      }

      function render() {
        PRESETS.forEach(function (preset) {
          preset.button.setAttribute("aria-pressed", preset.id === state.presetId ? "true" : "false");
        });
        var ledger = distanceLedger(state.a, state.params);
        updateMetric(refs.metricHubble, ledger.hubble, "distance");
        updateMetric(refs.metricParticle, ledger.particle, "horizon");
        updateMetric(refs.metricEvent, ledger.event, "horizon");
        updateLedger(ledger);
        updateLegend(ledger);
        refs.status.textContent =
          "当前：" + formulaParams(state.params) + "；" + formatA(state.a) + "；" +
          "D_H=" + metricText(ledger.hubble, "distance") + "，" +
          "D_p=" + metricText(ledger.particle, "horizon") + "，" +
          "D_e=" + metricText(ledger.event, "horizon") + "（单位 c/H₀）。";
        drawChart(api, doc, refs.svg, state.params, state.a, ledger);
      }

      render();
      if (typeof ResizeObserver !== "undefined") {
        var observer = new ResizeObserver(function () {
          var ledger = distanceLedger(state.a, state.params);
          drawChart(api, doc, refs.svg, state.params, state.a, ledger);
        });
        observer.observe(chartFrame);
      }
    }

    // Loading the module itself is a cheap, deterministic model check.  The
    // same assertion is exported for CI or teaching-console tests.
    assertAnalyticLimits();

    return {
      PRESETS: PRESETS,
      normalizeParams: normalizeParams,
      expansionE: expansionE,
      particleComovingIntegral: particleComovingIntegral,
      eventComovingIntegral: eventComovingIntegral,
      distanceLedger: distanceLedger,
      asymptoticLimits: asymptoticLimits,
      assertAnalyticLimits: assertAnalyticLimits,
      mount: mount
    };
  }
);
