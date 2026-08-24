(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("mech-rigid-body-dynamics", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("mech-rigid-body-dynamics self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("mech-rigid-body-dynamics self-test: FAIL\n" + error.stack);
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

    var LAB_ID = "mech-rigid-body-dynamics";
    var STYLE_ID = "cl-mech-rigid-body-dynamics-styles";
    var SVG_NS = "http://www.w3.org/2000/svg";
    var G = 9.81;
    var EPS = 1e-10;
    var INSTANCE = 0;
    var DEFAULTS = {
      mass: 18,
      radius: 0.12,
      beta: 0.5,
      angle: 18,
      distance: 1.5,
      muS: 0.35
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

    function bounded(value, label, low, high) {
      var number = finite(value, label);
      if (number < low || number > high) throw new RangeError(label + " must be in [" + low + ", " + high + "]");
      return number;
    }

    function normalizeConfig(input) {
      var source = input || {};
      return {
        mass: bounded(source.mass === undefined ? DEFAULTS.mass : source.mass, "mass", 0.1, 1000),
        radius: bounded(source.radius === undefined ? DEFAULTS.radius : source.radius, "radius", 0.01, 2),
        beta: bounded(source.beta === undefined ? DEFAULTS.beta : source.beta, "beta", 0.05, 2),
        angle: bounded(source.angle === undefined ? DEFAULTS.angle : source.angle, "angle", 1, 45),
        distance: bounded(source.distance === undefined ? DEFAULTS.distance : source.distance, "distance", 0.01, 100),
        muS: bounded(source.muS === undefined ? DEFAULTS.muS : source.muS, "muS", 0, 2)
      };
    }

    function solveRolling(input) {
      var config = normalizeConfig(input);
      var theta = config.angle * Math.PI / 180;
      var inertia = config.beta * config.mass * config.radius * config.radius;
      var acceleration = G * Math.sin(theta) / (1 + config.beta);
      var angularAcceleration = acceleration / config.radius;
      var friction = config.beta / (1 + config.beta) * config.mass * G * Math.sin(theta);
      var normal = config.mass * G * Math.cos(theta);
      var requiredMu = friction / normal;
      var velocity = Math.sqrt(2 * acceleration * config.distance);
      var angularVelocity = velocity / config.radius;
      var potential = config.mass * G * config.distance * Math.sin(theta);
      var translationalEnergy = 0.5 * config.mass * velocity * velocity;
      var rotationalEnergy = 0.5 * inertia * angularVelocity * angularVelocity;
      var translationResidual = config.mass * acceleration - (config.mass * G * Math.sin(theta) - friction);
      var rotationResidual = inertia * angularAcceleration - friction * config.radius;
      var rollingResidual = velocity - config.radius * angularVelocity;
      var energyResidual = potential - translationalEnergy - rotationalEnergy;
      var frictionFeasible = config.muS + EPS >= requiredMu;
      return {
        config: config,
        theta: theta,
        inertia: inertia,
        acceleration: acceleration,
        angularAcceleration: angularAcceleration,
        friction: friction,
        normal: normal,
        requiredMu: requiredMu,
        frictionFeasible: frictionFeasible,
        velocity: velocity,
        angularVelocity: angularVelocity,
        potential: potential,
        translationalEnergy: translationalEnergy,
        rotationalEnergy: rotationalEnergy,
        totalKineticEnergy: translationalEnergy + rotationalEnergy,
        translationResidual: translationResidual,
        rotationResidual: rotationResidual,
        rollingResidual: rollingResidual,
        energyResidual: energyResidual,
        status: frictionFeasible ? "rolling-feasible" : "rolling-infeasible"
      };
    }

    function formatNumber(value, digits) {
      if (!isFinite(value)) return "—";
      var places = digits === undefined ? 3 : digits;
      if (places === 0) return value.toFixed(0);
      if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 5));
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

    function svgElement(doc, tag, attrs) {
      var node = doc.createElementNS(SVG_NS, tag);
      Object.keys(attrs || {}).forEach(function (key) {
        if (attrs[key] !== undefined && attrs[key] !== null) node.setAttribute(key, String(attrs[key]));
      });
      return node;
    }

    function svgText(doc, parent, text, x, y, className) {
      var node = svgElement(doc, "text", { x: x, y: y, "class": className || "mrd-label" });
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
      var head = 9;
      parent.appendChild(svgElement(doc, "line", { x1: x1, y1: y1, x2: x2, y2: y2, "class": className }));
      parent.appendChild(svgElement(doc, "polygon", {
        points: [x2, y2, x2 - head * ux + 4 * px, y2 - head * uy + 4 * py, x2 - head * ux - 4 * px, y2 - head * uy - 4 * py].join(" "),
        "class": className
      }));
      if (label) svgText(doc, parent, label, labelX === undefined ? x2 + 6 : labelX, labelY === undefined ? y2 : labelY, "mrd-label " + className);
    }

    function drawWheel(doc, svg, result) {
      clear(svg);
      var width = 720;
      var height = 370;
      var contactX = 385;
      var contactY = 260;
      var wheelRadius = 42;
      var centerX = contactX - wheelRadius * Math.sin(result.theta);
      var centerY = contactY - wheelRadius * Math.cos(result.theta);
      var slopeX1 = 105;
      var slopeY1 = 330;
      var slopeX2 = 650;
      var slopeY2 = 120;
      var tangentX = Math.cos(result.theta);
      var tangentY = -Math.sin(result.theta);
      var normalX = Math.sin(result.theta);
      var normalY = Math.cos(result.theta);
      svg.setAttribute("viewBox", "0 0 " + width + " " + height);
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", "斜坡上的滚动刚体自由体图，显示重力、法向力与静摩擦");
      svg.appendChild(svgElement(doc, "line", { x1: slopeX1, y1: slopeY1, x2: slopeX2, y2: slopeY2, "class": "mrd-slope" }));
      svg.appendChild(svgElement(doc, "circle", { cx: centerX, cy: centerY, r: wheelRadius, "class": "mrd-wheel" }));
      svg.appendChild(svgElement(doc, "line", { x1: centerX, y1: centerY, x2: centerX + 20 * Math.cos(result.theta), y2: centerY - 20 * Math.sin(result.theta), "class": "mrd-radius" }));
      svg.appendChild(svgElement(doc, "circle", { cx: centerX, cy: centerY, r: 4, "class": "mrd-hub" }));
      arrow(doc, svg, centerX, centerY, centerX, centerY + 70, "mrd-gravity", "mg", centerX + 8, centerY + 44);
      arrow(doc, svg, contactX, contactY, contactX + normalX * 58, contactY - normalY * 58, "mrd-normal", "N", contactX + normalX * 62, contactY - normalY * 62);
      arrow(doc, svg, contactX, contactY, contactX - tangentX * 68, contactY - tangentY * 68, "mrd-friction", "f（上坡）", contactX - tangentX * 96, contactY - tangentY * 83);
      arrow(doc, svg, centerX - tangentX * 35, centerY - tangentY * 35, centerX + tangentX * 35, centerY + tangentY * 35, "mrd-motion", "a", centerX + tangentX * 45, centerY + tangentY * 45);
      svgText(doc, svg, "θ=" + formatNumber(result.config.angle, 2) + "°", 118, 310, "mrd-muted");
      svgText(doc, svg, "β=I/(mR²)=" + formatNumber(result.config.beta, 3), 485, 65, "mrd-muted");
      svgText(doc, svg, result.frictionFeasible ? "静摩擦可行：无滑候选成立" : "静摩擦不足：无滑候选失效", 210, 40, result.frictionFeasible ? "mrd-ok-text" : "mrd-warning-text");
      svgText(doc, svg, "v=Rω", 412, 310, "mrd-muted");
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
        '[data-learning-lab="' + LAB_ID + '"]{--mrd-blue:#245a9b;--mrd-green:#2d7a4b;--mrd-orange:#ad6811;--mrd-red:#b23a32;display:block;max-width:100%;min-width:0;line-height:1.55;overflow-wrap:anywhere}',
        '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}',
        '[data-learning-lab="' + LAB_ID + '"] h3{margin:0;font-size:1.16rem;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] .mrd-note,[data-learning-lab="' + LAB_ID + '"] .mrd-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
        '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:700;line-height:1.5}',
        '[data-learning-lab="' + LAB_ID + '"] .mrd-options{display:grid;gap:5px}[data-learning-lab="' + LAB_ID + '"] .mrd-options label{display:flex;gap:8px;align-items:flex-start;min-height:44px;padding:7px 0;cursor:pointer}[data-learning-lab="' + LAB_ID + '"] .mrd-options input{flex:0 0 auto;margin-top:5px;accent-color:var(--mrd-blue)}',
        '[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{min-height:44px;font:inherit;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] input[type=number]{width:100%;padding:7px 9px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);color:inherit}',
        '[data-learning-lab="' + LAB_ID + '"] button{padding:8px 12px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);color:inherit;cursor:pointer}[data-learning-lab="' + LAB_ID + '"] button:hover,[data-learning-lab="' + LAB_ID + '"] button:focus-visible{border-color:var(--mrd-blue)}[data-learning-lab="' + LAB_ID + '"] .mrd-primary{background:var(--mrd-blue);border-color:var(--mrd-blue);color:#fff}',
        '[data-learning-lab="' + LAB_ID + '"] .mrd-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + LAB_ID + '"] .mrd-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mrd-error{min-height:1.6em;color:var(--mrd-red);font-weight:700}',
        '[data-learning-lab="' + LAB_ID + '"] .mrd-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px;margin:14px 0}[data-learning-lab="' + LAB_ID + '"] .mrd-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .mrd-control label{font-size:13px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mrd-control small{font-size:11px;color:var(--fg-soft,currentColor)}',
        '[data-learning-lab="' + LAB_ID + '"] .mrd-layout{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(260px,.75fr);gap:15px;align-items:start;min-width:0}[data-learning-lab="' + LAB_ID + '"] .mrd-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:7px;overflow:hidden;background:var(--bg,Canvas)}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="' + LAB_ID + '"] svg text{font-family:inherit;letter-spacing:0;fill:currentColor;font-size:12px}',
        '[data-learning-lab="' + LAB_ID + '"] .mrd-slope{stroke:currentColor;stroke-width:8;stroke-linecap:round}[data-learning-lab="' + LAB_ID + '"] .mrd-wheel{fill:var(--bg,Canvas);stroke:var(--mrd-blue);stroke-width:4}[data-learning-lab="' + LAB_ID + '"] .mrd-hub{fill:var(--mrd-blue)}[data-learning-lab="' + LAB_ID + '"] .mrd-radius{stroke:var(--mrd-blue);stroke-width:2}[data-learning-lab="' + LAB_ID + '"] .mrd-gravity{stroke:var(--mrd-red);fill:var(--mrd-red);stroke-width:2}[data-learning-lab="' + LAB_ID + '"] .mrd-normal{stroke:var(--mrd-green);fill:var(--mrd-green);stroke-width:2}[data-learning-lab="' + LAB_ID + '"] .mrd-friction{stroke:var(--mrd-orange);fill:var(--mrd-orange);stroke-width:2}[data-learning-lab="' + LAB_ID + '"] .mrd-motion{stroke:var(--mrd-blue);fill:var(--mrd-blue);stroke-width:2}[data-learning-lab="' + LAB_ID + '"] .mrd-muted{fill:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mrd-ok-text{fill:var(--mrd-green);font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mrd-warning-text{fill:var(--mrd-red);font-weight:700}',
        '[data-learning-lab="' + LAB_ID + '"] .mrd-table-wrap{min-width:0;max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:430px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}',
        '[data-learning-lab="' + LAB_ID + '"] .mrd-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + LAB_ID + '"] .mrd-metric{min-width:0;padding:9px;border-top:3px solid var(--mrd-blue);background:var(--bg,Canvas)}[data-learning-lab="' + LAB_ID + '"] .mrd-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mrd-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
        'html[data-theme="dark"] [data-learning-lab="' + LAB_ID + '"]{--mrd-blue:#83b3ff;--mrd-green:#83d39c;--mrd-orange:#f2bb62;--mrd-red:#ff9b91}',
        '@media(max-width:850px){[data-learning-lab="' + LAB_ID + '"] .mrd-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:650px){[data-learning-lab="' + LAB_ID + '"] .mrd-controls{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="' + LAB_ID + '"] .mrd-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:400px){[data-learning-lab="' + LAB_ID + '"] .mrd-controls{grid-template-columns:minmax(0,1fr)}[data-learning-lab="' + LAB_ID + '"] .mrd-metrics{grid-template-columns:minmax(0,1fr)}[data-learning-lab="' + LAB_ID + '"] .mrd-actions>*{width:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important}}'
      ].join("");
      (doc.head || doc.documentElement).appendChild(style);
    }

    function question(doc, uid, name, text, choices) {
      var fieldset = element(doc, "fieldset", {}, [element(doc, "legend", { text: text })]);
      var options = element(doc, "div", { className: "mrd-options" });
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
      return {
        key: key,
        input: input,
        node: element(doc, "div", { className: "mrd-control" }, [
          element(doc, "label", { htmlFor: id, text: label }),
          input,
          element(doc, "small", { text: unit })
        ])
      };
    }

    function metric(doc, label, value) {
      return element(doc, "div", { className: "mrd-metric" }, [
        element(doc, "span", { text: label }),
        element(doc, "strong", { text: value })
      ]);
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
      root.appendChild(element(doc, "h3", { id: uid + "-heading", text: "斜坡滚动刚体：Newton–Euler 与能量双账" }));
      root.appendChild(element(doc, "p", {
        className: "mrd-note",
        text: "先完成三项预测。揭示后可改变轮体、坡道和摩擦参数；无滑候选解会同时接受力矩、滚动约束、能量和平衡检查。"
      }));

      var form = element(doc, "form", { className: "mrd-prediction" });
      form.appendChild(question(doc, uid, "beta", "增大惯量比 β 时，滚下坡道的加速度如何变化？", [
        { value: "down", label: "变小，更多重力功进入转动动能" },
        { value: "up", label: "变大，转动惯量会帮助平动" },
        { value: "same", label: "不变，只由坡角决定" }
      ]));
      form.appendChild(question(doc, uid, "friction", "无滑向下滚动时，静摩擦方向与净功是？", [
        { value: "up-zero", label: "沿坡向上；理想无滑接触点不做净功" },
        { value: "down-positive", label: "沿坡向下；摩擦做正功推动轮子" },
        { value: "none", label: "没有摩擦力，轮子仍会无滑滚动" }
      ]));
      form.appendChild(question(doc, uid, "feasibility", "静摩擦可行性应检查哪一个条件？", [
        { value: "required", label: "μs ≥ β tanθ/(1+β)" },
        { value: "slope", label: "μs ≥ tanθ" },
        { value: "force", label: "只要 μs>0 就可以" }
      ]));
      var feedback = element(doc, "p", { className: "mrd-feedback", role: "status", "aria-live": "polite", text: "结果尚未揭示。" });
      form.appendChild(element(doc, "div", { className: "mrd-actions" }, [
        element(doc, "button", { type: "submit", className: "mrd-primary", text: "提交预测并揭示" }),
        element(doc, "button", { type: "button", "data-reset": "true", text: "重置实验" })
      ]));
      form.appendChild(feedback);
      root.appendChild(form);

      var bench = element(doc, "div", { hidden: true });
      var fields = [
        inputControl(doc, uid, "mass", "质量 m", DEFAULTS.mass, 0.1, 1000, 0.1, "kg"),
        inputControl(doc, uid, "radius", "半径 R", DEFAULTS.radius, 0.01, 2, 0.01, "m"),
        inputControl(doc, uid, "beta", "惯量比 β", DEFAULTS.beta, 0.05, 2, 0.01, "I/(mR²)"),
        inputControl(doc, uid, "angle", "坡角 θ", DEFAULTS.angle, 1, 45, 0.5, "deg"),
        inputControl(doc, uid, "distance", "滚动距离 s", DEFAULTS.distance, 0.01, 100, 0.01, "m"),
        inputControl(doc, uid, "muS", "静摩擦系数 μs", DEFAULTS.muS, 0, 2, 0.01, "无量纲")
      ];
      var controls = element(doc, "div", { className: "mrd-controls" });
      fields.forEach(function (field) { controls.appendChild(field.node); });
      bench.appendChild(controls);
      var error = element(doc, "p", { className: "mrd-error", role: "alert", "aria-live": "polite" });
      bench.appendChild(error);
      var layout = element(doc, "div", { className: "mrd-layout" });
      var stage = element(doc, "div", { className: "mrd-stage" });
      var svg = svgElement(doc, "svg", {});
      stage.appendChild(svg);
      var ledger = element(doc, "div", { className: "mrd-table-wrap" });
      layout.appendChild(stage);
      layout.appendChild(ledger);
      bench.appendChild(layout);
      var metrics = element(doc, "div", { className: "mrd-metrics" });
      bench.appendChild(metrics);
      var note = element(doc, "p", { className: "mrd-note", role: "status", "aria-live": "polite" });
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
        return values;
      }

      function render() {
        if (!state.revealed) return;
        try {
          var result = solveRolling(uiConfig());
          error.textContent = "";
          drawWheel(doc, svg, result);
          clear(metrics);
          metrics.appendChild(metric(doc, "加速度 a", formatNumber(result.acceleration, 4) + " m/s²"));
          metrics.appendChild(metric(doc, "末速度 v", formatNumber(result.velocity, 4) + " m/s"));
          metrics.appendChild(metric(doc, "μreq", formatNumber(result.requiredMu, 4)));
          metrics.appendChild(metric(doc, "静摩擦", result.frictionFeasible ? "可行" : "不足"));
          renderTable(doc, ledger, ["账本项", "公式/读数", "单位或判定"], [
            ["转动惯量 I", "βmR² = " + formatNumber(result.inertia, 6), "kg·m²"],
            ["平动", "a = g sinθ/(1+β) = " + formatNumber(result.acceleration, 6), "m/s²；沿坡向下"],
            ["转动", "α = a/R = " + formatNumber(result.angularAcceleration, 6), "rad/s²"],
            ["静摩擦 f", "βmg sinθ/(1+β) = " + formatNumber(result.friction, 5), "N；沿坡向上"],
            ["法向力 N", "mg cosθ = " + formatNumber(result.normal, 5), "N"],
            ["可行性", "μs / μreq = " + formatNumber(result.config.muS, 4) + " / " + formatNumber(result.requiredMu, 4), result.frictionFeasible ? "无滑可行" : "无滑候选失效"],
            ["末状态", "v, ω = " + formatNumber(result.velocity, 5) + ", " + formatNumber(result.angularVelocity, 5), "m/s，rad/s"],
            ["势能", "mg s sinθ = " + formatNumber(result.potential, 6), "J"],
            ["动能双账", "T平 + T转 = " + formatNumber(result.translationalEnergy, 6) + " + " + formatNumber(result.rotationalEnergy, 6), "J"],
            ["Newton–Euler", "Rt=" + formatNumber(result.translationResidual, 8) + "；Rr=" + formatNumber(result.rotationResidual, 8), "N，N·m"],
            ["约束/能量", "Rc=" + formatNumber(result.rollingResidual, 8) + "；RE=" + formatNumber(result.energyResidual, 8), "m/s，J"]
          ]);
          note.textContent = result.frictionFeasible
            ? "力、力矩、滚动约束和势能—动能双账均闭合；静摩擦只用到上限检查，没有被误当成固定值。"
            : "Newton–Euler 与能量给出的是无滑候选解，但 μs<μreq；实际运动会滑动，需切换接触模型。";
        } catch (validationError) {
          error.textContent = "输入校验：" + validationError.message;
          clear(metrics);
          clear(ledger);
          clear(svg);
          note.textContent = "";
        }
      }

      fields.forEach(function (field) {
        field.input.addEventListener("input", render);
        field.input.addEventListener("change", render);
      });
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var answers = {
          beta: selected(form, uid + "-beta"),
          friction: selected(form, uid + "-friction"),
          feasibility: selected(form, uid + "-feasibility")
        };
        if (!answers.beta || !answers.friction || !answers.feasibility) {
          feedback.textContent = "请先完成三项预测；结果仍然隐藏。";
          return;
        }
        state.revealed = true;
        bench.hidden = false;
        var correct = (answers.beta === "down" ? 1 : 0) + (answers.friction === "up-zero" ? 1 : 0) + (answers.feasibility === "required" ? 1 : 0);
        feedback.textContent = "已揭示：" + correct + "/3 命中。现在改变惯量比或摩擦并检查可行性。";
        render();
        if (api && typeof api.announce === "function") api.announce(root, "刚体动力学实验已揭示，Newton–Euler 与能量账本已显示。");
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
        note.textContent = "";
        if (api && typeof api.announce === "function") api.announce(root, "刚体动力学实验已重置，预测结果再次隐藏。");
      });
      if (api && typeof api.announce === "function") api.announce(root, "刚体动力学实验已加载；先完成三项预测。");
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) { checks += 1; assert(condition, message); }
      var result = solveRolling(DEFAULTS);
      check(result.frictionFeasible, "default static friction is feasible");
      check(near(result.translationResidual, 0) && near(result.rotationResidual, 0), "Newton-Euler ledger closes");
      check(near(result.rollingResidual, 0), "rolling constraint closes");
      check(near(result.potential, result.totalKineticEnergy, 1e-10), "potential energy equals translational plus rotational kinetic energy");
      check(result.friction > 0 && result.requiredMu < DEFAULTS.muS, "friction direction and margin are physical");
      var ring = solveRolling({ mass: DEFAULTS.mass, radius: DEFAULTS.radius, beta: 1, angle: DEFAULTS.angle, distance: DEFAULTS.distance, muS: DEFAULTS.muS });
      check(ring.acceleration < result.acceleration, "larger inertia ratio lowers rolling acceleration");
      var slip = solveRolling({ mass: DEFAULTS.mass, radius: DEFAULTS.radius, beta: DEFAULTS.beta, angle: 40, distance: DEFAULTS.distance, muS: 0.05 });
      check(!slip.frictionFeasible && slip.status === "rolling-infeasible", "insufficient static friction is reported as a model boundary");
      var invalidCaught = false;
      try { solveRolling({ mass: DEFAULTS.mass, radius: DEFAULTS.radius, beta: DEFAULTS.beta, angle: 0, distance: DEFAULTS.distance, muS: DEFAULTS.muS }); } catch (error) { invalidCaught = true; }
      check(invalidCaught, "zero slope is outside the bounded experiment");
      check(formatNumber(1350, 0) === "1350" && formatNumber(60, 0) === "60", "zero-decimal formatter preserves integer zeros");
      return { checks: checks };
    }

    return {
      DEFAULTS: DEFAULTS,
      normalizeConfig: normalizeConfig,
      solveRolling: solveRolling,
      formatNumber: formatNumber,
      mount: mount,
      selfTest: selfTest
    };
  }
);
