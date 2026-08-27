(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("photo-quantum-optics", exported.mount);
  }
  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log("photo-quantum-optics self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("photo-quantum-optics self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var STYLE_ID = "cl-photo-quantum-optics-styles";
  var DEFAULT = { photons: 10000, efficiency: .8, resource: "coherent" };

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function near(left, right, tolerance) {
    return Math.abs(left - right) <= (tolerance || 1e-9) * Math.max(1, Math.abs(left), Math.abs(right));
  }

  function experiment(options) {
    var photons = clamp(Math.round(Number(options.photons) / 100) * 100, 100, 100000);
    var efficiency = clamp(Number(options.efficiency), .5, 1);
    var resource = ["coherent", "ideal", "loss"].indexOf(options.resource) >= 0 ? options.resource : "coherent";
    var sql = 1 / Math.sqrt(photons);
    var heisenberg = 1 / photons;
    var lossFloor = Math.sqrt((1 - efficiency) / (efficiency * photons));
    var teaching = Math.max(heisenberg, lossFloor);
    var uncertainty = resource === "coherent" ? sql : resource === "ideal" ? heisenberg : teaching;
    var effectivePhotons = photons * efficiency;
    return {
      photons: photons,
      efficiency: efficiency,
      resource: resource,
      effectivePhotons: effectivePhotons,
      sql: sql,
      heisenberg: heisenberg,
      lossFloor: lossFloor,
      teaching: teaching,
      snr: Math.sqrt(effectivePhotons),
      uncertainty: uncertainty
    };
  }

  function fmt(value, digits) {
    if (!finite(value)) return "—";
    var places = digits === undefined ? 3 : Number(digits);
    var text = value.toFixed(places);
    return places === 0 ? text : text.replace(/0+$/, "").replace(/\.$/, "");
  }

  function sci(value) {
    if (!finite(value) || value === 0) return "0";
    return value.toExponential(2).replace("+", "");
  }

  function element(api, tag, attrs, children) {
    return api.el(tag, attrs || {}, children);
  }

  function svgElement(api, tag, attrs, children) {
    return api.svg(tag, attrs || {}, children);
  }

  function clear(node) {
    if (node.replaceChildren) node.replaceChildren();
    else while (node.firstChild) node.removeChild(node.firstChild);
  }

  function installStyles(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      ".pqo-lab{--pqo-blue:var(--cl-blue,#315f9d);--pqo-gold:var(--cl-gold,#9b6a12);--pqo-red:var(--cl-red,#b64335);--pqo-green:var(--cl-green,#39734d);max-width:100%;min-width:0;color:var(--fg);line-height:1.55}.pqo-lab *{box-sizing:border-box}.pqo-lab h3{margin:0;font-size:1.18rem}.pqo-lab p{margin:.65em 0}.pqo-lab .pqo-note,.pqo-lab .pqo-feedback{color:var(--fg-soft);font-size:13px;line-height:1.6;overflow-wrap:anywhere}.pqo-lab .pqo-prompt{margin:14px 0;padding:12px 14px;border-left:3px solid var(--pqo-gold);background:var(--bg)}.pqo-lab fieldset{min-width:0;margin:0 0 11px;padding:0;border:0}.pqo-lab legend{margin-bottom:7px;color:var(--fg);font-size:13px;font-weight:750;line-height:1.5}.pqo-lab .pqo-choice-grid,.pqo-lab .pqo-mode-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.pqo-lab button,.pqo-lab select,.pqo-lab input{font:inherit;letter-spacing:0}.pqo-lab button,.pqo-lab select{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;line-height:1.35;overflow-wrap:anywhere}.pqo-lab select{width:100%}.pqo-lab button:hover{border-color:var(--accent)}.pqo-lab button[aria-pressed=true],.pqo-lab button.pqo-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:700}.pqo-lab button:disabled{cursor:not-allowed;opacity:.55}.pqo-lab button:focus-visible,.pqo-lab select:focus-visible,.pqo-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.pqo-lab .pqo-actions{display:flex;flex-wrap:wrap;gap:8px}.pqo-lab .pqo-actions>*{flex:1 1 160px}.pqo-lab .pqo-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.pqo-lab .pqo-pass{color:var(--pqo-green)}.pqo-lab .pqo-warn{color:var(--pqo-red)}",
      ".pqo-lab .pqo-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.pqo-lab .pqo-layout{display:grid;grid-template-columns:minmax(210px,.72fr) minmax(0,1.28fr);gap:14px;align-items:start}.pqo-lab .pqo-controls,.pqo-lab .pqo-stage{min-width:0}.pqo-lab .pqo-controls{display:grid;gap:11px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg)}.pqo-lab .pqo-control{display:grid;gap:5px}.pqo-lab .pqo-control label,.pqo-lab .pqo-control-title{color:var(--fg-soft);font-size:13px;font-weight:700}.pqo-lab .pqo-control output{color:var(--accent);font-variant-numeric:tabular-nums}.pqo-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent)}.pqo-lab .pqo-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden}.pqo-lab svg{display:block;width:100%;height:auto;color:var(--fg)}.pqo-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.pqo-lab .pqo-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin:11px 0}.pqo-lab .pqo-metric{min-width:0;padding:8px;border-top:2px solid var(--border);background:var(--bg)}.pqo-lab .pqo-metric:nth-child(4n+1){border-top-color:var(--pqo-blue)}.pqo-lab .pqo-metric:nth-child(4n+2){border-top-color:var(--pqo-gold)}.pqo-lab .pqo-metric:nth-child(4n+3){border-top-color:var(--pqo-red)}.pqo-lab .pqo-metric:nth-child(4n){border-top-color:var(--pqo-green)}.pqo-lab .pqo-metric span{display:block;color:var(--fg-soft);font-size:11.5px}.pqo-lab .pqo-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.pqo-lab table{width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.pqo-lab th,.pqo-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}.pqo-lab th{color:var(--fg-soft);font-weight:750}.pqo-lab .pqo-interpretation{margin:11px 0 0;padding:10px 12px;border-left:3px solid var(--pqo-green);background:var(--bg);font-size:13px;line-height:1.65;overflow-wrap:anywhere}",
      "@media(max-width:820px){.pqo-lab .pqo-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:560px){.pqo-lab .pqo-choice-grid,.pqo-lab .pqo-mode-row{grid-template-columns:minmax(0,1fr)}.pqo-lab .pqo-frame{padding:5px}.pqo-lab th,.pqo-lab td{padding-left:5px;padding-right:5px}}@media(prefers-reduced-motion:reduce){.pqo-lab *{scroll-behavior:auto!important;transition:none!important;animation:none!important}}"
    ].join("");
    style.textContent += ".pqo-lab .pqo-grid{stroke:var(--border);stroke-width:1;opacity:.72}.pqo-lab .pqo-sql{fill:none;stroke:var(--pqo-blue);stroke-width:3;stroke-linecap:round}.pqo-lab .pqo-heisenberg{fill:none;stroke:var(--pqo-green);stroke-width:3;stroke-linecap:round}.pqo-lab .pqo-loss{fill:none;stroke:var(--pqo-red);stroke-width:3;stroke-linecap:round}.pqo-lab .pqo-marker{stroke:var(--pqo-gold);stroke-width:1.5;stroke-dasharray:3 3}.pqo-lab .pqo-point{fill:var(--pqo-gold);stroke:var(--bg);stroke-width:2}";
    (doc.head || doc.documentElement).appendChild(style);
  }

  function buildChart(api, data) {
    var svg = svgElement(api, "svg", {
      viewBox: "0 0 720 300",
      role: "img",
      "aria-label": "SQL、理想海森堡标度和损耗底随光子数变化"
    });
    svg.appendChild(svgElement(api, "title", {}, "量子测量标度与损耗"));
    var left = 56, right = 682, top = 28, bottom = 236;
    var xLog = function (value) { return left + (Math.log10(value) - 2) / 3 * (right - left); };
    var yLog = function (value) { return bottom - (Math.log10(value) + 5) / 4 * (bottom - top); };
    [100, 1000, 10000, 100000].forEach(function (value) {
      var x = xLog(value);
      svg.appendChild(svgElement(api, "line", { x1: x, y1: top, x2: x, y2: bottom, "class": "pqo-grid" }));
      svg.appendChild(svgElement(api, "text", { x: x, y: bottom + 20, "text-anchor": "middle", "font-size": 11 }, value >= 1000 ? (value / 1000) + "k" : String(value)));
    });
    [.1, .01, .001, .0001, .00001].forEach(function (value) {
      var y = yLog(value);
      svg.appendChild(svgElement(api, "line", { x1: left, y1: y, x2: right, y2: y, "class": "pqo-grid" }));
      svg.appendChild(svgElement(api, "text", { x: left - 8, y: y + 4, "text-anchor": "end", "font-size": 10 }, sci(value)));
    });
    var curves = [
      { cls: "pqo-sql", fn: function (n) { return 1 / Math.sqrt(n); } },
      { cls: "pqo-heisenberg", fn: function (n) { return 1 / n; } },
      { cls: "pqo-loss", fn: function (n) { return Math.sqrt((1 - data.efficiency) / (data.efficiency * n)); } }
    ];
    curves.forEach(function (curve) {
      var points = [];
      for (var index = 0; index <= 60; index += 1) {
        var n = Math.pow(10, 2 + index / 20);
        points.push({ x: xLog(n), y: yLog(curve.fn(n)) });
      }
      svg.appendChild(svgElement(api, "path", { d: points.map(function (point, pointIndex) { return (pointIndex ? "L" : "M") + point.x.toFixed(2) + "," + point.y.toFixed(2); }).join(" "), "class": curve.cls }));
    });
    var x = xLog(data.photons);
    svg.appendChild(svgElement(api, "line", { x1: x, y1: top, x2: x, y2: bottom, "class": "pqo-marker" }));
    svg.appendChild(svgElement(api, "circle", { cx: x, cy: yLog(data.uncertainty), r: 5, "class": "pqo-point" }));
    svg.appendChild(svgElement(api, "text", { x: right, y: 18, "text-anchor": "end", "font-size": 12 }, "不确定度（对数轴，rad）"));
    svg.appendChild(svgElement(api, "text", { x: right, y: bottom + 42, "text-anchor": "end", "font-size": 11 }, "光子数 N"));
    return svg;
  }

  function appendMetric(api, parent, label, value) {
    parent.appendChild(element(api, "div", { className: "pqo-metric" }, [
      element(api, "span", { text: label }),
      element(api, "strong", { text: value })
    ]));
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    installStyles(doc);
    var state = {
      photons: DEFAULT.photons,
      efficiency: DEFAULT.efficiency,
      resource: DEFAULT.resource,
      revealed: false,
      answers: {}
    };
    var shell = element(api, "div", { className: "pqo-lab" });
    shell.appendChild(element(api, "h3", { text: "量子资源账本：理想标度会被损耗抬到哪里？" }));
    shell.appendChild(element(api, "p", { className: "pqo-note", text: "先预测 SQL、海森堡标度与损耗底的关系；公式中的损耗项是透明标注的教学代理，不替代具体协议性能。" }));
    var gate = element(api, "div", { className: "pqo-prompt" });
    var questions = [
      { id: "poisson", title: "泊松光子数 N 的标准差与 SNR 怎样标度？", choices: [["sqrt", "标准差 √N，SNR=√N"], ["linear", "标准差 N，SNR=N²"]] },
      { id: "scaling", title: "增大 N 时，SQL 与理想 1/N 哪个下降更快？", choices: [["heisenberg", "理想 1/N 更快"], ["same", "两者一样快"]] },
      { id: "loss", title: "η 从 0.8 降到 0.5，对损耗底的影响怎样？", choices: [["root", "按效率进入平方根项，底噪上升"], ["none", "没有影响"]] }
    ];
    var questionButtons = {};
    questions.forEach(function (question) {
      var field = element(api, "fieldset");
      field.appendChild(element(api, "legend", { text: question.title }));
      var choices = element(api, "div", { className: "pqo-choice-grid" });
      questionButtons[question.id] = [];
      question.choices.forEach(function (choice) {
        var button = element(api, "button", { type: "button", text: choice[1], "aria-pressed": "false" });
        button.addEventListener("click", function () {
          state.answers[question.id] = choice[0];
          renderGate();
        });
        questionButtons[question.id].push({ value: choice[0], node: button });
        choices.appendChild(button);
      });
      field.appendChild(choices);
      gate.appendChild(field);
    });
    var actions = element(api, "div", { className: "pqo-actions" });
    var check = element(api, "button", { type: "button", className: "pqo-primary", text: "核对预测" });
    var reset = element(api, "button", { type: "button", text: "重置预测" });
    var feedback = element(api, "p", { className: "pqo-feedback", "aria-live": "polite" });
    actions.appendChild(check);
    actions.appendChild(reset);
    gate.appendChild(actions);
    gate.appendChild(feedback);
    shell.appendChild(gate);
    var results = element(api, "div", { className: "pqo-results" });
    results.hidden = true;
    shell.appendChild(results);
    root.replaceChildren(shell);

    function renderGate() {
      questions.forEach(function (question) {
        questionButtons[question.id].forEach(function (entry) {
          entry.node.setAttribute("aria-pressed", state.answers[question.id] === entry.value ? "true" : "false");
        });
      });
      var complete = questions.every(function (question) { return state.answers[question.id]; });
      check.disabled = !complete;
      if (!state.revealed) {
        feedback.textContent = complete ? "预测已记录，点击“核对预测”查看标度曲线。" : "请先回答三个判断。";
        feedback.className = "pqo-feedback";
      } else {
        var expected = { poisson: "sqrt", scaling: "heisenberg", loss: "root" };
        var score = questions.reduce(function (total, question) {
          return total + (state.answers[question.id] === expected[question.id] ? 1 : 0);
        }, 0);
        feedback.textContent = "预测得分 " + score + "/" + questions.length + "。现在改变 N 与探测效率，观察理想优势是否留下。";
        feedback.className = "pqo-feedback " + (score === questions.length ? "pqo-pass" : "pqo-warn");
      }
    }

    function renderResults() {
      var data = experiment(state);
      clear(results);
      var layout = element(api, "div", { className: "pqo-layout" });
      var controls = element(api, "div", { className: "pqo-controls" });
      [
        ["photons", "光子数 N", 100, 100000, 100, "", 0],
        ["efficiency", "探测效率 η", .5, 1, .01, "", 2]
      ].forEach(function (spec) {
        var control = element(api, "div", { className: "pqo-control" });
        var label = element(api, "label", { htmlFor: "pqo-" + spec[0], text: spec[1] + "：" });
        var output = element(api, "output", { text: fmt(state[spec[0]], spec[6]) + (spec[0] === "efficiency" ? "" : "") });
        label.appendChild(output);
        var input = element(api, "input", { id: "pqo-" + spec[0], type: "range", min: spec[2], max: spec[3], step: spec[4], value: state[spec[0]], "aria-label": spec[1] });
        input.addEventListener("input", function () {
          state[spec[0]] = Number(input.value);
          renderResults();
        });
        control.appendChild(label);
        control.appendChild(input);
        controls.appendChild(control);
      });
      var resource = element(api, "div", { className: "pqo-control" });
      resource.appendChild(element(api, "label", { htmlFor: "pqo-resource", text: "当前资源：" }));
      var select = element(api, "select", { id: "pqo-resource", "aria-label": "当前资源" });
      [["coherent", "相干态 / SQL"], ["ideal", "理想无损纠缠"], ["loss", "损耗后的可用资源"]].forEach(function (choice) {
        select.appendChild(element(api, "option", { value: choice[0], text: choice[1] }));
      });
      select.value = state.resource;
      select.addEventListener("change", function () {
        state.resource = select.value;
        renderResults();
      });
      resource.appendChild(select);
      controls.appendChild(resource);
      controls.appendChild(element(api, "p", { className: "pqo-note", text: "损耗底为教学代理：实际优势需要用具体态、测量和 Fisher 信息重新验证。" }));
      var stage = element(api, "div", { className: "pqo-stage" });
      var frame = element(api, "div", { className: "pqo-frame" });
      frame.appendChild(buildChart(api, data));
      stage.appendChild(frame);
      layout.appendChild(controls);
      layout.appendChild(stage);
      results.appendChild(layout);
      var metrics = element(api, "div", { className: "pqo-metrics" });
      appendMetric(api, metrics, "有效光子数", fmt(data.effectivePhotons, 0));
      appendMetric(api, metrics, "SQL", sci(data.sql) + " rad");
      appendMetric(api, metrics, "理想 1/N", sci(data.heisenberg) + " rad");
      appendMetric(api, metrics, "损耗底", sci(data.lossFloor) + " rad");
      appendMetric(api, metrics, "当前资源", sci(data.uncertainty) + " rad");
      appendMetric(api, metrics, "计数 SNR（探测后）", fmt(data.snr, 1));
      results.appendChild(metrics);
      var table = element(api, "table", { "aria-label": "量子光学资源账本" });
      var head = element(api, "tr");
      ["资源", "标度/结果", "边界"].forEach(function (label) { head.appendChild(element(api, "th", { scope: "col", text: label })); });
      table.appendChild(element(api, "thead", {}, [head]));
      var body = element(api, "tbody");
      [
        ["相干态", "Δφ∼N⁻¹ᐟ²", "泊松方差 Var(N)=N"],
        ["理想纠缠", "Δφ∼N⁻¹", "无损、理想测量上界"],
        ["损耗代理", sci(data.lossFloor), "η 与 N 都必须进入预算"],
        ["当前", data.resource === "coherent" ? "SQL" : data.resource === "ideal" ? "理想纠缠" : "损耗底", "不是具体协议保证"]
      ].forEach(function (row) {
        var tr = element(api, "tr");
        row.forEach(function (value) { tr.appendChild(element(api, "td", { text: value })); });
        body.appendChild(tr);
      });
      table.appendChild(body);
      results.appendChild(table);
      results.appendChild(element(api, "p", { className: "pqo-interpretation", text: data.resource === "ideal"
        ? "当前显示的是理想无损纠缠曲线；把 η 降低或把损耗资源切换进来，才能检验这个优势是否仍超过系统噪声底。"
        : data.resource === "loss"
          ? "当前损耗底已经抬高不确定度；增加有效光子或提高探测效率，比重复宣称理想 1/N 更接近工程动作。"
          : "当前是相干态 SQL 基线；它不需要纠缠制备，却清楚显示收集更多光子只能按平方根改善。" }));
    }

    check.addEventListener("click", function () {
      if (check.disabled) return;
      state.revealed = true;
      results.hidden = false;
      renderGate();
      renderResults();
      if (api.announce) api.announce(root, "量子光学预测已核对，标度曲线与损耗账本已展开。");
    });
    reset.addEventListener("click", function () {
      state.revealed = false;
      state.answers = {};
      results.hidden = true;
      renderGate();
    });
    renderGate();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }
    var data = experiment(DEFAULT);
    assert(near(data.sql, .01), "SQL");
    assert(near(data.heisenberg, .0001), "Heisenberg proxy");
    assert(near(data.lossFloor, .005), "loss floor");
    assert(near(data.effectivePhotons, 8000), "detected photon count");
    assert(near(data.snr, Math.sqrt(8000)), "detected Poisson SNR");
    assert(experiment({ photons: 10000, efficiency: .5, resource: "loss" }).lossFloor > data.lossFloor, "efficiency penalty");
    assert(experiment({ photons: 100000, efficiency: .8, resource: "coherent" }).sql < data.sql, "more photons lower SQL");
    return { checks: checks };
  }

  return {
    experiment: experiment,
    mount: mount,
    selfTest: selfTest
  };
});
