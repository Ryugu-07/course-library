(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("micro-carrier-balance", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("micro-carrier-balance self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("micro-carrier-balance self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function () {
  "use strict";

  var LAB_ID = "micro-carrier-balance";
  var STYLE_ID = "micro-carrier-balance-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var Q = 1.602176634e-19;
  var K_B = 8.617333262e-5;
  var EG = 1.12;
  var NI_300 = 1e10;
  var EPS = 1e-12;
  var DEFAULTS = { type: "n", logN: 16, temperature: 300 };

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

  function formatSci(value, unit) {
    return format(value, 2) + (unit || "");
  }

  function normalize(input) {
    var source = input || {};
    return {
      type: source.type === "p" ? "p" : "n",
      logN: clamp(finite(source.logN === undefined ? DEFAULTS.logN : source.logN, "log doping"), 14, 19),
      temperature: clamp(finite(source.temperature === undefined ? DEFAULTS.temperature : source.temperature, "temperature"), 250, 400)
    };
  }

  function intrinsicCarrier(temperature) {
    var t = finite(temperature, "temperature");
    return NI_300 * Math.pow(t / 300, 1.5) * Math.exp(-EG / (2 * K_B) * (1 / t - 1 / 300));
  }

  function mobility(temperature) {
    var t = finite(temperature, "temperature");
    return {
      electron: 1400 * Math.pow(t / 300, -2.4),
      hole: 450 * Math.pow(t / 300, -2.2)
    };
  }

  function calculate(input) {
    var state = normalize(input);
    var dopant = Math.pow(10, state.logN);
    var ni = intrinsicCarrier(state.temperature);
    var majority = (dopant + Math.sqrt(dopant * dopant + 4 * ni * ni)) / 2;
    var n = state.type === "n" ? majority : ni * ni / majority;
    var p = state.type === "n" ? ni * ni / majority : majority;
    var mu = mobility(state.temperature);
    var thermalVoltage = K_B * state.temperature;
    var conductivity = Q * (n * mu.electron + p * mu.hole);
    var field = 100;
    return {
      state: state,
      dopant: dopant,
      ni: ni,
      n: n,
      p: p,
      majority: majority,
      minority: state.type === "n" ? p : n,
      muN: mu.electron,
      muP: mu.hole,
      thermalVoltage: thermalVoltage,
      dn: mu.electron * thermalVoltage,
      dp: mu.hole * thermalVoltage,
      conductivity: conductivity,
      currentDensity: conductivity * field,
      massAction: n * p / (ni * ni),
      field: field
    };
  }

  function create(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "text") node.textContent = String(value);
      else if (key.slice(0, 2) === "on" && typeof value === "function") {
        node.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (value === true) node.setAttribute(key, "");
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
    var options = Object.assign({ x: x, y: y, fill: "currentColor", "font-size": 11 }, attrs || {});
    return svg(doc, "text", options, [value]);
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function installStyles(doc) {
    if (!doc || !doc.createElement || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="' + LAB_ID + '"]{--mcb-blue:#2563a6;--mcb-orange:#b45a2c;--mcb-green:#39734d;--mcb-red:#b23a32;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}' +
      '[data-learning-lab="' + LAB_ID + '"] h3,[data-learning-lab="' + LAB_ID + '"] h4{margin:0;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] h3{font-size:1.15rem}[data-learning-lab="' + LAB_ID + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] .mcb-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{font:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] button:hover{border-color:var(--mcb-blue)}[data-learning-lab="' + LAB_ID + '"] button[aria-pressed="true"],[data-learning-lab="' + LAB_ID + '"] .mcb-primary{border-color:var(--mcb-blue);background:var(--mcb-blue);color:#fff;font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible{outline:3px solid #1769aa;outline-offset:2px}' +
      '[data-learning-lab="' + LAB_ID + '"] .mcb-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;align-items:end;margin:12px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] .mcb-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .mcb-control label{font-size:13px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] output{color:var(--mcb-blue);font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + LAB_ID + '"] input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--mcb-blue)}[data-learning-lab="' + LAB_ID + '"] .mcb-actions{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}[data-learning-lab="' + LAB_ID + '"] .mcb-actions>*{flex:1 1 180px}' +
      '[data-learning-lab="' + LAB_ID + '"] .mcb-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mcb-good{color:var(--mcb-green)}[data-learning-lab="' + LAB_ID + '"] .mcb-warn{color:var(--mcb-red)}' +
      '[data-learning-lab="' + LAB_ID + '"] .mcb-layout{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(230px,.8fr);gap:15px;align-items:start}[data-learning-lab="' + LAB_ID + '"] .mcb-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:6px;overflow:hidden}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%}[data-learning-lab="' + LAB_ID + '"] svg text{font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] .mcb-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}[data-learning-lab="' + LAB_ID + '"] .mcb-metric{min-width:0;padding:8px;border-top:3px solid var(--mcb-blue)}[data-learning-lab="' + LAB_ID + '"] .mcb-metric:nth-child(2n){border-color:var(--mcb-orange)}[data-learning-lab="' + LAB_ID + '"] .mcb-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mcb-metric strong{display:block;margin-top:3px;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + LAB_ID + '"] .mcb-note{margin-top:11px;padding:9px 11px;border-left:3px solid var(--mcb-green);color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}' +
      '@media(max-width:760px){[data-learning-lab="' + LAB_ID + '"] .mcb-layout{grid-template-columns:1fr}}@media(max-width:560px){[data-learning-lab="' + LAB_ID + '"] .mcb-controls{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .mcb-choices{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }

  function metric(doc, label, value) {
    return create(doc, "div", { className: "mcb-metric" }, [
      create(doc, "span", { text: label }),
      create(doc, "strong", { text: value })
    ]);
  }

  function drawChart(doc, result, selectedType) {
    var width = 620;
    var height = 300;
    var left = 58;
    var right = 18;
    var top = 20;
    var bottom = 42;
    var plotWidth = width - left - right;
    var plotHeight = height - top - bottom;
    var minLog = 0;
    var maxLog = 21;
    var chart = svg(doc, "svg", {
      viewBox: "0 0 " + width + " " + height,
      role: "img",
      "aria-label": "随掺杂浓度变化的电子与空穴浓度对数图"
    });
    function x(logN) { return left + (logN - 14) / 5 * plotWidth; }
    function y(logValue) { return top + (maxLog - logValue) / (maxLog - minLog) * plotHeight; }
    [0, 5, 10, 15, 20].forEach(function (tick) {
      var yy = y(tick);
      chart.appendChild(svg(doc, "line", { x1: left, y1: yy, x2: width - right, y2: yy, stroke: "#cbd5e1", "stroke-width": 1 }));
      chart.appendChild(text(doc, left - 8, yy + 4, "10^" + tick, { "text-anchor": "end", fill: "currentColor", "font-size": 10 }));
    });
    [14, 15, 16, 17, 18, 19].forEach(function (tick) {
      var xx = x(tick);
      chart.appendChild(svg(doc, "line", { x1: xx, y1: top, x2: xx, y2: height - bottom, stroke: "#e2e8f0", "stroke-width": 1 }));
      chart.appendChild(text(doc, xx, height - 20, "10^" + tick, { "text-anchor": "middle", "font-size": 10 }));
    });
    chart.appendChild(svg(doc, "line", { x1: left, y1: height - bottom, x2: width - right, y2: height - bottom, stroke: "currentColor", "stroke-width": 1.2 }));
    chart.appendChild(svg(doc, "line", { x1: left, y1: top, x2: left, y2: height - bottom, stroke: "currentColor", "stroke-width": 1.2 }));
    function pathFor(key) {
      var points = [];
      for (var index = 0; index <= 50; index += 1) {
        var logN = 14 + 5 * index / 50;
        var sample = calculate({ type: selectedType, logN: logN, temperature: result.state.temperature });
        points.push((index ? "L" : "M") + x(logN).toFixed(2) + " " + y(Math.log10(sample[key])).toFixed(2));
      }
      return points.join(" ");
    }
    chart.appendChild(svg(doc, "path", { d: pathFor("n"), fill: "none", stroke: "#2563a6", "stroke-width": 2.5 }));
    chart.appendChild(svg(doc, "path", { d: pathFor("p"), fill: "none", stroke: "#b45a2c", "stroke-width": 2.5, "stroke-dasharray": "6 4" }));
    var currentX = x(result.state.logN);
    chart.appendChild(svg(doc, "line", { x1: currentX, y1: top, x2: currentX, y2: height - bottom, stroke: "#39734d", "stroke-width": 2, "stroke-dasharray": "3 3" }));
    chart.appendChild(svg(doc, "circle", { cx: currentX, cy: y(Math.log10(result.n)), r: 5, fill: "#2563a6", stroke: "white", "stroke-width": 1.5 }));
    chart.appendChild(svg(doc, "circle", { cx: currentX, cy: y(Math.log10(result.p)), r: 5, fill: "#b45a2c", stroke: "white", "stroke-width": 1.5 }));
    chart.appendChild(text(doc, width - right, top + 2, "n", { "text-anchor": "end", fill: "#2563a6", "font-weight": "700" }));
    chart.appendChild(text(doc, width - right, top + 18, "p", { "text-anchor": "end", fill: "#b45a2c", "font-weight": "700" }));
    chart.appendChild(text(doc, left + plotWidth / 2, height - 3, "log10 掺杂浓度 (cm^-3)", { "text-anchor": "middle", "font-size": 11 }));
    chart.appendChild(text(doc, 14, top + plotHeight / 2, "载流子浓度", { "text-anchor": "middle", "font-size": 11, transform: "rotate(-90 14 " + (top + plotHeight / 2) + ")" }));
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
    var choices = [];
    node.appendChild(create(doc, "h3", { text: "载流子平衡实验：先预测少子，再看质量作用定律" }));
    node.appendChild(create(doc, "p", { className: "mcb-note", text: "默认问题：提高掺杂浓度时，少子浓度会怎样？先选答案，再打开数值账本。" }));

    var predictionField = create(doc, "fieldset");
    predictionField.appendChild(create(doc, "legend", { text: "预测：把 n 型掺杂从 10^15 提高到 10^17 cm^-3，少子浓度会" }));
    var choiceRow = create(doc, "div", { className: "mcb-choices" });
    [["fall", "下降"], ["flat", "近似不变"], ["rise", "上升"]].forEach(function (item) {
      var button = create(doc, "button", { type: "button", text: item[1], "aria-pressed": "false" });
      button.addEventListener("click", function () {
        choices.forEach(function (other) { other.setAttribute("aria-pressed", "false"); });
        button.setAttribute("aria-pressed", "true");
        prediction = item[0];
      });
      choices.push(button);
      choiceRow.appendChild(button);
    });
    predictionField.appendChild(choiceRow);
    node.appendChild(predictionField);

    var controls = create(doc, "div", { className: "mcb-controls" });
    var typeControl = create(doc, "div", { className: "mcb-control" });
    typeControl.appendChild(create(doc, "label", { text: "材料类型" }));
    var typeRow = create(doc, "div", { className: "mcb-choices" });
    [["n", "n 型（施主）"], ["p", "p 型（受主）"]].forEach(function (item) {
      var button = create(doc, "button", { type: "button", text: item[1], "aria-pressed": item[0] === state.type ? "true" : "false" });
      button.addEventListener("click", function () {
        state.type = item[0];
        typeRow.querySelectorAll("button").forEach(function (other) { other.setAttribute("aria-pressed", other === button ? "true" : "false"); });
        revealed = false;
        render();
      });
      typeRow.appendChild(button);
    });
    typeControl.appendChild(typeRow);
    controls.appendChild(typeControl);
    var dopingControl = create(doc, "div", { className: "mcb-control" });
    var dopingOutput = create(doc, "output", { text: "10^" + state.logN + " cm^-3" });
    dopingControl.appendChild(create(doc, "label", { text: "掺杂浓度 " }, [dopingOutput]));
    var doping = create(doc, "input", { type: "range", min: 14, max: 19, step: 0.1, value: state.logN, "aria-label": "掺杂浓度的十进制对数" });
    doping.addEventListener("input", function () {
      state.logN = Number(doping.value);
      revealed = false;
      render();
    });
    dopingControl.appendChild(doping);
    controls.appendChild(dopingControl);
    var temperatureControl = create(doc, "div", { className: "mcb-control" });
    var temperatureOutput = create(doc, "output", { text: state.temperature + " K" });
    temperatureControl.appendChild(create(doc, "label", { text: "温度 " }, [temperatureOutput]));
    var temperature = create(doc, "input", { type: "range", min: 250, max: 400, step: 1, value: state.temperature, "aria-label": "温度" });
    temperature.addEventListener("input", function () {
      state.temperature = Number(temperature.value);
      revealed = false;
      render();
    });
    temperatureControl.appendChild(temperature);
    controls.appendChild(temperatureControl);
    node.appendChild(controls);

    var actions = create(doc, "div", { className: "mcb-actions" });
    var check = create(doc, "button", { type: "button", className: "mcb-primary", text: "核对预测并显示账本" });
    var reset = create(doc, "button", { type: "button", text: "恢复默认" });
    actions.appendChild(check);
    actions.appendChild(reset);
    node.appendChild(actions);
    var feedback = create(doc, "p", { className: "mcb-feedback", "aria-live": "polite" });
    node.appendChild(feedback);
    var resultRoot = create(doc, "div", { hidden: true });
    node.appendChild(resultRoot);

    check.addEventListener("click", function () {
      revealed = true;
      var result = calculate(state);
      var ok = prediction === "fall";
      feedback.className = "mcb-feedback " + (ok ? "mcb-good" : "mcb-warn");
      feedback.textContent = ok ? "预测正确：在平衡近似下，少子由 ni^2/多数载流子决定。" : "再检查一次 np=ni^2：多数载流子增加时，少子必须下降。";
      if (api && typeof api.announce === "function") api.announce(node, feedback.textContent);
      renderResult(result);
    });
    reset.addEventListener("click", function () {
      state = Object.assign({}, DEFAULTS);
      prediction = null;
      revealed = false;
      choices.forEach(function (button) { button.setAttribute("aria-pressed", "false"); });
      typeRow.querySelectorAll("button").forEach(function (button, index) { button.setAttribute("aria-pressed", index === 0 ? "true" : "false"); });
      doping.value = state.logN;
      temperature.value = state.temperature;
      feedback.textContent = "";
      render();
    });

    function renderResult(result) {
      clear(resultRoot);
      resultRoot.appendChild(create(doc, "div", { className: "mcb-layout" }, [
        create(doc, "div", { className: "mcb-stage" }, [drawChart(doc, result, result.state.type)]),
        create(doc, "div", { className: "mcb-metrics" }, [
          metric(doc, "n 电子浓度", formatSci(result.n, " cm^-3")),
          metric(doc, "p 空穴浓度", formatSci(result.p, " cm^-3")),
          metric(doc, "ni", formatSci(result.ni, " cm^-3")),
          metric(doc, "np/ni^2", format(result.massAction, 5)),
          metric(doc, "电导率 sigma", formatSci(result.conductivity, " S/cm")),
          metric(doc, "J @ 100 V/cm", formatSci(result.currentDensity, " A/cm^2")),
          metric(doc, "V_T", format(result.thermalVoltage * 1000, 2) + " mV"),
          metric(doc, "Dn / Dp", format(result.dn, 2) + " / " + format(result.dp, 2) + " cm^2/s")
        ])
      ]));
      resultRoot.appendChild(create(doc, "p", { className: "mcb-note", text: "不变量检查：np/ni^2 = " + format(result.massAction, 5) + "；Dn/mu_n = Dp/mu_p = V_T。当前模型假设非简并、完全电离、热平衡和均匀材料。" }));
      resultRoot.hidden = !revealed;
    }

    function render() {
      var result = calculate(state);
      dopingOutput.textContent = "10^" + format(state.logN, 1) + " cm^-3";
      temperatureOutput.textContent = state.temperature + " K";
      resultRoot.hidden = !revealed;
      if (revealed) renderResult(result);
    }
    render();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }
    var nType = calculate({ type: "n", logN: 16, temperature: 300 });
    var pType = calculate({ type: "p", logN: 16, temperature: 300 });
    assert(near(nType.n * nType.p, nType.ni * nType.ni, 1e-10), "n-type mass action");
    assert(near(pType.n * pType.p, pType.ni * pType.ni, 1e-10), "p-type mass action");
    assert(nType.n > nType.p && pType.p > pType.n, "majority carrier ordering");
    assert(calculate({ type: "n", logN: 17, temperature: 300 }).minority < nType.minority, "minority decreases with doping");
    assert(near(nType.dn / nType.muN, nType.thermalVoltage, 1e-12), "electron Einstein relation");
    assert(near(nType.dp / nType.muP, nType.thermalVoltage, 1e-12), "hole Einstein relation");
    assert(calculate({ type: "n", logN: 17, temperature: 300 }).conductivity > nType.conductivity, "conductivity rises with n doping");
    assert(calculate({ type: "n", logN: 16, temperature: 350 }).ni > nType.ni, "intrinsic carrier temperature trend");
    return { checks: checks };
  }

  return { mount: mount, calculate: calculate, selfTest: selfTest };
});
