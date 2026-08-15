(function (host) {
  "use strict";

  var STYLE_ID = "vc-shattering-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var CONFIGS = [
    { id: "threshold-one", label: "阈值 · 单点", model: "threshold", points: [0], target: "1" },
    { id: "threshold-two", label: "阈值 · 两点", model: "threshold", points: [-1, 1], target: "10" },
    { id: "interval-two", label: "区间 · 两点", model: "interval", points: [-1, 1], target: "10" },
    { id: "interval-three", label: "区间 · 三点", model: "interval", points: [-1, 0, 1], target: "101" },
    { id: "halfspace-three", label: "半空间 · 三角形", model: "halfspace", points: [[-1, -0.8], [1, -0.8], [0, 1]], target: "101" },
    { id: "halfspace-four", label: "半空间 · 正方形", model: "halfspace", points: [[-1, -1], [1, -1], [1, 1], [-1, 1]], target: "1010" }
  ];

  var STYLE_TEXT = [
    ".vcs-lab{max-width:100%;min-width:0;color:var(--fg);line-height:1.55}",
    ".vcs-lab *{box-sizing:border-box}.vcs-lab [hidden]{display:none!important}",
    ".vcs-lab .vcs-note,.vcs-lab .vcs-feedback{color:var(--fg-soft);font-size:13px}",
    ".vcs-lab .vcs-presets,.vcs-lab .vcs-actions,.vcs-lab .vcs-choice{display:flex;flex-wrap:wrap;gap:8px}",
    ".vcs-lab button{min-height:44px;font:inherit}.vcs-lab .vcs-presets button{flex:1 1 145px}",
    ".vcs-lab button[aria-pressed=true]{border-color:var(--accent);background:var(--accent);color:var(--bg)}",
    ".vcs-lab button:focus-visible{outline:3px solid var(--cl-focus);outline-offset:2px}",
    ".vcs-lab .vcs-targets{display:grid;grid-template-columns:repeat(auto-fit,minmax(64px,1fr));gap:7px;margin:14px 0}.vcs-lab .vcs-targets button{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-weight:800}",
    ".vcs-lab .vcs-predict{margin:14px 0;padding:12px 14px;border-left:3px solid var(--cl-gold);background:var(--bg)}",
    ".vcs-lab .vcs-predict strong{display:block;margin-bottom:8px;font-size:13px}.vcs-lab .vcs-choice button{flex:1 1 150px}",
    ".vcs-lab .vcs-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.vcs-lab .vcs-pass{color:var(--cl-green)}.vcs-lab .vcs-warn{color:var(--cl-red)}",
    ".vcs-lab .vcs-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:14px 0}.vcs-lab .vcs-metric{min-width:0;padding:9px 4px;border-top:2px solid var(--border)}.vcs-lab .vcs-metric span{display:block;color:var(--fg-soft);font-size:11.5px}.vcs-lab .vcs-metric strong{display:block;margin-top:3px;font-size:14px;overflow-wrap:anywhere}",
    ".vcs-lab svg{display:block;width:100%;height:auto;border:1px solid var(--border);border-radius:7px;background:var(--bg)}.vcs-lab svg text{fill:var(--fg);font-family:inherit;letter-spacing:0}",
    ".vcs-lab .vcs-axis{stroke:var(--border);stroke-width:1.4}.vcs-lab .vcs-boundary{stroke:var(--accent);stroke-width:3;stroke-dasharray:7 4}.vcs-lab .vcs-region{fill:var(--accent);fill-opacity:.12}.vcs-lab .vcs-conflict{stroke:var(--cl-red);stroke-width:3;stroke-dasharray:5 4}",
    ".vcs-lab .vcs-point{stroke:var(--fg);stroke-width:2}.vcs-lab .vcs-one{fill:var(--accent)}.vcs-lab .vcs-zero{fill:var(--bg)}",
    ".vcs-lab .vcs-patterns{display:grid;grid-template-columns:repeat(auto-fit,minmax(62px,1fr));gap:6px;margin-top:12px}.vcs-lab .vcs-pattern{padding:7px 5px;border-bottom:2px solid var(--border);font-family:ui-monospace,SFMono-Regular,Consolas,monospace;text-align:center}.vcs-lab .vcs-pattern.vcs-realized{border-color:var(--cl-green)}.vcs-lab .vcs-pattern.vcs-missing{border-color:var(--cl-red);color:var(--fg-soft)}",
    "@media(max-width:620px){.vcs-lab .vcs-targets{grid-template-columns:repeat(4,minmax(0,1fr))}}",
    "@media(prefers-reduced-motion:reduce){.vcs-lab *{animation:none!important;transition:none!important}}"
  ].join("\n");

  function allLabels(size) {
    var labels = [];
    for (var value = 0; value < Math.pow(2, size); value += 1) labels.push(value.toString(2).padStart(size, "0"));
    return labels;
  }

  function thresholdPatterns(size) {
    var patterns = [];
    for (var split = 0; split <= size; split += 1) patterns.push("0".repeat(split) + "1".repeat(size - split));
    return patterns.sort();
  }

  function intervalPatterns(size) {
    var patterns = new Set(["0".repeat(size)]);
    for (var first = 0; first < size; first += 1) {
      for (var last = first; last < size; last += 1) {
        var bits = [];
        for (var index = 0; index < size; index += 1) bits.push(index >= first && index <= last ? "1" : "0");
        patterns.add(bits.join(""));
      }
    }
    return Array.from(patterns).sort();
  }

  function patternsFor(config) {
    var size = config.points.length;
    if (config.model === "threshold") return thresholdPatterns(size);
    if (config.model === "interval") return intervalPatterns(size);
    if (config.id === "halfspace-three") return allLabels(size);
    if (config.id === "halfspace-four") return allLabels(size).filter(function (label) { return label !== "1010" && label !== "0101"; });
    throw new Error("unknown fixed halfspace configuration");
  }

  function getConfig(id) {
    return CONFIGS.filter(function (config) { return config.id === id; })[0];
  }

  function isRealizable(config, target) { return patternsFor(config).indexOf(target) !== -1; }

  function thresholdWitness(points, target) {
    if (thresholdPatterns(points.length).indexOf(target) === -1) return null;
    var firstOne = target.indexOf("1");
    var threshold;
    if (firstOne === -1) threshold = points[points.length - 1] + 0.5;
    else if (firstOne === 0) threshold = points[0] - 0.5;
    else threshold = (points[firstOne - 1] + points[firstOne]) / 2;
    return { kind: "threshold", threshold: threshold };
  }

  function intervalWitness(points, target) {
    if (intervalPatterns(points.length).indexOf(target) === -1) return null;
    var first = target.indexOf("1"), last = target.lastIndexOf("1");
    if (first === -1) return { kind: "interval", empty: true };
    var left = first === 0 ? points[0] - 0.5 : (points[first - 1] + points[first]) / 2;
    var right = last === points.length - 1 ? points[last] + 0.5 : (points[last] + points[last + 1]) / 2;
    return { kind: "interval", left: left, right: right, empty: false };
  }

  function classifyHalfspace(points, witness) {
    return points.map(function (point) {
      return witness.wx * point[0] + witness.wy * point[1] >= witness.threshold ? "1" : "0";
    }).join("");
  }

  function findHalfspace(points, target) {
    for (var step = 0; step < 1440; step += 1) {
      var angle = 2 * Math.PI * step / 1440;
      var wx = Math.cos(angle), wy = Math.sin(angle);
      var projections = points.map(function (point) { return wx * point[0] + wy * point[1]; }).sort(function (a, b) { return a - b; });
      var unique = projections.filter(function (value, index) { return index === 0 || Math.abs(value - projections[index - 1]) > 1e-9; });
      var cuts = [unique[0] - 1];
      for (var index = 0; index < unique.length - 1; index += 1) cuts.push((unique[index] + unique[index + 1]) / 2);
      cuts.push(unique[unique.length - 1] + 1);
      for (var cutIndex = 0; cutIndex < cuts.length; cutIndex += 1) {
        var witness = { kind: "halfspace", wx: wx, wy: wy, threshold: cuts[cutIndex] };
        if (classifyHalfspace(points, witness) === target) return witness;
      }
    }
    return null;
  }

  function witnessFor(config, target) {
    if (config.model === "threshold") return thresholdWitness(config.points, target);
    if (config.model === "interval") return intervalWitness(config.points, target);
    return findHalfspace(config.points, target);
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; if (!condition) throw new Error(message); }
    check(thresholdPatterns(1).join(",") === "0,1", "threshold one patterns");
    check(thresholdPatterns(2).join(",") === "00,01,11", "threshold two patterns");
    check(intervalPatterns(2).join(",") === "00,01,10,11", "interval two patterns");
    check(intervalPatterns(3).length === 7 && intervalPatterns(3).indexOf("101") === -1, "interval three misses alternating");
    var expectedCounts = [2, 3, 4, 7, 8, 14];
    CONFIGS.forEach(function (config, index) {
      var patterns = patternsFor(config);
      check(patterns.length === expectedCounts[index], config.id + " behavior count");
      check(new Set(patterns).size === patterns.length, config.id + " unique patterns");
      patterns.forEach(function (target) {
        var witness = witnessFor(config, target);
        check(witness !== null, config.id + " witness for " + target);
        if (config.model === "halfspace") check(classifyHalfspace(config.points, witness) === target, config.id + " witness classifies " + target);
      });
    });
    var square = getConfig("halfspace-four");
    check(!isRealizable(square, "1010") && !isRealizable(square, "0101"), "square XOR pair missing");
    check(findHalfspace(square.points, "1010") === null, "XOR has no separator");
    var triangle = getConfig("halfspace-three");
    check(patternsFor(triangle).length === Math.pow(2, triangle.points.length), "triangle shattered");
    return { checks: checks, configs: CONFIGS.length };
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
    var style = element(doc, "style"); style.id = STYLE_ID; style.textContent = STYLE_TEXT; doc.head.appendChild(style);
  }

  function modelLabel(model) {
    return model === "threshold" ? "1D 后缀阈值" : model === "interval" ? "1D 单区间" : "R² 仿射半空间";
  }

  function metric(doc, label, value) {
    var item = element(doc, "div", "vcs-metric");
    item.appendChild(element(doc, "span", "", label));
    item.appendChild(element(doc, "strong", "", value));
    return item;
  }

  function oneDimensionalSvg(doc, config, target, witness, revealed) {
    var svg = svgNode(doc, "svg", { viewBox: "0 0 600 270", role: "img", "aria-label": "数轴上的标签与分类器见证" });
    svg.appendChild(svgNode(doc, "title", {}, "一维固定点集标签账本"));
    var points = config.points, min = Math.min.apply(null, points) - 1, max = Math.max.apply(null, points) + 1;
    if (points.length === 1) { min = -1; max = 1; }
    var mapX = function (value) { return 55 + (value - min) / (max - min) * 490; };
    var y = 145;
    if (revealed && witness) {
      if (witness.kind === "threshold") {
        var boundaryX = mapX(witness.threshold);
        svg.appendChild(svgNode(doc, "rect", { x: boundaryX, y: 45, width: Math.max(0, 545 - boundaryX), height: 150, class: "vcs-region" }));
        svg.appendChild(svgNode(doc, "line", { x1: boundaryX, y1: 40, x2: boundaryX, y2: 205, class: "vcs-boundary" }));
      } else if (!witness.empty) {
        var left = mapX(witness.left), right = mapX(witness.right);
        svg.appendChild(svgNode(doc, "rect", { x: left, y: 45, width: right - left, height: 150, class: "vcs-region" }));
        svg.appendChild(svgNode(doc, "line", { x1: left, y1: 40, x2: left, y2: 205, class: "vcs-boundary" }));
        svg.appendChild(svgNode(doc, "line", { x1: right, y1: 40, x2: right, y2: 205, class: "vcs-boundary" }));
      } else {
        svg.appendChild(svgNode(doc, "text", { x: 300, y: 65, "text-anchor": "middle", "font-size": 12 }, "空区间实现全 0"));
      }
    }
    svg.appendChild(svgNode(doc, "line", { x1: 55, y1: y, x2: 545, y2: y, class: "vcs-axis" }));
    points.forEach(function (point, index) {
      var x = mapX(point), bit = target.charAt(index);
      svg.appendChild(svgNode(doc, "circle", { cx: x, cy: y, r: 17, class: "vcs-point " + (bit === "1" ? "vcs-one" : "vcs-zero") }));
      svg.appendChild(svgNode(doc, "text", { x: x, y: y + 5, "text-anchor": "middle", "font-size": 13, "font-weight": 800 }, bit));
      svg.appendChild(svgNode(doc, "text", { x: x, y: y + 38, "text-anchor": "middle", "font-size": 11 }, "x" + (index + 1) + "=" + point));
    });
    svg.appendChild(svgNode(doc, "text", { x: 55, y: 24, "font-size": 12, "font-weight": 700 }, revealed ? (witness ? "蓝色区域预测为 1" : "该目标没有类别内见证") : "预测阶段：只显示点与目标标签"));
    return svg;
  }

  function twoDimensionalSvg(doc, config, target, witness, revealed) {
    var svg = svgNode(doc, "svg", { viewBox: "0 0 600 360", role: "img", "aria-label": "平面点集标签与线性可分见证" });
    svg.appendChild(svgNode(doc, "title", {}, "二维仿射半空间标签账本"));
    var mapX = function (value) { return 300 + value * 125; }, mapY = function (value) { return 185 - value * 125; };
    svg.appendChild(svgNode(doc, "line", { x1: 70, y1: mapY(0), x2: 530, y2: mapY(0), class: "vcs-axis" }));
    svg.appendChild(svgNode(doc, "line", { x1: mapX(0), y1: 30, x2: mapX(0), y2: 330, class: "vcs-axis" }));
    if (revealed && witness) {
      var baseX = witness.threshold * witness.wx, baseY = witness.threshold * witness.wy;
      var dx = -witness.wy * 3, dy = witness.wx * 3;
      svg.appendChild(svgNode(doc, "line", { x1: mapX(baseX - dx), y1: mapY(baseY - dy), x2: mapX(baseX + dx), y2: mapY(baseY + dy), class: "vcs-boundary" }));
    }
    if (revealed && !witness && config.id === "halfspace-four") {
      [[0, 2], [1, 3]].forEach(function (pair) {
        svg.appendChild(svgNode(doc, "line", { x1: mapX(config.points[pair[0]][0]), y1: mapY(config.points[pair[0]][1]), x2: mapX(config.points[pair[1]][0]), y2: mapY(config.points[pair[1]][1]), class: "vcs-conflict" }));
      });
    }
    config.points.forEach(function (point, index) {
      var bit = target.charAt(index), x = mapX(point[0]), y = mapY(point[1]);
      svg.appendChild(svgNode(doc, "circle", { cx: x, cy: y, r: 17, class: "vcs-point " + (bit === "1" ? "vcs-one" : "vcs-zero") }));
      svg.appendChild(svgNode(doc, "text", { x: x, y: y + 5, "text-anchor": "middle", "font-size": 13, "font-weight": 800 }, bit));
      svg.appendChild(svgNode(doc, "text", { x: x + 22, y: y - 19, "font-size": 10 }, "x" + (index + 1)));
    });
    svg.appendChild(svgNode(doc, "text", { x: 70, y: 22, "font-size": 12, "font-weight": 700 }, revealed ? (witness ? "蓝虚线是一条严格分离见证" : "红虚线凸包相交：没有仿射分离线") : "预测阶段：只显示点与目标标签"));
    return svg;
  }

  function configurationSvg(doc, config, target, witness, revealed) {
    return config.model === "halfspace" ? twoDimensionalSvg(doc, config, target, witness, revealed) : oneDimensionalSvg(doc, config, target, witness, revealed);
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    installStyles(doc);
    var config = getConfig("interval-three"), target = config.target, prediction = null, revealed = false;
    var shell = element(doc, "div", "vcs-lab");
    shell.appendChild(element(doc, "p", "vcs-note", "标签串按点的显示顺序读取。先选配置与目标，再判断这个固定目标能否由当前类别实现。"));
    var presets = element(doc, "div", "vcs-presets"), presetButtons = [];
    CONFIGS.forEach(function (item) {
      var button = element(doc, "button", "", item.label); button.type = "button";
      button.addEventListener("click", function () { config = item; target = item.target; prediction = null; revealed = false; rebuildTargets(); render(); });
      presetButtons.push({ id: item.id, node: button }); presets.appendChild(button);
    });
    shell.appendChild(presets);
    var targets = element(doc, "div", "vcs-targets"); shell.appendChild(targets);
    var predict = element(doc, "div", "vcs-predict"); predict.appendChild(element(doc, "strong", "", "先预测：目标标签能否实现？"));
    var choices = element(doc, "div", "vcs-choice"), choiceButtons = [];
    [["yes", "可实现"], ["no", "不可实现"]].forEach(function (item) {
      var button = element(doc, "button", "", item[1]); button.type = "button";
      button.addEventListener("click", function () { prediction = item[0]; renderPrediction(); });
      choiceButtons.push({ value: item[0], node: button }); choices.appendChild(button);
    });
    predict.appendChild(choices);
    var actions = element(doc, "div", "vcs-actions");
    var checkButton = element(doc, "button", "cl-primary", "揭示账本"), resetButton = element(doc, "button", "", "重置本配置");
    checkButton.type = resetButton.type = "button"; actions.appendChild(checkButton); actions.appendChild(resetButton); predict.appendChild(actions);
    var feedback = element(doc, "p", "vcs-feedback", "先选可实现或不可实现。"), results = element(doc, "div"); results.hidden = true;
    predict.appendChild(feedback); shell.appendChild(predict); shell.appendChild(results); root.replaceChildren(shell);

    function rebuildTargets() {
      targets.replaceChildren();
      allLabels(config.points.length).forEach(function (label) {
        var button = element(doc, "button", "", label); button.type = "button"; button.setAttribute("aria-label", "目标标签 " + label);
        button.addEventListener("click", function () { target = label; prediction = null; revealed = false; render(); });
        button.setAttribute("aria-pressed", target === label ? "true" : "false"); targets.appendChild(button);
      });
    }
    function renderPrediction() { choiceButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", prediction === item.value ? "true" : "false"); }); }
    checkButton.addEventListener("click", function () {
      if (!prediction) { feedback.textContent = "请先作出可实现性预测。"; feedback.className = "vcs-feedback vcs-warn"; return; }
      revealed = true; render();
    });
    resetButton.addEventListener("click", function () { target = config.target; prediction = null; revealed = false; rebuildTargets(); render(); });
    function render() {
      presetButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", config.id === item.id ? "true" : "false"); });
      Array.prototype.forEach.call(targets.children, function (button) { button.setAttribute("aria-pressed", button.textContent === target ? "true" : "false"); });
      renderPrediction();
      if (!revealed) { results.hidden = true; feedback.textContent = prediction ? "预测已记录，点击“揭示账本”。" : "先选可实现或不可实现。"; feedback.className = "vcs-feedback"; return; }
      var patterns = patternsFor(config), realizable = patterns.indexOf(target) !== -1, witness = witnessFor(config, target), correct = prediction === (realizable ? "yes" : "no");
      feedback.textContent = (correct ? "预测命中。" : "请按类别允许的标签形状复盘。") + " 目标 " + target + (realizable ? " 可实现。" : " 不可实现。");
      feedback.className = "vcs-feedback " + (correct ? "vcs-pass" : "vcs-warn"); if (api && api.announce) api.announce(root, feedback.textContent);
      results.hidden = false; results.replaceChildren(); var metrics = element(doc, "div", "vcs-metrics");
      metrics.appendChild(metric(doc, "假设类", modelLabel(config.model)));
      metrics.appendChild(metric(doc, "固定点数 m", String(config.points.length)));
      metrics.appendChild(metric(doc, "当前目标", target));
      metrics.appendChild(metric(doc, "目标状态", realizable ? "可实现" : "缺失"));
      metrics.appendChild(metric(doc, "固定配置行为数", patterns.length + " / " + Math.pow(2, config.points.length)));
      metrics.appendChild(metric(doc, "量词读法", patterns.length === Math.pow(2, config.points.length) ? "该配置给出 VC 下界" : "只说明该配置未打散"));
      results.appendChild(metrics); results.appendChild(configurationSvg(doc, config, target, witness, true));
      var patternGrid = element(doc, "div", "vcs-patterns");
      allLabels(config.points.length).forEach(function (label) { patternGrid.appendChild(element(doc, "span", "vcs-pattern " + (patterns.indexOf(label) !== -1 ? "vcs-realized" : "vcs-missing"), label)); });
      results.appendChild(patternGrid);
      results.appendChild(element(doc, "p", "vcs-note", patterns.length === Math.pow(2, config.points.length) ? "这个具体配置被打散，所以提供 VC 维至少为 m 的存在性证据。" : "红色下划线是这个配置缺失的标签。要推出 VC 维小于 m，还必须证明每一个 m 点配置都至少缺一种标签；单个失败配置不够。"));
    }
    rebuildTargets(); render();
  }

  var exported = { CONFIGS: CONFIGS, allLabels: allLabels, thresholdPatterns: thresholdPatterns, intervalPatterns: intervalPatterns, patternsFor: patternsFor, isRealizable: isRealizable, witnessFor: witnessFor, findHalfspace: findHalfspace, classifyHalfspace: classifyHalfspace, selfTest: selfTest };
  if (typeof module !== "undefined" && module.exports) module.exports = exported;
  if (host && host.CourseLearning && typeof host.CourseLearning.register === "function") host.CourseLearning.register("vc-shattering", mount);
  if (typeof module !== "undefined" && module.exports && typeof require !== "undefined" && require.main === module) {
    try { var report = selfTest(); console.log("vc-shattering self-test: PASS (" + report.checks + " checks, " + report.configs + " configs)"); }
    catch (error) { console.error("vc-shattering self-test: FAIL\n" + error.stack); process.exitCode = 1; }
  }
})(typeof window !== "undefined" ? window : null);
