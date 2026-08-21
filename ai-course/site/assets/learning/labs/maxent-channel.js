(function (root, factory) {
  "use strict";

  var exported = factory(root);

  if (typeof module === "object" && module.exports) {
    module.exports = exported;
  }

  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("maxent-channel", exported.mount);
  }

  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log("maxent-channel self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("maxent-channel self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var STYLE_ID = "cl-maxent-channel-styles";
  var INSTANCE = 0;
  var SUPPORT = [0, 1, 2, 3];
  var EPS = 1e-11;

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function near(left, right, tolerance) {
    var scale = Math.max(1, Math.abs(left), Math.abs(right));
    return Math.abs(left - right) <= (tolerance || 1e-9) * scale;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value)));
  }

  function log2(value) {
    return Math.log(value) / Math.log(2);
  }

  function binaryEntropy(probability) {
    var p = clamp(probability, 0, 1);
    if (p <= EPS || p >= 1 - EPS) return 0;
    return -p * log2(p) - (1 - p) * log2(1 - p);
  }

  function entropy(probabilities) {
    return probabilities.reduce(function (total, probability) {
      return probability > EPS ? total - probability * log2(probability) : total;
    }, 0);
  }

  function exponentialDistribution(lambda) {
    var weights = SUPPORT.map(function (value) { return Math.exp(lambda * value); });
    var normalizer = weights.reduce(function (sum, value) { return sum + value; }, 0);
    return weights.map(function (value) { return value / normalizer; });
  }

  function expectedValue(probabilities) {
    return probabilities.reduce(function (sum, probability, index) {
      return sum + probability * SUPPORT[index];
    }, 0);
  }

  function maxEntropyForMean(targetMean) {
    var mean = clamp(targetMean, SUPPORT[0], SUPPORT[SUPPORT.length - 1]);
    if (mean <= EPS) {
      return { mean: 0, lambda: -Infinity, probabilities: [1, 0, 0, 0], entropy: 0 };
    }
    if (mean >= 3 - EPS) {
      return { mean: 3, lambda: Infinity, probabilities: [0, 0, 0, 1], entropy: 0 };
    }

    var low = -40;
    var high = 40;
    for (var iteration = 0; iteration < 100; iteration += 1) {
      var midpoint = (low + high) / 2;
      var midpointMean = expectedValue(exponentialDistribution(midpoint));
      if (midpointMean < mean) low = midpoint;
      else high = midpoint;
    }
    var lambda = (low + high) / 2;
    var probabilities = exponentialDistribution(lambda);
    return {
      mean: expectedValue(probabilities),
      lambda: lambda,
      probabilities: probabilities,
      entropy: entropy(probabilities)
    };
  }

  function bscStats(inputOneProbability, crossoverProbability) {
    var q = clamp(inputOneProbability, 0, 1);
    var epsilon = clamp(crossoverProbability, 0, 0.5);
    var outputOne = epsilon + q * (1 - 2 * epsilon);
    var conditionalEntropy = binaryEntropy(epsilon);
    var mutualInformation = binaryEntropy(outputOne) - conditionalEntropy;
    var capacity = 1 - conditionalEntropy;
    return {
      q: q,
      epsilon: epsilon,
      outputOne: outputOne,
      conditionalEntropy: conditionalEntropy,
      mutualInformation: Math.max(0, mutualInformation),
      capacity: capacity,
      gap: Math.max(0, capacity - mutualInformation)
    };
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      assert(condition, message);
    }

    var uniform = maxEntropyForMean(1.5);
    check(near(uniform.lambda, 0, 1e-8), "mean 1.5 should have lambda zero");
    uniform.probabilities.forEach(function (probability) {
      check(near(probability, 0.25), "mean 1.5 should be uniform");
    });
    check(near(uniform.entropy, 2), "uniform entropy should be two bits");

    [0.25, 0.8, 1.2, 2.2, 2.75].forEach(function (mean) {
      var result = maxEntropyForMean(mean);
      check(near(result.mean, mean, 1e-8), "mean constraint must be met");
      check(near(result.probabilities.reduce(function (a, b) { return a + b; }, 0), 1), "probabilities sum to one");
      check(result.probabilities.every(function (p) { return p >= 0 && p <= 1; }), "probabilities stay valid");
    });

    check(near(maxEntropyForMean(0).entropy, 0), "endpoint mean zero is deterministic");
    check(near(maxEntropyForMean(3).entropy, 0), "endpoint mean three is deterministic");

    [0, 0.05, 0.1, 0.25, 0.5].forEach(function (epsilon) {
      var symmetric = bscStats(0.5, epsilon);
      check(near(symmetric.mutualInformation, symmetric.capacity), "uniform input reaches BSC capacity");
      check(near(symmetric.capacity, 1 - binaryEntropy(epsilon)), "capacity formula");
      check(symmetric.mutualInformation >= -EPS, "mutual information nonnegative");
    });
    check(near(bscStats(0, 0.1).mutualInformation, 0), "constant input carries no information");
    check(near(bscStats(1, 0.1).mutualInformation, 0), "other constant input carries no information");
    check(near(bscStats(0.2, 0.13).mutualInformation, bscStats(0.8, 0.13).mutualInformation), "BSC input symmetry");
    check(near(bscStats(0.5, 0.5).capacity, 0), "pure-noise BSC has zero capacity");

    return { checks: checks };
  }

  var STYLE_TEXT = [
    ".mec-lab{--mec-blue:var(--cl-blue,#315f9d);--mec-gold:var(--cl-gold,#9b6a12);--mec-green:var(--cl-green,#39734d);--mec-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;}",
    ".mec-lab *,.mec-lab *::before,.mec-lab *::after{box-sizing:border-box;}",
    ".mec-lab [hidden]{display:none!important;}",
    ".mec-lab button,.mec-lab input{font:inherit;}",
    ".mec-lab button{min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);line-height:1.35;cursor:pointer;overflow-wrap:anywhere;}",
    ".mec-lab button:hover{border-color:var(--accent);}.mec-lab button:focus-visible,.mec-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}",
    ".mec-lab button[aria-pressed=true],.mec-lab .mec-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750;}",
    ".mec-lab fieldset{min-width:0;margin:0;padding:0;border:0}.mec-lab legend{margin-bottom:8px;color:var(--fg-soft);font-size:13px;font-weight:750;}",
    ".mec-lab .mec-questions{display:grid;gap:10px}.mec-lab .mec-question{padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg);}",
    ".mec-lab .mec-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:7px}.mec-lab .mec-choices button{font-size:12px;}",
    ".mec-lab .mec-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.mec-lab .mec-actions>*{flex:1 1 180px;}",
    ".mec-lab .mec-feedback{min-height:2em;margin:8px 0;color:var(--fg-soft);font-size:13px;font-weight:700}.mec-lab .mec-pass{color:var(--mec-green)}.mec-lab .mec-warn{color:var(--mec-red)}",
    ".mec-lab .mec-reveal{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}",
    ".mec-lab .mec-layout{display:grid;grid-template-columns:minmax(220px,.72fr) minmax(0,1.28fr);gap:16px;align-items:start;min-width:0}",
    ".mec-lab .mec-controls{display:grid;gap:12px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg)}",
    ".mec-lab .mec-control{display:grid;gap:4px;min-width:0}.mec-lab label{color:var(--fg-soft);font-size:13px;font-weight:700}.mec-lab output{color:var(--accent);font-variant-numeric:tabular-nums}",
    ".mec-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent)}",
    ".mec-lab .mec-stage{min-width:0;padding:9px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden}",
    ".mec-lab svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg)}.mec-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}",
    ".mec-lab .mec-grid{stroke:var(--border);stroke-width:1}.mec-lab .mec-curve{fill:none;stroke:var(--mec-blue);stroke-width:3}.mec-lab .mec-cap{fill:none;stroke:var(--mec-gold);stroke-width:2;stroke-dasharray:6 5}.mec-lab .mec-point{fill:var(--mec-red);stroke:var(--bg);stroke-width:2}",
    ".mec-lab .mec-bars{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;align-items:end;height:150px;margin:8px 0 14px}.mec-lab .mec-bar-wrap{display:grid;grid-template-rows:1fr auto;gap:5px;height:100%;text-align:center;font-size:12px}.mec-lab .mec-bar{align-self:end;min-height:2px;background:var(--mec-blue);border-radius:4px 4px 0 0}",
    ".mec-lab .mec-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:10px 0}.mec-lab .mec-metric{padding:8px;border-top:2px solid var(--border);background:var(--bg)}.mec-lab .mec-metric span{display:block;color:var(--fg-soft);font-size:11.5px}.mec-lab .mec-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".mec-lab .mec-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}.mec-lab table{width:100%;min-width:560px;border-collapse:collapse;font-size:12px}.mec-lab th,.mec-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}.mec-lab th{color:var(--fg-soft)}",
    ".mec-lab .mec-note{margin-top:10px;padding:10px 12px;border-left:3px solid var(--mec-green);background:var(--bg);font-size:13px;line-height:1.65}",
    "@media(max-width:900px){.mec-lab .mec-layout{grid-template-columns:minmax(0,1fr)}}",
    "@media(max-width:700px){.mec-lab .mec-choices{grid-template-columns:minmax(0,1fr)}}"
  ].join("\n");

  function injectStyles(documentObject) {
    if (!documentObject || documentObject.getElementById(STYLE_ID)) return;
    var style = documentObject.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    documentObject.head.appendChild(style);
  }

  function format(value, digits) {
    if (!isFinite(value)) return value < 0 ? "−∞" : "+∞";
    return Number(value).toFixed(digits == null ? 3 : digits);
  }

  function linePath(values, width, height, xPadding, yPadding, maximum) {
    return values.map(function (value, index) {
      var x = xPadding + (width - 2 * xPadding) * index / (values.length - 1);
      var y = height - yPadding - (height - 2 * yPadding) * value / Math.max(maximum, EPS);
      return (index ? "L" : "M") + x.toFixed(2) + " " + y.toFixed(2);
    }).join(" ");
  }

  function mount(container) {
    if (!container || container.getAttribute("data-mec-mounted") === "true") return;
    container.setAttribute("data-mec-mounted", "true");
    injectStyles(container.ownerDocument);
    INSTANCE += 1;
    var prefix = "mec-" + INSTANCE;
    var selected = [null, null, null];

    container.innerHTML = [
      '<div class="mec-lab">',
      '<h3>最大熵与 BSC：约束、输入和容量不要混成一个数</h3>',
      '<p class="mec-note">先回答三道边界题。提交前，分布、互信息曲线和容量差都保持隐藏。</p>',
      '<fieldset><legend>预测区</legend><div class="mec-questions">',
      '<div class="mec-question" data-question="0"><strong>1. 最大熵分布说明什么？</strong><div class="mec-choices"><button type="button" data-choice="0">数据必由该机制生成</button><button type="button" data-choice="1">给定约束下不额外偏置</button><button type="button" data-choice="2">任何约束都给均匀分布</button></div></div>',
      '<div class="mec-question" data-question="1"><strong>2. 速率低于容量意味着单次传输零错误吗？</strong><div class="mec-choices"><button type="button" data-choice="0">是，单次就无误码</button><button type="button" data-choice="1">否，是长块存在性结论</button><button type="button" data-choice="2">只与输入 1 的概率有关</button></div></div>',
      '<div class="mec-question" data-question="2"><strong>3. BSC 的容量由哪种输入达到？</strong><div class="mec-choices"><button type="button" data-choice="0">恒取 0</button><button type="button" data-choice="1">任意输入都一样</button><button type="button" data-choice="2">均匀二元输入</button></div></div>',
      '</div></fieldset>',
      '<div class="mec-actions"><button class="mec-primary" type="button" data-action="submit">提交预测并揭示</button><button type="button" data-action="reset">重置</button></div>',
      '<p class="mec-feedback" role="status" aria-live="polite"></p>',
      '<div class="mec-reveal" hidden>',
      '<div class="mec-layout"><div class="mec-controls">',
      '<div class="mec-control"><label for="' + prefix + '-mean">有限支撑均值约束 m：<output data-output="mean">1.50</output></label><input id="' + prefix + '-mean" data-input="mean" type="range" min="0" max="3" step="0.05" value="1.5"></div>',
      '<div class="mec-control"><label for="' + prefix + '-eps">BSC 翻转率 ε：<output data-output="eps">0.10</output></label><input id="' + prefix + '-eps" data-input="eps" type="range" min="0" max="0.5" step="0.01" value="0.1"></div>',
      '<div class="mec-control"><label for="' + prefix + '-q">输入概率 q=P(X=1)：<output data-output="q">0.50</output></label><input id="' + prefix + '-q" data-input="q" type="range" min="0" max="1" step="0.01" value="0.5"></div>',
      '<div class="mec-actions"><button type="button" data-preset="uniform">均匀输入</button><button type="button" data-preset="biased">偏置输入</button></div>',
      '<div class="mec-bars" aria-label="最大熵分布柱状图"></div>',
      '</div><div class="mec-stage">',
      '<svg viewBox="0 0 620 300" role="img" aria-labelledby="' + prefix + '-title ' + prefix + '-desc"><title id="' + prefix + '-title">BSC 互信息随输入分布变化</title><desc id="' + prefix + '-desc">实线是互信息，虚线是容量，红点是当前输入概率。</desc><g data-svg></g></svg>',
      '<div class="mec-metrics" data-metrics></div>',
      '<div class="mec-table-wrap"><table><thead><tr><th>账本项</th><th>当前值</th><th>能说明什么</th></tr></thead><tbody data-ledger></tbody></table></div>',
      '<p class="mec-note" data-interpretation></p>',
      '</div></div></div></div>'
    ].join("");

    var lab = container.querySelector(".mec-lab");
    var reveal = lab.querySelector(".mec-reveal");
    var feedback = lab.querySelector(".mec-feedback");
    var inputs = {
      mean: lab.querySelector('[data-input="mean"]'),
      eps: lab.querySelector('[data-input="eps"]'),
      q: lab.querySelector('[data-input="q"]')
    };

    function render() {
      var maxent = maxEntropyForMean(inputs.mean.value);
      var stats = bscStats(inputs.q.value, inputs.eps.value);
      lab.querySelector('[data-output="mean"]').textContent = format(maxent.mean, 2);
      lab.querySelector('[data-output="eps"]').textContent = format(stats.epsilon, 2);
      lab.querySelector('[data-output="q"]').textContent = format(stats.q, 2);

      lab.querySelector(".mec-bars").innerHTML = maxent.probabilities.map(function (probability, index) {
        return '<div class="mec-bar-wrap"><div class="mec-bar" style="height:' + Math.max(2, probability * 120).toFixed(1) + 'px" title="p=' + format(probability, 3) + '"></div><span>x=' + SUPPORT[index] + '<br>' + format(probability, 3) + '</span></div>';
      }).join("");

      var width = 620;
      var height = 300;
      var padX = 48;
      var padY = 34;
      var values = [];
      for (var index = 0; index <= 100; index += 1) values.push(bscStats(index / 100, stats.epsilon).mutualInformation);
      var path = linePath(values, width, height, padX, padY, Math.max(stats.capacity, 0.02));
      var pointX = padX + (width - 2 * padX) * stats.q;
      var pointY = height - padY - (height - 2 * padY) * stats.mutualInformation / Math.max(stats.capacity, 0.02);
      var capY = height - padY - (height - 2 * padY) * stats.capacity / Math.max(stats.capacity, 0.02);
      lab.querySelector("[data-svg]").innerHTML = [
        '<line class="mec-grid" x1="48" y1="266" x2="572" y2="266"></line>',
        '<line class="mec-grid" x1="48" y1="34" x2="48" y2="266"></line>',
        '<path class="mec-curve" d="' + path + '"></path>',
        '<line class="mec-cap" x1="48" y1="' + capY.toFixed(2) + '" x2="572" y2="' + capY.toFixed(2) + '"></line>',
        '<circle class="mec-point" cx="' + pointX.toFixed(2) + '" cy="' + pointY.toFixed(2) + '" r="6"></circle>',
        '<text x="48" y="288" font-size="12">q=0</text><text x="548" y="288" font-size="12">q=1</text>',
        '<text x="58" y="50" font-size="12">I(X;Y), C</text>',
        '<text x="390" y="' + Math.max(18, capY - 7).toFixed(2) + '" font-size="12">C=' + format(stats.capacity, 3) + ' bit/use</text>'
      ].join("");

      lab.querySelector("[data-metrics]").innerHTML = [
        ["H(p*)", format(maxent.entropy, 3) + " bit"],
        ["约束残差", format(Math.abs(maxent.mean - Number(inputs.mean.value)), 8)],
        ["I(X;Y)", format(stats.mutualInformation, 3) + " bit/use"],
        ["容量差 C−I", format(stats.gap, 3) + " bit/use"]
      ].map(function (entry) { return '<div class="mec-metric"><span>' + entry[0] + '</span><strong>' + entry[1] + '</strong></div>'; }).join("");

      lab.querySelector("[data-ledger]").innerHTML = [
        ["最大熵约束", "E[X]=" + format(maxent.mean, 3) + ", λ=" + format(maxent.lambda, 3), "只在支撑 {0,1,2,3} 与该均值约束内发证"],
        ["输出边缘", "P(Y=1)=" + format(stats.outputOne, 3), "由输入偏置与翻转率共同决定"],
        ["条件熵", "H(Y|X)=h₂(ε)=" + format(stats.conditionalEntropy, 3), "BSC 每次使用的噪声不确定性"],
        ["容量", "C=1−h₂(ε)=" + format(stats.capacity, 3), "长块可靠通信的渐近速率上限"]
      ].map(function (row) { return "<tr><td>" + row[0] + "</td><td>" + row[1] + "</td><td>" + row[2] + "</td></tr>"; }).join("");

      lab.querySelector("[data-interpretation]").textContent = stats.gap < 1e-8
        ? "当前均匀输入达到了这条 BSC 的容量；这仍不是单次零误码保证，而是允许块长趋大时存在低误码码族。"
        : "当前输入有偏，输出熵没有最大化，因此互信息低于容量；容量优化的是输入分布，不是修改信道噪声。";
    }

    lab.addEventListener("click", function (event) {
      var choice = event.target.closest("button[data-choice]");
      if (choice) {
        var question = choice.closest("[data-question]");
        var questionIndex = Number(question.getAttribute("data-question"));
        selected[questionIndex] = Number(choice.getAttribute("data-choice"));
        question.querySelectorAll("button[data-choice]").forEach(function (button) { button.setAttribute("aria-pressed", button === choice ? "true" : "false"); });
        return;
      }

      var action = event.target.closest("button[data-action]");
      if (action && action.getAttribute("data-action") === "submit") {
        if (selected.some(function (value) { return value == null; })) {
          feedback.className = "mec-feedback mec-warn";
          feedback.textContent = "请先完成三项预测。";
          return;
        }
        var correct = [1, 1, 2];
        var score = selected.reduce(function (sum, value, index) { return sum + (value === correct[index] ? 1 : 0); }, 0);
        feedback.className = "mec-feedback " + (score === 3 ? "mec-pass" : "mec-warn");
        feedback.textContent = "预测 " + score + "/3。现在用同一份约束与信道账本核对。";
        reveal.hidden = false;
        render();
        return;
      }
      if (action && action.getAttribute("data-action") === "reset") {
        selected = [null, null, null];
        lab.querySelectorAll("button[data-choice]").forEach(function (button) { button.removeAttribute("aria-pressed"); });
        inputs.mean.value = "1.5";
        inputs.eps.value = "0.1";
        inputs.q.value = "0.5";
        reveal.hidden = true;
        feedback.className = "mec-feedback";
        feedback.textContent = "";
        return;
      }
      var preset = event.target.closest("button[data-preset]");
      if (preset) {
        if (preset.getAttribute("data-preset") === "uniform") inputs.q.value = "0.5";
        else inputs.q.value = "0.12";
        render();
      }
    });

    Object.keys(inputs).forEach(function (key) { inputs[key].addEventListener("input", render); });
  }

  return {
    SUPPORT: SUPPORT.slice(),
    binaryEntropy: binaryEntropy,
    entropy: entropy,
    maxEntropyForMean: maxEntropyForMean,
    bscStats: bscStats,
    mount: mount,
    selfTest: selfTest
  };
});
