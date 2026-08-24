(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("mech-reliability-interference", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("mech-reliability-interference self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("mech-reliability-interference self-test: FAIL\n" + error.stack);
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

    var LAB_ID = "mech-reliability-interference";
    var STYLE_ID = "cl-mech-reliability-interference-styles";
    var SVG_NS = "http://www.w3.org/2000/svg";
    var SQRT2 = Math.sqrt(2);
    var INSTANCE = 0;
    var DEFAULTS = {
      muR: 240,
      sigmaR: 25,
      muS: 180,
      sigmaS: 30,
      components: 4,
      topology: "series"
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

    function bounded(value, label, low, high) {
      var number = finite(value, label);
      if (number < low || number > high) throw new RangeError(label + " must be in [" + low + ", " + high + "]");
      return number;
    }

    function integer(value, label, low, high) {
      var number = bounded(value, label, low, high);
      if (Math.floor(number) !== number) throw new RangeError(label + " must be an integer");
      return number;
    }

    function normalizeConfig(input) {
      var source = input || {};
      var topology = source.topology === undefined ? DEFAULTS.topology : String(source.topology);
      if (topology !== "series" && topology !== "parallel") throw new RangeError("topology must be series or parallel");
      return {
        muR: bounded(source.muR === undefined ? DEFAULTS.muR : source.muR, "muR", 1, 2000),
        sigmaR: bounded(source.sigmaR === undefined ? DEFAULTS.sigmaR : source.sigmaR, "sigmaR", 0.1, 1000),
        muS: bounded(source.muS === undefined ? DEFAULTS.muS : source.muS, "muS", 1, 2000),
        sigmaS: bounded(source.sigmaS === undefined ? DEFAULTS.sigmaS : source.sigmaS, "sigmaS", 0.1, 1000),
        components: integer(source.components === undefined ? DEFAULTS.components : source.components, "components", 1, 30),
        topology: topology
      };
    }

    function erf(value) {
      var sign = value < 0 ? -1 : 1;
      var x = Math.abs(value);
      var t = 1 / (1 + 0.3275911 * x);
      var polynomial = (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t;
      return sign * (1 - polynomial * Math.exp(-x * x));
    }

    function normalCdf(value) {
      return 0.5 * (1 + erf(value / SQRT2));
    }

    function normalPdf(value, mean, sigma) {
      var z = (value - mean) / sigma;
      return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
    }

    function model(input) {
      var config = normalizeConfig(input);
      var sigmaDifference = Math.sqrt(config.sigmaR * config.sigmaR + config.sigmaS * config.sigmaS);
      var beta = (config.muR - config.muS) / sigmaDifference;
      var partReliability = normalCdf(beta);
      var failureProbability = 1 - partReliability;
      var seriesReliability = Math.pow(partReliability, config.components);
      var parallelReliability = 1 - Math.pow(failureProbability, config.components);
      var selectedReliability = config.topology === "series" ? seriesReliability : parallelReliability;
      return {
        config: config,
        sigmaDifference: sigmaDifference,
        beta: beta,
        partReliability: partReliability,
        R: partReliability,
        failureProbability: failureProbability,
        Pf: failureProbability,
        safetyFactor: config.muR / config.muS,
        seriesReliability: seriesReliability,
        seriesR: seriesReliability,
        parallelReliability: parallelReliability,
        parallelR: parallelReliability,
        selectedReliability: selectedReliability,
        selectedTopology: config.topology,
        normalCdf: normalCdf,
        normalPdf: normalPdf,
        assumptions: "独立、同分量、时间不变、正态尾部"
      };
    }

    function formatNumber(value, digits) {
      if (!isFinite(value)) return "-";
      var places = digits === undefined ? 3 : digits;
      if (Math.abs(value) > 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 100000)) {
        return value.toExponential(Math.min(places, 5));
      }
      if (places === 0) return value.toFixed(0);
      return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
    }

    function clear(node) {
      while (node && node.firstChild) node.removeChild(node.firstChild);
    }

    function element(doc, tag, attrs, children) {
      var node = doc.createElement(tag);
      Object.keys(attrs || {}).forEach(function (key) {
        var value = attrs[key];
        if (value === undefined || value === null || value === false) return;
        if (key === "text") node.textContent = String(value);
        else if (key === "className") node.setAttribute("class", String(value));
        else if (key === "htmlFor") node.setAttribute("for", String(value));
        else node.setAttribute(key, String(value));
      });
      (children || []).forEach(function (child) {
        if (child !== undefined && child !== null) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
      });
      return node;
    }

    function svgElement(doc, tag, attrs, children) {
      var node = doc.createElementNS(SVG_NS, tag);
      Object.keys(attrs || {}).forEach(function (key) {
        var value = attrs[key];
        if (value !== undefined && value !== null) node.setAttribute(key, String(value));
      });
      (children || []).forEach(function (child) { node.appendChild(child); });
      return node;
    }

    function svgText(doc, parent, text, x, y, className) {
      parent.appendChild(svgElement(doc, "text", { x: x, y: y, "class": className || "ri-label" }, [doc.createTextNode(text)]));
    }

    function renderTable(doc, hostNode, headings, rows) {
      clear(hostNode);
      var table = element(doc, "table");
      var head = element(doc, "tr");
      headings.forEach(function (heading) { head.appendChild(element(doc, "th", { scope: "col", text: heading })); });
      table.appendChild(element(doc, "thead", {}, [head]));
      var body = element(doc, "tbody");
      rows.forEach(function (row) {
        var tr = element(doc, "tr");
        row.forEach(function (cell) { tr.appendChild(element(doc, "td", { text: cell })); });
        body.appendChild(tr);
      });
      table.appendChild(body);
      hostNode.appendChild(table);
    }

    function metric(doc, label, value) {
      return element(doc, "div", { className: "ri-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]);
    }

    function predictionQuestion(doc, uid, question, name, choices) {
      var fieldset = element(doc, "fieldset", {}, [element(doc, "legend", { text: question })]);
      var options = element(doc, "div", { className: "ri-options" });
      choices.forEach(function (choice) {
        var inputId = uid + "-" + name + "-" + choice.value;
        var input = element(doc, "input", { type: "radio", id: inputId, name: uid + "-" + name, value: choice.value });
        options.appendChild(element(doc, "label", { htmlFor: inputId }, [input, element(doc, "span", { text: choice.label })]));
      });
      fieldset.appendChild(options);
      return fieldset;
    }

    function selected(form, name) {
      var input = form.querySelector('input[name="' + name + '"]:checked');
      return input ? input.value : "";
    }

    function numberControl(doc, uid, key, label, value, min, max, step, unit) {
      var id = uid + "-" + key;
      var input = element(doc, "input", { id: id, type: "number", min: min, max: max, step: step, value: value, "data-key": key });
      return { key: key, input: input, node: element(doc, "label", { className: "ri-control", htmlFor: id }, [element(doc, "span", { text: label }), input, element(doc, "small", { text: unit })]) };
    }

    function selectControl(doc, uid, key, label, value, options, unit) {
      var id = uid + "-" + key;
      var select = element(doc, "select", { id: id, "data-key": key });
      options.forEach(function (option) {
        var node = element(doc, "option", { value: option.value, text: option.label });
        if (String(option.value) === String(value)) node.setAttribute("selected", "selected");
        select.appendChild(node);
      });
      return { key: key, input: select, node: element(doc, "label", { className: "ri-control", htmlFor: id }, [element(doc, "span", { text: label }), select, element(doc, "small", { text: unit })]) };
    }

    function injectStyles(doc) {
      if (!doc || doc.getElementById(STYLE_ID)) return;
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent =
        '[data-learning-lab="' + LAB_ID + '"]{--ri-blue:#245a9a;--ri-red:#a13f32;--ri-green:#28754d;--ri-gold:#a46b16;--ri-warn:#a13932;display:block;max-width:100%;min-width:0;line-height:1.55;overflow-wrap:anywhere}' +
        '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}' +
        '[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}' +
        '[data-learning-lab="' + LAB_ID + '"] .ri-note,[data-learning-lab="' + LAB_ID + '"] .ri-feedback{color:var(--fg-soft,currentColor);font-size:13px}' +
        '[data-learning-lab="' + LAB_ID + '"] .ri-prediction{padding:11px 13px;border-left:4px solid var(--ri-gold);background:var(--block-bg,transparent)}' +
        '[data-learning-lab="' + LAB_ID + '"] fieldset{border:1px solid var(--border,currentColor);border-radius:6px;margin:11px 0;padding:9px 12px}' +
        '[data-learning-lab="' + LAB_ID + '"] legend{padding:0 4px;font-weight:700}' +
        '[data-learning-lab="' + LAB_ID + '"] .ri-options{display:grid;gap:4px}' +
        '[data-learning-lab="' + LAB_ID + '"] .ri-options label{display:flex;gap:8px;align-items:flex-start;min-height:44px;padding:7px 0;cursor:pointer}' +
        '[data-learning-lab="' + LAB_ID + '"] .ri-options input{flex:0 0 auto;margin-top:5px;accent-color:var(--ri-blue)}' +
        '[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input,[data-learning-lab="' + LAB_ID + '"] select{min-height:44px;font:inherit;letter-spacing:0}' +
        '[data-learning-lab="' + LAB_ID + '"] input[type=number],[data-learning-lab="' + LAB_ID + '"] select{width:100%;padding:7px 9px;border:1px solid var(--border,currentColor);border-radius:6px;background:var(--bg,Canvas);color:inherit}' +
        '[data-learning-lab="' + LAB_ID + '"] button{padding:8px 13px;border:1px solid var(--border,currentColor);border-radius:6px;background:var(--bg,Canvas);color:inherit;cursor:pointer}' +
        '[data-learning-lab="' + LAB_ID + '"] button:hover,[data-learning-lab="' + LAB_ID + '"] button:focus-visible{border-color:var(--ri-blue)}' +
        '[data-learning-lab="' + LAB_ID + '"] .ri-primary{background:var(--ri-blue);border-color:var(--ri-blue);color:#fff}' +
        '[data-learning-lab="' + LAB_ID + '"] .ri-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}' +
        '[data-learning-lab="' + LAB_ID + '"] .ri-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px;margin:15px 0;align-items:end}' +
        '[data-learning-lab="' + LAB_ID + '"] .ri-control{display:grid;gap:5px;min-width:0;font-weight:700;font-size:13px}' +
        '[data-learning-lab="' + LAB_ID + '"] .ri-control small{color:var(--fg-soft,currentColor);font-size:11px;font-weight:400}' +
        '[data-learning-lab="' + LAB_ID + '"] .ri-error{min-height:1.6em;color:var(--ri-warn);font-weight:700}' +
        '[data-learning-lab="' + LAB_ID + '"] .ri-layout{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(250px,.8fr);gap:15px;align-items:start}' +
        '[data-learning-lab="' + LAB_ID + '"] .ri-stage{min-width:0;border:1px solid var(--border,currentColor);border-radius:6px;padding:7px;overflow:hidden;background:var(--bg,Canvas)}' +
        '[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}' +
        '[data-learning-lab="' + LAB_ID + '"] svg text{font-family:inherit;letter-spacing:0;fill:currentColor;font-size:12px}' +
        '[data-learning-lab="' + LAB_ID + '"] .ri-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}' +
        '[data-learning-lab="' + LAB_ID + '"] .ri-metric{min-width:0;padding:8px;border-top:3px solid var(--ri-blue);background:var(--bg,Canvas)}' +
        '[data-learning-lab="' + LAB_ID + '"] .ri-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}' +
        '[data-learning-lab="' + LAB_ID + '"] .ri-metric strong{display:block;margin-top:3px;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}' +
        '[data-learning-lab="' + LAB_ID + '"] .ri-table{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}' +
        '[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:430px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}' +
        '[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,currentColor);text-align:left;vertical-align:top}' +
        '[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}' +
        '@media(max-width:900px){[data-learning-lab="' + LAB_ID + '"] .ri-controls{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="' + LAB_ID + '"] .ri-layout{grid-template-columns:1fr}}' +
        '@media(max-width:500px){[data-learning-lab="' + LAB_ID + '"] .ri-controls{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .ri-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}' +
        '@media(max-width:360px){[data-learning-lab="' + LAB_ID + '"] .ri-actions>*{width:100%}[data-learning-lab="' + LAB_ID + '"] .ri-metrics{grid-template-columns:1fr}}' +
        '@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}';
      (doc.head || doc.documentElement).appendChild(style);
    }

    function drawInterference(doc, svg, result) {
      clear(svg);
      var width = 700;
      var height = 430;
      svg.setAttribute("viewBox", "0 0 " + width + " " + height);
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", "应力与强度正态分布重叠以及串并联系统拓扑");
      var left = 58;
      var right = 665;
      var top = 30;
      var bottom = 235;
      var low = Math.min(result.config.muR - 4 * result.config.sigmaR, result.config.muS - 4 * result.config.sigmaS);
      var high = Math.max(result.config.muR + 4 * result.config.sigmaR, result.config.muS + 4 * result.config.sigmaS);
      var maxPdf = Math.max(normalPdf(result.config.muR, result.config.muR, result.config.sigmaR), normalPdf(result.config.muS, result.config.muS, result.config.sigmaS));
      function xOf(value) { return left + (value - low) / (high - low) * (right - left); }
      function yOf(pdf) { return bottom - pdf / maxPdf * (bottom - top); }
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, "class": "ri-axis" }));
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: top, x2: left, y2: bottom, "class": "ri-axis" }));
      var strengthPoints = [];
      var stressPoints = [];
      for (var i = 0; i <= 100; i += 1) {
        var value = low + (high - low) * i / 100;
        strengthPoints.push((i === 0 ? "M" : "L") + xOf(value).toFixed(2) + " " + yOf(normalPdf(value, result.config.muR, result.config.sigmaR)).toFixed(2));
        stressPoints.push((i === 0 ? "M" : "L") + xOf(value).toFixed(2) + " " + yOf(normalPdf(value, result.config.muS, result.config.sigmaS)).toFixed(2));
      }
      svg.appendChild(svgElement(doc, "path", { d: strengthPoints.join(" "), "class": "ri-strength" }));
      svg.appendChild(svgElement(doc, "path", { d: stressPoints.join(" "), "class": "ri-stress" }));
      svg.appendChild(svgElement(doc, "line", { x1: xOf(result.config.muR), y1: top, x2: xOf(result.config.muR), y2: bottom, "class": "ri-mean-strength" }));
      svg.appendChild(svgElement(doc, "line", { x1: xOf(result.config.muS), y1: top, x2: xOf(result.config.muS), y2: bottom, "class": "ri-mean-stress" }));
      svgText(doc, svg, "强度 R", xOf(result.config.muR + result.config.sigmaR), 48, "ri-strength-label");
      svgText(doc, svg, "应力 S", xOf(result.config.muS - result.config.sigmaS * 1.3), 70, "ri-stress-label");
      svgText(doc, svg, "重叠尾部 Pf=" + formatNumber(result.failureProbability, 4), 260, 215, "ri-warn");
      svgText(doc, svg, "MPa", 620, 257, "ri-muted");
      var y0 = 285;
      var boxWidth = 90;
      var gap = 20;
      var count = result.config.components;
      if (result.config.topology === "series") {
        for (var s = 0; s < count; s += 1) {
          var sx = 65 + s * Math.min(115, (570 - boxWidth) / Math.max(1, count - 1));
          svg.appendChild(svgElement(doc, "rect", { x: sx, y: y0, width: boxWidth, height: 38, "class": "ri-box-series" }));
          svgText(doc, svg, "R" + (s + 1), sx + 35, y0 + 25, "ri-label");
          if (s < count - 1) svg.appendChild(svgElement(doc, "line", { x1: sx + boxWidth, y1: y0 + 19, x2: sx + boxWidth + gap, y2: y0 + 19, "class": "ri-link" }));
        }
        svgText(doc, svg, "串联：任一失效即系统失效", 208, 350, "ri-muted");
      } else {
        for (var p = 0; p < count; p += 1) {
          var py = y0 - 30 + p * Math.min(42, 180 / Math.max(1, count - 1));
          svg.appendChild(svgElement(doc, "rect", { x: 190, y: py, width: boxWidth, height: 32, "class": "ri-box-parallel" }));
          svgText(doc, svg, "R" + (p + 1), 225, py + 22, "ri-label");
          svg.appendChild(svgElement(doc, "line", { x1: 145, y1: y0 + 18, x2: 190, y2: py + 16, "class": "ri-link" }));
          svg.appendChild(svgElement(doc, "line", { x1: 280, y1: py + 16, x2: 330, y2: y0 + 18, "class": "ri-link" }));
        }
        svgText(doc, svg, "主动并联：任一路径成功即可维持", 195, 390, "ri-muted");
      }
      svgText(doc, svg, result.config.topology === "series" ? "系统 R=" + formatNumber(result.seriesReliability, 5) : "系统 R=" + formatNumber(result.parallelReliability, 5), 430, 350, "ri-label");
    }

    function mount(rootNode, api) {
      if (!rootNode || !rootNode.ownerDocument) return;
      var doc = rootNode.ownerDocument;
      injectStyles(doc);
      INSTANCE += 1;
      var uid = LAB_ID + "-" + INSTANCE;
      var state = { revealed: false };
      clear(rootNode);
      rootNode.setAttribute("aria-labelledby", uid + "-heading");
      var heading = element(doc, "h3", { id: uid + "-heading", text: "应力—强度干涉与系统拓扑实验" });
      var intro = element(doc, "p", { className: "ri-note", text: "先预测，再揭示两条正态分布的重叠、均值安全系数、β 分账和独立串/并联系统可靠度。" });
      var form = element(doc, "form", { className: "ri-prediction" });
      form.appendChild(predictionQuestion(doc, uid, "均值不变而分散度增大时，单件可靠度通常怎样？", "spread", [
        { value: "down", label: "下降：干涉尾部变宽" },
        { value: "up", label: "上升：分布越宽越有余量" },
        { value: "same", label: "完全不变" }
      ]));
      form.appendChild(predictionQuestion(doc, uid, "独立同分量的串联和主动并联如何影响系统可靠度？", "topology", [
        { value: "split", label: "串联低于单件，并联高于单件" },
        { value: "same", label: "两者都与单件相同" },
        { value: "reverse", label: "串联提高，并联降低" }
      ]));
      form.appendChild(predictionQuestion(doc, uid, "均值安全系数 nμ>1 是否单独保证高可靠度？", "factor", [
        { value: "no", label: "不能保证，还要看 σ、尾部和模型假设" },
        { value: "yes", label: "可以，均值比就是可靠度" },
        { value: "only", label: "只要 nμ>1.5 就不必看分布" }
      ]));
      var feedback = element(doc, "p", { className: "ri-feedback", role: "status", "aria-live": "polite", text: "结果尚未揭示。" });
      form.appendChild(element(doc, "div", { className: "ri-actions" }, [
        element(doc, "button", { type: "submit", className: "ri-primary", text: "提交预测并揭示" }),
        element(doc, "button", { type: "button", "data-reset": "true", text: "重置实验" })
      ]));
      form.appendChild(feedback);
      rootNode.appendChild(heading);
      rootNode.appendChild(intro);
      rootNode.appendChild(form);

      var bench = element(doc, "div", { hidden: true });
      var controls = element(doc, "div", { className: "ri-controls" });
      var fields = [
        numberControl(doc, uid, "muR", "强度均值 μR", DEFAULTS.muR, 1, 2000, 1, "MPa"),
        numberControl(doc, uid, "sigmaR", "强度标准差 σR", DEFAULTS.sigmaR, 0.1, 1000, 1, "MPa"),
        numberControl(doc, uid, "muS", "应力均值 μS", DEFAULTS.muS, 1, 2000, 1, "MPa"),
        numberControl(doc, uid, "sigmaS", "应力标准差 σS", DEFAULTS.sigmaS, 0.1, 1000, 1, "MPa"),
        numberControl(doc, uid, "components", "分量数 N", DEFAULTS.components, 1, 30, 1, "个"),
        selectControl(doc, uid, "topology", "系统拓扑", DEFAULTS.topology, [{ value: "series", label: "独立串联" }, { value: "parallel", label: "主动并联" }], "理想独立模型")
      ];
      fields.forEach(function (field) { controls.appendChild(field.node); });
      bench.appendChild(controls);
      var error = element(doc, "p", { className: "ri-error", role: "alert", "aria-live": "polite" });
      bench.appendChild(error);
      var layout = element(doc, "div", { className: "ri-layout" });
      var stage = element(doc, "div", { className: "ri-stage" });
      var svg = svgElement(doc, "svg", {});
      stage.appendChild(svg);
      var ledger = element(doc, "div", { className: "ri-table" });
      layout.appendChild(stage);
      layout.appendChild(ledger);
      bench.appendChild(layout);
      var metrics = element(doc, "div", { className: "ri-metrics" });
      bench.appendChild(metrics);
      bench.appendChild(element(doc, "p", { className: "ri-note", text: "边界：系统公式只在独立、同分量、无共因失效、时间不变且正态尾部可接受时成立。" }));
      rootNode.appendChild(bench);

      function uiConfig() {
        var values = {};
        fields.forEach(function (field) {
          var raw = field.input.value.trim();
          if (!raw) throw new Error(field.key + " 不能为空");
          var value = field.input.tagName.toLowerCase() === "select" ? raw : Number(raw);
          if (field.input.tagName.toLowerCase() === "input") {
            var min = Number(field.input.getAttribute("min"));
            var max = Number(field.input.getAttribute("max"));
            if (!isFinite(value) || value < min || value > max) throw new Error(field.key + " 超出允许范围");
            if (field.key === "components" && Math.floor(value) !== value) throw new Error("components 必须是整数");
          }
          values[field.key] = value;
        });
        return values;
      }

      function render() {
        if (!state.revealed) return;
        try {
          var result = model(uiConfig());
          error.textContent = "";
          drawInterference(doc, svg, result);
          clear(metrics);
          metrics.appendChild(metric(doc, "均值安全系数", formatNumber(result.safetyFactor, 3)));
          metrics.appendChild(metric(doc, "β", formatNumber(result.beta, 3)));
          metrics.appendChild(metric(doc, "单件可靠度", formatNumber(result.partReliability, 5)));
          metrics.appendChild(metric(doc, "系统可靠度", formatNumber(result.selectedReliability, 5)));
          renderTable(doc, ledger, ["可靠性账本", "读数", "解释/单位"], [
            ["σD=sqrt(σR²+σS²)", formatNumber(result.sigmaDifference, 3), "MPa；独立正态合成"],
            ["nμ=μR/μS", formatNumber(result.safetyFactor, 4), "均值安全系数"],
            ["β", formatNumber(result.beta, 4), "可靠性指标"],
            ["单件 R / Pf", formatNumber(result.partReliability, 6) + " / " + formatNumber(result.failureProbability, 6), "P(R>S) / P(R<S)"],
            ["串联 R^N", formatNumber(result.seriesReliability, 6), "独立同分量"],
            ["主动并联 1-(1-R)^N", formatNumber(result.parallelReliability, 6), "独立、无共因"],
            ["当前拓扑", result.selectedTopology === "series" ? "串联" : "主动并联", "N=" + result.config.components]
          ]);
        } catch (validationError) {
          error.textContent = "输入校验：" + validationError.message;
          clear(metrics);
          clear(ledger);
          clear(svg);
        }
      }

      fields.forEach(function (field) {
        field.input.addEventListener("input", render);
        field.input.addEventListener("change", render);
      });
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var answers = {
          spread: selected(form, uid + "-spread"),
          topology: selected(form, uid + "-topology"),
          factor: selected(form, uid + "-factor")
        };
        if (!answers.spread || !answers.topology || !answers.factor) {
          feedback.textContent = "请先完成三项预测；结果仍然隐藏。";
          return;
        }
        state.revealed = true;
        bench.hidden = false;
        var correct = (answers.spread === "down" ? 1 : 0) + (answers.topology === "split" ? 1 : 0) + (answers.factor === "no" ? 1 : 0);
        feedback.textContent = "已揭示：" + correct + "/3 命中。现在调参，比较单件干涉与系统拓扑账本。";
        render();
        if (api && typeof api.announce === "function") api.announce(rootNode, "可靠性干涉实验已揭示，分布重叠和系统拓扑账本已显示。");
      });
      form.querySelector('[data-reset="true"]').addEventListener("click", function () {
        form.reset();
        state.revealed = false;
        bench.hidden = true;
        feedback.textContent = "结果尚未揭示。";
        fields.forEach(function (field) { field.input.value = DEFAULTS[field.key]; });
        error.textContent = "";
        clear(metrics);
        clear(ledger);
        clear(svg);
        if (api && typeof api.announce === "function") api.announce(rootNode, "可靠性实验已重置，预测结果再次隐藏。");
      });
      if (api && typeof api.announce === "function") api.announce(rootNode, "可靠性实验已加载；先完成三项预测。");
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) { checks += 1; assert(condition, message); }
      check(formatNumber(300, 0) === "300", "integer formatting preserves trailing zeros");
      var result = model(DEFAULTS);
      check(near(result.sigmaDifference, Math.sqrt(25 * 25 + 30 * 30), 1e-12), "default independent combined deviation");
      check(near(result.beta, 60 / Math.sqrt(1525), 1e-12), "default beta formula");
      check(near(result.partReliability + result.failureProbability, 1, 1e-12), "reliability and failure probability close");
      check(near(result.safetyFactor, 240 / 180, 1e-12), "mean safety factor ledger");
      check(result.seriesReliability < result.partReliability && result.parallelReliability > result.partReliability, "series and parallel topology scale");
      check(near(model({ muR: 240, sigmaR: 25, muS: 180, sigmaS: 30, components: 1, topology: "series" }).seriesReliability, result.partReliability, 1e-12), "one component is conserved");
      var wide = model({ muR: 240, sigmaR: 80, muS: 180, sigmaS: 30, components: 4, topology: "series" });
      check(wide.partReliability < result.partReliability, "larger spread lowers normal interference reliability");
      var meanOnly = model({ muR: 201, sigmaR: 50, muS: 200, sigmaS: 50, components: 1, topology: "series" });
      check(meanOnly.safetyFactor > 1 && meanOnly.partReliability < 0.51, "mean safety factor alone is not a high reliability guarantee");
      var invalidCaught = false;
      try { model({ muR: 240, sigmaR: 0, muS: 180, sigmaS: 30, components: 4, topology: "series" }); } catch (error) { invalidCaught = true; }
      check(invalidCaught, "zero standard deviation is rejected");
      return { checks: checks };
    }

    return {
      LAB_ID: LAB_ID,
      DEFAULTS: DEFAULTS,
      normalizeConfig: normalizeConfig,
      normalize: normalizeConfig,
      model: model,
      solveReliability: model,
      normalCdf: normalCdf,
      formatNumber: formatNumber,
      mount: mount,
      selfTest: selfTest
    };
  }
);
