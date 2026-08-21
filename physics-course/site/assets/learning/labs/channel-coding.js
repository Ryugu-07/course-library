(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("channel-coding", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("channel-coding self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("channel-coding self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var STYLE_ID = "cl-channel-coding-styles";
  var INSTANCE = 0;
  var EPS = 1e-12;

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function near(left, right, tolerance) {
    return Math.abs(left - right) <= (tolerance || 1e-10) * Math.max(1, Math.abs(left), Math.abs(right));
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value)));
  }

  function log2(value) {
    return Math.log(value) / Math.log(2);
  }

  function binaryEntropy(p) {
    var probability = clamp(p, 0, 1);
    if (probability <= EPS || probability >= 1 - EPS) return 0;
    return -probability * log2(probability) - (1 - probability) * log2(1 - probability);
  }

  function bscCapacity(epsilon) {
    return 1 - binaryEntropy(clamp(epsilon, 0, 0.5));
  }

  function binomialCoefficient(n, k) {
    var m = Math.min(k, n - k);
    var result = 1;
    for (var index = 1; index <= m; index += 1) result = result * (n - m + index) / index;
    return result;
  }

  function repetitionError(blockLength, epsilon) {
    var n = Math.max(1, Math.round(Number(blockLength)));
    if (n % 2 === 0) n += 1;
    var p = clamp(epsilon, 0, 0.5);
    var error = 0;
    for (var flips = (n + 1) / 2; flips <= n; flips += 1) {
      error += binomialCoefficient(n, flips) * Math.pow(p, flips) * Math.pow(1 - p, n - flips);
    }
    return error;
  }

  function hamming(left, right) {
    var distance = 0;
    for (var index = 0; index < left.length; index += 1) if (left[index] !== right[index]) distance += 1;
    return distance;
  }

  function binaryWord(value, length) {
    var word = value.toString(2);
    return new Array(length - word.length + 1).join("0") + word;
  }

  function exactNearestNeighborError(codebook, epsilon) {
    assert(Array.isArray(codebook) && codebook.length > 0, "codebook required");
    var n = codebook[0].length;
    assert(codebook.every(function (word) { return typeof word === "string" && word.length === n && /^[01]+$/.test(word); }), "binary equal-length words required");
    var p = clamp(epsilon, 0, 0.5);
    var success = 0;
    codebook.forEach(function (sent, sentIndex) {
      for (var value = 0; value < Math.pow(2, n); value += 1) {
        var received = binaryWord(value, n);
        var flips = hamming(sent, received);
        var probability = Math.pow(p, flips) * Math.pow(1 - p, n - flips);
        var distances = codebook.map(function (word) { return hamming(word, received); });
        var minimum = Math.min.apply(null, distances);
        var winners = [];
        distances.forEach(function (distance, index) { if (distance === minimum) winners.push(index); });
        if (winners.indexOf(sentIndex) >= 0) success += probability / winners.length / codebook.length;
      }
    });
    return 1 - success;
  }

  function exponentRace(blockLength, rate, epsilon, slack) {
    var n = Math.max(1, Math.round(Number(blockLength)));
    var R = Math.max(0, Number(rate));
    var C = bscCapacity(epsilon);
    var delta = Math.max(0, Number(slack) || 0);
    var exponent = C - R - delta;
    var surrogate = exponent > 0 ? Math.pow(2, -n * exponent) : 1;
    return { n: n, rate: R, capacity: C, slack: delta, exponent: exponent, surrogate: Math.min(1, surrogate), belowCapacity: R < C };
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }

    check(near(repetitionError(1, 0.1), 0.1), "length-one repetition error");
    check(near(repetitionError(3, 0.1), 0.028), "length-three repetition error");
    check(near(repetitionError(5, 0.1), 0.00856), "length-five repetition error");
    [1, 3, 5, 7, 9, 11].forEach(function (n) {
      check(near(repetitionError(n, 0), 0), "zero-noise repetition");
      check(near(repetitionError(n, 0.5), 0.5), "pure-noise repetition");
    });
    check(repetitionError(7, 0.1) < repetitionError(5, 0.1), "repetition improves with odd n below half noise");

    var rep3 = ["000", "111"];
    check(near(exactNearestNeighborError(rep3, 0.1), repetitionError(3, 0.1)), "exact decoder matches repetition formula");
    check(near(exactNearestNeighborError(rep3, 0), 0), "zero-noise code error");
    check(near(exactNearestNeighborError(rep3, 0.5), 0.5), "two-message code at pure noise");

    var full2 = ["00", "01", "10", "11"];
    check(near(exactNearestNeighborError(full2, 0.1), 1 - Math.pow(0.9, 2)), "uncoded full codebook succeeds only without flips");

    [0, 0.1, 0.25, 0.5].forEach(function (epsilon) {
      check(near(bscCapacity(epsilon), 1 - binaryEntropy(epsilon)), "BSC capacity identity");
      check(bscCapacity(epsilon) >= -EPS && bscCapacity(epsilon) <= 1 + EPS, "capacity range");
    });
    check(exponentRace(100, 0.2, 0.1, 0.02).surrogate < 1, "positive exponent decays");
    check(near(exponentRace(100, 0.8, 0.1, 0.02).surrogate, 1), "negative exponent gives no decay certificate");
    return { checks: checks };
  }

  var STYLE_TEXT = [
    ".cc-lab{--cc-blue:var(--cl-blue,#315f9d);--cc-gold:var(--cl-gold,#9b6a12);--cc-green:var(--cl-green,#39734d);--cc-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55}",
    ".cc-lab *,.cc-lab *::before,.cc-lab *::after{box-sizing:border-box}.cc-lab [hidden]{display:none!important}",
    ".cc-lab button,.cc-lab input{font:inherit}.cc-lab button{min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;line-height:1.35;overflow-wrap:anywhere}.cc-lab button:hover{border-color:var(--accent)}",
    ".cc-lab button:focus-visible,.cc-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.cc-lab button[aria-pressed=true],.cc-lab .cc-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}",
    ".cc-lab fieldset{min-width:0;margin:0;padding:0;border:0}.cc-lab legend{margin-bottom:8px;color:var(--fg-soft);font-size:13px;font-weight:750}",
    ".cc-lab .cc-questions{display:grid;gap:10px}.cc-lab .cc-question{padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg)}.cc-lab .cc-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:7px}.cc-lab .cc-choices button{font-size:12px}",
    ".cc-lab .cc-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.cc-lab .cc-actions>*{flex:1 1 170px}.cc-lab .cc-feedback{min-height:2em;margin:8px 0;color:var(--fg-soft);font-size:13px;font-weight:700}.cc-lab .cc-pass{color:var(--cc-green)}.cc-lab .cc-warn{color:var(--cc-red)}",
    ".cc-lab .cc-reveal{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.cc-lab .cc-layout{display:grid;grid-template-columns:minmax(220px,.68fr) minmax(0,1.32fr);gap:16px;align-items:start;min-width:0}",
    ".cc-lab .cc-controls{display:grid;gap:12px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg)}.cc-lab .cc-control{display:grid;gap:4px}.cc-lab label{color:var(--fg-soft);font-size:13px;font-weight:700}.cc-lab output{color:var(--accent);font-variant-numeric:tabular-nums}.cc-lab input[type=range]{width:100%;min-height:44px;margin:0;accent-color:var(--accent)}",
    ".cc-lab .cc-stage{min-width:0;padding:9px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden}.cc-lab svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg)}.cc-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.cc-lab .cc-axis{stroke:currentColor;stroke-width:1.2;opacity:.7}.cc-lab .cc-grid{stroke:var(--border);stroke-width:1}.cc-lab .cc-error{fill:none;stroke:var(--cc-blue);stroke-width:3}.cc-lab .cc-race{fill:none;stroke:var(--cc-gold);stroke-width:3}.cc-lab .cc-point{fill:var(--cc-red);stroke:var(--bg);stroke-width:2}",
    ".cc-lab .cc-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:10px 0}.cc-lab .cc-metric{padding:8px;border-top:2px solid var(--border);background:var(--bg)}.cc-lab .cc-metric span{display:block;color:var(--fg-soft);font-size:11.5px}.cc-lab .cc-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".cc-lab .cc-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}.cc-lab table{width:100%;min-width:620px;border-collapse:collapse;font-size:12px}.cc-lab th,.cc-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}.cc-lab th{color:var(--fg-soft)}",
    ".cc-lab .cc-note{margin-top:10px;padding:10px 12px;border-left:3px solid var(--cc-green);background:var(--bg);font-size:13px;line-height:1.65}",
    "@media(max-width:900px){.cc-lab .cc-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:700px){.cc-lab .cc-choices{grid-template-columns:minmax(0,1fr)}}"
  ].join("\n");

  function injectStyles(documentObject) {
    if (!documentObject || documentObject.getElementById(STYLE_ID)) return;
    var style = documentObject.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    documentObject.head.appendChild(style);
  }

  function format(value, digits) {
    if (value === 0) return "0";
    if (Math.abs(value) < 0.001) return Number(value).toExponential(2);
    return Number(value).toFixed(digits == null ? 3 : digits);
  }

  function mount(container) {
    if (!container || container.getAttribute("data-cc-mounted") === "true") return;
    container.setAttribute("data-cc-mounted", "true");
    injectStyles(container.ownerDocument);
    INSTANCE += 1;
    var prefix = "cc-" + INSTANCE;
    var selected = [null, null, null];

    container.innerHTML = [
      '<div class="cc-lab"><h3>有限码本审计：看见低误码，还没有证明容量定理</h3>',
      '<p class="cc-note">先区分有限块精确误码、联合典型性证明中的指数赛跑，以及 Shannon 的渐近存在性结论。</p>',
      '<fieldset><legend>预测区</legend><div class="cc-questions">',
      '<div class="cc-question" data-question="0"><strong>1. 一个有限码本在 R&lt;C 时误码很小，能否单独证明信道编码定理？</strong><div class="cc-choices"><button type="button" data-choice="0">能</button><button type="button" data-choice="1">不能，只是一份有限证据</button><button type="button" data-choice="2">只要 n≥3 就能</button></div></div>',
      '<div class="cc-question" data-question="1"><strong>2. union bound 是否要求各“假码字装真”事件独立？</strong><div class="cc-choices"><button type="button" data-choice="0">要求完全独立</button><button type="button" data-choice="1">不要求</button><button type="button" data-choice="2">只在 BSC 要求</button></div></div>',
      '<div class="cc-question" data-question="2"><strong>3. R&gt;C 的逆定理排除什么？</strong><div class="cc-choices"><button type="button" data-choice="0">每个有限码都必错一半</button><button type="button" data-choice="1">存在任何有限码</button><button type="button" data-choice="2">误码率随块长趋零的码族</button></div></div>',
      '</div></fieldset>',
      '<div class="cc-actions"><button class="cc-primary" type="button" data-action="submit">提交预测并揭示</button><button type="button" data-action="reset">重置</button></div><p class="cc-feedback" role="status" aria-live="polite"></p>',
      '<div class="cc-reveal" hidden><div class="cc-layout"><div class="cc-controls">',
      '<div class="cc-control"><label for="' + prefix + '-eps">BSC 翻转率 ε：<output data-output="eps">0.10</output></label><input id="' + prefix + '-eps" data-input="eps" type="range" min="0" max="0.49" step="0.01" value="0.1"></div>',
      '<div class="cc-control"><label for="' + prefix + '-n">重复码块长 n（奇数）：<output data-output="n">5</output></label><input id="' + prefix + '-n" data-input="n" type="range" min="1" max="15" step="2" value="5"></div>',
      '<div class="cc-control"><label for="' + prefix + '-rate">指数赛跑码率 R：<output data-output="rate">0.40</output></label><input id="' + prefix + '-rate" data-input="rate" type="range" min="0.02" max="1" step="0.01" value="0.4"></div>',
      '<div class="cc-control"><label for="' + prefix + '-race-n">赛跑块长 N：<output data-output="race-n">80</output></label><input id="' + prefix + '-race-n" data-input="race-n" type="range" min="10" max="300" step="10" value="80"></div>',
      '</div><div class="cc-stage">',
      '<svg viewBox="0 0 640 310" role="img" aria-labelledby="' + prefix + '-title ' + prefix + '-desc"><title id="' + prefix + '-title">重复码精确误码与典型性指数账本</title><desc id="' + prefix + '-desc">蓝线是奇数重复码的精确多数译码误码率，金线是教学用指数赛跑量。</desc><g data-svg></g></svg>',
      '<div class="cc-metrics" data-metrics></div><div class="cc-table-wrap"><table><thead><tr><th>证据层</th><th>当前值</th><th>不得越界的解释</th></tr></thead><tbody data-ledger></tbody></table></div><p class="cc-note" data-note></p>',
      '</div></div></div></div>'
    ].join("");

    var lab = container.querySelector(".cc-lab");
    var reveal = lab.querySelector(".cc-reveal");
    var feedback = lab.querySelector(".cc-feedback");
    var inputs = {
      eps: lab.querySelector('[data-input="eps"]'),
      n: lab.querySelector('[data-input="n"]'),
      rate: lab.querySelector('[data-input="rate"]'),
      raceN: lab.querySelector('[data-input="race-n"]')
    };

    function render() {
      var epsilon = Number(inputs.eps.value);
      var n = Math.round(Number(inputs.n.value));
      var rate = Number(inputs.rate.value);
      var raceN = Math.round(Number(inputs.raceN.value));
      var capacity = bscCapacity(epsilon);
      var exact = repetitionError(n, epsilon);
      var exactEnumeration = exactNearestNeighborError([new Array(n + 1).join("0"), new Array(n + 1).join("1")], epsilon);
      var race = exponentRace(raceN, rate, epsilon, 0.02);
      var repetitionRate = 1 / n;
      lab.querySelector('[data-output="eps"]').textContent = format(epsilon, 2);
      lab.querySelector('[data-output="n"]').textContent = String(n);
      lab.querySelector('[data-output="rate"]').textContent = format(rate, 2);
      lab.querySelector('[data-output="race-n"]').textContent = String(raceN);

      var points = [];
      var maxLog = 0;
      for (var odd = 1; odd <= 15; odd += 2) {
        var value = repetitionError(odd, epsilon);
        var logValue = -Math.log(Math.max(value, 1e-9)) / Math.log(10);
        maxLog = Math.max(maxLog, logValue);
        points.push({ n: odd, error: value, log: logValue });
      }
      maxLog = Math.max(maxLog, 1);
      var path = points.map(function (point, index) {
        var x = 52 + 536 * index / (points.length - 1);
        var y = 268 - 210 * point.log / maxLog;
        return (index ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
      }).join(" ");
      var currentIndex = (n - 1) / 2;
      var currentX = 52 + 536 * currentIndex / (points.length - 1);
      var currentY = 268 - 210 * points[currentIndex].log / maxLog;
      lab.querySelector("[data-svg]").innerHTML = [
        '<line class="cc-axis" x1="52" y1="268" x2="588" y2="268"></line><line class="cc-axis" x1="52" y1="48" x2="52" y2="268"></line>',
        '<path class="cc-error" d="' + path + '"></path><circle class="cc-point" cx="' + currentX.toFixed(1) + '" cy="' + currentY.toFixed(1) + '" r="6"></circle>',
        '<text x="52" y="292" font-size="12">n=1</text><text x="552" y="292" font-size="12">n=15</text><text x="62" y="64" font-size="12">−log₁₀ Pₑ（越高越小）</text>',
        '<text x="330" y="36" font-size="13">指数赛跑：C−R−δ=' + format(race.exponent, 3) + '</text>'
      ].join("");

      lab.querySelector("[data-metrics]").innerHTML = [
        ["重复码率", format(repetitionRate, 3)],
        ["精确 Pₑ", format(exact, 4)],
        ["BSC 容量 C", format(capacity, 3)],
        ["2^{-N(C−R−δ)}", format(race.surrogate, 4)]
      ].map(function (entry) { return '<div class="cc-metric"><span>' + entry[0] + '</span><strong>' + entry[1] + '</strong></div>'; }).join("");

      lab.querySelector("[data-ledger]").innerHTML = [
        ["有限块精确枚举", "多数公式=" + format(exact, 6) + "；枚举=" + format(exactEnumeration, 6), "只评价当前重复码和最近邻译码"],
        ["容量比较", "1/n=" + format(repetitionRate, 3) + "; C=" + format(capacity, 3), repetitionRate < capacity ? "当前码率低于容量，但不因此自动最优" : "当前重复码率不低于容量，不能组成误码趋零码族"],
        ["典型性赛跑", "N=" + raceN + ", R=" + format(rate, 2) + ", δ=0.02", "是证明骨架的指数账本，不是当前重复码的误码率"],
        ["逆定理", rate > capacity ? "R>C" : "R≤C", rate > capacity ? "排除误码率趋零的码族" : "不承诺指定有限码的性能"]
      ].map(function (row) { return "<tr><td>" + row[0] + "</td><td>" + row[1] + "</td><td>" + row[2] + "</td></tr>"; }).join("");
      lab.querySelector("[data-note]").textContent = "蓝线是重复码的精确二项尾概率；指数项只复现随机编码证明里“候选数对撞假配对概率”的方向。两者不能互相冒充。";
    }

    lab.addEventListener("click", function (event) {
      var choice = event.target.closest("button[data-choice]");
      if (choice) {
        var question = choice.closest("[data-question]");
        var index = Number(question.getAttribute("data-question"));
        selected[index] = Number(choice.getAttribute("data-choice"));
        question.querySelectorAll("button[data-choice]").forEach(function (button) { button.setAttribute("aria-pressed", button === choice ? "true" : "false"); });
        return;
      }
      var action = event.target.closest("button[data-action]");
      if (!action) return;
      if (action.getAttribute("data-action") === "submit") {
        if (selected.some(function (value) { return value == null; })) {
          feedback.className = "cc-feedback cc-warn";
          feedback.textContent = "请先完成三项预测。";
          return;
        }
        var correct = [1, 1, 2];
        var score = selected.reduce(function (sum, value, index) { return sum + (value === correct[index] ? 1 : 0); }, 0);
        feedback.className = "cc-feedback " + (score === 3 ? "cc-pass" : "cc-warn");
        feedback.textContent = "预测 " + score + "/3。下面把三层证据分开核对。";
        reveal.hidden = false;
        render();
      } else {
        selected = [null, null, null];
        lab.querySelectorAll("button[data-choice]").forEach(function (button) { button.removeAttribute("aria-pressed"); });
        inputs.eps.value = "0.1";
        inputs.n.value = "5";
        inputs.rate.value = "0.4";
        inputs.raceN.value = "80";
        reveal.hidden = true;
        feedback.className = "cc-feedback";
        feedback.textContent = "";
      }
    });
    Object.keys(inputs).forEach(function (key) { inputs[key].addEventListener("input", render); });
  }

  return {
    binaryEntropy: binaryEntropy,
    bscCapacity: bscCapacity,
    repetitionError: repetitionError,
    exactNearestNeighborError: exactNearestNeighborError,
    exponentRace: exponentRace,
    mount: mount,
    selfTest: selfTest
  };
});
