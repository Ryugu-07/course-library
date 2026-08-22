(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("polynomial-roots", exported.mount);
  }
  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log("polynomial-roots self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("polynomial-roots self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(
  typeof window !== "undefined"
    ? window
    : typeof globalThis !== "undefined"
      ? globalThis
      : null,
  function (host) {
    "use strict";

    var STYLE_ID = "cl-polynomial-roots-styles";
    var EPS = 1e-10;
    var DEFAULTS = { center: 1, anchor: -2, gap: 0 };
    var PRESETS = [
      { id: "multiple", label: "重根起点", center: 1, anchor: -2, gap: 0 },
      { id: "split", label: "近重根分裂", center: 1, anchor: -2, gap: 0.25 },
      { id: "shifted", label: "换中心", center: 1.35, anchor: -1.4, gap: 0.45 }
    ];
    var QUESTIONS = [
      {
        id: "touch",
        prompt: "当 gap=0 时，中心根的图像行为是什么？",
        options: [
          { id: "touch", label: "二重根，通常相切" },
          { id: "cross", label: "单根，必穿过" },
          { id: "none", label: "没有中心根" }
        ],
        answer: "touch"
      },
      {
        id: "split",
        prompt: "从 gap=0 增到 g>0，中心附近会发生什么？",
        options: [
          { id: "two", label: "分成 c-g 与 c+g 两个单根" },
          { id: "one", label: "仍是一个二重根" },
          { id: "vanish", label: "两个根都消失" }
        ],
        answer: "two"
      },
      {
        id: "coefficient",
        prompt: "在这个族中，系数 a1 相对 gap=0 的变化量是什么？",
        options: [
          { id: "square", label: "-g²，二次尺度" },
          { id: "linear", label: "-g，一次尺度" },
          { id: "zero", label: "恒为 0" }
        ],
        answer: "square"
      },
      {
        id: "finite",
        prompt: "有限窗口里的数值图全都对，能否单独证明代数基本定理？",
        options: [
          { id: "no", label: "不能，只是有限证据" },
          { id: "yes", label: "可以，图像已经穷尽" },
          { id: "real", label: "只能证明实根存在" }
        ],
        answer: "no"
      }
    ];

    var STYLE_TEXT = [
      '[data-learning-lab="polynomial-roots"]{--pr-accent:#2563eb;--pr-good:#15803d;--pr-warn:#b45309;display:block;max-width:100%;min-width:0;color:var(--fg,inherit);line-height:1.55;overflow-wrap:anywhere}',
      '[data-learning-lab="polynomial-roots"] [hidden]{display:none!important}',
      '[data-learning-lab="polynomial-roots"] .pr-note,[data-learning-lab="polynomial-roots"] .pr-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
      '[data-learning-lab="polynomial-roots"] .pr-presets,[data-learning-lab="polynomial-roots"] .pr-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}',
      '[data-learning-lab="polynomial-roots"] button,[data-learning-lab="polynomial-roots"] input,[data-learning-lab="polynomial-roots"] select{min-height:44px;font:inherit}',
      '[data-learning-lab="polynomial-roots"] button{min-width:0;padding:8px 12px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:inherit;cursor:pointer;overflow-wrap:anywhere}',
      '[data-learning-lab="polynomial-roots"] button:hover,[data-learning-lab="polynomial-roots"] button[aria-pressed="true"]{border-color:var(--pr-accent);background:var(--pr-accent);color:#fff}',
      '[data-learning-lab="polynomial-roots"] button:focus-visible{outline:3px solid #60a5fa;outline-offset:2px}',
      '[data-learning-lab="polynomial-roots"] .pr-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:14px 0}',
      '[data-learning-lab="polynomial-roots"] .pr-control{display:grid;gap:5px;min-width:0}',
      '[data-learning-lab="polynomial-roots"] .pr-control label{font-weight:700}',
      '[data-learning-lab="polynomial-roots"] input[type="range"]{width:100%;accent-color:var(--pr-accent)}',
      '[data-learning-lab="polynomial-roots"] .pr-question{margin:12px 0;padding:10px 12px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent)}',
      '[data-learning-lab="polynomial-roots"] .pr-question legend{padding:0 4px;font-size:13px;color:var(--fg-soft,currentColor);line-height:1.5}',
      '[data-learning-lab="polynomial-roots"] .pr-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}',
      '[data-learning-lab="polynomial-roots"] .pr-primary{background:var(--pr-accent);border-color:var(--pr-accent);color:#fff;font-weight:750}',
      '[data-learning-lab="polynomial-roots"] .pr-feedback{min-height:2em;margin:8px 0;font-weight:700}',
      '[data-learning-lab="polynomial-roots"] .pr-good{color:var(--pr-good)}[data-learning-lab="polynomial-roots"] .pr-warn{color:var(--pr-warn)}',
      '[data-learning-lab="polynomial-roots"] .pr-grid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(250px,.75fr);gap:16px;align-items:start;margin-top:16px}',
      '[data-learning-lab="polynomial-roots"] .pr-chart{min-width:0;padding:6px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent)}',
      '[data-learning-lab="polynomial-roots"] svg{display:block;width:100%;height:auto}',
      '[data-learning-lab="polynomial-roots"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
      '[data-learning-lab="polynomial-roots"] .pr-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.75}[data-learning-lab="polynomial-roots"] .pr-gridline{stroke:var(--border,#cbd5e1);stroke-width:1;stroke-dasharray:4 4}[data-learning-lab="polynomial-roots"] .pr-curve{fill:none;stroke:var(--pr-accent);stroke-width:3}[data-learning-lab="polynomial-roots"] .pr-simple{fill:#2563eb;stroke:var(--bg,#fff);stroke-width:2}[data-learning-lab="polynomial-roots"] .pr-multiple{fill:#d97706;stroke:var(--bg,#fff);stroke-width:2}[data-learning-lab="polynomial-roots"] .pr-title{font-size:13px;font-weight:750}[data-learning-lab="polynomial-roots"] .pr-label{font-size:11px}',
      '[data-learning-lab="polynomial-roots"] .pr-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:12px}',
      '[data-learning-lab="polynomial-roots"] .pr-metric{min-width:0;padding:9px;border-top:3px solid var(--pr-accent);background:var(--bg,transparent)}',
      '[data-learning-lab="polynomial-roots"] .pr-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="polynomial-roots"] .pr-metric strong{display:block;margin-top:3px;overflow-wrap:anywhere}',
      '[data-learning-lab="polynomial-roots"] .pr-table-wrap{max-width:100%;overflow-x:auto}',
      '[data-learning-lab="polynomial-roots"] table{width:100%;min-width:460px;border-collapse:collapse;font-size:12px}',
      '[data-learning-lab="polynomial-roots"] th,[data-learning-lab="polynomial-roots"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top}',
      '[data-learning-lab="polynomial-roots"] th{color:var(--fg-soft,currentColor);font-size:11px}',
      '[data-learning-lab="polynomial-roots"] .pr-boundary{margin:12px 0;padding:10px 12px;border-left:3px solid var(--pr-warn);background:var(--bg,transparent);font-size:13px;line-height:1.7}',
      '@media(max-width:760px){[data-learning-lab="polynomial-roots"] .pr-controls,[data-learning-lab="polynomial-roots"] .pr-grid{grid-template-columns:minmax(0,1fr)}[data-learning-lab="polynomial-roots"] .pr-options{grid-template-columns:minmax(0,1fr)}}',
      '@media(prefers-reduced-motion:reduce){[data-learning-lab="polynomial-roots"] *{scroll-behavior:auto!important;transition:none!important}}'
    ].join("");

    function assert(condition, message) {
      if (!condition) throw new Error(message);
    }

    function near(left, right, tolerance) {
      return Math.abs(left - right) <= (tolerance || 1e-9);
    }

    function clamp(value, low, high) {
      return Math.max(low, Math.min(high, value));
    }

    function finiteParameter(value, label) {
      var number = Number(value);
      if (!Number.isFinite(number)) throw new RangeError(label + " must be finite");
      return number;
    }

    function normalize(params) {
      if (!params) throw new TypeError("polynomial parameters are required");
      return {
        center: clamp(finiteParameter(params.center, "center"), 0.5, 1.5),
        anchor: clamp(finiteParameter(params.anchor, "anchor"), -3, -1),
        gap: clamp(finiteParameter(params.gap, "gap"), 0, 0.8)
      };
    }

    function coefficients(center, anchor, gap) {
      var c = Number(center);
      var d = Number(anchor);
      var g = Number(gap);
      return {
        a3: 1,
        a2: -(d + 2 * c),
        a1: 2 * c * d + c * c - g * g,
        a0: -d * (c * c - g * g)
      };
    }

    function polynomialValue(x, coeffs) {
      return ((coeffs.a3 * x + coeffs.a2) * x + coeffs.a1) * x + coeffs.a0;
    }

    function multiplicityFor(rootValue, params) {
      var c = params.center;
      var d = params.anchor;
      var g = params.gap;
      if (g === 0 && near(rootValue, c, 1e-8)) return near(c, d, 1e-8) ? 3 : 2;
      return 1;
    }

    function evaluate(input) {
      var params = normalize(input);
      var coeffs = coefficients(params.center, params.anchor, params.gap);
      var baseline = coefficients(params.center, params.anchor, 0);
      var roots = [params.center - params.gap, params.center + params.gap, params.anchor].sort(function (a, b) { return a - b; });
      var rootRows = [];
      roots.forEach(function (rootValue) {
        if (rootRows.length && rootRows[rootRows.length - 1].value === rootValue) return;
        var multiplicity = multiplicityFor(rootValue, params);
        rootRows.push({
          value: rootValue,
          multiplicity: multiplicity,
          crosses: multiplicity % 2 === 1
        });
      });
      return {
        params: params,
        coefficients: coeffs,
        roots: rootRows,
        coefficientShift: coeffs.a1 - baseline.a1,
        rootShift: params.gap,
        separation: 2 * params.gap,
        baseline: baseline
      };
    }

    function format(value, digits) {
      var places = digits === undefined ? 3 : digits;
      if (Math.abs(value) < Math.pow(10, -places) / 2) value = 0;
      var text = Number(value).toFixed(places);
      return text.replace(/0+$/, "").replace(/\.$/, "") || "0";
    }

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function installStyles(doc) {
      if (!doc || doc.getElementById(STYLE_ID)) return;
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent = STYLE_TEXT;
      doc.head.appendChild(style);
    }

    function svgFor(data) {
      var roots = data.roots.map(function (row) { return row.value; });
      var low = Math.min.apply(null, roots) - 1.1;
      var high = Math.max.apply(null, roots) + 1.1;
      var samples = [];
      var maximum = 0;
      for (var i = 0; i <= 240; i += 1) {
        var x = low + (high - low) * i / 240;
        var value = polynomialValue(x, data.coefficients);
        samples.push({ x: x, value: value });
        maximum = Math.max(maximum, Math.abs(value));
      }
      maximum = Math.max(maximum, 0.5);
      function mapX(x) { return 46 + 528 * (x - low) / (high - low); }
      function mapY(y) { return 158 - 112 * y / maximum; }
      var path = samples.map(function (point, index) {
        return (index ? "L" : "M") + format(mapX(point.x), 2) + " " + format(mapY(point.value), 2);
      }).join(" ");
      var zeroY = mapY(0);
      var vertical = low <= 0 && high >= 0
        ? '<line x1="' + format(mapX(0), 2) + '" y1="36" x2="' + format(mapX(0), 2) + '" y2="280" class="pr-gridline"/>'
        : "";
      var circles = data.roots.map(function (row) {
        return '<circle cx="' + format(mapX(row.value), 2) + '" cy="' + format(zeroY, 2) + '" r="5" class="' + (row.multiplicity > 1 ? "pr-multiple" : "pr-simple") + '"/>';
      }).join("");
      return '<svg viewBox="0 0 620 320" role="img" aria-label="多项式曲线与根的有限窗口图">' +
        '<line x1="46" y1="158" x2="574" y2="158" class="pr-axis"/><line x1="46" y1="36" x2="46" y2="280" class="pr-axis"/>' +
        '<line x1="46" y1="46" x2="574" y2="46" class="pr-gridline"/><line x1="46" y1="270" x2="574" y2="270" class="pr-gridline"/>' +
        vertical + '<path d="' + path + '" class="pr-curve"/>' + circles +
        '<text x="52" y="26" class="pr-title">p(x) 在有限窗口中的形状</text>' +
        '<text x="50" y="302">x=' + format(low, 2) + '</text><text x="520" y="302">x=' + format(high, 2) + '</text>' +
        '<text x="438" y="48" class="pr-label">蓝=单根，金=重根</text></svg>';
    }

    function resultHtml(data, predictionCorrect) {
      var coeff = data.coefficients;
      var rootRows = data.roots.map(function (row) {
        return '<tr><td>' + format(row.value, 4) + '</td><td>' + row.multiplicity + '</td><td>' +
          (row.crosses ? "穿过" : "相切或接触") + '</td></tr>';
      }).join("");
      var answerText = predictionCorrect ? "预测命中：把根、重数和系数变化分开读。" : "预测已核对：请把重数与数值敏感性分开读。";
      return '<div class="pr-grid"><div class="pr-chart">' + svgFor(data) + '</div><div>' +
        '<div class="pr-metrics"><div class="pr-metric"><span>a2</span><strong>' + format(coeff.a2) + '</strong></div>' +
        '<div class="pr-metric"><span>a1</span><strong>' + format(coeff.a1) + '</strong></div>' +
        '<div class="pr-metric"><span>a0</span><strong>' + format(coeff.a0) + '</strong></div>' +
        '<div class="pr-metric"><span>根间距 2g</span><strong>' + format(data.separation) + '</strong></div></div>' +
        '<div class="pr-table-wrap"><table><caption>根账本</caption><thead><tr><th>根 x</th><th>重数</th><th>局部图形</th></tr></thead><tbody>' + rootRows + '</tbody></table></div>' +
        '<p class="pr-boundary">' + escapeHtml(answerText) + ' 当前 a1 相对重根基准的变化为 ' + format(data.coefficientShift, 5) + '，根的中心位移尺度为 ' + format(data.rootShift, 4) + '。</p>' +
        '</div></div>';
    }

    function mount(rootElement, api) {
      if (!rootElement || !rootElement.ownerDocument) return;
      var doc = rootElement.ownerDocument;
      installStyles(doc);
      var state = { center: DEFAULTS.center, anchor: DEFAULTS.anchor, gap: DEFAULTS.gap, revealed: false };
      var predictions = {};
      rootElement.innerHTML =
        '<div class="pr-lab">' +
        '<p class="pr-note">先调参数并写下预测。结果面板会保持隐藏，直到四个判断都已回答；曲线只是在有限窗口内采样。</p>' +
        '<div class="pr-presets" data-role="presets"></div>' +
        '<div class="pr-controls">' +
        '<div class="pr-control"><label for="pr-center">中心 c = <output data-role="center-output">1</output></label><input id="pr-center" data-role="center" type="range" min="0.5" max="1.5" step="0.05" value="1" aria-label="中心 c"></div>' +
        '<div class="pr-control"><label for="pr-anchor">另一根 d = <output data-role="anchor-output">-2</output></label><input id="pr-anchor" data-role="anchor" type="range" min="-3" max="-1" step="0.05" value="-2" aria-label="另一根 d"></div>' +
        '<div class="pr-control"><label for="pr-gap">分裂尺度 g = <output data-role="gap-output">0</output></label><input id="pr-gap" data-role="gap" type="range" min="0" max="0.8" step="0.05" value="0" aria-label="近重根分裂尺度 g"></div>' +
        '</div>' +
        '<div class="pr-questions" data-role="questions"></div>' +
        '<div class="pr-actions"><button type="button" class="pr-primary" data-role="reveal">核对预测并揭示</button><button type="button" data-role="reset">重置</button></div>' +
        '<p class="pr-feedback" data-role="feedback" aria-live="polite">四题都选完后，结果才会出现。</p>' +
        '<div class="pr-result" data-role="result" hidden aria-live="polite"></div>' +
        '</div>';

      var refs = {
        center: rootElement.querySelector('[data-role="center"]'),
        anchor: rootElement.querySelector('[data-role="anchor"]'),
        gap: rootElement.querySelector('[data-role="gap"]'),
        result: rootElement.querySelector('[data-role="result"]'),
        feedback: rootElement.querySelector('[data-role="feedback"]')
      };
      var choices = {};
      var questionHost = rootElement.querySelector('[data-role="questions"]');
      QUESTIONS.forEach(function (question) {
        var fieldset = doc.createElement("fieldset");
        fieldset.className = "pr-question";
        fieldset.innerHTML = '<legend>' + question.prompt + '</legend><div class="pr-options"></div>';
        var optionHost = fieldset.querySelector(".pr-options");
        choices[question.id] = [];
        question.options.forEach(function (option) {
          var button = doc.createElement("button");
          button.type = "button";
          button.textContent = option.label;
          button.setAttribute("aria-pressed", "false");
          button.addEventListener("click", function () {
            predictions[question.id] = option.id;
            renderPrediction();
            refs.feedback.textContent = "预测已记录；结果仍隐藏。";
            refs.feedback.className = "pr-feedback";
          });
          choices[question.id].push({ id: option.id, node: button });
          optionHost.appendChild(button);
        });
        questionHost.appendChild(fieldset);
      });

      PRESETS.forEach(function (preset) {
        var button = doc.createElement("button");
        button.type = "button";
        button.textContent = preset.label;
        button.addEventListener("click", function () {
          state.center = preset.center;
          state.anchor = preset.anchor;
          state.gap = preset.gap;
          refs.center.value = String(state.center);
          refs.anchor.value = String(state.anchor);
          refs.gap.value = String(state.gap);
          predictions = {};
          state.revealed = false;
          render();
        });
        rootElement.querySelector('[data-role="presets"]').appendChild(button);
      });

      function announce(message) {
        if (api && typeof api.announce === "function") api.announce(rootElement, message);
      }

      function renderPrediction() {
        QUESTIONS.forEach(function (question) {
          choices[question.id].forEach(function (choice) {
            choice.node.setAttribute("aria-pressed", predictions[question.id] === choice.id ? "true" : "false");
          });
        });
      }

      function render() {
        refs.center.value = String(state.center);
        refs.anchor.value = String(state.anchor);
        refs.gap.value = String(state.gap);
        rootElement.querySelector('[data-role="center-output"]').textContent = format(state.center, 2);
        rootElement.querySelector('[data-role="anchor-output"]').textContent = format(state.anchor, 2);
        rootElement.querySelector('[data-role="gap-output"]').textContent = format(state.gap, 2);
        renderPrediction();
        refs.result.hidden = !state.revealed;
        if (state.revealed) {
          var data = evaluate(state);
          var correct = QUESTIONS.every(function (question) { return predictions[question.id] === question.answer; });
          refs.result.innerHTML = resultHtml(data, correct);
        } else {
          refs.result.innerHTML = "";
        }
      }

      function parameterChanged() {
        state.center = Number(refs.center.value);
        state.anchor = Number(refs.anchor.value);
        state.gap = Number(refs.gap.value);
        predictions = {};
        state.revealed = false;
        refs.feedback.textContent = "参数已改变，请重新预测；结果再次隐藏。";
        refs.feedback.className = "pr-feedback";
        render();
      }

      [refs.center, refs.anchor, refs.gap].forEach(function (input) {
        input.addEventListener("input", parameterChanged);
        input.addEventListener("change", parameterChanged);
      });
      rootElement.querySelector('[data-role="reveal"]').addEventListener("click", function () {
        var missing = QUESTIONS.filter(function (question) { return !predictions[question.id]; });
        if (missing.length) {
          refs.feedback.textContent = "请先完成全部四个预测；答案仍未揭晓。";
          refs.feedback.className = "pr-feedback pr-warn";
          announce(refs.feedback.textContent);
          return;
        }
        state.revealed = true;
        var correct = QUESTIONS.every(function (question) { return predictions[question.id] === question.answer; });
        refs.feedback.textContent = correct ? "预测命中；现在回到因式、重数和系数账本。" : "预测已核对；请把有限图形与定理量词分开。";
        refs.feedback.className = "pr-feedback " + (correct ? "pr-good" : "pr-warn");
        render();
        announce("预测答案已揭晓，多项式根账本已显示。");
      });
      rootElement.querySelector('[data-role="reset"]').addEventListener("click", function () {
        state.center = DEFAULTS.center;
        state.anchor = DEFAULTS.anchor;
        state.gap = DEFAULTS.gap;
        state.revealed = false;
        predictions = {};
        refs.feedback.textContent = "四题都选完后，结果才会出现。";
        refs.feedback.className = "pr-feedback";
        render();
        announce("多项式根实验已重置，结果再次隐藏。");
      });
      render();
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) {
        checks += 1;
        assert(condition, message);
      }
      var multiple = evaluate(DEFAULTS);
      check(multiple.roots.length === 2, "two distinct roots with multiplicity entries");
      check(multiple.roots.filter(function (row) { return row.multiplicity === 2; }).length === 1, "double root recorded");
      check(multiple.roots.filter(function (row) { return row.multiplicity === 1; }).length === 1, "simple anchor root recorded");
      check(near(polynomialValue(1, multiple.coefficients), 0), "double root evaluates to zero");
      var split = evaluate({ center: 1, anchor: -2, gap: 0.2 });
      check(split.roots.filter(function (row) { return row.multiplicity === 1; }).length === 3, "split roots are simple");
      check(near(split.separation, 0.4), "split separation");
      check(near(split.coefficientShift, -0.04), "coefficient shift is quadratic");
      split.roots.forEach(function (row) { check(Math.abs(polynomialValue(row.value, split.coefficients)) < 1e-9, "factored root evaluates to zero"); });
      check(near(split.coefficients.a2, multiple.coefficients.a2), "gap preserves sum coefficient");
      check(near(split.coefficients.a0, -(-2) * (1 - 0.04)), "constant coefficient follows product");
      check(PRESETS.length === 3, "three root presets");
      check(QUESTIONS.length === 4, "four prediction questions");
      check(evaluate({ center: 1, anchor: -2, gap: 1e-11 }).roots.length === 3, "tiny positive gap keeps distinct simple roots");
      var invalid = false;
      try { evaluate({ center: NaN, anchor: -2, gap: 0 }); } catch (error) { invalid = error instanceof RangeError; }
      check(invalid, "nonfinite parameters rejected");
      return { checks: checks };
    }

    return {
      DEFAULTS: DEFAULTS,
      PRESETS: PRESETS,
      QUESTIONS: QUESTIONS,
      coefficients: coefficients,
      polynomialValue: polynomialValue,
      evaluate: evaluate,
      mount: mount,
      selfTest: selfTest
    };
  }
);
