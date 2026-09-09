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
          { id: "touch", label: "恰好二重根，接触而不穿过" },
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
      '[data-learning-lab="polynomial-roots"] .pr-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;align-items:start;margin-top:16px}',
      '[data-learning-lab="polynomial-roots"] .pr-chart{min-width:0;max-width:100%;overflow-x:auto;padding:6px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent)}',
      '[data-learning-lab="polynomial-roots"] svg{display:block;width:100%;min-width:720px;height:auto}',
      '[data-learning-lab="polynomial-roots"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
      '[data-learning-lab="polynomial-roots"] .pr-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.75}[data-learning-lab="polynomial-roots"] .pr-gridline{stroke:var(--border,#cbd5e1);stroke-width:1;stroke-dasharray:4 4}[data-learning-lab="polynomial-roots"] .pr-curve{fill:none;stroke:var(--pr-accent);stroke-width:3}[data-learning-lab="polynomial-roots"] .pr-simple{fill:var(--pr-accent);stroke:var(--bg,#fff);stroke-width:2}[data-learning-lab="polynomial-roots"] .pr-multiple{fill:#d97706;stroke:var(--bg,#fff);stroke-width:2}[data-learning-lab="polynomial-roots"] .pr-title{font-size:13px;font-weight:750}[data-learning-lab="polynomial-roots"] .pr-label{font-size:11px}',
      '[data-learning-lab="polynomial-roots"] .pr-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:12px}',
      '[data-learning-lab="polynomial-roots"] .pr-metric{min-width:0;padding:9px;border-top:3px solid var(--pr-accent);background:var(--bg,transparent)}',
      '[data-learning-lab="polynomial-roots"] .pr-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="polynomial-roots"] .pr-metric strong{display:block;margin-top:3px;overflow-wrap:anywhere}',
      '[data-learning-lab="polynomial-roots"] .pr-table-wrap{max-width:100%;overflow-x:auto}',
      '[data-learning-lab="polynomial-roots"] table{width:100%;min-width:460px;border-collapse:collapse;font-size:12px}',
      '[data-learning-lab="polynomial-roots"] th,[data-learning-lab="polynomial-roots"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top}',
      '[data-learning-lab="polynomial-roots"] th{color:var(--fg-soft,currentColor);font-size:11px}',
      '[data-learning-lab="polynomial-roots"] .pr-boundary{margin:12px 0;padding:10px 12px;border-left:3px solid var(--pr-warn);background:var(--bg,transparent);font-size:13px;line-height:1.7}',
      '@media(max-width:760px){[data-learning-lab="polynomial-roots"] .pr-controls,[data-learning-lab="polynomial-roots"] .pr-grid{grid-template-columns:minmax(0,1fr)}[data-learning-lab="polynomial-roots"] .pr-options{grid-template-columns:minmax(0,1fr)}}',
      '[data-theme="dark"] [data-learning-lab="polynomial-roots"]{--pr-accent:#60a5fa;--pr-good:#4ade80;--pr-warn:#fbbf24}',
      '[data-learning-lab="polynomial-roots"] [tabindex]:focus-visible{outline:3px solid #60a5fa;outline-offset:-3px}',
      '[data-theme="dark"] [data-learning-lab="polynomial-roots"] button.pr-primary,[data-theme="dark"] [data-learning-lab="polynomial-roots"] button[aria-pressed="true"],[data-theme="dark"] [data-learning-lab="polynomial-roots"] button:hover{color:#082f49}',
      '@media(prefers-reduced-motion:reduce){[data-learning-lab="polynomial-roots"] *{scroll-behavior:auto!important;transition:none!important}}'
    ].join("");

    function assert(condition, message) {
      if (!condition) throw new Error(message);
    }

    function near(left, right, tolerance) {
      return Math.abs(left - right) <= (tolerance || 1e-9);
    }

    function finiteParameter(value, label) {
      if (typeof value !== "number" || !Number.isFinite(value)) throw new RangeError(label + " must be a finite number");
      return value;
    }

    function bounded(value, low, high, label) {
      finiteParameter(value, label);
      if (value < low || value > high) throw new RangeError(label + " outside teaching domain");
      return value;
    }

    // This teaching family keeps the anchor at least 0.7 away from c ± g.
    function normalize(params) {
      if (!params) throw new TypeError("polynomial parameters are required");
      return {
        center: bounded(params.center, 0.5, 1.5, "center"),
        anchor: bounded(params.anchor, -3, -1, "anchor"),
        gap: bounded(params.gap, 0, 0.8, "gap")
      };
    }

    function coefficients(center, anchor, gap) {
      var p = normalize({ center: center, anchor: anchor, gap: gap });
      var c = p.center, d = p.anchor, g = p.gap;
      return { a3: 1, a2: -(d + 2 * c), a1: 2 * c * d + c * c - g * g, a0: -d * (c * c - g * g) };
    }

    // Horner evaluation of the stored, rounded coefficients; not a root certificate.
    function polynomialValue(x, coeffs) {
      finiteParameter(x, "x");
      ["a3", "a2", "a1", "a0"].forEach(function (key) { finiteParameter(coeffs[key], key); });
      var value = ((coeffs.a3 * x + coeffs.a2) * x + coeffs.a1) * x + coeffs.a0;
      if (!Number.isFinite(value)) throw new RangeError("polynomial evaluation overflow");
      return value;
    }

    function factoredValue(x, input) {
      var p = normalize(input), h = finiteParameter(x, "x") - p.center;
      var value = (h - p.gap) * (h + p.gap) * (x - p.anchor);
      if (!Number.isFinite(value)) throw new RangeError("factored evaluation overflow");
      return value;
    }

    // Algebraically simplified scaled coordinates avoid first rounding c + g*u.
    function localValue(u, input) {
      var p = normalize(input); finiteParameter(u, "u");
      var h = p.gap > 0 ? p.gap : 0.25;
      var value = (u * u - (p.gap > 0 ? 1 : 0)) * (1 + h * u / (p.center - p.anchor));
      if (!Number.isFinite(value)) throw new RangeError("local evaluation overflow");
      return value;
    }

    function evaluate(input) {
      var p = normalize(input), coeffs = coefficients(p.center, p.anchor, p.gap);
      var baseline = coefficients(p.center, p.anchor, 0);
      var roots = [{ label: "d", value: p.anchor, multiplicity: 1, crosses: true }];
      if (p.gap === 0) roots.push({ label: "c", value: p.center, multiplicity: 2, crosses: false });
      else {
        // Keep both symbolic roots even when their absolute double coordinates coincide.
        roots.push({ label: "c − g", value: p.center - p.gap, multiplicity: 1, crosses: true });
        roots.push({ label: "c + g", value: p.center + p.gap, multiplicity: 1, crosses: true });
      }
      var squared = p.gap * p.gap;
      return {
        params: p, coefficients: coeffs, roots: roots,
        rootsResolved: p.gap === 0 || (p.center - p.gap < p.center && p.center + p.gap > p.center),
        coefficientShift: p.gap > 0 && squared === 0 ? null : -squared,
        storedCoefficientShift: coeffs.a1 - baseline.a1,
        rootShift: p.gap, separation: 2 * p.gap, baseline: baseline
      };
    }

    function format(value, digits) {
      finiteParameter(value, "display value");
      var places = digits === undefined ? 3 : digits;
      if (value === 0) return "0";
      if (Math.abs(value) < Math.pow(10, -places) || Math.abs(value) >= 1e6) return value.toExponential(3);
      var text = value.toFixed(places);
      return places ? text.replace(/0+$/, "").replace(/\.$/, "") : text;
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

    function svgFor(data, local) {
      var p = data.params;
      var low = local ? -1.5 : p.anchor - 1.1;
      var high = local ? 1.5 : p.center + p.gap + 1.1;
      var samples = [], maximum = 0;
      for (var i = 0; i <= 360; i += 1) {
        var x = low + (high - low) * i / 360;
        var value = local ? localValue(x, p) : factoredValue(x, p);
        samples.push({ x: x, value: value }); maximum = Math.max(maximum, Math.abs(value));
      }
      maximum = Math.max(maximum, 0.5);
      function mapX(x) { return 100 + 570 * (x - low) / (high - low); }
      function mapY(y) { return 170 - 100 * y / maximum; }
      var path = samples.map(function (point, index) {
        return (index ? "L" : "M") + mapX(point.x).toFixed(2) + " " + mapY(point.value).toFixed(2);
      }).join(" ");
      var circles = local ? (p.gap > 0 ? [{ value: -1, multiplicity: 1 }, { value: 1, multiplicity: 1 }] : [{ value: 0, multiplicity: 2 }]) : data.roots;
      var marks = circles.map(function (row) {
        return '<circle cx="' + mapX(row.value).toFixed(2) + '" cy="170" r="5" class="' + (row.multiplicity > 1 ? "pr-multiple" : "pr-simple") + '"/>';
      }).join("");
      var ticks = [-1, 0, 1].map(function (sign) {
        var y = mapY(sign * maximum);
        return '<line x1="100" y1="' + y + '" x2="670" y2="' + y + '" class="pr-gridline"/><text x="90" y="' + (y + 4) + '" text-anchor="end" class="pr-label">' + format(sign * maximum, 2) + '</text>';
      }).join("");
      var xticks = (local ? [-1.5, -1, 0, 1, 1.5] : [low, 0, high]).map(function (x) {
        return '<text x="' + mapX(x) + '" y="292" text-anchor="middle" class="pr-label">' + format(x, 2) + '</text>';
      }).join("");
      var h = p.gap > 0 ? p.gap : 0.25;
      var title = local ? '局部坐标：u=(x−c)/h，v=p(x)/[h²(c−d)]' : '全局坐标：横轴 x，纵轴 p(x)；因式形式采样';
      var subtitle = local ? 'h=' + format(h, 5) + (p.gap > 0 ? '，中心两根对应 u=−1 与 +1' : '，二重根对应 u=0') : '蓝点：单根；金点：二重根。纵轴随参数缩放。';
      return '<svg viewBox="0 0 720 325" role="img" aria-label="' + title + '">' +
        '<text x="24" y="24" class="pr-title">' + title + '</text><text x="24" y="47" class="pr-label">' + subtitle + '</text>' + ticks +
        '<line x1="100" y1="170" x2="670" y2="170" class="pr-axis"/><line x1="100" y1="65" x2="100" y2="274" class="pr-axis"/>' +
        '<path d="' + path + '" class="pr-curve"/>' + marks + xticks +
        '<text x="690" y="292" class="pr-label">' + (local ? 'u' : 'x') + '</text></svg>';
    }

    function resultHtml(data, predictionCorrect) {
      var coeff = data.coefficients;
      var rootRows = data.roots.map(function (row) {
        return '<tr><td>' + row.label + '</td><td>' + format(row.value, 6) + '</td><td>' + row.multiplicity + '</td><td>' +
          (row.crosses ? "穿过（奇重）" : "接触、不穿过（偶重）") + '</td></tr>';
      }).join("");
      var answerText = predictionCorrect ? "预测命中。" : "预测已核对。";
      var shift = data.coefficientShift === null ? '−g²（非零，平方低于浮点可表示范围）' : format(data.coefficientShift, 5);
      return '<div class="pr-grid"><div class="pr-chart" tabindex="0" role="region" aria-label="全局与局部曲线，可横向滚动">' + svgFor(data, false) + svgFor(data, true) + '</div><div>' +
        '<div class="pr-metrics"><div class="pr-metric"><span>a2（浮点近似）</span><strong>' + format(coeff.a2) + '</strong></div>' +
        '<div class="pr-metric"><span>a1（浮点近似）</span><strong>' + format(coeff.a1) + '</strong></div>' +
        '<div class="pr-metric"><span>a0（浮点近似）</span><strong>' + format(coeff.a0) + '</strong></div>' +
        '<div class="pr-metric"><span>中心两根间距 2g</span><strong>' + format(data.separation) + '</strong></div></div>' +
        '<div class="pr-table-wrap" tabindex="0" role="region" aria-label="根账本，可横向滚动"><table><caption>根账本：身份来自因式，坐标为有限精度近似</caption><thead><tr><th>代数身份</th><th>近似坐标 x</th><th>重数</th><th>局部图形</th></tr></thead><tbody>' + rootRows + '</tbody></table></div>' +
        '<p class="pr-boundary">' + answerText + ' 理论系数变化 Δa1=−g² 为 ' + shift + '；两个已舍入系数直接相减得到 ' + format(data.storedCoefficientShift, 5) + '。中心根各移动 g=' + format(data.rootShift, 5) + '。' +
        (data.rootsResolved ? '表中小数仍可能因显示位数而相同，应结合 c−g 与 c+g 读。' : '当前浮点绝对坐标不能分辨全部位移；数学上仍是三个单根，局部坐标保留 u=±1。') +
        ' 局部纵轴也做了缩放，不能把两张图的高度直接比较；曲线不是根的证明。</p></div></div>';
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
            state.revealed = false;
            render();
            refs.feedback.textContent = "预测已记录；请重新核对后揭示。";
            refs.feedback.className = "pr-feedback";
          });
          choices[question.id].push({ id: option.id, node: button });
          optionHost.appendChild(button);
        });
        questionHost.appendChild(fieldset);
      });

      var presetButtons = [];
      PRESETS.forEach(function (preset) {
        var button = doc.createElement("button");
        button.type = "button";
        button.textContent = preset.label;
        button.setAttribute("data-preset", preset.id);
        presetButtons.push({ node: button, preset: preset });
        button.addEventListener("click", function () {
          state.center = preset.center;
          state.anchor = preset.anchor;
          state.gap = preset.gap;
          refs.center.value = String(state.center);
          refs.anchor.value = String(state.anchor);
          refs.gap.value = String(state.gap);
          predictions = {};
          state.revealed = false;
          refs.feedback.textContent = "已切换预设；请完成预测后揭示。";
          refs.feedback.className = "pr-feedback";
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
        presetButtons.forEach(function (entry) { entry.node.setAttribute("aria-pressed", ["center", "anchor", "gap"].every(function (key) { return state[key] === entry.preset[key]; }) ? "true" : "false"); });
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
        refs.feedback.textContent = state.revealed ? "参数已更新；保持同一组理论判断，比较根与系数的变化。" : "参数已更新；请先完成预测。";
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
        choices.touch[0].node.focus();
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
      factoredValue: factoredValue,
      localValue: localValue,
      format: format,
      evaluate: evaluate,
      mount: mount,
      selfTest: selfTest
    };
  }
);
