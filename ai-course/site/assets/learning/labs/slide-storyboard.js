(function (host) {
  "use strict";

  var STYLE_ID = "slide-storyboard-lab-styles";
  var AUDIENCES = {
    peers: { label: "本领域同行", needs: ["method", "uncertainty", "limits"] },
    mixed: { label: "跨专业研究生", needs: ["context", "comparison", "limits"] },
    decision: { label: "决策者", needs: ["decision", "impact", "limits"] }
  };
  var PRESETS = {
    background: {
      id: "background", label: "背景式标题", description: "材料和证据都在，但标题只是栏目名。",
      content: "SUPPORTED", slides: [
        { role: "problem", title: "项目背景", words: 54, visual: "context", claim: false, evidence: true, units: true, source: true, alt: true, secondEncoding: true },
        { role: "evidence", title: "实验结果", words: 48, visual: "chart", claim: false, evidence: true, units: true, source: true, alt: true, secondEncoding: true },
        { role: "boundary", title: "局限与下一步", words: 42, visual: "ledger", claim: true, evidence: true, units: true, source: true, alt: true, secondEncoding: true }
      ], portable: true, expected: "REVISE"
    },
    unsupported: {
      id: "unsupported", label: "主张缺证据", description: "标题给出 40% 提升，但相邻页面没有对应数据。",
      content: "UNSUPPORTED", slides: [
        { role: "problem", title: "教师需要更快找到可核验材料", words: 48, visual: "context", claim: true, evidence: true, units: true, source: true, alt: true, secondEncoding: true },
        { role: "claim", title: "Atlas 将检索效率提高 40%", words: 35, visual: "illustration", claim: true, evidence: false, units: false, source: false, alt: true, secondEncoding: true },
        { role: "action", title: "下周扩大试用", words: 31, visual: "steps", claim: true, evidence: true, units: true, source: true, alt: true, secondEncoding: true }
      ], portable: true, expected: "BLOCKED"
    },
    overloaded: {
      id: "overloaded", label: "过载页面", description: "证据支持主张，但一页塞进摘要、方法、表格与六条限制。",
      content: "SUPPORTED", slides: [
        { role: "problem", title: "教师检索时间主要耗在来源核验", words: 62, visual: "chart", claim: true, evidence: true, units: true, source: true, alt: true, secondEncoding: true },
        { role: "evidence", title: "固定任务中位时间从 12 分钟降至 8 分钟", words: 176, visual: "chart+table+paragraph", claim: true, evidence: true, units: true, source: true, alt: true, secondEncoding: true },
        { role: "boundary", title: "结果只覆盖 12 名参与者与固定任务", words: 102, visual: "ledger", claim: true, evidence: true, units: true, source: true, alt: true, secondEncoding: true }
      ], portable: true, expected: "REVISE"
    },
    provenance: {
      id: "provenance", label: "图表缺单位/来源", description: "页面看起来整洁，但纵轴与来源均缺失。",
      content: "UNVERIFIED", slides: [
        { role: "problem", title: "教师检索时间主要耗在来源核验", words: 45, visual: "context", claim: true, evidence: true, units: true, source: true, alt: true, secondEncoding: true },
        { role: "evidence", title: "Atlas 缩短了固定任务完成时间", words: 38, visual: "chart", claim: true, evidence: true, units: false, source: false, alt: false, secondEncoding: false },
        { role: "boundary", title: "结果只覆盖虚构的小型固定任务", words: 37, visual: "ledger", claim: true, evidence: true, units: true, source: true, alt: true, secondEncoding: true }
      ], portable: true, expected: "BLOCKED"
    },
    ready: {
      id: "ready", label: "完整故事板", description: "主张、证据、限制与交付检查都就位。",
      content: "SUPPORTED", slides: [
        { role: "problem", title: "来源核验占据固定检索任务的大部分时间", words: 42, visual: "annotated timeline", claim: true, evidence: true, units: true, source: true, alt: true, secondEncoding: true },
        { role: "evidence", title: "Atlas 将中位完成时间从 12 分钟降至 8 分钟", words: 46, visual: "dot plot", claim: true, evidence: true, units: true, source: true, alt: true, secondEncoding: true },
        { role: "boundary", title: "该结果只覆盖 12 名参与者和固定任务 T-12", words: 39, visual: "scope ledger", claim: true, evidence: true, units: true, source: true, alt: true, secondEncoding: true },
        { role: "action", title: "下一轮先扩大任务类型，再决定是否部署", words: 34, visual: "decision path", claim: true, evidence: true, units: true, source: true, alt: true, secondEncoding: true }
      ], portable: true, expected: "READY"
    }
  };

  var STYLE_TEXT = [
    ".ssb-lab{max-width:100%;min-width:0;color:var(--fg);}",
    ".ssb-lab [hidden]{display:none!important;}",
    ".ssb-lab .ssb-kicker,.ssb-lab .ssb-note{color:var(--fg-soft);font-size:13px;line-height:1.65;}",
    ".ssb-lab .ssb-presets,.ssb-lab .ssb-predictions,.ssb-lab .ssb-actions{display:flex;flex-wrap:wrap;gap:8px;}",
    ".ssb-lab button,.ssb-lab select,.ssb-lab input{min-height:44px;}",
    ".ssb-lab .ssb-presets button{flex:1 1 135px;}",
    ".ssb-lab .ssb-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:16px 0;}",
    ".ssb-lab .ssb-control{display:grid;gap:5px;min-width:0;}.ssb-lab .ssb-control label{color:var(--fg-soft);font-size:12.5px;font-weight:700;}",
    ".ssb-lab .ssb-control output{color:var(--accent);font-variant-numeric:tabular-nums;}",
    ".ssb-lab .ssb-predict{padding:12px 14px;border-left:3px solid var(--cl-gold);background:var(--bg);}",
    ".ssb-lab .ssb-predict strong{display:block;margin-bottom:8px;font-size:13px;}.ssb-lab .ssb-predictions button{flex:1 1 110px;}",
    ".ssb-lab .ssb-feedback{min-height:1.7em;margin:9px 0 0;font-size:13px;font-weight:700;line-height:1.7;}",
    ".ssb-lab .ssb-status{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:14px 0;}",
    ".ssb-lab .ssb-stat{min-width:0;padding:10px;border-top:2px solid var(--border);background:var(--bg);}.ssb-lab .ssb-stat span{display:block;color:var(--fg-soft);font-size:11.5px;}.ssb-lab .ssb-stat strong{display:block;margin-top:3px;font-size:16px;overflow-wrap:anywhere;}",
    ".ssb-lab .ssb-pass{color:var(--cl-green);}.ssb-lab .ssb-warn{color:var(--cl-gold);}.ssb-lab .ssb-block{color:var(--cl-red);}",
    ".ssb-lab .ssb-gates{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:14px 0;}",
    ".ssb-lab .ssb-gate{padding:10px;background:var(--bg);border-top:3px solid var(--border);}.ssb-lab .ssb-gate strong{display:block;font-size:13px;}.ssb-lab .ssb-gate span{display:block;margin-top:4px;color:var(--fg-soft);font-size:12px;line-height:1.5;}.ssb-lab .ssb-gate[data-status=PASS]{border-color:var(--cl-green);}.ssb-lab .ssb-gate[data-status=WARN]{border-color:var(--cl-gold);}.ssb-lab .ssb-gate[data-status=BLOCK]{border-color:var(--cl-red);}",
    ".ssb-lab .ssb-arc{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin:15px 0;}",
    ".ssb-lab .ssb-slide{position:relative;min-width:0;padding:11px 10px 10px 14px;background:var(--bg);border-left:4px solid var(--accent);}.ssb-lab .ssb-slide small{display:block;color:var(--fg-soft);}.ssb-lab .ssb-slide strong{display:block;margin:4px 0 6px;font-size:13px;line-height:1.45;}.ssb-lab .ssb-slide span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.5;}",
    ".ssb-lab .ssb-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;}.ssb-lab table{width:100%;min-width:760px;border-collapse:collapse;font-size:12px;}.ssb-lab th,.ssb-lab td{padding:7px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;}.ssb-lab th{color:var(--fg-soft);font-size:11px;}",
    ".ssb-lab button:focus-visible,.ssb-lab select:focus-visible,.ssb-lab input:focus-visible{outline:3px solid var(--cl-focus);outline-offset:2px;}",
    "@media(max-width:800px){.ssb-lab .ssb-gates{grid-template-columns:repeat(2,minmax(0,1fr));}.ssb-lab .ssb-controls{grid-template-columns:minmax(0,1fr);}.ssb-lab .ssb-status{grid-template-columns:minmax(0,1fr);}}",
    "@media(max-width:460px){.ssb-lab .ssb-gates{grid-template-columns:minmax(0,1fr);}}"
  ].join("\n");

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function evaluate(config) {
    var preset = config.preset;
    var slides = preset.slides;
    var secondsPerSlide = config.duration * 60 / Math.max(1, slides.length);
    var missingClaims = slides.filter(function (s) { return s.claim && !s.evidence; });
    var vagueTitles = slides.filter(function (s) { return !s.claim && (s.role === "problem" || s.role === "evidence" || s.role === "claim"); });
    var readableWordBudget = Math.min(100, Math.max(65, secondsPerSlide * 0.75));
    var overloaded = slides.filter(function (s) { return s.words > readableWordBudget; });
    var chartIssues = slides.filter(function (s) { return s.visual.indexOf("chart") !== -1 && (!s.units || !s.source); });
    var accessibility = slides.filter(function (s) { return !s.alt || !s.secondEncoding; });
    var pageBudget = slides.length > config.pageBudget;
    var fitWarning = (config.audience === "decision" && !slides.some(function (s) { return s.role === "action"; })) || (config.audience !== "decision" && !slides.some(function (s) { return s.role === "boundary"; }));
    var gates = [
      { id: "message", label: "受众 / 讯息", status: vagueTitles.length || fitWarning ? "WARN" : "PASS", detail: vagueTitles.length ? vagueTitles.length + " 页标题未表达可复述判断" : fitWarning ? "故事弧缺少该受众需要的角色" : "标题与故事弧能服务当前受众" },
      { id: "evidence", label: "主张 / 证据", status: missingClaims.length ? "BLOCK" : "PASS", detail: missingClaims.length ? missingClaims.length + " 个核心主张没有相邻证据" : "核心主张都有直接证据或边界" },
      { id: "visual", label: "视觉 / 可读性", status: overloaded.length || pageBudget ? "WARN" : "PASS", detail: overloaded.length ? overloaded.length + " 页超过透明文字预算" : pageBudget ? "页数超过当前预算" : "密度与时间预算相容" },
      { id: "delivery", label: "溯源 / 可访问性", status: chartIssues.length ? "BLOCK" : accessibility.length || !preset.portable ? "WARN" : "PASS", detail: chartIssues.length ? chartIssues.length + " 张图缺单位或来源" : accessibility.length ? accessibility.length + " 页缺 alt text 或第二编码" : !preset.portable ? "字体或媒体缺可移植后备" : "来源、可访问性与文件后备通过" }
    ];
    var hasBlock = gates.some(function (g) { return g.status === "BLOCK"; });
    var hasWarn = gates.some(function (g) { return g.status === "WARN"; });
    var content = missingClaims.length ? "UNSUPPORTED" : chartIssues.length ? "UNVERIFIED" : preset.content;
    var readiness = hasBlock ? "BLOCKED" : hasWarn ? "REVISE" : "READY";
    return { content: content, readiness: readiness, gates: gates, secondsPerSlide: secondsPerSlide, pageBudget: pageBudget, slides: slides, audience: AUDIENCES[config.audience] };
  }

  function element(doc, tag, className, text) { var node = doc.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; }
  function installStyles(doc) { if (doc.getElementById(STYLE_ID)) return; var style = element(doc, "style"); style.id = STYLE_ID; style.textContent = STYLE_TEXT; doc.head.appendChild(style); }
  function statusClass(value) { return value === "READY" || value === "SUPPORTED" || value === "PASS" ? "ssb-pass" : value === "REVISE" || value === "WARN" ? "ssb-warn" : value === "BLOCKED" || value === "UNSUPPORTED" || value === "UNVERIFIED" || value === "BLOCK" ? "ssb-block" : ""; }

  function mount(root, api) {
    var doc = root.ownerDocument; installStyles(doc);
    var state = { preset: clone(PRESETS.background), audience: "mixed", duration: 7, pageBudget: 6, prediction: null, revealed: false };
    var shell = element(doc, "div", "ssb-lab"); shell.appendChild(element(doc, "p", "ssb-kicker", "全部材料与项目名均为虚构。本实验只执行公开的信息设计规则，不输出“审美分数”。"));
    var presetRow = element(doc, "div", "ssb-presets"), presetButtons = [];
    Object.keys(PRESETS).forEach(function (key) { var preset = PRESETS[key], button = element(doc, "button", "", preset.label); button.type = "button"; button.addEventListener("click", function () { state.preset = clone(preset); state.prediction = null; state.revealed = false; render(); }); presetButtons.push({ id: key, node: button }); presetRow.appendChild(button); }); shell.appendChild(presetRow);
    var description = element(doc, "p", "ssb-note"); shell.appendChild(description);
    var controls = element(doc, "div", "ssb-controls");
    var audienceBox = element(doc, "div", "ssb-control"), audienceLabel = element(doc, "label", "", "目标听众"), select = element(doc, "select"); select.setAttribute("aria-label", "目标听众"); Object.keys(AUDIENCES).forEach(function (key) { var option = element(doc, "option", "", AUDIENCES[key].label); option.value = key; select.appendChild(option); }); select.addEventListener("change", function () { state.audience = select.value; state.prediction = null; state.revealed = false; render(); }); audienceBox.appendChild(audienceLabel); audienceBox.appendChild(select); controls.appendChild(audienceBox);
    function rangeControl(key, labelText, min, max, step, unit) { var box = element(doc, "div", "ssb-control"), label = element(doc, "label", "", labelText + "："), output = element(doc, "output"); label.appendChild(output); var input = element(doc, "input"); input.type = "range"; input.min = min; input.max = max; input.step = step; input.setAttribute("aria-label", labelText); input.addEventListener("input", function () { state[key] = Number(input.value); state.prediction = null; state.revealed = false; render(); }); box.appendChild(label); box.appendChild(input); controls.appendChild(box); return { input: input, output: output, unit: unit }; }
    var duration = rangeControl("duration", "时长", 3, 20, 1, " 分钟"), budget = rangeControl("pageBudget", "页数预算", 3, 12, 1, " 页"); shell.appendChild(controls);
    var predict = element(doc, "div", "ssb-predict"); predict.appendChild(element(doc, "strong", "", "先预测最终交付状态")); var predictions = element(doc, "div", "ssb-predictions"), predictionButtons = [];
    ["READY", "REVISE", "BLOCKED"].forEach(function (value) { var button = element(doc, "button", "", value); button.type = "button"; button.addEventListener("click", function () { state.prediction = value; renderPrediction(); }); predictions.appendChild(button); predictionButtons.push({ value: value, node: button }); }); predict.appendChild(predictions);
    var actions = element(doc, "div", "ssb-actions"), check = element(doc, "button", "cl-primary", "运行四关审计"), reset = element(doc, "button", "", "重置"), feedback = element(doc, "p", "ssb-feedback", "先作出 READY / REVISE / BLOCKED 预测。 "); check.type = reset.type = "button";
    check.addEventListener("click", function () { var result = evaluate(state); if (!state.prediction) { feedback.textContent = "请先选择预测。"; feedback.className = "ssb-feedback ssb-block"; return; } var good = state.prediction === result.readiness; state.revealed = true; render(); feedback.textContent = (good ? "预测命中。" : "预测与审计不同。") + " 内容支持：" + result.content + "；交付状态：" + result.readiness + "。"; feedback.className = "ssb-feedback " + (good ? "ssb-pass" : "ssb-warn"); if (api && api.announce) api.announce(root, feedback.textContent); });
    reset.addEventListener("click", function () { state = { preset: clone(PRESETS.background), audience: "mixed", duration: 7, pageBudget: 6, prediction: null, revealed: false }; render(); }); actions.appendChild(check); actions.appendChild(reset); predict.appendChild(actions); predict.appendChild(feedback); shell.appendChild(predict);
    var status = element(doc, "div", "ssb-status"), gates = element(doc, "div", "ssb-gates"), arc = element(doc, "div", "ssb-arc"), tableWrap = element(doc, "div", "ssb-table-wrap"), table = element(doc, "table"); tableWrap.appendChild(table); shell.appendChild(status); shell.appendChild(gates); shell.appendChild(arc); shell.appendChild(tableWrap); shell.appendChild(element(doc, "p", "ssb-note", "READY 仍不等于“报告一定成功”。它只表示这份故事板通过当前透明规则；真人彩排、领域判断和目标设备检查仍不可省略。")); root.replaceChildren(shell);
    function renderPrediction() { predictionButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", state.prediction === item.value ? "true" : "false"); }); if (!state.revealed) { feedback.textContent = state.prediction ? "预测已记录，运行四关审计查看原因。" : "先作出 READY / REVISE / BLOCKED 预测。"; feedback.className = "ssb-feedback"; } }
    function stat(label, value) { var box = element(doc, "div", "ssb-stat"); box.appendChild(element(doc, "span", "", label)); box.appendChild(element(doc, "strong", statusClass(value), value)); return box; }
    function render() {
      select.value = state.audience; duration.input.value = String(state.duration); duration.output.textContent = state.duration + duration.unit; budget.input.value = String(state.pageBudget); budget.output.textContent = state.pageBudget + budget.unit; description.textContent = state.preset.description; presetButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", state.preset.id === item.id ? "true" : "false"); }); renderPrediction();
      var result = evaluate(state); status.replaceChildren(stat("内容支持", result.content), stat("交付状态", result.readiness), stat("平均口头预算", Math.round(result.secondsPerSlide) + " 秒/页"));
      gates.replaceChildren.apply(gates, result.gates.map(function (gate) { var box = element(doc, "div", "ssb-gate"); box.setAttribute("data-status", gate.status); box.appendChild(element(doc, "strong", statusClass(gate.status), gate.status + " · " + gate.label)); box.appendChild(element(doc, "span", "", gate.detail)); return box; }));
      arc.replaceChildren.apply(arc, result.slides.map(function (slide, index) { var box = element(doc, "div", "ssb-slide"); box.appendChild(element(doc, "small", "", "第 " + (index + 1) + " 页 · " + slide.role)); box.appendChild(element(doc, "strong", "", slide.title)); box.appendChild(element(doc, "span", "", slide.words + " 字 · " + slide.visual)); return box; }));
      var readableWordBudget = Math.min(100, Math.max(65, result.secondsPerSlide * 0.75));
      var rows = result.slides.map(function (slide, index) { var advice = []; if (!slide.claim && ["problem", "claim", "evidence"].indexOf(slide.role) !== -1) advice.push("把栏目名改为可复述判断"); if (!slide.evidence && slide.claim) advice.push("补直接证据或收窄主张"); if (slide.visual.indexOf("chart") !== -1 && !slide.units) advice.push("补轴与单位"); if (!slide.source) advice.push("补来源定位"); if (!slide.alt) advice.push("补 alt text"); if (!slide.secondEncoding) advice.push("给颜色增加标签/线型/形状"); if (slide.words > readableWordBudget) advice.push("拆页或移入讲者备注"); return "<tr><td>" + (index + 1) + "</td><td>" + slide.role + "</td><td>" + slide.title + "</td><td>" + slide.words + "</td><td>" + slide.visual + "</td><td>" + (advice.length ? advice.join("；") : "保留，进入真人彩排") + "</td></tr>"; }).join("");
      table.innerHTML = "<caption>逐页可追溯修改账本</caption><thead><tr><th>页</th><th>角色</th><th>标题</th><th>文字量</th><th>视觉类型</th><th>修改建议</th></tr></thead><tbody>" + rows + "</tbody>";
      status.hidden = !state.revealed;
      gates.hidden = !state.revealed;
      tableWrap.hidden = !state.revealed;
    }
    render();
  }

  function selfTest() {
    var checks = 0; function assert(condition, message) { checks += 1; if (!condition) throw new Error(message); }
    Object.keys(PRESETS).forEach(function (key) { var result = evaluate({ preset: PRESETS[key], audience: "mixed", duration: 7, pageBudget: 6 }); assert(result.readiness === PRESETS[key].expected, key + " expected readiness"); assert(result.gates.length === 4, key + " four gates"); assert(result.slides.length >= 3, key + " story arc"); });
    var unsupported = evaluate({ preset: PRESETS.unsupported, audience: "mixed", duration: 7, pageBudget: 6 }); assert(unsupported.content === "UNSUPPORTED", "unsupported content status"); assert(unsupported.gates[1].status === "BLOCK", "claim evidence block");
    var provenance = evaluate({ preset: PRESETS.provenance, audience: "mixed", duration: 7, pageBudget: 6 }); assert(provenance.content === "UNVERIFIED", "provenance content status"); assert(provenance.gates[3].status === "BLOCK", "provenance block");
    var ready = evaluate({ preset: PRESETS.ready, audience: "mixed", duration: 7, pageBudget: 6 }); assert(ready.readiness === "READY" && ready.content === "SUPPORTED", "clean ready state");
    var short = evaluate({ preset: PRESETS.ready, audience: "mixed", duration: 3, pageBudget: 3 }); assert(short.readiness === "REVISE", "budget pressure revises");
    var decision = evaluate({ preset: PRESETS.background, audience: "decision", duration: 7, pageBudget: 6 }); assert(decision.gates[0].status === "WARN", "decision audience needs action");
    assert(Object.keys(PRESETS).length === 5, "five presets"); return { checks: checks, presets: Object.keys(PRESETS).length };
  }

  var exported = { AUDIENCES: AUDIENCES, PRESETS: PRESETS, evaluate: evaluate, selfTest: selfTest };
  if (typeof module !== "undefined" && module.exports) module.exports = exported;
  if (host && host.CourseLearning && typeof host.CourseLearning.register === "function") host.CourseLearning.register("slide-storyboard", mount);
  if (typeof module !== "undefined" && module.exports && typeof require !== "undefined" && require.main === module) { try { var result = selfTest(); console.log("slide-storyboard self-test: PASS (" + result.checks + " checks, " + result.presets + " presets)"); } catch (error) { console.error("slide-storyboard self-test: FAIL\n" + error.stack); process.exitCode = 1; } }
})(typeof window !== "undefined" ? window : null);
