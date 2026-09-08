(function (root, factory) {
  "use strict";

  var exported = factory();
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("asymptotic-tests", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module && process.argv.indexOf("--self-test") !== -1) {
    try {
      var report = exported.selfTest();
      console.log("asymptotic-tests self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("asymptotic-tests self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var STYLE_ID = "asymptotic-tests-styles";
  var INSTANCE = 0;

  var PRESETS = [
    { id: "interior", label: "内点：三者接近", n: 40, p0: 0.5, k: 25, alpha: 0.05, h: 1.5 },
    { id: "local", label: "局部备择：h/√n", n: 160, p0: 0.35, k: 69, alpha: 0.05, h: 1.5 },
    { id: "rare", label: "稀有事件：Wald 失真", n: 40, p0: 0.02, k: 0, alpha: 0.05, h: 1.5 },
    { id: "boundary", label: "边界：p₀=0", n: 40, p0: 0, k: 0, alpha: 0.05, h: 1.5 }
  ];

  var STYLE_TEXT = [
    ".at-lab{--at-blue:var(--cl-blue,#315f9d);--at-green:var(--cl-green,#39734d);--at-gold:var(--cl-gold,#9b6a12);--at-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg,#292722);line-height:1.55;overflow-wrap:anywhere}",
    ".at-lab *,.at-lab *::before,.at-lab *::after{box-sizing:border-box}.at-lab [hidden]{display:none!important}.at-lab h3{margin:0;letter-spacing:0;color:var(--fg,#292722);font-size:1.15rem}.at-lab p{margin:8px 0}.at-lab .at-note{color:var(--fg-soft,var(--muted,#6b6557));font-size:13px;line-height:1.65}",
    ".at-lab button,.at-lab input{font:inherit}.at-lab button{min-width:0;min-height:44px;padding:8px 10px;border:1px solid var(--border,#d7d0c2);border-radius:6px;background:var(--bg,#fff);color:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.at-lab button:hover{border-color:var(--at-blue)}.at-lab button:focus-visible,.at-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.at-lab button[aria-pressed=true],.at-lab .at-primary{border-color:var(--at-blue);background:var(--at-blue);color:var(--bg,#fff);font-weight:750}.at-lab .at-presets{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:11px 0}.at-lab .at-presets button{font-size:12px}.at-lab .at-predict{margin-top:13px;padding:12px;border:1px solid var(--border,#d7d0c2);background:var(--block-bg,var(--bg,#fff))}.at-lab .at-predict legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}.at-lab .at-question{margin:9px 0}.at-lab .at-question strong{display:block;font-size:13px}.at-lab .at-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:7px}.at-lab .at-choices button{font-size:12px}.at-lab .at-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px}.at-lab .at-actions>*{flex:1 1 170px}.at-lab .at-feedback{min-height:2em;margin:8px 0;color:var(--fg-soft,var(--muted,#6b6557));font-size:13px;font-weight:700}.at-lab .at-pass{color:var(--at-green)}.at-lab .at-warn{color:var(--at-red)}",
    ".at-lab .at-reveal{margin-top:18px;padding-top:16px;border-top:1px solid var(--border,#d7d0c2)}.at-lab .at-controls{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin:11px 0;align-items:end}.at-lab .at-control{display:grid;gap:5px;min-width:0}.at-lab .at-control label{color:var(--fg-soft,var(--muted,#6b6557));font-size:12.5px;font-weight:700}.at-lab .at-control output{color:var(--at-blue);font-variant-numeric:tabular-nums}.at-lab input[type=range]{width:100%;min-width:0;min-height:44px;margin:0;accent-color:var(--at-blue)}",
    ".at-lab .at-stage{min-width:0;padding:8px;border:1px solid var(--border,#d7d0c2);border-radius:6px;background:var(--bg,#fff);overflow:hidden}.at-lab svg{display:block;width:100%;min-width:700px;height:auto;color:var(--fg,#292722)}.at-lab .at-scroll{overflow-x:auto}.at-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.at-lab .at-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.58}.at-lab .at-grid{stroke:currentColor;stroke-width:1;stroke-opacity:.13}.at-lab .at-bar-blue{fill:var(--at-blue)}.at-lab .at-bar-gold{fill:var(--at-gold)}.at-lab .at-alpha{stroke:var(--at-red);stroke-width:2;stroke-dasharray:6 4}.at-lab .at-title{font-size:13px;font-weight:750}.at-lab .at-small{font-size:12px;fill:var(--fg-soft,var(--muted,#6b6557))}",
    ".at-lab .at-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:12px}.at-lab table{width:100%;min-width:790px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.at-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft,var(--muted,#6b6557));font-size:12px}.at-lab th,.at-lab td{padding:7px 8px;border-bottom:1px solid var(--border,#d7d0c2);text-align:left;vertical-align:top}.at-lab th{color:var(--fg-soft,var(--muted,#6b6557));font-size:11.5px}.at-lab .at-status{margin-top:11px;padding:9px 11px;border-left:3px solid var(--at-green);background:var(--block-bg,var(--bg,#fff));font-size:13px;line-height:1.65}",
    "@media(max-width:1000px){.at-lab .at-controls{grid-template-columns:repeat(3,minmax(0,1fr))}.at-lab .at-presets{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:620px){.at-lab .at-controls,.at-lab .at-presets,.at-lab .at-choices{grid-template-columns:minmax(0,1fr)}.at-lab .at-stage{padding:4px}}@media(prefers-reduced-motion:reduce){.at-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function fail(message) {
    throw new Error("asymptotic-tests: " + message);
  }

  function finite(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function near(left, right, tolerance) {
    return Math.abs(left - right) <= (tolerance === undefined ? 1e-8 : tolerance) * Math.max(1, Math.abs(left), Math.abs(right));
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value)));
  }

  function logChoose(n, k) {
    if (!Number.isInteger(n) || !Number.isInteger(k) || k < 0 || k > n) return -Infinity;
    var m = Math.min(k, n - k);
    var result = 0;
    for (var index = 1; index <= m; index += 1) result += Math.log(n - m + index) - Math.log(index);
    return result;
  }

  function binomialPmf(k, n, p) {
    if (!Number.isInteger(k) || !Number.isInteger(n) || k < 0 || k > n) return 0;
    var probability = clamp(p, 0, 1);
    if (probability === 0) return k === 0 ? 1 : 0;
    if (probability === 1) return k === n ? 1 : 0;
    return Math.exp(logChoose(n, k) + k * Math.log(probability) + (n - k) * Math.log1p(-probability));
  }

  // Evaluate the small Gaussian tail directly. For x>=1, Laplace's
  // continued fraction gives Q(x)/phi(x); near zero integrate the power series.
  function normalSF(value) {
    var z = Number(value), x = Math.abs(z);
    if (Number.isNaN(z)) return NaN;
    if (!Number.isFinite(x)) return z > 0 ? 0 : 1;
    var tail;
    if (x < 1) {
      var term = x, integral = x;
      for (var k = 1; k <= 30; k += 1) {
        term *= -x * x / (2 * k);
        integral += term / (2 * k + 1);
      }
      tail = 0.5 - integral / Math.sqrt(2 * Math.PI);
    } else {
      var fraction = 0;
      for (var j = 500; j >= 1; j -= 1) fraction = j / (x + fraction);
      tail = Math.exp(-x * x / 2) / (Math.sqrt(2 * Math.PI) * (x + fraction));
    }
    return z >= 0 ? tail : 1 - tail;
  }

  function normalCdf(value) { return normalSF(-Number(value)); }

  function inverseNormal(probability) {
    var p = clamp(probability, 1e-12, 1 - 1e-12);
    var low = -9;
    var high = 9;
    for (var index = 0; index < 80; index += 1) {
      var middle = (low + high) / 2;
      if (normalCdf(middle) < p) low = middle;
      else high = middle;
    }
    return (low + high) / 2;
  }

  function twoSidedNormalP(z) {
    if (z === null || z === undefined || !finite(z)) return z === Infinity || z === -Infinity ? 0 : null;
    return clamp(2 * normalSF(Math.abs(z)), 0, 1);
  }

  function exactPValue(nValue, kValue, p0Value) {
    var n = Math.max(1, Math.round(Number(nValue)));
    var k = Math.max(0, Math.min(n, Math.round(Number(kValue))));
    var p0 = clamp(p0Value, 0, 1);
    if (p0 === 0 || p0 === 1) return k === n * p0 ? 1 : 0;
    function logMass(j) { return logChoose(n, j) + j * Math.log(p0) + (n - j) * Math.log1p(-p0); }
    var observed = logMass(k), total = 0;
    // Only absorb log-arithmetic roundoff for tied masses; no absolute PMF floor.
    var roundoff = 64 * Number.EPSILON * (n + Math.abs(observed));
    for (var candidate = 0; candidate <= n; candidate += 1) {
      var logProbability = logMass(candidate);
      if (logProbability <= observed + roundoff) total += Math.exp(logProbability);
    }
    return clamp(total, 0, 1);
  }

  function waldStatistic(nValue, kValue, p0Value) {
    var n = Math.max(1, Math.round(Number(nValue)));
    var k = Math.max(0, Math.min(n, Math.round(Number(kValue))));
    var p0 = clamp(p0Value, 0, 1);
    var phat = k / n;
    var standardError = Math.sqrt(phat * (1 - phat) / n);
    return standardError === 0 ? null : (phat - p0) / standardError;
  }

  function scoreStatistic(nValue, kValue, p0Value) {
    var n = Math.max(1, Math.round(Number(nValue)));
    var k = Math.max(0, Math.min(n, Math.round(Number(kValue))));
    var p0 = clamp(p0Value, 0, 1);
    var standardError = Math.sqrt(p0 * (1 - p0) / n);
    return standardError === 0 ? null : (k / n - p0) / standardError;
  }

  function signedLogLikelihoodStatistic(nValue, kValue, p0Value) {
    var n = Math.max(1, Math.round(Number(nValue)));
    var k = Math.max(0, Math.min(n, Math.round(Number(kValue))));
    var p0 = clamp(p0Value, 0, 1);
    var phat = k / n;
    if ((p0 === 0 && phat > 0) || (p0 === 1 && phat < 1)) return phat > p0 ? Infinity : -Infinity;
    function term(weight, estimate, nullValue) {
      if (weight === 0) return 0;
      if (estimate === 0 || nullValue === 0) return estimate === nullValue ? 0 : Infinity;
      return weight * estimate * Math.log(estimate / nullValue);
    }
    var twice = 2 * (term(n, phat, p0) + term(n, 1 - phat, 1 - p0));
    return phat === p0 ? 0 : (phat > p0 ? 1 : -1) * Math.sqrt(Math.max(0, twice));
  }

  function localAlternative(p0Value, nValue, hValue) {
    var n = Math.max(1, Math.round(Number(nValue)));
    var alternative = Number(p0Value) + Number(hValue) / Math.sqrt(n);
    return finite(alternative) && alternative >= 0 && alternative <= 1 ? alternative : null;
  }

  function asymptoticLocalPower(p0Value, hValue, alphaValue) {
    var p0 = clamp(p0Value, 0, 1);
    var h = Number(hValue);
    var alpha = clamp(alphaValue, 1e-6, 0.5);
    if (p0 <= 0 || p0 >= 1 || !finite(h)) return null;
    var mean = h / Math.sqrt(p0 * (1 - p0));
    var critical = inverseNormal(1 - alpha / 2);
    return clamp(normalSF(critical - mean) + normalCdf(-critical - mean), 0, 1);
  }

  function exactPower(nValue, p0Value, hValue, alphaValue) {
    var n = Math.max(1, Math.round(Number(nValue)));
    var p0 = clamp(p0Value, 0, 1);
    var alternative = localAlternative(p0, n, hValue);
    var alpha = clamp(alphaValue, 1e-6, 0.5);
    if (alternative === null) return { alternative: null, power: null };
    var power = 0;
    for (var k = 0; k <= n; k += 1) {
      if (exactPValue(n, k, p0) <= alpha) power += binomialPmf(k, n, alternative);
    }
    return { alternative: alternative, power: clamp(power, 0, 1) };
  }

  function analyze(input) {
    var source = input || {};
    var n = Math.max(1, Math.min(240, Math.round(Number(source.n === undefined ? 40 : source.n))));
    var p0 = clamp(source.p0 === undefined ? 0.5 : source.p0, 0, 1);
    var k = Math.max(0, Math.min(n, Math.round(Number(source.k === undefined ? Math.round(n * p0) : source.k))));
    var alpha = clamp(source.alpha === undefined ? 0.05 : source.alpha, 0.001, 0.25);
    var h = Math.max(0, Number(source.h === undefined ? 1.5 : source.h));
    var phat = k / n;
    var wald = waldStatistic(n, k, p0);
    var score = scoreStatistic(n, k, p0);
    var lr = signedLogLikelihoodStatistic(n, k, p0);
    var exact = exactPValue(n, k, p0);
    var regular = p0 > 0 && p0 < 1;
    var waldP = regular ? twoSidedNormalP(wald) : null;
    var scoreP = regular ? twoSidedNormalP(score) : null;
    var lrP = regular ? twoSidedNormalP(lr) : null;
    var result = {
      n: n,
      k: k,
      p0: p0,
      phat: phat,
      alpha: alpha,
      h: h,
      localAlternative: localAlternative(p0, n, h),
      exact: { statistic: "probability ordering", pValue: exact, reject: exact <= alpha },
      wald: { statistic: wald, pValue: waldP, reject: waldP !== null && waldP <= alpha },
      score: { statistic: score, pValue: scoreP, reject: scoreP !== null && scoreP <= alpha },
      lr: { statistic: lr, pValue: lrP, reject: lrP !== null && lrP <= alpha },
      localPower: asymptoticLocalPower(p0, h, alpha),
      finiteLocalPower: exactPower(n, p0, h, alpha).power,
      exactSize: exactPower(n, p0, 0, alpha).power,
      regular: regular
    };
    return result;
  }

  function fixed(value, digits) {
    if (value === null || value === undefined) return "未定义";
    if (value === Infinity || value === -Infinity) return "∞";
    if (value !== 0 && Math.abs(value) < 1e-4) return Number(value).toExponential(3);
    return Number(value).toFixed(digits === undefined ? 4 : digits);
  }

  function escapeHtml(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function svgText(x, y, text, className, anchor) {
    return ['<text x="', x, '" y="', y, '"', className ? ' class="' + className + '"' : "", anchor ? ' text-anchor="' + anchor + '"' : "", '>', escapeHtml(text), '</text>'].join("");
  }

  function buildSvg(data) {
    var methods = [{ label: "exact", p: data.exact.pValue }, { label: "Wald", p: data.wald.pValue }, { label: "Score", p: data.score.pValue }, { label: "LR", p: data.lr.pValue }];
    var parts = [svgText(60, 22, "当前数据的 p 值；纵轴固定 0–1", "at-title")];
    function axes(top, bottom) {
      [0,.5,1].forEach(function(v){var y=bottom-(bottom-top)*v;parts.push('<line class="at-grid" x1="60" x2="654" y1="'+y+'" y2="'+y+'"></line>');parts.push(svgText(50,y+4,String(v),"at-small","end"));});
      parts.push('<line class="at-axis" x1="60" x2="60" y1="'+top+'" y2="'+bottom+'"></line>');
    }
    axes(60,180);axes(288,408);
    var alphaY=180-120*data.alpha;
    parts.push('<line class="at-alpha" x1="60" x2="654" y1="'+alphaY+'" y2="'+alphaY+'"></line>');
    parts.push(svgText(654,44,"红线 alpha="+fixed(data.alpha,3),"at-small","end"));
    methods.forEach(function(m,i){var x=130+i*145,h=m.p===null?0:120*m.p;parts.push('<rect class="at-bar-blue" x="'+(x-22)+'" y="'+(180-h)+'" width="44" height="'+h+'"></rect>');parts.push(svgText(x,202,m.label,"at-small","middle"));parts.push(svgText(x,222,m.p===null?"NA":fixed(m.p,4),"at-small","middle"));});
    parts.push(svgText(60,258,"功效：exact 有限模型与固定内点的渐近公式", "at-title"));
    parts.push(svgText(60,278,"p₁=p₀+h/√n："+(data.localAlternative===null?"超出[0,1]，有限备择未定义":fixed(data.localAlternative,4)),"at-small"));
    [{x:255,p:data.finiteLocalPower,label:"exact finite n"},{x:455,p:data.localPower,label:"Score 渐近"}].forEach(function(m,i){var h=m.p===null?0:120*m.p;parts.push('<rect class="'+(i?'at-bar-gold':'at-bar-blue')+'" x="'+(m.x-40)+'" y="'+(408-h)+'" width="80" height="'+h+'"></rect>');parts.push(svgText(m.x,430,m.label,"at-small","middle"));parts.push(svgText(m.x,450,m.p===null?"NA":fixed(m.p,4),"at-small","middle"));});
    return parts.join("");
  }

  function injectStyles(documentObject) {
    if (!documentObject || documentObject.getElementById(STYLE_ID)) return;
    var style = documentObject.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    documentObject.head.appendChild(style);
  }

  function mount(container) {
    if (!container || container.getAttribute("data-at-mounted") === "true") return;
    container.setAttribute("data-at-mounted", "true");
    injectStyles(container.ownerDocument);
    INSTANCE += 1;
    var prefix = "at-" + INSTANCE;
    var selected = [null, null, null];
    container.innerHTML = [
      '<div class="at-lab">',
      '<h3>精确二项 vs. Wald / Score / LR：渐近等价不是有限样本同票</h3>',
      '<p class="at-note">先把 alpha（规则阈值）与 p 值（数据尾概率）分开，再揭示边界、局部功效和有限枚举。计算不调用随机数。</p>',
      '<fieldset class="at-predict"><legend>三项预测</legend>',
      '<div class="at-question" data-question="0"><strong>1. 小样本比例检验中，哪一项能按有限二项分布直接校准？</strong><div class="at-choices"><button type="button" data-choice="0">exact 二项</button><button type="button" data-choice="1">Wald 正态</button><button type="button" data-choice="2">三者完全相同</button></div></div>',
      '<div class="at-question" data-question="1"><strong>2. 若 p-value=0.03、预先定 alpha=0.05，能否拒绝 H₀？这是否等于 P(H₀|data)=0.03？</strong><div class="at-choices"><button type="button" data-choice="0">拒绝；且等于该后验概率</button><button type="button" data-choice="1">不拒绝；alpha 不是阈值</button><button type="button" data-choice="2">拒绝；但 p 值不是 H₀ 后验概率</button></div></div>',
      '<div class="at-question" data-question="2"><strong>3. p₀=0 的边界/稀有事件下，哪种账本仍能直接使用？</strong><div class="at-choices"><button type="button" data-choice="0">Wald 一定最好</button><button type="button" data-choice="1">精确二项；内点渐近式可能失效</button><button type="button" data-choice="2">只需把 n 加倍</button></div></div>',
      '</fieldset>',
      '<div class="at-actions"><button class="at-primary" type="button" data-action="reveal">提交预测并揭示</button><button type="button" data-action="reset">重置</button></div>',
      '<p class="at-feedback" role="status" aria-live="polite"></p>',
      '<div class="at-reveal" hidden>',
      '<div class="at-presets">' + PRESETS.map(function (preset) { return '<button type="button" data-preset="' + preset.id + '">' + preset.label + '</button>'; }).join("") + '</div>',
      '<div class="at-controls">',
      '<div class="at-control"><label for="' + prefix + '-n">n：<output data-output="n">40</output></label><input id="' + prefix + '-n" data-input="n" type="range" min="10" max="200" step="10" value="40"></div>',
      '<div class="at-control"><label for="' + prefix + '-p0">p₀：<output data-output="p0">0.50</output></label><input id="' + prefix + '-p0" data-input="p0" type="range" min="0" max="1" step="0.01" value="0.5"></div>',
      '<div class="at-control"><label for="' + prefix + '-k">观测 k：<output data-output="k">25</output></label><input id="' + prefix + '-k" data-input="k" type="range" min="0" max="40" step="1" value="25"></div>',
      '<div class="at-control"><label for="' + prefix + '-alpha">alpha：<output data-output="alpha">0.05</output></label><input id="' + prefix + '-alpha" data-input="alpha" type="range" min="0.01" max="0.10" step="0.01" value="0.05"></div>',
      '<div class="at-control"><label for="' + prefix + '-h">局部 h：<output data-output="h">1.50</output></label><input id="' + prefix + '-h" data-input="h" type="range" min="0" max="3" step="0.25" value="1.5"></div>',
      '</div>',
      '<div class="at-stage"><div class="at-scroll" role="region" tabindex="0" aria-label="检验与功效图，窄屏可横向滚动"><svg viewBox="0 0 700 470" role="img" aria-labelledby="' + prefix + '-title ' + prefix + '-desc"><title id="' + prefix + '-title">精确与渐近检验比较</title><desc id="' + prefix + '-desc">上半图比较四种 p 值与 alpha，下半图比较局部备择下的有限精确功效与渐近功效。</desc><g data-svg></g></svg></div>',
      '<div class="at-table-wrap"><table aria-label="渐近检验透明账本"><caption>p 值是当前数据下的尾概率；拒绝由预先设定的 alpha 决定</caption><thead><tr><th>方法</th><th>统计量</th><th>p-value</th><th>alpha 决策</th><th>假设/边界</th></tr></thead><tbody data-ledger></tbody></table></div>',
      '<p class="at-status" role="status" aria-live="polite" data-status></p></div></div>',
      '</div>'
    ].join("");
    var lab = container.querySelector(".at-lab");
    var reveal = lab.querySelector(".at-reveal");
    var feedback = lab.querySelector(".at-feedback");
    var nInput = lab.querySelector('[data-input="n"]');
    var p0Input = lab.querySelector('[data-input="p0"]');
    var kInput = lab.querySelector('[data-input="k"]');
    var alphaInput = lab.querySelector('[data-input="alpha"]');
    var hInput = lab.querySelector('[data-input="h"]');

    function applyPreset(id) {
      var preset = PRESETS.filter(function (item) { return item.id === id; })[0] || PRESETS[0];
      nInput.value = String(preset.n);
      p0Input.value = String(preset.p0);
      kInput.max = String(preset.n);
      kInput.value = String(preset.k);
      alphaInput.value = String(preset.alpha);
      hInput.value = String(preset.h);
      render();
    }

    function render() {
      var n = Math.max(1, Math.round(Number(nInput.value)));
      kInput.max = String(n);
      if (Number(kInput.value) > n) kInput.value = String(n);
      var data = analyze({ n: n, p0: Number(p0Input.value), k: Number(kInput.value), alpha: Number(alphaInput.value), h: Number(hInput.value) });
      lab.querySelector('[data-output="n"]').textContent = String(data.n);
      lab.querySelector('[data-output="p0"]').textContent = fixed(data.p0, 2);
      lab.querySelector('[data-output="k"]').textContent = String(data.k);
      lab.querySelector('[data-output="alpha"]').textContent = fixed(data.alpha, 2);
      lab.querySelector('[data-output="h"]').textContent = fixed(data.h, 2);
      lab.querySelector("[data-svg]").innerHTML = buildSvg(data);
      var rows = [
        ["精确二项", data.exact.statistic, fixed(data.exact.pValue, 5), data.exact.reject ? "拒绝" : "不拒绝", "固定 p₀ 的概率排序；非等尾构造，通常保守"],
        ["Wald", fixed(data.wald.statistic, 4), fixed(data.wald.pValue, 5), data.wald.pValue === null ? "未定义" : data.wald.reject ? "拒绝" : "不拒绝", "用 p̂ 方差；k=0,n 或边界会退化"],
        ["Score", fixed(data.score.statistic, 4), fixed(data.score.pValue, 5), data.score.pValue === null ? "未定义" : data.score.reject ? "拒绝" : "不拒绝", "用 H₀ 下方差；要求 0<p₀<1 的正则内点"],
        ["LR", fixed(data.lr.statistic, 4), fixed(data.lr.pValue, 5), data.lr.pValue === null ? "未定义" : data.lr.reject ? "拒绝" : "不拒绝", "Wilks χ²(1) 是渐近结论；边界不自动适用"]
      ];
      lab.querySelector("[data-ledger]").innerHTML = rows.map(function (row) { return "<tr>" + row.map(function (cell) { return "<td>" + escapeHtml(cell) + "</td>"; }).join("") + "</tr>"; }).join("");
      var status = data.regular ? "当前 p₀ 是正则内点：Score/Wald/LR 的 χ² 或正态近似是 n→∞ 的定理；图中的有限 n、有限 k 和枚举功效只是当前模型的数值证据。" : "当前 p₀ 在参数空间边界：精确二项账本仍可按模型计算，但内点 Fisher/Wald/Score/Wilks 的常规渐近保证已失效；加大 n 不会修复错误的正则假设。";
      status += " 当前 exact 拒绝规则在 H₀ 下的实际拒绝率为 " + fixed(data.exactSize,5) + "（名义 alpha=" + fixed(data.alpha,3) + "）。";
      status += data.localAlternative === null ? " p₀+h/√n 已超出[0,1]，有限功效标 NA，未把备择截到边界。渐近值描述固定内点、足够大 n 的极限，不能与当前无效备择比较。" : " 当前有限备择 p₁=" + fixed(data.localAlternative,4) + "；渐近功效以固定内点和固定 h 为前提。";
      status += " 极小尾使用科学计数；数值0也可能来自浮点下溢，不能解读为原假设不可能。";
      lab.querySelector("[data-status]").textContent = status;
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
      var presetButton = event.target.closest("button[data-preset]");
      if (presetButton) { applyPreset(presetButton.getAttribute("data-preset")); return; }
      var action = event.target.closest("button[data-action]");
      if (!action) return;
      if (action.getAttribute("data-action") === "reveal") {
        if (selected.some(function (value) { return value === null; })) {
          feedback.className = "at-feedback at-warn";
          feedback.textContent = "请先完成三项预测，再打开检验账本。";
          return;
        }
        var correct = [0, 2, 1];
        var score = selected.reduce(function (sum, value, index) { return sum + (value === correct[index] ? 1 : 0); }, 0);
        feedback.className = "at-feedback " + (score === 3 ? "at-pass" : "at-warn");
        feedback.textContent = "预测 " + score + "/3。现在把有限精确、渐近近似、alpha 和 p-value 分栏。";
        reveal.hidden = false;
        render();
      } else {
        selected = [null, null, null];
        lab.querySelectorAll("button[data-choice]").forEach(function (button) { button.removeAttribute("aria-pressed"); });
        nInput.value = "40";
        p0Input.value = "0.5";
        kInput.value = "25";
        kInput.max = "40";
        alphaInput.value = "0.05";
        hInput.value = "1.5";
        reveal.hidden = true;
        feedback.className = "at-feedback";
        feedback.textContent = "";
      }
    });
    [nInput, p0Input, kInput, alphaInput, hInput].forEach(function (input) { input.addEventListener("input", render); });
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; if (!condition) fail("self-test failed: " + message); }
    [1, 2, 5, 20, 80].forEach(function (n) {
      [0, 0.02, 0.5, 0.98, 1].forEach(function (p) {
        var total = 0;
        for (var k = 0; k <= n; k += 1) total += binomialPmf(k, n, p);
        check(near(total, 1, 1e-8), "binomial mass sums to one");
      });
    });
    check(near(exactPValue(20, 0, 0), 1), "exact boundary p-value");
    check(exactPValue(20, 1, 0) < 1e-10, "impossible boundary observation is extreme");
    check(waldStatistic(20, 0, 0.5) === null, "Wald endpoint degenerates");
    check(scoreStatistic(20, 10, 0.5) === 0, "Score null statistic");
    check(near(signedLogLikelihoodStatistic(20, 10, 0.5), 0), "LR null statistic");
    check(twoSidedNormalP(0) > 0.99, "zero z has large p-value");
    check(twoSidedNormalP(1.96) < 0.06, "normal tail calibration");
    check(asymptoticLocalPower(0.5, 0, 0.05) < 0.06, "zero local effect has size");
    check(asymptoticLocalPower(0.5, 2, 0.05) > asymptoticLocalPower(0.5, 0, 0.05), "local power increases");
    var interior = analyze({ n: 40, p0: 0.5, k: 25, alpha: 0.05, h: 1.5 });
    check(interior.regular && interior.localPower !== null, "interior analysis is regular");
    check(interior.exact.pValue >= 0 && interior.exact.pValue <= 1, "exact p-value range");
    var boundary = analyze({ n: 40, p0: 0, k: 0, alpha: 0.05, h: 1.5 });
    check(!boundary.regular && boundary.score.pValue === null, "boundary score is undefined");
    check(boundary.wald.pValue === null && boundary.lr.pValue === null, "boundary asymptotic p-values are uncertified");
    check(boundary.exact.pValue === 1, "boundary exact null observation");
    check(interior.finiteLocalPower >= 0 && interior.finiteLocalPower <= 1, "finite local power range");
    return { checks: checks, presets: PRESETS.length };
  }

  return {
    PRESETS: PRESETS,
    logChoose: logChoose,
    binomialPmf: binomialPmf,
    normalCdf: normalCdf,
    normalSF: normalSF,
    twoSidedNormalP: twoSidedNormalP,
    inverseNormal: inverseNormal,
    exactPValue: exactPValue,
    waldStatistic: waldStatistic,
    scoreStatistic: scoreStatistic,
    signedLogLikelihoodStatistic: signedLogLikelihoodStatistic,
    localAlternative: localAlternative,
    asymptoticLocalPower: asymptoticLocalPower,
    exactPower: exactPower,
    analyze: analyze,
    mount: mount,
    selfTest: selfTest
  };
});
