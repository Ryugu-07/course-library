(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("mech-bearing-tribology", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("mech-bearing-tribology self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("mech-bearing-tribology self-test: FAIL\n" + error.stack);
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

    var LAB_ID = "mech-bearing-tribology";
    var STYLE_ID = "cl-mech-bearing-tribology-styles";
    var SVG_NS = "http://www.w3.org/2000/svg";
    var INSTANCE = 0;
    var DEFAULTS = {
      C: 20,
      P: 5,
      p: 3,
      speed: 1500,
      Rq1: 0.2,
      Rq2: 0.3,
      eta: 30,
      dm: 50
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

    function normalizeConfig(input) {
      var source = input || {};
      var pValue = source.p === undefined ? DEFAULTS.p : source.p;
      pValue = bounded(pValue, "p", 3, 10 / 3);
      if (Math.abs(pValue - 3) > 1e-8 && Math.abs(pValue - 10 / 3) > 1e-8) throw new RangeError("p must be 3 or 10/3");
      return {
        C: bounded(source.C === undefined ? DEFAULTS.C : source.C, "C", 0.1, 1000),
        P: bounded(source.P === undefined ? DEFAULTS.P : source.P, "P", 0.01, 1000),
        p: pValue,
        speed: bounded(source.speed === undefined ? (source.n === undefined ? DEFAULTS.speed : source.n) : source.speed, "speed", 1, 20000),
        Rq1: bounded(source.Rq1 === undefined ? DEFAULTS.Rq1 : source.Rq1, "Rq1", 0.01, 10),
        Rq2: bounded(source.Rq2 === undefined ? DEFAULTS.Rq2 : source.Rq2, "Rq2", 0.01, 10),
        eta: bounded(source.eta === undefined ? (source.viscosityMpas === undefined ? DEFAULTS.eta : source.viscosityMpas) : source.eta, "eta", 1, 500),
        dm: bounded(source.dm === undefined ? DEFAULTS.dm : source.dm, "dm", 1, 500)
      };
    }

    function model(input) {
      var config = normalizeConfig(input);
      var lifeMillionsRev = Math.pow(config.C / config.P, config.p);
      var lifeRev = lifeMillionsRev * 1e6;
      var lifeHours = lifeRev / (60 * config.speed);
      var sigma = Math.sqrt(config.Rq1 * config.Rq1 + config.Rq2 * config.Rq2);
      var filmMin = 0.020 * Math.sqrt(config.eta * config.speed / config.P);
      var lambda = filmMin / sigma;
      var zone = lambda < 1 ? "边界润滑" : lambda < 3 ? "混合润滑" : "全膜润滑";
      var stribeckGroup = config.eta * config.speed / config.P;
      var frictionCoefficient = 0.006 + 0.080 / (1 + stribeckGroup / 500) + 0.0000025 * stribeckGroup;
      var frictionTorque = frictionCoefficient * (config.P * 1000) * (config.dm / 1000) / 2;
      var frictionPower = 2 * Math.PI * config.speed / 60 * frictionTorque;
      return {
        config: config,
        lifeMillionsRev: lifeMillionsRev,
        lifeRev: lifeRev,
        L10: lifeRev,
        lifeHours: lifeHours,
        L10Hours: lifeHours,
        sigma: sigma,
        sigmaCombined: sigma,
        filmMin: filmMin,
        h_min: filmMin,
        lambda: lambda,
        zone: zone,
        stribeckGroup: stribeckGroup,
        frictionCoefficient: frictionCoefficient,
        mu: frictionCoefficient,
        frictionTorque: frictionTorque,
        frictionPower: frictionPower,
        powerLoss: frictionPower,
        lifePercentOfMillion: lifeMillionsRev,
        lifeNote: "L10 = 90% 可靠度统计寿命",
        proxyNote: "h_min 与摩擦系数为透明教学代理，不是完整 EHL/厂商损失模型"
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
      parent.appendChild(svgElement(doc, "text", { x: x, y: y, "class": className || "bt-label" }, [doc.createTextNode(text)]));
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
      return element(doc, "div", { className: "bt-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]);
    }

    function predictionQuestion(doc, uid, question, name, choices) {
      var fieldset = element(doc, "fieldset", {}, [element(doc, "legend", { text: question })]);
      var options = element(doc, "div", { className: "bt-options" });
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
      return { key: key, input: input, node: element(doc, "label", { className: "bt-control", htmlFor: id }, [element(doc, "span", { text: label }), input, element(doc, "small", { text: unit })]) };
    }

    function selectControl(doc, uid, key, label, value, options, unit) {
      var id = uid + "-" + key;
      var select = element(doc, "select", { id: id, "data-key": key });
      options.forEach(function (option) {
        var node = element(doc, "option", { value: option.value, text: option.label });
        if (String(option.value) === String(value)) node.setAttribute("selected", "selected");
        select.appendChild(node);
      });
      return { key: key, input: select, node: element(doc, "label", { className: "bt-control", htmlFor: id }, [element(doc, "span", { text: label }), select, element(doc, "small", { text: unit })]) };
    }

    function injectStyles(doc) {
      if (!doc || doc.getElementById(STYLE_ID)) return;
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent =
        '[data-learning-lab="' + LAB_ID + '"]{--bt-blue:#245a9a;--bt-gold:#ae741b;--bt-green:#28754d;--bt-warn:#a13932;display:block;max-width:100%;min-width:0;line-height:1.55;overflow-wrap:anywhere}' +
        '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}' +
        '[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}' +
        '[data-learning-lab="' + LAB_ID + '"] .bt-note,[data-learning-lab="' + LAB_ID + '"] .bt-feedback{color:var(--fg-soft,currentColor);font-size:13px}' +
        '[data-learning-lab="' + LAB_ID + '"] .bt-prediction{padding:11px 13px;border-left:4px solid var(--bt-gold);background:var(--block-bg,transparent)}' +
        '[data-learning-lab="' + LAB_ID + '"] fieldset{border:1px solid var(--border,currentColor);border-radius:6px;margin:11px 0;padding:9px 12px}' +
        '[data-learning-lab="' + LAB_ID + '"] legend{padding:0 4px;font-weight:700}' +
        '[data-learning-lab="' + LAB_ID + '"] .bt-options{display:grid;gap:4px}' +
        '[data-learning-lab="' + LAB_ID + '"] .bt-options label{display:flex;gap:8px;align-items:flex-start;min-height:44px;padding:7px 0;cursor:pointer}' +
        '[data-learning-lab="' + LAB_ID + '"] .bt-options input{flex:0 0 auto;margin-top:5px;accent-color:var(--bt-blue)}' +
        '[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input,[data-learning-lab="' + LAB_ID + '"] select{min-height:44px;font:inherit;letter-spacing:0}' +
        '[data-learning-lab="' + LAB_ID + '"] input[type=number],[data-learning-lab="' + LAB_ID + '"] select{width:100%;padding:7px 9px;border:1px solid var(--border,currentColor);border-radius:6px;background:var(--bg,Canvas);color:inherit}' +
        '[data-learning-lab="' + LAB_ID + '"] button{padding:8px 13px;border:1px solid var(--border,currentColor);border-radius:6px;background:var(--bg,Canvas);color:inherit;cursor:pointer}' +
        '[data-learning-lab="' + LAB_ID + '"] button:hover,[data-learning-lab="' + LAB_ID + '"] button:focus-visible{border-color:var(--bt-blue)}' +
        '[data-learning-lab="' + LAB_ID + '"] .bt-primary{background:var(--bt-blue);border-color:var(--bt-blue);color:#fff}' +
        '[data-learning-lab="' + LAB_ID + '"] .bt-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}' +
        '[data-learning-lab="' + LAB_ID + '"] .bt-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px;margin:15px 0;align-items:end}' +
        '[data-learning-lab="' + LAB_ID + '"] .bt-control{display:grid;gap:5px;min-width:0;font-weight:700;font-size:13px}' +
        '[data-learning-lab="' + LAB_ID + '"] .bt-control small{color:var(--fg-soft,currentColor);font-size:11px;font-weight:400}' +
        '[data-learning-lab="' + LAB_ID + '"] .bt-error{min-height:1.6em;color:var(--bt-warn);font-weight:700}' +
        '[data-learning-lab="' + LAB_ID + '"] .bt-layout{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(250px,.85fr);gap:15px;align-items:start}' +
        '[data-learning-lab="' + LAB_ID + '"] .bt-stage{min-width:0;border:1px solid var(--border,currentColor);border-radius:6px;padding:7px;overflow:hidden;background:var(--bg,Canvas)}' +
        '[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}' +
        '[data-learning-lab="' + LAB_ID + '"] svg text{font-family:inherit;letter-spacing:0;fill:currentColor;font-size:12px}' +
        '[data-learning-lab="' + LAB_ID + '"] .bt-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}' +
        '[data-learning-lab="' + LAB_ID + '"] .bt-metric{min-width:0;padding:8px;border-top:3px solid var(--bt-blue);background:var(--bg,Canvas)}' +
        '[data-learning-lab="' + LAB_ID + '"] .bt-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}' +
        '[data-learning-lab="' + LAB_ID + '"] .bt-metric strong{display:block;margin-top:3px;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}' +
        '[data-learning-lab="' + LAB_ID + '"] .bt-table{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}' +
        '[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:450px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}' +
        '[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,currentColor);text-align:left;vertical-align:top}' +
        '[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}' +
        '@media(max-width:850px){[data-learning-lab="' + LAB_ID + '"] .bt-controls{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="' + LAB_ID + '"] .bt-layout{grid-template-columns:1fr}}' +
        '@media(max-width:360px){[data-learning-lab="' + LAB_ID + '"] .bt-controls{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .bt-actions>*{width:100%}[data-learning-lab="' + LAB_ID + '"] .bt-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}' +
        '@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}';
      (doc.head || doc.documentElement).appendChild(style);
    }

    function drawStribeck(doc, svg, result) {
      clear(svg);
      var width = 700;
      var height = 350;
      svg.setAttribute("viewBox", "0 0 " + width + " " + height);
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", "透明 Stribeck 型摩擦代理与膜厚比摘要");
      var left = 62;
      var right = 665;
      var top = 34;
      var bottom = 240;
      var minGroup = 1;
      var maxGroup = 100000;
      var minMu = 0;
      var maxMu = 0.18;
      function xOf(group) { return left + (Math.log(group) - Math.log(minGroup)) / (Math.log(maxGroup) - Math.log(minGroup)) * (right - left); }
      function yOf(mu) { return bottom - Math.max(0, Math.min(maxMu, mu)) / maxMu * (bottom - top); }
      svg.appendChild(svgElement(doc, "rect", { x: left, y: top, width: xOf(500) - left, height: bottom - top, "class": "bt-boundary" }));
      svg.appendChild(svgElement(doc, "rect", { x: xOf(500), y: top, width: xOf(3500) - xOf(500), height: bottom - top, "class": "bt-mixed" }));
      svg.appendChild(svgElement(doc, "rect", { x: xOf(3500), y: top, width: right - xOf(3500), height: bottom - top, "class": "bt-fluid" }));
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, "class": "bt-axis" }));
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: top, x2: left, y2: bottom, "class": "bt-axis" }));
      var points = [];
      for (var i = 0; i <= 90; i += 1) {
        var group = Math.exp(Math.log(minGroup) + (Math.log(maxGroup) - Math.log(minGroup)) * i / 90);
        var mu = 0.006 + 0.080 / (1 + group / 500) + 0.0000025 * group;
        points.push((i === 0 ? "M" : "L") + xOf(group).toFixed(2) + " " + yOf(mu).toFixed(2));
      }
      svg.appendChild(svgElement(doc, "path", { d: points.join(" "), "class": "bt-curve" }));
      var currentX = xOf(Math.max(minGroup, Math.min(maxGroup, result.stribeckGroup)));
      var currentY = yOf(result.frictionCoefficient);
      svg.appendChild(svgElement(doc, "circle", { cx: currentX, cy: currentY, r: 6, "class": "bt-current" }));
      svgText(doc, svg, "边界", xOf(15), 55, "bt-muted");
      svgText(doc, svg, "混合", xOf(900), 55, "bt-muted");
      svgText(doc, svg, "全膜", xOf(18000), 55, "bt-muted");
      svgText(doc, svg, "G=ηn/P（对数教学组）", 250, 272, "bt-muted");
      svgText(doc, svg, "μ", 42, 42, "bt-muted");
      svgText(doc, svg, "当前 G=" + formatNumber(result.stribeckGroup, 1) + ", μ=" + formatNumber(result.frictionCoefficient, 4), 335, 319, "bt-label");
      var gaugeY = 300;
      var gaugeLeft = 62;
      var gaugeWidth = 603;
      var gaugeX = gaugeLeft + Math.min(1, result.lambda / 10) * gaugeWidth;
      svg.appendChild(svgElement(doc, "line", { x1: gaugeLeft, y1: gaugeY, x2: gaugeLeft + gaugeWidth, y2: gaugeY, "class": "bt-gauge" }));
      svg.appendChild(svgElement(doc, "line", { x1: gaugeLeft + gaugeWidth * 0.1, y1: gaugeY - 8, x2: gaugeLeft + gaugeWidth * 0.1, y2: gaugeY + 8, "class": "bt-mark" }));
      svg.appendChild(svgElement(doc, "line", { x1: gaugeLeft + gaugeWidth * 0.3, y1: gaugeY - 8, x2: gaugeLeft + gaugeWidth * 0.3, y2: gaugeY + 8, "class": "bt-mark" }));
      svg.appendChild(svgElement(doc, "circle", { cx: gaugeX, cy: gaugeY, r: 6, "class": "bt-current" }));
      svgText(doc, svg, "λ=0", gaugeLeft - 5, gaugeY + 27, "bt-muted");
      svgText(doc, svg, "1", gaugeLeft + gaugeWidth * 0.1 - 3, gaugeY + 27, "bt-muted");
      svgText(doc, svg, "3", gaugeLeft + gaugeWidth * 0.3 - 3, gaugeY + 27, "bt-muted");
      svgText(doc, svg, "λ=" + formatNumber(result.lambda, 2) + "（膜厚比）", 480, gaugeY + 27, "bt-label");
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
      var heading = element(doc, "h3", { id: uid + "-heading", text: "滚动轴承寿命、膜厚比与摩擦账本" });
      var intro = element(doc, "p", { className: "bt-note", text: "先预测，再揭示 L10、合并粗糙度、教学膜厚代理和透明 Stribeck 型摩擦/功率账本。" });
      var form = element(doc, "form", { className: "bt-prediction" });
      form.appendChild(predictionQuestion(doc, uid, "球轴承载荷 P 加倍时，L10 约怎样变化？", "life", [
        { value: "eighth", label: "约变为 1/8，因为 p=3" },
        { value: "half", label: "约变为 1/2" },
        { value: "same", label: "基本不变" }
      ]));
      form.appendChild(predictionQuestion(doc, uid, "两表面粗糙度增大而 h_min 代理不变时，λ 怎样变化？", "roughness", [
        { value: "down", label: "下降，因为合并 σ 变大" },
        { value: "up", label: "上升，因为表面更有纹理" },
        { value: "same", label: "保持不变" }
      ]));
      form.appendChild(predictionQuestion(doc, uid, "提高黏度是否保证总摩擦功率单调下降？", "viscosity", [
        { value: "no", label: "不保证：膜厚可能增大，黏性项也可能增大" },
        { value: "yes", label: "保证：黏度越高摩擦越小" },
        { value: "none", label: "黏度与摩擦没有关系" }
      ]));
      var feedback = element(doc, "p", { className: "bt-feedback", role: "status", "aria-live": "polite", text: "结果尚未揭示。" });
      form.appendChild(element(doc, "div", { className: "bt-actions" }, [
        element(doc, "button", { type: "submit", className: "bt-primary", text: "提交预测并揭示" }),
        element(doc, "button", { type: "button", "data-reset": "true", text: "重置实验" })
      ]));
      form.appendChild(feedback);
      rootNode.appendChild(heading);
      rootNode.appendChild(intro);
      rootNode.appendChild(form);

      var bench = element(doc, "div", { hidden: true });
      var controls = element(doc, "div", { className: "bt-controls" });
      var fields = [
        numberControl(doc, uid, "C", "额定动载荷 C", DEFAULTS.C, 0.1, 1000, 0.1, "kN"),
        numberControl(doc, uid, "P", "当量载荷 P", DEFAULTS.P, 0.01, 1000, 0.1, "kN"),
        selectControl(doc, uid, "p", "寿命指数 p", DEFAULTS.p, [{ value: 3, label: "3（球）" }, { value: 3.3333333333333335, label: "10/3（滚子）" }], "无量纲"),
        numberControl(doc, uid, "speed", "转速 n", DEFAULTS.speed, 1, 20000, 1, "r/min"),
        numberControl(doc, uid, "Rq1", "表面粗糙度 Rq1", DEFAULTS.Rq1, 0.01, 10, 0.01, "μm"),
        numberControl(doc, uid, "Rq2", "表面粗糙度 Rq2", DEFAULTS.Rq2, 0.01, 10, 0.01, "μm"),
        numberControl(doc, uid, "eta", "黏度 η", DEFAULTS.eta, 1, 500, 1, "mPa·s"),
        numberControl(doc, uid, "dm", "平均直径 dm", DEFAULTS.dm, 1, 500, 1, "mm")
      ];
      fields.forEach(function (field) { controls.appendChild(field.node); });
      bench.appendChild(controls);
      var error = element(doc, "p", { className: "bt-error", role: "alert", "aria-live": "polite" });
      bench.appendChild(error);
      var layout = element(doc, "div", { className: "bt-layout" });
      var stage = element(doc, "div", { className: "bt-stage" });
      var svg = svgElement(doc, "svg", {});
      stage.appendChild(svg);
      var ledger = element(doc, "div", { className: "bt-table" });
      layout.appendChild(stage);
      layout.appendChild(ledger);
      bench.appendChild(layout);
      var metrics = element(doc, "div", { className: "bt-metrics" });
      bench.appendChild(metrics);
      bench.appendChild(element(doc, "p", { className: "bt-note", text: "提示：h_min、μ 和功率为可审计的教学代理；真实轴承应使用温度、污染、预紧和厂商/试验数据复核。" }));
      rootNode.appendChild(bench);

      function uiConfig() {
        var values = {};
        fields.forEach(function (field) {
          var raw = field.input.value.trim();
          if (!raw) throw new Error(field.key + " 不能为空");
          var value = Number(raw);
          if (!isFinite(value)) throw new Error(field.key + " 必须是有限数字");
          if (field.input.tagName.toLowerCase() === "input") {
            var min = Number(field.input.getAttribute("min"));
            var max = Number(field.input.getAttribute("max"));
            if (value < min || value > max) throw new Error(field.key + " 超出允许范围");
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
          drawStribeck(doc, svg, result);
          clear(metrics);
          metrics.appendChild(metric(doc, "L10", formatNumber(result.lifeMillionsRev, 3) + "×10⁶ rev"));
          metrics.appendChild(metric(doc, "寿命", formatNumber(result.lifeHours, 1) + " h"));
          metrics.appendChild(metric(doc, "膜厚比 λ", formatNumber(result.lambda, 2)));
          metrics.appendChild(metric(doc, "摩擦功率", formatNumber(result.frictionPower / 1000, 3) + " kW"));
          renderTable(doc, ledger, ["账本项", "读数", "单位/解释"], [
            ["L10", formatNumber(result.lifeRev, 0), "rev；90% 可靠度统计寿命"],
            ["L10,h", formatNumber(result.lifeHours, 2), "h；按当前转速换算"],
            ["σ=sqrt(Rq1²+Rq2²)", formatNumber(result.sigma, 4), "μm"],
            ["h_min 教学代理", formatNumber(result.filmMin, 4), "μm"],
            ["λ / 润滑区", formatNumber(result.lambda, 3), result.zone],
            ["G / μ", formatNumber(result.stribeckGroup, 2) + " / " + formatNumber(result.frictionCoefficient, 5), "Stribeck 型透明代理"],
            ["Tf / Wf", formatNumber(result.frictionTorque, 3) + " / " + formatNumber(result.frictionPower, 1), "N·m / W；代理账"]
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
          life: selected(form, uid + "-life"),
          roughness: selected(form, uid + "-roughness"),
          viscosity: selected(form, uid + "-viscosity")
        };
        if (!answers.life || !answers.roughness || !answers.viscosity) {
          feedback.textContent = "请先完成三项预测；结果仍然隐藏。";
          return;
        }
        state.revealed = true;
        bench.hidden = false;
        var correct = (answers.life === "eighth" ? 1 : 0) + (answers.roughness === "down" ? 1 : 0) + (answers.viscosity === "no" ? 1 : 0);
        feedback.textContent = "已揭示：" + correct + "/3 命中。现在调参，观察寿命、膜厚比和损失如何分账。";
        render();
        if (api && typeof api.announce === "function") api.announce(rootNode, "轴承摩擦学实验已揭示，寿命、膜厚比和摩擦功率账本已显示。");
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
        if (api && typeof api.announce === "function") api.announce(rootNode, "轴承实验已重置，预测结果再次隐藏。");
      });
      if (api && typeof api.announce === "function") api.announce(rootNode, "轴承实验已加载；先完成三项预测。");
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) { checks += 1; assert(condition, message); }
      check(formatNumber(300, 0) === "300", "integer formatting preserves trailing zeros");
      var result = model(DEFAULTS);
      check(near(result.lifeMillionsRev, 64), "default L10 million revolutions");
      check(near(result.lifeHours, 64e6 / (60 * 1500), 1e-12), "default hour conversion");
      check(near(result.sigma, Math.sqrt(0.2 * 0.2 + 0.3 * 0.3), 1e-12), "roughness combination");
      check(near(result.lambda, result.filmMin / result.sigma, 1e-12), "lambda ledger closes");
      check(result.zone === "全膜润滑", "default lubrication zone");
      var doubledLoad = model({ C: 20, P: 10, p: 3, speed: 1500, Rq1: 0.2, Rq2: 0.3, eta: 30, dm: 50 });
      check(near(doubledLoad.lifeMillionsRev, result.lifeMillionsRev / 8, 1e-12), "ball life scales as P^-3");
      check(doubledLoad.lambda < result.lambda, "load scale lowers film ratio");
      var rough = model({ C: 20, P: 5, p: 3, speed: 1500, Rq1: 1, Rq2: 1, eta: 30, dm: 50 });
      check(rough.lambda < result.lambda, "roughness boundary is visible");
      var thickOil = model({ C: 20, P: 5, p: 3, speed: 1500, Rq1: 0.2, Rq2: 0.3, eta: 500, dm: 50 });
      check(thickOil.filmMin > result.filmMin && thickOil.frictionPower > result.frictionPower, "viscosity can raise film and viscous loss");
      var invalidCaught = false;
      try { model({ C: 20, P: 0, p: 3, speed: 1500, Rq1: 0.2, Rq2: 0.3, eta: 30, dm: 50 }); } catch (error) { invalidCaught = true; }
      check(invalidCaught, "nonpositive load is rejected");
      return { checks: checks };
    }

    return {
      LAB_ID: LAB_ID,
      DEFAULTS: DEFAULTS,
      normalizeConfig: normalizeConfig,
      normalize: normalizeConfig,
      model: model,
      solveBearing: model,
      formatNumber: formatNumber,
      mount: mount,
      selfTest: selfTest
    };
  }
);
