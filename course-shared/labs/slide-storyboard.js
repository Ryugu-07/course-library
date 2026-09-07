(function (host) {
  "use strict";

  var STYLE_ID = "slide-storyboard-lab-styles";
  var AUDIENCES = {
    peers: { label: "本领域同行", needs: ["method", "uncertainty", "limits"] },
    mixed: { label: "跨专业研究生", needs: ["context", "comparison", "limits"] },
    decision: { label: "决策者", needs: ["decision", "impact", "limits"] }
  };
  // Explicitly invented paired observations, not measurements of any real product.
  var DEMO_DATA = [
    { id: "P01", before: 8, after: 6 }, { id: "P02", before: 9, after: 7 },
    { id: "P03", before: 10, after: 7 }, { id: "P04", before: 10, after: 8 },
    { id: "P05", before: 11, after: 8 }, { id: "P06", before: 12, after: 8 },
    { id: "P07", before: 12, after: 8 }, { id: "P08", before: 13, after: 9 },
    { id: "P09", before: 14, after: 10 }, { id: "P10", before: 15, after: 10 },
    { id: "P11", before: 16, after: 11 }, { id: "P12", before: 18, after: 12 }
  ];
  var DEMO_SOURCE = "本页 DEMO_DATA · 12 组作者构造数据 · 分钟 · 固定任务 T-12";
  var OPEN_CLOSE_SECONDS = 90;
  var CONTENT_PAGE_SECONDS = 50;
  function median(values) {
    var sorted = values.slice().sort(function (a, b) { return a - b; });
    var middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  }
  function demoSummary() {
    var before = median(DEMO_DATA.map(function (row) { return row.before; }));
    var after = median(DEMO_DATA.map(function (row) { return row.after; }));
    return { before: before, after: after, relativeDecrease: (before - after) / before };
  }
  function isDataVisual(slide) {
    return slide.dataVisual === true || /chart|plot|table|histogram|timeline|图|表/i.test(slide.visual);
  }
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
        { role: "problem", title: "本示例比较同一批虚构参与者的两次任务时间", words: 62, visual: "chart", claim: true, evidence: true, units: true, source: true, alt: true, secondEncoding: true },
        { role: "evidence", title: "虚构样本两次中位完成时间为 12 与 8 分钟", words: 176, visual: "chart+table+paragraph", claim: true, evidence: true, units: true, source: true, alt: true, secondEncoding: true },
        { role: "boundary", title: "结果只覆盖 12 名参与者与固定任务", words: 102, visual: "ledger", claim: true, evidence: true, units: true, source: true, alt: true, secondEncoding: true }
      ], portable: true, expected: "REVISE"
    },
    provenance: {
      id: "provenance", label: "图表缺单位/来源", description: "页面看起来整洁，但纵轴与来源均缺失。",
      content: "UNVERIFIED", slides: [
        { role: "problem", title: "本示例比较同一批虚构参与者的两次任务时间", words: 45, visual: "context", claim: true, evidence: true, units: true, source: true, alt: true, secondEncoding: true },
        { role: "evidence", title: "两次任务的图示数值不同", words: 38, visual: "chart", claim: true, evidence: true, units: false, source: false, alt: false, secondEncoding: false },
        { role: "boundary", title: "结果只覆盖虚构的小型固定任务", words: 37, visual: "ledger", claim: true, evidence: true, units: true, source: true, alt: true, secondEncoding: true }
      ], portable: true, expected: "BLOCKED"
    },
    ready: {
      id: "ready", label: "完整故事板", description: "主张、证据、限制与交付检查都就位。",
      content: "SUPPORTED", slides: [
        { role: "problem", title: "同一批虚构参与者各有两次任务时间", words: 42, visual: "annotated timeline", claim: true, evidence: true, units: true, source: true, alt: true, secondEncoding: true },
        { role: "evidence", title: "虚构样本两次中位完成时间为 12 与 8 分钟", words: 46, visual: "dot plot", claim: true, evidence: true, units: true, source: true, alt: true, secondEncoding: true },
        { role: "boundary", title: "12 组成对数据仅用于教学，不能证明产品效果", words: 39, visual: "scope ledger", claim: true, evidence: true, units: true, source: true, alt: true, secondEncoding: true },
        { role: "action", title: "真实评估需另行设计对照与采样", words: 34, visual: "decision path", claim: true, evidence: true, units: true, source: true, alt: true, secondEncoding: true }
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
    ".ssb-lab .ssb-comparison{margin-top:24px}.ssb-lab .ssb-preview{padding:22px;margin:18px 0;border:1px solid var(--border);background:var(--bg);color:var(--fg);}.ssb-lab .ssb-preview h5{font-size:22px;line-height:1.45;margin:8px 0 14px;letter-spacing:0}.ssb-lab .ssb-version{font-size:13px;color:var(--fg-soft);margin:0}.ssb-lab .ssb-dense{font-size:14px;line-height:1.8}.ssb-lab .ssb-preview svg{display:block;width:100%;height:auto;max-width:460px;margin:12px auto}.ssb-lab .ssb-preview .ssb-chart-compact{max-width:420px}.ssb-lab .ssb-source{font-size:12px;line-height:1.6;color:var(--fg-soft)}.ssb-lab .ssb-caption,.ssb-lab .ssb-limit{font-size:15px;line-height:1.7}.ssb-lab .ssb-limit{border-left:3px solid var(--accent);padding-left:12px}.ssb-lab summary{cursor:pointer;padding:12px 0;font-weight:700;line-height:1.5}.ssb-lab .ssb-data table{min-width:430px}.ssb-lab .ssb-notes p,.ssb-lab .ssb-data p{font-size:14px;line-height:1.7}",
    "html[data-theme=dark] .ssb-lab .ssb-preview{--ssb-before-color:#79b7e4;--ssb-after-color:#f1b879}",
    "@media(max-width:460px){.ssb-lab .ssb-preview{padding:12px}.ssb-lab .ssb-preview h5{font-size:19px}}",
    ".ssb-lab button:focus-visible,.ssb-lab select:focus-visible,.ssb-lab input:focus-visible{outline:3px solid var(--cl-focus);outline-offset:2px;}",
    "@media(max-width:800px){.ssb-lab .ssb-gates{grid-template-columns:repeat(2,minmax(0,1fr));}.ssb-lab .ssb-controls{grid-template-columns:minmax(0,1fr);}.ssb-lab .ssb-status{grid-template-columns:minmax(0,1fr);}}",
    "@media(max-width:460px){.ssb-lab .ssb-gates{grid-template-columns:minmax(0,1fr);}}"
  ].join("\n");

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function evaluate(config) {
    var preset = config.preset;
    var slides = preset.slides;
    var availableSeconds = Math.max(0, config.duration * 60 - OPEN_CLOSE_SECONDS);
    var secondsPerSlide = availableSeconds / Math.max(1, slides.length);
    var requiredSeconds = OPEN_CLOSE_SECONDS + CONTENT_PAGE_SECONDS * slides.length;
    var timePressure = config.duration * 60 < requiredSeconds;
    var missingClaims = slides.filter(function (s) { return s.claim && !s.evidence; });
    var vagueTitles = slides.filter(function (s) { return !s.claim && (s.role === "problem" || s.role === "evidence" || s.role === "claim"); });
    var readableWordBudget = Math.min(100, Math.max(65, secondsPerSlide * 0.75));
    var overloaded = slides.filter(function (s) { return s.words > readableWordBudget; });
    var chartIssues = slides.filter(function (s) { return isDataVisual(s) && (!s.units || !s.source); });
    var accessibility = slides.filter(function (s) { return !s.alt || !s.secondEncoding; });
    var pageBudget = slides.length > config.pageBudget;
    var fitWarning = (config.audience === "decision" && !slides.some(function (s) { return s.role === "action"; })) || (config.audience !== "decision" && !slides.some(function (s) { return s.role === "boundary"; }));
    var gates = [
      { id: "message", label: "受众 / 讯息", status: vagueTitles.length || fitWarning ? "WARN" : "PASS", detail: vagueTitles.length ? vagueTitles.length + " 页标题未表达可复述判断" : fitWarning ? "故事弧缺少该受众需要的角色" : "标题与故事弧能服务当前受众" },
      { id: "evidence", label: "主张 / 证据", status: missingClaims.length ? "BLOCK" : "PASS", detail: missingClaims.length ? missingClaims.length + " 个核心主张没有相邻证据" : "核心主张都有直接证据或边界" },
      { id: "visual", label: "视觉 / 可读性", status: overloaded.length || pageBudget || timePressure ? "WARN" : "PASS", detail: timePressure ? "开收场 90 秒 + 内容页各 50 秒，需要 " + requiredSeconds + " 秒" : overloaded.length ? overloaded.length + " 页超过透明文字预算" : pageBudget ? "页数超过当前预算" : "密度与时间预算相容" },
      { id: "delivery", label: "溯源 / 可访问性", status: chartIssues.length ? "BLOCK" : accessibility.length || !preset.portable ? "WARN" : "PASS", detail: chartIssues.length ? chartIssues.length + " 张图缺单位或来源" : accessibility.length ? accessibility.length + " 页缺 alt text 或第二编码" : !preset.portable ? "字体或媒体缺可移植后备" : "预设声明的来源、可访问性与文件后备通过" }
    ];
    var hasBlock = gates.some(function (g) { return g.status === "BLOCK"; });
    var hasWarn = gates.some(function (g) { return g.status === "WARN"; });
    var content = missingClaims.length ? "UNSUPPORTED" : chartIssues.length ? "UNVERIFIED" : preset.content;
    var readiness = hasBlock ? "BLOCKED" : hasWarn ? "REVISE" : "READY";
    return { content: content, readiness: readiness, gates: gates, secondsPerSlide: secondsPerSlide, availableSeconds: availableSeconds, requiredSeconds: requiredSeconds, timePressure: timePressure, pageBudget: pageBudget, slides: slides, audience: AUDIENCES[config.audience] };
  }

  function element(doc, tag, className, text) { var node = doc.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; }
  function installStyles(doc) { if (doc.getElementById(STYLE_ID)) return; var style = element(doc, "style"); style.id = STYLE_ID; style.textContent = STYLE_TEXT; doc.head.appendChild(style); }
  function statusClass(value) { return value === "READY" || value === "SUPPORTED" || value === "PASS" ? "ssb-pass" : value === "REVISE" || value === "WARN" ? "ssb-warn" : value === "BLOCKED" || value === "UNSUPPORTED" || value === "UNVERIFIED" || value === "BLOCK" ? "ssb-block" : ""; }

  function pairedChart(doc, compact) {
    var ns = "http://www.w3.org/2000/svg";
    var svg = doc.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 420 500");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "虚构成对任务时间。圆点表示第一次，方块表示第二次；每条横线连接同一编号，两次中位数为12和8分钟。完整数值见下方数据表。");
    function draw(tag, attrs, text) {
      var node = doc.createElementNS(ns, tag);
      Object.keys(attrs).forEach(function (key) { node.setAttribute(key, attrs[key]); });
      if (text !== undefined) node.textContent = text;
      svg.appendChild(node); return node;
    }
    function x(value) { return 70 + value * 16; }
    draw("text", { x: 70, y: 27, "font-size": 20, fill: "currentColor" }, "完成时间（分钟）");
    for (var tick = 0; tick <= 20; tick += 4) {
      draw("line", { x1: x(tick), x2: x(tick), y1: 53, y2: 408, stroke: "currentColor", opacity: .15 });
      draw("text", { x: x(tick), y: 431, "text-anchor": "middle", "font-size": 18, fill: "currentColor" }, String(tick));
    }
    DEMO_DATA.forEach(function (row, index) {
      var y = 65 + index * 30;
      draw("text", { x: 58, y: y + 6, "text-anchor": "end", "font-size": 18, fill: "currentColor" }, row.id);
      draw("line", { x1: x(row.before), x2: x(row.after), y1: y, y2: y, stroke: "currentColor", opacity: .5, "stroke-width": 2 });
      draw("circle", { cx: x(row.before), cy: y, r: 6, fill: "var(--ssb-before-color, #24699a)" });
      draw("rect", { x: x(row.after) - 6, y: y - 6, width: 12, height: 12, fill: "var(--ssb-after-color, #b35a22)" });
    });
    draw("circle", { cx: 79, cy: 454, r: 6, fill: "var(--ssb-before-color, #24699a)" });
    draw("text", { x: 93, y: 460, "font-size": 18, fill: "currentColor" }, "第一次");
    draw("rect", { x: 202, y: 448, width: 12, height: 12, fill: "var(--ssb-after-color, #b35a22)" });
    draw("text", { x: 222, y: 460, "font-size": 18, fill: "currentColor" }, "第二次");
    draw("text", { x: 70, y: 489, "font-size": 18, fill: "currentColor" }, "同一编号成对连接 · 虚构教学数据");
    svg.classList.add(compact ? "ssb-chart-compact" : "ssb-chart");
    return svg;
  }
  function expressionPreview(doc) {
    var section = element(doc, "section", "ssb-comparison");
    section.appendChild(element(doc, "h4", "", "同一份材料，修改前与修改后"));
    section.appendChild(element(doc, "p", "ssb-note", "独立的表达示范：以下两版都使用完整来源已知的同一组虚构数据。它们不修复上方预设的缺证据或缺来源问题，也不改变审计状态。"));
    var summary = demoSummary();
    var before = element(doc, "article", "ssb-preview ssb-before");
    before.appendChild(element(doc, "p", "ssb-version", "修改前 · 信息都在，阅读入口分散"));
    before.appendChild(element(doc, "h5", "", "实验结果与项目背景"));
    before.appendChild(element(doc, "p", "ssb-dense", "本示例围绕虚构项目 Atlas，讨论固定任务 T-12 的两次完成时间。编号 P01 至 P12 各有两个数值；第一次为 8、9、10、10、11、12、12、13、14、15、16、18 分钟；第二次为 6、7、7、8、8、8、8、9、10、10、11、12 分钟。两次中位数分别为 12 和 8 分钟，中位数之差为 4 分钟。数据为作者构造，没有真实招募、随机分组或观测，不能归因于产品，也不能外推到用户总体。"));
    before.appendChild(pairedChart(doc, true));
    before.appendChild(element(doc, "p", "ssb-source", "来源：" + DEMO_SOURCE));
    var after = element(doc, "article", "ssb-preview ssb-after");
    after.appendChild(element(doc, "p", "ssb-version", "修改后 · 判断句、证据、限定放在一起"));
    after.appendChild(element(doc, "h5", "", "虚构样本两次中位时间：" + summary.before + " → " + summary.after + " 分钟"));
    after.appendChild(element(doc, "p", "ssb-caption", "12 组成对记录；下面每一横行都连接同一编号。"));
    after.appendChild(pairedChart(doc, false));
    after.appendChild(element(doc, "p", "ssb-limit", "限定：这是作者构造的数据。两次中位数相差 4 分钟（相对第一次约 33.3%），不证明 Atlas 造成了变化；也不是每位参与者的降幅。"));
    after.appendChild(element(doc, "p", "ssb-source", "来源：" + DEMO_SOURCE));
    section.appendChild(before); section.appendChild(after);
    section.appendChild(element(doc, "p", "ssb-note", "改动说明：标题先交代可核对的数值；让成对图成为主体；编号与圆点/方块保留第二编码；完整方法移入备注，来源和限制留在页面。数字、配对关系和证据强度没有改变。"));
    var notes = element(doc, "details", "ssb-notes");
    notes.appendChild(element(doc, "summary", "", "查看讲者备注：页面省去的解释放在哪里？"));
    notes.appendChild(element(doc, "p", "", "T-12 只是虚构任务标签。先说明圆点和方块代表两次记录，再挑 P01 演示 8→6 的配对读法。12 与 8 是分别排序后第 6、7 个数的平均值。我们比较两次中位数，不把 33.3% 当作所有人的平均改善，更不把先后差异解释成产品因果效果。真实研究还需要明确抽样、对照、任务顺序与不确定性。"));
    section.appendChild(notes);
    var details = element(doc, "details", "ssb-data");
    details.appendChild(element(doc, "summary", "", "查看完整的 12 组成对虚构数据与中位数计算"));
    var wrap = element(doc, "div", "ssb-table-wrap"), table = element(doc, "table");
    table.innerHTML = "<caption>DEMO_DATA：作者构造，非真实参与者观测</caption><thead><tr><th scope='col'>编号</th><th scope='col'>第一次（分钟）</th><th scope='col'>第二次（分钟）</th><th scope='col'>第一次 − 第二次（分钟）</th></tr></thead><tbody>" + DEMO_DATA.map(function (row) { return "<tr><th scope='row'>" + row.id + "</th><td>" + row.before + "</td><td>" + row.after + "</td><td>" + (row.before - row.after) + "</td></tr>"; }).join("") + "</tbody>";
    wrap.appendChild(table); details.appendChild(wrap);
    details.appendChild(element(doc, "p", "", "12 个值分别排序：第一次中间两项为 12、12，中位数 12；第二次为 8、8，中位数 8。两次中位数的相对下降为 (12−8)/12≈33.3%。中位数之差一般不等于成对差值的中位数。"));
    section.appendChild(details);
    return section;
  }

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
    var preview = expressionPreview(doc);
    var status = element(doc, "div", "ssb-status"), gates = element(doc, "div", "ssb-gates"), arc = element(doc, "div", "ssb-arc"), tableWrap = element(doc, "div", "ssb-table-wrap"), table = element(doc, "table"); tableWrap.appendChild(table); shell.appendChild(status); shell.appendChild(gates); shell.appendChild(arc); shell.appendChild(tableWrap); shell.appendChild(preview); shell.appendChild(element(doc, "p", "ssb-note", "READY 仍不等于“报告一定成功”。它只表示这份故事板通过当前透明规则；真人彩排、领域判断和目标设备检查仍不可省略。")); root.replaceChildren(shell);
    function renderPrediction() { predictionButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", state.prediction === item.value ? "true" : "false"); }); if (!state.revealed) { feedback.textContent = state.prediction ? "预测已记录，运行四关审计查看原因。" : "先作出 READY / REVISE / BLOCKED 预测。"; feedback.className = "ssb-feedback"; } }
    function stat(label, value) { var box = element(doc, "div", "ssb-stat"); box.appendChild(element(doc, "span", "", label)); box.appendChild(element(doc, "strong", statusClass(value), value)); return box; }
    function render() {
      select.value = state.audience; duration.input.value = String(state.duration); duration.output.textContent = state.duration + duration.unit; budget.input.value = String(state.pageBudget); budget.output.textContent = state.pageBudget + budget.unit; description.textContent = state.preset.description; presetButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", state.preset.id === item.id ? "true" : "false"); }); renderPrediction();
      var result = evaluate(state); status.replaceChildren(stat("内容支持", result.content), stat("交付状态", result.readiness), stat("扣除开收场后的内容页预算", Math.round(result.secondsPerSlide) + " 秒/页"));
      gates.replaceChildren.apply(gates, result.gates.map(function (gate) { var box = element(doc, "div", "ssb-gate"); box.setAttribute("data-status", gate.status); box.appendChild(element(doc, "strong", statusClass(gate.status), gate.status + " · " + gate.label)); box.appendChild(element(doc, "span", "", gate.detail)); return box; }));
      arc.replaceChildren.apply(arc, result.slides.map(function (slide, index) { var box = element(doc, "div", "ssb-slide"); box.appendChild(element(doc, "small", "", "第 " + (index + 1) + " 页 · " + slide.role)); box.appendChild(element(doc, "strong", "", slide.title)); box.appendChild(element(doc, "span", "", slide.words + " 字 · " + slide.visual)); return box; }));
      var readableWordBudget = Math.min(100, Math.max(65, result.secondsPerSlide * 0.75));
      var rows = result.slides.map(function (slide, index) { var advice = []; if (!slide.claim && ["problem", "claim", "evidence"].indexOf(slide.role) !== -1) advice.push("把栏目名改为可复述判断"); if (!slide.evidence && slide.claim) advice.push("补直接证据或收窄主张"); if (isDataVisual(slide) && !slide.units) advice.push("补轴与单位"); if (!slide.source) advice.push("补来源定位"); if (!slide.alt) advice.push("补 alt text"); if (!slide.secondEncoding) advice.push("给颜色增加标签/线型/形状"); if (slide.words > readableWordBudget) advice.push("拆页或移入讲者备注"); return "<tr><td>" + (index + 1) + "</td><td>" + slide.role + "</td><td>" + slide.title + "</td><td>" + slide.words + "</td><td>" + slide.visual + "</td><td>" + (advice.length ? advice.join("；") : "保留，进入真人彩排") + "</td></tr>"; }).join("");
      table.innerHTML = "<caption>逐页可追溯修改账本</caption><thead><tr><th>页</th><th>角色</th><th>标题</th><th>文字量</th><th>视觉类型</th><th>修改建议</th></tr></thead><tbody>" + rows + "</tbody>";
      status.hidden = !state.revealed;
      gates.hidden = !state.revealed;
      tableWrap.hidden = !state.revealed;
      preview.hidden = !state.revealed;
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
    var timeOnly = evaluate({ preset: PRESETS.ready, audience: "mixed", duration: 3, pageBudget: 12 });
    assert(timeOnly.readiness === "REVISE" && timeOnly.timePressure, "short talk fails even with ample page budget");
    assert(timeOnly.availableSeconds === 90 && timeOnly.requiredSeconds === 290, "opening and closing reserve exactly ninety seconds");
    var exact = evaluate({ preset: PRESETS.ready, audience: "mixed", duration: 290 / 60, pageBudget: 4 });
    assert(!exact.timePressure && exact.readiness === "READY", "exact time threshold passes");
    ["dot plot", "data table", "chart", "annotated timeline"].forEach(function (kind) {
      ["units", "source"].forEach(function (field) {
        var broken = clone(PRESETS.ready); broken.slides[1].visual = kind; broken.slides[1][field] = false;
        assert(evaluate({ preset: broken, audience: "mixed", duration: 7, pageBudget: 6 }).content === "UNVERIFIED", kind + " missing " + field + " is unverified");
      });
    });
    var data = demoSummary();
    assert(DEMO_DATA.length === 12 && new Set(DEMO_DATA.map(function (row) { return row.id; })).size === 12, "twelve distinct paired records");
    assert(data.before === 12 && data.after === 8, "medians derived from complete paired data");
    assert(Math.abs(data.relativeDecrease - 1 / 3) < 1e-12, "relative median reduction is one third, not forty percent");
    var snapshot = JSON.stringify(PRESETS.provenance);
    demoSummary();
    assert(JSON.stringify(PRESETS.provenance) === snapshot && evaluate({ preset: PRESETS.provenance, audience: "mixed", duration: 20, pageBudget: 12 }).readiness === "BLOCKED", "known-source expression example never repairs missing provenance");
    assert(Object.keys(PRESETS).length === 5, "five presets"); return { checks: checks, presets: Object.keys(PRESETS).length };
  }

  var exported = { DEMO_DATA: DEMO_DATA, demoSummary: demoSummary, isDataVisual: isDataVisual, mount: mount, AUDIENCES: AUDIENCES, PRESETS: PRESETS, evaluate: evaluate, selfTest: selfTest };
  if (typeof module !== "undefined" && module.exports) module.exports = exported;
  if (host && host.CourseLearning && typeof host.CourseLearning.register === "function") host.CourseLearning.register("slide-storyboard", mount);
  if (typeof module !== "undefined" && module.exports && typeof require !== "undefined" && require.main === module) { try { var result = selfTest(); console.log("slide-storyboard self-test: PASS (" + result.checks + " checks, " + result.presets + " presets)"); } catch (error) { console.error("slide-storyboard self-test: FAIL\n" + error.stack); process.exitCode = 1; } }
})(typeof window !== "undefined" ? window : null);
