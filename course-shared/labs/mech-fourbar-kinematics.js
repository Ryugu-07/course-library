(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("mech-fourbar-kinematics", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("mech-fourbar-kinematics self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("mech-fourbar-kinematics self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var LAB_ID = "mech-fourbar-kinematics";
  var STYLE_ID = "cl-mech-fourbar-kinematics-styles";
  var INSTANCE = 0;
  var EPS = 1e-9;
  var DEFAULTS = {
    a: 40,
    b: 90,
    c: 40,
    d: 90,
    theta: Math.PI / 3,
    branch: "open"
  };

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function near(a, b, tolerance) {
    var scale = Math.max(1, Math.abs(a), Math.abs(b));
    return Math.abs(a - b) <= (tolerance === undefined ? 1e-9 : tolerance) * scale;
  }

  function finiteNumber(value, name) {
    var number = Number(value);
    if (!isFinite(number)) throw new Error(name + " must be finite");
    return number;
  }

  function positive(value, name) {
    var number = finiteNumber(value, name);
    if (!(number > 0)) throw new Error(name + " must be positive");
    return number;
  }

  function configOf(config) {
    config = config || {};
    var theta = config.theta === undefined ? DEFAULTS.theta : finiteNumber(config.theta, "theta");
    var branch = config.branch === "crossed" ? "crossed" : "open";
    return { a: positive(config.a === undefined ? DEFAULTS.a : config.a, "a"), b: positive(config.b === undefined ? DEFAULTS.b : config.b, "b"), c: positive(config.c === undefined ? DEFAULTS.c : config.c, "c"), d: positive(config.d === undefined ? DEFAULTS.d : config.d, "d"), theta: theta, branch: branch };
  }

  function angleDegrees(radians) {
    return radians * 180 / Math.PI;
  }

  function angleRadians(degrees) {
    return degrees * Math.PI / 180;
  }

  function distance(p, q) {
    return Math.hypot(p.x - q.x, p.y - q.y);
  }

  function cross(u, v) {
    return u.x * v.y - u.y * v.x;
  }

  function dot(u, v) {
    return u.x * v.x + u.y * v.y;
  }

  function grashof(config) {
    var c = configOf(config);
    var links = [
      { name: "a（曲柄）", value: c.a },
      { name: "b（连杆）", value: c.b },
      { name: "c（输出杆）", value: c.c },
      { name: "d（机架）", value: c.d }
    ].sort(function (left, right) { return left.value - right.value; });
    var s = links[0].value;
    var l = links[3].value;
    var other = links[1].value + links[2].value;
    var condition = s + l <= other + EPS;
    var changePoint = near(s + l, other, 1e-8);
    var shortestName = links[0].name;
    var parallelogram = near(c.a, c.c, 1e-8) && near(c.b, c.d, 1e-8);
    var type;
    if (!condition) type = "双摇杆（非 Grashof）";
    else if (parallelogram) type = "平行四边形双曲柄（换点特例）";
    else if (near(c.d, s, 1e-8)) type = "双曲柄";
    else if (near(c.a, s, 1e-8) || near(c.c, s, 1e-8)) type = "曲柄摇杆";
    else type = "双摇杆";
    return {
      s: s,
      l: l,
      pPlusQ: other,
      condition: condition,
      changePoint: changePoint,
      parallelogram: parallelogram,
      shortest: shortestName,
      type: type,
      inequality: s + l <= other + EPS ? "s+l <= p+q" : "s+l > p+q"
    };
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function assemble(config, theta, branch) {
    var c = configOf(config);
    var inputAngle = theta === undefined ? c.theta : finiteNumber(theta, "theta");
    var assemblyBranch = branch === "crossed" || (branch === undefined && c.branch === "crossed") ? "crossed" : "open";
    var A = { x: 0, y: 0 };
    var D = { x: c.d, y: 0 };
    var B = { x: c.a * Math.cos(inputAngle), y: c.a * Math.sin(inputAngle) };
    var delta = { x: D.x - B.x, y: D.y - B.y };
    var BD = Math.hypot(delta.x, delta.y);
    var minimum = Math.abs(c.b - c.c);
    var maximum = c.b + c.c;
    if (!(BD > EPS) || BD < minimum - EPS || BD > maximum + EPS) {
      return {
        feasible: false,
        reason: BD < minimum ? "两圆相离：BD 小于 |b-c|" : (BD > maximum ? "两圆相离：BD 大于 b+c" : "退化的 B-D 距离"),
        A: A,
        B: B,
        C: null,
        D: D,
        BD: BD,
        branch: assemblyBranch,
        theta: inputAngle,
        closureResidual: Infinity,
        transmissionAngle: null,
        deadPoint: false
      };
    }
    var base = (c.b * c.b - c.c * c.c + BD * BD) / (2 * BD);
    var heightSquared = Math.max(0, c.b * c.b - base * base);
    var height = Math.sqrt(heightSquared);
    var ux = delta.x / BD;
    var uy = delta.y / BD;
    var sign = assemblyBranch === "crossed" ? -1 : 1;
    var C = {
      x: B.x + base * ux - sign * height * uy,
      y: B.y + base * uy + sign * height * ux
    };
    var vCB = { x: B.x - C.x, y: B.y - C.y };
    var vCD = { x: D.x - C.x, y: D.y - C.y };
    var cosine = clamp(dot(vCB, vCD) / Math.max(EPS, distance(B, C) * distance(D, C)), -1, 1);
    var included = Math.acos(cosine);
    var transmissionAngle = Math.min(included, Math.PI - included);
    var residual = Math.max(Math.abs(distance(B, C) - c.b), Math.abs(distance(C, D) - c.c));
    return {
      feasible: true,
      reason: "装配可行",
      A: A,
      B: B,
      C: C,
      D: D,
      BD: BD,
      branch: assemblyBranch,
      theta: inputAngle,
      closureResidual: residual,
      transmissionAngle: angleDegrees(transmissionAngle),
      includedAngle: angleDegrees(included),
      deadPoint: Math.abs(cross(vCB, vCD)) <= 1e-7 * Math.max(1, c.b * c.c)
    };
  }

  function toggleAngles(config) {
    var c = configOf(config);
    var denominator = 2 * c.a * c.d;
    var targets = [
      { name: "伸直死点 b+c", distance: c.b + c.c },
      { name: "折叠死点 |b-c|", distance: Math.abs(c.b - c.c) }
    ];
    var output = [];
    targets.forEach(function (target) {
      var cosine = (c.a * c.a + c.d * c.d - target.distance * target.distance) / denominator;
      if (cosine < -1 - EPS || cosine > 1 + EPS) return;
      var base = Math.acos(clamp(cosine, -1, 1));
      [base, 2 * Math.PI - base].forEach(function (angle) {
        var normalized = Math.abs(angle - 2 * Math.PI) < 1e-8 ? 0 : angle;
        if (!output.some(function (item) { return item.name === target.name && near(item.theta, normalized, 1e-8); })) {
          output.push({ name: target.name, theta: normalized, degrees: angleDegrees(normalized) });
        }
      });
    });
    output.sort(function (left, right) { return left.theta - right.theta; });
    return output;
  }

  function sweep(config, count, branch) {
    var c = configOf(config);
    var number = Math.max(8, Math.floor(count === undefined ? 96 : count));
    var assemblyBranch = branch || c.branch;
    var rows = [];
    var feasible = 0;
    var minGamma = Infinity;
    var maxGamma = -Infinity;
    var maxClosure = 0;
    for (var index = 0; index <= number; index += 1) {
      var theta = 2 * Math.PI * index / number;
      var position = assemble(c, theta, assemblyBranch);
      var row = { theta: theta, degrees: angleDegrees(theta), feasible: position.feasible, transmissionAngle: position.transmissionAngle, closureResidual: position.closureResidual, C: position.C };
      rows.push(row);
      if (position.feasible) {
        feasible += 1;
        minGamma = Math.min(minGamma, position.transmissionAngle);
        maxGamma = Math.max(maxGamma, position.transmissionAngle);
        maxClosure = Math.max(maxClosure, position.closureResidual);
      }
    }
    return {
      rows: rows,
      count: number,
      feasibleCount: feasible,
      feasibleFraction: feasible / rows.length,
      minTransmissionAngle: minGamma,
      maxTransmissionAngle: maxGamma,
      maxClosureResidual: maxClosure
    };
  }

  function analyze(config, theta, branch, count) {
    var c = configOf(config);
    var position = assemble(c, theta === undefined ? c.theta : theta, branch || c.branch);
    var fullSweep = sweep(c, count, branch || c.branch);
    return {
      config: c,
      grashof: grashof(c),
      position: position,
      sweep: fullSweep,
      toggles: toggleAngles(c),
      closureResidual: position.closureResidual,
      feasible: position.feasible,
      transmissionAngle: position.transmissionAngle
    };
  }

  function formatNumber(value, digits) {
    if (!isFinite(value)) return "-";
    var places = digits === undefined ? 3 : digits;
    if (places === 0) return value.toFixed(0);
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (attrs[key] === undefined || attrs[key] === null) return;
      if (key === "text") node.textContent = String(attrs[key]);
      else if (key === "className") node.setAttribute("class", attrs[key]);
      else if (key === "htmlFor") node.setAttribute("for", attrs[key]);
      else node.setAttribute(key, String(attrs[key]));
    });
    (children || []).forEach(function (child) {
      if (child !== null && child !== undefined) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function svgElement(doc, tag, attrs) {
    var node = doc.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (attrs[key] !== undefined && attrs[key] !== null) node.setAttribute(key, String(attrs[key]));
    });
    return node;
  }

  function svgText(doc, parent, text, x, y, className) {
    var node = svgElement(doc, "text", { x: x, y: y, "class": className || "mfb-muted" });
    node.textContent = text;
    parent.appendChild(node);
  }

  function mapPoint(point, scale, originX, originY) {
    return { x: originX + point.x * scale, y: originY - point.y * scale };
  }

  function drawSvg(doc, svg, result) {
    clear(svg);
    var width = 700;
    var height = 390;
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "四杆机构当前位置、连杆轨迹与机架");
    var positions = [result.position.A, result.position.B, result.position.C, result.position.D].filter(Boolean).concat(result.sweep.rows.map(function (row) { return row.C; }).filter(Boolean));
    var maxX = Math.max.apply(null, positions.map(function (point) { return Math.abs(point.x); }).concat([result.config.d]));
    var maxY = Math.max.apply(null, positions.map(function (point) { return Math.abs(point.y); }).concat([1]));
    var scale = Math.min(430 / Math.max(1, maxX), 270 / Math.max(1, maxY));
    var ox = 100;
    var oy = 285;
    var A = mapPoint(result.position.A, scale, ox, oy);
    var D = mapPoint(result.position.D, scale, ox, oy);
    svg.appendChild(svgElement(doc, "line", { x1: A.x, y1: A.y, x2: D.x, y2: D.y, stroke: "currentColor", "stroke-width": 8, opacity: 0.55 }));
    var locus = "";
    result.sweep.rows.forEach(function (row, index) {
      if (!row.C) { locus = ""; return; }
      var point = mapPoint(row.C, scale, ox, oy);
      locus += (locus ? "L" : "M") + point.x.toFixed(2) + " " + point.y.toFixed(2) + " ";
    });
    if (locus) svg.appendChild(svgElement(doc, "path", { d: locus, fill: "none", stroke: "var(--mfb-locus)", "stroke-width": 2, opacity: 0.62 }));
    if (result.position.feasible) {
      var B = mapPoint(result.position.B, scale, ox, oy);
      var C = mapPoint(result.position.C, scale, ox, oy);
      svg.appendChild(svgElement(doc, "line", { x1: A.x, y1: A.y, x2: B.x, y2: B.y, stroke: "var(--mfb-blue)", "stroke-width": 6 }));
      svg.appendChild(svgElement(doc, "line", { x1: B.x, y1: B.y, x2: C.x, y2: C.y, stroke: "var(--mfb-orange)", "stroke-width": 6 }));
      svg.appendChild(svgElement(doc, "line", { x1: C.x, y1: C.y, x2: D.x, y2: D.y, stroke: "var(--mfb-green)", "stroke-width": 6 }));
      [
        { point: A, label: "A", className: "mfb-blue" },
        { point: B, label: "B", className: "mfb-blue" },
        { point: C, label: "C", className: "mfb-orange" },
        { point: D, label: "D", className: "mfb-green" }
      ].forEach(function (item) {
        svg.appendChild(svgElement(doc, "circle", { cx: item.point.x, cy: item.point.y, r: 7, fill: "var(--mfb-bg)", stroke: "currentColor", "stroke-width": 2 }));
        svgText(doc, svg, item.label, item.point.x + 9, item.point.y - 9, item.className);
      });
    }
    svgText(doc, svg, "蓝：曲柄  橙：连杆  绿：摇杆", 24, 30, "mfb-muted");
    svgText(doc, svg, "C 的细线轨迹：仅保留可装配位置", 24, 52, "mfb-muted");
    svgText(doc, svg, "theta=" + formatNumber(angleDegrees(result.position.theta), 1) + "°", 540, 30, "mfb-muted");
    svgText(doc, svg, result.position.feasible ? "闭环已闭合" : "当前角度不可装配", 540, 52, result.position.feasible ? "mfb-good" : "mfb-warn");
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

  function metric(doc, label, value) {
    return element(doc, "div", { className: "mfb-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]);
  }

  function injectStyles(doc) {
    if (!doc || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="' + LAB_ID + '"]{--mfb-blue:#1d4ed8;--mfb-orange:#b45309;--mfb-green:#18734a;--mfb-locus:#64748b;--mfb-bg:var(--bg,Canvas);--mfb-warn:#a33b2f;color:var(--fg,inherit);max-width:100%;min-width:0;line-height:1.55}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}' +
      '[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfb-note,[data-learning-lab="' + LAB_ID + '"] .mfb-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.65}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfb-prediction{padding:12px 14px;border-left:4px solid var(--mfb-orange);background:var(--block-bg,transparent)}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{border:1px solid var(--border,currentColor);border-radius:6px;margin:12px 0;padding:10px 12px}' +
      '[data-learning-lab="' + LAB_ID + '"] legend{padding:0 4px;font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfb-options{display:grid;gap:6px}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfb-options label{display:flex;gap:8px;align-items:flex-start;min-height:44px;padding:7px 0;cursor:pointer}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfb-options input{flex:0 0 auto;margin-top:5px;accent-color:var(--mfb-blue)}' +
      '[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input,[data-learning-lab="' + LAB_ID + '"] select{min-height:44px;font:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] input[type=number],[data-learning-lab="' + LAB_ID + '"] select{width:100%;padding:7px 9px;border:1px solid var(--border,currentColor);border-radius:6px;background:var(--bg,Canvas);color:inherit}' +
      '[data-learning-lab="' + LAB_ID + '"] button{padding:8px 13px;border:1px solid var(--border,currentColor);border-radius:6px;background:var(--bg,Canvas);color:inherit;cursor:pointer}' +
      '[data-learning-lab="' + LAB_ID + '"] button:hover,[data-learning-lab="' + LAB_ID + '"] button:focus-visible{border-color:var(--mfb-blue)}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfb-primary{background:var(--mfb-blue);border-color:var(--mfb-blue);color:#fff}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfb-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfb-controls{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px;margin:16px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfb-control{display:grid;gap:5px;min-width:0}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfb-control label{font-weight:700;font-size:13px}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfb-control small{color:var(--fg-soft,currentColor);font-size:11px}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfb-error{min-height:1.6em;color:var(--mfb-warn);font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfb-grid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(260px,.75fr);gap:16px;align-items:start}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfb-chart{min-width:0;border:1px solid var(--border,currentColor);border-radius:6px;padding:7px;background:var(--bg,Canvas)}' +
      '[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;aspect-ratio:700/390;color:var(--fg,inherit)}' +
      '[data-learning-lab="' + LAB_ID + '"] svg text{font-family:inherit;letter-spacing:0;fill:currentColor;font-size:12px}' +
      '[data-learning-lab="' + LAB_ID + '"] svg .mfb-blue{fill:var(--mfb-blue);font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] svg .mfb-orange{fill:var(--mfb-orange);font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] svg .mfb-green{fill:var(--mfb-green);font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] svg .mfb-good{fill:var(--mfb-green);font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] svg .mfb-warn{fill:var(--mfb-warn);font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] svg .mfb-muted{fill:var(--fg-soft,currentColor);font-size:11px}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfb-metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:12px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfb-metric{min-width:0;padding:9px;border-top:3px solid var(--mfb-blue);background:var(--bg,Canvas)}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfb-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfb-metric strong{display:block;margin-top:3px;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + LAB_ID + '"] .mfb-table-wrap{max-width:100%;overflow-x:auto}' +
      '[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:450px;border-collapse:collapse;font-size:12px}' +
      '[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,currentColor);text-align:left;vertical-align:top}' +
      '[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}' +
      'html[data-theme="dark"] [data-learning-lab="' + LAB_ID + '"]{--mfb-blue:#7aa7ff;--mfb-orange:#f0b15a;--mfb-green:#79d39a;--mfb-locus:#a4b4ca;--mfb-warn:#ff9f91}' +
      '@media(max-width:760px){[data-learning-lab="' + LAB_ID + '"] .mfb-controls{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="' + LAB_ID + '"] .mfb-grid{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .mfb-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}' +
      '@media(max-width:390px){[data-learning-lab="' + LAB_ID + '"] .mfb-controls{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .mfb-actions>*{width:100%}[data-learning-lab="' + LAB_ID + '"] .mfb-metrics{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .mfb-prediction{padding:10px}}' +
      '@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{scroll-behavior:auto!important;transition:none!important;animation:none!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }

  function predictionQuestion(doc, uid, question, name, choices) {
    var fieldset = element(doc, "fieldset", {}, [element(doc, "legend", { text: question })]);
    var options = element(doc, "div", { className: "mfb-options" });
    choices.forEach(function (choice) {
      var inputId = uid + "-" + name + "-" + choice.value;
      var input = element(doc, "input", { type: "radio", id: inputId, name: uid + "-" + name, value: choice.value });
      options.appendChild(element(doc, "label", { htmlFor: inputId }, [input, element(doc, "span", { text: choice.label })]));
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
    var input = element(doc, "input", { id: id, type: "number", min: min, max: max, step: step, value: value, "data-key": key });
    return { key: key, input: input, node: element(doc, "div", { className: "mfb-control" }, [element(doc, "label", { htmlFor: id, text: label }), input, element(doc, "small", { text: unit })]) };
  }

  function announce(api, root, message) {
    if (api && typeof api.announce === "function") api.announce(root, message);
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
    var heading = element(doc, "h3", { id: uid + "-heading", text: "四杆位置闭环与传动角实验台" });
    var intro = element(doc, "p", { className: "mfb-note", text: "先判断 Grashof 与当前装配，再揭示几何构造。参数改变后，圆交点、闭环残差、传动角、死点候选和全周可行率一起更新。" });
    var form = element(doc, "form", { className: "mfb-prediction" });
    form.appendChild(predictionQuestion(doc, uid, "默认四杆满足哪一个 Grashof 判断？", "grashof", [
      { value: "yes", label: "满足 s+l<=p+q；等号表示换点边界" },
      { value: "no", label: "不满足，只能双摇杆" },
      { value: "unknown", label: "长度不影响运动类型" }
    ]));
    form.appendChild(predictionQuestion(doc, uid, "默认输入角 theta=60° 时，B、D 两圆能否交出 C？", "assembly", [
      { value: "yes", label: "能，|b-c| <= BD <= b+c" },
      { value: "no", label: "不能，圆心距超出三角形范围" },
      { value: "only-crossed", label: "只有 crossed 分支能装配" }
    ]));
    form.appendChild(predictionQuestion(doc, uid, "当连杆与输出杆共线时，传动角 gamma 会怎样？", "dead", [
      { value: "zero", label: "趋近 0°，是死点/传力恶化位置" },
      { value: "right", label: "保持 90°，传力最好" },
      { value: "full", label: "趋近 180°，但仍同样有效" }
    ]));
    var feedback = element(doc, "p", { className: "mfb-feedback", role: "status", "aria-live": "polite", text: "结果尚未揭示。" });
    form.appendChild(element(doc, "div", { className: "mfb-actions" }, [
      element(doc, "button", { type: "submit", className: "mfb-primary", text: "提交预测并揭示" }),
      element(doc, "button", { type: "button", "data-reset": "true", text: "重置实验" })
    ]));
    form.appendChild(feedback);
    root.appendChild(heading);
    root.appendChild(intro);
    root.appendChild(form);

    var bench = element(doc, "div", { hidden: true });
    var controls = element(doc, "div", { className: "mfb-controls" });
    var fields = [
      inputControl(doc, uid, "a", "曲柄 a", 40, 1, 500, 1, "mm"),
      inputControl(doc, uid, "b", "连杆 b", 90, 1, 500, 1, "mm"),
      inputControl(doc, uid, "c", "输出杆 c", 40, 1, 500, 1, "mm"),
      inputControl(doc, uid, "d", "机架 d", 90, 1, 500, 1, "mm"),
      inputControl(doc, uid, "theta", "输入角 theta", 60, 0, 360, 1, "deg")
    ];
    fields.forEach(function (field) { controls.appendChild(field.node); });
    var branchId = uid + "-branch";
    var branchSelect = element(doc, "select", { id: branchId, "data-key": "branch" }, [
      element(doc, "option", { value: "open", text: "open 装配" }),
      element(doc, "option", { value: "crossed", text: "crossed 装配" })
    ]);
    controls.appendChild(element(doc, "div", { className: "mfb-control" }, [element(doc, "label", { htmlFor: branchId, text: "装配分支" }), branchSelect, element(doc, "small", { text: "圆交点正/负分支" })]));
    bench.appendChild(controls);
    var error = element(doc, "p", { className: "mfb-error", role: "alert", "aria-live": "polite" });
    bench.appendChild(error);
    var grid = element(doc, "div", { className: "mfb-grid" });
    var chart = element(doc, "div", { className: "mfb-chart" });
    var svg = svgElement(doc, "svg", {});
    chart.appendChild(svg);
    var ledger = element(doc, "div", { className: "mfb-table-wrap" });
    grid.appendChild(chart);
    grid.appendChild(ledger);
    bench.appendChild(grid);
    var metrics = element(doc, "div", { className: "mfb-metrics" });
    bench.appendChild(metrics);
    bench.appendChild(element(doc, "h4", { text: "扫过一周的离散闭环账本" }));
    var sweepHost = element(doc, "div", { className: "mfb-table-wrap" });
    bench.appendChild(sweepHost);
    root.appendChild(bench);

    function uiConfig() {
      var values = {};
      fields.forEach(function (field) {
        var raw = field.input.value.trim();
        if (!raw) throw new Error(field.key + " 不能为空");
        var value = Number(raw);
        if (!isFinite(value)) throw new Error(field.key + " 必须是有限数字");
        var min = Number(field.input.getAttribute("min"));
        var max = Number(field.input.getAttribute("max"));
        if (value < min || value > max) throw new Error(field.key + " 超出允许范围");
        values[field.key] = value;
      });
      return { a: values.a, b: values.b, c: values.c, d: values.d, theta: angleRadians(values.theta), branch: branchSelect.value };
    }

    function renderBench() {
      if (!state.revealed) return;
      try {
        var config = uiConfig();
        var result = analyze(config, config.theta, config.branch, 72);
        error.textContent = "";
        drawSvg(doc, svg, result);
        var g = result.grashof;
        var p = result.position;
        clear(metrics);
        metrics.appendChild(metric(doc, "Grashof", g.condition ? (g.changePoint ? "是，换点" : "是") : "否"));
        metrics.appendChild(metric(doc, "装配", p.feasible ? "可行" : "不可行"));
        metrics.appendChild(metric(doc, "gamma", p.feasible ? formatNumber(p.transmissionAngle, 2) + "°" : "-"));
        metrics.appendChild(metric(doc, "闭环残差", p.feasible ? formatNumber(p.closureResidual, 9) + " mm" : "-"));
        metrics.appendChild(metric(doc, "全周可行率", formatNumber(result.sweep.feasibleFraction * 100, 1) + "%"));
        var toggleText = result.toggles.length ? result.toggles.map(function (item) { return item.name + " @ " + formatNumber(item.degrees, 1) + "°"; }).join("；") : "当前尺寸没有解析死点候选";
        renderTable(doc, ledger, ["账本项", "结果", "判读"], [
          ["s+l", formatNumber(g.s + g.l, 3) + " mm", "最短 + 最长"],
          ["p+q", formatNumber(g.pPlusQ, 3) + " mm", g.inequality],
          ["运动类型", g.type, g.shortest + " 最短"],
          ["BD", formatNumber(p.BD, 4) + " mm", "B-D 圆心距"],
          ["位置闭环", p.feasible ? formatNumber(p.closureResidual, 10) + " mm" : p.reason, "|BC-b| 与 |CD-c|"],
          ["传动角 gamma", p.feasible ? formatNumber(p.transmissionAngle, 3) + "°" : "-", "越接近 0° 越接近死点"],
          ["死点候选", toggleText, "共线条件 BD=b+c 或 |b-c|"]
        ]);
        var selectedRows = [0, 18, 36, 54, 72].map(function (index) {
          var row = result.sweep.rows[index];
          return [formatNumber(row.degrees, 1) + "°", row.feasible ? "是" : "否", row.feasible ? formatNumber(row.transmissionAngle, 2) + "°" : "-", row.feasible ? formatNumber(row.closureResidual, 7) : "-" ];
        });
        renderTable(doc, sweepHost, ["theta", "可装配", "gamma", "闭环残差 (mm)"], selectedRows);
      } catch (validationError) {
        error.textContent = "输入校验：" + validationError.message;
        clear(metrics); clear(ledger); clear(sweepHost); clear(svg);
      }
    }

    fields.forEach(function (field) {
      field.input.addEventListener("input", renderBench);
      field.input.addEventListener("change", renderBench);
    });
    branchSelect.addEventListener("change", renderBench);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var answers = {
        grashof: selected(form, uid + "-grashof"),
        assembly: selected(form, uid + "-assembly"),
        dead: selected(form, uid + "-dead")
      };
      if (!answers.grashof || !answers.assembly || !answers.dead) {
        feedback.textContent = "请先完成三项预测；结果仍然隐藏。";
        return;
      }
      state.revealed = true;
      bench.hidden = false;
      var defaultAnalysis = analyze(DEFAULTS, DEFAULTS.theta, DEFAULTS.branch, 24);
      var correct = (answers.grashof === (defaultAnalysis.grashof.condition ? "yes" : "no") ? 1 : 0) + (answers.assembly === (defaultAnalysis.position.feasible ? "yes" : "no") ? 1 : 0) + (answers.dead === "zero" ? 1 : 0);
      feedback.textContent = "已揭示：" + correct + "/3 命中。现在可切换尺寸、角度和装配分支，检查闭环而非只看动画。";
      renderBench();
      announce(api, root, "四杆预测已揭示，位置闭环和传动角账本已显示。");
    });
    form.querySelector('[data-reset="true"]').addEventListener("click", function () {
      form.reset();
      state = { revealed: false };
      bench.hidden = true;
      feedback.textContent = "结果尚未揭示。";
      var defaults = { a: 40, b: 90, c: 40, d: 90, theta: 60 };
      fields.forEach(function (field) { field.input.value = defaults[field.key]; });
      branchSelect.value = "open";
      error.textContent = "";
      clear(metrics); clear(ledger); clear(sweepHost); clear(svg);
      announce(api, root, "四杆实验已重置，预测结果再次隐藏。");
    });
    announce(api, root, "四杆实验已加载；先完成三项预测。");
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var g = grashof(DEFAULTS);
    check(g.condition, "default satisfies Grashof inequality");
    check(g.changePoint, "default records change-point equality");
    check(g.parallelogram, "default detects the opposite-equal-link special case");
    check(g.type.indexOf("平行四边形双曲柄") !== -1, "default motion type");
    var position = assemble(DEFAULTS, DEFAULTS.theta, "open");
    check(position.feasible, "default position is assembleable");
    check(position.closureResidual < 1e-8, "circle intersection closes loop");
    check(position.transmissionAngle > 0, "default transmission angle is measurable");
    var crossed = assemble(DEFAULTS, DEFAULTS.theta, "crossed");
    check(crossed.feasible, "crossed branch is also assembleable");
    check(Math.abs(crossed.C.y - position.C.y) > 1e-6, "branches produce different positions");
    check(toggleAngles(DEFAULTS).length >= 2, "default has two toggle candidates");
    var full = sweep(DEFAULTS, 24, "open");
    check(full.rows.length === 25, "sweep includes endpoints");
    check(full.feasibleFraction > 0.9, "default crank sweep is mostly feasible");
    var nonGrashof = grashof({ a: 40, b: 50, c: 60, d: 120, theta: 0 });
    check(!nonGrashof.condition, "non-Grashof case is detected");
    var invalidCaught = false;
    try { assemble({ a: 0, b: 1, c: 1, d: 1, theta: 0 }, 0, "open"); } catch (error) { invalidCaught = true; }
    check(invalidCaught, "invalid link length is rejected");
    return { checks: checks };
  }

  return {
    DEFAULTS: DEFAULTS,
    configOf: configOf,
    angleDegrees: angleDegrees,
    angleRadians: angleRadians,
    grashof: grashof,
    assemble: assemble,
    toggleAngles: toggleAngles,
    sweep: sweep,
    analyze: analyze,
    mount: mount,
    selfTest: selfTest
  };
});
