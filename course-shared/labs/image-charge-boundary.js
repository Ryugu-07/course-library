(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("image-charge-boundary", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("image-charge-boundary self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("image-charge-boundary self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "image-charge-boundary-lab-styles";
  var INSTANCE = 0;
  var EPS = 1e-10;
  var K = 1;
  var EPSILON0 = 1 / (4 * Math.PI);
  var SAMPLE_RADII = [0, 0.5, 1, 2];
  var PRESETS = [
    { id: "unit-positive", label: "q=1，d=1", q: 1, d: 1, probeRadius: 1, note: "默认接地平面；总诱导电荷趋于 −q。" },
    { id: "far-charge", label: "q=2，d=1.5", q: 2, d: 1.5, probeRadius: 1.5, note: "距离改变场的尺度，边界抵消仍逐点成立。" },
    { id: "negative-charge", label: "q=−1，d=0.75", q: -1, d: 0.75, probeRadius: 1, note: "电荷换号，镜像与诱导电荷一起换号；力仍指向平面。" }
  ];
  var STYLE_TEXT = [
    ".icb-lab{--icb-blue:var(--cl-blue,#315f9d);--icb-gold:var(--cl-gold,#95670d);--icb-green:var(--cl-green,#347247);--icb-red:var(--cl-red,#b13d32);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere}",
    ".icb-lab *,.icb-lab *::before,.icb-lab *::after{box-sizing:border-box}.icb-lab [hidden]{display:none!important}.icb-lab h3,.icb-lab h4{margin:0;color:var(--fg);letter-spacing:0}.icb-lab h3{font-size:1.16rem}.icb-lab h4{margin-top:16px;font-size:1rem}.icb-lab p{margin:8px 0}.icb-lab .icb-intro,.icb-lab .icb-note,.icb-lab .icb-feedback{color:var(--fg-soft);font-size:13px;line-height:1.65}",
    ".icb-lab fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border)}.icb-lab legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}.icb-lab .icb-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}",
    ".icb-lab button,.icb-lab select,.icb-lab input{font:inherit}.icb-lab button{min-width:0;min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.icb-lab button:hover{border-color:var(--accent)}.icb-lab button:focus-visible,.icb-lab select:focus-visible,.icb-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.icb-lab button[aria-pressed=true],.icb-lab button.icb-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}.icb-lab button:disabled{opacity:.55;cursor:not-allowed}",
    ".icb-lab .icb-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}.icb-lab .icb-actions>*{flex:1 1 170px}.icb-lab .icb-feedback{min-height:2em;margin:8px 0;font-weight:700}.icb-lab .icb-pass{color:var(--icb-green)}.icb-lab .icb-warn{color:var(--icb-red)}",
    ".icb-lab .icb-layout{display:grid;grid-template-columns:minmax(215px,.64fr) minmax(0,1.36fr);gap:16px;align-items:start}.icb-lab .icb-controls,.icb-lab .icb-stage{min-width:0}.icb-lab .icb-controls{display:grid;gap:10px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg)}.icb-lab .icb-control{display:grid;gap:5px}.icb-lab .icb-control label{color:var(--fg-soft);font-size:12.5px;font-weight:700}.icb-lab .icb-control output{color:var(--accent);font-variant-numeric:tabular-nums}.icb-lab .icb-control select{width:100%;min-height:44px;padding:7px 9px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg)}.icb-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent)}",
    ".icb-lab .icb-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden}.icb-lab .icb-svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg)}.icb-lab .icb-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.icb-lab .icb-plane{stroke:var(--icb-blue);stroke-width:4}.icb-lab .icb-region{fill:var(--icb-blue);fill-opacity:.06}.icb-lab .icb-axis{stroke:var(--border);stroke-width:1}.icb-lab .icb-source{fill:var(--icb-red);stroke:var(--bg);stroke-width:2}.icb-lab .icb-image{fill:none;stroke:var(--icb-gold);stroke-width:3;stroke-dasharray:6 4}.icb-lab .icb-link{stroke:var(--border);stroke-width:1.5;stroke-dasharray:4 4}.icb-lab .icb-arrow{stroke:var(--icb-green);stroke-width:3;fill:none}.icb-lab .icb-probe{fill:var(--icb-blue);stroke:var(--bg);stroke-width:2}.icb-lab .icb-probe-selected{fill:var(--icb-gold);stroke:var(--bg);stroke-width:2}.icb-lab .icb-label{font-size:11px;font-weight:700;paint-order:stroke;stroke:var(--bg);stroke-width:4px;stroke-linejoin:round}.icb-lab .icb-small{font-size:10.5px;fill:var(--fg-soft)!important}",
    ".icb-lab .icb-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:8px;margin:12px 0}.icb-lab .icb-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.icb-lab .icb-metric:nth-child(3n+1){border-color:var(--icb-blue)}.icb-lab .icb-metric:nth-child(3n+2){border-color:var(--icb-gold)}.icb-lab .icb-metric:nth-child(3n){border-color:var(--icb-green)}.icb-lab .icb-metric span{display:block;color:var(--fg-soft);font-size:11.5px}.icb-lab .icb-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".icb-lab .icb-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}.icb-lab table{width:100%;min-width:760px;border-collapse:collapse;font-size:11.5px;font-variant-numeric:tabular-nums}.icb-lab th,.icb-lab td{padding:7px 6px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}.icb-lab th{color:var(--fg-soft);font-size:11px}.icb-lab td.icb-center,.icb-lab th.icb-center{text-align:center}.icb-lab .icb-certificate{margin-top:11px;padding:10px 12px;border-left:3px solid var(--icb-green);background:var(--block-bg,var(--bg));font-size:13px}.icb-lab .icb-checks{display:grid;gap:6px;margin:10px 0 0;padding:0;list-style:none}.icb-lab .icb-checks li{display:grid;grid-template-columns:22px minmax(0,1fr);gap:6px;align-items:start}.icb-lab .icb-check-pass{color:var(--icb-green);font-weight:800}.icb-lab .icb-check-fail{color:var(--icb-red);font-weight:800}",
    "@media(max-width:900px){.icb-lab .icb-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:620px){.icb-lab .icb-choice-grid{grid-template-columns:minmax(0,1fr)}}@media(max-width:420px){.icb-lab .icb-frame{padding:4px}.icb-lab table{font-size:11px}.icb-lab th,.icb-lab td{padding-left:4px;padding-right:4px}}@media(prefers-reduced-motion:reduce){.icb-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function finite(value) { return typeof value === "number" && isFinite(value); }
  function near(a, b, tolerance) { return Math.abs(a - b) <= (tolerance || EPS) * Math.max(1, Math.abs(a), Math.abs(b)); }
  function fail(message) { throw new Error("image-charge-boundary: " + message); }
  function cloneConfig(config) { return { id: config.id, label: config.label, note: config.note, q: Number(config.q), d: Number(config.d), probeRadius: config.probeRadius === undefined ? 1 : Number(config.probeRadius) }; }
  function presetById(id) {
    for (var i = 0; i < PRESETS.length; i += 1) if (PRESETS[i].id === id) return PRESETS[i];
    fail("unknown preset: " + id);
  }
  function validateConfig(config) {
    if (!config || !finite(Number(config.q))) fail("q must be finite");
    if (!finite(Number(config.d)) || Number(config.d) <= 0) fail("d must be positive");
    if (config.probeRadius !== undefined && (!finite(Number(config.probeRadius)) || Number(config.probeRadius) <= 0)) fail("probe radius must be positive");
    return config;
  }
  function distance(point, source) {
    var dx = point.x - source.x, dy = point.y - source.y, dz = point.z - source.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  function sourcePoints(config) {
    return { real: { q: config.q, x: 0, y: 0, z: config.d }, image: { q: -config.q, x: 0, y: 0, z: -config.d } };
  }
  function potential(point, input) {
    var config = input && input.config ? input.config : input;
    validateConfig(config);
    var sources = sourcePoints(config), realDistance = distance(point, sources.real), imageDistance = distance(point, sources.image);
    if (realDistance === 0 || imageDistance === 0) return Infinity;
    return K * sources.real.q / realDistance + K * sources.image.q / imageDistance;
  }
  function field(point, input) {
    var config = input && input.config ? input.config : input;
    validateConfig(config);
    var sources = sourcePoints(config), result = { x: 0, y: 0, z: 0 };
    [sources.real, sources.image].forEach(function (source) {
      var dx = point.x - source.x, dy = point.y - source.y, dz = point.z - source.z;
      var radius = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (radius === 0) return;
      var factor = K * source.q / (radius * radius * radius);
      result.x += factor * dx; result.y += factor * dy; result.z += factor * dz;
    });
    return result;
  }
  function expectedNormalField(rho, config) { return -2 * K * config.q * config.d / Math.pow(rho * rho + config.d * config.d, 1.5); }
  function surfaceChargeDensity(rho, input) {
    var config = input && input.config ? input.config : input;
    validateConfig(config);
    return EPSILON0 * expectedNormalField(Number(rho), config);
  }
  function inducedChargeWithin(radius, input) {
    var config = input && input.config ? input.config : input;
    validateConfig(config);
    var R = Number(radius);
    if (R === Infinity) return -config.q;
    if (!finite(R) || R < 0) fail("induced-charge radius must be nonnegative or infinity");
    return -config.q * (1 - config.d / Math.sqrt(R * R + config.d * config.d));
  }
  function forceOnCharge(input) {
    var config = input && input.config ? input.config : input;
    validateConfig(config);
    return { x: 0, y: 0, z: -K * config.q * config.q / (4 * config.d * config.d) };
  }
  function boundaryAudit(input, radii) {
    var config = input && input.config ? input.config : input;
    validateConfig(config);
    var values = radii || SAMPLE_RADII;
    if (!Array.isArray(values) || values.length === 0) fail("boundary audit needs sample radii");
    return values.map(function (rhoValue) {
      var rho = Number(rhoValue);
      if (!finite(rho) || rho < 0) fail("sample rho must be nonnegative");
      var point = { x: rho, y: 0, z: 0 }, E = field(point, config), expectedEz = expectedNormalField(rho, config);
      return {
        rho: rho,
        potential: potential(point, config),
        tangentialField: Math.sqrt(E.x * E.x + E.y * E.y),
        normalField: E.z,
        expectedNormalField: expectedEz,
        potentialError: potential(point, config),
        normalError: E.z - expectedEz,
        sigma: surfaceChargeDensity(rho, config),
        inducedWithin: inducedChargeWithin(rho, config)
      };
    });
  }
  function solve(input) {
    var source = input && input.config ? input.config : (input || PRESETS[0]);
    var config = cloneConfig(source); validateConfig(config);
    var rows = boundaryAudit(config, SAMPLE_RADII), force = forceOnCharge(config);
    return {
      config: config,
      rows: rows,
      force: force,
      image: { q: -config.q, x: 0, y: 0, z: -config.d, physical: false },
      inducedWithinProbe: inducedChargeWithin(config.probeRadius, config),
      inducedTotal: inducedChargeWithin(Infinity, config),
      maxPotentialError: Math.max.apply(null, rows.map(function (row) { return Math.abs(row.potentialError); })),
      maxTangentialField: Math.max.apply(null, rows.map(function (row) { return Math.abs(row.tangentialField); })),
      maxNormalError: Math.max.apply(null, rows.map(function (row) { return Math.abs(row.normalError); })),
      uniqueness: "z>0；z=0 上的 Dirichlet 值固定为 0；无穷远按衰减条件选取。",
      imageIsPhysical: false
    };
  }
  function formatNumber(value, digits) {
    if (!finite(value)) return "—";
    var text = Number(value).toFixed(digits === undefined ? 6 : digits);
    return text.replace(/0+$/, "").replace(/\.$/, "") || "0";
  }
  function assert(condition, message) { if (!condition) fail(message); }
  function selfTest() {
    var checks = 0;
    var unit = solve(PRESETS[0]);
    assert(unit.rows.every(function (row) { return Math.abs(row.potential) < 1e-12; }), "grounded boundary potential must vanish"); checks += 1;
    assert(unit.rows.every(function (row) { return row.tangentialField < 1e-12; }), "tangential boundary field must vanish"); checks += 1;
    assert(unit.rows.every(function (row) { return Math.abs(row.normalError) < 1e-12; }), "normal field closed form mismatch"); checks += 1;
    assert(near(unit.force.z, -0.25), "image-force magnitude mismatch"); checks += 1;
    assert(near(unit.inducedWithinProbe, -(1 - 1 / Math.sqrt(2))), "finite induced charge mismatch"); checks += 1;
    assert(near(unit.inducedTotal, -1), "total induced charge must be -q"); checks += 1;
    assert(unit.image.q === -1 && unit.image.physical === false && !unit.imageIsPhysical, "image must be marked mathematical"); checks += 1;
    var negative = solve(PRESETS[2]);
    assert(near(negative.inducedTotal, 1) && near(negative.force.z, -1 / (4 * 0.75 * 0.75)), "charge sign/distance scaling mismatch"); checks += 1;
    var offPlane = potential({ x: 0, y: 0, z: 2 }, PRESETS[0]);
    assert(near(offPlane, 2 / 3), "off-boundary potential mismatch"); checks += 1;
    var rejected = false;
    try { solve({ q: 1, d: 0, probeRadius: 1 }); } catch (error) { rejected = true; }
    assert(rejected, "zero source distance must be rejected"); checks += 1;
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
    var style = doc.createElement("style"); style.id = STYLE_ID; style.textContent = STYLE_TEXT; (doc.head || doc.documentElement).appendChild(style);
  }
  function announce(api, root, message) { if (api && typeof api.announce === "function") api.announce(root, message); }
  function metric(doc, label) { var value = element(doc, "strong", { text: "—" }); return { node: element(doc, "div", { className: "icb-metric" }, [element(doc, "span", { text: label }), value]), value: value }; }
  function questionSpecs() {
    return [
      { key: "potential", prompt: "接地平面 z=0 上的电势，逐点应是什么？", expected: "zero", choices: [{ value: "zero", label: "严格为 0" }, { value: "nonzero", label: "随 ρ 变化但非零" }, { value: "unknown", label: "只能抽样估计" }] },
      { key: "image", prompt: "为抵消 z=0 上的势，数学镜像电荷应取什么？", expected: "opposite", choices: [{ value: "opposite", label: "−q，位于 −d" }, { value: "same", label: "+q，位于 −d" }, { value: "surface", label: "把它当表面真实电荷" }] },
      { key: "induced", prompt: "把诱导面电荷积分到无穷远，结果是什么？", expected: "minus", choices: [{ value: "minus", label: "−q" }, { value: "plus", label: "+q" }, { value: "zero", label: "0" }] }
    ];
  }
  function renderPredictions(state, refs) {
    var specs = questionSpecs();
    refs.questions.forEach(function (questionRef, index) {
      var spec = specs[index];
      questionRef.buttons.forEach(function (buttonRef) {
        var selected = state.predictions[spec.key] === buttonRef.value;
        buttonRef.node.setAttribute("aria-pressed", selected ? "true" : "false");
        if (state.revealed) {
          var correct = buttonRef.value === spec.expected;
          buttonRef.node.textContent = (correct ? "✓ " : "") + buttonRef.label;
          buttonRef.node.className = correct ? "icb-pass" : (selected ? "icb-warn" : "");
        } else { buttonRef.node.textContent = buttonRef.label; buttonRef.node.className = ""; }
      });
    });
  }
  function drawScene(doc, svg, result, uid) {
    clear(svg);
    var width = 720, planeY = 205, centerX = 360, scale = 78 / Math.max(result.config.d, 0.75);
    function xFor(rho) { return centerX + rho * scale; }
    var defs = svgElement(doc, "defs", {});
    var marker = svgElement(doc, "marker", { id: uid + "-arrow", markerWidth: "8", markerHeight: "8", refX: "7", refY: "3.5", orient: "auto", markerUnits: "strokeWidth" });
    marker.appendChild(svgElement(doc, "path", { d: "M0,0 L0,7 L7,3.5 z", fill: "var(--icb-green)" })); defs.appendChild(marker); svg.appendChild(defs);
    svg.appendChild(svgElement(doc, "desc", {}, "接地平面上方的真实点电荷、下方数学镜像与边界探针；虚线圆表示镜像不是物理电荷。"));
    svg.appendChild(svgElement(doc, "rect", { x: "35", y: String(planeY), width: String(width - 70), height: "95", class: "icb-region" }));
    svg.appendChild(svgElement(doc, "line", { x1: "35", y1: planeY, x2: width - 35, y2: planeY, class: "icb-plane" }));
    svg.appendChild(svgElement(doc, "line", { x1: centerX, y1: "36", x2: centerX, y2: "304", class: "icb-link" }));
    var realY = planeY - Math.min(120, result.config.d * scale), imageY = planeY + Math.min(95, result.config.d * scale);
    svg.appendChild(svgElement(doc, "circle", { cx: centerX, cy: realY, r: "13", class: "icb-source" }));
    svg.appendChild(svgElement(doc, "text", { x: centerX + 20, y: realY + 4, class: "icb-label" }, "真实 q（物理）"));
    svg.appendChild(svgElement(doc, "circle", { cx: centerX, cy: imageY, r: "13", class: "icb-image" }));
    svg.appendChild(svgElement(doc, "text", { x: centerX + 20, y: imageY + 4, class: "icb-label" }, "−q（数学像，不是物理电荷）"));
    svg.appendChild(svgElement(doc, "text", { x: "48", y: planeY - 9, class: "icb-small" }, "z=0：接地导体，V=0"));
    svg.appendChild(svgElement(doc, "text", { x: "48", y: "31", class: "icb-small" }, "物理区域 z>0"));
    result.rows.forEach(function (row) {
      var px = xFor(row.rho), selected = near(row.rho, result.config.probeRadius, 1e-8);
      if (px < width - 40) svg.appendChild(svgElement(doc, "circle", { cx: px, cy: planeY, r: selected ? "6" : "4", class: selected ? "icb-probe-selected" : "icb-probe" }));
    });
    var probeX = Math.min(width - 50, xFor(result.config.probeRadius));
    var sign = result.config.q >= 0 ? 1 : -1;
    svg.appendChild(svgElement(doc, "line", { x1: probeX, y1: planeY - sign * 28, x2: probeX, y2: planeY + sign * 28, class: "icb-arrow", "marker-end": "url(#" + uid + "-arrow)" }));
    svg.appendChild(svgElement(doc, "text", { x: probeX + 9, y: planeY - sign * 34, class: "icb-label" }, "E_n(ρ=" + formatNumber(result.config.probeRadius, 2) + ")"));
    svg.appendChild(svgElement(doc, "text", { x: "555", y: planeY - 9, class: "icb-small" }, "ρ 方向"));
  }
  function renderTable(doc, hostNode, result) {
    var body = element(doc, "tbody", {});
    result.rows.forEach(function (row) {
      body.appendChild(element(doc, "tr", {}, [
        element(doc, "th", { text: formatNumber(row.rho, 2) }),
        element(doc, "td", { text: formatNumber(row.potential, 10) }),
        element(doc, "td", { text: formatNumber(row.tangentialField, 10) }),
        element(doc, "td", { text: formatNumber(row.normalField, 8) }),
        element(doc, "td", { text: formatNumber(row.expectedNormalField, 8) }),
        element(doc, "td", { text: formatNumber(row.normalError, 10) }),
        element(doc, "td", { text: formatNumber(row.sigma, 8) })
      ]));
    });
    clear(hostNode); hostNode.appendChild(element(doc, "table", {}, [
      element(doc, "caption", { text: "z=0 边界电势、场分量、闭式法向场和诱导密度" }),
      element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "ρ" }), element(doc, "th", { text: "V" }), element(doc, "th", { text: "|E_t|" }), element(doc, "th", { text: "E_z 数值" }), element(doc, "th", { text: "E_z 闭式" }), element(doc, "th", { text: "误差" }), element(doc, "th", { text: "σ(ρ)" })])]), body
    ]));
  }
  function renderChecks(doc, hostNode, result) {
    var checks = [
      [result.maxPotentialError < 1e-10, "边界电势逐点为 0（浮点误差内）。"],
      [result.maxTangentialField < 1e-10, "切向电场逐点为 0；导体表面保持等势。"],
      [result.maxNormalError < 1e-10, "法向场与 −2kqd/(ρ²+d²)^(3/2) 逐点相等。"],
      [near(result.force.z, -K * result.config.q * result.config.q / (4 * result.config.d * result.config.d)), "镜像场给出的力为 −kq²/(4d²)，方向指向平面。"],
      [near(result.inducedTotal, -result.config.q), "诱导面电荷全平面积分为 −q。"],
      [result.imageIsPhysical === false, "镜像只是假想源；物理响应由导体表面的 σ 记录。"]
    ];
    clear(hostNode); hostNode.appendChild(element(doc, "ul", { className: "icb-checks" }, checks.map(function (check) { return element(doc, "li", {}, [element(doc, "span", { className: check[0] ? "icb-check-pass" : "icb-check-fail", text: check[0] ? "✓" : "×" }), element(doc, "span", { text: check[1] })]); })));
  }
  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument; installStyles(doc); var uid = "icb-" + (++INSTANCE);
    var state = { config: cloneConfig(PRESETS[0]), revealed: false, predictions: {}, feedback: "" }, refs = { questions: [] };
    var shell = element(doc, "div", { className: "icb-lab" });
    shell.appendChild(element(doc, "h3", { text: "镜像电荷边界账：先预测，再核对场与力" }));
    shell.appendChild(element(doc, "p", { className: "icb-intro", text: "接地平面 z=0 上方放置 q；下方 −q 只作为数学构造。揭晓后逐点核对 V、E、σ、力与唯一性条件。" }));
    var prediction = element(doc, "div", {}); prediction.appendChild(element(doc, "p", { className: "icb-intro", text: "先预测边界电势、镜像符号和总诱导电荷。" }));
    questionSpecs().forEach(function (spec) {
      var fieldset = element(doc, "fieldset", {}); fieldset.appendChild(element(doc, "legend", { text: spec.prompt })); var grid = element(doc, "div", { className: "icb-choice-grid" }); var questionRef = { key: spec.key, buttons: [] };
      spec.choices.forEach(function (choice) { var button = element(doc, "button", { type: "button", text: choice.label, "aria-pressed": "false" }); button.addEventListener("click", function () { state.predictions[spec.key] = choice.value; state.feedback = ""; render(); }); questionRef.buttons.push({ value: choice.value, label: choice.label, node: button }); grid.appendChild(button); });
      fieldset.appendChild(grid); prediction.appendChild(fieldset); refs.questions.push(questionRef);
    });
    var actions = element(doc, "div", { className: "icb-actions" }); var reveal = element(doc, "button", { type: "button", className: "icb-primary", text: "核对预测并揭晓" }); var reset = element(doc, "button", { type: "button", text: "重置预测" }); var feedback = element(doc, "p", { className: "icb-feedback", "aria-live": "polite" }); actions.appendChild(reveal); actions.appendChild(reset);
    var resultShell = element(doc, "div", { hidden: true }); var presetSelect = element(doc, "select", { "aria-label": "镜像电荷预设" }, PRESETS.map(function (preset) { return element(doc, "option", { value: preset.id, text: preset.label }); }));
    var qInput = element(doc, "input", { type: "range", min: "-2", max: "2", step: "0.25", value: "1", "aria-label": "真实电荷 q" }); var qOutput = element(doc, "output", { text: "1" });
    var dInput = element(doc, "input", { type: "range", min: "0.5", max: "2.5", step: "0.05", value: "1", "aria-label": "电荷高度 d" }); var dOutput = element(doc, "output", { text: "1" });
    var radiusInput = element(doc, "input", { type: "range", min: "0.25", max: "4", step: "0.25", value: "1", "aria-label": "诱导电荷积分半径 R" }); var radiusOutput = element(doc, "output", { text: "1" });
    var controls = element(doc, "div", { className: "icb-controls" }, [element(doc, "div", { className: "icb-control" }, [element(doc, "label", { text: "预设" }), presetSelect]), element(doc, "div", { className: "icb-control" }, [element(doc, "label", {}, ["真实电荷 q = ", qOutput]), qInput]), element(doc, "div", { className: "icb-control" }, [element(doc, "label", {}, ["高度 d = ", dOutput]), dInput]), element(doc, "div", { className: "icb-control" }, [element(doc, "label", {}, ["圆盘积分半径 R = ", radiusOutput]), radiusInput]), element(doc, "p", { className: "icb-note", text: "改变参数会重新锁住预测。物理区域始终是 z>0；镜像圆点只为构造势。" })]);
    var svg = svgElement(doc, "svg", { className: "icb-svg", viewBox: "0 0 720 330", role: "img", "aria-label": "接地平面与镜像电荷剖面图" }); var frame = element(doc, "div", { className: "icb-frame" }, [svg]); var metricsHost = element(doc, "div", { className: "icb-metrics" }); var tableHost = element(doc, "div", { className: "icb-table-wrap" }); var checksHost = element(doc, "div"); var certificateHost = element(doc, "p", { className: "icb-certificate" });
    resultShell.appendChild(element(doc, "div", { className: "icb-layout" }, [controls, element(doc, "div", { className: "icb-stage" }, [frame, metricsHost, tableHost, checksHost, certificateHost])])); shell.appendChild(prediction); shell.appendChild(actions); shell.appendChild(feedback); shell.appendChild(resultShell); clear(root); root.appendChild(shell);
    function lockConfig(next) { state.config = cloneConfig(next); state.revealed = false; state.predictions = {}; state.feedback = ""; render(); }
    presetSelect.addEventListener("change", function () { lockConfig(presetById(presetSelect.value)); });
    qInput.addEventListener("input", function () { var next = cloneConfig(state.config); next.q = Number(qInput.value); lockConfig(next); });
    dInput.addEventListener("input", function () { var next = cloneConfig(state.config); next.d = Number(dInput.value); lockConfig(next); });
    radiusInput.addEventListener("input", function () { var next = cloneConfig(state.config); next.probeRadius = Number(radiusInput.value); lockConfig(next); });
    reveal.addEventListener("click", function () { var specs = questionSpecs(); if (!specs.every(function (spec) { return state.predictions[spec.key] !== undefined; })) { state.feedback = "请先完成三项预测。"; render(); return; } var correct = specs.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length; state.revealed = true; state.feedback = "已揭晓：" + correct + "/" + specs.length + " 命中；现在读边界与唯一性证书。"; render(); announce(api, root, state.feedback); });
    reset.addEventListener("click", function () { state = { config: cloneConfig(PRESETS[0]), revealed: false, predictions: {}, feedback: "" }; render(); announce(api, root, "镜像电荷预测与边界账已重置。"); });
    function render() {
      var result = solve({ config: state.config }); presetSelect.value = state.config.id; qInput.value = String(state.config.q); qOutput.textContent = formatNumber(state.config.q, 2); dInput.value = String(state.config.d); dOutput.textContent = formatNumber(state.config.d, 2); radiusInput.value = String(state.config.probeRadius); radiusOutput.textContent = formatNumber(state.config.probeRadius, 2); feedback.textContent = state.feedback || ""; feedback.className = "icb-feedback" + (state.feedback.indexOf("请先") === 0 ? " icb-warn" : ""); renderPredictions(state, refs); resultShell.hidden = !state.revealed; if (!state.revealed) return;
      drawScene(doc, svg, result, uid);
      var metrics = [metric(doc, "max |V(ρ,0)|"), metric(doc, "max |E_t|"), metric(doc, "max 法向误差"), metric(doc, "力 F_z"), metric(doc, "Q_ind(<R)"), metric(doc, "Q_ind(全平面)")]; clear(metricsHost); metrics.forEach(function (item) { metricsHost.appendChild(item.node); }); metrics[0].value.textContent = formatNumber(result.maxPotentialError, 10); metrics[1].value.textContent = formatNumber(result.maxTangentialField, 10); metrics[2].value.textContent = formatNumber(result.maxNormalError, 10); metrics[3].value.textContent = formatNumber(result.force.z, 8); metrics[4].value.textContent = formatNumber(result.inducedWithinProbe, 8); metrics[5].value.textContent = formatNumber(result.inducedTotal, 8);
      renderTable(doc, tableHost, result); renderChecks(doc, checksHost, result); certificateHost.textContent = "唯一性条件：" + result.uniqueness + " 在这些条件下，验证 V=0 的镜像构造就是物理半空间内的唯一解。镜像 q'=" + formatNumber(result.image.q, 4) + " 位于 z=" + formatNumber(result.image.z, 4) + "，但 imageIsPhysical=false；力只是用镜像场计算真实 q 的受力。有限采样和有限 R 仍不是一般边值证明。";
    }
    render();
  }

  return {
    K: K,
    EPSILON0: EPSILON0,
    PRESETS: PRESETS,
    potential: potential,
    field: field,
    expectedNormalField: expectedNormalField,
    surfaceChargeDensity: surfaceChargeDensity,
    inducedChargeWithin: inducedChargeWithin,
    forceOnCharge: forceOnCharge,
    boundaryAudit: boundaryAudit,
    solve: solve,
    selfTest: selfTest,
    mount: mount
  };
});
