(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("photo-nonlinearity", exported.mount);
  }
  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log("photo-nonlinearity self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("photo-nonlinearity self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var STYLE_ID = "cl-photo-nonlinearity-styles";
  var DEFAULT = { powerDbm: 0, stages: 8, coefficient: .015 };
  var DOMINANCE_RATIO = 3;

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function near(left, right, tolerance) {
    return Math.abs(left - right) <= (tolerance || 1e-9) * Math.max(1, Math.abs(left), Math.abs(right));
  }

  function mWFromDbm(dbm) {
    return Math.pow(10, Number(dbm) / 10);
  }

  function dbmFromMw(mw) {
    return 10 * Math.log10(Math.max(mw, 1e-12));
  }

  function experiment(options) {
    var powerDbm = clamp(Number(options.powerDbm), -8, 8);
    var stages = clamp(Math.round(Number(options.stages)), 1, 12);
    var coefficient = clamp(Number(options.coefficient), .008, .025);
    var signal = mWFromDbm(powerDbm);
    var ase = .03 * stages;
    var nonlinear = coefficient * stages * Math.pow(signal, 3);
    var totalNoise = ase + nonlinear;
    var snr = signal / totalNoise;
    var optimumSignal = Math.pow(.03 / (2 * coefficient), 1 / 3);
    var optimumDbm = dbmFromMw(optimumSignal);
    return {
      powerDbm: powerDbm,
      stages: stages,
      coefficient: coefficient,
      signal: signal,
      ase: ase,
      nonlinear: nonlinear,
      totalNoise: totalNoise,
      snr: snr,
      snrDb: 10 * Math.log10(Math.max(snr, 1e-12)),
      optimumSignal: optimumSignal,
      optimumDbm: optimumDbm,
      dominant: ase >= nonlinear * DOMINANCE_RATIO ? "ASE" : nonlinear >= ase * DOMINANCE_RATIO ? "克尔非线性" : "平衡区",
      phaseProxy: coefficient * signal * stages * 10
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
      ".pnl-lab{--pnl-blue:var(--cl-blue,#315f9d);--pnl-gold:var(--cl-gold,#9b6a12);--pnl-red:var(--cl-red,#b64335);--pnl-green:var(--cl-green,#39734d);max-width:100%;min-width:0;color:var(--fg);line-height:1.55}.pnl-lab *{box-sizing:border-box}.pnl-lab h3{margin:0;font-size:1.18rem}.pnl-lab p{margin:.65em 0}.pnl-lab .pnl-note,.pnl-lab .pnl-feedback{color:var(--fg-soft);font-size:13px;line-height:1.6;overflow-wrap:anywhere}.pnl-lab .pnl-prompt{margin:14px 0;padding:12px 14px;border-left:3px solid var(--pnl-gold);background:var(--bg)}.pnl-lab fieldset{min-width:0;margin:0 0 11px;padding:0;border:0}.pnl-lab legend{margin-bottom:7px;color:var(--fg);font-size:13px;font-weight:750;line-height:1.5}.pnl-lab .pnl-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.pnl-lab button,.pnl-lab input{font:inherit;letter-spacing:0}.pnl-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;line-height:1.35;overflow-wrap:anywhere}.pnl-lab button:hover{border-color:var(--accent)}.pnl-lab button[aria-pressed=true],.pnl-lab button.pnl-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:700}.pnl-lab button:disabled{cursor:not-allowed;opacity:.55}.pnl-lab button:focus-visible,.pnl-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.pnl-lab .pnl-actions{display:flex;flex-wrap:wrap;gap:8px}.pnl-lab .pnl-actions>*{flex:1 1 160px}.pnl-lab .pnl-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.pnl-lab .pnl-pass{color:var(--pnl-green)}.pnl-lab .pnl-warn{color:var(--pnl-red)}",
      ".pnl-lab .pnl-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.pnl-lab .pnl-layout{display:grid;grid-template-columns:minmax(210px,.72fr) minmax(0,1.28fr);gap:14px;align-items:start}.pnl-lab .pnl-controls,.pnl-lab .pnl-stage{min-width:0}.pnl-lab .pnl-controls{display:grid;gap:11px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg)}.pnl-lab .pnl-control{display:grid;gap:5px}.pnl-lab .pnl-control label{color:var(--fg-soft);font-size:13px;font-weight:700}.pnl-lab .pnl-control output{color:var(--accent);font-variant-numeric:tabular-nums}.pnl-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent)}.pnl-lab .pnl-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden}.pnl-lab svg{display:block;width:100%;height:auto;color:var(--fg)}.pnl-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.pnl-lab .pnl-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin:11px 0}.pnl-lab .pnl-metric{min-width:0;padding:8px;border-top:2px solid var(--border);background:var(--bg)}.pnl-lab .pnl-metric:nth-child(4n+1){border-top-color:var(--pnl-blue)}.pnl-lab .pnl-metric:nth-child(4n+2){border-top-color:var(--pnl-gold)}.pnl-lab .pnl-metric:nth-child(4n+3){border-top-color:var(--pnl-red)}.pnl-lab .pnl-metric:nth-child(4n){border-top-color:var(--pnl-green)}.pnl-lab .pnl-metric span{display:block;color:var(--fg-soft);font-size:11.5px}.pnl-lab .pnl-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.pnl-lab table{width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.pnl-lab th,.pnl-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}.pnl-lab th{color:var(--fg-soft);font-weight:750}.pnl-lab .pnl-interpretation{margin:11px 0 0;padding:10px 12px;border-left:3px solid var(--pnl-green);background:var(--bg);font-size:13px;line-height:1.65;overflow-wrap:anywhere}",
      "@media(max-width:820px){.pnl-lab .pnl-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:560px){.pnl-lab .pnl-choice-grid{grid-template-columns:minmax(0,1fr)}.pnl-lab .pnl-frame{padding:5px}.pnl-lab th,.pnl-lab td{padding-left:5px;padding-right:5px}}@media(prefers-reduced-motion:reduce){.pnl-lab *{scroll-behavior:auto!important;transition:none!important;animation:none!important}}"
    ].join("");
    style.textContent += ".pnl-lab .pnl-grid{stroke:var(--border);stroke-width:1;opacity:.72}.pnl-lab .pnl-ase{fill:none;stroke:var(--pnl-blue);stroke-width:3;stroke-linecap:round}.pnl-lab .pnl-nl{fill:none;stroke:var(--pnl-red);stroke-width:3;stroke-linecap:round}.pnl-lab .pnl-snr{fill:none;stroke:var(--pnl-green);stroke-width:3;stroke-linecap:round}.pnl-lab .pnl-marker{stroke:var(--pnl-gold);stroke-width:1.5;stroke-dasharray:3 3}.pnl-lab .pnl-optimum{stroke:var(--pnl-green);stroke-width:2;stroke-dasharray:6 4}.pnl-lab .pnl-point{fill:var(--pnl-gold);stroke:var(--bg);stroke-width:2}";
    (doc.head || doc.documentElement).appendChild(style);
  }

  function buildChart(api, data) {
    var svg = svgElement(api, "svg", {
      viewBox: "0 0 720 300",
      role: "img",
      "aria-label": "ASE、非线性噪声和信噪比随入纤功率变化"
    });
    svg.appendChild(svgElement(api, "title", {}, "ASE 与克尔非线性工作点"));
    var left = 48, right = 690, top = 28, bottom = 242;
    var xMap = function (value) { return left + (value + 8) / 16 * (right - left); };
    var yNoise = function (value) { return bottom - Math.min(1, Math.log10(1 + value) / 1.25) * (bottom - top); };
    var ySnr = function (value) { return bottom - Math.max(0, Math.min(1, (value + 8) / 18)) * (bottom - top); };
    [-8, -4, 0, 4, 8].forEach(function (value) {
      var x = xMap(value);
      svg.appendChild(svgElement(api, "line", { x1: x, y1: top, x2: x, y2: bottom, "class": "pnl-grid" }));
      svg.appendChild(svgElement(api, "text", { x: x, y: bottom + 20, "text-anchor": "middle", "font-size": 11 }, String(value)));
    });
    [0, .25, .5, .75, 1].forEach(function (value) {
      var y = bottom - value * (bottom - top);
      svg.appendChild(svgElement(api, "line", { x1: left, y1: y, x2: right, y2: y, "class": "pnl-grid" }));
    });
    var traces = [
      { cls: "pnl-ase", y: yNoise, fn: function () { return data.ase; } },
      { cls: "pnl-nl", y: yNoise, fn: function (power) { return data.coefficient * data.stages * Math.pow(mWFromDbm(power), 3); } },
      { cls: "pnl-snr", y: ySnr, fn: function (power) { var point = experiment({ powerDbm: power, stages: data.stages, coefficient: data.coefficient }); return point.snrDb; } }
    ];
    traces.forEach(function (trace) {
      var points = [];
      for (var index = 0; index <= 64; index += 1) {
        var power = -8 + index * .25;
        points.push({ x: xMap(power), y: trace.y(trace.fn(power)) });
      }
      svg.appendChild(svgElement(api, "path", {
        d: points.map(function (point, pointIndex) { return (pointIndex ? "L" : "M") + point.x.toFixed(2) + "," + point.y.toFixed(2); }).join(" "),
        "class": trace.cls
      }));
    });
    var markerX = xMap(data.powerDbm);
    svg.appendChild(svgElement(api, "line", { x1: markerX, y1: top, x2: markerX, y2: bottom, "class": "pnl-marker" }));
    svg.appendChild(svgElement(api, "circle", { cx: markerX, cy: ySnr(data.snrDb), r: 5, "class": "pnl-point" }));
    svg.appendChild(svgElement(api, "line", { x1: xMap(data.optimumDbm), y1: top, x2: xMap(data.optimumDbm), y2: bottom, "class": "pnl-optimum" }));
    svg.appendChild(svgElement(api, "text", { x: right, y: 18, "text-anchor": "end", "font-size": 12 }, "噪声为左轴代理，SNR(dB)为右轴"));
    svg.appendChild(svgElement(api, "text", { x: right, y: bottom + 42, "text-anchor": "end", "font-size": 11 }, "入纤功率（dBm）"));
    return svg;
  }

  function appendMetric(api, parent, label, value) {
    parent.appendChild(element(api, "div", { className: "pnl-metric" }, [
      element(api, "span", { text: label }),
      element(api, "strong", { text: value })
    ]));
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    installStyles(doc);
    var state = {
      powerDbm: DEFAULT.powerDbm,
      stages: DEFAULT.stages,
      coefficient: DEFAULT.coefficient,
      revealed: false,
      answers: {}
    };
    var shell = element(api, "div", { className: "pnl-lab" });
    shell.appendChild(element(api, "h3", { text: "非线性工作点：ASE 与克尔噪声的交接" }));
    shell.appendChild(element(api, "p", { className: "pnl-note", text: "这是固定教学模型，不是某一台 EDFA 的规格；目标是识别低功率与高功率两端的不同失效机制。" }));
    var gate = element(api, "div", { className: "pnl-prompt" });
    var questions = [
      { id: "low", title: "从 −6 dBm 提到 0 dBm，ASE 相对信号的影响怎样？", choices: [["less", "相对减小，SNR 先改善"], ["more", "相对增大，SNR 必然变差"]] },
      { id: "high", title: "从 0 dBm 提到 +6 dBm，P³ 非线性项约放大多少倍？", choices: [["sixtyfour", "约 64 倍"], ["six", "约 6 倍"]] },
      { id: "stage", title: "增大放大器级数时，最佳功率主要由什么决定？", choices: [["ratio", "两类噪声的比例与系数"], ["power", "级数越多就无限向高功率移动"]] }
    ];
    var questionButtons = {};
    questions.forEach(function (question) {
      var field = element(api, "fieldset");
      field.appendChild(element(api, "legend", { text: question.title }));
      var choices = element(api, "div", { className: "pnl-choice-grid" });
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
    var actions = element(api, "div", { className: "pnl-actions" });
    var check = element(api, "button", { type: "button", className: "pnl-primary", text: "核对预测" });
    var reset = element(api, "button", { type: "button", text: "重置预测" });
    var feedback = element(api, "p", { className: "pnl-feedback", "aria-live": "polite" });
    actions.appendChild(check);
    actions.appendChild(reset);
    gate.appendChild(actions);
    gate.appendChild(feedback);
    shell.appendChild(gate);
    var results = element(api, "div", { className: "pnl-results" });
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
        feedback.textContent = complete ? "预测已记录，点击“核对预测”查看工作点。" : "请先回答三个判断。";
        feedback.className = "pnl-feedback";
      } else {
        var expected = { low: "less", high: "sixtyfour", stage: "ratio" };
        var score = questions.reduce(function (total, question) {
          return total + (state.answers[question.id] === expected[question.id] ? 1 : 0);
        }, 0);
        feedback.textContent = "预测得分 " + score + "/" + questions.length + "。现在拖动功率，区分 ASE 受限与非线性受限。";
        feedback.className = "pnl-feedback " + (score === questions.length ? "pnl-pass" : "pnl-warn");
      }
    }

    function renderResults() {
      var data = experiment(state);
      clear(results);
      var layout = element(api, "div", { className: "pnl-layout" });
      var controls = element(api, "div", { className: "pnl-controls" });
      [
        ["powerDbm", "入纤功率", -8, 8, .5, " dBm", 1],
        ["stages", "放大器级数", 1, 12, 1, " 级", 0],
        ["coefficient", "非线性系数代理", .008, .025, .001, "", 3]
      ].forEach(function (spec) {
        var control = element(api, "div", { className: "pnl-control" });
        var label = element(api, "label", { htmlFor: "pnl-" + spec[0], text: spec[1] + "：" });
        var output = element(api, "output", { text: fmt(state[spec[0]], spec[6]) + spec[5] });
        label.appendChild(output);
        var input = element(api, "input", { id: "pnl-" + spec[0], type: "range", min: spec[2], max: spec[3], step: spec[4], value: state[spec[0]], "aria-label": spec[1] });
        input.addEventListener("input", function () {
          state[spec[0]] = Number(input.value);
          renderResults();
        });
        control.appendChild(label);
        control.appendChild(input);
        controls.appendChild(control);
      });
      controls.appendChild(element(api, "p", { className: "pnl-note", text: "SNR=P/(ASE+非线性噪声)；相移是 γPL 的固定比例代理，用来提示长度与功率的累积效应。" }));
      var stage = element(api, "div", { className: "pnl-stage" });
      var frame = element(api, "div", { className: "pnl-frame" });
      frame.appendChild(buildChart(api, data));
      stage.appendChild(frame);
      layout.appendChild(controls);
      layout.appendChild(stage);
      results.appendChild(layout);
      var metrics = element(api, "div", { className: "pnl-metrics" });
      appendMetric(api, metrics, "ASE", fmt(data.ase, 3) + " mW");
      appendMetric(api, metrics, "非线性噪声", fmt(data.nonlinear, 3) + " mW");
      appendMetric(api, metrics, "SNR", fmt(data.snr, 2) + " (" + fmt(data.snrDb, 1) + " dB)");
      appendMetric(api, metrics, "模型最佳点", fmt(data.optimumDbm, 1) + " dBm");
      appendMetric(api, metrics, "主导项", data.dominant);
      appendMetric(api, metrics, "相移代理", fmt(data.phaseProxy, 2));
      results.appendChild(metrics);
      var table = element(api, "table", { "aria-label": "ASE 与非线性噪声账本" });
      var head = element(api, "tr");
      ["项", "当前值", "随功率变化"].forEach(function (label) { head.appendChild(element(api, "th", { scope: "col", text: label })); });
      table.appendChild(element(api, "thead", {}, [head]));
      var body = element(api, "tbody");
      [
        ["信号", fmt(data.signal, 3) + " mW", "P"],
        ["ASE", fmt(data.ase, 3) + " mW", "与级数成正比"],
        ["克尔非线性", fmt(data.nonlinear, 3) + " mW", "与 P³ 成正比"],
        ["总噪声", fmt(data.totalNoise, 3) + " mW", "两项方差代理相加"]
      ].forEach(function (row) {
        var tr = element(api, "tr");
        row.forEach(function (value) { tr.appendChild(element(api, "td", { text: value })); });
        body.appendChild(tr);
      });
      table.appendChild(body);
      results.appendChild(table);
      results.appendChild(element(api, "p", { className: "pnl-interpretation", text: data.dominant === "ASE"
        ? "当前在低功率端：继续加一点功率能提高信号相对 ASE 的比例，但要留意最终会进入非线性区。"
        : data.dominant === "克尔非线性"
          ? "当前在高功率端：继续加功率会让 P³ 项压过信号收益；降低功率、增加并行度或改变色散设计才是合理方向。"
          : "当前接近两类噪声的交接区；模型的最优点不是最大功率，而是两种限制共同决定的工作窗口。" }));
    }

    check.addEventListener("click", function () {
      if (check.disabled) return;
      state.revealed = true;
      results.hidden = false;
      renderGate();
      renderResults();
      if (api.announce) api.announce(root, "非线性预测已核对，ASE 与克尔噪声曲线已展开。");
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
    var low = experiment({ powerDbm: -6, stages: 8, coefficient: .015 });
    var middle = experiment(DEFAULT);
    var high = experiment({ powerDbm: 6, stages: 8, coefficient: .015 });
    assert(near(low.signal, .2511886, 1e-5), "dBm conversion");
    assert(near(middle.ase, .24), "ASE stages");
    assert(middle.snr > low.snr, "SNR improves from low-power end");
    assert(high.nonlinear > low.nonlinear * 1000, "cubic nonlinear growth");
    assert(middle.optimumDbm === 0, "default optimum");
    assert(high.snr < middle.snr, "SNR falls at high-power end");
    assert(middle.dominant === "平衡区", "default noise balance classification");
    return { checks: checks };
  }

  return {
    experiment: experiment,
    mWFromDbm: mWFromDbm,
    DOMINANCE_RATIO: DOMINANCE_RATIO,
    mount: mount,
    selfTest: selfTest
  };
});
