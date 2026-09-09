(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("radiative-transfer", exported.mount);
  }
  if (typeof module === "object" && typeof require === "function" && require.main === module && process.argv.indexOf("--self-test") !== -1) {
    try {
      var report = exported.selfTest();
      process.stdout.write("radiative-transfer self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)\n");
    } catch (error) {
      process.stderr.write("radiative-transfer self-test: FAIL\n" + error.stack + "\n");
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-radiative-transfer-styles";
  var EPS = 1e-10;
  var INSTANCE = 0;

  var PRESETS = [
    { id: "thin-lte", label: "薄纯吸收 LTE：两项可比", Iin: 0.25, tau: 0.25, sourceModel: "LTE", B: 1.4, J: 0.25, epsilon: 1, bins: 6 },
    { id: "thick-lte", label: "厚纯吸收 LTE：趋近源函数", Iin: 0.05, tau: 5, sourceModel: "LTE", B: 1, J: 0.25, epsilon: 1, bins: 8 },
    { id: "matched-boundary", label: "匹配边界：有限 τ 也相等", Iin: 0.8, tau: 1.1, sourceModel: "LTE", B: 0.8, J: 0.8, epsilon: 1, bins: 6 },
    { id: "scattering", label: "散射：S 不自动等于 B", Iin: 0.1, tau: 1.5, sourceModel: "scattering", B: 1, J: 0.25, epsilon: 0.15, bins: 8 }
  ];

  var STYLE_TEXT = [
    "html[data-theme=dark] .rt-lab{--rt-blue:#90baff;--rt-red:#ffab95;--rt-gold:#e2b458;--rt-green:#8edda0}html[data-theme=dark] .rt-lab button[aria-pressed=true],html[data-theme=dark] .rt-lab button.rt-primary{color:#171b20}",
    ".rt-lab{--rt-blue:#315f9d;--rt-gold:var(--cl-gold,#9b6a12);--rt-green:var(--cl-green,#39734d);--rt-red:#b64335;max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere;}",
    ".rt-lab *,.rt-lab *::before,.rt-lab *::after{box-sizing:border-box}.rt-lab [hidden]{display:none!important}.rt-lab h3,.rt-lab h4{margin:0;color:var(--fg);letter-spacing:0}.rt-lab h3{font-size:1.18rem}.rt-lab h4{font-size:1rem}.rt-lab p{margin:.65rem 0}.rt-note,.rt-feedback{color:var(--fg-soft);font-size:13px;line-height:1.7}.rt-lab button,.rt-lab select,.rt-lab input{font:inherit}.rt-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.rt-lab button:hover{border-color:var(--rt-blue)}.rt-lab button[aria-pressed=true],.rt-lab button.rt-primary{border-color:var(--rt-blue);background:var(--rt-blue);color:#fff;font-weight:750}.rt-lab [tabindex]:focus-visible,.rt-lab button:focus-visible,.rt-lab select:focus-visible,.rt-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.rt-lab select{width:100%;min-height:44px;padding:8px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg)}.rt-control label{display:block;color:var(--fg-soft);font-size:13px;margin-bottom:4px}.rt-control output{color:var(--fg);font-weight:700}.rt-controls{display:grid;grid-template-columns:minmax(220px,1fr) repeat(2,minmax(150px,.65fr)) auto;gap:10px;align-items:end;margin:12px 0}.rt-control input{display:block;width:100%;accent-color:var(--rt-blue)}.rt-control input[type=range]{min-height:44px}.rt-gate{margin:14px 0;padding:12px 14px;border-left:3px solid var(--rt-gold);background:var(--bg)}.rt-gate fieldset{min-width:0;margin:0 0 11px;padding:0;border:0}.rt-gate fieldset:last-child{margin-bottom:0}.rt-gate legend{margin-bottom:7px;font-weight:700;line-height:1.5}.rt-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.rt-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.rt-actions>*{flex:1 1 180px}.rt-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.rt-warn{color:var(--rt-red)}.rt-pass{color:var(--rt-green)}.rt-result{margin-top:14px}.rt-layout{display:grid;grid-template-columns:minmax(0,1fr);gap:14px;align-items:start}.rt-frame{border:1px solid var(--border);background:var(--bg);padding:6px;min-width:0;overflow-x:auto}.rt-svg{display:block;width:100%;min-width:700px;height:auto}.rt-svg text{font-family:inherit;fill:var(--fg-soft,#6f6a60);font-size:11px}.rt-svg .rt-axis{stroke:var(--border);stroke-width:1}.rt-svg .rt-grid{stroke:var(--border);stroke-width:1;stroke-dasharray:3 4}.rt-svg .rt-curve{fill:none;stroke:var(--rt-blue);stroke-width:3}.rt-svg .rt-source{stroke:var(--rt-gold);stroke-width:2;stroke-dasharray:6 4}.rt-svg .rt-input{fill:var(--rt-green)}.rt-svg .rt-output{fill:var(--rt-red)}.rt-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0 0 10px}.rt-metric{min-width:0;border-top:2px solid var(--rt-blue);padding:7px 8px;background:var(--bg)}.rt-metric span{display:block;color:var(--fg-soft);font-size:12px}.rt-metric strong{display:block;font-size:1.05rem;overflow-wrap:anywhere}.rt-table-wrap{overflow-x:auto;max-width:100%;margin-top:12px}.rt-table{border-collapse:collapse;width:100%;min-width:760px;font-size:12px}.rt-table caption{text-align:left;color:var(--fg-soft);padding:5px 0}.rt-table th,.rt-table td{border:1px solid var(--border);padding:6px 7px;text-align:left;vertical-align:top}.rt-table th{background:var(--block-bg);color:var(--fg)}.rt-certificate{border-left:3px solid var(--rt-green);padding-left:10px;font-size:13px}.rt-certificate.rt-blocked{border-color:var(--rt-red)}",
    "@media(max-width:760px){.rt-layout{grid-template-columns:minmax(0,1fr)}.rt-controls{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.rt-controls button{grid-column:1/-1}}@media(max-width:500px){.rt-controls{grid-template-columns:minmax(0,1fr)}.rt-choice-grid,.rt-actions{display:grid;grid-template-columns:minmax(0,1fr)}.rt-actions>*{width:100%}.rt-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.rt-frame{padding:3px}}@media(prefers-reduced-motion:reduce){.rt-lab *{scroll-behavior:auto!important;transition:none!important;animation:none!important}}"
  ].join("");

  function assert(condition, message) { if (!condition) throw new Error("radiative-transfer self-test: " + message); }
  function near(left, right, tolerance) { return Math.abs(left - right) <= (tolerance === undefined ? 1e-8 : tolerance); }
  function finite(value) { return typeof value === "number" && isFinite(value); }
  function cloneConfig(config) { var copy = {}; Object.keys(config).forEach(function (key) { copy[key] = config[key]; }); return copy; }
  function clonePreset(preset) { return cloneConfig(preset); }

  function validateSlab(Iin, S, tau) {
    if (!finite(Iin) || !finite(S) || !finite(tau)) throw new Error("Iin, S and tau must be finite numbers");
    if (tau < 0 || tau > 1000 || Iin < 0 || S < 0 || Iin > 1e6 || S > 1e6) throw new RangeError("0≤tau≤1000 and 0≤Iin,S≤10^6 required");
  }

  function oneMinusExpNeg(tau) { return typeof Math.expm1 === "function" ? -Math.expm1(-tau) : 1 - Math.exp(-tau); }

  function formalSolution(Iin, S, tau) {
    validateSlab(Iin, S, tau);
    var escape = Math.exp(-tau), sourceFraction = oneMinusExpNeg(tau), transmitted = Iin * escape, emitted = S * sourceFraction;
    return { Iin: Iin, S: S, tau: tau, escape: escape, transmitted: transmitted, emitted: emitted, Iout: transmitted + emitted };
  }

  function thinExpansion(Iin, S, tau) {
    validateSlab(Iin, S, tau);
    return { Iin: Iin, S: S, tau: tau, transmitted: Iin * (1 - tau), emitted: S * tau, Iout: Iin + (S - Iin) * tau, order: "first order in tau; remainder O(tau^2)" };
  }

  function contributionLedger(Iin, S, tau, bins) {
    var solution = formalSolution(Iin, S, tau), count = bins === undefined ? 8 : bins, rows = [];
    if(!Number.isInteger(count)||count<1||count>256)throw new RangeError("bins must be integer 1..256");
    for (var index = 0; index < count; index += 1) {
      var start = tau * index / count, end = tau * (index + 1) / count, width = end-start, weight = Math.exp(-(tau-end))*oneMinusExpNeg(width), contribution = S*weight, localGenerated = S*width, escapeToExit = width === 0 ? Math.exp(-(tau-end)) : weight/width;
      rows.push({ index: index + 1, tauStart: start, tauEnd: end, width: end - start, localGenerated: localGenerated, escapeToExit: escapeToExit, contribution: contribution });
    }
    var sourceTotal = rows.reduce(function (sum, row) { return sum + row.contribution; }, 0);
    return { rows: rows, incident: solution.transmitted, sourceTotal: sourceTotal, total: solution.transmitted + sourceTotal, solution: solution };
  }

  function nonnegative(value,name){if(!finite(value)||value<0||value>1e6)throw new RangeError(name+" must be in [0,1e6]");return value;}
  function validateConfig(config){
    if(!config||typeof config!=="object"||Array.isArray(config))throw new TypeError("config must be an object");
    var allowed=["id","label","Iin","tau","sourceModel","B","J","epsilon","S","bins"];
    Object.keys(config).forEach(function(k){if(allowed.indexOf(k)<0)throw new TypeError("Unknown key "+k);});
  }
  function resolveSource(config) {
    validateConfig(config);
    var model=config.sourceModel===undefined?"prescribed":config.sourceModel;
    if(["LTE","scattering","prescribed"].indexOf(model)<0)throw new RangeError("Unknown source model");
    var B=config.B===undefined?null:nonnegative(config.B,"B"),J=config.J===undefined?null:nonnegative(config.J,"J"),epsilon=config.epsilon===undefined?null:config.epsilon;
    if(epsilon!==null&&(!finite(epsilon)||epsilon<0||epsilon>1))throw new RangeError("epsilon must lie in [0,1]");
    if(config.epsilon===null)throw new RangeError("epsilon must be numeric");
    if(model==="LTE"){
      if(B===null)throw new TypeError("LTE needs B");
      if(epsilon!==null&&epsilon!==1)throw new RangeError("LTE preset assumes pure absorption epsilon=1");
      return {model:model,S:B,B:B,J:J,epsilon:1,rule:"纯吸收 LTE：S=B",thermalized:true};
    }
    if(model==="scattering"){
      if(B===null||J===null||epsilon===null)throw new TypeError("scattering needs B,J,epsilon");
      return {model:model,S:(1-epsilon)*J+epsilon*B,B:B,J:J,epsilon:epsilon,rule:"给定 J 的各向同性相干散射：S=(1−ε)J+εB",thermalized:epsilon===1};
    }
    return {model:model,S:nonnegative(config.S,"S"),B:B,J:J,epsilon:epsilon,rule:"指定 S；未假定 LTE",thermalized:false};
  }

  function equalityBoundary(solution, source) {
    var matchedBoundary = solution.Iin === source;
    return { numericalEquality: solution.Iout === source, structuralMatch: matchedBoundary, finiteExactCondition: matchedBoundary, reason: matchedBoundary ? "Iin=S，有限τ下两项恰好平衡" : (solution.tau > 0 ? "有限τ且 Iin≠S：只会趋近，不会恰等" : "τ=0 时 Iout=Iin；没有介质源项"), thickLimit: "τ→∞ 时 e^(−τ)→0，Iout→S" };
  }

  function analyzeSlab(config, bins) {
    var source = resolveSource(config), ledger = contributionLedger(config.Iin, source.S, config.tau, bins === undefined ? (config.bins === undefined ? 8 : config.bins) : bins), solution = ledger.solution, equality = equalityBoundary(solution, source.S);
    return { config: cloneConfig(config), source: source, solution: solution, thinExpansion: thinExpansion(config.Iin, source.S, config.tau), ledger: ledger, equality: equality, regime: solution.tau < 0.3 ? "optically thin" : (solution.tau > 3 ? "optically thick" : "intermediate"), boundary: source.model === "LTE" ? "本预设限定纯吸收 LTE，故 S=B；不能仅凭出射强度反演温度。" : (source.model === "scattering" ? "散射预设的 J 是给定输入；没有求解角度耦合的自洽辐射场。ε=1 或 J=B 时才有 S=B。" : "S 是指定输入，需另说明发射机制。"), rows: ledger.rows };
  }

  function presetById(id) { for (var index = 0; index < PRESETS.length; index += 1) if (PRESETS[index].id === id) return PRESETS[index]; return PRESETS[0]; }
  function formatNumber(value, digits) { var d=digits===undefined?4:digits;return value!==0&&Math.abs(value)<Math.pow(10,-d)?value.toExponential(3):value.toFixed(d); }
  function setAttributes(node, attributes) { Object.keys(attributes || {}).forEach(function (key) { var value = attributes[key]; if (value === undefined || value === null || value === false) return; if (key === "className") node.setAttribute("class", String(value)); else if (key === "htmlFor") node.setAttribute("for",String(value)); else if (key === "text") node.textContent = String(value); else if (value === true) node.setAttribute(key, ""); else node.setAttribute(key, String(value)); }); return node; }
  function appendChildren(node, children, doc) { if (children === undefined || children === null) return node; (Array.isArray(children) ? children : [children]).forEach(function (child) { if (child === undefined || child === null || child === false) return; node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child))); }); return node; }
  function element(doc, tag, attributes, children) { return appendChildren(setAttributes(doc.createElement(tag), attributes), children, doc); }
  function svgElement(doc, tag, attributes, children) { return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attributes), children, doc); }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function installStyles(doc) { if (doc.getElementById && doc.getElementById(STYLE_ID)) return; var style = doc.createElement("style"); style.id = STYLE_ID; style.textContent = STYLE_TEXT; (doc.head || doc.documentElement).appendChild(style); }
  function announce(api, root, message) { if (api && typeof api.announce === "function") api.announce(root, message); }
  function metric(doc, label) { var value = element(doc, "strong", { text: "—" }); return { node: element(doc, "div", { className: "rt-metric" }, [element(doc, "span", { text: label }), value]), value: value }; }

  function questionSpecs(result) {
    var T=result.solution.transmitted,E=result.solution.emitted;
    var main = T>2*E ? "incident" : E>2*T ? "source" : "comparable";
    var matched = result.equality.finiteExactCondition;
    return [
      { key: "dominant", prompt: "当前出口哪项主导？大于另一项2倍才叫主导，否则选可比（都为0也选此项）。", expected: main, choices: [{ value: "incident", label: "透射入口光" }, { value: "source", label: "源函数发光" }, { value: "comparable", label: "两者可比" }] },
      { key: "equality", prompt: matched ? "当前匹配边界 Iin=S 时，有限 τ 能否精确写 Iout=S？" : "有限 τ 且 Iin≠S 时，能否精确写 Iout=S？", expected: matched ? "yes" : "no", choices: [{ value: "yes", label: "能" }, { value: "no", label: "不能，只在极限趋近" }, { value: "fit", label: "只看曲线" }] },
      { key: "closure", prompt: "当前预设是否采用纯吸收 LTE 的 S=B 闭合？", expected: result.source.model === "LTE" ? "yes" : "no", choices: [{ value: "yes", label: "是" }, { value: "no", label: "不是" }, { value: "always", label: "散射也总是" }] }
    ];
  }

  function renderPredictions(state, refs, result) { var specs = questionSpecs(result); refs.questions.forEach(function (questionRef, index) { var spec = specs[index]; questionRef.legend.textContent = spec.prompt; questionRef.buttons.forEach(function (buttonRef) { var selected = state.predictions[spec.key] === buttonRef.value; buttonRef.node.setAttribute("aria-pressed", selected ? "true" : "false"); if (state.revealed) { var correct = buttonRef.value === spec.expected; buttonRef.node.textContent = (correct ? "✓ " : "") + buttonRef.label; buttonRef.node.className = correct ? "rt-pass" : (selected ? "rt-warn" : ""); } else { buttonRef.node.textContent = buttonRef.label; buttonRef.node.className = ""; } }); }); }

  function pathForSolution(solution,width,height,pad) {
    var low=0,high=1.12*Math.max(.1,solution.Iin,solution.S),bottom=height-pad-40,points=[],count=solution.tau===0?0:160;
    for(var i=0;i<=count;i++){
      var t=count?solution.tau*i/count:0,value=formalSolution(solution.Iin,solution.S,t).Iout;
      var x=pad+(width-2*pad)*(count?i/count:0),y=bottom-(bottom-pad)*value/high;
      points.push((i?"L ":"M ")+x.toFixed(3)+" "+y.toFixed(3));
    }
    return {path:points.join(" "),low:low,high:high,bottom:bottom};
  }
  function drawVisualization(doc,svg,result,uid) {
    clear(svg);var width=720,height=360,pad=60,scale=pathForSolution(result.solution,width,height,pad),right=width-pad,bottom=scale.bottom;
    svg.setAttribute("viewBox","0 0 720 360");
    svg.appendChild(svgElement(doc,"title",{id:uid+"-svg-title",text:"沿光线的均匀层强度"}));
    svg.appendChild(svgElement(doc,"desc",{id:uid+"-svg-desc",text:"光学深度从入口向出口增加。零厚度只画一个边界点，不制造传播区间。"}));
    function text(x,y,t,extra){svg.appendChild(svgElement(doc,"text",Object.assign({x:x,y:y},extra||{}),t));}
    var yMap=function(v){return bottom-(bottom-pad)*v/scale.high;};
    for(var i=0;i<=4;i++){var y=bottom-(bottom-pad)*i/4;svg.appendChild(svgElement(doc,"line",{x1:pad,y1:y,x2:right,y2:y,class:"rt-grid"}));text(pad-7,y+4,formatNumber(scale.high*i/4,2),{"text-anchor":"end"});}
    svg.appendChild(svgElement(doc,"path",{d:"M"+pad+" "+pad+"V"+bottom+"H"+right,fill:"none",class:"rt-axis"}));
    var zero=result.solution.tau===0;
    (zero?[0]:[0,result.solution.tau/2,result.solution.tau]).forEach(function(t){var x=pad+(zero?0:t/result.solution.tau)*(right-pad);text(x,bottom+19,formatNumber(t,2),{"text-anchor":"middle"});});
    if(!zero){svg.appendChild(svgElement(doc,"line",{x1:pad,y1:yMap(result.source.S),x2:right,y2:yMap(result.source.S),class:"rt-source"}));svg.appendChild(svgElement(doc,"path",{d:scale.path,class:"rt-curve"}));svg.appendChild(svgElement(doc,"circle",{cx:pad,cy:yMap(result.solution.Iin),r:5,class:"rt-input"}));}
    svg.appendChild(svgElement(doc,"circle",{cx:zero?pad:right,cy:yMap(result.solution.Iout),r:5,class:"rt-output"}));
    text(pad,22,zero?"τ=0：仅一个入口/出口点，没有介质贡献":"蓝线：沿光线形式解；金虚线：恒定源函数 S");
    text(pad,45,"I（统一强度单位）");text(right,bottom+42,"t（从入口计的光学深度）",{"text-anchor":"end"});
    text(pad,335,"入口="+formatNumber(result.solution.Iin,3));text(260,335,"出口="+formatNumber(result.solution.Iout,3));text(475,335,"S="+formatNumber(result.source.S,3));
  }
  function drawContributions(doc,svg,result,uid) {
    clear(svg);svg.setAttribute("viewBox","0 0 720 340");svg.setAttribute("role","img");svg.setAttribute("aria-label","各层对出口的实际强度贡献");
    var rows=result.rows,top=40,bottom=245,left=60,right=660,hi=Math.max(.001,...rows.map(function(r){return r.contribution;}))*1.15;
    function text(x,y,t,extra){svg.appendChild(svgElement(doc,"text",Object.assign({x:x,y:y},extra||{}),t));}
    [0,.5,1].forEach(function(f){var y=bottom-f*(bottom-top);svg.appendChild(svgElement(doc,"line",{x1:left,y1:y,x2:right,y2:y,class:"rt-grid"}));text(left-6,y+4,formatNumber(f*hi,4),{"text-anchor":"end"});});
    rows.forEach(function(row,i){var w=(right-left)/rows.length,x=left+i*w,y=bottom-row.contribution/hi*(bottom-top);svg.appendChild(svgElement(doc,"rect",{x:x+.1*w,y:y,width:.8*w,height:bottom-y,fill:"var(--rt-blue)","data-layer":i+1,"data-contribution":row.contribution}));text(x+w/2,bottom+18,String(i+1),{"text-anchor":"middle"});});
    svg.appendChild(svgElement(doc,"path",{d:"M60 40V245H660",fill:"none",class:"rt-axis"}));text(left,20,"每柱 C_k = 该层发光到达出口的强度贡献");text(right,286,"层号：从入口 → 出口",{"text-anchor":"end"});text(left,313,"靠出口的层衰减少；这里是按等宽层积分，透射入口光另在读数中记账。");
  }

  function renderLedger(doc, hostNode, result) {
    var body = element(doc, "tbody", {}); result.rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: String(row.index) }), element(doc, "td", { text: formatNumber(row.tauStart, 3) + "–" + formatNumber(row.tauEnd, 3) }), element(doc, "td", { text: formatNumber(row.escapeToExit, 4) }), element(doc, "td", { text: formatNumber(row.contribution, 5) }), element(doc, "td", { text: "恒定 S" })])); }); body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: "总计" }), element(doc, "td", { text: "0–" + formatNumber(result.solution.tau, 3) }), element(doc, "td", { text: "—" }), element(doc, "td", { text: formatNumber(result.ledger.sourceTotal, 5) }), element(doc, "td", { text: result.source.rule })])); clear(hostNode); hostNode.appendChild(element(doc, "table", { className: "rt-table" }, [element(doc, "caption", { text: "光学深度源函数贡献账本（每层贡献已传播到出口）" }), element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { scope: "col", text: "层" }), element(doc, "th", { scope: "col", text: "光学区间" }), element(doc, "th", { scope: "col", text: "层内平均逃逸权重" }), element(doc, "th", { scope: "col", text: "对 Iout 的贡献" }), element(doc, "th", { scope: "col", text: "源函数边界" })])]), body]));
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument, uid = "rt-" + (++INSTANCE), state = { presetId: PRESETS[0].id, config: clonePreset(PRESETS[0]), revealed: false, predictions: {}, feedback: "" }, refs = { questions: [] };
    installStyles(doc);
    var shell = element(doc, "div", { className: "rt-lab" }); shell.appendChild(element(doc, "h3", { text: "辐射转移实验：入口透射与介质发光分账" })); shell.appendChild(element(doc, "p", { className: "rt-note", text: "单频、单方向、均匀恒定源函数 slab；先预测，再查看形式解、分层贡献和源函数边界。" }));
    var presetSelect = element(doc, "select", { id: uid+"-preset", "aria-label": "辐射转移 slab 预设" }); PRESETS.forEach(function (preset) { presetSelect.appendChild(element(doc, "option", { value: preset.id, text: preset.label })); });
    var tauInput = element(doc, "input", { id:uid+"-tau", type: "range", min: "0", max: "8", step: "0.05", value: String(state.config.tau), "aria-label": "光学厚度 tau" }), tauOutput = element(doc, "output", { text: formatNumber(state.config.tau, 2) });
    var IinInput = element(doc, "input", { id:uid+"-iin", type: "range", min: "0", max: "2", step: "0.01", value: String(state.config.Iin), "aria-label": "入口强度 Iin" }), IinOutput = element(doc, "output", { text: formatNumber(state.config.Iin, 2) });
    var reset = element(doc, "button", { type: "button", text: "重置预测" }); shell.appendChild(element(doc, "div", { className: "rt-controls" }, [element(doc, "div", { className: "rt-control" }, [element(doc, "label", { htmlFor:uid+"-preset", text: "均匀层预设" }), presetSelect]), element(doc, "div", { className: "rt-control" }, [element(doc, "label", {htmlFor:uid+"-tau"}, ["τ：", tauOutput]), tauInput]), element(doc, "div", { className: "rt-control" }, [element(doc, "label", {htmlFor:uid+"-iin"}, ["入口 Iin：", IinOutput]), IinInput]), reset]));
    var gate = element(doc, "div", { className: "rt-gate" }); questionSpecs(analyzeSlab(PRESETS[0])).forEach(function (spec) { var fieldset = element(doc, "fieldset", {}), legend = element(doc, "legend", { text: spec.prompt }), grid = element(doc, "div", { className: "rt-choice-grid" }), questionRef = { key: spec.key, legend: legend, buttons: [] }; spec.choices.forEach(function (choice) { var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: choice.label }); button.addEventListener("click", function () { state.predictions[spec.key] = choice.value; state.revealed=false; state.feedback = ""; render(); }); questionRef.buttons.push({ value: choice.value, label: choice.label, node: button }); grid.appendChild(button); }); fieldset.appendChild(legend); fieldset.appendChild(grid); gate.appendChild(fieldset); refs.questions.push(questionRef); }); shell.appendChild(gate);
    var actions = element(doc, "div", { className: "rt-actions" }), reveal = element(doc, "button", { type: "button", className: "rt-primary", text: "核对预测并揭晓" }), feedback = element(doc, "p", { className: "rt-feedback", "aria-live": "polite" }); actions.appendChild(reveal); shell.appendChild(actions); shell.appendChild(feedback);
    var contributionSvg=svgElement(doc,"svg",{className:"rt-svg"});
    var resultShell = element(doc, "div", { className: "rt-result", hidden: true }), svg = svgElement(doc, "svg", { className: "rt-svg", role: "img", "aria-labelledby": uid + "-svg-title " + uid + "-svg-desc", viewBox: "0 0 720 330" }), metricsHost = element(doc, "div", { className: "rt-metrics" }), certificate = element(doc, "p", { className: "rt-certificate" }), tableHost = element(doc, "div", { className: "rt-table-wrap", tabindex: "0", role: "region", "aria-label": "可横向滚动的贡献账本" });
    resultShell.appendChild(element(doc, "div", { className: "rt-layout" }, [element(doc, "div", { className: "rt-frame", tabindex: "0", role: "region", "aria-label": "可横向滚动的转移图" }, [svg]), element(doc, "div", {}, [metricsHost, certificate])])); resultShell.appendChild(element(doc,"div",{className:"rt-frame",tabindex:"0",role:"region","aria-label":"可横向滚动的分层贡献图"},[contributionSvg])); resultShell.appendChild(tableHost); shell.appendChild(resultShell); clear(root); root.appendChild(shell);
    function lock() { state.revealed = false; state.predictions = {}; state.feedback = ""; render(); }
    presetSelect.addEventListener("change", function () { state.presetId = presetSelect.value; state.config = clonePreset(presetById(state.presetId)); lock(); }); tauInput.addEventListener("input", function () { state.config.tau = Number(tauInput.value); lock(); }); IinInput.addEventListener("input", function () { state.config.Iin = Number(IinInput.value); lock(); }); reset.addEventListener("click", function () { state = { presetId: PRESETS[0].id, config: clonePreset(PRESETS[0]), revealed: false, predictions: {}, feedback: "" }; render(); refs.questions[0].buttons[0].node.focus(); announce(api, root, "辐射转移预测已重置。"); });
    reveal.addEventListener("click", function () { var result = analyzeSlab(state.config), specs = questionSpecs(result); if (!specs.every(function (spec) { return state.predictions[spec.key] !== undefined; })) { state.feedback = "请先完成三项预测。"; render(); return; } var correct = specs.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length; state.revealed = true; state.feedback = "已揭晓：" + correct + "/" + specs.length + " 命中；现在分别读透射、源项和闭合边界。"; render(); resultShell.querySelector("[tabindex]").focus(); announce(api, root, state.feedback); });
    function render() { var result = analyzeSlab(state.config); presetSelect.value = state.presetId; tauInput.value = String(state.config.tau); tauOutput.textContent = formatNumber(state.config.tau, 2); IinInput.value = String(state.config.Iin); IinOutput.textContent = formatNumber(state.config.Iin, 2); renderPredictions(state, refs, result); feedback.textContent = state.feedback || ""; feedback.className = "rt-feedback" + (state.feedback.indexOf("请先") === 0 ? " rt-warn" : ""); resultShell.hidden = !state.revealed; if (!state.revealed) return; drawVisualization(doc, svg, result, uid); drawContributions(doc,contributionSvg,result,uid); var metrics = [metric(doc, "Iout"), metric(doc, "透射入口"), metric(doc, "源项总贡献"), metric(doc, "逃逸因子"), metric(doc, "源函数 S"), metric(doc, "模型")]; clear(metricsHost); metrics.forEach(function (item) { metricsHost.appendChild(item.node); }); metrics[0].value.textContent = formatNumber(result.solution.Iout, 5); metrics[1].value.textContent = formatNumber(result.solution.transmitted, 5); metrics[2].value.textContent = formatNumber(result.solution.emitted, 5); metrics[3].value.textContent = formatNumber(result.solution.escape, 5); metrics[4].value.textContent = formatNumber(result.source.S, 5); metrics[5].value.textContent = result.source.model === "LTE" ? "纯吸收 LTE" : "给定 J 的散射"; certificate.className = "rt-certificate" + (result.equality.finiteExactCondition ? "" : " rt-blocked"); certificate.textContent = result.boundary + " 亮度与源函数" + (result.equality.finiteExactCondition ? "在当前有限边界因 Iin=S 而相等。" : "在当前有限边界不相等；只有写明厚度极限才可说趋近 S。"); renderLedger(doc, tableHost, result); }
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { assert(condition, message); checks += 1; }
    PRESETS.forEach(function (preset) { var result = analyzeSlab(preset, preset.bins); check(result.solution.Iout >= Math.min(result.solution.Iin, result.source.S) - 1e-9 && result.solution.Iout <= Math.max(result.solution.Iin, result.source.S) + 1e-9, preset.id + " bounded solution"); check(near(result.ledger.total, result.solution.Iout, 1e-10), preset.id + " ledger total"); check(result.rows.length === preset.bins, preset.id + " ledger rows"); check(near(result.source.S, resolveSource(preset).S, 1e-12), preset.id + " source resolution"); });
    var zero = formalSolution(0.7, 2, 0); check(near(zero.Iout, 0.7) && near(zero.transmitted, 0.7) && near(zero.emitted, 0), "zero optical depth");
    var thin = formalSolution(0.25, 1.4, 0.25); check(near(thin.Iout, 0.504379099, 1e-8), "thin formal solution"); check(near(thin.transmitted + thin.emitted, thin.Iout, 1e-12), "two-term identity");
    var thinFirstOrder = thinExpansion(0.25, 1.4, 1e-4); check(near(thinFirstOrder.transmitted, 0.25 * (1 - 1e-4), 1e-15) && near(thinFirstOrder.emitted, 1.4e-4, 1e-15), "thin first-order terms"); check(near(thinFirstOrder.Iout, 0.25 + (1.4 - 0.25) * 1e-4, 1e-15), "thin first-order total");
    var thick = formalSolution(0.05, 1, 50); check(near(thick.Iout, 1, 1e-12), "thick limit numeric"); check(thick.escape < 1e-20, "thick escape factor");
    var matched = formalSolution(0.8, 0.8, 1.1); check(near(matched.Iout, matched.S, 1e-12), "matched finite boundary"); check(equalityBoundary(matched, matched.S).finiteExactCondition && equalityBoundary(matched, matched.S).structuralMatch, "matched equality condition");
    var unequal = formalSolution(0.2, 1, 1); check(!equalityBoundary(unequal, unequal.S).finiteExactCondition, "unequal finite boundary"); check(unequal.Iout < unequal.S, "finite approach direction");
    var closeButUnequal = formalSolution(1, 1 + 5e-9, 1), closeBoundary = equalityBoundary(closeButUnequal, closeButUnequal.S); check(!closeBoundary.finiteExactCondition && !closeBoundary.structuralMatch, "near-equal boundary is not exact");
    var matchedResult = analyzeSlab(PRESETS[2], PRESETS[2].bins), matchedQuestion = questionSpecs(matchedResult)[1], unequalQuestion = questionSpecs(analyzeSlab(PRESETS[0], PRESETS[0].bins))[1]; check(matchedQuestion.expected === "yes" && matchedQuestion.prompt.indexOf("匹配边界") !== -1, "matched question state"); check(unequalQuestion.expected === "no" && unequalQuestion.prompt.indexOf("Iin≠S") !== -1, "unequal question state");
    var ledger = contributionLedger(0.25, 1.4, 0.25, 10); check(near(ledger.sourceTotal, ledger.solution.emitted, 1e-12), "partitioned source integral"); check(near(ledger.total, ledger.solution.Iout, 1e-12), "partitioned full integral"); check(ledger.rows.every(function (row) { return row.contribution >= 0 && row.contribution <= row.localGenerated + 1e-12; }), "layer contributions nonnegative and attenuated"); check(ledger.rows[ledger.rows.length - 1].contribution > ledger.rows[0].contribution, "deeper layer escapes more strongly");
    var lte = resolveSource({ sourceModel: "LTE", B: 1.2, J: 0, epsilon: 1 }); check(near(lte.S, 1.2) && lte.thermalized, "LTE source boundary"); var scatter = resolveSource({ sourceModel: "scattering", B: 1, J: 0.2, epsilon: 0.25 }); check(near(scatter.S, 0.4), "scattering source mix"); check(!scatter.thermalized && !near(scatter.S, scatter.B), "scattering not automatic LTE"); check(near(resolveSource({ sourceModel: "scattering", B: 1, J: 0.2, epsilon: 0 }).S, 0.2), "pure scattering boundary"); check(near(resolveSource({ sourceModel: "scattering", B: 1, J: 0.2, epsilon: 1 }).S, 1), "full thermalization boundary");
    var invalid = false; try { formalSolution(1, 1, -0.1); } catch (error) { invalid = true; } check(invalid, "negative tau rejected"); invalid = false; try { resolveSource({ sourceModel: "scattering", B: 1, J: 0, epsilon: 1.2 }); } catch (error) { invalid = true; } check(invalid, "invalid epsilon rejected");
    return { ok: true, checks: checks, presets: PRESETS.length };
  }

  return { drawContributions:drawContributions, questionSpecs: questionSpecs, drawVisualization: drawVisualization, pathForSolution:pathForSolution, EPS: EPS, PRESETS: PRESETS.map(clonePreset), formalSolution: formalSolution, thinExpansion: thinExpansion, contributionLedger: contributionLedger, resolveSource: resolveSource, equalityBoundary: equalityBoundary, analyzeSlab: analyzeSlab, selfTest: selfTest, mount: mount };
});
