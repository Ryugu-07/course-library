(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("micro-inverter", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("micro-inverter self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("micro-inverter self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function () {
  "use strict";

  var LAB_ID = "micro-inverter";
  var STYLE_ID = "micro-inverter-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var DEFAULTS = { vin: 0.5, vdd: 1, strength: 2.5, loadF: 2 };

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
      vin: finite(source.vin === undefined ? DEFAULTS.vin : source.vin, "Vin"),
      vdd: clamp(finite(source.vdd === undefined ? DEFAULTS.vdd : source.vdd, "VDD"), 0.6, 1.2),
      strength: clamp(finite(source.strength === undefined ? DEFAULTS.strength : source.strength, "PMOS/NMOS strength"), 0.5, 4),
      loadF: clamp(finite(source.loadF === undefined ? DEFAULTS.loadF : source.loadF, "load capacitance"), 0.5, 8)
    };
  }

  function mosCurrent(k, gateOverdrive, drainVoltage, threshold) {
    var overdrive = gateOverdrive - threshold;
    var vds = clamp(drainVoltage, 0, 10);
    if (overdrive <= 0) return 0;
    if (vds < overdrive) return k * (overdrive * vds - vds * vds / 2);
    return 0.5 * k * overdrive * overdrive;
  }

  function switchingPoint(vdd, strength) {
    var threshold = 0.35;
    var kn = 100e-6;
    var kp = kn * strength;
    return clamp((Math.sqrt(kn) * threshold + Math.sqrt(kp) * (vdd - threshold)) / (Math.sqrt(kn) + Math.sqrt(kp)), 0, vdd);
  }

  function outputVoltage(vin, vdd, strength) {
    var v = clamp(vin, 0, vdd);
    var kn = 100e-6;
    var kp = kn * strength;
    if (v <= 0.35) return vdd;
    if (v >= vdd - 0.35) return 0;
    if (near(v, switchingPoint(vdd, strength), 1e-12)) return v;
    function balance(vout) {
      var n = mosCurrent(kn, v, vout, 0.35);
      var p = mosCurrent(kp, vdd - v, vdd - vout, 0.35);
      return n - p;
    }
    var low = 0;
    var high = vdd;
    for (var index = 0; index < 70; index += 1) {
      var middle = (low + high) / 2;
      if (balance(middle) > 0) high = middle;
      else low = middle;
    }
    return (low + high) / 2;
  }

  function findSwitchingPoint(vdd, strength) {
    return switchingPoint(vdd, strength);
  }

  function calculate(input) {
    var state = normalize(input);
    var vin = clamp(state.vin, 0, state.vdd);
    var vout = outputVoltage(vin, state.vdd, state.strength);
    var vm = findSwitchingPoint(state.vdd, state.strength);
    var samples = [];
    var vil = null;
    var vih = null;
    for (var index = 0; index <= 100; index += 1) {
      var sampleVin = state.vdd * index / 100;
      var sampleOut = outputVoltage(sampleVin, state.vdd, state.strength);
      samples.push({ vin: sampleVin, vout: sampleOut });
      if (index > 0) {
        var slope = (sampleOut - samples[index - 1].vout) / (sampleVin - samples[index - 1].vin);
        if (slope <= -1 && vil === null) vil = samples[index - 1].vin;
        if (slope <= -1) vih = sampleVin;
      }
    }
    if (vil === null) vil = 0.25 * state.vdd;
    if (vih === null) vih = 0.75 * state.vdd;
    var ionN = mosCurrent(100e-6, state.vdd, state.vdd, 0.35);
    var ionP = mosCurrent(100e-6 * state.strength, state.vdd, state.vdd, 0.35);
    var loadFarads = state.loadF * 1e-15;
    return {
      state: state,
      vin: vin,
      vout: vout,
      vm: vm,
      vil: vil,
      vih: vih,
      voh: state.vdd,
      vol: 0,
      nml: Math.max(0, vil),
      nmh: Math.max(0, state.vdd - vih),
      samples: samples,
      tFall: loadFarads * state.vdd / (2 * ionN),
      tRise: loadFarads * state.vdd / (2 * ionP),
      energy: loadFarads * state.vdd * state.vdd,
      ionN: ionN,
      ionP: ionP
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
      '[data-learning-lab="' + LAB_ID + '"]{--mi-blue:#2563a6;--mi-orange:#b45a2c;--mi-green:#39734d;--mi-red:#b23a32;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}' +
      '[data-learning-lab="' + LAB_ID + '"] h3{margin:0;font-size:1.15rem;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] .mi-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{font:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] button:hover{border-color:var(--mi-blue)}[data-learning-lab="' + LAB_ID + '"] button[aria-pressed="true"],[data-learning-lab="' + LAB_ID + '"] .mi-primary{border-color:var(--mi-blue);background:var(--mi-blue);color:#fff;font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible{outline:3px solid #1769aa;outline-offset:2px}' +
      '[data-learning-lab="' + LAB_ID + '"] .mi-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px;align-items:end;margin:12px 0}[data-learning-lab="' + LAB_ID + '"] .mi-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .mi-control label{font-size:13px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] output{color:var(--mi-blue);font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + LAB_ID + '"] input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--mi-blue)}[data-learning-lab="' + LAB_ID + '"] .mi-actions{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}[data-learning-lab="' + LAB_ID + '"] .mi-actions>*{flex:1 1 180px}' +
      '[data-learning-lab="' + LAB_ID + '"] .mi-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mi-good{color:var(--mi-green)}[data-learning-lab="' + LAB_ID + '"] .mi-warn{color:var(--mi-red)}' +
      '[data-learning-lab="' + LAB_ID + '"] .mi-layout{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(230px,.75fr);gap:15px;align-items:start}[data-learning-lab="' + LAB_ID + '"] .mi-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:6px;overflow:hidden}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%}[data-learning-lab="' + LAB_ID + '"] svg text{font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] .mi-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}[data-learning-lab="' + LAB_ID + '"] .mi-metric{min-width:0;padding:8px;border-top:3px solid var(--mi-blue)}[data-learning-lab="' + LAB_ID + '"] .mi-metric:nth-child(2n){border-color:var(--mi-orange)}[data-learning-lab="' + LAB_ID + '"] .mi-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mi-metric strong{display:block;margin-top:3px;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + LAB_ID + '"] .mi-note{margin-top:11px;padding:9px 11px;border-left:3px solid var(--mi-green);color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}' +
      '@media(max-width:760px){[data-learning-lab="' + LAB_ID + '"] .mi-layout{grid-template-columns:1fr}}@media(max-width:560px){[data-learning-lab="' + LAB_ID + '"] .mi-controls{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .mi-choices{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }

  function metric(doc, label, value) {
    return create(doc, "div", { className: "mi-metric" }, [
      create(doc, "span", { text: label }),
      create(doc, "strong", { text: value })
    ]);
  }

  function drawChart(doc, result) {
    var width = 620;
    var height = 300;
    var left = 54;
    var right = 18;
    var top = 20;
    var bottom = 44;
    var plotWidth = width - left - right;
    var plotHeight = height - top - bottom;
    var chart = svg(doc, "svg", { viewBox: "0 0 " + width + " " + height, role: "img", "aria-label": "CMOS 反相器电压传输特性曲线" });
    function x(value) { return left + value / result.state.vdd * plotWidth; }
    function y(value) { return top + (result.state.vdd - value) / result.state.vdd * plotHeight; }
    [0, result.state.vdd / 2, result.state.vdd].forEach(function (tick) {
      var yy = y(tick);
      chart.appendChild(svg(doc, "line", { x1: left, y1: yy, x2: width - right, y2: yy, stroke: "#cbd5e1", "stroke-width": 1 }));
      chart.appendChild(text(doc, left - 8, yy + 4, format(tick, 2) + " V", { "text-anchor": "end", "font-size": 10 }));
    });
    [0, result.state.vdd / 2, result.state.vdd].forEach(function (tick) {
      var xx = x(tick);
      chart.appendChild(svg(doc, "line", { x1: xx, y1: top, x2: xx, y2: height - bottom, stroke: "#e2e8f0", "stroke-width": 1 }));
      chart.appendChild(text(doc, xx, height - 21, format(tick, 2) + " V", { "text-anchor": "middle", "font-size": 10 }));
    });
    chart.appendChild(svg(doc, "line", { x1: left, y1: height - bottom, x2: width - right, y2: height - bottom, stroke: "currentColor", "stroke-width": 1.2 }));
    chart.appendChild(svg(doc, "line", { x1: left, y1: top, x2: left, y2: height - bottom, stroke: "currentColor", "stroke-width": 1.2 }));
    var path = result.samples.map(function (sample, index) {
      return (index ? "L" : "M") + x(sample.vin).toFixed(2) + " " + y(sample.vout).toFixed(2);
    }).join(" ");
    chart.appendChild(svg(doc, "path", { d: path, fill: "none", stroke: "#2563a6", "stroke-width": 2.8 }));
    chart.appendChild(svg(doc, "line", { x1: x(result.vm), y1: top, x2: x(result.vm), y2: height - bottom, stroke: "#b45a2c", "stroke-width": 2, "stroke-dasharray": "5 4" }));
    chart.appendChild(svg(doc, "circle", { cx: x(result.vin), cy: y(result.vout), r: 5, fill: "#39734d", stroke: "white", "stroke-width": 1.5 }));
    chart.appendChild(text(doc, x(result.vm), top + 13, "VM", { "text-anchor": "middle", fill: "#b45a2c", "font-weight": "700" }));
    chart.appendChild(text(doc, left + plotWidth / 2, height - 3, "Vin", { "text-anchor": "middle" }));
    chart.appendChild(text(doc, 13, top + plotHeight / 2, "Vout", { "text-anchor": "middle", transform: "rotate(-90 13 " + (top + plotHeight / 2) + ")" }));
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
    node.appendChild(create(doc, "h3", { text: "CMOS 反相器实验：从电流路径到 VTC" }));
    node.appendChild(create(doc, "p", { className: "mi-note", text: "默认 PMOS/NMOS 强度比为 2.5；先预测切换点 VM 会向哪一端移动。" }));
    var predictionField = create(doc, "fieldset");
    predictionField.appendChild(create(doc, "legend", { text: "预测：把 PMOS 做得更宽，VM 会向" }));
    var predictionRow = create(doc, "div", { className: "mi-choices" });
    [["up", "电源端上移"], ["same", "保持在中点"], ["down", "地端下移"]].forEach(function (item) {
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
    var controls = create(doc, "div", { className: "mi-controls" });
    function addRange(label, key, min, max, step, formatter) {
      var holder = create(doc, "div", { className: "mi-control" });
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
    var vinControl = addRange("输入 Vin", "vin", 0, 1.2, 0.01, function (value) { return format(value, 2) + " V"; });
    var vddControl = addRange("供电 VDD", "vdd", 0.6, 1.2, 0.01, function (value) { return format(value, 2) + " V"; });
    var strengthControl = addRange("PMOS/NMOS 强度比", "strength", 0.5, 4, 0.1, function (value) { return format(value, 1); });
    var loadControl = addRange("负载 CL", "loadF", 0.5, 8, 0.5, function (value) { return format(value, 1) + " fF"; });
    node.appendChild(controls);
    var actions = create(doc, "div", { className: "mi-actions" });
    var check = create(doc, "button", { type: "button", className: "mi-primary", text: "核对预测并显示 VTC" });
    var reset = create(doc, "button", { type: "button", text: "恢复默认" });
    actions.appendChild(check);
    actions.appendChild(reset);
    node.appendChild(actions);
    var feedback = create(doc, "p", { className: "mi-feedback", "aria-live": "polite" });
    node.appendChild(feedback);
    var resultRoot = create(doc, "div", { hidden: true });
    node.appendChild(resultRoot);

    check.addEventListener("click", function () {
      revealed = true;
      var result = calculate(state);
      var trend = state.strength > 1.05 ? "up" : state.strength < 0.95 ? "down" : "same";
      var ok = prediction === trend;
      feedback.className = "mi-feedback " + (ok ? "mi-good" : "mi-warn");
      feedback.textContent = ok ? "预测正确：更强的上拉网络需要更高的输入电压才能与下拉网络平衡。" : "在 VM 处令上下拉电流相等；增大 Kp 会把平衡点推向更高的输入电压。";
      if (api && typeof api.announce === "function") api.announce(node, feedback.textContent);
      renderResult(result);
    });
    reset.addEventListener("click", function () {
      state = Object.assign({}, DEFAULTS);
      prediction = null;
      revealed = false;
      predictionButtons.forEach(function (button) { button.setAttribute("aria-pressed", "false"); });
      [vinControl, vddControl, strengthControl, loadControl].forEach(function (control, index) {
        control.input.value = state[["vin", "vdd", "strength", "loadF"][index]];
      });
      feedback.textContent = "";
      render();
    });

    function renderResult(result) {
      clear(resultRoot);
      resultRoot.appendChild(create(doc, "div", { className: "mi-layout" }, [
        create(doc, "div", { className: "mi-stage" }, [drawChart(doc, result)]),
        create(doc, "div", { className: "mi-metrics" }, [
          metric(doc, "当前 Vout", format(result.vout, 3) + " V"),
          metric(doc, "切换点 VM", format(result.vm, 3) + " V"),
          metric(doc, "VIL / VIH", format(result.vil, 3) + " / " + format(result.vih, 3) + " V"),
          metric(doc, "NML / NMH", format(result.nml, 3) + " / " + format(result.nmh, 3) + " V"),
          metric(doc, "下降延迟", format(result.tFall * 1e12, 1) + " ps"),
          metric(doc, "上升延迟", format(result.tRise * 1e12, 1) + " ps"),
          metric(doc, "一次翻转能量", format(result.energy * 1e15, 2) + " fJ"),
          metric(doc, "上拉/下拉 Ion", format(result.ionP * 1e6, 1) + " / " + format(result.ionN * 1e6, 1) + " uA")
        ])
      ]));
      resultRoot.appendChild(create(doc, "p", { className: "mi-note", text: "VTC 由上下拉电流平衡决定；CL 只进入动态账本。当前 \(V_M\) = " + format(result.vm, 3) + " V，静态轨电平仍近似为 0 与 VDD。" }));
      resultRoot.hidden = !revealed;
    }

    function render() {
      [vinControl, vddControl, strengthControl, loadControl].forEach(function (control, index) {
        var key = ["vin", "vdd", "strength", "loadF"][index];
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
    var base = calculate({ vin: 0.5, vdd: 1, strength: 2.5, loadF: 2 });
    var atSwitch = calculate({ vin: base.vm, vdd: 1, strength: 2.5, loadF: 2 });
    var low = calculate({ vin: 0, vdd: 1, strength: 2.5, loadF: 2 });
    var high = calculate({ vin: 1, vdd: 1, strength: 2.5, loadF: 2 });
    var weakP = calculate({ vin: 0.5, vdd: 1, strength: 0.7, loadF: 2 });
    assert(near(low.vout, 1, 1e-12) && near(high.vout, 0, 1e-12), "rail restoration");
    assert(base.vm > 0.5 && weakP.vm < base.vm, "strength shifts switching point");
    assert(near(atSwitch.vout, atSwitch.vin, 1e-12), "switching-point invariant");
    assert(base.samples.every(function (sample, index) { return index === 0 || sample.vout <= base.samples[index - 1].vout + 1e-12; }), "VTC monotonic");
    assert(base.nml >= 0 && base.nmh >= 0, "noise margins nonnegative");
    assert(near(calculate({ vin: 0.5, vdd: 1, strength: 2.5, loadF: 4 }).tFall / base.tFall, 2, 1e-12), "delay scales with load");
    assert(near(base.energy / 1e-15, 2, 1e-12), "dynamic energy");
    return { checks: checks };
  }

  return { mount: mount, calculate: calculate, selfTest: selfTest };
});
