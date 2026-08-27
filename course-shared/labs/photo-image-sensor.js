(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("photo-image-sensor", exported.mount);
  }
  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log("photo-image-sensor self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("photo-image-sensor self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-photo-image-sensor-styles";
  var SENSOR_WIDTH = 24;
  var DEFAULT = {
    architecture: "cmos",
    shutter: "rolling",
    color: "rgb",
    pixel: 3,
    photons: 3600,
    qe: 0.72,
    dark: 2,
    read: 3,
    fullWell: 30000,
    wavelength: 0.55,
    fNumber: 2.8,
    motion: 0.5
  };

  function finite(value) { return typeof value === "number" && isFinite(value); }
  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, value)); }
  function number(value, fallback) { var parsed = Number(value); return finite(parsed) ? parsed : fallback; }
  function near(left, right, tolerance) {
    return Math.abs(left - right) <= (tolerance || 1e-9) * Math.max(1, Math.abs(left), Math.abs(right));
  }
  function format(value, digits) {
    if (!finite(value)) return "—";
    var places = digits === undefined ? 2 : digits;
    var text = Math.abs(value) < 0.001 && value !== 0
      ? value.toExponential(Math.min(places, 4))
      : value.toFixed(places);
    return text.indexOf(".") === -1 ? text : text.replace(/0+$/, "").replace(/\.$/, "");
  }
  function copy(source) {
    var result = {};
    Object.keys(DEFAULT).forEach(function (key) { result[key] = source && source[key] !== undefined ? source[key] : DEFAULT[key]; });
    return result;
  }

  function evaluate(source) {
    var input = copy(source || {});
    var architecture = ["cmos", "ccd"].indexOf(input.architecture) >= 0 ? input.architecture : DEFAULT.architecture;
    var shutter = ["rolling", "global"].indexOf(input.shutter) >= 0 ? input.shutter : DEFAULT.shutter;
    var color = ["rgb", "mono"].indexOf(input.color) >= 0 ? input.color : DEFAULT.color;
    var pixel = clamp(number(input.pixel, DEFAULT.pixel), 1, 12);
    var photons = clamp(number(input.photons, DEFAULT.photons), 100, 10000);
    var qe = clamp(number(input.qe, DEFAULT.qe), 0.3, 1);
    var dark = clamp(number(input.dark, DEFAULT.dark), 0, 100);
    var read = clamp(number(input.read, DEFAULT.read), 0, 10);
    var fullWell = clamp(number(input.fullWell, DEFAULT.fullWell), 1000, 60000);
    var wavelength = clamp(number(input.wavelength, DEFAULT.wavelength), 0.4, 0.7);
    var fNumber = clamp(number(input.fNumber, DEFAULT.fNumber), 1.4, 8);
    var motion = clamp(number(input.motion, DEFAULT.motion), 0, 1);
    var colorShare = color === "mono" ? 1 : 1 / 3;
    var pixelAreaShare = pixel * pixel / (SENSOR_WIDTH * SENSOR_WIDTH);
    var incidentPhotons = photons * pixelAreaShare;
    var signal = incidentPhotons * qe * colorShare;
    var clippedSignal = Math.min(signal, fullWell);
    var shotVariance = signal;
    var readVariance = read * read;
    var totalVariance = shotVariance + dark + readVariance;
    var snr = clippedSignal / Math.sqrt(Math.max(1e-12, totalVariance));
    var binnedSignal = Math.min(signal * 4, fullWell);
    var binnedVariance = signal * 4 + dark * 4 + readVariance;
    var binnedSnr = binnedSignal / Math.sqrt(Math.max(1e-12, binnedVariance));
    var airyDiameter = 2.44 * wavelength * fNumber;
    var nyquist = 1000 / (2 * pixel);
    var samplingRatio = airyDiameter / (2 * pixel);
    var dynamicRange = 20 * Math.log10(fullWell / read);
    var rowTimeMs = architecture === "cmos" ? 0.18 : 0.42;
    var readoutParallelism = architecture === "cmos" ? 4 : 1;
    var readoutTimeMs = architecture === "cmos" ? 2.4 : 5.6;
    var skewMs = shutter === "rolling" ? motion * readoutTimeMs : 0;
    return {
      architecture: architecture,
      shutter: shutter,
      color: color,
      pixel: pixel,
      photons: photons,
      qe: qe,
      dark: dark,
      read: read,
      fullWell: fullWell,
      wavelength: wavelength,
      fNumber: fNumber,
      motion: motion,
      colorShare: colorShare,
      pixelAreaShare: pixelAreaShare,
      incidentPhotons: incidentPhotons,
      signal: signal,
      clippedSignal: clippedSignal,
      snr: snr,
      binnedSignal: binnedSignal,
      binnedSnr: binnedSnr,
      airyDiameter: airyDiameter,
      nyquist: nyquist,
      samplingRatio: samplingRatio,
      dynamicRange: dynamicRange,
      rowTimeMs: rowTimeMs,
      readoutParallelism: readoutParallelism,
      readoutTimeMs: readoutTimeMs,
      skewMs: skewMs,
      saturated: signal > fullWell,
      binnedSaturated: signal * 4 > fullWell,
      headline: architecture === "cmos" ? "并行读出" : "串行转移"
    };
  }

  function appendChildren(node, children) {
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : node.ownerDocument.createTextNode(String(child)));
    });
    return node;
  }
  function setAttributes(node, attrs) {
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", value);
      else if (key === "text") node.textContent = value;
      else node.setAttribute(key, value === true ? "" : String(value));
    });
    return node;
  }
  function element(doc, tag, attrs, children) { return appendChildren(setAttributes(doc.createElement(tag), attrs), children); }
  function svgElement(doc, tag, attrs, children) { return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attrs), children); }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function announce(api, root, message) { if (api && typeof api.announce === "function") api.announce(root, message); }

  function installStyles(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      ".pis-lab{--pis-blue:var(--cl-blue,#315f9d);--pis-green:var(--cl-green,#39734d);--pis-gold:var(--cl-gold,#9b6a12);--pis-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere}",
      ".pis-lab *,.pis-lab *::before,.pis-lab *::after{box-sizing:border-box}.pis-lab [hidden]{display:none!important}.pis-lab h3,.pis-lab h4{margin:0;letter-spacing:0}.pis-lab h3{font-size:1.15rem}.pis-lab p{margin:.65em 0}.pis-lab button,.pis-lab input,.pis-lab select{font:inherit;letter-spacing:0}.pis-lab button,.pis-lab select{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;line-height:1.35;overflow-wrap:anywhere}.pis-lab button:hover{border-color:var(--pis-blue)}.pis-lab button:focus-visible,.pis-lab input:focus-visible,.pis-lab select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.pis-lab button[aria-pressed=true],.pis-lab .pis-primary{border-color:var(--pis-blue);background:var(--pis-blue);color:var(--bg);font-weight:750}.pis-lab .pis-note,.pis-lab .pis-feedback{color:var(--fg-soft);font-size:13px;line-height:1.65}.pis-lab .pis-prediction{margin:14px 0;padding:12px 14px;border-left:3px solid var(--pis-gold);background:var(--block-bg,var(--bg))}.pis-lab .pis-question{margin:0 0 12px;padding:0;border:0}.pis-lab .pis-question:last-of-type{margin-bottom:0}.pis-lab .pis-question legend{max-width:100%;margin-bottom:7px;font-size:13px;font-weight:750;line-height:1.5}.pis-lab .pis-choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.pis-lab .pis-choices button{font-size:12px}.pis-lab .pis-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.pis-lab .pis-actions>*{flex:1 1 170px}.pis-lab .pis-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.pis-lab .pis-pass{color:var(--pis-green)}.pis-lab .pis-warn{color:var(--pis-red)}.pis-lab .pis-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}",
      ".pis-lab .pis-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:12px 0;align-items:end}.pis-lab .pis-control{display:grid;gap:5px;min-width:0}.pis-lab .pis-control label{color:var(--fg-soft);font-size:12.5px;font-weight:700}.pis-lab .pis-control output{color:var(--pis-blue);font-variant-numeric:tabular-nums}.pis-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--pis-blue)}.pis-lab .pis-control select{width:100%}.pis-lab .pis-scale{display:flex;justify-content:space-between;gap:8px;color:var(--fg-soft);font-size:11px}.pis-lab .pis-stage{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden}.pis-lab .pis-stage-title{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;margin-bottom:8px;color:var(--fg-soft);font-size:13px}.pis-lab svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg)}.pis-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.pis-lab .pis-grid{stroke:currentColor;stroke-width:1;stroke-opacity:.14}.pis-lab .pis-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.62}.pis-lab .pis-curve{fill:none;stroke:var(--pis-blue);stroke-width:2.6}.pis-lab .pis-marker{stroke:var(--pis-red);stroke-width:2;stroke-dasharray:5 4}.pis-lab .pis-optical{stroke:var(--pis-gold);stroke-width:2;stroke-dasharray:3 3}.pis-lab .pis-pixel{fill:var(--pis-blue);fill-opacity:.18;stroke:var(--pis-blue);stroke-width:1.5}.pis-lab .pis-binned{fill:var(--pis-gold);fill-opacity:.16;stroke:var(--pis-gold);stroke-width:2}.pis-lab .pis-read{fill:var(--pis-green);fill-opacity:.18;stroke:var(--pis-green);stroke-width:1.4}.pis-lab .pis-skew{stroke:var(--pis-red);stroke-width:3}.pis-lab .pis-label{font-size:11px;fill:var(--fg-soft)}",
      ".pis-lab .pis-metrics{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin-top:12px}.pis-lab .pis-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.pis-lab .pis-metric:nth-child(6n+1){border-color:var(--pis-blue)}.pis-lab .pis-metric:nth-child(6n+2){border-color:var(--pis-gold)}.pis-lab .pis-metric:nth-child(6n+3){border-color:var(--pis-green)}.pis-lab .pis-metric:nth-child(6n+4){border-color:var(--pis-red)}.pis-lab .pis-metric:nth-child(6n+5){border-color:var(--pis-blue)}.pis-lab .pis-metric:nth-child(6n){border-color:var(--pis-gold)}.pis-lab .pis-metric span{display:block;color:var(--fg-soft);font-size:11px}.pis-lab .pis-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.pis-lab .pis-formula{margin:12px 0 0;padding:9px 11px;border-left:3px solid var(--pis-blue);background:var(--bg);font-family:SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;line-height:1.65;overflow-x:auto}.pis-lab .pis-reset{margin-top:10px;color:var(--fg-soft)}",
      "@media(max-width:950px){.pis-lab .pis-controls{grid-template-columns:repeat(3,minmax(0,1fr))}.pis-lab .pis-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:680px){.pis-lab .pis-controls{grid-template-columns:repeat(2,minmax(0,1fr))}.pis-lab .pis-choices{grid-template-columns:minmax(0,1fr)}}@media(max-width:400px){.pis-lab .pis-controls,.pis-lab .pis-metrics{grid-template-columns:minmax(0,1fr)}.pis-lab .pis-actions>*{flex-basis:100%}}@media(prefers-reduced-motion:reduce){.pis-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
    ].join("\n");
    (doc.head || doc.documentElement).appendChild(style);
  }

  function metric(doc, label) {
    var value = element(doc, "strong", { text: "—" });
    return { node: element(doc, "div", { className: "pis-metric" }, [element(doc, "span", { text: label }), value]), value: value };
  }

  function renderDiagram(doc, chart, result, state) {
    clear(chart);
    chart.appendChild(svgElement(doc, "title", {}, "像元采样、固定面积光子分配与读出方式"));
    var left = 24, plotLeft = 292, plotRight = 698, plotTop = 34, plotBottom = 214;
    chart.appendChild(svgElement(doc, "text", { class: "pis-label", x: 24, y: 22, text: "像元与光学斑" }));
    var cell = 42, gridX = 46, gridY = 58;
    for (var row = 0; row < 4; row += 1) {
      for (var column = 0; column < 4; column += 1) {
        chart.appendChild(svgElement(doc, "rect", { class: "pis-pixel", x: gridX + column * cell, y: gridY + row * cell, width: cell - 2, height: cell - 2 }));
      }
    }
    chart.appendChild(svgElement(doc, "rect", { class: "pis-binned", x: gridX - 1, y: gridY - 1, width: cell * 2, height: cell * 2 }));
    var airyRadius = clamp(result.airyDiameter * 4, 6, 44);
    chart.appendChild(svgElement(doc, "circle", { class: "pis-optical", cx: gridX + cell, cy: gridY + cell, r: airyRadius }));
    chart.appendChild(svgElement(doc, "text", { class: "pis-label", x: 42, y: 246, text: "蓝框：单像元；金框：2×2 合并；虚线圆：Airy 直径" }));
    chart.appendChild(svgElement(doc, "text", { class: "pis-label", x: 42, y: 266, text: "当前像元 " + format(result.pixel, 1) + " μm；单像元光子 " + format(result.incidentPhotons, 1) }));

    chart.appendChild(svgElement(doc, "text", { class: "pis-label", x: plotLeft, y: 22, text: "固定 24×24 μm 感光面：SNR 随像元尺寸" }));
    [0, .5, 1].forEach(function (fraction) {
      var y = plotBottom - (plotBottom - plotTop) * fraction;
      chart.appendChild(svgElement(doc, "line", { class: "pis-grid", x1: plotLeft, x2: plotRight, y1: y, y2: y }));
    });
    chart.appendChild(svgElement(doc, "line", { class: "pis-axis", x1: plotLeft, x2: plotRight, y1: plotBottom, y2: plotBottom }));
    chart.appendChild(svgElement(doc, "line", { class: "pis-axis", x1: plotLeft, x2: plotLeft, y1: plotTop, y2: plotBottom }));
    var curve = [], maxSnr = 0, pixels = [];
    for (var index = 0; index <= 44; index += 1) {
      var pixel = 1 + 11 * index / 44;
      var sample = evaluate(Object.assign({}, state, { pixel: pixel }));
      pixels.push({ pixel: pixel, snr: sample.snr });
      maxSnr = Math.max(maxSnr, sample.snr);
    }
    maxSnr = Math.max(1, maxSnr * 1.12);
    pixels.forEach(function (sample) {
      var x = plotLeft + (plotRight - plotLeft) * (sample.pixel - 1) / 11;
      var y = plotBottom - (plotBottom - plotTop) * sample.snr / maxSnr;
      curve.push(x + "," + y);
    });
    chart.appendChild(svgElement(doc, "polyline", { class: "pis-curve", points: curve.join(" ") }));
    var markerX = plotLeft + (plotRight - plotLeft) * (result.pixel - 1) / 11;
    chart.appendChild(svgElement(doc, "line", { class: "pis-marker", x1: markerX, x2: markerX, y1: plotTop, y2: plotBottom }));
    var opticalX = plotLeft + (plotRight - plotLeft) * (clamp(result.airyDiameter / 2, 1, 12) - 1) / 11;
    chart.appendChild(svgElement(doc, "line", { class: "pis-optical", x1: opticalX, x2: opticalX, y1: plotTop, y2: plotBottom }));
    chart.appendChild(svgElement(doc, "text", { class: "pis-label", x: plotLeft, y: plotBottom + 20, text: "1 μm" }));
    chart.appendChild(svgElement(doc, "text", { class: "pis-label", x: plotRight - 25, y: plotBottom + 20, text: "12 μm" }));
    chart.appendChild(svgElement(doc, "text", { class: "pis-label", x: 254, y: plotTop + 5, text: "SNR" }));
    chart.appendChild(svgElement(doc, "text", { class: "pis-label", x: opticalX + 4, y: plotTop + 17, text: "Airy/2" }));
    chart.appendChild(svgElement(doc, "text", { class: "pis-label", x: markerX + 4, y: plotBottom - 8, text: "当前" }));

    var pipelineY = 300;
    chart.appendChild(svgElement(doc, "text", { class: "pis-label", x: 24, y: pipelineY - 10, text: "曝光 → 读出 → ADC" }));
    var stages = result.architecture === "cmos" ? ["像元放大器", "多行并行", "ADC"] : ["电荷转移", "串行寄存器", "ADC"];
    stages.forEach(function (label, stageIndex) {
      var x = 160 + stageIndex * 165;
      chart.appendChild(svgElement(doc, "rect", { class: "pis-read", x: x, y: pipelineY - 28, width: 122, height: 38, rx: 5 }));
      chart.appendChild(svgElement(doc, "text", { class: "pis-label", x: x + 61, y: pipelineY - 5, "text-anchor": "middle", text: label }));
      if (stageIndex < stages.length - 1) chart.appendChild(svgElement(doc, "line", { class: "pis-axis", x1: x + 122, x2: x + 157, y1: pipelineY - 9, y2: pipelineY - 9 }));
    });
    if (result.shutter === "rolling") {
      chart.appendChild(svgElement(doc, "line", { class: "pis-skew", x1: 160, x2: 610, y1: 338, y2: 315 }));
      chart.appendChild(svgElement(doc, "text", { class: "pis-label", x: 24, y: 342, text: "rolling：行曝光错开，运动量 → 几何倾斜" }));
    } else {
      chart.appendChild(svgElement(doc, "text", { class: "pis-label", x: 24, y: 342, text: "global：同一时刻曝光，运动不会产生行间错位" }));
    }
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    installStyles(doc);
    var state = copy(DEFAULT);
    var shell = element(doc, "div", { className: "pis-lab" });
    shell.appendChild(element(doc, "h3", { text: "图像传感器：把光子账本变成可采样的像素" }));
    shell.appendChild(element(doc, "p", { className: "pis-note", text: "先预测固定面积、读噪、采样与快门的关系；解锁后拖动参数，观察同一物理约束如何同时改变 SNR、动态范围和运动伪影。" }));
    var gate = element(doc, "div", { className: "pis-prediction" });
    var questions = [
      { title: "固定 24×24 μm 感光面，像元从 12 μm 缩到 3 μm，单像元入射光子数会怎样？", choices: [["down", "减少到 1/16"], ["same", "保持不变"]], answer: "down" },
      { title: "在未饱和且读噪占主导的近似下，4 像元合并的 SNR 更接近？", choices: [["two", "提高约 2 倍"], ["four", "提高约 4 倍"]], answer: "two" },
      { title: "运动物体用 rolling shutter 读出时，最典型的边界是什么？", choices: [["skew", "行间时间差造成几何倾斜"], ["dark", "只会让整幅图变暗"]], answer: "skew" },
      { title: "满阱 30000 e⁻、读噪 3 e⁻ 的理想动态范围约为？", choices: [["eighty", "80 dB"], ["forty", "40 dB"]], answer: "eighty" }
    ];
    var answers = {};
    var questionButtons = {};
    questions.forEach(function (question, questionIndex) {
      var field = element(doc, "fieldset", { className: "pis-question" });
      field.appendChild(element(doc, "legend", { text: (questionIndex + 1) + ". " + question.title }));
      var choices = element(doc, "div", { className: "pis-choices" });
      questionButtons[questionIndex] = [];
      question.choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", text: choice[1], "aria-pressed": "false" });
        button.addEventListener("click", function () {
          answers[questionIndex] = choice[0];
          renderGate();
        });
        questionButtons[questionIndex].push({ node: button, value: choice[0] });
        choices.appendChild(button);
      });
      field.appendChild(choices);
      gate.appendChild(field);
    });
    var actions = element(doc, "div", { className: "pis-actions" });
    var reveal = element(doc, "button", { type: "button", className: "pis-primary", text: "核对预测" });
    var clearPredictions = element(doc, "button", { type: "button", text: "清空预测" });
    var feedback = element(doc, "p", { className: "pis-feedback", "aria-live": "polite" });
    actions.appendChild(reveal);
    actions.appendChild(clearPredictions);
    gate.appendChild(actions);
    gate.appendChild(feedback);
    shell.appendChild(gate);

    var revealed = element(doc, "div", { className: "pis-revealed", hidden: true });
    revealed.appendChild(element(doc, "h4", { text: "像元、采样和读出状态" }));
    var controls = element(doc, "div", { className: "pis-controls" });
    function addSelect(label, key, choices) {
      var select = element(doc, "select", { "aria-label": label });
      choices.forEach(function (choice) { select.appendChild(element(doc, "option", { value: choice[0], text: choice[1] })); });
      select.value = state[key];
      select.addEventListener("change", function () { state[key] = select.value; render(); });
      controls.appendChild(element(doc, "div", { className: "pis-control" }, [element(doc, "label", { text: label }), select]));
    }
    function addRange(label, key, minimum, maximum, step, digits, suffix) {
      var output = element(doc, "output", { text: format(state[key], digits) + suffix });
      var input = element(doc, "input", { type: "range", min: minimum, max: maximum, step: step, value: state[key], "aria-label": label });
      input.addEventListener("input", function () { state[key] = Number(input.value); output.textContent = format(state[key], digits) + suffix; render(); });
      controls.appendChild(element(doc, "div", { className: "pis-control" }, [element(doc, "label", { text: label }), output, input, element(doc, "div", { className: "pis-scale" }, [element(doc, "span", { text: String(minimum) + suffix }), element(doc, "span", { text: String(maximum) + suffix })])]));
    }
    addSelect("器件架构", "architecture", [["cmos", "CMOS APS"], ["ccd", "CCD"]]);
    addSelect("快门方式", "shutter", [["rolling", "rolling shutter"], ["global", "global shutter"]]);
    addSelect("彩色采样", "color", [["rgb", "Bayer RGB"], ["mono", "单色" ]]);
    addRange("像元间距", "pixel", 1, 12, 0.5, 1, " μm");
    addRange("总入射光子", "photons", 100, 10000, 100, 0, "");
    addRange("量子效率 η", "qe", 0.3, 1, 0.01, 2, "");
    addRange("满阱容量", "fullWell", 1000, 60000, 1000, 0, " e⁻");
    addRange("读噪 σr", "read", 0, 10, 0.5, 1, " e⁻");
    addRange("波长 λ", "wavelength", 0.4, 0.7, 0.01, 2, " μm");
    addRange("光圈 F/#", "fNumber", 1.4, 8, 0.2, 1, "");
    addRange("运动速度代理", "motion", 0, 1, 0.05, 2, "");
    revealed.appendChild(controls);
    var stage = element(doc, "div", { className: "pis-stage" });
    var stageTitle = element(doc, "div", { className: "pis-stage-title" }, [element(doc, "span", { text: "采样与读出图" }), element(doc, "span", { className: "pis-stage-status", text: "" })]);
    var chart = svgElement(doc, "svg", { viewBox: "0 0 720 360", role: "img", "aria-label": "像元网格、固定面积光子分配、SNR 曲线与读出路径" });
    stage.appendChild(stageTitle);
    stage.appendChild(chart);
    revealed.appendChild(stage);
    var metrics = element(doc, "div", { className: "pis-metrics" });
    var metricNodes = [metric(doc, "单像元电子"), metric(doc, "单像元 SNR"), metric(doc, "2×2 SNR"), metric(doc, "动态范围 /dB"), metric(doc, "Airy 直径 /μm"), metric(doc, "行间错位 /ms")];
    metricNodes.forEach(function (item) { metrics.appendChild(item.node); });
    revealed.appendChild(metrics);
    var formula = element(doc, "div", { className: "pis-formula", text: "Nₑ=Φ·(p/24)²·η·c；SNR≈Nₑ/√(Nₑ+Ndark+σr²)；dAiry=2.44λF/#" });
    revealed.appendChild(formula);
    var reset = element(doc, "button", { type: "button", className: "pis-reset", text: "重置实验" });
    revealed.appendChild(reset);
    shell.appendChild(revealed);
    root.replaceChildren(shell);

    function renderGate() {
      questions.forEach(function (question, questionIndex) {
        questionButtons[questionIndex].forEach(function (entry) {
          entry.node.setAttribute("aria-pressed", answers[questionIndex] === entry.value ? "true" : "false");
        });
      });
      var complete = questions.every(function (question, questionIndex) { return answers[questionIndex] !== undefined; });
      reveal.disabled = !complete;
      if (!complete) feedback.textContent = "请先回答四个判断。";
      else if (!revealed.hidden) feedback.textContent = "预测已核对；继续改变参数，寻找模型的边界。";
      else feedback.textContent = "预测已记录，点击“核对预测”打开传感器账本。";
    }
    function render() {
      var result = evaluate(state);
      metricNodes[0].value.textContent = format(result.clippedSignal, 1) + (result.saturated ? "（饱和）" : "");
      metricNodes[1].value.textContent = format(result.snr, 2);
      metricNodes[2].value.textContent = format(result.binnedSnr, 2) + (result.binnedSaturated ? "（饱和）" : "");
      metricNodes[3].value.textContent = format(result.dynamicRange, 1);
      metricNodes[4].value.textContent = format(result.airyDiameter, 2);
      metricNodes[5].value.textContent = format(result.skewMs, 2);
      stageTitle.querySelector(".pis-stage-status").textContent = result.headline + "；" + (result.color === "rgb" ? "Bayer 每色约 1/3 光子" : "单色全光谱") + "；采样比=" + format(result.samplingRatio, 2);
      formula.textContent = "Nₑ=Φ·(p/24)²·η·c=" + format(result.signal, 1) + " e⁻；SNR=Nₑ/√(Nₑ+Nd+σr²)=" + format(result.snr, 2) + "；dAiry=2.44λF/#=" + format(result.airyDiameter, 2) + " μm";
      renderDiagram(doc, chart, result, state);
    }
    reveal.addEventListener("click", function () {
      if (questions.some(function (question, questionIndex) { return answers[questionIndex] === undefined; })) return;
      var score = questions.reduce(function (total, question, questionIndex) { return total + (answers[questionIndex] === question.answer ? 1 : 0); }, 0);
      feedback.className = "pis-feedback " + (score === questions.length ? "pis-pass" : "pis-warn");
      feedback.textContent = "预测 " + score + "/" + questions.length + "。现在用滑块检验固定面积、噪声、采样和快门的约束。";
      revealed.hidden = false;
      render();
      announce(api, root, feedback.textContent);
    });
    clearPredictions.addEventListener("click", function () {
      answers = {};
      revealed.hidden = true;
      feedback.className = "pis-feedback";
      renderGate();
    });
    reset.addEventListener("click", function () {
      Object.keys(DEFAULT).forEach(function (key) { state[key] = DEFAULT[key]; });
      revealed.hidden = true;
      feedback.className = "pis-feedback";
      feedback.textContent = "实验已重置，请重新预测。";
      announce(api, root, "图像传感器实验已重置。");
      renderGate();
    });
    renderGate();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) { checks += 1; if (!condition) throw new Error(message); }
    var large = evaluate({ pixel: 12, photons: 3600, color: "mono", qe: 1, dark: 0, read: 0 });
    var small = evaluate({ pixel: 3, photons: 3600, color: "mono", qe: 1, dark: 0, read: 0 });
    assert(near(large.incidentPhotons, 900), "12 μm pixel should cover 1/4 of the fixed sensor area");
    assert(near(small.incidentPhotons, 56.25), "3 μm pixel should receive 56.25 photons");
    assert(near(large.snr, 30) && near(small.snr, 7.5), "ideal monochrome SNR baseline");
    assert(near(large.incidentPhotons / small.incidentPhotons, 16), "fixed-area photon ratio should scale as p²");
    var binned = evaluate({ pixel: 3, photons: 3600, color: "mono", qe: 1, dark: 0, read: 3 });
    assert(binned.binnedSnr > binned.snr, "2x2 binning should improve SNR before saturation");
    assert(near(evaluate({ fullWell: 30000, read: 3 }).dynamicRange, 80, 1e-3), "dynamic range should be about 80 dB");
    assert(evaluate({ shutter: "global", motion: 1 }).skewMs === 0, "global shutter should have no row skew");
    assert(evaluate({ shutter: "rolling", motion: 1 }).skewMs > 0, "rolling shutter should expose row skew");
    assert(near(evaluate({ wavelength: 0.55, fNumber: 2.8 }).airyDiameter, 3.7576, 1e-3), "Airy diameter formula should be deterministic");
    assert(evaluate({ pixel: 3, photons: 3600 }).snr === evaluate({ pixel: 3, photons: 3600 }).snr, "evaluation should be deterministic");
    return { checks: checks };
  }

  return { evaluate: evaluate, mount: mount, selfTest: selfTest };
});
