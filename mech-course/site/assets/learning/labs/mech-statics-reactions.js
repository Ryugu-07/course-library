(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("mech-statics-reactions", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("mech-statics-reactions self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("mech-statics-reactions self-test: FAIL\n" + error.stack);
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

    var LAB_ID = "mech-statics-reactions";
    var STYLE_ID = "cl-mech-statics-reactions-styles";
    var SVG_NS = "http://www.w3.org/2000/svg";
    var EPS = 1e-9;
    var INSTANCE = 0;
    var DEFAULTS = {
      L: 4,
      aRatio: 0.35,
      P: 12000,
      H: 2000
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
        L: positive(source.L === undefined ? DEFAULTS.L : source.L, "L"),
        aRatio: finite(source.aRatio === undefined ? DEFAULTS.aRatio : source.aRatio, "a/L"),
        P: finite(source.P === undefined ? DEFAULTS.P : source.P, "P"),
        H: finite(source.H === undefined ? DEFAULTS.H : source.H, "H")
      };
      if (config.aRatio < -0.25 || config.aRatio > 1.25) {
        throw new RangeError("a/L must be in [-0.25, 1.25] for the boundary experiment");
      }
      return config;
    }

    function solveReactions(input) {
      var config = normalizeConfig(input);
      var a = config.aRatio * config.L;
      var Ax = -config.H;
      var By = config.P * config.aRatio;
      var Ay = config.P - By;
      var residuals = {
        Fx: Ax + config.H,
        Fy: Ay + By - config.P,
        MA: By * config.L - config.P * a
      };
      var locationValid = config.aRatio >= -EPS && config.aRatio <= 1 + EPS;
      var contactValid = By >= -EPS;
      var contactState = By < -EPS ? "loss-of-contact" : Math.abs(By) <= EPS ? "neutral" : "engaged";
      var status = "valid";
      if (!locationValid) status = "invalid-load-location";
      else if (!contactValid) status = "loss-of-contact";
      return {
        config: config,
        a: a,
        reactions: { Ax: Ax, Ay: Ay, By: By },
        residuals: residuals,
        locationValid: locationValid,
        contactValid: contactValid,
        contactState: contactState,
        status: status,
        valid: locationValid && contactValid
      };
    }

    function formatNumber(value, digits) {
      if (!isFinite(value)) return "—";
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
      var node = svgElement(doc, "text", { x: x, y: y, "class": className || "msr-label" });
      node.textContent = text;
      parent.appendChild(node);
    }

    function arrow(doc, parent, x1, y1, x2, y2, className, label, labelX, labelY) {
      var dx = x2 - x1;
      var dy = y2 - y1;
      var length = Math.sqrt(dx * dx + dy * dy) || 1;
      var ux = dx / length;
      var uy = dy / length;
      var px = -uy;
      var py = ux;
      var head = 8;
      parent.appendChild(svgElement(doc, "line", { x1: x1, y1: y1, x2: x2, y2: y2, "class": className }));
      parent.appendChild(svgElement(doc, "polygon", {
        points: [x2, y2, x2 - head * ux + 4 * px, y2 - head * uy + 4 * py, x2 - head * ux - 4 * px, y2 - head * uy - 4 * py].join(" "),
        "class": className
      }));
      if (label) svgText(doc, parent, label, labelX === undefined ? x2 + 6 : labelX, labelY === undefined ? y2 : labelY, "msr-label " + className);
    }

    function drawFreeBody(doc, svg, result) {
      clear(svg);
      var width = 720;
      var height = 360;
      var x0 = 100;
      var x1 = 620;
      var beamY = 190;
      var loadRatio = Math.max(-0.25, Math.min(1.25, result.config.aRatio));
      var loadX = x0 + (x1 - x0) * loadRatio;
      var reactionScale = 45 / Math.max(Math.abs(result.config.P), Math.abs(result.config.H), Math.abs(result.reactions.Ax), Math.abs(result.reactions.Ay), Math.abs(result.reactions.By), 1);
      svg.setAttribute("viewBox", "0 0 " + width + " " + height);
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", "销轴 A 与滚轮 B 的简支叉臂自由体图，显示外载、反力与接触状态");
      svg.appendChild(svgElement(doc, "line", { x1: x0, y1: beamY, x2: x1, y2: beamY, "class": "msr-beam" }));
      svg.appendChild(svgElement(doc, "polygon", { points: (x0 - 17) + ",220 " + (x0 + 17) + ",220 " + x0 + ",194", "class": "msr-support" }));
      svg.appendChild(svgElement(doc, "line", { x1: x0 - 26, y1: 222, x2: x0 + 26, y2: 222, "class": "msr-ground" }));
      svg.appendChild(svgElement(doc, "polygon", { points: (x1 - 17) + ",220 " + (x1 + 17) + ",220 " + x1 + ",194", "class": "msr-support" }));
      svg.appendChild(svgElement(doc, "circle", { cx: x1 - 9, cy: 229, r: 7, "class": result.contactValid ? "msr-roller" : "msr-roller msr-invalid" }));
      svg.appendChild(svgElement(doc, "circle", { cx: x1 + 9, cy: 229, r: 7, "class": result.contactValid ? "msr-roller" : "msr-roller msr-invalid" }));
      svg.appendChild(svgElement(doc, "line", { x1: x1 - 26, y1: 242, x2: x1 + 26, y2: 242, "class": "msr-ground" }));
      svgText(doc, svg, "A 销轴", x0 - 22, 270, "msr-muted");
      svgText(doc, svg, "B 滚轮", x1 - 25, 270, result.contactValid ? "msr-muted" : "msr-invalid-text");
      var pEnd = beamY + (result.config.P >= 0 ? 58 : -58);
      arrow(doc, svg, loadX, beamY - (result.config.P >= 0 ? 74 : -74), loadX, pEnd, result.config.P >= 0 ? "msr-load" : "msr-warning", "P=" + formatNumber(Math.abs(result.config.P) / 1000, 2) + " kN", loadX + 7, result.config.P >= 0 ? pEnd + 20 : pEnd - 12);
      var hStart = loadX - (result.config.H >= 0 ? 65 : -65);
      arrow(doc, svg, hStart, beamY - 18, loadX, beamY - 18, result.config.H >= 0 ? "msr-load" : "msr-warning", "H=" + formatNumber(Math.abs(result.config.H) / 1000, 2) + " kN", hStart, beamY - 30);
      var ayEnd = beamY - result.reactions.Ay * reactionScale;
      arrow(doc, svg, x0, beamY, x0, ayEnd, result.reactions.Ay >= -EPS ? "msr-reaction" : "msr-warning", "Ay", x0 - 33, ayEnd - 5);
      var byEnd = beamY - result.reactions.By * reactionScale;
      arrow(doc, svg, x1, beamY, x1, byEnd, result.reactions.By >= -EPS ? "msr-reaction" : "msr-warning", "By", x1 + 8, byEnd - 5);
      var axEnd = x0 + result.reactions.Ax * reactionScale;
      arrow(doc, svg, x0, beamY + 28, axEnd, beamY + 28, result.reactions.Ax >= -EPS ? "msr-reaction" : "msr-warning", "Ax", Math.min(x0, axEnd) - 8, beamY + 48);
      svg.appendChild(svgElement(doc, "line", { x1: x0, y1: 310, x2: x1, y2: 310, "class": "msr-dimension" }));
      svgText(doc, svg, "L=" + formatNumber(result.config.L, 2) + " m", (x0 + x1) / 2 - 30, 333, "msr-muted");
      svgText(doc, svg, "a/L=" + formatNumber(result.config.aRatio, 3), loadX - 22, 303, result.locationValid ? "msr-muted" : "msr-invalid-text");
      if (!result.locationValid) svgText(doc, svg, "载荷位置超出简支跨模型", 240, 35, "msr-invalid-text");
      if (!result.contactValid) svgText(doc, svg, "By<0：滚轮应抬离，原 FBD 失效", 214, 58, "msr-invalid-text");
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
        '[data-learning-lab="' + LAB_ID + '"]{--msr-blue:#245a9b;--msr-green:#2d7a4b;--msr-orange:#ad6811;--msr-red:#b23a32;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
        '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}',
        '[data-learning-lab="' + LAB_ID + '"] h3,[data-learning-lab="' + LAB_ID + '"] h4{margin:0;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] h3{font-size:1.16rem}[data-learning-lab="' + LAB_ID + '"] h4{margin-top:16px;font-size:1rem}',
        '[data-learning-lab="' + LAB_ID + '"] .msr-note,[data-learning-lab="' + LAB_ID + '"] .msr-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
        '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:700;line-height:1.5}',
        '[data-learning-lab="' + LAB_ID + '"] .msr-options{display:grid;gap:5px}[data-learning-lab="' + LAB_ID + '"] .msr-options label{display:flex;gap:8px;align-items:flex-start;min-height:44px;padding:7px 0;cursor:pointer}[data-learning-lab="' + LAB_ID + '"] .msr-options input{flex:0 0 auto;margin-top:5px;accent-color:var(--msr-blue)}',
        '[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{min-height:44px;font:inherit;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] input[type=number]{width:100%;padding:7px 9px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);color:inherit}',
        '[data-learning-lab="' + LAB_ID + '"] button{padding:8px 12px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);color:inherit;cursor:pointer}[data-learning-lab="' + LAB_ID + '"] button:hover,[data-learning-lab="' + LAB_ID + '"] button:focus-visible{border-color:var(--msr-blue)}[data-learning-lab="' + LAB_ID + '"] .msr-primary{background:var(--msr-blue);border-color:var(--msr-blue);color:#fff}',
        '[data-learning-lab="' + LAB_ID + '"] .msr-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + LAB_ID + '"] .msr-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="' + LAB_ID + '"] .msr-error{min-height:1.6em;color:var(--msr-red);font-weight:700}',
        '[data-learning-lab="' + LAB_ID + '"] .msr-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px;margin:14px 0}[data-learning-lab="' + LAB_ID + '"] .msr-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .msr-control label{font-size:13px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] .msr-control small{font-size:11px;color:var(--fg-soft,currentColor)}',
        '[data-learning-lab="' + LAB_ID + '"] .msr-layout{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(260px,.75fr);gap:15px;align-items:start;min-width:0}[data-learning-lab="' + LAB_ID + '"] .msr-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:7px;overflow:hidden;background:var(--bg,Canvas)}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="' + LAB_ID + '"] svg text{font-family:inherit;letter-spacing:0;fill:currentColor;font-size:12px}',
        '[data-learning-lab="' + LAB_ID + '"] .msr-beam{stroke:var(--fg,currentColor);stroke-width:7;stroke-linecap:round}[data-learning-lab="' + LAB_ID + '"] .msr-support{fill:var(--bg,Canvas);stroke:currentColor;stroke-width:1.5}[data-learning-lab="' + LAB_ID + '"] .msr-ground,[data-learning-lab="' + LAB_ID + '"] .msr-dimension{stroke:currentColor;stroke-width:1;opacity:.7}[data-learning-lab="' + LAB_ID + '"] .msr-roller{fill:var(--bg,Canvas);stroke:var(--msr-green);stroke-width:2}[data-learning-lab="' + LAB_ID + '"] .msr-load{stroke:var(--msr-orange);fill:var(--msr-orange);stroke-width:2}[data-learning-lab="' + LAB_ID + '"] .msr-reaction{stroke:var(--msr-blue);fill:var(--msr-blue);stroke-width:2}[data-learning-lab="' + LAB_ID + '"] .msr-warning{stroke:var(--msr-red);fill:var(--msr-red);stroke-width:2}[data-learning-lab="' + LAB_ID + '"] .msr-muted{fill:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .msr-invalid-text{fill:var(--msr-red);font-weight:700}',
        '[data-learning-lab="' + LAB_ID + '"] .msr-table-wrap{min-width:0;max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:455px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}',
        '[data-learning-lab="' + LAB_ID + '"] .msr-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + LAB_ID + '"] .msr-metric{min-width:0;padding:9px;border-top:3px solid var(--msr-blue);background:var(--bg,Canvas)}[data-learning-lab="' + LAB_ID + '"] .msr-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .msr-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
        'html[data-theme="dark"] [data-learning-lab="' + LAB_ID + '"]{--msr-blue:#83b3ff;--msr-green:#83d39c;--msr-orange:#f2bb62;--msr-red:#ff9b91}',
        '@media(max-width:850px){[data-learning-lab="' + LAB_ID + '"] .msr-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:650px){[data-learning-lab="' + LAB_ID + '"] .msr-controls{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="' + LAB_ID + '"] .msr-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:400px){[data-learning-lab="' + LAB_ID + '"] .msr-controls{grid-template-columns:minmax(0,1fr)}[data-learning-lab="' + LAB_ID + '"] .msr-metrics{grid-template-columns:minmax(0,1fr)}[data-learning-lab="' + LAB_ID + '"] .msr-actions>*{width:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important}}'
      ].join("");
      (doc.head || doc.documentElement).appendChild(style);
    }

    function question(doc, uid, name, text, choices) {
      var fieldset = element(doc, "fieldset", {}, [element(doc, "legend", { text: text })]);
      var options = element(doc, "div", { className: "msr-options" });
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
      return { key: key, input: input, node: element(doc, "div", { className: "msr-control" }, [element(doc, "label", { htmlFor: id, text: label }), input, element(doc, "small", { text: unit })]) };
    }

    function metric(doc, label, value) {
      return element(doc, "div", { className: "msr-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]);
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
      var heading = element(doc, "h3", { id: uid + "-heading", text: "简支叉臂自由体与反力账本" });
      var intro = element(doc, "p", { className: "msr-note", text: "先提交三项预测。揭示后可移动载荷、改变载荷符号，并逐项检查力与力矩残差以及滚轮接触条件。" });
      var form = element(doc, "form", { className: "msr-prediction" });
      form.appendChild(question(doc, uid, "position", "向下载荷从 A 向 B 移动时，By 如何变化？", [
        { value: "up", label: "增大，因为 By=P a/L" },
        { value: "down", label: "减小，因为 A 承担更多力" },
        { value: "same", label: "不变，两个支座平分 P" }
      ]));
      form.appendChild(question(doc, uid, "contact", "若代数解给出 By<0，普通滚轮的接触状态是？", [
        { value: "lift", label: "滚轮抬离；原支撑假设失效" },
        { value: "tension", label: "滚轮照常提供向下拉力" },
        { value: "zero", label: "把 By 改成零且其他反力不变" }
      ]));
      form.appendChild(question(doc, uid, "moment", "按 +x 右、+y 上、逆时针为正，A 点矩残差是哪一个？", [
        { value: "moment", label: "R_M=By L−P a" },
        { value: "force", label: "R_M=Ax+H" },
        { value: "vertical", label: "R_M=Ay+By−P" }
      ]));
      var feedback = element(doc, "p", { className: "msr-feedback", role: "status", "aria-live": "polite", text: "结果尚未揭示。" });
      form.appendChild(element(doc, "div", { className: "msr-actions" }, [
        element(doc, "button", { type: "submit", className: "msr-primary", text: "提交预测并揭示" }),
        element(doc, "button", { type: "button", "data-reset": "true", text: "重置实验" })
      ]));
      form.appendChild(feedback);
      root.appendChild(heading);
      root.appendChild(intro);
      root.appendChild(form);

      var bench = element(doc, "div", { hidden: true });
      var fields = [
        inputControl(doc, uid, "L", "跨长 L", DEFAULTS.L, 0.5, 10, 0.1, "m"),
        inputControl(doc, uid, "aRatio", "载荷位置 a/L", DEFAULTS.aRatio, -0.25, 1.25, 0.01, "无量纲；跨外用于边界实验"),
        inputControl(doc, uid, "P", "竖向载荷 P", DEFAULTS.P / 1000, -30, 30, 0.1, "kN；正值向下"),
        inputControl(doc, uid, "H", "水平载荷 H", DEFAULTS.H / 1000, -20, 20, 0.1, "kN；正值向右")
      ];
      var controls = element(doc, "div", { className: "msr-controls" });
      fields.forEach(function (field) { controls.appendChild(field.node); });
      bench.appendChild(controls);
      var error = element(doc, "p", { className: "msr-error", role: "alert", "aria-live": "polite" });
      bench.appendChild(error);
      var layout = element(doc, "div", { className: "msr-layout" });
      var stage = element(doc, "div", { className: "msr-stage" });
      var svg = svgElement(doc, "svg", {});
      stage.appendChild(svg);
      var ledger = element(doc, "div", { className: "msr-table-wrap" });
      layout.appendChild(stage);
      layout.appendChild(ledger);
      bench.appendChild(layout);
      var metrics = element(doc, "div", { className: "msr-metrics" });
      bench.appendChild(metrics);
      var note = element(doc, "p", { className: "msr-note", role: "status", "aria-live": "polite" });
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
        return { L: values.L, aRatio: values.aRatio, P: values.P * 1000, H: values.H * 1000 };
      }

      function render() {
        if (!state.revealed) return;
        try {
          var result = solveReactions(uiConfig());
          error.textContent = "";
          drawFreeBody(doc, svg, result);
          clear(metrics);
          metrics.appendChild(metric(doc, "Ax", formatNumber(result.reactions.Ax / 1000, 3) + " kN"));
          metrics.appendChild(metric(doc, "Ay", formatNumber(result.reactions.Ay / 1000, 3) + " kN"));
          metrics.appendChild(metric(doc, "By", formatNumber(result.reactions.By / 1000, 3) + " kN"));
          metrics.appendChild(metric(doc, "接触", result.contactValid ? "保持" : "抬离"));
          renderTable(doc, ledger, ["账本项", "代数式/读数", "单位或判定"], [
            ["R_x", "Ax + H = " + formatNumber(result.residuals.Fx, 7), "N"],
            ["R_y", "Ay + By − P = " + formatNumber(result.residuals.Fy, 7), "N"],
            ["R_M", "By L − P a = " + formatNumber(result.residuals.MA, 7), "N m"],
            ["载荷位置", "a = " + formatNumber(result.a, 3), "m；" + (result.locationValid ? "跨内" : "跨外，模型无效")],
            ["滚轮约束", "By = " + formatNumber(result.reactions.By, 3), "N；" + (result.contactValid ? "接触可行" : "需要向下拉力，抬离")]
          ]);
          if (result.status === "valid") note.textContent = "三个残差均在浮点容差内为零，且载荷在跨内、滚轮接触可行。";
          else if (result.status === "loss-of-contact") note.textContent = "残差仍可为零，但 By<0 要求滚轮受拉；请把它视为接触丢失的边界，不要继续使用原 FBD。";
          else note.textContent = "这是平衡方程的代数外推；载荷不在简支跨内，实际结构需要新的边界和自由体图。";
        } catch (validationError) {
          error.textContent = "输入校验：" + validationError.message;
          clear(metrics); clear(ledger); clear(svg); note.textContent = "";
        }
      }

      fields.forEach(function (field) {
        field.input.addEventListener("input", render);
        field.input.addEventListener("change", render);
      });
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var answers = {
          position: selected(form, uid + "-position"),
          contact: selected(form, uid + "-contact"),
          moment: selected(form, uid + "-moment")
        };
        if (!answers.position || !answers.contact || !answers.moment) {
          feedback.textContent = "请先完成三项预测；结果仍然隐藏。";
          return;
        }
        state.revealed = true;
        bench.hidden = false;
        var correct = (answers.position === "up" ? 1 : 0) + (answers.contact === "lift" ? 1 : 0) + (answers.moment === "moment" ? 1 : 0);
        feedback.textContent = "已揭示：" + correct + "/3 命中。现在移动载荷并读残差账本。";
        render();
        if (api && typeof api.announce === "function") api.announce(root, "静力学预测已揭示，反力与残差账本已显示。");
      });
      form.querySelector('[data-reset="true"]').addEventListener("click", function () {
        form.reset();
        state.revealed = false;
        bench.hidden = true;
        feedback.textContent = "结果尚未揭示。";
        fields.forEach(function (field) {
          field.input.value = field.key === "P" ? DEFAULTS.P / 1000 : field.key === "H" ? DEFAULTS.H / 1000 : DEFAULTS[field.key];
        });
        error.textContent = "";
        clear(metrics); clear(ledger); clear(svg); note.textContent = "";
        if (api && typeof api.announce === "function") api.announce(root, "静力学实验已重置，预测结果再次隐藏。");
      });
      if (api && typeof api.announce === "function") api.announce(root, "静力学实验已加载；先完成三项预测。");
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) { checks += 1; assert(condition, message); }
      var result = solveReactions(DEFAULTS);
      check(near(result.reactions.Ax, -DEFAULTS.H), "horizontal pin reaction balances H");
      check(near(result.reactions.By, DEFAULTS.P * DEFAULTS.aRatio), "roller reaction follows moment balance");
      check(near(result.reactions.Ay + result.reactions.By, DEFAULTS.P), "vertical force balance");
      check(near(result.residuals.Fx, 0) && near(result.residuals.Fy, 0) && near(result.residuals.MA, 0), "default residual ledger closes");
      check(result.locationValid && result.contactValid && result.valid, "default support assumptions are valid");
      var moved = solveReactions({ L: 4, aRatio: 0.8, P: 12000, H: 0 });
      check(moved.reactions.By > result.reactions.By && moved.reactions.Ay < result.reactions.Ay, "moving load right shifts reaction to B");
      var lifted = solveReactions({ L: 4, aRatio: 0.35, P: -12000, H: 0 });
      check(lifted.reactions.By < 0 && !lifted.contactValid && lifted.status === "loss-of-contact", "upward load detects unilateral contact loss");
      var outside = solveReactions({ L: 4, aRatio: 1.2, P: 12000, H: 0 });
      check(!outside.locationValid && outside.status === "invalid-load-location", "load outside span is rejected as a model boundary");
      var signed = solveReactions({ L: 2, aRatio: 0.5, P: 0, H: -300 });
      check(near(signed.reactions.Ax, 300) && near(signed.residuals.Fx, 0), "signed horizontal load follows convention");
      var invalidCaught = false;
      try { solveReactions({ L: 0, aRatio: 0.5, P: 1, H: 0 }); } catch (error) { invalidCaught = true; }
      check(invalidCaught, "nonpositive span is rejected");
      check(formatNumber(1350, 0) === "1350" && formatNumber(60, 0) === "60", "zero-decimal formatter preserves integer zeros");
      return { checks: checks };
    }

    return {
      DEFAULTS: DEFAULTS,
      normalizeConfig: normalizeConfig,
      solveReactions: solveReactions,
      formatNumber: formatNumber,
      mount: mount,
      selfTest: selfTest
    };
  }
);
