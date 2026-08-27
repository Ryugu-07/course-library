(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("micro-memory", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("micro-memory self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("micro-memory self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function () {
  "use strict";

  var LAB_ID = "micro-memory";
  var STYLE_ID = "micro-memory-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var LEVELS = {
    sram: { label: "SRAM", latency: 4, energy: 0.2, color: "#2563a6" },
    dram: { label: "DRAM", latency: 250, energy: 20, color: "#b45a2c" },
    nand: { label: "NAND", latency: 100000, energy: 2000, color: "#39734d" }
  };
  var DEFAULTS = { path: "cache", accesses: 1000000, hitPct: 95, writePct: 10 };

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
      path: source.path === "dram" || source.path === "nand" ? source.path : "cache",
      accesses: clamp(finite(source.accesses === undefined ? DEFAULTS.accesses : source.accesses, "access count"), 10000, 10000000),
      hitPct: clamp(finite(source.hitPct === undefined ? DEFAULTS.hitPct : source.hitPct, "cache hit rate"), 50, 99),
      writePct: clamp(finite(source.writePct === undefined ? DEFAULTS.writePct : source.writePct, "write fraction"), 0, 30)
    };
  }

  function calculate(input) {
    var state = normalize(input);
    var hit = state.path === "cache" ? state.hitPct / 100 : 0;
    var miss = 1 - hit;
    var writeFraction = state.writePct / 100;
    var writeAmplification = state.path === "nand" ? 1 + 2 * writeFraction : 1;
    var averageLatency = state.path === "cache"
      ? hit * LEVELS.sram.latency + miss * LEVELS.dram.latency
      : state.path === "dram" ? LEVELS.dram.latency : LEVELS.nand.latency;
    var averageEnergy = state.path === "cache"
      ? hit * LEVELS.sram.energy + miss * LEVELS.dram.energy
      : state.path === "dram" ? LEVELS.dram.energy : LEVELS.nand.energy * writeAmplification;
    var totalCycles = state.accesses * averageLatency;
    var totalEnergyPj = state.accesses * averageEnergy;
    return {
      state: state,
      hit: hit,
      miss: miss,
      writeAmplification: writeAmplification,
      averageLatency: averageLatency,
      averageEnergy: averageEnergy,
      totalCycles: totalCycles,
      totalEnergyPj: totalEnergyPj,
      timeMs: totalCycles / 3e9 * 1000,
      cacheToNandSpeedup: LEVELS.nand.latency / averageLatency
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
      '[data-learning-lab="' + LAB_ID + '"]{--mmm-blue:#2563a6;--mmm-orange:#b45a2c;--mmm-green:#39734d;--mmm-red:#b23a32;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}' +
      '[data-learning-lab="' + LAB_ID + '"] h3{margin:0;font-size:1.15rem;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] h4{margin:16px 0 5px;font-size:1rem}[data-learning-lab="' + LAB_ID + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] .mmm-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{font:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] button:hover{border-color:var(--mmm-blue)}[data-learning-lab="' + LAB_ID + '"] button[aria-pressed="true"],[data-learning-lab="' + LAB_ID + '"] .mmm-primary{border-color:var(--mmm-blue);background:var(--mmm-blue);color:#fff;font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible{outline:3px solid #1769aa;outline-offset:2px}' +
      '[data-learning-lab="' + LAB_ID + '"] .mmm-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px;align-items:end;margin:12px 0}[data-learning-lab="' + LAB_ID + '"] .mmm-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .mmm-control label{font-size:13px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] output{color:var(--mmm-blue);font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + LAB_ID + '"] input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--mmm-blue)}[data-learning-lab="' + LAB_ID + '"] .mmm-actions{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}[data-learning-lab="' + LAB_ID + '"] .mmm-actions>*{flex:1 1 180px}' +
      '[data-learning-lab="' + LAB_ID + '"] .mmm-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mmm-good{color:var(--mmm-green)}[data-learning-lab="' + LAB_ID + '"] .mmm-warn{color:var(--mmm-red)}' +
      '[data-learning-lab="' + LAB_ID + '"] .mmm-layout{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(230px,.75fr);gap:15px;align-items:start}[data-learning-lab="' + LAB_ID + '"] .mmm-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:6px;overflow:hidden}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%}[data-learning-lab="' + LAB_ID + '"] svg text{font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] .mmm-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}[data-learning-lab="' + LAB_ID + '"] .mmm-metric{min-width:0;padding:8px;border-top:3px solid var(--mmm-blue)}[data-learning-lab="' + LAB_ID + '"] .mmm-metric:nth-child(2n){border-color:var(--mmm-orange)}[data-learning-lab="' + LAB_ID + '"] .mmm-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mmm-metric strong{display:block;margin-top:3px;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + LAB_ID + '"] .mmm-note{margin-top:11px;padding:9px 11px;border-left:3px solid var(--mmm-green);color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}' +
      '@media(max-width:820px){[data-learning-lab="' + LAB_ID + '"] .mmm-layout{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .mmm-controls{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){[data-learning-lab="' + LAB_ID + '"] .mmm-controls{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .mmm-choices{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }

  function metric(doc, label, value, className) {
    return create(doc, "div", { className: className || "mmm-metric" }, [
      create(doc, "span", { text: label }),
      create(doc, "strong", { text: value })
    ]);
  }

  function drawChart(doc, result) {
    var width = 620;
    var height = 310;
    var left = 62;
    var right = 18;
    var top = 30;
    var bottom = 50;
    var plotWidth = width - left - right;
    var plotHeight = height - top - bottom;
    var chart = svg(doc, "svg", { viewBox: "0 0 " + width + " " + height, role: "img", "aria-label": "SRAM、DRAM、NAND 延迟与能量层次图" });
    var maxLogLatency = 5;
    var maxLogEnergy = 4;
    function x(index) { return left + (index + 0.5) / 3 * plotWidth; }
    function yLatency(value) { return top + (maxLogLatency - Math.log10(value)) / maxLogLatency * (plotHeight / 2 - 10); }
    function yEnergy(value) { return top + plotHeight / 2 + 22 + (maxLogEnergy - Math.log10(value)) / maxLogEnergy * (plotHeight / 2 - 20); }
    chart.appendChild(text(doc, left, 18, "访问延迟（cycles，对数）", { "font-weight": "700" }));
    chart.appendChild(text(doc, left, top + plotHeight / 2 + 12, "搬运能量（pJ，对数）", { "font-weight": "700" }));
    [1, 10, 100, 1000, 10000, 100000].forEach(function (tick) {
      var yy = yLatency(tick);
      if (yy < top || yy > top + plotHeight / 2) return;
      chart.appendChild(svg(doc, "line", { x1: left, y1: yy, x2: width - right, y2: yy, stroke: "#cbd5e1", "stroke-width": 1 }));
      chart.appendChild(text(doc, left - 8, yy + 4, String(tick), { "text-anchor": "end", "font-size": 10 }));
    });
    [0.1, 1, 10, 100, 1000, 10000].forEach(function (tick) {
      var yy = yEnergy(tick);
      if (yy < top + plotHeight / 2 || yy > height - bottom) return;
      chart.appendChild(svg(doc, "line", { x1: left, y1: yy, x2: width - right, y2: yy, stroke: "#e2e8f0", "stroke-width": 1 }));
      chart.appendChild(text(doc, left - 8, yy + 4, String(tick), { "text-anchor": "end", "font-size": 10 }));
    });
    chart.appendChild(svg(doc, "line", { x1: left, y1: top + plotHeight / 2 - 3, x2: width - right, y2: top + plotHeight / 2 - 3, stroke: "currentColor", "stroke-width": 1.2 }));
    ["sram", "dram", "nand"].forEach(function (name, index) {
      var level = LEVELS[name];
      var xx = x(index);
      var selected = result.state.path === (name === "sram" ? "cache" : name);
      chart.appendChild(svg(doc, "rect", { x: xx - 25, y: yLatency(level.latency), width: 50, height: top + plotHeight / 2 - 3 - yLatency(level.latency), fill: level.color, opacity: selected ? 0.95 : 0.45 }));
      chart.appendChild(svg(doc, "rect", { x: xx - 25, y: yEnergy(level.energy), width: 50, height: height - bottom - yEnergy(level.energy), fill: level.color, opacity: selected ? 0.95 : 0.45 }));
      chart.appendChild(text(doc, xx, height - 27, level.label, { "text-anchor": "middle", "font-size": 11, "font-weight": selected ? "700" : "400" }));
      chart.appendChild(text(doc, xx, yLatency(level.latency) - 5, level.latency + " c", { "text-anchor": "middle", "font-size": 10 }));
      chart.appendChild(text(doc, xx, yEnergy(level.energy) - 5, level.energy + " pJ", { "text-anchor": "middle", "font-size": 10 }));
    });
    chart.appendChild(text(doc, left + plotWidth / 2, height - 5, "存储层（近 -> 远）", { "text-anchor": "middle" }));
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
    node.appendChild(create(doc, "h3", { text: "存储墙实验：命中率如何改变一百万次访问" }));
    node.appendChild(create(doc, "p", { className: "mmm-note", text: "默认 SRAM 命中率 95%；先预测从 90% 提高到 95% 会省下多少平均访问周期。" }));
    var predictionField = create(doc, "fieldset");
    predictionField.appendChild(create(doc, "legend", { text: "预测：在 SRAM/DRAM 两层模型中，命中率 90% -> 95% 会使平均延迟" }));
    var predictionRow = create(doc, "div", { className: "mmm-choices" });
    [["twelve", "减少约 12 cycles"], ["one", "减少约 1 cycle"], ["none", "几乎不变"]].forEach(function (item) {
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
    var pathField = create(doc, "fieldset");
    pathField.appendChild(create(doc, "legend", { text: "访问路径" }));
    var pathRow = create(doc, "div", { className: "mmm-choices" });
    [["cache", "SRAM -> DRAM"], ["dram", "DRAM 直达"], ["nand", "NAND 随机访问"]].forEach(function (item) {
      var button = create(doc, "button", { type: "button", text: item[1], "aria-pressed": item[0] === state.path ? "true" : "false" });
      button.addEventListener("click", function () {
        state.path = item[0];
        pathRow.querySelectorAll("button").forEach(function (other) { other.setAttribute("aria-pressed", other === button ? "true" : "false"); });
        revealed = false;
        render();
      });
      pathRow.appendChild(button);
    });
    pathField.appendChild(pathRow);
    node.appendChild(pathField);
    var controls = create(doc, "div", { className: "mmm-controls" });
    function addRange(label, key, min, max, step, formatter) {
      var holder = create(doc, "div", { className: "mmm-control" });
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
    var accessesControl = addRange("访问次数 M", "accesses", 10000, 10000000, 10000, function (value) { return format(value, 0); });
    var hitControl = addRange("SRAM 命中率", "hitPct", 50, 99, 1, function (value) { return value + "%"; });
    var writeControl = addRange("写入比例", "writePct", 0, 30, 1, function (value) { return value + "%"; });
    node.appendChild(controls);
    var actions = create(doc, "div", { className: "mmm-actions" });
    var check = create(doc, "button", { type: "button", className: "mmm-primary", text: "核对预测并显示账本" });
    var reset = create(doc, "button", { type: "button", text: "恢复默认" });
    actions.appendChild(check);
    actions.appendChild(reset);
    node.appendChild(actions);
    var feedback = create(doc, "p", { className: "mmm-feedback", "aria-live": "polite" });
    node.appendChild(feedback);
    var resultRoot = create(doc, "div", { hidden: true });
    node.appendChild(resultRoot);

    check.addEventListener("click", function () {
      revealed = true;
      var result = calculate(state);
      var expected = state.path === "cache" ? "twelve" : "none";
      var ok = prediction === expected;
      feedback.className = "mmm-feedback " + (ok ? "mmm-good" : "mmm-warn");
      feedback.textContent = ok ? "预测正确：命中率改变的是远层访问的概率，平均代价按期望值线性记账。" : "先写 E[T] = h*4 + (1-h)*250；5 个百分点的 miss 转移会省下 0.05*(250-4)=12.3 cycles。";
      if (api && typeof api.announce === "function") api.announce(node, feedback.textContent);
      renderResult(result);
    });
    reset.addEventListener("click", function () {
      state = Object.assign({}, DEFAULTS);
      prediction = null;
      revealed = false;
      predictionButtons.forEach(function (button) { button.setAttribute("aria-pressed", "false"); });
      pathRow.querySelectorAll("button").forEach(function (button, index) { button.setAttribute("aria-pressed", index === 0 ? "true" : "false"); });
      [accessesControl, hitControl, writeControl].forEach(function (control, index) {
        control.input.value = state[["accesses", "hitPct", "writePct"][index]];
      });
      feedback.textContent = "";
      render();
    });

    function renderResult(result) {
      clear(resultRoot);
      resultRoot.appendChild(create(doc, "div", { className: "mmm-layout" }, [
        create(doc, "div", { className: "mmm-stage" }, [drawChart(doc, result)]),
        create(doc, "div", { className: "mmm-metrics" }, [
          metric(doc, "平均延迟", format(result.averageLatency, 2) + " cycles"),
          metric(doc, "总 cycles", format(result.totalCycles, 0)),
          metric(doc, "总时间 @ 3 GHz", format(result.timeMs, 3) + " ms"),
          metric(doc, "平均能量", format(result.averageEnergy, 2) + " pJ"),
          metric(doc, "总搬运能量", format(result.totalEnergyPj / 1e6, 3) + " uJ"),
          metric(doc, "相对 NAND 速度", format(result.cacheToNandSpeedup, 1) + "x"),
          metric(doc, "命中率", format(result.hit * 100, 1) + "%"),
          metric(doc, "写放大 proxy", format(result.writeAmplification, 2) + "x")
        ])
      ]));
      resultRoot.appendChild(create(doc, "p", { className: "mmm-note", text: "当前路径为 " + (result.state.path === "cache" ? "SRAM -> DRAM" : result.state.path === "dram" ? "DRAM 直达" : "NAND 随机访问") + "。图中柱高是对数尺度；NAND 的写放大只在写入路径上计入，真实 FTL/ECC/队列还会继续改变尾延迟。" }));
      resultRoot.hidden = !revealed;
    }

    function render() {
      [accessesControl, hitControl, writeControl].forEach(function (control, index) {
        var key = ["accesses", "hitPct", "writePct"][index];
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
    var lowerHit = calculate({ path: "cache", accesses: 1000000, hitPct: 90, writePct: 10 });
    var directDram = calculate({ path: "dram", accesses: 1000000, hitPct: 95, writePct: 10 });
    var nand = calculate({ path: "nand", accesses: 1000000, hitPct: 95, writePct: 10 });
    assert(near(base.averageLatency, 16.3, 1e-12), "cache expectation");
    assert(lowerHit.averageLatency > base.averageLatency, "hit-rate trend");
    assert(near(directDram.averageLatency, 250, 1e-12), "DRAM direct path");
    assert(nand.averageLatency > directDram.averageLatency && nand.averageEnergy > directDram.averageEnergy, "NAND hierarchy");
    assert(near(calculate({ path: "cache", accesses: 2000000, hitPct: 95, writePct: 10 }).totalCycles / base.totalCycles, 2, 1e-12), "access count scaling");
    assert(near(calculate({ path: "nand", accesses: 1000000, hitPct: 95, writePct: 30 }).writeAmplification, 1.6, 1e-12), "write amplification proxy");
    return { checks: checks };
  }

  return { mount: mount, calculate: calculate, selfTest: selfTest };
});
