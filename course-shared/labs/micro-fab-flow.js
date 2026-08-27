(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("micro-fab-flow", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("micro-fab-flow self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("micro-fab-flow self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var LAB_ID = "micro-fab-flow";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "micro-fab-flow-styles";
  var DEFAULTS = { diameter: 300, dieArea: 100, steps: 8, defectPct: 5, waferCost: 8000, postMetalTemp: 800 };
  var USABLE_FRACTION = 0.9;

  var STYLE_TEXT = [
    '[data-learning-lab="micro-fab-flow"]{--mff-blue:var(--cl-blue,#315f9d);--mff-green:var(--cl-green,#39734d);--mff-red:var(--cl-red,#b64335);display:block;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
    '[data-learning-lab="micro-fab-flow"] *{box-sizing:border-box}[data-learning-lab="micro-fab-flow"] h3,[data-learning-lab="micro-fab-flow"] h4{margin:0 0 8px;letter-spacing:0}[data-learning-lab="micro-fab-flow"] p{margin:8px 0}',
    '[data-learning-lab="micro-fab-flow"] .mff-layout{display:grid;grid-template-columns:minmax(210px,.75fr) minmax(0,1.25fr);gap:16px;align-items:start}[data-learning-lab="micro-fab-flow"] .mff-controls{display:grid;gap:11px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="micro-fab-flow"] .mff-control{display:grid;gap:5px}[data-learning-lab="micro-fab-flow"] label{color:var(--fg-soft,currentColor);font-size:13px;font-weight:700}[data-learning-lab="micro-fab-flow"] output{color:var(--accent);font-variant-numeric:tabular-nums}',
    '[data-learning-lab="micro-fab-flow"] select,[data-learning-lab="micro-fab-flow"] input,[data-learning-lab="micro-fab-flow"] button{font:inherit;letter-spacing:0}[data-learning-lab="micro-fab-flow"] select,[data-learning-lab="micro-fab-flow"] input[type="number"]{width:100%;min-height:44px;padding:7px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg)}[data-learning-lab="micro-fab-flow"] input[type="range"]{width:100%;min-height:44px;accent-color:var(--accent)}[data-learning-lab="micro-fab-flow"] button{min-height:44px;padding:8px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer}[data-learning-lab="micro-fab-flow"] button:hover{border-color:var(--accent)}[data-learning-lab="micro-fab-flow"] button:focus-visible,[data-learning-lab="micro-fab-flow"] select:focus-visible,[data-learning-lab="micro-fab-flow"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}',
    '[data-learning-lab="micro-fab-flow"] .mff-stage{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg,transparent);overflow:hidden}[data-learning-lab="micro-fab-flow"] svg{display:block;width:100%;height:auto;color:var(--fg,currentColor)}[data-learning-lab="micro-fab-flow"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}[data-learning-lab="micro-fab-flow"] .mff-line{stroke:var(--border);stroke-width:2}[data-learning-lab="micro-fab-flow"] .mff-box{fill:var(--bg);stroke:var(--mff-blue);stroke-width:1.5}[data-learning-lab="micro-fab-flow"] .mff-hot{fill:color-mix(in srgb,var(--mff-red) 18%,var(--bg));stroke:var(--mff-red)}[data-learning-lab="micro-fab-flow"] .mff-good{fill:var(--mff-green)}[data-learning-lab="micro-fab-flow"] .mff-bad{fill:var(--mff-red)}',
    '[data-learning-lab="micro-fab-flow"] .mff-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:12px 0}[data-learning-lab="micro-fab-flow"] .mff-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}[data-learning-lab="micro-fab-flow"] .mff-metric span{display:block;color:var(--fg-soft);font-size:11.5px}[data-learning-lab="micro-fab-flow"] .mff-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
    '[data-learning-lab="micro-fab-flow"] .mff-predict{display:grid;gap:7px;margin:12px 0;padding:11px 12px;border-left:3px solid var(--cl-gold,#9b6a12);background:var(--block-bg,var(--bg))}[data-learning-lab="micro-fab-flow"] .mff-feedback{min-height:1.6em;color:var(--fg-soft);font-size:13px}[data-learning-lab="micro-fab-flow"] .mff-good-text{color:var(--mff-green);font-weight:700}[data-learning-lab="micro-fab-flow"] .mff-bad-text{color:var(--mff-red);font-weight:700}[data-learning-lab="micro-fab-flow"] .mff-note{color:var(--fg-soft);font-size:13px;line-height:1.7}',
    '@media(max-width:820px){[data-learning-lab="micro-fab-flow"] .mff-layout{grid-template-columns:minmax(0,1fr)}}@media(prefers-reduced-motion:reduce){[data-learning-lab="micro-fab-flow"] *{transition:none!important;animation:none!important}}'
  ].join("");

  function assert(condition, message) { if (!condition) throw new Error(message); }
  function near(a, b, tolerance) { return Math.abs(a - b) <= (tolerance || 1e-9) * Math.max(1, Math.abs(a), Math.abs(b)); }
  function format(value, digits) {
    var places = digits === undefined ? 2 : Number(digits);
    var text = Number(value).toFixed(places);
    return places === 0 ? text : text.replace(/0+$/, "").replace(/\.$/, "");
  }
  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "htmlFor") node.setAttribute("for", String(value));
      else if (key === "text") node.textContent = String(value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }
  function svgElement(doc, tag, attrs, children) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (attrs[key] !== undefined && attrs[key] !== null) node.setAttribute(key, String(attrs[key]));
    });
    (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) {
      if (child !== undefined && child !== null) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function installStyles(doc) {
    if (!doc || !doc.createElement || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var style = doc.createElement("style"); style.id = STYLE_ID; style.textContent = STYLE_TEXT;
    (doc.head || doc.documentElement).appendChild(style);
  }
  function announce(api, rootNode, message) { if (api && typeof api.announce === "function") api.announce(rootNode, message); }

  function normalize(input) {
    var source = input || {};
    var diameter = Number(source.diameter === undefined ? DEFAULTS.diameter : source.diameter);
    var dieArea = Number(source.dieArea === undefined ? DEFAULTS.dieArea : source.dieArea);
    var steps = Math.round(Number(source.steps === undefined ? DEFAULTS.steps : source.steps));
    var defectPct = Number(source.defectPct === undefined ? DEFAULTS.defectPct : source.defectPct);
    var waferCost = Number(source.waferCost === undefined ? (diameter === 200 ? 4500 : DEFAULTS.waferCost) : source.waferCost);
    var postMetalTemp = Number(source.postMetalTemp === undefined ? DEFAULTS.postMetalTemp : source.postMetalTemp);
    if (diameter !== 200 && diameter !== 300) throw new RangeError("diameter must be 200 or 300");
    if (!(dieArea > 0 && dieArea <= 800)) throw new RangeError("dieArea out of range");
    if (steps < 1 || steps > 20) throw new RangeError("steps out of range");
    if (defectPct < 0 || defectPct >= 100) throw new RangeError("defectPct out of range");
    if (!(waferCost > 0) || postMetalTemp < 100 || postMetalTemp > 1000) throw new RangeError("invalid process inputs");
    return { diameter: diameter, dieArea: dieArea, steps: steps, defectPct: defectPct, waferCost: waferCost, postMetalTemp: postMetalTemp };
  }
  function simulate(input) {
    var config = normalize(input);
    var waferArea = Math.PI * Math.pow(config.diameter / 2, 2);
    var usableArea = USABLE_FRACTION * waferArea;
    var gross = Math.floor(usableArea / config.dieArea);
    var yieldRate = Math.pow(1 - config.defectPct / 100, config.steps);
    var good = gross * yieldRate;
    return {
      config: config,
      waferArea: waferArea,
      usableArea: usableArea,
      grossDies: gross,
      yieldRate: yieldRate,
      goodDies: good,
      costPerGood: config.waferCost / good,
      thermalPass: config.postMetalTemp <= 400
    };
  }
  function mount(rootNode, api) {
    var doc = rootNode.ownerDocument || document;
    installStyles(doc); clear(rootNode);
    var title = element(doc, "h3", { text: "晶圆制造账本：面积、良率与热预算" });
    var intro = element(doc, "p", { className: "mff-note", text: "先预测：改变一个工艺旋钮，观察几何产出和概率产出如何分开。" });
    var predict = element(doc, "div", { className: "mff-predict" }, [
      element(doc, "label", { htmlFor: LAB_ID + "-prediction", text: "300 mm 相对 200 mm 的好裸片数：" }),
      element(doc, "select", { id: LAB_ID + "-prediction", "aria-label": "好裸片数量预测" }, [
        element(doc, "option", { value: "exact", text: "恰好 2.25 倍" }),
        element(doc, "option", { value: "not-exact", text: "不一定是 2.25 倍" }),
        element(doc, "option", { value: "cheaper", text: "200 mm 一定更便宜" })
      ]),
      element(doc, "button", { type: "button", className: "mff-check", text: "检验预测" }),
      element(doc, "div", { className: "mff-feedback", "aria-live": "polite" })
    ]);
    var controls = element(doc, "div", { className: "mff-controls" });
    function rangeControl(label, id, min, max, step, value, suffix) {
      var output = element(doc, "output", { for: id, text: format(value, step < 1 ? 1 : 0) + suffix });
      var input = element(doc, "input", { id: id, type: "range", min: min, max: max, step: step, value: value });
      input.addEventListener("input", function () { output.textContent = format(Number(input.value), step < 1 ? 1 : 0) + suffix; render(); });
      controls.appendChild(element(doc, "div", { className: "mff-control" }, [element(doc, "label", { htmlFor: id, text: label }), output, input]));
      return input;
    }
    var diameter = element(doc, "select", { id: LAB_ID + "-diameter" }, [element(doc, "option", { value: "200", text: "200 mm" }), element(doc, "option", { value: "300", text: "300 mm" })]);
    diameter.value = String(DEFAULTS.diameter); diameter.addEventListener("change", render);
    controls.appendChild(element(doc, "div", { className: "mff-control" }, [element(doc, "label", { htmlFor: diameter.id, text: "晶圆直径" }), diameter]));
    var dieArea = rangeControl("裸片面积", LAB_ID + "-die", 50, 400, 10, DEFAULTS.dieArea, " mm²");
    var steps = rangeControl("关键工序数", LAB_ID + "-steps", 1, 16, 1, DEFAULTS.steps, " 道");
    var defect = rangeControl("每道致命缺陷率", LAB_ID + "-defect", 0, 10, 0.5, DEFAULTS.defectPct, "%");
    var temp = rangeControl("BEOL 后候选热处理", LAB_ID + "-temp", 200, 900, 50, DEFAULTS.postMetalTemp, " °C");
    var stage = element(doc, "div", { className: "mff-stage" });
    var result = element(doc, "div");
    var layout = element(doc, "div", { className: "mff-layout" }, [controls, element(doc, "div", {}, [stage, result])]);
    rootNode.appendChild(title); rootNode.appendChild(intro); rootNode.appendChild(predict); rootNode.appendChild(layout);
    function renderStage(data) {
      var chart = svgElement(doc, "svg", { viewBox: "0 0 720 270", role: "img", "aria-label": "六道晶圆制造工序与热预算状态" });
      chart.appendChild(svgElement(doc, "title", {}, "晶圆制造状态流"));
      chart.appendChild(svgElement(doc, "desc", {}, "沉积、光刻、刻蚀、掺杂、CMP 和后续热处理依次改变晶圆状态；最后一步超过 400 摄氏度时标红。"));
      var names = ["沉积", "光刻", "刻蚀", "掺杂", "CMP", "BEOL 后热处理"];
      names.forEach(function (name, index) {
        var x = 12 + index * 117;
        if (index) chart.appendChild(svgElement(doc, "line", { x1: x - 22, y1: 72, x2: x - 8, y2: 72, class: "mff-line" }));
        var hot = index === 5 && !data.thermalPass;
        chart.appendChild(svgElement(doc, "rect", { x: x, y: 40, width: 94, height: 64, rx: 5, class: hot ? "mff-box mff-hot" : "mff-box" }));
        chart.appendChild(svgElement(doc, "text", { x: x + 47, y: 68, "text-anchor": "middle", "font-size": 12 }, name));
        chart.appendChild(svgElement(doc, "text", { x: x + 47, y: 88, "text-anchor": "middle", "font-size": 10 }, index === 5 ? data.config.postMetalTemp + " °C" : "S" + (index + 1)));
      });
      chart.appendChild(svgElement(doc, "circle", { cx: 80, cy: 184, r: 38, fill: "none", stroke: "currentColor", "stroke-width": 2 }));
      chart.appendChild(svgElement(doc, "circle", { cx: 80, cy: 184, r: 3, class: "mff-good" }));
      chart.appendChild(svgElement(doc, "text", { x: 138, y: 179, "font-size": 12 }, "整片晶圆同步推进"));
      chart.appendChild(svgElement(doc, "text", { x: 138, y: 198, "font-size": 11 }, "热预算上限 400 °C"));
      var barX = 410, barY = 168, barW = 260;
      chart.appendChild(svgElement(doc, "rect", { x: barX, y: barY, width: barW, height: 18, fill: "var(--border)" }));
      chart.appendChild(svgElement(doc, "rect", { x: barX, y: barY, width: barW * Math.min(data.config.postMetalTemp, 1000) / 1000, height: 18, class: data.thermalPass ? "mff-good" : "mff-bad" }));
      chart.appendChild(svgElement(doc, "line", { x1: barX + barW * 0.4, y1: barY - 8, x2: barX + barW * 0.4, y2: barY + 26, stroke: "currentColor", "stroke-dasharray": "3 3" }));
      chart.appendChild(svgElement(doc, "text", { x: barX, y: 209, "font-size": 11 }, "0"));
      chart.appendChild(svgElement(doc, "text", { x: barX + barW * 0.4, y: 209, "font-size": 11, "text-anchor": "middle" }, "400 °C limit"));
      chart.appendChild(svgElement(doc, "text", { x: barX + barW, y: 209, "font-size": 11, "text-anchor": "end" }, "1000 °C"));
      stage.replaceChildren(chart);
    }
    function render() {
      var data = simulate({ diameter: Number(diameter.value), dieArea: Number(dieArea.value), steps: Number(steps.value), defectPct: Number(defect.value), postMetalTemp: Number(temp.value), waferCost: diameter.value === "300" ? 8000 : 4500 });
      renderStage(data);
      result.replaceChildren(element(doc, "div", { className: "mff-metrics" }, [
        element(doc, "div", { className: "mff-metric" }, [element(doc, "span", { text: "全圆面积" }), element(doc, "strong", { text: format(data.waferArea, 0) + " mm²" })]),
        element(doc, "div", { className: "mff-metric" }, [element(doc, "span", { text: "可用面积（90%）" }), element(doc, "strong", { text: format(data.usableArea, 0) + " mm²" })]),
        element(doc, "div", { className: "mff-metric" }, [element(doc, "span", { text: "可用区几何裸片" }), element(doc, "strong", { text: String(data.grossDies) })]),
        element(doc, "div", { className: "mff-metric" }, [element(doc, "span", { text: "独立模型 Y" }), element(doc, "strong", { text: format(data.yieldRate * 100, 1) + "%" })]),
        element(doc, "div", { className: "mff-metric" }, [element(doc, "span", { text: "好裸片估计" }), element(doc, "strong", { text: format(data.goodDies, 1) })]),
        element(doc, "div", { className: "mff-metric" }, [element(doc, "span", { text: "单颗成本" }), element(doc, "strong", { text: format(data.costPerGood, 2) })]),
        element(doc, "div", { className: "mff-metric" }, [element(doc, "span", { text: "热预算" }), element(doc, "strong", { className: data.thermalPass ? "mff-good-text" : "mff-bad-text", text: data.thermalPass ? "通过" : "失败" })])
      ]));
    }
    predict.querySelector("button").addEventListener("click", function () {
      var answer = predict.querySelector("select").value;
      var feedback = predict.querySelector(".mff-feedback");
      feedback.className = "mff-feedback " + (answer === "not-exact" ? "mff-good-text" : "mff-bad-text");
      feedback.textContent = answer === "not-exact" ? "正确方向：圆片面积比例是 2.25，但取整、边缘和良率会改变好裸片比。" : "再检查：2.25 是几何面积比例，不是包含取整和概率项的好裸片比例。";
      announce(api, rootNode, feedback.textContent);
    });
    render();
  }
  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var two = simulate({ diameter: 200, dieArea: 100, steps: 8, defectPct: 5, waferCost: 4500, postMetalTemp: 350 });
    var three = simulate({ diameter: 300, dieArea: 100, steps: 8, defectPct: 5, waferCost: 8000, postMetalTemp: 350 });
    check(near(three.waferArea / two.waferArea, 2.25), "wafer area ratio");
    check(near(two.usableArea, two.waferArea * USABLE_FRACTION) && near(three.usableArea, three.waferArea * USABLE_FRACTION), "usable area fraction");
    check(two.grossDies === 282 && three.grossDies === 636, "gross die counts");
    check(near(two.yieldRate, Math.pow(0.95, 8)), "yield product");
    check(three.goodDies > two.goodDies, "larger wafer produces more good dies");
    check(simulate({ diameter: 300, dieArea: 100, steps: 8, defectPct: 5, waferCost: 8000, postMetalTemp: 800 }).thermalPass === false, "thermal guard");
    check(simulate({ diameter: 300, dieArea: 100, steps: 8, defectPct: 5, waferCost: 8000, postMetalTemp: 350 }).thermalPass === true, "low temperature passes");
    check(near(simulate({ diameter: 200, dieArea: 100, steps: 8, defectPct: 5, postMetalTemp: 350 }).config.waferCost, 4500), "200 mm default wafer cost");
    check(three.costPerGood > 0 && Number.isFinite(three.costPerGood), "cost is finite");
    return { checks: checks };
  }
  return { normalize: normalize, simulate: simulate, mount: mount, selfTest: selfTest };
});
