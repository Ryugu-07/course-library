(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("micro-scaling-budget", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("micro-scaling-budget self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("micro-scaling-budget self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function () {
  "use strict";

  var LAB_ID = "micro-scaling-budget";
  var STYLE_ID = "micro-scaling-budget-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var DEFAULTS = { scale: 0.7, voltageMode: "scaled", activity: 1, swingMv: 60 };

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
      scale: clamp(finite(source.scale === undefined ? DEFAULTS.scale : source.scale, "scale"), 0.5, 1),
      voltageMode: source.voltageMode === "fixed" ? "fixed" : "scaled",
      activity: clamp(finite(source.activity === undefined ? DEFAULTS.activity : source.activity, "activity"), 0.1, 1),
      swingMv: clamp(finite(source.swingMv === undefined ? DEFAULTS.swingMv : source.swingMv, "subthreshold swing"), 60, 100)
    };
  }

  function calculate(input) {
    var state = normalize(input);
    var scale = state.scale;
    var area = scale * scale;
    var density = 1 / area;
    var voltage = state.voltageMode === "scaled" ? scale : 1;
    var frequency = 1 / scale;
    var capacitance = scale;
    var gatePower = state.activity * capacitance * voltage * voltage * frequency;
    var powerDensity = gatePower * density;
    var activeFraction = Math.min(1, 1 / powerDensity);
    var vth = state.voltageMode === "scaled" ? 0.4 * scale : 0.4;
    var thresholdDrop = Math.max(0, 0.4 - vth);
    var leakageMultiplier = Math.pow(10, thresholdDrop / (state.swingMv / 1000));
    return {
      state: state,
      area: area,
      density: density,
      voltage: voltage,
      frequency: frequency,
      capacitance: capacitance,
      gatePower: gatePower,
      powerDensity: powerDensity,
      activeFraction: activeFraction,
      darkFraction: Math.max(0, 1 - activeFraction),
      vth: vth,
      leakageMultiplier: leakageMultiplier
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
      '[data-learning-lab="' + LAB_ID + '"]{--msb-blue:#2563a6;--msb-orange:#b45a2c;--msb-green:#39734d;--msb-red:#b23a32;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}' +
      '[data-learning-lab="' + LAB_ID + '"] h3{margin:0;font-size:1.15rem;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] .msb-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{font:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] button:hover{border-color:var(--msb-blue)}[data-learning-lab="' + LAB_ID + '"] button[aria-pressed="true"],[data-learning-lab="' + LAB_ID + '"] .msb-primary{border-color:var(--msb-blue);background:var(--msb-blue);color:#fff;font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible{outline:3px solid #1769aa;outline-offset:2px}' +
      '[data-learning-lab="' + LAB_ID + '"] .msb-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px;align-items:end;margin:12px 0}[data-learning-lab="' + LAB_ID + '"] .msb-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .msb-control label{font-size:13px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] output{color:var(--msb-blue);font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + LAB_ID + '"] input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--msb-blue)}[data-learning-lab="' + LAB_ID + '"] .msb-actions{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}[data-learning-lab="' + LAB_ID + '"] .msb-actions>*{flex:1 1 180px}' +
      '[data-learning-lab="' + LAB_ID + '"] .msb-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="' + LAB_ID + '"] .msb-good{color:var(--msb-green)}[data-learning-lab="' + LAB_ID + '"] .msb-warn{color:var(--msb-red)}' +
      '[data-learning-lab="' + LAB_ID + '"] .msb-layout{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(230px,.75fr);gap:15px;align-items:start}[data-learning-lab="' + LAB_ID + '"] .msb-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:6px;overflow:hidden}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%}[data-learning-lab="' + LAB_ID + '"] svg text{font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] .msb-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}[data-learning-lab="' + LAB_ID + '"] .msb-metric{min-width:0;padding:8px;border-top:3px solid var(--msb-blue)}[data-learning-lab="' + LAB_ID + '"] .msb-metric:nth-child(2n){border-color:var(--msb-orange)}[data-learning-lab="' + LAB_ID + '"] .msb-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .msb-metric strong{display:block;margin-top:3px;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + LAB_ID + '"] .msb-note{margin-top:11px;padding:9px 11px;border-left:3px solid var(--msb-green);color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}' +
      '@media(max-width:820px){[data-learning-lab="' + LAB_ID + '"] .msb-layout{grid-template-columns:1fr}}@media(max-width:620px){[data-learning-lab="' + LAB_ID + '"] .msb-controls{grid-template-columns:repeat(2,minmax(0,1fr)}}@media(max-width:560px){[data-learning-lab="' + LAB_ID + '"] .msb-controls{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .msb-choices{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }

  function metric(doc, label, value) {
    return create(doc, "div", { className: "msb-metric" }, [
      create(doc, "span", { text: label }),
      create(doc, "strong", { text: value })
    ]);
  }

  function drawChart(doc, result) {
    var width = 620;
    var height = 300;
    var left = 48;
    var right = 18;
    var top = 20;
    var bottom = 48;
    var plotWidth = width - left - right;
    var plotHeight = height - top - bottom;
    var items = [
      { label: "密度", value: result.density, color: "#2563a6" },
      { label: "频率", value: result.frequency, color: "#39734d" },
      { label: "功率密度", value: result.powerDensity, color: "#b45a2c" },
      { label: "漏电倍率", value: result.leakageMultiplier, color: "#b23a32" }
    ];
    var chart = svg(doc, "svg", { viewBox: "0 0 " + width + " " + height, role: "img", "aria-label": "缩放后的密度、频率、功率密度和漏电倍率对比图" });
    var maxLog = Math.max(1, Math.ceil(Math.log10(Math.max.apply(null, items.map(function (item) { return item.value; })))) + 1);
    function y(value) {
      return top + (maxLog - Math.log10(Math.max(0.1, value))) / maxLog * plotHeight;
    }
    [0.1, 1, 10, 100, 1000].forEach(function (tick) {
      if (Math.log10(tick) < -0.001 || Math.log10(tick) > maxLog) return;
      var yy = y(tick);
      chart.appendChild(svg(doc, "line", { x1: left, y1: yy, x2: width - right, y2: yy, stroke: "#cbd5e1", "stroke-width": 1 }));
      chart.appendChild(text(doc, left - 7, yy + 4, tick + "x", { "text-anchor": "end", "font-size": 10 }));
    });
    chart.appendChild(svg(doc, "line", { x1: left, y1: height - bottom, x2: width - right, y2: height - bottom, stroke: "currentColor", "stroke-width": 1.2 }));
    chart.appendChild(svg(doc, "line", { x1: left, y1: top, x2: left, y2: height - bottom, stroke: "currentColor", "stroke-width": 1.2 }));
    var band = plotWidth / items.length;
    items.forEach(function (item, index) {
      var barX = left + band * index + band * 0.2;
      var barWidth = band * 0.6;
      var barY = y(item.value);
      chart.appendChild(svg(doc, "rect", { x: barX, y: barY, width: barWidth, height: height - bottom - barY, fill: item.color, opacity: 0.86 }));
      chart.appendChild(text(doc, barX + barWidth / 2, height - 26, item.label, { "text-anchor": "middle", "font-size": 10 }));
      chart.appendChild(text(doc, barX + barWidth / 2, Math.max(top + 12, barY - 6), format(item.value, 2) + "x", { "text-anchor": "middle", "font-size": 10, "font-weight": "700" }));
    });
    chart.appendChild(text(doc, left + plotWidth / 2, height - 5, "相对未缩放基准（对数纵轴）", { "text-anchor": "middle", "font-size": 11 }));
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
    node.appendChild(create(doc, "h3", { text: "缩放账本：电压策略改变功率密度" }));
    node.appendChild(create(doc, "p", { className: "msb-note", text: "默认 s=0.70 且电压同步缩放；先预测动态功率密度会怎样。" }));
    var predictionField = create(doc, "fieldset");
    predictionField.appendChild(create(doc, "legend", { text: "预测：在 Dennard 假设下缩小到 0.70 倍，功率密度会" }));
    var predictionRow = create(doc, "div", { className: "msb-choices" });
    [["stable", "近似保持"], ["rise", "上升"], ["fall", "下降"]].forEach(function (item) {
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
    var modeField = create(doc, "fieldset");
    modeField.appendChild(create(doc, "legend", { text: "电压策略" }));
    var modeRow = create(doc, "div", { className: "msb-choices" });
    [["scaled", "电压随尺寸缩放"], ["fixed", "电压固定"]].forEach(function (item) {
      var button = create(doc, "button", { type: "button", text: item[1], "aria-pressed": item[0] === state.voltageMode ? "true" : "false" });
      button.addEventListener("click", function () {
        state.voltageMode = item[0];
        modeRow.querySelectorAll("button").forEach(function (other) { other.setAttribute("aria-pressed", other === button ? "true" : "false"); });
        revealed = false;
        render();
      });
      modeRow.appendChild(button);
    });
    modeField.appendChild(modeRow);
    node.appendChild(modeField);
    var controls = create(doc, "div", { className: "msb-controls" });
    function addRange(label, key, min, max, step, formatter) {
      var holder = create(doc, "div", { className: "msb-control" });
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
    var scaleControl = addRange("线性尺寸缩放 s", "scale", 0.5, 1, 0.01, function (value) { return format(value, 2); });
    var activityControl = addRange("活动因子 alpha", "activity", 0.1, 1, 0.05, function (value) { return format(value, 2); });
    var swingControl = addRange("亚阈值摆幅 SS", "swingMv", 60, 100, 1, function (value) { return value + " mV/dec"; });
    node.appendChild(controls);
    var actions = create(doc, "div", { className: "msb-actions" });
    var check = create(doc, "button", { type: "button", className: "msb-primary", text: "核对预测并显示账本" });
    var reset = create(doc, "button", { type: "button", text: "恢复默认" });
    actions.appendChild(check);
    actions.appendChild(reset);
    node.appendChild(actions);
    var feedback = create(doc, "p", { className: "msb-feedback", "aria-live": "polite" });
    node.appendChild(feedback);
    var resultRoot = create(doc, "div", { hidden: true });
    node.appendChild(resultRoot);

    check.addEventListener("click", function () {
      revealed = true;
      var result = calculate(state);
      var trend = Math.abs(result.powerDensity - 1) < 0.05 ? "stable" : result.powerDensity > 1 ? "rise" : "fall";
      var ok = prediction === trend;
      feedback.className = "msb-feedback " + (ok ? "msb-good" : "msb-warn");
      feedback.textContent = ok ? "预测正确：功率密度由单管功耗乘以面积密度决定。" : "重新核对 Pdensity = gate power / area：固定电压时单管的 V^2 节省消失了。";
      if (api && typeof api.announce === "function") api.announce(node, feedback.textContent);
      renderResult(result);
    });
    reset.addEventListener("click", function () {
      state = Object.assign({}, DEFAULTS);
      prediction = null;
      revealed = false;
      predictionButtons.forEach(function (button) { button.setAttribute("aria-pressed", "false"); });
      modeRow.querySelectorAll("button").forEach(function (button, index) { button.setAttribute("aria-pressed", index === 0 ? "true" : "false"); });
      [scaleControl, activityControl, swingControl].forEach(function (control, index) {
        control.input.value = state[["scale", "activity", "swingMv"][index]];
      });
      feedback.textContent = "";
      render();
    });

    function renderResult(result) {
      clear(resultRoot);
      resultRoot.appendChild(create(doc, "div", { className: "msb-layout" }, [
        create(doc, "div", { className: "msb-stage" }, [drawChart(doc, result)]),
        create(doc, "div", { className: "msb-metrics" }, [
          metric(doc, "面积", format(result.area, 3) + "x"),
          metric(doc, "密度", format(result.density, 3) + "x"),
          metric(doc, "电压", format(result.voltage, 3) + "x"),
          metric(doc, "频率", format(result.frequency, 3) + "x"),
          metric(doc, "单管动态功耗", format(result.gatePower, 3) + "x"),
          metric(doc, "功率密度", format(result.powerDensity, 3) + "x"),
          metric(doc, "可同时活动", format(result.activeFraction * 100, 1) + "%"),
          metric(doc, "漏电倍率 proxy", format(result.leakageMultiplier, 2) + "x")
        ])
      ]));
      resultRoot.appendChild(create(doc, "p", { className: "msb-note", text: "当前策略的相对功率密度为 " + format(result.powerDensity, 3) + "；若超过 1，热预算只允许最多 " + format(result.activeFraction * 100, 1) + "% 的缩放后单元同时活动。漏电倍率假设阈值随缩放下降，并非完整 SPICE 漏电模型。" }));
      resultRoot.hidden = !revealed;
    }

    function render() {
      [scaleControl, activityControl, swingControl].forEach(function (control, index) {
        var key = ["scale", "activity", "swingMv"][index];
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
    var scaled = calculate({ scale: 0.7, voltageMode: "scaled", activity: 1, swingMv: 60 });
    var fixed = calculate({ scale: 0.7, voltageMode: "fixed", activity: 1, swingMv: 60 });
    assert(near(scaled.powerDensity, 1, 1e-12), "Dennard power density invariant");
    assert(near(fixed.powerDensity, 1 / 0.49, 1e-12), "fixed-voltage power density");
    assert(near(scaled.density, 1 / 0.49, 1e-12), "density scaling");
    assert(near(scaled.frequency, 1 / 0.7, 1e-12), "frequency scaling");
    assert(fixed.activeFraction < 0.5, "dark-silicon budget");
    assert(scaled.leakageMultiplier > 100, "threshold leakage sensitivity");
    assert(calculate({ scale: 0.5, voltageMode: "scaled", activity: 1, swingMv: 60 }).leakageMultiplier > scaled.leakageMultiplier, "leakage worsens with scaling");
    return { checks: checks };
  }

  return { mount: mount, calculate: calculate, selfTest: selfTest };
});
