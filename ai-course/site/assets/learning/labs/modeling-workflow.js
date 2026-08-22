(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("modeling-workflow", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("modeling-workflow self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("modeling-workflow self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var STYLE_ID = "cl-modeling-workflow-styles";
  var DATA = [120, 148, 182, 220, 260, 302, 345, 381, 410, 430];
  var DEFAULTS = { kind: "logistic", n: 5, horizon: 8, sensitivity: 1.1 };
  var LABELS = { logistic: "Logistic", exponential: "指数" };
  var PREDICTION_LABELS = { saturate: "开始饱和", continue: "继续增长", uncertain: "证据不足" };

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function near(a, b, tolerance) {
    return Math.abs(a - b) <= (tolerance || 1e-8);
  }

  function format(value, digits) {
    if (!isFinite(value)) return "∞";
    var places = digits === undefined ? 2 : digits;
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

  function linearFit(values, transform) {
    var n = values.length;
    var sx = 0;
    var sy = 0;
    var sxx = 0;
    var sxy = 0;
    values.forEach(function (value, index) {
      var y = transform ? transform(value) : value;
      sx += index;
      sy += y;
      sxx += index * index;
      sxy += index * y;
    });
    var denominator = n * sxx - sx * sx;
    var slope = denominator ? (n * sxy - sx * sy) / denominator : 0;
    var intercept = (sy - slope * sx) / n;
    return { intercept: intercept, slope: slope };
  }

  function sumSquaredError(values, predict) {
    return values.reduce(function (sum, value, index) {
      var residual = value - predict(index);
      return sum + residual * residual;
    }, 0);
  }

  function fitExponential(count) {
    var values = DATA.slice(0, count);
    var line = linearFit(values, function (value) { return Math.log(value); });
    var A = Math.exp(line.intercept);
    var growth = line.slope;
    var predict = function (time) { return A * Math.exp(growth * time); };
    return {
      kind: "exponential",
      count: count,
      A: A,
      growth: growth,
      predict: predict,
      sse: sumSquaredError(values, predict)
    };
  }

  function fitLogistic(count) {
    var values = DATA.slice(0, count);
    var maxValue = Math.max.apply(null, values);
    var minK = maxValue * 1.02;
    var maxK = Math.max(maxValue * 4, maxValue + 400);
    var best = null;
    for (var index = 0; index <= 360; index += 1) {
      var K = minK + (maxK - minK) * index / 360;
      var line = linearFit(values, function (value) { return Math.log(K / value - 1); });
      var rate = -line.slope;
      var C = Math.exp(line.intercept);
      var predict = (function (capacity, constant, growth) {
        return function (time) {
          return capacity / (1 + constant * Math.exp(-growth * time));
        };
      })(K, C, rate);
      var sse = sumSquaredError(values, predict);
      if (!best || sse < best.sse) best = { K: K, C: C, rate: rate, predict: predict, sse: sse };
    }
    best.kind = "logistic";
    best.count = count;
    best.initial = best.predict(0);
    return best;
  }

  function fitModel(kind, count) {
    return kind === "exponential" ? fitExponential(count) : fitLogistic(count);
  }

  function sensitivityModel(model, factor) {
    if (model.kind === "logistic") {
      var capacity = model.K * factor;
      var initial = Math.min(model.initial, capacity * 0.98);
      var constant = (capacity - initial) / initial;
      return {
        predict: function (time) { return capacity / (1 + constant * Math.exp(-model.rate * time)); },
        label: "K × " + format(factor)
      };
    }
    return {
      predict: function (time) { return model.A * Math.exp(model.growth * factor * time); },
      label: "增长率 × " + format(factor)
    };
  }

  function rmse(model, count) {
    var holdout = DATA.slice(count);
    if (!holdout.length) return 0;
    return Math.sqrt(holdout.reduce(function (sum, value, index) {
      var residual = value - model.predict(count + index);
      return sum + residual * residual;
    }, 0) / holdout.length);
  }

  function classifyPrediction(model, count, validationRmse, futureValue) {
    var holdoutMean = DATA.slice(count).reduce(function (sum, value) { return sum + value; }, 0) / Math.max(1, DATA.length - count);
    if (count <= 4 || validationRmse > holdoutMean * 0.2) return "uncertain";
    var relativeGrowth = (futureValue - DATA[DATA.length - 1]) / DATA[DATA.length - 1];
    return relativeGrowth < 0.18 ? "saturate" : "continue";
  }

  function pathFor(predict, end, mapX, mapY) {
    var points = [];
    var samples = 80;
    for (var index = 0; index <= samples; index += 1) {
      var time = end * index / samples;
      points.push((index ? "L" : "M") + mapX(time).toFixed(2) + " " + mapY(predict(time)).toFixed(2));
    }
    return points.join(" ");
  }

  function renderSvg(model, count, horizon, sensitivity) {
    var end = DATA.length - 1 + horizon;
    var lowerFactor = Math.min(sensitivity, 2 - sensitivity);
    var upperFactor = Math.max(sensitivity, 2 - sensitivity);
    var lower = sensitivityModel(model, lowerFactor);
    var upper = sensitivityModel(model, upperFactor);
    var maximum = Math.max.apply(null, DATA.concat([model.predict(end), lower.predict(end), upper.predict(end)]));
    var maxY = Math.max(100, maximum * 1.12);
    function mapX(time) { return 48 + 536 * time / end; }
    function mapY(value) { return 286 - 232 * value / maxY; }
    var actual = DATA.map(function (value, index) {
      var color = index < count ? "#347247" : "#95670d";
      return '<circle cx="' + mapX(index).toFixed(2) + '" cy="' + mapY(value).toFixed(2) + '" r="4" fill="' + color + '"/>';
    }).join("");
    return '<svg viewBox="0 0 620 330" role="img" aria-label="校准曲线、留出数据与外推敏感性">' +
      '<line x1="48" y1="286" x2="584" y2="286" stroke="currentColor"/><line x1="48" y1="286" x2="48" y2="38" stroke="currentColor"/>' +
      '<path d="' + pathFor(lower.predict, end, mapX, mapY) + '" fill="none" stroke="#95670d" stroke-width="2" stroke-dasharray="6 5" opacity=".75"/>' +
      '<path d="' + pathFor(upper.predict, end, mapX, mapY) + '" fill="none" stroke="#95670d" stroke-width="2" stroke-dasharray="6 5" opacity=".75"/>' +
      '<path d="' + pathFor(model.predict, end, mapX, mapY) + '" fill="none" stroke="#315f9d" stroke-width="3"/>' +
      actual +
      '<line x1="' + mapX(count - 0.5).toFixed(2) + '" y1="42" x2="' + mapX(count - 0.5).toFixed(2) + '" y2="286" stroke="#b13d32" stroke-dasharray="4 5"/>' +
      '<text x="58" y="27" fill="currentColor">蓝：拟合　绿：校准数据　橙：留出数据　虚线：敏感性</text>' +
      '<text x="556" y="305">t</text><text x="28" y="48">y</text>' +
      '</svg>';
  }

  function ensureStyles() {
    if (!host || !host.document || host.document.getElementById(STYLE_ID)) return;
    var style = host.document.createElement("style");
    style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="modeling-workflow"] .mwf-lab{--mwf-blue:#315f9d;--mwf-gold:#95670d;--mwf-red:#b13d32;--mwf-green:#347247;max-width:100%;min-width:0;color:var(--fg);line-height:1.55}' +
      '[data-learning-lab="modeling-workflow"] .mwf-lab *{box-sizing:border-box}' +
      '[data-learning-lab="modeling-workflow"] .mwf-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;align-items:end}' +
      '[data-learning-lab="modeling-workflow"] label{display:grid;gap:6px;font-weight:700}' +
      '[data-learning-lab="modeling-workflow"] input,[data-learning-lab="modeling-workflow"] select,[data-learning-lab="modeling-workflow"] button{min-height:44px;font:inherit}' +
      '[data-learning-lab="modeling-workflow"] input{width:100%}' +
      '[data-learning-lab="modeling-workflow"] select{width:100%;padding:8px}' +
      '[data-learning-lab="modeling-workflow"] button{border:1px solid currentColor;background:transparent;color:inherit;padding:8px 14px;cursor:pointer}' +
      '[data-learning-lab="modeling-workflow"] button:hover,[data-learning-lab="modeling-workflow"] button:focus-visible{border-color:var(--accent)}' +
      '[data-learning-lab="modeling-workflow"] .mwf-primary{background:var(--mwf-blue);border-color:var(--mwf-blue);color:white}' +
      '[data-learning-lab="modeling-workflow"] .mwf-question{margin:16px 0 8px;font-weight:700}' +
      '[data-learning-lab="modeling-workflow"] .mwf-actions{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}' +
      '[data-learning-lab="modeling-workflow"] .mwf-result[hidden]{display:none}' +
      '[data-learning-lab="modeling-workflow"] .mwf-grid{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(250px,.8fr);gap:16px;align-items:start}' +
      '[data-learning-lab="modeling-workflow"] svg{display:block;width:100%;height:auto;aspect-ratio:620/330;border:1px solid color-mix(in srgb,currentColor 22%,transparent);background:color-mix(in srgb,Canvas 94%,var(--mwf-blue) 6%)}' +
      '[data-learning-lab="modeling-workflow"] .mwf-table-wrap{overflow-x:auto}' +
      '[data-learning-lab="modeling-workflow"] table{width:100%;border-collapse:collapse}' +
      '[data-learning-lab="modeling-workflow"] th,[data-learning-lab="modeling-workflow"] td{padding:8px;border-bottom:1px solid color-mix(in srgb,currentColor 20%,transparent);text-align:left;vertical-align:top}' +
      '[data-learning-lab="modeling-workflow"] .mwf-note{border-left:4px solid var(--mwf-gold);padding-left:12px;color:var(--fg-soft);font-size:13px}' +
      '@media(max-width:820px){[data-learning-lab="modeling-workflow"] .mwf-controls{grid-template-columns:repeat(2,minmax(0,1fr))}}' +
      '@media(max-width:620px){[data-learning-lab="modeling-workflow"] .mwf-controls,[data-learning-lab="modeling-workflow"] .mwf-grid{grid-template-columns:1fr}}';
    host.document.head.appendChild(style);
  }

  function mount(root) {
    ensureStyles();
    root.innerHTML =
      '<div class="mwf-lab">' +
      '<div class="mwf-controls">' +
      '<label>候选模型<select data-role="kind"><option value="logistic">Logistic</option><option value="exponential">指数增长</option></select></label>' +
      '<label>校准点数 n = <output data-role="n-output">5</output><input data-role="n" type="range" min="3" max="8" step="1" value="5"></label>' +
      '<label>外推步数 = <output data-role="horizon-output">8</output><input data-role="horizon" type="range" min="2" max="14" step="1" value="8"></label>' +
      '<label>敏感性倍率 = <output data-role="sensitivity-output">1.1</output><input data-role="sensitivity" type="range" min="0.8" max="1.2" step="0.05" value="1.1"></label>' +
      '</div>' +
      '<p class="mwf-question">揭示前预测：留出与外推阶段更像哪种行为？</p>' +
      '<label>行为预测<select data-role="prediction"><option value="">请选择</option><option value="saturate">开始饱和</option><option value="continue">继续增长</option><option value="uncertain">证据不足</option></select></label>' +
      '<div class="mwf-actions"><button class="mwf-primary" type="button" data-role="reveal">揭示工作流</button><button type="button" data-role="reset">重置</button></div>' +
      '<div class="mwf-result" data-role="result" hidden aria-live="polite"></div>' +
      '</div>';

    var kind = root.querySelector('[data-role="kind"]');
    var n = root.querySelector('[data-role="n"]');
    var horizon = root.querySelector('[data-role="horizon"]');
    var sensitivity = root.querySelector('[data-role="sensitivity"]');
    var prediction = root.querySelector('[data-role="prediction"]');
    var result = root.querySelector('[data-role="result"]');

    function render() {
      n.value = String(Math.max(3, Math.min(8, Number(n.value))));
      horizon.value = String(Math.max(2, Math.min(14, Number(horizon.value))));
      sensitivity.value = String(Math.max(0.8, Math.min(1.2, Number(sensitivity.value))));
      root.querySelector('[data-role="n-output"]').textContent = n.value;
      root.querySelector('[data-role="horizon-output"]').textContent = horizon.value;
      root.querySelector('[data-role="sensitivity-output"]').textContent = Number(sensitivity.value).toFixed(2).replace(/0$/, "");
      if (result.hidden) return;
      var count = Number(n.value);
      var windowSize = Number(horizon.value);
      var factor = Number(sensitivity.value);
      var model = fitModel(kind.value, count);
      var validation = rmse(model, count);
      var futureTime = DATA.length - 1 + windowSize;
      var future = model.predict(futureTime);
      var expected = classifyPrediction(model, count, validation, future);
      var lowerFactor = Math.min(factor, 2 - factor);
      var upperFactor = Math.max(factor, 2 - factor);
      var low = sensitivityModel(model, lowerFactor).predict(futureTime);
      var high = sensitivityModel(model, upperFactor).predict(futureTime);
      var predictionText = prediction.value === expected ? "预测命中" : "预测需修正";
      var parameterText = model.kind === "logistic"
        ? "K=" + format(model.K) + ", r=" + format(model.rate, 4)
        : "A=" + format(model.A) + ", r=" + format(model.growth, 4);
      result.innerHTML =
        '<div class="mwf-grid"><div>' + renderSvg(model, count, windowSize, factor) + '</div><div>' +
        '<h4>' + predictionText + '：' + escapeHtml(PREDICTION_LABELS[expected]) + '</h4>' +
        '<div class="mwf-table-wrap"><table><tbody>' +
        '<tr><th>问题定义</th><td>预测 t=' + futureTime + ' 的观测量</td></tr>' +
        '<tr><th>模型与假设</th><td>' + escapeHtml(LABELS[model.kind]) + '；固定机制、同一量纲、无外部干预</td></tr>' +
        '<tr><th>校准</th><td>前 ' + count + ' 个点；' + escapeHtml(parameterText) + '</td></tr>' +
        '<tr><th>留出 RMSE</th><td>' + format(validation) + '</td></tr>' +
        '<tr><th>外推预测</th><td>' + format(future) + '；敏感性区间 ' + format(low) + ' 至 ' + format(high) + '</td></tr>' +
        '<tr><th>敏感性</th><td>' + escapeHtml(sensitivityModel(model, factor).label) + '；区间随倍率变化</td></tr>' +
        '</tbody></table></div>' +
        '<p class="mwf-note">留出验证只检验当前数据域的预测误差；外推超出观测范围后，容量、增长率、制度或季节假设都可能失效。拟合不等于解释，曲线也不自动给出因果。</p>' +
        '</div></div>';
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
      kind.value = DEFAULTS.kind;
      n.value = String(DEFAULTS.n);
      horizon.value = String(DEFAULTS.horizon);
      sensitivity.value = String(DEFAULTS.sensitivity);
      prediction.value = "";
      result.hidden = true;
      result.innerHTML = "";
      render();
    });
    [kind, n, horizon, sensitivity].forEach(function (control) {
      control.addEventListener("input", function () {
        if (control === kind) result.hidden = true;
        render();
      });
      control.addEventListener("change", function () {
        if (control === kind) result.hidden = true;
        render();
      });
    });
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      assert(condition, message);
    }
    var logistic = fitLogistic(5);
    var exponential = fitExponential(5);
    check(isFinite(logistic.K) && logistic.K > Math.max.apply(null, DATA.slice(0, 5)), "logistic capacity fit");
    check(isFinite(exponential.A) && exponential.A > 0, "exponential fit");
    check(logistic.predict(0) > 0 && exponential.predict(0) > 0, "positive initial predictions");
    check(rmse(logistic, 5) >= 0 && rmse(exponential, 5) >= 0, "validation metric");
    check(!near(logistic.predict(15), logistic.predict(5)), "forecast horizon changes prediction");
    check(!near(sensitivityModel(logistic, 0.8).predict(15), sensitivityModel(logistic, 1.2).predict(15)), "sensitivity changes forecast");
    check(classifyPrediction(logistic, 3, 0, logistic.predict(15)) === "uncertain", "early calibration boundary");
    check(DATA.length === 10, "fixed holdout data");
    return { checks: checks, presets: 2 };
  }

  return {
    mount: mount,
    fitModel: fitModel,
    fitLogistic: fitLogistic,
    fitExponential: fitExponential,
    sensitivityModel: sensitivityModel,
    selfTest: selfTest
  };
});
