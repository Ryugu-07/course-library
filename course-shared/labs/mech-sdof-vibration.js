(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("mech-sdof-vibration", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("mech-sdof-vibration self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("mech-sdof-vibration self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var LAB_ID = "mech-sdof-vibration";
  var STYLE_ID = "cl-mech-sdof-vibration-styles";
  var INSTANCE = 0;
  var ROOT_TWO = Math.sqrt(2);
  var DEFAULTS = {
    m: 50,
    k: 200000,
    omega: 100,
    zeta: 0.08,
    F0: 1000
  };

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function near(a, b, tolerance) {
    var scale = Math.max(1, Math.abs(a), Math.abs(b));
    return Math.abs(a - b) <= (tolerance === undefined ? 1e-9 : tolerance) * scale;
  }

  function finiteNumber(value, name) {
    var number = Number(value);
    if (!isFinite(number)) throw new Error(name + " must be finite");
    return number;
  }

  function nonnegative(value, name) {
    var number = finiteNumber(value, name);
    if (number < 0) throw new Error(name + " must be nonnegative");
    return number;
  }

  function positive(value, name) {
    var number = finiteNumber(value, name);
    if (!(number > 0)) throw new Error(name + " must be positive");
    return number;
  }

  function configOf(config) {
    config = config || {};
    return {
      m: positive(config.m === undefined ? DEFAULTS.m : config.m, "m"),
      k: positive(config.k === undefined ? DEFAULTS.k : config.k, "k"),
      omega: positive(config.omega === undefined ? DEFAULTS.omega : config.omega, "omega"),
      zeta: nonnegative(config.zeta === undefined ? DEFAULTS.zeta : config.zeta, "zeta"),
      F0: positive(config.F0 === undefined ? DEFAULTS.F0 : config.F0, "F0")
    };
  }

  function amplification(r, zeta) {
    var ratio = finiteNumber(r, "r");
    var damping = nonnegative(zeta, "zeta");
    var denominator = Math.sqrt(Math.pow(1 - ratio * ratio, 2) + Math.pow(2 * damping * ratio, 2));
    return denominator === 0 ? Infinity : 1 / denominator;
  }

  function transmissibility(r, zeta) {
    var ratio = finiteNumber(r, "r");
    var damping = nonnegative(zeta, "zeta");
    var denominator = Math.sqrt(Math.pow(1 - ratio * ratio, 2) + Math.pow(2 * damping * ratio, 2));
    return denominator === 0 ? Infinity : Math.sqrt(1 + Math.pow(2 * damping * ratio, 2)) / denominator;
  }

  function response(config) {
    var c = configOf(config);
    var omegaN = Math.sqrt(c.k / c.m);
    var ratio = c.omega / omegaN;
    var D = amplification(ratio, c.zeta);
    var TR = transmissibility(ratio, c.zeta);
    return {
      config: c,
      omegaN: omegaN,
      frequencyN: omegaN / (2 * Math.PI),
      r: ratio,
      amplification: D,
      transmissibility: TR,
      staticAmplitude: c.F0 / c.k,
      amplitude: c.F0 / c.k * D,
      isolating: TR < 1,
      boundary: near(ratio, ROOT_TWO, 1e-8)
    };
  }

  function frequencySweep(config, count, maximumRatio) {
    var c = configOf(config);
    var points = [];
    var n = Math.max(4, Math.floor(count === undefined ? 96 : count));
    var upper = maximumRatio === undefined ? 3.2 : positive(maximumRatio, "maximumRatio");
    for (var index = 0; index <= n; index += 1) {
      var r = 0.05 + (upper - 0.05) * index / n;
      points.push({ r: r, amplification: amplification(r, c.zeta), transmissibility: transmissibility(r, c.zeta) });
    }
    return points;
  }

  function dampingLedger(r, values) {
    return (values || [0.02, 0.05, 0.08, 0.15, 0.25]).map(function (zeta) {
      return { zeta: zeta, amplification: amplification(r, zeta), transmissibility: transmissibility(r, zeta) };
    });
  }

  function formatNumber(value, digits) {
    if (!isFinite(value)) return "∞";
    var places = digits === undefined ? 3 : digits;
    if (places === 0) return value.toFixed(0);
    if (Math.abs(value) >= 10000 || (Math.abs(value) > 0 && Math.abs(value) < 0.001)) return value.toExponential(Math.min(places, 4));
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (attrs[key] === undefined || attrs[key] === null) return;
      if (key === "text") node.textContent = String(attrs[key]);
      else if (key === "className") node.setAttribute("class", attrs[key]);
      else if (key === "htmlFor") node.setAttribute("for", attrs[key]);
      else node.setAttribute(key, String(attrs[key]));
    });
    (children || []).forEach(function (child) {
      if (child !== null && child !== undefined) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function svgElement(doc, tag, attrs) {
    var node = doc.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (attrs[key] !== undefined && attrs[key] !== null) node.setAttribute(key, String(attrs[key]));
    });
    return node;
  }

  function svgLabel(doc, parent, text, x, y, className) {
    var node = svgElement(doc, "text", { x: x, y: y, "class": className || "msv-label" });
    node.textContent = text;
    parent.appendChild(node);
  }

  function curvePath(points, key, x0, x1, y0, y1, maxY) {
    return points.map(function (point, index) {
      var x = x0 + (x1 - x0) * (point.r - 0.05) / 3.15;
      var value = Math.min(maxY, Math.max(0, point[key]));
      var y = y1 - (y1 - y0) * value / maxY;
      return (index ? "L" : "M") + x.toFixed(2) + " " + y.toFixed(2);
    }).join(" ");
  }

  function drawSvg(doc, svg, result) {
    clear(svg);
    var points = frequencySweep(result.config, 96, 3.2);
    var width = 700;
    var height = 420;
    var left = 58;
    var right = 650;
    var top1 = 38;
    var bottom1 = 172;
    var top2 = 238;
    var bottom2 = 370;
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "单自由度系统的放大因子与传递率频响");
    [bottom1, bottom2].forEach(function (y) {
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: y, x2: right, y2: y, stroke: "currentColor", opacity: 0.65 }));
    });
    [top1, bottom2].forEach(function (y) {
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: y, x2: left, y2: y === top1 ? bottom1 : bottom2, stroke: "currentColor", opacity: 0.65 }));
    });
    for (var tick = 0; tick <= 3; tick += 1) {
      var x = left + (right - left) * tick / 3.15;
      svg.appendChild(svgElement(doc, "line", { x1: x, y1: top1, x2: x, y2: bottom2, stroke: "currentColor", opacity: 0.12, "stroke-dasharray": "3 5" }));
      svgLabel(doc, svg, String(tick), x - 4, 398, "msv-muted");
    }
    var boundaryX = left + (right - left) * ROOT_TWO / 3.15;
    svg.appendChild(svgElement(doc, "line", { x1: boundaryX, y1: top1, x2: boundaryX, y2: bottom2, stroke: "var(--msv-orange)", "stroke-width": 2, "stroke-dasharray": "6 5" }));
    svgLabel(doc, svg, "r=√2", boundaryX - 18, 224, "msv-orange");
    svg.appendChild(svgElement(doc, "path", { d: curvePath(points, "amplification", left, right, top1, bottom1, 10), fill: "none", stroke: "var(--msv-blue)", "stroke-width": 3 }));
    svg.appendChild(svgElement(doc, "path", { d: curvePath(points, "transmissibility", left, right, top2, bottom2, 3.2), fill: "none", stroke: "var(--msv-green)", "stroke-width": 3 }));
    svgLabel(doc, svg, "D(r) 放大因子（上限按 10 截断）", left + 12, top1 + 16, "msv-blue");
    svgLabel(doc, svg, "TR(r) 传递率", left + 12, top2 + 16, "msv-green");
    svgLabel(doc, svg, "频率比 r=ω/ωn", 530, 398, "msv-muted");
    svgLabel(doc, svg, "当前 r=" + formatNumber(result.r, 3), 500, 55, "msv-muted");
  }

  function renderTable(doc, hostNode, headings, rows) {
    clear(hostNode);
    var table = element(doc, "table", {});
    var head = element(doc, "tr", {});
    headings.forEach(function (heading) { head.appendChild(element(doc, "th", { scope: "col", text: heading })); });
    table.appendChild(element(doc, "thead", {}, [head]));
    var body = element(doc, "tbody", {});
    rows.forEach(function (row) {
      var tr = element(doc, "tr", {});
      row.forEach(function (value) { tr.appendChild(element(doc, "td", { text: value })); });
      body.appendChild(tr);
    });
    table.appendChild(body);
    hostNode.appendChild(table);
  }

  function metric(doc, label, value) {
    return element(doc, "div", { className: "msv-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]);
  }

  function injectStyles(doc) {
    if (!doc || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="' + LAB_ID + '"]{--msv-blue:#1d4ed8;--msv-green:#18734a;--msv-orange:#b45309;--msv-warn:#a33b2f;color:var(--fg,inherit);max-width:100%;min-width:0;line-height:1.55}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}' +
      '[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}' +
      '[data-learning-lab="' + LAB_ID + '"] .msv-note,[data-learning-lab="' + LAB_ID + '"] .msv-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.65}' +
      '[data-learning-lab="' + LAB_ID + '"] .msv-prediction{padding:12px 14px;border-left:4px solid var(--msv-orange);background:var(--block-bg,transparent)}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{border:1px solid var(--border,currentColor);border-radius:6px;margin:12px 0;padding:10px 12px}' +
      '[data-learning-lab="' + LAB_ID + '"] legend{padding:0 4px;font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] .msv-options{display:grid;gap:6px}' +
      '[data-learning-lab="' + LAB_ID + '"] .msv-options label{display:flex;gap:8px;align-items:flex-start;min-height:44px;padding:7px 0;cursor:pointer}' +
      '[data-learning-lab="' + LAB_ID + '"] .msv-options input{flex:0 0 auto;margin-top:5px;accent-color:var(--msv-blue)}' +
      '[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input,[data-learning-lab="' + LAB_ID + '"] select{min-height:44px;font:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] input[type=number]{width:100%;padding:7px 9px;border:1px solid var(--border,currentColor);border-radius:6px;background:var(--bg,Canvas);color:inherit}' +
      '[data-learning-lab="' + LAB_ID + '"] button{padding:8px 13px;border:1px solid var(--border,currentColor);border-radius:6px;background:var(--bg,Canvas);color:inherit;cursor:pointer}' +
      '[data-learning-lab="' + LAB_ID + '"] button:hover,[data-learning-lab="' + LAB_ID + '"] button:focus-visible{border-color:var(--msv-blue)}' +
      '[data-learning-lab="' + LAB_ID + '"] .msv-primary{background:var(--msv-blue);border-color:var(--msv-blue);color:#fff}' +
      '[data-learning-lab="' + LAB_ID + '"] .msv-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] .msv-controls{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin:16px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] .msv-control{display:grid;gap:5px;min-width:0}' +
      '[data-learning-lab="' + LAB_ID + '"] .msv-control label{font-weight:700;font-size:13px}' +
      '[data-learning-lab="' + LAB_ID + '"] .msv-control small{color:var(--fg-soft,currentColor);font-size:11px}' +
      '[data-learning-lab="' + LAB_ID + '"] .msv-error{min-height:1.6em;color:var(--msv-warn);font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] .msv-grid{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(250px,.7fr);gap:16px;align-items:start}' +
      '[data-learning-lab="' + LAB_ID + '"] .msv-chart{min-width:0;border:1px solid var(--border,currentColor);border-radius:6px;padding:7px;background:var(--bg,Canvas)}' +
      '[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;aspect-ratio:700/420;color:var(--fg,inherit)}' +
      '[data-learning-lab="' + LAB_ID + '"] svg text{font-family:inherit;letter-spacing:0;fill:currentColor;font-size:12px}' +
      '[data-learning-lab="' + LAB_ID + '"] svg .msv-blue{fill:var(--msv-blue);font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] svg .msv-green{fill:var(--msv-green);font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] svg .msv-orange{fill:var(--msv-orange);font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] svg .msv-muted{fill:var(--fg-soft,currentColor);font-size:11px}' +
      '[data-learning-lab="' + LAB_ID + '"] .msv-metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:12px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] .msv-metric{min-width:0;padding:9px;border-top:3px solid var(--msv-blue);background:var(--bg,Canvas)}' +
      '[data-learning-lab="' + LAB_ID + '"] .msv-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}' +
      '[data-learning-lab="' + LAB_ID + '"] .msv-metric strong{display:block;margin-top:3px;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + LAB_ID + '"] .msv-table-wrap{max-width:100%;overflow-x:auto}' +
      '[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:430px;border-collapse:collapse;font-size:12px}' +
      '[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,currentColor);text-align:left;vertical-align:top}' +
      '[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}' +
      'html[data-theme="dark"] [data-learning-lab="' + LAB_ID + '"]{--msv-blue:#7aa7ff;--msv-green:#79d39a;--msv-orange:#f0b15a;--msv-warn:#ff9f91}' +
      '@media(max-width:760px){[data-learning-lab="' + LAB_ID + '"] .msv-controls{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="' + LAB_ID + '"] .msv-grid{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .msv-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}' +
      '@media(max-width:390px){[data-learning-lab="' + LAB_ID + '"] .msv-controls{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .msv-actions>*{width:100%}[data-learning-lab="' + LAB_ID + '"] .msv-metrics{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .msv-prediction{padding:10px}}' +
      '@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{scroll-behavior:auto!important;transition:none!important;animation:none!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }

  function predictionQuestion(doc, uid, question, name, choices) {
    var fieldset = element(doc, "fieldset", {}, [element(doc, "legend", { text: question })]);
    var options = element(doc, "div", { className: "msv-options" });
    choices.forEach(function (choice) {
      var inputId = uid + "-" + name + "-" + choice.value;
      var input = element(doc, "input", { type: "radio", id: inputId, name: uid + "-" + name, value: choice.value });
      options.appendChild(element(doc, "label", { htmlFor: inputId }, [input, element(doc, "span", { text: choice.label })]));
    });
    fieldset.appendChild(options);
    return fieldset;
  }

  function selected(form, name) {
    var input = form.querySelector('input[name="' + name + '"]:checked');
    return input ? input.value : "";
  }

  function inputControl(doc, uid, key, label, value, min, max, step, unit) {
    var id = uid + "-" + key;
    var input = element(doc, "input", { id: id, type: "number", min: min, max: max, step: step, value: value, "data-key": key });
    return { key: key, input: input, node: element(doc, "div", { className: "msv-control" }, [element(doc, "label", { htmlFor: id, text: label }), input, element(doc, "small", { text: unit })]) };
  }

  function announce(api, root, message) {
    if (api && typeof api.announce === "function") api.announce(root, message);
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument;
    injectStyles(doc);
    INSTANCE += 1;
    var uid = LAB_ID + "-" + INSTANCE;
    var state = { revealed: false };
    clear(root);
    root.setAttribute("aria-labelledby", uid + "-heading");
    var heading = element(doc, "h3", { id: uid + "-heading", text: "频率比、放大与隔振实验台" });
    var intro = element(doc, "p", { className: "msv-note", text: "先提交三项预测。结果揭示后，改变质量、刚度、激振频率或阻尼，观察 D(r) 与 TR(r) 如何分别响应。" });
    var form = element(doc, "form", { className: "msv-prediction" });
    form.appendChild(predictionQuestion(doc, uid, "默认工况的频率比 r=omega/omega_n 位于哪里？", "ratio", [
      { value: "below", label: "r < sqrt(2)，还没有隔振" },
      { value: "boundary", label: "r = sqrt(2)，正好是边界" },
      { value: "above", label: "r > sqrt(2)，进入隔振区" }
    ]));
    form.appendChild(predictionQuestion(doc, uid, "在 r=1 共振处，提高阻尼比 zeta 后，放大因子 D 如何变化？", "resonance", [
      { value: "down", label: "下降，D(1)=1/(2 zeta)" },
      { value: "up", label: "上升，阻尼把能量推入系统" },
      { value: "same", label: "不变，只改变相位" }
    ]));
    form.appendChild(predictionQuestion(doc, uid, "在 r=3 的隔振区，提高阻尼比通常怎样影响传递率？", "tradeoff", [
      { value: "up", label: "可能升高，稳态隔振不喜欢过大阻尼" },
      { value: "down", label: "一定降为零" },
      { value: "same", label: "完全不受阻尼影响" }
    ]));
    var feedback = element(doc, "p", { className: "msv-feedback", role: "status", "aria-live": "polite", text: "结果尚未揭示。" });
    var actions = element(doc, "div", { className: "msv-actions" }, [
      element(doc, "button", { type: "submit", className: "msv-primary", text: "提交预测并揭示" }),
      element(doc, "button", { type: "button", "data-reset": "true", text: "重置实验" })
    ]);
    form.appendChild(actions);
    form.appendChild(feedback);
    root.appendChild(heading);
    root.appendChild(intro);
    root.appendChild(form);

    var bench = element(doc, "div", { hidden: true });
    var controls = element(doc, "div", { className: "msv-controls" });
    var fields = [
      inputControl(doc, uid, "m", "质量 m", 50, 0.1, 10000, 0.1, "kg"),
      inputControl(doc, uid, "k", "刚度 k", 200000, 1, 10000000, 100, "N/m"),
      inputControl(doc, uid, "omega", "激振频率 omega", 100, 0.1, 1000, 1, "rad/s"),
      inputControl(doc, uid, "zeta", "阻尼比 zeta", 0.08, 0, 0.8, 0.01, "无量纲"),
      inputControl(doc, uid, "F0", "激振力幅 F0", 1000, 0.1, 100000, 10, "N")
    ];
    fields.forEach(function (field) { controls.appendChild(field.node); });
    bench.appendChild(controls);
    var error = element(doc, "p", { className: "msv-error", role: "alert", "aria-live": "polite" });
    bench.appendChild(error);
    var grid = element(doc, "div", { className: "msv-grid" });
    var chart = element(doc, "div", { className: "msv-chart" });
    var svg = svgElement(doc, "svg", {});
    chart.appendChild(svg);
    var ledger = element(doc, "div", { className: "msv-table-wrap" });
    grid.appendChild(chart);
    grid.appendChild(ledger);
    bench.appendChild(grid);
    var metrics = element(doc, "div", { className: "msv-metrics" });
    bench.appendChild(metrics);
    bench.appendChild(element(doc, "h4", { text: "阻尼权衡：同一频率比的账本" }));
    var dampingHost = element(doc, "div", { className: "msv-table-wrap" });
    bench.appendChild(dampingHost);
    root.appendChild(bench);

    function uiConfig() {
      var values = {};
      fields.forEach(function (field) {
        var raw = field.input.value.trim();
        if (!raw) throw new Error(field.key + " 不能为空");
        var value = Number(raw);
        if (!isFinite(value)) throw new Error(field.key + " 必须是有限数字");
        var min = Number(field.input.getAttribute("min"));
        var max = Number(field.input.getAttribute("max"));
        if (value < min || value > max) throw new Error(field.key + " 超出允许范围");
        values[field.key] = value;
      });
      return values;
    }

    function renderBench() {
      if (!state.revealed) return;
      try {
        var result = response(uiConfig());
        error.textContent = "";
        drawSvg(doc, svg, result);
        clear(metrics);
        metrics.appendChild(metric(doc, "omega_n", formatNumber(result.omegaN, 3) + " rad/s"));
        metrics.appendChild(metric(doc, "f_n", formatNumber(result.frequencyN, 3) + " Hz"));
        metrics.appendChild(metric(doc, "r", formatNumber(result.r, 3)));
        metrics.appendChild(metric(doc, "D", formatNumber(result.amplification, 3)));
        metrics.appendChild(metric(doc, "TR", formatNumber(result.transmissibility, 3)));
        renderTable(doc, ledger, ["量", "当前值", "读法"], [
          ["omega_n", formatNumber(result.omegaN, 5), "sqrt(k/m)，rad/s"],
          ["r", formatNumber(result.r, 6), "omega/omega_n"],
          ["D(r)", formatNumber(result.amplification, 6), "X/(F0/k)"],
          ["TR(r)", formatNumber(result.transmissibility, 6), "传到基础的力 / 激振力"],
          ["X", formatNumber(result.amplitude * 1000, 5), "mm"],
          ["判据", result.boundary ? "r=sqrt(2) 边界" : (result.isolating ? "TR<1：隔振" : "TR>=1：未隔振"), "r>sqrt(2) 才隔振"]
        ]);
        renderTable(doc, dampingHost, ["zeta", "D(r)", "TR(r)", "在当前 r 的判断"], dampingLedger(result.r).map(function (row) {
          return [formatNumber(row.zeta, 2), formatNumber(row.amplification, 4), formatNumber(row.transmissibility, 4), row.transmissibility < 1 ? "隔振" : "放大/传递"];
        }));
      } catch (validationError) {
        error.textContent = "输入校验：" + validationError.message;
        clear(metrics); clear(ledger); clear(dampingHost); clear(svg);
      }
    }

    fields.forEach(function (field) {
      field.input.addEventListener("input", renderBench);
      field.input.addEventListener("change", renderBench);
    });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var answers = {
        ratio: selected(form, uid + "-ratio"),
        resonance: selected(form, uid + "-resonance"),
        tradeoff: selected(form, uid + "-tradeoff")
      };
      if (!answers.ratio || !answers.resonance || !answers.tradeoff) {
        feedback.textContent = "请先完成三项预测；结果仍然隐藏。";
        return;
      }
      state.revealed = true;
      bench.hidden = false;
      var current = response(DEFAULTS);
      var correct = (answers.ratio === (current.r > ROOT_TWO ? "above" : "below") ? 1 : 0) + (answers.resonance === "down" ? 1 : 0) + (answers.tradeoff === "up" ? 1 : 0);
      feedback.textContent = "已揭示：" + correct + "/3 命中。拖动或输入参数后，频响图和两张账表会联动更新。";
      renderBench();
      announce(api, root, "单自由度预测已揭示，频响和隔振账本已显示。");
    });
    form.querySelector('[data-reset="true"]').addEventListener("click", function () {
      form.reset();
      state = { revealed: false };
      bench.hidden = true;
      feedback.textContent = "结果尚未揭示。";
      var defaults = { m: 50, k: 200000, omega: 100, zeta: 0.08, F0: 1000 };
      fields.forEach(function (field) { field.input.value = defaults[field.key]; });
      error.textContent = "";
      clear(metrics); clear(ledger); clear(dampingHost); clear(svg);
      announce(api, root, "单自由度实验已重置，预测结果再次隐藏。");
    });
    announce(api, root, "单自由度实验已加载；先完成三项预测。");
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var result = response(DEFAULTS);
    check(result.r > ROOT_TWO, "default case is in isolation region");
    check(near(amplification(1, 0.1), 5), "resonant magnification");
    check(near(transmissibility(ROOT_TWO, 0.08), 1, 1e-10), "sqrt two boundary independent of damping");
    check(transmissibility(2, 0.1) < 1, "r=2 isolates");
    check(transmissibility(3, 0.2) > transmissibility(3, 0.05), "high-frequency damping tradeoff");
    check(response({ m: 1, k: 2, omega: 2, zeta: 0.1, F0: 1 }).boundary, "exact boundary response");
    check(frequencySweep(DEFAULTS, 12).length === 13, "frequency sweep endpoint count");
    check(dampingLedger(1).length === 5, "damping ledger rows");
    var invalidCaught = false;
    try { response({ m: 0, k: 1, omega: 1, zeta: 0.1, F0: 1 }); } catch (error) { invalidCaught = true; }
    check(invalidCaught, "zero mass is rejected");
    return { checks: checks };
  }

  return {
    ROOT_TWO: ROOT_TWO,
    DEFAULTS: DEFAULTS,
    configOf: configOf,
    amplification: amplification,
    transmissibility: transmissibility,
    response: response,
    frequencySweep: frequencySweep,
    dampingLedger: dampingLedger,
    mount: mount,
    selfTest: selfTest
  };
});
