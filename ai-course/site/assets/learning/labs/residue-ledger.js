(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("residue-ledger", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("residue-ledger self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("residue-ledger self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "residue-ledger-lab-styles";
  var INSTANCE = 0;
  var EPS = 1e-9;

  var PRESETS = [
    {
      id: "inside-outside",
      label: "CCW：内外分账",
      note: "一阶、二阶在内，三阶在外；普通定理可用。",
      center: { x: 0, y: 0 }, radius: 1, direction: "ccw", turns: 1,
      poles: [
        { id: "z0", label: "z = 0", x: 0, y: 0, order: 1, residue: 1 },
        { id: "zhalf", label: "z = 1/2", x: 0.5, y: 0, order: 2, residue: -0.5 },
        { id: "zthreehalf", label: "z = 3/2", x: 1.5, y: 0, order: 3, residue: 2 }
      ]
    },
    {
      id: "clockwise-double",
      label: "CW：顺时针双绕",
      note: "两个内点随方向得到负 winding；外点仍为 0。",
      center: { x: 0, y: 0 }, radius: 1, direction: "cw", turns: 2,
      poles: [
        { id: "za", label: "z = -1/4", x: -0.25, y: 0, order: 1, residue: 0.75 },
        { id: "zb", label: "z = i/2", x: 0, y: 0.5, order: 3, residue: -0.25 },
        { id: "zc", label: "z = 5/4", x: 1.25, y: 0, order: 2, residue: 4 }
      ]
    },
    {
      id: "on-contour",
      label: "边界极点：暂停普通定理",
      note: "z = 1 在圆上；不能自动套普通留数定理。",
      center: { x: 0, y: 0 }, radius: 1, direction: "ccw", turns: 1,
      poles: [
        { id: "zboundary", label: "z = 1", x: 1, y: 0, order: 1, residue: 1 },
        { id: "zin", label: "z = -1/4", x: -0.25, y: 0, order: 2, residue: 0.5 },
        { id: "zout", label: "z = 3/2", x: 1.5, y: 0, order: 1, residue: -2 }
      ]
    }
  ];

  var STYLE_TEXT = [
    ".rl-lab{--rl-blue:var(--cl-blue,#315f9d);--rl-gold:var(--cl-gold,#95670d);--rl-green:var(--cl-green,#347247);--rl-red:var(--cl-red,#b13d32);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere}",
    ".rl-lab *,.rl-lab *::before,.rl-lab *::after{box-sizing:border-box}.rl-lab [hidden]{display:none!important}.rl-lab h3,.rl-lab h4{margin:0;color:var(--fg);letter-spacing:0}.rl-lab h3{font-size:1.16rem}.rl-lab h4{margin-top:16px;font-size:1rem}.rl-lab p{margin:8px 0}.rl-lab .rl-intro,.rl-lab .rl-note,.rl-lab .rl-feedback{color:var(--fg-soft);font-size:13px;line-height:1.65}",
    ".rl-lab fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border)}.rl-lab legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}.rl-lab .rl-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}",
    ".rl-lab button,.rl-lab select,.rl-lab input{font:inherit}.rl-lab button{min-width:0;min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.rl-lab button:hover{border-color:var(--accent)}.rl-lab button:focus-visible,.rl-lab select:focus-visible,.rl-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.rl-lab button[aria-pressed=true],.rl-lab button.rl-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}.rl-lab button:disabled{opacity:.55;cursor:not-allowed}",
    ".rl-lab .rl-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}.rl-lab .rl-actions>*{flex:1 1 170px}.rl-lab .rl-feedback{min-height:2em;margin:8px 0;font-weight:700}.rl-lab .rl-pass{color:var(--rl-green)}.rl-lab .rl-warn{color:var(--rl-red)}",
    ".rl-lab .rl-layout{display:grid;grid-template-columns:minmax(215px,.65fr) minmax(0,1.35fr);gap:16px;align-items:start}.rl-lab .rl-controls,.rl-lab .rl-stage{min-width:0}.rl-lab .rl-controls{display:grid;gap:10px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg)}.rl-lab .rl-control{display:grid;gap:5px}.rl-lab .rl-control label{color:var(--fg-soft);font-size:12.5px;font-weight:700}.rl-lab .rl-control output{color:var(--accent);font-variant-numeric:tabular-nums}.rl-lab .rl-control select{width:100%;min-height:44px;padding:7px 9px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg)}.rl-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent)}",
    ".rl-lab .rl-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden}.rl-lab .rl-svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg)}.rl-lab .rl-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.rl-lab .rl-axis{stroke:var(--border);stroke-width:1}.rl-lab .rl-contour{fill:var(--rl-blue);fill-opacity:.06;stroke:var(--rl-blue);stroke-width:2}.rl-lab .rl-orientation{stroke:var(--rl-gold);stroke-width:3;fill:none}.rl-lab .rl-inside{fill:var(--rl-green);stroke:var(--bg);stroke-width:2}.rl-lab .rl-outside{fill:var(--fg-soft);stroke:var(--bg);stroke-width:2}.rl-lab .rl-on{fill:var(--rl-red);stroke:var(--bg);stroke-width:2}.rl-lab .rl-pole-label{font-size:11px;font-weight:700;paint-order:stroke;stroke:var(--bg);stroke-width:4px;stroke-linejoin:round}.rl-lab .rl-small{font-size:11px;fill:var(--fg-soft)!important}",
    ".rl-lab .rl-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:8px;margin:12px 0}.rl-lab .rl-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.rl-lab .rl-metric:nth-child(3n+1){border-color:var(--rl-blue)}.rl-lab .rl-metric:nth-child(3n+2){border-color:var(--rl-gold)}.rl-lab .rl-metric:nth-child(3n){border-color:var(--rl-green)}.rl-lab .rl-metric span{display:block;color:var(--fg-soft);font-size:11.5px}.rl-lab .rl-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".rl-lab .rl-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}.rl-lab table{width:100%;min-width:700px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.rl-lab th,.rl-lab td{padding:7px 7px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}.rl-lab th{color:var(--fg-soft);font-size:11.5px}.rl-lab td.rl-center,.rl-lab th.rl-center{text-align:center}.rl-lab .rl-certificate{margin-top:11px;padding:10px 12px;border-left:3px solid var(--rl-green);background:var(--block-bg,var(--bg));font-size:13px}.rl-lab .rl-certificate.rl-blocked{border-color:var(--rl-red)}.rl-lab .rl-checks{display:grid;gap:6px;margin:10px 0 0;padding:0;list-style:none}.rl-lab .rl-checks li{display:grid;grid-template-columns:22px minmax(0,1fr);gap:6px;align-items:start}.rl-lab .rl-check-pass{color:var(--rl-green);font-weight:800}.rl-lab .rl-check-fail{color:var(--rl-red);font-weight:800}",
    "@media(max-width:900px){.rl-lab .rl-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:620px){.rl-lab .rl-choice-grid{grid-template-columns:minmax(0,1fr)}}@media(max-width:420px){.rl-lab .rl-frame{padding:4px}.rl-lab table{font-size:11.5px}.rl-lab th,.rl-lab td{padding-left:5px;padding-right:5px}}@media(prefers-reduced-motion:reduce){.rl-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function finite(value) { return typeof value === "number" && isFinite(value); }
  function integer(value) { return finite(value) && Math.floor(value) === value; }
  function near(a, b, tolerance) {
    return Math.abs(a - b) <= (tolerance || EPS) * Math.max(1, Math.abs(a), Math.abs(b));
  }
  function fail(message) { throw new Error("residue-ledger: " + message); }
  function complex(value) {
    if (typeof value === "number") return { re: value, im: 0 };
    if (value && finite(Number(value.re)) && finite(Number(value.im))) return { re: Number(value.re), im: Number(value.im) };
    fail("residue must be a finite number or complex pair");
  }
  function addComplex(a, b) { return { re: a.re + b.re, im: a.im + b.im }; }
  function scaleComplex(a, factor) { return { re: a.re * factor, im: a.im * factor }; }
  function magnitude(value) { return Math.sqrt(value.re * value.re + value.im * value.im); }
  function copyPoint(point) { return { x: Number(point.x), y: Number(point.y) }; }
  function cloneConfig(config) {
    return {
      id: config.id,
      label: config.label,
      note: config.note,
      center: copyPoint(config.center),
      radius: Number(config.radius),
      direction: config.direction,
      turns: Number(config.turns),
      poles: config.poles.map(function (pole) {
        return { id: pole.id, label: pole.label, x: Number(pole.x), y: Number(pole.y), order: Number(pole.order), residue: complex(pole.residue) };
      })
    };
  }
  function presetById(id) {
    for (var i = 0; i < PRESETS.length; i += 1) if (PRESETS[i].id === id) return PRESETS[i];
    fail("unknown preset: " + id);
  }
  function validateConfig(config) {
    if (!config || !config.center || !finite(Number(config.center.x)) || !finite(Number(config.center.y))) fail("circle center must be finite");
    if (!finite(Number(config.radius)) || Number(config.radius) <= 0) fail("circle radius must be positive");
    if (config.direction !== "ccw" && config.direction !== "cw") fail("direction must be ccw or cw");
    if (!integer(Number(config.turns)) || Number(config.turns) < 1) fail("turns must be a positive integer");
    if (!Array.isArray(config.poles) || config.poles.length === 0) fail("at least one pole is required");
    config.poles.forEach(function (pole, index) {
      if (!pole || !finite(Number(pole.x)) || !finite(Number(pole.y))) fail("pole " + index + " position must be finite");
      if (!integer(Number(pole.order)) || Number(pole.order) < 1) fail("pole " + index + " order must be a positive integer");
      complex(pole.residue);
    });
    return config;
  }
  function classifyPole(pole, contour, tolerance) {
    var dx = Number(pole.x) - Number(contour.center.x);
    var dy = Number(pole.y) - Number(contour.center.y);
    var distance = Math.sqrt(dx * dx + dy * dy);
    var delta = distance - Number(contour.radius);
    var tol = tolerance === undefined ? EPS : Math.max(EPS, Math.abs(Number(tolerance)));
    var status = Math.abs(delta) <= tol ? "on-contour" : (delta < 0 ? "inside" : "outside");
    return { status: status, distance: distance, signedDistance: delta, tolerance: tol };
  }
  function windingNumber(location, contour) {
    if (location.status === "on-contour") return null;
    if (location.status === "outside") return 0;
    return (contour.direction === "cw" ? -1 : 1) * Number(contour.turns);
  }
  function analyze(input) {
    var source = typeof input === "string" ? presetById(input) : (input || PRESETS[0]);
    var config = cloneConfig(source);
    validateConfig(config);
    var entries = config.poles.map(function (pole) {
      var location = classifyPole(pole, config);
      var winding = windingNumber(location, config);
      var residue = complex(pole.residue);
      return {
        id: pole.id,
        label: pole.label,
        x: pole.x,
        y: pole.y,
        order: pole.order,
        residue: residue,
        location: location.status,
        distance: location.distance,
        winding: winding,
        contribution: winding === null ? null : scaleComplex(residue, winding)
      };
    });
    var residueSum = { re: 0, im: 0 };
    var weightedSum = { re: 0, im: 0 };
    entries.forEach(function (entry) {
      if (entry.location === "inside") residueSum = addComplex(residueSum, entry.residue);
      if (entry.contribution) weightedSum = addComplex(weightedSum, entry.contribution);
    });
    var onContour = entries.filter(function (entry) { return entry.location === "on-contour"; });
    var applicable = onContour.length === 0;
    var integral = applicable ? { re: -2 * Math.PI * weightedSum.im, im: 2 * Math.PI * weightedSum.re } : null;
    return {
      config: config,
      entries: entries,
      onContour: onContour,
      ordinaryTheoremApplicable: applicable,
      theoremReason: applicable ? "没有极点落在围道上，可使用 winding 加权留数定理。" : "存在 on-contour 极点；普通留数定理不可直接使用，绕数记为 undefined。",
      residueSum: residueSum,
      windingResidueSum: weightedSum,
      integral: integral,
      orientationSign: config.direction === "cw" ? -1 : 1
    };
  }
  function formatNumber(value, digits) {
    if (!finite(value)) return "—";
    var places = digits === undefined ? 4 : digits;
    var text = Number(value).toFixed(places);
    return text.replace(/0+$/, "").replace(/\.$/, "") || "0";
  }
  function formatComplex(value, digits) {
    if (!value) return "—";
    var re = formatNumber(value.re, digits);
    var im = formatNumber(Math.abs(value.im), digits);
    if (near(value.im, 0, 1e-10)) return re;
    return re + (value.im < 0 ? " − " : " + ") + im + "i";
  }
  function locationLabel(value) {
    return value === "inside" ? "inside（内）" : value === "outside" ? "outside（外）" : "on-contour（在曲线上）";
  }
  function windingLabel(value) { return value === null ? "undefined" : String(value); }
  function assert(condition, message) { if (!condition) fail(message); }

  function selfTest() {
    var checks = 0;
    var basic = analyze("inside-outside");
    assert(basic.entries[0].location === "inside", "origin should be inside"); checks += 1;
    assert(basic.entries[1].order === 2, "second pole order must be audited"); checks += 1;
    assert(basic.entries[2].location === "outside" && basic.entries[2].winding === 0, "outer pole should have zero winding"); checks += 1;
    assert(near(basic.residueSum.re, 0.5) && near(basic.windingResidueSum.re, 0.5), "basic residue sums mismatch"); checks += 1;
    assert(basic.ordinaryTheoremApplicable && near(basic.integral.im, Math.PI), "basic integral certificate mismatch"); checks += 1;

    var clockwise = analyze("clockwise-double");
    assert(clockwise.entries[0].winding === -2 && clockwise.entries[1].winding === -2, "clockwise double winding mismatch"); checks += 1;
    assert(clockwise.entries[2].winding === 0, "clockwise outer pole winding mismatch"); checks += 1;
    assert(near(clockwise.windingResidueSum.re, -1), "clockwise weighted residue sum mismatch"); checks += 1;
    assert(near(clockwise.integral.im, -2 * Math.PI), "clockwise integral orientation mismatch"); checks += 1;

    var boundary = analyze("on-contour");
    assert(boundary.onContour.length === 1 && boundary.entries[0].winding === null, "on-contour winding must be undefined"); checks += 1;
    assert(!boundary.ordinaryTheoremApplicable && boundary.integral === null, "ordinary theorem must be blocked on contour"); checks += 1;
    assert(boundary.residueSum.re === 0.5, "inside sum should exclude on-contour and outside poles"); checks += 1;
    var boundaryQuestions = questionSpecs(boundary);
    assert(boundary.entries.filter(function (entry) { return entry.id === "zin"; })[0].winding === 1, "strict interior pole must keep winding +1 beside an on-contour pole"); checks += 1;
    assert(boundaryQuestions[1].expected === "1", "winding question must ask for the strict interior pole"); checks += 1;
    var clockwiseQuestions = questionSpecs(clockwise);
    assert(clockwiseQuestions[1].expected === "-2", "winding question must include clockwise double-turn sign and magnitude"); checks += 1;

    var changed = analyze({
      id: "custom", label: "custom", note: "", center: { x: 0, y: 0 }, radius: 0.5, direction: "ccw", turns: 3,
      poles: [{ id: "p", label: "p", x: 0, y: 0, order: 4, residue: { re: 1, im: 2 } }]
    });
    assert(changed.entries[0].order === 4 && changed.entries[0].winding === 3, "custom order/winding audit mismatch"); checks += 1;
    assert(changed.windingResidueSum.re === 3 && changed.windingResidueSum.im === 6, "complex residue support mismatch"); checks += 1;

    var rejected = false;
    try { analyze({ center: { x: 0, y: 0 }, radius: 1, direction: "ccw", turns: 1, poles: [{ x: 0, y: 0, order: 0, residue: 1 }] }); } catch (error) { rejected = true; }
    assert(rejected, "zero pole order must be rejected"); checks += 1;
    return { checks: checks, presets: PRESETS.length };
  }

  function setAttributes(node, attributes) {
    Object.keys(attributes || {}).forEach(function (key) {
      var value = attributes[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "text") node.textContent = String(value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }
  function appendChildren(node, children, doc) {
    if (children === undefined || children === null) return node;
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }
  function element(doc, tag, attributes, children) { return appendChildren(setAttributes(doc.createElement(tag), attributes), children, doc); }
  function svgElement(doc, tag, attributes, children) { return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attributes), children, doc); }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function installStyles(doc) {
    if (doc.getElementById && doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    (doc.head || doc.documentElement).appendChild(style);
  }
  function metric(doc, label) {
    var value = element(doc, "strong", { text: "—" });
    return { node: element(doc, "div", { className: "rl-metric" }, [element(doc, "span", { text: label }), value]), value: value };
  }
  function announce(api, root, message) {
    if (api && typeof api.announce === "function") api.announce(root, message);
  }

  function questionSpecs(result) {
    var strictInside = result.entries.filter(function (entry) { return entry.location === "inside"; })[0] || null;
    var expectedWinding = strictInside ? String(strictInside.winding) : "none";
    var windingChoices = [1, -1, 2, -2, 3, -3].map(function (value) {
      return { value: String(value), label: "w = " + (value > 0 ? "+" : "") + value };
    });
    windingChoices.push({ value: "undefined", label: "undefined（只能给曲线上极点）" });
    return [
      { key: "theorem", prompt: "有 on-contour 极点时，普通留数定理能否直接使用？", expected: result.ordinaryTheoremApplicable ? "usable" : "blocked", choices: [{ value: "usable", label: "可以直接使用" }, { value: "blocked", label: "不能直接使用" }] },
      { key: "winding", prompt: strictInside ? "严格在圆内的代表极点 " + strictInside.label + " 的 winding 是多少？（曲线上另有极点也不改变这个局部值。）" : "本配置没有严格内点；曲线上极点的 winding 是什么？", expected: expectedWinding, choices: windingChoices },
      { key: "sum", prompt: "普通定理的 residue sum 应如何计数？", expected: "inside", choices: [{ value: "inside", label: "只计 inside，并乘 winding" }, { value: "all", label: "inside + outside 全部相加" }, { value: "half", label: "on-contour 自动算半个" }] }
    ];
  }
  function renderPredictions(doc, state, refs) {
    var result = analyze(state.config);
    var specs = questionSpecs(result);
    refs.questions.forEach(function (questionRef, index) {
      var spec = specs[index];
      if (questionRef.legend) questionRef.legend.textContent = spec.prompt;
      questionRef.node.setAttribute("data-expected", spec.expected);
      questionRef.buttons.forEach(function (buttonRef) {
        var selected = state.predictions[spec.key] === buttonRef.value;
        buttonRef.node.setAttribute("aria-pressed", selected ? "true" : "false");
        if (state.revealed) {
          var correct = buttonRef.value === spec.expected;
          buttonRef.node.textContent = (correct ? "✓ " : "") + buttonRef.label;
          buttonRef.node.className = correct ? "rl-pass" : "";
          if (selected && !correct) buttonRef.node.className = "rl-warn";
        } else {
          buttonRef.node.textContent = buttonRef.label;
          buttonRef.node.className = "";
        }
      });
    });
  }
  function drawScene(doc, svg, result, uid) {
    clear(svg);
    var center = result.config.center;
    var radius = result.config.radius;
    var scale = 110 / Math.max(1.25 * radius, 1.25);
    function mapX(x) { return 320 + (x - center.x) * scale; }
    function mapY(y) { return 180 - (y - center.y) * scale; }
    var defs = svgElement(doc, "defs", {});
    var marker = svgElement(doc, "marker", { id: uid + "-arrow", markerWidth: "8", markerHeight: "8", refX: "7", refY: "3.5", orient: "auto", markerUnits: "strokeWidth" });
    marker.appendChild(svgElement(doc, "path", { d: "M0,0 L0,7 L7,3.5 z", fill: "var(--rl-gold)" }));
    defs.appendChild(marker); svg.appendChild(defs);
    svg.appendChild(svgElement(doc, "desc", {}, "复平面圆形围道与极点位置；绿色为 inside，灰色为 outside，红色为 on-contour。"));
    svg.appendChild(svgElement(doc, "line", { x1: "40", y1: "180", x2: "600", y2: "180", class: "rl-axis" }));
    svg.appendChild(svgElement(doc, "line", { x1: "320", y1: "35", x2: "320", y2: "325", class: "rl-axis" }));
    svg.appendChild(svgElement(doc, "circle", { cx: mapX(center.x), cy: mapY(center.y), r: radius * scale, class: "rl-contour" }));
    var angle1 = result.config.direction === "ccw" ? -0.25 : 0.25;
    var angle2 = result.config.direction === "ccw" ? 0.25 : -0.25;
    svg.appendChild(svgElement(doc, "path", {
      d: "M " + mapX(center.x + radius * Math.cos(angle1)) + " " + mapY(center.y + radius * Math.sin(angle1)) + " A " + (radius * scale) + " " + (radius * scale) + " 0 0 " + (result.config.direction === "ccw" ? "1" : "0") + " " + mapX(center.x + radius * Math.cos(angle2)) + " " + mapY(center.y + radius * Math.sin(angle2)),
      class: "rl-orientation", "marker-end": "url(#" + uid + "-arrow)"
    }));
    svg.appendChild(svgElement(doc, "text", { x: "48", y: "31", class: "rl-small" }, "方向：" + (result.config.direction === "ccw" ? "CCW ↺" : "CW ↻") + "；绕行 " + result.config.turns + " 圈"));
    result.entries.forEach(function (entry, index) {
      var x = mapX(entry.x), y = mapY(entry.y);
      var className = entry.location === "inside" ? "rl-inside" : entry.location === "outside" ? "rl-outside" : "rl-on";
      svg.appendChild(svgElement(doc, "circle", { cx: x, cy: y, r: String(6 + Math.min(entry.order, 5)), class: className }));
      svg.appendChild(svgElement(doc, "text", { x: x + 9, y: y - 9 - index * 2, class: "rl-pole-label" }, entry.label + " · " + entry.order + " 阶"));
    });
    svg.appendChild(svgElement(doc, "text", { x: "570", y: "173", class: "rl-small" }, "Re z"));
    svg.appendChild(svgElement(doc, "text", { x: "327", y: "45", class: "rl-small" }, "Im z"));
  }
  function renderTable(doc, hostNode, result) {
    var body = element(doc, "tbody", {});
    result.entries.forEach(function (entry) {
      body.appendChild(element(doc, "tr", {}, [
        element(doc, "th", { text: entry.label }),
        element(doc, "td", { className: "rl-center", text: String(entry.order) }),
        element(doc, "td", { text: locationLabel(entry.location) }),
        element(doc, "td", { className: "rl-center", text: windingLabel(entry.winding) }),
        element(doc, "td", { text: formatComplex(entry.residue, 4) }),
        element(doc, "td", { text: formatComplex(entry.contribution, 4) }),
        element(doc, "td", { text: entry.location === "on-contour" ? "普通定理阻断" : "已登记" })
      ]));
    });
    clear(hostNode);
    hostNode.appendChild(element(doc, "table", {}, [
      element(doc, "caption", { text: "极点阶数、位置、winding 与留数和逐行审计" }),
      element(doc, "thead", {}, [element(doc, "tr", {}, [
        element(doc, "th", { text: "极点" }), element(doc, "th", { className: "rl-center", text: "阶数" }), element(doc, "th", { text: "位置" }), element(doc, "th", { className: "rl-center", text: "w(C,z)" }), element(doc, "th", { text: "Res" }), element(doc, "th", { text: "w·Res" }), element(doc, "th", { text: "状态" })
      ])]), body
    ]));
  }
  function renderChecks(doc, hostNode, result) {
    var checks = [
      [result.entries.every(function (entry) { return integer(entry.order) && entry.order >= 1; }), "每个极点阶数都是正整数，并未把高阶极点误写成单极点。"],
      [result.onContour.length === 0, result.onContour.length === 0 ? "没有 on-contour 极点：普通定理的几何前提通过。" : "有 on-contour 极点：普通留数定理不可直接使用。"],
      [result.entries.filter(function (entry) { return entry.location === "outside"; }).every(function (entry) { return entry.winding === 0; }), "outside 极点的 winding 为 0，不进入当前围道账本。"],
      [result.entries.filter(function (entry) { return entry.location === "inside"; }).every(function (entry) { return entry.winding === result.orientationSign * result.config.turns; }), "inside 极点的 winding 与方向、绕行次数一致。"],
      [result.onContour.length === 0 ? result.integral !== null : result.integral === null, result.onContour.length === 0 ? "winding 加权留数和可以生成 2πi 证书。" : "边界极点只生成警告，不伪造积分值。"]
    ];
    clear(hostNode);
    hostNode.appendChild(element(doc, "ul", { className: "rl-checks" }, checks.map(function (check) {
      return element(doc, "li", {}, [element(doc, "span", { className: check[0] ? "rl-check-pass" : "rl-check-fail", text: check[0] ? "✓" : "×" }), element(doc, "span", { text: check[1] })]);
    })));
  }
  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument;
    installStyles(doc);
    var uid = "rl-" + (++INSTANCE);
    var state = { config: cloneConfig(PRESETS[0]), revealed: false, predictions: {}, feedback: "" };
    var refs = { questions: [] };
    var shell = element(doc, "div", { className: "rl-lab" });
    var heading = element(doc, "h3", { text: "留数账本：先判断能不能用定理" });
    var intro = element(doc, "p", { className: "rl-intro", text: "固定有限个带阶数与留数的极点，逐行审计位置、winding 与贡献；on-contour 会锁住普通定理，不用半留数捷径。" });
    var prediction = element(doc, "div", { className: "rl-prediction" });
    prediction.appendChild(element(doc, "p", { className: "rl-intro", text: "先作三项预测；揭晓后才显示圆、极点、表格与证书。" }));
    var specs = questionSpecs(analyze(state.config));
    specs.forEach(function (spec) {
      var fieldset = element(doc, "fieldset", {});
      var legend = element(doc, "legend", { text: spec.prompt });
      fieldset.appendChild(legend);
      var grid = element(doc, "div", { className: "rl-choice-grid" });
      var questionRef = { key: spec.key, node: fieldset, legend: legend, buttons: [] };
      spec.choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", text: choice.label, "aria-pressed": "false" });
        button.addEventListener("click", function () { state.predictions[spec.key] = choice.value; state.feedback = ""; render(); });
        questionRef.buttons.push({ value: choice.value, label: choice.label, node: button });
        grid.appendChild(button);
      });
      fieldset.appendChild(grid); prediction.appendChild(fieldset); refs.questions.push(questionRef);
    });
    var actions = element(doc, "div", { className: "rl-actions" });
    var reveal = element(doc, "button", { type: "button", className: "rl-primary", text: "核对预测并揭晓" });
    var reset = element(doc, "button", { type: "button", text: "重置预测" });
    var feedback = element(doc, "p", { className: "rl-feedback", "aria-live": "polite" });
    actions.appendChild(reveal); actions.appendChild(reset);
    var resultShell = element(doc, "div", { hidden: true });
    var presetSelect = element(doc, "select", { "aria-label": "留数实验预设" }, PRESETS.map(function (preset) { return element(doc, "option", { value: preset.id, text: preset.label }); }));
    var directionSelect = element(doc, "select", { "aria-label": "围道方向" }, [element(doc, "option", { value: "ccw", text: "逆时针 CCW" }), element(doc, "option", { value: "cw", text: "顺时针 CW" })]);
    var radiusInput = element(doc, "input", { type: "range", min: "0.6", max: "1.8", step: "0.1", value: "1", "aria-label": "围道半径" });
    var radiusOutput = element(doc, "output", { text: "1" });
    var turnsInput = element(doc, "input", { type: "range", min: "1", max: "3", step: "1", value: "1", "aria-label": "绕行次数" });
    var turnsOutput = element(doc, "output", { text: "1" });
    var controls = element(doc, "div", { className: "rl-controls" }, [
      element(doc, "div", { className: "rl-control" }, [element(doc, "label", { text: "预设" }), presetSelect]),
      element(doc, "div", { className: "rl-control" }, [element(doc, "label", { text: "方向" }), directionSelect]),
      element(doc, "div", { className: "rl-control" }, [element(doc, "label", {}, ["半径 R = ", radiusOutput]), radiusInput]),
      element(doc, "div", { className: "rl-control" }, [element(doc, "label", {}, ["绕行次数 n = ", turnsOutput]), turnsInput]),
      element(doc, "p", { className: "rl-note", text: "改变任一围道参数会重新锁住预测。on-contour 的 w 只显示 undefined；本工具不会自动替换成主值公式。" })
    ]);
    var svg = svgElement(doc, "svg", { className: "rl-svg", viewBox: "0 0 640 340", role: "img", "aria-label": "复平面围道与极点审计图" });
    var frame = element(doc, "div", { className: "rl-frame" }, [svg]);
    var metricsHost = element(doc, "div", { className: "rl-metrics" });
    var tableHost = element(doc, "div", { className: "rl-table-wrap" });
    var checksHost = element(doc, "div");
    var certificateHost = element(doc, "p", { className: "rl-certificate" });
    var stage = element(doc, "div", { className: "rl-stage" }, [frame, metricsHost, tableHost, checksHost, certificateHost]);
    resultShell.appendChild(element(doc, "div", { className: "rl-layout" }, [controls, stage]));
    shell.appendChild(heading); shell.appendChild(intro); shell.appendChild(prediction); shell.appendChild(actions); shell.appendChild(feedback); shell.appendChild(resultShell);
    clear(root); root.appendChild(shell);

    function lockConfig(nextConfig) { state.config = cloneConfig(nextConfig); state.revealed = false; state.predictions = {}; state.feedback = ""; render(); }
    presetSelect.addEventListener("change", function () { lockConfig(presetById(presetSelect.value)); });
    directionSelect.addEventListener("change", function () { var next = cloneConfig(state.config); next.direction = directionSelect.value; lockConfig(next); });
    radiusInput.addEventListener("input", function () { var next = cloneConfig(state.config); next.radius = Number(radiusInput.value); lockConfig(next); });
    turnsInput.addEventListener("input", function () { var next = cloneConfig(state.config); next.turns = Number(turnsInput.value); lockConfig(next); });
    reveal.addEventListener("click", function () {
      var current = analyze(state.config);
      var currentSpecs = questionSpecs(current);
      var answered = currentSpecs.every(function (spec) { return state.predictions[spec.key] !== undefined; });
      if (!answered) { state.feedback = "请先完成三项预测。"; feedback.className = "rl-feedback rl-warn"; render(); return; }
      var correct = currentSpecs.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length;
      state.revealed = true; state.feedback = "已揭晓：" + correct + "/" + currentSpecs.length + " 命中；现在读逐行审计和定理证书。"; render(); announce(api, root, state.feedback);
    });
    reset.addEventListener("click", function () { state = { config: cloneConfig(PRESETS[0]), revealed: false, predictions: {}, feedback: "" }; render(); announce(api, root, "留数预测与账本已重置。"); });

    function render() {
      var result = analyze(state.config);
      presetSelect.value = state.config.id;
      directionSelect.value = state.config.direction;
      radiusInput.value = String(state.config.radius); radiusOutput.textContent = formatNumber(state.config.radius, 1);
      turnsInput.value = String(state.config.turns); turnsOutput.textContent = String(state.config.turns);
      feedback.textContent = state.feedback || ""; feedback.className = "rl-feedback" + (state.feedback.indexOf("请先") === 0 ? " rl-warn" : "");
      renderPredictions(doc, state, refs);
      resultShell.hidden = !state.revealed;
      if (!state.revealed) return;
      drawScene(doc, svg, result, uid);
      var metrics = [metric(doc, "inside 留数和 ΣRes"), metric(doc, "winding 加权和 ΣwRes"), metric(doc, "方向 / 绕行"), metric(doc, "普通定理"), metric(doc, "积分证书 2πiΣwRes")];
      clear(metricsHost); metrics.forEach(function (item) { metricsHost.appendChild(item.node); });
      metrics[0].value.textContent = formatComplex(result.residueSum, 4);
      metrics[1].value.textContent = formatComplex(result.windingResidueSum, 4);
      metrics[2].value.textContent = (result.config.direction === "ccw" ? "CCW +" : "CW −") + " × " + result.config.turns;
      metrics[3].value.textContent = result.ordinaryTheoremApplicable ? "可用" : "不可直接用";
      metrics[4].value.textContent = result.integral ? formatComplex(result.integral, 4) : "—";
      renderTable(doc, tableHost, result); renderChecks(doc, checksHost, result);
      certificateHost.className = "rl-certificate" + (result.ordinaryTheoremApplicable ? "" : " rl-blocked");
      certificateHost.textContent = result.theoremReason + (result.integral ? " 证书结果：∮ f dz = " + formatComplex(result.integral, 4) + "。" : " 不输出普通定理的积分值；若要讨论主值，必须另行声明定义与局部处理。") + " 该表是所选有限模型的审计，不替代一般定理的条件证明。";
    }
    render();
  }

  return {
    EPS: EPS,
    PRESETS: PRESETS,
    classifyPole: classifyPole,
    windingNumber: windingNumber,
    analyze: analyze,
    formatComplex: formatComplex,
    selfTest: selfTest,
    mount: mount
  };
});
