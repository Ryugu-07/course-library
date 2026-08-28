(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("physics-kinetic-transport", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      process.stdout.write("physics-kinetic-transport self-test: PASS (" + report.checks + " checks)\n");
    } catch (error) {
      process.stderr.write("physics-kinetic-transport self-test: FAIL\n" + error.stack + "\n");
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var LAB_ID = "physics-kinetic-transport";
  var STYLE_ID = "physics-kinetic-transport-styles";
  var INSTANCE = 0;
  var KB = 1.380649e-23;
  var MOLECULE_MASS = 4.65e-26;
  var SQRT_TWO = Math.sqrt(2);
  var GRADIENT_ARIA_LABEL = "数密度梯度，单位 m^-4（十的二十七次方每立方米每米）";
  var PRESETS = [
    { id: "ambient", label: "常压氮气：Kn 很小", densityLog: 0.398, temperature: 300, sigma: 4.3, length: 1, gradient: 0.5 },
    { id: "microchannel", label: "微通道：稀薄一些", densityLog: -1.602, temperature: 300, sigma: 4.3, length: 0.05, gradient: 0.5 },
    { id: "vacuum", label: "高真空：趋向弹道", densityLog: -2.602, temperature: 300, sigma: 4.3, length: 1, gradient: 0.5 },
    { id: "hot", label: "高温气体：速度变快", densityLog: 0.398, temperature: 900, sigma: 4.3, length: 1, gradient: 0.5 }
  ];

  var STYLE_TEXT = [
    ".kt-lab{--kt-blue:var(--cl-blue,#315f9d);--kt-gold:var(--cl-gold,#9b6a12);--kt-green:var(--cl-green,#39734d);--kt-red:var(--cl-red,#b64335);display:block;max-width:100%;min-width:0;color:var(--fg,#292722);line-height:1.55;overflow-wrap:anywhere}",
    ".kt-lab *,.kt-lab *::before,.kt-lab *::after{box-sizing:border-box}.kt-lab [hidden]{display:none!important}.kt-lab h3,.kt-lab h4{margin:0;letter-spacing:0}.kt-lab h3{font-size:1.16rem}.kt-lab p{margin:8px 0}.kt-lab .kt-note{color:var(--fg-soft,#6b6557);font-size:13px;line-height:1.7}.kt-lab button,.kt-lab input{font:inherit;letter-spacing:0}.kt-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#d7d0c2);border-radius:6px;background:var(--bg,#fff);color:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.kt-lab button:hover{border-color:var(--kt-blue)}.kt-lab button[aria-pressed=true],.kt-lab .kt-primary{border-color:var(--kt-blue);background:var(--kt-blue);color:var(--bg,#fff);font-weight:750}.kt-lab button:focus-visible,.kt-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.kt-lab .kt-predict{margin:13px 0 0;padding:12px;border:1px solid var(--border,#d7d0c2);background:var(--block-bg,var(--bg,#fff))}.kt-lab .kt-predict legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}.kt-lab .kt-question{display:grid;gap:7px;margin:10px 0}.kt-lab .kt-question strong{font-size:13px}.kt-lab .kt-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.kt-lab .kt-choices button{font-size:12px}.kt-lab .kt-actions,.kt-lab .kt-presets{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px}.kt-lab .kt-actions>*{flex:1 1 170px}.kt-lab .kt-presets button{flex:1 1 145px;font-size:12px}.kt-lab .kt-feedback{min-height:2em;margin:8px 0;color:var(--fg-soft,#6b6557);font-size:13px;font-weight:700}.kt-lab .kt-good{color:var(--kt-green)}.kt-lab .kt-warn{color:var(--kt-red)}",
    ".kt-lab .kt-reveal{margin-top:18px;padding-top:16px;border-top:1px solid var(--border,#d7d0c2)}.kt-lab .kt-controls{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:11px;align-items:end;margin:12px 0}.kt-lab .kt-control{display:grid;gap:5px;min-width:0}.kt-lab .kt-control label,.kt-lab .kt-control>span{color:var(--fg-soft,#6b6557);font-size:12.5px;font-weight:700;line-height:1.45}.kt-lab .kt-control output{color:var(--kt-blue);font-variant-numeric:tabular-nums}.kt-lab .kt-control input[type=range]{display:block;width:100%;min-width:0;min-height:44px;margin:0;accent-color:var(--kt-blue)}.kt-lab .kt-stage{min-width:0;padding:7px;border:1px solid var(--border,#d7d0c2);border-radius:7px;background:var(--bg,#fff);overflow:hidden}.kt-lab svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,#292722)}.kt-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.kt-lab .kt-metrics{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin:12px 0}.kt-lab .kt-metric{min-width:0;padding:9px;border-top:2px solid var(--border,#d7d0c2);background:var(--bg,#fff)}.kt-lab .kt-metric:nth-child(3n+1){border-color:var(--kt-blue)}.kt-lab .kt-metric:nth-child(3n+2){border-color:var(--kt-gold)}.kt-lab .kt-metric:nth-child(3n){border-color:var(--kt-green)}.kt-lab .kt-metric span{display:block;color:var(--fg-soft,#6b6557);font-size:11px;line-height:1.4}.kt-lab .kt-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.kt-lab .kt-table-wrap{max-width:100%;margin-top:12px;overflow-x:auto;-webkit-overflow-scrolling:touch}.kt-lab table{width:100%;min-width:760px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.kt-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft,#6b6557);font-size:12px}.kt-lab th,.kt-lab td{padding:7px 8px;border-bottom:1px solid var(--border,#d7d0c2);text-align:left;vertical-align:top}.kt-lab th{color:var(--fg-soft,#6b6557);font-size:11.5px}.kt-lab .kt-status{margin:12px 0 0;padding:10px 12px;border-left:3px solid var(--kt-green);background:var(--block-bg,var(--bg,#fff));font-size:13px;line-height:1.7}.kt-lab .kt-legend{display:flex;flex-wrap:wrap;gap:12px;margin-top:7px;color:var(--fg-soft,#6b6557);font-size:12px}.kt-lab .kt-legend span{display:inline-flex;align-items:center;gap:5px}.kt-lab .kt-swatch{display:inline-block;width:21px;border-top:3px solid var(--kt-blue)}.kt-lab .kt-swatch-gold{border-color:var(--kt-gold)}.kt-lab .kt-swatch-red{border-color:var(--kt-red);border-top-style:dashed}",
    ".kt-lab svg{overflow:visible}.kt-lab .kt-axis{fill:none;stroke:currentColor;stroke-width:1.2;stroke-opacity:.65}.kt-lab .kt-curve{fill:none;stroke:var(--kt-blue);stroke-width:2.8;stroke-linecap:round;stroke-linejoin:round}.kt-lab .kt-mean{fill:none;stroke:var(--kt-gold);stroke-width:1.8;stroke-dasharray:5 4}.kt-lab .kt-length{fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round}.kt-lab .kt-collision{fill:var(--kt-green);stroke:var(--bg,#fff);stroke-width:1}.kt-lab .kt-ballistic{fill:var(--kt-red)}.kt-lab .kt-lambda{fill:none;stroke:var(--kt-gold);stroke-width:2.6;stroke-linecap:round}.kt-lab .kt-title{fill:currentColor;font-size:12px;font-weight:750}.kt-lab .kt-label{fill:var(--fg-soft,#6b6557);font-size:11px}.kt-lab .kt-callout{fill:currentColor;font-size:11px;font-weight:750}.kt-lab .kt-positive{fill:var(--kt-green);font-size:11px;font-weight:750}.kt-lab .kt-negative{fill:var(--kt-red);font-size:11px;font-weight:750}",
    "@media(max-width:950px){.kt-lab .kt-controls{grid-template-columns:repeat(3,minmax(0,1fr))}.kt-lab .kt-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:620px){.kt-lab .kt-controls,.kt-lab .kt-metrics,.kt-lab .kt-choices{grid-template-columns:minmax(0,1fr)}.kt-lab .kt-stage{padding:4px}}@media(prefers-reduced-motion:reduce){.kt-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value)));
  }

  function near(left, right, tolerance) {
    return Math.abs(left - right) <= (tolerance === undefined ? 1e-9 : tolerance) * Math.max(1, Math.abs(left), Math.abs(right));
  }

  function format(value, digits) {
    if (!finite(value)) return "—";
    var places = digits === undefined ? 3 : digits;
    if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4));
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function normalize(input) {
    var source = input || {};
    return {
      densityLog: clamp(finite(Number(source.densityLog)) ? Number(source.densityLog) : 0.398, -3, 0.8),
      temperature: clamp(finite(Number(source.temperature)) ? Number(source.temperature) : 300, 80, 1200),
      sigma: clamp(finite(Number(source.sigma)) ? Number(source.sigma) : 4.3, 1, 12),
      length: clamp(finite(Number(source.length)) ? Number(source.length) : 1, 0.005, 10),
      gradient: clamp(finite(Number(source.gradient)) ? Number(source.gradient) : 0.5, 0, 2)
    };
  }

  function transportModel(input) {
    var state = normalize(input);
    var numberDensity = Math.pow(10, state.densityLog) * 1e25;
    var crossSection = state.sigma * 1e-19;
    var meanFreePath = 1 / (SQRT_TWO * numberDensity * crossSection);
    var meanSpeed = Math.sqrt(8 * KB * state.temperature / (Math.PI * MOLECULE_MASS));
    var thermalSpeed = Math.sqrt(2 * KB * state.temperature / MOLECULE_MASS);
    var collisionTime = meanFreePath / meanSpeed;
    var massDensity = numberDensity * MOLECULE_MASS;
    var diffusion = meanFreePath * meanSpeed / 3;
    var viscosity = massDensity * diffusion;
    var knudsen = meanFreePath / (state.length * 1e-3);
    var concentrationGradient = state.gradient * 1e27;
    var numberFlux = -diffusion * concentrationGradient;
    return {
      state: state,
      numberDensity: numberDensity,
      crossSection: crossSection,
      meanFreePath: meanFreePath,
      meanSpeed: meanSpeed,
      thermalSpeed: thermalSpeed,
      collisionTime: collisionTime,
      massDensity: massDensity,
      diffusion: diffusion,
      viscosity: viscosity,
      knudsen: knudsen,
      concentrationGradient: concentrationGradient,
      numberFlux: numberFlux,
      regime: knudsen < 0.01 ? "连续介质近似" : knudsen < 0.1 ? "滑移过渡区" : knudsen < 10 ? "过渡区" : "自由分子/弹道区"
    };
  }

  function maxwellSpeed(u) {
    return 4 / Math.sqrt(Math.PI) * u * u * Math.exp(-u * u);
  }

  function appendStyle(doc) {
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }

  function line(x1, y1, x2, y2, className) {
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" class="' + className + '"></line>';
  }

  function text(x, y, value, className, anchor) {
    return '<text x="' + x + '" y="' + y + '"' + (className ? ' class="' + className + '"' : "") + (anchor ? ' text-anchor="' + anchor + '"' : "") + '>' + String(value) + "</text>";
  }

  function svgStyleSemantics() {
    var css = STYLE_TEXT;
    var selectors = [
      ".kt-lab svg", ".kt-lab svg text", ".kt-axis", ".kt-curve", ".kt-mean", ".kt-length",
      ".kt-collision", ".kt-ballistic", ".kt-lambda", ".kt-title", ".kt-label", ".kt-callout",
      ".kt-positive", ".kt-negative", ".kt-legend", ".kt-swatch", ".kt-swatch-gold", ".kt-swatch-red"
    ];
    var missing = selectors.filter(function (selector) { return css.indexOf(selector) < 0; });
    return { ok: missing.length === 0, missing: missing };
  }

  function controlSemantics() {
    return { gradientAriaLabel: GRADIENT_ARIA_LABEL, gradientUnit: "m^-4" };
  }

  function dashboardSvg(data, uid) {
    var left = 42;
    var right = 330;
    var top = 55;
    var bottom = 212;
    var curve = [];
    for (var i = 0; i <= 80; i += 1) {
      var u = 4 * i / 80;
      var x = left + u / 4 * (right - left);
      var y = bottom - maxwellSpeed(u) / 0.9 * (bottom - top);
      curve.push((i ? "L " : "M ") + x.toFixed(2) + " " + y.toFixed(2));
    }
    var meanU = 2 / Math.sqrt(Math.PI);
    var meanX = left + meanU / 4 * (right - left);
    var scaleLeft = 405;
    var scaleRight = 715;
    var scaleY = 130;
    var lambdaRatio = data.knudsen;
    var ticks = [];
    if (lambdaRatio < 1) {
      var count = Math.min(9, Math.max(1, Math.floor(1 / lambdaRatio)));
      for (var tick = 0; tick <= count; tick += 1) {
        var tickX = scaleLeft + tick * lambdaRatio * (scaleRight - scaleLeft);
        if (tickX <= scaleRight + 1) ticks.push('<circle class="kt-collision" cx="' + tickX.toFixed(2) + '" cy="' + scaleY + '" r="4"></circle>');
      }
    } else {
      ticks.push('<circle class="kt-collision kt-ballistic" cx="' + scaleLeft + '" cy="' + scaleY + '" r="5"></circle>');
    }
    var lambdaEnd = Math.min(scaleRight + 55, scaleLeft + Math.max(lambdaRatio, 0.03) * (scaleRight - scaleLeft));
    var regimeClass = data.knudsen < 0.1 ? "kt-positive" : "kt-negative";
    return [
      '<svg viewBox="0 0 760 285" role="img" aria-labelledby="' + uid + '-title ' + uid + '-desc">',
      '<title id="' + uid + '-title">分子速度分布与平均自由程</title>',
      '<desc id="' + uid + '-desc">左侧显示归一化 Maxwell 速率分布及平均速率，右侧将平均自由程与宏观长度比较，碰撞点密度对应 Knudsen 数。</desc>',
      text(185, 25, "Maxwell 速率分布：u=v/v_th", "kt-title", "middle"),
      line(left, bottom, right, bottom, "kt-axis"),
      line(left, top, left, bottom, "kt-axis"),
      '<path class="kt-curve" d="' + curve.join(" ") + '"></path>',
      line(meanX, top + 8, meanX, bottom, "kt-mean"),
      text(meanX + 5, top + 18, "v̄", "kt-callout"),
      text(right, bottom + 22, "u", "kt-label", "end"),
      text(left - 7, top + 4, "p(u)", "kt-label", "end"),
      text(560, 25, "宏观长度 L 与平均自由程 λ", "kt-title", "middle"),
      line(scaleLeft, scaleY, scaleRight, scaleY, "kt-length"),
      line(scaleLeft, scaleY - 12, scaleLeft, scaleY + 12, "kt-length"),
      line(scaleRight, scaleY - 12, scaleRight, scaleY + 12, "kt-length"),
      ticks.join(""),
      '<line class="kt-lambda" x1="' + scaleLeft + '" y1="' + (scaleY - 30) + '" x2="' + lambdaEnd.toFixed(2) + '" y2="' + (scaleY - 30) + '"></line>',
      text(scaleLeft, scaleY + 35, "0", "kt-label"),
      text(scaleRight, scaleY + 35, "L=" + format(data.state.length, 3) + " mm", "kt-label", "end"),
      text(Math.min(lambdaEnd + 5, 710), scaleY - 37, "λ", "kt-callout"),
      text(560, 205, "λ/L=Kn=" + format(data.knudsen, 4), regimeClass, "middle"),
      text(560, 229, data.regime, regimeClass, "middle"),
      text(560, 254, "λ=1/(√2 nσ)，碰撞不是连续摩擦的原始定义", "kt-label", "middle"),
      '</svg>'
    ].join("");
  }

  function metric(doc, label, value) {
    var box = doc.createElement("div");
    box.className = "kt-metric";
    var name = doc.createElement("span");
    name.textContent = label;
    var reading = doc.createElement("strong");
    reading.textContent = value;
    box.appendChild(name);
    box.appendChild(reading);
    return box;
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument || root.getAttribute("data-kt-mounted") === "true") return;
    var doc = root.ownerDocument;
    appendStyle(doc);
    var uid = LAB_ID + "-" + (++INSTANCE);
    root.setAttribute("data-kt-mounted", "true");
    root.innerHTML = [
      '<div class="kt-lab">',
      '<h3>动力学输运：碰撞如何变成扩散系数</h3>',
      '<p class="kt-note">这里用稀薄、单原子/分子理想气体的数量级模型连接 Boltzmann 方程、平均自由程和宏观通量。先猜缩放关系，再检查 Knudsen 数是否允许把气体当连续介质。</p>',
      '<fieldset class="kt-predict"><legend>三项预测</legend>',
      '<div class="kt-question" data-question="0"><strong>1. 在 T、σ、L 固定时，把数密度 n 加倍，平均自由程 λ 怎样变？</strong><div class="kt-choices"><button type="button" data-choice="0">减半</button><button type="button" data-choice="1">加倍</button><button type="button" data-choice="2">不变</button></div></div>',
      '<div class="kt-question" data-question="1"><strong>2. 固定 n、σ，提高温度，平均分子速率与估计的 D 怎样变？</strong><div class="kt-choices"><button type="button" data-choice="0">都增加</button><button type="button" data-choice="1">都减少</button><button type="button" data-choice="2">λ 变，D 不变</button></div></div>',
      '<div class="kt-question" data-question="2"><strong>3. Kn=λ/L 很小时，哪种描述最合适？</strong><div class="kt-choices"><button type="button" data-choice="0">局部平衡和连续介质近似较可靠</button><button type="button" data-choice="1">分子几乎不碰撞，必是弹道流</button><button type="button" data-choice="2">必须使用量子简并统计</button></div></div>',
      '</fieldset>',
      '<div class="kt-actions"><button class="kt-primary" type="button" data-action="reveal">提交预测并揭示</button><button type="button" data-action="reset">重置</button></div>',
      '<p class="kt-feedback" role="status" aria-live="polite"></p>',
      '<div class="kt-reveal" hidden>',
      '<div class="kt-presets"></div>',
      '<div class="kt-controls">',
      '<label class="kt-control">log₁₀(n/10²⁵ m⁻³)：<output data-output="density"></output><input data-input="densityLog" type="range" min="-3" max="0.8" step="0.01" value="0.398" aria-label="数密度的十进对数"></label>',
      '<label class="kt-control">T：<output data-output="temperature"></output><input data-input="temperature" type="range" min="80" max="1200" step="10" value="300" aria-label="温度，开尔文"></label>',
      '<label class="kt-control">σ：<output data-output="sigma"></output><input data-input="sigma" type="range" min="1" max="12" step="0.1" value="4.3" aria-label="碰撞截面，十的负十九次方平方米"></label>',
      '<label class="kt-control">L：<output data-output="length"></output><input data-input="length" type="range" min="0.005" max="10" step="0.005" value="1" aria-label="宏观长度，毫米"></label>',
      '<label class="kt-control">∂n/∂x：<output data-output="gradient"></output><input data-input="gradient" type="range" min="0" max="2" step="0.05" value="0.5" aria-label="' + GRADIENT_ARIA_LABEL + '"></label>',
      '</div>',
      '<div class="kt-stage" data-stage></div>',
      '<div class="kt-metrics" data-metrics></div>',
      '<div class="kt-table-wrap"><table><caption>碰撞、随机游走和宏观输运的账本</caption><thead><tr><th>量</th><th>当前值</th><th>关系/解释</th></tr></thead><tbody data-ledger></tbody></table></div>',
      '<p class="kt-status" data-status role="status" aria-live="polite"></p>',
      '<div class="kt-legend"><span><i class="kt-swatch"></i>速率分布</span><span><i class="kt-swatch kt-swatch-gold"></i>平均自由程标记</span><span><i class="kt-swatch kt-swatch-red"></i>过渡/弹道提示</span></div>',
      '</div></div>'
    ].join("");
    var lab = root.firstElementChild;
    var reveal = lab.querySelector(".kt-reveal");
    var feedback = lab.querySelector(".kt-feedback");
    var inputs = {
      densityLog: lab.querySelector('[data-input="densityLog"]'),
      temperature: lab.querySelector('[data-input="temperature"]'),
      sigma: lab.querySelector('[data-input="sigma"]'),
      length: lab.querySelector('[data-input="length"]'),
      gradient: lab.querySelector('[data-input="gradient"]')
    };
    var predictions = [null, null, null];
    var presetHost = lab.querySelector(".kt-presets");
    PRESETS.forEach(function (preset) {
      var button = doc.createElement("button");
      button.type = "button";
      button.setAttribute("data-preset", preset.id);
      button.textContent = preset.label;
      presetHost.appendChild(button);
    });

    function setState(state) {
      inputs.densityLog.value = String(state.densityLog);
      inputs.temperature.value = String(state.temperature);
      inputs.sigma.value = String(state.sigma);
      inputs.length.value = String(state.length);
      inputs.gradient.value = String(state.gradient);
      render();
    }

    function render() {
      var data = transportModel({ densityLog: Number(inputs.densityLog.value), temperature: Number(inputs.temperature.value), sigma: Number(inputs.sigma.value), length: Number(inputs.length.value), gradient: Number(inputs.gradient.value) });
      lab.querySelector('[data-output="density"]').textContent = format(data.numberDensity / 1e25, 3) + "×10²⁵ m⁻³";
      lab.querySelector('[data-output="temperature"]').textContent = format(data.state.temperature, 0) + " K";
      lab.querySelector('[data-output="sigma"]').textContent = format(data.state.sigma, 2) + "×10⁻¹⁹ m²";
      lab.querySelector('[data-output="length"]').textContent = format(data.state.length, 3) + " mm";
      lab.querySelector('[data-output="gradient"]').textContent = format(data.state.gradient, 2) + "×10²⁷ m⁻⁴";
      lab.querySelector("[data-stage]").innerHTML = dashboardSvg(data, uid);
      lab.querySelector("[data-metrics]").replaceChildren(
        metric(doc, "λ", format(data.meanFreePath * 1e9, 3) + " nm"),
        metric(doc, "v̄", format(data.meanSpeed, 3) + " m/s"),
        metric(doc, "τ", format(data.collisionTime * 1e10, 3) + "×10⁻¹⁰ s"),
        metric(doc, "D", format(data.diffusion, 3) + " m²/s"),
        metric(doc, "η", format(data.viscosity, 3) + " Pa s"),
        metric(doc, "Kn", format(data.knudsen, 5))
      );
      lab.querySelector("[data-ledger]").innerHTML = [
        ["碰撞率", "λ=1/(√2 nσ)", format(data.meanFreePath, 4) + " m"],
        ["热运动尺度", "v̄=√(8k_BT/(πm))", format(data.meanSpeed, 3) + " m/s"],
        ["随机游走", "D≈λv̄/3", format(data.diffusion, 4) + " m²/s"],
        ["剪切输运", "η≈ρD=ρλv̄/3", format(data.viscosity, 4) + " Pa s"],
        ["Fick 通量", "J_n=−D∂n/∂x", format(data.numberFlux, 3) + " m⁻² s⁻¹"],
        ["连续性检查", "Kn=λ/L", format(data.knudsen, 5) + "；" + data.regime]
      ].map(function (row) { return "<tr><th scope=\"row\">" + row[0] + "</th><td>" + row[1] + "</td><td>" + row[2] + "</td></tr>"; }).join("");
      lab.querySelector("[data-status]").textContent = data.knudsen < 0.01
        ? "Kn 很小：许多次碰撞发生在宏观长度内，局部平衡和 Navier–Stokes/Fick 型闭合较有希望；系数仍是稀薄气体近似。"
        : "Kn 不再很小：边界层、非局部输运或弹道效应开始重要，不能只把宏观黏性系数当作普适常数。";
    }

    lab.addEventListener("click", function (event) {
      var choice = event.target.closest("button[data-choice]");
      if (choice) {
        var question = choice.closest("[data-question]");
        var index = Number(question.getAttribute("data-question"));
        predictions[index] = Number(choice.getAttribute("data-choice"));
        question.querySelectorAll("button[data-choice]").forEach(function (button) { button.setAttribute("aria-pressed", button === choice ? "true" : "false"); });
        return;
      }
      var preset = event.target.closest("button[data-preset]");
      if (preset) {
        var selected = PRESETS.filter(function (item) { return item.id === preset.getAttribute("data-preset"); })[0] || PRESETS[0];
        setState(selected);
        return;
      }
      var action = event.target.closest("button[data-action]");
      if (!action) return;
      if (action.getAttribute("data-action") === "reveal") {
        if (predictions.some(function (value) { return value === null; })) {
          feedback.className = "kt-feedback kt-warn";
          feedback.textContent = "请先完成三项预测；揭示后再拖动密度和尺度。";
          return;
        }
        var correct = [0, 0, 0];
        var score = predictions.reduce(function (sum, value, index) { return sum + (value === correct[index] ? 1 : 0); }, 0);
        feedback.className = "kt-feedback " + (score === 3 ? "kt-good" : "kt-warn");
        feedback.textContent = "预测 " + score + "/3。现在把碰撞尺度、随机游走和 Knudsen 边界连起来。";
        reveal.hidden = false;
        render();
      } else {
        predictions = [null, null, null];
        lab.querySelectorAll("button[data-choice]").forEach(function (button) { button.removeAttribute("aria-pressed"); });
        inputs.densityLog.value = "0.398";
        inputs.temperature.value = "300";
        inputs.sigma.value = "4.3";
        inputs.length.value = "1";
        inputs.gradient.value = "0.5";
        reveal.hidden = true;
        feedback.className = "kt-feedback";
        feedback.textContent = "";
      }
    });
    Object.keys(inputs).forEach(function (key) { inputs[key].addEventListener("input", render); inputs[key].addEventListener("change", render); });
    render();
    if (api && typeof api.announce === "function") api.announce(root, "动力学输运实验已加载；预测答案仍隐藏。");
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(LAB_ID + " self-test failed: " + message);
    }
    var base = transportModel({ densityLog: Math.log10(2.5), temperature: 300, sigma: 4.3, length: 1, gradient: 0.5 });
    var style = svgStyleSemantics();
    assert(style.ok, "SVG presentation styles cover rendered classes");
    assert(controlSemantics().gradientAriaLabel.indexOf("m^-4") >= 0, "density-gradient control uses m^-4");
    assert(base.meanFreePath > 6e-8 && base.meanFreePath < 7e-8, "ambient mean free path");
    assert(base.meanSpeed > 470 && base.meanSpeed < 485, "nitrogen thermal speed");
    assert(near(base.diffusion, base.meanFreePath * base.meanSpeed / 3), "random-walk diffusion estimate");
    assert(near(base.viscosity, base.massDensity * base.diffusion), "viscosity estimate");
    assert(near(base.knudsen, base.meanFreePath / 1e-3), "Knudsen number");
    assert(base.numberFlux < 0, "positive gradient gives negative Fick flux");
    var doubleDensity = transportModel({ densityLog: Math.log10(5), temperature: 300, sigma: 4.3, length: 1, gradient: 0.5 });
    assert(near(doubleDensity.meanFreePath, base.meanFreePath / 2), "density inverse mean free path");
    var hot = transportModel({ densityLog: Math.log10(2.5), temperature: 1200, sigma: 4.3, length: 1, gradient: 0.5 });
    assert(near(hot.meanSpeed, base.meanSpeed * 2), "temperature square-root speed scaling");
    assert(PRESETS.length >= 4, "teaching presets");
    return { checks: checks, presets: PRESETS.length };
  }

  return {
    KB: KB,
    MOLECULE_MASS: MOLECULE_MASS,
    PRESETS: PRESETS,
    normalize: normalize,
    transportModel: transportModel,
    maxwellSpeed: maxwellSpeed,
    controlSemantics: controlSemantics,
    svgStyleSemantics: svgStyleSemantics,
    mount: mount,
    selfTest: selfTest
  };
});
