(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("micro-gate-control", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("micro-gate-control self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("micro-gate-control self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function () {
  "use strict";

  var LAB_ID = "micro-gate-control";
  var STYLE_ID = "micro-gate-control-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var ARCHITECTURES = {
    planar: { label: "平面", factor: 1, surfaces: "一面" },
    fin: { label: "FinFET", factor: 0.65, surfaces: "三面" },
    gaa: { label: "GAA 纳米片", factor: 0.45, surfaces: "四面" }
  };
  var DEFAULTS = { architecture: "planar", length: 20, tox: 2, tdep: 8 };

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
      architecture: ARCHITECTURES[source.architecture] ? source.architecture : DEFAULTS.architecture,
      length: clamp(finite(source.length === undefined ? DEFAULTS.length : source.length, "channel length"), 8, 40),
      tox: clamp(finite(source.tox === undefined ? DEFAULTS.tox : source.tox, "oxide thickness"), 1, 4),
      tdep: clamp(finite(source.tdep === undefined ? DEFAULTS.tdep : source.tdep, "body thickness"), 4, 20)
    };
  }

  function calculate(input) {
    var state = normalize(input);
    var geometry = ARCHITECTURES[state.architecture];
    var baseLength = Math.sqrt(3 * state.tox * state.tdep);
    var lambda = geometry.factor * baseLength;
    var ratio = state.length / lambda;
    var dibl = 120 / (1 + Math.pow(ratio / 2, 2));
    var ss = 60 + 35 / (1 + ratio / 3);
    var control = clamp(ratio / 7, 0, 1);
    return {
      state: state,
      geometry: geometry,
      baseLength: baseLength,
      lambda: lambda,
      ratio: ratio,
      dibl: dibl,
      ss: ss,
      control: control,
      status: ratio >= 6 ? "强栅控" : ratio >= 3 ? "可用但受短沟道影响" : "栅控不足"
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
      '[data-learning-lab="' + LAB_ID + '"]{--mgc-blue:#2563a6;--mgc-orange:#b45a2c;--mgc-green:#39734d;--mgc-red:#b23a32;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}' +
      '[data-learning-lab="' + LAB_ID + '"] h3{margin:0;font-size:1.15rem;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] .mgc-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{font:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] button:hover{border-color:var(--mgc-blue)}[data-learning-lab="' + LAB_ID + '"] button[aria-pressed="true"],[data-learning-lab="' + LAB_ID + '"] .mgc-primary{border-color:var(--mgc-blue);background:var(--mgc-blue);color:#fff;font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible{outline:3px solid #1769aa;outline-offset:2px}' +
      '[data-learning-lab="' + LAB_ID + '"] .mgc-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px;align-items:end;margin:12px 0}[data-learning-lab="' + LAB_ID + '"] .mgc-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .mgc-control label{font-size:13px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] output{color:var(--mgc-blue);font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + LAB_ID + '"] input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--mgc-blue)}[data-learning-lab="' + LAB_ID + '"] .mgc-actions{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}[data-learning-lab="' + LAB_ID + '"] .mgc-actions>*{flex:1 1 180px}' +
      '[data-learning-lab="' + LAB_ID + '"] .mgc-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mgc-good{color:var(--mgc-green)}[data-learning-lab="' + LAB_ID + '"] .mgc-warn{color:var(--mgc-red)}' +
      '[data-learning-lab="' + LAB_ID + '"] .mgc-layout{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(230px,.75fr);gap:15px;align-items:start}[data-learning-lab="' + LAB_ID + '"] .mgc-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:6px;overflow:hidden}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%}[data-learning-lab="' + LAB_ID + '"] svg text{font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] .mgc-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}[data-learning-lab="' + LAB_ID + '"] .mgc-metric{min-width:0;padding:8px;border-top:3px solid var(--mgc-blue)}[data-learning-lab="' + LAB_ID + '"] .mgc-metric:nth-child(2n){border-color:var(--mgc-orange)}[data-learning-lab="' + LAB_ID + '"] .mgc-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mgc-metric strong{display:block;margin-top:3px;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + LAB_ID + '"] .mgc-note{margin-top:11px;padding:9px 11px;border-left:3px solid var(--mgc-green);color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}' +
      '@media(max-width:820px){[data-learning-lab="' + LAB_ID + '"] .mgc-layout{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .mgc-controls{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){[data-learning-lab="' + LAB_ID + '"] .mgc-controls{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .mgc-choices{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }

  function metric(doc, label, value) {
    return create(doc, "div", { className: "mgc-metric" }, [
      create(doc, "span", { text: label }),
      create(doc, "strong", { text: value })
    ]);
  }

  function drawCrossSection(doc, result) {
    var width = 620;
    var height = 300;
    var chart = svg(doc, "svg", { viewBox: "0 0 " + width + " " + height, role: "img", "aria-label": result.geometry.label + " 栅控剖面示意图" });
    chart.appendChild(svg(doc, "rect", { x: 35, y: 35, width: 550, height: 225, rx: 4, fill: "none", stroke: "#cbd5e1", "stroke-width": 1 }));
    chart.appendChild(text(doc, 310, 25, "栅控几何：有效控制面 " + result.geometry.surfaces, { "text-anchor": "middle", "font-weight": "700" }));
    chart.appendChild(svg(doc, "rect", { x: 85, y: 220, width: 450, height: 28, fill: "#cbd5e1", opacity: 0.9 }));
    chart.appendChild(text(doc, 310, 242, "衬底 / 隔离区", { "text-anchor": "middle", "font-size": 10 }));
    if (result.state.architecture === "planar") {
      chart.appendChild(svg(doc, "rect", { x: 150, y: 125, width: 320, height: 26, fill: "#39734d", opacity: 0.85 }));
      chart.appendChild(svg(doc, "rect", { x: 135, y: 72, width: 350, height: 38, fill: "#2563a6", opacity: 0.9 }));
      chart.appendChild(svg(doc, "rect", { x: 165, y: 110, width: 290, height: 15, fill: "#b45a2c", opacity: 0.9 }));
      chart.appendChild(text(doc, 310, 95, "栅极", { "text-anchor": "middle", fill: "white", "font-weight": "700" }));
      chart.appendChild(text(doc, 310, 145, "沟道（栅从一面控制）", { "text-anchor": "middle", fill: "white", "font-size": 10 }));
    } else if (result.state.architecture === "fin") {
      chart.appendChild(svg(doc, "rect", { x: 270, y: 75, width: 80, height: 150, fill: "#39734d", opacity: 0.85 }));
      chart.appendChild(svg(doc, "rect", { x: 255, y: 60, width: 110, height: 180, fill: "none", stroke: "#2563a6", "stroke-width": 15, opacity: 0.92 }));
      chart.appendChild(text(doc, 310, 150, "鳍沟道", { "text-anchor": "middle", fill: "white", "font-size": 10, transform: "rotate(-90 310 150)" }));
      chart.appendChild(text(doc, 450, 90, "栅包三面", { "text-anchor": "middle", fill: "#2563a6", "font-weight": "700" }));
    } else {
      chart.appendChild(svg(doc, "rect", { x: 215, y: 128, width: 190, height: 42, fill: "#39734d", opacity: 0.9 }));
      chart.appendChild(svg(doc, "rect", { x: 195, y: 105, width: 230, height: 88, rx: 24, fill: "none", stroke: "#2563a6", "stroke-width": 16, opacity: 0.92 }));
      chart.appendChild(text(doc, 310, 154, "纳米片沟道", { "text-anchor": "middle", fill: "white", "font-size": 10 }));
      chart.appendChild(text(doc, 465, 150, "栅包四面", { "text-anchor": "middle", fill: "#2563a6", "font-weight": "700" }));
    }
    var scaleX = 80;
    var scaleY = 275;
    chart.appendChild(svg(doc, "line", { x1: scaleX, y1: scaleY, x2: scaleX + result.lambda * 5, y2: scaleY, stroke: "#b45a2c", "stroke-width": 4 }));
    chart.appendChild(text(doc, scaleX + result.lambda * 2.5, scaleY - 8, "lambda = " + format(result.lambda, 2) + " nm", { "text-anchor": "middle", fill: "#b45a2c", "font-size": 10 }));
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
    node.appendChild(create(doc, "h3", { text: "栅控实验：平面、FinFET 与 GAA 的同尺度比较" }));
    node.appendChild(create(doc, "p", { className: "mgc-note", text: "默认 L=20 nm、tox=2 nm、tdep=8 nm；先预测哪种结构的短沟道控制最好。" }));
    var predictionField = create(doc, "fieldset");
    predictionField.appendChild(create(doc, "legend", { text: "预测：在相同尺寸与材料参数下，L/lambda 最大的是" }));
    var predictionRow = create(doc, "div", { className: "mgc-choices" });
    [["planar", "平面"], ["fin", "FinFET"], ["gaa", "GAA 纳米片"]].forEach(function (item) {
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
    var architectureField = create(doc, "fieldset");
    architectureField.appendChild(create(doc, "legend", { text: "结构" }));
    var architectureRow = create(doc, "div", { className: "mgc-choices" });
    [["planar", "平面"], ["fin", "FinFET"], ["gaa", "GAA 纳米片"]].forEach(function (item) {
      var button = create(doc, "button", { type: "button", text: item[1], "aria-pressed": item[0] === state.architecture ? "true" : "false" });
      button.addEventListener("click", function () {
        state.architecture = item[0];
        architectureRow.querySelectorAll("button").forEach(function (other) { other.setAttribute("aria-pressed", other === button ? "true" : "false"); });
        revealed = false;
        render();
      });
      architectureRow.appendChild(button);
    });
    architectureField.appendChild(architectureRow);
    node.appendChild(architectureField);
    var controls = create(doc, "div", { className: "mgc-controls" });
    function addRange(label, key, min, max, step, formatter) {
      var holder = create(doc, "div", { className: "mgc-control" });
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
    var lengthControl = addRange("沟道长度 L", "length", 8, 40, 1, function (value) { return value + " nm"; });
    var toxControl = addRange("栅介质厚度 tox", "tox", 1, 4, 0.1, function (value) { return format(value, 1) + " nm"; });
    var tdepControl = addRange("沟道体厚度 tdep", "tdep", 4, 20, 1, function (value) { return value + " nm"; });
    node.appendChild(controls);
    var actions = create(doc, "div", { className: "mgc-actions" });
    var check = create(doc, "button", { type: "button", className: "mgc-primary", text: "核对预测并显示剖面" });
    var reset = create(doc, "button", { type: "button", text: "恢复默认" });
    actions.appendChild(check);
    actions.appendChild(reset);
    node.appendChild(actions);
    var feedback = create(doc, "p", { className: "mgc-feedback", "aria-live": "polite" });
    node.appendChild(feedback);
    var resultRoot = create(doc, "div", { hidden: true });
    node.appendChild(resultRoot);

    check.addEventListener("click", function () {
      revealed = true;
      var result = calculate(state);
      var ok = prediction === "gaa";
      feedback.className = "mgc-feedback " + (ok ? "mgc-good" : "mgc-warn");
      feedback.textContent = ok ? "预测正确：几何包裹减小 lambda，使同一 L 拥有更大的 L/lambda。" : "比较三种 ggeom：它乘在 lambda0 上，因而更小的 lambda 给出更强的控制。";
      if (api && typeof api.announce === "function") api.announce(node, feedback.textContent);
      renderResult(result);
    });
    reset.addEventListener("click", function () {
      state = Object.assign({}, DEFAULTS);
      prediction = null;
      revealed = false;
      predictionButtons.forEach(function (button) { button.setAttribute("aria-pressed", "false"); });
      architectureRow.querySelectorAll("button").forEach(function (button, index) { button.setAttribute("aria-pressed", index === 0 ? "true" : "false"); });
      [lengthControl, toxControl, tdepControl].forEach(function (control, index) {
        control.input.value = state[["length", "tox", "tdep"][index]];
      });
      feedback.textContent = "";
      render();
    });

    function renderResult(result) {
      clear(resultRoot);
      resultRoot.appendChild(create(doc, "div", { className: "mgc-layout" }, [
        create(doc, "div", { className: "mgc-stage" }, [drawCrossSection(doc, result)]),
        create(doc, "div", { className: "mgc-metrics" }, [
          metric(doc, "结构", result.geometry.label),
          metric(doc, "lambda", format(result.lambda, 2) + " nm"),
          metric(doc, "L/lambda", format(result.ratio, 2)),
          metric(doc, "DIBL proxy", format(result.dibl, 1) + " mV/V"),
          metric(doc, "SS proxy", format(result.ss, 1) + " mV/dec"),
          metric(doc, "栅控状态", result.status)
        ])
      ]));
      resultRoot.appendChild(create(doc, "p", { className: "mgc-note", text: "当前 proxy 只用于比较几何：L/lambda = " + format(result.ratio, 2) + "。真实 DIBL、SS 还受掺杂、界面态、源漏工程、温度和测量定义影响；结构革新买到的是更大的控制余量，不是零失效。" }));
      resultRoot.hidden = !revealed;
    }

    function render() {
      [lengthControl, toxControl, tdepControl].forEach(function (control, index) {
        var key = ["length", "tox", "tdep"][index];
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
    var planar = calculate({ architecture: "planar", length: 20, tox: 2, tdep: 8 });
    var fin = calculate({ architecture: "fin", length: 20, tox: 2, tdep: 8 });
    var gaa = calculate({ architecture: "gaa", length: 20, tox: 2, tdep: 8 });
    assert(planar.lambda > fin.lambda && fin.lambda > gaa.lambda, "geometry reduces lambda");
    assert(planar.ratio < fin.ratio && fin.ratio < gaa.ratio, "control ratio ordering");
    assert(planar.dibl > fin.dibl && fin.dibl > gaa.dibl, "DIBL proxy ordering");
    assert(calculate({ architecture: "gaa", length: 8, tox: 2, tdep: 8 }).dibl < calculate({ architecture: "planar", length: 8, tox: 2, tdep: 8 }).dibl, "short-channel geometry comparison");
    assert(calculate({ architecture: "planar", length: 40, tox: 2, tdep: 8 }).ss < planar.ss, "longer channel improves swing proxy");
    assert(near(planar.baseLength, Math.sqrt(48), 1e-12), "base characteristic length");
    return { checks: checks };
  }

  return { mount: mount, calculate: calculate, selfTest: selfTest };
});
