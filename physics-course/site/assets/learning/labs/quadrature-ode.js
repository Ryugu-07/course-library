(function (host, factory) {
  "use strict";

  var exported = factory(host);

  if (typeof module === "object" && module.exports) module.exports = exported;
  if (host && host.CourseLearning && typeof host.CourseLearning.register === "function") {
    host.CourseLearning.register("quadrature-ode", exported.mount);
  }
  if (
    typeof module === "object" && module.exports &&
    typeof require === "function" && require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log(
        "quadrature-ode self-test: PASS (" + report.checks + " checks, " +
        report.quadraturePresets + " quadrature presets, " + report.odeMethods + " ODE methods)"
      );
    } catch (error) {
      console.error("quadrature-ode self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
}(
  typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : null,
  function (host) {
    "use strict";

    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "cl-quadrature-ode-style";
    var INSTANCE = 0;
    var RK4_STABILITY_LIMIT = 2.785293563405281;

    var QUADRATURE_PRESETS = [
      {
        id: "smooth",
        label: "smooth: cos(x) + x^2",
        shortLabel: "smooth",
        formula: "f(x) = cos(x) + x^2",
        f: function (x) { return Math.cos(x) + x * x; },
        exact: Math.sin(1) + 1 / 3,
        premise: "C4 on [0,1]; Simpson requires even N",
        boundary: "Smooth and resolved; the fourth-order claim still needs even N."
      },
      {
        id: "peak",
        label: "narrow peak: 1 / (1 + 400(x - 0.65)^2)",
        shortLabel: "narrow peak",
        formula: "f(x) = 1 / (1 + 400(x - 0.65)^2)",
        f: function (x) {
          var d = x - 0.65;
          return 1 / (1 + 400 * d * d);
        },
        exact: (Math.atan(7) + Math.atan(13)) / 20,
        premise: "C4, but a narrow feature must be resolved by the grid",
        boundary: "A fixed grid can miss the peak between nodes; observed order is not automatic."
      }
    ];

    var ODE_METHODS = [
      {
        id: "euler",
        label: "Euler",
        localOrder: 2,
        globalOrder: 1,
        factor: function (z) { return 1 - z; },
        stability: "0 <= z <= 2"
      },
      {
        id: "heun",
        label: "Heun",
        localOrder: 3,
        globalOrder: 2,
        factor: function (z) { return 1 - z + z * z / 2; },
        stability: "0 <= z <= 2"
      },
      {
        id: "rk4",
        label: "RK4",
        localOrder: 5,
        globalOrder: 4,
        factor: function (z) {
          return 1 - z + z * z / 2 - z * z * z / 6 + z * z * z * z / 24;
        },
        stability: "0 <= z <= 2.7852935634"
      }
    ];

    var QUADRATURE_QUESTIONS = [
      {
        key: "simpsonGrid",
        label: "复合 Simpson 的子区间数 N，首先必须满足什么？",
        options: [
          { value: "any", label: "任意正整数" },
          { value: "even", label: "偶数" },
          { value: "prime", label: "质数" }
        ],
        expected: "even"
      },
      {
        key: "peakMethod",
        label: "固定 N 下，窄峰最应该先信哪一项？",
        options: [
          { value: "trapezoid", label: "只看 trapezoid" },
          { value: "simpson", label: "只看 Simpson" },
          { value: "adaptive", label: "adaptive Simpson 对照并检查分辨率" }
        ],
        expected: "adaptive"
      },
      {
        key: "simpsonRate",
        label: "在前提满足且进入渐近区后，h 减半时 Simpson 误差约怎样？",
        options: [
          { value: "two", label: "除以 2" },
          { value: "four", label: "除以 4" },
          { value: "sixteen", label: "除以 16" }
        ],
        expected: "sixteen"
      }
    ];

    var ODE_QUESTIONS = [
      {
        key: "orders",
        label: "对一阶方法，局部截断阶与全局误差阶的典型关系是？",
        options: [
          { value: "same", label: "相同" },
          { value: "local-higher", label: "局部阶高一阶" },
          { value: "unrelated", label: "没有关系" }
        ],
        expected: "local-higher"
      },
      {
        key: "stability",
        label: "试验方程上的绝对稳定，直接检查哪一个量？",
        options: [
          { value: "factor", label: "|G(z)| <= 1" },
          { value: "order", label: "全局阶越高越稳定" },
          { value: "exact", label: "只看 exact 的符号" }
        ],
        expected: "factor"
      },
      {
        key: "overshoot",
        label: "当 1 < z < 2 时，Euler 对正的衰减解会怎样？",
        options: [
          { value: "negative-stable", label: "变负但仍可能绝对稳定" },
          { value: "positive-exact", label: "保持正且等于 exact" },
          { value: "always-blow", label: "必然立刻发散" }
        ],
        expected: "negative-stable"
      }
    ];

    var STYLE_TEXT = [
      ".qode-lab{--qode-blue:var(--cl-blue,#315f9d);--qode-green:var(--cl-green,#39734d);--qode-red:var(--cl-red,#b64335);--qode-gold:var(--cl-gold,#9b6a12);--qode-muted:var(--fg-soft,#666);--qode-block:var(--block-bg,var(--bg,#fff));color:var(--fg);line-height:1.5;min-width:0;overflow:hidden}",
      ".qode-lab *,.qode-lab *::before,.qode-lab *::after{box-sizing:border-box}",
      ".qode-lab h3,.qode-lab h4,.qode-lab p{margin-top:0}",
      ".qode-lab .qode-intro,.qode-lab .qode-note,.qode-lab .qode-feedback{color:var(--qode-muted);overflow-wrap:anywhere}",
      ".qode-lab .qode-tabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:14px 0 10px}",
      ".qode-lab button,.qode-lab select,.qode-lab input{font:inherit;letter-spacing:0}",
      ".qode-lab button,.qode-lab select{min-width:0;min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:inherit;cursor:pointer;overflow-wrap:anywhere}",
      ".qode-lab button:hover{border-color:var(--accent)}",
      ".qode-lab button[aria-pressed=\"true\"],.qode-lab .qode-primary{background:var(--accent);border-color:var(--accent);color:var(--bg);font-weight:700}",
      ".qode-lab button:focus-visible,.qode-lab select:focus-visible,.qode-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}",
      ".qode-lab .qode-panel{min-width:0}",
      ".qode-lab .qode-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 16px;margin:12px 0;padding:12px 14px;border-top:2px solid var(--accent);border-bottom:1px solid var(--border);background:var(--qode-block)}",
      ".qode-lab .qode-control{display:grid;gap:5px;min-width:0}",
      ".qode-lab .qode-control label,.qode-lab .qode-control-label{color:var(--qode-muted);font-size:13px;font-weight:700}",
      ".qode-lab .qode-control-head{display:flex;justify-content:space-between;align-items:baseline;gap:8px}",
      ".qode-lab output{color:var(--accent);font-variant-numeric:tabular-nums}",
      ".qode-lab input[type=range]{width:100%;min-height:44px;margin:0;accent-color:var(--accent)}",
      ".qode-lab .qode-gate{margin:15px 0;padding:13px 14px;border-left:3px solid var(--qode-gold);background:var(--qode-block)}",
      ".qode-lab .qode-gate h4{margin:0 0 9px;color:var(--accent)}",
      ".qode-lab .qode-question-list{display:grid;gap:10px}",
      ".qode-lab .qode-question{display:grid;gap:5px;min-width:0}",
      ".qode-lab .qode-question label{color:var(--fg);font-size:13px;font-weight:700;overflow-wrap:anywhere}",
      ".qode-lab .qode-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}",
      ".qode-lab .qode-actions>*{flex:1 1 150px}",
      ".qode-lab .qode-feedback{min-height:1.5em;margin:9px 0 0}",
      ".qode-lab .qode-pass{color:var(--qode-green);font-weight:700}.qode-lab .qode-warn{color:var(--qode-red);font-weight:700}",
      ".qode-lab .qode-results{margin-top:16px;padding-top:14px;border-top:1px solid var(--border)}",
      ".qode-lab .qode-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:0 0 13px}",
      ".qode-lab .qode-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--qode-block)}",
      ".qode-lab .qode-metric:nth-child(3n+1){border-top-color:var(--qode-blue)}.qode-lab .qode-metric:nth-child(3n+2){border-top-color:var(--qode-gold)}.qode-lab .qode-metric:nth-child(3n){border-top-color:var(--qode-green)}",
      ".qode-lab .qode-metric span{display:block;color:var(--qode-muted);font-size:11px;overflow-wrap:anywhere}.qode-lab .qode-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
      ".qode-lab .qode-chart{min-width:0;margin:12px 0;padding:7px;border:1px solid var(--border);border-radius:6px;background:var(--bg);overflow:hidden}",
      ".qode-lab .qode-chart svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg)}.qode-lab .qode-chart svg text{fill:currentColor;font-family:inherit;letter-spacing:0}",
      ".qode-lab .qode-ledger{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:12px}",
      ".qode-lab table{width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.qode-lab .qode-ledger table{min-width:960px}",
      ".qode-lab th,.qode-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;overflow-wrap:anywhere}.qode-lab th{color:var(--qode-muted);font-size:11px;font-weight:750}",
      ".qode-lab .qode-callout{margin:11px 0 0;padding:10px 12px;border-left:3px solid var(--qode-green);background:var(--qode-block);font-size:13px;line-height:1.65;overflow-wrap:anywhere}",
      ".qode-lab .qode-boundary{border-left-color:var(--qode-red)}",
      ".qode-lab [hidden]{display:none!important}",
      "@media(max-width:700px){.qode-lab .qode-controls{grid-template-columns:minmax(0,1fr)}}",
      "@media(max-width:430px){.qode-lab .qode-gate,.qode-lab .qode-controls{padding-left:10px;padding-right:10px}.qode-lab .qode-tabs{grid-template-columns:minmax(0,1fr)}}",
      "@media(prefers-reduced-motion:reduce){.qode-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
    ].join("\n");

    function finite(value) {
      return typeof value === "number" && isFinite(value);
    }

    function near(left, right, tolerance) {
      var scale = Math.max(1, Math.abs(left), Math.abs(right));
      return Math.abs(left - right) <= (tolerance || 1e-10) * scale;
    }

    function requireInteger(value, minimum, label) {
      var parsed = Number(value);
      if (!finite(parsed) || Math.floor(parsed) !== parsed || parsed < minimum) {
        throw new RangeError(label + " must be an integer >= " + minimum);
      }
      return parsed;
    }

    function requirePositive(value, label) {
      var parsed = Number(value);
      if (!finite(parsed) || parsed <= 0) throw new RangeError(label + " must be positive");
      return parsed;
    }

    function formatNumber(api, value, digits) {
      if (value === null || value === undefined) return "-";
      if (!finite(value)) return value === Infinity ? "+inf" : value === -Infinity ? "-inf" : "-";
      if (api && typeof api.format === "function") return api.format(value, digits);
      var places = digits === undefined ? 4 : digits;
      if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4));
      return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
    }

    function findQuadraturePreset(id) {
      for (var i = 0; i < QUADRATURE_PRESETS.length; i += 1) {
        if (QUADRATURE_PRESETS[i].id === id) return QUADRATURE_PRESETS[i];
      }
      throw new RangeError("unknown quadrature preset: " + id);
    }

    function compositeTrapezoid(f, a, b, count) {
      var n = requireInteger(count, 1, "trapezoid N");
      var h = (b - a) / n;
      var sum = (f(a) + f(b)) / 2;
      for (var j = 1; j < n; j += 1) sum += f(a + j * h);
      return h * sum;
    }

    function compositeSimpson(f, a, b, count) {
      var n = requireInteger(count, 2, "Simpson N");
      if (n % 2 !== 0) throw new RangeError("Simpson N must be even");
      var h = (b - a) / n;
      var sum = f(a) + f(b);
      for (var j = 1; j < n; j += 1) sum += (j % 2 === 0 ? 2 : 4) * f(a + j * h);
      return h * sum / 3;
    }

    function adaptiveSimpson(f, a, b, tolerance, maxDepth) {
      var tol = requirePositive(tolerance, "adaptive tolerance");
      var depthLimit = requireInteger(maxDepth === undefined ? 18 : maxDepth, 1, "adaptive depth");
      if (!finite(a) || !finite(b) || !(b > a)) throw new RangeError("adaptive interval must satisfy a < b");
      var evaluations = 0;
      function sample(x) {
        evaluations += 1;
        var value = f(x);
        if (!finite(value)) throw new RangeError("function value must be finite");
        return value;
      }
      function simpsonLocal(left, right, fl, fm, fr) {
        return (right - left) * (fl + 4 * fm + fr) / 6;
      }
      function recurse(left, right, fl, fm, fr, whole, localTolerance, depth) {
        var middle = (left + right) / 2;
        var leftMiddle = (left + middle) / 2;
        var rightMiddle = (middle + right) / 2;
        var flm = sample(leftMiddle);
        var frm = sample(rightMiddle);
        var leftPart = simpsonLocal(left, middle, fl, flm, fm);
        var rightPart = simpsonLocal(middle, right, fm, frm, fr);
        var delta = leftPart + rightPart - whole;
        if (depth <= 0 || Math.abs(delta) <= 15 * localTolerance) {
          return {
            value: leftPart + rightPart + delta / 15,
            errorEstimate: Math.abs(delta) / 15,
            reachedLimit: depth <= 0
          };
        }
        var leftResult = recurse(left, middle, fl, flm, fm, leftPart, localTolerance / 2, depth - 1);
        var rightResult = recurse(middle, right, fm, frm, fr, rightPart, localTolerance / 2, depth - 1);
        return {
          value: leftResult.value + rightResult.value,
          errorEstimate: leftResult.errorEstimate + rightResult.errorEstimate,
          reachedLimit: leftResult.reachedLimit || rightResult.reachedLimit
        };
      }
      var mid = (a + b) / 2;
      var fa = sample(a);
      var fm = sample(mid);
      var fb = sample(b);
      var whole = simpsonLocal(a, b, fa, fm, fb);
      var result = recurse(a, b, fa, fm, fb, whole, tol, depthLimit);
      result.evaluations = evaluations;
      result.tolerance = tol;
      result.maxDepth = depthLimit;
      return result;
    }

    function quadratureExperiment(functionId, count, tolerance) {
      var preset = findQuadraturePreset(functionId);
      var n = requireInteger(count, 2, "quadrature N");
      if (n % 2 !== 0) throw new RangeError("quadrature experiment N must be even for Simpson");
      var tol = tolerance === undefined ? 1e-9 : requirePositive(tolerance, "quadrature tolerance");
      var trapezoid = compositeTrapezoid(preset.f, 0, 1, n);
      var simpson = compositeSimpson(preset.f, 0, 1, n);
      var adaptive = adaptiveSimpson(preset.f, 0, 1, tol, 18);
      return {
        id: preset.id,
        label: preset.label,
        formula: preset.formula,
        exact: preset.exact,
        n: n,
        h: 1 / n,
        tolerance: tol,
        values: {
          trapezoid: trapezoid,
          simpson: simpson,
          adaptive: adaptive.value
        },
        errors: {
          trapezoid: Math.abs(trapezoid - preset.exact),
          simpson: Math.abs(simpson - preset.exact),
          adaptive: Math.abs(adaptive.value - preset.exact)
        },
        adaptive: adaptive,
        premise: preset.premise,
        boundary: preset.boundary
      };
    }

    function stabilityLabel(factor) {
      var magnitude = Math.abs(factor);
      if (magnitude > 1 + 1e-12) return "outside: absolute unstable";
      if (Math.abs(magnitude - 1) <= 1e-12) return "boundary: neutral";
      return factor < 0 ? "inside: stable but sign flips" : "inside: stable and nonnegative";
    }

    function odeExperiment(lambda, finalTime, count) {
      var rate = requirePositive(lambda, "lambda");
      var time = requirePositive(finalTime, "final time");
      var n = requireInteger(count, 1, "ODE steps");
      var h = time / n;
      var z = rate * h;
      var rows = [];
      for (var i = 0; i < ODE_METHODS.length; i += 1) {
        var method = ODE_METHODS[i];
        var factor = method.factor(z);
        var endpoint = Math.pow(factor, n);
        rows.push({
          id: method.id,
          label: method.label,
          factor: factor,
          localOrder: method.localOrder,
          globalOrder: method.globalOrder,
          endpoint: endpoint,
          firstValue: factor,
          absoluteError: Math.abs(endpoint - Math.exp(-rate * time)),
          stability: stabilityLabel(factor),
          stable: Math.abs(factor) <= 1 + 1e-12,
          signFlip: factor < 0,
          stabilityInterval: method.stability
        });
      }
      return {
        lambda: rate,
        finalTime: time,
        steps: n,
        h: h,
        z: z,
        exact: Math.exp(-rate * time),
        rows: rows,
        boundary: z > 2 ? "Euler is outside its real-axis stability interval." :
          z > 1 ? "Euler is stable in magnitude but changes sign on the first step." :
            "Euler remains nonnegative for this z; stability is still a separate claim."
      };
    }

    function predictionAnswers(mode) {
      var questions = mode === "quadrature" ? QUADRATURE_QUESTIONS : ODE_QUESTIONS;
      var answers = {};
      for (var i = 0; i < questions.length; i += 1) answers[questions[i].key] = questions[i].expected;
      return answers;
    }

    function predictionScore(mode, prediction) {
      var questions = mode === "quadrature" ? QUADRATURE_QUESTIONS : ODE_QUESTIONS;
      var correct = 0;
      for (var i = 0; i < questions.length; i += 1) {
        if (prediction[questions[i].key] === questions[i].expected) correct += 1;
      }
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
        if (child !== undefined && child !== null && child !== false) {
          node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
        }
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
        if (child !== undefined && child !== null && child !== false) {
          node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
        }
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
      return makeElement(api, null, "div", { className: "qode-metric" }, [
        makeElement(api, null, "span", {}, [label]),
        makeElement(api, null, "strong", {}, [value])
      ]);
    }

    function linePath(points, mapX, mapY) {
      var path = "";
      for (var i = 0; i < points.length; i += 1) {
        path += (i === 0 ? "M" : "L") + mapX(points[i][0]).toFixed(2) + " " + mapY(points[i][1]).toFixed(2) + " ";
      }
      return path.trim();
    }

    function chartText(api, doc, x, y, text, attrs) {
      var values = { x: x, y: y, "font-size": 11, fill: "var(--fg-soft)", "aria-hidden": "true" };
      Object.keys(attrs || {}).forEach(function (key) { values[key] = attrs[key]; });
      return makeSvg(api, doc, "text", values, [text]);
    }

    function drawQuadratureChart(api, doc, data) {
      var width = 700;
      var height = 300;
      var left = 44;
      var right = 674;
      var top = 28;
      var bottom = 246;
      var samples = [];
      var preset = findQuadraturePreset(data.id);
      var minY = Infinity;
      var maxY = -Infinity;
      for (var i = 0; i <= 80; i += 1) {
        var x = i / 80;
        var y = preset.f(x);
        samples.push([x, y]);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
      var range = Math.max(1e-12, maxY - minY);
      minY -= range * 0.08;
      maxY += range * 0.08;
      var mapX = function (x) { return left + (right - left) * x; };
      var mapY = function (y) { return bottom - (bottom - top) * (y - minY) / (maxY - minY); };
      var svg = makeSvg(api, doc, "svg", {
        className: "qode-svg",
        viewBox: "0 0 " + width + " " + height,
        role: "img",
        "aria-label": "被积函数曲线和三种求积误差条"
      });
      svg.appendChild(makeSvg(api, doc, "title", {}, ["quadrature curve and error ledger"]));
      svg.appendChild(makeSvg(api, doc, "desc", {}, ["The blue curve is the fixed function. Error bars at the right compare trapezoid, Simpson, and adaptive reference on a logarithmic scale."]));
      [0, 0.5, 1].forEach(function (fraction) {
        var x = left + (right - left) * fraction;
        svg.appendChild(makeSvg(api, doc, "line", { x1: x, y1: top, x2: x, y2: bottom, stroke: "var(--border)", "stroke-width": 1 }));
        svg.appendChild(chartText(api, doc, x, bottom + 18, String(fraction), { "text-anchor": "middle" }));
      });
      [minY, (minY + maxY) / 2, maxY].forEach(function (value) {
        var y = mapY(value);
        svg.appendChild(makeSvg(api, doc, "line", { x1: left, y1: y, x2: right, y2: y, stroke: "var(--border)", "stroke-width": 1 }));
        svg.appendChild(chartText(api, doc, left - 7, y + 4, formatNumber(api, value, 3), { "text-anchor": "end" }));
      });
      svg.appendChild(makeSvg(api, doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, stroke: "currentColor", "stroke-width": 1.2 }));
      svg.appendChild(makeSvg(api, doc, "path", { d: linePath(samples, mapX, mapY), fill: "none", stroke: "var(--qode-blue)", "stroke-width": 2.4 }));
      svg.appendChild(chartText(api, doc, left, 16, data.formula, { "font-size": 13, "font-weight": 700 }));
      var errorLeft = 493;
      var errorTop = 55;
      var errorBottom = 220;
      var logMax = 0;
      var logMin = -14;
      Object.keys(data.errors).forEach(function (key) {
        var error = data.errors[key];
        if (error > 0 && finite(error)) logMax = Math.max(logMax, Math.log10(error));
      });
      logMax = Math.max(0, logMax + 0.4);
      var barNames = ["trapezoid", "simpson", "adaptive"];
      var barColors = ["var(--qode-red)", "var(--qode-green)", "var(--qode-gold)"];
      svg.appendChild(chartText(api, doc, errorLeft, 34, "abs error, log10 scale", { "font-size": 12, "font-weight": 700 }));
      [0, -4, -8, -12].forEach(function (logValue) {
        var y = errorBottom - (errorBottom - errorTop) * (logValue - logMin) / (logMax - logMin);
        svg.appendChild(makeSvg(api, doc, "line", { x1: errorLeft, y1: y, x2: right, y2: y, stroke: "var(--border)", "stroke-width": 1 }));
        svg.appendChild(chartText(api, doc, errorLeft - 7, y + 4, String(logValue), { "text-anchor": "end" }));
      });
      for (var b = 0; b < barNames.length; b += 1) {
        var name = barNames[b];
        var errorValue = data.errors[name];
        var logError = errorValue === 0 ? logMin : Math.max(logMin, Math.log10(errorValue));
        var barY = errorBottom - (errorBottom - errorTop) * (logError - logMin) / (logMax - logMin);
        var x0 = errorLeft + 32 + b * 54;
        svg.appendChild(makeSvg(api, doc, "line", { x1: x0, y1: errorBottom, x2: x0, y2: barY, stroke: barColors[b], "stroke-width": 9, "stroke-linecap": "round" }));
        svg.appendChild(chartText(api, doc, x0, errorBottom + 18, name, { "text-anchor": "middle", "font-size": 10 }));
      }
      return svg;
    }

    function drawOdeChart(api, doc, data) {
      var width = 700;
      var height = 300;
      var left = 48;
      var right = 674;
      var top = 25;
      var bottom = 250;
      var trajectories = [];
      var maxAbs = Math.max(1, Math.abs(data.exact));
      for (var i = 0; i < data.rows.length; i += 1) {
        var row = data.rows[i];
        var points = [];
        for (var k = 0; k <= data.steps; k += 1) {
          var value = Math.pow(row.factor, k);
          points.push([k, value]);
          if (finite(value)) maxAbs = Math.max(maxAbs, Math.abs(value));
        }
        trajectories.push({ row: row, points: points });
      }
      maxAbs = Math.min(Math.max(1, maxAbs * 1.06), 1000000);
      var mapX = function (step) { return left + (right - left) * step / data.steps; };
      var mapY = function (value) {
        var clipped = Math.max(-maxAbs, Math.min(maxAbs, value));
        return bottom - (bottom - top) * (clipped + maxAbs) / (2 * maxAbs);
      };
      var svg = makeSvg(api, doc, "svg", {
        className: "qode-svg",
        viewBox: "0 0 " + width + " " + height,
        role: "img",
        "aria-label": "ODE numerical trajectories and exact decay"
      });
      svg.appendChild(makeSvg(api, doc, "title", {}, ["ODE amplification comparison"]));
      svg.appendChild(makeSvg(api, doc, "desc", {}, ["The exact exponential and Euler, Heun, and RK4 trajectories are shown over the chosen finite time grid."]));
      [0, data.steps / 2, data.steps].forEach(function (step) {
        var x = mapX(step);
        svg.appendChild(makeSvg(api, doc, "line", { x1: x, y1: top, x2: x, y2: bottom, stroke: "var(--border)", "stroke-width": 1 }));
        svg.appendChild(chartText(api, doc, x, bottom + 18, formatNumber(api, step * data.h, 3), { "text-anchor": "middle" }));
      });
      var zeroY = mapY(0);
      svg.appendChild(makeSvg(api, doc, "line", { x1: left, y1: zeroY, x2: right, y2: zeroY, stroke: "var(--qode-gold)", "stroke-width": 1.4, "stroke-dasharray": "5 4" }));
      svg.appendChild(makeSvg(api, doc, "path", {
        d: linePath((function () {
          var exactPoints = [];
          for (var k = 0; k <= data.steps; k += 1) exactPoints.push([k, Math.exp(-data.lambda * k * data.h)]);
          return exactPoints;
        }()), mapX, mapY),
        fill: "none",
        stroke: "currentColor",
        "stroke-width": 2.2,
        "stroke-dasharray": "5 4"
      }));
      var colors = ["var(--qode-red)", "var(--qode-green)", "var(--qode-blue)"];
      for (var i = 0; i < trajectories.length; i += 1) {
        svg.appendChild(makeSvg(api, doc, "path", { d: linePath(trajectories[i].points, mapX, mapY), fill: "none", stroke: colors[i], "stroke-width": 2 }));
      }
      svg.appendChild(chartText(api, doc, left, 16, "y' = -lambda y; z = lambda h = " + formatNumber(api, data.z, 3), { "font-size": 13, "font-weight": 700 }));
      svg.appendChild(chartText(api, doc, right, 16, "dashed = exact", { "text-anchor": "end", "font-size": 11 }));
      return svg;
    }

    function rangeControl(api, doc, uid, label, min, max, step, value, onInput) {
      var id = uid + "-" + label.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      var output = makeElement(api, doc, "output", { for: id }, [String(value)]);
      var head = makeElement(api, doc, "div", { className: "qode-control-head" }, [
        makeElement(api, doc, "span", {}, [label]), output
      ]);
      var input = makeElement(api, doc, "input", { id: id, type: "range", min: min, max: max, step: step, value: value, "aria-label": label });
      input.addEventListener("input", function () { onInput(Number(input.value)); });
      return {
        wrap: makeElement(api, doc, "div", { className: "qode-control" }, [head, input]),
        input: input,
        output: output
      };
    }

    function selectControl(api, doc, uid, label, options, value, onChange) {
      var id = uid + "-" + label.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      var select = makeElement(api, doc, "select", { id: id, "aria-label": label });
      options.forEach(function (option) {
        select.appendChild(makeElement(api, doc, "option", { value: option.value }, [option.label]));
      });
      select.value = value;
      select.addEventListener("change", function () { onChange(select.value); });
      return {
        wrap: makeElement(api, doc, "div", { className: "qode-control" }, [
        makeElement(api, doc, "label", { htmlFor: id }, [label]), select
        ]),
        input: select
      };
    }

    function renderQuadratureResults(api, doc, root, section, data) {
      replaceChildren(section, []);
      var metrics = makeElement(api, doc, "div", { className: "qode-metrics" });
      metrics.appendChild(metric(api, "function", data.label));
      metrics.appendChild(metric(api, "N / h", data.n + " / " + formatNumber(api, data.h, 5)));
      metrics.appendChild(metric(api, "analytic exact", formatNumber(api, data.exact, 10)));
      metrics.appendChild(metric(api, "adaptive calls", String(data.adaptive.evaluations)));
      section.appendChild(metrics);
      section.appendChild(makeElement(api, doc, "div", { className: "qode-chart" }, [drawQuadratureChart(api, doc, data)]));
      var ledger = makeElement(api, doc, "div", { className: "qode-ledger" });
      var table = makeElement(api, doc, "table", {});
      var head = makeElement(api, doc, "thead", {}, [makeElement(api, doc, "tr", {}, [
        makeElement(api, doc, "th", {}, ["item"]),
        makeElement(api, doc, "th", {}, ["value"]),
        makeElement(api, doc, "th", {}, ["abs error"]),
        makeElement(api, doc, "th", {}, ["order / premise"]),
        makeElement(api, doc, "th", {}, ["status"])
      ])]);
      var body = makeElement(api, doc, "tbody");
      var rows = [
        ["trapezoid", data.values.trapezoid, data.errors.trapezoid, "O(h^2); fixed grid", "reference comparison"],
        ["Simpson", data.values.simpson, data.errors.simpson, "O(h^4); N even + C4", "premise checked"],
        ["adaptive Simpson", data.values.adaptive, data.errors.adaptive, "tol=" + data.tolerance, data.adaptive.reachedLimit ? "depth limit reached" : "tolerance met"]
      ];
      rows.forEach(function (row) {
        body.appendChild(makeElement(api, doc, "tr", {}, row.map(function (value, index) {
          return makeElement(api, doc, "td", {}, [index === 1 || index === 2 ? formatNumber(api, value, 10) : value]);
        })));
      });
      table.appendChild(head);
      table.appendChild(body);
      ledger.appendChild(table);
      section.appendChild(ledger);
      section.appendChild(makeElement(api, doc, "p", { className: "qode-callout" }, [
        "Boundary: ", data.boundary, " The adaptive row is an algorithm comparison under the displayed tolerance; the analytic value is the actual error check."
      ]));
      section.appendChild(makeElement(api, doc, "p", { className: "qode-callout" }, [
        "Migration hint: on a new integrand, first check regularity and feature width, then compare error against work. Do not transfer the observed slope until the grid is in the asymptotic regime."
      ]));
    }

    function renderOdeResults(api, doc, section, data) {
      replaceChildren(section, []);
      var metrics = makeElement(api, doc, "div", { className: "qode-metrics" });
      metrics.appendChild(metric(api, "lambda, T", formatNumber(api, data.lambda, 3) + ", " + formatNumber(api, data.finalTime, 3)));
      metrics.appendChild(metric(api, "steps / h", data.steps + " / " + formatNumber(api, data.h, 5)));
      metrics.appendChild(metric(api, "z = lambda h", formatNumber(api, data.z, 5)));
      metrics.appendChild(metric(api, "exact y(T)", formatNumber(api, data.exact, 10)));
      section.appendChild(metrics);
      section.appendChild(makeElement(api, doc, "div", { className: "qode-chart" }, [drawOdeChart(api, doc, data)]));
      var ledger = makeElement(api, doc, "div", { className: "qode-ledger" });
      var table = makeElement(api, doc, "table", {});
      table.appendChild(makeElement(api, doc, "thead", {}, [makeElement(api, doc, "tr", {}, [
        makeElement(api, doc, "th", {}, ["method"]),
        makeElement(api, doc, "th", {}, ["G(z)"]),
        makeElement(api, doc, "th", {}, ["local / global"]),
        makeElement(api, doc, "th", {}, ["y(1), y(T)"]),
        makeElement(api, doc, "th", {}, ["abs error"]),
        makeElement(api, doc, "th", {}, ["absolute stability"])
      ])]));
      var body = makeElement(api, doc, "tbody");
      data.rows.forEach(function (row) {
        body.appendChild(makeElement(api, doc, "tr", {}, [
          makeElement(api, doc, "td", {}, [row.label]),
          makeElement(api, doc, "td", {}, [formatNumber(api, row.factor, 8)]),
          makeElement(api, doc, "td", {}, ["O(h^" + row.localOrder + ") / O(h^" + row.globalOrder + ")"]),
          makeElement(api, doc, "td", {}, [formatNumber(api, row.firstValue, 8) + ", " + formatNumber(api, row.endpoint, 10)]),
          makeElement(api, doc, "td", {}, [formatNumber(api, row.absoluteError, 10)]),
          makeElement(api, doc, "td", {}, [row.stability + "; " + row.stabilityInterval])
        ]));
      });
      table.appendChild(body);
      ledger.appendChild(table);
      section.appendChild(ledger);
      section.appendChild(makeElement(api, doc, "p", { className: "qode-callout qode-boundary" }, [
        "Counterexample ledger: ", data.boundary, " The first-value column exposes a sign violation even when the magnitude is still below one."
      ]));
      section.appendChild(makeElement(api, doc, "p", { className: "qode-callout" }, [
        "Migration hint: for a new ODE, linearize the fast mode, record its z values, and separate order from the absolute-stability region before choosing a step size."
      ]));
    }

    function mount(root, api) {
      var doc = root.ownerDocument;
      installStyles(doc);
      root.classList.add("qode-lab");
      var uid = "qode-" + (INSTANCE += 1);
      var state = {
        mode: "quadrature",
        functionId: "smooth",
        qN: 8,
        tolerance: 1e-9,
        lambda: 20,
        finalTime: 0.5,
        steps: 8,
        revealed: { quadrature: false, ode: false },
        prediction: { quadrature: {}, ode: {} }
      };
      var predictionSelects = { quadrature: {}, ode: {} };
      var modeButtons = {};
      var qPanel;
      var odePanel;
      var qResults;
      var odeResults;
      var feedback;
      var qFunctionControl;
      var qToleranceControl;
      var qRange;
      var lambdaRange;
      var timeRange;
      var stepRange;

      function announce(message) {
        if (api && typeof api.announce === "function") api.announce(root, message);
      }

      function lock(mode) {
        state.revealed[mode] = false;
        state.prediction[mode] = {};
        render();
      }

      function questionSelect(mode, question) {
        var id = uid + "-" + mode + "-" + question.key;
        var select = makeElement(api, doc, "select", { id: id, "aria-label": question.label });
        select.appendChild(makeElement(api, doc, "option", { value: "" }, ["请选择"]));
        question.options.forEach(function (option) {
          select.appendChild(makeElement(api, doc, "option", { value: option.value }, [option.label]));
        });
        select.addEventListener("change", function () {
          state.prediction[mode][question.key] = select.value;
          renderGate(mode);
        });
        predictionSelects[mode][question.key] = select;
        return makeElement(api, doc, "div", { className: "qode-question" }, [
          makeElement(api, doc, "label", { htmlFor: id }, [question.label]), select
        ]);
      }

      function predictionComplete(mode) {
        var questions = mode === "quadrature" ? QUADRATURE_QUESTIONS : ODE_QUESTIONS;
        return questions.every(function (question) { return state.prediction[mode][question.key]; });
      }

      function renderGate(mode) {
        var questions = mode === "quadrature" ? QUADRATURE_QUESTIONS : ODE_QUESTIONS;
        questions.forEach(function (question) {
          if (predictionSelects[mode][question.key]) predictionSelects[mode][question.key].value = state.prediction[mode][question.key] || "";
        });
        if (state.revealed[mode]) {
          var score = predictionScore(mode, state.prediction[mode]);
          feedback.className = "qode-feedback " + (score.correct === score.total ? "qode-pass" : "qode-warn");
          feedback.textContent = "预测得分 " + score.correct + "/" + score.total + "；现在对照逐项账本。";
        } else {
          feedback.className = "qode-feedback";
          feedback.textContent = predictionComplete(mode) ? "预测已记录，点击“提交预测并揭示”。" : "先完成当前模式的三项判断。";
        }
      }

      function render() {
        modeButtons.quadrature.setAttribute("aria-pressed", state.mode === "quadrature" ? "true" : "false");
        modeButtons.ode.setAttribute("aria-pressed", state.mode === "ode" ? "true" : "false");
        qPanel.hidden = state.mode !== "quadrature";
        odePanel.hidden = state.mode !== "ode";
        qResults.hidden = !state.revealed.quadrature || state.mode !== "quadrature";
        odeResults.hidden = !state.revealed.ode || state.mode !== "ode";
        if (qFunctionControl) qFunctionControl.input.value = state.functionId;
        if (qToleranceControl) qToleranceControl.input.value = String(state.tolerance);
        if (qRange) {
          qRange.input.value = String(state.qN);
          qRange.output.textContent = String(state.qN);
        }
        if (lambdaRange) {
          lambdaRange.input.value = String(state.lambda);
          lambdaRange.output.textContent = String(state.lambda);
        }
        if (timeRange) {
          timeRange.input.value = String(state.finalTime);
          timeRange.output.textContent = formatNumber(api, state.finalTime, 2);
        }
        if (stepRange) {
          stepRange.input.value = String(state.steps);
          stepRange.output.textContent = String(state.steps);
        }
        renderGate(state.mode);
        if (state.revealed.quadrature && state.mode === "quadrature") {
          renderQuadratureResults(api, doc, root, qResults, quadratureExperiment(state.functionId, state.qN, state.tolerance));
        } else clear(qResults);
        if (state.revealed.ode && state.mode === "ode") {
          renderOdeResults(api, doc, odeResults, odeExperiment(state.lambda, state.finalTime, state.steps));
        } else clear(odeResults);
      }

      var shell = makeElement(api, doc, "div", { className: "qode-shell", "aria-labelledby": uid + "-title" });
      shell.appendChild(makeElement(api, doc, "h3", { id: uid + "-title" }, ["Quadrature and ODE stability lab"]));
      shell.appendChild(makeElement(api, doc, "p", { className: "qode-intro" }, [
        "先作答，再查看固定函数、放大因子和 analytic exact check 的逐项账本。这里没有随机采样。"
      ]));
      var tabs = makeElement(api, doc, "div", { className: "qode-tabs", role: "tablist", "aria-label": "experiment mode" });
      modeButtons.quadrature = makeElement(api, doc, "button", { type: "button", role: "tab", "aria-selected": "true", "aria-pressed": "true" }, ["求积 comparison"]);
      modeButtons.ode = makeElement(api, doc, "button", { type: "button", role: "tab", "aria-selected": "false", "aria-pressed": "false" }, ["ODE stability"]);
      tabs.appendChild(modeButtons.quadrature);
      tabs.appendChild(modeButtons.ode);
      shell.appendChild(tabs);

      qPanel = makeElement(api, doc, "section", { className: "qode-panel", "aria-label": "quadrature controls" });
      var qControls = makeElement(api, doc, "div", { className: "qode-controls" });
      qFunctionControl = selectControl(api, doc, uid, "fixed function", QUADRATURE_PRESETS.map(function (preset) {
        return { value: preset.id, label: preset.label };
      }), state.functionId, function (value) { state.functionId = value; lock("quadrature"); });
      qControls.appendChild(qFunctionControl.wrap);
      qToleranceControl = selectControl(api, doc, uid, "adaptive tolerance", [
        { value: "1e-6", label: "1e-6" }, { value: "1e-9", label: "1e-9" }, { value: "1e-12", label: "1e-12" }
      ], String(state.tolerance), function (value) { state.tolerance = Number(value); lock("quadrature"); });
      qControls.appendChild(qToleranceControl.wrap);
      qRange = rangeControl(api, doc, uid, "even subintervals N", 2, 64, 2, state.qN, function (value) {
        state.qN = Math.max(2, Math.min(64, Math.round(value))); lock("quadrature");
      });
      qControls.appendChild(qRange.wrap);
      qPanel.appendChild(qControls);
      shell.appendChild(qPanel);

      odePanel = makeElement(api, doc, "section", { className: "qode-panel", "aria-label": "ODE controls", hidden: true });
      var odeControls = makeElement(api, doc, "div", { className: "qode-controls" });
      lambdaRange = rangeControl(api, doc, uid, "lambda", 1, 40, 1, state.lambda, function (value) {
        state.lambda = Math.max(1, Math.min(40, Math.round(value))); lock("ode");
      });
      timeRange = rangeControl(api, doc, uid, "final time T", 0.1, 1, 0.05, state.finalTime, function (value) {
        state.finalTime = Math.max(0.1, Math.min(1, value)); lock("ode");
      });
      stepRange = rangeControl(api, doc, uid, "steps N", 1, 32, 1, state.steps, function (value) {
        state.steps = Math.max(1, Math.min(32, Math.round(value))); lock("ode");
      });
      odeControls.appendChild(lambdaRange.wrap);
      odeControls.appendChild(timeRange.wrap);
      odeControls.appendChild(stepRange.wrap);
      odePanel.appendChild(odeControls);
      shell.appendChild(odePanel);

      var gate = makeElement(api, doc, "section", { className: "qode-gate", "aria-labelledby": uid + "-gate-title" });
      gate.appendChild(makeElement(api, doc, "h4", { id: uid + "-gate-title" }, ["Prediction gate: submit before the ledger opens"]));
      var questionList = makeElement(api, doc, "div", { className: "qode-question-list" });
      QUADRATURE_QUESTIONS.forEach(function (question) { questionList.appendChild(questionSelect("quadrature", question)); });
      ODE_QUESTIONS.forEach(function (question) {
        var node = questionSelect("ode", question);
        node.hidden = true;
        questionList.appendChild(node);
      });
      gate.appendChild(questionList);
      var actions = makeElement(api, doc, "div", { className: "qode-actions" });
      var submit = makeElement(api, doc, "button", { type: "button", className: "qode-primary" }, ["提交预测并揭示"]);
      var reset = makeElement(api, doc, "button", { type: "button" }, ["重置"]);
      actions.appendChild(submit);
      actions.appendChild(reset);
      gate.appendChild(actions);
      feedback = makeElement(api, doc, "p", { className: "qode-feedback", "aria-live": "polite" }, ["先完成当前模式的三项判断。"]);
      gate.appendChild(feedback);
      shell.appendChild(gate);

      qResults = makeElement(api, doc, "section", { className: "qode-results", "aria-label": "quadrature ledger", hidden: true });
      odeResults = makeElement(api, doc, "section", { className: "qode-results", "aria-label": "ODE ledger", hidden: true });
      shell.appendChild(qResults);
      shell.appendChild(odeResults);
      root.replaceChildren(shell);

      function setMode(mode) {
        state.mode = mode;
        var qQuestions = questionList.querySelectorAll(".qode-question");
        qQuestions.forEach(function (node, index) { node.hidden = mode === "quadrature" ? index >= QUADRATURE_QUESTIONS.length : index < QUADRATURE_QUESTIONS.length; });
        render();
      }
      modeButtons.quadrature.addEventListener("click", function () { setMode("quadrature"); });
      modeButtons.ode.addEventListener("click", function () { setMode("ode"); });
      submit.addEventListener("click", function () {
        if (!predictionComplete(state.mode)) {
          feedback.className = "qode-feedback qode-warn";
          feedback.textContent = "还缺判断；当前模式的三项都要填写。";
          announce(feedback.textContent);
          return;
        }
        state.revealed[state.mode] = true;
        render();
        announce("账本已揭示；现在可以逐项核对公式和边界。");
      });
      reset.addEventListener("click", function () {
        state.mode = "quadrature";
        state.functionId = "smooth";
        state.qN = 8;
        state.tolerance = 1e-9;
        state.lambda = 20;
        state.finalTime = 0.5;
        state.steps = 8;
        state.revealed = { quadrature: false, ode: false };
        state.prediction = { quadrature: {}, ode: {} };
        var qQuestions = questionList.querySelectorAll(".qode-question");
        qQuestions.forEach(function (node, index) { node.hidden = index >= QUADRATURE_QUESTIONS.length; });
        render();
        announce("已重置预测和参数。");
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

      assert(QUADRATURE_PRESETS.length === 2, "two fixed quadrature presets");
      var smooth = findQuadraturePreset("smooth");
      var peak = findQuadraturePreset("peak");
      close(smooth.exact, Math.sin(1) + 1 / 3, "smooth analytic integral");
      close(peak.exact, (Math.atan(7) + Math.atan(13)) / 20, "peak analytic integral");
      close(compositeSimpson(function (x) { return 1 + x + x * x + x * x * x; }, 0, 1, 2), 25 / 12, "Simpson exact cubic identity");
      close(compositeTrapezoid(function (x) { return 1; }, 0, 1, 1), 1, "trapezoid endpoint N=1");
      var q2 = quadratureExperiment("smooth", 2, 1e-10);
      assert(q2.errors.simpson < q2.errors.trapezoid, "Simpson improves smooth N=2");
      var qp = quadratureExperiment("peak", 8, 1e-10);
      close(qp.adaptive.value, peak.exact, "adaptive peak reference", 1e-8);
      assert(qp.adaptive.evaluations >= 5, "adaptive has deterministic evaluations");
      assert(predictionAnswers("quadrature").simpsonGrid === "even", "quadrature prediction answer");
      var threw = false;
      try { compositeSimpson(smooth.f, 0, 1, 3); } catch (error) { threw = true; }
      assert(threw, "odd Simpson N rejected");
      threw = false;
      try { adaptiveSimpson(smooth.f, 0, 1, 0); } catch (error) { threw = true; }
      assert(threw, "zero adaptive tolerance rejected");
      threw = false;
      try { quadratureExperiment("missing", 8); } catch (error) { threw = true; }
      assert(threw, "unknown preset rejected");

      var ode0 = odeExperiment(20, 0.5, 8);
      close(ode0.z, 1.25, "ODE default z");
      close(ode0.rows[0].factor, -0.25, "Euler amplification at overshoot case");
      assert(ode0.rows[0].signFlip && ode0.rows[0].stable, "Euler sign flip can be stable");
      close(ode0.rows[1].factor, 0.53125, "Heun amplification identity");
      close(ode0.rows[2].factor, 1 - 1.25 + 1.25 * 1.25 / 2 - Math.pow(1.25, 3) / 6 + Math.pow(1.25, 4) / 24, "RK4 Taylor factor");
      close(odeExperiment(3, 0.5, 1).rows[0].factor, -0.5, "Euler endpoint step");
      assert(!odeExperiment(5, 1, 1).rows[0].stable, "Euler outside stability at z=5");
      close(odeExperiment(2, 1, 1).rows[0].factor, -1, "Euler stability boundary factor");
      close(odeExperiment(2, 1, 1).exact, Math.exp(-2), "exact endpoint identity");
      assert(predictionAnswers("ode").overshoot === "negative-stable", "ODE prediction answer");
      threw = false;
      try { odeExperiment(0, 1, 1); } catch (error) { threw = true; }
      assert(threw, "nonpositive lambda rejected");
      threw = false;
      try { odeExperiment(1, 1, 0); } catch (error) { threw = true; }
      assert(threw, "zero ODE steps rejected");
      return { checks: checks, quadraturePresets: QUADRATURE_PRESETS.length, odeMethods: ODE_METHODS.length };
    }

    return {
      QUADRATURE_PRESETS: QUADRATURE_PRESETS,
      ODE_METHODS: ODE_METHODS,
      compositeTrapezoid: compositeTrapezoid,
      compositeSimpson: compositeSimpson,
      adaptiveSimpson: adaptiveSimpson,
      quadratureExperiment: quadratureExperiment,
      odeExperiment: odeExperiment,
      predictionAnswers: predictionAnswers,
      mount: mount,
      selfTest: selfTest
    };
  }
));
