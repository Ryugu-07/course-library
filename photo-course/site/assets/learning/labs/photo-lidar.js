(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("photo-lidar", exported.mount);
  }
  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log("photo-lidar self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("photo-lidar self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var STYLE_ID = "cl-photo-lidar-styles";
  var DEFAULT = { mode: "dtof", range: 100, timingPs: 67, slope: 1, velocity: 10 };
  var C = 299792458;
  var LAMBDA_M = 1550e-9;

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
    var mode = options.mode === "fmcw" ? "fmcw" : "dtof";
    var range = clamp(Number(options.range), 10, 300);
    var timingPs = clamp(Number(options.timingPs), 10, 200);
    var slope = clamp(Number(options.slope), .5, 2);
    var velocity = clamp(Number(options.velocity), -20, 20);
    var roundTripUs = 2 * range / C * 1e6;
    var rangeNoiseM = C * timingPs * 1e-12 / 2;
    var beatHz = 2 * slope * 1e14 * range / C;
    var dopplerHz = 2 * velocity / LAMBDA_M;
    return {
      mode: mode,
      range: range,
      timingPs: timingPs,
      slope: slope,
      velocity: velocity,
      roundTripUs: roundTripUs,
      rangeNoiseM: rangeNoiseM,
      rangeNoiseCm: rangeNoiseM * 100,
      beatHz: beatHz,
      beatMHz: beatHz / 1e6,
      dopplerHz: dopplerHz,
      dopplerMHz: dopplerHz / 1e6,
      observation: mode === "dtof" ? "时间峰" : "距离拍频 + 多普勒"
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
      ".pld-lab{--pld-blue:var(--cl-blue,#315f9d);--pld-gold:var(--cl-gold,#9b6a12);--pld-red:var(--cl-red,#b64335);--pld-green:var(--cl-green,#39734d);max-width:100%;min-width:0;color:var(--fg);line-height:1.55}.pld-lab *{box-sizing:border-box}.pld-lab h3{margin:0;font-size:1.18rem}.pld-lab p{margin:.65em 0}.pld-lab .pld-note,.pld-lab .pld-feedback{color:var(--fg-soft);font-size:13px;line-height:1.6;overflow-wrap:anywhere}.pld-lab .pld-prompt{margin:14px 0;padding:12px 14px;border-left:3px solid var(--pld-gold);background:var(--bg)}.pld-lab fieldset{min-width:0;margin:0 0 11px;padding:0;border:0}.pld-lab legend{margin-bottom:7px;color:var(--fg);font-size:13px;font-weight:750;line-height:1.5}.pld-lab .pld-choice-grid,.pld-lab .pld-mode-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.pld-lab button,.pld-lab select,.pld-lab input{font:inherit;letter-spacing:0}.pld-lab button,.pld-lab select{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;line-height:1.35;overflow-wrap:anywhere}.pld-lab select{width:100%}.pld-lab button:hover{border-color:var(--accent)}.pld-lab button[aria-pressed=true],.pld-lab button.pld-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:700}.pld-lab button:disabled{cursor:not-allowed;opacity:.55}.pld-lab button:focus-visible,.pld-lab select:focus-visible,.pld-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.pld-lab .pld-actions{display:flex;flex-wrap:wrap;gap:8px}.pld-lab .pld-actions>*{flex:1 1 160px}.pld-lab .pld-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.pld-lab .pld-pass{color:var(--pld-green)}.pld-lab .pld-warn{color:var(--pld-red)}",
      ".pld-lab .pld-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.pld-lab .pld-layout{display:grid;grid-template-columns:minmax(210px,.72fr) minmax(0,1.28fr);gap:14px;align-items:start}.pld-lab .pld-controls,.pld-lab .pld-stage{min-width:0}.pld-lab .pld-controls{display:grid;gap:11px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg)}.pld-lab .pld-control{display:grid;gap:5px}.pld-lab .pld-control label,.pld-lab .pld-control-title{color:var(--fg-soft);font-size:13px;font-weight:700}.pld-lab .pld-control output{color:var(--accent);font-variant-numeric:tabular-nums}.pld-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent)}.pld-lab .pld-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden}.pld-lab svg{display:block;width:100%;height:auto;color:var(--fg)}.pld-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.pld-lab .pld-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin:11px 0}.pld-lab .pld-metric{min-width:0;padding:8px;border-top:2px solid var(--border);background:var(--bg)}.pld-lab .pld-metric:nth-child(4n+1){border-top-color:var(--pld-blue)}.pld-lab .pld-metric:nth-child(4n+2){border-top-color:var(--pld-gold)}.pld-lab .pld-metric:nth-child(4n+3){border-top-color:var(--pld-red)}.pld-lab .pld-metric:nth-child(4n){border-top-color:var(--pld-green)}.pld-lab .pld-metric span{display:block;color:var(--fg-soft);font-size:11.5px}.pld-lab .pld-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.pld-lab table{width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.pld-lab th,.pld-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}.pld-lab th{color:var(--fg-soft);font-weight:750}.pld-lab .pld-interpretation{margin:11px 0 0;padding:10px 12px;border-left:3px solid var(--pld-green);background:var(--bg);font-size:13px;line-height:1.65;overflow-wrap:anywhere}",
      "@media(max-width:820px){.pld-lab .pld-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:560px){.pld-lab .pld-choice-grid,.pld-lab .pld-mode-row{grid-template-columns:minmax(0,1fr)}.pld-lab .pld-frame{padding:5px}.pld-lab th,.pld-lab td{padding-left:5px;padding-right:5px}}@media(prefers-reduced-motion:reduce){.pld-lab *{scroll-behavior:auto!important;transition:none!important;animation:none!important}}"
    ].join("");
    style.textContent += ".pld-lab .pld-axis{stroke:var(--fg-soft);stroke-width:1.2}.pld-lab .pld-pulse{stroke:var(--pld-blue);stroke-width:5;stroke-linecap:round}.pld-lab .pld-echo{stroke:var(--pld-gold);stroke-width:5;stroke-linecap:round}.pld-lab .pld-beat{stroke:var(--pld-green);stroke-width:5;stroke-linecap:round}.pld-lab .pld-doppler{stroke:var(--pld-red);stroke-width:5;stroke-linecap:round}";
    (doc.head || doc.documentElement).appendChild(style);
  }

  function buildDiagram(api, data) {
    var svg = svgElement(api, "svg", {
      viewBox: "0 0 720 290",
      role: "img",
      "aria-label": data.mode === "dtof" ? "dToF 脉冲和回波时间线" : "FMCW 距离拍频和多普勒频移"
    });
    svg.appendChild(svgElement(api, "title", {}, data.mode === "dtof" ? "dToF 时间测距" : "FMCW 相干拍频"));
    if (data.mode === "dtof") {
      var left = 60, right = 670, y = 126;
      svg.appendChild(svgElement(api, "line", { x1: left, y1: y, x2: right, y2: y, "class": "pld-axis" }));
      svg.appendChild(svgElement(api, "line", { x1: left + 30, y1: 78, x2: left + 30, y2: 174, "class": "pld-pulse" }));
      var returnX = left + 30 + Math.min(500, data.roundTripUs / 2 * 500);
      svg.appendChild(svgElement(api, "line", { x1: returnX, y1: 78, x2: returnX, y2: 174, "class": "pld-echo" }));
      svg.appendChild(svgElement(api, "text", { x: left + 30, y: 62, "text-anchor": "middle", "font-size": 12 }, "发射"));
      svg.appendChild(svgElement(api, "text", { x: returnX, y: 62, "text-anchor": "middle", "font-size": 12 }, "回波"));
      svg.appendChild(svgElement(api, "text", { x: (left + 30 + returnX) / 2, y: 110, "text-anchor": "middle", "font-size": 12 }, "Δt=" + fmt(data.roundTripUs, 3) + " μs"));
      svg.appendChild(svgElement(api, "text", { x: left, y: 218, "font-size": 12 }, "时间抖动 " + fmt(data.timingPs, 0) + " ps → 距离噪声 " + fmt(data.rangeNoiseCm, 2) + " cm"));
      svg.appendChild(svgElement(api, "text", { x: right, y: 258, "text-anchor": "end", "font-size": 11 }, "R=cΔt/2；往返路径带来 1/2"));
    } else {
      var fLeft = 70, fRight = 665, base = 210;
      svg.appendChild(svgElement(api, "line", { x1: fLeft, y1: base, x2: fRight, y2: base, "class": "pld-axis" }));
      var scale = 3.2;
      var beatX = fLeft + Math.min(fRight - fLeft - 30, data.beatMHz * scale);
      var dopplerX = fLeft + Math.min(fRight - fLeft - 30, Math.abs(data.dopplerMHz) * scale);
      svg.appendChild(svgElement(api, "line", { x1: beatX, y1: base, x2: beatX, y2: 82, "class": "pld-beat" }));
      svg.appendChild(svgElement(api, "line", { x1: dopplerX, y1: base, x2: dopplerX, y2: 118, "class": "pld-doppler" }));
      svg.appendChild(svgElement(api, "text", { x: beatX, y: 67, "text-anchor": "middle", "font-size": 12 }, "f_b=" + fmt(data.beatMHz, 1) + " MHz"));
      svg.appendChild(svgElement(api, "text", { x: dopplerX, y: 104, "text-anchor": "middle", "font-size": 12 }, "f_D=" + fmt(data.dopplerMHz, 1) + " MHz"));
      svg.appendChild(svgElement(api, "text", { x: fLeft, y: 246, "font-size": 12 }, "S=" + fmt(data.slope, 1) + "×10¹⁴ Hz/s；R=" + fmt(data.range, 0) + " m；v=" + fmt(data.velocity, 1) + " m/s"));
      svg.appendChild(svgElement(api, "text", { x: fRight, y: 276, "text-anchor": "end", "font-size": 11 }, "拍频给距离，多普勒给速度"));
    }
    return svg;
  }

  function appendMetric(api, parent, label, value) {
    parent.appendChild(element(api, "div", { className: "pld-metric" }, [
      element(api, "span", { text: label }),
      element(api, "strong", { text: value })
    ]));
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    installStyles(doc);
    var state = {
      mode: DEFAULT.mode,
      range: DEFAULT.range,
      timingPs: DEFAULT.timingPs,
      slope: DEFAULT.slope,
      velocity: DEFAULT.velocity,
      revealed: false,
      answers: {}
    };
    var shell = element(api, "div", { className: "pld-lab" });
    shell.appendChild(element(api, "h3", { text: "LiDAR 观测量：时间峰还是相干频谱？" }));
    shell.appendChild(element(api, "p", { className: "pld-note", text: "先预测 1 cm 所需计时精度，再比较 dToF 的时间门和 FMCW 的距离/速度拍频；两者不是同一条测量链。" }));
    var gate = element(api, "div", { className: "pld-prompt" });
    var questions = [
      { id: "time", title: "1 cm 距离变化对应的 dToF 往返时间约是多少？", choices: [["ps67", "约 67 ps"], ["ns67", "约 67 ns"]] },
      { id: "slope", title: "FMCW 调频斜率 S 增大时，固定距离的拍频怎样？", choices: [["up", "线性增大"], ["same", "不变，距离已固定"]] },
      { id: "coherent", title: "FMCW 相干接收抑制环境光依赖什么？", choices: [["local", "只有与本振相干的分量形成拍频"], ["power", "把所有背景光都放大"]] }
    ];
    var questionButtons = {};
    questions.forEach(function (question) {
      var field = element(api, "fieldset");
      field.appendChild(element(api, "legend", { text: question.title }));
      var choices = element(api, "div", { className: "pld-choice-grid" });
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
    var actions = element(api, "div", { className: "pld-actions" });
    var check = element(api, "button", { type: "button", className: "pld-primary", text: "核对预测" });
    var reset = element(api, "button", { type: "button", text: "重置预测" });
    var feedback = element(api, "p", { className: "pld-feedback", "aria-live": "polite" });
    actions.appendChild(check);
    actions.appendChild(reset);
    gate.appendChild(actions);
    gate.appendChild(feedback);
    shell.appendChild(gate);
    var results = element(api, "div", { className: "pld-results" });
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
        feedback.textContent = complete ? "预测已记录，点击“核对预测”展开时间线或频谱。" : "请先回答三个判断。";
        feedback.className = "pld-feedback";
      } else {
        var expected = { time: "ps67", slope: "up", coherent: "local" };
        var score = questions.reduce(function (total, question) {
          return total + (state.answers[question.id] === expected[question.id] ? 1 : 0);
        }, 0);
        feedback.textContent = "预测得分 " + score + "/" + questions.length + "。现在切换 dToF/FMCW 并改变观测条件。";
        feedback.className = "pld-feedback " + (score === questions.length ? "pld-pass" : "pld-warn");
      }
    }

    function renderResults() {
      var data = experiment(state);
      clear(results);
      var layout = element(api, "div", { className: "pld-layout" });
      var controls = element(api, "div", { className: "pld-controls" });
      var modeControl = element(api, "div", { className: "pld-control" });
      modeControl.appendChild(element(api, "span", { className: "pld-control-title", text: "测距路线" }));
      var modeRow = element(api, "div", { className: "pld-mode-row" });
      [["dtof", "dToF"], ["fmcw", "FMCW"]].forEach(function (choice) {
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
        ["range", "目标距离", 10, 300, 10, " m", 0],
        ["timingPs", "dToF 时间抖动", 10, 200, 1, " ps", 0],
        ["slope", "FMCW 斜率", .5, 2, .1, " ×10¹⁴ Hz/s", 1],
        ["velocity", "目标速度", -20, 20, 1, " m/s", 0]
      ].forEach(function (spec) {
        var control = element(api, "div", { className: "pld-control" });
        var label = element(api, "label", { htmlFor: "pld-" + spec[0], text: spec[1] + "：" });
        var output = element(api, "output", { text: fmt(state[spec[0]], spec[6]) + spec[5] });
        label.appendChild(output);
        var input = element(api, "input", { id: "pld-" + spec[0], type: "range", min: spec[2], max: spec[3], step: spec[4], value: state[spec[0]], "aria-label": spec[1] });
        input.addEventListener("input", function () {
          state[spec[0]] = Number(input.value);
          renderResults();
        });
        control.appendChild(label);
        control.appendChild(input);
        controls.appendChild(control);
      });
      var stage = element(api, "div", { className: "pld-stage" });
      var frame = element(api, "div", { className: "pld-frame" });
      frame.appendChild(buildDiagram(api, data));
      stage.appendChild(frame);
      layout.appendChild(controls);
      layout.appendChild(stage);
      results.appendChild(layout);
      var metrics = element(api, "div", { className: "pld-metrics" });
      appendMetric(api, metrics, "往返时间", fmt(data.roundTripUs, 3) + " μs");
      appendMetric(api, metrics, "dToF 距离噪声", fmt(data.rangeNoiseCm, 2) + " cm");
      appendMetric(api, metrics, "FMCW 拍频", fmt(data.beatMHz, 2) + " MHz");
      appendMetric(api, metrics, "多普勒", fmt(data.dopplerMHz, 2) + " MHz");
      appendMetric(api, metrics, "当前观测", data.observation);
      results.appendChild(metrics);
      var table = element(api, "table", { "aria-label": "LiDAR 观测量账本" });
      var head = element(api, "tr");
      ["观测量", "数值", "物理来源"].forEach(function (label) { head.appendChild(element(api, "th", { scope: "col", text: label })); });
      table.appendChild(element(api, "thead", {}, [head]));
      var body = element(api, "tbody");
      [
        ["dToF 时间", fmt(data.roundTripUs, 3) + " μs", "2R/c"],
        ["dToF 误差", fmt(data.rangeNoiseCm, 2) + " cm", "cσt/2"],
        ["FMCW 距离", fmt(data.beatMHz, 2) + " MHz", "2SR/c"],
        ["FMCW 速度", fmt(data.dopplerMHz, 2) + " MHz", "2v/λ"]
      ].forEach(function (row) {
        var tr = element(api, "tr");
        row.forEach(function (value) { tr.appendChild(element(api, "td", { text: value })); });
        body.appendChild(tr);
      });
      table.appendChild(body);
      results.appendChild(table);
      results.appendChild(element(api, "p", { className: "pld-interpretation", text: data.mode === "dtof"
        ? "dToF 的证据是时间峰；提高 TDC 精度能降低距离噪声，但多径、脉冲宽度和背景光仍可能产生错误峰。"
        : "FMCW 的证据是相干频谱；距离和速度可同时出现，但扫频线性、采样带宽与距离—速度耦合必须进入校准。" }));
    }

    check.addEventListener("click", function () {
      if (check.disabled) return;
      state.revealed = true;
      results.hidden = false;
      renderGate();
      renderResults();
      if (api.announce) api.announce(root, "LiDAR 预测已核对，时间线或拍频账本已展开。");
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
    assert(near(data.rangeNoiseCm, 1.0043, 1e-3), "67 ps gives about 1 cm");
    assert(near(data.roundTripUs, .667128, 1e-4), "100 m round trip");
    assert(near(data.beatMHz, 66.7128, 1e-3), "FMCW beat");
    assert(near(data.dopplerMHz, 12.9032, 1e-3), "Doppler shift");
    assert(experiment({ mode: "fmcw", range: 100, timingPs: 67, slope: 2, velocity: 10 }).beatHz > data.beatHz, "slope increases beat");
    return { checks: checks };
  }

  return {
    experiment: experiment,
    mount: mount,
    selfTest: selfTest
  };
});
