(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") root.CourseLearning.register("arma-diagnostics", exported.mount);
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("arma-diagnostics self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("arma-diagnostics self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var STYLE_ID = "cl-arma-diagnostics-styles";
  var INSTANCE = 0;

  function assert(condition, message) { if (!condition) throw new Error(message); }
  function near(a, b, tolerance) { return Math.abs(a - b) <= (tolerance || 1e-9) * Math.max(1, Math.abs(a), Math.abs(b)); }
  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }

  function ar1Theory(phi, innovationVariance, maxLag) {
    var coefficient = Number(phi);
    var variance = Number(innovationVariance);
    var stationary = Math.abs(coefficient) < 1;
    var acf = [];
    for (var lag = 0; lag <= maxLag; lag += 1) acf.push(stationary ? Math.pow(coefficient, lag) : null);
    return {
      stationary: stationary,
      rootModulus: coefficient === 0 ? Infinity : Math.abs(1 / coefficient),
      variance: stationary ? variance / (1 - coefficient * coefficient) : Infinity,
      acf: acf
    };
  }

  function ma1Theory(theta, innovationVariance, maxLag) {
    var coefficient = Number(theta);
    var variance = Number(innovationVariance);
    var acf = [1];
    for (var lag = 1; lag <= maxLag; lag += 1) acf.push(lag === 1 ? coefficient / (1 + coefficient * coefficient) : 0);
    return {
      stationary: true,
      invertible: Math.abs(coefficient) < 1,
      rootModulus: coefficient === 0 ? Infinity : Math.abs(1 / coefficient),
      variance: variance * (1 + coefficient * coefficient),
      acf: acf
    };
  }

  function makeRandom(seed) {
    var state = (Math.round(Number(seed)) >>> 0) || 1;
    return function () {
      state = (1664525 * state + 1013904223) >>> 0;
      return (state + 0.5) / 4294967296;
    };
  }

  function gaussianStream(seed) {
    var random = makeRandom(seed);
    var spare = null;
    return function () {
      if (spare != null) { var value = spare; spare = null; return value; }
      var u = Math.max(1e-12, random());
      var v = random();
      var radius = Math.sqrt(-2 * Math.log(u));
      spare = radius * Math.sin(2 * Math.PI * v);
      return radius * Math.cos(2 * Math.PI * v);
    };
  }

  function simulate(kind, coefficient, length, seed, burnIn) {
    var n = Math.max(20, Math.round(Number(length)));
    var burn = Math.max(0, Math.round(burnIn == null ? 200 : burnIn));
    var noise = gaussianStream(seed);
    var values = [];
    var previousX = 0;
    var previousNoise = 0;
    for (var index = 0; index < n + burn; index += 1) {
      var currentNoise = noise();
      var current = kind === "ar1"
        ? Number(coefficient) * previousX + currentNoise
        : currentNoise + Number(coefficient) * previousNoise;
      previousX = current;
      previousNoise = currentNoise;
      if (index >= burn) values.push(current);
    }
    return values;
  }

  function sampleAcf(values, maxLag) {
    var mean = values.reduce(function (sum, value) { return sum + value; }, 0) / values.length;
    var centered = values.map(function (value) { return value - mean; });
    var denominator = centered.reduce(function (sum, value) { return sum + value * value; }, 0);
    var result = [];
    for (var lag = 0; lag <= maxLag; lag += 1) {
      var numerator = 0;
      for (var index = lag; index < centered.length; index += 1) numerator += centered[index] * centered[index - lag];
      result.push(denominator > 0 ? numerator / denominator : 0);
    }
    return result;
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var ar = ar1Theory(0.8, 1, 5);
    check(ar.stationary, "AR(1) |phi|<1 stationary");
    check(near(ar.variance, 1 / 0.36), "AR variance");
    check(near(ar.acf[3], 0.512), "AR ACF");
    check(!ar1Theory(1, 1, 3).stationary, "unit root nonstationary");
    check(!isFinite(ar1Theory(-1.01, 1, 3).variance), "explosive AR has no stationary variance");
    var ma = ma1Theory(0.5, 2, 5);
    check(ma.stationary, "finite MA always stationary");
    check(ma.invertible, "MA invertibility condition");
    check(near(ma.variance, 2.5), "MA variance");
    check(near(ma.acf[1], 0.4), "MA lag-one ACF");
    check(ma.acf.slice(2).every(function (value) { return value === 0; }), "MA population ACF cutoff");
    check(!ma1Theory(1.2, 1, 3).invertible, "noninvertible MA still stationary");
    var first = simulate("ar1", 0.4, 500, 17, 100);
    var second = simulate("ar1", 0.4, 500, 17, 100);
    check(first.every(function (value, index) { return value === second[index]; }), "seeded simulation deterministic");
    check(sampleAcf(first, 4).length === 5, "sample ACF length");
    [50, 200, 1000].forEach(function (n) {
      var acf = sampleAcf(simulate("ma1", 0.6, n, 31, 50), 5);
      check(acf.every(function (value) { return isFinite(value); }), "sample ACF finite");
    });
    return { checks: checks };
  }

  var STYLE_TEXT = [
    ".ad-lab{--ad-blue:var(--cl-blue,#315f9d);--ad-gold:var(--cl-gold,#9b6a12);--ad-green:var(--cl-green,#39734d);--ad-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55}.ad-lab *,.ad-lab *::before,.ad-lab *::after{box-sizing:border-box}.ad-lab [hidden]{display:none!important}",
    ".ad-lab button,.ad-lab input{font:inherit}.ad-lab button{min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.ad-lab button:hover{border-color:var(--accent)}.ad-lab button:focus-visible,.ad-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.ad-lab button[aria-pressed=true],.ad-lab .ad-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}",
    ".ad-lab fieldset{min-width:0;margin:0;padding:0;border:0}.ad-lab legend{margin-bottom:8px;color:var(--fg-soft);font-size:13px;font-weight:750}.ad-lab .ad-questions{display:grid;gap:10px}.ad-lab .ad-question{padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg)}.ad-lab .ad-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:7px}.ad-lab .ad-choices button{font-size:12px}",
    ".ad-lab .ad-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.ad-lab .ad-actions>*{flex:1 1 170px}.ad-lab .ad-feedback{min-height:2em;margin:8px 0;color:var(--fg-soft);font-size:13px;font-weight:700}.ad-lab .ad-pass{color:var(--ad-green)}.ad-lab .ad-warn{color:var(--ad-red)}",
    ".ad-lab .ad-reveal{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.ad-lab .ad-layout{display:grid;grid-template-columns:minmax(220px,.68fr) minmax(0,1.32fr);gap:16px;align-items:start;min-width:0}.ad-lab .ad-controls{display:grid;gap:12px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg)}.ad-lab .ad-models{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.ad-lab .ad-control{display:grid;gap:4px}.ad-lab label{color:var(--fg-soft);font-size:13px;font-weight:700}.ad-lab output{color:var(--accent);font-variant-numeric:tabular-nums}.ad-lab input[type=range]{width:100%;min-height:44px;margin:0;accent-color:var(--accent)}",
    ".ad-lab .ad-stage{min-width:0;padding:9px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden}.ad-lab svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg)}.ad-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.ad-lab .ad-axis{stroke:currentColor;stroke-width:1.2;opacity:.7}.ad-lab .ad-grid{stroke:var(--border);stroke-width:1}.ad-lab .ad-theory{stroke:var(--ad-blue);stroke-width:5}.ad-lab .ad-sample{fill:var(--ad-gold);stroke:var(--bg);stroke-width:1}.ad-lab .ad-band{stroke:var(--ad-red);stroke-width:1.5;stroke-dasharray:5 4}",
    ".ad-lab .ad-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:10px 0}.ad-lab .ad-metric{padding:8px;border-top:2px solid var(--border);background:var(--bg)}.ad-lab .ad-metric span{display:block;color:var(--fg-soft);font-size:11.5px}.ad-lab .ad-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.ad-lab .ad-table-wrap{max-width:100%;overflow-x:auto}.ad-lab table{width:100%;min-width:560px;border-collapse:collapse;font-size:12px}.ad-lab th,.ad-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left}.ad-lab th{color:var(--fg-soft)}.ad-lab .ad-note{margin-top:10px;padding:10px 12px;border-left:3px solid var(--ad-green);background:var(--bg);font-size:13px;line-height:1.65}",
    "@media(max-width:900px){.ad-lab .ad-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:700px){.ad-lab .ad-choices{grid-template-columns:minmax(0,1fr)}}"
  ].join("\n");

  function injectStyles(documentObject) {
    if (!documentObject || documentObject.getElementById(STYLE_ID)) return;
    var style = documentObject.createElement("style"); style.id = STYLE_ID; style.textContent = STYLE_TEXT; documentObject.head.appendChild(style);
  }
  function format(value, digits) { if (!isFinite(value)) return "∞"; return Number(value).toFixed(digits == null ? 3 : digits); }

  function mount(container) {
    if (!container || container.getAttribute("data-ad-mounted") === "true") return;
    container.setAttribute("data-ad-mounted", "true"); injectStyles(container.ownerDocument); INSTANCE += 1;
    var prefix = "ad-" + INSTANCE; var selected = [null, null, null]; var kind = "ar1";
    container.innerHTML = [
      '<div class="ad-lab"><h3>AR/MA 指纹台：总体截尾，样本不会照着尺子站齐</h3><p class="ad-note">先判断根条件、总体 ACF 和一条有限样本曲线分别能证明什么。</p>',
      '<fieldset><legend>预测区</legend><div class="ad-questions">',
      '<div class="ad-question" data-question="0"><strong>1. AR(1) 的 φ=1 是否有有限平稳方差？</strong><div class="ad-choices"><button type="button" data-choice="0">有</button><button type="button" data-choice="1">没有</button><button type="button" data-choice="2">只看样本长度</button></div></div>',
      '<div class="ad-question" data-question="1"><strong>2. MA(1) 的总体 ACF 在 lag&gt;1 为零，样本 ACF 是否也逐项精确为零？</strong><div class="ad-choices"><button type="button" data-choice="0">必然精确为零</button><button type="button" data-choice="1">不会，存在抽样波动</button><button type="button" data-choice="2">只有负 θ 时为零</button></div></div>',
      '<div class="ad-question" data-question="2"><strong>3. 一条看起来均值稳定的轨迹是否足以证明过程平稳？</strong><div class="ad-choices"><button type="button" data-choice="0">足够</button><button type="button" data-choice="1">长度过百就足够</button><button type="button" data-choice="2">不足</button></div></div>',
      '</div></fieldset><div class="ad-actions"><button class="ad-primary" type="button" data-action="submit">提交预测并揭示</button><button type="button" data-action="reset">重置</button></div><p class="ad-feedback" role="status" aria-live="polite"></p>',
      '<div class="ad-reveal" hidden><div class="ad-layout"><div class="ad-controls"><div class="ad-models"><button type="button" data-kind="ar1" aria-pressed="true">AR(1)</button><button type="button" data-kind="ma1">MA(1)</button></div>',
      '<div class="ad-control"><label for="' + prefix + '-coef">系数：<output data-output="coef">0.80</output></label><input id="' + prefix + '-coef" data-input="coef" type="range" min="-1.2" max="1.2" step="0.02" value="0.8"></div>',
      '<div class="ad-control"><label for="' + prefix + '-n">样本长度：<output data-output="n">400</output></label><input id="' + prefix + '-n" data-input="n" type="range" min="50" max="1200" step="50" value="400"></div>',
      '<div class="ad-control"><label for="' + prefix + '-seed">固定回放 seed：<output data-output="seed">17</output></label><input id="' + prefix + '-seed" data-input="seed" type="range" min="1" max="99" step="1" value="17"></div></div>',
      '<div class="ad-stage"><svg viewBox="0 0 640 310" role="img" aria-labelledby="' + prefix + '-title ' + prefix + '-desc"><title id="' + prefix + '-title">理论与样本自相关</title><desc id="' + prefix + '-desc">蓝线是总体 ACF，金色点是固定随机回放得到的样本 ACF。</desc><g data-svg></g></svg>',
      '<div class="ad-metrics" data-metrics></div><div class="ad-table-wrap"><table><thead><tr><th>lag</th><th>总体 ACF</th><th>样本 ACF</th><th>差</th></tr></thead><tbody data-ledger></tbody></table></div><p class="ad-note" data-note></p></div></div></div></div>'
    ].join("");
    var lab = container.querySelector(".ad-lab"); var reveal = lab.querySelector(".ad-reveal"); var feedback = lab.querySelector(".ad-feedback");
    var coef = lab.querySelector('[data-input="coef"]'); var nInput = lab.querySelector('[data-input="n"]'); var seed = lab.querySelector('[data-input="seed"]');
    function render() {
      var coefficient = Number(coef.value); var n = Number(nInput.value); var seedValue = Number(seed.value); var maxLag = 10;
      var theory = kind === "ar1" ? ar1Theory(coefficient, 1, maxLag) : ma1Theory(coefficient, 1, maxLag);
      var values = simulate(kind, coefficient, n, seedValue, 300); var empirical = sampleAcf(values, maxLag);
      lab.querySelector('[data-output="coef"]').textContent = format(coefficient, 2); lab.querySelector('[data-output="n"]').textContent = String(n); lab.querySelector('[data-output="seed"]').textContent = String(seedValue);
      var plotTheory = theory.acf.map(function (value) { return value == null ? 0 : value; });
      var elements = ['<line class="ad-axis" x1="52" y1="155" x2="596" y2="155"></line><line class="ad-axis" x1="52" y1="42" x2="52" y2="270"></line>'];
      for (var lag = 0; lag <= maxLag; lag += 1) {
        var x = 64 + 51 * lag; var theoryY = 155 - 104 * plotTheory[lag]; var sampleY = 155 - 104 * empirical[lag];
        elements.push('<line class="ad-theory" x1="' + (x - 5) + '" y1="155" x2="' + (x - 5) + '" y2="' + theoryY.toFixed(1) + '"></line><circle class="ad-sample" cx="' + (x + 5) + '" cy="' + sampleY.toFixed(1) + '" r="5"></circle><text x="' + (x - 4) + '" y="292" font-size="11">' + lag + '</text>');
      }
      var band = 1.96 / Math.sqrt(n); var bandTop = 155 - 104 * band; var bandBottom = 155 + 104 * band;
      elements.push('<line class="ad-band" x1="52" y1="' + bandTop.toFixed(1) + '" x2="596" y2="' + bandTop.toFixed(1) + '"></line><line class="ad-band" x1="52" y1="' + bandBottom.toFixed(1) + '" x2="596" y2="' + bandBottom.toFixed(1) + '"></line><text x="420" y="34" font-size="12">蓝：总体　金：样本</text>');
      lab.querySelector("[data-svg]").innerHTML = elements.join("");
      var maxDifference = Math.max.apply(null, empirical.map(function (value, index) { return Math.abs(value - plotTheory[index]); }));
      lab.querySelector("[data-metrics]").innerHTML = [
        [kind === "ar1" ? "平稳" : "平稳", theory.stationary ? "是" : "否"],
        [kind === "ma1" ? "可逆" : "AR 根模", kind === "ma1" ? (theory.invertible ? "是" : "否") : format(theory.rootModulus, 3)],
        ["总体方差", format(theory.variance, 3)], ["最大样本偏差", format(maxDifference, 3)]
      ].map(function (entry) { return '<div class="ad-metric"><span>' + entry[0] + '</span><strong>' + entry[1] + '</strong></div>'; }).join("");
      lab.querySelector("[data-ledger]").innerHTML = empirical.map(function (value, lag) { var target = theory.acf[lag]; return "<tr><td>" + lag + "</td><td>" + (target == null ? "无平稳理论值" : format(target, 4)) + "</td><td>" + format(value, 4) + "</td><td>" + (target == null ? "—" : format(value - target, 4)) + "</td></tr>"; }).join("");
      lab.querySelector("[data-note]").textContent = kind === "ar1" && !theory.stationary ? "当前 AR 根不在单位圆外，平稳方差与总体 ACF 证书停止；有限回放仍能画出来，但不能把它当平稳样本。" : "虚线 ±1.96/√n 只是白噪声 ACF 的常用近似参考带，不是逐 lag 多重检验或平稳性证明。";
    }
    lab.addEventListener("click", function (event) {
      var choice = event.target.closest("button[data-choice]"); if (choice) { var question = choice.closest("[data-question]"); var index = Number(question.getAttribute("data-question")); selected[index] = Number(choice.getAttribute("data-choice")); question.querySelectorAll("button[data-choice]").forEach(function (button) { button.setAttribute("aria-pressed", button === choice ? "true" : "false"); }); return; }
      var kindButton = event.target.closest("button[data-kind]"); if (kindButton) { kind = kindButton.getAttribute("data-kind"); lab.querySelectorAll("button[data-kind]").forEach(function (button) { button.setAttribute("aria-pressed", button === kindButton ? "true" : "false"); }); render(); return; }
      var action = event.target.closest("button[data-action]"); if (!action) return;
      if (action.getAttribute("data-action") === "submit") { if (selected.some(function (value) { return value == null; })) { feedback.className = "ad-feedback ad-warn"; feedback.textContent = "请先完成三项预测。"; return; } var correct = [1, 1, 2]; var score = selected.reduce(function (sum, value, index) { return sum + (value === correct[index] ? 1 : 0); }, 0); feedback.className = "ad-feedback " + (score === 3 ? "ad-pass" : "ad-warn"); feedback.textContent = "预测 " + score + "/3。现在对照总体公式与固定样本。"; reveal.hidden = false; render(); }
      else { selected = [null, null, null]; kind = "ar1"; lab.querySelectorAll("button[data-choice]").forEach(function (button) { button.removeAttribute("aria-pressed"); }); lab.querySelectorAll("button[data-kind]").forEach(function (button) { button.setAttribute("aria-pressed", button.getAttribute("data-kind") === "ar1" ? "true" : "false"); }); coef.value = "0.8"; nInput.value = "400"; seed.value = "17"; reveal.hidden = true; feedback.className = "ad-feedback"; feedback.textContent = ""; }
    });
    [coef, nInput, seed].forEach(function (input) { input.addEventListener("input", render); });
  }
  return { ar1Theory: ar1Theory, ma1Theory: ma1Theory, simulate: simulate, sampleAcf: sampleAcf, mount: mount, selfTest: selfTest };
});
