(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("micro-timing", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("micro-timing self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("micro-timing self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function () {
  "use strict";

  var LAB_ID = "micro-timing";
  var STYLE_ID = "micro-timing-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var CORNERS = {
    nominal: { label: "名义角", max: 1, min: 1, cq: 1 },
    slow: { label: "慢角（setup）", max: 1.25, min: 1.1, cq: 1.15 },
    fast: { label: "快角（hold）", max: 0.85, min: 0.65, cq: 0.9 }
  };
  var DEFAULTS = {
    period: 1,
    cq: 0.10,
    logicMax: 0.75,
    logicMin: 0.04,
    setup: 0.10,
    hold: 0.08,
    skew: 0.02,
    jitter: 0.03,
    viewCorner: "nominal"
  };

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
    return value.toFixed(digits === undefined ? 2 : digits).replace(/0+$/, "").replace(/\.$/, "");
  }

  function normalize(input) {
    var source = input || {};
    return {
      period: clamp(finite(source.period === undefined ? DEFAULTS.period : source.period, "period"), 0.5, 2),
      cq: clamp(finite(source.cq === undefined ? DEFAULTS.cq : source.cq, "clock-to-Q"), 0.05, 0.25),
      logicMax: clamp(finite(source.logicMax === undefined ? DEFAULTS.logicMax : source.logicMax, "maximum logic delay"), 0.2, 1.4),
      logicMin: clamp(finite(source.logicMin === undefined ? DEFAULTS.logicMin : source.logicMin, "minimum logic delay"), 0, 0.2),
      setup: clamp(finite(source.setup === undefined ? DEFAULTS.setup : source.setup, "setup time"), 0.05, 0.25),
      hold: clamp(finite(source.hold === undefined ? DEFAULTS.hold : source.hold, "hold time"), 0.04, 0.2),
      skew: clamp(finite(source.skew === undefined ? DEFAULTS.skew : source.skew, "clock skew"), -0.1, 0.1),
      jitter: clamp(finite(source.jitter === undefined ? DEFAULTS.jitter : source.jitter, "jitter"), 0, 0.1),
      viewCorner: CORNERS[source.viewCorner] ? source.viewCorner : DEFAULTS.viewCorner
    };
  }

  function calculate(input) {
    var state = normalize(input);
    var corners = {};
    Object.keys(CORNERS).forEach(function (name) {
      var corner = CORNERS[name];
      var cq = state.cq * corner.cq;
      var logicMax = state.logicMax * corner.max;
      var logicMin = state.logicMin * corner.min;
      corners[name] = {
        name: name,
        label: corner.label,
        cq: cq,
        logicMax: logicMax,
        logicMin: logicMin,
        setupSlack: state.period + state.skew - state.jitter - cq - logicMax - state.setup,
        holdSlack: cq + logicMin - state.hold - state.skew - state.jitter
      };
    });
    var requiredPeriod = state.cq * CORNERS.slow.cq + state.logicMax * CORNERS.slow.max + state.setup + state.jitter - state.skew;
    return {
      state: state,
      corners: corners,
      selected: corners[state.viewCorner],
      requiredPeriod: requiredPeriod,
      maxFrequencyGHz: requiredPeriod > 0 ? 1 / requiredPeriod : Infinity,
      worstSetup: Math.min.apply(null, Object.keys(corners).map(function (name) { return corners[name].setupSlack; })),
      worstHold: Math.min.apply(null, Object.keys(corners).map(function (name) { return corners[name].holdSlack; }))
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
      '[data-learning-lab="' + LAB_ID + '"]{--mt-blue:#2563a6;--mt-orange:#b45a2c;--mt-green:#39734d;--mt-red:#b23a32;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}' +
      '[data-learning-lab="' + LAB_ID + '"] h3{margin:0;font-size:1.15rem;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] .mt-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{font:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] button:hover{border-color:var(--mt-blue)}[data-learning-lab="' + LAB_ID + '"] button[aria-pressed="true"],[data-learning-lab="' + LAB_ID + '"] .mt-primary{border-color:var(--mt-blue);background:var(--mt-blue);color:#fff;font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible{outline:3px solid #1769aa;outline-offset:2px}' +
      '[data-learning-lab="' + LAB_ID + '"] .mt-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;align-items:end;margin:12px 0}[data-learning-lab="' + LAB_ID + '"] .mt-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .mt-control label{font-size:12px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] output{color:var(--mt-blue);font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + LAB_ID + '"] input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--mt-blue)}[data-learning-lab="' + LAB_ID + '"] .mt-actions{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}[data-learning-lab="' + LAB_ID + '"] .mt-actions>*{flex:1 1 180px}' +
      '[data-learning-lab="' + LAB_ID + '"] .mt-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mt-good{color:var(--mt-green)}[data-learning-lab="' + LAB_ID + '"] .mt-warn{color:var(--mt-red)}' +
      '[data-learning-lab="' + LAB_ID + '"] .mt-layout{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(260px,.9fr);gap:15px;align-items:start}[data-learning-lab="' + LAB_ID + '"] .mt-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:6px;overflow:hidden}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%}[data-learning-lab="' + LAB_ID + '"] svg text{font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] table{width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:6px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}' +
      '[data-learning-lab="' + LAB_ID + '"] .mt-pass{color:var(--mt-green);font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mt-fail{color:var(--mt-red);font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mt-note{margin-top:11px;padding:9px 11px;border-left:3px solid var(--mt-green);color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}' +
      '@media(max-width:900px){[data-learning-lab="' + LAB_ID + '"] .mt-layout{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .mt-controls{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:620px){[data-learning-lab="' + LAB_ID + '"] .mt-controls{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:440px){[data-learning-lab="' + LAB_ID + '"] .mt-controls{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .mt-choices{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }

  function metric(doc, label, value, className) {
    return create(doc, "div", { className: className || "mt-metric" }, [
      create(doc, "span", { text: label }),
      create(doc, "strong", { text: value })
    ]);
  }

  function drawTimeline(doc, result) {
    var width = 620;
    var height = 280;
    var left = 54;
    var right = 18;
    var top = 30;
    var bottom = 42;
    var selected = result.selected;
    var horizon = Math.max(result.state.period + 0.35, selected.cq + selected.logicMax + 0.3);
    var scale = (width - left - right) / horizon;
    var launchX = left;
    var captureX = launchX + result.state.period * scale;
    var arrivalX = launchX + (selected.cq + selected.logicMax) * scale;
    var setupX = captureX - result.state.setup * scale;
    var holdX = captureX + (selected.hold + result.state.jitter) * scale;
    var chart = svg(doc, "svg", { viewBox: "0 0 " + width + " " + height, role: "img", "aria-label": selected.label + " 下 setup 和 hold 时间线" });
    chart.appendChild(text(doc, left, 18, selected.label + "：数据到达与捕获窗口", { "font-weight": "700" }));
    chart.appendChild(svg(doc, "line", { x1: left, y1: 125, x2: width - right, y2: 125, stroke: "#cbd5e1", "stroke-width": 2 }));
    chart.appendChild(svg(doc, "line", { x1: launchX, y1: 58, x2: launchX, y2: 205, stroke: "#39734d", "stroke-width": 3 }));
    chart.appendChild(svg(doc, "line", { x1: captureX, y1: 42, x2: captureX, y2: 215, stroke: "#2563a6", "stroke-width": 3 }));
    chart.appendChild(svg(doc, "line", { x1: arrivalX, y1: 92, x2: arrivalX, y2: 170, stroke: "#b45a2c", "stroke-width": 4 }));
    chart.appendChild(svg(doc, "rect", { x: setupX, y: 74, width: Math.max(2, result.state.setup * scale), height: 22, fill: "#b23a32", opacity: 0.24 }));
    chart.appendChild(svg(doc, "rect", { x: captureX, y: 155, width: Math.max(2, (selected.hold + result.state.jitter) * scale), height: 22, fill: "#b23a32", opacity: 0.24 }));
    chart.appendChild(text(doc, launchX, 232, "launch", { "text-anchor": "middle", "font-size": 10 }));
    chart.appendChild(text(doc, captureX, 232, "capture", { "text-anchor": "middle", "font-size": 10 }));
    chart.appendChild(text(doc, arrivalX, 66, "data", { "text-anchor": "middle", fill: "#b45a2c", "font-size": 10 }));
    chart.appendChild(text(doc, (setupX + captureX) / 2, 68, "setup window", { "text-anchor": "middle", fill: "#b23a32", "font-size": 10 }));
    chart.appendChild(text(doc, captureX + (holdX - captureX) / 2, 194, "hold window", { "text-anchor": "middle", fill: "#b23a32", "font-size": 10 }));
    chart.appendChild(text(doc, left + (width - left - right) / 2, height - 20, "时间相对 launch（ns）", { "text-anchor": "middle" }));
    [0, result.state.period / 2, result.state.period].forEach(function (tick) {
      var xx = launchX + tick * scale;
      chart.appendChild(svg(doc, "line", { x1: xx, y1: 215, x2: xx, y2: 222, stroke: "currentColor", "stroke-width": 1 }));
      chart.appendChild(text(doc, xx, 248, format(tick, 2), { "text-anchor": "middle", "font-size": 10 }));
    });
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
    node.appendChild(create(doc, "h3", { text: "STA 实验：把 setup 与 hold 放到同一条时间线上" }));
    node.appendChild(create(doc, "p", { className: "mt-note", text: "默认慢角更可能限制 setup、快角更可能限制 hold；先选择 setup 的危险角。" }));
    var predictionField = create(doc, "fieldset");
    predictionField.appendChild(create(doc, "legend", { text: "预测：最大逻辑延迟放大的角最容易出现 setup 违例" }));
    var predictionRow = create(doc, "div", { className: "mt-choices" });
    [["slow", "慢角"], ["fast", "快角"], ["nominal", "名义角"]].forEach(function (item) {
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
    var cornerField = create(doc, "fieldset");
    cornerField.appendChild(create(doc, "legend", { text: "查看时间线的角" }));
    var cornerRow = create(doc, "div", { className: "mt-choices" });
    [["nominal", "名义角"], ["slow", "慢角"], ["fast", "快角"]].forEach(function (item) {
      var button = create(doc, "button", { type: "button", text: item[1], "aria-pressed": item[0] === state.viewCorner ? "true" : "false" });
      button.addEventListener("click", function () {
        state.viewCorner = item[0];
        cornerRow.querySelectorAll("button").forEach(function (other) { other.setAttribute("aria-pressed", other === button ? "true" : "false"); });
        revealed = false;
        render();
      });
      cornerRow.appendChild(button);
    });
    cornerField.appendChild(cornerRow);
    node.appendChild(cornerField);
    var controls = create(doc, "div", { className: "mt-controls" });
    function addRange(label, key, min, max, step, formatter) {
      var holder = create(doc, "div", { className: "mt-control" });
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
    var periodControl = addRange("周期 T", "period", 0.5, 2, 0.01, function (value) { return format(value, 2) + " ns"; });
    var maxControl = addRange("最大逻辑延迟", "logicMax", 0.2, 1.4, 0.01, function (value) { return format(value, 2) + " ns"; });
    var minControl = addRange("最小逻辑延迟", "logicMin", 0, 0.2, 0.01, function (value) { return format(value, 2) + " ns"; });
    var skewControl = addRange("时钟偏斜", "skew", -0.1, 0.1, 0.01, function (value) { return format(value, 2) + " ns"; });
    var jitterControl = addRange("抖动预算", "jitter", 0, 0.1, 0.01, function (value) { return format(value, 2) + " ns"; });
    node.appendChild(controls);
    var actions = create(doc, "div", { className: "mt-actions" });
    var check = create(doc, "button", { type: "button", className: "mt-primary", text: "核对预测并显示 STA" });
    var reset = create(doc, "button", { type: "button", text: "恢复默认" });
    actions.appendChild(check);
    actions.appendChild(reset);
    node.appendChild(actions);
    var feedback = create(doc, "p", { className: "mt-feedback", "aria-live": "polite" });
    node.appendChild(feedback);
    var resultRoot = create(doc, "div", { hidden: true });
    node.appendChild(resultRoot);

    check.addEventListener("click", function () {
      revealed = true;
      var result = calculate(state);
      var ok = prediction === "slow";
      feedback.className = "mt-feedback " + (ok ? "mt-good" : "mt-warn");
      feedback.textContent = ok ? "预测正确：慢角放大最大延迟，setup slack 最先被吃掉。" : "setup 看最大延迟，hold 看最小延迟；把两种工艺角分开看。";
      if (api && typeof api.announce === "function") api.announce(node, feedback.textContent);
      renderResult(result);
    });
    reset.addEventListener("click", function () {
      state = Object.assign({}, DEFAULTS);
      prediction = null;
      revealed = false;
      predictionButtons.forEach(function (button) { button.setAttribute("aria-pressed", "false"); });
      cornerRow.querySelectorAll("button").forEach(function (button, index) { button.setAttribute("aria-pressed", index === 0 ? "true" : "false"); });
      [periodControl, maxControl, minControl, skewControl, jitterControl].forEach(function (control, index) {
        control.input.value = state[["period", "logicMax", "logicMin", "skew", "jitter"][index]];
      });
      feedback.textContent = "";
      render();
    });

    function renderResult(result) {
      clear(resultRoot);
      var metrics = create(doc, "div", { className: "mt-metrics" }, [
        metric(doc, "查看角", result.selected.label, "mt-metric"),
        metric(doc, "setup slack", format(result.selected.setupSlack, 3) + " ns", result.selected.setupSlack >= 0 ? "mt-metric mt-pass" : "mt-metric mt-fail"),
        metric(doc, "hold slack", format(result.selected.holdSlack, 3) + " ns", result.selected.holdSlack >= 0 ? "mt-metric mt-pass" : "mt-metric mt-fail"),
        metric(doc, "Tmin（慢角）", format(result.requiredPeriod, 3) + " ns", "mt-metric"),
        metric(doc, "最高频率", format(result.maxFrequencyGHz, 3) + " GHz", "mt-metric"),
        metric(doc, "最坏 setup", format(result.worstSetup, 3) + " ns", result.worstSetup >= 0 ? "mt-metric mt-pass" : "mt-metric mt-fail"),
        metric(doc, "最坏 hold", format(result.worstHold, 3) + " ns", result.worstHold >= 0 ? "mt-metric mt-pass" : "mt-metric mt-fail")
      ]);
      var table = create(doc, "table");
      table.appendChild(create(doc, "thead", {}, [create(doc, "tr", {}, [
        create(doc, "th", { text: "PVT 角" }),
        create(doc, "th", { text: "setup slack" }),
        create(doc, "th", { text: "hold slack" }),
        create(doc, "th", { text: "结论" })
      ])]));
      var body = create(doc, "tbody");
      Object.keys(result.corners).forEach(function (name) {
        var corner = result.corners[name];
        var pass = corner.setupSlack >= 0 && corner.holdSlack >= 0;
        body.appendChild(create(doc, "tr", {}, [
          create(doc, "th", { text: corner.label }),
          create(doc, "td", { text: format(corner.setupSlack, 3) + " ns" }),
          create(doc, "td", { text: format(corner.holdSlack, 3) + " ns" }),
          create(doc, "td", { className: pass ? "mt-pass" : "mt-fail", text: pass ? "通过" : "违例" })
        ]));
      });
      table.appendChild(body);
      resultRoot.appendChild(create(doc, "div", { className: "mt-layout" }, [
        create(doc, "div", { className: "mt-stage" }, [drawTimeline(doc, result)]),
        create(doc, "div", {}, [metrics, table])
      ]));
      resultRoot.appendChild(create(doc, "p", { className: "mt-note", text: "setup 违例的优先修复是增加周期或减少最大延迟；hold 违例不含 T，通常插入延迟单元。当前查看角为 " + result.selected.label + "。" }));
      resultRoot.hidden = !revealed;
    }

    function render() {
      [periodControl, maxControl, minControl, skewControl, jitterControl].forEach(function (control, index) {
        var key = ["period", "logicMax", "logicMin", "skew", "jitter"][index];
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
    var slower = calculate({ period: 1.2, cq: 0.1, logicMax: 0.75, logicMin: 0.04, setup: 0.1, hold: 0.08, skew: 0.02, jitter: 0.03, viewCorner: "nominal" });
    var holdPath = calculate({ period: 1, cq: 0.1, logicMax: 0.75, logicMin: 0, setup: 0.1, hold: 0.08, skew: 0.02, jitter: 0.03, viewCorner: "fast" });
    assert(base.selected.name === "nominal", "nominal default corner");
    assert(base.corners.slow.setupSlack < base.corners.nominal.setupSlack, "slow corner setup risk");
    assert(base.corners.fast.holdSlack < base.corners.nominal.holdSlack, "fast corner hold risk");
    assert(slower.corners.nominal.setupSlack > base.corners.nominal.setupSlack, "period fixes setup");
    assert(near(slower.corners.nominal.holdSlack, base.corners.nominal.holdSlack, 1e-12), "period does not change hold");
    assert(holdPath.corners.fast.holdSlack < 0, "hold violation boundary");
    assert(near(base.requiredPeriod, 0.1 * 1.15 + 0.75 * 1.25 + 0.1 + 0.03 - 0.02, 1e-12), "required period");
    return { checks: checks };
  }

  return { mount: mount, calculate: calculate, selfTest: selfTest };
});
