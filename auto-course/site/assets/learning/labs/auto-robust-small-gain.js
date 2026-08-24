(function (root, factory) {
  "use strict";

  var exported = factory(root);

  if (typeof module === "object" && module.exports) {
    module.exports = exported;
  }

  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("auto-robust-small-gain", exported.mount);
  }

  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log("auto-robust-small-gain self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("auto-robust-small-gain self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})
(
  typeof window !== "undefined"
    ? window
    : typeof globalThis !== "undefined"
      ? globalThis
      : null,
  function (host) {
    "use strict";

    var LAB_ID = "auto-robust-small-gain";
    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "auto-robust-small-gain-styles";
    var EPS = 1e-10;
    var DEFAULTS = {
      K: 2,
      tau: 0.4,
      lowWeight: 0.08,
      weightBreak: 4,
      wMin: 0.01,
      wMax: 100,
      points: 180
    };

    var STYLE_TEXT = [
      '[data-learning-lab="auto-robust-small-gain"]{--rb-blue:var(--cl-blue,#315f9d);--rb-orange:var(--cl-gold,#9b6a12);--rb-green:var(--cl-green,#39734d);--rb-red:var(--cl-red,#b64335);display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
      '[data-learning-lab="auto-robust-small-gain"] *{box-sizing:border-box}[data-learning-lab="auto-robust-small-gain"] [hidden]{display:none!important}',
      '[data-learning-lab="auto-robust-small-gain"] h3,[data-learning-lab="auto-robust-small-gain"] h4{margin:0;letter-spacing:0}[data-learning-lab="auto-robust-small-gain"] h3{font-size:1.16rem}[data-learning-lab="auto-robust-small-gain"] h4{margin-top:16px;font-size:1rem}',
      '[data-learning-lab="auto-robust-small-gain"] p{margin:8px 0}[data-learning-lab="auto-robust-small-gain"] .rb-note,[data-learning-lab="auto-robust-small-gain"] .rb-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
      '[data-learning-lab="auto-robust-small-gain"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="auto-robust-small-gain"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}',
      '[data-learning-lab="auto-robust-small-gain"] .rb-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="auto-robust-small-gain"] button,[data-learning-lab="auto-robust-small-gain"] input{font:inherit;letter-spacing:0}',
      '[data-learning-lab="auto-robust-small-gain"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="auto-robust-small-gain"] button:hover{border-color:var(--accent,#315f9d)}[data-learning-lab="auto-robust-small-gain"] button[aria-pressed="true"],[data-learning-lab="auto-robust-small-gain"] .rb-primary{border-color:var(--accent,#315f9d);background:var(--accent,#315f9d);color:var(--bg,#fff);font-weight:750}',
      '[data-learning-lab="auto-robust-small-gain"] button:focus-visible,[data-learning-lab="auto-robust-small-gain"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="auto-robust-small-gain"] button:disabled{cursor:not-allowed;opacity:.55}',
      '[data-learning-lab="auto-robust-small-gain"] .rb-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="auto-robust-small-gain"] .rb-actions>*{flex:1 1 170px}[data-learning-lab="auto-robust-small-gain"] .rb-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="auto-robust-small-gain"] .rb-correct{color:var(--rb-green)}[data-learning-lab="auto-robust-small-gain"] .rb-wrong{color:var(--rb-red)}',
      '[data-learning-lab="auto-robust-small-gain"] .rb-layout{display:grid;grid-template-columns:minmax(220px,.7fr) minmax(0,1.3fr);gap:16px;align-items:start;min-width:0}[data-learning-lab="auto-robust-small-gain"] .rb-controls,[data-learning-lab="auto-robust-small-gain"] .rb-stage{min-width:0}[data-learning-lab="auto-robust-small-gain"] .rb-controls{display:grid;gap:10px;padding:12px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="auto-robust-small-gain"] .rb-control{display:grid;gap:5px;min-width:0}[data-learning-lab="auto-robust-small-gain"] .rb-control label{color:var(--fg-soft,currentColor);font-size:13px;font-weight:700}[data-learning-lab="auto-robust-small-gain"] .rb-control output{color:var(--accent,#315f9d);font-variant-numeric:tabular-nums}',
      '[data-learning-lab="auto-robust-small-gain"] input[type="range"]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent,#315f9d)}[data-learning-lab="auto-robust-small-gain"] .rb-stage-frame{min-width:0;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent);overflow:hidden}[data-learning-lab="auto-robust-small-gain"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="auto-robust-small-gain"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
      '[data-learning-lab="auto-robust-small-gain"] .rb-grid{stroke:var(--border,#cbd5e1);stroke-width:1;stroke-opacity:.7}[data-learning-lab="auto-robust-small-gain"] .rb-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.75}[data-learning-lab="auto-robust-small-gain"] .rb-s{fill:none;stroke:var(--rb-blue);stroke-width:2.4}[data-learning-lab="auto-robust-small-gain"] .rb-t{fill:none;stroke:var(--rb-orange);stroke-width:2.4}[data-learning-lab="auto-robust-small-gain"] .rb-wt{fill:none;stroke:var(--rb-red);stroke-width:2.7}[data-learning-lab="auto-robust-small-gain"] .rb-error{fill:none;stroke:var(--rb-green);stroke-width:2.2}[data-learning-lab="auto-robust-small-gain"] .rb-threshold{stroke:var(--rb-red);stroke-width:1.3;stroke-dasharray:5 4}[data-learning-lab="auto-robust-small-gain"] .rb-label{font-size:11px}[data-learning-lab="auto-robust-small-gain"] .rb-small{font-size:10px;fill:var(--fg-soft,currentColor)!important}',
      '[data-learning-lab="auto-robust-small-gain"] .rb-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(128px,1fr));gap:8px;margin:12px 0}[data-learning-lab="auto-robust-small-gain"] .rb-metric{min-width:0;padding:9px;border-top:2px solid var(--border,#cbd5e1);background:var(--bg,transparent)}[data-learning-lab="auto-robust-small-gain"] .rb-metric:nth-child(3n+1){border-color:var(--rb-blue)}[data-learning-lab="auto-robust-small-gain"] .rb-metric:nth-child(3n+2){border-color:var(--rb-orange)}[data-learning-lab="auto-robust-small-gain"] .rb-metric:nth-child(3n){border-color:var(--rb-green)}[data-learning-lab="auto-robust-small-gain"] .rb-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11.5px}[data-learning-lab="auto-robust-small-gain"] .rb-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
      '[data-learning-lab="auto-robust-small-gain"] .rb-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="auto-robust-small-gain"] table{width:100%;min-width:780px;border-collapse:collapse;font-size:11.5px;font-variant-numeric:tabular-nums;margin-top:12px}[data-learning-lab="auto-robust-small-gain"] th,[data-learning-lab="auto-robust-small-gain"] td{padding:7px 6px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="auto-robust-small-gain"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="auto-robust-small-gain"] .rb-certificate{margin-top:11px;padding:10px 12px;border-left:3px solid var(--rb-green);background:var(--bg,transparent);font-size:13px;line-height:1.7}',
      '@media(max-width:900px){[data-learning-lab="auto-robust-small-gain"] .rb-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:620px){[data-learning-lab="auto-robust-small-gain"] .rb-choice-grid{grid-template-columns:minmax(0,1fr)}}@media(max-width:420px){[data-learning-lab="auto-robust-small-gain"] .rb-stage-frame{padding:4px}[data-learning-lab="auto-robust-small-gain"] table{font-size:10.8px}[data-learning-lab="auto-robust-small-gain"] th,[data-learning-lab="auto-robust-small-gain"] td{padding-left:4px;padding-right:4px}}@media(prefers-reduced-motion:reduce){[data-learning-lab="auto-robust-small-gain"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}'
    ].join("");

    function assert(condition, message) {
      if (!condition) throw new Error(message);
    }

    function finite(value, label) {
      var number = Number(value);
      if (!Number.isFinite(number)) throw new RangeError(label + " must be finite");
      return number;
    }

    function nearly(left, right, tolerance) {
      var scale = Math.max(1, Math.abs(left), Math.abs(right));
      return Math.abs(left - right) <= (tolerance || 1e-8) * scale;
    }

    function formatNumber(value, digits) {
      if (!Number.isFinite(value)) return "—";
      var places = digits === undefined ? 3 : digits;
      if (places === 0) return value.toFixed(0);
      if (Math.abs(value) > 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) return value.toExponential(Math.min(places, 4));
      return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
    }

    function complex(re, im) { return { re: re, im: im }; }
    function cAdd(left, right) { return complex(left.re + right.re, left.im + right.im); }
    function cMul(left, right) { return complex(left.re * right.re - left.im * right.im, left.re * right.im + left.im * right.re); }
    function cDiv(left, right) {
      var denominator = right.re * right.re + right.im * right.im;
      if (denominator <= EPS) throw new RangeError("complex denominator is zero");
      return complex((left.re * right.re + left.im * right.im) / denominator, (left.im * right.re - left.re * right.im) / denominator);
    }
    function cAbs(value) { return Math.hypot(value.re, value.im); }

    function normalizeConfig(input) {
      var source = input || {};
      var K = finite(source.K === undefined ? DEFAULTS.K : source.K, "K");
      var tau = finite(source.tau === undefined ? DEFAULTS.tau : source.tau, "tau");
      var lowWeight = finite(source.lowWeight === undefined ? DEFAULTS.lowWeight : source.lowWeight, "lowWeight");
      var weightBreak = finite(source.weightBreak === undefined ? DEFAULTS.weightBreak : source.weightBreak, "weightBreak");
      var wMin = finite(source.wMin === undefined ? DEFAULTS.wMin : source.wMin, "wMin");
      var wMax = finite(source.wMax === undefined ? DEFAULTS.wMax : source.wMax, "wMax");
      var points = Math.round(finite(source.points === undefined ? DEFAULTS.points : source.points, "points"));
      if (K < 0.1 || K > 12) throw new RangeError("K must be in [0.1, 12]");
      if (tau < 0.05 || tau > 1.2) throw new RangeError("tau must be in [0.05, 1.2]");
      if (lowWeight < 0 || lowWeight > 1) throw new RangeError("lowWeight must be in [0, 1]");
      if (weightBreak < 0.2 || weightBreak > 20) throw new RangeError("weightBreak must be in [0.2, 20]");
      if (wMin < 0.001 || wMin > 0.5) throw new RangeError("wMin must be in [0.001, 0.5]");
      if (wMax < 10 || wMax > 300 || wMax <= wMin) throw new RangeError("wMax must be in [10, 300] and exceed wMin");
      if (points < 80 || points > 240) throw new RangeError("points must be in [80, 240]");
      return { K: K, tau: tau, lowWeight: lowWeight, weightBreak: weightBreak, wMin: wMin, wMax: wMax, points: points };
    }

    function loopAt(omega, config) {
      var s = complex(0, omega);
      var denominator = cMul(s, complex(1, config.tau * omega));
      var L = cDiv(complex(config.K, 0), denominator);
      var closedDenominator = cAdd(complex(1, 0), L);
      var S = cDiv(complex(1, 0), closedDenominator);
      var T = cDiv(L, closedDenominator);
      var Wm = cDiv(complex(config.lowWeight, omega / config.weightBreak), complex(1, omega / config.weightBreak));
      return { L: L, S: S, T: T, Wm: Wm, WT: cMul(Wm, T), sumError: cAbs(cAdd(cAdd(S, T), complex(-1, 0))) };
    }

    function runExperiment(input) {
      var config = normalizeConfig(input);
      var rows = [];
      var maxWT = -Infinity;
      var maxWTIndex = 0;
      var maxS = 0;
      var maxT = 0;
      var maxSumError = 0;
      for (var index = 0; index < config.points; index += 1) {
        var fraction = config.points === 1 ? 0 : index / (config.points - 1);
        var omega = config.wMin * Math.pow(config.wMax / config.wMin, fraction);
        var values = loopAt(omega, config);
        var wtMagnitude = cAbs(values.WT);
        var sMagnitude = cAbs(values.S);
        var tMagnitude = cAbs(values.T);
        rows.push({
          index: index,
          omega: omega,
          S: values.S,
          T: values.T,
          Wm: values.Wm,
          WT: values.WT,
          sMagnitude: sMagnitude,
          tMagnitude: tMagnitude,
          wtMagnitude: wtMagnitude,
          sumError: values.sumError
        });
        if (wtMagnitude > maxWT) { maxWT = wtMagnitude; maxWTIndex = index; }
        maxS = Math.max(maxS, sMagnitude);
        maxT = Math.max(maxT, tMagnitude);
        maxSumError = Math.max(maxSumError, values.sumError);
      }
      var nominalStable = config.K > 0 && config.tau > 0;
      var sampledSmallGainPass = nominalStable && maxWT < 1;
      return {
        config: config,
        rows: rows,
        nominalStable: nominalStable,
        sampledMaxWT: maxWT,
        sampledPeakFrequency: rows[maxWTIndex].omega,
        sampledMaxS: maxS,
        sampledMaxT: maxT,
        sampledMaxSumError: maxSumError,
        sampledSmallGainPass: sampledSmallGainPass,
        sampledStrictMargin: 1 - maxWT,
        gridPoints: config.points,
        frequencyWindow: [config.wMin, config.wMax],
        criterion: "theoretical: nominal/internal stability plus continuous ||Wm*T||inf < 1; lab: finite log-grid estimate",
        uncertaintyScope: "complete unstructured complex multiplicative ball (theory); finite grid (lab)"
      };
    }

    function element(doc, tag, attrs, children) {
      var node = doc.createElement(tag);
      var properties = attrs || {};
      Object.keys(properties).forEach(function (key) {
        var value = properties[key];
        if (key === "text") node.textContent = value;
        else if (key === "className") node.className = value;
        else if (value !== undefined && value !== null) node.setAttribute(key, String(value));
      });
      (children || []).forEach(function (child) { node.appendChild(typeof child === "string" ? doc.createTextNode(child) : child); });
      return node;
    }

    function svgElement(doc, tag, attrs, text) {
      var node = doc.createElementNS(SVG_NS, tag);
      Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, String(attrs[key])); });
      if (text !== undefined) node.textContent = text;
      return node;
    }

    function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

    function installStyles(doc) {
      if (!doc || !doc.createElement || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent = STYLE_TEXT;
      (doc.head || doc.documentElement).appendChild(style);
    }

    function announce(api, rootNode, message) { if (api && typeof api.announce === "function") api.announce(rootNode, message); }

    function pathFor(rows, xKey, yKey, mapX, mapY) {
      return rows.map(function (row, index) { return (index ? "L" : "M") + mapX(row[xKey]).toFixed(2) + " " + mapY(row[yKey]).toFixed(2); }).join(" ");
    }

    function drawSvg(doc, svg, result) {
      clear(svg);
      var width = 720;
      var height = 430;
      var left = 52;
      var right = 18;
      var top = 24;
      var middle = 222;
      var bottom = 38;
      var yMax = Math.max(1.2, result.sampledMaxWT * 1.12, result.sampledMaxS * 1.05, result.sampledMaxT * 1.05);
      var errorMax = Math.max(1e-10, result.sampledMaxSumError * 1.2);
      var mapX = function (value) { return left + Math.log(value / result.config.wMin) / Math.log(result.config.wMax / result.config.wMin) * (width - left - right); };
      var mapMagnitude = function (value) { return top + (middle - top - 22) * (yMax - value) / yMax; };
      var mapError = function (value) { return middle + 26 + (height - bottom - (middle + 26)) * (errorMax - value) / errorMax; };
      svg.appendChild(svgElement(doc, "title", {}, "鲁棒控制频率扫频与 S+T 复数误差"));
      svg.appendChild(svgElement(doc, "desc", {}, "上图显示 S、T 与 WmT 的幅值，下图显示复数恒等式 S+T=1 的误差。"));
      for (var i = 0; i <= 4; i += 1) {
        var x = left + i / 4 * (width - left - right);
        svg.appendChild(svgElement(doc, "line", { x1: x, y1: top, x2: x, y2: middle - 22, class: "rb-grid" }));
        svg.appendChild(svgElement(doc, "line", { x1: x, y1: middle + 26, x2: x, y2: height - bottom, class: "rb-grid" }));
        var frequency = result.config.wMin * Math.pow(result.config.wMax / result.config.wMin, i / 4);
        svg.appendChild(svgElement(doc, "text", { x: x, y: height - 9, "text-anchor": "middle", class: "rb-small" }, formatNumber(frequency, 2)));
      }
      for (var j = 0; j <= 3; j += 1) {
        var y = top + j / 3 * (middle - top - 22);
        svg.appendChild(svgElement(doc, "line", { x1: left, y1: y, x2: width - right, y2: y, class: "rb-grid" }));
        svg.appendChild(svgElement(doc, "text", { x: left - 7, y: y + 4, "text-anchor": "end", class: "rb-small" }, formatNumber(yMax * (3 - j) / 3, 2)));
      }
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: mapMagnitude(1), x2: width - right, y2: mapMagnitude(1), class: "rb-threshold" }));
      svg.appendChild(svgElement(doc, "path", { d: pathFor(result.rows, "omega", "sMagnitude", mapX, mapMagnitude), class: "rb-s" }));
      svg.appendChild(svgElement(doc, "path", { d: pathFor(result.rows, "omega", "tMagnitude", mapX, mapMagnitude), class: "rb-t" }));
      svg.appendChild(svgElement(doc, "path", { d: pathFor(result.rows, "omega", "wtMagnitude", mapX, mapMagnitude), class: "rb-wt" }));
      for (var k = 0; k <= 3; k += 1) {
        var errorY = middle + 26 + k / 3 * (height - bottom - (middle + 26));
        svg.appendChild(svgElement(doc, "line", { x1: left, y1: errorY, x2: width - right, y2: errorY, class: "rb-grid" }));
        svg.appendChild(svgElement(doc, "text", { x: left - 7, y: errorY + 4, "text-anchor": "end", class: "rb-small" }, formatNumber(errorMax * (3 - k) / 3, 3)));
      }
      svg.appendChild(svgElement(doc, "path", { d: pathFor(result.rows, "omega", "sumError", mapX, mapError), class: "rb-error" }));
      svg.appendChild(svgElement(doc, "text", { x: left + 5, y: top + 13, class: "rb-label" }, "幅值：|S| 蓝，|T| 橙，|WmT| 红；红虚线=1"));
      svg.appendChild(svgElement(doc, "text", { x: left + 5, y: middle + 18, class: "rb-label" }, "复数误差 |S+T-1|"));
      svg.appendChild(svgElement(doc, "text", { x: width - right, y: height - 9, "text-anchor": "end", class: "rb-small" }, "omega (rad/s, log)"));
    }

    function metric(doc, label, value) { return element(doc, "div", { className: "rb-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]); }

    function renderLedger(doc, hostNode, result) {
      var body = element(doc, "tbody");
      var stride = Math.max(1, Math.floor((result.rows.length - 1) / 12));
      result.rows.forEach(function (row, index) {
        if (index % stride !== 0 && index !== result.rows.length - 1) return;
        body.appendChild(element(doc, "tr", {}, [
          element(doc, "th", { text: String(row.index) }),
          element(doc, "td", { text: formatNumber(row.omega, 3) }),
          element(doc, "td", { text: formatNumber(row.S.re, 4) + " " + (row.S.im < 0 ? "-" : "+") + " j" + formatNumber(Math.abs(row.S.im), 4) }),
          element(doc, "td", { text: formatNumber(row.T.re, 4) + " " + (row.T.im < 0 ? "-" : "+") + " j" + formatNumber(Math.abs(row.T.im), 4) }),
          element(doc, "td", { text: formatNumber(row.sumError, 3) }),
          element(doc, "td", { text: formatNumber(row.wtMagnitude, 4) })
        ]));
      });
      clear(hostNode);
      hostNode.appendChild(element(doc, "table", {}, [
        element(doc, "caption", { text: "频率扫频复数账本；S 与 T 保留实部/虚部，误差不是只看幅值" }),
        element(doc, "thead", {}, [element(doc, "tr", {}, [
          element(doc, "th", { text: "i" }), element(doc, "th", { text: "omega" }), element(doc, "th", { text: "S(jw)" }), element(doc, "th", { text: "T(jw)" }), element(doc, "th", { text: "|S+T-1|" }), element(doc, "th", { text: "|WmT|" })
        ])]), body
      ]));
    }

    function questionSpecs() {
      return [
        {
          key: "identity",
          prompt: "在标称闭环里，S 与 T 的关系是什么？",
          expected: "sum",
          choices: [
            { value: "sum", label: "S+T=1" },
            { value: "product", label: "S*T=1" },
            { value: "zero", label: "S-T=0" }
          ]
        },
        {
          key: "ball",
          prompt: "完整无结构复数乘法不确定性球下，严格 ||WmT||inf<1 代表什么？",
          expected: "exact",
          choices: [
            { value: "exact", label: "在稳定前提下必要充分" },
            { value: "sufficient", label: "永远只是充分" },
            { value: "nominal", label: "只检验标称极点" }
          ]
        },
        {
          key: "physical",
          prompt: "换成结构化/实参数/有限阶物理不确定性包络后，范数条件通常怎样？",
          expected: "conservative",
          choices: [
            { value: "conservative", label: "通常是保守充分证书" },
            { value: "exact", label: "仍无条件必要充分" },
            { value: "irrelevant", label: "与不确定性结构无关" }
          ]
        }
      ];
    }

    function renderPredictions(state, refs) {
      questionSpecs().forEach(function (spec, index) {
        refs.questions[index].buttons.forEach(function (button) {
          var selected = state.predictions[spec.key] === button.value;
          button.node.setAttribute("aria-pressed", selected ? "true" : "false");
          if (!state.revealed) {
            button.node.textContent = button.label;
            button.node.className = "";
          } else {
            var correct = button.value === spec.expected;
            button.node.textContent = (correct ? "✓ " : "") + button.label;
            button.node.className = correct ? "rb-correct" : selected ? "rb-wrong" : "";
          }
        });
      });
    }

    function mount(rootNode, api) {
      if (!rootNode || !rootNode.ownerDocument) return;
      var doc = rootNode.ownerDocument;
      installStyles(doc);
      var state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
      var refs = { questions: [] };
      var shell = element(doc, "div", { className: "rb-lab" });
      shell.appendChild(element(doc, "h3", { text: "鲁棒实验：S、T 与乘法不确定性的频率证书" }));
      shell.appendChild(element(doc, "p", { className: "rb-note", text: "标称 L(s)=K/[s(tau*s+1)]，S=1/(1+L)，T=L/(1+L)。权重 Wm(jw) 从低频小幅值过渡到高频约 1；实验按离散频率扫频估计无穷范数。" }));
      var predictionHost = element(doc, "div");
      questionSpecs().forEach(function (spec, index) {
        var fieldset = element(doc, "fieldset");
        fieldset.appendChild(element(doc, "legend", { text: spec.prompt }));
        var grid = element(doc, "div", { className: "rb-choice-grid" });
        var question = { buttons: [] };
        spec.choices.forEach(function (choice) {
          var button = element(doc, "button", { type: "button", text: choice.label, "aria-pressed": "false" });
          button.addEventListener("click", function () { state.predictions[spec.key] = choice.value; state.feedback = ""; render(); });
          question.buttons.push({ value: choice.value, label: choice.label, node: button });
          grid.appendChild(button);
        });
        fieldset.appendChild(grid);
        predictionHost.appendChild(fieldset);
        refs.questions[index] = question;
      });
      var actions = element(doc, "div", { className: "rb-actions" });
      var reveal = element(doc, "button", { type: "button", className: "rb-primary", text: "提交预测并揭晓" });
      var reset = element(doc, "button", { type: "button", text: "重置" });
      actions.appendChild(reveal);
      actions.appendChild(reset);
      var feedback = element(doc, "p", { className: "rb-feedback", "aria-live": "polite" });
      var resultShell = element(doc, "div", { hidden: true });
      var controlRefs = {};

      function makeRange(key, label, min, max, step, digits) {
        var input = element(doc, "input", { type: "range", min: String(min), max: String(max), step: String(step), value: String(state.config[key]), "aria-label": label });
        var output = element(doc, "output", { text: formatNumber(state.config[key], digits) });
        controlRefs[key] = { input: input, output: output, digits: digits };
        return element(doc, "div", { className: "rb-control" }, [element(doc, "label", {}, [label + " = ", output]), input]);
      }

      var controls = element(doc, "div", { className: "rb-controls" }, [
        makeRange("K", "环路增益 K", 0.1, 12, 0.1, 1),
        makeRange("tau", "时间常数 tau (s)", 0.05, 1.2, 0.05, 2),
        makeRange("lowWeight", "低频权重", 0, 1, 0.02, 2),
        makeRange("weightBreak", "权重转折频率 (rad/s)", 0.2, 20, 0.2, 1),
        makeRange("points", "扫频点数", 80, 240, 10, 0),
        element(doc, "p", { className: "rb-note", text: "默认证书针对完整无结构复数 Delta、||Delta||inf<=1，并要求标称/内部稳定。若实际不确定性有实参数、块结构或有限阶约束，结论通常转为保守充分证书。" })
      ]);
      var svg = svgElement(doc, "svg", { viewBox: "0 0 720 430", role: "img", "aria-label": "鲁棒控制频率扫频图" });
      var svgFrame = element(doc, "div", { className: "rb-stage-frame" }, [svg]);
      var metricsHost = element(doc, "div", { className: "rb-metrics" });
      var tableHost = element(doc, "div", { className: "rb-table-wrap" });
      var certificate = element(doc, "div", { className: "rb-certificate" });
      resultShell.appendChild(element(doc, "div", { className: "rb-layout" }, [controls, element(doc, "div", { className: "rb-stage" }, [svgFrame, metricsHost, tableHost, certificate])]));
      shell.appendChild(predictionHost);
      shell.appendChild(actions);
      shell.appendChild(feedback);
      shell.appendChild(resultShell);
      clear(rootNode);
      rootNode.appendChild(shell);

      reveal.addEventListener("click", function () {
        var specs = questionSpecs();
        if (!specs.every(function (spec) { return state.predictions[spec.key] !== undefined; })) {
          state.feedback = "请先完成三项预测；频率曲线、峰值和复数账本会在提交后出现。";
          render();
          return;
        }
        var correct = specs.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length;
        state.revealed = true;
        state.feedback = "已揭晓：" + correct + "/" + specs.length + " 命中。调参不会重新上锁。";
        render();
        announce(api, rootNode, state.feedback);
      });
      reset.addEventListener("click", function () {
        state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
        render();
        announce(api, rootNode, "鲁棒性预测、图和账本已重置。");
      });
      Object.keys(controlRefs).forEach(function (key) {
        controlRefs[key].input.addEventListener("input", function () {
          var next = Object.assign({}, state.config);
          next[key] = Number(controlRefs[key].input.value);
          state.config = normalizeConfig(next);
          state.feedback = "";
          render();
        });
      });

      function render() {
        var result = runExperiment(state.config);
        Object.keys(controlRefs).forEach(function (key) {
          controlRefs[key].input.value = String(result.config[key]);
          controlRefs[key].output.textContent = formatNumber(result.config[key], controlRefs[key].digits);
        });
        feedback.textContent = state.feedback;
        feedback.className = "rb-feedback" + (state.feedback.indexOf("请先") === 0 ? " rb-wrong" : "");
        renderPredictions(state, refs);
        resultShell.hidden = !state.revealed;
        if (!state.revealed) return;
        drawSvg(doc, svg, result);
        clear(metricsHost);
        metricsHost.appendChild(metric(doc, "sampled max |WmT|", formatNumber(result.sampledMaxWT, 4)));
        metricsHost.appendChild(metric(doc, "sampled peak (rad/s)", formatNumber(result.sampledPeakFrequency, 3)));
        metricsHost.appendChild(metric(doc, "sampled 1-max", formatNumber(result.sampledStrictMargin, 4)));
        metricsHost.appendChild(metric(doc, "sampled max |S|", formatNumber(result.sampledMaxS, 4)));
        metricsHost.appendChild(metric(doc, "sampled max |T|", formatNumber(result.sampledMaxT, 4)));
        metricsHost.appendChild(metric(doc, "sampled max |S+T-1|", formatNumber(result.sampledMaxSumError, 3)));
        renderLedger(doc, tableHost, result);
        clear(certificate);
        certificate.appendChild(element(doc, "p", { text: result.nominalStable ? "标称/内部稳定前提：满足（tau>0、K>0，闭环特征多项式 tau*s^2+s+K）。" : "标称/内部稳定前提：不满足，不能使用小增益结论。" }));
        certificate.appendChild(element(doc, "p", { text: "有限网格账：在 [" + formatNumber(result.config.wMin, 3) + ", " + formatNumber(result.config.wMax, 3) + "] rad/s 的 " + result.gridPoints + " 个对数点上，sampled max |WmT|=" + formatNumber(result.sampledMaxWT, 4) + "，sampled 余量=" + formatNumber(result.sampledStrictMargin, 4) + "；" + (result.sampledSmallGainPass ? "采样值低于 1，但只构成网格证据。" : "采样值未低于 1，网格证据不通过。") + "这不是连续 (0,infinity) 上的 ||WmT||inf 精确值，可能漏掉窄峰。" }));
        certificate.appendChild(element(doc, "p", { text: "理论层账：若另行验证连续 H-infinity 范数 ||WmT||inf<1，则完整无结构复数乘法球（||Delta||inf<=1）在标称/内部稳定及常见技术条件下可使用必要充分的标准判据；本实验的 sampled pass 不能单独替代该连续验证。" }));
        certificate.appendChild(element(doc, "p", { text: "物理包络账：若真实 Delta 是实参数、结构化块或有限阶动态，完整复数球的判据通常只是保守充分证书；本扫频不是对该结构化问题的精确 mu/实稳定性计算。" }));
      }

      render();
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) { checks += 1; assert(condition, message); }
      var baseline = runExperiment(DEFAULTS);
      var repeat = runExperiment(DEFAULTS);
      check(baseline.rows.length === DEFAULTS.points, "default sweep count");
      check(JSON.stringify(baseline.rows) === JSON.stringify(repeat.rows), "deterministic frequency sweep");
      check(baseline.nominalStable, "default nominal stability");
      check(baseline.sampledMaxSumError < 1e-12, "sampled complex S plus T identity");
      check(baseline.sampledSmallGainPass, "default sampled small-gain estimate");
      var direct = loopAt(2, DEFAULTS);
      check(nearly(cAbs(cAdd(direct.S, direct.T)), 1, 1e-12), "complex identity magnitude check");
      var boundary = runExperiment({ K: 2, tau: 0.4, lowWeight: 1, weightBreak: 20, wMin: 0.001, wMax: 10, points: 80 });
      check(boundary.sampledMaxWT > 0.9, "high uncertainty weight reaches sampled boundary");
      var coarse = runExperiment({ K: DEFAULTS.K, tau: DEFAULTS.tau, lowWeight: DEFAULTS.lowWeight, weightBreak: DEFAULTS.weightBreak, wMin: DEFAULTS.wMin, wMax: DEFAULTS.wMax, points: 80 });
      var fine = runExperiment({ K: DEFAULTS.K, tau: DEFAULTS.tau, lowWeight: DEFAULTS.lowWeight, weightBreak: DEFAULTS.weightBreak, wMin: DEFAULTS.wMin, wMax: DEFAULTS.wMax, points: 240 });
      check(Math.abs(fine.sampledMaxWT - coarse.sampledMaxWT) < 0.02, "coarse and fine grid estimates agree locally");
      check(fine.gridPoints === 240 && fine.frequencyWindow[0] === DEFAULTS.wMin && fine.frequencyWindow[1] === DEFAULTS.wMax, "finite frequency window is reported");
      var invalid = false;
      try { normalizeConfig({ K: 0 }); } catch (error) { invalid = error instanceof RangeError; }
      check(invalid, "invalid gain rejected");
      invalid = false;
      try { normalizeConfig({ wMax: 0.5 }); } catch (error2) { invalid = error2 instanceof RangeError; }
      check(invalid, "invalid frequency range rejected");
      return { checks: checks };
    }

    return {
      LAB_ID: LAB_ID,
      DEFAULTS: DEFAULTS,
      normalizeConfig: normalizeConfig,
      complex: complex,
      loopAt: loopAt,
      runExperiment: runExperiment,
      formatNumber: formatNumber,
      mount: mount,
      selfTest: selfTest
    };
  }
);
