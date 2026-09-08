(function (root, factory) {
  "use strict";

  var exported = factory();
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("atomic-spectra", exported.mount);
  }
  if (typeof module === "object" && typeof require === "function" && require.main === module && process.argv.indexOf("--self-test") !== -1) {
    try {
      var report = exported.selfTest();
      console.log("atomic-spectra self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("atomic-spectra self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var STYLE_ID = "atomic-spectra-styles";
  var INSTANCE = 0;
  var EPS = 1e-12;
  var R_INF = 10973731.568160;
  var HC_EV_NM = 1239.8419843320026;
  var ALPHA = 1 / 137.035999084;
  var ELECTRON_REST_EV = 510998.950;
  var BOHR_MAGNETON_EV_T = 5.7883818060e-5;
  var NUCLEUS_MASS_ELECTRON = { 1: 1836.15267343, 2: 3670.48296785 };
  var TRANSITIONS = [
    { id: "lyman-alpha", label: "Lyman α：n=2 → 1", nHigh: 2, nLow: 1 },
    { id: "balmer-alpha", label: "Balmer Hα：n=3 → 2", nHigh: 3, nLow: 2 },
    { id: "balmer-beta", label: "Balmer Hβ：n=4 → 2", nHigh: 4, nLow: 2 },
    { id: "paschen-alpha", label: "Paschen α：n=4 → 3", nHigh: 4, nLow: 3 }
  ];
  var PRESETS = [
    { id: "hydrogen", label: "H：Balmer Hα", transition: "balmer-alpha", isotope: 1, z: 1, field: 0, channel: "allowed" },
    { id: "deuterium", label: "D：同一条 Hα", transition: "balmer-alpha", isotope: 2, z: 1, field: 0, channel: "allowed" },
    { id: "fine", label: "弱场：看修正尺度", transition: "balmer-alpha", isotope: 1, z: 1, field: 0.01, channel: "allowed" },
    { id: "forbidden", label: "禁戒通道：Δℓ=0", transition: "balmer-alpha", isotope: 1, z: 1, field: 0, channel: "same-l" }
  ];
  var CHANNELS = {
    allowed: { label: "p→s：Δℓ=−1, Δm=0", lHigh: 1, lLow: 0, mHigh: 0, mLow: 0 },
    "same-l": { label: "p→p：Δℓ=0", lHigh: 1, lLow: 1, mHigh: 0, mLow: 0 },
    "delta-m": { label: "d(m=2)→p(m=0)", lHigh: 2, lLow: 1, mHigh: 2, mLow: 0 }
  };

  var STYLE_TEXT = [
    ".as-lab{--as-blue:#315f9d;--as-green:var(--cl-green,#39734d);--as-gold:var(--cl-gold,#9b6a12);--as-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg,#292722);line-height:1.55;overflow-wrap:anywhere}",
    ".as-lab *,.as-lab *::before,.as-lab *::after{box-sizing:border-box}.as-lab [hidden]{display:none!important}.as-lab h3{margin:0;letter-spacing:0;color:var(--fg,#292722);font-size:1.15rem}.as-lab p{margin:8px 0}.as-lab .as-note{color:var(--fg-soft,var(--muted,#6b6557));font-size:13px;line-height:1.65}",
    ".as-lab button,.as-lab input,.as-lab select{font:inherit}.as-lab button{min-width:0;min-height:44px;padding:8px 10px;border:1px solid var(--border,#d7d0c2);border-radius:6px;background:var(--bg,#fff);color:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.as-lab button:hover{border-color:var(--as-blue)}.as-lab button:focus-visible,.as-lab input:focus-visible,.as-lab select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.as-lab button[aria-pressed=true],.as-lab .as-primary{border-color:var(--as-blue);background:var(--as-blue);color:var(--bg,#fff);font-weight:750}.as-lab .as-presets{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:11px 0}.as-lab .as-presets button{font-size:12px}.as-lab .as-predict{margin-top:13px;padding:12px;border:1px solid var(--border,#d7d0c2);background:var(--block-bg,var(--bg,#fff))}.as-lab .as-predict legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}.as-lab .as-question{margin:9px 0}.as-lab .as-question strong{display:block;font-size:13px}.as-lab .as-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:7px}.as-lab .as-choices button{font-size:12px}.as-lab .as-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px}.as-lab .as-actions>*{flex:1 1 170px}.as-lab .as-feedback{min-height:2em;margin:8px 0;color:var(--fg-soft,var(--muted,#6b6557));font-size:13px;font-weight:700}.as-lab .as-pass{color:var(--as-green)}.as-lab .as-warn{color:var(--as-red)}",
    ".as-lab .as-reveal{margin-top:18px;padding-top:16px;border-top:1px solid var(--border,#d7d0c2)}.as-lab .as-controls{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin:11px 0;align-items:end}.as-lab .as-control{display:grid;gap:5px;min-width:0}.as-lab .as-control label{color:var(--fg-soft,var(--muted,#6b6557));font-size:12.5px;font-weight:700}.as-lab .as-control output{color:var(--as-blue);font-variant-numeric:tabular-nums}.as-lab .as-control select,.as-lab input[type=range]{width:100%;min-width:0;min-height:44px;margin:0}.as-lab input[type=range]{accent-color:var(--as-blue)}",
    ".as-lab .as-stage{min-width:0;padding:8px;border:1px solid var(--border,#d7d0c2);border-radius:6px;background:var(--bg,#fff);overflow-x:auto}.as-lab svg{display:block;width:100%;min-width:760px;height:auto;color:var(--fg,#292722)}.as-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.as-lab .as-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.58}.as-lab .as-level{stroke:var(--as-blue);stroke-width:2.2}.as-lab .as-arrow{stroke:var(--as-gold);stroke-width:2.5}.as-lab .as-correction{stroke:var(--as-red);stroke-width:2;stroke-dasharray:5 4}.as-lab .as-title{font-size:13px;font-weight:750}.as-lab .as-small{font-size:12px;fill:var(--fg-soft,var(--muted,#6b6557))}",
    ".as-lab .as-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:12px}.as-lab table{width:100%;min-width:820px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.as-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft,var(--muted,#6b6557));font-size:12px}.as-lab th,.as-lab td{padding:7px 8px;border-bottom:1px solid var(--border,#d7d0c2);text-align:left;vertical-align:top}.as-lab th{color:var(--fg-soft,var(--muted,#6b6557));font-size:11.5px}.as-lab .as-status{margin-top:11px;padding:9px 11px;border-left:3px solid var(--as-green);background:var(--block-bg,var(--bg,#fff));font-size:13px;line-height:1.65}",
    "@media(max-width:1000px){.as-lab .as-controls{grid-template-columns:repeat(3,minmax(0,1fr))}.as-lab .as-presets{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:620px){.as-lab .as-controls,.as-lab .as-presets,.as-lab .as-choices{grid-template-columns:minmax(0,1fr)}.as-lab .as-stage{padding:4px}}@media(prefers-reduced-motion:reduce){.as-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
    ,"[data-theme=dark] .as-lab{--as-blue:#85b9ef;--as-gold:#e6be68;--as-red:#ed9f94;--as-green:#83c69c}.as-stage:focus-visible,.as-table-wrap:focus-visible{outline:3px solid var(--as-blue);outline-offset:2px}"
  ].join("\n");

  function fail(message) {
    throw new Error("atomic-spectra: " + message);
  }

  function finite(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function near(left, right, tolerance) {
    return Math.abs(left - right) <= (tolerance === undefined ? 1e-8 : tolerance) * Math.max(1, Math.abs(left), Math.abs(right));
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value)));
  }

  function transitionById(id) {
    for (var index = 0; index < TRANSITIONS.length; index += 1) if (TRANSITIONS[index].id === id) return TRANSITIONS[index];
    return TRANSITIONS[1];
  }

  function reducedMassRatio(massNumber) {
    var number = Number(massNumber);
    if (!Number.isInteger(number) || number < 1) fail("mass number must be a positive integer");
    var nucleusMass = NUCLEUS_MASS_ELECTRON[number] || number * NUCLEUS_MASS_ELECTRON[1];
    return nucleusMass / (nucleusMass + 1);
  }

  function rydbergWavenumber(massNumber) {
    return R_INF * reducedMassRatio(massNumber);
  }

  function lineWavenumber(nHigh, nLow, zValue, massNumber) {
    var high = Number(nHigh);
    var low = Number(nLow);
    var z = Number(zValue);
    if (!Number.isInteger(high) || !Number.isInteger(low) || high <= low || low < 1 || !Number.isInteger(z) || z <= 0) fail("invalid hydrogenic transition");
    return rydbergWavenumber(massNumber) * z * z * (1 / (low * low) - 1 / (high * high));
  }

  function lineWavelength(nHigh, nLow, zValue, massNumber) {
    return 1e9 / lineWavenumber(nHigh, nLow, zValue, massNumber);
  }

  function lineEnergy(nHigh, nLow, zValue, massNumber) {
    return HC_EV_NM / lineWavelength(nHigh, nLow, zValue, massNumber);
  }

  function fineStructureScale(zValue, nValue, massNumber) {
    var z = Number(zValue);
    var n = Number(nValue);
    if (!Number.isInteger(z) || z <= 0 || !Number.isInteger(n) || n < 1) fail("invalid fine-structure scale inputs");
    return 0.5 * ELECTRON_REST_EV * reducedMassRatio(massNumber) * Math.pow(z * ALPHA, 4) / Math.pow(n, 3);
  }

  function zeemanShift(fieldTesla, gJ, mJ) {
    var field = Number(fieldTesla);
    var g = Number(gJ);
    var magnetic = Number(mJ);
    if (![field, g, magnetic].every(finite)) fail("Zeeman inputs must be finite");
    return BOHR_MAGNETON_EV_T * g * magnetic * field;
  }

  function transitionAllowed(lHigh, mHigh, lLow, mLow) {
    var highL = Number(lHigh);
    var highM = Number(mHigh);
    var lowL = Number(lLow);
    var lowM = Number(mLow);
    if (![highL, highM, lowL, lowM].every(Number.isInteger) || highL < 0 || lowL < 0 || Math.abs(highM) > highL || Math.abs(lowM) > lowL) fail("invalid orbital quantum numbers");
    var deltaL = highL - lowL;
    var deltaM = highM - lowM;
    return Math.abs(deltaL) === 1 && Math.abs(deltaM) <= 1;
  }

  function analyze(input) {
    var source = input || {};
    var transition = transitionById(source.transition || "balmer-alpha");
    var massNumber = Number(source.massNumber === undefined ? 1 : source.massNumber);
    var z = Number(source.z === undefined ? 1 : source.z);
    var field = Math.max(0, Number(source.field === undefined ? 0 : source.field));
    if (!Number.isInteger(massNumber) || massNumber < 1 || !Number.isInteger(z) || z < 1 || !finite(field)) fail("invalid atomic model inputs");
    var channel = CHANNELS[source.channel] || CHANNELS.allowed;
    var wavelength = lineWavelength(transition.nHigh, transition.nLow, z, massNumber);
    var energy = lineEnergy(transition.nHigh, transition.nLow, z, massNumber);
    var fine = fineStructureScale(z, transition.nHigh, massNumber);
    var zeeman = zeemanShift(field, 2, 0.5);
    var stateLegal = channel.lHigh < transition.nHigh && channel.lLow < transition.nLow;
    var energyUnit = HC_EV_NM * R_INF / 1e9 * reducedMassRatio(massNumber) * z * z;
    return {
      stateLegal: stateLegal,
      upperEnergy: -energyUnit / (transition.nHigh * transition.nHigh),
      lowerEnergy: -energyUnit / (transition.nLow * transition.nLow),
      fieldRatio: Math.abs(zeeman) / fine,
      transition: transition,
      massNumber: massNumber,
      z: z,
      field: field,
      channel: channel,
      wavelength: wavelength,
      energy: energy,
      wavenumber: lineWavenumber(transition.nHigh, transition.nLow, z, massNumber),
      massRatio: reducedMassRatio(massNumber),
      fineScale: fine,
      zeemanShift: zeeman,
      allowed: stateLegal && transitionAllowed(channel.lHigh, channel.mHigh, channel.lLow, channel.mLow)
    };
  }

  function fixed(value, digits) {
    if (value === null || value === undefined) return "—";
    if (!finite(Number(value))) return "∞";
    return Number(value).toFixed(digits === undefined ? 4 : digits);
  }

  function escapeHtml(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function svgText(x, y, text, className, anchor) {
    return ['<text x="', x, '" y="', y, '"', className ? ' class="' + className + '"' : "", anchor ? ' text-anchor="' + anchor + '"' : "", '>', escapeHtml(text), '</text>'].join("");
  }

  function buildSvg(data, prefix) {
    var parts = ['<defs><marker id="' + prefix + '-arrow-head" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z" fill="var(--as-gold)"></path></marker></defs>'];
    function line(x1,y1,x2,y2,cls,extra){parts.push('<line class="'+(cls||'as-axis')+'" x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" '+(extra||'')+'></line>');}
    function text(x,y,t,anchor){parts.push(svgText(x,y,t,'as-small',anchor));}
    var top=65,bottom=305,left=78,right=340,low=data.lowerEnergy*1.14;
    var sy=function(E){return top+E/low*(bottom-top);};
    text(left,24,'Coulomb 能级 / eV（各次自动定轴）');
    [0,data.lowerEnergy/2,data.lowerEnergy].forEach(function(E){line(left,sy(E),right,sy(E));text(left-8,sy(E)+4,fixed(E,3),'end');});
    [data.upperEnergy,data.lowerEnergy].forEach(function(E,i){line(110,sy(E),310,sy(E),'as-level');text(318,sy(E)+4,'n='+(i?data.transition.nLow:data.transition.nHigh));});
    if(data.allowed)line(220,sy(data.upperEnergy)+4,220,sy(data.lowerEnergy)-4,'as-arrow','marker-end="url(#'+prefix+'-arrow-head)"');
    text(left,343,'真空 λ='+fixed(data.wavelength,3)+' nm');
    text(left,365,'ΔE='+fixed(data.energy,6)+' eV');
    text(left,389,data.stateLegal?(data.allowed?'金箭头：满足 E1 角向规则':'此态组合 E1 禁戒：不画发射箭头'):'此态组合不存在：仅保留 n 层能量参考');
    var values=[data.fineScale*1e6,Math.abs(data.zeemanShift)*1e6],max=Math.max.apply(null,values)*1.2;
    var cx=458,cr=724,cy=function(v){return bottom-v/max*(bottom-top);};
    text(cx,24,'修正参考 / μeV（独立线性轴）');
    [0,max/2,max].forEach(function(v){line(cx,cy(v),cr,cy(v));text(cx-8,cy(v)+4,fixed(v,2),'end');});
    values.forEach(function(v,i){var x=512+i*148;parts.push('<rect x="'+(x-25)+'" y="'+cy(v)+'" width="50" height="'+(bottom-cy(v))+'" fill="var(--as-red)" fill-opacity=".6"></rect>');text(x,cy(v)-9,fixed(v,3),'middle');text(x,328,i?'参考 Zeeman':'精细尺度','middle');});
    text(cx,353,'Zeeman 仅取 g=2、m=1/2 的单能级');
    text(cx,377,'两尺度比='+fixed(data.fieldRatio,3)+'；不代表谱线分裂');
    text(32,420,'量子数先检查 0≤ℓ<n；Δℓ、Δm 均按末态减初态。强场红条是线性外推。');
    return parts.join('');
  }

  function injectStyles(documentObject) {
    if (!documentObject || documentObject.getElementById(STYLE_ID)) return;
    var style = documentObject.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    documentObject.head.appendChild(style);
  }

  function mount(container) {
    if (!container || container.getAttribute("data-as-mounted") === "true") return;
    container.setAttribute("data-as-mounted", "true");
    injectStyles(container.ownerDocument);
    INSTANCE += 1;
    var prefix = "as-" + INSTANCE;
    var selected = [null, null, null];
    container.innerHTML = [
      '<div class="as-lab">',
      '<h3>氢样光谱：线、约化质量与修正尺度分开记账</h3>',
      '<p class="as-note">先预测谱线与选择定则，再揭示 Rydberg 模型、约化质量、精细结构数量级和弱场 Zeeman 线性项。红色修正不是完整原子计算。</p>',
      '<fieldset class="as-predict"><legend>三项预测</legend>',
      '<div class="as-question" data-question="0"><strong>1. 同一氢原子中，3→2 与 2→1 哪条线波长更长？</strong><div class="as-choices"><button type="button" data-choice="0">3→2 更长</button><button type="button" data-choice="1">2→1 更长</button><button type="button" data-choice="2">完全相同</button></div></div>',
      '<div class="as-question" data-question="1"><strong>2. 同一跃迁从 H 换成 D，约化质量增大，波长会怎样？</strong><div class="as-choices"><button type="button" data-choice="0">略变短</button><button type="button" data-choice="1">略变长</button><button type="button" data-choice="2">模型中完全不变</button></div></div>',
      '<div class="as-question" data-question="2"><strong>3. E1 跃迁若 Δℓ=0 或 |Δm|=2，是否仍是同一近似下的允许线？</strong><div class="as-choices"><button type="button" data-choice="0">是，能级差存在就行</button><button type="button" data-choice="1">否，选择定则筛掉它</button><button type="button" data-choice="2">只由 Zeeman 场决定</button></div></div>',
      '</fieldset>',
      '<div class="as-actions"><button class="as-primary" type="button" data-action="reveal">提交预测并揭示</button><button type="button" data-action="reset">重置</button></div>',
      '<p class="as-feedback" role="status" aria-live="polite"></p>',
      '<div class="as-reveal" hidden>',
      '<div class="as-presets">' + PRESETS.map(function (preset) { return '<button type="button" data-preset="' + preset.id + '">' + preset.label + '</button>'; }).join("") + '</div>',
      '<div class="as-controls">',
      '<div class="as-control"><label for="' + prefix + '-transition">跃迁</label><select id="' + prefix + '-transition" data-input="transition">' + TRANSITIONS.map(function (item) { return '<option value="' + item.id + '">' + item.label + '</option>'; }).join("") + '</select></div>',
      '<div class="as-control"><label for="' + prefix + '-isotope">核质量参照</label><select id="' + prefix + '-isotope" data-input="isotope"><option value="1">H 的质子质量</option><option value="2">D 的氘核质量</option></select></div>',
      '<div class="as-control"><label for="' + prefix + '-z">Z：<output data-output="z">1</output></label><input id="' + prefix + '-z" data-input="z" type="range" min="1" max="3" step="1" value="1"></div>',
      '<div class="as-control"><label for="' + prefix + '-field">B：<output data-output="field">0.00 T</output></label><input id="' + prefix + '-field" data-input="field" type="range" min="0" max="10" step="0.01" value="0"></div>',
      '<div class="as-control"><label for="' + prefix + '-channel">通道</label><select id="' + prefix + '-channel" data-input="channel"><option value="allowed">p→s：Δℓ=−1, Δm=0</option><option value="same-l">p→p：Δℓ=0</option><option value="delta-m">d(m=2)→p(m=0)</option></select></div>',
      '</div>',
      '<p class="as-note">核质量与 Z 独立可调；Z&gt;1 配 H/D 质量是控制变量的假想模型，不是真实 He/Li 核种。窄屏可聚焦图框或数据表横向滚动。</p><div class="as-stage" tabindex="0" role="region" aria-label="原子能级数值图，可横向滚动"><svg viewBox="0 0 760 440" role="img" aria-labelledby="' + prefix + '-title ' + prefix + '-desc"><title id="' + prefix + '-title">氢样能级与修正尺度图</title><desc id="' + prefix + '-desc">蓝色能级与金色跃迁箭头来自氢样 Coulomb 模型，左右图有独立数值轴；红色条分别显示精细尺度和参考单能级 Zeeman 线性位移。</desc><g data-svg></g></svg></div>',
      '<div class="as-table-wrap" tabindex="0" role="region" aria-label="原子光谱模型账本，可横向滚动"><table aria-label="原子光谱模型账本"><caption>模型公式、尺度估计和选择定则分栏记录</caption><thead><tr><th>量</th><th>当前值</th><th>层级</th><th>边界</th></tr></thead><tbody data-ledger></tbody></table></div>',
      '<p class="as-status" role="status" aria-live="polite" data-status></p></div>',
      '</div>'
    ].join("");
    var lab = container.querySelector(".as-lab");
    var reveal = lab.querySelector(".as-reveal");
    var feedback = lab.querySelector(".as-feedback");
    var transitionInput = lab.querySelector('[data-input="transition"]');
    var isotopeInput = lab.querySelector('[data-input="isotope"]');
    var zInput = lab.querySelector('[data-input="z"]');
    var fieldInput = lab.querySelector('[data-input="field"]');
    var channelInput = lab.querySelector('[data-input="channel"]');

    function applyPreset(id) {
      var preset = PRESETS.filter(function (item) { return item.id === id; })[0] || PRESETS[0];
      transitionInput.value = preset.transition;
      isotopeInput.value = String(preset.isotope);
      zInput.value = String(preset.z);
      fieldInput.value = String(preset.field);
      channelInput.value = preset.channel;
      render();
    }

    function render() {
      var data = analyze({ transition: transitionInput.value, massNumber: Number(isotopeInput.value), z: Number(zInput.value), field: Number(fieldInput.value), channel: channelInput.value });
      lab.querySelector('[data-output="z"]').textContent = String(data.z);
      lab.querySelector('[data-output="field"]').textContent = fixed(data.field, 2) + " T";
      lab.querySelector("[data-svg]").innerHTML = buildSvg(data, prefix);
      var rows = [
        ["Rydberg 波数", fixed(data.wavenumber, 2) + " m⁻¹", "氢样单电子 Coulomb 模型 + 约化质量", "不是多电子原子的完整谱线"],
        ["n 层能差对应真空波长", fixed(data.wavelength, 4) + " nm", "模型内由 ΔE=hc/λ 得到", "测量还含 Lamb、超精细、碰撞/仪器展宽等"],
        ["n 层能量差", fixed(data.energy, 6) + " eV", "Coulomb 的 n 层能量差", "若态非法或 E1 禁戒，不表示存在此 E1 发射线"],
        ["约化质量比 μ/mₑ", fixed(data.massRatio, 9), "非相对论二体相对坐标的约化质量", "核质量输入是近似常数"],
        ["精细结构尺度", fixed(data.fineScale * 1e6, 3) + " μeV", "(Zα)^4/n³ 的数量级估计", "不是精确 j 分裂、Lamb 或超精细计算"],
        ["参考单能级 Zeeman", fixed(data.zeemanShift * 1e6, 3) + " μeV", "g=2、m=1/2；未由当前轨道求 g", "谱线要取上下级位移之差；强场仅为外推"],
        ["量子态与 E1 规则", !data.stateLegal ? "态不存在（ℓ≥n）" : data.allowed ? "满足角向规则" : "E1 禁戒", "输入轨道：" + data.transition.nHigh + ["s","p","d"][data.channel.lHigh] + " → " + data.transition.nLow + ["s","p","d"][data.channel.lLow], "先验证合法态，再检查矩阵元；规则不等于强度"]
      ];
      lab.querySelector("[data-ledger]").innerHTML = rows.map(function (row) { return "<tr>" + row.map(function (cell) { return "<td>" + escapeHtml(cell) + "</td>"; }).join("") + "</tr>"; }).join("");
      var message = !data.stateLegal ? "当前配置含 ℓ≥n 的不存在态。图中只保留 n 层能量参考，不能把它称作一条禁戒谱线。" : data.allowed ? "当前通道满足 E1 角向规则，完整强度还需径向矩阵元和偏振。" : "当前合法态之间的 E1 通道禁戒；其他多极过程需另外计算。";
      message += " 参考 Zeeman / 精细尺度=" + fixed(data.fieldRatio,3) + "。";
      message += data.fieldRatio >= .1 ? "此比值已非很小，不能据线性外推认定实际弱场分裂；精确判据要用相关耦合能级间隔。" : "此参考比值较小，但不是全部实际能级的弱场保证。";
      if(data.z>1) message += " 当前 Z 与 H/D 参考质量组合是假想参数扫描。";
      lab.querySelector("[data-status]").textContent = message;
    }

    lab.addEventListener("click", function (event) {
      var choice = event.target.closest("button[data-choice]");
      if (choice) {
        var question = choice.closest("[data-question]");
        var index = Number(question.getAttribute("data-question"));
        selected[index] = Number(choice.getAttribute("data-choice"));
        reveal.hidden = true; feedback.textContent = "预测已更改，请重新提交。";
        question.querySelectorAll("button[data-choice]").forEach(function (button) { button.setAttribute("aria-pressed", button === choice ? "true" : "false"); });
        return;
      }
      var presetButton = event.target.closest("button[data-preset]");
      if (presetButton) { applyPreset(presetButton.getAttribute("data-preset")); return; }
      var action = event.target.closest("button[data-action]");
      if (!action) return;
      if (action.getAttribute("data-action") === "reveal") {
        if (selected.some(function (value) { return value === null; })) {
          feedback.className = "as-feedback as-warn";
          feedback.textContent = "请先完成三项预测，再打开光谱账本。";
          return;
        }
        var correct = [0, 0, 1];
        var score = selected.reduce(function (sum, value, index) { return sum + (value === correct[index] ? 1 : 0); }, 0);
        feedback.className = "as-feedback " + (score === 3 ? "as-pass" : "as-warn");
        feedback.textContent = "预测 " + score + "/3。现在把模型能级、修正尺度、测量边界和选择定则分开。";
        reveal.hidden = false;
        render();
      } else {
        selected = [null, null, null];
        lab.querySelectorAll("button[data-choice]").forEach(function (button) { button.removeAttribute("aria-pressed"); });
        transitionInput.value = "balmer-alpha";
        isotopeInput.value = "1";
        zInput.value = "1";
        fieldInput.value = "0";
        channelInput.value = "allowed";
        reveal.hidden = true;
        feedback.className = "as-feedback";
        feedback.textContent = "";
        render();
      }
    });
    [transitionInput, isotopeInput, zInput, fieldInput, channelInput].forEach(function (input) { input.addEventListener("input", render); input.addEventListener("change", render); });
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; if (!condition) fail("self-test failed: " + message); }
    var hAlpha = lineWavelength(3, 2, 1, 1);
    var dAlpha = lineWavelength(3, 2, 1, 2);
    check(hAlpha > 656 && hAlpha < 657, "hydrogen H-alpha wavelength");
    check(dAlpha < hAlpha, "heavier isotope has slightly shorter wavelength");
    check(lineWavelength(2, 1, 1, 1) < hAlpha, "Lyman alpha is shorter than Balmer alpha");
    check(lineEnergy(3, 2, 1, 1) > 1, "line energy positive");
    check(reducedMassRatio(2) > reducedMassRatio(1), "reduced mass grows for deuterium");
    check(fineStructureScale(1, 3, 1) > 0, "fine structure scale positive");
    check(near(zeemanShift(0, 2, 0.5), 0), "zero-field Zeeman shift");
    check(near(zeemanShift(2, 2, 0.5), 2 * BOHR_MAGNETON_EV_T), "linear Zeeman scale");
    check(transitionAllowed(1, 0, 0, 0), "allowed E1 channel");
    check(!transitionAllowed(1, 0, 1, 0), "delta l zero forbidden");
    check(!transitionAllowed(2, 2, 1, 0), "delta m two forbidden");
    check(analyze({ transition: "balmer-alpha", massNumber: 1, z: 1, field: 0, channel: "allowed" }).allowed, "allowed preset analysis");
    check(!analyze({ transition: "balmer-alpha", massNumber: 1, z: 1, field: 0, channel: "same-l" }).allowed, "forbidden preset analysis");
    var rejected = false;
    try { lineWavelength(3.2, 2, 1, 1); } catch (error) { rejected = true; }
    check(rejected, "fractional principal quantum number rejected");
    rejected = false;
    try { analyze({ transition: "balmer-alpha", massNumber: 1.5, z: 1 }); } catch (error) { rejected = true; }
    check(rejected, "fractional mass number rejected");
    return { checks: checks, presets: PRESETS.length };
  }

  return {
    TRANSITIONS: TRANSITIONS,
    PRESETS: PRESETS,
    reducedMassRatio: reducedMassRatio,
    rydbergWavenumber: rydbergWavenumber,
    lineWavenumber: lineWavenumber,
    lineWavelength: lineWavelength,
    lineEnergy: lineEnergy,
    fineStructureScale: fineStructureScale,
    zeemanShift: zeemanShift,
    transitionAllowed: transitionAllowed,
    analyze: analyze,
    buildSvg: buildSvg,
    mount: mount,
    selfTest: selfTest
  };
});
