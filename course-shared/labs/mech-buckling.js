(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("mech-buckling", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("mech-buckling self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("mech-buckling self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(
  typeof window !== "undefined"
    ? window
    : typeof globalThis !== "undefined"
      ? globalThis
      : null,
  function (host) {
    "use strict";

    var LAB_ID = "mech-buckling";
    var STYLE_ID = "cl-mech-buckling-styles";
    var SVG_NS = "http://www.w3.org/2000/svg";
    var EPS = 1e-9;
    var INSTANCE = 0;
    var END_CONDITIONS = {
      "pin-pin": { label: "铰—铰", K: 1 },
      "fixed-free": { label: "固—自由", K: 2 },
      "fixed-fixed": { label: "固—固", K: 0.5 },
      "fixed-pin": { label: "固—铰", K: 0.7 }
    };
    var DEFAULTS = {
      E: 210e9,
      L: 2.4,
      d: 0.04,
      sigmaY: 250e6,
      K: 1,
      loadRatio: 0.55,
      e0: 0.002,
      bt: 20
    };

    function assert(condition, message) {
      if (!condition) throw new Error(message);
    }

    function near(left, right, tolerance) {
      var scale = Math.max(1, Math.abs(left), Math.abs(right));
      return Math.abs(left - right) <= (tolerance === undefined ? 1e-9 : tolerance) * scale;
    }

    function finite(value, label) {
      var number = Number(value);
      if (!isFinite(number)) throw new RangeError(label + " must be finite");
      return number;
    }

    function positive(value, label) {
      var number = finite(value, label);
      if (!(number > 0)) throw new RangeError(label + " must be positive");
      return number;
    }

    function normalizeConfig(input) {
      var source = input || {};
      var config = {
        E: positive(source.E === undefined ? DEFAULTS.E : source.E, "E"),
        L: positive(source.L === undefined ? DEFAULTS.L : source.L, "L"),
        d: positive(source.d === undefined ? DEFAULTS.d : source.d, "d"),
        sigmaY: positive(source.sigmaY === undefined ? DEFAULTS.sigmaY : source.sigmaY, "sigmaY"),
        K: positive(source.K === undefined ? DEFAULTS.K : source.K, "K"),
        loadRatio: finite(source.loadRatio === undefined ? DEFAULTS.loadRatio : source.loadRatio, "P/Pcr"),
        e0: finite(source.e0 === undefined ? DEFAULTS.e0 : source.e0, "e0"),
        bt: finite(source.bt === undefined ? DEFAULTS.bt : source.bt, "b/t")
      };
      if (config.E < 1e9 || config.E > 400e9) throw new RangeError("E must be in [1, 400] GPa");
      if (config.L < 0.1 || config.L > 20) throw new RangeError("L must be in [0.1, 20] m");
      if (config.d < 0.001 || config.d > 0.5) throw new RangeError("d must be in [1, 500] mm");
      if (config.sigmaY < 1e6 || config.sigmaY > 2000e6) throw new RangeError("sigmaY must be in [1, 2000] MPa");
      if (config.K < 0.45 || config.K > 2.1) throw new RangeError("K must be in [0.45, 2.1]");
      if (config.loadRatio < 0 || config.loadRatio > 1.05) throw new RangeError("P/Pcr must be in [0, 1.05]");
      if (config.e0 < 0 || config.e0 > 0.02) throw new RangeError("e0 must be in [0, 20] mm");
      if (config.bt < 5 || config.bt > 100) throw new RangeError("b/t must be in [5, 100]");
      return config;
    }

    function evaluate(input, sampleCount) {
      var config = normalizeConfig(input);
      var area = Math.PI * config.d * config.d / 4;
      var I = Math.PI * Math.pow(config.d, 4) / 64;
      var radius = Math.sqrt(I / area);
      var slenderness = config.K * config.L / radius;
      var Pcr = Math.PI * Math.PI * config.E * I / Math.pow(config.K * config.L, 2);
      var Py = area * config.sigmaY;
      var eulerStress = Pcr / area;
      var transitionSlenderness = Math.PI * Math.sqrt(config.E / config.sigmaY);
      var load = config.loadRatio * Pcr;
      var belowBifurcation = config.loadRatio < 1 - EPS;
      var amplification = belowBifurcation ? 1 / (1 - config.loadRatio) : Infinity;
      var midDeflection = belowBifurcation ? config.e0 * amplification : Infinity;
      var elasticCandidate = slenderness >= transitionSlenderness;
      var localWarning = config.bt > 40;
      var idealLimit = Math.min(Pcr, Py);
      var status = "elastic-imperfect";
      if (!belowBifurcation) status = "bifurcation-reached";
      else if (!elasticCandidate) status = "yield-or-inelastic";
      else if (localWarning) status = "local-buckling-screen";
      var count = Math.max(8, Math.floor(sampleCount === undefined ? 20 : sampleCount));
      var shape = [];
      for (var index = 0; index <= count; index += 1) {
        var fraction = index / count;
        var sine = Math.sin(Math.PI * fraction);
        shape.push({
          fraction: fraction,
          initial: config.e0 * sine,
          amplified: belowBifurcation ? config.e0 * amplification * sine : Infinity
        });
      }
      return {
        config: config,
        area: area,
        I: I,
        radius: radius,
        slenderness: slenderness,
        transitionSlenderness: transitionSlenderness,
        Pcr: Pcr,
        Py: Py,
        idealLimit: idealLimit,
        eulerStress: eulerStress,
        load: load,
        amplification: amplification,
        midDeflection: midDeflection,
        elasticCandidate: elasticCandidate,
        localWarning: localWarning,
        belowBifurcation: belowBifurcation,
        status: status,
        shape: shape
      };
    }

    function formatNumber(value, digits) {
      if (!isFinite(value)) return "∞";
      var places = digits === undefined ? 3 : digits;
      if (places === 0) return value.toFixed(0);
      if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4));
      return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
    }

    function clear(node) {
      while (node && node.firstChild) node.removeChild(node.firstChild);
    }

    function element(doc, tag, attrs, children) {
      var node = doc.createElement(tag);
      Object.keys(attrs || {}).forEach(function (key) {
        var value = attrs[key];
        if (value === undefined || value === null) return;
        if (key === "className") node.setAttribute("class", value);
        else if (key === "htmlFor") node.setAttribute("for", value);
        else if (key === "text") node.textContent = String(value);
        else node.setAttribute(key, String(value));
      });
      (children || []).forEach(function (child) {
        if (child !== undefined && child !== null) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
      });
      return node;
    }

    function svgElement(doc, tag, attrs) {
      var node = doc.createElementNS(SVG_NS, tag);
      Object.keys(attrs || {}).forEach(function (key) {
        if (attrs[key] !== undefined && attrs[key] !== null) node.setAttribute(key, String(attrs[key]));
      });
      return node;
    }

    function svgText(doc, parent, text, x, y, className) {
      var node = svgElement(doc, "text", { x: x, y: y, "class": className || "mbk-muted" });
      node.textContent = text;
      parent.appendChild(node);
    }

    function drawColumn(doc, svg, result) {
      clear(svg);
      var width = 720;
      var height = 430;
      var xCenter = 315;
      var yTop = 70;
      var yBottom = 340;
      var maxVisual = 130;
      var amplitude = result.belowBifurcation ? Math.min(maxVisual, result.midDeflection * 10000) : maxVisual;
      var initialPoints = [];
      var amplifiedPoints = [];
      result.shape.forEach(function (point, index) {
        var y = yTop + (yBottom - yTop) * point.fraction;
        var initialX = xCenter + Math.min(maxVisual, point.initial * 10000) * Math.sin(Math.PI * point.fraction);
        var amplifiedX = xCenter + (result.belowBifurcation ? Math.min(maxVisual, point.amplified * 10000) : maxVisual) * Math.sin(Math.PI * point.fraction);
        initialPoints.push((initialX + 60) + "," + y);
        amplifiedPoints.push((amplifiedX + 60) + "," + y);
      });
      svg.setAttribute("viewBox", "0 0 " + width + " " + height);
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", "柱的初始弯曲与轴压下缺陷放大后的侧向形状，含端部支撑和临界状态");
      svg.appendChild(svgElement(doc, "line", { x1: 60, y1: yTop, x2: 60, y2: yBottom, "class": "mbk-axis" }));
      svg.appendChild(svgElement(doc, "polyline", { points: initialPoints.join(" "), "class": "mbk-initial" }));
      svg.appendChild(svgElement(doc, "polyline", { points: amplifiedPoints.join(" "), "class": result.belowBifurcation ? "mbk-amplified" : "mbk-danger" }));
      svg.appendChild(svgElement(doc, "line", { x1: 60, y1: yTop, x2: 60, y2: yTop - 21, "class": "mbk-support" }));
      svg.appendChild(svgElement(doc, "line", { x1: 60, y1: yBottom, x2: 60, y2: yBottom + 21, "class": "mbk-support" }));
      svg.appendChild(svgElement(doc, "polygon", { points: "42,47 78,47 60,68", "class": "mbk-support-fill" }));
      svg.appendChild(svgElement(doc, "polygon", { points: "42,363 78,363 60,342", "class": "mbk-support-fill" }));
      svg.appendChild(svgElement(doc, "line", { x1: 20, y1: 28, x2: 100, y2: 28, "class": "mbk-load" }));
      svg.appendChild(svgElement(doc, "polygon", { points: "100,28 87,22 87,34", "class": "mbk-load" }));
      svg.appendChild(svgElement(doc, "line", { x1: 20, y1: 382, x2: 100, y2: 382, "class": "mbk-load" }));
      svg.appendChild(svgElement(doc, "polygon", { points: "20,382 33,376 33,388", "class": "mbk-load" }));
      svgText(doc, svg, "P", 104, 32, "mbk-load-text");
      svgText(doc, svg, "P", 104, 386, "mbk-load-text");
      svgText(doc, svg, "初始弯曲 e0", 425, 104, "mbk-initial-text");
      svgText(doc, svg, result.belowBifurcation ? "缺陷放大后的响应" : "P≥Pcr：线性放大式失效", 425, 129, result.belowBifurcation ? "mbk-amplified-text" : "mbk-danger-text");
      svgText(doc, svg, "K=" + formatNumber(result.config.K, 2) + "，" + conditionLabel(result.config.K), 400, 180, "mbk-muted");
      svgText(doc, svg, "P/Pcr=" + formatNumber(result.config.loadRatio, 3), 400, 204, result.belowBifurcation ? "mbk-muted" : "mbk-danger-text");
      svgText(doc, svg, result.localWarning ? "b/t>40：局部屈曲筛查警告" : "b/t=" + formatNumber(result.config.bt, 1) + "：局部筛查未触发", 400, 228, result.localWarning ? "mbk-danger-text" : "mbk-muted");
      svgText(doc, svg, "z", 30, 215, "mbk-muted");
      svgText(doc, svg, "横向位移（示意，非按比例）", 180, 405, "mbk-muted");
    }

    function conditionLabel(K) {
      var keys = Object.keys(END_CONDITIONS);
      for (var index = 0; index < keys.length; index += 1) {
        if (near(END_CONDITIONS[keys[index]].K, K, 1e-6)) return END_CONDITIONS[keys[index]].label;
      }
      return "自定义端部";
    }

    function renderTable(doc, hostNode, headings, rows) {
      clear(hostNode);
      var table = element(doc, "table", {});
      var head = element(doc, "tr", {});
      headings.forEach(function (heading) { head.appendChild(element(doc, "th", { scope: "col", text: heading })); });
      table.appendChild(element(doc, "thead", {}, [head]));
      var body = element(doc, "tbody", {});
      rows.forEach(function (row) {
        var tr = element(doc, "tr", {});
        row.forEach(function (value) { tr.appendChild(element(doc, "td", { text: value })); });
        body.appendChild(tr);
      });
      table.appendChild(body);
      hostNode.appendChild(table);
    }

    function injectStyles(doc) {
      if (!doc || doc.getElementById(STYLE_ID)) return;
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent = [
        '[data-learning-lab="' + LAB_ID + '"]{--mbk-blue:#245a9b;--mbk-green:#2d7a4b;--mbk-orange:#ad6811;--mbk-red:#b23a32;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
        '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}',
        '[data-learning-lab="' + LAB_ID + '"] h3,[data-learning-lab="' + LAB_ID + '"] h4{margin:0;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] h3{font-size:1.16rem}[data-learning-lab="' + LAB_ID + '"] h4{margin-top:16px;font-size:1rem}',
        '[data-learning-lab="' + LAB_ID + '"] .mbk-note,[data-learning-lab="' + LAB_ID + '"] .mbk-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
        '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:700;line-height:1.5}',
        '[data-learning-lab="' + LAB_ID + '"] .mbk-options{display:grid;gap:5px}[data-learning-lab="' + LAB_ID + '"] .mbk-options label{display:flex;gap:8px;align-items:flex-start;min-height:44px;padding:7px 0;cursor:pointer}[data-learning-lab="' + LAB_ID + '"] .mbk-options input{flex:0 0 auto;margin-top:5px;accent-color:var(--mbk-blue)}',
        '[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input,[data-learning-lab="' + LAB_ID + '"] select{min-height:44px;font:inherit;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] input[type=number],[data-learning-lab="' + LAB_ID + '"] select{width:100%;padding:7px 9px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);color:inherit}',
        '[data-learning-lab="' + LAB_ID + '"] button{padding:8px 12px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);color:inherit;cursor:pointer}[data-learning-lab="' + LAB_ID + '"] button:hover,[data-learning-lab="' + LAB_ID + '"] button:focus-visible{border-color:var(--mbk-blue)}[data-learning-lab="' + LAB_ID + '"] .mbk-primary{background:var(--mbk-blue);border-color:var(--mbk-blue);color:#fff}',
        '[data-learning-lab="' + LAB_ID + '"] .mbk-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + LAB_ID + '"] .mbk-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mbk-error{min-height:1.6em;color:var(--mbk-red);font-weight:700}',
        '[data-learning-lab="' + LAB_ID + '"] .mbk-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px;margin:14px 0}[data-learning-lab="' + LAB_ID + '"] .mbk-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .mbk-control label{font-size:13px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mbk-control small{font-size:11px;color:var(--fg-soft,currentColor)}',
        '[data-learning-lab="' + LAB_ID + '"] .mbk-layout{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(260px,.8fr);gap:15px;align-items:start;min-width:0}[data-learning-lab="' + LAB_ID + '"] .mbk-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:7px;overflow:hidden;background:var(--bg,Canvas)}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="' + LAB_ID + '"] svg text{font-family:inherit;letter-spacing:0;fill:currentColor;font-size:12px}',
        '[data-learning-lab="' + LAB_ID + '"] .mbk-axis{stroke:currentColor;stroke-width:1;stroke-dasharray:3 5;opacity:.5}[data-learning-lab="' + LAB_ID + '"] .mbk-initial{fill:none;stroke:var(--mbk-blue);stroke-width:2;stroke-dasharray:6 5}[data-learning-lab="' + LAB_ID + '"] .mbk-amplified{fill:none;stroke:var(--mbk-orange);stroke-width:4}[data-learning-lab="' + LAB_ID + '"] .mbk-danger{fill:none;stroke:var(--mbk-red);stroke-width:4}[data-learning-lab="' + LAB_ID + '"] .mbk-support{stroke:currentColor;stroke-width:2}[data-learning-lab="' + LAB_ID + '"] .mbk-support-fill{fill:var(--bg,Canvas);stroke:currentColor;stroke-width:1.5}[data-learning-lab="' + LAB_ID + '"] .mbk-load{stroke:var(--mbk-red);fill:var(--mbk-red);stroke-width:2}[data-learning-lab="' + LAB_ID + '"] .mbk-load-text{fill:var(--mbk-red);font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mbk-initial-text{fill:var(--mbk-blue);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mbk-amplified-text{fill:var(--mbk-orange);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mbk-danger-text{fill:var(--mbk-red);font-weight:700;font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mbk-muted{fill:var(--fg-soft,currentColor);font-size:11px}',
        '[data-learning-lab="' + LAB_ID + '"] .mbk-table-wrap{min-width:0;max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:455px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}',
        '[data-learning-lab="' + LAB_ID + '"] .mbk-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + LAB_ID + '"] .mbk-metric{min-width:0;padding:9px;border-top:3px solid var(--mbk-blue);background:var(--bg,Canvas)}[data-learning-lab="' + LAB_ID + '"] .mbk-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mbk-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
        'html[data-theme="dark"] [data-learning-lab="' + LAB_ID + '"]{--mbk-blue:#83b3ff;--mbk-green:#83d39c;--mbk-orange:#f2bb62;--mbk-red:#ff9b91}',
        '@media(max-width:900px){[data-learning-lab="' + LAB_ID + '"] .mbk-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:700px){[data-learning-lab="' + LAB_ID + '"] .mbk-controls{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="' + LAB_ID + '"] .mbk-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:410px){[data-learning-lab="' + LAB_ID + '"] .mbk-controls{grid-template-columns:minmax(0,1fr)}[data-learning-lab="' + LAB_ID + '"] .mbk-metrics{grid-template-columns:minmax(0,1fr)}[data-learning-lab="' + LAB_ID + '"] .mbk-actions>*{width:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important}}'
      ].join("");
      (doc.head || doc.documentElement).appendChild(style);
    }

    function question(doc, uid, name, text, choices) {
      var fieldset = element(doc, "fieldset", {}, [element(doc, "legend", { text: text })]);
      var options = element(doc, "div", { className: "mbk-options" });
      choices.forEach(function (choice) {
        var id = uid + "-" + name + "-" + choice.value;
        var input = element(doc, "input", { type: "radio", id: id, name: uid + "-" + name, value: choice.value });
        options.appendChild(element(doc, "label", { htmlFor: id }, [input, element(doc, "span", { text: choice.label })]));
      });
      fieldset.appendChild(options);
      return fieldset;
    }

    function selected(form, name) {
      var input = form.querySelector('input[name="' + name + '"]:checked');
      return input ? input.value : "";
    }

    function inputControl(doc, uid, key, label, value, min, max, step, unit) {
      var id = uid + "-" + key;
      var input = element(doc, "input", { id: id, type: "number", min: min, max: max, step: step, value: value });
      return { key: key, input: input, node: element(doc, "div", { className: "mbk-control" }, [element(doc, "label", { htmlFor: id, text: label }), input, element(doc, "small", { text: unit })]) };
    }

    function metric(doc, label, value) {
      return element(doc, "div", { className: "mbk-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]);
    }

    function mount(root, api) {
      if (!root || !root.ownerDocument) return;
      var doc = root.ownerDocument;
      injectStyles(doc);
      INSTANCE += 1;
      var uid = LAB_ID + "-" + INSTANCE;
      var state = { revealed: false };
      clear(root);
      root.setAttribute("aria-labelledby", uid + "-heading");
      var heading = element(doc, "h3", { id: uid + "-heading", text: "Euler 柱：端部、缺陷与极限状态实验台" });
      var intro = element(doc, "p", { className: "mbk-note", text: "先预测端部改变、缺陷放大和材料边界。揭示后可在同一结构图上切换 K、逼近 Pcr，并查看屈服与局部板件筛查。" });
      var form = element(doc, "form", { className: "mbk-prediction" });
      form.appendChild(question(doc, uid, "end", "铰—铰改为固—固，理想 Pcr 约变为？", [
        { value: "four", label: "4 倍，因为 K 从 1 降到 0.5" },
        { value: "same", label: "不变，端部只改变变形形状" },
        { value: "quarter", label: "1/4，因为固支更容易屈曲" }
      ]));
      form.appendChild(question(doc, uid, "imperfection", "P/Pcr=0.8 的一阶缺陷放大因子是？", [
        { value: "five", label: "5，因为 1/(1−0.8)=5" },
        { value: "one", label: "1，理想 Euler 柱没有侧移" },
        { value: "quarter", label: "1.25，只放大了 25%" }
      ]));
      form.appendChild(question(doc, uid, "material", "高强钢与普通钢的 Euler 数字何时才可能近似相同？", [
        { value: "ideal", label: "相近 E 且完美直、完全弹性的理想模型" },
        { value: "always", label: "任何残余应力和缺陷下都相同" },
        { value: "yield", label: "只要屈服强度不同就必然相同" }
      ]));
      var feedback = element(doc, "p", { className: "mbk-feedback", role: "status", "aria-live": "polite", text: "结果尚未揭示。" });
      form.appendChild(element(doc, "div", { className: "mbk-actions" }, [
        element(doc, "button", { type: "submit", className: "mbk-primary", text: "提交预测并揭示" }),
        element(doc, "button", { type: "button", "data-reset": "true", text: "重置实验" })
      ]));
      form.appendChild(feedback);
      root.appendChild(heading);
      root.appendChild(intro);
      root.appendChild(form);

      var bench = element(doc, "div", { hidden: true });
      var fields = [
        inputControl(doc, uid, "E", "E", DEFAULTS.E / 1e9, 1, 400, 1, "GPa"),
        inputControl(doc, uid, "L", "柱长 L", DEFAULTS.L, 0.1, 20, 0.1, "m"),
        inputControl(doc, uid, "d", "直径 d", DEFAULTS.d * 1000, 1, 500, 1, "mm"),
        inputControl(doc, uid, "sigmaY", "屈服 sigma_y", DEFAULTS.sigmaY / 1e6, 1, 2000, 1, "MPa"),
        inputControl(doc, uid, "loadRatio", "P/Pcr", DEFAULTS.loadRatio, 0, 1.05, 0.01, "无量纲"),
        inputControl(doc, uid, "e0", "初弯曲 e0", DEFAULTS.e0 * 1000, 0, 20, 0.1, "mm"),
        inputControl(doc, uid, "bt", "局部筛查 b/t", DEFAULTS.bt, 5, 100, 1, "无量纲")
      ];
      var controls = element(doc, "div", { className: "mbk-controls" });
      fields.forEach(function (field) { controls.appendChild(field.node); });
      var endControl = element(doc, "div", { className: "mbk-control" });
      var endId = uid + "-end";
      var endSelect = element(doc, "select", { id: endId });
      Object.keys(END_CONDITIONS).forEach(function (key) {
        endSelect.appendChild(element(doc, "option", { value: key, text: END_CONDITIONS[key].label + "，K=" + END_CONDITIONS[key].K }));
      });
      endSelect.value = "pin-pin";
      endControl.appendChild(element(doc, "label", { htmlFor: endId, text: "端部条件" }));
      endControl.appendChild(endSelect);
      endControl.appendChild(element(doc, "small", { text: "有效长度系数 K" }));
      controls.appendChild(endControl);
      bench.appendChild(controls);
      var error = element(doc, "p", { className: "mbk-error", role: "alert", "aria-live": "polite" });
      bench.appendChild(error);
      var layout = element(doc, "div", { className: "mbk-layout" });
      var stage = element(doc, "div", { className: "mbk-stage" });
      var svg = svgElement(doc, "svg", {});
      stage.appendChild(svg);
      var ledger = element(doc, "div", { className: "mbk-table-wrap" });
      layout.appendChild(stage);
      layout.appendChild(ledger);
      bench.appendChild(layout);
      var metrics = element(doc, "div", { className: "mbk-metrics" });
      bench.appendChild(metrics);
      var note = element(doc, "p", { className: "mbk-note", role: "status", "aria-live": "polite" });
      bench.appendChild(note);
      root.appendChild(bench);

      function uiConfig() {
        var values = {};
        fields.forEach(function (field) {
          var raw = field.input.value.trim();
          if (raw === "") throw new Error(field.key + " 不能为空");
          var value = Number(raw);
          if (!isFinite(value)) throw new Error(field.key + " 必须是有限数字");
          var min = Number(field.input.getAttribute("min"));
          var max = Number(field.input.getAttribute("max"));
          if (value < min || value > max) throw new Error(field.key + " 超出允许范围");
          values[field.key] = value;
        });
        return { E: values.E * 1e9, L: values.L, d: values.d / 1000, sigmaY: values.sigmaY * 1e6, K: END_CONDITIONS[endSelect.value].K, loadRatio: values.loadRatio, e0: values.e0 / 1000, bt: values.bt };
      }

      function render() {
        if (!state.revealed) return;
        try {
          var result = evaluate(uiConfig());
          error.textContent = "";
          drawColumn(doc, svg, result);
          clear(metrics);
          metrics.appendChild(metric(doc, "Pcr", formatNumber(result.Pcr / 1000, 2) + " kN"));
          metrics.appendChild(metric(doc, "P/Pcr", formatNumber(result.config.loadRatio, 3)));
          metrics.appendChild(metric(doc, "放大因子", formatNumber(result.amplification, 2)));
          metrics.appendChild(metric(doc, "状态", result.status));
          renderTable(doc, ledger, ["账本项", "公式/读数", "单位或判定"], [
            ["面积 A", formatNumber(result.area * 1e6, 3), "mm^2"],
            ["截面惯性矩 I", formatNumber(result.I * 1e12, 4), "mm^4"],
            ["Euler Pcr", "pi^2 E I/(K L)^2 = " + formatNumber(result.Pcr / 1000, 3), "kN；理想分岔"],
            ["屈服筛选 Py", formatNumber(result.Py / 1000, 3), "kN；A sigma_y"],
            ["长细比 lambda", formatNumber(result.slenderness, 2), result.elasticCandidate ? "Euler 候选" : "非弹性/屈服需优先"],
            ["放大", "1/(1−P/Pcr) = " + formatNumber(result.amplification, 3), result.belowBifurcation ? "一阶缺陷近似" : "越过边界，公式失效"],
            ["局部板件筛查", "b/t = " + formatNumber(result.config.bt, 1), result.localWarning ? "预警；需局部屈曲模型" : "未触发独立筛查"]
          ]);
          if (result.status === "bifurcation-reached") note.textContent = "P 已到达或越过理想 Euler 分岔；缺陷放大式不再给出有限位移预测。";
          else if (result.status === "yield-or-inelastic") note.textContent = "长细比落在屈服/非弹性边界侧；Euler Pcr 仅作候选，需规范或切线模量模型。";
          else if (result.status === "local-buckling-screen") note.textContent = "整体计算之外，b/t 筛查已报警；局部屈曲可能先控制。";
          else note.textContent = "当前为理想弹性候选加缺陷放大示意；Pcr 是分岔载荷，不是含缺陷柱的保证承载力。";
        } catch (validationError) {
          error.textContent = "输入校验：" + validationError.message;
          clear(metrics); clear(ledger); clear(svg); note.textContent = "";
        }
      }

      fields.forEach(function (field) {
        field.input.addEventListener("input", render);
        field.input.addEventListener("change", render);
      });
      endSelect.addEventListener("change", render);
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var answers = {
          end: selected(form, uid + "-end"),
          imperfection: selected(form, uid + "-imperfection"),
          material: selected(form, uid + "-material")
        };
        if (!answers.end || !answers.imperfection || !answers.material) {
          feedback.textContent = "请先完成三项预测；结果仍然隐藏。";
          return;
        }
        state.revealed = true;
        bench.hidden = false;
        var correct = (answers.end === "four" ? 1 : 0) + (answers.imperfection === "five" ? 1 : 0) + (answers.material === "ideal" ? 1 : 0);
        feedback.textContent = "已揭示：" + correct + "/3 命中。现在逼近临界载荷并比较不同边界。";
        render();
        if (api && typeof api.announce === "function") api.announce(root, "屈曲预测已揭示，柱形状与极限账本已显示。");
      });
      form.querySelector('[data-reset="true"]').addEventListener("click", function () {
        form.reset();
        state.revealed = false;
        bench.hidden = true;
        feedback.textContent = "结果尚未揭示。";
        fields.forEach(function (field) {
          field.input.value = field.key === "E" ? DEFAULTS.E / 1e9 : field.key === "d" ? DEFAULTS.d * 1000 : field.key === "sigmaY" ? DEFAULTS.sigmaY / 1e6 : field.key === "e0" ? DEFAULTS.e0 * 1000 : DEFAULTS[field.key];
        });
        endSelect.value = "pin-pin";
        error.textContent = "";
        clear(metrics); clear(ledger); clear(svg); note.textContent = "";
        if (api && typeof api.announce === "function") api.announce(root, "屈曲实验已重置，预测结果再次隐藏。");
      });
      if (api && typeof api.announce === "function") api.announce(root, "屈曲实验已加载；先完成三项预测。");
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) { checks += 1; assert(condition, message); }
      var result = evaluate(DEFAULTS);
      check(result.Pcr > 0 && result.Py > result.Pcr, "default column has positive Euler load below yield screening");
      check(near(result.radius, DEFAULTS.d / 4), "solid circular radius of gyration is d/4");
      check(near(result.slenderness, DEFAULTS.L * 4 / DEFAULTS.d), "slenderness uses effective length and radius");
      check(result.elasticCandidate, "default column is an elastic Euler candidate");
      check(near(result.amplification, 1 / (1 - DEFAULTS.loadRatio)), "imperfection amplification denominator");
      check(near(result.midDeflection, DEFAULTS.e0 / (1 - DEFAULTS.loadRatio)), "midspan deflection uses e0 amplification");
      var fixed = evaluate({ E: DEFAULTS.E, L: DEFAULTS.L, d: DEFAULTS.d, sigmaY: DEFAULTS.sigmaY, K: 0.5, loadRatio: 0.2, e0: DEFAULTS.e0, bt: DEFAULTS.bt });
      check(near(fixed.Pcr / result.Pcr, 4), "fixed-fixed K gives four times pin-pin Euler load");
      var free = evaluate({ E: DEFAULTS.E, L: DEFAULTS.L, d: DEFAULTS.d, sigmaY: DEFAULTS.sigmaY, K: 2, loadRatio: 0.2, e0: DEFAULTS.e0, bt: DEFAULTS.bt });
      check(near(free.Pcr / result.Pcr, 0.25), "fixed-free K gives one quarter pin-pin Euler load");
      var boundary = evaluate({ E: DEFAULTS.E, L: DEFAULTS.L, d: DEFAULTS.d, sigmaY: DEFAULTS.sigmaY, K: 1, loadRatio: 1, e0: DEFAULTS.e0, bt: DEFAULTS.bt });
      check(!boundary.belowBifurcation && boundary.status === "bifurcation-reached" && !isFinite(boundary.amplification), "bifurcation boundary invalidates finite amplification");
      var local = evaluate({ E: DEFAULTS.E, L: DEFAULTS.L, d: DEFAULTS.d, sigmaY: DEFAULTS.sigmaY, K: 1, loadRatio: 0.2, e0: DEFAULTS.e0, bt: 60 });
      check(local.localWarning && local.status === "local-buckling-screen", "large b/t triggers independent local screen");
      var invalidCaught = false;
      try { normalizeConfig({ d: 0 }); } catch (error) { invalidCaught = true; }
      check(invalidCaught, "nonpositive diameter is rejected");
      check(formatNumber(1350, 0) === "1350" && formatNumber(60, 0) === "60", "zero-decimal formatter preserves integer zeros");
      return { checks: checks };
    }

    return {
      DEFAULTS: DEFAULTS,
      END_CONDITIONS: END_CONDITIONS,
      normalizeConfig: normalizeConfig,
      evaluate: evaluate,
      formatNumber: formatNumber,
      mount: mount,
      selfTest: selfTest
    };
  }
);
