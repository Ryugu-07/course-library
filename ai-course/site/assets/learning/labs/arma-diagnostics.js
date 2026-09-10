(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.CourseLearning) root.CourseLearning.register("arma-diagnostics", api.mount);
  if (typeof module === "object" && module.exports && require.main === module) {
    try { console.log("arma-diagnostics self-test: PASS (" + api.selfTest().checks + " checks)"); }
    catch (e) { console.error(e.stack); process.exitCode = 1; }
  }
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";
  var INSTANCE = 0, Z95 = 1.959963984540054;
  var DEFAULTS = Object.freeze({ kind: "ar1", coefficient: 0.8, length: 300, seed: 17, maxLag: 20 });
  var PRESETS = Object.freeze([
    { id: "positive", label: "AR 正相关", kind: "ar1", coefficient: 0.8 },
    { id: "negative", label: "AR 交替相关", kind: "ar1", coefficient: -0.8 },
    { id: "persistent", label: "AR 接近单位根", kind: "ar1", coefficient: 0.98 },
    { id: "unit", label: "AR 单位根", kind: "ar1", coefficient: 1 },
    { id: "explosive", label: "AR 前向增长", kind: "ar1", coefficient: 1.2 },
    { id: "ma", label: "MA 可逆", kind: "ma1", coefficient: 0.6 },
    { id: "boundary", label: "MA 逆的边界", kind: "ma1", coefficient: 1 },
    { id: "noninvertible", label: "MA 非可逆", kind: "ma1", coefficient: 1.2 },
    { id: "white", label: "白噪声", kind: "ar1", coefficient: 0 }
  ].map(Object.freeze));
  function assert(ok, message) { if (!ok) throw new Error(message); }
  function finite(x, name, lo, hi) {
    assert(typeof x === "number" && Number.isFinite(x) && x >= lo && x <= hi, name + " out of range");
    return x;
  }
  function integer(x, name, lo, hi) { finite(x, name, lo, hi); assert(Number.isInteger(x), name + " must be integer"); return x; }
  function model(kind) { assert(kind === "ar1" || kind === "ma1", "unknown model"); }
  function normalizeConfig(input) {
    assert(input && typeof input === "object" && !Array.isArray(input), "config object required");
    Object.keys(input).forEach(function (key) { assert(Object.hasOwn(DEFAULTS, key), "unknown config key: " + key); });
    var c = Object.assign({}, DEFAULTS, input);
    model(c.kind); finite(c.coefficient, "coefficient", -1.2, 1.2);
    integer(c.length, "length", 50, 1200); integer(c.seed, "seed", 0, 4294967295);
    integer(c.maxLag, "maxLag", 1, 40); assert(c.maxLag < c.length, "lag exceeds data");
    return c;
  }
  function sum(values) {
    var s = 0, correction = 0;
    values.forEach(function (v) { var y = v - correction, t = s + y; correction = (t - s) - y; s = t; });
    return s;
  }
  function theoryArgs(coef, variance, lag) {
    finite(coef, "coefficient", -1.2, 1.2); finite(variance, "innovation variance", Number.MIN_VALUE, 4);
    integer(lag, "maxLag", 0, 40);
  }
  function ar1Theory(phi, innovationVariance, maxLag) {
    theoryArgs(phi, innovationVariance, maxLag);
    var causal = Math.abs(phi) < 1, acf = [], pacf = [];
    for (var k = 0; k <= maxLag; k++) {
      acf.push(causal ? Math.pow(phi, k) : null);
      pacf.push(causal ? (k === 0 ? 1 : k === 1 ? phi : 0) : null);
    }
    return { causalStationary: causal, stationary: causal, invertible: null,
      rootModulus: phi === 0 ? null : Math.abs(1 / phi),
      variance: causal ? innovationVariance / ((1 - Math.abs(phi)) * (1 + Math.abs(phi))) : null,
      acf: acf, pacf: pacf };
  }
  function ma1Theory(theta, innovationVariance, maxLag) {
    theoryArgs(theta, innovationVariance, maxLag);
    var acf = [1], pacf = [1], abs = Math.abs(theta), u = abs > 1 ? 1 / abs : abs, denom = 1;
    for (var k = 1; k <= maxLag; k++) {
      acf.push(k === 1 ? theta / (1 + theta * theta) : 0);
      denom += Math.pow(u, 2 * k);
      pacf.push((k % 2 ? 1 : -1) * (theta < 0 && k % 2 ? -1 : 1) * Math.pow(u, k) / denom);
    }
    return { stationary: true, causalStationary: true, invertible: abs < 1,
      rootModulus: theta === 0 ? null : Math.abs(1 / theta), variance: innovationVariance * (1 + theta * theta), acf: acf, pacf: pacf };
  }
  function makeRandom(seed) {
    integer(seed, "seed", 0, 4294967295); var state = seed;
    return function () { state = (1664525 * state + 1013904223) >>> 0; return (state + 0.5) / 4294967296; };
  }
  function gaussianStream(seed) {
    var random = makeRandom(seed), spare = null;
    return function () {
      if (spare !== null) { var v = spare; spare = null; return v; }
      var radius = Math.sqrt(-2 * Math.log(random())), angle = 2 * Math.PI * random();
      spare = radius * Math.sin(angle); return radius * Math.cos(angle);
    };
  }
  function simulate(kind, coefficient, length, seed) {
    assert(arguments.length === 4, "simulate takes four arguments; no approximate burn-in");
    var c = normalizeConfig({ kind: kind, coefficient: coefficient, length: length, seed: seed });
    var noise = gaussianStream(c.seed), initialNoise = noise(), previousNoise = initialNoise;
    var previousX = Math.abs(coefficient) < 1 ? initialNoise / Math.sqrt((1 - Math.abs(coefficient)) * (1 + Math.abs(coefficient))) : 0;
    var values = [];
    for (var i = 0; i < length; i++) {
      var e = noise(), x = kind === "ar1" ? coefficient * previousX + e : e + coefficient * previousNoise;
      assert(Number.isFinite(x), "trajectory not representable");
      values.push(x); previousX = x; previousNoise = e;
    }
    return values;
  }
  function validateValues(values) {
    assert(Array.isArray(values) && values.length >= 2 && values.length <= 4096, "finite data array of length 2..4096 required");
    values.forEach(function (x) { assert(typeof x === "number" && Number.isFinite(x), "nonfinite observation"); });
  }
  function sampleStats(values, maxLag) {
    validateValues(values); integer(maxLag, "maxLag", 0, Math.min(40, values.length - 1));
    // Subtract a nearby anchor before scaling: dividing near-equal values first
    // can erase or distort one-ULP differences. Use normalized raw data only if
    // a subtraction across opposite extreme signs would overflow.
    var rawScale = Math.max.apply(null, values.map(Math.abs));
    var raw = values.map(function (v) { return rawScale === 0 ? 0 : v / rawScale; });
    var directSum = sum(values);
    var mean = Number.isFinite(directSum) ? directSum / values.length : sum(raw) / values.length * rawScale;
    var offsets = values.map(function (v) { return v - values[0]; });
    var safeOffsets = offsets.every(Number.isFinite);
    var base = safeOffsets ? offsets : values;
    var scale = Math.max.apply(null, base.map(Math.abs));
    var normalized = base.map(function (v) { return scale === 0 ? 0 : v / scale; });
    var meanScaled = sum(normalized) / values.length, centered = normalized.map(function (v) { return v - meanScaled; });
    var denominator = sum(centered.map(function (v) { return v * v; })), acf = [];
    var constant = values.every(function (x) { return x === values[0]; });
    if (!constant) assert(denominator > 0, "sample spread not representable");
    for (var k = 0; k <= maxLag; k++) {
      var products = [];
      for (var i = k; i < values.length; i++) products.push(centered[i] * centered[i - k]);
      acf.push(constant ? null : k === 0 ? 1 : sum(products) / denominator);
    }
    var sd = constant ? 0 : scale * Math.sqrt(denominator / values.length), variance = sd * sd;
    return { mean: constant ? values[0] : mean, sd: sd, variance: Number.isFinite(variance) ? variance : null,
      acf: acf, pacf: samplePacf(acf), constant: constant };
  }
  function sampleAcf(values, maxLag) { return sampleStats(values, maxLag).acf; }
  function samplePacf(acf) {
    assert(Array.isArray(acf) && acf.length >= 1 && acf.length <= 41, "ACF array required");
    if (acf.every(function (v) { return v === null; })) return acf.slice();
    assert(acf[0] === 1 && acf.every(function (v) { return typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= 1; }), "invalid ACF");
    var coefficients = [], result = [1], residual = 1;
    for (var k = 1; k < acf.length; k++) {
      var terms = coefficients.map(function (a, j) { return a * acf[k - j - 1]; });
      assert(residual > 0, "singular covariance; PACF undefined");
      var reflection = (acf[k] - sum(terms)) / residual;
      assert(Number.isFinite(reflection) && Math.abs(reflection) < 1, "non-positive definite covariance");
      var next = coefficients.map(function (a, j) { return a - reflection * coefficients[k - j - 2]; });
      next.push(reflection); coefficients = next; result.push(reflection);
      residual *= (1 - reflection) * (1 + reflection);
    }
    return result;
  }
  function forecast(kind, coefficient, values, horizon) {
    model(kind); finite(coefficient, "coefficient", -1.2, 1.2); validateValues(values); integer(horizon, "horizon", 1, 40);
    var rows = [], mean = values[values.length - 1], variance = 0, power = 1;
    // Exact finite-observation Gaussian conditioning for MA(1), with unit driving variance.
    var d = 1 + coefficient * coefficient, pivot = d, forward = values[0];
    if (kind === "ma1") {
      for (var i = 1; i < values.length; i++) {
        var multiplier = coefficient / pivot;
        forward = values[i] - multiplier * forward; pivot = d - coefficient * multiplier;
        assert(pivot > 0, "MA covariance must be positive definite");
      }
    }
    for (var h = 1; h <= horizon; h++) {
      if (kind === "ar1") { mean *= coefficient; variance += power; power *= coefficient * coefficient; }
      else { mean = h === 1 ? coefficient * forward / pivot : 0; variance = h === 1 ? d - coefficient * coefficient / pivot : d; }
      var sd = Math.sqrt(variance), lo = mean - Z95 * sd, hi = mean + Z95 * sd;
      assert([mean, variance, sd, lo, hi].every(Number.isFinite), "forecast not representable");
      rows.push({ h: h, mean: mean, variance: variance, sd: sd, lower: lo, upper: hi });
    }
    return rows;
  }
  function experiment(input) {
    var c = normalizeConfig(input), values = simulate(c.kind, c.coefficient, c.length, c.seed);
    var theory = c.kind === "ar1" ? ar1Theory(c.coefficient, 1, c.maxLag) : ma1Theory(c.coefficient, 1, c.maxLag);
    return { config: c, values: values, theory: theory, sample: sampleStats(values, c.maxLag), forecast: forecast(c.kind, c.coefficient, values, 8) };
  }
  function format(x, digits) {
    if (x === null || !Number.isFinite(x)) return "—";
    if (x === 0) return "0";
    var n = digits === undefined ? 5 : digits, fixed = x.toFixed(n);
    if (Math.abs(x) < 1e-4 || Math.abs(x) >= 1e6 || Number(fixed) === 0) return x.toExponential(5);
    return fixed.replace(/(\.\d*?[1-9])0+$|\.0+$/, "$1");
  }
  function coord(x) { assert(Number.isFinite(x), "nonfinite chart coordinate"); return x.toFixed(12); }
  function text(x, y, content, anchor) { return '<text x="' + x + '" y="' + y + '" text-anchor="' + (anchor || "start") + '">' + content + '</text>'; }
  function line(x1, y1, x2, y2, cls, extra) { return '<line class="' + cls + '" x1="' + coord(x1) + '" y1="' + coord(y1) + '" x2="' + coord(x2) + '" y2="' + coord(y2) + '"' + (extra || "") + '/>'; }
  function path(points, cls, name) { return '<path class="' + cls + '" data-series="' + name + '" d="' + points.map(function (p, i) { return (i ? "L" : "M") + coord(p[0]) + "," + coord(p[1]); }).join(" ") + '"/>'; }
  function svg(label, inside) { return '<svg viewBox="0 0 900 340" role="img" aria-label="' + label + '">' + inside + '</svg>'; }
  function bounds(values) {
    var lo = Math.min.apply(null, values), hi = Math.max.apply(null, values), range = hi - lo;
    if (range === 0) { lo -= 1; hi += 1; } else { lo -= range * 0.08; hi += range * 0.08; }
    return { lo: lo, hi: hi };
  }
  function axes(b, title, xmin, xmax) {
    var out = text(125, 24, title);
    for (var j = 0; j <= 4; j++) {
      var y = 290 - j * 60, v = b.lo + (b.hi - b.lo) * j / 4;
      out += line(125, y, 870, y, "ad-grid") + text(113, y + 4, format(v, 3), "end");
    }
    out += line(125, 50, 125, 290, "ad-axis") + line(125, 290, 870, 290, "ad-axis");
    out += text(125, 315, String(xmin)) + text(870, 315, String(xmax), "end");
    return out;
  }
  function drawTrajectory(result) {
    var b = bounds(result.values), n = result.values.length, y = function (v) { return 290 - (v - b.lo) / (b.hi - b.lo) * 240; };
    return svg("全部观测轨迹", axes(b, "全部 " + n + " 个观测；横轴 t，纵轴 X", 1, n) +
      path(result.values.map(function (v, i) { return [125 + 745 * i / (n - 1), y(v)]; }), "ad-path", "observations"));
  }
  function drawCorrelation(result, name) {
    assert(name === "acf" || name === "pacf", "unknown correlation chart");
    var theory = result.theory[name], sample = result.sample[name], lag = result.config.maxLag;
    var out = axes({ lo: -1, hi: 1 }, name.toUpperCase() + "：蓝线总体，金点样本；仅显示 lag 1.." + lag, 1, lag);
    var y = function (v) { return 170 - 120 * v; }, band = 1.96 / Math.sqrt(result.config.length);
    out += line(125, y(0), 870, y(0), "ad-axis");
    [band, -band].forEach(function (v) { out += line(125, y(v), 870, y(v), "ad-band"); });
    for (var k = 1; k <= lag; k++) {
      var x = 125 + 745 * (k - 1) / Math.max(1, lag - 1);
      if (theory[k] !== null) out += line(x, y(0), x, y(theory[k]), "ad-theory", ' data-lag="' + k + '"');
      if (sample[k] !== null) out += '<circle class="ad-sample" data-lag="' + k + '" cx="' + coord(x) + '" cy="' + coord(y(sample[k])) + '" r="4"/>';
    }
    if (theory[0] === null) out += text(440, 43, "当前前向模型：总体平稳证书不适用", "middle");
    return svg(name.toUpperCase() + " 总体与样本", out);
  }
  function drawForecast(result) {
    var n = result.values.length, past = result.values.slice(-20), rows = result.forecast;
    var b = bounds(past.concat(rows.flatMap(function (r) { return [r.mean, r.lower, r.upper]; })));
    var y = function (v) { return 290 - (v - b.lo) / (b.hi - b.lo) * 240; }, x = function (i) { return 125 + 745 * i / 27; };
    var out = axes(b, "最近 20 个观测与未来 8 步；竖线为逐步 95% 预测区间", n - 19, n + 8);
    out += path(past.map(function (v, i) { return [x(i), y(v)]; }), "ad-path", "history");
    out += line(x(19), 50, x(19), 290, "ad-band");
    out += path([[x(19), y(past[19])]].concat(rows.map(function (r, i) { return [x(i + 20), y(r.mean)]; })), "ad-forecast", "forecast");
    rows.forEach(function (r, i) {
      out += line(x(i + 20), y(r.lower), x(i + 20), y(r.upper), "ad-interval", ' data-h="' + r.h + '"');
      out += '<circle class="ad-sample" cx="' + coord(x(i + 20)) + '" cy="' + coord(y(r.mean)) + '" r="4"/>';
    });
    return svg("已知参数高斯条件预测", out);
  }
  var CSS = [
    ".ad-lab{min-width:0;max-width:100%;line-height:1.65;color:var(--fg);--ad-blue:var(--cl-blue,#315f9d);--ad-gold:var(--cl-gold,#9b6a12);--ad-green:var(--cl-green,#39734d);--ad-red:var(--cl-red,#b64335)}.ad-lab *{box-sizing:border-box}.ad-lab [hidden]{display:none!important}",
    ".ad-lab button,.ad-lab input,.ad-lab select{font:inherit;color:var(--fg)}.ad-lab button,.ad-lab select{min-height:44px;background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:8px;cursor:pointer}.ad-lab button[aria-pressed=true]{border-color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent)}.ad-lab button:disabled{opacity:.55;cursor:default}.ad-lab :focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}",
    ".ad-lab fieldset{min-width:0;margin:10px 0;border:1px solid var(--border);padding:12px;border-radius:6px}.ad-lab legend{font-weight:700}.ad-choices,.ad-actions,.ad-presets{display:flex;flex-wrap:wrap;gap:8px}.ad-choices>*{flex:1 1 150px}.ad-actions>*{flex:1 1 200px}.ad-feedback{min-height:2em;color:var(--fg-soft)}",
    ".ad-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:14px 0}.ad-control{display:grid;gap:4px;min-width:0}.ad-lab input[type=range]{width:100%;margin:0;min-height:44px;accent-color:var(--accent)}.ad-lab output{font-variant-numeric:tabular-nums;color:var(--accent)}.ad-lab label{font-size:13px;font-weight:700}",
    ".ad-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin:14px 0}.ad-metrics p{padding:8px;border-top:2px solid var(--border);margin:0;overflow-wrap:anywhere}.ad-metrics span,.ad-metrics strong{display:block}.ad-metrics span{font-size:12px;color:var(--fg-soft)}.ad-note{padding:12px;border-left:3px solid var(--ad-green);background:var(--bg);font-size:13px}",
    ".ad-scroll{max-width:100%;overflow-x:auto;overscroll-behavior-x:contain;border:1px solid var(--border);border-radius:6px;margin:12px 0;padding:8px}.ad-scroll svg{display:block;width:900px;min-width:900px;max-width:none;height:340px;overflow:visible}.ad-lab svg text{font-family:inherit;font-size:12px;fill:currentColor}.ad-axis{stroke:currentColor;stroke-width:1;opacity:.65}.ad-grid{stroke:var(--border);stroke-width:1}.ad-path{fill:none;stroke:var(--ad-blue);stroke-width:1.5}.ad-theory{stroke:var(--ad-blue);stroke-width:4}.ad-sample{fill:var(--ad-gold);stroke:var(--bg);stroke-width:1}.ad-band{stroke:var(--ad-red);stroke-width:1;stroke-dasharray:5 4}.ad-forecast{fill:none;stroke:var(--ad-green);stroke-width:2}.ad-interval{stroke:var(--ad-green);stroke-width:3;opacity:.65}",
    ".ad-lab table{min-width:1100px;width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.ad-lab th,.ad-lab td{padding:9px;text-align:right;border-bottom:1px solid var(--border);white-space:nowrap}.ad-lab th{color:var(--fg-soft)}.ad-lab caption{text-align:left;font-weight:700;margin:6px 0}.ad-reveal{margin-top:18px;border-top:1px solid var(--border);padding-top:12px}",
    "@media(max-width:700px){.ad-controls{grid-template-columns:minmax(0,1fr)}.ad-choices{display:grid;grid-template-columns:minmax(0,1fr)}}@media(prefers-reduced-motion:reduce){.ad-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");
  function mount(container) {
    if (!container || container.dataset.adMounted) return;
    var doc = container.ownerDocument;
    if (!doc.getElementById("cl-arma-diagnostics-styles")) { var style = doc.createElement("style"); style.id = "cl-arma-diagnostics-styles"; style.textContent = CSS; doc.head.appendChild(style); }
    container.dataset.adMounted = "true"; var prefix = "ad-" + (++INSTANCE), selected = [null, null, null], c = Object.assign({}, DEFAULTS);
    var questions = [
      ["MA(1) 的 |θ|>1：它一定不平稳吗？", ["是", "否；可逆性是另一条件", "只看样本长度"]],
      ["总体 MA(1) ACF 在 lag>1 为零，有限样本也必须逐项为零吗？", ["必须", "不必；存在抽样波动", "只在 θ<0 时"]],
      ["平稳序列的预测区间一定每一步严格变宽吗？", ["一定", "长度过百才会", "不一定；MA 可进入平台"]]
    ];
    var html = '<div class="ad-lab"><h3>AR / MA：从结构条件到预测账</h3><p>先判断三件事，再用同一随机回放核对总体与样本。图表保持原生宽度，可键盘横向滚动。</p>';
    questions.forEach(function (q, i) {
      html += '<fieldset><legend>' + (i + 1) + '. ' + q[0] + '</legend><div class="ad-choices">';
      q[1].forEach(function (label, j) { html += '<button type="button" data-question="' + i + '" data-choice="' + j + '" aria-pressed="false">' + label + '</button>'; });
      html += '</div></fieldset>';
    });
    html += '<div class="ad-actions"><button type="button" data-action="submit" disabled>提交预测并揭示</button><button type="button" data-action="reset">重置实验</button></div><p class="ad-feedback" aria-live="polite"></p><section class="ad-reveal" hidden><h4 tabindex="-1" data-result-title>核对结果与条件</h4><div class="ad-presets">';
    PRESETS.forEach(function (p) { html += '<button type="button" data-preset="' + p.id + '">' + p.label + '</button>'; });
    html += '</div><div class="ad-controls">';
    html += '<div class="ad-control"><label for="' + prefix + '-kind">模型</label><select id="' + prefix + '-kind" data-control="kind"><option value="ar1">AR(1)</option><option value="ma1">MA(1)</option></select></div>';
    [["coefficient", "系数 φ / θ", -1.2, 1.2, 0.02], ["length", "观测数 n", 50, 1200, 50]].forEach(function (a) {
      html += '<div class="ad-control"><label for="' + prefix + '-' + a[0] + '">' + a[1] + ' <output for="' + prefix + '-' + a[0] + '" data-output="' + a[0] + '"></output></label><input id="' + prefix + '-' + a[0] + '" type="range" min="' + a[2] + '" max="' + a[3] + '" step="' + a[4] + '" data-control="' + a[0] + '"></div>';
    });
    html += '<div class="ad-control"><label for="' + prefix + '-seed">固定回放 seed</label><select id="' + prefix + '-seed" data-control="seed"><option>17</option><option>107</option><option>20260910</option></select></div></div><div class="ad-metrics"></div><p class="ad-note" data-conditions></p>';
    [["trajectory", "全部观测轨迹"], ["acf", "ACF 总体与样本"], ["pacf", "PACF 总体与样本"], ["forecast", "高斯条件预测"]].forEach(function (a) {
      html += '<div class="ad-scroll" role="region" tabindex="0" aria-label="' + a[1] + '，左右键滚动" data-chart="' + a[0] + '"></div>';
    });
    html += '<p class="ad-note">红虚线 ±1.96/√n 是假设 iid 白噪声时单个非零 lag 的渐近参考线；不是当前 AR/MA 的置信带，也不是多重检验阈值。PACF 与 ACF 都只显示 lag 1..20；lag 0 的 ACF 为 1，PACF 的 lag 0 仅作递推约定。蓝色总体线缺席表示证书不适用，不能读成相关为零。</p>';
    html += '<div class="ad-scroll" role="region" tabindex="0" aria-label="相关系数逐项账，左右键滚动"><table data-table="correlation"></table></div><div class="ad-scroll" role="region" tabindex="0" aria-label="预测均值与区间账，左右键滚动"><table data-table="forecast"></table></div>';
    html += '<p class="ad-note">预测使用已知零均值、已知系数和 iid N(0,1) 驱动，条件只有观测 X₁,…,Xₙ。MA 的一步预测用有限观测高斯条件分布，未偷看生成器中的 εₙ。区间是每个未来观测的逐步 95% 预测区间，不是均值置信区间或八步同时覆盖带；未计参数估计、选模和未来结构变化的不确定性。极大前向增长时，相对于预测值很小的区间宽度可能低于浮点分辨率；此时端点重合不表示零风险，请读表中的条件标准差。</p></section></div>';
    container.innerHTML = html;
    var q = function (s) { return container.querySelector(s); }, all = function (s) { return Array.from(container.querySelectorAll(s)); };
    var revealed = false;
    function sync() {
      all("[data-control]").forEach(function (el) { el.value = String(c[el.dataset.control]); });
      all("[data-output]").forEach(function (el) { el.value = format(c[el.dataset.output], 2); });
      all("[data-preset]").forEach(function (el) {
        var p = PRESETS.find(function (v) { return v.id === el.dataset.preset; });
        el.setAttribute("aria-pressed", String(p.kind === c.kind && p.coefficient === c.coefficient));
      });
    }
    function render() {
      sync(); if (!revealed) return;
      var r = experiment(c), t = r.theory, s = r.sample;
      var certificate = c.kind === "ar1" ? (t.causalStationary ? "因果平稳" : "前向非平稳") : "有限 MA 平稳";
      var root = t.rootModulus === null ? "无有限根" : format(t.rootModulus);
      var diff = t.acf[0] === null ? null : Math.max.apply(null, t.acf.slice(1).map(function (v, i) { return Math.abs(v - s.acf[i + 1]); }));
      q(".ad-metrics").innerHTML = [["结构证书", certificate], ["滞后多项式根模", root], ["稳定因果逆", c.kind === "ar1" ? "驱动由有限差分得到" : t.invertible ? "|θ| < 1" : "|θ| ≥ 1，不满足"], ["总体平稳方差", format(t.variance)], ["样本方差（分母 n）", format(s.variance)], ["ACF 最大样本偏差", format(diff)]].map(function (a) { return "<p><span>" + a[0] + "</span><strong>" + a[1] + "</strong></p>"; }).join("");
      q("[data-conditions]").textContent = (c.kind === "ar1" ? (t.causalStationary ? "AR 从精确平稳高斯分布初始化，与未来驱动独立；不靠有限 burn-in 假装已经平稳。" : "AR 从 X₀=0 向前生成，当前不提供总体平稳 ACF/PACF。|φ|>1 的双边非因果平稳解是另一构造，不是这里的轨迹。") : "MA 使用独立 ε₀ 初始化，因此从第一项起平稳；|θ|≥1 影响稳定因果逆，不影响这个平稳构造。") + " 同 seed 共用 ε₀,ε₁,…；增大 n 保留原有前缀，但样本均值和所有样本相关会重新计算。更长样本不保证本次偏差逐项减小。";
      q('[data-chart="trajectory"]').innerHTML = drawTrajectory(r);
      q('[data-chart="acf"]').innerHTML = drawCorrelation(r, "acf");
      q('[data-chart="pacf"]').innerHTML = drawCorrelation(r, "pacf");
      q('[data-chart="forecast"]').innerHTML = drawForecast(r);
      q('[data-table="correlation"]').innerHTML = "<caption>相关账：总体、样本与差值（样本 − 总体）</caption><thead><tr>" + ["lag", "总体 ACF", "样本 ACF", "ACF 差", "总体 PACF", "样本 PACF", "PACF 差"].map(function (v) { return "<th scope=\"col\">" + v + "</th>"; }).join("") + "</tr></thead><tbody>" + t.acf.slice(1).map(function (v, i) {
        var k = i + 1; return "<tr>" + [k, v, s.acf[k], v === null ? null : s.acf[k] - v, t.pacf[k], s.pacf[k], t.pacf[k] === null ? null : s.pacf[k] - t.pacf[k]].map(function (x) { return "<td>" + format(x) + "</td>"; }).join("") + "</tr>";
      }).join("") + "</tbody>";
      q('[data-table="forecast"]').innerHTML = "<caption>未来观测预测账：已知参数，条件 X₁,…,Xₙ</caption><thead><tr>" + ["步 h", "条件均值", "条件方差", "条件标准差", "95% 下界", "95% 上界"].map(function (v) { return "<th scope=\"col\">" + v + "</th>"; }).join("") + "</tr></thead><tbody>" + r.forecast.map(function (v) { return "<tr>" + [v.h, v.mean, v.variance, v.sd, v.lower, v.upper].map(function (x) { return "<td>" + format(x) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody>";
    }
    all("[data-question]").forEach(function (button) {
      button.addEventListener("click", function () {
        selected[Number(button.dataset.question)] = Number(button.dataset.choice);
        all("[data-question]").forEach(function (b) { b.setAttribute("aria-pressed", String(selected[Number(b.dataset.question)] === Number(b.dataset.choice))); });
        revealed = false; q(".ad-reveal").hidden = true;
        q('[data-action="submit"]').disabled = selected.some(function (v) { return v === null; });
        q(".ad-feedback").textContent = "预测已记录；答完三题后可提交。改答会隐藏结果。";
      });
    });
    q('[data-action="submit"]').addEventListener("click", function () {
      if (selected.some(function (v) { return v === null; })) return;
      var score = selected.reduce(function (n, v, i) { return n + (v === [1, 1, 2][i] ? 1 : 0); }, 0);
      revealed = true; q(".ad-reveal").hidden = false; q('[data-action="submit"]').disabled = true;
      q(".ad-feedback").textContent = score + "/3。MA 非可逆仍平稳；样本不精确截尾；MA 预测区间可进入平台。";
      render(); q("[data-result-title]").focus();
    });
    q('[data-action="reset"]').addEventListener("click", function () {
      selected = [null, null, null]; c = Object.assign({}, DEFAULTS); revealed = false; q(".ad-reveal").hidden = true;
      all("[data-question]").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
      q('[data-action="submit"]').disabled = true; q(".ad-feedback").textContent = "已重置到默认模型与回放。"; sync(); q("[data-question]").focus();
    });
    all("[data-control]").forEach(function (el) {
      el.addEventListener(el.tagName === "INPUT" ? "input" : "change", function () { c[el.dataset.control] = el.dataset.control === "kind" ? el.value : Number(el.value); c = normalizeConfig(c); render(); });
    });
    all("[data-preset]").forEach(function (el) {
      el.addEventListener("click", function () { var p = PRESETS.find(function (v) { return v.id === el.dataset.preset; }); c.kind = p.kind; c.coefficient = p.coefficient; render(); });
    });
    sync();
  }
  function selfTest() {
    var checks = 0; function check(ok, message) { checks++; assert(ok, message); }
    check(Math.abs(ar1Theory(0.8, 1, 3).acf[3] - 0.512) < 1e-15, "AR ACF");
    check(ar1Theory(1, 1, 3).acf.every(function (v) { return v === null; }), "no fake unit-root ACF");
    check(ar1Theory(-1, 1, 3).variance === null, "negative unit root");
    check(ma1Theory(1.2, 1, 3).stationary && !ma1Theory(1.2, 1, 3).invertible, "MA conditions distinct");
    [1, -1].forEach(function (theta) { check(Math.abs(ma1Theory(theta, 1, 40).pacf[40] + 1 / 41) < 1e-15, "boundary PACF"); });
    check(sampleStats([2, 2, 2], 2).acf.every(function (v) { return v === null; }), "constant ACF undefined");
    check(format(10) === "10" && format(1e-30) !== "0", "formatter");
    check(makeRandom(0)() !== makeRandom(1)(), "seed zero distinct");
    var x = simulate("ar1", 0.4, 50, 17), y = simulate("ar1", 0.4, 100, 17);
    check(x.every(function (v, i) { return v === y[i]; }), "exact prefix");
    check(simulate("ar1", 0, 50, 17).every(function (v, i) { return v === simulate("ma1", 0, 50, 17)[i]; }), "shared white-noise stream");
    check(forecast("ar1", 1, [1, 2], 8)[7].variance === 8, "random-walk forecast");
    check(Math.abs(forecast("ma1", 0.6, [1, 2], 8)[7].variance - 1.36) < 1e-15, "MA forecast plateau");
    PRESETS.forEach(function (p) { var r = experiment({ kind: p.kind, coefficient: p.coefficient }); check(r.values.length === 300 && r.forecast.length === 8, p.id); });
    [{ kind: "MA" }, { coefficient: "0.8" }, { length: 50.5 }, { seed: -1 }, { burnIn: 300 }, { maxLag: 41 }].forEach(function (c) { var threw = false; try { normalizeConfig(c); } catch (_) { threw = true; } check(threw, "strict config"); });
    return { checks: checks };
  }
  return { DEFAULTS: DEFAULTS, PRESETS: PRESETS, Z95: Z95, normalizeConfig: normalizeConfig, ar1Theory: ar1Theory, ma1Theory: ma1Theory,
    makeRandom: makeRandom, gaussianStream: gaussianStream, simulate: simulate, sampleAcf: sampleAcf, sampleStats: sampleStats, samplePacf: samplePacf,
    forecast: forecast, experiment: experiment, format: format, drawTrajectory: drawTrajectory, drawCorrelation: drawCorrelation, drawForecast: drawForecast, mount: mount, selfTest: selfTest };
});
