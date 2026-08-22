(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("classic-models", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("classic-models self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("classic-models self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var STYLE_ID = "cl-classic-models-styles";
  var DEFAULTS = {
    model: "growth",
    growth: { rate: 0.35, capacity: 600, initial: 80, horizon: 10 },
    sir: { beta: 0.6, gamma: 0.2, initial: 0.02, horizon: 40 },
    queue: { arrival: 0.8, service: 1 }
  };
  var PREDICTION_OPTIONS = {
    growth: ["bounded", "not-bounded", "uncertain"],
    sir: ["outbreak", "fade"],
    queue: ["stable", "unstable"]
  };
  var PREDICTION_LABELS = {
    bounded: "趋向容量并保持有界",
    "not-bounded": "不会保持有界",
    uncertain: "当前证据不足",
    outbreak: "先出现增长期",
    fade: "感染比例衰减",
    stable: "存在有限稳态",
    unstable: "没有有限稳态"
  };

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function near(a, b, tolerance) {
    return Math.abs(a - b) <= (tolerance || 1e-8);
  }

  function format(value, digits) {
    if (!isFinite(value)) return "∞";
    var places = digits === undefined ? 3 : digits;
    if (Math.abs(value) > 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) {
      return value.toExponential(Math.min(places, 4));
    }
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function logisticValue(time, rate, capacity, initial) {
    var constant = (capacity - initial) / initial;
    return capacity / (1 + constant * Math.exp(-rate * time));
  }

  function samplePath(points, mapX, mapY, valueKey) {
    return points.map(function (point, index) {
      return (index ? "L" : "M") + mapX(point.t).toFixed(2) + " " + mapY(point[valueKey]).toFixed(2);
    }).join(" ");
  }

  function growthPoints(rate, capacity, initial, horizon) {
    var points = [];
    for (var index = 0; index <= 80; index += 1) {
      var time = horizon * index / 80;
      points.push({ t: time, n: logisticValue(time, rate, capacity, initial) });
    }
    return points;
  }

  function sirPoints(beta, gamma, initial, horizon) {
    var dt = 0.01;
    var steps = Math.round(horizon / dt);
    var sampleEvery = Math.max(1, Math.round(0.2 / dt));
    var state = { s: 1 - initial, i: initial, r: 0 };
    var points = [];
    for (var step = 0; step <= steps; step += 1) {
      if (step % sampleEvery === 0 || step === steps) {
        points.push({ t: step * dt, s: state.s, i: state.i, r: state.r });
      }
      if (step === steps) break;
      var newS = state.s - dt * beta * state.s * state.i;
      var newI = state.i + dt * (beta * state.s * state.i - gamma * state.i);
      var newR = state.r + dt * gamma * state.i;
      state = { s: newS, i: newI, r: newR };
    }
    return points;
  }

  function queueMetrics(arrival, service) {
    if (!isFinite(arrival) || !isFinite(service) || arrival < 0 || service <= 0) {
      throw new RangeError("M/M/1 到达率须为有限非负数，服务率须为有限正数。 ");
    }
    var rho = arrival / service;
    if (rho >= 1) return { rho: rho, stable: false, L: Infinity, W: Infinity, flowError: Infinity };
    var L = rho / (1 - rho);
    var W = 1 / (service - arrival);
    return { rho: rho, stable: true, L: L, W: W, flowError: Math.abs(L - arrival * W) };
  }

  function queueCurve() {
    var points = [];
    for (var index = 1; index <= 98; index += 1) {
      var rho = index / 100;
      points.push({ t: rho, l: rho / (1 - rho) });
    }
    return points;
  }

  function renderGrowthSvg(params) {
    var points = growthPoints(params.rate, params.capacity, params.initial, params.horizon);
    function mapX(time) { return 48 + 536 * time / params.horizon; }
    function mapY(value) { return 286 - 232 * value / (params.capacity * 1.08); }
    return '<svg viewBox="0 0 620 330" role="img" aria-label="Logistic 增长曲线">' +
      '<line x1="48" y1="286" x2="584" y2="286" stroke="currentColor"/><line x1="48" y1="286" x2="48" y2="38" stroke="currentColor"/>' +
      '<line x1="48" y1="' + mapY(params.capacity).toFixed(2) + '" x2="584" y2="' + mapY(params.capacity).toFixed(2) + '" stroke="#95670d" stroke-dasharray="6 5"/>' +
      '<path d="' + samplePath(points, mapX, mapY, "n") + '" fill="none" stroke="#315f9d" stroke-width="3"/>' +
      '<circle cx="' + mapX(0).toFixed(2) + '" cy="' + mapY(params.initial).toFixed(2) + '" r="5" fill="#b13d32"/>' +
      '<text x="58" y="27" fill="currentColor">蓝：轨迹　橙虚线：容量 K　红：初值</text><text x="556" y="305">t</text><text x="28" y="48">N</text>' +
      '</svg>';
  }

  function renderSirSvg(points) {
    function mapX(time) { return 48 + 536 * time / points[points.length - 1].t; }
    function mapY(value) { return 286 - 232 * value; }
    return '<svg viewBox="0 0 620 330" role="img" aria-label="SIR 人群比例轨迹">' +
      '<line x1="48" y1="286" x2="584" y2="286" stroke="currentColor"/><line x1="48" y1="286" x2="48" y2="38" stroke="currentColor"/>' +
      '<path d="' + samplePath(points, mapX, mapY, "s") + '" fill="none" stroke="#315f9d" stroke-width="3"/>' +
      '<path d="' + samplePath(points, mapX, mapY, "i") + '" fill="none" stroke="#b13d32" stroke-width="3"/>' +
      '<path d="' + samplePath(points, mapX, mapY, "r") + '" fill="none" stroke="#347247" stroke-width="3"/>' +
      '<text x="58" y="27" fill="currentColor">蓝：易感　红：感染　绿：移出</text><text x="556" y="305">t</text><text x="28" y="48">比例</text>' +
      '</svg>';
  }

  function renderQueueSvg(arrival, service) {
    var points = queueCurve();
    var metrics = queueMetrics(arrival, service);
    var maximum = points[points.length - 1].l;
    if (metrics.stable) maximum = Math.max(maximum, metrics.L);
    function mapX(rho) { return 48 + 536 * rho; }
    function mapY(value) { return 286 - 232 * value / maximum; }
    var current = metrics.stable
      ? '<circle cx="' + mapX(metrics.rho).toFixed(2) + '" cy="' + mapY(metrics.L).toFixed(2) + '" r="6" fill="#b13d32"/>'
      : '<line x1="' + mapX(0.99).toFixed(2) + '" y1="48" x2="' + mapX(0.99).toFixed(2) + '" y2="286" stroke="#b13d32" stroke-dasharray="5 5"/>';
    return '<svg viewBox="0 0 620 330" role="img" aria-label="M/M/1 利用率与平均队长">' +
      '<line x1="48" y1="286" x2="584" y2="286" stroke="currentColor"/><line x1="48" y1="286" x2="48" y2="38" stroke="currentColor"/>' +
      '<path d="' + samplePath(points, mapX, mapY, "l") + '" fill="none" stroke="#315f9d" stroke-width="3"/>' + current +
      '<text x="58" y="27" fill="currentColor">蓝：L=ρ/(1−ρ)　红：当前利用率</text><text x="552" y="305">ρ</text><text x="24" y="48">L</text>' +
      '</svg>';
  }

  function ensureStyles() {
    if (!host || !host.document || host.document.getElementById(STYLE_ID)) return;
    var style = host.document.createElement("style");
    style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="classic-models"] .cml-lab{--cml-blue:#315f9d;--cml-gold:#95670d;--cml-red:#b13d32;--cml-green:#347247;max-width:100%;min-width:0;color:var(--fg);line-height:1.55}' +
      '[data-learning-lab="classic-models"] .cml-lab *{box-sizing:border-box}' +
      '[data-learning-lab="classic-models"] .cml-controls{display:grid;grid-template-columns:minmax(170px,1fr) repeat(3,minmax(0,1fr));gap:12px;align-items:end}' +
      '[data-learning-lab="classic-models"] .cml-panel{display:contents}' +
      '[data-learning-lab="classic-models"] label{display:grid;gap:6px;font-weight:700}' +
      '[data-learning-lab="classic-models"] input,[data-learning-lab="classic-models"] select,[data-learning-lab="classic-models"] button{min-height:44px;font:inherit}' +
      '[data-learning-lab="classic-models"] input{width:100%}' +
      '[data-learning-lab="classic-models"] select{width:100%;padding:8px}' +
      '[data-learning-lab="classic-models"] button{border:1px solid currentColor;background:transparent;color:inherit;padding:8px 14px;cursor:pointer}' +
      '[data-learning-lab="classic-models"] button:hover,[data-learning-lab="classic-models"] button:focus-visible{border-color:var(--accent)}' +
      '[data-learning-lab="classic-models"] .cml-primary{background:var(--cml-blue);border-color:var(--cml-blue);color:white}' +
      '[data-learning-lab="classic-models"] .cml-question{margin:16px 0 8px;font-weight:700}' +
      '[data-learning-lab="classic-models"] .cml-actions{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}' +
      '[data-learning-lab="classic-models"] .cml-result[hidden], [data-learning-lab="classic-models"] [data-panel][hidden]{display:none}' +
      '[data-learning-lab="classic-models"] .cml-grid{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(250px,.8fr);gap:16px;align-items:start}' +
      '[data-learning-lab="classic-models"] svg{display:block;width:100%;height:auto;aspect-ratio:620/330;border:1px solid color-mix(in srgb,currentColor 22%,transparent);background:color-mix(in srgb,Canvas 94%,var(--cml-blue) 6%)}' +
      '[data-learning-lab="classic-models"] .cml-table-wrap{overflow-x:auto}' +
      '[data-learning-lab="classic-models"] table{width:100%;border-collapse:collapse}' +
      '[data-learning-lab="classic-models"] th,[data-learning-lab="classic-models"] td{padding:8px;border-bottom:1px solid color-mix(in srgb,currentColor 20%,transparent);text-align:left;vertical-align:top}' +
      '[data-learning-lab="classic-models"] .cml-note{border-left:4px solid var(--cml-gold);padding-left:12px;color:var(--fg-soft);font-size:13px}' +
      '@media(max-width:860px){[data-learning-lab="classic-models"] .cml-controls{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="classic-models"] .cml-panel{display:contents}}' +
      '@media(max-width:620px){[data-learning-lab="classic-models"] .cml-controls,[data-learning-lab="classic-models"] .cml-grid{grid-template-columns:1fr}}';
    host.document.head.appendChild(style);
  }

  function mount(root) {
    ensureStyles();
    root.innerHTML =
      '<div class="cml-lab">' +
      '<div class="cml-controls">' +
      '<label>模型<select data-role="model"><option value="growth">增长：Logistic</option><option value="sir">传染：SIR</option><option value="queue">排队：M/M/1</option></select></label>' +
      '<div class="cml-panel" data-panel="growth"><label>增长率 r = <output data-role="growth-rate-output">0.35</output><input data-role="growth-rate" type="range" min="0.1" max="1.2" step="0.05" value="0.35"></label><label>容量 K = <output data-role="growth-capacity-output">600</output><input data-role="growth-capacity" type="range" min="300" max="1000" step="10" value="600"></label><label>初值 N₀ = <output data-role="growth-initial-output">80</output><input data-role="growth-initial" type="range" min="20" max="180" step="10" value="80"></label><label>观察时长 = <output data-role="growth-horizon-output">10</output><input data-role="growth-horizon" type="range" min="4" max="20" step="1" value="10"></label></div>' +
      '<div class="cml-panel" data-panel="sir" hidden><label>接触率 β = <output data-role="sir-beta-output">0.6</output><input data-role="sir-beta" type="range" min="0.1" max="1.5" step="0.05" value="0.6"></label><label>移出率 γ = <output data-role="sir-gamma-output">0.2</output><input data-role="sir-gamma" type="range" min="0.05" max="0.8" step="0.05" value="0.2"></label><label>初始感染 i₀ = <output data-role="sir-initial-output">0.02</output><input data-role="sir-initial" type="range" min="0.01" max="0.2" step="0.01" value="0.02"></label><label>观察时长 = <output data-role="sir-horizon-output">40</output><input data-role="sir-horizon" type="range" min="10" max="80" step="5" value="40"></label></div>' +
      '<div class="cml-panel" data-panel="queue" hidden><label>到达率 λ = <output data-role="queue-arrival-output">0.8</output><input data-role="queue-arrival" type="range" min="0.1" max="1.4" step="0.05" value="0.8"></label><label>服务率 μ = <output data-role="queue-service-output">1</output><input data-role="queue-service" type="range" min="0.5" max="1.5" step="0.05" value="1"></label></div>' +
      '</div>' +
      '<p class="cml-question">揭示前预测：当前模型会触碰哪一个行为边界？</p>' +
      '<label>行为预测<select data-role="prediction"><option value="">请选择</option></select></label>' +
      '<div class="cml-actions"><button class="cml-primary" type="button" data-role="reveal">揭示模型</button><button type="button" data-role="reset">重置</button></div>' +
      '<div class="cml-result" data-role="result" hidden aria-live="polite"></div>' +
      '</div>';

    var model = root.querySelector('[data-role="model"]');
    var prediction = root.querySelector('[data-role="prediction"]');
    var result = root.querySelector('[data-role="result"]');

    function controlsFor(name) {
      return {
        rate: Number(root.querySelector('[data-role="growth-rate"]').value),
        capacity: Number(root.querySelector('[data-role="growth-capacity"]').value),
        initial: Number(root.querySelector('[data-role="growth-initial"]').value),
        growthHorizon: Number(root.querySelector('[data-role="growth-horizon"]').value),
        horizon: Number(root.querySelector('[data-role="growth-horizon"]').value),
        beta: Number(root.querySelector('[data-role="sir-beta"]').value),
        gamma: Number(root.querySelector('[data-role="sir-gamma"]').value),
        sirInitial: Number(root.querySelector('[data-role="sir-initial"]').value),
        sirHorizon: Number(root.querySelector('[data-role="sir-horizon"]').value),
        arrival: Number(root.querySelector('[data-role="queue-arrival"]').value),
        service: Number(root.querySelector('[data-role="queue-service"]').value),
        name: name
      };
    }

    function setPredictionOptions() {
      var options = PREDICTION_OPTIONS[model.value];
      prediction.innerHTML = '<option value="">请选择</option>' + options.map(function (value) {
        return '<option value="' + value + '">' + escapeHtml(PREDICTION_LABELS[value]) + '</option>';
      }).join("");
    }

    function updatePanels() {
      root.querySelectorAll('[data-panel]').forEach(function (panel) {
        panel.hidden = panel.getAttribute("data-panel") !== model.value;
      });
    }

    function updateOutputs() {
      root.querySelector('[data-role="growth-rate-output"]').textContent = root.querySelector('[data-role="growth-rate"]').value;
      root.querySelector('[data-role="growth-capacity-output"]').textContent = root.querySelector('[data-role="growth-capacity"]').value;
      root.querySelector('[data-role="growth-initial-output"]').textContent = root.querySelector('[data-role="growth-initial"]').value;
      root.querySelector('[data-role="growth-horizon-output"]').textContent = root.querySelector('[data-role="growth-horizon"]').value;
      root.querySelector('[data-role="sir-beta-output"]').textContent = root.querySelector('[data-role="sir-beta"]').value;
      root.querySelector('[data-role="sir-gamma-output"]').textContent = root.querySelector('[data-role="sir-gamma"]').value;
      root.querySelector('[data-role="sir-initial-output"]').textContent = root.querySelector('[data-role="sir-initial"]').value;
      root.querySelector('[data-role="sir-horizon-output"]').textContent = root.querySelector('[data-role="sir-horizon"]').value;
      root.querySelector('[data-role="queue-arrival-output"]').textContent = root.querySelector('[data-role="queue-arrival"]').value;
      root.querySelector('[data-role="queue-service-output"]').textContent = root.querySelector('[data-role="queue-service"]').value;
    }

    function render() {
      updateOutputs();
      if (result.hidden) return;
      var params = controlsFor(model.value);
      var expected;
      var svg;
      var rows;
      var note;
      if (model.value === "growth") {
        var growthEnd = logisticValue(params.growthHorizon, params.rate, params.capacity, params.initial);
        expected = "bounded";
        svg = renderGrowthSvg(params);
        rows = '<tr><th>状态</th><td>N(t) → K=' + format(params.capacity) + '；终值 ' + format(growthEnd) + '</td></tr>' +
          '<tr><th>守恒/边界</th><td>[0,K] 是不变区间；没有总量守恒定律</td></tr>' +
          '<tr><th>参数可识别性</th><td>早期近似指数段容易识别 r，K 仍可能宽泛</td></tr>' +
          '<tr><th>适用域</th><td>固定容量、正增长、无外部 forcing 的 toy</td></tr>';
        note = "K 是容量假设，不是自然常数；真实市场外推要重新校准和验证。";
      } else if (model.value === "sir") {
        var sir = sirPoints(params.beta, params.gamma, params.sirInitial, params.sirHorizon);
        var peak = sir.reduce(function (best, point) { return point.i > best.i ? point : best; }, sir[0]);
        var totalDrift = Math.max.apply(null, sir.map(function (point) { return Math.abs(point.s + point.i + point.r - 1); }));
        var effectiveR = params.beta * (1 - params.sirInitial) / params.gamma;
        expected = effectiveR > 1 ? "outbreak" : "fade";
        svg = renderSirSvg(sir);
        rows = '<tr><th>有效阈值</th><td>βs₀/γ = ' + format(effectiveR) + '；峰值 i = ' + format(peak.i) + '</td></tr>' +
          '<tr><th>守恒</th><td>s+i+r = 1；数值漂移 ' + format(totalDrift) + '</td></tr>' +
          '<tr><th>参数可识别性</th><td>β 与 γ 需时间分辨率和干预信息才能分开</td></tr>' +
          '<tr><th>适用域</th><td>封闭、充分混合、固定参数的人群 toy</td></tr>';
        note = "网络结构、出生死亡、潜伏期和干预都会改变 SIR 的参数含义；轨迹不是个体级预言。";
      } else {
        var queue = queueMetrics(params.arrival, params.service);
        expected = queue.stable ? "stable" : "unstable";
        svg = renderQueueSvg(params.arrival, params.service);
        rows = '<tr><th>利用率 ρ</th><td>' + format(queue.rho) + '</td></tr>' +
          '<tr><th>稳态量</th><td>L = ' + format(queue.L) + '；W = ' + format(queue.W) + '</td></tr>' +
          '<tr><th>流量守恒</th><td>L − λW = ' + format(queue.flowError) + '</td></tr>' +
          '<tr><th>适用域</th><td>Poisson 到达、指数服务、单服务台且 ρ &lt; 1</td></tr>';
        note = queue.stable
          ? "ρ 接近 1 时等待发散；满负荷不是无代价的效率目标。"
          : "ρ ≥ 1 时不存在有限稳态，不能把 1/(μ−λ) 当作一个负数等待时间。";
      }
      var predictionText = prediction.value === expected ? "预测命中" : "预测需修正";
      result.innerHTML = '<div class="cml-grid"><div>' + svg + '</div><div>' +
        '<h4>' + predictionText + '：' + escapeHtml(PREDICTION_LABELS[expected]) + '</h4>' +
        '<div class="cml-table-wrap"><table><tbody>' +
        '<tr><th>模型</th><td>' + escapeHtml(model.options[model.selectedIndex].textContent) + '</td></tr>' + rows +
        '</tbody></table></div><p class="cml-note">' + escapeHtml(note) + ' 课堂 toy 用来暴露机制和边界，不能冒充真实预测。</p>' +
        '</div></div>';
    }

    model.addEventListener("change", function () {
      setPredictionOptions();
      updatePanels();
      prediction.value = "";
      result.hidden = true;
      result.innerHTML = "";
      render();
    });
    root.querySelector('[data-role="reveal"]').addEventListener("click", function () {
      if (!prediction.value) {
        prediction.focus();
        return;
      }
      result.hidden = false;
      render();
    });
    root.querySelector('[data-role="reset"]').addEventListener("click", function () {
      model.value = DEFAULTS.model;
      root.querySelector('[data-role="growth-rate"]').value = String(DEFAULTS.growth.rate);
      root.querySelector('[data-role="growth-capacity"]').value = String(DEFAULTS.growth.capacity);
      root.querySelector('[data-role="growth-initial"]').value = String(DEFAULTS.growth.initial);
      root.querySelector('[data-role="growth-horizon"]').value = String(DEFAULTS.growth.horizon);
      root.querySelector('[data-role="sir-beta"]').value = String(DEFAULTS.sir.beta);
      root.querySelector('[data-role="sir-gamma"]').value = String(DEFAULTS.sir.gamma);
      root.querySelector('[data-role="sir-initial"]').value = String(DEFAULTS.sir.initial);
      root.querySelector('[data-role="sir-horizon"]').value = String(DEFAULTS.sir.horizon);
      root.querySelector('[data-role="queue-arrival"]').value = String(DEFAULTS.queue.arrival);
      root.querySelector('[data-role="queue-service"]').value = String(DEFAULTS.queue.service);
      setPredictionOptions();
      updatePanels();
      prediction.value = "";
      result.hidden = true;
      result.innerHTML = "";
      render();
    });
    root.querySelectorAll('input[data-role]').forEach(function (control) {
      control.addEventListener("input", render);
      control.addEventListener("change", render);
    });
    setPredictionOptions();
    updatePanels();
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      assert(condition, message);
    }
    check(near(logisticValue(0, 0.35, 600, 80), 80), "logistic initial condition");
    check(logisticValue(20, 0.35, 600, 80) < 600, "logistic capacity boundary");
    check(growthPoints(0.35, 600, 80, 10).every(function (point) { return isFinite(point.t) && isFinite(point.n); }), "finite growth trace");
    var outbreak = sirPoints(0.6, 0.2, 0.02, 20);
    check(outbreak.every(function (point) { return near(point.s + point.i + point.r, 1, 1e-9); }), "SIR conservation");
    check(outbreak.some(function (point) { return point.i > 0.02; }), "SIR outbreak threshold");
    var stable = queueMetrics(0.8, 1);
    check(stable.stable && near(stable.L, 4) && near(stable.W, 5), "M/M/1 stable metrics");
    check(near(stable.flowError, 0), "Little flow conservation");
    check(!queueMetrics(1.1, 1).stable && !isFinite(queueMetrics(1.1, 1).W), "M/M/1 unstable boundary");
    var invalidQueue = false;
    try { queueMetrics(NaN, 1); } catch (error) { invalidQueue = error instanceof RangeError; }
    check(invalidQueue, "M/M/1 nonfinite input rejected");
    invalidQueue = false;
    try { queueMetrics(0.5, 0); } catch (error) { invalidQueue = error instanceof RangeError; }
    check(invalidQueue, "M/M/1 nonpositive service rejected");
    check(!near(logisticValue(10, 0.2, 400, 80), logisticValue(10, 0.2, 800, 80)), "capacity changes trajectory");
    return { checks: checks, presets: 3 };
  }

  return {
    mount: mount,
    logisticValue: logisticValue,
    sirPoints: sirPoints,
    queueMetrics: queueMetrics,
    selfTest: selfTest
  };
});
