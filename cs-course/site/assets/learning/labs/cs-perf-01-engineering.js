(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("cs-perf-01-engineering", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("cs-perf-01-engineering self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("cs-perf-01-engineering self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var NAME = "cs-perf-01-engineering";

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function amdahl(serial, speedup) {
    var p = Math.max(0, Math.min(0.999999, Number(serial)));
    var s = Math.max(1, Number(speedup));
    return 1 / ((1 - p) + p / s);
  }

  function roofline(intensity, bandwidth, peak) {
    var i = Math.max(0, Number(intensity));
    var b = Math.max(0, Number(bandwidth));
    var p = Math.max(0, Number(peak));
    return Math.min(p, b * i);
  }

  function evaluate(options) {
    var intensity = Number(options.intensity);
    var bandwidth = Number(options.bandwidth);
    var peak = Number(options.peak);
    var attainable = roofline(intensity, bandwidth, peak);
    return {
      intensity: intensity,
      bandwidth: bandwidth,
      peak: peak,
      attainable: attainable,
      ridge: peak / bandwidth,
      bound: bandwidth * intensity < peak ? "memory" : "compute",
      speedup: amdahl(options.serial, options.speedup),
      serial: Number(options.serial),
      localSpeedup: Number(options.speedup)
    };
  }

  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (key === "text") node.textContent = attrs[key];
      else if (key === "className") node.className = attrs[key];
      else if (attrs[key] !== undefined && attrs[key] !== null) node.setAttribute(key, String(attrs[key]));
    });
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child !== undefined && child !== null) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function svgElement(doc, tag, attrs, children) {
    var node = doc.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (attrs[key] !== undefined && attrs[key] !== null) node.setAttribute(key, String(attrs[key]));
    });
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child !== undefined && child !== null) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function format(value, digits) {
    var places = digits === undefined ? 2 : digits;
    return Number(value).toFixed(places).replace(/\.?0+$/, "");
  }

  function installStyles(doc) {
    var id = "cl-" + NAME + "-styles";
    if (doc.getElementById(id)) return;
    var style = doc.createElement("style");
    style.id = id;
    style.textContent =
      '[data-learning-lab="' + NAME + '"]{--cpe-blue:#245a9b;--cpe-green:#2d7a4b;--cpe-orange:#a86213;--cpe-red:#b23a32;display:block;max-width:100%;line-height:1.55;color:var(--fg,currentColor);overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3{margin:0;letter-spacing:0}[data-learning-lab="' + NAME + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + NAME + '"] fieldset{border:0;padding:0;margin:0;min-width:0}[data-learning-lab="' + NAME + '"] legend{font-weight:750;margin-bottom:7px}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] input{min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg,Canvas);color:inherit;font:inherit;cursor:pointer}' +
      '[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] button[aria-pressed="true"],[data-learning-lab="' + NAME + '"] .cpe-primary{background:var(--cpe-blue);border-color:var(--cpe-blue);color:#fff;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] .cpe-choices,[data-learning-lab="' + NAME + '"] .cpe-actions{display:flex;flex-wrap:wrap;gap:8px}' +
      '[data-learning-lab="' + NAME + '"] .cpe-actions{margin-top:11px}[data-learning-lab="' + NAME + '"] .cpe-feedback{min-height:2em;color:var(--fg-soft);font-size:13px}' +
      '[data-learning-lab="' + NAME + '"] .cpe-revealed[hidden]{display:none}[data-learning-lab="' + NAME + '"] .cpe-layout{display:grid;grid-template-columns:minmax(180px,.65fr) minmax(0,1.35fr);gap:14px;align-items:start;margin-top:14px}' +
      '[data-learning-lab="' + NAME + '"] .cpe-controls{display:grid;gap:10px;padding:11px;border:1px solid var(--border);border-radius:7px}[data-learning-lab="' + NAME + '"] .cpe-control{display:grid;gap:4px;font-size:13px;font-weight:700}' +
      '[data-learning-lab="' + NAME + '"] input[type=range]{width:100%;accent-color:var(--cpe-blue)}[data-learning-lab="' + NAME + '"] .cpe-stage{min-width:0;border:1px solid var(--border);padding:6px;overflow:hidden}' +
      '[data-learning-lab="' + NAME + '"] svg{display:block;width:100%;height:auto}[data-learning-lab="' + NAME + '"] svg text{font-family:inherit;fill:currentColor;font-size:11px}' +
      '[data-learning-lab="' + NAME + '"] .cpe-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + NAME + '"] .cpe-metric{padding:7px;border-top:3px solid var(--cpe-blue);min-width:0}' +
      '[data-learning-lab="' + NAME + '"] .cpe-metric span{display:block;color:var(--fg-soft);font-size:11px}[data-learning-lab="' + NAME + '"] .cpe-metric strong{display:block;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] table{border-collapse:collapse;width:100%;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:6px 7px;text-align:left;border-bottom:1px solid var(--border)}' +
      '@media(max-width:720px){[data-learning-lab="' + NAME + '"] .cpe-layout{grid-template-columns:1fr}}@media(max-width:520px){[data-learning-lab="' + NAME + '"] .cpe-choices,[data-learning-lab="' + NAME + '"] .cpe-actions{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] button{width:100%}[data-learning-lab="' + NAME + '"] .cpe-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}';
    doc.head.appendChild(style);
  }

  function renderRoofline(doc, data) {
    var svg = svgElement(doc, "svg", { viewBox: "0 0 520 280", role: "img", "aria-label": "Roofline 带宽斜线与算力平线" });
    var left = 52, bottom = 236, width = 420, height = 190;
    var maxI = Math.max(16, data.ridge * 2, data.intensity * 1.3);
    var maxP = Math.max(data.peak * 1.12, data.attainable * 1.2, 1);
    function x(value) { return left + (value / maxI) * width; }
    function y(value) { return bottom - (value / maxP) * height; }
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: left + width, y2: bottom, stroke: "currentColor", "stroke-width": 1.3 }));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: left, y2: bottom - height, stroke: "currentColor", "stroke-width": 1.3 }));
    svg.appendChild(svgElement(doc, "polyline", { points: x(0) + "," + y(0) + " " + x(data.ridge) + "," + y(data.peak) + " " + x(maxI) + "," + y(data.peak), fill: "none", stroke: "var(--cpe-blue)", "stroke-width": 3 }));
    svg.appendChild(svgElement(doc, "line", { x1: x(data.ridge), y1: bottom, x2: x(data.ridge), y2: y(data.peak), stroke: "var(--cpe-orange)", "stroke-dasharray": "5 4" }));
    svg.appendChild(svgElement(doc, "circle", { cx: x(data.intensity), cy: y(data.attainable), r: 7, fill: data.bound === "memory" ? "var(--cpe-orange)" : "var(--cpe-green)", stroke: "var(--bg,Canvas)", "stroke-width": 2 }));
    svg.appendChild(svgElement(doc, "text", { x: left + width / 2, y: 270, "text-anchor": "middle" }, "算术强度 I (FLOP/Byte)"));
    svg.appendChild(svgElement(doc, "text", { x: 15, y: 130, transform: "rotate(-90 15 130)", "text-anchor": "middle" }, "可达性能 P"));
    svg.appendChild(svgElement(doc, "text", { x: x(data.ridge) + 5, y: bottom - 6 }, "I*=" + format(data.ridge, 1)));
    svg.appendChild(svgElement(doc, "text", { x: x(data.intensity) + 9, y: y(data.attainable) - 8 }, data.bound));
    return svg;
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    installStyles(doc);
    root.replaceChildren();
    var shell = element(doc, "div", {});
    shell.appendChild(element(doc, "h3", { text: "Roofline × Amdahl：先定位屋顶，再决定优化" }));
    shell.appendChild(element(doc, "p", { className: "cpe-note", text: "先预测瓶颈和端到端收益，提交后再打开可调账本。" }));
    var form = element(doc, "form", {});
    var fieldset = element(doc, "fieldset");
    fieldset.appendChild(element(doc, "legend", { text: "预测门" }));
    var answers = { bound: null, effect: null };
    var buttons = [];
    function question(key, prompt, choices) {
      fieldset.appendChild(element(doc, "p", { text: prompt }));
      var row = element(doc, "div", { className: "cpe-choices", role: "group", "aria-label": prompt });
      choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: choice[1] });
        button.addEventListener("click", function () {
          answers[key] = choice[0];
          buttons.forEach(function (item) { if (item.key === key) item.node.setAttribute("aria-pressed", item.value === choice[0] ? "true" : "false"); });
        });
        buttons.push({ key: key, value: choice[0], node: button });
        row.appendChild(button);
      });
      fieldset.appendChild(row);
    }
    question("bound", "I=2/12 时，哪一项先卡住？", [["memory", "带宽"], ["compute", "算力"]]);
    question("effect", "只优化 5% 的代码到无穷，整体会？", [["tiny", "只快约 5%"], ["huge", "接近无限快"]]);
    form.appendChild(fieldset);
    var feedback = element(doc, "p", { className: "cpe-feedback", role: "status", "aria-live": "polite", text: "请完成两项预测。" });
    form.appendChild(feedback);
    form.appendChild(element(doc, "div", { className: "cpe-actions" }, [element(doc, "button", { type: "submit", className: "cpe-primary", text: "提交预测并揭示" })]));
    shell.appendChild(form);
    var revealed = element(doc, "section", { className: "cpe-revealed", hidden: "hidden" });
    var layout = element(doc, "div", { className: "cpe-layout" });
    var controls = element(doc, "div", { className: "cpe-controls" });
    function slider(label, min, max, step, value) {
      var input = element(doc, "input", { type: "range", min: min, max: max, step: step, value: value });
      var output = element(doc, "output", { text: value });
      var block = element(doc, "label", { className: "cpe-control" }, [label + " = ", output, input]);
      controls.appendChild(block);
      return { input: input, output: output };
    }
    var serial = slider("串行比例", "0", "0.95", "0.05", "0.6");
    var local = slider("局部加速", "1", "32", "1", "5");
    var intensity = slider("算术强度", "0.1", "16", "0.1", "0.167");
    var stage = element(doc, "div", { className: "cpe-stage" });
    layout.appendChild(controls);
    layout.appendChild(stage);
    revealed.appendChild(layout);
    var metrics = element(doc, "div", { className: "cpe-metrics" });
    var metricBound = element(doc, "div", { className: "cpe-metric" });
    var metricRoof = element(doc, "div", { className: "cpe-metric" });
    var metricAmdahl = element(doc, "div", { className: "cpe-metric" });
    var metricRidge = element(doc, "div", { className: "cpe-metric" });
    [metricBound, metricRoof, metricAmdahl, metricRidge].forEach(function (node) { metrics.appendChild(node); });
    revealed.appendChild(metrics);
    var table = element(doc, "table", { "aria-label": "性能诊断账本" });
    table.innerHTML = "<thead><tr><th>量</th><th>值</th><th>解释</th></tr></thead><tbody></tbody>";
    revealed.appendChild(table);
    shell.appendChild(revealed);
    root.appendChild(shell);
    function render() {
      var data = evaluate({ intensity: Number(intensity.input.value), bandwidth: 16, peak: 64, serial: Number(serial.input.value), speedup: Number(local.input.value) });
      [serial, local, intensity].forEach(function (item) { item.output.textContent = item.input.value; });
      stage.replaceChildren(renderRoofline(doc, data));
      metricBound.innerHTML = "<span>当前屋顶</span><strong>" + (data.bound === "memory" ? "带宽受限" : "算力受限") + "</strong>";
      metricRoof.innerHTML = "<span>可达性能</span><strong>" + format(data.attainable) + " GFLOP/s</strong>";
      metricAmdahl.innerHTML = "<span>Amdahl 总加速</span><strong>" + format(data.speedup) + "×</strong>";
      metricRidge.innerHTML = "<span>转折强度</span><strong>" + format(data.ridge) + " FLOP/B</strong>";
      table.querySelector("tbody").innerHTML =
        "<tr><th>算术强度</th><td>" + format(data.intensity, 3) + "</td><td>带宽屋顶=" + format(data.bandwidth * data.intensity) + "</td></tr>" +
        "<tr><th>峰值算力</th><td>" + data.peak + " GFLOP/s</td><td>平线屋顶</td></tr>" +
        "<tr><th>局部优化</th><td>p=" + format(data.serial, 2) + ", s=" + data.localSpeedup + "</td><td>端到端只按 Amdahl 计</td></tr>";
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!answers.bound || !answers.effect) {
        feedback.textContent = "两项都要先下注。";
        return;
      }
      revealed.hidden = false;
      var score = (answers.bound === "memory" ? 1 : 0) + (answers.effect === "tiny" ? 1 : 0);
      feedback.textContent = "预测命中 " + score + " / 2；现在改变一个旋钮并观察瓶颈是否迁移。";
      render();
    });
    [serial.input, local.input, intensity.input].forEach(function (input) { input.addEventListener("input", render); });
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    check(Math.abs(amdahl(0.6, 5) - 1.923076923) < 1e-6, "Amdahl reference");
    check(Math.abs(roofline(2 / 12, 16, 64) - 8 / 3) < 1e-9, "bandwidth roof");
    check(roofline(8, 16, 64) === 64, "compute roof");
    check(evaluate({ intensity: 2 / 12, bandwidth: 16, peak: 64, serial: 0.6, speedup: 5 }).bound === "memory", "bound diagnosis");
    return { checks: checks };
  }

  return { mount: mount, selfTest: selfTest, amdahl: amdahl, roofline: roofline, evaluate: evaluate };
});
