(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("materials-phase-map", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("materials-phase-map self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("materials-phase-map self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var STYLE_ID = "cl-materials-phase-map-styles";
  var EPSILON = 1e-8;
  var DEFAULTS = {
    compositionPct: 45,
    temperatureC: 1350
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

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function format(value, digits) {
    if (!finite(value)) return "-";
    var places = digits === undefined ? 2 : digits;
    if (places === 0) return value.toFixed(0);
    if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(places);
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function temperatureBase(compositionFraction) {
    return 1480 - 300 * compositionFraction;
  }

  function liquidusFraction(compositionFraction) {
    return temperatureBase(compositionFraction) + 180 * compositionFraction * (1 - compositionFraction);
  }

  function solidusFraction(compositionFraction) {
    return temperatureBase(compositionFraction) - 180 * compositionFraction * (1 - compositionFraction);
  }

  function liquidusTemperature(compositionPct) {
    if (!finite(compositionPct) || compositionPct < 0 || compositionPct > 100) {
      throw new RangeError("成分必须在 0 到 100 wt% 之间。");
    }
    return liquidusFraction(compositionPct / 100);
  }

  function solidusTemperature(compositionPct) {
    if (!finite(compositionPct) || compositionPct < 0 || compositionPct > 100) {
      throw new RangeError("成分必须在 0 到 100 wt% 之间。");
    }
    return solidusFraction(compositionPct / 100);
  }

  function invertDecreasing(curve, temperatureC) {
    var low = 0;
    var high = 1;
    if (temperatureC > curve(0) + EPSILON || temperatureC < curve(1) - EPSILON) return null;
    for (var index = 0; index < 70; index += 1) {
      var middle = (low + high) / 2;
      if (curve(middle) > temperatureC) low = middle;
      else high = middle;
    }
    return (low + high) / 2;
  }

  function leverRule(compositionPct, alphaCompositionPct, liquidCompositionPct) {
    if (!finite(compositionPct) || !finite(alphaCompositionPct) || !finite(liquidCompositionPct)) {
      throw new RangeError("杠杆定则输入必须是有限数。");
    }
    if (liquidCompositionPct <= alphaCompositionPct) {
      throw new RangeError("连接线两端必须满足 C_L > C_alpha。");
    }
    if (compositionPct < alphaCompositionPct - EPSILON || compositionPct > liquidCompositionPct + EPSILON) {
      throw new RangeError("总成分必须落在连接线两端之间。");
    }
    var denominator = liquidCompositionPct - alphaCompositionPct;
    var alphaFraction = clamp((liquidCompositionPct - compositionPct) / denominator, 0, 1);
    var liquidFraction = clamp((compositionPct - alphaCompositionPct) / denominator, 0, 1);
    return {
      alpha: alphaFraction,
      liquid: liquidFraction,
      balance: alphaFraction + liquidFraction
    };
  }

  function phaseState(compositionPct, temperatureC) {
    if (!finite(compositionPct) || compositionPct < 0 || compositionPct > 100) {
      throw new RangeError("成分必须在 0 到 100 wt% 之间。");
    }
    if (!finite(temperatureC)) throw new RangeError("温度必须是有限数。");
    var fraction = compositionPct / 100;
    var liquidus = liquidusFraction(fraction);
    var solidus = solidusFraction(fraction);
    var base = {
      compositionPct: compositionPct,
      temperatureC: temperatureC,
      liquidusC: liquidus,
      solidusC: solidus,
      alphaFraction: 0,
      liquidFraction: 0,
      cAlphaPct: null,
      cLiquidPct: null,
      tieLine: false
    };

    if (Math.abs(liquidus - solidus) <= EPSILON && Math.abs(temperatureC - liquidus) <= EPSILON) {
      base.region = "pure-boundary";
      base.label = "纯组元熔点边界";
      return base;
    }
    if (temperatureC > liquidus + EPSILON) {
      base.region = "liquid";
      base.label = "单相液体 L";
      base.liquidFraction = 1;
      return base;
    }
    if (temperatureC < solidus - EPSILON) {
      base.region = "alpha";
      base.label = "单相固溶体 α";
      base.alphaFraction = 1;
      return base;
    }

    var onLiquidus = Math.abs(temperatureC - liquidus) <= EPSILON;
    var onSolidus = Math.abs(temperatureC - solidus) <= EPSILON;
    var alphaComposition = invertDecreasing(solidusFraction, temperatureC);
    var liquidComposition = invertDecreasing(liquidusFraction, temperatureC);
    if (onLiquidus) {
      base.region = "liquidus-boundary";
      base.label = "液相线边界（初生 α 为零）";
      base.alphaFraction = 0;
      base.liquidFraction = 1;
      base.cAlphaPct = alphaComposition === null ? compositionPct : alphaComposition * 100;
      base.cLiquidPct = compositionPct;
      base.tieLine = true;
      return base;
    }
    if (onSolidus) {
      base.region = "solidus-boundary";
      base.label = "固相线边界（液相为零）";
      base.alphaFraction = 1;
      base.liquidFraction = 0;
      base.cAlphaPct = compositionPct;
      base.cLiquidPct = liquidComposition === null ? compositionPct : liquidComposition * 100;
      base.tieLine = true;
      return base;
    }
    if (alphaComposition === null || liquidComposition === null) {
      throw new RangeError("温度未落在这张示意相图的可反演范围内。");
    }
    var fractions = leverRule(compositionPct, alphaComposition * 100, liquidComposition * 100);
    base.region = "two-phase";
    base.label = "液体 L + 固溶体 α 两相区";
    base.alphaFraction = fractions.alpha;
    base.liquidFraction = fractions.liquid;
    base.cAlphaPct = alphaComposition * 100;
    base.cLiquidPct = liquidComposition * 100;
    base.tieLine = true;
    return base;
  }

  function copyDefaults() {
    return { compositionPct: DEFAULTS.compositionPct, temperatureC: DEFAULTS.temperatureC };
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
      '[data-learning-lab="materials-phase-map"]{--mp-accent:#1769aa;--mp-solid:#b64335;--mp-liquid:#39734d;--mp-gold:#9b6a12;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="materials-phase-map"] *{box-sizing:border-box}' +
      '[data-learning-lab="materials-phase-map"] [hidden]{display:none!important}' +
      '[data-learning-lab="materials-phase-map"] .mp-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;align-items:end}' +
      '[data-learning-lab="materials-phase-map"] label{display:grid;gap:6px;font-weight:700;min-width:0}' +
      '[data-learning-lab="materials-phase-map"] output{color:var(--mp-accent);font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="materials-phase-map"] input,[data-learning-lab="materials-phase-map"] button{min-height:44px;font:inherit}' +
      '[data-learning-lab="materials-phase-map"] input[type="range"]{width:100%;accent-color:var(--mp-accent)}' +
      '[data-learning-lab="materials-phase-map"] button{min-width:0;padding:8px 12px;border:1px solid var(--border,currentColor);border-radius:6px;background:var(--bg,Canvas);color:inherit;cursor:pointer;overflow-wrap:anywhere}' +
      '[data-learning-lab="materials-phase-map"] button:hover,[data-learning-lab="materials-phase-map"] button[aria-pressed="true"]{border-color:var(--mp-accent);background:var(--mp-accent);color:#fff}' +
      '[data-learning-lab="materials-phase-map"] button:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}' +
      '[data-learning-lab="materials-phase-map"] .mp-question{margin:16px 0 8px;font-weight:750}' +
      '[data-learning-lab="materials-phase-map"] .mp-options,[data-learning-lab="materials-phase-map"] .mp-actions{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}' +
      '[data-learning-lab="materials-phase-map"] .mp-feedback{min-height:2em;margin:8px 0;font-weight:700}' +
      '[data-learning-lab="materials-phase-map"] .mp-good{color:var(--cl-green,#39734d)}[data-learning-lab="materials-phase-map"] .mp-warn{color:var(--cl-red,#b64335)}' +
      '[data-learning-lab="materials-phase-map"] .mp-grid{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(240px,.8fr);gap:16px;align-items:start;margin-top:16px}' +
      '[data-learning-lab="materials-phase-map"] .mp-chart{min-width:0;padding:6px;border:1px solid var(--border,currentColor);border-radius:6px;background:var(--bg,Canvas)}' +
      '[data-learning-lab="materials-phase-map"] svg{display:block;width:100%;height:auto;aspect-ratio:620/370}' +
      '[data-learning-lab="materials-phase-map"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="materials-phase-map"] .mp-table-wrap{max-width:100%;overflow-x:auto}' +
      '[data-learning-lab="materials-phase-map"] table{width:100%;border-collapse:collapse;min-width:360px}' +
      '[data-learning-lab="materials-phase-map"] th,[data-learning-lab="materials-phase-map"] td{padding:7px 8px;border-bottom:1px solid var(--border,currentColor);text-align:left;vertical-align:top;font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="materials-phase-map"] .mp-note{margin-top:12px;padding:10px 12px;border-left:4px solid var(--mp-gold);color:var(--fg-soft,currentColor);font-size:13px}' +
      '@media(max-width:680px){[data-learning-lab="materials-phase-map"] .mp-controls,[data-learning-lab="materials-phase-map"] .mp-grid{grid-template-columns:1fr}}' +
      '@media(prefers-reduced-motion:reduce){[data-learning-lab="materials-phase-map"] *{scroll-behavior:auto!important;transition:none!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }

  function predictionKey(result) {
    if (result.region === "two-phase") return "two-phase";
    if (result.region === "liquid") return "liquid";
    if (result.region === "alpha") return "alpha";
    return "boundary";
  }

  function renderSvg(doc, result) {
    var svg = svgElement(doc, "svg", { viewBox: "0 0 620 370", role: "img", "aria-label": "匀晶示意相图与连接线" });
    svg.appendChild(svgElement(doc, "title", {}, "匀晶示意相图：液相线、固相线和连接线"));
    var left = 55, right = 585, top = 38, bottom = 318;
    var yMin = 1150, yMax = 1510;
    function mapX(compositionPct) { return left + (right - left) * compositionPct / 100; }
    function mapY(temperatureC) { return bottom - (temperatureC - yMin) / (yMax - yMin) * (bottom - top); }
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, stroke: "currentColor", "stroke-width": 1.2 }));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: left, y2: top, stroke: "currentColor", "stroke-width": 1.2 }));
    var liquidPath = [];
    var solidPath = [];
    for (var index = 0; index <= 100; index += 1) {
      var x = mapX(index);
      liquidPath.push((index ? "L" : "M") + x.toFixed(2) + " " + mapY(liquidusTemperature(index)).toFixed(2));
      solidPath.push((index ? "L" : "M") + x.toFixed(2) + " " + mapY(solidusTemperature(index)).toFixed(2));
    }
    svg.appendChild(svgElement(doc, "path", { d: liquidPath.join(" "), fill: "none", stroke: "#39734d", "stroke-width": 3 }));
    svg.appendChild(svgElement(doc, "path", { d: solidPath.join(" "), fill: "none", stroke: "#b64335", "stroke-width": 3 }));
    svg.appendChild(svgElement(doc, "path", {
      d: "M" + mapX(0) + " " + mapY(solidusTemperature(0)) + " L" + mapX(100) + " " + mapY(solidusTemperature(100)) + " L" + mapX(100) + " " + mapY(liquidusTemperature(100)) + " Z",
      fill: "#39734d", opacity: ".06", stroke: "none"
    }));
    if (result.tieLine && result.cAlphaPct !== null && result.cLiquidPct !== null) {
      svg.appendChild(svgElement(doc, "line", { x1: mapX(result.cAlphaPct), y1: mapY(result.temperatureC), x2: mapX(result.cLiquidPct), y2: mapY(result.temperatureC), stroke: "#1769aa", "stroke-width": 4 }));
      svg.appendChild(svgElement(doc, "circle", { cx: mapX(result.cAlphaPct), cy: mapY(result.temperatureC), r: 5, fill: "#b64335" }));
      svg.appendChild(svgElement(doc, "circle", { cx: mapX(result.cLiquidPct), cy: mapY(result.temperatureC), r: 5, fill: "#39734d" }));
      svg.appendChild(svgElement(doc, "text", { x: mapX(result.cAlphaPct), y: mapY(result.temperatureC) - 12, "text-anchor": "middle", "font-size": 12 }, "C_alpha"));
      svg.appendChild(svgElement(doc, "text", { x: mapX(result.cLiquidPct), y: mapY(result.temperatureC) - 12, "text-anchor": "middle", "font-size": 12 }, "C_L"));
    }
    svg.appendChild(svgElement(doc, "line", { x1: mapX(result.compositionPct), y1: bottom, x2: mapX(result.compositionPct), y2: mapY(result.temperatureC), stroke: "#1769aa", "stroke-dasharray": "5 4" }));
    svg.appendChild(svgElement(doc, "circle", { cx: mapX(result.compositionPct), cy: mapY(result.temperatureC), r: 6, fill: "#1769aa", stroke: "Canvas", "stroke-width": 2 }));
    svg.appendChild(svgElement(doc, "text", { x: 58, y: 24, "font-size": 14, "font-weight": 700 }, "绿=液相线　红=固相线　蓝=当前连接线"));
    svg.appendChild(svgElement(doc, "text", { x: 560, y: 344, "font-size": 12, "text-anchor": "end" }, "Ni 成分 / wt%"));
    svg.appendChild(svgElement(doc, "text", { x: 20, y: 52, "font-size": 12, transform: "rotate(-90 20 52)" }, "温度 / °C"));
    svg.appendChild(svgElement(doc, "text", { x: 60, y: 308, "font-size": 11 }, "α 固相"));
    svg.appendChild(svgElement(doc, "text", { x: 520, y: 82, "font-size": 11 }, "L 液相"));
    return svg;
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument;
    ensureStyles(doc);
    var state = copyDefaults();
    var prediction = null;
    var revealed = false;
    var feedbackText = "先选择一个相区预测，再核对。";
    var feedbackClass = "mp-feedback";
    var shell = element(doc, "div", "mp-lab");
    shell.appendChild(element(doc, "p", "mp-kicker", "默认：C₀ = 45 wt% Ni，T = 1350 °C。先判断相区，揭示后再读连接线与比例。"));
    var controls = element(doc, "div", "mp-controls");
    var inputs = {};
    [["compositionPct", "总成分 C₀ / wt% Ni", 5, 95, 1], ["temperatureC", "温度 T / °C", 1190, 1470, 1]].forEach(function (spec) {
      var label = element(doc, "label", "");
      var line = element(doc, "span", "", spec[1] + " = ");
      var output = element(doc, "output", "", format(state[spec[0]], 0));
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
        feedbackClass = "mp-feedback mp-warn";
        render();
      });
      label.appendChild(line);
      label.appendChild(input);
      controls.appendChild(label);
      inputs[spec[0]] = { input: input, output: output };
    });
    shell.appendChild(controls);
    shell.appendChild(element(doc, "p", "mp-question", "预测门：当前点属于哪一类？"));
    var options = element(doc, "div", "mp-options");
    var optionButtons = [];
    [["liquid", "单相液体 L"], ["alpha", "单相固溶体 α"], ["two-phase", "L + α 两相区"], ["boundary", "恰在相界"]].forEach(function (item) {
      var button = element(doc, "button", "", item[1]);
      button.type = "button";
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", function () {
        prediction = item[0];
        feedbackText = "预测已记录；点击“揭示并核对”查看连接线。";
        feedbackClass = "mp-feedback";
        render();
      });
      options.appendChild(button);
      optionButtons.push({ value: item[0], node: button });
    });
    shell.appendChild(options);
    var actions = element(doc, "div", "mp-actions");
    var reveal = element(doc, "button", "", "揭示并核对");
    reveal.type = "button";
    reveal.className = "mp-primary";
    var reset = element(doc, "button", "", "重置");
    reset.type = "button";
    actions.appendChild(reveal);
    actions.appendChild(reset);
    shell.appendChild(actions);
    var feedback = element(doc, "p", feedbackClass, feedbackText);
    feedback.setAttribute("aria-live", "polite");
    shell.appendChild(feedback);
    var resultPanel = element(doc, "div", "mp-result");
    resultPanel.hidden = true;
    var grid = element(doc, "div", "mp-grid");
    var chart = element(doc, "div", "mp-chart");
    var tableWrap = element(doc, "div", "mp-table-wrap");
    var table = element(doc, "table");
    tableWrap.appendChild(table);
    grid.appendChild(chart);
    grid.appendChild(tableWrap);
    resultPanel.appendChild(grid);
    resultPanel.appendChild(element(doc, "p", "mp-note", "这是教学用的匀晶示意线，不是真实 Cu–Ni 实测数据；真实合金还要核对压力、活度、非平衡凝固与扩散时间。"));
    shell.appendChild(resultPanel);
    root.replaceChildren(shell);

    reveal.addEventListener("click", function () {
      if (prediction === null) {
        feedbackText = "请先作出相区预测。";
        feedbackClass = "mp-feedback mp-warn";
        render();
        return;
      }
      try {
        var result = phaseState(state.compositionPct, state.temperatureC);
        var correct = prediction === predictionKey(result);
        revealed = true;
        feedbackText = (correct ? "预测命中。" : "预测未命中；看当前点与两条边界的相对位置。") + " 判定：" + result.label + "。";
        feedbackClass = "mp-feedback " + (correct ? "mp-good" : "mp-warn");
        render();
        if (api && api.announce) api.announce(root, feedbackText);
      } catch (error) {
        feedbackText = "输入无效：" + error.message;
        feedbackClass = "mp-feedback mp-warn";
        render();
      }
    });
    reset.addEventListener("click", function () {
      state = copyDefaults();
      prediction = null;
      revealed = false;
      feedbackText = "先选择一个相区预测，再核对。";
      feedbackClass = "mp-feedback";
      render();
    });

    function render() {
      Object.keys(inputs).forEach(function (key) {
        inputs[key].input.value = String(state[key]);
        inputs[key].output.textContent = format(state[key], 0);
      });
      optionButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", prediction === item.value ? "true" : "false"); });
      feedback.textContent = feedbackText;
      feedback.className = feedbackClass;
      resultPanel.hidden = !revealed;
      if (revealed) {
        var result = phaseState(state.compositionPct, state.temperatureC);
        chart.replaceChildren(renderSvg(doc, result));
        table.innerHTML =
          "<caption>相区与杠杆定则账本</caption>" +
          "<thead><tr><th>量</th><th>结果</th><th>单位/解释</th></tr></thead><tbody>" +
          "<tr><td>输入 C₀</td><td>" + format(result.compositionPct, 1) + "</td><td>wt% Ni</td></tr>" +
          "<tr><td>输入 T</td><td>" + format(result.temperatureC, 1) + "</td><td>°C</td></tr>" +
          "<tr><td>T_L(C₀)</td><td>" + format(result.liquidusC, 1) + "</td><td>液相线</td></tr>" +
          "<tr><td>T_S(C₀)</td><td>" + format(result.solidusC, 1) + "</td><td>固相线</td></tr>" +
          "<tr><td>相区</td><td>" + result.label + "</td><td>边界单独标记</td></tr>" +
          "<tr><td>C_alpha / C_L</td><td>" + (result.cAlphaPct === null ? "-" : format(result.cAlphaPct, 1) + " / " + format(result.cLiquidPct, 1)) + "</td><td>连接线两端</td></tr>" +
          "<tr><td>f_alpha / f_L</td><td>" + format(result.alphaFraction, 3) + " / " + format(result.liquidFraction, 3) + "</td><td>质量分数</td></tr>" +
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
    var two = phaseState(45, 1350);
    check(two.region === "two-phase", "default is two phase");
    check(two.cAlphaPct < 45 && two.cLiquidPct > 45, "tie-line endpoints bracket feed composition");
    check(near(two.alphaFraction + two.liquidFraction, 1, 1e-10), "lever fractions sum");
    check(near(two.alphaFraction * two.cAlphaPct + two.liquidFraction * two.cLiquidPct, 45, 1e-7), "solute balance");
    check(near(liquidusTemperature(45), two.liquidusC), "liquidus percent wrapper");
    check(near(solidusTemperature(45), two.solidusC), "solidus percent wrapper");
    check(phaseState(45, 1450).region === "liquid", "single liquid branch");
    check(phaseState(45, 1200).region === "alpha", "single solid branch");
    check(phaseState(45, liquidusTemperature(45)).region === "liquidus-boundary", "liquidus boundary branch");
    check(phaseState(45, solidusTemperature(45)).region === "solidus-boundary", "solidus boundary branch");
    check(phaseState(0, liquidusTemperature(0)).region === "pure-boundary", "pure component boundary branch");
    var fractions = leverRule(45, two.cAlphaPct, two.cLiquidPct);
    check(near(fractions.alpha, two.alphaFraction, 1e-10), "standalone lever rule");
    check(liquidusTemperature(0) > liquidusTemperature(100), "schematic liquidus slopes down");
    check(solidusTemperature(45) < liquidusTemperature(45), "lens has a two phase gap");
    var threw = false;
    try { phaseState(101, 1300); } catch (error) { threw = true; }
    check(threw, "composition validation");
    threw = false;
    try { leverRule(5, 20, 10); } catch (error2) { threw = true; }
    check(threw, "lever endpoint validation");
    return { checks: checks };
  }

  return {
    DEFAULTS: copyDefaults(),
    liquidusTemperature: liquidusTemperature,
    solidusTemperature: solidusTemperature,
    leverRule: leverRule,
    phaseState: phaseState,
    mount: mount,
    selfTest: selfTest
  };
});
