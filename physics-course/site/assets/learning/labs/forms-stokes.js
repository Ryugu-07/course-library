(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("forms-stokes", exported.mount);
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
        "forms-stokes self-test: PASS (" +
          report.checks +
          " checks, " +
          report.presets +
          " presets)"
      );
    } catch (error) {
      console.error("forms-stokes self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(
  typeof window !== "undefined"
    ? window
    : typeof globalThis !== "undefined"
      ? globalThis
      : this,
  function (host) {
    "use strict";

    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "forms-stokes-lab-styles";
    var INSTANCE = 0;
    var PRESETS = [
      {
        id: "square",
        label: "正向单位方形",
        description: "Phi(u,v)=(u,v)，J=1。",
        exact: 1,
        kind: "stokes"
      },
      {
        id: "deformed",
        label: "变形方形 pullback",
        description: "Phi(u,v)=(u,(1-u/2)v)，J=1-u/2>0。",
        exact: 0.75,
        kind: "stokes"
      },
      {
        id: "reverse",
        label: "反向单位方形",
        description: "Phi(u,v)=(u,1-v)，J=-1。",
        exact: -1,
        kind: "stokes"
      },
      {
        id: "punctured-loop",
        label: "绕孔的角度形式",
        description: "alpha=(x dy-y dx)/(x^2+y^2)，局部闭但不恰当。",
        exact: 2 * Math.PI,
        kind: "topology"
      }
    ];

    var PREDICTIONS = [
      {
        id: "stokes",
        prompt: "在有光滑边界的正则区域上，两本 Stokes 账如何比较？",
        options: [
          { id: "same", label: "边界线积分等于面积积分" },
          { id: "opposite", label: "两者必定互为相反数" },
          { id: "none", label: "没有任何结构关系" }
        ],
        answer: "same"
      },
      {
        id: "orientation",
        prompt: "反转参数域 orientation 后，边界诱导定向怎样变化？",
        options: [
          { id: "both", label: "两边都变号，等式仍成立" },
          { id: "boundary", label: "只改变边界线积分" },
          { id: "none", label: "两个积分都不变" }
        ],
        answer: "both"
      },
      {
        id: "topology",
        prompt: "角度形式在去掉原点的平面上 d alpha=0，绕孔积分非零说明什么？",
        options: [
          { id: "closed-not-exact", label: "闭但不恰当，有拓扑障碍" },
          { id: "proof-exact", label: "有限网格已经证明它恰当" },
          { id: "d2", label: "说明 d^2 不再为零" }
        ],
        answer: "closed-not-exact"
      }
    ];

    var STYLE_TEXT = [
      ".fst-lab{box-sizing:border-box;max-width:100%;min-width:0;color:var(--fg,#1f2933);font-size:14px;line-height:1.55;}",
      ".fst-lab *{box-sizing:border-box;}",
      ".fst-lab [hidden]{display:none!important;}",
      ".fst-lab button,.fst-lab select,.fst-lab input{font:inherit;}",
      ".fst-lab button{min-height:46px;padding:9px 12px;border:1px solid var(--border,#bbc7d1);border-radius:6px;background:var(--bg,#fff);color:inherit;cursor:pointer;}",
      ".fst-lab button:hover:not(:disabled){border-color:var(--accent,#1769aa);}",
      ".fst-lab button:focus-visible,.fst-lab select:focus-visible,.fst-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}",
      ".fst-lab button[aria-pressed=true],.fst-lab .fst-primary{border-color:var(--accent,#1769aa);background:var(--accent,#1769aa);color:#fff;font-weight:700;}",
      ".fst-lab button:disabled{cursor:not-allowed;opacity:.55;}",
      ".fst-lab .fst-heading{margin:0 0 5px;font-size:1.18rem;line-height:1.35;}",
      ".fst-lab .fst-note,.fst-lab .fst-feedback,.fst-lab .fst-disclaimer{margin:7px 0;color:var(--fg-soft,#52606d);}",
      ".fst-lab .fst-preset-grid,.fst-lab .fst-action-row{display:flex;flex-wrap:wrap;gap:8px;}",
      ".fst-lab .fst-preset-grid{margin:12px 0;}",
      ".fst-lab .fst-preset-grid button{flex:1 1 145px;text-align:left;}",
      ".fst-lab .fst-preset-grid small{display:block;margin-top:3px;color:var(--fg-soft,#52606d);font-size:11px;font-weight:400;line-height:1.3;}",
      ".fst-lab .fst-preset-grid button[aria-pressed=true] small{color:#e7f3fb;}",
      ".fst-lab .fst-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px 16px;margin:14px 0;}",
      ".fst-lab .fst-control{display:grid;align-content:start;gap:5px;min-width:0;}",
      ".fst-lab .fst-control label{color:var(--fg-soft,#52606d);font-size:12px;font-weight:700;}",
      ".fst-lab .fst-control output{color:var(--accent,#1769aa);font-variant-numeric:tabular-nums;}",
      ".fst-lab select{min-height:46px;width:100%;padding:8px 10px;border:1px solid var(--border,#bbc7d1);border-radius:6px;background:var(--bg,#fff);color:inherit;}",
      ".fst-lab input[type=range]{width:100%;min-height:44px;accent-color:var(--accent,#1769aa);}",
      ".fst-lab .fst-predict{margin:14px 0;padding:12px 14px;border-left:3px solid var(--cl-gold,#b7791f);background:var(--bg-soft,#f5f7f9);}",
      ".fst-lab .fst-predict-title{margin:0 0 8px;font-weight:700;}",
      ".fst-lab .fst-question{margin:12px 0 0;padding:0;border:0;}",
      ".fst-lab .fst-question legend{margin-bottom:7px;color:var(--fg,#1f2933);font-weight:700;}",
      ".fst-lab .fst-choice{display:flex;flex-wrap:wrap;gap:8px;}",
      ".fst-lab .fst-choice button{flex:1 1 180px;min-width:0;text-align:left;}",
      ".fst-lab .fst-feedback{min-height:1.7em;font-weight:700;}",
      ".fst-lab .fst-pass{color:var(--cl-green,#087f5b);}",
      ".fst-lab .fst-warn{color:var(--cl-red,#b42318);}",
      ".fst-lab .fst-result{margin-top:16px;padding-top:14px;border-top:1px solid var(--border,#bbc7d1);}",
      ".fst-lab .fst-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0;}",
      ".fst-lab .fst-metric{min-width:0;padding:9px;border-top:2px solid var(--border,#bbc7d1);background:var(--bg-soft,#f5f7f9);}",
      ".fst-lab .fst-metric span{display:block;color:var(--fg-soft,#52606d);font-size:11px;}",
      ".fst-lab .fst-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}",
      ".fst-lab .fst-result-grid{display:grid;grid-template-columns:minmax(220px,.9fr) minmax(0,1.1fr);gap:14px;align-items:start;}",
      ".fst-lab .fst-figure{min-width:0;margin:0;}",
      ".fst-lab svg{display:block;width:100%;height:auto;border:1px solid var(--border,#bbc7d1);border-radius:6px;background:var(--bg-soft,#f5f7f9);}",
      ".fst-lab svg text{fill:var(--fg,#1f2933);font-family:inherit;letter-spacing:0;}",
      ".fst-lab .fst-domain{fill:var(--cl-blue-soft,#dceef8);fill-opacity:.82;stroke:var(--accent,#1769aa);stroke-width:2;}",
      ".fst-lab .fst-boundary{fill:none;stroke:var(--cl-red,#b42318);stroke-width:3;}",
      ".fst-lab .fst-hole{fill:var(--bg,#fff);stroke:var(--cl-red,#b42318);stroke-width:2;}",
      ".fst-lab .fst-ray{stroke:var(--cl-gold,#b7791f);stroke-width:1.5;stroke-dasharray:4 4;}",
      ".fst-lab .fst-ledger{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:13px;}",
      ".fst-lab table{width:100%;min-width:510px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}",
      ".fst-lab th,.fst-lab td{padding:7px 8px;border-bottom:1px solid var(--border,#bbc7d1);text-align:left;vertical-align:top;}",
      ".fst-lab th{color:var(--fg-soft,#52606d);font-size:11px;}",
      ".fst-lab .fst-formula{margin:10px 0;padding:10px 12px;overflow:auto;background:var(--bg-soft,#f5f7f9);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;white-space:pre-wrap;overflow-wrap:anywhere;}",
      ".fst-lab .fst-check{margin:10px 0;padding:9px 11px;border-left:3px solid var(--cl-green,#087f5b);background:var(--bg-soft,#f5f7f9);}",
      ".fst-lab .fst-sr-only{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important;}",
      "@media(max-width:760px){.fst-lab .fst-controls,.fst-lab .fst-result-grid{grid-template-columns:minmax(0,1fr);}.fst-lab .fst-metrics{grid-template-columns:repeat(2,minmax(0,1fr));}}",
      "@media(max-width:430px){.fst-lab .fst-metrics{grid-template-columns:minmax(0,1fr);}.fst-lab table{font-size:11px;}.fst-lab .fst-choice button{flex-basis:100%;}}",
      "@media(prefers-reduced-motion:reduce){.fst-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important;}}"
    ].join("\n");

    function fail(message) {
      throw new Error("forms-stokes: " + message);
    }

    function finite(value, fallback) {
      var number = Number(value);
      return isFinite(number) ? number : fallback;
    }

    function integer(value, fallback, minimum, maximum) {
      var number = Math.floor(finite(value, fallback));
      if (number < minimum) number = minimum;
      if (number > maximum) number = maximum;
      return number;
    }

    function clamp(value, minimum, maximum) {
      return Math.max(minimum, Math.min(maximum, value));
    }

    function presetById(id) {
      var index;
      for (index = 0; index < PRESETS.length; index += 1) {
        if (PRESETS[index].id === id) return PRESETS[index];
      }
      fail("unknown preset: " + id);
    }

    function mapPoint(id, u, v) {
      if (id === "square") return { x: u, y: v, xu: 1, xv: 0, yu: 0, yv: 1, jacobian: 1 };
      if (id === "reverse") return { x: u, y: 1 - v, xu: 1, xv: 0, yu: 0, yv: -1, jacobian: -1 };
      if (id === "deformed") {
        return {
          x: u,
          y: (1 - u / 2) * v,
          xu: 1,
          xv: 0,
          yu: -v / 2,
          yv: 1 - u / 2,
          jacobian: 1 - u / 2
        };
      }
      fail("map is not defined for " + id);
    }

    function pullbackData(id, u, v, scale) {
      var map = mapPoint(id, u, v);
      return {
        x: map.x,
        y: map.y,
        a: scale * map.x * map.yu,
        b: scale * map.x * map.yv,
        jacobian: map.jacobian,
        dCoefficient: scale * map.jacobian
      };
    }

    function integrateSegment(id, from, to, steps, scale) {
      var du = (to[0] - from[0]) / steps;
      var dv = (to[1] - from[1]) / steps;
      var total = 0;
      var index;
      for (index = 0; index < steps; index += 1) {
        var u = from[0] + (index + 0.5) * du;
        var v = from[1] + (index + 0.5) * dv;
        var data = pullbackData(id, u, v, scale);
        total += data.a * du + data.b * dv;
      }
      return total;
    }

    function boundaryIntegral(id, steps, scale) {
      var edges = [
        [[0, 0], [1, 0]],
        [[1, 0], [1, 1]],
        [[1, 1], [0, 1]],
        [[0, 1], [0, 0]]
      ];
      var total = 0;
      edges.forEach(function (edge) {
        total += integrateSegment(id, edge[0], edge[1], steps, scale);
      });
      return total;
    }

    function areaIntegral(id, steps, scale) {
      var cell = 1 / steps;
      var total = 0;
      var row;
      var column;
      for (row = 0; row < steps; row += 1) {
        for (column = 0; column < steps; column += 1) {
          var u = (column + 0.5) * cell;
          var v = (row + 0.5) * cell;
          total += pullbackData(id, u, v, scale).dCoefficient * cell * cell;
        }
      }
      return total;
    }

    function angleIntegral(steps, scale, radius) {
      var delta = (2 * Math.PI) / steps;
      var total = 0;
      var index;
      var r = finite(radius, 1);
      for (index = 0; index < steps; index += 1) {
        var theta = (index + 0.5) * delta;
        var x = r * Math.cos(theta);
        var y = r * Math.sin(theta);
        var dx = -r * Math.sin(theta) * delta;
        var dy = r * Math.cos(theta) * delta;
        var denominator = x * x + y * y;
        var p = (-scale * y) / denominator;
        var q = (scale * x) / denominator;
        total += p * dx + q * dy;
      }
      return total;
    }

    function exactValues(id, scale) {
      if (id === "square") return { line: scale, area: scale };
      if (id === "reverse") return { line: -scale, area: -scale };
      if (id === "deformed") return { line: scale * 0.75, area: scale * 0.75 };
      if (id === "punctured-loop") return { line: 2 * Math.PI * scale, area: null };
      fail("no exact value for " + id);
    }

    function expression(id, scale) {
      var c = format(scale, 3);
      if (id === "square") {
        return {
          pullback: c + " u dv",
          dPullback: c + " du wedge dv",
          pullbackD: c + " du wedge dv"
        };
      }
      if (id === "reverse") {
        return {
          pullback: "-" + c + " u dv",
          dPullback: "-" + c + " du wedge dv",
          pullbackD: "-" + c + " du wedge dv"
        };
      }
      if (id === "deformed") {
        return {
          pullback: "-" + c + "/2 uv du + " + c + " u(1-u/2) dv",
          dPullback: c + "(1-u/2) du wedge dv",
          pullbackD: c + "(1-u/2) du wedge dv"
        };
      }
      return {
        pullback: "alpha on the circle of radius r",
        dPullback: "local d alpha = 0",
        pullbackD: "not an area-form comparison: the puncture is present"
      };
    }

    function compute(id, options) {
      var preset = presetById(id);
      var settings = options || {};
      var steps = integer(settings.grid, 16, 2, 96);
      var scale = finite(settings.scale, 1);
      var radius = clamp(finite(settings.radius, 1), 0.25, 2.5);
      var exact = exactValues(id, scale);
      var line;
      var area;
      if (id === "punctured-loop") {
        line = angleIntegral(steps, scale, radius);
        area = null;
      } else {
        line = boundaryIntegral(id, steps, scale);
        area = areaIntegral(id, steps, scale);
      }
      var difference = area === null ? null : line - area;
      return {
        id: id,
        label: preset.label,
        kind: preset.kind,
        grid: steps,
        scale: scale,
        radius: radius,
        line: line,
        area: area,
        exactLine: exact.line,
        exactArea: exact.area,
        difference: difference,
        pullback: expression(id, scale),
        closed: id === "punctured-loop",
        exactForm: id !== "punctured-loop",
        stokesEligible: id !== "punctured-loop",
        boundaryInduced: id !== "punctured-loop"
      };
    }

    function gridRows(id, scale, radius) {
      var values = id === "punctured-loop" ? [4, 8, 16, 32, 64] : [2, 4, 8, 16, 32];
      return values.map(function (grid) {
        var result = compute(id, { grid: grid, scale: scale, radius: radius });
        return {
          grid: grid,
          line: result.line,
          area: result.area,
          difference: result.difference
        };
      });
    }

    function format(value, digits) {
      if (value === null || value === undefined) return "not applicable";
      if (!isFinite(value)) return "infinity";
      var places = digits === undefined ? 5 : digits;
      if (Math.abs(value) < 0.0000000005) return "0";
      if (Math.abs(value) > 100000) return value.toExponential(2);
      return Number(value.toFixed(places)).toString();
    }

    function element(doc, tag, className, text) {
      var node = doc.createElement(tag);
      if (className) node.className = className;
      if (text !== undefined) node.textContent = text;
      return node;
    }

    function svgElement(doc, tag, attributes, text) {
      var node = doc.createElementNS(SVG_NS, tag);
      Object.keys(attributes || {}).forEach(function (key) {
        node.setAttribute(key, String(attributes[key]));
      });
      if (text !== undefined) node.textContent = text;
      return node;
    }

    function installStyles(doc) {
      if (doc.getElementById(STYLE_ID)) return;
      var style = element(doc, "style");
      style.id = STYLE_ID;
      style.textContent = STYLE_TEXT;
      (doc.head || doc.documentElement).appendChild(style);
    }

    function metric(doc, label, value) {
      var node = element(doc, "div", "fst-metric");
      node.appendChild(element(doc, "span", "", label));
      node.appendChild(element(doc, "strong", "", value));
      return node;
    }

    function announce(api, root, message) {
      if (api && typeof api.announce === "function") api.announce(root, message);
    }

    function addOption(doc, select, value, label) {
      var option = element(doc, "option", "", label);
      option.value = value;
      select.appendChild(option);
    }

    function buildSvg(doc, result) {
      var svg = svgElement(doc, "svg", {
        viewBox: "0 0 620 300",
        role: "img",
        "aria-label": result.label + " 的定向边界示意图"
      });
      svg.appendChild(svgElement(doc, "title", {}, result.label + " 的定向边界示意图"));
      var defs = svgElement(doc, "defs", {});
      var marker = svgElement(doc, "marker", {
        id: "fst-arrow-" + INSTANCE,
        markerWidth: 8,
        markerHeight: 8,
        refX: 7,
        refY: 4,
        orient: "auto",
        markerUnits: "strokeWidth"
      });
      marker.appendChild(svgElement(doc, "path", { d: "M0,0 L8,4 L0,8 Z", fill: "#b42318" }));
      defs.appendChild(marker);
      svg.appendChild(defs);
      if (result.id === "punctured-loop") {
        svg.appendChild(svgElement(doc, "circle", { cx: 300, cy: 150, r: 88, class: "fst-domain" }));
        svg.appendChild(svgElement(doc, "circle", { cx: 300, cy: 150, r: 17, class: "fst-hole" }));
        svg.appendChild(svgElement(doc, "line", { x1: 300, y1: 150, x2: 388, y2: 150, class: "fst-ray" }));
        svg.appendChild(svgElement(doc, "path", {
          d: "M300 62 A88 88 0 0 1 388 150",
          class: "fst-boundary",
          "marker-end": "url(#fst-arrow-" + INSTANCE + ")"
        }));
        svg.appendChild(svgElement(doc, "text", { x: 300, y: 145, "text-anchor": "middle", "font-size": 12 }, "hole"));
        svg.appendChild(svgElement(doc, "text", { x: 401, y: 146, "font-size": 13 }, "r"));
        svg.appendChild(svgElement(doc, "text", { x: 28, y: 28, "font-size": 14, "font-weight": 700 }, "closed loop, no filled domain in the punctured plane"));
        return svg;
      }

      var corners = [[0, 0], [1, 0], [1, 1], [0, 1]];
      var mapped = corners.map(function (point) {
        var m = mapPoint(result.id, point[0], point[1]);
        return { x: 125 + 350 * m.x, y: 245 - 190 * m.y };
      });
      var points = mapped.map(function (point) { return point.x + "," + point.y; }).join(" ");
      svg.appendChild(svgElement(doc, "polygon", { points: points, class: "fst-domain" }));
      var parameterEdges = [
        [[0, 0], [1, 0]],
        [[1, 0], [1, 1]],
        [[1, 1], [0, 1]],
        [[0, 1], [0, 0]]
      ];
      parameterEdges.forEach(function (edge) {
        var start = mapPoint(result.id, edge[0][0], edge[0][1]);
        var end = mapPoint(result.id, edge[1][0], edge[1][1]);
        svg.appendChild(svgElement(doc, "line", {
          x1: 125 + 350 * start.x,
          y1: 245 - 190 * start.y,
          x2: 125 + 350 * end.x,
          y2: 245 - 190 * end.y,
          class: "fst-boundary",
          "marker-end": "url(#fst-arrow-" + INSTANCE + ")"
        }));
      });
      svg.appendChild(svgElement(doc, "text", { x: 28, y: 28, "font-size": 14, "font-weight": 700 }, "red arrows = induced boundary orientation"));
      svg.appendChild(svgElement(doc, "text", { x: 28, y: 278, "font-size": 12 }, "blue fill = image of the parameter square; sign(J) controls orientation"));
      return svg;
    }

    function buildLedger(doc, result) {
      var wrapper = element(doc, "div", "fst-ledger");
      var table = element(doc, "table");
      var head = element(doc, "thead");
      var headRow = element(doc, "tr");
      ["网格步数", "边界线积分", result.area === null ? "面积积分" : "内部面积积分", "两边差值"].forEach(function (label) {
        headRow.appendChild(element(doc, "th", "", label));
      });
      head.appendChild(headRow);
      table.appendChild(head);
      var body = element(doc, "tbody");
      gridRows(result.id, result.scale, result.radius).forEach(function (row) {
        var tr = element(doc, "tr");
        [String(row.grid), format(row.line), format(row.area), format(row.difference)].forEach(function (value) {
          tr.appendChild(element(doc, "td", "", value));
        });
        body.appendChild(tr);
      });
      table.appendChild(body);
      wrapper.appendChild(table);
      return wrapper;
    }

    function buildResult(doc, result) {
      var section = element(doc, "section", "fst-result");
      var heading = element(doc, "h4", "", "揭示后的形式与数值账本");
      heading.id = "fst-result-title-" + INSTANCE;
      section.setAttribute("aria-labelledby", heading.id);
      section.appendChild(heading);
      var metrics = element(doc, "div", "fst-metrics");
      metrics.appendChild(metric(doc, "当前边界线积分", format(result.line)));
      metrics.appendChild(metric(doc, "当前面积积分", format(result.area)));
      metrics.appendChild(metric(doc, "精确参考值", format(result.exactLine)));
      metrics.appendChild(metric(doc, "线减面积", format(result.difference)));
      section.appendChild(metrics);
      var resultGrid = element(doc, "div", "fst-result-grid");
      var figure = element(doc, "figure", "fst-figure");
      figure.appendChild(buildSvg(doc, result));
      figure.appendChild(element(doc, "figcaption", "fst-note", "有限网格/多边形只提供当前离散证据；红色箭头显示参数域诱导的边界方向。"));
      resultGrid.appendChild(figure);
      var ledgerColumn = element(doc, "div");
      var formula = result.pullback.pullback + "\n" +
        "d(pullback) = " + result.pullback.dPullback + "\n" +
        "pullback(d omega) = " + result.pullback.pullbackD;
      ledgerColumn.appendChild(element(doc, "div", "fst-formula", formula));
      var checkText = result.stokesEligible
        ? "形式恒等式检查：d(pullback omega) 与 pullback(d omega) 的系数相同；当前区域满足本实验的光滑参数化与诱导边界方向模型。"
        : "局部闭性检查：d alpha=0，但这里没有可直接填入的光滑单值区域；非零绕孔积分是闭而不恰当的拓扑证据。";
      ledgerColumn.appendChild(element(doc, "p", "fst-check", checkText));
      ledgerColumn.appendChild(buildLedger(doc, result));
      ledgerColumn.appendChild(element(doc, "p", "fst-disclaimer", result.stokesEligible
        ? "解释：网格越密，数值通常越接近精确值；这仍不是 d^2=0 或 Stokes 定理的证明。"
        : "解释：角度形式的线积分与半径无关；有限多边形逼近不能把局部闭性升级为全局恰当性。"));
      resultGrid.appendChild(ledgerColumn);
      section.appendChild(resultGrid);
      return section;
    }

    function freshState() {
      return {
        presetId: "square",
        grid: 16,
        scale: 1,
        radius: 1,
        answers: {},
        revealed: false
      };
    }

    function mount(root, api) {
      if (!root || !root.ownerDocument) return;
      var doc = root.ownerDocument;
      var serial = INSTANCE + 1;
      INSTANCE = serial;
      installStyles(doc);
      var state = freshState();

      function reset() {
        state = freshState();
        render();
        announce(api, root, "已重置为正向单位方形，预测结果重新隐藏。");
      }

      function choosePreset(id) {
        state.presetId = id;
        state.answers = {};
        state.revealed = false;
        render();
        announce(api, root, "已切换对象；请重新完成三道预测。");
      }

      function render() {
        var result = compute(state.presetId, state);
        var shell = element(doc, "div", "fst-lab");
        shell.appendChild(element(doc, "h3", "fst-heading", "微分形式与 Stokes：先押方向，再对账"));
        shell.appendChild(element(doc, "p", "fst-note", "当前计算只使用无依赖的有限网格/多边形近似。结果揭示前不显示积分值；请把它当作证书账本，而不是定理证明器。"));

        var presets = element(doc, "div", "fst-preset-grid");
        PRESETS.forEach(function (preset) {
          var button = element(doc, "button", "", preset.label);
          button.type = "button";
          button.setAttribute("aria-pressed", preset.id === state.presetId ? "true" : "false");
          button.setAttribute("aria-label", "选择" + preset.label);
          button.appendChild(element(doc, "small", "", preset.description));
          button.addEventListener("click", function () { choosePreset(preset.id); });
          presets.appendChild(button);
        });
        shell.appendChild(presets);

        var controls = element(doc, "div", "fst-controls");
        var objectControl = element(doc, "div", "fst-control");
        objectControl.appendChild(element(doc, "label", "", "当前对象"));
        var objectSelect = element(doc, "select");
        PRESETS.forEach(function (preset) { addOption(doc, objectSelect, preset.id, preset.label); });
        objectSelect.value = state.presetId;
        objectSelect.addEventListener("change", function (event) { choosePreset(event.target.value); });
        objectControl.appendChild(objectSelect);
        controls.appendChild(objectControl);

        var scaleControl = element(doc, "div", "fst-control");
        var scaleLabel = element(doc, "label", "", "形式系数 c：");
        var scaleOutput = element(doc, "output", "", format(state.scale, 2));
        scaleLabel.appendChild(scaleOutput);
        scaleControl.appendChild(scaleLabel);
        var scaleInput = element(doc, "input");
        scaleInput.type = "range";
        scaleInput.min = "0.5";
        scaleInput.max = "2";
        scaleInput.step = "0.25";
        scaleInput.value = String(state.scale);
        scaleInput.setAttribute("aria-label", "形式系数 c");
        scaleInput.addEventListener("input", function (event) {
          state.scale = finite(event.target.value, 1);
          state.revealed = false;
          render();
        });
        scaleControl.appendChild(scaleInput);
        controls.appendChild(scaleControl);

        var gridControl = element(doc, "div", "fst-control");
        var gridLabel = element(doc, "label", "", "网格步数 n：");
        var gridOutput = element(doc, "output", "", String(state.grid));
        gridLabel.appendChild(gridOutput);
        gridControl.appendChild(gridLabel);
        var gridInput = element(doc, "input");
        gridInput.type = "range";
        gridInput.min = "2";
        gridInput.max = "64";
        gridInput.step = "2";
        gridInput.value = String(state.grid);
        gridInput.setAttribute("aria-label", "有限网格步数 n");
        gridInput.addEventListener("input", function (event) {
          state.grid = integer(event.target.value, 16, 2, 64);
          state.revealed = false;
          render();
        });
        gridControl.appendChild(gridInput);
        controls.appendChild(gridControl);

        if (state.presetId === "punctured-loop") {
          var radiusControl = element(doc, "div", "fst-control");
          var radiusLabel = element(doc, "label", "", "绕孔半径 r：");
          var radiusOutput = element(doc, "output", "", format(state.radius, 2));
          radiusLabel.appendChild(radiusOutput);
          radiusControl.appendChild(radiusLabel);
          var radiusInput = element(doc, "input");
          radiusInput.type = "range";
          radiusInput.min = "0.25";
          radiusInput.max = "2.5";
          radiusInput.step = "0.25";
          radiusInput.value = String(state.radius);
          radiusInput.setAttribute("aria-label", "绕孔半径 r");
          radiusInput.addEventListener("input", function (event) {
            state.radius = finite(event.target.value, 1);
            state.revealed = false;
            render();
          });
          radiusControl.appendChild(radiusInput);
          controls.appendChild(radiusControl);
        }
        shell.appendChild(controls);

        var prediction = element(doc, "div", "fst-predict");
        prediction.appendChild(element(doc, "p", "fst-predict-title", "先预测：三道题全部选择后，结果才可揭示。"));
        PREDICTIONS.forEach(function (question, questionIndex) {
          var fieldset = element(doc, "fieldset", "fst-question");
          var legend = element(doc, "legend", "", (questionIndex + 1) + ". " + question.prompt);
          fieldset.appendChild(legend);
          var choices = element(doc, "div", "fst-choice");
          question.options.forEach(function (option) {
            var choice = element(doc, "button", "", option.label);
            choice.type = "button";
            choice.setAttribute("aria-pressed", state.answers[question.id] === option.id ? "true" : "false");
            choice.addEventListener("click", function () {
              state.answers[question.id] = option.id;
              state.revealed = false;
              render();
            });
            choices.appendChild(choice);
          });
          fieldset.appendChild(choices);
          prediction.appendChild(fieldset);
        });
        shell.appendChild(prediction);

        var actionRow = element(doc, "div", "fst-action-row");
        var reveal = element(doc, "button", "fst-primary", "揭示结果");
        reveal.type = "button";
        var complete = PREDICTIONS.every(function (question) { return state.answers[question.id]; });
        reveal.disabled = !complete;
        reveal.addEventListener("click", function () {
          if (!complete) return;
          state.revealed = true;
          render();
          announce(api, root, "结果已揭示：请比较 pullback 两边和有限网格误差。");
        });
        actionRow.appendChild(reveal);
        var resetButton = element(doc, "button", "", "重置");
        resetButton.type = "button";
        resetButton.addEventListener("click", reset);
        actionRow.appendChild(resetButton);
        shell.appendChild(actionRow);

        var feedback = element(doc, "p", "fst-feedback");
        if (!complete) {
          feedback.textContent = "预测尚未完成，数值与图表保持隐藏。";
        } else if (!state.revealed) {
          feedback.textContent = "三道预测已提交；现在可以揭示账本。";
        } else {
          var score = PREDICTIONS.reduce(function (total, question) {
            return total + (state.answers[question.id] === question.answer ? 1 : 0);
          }, 0);
          feedback.className = "fst-feedback " + (score === PREDICTIONS.length ? "fst-pass" : "fst-warn");
          feedback.textContent = "预测得分 " + score + "/" + PREDICTIONS.length + "；先解释结构，再读近似数值。";
        }
        shell.appendChild(feedback);
        if (state.revealed) shell.appendChild(buildResult(doc, result));
        else shell.appendChild(element(doc, "p", "fst-disclaimer", "结果锁定：提交预测后才能看到 SVG、表格和形式对账。"));
        while (root.firstChild) root.removeChild(root.firstChild);
        root.appendChild(shell);
      }

      render();
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) {
        checks += 1;
        if (!condition) fail(message);
      }
      function close(left, right, tolerance) {
        return Math.abs(left - right) <= tolerance;
      }
      check(PRESETS.length === 4, "four presets are available");
      var square = compute("square", { grid: 16, scale: 1 });
      check(close(square.line, 1, 1e-10), "square boundary integral");
      check(close(square.area, 1, 1e-10), "square area integral");
      check(close(square.difference, 0, 1e-10), "square Stokes difference");
      var deformed = compute("deformed", { grid: 32, scale: 2 });
      check(close(deformed.line, 1.5, 0.002), "deformed pullback line integral");
      check(close(deformed.area, 1.5, 1e-10), "deformed pullback area integral");
      check(deformed.pullback.dPullback === deformed.pullback.pullbackD, "pullback commutes with d");
      var reverse = compute("reverse", { grid: 16, scale: 1.5 });
      check(close(reverse.line, -1.5, 1e-10), "reverse boundary orientation");
      check(close(reverse.area, -1.5, 1e-10), "reverse area orientation");
      check(reverse.boundaryInduced, "reverse keeps induced boundary model");
      var loop = compute("punctured-loop", { grid: 64, scale: 1, radius: 1.75 });
      check(close(loop.line, 2 * Math.PI, 0.01), "angle form winding integral");
      check(loop.area === null && loop.closed && !loop.exactForm, "punctured-loop boundary");
      check(!loop.stokesEligible, "punctured-loop is not a filled Stokes example");
      check(gridRows("deformed", 1, 1).length === 5, "finite grid ledger rows");
      return { ok: true, checks: checks, presets: PRESETS.length };
    }

    var exported = {
      PRESETS: PRESETS,
      PREDICTIONS: PREDICTIONS,
      mapPoint: mapPoint,
      compute: compute,
      gridRows: gridRows,
      selfTest: selfTest,
      mount: mount
    };

    return exported;
  }
);
