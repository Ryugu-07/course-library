(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("photo-industry-map", exported.mount);
  }
  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log("photo-industry-map self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("photo-industry-map self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var STYLE_ID = "cl-photo-industry-map-styles";
  var DEFAULT = { scenario: "datacenter", track: "master" };
  var LAYERS = [
    { id: "material", label: "材料/晶圆", values: [5, 5, 1, 3], evidence: "工艺、材料表征、失效分析" },
    { id: "component", label: "元器件", values: [4, 4, 3, 4], evidence: "器件测试、版图、光谱与噪声" },
    { id: "module", label: "模块", values: [3, 3, 4, 4], evidence: "调试、自动测试、良率与热" },
    { id: "system", label: "系统/设备", values: [3, 4, 4, 5], evidence: "系统设计、算法、机械/控制接口" },
    { id: "application", label: "应用", values: [2, 2, 5, 4], evidence: "需求验证、现场实验、产品指标" }
  ];
  var SCENARIOS = {
    datacenter: { label: "AI 数据中心互连", weights: [1, 2, 3, 5], note: "每比特功耗、带宽、封装和系统维护" },
    camera: { label: "消费相机", weights: [2, 1, 5, 3], note: "成本、体积、量产良率和图像体验" },
    medical: { label: "医疗 OCT", weights: [2, 5, 3, 4], note: "器件可信度、法规验证和系统闭环" }
  };
  var TRACKS = {
    undergrad: { label: "本科实践", fit: [5, 5, 3, 2], evidence: "装调、测试、工艺、品质、光模块调试" },
    master: { label: "硕士研发", fit: [3, 4, 5, 5], evidence: "光学设计、器件研发、ISP/LiDAR 算法、系统验证" },
    doctor: { label: "博士前沿/核心设备", fit: [1, 4, 5, 5], evidence: "硅光、超表面、量子、光刻物镜与核心工艺" }
  };

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function experiment(options) {
    var scenario = SCENARIOS[options.scenario] ? options.scenario : DEFAULT.scenario;
    var track = TRACKS[options.track] ? options.track : DEFAULT.track;
    var scenarioData = SCENARIOS[scenario];
    var scores = LAYERS.map(function (layer) {
      return layer.values.reduce(function (total, value, index) {
        return total + value * scenarioData.weights[index];
      }, 0);
    });
    var bestIndex = scores.indexOf(Math.max.apply(null, scores));
    var trackData = TRACKS[track];
    var fit = trackData.fit.reduce(function (total, value) { return total + value; }, 0);
    return {
      scenario: scenario,
      track: track,
      scenarioData: scenarioData,
      scores: scores,
      bestLayer: LAYERS[bestIndex],
      trackData: trackData,
      trackFit: fit,
      ranking: LAYERS.map(function (layer, index) { return { label: layer.label, score: scores[index] }; })
    };
  }

  function fmt(value, digits) {
    if (!finite(value)) return "—";
    var places = digits === undefined ? 0 : Number(digits);
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
      ".pim-lab{--pim-blue:var(--cl-blue,#315f9d);--pim-gold:var(--cl-gold,#9b6a12);--pim-red:var(--cl-red,#b64335);--pim-green:var(--cl-green,#39734d);max-width:100%;min-width:0;color:var(--fg);line-height:1.55}.pim-lab *{box-sizing:border-box}.pim-lab h3{margin:0;font-size:1.18rem}.pim-lab p{margin:.65em 0}.pim-lab .pim-note,.pim-lab .pim-feedback{color:var(--fg-soft);font-size:13px;line-height:1.6;overflow-wrap:anywhere}.pim-lab .pim-prompt{margin:14px 0;padding:12px 14px;border-left:3px solid var(--pim-gold);background:var(--bg)}.pim-lab fieldset{min-width:0;margin:0 0 11px;padding:0;border:0}.pim-lab legend{margin-bottom:7px;color:var(--fg);font-size:13px;font-weight:750;line-height:1.5}.pim-lab .pim-choice-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.pim-lab button,.pim-lab select{font:inherit;letter-spacing:0}.pim-lab button,.pim-lab select{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;line-height:1.35;overflow-wrap:anywhere}.pim-lab select{width:100%}.pim-lab button:hover{border-color:var(--accent)}.pim-lab button[aria-pressed=true],.pim-lab button.pim-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:700}.pim-lab button:disabled{cursor:not-allowed;opacity:.55}.pim-lab button:focus-visible,.pim-lab select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.pim-lab .pim-actions{display:flex;flex-wrap:wrap;gap:8px}.pim-lab .pim-actions>*{flex:1 1 160px}.pim-lab .pim-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.pim-lab .pim-pass{color:var(--pim-green)}.pim-lab .pim-warn{color:var(--pim-red)}",
      ".pim-lab .pim-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.pim-lab .pim-layout{display:grid;grid-template-columns:minmax(210px,.72fr) minmax(0,1.28fr);gap:14px;align-items:start}.pim-lab .pim-controls,.pim-lab .pim-stage{min-width:0}.pim-lab .pim-controls{display:grid;gap:11px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg)}.pim-lab .pim-control{display:grid;gap:5px}.pim-lab .pim-control label,.pim-lab .pim-control-title{color:var(--fg-soft);font-size:13px;font-weight:700}.pim-lab .pim-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden}.pim-lab svg{display:block;width:100%;height:auto;color:var(--fg)}.pim-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.pim-lab .pim-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin:11px 0}.pim-lab .pim-metric{min-width:0;padding:8px;border-top:2px solid var(--border);background:var(--bg)}.pim-lab .pim-metric:nth-child(4n+1){border-top-color:var(--pim-blue)}.pim-lab .pim-metric:nth-child(4n+2){border-top-color:var(--pim-gold)}.pim-lab .pim-metric:nth-child(4n+3){border-top-color:var(--pim-red)}.pim-lab .pim-metric:nth-child(4n){border-top-color:var(--pim-green)}.pim-lab .pim-metric span{display:block;color:var(--fg-soft);font-size:11.5px}.pim-lab .pim-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.pim-lab table{width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.pim-lab th,.pim-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}.pim-lab th{color:var(--fg-soft);font-weight:750}.pim-lab .pim-interpretation{margin:11px 0 0;padding:10px 12px;border-left:3px solid var(--pim-green);background:var(--bg);font-size:13px;line-height:1.65;overflow-wrap:anywhere}",
      "@media(max-width:820px){.pim-lab .pim-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:560px){.pim-lab .pim-choice-grid{grid-template-columns:minmax(0,1fr)}.pim-lab .pim-frame{padding:5px}.pim-lab th,.pim-lab td{padding-left:5px;padding-right:5px}}@media(prefers-reduced-motion:reduce){.pim-lab *{scroll-behavior:auto!important;transition:none!important;animation:none!important}}"
    ].join("");
    style.textContent += ".pim-lab .pim-axis{stroke:var(--fg-soft);stroke-width:1.2}.pim-lab .pim-bar{fill:var(--pim-blue);fill-opacity:.62}.pim-lab .pim-best{fill:var(--pim-green)}";
    (doc.head || doc.documentElement).appendChild(style);
  }

  function buildDiagram(api, data) {
    var svg = svgElement(api, "svg", {
      viewBox: "0 0 720 320",
      role: "img",
      "aria-label": "五层光电产业链在当前场景下的加权得分"
    });
    svg.appendChild(svgElement(api, "title", {}, "光电产业层级与任务权重"));
    var left = 150, right = 680, top = 38, rowHeight = 42;
    var maxScore = Math.max.apply(null, data.scores);
    data.scores.forEach(function (score, index) {
      var y = top + index * rowHeight;
      var width = score / 50 * (right - left);
      svg.appendChild(svgElement(api, "text", { x: left - 10, y: y + 20, "text-anchor": "end", "font-size": 12 }, LAYERS[index].label));
      svg.appendChild(svgElement(api, "rect", { x: left, y: y + 5, width: width, height: 24, "class": index === data.scores.indexOf(maxScore) ? "pim-best" : "pim-bar" }));
      svg.appendChild(svgElement(api, "text", { x: left + width + 8, y: y + 21, "font-size": 12 }, String(score)));
    });
    svg.appendChild(svgElement(api, "text", { x: left, y: 20, "font-size": 12 }, data.scenarioData.label + "：权重 C/B/W/I=" + data.scenarioData.weights.join("/")));
    svg.appendChild(svgElement(api, "line", { x1: left, y1: 255, x2: right, y2: 255, "class": "pim-axis" }));
    svg.appendChild(svgElement(api, "text", { x: left, y: 280, "font-size": 12 }, "当前轨道：" + data.trackData.label + "；证据覆盖度 " + data.trackFit + "/20"));
    svg.appendChild(svgElement(api, "text", { x: right, y: 307, "text-anchor": "end", "font-size": 11 }, "分数只用于显露权重，不是薪酬或公司排名"));
    return svg;
  }

  function appendMetric(api, parent, label, value) {
    parent.appendChild(element(api, "div", { className: "pim-metric" }, [
      element(api, "span", { text: label }),
      element(api, "strong", { text: value })
    ]));
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    installStyles(doc);
    var state = {
      scenario: DEFAULT.scenario,
      track: DEFAULT.track,
      revealed: false,
      answers: {}
    };
    var shell = element(api, "div", { className: "pim-lab" });
    shell.appendChild(element(api, "h3", { text: "产业地图：先定义瓶颈，再选择入口" }));
    shell.appendChild(element(api, "p", { className: "pim-note", text: "这是固定教学矩阵，不是薪酬统计。先预测产业层与能力证据，再用场景权重重排五层光电链。" }));
    var gate = element(api, "div", { className: "pim-prompt" });
    var questions = [
      { id: "bottleneck", title: "AI 数据中心互连的默认权重下，哪一层最需要系统判断？", choices: [["system", "系统/设备"], ["material", "材料/晶圆"]] },
      { id: "software", title: "“会用 Zemax”能否单独证明会做光学设计？", choices: [["no", "不能，还需公差、装调与实测闭环"], ["yes", "能，软件输出就是设计能力"]] },
      { id: "degree", title: "本科、硕士、博士的关系更接近什么？", choices: [["evidence", "不同岗位入口与证据链"], ["rank", "永久的能力高低排名"]] }
    ];
    var questionButtons = {};
    questions.forEach(function (question) {
      var field = element(api, "fieldset");
      field.appendChild(element(api, "legend", { text: question.title }));
      var choices = element(api, "div", { className: "pim-choice-grid" });
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
    var actions = element(api, "div", { className: "pim-actions" });
    var check = element(api, "button", { type: "button", className: "pim-primary", text: "核对预测" });
    var reset = element(api, "button", { type: "button", text: "重置预测" });
    var feedback = element(api, "p", { className: "pim-feedback", "aria-live": "polite" });
    actions.appendChild(check);
    actions.appendChild(reset);
    gate.appendChild(actions);
    gate.appendChild(feedback);
    shell.appendChild(gate);
    var results = element(api, "div", { className: "pim-results" });
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
        feedback.textContent = complete ? "预测已记录，点击“核对预测”查看产业层评分。" : "请先回答三个判断。";
        feedback.className = "pim-feedback";
      } else {
        var expected = { bottleneck: "system", software: "no", degree: "evidence" };
        var score = questions.reduce(function (total, question) {
          return total + (state.answers[question.id] === expected[question.id] ? 1 : 0);
        }, 0);
        feedback.textContent = "预测得分 " + score + "/" + questions.length + "。现在切换市场与学历轨道，观察权重怎样改变入口。";
        feedback.className = "pim-feedback " + (score === questions.length ? "pim-pass" : "pim-warn");
      }
    }

    function renderResults() {
      var data = experiment(state);
      clear(results);
      var layout = element(api, "div", { className: "pim-layout" });
      var controls = element(api, "div", { className: "pim-controls" });
      var scenario = element(api, "div", { className: "pim-control" });
      scenario.appendChild(element(api, "label", { htmlFor: "pim-scenario", text: "产品场景：" }));
      var scenarioSelect = element(api, "select", { id: "pim-scenario", "aria-label": "产品场景" });
      Object.keys(SCENARIOS).forEach(function (id) {
        scenarioSelect.appendChild(element(api, "option", { value: id, text: SCENARIOS[id].label }));
      });
      scenarioSelect.value = state.scenario;
      scenarioSelect.addEventListener("change", function () {
        state.scenario = scenarioSelect.value;
        renderResults();
      });
      scenario.appendChild(scenarioSelect);
      controls.appendChild(scenario);
      var track = element(api, "div", { className: "pim-control" });
      track.appendChild(element(api, "label", { htmlFor: "pim-track", text: "能力轨道：" }));
      var trackSelect = element(api, "select", { id: "pim-track", "aria-label": "能力轨道" });
      Object.keys(TRACKS).forEach(function (id) {
        trackSelect.appendChild(element(api, "option", { value: id, text: TRACKS[id].label }));
      });
      trackSelect.value = state.track;
      trackSelect.addEventListener("change", function () {
        state.track = trackSelect.value;
        renderResults();
      });
      track.appendChild(trackSelect);
      controls.appendChild(track);
      controls.appendChild(element(api, "p", { className: "pim-note", text: data.scenarioData.note }));
      controls.appendChild(element(api, "p", { className: "pim-note", text: "当前轨道证据：" + data.trackData.evidence }));
      var stage = element(api, "div", { className: "pim-stage" });
      var frame = element(api, "div", { className: "pim-frame" });
      frame.appendChild(buildDiagram(api, data));
      stage.appendChild(frame);
      layout.appendChild(controls);
      layout.appendChild(stage);
      results.appendChild(layout);
      var metrics = element(api, "div", { className: "pim-metrics" });
      appendMetric(api, metrics, "最高权重层", data.bestLayer.label);
      appendMetric(api, metrics, "最高层得分", String(Math.max.apply(null, data.scores)));
      appendMetric(api, metrics, "当前轨道", data.trackData.label);
      appendMetric(api, metrics, "证据覆盖度", data.trackFit + "/20");
      appendMetric(api, metrics, "场景", data.scenarioData.label);
      results.appendChild(metrics);
      var table = element(api, "table", { "aria-label": "产业层级评分与入口证据" });
      var head = element(api, "tr");
      ["产业层", "加权分数", "常见证据"].forEach(function (label) { head.appendChild(element(api, "th", { scope: "col", text: label })); });
      table.appendChild(element(api, "thead", {}, [head]));
      var body = element(api, "tbody");
      data.ranking.forEach(function (row, index) {
        var tr = element(api, "tr");
        [row.label, String(row.score), LAYERS[index].evidence].forEach(function (value) { tr.appendChild(element(api, "td", { text: value })); });
        body.appendChild(tr);
      });
      table.appendChild(body);
      results.appendChild(table);
      results.appendChild(element(api, "p", { className: "pim-interpretation", text: "当前建议的下一项可验证作品：" + data.bestLayer.evidence + "。它把场景权重转成了具体交付证据，而不是把学历或软件名称当作结论。" }));
    }

    check.addEventListener("click", function () {
      if (check.disabled) return;
      state.revealed = true;
      results.hidden = false;
      renderGate();
      renderResults();
      if (api.announce) api.announce(root, "产业地图预测已核对，场景权重与入口证据已展开。");
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
    assert(data.bestLayer.id === "system", "data-center best layer");
    assert(data.scores[2] === 41, "module score");
    assert(data.scores[3] === 48, "system score");
    assert(data.trackFit === 17, "master evidence score");
    assert(experiment({ scenario: "camera", track: "undergrad" }).scenarioData.weights[2] === 5, "camera weights");
    assert(experiment({ scenario: "medical", track: "doctor" }).bestLayer.id === "system", "medical system emphasis");
    return { checks: checks };
  }

  return {
    LAYERS: LAYERS,
    SCENARIOS: SCENARIOS,
    experiment: experiment,
    mount: mount,
    selfTest: selfTest
  };
});
