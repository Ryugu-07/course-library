(function (root, factory) {
  "use strict";

  var exported = factory(root);

  if (typeof module === "object" && module.exports) {
    module.exports = exported;
  }

  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("cantor-measure", exported.mount);
  }

  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log(
        "cantor-measure self-test: PASS (" +
          report.checks +
          " checks, " +
          report.standardStages +
          " standard stages, " +
          report.fatStages +
          " fat stages, " +
          report.denseLevels +
          " dense levels)"
      );
    } catch (error) {
      console.error("cantor-measure self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(
  typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : null,
  function (host) {
    "use strict";

    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "cl-cantor-measure-styles";
    var MAX_STAGE = 6;
    var MAX_DYADIC_LEVEL = 5;
    var SERIAL = 0;
    var MODE_ORDER = ["standard", "fat", "dense"];

    var MODE_INFO = {
      standard: {
        label: "标准 Cantor",
        shortLabel: "标准三分 Cantor 集",
        stageLabel: "阶段 n",
        limitLabel: "m(C)=0",
        theoremLabel: "外测度预算",
        theoremKey: "outer"
      },
      fat: {
        label: "fat Cantor",
        shortLabel: "fat Cantor 集",
        stageLabel: "阶段 n",
        limitLabel: "m(F)=1/2",
        theoremLabel: "从上连续性",
        theoremKey: "continuity"
      },
      dense: {
        label: "可数稠密集",
        shortLabel: "二进制有理数稠密集",
        stageLabel: "层级 K",
        limitLabel: "m(D)=0，cl(D)=[0,1]",
        theoremLabel: "ε 覆盖",
        theoremKey: "cover"
      }
    };

    var STYLE_TEXT = [
      ".cm-lab{--cm-stage:#416fae;--cm-stage-alt:#aa741b;--cm-limit:#9b6a12;--cm-point:#39734d;--cm-closure:#b64335;max-width:100%;min-width:0;overflow:hidden;color:var(--fg);line-height:1.55;}",
      ".cm-lab *,.cm-lab *::before,.cm-lab *::after{box-sizing:border-box;}",
      ".cm-lab [hidden]{display:none!important;}",
      ".cm-lab h3,.cm-lab h4{margin:0;color:var(--fg);}",
      ".cm-lab h3{font-size:1.18rem;}",
      ".cm-lab h4{margin-top:16px;font-size:1rem;}",
      ".cm-lab p{margin:.65em 0;}",
      ".cm-lab .cm-note,.cm-lab .cm-feedback,.cm-lab .cm-interpretation{color:var(--fg-soft);font-size:13px;line-height:1.65;overflow-wrap:anywhere;}",
      ".cm-lab button,.cm-lab select,.cm-lab input{font:inherit;letter-spacing:0;}",
      ".cm-lab button,.cm-lab select{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;line-height:1.35;overflow-wrap:anywhere;}",
      ".cm-lab button:hover{border-color:var(--accent);}",
      ".cm-lab button[aria-pressed=\"true\"],.cm-lab button.cm-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:700;}",
      ".cm-lab button:disabled{cursor:not-allowed;opacity:.55;}",
      ".cm-lab button:focus-visible,.cm-lab select:focus-visible,.cm-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}",
      ".cm-lab .cm-modes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:14px 0;}",
      ".cm-lab .cm-modes button{min-height:48px;font-weight:700;}",
      ".cm-lab .cm-controls{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px 18px;margin:14px 0;}",
      ".cm-lab .cm-control{display:grid;gap:5px;min-width:0;}",
      ".cm-lab .cm-control label,.cm-lab .cm-control-title{color:var(--fg-soft);font-size:13px;font-weight:700;}",
      ".cm-lab .cm-control output{color:var(--accent);font-variant-numeric:tabular-nums;}",
      ".cm-lab .cm-control input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent);}",
      ".cm-lab .cm-scale{display:flex;justify-content:space-between;gap:8px;color:var(--fg-soft);font-size:11px;}",
      ".cm-lab .cm-gate{margin:16px 0;padding:13px 14px;border-left:3px solid var(--cm-limit);background:var(--bg);}",
      ".cm-lab .cm-gate-title{display:block;margin-bottom:10px;font-size:13px;}",
      ".cm-lab .cm-question-list{display:grid;gap:12px;}",
      ".cm-lab .cm-question{min-width:0;margin:0;padding:0;border:0;}",
      ".cm-lab .cm-question legend{max-width:100%;margin-bottom:7px;color:var(--fg);font-size:12.5px;font-weight:700;overflow-wrap:anywhere;}",
      ".cm-lab .cm-choice-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}",
      ".cm-lab .cm-choice-row button{font-size:12px;}",
      ".cm-lab .cm-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}",
      ".cm-lab .cm-actions>*{flex:1 1 160px;}",
      ".cm-lab .cm-feedback{min-height:2em;margin:8px 0 0;font-weight:700;}",
      ".cm-lab .cm-pass{color:var(--cm-point);}",
      ".cm-lab .cm-warn{color:var(--cm-closure);}",
      ".cm-lab .cm-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);}",
      ".cm-lab .cm-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:12px 0;}",
      ".cm-lab .cm-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}",
      ".cm-lab .cm-metric.cm-blue{border-top-color:var(--cm-stage);}.cm-lab .cm-metric.cm-gold{border-top-color:var(--cm-limit);}.cm-lab .cm-metric.cm-green{border-top-color:var(--cm-point);}.cm-lab .cm-metric.cm-red{border-top-color:var(--cm-closure);}",
      ".cm-lab .cm-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4;}",
      ".cm-lab .cm-metric strong{display:block;margin-top:3px;color:var(--fg);font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}",
      ".cm-lab .cm-chart-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden;}",
      ".cm-lab svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg);}",
      ".cm-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}",
      ".cm-lab .cm-axis{stroke:currentColor;stroke-width:1.15;stroke-opacity:.72;}",
      ".cm-lab .cm-grid-line{stroke:var(--border);stroke-width:1;stroke-opacity:.55;}",
      ".cm-lab .cm-stage-pixel{fill:var(--cm-stage);stroke:var(--bg);stroke-width:.7;}",
      ".cm-lab .cm-stage-pixel.cm-fat{fill:var(--cm-stage-alt);}",
      ".cm-lab .cm-limit-marker{stroke:var(--cm-limit);stroke-width:2;stroke-dasharray:2 6;stroke-linecap:round;}",
      ".cm-lab .cm-point-pixel{fill:var(--cm-point);stroke:var(--bg);stroke-width:1;}",
      ".cm-lab .cm-closure-line{stroke:var(--cm-closure);stroke-width:2;stroke-dasharray:1 5;stroke-linecap:round;}",
      ".cm-lab .cm-legend{display:flex;flex-wrap:wrap;gap:7px 14px;margin:7px 0 0;color:var(--fg-soft);font-size:12px;}",
      ".cm-lab .cm-legend span{display:inline-flex;align-items:center;gap:5px;}",
      ".cm-lab .cm-swatch{display:inline-block;width:18px;height:7px;border:1px solid currentColor;}",
      ".cm-lab .cm-swatch.cm-stage-swatch{background:var(--cm-stage);}.cm-lab .cm-swatch.cm-limit-swatch{height:2px;border:0;border-top:2px dashed var(--cm-limit);}.cm-lab .cm-swatch.cm-point-swatch{width:8px;height:8px;border-radius:50%;background:var(--cm-point);}.cm-lab .cm-swatch.cm-closure-swatch{height:2px;border:0;border-top:2px dotted var(--cm-closure);}",
      ".cm-lab .cm-ledger{max-width:100%;margin-top:14px;overflow-x:auto;-webkit-overflow-scrolling:touch;}",
      ".cm-lab table{width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}",
      ".cm-lab .cm-ledger table{min-width:760px;}",
      ".cm-lab caption{padding:7px 0;color:var(--fg-soft);text-align:left;font-size:12px;font-weight:700;}",
      ".cm-lab th,.cm-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;overflow-wrap:anywhere;}",
      ".cm-lab th{color:var(--fg-soft);font-size:11.5px;font-weight:750;}",
      ".cm-lab .cm-formula{overflow-x:auto;padding:9px 11px;border-left:3px solid var(--accent);background:var(--bg);font-family:\"SF Mono\",Menlo,Consolas,monospace;font-size:12px;line-height:1.65;}",
      ".cm-lab .cm-interpretation{margin:12px 0 0;padding:11px 13px;border-left:3px solid var(--cm-point);background:var(--bg);}",
      "html[data-theme=\"dark\"] .cm-lab{--cm-stage:#8bbcff;--cm-stage-alt:#e7b85b;--cm-limit:#e7c26e;--cm-point:#82d19d;--cm-closure:#f09788;}",
      "@media(max-width:760px){.cm-lab .cm-controls{grid-template-columns:minmax(0,1fr);}.cm-lab .cm-chart-frame{padding:6px;}.cm-lab .cm-choice-row{grid-template-columns:minmax(0,1fr);}}",
      "@media(max-width:420px){.cm-lab .cm-modes{grid-template-columns:minmax(0,1fr);}.cm-lab .cm-gate{padding-left:11px;padding-right:11px;}.cm-lab .cm-ledger{margin-left:-2px;margin-right:-2px;}.cm-lab th,.cm-lab td{padding-left:5px;padding-right:5px;}}",
      "@media(prefers-color-scheme:dark){html:not([data-theme]) .cm-lab{--cm-stage:#8bbcff;--cm-stage-alt:#e7b85b;--cm-limit:#e7c26e;--cm-point:#82d19d;--cm-closure:#f09788;}}",
      "@media(prefers-reduced-motion:reduce){.cm-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important;}}"
    ].join("\n");

    function gcd(a, b) {
      var x = Math.abs(a);
      var y = Math.abs(b);
      while (y) {
        var next = x % y;
        x = y;
        y = next;
      }
      return x || 1;
    }

    function fraction(numerator, denominator) {
      if (denominator === 0) throw new Error("zero denominator");
      var sign = denominator < 0 ? -1 : 1;
      var n = numerator * sign;
      var d = Math.abs(denominator);
      var divisor = gcd(n, d);
      return { n: n / divisor, d: d / divisor };
    }

    function fractionText(value) {
      if (!value) return "—";
      if (value.n === 0) return "0";
      return value.d === 1 ? String(value.n) : String(value.n) + "/" + String(value.d);
    }

    function fractionApprox(value) {
      return value.n / value.d;
    }

    function valueText(value, digits) {
      if (!Number.isFinite(value)) return "—";
      var places = digits === undefined ? 6 : digits;
      var text = value.toFixed(places);
      return text.replace(/0+$/, "").replace(/\.$/, "");
    }

    function exactAndApprox(value) {
      var exact = fractionText(value);
      var numeric = fractionApprox(value);
      return exact + " ≈ " + valueText(numeric, 6);
    }

    function clampInteger(value, min, max, fallback) {
      var number = Number(value);
      if (!Number.isFinite(number)) return fallback;
      return Math.max(min, Math.min(max, Math.round(number)));
    }

    function standardIntervals(stage) {
      var intervals = [[0, 1]];
      for (var step = 0; step < stage; step += 1) {
        var next = [];
        intervals.forEach(function (interval) {
          var length = (interval[1] - interval[0]) / 3;
          next.push(
            [interval[0], interval[0] + length],
            [interval[1] - length, interval[1]]
          );
        });
        intervals = next;
      }
      return intervals;
    }

    function fatIntervals(stage) {
      var intervals = [[0, 1]];
      for (var step = 1; step <= stage; step += 1) {
        var gap = Math.pow(4, -step);
        var next = [];
        intervals.forEach(function (interval) {
          var length = interval[1] - interval[0];
          var childLength = (length - gap) / 2;
          var center = (interval[0] + interval[1]) / 2;
          next.push(
            [interval[0], interval[0] + childLength],
            [center + gap / 2, interval[1]]
          );
        });
        intervals = next;
      }
      return intervals;
    }

    function standardModel(stage) {
      var n = clampInteger(stage, 0, MAX_STAGE, 4);
      var twoPower = Math.pow(2, n);
      var threePower = Math.pow(3, n);
      var removedThisStage = n === 0 ? fraction(0, 1) : fraction(Math.pow(2, n - 1), threePower);
      var remaining = fraction(twoPower, threePower);
      var deleted = fraction(threePower - twoPower, threePower);
      return {
        id: "standard",
        label: MODE_INFO.standard.shortLabel,
        stage: n,
        stageLabel: "n=" + n,
        intervalCount: twoPower,
        segmentLength: fraction(1, threePower),
        remaining: remaining,
        deletedThisStage: removedThisStage,
        deleted: deleted,
        outerCoverBudget: remaining,
        intervals: standardIntervals(n),
        limit: "C=∩Cₙ，m*(C)≤(2/3)ⁿ→0，所以 m(C)=0。",
        theorem: "外测度定义（或测度从上连续性）",
        finiteWarning: "有限阶段只显示 Cₙ，不是 C 的像素证明。"
      };
    }

    function fatModel(stage) {
      var n = clampInteger(stage, 0, MAX_STAGE, 4);
      var twoPower = Math.pow(2, n);
      var denominator = Math.pow(2, n + 1);
      var remaining = fraction(twoPower + 1, denominator);
      var deleted = fraction(twoPower - 1, denominator);
      var segment = fraction(twoPower + 1, Math.pow(2, 2 * n + 1));
      var removedThisStage = n === 0 ? fraction(0, 1) : fraction(1, Math.pow(2, n + 1));
      return {
        id: "fat",
        label: MODE_INFO.fat.shortLabel,
        stage: n,
        stageLabel: "n=" + n,
        intervalCount: twoPower,
        segmentLength: segment,
        gapLength: n === 0 ? fraction(0, 1) : fraction(1, Math.pow(4, n)),
        remaining: remaining,
        deletedThisStage: removedThisStage,
        deleted: deleted,
        outerCoverBudget: remaining,
        intervals: fatIntervals(n),
        limit: "F=∩Fₙ，m(F)=lim m(Fₙ)=1/2。",
        theorem: "测度从上连续性（Fₙ↓F 且 m(F₀)<∞）",
        finiteWarning: "有限阶段只显示 Fₙ；正测度来自删除级数与极限定理。"
      };
    }

    function densePoints(level) {
      var points = [
        { numerator: 0, denominator: 1, value: 0, label: "0" },
        { numerator: 1, denominator: 1, value: 1, label: "1" }
      ];
      for (var k = 1; k <= level; k += 1) {
        var denominator = Math.pow(2, k);
        for (var numerator = 1; numerator < denominator; numerator += 2) {
          points.push({
            numerator: numerator,
            denominator: denominator,
            value: numerator / denominator,
            label: String(numerator) + "/" + String(denominator)
          });
        }
      }
      return points;
    }

    function denseModel(level, epsilonDenominator) {
      var k = clampInteger(level, 0, MAX_DYADIC_LEVEL, 4);
      var epsilonDen = clampInteger(epsilonDenominator, 2, 64, 16);
      var points = densePoints(k);
      var count = points.length;
      var twoToCount = Math.pow(2, count);
      var epsilon = fraction(1, epsilonDen);
      var prefixBudget = fraction(twoToCount - 1, epsilonDen * twoToCount);
      var tailBudget = fraction(1, epsilonDen * twoToCount);
      var covers = points.map(function (point, index) {
        return {
          point: point,
          length: fraction(1, epsilonDen * Math.pow(2, index + 1))
        };
      });
      return {
        id: "dense",
        label: MODE_INFO.dense.shortLabel,
        stage: k,
        stageLabel: "K=" + k,
        points: points,
        pointCount: count,
        epsilon: epsilon,
        epsilonDenominator: epsilonDen,
        singleCoverLength: covers.length ? covers[0].length : fraction(0, 1),
        covers: covers,
        outerCoverBudget: prefixBudget,
        tailBudget: tailBudget,
        fullBudget: epsilon,
        limit: "m(D)=0，但 cl(D)=[0,1] 且 m(cl(D))=1。",
        theorem: "可数次覆盖、次可加性与 ε 任意性",
        finiteWarning: "圆点是有限前缀；细线是闭包 [0,1] 的标记，不是 D 本身。"
      };
    }

    function evaluate(mode, stage, epsilonDenominator) {
      if (mode === "fat") return fatModel(stage);
      if (mode === "dense") return denseModel(stage, epsilonDenominator);
      return standardModel(stage);
    }

    function predictionQuestions(mode) {
      var limitChoices;
      if (mode === "standard") {
        limitChoices = [
          ["zero", "剩余总长趋于 0"],
          ["positive", "剩余总长趋于正数"],
          ["unknown", "有限图无法判断"]
        ];
      } else if (mode === "fat") {
        limitChoices = [
          ["positive", "极限测度为 1/2"],
          ["zero", "极限测度为 0"],
          ["unknown", "有限图无法判断"]
        ];
      } else {
        limitChoices = [
          ["zero-dense", "D 测度 0，闭包为 [0,1]"],
          ["positive", "稠密所以测度为 1"],
          ["unknown", "有限图无法判断"]
        ];
      }
      return [
        {
          key: "finite",
          prompt: "当前有限阶段图能直接证明什么？",
          expected: "stage-only",
          choices: [
            ["stage-only", "只有当前阶段账本"],
            ["uncountable", "不可数性已经证明"],
            ["measure", "测度/不可测性已经证明"]
          ]
        },
        {
          key: "limit",
          prompt: "对当前对象的极限读法，哪项正确？",
          expected: mode === "standard" ? "zero" : mode === "fat" ? "positive" : "zero-dense",
          choices: limitChoices
        },
        {
          key: "theorem",
          prompt: "揭示结论时应把哪条理论证书写在旁边？",
          expected: MODE_INFO[mode].theoremKey,
          choices:
            mode === "standard"
              ? [
                  ["outer", "外测度预算趋于 0"],
                  ["pixels", "像素越来越碎"],
                  ["vitali", "有限图构造 Vitali 集"]
                ]
              : mode === "fat"
              ? [
                  ["continuity", "从上连续性 + 删除总长"],
                  ["outer", "任意阶段预算都趋于 0"],
                  ["pixels", "颜色更厚所以正测度"]
                ]
              : [
                  ["cover", "ε 覆盖 + 次可加性"],
                  ["dense", "稠密就有正测度"],
                  ["closure", "闭包测度代替集合测度"]
                ]
        }
      ];
    }

    function scorePredictions(mode, predictions) {
      var questions = predictionQuestions(mode);
      var correct = 0;
      questions.forEach(function (question) {
        if (predictions && predictions[question.key] === question.expected) correct += 1;
      });
      return { correct: correct, total: questions.length };
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
        else if (key.slice(0, 2) === "on" && typeof value === "function") {
          node.addEventListener(key.slice(2).toLowerCase(), value);
        } else if (value === true) node.setAttribute(key, "");
        else node.setAttribute(key, String(value));
      });
      return node;
    }

    function element(doc, tag, attrs, children) {
      return appendChildren(setAttributes(doc.createElement(tag), attrs || {}), children);
    }

    function svgElement(doc, tag, attrs, children) {
      return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attrs || {}), children);
    }

    function clear(node) {
      while (node && node.firstChild) node.removeChild(node.firstChild);
    }

    function announce(api, root, message) {
      if (api && typeof api.announce === "function") api.announce(root, message);
    }

    function installStyles(doc) {
      if (!doc || !doc.getElementById || doc.getElementById(STYLE_ID)) return;
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent = STYLE_TEXT;
      (doc.head || doc.documentElement || doc.body).appendChild(style);
    }

    function svgText(doc, x, y, text, attrs) {
      var merged = {
        x: x,
        y: y,
        "font-size": "12",
        "text-anchor": "middle",
        fill: "currentColor"
      };
      Object.keys(attrs || {}).forEach(function (key) {
        merged[key] = attrs[key];
      });
      return svgElement(doc, "text", merged, [text]);
    }

    function drawChart(doc, data) {
      var svg = svgElement(doc, "svg", {
        viewBox: "0 0 720 248",
        role: "img",
        "aria-label": data.label + "的有限阶段与极限标记图"
      });
      var left = 58;
      var right = 690;
      var width = right - left;
      var stageY = 72;
      var limitY = 160;

      [0, 0.25, 0.5, 0.75, 1].forEach(function (value) {
        var x = left + width * value;
        svg.appendChild(svgElement(doc, "line", {
          x1: x,
          y1: 42,
          x2: x,
          y2: 194,
          class: "cm-grid-line"
        }));
        svg.appendChild(svgText(doc, x, 214, value === 0 || value === 1 ? String(value) : value.toFixed(2), { "font-size": "11" }));
      });
      svg.appendChild(svgText(doc, left, 27, "有限阶段像素", { "text-anchor": "start", "font-weight": "700" }));
      svg.appendChild(svgText(doc, right, 27, data.stageLabel, { "text-anchor": "end", "font-size": "11" }));
      svg.appendChild(svgText(doc, left, 125, data.id === "dense" ? "有限前缀圆点" : "阶段区间条", { "text-anchor": "start", "font-size": "11" }));
      svg.appendChild(svgText(doc, left, 218, "0", { "text-anchor": "middle", "font-size": "11" }));
      svg.appendChild(svgText(doc, right, 218, "1", { "text-anchor": "middle", "font-size": "11" }));

      if (data.id === "dense") {
        data.points.forEach(function (point) {
          svg.appendChild(svgElement(doc, "circle", {
            cx: left + width * point.value,
            cy: stageY,
            r: "3.2",
            class: "cm-point-pixel"
          }));
        });
        svg.appendChild(svgElement(doc, "line", {
          x1: left,
          y1: limitY,
          x2: right,
          y2: limitY,
          class: "cm-closure-line"
        }));
        svg.appendChild(svgText(doc, left, limitY + 25, "闭包 [0,1]（不是 D）", { "text-anchor": "start", "font-size": "11" }));
      } else {
        data.intervals.forEach(function (interval) {
          var x = left + width * interval[0];
          var intervalWidth = Math.max(0.8, width * (interval[1] - interval[0]));
          svg.appendChild(svgElement(doc, "rect", {
            x: x,
            y: stageY - 12,
            width: intervalWidth,
            height: 24,
            rx: "1",
            class: data.id === "fat" ? "cm-stage-pixel cm-fat" : "cm-stage-pixel"
          }));
        });
        svg.appendChild(svgElement(doc, "line", {
          x1: left,
          y1: limitY,
          x2: right,
          y2: limitY,
          class: "cm-limit-marker"
        }));
        svg.appendChild(svgText(doc, left, limitY + 25, data.id === "fat" ? "F∞=∩Fₙ（理论极限标记）" : "C∞=∩Cₙ（理论极限标记）", { "text-anchor": "start", "font-size": "11" }));
      }

      svg.appendChild(svgElement(doc, "line", { x1: left, y1: 194, x2: right, y2: 194, class: "cm-axis" }));
      svg.appendChild(svgText(doc, right, 238, "[0,1] ambient", { "text-anchor": "end", "font-size": "11" }));
      return svg;
    }

    function metric(doc, label, value, tone) {
      return element(doc, "div", { className: "cm-metric " + (tone || "") }, [
        element(doc, "span", {}, [label]),
        element(doc, "strong", {}, [value])
      ]);
    }

    function ledgerRows(data) {
      if (data.id === "standard") {
        return {
          caption: "标准三分 Cantor 的精确阶段账本",
          rows: [
            ["阶段", "n", data.stageLabel, "只属于当前有限阶段"],
            ["区间数", "2ⁿ", String(data.intervalCount), "每一段继续保留左右两支"],
            ["单段长度", "1/3ⁿ", exactAndApprox(data.segmentLength), "闭区间长度"],
            ["剩余总长度", "2ⁿ/3ⁿ", exactAndApprox(data.remaining), "也是 C 的外覆盖预算"],
            ["本阶段删去", "2ⁿ⁻¹/3ⁿ", exactAndApprox(data.deletedThisStage), "n=0 时记为 0"],
            ["累计删去", "(3ⁿ−2ⁿ)/3ⁿ", exactAndApprox(data.deleted), "与剩余总长相加为 1"],
            ["外覆盖预算", "m*(C)≤2ⁿ/3ⁿ", exactAndApprox(data.outerCoverBudget), "n→∞ 给 m*(C)=0"]
          ]
        };
      }
      if (data.id === "fat") {
        return {
          caption: "fat Cantor 的精确阶段账本",
          rows: [
            ["阶段", "n", data.stageLabel, "第 n 步每个母区间删 gap=4⁻ⁿ"],
            ["区间数", "2ⁿ", String(data.intervalCount), "每个母区间分成左右两段"],
            ["单段长度", "(2ⁿ+1)/2²ⁿ⁺¹", exactAndApprox(data.segmentLength), "剩余总长除以 2ⁿ"],
            ["剩余总长度", "(2ⁿ+1)/2ⁿ⁺¹", exactAndApprox(data.remaining), "外覆盖预算趋于 1/2"],
            ["本阶段删去", "1/2ⁿ⁺¹", exactAndApprox(data.deletedThisStage), "2ⁿ⁻¹ 个 gap 的总长"],
            ["累计删去", "(2ⁿ−1)/2ⁿ⁺¹", exactAndApprox(data.deleted), "删除级数趋于 1/2"],
            ["外覆盖预算", "m*(F)≤(2ⁿ+1)/2ⁿ⁺¹", exactAndApprox(data.outerCoverBudget), "结合从上连续性得 m(F)=1/2"]
          ]
        };
      }
      return {
        caption: "二进制有理数稠密集的 ε 覆盖账本",
        rows: [
          ["层级", "K", data.stageLabel, "有限前缀的最高二进制分母层"],
          ["前缀点数", "N=2ᴷ+1", String(data.pointCount), "不等于整个可数集 D"],
          ["单点覆盖长度", "ε/2ⁱ⁺¹", exactAndApprox(data.singleCoverLength), "第一个枚举点的分配"],
          ["前缀外覆盖预算", "ε(1−2⁻ᴺ)", exactAndApprox(data.outerCoverBudget), "前 N 项几何和"],
          ["尾部预算", "ε·2⁻ᴺ", exactAndApprox(data.tailBudget), "补足整个 D 的剩余预算"],
          ["整集预算", "ε", exactAndApprox(data.fullBudget), "ε 任意，所以 m(D)=0"],
          ["闭包", "cl(D)", "[0,1]", "闭包测度为 1，不能代替 D"]
        ]
      };
    }

    function renderLedger(doc, hostNode, data) {
      var ledger = ledgerRows(data);
      var wrapper = element(doc, "div", { className: "cm-ledger" });
      var table = element(doc, "table", {});
      table.appendChild(element(doc, "caption", {}, [ledger.caption]));
      var head = element(doc, "thead");
      var headRow = element(doc, "tr");
      ["量", "精确公式", "当前值", "解释"].forEach(function (label) {
        headRow.appendChild(element(doc, "th", { scope: "col" }, [label]));
      });
      head.appendChild(headRow);
      table.appendChild(head);
      var body = element(doc, "tbody");
      ledger.rows.forEach(function (row) {
        var tr = element(doc, "tr");
        row.forEach(function (cell) { tr.appendChild(element(doc, "td", {}, [cell])); });
        body.appendChild(tr);
      });
      table.appendChild(body);
      wrapper.appendChild(table);
      hostNode.appendChild(wrapper);
    }

    function renderMetrics(doc, hostNode, data) {
      clear(hostNode);
      if (data.id === "standard") {
        hostNode.appendChild(metric(doc, "阶段区间数", String(data.intervalCount), "cm-blue"));
        hostNode.appendChild(metric(doc, "单段长度", exactAndApprox(data.segmentLength), "cm-blue"));
        hostNode.appendChild(metric(doc, "剩余总长度", exactAndApprox(data.remaining), "cm-gold"));
        hostNode.appendChild(metric(doc, "累计删去", exactAndApprox(data.deleted), "cm-red"));
        hostNode.appendChild(metric(doc, "外覆盖预算", exactAndApprox(data.outerCoverBudget), "cm-green"));
        return;
      }
      if (data.id === "fat") {
        hostNode.appendChild(metric(doc, "阶段区间数", String(data.intervalCount), "cm-blue"));
        hostNode.appendChild(metric(doc, "单段长度", exactAndApprox(data.segmentLength), "cm-blue"));
        hostNode.appendChild(metric(doc, "剩余总长度", exactAndApprox(data.remaining), "cm-gold"));
        hostNode.appendChild(metric(doc, "本阶段删去", exactAndApprox(data.deletedThisStage), "cm-red"));
        hostNode.appendChild(metric(doc, "外覆盖预算", exactAndApprox(data.outerCoverBudget), "cm-green"));
        return;
      }
      hostNode.appendChild(metric(doc, "前缀点数", String(data.pointCount), "cm-blue"));
      hostNode.appendChild(metric(doc, "单点首项覆盖", exactAndApprox(data.singleCoverLength), "cm-blue"));
      hostNode.appendChild(metric(doc, "前缀预算", exactAndApprox(data.outerCoverBudget), "cm-gold"));
      hostNode.appendChild(metric(doc, "尾部预算", exactAndApprox(data.tailBudget), "cm-red"));
      hostNode.appendChild(metric(doc, "整集预算", exactAndApprox(data.fullBudget), "cm-green"));
    }

    function mount(root, api) {
      if (!root || !root.ownerDocument) return;
      var doc = root.ownerDocument;
      installStyles(doc);
      SERIAL += 1;
      var prefix = "cm-" + SERIAL;
      var state = {
        mode: "standard",
        stage: 4,
        epsilonDenominator: 16,
        predictions: Object.create(null),
        revealed: false
      };

      var shell = element(doc, "div", { className: "cm-lab" });
      shell.appendChild(element(doc, "h3", {}, ["Cantor 三联账：先分清有限图与极限集合"]));
      shell.appendChild(element(doc, "p", { className: "cm-note" }, [
        "这是无随机数的精确模型。先选对象并完成三项预测；核对前只保留控制和问题，核对后才揭示 SVG、精确分数、外覆盖预算与定理证书。"
      ]));

      var modeGroup = element(doc, "div", { className: "cm-modes", role: "group", "aria-label": "选择测度对象" });
      var modeButtons = [];
      MODE_ORDER.forEach(function (mode) {
        var button = element(doc, "button", {
          type: "button",
          "aria-pressed": "false",
          "aria-label": MODE_INFO[mode].shortLabel
        }, [MODE_INFO[mode].label]);
        button.addEventListener("click", function () {
          state.mode = mode;
          state.predictions = Object.create(null);
          state.revealed = false;
          update();
          announce(api, root, "已切换到" + MODE_INFO[mode].shortLabel + "，预测门已重新上锁。");
        });
        modeButtons.push({ id: mode, node: button });
        modeGroup.appendChild(button);
      });
      shell.appendChild(modeGroup);

      var stageId = prefix + "-stage";
      var stageOutput = element(doc, "output", { for: stageId }, ["4"]);
      var stageLabel = element(doc, "label", { htmlFor: stageId }, ["阶段 n / 稠密层 K：", stageOutput]);
      var stageInput = element(doc, "input", {
        id: stageId,
        type: "range",
        min: "0",
        max: String(MAX_STAGE),
        step: "1",
        value: "4",
        "aria-label": "阶段或稠密层级"
      });
      var stageScale = element(doc, "div", { className: "cm-scale" }, ["0", String(MAX_STAGE)]);
      var stageControl = element(doc, "div", { className: "cm-control" }, [stageLabel, stageInput, stageScale]);

      var epsilonId = prefix + "-epsilon";
      var epsilonSelect = element(doc, "select", { id: epsilonId, "aria-label": "外覆盖 epsilon" });
      [4, 8, 16, 32, 64].forEach(function (denominator) {
        epsilonSelect.appendChild(element(doc, "option", { value: String(denominator) }, ["ε=1/" + String(denominator)]));
      });
      epsilonSelect.value = String(state.epsilonDenominator);
      var epsilonControl = element(doc, "div", { className: "cm-control" }, [
        element(doc, "label", { htmlFor: epsilonId }, ["稠密集覆盖预算 ε"]),
        epsilonSelect,
        element(doc, "div", { className: "cm-scale" }, ["精确几何级数", "ε>0"])
      ]);
      epsilonControl.hidden = true;
      shell.appendChild(element(doc, "div", { className: "cm-controls" }, [stageControl, epsilonControl]));

      var gate = element(doc, "section", { className: "cm-gate", "aria-labelledby": prefix + "-gate-title" });
      gate.appendChild(element(doc, "strong", { id: prefix + "-gate-title", className: "cm-gate-title" }, ["预测门：先写下有限阶段的边界"]));
      var form = element(doc, "form", {});
      var questionList = element(doc, "div", { className: "cm-question-list" });
      form.appendChild(questionList);
      var feedback = element(doc, "p", { className: "cm-feedback", role: "status", "aria-live": "polite" }, ["请完成三项预测。"]);
      var submit = element(doc, "button", { type: "submit", className: "cm-primary" }, ["核对预测并揭示"]);
      var reset = element(doc, "button", { type: "button" }, ["清空预测"]);
      form.appendChild(element(doc, "div", { className: "cm-actions" }, [submit, reset]));
      form.appendChild(feedback);
      gate.appendChild(form);
      shell.appendChild(gate);

      var results = element(doc, "section", { className: "cm-results", hidden: true, "aria-label": "测度实验结果" });
      var resultTitle = element(doc, "h4", {}, ["结果与定理证书"]);
      var chartFrame = element(doc, "div", { className: "cm-chart-frame" });
      var legend = element(doc, "div", { className: "cm-legend", "aria-label": "图例" }, [
        element(doc, "span", {}, [element(doc, "i", { className: "cm-swatch cm-stage-swatch", "aria-hidden": "true" }), "实心：有限阶段像素"]),
        element(doc, "span", {}, [element(doc, "i", { className: "cm-swatch cm-limit-swatch", "aria-hidden": "true" }), "虚线：极限对象标记"]),
        element(doc, "span", {}, [element(doc, "i", { className: "cm-swatch cm-point-swatch", "aria-hidden": "true" }), "圆点：有限点前缀"]),
        element(doc, "span", {}, [element(doc, "i", { className: "cm-swatch cm-closure-swatch", "aria-hidden": "true" }), "细线：闭包标记"])
      ]);
      var chartNote = element(doc, "p", { className: "cm-note" }, ["虚线/细线是理论对象的可视标记，不是有限采样对极限集合的证明。"]);
      var metrics = element(doc, "div", { className: "cm-metrics", "aria-label": "精确指标" });
      var formula = element(doc, "div", { className: "cm-formula" });
      var ledgerHost = element(doc, "div");
      var interpretation = element(doc, "p", { className: "cm-interpretation", role: "status", "aria-live": "polite" });
      var relock = element(doc, "button", { type: "button" }, ["重新预测"]);
      relock.addEventListener("click", function () {
        state.predictions = Object.create(null);
        state.revealed = false;
        update();
        announce(api, root, "预测门已重新上锁。");
      });
      results.appendChild(resultTitle);
      results.appendChild(chartFrame);
      results.appendChild(legend);
      results.appendChild(chartNote);
      results.appendChild(metrics);
      results.appendChild(formula);
      results.appendChild(ledgerHost);
      results.appendChild(interpretation);
      results.appendChild(element(doc, "div", { className: "cm-actions" }, [relock]));
      shell.appendChild(results);
      clear(root);
      root.appendChild(shell);

      var choiceButtons = [];

      function selectedCount() {
        return predictionQuestions(state.mode).filter(function (question) {
          return Boolean(state.predictions[question.key]);
        }).length;
      }

      function renderQuestionChoices() {
        clear(questionList);
        choiceButtons = [];
        predictionQuestions(state.mode).forEach(function (question, index) {
          var questionSet = element(doc, "fieldset", { className: "cm-question" });
          questionSet.appendChild(element(doc, "legend", {}, [(index + 1) + ". " + question.prompt]));
          var row = element(doc, "div", { className: "cm-choice-row", role: "group", "aria-label": question.prompt });
          question.choices.forEach(function (choice) {
            var button = element(doc, "button", { type: "button", "aria-pressed": "false" }, [choice[1]]);
            button.addEventListener("click", function () {
              state.predictions[question.key] = choice[0];
              updateChoiceButtons();
              feedback.textContent = "已记录 " + selectedCount() + "/" + predictionQuestions(state.mode).length + " 项预测。";
              feedback.className = "cm-feedback";
            });
            choiceButtons.push({ key: question.key, value: choice[0], node: button });
            row.appendChild(button);
          });
          questionSet.appendChild(row);
          questionList.appendChild(questionSet);
        });
        updateChoiceButtons();
      }

      function updateChoiceButtons() {
        choiceButtons.forEach(function (item) {
          item.node.setAttribute("aria-pressed", state.predictions[item.key] === item.value ? "true" : "false");
        });
      }

      function renderResults(data) {
        clear(chartFrame);
        chartFrame.appendChild(drawChart(doc, data));
        renderMetrics(doc, metrics, data);
        clear(ledgerHost);
        renderLedger(doc, ledgerHost, data);
        if (data.id === "standard") {
          formula.textContent = "C⊂Cₙ，m*(C)≤2ⁿ/3ⁿ=(2/3)ⁿ→0；有限阶段像素不证明不可数性。";
        } else if (data.id === "fat") {
          formula.textContent = "Fₙ↓F，m(Fₙ)=(2ⁿ+1)/2ⁿ⁺¹→1/2；每步删除 4⁻ⁿ，累计删除 →1/2。";
        } else {
          formula.textContent = "Σᵢ ε/2ⁱ⁺¹=ε；m(D)=0，而 cl(D)=[0,1]，所以稠密不等于正测度。";
        }
        interpretation.textContent = data.limit + " 证书：" + data.theorem + "。" + data.finiteWarning;
      }

      function update() {
        var max = state.mode === "dense" ? MAX_DYADIC_LEVEL : MAX_STAGE;
        if (state.stage > max) state.stage = max;
        stageInput.max = String(max);
        stageInput.value = String(state.stage);
        stageOutput.textContent = String(state.stage);
        stageScale.lastChild.textContent = String(max);
        epsilonControl.hidden = state.mode !== "dense";
        modeButtons.forEach(function (item) {
          item.node.setAttribute("aria-pressed", item.id === state.mode ? "true" : "false");
        });
        renderQuestionChoices();
        results.hidden = !state.revealed;
        if (state.revealed) renderResults(evaluate(state.mode, state.stage, state.epsilonDenominator));
      }

      stageInput.addEventListener("input", function () {
        state.stage = clampInteger(stageInput.value, 0, state.mode === "dense" ? MAX_DYADIC_LEVEL : MAX_STAGE, 4);
        state.predictions = Object.create(null);
        state.revealed = false;
        feedback.textContent = "阶段已改变，请重新完成预测。";
        feedback.className = "cm-feedback";
        update();
      });
      epsilonSelect.addEventListener("change", function () {
        state.epsilonDenominator = clampInteger(epsilonSelect.value, 2, 64, 16);
        state.predictions = Object.create(null);
        state.revealed = false;
        feedback.textContent = "ε 已改变，请重新完成预测。";
        feedback.className = "cm-feedback";
        update();
      });
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var questions = predictionQuestions(state.mode);
        var missing = questions.filter(function (question) { return !state.predictions[question.key]; });
        if (missing.length) {
          feedback.textContent = "还差 " + missing.length + " 项预测。";
          feedback.className = "cm-feedback cm-warn";
          return;
        }
        var score = scorePredictions(state.mode, state.predictions);
        state.revealed = true;
        results.hidden = false;
        renderResults(evaluate(state.mode, state.stage, state.epsilonDenominator));
        feedback.textContent = "已揭示：" + score.correct + "/" + score.total + " 项预测与精确账本一致。";
        feedback.className = "cm-feedback " + (score.correct === score.total ? "cm-pass" : "cm-warn");
        announce(api, root, feedback.textContent);
      });
      reset.addEventListener("click", function () {
        state.predictions = Object.create(null);
        state.revealed = false;
        feedback.textContent = "预测已清空。";
        feedback.className = "cm-feedback";
        update();
      });
      update();
    }

    function sameFraction(left, right) {
      return left.n * right.d === right.n * left.d;
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) {
        checks += 1;
        if (!condition) throw new Error(message);
      }

      for (var stage = 0; stage <= MAX_STAGE; stage += 1) {
        var standard = standardModel(stage);
        check(standard.intervalCount === Math.pow(2, stage), "standard interval count");
        check(standard.intervals.length === standard.intervalCount, "standard interval pixels");
        check(standard.segmentLength.n * standard.segmentLength.d > 0, "standard segment length");
        check(sameFraction(standard.remaining, fraction(Math.pow(2, stage), Math.pow(3, stage))), "standard remaining formula");
        check(sameFraction(standard.remaining, fraction(1, 1)) || standard.remaining.n < standard.remaining.d, "standard remaining bound");
        check(Math.abs(fractionApprox(standard.remaining) + fractionApprox(standard.deleted) - 1) < 1e-12, "standard partition");
      }

      for (var fatStage = 0; fatStage <= MAX_STAGE; fatStage += 1) {
        var fat = fatModel(fatStage);
        check(fat.intervalCount === Math.pow(2, fatStage), "fat interval count");
        check(fat.intervals.length === fat.intervalCount, "fat interval pixels");
        check(Math.abs(fractionApprox(fat.remaining) + fractionApprox(fat.deleted) - 1) < 1e-12, "fat partition");
        check(sameFraction(fat.remaining, fraction(Math.pow(2, fatStage) + 1, Math.pow(2, fatStage + 1))), "fat remaining formula");
        check(fatStage === 0 || sameFraction(fat.deletedThisStage, fraction(1, Math.pow(2, fatStage + 1))), "fat deletion step");
      }

      for (var level = 0; level <= MAX_DYADIC_LEVEL; level += 1) {
        var dense = denseModel(level, 16);
        check(dense.pointCount === Math.pow(2, level) + 1, "dense point count");
        check(dense.points.length === dense.pointCount, "dense point list");
        var values = dense.points.map(function (point) { return point.value; });
        check(new Set(values).size === values.length, "dense points are deduplicated");
        check(Math.abs(fractionApprox(dense.outerCoverBudget) + fractionApprox(dense.tailBudget) - fractionApprox(dense.fullBudget)) < 1e-12, "dense cover budget");
        check(dense.points.every(function (point) { return point.value >= 0 && point.value <= 1; }), "dense points in unit interval");
      }

      check(scorePredictions("standard", { finite: "stage-only", limit: "zero", theorem: "outer" }).correct === 3, "standard prediction key");
      check(scorePredictions("fat", { finite: "stage-only", limit: "positive", theorem: "continuity" }).correct === 3, "fat prediction key");
      check(scorePredictions("dense", { finite: "stage-only", limit: "zero-dense", theorem: "cover" }).correct === 3, "dense prediction key");
      check(Math.abs(fractionApprox(fatModel(MAX_STAGE).remaining) - 0.5) < 0.02, "fat stages approach one half");
      check(fractionApprox(standardModel(MAX_STAGE).remaining) < 0.1, "standard stages approach zero");

      return {
        checks: checks,
        standardStages: MAX_STAGE + 1,
        fatStages: MAX_STAGE + 1,
        denseLevels: MAX_DYADIC_LEVEL + 1
      };
    }

    return {
      MODE_INFO: MODE_INFO,
      standardModel: standardModel,
      fatModel: fatModel,
      denseModel: denseModel,
      evaluate: evaluate,
      predictionQuestions: predictionQuestions,
      scorePredictions: scorePredictions,
      selfTest: selfTest,
      mount: mount
    };
  }
);
