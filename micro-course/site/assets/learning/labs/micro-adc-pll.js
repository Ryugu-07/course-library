(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("micro-adc-pll", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("micro-adc-pll self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("micro-adc-pll self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function () {
  "use strict";

  var LAB_ID = "micro-adc-pll";
  var STYLE_ID = "micro-adc-pll-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var DEFAULTS = { bits: 12, finGHz: 1, jitterFs: 50, loopMHz: 20 };

  function clamp(value, low, high) {
    return Math.max(low, Math.min(high, value));
  }

  function finite(value, label) {
    var number = Number(value);
    if (!Number.isFinite(number)) throw new RangeError(label + " must be finite");
    return number;
  }

  function near(left, right, tolerance) {
    var scale = Math.max(1, Math.abs(left), Math.abs(right));
    return Math.abs(left - right) <= (tolerance || 1e-9) * scale;
  }

  function format(value, digits) {
    if (!Number.isFinite(value)) return "—";
    if (Math.abs(value) >= 1e4 || (Math.abs(value) > 0 && Math.abs(value) < 0.01)) {
      return value.toExponential(digits === undefined ? 2 : digits);
    }
    return value.toFixed(digits === undefined ? 2 : digits).replace(/0+$/, "").replace(/\.$/, "");
  }

  function noiseDbFromFs(finGHz, jitterFs) {
    return -20 * Math.log10(2 * Math.PI * finGHz * 1e9 * jitterFs * 1e-15);
  }

  function pllNoise(loopMHz) {
    var bandwidth = finite(loopMHz, "loop bandwidth");
    var reference = 30 * Math.sqrt(0.2 + bandwidth / 25);
    var vco = 180 / Math.sqrt(1 + bandwidth / 8);
    return {
      bandwidth: bandwidth,
      referenceFs: reference,
      vcoFs: vco,
      totalFs: Math.sqrt(reference * reference + vco * vco)
    };
  }

  function findPllOptimum() {
    var best = null;
    for (var index = 0; index <= 198; index += 1) {
      var bandwidth = 1 + index * 0.5;
      var candidate = pllNoise(bandwidth);
      if (!best || candidate.totalFs < best.totalFs) best = candidate;
    }
    return best;
  }

  function normalize(input) {
    var source = input || {};
    return {
      bits: Math.round(clamp(finite(source.bits === undefined ? DEFAULTS.bits : source.bits, "bits"), 8, 16)),
      finGHz: clamp(finite(source.finGHz === undefined ? DEFAULTS.finGHz : source.finGHz, "input frequency"), 0.05, 10),
      jitterFs: clamp(finite(source.jitterFs === undefined ? DEFAULTS.jitterFs : source.jitterFs, "sampling jitter"), 5, 200),
      loopMHz: clamp(finite(source.loopMHz === undefined ? DEFAULTS.loopMHz : source.loopMHz, "loop bandwidth"), 1, 100)
    };
  }

  function calculate(input) {
    var state = normalize(input);
    var quantSNR = 6.02 * state.bits + 1.76;
    var inputJitterSNR = noiseDbFromFs(state.finGHz, state.jitterFs);
    var pll = pllNoise(state.loopMHz);
    var effectiveJitterFs = Math.sqrt(state.jitterFs * state.jitterFs + pll.totalFs * pll.totalFs);
    var effectiveJitterSNR = noiseDbFromFs(state.finGHz, effectiveJitterFs);
    var quantPower = Math.pow(10, -quantSNR / 10);
    var jitterPower = Math.pow(10, -effectiveJitterSNR / 10);
    var sndr = -10 * Math.log10(quantPower + jitterPower);
    var optimum = findPllOptimum();
    return {
      state: state,
      quantSNR: quantSNR,
      inputJitterSNR: inputJitterSNR,
      pll: pll,
      effectiveJitterFs: effectiveJitterFs,
      effectiveJitterSNR: effectiveJitterSNR,
      sndr: sndr,
      enob: (sndr - 1.76) / 6.02,
      pllOptimum: optimum
    };
  }

  function create(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "text") node.textContent = String(value);
      else if (key.slice(0, 2) === "on" && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) {
      if (child === null || child === undefined || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function svg(doc, tag, attrs, children) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      node.setAttribute(key, String(value));
    });
    (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) {
      if (child === null || child === undefined || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function text(doc, x, y, value, attrs) {
    return svg(doc, "text", Object.assign({ x: x, y: y, fill: "currentColor", "font-size": 11 }, attrs || {}), [value]);
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function installStyles(doc) {
    if (!doc || !doc.createElement || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="' + LAB_ID + '"]{--map-blue:#2563a6;--map-orange:#b45a2c;--map-green:#39734d;--map-red:#b23a32;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}' +
      '[data-learning-lab="' + LAB_ID + '"] h3{margin:0;font-size:1.15rem;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] .map-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{font:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] button:hover{border-color:var(--map-blue)}[data-learning-lab="' + LAB_ID + '"] button[aria-pressed="true"],[data-learning-lab="' + LAB_ID + '"] .map-primary{border-color:var(--map-blue);background:var(--map-blue);color:#fff;font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible{outline:3px solid #1769aa;outline-offset:2px}' +
      '[data-learning-lab="' + LAB_ID + '"] .map-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px;align-items:end;margin:12px 0}[data-learning-lab="' + LAB_ID + '"] .map-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .map-control label{font-size:13px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] output{color:var(--map-blue);font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + LAB_ID + '"] input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--map-blue)}[data-learning-lab="' + LAB_ID + '"] .map-actions{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}[data-learning-lab="' + LAB_ID + '"] .map-actions>*{flex:1 1 180px}' +
      '[data-learning-lab="' + LAB_ID + '"] .map-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="' + LAB_ID + '"] .map-good{color:var(--map-green)}[data-learning-lab="' + LAB_ID + '"] .map-warn{color:var(--map-red)}' +
      '[data-learning-lab="' + LAB_ID + '"] .map-layout{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px;align-items:start}[data-learning-lab="' + LAB_ID + '"] .map-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:6px;overflow:hidden}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%}[data-learning-lab="' + LAB_ID + '"] svg text{font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] .map-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:12px}[data-learning-lab="' + LAB_ID + '"] .map-metric{min-width:0;padding:8px;border-top:3px solid var(--map-blue)}[data-learning-lab="' + LAB_ID + '"] .map-metric:nth-child(2n){border-color:var(--map-orange)}[data-learning-lab="' + LAB_ID + '"] .map-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .map-metric strong{display:block;margin-top:3px;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + LAB_ID + '"] .map-note{margin-top:11px;padding:9px 11px;border-left:3px solid var(--map-green);color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}' +
      '@media(max-width:720px){[data-learning-lab="' + LAB_ID + '"] .map-layout{grid-template-columns:1fr}}@media(max-width:560px){[data-learning-lab="' + LAB_ID + '"] .map-controls{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .map-choices{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }

  function metric(doc, label, value, className) {
    return create(doc, "div", { className: className || "map-metric" }, [
      create(doc, "span", { text: label }),
      create(doc, "strong", { text: value })
    ]);
  }

  function drawAdcChart(doc, result) {
    var width = 300;
    var height = 260;
    var left = 46;
    var right = 15;
    var top = 24;
    var bottom = 42;
    var plotWidth = width - left - right;
    var plotHeight = height - top - bottom;
    var values = [
      { label: "量化", value: result.quantSNR, color: "#2563a6" },
      { label: "外部抖动", value: result.inputJitterSNR, color: "#39734d" },
      { label: "合成", value: result.sndr, color: "#b45a2c" }
    ];
    var chart = svg(doc, "svg", { viewBox: "0 0 " + width + " " + height, role: "img", "aria-label": "ADC 信噪比误差预算柱形图" });
    var min = Math.min(0, result.sndr - 10);
    var max = Math.max(80, result.quantSNR + 8);
    function y(value) { return top + (max - value) / (max - min) * plotHeight; }
    [0, 20, 40, 60, 80].forEach(function (tick) {
      if (tick < min || tick > max) return;
      var yy = y(tick);
      chart.appendChild(svg(doc, "line", { x1: left, y1: yy, x2: width - right, y2: yy, stroke: "#cbd5e1", "stroke-width": 1 }));
      chart.appendChild(text(doc, left - 7, yy + 4, tick + " dB", { "text-anchor": "end", "font-size": 10 }));
    });
    chart.appendChild(svg(doc, "line", { x1: left, y1: y(0), x2: width - right, y2: y(0), stroke: "currentColor", "stroke-width": 1.2 }));
    var band = plotWidth / values.length;
    values.forEach(function (item, index) {
      var barX = left + band * index + band * 0.2;
      var barWidth = band * 0.6;
      var barY = y(item.value);
      chart.appendChild(svg(doc, "rect", { x: barX, y: barY, width: barWidth, height: y(0) - barY, fill: item.color, opacity: 0.85 }));
      chart.appendChild(text(doc, barX + barWidth / 2, height - 24, item.label, { "text-anchor": "middle", "font-size": 10 }));
      chart.appendChild(text(doc, barX + barWidth / 2, Math.max(top + 12, barY - 6), format(item.value, 1), { "text-anchor": "middle", "font-size": 10, "font-weight": "700" }));
    });
    chart.appendChild(text(doc, left + plotWidth / 2, height - 5, "误差项（dB）", { "text-anchor": "middle" }));
    return chart;
  }

  function drawPllChart(doc, result) {
    var width = 300;
    var height = 260;
    var left = 45;
    var right = 16;
    var top = 24;
    var bottom = 42;
    var plotWidth = width - left - right;
    var plotHeight = height - top - bottom;
    var max = 190;
    var min = 0;
    var chart = svg(doc, "svg", { viewBox: "0 0 " + width + " " + height, role: "img", "aria-label": "PLL 环路带宽与总时钟抖动关系图" });
    function x(value) { return left + (value - 1) / 99 * plotWidth; }
    function y(value) { return top + (max - value) / (max - min) * plotHeight; }
    [0, 50, 100, 150].forEach(function (tick) {
      var yy = y(tick);
      chart.appendChild(svg(doc, "line", { x1: left, y1: yy, x2: width - right, y2: yy, stroke: "#cbd5e1", "stroke-width": 1 }));
      chart.appendChild(text(doc, left - 7, yy + 4, tick + " fs", { "text-anchor": "end", "font-size": 10 }));
    });
    [1, 25, 50, 75, 100].forEach(function (tick) {
      var xx = x(tick);
      chart.appendChild(svg(doc, "line", { x1: xx, y1: top, x2: xx, y2: height - bottom, stroke: "#e2e8f0", "stroke-width": 1 }));
      chart.appendChild(text(doc, xx, height - 23, String(tick), { "text-anchor": "middle", "font-size": 10 }));
    });
    chart.appendChild(svg(doc, "line", { x1: left, y1: height - bottom, x2: width - right, y2: height - bottom, stroke: "currentColor", "stroke-width": 1.2 }));
    chart.appendChild(svg(doc, "line", { x1: left, y1: top, x2: left, y2: height - bottom, stroke: "currentColor", "stroke-width": 1.2 }));
    var path = [];
    for (var index = 0; index <= 99; index += 1) {
      var bandwidth = 1 + index;
      path.push((index ? "L" : "M") + x(bandwidth).toFixed(2) + " " + y(pllNoise(bandwidth).totalFs).toFixed(2));
    }
    chart.appendChild(svg(doc, "path", { d: path.join(" "), fill: "none", stroke: "#2563a6", "stroke-width": 2.5 }));
    chart.appendChild(svg(doc, "line", { x1: x(result.state.loopMHz), y1: top, x2: x(result.state.loopMHz), y2: height - bottom, stroke: "#b45a2c", "stroke-width": 2, "stroke-dasharray": "4 3" }));
    chart.appendChild(svg(doc, "circle", { cx: x(result.state.loopMHz), cy: y(result.pll.totalFs), r: 5, fill: "#b45a2c", stroke: "white", "stroke-width": 1.5 }));
    chart.appendChild(svg(doc, "circle", { cx: x(result.pllOptimum.bandwidth), cy: y(result.pllOptimum.totalFs), r: 5, fill: "#39734d", stroke: "white", "stroke-width": 1.5 }));
    chart.appendChild(text(doc, x(result.pllOptimum.bandwidth), top + 13, "最优 proxy", { "text-anchor": "middle", fill: "#39734d", "font-size": 10 }));
    chart.appendChild(text(doc, left + plotWidth / 2, height - 5, "PLL 带宽 (MHz)", { "text-anchor": "middle" }));
    return chart;
  }

  function mount(node, api) {
    var doc = node.ownerDocument || (typeof document !== "undefined" ? document : null);
    if (!doc) return;
    installStyles(doc);
    clear(node);
    var state = Object.assign({}, DEFAULTS);
    var revealed = false;
    var prediction = null;
    var predictionButtons = [];
    node.appendChild(create(doc, "h3", { text: "ADC/PLL 实验：把位数、抖动和环路带宽放进同一预算" }));
    node.appendChild(create(doc, "p", { className: "map-note", text: "默认 12 bit、1 GHz、50 fs；先预测输入频率提高十倍时，抖动 SNR 会下降多少。" }));
    var predictionField = create(doc, "fieldset");
    predictionField.appendChild(create(doc, "legend", { text: "预测：fin 提高 10 倍、抖动不变时，抖动 SNR 会" }));
    var predictionRow = create(doc, "div", { className: "map-choices" });
    [["drop20", "下降约 20 dB"], ["drop6", "下降约 6 dB"], ["same", "基本不变"]].forEach(function (item) {
      var button = create(doc, "button", { type: "button", text: item[1], "aria-pressed": "false" });
      button.addEventListener("click", function () {
        predictionButtons.forEach(function (other) { other.setAttribute("aria-pressed", "false"); });
        button.setAttribute("aria-pressed", "true");
        prediction = item[0];
      });
      predictionButtons.push(button);
      predictionRow.appendChild(button);
    });
    predictionField.appendChild(predictionRow);
    node.appendChild(predictionField);
    var controls = create(doc, "div", { className: "map-controls" });
    function addRange(label, key, min, max, step, formatter) {
      var holder = create(doc, "div", { className: "map-control" });
      var output = create(doc, "output", { text: formatter(state[key]) });
      holder.appendChild(create(doc, "label", { text: label }, [output]));
      var input = create(doc, "input", { type: "range", min: min, max: max, step: step, value: state[key], "aria-label": label });
      input.addEventListener("input", function () {
        state[key] = Number(input.value);
        revealed = false;
        render();
      });
      holder.appendChild(input);
      controls.appendChild(holder);
      return { input: input, output: output, formatter: formatter };
    }
    var bitsControl = addRange("标称位数 N", "bits", 8, 16, 1, function (value) { return value + " bit"; });
    var frequencyControl = addRange("输入频率 fin", "finGHz", 0.05, 10, 0.05, function (value) { return format(value, 2) + " GHz"; });
    var jitterControl = addRange("外部采样抖动", "jitterFs", 5, 200, 1, function (value) { return value + " fs"; });
    var loopControl = addRange("PLL 环路带宽", "loopMHz", 1, 100, 1, function (value) { return value + " MHz"; });
    node.appendChild(controls);
    var actions = create(doc, "div", { className: "map-actions" });
    var check = create(doc, "button", { type: "button", className: "map-primary", text: "核对预测并显示预算" });
    var reset = create(doc, "button", { type: "button", text: "恢复默认" });
    actions.appendChild(check);
    actions.appendChild(reset);
    node.appendChild(actions);
    var feedback = create(doc, "p", { className: "map-feedback", "aria-live": "polite" });
    node.appendChild(feedback);
    var resultRoot = create(doc, "div", { hidden: true });
    node.appendChild(resultRoot);

    check.addEventListener("click", function () {
      revealed = true;
      var result = calculate(state);
      var ok = prediction === "drop20";
      feedback.className = "map-feedback " + (ok ? "map-good" : "map-warn");
      feedback.textContent = ok ? "预测正确：SNRjitter 中的 fin 与 sigma_t 相乘，频率十倍就是 20 dB 代价。" : "回到 -20 log10(2 pi fin sigma_t)：输入斜率每增十倍，时间误差造成的幅度误差也增十倍。";
      if (api && typeof api.announce === "function") api.announce(node, feedback.textContent);
      renderResult(result);
    });
    reset.addEventListener("click", function () {
      state = Object.assign({}, DEFAULTS);
      prediction = null;
      revealed = false;
      predictionButtons.forEach(function (button) { button.setAttribute("aria-pressed", "false"); });
      [bitsControl, frequencyControl, jitterControl, loopControl].forEach(function (control, index) {
        control.input.value = state[["bits", "finGHz", "jitterFs", "loopMHz"][index]];
      });
      feedback.textContent = "";
      render();
    });

    function renderResult(result) {
      clear(resultRoot);
      var layout = create(doc, "div", { className: "map-layout" });
      var adcStage = create(doc, "div", { className: "map-stage" }, [
        create(doc, "h4", { text: "ADC 误差预算" }),
        drawAdcChart(doc, result),
        create(doc, "div", { className: "map-metrics" }, [
          metric(doc, "量化 SNR", format(result.quantSNR, 2) + " dB"),
          metric(doc, "外部抖动 SNR", format(result.inputJitterSNR, 2) + " dB"),
          metric(doc, "合成 SNDR", format(result.sndr, 2) + " dB"),
          metric(doc, "ENOB", format(result.enob, 2) + " bit")
        ])
      ]);
      var pllStage = create(doc, "div", { className: "map-stage" }, [
        create(doc, "h4", { text: "PLL 噪声分流 proxy" }),
        drawPllChart(doc, result),
        create(doc, "div", { className: "map-metrics" }, [
          metric(doc, "参考项", format(result.pll.referenceFs, 1) + " fs"),
          metric(doc, "VCO 项", format(result.pll.vcoFs, 1) + " fs"),
          metric(doc, "总时钟抖动", format(result.pll.totalFs, 1) + " fs"),
          metric(doc, "proxy 最优带宽", format(result.pllOptimum.bandwidth, 1) + " MHz")
        ])
      ]);
      layout.appendChild(adcStage);
      layout.appendChild(pllStage);
      resultRoot.appendChild(layout);
      resultRoot.appendChild(create(doc, "p", { className: "map-note", text: "ADC 当前把外部抖动与 PLL proxy 的独立抖动按方差相加，得到有效 " + format(result.effectiveJitterFs, 1) + " fs；dB 只在展示时使用。环路带宽的最优点由本教学噪声曲线决定，不是任意 PLL 的通用规格。" }));
      resultRoot.hidden = !revealed;
    }

    function render() {
      [bitsControl, frequencyControl, jitterControl, loopControl].forEach(function (control, index) {
        var key = ["bits", "finGHz", "jitterFs", "loopMHz"][index];
        control.output.textContent = control.formatter(state[key]);
      });
      resultRoot.hidden = !revealed;
      if (revealed) renderResult(calculate(state));
    }
    render();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }
    var base = calculate(DEFAULTS);
    var extraBit = calculate({ bits: 13, finGHz: 1, jitterFs: 50, loopMHz: 20 });
    var tenX = calculate({ bits: 12, finGHz: 10, jitterFs: 50, loopMHz: 20 });
    var lowerJitter = calculate({ bits: 12, finGHz: 1, jitterFs: 25, loopMHz: 20 });
    assert(near(extraBit.quantSNR - base.quantSNR, 6.02, 1e-12), "6 dB per bit");
    assert(near(tenX.inputJitterSNR - base.inputJitterSNR, -20, 1e-12), "20 dB per decade frequency");
    assert(lowerJitter.effectiveJitterSNR > base.effectiveJitterSNR, "lower jitter improves SNR");
    assert(base.sndr <= base.quantSNR && base.sndr <= base.effectiveJitterSNR, "combined SNR bounded by components");
    assert(base.pllOptimum.bandwidth >= 1 && base.pllOptimum.bandwidth <= 100, "finite PLL optimum");
    assert(base.pllOptimum.totalFs <= pllNoise(1).totalFs && base.pllOptimum.totalFs <= pllNoise(100).totalFs, "PLL optimum beats endpoints");
    return { checks: checks };
  }

  return { mount: mount, calculate: calculate, pllNoise: pllNoise, selfTest: selfTest };
});
