(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("materials-characterization", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("materials-characterization self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("materials-characterization self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var STYLE_ID = "cl-materials-characterization-styles";
  var SOURCE_WAVELENGTHS = {
    cu: { label: "Cu Kα", wavelengthNm: 0.15406 },
    co: { label: "Co Kα", wavelengthNm: 0.17902 }
  };
  var DEFAULTS = {
    source: "cu",
    dSpacingNm: 0.2088,
    order: 1,
    observedFwhmDeg: 0.35,
    instrumentFwhmDeg: 0.12,
    shapeFactor: 0.9,
    peakCount: 1,
    semEvidence: false,
    edsEvidence: false
  };

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function near(a, b, tolerance) {
    return Math.abs(a - b) <= (tolerance || 1e-8);
  }

  function format(value, digits) {
    if (value === Infinity) return "仪器展宽限";
    if (!finite(value)) return "-";
    var places = digits === undefined ? 3 : digits;
    if (places === 0) return value.toFixed(0);
    if (value !== 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) return value.toExponential(Math.min(places, 4));
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function source(sourceId) {
    var item = SOURCE_WAVELENGTHS[sourceId];
    if (!item) throw new RangeError("未知的 X 射线源。");
    return item;
  }

  function braggThetaDeg(wavelengthNm, dSpacingNm, order) {
    if (!finite(wavelengthNm) || wavelengthNm <= 0) throw new RangeError("波长必须为正，单位为 nm。");
    if (!finite(dSpacingNm) || dSpacingNm <= 0) throw new RangeError("晶面间距必须为正，单位为 nm。");
    if (!finite(order) || order <= 0 || Math.floor(order) !== order) throw new RangeError("衍射级次必须为正整数。");
    var ratio = order * wavelengthNm / (2 * dSpacingNm);
    if (ratio > 1 || ratio < 0) throw new RangeError("Bragg 条件无实数角度：nλ/(2d) 必须在 [0,1] 内。");
    return Math.asin(ratio) * 180 / Math.PI;
  }

  function braggTwoThetaDeg(wavelengthNm, dSpacingNm, order) {
    return 2 * braggThetaDeg(wavelengthNm, dSpacingNm, order);
  }

  function dSpacingFromTwoTheta(wavelengthNm, twoThetaDeg, order) {
    if (!finite(wavelengthNm) || wavelengthNm <= 0) throw new RangeError("波长必须为正。");
    if (!finite(twoThetaDeg) || twoThetaDeg <= 0 || twoThetaDeg >= 180) throw new RangeError("2θ 必须在 0 到 180° 之间。");
    if (!finite(order) || order <= 0 || Math.floor(order) !== order) throw new RangeError("衍射级次必须为正整数。");
    return order * wavelengthNm / (2 * Math.sin(twoThetaDeg * Math.PI / 360));
  }

  function scherrerSizeNm(wavelengthNm, twoThetaDeg, observedFwhmDeg, instrumentFwhmDeg, shapeFactor) {
    if (!finite(wavelengthNm) || wavelengthNm <= 0) throw new RangeError("波长必须为正。");
    if (!finite(twoThetaDeg) || twoThetaDeg <= 0 || twoThetaDeg >= 180) throw new RangeError("2θ 必须在 0 到 180° 之间。");
    if (!finite(observedFwhmDeg) || observedFwhmDeg <= 0) throw new RangeError("观测峰宽必须为正，单位为度。");
    if (!finite(instrumentFwhmDeg) || instrumentFwhmDeg < 0) throw new RangeError("仪器峰宽必须非负，单位为度。");
    if (observedFwhmDeg < instrumentFwhmDeg) throw new RangeError("观测峰宽不能小于仪器展宽。");
    var K = shapeFactor === undefined ? DEFAULTS.shapeFactor : shapeFactor;
    if (!finite(K) || K <= 0) throw new RangeError("Scherrer 形状因子必须为正。");
    var observedRad = observedFwhmDeg * Math.PI / 180;
    var instrumentRad = instrumentFwhmDeg * Math.PI / 180;
    var sampleRad = Math.sqrt(Math.max(0, observedRad * observedRad - instrumentRad * instrumentRad));
    if (sampleRad === 0) return { sizeNm: Infinity, sampleBroadeningRad: 0, thetaDeg: twoThetaDeg / 2 };
    var thetaRad = twoThetaDeg * Math.PI / 360;
    return {
      sizeNm: K * wavelengthNm / (sampleRad * Math.cos(thetaRad)),
      sampleBroadeningRad: sampleRad,
      thetaDeg: twoThetaDeg / 2
    };
  }

  function evidenceLedger(input) {
    var peaks = input && input.peakCount !== undefined ? Number(input.peakCount) : DEFAULTS.peakCount;
    var sem = Boolean(input && input.semEvidence);
    var eds = Boolean(input && input.edsEvidence);
    if (!finite(peaks) || peaks < 1 || Math.floor(peaks) !== peaks) throw new RangeError("峰数必须是正整数。");
    var rows = [
      { method: "XRD", evidence: peaks + " 个峰", limit: peaks < 2 ? "单峰不能充分定相" : peaks < 3 ? "初步指纹，仍不足" : "多峰指纹支持候选相" },
      { method: "SEM", evidence: sem ? "已加入形貌/断口证据" : "未加入", limit: "局部形貌，不直接给晶体结构" },
      { method: "EDS", evidence: eds ? "已加入元素组成证据" : "未加入", limit: "元素证据，不等于物相唯一证明" }
    ];
    var sufficient = peaks >= 3;
    return {
      peakCount: peaks,
      semEvidence: sem,
      edsEvidence: eds,
      sufficientForPhaseClaim: sufficient,
      verdict: sufficient ? "多峰 XRD 可支持候选相；SEM/EDS 用于交叉核对" : (sem || eds ? "单峰仍不足；SEM/EDS 只能补充证据链" : "单峰不能充分定相"),
      rows: rows
    };
  }

  function copyDefaults() {
    var copy = {};
    Object.keys(DEFAULTS).forEach(function (key) { copy[key] = DEFAULTS[key]; });
    return copy;
  }

  function characterizationLedger(input) {
    var p = copyDefaults();
    Object.keys(input || {}).forEach(function (key) { if (p[key] !== undefined) p[key] = input[key]; });
    p.dSpacingNm = Number(p.dSpacingNm);
    p.order = Number(p.order);
    p.observedFwhmDeg = Number(p.observedFwhmDeg);
    p.instrumentFwhmDeg = Number(p.instrumentFwhmDeg);
    p.shapeFactor = Number(p.shapeFactor);
    p.peakCount = Number(p.peakCount);
    var sourceInfo = source(p.source);
    var thetaDeg = braggThetaDeg(sourceInfo.wavelengthNm, p.dSpacingNm, p.order);
    var twoThetaDeg = 2 * thetaDeg;
    var scherrer = scherrerSizeNm(sourceInfo.wavelengthNm, twoThetaDeg, p.observedFwhmDeg, p.instrumentFwhmDeg, p.shapeFactor);
    var evidence = evidenceLedger(p);
    return {
      source: p.source,
      sourceLabel: sourceInfo.label,
      wavelengthNm: sourceInfo.wavelengthNm,
      dSpacingNm: p.dSpacingNm,
      order: p.order,
      thetaDeg: thetaDeg,
      twoThetaDeg: twoThetaDeg,
      observedFwhmDeg: p.observedFwhmDeg,
      instrumentFwhmDeg: p.instrumentFwhmDeg,
      sampleBroadeningRad: scherrer.sampleBroadeningRad,
      shapeFactor: p.shapeFactor,
      crystalliteSizeNm: scherrer.sizeNm,
      evidence: evidence
    };
  }

  function element(doc, tag, className, text) {
    var item = doc.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined) item.textContent = text;
    return item;
  }

  function svgElement(doc, tag, attrs, text) {
    var item = doc.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.keys(attrs || {}).forEach(function (key) { item.setAttribute(key, String(attrs[key])); });
    if (text !== undefined) item.textContent = text;
    return item;
  }

  function ensureStyles(doc) {
    if (!doc || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="materials-characterization"]{--mc-accent:#2563eb;--mc-peak:#b64335;--mc-eds:#39734d;--mc-gold:#9b6a12;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="materials-characterization"] *{box-sizing:border-box}' +
      '[data-learning-lab="materials-characterization"] [hidden]{display:none!important}' +
      '[data-learning-lab="materials-characterization"] .mc-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-items:end}' +
      '[data-learning-lab="materials-characterization"] label{display:grid;gap:6px;font-weight:700;min-width:0}' +
      '[data-learning-lab="materials-characterization"] output{color:var(--mc-accent);font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="materials-characterization"] input,[data-learning-lab="materials-characterization"] select,[data-learning-lab="materials-characterization"] button{min-height:44px;font:inherit}' +
      '[data-learning-lab="materials-characterization"] input[type="range"],[data-learning-lab="materials-characterization"] select{width:100%;accent-color:var(--mc-accent)}' +
      '[data-learning-lab="materials-characterization"] select{padding:7px 10px;border:1px solid var(--border,currentColor);border-radius:6px;background:var(--bg,Canvas);color:inherit}' +
      '[data-learning-lab="materials-characterization"] button{min-width:0;padding:8px 12px;border:1px solid var(--border,currentColor);border-radius:6px;background:var(--bg,Canvas);color:inherit;cursor:pointer;overflow-wrap:anywhere}' +
      '[data-learning-lab="materials-characterization"] button:hover,[data-learning-lab="materials-characterization"] button[aria-pressed="true"]{border-color:var(--mc-accent);background:var(--mc-accent);color:#fff}' +
      '[data-learning-lab="materials-characterization"] button:focus-visible,[data-learning-lab="materials-characterization"] input:focus-visible,[data-learning-lab="materials-characterization"] select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}' +
      '[data-learning-lab="materials-characterization"] .mc-question{margin:16px 0 8px;font-weight:750}' +
      '[data-learning-lab="materials-characterization"] .mc-options,[data-learning-lab="materials-characterization"] .mc-actions,[data-learning-lab="materials-characterization"] .mc-evidence{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}' +
      '[data-learning-lab="materials-characterization"] .mc-evidence label{display:flex;grid-template-columns:auto 1fr;align-items:center;gap:7px;padding:4px 8px;border:1px solid var(--border,currentColor);border-radius:6px;font-weight:650}' +
      '[data-learning-lab="materials-characterization"] .mc-evidence input{width:22px;height:22px;min-height:22px}' +
      '[data-learning-lab="materials-characterization"] .mc-feedback{min-height:2em;margin:8px 0;font-weight:700}' +
      '[data-learning-lab="materials-characterization"] .mc-good{color:var(--cl-green,#39734d)}[data-learning-lab="materials-characterization"] .mc-warn{color:var(--cl-red,#b64335)}' +
      '[data-learning-lab="materials-characterization"] .mc-grid{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(245px,.8fr);gap:16px;align-items:start;margin-top:16px}' +
      '[data-learning-lab="materials-characterization"] .mc-chart{min-width:0;padding:6px;border:1px solid var(--border,currentColor);border-radius:6px;background:var(--bg,Canvas)}' +
      '[data-learning-lab="materials-characterization"] svg{display:block;width:100%;height:auto;aspect-ratio:620/370}' +
      '[data-learning-lab="materials-characterization"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="materials-characterization"] .mc-table-wrap{max-width:100%;overflow-x:auto}' +
      '[data-learning-lab="materials-characterization"] table{width:100%;border-collapse:collapse;min-width:430px}' +
      '[data-learning-lab="materials-characterization"] th,[data-learning-lab="materials-characterization"] td{padding:7px 8px;border-bottom:1px solid var(--border,currentColor);text-align:left;vertical-align:top;font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="materials-characterization"] .mc-note{margin-top:12px;padding:10px 12px;border-left:4px solid var(--mc-gold);color:var(--fg-soft,currentColor);font-size:13px}' +
      '@media(max-width:760px){[data-learning-lab="materials-characterization"] .mc-controls,[data-learning-lab="materials-characterization"] .mc-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}' +
      '@media(max-width:540px){[data-learning-lab="materials-characterization"] .mc-controls,[data-learning-lab="materials-characterization"] .mc-grid{grid-template-columns:1fr}}' +
      '@media(prefers-reduced-motion:reduce){[data-learning-lab="materials-characterization"] *{scroll-behavior:auto!important;transition:none!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }

  function gaussian(x, sigma) {
    return Math.exp(-0.5 * Math.pow(x / sigma, 2));
  }

  function renderSvg(doc, result) {
    var svg = svgElement(doc, "svg", { viewBox: "0 0 620 370", role: "img", "aria-label": "XRD 峰位与峰宽示意" });
    svg.appendChild(svgElement(doc, "title", {}, "Bragg 峰位、观测峰宽与仪器展宽"));
    var left = 55, right = 585, top = 42, bottom = 318;
    var minAngle = Math.max(1, result.twoThetaDeg - 4);
    var maxAngle = Math.min(179, result.twoThetaDeg + 4);
    var maximum = 1.12;
    function mapX(angle) { return left + (right - left) * (angle - minAngle) / (maxAngle - minAngle); }
    function mapY(intensity) { return bottom - (bottom - top) * intensity / maximum; }
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, stroke: "currentColor", "stroke-width": 1.2 }));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: left, y2: top, stroke: "currentColor", "stroke-width": 1.2 }));
    var observedSigma = Math.max(result.observedFwhmDeg / 2.355, 0.01);
    var instrumentSigma = Math.max(result.instrumentFwhmDeg / 2.355, 0.01);
    var observedPath = [];
    var instrumentPath = [];
    for (var index = 0; index <= 160; index += 1) {
      var angle = minAngle + (maxAngle - minAngle) * index / 160;
      var observed = gaussian(angle - result.twoThetaDeg, observedSigma);
      var instrument = 0.62 * gaussian(angle - result.twoThetaDeg, instrumentSigma);
      observedPath.push((index ? "L" : "M") + mapX(angle).toFixed(2) + " " + mapY(observed).toFixed(2));
      instrumentPath.push((index ? "L" : "M") + mapX(angle).toFixed(2) + " " + mapY(instrument).toFixed(2));
    }
    svg.appendChild(svgElement(doc, "path", { d: observedPath.join(" "), fill: "none", stroke: "#b64335", "stroke-width": 3 }));
    svg.appendChild(svgElement(doc, "path", { d: instrumentPath.join(" "), fill: "none", stroke: "#2563eb", "stroke-width": 2, "stroke-dasharray": "6 4" }));
    svg.appendChild(svgElement(doc, "line", { x1: mapX(result.twoThetaDeg), y1: top, x2: mapX(result.twoThetaDeg), y2: bottom, stroke: "#39734d", "stroke-dasharray": "4 5" }));
    svg.appendChild(svgElement(doc, "text", { x: 58, y: 25, "font-size": 14, "font-weight": 700 }, "红：观测峰　蓝虚线：仪器　绿：Bragg 2θ"));
    svg.appendChild(svgElement(doc, "text", { x: 560, y: 344, "font-size": 12, "text-anchor": "end" }, "2θ / °"));
    svg.appendChild(svgElement(doc, "text", { x: 21, y: 54, "font-size": 12, transform: "rotate(-90 21 54)" }, "强度"));
    return svg;
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument;
    ensureStyles(doc);
    var state = copyDefaults();
    var prediction = null;
    var revealed = false;
    var feedbackText = "先判断单峰是否足以定相，再揭示峰位与证据账本。";
    var feedbackClass = "mc-feedback";
    var shell = element(doc, "div", "mc-lab");
    shell.appendChild(element(doc, "p", "mc-kicker", "默认：Cu Kα、d = 0.2088 nm、观测 FWHM = 0.35°、仪器展宽 = 0.12°。"));
    var controls = element(doc, "div", "mc-controls");
    var inputs = {};
    var sourceLabel = element(doc, "label", "", "X 射线源");
    var sourceSelect = element(doc, "select", "");
    sourceSelect.setAttribute("aria-label", "X 射线源");
    Object.keys(SOURCE_WAVELENGTHS).forEach(function (key) {
      var option = element(doc, "option", "", SOURCE_WAVELENGTHS[key].label + "（" + SOURCE_WAVELENGTHS[key].wavelengthNm + " nm）");
      option.value = key;
      sourceSelect.appendChild(option);
    });
    sourceSelect.value = state.source;
    sourceLabel.appendChild(sourceSelect);
    controls.appendChild(sourceLabel);
    [["dSpacingNm", "晶面间距 d / nm", 0.14, 0.32, 0.001, 3], ["observedFwhmDeg", "观测 FWHM / °", 0.15, 1.2, 0.01, 2], ["instrumentFwhmDeg", "仪器展宽 / °", 0.05, 0.3, 0.01, 2], ["peakCount", "可见 XRD 峰数", 1, 4, 1, 0]].forEach(function (spec) {
      var label = element(doc, "label", "");
      var line = element(doc, "span", "", spec[1] + " = ");
      var output = element(doc, "output", "", format(state[spec[0]], spec[5]));
      line.appendChild(output);
      var input = element(doc, "input", "");
      input.type = "range";
      input.min = String(spec[2]);
      input.max = String(spec[3]);
      input.step = String(spec[4]);
      input.value = String(state[spec[0]]);
      input.setAttribute("aria-label", spec[1]);
      input.addEventListener("input", function () {
        state[spec[0]] = Number(input.value);
        prediction = null;
        revealed = false;
        feedbackText = "参数已改变，请重新作答。";
        feedbackClass = "mc-feedback mc-warn";
        render();
      });
      label.appendChild(line);
      label.appendChild(input);
      controls.appendChild(label);
      inputs[spec[0]] = { input: input, output: output, digits: spec[5] };
    });
    shell.appendChild(controls);
    var evidenceControls = element(doc, "div", "mc-evidence");
    [["semEvidence", "加入 SEM 形貌证据"], ["edsEvidence", "加入 EDS 元素证据"]].forEach(function (item) {
      var label = element(doc, "label", "");
      var input = element(doc, "input", "");
      input.type = "checkbox";
      input.checked = state[item[0]];
      input.setAttribute("aria-label", item[1]);
      input.addEventListener("change", function () {
        state[item[0]] = input.checked;
        prediction = null;
        revealed = false;
        feedbackText = "证据设置已改变，请重新作答。";
        feedbackClass = "mc-feedback mc-warn";
        render();
      });
      label.appendChild(input);
      label.appendChild(doc.createTextNode(item[1]));
      evidenceControls.appendChild(label);
    });
    shell.appendChild(evidenceControls);
    shell.appendChild(element(doc, "p", "mc-question", "预测门：仅凭一个 XRD 峰，能否充分定相？"));
    var options = element(doc, "div", "mc-options");
    var optionButtons = [];
    [["insufficient", "不能：需要多峰与交叉证据"], ["position", "能：峰位精确就足够"], ["width", "能：峰宽直接给出物相"]].forEach(function (item) {
      var button = element(doc, "button", "", item[1]);
      button.type = "button";
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", function () {
        prediction = item[0];
        feedbackText = "预测已记录；点击“揭示并核对”查看 Bragg、Scherrer 与证据账本。";
        feedbackClass = "mc-feedback";
        render();
      });
      options.appendChild(button);
      optionButtons.push({ value: item[0], node: button });
    });
    shell.appendChild(options);
    var actions = element(doc, "div", "mc-actions");
    var reveal = element(doc, "button", "", "揭示并核对");
    reveal.type = "button";
    reveal.className = "mc-primary";
    var reset = element(doc, "button", "", "重置");
    reset.type = "button";
    actions.appendChild(reveal);
    actions.appendChild(reset);
    shell.appendChild(actions);
    var feedback = element(doc, "p", feedbackClass, feedbackText);
    feedback.setAttribute("aria-live", "polite");
    shell.appendChild(feedback);
    var resultPanel = element(doc, "div", "mc-result");
    resultPanel.hidden = true;
    var grid = element(doc, "div", "mc-grid");
    var chart = element(doc, "div", "mc-chart");
    var tableWrap = element(doc, "div", "mc-table-wrap");
    var table = element(doc, "table");
    tableWrap.appendChild(table);
    grid.appendChild(chart);
    grid.appendChild(tableWrap);
    resultPanel.appendChild(grid);
    resultPanel.appendChild(element(doc, "p", "mc-note", "Bragg 峰位给 d 与 2θ 的几何关系；Scherrer 尺寸还依赖形状因子、峰拟合、应变和仪器展宽校正。EDS 告诉元素，SEM 告诉局部形貌；它们都不能把单峰自动变成唯一物相证明。"));
    shell.appendChild(resultPanel);
    root.replaceChildren(shell);

    sourceSelect.addEventListener("change", function () {
      state.source = sourceSelect.value;
      prediction = null;
      revealed = false;
      feedbackText = "参数已改变，请重新作答。";
      feedbackClass = "mc-feedback mc-warn";
      render();
    });
    reveal.addEventListener("click", function () {
      if (prediction === null) {
        feedbackText = "请先回答单峰定相问题。";
        feedbackClass = "mc-feedback mc-warn";
        render();
        return;
      }
      try {
        var result = characterizationLedger(state);
        var correct = prediction === "insufficient";
        revealed = true;
        feedbackText = (correct ? "预测命中。" : "预测未命中；峰位、峰宽和物相证据回答的是不同问题。") + " 当前证据结论：" + result.evidence.verdict + "。";
        feedbackClass = "mc-feedback " + (correct ? "mc-good" : "mc-warn");
        render();
        if (api && api.announce) api.announce(root, feedbackText);
      } catch (error) {
        feedbackText = "输入无效：" + error.message;
        feedbackClass = "mc-feedback mc-warn";
        render();
      }
    });
    reset.addEventListener("click", function () {
      state = copyDefaults();
      prediction = null;
      revealed = false;
      feedbackText = "先判断单峰是否足以定相，再揭示峰位与证据账本。";
      feedbackClass = "mc-feedback";
      render();
    });

    function render() {
      sourceSelect.value = state.source;
      Object.keys(inputs).forEach(function (key) {
        inputs[key].input.value = String(state[key]);
        inputs[key].output.textContent = format(state[key], inputs[key].digits);
      });
      evidenceControls.querySelectorAll('input[type="checkbox"]').forEach(function (input, index) { input.checked = index === 0 ? state.semEvidence : state.edsEvidence; });
      optionButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", prediction === item.value ? "true" : "false"); });
      feedback.textContent = feedbackText;
      feedback.className = feedbackClass;
      resultPanel.hidden = !revealed;
      if (revealed) {
        var result = characterizationLedger(state);
        chart.replaceChildren(renderSvg(doc, result));
        var rows = result.evidence.rows.map(function (row) { return "<tr><td>" + row.method + "</td><td>" + row.evidence + "</td><td>" + row.limit + "</td></tr>"; }).join("");
        table.innerHTML =
          "<caption>XRD—SEM/EDS 证据账本</caption>" +
          "<thead><tr><th>量/方法</th><th>结果</th><th>边界</th></tr></thead><tbody>" +
          "<tr><td>λ / n</td><td>" + format(result.wavelengthNm, 5) + " / " + result.order + "</td><td>nm / 级次</td></tr>" +
          "<tr><td>d</td><td>" + format(result.dSpacingNm, 4) + "</td><td>nm</td></tr>" +
          "<tr><td>θ / 2θ</td><td>" + format(result.thetaDeg, 3) + " / " + format(result.twoThetaDeg, 3) + "</td><td>度，Bragg 峰位</td></tr>" +
          "<tr><td>β_obs / β_inst</td><td>" + format(result.observedFwhmDeg, 3) + " / " + format(result.instrumentFwhmDeg, 3) + "</td><td>FWHM / °</td></tr>" +
          "<tr><td>β_sample</td><td>" + format(result.sampleBroadeningRad, 6) + "</td><td>弧度，平方差校正</td></tr>" +
          "<tr><td>Scherrer 尺寸</td><td>" + format(result.crystalliteSizeNm, 3) + "</td><td>nm，晶粒/相干衍射域的估计</td></tr>" +
          rows +
          "<tr><td>结论</td><td colspan=2>" + result.evidence.verdict + "</td></tr>" +
          "</tbody>";
      } else {
        chart.replaceChildren();
        table.replaceChildren();
      }
    }
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var theta = braggThetaDeg(0.15406, 0.2088, 1);
    check(theta > 21 && theta < 22, "Bragg angle for default spacing");
    check(near(braggTwoThetaDeg(0.15406, 0.2088, 1), 2 * theta, 1e-12), "two theta identity");
    check(near(dSpacingFromTwoTheta(0.15406, 2 * theta, 1), 0.2088, 1e-12), "Bragg inverse");
    var corrected = scherrerSizeNm(0.15406, 2 * theta, 0.35, 0.12, 0.9);
    var uncorrected = scherrerSizeNm(0.15406, 2 * theta, 0.35, 0, 0.9);
    check(corrected.sizeNm > 0 && corrected.sizeNm > uncorrected.sizeNm, "instrument broadening correction changes size");
    check(corrected.sampleBroadeningRad > 0, "sample broadening positive");
    var ledger = characterizationLedger(DEFAULTS);
    check(ledger.sourceLabel === "Cu Kα", "source ledger");
    check(ledger.evidence.verdict.indexOf("单峰") !== -1, "single peak boundary is explicit");
    check(ledger.evidence.sufficientForPhaseClaim === false, "single peak is insufficient");
    var multi = evidenceLedger({ peakCount: 3, semEvidence: true, edsEvidence: true });
    check(multi.sufficientForPhaseClaim === true, "multi-peak evidence branch");
    check(multi.rows.length === 3, "SEM EDS evidence rows");
    var instrumentLimited = scherrerSizeNm(0.15406, 45, 0.12, 0.12, 0.9);
    check(instrumentLimited.sizeNm === Infinity, "instrument-limited boundary");
    var threw = false;
    try { braggThetaDeg(0.3, 0.1, 1); } catch (error) { threw = true; }
    check(threw, "Bragg domain validation");
    threw = false;
    try { scherrerSizeNm(0.15406, 45, 0.1, 0.2, 0.9); } catch (error2) { threw = true; }
    check(threw, "instrument broadening validation");
    return { checks: checks };
  }

  return {
    DEFAULTS: copyDefaults(),
    SOURCE_WAVELENGTHS: SOURCE_WAVELENGTHS,
    braggThetaDeg: braggThetaDeg,
    braggTwoThetaDeg: braggTwoThetaDeg,
    dSpacingFromTwoTheta: dSpacingFromTwoTheta,
    scherrerSizeNm: scherrerSizeNm,
    evidenceLedger: evidenceLedger,
    characterizationLedger: characterizationLedger,
    mount: mount,
    selfTest: selfTest
  };
});
