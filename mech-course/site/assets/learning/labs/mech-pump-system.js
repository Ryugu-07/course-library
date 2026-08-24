(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("mech-pump-system", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("mech-pump-system self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("mech-pump-system self-test: FAIL\n" + error.stack);
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

    var LAB_ID = "mech-pump-system";
    var STYLE_ID = "cl-mech-pump-system-styles";
    var SVG_NS = "http://www.w3.org/2000/svg";
    var G = 9.81;
    var INSTANCE = 0;
    var DEFAULTS = {
      H0: 50,
      k: 0.008,
      Hstatic: 10,
      r: 0.004,
      n: 1,
      rho: 1000,
      etaMax: 0.82,
      etaCurve: 0.00015,
      QBEP: 50,
      pSurface: 101.3,
      pVapor: 2.3,
      zSuction: 2.5,
      hSuction: 0.8,
      NPSHr0: 3,
      Qref: 50
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
      var config = {
        H0: bounded(source.H0 === undefined ? DEFAULTS.H0 : source.H0, "H0", 0.1, 300),
        k: bounded(source.k === undefined ? DEFAULTS.k : source.k, "k", 0.000001, 1),
        Hstatic: bounded(source.Hstatic === undefined ? DEFAULTS.Hstatic : source.Hstatic, "Hstatic", 0, 300),
        r: bounded(source.r === undefined ? DEFAULTS.r : source.r, "r", 0, 1),
        n: bounded(source.n === undefined ? DEFAULTS.n : source.n, "n", 0.1, 1.5),
        rho: bounded(source.rho === undefined ? DEFAULTS.rho : source.rho, "rho", 500, 1500),
        etaMax: bounded(source.etaMax === undefined ? DEFAULTS.etaMax : source.etaMax, "etaMax", 0.4, 0.95),
        etaCurve: bounded(source.etaCurve === undefined ? DEFAULTS.etaCurve : source.etaCurve, "etaCurve", 0.000001, 0.01),
        QBEP: bounded(source.QBEP === undefined ? DEFAULTS.QBEP : source.QBEP, "QBEP", 1, 300),
        pSurface: bounded(source.pSurface === undefined ? DEFAULTS.pSurface : source.pSurface, "pSurface", 10, 300),
        pVapor: bounded(source.pVapor === undefined ? DEFAULTS.pVapor : source.pVapor, "pVapor", 0.1, 100),
        zSuction: bounded(source.zSuction === undefined ? DEFAULTS.zSuction : source.zSuction, "zSuction", -50, 50),
        hSuction: bounded(source.hSuction === undefined ? DEFAULTS.hSuction : source.hSuction, "hSuction", 0, 100),
        NPSHr0: bounded(source.NPSHr0 === undefined ? DEFAULTS.NPSHr0 : source.NPSHr0, "NPSHr0", 0.1, 50),
        Qref: bounded(source.Qref === undefined ? DEFAULTS.Qref : source.Qref, "Qref", 1, 300)
      };
      if (!(config.pSurface > config.pVapor)) throw new RangeError("pSurface must exceed pVapor");
      return config;
    }

    function clip(value, low, high) {
      return Math.max(low, Math.min(high, value));
    }

    function model(input) {
      var config = normalizeConfig(input);
      var numerator = config.H0 * config.n * config.n - config.Hstatic;
      var npsha = (config.pSurface - config.pVapor) * 1000 / (config.rho * G) + config.zSuction - config.hSuction;
      var affinity = { Q: config.n, H: config.n * config.n, P: config.n * config.n * config.n };
      if (!(numerator > 0)) {
        return {
          config: config,
          feasible: false,
          blocked: true,
          blockedReason: "H0*n² 不高于静扬程，正流量没有泵/系统交点",
          numerator: numerator,
          operatingPoint: null,
          Q: null,
          H: null,
          Hp: null,
          Hs: null,
          shaftPower: null,
          NPSHa: npsha,
          NPSHr: null,
          pumpHead: function () { return config.H0 * config.n * config.n; },
          systemHead: function () { return config.Hstatic; },
          npsha: npsha,
          npshr: null,
          npshMargin: null,
          cavitationRisk: null,
          affinity: affinity,
          power: null,
          hydraulicPower: null,
          efficiency: null
        };
      }
      var q = Math.sqrt(numerator / (config.k + config.r));
      var pumpHead = config.H0 * config.n * config.n - config.k * q * q;
      var systemHead = config.Hstatic + config.r * q * q;
      var bepFlow = config.n * config.QBEP;
      var efficiency = clip(config.etaMax - config.etaCurve * (q - bepFlow) * (q - bepFlow), 0.35, 0.9);
      var hydraulicPower = config.rho * G * (q / 3600) * systemHead;
      var shaftPower = hydraulicPower / efficiency;
      var npshReferenceFlow = config.n * config.Qref;
      var npshr = config.NPSHr0 * config.n * config.n * (1 + 0.15 * (q / npshReferenceFlow) * (q / npshReferenceFlow));
      return {
        config: config,
        feasible: true,
        blocked: false,
        blockedReason: "",
        numerator: numerator,
        operatingPoint: { Q: q, H: systemHead },
        Q: q,
        H: systemHead,
        Hp: pumpHead,
        Hs: systemHead,
        bepFlow: bepFlow,
        npshReferenceFlow: npshReferenceFlow,
        pumpHead: function (flow) { return config.H0 * config.n * config.n - config.k * flow * flow; },
        systemHead: function (flow) { return config.Hstatic + config.r * flow * flow; },
        efficiency: efficiency,
        hydraulicPower: hydraulicPower,
        power: shaftPower,
        shaftPower: shaftPower,
        npsha: npsha,
        npshr: npshr,
        NPSHa: npsha,
        NPSHr: npshr,
        npshMargin: npsha - npshr,
        cavitationRisk: npsha - npshr <= 0,
        affinity: affinity,
        units: "Q in m^3/h; H and NPSH in m; power in W"
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
      parent.appendChild(svgElement(doc, "text", { x: x, y: y, "class": className || "ps-label" }, [doc.createTextNode(text)]));
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
      return element(doc, "div", { className: "ps-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]);
    }

    function predictionQuestion(doc, uid, question, name, choices) {
      var fieldset = element(doc, "fieldset", {}, [element(doc, "legend", { text: question })]);
      var options = element(doc, "div", { className: "ps-options" });
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
      return { key: key, input: input, node: element(doc, "label", { className: "ps-control", htmlFor: id }, [element(doc, "span", { text: label }), input, element(doc, "small", { text: unit })]) };
    }

    function injectStyles(doc) {
      if (!doc || doc.getElementById(STYLE_ID)) return;
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent =
        '[data-learning-lab="' + LAB_ID + '"]{--ps-blue:#245a9a;--ps-red:#a13f32;--ps-green:#28754d;--ps-warn:#a13932;display:block;max-width:100%;min-width:0;line-height:1.55;overflow-wrap:anywhere}' +
        '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}' +
        '[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}' +
        '[data-learning-lab="' + LAB_ID + '"] .ps-note,[data-learning-lab="' + LAB_ID + '"] .ps-feedback{color:var(--fg-soft,currentColor);font-size:13px}' +
        '[data-learning-lab="' + LAB_ID + '"] .ps-prediction{padding:11px 13px;border-left:4px solid var(--ps-red);background:var(--block-bg,transparent)}' +
        '[data-learning-lab="' + LAB_ID + '"] fieldset{border:1px solid var(--border,currentColor);border-radius:6px;margin:11px 0;padding:9px 12px}' +
        '[data-learning-lab="' + LAB_ID + '"] legend{padding:0 4px;font-weight:700}' +
        '[data-learning-lab="' + LAB_ID + '"] .ps-options{display:grid;gap:4px}' +
        '[data-learning-lab="' + LAB_ID + '"] .ps-options label{display:flex;gap:8px;align-items:flex-start;min-height:44px;padding:7px 0;cursor:pointer}' +
        '[data-learning-lab="' + LAB_ID + '"] .ps-options input{flex:0 0 auto;margin-top:5px;accent-color:var(--ps-blue)}' +
        '[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{min-height:44px;font:inherit;letter-spacing:0}' +
        '[data-learning-lab="' + LAB_ID + '"] input[type=number]{width:100%;padding:7px 9px;border:1px solid var(--border,currentColor);border-radius:6px;background:var(--bg,Canvas);color:inherit}' +
        '[data-learning-lab="' + LAB_ID + '"] button{padding:8px 13px;border:1px solid var(--border,currentColor);border-radius:6px;background:var(--bg,Canvas);color:inherit;cursor:pointer}' +
        '[data-learning-lab="' + LAB_ID + '"] button:hover,[data-learning-lab="' + LAB_ID + '"] button:focus-visible{border-color:var(--ps-blue)}' +
        '[data-learning-lab="' + LAB_ID + '"] .ps-primary{background:var(--ps-blue);border-color:var(--ps-blue);color:#fff}' +
        '[data-learning-lab="' + LAB_ID + '"] .ps-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}' +
        '[data-learning-lab="' + LAB_ID + '"] .ps-controls{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:11px;margin:15px 0;align-items:end}' +
        '[data-learning-lab="' + LAB_ID + '"] .ps-control{display:grid;gap:5px;min-width:0;font-weight:700;font-size:13px}' +
        '[data-learning-lab="' + LAB_ID + '"] .ps-control small{color:var(--fg-soft,currentColor);font-size:11px;font-weight:400}' +
        '[data-learning-lab="' + LAB_ID + '"] .ps-error{min-height:1.6em;color:var(--ps-warn);font-weight:700}' +
        '[data-learning-lab="' + LAB_ID + '"] .ps-layout{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(250px,.8fr);gap:15px;align-items:start}' +
        '[data-learning-lab="' + LAB_ID + '"] .ps-stage{min-width:0;border:1px solid var(--border,currentColor);border-radius:6px;padding:7px;overflow:hidden;background:var(--bg,Canvas)}' +
        '[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}' +
        '[data-learning-lab="' + LAB_ID + '"] svg text{font-family:inherit;letter-spacing:0;fill:currentColor;font-size:12px}' +
        '[data-learning-lab="' + LAB_ID + '"] .ps-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}' +
        '[data-learning-lab="' + LAB_ID + '"] .ps-metric{min-width:0;padding:8px;border-top:3px solid var(--ps-blue);background:var(--bg,Canvas)}' +
        '[data-learning-lab="' + LAB_ID + '"] .ps-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}' +
        '[data-learning-lab="' + LAB_ID + '"] .ps-metric strong{display:block;margin-top:3px;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}' +
        '[data-learning-lab="' + LAB_ID + '"] .ps-table{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}' +
        '[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:450px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}' +
        '[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,currentColor);text-align:left;vertical-align:top}' +
        '[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}' +
        '[data-learning-lab="' + LAB_ID + '"] .ps-blocked{color:var(--ps-warn);font-weight:700}' +
        '@media(max-width:900px){[data-learning-lab="' + LAB_ID + '"] .ps-controls{grid-template-columns:repeat(3,minmax(0,1fr))}[data-learning-lab="' + LAB_ID + '"] .ps-layout{grid-template-columns:1fr}}' +
        '@media(max-width:560px){[data-learning-lab="' + LAB_ID + '"] .ps-controls{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="' + LAB_ID + '"] .ps-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}' +
        '@media(max-width:360px){[data-learning-lab="' + LAB_ID + '"] .ps-controls{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .ps-actions>*{width:100%}[data-learning-lab="' + LAB_ID + '"] .ps-metrics{grid-template-columns:1fr}}' +
        '@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}';
      (doc.head || doc.documentElement).appendChild(style);
    }

    function drawCurves(doc, svg, result) {
      clear(svg);
      var width = 700;
      var height = 370;
      svg.setAttribute("viewBox", "0 0 " + width + " " + height);
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", "泵曲线和系统曲线的解析工作点，以及汽蚀余量结果");
      var left = 58;
      var right = 665;
      var top = 30;
      var bottom = 265;
      var maxFlow;
      if (result.feasible) {
        maxFlow = Math.max(result.Q * 1.55, Math.sqrt(result.config.H0 * result.config.n * result.config.n / result.config.k) * 1.02);
      } else {
        maxFlow = Math.max(80, Math.sqrt(result.config.H0 * result.config.n * result.config.n / result.config.k) * 1.02);
      }
      var maxHead = Math.max(result.config.H0 * result.config.n * result.config.n, result.config.Hstatic + result.config.r * maxFlow * maxFlow) * 1.08;
      function xOf(q) { return left + q / maxFlow * (right - left); }
      function yOf(h) { return bottom - Math.max(0, Math.min(maxHead, h)) / maxHead * (bottom - top); }
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, "class": "ps-axis" }));
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: top, x2: left, y2: bottom, "class": "ps-axis" }));
      var pumpPoints = [];
      var systemPoints = [];
      for (var i = 0; i <= 80; i += 1) {
        var q = maxFlow * i / 80;
        pumpPoints.push((i === 0 ? "M" : "L") + xOf(q).toFixed(2) + " " + yOf(result.pumpHead(q)).toFixed(2));
        systemPoints.push((i === 0 ? "M" : "L") + xOf(q).toFixed(2) + " " + yOf(result.systemHead(q)).toFixed(2));
      }
      svg.appendChild(svgElement(doc, "path", { d: pumpPoints.join(" "), "class": "ps-pump" }));
      svg.appendChild(svgElement(doc, "path", { d: systemPoints.join(" "), "class": "ps-system" }));
      if (result.feasible) {
        svg.appendChild(svgElement(doc, "line", { x1: xOf(result.Q), y1: bottom, x2: xOf(result.Q), y2: yOf(result.H), "class": "ps-guide" }));
        svg.appendChild(svgElement(doc, "circle", { cx: xOf(result.Q), cy: yOf(result.H), r: 7, "class": "ps-point" }));
        svgText(doc, svg, "工作点 Q=" + formatNumber(result.Q, 2) + " m³/h, H=" + formatNumber(result.H, 2) + " m", 260, 25, "ps-label");
      } else {
        svgText(doc, svg, "无正交点：调参后可恢复", 250, 25, "ps-blocked");
      }
      svgText(doc, svg, "Q（m³/h）", 315, 305, "ps-muted");
      svgText(doc, svg, "H（m）", 18, 42, "ps-muted");
      svgText(doc, svg, "泵曲线", 520, 100, "ps-pump-label");
      svgText(doc, svg, "系统曲线", 520, 220, "ps-system-label");
      var npshY = 335;
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: npshY, x2: right, y2: npshY, "class": "ps-gauge" }));
      var npshSpan = result.feasible ? Math.max(result.npsha, result.npshr, 1) * 1.15 : Math.max(result.npsha, 1) * 1.15;
      var npshaX = left + Math.max(0, result.npsha / npshSpan) * (right - left);
      var npshrX = result.feasible ? left + Math.max(0, result.npshr / npshSpan) * (right - left) : left;
      svg.appendChild(svgElement(doc, "line", { x1: npshaX, y1: npshY - 8, x2: npshaX, y2: npshY + 8, "class": "ps-npsha" }));
      if (result.feasible) svg.appendChild(svgElement(doc, "line", { x1: npshrX, y1: npshY - 8, x2: npshrX, y2: npshY + 8, "class": "ps-npshr" }));
      svgText(doc, svg, "NPSHa=" + formatNumber(result.npsha, 2) + " m", 65, 362, "ps-npsha-label");
      svgText(doc, svg, result.feasible ? "NPSHr=" + formatNumber(result.npshr, 2) + " m" : "NPSHr 等待正交点", 490, 362, "ps-npshr-label");
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
      var heading = element(doc, "h3", { id: uid + "-heading", text: "泵曲线、系统曲线与 NPSH 工作点" });
      var intro = element(doc, "p", { className: "ps-note", text: "先预测，再揭示解析交点、效率/轴功率代理、相似定律和汽蚀边界。流量单位为 m³/h，扬程和 NPSH 单位为 m。" });
      var form = element(doc, "form", { className: "ps-prediction" });
      form.appendChild(predictionQuestion(doc, uid, "相似泵转速比 n=0.8 时，功率尺度约是多少？", "affinity", [
        { value: "cube", label: "0.512，即 0.8³" },
        { value: "square", label: "0.64，即 0.8²" },
        { value: "linear", label: "0.8，即 0.8¹" }
      ]));
      form.appendChild(predictionQuestion(doc, uid, "静态工作点怎样确定？", "intersection", [
        { value: "cross", label: "泵曲线与系统曲线的正流量交点" },
        { value: "shutoff", label: "只看泵的最高关阀扬程" },
        { value: "average", label: "取两条曲线的平均值" }
      ]));
      form.appendChild(predictionQuestion(doc, uid, "NPSHa<NPSHr 时应怎样判定？", "cavitation", [
        { value: "risk", label: "汽蚀边界/风险，不能标为安全" },
        { value: "safe", label: "安全，因为泵仍有扬程" },
        { value: "ignore", label: "只要 Q 正就可以忽略" }
      ]));
      var feedback = element(doc, "p", { className: "ps-feedback", role: "status", "aria-live": "polite", text: "结果尚未揭示。" });
      form.appendChild(element(doc, "div", { className: "ps-actions" }, [
        element(doc, "button", { type: "submit", className: "ps-primary", text: "提交预测并揭示" }),
        element(doc, "button", { type: "button", "data-reset": "true", text: "重置实验" })
      ]));
      form.appendChild(feedback);
      rootNode.appendChild(heading);
      rootNode.appendChild(intro);
      rootNode.appendChild(form);

      var bench = element(doc, "div", { hidden: true });
      var controls = element(doc, "div", { className: "ps-controls" });
      var fields = [
        numberControl(doc, uid, "H0", "泵关阀扬程 H0", DEFAULTS.H0, 0.1, 300, 0.1, "m"),
        numberControl(doc, uid, "k", "泵系数 k", DEFAULTS.k, 0.000001, 1, 0.001, "m/(m³/h)²"),
        numberControl(doc, uid, "Hstatic", "静扬程", DEFAULTS.Hstatic, 0, 300, 0.1, "m"),
        numberControl(doc, uid, "r", "系统系数 r", DEFAULTS.r, 0, 1, 0.001, "m/(m³/h)²"),
        numberControl(doc, uid, "n", "转速比 n", DEFAULTS.n, 0.1, 1.5, 0.01, "额定=1"),
        numberControl(doc, uid, "pSurface", "液面绝对压", DEFAULTS.pSurface, 10, 300, 0.1, "kPa"),
        numberControl(doc, uid, "pVapor", "蒸气压", DEFAULTS.pVapor, 0.1, 100, 0.1, "kPa"),
        numberControl(doc, uid, "zSuction", "吸入液位 z", DEFAULTS.zSuction, -50, 50, 0.1, "m"),
        numberControl(doc, uid, "hSuction", "吸入损失", DEFAULTS.hSuction, 0, 100, 0.1, "m")
      ];
      fields.forEach(function (field) { controls.appendChild(field.node); });
      bench.appendChild(controls);
      var error = element(doc, "p", { className: "ps-error", role: "alert", "aria-live": "polite" });
      bench.appendChild(error);
      var layout = element(doc, "div", { className: "ps-layout" });
      var stage = element(doc, "div", { className: "ps-stage" });
      var svg = svgElement(doc, "svg", {});
      stage.appendChild(svg);
      var ledger = element(doc, "div", { className: "ps-table" });
      layout.appendChild(stage);
      layout.appendChild(ledger);
      bench.appendChild(layout);
      var metrics = element(doc, "div", { className: "ps-metrics" });
      bench.appendChild(metrics);
      bench.appendChild(element(doc, "p", { className: "ps-note", text: "效率和 NPSHr 使用透明教学代理；真实选型需对照厂商曲线、HI 标准、液体温度和实际系统。无正交点会保留为可恢复阻断。" }));
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
          values[field.key] = value;
        });
        return values;
      }

      function render() {
        if (!state.revealed) return;
        try {
          var result = model(uiConfig());
          error.textContent = result.blocked ? "模型阻断：" + result.blockedReason : "";
          drawCurves(doc, svg, result);
          clear(metrics);
          metrics.appendChild(metric(doc, "工作流量", result.feasible ? formatNumber(result.Q, 2) + " m³/h" : "—"));
          metrics.appendChild(metric(doc, "工作扬程", result.feasible ? formatNumber(result.H, 2) + " m" : "—"));
          metrics.appendChild(metric(doc, "轴功率", result.feasible ? formatNumber(result.power / 1000, 3) + " kW" : "—"));
          metrics.appendChild(metric(doc, "NPSH 裕量", result.feasible ? formatNumber(result.npshMargin, 2) + " m" : "—"));
          var rows = [
            ["泵曲线 Hp(Q)", result.feasible ? formatNumber(result.pumpHead(result.Q), 3) : formatNumber(result.config.H0 * result.config.n * result.config.n, 3), "m"],
            ["系统曲线 Hs(Q)", result.feasible ? formatNumber(result.systemHead(result.Q), 3) : formatNumber(result.config.Hstatic, 3), "m"],
            ["解析交点 Q* / H*", result.feasible ? formatNumber(result.Q, 3) + " / " + formatNumber(result.H, 3) : "无正流量交点", result.feasible ? "m³/h / m" : "可恢复阻断"],
            ["效率代理 / 液压功率", result.feasible ? formatNumber(result.efficiency, 4) + " / " + formatNumber(result.hydraulicPower / 1000, 3) : "—", result.feasible ? "无量纲 / kW" : "—"],
            ["NPSHa", formatNumber(result.npsha, 3), "m；绝对压力"],
            ["NPSHr / 裕量", result.feasible ? formatNumber(result.npshr, 3) + " / " + formatNumber(result.npshMargin, 3) : "—", result.feasible ? (result.cavitationRisk ? "汽蚀风险" : "筛查通过") : "等待交点"],
            ["相似定律 Q:H:P", formatNumber(result.affinity.Q, 3) + " : " + formatNumber(result.affinity.H, 3) + " : " + formatNumber(result.affinity.P, 3), "相对额定值；P∝n³"]
          ];
          renderTable(doc, ledger, ["泵系统账本", "读数", "单位/判定"], rows);
          if (result.blocked || result.cavitationRisk) ledger.appendChild(element(doc, "p", { className: "ps-note ps-blocked", text: result.blocked ? "请调整静扬程、系统阻力或转速后恢复正交点。" : "NPSHa 不足以覆盖 NPSHr；按厂商曲线/适用标准和工况确定裕量。" }));
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
          affinity: selected(form, uid + "-affinity"),
          intersection: selected(form, uid + "-intersection"),
          cavitation: selected(form, uid + "-cavitation")
        };
        if (!answers.affinity || !answers.intersection || !answers.cavitation) {
          feedback.textContent = "请先完成三项预测；结果仍然隐藏。";
          return;
        }
        state.revealed = true;
        bench.hidden = false;
        var correct = (answers.affinity === "cube" ? 1 : 0) + (answers.intersection === "cross" ? 1 : 0) + (answers.cavitation === "risk" ? 1 : 0);
        feedback.textContent = "已揭示：" + correct + "/3 命中。现在调参，观察交点、功率和汽蚀边界。";
        render();
        if (api && typeof api.announce === "function") api.announce(rootNode, "泵系统实验已揭示，泵曲线、系统曲线、功率和 NPSH 账本已显示。");
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
        if (api && typeof api.announce === "function") api.announce(rootNode, "泵系统实验已重置，预测结果再次隐藏。");
      });
      if (api && typeof api.announce === "function") api.announce(rootNode, "泵系统实验已加载；先完成三项预测。");
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) { checks += 1; assert(condition, message); }
      check(formatNumber(300, 0) === "300", "integer formatting preserves trailing zeros");
      var result = model(DEFAULTS);
      check(result.feasible && near(result.Q, Math.sqrt(40 / 0.012), 1e-12), "default analytic operating flow");
      check(near(result.pumpHead(result.Q), result.systemHead(result.Q), 1e-10), "pump and system curves intersect");
      check(result.power > result.hydraulicPower && result.efficiency > 0, "efficiency and shaft power ledger");
      check(near(result.affinity.P, 1), "default affinity scale");
      var reducedSpeed = model({ H0: 50, k: 0.008, Hstatic: 10, r: 0.004, n: 0.8, rho: 1000, etaMax: 0.82, etaCurve: 0.00015, QBEP: 50, pSurface: 101.3, pVapor: 2.3, zSuction: 2.5, hSuction: 0.8, NPSHr0: 3, Qref: 50 });
      check(near(reducedSpeed.affinity.P, 0.512, 1e-12), "affinity power cube");
      check(near(reducedSpeed.bepFlow, 0.8 * 50, 1e-12), "BEP flow follows speed ratio");
      check(near(reducedSpeed.npshReferenceFlow, 0.8 * 50, 1e-12), "NPSHr shape reference follows speed ratio");
      check(near(reducedSpeed.efficiency, Math.max(0.35, Math.min(0.9, 0.82 - 0.00015 * (reducedSpeed.Q - 40) * (reducedSpeed.Q - 40))), 1e-12), "scaled BEP efficiency proxy");
      check(near(reducedSpeed.npshr, 3 * 0.8 * 0.8 * (1 + 0.15 * (reducedSpeed.Q / 40) * (reducedSpeed.Q / 40)), 1e-12), "scaled NPSHr shape proxy");
      check(!near(reducedSpeed.power / result.power, reducedSpeed.affinity.P, 1e-3), "system intersection power is not forced to affinity cube");
      var blocked = model({ H0: 50, k: 0.008, Hstatic: 60, r: 0.004, n: 1, rho: 1000, etaMax: 0.82, etaCurve: 0.00015, QBEP: 50, pSurface: 101.3, pVapor: 2.3, zSuction: 2.5, hSuction: 0.8, NPSHr0: 3, Qref: 50 });
      check(blocked.blocked && !blocked.feasible && blocked.Q === null, "no positive intersection is a recoverable block");
      var cavitation = model({ H0: 50, k: 0.008, Hstatic: 10, r: 0.004, n: 1, rho: 1000, etaMax: 0.82, etaCurve: 0.00015, QBEP: 50, pSurface: 20, pVapor: 2.3, zSuction: -5, hSuction: 10, NPSHr0: 3, Qref: 50 });
      check(cavitation.feasible && cavitation.cavitationRisk, "low NPSHa crosses the cavitation boundary");
      var invalidCaught = false;
      try { model({ H0: 50, k: 0, Hstatic: 10, r: 0.004, n: 1 }); } catch (error) { invalidCaught = true; }
      check(invalidCaught, "zero pump coefficient is rejected");
      return { checks: checks };
    }

    return {
      LAB_ID: LAB_ID,
      DEFAULTS: DEFAULTS,
      normalizeConfig: normalizeConfig,
      normalize: normalizeConfig,
      model: model,
      solvePump: model,
      formatNumber: formatNumber,
      mount: mount,
      selfTest: selfTest
    };
  }
);
