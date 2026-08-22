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
    { id: "lyman-alpha", label: "Lyman α：2p → 1s", nHigh: 2, nLow: 1 },
    { id: "balmer-alpha", label: "Balmer Hα：3p → 2s", nHigh: 3, nLow: 2 },
    { id: "balmer-beta", label: "Balmer Hβ：4p → 2s", nHigh: 4, nLow: 2 },
    { id: "paschen-alpha", label: "Paschen α：4p → 3s", nHigh: 4, nLow: 3 }
  ];
  var PRESETS = [
    { id: "hydrogen", label: "H：Balmer Hα", transition: "balmer-alpha", isotope: 1, z: 1, field: 0, channel: "allowed" },
    { id: "deuterium", label: "D：同一条 Hα", transition: "balmer-alpha", isotope: 2, z: 1, field: 0, channel: "allowed" },
    { id: "fine", label: "弱场：看修正尺度", transition: "balmer-alpha", isotope: 1, z: 1, field: 3, channel: "allowed" },
    { id: "forbidden", label: "禁戒通道：Δℓ=0", transition: "balmer-alpha", isotope: 1, z: 1, field: 0, channel: "same-l" }
  ];
  var CHANNELS = {
    allowed: { label: "E1 允许：Δℓ=+1, Δm=0", lHigh: 1, lLow: 0, mHigh: 0, mLow: 0 },
    "same-l": { label: "E1 禁戒：Δℓ=0", lHigh: 1, lLow: 1, mHigh: 0, mLow: 0 },
    "delta-m": { label: "E1 禁戒：|Δm|=2", lHigh: 2, lLow: 1, mHigh: 2, mLow: 0 }
  };

  var STYLE_TEXT = [
    ".as-lab{--as-blue:var(--cl-blue,#315f9d);--as-green:var(--cl-green,#39734d);--as-gold:var(--cl-gold,#9b6a12);--as-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg,#292722);line-height:1.55;overflow-wrap:anywhere}",
    ".as-lab *,.as-lab *::before,.as-lab *::after{box-sizing:border-box}.as-lab [hidden]{display:none!important}.as-lab h3{margin:0;letter-spacing:0;color:var(--fg,#292722);font-size:1.15rem}.as-lab p{margin:8px 0}.as-lab .as-note{color:var(--fg-soft,var(--muted,#6b6557));font-size:13px;line-height:1.65}",
    ".as-lab button,.as-lab input,.as-lab select{font:inherit}.as-lab button{min-width:0;min-height:44px;padding:8px 10px;border:1px solid var(--border,#d7d0c2);border-radius:6px;background:var(--bg,#fff);color:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.as-lab button:hover{border-color:var(--as-blue)}.as-lab button:focus-visible,.as-lab input:focus-visible,.as-lab select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.as-lab button[aria-pressed=true],.as-lab .as-primary{border-color:var(--as-blue);background:var(--as-blue);color:var(--bg,#fff);font-weight:750}.as-lab .as-presets{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:11px 0}.as-lab .as-presets button{font-size:12px}.as-lab .as-predict{margin-top:13px;padding:12px;border:1px solid var(--border,#d7d0c2);background:var(--block-bg,var(--bg,#fff))}.as-lab .as-predict legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}.as-lab .as-question{margin:9px 0}.as-lab .as-question strong{display:block;font-size:13px}.as-lab .as-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:7px}.as-lab .as-choices button{font-size:12px}.as-lab .as-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px}.as-lab .as-actions>*{flex:1 1 170px}.as-lab .as-feedback{min-height:2em;margin:8px 0;color:var(--fg-soft,var(--muted,#6b6557));font-size:13px;font-weight:700}.as-lab .as-pass{color:var(--as-green)}.as-lab .as-warn{color:var(--as-red)}",
    ".as-lab .as-reveal{margin-top:18px;padding-top:16px;border-top:1px solid var(--border,#d7d0c2)}.as-lab .as-controls{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin:11px 0;align-items:end}.as-lab .as-control{display:grid;gap:5px;min-width:0}.as-lab .as-control label{color:var(--fg-soft,var(--muted,#6b6557));font-size:12.5px;font-weight:700}.as-lab .as-control output{color:var(--as-blue);font-variant-numeric:tabular-nums}.as-lab .as-control select,.as-lab input[type=range]{width:100%;min-width:0;min-height:44px;margin:0}.as-lab input[type=range]{accent-color:var(--as-blue)}",
    ".as-lab .as-stage{min-width:0;padding:8px;border:1px solid var(--border,#d7d0c2);border-radius:6px;background:var(--bg,#fff);overflow:hidden}.as-lab svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg,#292722)}.as-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.as-lab .as-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.58}.as-lab .as-level{stroke:var(--as-blue);stroke-width:2.2}.as-lab .as-arrow{stroke:var(--as-gold);stroke-width:2.5;marker-end:url(#as-arrow-head)}.as-lab .as-correction{stroke:var(--as-red);stroke-width:2;stroke-dasharray:5 4}.as-lab .as-title{font-size:13px;font-weight:750}.as-lab .as-small{font-size:11px;fill:var(--fg-soft,var(--muted,#6b6557))}",
    ".as-lab .as-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:12px}.as-lab table{width:100%;min-width:820px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.as-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft,var(--muted,#6b6557));font-size:12px}.as-lab th,.as-lab td{padding:7px 8px;border-bottom:1px solid var(--border,#d7d0c2);text-align:left;vertical-align:top}.as-lab th{color:var(--fg-soft,var(--muted,#6b6557));font-size:11.5px}.as-lab .as-status{margin-top:11px;padding:9px 11px;border-left:3px solid var(--as-green);background:var(--block-bg,var(--bg,#fff));font-size:13px;line-height:1.65}",
    "@media(max-width:1000px){.as-lab .as-controls{grid-template-columns:repeat(3,minmax(0,1fr))}.as-lab .as-presets{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:620px){.as-lab .as-controls,.as-lab .as-presets,.as-lab .as-choices{grid-template-columns:minmax(0,1fr)}.as-lab .as-stage{padding:4px}}@media(prefers-reduced-motion:reduce){.as-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
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
    return {
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
      allowed: transitionAllowed(channel.lHigh, channel.mHigh, channel.lLow, channel.mLow)
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
    var lowerY = 246;
    var upperY = 90;
    var parts = [
      '<defs><marker id="' + prefix + '-arrow-head" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z" fill="currentColor"></path></marker></defs>',
      '<line class="as-axis" x1="55" y1="278" x2="650" y2="278"></line>',
      '<line class="as-level" x1="110" y1="' + lowerY + '" x2="300" y2="' + lowerY + '"></line>',
      '<line class="as-level" x1="110" y1="' + upperY + '" x2="300" y2="' + upperY + '"></line>',
      '<line class="as-arrow" marker-end="url(#' + prefix + '-arrow-head)" x1="205" y1="' + (upperY + 12) + '" x2="205" y2="' + (lowerY - 12) + '"></line>',
      '<line class="as-correction" x1="430" y1="' + (lowerY - 20) + '" x2="430" y2="' + (lowerY + 20) + '"></line>'
    ];
    parts.push(svgText(205, 58, "氢样能级跃迁", "as-title", "middle"));
    parts.push(svgText(105, lowerY + 23, "n=" + data.transition.nLow + "，E_low", "as-small"));
    parts.push(svgText(105, upperY - 10, "n=" + data.transition.nHigh + "，E_high", "as-small"));
    parts.push(svgText(220, 158, fixed(data.wavelength, 3) + " nm", "as-small", "middle"));
    parts.push(svgText(220, 177, "ΔE=" + fixed(data.energy, 4) + " eV", "as-small", "middle"));
    parts.push(svgText(430, 58, "修正尺度（非完整分裂）", "as-title", "middle"));
    parts.push(svgText(430, 112, "fine ~ " + fixed(data.fineScale * 1e6, 3) + " μeV", "as-small", "middle"));
    parts.push(svgText(430, 137, "Zeeman ~ " + fixed(data.zeemanShift * 1e6, 3) + " μeV", "as-small", "middle"));
    parts.push(svgText(55, 316, "蓝：模型能级；金：光子跃迁；红虚线：仅显示数量级修正。", "as-small"));
    return parts.join("");
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
      '<div class="as-control"><label for="' + prefix + '-isotope">核种</label><select id="' + prefix + '-isotope" data-input="isotope"><option value="1">H（质子核）</option><option value="2">D（氘核）</option></select></div>',
      '<div class="as-control"><label for="' + prefix + '-z">Z：<output data-output="z">1</output></label><input id="' + prefix + '-z" data-input="z" type="range" min="1" max="3" step="1" value="1"></div>',
      '<div class="as-control"><label for="' + prefix + '-field">B：<output data-output="field">0.0 T</output></label><input id="' + prefix + '-field" data-input="field" type="range" min="0" max="10" step="0.5" value="0"></div>',
      '<div class="as-control"><label for="' + prefix + '-channel">通道</label><select id="' + prefix + '-channel" data-input="channel"><option value="allowed">E1 允许：Δℓ=+1, Δm=0</option><option value="same-l">E1 禁戒：Δℓ=0</option><option value="delta-m">E1 禁戒：|Δm|=2</option></select></div>',
      '</div>',
      '<div class="as-stage"><svg viewBox="0 0 700 330" role="img" aria-labelledby="' + prefix + '-title ' + prefix + '-desc"><title id="' + prefix + '-title">氢样能级与修正尺度图</title><desc id="' + prefix + '-desc">蓝色能级与金色跃迁箭头来自氢样 Coulomb 模型，红色虚线只显示精细结构和 Zeeman 数量级。</desc><g data-svg></g></svg>',
      '<div class="as-table-wrap"><table aria-label="原子光谱模型账本"><caption>模型公式、尺度估计和选择定则分栏记录</caption><thead><tr><th>量</th><th>当前值</th><th>层级</th><th>边界</th></tr></thead><tbody data-ledger></tbody></table></div>',
      '<p class="as-status" role="status" aria-live="polite" data-status></p></div></div>',
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
      lab.querySelector('[data-output="field"]').textContent = fixed(data.field, 1) + " T";
      lab.querySelector("[data-svg]").innerHTML = buildSvg(data, prefix);
      var rows = [
        ["Rydberg 波数", fixed(data.wavenumber, 2) + " m⁻¹", "氢样单电子 Coulomb 模型 + 约化质量", "不是多电子原子的完整谱线"],
        ["谱线波长", fixed(data.wavelength, 4) + " nm", "模型内由 ΔE=hc/λ 得到", "测量还含 Lamb、超精细、碰撞/仪器展宽等"],
        ["光子能量", fixed(data.energy, 6) + " eV", "同一模型的能级差", "数值精度不等于实验精度"],
        ["约化质量比 μ/mₑ", fixed(data.massRatio, 9), "有限核质量的一阶模型修正", "核质量输入是近似常数"],
        ["精细结构尺度", fixed(data.fineScale * 1e6, 3) + " μeV", "(Zα)^4/n³ 的数量级估计", "不是精确 j 分裂、Lamb 或超精细计算"],
        ["Zeeman 线性项", fixed(data.zeemanShift * 1e6, 3) + " μeV", "μ_B g_J m_J B 的弱场尺度", "强场/混合态需重新对角化 Hamiltonian"],
        ["E1 选择定则", data.allowed ? "允许" : "禁戒", "Δℓ=±1、Δm=0,±1 的偶极近似", "禁戒不等于所有多极过程绝对不可能"]
      ];
      lab.querySelector("[data-ledger]").innerHTML = rows.map(function (row) { return "<tr>" + row.map(function (cell) { return "<td>" + escapeHtml(cell) + "</td>"; }).join("") + "</tr>"; }).join("");
      lab.querySelector("[data-status]").textContent = data.allowed ? "当前通道满足 E1 选择定则。蓝/金读数是氢样模型内的能级差；红色修正只给尺度，不能冒充完整原子计算或测量拟合。" : "当前通道在 E1 偶极近似下禁戒。能级差仍可由模型计算，但是否出现弱线要交给多极矩、组态混合或外场模型。";
    }

    lab.addEventListener("click", function (event) {
      var choice = event.target.closest("button[data-choice]");
      if (choice) {
        var question = choice.closest("[data-question]");
        var index = Number(question.getAttribute("data-question"));
        selected[index] = Number(choice.getAttribute("data-choice"));
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
    mount: mount,
    selfTest: selfTest
  };
});
