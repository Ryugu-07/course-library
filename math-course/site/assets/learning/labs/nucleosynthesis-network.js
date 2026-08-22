(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("nucleosynthesis-network", exported.mount);
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
        "nucleosynthesis-network self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)"
      );
    } catch (error) {
      console.error("nucleosynthesis-network self-test: FAIL\n" + error.stack);
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
    var STYLE_ID = "nucleosynthesis-network-lab-styles";
    var EPS = 1e-12;
    var SPECIES = [
      { id: "H", label: "H", description: "氢池" },
      { id: "He", label: "He", description: "氦池" },
      { id: "Be8", label: "Be-8", description: "短寿命中间池" },
      { id: "C", label: "C", description: "碳池" },
      { id: "O", label: "O", description: "氧池" },
      { id: "Fe", label: "Fe", description: "铁族 toy 池" }
    ];
    var REACTIONS = [
      { id: "pp", label: "pp / 弱入口：H → He", from: "H", to: "He", base: 0.012, exponent: 4, macro: true },
      { id: "he-be", label: "He → Be-8 有效桥", from: "He", to: "Be8", base: 0.06, exponent: 18, macro: true },
      { id: "be-c", label: "Be-8 → C 有效俘获/清空", from: "Be8", to: "C", base: 3, exponent: 0, macro: false },
      { id: "c-o", label: "C → O", from: "C", to: "O", base: 0.035, exponent: 8, macro: true },
      { id: "o-fe", label: "O → Fe", from: "O", to: "Fe", base: 0.022, exponent: 6, macro: true }
    ];
    var INITIAL = { H: 0.72, He: 0.27, Be8: 0, C: 0.005, O: 0.005, Fe: 0 };
    var PRESETS = [
      { id: "steady", label: "恒温：θ=1.00", mode: "steady", theta: 1, steps: 32, coolingRate: 0.06 },
      { id: "hot", label: "恒温：θ=1.25", mode: "steady", theta: 1.25, steps: 32, coolingRate: 0.06 },
      { id: "freeze", label: "冷却：系数阈值", mode: "cooling", theta: 1.25, steps: 56, coolingRate: 0.08 }
    ];
    var DEFAULTS = {
      preset: "steady",
      mode: "steady",
      theta: 1,
      steps: 32,
      coolingRate: 0.06,
      dt: 0.5,
      freezeThreshold: 0.01
    };
    var QUESTIONS = [
      {
        id: "temperature",
        prompt: "升温时，哪个 toy 速率对 θ 最敏感？",
        options: [
          { id: "triple", label: "He→Be-8 桥" },
          { id: "pp", label: "pp 弱入口" },
          { id: "same", label: "所有速率一样" }
        ],
        answer: "triple"
      },
      {
        id: "bottleneck",
        prompt: "默认恒温下，慢入口更可能造成什么？",
        options: [
          { id: "pp", label: "H 留存/供给瓶颈" },
          { id: "be", label: "Be-8 无限积累" },
          { id: "none", label: "没有瓶颈" }
        ],
        answer: "pp"
      },
      {
        id: "conservation",
        prompt: "源池减、汇池加同一份时，总丰度怎样？",
        options: [
          { id: "one", label: "保持 1" },
          { id: "grow", label: "逐步增长" },
          { id: "decay", label: "逐步消失" }
        ],
        answer: "one"
      },
      {
        id: "freeze",
        prompt: "冷却到 macro toy 转移率系数低于速率常数阈值后，丰度曲线？",
        options: [
          { id: "plateau", label: "近似冻结" },
          { id: "fast", label: "继续快速反应" },
          { id: "reverse", label: "自动反向燃烧" }
        ],
        answer: "plateau"
      }
    ];

    var STYLE_TEXT = [
      ".nuc-lab{--nuc-blue:var(--cl-blue,#315f9d);--nuc-red:var(--cl-red,#b64335);--nuc-gold:var(--cl-gold,#9b6a12);--nuc-green:var(--cl-green,#39734d);max-width:100%;min-width:0;overflow-wrap:anywhere;color:var(--fg);line-height:1.55}",
      "html[data-theme=dark] .nuc-lab{--nuc-blue:#83c8ff;--nuc-red:#f08c7d;--nuc-gold:#e2b458;--nuc-green:#72bd8b}",
      ".nuc-lab *,.nuc-lab *::before,.nuc-lab *::after{box-sizing:border-box}.nuc-lab [hidden]{display:none!important}",
      ".nuc-lab h3,.nuc-lab h4{margin:0;color:var(--fg);letter-spacing:0}.nuc-lab h3{font-size:1.18rem}.nuc-lab h4{margin-top:15px;font-size:1rem}",
      ".nuc-lab .nuc-note,.nuc-lab .nuc-feedback{color:var(--fg-soft);font-size:13px;line-height:1.7}.nuc-lab .nuc-prompt{margin:13px 0;padding:11px 13px;border-left:3px solid var(--nuc-gold);background:var(--bg)}",
      ".nuc-lab fieldset{min-width:0;margin:10px 0;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg)}.nuc-lab legend{max-width:100%;padding:0 4px;color:var(--fg-soft);font-size:13px;line-height:1.5;overflow-wrap:anywhere}",
      ".nuc-lab .nuc-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.nuc-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.nuc-lab button:hover{border-color:var(--accent)}.nuc-lab button[aria-pressed=true],.nuc-lab button.nuc-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}.nuc-lab button:disabled{cursor:not-allowed;opacity:.55}.nuc-lab button:focus-visible,.nuc-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}",
      ".nuc-lab .nuc-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.nuc-lab .nuc-actions>*{flex:1 1 170px}.nuc-lab .nuc-feedback{min-height:2em;margin:8px 0;font-weight:700}.nuc-lab .nuc-pass{color:var(--nuc-green)}.nuc-lab .nuc-warn{color:var(--nuc-red)}",
      ".nuc-lab .nuc-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.nuc-lab .nuc-layout{display:grid;grid-template-columns:minmax(220px,.72fr) minmax(0,1.28fr);gap:16px;align-items:start;min-width:0}.nuc-lab .nuc-controls,.nuc-lab .nuc-output{min-width:0}",
      ".nuc-lab .nuc-controls{display:grid;gap:11px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg)}.nuc-lab .nuc-controls h4{margin:0}.nuc-lab .nuc-preset-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:7px}.nuc-lab .nuc-preset-grid button{text-align:left;font-size:12px}.nuc-lab .nuc-control{display:grid;gap:5px;min-width:0}.nuc-lab .nuc-control label{color:var(--fg-soft);font-size:13px;font-weight:700}.nuc-lab .nuc-control output{color:var(--accent);font-variant-numeric:tabular-nums}.nuc-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent)}",
      ".nuc-lab .nuc-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:0 0 12px}.nuc-lab .nuc-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.nuc-lab .nuc-metric:nth-child(4n+1){border-top-color:var(--nuc-blue)}.nuc-lab .nuc-metric:nth-child(4n+2){border-top-color:var(--nuc-gold)}.nuc-lab .nuc-metric:nth-child(4n+3){border-top-color:var(--nuc-green)}.nuc-lab .nuc-metric:nth-child(4n){border-top-color:var(--nuc-red)}.nuc-lab .nuc-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4}.nuc-lab .nuc-metric strong{display:block;margin-top:3px;font-size:14px;line-height:1.45;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
      ".nuc-lab .nuc-status,.nuc-lab .nuc-boundary{margin:10px 0;padding:10px 12px;border-left:3px solid var(--nuc-blue);background:var(--bg);font-size:13px;line-height:1.7}.nuc-lab .nuc-boundary{border-left-color:var(--nuc-gold)}.nuc-lab .nuc-chart-scroll,.nuc-lab .nuc-table-scroll{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}.nuc-lab .nuc-chart-frame{min-width:0;padding:6px;border:1px solid var(--border);border-radius:6px;background:var(--bg)}.nuc-lab svg{display:block;width:100%;height:auto;min-width:620px}.nuc-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.nuc-lab .nuc-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.75}.nuc-lab .nuc-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.7}.nuc-lab .nuc-freeze{stroke:var(--nuc-red);stroke-width:1.6;stroke-dasharray:6 4}.nuc-lab .nuc-line-h{fill:none;stroke:var(--nuc-blue);stroke-width:3}.nuc-lab .nuc-line-he{fill:none;stroke:var(--nuc-gold);stroke-width:3}.nuc-lab .nuc-line-be8{fill:none;stroke:var(--nuc-green);stroke-width:2}.nuc-lab .nuc-line-c{fill:none;stroke:#7b4f9e;stroke-width:3}.nuc-lab .nuc-line-o{fill:none;stroke:#b35c2e;stroke-width:3}.nuc-lab .nuc-line-fe{fill:none;stroke:var(--nuc-red);stroke-width:3}.nuc-lab .nuc-chart-label{font-size:11px}.nuc-lab .nuc-chart-title{font-size:13px;font-weight:750}",
      ".nuc-lab table{width:100%;min-width:700px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.nuc-lab caption{padding:8px 0;text-align:left;color:var(--fg-soft);font-size:12px;line-height:1.55}.nuc-lab th,.nuc-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;white-space:nowrap}.nuc-lab th{color:var(--fg-soft);font-size:11.5px;font-weight:750}.nuc-lab .nuc-good{color:var(--nuc-green);font-weight:750}.nuc-lab .nuc-caution{color:var(--nuc-gold);font-weight:750}",
      "@media(max-width:900px){.nuc-lab .nuc-layout{grid-template-columns:minmax(0,1fr)}.nuc-lab .nuc-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:620px){.nuc-lab .nuc-choice-grid{grid-template-columns:minmax(0,1fr)}.nuc-lab .nuc-chart-frame{padding:4px}.nuc-lab table{font-size:11.5px}.nuc-lab th,.nuc-lab td{padding-left:5px;padding-right:5px}}@media(prefers-reduced-motion:reduce){.nuc-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
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

    function near(left, right, tolerance) {
      var scale = Math.max(1, Math.abs(left), Math.abs(right));
      return Math.abs(left - right) <= (tolerance || EPS) * scale;
    }

    function format(value, digits) {
      if (!finite(value)) return "—";
      if (Math.abs(value) < 0.0005) return "0";
      var places = digits === undefined ? 4 : digits;
      if (Math.abs(value) >= 10000 || Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4));
      return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
    }

    function presetById(id) {
      return PRESETS.filter(function (item) { return item.id === id; })[0] || PRESETS[0];
    }

    function copyAbundance(abundance) {
      var copy = {};
      SPECIES.forEach(function (species) { copy[species.id] = abundance[species.id]; });
      return copy;
    }

    function abundanceTotal(abundance) {
      return SPECIES.reduce(function (total, species) { return total + abundance[species.id]; }, 0);
    }

    function reactionRate(reaction, theta) {
      return reaction.base * Math.pow(Math.max(0, theta), reaction.exponent);
    }

    function rateRows(theta) {
      return REACTIONS.map(function (reaction) {
        return {
          id: reaction.id,
          label: reaction.label,
          from: reaction.from,
          to: reaction.to,
          exponent: reaction.exponent,
          macro: reaction.macro,
          rate: reactionRate(reaction, theta)
        };
      });
    }

    function normalizeParams(input) {
      var source = input || {};
      var preset = presetById(source.preset);
      var mode = source.mode === "cooling" || source.mode === "steady" ? source.mode : (preset.mode || DEFAULTS.mode);
      var theta = finite(Number(source.theta)) ? Number(source.theta) : (preset.theta || DEFAULTS.theta);
      var steps = clampInteger(source.steps, 1, 80, preset.steps || DEFAULTS.steps);
      var coolingRate = finite(Number(source.coolingRate)) ? Number(source.coolingRate) : (preset.coolingRate || DEFAULTS.coolingRate);
      return {
        preset: preset.id,
        mode: mode,
        theta: clamp(theta, 0.4, 1.35),
        steps: steps,
        coolingRate: clamp(coolingRate, 0.01, 0.14),
        dt: DEFAULTS.dt,
        freezeThreshold: DEFAULTS.freezeThreshold
      };
    }

    function stepNetwork(abundance, theta, dt) {
      var next = copyAbundance(abundance);
      var fluxes = [];
      rateRows(theta).forEach(function (reaction) {
        var amount = next[reaction.from] * (1 - Math.exp(-reaction.rate * dt));
        amount = clamp(amount, 0, next[reaction.from]);
        next[reaction.from] -= amount;
        next[reaction.to] += amount;
        fluxes.push({ id: reaction.id, amount: amount, rate: reaction.rate });
      });
      return { abundance: next, fluxes: fluxes, total: abundanceTotal(next) };
    }

    function productiveRateMax(rows) {
      return rows.filter(function (row) { return row.macro; }).reduce(function (maximum, row) { return Math.max(maximum, row.rate); }, 0);
    }

    function chooseBottleneck(rows, abundance) {
      var candidates = rows.filter(function (row) { return row.macro && abundance[row.from] > 1e-6; });
      if (!candidates.length) candidates = rows.filter(function (row) { return row.macro; });
      return candidates.reduce(function (slowest, row) { return !slowest || row.rate < slowest.rate ? row : slowest; }, null);
    }

    function simulate(input) {
      var params = normalizeParams(input);
      var abundance = copyAbundance(INITIAL);
      var history = [];
      var freezeOutStep = null;
      for (var step = 0; step < params.steps; step += 1) {
        var theta = params.mode === "cooling"
          ? Math.max(0.12, params.theta * Math.exp(-params.coolingRate * step))
          : params.theta;
        var before = copyAbundance(abundance);
        var rates = rateRows(theta);
        var updated = stepNetwork(abundance, theta, params.dt);
        abundance = updated.abundance;
        if (freezeOutStep === null && productiveRateMax(rates) < params.freezeThreshold) freezeOutStep = step;
        history.push({
          step: step + 1,
          theta: theta,
          before: before,
          abundance: copyAbundance(abundance),
          rates: rates,
          fluxes: updated.fluxes,
          total: updated.total,
          productiveRateMax: productiveRateMax(rates)
        });
      }
      var finalTheta = history.length ? history[history.length - 1].theta : params.theta;
      var finalRates = rateRows(finalTheta);
      var bottleneck = chooseBottleneck(rateRows(params.theta), INITIAL);
      var lowRates = rateRows(0.75);
      var highRates = rateRows(1.25);
      var sensitivity = highRates.map(function (row, index) {
        return {
          id: row.id,
          label: row.label,
          ratio: row.rate / lowRates[index].rate
        };
      });
      return {
        params: params,
        species: SPECIES,
        reactions: REACTIONS,
        initial: copyAbundance(INITIAL),
        abundance: copyAbundance(abundance),
        history: history,
        finalTheta: finalTheta,
        finalRates: finalRates,
        bottleneck: bottleneck,
        sensitivity: sensitivity,
        freezeOutStep: freezeOutStep,
        total: abundanceTotal(abundance),
        conservationError: abundanceTotal(abundance) - 1,
        fuelFraction: abundance.H + abundance.He,
        heavyFraction: abundance.C + abundance.O + abundance.Fe,
        productiveRateMax: productiveRateMax(finalRates)
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
      return element(doc, "div", "nuc-metric", [element(doc, "span", "", label), element(doc, "strong", "", value)]);
    }

    function chartText(doc, x, y, text, className, attrs) {
      var all = attrs || {};
      all.x = x;
      all.y = y;
      all.className = className || "nuc-chart-label";
      return svgNode(doc, "text", all, text);
    }

    function speciesClass(id) {
      return "nuc-line-" + id.toLowerCase();
    }

    function drawChart(doc, result) {
      var svg = svgNode(doc, "svg", {
        viewBox: "0 0 760 360",
        role: "img",
        "aria-label": "toy 核合成网络的丰度随步骤变化"
      });
      svg.appendChild(svgNode(doc, "title", {}, "toy 网络丰度账本"));
      svg.appendChild(svgNode(doc, "desc", {}, "六个质量分数池随确定性反应步骤变化；红色虚线是 toy 转移率系数低于速率常数阈值的步点。"));
      var plot = { x: 52, y: 38, width: 650, height: 230 };
      [0, 0.5, 1].forEach(function (tick) {
        var y = plot.y + plot.height - tick * plot.height;
        svg.appendChild(svgNode(doc, "line", { x1: plot.x, x2: plot.x + plot.width, y1: y, y2: y, className: "nuc-grid" }));
        svg.appendChild(chartText(doc, plot.x - 9, y + 4, format(tick, 1), "nuc-chart-label", { "text-anchor": "end" }));
      });
      svg.appendChild(svgNode(doc, "line", { x1: plot.x, x2: plot.x, y1: plot.y, y2: plot.y + plot.height, className: "nuc-axis" }));
      svg.appendChild(svgNode(doc, "line", { x1: plot.x, x2: plot.x + plot.width, y1: plot.y + plot.height, y2: plot.y + plot.height, className: "nuc-axis" }));
      function px(step) { return plot.x + (step - 1) / Math.max(1, result.history.length - 1) * plot.width; }
      function py(value) { return plot.y + plot.height - clamp(value, 0, 1) * plot.height; }
      SPECIES.forEach(function (species) {
        var path = result.history.map(function (point, index) {
          return (index === 0 ? "M" : "L") + px(point.step).toFixed(2) + " " + py(point.abundance[species.id]).toFixed(2);
        }).join(" ");
        if (!path) path = "M" + plot.x + " " + py(result.initial[species.id]);
        svg.appendChild(svgNode(doc, "path", { d: path, className: speciesClass(species.id) }));
      });
      if (result.freezeOutStep !== null && result.history.length) {
        var freezeX = px(result.freezeOutStep + 1);
        svg.appendChild(svgNode(doc, "line", { x1: freezeX, x2: freezeX, y1: plot.y, y2: plot.y + plot.height, className: "nuc-freeze" }));
        svg.appendChild(chartText(doc, freezeX + 5, plot.y + 17, "系数阈值", "nuc-chart-label"));
      }
      svg.appendChild(chartText(doc, plot.x + 10, plot.y + 17, "丰度 Yᵢ（质量分数 toy）", "nuc-chart-title"));
      svg.appendChild(chartText(doc, plot.x, plot.y + plot.height + 21, "1", "nuc-chart-label"));
      svg.appendChild(chartText(doc, plot.x + plot.width, plot.y + plot.height + 21, String(result.history.length), "nuc-chart-label", { "text-anchor": "end" }));
      SPECIES.forEach(function (species, index) {
        var legendX = plot.x + (index % 3) * 170;
        var legendY = plot.y + plot.height + 47 + Math.floor(index / 3) * 19;
        svg.appendChild(svgNode(doc, "line", { x1: legendX, x2: legendX + 20, y1: legendY - 4, y2: legendY - 4, className: speciesClass(species.id) }));
        svg.appendChild(chartText(doc, legendX + 26, legendY, species.label, "nuc-chart-label"));
      });
      return svg;
    }

    function abundanceTable(doc, result) {
      var table = element(doc, "table", "", []);
      table.appendChild(element(doc, "caption", "", "最终丰度账；每一行仍是 toy 质量分数，不是观测丰度。"));
      table.appendChild(element(doc, "thead", "", [element(doc, "tr", "", ["池", "初始", "最终", "变化", "解释"].map(function (value) { return element(doc, "th", "", value); }))]));
      var body = element(doc, "tbody", "", []);
      SPECIES.forEach(function (species) {
        var change = result.abundance[species.id] - result.initial[species.id];
        body.appendChild(element(doc, "tr", "", [
          element(doc, "th", "", species.label),
          element(doc, "td", "", format(result.initial[species.id], 6)),
          element(doc, "td", "", format(result.abundance[species.id], 6)),
          element(doc, "td", "", format(change, 6)),
          element(doc, "td", "", species.description)
        ]));
      });
      table.appendChild(body);
      return table;
    }

    function reactionTable(doc, result) {
      var table = element(doc, "table", "", []);
      table.appendChild(element(doc, "caption", "", "最终温度处的确定性 toy 转移率系数 k；指数仅是教学参数。"));
      table.appendChild(element(doc, "thead", "", [element(doc, "tr", "", ["反应", "p", "最终 k", "角色"].map(function (value) { return element(doc, "th", "", value); }))]));
      var body = element(doc, "tbody", "", []);
      result.finalRates.forEach(function (row) {
        body.appendChild(element(doc, "tr", "", [
          element(doc, "th", "", row.label),
          element(doc, "td", "", String(row.exponent)),
          element(doc, "td", "", format(row.rate, 6)),
          element(doc, "td", "", row.macro ? "冻结判据纳入" : "Be-8 有效俘获/清空")
        ]));
      });
      table.appendChild(body);
      return table;
    }

    function renderOutput(doc, output, result) {
      replace(output, []);
      output.appendChild(element(doc, "div", "nuc-metrics", [
        metric(doc, "模式", result.params.mode === "cooling" ? "冷却" : "恒温"),
        metric(doc, "最终 θ", format(result.finalTheta, 4)),
        metric(doc, "总丰度", format(result.total, 8)),
        metric(doc, "守恒误差", format(result.conservationError, 3)),
        metric(doc, "toy 瓶颈", result.bottleneck ? result.bottleneck.id : "—"),
        metric(doc, "系数阈值步", result.freezeOutStep === null ? "未触发" : String(result.freezeOutStep + 1)),
        metric(doc, "H+He", format(result.fuelFraction, 5)),
        metric(doc, "C+O+Fe", format(result.heavyFraction, 5))
      ]));
      var status = result.params.mode === "cooling"
        ? "冷却模式：红色虚线只标记 macro toy 转移率系数低于速率常数阈值的步点；恒定的 Be-8 有效清除项不参与判据，之后的近平台来自本网络的 rate law 和有限步长。"
        : "恒温模式：没有把温度下降引入动力学，因此未触发 toy 系数阈值冻结；pp 仍是默认基准下的慢转移率系数入口。";
      output.appendChild(element(doc, "p", "nuc-status", status));
      output.appendChild(element(doc, "div", "nuc-chart-scroll", [element(doc, "div", "nuc-chart-frame", [drawChart(doc, result)])]));
      output.appendChild(element(doc, "div", "nuc-table-scroll", [abundanceTable(doc, result)]));
      output.appendChild(element(doc, "div", "nuc-table-scroll", [reactionTable(doc, result)]));
      output.appendChild(element(doc, "p", "nuc-boundary", "模型边界：这是透明、确定性的 toy 有效链网络；单源池转移不显式消耗第二个 He，Be-8 平衡与竞争道也被折叠进系数。它能核对守恒、保正、相对温度敏感和转移率系数阈值冻结，不能冒充化学计量完整网络、恒星演化 benchmark、详细核反应网络、元素分项产额或真实 r 过程预测。"));
    }

    function announce(api, rootElement, message) {
      if (api && typeof api.announce === "function") api.announce(rootElement, message);
    }

    function mount(rootElement, api) {
      if (!rootElement || !rootElement.ownerDocument) return;
      var doc = rootElement.ownerDocument;
      installStyles(doc);
      var initialPreset = presetById(DEFAULTS.preset);
      var state = {
        preset: initialPreset.id,
        mode: initialPreset.mode,
        theta: initialPreset.theta,
        steps: initialPreset.steps,
        coolingRate: initialPreset.coolingRate,
        revealed: false
      };
      var predictions = {};
      var shell = element(doc, "div", "nuc-lab", []);
      shell.appendChild(element(doc, "p", "nuc-note", "先预测温度敏感、瓶颈、守恒和转移率系数阈值冻结，再打开这个无网络、无随机数的 toy 网络账本。"));
      var predictionBox = element(doc, "div", "nuc-prompt", []);
      var choiceButtons = {};
      QUESTIONS.forEach(function (question) {
        var fieldset = element(doc, "fieldset", "", []);
        fieldset.appendChild(element(doc, "legend", "", question.prompt));
        var choices = element(doc, "div", "nuc-choice-grid", []);
        choiceButtons[question.id] = [];
        question.options.forEach(function (option) {
          var button = element(doc, "button", "", option.label);
          button.type = "button";
          button.addEventListener("click", function () {
            predictions[question.id] = option.id;
            renderPrediction();
            feedback.textContent = "预测已记录；网络数值仍隐藏。";
            feedback.className = "nuc-feedback";
          });
          choiceButtons[question.id].push({ id: option.id, node: button });
          choices.appendChild(button);
        });
        fieldset.appendChild(choices);
        predictionBox.appendChild(fieldset);
      });
      var actions = element(doc, "div", "nuc-actions", []);
      var reveal = element(doc, "button", "nuc-primary", "揭示账本");
      var reset = element(doc, "button", "", "重置");
      reveal.type = "button";
      reset.type = "button";
      actions.appendChild(reveal);
      actions.appendChild(reset);
      predictionBox.appendChild(actions);
      var feedback = element(doc, "p", "nuc-feedback", "每题先作一个预测。");
      feedback.setAttribute("aria-live", "polite");
      predictionBox.appendChild(feedback);
      shell.appendChild(predictionBox);

      var revealedPanel = element(doc, "div", "nuc-revealed", []);
      revealedPanel.hidden = true;
      var layout = element(doc, "div", "nuc-layout", []);
      var controls = element(doc, "div", "nuc-controls", [element(doc, "h4", "", "揭示后调节 toy 网络")]);
      var presetGrid = element(doc, "div", "nuc-preset-grid", []);
      var presetButtons = [];
      PRESETS.forEach(function (preset) {
        var button = element(doc, "button", "", preset.label);
        button.type = "button";
        button.addEventListener("click", function () {
          state.preset = preset.id;
          state.mode = preset.mode;
          state.theta = preset.theta;
          state.steps = preset.steps;
          state.coolingRate = preset.coolingRate;
          render();
          announce(api, rootElement, "已切换到" + preset.label + "，网络账本已更新。");
        });
        presetButtons.push({ id: preset.id, node: button });
        presetGrid.appendChild(button);
      });
      controls.appendChild(presetGrid);
      function rangeControl(label, min, max, step, value, digits, ariaLabel) {
        var wrapper = element(doc, "div", "nuc-control", []);
        var outputValue = element(doc, "output", "", format(value, digits));
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
        return { wrapper: wrapper, input: input, output: outputValue, digits: digits };
      }
      var thetaControl = rangeControl("初始温度倍数 θ", 0.4, 1.35, 0.01, state.theta, 2, "初始温度倍数 theta");
      var stepsControl = rangeControl("反应步数", 1, 80, 1, state.steps, 0, "反应步数");
      var coolingControl = rangeControl("冷却率", 0.01, 0.14, 0.01, state.coolingRate, 2, "指数冷却率");
      controls.appendChild(thetaControl.wrapper);
      controls.appendChild(stepsControl.wrapper);
      controls.appendChild(coolingControl.wrapper);
      layout.appendChild(controls);
      var output = element(doc, "div", "nuc-output", []);
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
        thetaControl.input.value = String(state.theta);
        stepsControl.input.value = String(state.steps);
        coolingControl.input.value = String(state.coolingRate);
        thetaControl.output.textContent = format(state.theta, 2);
        stepsControl.output.textContent = String(state.steps);
        coolingControl.output.textContent = format(state.coolingRate, 2);
        presetButtons.forEach(function (item) {
          item.node.setAttribute("aria-pressed", item.id === state.preset ? "true" : "false");
        });
        renderPrediction();
        if (!state.revealed) {
          revealedPanel.hidden = true;
          feedback.textContent = Object.keys(predictions).length ? "预测已记录；点击“揭示账本”打开网络。" : "每题先作一个预测。";
          feedback.className = "nuc-feedback";
          return;
        }
        revealedPanel.hidden = false;
        renderOutput(doc, output, simulate(state));
      }

      reveal.addEventListener("click", function () {
        var missing = QUESTIONS.filter(function (question) { return !predictions[question.id]; });
        if (missing.length) {
          feedback.textContent = "请先完成全部预测；答案仍未揭晓。";
          feedback.className = "nuc-feedback nuc-warn";
          announce(api, rootElement, feedback.textContent);
          return;
        }
        state.revealed = true;
        var correct = QUESTIONS.every(function (question) { return predictions[question.id] === question.answer; });
        feedback.textContent = correct
          ? "预测命中；现在把 toy 证据与真实核合成边界分开读。"
          : "预测已核对；请重读温度指数、源汇守恒和 toy 转移率系数阈值。";
        feedback.className = "nuc-feedback " + (correct ? "nuc-pass" : "nuc-warn");
        render();
        announce(api, rootElement, "预测答案已揭晓，反应网络丰度与守恒账已显示。");
      });
      reset.addEventListener("click", function () {
        predictions = {};
        state.preset = initialPreset.id;
        state.mode = initialPreset.mode;
        state.theta = initialPreset.theta;
        state.steps = initialPreset.steps;
        state.coolingRate = initialPreset.coolingRate;
        state.revealed = false;
        render();
        announce(api, rootElement, "实验已重置，预测答案再次隐藏。");
      });
      thetaControl.input.addEventListener("input", function () {
        state.theta = clamp(Number(thetaControl.input.value), 0.4, 1.35);
        state.preset = "custom";
        if (state.revealed) render();
      });
      stepsControl.input.addEventListener("input", function () {
        state.steps = clampInteger(stepsControl.input.value, 1, 80, DEFAULTS.steps);
        state.preset = "custom";
        if (state.revealed) render();
      });
      coolingControl.input.addEventListener("input", function () {
        state.coolingRate = clamp(Number(coolingControl.input.value), 0.01, 0.14);
        state.preset = "custom";
        if (state.revealed) render();
      });
      render();
      announce(api, rootElement, "核合成 toy 网络已加载；请先完成四个预测。");
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
      var steady = simulate(DEFAULTS);
      var repeat = simulate(DEFAULTS);
      var freeze = simulate(PRESETS[2]);
      var hot = simulate(PRESETS[1]);
      check(SPECIES.length === 6, "six abundance pools");
      check(REACTIONS.length === 5, "five transparent transfer reactions");
      check(near(abundanceTotal(INITIAL), 1, 1e-12), "initial abundance sums to one");
      check(near(steady.total, 1, 1e-10), "steady network conserves total abundance");
      check(near(freeze.total, 1, 1e-10), "cooling network conserves total abundance");
      check(steady.history.length === DEFAULTS.steps, "default step count is deterministic");
      check(steady.history.every(function (point) { return near(point.total, 1, 1e-10); }), "every ledger row conserves abundance");
      check(SPECIES.every(function (species) { return steady.abundance[species.id] >= -1e-12; }), "abundances stay nonnegative");
      check(REACTIONS.filter(function (reaction) { return reaction.id === "pp"; })[0].exponent === 4, "pp toy exponent is four");
      check(REACTIONS.filter(function (reaction) { return reaction.id === "he-be"; })[0].exponent === 18, "triple-alpha bridge toy exponent is eighteen");
      var sensitivityPP = steady.sensitivity.filter(function (row) { return row.id === "pp"; })[0].ratio;
      var sensitivityTriple = steady.sensitivity.filter(function (row) { return row.id === "he-be"; })[0].ratio;
      check(sensitivityTriple > sensitivityPP, "triple-alpha bridge is more temperature sensitive in the toy");
      check(steady.bottleneck && steady.bottleneck.id === "pp", "default pp is the slow macro bottleneck");
      check(productiveRateMax(rateRows(1)) < rateRows(1).filter(function (row) { return !row.macro; })[0].rate, "freeze criterion excludes the constant Be-8 clearance row");
      check(freeze.freezeOutStep !== null, "cooling preset reaches toy freeze-out");
      check(steady.freezeOutStep === null, "steady preset does not freeze out");
      check(hot.heavyFraction > steady.heavyFraction, "hot preset produces more heavy toy abundance");
      check(steady.abundance.Be8 < 0.02, "short-lived Be-8 pool stays small");
      check(JSON.stringify(steady) === JSON.stringify(repeat), "simulation is deterministic");
      return { checks: checks, presets: PRESETS.length };
    }

    return {
      DEFAULTS: DEFAULTS,
      SPECIES: SPECIES,
      REACTIONS: REACTIONS,
      PRESETS: PRESETS,
      QUESTIONS: QUESTIONS,
      abundanceTotal: abundanceTotal,
      reactionRate: reactionRate,
      rateRows: rateRows,
      stepNetwork: stepNetwork,
      simulate: simulate,
      mount: mount,
      selfTest: selfTest
    };
  }
);
