(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("photo-link-budget", exported.mount);
  }
  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log("photo-link-budget self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("photo-link-budget self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var STYLE_ID = "cl-photo-link-budget-styles";
  var DEFAULT = { distance: 200, connectorLoss: 2, ampGain: 10, channels: 80, modulation: "qpsk" };
  var FORMATS = {
    ook: { label: "OOK", bits: 1, threshold: 7 },
    qpsk: { label: "QPSK", bits: 2, threshold: 11 },
    qam16: { label: "16QAM", bits: 4, threshold: 18 },
    qam64: { label: "64QAM", bits: 6, threshold: 23 }
  };

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
    var distance = clamp(Math.round(Number(options.distance) / 50) * 50, 50, 400);
    var connectorLoss = clamp(Number(options.connectorLoss), 0, 6);
    var ampGain = clamp(Number(options.ampGain), 6, 14);
    var channels = clamp(Math.round(Number(options.channels) / 10) * 10, 40, 120);
    var modulation = FORMATS[options.modulation] ? options.modulation : "qpsk";
    var format = FORMATS[modulation];
    var amplifierCount = Math.max(0, Math.ceil(distance / 50) - 1);
    var noiseContributions = amplifierCount + 1;
    var fiberLoss = .2 * distance;
    var received = -fiberLoss - connectorLoss + amplifierCount * ampGain;
    var margin = received - (-18);
    var osnr = 28 - 10 * Math.log10(noiseContributions) - .02 * distance;
    var capacityTbps = channels * 100 * 2 * format.bits / 1000;
    var rows = [];
    var spanCount = distance / 50;
    var power = 0;
    for (var span = 0; span <= spanCount; span += 1) {
      if (span === spanCount) power -= connectorLoss;
      rows.push({ span: span, distance: span * 50, power: power });
      if (span < spanCount) {
        power -= 10;
        if (span < amplifierCount) power += ampGain;
      }
    }
    return {
      distance: distance,
      connectorLoss: connectorLoss,
      ampGain: ampGain,
      channels: channels,
      modulation: modulation,
      format: format,
      amplifierCount: amplifierCount,
      fiberLoss: fiberLoss,
      received: received,
      margin: margin,
      osnr: osnr,
      noiseContributions: noiseContributions,
      capacityTbps: capacityTbps,
      usable: margin >= 0 && osnr >= format.threshold,
      rows: rows
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
      ".plb-lab{--plb-blue:var(--cl-blue,#315f9d);--plb-gold:var(--cl-gold,#9b6a12);--plb-red:var(--cl-red,#b64335);--plb-green:var(--cl-green,#39734d);max-width:100%;min-width:0;color:var(--fg);line-height:1.55}.plb-lab *{box-sizing:border-box}.plb-lab h3,.plb-lab h4{margin:0}.plb-lab h3{font-size:1.18rem}.plb-lab h4{margin-top:14px;font-size:1rem}.plb-lab p{margin:.65em 0}.plb-lab .plb-note,.plb-lab .plb-feedback{color:var(--fg-soft);font-size:13px;line-height:1.6;overflow-wrap:anywhere}.plb-lab .plb-prompt{margin:14px 0;padding:12px 14px;border-left:3px solid var(--plb-gold);background:var(--bg)}",
      ".plb-lab fieldset{min-width:0;margin:0 0 11px;padding:0;border:0}.plb-lab legend{margin-bottom:7px;color:var(--fg);font-size:13px;font-weight:750;line-height:1.5}.plb-lab .plb-choice-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.plb-lab button,.plb-lab select,.plb-lab input{font:inherit;letter-spacing:0}.plb-lab button,.plb-lab select{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;line-height:1.35;overflow-wrap:anywhere}.plb-lab select{width:100%}.plb-lab button:hover{border-color:var(--accent)}.plb-lab button[aria-pressed=true],.plb-lab button.plb-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:700}.plb-lab button:disabled{cursor:not-allowed;opacity:.55}.plb-lab button:focus-visible,.plb-lab select:focus-visible,.plb-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.plb-lab .plb-actions{display:flex;flex-wrap:wrap;gap:8px}.plb-lab .plb-actions>*{flex:1 1 160px}.plb-lab .plb-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.plb-lab .plb-pass{color:var(--plb-green)}.plb-lab .plb-warn{color:var(--plb-red)}",
      ".plb-lab .plb-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.plb-lab .plb-layout{display:grid;grid-template-columns:minmax(210px,.72fr) minmax(0,1.28fr);gap:14px;align-items:start}.plb-lab .plb-controls,.plb-lab .plb-stage{min-width:0}.plb-lab .plb-controls{display:grid;gap:11px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg)}.plb-lab .plb-control{display:grid;gap:5px}.plb-lab .plb-control label{color:var(--fg-soft);font-size:13px;font-weight:700}.plb-lab .plb-control output{color:var(--accent);font-variant-numeric:tabular-nums}.plb-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent)}.plb-lab .plb-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden}.plb-lab svg{display:block;width:100%;height:auto;color:var(--fg)}.plb-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.plb-lab .plb-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin:11px 0}.plb-lab .plb-metric{min-width:0;padding:8px;border-top:2px solid var(--border);background:var(--bg)}.plb-lab .plb-metric:nth-child(4n+1){border-top-color:var(--plb-blue)}.plb-lab .plb-metric:nth-child(4n+2){border-top-color:var(--plb-gold)}.plb-lab .plb-metric:nth-child(4n+3){border-top-color:var(--plb-red)}.plb-lab .plb-metric:nth-child(4n){border-top-color:var(--plb-green)}.plb-lab .plb-metric span{display:block;color:var(--fg-soft);font-size:11.5px}.plb-lab .plb-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.plb-lab table{width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.plb-lab th,.plb-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}.plb-lab th{color:var(--fg-soft);font-weight:750}.plb-lab .plb-interpretation{margin:11px 0 0;padding:10px 12px;border-left:3px solid var(--plb-green);background:var(--bg);font-size:13px;line-height:1.65;overflow-wrap:anywhere}",
      "@media(max-width:820px){.plb-lab .plb-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:560px){.plb-lab .plb-choice-grid{grid-template-columns:minmax(0,1fr)}.plb-lab .plb-frame{padding:5px}.plb-lab th,.plb-lab td{padding-left:5px;padding-right:5px}}@media(prefers-reduced-motion:reduce){.plb-lab *{scroll-behavior:auto!important;transition:none!important;animation:none!important}}"
    ].join("");
    style.textContent += ".plb-lab .plb-grid{stroke:var(--border);stroke-width:1;opacity:.72}.plb-lab .plb-threshold{stroke:var(--plb-red);stroke-width:2;stroke-dasharray:6 4}.plb-lab .plb-power{fill:none;stroke:var(--plb-blue);stroke-width:3;stroke-linecap:round;stroke-linejoin:round}.plb-lab .plb-power.plb-fail{stroke:var(--plb-red)}.plb-lab .plb-point{fill:var(--plb-gold);stroke:var(--bg);stroke-width:2}";
    (doc.head || doc.documentElement).appendChild(style);
  }

  function buildChart(api, data) {
    var svg = svgElement(api, "svg", {
      viewBox: "0 0 720 290",
      role: "img",
      "aria-label": "光链路每一跨的接收功率阶梯与接收灵敏度"
    });
    svg.appendChild(svgElement(api, "title", {}, "链路预算阶梯"));
    var left = 54, right = 684, top = 28, bottom = 225;
    var maxDistance = 400;
    var xMap = function (value) { return left + value / maxDistance * (right - left); };
    var yMap = function (value) { return bottom - (value + 60) / 70 * (bottom - top); };
    [-60, -40, -20, 0].forEach(function (value) {
      var y = yMap(value);
      svg.appendChild(svgElement(api, "line", { x1: left, y1: y, x2: right, y2: y, "class": "plb-grid" }));
      svg.appendChild(svgElement(api, "text", { x: left - 8, y: y + 4, "text-anchor": "end", "font-size": 11 }, String(value)));
    });
    [0, 100, 200, 300, 400].forEach(function (value) {
      var x = xMap(value);
      svg.appendChild(svgElement(api, "line", { x1: x, y1: top, x2: x, y2: bottom, "class": "plb-grid" }));
      svg.appendChild(svgElement(api, "text", { x: x, y: bottom + 20, "text-anchor": "middle", "font-size": 11 }, String(value)));
    });
    var thresholdY = yMap(-18);
    svg.appendChild(svgElement(api, "line", { x1: left, y1: thresholdY, x2: right, y2: thresholdY, "class": "plb-threshold" }));
    svg.appendChild(svgElement(api, "text", { x: right, y: thresholdY - 7, "text-anchor": "end", "font-size": 11 }, "灵敏度 −18 dBm"));
    var path = data.rows.map(function (row, index) {
      return (index ? "L" : "M") + xMap(row.distance).toFixed(2) + "," + yMap(row.power).toFixed(2);
    }).join(" ");
    svg.appendChild(svgElement(api, "path", { d: path, "class": data.margin >= 0 ? "plb-power" : "plb-power plb-fail" }));
    data.rows.forEach(function (row) {
      svg.appendChild(svgElement(api, "circle", { cx: xMap(row.distance), cy: yMap(row.power), r: 4, "class": "plb-point" }));
    });
    svg.appendChild(svgElement(api, "text", { x: right, y: 18, "text-anchor": "end", "font-size": 12 }, "功率（dBm）"));
    svg.appendChild(svgElement(api, "text", { x: right, y: bottom + 42, "text-anchor": "end", "font-size": 11 }, "距离（km）"));
    return svg;
  }

  function appendMetric(api, parent, label, value) {
    parent.appendChild(element(api, "div", { className: "plb-metric" }, [
      element(api, "span", { text: label }),
      element(api, "strong", { text: value })
    ]));
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    installStyles(doc);
    var state = {
      distance: DEFAULT.distance,
      connectorLoss: DEFAULT.connectorLoss,
      ampGain: DEFAULT.ampGain,
      channels: DEFAULT.channels,
      modulation: DEFAULT.modulation,
      revealed: false,
      answers: {}
    };
    var shell = element(api, "div", { className: "plb-lab" });
    shell.appendChild(element(api, "h3", { text: "链路预算：功率裕量与 OSNR 是两本账" }));
    shell.appendChild(element(api, "p", { className: "plb-note", text: "固定 100 GBd、双偏振教学链路。先预测高阶调制能否通过，再展开每一跨的功率阶梯。" }));
    var gate = element(api, "div", { className: "plb-prompt" });
    var questions = [
      { id: "gain", title: "EDFA 把功率补回后，是否也自动恢复 OSNR？", choices: [["no", "不自动；ASE 会逐级累积"], ["yes", "是；功率和 OSNR 等价"]] },
      { id: "qam", title: "同一链路从 QPSK 换 64QAM，直接得到什么？", choices: [["bits", "每符号比特增加，但噪声门槛更高"], ["distance", "可达距离必然增加"]] },
      { id: "wdm", title: "WDM 通道数从 80 增到 100，理想容量怎样变化？", choices: [["linear", "按通道数线性增加"], ["threshold", "消除单通道 OSNR 门槛"]] }
    ];
    var questionButtons = {};
    questions.forEach(function (question) {
      var field = element(api, "fieldset");
      field.appendChild(element(api, "legend", { text: question.title }));
      var choices = element(api, "div", { className: "plb-choice-grid" });
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
    var actions = element(api, "div", { className: "plb-actions" });
    var check = element(api, "button", { type: "button", className: "plb-primary", text: "核对预测" });
    var reset = element(api, "button", { type: "button", text: "重置预测" });
    var feedback = element(api, "p", { className: "plb-feedback", "aria-live": "polite" });
    actions.appendChild(check);
    actions.appendChild(reset);
    gate.appendChild(actions);
    gate.appendChild(feedback);
    shell.appendChild(gate);
    var results = element(api, "div", { className: "plb-results" });
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
        feedback.textContent = complete ? "预测已记录，点击“核对预测”展开功率与 OSNR。" : "请先回答三个判断。";
        feedback.className = "plb-feedback";
      } else {
        var expected = { gain: "no", qam: "bits", wdm: "linear" };
        var score = questions.reduce(function (total, question) {
          return total + (state.answers[question.id] === expected[question.id] ? 1 : 0);
        }, 0);
        feedback.textContent = "预测得分 " + score + "/" + questions.length + "。现在改变距离或格式，观察哪一本账先失败。";
        feedback.className = "plb-feedback " + (score === questions.length ? "plb-pass" : "plb-warn");
      }
    }

    function renderResults() {
      var data = experiment(state);
      clear(results);
      var layout = element(api, "div", { className: "plb-layout" });
      var controls = element(api, "div", { className: "plb-controls" });
      [
        ["distance", "链路距离", 50, 400, 50, " km", 0],
        ["connectorLoss", "连接器总损耗", 0, 6, .5, " dB", 1],
        ["ampGain", "每级 EDFA 增益", 6, 14, 1, " dB", 0],
        ["channels", "WDM 通道数", 40, 120, 10, " 路", 0]
      ].forEach(function (spec) {
        var control = element(api, "div", { className: "plb-control" });
        var label = element(api, "label", { htmlFor: "plb-" + spec[0], text: spec[1] + "：" });
        var output = element(api, "output", { text: fmt(state[spec[0]], spec[6]) + spec[5] });
        label.appendChild(output);
        var input = element(api, "input", {
          id: "plb-" + spec[0], type: "range", min: spec[2], max: spec[3], step: spec[4],
          value: state[spec[0]], "aria-label": spec[1]
        });
        input.addEventListener("input", function () {
          state[spec[0]] = Number(input.value);
          renderResults();
        });
        control.appendChild(label);
        control.appendChild(input);
        controls.appendChild(control);
      });
      var formatControl = element(api, "div", { className: "plb-control" });
      formatControl.appendChild(element(api, "label", { htmlFor: "plb-modulation", text: "调制格式：" }));
      var select = element(api, "select", { id: "plb-modulation", "aria-label": "调制格式" });
      Object.keys(FORMATS).forEach(function (id) {
        select.appendChild(element(api, "option", { value: id, text: FORMATS[id].label }));
      });
      select.value = state.modulation;
      select.addEventListener("change", function () {
        state.modulation = select.value;
        renderResults();
      });
      formatControl.appendChild(select);
      controls.appendChild(formatControl);
      var stage = element(api, "div", { className: "plb-stage" });
      var frame = element(api, "div", { className: "plb-frame" });
      frame.appendChild(buildChart(api, data));
      stage.appendChild(frame);
      layout.appendChild(controls);
      layout.appendChild(stage);
      results.appendChild(layout);
      var metrics = element(api, "div", { className: "plb-metrics" });
      appendMetric(api, metrics, "放大器级数", String(data.amplifierCount));
      appendMetric(api, metrics, "接收功率", fmt(data.received, 1) + " dBm");
      appendMetric(api, metrics, "功率裕量", fmt(data.margin, 1) + " dB");
      appendMetric(api, metrics, "教学 OSNR", fmt(data.osnr, 1) + " dB");
      appendMetric(api, metrics, "噪声贡献代理", String(data.noiseContributions));
      appendMetric(api, metrics, "理想总速率", fmt(data.capacityTbps, 1) + " Tb/s");
      appendMetric(api, metrics, "格式判断", data.usable ? "通过" : "OSNR/功率不足");
      results.appendChild(metrics);
      var table = element(api, "table", { "aria-label": "链路预算状态表" });
      var head = element(api, "tr");
      ["账本", "当前值", "判读"].forEach(function (label) { head.appendChild(element(api, "th", { scope: "col", text: label })); });
      table.appendChild(element(api, "thead", {}, [head]));
      var body = element(api, "tbody");
      [
        ["光纤损耗", fmt(data.fiberLoss, 1) + " dB", "α=0.2 dB/km"],
        ["连接器", fmt(data.connectorLoss, 1) + " dB", "功率预算直接扣除"],
        ["EDFA", "+" + fmt(data.amplifierCount * data.ampGain, 1) + " dB", "补功率，不抹去 ASE"],
        ["调制 OSNR 门槛", fmt(data.format.threshold, 1) + " dB", data.format.label + " 需要更大星座间距"]
      ].forEach(function (row) {
        var tr = element(api, "tr");
        row.forEach(function (value) { tr.appendChild(element(api, "td", { text: value })); });
        body.appendChild(tr);
      });
      table.appendChild(body);
      results.appendChild(table);
      results.appendChild(element(api, "p", { className: "plb-interpretation", text: data.usable
        ? data.format.label + " 在当前教学预算中通过，但这不包含非线性香农极限、FEC 实现损耗和 DSP 功耗。"
        : data.margin < 0
          ? "功率裕量已经为负；先修复链路预算，再讨论更高阶调制。"
          : "功率仍够，但 OSNR 低于 " + data.format.label + " 门槛；换回低阶格式或减少距离才是物理上诚实的选择。" }));
    }

    check.addEventListener("click", function () {
      if (check.disabled) return;
      state.revealed = true;
      results.hidden = false;
      renderGate();
      renderResults();
      if (api.announce) api.announce(root, "链路预测已核对，功率阶梯与 OSNR 账本已展开。");
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
    assert(near(data.fiberLoss, 40), "fiber loss");
    assert(data.amplifierCount === 3, "amplifier count");
    assert(near(data.received, -12), "received power");
    assert(near(data.margin, 6), "power margin");
    assert(data.rows[0].power === 0, "launch power starts before connector loss");
    assert(near(data.rows[data.rows.length - 1].power, data.received), "power staircase includes connector loss");
    assert(data.noiseContributions === 4 && near(data.osnr, 17.9794, 1e-4), "noise contribution OSNR proxy");
    assert(data.capacityTbps === 32, "QPSK capacity");
    assert(data.osnr > FORMATS.qpsk.threshold, "QPSK OSNR passes");
    assert(!experiment({ distance: 200, connectorLoss: 2, ampGain: 10, channels: 80, modulation: "qam64" }).usable, "64QAM boundary");
    assert(experiment({ distance: 200, connectorLoss: 2, ampGain: 10, channels: 100, modulation: "qpsk" }).capacityTbps > data.capacityTbps, "WDM capacity scales");
    return { checks: checks };
  }

  return {
    FORMATS: FORMATS,
    experiment: experiment,
    mount: mount,
    selfTest: selfTest
  };
});
