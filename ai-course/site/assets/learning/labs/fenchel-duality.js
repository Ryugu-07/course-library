(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("fenchel-duality", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("fenchel-duality self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("fenchel-duality self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var STYLE_ID = "cl-fenchel-duality-styles";
  var MODELS = {
    quadratic: { label: "f(x) = x²/2", domain: "x,y ∈ R", note: "光滑情形：唯一支撑斜率 y=x。" },
    absolute: { label: "f(x) = |x|", domain: "x ∈ R；f* 的有效域 |y|≤1", note: "折角处 ∂f(0)=[-1,1]；有效域外共轭为 +∞。" },
    exponential: { label: "f(x) = exp(x)", domain: "x ∈ R；f* 的有效域 y≥0", note: "y=0 时上确界为 0，但没有有限 x 取得它。" }
  };

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function near(a, b, tolerance) {
    return Math.abs(a - b) <= (tolerance || 1e-9);
  }

  function value(kind, x) {
    if (kind === "quadratic") return x * x / 2;
    if (kind === "absolute") return Math.abs(x);
    if (kind === "exponential") return Math.exp(x);
    throw new Error("unknown model: " + kind);
  }

  function conjugate(kind, y) {
    if (kind === "quadratic") return y * y / 2;
    if (kind === "absolute") return Math.abs(y) <= 1 ? 0 : Infinity;
    if (kind === "exponential") {
      if (y < 0) return Infinity;
      if (y === 0) return 0;
      return y * Math.log(y) - y;
    }
    throw new Error("unknown model: " + kind);
  }

  function subgradientContains(kind, x, y, tolerance) {
    var tol = tolerance || 1e-8;
    if (kind === "quadratic") return near(y, x, tol);
    if (kind === "absolute") {
      if (x > tol) return near(y, 1, tol);
      if (x < -tol) return near(y, -1, tol);
      return Math.abs(y) <= 1 + tol;
    }
    if (kind === "exponential") return near(y, Math.exp(x), tol);
    throw new Error("unknown model: " + kind);
  }

  function ledger(kind, x, y) {
    var f = value(kind, x);
    var star = conjugate(kind, y);
    var finite = isFinite(star);
    var gap = finite ? f + star - x * y : Infinity;
    if (finite && gap < 0 && gap > -1e-10) gap = 0;
    return {
      f: f,
      conjugate: star,
      pairing: x * y,
      gap: gap,
      effectiveDomain: finite,
      equality: finite && near(gap, 0, 1e-8),
      subgradient: subgradientContains(kind, x, y)
    };
  }

  function supportValue(kind, y, x) {
    var star = conjugate(kind, y);
    return isFinite(star) ? y * x - star : -Infinity;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function format(value) {
    if (value === Infinity) return "+∞";
    if (value === -Infinity) return "-∞";
    return (Math.round(value * 1000) / 1000).toString();
  }

  function ensureStyles() {
    if (!host || !host.document || host.document.getElementById(STYLE_ID)) return;
    var style = host.document.createElement("style");
    style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="fenchel-duality"]{--fd-accent:#2563eb;--fd-good:#047857;--fd-warn:#b45309;color:inherit}' +
      '[data-learning-lab="fenchel-duality"] .fd-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-items:end}' +
      '[data-learning-lab="fenchel-duality"] label{display:grid;gap:6px;font-weight:700}' +
      '[data-learning-lab="fenchel-duality"] select,[data-learning-lab="fenchel-duality"] input,[data-learning-lab="fenchel-duality"] button{min-height:44px;font:inherit}' +
      '[data-learning-lab="fenchel-duality"] button{border:1px solid currentColor;background:transparent;color:inherit;padding:8px 14px;cursor:pointer}' +
      '[data-learning-lab="fenchel-duality"] .fd-primary{background:var(--fd-accent);border-color:var(--fd-accent);color:white}' +
      '[data-learning-lab="fenchel-duality"] .fd-actions{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}' +
      '[data-learning-lab="fenchel-duality"] .fd-result[hidden]{display:none}' +
      '[data-learning-lab="fenchel-duality"] .fd-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(240px,.85fr);gap:16px;align-items:start}' +
      '[data-learning-lab="fenchel-duality"] svg{display:block;width:100%;height:auto;aspect-ratio:16/9;border:1px solid color-mix(in srgb,currentColor 22%,transparent);background:color-mix(in srgb,Canvas 94%,var(--fd-accent) 6%)}' +
      '[data-learning-lab="fenchel-duality"] .fd-table-wrap{overflow-x:auto}' +
      '[data-learning-lab="fenchel-duality"] table{width:100%;border-collapse:collapse}' +
      '[data-learning-lab="fenchel-duality"] th,[data-learning-lab="fenchel-duality"] td{padding:8px;border-bottom:1px solid color-mix(in srgb,currentColor 20%,transparent);text-align:left}' +
      '[data-learning-lab="fenchel-duality"] .fd-good{color:var(--fd-good);font-weight:800}' +
      '[data-learning-lab="fenchel-duality"] .fd-note{border-left:4px solid var(--fd-warn);padding-left:12px}' +
      '@media(max-width:760px){[data-learning-lab="fenchel-duality"] .fd-controls,[data-learning-lab="fenchel-duality"] .fd-grid{grid-template-columns:1fr}}';
    host.document.head.appendChild(style);
  }

  function svgPath(points) {
    return points.map(function (point, index) {
      return (index ? "L" : "M") + point[0].toFixed(2) + " " + point[1].toFixed(2);
    }).join(" ");
  }

  function renderSvg(kind, xChosen, yChosen) {
    var xMin = -3;
    var xMax = 3;
    var yMin = -2;
    var yMax = kind === "exponential" ? 10 : 5;
    var curve = [];
    var line = [];
    for (var i = 0; i <= 160; i += 1) {
      var x = xMin + (xMax - xMin) * i / 160;
      var f = Math.min(yMax, Math.max(yMin, value(kind, x)));
      var support = supportValue(kind, yChosen, x);
      curve.push([48 + 528 * (x - xMin) / (xMax - xMin), 278 - 230 * (f - yMin) / (yMax - yMin)]);
      if (isFinite(support)) {
        support = Math.min(yMax, Math.max(yMin, support));
        line.push([48 + 528 * (x - xMin) / (xMax - xMin), 278 - 230 * (support - yMin) / (yMax - yMin)]);
      }
    }
    var chosenF = Math.min(yMax, Math.max(yMin, value(kind, xChosen)));
    var cx = 48 + 528 * (xChosen - xMin) / (xMax - xMin);
    var cy = 278 - 230 * (chosenF - yMin) / (yMax - yMin);
    var lineMarkup = line.length
      ? '<path d="' + svgPath(line) + '" fill="none" stroke="#b45309" stroke-width="3" stroke-dasharray="7 5"/>'
      : '<text x="72" y="80" fill="#b45309">y 不在 f* 的有效域：不存在有限支撑截距</text>';
    return '<svg viewBox="0 0 620 320" role="img" aria-label="函数与候选 Fenchel 支撑线">' +
      '<line x1="48" y1="278" x2="584" y2="278" stroke="currentColor"/><line x1="312" y1="36" x2="312" y2="286" stroke="currentColor"/>' +
      '<path d="' + svgPath(curve) + '" fill="none" stroke="#2563eb" stroke-width="4"/>' +
      lineMarkup +
      '<circle cx="' + cx.toFixed(2) + '" cy="' + cy.toFixed(2) + '" r="6" fill="#047857"/>' +
      '<text x="62" y="304" fill="#2563eb">蓝：f(x)</text><text x="180" y="304" fill="#b45309">橙：yx-f*(y)</text><text x="358" y="304" fill="#047857">绿点：当前 x</text>' +
      '</svg>';
  }

  function mount(root) {
    ensureStyles();
    root.innerHTML =
      '<div class="fd-controls">' +
      '<label>函数<select data-role="model"><option value="quadratic">二次函数</option><option value="absolute">绝对值</option><option value="exponential">指数函数</option></select></label>' +
      '<label>x = <output data-role="x-output">1</output><input data-role="x" type="range" min="-3" max="3" step="0.1" value="1"></label>' +
      '<label>y = <output data-role="y-output">1</output><input data-role="y" type="range" min="-2" max="3" step="0.1" value="1"></label>' +
      '</div>' +
      '<label>揭示前预测<select data-role="prediction"><option value="">请选择</option><option value="equal">间隙为零</option><option value="positive">间隙为正</option><option value="infinite">共轭为 +∞</option></select></label>' +
      '<div class="fd-actions"><button class="fd-primary" type="button" data-role="reveal">揭示账本</button><button type="button" data-role="reset">重置</button></div>' +
      '<div class="fd-result" data-role="result" hidden aria-live="polite"></div>';

    var model = root.querySelector('[data-role="model"]');
    var xInput = root.querySelector('[data-role="x"]');
    var yInput = root.querySelector('[data-role="y"]');
    var prediction = root.querySelector('[data-role="prediction"]');
    var result = root.querySelector('[data-role="result"]');

    function expected(entry) {
      if (!entry.effectiveDomain) return "infinite";
      return entry.equality ? "equal" : "positive";
    }

    function render() {
      var x = Number(xInput.value);
      var y = Number(yInput.value);
      root.querySelector('[data-role="x-output"]').textContent = format(x);
      root.querySelector('[data-role="y-output"]').textContent = format(y);
      if (result.hidden) return;
      var entry = ledger(model.value, x, y);
      var predictionText = prediction.value === expected(entry) ? "预测命中" : "预测需修正";
      result.innerHTML =
        '<div class="fd-grid"><div>' + renderSvg(model.value, x, y) + '</div><div>' +
        '<h4>' + escapeHtml(MODELS[model.value].label) + '</h4><p class="fd-good">' + predictionText + '</p>' +
        '<div class="fd-table-wrap"><table><tbody>' +
        '<tr><th>f(x)</th><td>' + format(entry.f) + '</td></tr>' +
        '<tr><th>f*(y)</th><td>' + format(entry.conjugate) + '</td></tr>' +
        '<tr><th>xy</th><td>' + format(entry.pairing) + '</td></tr>' +
        '<tr><th>Fenchel–Young 间隙</th><td>' + format(entry.gap) + '</td></tr>' +
        '<tr><th>y ∈ ∂f(x)</th><td>' + (entry.subgradient ? "是" : "否") + '</td></tr>' +
        '</tbody></table></div>' +
        '<p><strong>有效域：</strong>' + escapeHtml(MODELS[model.value].domain) + '</p>' +
        '<p class="fd-note">' + escapeHtml(MODELS[model.value].note) + '</p></div></div>';
    }

    root.querySelector('[data-role="reveal"]').addEventListener("click", function () {
      if (!prediction.value) {
        prediction.focus();
        return;
      }
      result.hidden = false;
      render();
    });
    root.querySelector('[data-role="reset"]').addEventListener("click", function () {
      model.value = "quadratic";
      xInput.value = "1";
      yInput.value = "1";
      prediction.value = "";
      result.hidden = true;
      result.innerHTML = "";
      render();
    });
    [model, xInput, yInput].forEach(function (control) {
      control.addEventListener("input", render);
      control.addEventListener("change", render);
    });
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      assert(condition, message);
    }
    check(near(conjugate("quadratic", 2), 2), "quadratic conjugate");
    check(ledger("quadratic", 2, 2).equality, "quadratic Fenchel equality");
    check(near(ledger("quadratic", 2, 1).gap, 0.5), "quadratic positive gap");
    check(conjugate("absolute", 1) === 0, "absolute boundary finite");
    check(conjugate("absolute", -1) === 0, "absolute negative boundary finite");
    check(conjugate("absolute", 1.01) === Infinity, "absolute effective-domain boundary");
    check(subgradientContains("absolute", 0, 0.7), "absolute subgradient interval");
    check(!subgradientContains("absolute", 2, 0), "absolute off-subgradient");
    check(near(conjugate("exponential", 1), -1), "exponential conjugate at one");
    check(conjugate("exponential", 0) === 0, "exponential conjugate at zero");
    check(conjugate("exponential", -0.1) === Infinity, "exponential domain excludes negative slopes");
    check(ledger("exponential", 0, 1).equality, "exponential contact at x zero");
    check(near(supportValue("quadratic", 2, 2), 2), "support value at contact");
    return { checks: checks };
  }

  return {
    MODELS: MODELS,
    value: value,
    conjugate: conjugate,
    subgradientContains: subgradientContains,
    ledger: ledger,
    supportValue: supportValue,
    mount: mount,
    selfTest: selfTest
  };
});
