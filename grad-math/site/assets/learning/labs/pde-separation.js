(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("pde-separation", exported.mount);
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
        "pde-separation self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)"
      );
    } catch (error) {
      console.error("pde-separation self-test: FAIL\n" + error.stack);
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
    var PI = Math.PI;
    var STYLE_ID = "pde-separation-lab-styles";
    var MAX_N = 16;
    var FULL_N = 512;
    var PRESETS = [
      { id: "heat", label: "热：初值投影", shortLabel: "热", description: "高频因子 e^(-n²t)" },
      { id: "wave", label: "波：零初速", shortLabel: "波", description: "振荡因子 cos(nt)" },
      { id: "laplace", label: "Laplace：顶边渗透", shortLabel: "Laplace", description: "边界因子 sinh(ny)/sinh(nπ)" }
    ];
    var DEFAULTS = { mode: "heat", N: 7, time: 0.45, y: PI / 2 };
    var QUESTIONS = [
      {
        id: "heat-high",
        prompt: "热方程中，n=7 相对 n=1 会怎样？",
        options: [
          { id: "heat", label: "更快衰减" },
          { id: "same", label: "同速衰减" },
          { id: "grow", label: "更快增长" }
        ],
        answer: "heat"
      },
      {
        id: "wave-factor",
        prompt: "无阻尼波的模态因子更像哪一个？",
        options: [
          { id: "oscillate", label: "cos(nt)，可变号" },
          { id: "decay", label: "e^(-n²t)，单调衰减" },
          { id: "constant", label: "永远等于 1" }
        ],
        answer: "oscillate"
      },
      {
        id: "laplace",
        prompt: "Laplace 中 y=π/2 的因子应如何理解？",
        options: [
          { id: "space", label: "从边界向内渗透" },
          { id: "time", label: "随时间演化" },
          { id: "random", label: "随机抽样" }
        ],
        answer: "space"
      },
      {
        id: "finite",
        prompt: "取 N=7 个模态最准确的身份是？",
        options: [
          { id: "projection", label: "有限投影/截断" },
          { id: "complete", label: "已经等于完整解" },
          { id: "proof", label: "自动证明完备性" }
        ],
        answer: "projection"
      }
    ];

    var STYLE_TEXT = [
      ".pse-lab{--pse-blue:var(--cl-blue,#315f9d);--pse-red:var(--cl-red,#b64335);--pse-gold:var(--cl-gold,#9b6a12);--pse-green:var(--cl-green,#39734d);max-width:100%;min-width:0;overflow-wrap:anywhere;color:var(--fg);line-height:1.55}",
      "html[data-theme=dark] .pse-lab{--pse-blue:#83c8ff;--pse-red:#f08c7d;--pse-gold:#e2b458;--pse-green:#72bd8b}",
      ".pse-lab *,.pse-lab *::before,.pse-lab *::after{box-sizing:border-box}.pse-lab [hidden]{display:none!important}",
      ".pse-lab h3,.pse-lab h4{margin:0;color:var(--fg);letter-spacing:0}.pse-lab h3{font-size:1.18rem}.pse-lab h4{margin-top:15px;font-size:1rem}",
      ".pse-lab .pse-note,.pse-lab .pse-feedback{color:var(--fg-soft);font-size:13px;line-height:1.7}.pse-lab .pse-prompt{margin:13px 0;padding:11px 13px;border-left:3px solid var(--pse-gold);background:var(--bg)}",
      ".pse-lab fieldset{min-width:0;margin:10px 0;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg)}.pse-lab legend{max-width:100%;padding:0 4px;color:var(--fg-soft);font-size:13px;line-height:1.5;overflow-wrap:anywhere}",
      ".pse-lab .pse-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.pse-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.pse-lab button:hover{border-color:var(--accent)}.pse-lab button[aria-pressed=true],.pse-lab button.pse-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}.pse-lab button:disabled{cursor:not-allowed;opacity:.55}.pse-lab button:focus-visible,.pse-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}",
      ".pse-lab .pse-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.pse-lab .pse-actions>*{flex:1 1 170px}.pse-lab .pse-feedback{min-height:2em;margin:8px 0;font-weight:700}.pse-lab .pse-pass{color:var(--pse-green)}.pse-lab .pse-warn{color:var(--pse-red)}",
      ".pse-lab .pse-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.pse-lab .pse-layout{display:grid;grid-template-columns:minmax(220px,.72fr) minmax(0,1.28fr);gap:16px;align-items:start;min-width:0}.pse-lab .pse-controls,.pse-lab .pse-output{min-width:0}",
      ".pse-lab .pse-controls{display:grid;gap:11px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg)}.pse-lab .pse-controls h4{margin:0}.pse-lab .pse-mode-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:7px}.pse-lab .pse-mode-grid button{text-align:left;font-size:12px}.pse-lab .pse-control{display:grid;gap:5px;min-width:0}.pse-lab .pse-control label{color:var(--fg-soft);font-size:13px;font-weight:700}.pse-lab .pse-control output{color:var(--accent);font-variant-numeric:tabular-nums}.pse-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent)}",
      ".pse-lab .pse-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:0 0 12px}.pse-lab .pse-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.pse-lab .pse-metric:nth-child(4n+1){border-top-color:var(--pse-blue)}.pse-lab .pse-metric:nth-child(4n+2){border-top-color:var(--pse-gold)}.pse-lab .pse-metric:nth-child(4n+3){border-top-color:var(--pse-green)}.pse-lab .pse-metric:nth-child(4n){border-top-color:var(--pse-red)}.pse-lab .pse-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4}.pse-lab .pse-metric strong{display:block;margin-top:3px;font-size:14px;line-height:1.45;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
      ".pse-lab .pse-status,.pse-lab .pse-boundary{margin:10px 0;padding:10px 12px;border-left:3px solid var(--pse-blue);background:var(--bg);font-size:13px;line-height:1.7}.pse-lab .pse-boundary{border-left-color:var(--pse-gold)}.pse-lab .pse-chart-scroll,.pse-lab .pse-table-scroll{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}.pse-lab .pse-chart-frame{min-width:0;padding:6px;border:1px solid var(--border);border-radius:6px;background:var(--bg)}.pse-lab svg{display:block;width:100%;height:auto;min-width:620px}.pse-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.pse-lab .pse-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.75}.pse-lab .pse-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.7}.pse-lab .pse-profile{fill:none;stroke:var(--pse-blue);stroke-width:3}.pse-lab .pse-reference{fill:none;stroke:var(--pse-gold);stroke-width:2;stroke-dasharray:6 4}.pse-lab .pse-bar{fill:var(--pse-green);opacity:.82}.pse-lab .pse-zero{stroke:var(--pse-red);stroke-width:1.4;stroke-dasharray:5 4}.pse-lab .pse-chart-label{font-size:11px}.pse-lab .pse-chart-title{font-size:13px;font-weight:750}",
      ".pse-lab table{width:100%;min-width:680px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.pse-lab caption{padding:8px 0;text-align:left;color:var(--fg-soft);font-size:12px;line-height:1.55}.pse-lab th,.pse-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;white-space:nowrap}.pse-lab th{color:var(--fg-soft);font-size:11.5px;font-weight:750}.pse-lab .pse-good{color:var(--pse-green);font-weight:750}.pse-lab .pse-caution{color:var(--pse-gold);font-weight:750}",
      "@media(max-width:900px){.pse-lab .pse-layout{grid-template-columns:minmax(0,1fr)}.pse-lab .pse-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:620px){.pse-lab .pse-choice-grid{grid-template-columns:minmax(0,1fr)}.pse-lab .pse-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.pse-lab .pse-chart-frame{padding:4px}.pse-lab table{font-size:11.5px}.pse-lab th,.pse-lab td{padding-left:5px;padding-right:5px}}@media(prefers-reduced-motion:reduce){.pse-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
    ].join("\n");

    function finite(value) {
      return typeof value === "number" && isFinite(value);
    }

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function clampInteger(value, min, max, fallback) {
      var parsed = Number(value);
      if (!finite(parsed)) parsed = fallback;
      return Math.round(clamp(parsed, min, max));
    }

    function format(value, digits) {
      if (!finite(value)) return "—";
      if (Math.abs(value) < 0.0005) return "0";
      var places = digits === undefined ? 4 : digits;
      if (Math.abs(value) >= 10000 || Math.abs(value) < 0.001) {
        return value.toExponential(Math.min(places, 4));
      }
      return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
    }

    function presetById(id) {
      return PRESETS.filter(function (item) { return item.id === id; })[0] || PRESETS[0];
    }

    function normalizeParams(input) {
      var source = input || {};
      var mode = presetById(source.mode).id;
      var time = finite(Number(source.time)) ? Number(source.time) : DEFAULTS.time;
      var y = finite(Number(source.y)) ? Number(source.y) : DEFAULTS.y;
      return {
        mode: mode,
        N: clampInteger(source.N, 1, MAX_N, DEFAULTS.N),
        time: clamp(time, 0, 2),
        y: clamp(y, 0, PI)
      };
    }

    function coefficient(n) {
      if (!finite(n) || n < 1) return 0;
      return 4 * (1 - Math.pow(-1, n)) / (PI * Math.pow(n, 3));
    }

    function heatFactor(n, time) {
      return Math.exp(-n * n * Math.max(0, time));
    }

    function waveFactor(n, time) {
      return Math.cos(n * time);
    }

    function laplaceFactor(n, y) {
      if (n < 1) return 0;
      return Math.sinh(n * clamp(y, 0, PI)) / Math.sinh(n * PI);
    }

    function modeFactor(mode, n, time, y) {
      if (mode === "wave") return waveFactor(n, time);
      if (mode === "laplace") return laplaceFactor(n, y);
      return heatFactor(n, time);
    }

    function baseCoefficient(mode, n) {
      return mode === "laplace" ? (n === 1 ? 1 : 0) : coefficient(n);
    }

    function sumEnergy(mode, limit, time, y, waveEnergy) {
      var total = 0;
      for (var n = 1; n <= limit; n += 1) {
        var b = baseCoefficient(mode, n);
        var factor = modeFactor(mode, n, time, y);
        if (waveEnergy) {
          if (mode !== "wave") throw new Error("wave energy is defined only for the wave preset");
          var displacementGradient = n * b * Math.cos(n * time);
          var velocity = -n * b * Math.sin(n * time);
          total += displacementGradient * displacementGradient + velocity * velocity;
        } else {
          total += b * b * factor * factor;
        }
      }
      return (waveEnergy ? PI / 4 : PI / 2) * total;
    }

    function fullEnergy(mode, time, y, waveEnergy) {
      if (mode === "laplace") return sumEnergy(mode, 1, time, y, waveEnergy);
      return sumEnergy(mode, FULL_N, time, y, waveEnergy);
    }

    function profileAt(mode, x, time, y, limit) {
      var total = 0;
      var n;
      if (mode === "laplace") {
        return Math.sin(x) * laplaceFactor(1, y);
      }
      for (n = 1; n <= limit; n += 1) {
        total += coefficient(n) * modeFactor(mode, n, time, y) * Math.sin(n * x);
      }
      return total;
    }

    function modalRows(params) {
      var rows = [];
      for (var n = 1; n <= params.N; n += 1) {
        var b = baseCoefficient(params.mode, n);
        var factor = modeFactor(params.mode, n, params.time, params.y);
        rows.push({
          n: n,
          coefficient: b,
          factor: factor,
          contribution: b * factor,
          l2Energy: PI / 2 * b * b * factor * factor
        });
      }
      return rows;
    }

    function evaluate(input) {
      var params = normalizeParams(input);
      var rows = modalRows(params);
      var points = [];
      for (var index = 0; index <= 80; index += 1) {
        var x = PI * index / 80;
        points.push({
          x: x,
          value: profileAt(params.mode, x, params.time, params.y, params.N),
          reference: params.mode === "laplace" ? Math.sin(x) : profileAt(params.mode, x, 0, params.y, MAX_N)
        });
      }
      var currentL2 = sumEnergy(params.mode, params.N, params.time, params.y, false);
      var fullCurrentL2 = fullEnergy(params.mode, params.time, params.y, false);
      var initialTruncated = sumEnergy(params.mode, params.N, 0, params.y, false);
      var initialFull = fullEnergy(params.mode, 0, params.y, false);
      var currentWave = params.mode === "wave" ? sumEnergy("wave", params.N, params.time, params.y, true) : null;
      var fullWave = fullEnergy("wave", params.time, params.y, true);
      return {
        params: params,
        preset: presetById(params.mode),
        rows: rows,
        points: points,
        currentL2: currentL2,
        fullCurrentL2: fullCurrentL2,
        initialL2Tail: Math.sqrt(Math.max(0, initialFull - initialTruncated)),
        currentL2Tail: Math.sqrt(Math.max(0, fullCurrentL2 - currentL2)),
        waveEnergy: currentWave,
        fullWaveEnergy: fullWave,
        waveEnergyTail: currentWave === null ? null : Math.sqrt(Math.max(0, 2 * (fullWave - currentWave))),
        highModeFactor: modeFactor(params.mode, params.N, params.time, params.y),
        firstModeFactor: modeFactor(params.mode, 1, params.time, params.y),
        boundaryValue: params.mode === "laplace" ? laplaceFactor(1, params.y) : null
      };
    }

    function setAttributes(node, attrs) {
      Object.keys(attrs || {}).forEach(function (key) {
        var value = attrs[key];
        if (value === undefined || value === null || value === false) return;
        if (key === "className") node.setAttribute("class", String(value));
        else if (key === "text") node.textContent = String(value);
        else if (value === true) node.setAttribute(key, "");
        else node.setAttribute(key, String(value));
      });
      return node;
    }

    function appendChildren(node, children) {
      if (children === undefined || children === null) return node;
      (Array.isArray(children) ? children : [children]).forEach(function (child) {
        if (child === undefined || child === null || child === false) return;
        node.appendChild(child && child.nodeType ? child : node.ownerDocument.createTextNode(String(child)));
      });
      return node;
    }

    function element(doc, tag, className, children) {
      return appendChildren(setAttributes(doc.createElement(tag), { className: className }), children);
    }

    function svgNode(doc, tag, attrs, children) {
      return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attrs || {}), children);
    }

    function clear(node) {
      while (node && node.firstChild) node.removeChild(node.firstChild);
    }

    function replace(node, children) {
      clear(node);
      appendChildren(node, children);
    }

    function installStyles(doc) {
      if (!doc || !doc.getElementById || doc.getElementById(STYLE_ID)) return;
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent = STYLE_TEXT;
      (doc.head || doc.documentElement || doc.body).appendChild(style);
    }

    function metric(doc, label, value) {
      return element(doc, "div", "pse-metric", [
        element(doc, "span", "", label),
        element(doc, "strong", "", value)
      ]);
    }

    function chartText(doc, x, y, text, className, attrs) {
      var all = attrs || {};
      all.x = x;
      all.y = y;
      all.className = className || "pse-chart-label";
      return svgNode(doc, "text", all, text);
    }

    function drawChart(doc, result) {
      var svg = svgNode(doc, "svg", {
        viewBox: "0 0 760 350",
        role: "img",
        "aria-label": "有限分离模态的空间曲线与模态因子"
      });
      svg.appendChild(svgNode(doc, "title", {}, "分离模态：空间曲线与有限因子"));
      svg.appendChild(svgNode(doc, "desc", {}, "左图比较当前 N 项曲线与参考曲线，右图显示各模态因子；所有线段只表示有限截断。"));

      var left = { x: 42, y: 32, width: 350, height: 246 };
      var right = { x: 418, y: 32, width: 300, height: 246 };
      [left, right].forEach(function (panel) {
        svg.appendChild(svgNode(doc, "rect", {
          x: panel.x,
          y: panel.y,
          width: panel.width,
          height: panel.height,
          fill: "var(--bg)",
          stroke: "var(--border)",
          "stroke-width": 1
        }));
      });
      function px(x) { return left.x + x / PI * left.width; }
      function py(value) { return left.y + left.height / 2 - clamp(value, -1.15, 1.15) / 1.15 * (left.height / 2 - 12); }
      [-1, 0, 1].forEach(function (tick) {
        var y = py(tick);
        svg.appendChild(svgNode(doc, "line", { x1: left.x, x2: left.x + left.width, y1: y, y2: y, className: "pse-grid" }));
        svg.appendChild(chartText(doc, left.x - 8, y + 4, String(tick), "pse-chart-label", { "text-anchor": "end" }));
      });
      svg.appendChild(svgNode(doc, "line", { x1: left.x, x2: left.x, y1: left.y, y2: left.y + left.height, className: "pse-axis" }));
      svg.appendChild(svgNode(doc, "line", { x1: left.x, x2: left.x + left.width, y1: py(0), y2: py(0), className: "pse-axis" }));
      [0, PI / 2, PI].forEach(function (tick) {
        var x = px(tick);
        svg.appendChild(chartText(doc, x, left.y + left.height + 20, tick === 0 ? "0" : tick === PI ? "π" : "π/2", "pse-chart-label", { "text-anchor": "middle" }));
      });
      var currentPath = result.points.map(function (point, index) {
        return (index === 0 ? "M" : "L") + px(point.x).toFixed(2) + " " + py(point.value).toFixed(2);
      }).join(" ");
      var referencePath = result.points.map(function (point, index) {
        return (index === 0 ? "M" : "L") + px(point.x).toFixed(2) + " " + py(point.reference).toFixed(2);
      }).join(" ");
      svg.appendChild(svgNode(doc, "path", { d: referencePath, className: "pse-reference" }));
      svg.appendChild(svgNode(doc, "path", { d: currentPath, className: "pse-profile" }));
      svg.appendChild(chartText(doc, left.x + 10, left.y + 18, result.preset.shortLabel + "：N=" + result.params.N, "pse-chart-title"));
      svg.appendChild(chartText(doc, left.x + 10, left.y + left.height - 8, "蓝：有限曲线；金：参考/边界曲线", "pse-chart-label"));

      var maxFactor = result.params.mode === "wave" ? 1 : Math.max(1, result.firstModeFactor);
      function bx(index) { return right.x + 25 + (index - 1) * ((right.width - 45) / Math.max(1, result.params.N)); }
      function by(value) { return right.y + right.height / 2 - clamp(value, -1, 1) * (right.height / 2 - 22); }
      svg.appendChild(svgNode(doc, "line", { x1: right.x + 18, x2: right.x + right.width - 12, y1: by(0), y2: by(0), className: "pse-zero" }));
      svg.appendChild(chartText(doc, right.x + 12, right.y + 18, "模态因子 Tₙ", "pse-chart-title"));
      result.rows.forEach(function (row) {
        var x = bx(row.n);
        var y = by(row.factor);
        svg.appendChild(svgNode(doc, "rect", {
          x: x - 7,
          y: Math.min(y, by(0)),
          width: 14,
          height: Math.max(1, Math.abs(y - by(0))),
          className: "pse-bar"
        }));
        svg.appendChild(chartText(doc, x, right.y + right.height + 20, String(row.n), "pse-chart-label", { "text-anchor": "middle" }));
      });
      svg.appendChild(chartText(doc, right.x + right.width - 12, right.y + right.height - 8, "n", "pse-chart-label", { "text-anchor": "end" }));
      return svg;
    }

    function makeTable(doc, result) {
      var table = element(doc, "table", "", []);
      table.appendChild(element(doc, "caption", "", "当前有限模态账本；N 项只表示投影/截断。"));
      var head = element(doc, "tr", "", [
        element(doc, "th", "", "n"),
        element(doc, "th", "", "投影系数 bₙ"),
        element(doc, "th", "", "因子 Tₙ"),
        element(doc, "th", "", "当前系数 bₙTₙ"),
        element(doc, "th", "", "L² 项")
      ]);
      table.appendChild(element(doc, "thead", "", head));
      var body = element(doc, "tbody", "", []);
      result.rows.forEach(function (row) {
        body.appendChild(element(doc, "tr", "", [
          element(doc, "th", "", String(row.n)),
          element(doc, "td", "", format(row.coefficient, 6)),
          element(doc, "td", "", format(row.factor, 6)),
          element(doc, "td", "", format(row.contribution, 6)),
          element(doc, "td", "", format(row.l2Energy, 6))
        ]));
      });
      table.appendChild(body);
      return table;
    }

    function renderOutput(doc, output, result) {
      replace(output, []);
      output.appendChild(element(doc, "div", "pse-metrics", [
        metric(doc, "模型", result.preset.label),
        metric(doc, "有限模态 N", String(result.params.N)),
        metric(doc, "n=1 因子", format(result.firstModeFactor, 5)),
        metric(doc, "n=N 因子", format(result.highModeFactor, 5)),
        metric(doc, "初值 L² 尾", format(result.initialL2Tail, 5)),
        metric(doc, "当前 L² 尾", format(result.currentL2Tail, 5)),
        metric(doc, "波能量范数尾（仅波）", result.waveEnergyTail === null ? "不适用" : format(result.waveEnergyTail, 5)),
        metric(doc, "边界因子", result.boundaryValue === null ? "不适用" : format(result.boundaryValue, 5))
      ]));
      var status = result.params.mode === "heat"
        ? "热：高频因子按 n² 加速衰减；这里的 current L² 尾是当前有限 N 对 FULL_N 参考的误差估计。"
        : result.params.mode === "wave"
          ? "波：因子 cos(nt) 只振荡；物理能量 E=(1/2)∫(u_t²+u_x²)dx 把位移梯度与速度一起计入，面板显示的尾项是 √(2E_{>N})。"
          : "Laplace：因子由 y/π 决定而非时间；高 n 的边界纹理在内部衰减更快。";
      output.appendChild(element(doc, "p", "pse-status", status));
      var chartScroll = element(doc, "div", "pse-chart-scroll", [element(doc, "div", "pse-chart-frame", [drawChart(doc, result)])]);
      output.appendChild(chartScroll);
      output.appendChild(element(doc, "div", "pse-table-scroll", [makeTable(doc, result)]));
      output.appendChild(element(doc, "p", "pse-boundary", "证据边界：图和表只计算当前矩形/区间与有限项；Sturm–Liouville 完备性、级数收敛和更一般边界条件需要独立理论。有限曲线不能冒充定理证明。"));
    }

    function announce(api, rootElement, message) {
      if (api && typeof api.announce === "function") api.announce(rootElement, message);
    }

    function mount(rootElement, api) {
      if (!rootElement || !rootElement.ownerDocument) return;
      var doc = rootElement.ownerDocument;
      installStyles(doc);
      var state = {
        mode: DEFAULTS.mode,
        N: DEFAULTS.N,
        time: DEFAULTS.time,
        y: DEFAULTS.y,
        revealed: false
      };
      var predictions = {};
      var shell = element(doc, "div", "pse-lab", []);
      shell.appendChild(element(doc, "p", "pse-note", "先完成四个预测，再打开有限模态账本。实验是确定性的：没有网络、随机数或隐藏样本。"));
      var predictionBox = element(doc, "div", "pse-prompt", []);
      var choiceButtons = {};
      QUESTIONS.forEach(function (question) {
        var fieldset = element(doc, "fieldset", "", []);
        fieldset.appendChild(element(doc, "legend", "", question.prompt));
        var choices = element(doc, "div", "pse-choice-grid", []);
        choiceButtons[question.id] = [];
        question.options.forEach(function (option) {
          var button = element(doc, "button", "", option.label);
          button.type = "button";
          button.addEventListener("click", function () {
            predictions[question.id] = option.id;
            renderPrediction();
            feedback.textContent = "预测已记录；仍可修改，答案尚未揭示。";
            feedback.className = "pse-feedback";
          });
          choiceButtons[question.id].push({ id: option.id, node: button });
          choices.appendChild(button);
        });
        fieldset.appendChild(choices);
        predictionBox.appendChild(fieldset);
      });
      var actions = element(doc, "div", "pse-actions", []);
      var reveal = element(doc, "button", "pse-primary", "揭示账本");
      var reset = element(doc, "button", "", "重置");
      reveal.type = "button";
      reset.type = "button";
      actions.appendChild(reveal);
      actions.appendChild(reset);
      predictionBox.appendChild(actions);
      var feedback = element(doc, "p", "pse-feedback", "每题先作一个预测。 ");
      feedback.setAttribute("aria-live", "polite");
      predictionBox.appendChild(feedback);
      shell.appendChild(predictionBox);

      var revealedPanel = element(doc, "div", "pse-revealed", []);
      revealedPanel.hidden = true;
      var layout = element(doc, "div", "pse-layout", []);
      var controls = element(doc, "div", "pse-controls", []);
      controls.appendChild(element(doc, "h4", "", "揭示后调节模型"));
      var modeGrid = element(doc, "div", "pse-mode-grid", []);
      var modeButtons = [];
      PRESETS.forEach(function (preset) {
        var button = element(doc, "button", "", preset.label + "：" + preset.description);
        button.type = "button";
        button.addEventListener("click", function () {
          state.mode = preset.id;
          render();
          announce(api, rootElement, "已切换到" + preset.label + "，有限账本已更新。");
        });
        modeButtons.push({ id: preset.id, node: button });
        modeGrid.appendChild(button);
      });
      controls.appendChild(modeGrid);
      function rangeControl(label, min, max, step, value, ariaLabel) {
        var wrapper = element(doc, "div", "pse-control", []);
        var outputValue = element(doc, "output", "", format(value, step < 0.1 ? 2 : 0));
        var labelNode = element(doc, "label", "", [label, " ", outputValue]);
        var input = element(doc, "input", "", []);
        input.type = "range";
        input.min = String(min);
        input.max = String(max);
        input.step = String(step);
        input.value = String(value);
        input.setAttribute("aria-label", ariaLabel);
        wrapper.appendChild(labelNode);
        wrapper.appendChild(input);
        return { wrapper: wrapper, input: input, output: outputValue };
      }
      var nControl = rangeControl("模态数 N", 1, MAX_N, 1, state.N, "模态截断数 N");
      var timeControl = rangeControl("时间 t", 0, 2, 0.05, state.time, "时间 t");
      var yControl = rangeControl("内部高度 y", 0, PI, 0.05, state.y, "Laplace 内部高度 y");
      controls.appendChild(nControl.wrapper);
      controls.appendChild(timeControl.wrapper);
      controls.appendChild(yControl.wrapper);
      layout.appendChild(controls);
      var output = element(doc, "div", "pse-output", []);
      layout.appendChild(output);
      revealedPanel.appendChild(layout);
      shell.appendChild(revealedPanel);
      replace(rootElement, [shell]);

      function renderPrediction() {
        QUESTIONS.forEach(function (question) {
          choiceButtons[question.id].forEach(function (choice) {
            choice.node.setAttribute("aria-pressed", predictions[question.id] === choice.id ? "true" : "false");
          });
        });
      }

      function render() {
        nControl.input.value = String(state.N);
        timeControl.input.value = String(state.time);
        yControl.input.value = String(state.y);
        nControl.output.textContent = String(state.N);
        timeControl.output.textContent = format(state.time, 2);
        yControl.output.textContent = format(state.y / PI, 2) + "π";
        modeButtons.forEach(function (item) {
          item.node.setAttribute("aria-pressed", item.id === state.mode ? "true" : "false");
        });
        renderPrediction();
        if (!state.revealed) {
          revealedPanel.hidden = true;
          feedback.textContent = Object.keys(predictions).length ? "预测已记录；点击“揭示账本”打开数值。" : "每题先作一个预测。";
          feedback.className = "pse-feedback";
          return;
        }
        revealedPanel.hidden = false;
        renderOutput(doc, output, evaluate(state));
      }

      reveal.addEventListener("click", function () {
        var missing = QUESTIONS.filter(function (question) { return !predictions[question.id]; });
        if (missing.length) {
          feedback.textContent = "请先完成全部预测；答案仍未揭晓。";
          feedback.className = "pse-feedback pse-warn";
          announce(api, rootElement, feedback.textContent);
          return;
        }
        state.revealed = true;
        var correct = QUESTIONS.every(function (question) { return predictions[question.id] === question.answer; });
        feedback.textContent = correct
          ? "预测命中；现在把有限曲线与定理边界分开读。"
          : "预测已核对；请重读热/波/Laplace 的三个因子和截断身份。";
        feedback.className = "pse-feedback " + (correct ? "pse-pass" : "pse-warn");
        render();
        announce(api, rootElement, "预测答案已揭晓，分离模态与误差账本已显示。");
      });
      reset.addEventListener("click", function () {
        predictions = {};
        state.mode = DEFAULTS.mode;
        state.N = DEFAULTS.N;
        state.time = DEFAULTS.time;
        state.y = DEFAULTS.y;
        state.revealed = false;
        render();
        announce(api, rootElement, "实验已重置，预测答案再次隐藏。");
      });
      nControl.input.addEventListener("input", function () {
        state.N = clampInteger(nControl.input.value, 1, MAX_N, DEFAULTS.N);
        if (state.revealed) render();
      });
      timeControl.input.addEventListener("input", function () {
        state.time = clamp(Number(timeControl.input.value), 0, 2);
        if (state.revealed) render();
      });
      yControl.input.addEventListener("input", function () {
        state.y = clamp(Number(yControl.input.value), 0, PI);
        if (state.revealed) render();
      });
      render();
      announce(api, rootElement, "分离变量实验已加载；请先完成四个预测。");
    }

    function assert(condition, message) {
      if (!condition) throw new Error(message);
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) {
        checks += 1;
        assert(condition, message);
      }
      var result = evaluate(DEFAULTS);
      check(PRESETS.length === 3, "three PDE presets");
      check(QUESTIONS.length === 4, "four prediction questions");
      check(Math.abs(coefficient(1) - 8 / PI) < 1e-12, "b1 coefficient matches the page example");
      check(Math.abs(coefficient(2)) < 1e-12, "even coefficient vanishes");
      check(Math.abs(coefficient(3) - 8 / (27 * PI)) < 1e-12, "b3 coefficient matches the page example");
      check(heatFactor(7, 0.45) < heatFactor(1, 0.45), "heat high mode decays faster");
      check(Math.abs(waveFactor(2, 0.3)) <= 1 + 1e-12, "wave factor is bounded by one");
      check(laplaceFactor(1, 0) === 0, "Laplace factor vanishes at the zero boundary");
      check(Math.abs(laplaceFactor(1, PI) - 1) < 1e-12, "Laplace factor matches the prescribed boundary");
      check(result.rows.length === DEFAULTS.N, "finite modal row count is N");
      check(result.initialL2Tail > 0, "finite projection has a nonzero tail");
      check(evaluate({ mode: "heat", N: 16, time: 0 }).currentL2Tail < evaluate({ mode: "heat", N: 7, time: 0 }).currentL2Tail, "more heat modes reduce the projection tail");
      var waveNow = evaluate({ mode: "wave", N: 16, time: 0.45 });
      var waveZero = evaluate({ mode: "wave", N: 16, time: 0 });
      check(Math.abs(waveNow.waveEnergy - waveZero.waveEnergy) < 1e-12, "truncated wave energy includes velocity and is time invariant");
      check(Math.abs(waveNow.fullWaveEnergy - waveZero.fullWaveEnergy) < 1e-12, "reference wave energy is time invariant");
      check(Math.abs(waveNow.waveEnergyTail - waveZero.waveEnergyTail) < 1e-12, "wave energy norm tail is time invariant");
      check(evaluate({ mode: "laplace", N: 1, y: PI / 2 }).boundaryValue < 1, "Laplace boundary value penetrates with attenuation");
      check(result.points.length === 81, "profile sampling is deterministic");
      check(result.points.every(function (point) { return finite(point.value) && finite(point.reference); }), "profile points are finite");
      return { checks: checks, presets: PRESETS.length };
    }

    return {
      DEFAULTS: DEFAULTS,
      PRESETS: PRESETS,
      QUESTIONS: QUESTIONS,
      coefficient: coefficient,
      heatFactor: heatFactor,
      waveFactor: waveFactor,
      laplaceFactor: laplaceFactor,
      evaluate: evaluate,
      mount: mount,
      selfTest: selfTest
    };
  }
);
