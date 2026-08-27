(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("photo-metasurface", exported.mount);
  }
  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log("photo-metasurface self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("photo-metasurface self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var STYLE_ID = "cl-photo-metasurface-styles";
  var DEFAULT = { wavelength: 550, period: 800, rotation: 30, polarization: "matched" };

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function near(left, right, tolerance) {
    return Math.abs(left - right) <= (tolerance || 1e-9) * Math.max(1, Math.abs(left), Math.abs(right));
  }

  function deflectionDeg(wavelength, period) {
    var ratio = Number(wavelength) / Number(period);
    if (!finite(ratio) || Math.abs(ratio) > 1) return NaN;
    return Math.asin(ratio) * 180 / Math.PI;
  }

  function experiment(options) {
    var wavelength = clamp(Number(options.wavelength), 450, 750);
    var period = clamp(Number(options.period), 500, 1200);
    var rotation = clamp(Number(options.rotation), 0, 180);
    var polarization = options.polarization === "unmatched" ? "unmatched" : "matched";
    var deflection = deflectionDeg(wavelength, period);
    var propagating = finite(deflection);
    var referenceDeflection = deflectionDeg(550, period);
    var pbPhase = (2 * rotation) % 360;
    var chromatic = propagating && finite(referenceDeflection) ? deflection - referenceDeflection : NaN;
    var efficiency = !propagating ? 0 : polarization === "matched"
      ? clamp(.82 - .16 * Math.abs(wavelength - 550) / 200 - .08 * Math.abs(period - 800) / 400, .2, .85)
      : .12;
    return {
      wavelength: wavelength,
      period: period,
      rotation: rotation,
      polarization: polarization,
      deflection: deflection,
      pbPhase: pbPhase,
      chromatic: chromatic,
      efficiency: efficiency,
      propagating: propagating,
      grade: !propagating ? "一级衍射不传播（λ>p）" : polarization === "matched" ? "目标偏振通道" : "偏振不匹配，功能通道受损"
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
      ".pms-lab{--pms-blue:var(--cl-blue,#315f9d);--pms-gold:var(--cl-gold,#9b6a12);--pms-red:var(--cl-red,#b64335);--pms-green:var(--cl-green,#39734d);max-width:100%;min-width:0;color:var(--fg);line-height:1.55}.pms-lab *{box-sizing:border-box}.pms-lab h3{margin:0;font-size:1.18rem}.pms-lab p{margin:.65em 0}.pms-lab .pms-note,.pms-lab .pms-feedback{color:var(--fg-soft);font-size:13px;line-height:1.6;overflow-wrap:anywhere}.pms-lab .pms-prompt{margin:14px 0;padding:12px 14px;border-left:3px solid var(--pms-gold);background:var(--bg)}.pms-lab fieldset{min-width:0;margin:0 0 11px;padding:0;border:0}.pms-lab legend{margin-bottom:7px;color:var(--fg);font-size:13px;font-weight:750;line-height:1.5}.pms-lab .pms-choice-grid,.pms-lab .pms-mode-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.pms-lab button,.pms-lab select,.pms-lab input{font:inherit;letter-spacing:0}.pms-lab button,.pms-lab select{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;line-height:1.35;overflow-wrap:anywhere}.pms-lab select{width:100%}.pms-lab button:hover{border-color:var(--accent)}.pms-lab button[aria-pressed=true],.pms-lab button.pms-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:700}.pms-lab button:disabled{cursor:not-allowed;opacity:.55}.pms-lab button:focus-visible,.pms-lab select:focus-visible,.pms-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.pms-lab .pms-actions{display:flex;flex-wrap:wrap;gap:8px}.pms-lab .pms-actions>*{flex:1 1 160px}.pms-lab .pms-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.pms-lab .pms-pass{color:var(--pms-green)}.pms-lab .pms-warn{color:var(--pms-red)}",
      ".pms-lab .pms-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.pms-lab .pms-layout{display:grid;grid-template-columns:minmax(210px,.72fr) minmax(0,1.28fr);gap:14px;align-items:start}.pms-lab .pms-controls,.pms-lab .pms-stage{min-width:0}.pms-lab .pms-controls{display:grid;gap:11px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg)}.pms-lab .pms-control{display:grid;gap:5px}.pms-lab .pms-control label,.pms-lab .pms-control-title{color:var(--fg-soft);font-size:13px;font-weight:700}.pms-lab .pms-control output{color:var(--accent);font-variant-numeric:tabular-nums}.pms-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent)}.pms-lab .pms-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden}.pms-lab svg{display:block;width:100%;height:auto;color:var(--fg)}.pms-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.pms-lab .pms-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin:11px 0}.pms-lab .pms-metric{min-width:0;padding:8px;border-top:2px solid var(--border);background:var(--bg)}.pms-lab .pms-metric:nth-child(4n+1){border-top-color:var(--pms-blue)}.pms-lab .pms-metric:nth-child(4n+2){border-top-color:var(--pms-gold)}.pms-lab .pms-metric:nth-child(4n+3){border-top-color:var(--pms-red)}.pms-lab .pms-metric:nth-child(4n){border-top-color:var(--pms-green)}.pms-lab .pms-metric span{display:block;color:var(--fg-soft);font-size:11.5px}.pms-lab .pms-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.pms-lab table{width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.pms-lab th,.pms-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}.pms-lab th{color:var(--fg-soft);font-weight:750}.pms-lab .pms-interpretation{margin:11px 0 0;padding:10px 12px;border-left:3px solid var(--pms-green);background:var(--bg);font-size:13px;line-height:1.65;overflow-wrap:anywhere}",
      "@media(max-width:820px){.pms-lab .pms-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:560px){.pms-lab .pms-choice-grid,.pms-lab .pms-mode-row{grid-template-columns:minmax(0,1fr)}.pms-lab .pms-frame{padding:5px}.pms-lab th,.pms-lab td{padding-left:5px;padding-right:5px}}@media(prefers-reduced-motion:reduce){.pms-lab *{scroll-behavior:auto!important;transition:none!important;animation:none!important}}"
    ].join("");
    style.textContent += ".pms-lab .pms-cell{fill:var(--pms-blue);fill-opacity:.7;stroke:var(--pms-blue);stroke-width:1}.pms-lab .pms-cell-alt{fill:var(--pms-gold);fill-opacity:.72;stroke:var(--pms-gold);stroke-width:1}.pms-lab .pms-axis{stroke:var(--fg-soft);stroke-width:1.2}.pms-lab .pms-wave{stroke:var(--pms-green);stroke-width:3;stroke-linecap:round}.pms-lab .pms-arrow{fill:var(--pms-green);stroke:var(--pms-green)}";
    (doc.head || doc.documentElement).appendChild(style);
  }

  function buildDiagram(api, data) {
    var svg = svgElement(api, "svg", {
      viewBox: "0 0 720 300",
      role: "img",
      "aria-label": "超表面离散相位、偏转角和几何相位"
    });
    svg.appendChild(svgElement(api, "title", {}, "相位梯度与几何相位"));
    var left = 50, y = 110, cellWidth = 72;
    for (var index = 0; index < 8; index += 1) {
      var phase = index / 8 * 2 * Math.PI;
      var height = 30 + index * 8;
      svg.appendChild(svgElement(api, "rect", { x: left + index * cellWidth, y: y - height, width: cellWidth - 3, height: height, "class": index % 2 ? "pms-cell-alt" : "pms-cell" }));
      svg.appendChild(svgElement(api, "text", { x: left + index * cellWidth + cellWidth / 2, y: y + 20, "text-anchor": "middle", "font-size": 10 }, fmt(phase / Math.PI, 1) + "π"));
    }
    svg.appendChild(svgElement(api, "line", { x1: left, y1: y, x2: left + cellWidth * 8 - 3, y2: y, "class": "pms-axis" }));
    svg.appendChild(svgElement(api, "text", { x: left, y: 30, "font-size": 12 }, "一个周期内的离散相位阶梯：0 → 2π"));
    var arrowX = 95, arrowY = 208;
    svg.appendChild(svgElement(api, "line", { x1: arrowX, y1: arrowY, x2: arrowX + 450, y2: arrowY, "class": "pms-wave" }));
    svg.appendChild(svgElement(api, "polygon", { points: (arrowX + 450) + "," + arrowY + " " + (arrowX + 436) + "," + (arrowY - 7) + " " + (arrowX + 436) + "," + (arrowY + 7), "class": "pms-arrow" }));
    svg.appendChild(svgElement(api, "text", { x: arrowX, y: 190, "font-size": 12 }, "λ=" + fmt(data.wavelength, 0) + " nm，p=" + fmt(data.period, 0) + " nm"));
    var angleLabel = data.propagating ? "θ=" + fmt(data.deflection, 1) + "°" : "θ：一级衍射不传播";
    svg.appendChild(svgElement(api, "text", { x: arrowX, y: 250, "font-size": 12 }, angleLabel + "；PB 相位=" + fmt(data.pbPhase, 0) + "°；" + data.grade));
    svg.appendChild(svgElement(api, "text", { x: 670, y: 282, "text-anchor": "end", "font-size": 11 }, "教学效率代理：" + fmt(data.efficiency * 100, 1) + "%"));
    return svg;
  }

  function appendMetric(api, parent, label, value) {
    parent.appendChild(element(api, "div", { className: "pms-metric" }, [
      element(api, "span", { text: label }),
      element(api, "strong", { text: value })
    ]));
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    installStyles(doc);
    var state = {
      wavelength: DEFAULT.wavelength,
      period: DEFAULT.period,
      rotation: DEFAULT.rotation,
      polarization: DEFAULT.polarization,
      revealed: false,
      answers: {}
    };
    var shell = element(api, "div", { className: "pms-lab" });
    shell.appendChild(element(api, "h3", { text: "超表面相位：平面单元如何把光偏转？" }));
    shell.appendChild(element(api, "p", { className: "pms-note", text: "这是一个固定空间相位梯度的教学模型；先预测波长、旋转角和偏振的影响，再查看离散相位状态。" }));
    var gate = element(api, "div", { className: "pms-prompt" });
    var questions = [
      { id: "wavelength", title: "固定 p 时，波长从 550 nm 增至 650 nm，一级偏转角怎样？", choices: [["up", "增大"], ["down", "减小"]] },
      { id: "pb", title: "各向异性单元旋转 90°，PB 相位增加多少？", choices: [["pi", "180°（π）"], ["ninety", "90°（π/2）"]] },
      { id: "bandwidth", title: "大口径、高 NA、宽带消色差同时要求时，主要受什么限制？", choices: [["delay", "有限群延迟与效率/制造约束"], ["none", "没有共同限制"]] }
    ];
    var questionButtons = {};
    questions.forEach(function (question) {
      var field = element(api, "fieldset");
      field.appendChild(element(api, "legend", { text: question.title }));
      var choices = element(api, "div", { className: "pms-choice-grid" });
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
    var actions = element(api, "div", { className: "pms-actions" });
    var check = element(api, "button", { type: "button", className: "pms-primary", text: "核对预测" });
    var reset = element(api, "button", { type: "button", text: "重置预测" });
    var feedback = element(api, "p", { className: "pms-feedback", "aria-live": "polite" });
    actions.appendChild(check);
    actions.appendChild(reset);
    gate.appendChild(actions);
    gate.appendChild(feedback);
    shell.appendChild(gate);
    var results = element(api, "div", { className: "pms-results" });
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
        feedback.textContent = complete ? "预测已记录，点击“核对预测”展开相位梯度。" : "请先回答三个判断。";
        feedback.className = "pms-feedback";
      } else {
        var expected = { wavelength: "up", pb: "pi", bandwidth: "delay" };
        var score = questions.reduce(function (total, question) {
          return total + (state.answers[question.id] === expected[question.id] ? 1 : 0);
        }, 0);
        feedback.textContent = "预测得分 " + score + "/" + questions.length + "。现在改变波长、周期和偏振匹配。";
        feedback.className = "pms-feedback " + (score === questions.length ? "pms-pass" : "pms-warn");
      }
    }

    function renderResults() {
      var data = experiment(state);
      clear(results);
      var layout = element(api, "div", { className: "pms-layout" });
      var controls = element(api, "div", { className: "pms-controls" });
      [
        ["wavelength", "波长", 450, 750, 10, " nm", 0],
        ["period", "梯度周期", 500, 1200, 10, " nm", 0],
        ["rotation", "单元旋转角", 0, 180, 5, "°", 0]
      ].forEach(function (spec) {
        var control = element(api, "div", { className: "pms-control" });
        var label = element(api, "label", { htmlFor: "pms-" + spec[0], text: spec[1] + "：" });
        var output = element(api, "output", { text: fmt(state[spec[0]], spec[6]) + spec[5] });
        label.appendChild(output);
        var input = element(api, "input", { id: "pms-" + spec[0], type: "range", min: spec[2], max: spec[3], step: spec[4], value: state[spec[0]], "aria-label": spec[1] });
        input.addEventListener("input", function () {
          state[spec[0]] = Number(input.value);
          renderResults();
        });
        control.appendChild(label);
        control.appendChild(input);
        controls.appendChild(control);
      });
      var polarization = element(api, "div", { className: "pms-control" });
      polarization.appendChild(element(api, "span", { className: "pms-control-title", text: "入射偏振" }));
      var select = element(api, "select", { "aria-label": "入射偏振" });
      select.appendChild(element(api, "option", { value: "matched", text: "匹配目标圆偏振" }));
      select.appendChild(element(api, "option", { value: "unmatched", text: "偏振不匹配" }));
      select.value = state.polarization;
      select.addEventListener("change", function () {
        state.polarization = select.value;
        renderResults();
      });
      polarization.appendChild(select);
      controls.appendChild(polarization);
      controls.appendChild(element(api, "p", { className: "pms-note", text: "效率为教学代理：它显式惩罚偏振不匹配与偏离默认设计点，不代表具体器件实测值。" }));
      var stage = element(api, "div", { className: "pms-stage" });
      var frame = element(api, "div", { className: "pms-frame" });
      frame.appendChild(buildDiagram(api, data));
      stage.appendChild(frame);
      layout.appendChild(controls);
      layout.appendChild(stage);
      results.appendChild(layout);
      var metrics = element(api, "div", { className: "pms-metrics" });
      appendMetric(api, metrics, "一级偏转角", data.propagating ? fmt(data.deflection, 2) + "°" : "不传播");
      appendMetric(api, metrics, "PB 相位", fmt(data.pbPhase, 0) + "°");
      appendMetric(api, metrics, "相对 550 nm 色差", fmt(data.chromatic, 2) + "°");
      appendMetric(api, metrics, "效率教学代理", fmt(data.efficiency * 100, 1) + "%");
      appendMetric(api, metrics, "周期", fmt(data.period, 0) + " nm");
      results.appendChild(metrics);
      var table = element(api, "table", { "aria-label": "超表面相位账本" });
      var head = element(api, "tr");
      ["项", "当前值", "读法"].forEach(function (label) { head.appendChild(element(api, "th", { scope: "col", text: label })); });
      table.appendChild(element(api, "thead", {}, [head]));
      var body = element(api, "tbody");
      [
        ["空间梯度", "2π/" + fmt(data.period, 0), data.propagating ? "固定周期换波长会改变偏转角" : "λ>p，一级衍射没有实数偏转角"],
        ["几何相位", "2α=" + fmt(data.pbPhase, 0) + "°", "只在目标偏振通道按此读法"],
        ["群延迟", "dφ/dω", "消色差需要额外自由度"],
        ["偏振状态", data.grade, "不匹配会降低有效通道"]
      ].forEach(function (row) {
        var tr = element(api, "tr");
        row.forEach(function (value) { tr.appendChild(element(api, "td", { text: value })); });
        body.appendChild(tr);
      });
      table.appendChild(body);
      results.appendChild(table);
      results.appendChild(element(api, "p", { className: "pms-interpretation", text: !data.propagating
        ? "当前 λ>p，一级衍射没有可传播的实数角度；不能把数值截到 90° 当作有效出射。"
        : Math.abs(data.chromatic) > 5
          ? "当前波长已经让固定相位梯度产生明显色散：单波长功能成立，不等于宽带共焦。"
          : "当前波长接近默认设计点；仍要把口径、NA、效率和制造误差加入真实验收。" }));
    }

    check.addEventListener("click", function () {
      if (check.disabled) return;
      state.revealed = true;
      results.hidden = false;
      renderGate();
      renderResults();
      if (api.announce) api.announce(root, "超表面预测已核对，相位梯度账本已展开。");
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
    assert(near(data.deflection, 43.4325, 1e-4), "550 nm deflection");
    assert(near(deflectionDeg(650, 800), 54.3409, 1e-4), "650 nm deflection");
    assert(data.pbPhase === 60, "PB phase");
    assert(experiment({ wavelength: 550, period: 800, rotation: 30, polarization: "unmatched" }).efficiency < data.efficiency, "polarization penalty");
    assert(deflectionDeg(650, 800) > data.deflection, "wavelength increases angle");
    assert(!finite(deflectionDeg(750, 500)), "non-propagating first order is not clamped to 90 degrees");
    assert(experiment({ wavelength: 750, period: 500, rotation: 30, polarization: "matched" }).efficiency === 0, "non-propagating order has no functional efficiency");
    return { checks: checks };
  }

  return {
    deflectionDeg: deflectionDeg,
    experiment: experiment,
    mount: mount,
    selfTest: selfTest
  };
});
