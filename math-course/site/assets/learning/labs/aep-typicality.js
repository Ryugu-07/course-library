(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("aep-typicality", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("aep-typicality self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("aep-typicality self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var STYLE_ID = "cl-aep-typicality-styles";
  var LN2 = Math.log(2);

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function near(a, b, tolerance) {
    return Math.abs(a - b) <= (tolerance || 1e-9);
  }

  function binaryEntropy(p) {
    if (p <= 0 || p >= 1) return 0;
    return -(p * Math.log(p) + (1 - p) * Math.log(1 - p)) / LN2;
  }

  function logFactorials(n) {
    var values = [0];
    for (var i = 1; i <= n; i += 1) values.push(values[i - 1] + Math.log(i));
    return values;
  }

  function logChoose(n, k, logs) {
    var table = logs || logFactorials(n);
    return table[n] - table[k] - table[n - k];
  }

  function logAdd(a, b) {
    if (a === -Infinity) return b;
    if (b === -Infinity) return a;
    var high = Math.max(a, b);
    return high + Math.log(Math.exp(a - high) + Math.exp(b - high));
  }

  function sequenceLogProbability(n, k, p) {
    if (p === 0) return k === 0 ? 0 : -Infinity;
    if (p === 1) return k === n ? 0 : -Infinity;
    return k * Math.log(p) + (n - k) * Math.log(1 - p);
  }

  function typeLedger(n, p, epsilon) {
    var logs = logFactorials(n);
    var entropy = binaryEntropy(p);
    var types = [];
    var typicalMass = 0;
    var logTypicalCount = -Infinity;
    var totalMass = 0;
    for (var k = 0; k <= n; k += 1) {
      var logSequence = sequenceLogProbability(n, k, p);
      var info = logSequence === -Infinity ? Infinity : -logSequence / (n * LN2);
      var logCount = logChoose(n, k, logs);
      var mass = logSequence === -Infinity ? 0 : Math.exp(logCount + logSequence);
      var typical = Math.abs(info - entropy) <= epsilon;
      if (typical) {
        typicalMass += mass;
        logTypicalCount = logAdd(logTypicalCount, logCount);
      }
      totalMass += mass;
      types.push({
        k: k,
        frequency: k / n,
        selfInformation: info,
        log2Count: logCount / LN2,
        mass: mass,
        typical: typical
      });
    }
    var championK = p >= 0.5 ? n : 0;
    var champion = types[championK];
    return {
      n: n,
      p: p,
      epsilon: epsilon,
      entropy: entropy,
      types: types,
      typicalMass: typicalMass,
      totalMass: totalMass,
      log2TypicalCount: logTypicalCount === -Infinity ? -Infinity : logTypicalCount / LN2,
      typicalFractionOfAll: logTypicalCount === -Infinity ? 0 : Math.exp(logTypicalCount - n * LN2),
      champion: champion
    };
  }

  function converseUpperBound(n, rate, entropy, epsilon, atypicalMass) {
    return Math.min(1, atypicalMass + Math.pow(2, n * (rate - entropy + epsilon)));
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function format(value, digits) {
    if (!isFinite(value)) return "∞";
    if (value !== 0 && (Math.abs(value) < 1e-3 || Math.abs(value) >= 1e4)) {
      return value.toExponential(digits == null ? 2 : digits);
    }
    var scale = Math.pow(10, digits == null ? 3 : digits);
    return (Math.round(value * scale) / scale).toString();
  }

  function ensureStyles() {
    if (!host || !host.document || host.document.getElementById(STYLE_ID)) return;
    var style = host.document.createElement("style");
    style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="aep-typicality"]{--aep-accent:#0f766e;--aep-typical:#16a34a;--aep-other:#94a3b8;--aep-warn:#b45309;color:inherit}' +
      '[data-learning-lab="aep-typicality"] .aep-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-items:end}' +
      '[data-learning-lab="aep-typicality"] label{display:grid;gap:6px;font-weight:700}' +
      '[data-learning-lab="aep-typicality"] select,[data-learning-lab="aep-typicality"] input,[data-learning-lab="aep-typicality"] button{min-height:44px;font:inherit}' +
      '[data-learning-lab="aep-typicality"] button{border:1px solid currentColor;background:transparent;color:inherit;padding:8px 14px;cursor:pointer}' +
      '[data-learning-lab="aep-typicality"] .aep-primary{background:var(--aep-accent);border-color:var(--aep-accent);color:white}' +
      '[data-learning-lab="aep-typicality"] .aep-actions{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}' +
      '[data-learning-lab="aep-typicality"] .aep-result[hidden]{display:none}' +
      '[data-learning-lab="aep-typicality"] .aep-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(250px,.85fr);gap:16px;align-items:start}' +
      '[data-learning-lab="aep-typicality"] svg{display:block;width:100%;height:auto;aspect-ratio:16/9;border:1px solid color-mix(in srgb,currentColor 22%,transparent);background:color-mix(in srgb,Canvas 94%,var(--aep-accent) 6%)}' +
      '[data-learning-lab="aep-typicality"] .aep-table-wrap{overflow-x:auto}' +
      '[data-learning-lab="aep-typicality"] table{width:100%;border-collapse:collapse}' +
      '[data-learning-lab="aep-typicality"] th,[data-learning-lab="aep-typicality"] td{padding:8px;border-bottom:1px solid color-mix(in srgb,currentColor 20%,transparent);text-align:left;vertical-align:top}' +
      '[data-learning-lab="aep-typicality"] .aep-note{border-left:4px solid var(--aep-warn);padding-left:12px}' +
      '@media(max-width:760px){[data-learning-lab="aep-typicality"] .aep-controls,[data-learning-lab="aep-typicality"] .aep-grid{grid-template-columns:1fr}}';
    host.document.head.appendChild(style);
  }

  function renderSvg(entry) {
    var maxMass = Math.max.apply(null, entry.types.map(function (type) { return type.mass; }));
    var bars = entry.types.map(function (type) {
      var x = 48 + 526 * type.k / entry.n;
      var height = maxMass ? 220 * type.mass / maxMass : 0;
      return '<line x1="' + x.toFixed(2) + '" x2="' + x.toFixed(2) + '" y1="276" y2="' + (276 - height).toFixed(2) + '" stroke="' + (type.typical ? "#16a34a" : "#94a3b8") + '" stroke-width="' + Math.max(1, 500 / (entry.n + 1)).toFixed(1) + '"/>';
    }).join("");
    var championX = 48 + 526 * entry.champion.k / entry.n;
    return '<svg viewBox="0 0 620 320" role="img" aria-label="Bernoulli 类型概率质量与典型带">' +
      '<line x1="48" y1="276" x2="584" y2="276" stroke="currentColor"/><line x1="48" y1="42" x2="48" y2="276" stroke="currentColor"/>' +
      bars +
      '<line x1="' + championX.toFixed(2) + '" x2="' + championX.toFixed(2) + '" y1="36" y2="282" stroke="#b45309" stroke-width="3" stroke-dasharray="6 5"/>' +
      '<text x="52" y="306">k/n=0</text><text x="528" y="306">k/n=1</text>' +
      '<text x="72" y="64" fill="#16a34a">绿：典型类型</text><text x="210" y="64" fill="#94a3b8">灰：非典型</text><text x="342" y="64" fill="#b45309">橙：冠军序列类型</text>' +
      '</svg>';
  }

  function mount(root) {
    ensureStyles();
    root.innerHTML =
      '<div class="aep-controls">' +
      '<label>p = <output data-role="p-output">0.9</output><input data-role="p" type="range" min="0.05" max="0.95" step="0.05" value="0.9"></label>' +
      '<label>n = <output data-role="n-output">100</output><input data-role="n" type="range" min="20" max="200" step="10" value="100"></label>' +
      '<label>ε = <output data-role="epsilon-output">0.1</output><input data-role="epsilon" type="range" min="0.02" max="0.5" step="0.02" value="0.1"></label>' +
      '</div>' +
      '<label>揭示前预测：冠军序列是否在典型集中？<select data-role="prediction"><option value="">请选择</option><option value="inside">在</option><option value="outside">不在</option></select></label>' +
      '<div class="aep-actions"><button class="aep-primary" type="button" data-role="reveal">揭示类型账本</button><button type="button" data-role="reset">重置</button></div>' +
      '<div class="aep-result" data-role="result" hidden aria-live="polite"></div>';

    var p = root.querySelector('[data-role="p"]');
    var n = root.querySelector('[data-role="n"]');
    var epsilon = root.querySelector('[data-role="epsilon"]');
    var prediction = root.querySelector('[data-role="prediction"]');
    var result = root.querySelector('[data-role="result"]');

    function render() {
      root.querySelector('[data-role="p-output"]').textContent = p.value;
      root.querySelector('[data-role="n-output"]').textContent = n.value;
      root.querySelector('[data-role="epsilon-output"]').textContent = epsilon.value;
      if (result.hidden) return;
      var entry = typeLedger(Number(n.value), Number(p.value), Number(epsilon.value));
      var expected = entry.champion.typical ? "inside" : "outside";
      var predictionText = prediction.value === expected ? "预测命中" : "预测需修正";
      var typicalTypes = entry.types.filter(function (type) { return type.typical; });
      var range = typicalTypes.length
        ? typicalTypes[0].k + " 至 " + typicalTypes[typicalTypes.length - 1].k
        : "当前 ε 下为空";
      result.innerHTML =
        '<div class="aep-grid"><div>' + renderSvg(entry) + '</div><div>' +
        '<h4>' + predictionText + '</h4><div class="aep-table-wrap"><table><tbody>' +
        '<tr><th>H₂(p)</th><td>' + format(entry.entropy) + ' bit/符号</td></tr>' +
        '<tr><th>典型 k 范围</th><td>' + escapeHtml(range) + '</td></tr>' +
        '<tr><th>典型集概率质量</th><td>' + format(entry.typicalMass) + '</td></tr>' +
        '<tr><th>log₂ 典型序列数</th><td>' + format(entry.log2TypicalCount) + '</td></tr>' +
        '<tr><th>占全部序列比例</th><td>' + format(entry.typicalFractionOfAll) + '</td></tr>' +
        '<tr><th>冠军每符号自信息</th><td>' + format(entry.champion.selfInformation) + '</td></tr>' +
        '</tbody></table></div><p class="aep-note">这是有限 n 的 Bernoulli 类型精确汇总。典型质量接近 1 与典型条数占比很小可以同时发生；有限表不证明一般 AEP。</p></div></div>';
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
      p.value = "0.9";
      n.value = "100";
      epsilon.value = "0.1";
      prediction.value = "";
      result.hidden = true;
      result.innerHTML = "";
      render();
    });
    [p, n, epsilon].forEach(function (control) {
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
    check(near(binaryEntropy(0.5), 1), "fair coin entropy");
    check(near(binaryEntropy(0.9), 0.4689955936, 1e-9), "biased coin entropy");
    check(near(logChoose(5, 2) / LN2, Math.log2(10), 1e-12), "binomial coefficient");
    var fair = typeLedger(20, 0.5, 0.001);
    check(near(fair.totalMass, 1, 1e-10), "type masses normalize");
    check(near(fair.typicalMass, 1, 1e-10), "all fair-coin sequences have one bit self-information");
    check(near(fair.log2TypicalCount, 20, 1e-10), "fair typical set is full set");
    var biased = typeLedger(100, 0.9, 0.1);
    check(near(biased.totalMass, 1, 1e-8), "biased type masses normalize");
    check(near(biased.champion.selfInformation, -Math.log2(0.9), 1e-12), "champion self-information");
    check(!biased.champion.typical, "biased champion is outside narrow typical set");
    check(near(biased.typicalMass, 0.75896759196, 1e-10), "biased finite-n typical mass");
    check(biased.typicalFractionOfAll < 1e-8, "biased typical set is sparse among all sequences");
    check(converseUpperBound(100, 0.3, 0.6, 0.1, 0.01) < 0.011, "converse bound keeps atypical tail");
    return { checks: checks };
  }

  return {
    binaryEntropy: binaryEntropy,
    logChoose: logChoose,
    sequenceLogProbability: sequenceLogProbability,
    typeLedger: typeLedger,
    converseUpperBound: converseUpperBound,
    mount: mount,
    selfTest: selfTest
  };
});
