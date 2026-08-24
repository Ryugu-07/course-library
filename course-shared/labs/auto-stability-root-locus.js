(function (root, factory) {
  "use strict";

  var exported = factory(root);

  if (typeof module === "object" && module.exports) {
    module.exports = exported;
  }

  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("auto-stability-root-locus", exported.mount);
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
        "auto-stability-root-locus self-test: PASS (" +
          report.checks +
          " checks)"
      );
    } catch (error) {
      console.error("auto-stability-root-locus self-test: FAIL\n" + error.stack);
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

    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "auto-stability-root-locus-styles";
    var EPS = 1e-9;
    var INSTANCE = 0;
    var DEFAULTS = {
      k: 18,
      scanK: 60,
      samples: 61
    };

    var STYLE_TEXT = [
      '[data-learning-lab="auto-stability-root-locus"]{--as-blue:var(--cl-blue,#315f9d);--as-gold:var(--cl-gold,#9b6a12);--as-green:var(--cl-green,#39734d);--as-red:var(--cl-red,#b64335);display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
      '[data-learning-lab="auto-stability-root-locus"] *{box-sizing:border-box}[data-learning-lab="auto-stability-root-locus"] [hidden]{display:none!important}',
      '[data-learning-lab="auto-stability-root-locus"] h3,[data-learning-lab="auto-stability-root-locus"] h4{margin:0;color:var(--fg,currentColor);letter-spacing:0}[data-learning-lab="auto-stability-root-locus"] h3{font-size:1.16rem}[data-learning-lab="auto-stability-root-locus"] h4{margin-top:16px;font-size:1rem}',
      '[data-learning-lab="auto-stability-root-locus"] p{margin:8px 0}[data-learning-lab="auto-stability-root-locus"] .as-note,[data-learning-lab="auto-stability-root-locus"] .as-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
      '[data-learning-lab="auto-stability-root-locus"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="auto-stability-root-locus"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}',
      '[data-learning-lab="auto-stability-root-locus"] .as-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="auto-stability-root-locus"] button,[data-learning-lab="auto-stability-root-locus"] select,[data-learning-lab="auto-stability-root-locus"] input{font:inherit}',
      '[data-learning-lab="auto-stability-root-locus"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="auto-stability-root-locus"] button:hover{border-color:var(--accent,#315f9d)}[data-learning-lab="auto-stability-root-locus"] button[aria-pressed="true"],[data-learning-lab="auto-stability-root-locus"] .as-primary{border-color:var(--accent,#315f9d);background:var(--accent,#315f9d);color:var(--bg,#fff);font-weight:750}',
      '[data-learning-lab="auto-stability-root-locus"] button:focus-visible,[data-learning-lab="auto-stability-root-locus"] select:focus-visible,[data-learning-lab="auto-stability-root-locus"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="auto-stability-root-locus"] button:disabled{cursor:not-allowed;opacity:.55}',
      '[data-learning-lab="auto-stability-root-locus"] .as-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="auto-stability-root-locus"] .as-actions>*{flex:1 1 170px}[data-learning-lab="auto-stability-root-locus"] .as-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="auto-stability-root-locus"] .as-pass{color:var(--as-green)}[data-learning-lab="auto-stability-root-locus"] .as-warn{color:var(--as-red)}',
      '[data-learning-lab="auto-stability-root-locus"] .as-layout{display:grid;grid-template-columns:minmax(210px,.68fr) minmax(0,1.32fr);gap:16px;align-items:start;min-width:0}[data-learning-lab="auto-stability-root-locus"] .as-controls,[data-learning-lab="auto-stability-root-locus"] .as-stage{min-width:0}[data-learning-lab="auto-stability-root-locus"] .as-controls{display:grid;gap:11px;padding:12px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="auto-stability-root-locus"] .as-control{display:grid;gap:5px;min-width:0}[data-learning-lab="auto-stability-root-locus"] .as-control label{color:var(--fg-soft,currentColor);font-size:13px;font-weight:700}[data-learning-lab="auto-stability-root-locus"] .as-control output{color:var(--accent,#315f9d);font-variant-numeric:tabular-nums}',
      '[data-learning-lab="auto-stability-root-locus"] input[type="range"]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent,#315f9d)}[data-learning-lab="auto-stability-root-locus"] .as-stage-frame{min-width:0;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent);overflow:hidden}[data-learning-lab="auto-stability-root-locus"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="auto-stability-root-locus"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
      '[data-learning-lab="auto-stability-root-locus"] .as-grid{stroke:var(--border,#cbd5e1);stroke-width:1;stroke-opacity:.7}[data-learning-lab="auto-stability-root-locus"] .as-axis{stroke:currentColor;stroke-width:1.2;stroke-opacity:.78}[data-learning-lab="auto-stability-root-locus"] .as-branch-one{fill:none;stroke:var(--as-blue);stroke-width:2.5}[data-learning-lab="auto-stability-root-locus"] .as-branch-two{fill:none;stroke:var(--as-gold);stroke-width:2.5}[data-learning-lab="auto-stability-root-locus"] .as-branch-three{fill:none;stroke:var(--as-green);stroke-width:2.5}[data-learning-lab="auto-stability-root-locus"] .as-imaginary{stroke:var(--as-red);stroke-width:1.8;stroke-dasharray:5 4}[data-learning-lab="auto-stability-root-locus"] .as-open-pole{fill:var(--bg,#fff);stroke:var(--as-red);stroke-width:2}[data-learning-lab="auto-stability-root-locus"] .as-current-pole{fill:var(--as-red);stroke:var(--bg,#fff);stroke-width:2}[data-learning-lab="auto-stability-root-locus"] .as-label{font-size:11px}[data-learning-lab="auto-stability-root-locus"] .as-small{font-size:10px;fill:var(--fg-soft,currentColor)!important}',
      '[data-learning-lab="auto-stability-root-locus"] .as-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:12px 0}[data-learning-lab="auto-stability-root-locus"] .as-metric{min-width:0;padding:9px;border-top:2px solid var(--border,#cbd5e1);background:var(--bg,transparent)}[data-learning-lab="auto-stability-root-locus"] .as-metric:nth-child(3n+1){border-color:var(--as-blue)}[data-learning-lab="auto-stability-root-locus"] .as-metric:nth-child(3n+2){border-color:var(--as-gold)}[data-learning-lab="auto-stability-root-locus"] .as-metric:nth-child(3n){border-color:var(--as-green)}[data-learning-lab="auto-stability-root-locus"] .as-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11.5px}[data-learning-lab="auto-stability-root-locus"] .as-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
      '[data-learning-lab="auto-stability-root-locus"] .as-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="auto-stability-root-locus"] table{width:100%;min-width:520px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="auto-stability-root-locus"] th,[data-learning-lab="auto-stability-root-locus"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="auto-stability-root-locus"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="auto-stability-root-locus"] .as-certificate{margin-top:11px;padding:10px 12px;border-left:3px solid var(--as-green);background:var(--bg,transparent);font-size:13px;line-height:1.7}[data-learning-lab="auto-stability-root-locus"] .as-certificate.as-blocked{border-color:var(--as-red)}',
      '@media(max-width:900px){[data-learning-lab="auto-stability-root-locus"] .as-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:620px){[data-learning-lab="auto-stability-root-locus"] .as-choice-grid{grid-template-columns:minmax(0,1fr)}}@media(max-width:420px){[data-learning-lab="auto-stability-root-locus"] .as-stage-frame{padding:4px}[data-learning-lab="auto-stability-root-locus"] table{font-size:11px}[data-learning-lab="auto-stability-root-locus"] th,[data-learning-lab="auto-stability-root-locus"] td{padding-left:4px;padding-right:4px}}@media(prefers-reduced-motion:reduce){[data-learning-lab="auto-stability-root-locus"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}'
    ].join("");

    function assert(condition, message) {
      if (!condition) throw new Error(message);
    }

    function finite(value, label) {
      var number = Number(value);
      if (!Number.isFinite(number)) throw new RangeError(label + " must be finite");
      return number;
    }

    function clamp(value, low, high) {
      return Math.max(low, Math.min(high, value));
    }

    function nearly(left, right, tolerance) {
      var scale = Math.max(1, Math.abs(left), Math.abs(right));
      return Math.abs(left - right) <= (tolerance || 1e-8) * scale;
    }

    function cbrt(value) {
      if (value === 0) return 0;
      return value < 0 ? -Math.pow(-value, 1 / 3) : Math.pow(value, 1 / 3);
    }

    function normalizeConfig(input) {
      var source = input || {};
      var k = finite(source.k === undefined ? DEFAULTS.k : source.k, "K");
      var scanK = finite(source.scanK === undefined ? DEFAULTS.scanK : source.scanK, "scanK");
      var samples = Math.round(finite(source.samples === undefined ? DEFAULTS.samples : source.samples, "samples"));
      if (k < 0 || k > 80) throw new RangeError("K must be in [0, 80]");
      if (scanK < 30 || scanK > 80) throw new RangeError("scanK must be in [30, 80]");
      if (samples < 31 || samples > 121) throw new RangeError("samples must be in [31, 121]");
      return { k: k, scanK: Math.max(scanK, k), samples: samples };
    }

    function closedLoopPolynomial(k) {
      var gain = finite(k, "K");
      return [1, 6, 5, gain];
    }

    function closedLoopRoots(k) {
      var gain = finite(k, "K");
      var p = -7;
      var q = gain + 6;
      var discriminant = Math.pow(q / 2, 2) + Math.pow(p / 3, 3);
      var roots;
      if (discriminant < -EPS) {
        var radius = 2 * Math.sqrt(-p / 3);
        var argument = (3 * q / (2 * p)) * Math.sqrt(-3 / p);
        var theta = Math.acos(clamp(argument, -1, 1)) / 3;
        roots = [0, 1, 2].map(function (index) {
          return {
            re: radius * Math.cos(theta - 2 * Math.PI * index / 3) - 2,
            im: 0
          };
        });
      } else {
        var rootPart = Math.sqrt(Math.max(0, discriminant));
        var realY = cbrt(-q / 2 + rootPart) + cbrt(-q / 2 - rootPart);
        if (discriminant <= EPS) {
          var repeatedY = -realY / 2;
          roots = [
            { re: realY - 2, im: 0 },
            { re: repeatedY - 2, im: 0 },
            { re: repeatedY - 2, im: 0 }
          ];
        } else {
          var complexReal = -realY / 2 - 2;
          var complexImag = Math.sqrt(Math.max(0, 3 * realY * realY / 4 + p));
          roots = [
            { re: realY - 2, im: 0 },
            { re: complexReal, im: -complexImag },
            { re: complexReal, im: complexImag }
          ];
        }
      }
      roots.sort(function (left, right) {
        if (!nearly(left.re, right.re, 1e-10)) return left.re - right.re;
        return left.im - right.im;
      });
      return roots;
    }

    function routhCertificate(k) {
      var gain = finite(k, "K");
      var firstColumn = [1, 6, (30 - gain) / 6, gain];
      var signs = firstColumn.filter(function (value) { return Math.abs(value) > EPS; }).map(function (value) {
        return value > 0 ? 1 : -1;
      });
      var signChanges = 0;
      for (var i = 1; i < signs.length; i += 1) {
        if (signs[i] !== signs[i - 1]) signChanges += 1;
      }
      var critical = Math.abs(gain - 30) <= EPS;
      return {
        polynomial: closedLoopPolynomial(gain),
        rows: [
          { power: "s^3", entries: [1, 5], first: 1 },
          { power: "s^2", entries: [6, gain], first: 6 },
          { power: "s^1", entries: [(30 - gain) / 6, 0], first: (30 - gain) / 6 },
          { power: "s^0", entries: [gain], first: gain }
        ],
        firstColumn: firstColumn,
        signChanges: signChanges,
        critical: critical,
        auxiliary: critical ? "6s^2 + 30 = 0  ->  s = ±j√5" : ""
      };
    }

    function classifyGain(k) {
      var gain = finite(k, "K");
      if (Math.abs(gain - 30) <= EPS) return "critical";
      if (gain > 0 && gain < 30) return "stable";
      if (gain > 30) return "unstable";
      return "boundary";
    }

    function rootLocus(scanK, samples) {
      var maxK = finite(scanK, "scanK");
      var count = Math.max(2, Math.round(finite(samples, "samples")));
      var branches = [[], [], []];
      var points = [];
      for (var i = 0; i < count; i += 1) {
        var gain = maxK * i / (count - 1);
        var roots = closedLoopRoots(gain);
        points.push({ k: gain, roots: roots });
        roots.forEach(function (root, index) {
          branches[index].push({ k: gain, re: root.re, im: root.im });
        });
      }
      return { points: points, branches: branches };
    }

    function evaluate(input) {
      var config = normalizeConfig(input);
      var routh = routhCertificate(config.k);
      var roots = closedLoopRoots(config.k);
      return {
        config: config,
        roots: roots,
        regime: classifyGain(config.k),
        routh: routh,
        locus: rootLocus(config.scanK, config.samples)
      };
    }

    function formatNumber(value, digits) {
      if (!Number.isFinite(value)) return "—";
      if (Math.abs(value) < 5e-10) return "0";
      var places = digits === undefined ? 3 : digits;
      if (places === 0) return value.toFixed(0);
      var output = value.toFixed(places);
      return output.replace(/0+$/, "").replace(/\.$/, "");
    }

    function formatRoot(root) {
      var real = formatNumber(root.re, 3);
      if (Math.abs(root.im) <= 1e-7) return real;
      return real + (root.im >= 0 ? " + " : " − ") + formatNumber(Math.abs(root.im), 3) + "j";
    }

    function regimeLabel(regime) {
      if (regime === "stable") return "0 < K < 30：渐近稳定";
      if (regime === "critical") return "K = 30：临界稳定";
      if (regime === "unstable") return "K > 30：不稳定";
      return "K = 0：原点极点边界";
    }

    function element(doc, tag, attributes, children) {
      var node = doc.createElement(tag);
      Object.keys(attributes || {}).forEach(function (key) {
        var value = attributes[key];
        if (value === undefined || value === null || value === false) return;
        if (key === "className") node.setAttribute("class", String(value));
        else if (key === "text") node.textContent = String(value);
        else if (value === true) node.setAttribute(key, "");
        else node.setAttribute(key, String(value));
      });
      if (children !== undefined && children !== null) {
        (Array.isArray(children) ? children : [children]).forEach(function (child) {
          if (child === undefined || child === null || child === false) return;
          node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
        });
      }
      return node;
    }

    function svgElement(doc, tag, attributes, children) {
      var node = doc.createElementNS(SVG_NS, tag);
      Object.keys(attributes || {}).forEach(function (key) {
        var value = attributes[key];
        if (value === undefined || value === null || value === false) return;
        if (key === "className") node.setAttribute("class", String(value));
        else node.setAttribute(key, String(value));
      });
      if (children !== undefined && children !== null) {
        (Array.isArray(children) ? children : [children]).forEach(function (child) {
          if (child === undefined || child === null || child === false) return;
          node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
        });
      }
      return node;
    }

    function clear(node) {
      while (node.firstChild) node.removeChild(node.firstChild);
    }

    function installStyles(doc) {
      if (!doc || !doc.createElement || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent = STYLE_TEXT;
      (doc.head || doc.documentElement).appendChild(style);
    }

    function announce(api, rootNode, message) {
      if (api && typeof api.announce === "function") api.announce(rootNode, message);
    }

    function pathFor(points, mapX, mapY) {
      return points.map(function (point, index) {
        return (index ? "L" : "M") + mapX(point.re).toFixed(2) + " " + mapY(point.im).toFixed(2);
      }).join(" ");
    }

    function drawRootLocus(doc, svg, result) {
      clear(svg);
      var width = 720;
      var height = 390;
      var left = 55;
      var right = 18;
      var top = 32;
      var bottom = 45;
      var xMin = -10;
      var xMax = 3;
      var yMin = -9;
      var yMax = 9;
      var mapX = function (value) { return left + (value - xMin) / (xMax - xMin) * (width - left - right); };
      var mapY = function (value) { return top + (yMax - value) / (yMax - yMin) * (height - top - bottom); };
      svg.appendChild(svgElement(doc, "title", {}, "L(s)=K/[s(s+1)(s+5)] 的根轨迹与当前闭环极点"));
      svg.appendChild(svgElement(doc, "desc", {}, "蓝、金、绿三条分支显示 K 从零增大时的三根，红色虚线为虚轴。"));
      [-8, -6, -4, -2, 0, 2].forEach(function (value) {
        svg.appendChild(svgElement(doc, "line", {
          x1: mapX(value), y1: top, x2: mapX(value), y2: height - bottom,
          class: value === 0 ? "as-axis" : "as-grid"
        }));
        svg.appendChild(svgElement(doc, "text", { x: mapX(value), y: height - 23, "text-anchor": "middle", class: "as-small" }, String(value)));
      });
      [-8, -4, 0, 4, 8].forEach(function (value) {
        svg.appendChild(svgElement(doc, "line", {
          x1: left, y1: mapY(value), x2: width - right, y2: mapY(value),
          class: value === 0 ? "as-axis" : "as-grid"
        }));
        if (value !== 0) svg.appendChild(svgElement(doc, "text", { x: left - 8, y: mapY(value) + 4, "text-anchor": "end", class: "as-small" }, String(value)));
      });
      svg.appendChild(svgElement(doc, "line", { x1: mapX(0), y1: top, x2: mapX(0), y2: height - bottom, class: "as-imaginary" }));
      result.locus.branches.forEach(function (branch, index) {
        svg.appendChild(svgElement(doc, "path", {
          d: pathFor(branch, mapX, mapY),
          class: "as-branch-" + ["one", "two", "three"][index]
        }));
      });
      [-5, -1, 0].forEach(function (value) {
        svg.appendChild(svgElement(doc, "circle", { cx: mapX(value), cy: mapY(0), r: 5, class: "as-open-pole" }));
      });
      result.roots.forEach(function (root) {
        svg.appendChild(svgElement(doc, "circle", { cx: mapX(root.re), cy: mapY(root.im), r: 5.5, class: "as-current-pole" }));
      });
      svg.appendChild(svgElement(doc, "text", { x: left, y: 18, class: "as-label" }, "闭环极点：K = " + formatNumber(result.config.k, 1)));
      svg.appendChild(svgElement(doc, "text", { x: width - right, y: height - 8, "text-anchor": "end", class: "as-label" }, "Re(s)"));
      svg.appendChild(svgElement(doc, "text", { x: left + 4, y: top + 12, class: "as-label" }, "Im(s)"));
      svg.appendChild(svgElement(doc, "text", { x: mapX(0) + 6, y: top + 28, class: "as-small" }, "虚轴"));
    }

    function metric(doc, label, value) {
      return element(doc, "div", { className: "as-metric" }, [
        element(doc, "span", { text: label }),
        element(doc, "strong", { text: value })
      ]);
    }

    function renderRouthTable(doc, hostNode, routh) {
      var body = element(doc, "tbody");
      routh.rows.forEach(function (row) {
        body.appendChild(element(doc, "tr", {}, [
          element(doc, "th", { text: row.power }),
          element(doc, "td", { text: row.entries.map(function (value) { return formatNumber(value, 3); }).join(" , ") }),
          element(doc, "td", { text: formatNumber(row.first, 3) }),
          element(doc, "td", { text: Math.abs(row.first) <= EPS ? "0 / 边界" : row.first > 0 ? "+" : "−" })
        ]));
      });
      clear(hostNode);
      hostNode.appendChild(element(doc, "table", {}, [
        element(doc, "caption", { text: "Routh 第一列透明计算账本" }),
        element(doc, "thead", {}, [element(doc, "tr", {}, [
          element(doc, "th", { text: "行" }),
          element(doc, "th", { text: "该行系数" }),
          element(doc, "th", { text: "第一列" }),
          element(doc, "th", { text: "符号" })
        ])]),
        body
      ]));
    }

    function questionSpecs() {
      return [
        {
          key: "range",
          prompt: "对 L(s)=K/[s(s+1)(s+5)]，哪一段 K 给出渐近稳定？",
          expected: "stable",
          choices: [
            { value: "stable", label: "0 < K < 30" },
            { value: "all", label: "所有 K > 0" },
            { value: "large", label: "K > 30" }
          ]
        },
        {
          key: "boundary",
          prompt: "K = 30 时，虚轴交点应怎样判断？",
          expected: "critical",
          choices: [
            { value: "critical", label: "临界：±j√5" },
            { value: "stable", label: "仍渐近稳定" },
            { value: "unstable", label: "两个右半平面根" }
          ]
        },
        {
          key: "signs",
          prompt: "K = 42 时，Routh 第一列 [1, 6, (30−K)/6, K] 有几次符号变化？",
          expected: "two",
          choices: [
            { value: "zero", label: "0 次" },
            { value: "one", label: "1 次" },
            { value: "two", label: "2 次" }
          ]
        }
      ];
    }

    function renderPredictions(state, refs) {
      var specs = questionSpecs();
      refs.questions.forEach(function (question, index) {
        var spec = specs[index];
        question.buttons.forEach(function (button) {
          var selected = state.predictions[spec.key] === button.value;
          button.node.setAttribute("aria-pressed", selected ? "true" : "false");
          if (!state.revealed) {
            button.node.textContent = button.label;
            button.node.className = "";
          } else {
            var correct = button.value === spec.expected;
            button.node.textContent = (correct ? "✓ " : "") + button.label;
            button.node.className = correct ? "as-pass" : selected ? "as-warn" : "";
          }
        });
      });
    }

    function mount(rootNode, api) {
      if (!rootNode || !rootNode.ownerDocument) return;
      var doc = rootNode.ownerDocument;
      installStyles(doc);
      var state = {
        config: normalizeConfig(DEFAULTS),
        predictions: {},
        revealed: false,
        feedback: ""
      };
      var refs = { questions: [] };
      var shell = element(doc, "div", { className: "as-lab" });
      shell.appendChild(element(doc, "h3", { text: "稳定性实验：根轨迹、Routh 证书与当前极点" }));
      shell.appendChild(element(doc, "p", {
        className: "as-note",
        text: "把 K 当作伺服放大器的可调增益。先用稳定范围、临界点和符号变化作出预测，揭示后再拖动 K 看极点如何穿过虚轴。"
      }));
      var predictionHost = element(doc, "div");
      questionSpecs().forEach(function (spec) {
        var fieldset = element(doc, "fieldset");
        fieldset.appendChild(element(doc, "legend", { text: spec.prompt }));
        var grid = element(doc, "div", { className: "as-choice-grid" });
        var question = { key: spec.key, buttons: [] };
        spec.choices.forEach(function (choice) {
          var button = element(doc, "button", { type: "button", text: choice.label, "aria-pressed": "false" });
          button.addEventListener("click", function () {
            state.predictions[spec.key] = choice.value;
            state.feedback = "";
            render();
          });
          question.buttons.push({ value: choice.value, label: choice.label, node: button });
          grid.appendChild(button);
        });
        fieldset.appendChild(grid);
        predictionHost.appendChild(fieldset);
        refs.questions.push(question);
      });
      var actions = element(doc, "div", { className: "as-actions" });
      var reveal = element(doc, "button", { type: "button", className: "as-primary", text: "提交预测并揭晓" });
      var reset = element(doc, "button", { type: "button", text: "重置" });
      actions.appendChild(reveal);
      actions.appendChild(reset);
      var feedback = element(doc, "p", { className: "as-feedback", "aria-live": "polite" });
      var resultShell = element(doc, "div", { hidden: true });
      var kInput = element(doc, "input", { type: "range", min: "0", max: "60", step: "1", value: String(state.config.k), "aria-label": "当前 K" });
      var kOutput = element(doc, "output", { text: formatNumber(state.config.k, 0) });
      var scanInput = element(doc, "input", { type: "range", min: "30", max: "80", step: "1", value: String(state.config.scanK), "aria-label": "根轨迹扫描上限" });
      var scanOutput = element(doc, "output", { text: formatNumber(state.config.scanK, 0) });
      var controls = element(doc, "div", { className: "as-controls" }, [
        element(doc, "div", { className: "as-control" }, [
          element(doc, "label", {}, ["当前 K = ", kOutput]),
          kInput
        ]),
        element(doc, "div", { className: "as-control" }, [
          element(doc, "label", {}, ["扫描到 K = ", scanOutput]),
          scanInput
        ]),
        element(doc, "p", { className: "as-note", text: "控件只改这个三阶模型的参数；根轨迹是闭环极点的数值扫描，Routh 第一列仍是稳定性的解析证书。" })
      ]);
      var svg = svgElement(doc, "svg", { viewBox: "0 0 720 390", role: "img", "aria-label": "根轨迹图" });
      var svgFrame = element(doc, "div", { className: "as-stage-frame" }, [svg]);
      var metricsHost = element(doc, "div", { className: "as-metrics" });
      var tableHost = element(doc, "div", { className: "as-table-wrap" });
      var certificate = element(doc, "p", { className: "as-certificate" });
      resultShell.appendChild(element(doc, "div", { className: "as-layout" }, [
        controls,
        element(doc, "div", { className: "as-stage" }, [svgFrame, metricsHost, tableHost, certificate])
      ]));
      shell.appendChild(predictionHost);
      shell.appendChild(actions);
      shell.appendChild(feedback);
      shell.appendChild(resultShell);
      clear(rootNode);
      rootNode.appendChild(shell);

      reveal.addEventListener("click", function () {
        var specs = questionSpecs();
        var complete = specs.every(function (spec) { return state.predictions[spec.key] !== undefined; });
        if (!complete) {
          state.feedback = "请先完成三项预测；结果、控件和极点图会在提交后出现。";
          render();
          return;
        }
        var correct = specs.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length;
        state.revealed = true;
        state.feedback = "已揭晓：" + correct + "/" + specs.length + " 命中。现在拖动 K，观察 Routh 证书与极点同步更新。";
        render();
        announce(api, rootNode, state.feedback);
      });
      reset.addEventListener("click", function () {
        state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
        render();
        announce(api, rootNode, "稳定性预测、极点图和账本已重置。");
      });
      kInput.addEventListener("input", function () {
        state.config = normalizeConfig({ k: Number(kInput.value), scanK: state.config.scanK, samples: state.config.samples });
        state.feedback = "";
        render();
      });
      scanInput.addEventListener("input", function () {
        state.config = normalizeConfig({ k: state.config.k, scanK: Number(scanInput.value), samples: state.config.samples });
        state.feedback = "";
        render();
      });

      function render() {
        var result = evaluate(state.config);
        kInput.value = String(result.config.k);
        kOutput.textContent = formatNumber(result.config.k, 0);
        scanInput.value = String(result.config.scanK);
        scanOutput.textContent = formatNumber(result.config.scanK, 0);
        feedback.textContent = state.feedback;
        feedback.className = "as-feedback" + (state.feedback.indexOf("请先") === 0 ? " as-warn" : "");
        renderPredictions(state, refs);
        resultShell.hidden = !state.revealed;
        if (!state.revealed) return;
        drawRootLocus(doc, svg, result);
        clear(metricsHost);
        metricsHost.appendChild(metric(doc, "当前判定", regimeLabel(result.regime)));
        metricsHost.appendChild(metric(doc, "闭环极点", result.roots.map(formatRoot).join("；")));
        metricsHost.appendChild(metric(doc, "Routh 符号变化", String(result.routh.signChanges)));
        metricsHost.appendChild(metric(doc, "临界辅助式", result.routh.auxiliary || "—"));
        renderRouthTable(doc, tableHost, result.routh);
        certificate.className = "as-certificate" + (result.regime === "unstable" ? " as-blocked" : "");
        certificate.textContent =
          "证书读法：特征多项式为 s^3 + 6s^2 + 5s + " + formatNumber(result.config.k, 1) +
          "。第一列是 [" + result.routh.firstColumn.map(function (value) { return formatNumber(value, 3); }).join(", ") +
          "]，因此当前为“" + regimeLabel(result.regime) + "”；K=30 的零行需要用辅助多项式 6s^2+30 读出 ±j√5。";
      }

      render();
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) {
        checks += 1;
        assert(condition, message);
      }
      check(classifyGain(18) === "stable", "0<K<30 must be stable");
      check(classifyGain(30) === "critical", "K=30 must be critical");
      check(classifyGain(42) === "unstable", "K>30 must be unstable");
      var critical = closedLoopRoots(30);
      check(critical.some(function (root) { return nearly(root.re, -6, 1e-7) && Math.abs(root.im) < 1e-7; }), "critical real pole");
      check(critical.filter(function (root) { return Math.abs(Math.abs(root.im) - Math.sqrt(5)) < 1e-7; }).length === 2, "critical imaginary pair");
      var routh = routhCertificate(42);
      check(routh.signChanges === 2, "Routh must count two right-half-plane roots at K=42");
      check(nearly(routh.firstColumn[2], -2, 1e-9), "Routh first column");
      var stableRoots = closedLoopRoots(18);
      check(stableRoots.every(function (root) { return root.re < 0; }), "stable roots must be left of axis");
      var locus = rootLocus(60, 61);
      check(locus.branches.length === 3 && locus.branches[0].length === 61, "root locus branches");
      check(nearly(closedLoopPolynomial(18)[3], 18, 1e-12), "polynomial gain");
      check(normalizeConfig({ k: 0 }).scanK >= 30, "normalized scan range");
      return { checks: checks };
    }

    return {
      DEFAULTS: DEFAULTS,
      normalizeConfig: normalizeConfig,
      closedLoopPolynomial: closedLoopPolynomial,
      closedLoopRoots: closedLoopRoots,
      routhCertificate: routhCertificate,
      classifyGain: classifyGain,
      rootLocus: rootLocus,
      evaluate: evaluate,
      mount: mount,
      selfTest: selfTest
    };
  }
);
