(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("physics-exchange-statistics", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      process.stdout.write("physics-exchange-statistics self-test: PASS (" + report.checks + " checks)\n");
    } catch (error) {
      process.stderr.write("physics-exchange-statistics self-test: FAIL\n" + error.stack + "\n");
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var LAB_ID = "physics-exchange-statistics";
  var STYLE_ID = "physics-exchange-statistics-styles";
  var INSTANCE = 0;
  var PRESETS = [
    { id: "boson", label: "玻色子：完全重合", statistics: "boson", overlap: 1 },
    { id: "fermion", label: "费米子：完全重合", statistics: "fermion", overlap: 1 },
    { id: "partial", label: "部分可辨：s=0.6", statistics: "boson", overlap: 0.6 },
    { id: "distinguishable", label: "可区分：无交换干涉", statistics: "distinguishable", overlap: 0 }
  ];

  var STYLE_TEXT = [
    ".ex-lab{--ex-blue:var(--cl-blue,#315f9d);--ex-gold:var(--cl-gold,#9b6a12);--ex-green:var(--cl-green,#39734d);--ex-red:var(--cl-red,#b64335);display:block;max-width:100%;min-width:0;color:var(--fg,#292722);line-height:1.55;overflow-wrap:anywhere}",
    ".ex-lab *,.ex-lab *::before,.ex-lab *::after{box-sizing:border-box}.ex-lab [hidden]{display:none!important}.ex-lab h3,.ex-lab h4{margin:0;letter-spacing:0}.ex-lab h3{font-size:1.16rem}.ex-lab p{margin:8px 0}.ex-lab .ex-note{color:var(--fg-soft,#6b6557);font-size:13px;line-height:1.7}.ex-lab button,.ex-lab input,.ex-lab select{font:inherit;letter-spacing:0}.ex-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#d7d0c2);border-radius:6px;background:var(--bg,#fff);color:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.ex-lab button:hover{border-color:var(--ex-blue)}.ex-lab button[aria-pressed=true],.ex-lab .ex-primary{border-color:var(--ex-blue);background:var(--ex-blue);color:var(--bg,#fff);font-weight:750}.ex-lab button:focus-visible,.ex-lab input:focus-visible,.ex-lab select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.ex-lab .ex-predict{margin:13px 0 0;padding:12px;border:1px solid var(--border,#d7d0c2);background:var(--block-bg,var(--bg,#fff))}.ex-lab .ex-predict legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}.ex-lab .ex-question{display:grid;gap:7px;margin:10px 0}.ex-lab .ex-question strong{font-size:13px}.ex-lab .ex-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.ex-lab .ex-choices button{font-size:12px}.ex-lab .ex-actions,.ex-lab .ex-presets{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px}.ex-lab .ex-actions>*{flex:1 1 170px}.ex-lab .ex-presets button{flex:1 1 145px;font-size:12px}.ex-lab .ex-feedback{min-height:2em;margin:8px 0;color:var(--fg-soft,#6b6557);font-size:13px;font-weight:700}.ex-lab .ex-good{color:var(--ex-green)}.ex-lab .ex-warn{color:var(--ex-red)}",
    ".ex-lab .ex-reveal{margin-top:18px;padding-top:16px;border-top:1px solid var(--border,#d7d0c2)}.ex-lab .ex-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px;align-items:end;margin:12px 0}.ex-lab .ex-control{display:grid;gap:5px;min-width:0}.ex-lab .ex-control label,.ex-lab .ex-control>span{color:var(--fg-soft,#6b6557);font-size:12.5px;font-weight:700;line-height:1.45}.ex-lab .ex-control output{color:var(--ex-blue);font-variant-numeric:tabular-nums}.ex-lab .ex-control input[type=range],.ex-lab .ex-control select{display:block;width:100%;min-width:0;min-height:44px;margin:0}.ex-lab .ex-control input[type=range]{accent-color:var(--ex-blue)}.ex-lab .ex-stage{min-width:0;padding:7px;border:1px solid var(--border,#d7d0c2);border-radius:7px;background:var(--bg,#fff);overflow:hidden}.ex-lab svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,#292722)}.ex-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.ex-lab .ex-metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:12px 0}.ex-lab .ex-metric{min-width:0;padding:9px;border-top:2px solid var(--border,#d7d0c2);background:var(--bg,#fff)}.ex-lab .ex-metric:nth-child(3n+1){border-color:var(--ex-blue)}.ex-lab .ex-metric:nth-child(3n+2){border-color:var(--ex-gold)}.ex-lab .ex-metric:nth-child(3n){border-color:var(--ex-green)}.ex-lab .ex-metric span{display:block;color:var(--fg-soft,#6b6557);font-size:11px;line-height:1.4}.ex-lab .ex-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.ex-lab .ex-table-wrap{max-width:100%;margin-top:12px;overflow-x:auto;-webkit-overflow-scrolling:touch}.ex-lab table{width:100%;min-width:650px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.ex-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft,#6b6557);font-size:12px}.ex-lab th,.ex-lab td{padding:7px 8px;border-bottom:1px solid var(--border,#d7d0c2);text-align:left;vertical-align:top}.ex-lab th{color:var(--fg-soft,#6b6557);font-size:11.5px}.ex-lab .ex-status{margin:12px 0 0;padding:10px 12px;border-left:3px solid var(--ex-green);background:var(--block-bg,var(--bg,#fff));font-size:13px;line-height:1.7}.ex-lab .ex-legend{display:flex;flex-wrap:wrap;gap:12px;margin-top:7px;color:var(--fg-soft,#6b6557);font-size:12px}.ex-lab .ex-legend span{display:inline-flex;align-items:center;gap:5px}.ex-lab .ex-swatch{display:inline-block;width:21px;border-top:3px solid var(--ex-blue)}.ex-lab .ex-swatch-gold{border-color:var(--ex-gold)}.ex-lab .ex-swatch-red{border-color:var(--ex-red);border-top-style:dashed}",
    ".ex-lab svg{overflow:visible}.ex-lab .ex-input,.ex-lab .ex-output{fill:none;stroke:var(--ex-blue);stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}.ex-lab .ex-output{stroke:var(--ex-green)}.ex-lab .ex-arrow{fill:var(--ex-green);stroke:var(--bg,#fff);stroke-width:.8}.ex-lab .ex-splitter{fill:var(--ex-gold);fill-opacity:.18;stroke:var(--ex-gold);stroke-width:1.5}.ex-lab .ex-axis{fill:none;stroke:currentColor;stroke-width:1.2;stroke-opacity:.65}.ex-lab .ex-same-bar{fill:var(--ex-blue);fill-opacity:.78;stroke:var(--ex-blue);stroke-width:1}.ex-lab .ex-coin-bar{fill:var(--ex-gold);fill-opacity:.78;stroke:var(--ex-gold);stroke-width:1}.ex-lab .ex-title{fill:currentColor;font-size:12px;font-weight:750}.ex-lab .ex-label{fill:var(--fg-soft,#6b6557);font-size:11px}.ex-lab .ex-callout{fill:currentColor;font-size:11px;font-weight:750}.ex-lab .ex-boson{fill:var(--ex-blue);font-size:11px;font-weight:750}.ex-lab .ex-fermion{fill:var(--ex-red);font-size:11px;font-weight:750}.ex-lab .ex-neutral{fill:var(--ex-green);font-size:11px;font-weight:750}.ex-lab .ex-control input:disabled{cursor:not-allowed;opacity:.58}",
    "@media(max-width:820px){.ex-lab .ex-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:600px){.ex-lab .ex-controls,.ex-lab .ex-metrics,.ex-lab .ex-choices{grid-template-columns:minmax(0,1fr)}.ex-lab .ex-stage{padding:4px}}@media(prefers-reduced-motion:reduce){.ex-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value)));
  }

  function near(left, right, tolerance) {
    return Math.abs(left - right) <= (tolerance === undefined ? 1e-10 : tolerance) * Math.max(1, Math.abs(left), Math.abs(right));
  }

  function format(value, digits) {
    if (!finite(value)) return "—";
    var places = digits === undefined ? 3 : digits;
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function normalize(input) {
    var source = input || {};
    var statistics = ["boson", "fermion", "distinguishable"].indexOf(source.statistics) >= 0 ? source.statistics : "boson";
    var requestedOverlap = clamp(finite(Number(source.overlap)) ? Number(source.overlap) : 1, 0, 1);
    return {
      statistics: statistics,
      overlap: statistics === "distinguishable" ? 0 : requestedOverlap,
      overlapWasNormalized: statistics === "distinguishable" && requestedOverlap !== 0
    };
  }

  function exchangeModel(input) {
    var state = normalize(input);
    var exchangeEigenvalue = state.statistics === "boson" ? 1 : state.statistics === "fermion" ? -1 : null;
    var exchangeVisibility = state.statistics === "distinguishable" ? 0 : state.overlap * state.overlap;
    var sameOutput = state.statistics === "distinguishable" ? 0.5 : (1 + exchangeEigenvalue * exchangeVisibility) / 2;
    var coincidence = state.statistics === "distinguishable" ? 0.5 : (1 - exchangeEigenvalue * exchangeVisibility) / 2;
    return {
      state: state,
      eta: exchangeEigenvalue,
      exchangeEigenvalue: exchangeEigenvalue,
      interferenceCoefficient: exchangeVisibility,
      exchangeVisibility: exchangeVisibility,
      sameOutput: sameOutput,
      coincidence: coincidence,
      label: state.statistics === "boson" ? "玻色子（对称）" : state.statistics === "fermion" ? "费米子（反对称）" : "可区分粒子"
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

  function exchangeSemantics(data) {
    var distinguishable = data.state.statistics === "distinguishable";
    return {
      distinguishable: distinguishable,
      hasExchangeEigenvalue: !distinguishable,
      eigenvalueText: distinguishable ? "不适用（无交换本征值）" : "η=" + (data.exchangeEigenvalue > 0 ? "+1（对称）" : "−1（反对称）"),
      overlapText: distinguishable ? "不适用（已固定为可区分基线）" : "s=" + format(data.state.overlap, 2),
      visibilityText: distinguishable ? "无交换干涉；P=1/2" : "交换可见度 s²=" + format(data.exchangeVisibility, 2),
      probabilityFormula: distinguishable ? "P_same=P_coin=1/2" : "P_same/P_coin=(1±ηs²)/2"
    };
  }

  function dashboardSvg(data, uid) {
    var sameHeight = data.sameOutput * 115;
    var coincidenceHeight = data.coincidence * 115;
    var semantics = exchangeSemantics(data);
    var statClass = data.state.statistics === "boson" ? "ex-boson" : data.state.statistics === "fermion" ? "ex-fermion" : "ex-neutral";
    return [
      '<svg viewBox="0 0 760 300" role="img" aria-labelledby="' + uid + '-title ' + uid + '-desc">',
      '<title id="' + uid + '-title">全同粒子在平衡分束器上的交换干涉</title>',
      '<desc id="' + uid + '-desc">左侧显示两个输入端经过平衡分束器后到两个输出端，右侧柱状图比较两粒子同端输出与符合计数概率。</desc>',
      text(180, 25, "两条路径：直接到达 ± 交换到达", "ex-title", "middle"),
      line(28, 91, 118, 91, "ex-input"),
      line(28, 171, 118, 171, "ex-input"),
      '<polygon class="ex-arrow" points="111,85 124,91 111,97"></polygon>',
      '<polygon class="ex-arrow" points="111,165 124,171 111,177"></polygon>',
      '<rect class="ex-splitter" x="124" y="91" width="82" height="80" rx="5"></rect>',
      line(206, 91, 334, 49, "ex-output"),
      line(206, 91, 334, 131, "ex-output"),
      line(206, 171, 334, 131, "ex-output"),
      line(206, 171, 334, 213, "ex-output"),
      '<polygon class="ex-arrow" points="324,43 337,49 324,55"></polygon>',
      '<polygon class="ex-arrow" points="324,125 337,131 324,137"></polygon>',
      '<polygon class="ex-arrow" points="324,207 337,213 324,219"></polygon>',
      text(45, 75, "输入 a", "ex-label"),
      text(45, 191, "输入 b", "ex-label"),
      text(165, 135, "50/50", "ex-callout", "middle"),
      text(350, 49, "输出 c", "ex-label"),
      text(350, 137, "输出 d", "ex-label"),
      text(180, 240, data.label + "，" + semantics.eigenvalueText, statClass, "middle"),
      text(180, 261, semantics.visibilityText, "ex-label", "middle"),
      text(553, 25, "测量结果概率", "ex-title", "middle"),
      line(416, 253, 716, 253, "ex-axis"),
      '<rect class="ex-same-bar" x="474" y="' + (253 - sameHeight).toFixed(2) + '" width="70" height="' + sameHeight.toFixed(2) + '"></rect>',
      '<rect class="ex-coin-bar" x="616" y="' + (253 - coincidenceHeight).toFixed(2) + '" width="70" height="' + coincidenceHeight.toFixed(2) + '"></rect>',
      text(509, 273, "同端 P_same", "ex-label", "middle"),
      text(651, 273, "符合 P_coin", "ex-label", "middle"),
      text(509, 243 - sameHeight, format(data.sameOutput, 3), "ex-callout", "middle"),
      text(651, 243 - coincidenceHeight, format(data.coincidence, 3), "ex-callout", "middle"),
      text(553, 299, "P_same+P_coin=1", "ex-label", "middle"),
      '</svg>'
    ].join("");
  }

  function metric(doc, label, value) {
    var box = doc.createElement("div");
    box.className = "ex-metric";
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
      ".ex-lab svg", ".ex-lab svg text", ".ex-input", ".ex-output", ".ex-arrow", ".ex-splitter",
      ".ex-axis", ".ex-same-bar", ".ex-coin-bar", ".ex-title", ".ex-label", ".ex-callout",
      ".ex-boson", ".ex-fermion", ".ex-neutral", ".ex-legend", ".ex-swatch", ".ex-swatch-gold", ".ex-swatch-red"
    ];
    var missing = selectors.filter(function (selector) { return css.indexOf(selector) < 0; });
    return { ok: missing.length === 0, missing: missing };
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument || root.getAttribute("data-ex-mounted") === "true") return;
    var doc = root.ownerDocument;
    appendStyle(doc);
    var uid = LAB_ID + "-" + (++INSTANCE);
    root.setAttribute("data-ex-mounted", "true");
    root.innerHTML = [
      '<div class="ex-lab">',
      '<h3>交换统计：同一组路径，交换号决定干涉</h3>',
      '<p class="ex-note">对玻色子或费米子，s=|⟨χ_a|χ_b⟩| 表示内部状态的重合度；s=1 是完全不可区分，s=0 时交换干涉消失。可区分粒子没有交换本征值，直接回到 1/2、1/2 基线。</p>',
      '<fieldset class="ex-predict"><legend>三项预测</legend>',
      '<div class="ex-question" data-question="0"><strong>1. 完全不可区分的玻色子通过 50/50 分束器，符合计数 P_coin 是多少？</strong><div class="ex-choices"><button type="button" data-choice="0">0</button><button type="button" data-choice="1">1/2</button><button type="button" data-choice="2">1</button></div></div>',
      '<div class="ex-question" data-question="1"><strong>2. 完全不可区分的费米子，两个粒子同端输出的概率是多少？</strong><div class="ex-choices"><button type="button" data-choice="0">0</button><button type="button" data-choice="1">1/2</button><button type="button" data-choice="2">1</button></div></div>',
      '<div class="ex-question" data-question="2"><strong>3. 若 s=0，玻色子与费米子的同端/符合概率会怎样？</strong><div class="ex-choices"><button type="button" data-choice="0">都回到 1/2、1/2</button><button type="button" data-choice="1">仍完全相反</button><button type="button" data-choice="2">都变成 0</button></div></div>',
      '</fieldset>',
      '<div class="ex-actions"><button class="ex-primary" type="button" data-action="reveal">提交预测并揭示</button><button type="button" data-action="reset">重置</button></div>',
      '<p class="ex-feedback" role="status" aria-live="polite"></p>',
      '<div class="ex-reveal" hidden>',
      '<div class="ex-presets"></div>',
      '<div class="ex-controls">',
      '<label class="ex-control"><span>统计类型</span><select data-input="statistics" aria-label="统计类型"><option value="boson">玻色子：交换对称</option><option value="fermion">费米子：交换反对称</option><option value="distinguishable">可区分粒子：无交换干涉</option></select></label>',
      '<label class="ex-control"><span data-overlap-label>重合度 s（玻色/费米内部状态）</span><output data-output="overlap"></output><input data-input="overlap" type="range" min="0" max="1" step="0.01" value="1" aria-label="玻色或费米粒子的内部状态重合度"></label>',
      '</div>',
      '<div class="ex-stage" data-stage></div>',
      '<div class="ex-metrics" data-metrics></div>',
      '<div class="ex-table-wrap"><table><caption>直接路径与交换路径的概率账本</caption><thead><tr><th>量</th><th>当前值</th><th>解释</th></tr></thead><tbody data-ledger></tbody></table></div>',
      '<p class="ex-status" data-status role="status" aria-live="polite"></p>',
      '<div class="ex-legend"><span><i class="ex-swatch"></i>同端输出</span><span><i class="ex-swatch ex-swatch-gold"></i>符合输出</span><span><i class="ex-swatch ex-swatch-red"></i>交换符号改变干涉</span></div>',
      '</div></div>'
    ].join("");
    var lab = root.firstElementChild;
    var reveal = lab.querySelector(".ex-reveal");
    var feedback = lab.querySelector(".ex-feedback");
    var inputs = {
      statistics: lab.querySelector('[data-input="statistics"]'),
      overlap: lab.querySelector('[data-input="overlap"]')
    };
    var predictions = [null, null, null];
    var presetHost = lab.querySelector(".ex-presets");
    PRESETS.forEach(function (preset) {
      var button = doc.createElement("button");
      button.type = "button";
      button.setAttribute("data-preset", preset.id);
      button.textContent = preset.label;
      presetHost.appendChild(button);
    });

    function setState(state) {
      inputs.statistics.value = state.statistics;
      inputs.overlap.value = String(state.overlap);
      render();
    }

    function render() {
      var data = exchangeModel({ statistics: inputs.statistics.value, overlap: Number(inputs.overlap.value) });
      var semantics = exchangeSemantics(data);
      inputs.overlap.value = String(data.state.overlap);
      inputs.overlap.disabled = semantics.distinguishable;
      inputs.overlap.setAttribute("aria-disabled", semantics.distinguishable ? "true" : "false");
      lab.querySelector("[data-overlap-label]").textContent = semantics.distinguishable ? "重合度 s（可区分状态不适用）" : "重合度 s（玻色/费米内部状态）";
      lab.querySelector('[data-output="overlap"]').textContent = semantics.distinguishable ? "不适用" : format(data.state.overlap, 2);
      lab.querySelector("[data-stage]").innerHTML = dashboardSvg(data, uid);
      lab.querySelector("[data-metrics]").replaceChildren(
        metric(doc, "η（交换本征值）", semantics.hasExchangeEigenvalue ? String(data.exchangeEigenvalue) : "不适用"),
        metric(doc, "s", semantics.distinguishable ? "不适用" : format(data.state.overlap, 2)),
        metric(doc, "交换可见度 s²", format(data.exchangeVisibility, 3)),
        metric(doc, "P_same", format(data.sameOutput, 3)),
        metric(doc, "P_coin", format(data.coincidence, 3))
      );
      lab.querySelector("[data-ledger]").innerHTML = [
        ["交换算符", "P₁₂²=1", semantics.eigenvalueText],
        ["内部重合", "s=|⟨χ_a|χ_b⟩|", semantics.distinguishable ? "不适用：路径已可辨" : format(data.state.overlap, 3)],
        ["交换干涉强度", "s²", format(data.exchangeVisibility, 3)],
        ["同端输出", semantics.distinguishable ? "1/2（可区分基线）" : "(1+ηs²)/2", format(data.sameOutput, 3)],
        ["符合输出", semantics.distinguishable ? "1/2（可区分基线）" : "(1−ηs²)/2", format(data.coincidence, 3)],
        ["概率归一化", "P_same+P_coin", format(data.sameOutput + data.coincidence, 3)]
      ].map(function (row) { return "<tr><th scope=\"row\">" + row[0] + "</th><td>" + row[1] + "</td><td>" + row[2] + "</td></tr>"; }).join("");
      lab.querySelector("[data-status]").textContent = data.state.statistics === "distinguishable"
        ? "可区分粒子：不把 0 当作交换本征值；内部标签已使交换干涉失效，重合度控件固定为不适用，输出回到 P_same=P_coin=1/2。"
        : data.state.statistics === "boson" && data.state.overlap > 0.99
        ? "玻色子完全重合：交换路径与直接路径在符合通道相消，粒子成对出现在同一输出端。"
        : data.state.statistics === "fermion" && data.state.overlap > 0.99
          ? "费米子完全重合：反对称交换号使同端通道相消，出现反聚束；这不是经典排斥力。"
          : "交换可见度只有 s²：内部标签、偏振或环境记录会把纯粹的玻色/费米极限拉回可区分基线。";
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
          feedback.className = "ex-feedback ex-warn";
          feedback.textContent = "请先完成三项预测；揭示后再比较统计类型和可辨识度。";
          return;
        }
        var correct = [0, 0, 0];
        var score = predictions.reduce(function (sum, value, index) { return sum + (value === correct[index] ? 1 : 0); }, 0);
        feedback.className = "ex-feedback " + (score === 3 ? "ex-good" : "ex-warn");
        feedback.textContent = "预测 " + score + "/3。现在把交换本征值、重合度和路径概率分开。";
        reveal.hidden = false;
        render();
      } else {
        predictions = [null, null, null];
        lab.querySelectorAll("button[data-choice]").forEach(function (button) { button.removeAttribute("aria-pressed"); });
        inputs.statistics.value = "boson";
        inputs.overlap.value = "1";
        reveal.hidden = true;
        feedback.className = "ex-feedback";
        feedback.textContent = "";
        render();
      }
    });
    Object.keys(inputs).forEach(function (key) { inputs[key].addEventListener("input", render); inputs[key].addEventListener("change", render); });
    render();
    if (api && typeof api.announce === "function") api.announce(root, "交换统计实验已加载；预测答案仍隐藏。");
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(LAB_ID + " self-test failed: " + message);
    }
    var boson = exchangeModel({ statistics: "boson", overlap: 1 });
    var fermion = exchangeModel({ statistics: "fermion", overlap: 1 });
    var partial = exchangeModel({ statistics: "boson", overlap: 0.6 });
    var classical = exchangeModel({ statistics: "distinguishable", overlap: 0 });
    var style = svgStyleSemantics();
    assert(style.ok, "SVG presentation styles cover rendered classes");
    assert(near(boson.sameOutput, 1) && near(boson.coincidence, 0), "boson bunching");
    assert(near(fermion.sameOutput, 0) && near(fermion.coincidence, 1), "fermion antibunching");
    assert(near(partial.coincidence, 0.32), "partial boson exchange visibility");
    assert(near(exchangeModel({ statistics: "fermion", overlap: 0.6 }).coincidence, 0.68), "partial fermion exchange visibility");
    assert(near(classical.sameOutput, 0.5) && near(classical.coincidence, 0.5), "distinguishable baseline");
    var contradictory = exchangeModel({ statistics: "distinguishable", overlap: 1 });
    assert(contradictory.state.overlap === 0 && contradictory.state.overlapWasNormalized, "distinguishable state normalizes contradictory overlap");
    assert(contradictory.eta === null && contradictory.exchangeEigenvalue === null && !exchangeSemantics(contradictory).hasExchangeEigenvalue, "distinguishable state has no exchange eigenvalue");
    assert(contradictory.interferenceCoefficient === 0 && exchangeSemantics(contradictory).eigenvalueText.indexOf("η=0") < 0, "zero is reserved for interference visibility, not eta display");
    assert(near(partial.sameOutput + partial.coincidence, 1), "probability normalization");
    assert(PRESETS.length >= 4, "teaching presets");
    return { checks: checks, presets: PRESETS.length };
  }

  return {
    PRESETS: PRESETS,
    normalize: normalize,
    exchangeModel: exchangeModel,
    exchangeSemantics: exchangeSemantics,
    svgStyleSemantics: svgStyleSemantics,
    mount: mount,
    selfTest: selfTest
  };
});
