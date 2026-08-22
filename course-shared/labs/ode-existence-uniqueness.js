(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("ode-existence-uniqueness", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("ode-existence-uniqueness self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("ode-existence-uniqueness self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var STYLE_ID = "cl-ode-existence-uniqueness-styles";
  var MODELS = {
    linear: {
      label: "y' = y, y(0) = 1",
      continuity: true,
      lipschitz: true,
      verdict: "局部唯一；本例解析解全局存在",
      boundary: "Picard-Lindelöf 给局部证书；全局性还来自 e^t 的解析延拓。"
    },
    sqrt: {
      label: "y' = sqrt(|y|), y(0) = 0",
      continuity: true,
      lipschitz: false,
      verdict: "存在但不唯一",
      boundary: "y=0 与任意等待时间 a 的 y_a 都是解；Euler 从精确零出发只会选中其中一条。"
    },
    blowup: {
      label: "y' = y^2, y(0) = 1",
      continuity: true,
      lipschitz: true,
      verdict: "局部唯一；t=1 时有限时爆破",
      boundary: "局部 Lipschitz 不承诺无限寿命；最大向前区间止于 t=1。"
    }
  };

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function near(a, b, tolerance) {
    return Math.abs(a - b) <= (tolerance || 1e-9);
  }

  function rhs(kind, y) {
    if (kind === "linear") return y;
    if (kind === "sqrt") return Math.sqrt(Math.abs(y));
    if (kind === "blowup") return y * y;
    throw new Error("unknown model: " + kind);
  }

  function delayedSolution(t, delay) {
    return t <= delay ? 0 : Math.pow(t - delay, 2) / 4;
  }

  function exactSolution(kind, t, delay) {
    if (kind === "linear") return Math.exp(t);
    if (kind === "sqrt") return delayedSolution(t, delay || 0);
    if (kind === "blowup") return t < 1 ? 1 / (1 - t) : Infinity;
    throw new Error("unknown model: " + kind);
  }

  function eulerTrace(kind, horizon, steps) {
    var count = Math.max(1, Math.floor(steps));
    var h = horizon / count;
    var y = kind === "sqrt" ? 0 : 1;
    var points = [{ t: 0, y: y }];
    for (var i = 0; i < count; i += 1) {
      y += h * rhs(kind, y);
      points.push({ t: (i + 1) * h, y: y });
      if (!isFinite(y) || Math.abs(y) > 1e6) break;
    }
    return points;
  }

  function certificate(kind) {
    var model = MODELS[kind];
    if (!model) throw new Error("unknown model: " + kind);
    return {
      continuous: model.continuity,
      locallyLipschitz: model.lipschitz,
      localExistence: model.continuity,
      localUniquenessCertified: model.continuity && model.lipschitz,
      verdict: model.verdict,
      boundary: model.boundary
    };
  }

  function sampleExact(kind, horizon, delay, count) {
    var points = [];
    var safeHorizon = kind === "blowup" ? Math.min(horizon, 0.98) : horizon;
    for (var i = 0; i <= count; i += 1) {
      var t = safeHorizon * i / count;
      points.push({ t: t, y: exactSolution(kind, t, delay) });
    }
    return points;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function format(value) {
    if (!isFinite(value)) return "∞";
    if (Math.abs(value) >= 1000) return value.toExponential(2);
    return (Math.round(value * 1000) / 1000).toString();
  }

  function ensureStyles() {
    if (!host || !host.document || host.document.getElementById(STYLE_ID)) return;
    var style = host.document.createElement("style");
    style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="ode-existence-uniqueness"]{--lab-accent:#0f766e;--lab-warn:#b45309;color:inherit}' +
      '[data-learning-lab="ode-existence-uniqueness"] .oeu-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-items:end}' +
      '[data-learning-lab="ode-existence-uniqueness"] label{display:grid;gap:6px;font-weight:700}' +
      '[data-learning-lab="ode-existence-uniqueness"] select,[data-learning-lab="ode-existence-uniqueness"] input,[data-learning-lab="ode-existence-uniqueness"] button{min-height:44px;font:inherit}' +
      '[data-learning-lab="ode-existence-uniqueness"] button{border:1px solid currentColor;background:transparent;color:inherit;padding:8px 14px;cursor:pointer}' +
      '[data-learning-lab="ode-existence-uniqueness"] .oeu-actions{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}' +
      '[data-learning-lab="ode-existence-uniqueness"] .oeu-primary{background:var(--lab-accent);border-color:var(--lab-accent);color:white}' +
      '[data-learning-lab="ode-existence-uniqueness"] .oeu-result[hidden]{display:none}' +
      '[data-learning-lab="ode-existence-uniqueness"] .oeu-grid{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(230px,.8fr);gap:16px;align-items:start}' +
      '[data-learning-lab="ode-existence-uniqueness"] svg{display:block;width:100%;height:auto;aspect-ratio:16/9;border:1px solid color-mix(in srgb,currentColor 22%,transparent);background:color-mix(in srgb,Canvas 94%,var(--lab-accent) 6%)}' +
      '[data-learning-lab="ode-existence-uniqueness"] .oeu-table-wrap{overflow-x:auto}' +
      '[data-learning-lab="ode-existence-uniqueness"] table{width:100%;border-collapse:collapse}' +
      '[data-learning-lab="ode-existence-uniqueness"] th,[data-learning-lab="ode-existence-uniqueness"] td{padding:8px;border-bottom:1px solid color-mix(in srgb,currentColor 20%,transparent);text-align:left;vertical-align:top}' +
      '[data-learning-lab="ode-existence-uniqueness"] .oeu-note{border-left:4px solid var(--lab-warn);padding-left:12px}' +
      '@media(max-width:760px){[data-learning-lab="ode-existence-uniqueness"] .oeu-controls,[data-learning-lab="ode-existence-uniqueness"] .oeu-grid{grid-template-columns:1fr}}';
    host.document.head.appendChild(style);
  }

  function pathFor(points, xMax, yMax) {
    return points.map(function (point, index) {
      var x = 44 + 532 * point.t / xMax;
      var clipped = Math.min(yMax, Math.max(0, point.y));
      var y = 282 - 238 * clipped / yMax;
      return (index ? "L" : "M") + x.toFixed(2) + " " + y.toFixed(2);
    }).join(" ");
  }

  function renderSvg(kind, horizon, delay, steps) {
    var exact = sampleExact(kind, horizon, delay, 100);
    var numericHorizon = kind === "blowup" ? Math.min(horizon, 0.98) : horizon;
    var euler = eulerTrace(kind, numericHorizon, steps);
    var values = exact.concat(euler).map(function (point) { return point.y; }).filter(isFinite);
    var yMax = Math.max(1, Math.min(20, Math.max.apply(null, values) * 1.08));
    var xMax = kind === "blowup" ? Math.max(1, horizon) : horizon;
    var marker = kind === "blowup" && horizon >= 1
      ? '<line x1="' + (44 + 532 / xMax).toFixed(2) + '" x2="' + (44 + 532 / xMax).toFixed(2) + '" y1="36" y2="282" stroke="#b45309" stroke-dasharray="6 5"/><text x="' + (50 + 532 / xMax).toFixed(2) + '" y="54" fill="#b45309">t=1 爆破边界</text>'
      : "";
    var extra = "";
    if (kind === "sqrt") {
      [0, 1, 2].forEach(function (a, index) {
        if (a > horizon) return;
        var trace = sampleExact(kind, horizon, a, 100);
        extra += '<path d="' + pathFor(trace, xMax, yMax) + '" fill="none" stroke="' + ["#0f766e", "#2563eb", "#b45309"][index] + '" stroke-width="3"/>';
      });
    } else {
      extra = '<path d="' + pathFor(exact, xMax, yMax) + '" fill="none" stroke="#0f766e" stroke-width="4"/>';
    }
    return '<svg viewBox="0 0 620 320" role="img" aria-label="解析解与 Euler 轨迹">' +
      '<line x1="44" y1="282" x2="588" y2="282" stroke="currentColor"/><line x1="44" y1="36" x2="44" y2="282" stroke="currentColor"/>' +
      '<text x="574" y="306">t</text><text x="16" y="44">y</text>' +
      extra +
      '<path d="' + pathFor(euler, xMax, yMax) + '" fill="none" stroke="#7c3aed" stroke-width="2" stroke-dasharray="5 5"/>' +
      marker +
      '<text x="54" y="306" fill="#0f766e">实线：解析分支</text><text x="218" y="306" fill="#7c3aed">虚线：有限步 Euler</text>' +
      '</svg>';
  }

  function mount(root) {
    ensureStyles();
    root.innerHTML =
      '<div class="oeu-controls">' +
      '<label>方程<select data-role="model"><option value="linear">线性唯一</option><option value="sqrt">平方根非唯一</option><option value="blowup">有限时爆破</option></select></label>' +
      '<label>观察终点 <output data-role="horizon-output">2.5</output><input data-role="horizon" type="range" min="0.5" max="3" step="0.1" value="2.5"></label>' +
      '<label>Euler 步数 <output data-role="steps-output">24</output><input data-role="steps" type="range" min="4" max="80" step="4" value="24"></label>' +
      '</div>' +
      '<label>揭示前预测<select data-role="prediction"><option value="">请选择</option><option value="unique-global">唯一且本例全局</option><option value="nonunique">存在但不唯一</option><option value="unique-local">局部唯一但不全局</option></select></label>' +
      '<div class="oeu-actions"><button class="oeu-primary" type="button" data-role="reveal">揭示证书</button><button type="button" data-role="reset">重置</button></div>' +
      '<div class="oeu-result" data-role="result" hidden aria-live="polite"></div>';

    var model = root.querySelector('[data-role="model"]');
    var horizon = root.querySelector('[data-role="horizon"]');
    var steps = root.querySelector('[data-role="steps"]');
    var prediction = root.querySelector('[data-role="prediction"]');
    var result = root.querySelector('[data-role="result"]');

    function expected(kind) {
      return kind === "linear" ? "unique-global" : kind === "sqrt" ? "nonunique" : "unique-local";
    }

    function render() {
      root.querySelector('[data-role="horizon-output"]').textContent = horizon.value;
      root.querySelector('[data-role="steps-output"]').textContent = steps.value;
      if (result.hidden) return;
      var kind = model.value;
      var cert = certificate(kind);
      var h = Number(horizon.value);
      var n = Number(steps.value);
      var predictionText = prediction.value
        ? (prediction.value === expected(kind) ? "预测命中" : "预测需修正")
        : "未提交预测";
      var endpoint = exactSolution(kind, Math.min(h, kind === "blowup" ? 0.95 : h), 1);
      result.innerHTML =
        '<div class="oeu-grid"><div>' + renderSvg(kind, h, 1, n) + '</div>' +
        '<div><h4>' + escapeHtml(MODELS[kind].label) + '</h4>' +
        '<p><strong>' + predictionText + '</strong></p>' +
        '<div class="oeu-table-wrap"><table><tbody>' +
        '<tr><th>连续</th><td>' + (cert.continuous ? "是" : "否") + '</td></tr>' +
        '<tr><th>局部 Lipschitz</th><td>' + (cert.locallyLipschitz ? "是" : "否") + '</td></tr>' +
        '<tr><th>定理证书</th><td>' + escapeHtml(cert.verdict) + '</td></tr>' +
        '<tr><th>观察点解析值</th><td>' + format(endpoint) + '</td></tr>' +
        '</tbody></table></div><p class="oeu-note">' + escapeHtml(cert.boundary) + '</p></div></div>';
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
      model.value = "linear";
      horizon.value = "2.5";
      steps.value = "24";
      prediction.value = "";
      result.hidden = true;
      result.innerHTML = "";
      render();
    });
    [model, horizon, steps].forEach(function (control) {
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
    check(near(delayedSolution(-1, 0), 0), "delayed branch remains zero before launch");
    check(near(delayedSolution(2, 1), 0.25), "delayed branch formula");
    check(near(rhs("sqrt", delayedSolution(2, 1)), 0.5), "sqrt branch derivative magnitude");
    check(near(exactSolution("linear", 1, 0), Math.E), "linear exact solution");
    check(near(exactSolution("blowup", 0.5, 0), 2), "blowup exact solution");
    check(!isFinite(exactSolution("blowup", 1, 0)), "blowup boundary");
    check(certificate("linear").localUniquenessCertified, "linear uniqueness certificate");
    check(!certificate("sqrt").localUniquenessCertified, "sqrt lacks Lipschitz certificate");
    check(certificate("blowup").localUniquenessCertified, "blowup remains locally unique");
    check(eulerTrace("sqrt", 2, 20).every(function (point) { return point.y === 0; }), "Euler selects stationary sqrt branch");
    check(eulerTrace("linear", 1, 200).slice(-1)[0].y > 2.7, "Euler linear growth");
    check(sampleExact("sqrt", 2, 1, 4).length === 5, "sampling endpoint count");
    return { checks: checks };
  }

  return {
    MODELS: MODELS,
    rhs: rhs,
    delayedSolution: delayedSolution,
    exactSolution: exactSolution,
    eulerTrace: eulerTrace,
    certificate: certificate,
    sampleExact: sampleExact,
    mount: mount,
    selfTest: selfTest
  };
});
