(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("photo-fiber-modes", exported.mount);
  }
  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log("photo-fiber-modes self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("photo-fiber-modes self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var STYLE_ID = "cl-photo-fiber-modes-styles";
  var DEFAULT = { radius: 4, na: .14, wavelength: 1550, profile: "step", length: 1 };
  var C_KM_S = 299792.458;

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function near(left, right, tolerance) {
    return Math.abs(left - right) <= (tolerance || 1e-9) * Math.max(1, Math.abs(left), Math.abs(right));
  }

  function normalizedV(radius, na, wavelength) {
    return 2 * Math.PI * radius * na / (wavelength / 1000);
  }

  function modeCount(v) {
    return v < 2.405 ? 1 : Math.max(2, Math.round(v * v / 2));
  }

  function modalSpreadNsPerKm(na, profile) {
    var step = na * na / (2 * 1.45 * C_KM_S) * 1e9;
    return step * (profile === "graded" ? .08 : 1);
  }

  function experiment(options) {
    var radius = clamp(Number(options.radius), 2, 35);
    var na = clamp(Number(options.na), .08, .25);
    var wavelength = clamp(Number(options.wavelength), 850, 1700);
    var profile = options.profile === "graded" ? "graded" : "step";
    var length = clamp(Number(options.length), .1, 10);
    var v = normalizedV(radius, na, wavelength);
    var modes = modeCount(v);
    var single = v < 2.405;
    var spread = single ? 0 : modalSpreadNsPerKm(na, profile) * length;
    return {
      radius: radius,
      na: na,
      wavelength: wavelength,
      profile: profile,
      length: length,
      v: v,
      modes: modes,
      single: single,
      spread: spread,
      risk: v < 2.405 ? "无模间色散" : profile === "graded" ? "GI 压低模间展宽" : "阶跃型路径差明显"
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
      ".pfm-lab{--pfm-blue:var(--cl-blue,#315f9d);--pfm-gold:var(--cl-gold,#9b6a12);--pfm-red:var(--cl-red,#b64335);--pfm-green:var(--cl-green,#39734d);max-width:100%;min-width:0;color:var(--fg);line-height:1.55}.pfm-lab *{box-sizing:border-box}.pfm-lab h3,.pfm-lab h4{margin:0}.pfm-lab h3{font-size:1.18rem}.pfm-lab h4{margin-top:14px;font-size:1rem}.pfm-lab p{margin:.65em 0}.pfm-lab .pfm-note,.pfm-lab .pfm-feedback{color:var(--fg-soft);font-size:13px;line-height:1.6;overflow-wrap:anywhere}.pfm-lab .pfm-prompt{margin:14px 0;padding:12px 14px;border-left:3px solid var(--pfm-gold);background:var(--bg)}",
      ".pfm-lab fieldset{min-width:0;margin:0 0 11px;padding:0;border:0}.pfm-lab legend{margin-bottom:7px;color:var(--fg);font-size:13px;font-weight:750;line-height:1.5}.pfm-lab .pfm-choice-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.pfm-lab button,.pfm-lab select,.pfm-lab input{font:inherit;letter-spacing:0}.pfm-lab button,.pfm-lab select{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;line-height:1.35;overflow-wrap:anywhere}.pfm-lab select{width:100%}.pfm-lab button:hover{border-color:var(--accent)}.pfm-lab button[aria-pressed=true],.pfm-lab button.pfm-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:700}.pfm-lab button:disabled{cursor:not-allowed;opacity:.55}.pfm-lab button:focus-visible,.pfm-lab select:focus-visible,.pfm-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.pfm-lab .pfm-actions{display:flex;flex-wrap:wrap;gap:8px}.pfm-lab .pfm-actions>*{flex:1 1 160px}.pfm-lab .pfm-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.pfm-lab .pfm-pass{color:var(--pfm-green)}.pfm-lab .pfm-warn{color:var(--pfm-red)}",
      ".pfm-lab .pfm-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.pfm-lab .pfm-layout{display:grid;grid-template-columns:minmax(210px,.72fr) minmax(0,1.28fr);gap:14px;align-items:start}.pfm-lab .pfm-controls,.pfm-lab .pfm-stage{min-width:0}.pfm-lab .pfm-controls{display:grid;gap:11px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg)}.pfm-lab .pfm-control{display:grid;gap:5px}.pfm-lab .pfm-control label{color:var(--fg-soft);font-size:13px;font-weight:700}.pfm-lab .pfm-control output{color:var(--accent);font-variant-numeric:tabular-nums}.pfm-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent)}.pfm-lab .pfm-scale{display:flex;justify-content:space-between;color:var(--fg-soft);font-size:11px}.pfm-lab .pfm-mode-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.pfm-lab .pfm-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden}.pfm-lab svg{display:block;width:100%;height:auto;color:var(--fg)}.pfm-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.pfm-lab .pfm-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin:11px 0}.pfm-lab .pfm-metric{min-width:0;padding:8px;border-top:2px solid var(--border);background:var(--bg)}.pfm-lab .pfm-metric:nth-child(3n+1){border-top-color:var(--pfm-blue)}.pfm-lab .pfm-metric:nth-child(3n+2){border-top-color:var(--pfm-gold)}.pfm-lab .pfm-metric:nth-child(3n){border-top-color:var(--pfm-red)}.pfm-lab .pfm-metric span{display:block;color:var(--fg-soft);font-size:11.5px}.pfm-lab .pfm-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.pfm-lab table{width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.pfm-lab th,.pfm-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}.pfm-lab th{color:var(--fg-soft);font-weight:750}.pfm-lab .pfm-interpretation{margin:11px 0 0;padding:10px 12px;border-left:3px solid var(--pfm-green);background:var(--bg);font-size:13px;line-height:1.65;overflow-wrap:anywhere}",
      "@media(max-width:820px){.pfm-lab .pfm-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:560px){.pfm-lab .pfm-choice-grid,.pfm-lab .pfm-mode-row{grid-template-columns:minmax(0,1fr)}.pfm-lab .pfm-frame{padding:5px}.pfm-lab th,.pfm-lab td{padding-left:5px;padding-right:5px}}@media(prefers-reduced-motion:reduce){.pfm-lab *{scroll-behavior:auto!important;transition:none!important;animation:none!important}}"
    ].join("");
    style.textContent += ".pfm-lab .pfm-core{fill:var(--pfm-blue);fill-opacity:.22;stroke:var(--pfm-blue);stroke-width:2}.pfm-lab .pfm-cladding{fill:none;stroke:var(--pfm-gold);stroke-width:2;stroke-dasharray:5 4}.pfm-lab .pfm-grid{stroke:var(--border);stroke-width:1;opacity:.72}.pfm-lab .pfm-axis{stroke:var(--fg-soft);stroke-width:1.2}.pfm-lab .pfm-cutoff{stroke:var(--pfm-red);stroke-width:2;stroke-dasharray:6 4}.pfm-lab .pfm-single-bar,.pfm-lab .pfm-gi-bar{fill:var(--pfm-green)}.pfm-lab .pfm-multi-bar,.pfm-lab .pfm-step-bar{fill:var(--pfm-red)}.pfm-lab .pfm-point{fill:var(--pfm-gold);stroke:var(--bg);stroke-width:2}";
    (doc.head || doc.documentElement).appendChild(style);
  }

  function buildDiagram(api, data) {
    var svg = svgElement(api, "svg", {
      viewBox: "0 0 720 280",
      role: "img",
      "aria-label": "光纤归一化频率、截止线和模间展宽"
    });
    svg.appendChild(svgElement(api, "title", {}, "V 数与导模状态"));
    var left = 48, top = 30, right = 690, bottom = 218;
    var radius = 74;
    svg.appendChild(svgElement(api, "circle", { cx: 105, cy: 126, r: radius, "class": "pfm-core" }));
    svg.appendChild(svgElement(api, "circle", { cx: 105, cy: 126, r: radius + 15, "class": "pfm-cladding" }));
    svg.appendChild(svgElement(api, "text", { x: 105, y: 122, "text-anchor": "middle", "font-size": 13 }, "纤芯"));
    svg.appendChild(svgElement(api, "text", { x: 105, y: 142, "text-anchor": "middle", "font-size": 11 }, "a=" + fmt(data.radius, 1) + " μm"));
    var barLeft = 220, barRight = 686;
    var vMax = 45;
    var xMap = function (value) { return barLeft + clamp(value, 0, vMax) / vMax * (barRight - barLeft); };
    [0, 2.405, 10, 20, 30, 40].forEach(function (value) {
      var x = xMap(value);
      svg.appendChild(svgElement(api, "line", { x1: x, y1: top, x2: x, y2: bottom, "class": "pfm-grid" }));
      svg.appendChild(svgElement(api, "text", { x: x, y: bottom + 20, "text-anchor": "middle", "font-size": 11 }, String(value)));
    });
    svg.appendChild(svgElement(api, "line", { x1: barLeft, y1: bottom, x2: barRight, y2: bottom, "class": "pfm-axis" }));
    svg.appendChild(svgElement(api, "line", { x1: xMap(2.405), y1: top, x2: xMap(2.405), y2: bottom, "class": "pfm-cutoff" }));
    svg.appendChild(svgElement(api, "text", { x: xMap(2.405) + 5, y: top + 14, "font-size": 11 }, "2.405 截止"));
    svg.appendChild(svgElement(api, "rect", { x: barLeft, y: 78, width: Math.max(0, xMap(data.v) - barLeft), height: 30, "class": data.single ? "pfm-single-bar" : "pfm-multi-bar" }));
    svg.appendChild(svgElement(api, "circle", { cx: xMap(data.v), cy: 93, r: 6, "class": "pfm-point" }));
    svg.appendChild(svgElement(api, "text", { x: barLeft, y: 64, "font-size": 12 }, "V=" + fmt(data.v, 2) + "，约 " + data.modes + " 个模式"));
    var spreadScale = 60;
    var spreadWidth = clamp(data.spread * spreadScale, 4, 230);
    svg.appendChild(svgElement(api, "text", { x: barLeft, y: 150, "font-size": 12 }, fmt(data.length, 1) + " km 教学展宽代理：" + fmt(data.spread, 3) + " ns"));
    svg.appendChild(svgElement(api, "rect", { x: barLeft, y: 166, width: spreadWidth, height: 24, "class": data.profile === "graded" ? "pfm-gi-bar" : "pfm-step-bar" }));
    svg.appendChild(svgElement(api, "text", { x: barLeft + spreadWidth + 8, y: 183, "font-size": 11 }, data.profile === "graded" ? "渐变折射率" : "阶跃折射率"));
    svg.appendChild(svgElement(api, "text", { x: right, y: 254, "text-anchor": "end", "font-size": 11 }, "V = 2πa·NA/λ"));
    return svg;
  }

  function appendMetric(api, parent, label, value) {
    parent.appendChild(element(api, "div", { className: "pfm-metric" }, [
      element(api, "span", { text: label }),
      element(api, "strong", { text: value })
    ]));
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    installStyles(doc);
    var state = {
      radius: DEFAULT.radius,
      na: DEFAULT.na,
      wavelength: DEFAULT.wavelength,
      profile: DEFAULT.profile,
      length: DEFAULT.length,
      revealed: false,
      answers: {}
    };
    var shell = element(api, "div", { className: "pfm-lab" });
    shell.appendChild(element(api, "h3", { text: "V 数探针：一根光纤支持多少条模态路径？" }));
    shell.appendChild(element(api, "p", { className: "pfm-note", text: "先用截止值判断，再改变纤芯半径、NA、波长和折射率剖面；模式数不是容量，模间到达时间才是系统风险。" }));
    var gate = element(api, "div", { className: "pfm-prompt" });
    var questions = [
      { id: "cutoff", title: "V<2.405 的直接结论是什么？", choices: [["single", "只有基模"], ["all", "所有色散消失"]] },
      { id: "direction", title: "在其他量不变时，把 a 或 NA 调大，V 怎样变化？", choices: [["up", "增大，更容易进入多模"], ["down", "减小，更容易单模"]] },
      { id: "graded", title: "渐变折射率为什么能压低模间展宽？", choices: [["speed", "外圈在低折射率区传播得更快"], ["same", "所有模式走同样的几何路径"]] }
    ];
    var questionButtons = {};
    questions.forEach(function (question) {
      var field = element(api, "fieldset");
      field.appendChild(element(api, "legend", { text: question.title }));
      var choices = element(api, "div", { className: "pfm-choice-grid" });
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
    var actions = element(api, "div", { className: "pfm-actions" });
    var check = element(api, "button", { type: "button", className: "pfm-primary", text: "核对预测" });
    var reset = element(api, "button", { type: "button", text: "重置预测" });
    var feedback = element(api, "p", { className: "pfm-feedback", "aria-live": "polite" });
    actions.appendChild(check);
    actions.appendChild(reset);
    gate.appendChild(actions);
    gate.appendChild(feedback);
    shell.appendChild(gate);
    var results = element(api, "div", { className: "pfm-results" });
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
        feedback.textContent = complete ? "预测已记录，点击“核对预测”查看 V 数与展宽。" : "请先回答三个判断。";
        feedback.className = "pfm-feedback";
      } else {
        var expected = { cutoff: "single", direction: "up", graded: "speed" };
        var score = questions.reduce(function (total, question) {
          return total + (state.answers[question.id] === expected[question.id] ? 1 : 0);
        }, 0);
        feedback.textContent = "预测得分 " + score + "/" + questions.length + "。现在看截止线与折射率剖面，而不是只看光斑大小。";
        feedback.className = "pfm-feedback " + (score === questions.length ? "pfm-pass" : "pfm-warn");
      }
    }

    function renderResults() {
      var data = experiment(state);
      clear(results);
      var layout = element(api, "div", { className: "pfm-layout" });
      var controls = element(api, "div", { className: "pfm-controls" });
      [
        ["radius", "纤芯半径", 2, 30, .5, " μm", 1],
        ["na", "数值孔径 NA", .08, .25, .01, "", 2],
        ["length", "传播长度", .1, 10, .1, " km", 1]
      ].forEach(function (spec) {
        var control = element(api, "div", { className: "pfm-control" });
        var label = element(api, "label", { htmlFor: "pfm-" + spec[0], text: spec[1] + "：" });
        var output = element(api, "output", { text: fmt(state[spec[0]], spec[6]) + spec[5] });
        label.appendChild(output);
        var input = element(api, "input", {
          id: "pfm-" + spec[0],
          type: "range",
          min: spec[2],
          max: spec[3],
          step: spec[4],
          value: state[spec[0]],
          "aria-label": spec[1]
        });
        input.addEventListener("input", function () {
          state[spec[0]] = Number(input.value);
          renderResults();
        });
        control.appendChild(label);
        control.appendChild(input);
        controls.appendChild(control);
      });
      var wavelengthControl = element(api, "div", { className: "pfm-control" });
      wavelengthControl.appendChild(element(api, "label", { htmlFor: "pfm-wavelength", text: "波长：" }));
      var wavelength = element(api, "select", { id: "pfm-wavelength", "aria-label": "波长" });
      [850, 1310, 1550].forEach(function (value) {
        wavelength.appendChild(element(api, "option", { value: value, text: value + " nm" }));
      });
      wavelength.value = String(state.wavelength);
      wavelength.addEventListener("change", function () {
        state.wavelength = Number(wavelength.value);
        renderResults();
      });
      wavelengthControl.appendChild(wavelength);
      controls.appendChild(wavelengthControl);
      var modeControl = element(api, "div", { className: "pfm-control" });
      modeControl.appendChild(element(api, "span", { className: "pfm-note", text: "折射率剖面" }));
      var modeRow = element(api, "div", { className: "pfm-mode-row" });
      [["step", "阶跃"], ["graded", "渐变 GI"]].forEach(function (choice) {
        var button = element(api, "button", { type: "button", text: choice[1], "aria-pressed": state.profile === choice[0] ? "true" : "false" });
        button.addEventListener("click", function () {
          state.profile = choice[0];
          renderResults();
        });
        modeRow.appendChild(button);
      });
      modeControl.appendChild(modeRow);
      controls.appendChild(modeControl);
      var stage = element(api, "div", { className: "pfm-stage" });
      var frame = element(api, "div", { className: "pfm-frame" });
      frame.appendChild(buildDiagram(api, data));
      stage.appendChild(frame);
      layout.appendChild(controls);
      layout.appendChild(stage);
      results.appendChild(layout);
      var metrics = element(api, "div", { className: "pfm-metrics" });
      appendMetric(api, metrics, "V 数", fmt(data.v, 3));
      appendMetric(api, metrics, "模式数代理", data.modes === 1 ? "1（单模）" : String(data.modes));
      appendMetric(api, metrics, "单模判断", data.single ? "通过" : "越过截止");
      appendMetric(api, metrics, "长度展宽代理", fmt(data.spread, 3) + " ns");
      results.appendChild(metrics);
      var table = element(api, "table", { "aria-label": "V 数与模态状态" });
      var head = element(api, "tr");
      ["量", "当前值", "读法"].forEach(function (label) { head.appendChild(element(api, "th", { scope: "col", text: label })); });
      table.appendChild(element(api, "thead", {}, [head]));
      var body = element(api, "tbody");
      [
        ["V", fmt(data.v, 3), "2.405 以下只有基模"],
        ["M", data.modes === 1 ? "1" : "约 " + data.modes, data.modes === 1 ? "不产生模间色散" : "模式路径不同"],
        ["剖面", data.profile === "graded" ? "GI" : "阶跃", data.profile === "graded" ? "外圈模式在低 n 区更快" : "路径差直接累积"],
        ["风险", data.risk, "还需另算材料/波导/偏振色散"]
      ].forEach(function (row) {
        var tr = element(api, "tr");
        row.forEach(function (value) { tr.appendChild(element(api, "td", { text: value })); });
        body.appendChild(tr);
      });
      table.appendChild(body);
      results.appendChild(table);
      results.appendChild(element(api, "p", { className: "pfm-interpretation", text: data.single
        ? "当前 V 数在单模窗口内，但这只消除了模间色散；材料色散、波导色散和 PMD 仍然需要单独补偿。"
        : data.profile === "graded"
          ? "当前进入多模区；渐变折射率把路径差转成速度差，能压低展宽，但不能把多模光纤当作单模光纤。"
          : "当前进入阶跃型多模区；不同模式的路径长度直接转化为脉冲展宽，短距之外要认真核对带宽预算。" }));
    }

    check.addEventListener("click", function () {
      if (check.disabled) return;
      state.revealed = true;
      results.hidden = false;
      renderGate();
      renderResults();
      if (api.announce) api.announce(root, "光纤模态预测已核对，V 数与展宽账本已展开。");
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
    var single = experiment(DEFAULT);
    var five = experiment({ radius: 5, na: .14, wavelength: 1550, profile: "step", length: 1 });
    var large = experiment({ radius: 25, na: .20, wavelength: 850, profile: "step", length: 1 });
    assert(near(single.v, 2.271, 1e-3), "default V");
    assert(single.single && single.modes === 1, "default single-mode state");
    assert(single.spread === 0, "single-mode modal spread is zero");
    assert(five.v > 2.405 && five.modes > 1, "cutoff crossing");
    assert(five.spread > 0, "multimode spread is nonzero");
    assert(near(large.modes, 683, .01), "multimode count proxy");
    assert(experiment({ radius: 25, na: .20, wavelength: 850, profile: "graded", length: 1 }).spread < large.spread, "GI reduces modal spread proxy");
    return { checks: checks };
  }

  return {
    normalizedV: normalizedV,
    modeCount: modeCount,
    experiment: experiment,
    mount: mount,
    selfTest: selfTest
  };
});
