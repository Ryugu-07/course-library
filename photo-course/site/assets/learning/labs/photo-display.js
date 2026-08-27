(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("photo-display", exported.mount);
  }
  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log("photo-display self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("photo-display self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var STYLE_ID = "cl-photo-display-styles";
  var DEFAULT = { mode: "microled", aperture: 80, zones: 1000, pixels: 25000000, yieldPercent: 99.99, brightness: 100 };

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
    var mode = ["lcd", "oled", "microled"].indexOf(options.mode) >= 0 ? options.mode : "microled";
    var aperture = clamp(Number(options.aperture), 50, 100);
    var zones = clamp(Math.round(Number(options.zones)), 100, 10000);
    var pixels = clamp(Math.round(Number(options.pixels) / 1000000) * 1000000, 1000000, 25000000);
    var yieldPercent = clamp(Number(options.yieldPercent), 99.9, 99.9999);
    var brightness = clamp(Number(options.brightness), 50, 150);
    var lcdEfficiency = .5 * (1 / 3) * aperture / 100;
    var halo = Math.min(1, 3 / Math.sqrt(zones));
    var blueStress = brightness / 100;
    var defects = pixels * (1 - yieldPercent / 100);
    var noDefectLog10 = pixels * Math.log10(Math.max(yieldPercent / 100, 1e-12));
    return {
      mode: mode,
      aperture: aperture,
      zones: zones,
      pixels: pixels,
      yieldPercent: yieldPercent,
      brightness: brightness,
      lcdEfficiency: lcdEfficiency,
      halo: halo,
      blueStress: blueStress,
      defects: defects,
      noDefectLog10: noDefectLog10,
      black: mode === "oled" ? 0 : mode === "lcd" ? 1 / (zones + 1) : 0,
      headline: mode === "lcd"
        ? "偏振与滤色损失"
        : mode === "oled"
          ? "蓝色退化与亮度寿命"
          : "巨量转移良率"
    };
  }

  function fmt(value, digits) {
    if (!finite(value)) return "—";
    var places = digits === undefined ? 2 : Number(digits);
    var text = value.toFixed(places);
    return places === 0 ? text : text.replace(/0+$/, "").replace(/\.$/, "");
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
      ".pds-lab{--pds-blue:var(--cl-blue,#315f9d);--pds-gold:var(--cl-gold,#9b6a12);--pds-red:var(--cl-red,#b64335);--pds-green:var(--cl-green,#39734d);max-width:100%;min-width:0;color:var(--fg);line-height:1.55}.pds-lab *{box-sizing:border-box}.pds-lab h3{margin:0;font-size:1.18rem}.pds-lab p{margin:.65em 0}.pds-lab .pds-note,.pds-lab .pds-feedback{color:var(--fg-soft);font-size:13px;line-height:1.6;overflow-wrap:anywhere}.pds-lab .pds-prompt{margin:14px 0;padding:12px 14px;border-left:3px solid var(--pds-gold);background:var(--bg)}.pds-lab fieldset{min-width:0;margin:0 0 11px;padding:0;border:0}.pds-lab legend{margin-bottom:7px;color:var(--fg);font-size:13px;font-weight:750;line-height:1.5}.pds-lab .pds-choice-grid,.pds-lab .pds-mode-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.pds-lab button,.pds-lab input{font:inherit;letter-spacing:0}.pds-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;line-height:1.35;overflow-wrap:anywhere}.pds-lab button:hover{border-color:var(--accent)}.pds-lab button[aria-pressed=true],.pds-lab button.pds-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:700}.pds-lab button:disabled{cursor:not-allowed;opacity:.55}.pds-lab button:focus-visible,.pds-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.pds-lab .pds-actions{display:flex;flex-wrap:wrap;gap:8px}.pds-lab .pds-actions>*{flex:1 1 160px}.pds-lab .pds-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.pds-lab .pds-pass{color:var(--pds-green)}.pds-lab .pds-warn{color:var(--pds-red)}",
      ".pds-lab .pds-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.pds-lab .pds-layout{display:grid;grid-template-columns:minmax(210px,.72fr) minmax(0,1.28fr);gap:14px;align-items:start}.pds-lab .pds-controls,.pds-lab .pds-stage{min-width:0}.pds-lab .pds-controls{display:grid;gap:11px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg)}.pds-lab .pds-control{display:grid;gap:5px}.pds-lab .pds-control label,.pds-lab .pds-control-title{color:var(--fg-soft);font-size:13px;font-weight:700}.pds-lab .pds-control output{color:var(--accent);font-variant-numeric:tabular-nums}.pds-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent)}.pds-lab .pds-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden}.pds-lab svg{display:block;width:100%;height:auto;color:var(--fg)}.pds-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.pds-lab .pds-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin:11px 0}.pds-lab .pds-metric{min-width:0;padding:8px;border-top:2px solid var(--border);background:var(--bg)}.pds-lab .pds-metric:nth-child(4n+1){border-top-color:var(--pds-blue)}.pds-lab .pds-metric:nth-child(4n+2){border-top-color:var(--pds-gold)}.pds-lab .pds-metric:nth-child(4n+3){border-top-color:var(--pds-red)}.pds-lab .pds-metric:nth-child(4n){border-top-color:var(--pds-green)}.pds-lab .pds-metric span{display:block;color:var(--fg-soft);font-size:11.5px}.pds-lab .pds-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.pds-lab table{width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.pds-lab th,.pds-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}.pds-lab th{color:var(--fg-soft);font-weight:750}.pds-lab .pds-interpretation{margin:11px 0 0;padding:10px 12px;border-left:3px solid var(--pds-green);background:var(--bg);font-size:13px;line-height:1.65;overflow-wrap:anywhere}",
      "@media(max-width:820px){.pds-lab .pds-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:560px){.pds-lab .pds-choice-grid,.pds-lab .pds-mode-row{grid-template-columns:minmax(0,1fr)}.pds-lab .pds-frame{padding:5px}.pds-lab th,.pds-lab td{padding-left:5px;padding-right:5px}}@media(prefers-reduced-motion:reduce){.pds-lab *{scroll-behavior:auto!important;transition:none!important;animation:none!important}}"
    ].join("");
    style.textContent += ".pds-lab .pds-layer{stroke:var(--pds-blue);stroke-width:1}.pds-lab .pds-layer-0{fill:var(--pds-blue);fill-opacity:.22}.pds-lab .pds-layer-1{fill:var(--pds-gold);fill-opacity:.28}.pds-lab .pds-layer-2{fill:var(--pds-red);fill-opacity:.28}.pds-lab .pds-efficiency{fill:var(--pds-green)}.pds-lab .pds-oled{fill:var(--pds-green);fill-opacity:.62;stroke:var(--pds-green);stroke-width:1.5}.pds-lab .pds-stress{fill:var(--pds-red)}.pds-lab .pds-good{fill:var(--pds-green)}.pds-lab .pds-defect{fill:var(--pds-red)}";
    (doc.head || doc.documentElement).appendChild(style);
  }

  function buildDiagram(api, data) {
    var svg = svgElement(api, "svg", {
      viewBox: "0 0 720 290",
      role: "img",
      "aria-label": "显示路线的能量链、黑电平和 microLED 转移良率"
    });
    svg.appendChild(svgElement(api, "title", {}, "显示路线瓶颈账本"));
    var left = 58, barWidth = 590;
    svg.appendChild(svgElement(api, "text", { x: left, y: 28, "font-size": 12 }, "路线：" + data.headline));
    if (data.mode === "lcd") {
      var widths = [.5, 1 / 3, data.aperture / 100];
      var labels = ["起偏器 50%", "RGB 1/3", "开口率 " + fmt(data.aperture, 0) + "%"];
      var x = left;
      widths.forEach(function (value, index) {
        var width = barWidth * value;
        svg.appendChild(svgElement(api, "rect", { x: x, y: 70, width: width, height: 42, "class": "pds-layer pds-layer-" + index }));
        svg.appendChild(svgElement(api, "text", { x: x + width / 2, y: 96, "text-anchor": "middle", "font-size": 11 }, labels[index]));
        x += width;
      });
      svg.appendChild(svgElement(api, "text", { x: left, y: 150, "font-size": 12 }, "背光透过代理：" + fmt(data.lcdEfficiency * 100, 1) + "%"));
      svg.appendChild(svgElement(api, "rect", { x: left, y: 168, width: barWidth * data.lcdEfficiency, height: 24, "class": "pds-efficiency" }));
      svg.appendChild(svgElement(api, "text", { x: left, y: 226, "font-size": 12 }, "分区 " + data.zones + "：黑电平代理 " + fmt(data.black * 100, 2) + "%，halo 代理 " + fmt(data.halo * 100, 1) + "%"));
    } else if (data.mode === "oled") {
      svg.appendChild(svgElement(api, "rect", { x: left, y: 70, width: barWidth, height: 62, "class": "pds-oled" }));
      svg.appendChild(svgElement(api, "text", { x: left + barWidth / 2, y: 107, "text-anchor": "middle", "font-size": 13 }, "像素电流 → 自发光"));
      svg.appendChild(svgElement(api, "text", { x: left, y: 168, "font-size": 12 }, "关断像素黑电平：" + fmt(data.black, 2) + "；蓝色退化压力代理：" + fmt(data.blueStress, 2)));
      svg.appendChild(svgElement(api, "rect", { x: left, y: 188, width: barWidth * Math.min(1, data.blueStress / 1.5), height: 24, "class": "pds-stress" }));
      svg.appendChild(svgElement(api, "text", { x: left, y: 252, "font-size": 12 }, "亮度提高会加速寿命损失；这是材料边界，不是背光效率问题"));
    } else {
      var good = barWidth * data.yieldPercent / 100;
      svg.appendChild(svgElement(api, "rect", { x: left, y: 70, width: good, height: 42, "class": "pds-good" }));
      svg.appendChild(svgElement(api, "rect", { x: left + good, y: 70, width: Math.max(2, barWidth - good), height: 42, "class": "pds-defect" }));
      svg.appendChild(svgElement(api, "text", { x: left, y: 145, "font-size": 12 }, "单颗良率：" + fmt(data.yieldPercent, 4) + "%"));
      svg.appendChild(svgElement(api, "text", { x: left, y: 171, "font-size": 12 }, "像素数：" + fmt(data.pixels / 1000000, 1) + " M；期望坏点：" + fmt(data.defects, 0)));
      svg.appendChild(svgElement(api, "text", { x: left, y: 211, "font-size": 12 }, "log10 P(零坏点)：" + fmt(data.noDefectLog10, 1)));
      svg.appendChild(svgElement(api, "text", { x: left, y: 252, "font-size": 12 }, "独立缺陷教学模型：检测与修复仍是量产环节"));
    }
    return svg;
  }

  function appendMetric(api, parent, label, value) {
    parent.appendChild(element(api, "div", { className: "pds-metric" }, [
      element(api, "span", { text: label }),
      element(api, "strong", { text: value })
    ]));
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    installStyles(doc);
    var state = {
      mode: DEFAULT.mode,
      aperture: DEFAULT.aperture,
      zones: DEFAULT.zones,
      pixels: DEFAULT.pixels,
      yieldPercent: DEFAULT.yieldPercent,
      brightness: DEFAULT.brightness,
      revealed: false,
      answers: {}
    };
    var shell = element(api, "div", { className: "pds-lab" });
    shell.appendChild(element(api, "h3", { text: "显示路线：一个指标变好，另一个边界就出现" }));
    shell.appendChild(element(api, "p", { className: "pds-note", text: "先比较 LCD 的能量链、OLED 的自发光和 microLED 的良率统计；数字是透明的教学模型，不是面板规格。" }));
    var gate = element(api, "div", { className: "pds-prompt" });
    var questions = [
      { id: "lcd", title: "LCD 的起偏器、RGB 滤光片和 80% 开口率相乘后约剩多少？", choices: [["thirteen", "约 13.3%"], ["eighty", "仍有 80%"]] },
      { id: "yield", title: "2500 万颗、99.99% 单颗良率的 microLED 期望坏点是多少？", choices: [["2500", "约 2500 颗"], ["250", "约 250 颗"]] },
      { id: "black", title: "分区背光能把 LCD 黑电平变为严格的零吗？", choices: [["halo", "不能；亮暗相邻会产生 halo"], ["zero", "能；分区越多就严格为零"]] }
    ];
    var questionButtons = {};
    questions.forEach(function (question) {
      var field = element(api, "fieldset");
      field.appendChild(element(api, "legend", { text: question.title }));
      var choices = element(api, "div", { className: "pds-choice-grid" });
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
    var actions = element(api, "div", { className: "pds-actions" });
    var check = element(api, "button", { type: "button", className: "pds-primary", text: "核对预测" });
    var reset = element(api, "button", { type: "button", text: "重置预测" });
    var feedback = element(api, "p", { className: "pds-feedback", "aria-live": "polite" });
    actions.appendChild(check);
    actions.appendChild(reset);
    gate.appendChild(actions);
    gate.appendChild(feedback);
    shell.appendChild(gate);
    var results = element(api, "div", { className: "pds-results" });
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
        feedback.textContent = complete ? "预测已记录，点击“核对预测”查看路线账本。" : "请先回答三个判断。";
        feedback.className = "pds-feedback";
      } else {
        var expected = { lcd: "thirteen", yield: "2500", black: "halo" };
        var score = questions.reduce(function (total, question) {
          return total + (state.answers[question.id] === expected[question.id] ? 1 : 0);
        }, 0);
        feedback.textContent = "预测得分 " + score + "/" + questions.length + "。现在切换路线，观察问题如何迁移。";
        feedback.className = "pds-feedback " + (score === questions.length ? "pds-pass" : "pds-warn");
      }
    }

    function renderResults() {
      var data = experiment(state);
      clear(results);
      var layout = element(api, "div", { className: "pds-layout" });
      var controls = element(api, "div", { className: "pds-controls" });
      var modeControl = element(api, "div", { className: "pds-control" });
      modeControl.appendChild(element(api, "span", { className: "pds-control-title", text: "显示路线" }));
      var modeRow = element(api, "div", { className: "pds-mode-row" });
      [["lcd", "LCD"], ["oled", "OLED"], ["microled", "microLED"]].forEach(function (choice) {
        var button = element(api, "button", { type: "button", text: choice[1], "aria-pressed": state.mode === choice[0] ? "true" : "false" });
        button.addEventListener("click", function () {
          state.mode = choice[0];
          renderResults();
        });
        modeRow.appendChild(button);
      });
      modeControl.appendChild(modeRow);
      controls.appendChild(modeControl);
      [
        ["aperture", "LCD 开口率", 50, 100, 1, "%", 0],
        ["zones", "分区数", 100, 10000, 100, " 区", 0],
        ["pixels", "像素/LED 数量", 1000000, 25000000, 1000000, "", 0],
        ["yieldPercent", "microLED 单颗良率", 99.9, 99.9999, .0001, "%", 4],
        ["brightness", "OLED 亮度相对值", 50, 150, 5, "%", 0]
      ].forEach(function (spec) {
        var control = element(api, "div", { className: "pds-control" });
        var label = element(api, "label", { htmlFor: "pds-" + spec[0], text: spec[1] + "：" });
        var shown = spec[0] === "pixels" ? fmt(state[spec[0]] / 1000000, 0) + " M" : fmt(state[spec[0]], spec[6]) + spec[5];
        var output = element(api, "output", { text: shown });
        label.appendChild(output);
        var input = element(api, "input", { id: "pds-" + spec[0], type: "range", min: spec[2], max: spec[3], step: spec[4], value: state[spec[0]], "aria-label": spec[1] });
        input.addEventListener("input", function () {
          state[spec[0]] = Number(input.value);
          renderResults();
        });
        control.appendChild(label);
        control.appendChild(input);
        controls.appendChild(control);
      });
      var stage = element(api, "div", { className: "pds-stage" });
      var frame = element(api, "div", { className: "pds-frame" });
      frame.appendChild(buildDiagram(api, data));
      stage.appendChild(frame);
      layout.appendChild(controls);
      layout.appendChild(stage);
      results.appendChild(layout);
      var metrics = element(api, "div", { className: "pds-metrics" });
      appendMetric(api, metrics, "LCD 透过代理", fmt(data.lcdEfficiency * 100, 1) + "%");
      appendMetric(api, metrics, "LCD halo 代理", fmt(data.halo * 100, 1) + "%");
      appendMetric(api, metrics, "OLED 黑电平", fmt(data.black, 2));
      appendMetric(api, metrics, "microLED 期望坏点", fmt(data.defects, 0));
      appendMetric(api, metrics, "单颗良率", fmt(data.yieldPercent, 4) + "%");
      appendMetric(api, metrics, "蓝色退化压力", fmt(data.blueStress, 2));
      results.appendChild(metrics);
      var table = element(api, "table", { "aria-label": "显示路线指标表" });
      var head = element(api, "tr");
      ["指标", "当前值", "边界"].forEach(function (label) { head.appendChild(element(api, "th", { scope: "col", text: label })); });
      table.appendChild(element(api, "thead", {}, [head]));
      var body = element(api, "tbody");
      [
        ["能量链", fmt(data.lcdEfficiency * 100, 1) + "%", "LCD 仍需背光与偏振层"],
        ["黑电平", data.mode === "oled" ? "0（理想）" : fmt(data.black * 100, 2) + "%", data.mode === "lcd" ? "局部调光有 halo" : "材料/驱动仍要验证"],
        ["制造统计", fmt(data.defects, 0) + " 个期望坏点", "缺陷不一定独立，必须检测修复"],
        ["路线瓶颈", data.headline, "单一指标不能代表整机体验"]
      ].forEach(function (row) {
        var tr = element(api, "tr");
        row.forEach(function (value) { tr.appendChild(element(api, "td", { text: value })); });
        body.appendChild(tr);
      });
      table.appendChild(body);
      results.appendChild(table);
      results.appendChild(element(api, "p", { className: "pds-interpretation", text: data.mode === "microled"
        ? "当前路线的物理发光属性很强，但 2500 万次转移把微小的单颗失效率放大成面板级维修任务。"
        : data.mode === "oled"
          ? "当前路线用自发光换来黑电平，但蓝色寿命和亮度应力仍是材料退化问题。"
          : "当前路线依靠成熟度与亮度竞争；分区数能改善黑电平代理，却不能让空间上相邻的亮暗完全独立。" }));
    }

    check.addEventListener("click", function () {
      if (check.disabled) return;
      state.revealed = true;
      results.hidden = false;
      renderGate();
      renderResults();
      if (api.announce) api.announce(root, "显示预测已核对，能量链与制造账本已展开。");
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
    assert(near(data.lcdEfficiency, .1333333333, 1e-9), "LCD efficiency chain");
    assert(near(data.defects, 2500), "microLED expected defects");
    assert(data.black === 0, "microLED ideal black");
    assert(experiment({ mode: "oled", aperture: 80, zones: 1000, pixels: 25000000, yieldPercent: 99.99, brightness: 100 }).black === 0, "OLED ideal black");
    assert(experiment({ mode: "lcd", aperture: 80, zones: 1000, pixels: 25000000, yieldPercent: 99.99, brightness: 100 }).halo < 1, "local dimming proxy bounded");
    return { checks: checks };
  }

  return {
    experiment: experiment,
    mount: mount,
    selfTest: selfTest
  };
});
