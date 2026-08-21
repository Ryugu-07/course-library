(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") root.CourseLearning.register("mle-asymptotics", exported.mount);
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try { var report = exported.selfTest(); console.log("mle-asymptotics self-test: PASS (" + report.checks + " checks)"); }
    catch (error) { console.error("mle-asymptotics self-test: FAIL\n" + error.stack); process.exitCode = 1; }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";
  var STYLE_ID = "cl-mle-asymptotics-styles"; var INSTANCE = 0; var EPS = 1e-12;
  function assert(condition, message) { if (!condition) throw new Error(message); }
  function near(a, b, tolerance) { return Math.abs(a - b) <= (tolerance || 1e-9) * Math.max(1, Math.abs(a), Math.abs(b)); }
  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function choose(n, k) { var m = Math.min(k, n - k); var result = 1; for (var i = 1; i <= m; i += 1) result = result * (n - m + i) / i; return result; }
  function binomialPmf(k, n, p) {
    if (p <= EPS) return k === 0 ? 1 : 0;
    if (p >= 1 - EPS) return k === n ? 1 : 0;
    return choose(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
  }
  function normalDensity(x, mean, sd) {
    if (sd <= EPS) return Math.abs(x - mean) <= EPS ? Infinity : 0;
    var z = (x - mean) / sd; return Math.exp(-0.5 * z * z) / (sd * Math.sqrt(2 * Math.PI));
  }
  function bernoulliLedger(nValue, pValue) {
    var n = Math.max(1, Math.round(Number(nValue))); var p = clamp(pValue, 0, 1); var distribution = [];
    var mean = 0; var second = 0;
    for (var k = 0; k <= n; k += 1) { var probability = binomialPmf(k, n, p); var estimate = k / n; distribution.push({ k: k, estimate: estimate, probability: probability }); mean += estimate * probability; second += estimate * estimate * probability; }
    return { n: n, p: p, distribution: distribution, mean: mean, variance: Math.max(0, second - mean * mean), asymptoticVariance: p * (1 - p) / n, regular: p > 0 && p < 1, fisherPerObservation: p > 0 && p < 1 ? 1 / (p * (1 - p)) : Infinity };
  }
  function waldInterval(k, n, z) { var phat = k / n; var se = Math.sqrt(phat * (1 - phat) / n); return [Math.max(0, phat - z * se), Math.min(1, phat + z * se)]; }
  function wilsonInterval(k, n, z) { var phat = k / n; var z2 = z * z; var denominator = 1 + z2 / n; var center = (phat + z2 / (2 * n)) / denominator; var half = z * Math.sqrt(phat * (1 - phat) / n + z2 / (4 * n * n)) / denominator; return [Math.max(0, center - half), Math.min(1, center + half)]; }
  function exactCoverage(nValue, pValue, method) {
    var n = Math.max(1, Math.round(Number(nValue))); var p = clamp(pValue, 0, 1); var z = 1.959963984540054; var coverage = 0;
    for (var k = 0; k <= n; k += 1) { var interval = method === "wilson" ? wilsonInterval(k, n, z) : waldInterval(k, n, z); if (p >= interval[0] - EPS && p <= interval[1] + EPS) coverage += binomialPmf(k, n, p); }
    return coverage;
  }
  function selfTest() {
    var checks = 0; function check(condition, message) { checks += 1; assert(condition, message); }
    [1, 2, 5, 10, 40].forEach(function (n) { [0, 0.1, 0.5, 0.9, 1].forEach(function (p) { var ledger = bernoulliLedger(n, p); check(near(ledger.distribution.reduce(function (sum, row) { return sum + row.probability; }, 0), 1, 1e-8), "binomial mass sums to one"); check(near(ledger.mean, p, 1e-8), "Bernoulli MLE unbiased"); check(near(ledger.variance, p * (1 - p) / n, 1e-8), "exact MLE variance"); }); });
    check(!bernoulliLedger(20, 0).regular, "boundary p=0 nonregular"); check(!bernoulliLedger(20, 1).regular, "boundary p=1 nonregular"); check(bernoulliLedger(20, 0.4).regular, "interior Bernoulli regular");
    check(near(exactCoverage(20, 0, "wilson"), 1), "Wilson covers boundary p=0 in degenerate sample");
    check(exactCoverage(20, 0.05, "wald") < 0.95, "Wald undercoverage near boundary");
    check(exactCoverage(100, 0.5, "wilson") > 0.9, "Wilson central coverage sensible");
    return { checks: checks };
  }
  var STYLE_TEXT = [
    ".ma-lab{--ma-blue:var(--cl-blue,#315f9d);--ma-gold:var(--cl-gold,#9b6a12);--ma-green:var(--cl-green,#39734d);--ma-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55}.ma-lab *,.ma-lab *::before,.ma-lab *::after{box-sizing:border-box}.ma-lab [hidden]{display:none!important}",
    ".ma-lab button,.ma-lab input{font:inherit}.ma-lab button{min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.ma-lab button:hover{border-color:var(--accent)}.ma-lab button:focus-visible,.ma-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.ma-lab button[aria-pressed=true],.ma-lab .ma-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}",
    ".ma-lab fieldset{min-width:0;margin:0;padding:0;border:0}.ma-lab legend{margin-bottom:8px;color:var(--fg-soft);font-size:13px;font-weight:750}.ma-lab .ma-questions{display:grid;gap:10px}.ma-lab .ma-question{padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg)}.ma-lab .ma-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:7px}.ma-lab .ma-choices button{font-size:12px}",
    ".ma-lab .ma-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.ma-lab .ma-actions>*{flex:1 1 170px}.ma-lab .ma-feedback{min-height:2em;margin:8px 0;color:var(--fg-soft);font-size:13px;font-weight:700}.ma-lab .ma-pass{color:var(--ma-green)}.ma-lab .ma-warn{color:var(--ma-red)}.ma-lab .ma-reveal{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}",
    ".ma-lab .ma-layout{display:grid;grid-template-columns:minmax(220px,.68fr) minmax(0,1.32fr);gap:16px;align-items:start;min-width:0}.ma-lab .ma-controls{display:grid;gap:12px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg)}.ma-lab .ma-control{display:grid;gap:4px}.ma-lab label{color:var(--fg-soft);font-size:13px;font-weight:700}.ma-lab output{color:var(--accent);font-variant-numeric:tabular-nums}.ma-lab input[type=range]{width:100%;min-height:44px;margin:0;accent-color:var(--accent)}",
    ".ma-lab .ma-stage{min-width:0;padding:9px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden}.ma-lab svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg)}.ma-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.ma-lab .ma-axis{stroke:currentColor;stroke-width:1.2;opacity:.7}.ma-lab .ma-bar{fill:var(--ma-blue)}.ma-lab .ma-normal{fill:none;stroke:var(--ma-gold);stroke-width:3}.ma-lab .ma-true{stroke:var(--ma-red);stroke-width:2;stroke-dasharray:5 4}",
    ".ma-lab .ma-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:10px 0}.ma-lab .ma-metric{padding:8px;border-top:2px solid var(--border);background:var(--bg)}.ma-lab .ma-metric span{display:block;color:var(--fg-soft);font-size:11.5px}.ma-lab .ma-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.ma-lab .ma-table-wrap{max-width:100%;overflow-x:auto}.ma-lab table{width:100%;min-width:590px;border-collapse:collapse;font-size:12px}.ma-lab th,.ma-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left}.ma-lab th{color:var(--fg-soft)}.ma-lab .ma-note{margin-top:10px;padding:10px 12px;border-left:3px solid var(--ma-green);background:var(--bg);font-size:13px;line-height:1.65}",
    "@media(max-width:900px){.ma-lab .ma-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:700px){.ma-lab .ma-choices{grid-template-columns:minmax(0,1fr)}}"
  ].join("\n");
  function injectStyles(documentObject) { if (!documentObject || documentObject.getElementById(STYLE_ID)) return; var style = documentObject.createElement("style"); style.id = STYLE_ID; style.textContent = STYLE_TEXT; documentObject.head.appendChild(style); }
  function format(value, digits) { if (!isFinite(value)) return "∞"; return Number(value).toFixed(digits == null ? 4 : digits); }
  function mount(container) {
    if (!container || container.getAttribute("data-ma-mounted") === "true") return; container.setAttribute("data-ma-mounted", "true"); injectStyles(container.ownerDocument); INSTANCE += 1; var prefix = "ma-" + INSTANCE; var selected = [null, null, null];
    container.innerHTML = [
      '<div class="ma-lab"><h3>Bernoulli MLE：极限钟形与边界事故放在同一张图</h3><p class="ma-note">先判断“渐近”是否等于“有限样本精确”，以及内点正则条件能否跨过 p=0,1。</p>',
      '<fieldset><legend>预测区</legend><div class="ma-questions">',
      '<div class="ma-question" data-question="0"><strong>1. √n(p̂−p) 渐近正态，是否意味着每个有限 n 都精确正态？</strong><div class="ma-choices"><button type="button" data-choice="0">是</button><button type="button" data-choice="1">否</button><button type="button" data-choice="2">n≥30 就精确</button></div></div>',
      '<div class="ma-question" data-question="1"><strong>2. 真值 p=0 时能否直接套内点 Fisher 正态定理？</strong><div class="ma-choices"><button type="button" data-choice="0">能</button><button type="button" data-choice="1">不能，正则条件失败</button><button type="button" data-choice="2">只需把 n 加倍</button></div></div>',
      '<div class="ma-question" data-question="2"><strong>3. 95% Wald 区间是否在所有 n,p 上精确覆盖 95%？</strong><div class="ma-choices"><button type="button" data-choice="0">是</button><button type="button" data-choice="1">只在 p=1/2</button><button type="button" data-choice="2">否，覆盖率离散且边界可失真</button></div></div>',
      '</div></fieldset><div class="ma-actions"><button class="ma-primary" type="button" data-action="submit">提交预测并揭示</button><button type="button" data-action="reset">重置</button></div><p class="ma-feedback" role="status" aria-live="polite"></p>',
      '<div class="ma-reveal" hidden><div class="ma-layout"><div class="ma-controls">',
      '<div class="ma-control"><label for="' + prefix + '-n">样本量 n：<output data-output="n">30</output></label><input id="' + prefix + '-n" data-input="n" type="range" min="5" max="200" step="5" value="30"></div>',
      '<div class="ma-control"><label for="' + prefix + '-p">真值 p：<output data-output="p">0.30</output></label><input id="' + prefix + '-p" data-input="p" type="range" min="0" max="1" step="0.01" value="0.3"></div>',
      '<div class="ma-actions"><button type="button" data-preset="center">中心正则</button><button type="button" data-preset="edge">近边界</button><button type="button" data-preset="boundary">真边界</button></div></div>',
      '<div class="ma-stage"><svg viewBox="0 0 640 310" role="img" aria-labelledby="' + prefix + '-title ' + prefix + '-desc"><title id="' + prefix + '-title">Bernoulli MLE 精确分布与正态近似</title><desc id="' + prefix + '-desc">蓝色柱是二项精确质量，金线是用真参数方差得到的正态近似。</desc><g data-svg></g></svg>',
      '<div class="ma-metrics" data-metrics></div><div class="ma-table-wrap"><table><thead><tr><th>量</th><th>精确/当前值</th><th>正则渐近解释</th></tr></thead><tbody data-ledger></tbody></table></div><p class="ma-note" data-note></p></div></div></div></div>'
    ].join("");
    var lab = container.querySelector(".ma-lab"); var reveal = lab.querySelector(".ma-reveal"); var feedback = lab.querySelector(".ma-feedback"); var nInput = lab.querySelector('[data-input="n"]'); var pInput = lab.querySelector('[data-input="p"]');
    function render() {
      var ledger = bernoulliLedger(nInput.value, pInput.value); var n = ledger.n; var p = ledger.p; var sd = Math.sqrt(ledger.asymptoticVariance); lab.querySelector('[data-output="n"]').textContent = String(n); lab.querySelector('[data-output="p"]').textContent = format(p, 2);
      var maxMass = Math.max.apply(null, ledger.distribution.map(function (row) { return row.probability; })); var elements = ['<line class="ma-axis" x1="48" y1="266" x2="594" y2="266"></line><line class="ma-axis" x1="48" y1="46" x2="48" y2="266"></line>'];
      ledger.distribution.forEach(function (row) { var x = 50 + 540 * row.estimate; var width = Math.max(1.2, 500 / (n + 1)); var y = 266 - 205 * row.probability / Math.max(maxMass, EPS); elements.push('<rect class="ma-bar" x="' + (x - width / 2).toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + width.toFixed(1) + '" height="' + (266 - y).toFixed(1) + '"></rect>'); });
      if (ledger.regular) { var curve = []; for (var index = 0; index <= 150; index += 1) { var estimate = index / 150; var densityMass = normalDensity(estimate, p, sd) / n; var x = 50 + 540 * estimate; var y = 266 - 205 * densityMass / Math.max(maxMass, EPS); curve.push((index ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1)); } elements.push('<path class="ma-normal" d="' + curve.join(" ") + '"></path>'); }
      var trueX = 50 + 540 * p; elements.push('<line class="ma-true" x1="' + trueX.toFixed(1) + '" y1="46" x2="' + trueX.toFixed(1) + '" y2="266"></line><text x="48" y="292" font-size="12">p̂=0</text><text x="560" y="292" font-size="12">p̂=1</text><text x="350" y="34" font-size="12">蓝：精确　金：正态近似　红：真值</text>'); lab.querySelector("[data-svg]").innerHTML = elements.join("");
      var wald = exactCoverage(n, p, "wald"); var wilson = exactCoverage(n, p, "wilson"); lab.querySelector("[data-metrics]").innerHTML = [["E[p̂]", format(ledger.mean, 4)],["Var(p̂)",format(ledger.variance,5)],["Wald 覆盖",format(wald,3)],["Wilson 覆盖",format(wilson,3)]].map(function (entry) { return '<div class="ma-metric"><span>' + entry[0] + '</span><strong>' + entry[1] + '</strong></div>'; }).join("");
      lab.querySelector("[data-ledger]").innerHTML = [["偏差",format(ledger.mean-p,8),"Bernoulli 样本均值在这里有限样本即无偏"],["方差",format(ledger.variance,6),ledger.regular?"等于 1/(nI(p))":"边界处内点 Fisher 推导不适用"],["Fisher/样本",format(ledger.fisherPerObservation,4),ledger.regular?"I(p)=1/[p(1-p)]":"正则信息公式在边界退化"],["95% 区间",format(wald,3)+" / "+format(wilson,3),"精确覆盖率由离散二项分布枚举"]].map(function (row) { return "<tr><td>"+row[0]+"</td><td>"+row[1]+"</td><td>"+row[2]+"</td></tr>"; }).join("");
      lab.querySelector("[data-note]").textContent = ledger.regular ? "当前真值是内点。n 增大时柱状分布会靠近正态，但有限 n 仍离散；置信区间覆盖也不会逐点恰为 0.95。" : "当前真值位于参数空间边界，样本退化且正则渐近正态性停止发证；增加 n 不能把边界变成内点。";
    }
    lab.addEventListener("click", function (event) { var choice=event.target.closest("button[data-choice]"); if(choice){var q=choice.closest("[data-question]");var i=Number(q.getAttribute("data-question"));selected[i]=Number(choice.getAttribute("data-choice"));q.querySelectorAll("button[data-choice]").forEach(function(b){b.setAttribute("aria-pressed",b===choice?"true":"false")});return;} var preset=event.target.closest("button[data-preset]"); if(preset){var id=preset.getAttribute("data-preset"); if(id==="center"){nInput.value="80";pInput.value="0.5";}else if(id==="edge"){nInput.value="30";pInput.value="0.05";}else{nInput.value="30";pInput.value="0";}render();return;} var action=event.target.closest("button[data-action]"); if(!action)return; if(action.getAttribute("data-action")==="submit"){if(selected.some(function(v){return v==null;})){feedback.className="ma-feedback ma-warn";feedback.textContent="请先完成三项预测。";return;}var correct=[1,1,2];var score=selected.reduce(function(s,v,i){return s+(v===correct[i]?1:0)},0);feedback.className="ma-feedback "+(score===3?"ma-pass":"ma-warn");feedback.textContent="预测 "+score+"/3。现在把精确分布、近似与边界分开。";reveal.hidden=false;render();}else{selected=[null,null,null];lab.querySelectorAll("button[data-choice]").forEach(function(b){b.removeAttribute("aria-pressed")});nInput.value="30";pInput.value="0.3";reveal.hidden=true;feedback.className="ma-feedback";feedback.textContent="";}});
    nInput.addEventListener("input",render);pInput.addEventListener("input",render);
  }
  return { binomialPmf: binomialPmf, bernoulliLedger: bernoulliLedger, waldInterval: waldInterval, wilsonInterval: wilsonInterval, exactCoverage: exactCoverage, mount: mount, selfTest: selfTest };
});
