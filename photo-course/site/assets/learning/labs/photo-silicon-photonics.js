(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("photo-silicon-photonics", exported.mount);
  }
  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log("photo-silicon-photonics self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("photo-silicon-photonics self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var STYLE_ID = "cl-photo-silicon-photonics-styles";
  var DEFAULT = { temperature: 3, q: 10000, armLength: 1, coupling: 0.8, device: "ring" };
  var LAMBDA_NM = 1550;
  var N_EFF = 2.4;
  var DN_DT = 1.8e-4;

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
    var temperature = clamp(Number(options.temperature), -5, 8);
    var q = clamp(Math.round(Number(options.q) / 1000) * 1000, 3000, 20000);
    var armLength = clamp(Number(options.armLength), .3, 3);
    var coupling = clamp(Number(options.coupling), .3, 1);
    var device = options.device === "mzi" ? "mzi" : "ring";
    var shift = LAMBDA_NM * DN_DT * temperature / N_EFF;
    var linewidth = LAMBDA_NM / q;
    var detuningRatio = shift / linewidth;
    var ringTransmission = 1 / (1 + 4 * detuningRatio * detuningRatio);
    var phase = 2 * Math.PI * (armLength * 1000) / 1.55 * DN_DT * temperature;
    var mziOutput = .5 * (1 + Math.sin(phase));
    var coupled = coupling * coupling;
    return {
      temperature: temperature,
      q: q,
      armLength: armLength,
      coupling: coupling,
      device: device,
      shift: shift,
      linewidth: linewidth,
      detuningRatio: detuningRatio,
      ringTransmission: ringTransmission,
      phase: phase,
      mziOutput: mziOutput,
      coupled: coupled,
      verdict: device === "ring"
        ? (Math.abs(detuningRatio) > 1 ? "跨过至少一条线宽，需锁波" : "仍在谐振窗口内")
        : (Math.abs(phase) > Math.PI ? "相位已跨越 π，需校准" : "相位缓慢漂移")
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
      ".psp-lab{--psp-blue:var(--cl-blue,#315f9d);--psp-gold:var(--cl-gold,#9b6a12);--psp-red:var(--cl-red,#b64335);--psp-green:var(--cl-green,#39734d);max-width:100%;min-width:0;color:var(--fg);line-height:1.55}.psp-lab *{box-sizing:border-box}.psp-lab h3{margin:0;font-size:1.18rem}.psp-lab p{margin:.65em 0}.psp-lab .psp-note,.psp-lab .psp-feedback{color:var(--fg-soft);font-size:13px;line-height:1.6;overflow-wrap:anywhere}.psp-lab .psp-prompt{margin:14px 0;padding:12px 14px;border-left:3px solid var(--psp-gold);background:var(--bg)}.psp-lab fieldset{min-width:0;margin:0 0 11px;padding:0;border:0}.psp-lab legend{margin-bottom:7px;color:var(--fg);font-size:13px;font-weight:750;line-height:1.5}.psp-lab .psp-choice-grid,.psp-lab .psp-mode-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.psp-lab button,.psp-lab input{font:inherit;letter-spacing:0}.psp-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;line-height:1.35;overflow-wrap:anywhere}.psp-lab button:hover{border-color:var(--accent)}.psp-lab button[aria-pressed=true],.psp-lab button.psp-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:700}.psp-lab button:disabled{cursor:not-allowed;opacity:.55}.psp-lab button:focus-visible,.psp-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.psp-lab .psp-actions{display:flex;flex-wrap:wrap;gap:8px}.psp-lab .psp-actions>*{flex:1 1 160px}.psp-lab .psp-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.psp-lab .psp-pass{color:var(--psp-green)}.psp-lab .psp-warn{color:var(--psp-red)}",
      ".psp-lab .psp-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.psp-lab .psp-layout{display:grid;grid-template-columns:minmax(210px,.72fr) minmax(0,1.28fr);gap:14px;align-items:start}.psp-lab .psp-controls,.psp-lab .psp-stage{min-width:0}.psp-lab .psp-controls{display:grid;gap:11px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg)}.psp-lab .psp-control{display:grid;gap:5px}.psp-lab .psp-control label,.psp-lab .psp-control-title{color:var(--fg-soft);font-size:13px;font-weight:700}.psp-lab .psp-control output{color:var(--accent);font-variant-numeric:tabular-nums}.psp-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent)}.psp-lab .psp-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden}.psp-lab svg{display:block;width:100%;height:auto;color:var(--fg)}.psp-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.psp-lab .psp-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin:11px 0}.psp-lab .psp-metric{min-width:0;padding:8px;border-top:2px solid var(--border);background:var(--bg)}.psp-lab .psp-metric:nth-child(4n+1){border-top-color:var(--psp-blue)}.psp-lab .psp-metric:nth-child(4n+2){border-top-color:var(--psp-gold)}.psp-lab .psp-metric:nth-child(4n+3){border-top-color:var(--psp-red)}.psp-lab .psp-metric:nth-child(4n){border-top-color:var(--psp-green)}.psp-lab .psp-metric span{display:block;color:var(--fg-soft);font-size:11.5px}.psp-lab .psp-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.psp-lab table{width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.psp-lab th,.psp-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}.psp-lab th{color:var(--fg-soft);font-weight:750}.psp-lab .psp-interpretation{margin:11px 0 0;padding:10px 12px;border-left:3px solid var(--psp-green);background:var(--bg);font-size:13px;line-height:1.65;overflow-wrap:anywhere}",
      "@media(max-width:820px){.psp-lab .psp-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:560px){.psp-lab .psp-choice-grid,.psp-lab .psp-mode-row{grid-template-columns:minmax(0,1fr)}.psp-lab .psp-frame{padding:5px}.psp-lab th,.psp-lab td{padding-left:5px;padding-right:5px}}@media(prefers-reduced-motion:reduce){.psp-lab *{scroll-behavior:auto!important;transition:none!important;animation:none!important}}"
    ].join("");
    style.textContent += ".psp-lab .psp-grid{stroke:var(--border);stroke-width:1;opacity:.72}.psp-lab .psp-axis{stroke:var(--fg-soft);stroke-width:1.5}.psp-lab .psp-ring{fill:none;stroke:var(--psp-blue);stroke-width:3;stroke-linecap:round;stroke-linejoin:round}.psp-lab .psp-marker{stroke:var(--psp-gold);stroke-width:1.5;stroke-dasharray:3 3}.psp-lab .psp-point,.psp-lab .psp-mzi-point{fill:var(--psp-gold);stroke:var(--bg);stroke-width:2}.psp-lab .psp-fiber{fill:var(--psp-gold);fill-opacity:.3;stroke:var(--psp-gold);stroke-width:1.5}.psp-lab .psp-waveguide{fill:var(--psp-blue);stroke:var(--psp-blue)}";
    (doc.head || doc.documentElement).appendChild(style);
  }

  function buildChart(api, data) {
    var svg = svgElement(api, "svg", {
      viewBox: "0 0 720 310",
      role: "img",
      "aria-label": "微环热漂移、MZI 相位和光纤波导耦合尺寸"
    });
    svg.appendChild(svgElement(api, "title", {}, "硅光微环与 MZI 热状态"));
    var left = 52, right = 680, top = 30, bottom = 190;
    var xMap = function (value) { return left + (value + .6) / 1.2 * (right - left); };
    var yMap = function (value) { return bottom - value * (bottom - top); };
    [-.6, -.3, 0, .3, .6].forEach(function (value) {
      var x = xMap(value);
      svg.appendChild(svgElement(api, "line", { x1: x, y1: top, x2: x, y2: bottom, "class": "psp-grid" }));
      svg.appendChild(svgElement(api, "text", { x: x, y: bottom + 20, "text-anchor": "middle", "font-size": 11 }, fmt(value, 1)));
    });
    [0, .5, 1].forEach(function (value) {
      var y = yMap(value);
      svg.appendChild(svgElement(api, "line", { x1: left, y1: y, x2: right, y2: y, "class": "psp-grid" }));
    });
    var points = [];
    for (var index = 0; index <= 80; index += 1) {
      var detuning = -.6 + index * .015;
      points.push({ x: xMap(detuning), y: yMap(1 / (1 + 4 * Math.pow(detuning / data.linewidth, 2))) });
    }
    svg.appendChild(svgElement(api, "path", { d: points.map(function (point, pointIndex) { return (pointIndex ? "L" : "M") + point.x.toFixed(2) + "," + point.y.toFixed(2); }).join(" "), "class": "psp-ring" }));
    svg.appendChild(svgElement(api, "line", { x1: xMap(data.shift), y1: top, x2: xMap(data.shift), y2: bottom, "class": "psp-marker" }));
    svg.appendChild(svgElement(api, "circle", { cx: xMap(data.shift), cy: yMap(data.ringTransmission), r: 5, "class": "psp-point" }));
    svg.appendChild(svgElement(api, "text", { x: right, y: 18, "text-anchor": "end", "font-size": 12 }, "微环：波长偏移（nm）"));
    var phaseX = 100, phaseY = 250, phaseWidth = 230;
    svg.appendChild(svgElement(api, "line", { x1: phaseX, y1: phaseY, x2: phaseX + phaseWidth, y2: phaseY, "class": "psp-axis" }));
    svg.appendChild(svgElement(api, "circle", { cx: phaseX + phaseWidth * (.5 + .5 * Math.sin(data.phase)), cy: phaseY, r: 7, "class": "psp-mzi-point" }));
    svg.appendChild(svgElement(api, "text", { x: phaseX, y: phaseY - 18, "font-size": 11 }, "MZI 输出代理：" + fmt(data.mziOutput, 2) + "，相位 " + fmt(data.phase, 2) + " rad"));
    svg.appendChild(svgElement(api, "text", { x: 420, y: 242, "font-size": 11 }, "光纤模场 10 μm"));
    svg.appendChild(svgElement(api, "rect", { x: 420, y: 250, width: 150, height: 20, "class": "psp-fiber" }));
    svg.appendChild(svgElement(api, "text", { x: 420, y: 295, "font-size": 11 }, "硅波导 0.5 μm"));
    svg.appendChild(svgElement(api, "rect", { x: 420, y: 278, width: 8, height: 12, "class": "psp-waveguide" }));
    return svg;
  }

  function appendMetric(api, parent, label, value) {
    parent.appendChild(element(api, "div", { className: "psp-metric" }, [
      element(api, "span", { text: label }),
      element(api, "strong", { text: value })
    ]));
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    installStyles(doc);
    var state = {
      temperature: DEFAULT.temperature,
      q: DEFAULT.q,
      armLength: DEFAULT.armLength,
      coupling: DEFAULT.coupling,
      device: DEFAULT.device,
      revealed: false,
      answers: {}
    };
    var shell = element(api, "div", { className: "psp-lab" });
    shell.appendChild(element(api, "h3", { text: "片上热账本：微环的紧凑换来多少控制负担？" }));
    shell.appendChild(element(api, "p", { className: "psp-note", text: "先预测 3 K 温漂会跨过几条微环线宽；核对后比较 ring 的窄带响应、MZI 的相位漂移和光纤耦合尺寸差。" }));
    var gate = element(api, "div", { className: "psp-prompt" });
    var questions = [
      { id: "shift", title: "ΔT=3 K、Q=10000 时，微环漂移相对线宽怎样？", choices: [["cross", "约跨过两条线宽"], ["stay", "远小于一条线宽"]] },
      { id: "q", title: "提高 Q 会让同样温漂更容易还是更难跨过线宽？", choices: [["easier", "更容易，线宽更窄"], ["harder", "更难，线宽更宽"]] },
      { id: "mzi", title: "MZI 相对微环的主要工程取舍是什么？", choices: [["area", "占面积但工作窗口更宽"], ["tiny", "更小且不需要温控"]] }
    ];
    var questionButtons = {};
    questions.forEach(function (question) {
      var field = element(api, "fieldset");
      field.appendChild(element(api, "legend", { text: question.title }));
      var choices = element(api, "div", { className: "psp-choice-grid" });
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
    var actions = element(api, "div", { className: "psp-actions" });
    var check = element(api, "button", { type: "button", className: "psp-primary", text: "核对预测" });
    var reset = element(api, "button", { type: "button", text: "重置预测" });
    var feedback = element(api, "p", { className: "psp-feedback", "aria-live": "polite" });
    actions.appendChild(check);
    actions.appendChild(reset);
    gate.appendChild(actions);
    gate.appendChild(feedback);
    shell.appendChild(gate);
    var results = element(api, "div", { className: "psp-results" });
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
        feedback.textContent = complete ? "预测已记录，点击“核对预测”展开热漂移账本。" : "请先回答三个判断。";
        feedback.className = "psp-feedback";
      } else {
        var expected = { shift: "cross", q: "easier", mzi: "area" };
        var score = questions.reduce(function (total, question) {
          return total + (state.answers[question.id] === expected[question.id] ? 1 : 0);
        }, 0);
        feedback.textContent = "预测得分 " + score + "/" + questions.length + "。现在改变 Q、温度和器件选择。";
        feedback.className = "psp-feedback " + (score === questions.length ? "psp-pass" : "psp-warn");
      }
    }

    function renderResults() {
      var data = experiment(state);
      clear(results);
      var layout = element(api, "div", { className: "psp-layout" });
      var controls = element(api, "div", { className: "psp-controls" });
      [
        ["temperature", "温差", -5, 8, .5, " K", 1],
        ["q", "微环 Q", 3000, 20000, 1000, "", 0],
        ["armLength", "MZI 臂长", .3, 3, .1, " mm", 1],
        ["coupling", "模式耦合效率", .3, 1, .05, "", 2]
      ].forEach(function (spec) {
        var control = element(api, "div", { className: "psp-control" });
        var label = element(api, "label", { htmlFor: "psp-" + spec[0], text: spec[1] + "：" });
        var output = element(api, "output", { text: fmt(state[spec[0]], spec[6]) + spec[5] });
        label.appendChild(output);
        var input = element(api, "input", { id: "psp-" + spec[0], type: "range", min: spec[2], max: spec[3], step: spec[4], value: state[spec[0]], "aria-label": spec[1] });
        input.addEventListener("input", function () {
          state[spec[0]] = Number(input.value);
          renderResults();
        });
        control.appendChild(label);
        control.appendChild(input);
        controls.appendChild(control);
      });
      var deviceControl = element(api, "div", { className: "psp-control" });
      deviceControl.appendChild(element(api, "span", { className: "psp-control-title", text: "查看器件" }));
      var deviceRow = element(api, "div", { className: "psp-mode-row" });
      [["ring", "微环"], ["mzi", "MZI"]].forEach(function (choice) {
        var button = element(api, "button", { type: "button", text: choice[1], "aria-pressed": state.device === choice[0] ? "true" : "false" });
        button.addEventListener("click", function () {
          state.device = choice[0];
          renderResults();
        });
        deviceRow.appendChild(button);
      });
      deviceControl.appendChild(deviceRow);
      controls.appendChild(deviceControl);
      var stage = element(api, "div", { className: "psp-stage" });
      var frame = element(api, "div", { className: "psp-frame" });
      frame.appendChild(buildChart(api, data));
      stage.appendChild(frame);
      layout.appendChild(controls);
      layout.appendChild(stage);
      results.appendChild(layout);
      var metrics = element(api, "div", { className: "psp-metrics" });
      appendMetric(api, metrics, "谐振漂移", fmt(data.shift, 3) + " nm");
      appendMetric(api, metrics, "线宽", fmt(data.linewidth, 3) + " nm");
      appendMetric(api, metrics, "漂移/线宽", fmt(Math.abs(data.detuningRatio), 2));
      appendMetric(api, metrics, "微环透过代理", fmt(data.ringTransmission, 3));
      appendMetric(api, metrics, "MZI 输出代理", fmt(data.mziOutput, 3));
      appendMetric(api, metrics, "耦合后功率比例", fmt(data.coupled, 3));
      results.appendChild(metrics);
      var table = element(api, "table", { "aria-label": "硅光热漂移与耦合账本" });
      var head = element(api, "tr");
      ["环节", "数值", "含义"].forEach(function (label) { head.appendChild(element(api, "th", { scope: "col", text: label })); });
      table.appendChild(element(api, "thead", {}, [head]));
      var body = element(api, "tbody");
      [
        ["微环条件", "mλ=nL", "高 Q 把相位判决压进窄带"],
        ["热光系数", "1.8e−4/K", "温度直接改 n_eff"],
        ["MZI 相位", fmt(data.phase, 2) + " rad", "长臂换取较宽的谱响应"],
        ["封装尺寸", "10 μm → 0.5 μm", "耦合与对准需要额外结构"]
      ].forEach(function (row) {
        var tr = element(api, "tr");
        row.forEach(function (value) { tr.appendChild(element(api, "td", { text: value })); });
        body.appendChild(tr);
      });
      table.appendChild(body);
      results.appendChild(table);
      results.appendChild(element(api, "p", { className: "psp-interpretation", text: data.device === "ring"
        ? data.verdict + "；微环节省面积，但需要监测光电二极管、加热器与锁波控制。"
        : data.verdict + "；MZI 仍会热漂移，只是它不是把每个通道压进单个窄线宽的谐振器。" }));
    }

    check.addEventListener("click", function () {
      if (check.disabled) return;
      state.revealed = true;
      results.hidden = false;
      renderGate();
      renderResults();
      if (api.announce) api.announce(root, "硅光预测已核对，微环与 MZI 热状态已展开。");
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
    assert(near(data.shift, .34875, 1e-4), "thermal wavelength shift");
    assert(near(data.linewidth, .155, 1e-6), "ring linewidth");
    assert(data.detuningRatio > 2, "default drift crosses two linewidths");
    assert(data.ringTransmission < .1, "ring leaves resonance");
    assert(data.coupled <= 1 && data.coupled >= 0, "coupling invariant");
    assert(experiment({ temperature: 0, q: 10000, armLength: 1, coupling: .8, device: "ring" }).shift === 0, "zero-temperature shift");
    return { checks: checks };
  }

  return {
    experiment: experiment,
    mount: mount,
    selfTest: selfTest
  };
});
