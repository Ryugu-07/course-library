(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("mech-gears-contact-ratio", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("mech-gears-contact-ratio self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("mech-gears-contact-ratio self-test: FAIL\n" + error.stack);
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

    var LAB_ID = "mech-gears-contact-ratio";
    var STYLE_ID = "cl-mech-gears-contact-ratio-styles";
    var SVG_NS = "http://www.w3.org/2000/svg";
    var INSTANCE = 0;
    var DEFAULTS = {
      m: 3,
      z1: 20,
      z2: 40,
      phi: 20,
      n1: 1500
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
      return {
        m: bounded(source.m === undefined ? (source.moduleMm === undefined ? DEFAULTS.m : source.moduleMm) : source.m, "m", 0.1, 50),
        z1: integer(source.z1 === undefined ? DEFAULTS.z1 : source.z1, "z1", 4, 300),
        z2: integer(source.z2 === undefined ? DEFAULTS.z2 : source.z2, "z2", 4, 300),
        phi: bounded(source.phi === undefined ? (source.pressureAngleDeg === undefined ? DEFAULTS.phi : source.pressureAngleDeg) : source.phi, "phi", 5, 45),
        n1: bounded(source.n1 === undefined ? (source.inputRpm === undefined ? DEFAULTS.n1 : source.inputRpm) : source.n1, "n1", 1, 10000)
      };
    }

    function contactState(epsilonAlpha) {
      var geometricContact = epsilonAlpha >= 1;
      var engineeringMargin = epsilonAlpha > 1;
      return {
        geometricContact: geometricContact,
        engineeringMargin: engineeringMargin,
        status: geometricContact ? (engineeringMargin ? "连续且有工程余量" : "几何接触边界") : "接触中断风险"
      };
    }

    function model(input) {
      var config = normalizeConfig(input);
      var phiRad = config.phi * Math.PI / 180;
      var sinPhi = Math.sin(phiRad);
      var cosPhi = Math.cos(phiRad);
      var r1 = config.m * config.z1 / 2;
      var r2 = config.m * config.z2 / 2;
      var centerDistance = config.m * (config.z1 + config.z2) / 2;
      var rb1 = r1 * cosPhi;
      var rb2 = r2 * cosPhi;
      var ra1 = config.m * (config.z1 / 2 + 1);
      var ra2 = config.m * (config.z2 / 2 + 1);
      var path = Math.sqrt(ra1 * ra1 - rb1 * rb1) + Math.sqrt(ra2 * ra2 - rb2 * rb2) - centerDistance * sinPhi;
      var basePitch = Math.PI * config.m * cosPhi;
      var epsilonAlpha = path / basePitch;
      var ratio = config.z2 / config.z1;
      var zMin = 2 / (sinPhi * sinPhi);
      var undercut1 = config.z1 < zMin;
      var undercut2 = config.z2 < zMin;
      var contact = contactState(epsilonAlpha);
      return {
        config: config,
        phiRad: phiRad,
        centerDistance: centerDistance,
        a: centerDistance,
        pitchRadii: [r1, r2],
        baseRadii: [rb1, rb2],
        rb: [rb1, rb2],
        addendumRadii: [ra1, ra2],
        ra: [ra1, ra2],
        path: path,
        basePitch: basePitch,
        epsilonAlpha: epsilonAlpha,
        epsilon_alpha: epsilonAlpha,
        ratio: ratio,
        i: ratio,
        outputRpm: config.n1 / ratio,
        n2: config.n1 / ratio,
        direction: "反向",
        zMin: zMin,
        z_min: zMin,
        undercut: [undercut1, undercut2],
        rootRisk: undercut1 || undercut2,
        geometricContact: contact.geometricContact,
        engineeringMargin: contact.engineeringMargin,
        contactStatus: contact.status,
        continuous: contact.geometricContact,
        standardModel: "标准全齿高、无变位、标准中心距、理想刚体几何"
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
      parent.appendChild(svgElement(doc, "text", { x: x, y: y, "class": className || "gc-label" }, [doc.createTextNode(text)]));
    }

    function renderTable(doc, hostNode, headings, rows) {
      clear(hostNode);
      var table = element(doc, "table");
      var thead = element(doc, "thead");
      var headRow = element(doc, "tr");
      headings.forEach(function (heading) { headRow.appendChild(element(doc, "th", { scope: "col", text: heading })); });
      thead.appendChild(headRow);
      table.appendChild(thead);
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
      return element(doc, "div", { className: "gc-metric" }, [
        element(doc, "span", { text: label }),
        element(doc, "strong", { text: value })
      ]);
    }

    function predictionQuestion(doc, uid, question, name, choices) {
      var fieldset = element(doc, "fieldset", {}, [element(doc, "legend", { text: question })]);
      var options = element(doc, "div", { className: "gc-options" });
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
      return {
        key: key,
        input: input,
        node: element(doc, "label", { className: "gc-control", htmlFor: id }, [
          element(doc, "span", { text: label }),
          input,
          element(doc, "small", { text: unit })
        ])
      };
    }

    function injectStyles(doc) {
      if (!doc || doc.getElementById(STYLE_ID)) return;
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent =
        '[data-learning-lab="' + LAB_ID + '"]{--gc-blue:#245a9a;--gc-orange:#b4512c;--gc-green:#28754d;--gc-warn:#a13932;display:block;max-width:100%;min-width:0;line-height:1.55;overflow-wrap:anywhere}' +
        '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}' +
        '[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}' +
        '[data-learning-lab="' + LAB_ID + '"] .gc-note,[data-learning-lab="' + LAB_ID + '"] .gc-feedback{color:var(--fg-soft,currentColor);font-size:13px}' +
        '[data-learning-lab="' + LAB_ID + '"] .gc-prediction{padding:11px 13px;border-left:4px solid var(--gc-orange);background:var(--block-bg,transparent)}' +
        '[data-learning-lab="' + LAB_ID + '"] fieldset{border:1px solid var(--border,currentColor);border-radius:6px;margin:11px 0;padding:9px 12px}' +
        '[data-learning-lab="' + LAB_ID + '"] legend{padding:0 4px;font-weight:700}' +
        '[data-learning-lab="' + LAB_ID + '"] .gc-options{display:grid;gap:4px}' +
        '[data-learning-lab="' + LAB_ID + '"] .gc-options label{display:flex;gap:8px;align-items:flex-start;min-height:44px;padding:7px 0;cursor:pointer}' +
        '[data-learning-lab="' + LAB_ID + '"] .gc-options input{flex:0 0 auto;margin-top:5px;accent-color:var(--gc-blue)}' +
        '[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{min-height:44px;font:inherit;letter-spacing:0}' +
        '[data-learning-lab="' + LAB_ID + '"] input[type=number]{width:100%;padding:7px 9px;border:1px solid var(--border,currentColor);border-radius:6px;background:var(--bg,Canvas);color:inherit}' +
        '[data-learning-lab="' + LAB_ID + '"] button{padding:8px 13px;border:1px solid var(--border,currentColor);border-radius:6px;background:var(--bg,Canvas);color:inherit;cursor:pointer}' +
        '[data-learning-lab="' + LAB_ID + '"] button:hover,[data-learning-lab="' + LAB_ID + '"] button:focus-visible{border-color:var(--gc-blue)}' +
        '[data-learning-lab="' + LAB_ID + '"] .gc-primary{background:var(--gc-blue);border-color:var(--gc-blue);color:#fff}' +
        '[data-learning-lab="' + LAB_ID + '"] .gc-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}' +
        '[data-learning-lab="' + LAB_ID + '"] .gc-controls{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:11px;margin:15px 0;align-items:end}' +
        '[data-learning-lab="' + LAB_ID + '"] .gc-control{display:grid;gap:5px;min-width:0;font-weight:700;font-size:13px}' +
        '[data-learning-lab="' + LAB_ID + '"] .gc-control small{color:var(--fg-soft,currentColor);font-size:11px;font-weight:400}' +
        '[data-learning-lab="' + LAB_ID + '"] .gc-error{min-height:1.6em;color:var(--gc-warn);font-weight:700}' +
        '[data-learning-lab="' + LAB_ID + '"] .gc-layout{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(250px,.85fr);gap:15px;align-items:start}' +
        '[data-learning-lab="' + LAB_ID + '"] .gc-stage{min-width:0;border:1px solid var(--border,currentColor);border-radius:6px;padding:7px;overflow:hidden;background:var(--bg,Canvas)}' +
        '[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}' +
        '[data-learning-lab="' + LAB_ID + '"] svg text{font-family:inherit;letter-spacing:0;fill:currentColor;font-size:12px}' +
        '[data-learning-lab="' + LAB_ID + '"] .gc-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}' +
        '[data-learning-lab="' + LAB_ID + '"] .gc-metric{min-width:0;padding:8px;border-top:3px solid var(--gc-blue);background:var(--bg,Canvas)}' +
        '[data-learning-lab="' + LAB_ID + '"] .gc-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}' +
        '[data-learning-lab="' + LAB_ID + '"] .gc-metric strong{display:block;margin-top:3px;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}' +
        '[data-learning-lab="' + LAB_ID + '"] .gc-table{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}' +
        '[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:430px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}' +
        '[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,currentColor);text-align:left;vertical-align:top}' +
        '[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}' +
        '[data-learning-lab="' + LAB_ID + '"] .gc-boundary{color:var(--gc-warn);font-weight:700}' +
        '@media(max-width:850px){[data-learning-lab="' + LAB_ID + '"] .gc-controls{grid-template-columns:repeat(3,minmax(0,1fr))}[data-learning-lab="' + LAB_ID + '"] .gc-layout{grid-template-columns:1fr}}' +
        '@media(max-width:520px){[data-learning-lab="' + LAB_ID + '"] .gc-controls{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="' + LAB_ID + '"] .gc-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}' +
        '@media(max-width:360px){[data-learning-lab="' + LAB_ID + '"] .gc-controls{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .gc-actions>*{width:100%}[data-learning-lab="' + LAB_ID + '"] .gc-metrics{grid-template-columns:1fr}}' +
        '@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}';
      (doc.head || doc.documentElement).appendChild(style);
    }

    function drawGears(doc, svg, result) {
      clear(svg);
      var width = 700;
      var height = 350;
      svg.setAttribute("viewBox", "0 0 " + width + " " + height);
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", "标准外啮合直齿轮的分度圆、基圆、齿顶圆和啮合线");
      var maxRadius = Math.max(result.addendumRadii[0], result.addendumRadii[1]);
      var scale = 105 / maxRadius;
      var c1x = 190;
      var c2x = c1x + result.centerDistance * scale;
      var cy = 176;
      function circle(cx, radius, className) {
        svg.appendChild(svgElement(doc, "circle", { cx: cx, cy: cy, r: radius * scale, "class": className }));
      }
      svg.appendChild(svgElement(doc, "line", { x1: c1x - 35, y1: cy, x2: c2x + 35, y2: cy, "class": "gc-center" }));
      circle(c1x, result.addendumRadii[0], "gc-addendum");
      circle(c1x, result.pitchRadii[0], "gc-pitch");
      circle(c1x, result.baseRadii[0], "gc-base");
      circle(c2x, result.addendumRadii[1], "gc-addendum");
      circle(c2x, result.pitchRadii[1], "gc-pitch");
      circle(c2x, result.baseRadii[1], "gc-base");
      var lineY1 = cy - 75;
      var lineY2 = cy + 75;
      var tangentX1 = c1x + result.baseRadii[0] * scale * Math.sin(result.phiRad);
      var tangentX2 = c2x - result.baseRadii[1] * scale * Math.sin(result.phiRad);
      svg.appendChild(svgElement(doc, "line", { x1: tangentX1, y1: lineY1, x2: tangentX2, y2: lineY2, "class": "gc-action" }));
      svg.appendChild(svgElement(doc, "circle", { cx: c1x, cy: cy, r: 4, "class": "gc-node" }));
      svg.appendChild(svgElement(doc, "circle", { cx: c2x, cy: cy, r: 4, "class": "gc-node" }));
      svgText(doc, svg, "1", c1x - 5, cy + 4, "gc-label gc-blue");
      svgText(doc, svg, "2", c2x - 5, cy + 4, "gc-label gc-orange");
      svgText(doc, svg, "分度圆", c1x - 30, cy - result.pitchRadii[0] * scale - 8, "gc-muted");
      svgText(doc, svg, "基圆", c1x - 25, cy + result.baseRadii[0] * scale + 20, "gc-muted");
      svgText(doc, svg, "啮合线 / 压力角 " + formatNumber(result.config.phi, 1) + "°", 354, 65, "gc-muted");
      svgText(doc, svg, "a=" + formatNumber(result.centerDistance, 2) + " mm", (c1x + c2x) / 2 - 45, cy + 25, "gc-muted");
      svgText(doc, svg, "εα=" + formatNumber(result.epsilonAlpha, 3) + "  " + result.contactStatus, 215, 315, result.geometricContact ? "gc-good" : "gc-warn");
      svgText(doc, svg, result.rootRisk ? "根切筛查：风险" : "根切筛查：通过", 470, 315, result.rootRisk ? "gc-warn" : "gc-good");
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
      var heading = element(doc, "h3", { id: uid + "-heading", text: "标准外啮合直齿轮：速比与接触比实验" });
      var intro = element(doc, "p", { className: "gc-note", text: "先完成三项预测，再揭示几何账本。模型只覆盖标准全齿高、无变位、标准中心距与理想刚体几何。" });
      var form = element(doc, "form", { className: "gc-prediction" });
      form.appendChild(predictionQuestion(doc, uid, "固定 z1 时，增大 z2 会让从动转速怎样变化？", "speed", [
        { value: "down", label: "降低，因为 i=z2/z1 变大" },
        { value: "up", label: "升高，因为齿数更多" },
        { value: "same", label: "保持不变" }
      ]));
      form.appendChild(predictionQuestion(doc, uid, "理想刚体几何下至少一对齿接触的边界怎样？", "contact", [
        { value: "atleast", label: "εα≥1；工程上通常再留 >1 余量" },
        { value: "below", label: "εα<1，理想几何接触不足" },
        { value: "zero", label: "只要基圆相切即可" }
      ]));
      form.appendChild(predictionQuestion(doc, uid, "20° 压力角下，20 齿小齿轮的标准根切初筛怎样？", "undercut", [
        { value: "pass", label: "通过：20 大于约 17.10" },
        { value: "risk", label: "风险：20 小于约 17.10" },
        { value: "unknown", label: "齿数与压力角无关" }
      ]));
      var feedback = element(doc, "p", { className: "gc-feedback", role: "status", "aria-live": "polite", text: "结果尚未揭示。" });
      form.appendChild(element(doc, "div", { className: "gc-actions" }, [
        element(doc, "button", { type: "submit", className: "gc-primary", text: "提交预测并揭示" }),
        element(doc, "button", { type: "button", "data-reset": "true", text: "重置实验" })
      ]));
      form.appendChild(feedback);
      rootNode.appendChild(heading);
      rootNode.appendChild(intro);
      rootNode.appendChild(form);

      var bench = element(doc, "div", { hidden: true });
      var controls = element(doc, "div", { className: "gc-controls" });
      var fields = [
        numberControl(doc, uid, "m", "模数 m", DEFAULTS.m, 0.1, 50, 0.1, "mm"),
        numberControl(doc, uid, "z1", "小齿轮 z1", DEFAULTS.z1, 4, 300, 1, "齿"),
        numberControl(doc, uid, "z2", "大齿轮 z2", DEFAULTS.z2, 4, 300, 1, "齿"),
        numberControl(doc, uid, "phi", "压力角 φ", DEFAULTS.phi, 5, 45, 0.5, "deg"),
        numberControl(doc, uid, "n1", "输入转速 n1", DEFAULTS.n1, 1, 10000, 1, "r/min")
      ];
      fields.forEach(function (field) { controls.appendChild(field.node); });
      bench.appendChild(controls);
      var error = element(doc, "p", { className: "gc-error", role: "alert", "aria-live": "polite" });
      bench.appendChild(error);
      var layout = element(doc, "div", { className: "gc-layout" });
      var stage = element(doc, "div", { className: "gc-stage" });
      var svg = svgElement(doc, "svg", {});
      stage.appendChild(svg);
      var ledger = element(doc, "div", { className: "gc-table" });
      layout.appendChild(stage);
      layout.appendChild(ledger);
      bench.appendChild(layout);
      var metrics = element(doc, "div", { className: "gc-metrics" });
      bench.appendChild(metrics);
      rootNode.appendChild(bench);

      function uiConfig() {
        var values = {};
        fields.forEach(function (field) {
          var raw = field.input.value.trim();
          if (!raw) throw new Error(field.key + " 不能为空");
          var value = Number(raw);
          var min = Number(field.input.getAttribute("min"));
          var max = Number(field.input.getAttribute("max"));
          if (!isFinite(value) || value < min || value > max) throw new Error(field.key + " 超出允许范围");
          if ((field.key === "z1" || field.key === "z2" || field.key === "n1") && Math.floor(value) !== value) throw new Error(field.key + " 必须是整数");
          values[field.key] = value;
        });
        return values;
      }

      function render() {
        if (!state.revealed) return;
        try {
          var result = model(uiConfig());
          error.textContent = "";
          drawGears(doc, svg, result);
          clear(metrics);
          metrics.appendChild(metric(doc, "中心距", formatNumber(result.centerDistance, 2) + " mm"));
          metrics.appendChild(metric(doc, "速比", formatNumber(result.ratio, 3) + " : 1"));
          metrics.appendChild(metric(doc, "接触比", formatNumber(result.epsilonAlpha, 3)));
          metrics.appendChild(metric(doc, "根切筛查", result.rootRisk ? "风险" : "通过"));
          renderTable(doc, ledger, ["账本项", "读数", "判定/单位"], [
            ["path / base pitch", formatNumber(result.path, 3) + " / " + formatNumber(result.basePitch, 3), "mm"],
            ["n2", formatNumber(result.outputRpm, 2), "r/min；与 n1 反向"],
            ["zmin", formatNumber(result.zMin, 3), "z1=" + result.config.z1 + ", z2=" + result.config.z2],
            ["标准模型", result.standardModel, result.contactStatus],
            ["根切", result.rootRisk ? "至少一轮低于 zmin" : "两轮均不低于 zmin", result.rootRisk ? "风险" : "通过"]
          ]);
          if (result.rootRisk || !result.geometricContact || !result.engineeringMargin) {
            ledger.appendChild(element(doc, "p", { className: "gc-note gc-boundary", text: result.geometricContact && !result.engineeringMargin ? "边界提示：εα=1 仍是理想几何接触边界，工程设计通常留出 >1 余量。" : "边界提示：这是标准几何初筛，不是强度或实际装配结论。" }));
          }
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
          speed: selected(form, uid + "-speed"),
          contact: selected(form, uid + "-contact"),
          undercut: selected(form, uid + "-undercut")
        };
        if (!answers.speed || !answers.contact || !answers.undercut) {
          feedback.textContent = "请先完成三项预测；结果仍然隐藏。";
          return;
        }
        state.revealed = true;
        bench.hidden = false;
        var correct = (answers.speed === "down" ? 1 : 0) + (answers.contact === "atleast" ? 1 : 0) + (answers.undercut === "pass" ? 1 : 0);
        feedback.textContent = "已揭示：" + correct + "/3 命中。现在调参，观察几何账本与边界提示。";
        render();
        if (api && typeof api.announce === "function") api.announce(rootNode, "齿轮接触比实验已揭示，速比、啮合路径和根切账本已显示。");
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
        if (api && typeof api.announce === "function") api.announce(rootNode, "齿轮实验已重置，预测结果再次隐藏。");
      });
      if (api && typeof api.announce === "function") api.announce(rootNode, "齿轮实验已加载；先完成三项预测。");
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) { checks += 1; assert(condition, message); }
      check(formatNumber(300, 0) === "300", "integer formatting preserves trailing zeros");
      var result = model(DEFAULTS);
      check(near(result.centerDistance, 90), "default center distance");
      check(near(result.ratio, 2) && near(result.outputRpm, 750), "default speed ratio and output speed");
      check(near(result.path / result.basePitch, result.epsilonAlpha, 1e-12), "contact ratio parses path and base pitch");
      check(near(result.outputRpm * result.ratio, result.config.n1, 1e-12), "speed ledger closes");
      check(result.continuous && !result.rootRisk, "default geometry passes boundaries");
      check(contactState(1).geometricContact && !contactState(1).engineeringMargin, "epsilon equal to one is the geometric contact boundary");
      check(!contactState(0.999999).geometricContact, "epsilon below one is contact deficient");
      var scaled = model({ m: 6, z1: DEFAULTS.z1, z2: DEFAULTS.z2, phi: DEFAULTS.phi, n1: DEFAULTS.n1 });
      check(near(scaled.centerDistance, 2 * result.centerDistance), "module scale doubles center distance");
      check(near(scaled.epsilonAlpha, result.epsilonAlpha, 1e-12), "module scale preserves contact ratio");
      var rootBoundary = model({ m: 3, z1: 17, z2: 40, phi: 20, n1: 1500 });
      check(rootBoundary.rootRisk && rootBoundary.zMin > 17, "undercut boundary is visible");
      var invalidCaught = false;
      try { model({ m: 3, z1: 20.5, z2: 40, phi: 20, n1: 1500 }); } catch (error) { invalidCaught = true; }
      check(invalidCaught, "noninteger tooth count is rejected");
      return { checks: checks };
    }

    return {
      LAB_ID: LAB_ID,
      DEFAULTS: DEFAULTS,
      normalizeConfig: normalizeConfig,
      normalize: normalizeConfig,
      model: model,
      solveGears: model,
      formatNumber: formatNumber,
      mount: mount,
      selfTest: selfTest
    };
  }
);
