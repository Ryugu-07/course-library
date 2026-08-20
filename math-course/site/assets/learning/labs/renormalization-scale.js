(function (host, factory) {
  "use strict";

  var exported = factory(host);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (host && host.CourseLearning && typeof host.CourseLearning.register === "function") {
    host.CourseLearning.register("renormalization-scale", exported.mount);
  }
  if (
    typeof module === "object" && module.exports &&
    typeof require === "function" && require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log(
        "renormalization-scale self-test: PASS (" + report.checks + " checks, " +
        report.ledgerRows + " cutoff rows, " + report.runningPoints + " running points)"
      );
    } catch (error) {
      console.error("renormalization-scale self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
}(
  typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : null,
  function (host) {
    "use strict";

    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "cl-renormalization-scale-style";
    var INSTANCE = 0;
    var CUTOFFS = [1, 2, 4, 8, 16];

    var LEDGER_QUESTIONS = [
      {
        key: "fixedBare",
        label: "固定 g_bare 而增大 Lambda 时，toy O 会怎样？",
        options: [
          { value: "changes", label: "随 log(Lambda / mu) 改变" },
          { value: "fixed", label: "自动保持不变" },
          { value: "undefined", label: "没有任何数值" }
        ],
        expected: "changes"
      },
      {
        key: "counterterm",
        label: "施加 O_R(mu)=g_R(mu) 后，counterterm 的作用是？",
        options: [
          { value: "cancels", label: "逐项抵消 cutoff log" },
          { value: "amplifies", label: "放大 cutoff log" },
          { value: "removesScheme", label: "消灭所有 scheme 信息" }
        ],
        expected: "cancels"
      },
      {
        key: "roles",
        label: "Lambda、mu、O 的角色应怎样区分？",
        options: [
          { value: "roles", label: "regulator / scale / observable" },
          { value: "allPhysical", label: "都是可观测量" },
          { value: "allCutoff", label: "都是 cutoff 参数" }
        ],
        expected: "roles"
      }
    ];

    var RUNNING_QUESTIONS = [
      {
        key: "solution",
        label: "一圈 toy 解的分母是哪一项？",
        options: [
          { value: "denominator", label: "1 - b g0 log(mu / mu0)" },
          { value: "numerator", label: "1 + b g0 log(mu / mu0)" },
          { value: "constant", label: "1" }
        ],
        expected: "denominator"
      },
      {
        key: "uvSign",
        label: "b > 0 且 g0 > 0 时，UV 方向的 toy 趋势是？",
        options: [
          { value: "grows", label: "g 增大并靠近 UV-side pole" },
          { value: "shrinks", label: "g 减小到零" },
          { value: "constant", label: "g 完全不变" }
        ],
        expected: "grows"
      },
      {
        key: "pole",
        label: "极点边界由什么给出？",
        options: [
          { value: "denominatorZero", label: "分母为零，ell=1/(b g0)" },
          { value: "betaZero", label: "beta(g)=0" },
          { value: "lambdaZero", label: "Lambda=0" }
        ],
        expected: "denominatorZero"
      }
    ];

    var STYLE_TEXT = [
      ".renorm-lab{--ren-blue:var(--cl-blue,#315f9d);--ren-green:var(--cl-green,#39734d);--ren-red:var(--cl-red,#b64335);--ren-gold:var(--cl-gold,#9b6a12);--ren-muted:var(--fg-soft,#666);--ren-block:var(--block-bg,var(--bg,#fff));color:var(--fg);line-height:1.5;min-width:0;overflow:hidden}",
      ".renorm-lab *,.renorm-lab *::before,.renorm-lab *::after{box-sizing:border-box}.renorm-lab h3,.renorm-lab h4,.renorm-lab p{margin-top:0}.renorm-lab .ren-intro,.renorm-lab .ren-feedback{color:var(--ren-muted);overflow-wrap:anywhere}",
      ".renorm-lab .ren-tabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:14px 0 10px}.renorm-lab button,.renorm-lab select,.renorm-lab input{font:inherit;letter-spacing:0}.renorm-lab button,.renorm-lab select{min-width:0;min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:inherit;cursor:pointer;overflow-wrap:anywhere}.renorm-lab button:hover{border-color:var(--accent)}.renorm-lab button[aria-pressed=\"true\"],.renorm-lab .ren-primary{background:var(--accent);border-color:var(--accent);color:var(--bg);font-weight:700}.renorm-lab button:focus-visible,.renorm-lab select:focus-visible,.renorm-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}",
      ".renorm-lab .ren-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px 14px;margin:12px 0;padding:12px 14px;border-top:2px solid var(--accent);border-bottom:1px solid var(--border);background:var(--ren-block)}.renorm-lab .ren-control{display:grid;gap:5px;min-width:0}.renorm-lab .ren-control label{color:var(--ren-muted);font-size:13px;font-weight:700}.renorm-lab .ren-head{display:flex;justify-content:space-between;align-items:baseline;gap:8px}.renorm-lab output{color:var(--accent);font-variant-numeric:tabular-nums}.renorm-lab input[type=range]{width:100%;min-height:44px;margin:0;accent-color:var(--accent)}",
      ".renorm-lab .ren-gate{margin:15px 0;padding:13px 14px;border-left:3px solid var(--ren-gold);background:var(--ren-block)}.renorm-lab .ren-gate h4{margin:0 0 9px;color:var(--accent)}.renorm-lab .ren-questions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.renorm-lab .ren-question{display:grid;gap:5px;min-width:0}.renorm-lab .ren-question label{font-size:13px;font-weight:700;overflow-wrap:anywhere}.renorm-lab .ren-question select{width:100%}.renorm-lab .ren-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.renorm-lab .ren-actions>*{flex:1 1 150px}.renorm-lab .ren-feedback{min-height:1.5em;margin:9px 0 0}.renorm-lab .ren-pass{color:var(--ren-green);font-weight:700}.renorm-lab .ren-warn{color:var(--ren-red);font-weight:700}",
      ".renorm-lab .ren-results{margin-top:16px;padding-top:14px;border-top:1px solid var(--border)}.renorm-lab .ren-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:0 0 13px}.renorm-lab .ren-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--ren-block)}.renorm-lab .ren-metric:nth-child(3n+1){border-top-color:var(--ren-blue)}.renorm-lab .ren-metric:nth-child(3n+2){border-top-color:var(--ren-gold)}.renorm-lab .ren-metric:nth-child(3n){border-top-color:var(--ren-green)}.renorm-lab .ren-metric span{display:block;color:var(--ren-muted);font-size:11px;overflow-wrap:anywhere}.renorm-lab .ren-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
      ".renorm-lab .ren-chart{min-width:0;margin:12px 0;padding:7px;border:1px solid var(--border);border-radius:6px;background:var(--bg);overflow:hidden}.renorm-lab .ren-chart svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg)}.renorm-lab .ren-chart svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.renorm-lab .ren-ledger{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:12px}.renorm-lab table{width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.renorm-lab .ren-ledger table{min-width:900px}.renorm-lab th,.renorm-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;overflow-wrap:anywhere}.renorm-lab th{color:var(--ren-muted);font-size:11px;font-weight:750}",
      ".renorm-lab .ren-callout{margin:11px 0 0;padding:10px 12px;border-left:3px solid var(--ren-green);background:var(--ren-block);font-size:13px;line-height:1.65;overflow-wrap:anywhere}.renorm-lab .ren-boundary{border-left-color:var(--ren-red)}.renorm-lab [hidden]{display:none!important}",
      "@media(max-width:700px){.renorm-lab .ren-controls,.renorm-lab .ren-questions{grid-template-columns:minmax(0,1fr)}}@media(max-width:430px){.renorm-lab .ren-gate,.renorm-lab .ren-controls{padding-left:10px;padding-right:10px}.renorm-lab .ren-tabs{grid-template-columns:minmax(0,1fr)}}@media(prefers-reduced-motion:reduce){.renorm-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
    ].join("\n");

    function finite(value) {
      return typeof value === "number" && isFinite(value);
    }

    function near(left, right, tolerance) {
      var scale = Math.max(1, Math.abs(left), Math.abs(right));
      return Math.abs(left - right) <= (tolerance || 1e-10) * scale;
    }

    function positive(value, label) {
      var parsed = Number(value);
      if (!finite(parsed) || parsed <= 0) throw new RangeError(label + " must be positive");
      return parsed;
    }

    function integer(value, minimum, label) {
      var parsed = Number(value);
      if (!finite(parsed) || Math.floor(parsed) !== parsed || parsed < minimum) {
        throw new RangeError(label + " must be an integer >= " + minimum);
      }
      return parsed;
    }

    function formatNumber(api, value, digits) {
      if (value === null || value === undefined) return "-";
      if (value === Infinity) return "+inf";
      if (value === -Infinity) return "-inf";
      if (!finite(value)) return "-";
      if (api && typeof api.format === "function") return api.format(value, digits);
      return value.toFixed(digits === undefined ? 4 : digits).replace(/0+$/, "").replace(/\.$/, "");
    }

    function cutoffLedger(beta, renormalized, mu, lambdas) {
      var b = Number(beta);
      var gR = Number(renormalized);
      var scale = positive(mu, "mu");
      if (!finite(b) || !finite(gR)) throw new RangeError("beta and gR must be finite");
      if (!Array.isArray(lambdas) || lambdas.length < 1) throw new RangeError("lambdas must be a nonempty array");
      var rows = lambdas.map(function (value) {
        var cutoff = positive(value, "Lambda");
        var logRatio = Math.log(cutoff / scale);
        var loop = b * logRatio;
        var counterterm = -loop;
        var fixedBare = gR;
        var tunedBare = gR + counterterm;
        return {
          Lambda: cutoff,
          logRatio: logRatio,
          loop: loop,
          fixedBare: fixedBare,
          fixedObservable: fixedBare + loop,
          counterterm: counterterm,
          tunedBare: tunedBare,
          tunedObservable: tunedBare + loop,
          residual: tunedBare + loop - gR
        };
      });
      return {
        beta: b,
        gR: gR,
        mu: scale,
        scheme: "subtraction at mu; finite part = 0",
        physicalObservable: gR,
        rows: rows,
        boundary: "Lambda is a regulator; the analytic tuned residual is the cancellation check, not a new physical prediction."
      };
    }

    function runningData(beta, initial, ellMin, ellMax, points) {
      var b = Number(beta);
      var g0 = positive(initial, "g0");
      var low = Number(ellMin);
      var high = Number(ellMax);
      var count = integer(points === undefined ? 41 : points, 2, "running points");
      if (!finite(b) || !finite(low) || !finite(high) || !(high > low)) {
        throw new RangeError("running beta and ell interval must be finite with ellMin < ellMax");
      }
      var poleEll = b === 0 ? null : 1 / (b * g0);
      var rows = [];
      for (var i = 0; i < count; i += 1) {
        var ell = low + (high - low) * i / (count - 1);
        var denominator = b === 0 ? 1 : 1 - b * g0 * ell;
        var value = Math.abs(denominator) < 1e-7 ? (denominator < 0 ? -Infinity : Infinity) : g0 / denominator;
        rows.push({
          index: i,
          ell: ell,
          denominator: denominator,
          coupling: value,
          betaAtCoupling: finite(value) ? b * value * value : (value === Infinity ? Infinity : -Infinity),
          status: Math.abs(denominator) < 1e-7 ? "pole boundary" : "one-loop toy"
        });
      }
      return {
        beta: b,
        g0: g0,
        ellMin: low,
        ellMax: high,
        points: count,
        poleEll: poleEll,
        poleRatio: poleEll === null ? null : Math.exp(poleEll),
        poleInside: poleEll !== null && poleEll >= low && poleEll <= high,
        betaAtInitial: b * g0 * g0,
        uvTrend: b > 0 ? "g grows toward UV; pole is on the UV side" : b < 0 ? "g decreases toward UV; pole is on the IR side" : "g is constant when beta coefficient is zero",
        rows: rows,
        boundary: "The denominator-zero point is a boundary of this one-loop toy solution; perturbation theory is not certified there."
      };
    }

    function predictionAnswers(mode) {
      var questions = mode === "ledger" ? LEDGER_QUESTIONS : RUNNING_QUESTIONS;
      var answers = {};
      questions.forEach(function (question) { answers[question.key] = question.expected; });
      return answers;
    }

    function scoreAnswers(mode, prediction) {
      var questions = mode === "ledger" ? LEDGER_QUESTIONS : RUNNING_QUESTIONS;
      var expected = predictionAnswers(mode);
      var correct = 0;
      questions.forEach(function (question) { if (prediction[question.key] === expected[question.key]) correct += 1; });
      return { correct: correct, total: questions.length };
    }

    function makeElement(api, doc, tag, attrs, children) {
      if (api && typeof api.el === "function") return api.el(tag, attrs || {}, children);
      var node = doc.createElement(tag);
      Object.keys(attrs || {}).forEach(function (key) {
        var value = attrs[key];
        if (value === undefined || value === null || value === false) return;
        if (key === "className") node.setAttribute("class", value);
        else if (key === "text") node.textContent = value;
        else if (value === true) node.setAttribute(key, "");
        else node.setAttribute(key, String(value));
      });
      (Array.isArray(children) ? children : [children]).forEach(function (child) {
        if (child !== undefined && child !== null && child !== false) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
      });
      return node;
    }

    function makeSvg(api, doc, tag, attrs, children) {
      if (api && typeof api.svg === "function") return api.svg(tag, attrs || {}, children);
      var node = doc.createElementNS(SVG_NS, tag);
      Object.keys(attrs || {}).forEach(function (key) {
        var value = attrs[key];
        if (value !== undefined && value !== null && value !== false) node.setAttribute(key, String(value));
      });
      (Array.isArray(children) ? children : [children]).forEach(function (child) {
        if (child !== undefined && child !== null && child !== false) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
      });
      return node;
    }

    function clear(node) {
      while (node && node.firstChild) node.removeChild(node.firstChild);
    }

    function replaceChildren(node, children) {
      clear(node);
      (children || []).forEach(function (child) { if (child) node.appendChild(child); });
    }

    function installStyles(doc) {
      if (doc.getElementById(STYLE_ID)) return;
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent = STYLE_TEXT;
      (doc.head || doc.documentElement).appendChild(style);
    }

    function metric(api, label, value) {
      return makeElement(api, null, "div", { className: "ren-metric" }, [makeElement(api, null, "span", {}, [label]), makeElement(api, null, "strong", {}, [value])]);
    }

    function svgText(api, doc, x, y, text, attrs) {
      var values = { x: x, y: y, "font-size": 11, fill: "var(--fg-soft)", "aria-hidden": "true" };
      Object.keys(attrs || {}).forEach(function (key) { values[key] = attrs[key]; });
      return makeSvg(api, doc, "text", values, [text]);
    }

    function pathFrom(points, mapX, mapY) {
      var path = "";
      points.forEach(function (point, index) {
        path += (index === 0 ? "M" : "L") + mapX(point[0]).toFixed(2) + " " + mapY(point[1]).toFixed(2) + " ";
      });
      return path.trim();
    }

    function drawLedgerChart(api, doc, data) {
      var width = 700;
      var height = 280;
      var left = 48;
      var right = 674;
      var top = 26;
      var bottom = 230;
      var minLambda = data.rows[0].Lambda;
      var maxLambda = data.rows[data.rows.length - 1].Lambda;
      var minY = Infinity;
      var maxY = -Infinity;
      data.rows.forEach(function (row) {
        minY = Math.min(minY, row.fixedObservable, row.tunedObservable);
        maxY = Math.max(maxY, row.fixedObservable, row.tunedObservable);
      });
      var range = Math.max(0.1, maxY - minY);
      minY -= range * 0.18;
      maxY += range * 0.18;
      var mapX = function (value) { return left + (right - left) * (Math.log(value) - Math.log(minLambda)) / (Math.log(maxLambda) - Math.log(minLambda) || 1); };
      var mapY = function (value) { return bottom - (bottom - top) * (value - minY) / (maxY - minY); };
      var svg = makeSvg(api, doc, "svg", { viewBox: "0 0 " + width + " " + height, role: "img", "aria-label": "fixed bare cutoff dependence and counterterm cancellation" });
      svg.appendChild(makeSvg(api, doc, "title", {}, ["cutoff ledger"]));
      svg.appendChild(makeSvg(api, doc, "desc", {}, ["The red line changes when bare coupling is fixed. The green line stays on the renormalized physical target after the counterterm is tuned."]));
      [minLambda, Math.sqrt(minLambda * maxLambda), maxLambda].forEach(function (lambda) {
        var x = mapX(lambda);
        svg.appendChild(makeSvg(api, doc, "line", { x1: x, y1: top, x2: x, y2: bottom, stroke: "var(--border)", "stroke-width": 1 }));
        svg.appendChild(svgText(api, doc, x, bottom + 17, formatNumber(api, lambda, 2), { "text-anchor": "middle" }));
      });
      [minY, (minY + maxY) / 2, maxY].forEach(function (value) {
        var y = mapY(value);
        svg.appendChild(makeSvg(api, doc, "line", { x1: left, y1: y, x2: right, y2: y, stroke: "var(--border)", "stroke-width": 1 }));
        svg.appendChild(svgText(api, doc, left - 7, y + 4, formatNumber(api, value, 3), { "text-anchor": "end" }));
      });
      svg.appendChild(makeSvg(api, doc, "path", { d: pathFrom(data.rows.map(function (row) { return [row.Lambda, row.fixedObservable]; }), mapX, mapY), fill: "none", stroke: "var(--ren-red)", "stroke-width": 2.4 }));
      svg.appendChild(makeSvg(api, doc, "path", { d: pathFrom(data.rows.map(function (row) { return [row.Lambda, row.tunedObservable]; }), mapX, mapY), fill: "none", stroke: "var(--ren-green)", "stroke-width": 2.4 }));
      svg.appendChild(svgText(api, doc, left, 16, "O(Lambda) = g_bare + beta log(Lambda / mu)", { "font-size": 13, "font-weight": 700 }));
      svg.appendChild(svgText(api, doc, right, 16, "red = fixed bare; green = cancellation", { "text-anchor": "end", "font-size": 10 }));
      return svg;
    }

    function drawRunningChart(api, doc, data) {
      var width = 700;
      var height = 290;
      var left = 48;
      var right = 674;
      var top = 28;
      var bottom = 238;
      var cap = 5;
      data.rows.forEach(function (row) { if (finite(row.coupling)) cap = Math.max(cap, Math.min(1000, Math.abs(row.coupling))); });
      cap = Math.min(1000, cap * 1.08);
      var mapX = function (ell) { return left + (right - left) * (ell - data.ellMin) / (data.ellMax - data.ellMin); };
      var mapY = function (value) {
        var clipped = Math.max(-cap, Math.min(cap, value));
        return bottom - (bottom - top) * (clipped + cap) / (2 * cap);
      };
      var svg = makeSvg(api, doc, "svg", { viewBox: "0 0 " + width + " " + height, role: "img", "aria-label": "one-loop running coupling and pole boundary" });
      svg.appendChild(makeSvg(api, doc, "title", {}, ["one-loop running coupling"]));
      svg.appendChild(makeSvg(api, doc, "desc", {}, ["The curve follows g0 divided by the one-loop denominator. A dashed vertical line marks the denominator-zero boundary when it lies in the window."]));
      [data.ellMin, 0, data.ellMax].forEach(function (ell) {
        if (ell < data.ellMin || ell > data.ellMax) return;
        var x = mapX(ell);
        svg.appendChild(makeSvg(api, doc, "line", { x1: x, y1: top, x2: x, y2: bottom, stroke: "var(--border)", "stroke-width": 1 }));
        svg.appendChild(svgText(api, doc, x, bottom + 17, formatNumber(api, ell, 2), { "text-anchor": "middle" }));
      });
      var zeroY = mapY(0);
      svg.appendChild(makeSvg(api, doc, "line", { x1: left, y1: zeroY, x2: right, y2: zeroY, stroke: "currentColor", "stroke-width": 1.1 }));
      var finiteRows = data.rows.filter(function (row) { return finite(row.coupling); });
      if (finiteRows.length > 1) {
        svg.appendChild(makeSvg(api, doc, "path", { d: pathFrom(finiteRows.map(function (row) { return [row.ell, row.coupling]; }), mapX, mapY), fill: "none", stroke: data.beta >= 0 ? "var(--ren-red)" : "var(--ren-blue)", "stroke-width": 2.4 }));
      }
      if (data.poleInside) {
        var poleX = mapX(data.poleEll);
        svg.appendChild(makeSvg(api, doc, "line", { x1: poleX, y1: top, x2: poleX, y2: bottom, stroke: "var(--ren-gold)", "stroke-width": 1.8, "stroke-dasharray": "5 4" }));
        svg.appendChild(svgText(api, doc, poleX + 5, top + 14, "pole boundary", { "font-size": 10 }));
      }
      svg.appendChild(svgText(api, doc, left, 17, "g(ell) = g0 / (1 - b g0 ell)", { "font-size": 13, "font-weight": 700 }));
      svg.appendChild(svgText(api, doc, right, 17, data.uvTrend, { "text-anchor": "end", "font-size": 10 }));
      return svg;
    }

    function rangeControl(api, doc, uid, label, min, max, step, value, onInput) {
      var id = uid + "-" + label.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      var output = makeElement(api, doc, "output", { for: id }, [String(value)]);
      var input = makeElement(api, doc, "input", { id: id, type: "range", min: min, max: max, step: step, value: value, "aria-label": label });
      input.addEventListener("input", function () { onInput(Number(input.value)); });
      return {
        wrap: makeElement(api, doc, "div", { className: "ren-control" }, [makeElement(api, doc, "div", { className: "ren-head" }, [makeElement(api, doc, "span", {}, [label]), output]), input]),
        input: input,
        output: output
      };
    }

    function selectControl(api, doc, uid, label, options, value, onChange) {
      var id = uid + "-" + label.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      var select = makeElement(api, doc, "select", { id: id, "aria-label": label });
      options.forEach(function (option) { select.appendChild(makeElement(api, doc, "option", { value: option.value }, [option.label])); });
      select.value = value;
      select.addEventListener("change", function () { onChange(select.value); });
      return { wrap: makeElement(api, doc, "div", { className: "ren-control" }, [makeElement(api, doc, "label", { htmlFor: id }, [label]), select]), input: select };
    }

    function renderLedgerResults(api, doc, section, data) {
      replaceChildren(section, []);
      var metrics = makeElement(api, doc, "div", { className: "ren-metrics" });
      metrics.appendChild(metric(api, "beta", formatNumber(api, data.beta, 4)));
      metrics.appendChild(metric(api, "gR(mu)", formatNumber(api, data.gR, 6)));
      metrics.appendChild(metric(api, "mu", formatNumber(api, data.mu, 4)));
      metrics.appendChild(metric(api, "scheme", data.scheme));
      section.appendChild(metrics);
      section.appendChild(makeElement(api, doc, "div", { className: "ren-chart" }, [drawLedgerChart(api, doc, data)]));
      var ledger = makeElement(api, doc, "div", { className: "ren-ledger" });
      var table = makeElement(api, doc, "table", {});
      table.appendChild(makeElement(api, doc, "thead", {}, [makeElement(api, doc, "tr", {}, [
        makeElement(api, doc, "th", {}, ["Lambda"]), makeElement(api, doc, "th", {}, ["loop log"]), makeElement(api, doc, "th", {}, ["fixed bare / O"]), makeElement(api, doc, "th", {}, ["counterterm"]), makeElement(api, doc, "th", {}, ["tuned bare / O"]), makeElement(api, doc, "th", {}, ["residual"])
      ])]));
      var body = makeElement(api, doc, "tbody");
      data.rows.forEach(function (row) {
        body.appendChild(makeElement(api, doc, "tr", {}, [
          makeElement(api, doc, "td", {}, [formatNumber(api, row.Lambda, 4)]),
          makeElement(api, doc, "td", {}, [formatNumber(api, row.loop, 8)]),
          makeElement(api, doc, "td", {}, [formatNumber(api, row.fixedBare, 6) + " / " + formatNumber(api, row.fixedObservable, 8)]),
          makeElement(api, doc, "td", {}, [formatNumber(api, row.counterterm, 8)]),
          makeElement(api, doc, "td", {}, [formatNumber(api, row.tunedBare, 6) + " / " + formatNumber(api, row.tunedObservable, 8)]),
          makeElement(api, doc, "td", {}, [formatNumber(api, row.residual, 8)])
        ]));
      });
      table.appendChild(body);
      ledger.appendChild(table);
      section.appendChild(ledger);
      section.appendChild(makeElement(api, doc, "p", { className: "ren-callout" }, ["Physical observable target: ", formatNumber(api, data.physicalObservable, 8), ". ", data.boundary]));
      section.appendChild(makeElement(api, doc, "p", { className: "ren-callout" }, ["Migration hint: when the regulator or scheme changes, rewrite the parameter definition and re-check the observable; do not compare bare parameters across schemes as if they were measurements."]));
    }

    function renderRunningResults(api, doc, section, data) {
      replaceChildren(section, []);
      var poleText = data.poleEll === null ? "none (b=0)" : formatNumber(api, data.poleEll, 6) + " in ell";
      var metrics = makeElement(api, doc, "div", { className: "ren-metrics" });
      metrics.appendChild(metric(api, "b, g0", formatNumber(api, data.beta, 4) + ", " + formatNumber(api, data.g0, 5)));
      metrics.appendChild(metric(api, "beta(g0)", formatNumber(api, data.betaAtInitial, 7)));
      metrics.appendChild(metric(api, "pole ell", poleText));
      metrics.appendChild(metric(api, "pole ratio", data.poleRatio === null ? "none" : formatNumber(api, data.poleRatio, 6)));
      section.appendChild(metrics);
      section.appendChild(makeElement(api, doc, "div", { className: "ren-chart" }, [drawRunningChart(api, doc, data)]));
      var ledger = makeElement(api, doc, "div", { className: "ren-ledger" });
      var table = makeElement(api, doc, "table", {});
      table.appendChild(makeElement(api, doc, "thead", {}, [makeElement(api, doc, "tr", {}, [makeElement(api, doc, "th", {}, ["ell"]), makeElement(api, doc, "th", {}, ["denominator"]), makeElement(api, doc, "th", {}, ["g(ell)"]), makeElement(api, doc, "th", {}, ["beta(g)"]), makeElement(api, doc, "th", {}, ["status"])] )]));
      var body = makeElement(api, doc, "tbody");
      data.rows.forEach(function (row, index) {
        if (index % Math.max(1, Math.floor(data.rows.length / 10)) !== 0 && index !== data.rows.length - 1) return;
        body.appendChild(makeElement(api, doc, "tr", {}, [makeElement(api, doc, "td", {}, [formatNumber(api, row.ell, 5)]), makeElement(api, doc, "td", {}, [formatNumber(api, row.denominator, 7)]), makeElement(api, doc, "td", {}, [formatNumber(api, row.coupling, 8)]), makeElement(api, doc, "td", {}, [formatNumber(api, row.betaAtCoupling, 8)]), makeElement(api, doc, "td", {}, [row.status])]));
      });
      table.appendChild(body);
      ledger.appendChild(table);
      section.appendChild(ledger);
      section.appendChild(makeElement(api, doc, "p", { className: "ren-callout ren-boundary" }, ["Boundary: ", data.boundary, " ", data.uvTrend, ". This is not a full QED/QCD/phi4 calculation."]));
      section.appendChild(makeElement(api, doc, "p", { className: "ren-callout" }, ["Migration hint: check the sign convention for beta and the direction of ell before transferring the words UV, IR, screening, or asymptotic freedom to another theory."]));
    }

    function mount(root, api) {
      var doc = root.ownerDocument;
      installStyles(doc);
      root.classList.add("renorm-lab");
      var uid = "ren-" + (INSTANCE += 1);
      var state = {
        mode: "ledger",
        beta: 0.2,
        gR: 0.8,
        runningBeta: 0.5,
        runningG0: 0.25,
        ellMin: -5,
        ellMax: 5,
        points: 41,
        revealed: { ledger: false, running: false },
        prediction: { ledger: {}, running: {} }
      };
      var modeButtons = {};
      var ledgerPanel;
      var runningPanel;
      var ledgerResults;
      var runningResults;
      var feedback;
      var ledgerQuestions = {};
      var runningQuestions = {};
      var betaControl;
      var gRControl;
      var runningBetaControl;
      var runningG0Control;

      function announce(message) {
        if (api && typeof api.announce === "function") api.announce(root, message);
      }

      function lock(mode) {
        state.revealed[mode] = false;
        state.prediction[mode] = {};
        render();
      }

      function questionNode(mode, question) {
        var id = uid + "-" + mode + "-" + question.key;
        var select = makeElement(api, doc, "select", { id: id, "aria-label": question.label });
        select.appendChild(makeElement(api, doc, "option", { value: "" }, ["请选择"]));
        question.options.forEach(function (option) { select.appendChild(makeElement(api, doc, "option", { value: option.value }, [option.label])); });
        select.addEventListener("change", function () { state.prediction[mode][question.key] = select.value; renderGate(mode); });
        return { node: makeElement(api, doc, "div", { className: "ren-question" }, [makeElement(api, doc, "label", { htmlFor: id }, [question.label]), select]), select: select };
      }

      function complete(mode) {
        var questions = mode === "ledger" ? LEDGER_QUESTIONS : RUNNING_QUESTIONS;
        return questions.every(function (question) { return state.prediction[mode][question.key]; });
      }

      function renderGate(mode) {
        var questions = mode === "ledger" ? LEDGER_QUESTIONS : RUNNING_QUESTIONS;
        var nodes = mode === "ledger" ? ledgerQuestions : runningQuestions;
        questions.forEach(function (question) { nodes[question.key].select.value = state.prediction[mode][question.key] || ""; });
        if (state.revealed[mode]) {
          var score = scoreAnswers(mode, state.prediction[mode]);
          feedback.className = "ren-feedback " + (score.correct === score.total ? "ren-pass" : "ren-warn");
          feedback.textContent = "预测得分 " + score.correct + "/" + score.total + "；现在对照账本的角色和边界。";
        } else {
          feedback.className = "ren-feedback";
          feedback.textContent = complete(mode) ? "预测已记录，点击“提交预测并揭示”。" : "先完成当前模式的三项判断。";
        }
      }

      function render() {
        modeButtons.ledger.setAttribute("aria-pressed", state.mode === "ledger" ? "true" : "false");
        modeButtons.running.setAttribute("aria-pressed", state.mode === "running" ? "true" : "false");
        ledgerPanel.hidden = state.mode !== "ledger";
        runningPanel.hidden = state.mode !== "running";
        ledgerResults.hidden = !state.revealed.ledger || state.mode !== "ledger";
        runningResults.hidden = !state.revealed.running || state.mode !== "running";
        if (betaControl) { betaControl.input.value = String(state.beta); betaControl.output.textContent = formatNumber(api, state.beta, 2); }
        if (gRControl) { gRControl.input.value = String(state.gR); gRControl.output.textContent = formatNumber(api, state.gR, 2); }
        if (runningBetaControl) { runningBetaControl.input.value = String(state.runningBeta); runningBetaControl.output.textContent = formatNumber(api, state.runningBeta, 2); }
        if (runningG0Control) { runningG0Control.input.value = String(state.runningG0); runningG0Control.output.textContent = formatNumber(api, state.runningG0, 2); }
        renderGate(state.mode);
        if (state.revealed.ledger && state.mode === "ledger") renderLedgerResults(api, doc, ledgerResults, cutoffLedger(state.beta, state.gR, 1, CUTOFFS));
        else clear(ledgerResults);
        if (state.revealed.running && state.mode === "running") renderRunningResults(api, doc, runningResults, runningData(state.runningBeta, state.runningG0, state.ellMin, state.ellMax, state.points));
        else clear(runningResults);
      }

      var shell = makeElement(api, doc, "div", { className: "ren-shell", "aria-labelledby": uid + "-title" });
      shell.appendChild(makeElement(api, doc, "h3", { id: uid + "-title" }, ["Renormalization scale lab: ledger before rhetoric"]));
      shell.appendChild(makeElement(api, doc, "p", { className: "ren-intro" }, ["This is a labeled logarithmic toy. It is not a complete QED, QCD, or phi4 loop calculation."]));
      var tabs = makeElement(api, doc, "div", { className: "ren-tabs", role: "tablist", "aria-label": "renormalization lab mode" });
      modeButtons.ledger = makeElement(api, doc, "button", { type: "button", role: "tab", "aria-pressed": "true" }, ["cutoff ledger"]);
      modeButtons.running = makeElement(api, doc, "button", { type: "button", role: "tab", "aria-pressed": "false" }, ["one-loop running"]);
      tabs.appendChild(modeButtons.ledger);
      tabs.appendChild(modeButtons.running);
      shell.appendChild(tabs);

      ledgerPanel = makeElement(api, doc, "section", { className: "ren-controls", "aria-label": "cutoff ledger controls" });
      betaControl = rangeControl(api, doc, uid, "beta", -1, 1, 0.1, state.beta, function (value) { state.beta = Math.round(value * 10) / 10; lock("ledger"); });
      gRControl = rangeControl(api, doc, uid, "gR(mu)", 0.2, 1.2, 0.05, state.gR, function (value) { state.gR = Math.round(value * 20) / 20; lock("ledger"); });
      ledgerPanel.appendChild(betaControl.wrap);
      ledgerPanel.appendChild(gRControl.wrap);
      shell.appendChild(ledgerPanel);
      runningPanel = makeElement(api, doc, "section", { className: "ren-controls", "aria-label": "running coupling controls", hidden: true });
      runningBetaControl = rangeControl(api, doc, uid, "b coefficient", -1, 1, 0.1, state.runningBeta, function (value) { state.runningBeta = Math.round(value * 10) / 10; lock("running"); });
      runningG0Control = rangeControl(api, doc, uid, "g0", 0.1, 1, 0.05, state.runningG0, function (value) { state.runningG0 = Math.round(value * 20) / 20; lock("running"); });
      runningPanel.appendChild(runningBetaControl.wrap);
      runningPanel.appendChild(runningG0Control.wrap);
      shell.appendChild(runningPanel);

      var gate = makeElement(api, doc, "section", { className: "ren-gate", "aria-labelledby": uid + "-gate-title" });
      gate.appendChild(makeElement(api, doc, "h4", { id: uid + "-gate-title" }, ["Prediction gate: submit before the toy ledger opens"]));
      var questions = makeElement(api, doc, "div", { className: "ren-questions" });
      LEDGER_QUESTIONS.forEach(function (question) {
        var item = questionNode("ledger", question);
        ledgerQuestions[question.key] = item;
        questions.appendChild(item.node);
      });
      RUNNING_QUESTIONS.forEach(function (question) {
        var item = questionNode("running", question);
        item.node.hidden = true;
        runningQuestions[question.key] = item;
        questions.appendChild(item.node);
      });
      gate.appendChild(questions);
      var actions = makeElement(api, doc, "div", { className: "ren-actions" });
      var submit = makeElement(api, doc, "button", { type: "button", className: "ren-primary" }, ["提交预测并揭示"]);
      var reset = makeElement(api, doc, "button", { type: "button" }, ["重置"]);
      actions.appendChild(submit);
      actions.appendChild(reset);
      gate.appendChild(actions);
      feedback = makeElement(api, doc, "p", { className: "ren-feedback", "aria-live": "polite" }, ["先完成当前模式的三项判断。"]);
      gate.appendChild(feedback);
      shell.appendChild(gate);
      ledgerResults = makeElement(api, doc, "section", { className: "ren-results", hidden: true, "aria-label": "cutoff ledger results" });
      runningResults = makeElement(api, doc, "section", { className: "ren-results", hidden: true, "aria-label": "running results" });
      shell.appendChild(ledgerResults);
      shell.appendChild(runningResults);
      root.replaceChildren(shell);

      function setMode(mode) {
        state.mode = mode;
        questions.querySelectorAll(".ren-question").forEach(function (node, index) {
          node.hidden = mode === "ledger" ? index >= LEDGER_QUESTIONS.length : index < LEDGER_QUESTIONS.length;
        });
        render();
      }
      modeButtons.ledger.addEventListener("click", function () { setMode("ledger"); });
      modeButtons.running.addEventListener("click", function () { setMode("running"); });
      submit.addEventListener("click", function () {
        if (!complete(state.mode)) {
          feedback.className = "ren-feedback ren-warn";
          feedback.textContent = "还缺判断；当前模式的三项都要填写。";
          announce(feedback.textContent);
          return;
        }
        state.revealed[state.mode] = true;
        render();
        announce("toy 账本已揭示。");
      });
      reset.addEventListener("click", function () {
        state.mode = "ledger";
        state.beta = 0.2;
        state.gR = 0.8;
        state.runningBeta = 0.5;
        state.runningG0 = 0.25;
        state.revealed = { ledger: false, running: false };
        state.prediction = { ledger: {}, running: {} };
        setMode("ledger");
        announce("已重置 toy 参数和预测。");
      });
      render();
    }

    function selfTest() {
      var checks = 0;
      function assert(condition, message) {
        checks += 1;
        if (!condition) throw new Error(message);
      }
      function close(left, right, message, tolerance) {
        assert(near(left, right, tolerance || 1e-9), message + ": " + left + " vs " + right);
      }

      var ledger = cutoffLedger(0.2, 0.8, 1, [1, 2, 4, 8]);
      assert(ledger.rows.length === 4, "cutoff endpoint row count");
      close(ledger.rows[0].loop, 0, "cutoff at mu has zero log");
      close(ledger.rows[0].fixedObservable, 0.8, "fixed observable at mu");
      ledger.rows.forEach(function (row) { close(row.tunedObservable, 0.8, "counterterm cancellation", 1e-8); close(row.residual, 0, "zero residual", 1e-8); });
      assert(ledger.rows[3].fixedObservable > ledger.rows[1].fixedObservable, "fixed bare cutoff dependence");
      var negative = cutoffLedger(-0.2, 0.8, 1, [1, 2]);
      assert(negative.rows[1].fixedObservable < negative.rows[0].fixedObservable, "negative beta ledger direction");
      var running = runningData(0.5, 0.25, -5, 5, 11);
      close(running.rows[5].coupling, 0.25, "running ell zero endpoint");
      close(running.poleEll, 8, "positive beta pole location");
      close(running.betaAtInitial, 0.03125, "beta at initial coupling");
      close(runningData(-0.5, 0.25, -5, 5, 11).poleEll, -8, "negative beta IR pole location");
      close(runningData(0, 0.25, -5, 5, 3).rows[2].coupling, 0.25, "zero beta constant identity");
      assert(predictionAnswers("ledger").counterterm === "cancels", "ledger prediction answer");
      assert(predictionAnswers("running").pole === "denominatorZero", "running prediction answer");
      var threw = false;
      try { cutoffLedger(0.2, 0.8, 0, [1]); } catch (error) { threw = true; }
      assert(threw, "zero mu rejected");
      threw = false;
      try { cutoffLedger(0.2, 0.8, 1, [0]); } catch (error) { threw = true; }
      assert(threw, "nonpositive Lambda rejected");
      threw = false;
      try { runningData(0.5, 0, -1, 1, 3); } catch (error) { threw = true; }
      assert(threw, "nonpositive g0 rejected");
      threw = false;
      try { runningData(0.5, 0.2, 2, 1, 3); } catch (error) { threw = true; }
      assert(threw, "reversed ell interval rejected");
      return { checks: checks, ledgerRows: ledger.rows.length, runningPoints: running.rows.length };
    }

    return {
      CUTOFFS: CUTOFFS,
      LEDGER_QUESTIONS: LEDGER_QUESTIONS,
      RUNNING_QUESTIONS: RUNNING_QUESTIONS,
      cutoffLedger: cutoffLedger,
      runningData: runningData,
      predictionAnswers: predictionAnswers,
      mount: mount,
      selfTest: selfTest
    };
  }
));
