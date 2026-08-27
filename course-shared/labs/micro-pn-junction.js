(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("micro-pn-junction", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("micro-pn-junction self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("micro-pn-junction self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function () {
  "use strict";

  var LAB_ID = "micro-pn-junction";
  var STYLE_ID = "micro-pn-junction-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var Q = 1.602176634e-19;
  var K_B = 8.617333262e-5;
  var EG = 1.12;
  var NI_300 = 1e10;
  var EPS_S = 1.04e-12;
  var DEFAULTS = { logNA: 16, logND: 16, bias: 0, temperature: 300, ideality: 1 };

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

  function normalize(input) {
    var source = input || {};
    return {
      logNA: clamp(finite(source.logNA === undefined ? DEFAULTS.logNA : source.logNA, "log NA"), 14, 19),
      logND: clamp(finite(source.logND === undefined ? DEFAULTS.logND : source.logND, "log ND"), 14, 19),
      bias: clamp(finite(source.bias === undefined ? DEFAULTS.bias : source.bias, "bias"), -2, 0.75),
      temperature: clamp(finite(source.temperature === undefined ? DEFAULTS.temperature : source.temperature, "temperature"), 260, 380),
      ideality: clamp(finite(source.ideality === undefined ? DEFAULTS.ideality : source.ideality, "ideality"), 1, 2)
    };
  }

  function intrinsicCarrier(temperature) {
    var t = finite(temperature, "temperature");
    return NI_300 * Math.pow(t / 300, 1.5) * Math.exp(-EG / (2 * K_B) * (1 / t - 1 / 300));
  }

  function calculate(input) {
    var state = normalize(input);
    var na = Math.pow(10, state.logNA);
    var nd = Math.pow(10, state.logND);
    var ni = intrinsicCarrier(state.temperature);
    var thermalVoltage = K_B * state.temperature;
    var vbi = thermalVoltage * Math.log(na * nd / (ni * ni));
    var depletionDrop = vbi - state.bias;
    var depletionValid = depletionDrop > 0;
    var width = depletionValid
      ? Math.sqrt(2 * EPS_S * depletionDrop / Q * (1 / na + 1 / nd))
      : 0;
    var capacitancePerArea = depletionValid ? EPS_S / width : Infinity;
    var exponent = state.bias / (state.ideality * thermalVoltage);
    var currentRatio = exponent > 50 ? Math.exp(50) - 1 : Math.exp(exponent) - 1;
    return {
      state: state,
      na: na,
      nd: nd,
      ni: ni,
      thermalVoltage: thermalVoltage,
      vbi: vbi,
      depletionDrop: depletionDrop,
      depletionValid: depletionValid,
      widthCm: width,
      widthUm: width * 1e4,
      capacitancePerArea: capacitancePerArea,
      currentRatio: currentRatio,
      currentLog: Math.log10(Math.max(1, Math.abs(currentRatio))),
      decadeVoltage: state.ideality * thermalVoltage * Math.log(10)
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
      '[data-learning-lab="' + LAB_ID + '"]{--mpj-blue:#2563a6;--mpj-orange:#b45a2c;--mpj-green:#39734d;--mpj-red:#b23a32;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}' +
      '[data-learning-lab="' + LAB_ID + '"] h3{margin:0;font-size:1.15rem;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] .mpj-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{font:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] button:hover{border-color:var(--mpj-blue)}[data-learning-lab="' + LAB_ID + '"] button[aria-pressed="true"],[data-learning-lab="' + LAB_ID + '"] .mpj-primary{border-color:var(--mpj-blue);background:var(--mpj-blue);color:#fff;font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible{outline:3px solid #1769aa;outline-offset:2px}' +
      '[data-learning-lab="' + LAB_ID + '"] .mpj-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;align-items:end;margin:12px 0}[data-learning-lab="' + LAB_ID + '"] .mpj-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .mpj-control label{font-size:13px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] output{color:var(--mpj-blue);font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + LAB_ID + '"] input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--mpj-blue)}[data-learning-lab="' + LAB_ID + '"] .mpj-actions{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}[data-learning-lab="' + LAB_ID + '"] .mpj-actions>*{flex:1 1 180px}' +
      '[data-learning-lab="' + LAB_ID + '"] .mpj-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mpj-good{color:var(--mpj-green)}[data-learning-lab="' + LAB_ID + '"] .mpj-warn{color:var(--mpj-red)}' +
      '[data-learning-lab="' + LAB_ID + '"] .mpj-layout{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(230px,.75fr);gap:15px;align-items:start}[data-learning-lab="' + LAB_ID + '"] .mpj-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:6px;overflow:hidden}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%}[data-learning-lab="' + LAB_ID + '"] svg text{font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] .mpj-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}[data-learning-lab="' + LAB_ID + '"] .mpj-metric{min-width:0;padding:8px;border-top:3px solid var(--mpj-blue)}[data-learning-lab="' + LAB_ID + '"] .mpj-metric:nth-child(2n){border-color:var(--mpj-orange)}[data-learning-lab="' + LAB_ID + '"] .mpj-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mpj-metric strong{display:block;margin-top:3px;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + LAB_ID + '"] .mpj-note{margin-top:11px;padding:9px 11px;border-left:3px solid var(--mpj-green);color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}' +
      '@media(max-width:760px){[data-learning-lab="' + LAB_ID + '"] .mpj-layout{grid-template-columns:1fr}}@media(max-width:560px){[data-learning-lab="' + LAB_ID + '"] .mpj-controls{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .mpj-choices{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }

  function metric(doc, label, value) {
    return create(doc, "div", { className: "mpj-metric" }, [
      create(doc, "span", { text: label }),
      create(doc, "strong", { text: value })
    ]);
  }

  function drawChart(doc, result) {
    var width = 620;
    var height = 300;
    var left = 60;
    var right = 18;
    var top = 20;
    var bottom = 42;
    var plotWidth = width - left - right;
    var plotHeight = height - top - bottom;
    var chart = svg(doc, "svg", { viewBox: "0 0 " + width + " " + height, role: "img", "aria-label": "二极管归一化电流随偏压变化的半对数图" });
    function x(bias) { return left + (bias + 2) / 2.75 * plotWidth; }
    function y(logCurrent) { return top + (13 - logCurrent) / 13 * plotHeight; }
    [0, 3, 6, 9, 12].forEach(function (tick) {
      var yy = y(tick);
      chart.appendChild(svg(doc, "line", { x1: left, y1: yy, x2: width - right, y2: yy, stroke: "#cbd5e1", "stroke-width": 1 }));
      chart.appendChild(text(doc, left - 8, yy + 4, "10^" + tick, { "text-anchor": "end", "font-size": 10 }));
    });
    [-2, -1, 0, 0.5, 0.75].forEach(function (tick) {
      var xx = x(tick);
      chart.appendChild(svg(doc, "line", { x1: xx, y1: top, x2: xx, y2: height - bottom, stroke: "#e2e8f0", "stroke-width": 1 }));
      chart.appendChild(text(doc, xx, height - 20, String(tick) + " V", { "text-anchor": "middle", "font-size": 10 }));
    });
    chart.appendChild(svg(doc, "line", { x1: left, y1: height - bottom, x2: width - right, y2: height - bottom, stroke: "currentColor", "stroke-width": 1.2 }));
    chart.appendChild(svg(doc, "line", { x1: left, y1: top, x2: left, y2: height - bottom, stroke: "currentColor", "stroke-width": 1.2 }));
    var points = [];
    for (var index = 0; index <= 100; index += 1) {
      var bias = -2 + 2.75 * index / 100;
      var sample = calculate({
        logNA: result.state.logNA,
        logND: result.state.logND,
        bias: bias,
        temperature: result.state.temperature,
        ideality: result.state.ideality
      });
      points.push((index ? "L" : "M") + x(bias).toFixed(2) + " " + y(sample.currentLog).toFixed(2));
    }
    chart.appendChild(svg(doc, "path", { d: points.join(" "), fill: "none", stroke: "#2563a6", "stroke-width": 2.5 }));
    var currentX = x(result.state.bias);
    chart.appendChild(svg(doc, "line", { x1: currentX, y1: top, x2: currentX, y2: height - bottom, stroke: "#b45a2c", "stroke-width": 2, "stroke-dasharray": "4 3" }));
    chart.appendChild(svg(doc, "circle", { cx: currentX, cy: y(result.currentLog), r: 5, fill: "#b45a2c", stroke: "white", "stroke-width": 1.5 }));
    chart.appendChild(text(doc, left + plotWidth / 2, height - 3, "偏压 V", { "text-anchor": "middle" }));
    chart.appendChild(text(doc, 14, top + plotHeight / 2, "|I/I_S| 对数", { "text-anchor": "middle", "font-size": 11, transform: "rotate(-90 14 " + (top + plotHeight / 2) + ")" }));
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
    node.appendChild(create(doc, "h3", { text: "pn 结实验：势垒、耗尽层与指数电流" }));
    node.appendChild(create(doc, "p", { className: "mpj-note", text: "默认问题：从 0 V 改成 -1 V 反偏时，耗尽宽度与结电容分别怎样变化？" }));
    var field = create(doc, "fieldset");
    field.appendChild(create(doc, "legend", { text: "预测：反偏后 W 与 Cj/A 的变化是" }));
    var choices = create(doc, "div", { className: "mpj-choices" });
    [["wide-small", "W 增大，Cj/A 减小"], ["both-up", "W、Cj/A 都增大"], ["narrow-large", "W 减小，Cj/A 增大"]].forEach(function (item) {
      var button = create(doc, "button", { type: "button", text: item[1], "aria-pressed": "false" });
      button.addEventListener("click", function () {
        predictionButtons.forEach(function (other) { other.setAttribute("aria-pressed", "false"); });
        button.setAttribute("aria-pressed", "true");
        prediction = item[0];
      });
      predictionButtons.push(button);
      choices.appendChild(button);
    });
    field.appendChild(choices);
    node.appendChild(field);

    var controls = create(doc, "div", { className: "mpj-controls" });
    function addRange(label, key, min, max, step, formatter) {
      var holder = create(doc, "div", { className: "mpj-control" });
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
    var naControl = addRange("受主浓度 log10(NA/cm^-3)", "logNA", 14, 19, 0.1, function (value) { return "10^" + format(value, 1); });
    var ndControl = addRange("施主浓度 log10(ND/cm^-3)", "logND", 14, 19, 0.1, function (value) { return "10^" + format(value, 1); });
    var biasControl = addRange("外加偏压 V", "bias", -2, 0.75, 0.01, function (value) { return format(value, 2) + " V"; });
    var tempControl = addRange("温度", "temperature", 260, 380, 1, function (value) { return value + " K"; });
    node.appendChild(controls);
    var actions = create(doc, "div", { className: "mpj-actions" });
    var check = create(doc, "button", { type: "button", className: "mpj-primary", text: "核对预测并显示结果" });
    var reset = create(doc, "button", { type: "button", text: "恢复默认" });
    actions.appendChild(check);
    actions.appendChild(reset);
    node.appendChild(actions);
    var feedback = create(doc, "p", { className: "mpj-feedback", "aria-live": "polite" });
    node.appendChild(feedback);
    var resultRoot = create(doc, "div", { hidden: true });
    node.appendChild(resultRoot);

    check.addEventListener("click", function () {
      revealed = true;
      var result = calculate(state);
      var ok = prediction === "wide-small";
      feedback.className = "mpj-feedback " + (ok ? "mpj-good" : "mpj-warn");
      feedback.textContent = ok ? "预测正确：Cj/A = epsilon_s/W，因此反偏把耗尽层变宽、单位面积电容变小。" : "再检查 Cj/A = epsilon_s/W：宽度与电容按反比变化。";
      if (api && typeof api.announce === "function") api.announce(node, feedback.textContent);
      renderResult(result);
    });
    reset.addEventListener("click", function () {
      state = Object.assign({}, DEFAULTS);
      prediction = null;
      revealed = false;
      predictionButtons.forEach(function (button) { button.setAttribute("aria-pressed", "false"); });
      [naControl, ndControl, biasControl, tempControl].forEach(function (control, index) {
        var key = ["logNA", "logND", "bias", "temperature"][index];
        control.input.value = state[key];
      });
      feedback.textContent = "";
      render();
    });

    function renderResult(result) {
      clear(resultRoot);
      resultRoot.appendChild(create(doc, "div", { className: "mpj-layout" }, [
        create(doc, "div", { className: "mpj-stage" }, [drawChart(doc, result)]),
        create(doc, "div", { className: "mpj-metrics" }, [
          metric(doc, "Vbi", format(result.vbi, 3) + " V"),
          metric(doc, "W", result.depletionValid ? format(result.widthUm, 3) + " um" : "耗尽近似失效"),
          metric(doc, "Cj/A", result.depletionValid ? format(result.capacitancePerArea, 3) + " F/cm^2" : "—"),
          metric(doc, "I/Is", Math.abs(result.currentRatio) >= 1e4 ? format(result.currentRatio, 2) : format(result.currentRatio, 4)),
          metric(doc, "十倍电压步长", format(result.decadeVoltage * 1000, 2) + " mV"),
          metric(doc, "热电压 VT", format(result.thermalVoltage * 1000, 2) + " mV")
        ])
      ]));
      var note = result.depletionValid
        ? "模型不变量：反偏使 W 增大、Cj/A 减小；在固定 Is、n、T 下，电流每增加十倍需要 nVT ln(10) = " + format(result.decadeVoltage * 1000, 2) + " mV。"
        : "当前正偏已使 Vbi - V <= 0；突变结耗尽近似到达边界，需改用高注入、串联电阻等模型。";
      resultRoot.appendChild(create(doc, "p", { className: "mpj-note", text: note }));
      resultRoot.hidden = !revealed;
    }

    function render() {
      naControl.output.textContent = naControl.formatter(state.logNA);
      ndControl.output.textContent = ndControl.formatter(state.logND);
      biasControl.output.textContent = biasControl.formatter(state.bias);
      tempControl.output.textContent = tempControl.formatter(state.temperature);
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
    var zero = calculate(DEFAULTS);
    var reverse = calculate({ logNA: 16, logND: 16, bias: -1, temperature: 300, ideality: 1 });
    var forward = calculate({ logNA: 16, logND: 16, bias: 0.55, temperature: 300, ideality: 1 });
    var sixtySix = calculate({ logNA: 16, logND: 16, bias: 0.66, temperature: 300, ideality: 1 });
    var moreForward = calculate({ logNA: 16, logND: 16, bias: 0.55 + zero.decadeVoltage, temperature: 300, ideality: 1 });
    assert(zero.depletionValid && reverse.depletionValid, "depletion model valid at zero and reverse bias");
    assert(reverse.widthUm > zero.widthUm && reverse.capacitancePerArea < zero.capacitancePerArea, "reverse-bias width/capacitance trend");
    assert(forward.currentRatio > 1e9, "forward current is exponential");
    assert(near(sixtySix.currentRatio, Math.exp(0.66 / zero.thermalVoltage) - 1, 1e-12), "forward bias range reaches 0.66 V");
    assert(near(moreForward.currentRatio / forward.currentRatio, 10, 2e-3), "60 mV decade rule");
    assert(calculate({ logNA: 17, logND: 16, bias: 0, temperature: 300 }).vbi > zero.vbi, "doping raises built-in potential logarithmically");
    assert(!calculate({ logNA: 16, logND: 16, bias: 0.65, temperature: 260 }).depletionValid || calculate({ logNA: 16, logND: 16, bias: 0.65, temperature: 260 }).widthUm >= 0, "boundary is explicit");
    return { checks: checks };
  }

  return { mount: mount, calculate: calculate, selfTest: selfTest };
});
