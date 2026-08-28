(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("physics-waveguide-dispersion", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      process.stdout.write("physics-waveguide-dispersion self-test: PASS (" + report.checks + " checks)\n");
    } catch (error) {
      process.stderr.write("physics-waveguide-dispersion self-test: FAIL\n" + error.stack + "\n");
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var LAB_ID = "physics-waveguide-dispersion";
  var STYLE_ID = "physics-waveguide-dispersion-styles";
  var INSTANCE = 0;
  var C0 = 299792458;
  var MODES = {
    te10: { label: "TE₁₀", m: 1, n: 0 },
    te20: { label: "TE₂₀", m: 2, n: 0 },
    te01: { label: "TE₀₁", m: 0, n: 1 },
    te11: { label: "TE₁₁", m: 1, n: 1 }
  };
  var PRESETS = [
    { id: "x-band", label: "X 波段：TE₁₀", mode: "te10", a: 22.86, b: 10.16, epsilon: 1, frequency: 12 },
    { id: "near-cutoff", label: "靠近截止：7 GHz", mode: "te10", a: 22.86, b: 10.16, epsilon: 1, frequency: 7 },
    { id: "below-cutoff", label: "截止以下：5 GHz", mode: "te10", a: 22.86, b: 10.16, epsilon: 1, frequency: 5 },
    { id: "dielectric", label: "介质填充：εᵣ=2", mode: "te10", a: 22.86, b: 10.16, epsilon: 2, frequency: 10 }
  ];

  var STYLE_TEXT = [
    ".wg-lab .wg-swatch-evanescent{border-color:var(--wg-gold);border-top-style:dashed}",
    ".wg-lab{--wg-blue:var(--cl-blue,#315f9d);--wg-gold:var(--cl-gold,#9b6a12);--wg-green:var(--cl-green,#39734d);--wg-red:var(--cl-red,#b64335);display:block;max-width:100%;min-width:0;color:var(--fg,#292722);line-height:1.55;overflow-wrap:anywhere}",
    ".wg-lab *,.wg-lab *::before,.wg-lab *::after{box-sizing:border-box}.wg-lab [hidden]{display:none!important}.wg-lab h3,.wg-lab h4{margin:0;letter-spacing:0}.wg-lab h3{font-size:1.16rem}.wg-lab p{margin:8px 0}.wg-lab .wg-note{color:var(--fg-soft,#6b6557);font-size:13px;line-height:1.7}.wg-lab button,.wg-lab input,.wg-lab select{font:inherit;letter-spacing:0}.wg-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#d7d0c2);border-radius:6px;background:var(--bg,#fff);color:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.wg-lab button:hover{border-color:var(--wg-blue)}.wg-lab button[aria-pressed=true],.wg-lab .wg-primary{border-color:var(--wg-blue);background:var(--wg-blue);color:var(--bg,#fff);font-weight:750}.wg-lab button:focus-visible,.wg-lab input:focus-visible,.wg-lab select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.wg-lab .wg-predict{margin:13px 0 0;padding:12px;border:1px solid var(--border,#d7d0c2);background:var(--block-bg,var(--bg,#fff))}.wg-lab .wg-predict legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}.wg-lab .wg-question{display:grid;gap:7px;margin:10px 0}.wg-lab .wg-question strong{font-size:13px}.wg-lab .wg-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.wg-lab .wg-choices button{font-size:12px}.wg-lab .wg-actions,.wg-lab .wg-presets{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px}.wg-lab .wg-actions>*{flex:1 1 170px}.wg-lab .wg-presets button{flex:1 1 145px;font-size:12px}.wg-lab .wg-feedback{min-height:2em;margin:8px 0;color:var(--fg-soft,#6b6557);font-size:13px;font-weight:700}.wg-lab .wg-good{color:var(--wg-green)}.wg-lab .wg-warn{color:var(--wg-red)}",
    ".wg-lab .wg-reveal{margin-top:18px;padding-top:16px;border-top:1px solid var(--border,#d7d0c2)}.wg-lab .wg-controls{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:11px;align-items:end;margin:12px 0}.wg-lab .wg-control{display:grid;gap:5px;min-width:0}.wg-lab .wg-control label,.wg-lab .wg-control>span{color:var(--fg-soft,#6b6557);font-size:12.5px;font-weight:700;line-height:1.45}.wg-lab .wg-control output{color:var(--wg-blue);font-variant-numeric:tabular-nums}.wg-lab .wg-control input[type=range],.wg-lab .wg-control select{display:block;width:100%;min-width:0;min-height:44px;margin:0}.wg-lab .wg-control input[type=range]{accent-color:var(--wg-blue)}.wg-lab .wg-stage{min-width:0;padding:7px;border:1px solid var(--border,#d7d0c2);border-radius:7px;background:var(--bg,#fff);overflow:hidden}.wg-lab svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,#292722)}.wg-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.wg-lab .wg-metrics{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin:12px 0}.wg-lab .wg-metric{min-width:0;padding:9px;border-top:2px solid var(--border,#d7d0c2);background:var(--bg,#fff)}.wg-lab .wg-metric:nth-child(3n+1){border-color:var(--wg-blue)}.wg-lab .wg-metric:nth-child(3n+2){border-color:var(--wg-gold)}.wg-lab .wg-metric:nth-child(3n){border-color:var(--wg-green)}.wg-lab .wg-metric span{display:block;color:var(--fg-soft,#6b6557);font-size:11px;line-height:1.4}.wg-lab .wg-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.wg-lab .wg-table-wrap{max-width:100%;margin-top:12px;overflow-x:auto;-webkit-overflow-scrolling:touch}.wg-lab table{width:100%;min-width:720px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.wg-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft,#6b6557);font-size:12px}.wg-lab th,.wg-lab td{padding:7px 8px;border-bottom:1px solid var(--border,#d7d0c2);text-align:left;vertical-align:top}.wg-lab th{color:var(--fg-soft,#6b6557);font-size:11.5px}.wg-lab .wg-status{margin:12px 0 0;padding:10px 12px;border-left:3px solid var(--wg-green);background:var(--block-bg,var(--bg,#fff));font-size:13px;line-height:1.7}.wg-lab .wg-legend{display:flex;flex-wrap:wrap;gap:12px;margin-top:7px;color:var(--fg-soft,#6b6557);font-size:12px}.wg-lab .wg-legend span{display:inline-flex;align-items:center;gap:5px}.wg-lab .wg-swatch{display:inline-block;width:21px;border-top:3px solid var(--wg-blue)}.wg-lab .wg-swatch-gold{border-color:var(--wg-gold)}.wg-lab .wg-swatch-red{border-color:var(--wg-red);border-top-style:dashed}",
    ".wg-lab svg{overflow:visible}.wg-lab .wg-guide{fill:var(--wg-blue);fill-opacity:.05;stroke:var(--wg-blue);stroke-width:1;stroke-opacity:.3}.wg-lab .wg-lobe-a{fill:var(--wg-blue);fill-opacity:.62;stroke:var(--bg,#fff);stroke-width:1}.wg-lab .wg-lobe-b{fill:var(--wg-red);fill-opacity:.62;stroke:var(--bg,#fff);stroke-width:1}.wg-lab .wg-frame{fill:none;stroke:currentColor;stroke-width:1.5}.wg-lab .wg-axis{fill:none;stroke:currentColor;stroke-width:1.2;stroke-opacity:.65}.wg-lab .wg-dispersion{fill:none;stroke:var(--wg-blue);stroke-width:2.8;stroke-linecap:round;stroke-linejoin:round}.wg-lab .wg-evanescent{fill:none;stroke:var(--wg-gold);stroke-width:2.4;stroke-dasharray:6 4;stroke-linecap:round;stroke-linejoin:round}.wg-lab .wg-cutoff{fill:none;stroke:var(--wg-gold);stroke-width:1.8;stroke-dasharray:5 4}.wg-lab .wg-current{fill:var(--wg-red);stroke:var(--bg,#fff);stroke-width:1.5}.wg-lab .wg-title{fill:currentColor;font-size:12px;font-weight:750}.wg-lab .wg-label{fill:var(--fg-soft,#6b6557);font-size:11px}.wg-lab .wg-callout{fill:var(--wg-gold);font-size:11px;font-weight:750}.wg-lab .wg-positive{fill:var(--wg-green);font-size:11px;font-weight:750}.wg-lab .wg-negative{fill:var(--wg-red);font-size:11px;font-weight:750}",
    "@media(max-width:920px){.wg-lab .wg-controls{grid-template-columns:repeat(3,minmax(0,1fr))}.wg-lab .wg-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:620px){.wg-lab .wg-controls,.wg-lab .wg-metrics,.wg-lab .wg-choices{grid-template-columns:minmax(0,1fr)}.wg-lab .wg-stage{padding:4px}}@media(prefers-reduced-motion:reduce){.wg-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
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

  function mode(id) {
    return MODES[id] || MODES.te10;
  }

  function normalize(input) {
    var source = input || {};
    return {
      mode: MODES[source.mode] ? source.mode : "te10",
      a: clamp(finite(Number(source.a)) ? Number(source.a) : 22.86, 8, 60),
      b: clamp(finite(Number(source.b)) ? Number(source.b) : 10.16, 5, 30),
      epsilon: clamp(finite(Number(source.epsilon)) ? Number(source.epsilon) : 1, 1, 6),
      frequency: clamp(finite(Number(source.frequency)) ? Number(source.frequency) : 12, 1, 40)
    };
  }

  function waveguideModel(input) {
    var state = normalize(input);
    var selected = mode(state.mode);
    var a = state.a * 1e-3;
    var b = state.b * 1e-3;
    var speed = C0 / Math.sqrt(state.epsilon);
    var cutoff = speed / 2 * Math.sqrt(Math.pow(selected.m / a, 2) + Math.pow(selected.n / b, 2));
    var frequency = state.frequency * 1e9;
    var ratio = frequency / cutoff;
    var delta = ratio * ratio - 1;
    var propagationState = Math.abs(delta) <= 1e-10 ? "cutoff" : delta > 0 ? "above" : "below";
    var propagating = propagationState === "above";
    var evanescent = propagationState === "below";
    var root = propagating ? Math.sqrt(delta) / ratio : 0;
    var beta = propagating ? 2 * Math.PI * frequency / speed * root : propagationState === "cutoff" ? 0 : null;
    var alpha = evanescent ? 2 * Math.PI * cutoff / speed * Math.sqrt(Math.max(0, 1 - ratio * ratio)) : 0;
    return {
      state: state,
      mode: selected,
      speed: speed,
      cutoff: cutoff,
      frequencyHz: frequency,
      ratio: ratio,
      propagationState: propagationState,
      propagating: propagating,
      evanescent: evanescent,
      beta: beta,
      alpha: alpha,
      betaUnit: "rad/m",
      attenuationUnit: "Np/m",
      phaseVelocity: propagating ? speed / root : null,
      groupVelocity: propagating ? speed * root : null,
      guidedWavelength: propagating ? 2 * Math.PI / beta : null,
      productRatio: propagating ? (speed / root) * (speed * root) / (speed * speed) : null
    };
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

  function modeTopology(modeInput) {
    var selected = typeof modeInput === "string" ? mode(modeInput) : modeInput || MODES.te10;
    var xRegions = Math.max(selected.m + 1, 1);
    var yRegions = Math.max(selected.n + 1, 1);
    var signs = [];
    var values = [];
    for (var row = 0; row < yRegions; row += 1) {
      var signRow = [];
      var valueRow = [];
      for (var column = 0; column < xRegions; column += 1) {
        var xFraction = (column + 0.5) / xRegions;
        var yFraction = (row + 0.5) / yRegions;
        var value = Math.cos(selected.m * Math.PI * xFraction) * Math.cos(selected.n * Math.PI * yFraction);
        valueRow.push(value);
        signRow.push(value >= 0 ? 1 : -1);
      }
      signs.push(signRow);
      values.push(valueRow);
    }
    return { mode: selected, xRegions: xRegions, yRegions: yRegions, signs: signs, values: values };
  }

  function waveguideGeometry(data) {
    var modeData = data.mode;
    var left = 44;
    var top = 69;
    var topology = modeTopology(modeData);
    var cellWidth = 225 / topology.xRegions;
    var cellHeight = 132 / topology.yRegions;
    var cells = [];
    for (var row = 0; row < topology.yRegions; row += 1) {
      for (var column = 0; column < topology.xRegions; column += 1) {
        var sign = topology.signs[row][column] > 0 ? "wg-lobe-a" : "wg-lobe-b";
        var x = left + column * cellWidth;
        var y = top + row * cellHeight;
        cells.push('<rect class="' + sign + '" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + cellWidth.toFixed(1) + '" height="' + cellHeight.toFixed(1) + '"></rect>');
      }
    }
    var chartLeft = 361;
    var chartRight = 724;
    var chartTop = 68;
    var chartBottom = 202;
    var maxRatio = 2.5;
    var maxBeta = Math.sqrt(maxRatio * maxRatio - 1);
    var evanescentCurve = [];
    for (var belowIndex = 0; belowIndex <= 40; belowIndex += 1) {
      var belowRatio = belowIndex / 40;
      var normalizedAlpha = Math.sqrt(Math.max(0, 1 - belowRatio * belowRatio));
      var belowX = chartLeft + belowRatio / maxRatio * (chartRight - chartLeft);
      var belowY = chartBottom - normalizedAlpha / maxBeta * (chartBottom - chartTop);
      evanescentCurve.push((belowIndex ? "L " : "M ") + belowX.toFixed(2) + " " + belowY.toFixed(2));
    }
    var curve = [];
    for (var i = 0; i <= 80; i += 1) {
      var frequencyRatio = 1 + (maxRatio - 1) * i / 80;
      var normalizedBeta = Math.sqrt(Math.max(0, frequencyRatio * frequencyRatio - 1));
      var px = chartLeft + frequencyRatio / maxRatio * (chartRight - chartLeft);
      var py = chartBottom - normalizedBeta / maxBeta * (chartBottom - chartTop);
      curve.push((i ? "L " : "M ") + px.toFixed(2) + " " + py.toFixed(2));
    }
    var currentRatio = Math.min(data.ratio, maxRatio);
    var currentX = chartLeft + currentRatio / maxRatio * (chartRight - chartLeft);
    var currentMagnitude = data.propagationState === "above"
      ? Math.sqrt(Math.max(0, data.ratio * data.ratio - 1))
      : data.propagationState === "below"
        ? Math.sqrt(Math.max(0, 1 - data.ratio * data.ratio))
        : 0;
    var currentY = chartBottom - Math.min(currentMagnitude, maxBeta) / maxBeta * (chartBottom - chartTop);
    var cutoffX = chartLeft + (chartRight - chartLeft) / maxRatio;
    var stateText = data.propagationState === "above"
      ? "传播区：β>0（实数），α=0"
      : data.propagationState === "below"
        ? "截止以下：α>0（倏逝衰减），无实 β"
        : "正好截止：β=0，α=0（无衰减率）";
    var detailText = data.propagationState === "above"
      ? "β=" + format(data.beta, 2) + " rad/m；α=0 Np/m"
      : data.propagationState === "below"
        ? "α=" + format(data.alpha, 2) + " Np/m；β 不取实数"
        : "β=0 rad/m；α=0 Np/m";
    return {
      left: left,
      top: top,
      cellWidth: cellWidth,
      cellHeight: cellHeight,
      cells: cells.join(""),
      topology: topology,
      chartLeft: chartLeft,
      chartRight: chartRight,
      chartTop: chartTop,
      chartBottom: chartBottom,
      evanescentPath: evanescentCurve.join(" "),
      propagationPath: curve.join(" "),
      cutoffX: cutoffX,
      currentX: currentX,
      currentY: currentY,
      stateText: stateText,
      detailText: detailText
    };
  }

  function dashboardSvg(data, uid) {
    var geometry = waveguideGeometry(data);
    var modeData = data.mode;
    var left = geometry.left;
    var top = geometry.top;
    var chartLeft = geometry.chartLeft;
    var chartRight = geometry.chartRight;
    var chartTop = geometry.chartTop;
    var chartBottom = geometry.chartBottom;
    return [
      '<svg viewBox="0 0 760 300" role="img" aria-labelledby="' + uid + '-title ' + uid + '-desc">',
      '<title id="' + uid + '-title">矩形波导模式与截止色散</title>',
      '<desc id="' + uid + '-desc">左侧按 cos(mπx/a)cos(nπy/b) 的正负号显示 TE 模式横截面，右侧分别显示截止以下的 α/k_c 倏逝支和截止以上的 β/k_c 传播支。</desc>',
      text(156, 25, data.mode.label + " 横截面：模式波瓣", "wg-title", "middle"),
      '<rect class="wg-guide" x="' + left + '" y="' + top + '" width="225" height="132"></rect>',
      geometry.cells,
      '<rect class="wg-frame" x="' + left + '" y="' + top + '" width="225" height="132"></rect>',
      line(left, 215, left + 225, 215, "wg-axis"),
      line(30, top, 30, top + 132, "wg-axis"),
      text(157, 236, "a=" + format(data.state.a, 2) + " mm", "wg-label", "middle"),
      text(17, 140, "b", "wg-label", "middle"),
      text(157, 53, "H_z∝cos(mπx/a)cos(nπy/b)（示意）", "wg-label", "middle"),
      text(545, 25, "α/k_c（截止下）与 β/k_c（传播）", "wg-title", "middle"),
      line(chartLeft, chartBottom, chartRight, chartBottom, "wg-axis"),
      line(chartLeft, chartTop, chartLeft, chartBottom, "wg-axis"),
      '<path class="wg-evanescent" d="' + geometry.evanescentPath + '"></path>',
      '<path class="wg-dispersion" d="' + geometry.propagationPath + '"></path>',
      line(geometry.cutoffX, chartTop, geometry.cutoffX, chartBottom, "wg-cutoff"),
      '<circle class="wg-current" cx="' + geometry.currentX.toFixed(2) + '" cy="' + geometry.currentY.toFixed(2) + '" r="5"></circle>',
      text(geometry.cutoffX + 5, chartTop + 15, "f_c", "wg-callout"),
      text(chartRight, chartBottom + 22, "f/f_c", "wg-label", "end"),
      text(chartLeft - 8, chartTop + 4, "β/k_c", "wg-label", "end"),
      text(545, 257, geometry.stateText, data.propagationState === "above" ? "wg-positive" : data.propagationState === "below" ? "wg-negative" : "wg-label", "middle"),
      text(545, 278, data.propagationState === "above" ? "v_p>c_m，v_g<c_m，v_pv_g=c_m²" : geometry.detailText, "wg-label", "middle"),
      '</svg>'
    ].join("");
  }

  function metric(doc, label, value) {
    var box = doc.createElement("div");
    box.className = "wg-metric";
    var name = doc.createElement("span");
    name.textContent = label;
    var reading = doc.createElement("strong");
    reading.textContent = value;
    box.appendChild(name);
    box.appendChild(reading);
    return box;
  }

  function svgStyleSemantics() {
    var css = STYLE_TEXT;
    var selectors = [
      ".wg-lab svg", ".wg-lab svg text", ".wg-guide", ".wg-lobe-a", ".wg-lobe-b", ".wg-frame",
      ".wg-axis", ".wg-dispersion", ".wg-evanescent", ".wg-cutoff", ".wg-current", ".wg-title",
      ".wg-label", ".wg-callout", ".wg-positive", ".wg-negative", ".wg-legend", ".wg-swatch", ".wg-swatch-evanescent", ".wg-swatch-gold", ".wg-swatch-red"
    ];
    var missing = selectors.filter(function (selector) { return css.indexOf(selector) < 0; });
    return { ok: missing.length === 0, missing: missing };
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument || root.getAttribute("data-wg-mounted") === "true") return;
    var doc = root.ownerDocument;
    appendStyle(doc);
    var uid = LAB_ID + "-" + (++INSTANCE);
    root.setAttribute("data-wg-mounted", "true");
    root.innerHTML = [
      '<div class="wg-lab">',
      '<h3>矩形波导：截止线两侧，β 的身份不同</h3>',
      '<p class="wg-note">模型是理想 PEC 矩形波导中均匀、无耗散介质的 TEₘₙ 模式。先判断能否传播，再看色散关系；截止以下的场不是“没有场”，而是没有沿 z 方向传播的实波数。</p>',
      '<fieldset class="wg-predict"><legend>三项预测</legend>',
      '<div class="wg-question" data-question="0"><strong>1. f&lt;f_c 时，波导中会出现怎样的 β？</strong><div class="wg-choices"><button type="button" data-choice="0">β 为虚数，场指数衰减</button><button type="button" data-choice="1">β 仍为正实数</button><button type="button" data-choice="2">β 必须等于零且没有场</button></div></div>',
      '<div class="wg-question" data-question="1"><strong>2. 在传播区，哪组相速/群速关系正确？</strong><div class="wg-choices"><button type="button" data-choice="0">v_p&gt;c_m，v_g&lt;c_m</button><button type="button" data-choice="1">v_p&lt;c_m，v_g&gt;c_m</button><button type="button" data-choice="2">两者都恒等于 cₘ</button></div></div>',
      '<div class="wg-question" data-question="2"><strong>3. 固定模式与尺寸，提高 f 远离截止，v_g 会怎样？</strong><div class="wg-choices"><button type="button" data-choice="0">趋近介质中的 c_m</button><button type="button" data-choice="1">趋近零</button><button type="button" data-choice="2">变成无穷大</button></div></div>',
      '</fieldset>',
      '<div class="wg-actions"><button class="wg-primary" type="button" data-action="reveal">提交预测并揭示</button><button type="button" data-action="reset">重置</button></div>',
      '<p class="wg-feedback" role="status" aria-live="polite"></p>',
      '<div class="wg-reveal" hidden>',
      '<div class="wg-presets"></div>',
      '<div class="wg-controls">',
      '<label class="wg-control"><span>模式</span><select data-input="mode" aria-label="TE 模式"><option value="te10">TE₁₀</option><option value="te20">TE₂₀</option><option value="te01">TE₀₁</option><option value="te11">TE₁₁</option></select></label>',
      '<label class="wg-control">a：<output data-output="a"></output><input data-input="a" type="range" min="8" max="60" step="0.01" value="22.86" aria-label="波导宽边 a，毫米"></label>',
      '<label class="wg-control">b：<output data-output="b"></output><input data-input="b" type="range" min="5" max="30" step="0.01" value="10.16" aria-label="波导窄边 b，毫米"></label>',
      '<label class="wg-control">εᵣ：<output data-output="epsilon"></output><input data-input="epsilon" type="range" min="1" max="6" step="0.1" value="1" aria-label="相对介电常数"></label>',
      '<label class="wg-control">f：<output data-output="frequency"></output><input data-input="frequency" type="range" min="1" max="40" step="0.1" value="12" aria-label="频率，GHz"></label>',
      '</div>',
      '<div class="wg-stage" data-stage></div>',
      '<div class="wg-metrics" data-metrics></div>',
      '<div class="wg-table-wrap"><table><caption>截止与传播常数账本</caption><thead><tr><th>量</th><th>当前值</th><th>定义/解释</th></tr></thead><tbody data-ledger></tbody></table></div>',
      '<p class="wg-status" data-status role="status" aria-live="polite"></p>',
      '<div class="wg-legend"><span><i class="wg-swatch"></i>β/k_c 传播支</span><span><i class="wg-swatch wg-swatch-evanescent"></i>α/k_c 倏逝支</span><span><i class="wg-swatch wg-swatch-gold"></i>截止线</span><span><i class="wg-swatch wg-swatch-red"></i>当前频率</span></div>',
      '</div></div>'
    ].join("");
    var lab = root.firstElementChild;
    var reveal = lab.querySelector(".wg-reveal");
    var feedback = lab.querySelector(".wg-feedback");
    var inputs = {
      mode: lab.querySelector('[data-input="mode"]'),
      a: lab.querySelector('[data-input="a"]'),
      b: lab.querySelector('[data-input="b"]'),
      epsilon: lab.querySelector('[data-input="epsilon"]'),
      frequency: lab.querySelector('[data-input="frequency"]')
    };
    var predictions = [null, null, null];
    var presetHost = lab.querySelector(".wg-presets");
    PRESETS.forEach(function (preset) {
      var button = doc.createElement("button");
      button.type = "button";
      button.setAttribute("data-preset", preset.id);
      button.textContent = preset.label;
      presetHost.appendChild(button);
    });

    function setState(state) {
      inputs.mode.value = state.mode;
      inputs.a.value = String(state.a);
      inputs.b.value = String(state.b);
      inputs.epsilon.value = String(state.epsilon);
      inputs.frequency.value = String(state.frequency);
      render();
    }

    function render() {
      var data = waveguideModel({ mode: inputs.mode.value, a: Number(inputs.a.value), b: Number(inputs.b.value), epsilon: Number(inputs.epsilon.value), frequency: Number(inputs.frequency.value) });
      lab.querySelector('[data-output="a"]').textContent = format(data.state.a, 2) + " mm";
      lab.querySelector('[data-output="b"]').textContent = format(data.state.b, 2) + " mm";
      lab.querySelector('[data-output="epsilon"]').textContent = format(data.state.epsilon, 1);
      lab.querySelector('[data-output="frequency"]').textContent = format(data.state.frequency, 1) + " GHz";
      lab.querySelector("[data-stage]").innerHTML = dashboardSvg(data, uid);
      var constantLabel = data.propagationState === "above" ? "β" : data.propagationState === "below" ? "α" : "截止纵向常数";
      var constantValue = data.propagationState === "above"
        ? format(data.beta, 2) + " rad/m"
        : data.propagationState === "below"
          ? format(data.alpha, 2) + " Np/m"
          : "β=0 rad/m；α=0 Np/m";
      lab.querySelector("[data-metrics]").replaceChildren(
        metric(doc, "f_c", format(data.cutoff / 1e9, 3) + " GHz"),
        metric(doc, "f/f_c", format(data.ratio, 3)),
        metric(doc, constantLabel, constantValue),
        metric(doc, "v_p", data.propagating ? format(data.phaseVelocity / 1e6, 3) + " Mm/s" : "—"),
        metric(doc, "v_g", data.propagating ? format(data.groupVelocity / 1e6, 3) + " Mm/s" : "—"),
        metric(doc, "v_pv_g/cₘ²", data.propagating ? format(data.productRatio, 6) : "—")
      );
      lab.querySelector("[data-ledger]").innerHTML = [
        ["横向波数", "k_c=π√((m/a)²+(n/b)²)", format(Math.PI * Math.sqrt(Math.pow(data.mode.m / (data.state.a * 1e-3), 2) + Math.pow(data.mode.n / (data.state.b * 1e-3), 2)), 2) + " rad/m"],
        ["截止频率", "f_c=c_m k_c/(2π)", format(data.cutoff / 1e9, 4) + " GHz"],
        ["纵向色散", "β²=(ω/c_m)²−k_c²", data.propagationState === "above" ? "β 实数，允许传播" : data.propagationState === "below" ? "β=iα，α>0 Np/m，指数衰减" : "β=0，α=0；正好截止"],
        ["群相速", "v_pv_g=c_m²", data.propagationState === "above" ? format(data.productRatio, 6) + "（应为 1）" : "传播区外不定义"],
        ["导波波长", "λ_g=2π/β", data.propagationState === "above" ? format(data.guidedWavelength * 1000, 3) + " mm" : "—"]
      ].map(function (row) { return "<tr><th scope=\"row\">" + row[0] + "</th><td>" + row[1] + "</td><td>" + row[2] + "</td></tr>"; }).join("");
      lab.querySelector("[data-status]").textContent = data.propagationState === "above"
        ? "当前频率高于截止：β 为正实数，场沿 z 方向传播。v_p 大于 cₘ 不违反相对论，因为信息前沿与群速/能量输运需要单独分析。"
        : data.propagationState === "below"
          ? "当前频率低于截止：β=iα，α 用 Np/m 表示振幅衰减率；横向场可以存在，但没有沿 z 传播的实波数。"
          : "当前频率正好等于截止：β=0 且 α=0；这是传播与倏逝分支的边界，不宣称存在指数衰减。";
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
          feedback.className = "wg-feedback wg-warn";
          feedback.textContent = "请先完成三项预测；揭示后再拨动截止参数。";
          return;
        }
        var correct = [0, 0, 0];
        var score = predictions.reduce(function (sum, value, index) { return sum + (value === correct[index] ? 1 : 0); }, 0);
        feedback.className = "wg-feedback " + (score === 3 ? "wg-good" : "wg-warn");
        feedback.textContent = "预测 " + score + "/3。现在把 f_c、β、相速与群速放在同一条色散关系上。";
        reveal.hidden = false;
        render();
      } else {
        predictions = [null, null, null];
        lab.querySelectorAll("button[data-choice]").forEach(function (button) { button.removeAttribute("aria-pressed"); });
        inputs.mode.value = "te10";
        inputs.a.value = "22.86";
        inputs.b.value = "10.16";
        inputs.epsilon.value = "1";
        inputs.frequency.value = "12";
        reveal.hidden = true;
        feedback.className = "wg-feedback";
        feedback.textContent = "";
      }
    });
    Object.keys(inputs).forEach(function (key) { inputs[key].addEventListener("input", render); inputs[key].addEventListener("change", render); });
    render();
    if (api && typeof api.announce === "function") api.announce(root, "波导色散实验已加载；预测答案仍隐藏。");
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(LAB_ID + " self-test failed: " + message);
    }
    var base = waveguideModel({ mode: "te10", a: 22.86, b: 10.16, epsilon: 1, frequency: 12 });
    var style = svgStyleSemantics();
    assert(style.ok, "SVG presentation styles cover rendered classes");
    assert(base.cutoff > 6e9 && base.cutoff < 7e9, "X-band TE10 cutoff");
    assert(base.propagating, "12 GHz is above cutoff");
    assert(base.phaseVelocity > base.speed && base.groupVelocity < base.speed, "opposite phase/group inequalities");
    assert(near(base.productRatio, 1, 1e-10), "phase-group velocity product");
    assert(base.guidedWavelength > 0.02, "guided wavelength positive");
    var below = waveguideModel({ mode: "te10", a: 22.86, b: 10.16, epsilon: 1, frequency: 5 });
    assert(!below.propagating && below.evanescent && below.propagationState === "below" && below.alpha > 0 && below.beta === null, "below cutoff uses alpha without a real beta");
    assert(base.betaUnit === "rad/m" && below.attenuationUnit === "Np/m", "beta and attenuation units are explicit");
    var exact = waveguideModel({ mode: "te10", a: 22.86, b: 10.16, epsilon: 1, frequency: base.cutoff / 1e9 });
    assert(exact.propagationState === "cutoff" && exact.beta === 0 && exact.alpha === 0, "exact cutoff has zero beta and alpha");
    assert(!exact.evanescent, "exact cutoff does not claim exponential decay");
    assert(modeTopology("te10").xRegions === 2 && modeTopology("te10").yRegions === 1 && JSON.stringify(modeTopology("te10").signs) === JSON.stringify([[1, -1]]), "TE10 has two x sign regions");
    var te11 = modeTopology("te11");
    assert(te11.xRegions === 2 && te11.yRegions === 2 && JSON.stringify(te11.signs) === JSON.stringify([[1, -1], [-1, 1]]), "TE11 has four cosine sign regions");
    var higherMode = waveguideModel({ mode: "te20", a: 22.86, b: 10.16, epsilon: 1, frequency: 12 });
    assert(higherMode.cutoff > base.cutoff, "TE20 has higher cutoff");
    var dielectric = waveguideModel({ mode: "te10", a: 22.86, b: 10.16, epsilon: 2, frequency: 12 });
    assert(dielectric.cutoff < base.cutoff, "dielectric lowers cutoff in fixed geometry");
    assert(PRESETS.length >= 4, "teaching presets");
    return { checks: checks, presets: PRESETS.length };
  }

  return {
    C0: C0,
    MODES: MODES,
    PRESETS: PRESETS,
    normalize: normalize,
    waveguideModel: waveguideModel,
    modeTopology: modeTopology,
    waveguideGeometry: waveguideGeometry,
    svgStyleSemantics: svgStyleSemantics,
    mount: mount,
    selfTest: selfTest
  };
});
