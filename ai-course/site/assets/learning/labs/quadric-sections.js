(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("quadric-sections", exported.mount);
  }
  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log(
        "quadric-sections self-test: PASS (" +
          report.checks +
          " checks, " +
          report.models +
          " models)"
      );
    } catch (error) {
      console.error("quadric-sections self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(
  typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : null,
  function (host) {
    "use strict";

    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "cl-quadric-sections-style";
    var INSTANCE = 0;
    var EPS = 1e-9;
    var DEFAULTS = { modelId: "ellipsoid", axis: 2, slice: 0, angle: 25 };

    var MODELS = [
      {
        id: "ellipsoid",
        label: "椭球：(+,+,+), ρ=1",
        lambda: [1, 2, 3],
        linear: [0, 0, 0],
        rho: 1,
        center: [0.4, -0.3, 0.2],
        angle: 25,
        global: "椭球面"
      },
      {
        id: "one-sheet",
        label: "单叶双曲面：(+,+,−), ρ=1",
        lambda: [1, 1, -1],
        linear: [0, 0, 0],
        rho: 1,
        center: [0, 0, 0],
        angle: -20,
        global: "单叶双曲面"
      },
      {
        id: "two-sheet",
        label: "双叶双曲面：(+,-,-), ρ=1",
        lambda: [1, -1, -1],
        linear: [0, 0, 0],
        rho: 1,
        center: [0, 0, 0],
        angle: 15,
        global: "双叶双曲面"
      },
      {
        id: "cone",
        label: "二次锥面：(+,+,−), ρ=0",
        lambda: [1, 1, -1],
        linear: [0, 0, 0],
        rho: 0,
        center: [0, 0, 0],
        angle: 10,
        global: "二次锥面"
      },
      {
        id: "paraboloid",
        label: "椭圆抛物面：u²+v²−w=0",
        lambda: [1, 1, 0],
        linear: [0, 0, -1],
        rho: 0,
        center: [0, 0, 0],
        angle: 0,
        global: "椭圆抛物面"
      }
    ];

    var STYLE_TEXT = [
      ".qs-lab{--qs-blue:var(--cl-blue,#315f9d);--qs-gold:var(--cl-gold,#9b6a12);--qs-green:var(--cl-green,#39734d);--qs-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere;}",
      ".qs-lab *,.qs-lab *::before,.qs-lab *::after{box-sizing:border-box;}.qs-lab [hidden]{display:none!important;}",
      ".qs-lab h3,.qs-lab h4{margin:0;color:var(--fg);letter-spacing:0;}.qs-lab h3{font-size:1.18rem;}.qs-lab h4{margin-top:16px;font-size:1rem;}",
      ".qs-lab p{margin:.65em 0;}.qs-lab .qs-note,.qs-lab .qs-feedback,.qs-lab .qs-boundary{color:var(--fg-soft);font-size:13px;line-height:1.7;}",
      ".qs-lab button,.qs-lab select,.qs-lab input{font:inherit;letter-spacing:0;}.qs-lab button,.qs-lab select{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;line-height:1.35;overflow-wrap:anywhere;}",
      ".qs-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent);}.qs-lab button:hover{border-color:var(--accent);}.qs-lab button[aria-pressed=\"true\"],.qs-lab button.qs-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750;}.qs-lab button:focus-visible,.qs-lab select:focus-visible,.qs-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}",
      ".qs-lab .qs-predict{margin:14px 0;padding:13px 14px;border-left:3px solid var(--qs-gold);background:var(--bg);}.qs-lab .qs-predict-title{display:block;margin-bottom:10px;font-size:13px;}.qs-lab .qs-question-list{display:grid;gap:12px;}.qs-lab .qs-question{min-width:0;margin:0;padding:0;border:0;}.qs-lab .qs-question legend{max-width:100%;margin-bottom:7px;color:var(--fg);font-size:12.5px;font-weight:700;overflow-wrap:anywhere;}.qs-lab .qs-choice-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}.qs-lab .qs-choice-row button{font-size:12px;}",
      ".qs-lab .qs-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}.qs-lab .qs-actions>*{flex:1 1 155px;}.qs-lab .qs-feedback{min-height:2em;margin:8px 0 0;font-weight:700;}.qs-lab .qs-pass,.qs-lab .qs-ok{color:var(--qs-green);}.qs-lab .qs-warn,.qs-lab .qs-fail{color:var(--qs-red);}",
      ".qs-lab .qs-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:12px 16px;margin:14px 0;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg);}.qs-lab .qs-control{display:grid;gap:5px;min-width:0;}.qs-lab .qs-control label{color:var(--fg-soft);font-size:13px;font-weight:700;}.qs-lab .qs-control output{color:var(--accent);font-variant-numeric:tabular-nums;}",
      ".qs-lab .qs-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:12px 0;}.qs-lab .qs-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}.qs-lab .qs-metric.qs-blue{border-top-color:var(--qs-blue);}.qs-lab .qs-metric.qs-gold{border-top-color:var(--qs-gold);}.qs-lab .qs-metric.qs-green{border-top-color:var(--qs-green);}.qs-lab .qs-metric.qs-red{border-top-color:var(--qs-red);}.qs-lab .qs-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4;}.qs-lab .qs-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}",
      ".qs-lab .qs-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);}.qs-lab .qs-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,1.12fr);gap:14px;margin-top:12px;}.qs-lab .qs-chart-frame{min-width:0;padding:7px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden;}.qs-lab svg{display:block;width:100%;height:auto;color:var(--fg);}.qs-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}.qs-lab .qs-ledger{max-width:100%;margin-top:14px;overflow-x:auto;-webkit-overflow-scrolling:touch;}.qs-lab table{width:100%;min-width:760px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}.qs-lab th,.qs-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;overflow-wrap:anywhere;}.qs-lab th{color:var(--fg-soft);font-size:11.5px;font-weight:750;}.qs-lab .qs-interpretation{margin:12px 0 0;padding:11px 13px;border-left:3px solid var(--qs-green);background:var(--bg);font-size:13px;line-height:1.7;}",
      "@media(max-width:820px){.qs-lab .qs-controls,.qs-lab .qs-grid{grid-template-columns:repeat(2,minmax(0,1fr));}}",
      "@media(max-width:560px){.qs-lab .qs-controls,.qs-lab .qs-grid{grid-template-columns:minmax(0,1fr);}.qs-lab .qs-choice-row{grid-template-columns:minmax(0,1fr);}}",
      "@media(max-width:420px){.qs-lab .qs-predict{padding-left:11px;padding-right:11px;}.qs-lab th,.qs-lab td{padding-left:5px;padding-right:5px;}}",
      "@media(prefers-reduced-motion:reduce){.qs-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important;}}"
    ].join("\n");

    function finite(value) {
      return typeof value === "number" && isFinite(value);
    }

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function formatNumber(value, digits) {
      if (!finite(value)) return "—";
      if (Math.abs(value) < 5e-12) return "0";
      var text = Number(value).toFixed(digits === undefined ? 3 : digits);
      return text.replace(/0+$/, "").replace(/\.$/, "");
    }

    function modelById(id) {
      for (var i = 0; i < MODELS.length; i += 1) {
        if (MODELS[i].id === id) return MODELS[i];
      }
      throw new Error("Unknown quadric model: " + id);
    }

    function axisName(axis) {
      return ["u", "v", "w"][axis];
    }

    function remainingAxes(axis) {
      return [0, 1, 2].filter(function (value) { return value !== axis; });
    }

    function rotationMatrix(angle) {
      var t = Number(angle) * Math.PI / 180;
      var c = Math.cos(t), s = Math.sin(t);
      return [[c, -s, 0], [s, c, 0], [0, 0, 1]];
    }

    function rotatePoint(point, angle) {
      var matrix = rotationMatrix(angle);
      return [
        matrix[0][0] * point[0] + matrix[0][1] * point[1] + matrix[0][2] * point[2],
        matrix[1][0] * point[0] + matrix[1][1] * point[1] + matrix[1][2] * point[2],
        matrix[2][0] * point[0] + matrix[2][1] * point[1] + matrix[2][2] * point[2]
      ];
    }

    function add3(a, b) {
      return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    }

    function subtract3(a, b) {
      return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    }

    function dot3(a, b) {
      return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    }

    function sectionKind(a, b, l1, l2, rhs) {
      var shiftedRhs = rhs;
      if (Math.abs(a) > EPS) shiftedRhs += l1 * l1 / (4 * a);
      if (Math.abs(b) > EPS) shiftedRhs += l2 * l2 / (4 * b);
      var xCenter = Math.abs(a) > EPS ? -l1 / (2 * a) : 0;
      var yCenter = Math.abs(b) > EPS ? -l2 / (2 * b) : 0;
      var kind = "empty";
      if (Math.abs(a) > EPS && Math.abs(b) > EPS) {
        if (a * b > 0) {
          var positiveDefinite = a > 0;
          var feasible = positiveDefinite ? shiftedRhs > EPS : shiftedRhs < -EPS;
          var point = Math.abs(shiftedRhs) <= EPS;
          kind = point ? "point" : feasible ? "ellipse" : "empty";
        } else {
          kind = Math.abs(shiftedRhs) <= EPS ? "pair-of-lines" : "hyperbola";
        }
      } else if (Math.abs(a) > EPS || Math.abs(b) > EPS) {
        var zeroLinear = Math.abs(a) <= EPS ? Math.abs(l1) : Math.abs(l2);
        if (zeroLinear > EPS) {
          kind = "parabola";
        } else {
          var coefficient = Math.abs(a) > EPS ? a : b;
          var value = shiftedRhs / coefficient;
          kind = value > EPS ? "parallel-lines" : Math.abs(value) <= EPS ? "double-line" : "empty";
        }
      } else {
        if (Math.abs(l1) > EPS || Math.abs(l2) > EPS) kind = "line";
        else kind = Math.abs(rhs) <= EPS ? "whole-plane" : "empty";
      }
      return {
        a: a,
        b: b,
        l1: l1,
        l2: l2,
        rhs: rhs,
        shiftedRhs: shiftedRhs,
        center: [xCenter, yCenter],
        kind: kind
      };
    }

    function kindLabel(kind) {
      return {
        ellipse: "椭圆",
        point: "一点",
        empty: "空集",
        hyperbola: "双曲线",
        "pair-of-lines": "相交直线对",
        parabola: "抛物线",
        "parallel-lines": "平行直线对",
        "double-line": "重合直线",
        line: "直线",
        "whole-plane": "整平面"
      }[kind] || kind;
    }

    function equationText(section) {
      return formatNumber(section.a, 2) + " X² + " + formatNumber(section.b, 2) + " Y² + " +
        formatNumber(section.l1, 2) + " X + " + formatNumber(section.l2, 2) + " Y = " +
        formatNumber(section.rhs, 2);
    }

    function analyze(options) {
      var settings = options || {};
      var model = modelById(settings.modelId || DEFAULTS.modelId);
      var axis = Number(settings.axis === undefined ? DEFAULTS.axis : settings.axis);
      var slice = Number(settings.slice === undefined ? DEFAULTS.slice : settings.slice);
      var angle = Number(settings.angle === undefined ? model.angle : settings.angle);
      if (!finite(axis) || Math.floor(axis) !== axis || axis < 0 || axis > 2) {
        throw new Error("Axis must be an integer from 0 to 2");
      }
      if (!finite(slice)) throw new Error("Slice position must be finite");
      if (!finite(angle)) throw new Error("Rotation angle must be finite");
      var rest = remainingAxes(axis);
      var rhs = model.rho - model.lambda[axis] * slice * slice - model.linear[axis] * slice;
      var section = sectionKind(
        model.lambda[rest[0]],
        model.lambda[rest[1]],
        model.linear[rest[0]],
        model.linear[rest[1]],
        rhs
      );
      var rotation = rotationMatrix(angle);
      var principalU = [rotation[0][0], rotation[1][0], rotation[2][0]];
      var principalV = [rotation[0][1], rotation[1][1], rotation[2][1]];
      var principalW = [rotation[0][2], rotation[1][2], rotation[2][2]];
      return {
        model: model,
        axis: axis,
        axisLabel: axisName(axis),
        slice: slice,
        angle: angle,
        rest: rest,
        rhs: rhs,
        section: section,
        sectionLabel: kindLabel(section.kind),
        signature: model.lambda.map(function (value) { return value > EPS ? "+" : value < -EPS ? "−" : "0"; }).join(" "),
        center: model.center,
        principalAxes: [principalU, principalV, principalW],
        rotation: rotation
      };
    }

    function sectionPoint(data, point) {
      var principal = [0, 0, 0];
      principal[data.rest[0]] = point[0];
      principal[data.rest[1]] = point[1];
      principal[data.axis] = data.slice;
      var rotated = rotatePoint(principal, data.angle);
      return add3(rotated, data.center);
    }

    function projectSectionPoint(data, point) {
      var worldPoint = sectionPoint(data, point);
      var worldOrigin = sectionPoint(data, [0, 0]);
      var offset = subtract3(worldPoint, worldOrigin);
      return [
        dot3(offset, data.principalAxes[data.rest[0]]),
        dot3(offset, data.principalAxes[data.rest[1]])
      ];
    }

    function appendLine(points, pointAt) {
      for (var t = -4.8; t <= 4.8001; t += 0.08) points.push(pointAt(t));
      points.push(null);
    }

    function sectionCurve(data) {
      var section = data.section;
      var points = [];
      var a = section.a, b = section.b, l1 = section.l1, l2 = section.l2;
      if (section.kind === "ellipse" || section.kind === "hyperbola") {
        for (var i = 0; i <= 360; i += 1) {
          var theta = 2 * Math.PI * i / 360;
          var dx = Math.cos(theta), dy = Math.sin(theta);
          var qDirection = a * dx * dx + b * dy * dy;
          var ratio = qDirection === 0 ? -1 : section.shiftedRhs / qDirection;
          if (ratio > EPS) {
            var radius = Math.sqrt(ratio);
            points.push([section.center[0] + radius * dx, section.center[1] + radius * dy]);
          } else {
            points.push(null);
          }
        }
      } else if (section.kind === "parabola") {
        var quadraticIndex = Math.abs(a) > EPS ? 0 : 1;
        var quadratic = quadraticIndex === 0 ? a : b;
        var linear = quadraticIndex === 0 ? l2 : l1;
        for (var p = -3; p <= 3.0001; p += 0.05) {
          var other = (section.rhs - quadratic * p * p) / linear;
          points.push(quadraticIndex === 0 ? [p, other] : [other, p]);
        }
      } else if (section.kind === "pair-of-lines") {
        var slope = Math.sqrt(-a / b);
        appendLine(points, function (x) {
          return [section.center[0] + x, section.center[1] + slope * x];
        });
        appendLine(points, function (x) {
          return [section.center[0] + x, section.center[1] - slope * x];
        });
      } else if (section.kind === "parallel-lines" || section.kind === "double-line") {
        var alongX = Math.abs(a) > EPS;
        var coefficient = alongX ? a : b;
        var offset = section.kind === "double-line" ? 0 : Math.sqrt(section.shiftedRhs / coefficient);
        var offsets = section.kind === "double-line" ? [0] : [-offset, offset];
        offsets.forEach(function (lineOffset) {
          appendLine(points, function (free) {
            return alongX
              ? [section.center[0] + lineOffset, free]
              : [free, section.center[1] + lineOffset];
          });
        });
      } else if (section.kind === "line") {
        if (Math.abs(l2) >= Math.abs(l1)) {
          appendLine(points, function (x) { return [x, (section.rhs - l1 * x) / l2]; });
        } else {
          appendLine(points, function (y) { return [(section.rhs - l2 * y) / l1, y]; });
        }
      } else if (section.kind === "point") {
        points.push(section.center);
      }
      return points;
    }

    function contourSvg(doc, data, uid) {
      var svg = svgNode(doc, "svg", {
        viewBox: "0 0 500 320",
        role: "img",
        "aria-labelledby": uid + "-svg-title " + uid + "-svg-desc"
      });
      svg.appendChild(svgNode(doc, "title", { id: uid + "-svg-title" }, "二次曲面指定截面"));
      svg.appendChild(svgNode(doc, "desc", { id: uid + "-svg-desc" }, "图中只显示选定主轴截面的二维曲线，不能代替三维全局分类。"));
      var points = sectionCurve(data);
      var maxAbs = 2.6;
      points.forEach(function (point) {
        if (point) {
          var projected = projectSectionPoint(data, point);
          maxAbs = Math.max(maxAbs, Math.abs(projected[0]) + 0.4, Math.abs(projected[1]) + 0.4);
        }
      });
      maxAbs = Math.min(6, maxAbs);
      var left = 42, top = 22, width = 420, height = 254;
      var mapX = function (value) { return left + (value + maxAbs) / (2 * maxAbs) * width; };
      var mapY = function (value) { return top + (maxAbs - value) / (2 * maxAbs) * height; };
      var ox = mapX(0), oy = mapY(0);
      for (var tick = -Math.floor(maxAbs); tick <= Math.floor(maxAbs); tick += 1) {
        if (tick !== 0) {
          svg.appendChild(svgNode(doc, "line", { x1: mapX(tick), y1: top, x2: mapX(tick), y2: top + height, stroke: "currentColor", "stroke-opacity": "0.12" }));
          svg.appendChild(svgNode(doc, "line", { x1: left, y1: mapY(tick), x2: left + width, y2: mapY(tick), stroke: "currentColor", "stroke-opacity": "0.12" }));
        }
      }
      svg.appendChild(svgNode(doc, "line", { x1: left, y1: oy, x2: left + width, y2: oy, stroke: "currentColor", "stroke-opacity": "0.55" }));
      svg.appendChild(svgNode(doc, "line", { x1: ox, y1: top, x2: ox, y2: top + height, stroke: "currentColor", "stroke-opacity": "0.55" }));
      if (data.section.kind === "whole-plane") {
        svg.appendChild(svgNode(doc, "rect", {
          x: left,
          y: top,
          width: width,
          height: height,
          fill: "var(--qs-blue)",
          "fill-opacity": "0.1",
          stroke: "var(--qs-blue)",
          "stroke-dasharray": "6 5"
        }));
      }
      var path = "";
      var open = false;
      points.forEach(function (point) {
        if (!point) {
          open = false;
          return;
        }
        var plotted = projectSectionPoint(data, point);
        var x = plotted[0];
        var y = plotted[1];
        if (!finite(x) || !finite(y) || Math.abs(x) > maxAbs * 1.2 || Math.abs(y) > maxAbs * 1.2) {
          open = false;
          return;
        }
        path += (open ? "L" : "M") + mapX(x) + " " + mapY(y) + " ";
        open = true;
      });
      if (path) {
        svg.appendChild(svgNode(doc, "path", {
          d: path,
          fill: "none",
          stroke: "var(--qs-blue)",
          "stroke-width": "2.8",
          "stroke-linecap": "round",
          "stroke-linejoin": "round"
        }));
      }
      if (data.section.kind === "point") {
        var pointPlotted = projectSectionPoint(data, data.section.center);
        svg.appendChild(svgNode(doc, "circle", { cx: mapX(pointPlotted[0]), cy: mapY(pointPlotted[1]), r: "5", fill: "var(--qs-red)" }));
      }
      if (data.section.kind === "empty" || data.section.kind === "whole-plane") {
        svg.appendChild(svgNode(doc, "text", {
          x: left + width / 2,
          y: top + height / 2,
          "font-size": "15",
          "font-weight": "700",
          "text-anchor": "middle"
        }, data.section.kind === "empty" ? "无实点" : "每一点都满足方程"));
      }
      svg.appendChild(svgNode(doc, "text", { x: left, y: 15, "font-size": "13", "font-weight": "700" }, axisName(data.axis) + "=" + formatNumber(data.slice, 2) + " 截面：" + data.sectionLabel));
      svg.appendChild(svgNode(doc, "text", { x: left + width - 4, y: oy - 8, "font-size": "11", "text-anchor": "end" }, "截面坐标 X"));
      svg.appendChild(svgNode(doc, "text", { x: ox + 7, y: top + 12, "font-size": "11" }, "Y"));
      return svg;
    }

    function element(doc, tag, attrs, children) {
      var node = doc.createElement(tag);
      Object.keys(attrs || {}).forEach(function (key) {
        var value = attrs[key];
        if (value === undefined || value === null || value === false) return;
        if (key === "className") node.setAttribute("class", value);
        else if (key === "text") node.textContent = value;
        else if (key.slice(0, 2) === "on" && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
        else if (value === true) node.setAttribute(key, "");
        else node.setAttribute(key, String(value));
      });
      if (children !== undefined && children !== null) {
        (Array.isArray(children) ? children : [children]).forEach(function (child) {
          if (child === null || child === undefined) return;
          node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
        });
      }
      return node;
    }

    function replaceChildren(node, children) {
      while (node.firstChild) node.removeChild(node.firstChild);
      (Array.isArray(children) ? children : [children]).forEach(function (child) {
        if (child === null || child === undefined) return;
        node.appendChild(child.nodeType ? child : node.ownerDocument.createTextNode(String(child)));
      });
    }

    function svgNode(doc, tag, attrs, text) {
      var node = doc.createElementNS(SVG_NS, tag);
      Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, String(attrs[key])); });
      if (text !== undefined) node.textContent = text;
      return node;
    }

    function installStyle(doc) {
      if (doc.getElementById(STYLE_ID)) return;
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent = STYLE_TEXT;
      (doc.head || doc.documentElement).appendChild(style);
    }

    function metric(doc, label, value, color) {
      return element(doc, "div", { className: "qs-metric " + (color || "") }, [
        element(doc, "span", { text: label }),
        element(doc, "strong", { text: value })
      ]);
    }

    function choiceQuestion(doc, refs, key, legendText, choices) {
      var fieldset = element(doc, "fieldset", { className: "qs-question" });
      fieldset.appendChild(element(doc, "legend", { text: legendText }));
      var row = element(doc, "div", { className: "qs-choice-row" });
      refs[key] = [];
      choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: choice.label });
        button.addEventListener("click", function () {
          refs.state.predictions[key] = choice.value;
          renderPrediction(refs);
        });
        refs[key].push({ value: choice.value, node: button });
        row.appendChild(button);
      });
      fieldset.appendChild(row);
      return fieldset;
    }

    function renderPrediction(refs) {
      ["signature", "moves", "slice"].forEach(function (key) {
        (refs[key] || []).forEach(function (item) {
          item.node.setAttribute("aria-pressed", refs.state.predictions[key] === item.value ? "true" : "false");
        });
      });
      var answered = ["signature", "moves", "slice"].every(function (key) {
        return refs.state.predictions[key] !== null;
      });
      refs.feedback.textContent = answered ? "三个预测已记录，可以揭示结果。" : "请先完成三个预测。";
      refs.feedback.className = "qs-feedback";
    }

    function renderResults(refs) {
      var state = refs.state;
      var data = analyze({ modelId: state.modelId, axis: state.axis, slice: state.slice, angle: state.angle });
      refs.modelSelect.value = state.modelId;
      refs.axisSelect.value = String(state.axis);
      refs.sliceInput.value = String(state.slice);
      refs.sliceOutput.textContent = formatNumber(state.slice, 2);
      refs.angleInput.value = String(state.angle);
      refs.angleOutput.textContent = formatNumber(state.angle, 1);
      refs.summary.textContent =
        data.model.global + "；当前 " + data.axisLabel + "=" + formatNumber(data.slice, 2) +
        " 的截面是" + data.sectionLabel + "。图像只呈现这个截面的证据。";
      refs.summary.className = "qs-interpretation " + (data.section.kind === "empty" ? "qs-warn" : "qs-ok");
      replaceChildren(refs.metrics, [
        metric(refs.doc, "全局模型", data.model.global, "qs-blue"),
        metric(refs.doc, "特征值符号", data.signature, "qs-gold"),
        metric(refs.doc, "中心", "(" + data.center.map(function (value) { return formatNumber(value, 2); }).join(", ") + ")", "qs-blue"),
        metric(refs.doc, "主轴旋转", formatNumber(data.angle, 1) + "°", "qs-green"),
        metric(refs.doc, "当前截面", data.sectionLabel, data.section.kind === "empty" ? "qs-red" : "qs-green")
      ]);
      replaceChildren(refs.chart, [
        element(refs.doc, "h4", { text: "真实 SVG 截面图" }),
        element(refs.doc, "div", { className: "qs-chart-frame" }, contourSvg(refs.doc, data, refs.uid))
      ]);
      var axes = data.principalAxes;
      var rows = [
        ["二次项 λ", data.model.lambda.map(function (value) { return formatNumber(value, 2); }).join(", "), "特征值符号：" + data.signature],
        ["平移中心 c", data.center.map(function (value) { return formatNumber(value, 2); }).join(", "), "配方后中心"],
        ["主轴 eᵤ", axes[0].map(function (value) { return formatNumber(value, 2); }).join(", "), "旋转后的特征方向"],
        ["主轴 eᵥ", axes[1].map(function (value) { return formatNumber(value, 2); }).join(", "), "旋转后的特征方向"],
        ["主轴 e𝓌", axes[2].map(function (value) { return formatNumber(value, 2); }).join(", "), "旋转后的特征方向"],
        ["截面方程", equationText(data.section), "右端 / 配方值 = " + formatNumber(data.section.shiftedRhs, 3)],
        ["截面边界", data.sectionLabel, "只对 " + data.axisLabel + "=" + formatNumber(data.slice, 2) + " 有效"]
      ];
      replaceChildren(refs.ledgerBody, rows.map(function (row) {
        return element(refs.doc, "tr", {}, [
          element(refs.doc, "th", { scope: "row", text: row[0] }),
          element(refs.doc, "td", { text: row[1] }),
          element(refs.doc, "td", { text: row[2] })
        ]);
      }));
      refs.boundary.textContent =
        "三层分开读：λ 的符号是全局二次项证据，中心 c 来自平移配方，eᵤ,eᵥ,e𝓌 来自主轴旋转。" +
        " 当前 SVG 和截面表只检查一个二维切片，不能单独证明整个三维曲面的连通性或分类。";
    }

    function mount(root, api) {
      if (!root || !root.ownerDocument) return;
      var doc = root.ownerDocument;
      installStyle(doc);
      var uid = "qs-" + (INSTANCE += 1);
      var state = {
        modelId: DEFAULTS.modelId,
        axis: DEFAULTS.axis,
        slice: DEFAULTS.slice,
        angle: DEFAULTS.angle,
        revealed: false,
        predictions: { signature: null, moves: null, slice: null }
      };
      var refs = { doc: doc, uid: uid, state: state };
      var shell = element(doc, "div", { className: "qs-shell" });
      shell.appendChild(element(doc, "h3", { text: "二次曲面的主轴与实际截面" }));
      shell.appendChild(element(doc, "p", { className: "qs-note", text: "先判断全局符号与局部截面，再看配方和旋转后的证据。二维图不会替代三维定理。" }));

      var prediction = element(doc, "section", { className: "qs-predict", "aria-labelledby": uid + "-predict-title" });
      prediction.appendChild(element(doc, "strong", { className: "qs-predict-title", id: uid + "-predict-title", text: "先预测，再揭示" }));
      var questionList = element(doc, "div", { className: "qs-question-list" });
      questionList.appendChild(choiceQuestion(doc, refs, "signature", "1. (+,+,+) 且 ρ>0 的中心曲面整体如何？", [
        { value: "bounded", label: "有界椭球" },
        { value: "one-sheet", label: "一定是单叶" },
        { value: "unbounded", label: "必沿零方向延伸" }
      ]));
      questionList.appendChild(choiceQuestion(doc, refs, "moves", "2. 平移配方与旋转主轴各负责什么？", [
        { value: "separate", label: "平移消一次项，旋转消交叉项" },
        { value: "same", label: "两者完全同一操作" },
        { value: "slice-only", label: "只影响截面，不影响方程" }
      ]));
      questionList.appendChild(choiceQuestion(doc, refs, "slice", "3. x²+2y²+3z²=1 在 z=0,1/√3,1 的截面？", [
        { value: "ellipse-point-empty", label: "椭圆、点、空集" },
        { value: "all-ellipse", label: "全是椭圆" },
        { value: "point-all", label: "全是点" }
      ]));
      prediction.appendChild(questionList);
      var actions = element(doc, "div", { className: "qs-actions" });
      var reveal = element(doc, "button", { type: "button", className: "qs-primary", text: "揭示并核对" });
      var reset = element(doc, "button", { type: "button", text: "重置" });
      actions.appendChild(reveal);
      actions.appendChild(reset);
      prediction.appendChild(actions);
      refs.feedback = element(doc, "p", { className: "qs-feedback", "aria-live": "polite", text: "请先完成三个预测。" });
      prediction.appendChild(refs.feedback);
      shell.appendChild(prediction);

      var controls = element(doc, "section", { className: "qs-controls", hidden: true, "aria-label": "二次曲面参数" });
      refs.modelSelect = element(doc, "select", { "aria-label": "选择二次曲面模型" });
      MODELS.forEach(function (model) {
        refs.modelSelect.appendChild(element(doc, "option", { value: model.id, text: model.label }));
      });
      refs.axisSelect = element(doc, "select", { "aria-label": "选择截面主轴" });
      ["u", "v", "w"].forEach(function (label, index) {
        refs.axisSelect.appendChild(element(doc, "option", { value: String(index), text: label + " = slice" }));
      });
      refs.sliceInput = element(doc, "input", { type: "range", min: "-2", max: "2", step: "any", value: String(DEFAULTS.slice), "aria-label": "截面位置" });
      refs.sliceOutput = element(doc, "output", { text: formatNumber(DEFAULTS.slice, 2) });
      refs.angleInput = element(doc, "input", { type: "range", min: "-60", max: "60", step: "1", value: String(DEFAULTS.angle), "aria-label": "主轴旋转角度" });
      refs.angleOutput = element(doc, "output", { text: formatNumber(DEFAULTS.angle, 1) });
      refs.tangentPreset = element(doc, "button", { type: "button", text: "椭球切点 w = 1/√3" });
      controls.appendChild(element(doc, "div", { className: "qs-control" }, [element(doc, "label", { text: "全局模型" }), refs.modelSelect]));
      controls.appendChild(element(doc, "div", { className: "qs-control" }, [element(doc, "label", { text: "截面主轴" }), refs.axisSelect]));
      controls.appendChild(element(doc, "div", { className: "qs-control" }, [element(doc, "label", {}, ["slice = ", refs.sliceOutput]), refs.sliceInput]));
      controls.appendChild(element(doc, "div", { className: "qs-control" }, [element(doc, "label", {}, ["旋转 = ", refs.angleOutput, "°"]), refs.angleInput]));
      controls.appendChild(element(doc, "div", { className: "qs-control" }, [element(doc, "label", { text: "精确退化截面" }), refs.tangentPreset]));
      shell.appendChild(controls);

      var results = element(doc, "section", { className: "qs-results", hidden: true, "aria-labelledby": uid + "-results-title" });
      refs.results = results;
      results.appendChild(element(doc, "h4", { id: uid + "-results-title", text: "揭示后的证据账本" }));
      refs.summary = element(doc, "p", { className: "qs-interpretation", "aria-live": "polite" });
      results.appendChild(refs.summary);
      refs.metrics = element(doc, "div", { className: "qs-metrics" });
      results.appendChild(refs.metrics);
      var grid = element(doc, "div", { className: "qs-grid" });
      refs.chart = element(doc, "div");
      grid.appendChild(refs.chart);
      var ledger = element(doc, "div", { className: "qs-ledger" });
      var table = element(doc, "table", { "aria-label": "二次曲面全局与截面账本" });
      table.appendChild(element(doc, "caption", { text: "特征值、平移中心、主轴与指定截面" }));
      table.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, [
        element(doc, "th", { scope: "col", text: "量" }),
        element(doc, "th", { scope: "col", text: "当前值" }),
        element(doc, "th", { scope: "col", text: "读法" })
      ])));
      refs.ledgerBody = element(doc, "tbody");
      table.appendChild(refs.ledgerBody);
      ledger.appendChild(table);
      grid.appendChild(ledger);
      results.appendChild(grid);
      refs.boundary = element(doc, "p", { className: "qs-boundary" });
      results.appendChild(refs.boundary);
      shell.appendChild(results);
      root.classList.add("qs-lab");
      root.replaceChildren(shell);

      function render() {
        controls.hidden = !state.revealed;
        results.hidden = !state.revealed;
        renderPrediction(refs);
        if (state.revealed) renderResults(refs);
      }

      reveal.addEventListener("click", function () {
        var answers = { signature: "bounded", moves: "separate", slice: "ellipse-point-empty" };
        var keys = ["signature", "moves", "slice"];
        var missing = keys.filter(function (key) { return state.predictions[key] === null; });
        if (missing.length) {
          refs.feedback.textContent = "还缺少 " + missing.length + " 个预测。";
          refs.feedback.className = "qs-feedback qs-warn";
          return;
        }
        state.revealed = true;
        render();
        var hits = keys.filter(function (key) { return state.predictions[key] === answers[key]; }).length;
        refs.feedback.textContent = "已揭示：" + hits + "/3 个预测命中；二维截面仍只是局部证据。";
        refs.feedback.className = "qs-feedback " + (hits === 3 ? "qs-pass" : "qs-warn");
        if (api && typeof api.announce === "function") api.announce(root, refs.feedback.textContent);
      });
      reset.addEventListener("click", function () {
        state = {
          modelId: DEFAULTS.modelId,
          axis: DEFAULTS.axis,
          slice: DEFAULTS.slice,
          angle: DEFAULTS.angle,
          revealed: false,
          predictions: { signature: null, moves: null, slice: null }
        };
        refs.state = state;
        render();
      });
      refs.modelSelect.addEventListener("change", function () {
        state.modelId = refs.modelSelect.value;
        if (state.revealed) renderResults(refs);
      });
      refs.axisSelect.addEventListener("change", function () {
        state.axis = Number(refs.axisSelect.value);
        if (state.revealed) renderResults(refs);
      });
      refs.sliceInput.addEventListener("input", function () {
        state.slice = Number(refs.sliceInput.value);
        if (state.revealed) renderResults(refs);
      });
      refs.angleInput.addEventListener("input", function () {
        state.angle = Number(refs.angleInput.value);
        if (state.revealed) renderResults(refs);
      });
      refs.tangentPreset.addEventListener("click", function () {
        state.modelId = "ellipsoid";
        state.axis = 2;
        state.slice = 1 / Math.sqrt(3);
        state.angle = 0;
        if (state.revealed) renderResults(refs);
      });
      render();
    }

    function selfTest() {
      var checks = 0;
      function assert(condition, message) {
        checks += 1;
        if (!condition) throw new Error(message);
      }
      function close(actual, expected, tolerance, message) {
        checks += 1;
        if (!finite(actual) || Math.abs(actual - expected) > tolerance) {
          throw new Error(message + ": " + actual + " vs " + expected);
        }
      }

      assert(MODELS.length === 5, "model count");
      var ellipse = analyze({ modelId: "ellipsoid", axis: 2, slice: 0, angle: 25 });
      assert(ellipse.signature === "+ + +", "ellipsoid signature");
      assert(ellipse.section.kind === "ellipse", "ellipsoid horizontal ellipse");
      var point = analyze({ modelId: "ellipsoid", axis: 2, slice: 1 / Math.sqrt(3), angle: 0 });
      assert(point.section.kind === "point", "ellipsoid tangent point");
      var empty = analyze({ modelId: "ellipsoid", axis: 2, slice: 1, angle: 0 });
      assert(empty.section.kind === "empty", "ellipsoid empty slice");

      var oneSheet = analyze({ modelId: "one-sheet", axis: 2, slice: 4 });
      assert(oneSheet.section.kind === "ellipse", "one-sheet horizontal ellipse");
      var twoSheetEmpty = analyze({ modelId: "two-sheet", axis: 0, slice: 0 });
      assert(twoSheetEmpty.section.kind === "empty", "two-sheet middle empty");
      var twoSheetSlice = analyze({ modelId: "two-sheet", axis: 0, slice: 2 });
      assert(twoSheetSlice.section.kind === "ellipse", "two-sheet outer ellipse");

      var parabola = analyze({ modelId: "paraboloid", axis: 0, slice: 0 });
      assert(parabola.section.kind === "parabola", "paraboloid vertical parabola");
      close(analyze({ modelId: "paraboloid", axis: 2, slice: 1 }).section.shiftedRhs, 1, 1e-12, "paraboloid horizontal rhs");

      var coneLines = analyze({ modelId: "cone", axis: 0, slice: 0, angle: 10 });
      assert(coneLines.section.kind === "pair-of-lines", "cone apex gives a line pair");
      assert(sectionCurve(coneLines).filter(Boolean).length > 100, "line pair has drawable points");
      var projected = projectSectionPoint(ellipse, [0.7, -0.4]);
      close(projected[0], 0.7, 1e-12, "section projection first coordinate");
      close(projected[1], -0.4, 1e-12, "section projection second coordinate");

      var rejected = false;
      try { analyze({ modelId: "missing" }); } catch (error) { rejected = true; }
      assert(rejected, "unknown model rejected");
      rejected = false;
      try { analyze({ modelId: "ellipsoid", axis: NaN }); } catch (error) { rejected = true; }
      assert(rejected, "non-finite axis rejected");
      rejected = false;
      try { analyze({ modelId: "ellipsoid", slice: Infinity }); } catch (error) { rejected = true; }
      assert(rejected, "non-finite slice rejected");
      return { checks: checks, models: MODELS.length };
    }

    return {
      DEFAULTS: DEFAULTS,
      MODELS: MODELS,
      sectionKind: sectionKind,
      sectionCurve: sectionCurve,
      sectionPoint: sectionPoint,
      projectSectionPoint: projectSectionPoint,
      analyze: analyze,
      mount: mount,
      selfTest: selfTest
    };
  }
);
