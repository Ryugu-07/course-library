(function (host) {
  "use strict";

  var STYLE_ID = "hypothesis-testing-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var PRESETS = [
    { id: "null", label: "近似零效应", n: 40, mean: 0.05, alpha: 0.05, sesoi: 0.20, tests: 1 },
    { id: "borderline", label: "边缘显著", n: 80, mean: 0.22, alpha: 0.05, sesoi: 0.20, tests: 1 },
    { id: "tiny", label: "大样本微效应", n: 10000, mean: 0.05, alpha: 0.05, sesoi: 0.20, tests: 1 },
    { id: "important", label: "越过重要阈值", n: 400, mean: 0.32, alpha: 0.05, sesoi: 0.20, tests: 1 },
    { id: "low-power", label: "低功效", n: 16, mean: 0.25, alpha: 0.05, sesoi: 0.20, tests: 1 },
    { id: "selected", label: "筛选 20 项", n: 100, mean: 0.22, alpha: 0.05, sesoi: 0.20, tests: 20 }
  ];

  var STYLE_TEXT = [
    ".ht-lab{max-width:100%;min-width:0;color:var(--fg);line-height:1.55}",
    ".ht-lab *{box-sizing:border-box}.ht-lab [hidden]{display:none!important}",
    ".ht-lab .ht-note,.ht-lab .ht-feedback{color:var(--fg-soft);font-size:13px}",
    ".ht-lab .ht-presets,.ht-lab .ht-actions,.ht-lab .ht-choice{display:flex;flex-wrap:wrap;gap:8px}",
    ".ht-lab button,.ht-lab input,.ht-lab select{min-height:44px;font:inherit}",
    ".ht-lab .ht-presets button{flex:1 1 130px}",
    ".ht-lab button[aria-pressed=true]{border-color:var(--accent);background:var(--accent);color:var(--bg)}",
    ".ht-lab button:focus-visible,.ht-lab input:focus-visible,.ht-lab select:focus-visible{outline:3px solid var(--cl-focus);outline-offset:2px}",
    ".ht-lab .ht-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px 16px;margin:14px 0}",
    ".ht-lab .ht-control{display:grid;gap:5px;min-width:0}.ht-lab .ht-control label{font-size:12.5px;font-weight:700;color:var(--fg-soft)}",
    ".ht-lab .ht-control output{color:var(--accent);font-variant-numeric:tabular-nums}.ht-lab .ht-control input,.ht-lab .ht-control select{box-sizing:border-box;width:100%;min-width:0;margin:0}",
    ".ht-lab .ht-predict{margin:14px 0;padding:12px 14px;border-left:3px solid var(--cl-gold);background:var(--bg)}",
    ".ht-lab .ht-question{margin:0 0 7px;font-size:13px;font-weight:800}.ht-lab .ht-question+.ht-choice{margin-bottom:12px}",
    ".ht-lab .ht-choice button{flex:1 1 170px}.ht-lab .ht-feedback{min-height:2em;margin:8px 0 0;font-weight:700}",
    ".ht-lab .ht-pass{color:var(--cl-green)}.ht-lab .ht-warn{color:var(--cl-red)}",
    ".ht-lab .ht-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:14px 0}",
    ".ht-lab .ht-metric{min-width:0;padding:9px 4px;border-top:2px solid var(--border)}.ht-lab .ht-metric span{display:block;color:var(--fg-soft);font-size:11.5px}.ht-lab .ht-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".ht-lab svg{display:block;width:100%;height:auto;border:1px solid var(--border);border-radius:7px;background:var(--bg)}",
    ".ht-lab svg text{fill:var(--fg);font-family:inherit;letter-spacing:0}.ht-lab .ht-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.55}",
    ".ht-lab .ht-null{stroke:var(--accent);stroke-width:2.6;fill:none}.ht-lab .ht-alt{stroke:var(--cl-gold);stroke-width:2.6;fill:none}.ht-lab .ht-observed{stroke:var(--cl-red);stroke-width:2.2;stroke-dasharray:5 4}",
    ".ht-lab .ht-reject{fill:var(--cl-red);fill-opacity:.1}",
    ".ht-lab .ht-ledger{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:14px}.ht-lab table{width:100%;min-width:680px;border-collapse:collapse;font-size:12px}.ht-lab th,.ht-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}.ht-lab th{color:var(--fg-soft);font-size:11.5px}",
    "@media(max-width:760px){.ht-lab .ht-controls{grid-template-columns:minmax(0,1fr)}}",
    "@media(prefers-reduced-motion:reduce){.ht-lab *{animation:none!important;transition:none!important}}"
  ].join("\n");

  function clamp(value, low, high) { return Math.min(high, Math.max(low, value)); }

  function erf(value) {
    var sign = value < 0 ? -1 : 1;
    var x = Math.abs(value);
    var t = 1 / (1 + 0.3275911 * x);
    var polynomial = (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t);
    return sign * (1 - polynomial * Math.exp(-x * x));
  }

  function normalCDF(value) { return 0.5 * (1 + erf(value / Math.SQRT2)); }

  function normalPDF(value, mean) {
    var shifted = value - (mean || 0);
    return Math.exp(-0.5 * shifted * shifted) / Math.sqrt(2 * Math.PI);
  }

  function inverseNormal(probability) {
    if (!(probability > 0 && probability < 1)) throw new RangeError("probability must be in (0, 1)");
    var low = -8, high = 8;
    for (var index = 0; index < 80; index += 1) {
      var middle = (low + high) / 2;
      if (normalCDF(middle) < probability) low = middle;
      else high = middle;
    }
    return (low + high) / 2;
  }

  function testPower(n, alpha, alternative) {
    var critical = inverseNormal(1 - alpha / 2);
    var shift = Math.sqrt(n) * alternative;
    return clamp(normalCDF(-critical - shift) + 1 - normalCDF(critical - shift), 0, 1);
  }

  function analyze(config) {
    var n = Math.max(2, Math.round(Number(config.n)));
    var mean = Number(config.mean);
    var alpha = clamp(Number(config.alpha), 0.001, 0.2);
    var sesoi = Math.max(0.001, Number(config.sesoi));
    var tests = Math.max(1, Math.round(Number(config.tests)));
    var standardError = 1 / Math.sqrt(n);
    var critical = inverseNormal(1 - alpha / 2);
    var z = mean / standardError;
    var p = clamp(2 * (1 - normalCDF(Math.abs(z))), 0, 1);
    var ci = [mean - critical * standardError, mean + critical * standardError];
    var bonferroniAlpha = alpha / tests;
    return {
      n: n, mean: mean, alpha: alpha, sesoi: sesoi, tests: tests,
      standardError: standardError, critical: critical, z: z, p: p, ci: ci,
      reject: p < alpha,
      practical: ci[0] > sesoi || ci[1] < -sesoi,
      insideBand: ci[0] >= -sesoi && ci[1] <= sesoi,
      power: testPower(n, alpha, sesoi),
      alternativeShift: Math.sqrt(n) * sesoi,
      expectedFalse: tests * alpha,
      fwerIndependent: 1 - Math.pow(1 - alpha, tests),
      bonferroniAlpha: bonferroniAlpha,
      bonferroniReject: p < bonferroniAlpha
    };
  }

  function copyPreset(preset) {
    return { id: preset.id, label: preset.label, n: preset.n, mean: preset.mean, alpha: preset.alpha, sesoi: preset.sesoi, tests: preset.tests };
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; if (!condition) throw new Error(message); }
    function close(actual, expected, tolerance, message) { check(Math.abs(actual - expected) <= tolerance, message + ": " + actual); }
    close(normalCDF(0), 0.5, 2e-7, "Phi zero");
    close(inverseNormal(0.975), 1.959964, 3e-4, "critical 0.975");
    close(testPower(100, 0.05, 0), 0.05, 2e-5, "null rejection equals alpha");
    var nullLike = analyze(PRESETS[0]);
    close(nullLike.p, 0.75183, 4e-4, "null-like p");
    check(!nullLike.reject && !nullLike.practical, "null-like decisions");
    var borderline = analyze(PRESETS[1]);
    close(borderline.p, 0.04910, 4e-4, "borderline p");
    check(borderline.reject && !borderline.practical, "significance is not importance");
    var tiny = analyze(PRESETS[2]);
    check(tiny.reject && !tiny.practical && tiny.insideBand, "large n tiny effect");
    var important = analyze(PRESETS[3]);
    check(important.reject && important.practical && important.ci[0] > important.sesoi, "important effect evidence");
    var lowPower = analyze(PRESETS[4]);
    check(!lowPower.reject && lowPower.power < 0.2, "low power preset");
    var selected = analyze(PRESETS[5]);
    close(selected.expectedFalse, 1, 1e-12, "expected false positives");
    close(selected.fwerIndependent, 0.6415140776, 1e-9, "independent FWER");
    close(selected.bonferroniAlpha, 0.0025, 1e-12, "Bonferroni threshold");
    check(selected.reject && !selected.bonferroniReject, "single vs family decision");
    PRESETS.forEach(function (preset) {
      var result = analyze(preset);
      check(result.reject === !(result.ci[0] <= 0 && result.ci[1] >= 0), preset.id + " CI duality");
    });
    close(analyze({ n: 80, mean: -0.22, alpha: 0.05, sesoi: 0.2, tests: 1 }).p, borderline.p, 1e-12, "two-sided symmetry");
    check(testPower(400, 0.05, 0.2) > testPower(40, 0.05, 0.2), "power rises with n in fixed model");
    return { checks: checks, presets: PRESETS.length };
  }

  function element(doc, tag, className, value) {
    var node = doc.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) node.textContent = value;
    return node;
  }

  function svgNode(doc, tag, attrs, value) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, String(attrs[key])); });
    if (value !== undefined) node.textContent = value;
    return node;
  }

  function installStyles(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    var style = element(doc, "style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }

  function format(value, digits) {
    if (!Number.isFinite(value)) return "-";
    if (Math.abs(value) > 0 && Math.abs(value) < 0.0001) return value.toExponential(2);
    return value.toFixed(digits === undefined ? 3 : digits).replace(/0+$/, "").replace(/\.$/, "");
  }

  function curvePath(mean, mapX, mapY) {
    var path = "";
    for (var index = 0; index <= 180; index += 1) {
      var x = -6 + 12 * index / 180;
      path += (index ? "L" : "M") + mapX(x).toFixed(2) + " " + mapY(normalPDF(x, mean)).toFixed(2) + " ";
    }
    return path;
  }

  function distributionSvg(doc, result) {
    var left = 48, right = 578, top = 35, bottom = 270;
    var mapX = function (value) { return left + (value + 6) / 12 * (right - left); };
    var mapY = function (value) { return bottom - value / 0.43 * (bottom - top); };
    var svg = svgNode(doc, "svg", { viewBox: "0 0 600 320", role: "img", "aria-label": "零假设与指定备择下的 z 统计量分布" });
    svg.appendChild(svgNode(doc, "title", {}, "z 检验的零分布、备择分布与拒绝域"));
    var critical = Math.min(6, result.critical);
    svg.appendChild(svgNode(doc, "rect", { x: left, y: top, width: Math.max(0, mapX(-critical) - left), height: bottom - top, class: "ht-reject" }));
    svg.appendChild(svgNode(doc, "rect", { x: mapX(critical), y: top, width: Math.max(0, right - mapX(critical)), height: bottom - top, class: "ht-reject" }));
    [0, 0.2, 0.4].forEach(function (tick) {
      var y = mapY(tick);
      svg.appendChild(svgNode(doc, "line", { x1: left, y1: y, x2: right, y2: y, class: "ht-grid" }));
      svg.appendChild(svgNode(doc, "text", { x: left - 7, y: y + 4, "font-size": 10, "text-anchor": "end" }, format(tick, 1)));
    });
    [-6, -3, 0, 3, 6].forEach(function (tick) {
      var x = mapX(tick);
      svg.appendChild(svgNode(doc, "line", { x1: x, y1: top, x2: x, y2: bottom, class: "ht-grid" }));
      svg.appendChild(svgNode(doc, "text", { x: x, y: bottom + 18, "font-size": 10, "text-anchor": "middle" }, String(tick)));
    });
    svg.appendChild(svgNode(doc, "path", { d: curvePath(0, mapX, mapY), class: "ht-null" }));
    svg.appendChild(svgNode(doc, "path", { d: curvePath(result.alternativeShift, mapX, mapY), class: "ht-alt" }));
    var observed = clamp(result.z, -6, 6);
    svg.appendChild(svgNode(doc, "line", { x1: mapX(observed), y1: top, x2: mapX(observed), y2: bottom, class: "ht-observed" }));
    svg.appendChild(svgNode(doc, "text", { x: left, y: 20, "font-size": 12, "font-weight": 700 }, "蓝：H0；金：mu=最小重要差异；红虚线：观测 z"));
    svg.appendChild(svgNode(doc, "text", { x: right, y: bottom + 38, "font-size": 10, "text-anchor": "end" }, "z（视窗 -6 到 6）"));
    if (Math.abs(result.z) > 6 || result.alternativeShift > 6) svg.appendChild(svgNode(doc, "text", { x: right, y: 20, "font-size": 10, "text-anchor": "end" }, "超出视窗的中心已截在边缘"));
    return svg;
  }

  function metric(doc, label, value) {
    var item = element(doc, "div", "ht-metric");
    item.appendChild(element(doc, "span", "", label));
    item.appendChild(element(doc, "strong", "", value));
    return item;
  }

  function decisionLabel(result) { return result.reject ? "拒绝 H0" : "不拒绝 H0"; }

  function practicalLabel(result) {
    if (result.practical) return "越过重要阈值";
    if (result.insideBand) return "区间落在阈值带内";
    return "实际重要性未建立";
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    installStyles(doc);
    var state = copyPreset(PRESETS[1]);
    var prediction = { decision: null, practical: null };
    var revealed = false;
    var shell = element(doc, "div", "ht-lab");
    shell.appendChild(element(doc, "p", "ht-note", "已知 sigma=1 的双侧 z 检验。先判断单项显著性与实际重要性，再看五本账。"));
    var presets = element(doc, "div", "ht-presets");
    var presetButtons = [];
    PRESETS.forEach(function (preset) {
      var button = element(doc, "button", "", preset.label);
      button.type = "button";
      button.addEventListener("click", function () {
        state = copyPreset(preset); prediction = { decision: null, practical: null }; revealed = false; sync(); render();
      });
      presetButtons.push({ id: preset.id, node: button }); presets.appendChild(button);
    });
    shell.appendChild(presets);

    var controls = element(doc, "div", "ht-controls");
    var inputs = {};
    function changeState(key, value) {
      state[key] = Number(value); state.id = "custom"; prediction = { decision: null, practical: null }; revealed = false; render();
    }
    function addNumber(key, label, min, max, step) {
      var wrap = element(doc, "div", "ht-control");
      var textLabel = element(doc, "label", "", label);
      var input = element(doc, "input");
      input.type = "number"; input.min = min; input.max = max; input.step = step; input.setAttribute("aria-label", label);
      input.addEventListener("input", function () { if (input.value !== "") changeState(key, input.value); });
      wrap.appendChild(textLabel); wrap.appendChild(input); controls.appendChild(wrap); inputs[key] = { input: input };
    }
    function addRange(key, label, min, max, step, digits) {
      var wrap = element(doc, "div", "ht-control");
      var textLabel = element(doc, "label", "", label + "：");
      var output = element(doc, "output");
      var input = element(doc, "input");
      input.type = "range"; input.min = min; input.max = max; input.step = step; input.setAttribute("aria-label", label);
      input.addEventListener("input", function () { changeState(key, input.value); });
      textLabel.appendChild(output); wrap.appendChild(textLabel); wrap.appendChild(input); controls.appendChild(wrap); inputs[key] = { input: input, output: output, digits: digits };
    }
    addNumber("n", "样本量 n", 4, 10000, 1);
    addRange("mean", "观测均值", -0.5, 0.5, 0.01, 2);
    addRange("alpha", "单项 alpha", 0.01, 0.10, 0.01, 2);
    addRange("sesoi", "最小重要差异", 0.05, 0.40, 0.01, 2);
    addNumber("tests", "同时检验数 m", 1, 100, 1);
    shell.appendChild(controls);

    var predict = element(doc, "div", "ht-predict");
    predict.appendChild(element(doc, "p", "ht-question", "先预测：按单项 alpha 是否拒绝 H0？"));
    var decisionChoices = element(doc, "div", "ht-choice");
    var practicalChoices = element(doc, "div", "ht-choice");
    var choiceButtons = [];
    [["decision", "reject", "拒绝 H0"], ["decision", "keep", "不拒绝 H0"]].forEach(function (item) {
      var button = element(doc, "button", "", item[2]); button.type = "button";
      button.addEventListener("click", function () { prediction[item[0]] = item[1]; renderPrediction(); });
      choiceButtons.push({ group: item[0], value: item[1], node: button }); decisionChoices.appendChild(button);
    });
    predict.appendChild(decisionChoices);
    predict.appendChild(element(doc, "p", "ht-question", "再预测：区间是否已完全越过实际重要阈值？"));
    [["practical", "yes", "已越过"], ["practical", "no", "尚未建立"]].forEach(function (item) {
      var button = element(doc, "button", "", item[2]); button.type = "button";
      button.addEventListener("click", function () { prediction[item[0]] = item[1]; renderPrediction(); });
      choiceButtons.push({ group: item[0], value: item[1], node: button }); practicalChoices.appendChild(button);
    });
    predict.appendChild(practicalChoices);
    var actions = element(doc, "div", "ht-actions");
    var checkButton = element(doc, "button", "cl-primary", "核对预测"); checkButton.type = "button";
    var resetButton = element(doc, "button", "", "重置本预设"); resetButton.type = "button";
    actions.appendChild(checkButton); actions.appendChild(resetButton); predict.appendChild(actions);
    var feedback = element(doc, "p", "ht-feedback", "请完成两项预测。");
    predict.appendChild(feedback); shell.appendChild(predict);
    var results = element(doc, "div"); results.hidden = true; shell.appendChild(results); root.replaceChildren(shell);

    checkButton.addEventListener("click", function () {
      if (!prediction.decision || !prediction.practical) {
        feedback.textContent = "请先完成显著性与实际重要性两项预测。"; feedback.className = "ht-feedback ht-warn"; return;
      }
      revealed = true; render();
    });
    resetButton.addEventListener("click", function () {
      var preset = PRESETS.filter(function (item) { return item.id === state.id; })[0] || PRESETS[1];
      state = copyPreset(preset); prediction = { decision: null, practical: null }; revealed = false; sync(); render();
    });

    function sync() {
      Object.keys(inputs).forEach(function (key) {
        inputs[key].input.value = String(state[key]);
        if (inputs[key].output) inputs[key].output.textContent = format(state[key], inputs[key].digits);
      });
    }
    function renderPrediction() {
      choiceButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", prediction[item.group] === item.value ? "true" : "false"); });
    }
    function render() {
      sync(); renderPrediction();
      presetButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", state.id === item.id ? "true" : "false"); });
      if (!revealed) {
        results.hidden = true;
        feedback.textContent = prediction.decision && prediction.practical ? "预测已记录，点击“核对预测”打开账本。" : "请完成两项预测。";
        feedback.className = "ht-feedback"; return;
      }
      var data = analyze(state);
      var decisionCorrect = prediction.decision === (data.reject ? "reject" : "keep");
      var practicalCorrect = prediction.practical === (data.practical ? "yes" : "no");
      feedback.textContent = (decisionCorrect && practicalCorrect ? "两项预测都命中。" : "请对照拒绝规则与区间阈值。") + " 当前：" + decisionLabel(data) + "；" + practicalLabel(data) + "。";
      feedback.className = "ht-feedback " + (decisionCorrect && practicalCorrect ? "ht-pass" : "ht-warn");
      if (api && api.announce) api.announce(root, feedback.textContent);
      results.hidden = false; results.replaceChildren();
      var metrics = element(doc, "div", "ht-metrics");
      metrics.appendChild(metric(doc, "观测 z", format(data.z, 3)));
      metrics.appendChild(metric(doc, "双侧 p", format(data.p, 5)));
      metrics.appendChild(metric(doc, "单项决策", decisionLabel(data)));
      metrics.appendChild(metric(doc, format((1 - data.alpha) * 100, 0) + "% CI", "[" + format(data.ci[0], 3) + ", " + format(data.ci[1], 3) + "]"));
      metrics.appendChild(metric(doc, "在最小重要差异处的功效", format(100 * data.power, 1) + "%"));
      metrics.appendChild(metric(doc, "实际意义", practicalLabel(data)));
      metrics.appendChild(metric(doc, "期望假阳性数 m alpha", format(data.expectedFalse, 2)));
      metrics.appendChild(metric(doc, "独立时 FWER", format(100 * data.fwerIndependent, 1) + "%"));
      metrics.appendChild(metric(doc, "Bonferroni 单项阈值", format(data.bonferroniAlpha, 5)));
      metrics.appendChild(metric(doc, "Bonferroni 决策", data.bonferroniReject ? "拒绝" : "不拒绝"));
      results.appendChild(metrics); results.appendChild(distributionSvg(doc, data));
      var wrap = element(doc, "div", "ht-ledger");
      var table = element(doc, "table"); table.setAttribute("aria-label", "假设检验透明账本");
      var thead = element(doc, "thead"), head = element(doc, "tr");
      ["账本", "当前问题", "可回答", "不能回答"].forEach(function (label) { var th = element(doc, "th", "", label); th.scope = "col"; head.appendChild(th); });
      thead.appendChild(head); table.appendChild(thead); var body = element(doc, "tbody");
      [
        ["单项检验", "H0 下观测是否极端", decisionLabel(data) + "，p=" + format(data.p, 5), "H0 为真的概率"],
        ["区间/效应", "与哪些 mu 相容", "CI=" + format(data.ci[0], 3) + " 到 " + format(data.ci[1], 3), "领域阈值是否合理"],
        ["功效", "若 mu=最小重要差异", format(100 * data.power, 1) + "% 的长期拒绝率", "本次发现为真的概率"],
        ["多重性", "同时筛选 " + data.tests + " 项", "E[V]=" + format(data.expectedFalse, 2) + "；独立 FWER=" + format(100 * data.fwerIndependent, 1) + "%", "事后选择可忽略"],
        ["家族校正", "Bonferroni alpha/m", data.bonferroniReject ? "仍拒绝" : "不再拒绝", "所有检验都独立"]
      ].forEach(function (row) { var tr = element(doc, "tr"); row.forEach(function (value) { tr.appendChild(element(doc, "td", "", value)); }); body.appendChild(tr); });
      table.appendChild(body); wrap.appendChild(table); results.appendChild(wrap);
      results.appendChild(element(doc, "p", "ht-note", "图中金线只表示预先指定的 mu=最小重要差异；若它的中心超出 z 视窗，曲线会在边缘外。FWER 的闭式值使用独立空检验，Bonferroni 上界不要求独立。"));
    }
    sync(); render();
  }

  var exported = { PRESETS: PRESETS, normalCDF: normalCDF, inverseNormal: inverseNormal, testPower: testPower, analyze: analyze, selfTest: selfTest };
  if (typeof module !== "undefined" && module.exports) module.exports = exported;
  if (host && host.CourseLearning && typeof host.CourseLearning.register === "function") host.CourseLearning.register("hypothesis-testing", mount);
  if (typeof module !== "undefined" && module.exports && typeof require !== "undefined" && require.main === module) {
    try {
      var report = selfTest();
      console.log("hypothesis-testing self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("hypothesis-testing self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null);
