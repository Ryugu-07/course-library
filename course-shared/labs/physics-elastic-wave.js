(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("physics-elastic-wave", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      process.stdout.write("physics-elastic-wave self-test: PASS (" + report.checks + " checks)\n");
    } catch (error) {
      process.stderr.write("physics-elastic-wave self-test: FAIL\n" + error.stack + "\n");
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var LAB_ID = "physics-elastic-wave";
  var STYLE_ID = "physics-elastic-wave-styles";
  var INSTANCE = 0;
  var MATERIALS = {
    aluminum: { label: "铝", rho: 2700, bulk: 76, shear: 26 },
    steel: { label: "钢", rho: 7850, bulk: 160, shear: 79.3 },
    glass: { label: "玻璃", rho: 2500, bulk: 37, shear: 30 },
    polymer: { label: "聚合物", rho: 1180, bulk: 5.0, shear: 1.6 }
  };
  var PRESETS = [
    { id: "al-steel", label: "铝 → 钢：基线", material1: "aluminum", material2: "steel", mode: "longitudinal", frequency: 1 },
    { id: "steel-al", label: "钢 → 铝：反向界面", material1: "steel", material2: "aluminum", mode: "longitudinal", frequency: 1 },
    { id: "shear", label: "铝剪切横波", material1: "aluminum", material2: "steel", mode: "shear", frequency: 1 },
    { id: "soft", label: "铝 → 聚合物", material1: "aluminum", material2: "polymer", mode: "longitudinal", frequency: 0.5 }
  ];
  var PLOT_LENGTH = 0.012;
  var WAVE_SAMPLES = 240;

  var STYLE_TEXT = [
    ".ew-lab{--ew-blue:var(--cl-blue,#315f9d);--ew-gold:var(--cl-gold,#9b6a12);--ew-green:var(--cl-green,#39734d);--ew-red:var(--cl-red,#b64335);display:block;max-width:100%;min-width:0;color:var(--fg,#292722);line-height:1.55;overflow-wrap:anywhere}",
    ".ew-lab *,.ew-lab *::before,.ew-lab *::after{box-sizing:border-box}.ew-lab [hidden]{display:none!important}.ew-lab h3,.ew-lab h4{margin:0;letter-spacing:0}.ew-lab h3{font-size:1.16rem}.ew-lab p{margin:8px 0}.ew-lab .ew-note{color:var(--fg-soft,#6b6557);font-size:13px;line-height:1.7}.ew-lab button,.ew-lab input,.ew-lab select{font:inherit;letter-spacing:0}.ew-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#d7d0c2);border-radius:6px;background:var(--bg,#fff);color:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.ew-lab button:hover{border-color:var(--ew-blue)}.ew-lab button[aria-pressed=true],.ew-lab .ew-primary{border-color:var(--ew-blue);background:var(--ew-blue);color:var(--bg,#fff);font-weight:750}.ew-lab button:focus-visible,.ew-lab input:focus-visible,.ew-lab select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.ew-lab .ew-predict{margin:13px 0 0;padding:12px;border:1px solid var(--border,#d7d0c2);background:var(--block-bg,var(--bg,#fff))}.ew-lab .ew-predict legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}.ew-lab .ew-question{display:grid;gap:7px;margin:10px 0}.ew-lab .ew-question strong{font-size:13px}.ew-lab .ew-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.ew-lab .ew-choices button{font-size:12px}.ew-lab .ew-actions,.ew-lab .ew-presets{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px}.ew-lab .ew-actions>*{flex:1 1 170px}.ew-lab .ew-presets button{flex:1 1 145px;font-size:12px}.ew-lab .ew-feedback{min-height:2em;margin:8px 0;color:var(--fg-soft,#6b6557);font-size:13px;font-weight:700}.ew-lab .ew-good{color:var(--ew-green)}.ew-lab .ew-warn{color:var(--ew-red)}",
    ".ew-lab .ew-reveal{margin-top:18px;padding-top:16px;border-top:1px solid var(--border,#d7d0c2)}.ew-lab .ew-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px;align-items:end;margin:12px 0}.ew-lab .ew-control{display:grid;gap:5px;min-width:0}.ew-lab .ew-control label,.ew-lab .ew-control>span{color:var(--fg-soft,#6b6557);font-size:12.5px;font-weight:700;line-height:1.45}.ew-lab .ew-control output{color:var(--ew-blue);font-variant-numeric:tabular-nums}.ew-lab .ew-control input[type=range],.ew-lab .ew-control select{display:block;width:100%;min-width:0;min-height:44px;margin:0}.ew-lab .ew-control input[type=range]{accent-color:var(--ew-blue)}.ew-lab .ew-layout{display:grid;grid-template-columns:minmax(0,1fr);gap:12px}.ew-lab .ew-stage{min-width:0;padding:7px;border:1px solid var(--border,#d7d0c2);border-radius:7px;background:var(--bg,#fff);overflow:hidden}.ew-lab svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,#292722)}.ew-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.ew-lab .ew-metrics{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin:12px 0}.ew-lab .ew-metric{min-width:0;padding:9px;border-top:2px solid var(--border,#d7d0c2);background:var(--bg,#fff)}.ew-lab .ew-metric:nth-child(3n+1){border-color:var(--ew-blue)}.ew-lab .ew-metric:nth-child(3n+2){border-color:var(--ew-gold)}.ew-lab .ew-metric:nth-child(3n){border-color:var(--ew-green)}.ew-lab .ew-metric span{display:block;color:var(--fg-soft,#6b6557);font-size:11px;line-height:1.4}.ew-lab .ew-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.ew-lab .ew-table-wrap{max-width:100%;margin-top:12px;overflow-x:auto;-webkit-overflow-scrolling:touch}.ew-lab table{width:100%;min-width:720px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.ew-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft,#6b6557);font-size:12px}.ew-lab th,.ew-lab td{padding:7px 8px;border-bottom:1px solid var(--border,#d7d0c2);text-align:left;vertical-align:top}.ew-lab th{color:var(--fg-soft,#6b6557);font-size:11.5px}.ew-lab .ew-status{margin:12px 0 0;padding:10px 12px;border-left:3px solid var(--ew-green);background:var(--block-bg,var(--bg,#fff));font-size:13px;line-height:1.7}.ew-lab .ew-legend{display:flex;flex-wrap:wrap;gap:12px;margin-top:7px;color:var(--fg-soft,#6b6557);font-size:12px}.ew-lab .ew-legend span{display:inline-flex;align-items:center;gap:5px}.ew-lab .ew-swatch{display:inline-block;width:21px;border-top:3px solid var(--ew-blue)}.ew-lab .ew-swatch-red{border-color:var(--ew-red)}.ew-lab .ew-swatch-gold{border-color:var(--ew-gold)}",
    ".ew-lab svg{overflow:visible}.ew-lab .ew-material-one{fill:var(--ew-blue);fill-opacity:.08;stroke:var(--ew-blue);stroke-width:1}.ew-lab .ew-material-two{fill:var(--ew-gold);fill-opacity:.08;stroke:var(--ew-gold);stroke-width:1}.ew-lab .ew-interface{fill:none;stroke:var(--ew-red);stroke-width:2;stroke-dasharray:5 4}.ew-lab .ew-axis{fill:none;stroke:currentColor;stroke-width:1.2;stroke-opacity:.65}.ew-lab .ew-incident,.ew-lab .ew-transmitted{fill:none;stroke:var(--ew-blue);stroke-width:2.8;stroke-linecap:round;stroke-linejoin:round}.ew-lab .ew-reflected{fill:none;stroke:var(--ew-red);stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}.ew-lab .ew-arrow,.ew-lab .ew-arrow-reverse{fill:none;stroke:var(--ew-green);stroke-width:1.8;stroke-linecap:round}.ew-lab .ew-r-bar{fill:var(--ew-red);fill-opacity:.78;stroke:var(--ew-red);stroke-width:1}.ew-lab .ew-t-bar{fill:var(--ew-blue);fill-opacity:.78;stroke:var(--ew-blue);stroke-width:1}.ew-lab .ew-title{fill:currentColor;font-size:12px;font-weight:750}.ew-lab .ew-label{fill:var(--fg-soft,#6b6557);font-size:11px}.ew-lab .ew-callout{fill:currentColor;font-size:11px;font-weight:750}",
    "@media(max-width:860px){.ew-lab .ew-controls{grid-template-columns:repeat(2,minmax(0,1fr))}.ew-lab .ew-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:580px){.ew-lab .ew-controls,.ew-lab .ew-metrics,.ew-lab .ew-choices{grid-template-columns:minmax(0,1fr)}.ew-lab .ew-stage{padding:4px}}@media(prefers-reduced-motion:reduce){.ew-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value)));
  }

  function near(left, right, tolerance) {
    return Math.abs(left - right) <= (tolerance === undefined ? 1e-8 : tolerance) * Math.max(1, Math.abs(left), Math.abs(right));
  }

  function format(value, digits) {
    if (!finite(value)) return "—";
    var places = digits === undefined ? 3 : digits;
    if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4));
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function material(id) {
    return MATERIALS[id] || MATERIALS.aluminum;
  }

  function normalize(input) {
    var source = input || {};
    return {
      material1: MATERIALS[source.material1] ? source.material1 : "aluminum",
      material2: MATERIALS[source.material2] ? source.material2 : "steel",
      mode: source.mode === "shear" ? "shear" : "longitudinal",
      frequency: clamp(finite(Number(source.frequency)) ? Number(source.frequency) : 1, 0.05, 20),
      snapshotTime: finite(Number(source.snapshotTime)) ? Number(source.snapshotTime) : 0
    };
  }

  function waveSpeed(id, mode) {
    var item = material(id);
    var modulus = mode === "shear" ? item.shear : item.bulk + 4 * item.shear / 3;
    return Math.sqrt(modulus * 1e9 / item.rho);
  }

  function waveModel(input) {
    var state = normalize(input);
    var first = material(state.material1);
    var second = material(state.material2);
    var c1 = waveSpeed(state.material1, state.mode);
    var c2 = waveSpeed(state.material2, state.mode);
    var z1 = first.rho * c1;
    var z2 = second.rho * c2;
    var reflection = (z1 - z2) / (z1 + z2);
    var transmission = 2 * z1 / (z1 + z2);
    var reflectance = reflection * reflection;
    var transmittance = 4 * z1 * z2 / Math.pow(z1 + z2, 2);
    var frequencyHz = state.frequency * 1e6;
    var omega = 2 * Math.PI * frequencyHz;
    var k1 = omega / c1;
    var k2 = omega / c2;
    var boundary = interfaceDisplacements({ reflection: reflection, transmission: transmission, k1: k1, k2: k2, omega: omega, snapshotTime: state.snapshotTime }, state.snapshotTime);
    return {
      state: state,
      first: first,
      second: second,
      c1: c1,
      c2: c2,
      c1Longitudinal: waveSpeed(state.material1, "longitudinal"),
      c1Shear: waveSpeed(state.material1, "shear"),
      z1: z1,
      z2: z2,
      wavelength1: c1 / frequencyHz,
      wavelength2: c2 / frequencyHz,
      frequencyHz: frequencyHz,
      omega: omega,
      k1: k1,
      k2: k2,
      snapshotTime: state.snapshotTime,
      reflection: reflection,
      transmission: transmission,
      reflectance: reflectance,
      transmittance: transmittance,
      energyResidual: reflectance + transmittance - 1,
      interface: boundary,
      displacementBoundaryResidual: boundary.residual
    };
  }

  function appendStyle(doc) {
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }

  function line(x1, y1, x2, y2, className) {
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" class="' + className + '"></line>';
  }

  function text(x, y, value, className, anchor) {
    return '<text x="' + x + '" y="' + y + '"' + (className ? ' class="' + className + '"' : "") + (anchor ? ' text-anchor="' + anchor + '"' : "") + '>' + String(value) + "</text>";
  }

  function waveDisplacement(amplitude, wavenumber, direction, x, omega, time) {
    return amplitude * Math.cos(wavenumber * x - direction * omega * time);
  }

  function interfaceDisplacements(data, time) {
    var snapshotTime = finite(Number(time)) ? Number(time) : (finite(Number(data.snapshotTime)) ? Number(data.snapshotTime) : 0);
    var incident = waveDisplacement(1, data.k1, 1, 0, data.omega, snapshotTime);
    var reflected = waveDisplacement(data.reflection, data.k1, -1, 0, data.omega, snapshotTime);
    var transmitted = waveDisplacement(data.transmission, data.k2, 1, 0, data.omega, snapshotTime);
    var total = incident + reflected;
    return {
      time: snapshotTime,
      incident: incident,
      reflected: reflected,
      total: total,
      transmitted: transmitted,
      residual: total - transmitted
    };
  }

  function wavePath(start, end, baseline, amplitude, wavenumber, omega, time, physicalStart, physicalEnd, direction) {
    var points = [];
    for (var i = 0; i <= WAVE_SAMPLES; i += 1) {
      var fraction = i / WAVE_SAMPLES;
      var x = start + (end - start) * fraction;
      var physicalX = physicalStart + (physicalEnd - physicalStart) * fraction;
      var y = baseline - waveDisplacement(amplitude, wavenumber, direction, physicalX, omega, time);
      points.push((i ? "L " : "M ") + x.toFixed(2) + " " + y.toFixed(2));
    }
    return points.join(" ");
  }

  function waveGeometry(data) {
    var interfaceX = 368;
    var baseline = 104;
    var incident = wavePath(34, interfaceX, baseline, 25, data.k1, data.omega, data.snapshotTime, -PLOT_LENGTH, 0, 1);
    var reflected = wavePath(34, interfaceX, baseline, 25 * data.reflection, data.k1, data.omega, data.snapshotTime, -PLOT_LENGTH, 0, -1);
    var transmitted = wavePath(interfaceX, 724, baseline, 25 * data.transmission, data.k2, data.omega, data.snapshotTime, 0, PLOT_LENGTH, 1);
    return {
      interfaceX: interfaceX,
      baseline: baseline,
      physicalLength: PLOT_LENGTH,
      cycles1: PLOT_LENGTH / data.wavelength1,
      cycles2: PLOT_LENGTH / data.wavelength2,
      incident: incident,
      reflected: reflected,
      transmitted: transmitted,
      boundary: interfaceDisplacements(data, data.snapshotTime)
    };
  }

  function dashboardSvg(data, uid) {
    var geometry = waveGeometry(data);
    var baseline = geometry.baseline;
    var interfaceX = geometry.interfaceX;
    var barBase = 253;
    var barScale = 125;
    var rHeight = data.reflectance * barScale;
    var tHeight = data.transmittance * barScale;
    return [
      '<svg viewBox="0 0 760 300" role="img" aria-labelledby="' + uid + '-title ' + uid + '-desc">',
      '<title id="' + uid + '-title">弹性波在材料界面的反射与透射</title>',
      '<desc id="' + uid + '-desc">左侧按物理相位 kx 加减 ωt 显示入射、反射和透射位移波；右侧用能量比例柱显示 R 加 T 等于 1。三条波在同一快照时间满足界面位移连续。</desc>',
      '<rect class="ew-material-one" x="15" y="31" width="353" height="146" rx="4"></rect>',
      '<rect class="ew-material-two" x="368" y="31" width="377" height="146" rx="4"></rect>',
      line(368, 24, 368, 184, "ew-interface"),
      line(25, baseline, 735, baseline, "ew-axis"),
      '<path class="ew-incident" d="' + geometry.incident + '"></path>',
      '<path class="ew-reflected" d="' + geometry.reflected + '"></path>',
      '<path class="ew-transmitted" d="' + geometry.transmitted + '"></path>',
      '<line class="ew-arrow" x1="75" y1="48" x2="127" y2="48"></line>',
      '<line class="ew-arrow ew-arrow-reverse" x1="215" y1="154" x2="160" y2="154"></line>',
      '<line class="ew-arrow" x1="452" y1="48" x2="507" y2="48"></line>',
      text(102, 24, "介质 1：" + data.first.label + "，Z₁=" + format(data.z1 / 1e6, 2) + " MRayl", "ew-title", "middle"),
      text(557, 24, "介质 2：" + data.second.label + "，Z₂=" + format(data.z2 / 1e6, 2) + " MRayl", "ew-title", "middle"),
      text(117, 199, "入射 u_i", "ew-label", "middle"),
      text(212, 199, "反射 u_r", "ew-label", "middle"),
      text(526, 199, "透射 u_t", "ew-label", "middle"),
      text(368, 218, "x=0：u_i+u_r=u_t（同一快照 t=0）", "ew-label", "middle"),
      text(368, 237, "k=2π/λ，λ=c/f；拖动 f 会改变空间周期", "ew-label", "middle"),
      line(437, barBase, 715, barBase, "ew-axis"),
      '<rect class="ew-r-bar" x="492" y="' + (barBase - rHeight).toFixed(2) + '" width="62" height="' + rHeight.toFixed(2) + '"></rect>',
      '<rect class="ew-t-bar" x="605" y="' + (barBase - tHeight).toFixed(2) + '" width="62" height="' + tHeight.toFixed(2) + '"></rect>',
      text(523, barBase + 18, "R=|r|²", "ew-label", "middle"),
      text(636, barBase + 18, "T", "ew-label", "middle"),
      text(523, barBase - rHeight - 8, format(data.reflectance, 3), "ew-callout", "middle"),
      text(636, barBase - tHeight - 8, format(data.transmittance, 3), "ew-callout", "middle"),
      text(575, 226, "能量比例：R+T=1", "ew-title", "middle"),
      '</svg>'
    ].join("");
  }

  function metric(doc, label, value) {
    var box = doc.createElement("div");
    box.className = "ew-metric";
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
      ".ew-lab svg", ".ew-lab svg text", ".ew-material-one", ".ew-material-two", ".ew-interface",
      ".ew-axis", ".ew-incident", ".ew-reflected", ".ew-transmitted", ".ew-arrow", ".ew-r-bar",
      ".ew-t-bar", ".ew-title", ".ew-label", ".ew-callout", ".ew-legend", ".ew-swatch", ".ew-swatch-red", ".ew-swatch-gold"
    ];
    var missing = selectors.filter(function (selector) { return css.indexOf(selector) < 0; });
    return { ok: missing.length === 0, missing: missing };
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument || root.getAttribute("data-ew-mounted") === "true") return;
    var doc = root.ownerDocument;
    appendStyle(doc);
    var uid = LAB_ID + "-" + (++INSTANCE);
    root.setAttribute("data-ew-mounted", "true");
    root.innerHTML = [
      '<div class="ew-lab">',
      '<h3>弹性波界面：先猜反射，再让阻抗记账</h3>',
      '<p class="ew-note">采用各向同性、线性、无耗散介质；界面是法向入射的标量纵波或 SH 剪切波模型。颜色对应位移振幅，柱高对应能量比例。</p>',
      '<fieldset class="ew-predict"><legend>三项预测</legend>',
      '<div class="ew-question" data-question="0"><strong>1. 同一材料、同一模量下，密度变大，波速怎样？</strong><div class="ew-choices"><button type="button" data-choice="0">变慢</button><button type="button" data-choice="1">变快</button><button type="button" data-choice="2">不变</button></div></div>',
      '<div class="ew-question" data-question="1"><strong>2. 若波从低阻抗进入高阻抗材料，位移反射系数 r 的符号通常怎样？</strong><div class="ew-choices"><button type="button" data-choice="0">为负，反相</button><button type="button" data-choice="1">为正，同相</button><button type="button" data-choice="2">一定为零</button></div></div>',
      '<div class="ew-question" data-question="2"><strong>3. 界面无耗散时，反射和透射的哪一项必须等于 1？</strong><div class="ew-choices"><button type="button" data-choice="0">振幅 r+t</button><button type="button" data-choice="1">能量 R+T</button><button type="button" data-choice="2">波速 c₁+c₂</button></div></div>',
      '</fieldset>',
      '<div class="ew-actions"><button class="ew-primary" type="button" data-action="reveal">提交预测并揭示</button><button type="button" data-action="reset">重置</button></div>',
      '<p class="ew-feedback" role="status" aria-live="polite"></p>',
      '<div class="ew-reveal" hidden>',
      '<div class="ew-presets"></div>',
      '<div class="ew-controls">',
      '<label class="ew-control"><span>介质 1</span><select data-input="material1" aria-label="入射侧材料"><option value="aluminum">铝</option><option value="steel">钢</option><option value="glass">玻璃</option><option value="polymer">聚合物</option></select></label>',
      '<label class="ew-control"><span>介质 2</span><select data-input="material2" aria-label="透射侧材料"><option value="aluminum">铝</option><option value="steel">钢</option><option value="glass">玻璃</option><option value="polymer">聚合物</option></select></label>',
      '<label class="ew-control"><span>模式</span><select data-input="mode" aria-label="弹性波模式"><option value="longitudinal">纵波 P</option><option value="shear">剪切横波 SH</option></select></label>',
      '<label class="ew-control">f：<output data-output="frequency"></output><input data-input="frequency" type="range" min="0.05" max="20" step="0.05" value="1" aria-label="频率，MHz"></label>',
      '</div>',
      '<div class="ew-layout"><div class="ew-stage" data-stage></div></div>',
      '<div class="ew-metrics" data-metrics></div>',
      '<div class="ew-table-wrap"><table><caption>波速、阻抗与界面系数</caption><thead><tr><th>量</th><th>当前值</th><th>定义/检查</th></tr></thead><tbody data-ledger></tbody></table></div>',
      '<p class="ew-status" data-status role="status" aria-live="polite"></p>',
      '<div class="ew-legend"><span><i class="ew-swatch"></i>入射/透射位移</span><span><i class="ew-swatch ew-swatch-red"></i>反射位移</span><span><i class="ew-swatch ew-swatch-gold"></i>能量比例</span></div>',
      '</div></div>'
    ].join("");
    var lab = root.firstElementChild;
    var reveal = lab.querySelector(".ew-reveal");
    var feedback = lab.querySelector(".ew-feedback");
    var inputs = {
      material1: lab.querySelector('[data-input="material1"]'),
      material2: lab.querySelector('[data-input="material2"]'),
      mode: lab.querySelector('[data-input="mode"]'),
      frequency: lab.querySelector('[data-input="frequency"]')
    };
    var predictions = [null, null, null];
    var presetHost = lab.querySelector(".ew-presets");
    PRESETS.forEach(function (preset) {
      var button = doc.createElement("button");
      button.type = "button";
      button.setAttribute("data-preset", preset.id);
      button.textContent = preset.label;
      presetHost.appendChild(button);
    });

    function setState(state) {
      inputs.material1.value = state.material1;
      inputs.material2.value = state.material2;
      inputs.mode.value = state.mode;
      inputs.frequency.value = String(state.frequency);
      render();
    }

    function render() {
      var data = waveModel({ material1: inputs.material1.value, material2: inputs.material2.value, mode: inputs.mode.value, frequency: Number(inputs.frequency.value) });
      lab.querySelector('[data-output="frequency"]').textContent = format(data.state.frequency, 2) + " MHz";
      lab.querySelector("[data-stage]").innerHTML = dashboardSvg(data, uid);
      lab.querySelector("[data-metrics]").replaceChildren(
        metric(doc, "c₁", format(data.c1 / 1000, 3) + " km/s"),
        metric(doc, "c₂", format(data.c2 / 1000, 3) + " km/s"),
        metric(doc, "λ₁", format(data.wavelength1 * 1000, 3) + " mm"),
        metric(doc, "λ₂", format(data.wavelength2 * 1000, 3) + " mm"),
        metric(doc, "r_u", format(data.reflection, 3)),
        metric(doc, "R=|r|²", format(data.reflectance, 3)),
        metric(doc, "T", format(data.transmittance, 3))
      );
      lab.querySelector("[data-ledger]").innerHTML = [
        ["纵波速度公式", "c_L=√((K+4G/3)/ρ)", format(data.c1Longitudinal / 1000, 3) + " km/s（介质 1）"],
        ["剪切速度公式", "c_T=√(G/ρ)", format(data.c1Shear / 1000, 3) + " km/s（介质 1）"],
        ["波阻抗", "Z=ρc", format(data.z1 / 1e6, 3) + " / " + format(data.z2 / 1e6, 3) + " MRayl"],
        ["位移振幅", "r=(Z₁−Z₂)/(Z₁+Z₂)", format(data.reflection, 4) + "；t=" + format(data.transmission, 4)],
        ["位移连续", "u_i(0)+u_r(0)=u_t(0)", format(data.displacementBoundaryResidual, 6) + " 残差"],
        ["能量守恒", "R+T", format(data.reflectance + data.transmittance, 6) + "；残差 " + format(data.energyResidual, 2)]
      ].map(function (row) { return "<tr><th scope=\"row\">" + row[0] + "</th><td>" + row[1] + "</td><td>" + row[2] + "</td></tr>"; }).join("");
      lab.querySelector("[data-status]").textContent = data.reflection < 0
        ? "Z₂>Z₁：位移反射波反相，但 R 仍取振幅平方；不能把负号直接当作负能量。"
        : data.reflection > 0
          ? "Z₂<Z₁：位移反射波同相；界面仍以位移/应力连续和 R+T=1 约束。"
          : "阻抗匹配：没有反射位移，能量全部进入第二介质。";
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
          feedback.className = "ew-feedback ew-warn";
          feedback.textContent = "请先完成三项预测；揭示后再比较材料和模式。";
          return;
        }
        var correct = [0, 0, 1];
        var score = predictions.reduce(function (sum, value, index) { return sum + (value === correct[index] ? 1 : 0); }, 0);
        feedback.className = "ew-feedback " + (score === 3 ? "ew-good" : "ew-warn");
        feedback.textContent = "预测 " + score + "/3。现在把速度、阻抗、振幅相位和能量比例分开读。";
        reveal.hidden = false;
        render();
      } else {
        predictions = [null, null, null];
        lab.querySelectorAll("button[data-choice]").forEach(function (button) { button.removeAttribute("aria-pressed"); });
        inputs.material1.value = "aluminum";
        inputs.material2.value = "steel";
        inputs.mode.value = "longitudinal";
        inputs.frequency.value = "1";
        reveal.hidden = true;
        feedback.className = "ew-feedback";
        feedback.textContent = "";
      }
    });
    Object.keys(inputs).forEach(function (key) { inputs[key].addEventListener("input", render); inputs[key].addEventListener("change", render); });
    render();
    if (api && typeof api.announce === "function") api.announce(root, "弹性波界面实验已加载；预测答案仍隐藏。");
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(LAB_ID + " self-test failed: " + message);
    }
    var base = waveModel({ material1: "aluminum", material2: "steel", mode: "longitudinal", frequency: 1 });
    var style = svgStyleSemantics();
    assert(style.ok, "SVG presentation styles cover rendered classes");
    assert(base.c1 > 6300 && base.c1 < 6500, "aluminum longitudinal speed");
    assert(base.c1 > base.c1Shear, "longitudinal speed exceeds shear speed");
    assert(base.wavelength1 > 0.006 && base.wavelength1 < 0.007, "one MHz wavelength");
    assert(base.reflection < 0, "higher impedance reflects displacement with inversion");
    assert(near(base.reflectance + base.transmittance, 1, 1e-10), "energy partition");
    var reverse = waveModel({ material1: "steel", material2: "aluminum", mode: "longitudinal", frequency: 1 });
    assert(reverse.reflection > 0, "reverse interface changes reflection sign");
    var shear = waveModel({ material1: "aluminum", material2: "steel", mode: "shear", frequency: 1 });
    assert(shear.c1 < base.c1, "shear mode is slower");
    var matched = waveModel({ material1: "aluminum", material2: "aluminum", mode: "longitudinal", frequency: 2 });
    assert(near(matched.reflection, 0), "matched impedance has no reflection");
    var commonSnapshot = interfaceDisplacements(base, 0.23 / base.frequencyHz);
    assert(near(commonSnapshot.total, commonSnapshot.transmitted, 1e-12), "interface displacement continuity at a common snapshot");
    assert(near(base.displacementBoundaryResidual, 0, 1e-12), "model stores zero displacement boundary residual");
    var doubledFrequency = waveModel({ material1: "aluminum", material2: "steel", mode: "longitudinal", frequency: 2 });
    assert(near(doubledFrequency.wavelength1, base.wavelength1 / 2, 1e-12) && near(doubledFrequency.wavelength2, base.wavelength2 / 2, 1e-12), "wavelength scales inversely with frequency");
    var baseGeometry = waveGeometry(base);
    var doubledGeometry = waveGeometry(doubledFrequency);
    assert(doubledGeometry.cycles1 > baseGeometry.cycles1 && doubledGeometry.incident !== baseGeometry.incident, "fixed physical plot makes frequency change the visible wavelength");
    assert(PRESETS.length >= 4, "teaching presets");
    return { checks: checks, presets: PRESETS.length };
  }

  return {
    MATERIALS: MATERIALS,
    PRESETS: PRESETS,
    normalize: normalize,
    waveSpeed: waveSpeed,
    waveModel: waveModel,
    waveDisplacement: waveDisplacement,
    interfaceDisplacements: interfaceDisplacements,
    waveGeometry: waveGeometry,
    wavePath: wavePath,
    svgStyleSemantics: svgStyleSemantics,
    mount: mount,
    selfTest: selfTest
  };
});
