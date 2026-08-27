(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("micro-mosfet", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("micro-mosfet self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("micro-mosfet self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function () {
  "use strict";

  var LAB_ID = "micro-mosfet";
  var STYLE_ID = "micro-mosfet-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var K_B = 8.617333262e-5;
  var PHI_F = 0.30;
  var DEFAULTS = { vgs: 0.80, vds: 0.80, vth0: 0.40, vsb: 0, wOverL: 2 };

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
      vgs: clamp(finite(source.vgs === undefined ? DEFAULTS.vgs : source.vgs, "VGS"), 0, 1.8),
      vds: clamp(finite(source.vds === undefined ? DEFAULTS.vds : source.vds, "VDS"), 0, 1.8),
      vth0: clamp(finite(source.vth0 === undefined ? DEFAULTS.vth0 : source.vth0, "Vth0"), 0.2, 0.7),
      vsb: clamp(finite(source.vsb === undefined ? DEFAULTS.vsb : source.vsb, "VSB"), 0, 0.8),
      wOverL: clamp(finite(source.wOverL === undefined ? DEFAULTS.wOverL : source.wOverL, "W/L"), 0.5, 8)
    };
  }

  function calculate(input) {
    var state = normalize(input);
    var thermalVoltage = K_B * 300;
    var gamma = 0.4;
    var threshold = state.vth0 + gamma * (Math.sqrt(2 * PHI_F + state.vsb) - Math.sqrt(2 * PHI_F));
    var overdrive = state.vgs - threshold;
    var k = 100e-6 * state.wOverL;
    var subthresholdFactor = 1.5;
    var current;
    var gm;
    var region;
    if (overdrive <= 0) {
      current = 1e-9 * state.wOverL * Math.exp(overdrive / (subthresholdFactor * thermalVoltage));
      gm = current / (subthresholdFactor * thermalVoltage);
      region = "subthreshold";
    } else if (state.vds < overdrive) {
      current = k * (overdrive * state.vds - state.vds * state.vds / 2);
      gm = k * state.vds;
      region = "linear";
    } else {
      current = 0.5 * k * overdrive * overdrive;
      gm = k * overdrive;
      region = "saturation";
    }
    return {
      state: state,
      thermalVoltage: thermalVoltage,
      threshold: threshold,
      overdrive: overdrive,
      k: k,
      current: current,
      gm: gm,
      region: region,
      vdsSat: overdrive > 0 ? overdrive : null,
      subthresholdSwing: subthresholdFactor * thermalVoltage * Math.log(10)
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
      '[data-learning-lab="' + LAB_ID + '"]{--mm-blue:#2563a6;--mm-orange:#b45a2c;--mm-green:#39734d;--mm-red:#b23a32;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}' +
      '[data-learning-lab="' + LAB_ID + '"] h3{margin:0;font-size:1.15rem;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] .mm-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{font:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] button:hover{border-color:var(--mm-blue)}[data-learning-lab="' + LAB_ID + '"] button[aria-pressed="true"],[data-learning-lab="' + LAB_ID + '"] .mm-primary{border-color:var(--mm-blue);background:var(--mm-blue);color:#fff;font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible{outline:3px solid #1769aa;outline-offset:2px}' +
      '[data-learning-lab="' + LAB_ID + '"] .mm-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px;align-items:end;margin:12px 0}[data-learning-lab="' + LAB_ID + '"] .mm-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .mm-control label{font-size:13px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] output{color:var(--mm-blue);font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + LAB_ID + '"] input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--mm-blue)}[data-learning-lab="' + LAB_ID + '"] .mm-actions{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}[data-learning-lab="' + LAB_ID + '"] .mm-actions>*{flex:1 1 180px}' +
      '[data-learning-lab="' + LAB_ID + '"] .mm-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mm-good{color:var(--mm-green)}[data-learning-lab="' + LAB_ID + '"] .mm-warn{color:var(--mm-red)}' +
      '[data-learning-lab="' + LAB_ID + '"] .mm-layout{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(230px,.75fr);gap:15px;align-items:start}[data-learning-lab="' + LAB_ID + '"] .mm-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:6px;overflow:hidden}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%}[data-learning-lab="' + LAB_ID + '"] svg text{font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] .mm-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}[data-learning-lab="' + LAB_ID + '"] .mm-metric{min-width:0;padding:8px;border-top:3px solid var(--mm-blue)}[data-learning-lab="' + LAB_ID + '"] .mm-metric:nth-child(2n){border-color:var(--mm-orange)}[data-learning-lab="' + LAB_ID + '"] .mm-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mm-metric strong{display:block;margin-top:3px;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + LAB_ID + '"] .mm-note{margin-top:11px;padding:9px 11px;border-left:3px solid var(--mm-green);color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}' +
      '@media(max-width:820px){[data-learning-lab="' + LAB_ID + '"] .mm-layout{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .mm-controls{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){[data-learning-lab="' + LAB_ID + '"] .mm-controls{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .mm-choices{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }

  function metric(doc, label, value) {
    return create(doc, "div", { className: "mm-metric" }, [
      create(doc, "span", { text: label }),
      create(doc, "strong", { text: value })
    ]);
  }

  function drawChart(doc, result) {
    var width = 620;
    var height = 310;
    var left = 58;
    var right = 20;
    var top = 20;
    var bottom = 44;
    var plotWidth = width - left - right;
    var plotHeight = height - top - bottom;
    var yMax = Math.max(20, result.k * 0.5 * 1.8 * 1.8 * 1.15 * 1e6);
    var chart = svg(doc, "svg", { viewBox: "0 0 " + width + " " + height, role: "img", "aria-label": "MOSFET 输出特性与当前工作点" });
    function x(vds) { return left + vds / 1.8 * plotWidth; }
    function y(currentMicroamps) { return top + (yMax - currentMicroamps) / yMax * plotHeight; }
    [0, yMax / 2, yMax].forEach(function (tick) {
      var yy = y(tick);
      chart.appendChild(svg(doc, "line", { x1: left, y1: yy, x2: width - right, y2: yy, stroke: "#cbd5e1", "stroke-width": 1 }));
      chart.appendChild(text(doc, left - 8, yy + 4, format(tick, 0) + " uA", { "text-anchor": "end", "font-size": 10 }));
    });
    [0, 0.6, 1.2, 1.8].forEach(function (tick) {
      var xx = x(tick);
      chart.appendChild(svg(doc, "line", { x1: xx, y1: top, x2: xx, y2: height - bottom, stroke: "#e2e8f0", "stroke-width": 1 }));
      chart.appendChild(text(doc, xx, height - 21, format(tick, 1) + " V", { "text-anchor": "middle", "font-size": 10 }));
    });
    chart.appendChild(svg(doc, "line", { x1: left, y1: height - bottom, x2: width - right, y2: height - bottom, stroke: "currentColor", "stroke-width": 1.2 }));
    chart.appendChild(svg(doc, "line", { x1: left, y1: top, x2: left, y2: height - bottom, stroke: "currentColor", "stroke-width": 1.2 }));
    [0.45, 0.8, 1.15].forEach(function (vgs, curveIndex) {
      var path = [];
      for (var index = 0; index <= 70; index += 1) {
        var vds = 1.8 * index / 70;
        var sample = calculate({ vgs: vgs, vds: vds, vth0: result.state.vth0, vsb: result.state.vsb, wOverL: result.state.wOverL });
        path.push((index ? "L" : "M") + x(vds).toFixed(2) + " " + y(sample.current * 1e6).toFixed(2));
      }
      chart.appendChild(svg(doc, "path", {
        d: path.join(" "),
        fill: "none",
        stroke: curveIndex === 1 ? "#2563a6" : curveIndex === 2 ? "#39734d" : "#b45a2c",
        "stroke-width": curveIndex === 1 ? 2.6 : 1.8,
        "stroke-dasharray": curveIndex === 0 ? "5 4" : "none"
      }));
      chart.appendChild(text(doc, width - right, y(calculate({ vgs: vgs, vds: 1.72, vth0: result.state.vth0, vsb: result.state.vsb, wOverL: result.state.wOverL }).current * 1e6) - 4, "VGS " + vgs.toFixed(2), { "text-anchor": "end", "font-size": 10 }));
    });
    if (result.vdsSat !== null) {
      var satX = x(result.vdsSat);
      chart.appendChild(svg(doc, "line", { x1: satX, y1: top, x2: satX, y2: height - bottom, stroke: "#39734d", "stroke-width": 2, "stroke-dasharray": "4 3" }));
    }
    chart.appendChild(svg(doc, "circle", { cx: x(result.state.vds), cy: y(result.current * 1e6), r: 5, fill: "#2563a6", stroke: "white", "stroke-width": 1.5 }));
    chart.appendChild(text(doc, left + plotWidth / 2, height - 3, "VDS", { "text-anchor": "middle" }));
    chart.appendChild(text(doc, 14, top + plotHeight / 2, "ID (uA)", { "text-anchor": "middle", "font-size": 11, transform: "rotate(-90 14 " + (top + plotHeight / 2) + ")" }));
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
    node.appendChild(create(doc, "h3", { text: "MOSFET 工作区实验：先判区域，再读 ID-VDS" }));
    node.appendChild(create(doc, "p", { className: "mm-note", text: "默认工作点 VGS=0.80 V、VDS=0.80 V；先预测它处在哪个区域。" }));
    var predictionField = create(doc, "fieldset");
    predictionField.appendChild(create(doc, "legend", { text: "预测：默认工作点的工作区是" }));
    var predictionRow = create(doc, "div", { className: "mm-choices" });
    [["linear", "线性区"], ["saturation", "饱和区"], ["subthreshold", "亚阈值"]].forEach(function (item) {
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
    var controls = create(doc, "div", { className: "mm-controls" });
    function addRange(label, key, min, max, step, formatter) {
      var holder = create(doc, "div", { className: "mm-control" });
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
    var vgsControl = addRange("VGS", "vgs", 0, 1.8, 0.01, function (value) { return format(value, 2) + " V"; });
    var vdsControl = addRange("VDS", "vds", 0, 1.8, 0.01, function (value) { return format(value, 2) + " V"; });
    var vthControl = addRange("Vth0", "vth0", 0.2, 0.7, 0.01, function (value) { return format(value, 2) + " V"; });
    var vsbControl = addRange("VSB", "vsb", 0, 0.8, 0.01, function (value) { return format(value, 2) + " V"; });
    var ratioControl = addRange("W/L", "wOverL", 0.5, 8, 0.1, function (value) { return format(value, 1); });
    node.appendChild(controls);
    var actions = create(doc, "div", { className: "mm-actions" });
    var check = create(doc, "button", { type: "button", className: "mm-primary", text: "核对预测并显示曲线" });
    var reset = create(doc, "button", { type: "button", text: "恢复默认" });
    actions.appendChild(check);
    actions.appendChild(reset);
    node.appendChild(actions);
    var feedback = create(doc, "p", { className: "mm-feedback", "aria-live": "polite" });
    node.appendChild(feedback);
    var resultRoot = create(doc, "div", { hidden: true });
    node.appendChild(resultRoot);

    check.addEventListener("click", function () {
      revealed = true;
      var result = calculate(state);
      var ok = prediction === result.region;
      feedback.className = "mm-feedback " + (ok ? "mm-good" : "mm-warn");
      feedback.textContent = ok ? "预测正确：区域由 VGS-Vth 与 VDS 的相对大小共同决定。" : "先重新比较 VGS-Vth 与 VDS；低于 Vth 时还要保留亚阈值尾巴。";
      if (api && typeof api.announce === "function") api.announce(node, feedback.textContent);
      renderResult(result);
    });
    reset.addEventListener("click", function () {
      state = Object.assign({}, DEFAULTS);
      prediction = null;
      revealed = false;
      predictionButtons.forEach(function (button) { button.setAttribute("aria-pressed", "false"); });
      [vgsControl, vdsControl, vthControl, vsbControl, ratioControl].forEach(function (control, index) {
        var key = ["vgs", "vds", "vth0", "vsb", "wOverL"][index];
        control.input.value = state[key];
      });
      feedback.textContent = "";
      render();
    });

    function renderResult(result) {
      clear(resultRoot);
      resultRoot.appendChild(create(doc, "div", { className: "mm-layout" }, [
        create(doc, "div", { className: "mm-stage" }, [drawChart(doc, result)]),
        create(doc, "div", { className: "mm-metrics" }, [
          metric(doc, "区域", result.region === "linear" ? "线性" : result.region === "saturation" ? "饱和" : "亚阈值"),
          metric(doc, "ID", format(result.current * 1e6, 3) + " uA"),
          metric(doc, "有效 Vth", format(result.threshold, 3) + " V"),
          metric(doc, "Vov", format(result.overdrive, 3) + " V"),
          metric(doc, "VDS,sat", result.vdsSat === null ? "—" : format(result.vdsSat, 3) + " V"),
          metric(doc, "gm", format(result.gm * 1e6, 3) + " uS"),
          metric(doc, "SS", format(result.subthresholdSwing * 1000, 2) + " mV/dec"),
          metric(doc, "K", format(result.k * 1e6, 1) + " uA/V^2")
        ])
      ]));
      var note = result.region === "saturation"
        ? "当前 VDS >= Vov，理想长沟道模型把 ID 近似固定为 0.5 K Vov^2；真实器件会受沟道长度调制与短沟道速度饱和影响。"
        : result.region === "linear"
          ? "当前沟道尚未夹断：ID = K(Vov VDS - VDS^2/2)，像一个由栅压控制的非线性电阻。"
          : "当前由扩散主导：ID 仍按 exp((VGS-Vth)/(nVT)) 变化，不能把“关断”写成严格零电流。";
      resultRoot.appendChild(create(doc, "p", { className: "mm-note", text: note }));
      resultRoot.hidden = !revealed;
    }

    function render() {
      [vgsControl, vdsControl, vthControl, vsbControl, ratioControl].forEach(function (control, index) {
        var key = ["vgs", "vds", "vth0", "vsb", "wOverL"][index];
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
    var linear = calculate({ vgs: 0.8, vds: 0.2, vth0: 0.4, vsb: 0, wOverL: 2 });
    var saturation = calculate({ vgs: 0.8, vds: 0.8, vth0: 0.4, vsb: 0, wOverL: 2 });
    var subthreshold = calculate({ vgs: 0.35, vds: 0.8, vth0: 0.4, vsb: 0, wOverL: 2 });
    assert(linear.region === "linear" && saturation.region === "saturation", "region boundary");
    assert(subthreshold.region === "subthreshold" && subthreshold.current > 0, "subthreshold tail");
    assert(near(linear.current * 1e6, 12, 1e-9), "linear current");
    assert(near(linear.gm * 1e6, 40, 1e-9), "linear transconductance");
    assert(near(saturation.current * 1e6, 16, 1e-9), "saturation current");
    assert(near(saturation.gm * saturation.overdrive, 2 * saturation.current, 1e-9), "gm identity");
    assert(calculate({ vgs: 0.8, vds: 0.8, vth0: 0.4, vsb: 0.4, wOverL: 2 }).threshold > saturation.threshold, "body effect raises threshold");
    assert(calculate({ vgs: 0.8, vds: 1.2, vth0: 0.4, vsb: 0, wOverL: 2 }).current === saturation.current, "ideal saturation independent of VDS");
    return { checks: checks };
  }

  return { mount: mount, calculate: calculate, selfTest: selfTest };
});
