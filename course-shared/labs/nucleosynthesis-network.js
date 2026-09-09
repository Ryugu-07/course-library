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
    var mountCount = 0;
    var SPECIES = [
      { id: "H", label: "H", description: "H 有效池" },
      { id: "He", label: "He", description: "He 有效池" },
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
      { id: "freeze", label: "冷却：观察系数阈值", mode: "cooling", theta: 1.25, steps: 56, coolingRate: 0.08 }
    ];
    var DEFAULTS = {
      preset: "steady",
      mode: "steady",
      theta: 1,
      steps: 32,
      coolingRate: 0.06,
      dt: 0.5,
      substeps: 1,
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
        prompt: "macro 系数过阈值、但温度有正下限，能推出永远停止反应吗？",
        options: [
          { id: "plateau", label: "不能；有限时段可近平台" },
          { id: "fast", label: "继续快速反应" },
          { id: "reverse", label: "自动反向燃烧" }
        ],
        answer: "plateau"
      }
    ];

    var STYLE_TEXT = [
      ".nuc-lab{--nuc-blue:#315f9d;--nuc-red:var(--cl-red,#b64335);--nuc-gold:var(--cl-gold,#9b6a12);--nuc-green:var(--cl-green,#39734d);max-width:100%;min-width:0;overflow-wrap:anywhere;color:var(--fg);line-height:1.55}",
      "html[data-theme=dark] .nuc-lab{--nuc-blue:#83c8ff;--nuc-red:#f08c7d;--nuc-gold:#e2b458;--nuc-green:#72bd8b;--nuc-purple:#c9a1e8;--nuc-orange:#efa66e}",
      ".nuc-lab *,.nuc-lab *::before,.nuc-lab *::after{box-sizing:border-box}.nuc-lab [hidden]{display:none!important}",
      ".nuc-lab h3,.nuc-lab h4{margin:0;color:var(--fg);letter-spacing:0}.nuc-lab h3{font-size:1.18rem}.nuc-lab h4{margin-top:15px;font-size:1rem}",
      ".nuc-lab .nuc-note,.nuc-lab .nuc-feedback{color:var(--fg-soft);font-size:13px;line-height:1.7}.nuc-lab .nuc-prompt{margin:13px 0;padding:11px 13px;border-left:3px solid var(--nuc-gold);background:var(--bg)}",
      ".nuc-lab fieldset{min-width:0;margin:10px 0;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg)}.nuc-lab legend{max-width:100%;padding:0 4px;color:var(--fg-soft);font-size:13px;line-height:1.5;overflow-wrap:anywhere}",
      ".nuc-lab .nuc-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.nuc-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.nuc-lab button:hover{border-color:var(--accent)}.nuc-lab button[aria-pressed=true],.nuc-lab button.nuc-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}.nuc-lab button:disabled{cursor:not-allowed;opacity:.55}.nuc-lab button:focus-visible,.nuc-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}",
      ".nuc-lab .nuc-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.nuc-lab .nuc-actions>*{flex:1 1 170px}.nuc-lab .nuc-feedback{min-height:2em;margin:8px 0;font-weight:700}.nuc-lab .nuc-pass{color:var(--nuc-green)}.nuc-lab .nuc-warn{color:var(--nuc-red)}",
      ".nuc-lab .nuc-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.nuc-lab .nuc-layout{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;align-items:start;min-width:0}.nuc-lab .nuc-controls,.nuc-lab .nuc-output{min-width:0}",
      ".nuc-lab .nuc-controls{display:grid;gap:11px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg)}.nuc-lab .nuc-controls h4{margin:0}.nuc-lab .nuc-preset-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:7px}.nuc-lab .nuc-preset-grid button{text-align:left;font-size:12px}.nuc-lab .nuc-control{display:grid;gap:5px;min-width:0}.nuc-lab .nuc-control label{color:var(--fg-soft);font-size:13px;font-weight:700}.nuc-lab .nuc-control output{color:var(--accent);font-variant-numeric:tabular-nums}.nuc-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent)}",
      ".nuc-lab .nuc-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:0 0 12px}.nuc-lab .nuc-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.nuc-lab .nuc-metric:nth-child(4n+1){border-top-color:var(--nuc-blue)}.nuc-lab .nuc-metric:nth-child(4n+2){border-top-color:var(--nuc-gold)}.nuc-lab .nuc-metric:nth-child(4n+3){border-top-color:var(--nuc-green)}.nuc-lab .nuc-metric:nth-child(4n){border-top-color:var(--nuc-red)}.nuc-lab .nuc-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4}.nuc-lab .nuc-metric strong{display:block;margin-top:3px;font-size:14px;line-height:1.45;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
      ".nuc-lab .nuc-status,.nuc-lab .nuc-boundary{margin:10px 0;padding:10px 12px;border-left:3px solid var(--nuc-blue);background:var(--bg);font-size:13px;line-height:1.7}.nuc-lab .nuc-boundary{border-left-color:var(--nuc-gold)}.nuc-lab .nuc-chart-scroll,.nuc-lab .nuc-table-scroll{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}.nuc-lab .nuc-chart-frame{min-width:0;padding:6px;border:1px solid var(--border);border-radius:6px;background:var(--bg)}.nuc-lab svg{display:block;width:100%;height:auto;min-width:620px}.nuc-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.nuc-lab .nuc-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.75}.nuc-lab .nuc-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.7}.nuc-lab .nuc-freeze{stroke:var(--nuc-red);stroke-width:1.6;stroke-dasharray:6 4}.nuc-lab .nuc-line-h{fill:none;stroke:var(--nuc-blue);stroke-width:3}.nuc-lab .nuc-line-he{fill:none;stroke:var(--nuc-gold);stroke-width:3}.nuc-lab .nuc-line-be8{fill:none;stroke:var(--nuc-green);stroke-width:2}.nuc-lab .nuc-line-c{fill:none;stroke:var(--nuc-purple,#7b4f9e);stroke-width:3}.nuc-lab .nuc-line-o{fill:none;stroke:var(--nuc-orange,#b35c2e);stroke-width:3}.nuc-lab .nuc-line-fe{fill:none;stroke:var(--nuc-red);stroke-width:3}.nuc-lab .nuc-chart-label{font-size:11px}.nuc-lab .nuc-chart-title{font-size:13px;font-weight:750}",
      ".nuc-lab table{display:table;width:100%;min-width:700px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.nuc-lab caption{padding:8px 0;text-align:left;color:var(--fg-soft);font-size:12px;line-height:1.55}.nuc-lab th,.nuc-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;white-space:nowrap}.nuc-lab th{color:var(--fg-soft);font-size:11.5px;font-weight:750}.nuc-lab .nuc-good{color:var(--nuc-green);font-weight:750}.nuc-lab .nuc-caution{color:var(--nuc-gold);font-weight:750}",
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
      if (value === 0) return "0";
      var places = digits === undefined ? 4 : digits;
      if (Math.abs(value) >= 10000 || Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4));
      return places === 0 ? value.toFixed(0) : value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
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
      var source = input === undefined ? {} : input;
      if (!source || typeof source !== "object" || Array.isArray(source)) throw new TypeError("参数必须是对象");
      var allowed = ["preset", "mode", "theta", "steps", "coolingRate", "substeps", "dt", "freezeThreshold"];
      Object.keys(source).forEach(function (key) { if (allowed.indexOf(key) < 0) throw new RangeError("未知参数 " + key); });
      var id = source.preset === undefined ? "steady" : source.preset;
      if (!["steady", "hot", "freeze", "custom"].includes(id)) throw new RangeError("未知预设");
      var preset = presetById(id);
      function number(key, fallback, min, max, integer) {
        var value = source[key] === undefined ? fallback : source[key];
        if (!finite(value) || value < min || value > max || (integer && !Number.isInteger(value))) throw new RangeError("非法参数 " + key);
        return value;
      }
      var mode = source.mode === undefined ? preset.mode : source.mode;
      if (mode !== "steady" && mode !== "cooling") throw new RangeError("未知模式");
      var substeps = number("substeps", 1, 1, 8, true);
      if (![1,2,4,8].includes(substeps)) throw new RangeError("子步数只能为1、2、4、8");
      return {preset:id, mode:mode, theta:number("theta",preset.theta,.4,1.35),
        steps:number("steps",preset.steps,1,80,true), coolingRate:number("coolingRate",preset.coolingRate,.01,.14),
        substeps:substeps, dt:number("dt",.5,.5,.5), freezeThreshold:number("freezeThreshold",.01,.01,.01)};
    }

    // Uniformization of the simultaneous column-conservative generator.
    // The omitted Poisson tail is bounded before stopping; no normalization is applied.
    function validateStep(abundance, theta, dt) {
      if (!finite(theta) || theta < .12 || theta > 1.35 || !finite(dt) || dt <= 0 || dt > .5) throw new RangeError("超出步进定义域");
      if (!abundance || typeof abundance !== "object" || Array.isArray(abundance) || Object.keys(abundance).length !== 6 || !SPECIES.every(function(sp){return Object.hasOwn(abundance,sp.id) && finite(abundance[sp.id]) && abundance[sp.id]>=0 && abundance[sp.id]<=1;})) throw new RangeError("非法有效池权重");
    }
    function referenceStep(abundance, theta, dt) {
      validateStep(abundance,theta,dt);
      var rates = rateRows(theta), lambda = Math.max.apply(null, rates.map(function (r) { return r.rate; }));
      var z = lambda * dt, weight = Math.exp(-z), term = copyAbundance(abundance), sum = {};
      SPECIES.forEach(function (sp) { sum[sp.id] = weight * term[sp.id]; });
      var tail = Infinity, n;
      for (n=1; n<=200; n++) {
        var next = copyAbundance(term);
        rates.forEach(function (r) {
          var moved = term[r.from] * (r.rate / lambda);
          next[r.from] -= moved; next[r.to] += moved;
        });
        term = next; weight *= z/n;
        SPECIES.forEach(function (sp) { sum[sp.id] += weight * term[sp.id]; });
        var nextWeight = weight*z/(n+1), ratio = z/(n+2);
        if (ratio < 1) { tail = nextWeight/(1-ratio); if (tail <= 1e-15) break; }
      }
      if (n>200) throw new Error("矩阵指数参照超出工作预算");
      return {abundance:sum, tailBound:tail, terms:n+1};
    }

    function stepNetwork(abundance, theta, dt) {
      validateStep(abundance,theta,dt);
      var next = copyAbundance(abundance);
      var fluxes = [];
      rateRows(theta).forEach(function (reaction) {
        var amount = next[reaction.from] * (-Math.expm1(-reaction.rate * dt));
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
      var reference = copyAbundance(INITIAL), referenceTailBound = 0, maxTerms = 0;
      var freezeOutStep = null;
      for (var step = 0; step < params.steps; step += 1) {
        var theta = params.mode === "cooling"
          ? Math.max(0.12, params.theta * Math.exp(-params.coolingRate * step))
          : params.theta;
        var before = copyAbundance(abundance);
        var rates = rateRows(theta);
        var updated, fluxes = rates.map(function(r){return {id:r.id,amount:0,rate:r.rate};});
        for (var sub=0; sub<params.substeps; sub++) {
          updated = stepNetwork(abundance, theta, params.dt/params.substeps); abundance = updated.abundance;
          updated.fluxes.forEach(function(f,j){fluxes[j].amount+=f.amount;});
        }
        var ref = referenceStep(reference, theta, params.dt);
        reference = ref.abundance; referenceTailBound += ref.tailBound; maxTerms = Math.max(maxTerms, ref.terms);
        if (freezeOutStep === null && productiveRateMax(rates) < params.freezeThreshold) freezeOutStep = step;
        history.push({
          step: step + 1,
          theta: theta,
          before: before,
          abundance: copyAbundance(abundance),
          reference: copyAbundance(reference),
          rates: rates,
          fluxes: fluxes,
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
        reference: copyAbundance(reference), referenceTailBound:referenceTailBound, maxTerms:maxTerms,
        splittingError: SPECIES.reduce(function (sum, sp) { return sum + Math.abs(abundance[sp.id]-reference[sp.id]); },0),
        referenceDeficit: 1-abundanceTotal(reference),
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
        "aria-label": "有效池权重随步骤变化；实线分步法，虚线同时反应参照"
      });
      svg.appendChild(svgNode(doc, "title", {}, "有效池权重与同时反应参照"));
      svg.appendChild(svgNode(doc, "desc", {}, "六个归一化池从第0步初值开始；同色虚线是同时反应ODE参照。红色竖虚线仅标宏观系数阈值。"));
      var plot = { x: 52, y: 38, width: 650, height: 230 };
      [0, 0.5, 1].forEach(function (tick) {
        var y = plot.y + plot.height - tick * plot.height;
        svg.appendChild(svgNode(doc, "line", { x1: plot.x, x2: plot.x + plot.width, y1: y, y2: y, className: "nuc-grid" }));
        svg.appendChild(chartText(doc, plot.x - 9, y + 4, format(tick, 1), "nuc-chart-label", { "text-anchor": "end" }));
      });
      svg.appendChild(svgNode(doc, "line", { x1: plot.x, x2: plot.x, y1: plot.y, y2: plot.y + plot.height, className: "nuc-axis" }));
      svg.appendChild(svgNode(doc, "line", { x1: plot.x, x2: plot.x + plot.width, y1: plot.y + plot.height, y2: plot.y + plot.height, className: "nuc-axis" }));
      function px(step) { return plot.x + step / result.params.steps * plot.width; }
      function py(value) { return plot.y + plot.height - value * plot.height; }
      SPECIES.forEach(function (species) {
        var points = [{step:0, abundance:result.initial, reference:result.initial}].concat(result.history);
        var path = points.map(function (point, index) {
          return (index === 0 ? "M" : "L") + px(point.step).toFixed(2) + " " + py(point.abundance[species.id]).toFixed(2);
        }).join(" ");
        if (!path) path = "M" + plot.x + " " + py(result.initial[species.id]);
        svg.appendChild(svgNode(doc, "path", { d: path, className: speciesClass(species.id), "data-species": species.id, "data-method":"split" }));
        var refPath = points.map(function (point,index) { return (index ? "L" : "M") + px(point.step).toFixed(2) + " " + py(point.reference[species.id]).toFixed(2); }).join(" ");
        svg.appendChild(svgNode(doc,"path",{d:refPath, className:speciesClass(species.id), "stroke-dasharray":"5 4", "style":"stroke-width:1.5", "data-species":species.id,"data-method":"reference"}));
      });
      if (result.freezeOutStep !== null && result.history.length) {
        var freezeX = px(result.freezeOutStep);
        svg.appendChild(svgNode(doc, "line", { x1: freezeX, x2: freezeX, y1: plot.y, y2: plot.y + plot.height, className: "nuc-freeze" }));
        svg.appendChild(chartText(doc, Math.min(freezeX + 5, plot.x+plot.width-70), plot.y + 35, "系数阈值", "nuc-chart-label"));
      }
      svg.appendChild(chartText(doc, plot.x + 10, plot.y + 17, "有效池权重 Yᵢ（总和 1）", "nuc-chart-title"));
      svg.appendChild(chartText(doc, plot.x, plot.y + plot.height + 21, "0", "nuc-chart-label"));
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
      table.appendChild(element(doc, "caption", "", "同一分段恒温热史：分步法与同时反应 ODE 参照；不是实际核素产额。"));
      table.appendChild(element(doc, "thead", "", [element(doc, "tr", "", ["池", "初始", "分步法", "同时反应参照", "差值"].map(function (value) { return element(doc, "th", "", value); }))]));
      var body = element(doc, "tbody", "", []);
      SPECIES.forEach(function (species) {
        var change = result.abundance[species.id] - result.initial[species.id];
        body.appendChild(element(doc, "tr", "", [
          element(doc, "th", "", species.label),
          element(doc, "td", "", format(result.initial[species.id], 6)),
          element(doc, "td", "", format(result.abundance[species.id], 6)),
          element(doc, "td", "", format(result.reference[species.id], 6)),
          element(doc, "td", "", format(result.abundance[species.id]-result.reference[species.id], 6))
        ]));
      });
      table.appendChild(body);
      return table;
    }

    function reactionTable(doc, result) {
      var table = element(doc, "table", "", []);
      table.appendChild(element(doc, "caption", "", "末段系数与段起点通量；系数乘源池权重才是通量，数值均无量纲。"));
      table.appendChild(element(doc, "thead", "", [element(doc, "tr", "", ["有效通道", "p", "末段 k", "末段起点 kY", "角色"].map(function (value) { return element(doc, "th", "", value); }))]));
      var body = element(doc, "tbody", "", []);
      result.finalRates.forEach(function (row) {
        body.appendChild(element(doc, "tr", "", [
          element(doc, "th", "", row.label),
          element(doc, "td", "", String(row.exponent)),
          element(doc, "td", "", format(row.rate, 6)),
          element(doc, "td", "", format(row.rate * result.history[result.history.length-1].before[row.from], 6)),
          element(doc, "td", "", row.macro ? "系数诊断纳入" : "Be-8 有效俘获/清空")
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
        metric(doc, "初始最慢宏观系数", result.bottleneck ? result.bottleneck.id : "—"),
        metric(doc, "系数阈值步", result.freezeOutStep === null ? "未触发" : String(result.freezeOutStep)),
        metric(doc, "分步误差 L¹", format(result.splittingError, 5)),
        metric(doc, "参照截尾上界", format(result.referenceTailBound, 3))
      ]));
      var status = "每个大步 Δt=0.5；温度在大步内固定。实线每大步分成 " + result.params.substeps + " 个子步逐条转移，虚线解同时反应方程。改变子步数，检查两者差距；两者都守恒并不保证重合。";
      output.appendChild(element(doc, "p", "nuc-status", status));
      output.appendChild(element(doc, "div", "nuc-chart-scroll", [element(doc, "div", "nuc-chart-frame", [drawChart(doc, result)])]));
      output.appendChild(element(doc, "div", "nuc-table-scroll", [abundanceTable(doc, result)]));
      output.appendChild(element(doc, "div", "nuc-table-scroll", [reactionTable(doc, result)]));
      output.appendChild(element(doc, "p", "nuc-boundary", "系数阈值仅检查四条 macro 通道，不含 Be-8 清空，也不检查 kY。恒温低温同样可从第0步满足阈值。冷却 θₛ=max(0.12,θ₀ exp(−γs)) 有正下限，因此有限时段近平台不代表无限时间冻结。参照截尾上界仅含数学级数截断，另有浮点舍入；实验是有效权重链，不是化学计量完整的真实反应网络。"));
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
      state.substeps = 1;
      var uid = "nuc-" + (++mountCount) + "-";
      var predictions = {};
      var shell = element(doc, "div", "nuc-lab", []);
      shell.appendChild(element(doc, "p", "nuc-note", "先预测默认网络，再比较分步误差、温度敏感和系数阈值。所有曲线均为确定性教学模型。"));
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
            state.revealed = false;
            render();
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
      revealedPanel.setAttribute("tabindex","-1");
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
          state.substeps = 1;
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
        input.id = uid + ariaLabel.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, "");
        labelNode.htmlFor = input.id; outputValue.setAttribute("for",input.id);
        wrapper.appendChild(labelNode);
        wrapper.appendChild(input);
        return { wrapper: wrapper, input: input, output: outputValue, digits: digits };
      }
      var thetaControl = rangeControl("初始温度倍数 θ", 0.4, 1.35, 0.01, state.theta, 2, "初始温度倍数 theta");
      var stepsControl = rangeControl("反应步数", 1, 80, 1, state.steps, 0, "反应步数");
      var coolingControl = rangeControl("每大步冷却指数 γ", 0.01, 0.14, 0.01, state.coolingRate, 2, "指数冷却率");
      controls.appendChild(thetaControl.wrapper);
      controls.appendChild(stepsControl.wrapper);
      controls.appendChild(coolingControl.wrapper);
      var subControl = rangeControl("每大步子步数（2的幂）",0,3,1,0,0,"子步细分档位");
      controls.appendChild(subControl.wrapper);
      subControl.input.addEventListener("input",function () { state.substeps = Math.pow(2,Number(subControl.input.value)); if(state.revealed) render(); });
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
        subControl.input.value = String(Math.log2(state.substeps));
        subControl.output.textContent = String(state.substeps);
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
        var params = {}; ["preset","mode","theta","steps","coolingRate","substeps"].forEach(function(k){params[k]=state[k];});
        renderOutput(doc, output, simulate(params));
        output.querySelectorAll(".nuc-chart-scroll,.nuc-table-scroll").forEach(function(node){node.tabIndex=0;node.setAttribute("role","region");node.setAttribute("aria-label",node.className.indexOf("chart")>=0?"权重曲线，可横向滚动":"数值表，可横向滚动");});
        output.querySelectorAll("thead th").forEach(function(node){node.scope="col";});
        output.querySelectorAll("tbody th").forEach(function(node){node.scope="row";});
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
        revealedPanel.focus();
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
        state.substeps = 1;
        render();
        choiceButtons[QUESTIONS[0].id][0].node.focus();
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
      var freeze = simulate({preset:"freeze"});
      var hot = simulate({preset:"hot"});
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
      referenceStep:referenceStep, normalizeParams:normalizeParams, format:format, drawChart:drawChart,
      simulate: simulate,
      mount: mount,
      selfTest: selfTest
    };
  }
);
