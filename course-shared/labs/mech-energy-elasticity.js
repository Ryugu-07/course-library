(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("mech-energy-elasticity", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("mech-energy-elasticity self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("mech-energy-elasticity self-test: FAIL\n" + error.stack);
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

    var LAB_ID = "mech-energy-elasticity";
    var STYLE_ID = "cl-mech-energy-elasticity-styles";
    var SVG_NS = "http://www.w3.org/2000/svg";
    var EPS = 1e-10;
    var INSTANCE = 0;
    var DEFAULTS = {
      span: 0.8,
      height: 0.6,
      E: 210e9,
      area: 300e-6,
      P: 12000,
      H: 800
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
        span: bounded(source.span === undefined ? DEFAULTS.span : source.span, "span", 0.2, 3),
        height: bounded(source.height === undefined ? DEFAULTS.height : source.height, "height", 0.1, 3),
        E: bounded(source.E === undefined ? DEFAULTS.E : source.E, "E", 1e9, 400e9),
        area: bounded(source.area === undefined ? DEFAULTS.area : source.area, "area", 20e-6, 5e-3),
        P: bounded(source.P === undefined ? DEFAULTS.P : source.P, "P", 100, 100000),
        H: bounded(source.H === undefined ? DEFAULTS.H : source.H, "H", -50000, 50000)
      };
    }

    function solve2(matrix, vector) {
      var determinant = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
      if (!(determinant > EPS)) throw new Error("free-node stiffness is singular or not positive definite");
      return {
        vector: [
          (vector[0] * matrix[1][1] - matrix[0][1] * vector[1]) / determinant,
          (matrix[0][0] * vector[1] - vector[0] * matrix[1][0]) / determinant
        ],
        determinant: determinant
      };
    }

    function dot(left, right) {
      return left[0] * right[0] + left[1] * right[1];
    }

    function addOuter(matrix, scale, vector) {
      matrix[0][0] += scale * vector[0] * vector[0];
      matrix[0][1] += scale * vector[0] * vector[1];
      matrix[1][0] += scale * vector[1] * vector[0];
      matrix[1][1] += scale * vector[1] * vector[1];
    }

    function solveTruss(input) {
      var config = normalizeConfig(input);
      var halfSpan = config.span / 2;
      var memberLength = Math.sqrt(halfSpan * halfSpan + config.height * config.height);
      var directions = [
        [-halfSpan / memberLength, config.height / memberLength],
        [halfSpan / memberLength, config.height / memberLength]
      ];
      var memberStiffness = config.E * config.area / memberLength;
      var stiffness = [[0, 0], [0, 0]];
      directions.forEach(function (direction) {
        addOuter(stiffness, memberStiffness, direction);
      });
      var force = [config.H, -config.P];
      var solution = solve2(stiffness, force);
      var displacement = solution.vector;
      var unitForce = [0, -1];
      var unitSolution = solve2(stiffness, unitForce).vector;
      var members = directions.map(function (direction, index) {
        var extension = dot(direction, displacement);
        var unitExtension = dot(direction, unitSolution);
        var axialForce = memberStiffness * extension;
        var unitAxialForce = memberStiffness * unitExtension;
        return {
          index: index + 1,
          length: memberLength,
          direction: direction,
          stiffness: memberStiffness,
          extension: extension,
          unitExtension: unitExtension,
          axialForce: axialForce,
          unitAxialForce: unitAxialForce,
          energy: 0.5 * memberStiffness * extension * extension
        };
      });
      var projectedMemberForce = members.reduce(function (sum, member) {
        return [sum[0] + member.axialForce * member.direction[0], sum[1] + member.axialForce * member.direction[1]];
      }, [0, 0]);
      var equilibriumResidual = [force[0] - projectedMemberForce[0], force[1] - projectedMemberForce[1]];
      var supportReactions = members.map(function (member) {
        return [-member.axialForce * member.direction[0], -member.axialForce * member.direction[1]];
      });
      var supportReaction = supportReactions.reduce(function (sum, reaction) {
        return [sum[0] + reaction[0], sum[1] + reaction[1]];
      }, [0, 0]);
      var supportResidual = [force[0] + supportReaction[0], force[1] + supportReaction[1]];
      var energy = members.reduce(function (sum, member) { return sum + member.energy; }, 0);
      var externalHalfWork = 0.5 * dot(force, displacement);
      var castigliano = dot(unitForce, displacement);
      var unitVirtualWork = members.reduce(function (sum, member) {
        return sum + member.axialForce * member.unitAxialForce * member.length / (config.E * config.area);
      }, 0);
      var trace = stiffness[0][0] + stiffness[1][1];
      var gap = Math.sqrt(
        (stiffness[0][0] - stiffness[1][1]) * (stiffness[0][0] - stiffness[1][1]) +
        4 * stiffness[0][1] * stiffness[0][1]
      );
      var minimumEigenvalue = (trace - gap) / 2;
      return {
        config: config,
        memberLength: memberLength,
        directions: directions,
        stiffness: stiffness,
        determinant: solution.determinant,
        positiveDefinite: stiffness[0][0] > 0 && solution.determinant > 0,
        minimumEigenvalue: minimumEigenvalue,
        force: force,
        displacement: displacement,
        unitDisplacement: unitSolution,
        members: members,
        energy: energy,
        externalHalfWork: externalHalfWork,
        castigliano: castigliano,
        unitVirtualWork: unitVirtualWork,
        equilibriumResidual: equilibriumResidual,
        supportReactions: supportReactions,
        supportReaction: supportReaction,
        supportResidual: supportResidual,
        equilibriumNorm: Math.sqrt(dot(equilibriumResidual, equilibriumResidual))
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
      var node = svgElement(doc, "text", { x: x, y: y, "class": className || "mee-label" });
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
      if (label) svgText(doc, parent, label, labelX === undefined ? x2 + 6 : labelX, labelY === undefined ? y2 : labelY, "mee-label " + className);
    }

    function drawTruss(doc, svg, result) {
      clear(svg);
      var width = 720;
      var height = 385;
      var leftX = 130;
      var rightX = 590;
      var baseY = 285;
      var topX = 360;
      var topY = 95;
      var exaggeration = 1200;
      var ux = Math.max(-70, Math.min(70, result.displacement[0] * exaggeration));
      var uy = Math.max(-70, Math.min(70, -result.displacement[1] * exaggeration));
      var deformedX = topX + ux;
      var deformedY = topY + uy;
      svg.setAttribute("viewBox", "0 0 " + width + " " + height);
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", "两杆 V 形线弹性桁架，显示外载、变形、杆力与支点");
      svg.appendChild(svgElement(doc, "line", { x1: leftX, y1: baseY, x2: rightX, y2: baseY, "class": "mee-ground" }));
      svg.appendChild(svgElement(doc, "polygon", { points: (leftX - 18) + "," + (baseY + 27) + " " + (leftX + 18) + "," + (baseY + 27) + " " + leftX + "," + (baseY + 2), "class": "mee-support" }));
      svg.appendChild(svgElement(doc, "polygon", { points: (rightX - 18) + "," + (baseY + 27) + " " + (rightX + 18) + "," + (baseY + 27) + " " + rightX + "," + (baseY + 2), "class": "mee-support" }));
      svg.appendChild(svgElement(doc, "line", { x1: leftX, y1: baseY, x2: topX, y2: topY, "class": "mee-original" }));
      svg.appendChild(svgElement(doc, "line", { x1: rightX, y1: baseY, x2: topX, y2: topY, "class": "mee-original" }));
      svg.appendChild(svgElement(doc, "line", { x1: leftX, y1: baseY, x2: deformedX, y2: deformedY, "class": "mee-member mee-member-left" }));
      svg.appendChild(svgElement(doc, "line", { x1: rightX, y1: baseY, x2: deformedX, y2: deformedY, "class": "mee-member mee-member-right" }));
      svg.appendChild(svgElement(doc, "circle", { cx: deformedX, cy: deformedY, r: 8, "class": "mee-node" }));
      svg.appendChild(svgElement(doc, "circle", { cx: leftX, cy: baseY, r: 5, "class": "mee-node" }));
      svg.appendChild(svgElement(doc, "circle", { cx: rightX, cy: baseY, r: 5, "class": "mee-node" }));
      arrow(doc, svg, deformedX, deformedY - 65, deformedX, deformedY - 8, "mee-load", "P=" + formatNumber(result.config.P / 1000, 2) + " kN ↓", deformedX + 8, deformedY - 43);
      if (Math.abs(result.config.H) > 1e-12) {
        var hStart = result.config.H >= 0 ? deformedX - 58 : deformedX + 58;
        arrow(doc, svg, hStart, deformedY - 14, deformedX + (result.config.H >= 0 ? -8 : 8), deformedY - 14, "mee-side-load", "H=" + formatNumber(Math.abs(result.config.H) / 1000, 2) + " kN", hStart - 8, deformedY - 25);
      }
      svgText(doc, svg, "A", leftX - 6, baseY + 52, "mee-muted");
      svgText(doc, svg, "B", rightX - 6, baseY + 52, "mee-muted");
      svgText(doc, svg, "C（变形夸大 " + formatNumber(exaggeration, 0) + "×）", deformedX - 32, deformedY - 14, "mee-muted");
      svgText(doc, svg, "N1=" + formatNumber(result.members[0].axialForce / 1000, 2) + " kN", 166, 185, "mee-force");
      svgText(doc, svg, "N2=" + formatNumber(result.members[1].axialForce / 1000, 2) + " kN", 512, 185, "mee-force");
      svgText(doc, svg, "b=" + formatNumber(result.config.span, 2) + " m", 334, baseY + 42, "mee-muted");
      svgText(doc, svg, "h=" + formatNumber(result.config.height, 2) + " m", topX + 12, 205, "mee-muted");
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
        '[data-learning-lab="' + LAB_ID + '"]{--mee-blue:#245a9b;--mee-green:#2d7a4b;--mee-orange:#ad6811;--mee-red:#b23a32;display:block;max-width:100%;min-width:0;line-height:1.55;overflow-wrap:anywhere}',
        '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}',
        '[data-learning-lab="' + LAB_ID + '"] h3{margin:0;font-size:1.16rem;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] .mee-note,[data-learning-lab="' + LAB_ID + '"] .mee-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
        '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:700;line-height:1.5}',
        '[data-learning-lab="' + LAB_ID + '"] .mee-options{display:grid;gap:5px}[data-learning-lab="' + LAB_ID + '"] .mee-options label{display:flex;gap:8px;align-items:flex-start;min-height:44px;padding:7px 0;cursor:pointer}[data-learning-lab="' + LAB_ID + '"] .mee-options input{flex:0 0 auto;margin-top:5px;accent-color:var(--mee-blue)}',
        '[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{min-height:44px;font:inherit;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] input[type=number]{width:100%;padding:7px 9px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);color:inherit}',
        '[data-learning-lab="' + LAB_ID + '"] button{padding:8px 12px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);color:inherit;cursor:pointer}[data-learning-lab="' + LAB_ID + '"] button:hover,[data-learning-lab="' + LAB_ID + '"] button:focus-visible{border-color:var(--mee-blue)}[data-learning-lab="' + LAB_ID + '"] .mee-primary{background:var(--mee-blue);border-color:var(--mee-blue);color:#fff}',
        '[data-learning-lab="' + LAB_ID + '"] .mee-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + LAB_ID + '"] .mee-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mee-error{min-height:1.6em;color:var(--mee-red);font-weight:700}',
        '[data-learning-lab="' + LAB_ID + '"] .mee-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px;margin:14px 0}[data-learning-lab="' + LAB_ID + '"] .mee-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .mee-control label{font-size:13px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mee-control small{font-size:11px;color:var(--fg-soft,currentColor)}',
        '[data-learning-lab="' + LAB_ID + '"] .mee-layout{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(260px,.75fr);gap:15px;align-items:start;min-width:0}[data-learning-lab="' + LAB_ID + '"] .mee-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:7px;overflow:hidden;background:var(--bg,Canvas)}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="' + LAB_ID + '"] svg text{font-family:inherit;letter-spacing:0;fill:currentColor;font-size:12px}',
        '[data-learning-lab="' + LAB_ID + '"] .mee-ground,[data-learning-lab="' + LAB_ID + '"] .mee-original{stroke:currentColor;stroke-width:1.5;opacity:.5}[data-learning-lab="' + LAB_ID + '"] .mee-original{stroke-dasharray:6 5}[data-learning-lab="' + LAB_ID + '"] .mee-support{fill:var(--bg,Canvas);stroke:currentColor;stroke-width:1.5}[data-learning-lab="' + LAB_ID + '"] .mee-member{stroke-width:6;stroke-linecap:round}[data-learning-lab="' + LAB_ID + '"] .mee-member-left{stroke:var(--mee-blue)}[data-learning-lab="' + LAB_ID + '"] .mee-member-right{stroke:var(--mee-green)}[data-learning-lab="' + LAB_ID + '"] .mee-node{fill:var(--bg,Canvas);stroke:currentColor;stroke-width:2}[data-learning-lab="' + LAB_ID + '"] .mee-load{stroke:var(--mee-orange);fill:var(--mee-orange);stroke-width:2}[data-learning-lab="' + LAB_ID + '"] .mee-side-load{stroke:var(--mee-red);fill:var(--mee-red);stroke-width:2}[data-learning-lab="' + LAB_ID + '"] .mee-force{fill:var(--mee-blue);font-weight:700}[data-learning-lab="' + LAB_ID + '"] .mee-muted{fill:var(--fg-soft,currentColor);font-size:11px}',
        '[data-learning-lab="' + LAB_ID + '"] .mee-table-wrap{min-width:0;max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:430px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}',
        '[data-learning-lab="' + LAB_ID + '"] .mee-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + LAB_ID + '"] .mee-metric{min-width:0;padding:9px;border-top:3px solid var(--mee-blue);background:var(--bg,Canvas)}[data-learning-lab="' + LAB_ID + '"] .mee-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .mee-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
        'html[data-theme="dark"] [data-learning-lab="' + LAB_ID + '"]{--mee-blue:#83b3ff;--mee-green:#83d39c;--mee-orange:#f2bb62;--mee-red:#ff9b91}',
        '@media(max-width:850px){[data-learning-lab="' + LAB_ID + '"] .mee-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:650px){[data-learning-lab="' + LAB_ID + '"] .mee-controls{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="' + LAB_ID + '"] .mee-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:400px){[data-learning-lab="' + LAB_ID + '"] .mee-controls{grid-template-columns:minmax(0,1fr)}[data-learning-lab="' + LAB_ID + '"] .mee-metrics{grid-template-columns:minmax(0,1fr)}[data-learning-lab="' + LAB_ID + '"] .mee-actions>*{width:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important}}'
      ].join("");
      (doc.head || doc.documentElement).appendChild(style);
    }

    function question(doc, uid, name, text, choices) {
      var fieldset = element(doc, "fieldset", {}, [element(doc, "legend", { text: text })]);
      var options = element(doc, "div", { className: "mee-options" });
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
        node: element(doc, "div", { className: "mee-control" }, [
          element(doc, "label", { htmlFor: id, text: label }),
          input,
          element(doc, "small", { text: unit })
        ])
      };
    }

    function metric(doc, label, value) {
      return element(doc, "div", { className: "mee-metric" }, [
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
      root.appendChild(element(doc, "h3", { id: uid + "-heading", text: "V 形小桁架：应变能与单位载荷账本" }));
      root.appendChild(element(doc, "p", {
        className: "mee-note",
        text: "先完成三项预测。揭示后可改变几何、材料和载荷；实验台会同时显示杆力、刚度正定证书、Castigliano、单位载荷和残差。"
      }));

      var form = element(doc, "form", { className: "mee-prediction" });
      form.appendChild(question(doc, uid, "energy", "P 加倍时，应变能 U 如何变化？", [
        { value: "square", label: "约变为 4 倍，因为 U 对载荷是二次函数" },
        { value: "linear", label: "约变为 2 倍，因为位移只加倍" },
        { value: "same", label: "不变，因为材料和几何不变" }
      ]));
      form.appendChild(question(doc, uid, "unit", "向下位移的单位载荷法与 Castigliano 对 P 求导的关系？", [
        { value: "same", label: "相等，二者都是沿向下广义力的位移" },
        { value: "opposite", label: "必定相反，因为一个是虚载荷" },
        { value: "unrelated", label: "没有关系，只能分别估计" }
      ]));
      form.appendChild(question(doc, uid, "positive", "2×2 刚度矩阵的正定证书应检查什么？", [
        { value: "sylvester", label: "K11>0 且 det(K)>0（Sylvester 判据）" },
        { value: "offdiag", label: "只要 K12=0 就足够" },
        { value: "force", label: "只要平衡残差为零就足够" }
      ]));
      var feedback = element(doc, "p", { className: "mee-feedback", role: "status", "aria-live": "polite", text: "结果尚未揭示。" });
      form.appendChild(element(doc, "div", { className: "mee-actions" }, [
        element(doc, "button", { type: "submit", className: "mee-primary", text: "提交预测并揭示" }),
        element(doc, "button", { type: "button", "data-reset": "true", text: "重置实验" })
      ]));
      form.appendChild(feedback);
      root.appendChild(form);

      var bench = element(doc, "div", { hidden: true });
      var fields = [
        inputControl(doc, uid, "span", "支点间距 b", DEFAULTS.span, 0.2, 3, 0.01, "m"),
        inputControl(doc, uid, "height", "顶点高度 h", DEFAULTS.height, 0.1, 3, 0.01, "m"),
        inputControl(doc, uid, "area", "杆截面积 A", DEFAULTS.area * 1e6, 20, 5000, 5, "mm²"),
        inputControl(doc, uid, "E", "弹性模量 E", DEFAULTS.E / 1e9, 1, 400, 1, "GPa"),
        inputControl(doc, uid, "P", "向下载荷 P", DEFAULTS.P / 1000, 0.1, 100, 0.1, "kN"),
        inputControl(doc, uid, "H", "水平载荷 H", DEFAULTS.H / 1000, -50, 50, 0.1, "kN；正值向右")
      ];
      var controls = element(doc, "div", { className: "mee-controls" });
      fields.forEach(function (field) { controls.appendChild(field.node); });
      bench.appendChild(controls);
      var error = element(doc, "p", { className: "mee-error", role: "alert", "aria-live": "polite" });
      bench.appendChild(error);
      var layout = element(doc, "div", { className: "mee-layout" });
      var stage = element(doc, "div", { className: "mee-stage" });
      var svg = svgElement(doc, "svg", {});
      stage.appendChild(svg);
      var ledger = element(doc, "div", { className: "mee-table-wrap" });
      layout.appendChild(stage);
      layout.appendChild(ledger);
      bench.appendChild(layout);
      var metrics = element(doc, "div", { className: "mee-metrics" });
      bench.appendChild(metrics);
      var note = element(doc, "p", { className: "mee-note", role: "status", "aria-live": "polite" });
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
        return {
          span: values.span,
          height: values.height,
          area: values.area * 1e-6,
          E: values.E * 1e9,
          P: values.P * 1000,
          H: values.H * 1000
        };
      }

      function render() {
        if (!state.revealed) return;
        try {
          var result = solveTruss(uiConfig());
          error.textContent = "";
          drawTruss(doc, svg, result);
          clear(metrics);
          metrics.appendChild(metric(doc, "向下位移", formatNumber(-result.displacement[1] * 1000, 4) + " mm"));
          metrics.appendChild(metric(doc, "应变能 U", formatNumber(result.energy, 4) + " J"));
          metrics.appendChild(metric(doc, "最小特征值", formatNumber(result.minimumEigenvalue, 3) + " N/m"));
          metrics.appendChild(metric(doc, "平衡范数", formatNumber(result.equilibriumNorm, 6) + " N"));
          renderTable(doc, ledger, ["账本项", "公式/读数", "单位或判定"], [
            ["杆长 Le", "sqrt((b/2)^2+h^2) = " + formatNumber(result.memberLength, 6), "m"],
            ["K11, K12, K22", "[" + formatNumber(result.stiffness[0][0], 3) + ", " + formatNumber(result.stiffness[0][1], 3) + ", " + formatNumber(result.stiffness[1][1], 3) + "]", "N/m"],
            ["顶点位移", "[" + formatNumber(result.displacement[0] * 1000, 5) + ", " + formatNumber(result.displacement[1] * 1000, 5) + "]", "mm；x 右、y 上"],
            ["杆轴力 N1, N2", formatNumber(result.members[0].axialForce / 1000, 4) + ", " + formatNumber(result.members[1].axialForce / 1000, 4), "kN；负值为压缩"],
            ["应变能", "Σ N²Le/(2EA) = " + formatNumber(result.energy, 6), "J"],
            ["外力半功", "1/2 f·u = " + formatNumber(result.externalHalfWork, 6), "J；应与 U 相等"],
            ["Castigliano", "∂U/∂P = " + formatNumber(result.castigliano * 1000, 6), "mm；沿向下广义载荷方向"],
            ["单位载荷法", "Σ N Nbar Le/(EA) = " + formatNumber(result.unitVirtualWork * 1000, 6), "mm；向下单位载荷"],
            ["顶点平衡", "||f − ΣN n|| = " + formatNumber(result.equilibriumNorm, 8), "N"],
            ["左/右支座反力", "[" + formatNumber(result.supportReactions[0][0] / 1000, 4) + ", " + formatNumber(result.supportReactions[0][1] / 1000, 4) + "] / [" + formatNumber(result.supportReactions[1][0] / 1000, 4) + ", " + formatNumber(result.supportReactions[1][1] / 1000, 4) + "]", "kN；x 向右、y 向上"],
            ["整体平衡", "f + RL + RR = [" + formatNumber(result.supportResidual[0], 8) + ", " + formatNumber(result.supportResidual[1], 8) + "]", "N"],
            ["正定证书", "K11>0 且 det(K)=" + formatNumber(result.determinant, 3), result.positiveDefinite ? "通过" : "失败"]
          ]);
          note.textContent = result.positiveDefinite
            ? "刚度通过 Sylvester 正定证书；能量、Castigliano、单位载荷和顶点平衡在浮点容差内互相复算。"
            : "刚度正定证书失败；不要把求得的位移当成稳定线弹性解。";
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
          energy: selected(form, uid + "-energy"),
          unit: selected(form, uid + "-unit"),
          positive: selected(form, uid + "-positive")
        };
        if (!answers.energy || !answers.unit || !answers.positive) {
          feedback.textContent = "请先完成三项预测；结果仍然隐藏。";
          return;
        }
        state.revealed = true;
        bench.hidden = false;
        var correct = (answers.energy === "square" ? 1 : 0) + (answers.unit === "same" ? 1 : 0) + (answers.positive === "sylvester" ? 1 : 0);
        feedback.textContent = "已揭示：" + correct + "/3 命中。现在调参并核对三本账。";
        render();
        if (api && typeof api.announce === "function") api.announce(root, "能量弹性实验已揭示，桁架账本已显示。");
      });
      form.querySelector('[data-reset="true"]').addEventListener("click", function () {
        form.reset();
        state.revealed = false;
        bench.hidden = true;
        feedback.textContent = "结果尚未揭示。";
        fields.forEach(function (field) {
          var value = DEFAULTS[field.key];
          if (field.key === "area") value *= 1e6;
          if (field.key === "E") value /= 1e9;
          if (field.key === "P" || field.key === "H") value /= 1000;
          field.input.value = value;
        });
        error.textContent = "";
        clear(metrics);
        clear(ledger);
        clear(svg);
        note.textContent = "";
        if (api && typeof api.announce === "function") api.announce(root, "能量弹性实验已重置，预测结果再次隐藏。");
      });
      if (api && typeof api.announce === "function") api.announce(root, "能量弹性实验已加载；先完成三项预测。");
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) { checks += 1; assert(condition, message); }
      var result = solveTruss(DEFAULTS);
      check(result.positiveDefinite && result.minimumEigenvalue > 0, "default stiffness has a positive-definite certificate");
      check(near(result.equilibriumResidual[0], 0) && near(result.equilibriumResidual[1], 0), "free-node equilibrium closes");
      check(near(result.supportResidual[0], 0) && near(result.supportResidual[1], 0), "support reaction ledger closes");
      check(near(result.supportReactions[0][0], -4400) && near(result.supportReactions[1][0], 3600), "member forces recover the two support reactions");
      check(near(result.energy, result.externalHalfWork, 1e-11), "strain energy equals half external work");
      check(near(result.castigliano, result.unitVirtualWork, 1e-10), "Castigliano and unit-load deflection agree");
      check(near(result.castigliano, -result.displacement[1], 1e-10), "downward generalized derivative has the expected sign");
      check(result.members[0].axialForce < 0 && result.members[1].axialForce < 0, "default downward load puts both braces in compression");
      var doubled = solveTruss({ span: DEFAULTS.span, height: DEFAULTS.height, E: DEFAULTS.E, area: DEFAULTS.area, P: 2 * DEFAULTS.P, H: 2 * DEFAULTS.H });
      check(near(doubled.energy, 4 * result.energy, 1e-10), "linear elastic energy scales quadratically with load");
      var horizontal = solveTruss({ span: DEFAULTS.span, height: DEFAULTS.height, E: DEFAULTS.E, area: DEFAULTS.area, P: DEFAULTS.P, H: -DEFAULTS.H });
      check(near(horizontal.displacement[0], -result.displacement[0], 1e-10), "signed horizontal load reverses horizontal displacement");
      var invalidCaught = false;
      try { solveTruss({ span: DEFAULTS.span, height: 0, E: DEFAULTS.E, area: DEFAULTS.area, P: DEFAULTS.P, H: 0 }); } catch (error) { invalidCaught = true; }
      check(invalidCaught, "zero height is rejected");
      check(formatNumber(1350, 0) === "1350" && formatNumber(60, 0) === "60", "zero-decimal formatter preserves integer zeros");
      return { checks: checks };
    }

    return {
      DEFAULTS: DEFAULTS,
      normalizeConfig: normalizeConfig,
      solveTruss: solveTruss,
      formatNumber: formatNumber,
      mount: mount,
      selfTest: selfTest
    };
  }
);
