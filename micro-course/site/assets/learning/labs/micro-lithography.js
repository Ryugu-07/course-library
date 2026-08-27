(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("micro-lithography", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("micro-lithography self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("micro-lithography self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var LAB_ID = "micro-lithography";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "micro-lithography-styles";
  var PLATFORMS = {
    dry193: { label: "193 nm dry", wavelength: 193, na: 0.93 },
    immersion193: { label: "193i immersion", wavelength: 193, na: 1.35 },
    euv033: { label: "EUV NA 0.33", wavelength: 13.5, na: 0.33 },
    euv055: { label: "High-NA EUV", wavelength: 13.5, na: 0.55 }
  };
  var DEFAULTS = { platform: "immersion193", k1: 0.25, k2: 0.5, multipattern: 1 };
  var STYLE_TEXT = [
    '[data-learning-lab="micro-lithography"]{--ml-blue:var(--cl-blue,#315f9d);--ml-gold:var(--cl-gold,#9b6a12);--ml-green:var(--cl-green,#39734d);display:block;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
    '[data-learning-lab="micro-lithography"] *{box-sizing:border-box}[data-learning-lab="micro-lithography"] h3,[data-learning-lab="micro-lithography"] h4{margin:0 0 8px;letter-spacing:0}[data-learning-lab="micro-lithography"] p{margin:8px 0}',
    '[data-learning-lab="micro-lithography"] .ml-layout{display:grid;grid-template-columns:minmax(210px,.72fr) minmax(0,1.28fr);gap:16px;align-items:start}[data-learning-lab="micro-lithography"] .ml-controls{display:grid;gap:11px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="micro-lithography"] .ml-control{display:grid;gap:5px}[data-learning-lab="micro-lithography"] label{color:var(--fg-soft);font-size:13px;font-weight:700}[data-learning-lab="micro-lithography"] output{color:var(--accent);font-variant-numeric:tabular-nums}',
    '[data-learning-lab="micro-lithography"] select,[data-learning-lab="micro-lithography"] input,[data-learning-lab="micro-lithography"] button{font:inherit;letter-spacing:0}[data-learning-lab="micro-lithography"] select{width:100%;min-height:44px;padding:7px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg)}[data-learning-lab="micro-lithography"] input[type="range"]{width:100%;min-height:44px;accent-color:var(--accent)}[data-learning-lab="micro-lithography"] button{min-height:44px;padding:8px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer}[data-learning-lab="micro-lithography"] button:hover{border-color:var(--accent)}[data-learning-lab="micro-lithography"] button:focus-visible,[data-learning-lab="micro-lithography"] select:focus-visible,[data-learning-lab="micro-lithography"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}',
    '[data-learning-lab="micro-lithography"] .ml-stage{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg,transparent);overflow:hidden}[data-learning-lab="micro-lithography"] svg{display:block;width:100%;height:auto;color:var(--fg,currentColor)}[data-learning-lab="micro-lithography"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}[data-learning-lab="micro-lithography"] .ml-r{fill:var(--ml-blue)}[data-learning-lab="micro-lithography"] .ml-dof{fill:var(--ml-gold)}[data-learning-lab="micro-lithography"] .ml-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.7}',
    '[data-learning-lab="micro-lithography"] .ml-predict{display:grid;gap:7px;margin:12px 0;padding:11px 12px;border-left:3px solid var(--cl-gold,#9b6a12);background:var(--block-bg,var(--bg))}[data-learning-lab="micro-lithography"] .ml-feedback{min-height:1.6em;color:var(--fg-soft);font-size:13px}[data-learning-lab="micro-lithography"] .ml-ok{color:var(--ml-green);font-weight:700}[data-learning-lab="micro-lithography"] .ml-no{color:var(--cl-red,#b64335);font-weight:700}',
    '[data-learning-lab="micro-lithography"] .ml-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:12px 0}[data-learning-lab="micro-lithography"] .ml-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}[data-learning-lab="micro-lithography"] .ml-metric span{display:block;color:var(--fg-soft);font-size:11.5px}[data-learning-lab="micro-lithography"] .ml-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}[data-learning-lab="micro-lithography"] .ml-note{color:var(--fg-soft);font-size:13px;line-height:1.7}',
    '@media(max-width:820px){[data-learning-lab="micro-lithography"] .ml-layout{grid-template-columns:minmax(0,1fr)}}@media(prefers-reduced-motion:reduce){[data-learning-lab="micro-lithography"] *{transition:none!important;animation:none!important}}'
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
      var value = attrs[key]; if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "htmlFor") node.setAttribute("for", String(value));
      else if (key === "text") node.textContent = String(value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) {
      if (child !== undefined && child !== null && child !== false) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }
  function svgElement(doc, tag, attrs, children) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) { if (attrs[key] !== undefined && attrs[key] !== null) node.setAttribute(key, String(attrs[key])); });
    (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) { if (child !== undefined && child !== null) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child))); });
    return node;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function installStyles(doc) {
    if (!doc || !doc.createElement || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var style = doc.createElement("style"); style.id = STYLE_ID; style.textContent = STYLE_TEXT; (doc.head || doc.documentElement).appendChild(style);
  }
  function announce(api, rootNode, message) { if (api && typeof api.announce === "function") api.announce(rootNode, message); }
  function normalize(input) {
    var source = input || {};
    var platform = source.platform === undefined ? DEFAULTS.platform : String(source.platform);
    var k1 = Number(source.k1 === undefined ? DEFAULTS.k1 : source.k1);
    var k2 = Number(source.k2 === undefined ? DEFAULTS.k2 : source.k2);
    var multipattern = Math.round(Number(source.multipattern === undefined ? DEFAULTS.multipattern : source.multipattern));
    if (!PLATFORMS[platform]) throw new RangeError("unknown platform");
    if (k1 < 0.2 || k1 > 0.7 || k2 <= 0 || k2 > 1 || [1, 2, 4].indexOf(multipattern) === -1) throw new RangeError("invalid lithography controls");
    return { platform: platform, k1: k1, k2: k2, multipattern: multipattern };
  }
  function calculate(input) {
    var config = normalize(input); var platform = PLATFORMS[config.platform];
    var resolution = config.k1 * platform.wavelength / platform.na;
    var dof = config.k2 * platform.wavelength / (platform.na * platform.na);
    return { config: config, platform: platform, resolution: resolution, dof: dof, effectivePitch: resolution / config.multipattern, ridge: resolution * platform.na };
  }
  function mount(rootNode, api) {
    var doc = rootNode.ownerDocument || document; installStyles(doc); clear(rootNode);
    var title = element(doc, "h3", { text: "瑞利公式实验：分辨率换焦深" });
    var note = element(doc, "p", { className: "ml-note", text: "先预测 NA 的代价，再改变波长、NA、k1 或多重图形化。" });
    var predict = element(doc, "div", { className: "ml-predict" }, [
      element(doc, "label", { htmlFor: LAB_ID + "-prediction", text: "当 NA 提高时，最可能发生什么？" }),
      element(doc, "select", { id: LAB_ID + "-prediction", "aria-label": "数值孔径变化预测" }, [
        element(doc, "option", { value: "both-down", text: "R 变小，DOF 也变小" }),
        element(doc, "option", { value: "r-down", text: "只有 R 变小" }),
        element(doc, "option", { value: "both-up", text: "R 与 DOF 都变大" })
      ]),
      element(doc, "button", { type: "button", text: "检验预测" }),
      element(doc, "div", { className: "ml-feedback", "aria-live": "polite" })
    ]);
    var controls = element(doc, "div", { className: "ml-controls" });
    function addRange(label, id, min, max, step, value, suffix, digits) {
      var output = element(doc, "output", { for: id, text: format(value, digits) + suffix });
      var input = element(doc, "input", { id: id, type: "range", min: min, max: max, step: step, value: value });
      input.addEventListener("input", function () { output.textContent = format(Number(input.value), digits) + suffix; render(); });
      controls.appendChild(element(doc, "div", { className: "ml-control" }, [element(doc, "label", { htmlFor: id, text: label }), output, input]));
      return input;
    }
    var platformSelect = element(doc, "select", { id: LAB_ID + "-platform" });
    Object.keys(PLATFORMS).forEach(function (key) { platformSelect.appendChild(element(doc, "option", { value: key, text: PLATFORMS[key].label })); });
    platformSelect.value = DEFAULTS.platform; platformSelect.addEventListener("change", render);
    controls.appendChild(element(doc, "div", { className: "ml-control" }, [element(doc, "label", { htmlFor: platformSelect.id, text: "曝光平台" }), platformSelect]));
    var k1 = addRange("工艺因子 k1", LAB_ID + "-k1", 0.2, 0.7, 0.01, DEFAULTS.k1, "", 2);
    var multipattern = element(doc, "select", { id: LAB_ID + "-multi" }, [element(doc, "option", { value: "1", text: "单次曝光" }), element(doc, "option", { value: "2", text: "双重图形化" }), element(doc, "option", { value: "4", text: "四重图形化" })]);
    multipattern.value = String(DEFAULTS.multipattern); multipattern.addEventListener("change", render);
    controls.appendChild(element(doc, "div", { className: "ml-control" }, [element(doc, "label", { htmlFor: multipattern.id, text: "图形化次数 m" }), multipattern]));
    var stage = element(doc, "div", { className: "ml-stage" }); var result = element(doc, "div");
    rootNode.appendChild(title); rootNode.appendChild(note); rootNode.appendChild(predict); rootNode.appendChild(element(doc, "div", { className: "ml-layout" }, [controls, element(doc, "div", {}, [stage, result])]));
    function renderStage(data) {
      var chart = svgElement(doc, "svg", { viewBox: "0 0 720 270", role: "img", "aria-label": "光刻分辨率和焦深的水平比较" });
      chart.appendChild(svgElement(doc, "title", {}, "分辨率与焦深比较")); chart.appendChild(svgElement(doc, "desc", {}, "两条水平条分别表示以 100 nm 为参考的分辨率与焦深；分辨率越小越好，焦深需要覆盖表面起伏。"));
      var rows = [{ label: "R 分辨率（越小越好）", value: data.resolution, klass: "ml-r", scale: 100 }, { label: "DOF 焦深（需要足够大）", value: data.dof, klass: "ml-dof", scale: 120 }];
      rows.forEach(function (row, index) {
        var y = 55 + index * 95; chart.appendChild(svgElement(doc, "text", { x: 10, y: y - 12, "font-size": 12 }, row.label));
        [0, 0.25, 0.5, 0.75, 1].forEach(function (tick) { var x = 180 + tick * 500; chart.appendChild(svgElement(doc, "line", { x1: x, y1: y, x2: x, y2: y + 30, class: "ml-grid" })); });
        chart.appendChild(svgElement(doc, "rect", { x: 180, y: y, width: 500, height: 30, fill: "var(--border)" }));
        chart.appendChild(svgElement(doc, "rect", { x: 180, y: y, width: 500 * Math.min(row.value / row.scale, 1), height: 30, class: row.klass }));
        chart.appendChild(svgElement(doc, "text", { x: 690, y: y + 21, "text-anchor": "end", "font-size": 13 }, format(row.value, 1) + " nm"));
      });
      chart.appendChild(svgElement(doc, "text", { x: 180, y: 250, "font-size": 11 }, "条长仅作同一实验内的相对读数；公式值见下方指标")); stage.replaceChildren(chart);
    }
    function render() {
      var data = calculate({ platform: platformSelect.value, k1: Number(k1.value), multipattern: Number(multipattern.value), k2: DEFAULTS.k2 }); renderStage(data);
      result.replaceChildren(element(doc, "div", { className: "ml-metrics" }, [
        element(doc, "div", { className: "ml-metric" }, [element(doc, "span", { text: "波长 lambda" }), element(doc, "strong", { text: data.platform.wavelength + " nm" })]),
        element(doc, "div", { className: "ml-metric" }, [element(doc, "span", { text: "NA" }), element(doc, "strong", { text: format(data.platform.na, 2) })]),
        element(doc, "div", { className: "ml-metric" }, [element(doc, "span", { text: "单次 R" }), element(doc, "strong", { text: format(data.resolution, 1) + " nm" })]),
        element(doc, "div", { className: "ml-metric" }, [element(doc, "span", { text: "DOF" }), element(doc, "strong", { text: format(data.dof, 1) + " nm" })]),
        element(doc, "div", { className: "ml-metric" }, [element(doc, "span", { text: "教学有效间距" }), element(doc, "strong", { text: format(data.effectivePitch, 1) + " nm" })])
      ]));
    }
    predict.querySelector("button").addEventListener("click", function () {
      var answer = predict.querySelector("select").value; var feedback = predict.querySelector(".ml-feedback");
      feedback.className = "ml-feedback " + (answer === "both-down" ? "ml-ok" : "ml-no");
      feedback.textContent = answer === "both-down" ? "正确：R 按 1/NA 缩小，DOF 按 1/NA² 缩小，焦深代价更快。" : "再看 DOF = k2*lambda/NA²：NA 变化会同时影响两个量。";
      announce(api, rootNode, feedback.textContent);
    });
    render();
  }
  function selfTest() {
    var checks = 0; function check(condition, message) { checks += 1; assert(condition, message); }
    var dry = calculate({ platform: "dry193", k1: 0.25, k2: 0.5, multipattern: 1 });
    var immersion = calculate({ platform: "immersion193", k1: 0.25, k2: 0.5, multipattern: 1 });
    var euv = calculate({ platform: "euv033", k1: 0.25, k2: 0.5, multipattern: 1 });
    check(near(dry.resolution, 193 * 0.25 / 0.93), "dry Rayleigh resolution");
    check(near(immersion.dof, 0.5 * 193 / (1.35 * 1.35)), "immersion DOF");
    check(euv.resolution < immersion.resolution, "EUV resolution is smaller");
    var high = calculate({ platform: "euv055", k1: 0.25, k2: 0.5, multipattern: 1 });
    check(high.resolution < euv.resolution && high.dof < euv.dof, "higher NA trades depth");
    var four = calculate({ platform: "immersion193", k1: 0.25, k2: 0.5, multipattern: 4 });
    check(near(four.resolution, immersion.resolution), "multipattern does not change single exposure R");
    check(near(four.effectivePitch, immersion.resolution / 4), "effective pitch bookkeeping");
    check(near(immersion.ridge, 193 * 0.25), "R times NA invariant");
    return { checks: checks };
  }
  return { calculate: calculate, mount: mount, selfTest: selfTest, PLATFORMS: PLATFORMS };
});
