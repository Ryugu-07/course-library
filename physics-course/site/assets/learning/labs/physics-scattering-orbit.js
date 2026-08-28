(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("physics-scattering-orbit", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      process.stdout.write("physics-scattering-orbit self-test: PASS (" + report.checks + " checks)\n");
    } catch (error) {
      process.stderr.write("physics-scattering-orbit self-test: FAIL\n" + error.stack + "\n");
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var LAB_ID = "physics-scattering-orbit";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "physics-scattering-orbit-styles";
  var INSTANCE = 0;
  var EPS = 1e-10;
  var PRESETS = [
    { id: "default", label: "基线：E=2，b=3", energy: 2, impact: 3, kappa: 2 },
    { id: "head-on", label: "近正碰：小 b", energy: 2, impact: 0.4, kappa: 2 },
    { id: "fast", label: "高能：偏折变小", energy: 8, impact: 3, kappa: 2 },
    { id: "strong", label: "强排斥：κ=4", energy: 2, impact: 3, kappa: 4 }
  ];

  var STYLE_TEXT = [
    ".ps-lab{--ps-blue:var(--cl-blue,#315f9d);--ps-gold:var(--cl-gold,#9b6a12);--ps-green:var(--cl-green,#39734d);--ps-red:var(--cl-red,#b64335);display:block;max-width:100%;min-width:0;color:var(--fg,#292722);line-height:1.55;overflow-wrap:anywhere}",
    ".ps-lab *,.ps-lab *::before,.ps-lab *::after{box-sizing:border-box}.ps-lab [hidden]{display:none!important}.ps-lab h3,.ps-lab h4{margin:0;letter-spacing:0}.ps-lab h3{font-size:1.16rem}.ps-lab p{margin:8px 0}.ps-lab .ps-note{color:var(--fg-soft,#6b6557);font-size:13px;line-height:1.7}",
    ".ps-lab button,.ps-lab input,.ps-lab select{font:inherit;letter-spacing:0}.ps-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#d7d0c2);border-radius:6px;background:var(--bg,#fff);color:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.ps-lab button:hover{border-color:var(--ps-blue)}.ps-lab button[aria-pressed=true],.ps-lab .ps-primary{border-color:var(--ps-blue);background:var(--ps-blue);color:var(--bg,#fff);font-weight:750}.ps-lab button:focus-visible,.ps-lab input:focus-visible,.ps-lab select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.ps-lab .ps-predict{margin:13px 0 0;padding:12px;border:1px solid var(--border,#d7d0c2);background:var(--block-bg,var(--bg,#fff))}.ps-lab .ps-predict legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}.ps-lab .ps-question{display:grid;gap:7px;margin:10px 0}.ps-lab .ps-question strong{font-size:13px}.ps-lab .ps-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.ps-lab .ps-choices button{font-size:12px}.ps-lab .ps-actions,.ps-lab .ps-presets{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px}.ps-lab .ps-actions>*{flex:1 1 170px}.ps-lab .ps-presets button{flex:1 1 150px;font-size:12px}.ps-lab .ps-feedback{min-height:2em;margin:8px 0;color:var(--fg-soft,#6b6557);font-size:13px;font-weight:700}.ps-lab .ps-good{color:var(--ps-green)}.ps-lab .ps-warn{color:var(--ps-red)}",
    ".ps-lab .ps-reveal{margin-top:18px;padding-top:16px;border-top:1px solid var(--border,#d7d0c2)}.ps-lab .ps-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px;align-items:end;margin:12px 0}.ps-lab .ps-control{display:grid;gap:5px;min-width:0}.ps-lab .ps-control label{color:var(--fg-soft,#6b6557);font-size:12.5px;font-weight:700;line-height:1.45}.ps-lab .ps-control output{color:var(--ps-blue);font-variant-numeric:tabular-nums}.ps-lab .ps-control input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--ps-blue)}.ps-lab .ps-layout{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(260px,.8fr);gap:14px;align-items:start}.ps-lab .ps-stage{min-width:0;padding:7px;border:1px solid var(--border,#d7d0c2);border-radius:7px;background:var(--bg,#fff);overflow:hidden}.ps-lab svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,#292722)}.ps-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.ps-lab .ps-metrics{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin:12px 0}.ps-lab .ps-metric{min-width:0;padding:9px;border-top:2px solid var(--border,#d7d0c2);background:var(--bg,#fff)}.ps-lab .ps-metric:nth-child(3n+1){border-color:var(--ps-blue)}.ps-lab .ps-metric:nth-child(3n+2){border-color:var(--ps-gold)}.ps-lab .ps-metric:nth-child(3n){border-color:var(--ps-green)}.ps-lab .ps-metric span{display:block;color:var(--fg-soft,#6b6557);font-size:11px;line-height:1.4}.ps-lab .ps-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.ps-lab .ps-table-wrap{max-width:100%;margin-top:12px;overflow-x:auto;-webkit-overflow-scrolling:touch}.ps-lab table{width:100%;min-width:620px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.ps-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft,#6b6557);font-size:12px}.ps-lab th,.ps-lab td{padding:7px 8px;border-bottom:1px solid var(--border,#d7d0c2);text-align:left;vertical-align:top}.ps-lab th{color:var(--fg-soft,#6b6557);font-size:11.5px}.ps-lab .ps-status{margin:12px 0 0;padding:10px 12px;border-left:3px solid var(--ps-green);background:var(--block-bg,var(--bg,#fff));font-size:13px;line-height:1.7}.ps-lab .ps-legend{display:flex;flex-wrap:wrap;gap:12px;margin-top:7px;color:var(--fg-soft,#6b6557);font-size:12px}.ps-lab .ps-legend span{display:inline-flex;align-items:center;gap:5px}.ps-lab .ps-swatch{display:inline-block;width:21px;border-top:3px solid var(--ps-blue)}.ps-lab .ps-swatch-gold{border-color:var(--ps-gold)}.ps-lab .ps-swatch-red{border-color:var(--ps-red);border-top-style:dashed}",
    ".ps-lab svg{overflow:visible}.ps-lab .ps-axis{fill:none;stroke:currentColor;stroke-width:1.2;stroke-opacity:.65}.ps-lab .ps-orbit,.ps-lab .ps-potential{fill:none;stroke:var(--ps-blue);stroke-width:2.8;stroke-linecap:round;stroke-linejoin:round}.ps-lab .ps-potential{stroke-width:2.5}.ps-lab .ps-energy{fill:none;stroke:var(--ps-gold);stroke-width:2;stroke-dasharray:6 4}.ps-lab .ps-turn-guide{fill:none;stroke:var(--ps-red);stroke-width:1.4;stroke-dasharray:4 4;stroke-opacity:.8}.ps-lab .ps-radius{fill:none;stroke:var(--ps-red);stroke-width:1.6;stroke-dasharray:4 3}.ps-lab .ps-angle{fill:none;stroke:var(--ps-gold);stroke-width:2.2;stroke-linecap:round}.ps-lab .ps-angle-ray,.ps-lab .ps-arrow{fill:none;stroke:var(--ps-green);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.ps-lab .ps-center{fill:var(--ps-gold);stroke:var(--bg,#fff);stroke-width:1.5}.ps-lab .ps-turn{fill:var(--ps-red);stroke:var(--bg,#fff);stroke-width:1.5}.ps-lab .ps-title{fill:currentColor;font-size:12px;font-weight:750}.ps-lab .ps-label{fill:var(--fg-soft,#6b6557);font-size:11px}.ps-lab .ps-callout{fill:var(--ps-red);font-size:11px;font-weight:750}",
    "@media(max-width:940px){.ps-lab .ps-layout{grid-template-columns:minmax(0,1fr)}.ps-lab .ps-controls{grid-template-columns:repeat(2,minmax(0,1fr))}.ps-lab .ps-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:600px){.ps-lab .ps-controls,.ps-lab .ps-metrics,.ps-lab .ps-choices{grid-template-columns:minmax(0,1fr)}.ps-lab .ps-stage{padding:4px}}@media(prefers-reduced-motion:reduce){.ps-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value)));
  }

  function near(left, right, tolerance) {
    return Math.abs(left - right) <= (tolerance === undefined ? 1e-9 : tolerance) * Math.max(1, Math.abs(left), Math.abs(right));
  }

  function format(value, digits) {
    if (!finite(value)) return "—";
    var places = digits === undefined ? 3 : digits;
    if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4));
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function normalize(input) {
    var source = input || {};
    return {
      energy: clamp(finite(Number(source.energy)) ? Number(source.energy) : 2, 0.5, 20),
      impact: clamp(finite(Number(source.impact)) ? Number(source.impact) : 3, 0, 10),
      kappa: clamp(finite(Number(source.kappa)) ? Number(source.kappa) : 2, 0.2, 8)
    };
  }

  function scattering(input) {
    var state = normalize(input);
    var energy = state.energy;
    var impact = state.impact;
    var kappa = state.kappa;
    var a = kappa / (2 * energy);
    var angle = 2 * Math.atan2(a, Math.max(impact, 0));
    var rMin = a + Math.sqrt(a * a + impact * impact);
    var eccentricity = Math.sqrt(1 + Math.pow(impact / Math.max(a, EPS), 2));
    var sinHalf = Math.sin(angle / 2);
    var differential = Math.pow(kappa / (4 * energy), 2) / Math.pow(Math.max(sinHalf, EPS), 4);
    var effectiveAtTurn = energy * impact * impact / Math.max(rMin * rMin, EPS) + kappa / rMin;
    return {
      energy: energy,
      impact: impact,
      kappa: kappa,
      a: a,
      angle: angle,
      angleDegrees: angle * 180 / Math.PI,
      rMin: rMin,
      eccentricity: eccentricity,
      differentialCrossSection: differential,
      effectiveAtTurn: effectiveAtTurn,
      orbitType: impact < EPS ? "正碰退化轨道" : "双曲线（ε>1）"
    };
  }

  function impactParameterFromAngle(angle, energy, kappa) {
    var theta = Number(angle);
    var e = Number(energy);
    var q = Number(kappa);
    if (!finite(theta) || !finite(e) || !finite(q) || theta <= 0 || theta >= Math.PI || e <= 0 || q <= 0) return 0;
    return q / (2 * e * Math.tan(theta / 2));
  }

  function effectivePotential(data, radius) {
    var r = Math.max(EPS, Number(radius));
    return data.energy * data.impact * data.impact / (r * r) + data.kappa / r;
  }

  function appendStyle(doc) {
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }

  function svgText(x, y, value, className, anchor) {
    return '<text x="' + x + '" y="' + y + '"' + (className ? ' class="' + className + '"' : "") + (anchor ? ' text-anchor="' + anchor + '"' : "") + '>' + String(value) + "</text>";
  }

  function line(x1, y1, x2, y2, className) {
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" class="' + className + '"></line>';
  }

  function orbitRawPoints(data) {
    if (data.impact < EPS) {
      var far = Math.max(data.rMin * 4, 20);
      var radial = [];
      for (var radialIndex = 0; radialIndex <= 72; radialIndex += 1) {
        var distance = radialIndex <= 36
          ? far - (far - data.rMin) * radialIndex / 36
          : data.rMin + (far - data.rMin) * (radialIndex - 36) / 36;
        radial.push({ x: distance, y: 0 });
      }
      return { points: radial, extent: far, turnIndex: 36, radial: true };
    }
    var epsilon = data.eccentricity;
    var asymptote = Math.acos(1 / epsilon);
    var span = Math.max(0.12, Math.min(0.34, asymptote * 0.42));
    var start = -asymptote + span;
    var end = asymptote - span;
    var p = data.impact * data.impact / data.a;
    var points = [];
    var maximum = 0;
    var raw = [];
    for (var i = 0; i <= 72; i += 1) {
      var phi = start + (end - start) * i / 72;
      var radius = p / Math.max(epsilon * Math.cos(phi) - 1, EPS);
      raw.push({ x: radius * Math.cos(phi), y: radius * Math.sin(phi) });
      maximum = Math.max(maximum, Math.abs(radius * Math.cos(phi)), Math.abs(radius * Math.sin(phi)));
    }
    return { points: raw, extent: maximum, turnIndex: 36, radial: false };
  }

  function screenPoint(point, transform) {
    return {
      x: transform.originX - point.x * transform.scale,
      y: transform.originY - point.y * transform.scale
    };
  }

  function pathFromScreenPoints(points) {
    return points.map(function (point, index) {
      return (index === 0 ? "M " : "L ") + point.x.toFixed(2) + " " + point.y.toFixed(2);
    }).join(" ");
  }

  function angleArcGeometry(data) {
    var center = { x: 496, y: 126 };
    var radius = 42;
    var startAngle = -Math.PI / 2;
    var endAngle = startAngle + data.angle;
    var start = { x: center.x + radius * Math.cos(startAngle), y: center.y + radius * Math.sin(startAngle) };
    var end = { x: center.x + radius * Math.cos(endAngle), y: center.y + radius * Math.sin(endAngle) };
    return {
      center: center,
      radius: radius,
      start: start,
      end: end,
      path: "M " + start.x.toFixed(2) + " " + start.y.toFixed(2) + " A " + radius + " " + radius + " 0 " + (data.angle > Math.PI ? 1 : 0) + " 1 " + end.x.toFixed(2) + " " + end.y.toFixed(2)
    };
  }

  function scatteringGeometry(data) {
    var raw = orbitRawPoints(data);
    var transform = {
      originX: 300,
      originY: 126,
      scale: 214 / Math.max(raw.extent, data.rMin * 2, 20)
    };
    var screenPoints = raw.points.map(function (point) { return screenPoint(point, transform); });
    var turnRaw = { x: data.rMin, y: 0 };
    var turnScreen = screenPoint(turnRaw, transform);
    return {
      transform: transform,
      rawPoints: raw.points,
      screenPoints: screenPoints,
      turnRaw: turnRaw,
      turnScreen: turnScreen,
      turnIndex: raw.turnIndex,
      radial: raw.radial,
      path: pathFromScreenPoints(screenPoints),
      angle: angleArcGeometry(data)
    };
  }

  function trajectoryPath(data) {
    return scatteringGeometry(data).path;
  }

  function geometrySvg(data, uid) {
    var geometry = scatteringGeometry(data);
    var turnX = geometry.turnScreen.x;
    var turnY = geometry.turnScreen.y;
    var angle = geometry.angle;
    return [
      '<svg viewBox="0 0 600 220" role="img" aria-labelledby="' + uid + '-geometry-title ' + uid + '-geometry-desc">',
      '<title id="' + uid + '-geometry-title">中心势散射的双曲线轨道几何</title>',
      '<desc id="' + uid + '-geometry-desc">蓝色曲线是由有效势决定的散射轨道，中心金点是散射中心，红色标记是最近接距离，旁边显示散射角。</desc>',
      '<line class="ps-axis" x1="25" y1="126" x2="575" y2="126"></line>',
      '<line class="ps-axis" x1="300" y1="22" x2="300" y2="200"></line>',
      '<path class="ps-orbit" d="' + geometry.path + '"></path>',
      '<circle class="ps-center" cx="300" cy="126" r="6"></circle>',
      '<circle class="ps-turn" cx="' + turnX.toFixed(2) + '" cy="' + turnY + '" r="5"></circle>',
      line(300, 126, turnX, turnY, "ps-radius"),
      line(angle.center.x, angle.center.y, angle.start.x, angle.start.y, "ps-angle-ray"),
      line(angle.center.x, angle.center.y, angle.end.x, angle.end.y, "ps-angle-ray"),
      '<path class="ps-angle" d="' + angle.path + '"></path>',
      '<line class="ps-arrow" x1="77" y1="126" x2="130" y2="126"></line>',
      svgText(73, 113, "入射", "ps-label"),
      svgText(300, 218, "中心势 κ/r", "ps-label", "middle"),
      svgText(turnX - 7, turnY - 10, "r_min", "ps-label", "end"),
      svgText(515, 69, "χ=" + format(data.angleDegrees, 2) + "°", "ps-callout"),
      svgText(300, 18, "轨道/散射几何（单位化显示）", "ps-title", "middle"),
      '</svg>'
    ].join("");
  }

  function potentialSvg(data, uid) {
    var width = 360;
    var left = 47;
    var right = 338;
    var top = 31;
    var bottom = 177;
    var rStart = Math.max(0.12, data.rMin * 0.28);
    var rEnd = Math.max(data.rMin * 2.6, data.impact * 1.8 + data.a * 2, 5);
    var samples = [];
    var maxValue = data.energy * 2.2;
    for (var i = 0; i <= 70; i += 1) {
      var radius = rStart + (rEnd - rStart) * i / 70;
      var value = Math.min(effectivePotential(data, radius), maxValue);
      samples.push({ r: radius, v: value });
    }
    function x(radius) { return left + (radius - rStart) / (rEnd - rStart) * (right - left); }
    function y(value) { return bottom - value / maxValue * (bottom - top); }
    var path = samples.map(function (row, index) { return (index ? "L " : "M ") + x(row.r).toFixed(2) + " " + y(row.v).toFixed(2); }).join(" ");
    var turnX = x(data.rMin);
    var energyY = y(data.energy);
    return [
      '<svg viewBox="0 0 ' + width + ' 220" role="img" aria-labelledby="' + uid + '-potential-title ' + uid + '-potential-desc">',
      '<title id="' + uid + '-potential-title">有效势与转向点</title>',
      '<desc id="' + uid + '-potential-desc">金色水平线是总能量，蓝色曲线是含角动量壁垒的有效势，交点给出最近接距离。</desc>',
      line(left, bottom, right, bottom, "ps-axis"),
      line(left, top, left, bottom, "ps-axis"),
      '<path class="ps-potential" d="' + path + '"></path>',
      '<line class="ps-energy" x1="' + left + '" y1="' + energyY.toFixed(2) + '" x2="' + right + '" y2="' + energyY.toFixed(2) + '"></line>',
      '<line class="ps-turn-guide" x1="' + turnX.toFixed(2) + '" y1="' + energyY.toFixed(2) + '" x2="' + turnX.toFixed(2) + '" y2="' + bottom + '"></line>',
      '<circle class="ps-turn" cx="' + turnX.toFixed(2) + '" cy="' + energyY.toFixed(2) + '" r="4"></circle>',
      svgText((left + right) / 2, 18, "E 与 V_eff(r)", "ps-title", "middle"),
      svgText(right, energyY - 7, "E", "ps-callout", "end"),
      svgText(turnX + 6, bottom - 7, "r_min", "ps-label"),
      svgText(left - 8, top + 3, "V", "ps-label", "end"),
      svgText(right, bottom + 22, "r / fm", "ps-label", "end"),
      svgText(left, energyY + 17, "V_eff=E 才是转向条件", "ps-label"),
      '</svg>'
    ].join("");
  }

  function metric(doc, label, value) {
    var box = doc.createElement("div");
    box.className = "ps-metric";
    var name = doc.createElement("span");
    name.textContent = label;
    var reading = doc.createElement("strong");
    reading.textContent = value;
    box.appendChild(name);
    box.appendChild(reading);
    return box;
  }

  function svgStyleSemantics() {
    var css = STYLE_TEXT;
    var selectors = [
      ".ps-lab svg", ".ps-lab svg text", ".ps-axis", ".ps-orbit", ".ps-potential", ".ps-energy",
      ".ps-turn-guide", ".ps-radius", ".ps-angle", ".ps-angle-ray", ".ps-arrow", ".ps-center",
      ".ps-turn", ".ps-title", ".ps-label", ".ps-callout", ".ps-legend", ".ps-swatch", ".ps-swatch-gold", ".ps-swatch-red"
    ];
    var missing = selectors.filter(function (selector) { return css.indexOf(selector) < 0; });
    return { ok: missing.length === 0, missing: missing };
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument || root.getAttribute("data-ps-mounted") === "true") return;
    var doc = root.ownerDocument;
    appendStyle(doc);
    var uid = LAB_ID + "-" + (++INSTANCE);
    root.setAttribute("data-ps-mounted", "true");
    root.innerHTML = [
      '<div class="ps-lab">',
      '<h3>中心势散射：先猜角度，再让有效势对账</h3>',
      '<p class="ps-note">模型是排斥 Coulomb 势 V(r)=κ/r；能量用 MeV、长度用 fm、约化质量只进入角动量记账。按钮揭示的是确定性公式，不是随机抽样。</p>',
      '<fieldset class="ps-predict"><legend>三项预测</legend>',
      '<div class="ps-question" data-question="0"><strong>1. 在 E、κ 固定时，把冲量参数 b 变小，散射角 χ 会怎样？</strong><div class="ps-choices"><button type="button" data-choice="0">变大</button><button type="button" data-choice="1">变小</button><button type="button" data-choice="2">不变</button></div></div>',
      '<div class="ps-question" data-question="1"><strong>2. 把入射能量 E 提高，固定 b、κ，偏折通常会怎样？</strong><div class="ps-choices"><button type="button" data-choice="0">变大</button><button type="button" data-choice="1">变小</button><button type="button" data-choice="2">只改变最近接距离，不改角度</button></div></div>',
      '<div class="ps-question" data-question="2"><strong>3. 有角动量时，最近接点由哪个条件决定？</strong><div class="ps-choices"><button type="button" data-choice="0">V(r)=E</button><button type="button" data-choice="1">V_eff(r)=E</button><button type="button" data-choice="2">r=b</button></div></div>',
      '</fieldset>',
      '<div class="ps-actions"><button class="ps-primary" type="button" data-action="reveal">提交预测并揭示</button><button type="button" data-action="reset">重置</button></div>',
      '<p class="ps-feedback" role="status" aria-live="polite"></p>',
      '<div class="ps-reveal" hidden>',
      '<div class="ps-presets"></div>',
      '<div class="ps-controls">',
      '<label class="ps-control">E：<output data-output="energy"></output><input data-input="energy" type="range" min="0.5" max="20" step="0.25" value="2" aria-label="入射能量 E，MeV"></label>',
      '<label class="ps-control">b：<output data-output="impact"></output><input data-input="impact" type="range" min="0" max="10" step="0.1" value="3" aria-label="冲量参数 b，fm"></label>',
      '<label class="ps-control">κ：<output data-output="kappa"></output><input data-input="kappa" type="range" min="0.2" max="8" step="0.1" value="2" aria-label="Coulomb 强度 κ，MeV fm"></label>',
      '<span class="ps-control"><span>关系</span><output data-output="relation">b=a cot(χ/2)</output></span>',
      '</div>',
      '<div class="ps-layout"><div class="ps-stage" data-stage="geometry"></div><div class="ps-stage" data-stage="potential"></div></div>',
      '<div class="ps-metrics" data-metrics></div>',
      '<div class="ps-table-wrap"><table><caption>当前模型的守恒量与散射账本</caption><thead><tr><th>量</th><th>数值</th><th>由什么得到</th></tr></thead><tbody data-ledger></tbody></table></div>',
      '<p class="ps-status" data-status role="status" aria-live="polite"></p>',
      '<div class="ps-legend"><span><i class="ps-swatch"></i>轨道与有效势</span><span><i class="ps-swatch ps-swatch-gold"></i>总能量 E</span><span><i class="ps-swatch ps-swatch-red"></i>转向点标记</span></div>',
      '</div></div>'
    ].join("");

    var lab = root.firstElementChild;
    var reveal = lab.querySelector(".ps-reveal");
    var feedback = lab.querySelector(".ps-feedback");
    var inputs = {
      energy: lab.querySelector('[data-input="energy"]'),
      impact: lab.querySelector('[data-input="impact"]'),
      kappa: lab.querySelector('[data-input="kappa"]')
    };
    var predictions = [null, null, null];
    var presetHost = lab.querySelector(".ps-presets");
    PRESETS.forEach(function (preset) {
      var button = doc.createElement("button");
      button.type = "button";
      button.setAttribute("data-preset", preset.id);
      button.textContent = preset.label;
      presetHost.appendChild(button);
    });

    function setState(state) {
      inputs.energy.value = String(state.energy);
      inputs.impact.value = String(state.impact);
      inputs.kappa.value = String(state.kappa);
      render();
    }

    function render() {
      var data = scattering({ energy: Number(inputs.energy.value), impact: Number(inputs.impact.value), kappa: Number(inputs.kappa.value) });
      lab.querySelector('[data-output="energy"]').textContent = format(data.energy, 2) + " MeV";
      lab.querySelector('[data-output="impact"]').textContent = format(data.impact, 2) + " fm";
      lab.querySelector('[data-output="kappa"]').textContent = format(data.kappa, 2) + " MeV fm";
      lab.querySelector('[data-stage="geometry"]').innerHTML = geometrySvg(data, uid);
      lab.querySelector('[data-stage="potential"]').innerHTML = potentialSvg(data, uid);
      var metrics = lab.querySelector("[data-metrics]");
      metrics.replaceChildren(
        metric(doc, "a=κ/(2E)", format(data.a, 3) + " fm"),
        metric(doc, "散射角 χ", format(data.angleDegrees, 3) + "°"),
        metric(doc, "最近接 r_min", format(data.rMin, 3) + " fm"),
        metric(doc, "偏心率 ε", format(data.eccentricity, 3)),
        metric(doc, "dσ/dΩ", format(data.differentialCrossSection, 3) + " fm²/sr"),
        metric(doc, "V_eff(r_min)", format(data.effectiveAtTurn, 3) + " MeV")
      );
      lab.querySelector("[data-ledger]").innerHTML = [
        ["角动量尺度", "L²/(2μ)=E b²", format(data.energy * data.impact * data.impact, 3) + " MeV fm²"],
        ["转向条件", "E=V_eff(r_min)", format(data.effectiveAtTurn - data.energy, 3) + " MeV 残差"],
        ["轨道类型", "ε=√(1+(b/a)²)", data.orbitType],
        ["Rutherford", "(κ/4E)² csc⁴(χ/2)", format(data.differentialCrossSection, 3) + " fm²/sr"]
      ].map(function (row) { return "<tr><th scope=\"row\">" + row[0] + "</th><td>" + row[1] + "</td><td>" + row[2] + "</td></tr>"; }).join("");
      lab.querySelector("[data-status]").textContent = data.impact < EPS
        ? "正碰极限：角动量壁垒消失，轨道退化为径向反弹；仍有 r_min=κ/E。"
        : "蓝线的转向点来自 E=V_eff，而非只看 κ/r；改变 b 会同时改变角动量壁垒与 Rutherford 角分布。";
    }

    lab.addEventListener("click", function (event) {
      var choice = event.target.closest("button[data-choice]");
      if (choice) {
        var question = choice.closest("[data-question]");
        var index = Number(question.getAttribute("data-question"));
        predictions[index] = Number(choice.getAttribute("data-choice"));
        question.querySelectorAll("button[data-choice]").forEach(function (button) { button.setAttribute("aria-pressed", button === choice ? "true" : "false"); });
        return;
      }
      var preset = event.target.closest("button[data-preset]");
      if (preset) {
        var selected = PRESETS.filter(function (item) { return item.id === preset.getAttribute("data-preset"); })[0] || PRESETS[0];
        setState(selected);
        return;
      }
      var action = event.target.closest("button[data-action]");
      if (!action) return;
      if (action.getAttribute("data-action") === "reveal") {
        if (predictions.some(function (value) { return value === null; })) {
          feedback.className = "ps-feedback ps-warn";
          feedback.textContent = "请先完成三项预测；揭示后再拖动参数。";
          return;
        }
        var correct = [0, 1, 1];
        var score = predictions.reduce(function (sum, value, index) { return sum + (value === correct[index] ? 1 : 0); }, 0);
        feedback.className = "ps-feedback " + (score === 3 ? "ps-good" : "ps-warn");
        feedback.textContent = "预测 " + score + "/3。现在看角动量壁垒、最近接点和 Rutherford 角分布如何由同一套守恒量推出。";
        reveal.hidden = false;
        render();
      } else {
        predictions = [null, null, null];
        lab.querySelectorAll("button[data-choice]").forEach(function (button) { button.removeAttribute("aria-pressed"); });
        inputs.energy.value = "2";
        inputs.impact.value = "3";
        inputs.kappa.value = "2";
        reveal.hidden = true;
        feedback.className = "ps-feedback";
        feedback.textContent = "";
      }
    });
    Object.keys(inputs).forEach(function (key) {
      inputs[key].addEventListener("input", render);
      inputs[key].addEventListener("change", render);
    });
    render();
    if (api && typeof api.announce === "function") api.announce(root, "中心势散射实验已加载；预测答案仍隐藏。");
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(LAB_ID + " self-test failed: " + message);
    }
    var base = scattering({ energy: 2, impact: 3, kappa: 2 });
    var style = svgStyleSemantics();
    assert(style.ok, "SVG presentation styles cover rendered classes");
    assert(near(base.a, 0.5), "Coulomb length scale");
    assert(near(base.rMin, 0.5 + Math.sqrt(9.25)), "turning radius");
    assert(near(base.angleDegrees, 2 * Math.atan(1 / 6) * 180 / Math.PI), "Rutherford angle");
    assert(near(base.differentialCrossSection, 85.5625), "differential cross section");
    assert(near(base.effectiveAtTurn, base.energy, 1e-8), "turning-point energy");
    assert(near(impactParameterFromAngle(base.angle, 2, 2), 3), "inverse impact-parameter relation");
    var smallerB = scattering({ energy: 2, impact: 1, kappa: 2 });
    var faster = scattering({ energy: 8, impact: 3, kappa: 2 });
    assert(smallerB.angle > base.angle, "smaller impact parameter bends more");
    assert(faster.angle < base.angle, "higher energy bends less");
    var headOn = scattering({ energy: 2, impact: 0, kappa: 2 });
    assert(near(headOn.angle, Math.PI), "head-on reversal");
    assert(near(headOn.rMin, 1), "head-on closest approach");
    var baseGeometry = scatteringGeometry(base);
    assert(near(baseGeometry.turnScreen.x, baseGeometry.screenPoints[baseGeometry.turnIndex].x, 1e-8) && near(baseGeometry.turnScreen.y, baseGeometry.screenPoints[baseGeometry.turnIndex].y, 1e-8), "orbit and r_min share the coordinate transform");
    var headGeometry = scatteringGeometry(headOn);
    assert(headGeometry.radial, "zero impact parameter uses radial geometry");
    assert(headGeometry.turnIndex > 0 && headGeometry.turnIndex < headGeometry.screenPoints.length - 1, "radial path contains an interior turn");
    assert(headGeometry.screenPoints[0].x < headGeometry.turnScreen.x && headGeometry.screenPoints[headGeometry.screenPoints.length - 1].x < headGeometry.turnScreen.x, "radial approach reaches r_min from the incident side");
    assert(near(headGeometry.screenPoints[0].x, headGeometry.screenPoints[headGeometry.screenPoints.length - 1].x) && near(headGeometry.screenPoints[0].y, headGeometry.screenPoints[headGeometry.screenPoints.length - 1].y), "radial path retraces after turning");
    var smallerGeometry = scatteringGeometry(smallerB);
    assert(baseGeometry.angle.path !== smallerGeometry.angle.path, "angle arc responds to scattering angle");
    assert(PRESETS.length >= 4, "teaching presets");
    return { checks: checks, presets: PRESETS.length };
  }

  return {
    PRESETS: PRESETS,
    normalize: normalize,
    scattering: scattering,
    effectivePotential: effectivePotential,
    impactParameterFromAngle: impactParameterFromAngle,
    angleArcGeometry: angleArcGeometry,
    scatteringGeometry: scatteringGeometry,
    trajectoryPath: trajectoryPath,
    svgStyleSemantics: svgStyleSemantics,
    mount: mount,
    selfTest: selfTest
  };
});
