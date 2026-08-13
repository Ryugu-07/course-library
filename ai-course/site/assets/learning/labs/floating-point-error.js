(function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "floating-point-error-styles";
  var PRESETS = [
    { id: "sqrt", label: "根式相消", problem: "sqrt", exponent: -12, prediction: "stable" },
    { id: "cos", label: "余弦相消", problem: "cos", exponent: -8, prediction: "stable" },
    { id: "derivative", label: "差分 U 曲线", problem: "derivative", exponent: -8, prediction: "balance" },
    { id: "sum", label: "求和顺序", problem: "sum", exponent: 0, prediction: "compensated" }
  ];

  var STYLE_TEXT = [
    ".fpe-lab{max-width:100%;min-width:0;color:var(--fg);}",
    ".fpe-lab *{box-sizing:border-box;}",
    ".fpe-lab [hidden]{display:none!important;}",
    ".fpe-lab .fpe-note,.fpe-lab .fpe-feedback{color:var(--fg-soft);font-size:13px;line-height:1.65;}",
    ".fpe-lab .fpe-presets,.fpe-lab .fpe-choice,.fpe-lab .fpe-actions{display:flex;flex-wrap:wrap;gap:8px;}",
    ".fpe-lab button{min-height:44px;}",
    ".fpe-lab .fpe-presets button{flex:1 1 135px;}",
    ".fpe-lab .fpe-control{display:grid;grid-template-columns:minmax(150px,1fr) minmax(190px,2fr);gap:12px;align-items:center;margin:14px 0;}",
    ".fpe-lab .fpe-control label{color:var(--fg-soft);font-size:12.5px;font-weight:700;}",
    ".fpe-lab .fpe-control output{color:var(--accent);font-variant-numeric:tabular-nums;}",
    ".fpe-lab .fpe-predict{margin:14px 0;padding:12px 14px;border-left:3px solid var(--cl-gold);background:var(--bg);}",
    ".fpe-lab .fpe-predict strong{display:block;margin-bottom:8px;font-size:13px;}",
    ".fpe-lab .fpe-choice button{flex:1 1 145px;}",
    ".fpe-lab .fpe-feedback{min-height:2em;margin:8px 0 0;font-weight:700;}",
    ".fpe-lab .fpe-pass{color:var(--cl-green);}.fpe-lab .fpe-warn{color:var(--cl-red);}",
    ".fpe-lab .fpe-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:14px 0;}",
    ".fpe-lab .fpe-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}",
    ".fpe-lab .fpe-metric span{display:block;color:var(--fg-soft);font-size:11.5px;}",
    ".fpe-lab .fpe-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}",
    ".fpe-lab svg{display:block;width:100%;height:auto;background:var(--bg);border:1px solid var(--border);border-radius:7px;}",
    ".fpe-lab svg text{fill:var(--fg);font-family:inherit;letter-spacing:0;}",
    ".fpe-lab .fpe-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.55;}",
    ".fpe-lab .fpe-naive{stroke:var(--cl-red);stroke-width:3;fill:none;}",
    ".fpe-lab .fpe-stable{stroke:var(--accent);stroke-width:3;fill:none;}",
    ".fpe-lab .fpe-selected{fill:var(--cl-green);stroke:var(--bg);stroke-width:2;}",
    ".fpe-lab .fpe-ledger{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:14px;}",
    ".fpe-lab table{width:100%;min-width:650px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}",
    ".fpe-lab th,.fpe-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;}",
    ".fpe-lab th{color:var(--fg-soft);font-size:11.5px;}",
    ".fpe-lab button:focus-visible,.fpe-lab input:focus-visible{outline:3px solid var(--cl-focus);outline-offset:2px;}",
    "@media(max-width:700px){.fpe-lab .fpe-control{grid-template-columns:minmax(0,1fr);gap:4px;}}",
    "@media(prefers-reduced-motion:reduce){.fpe-lab *{animation:none!important;transition:none!important;}}"
  ].join("\n");

  function copyPreset(p) { return { id: p.id, label: p.label, problem: p.problem, exponent: p.exponent, prediction: p.prediction }; }
  function relativeError(value, truth) { return Math.abs(value - truth) / Math.max(Math.abs(truth), Number.MIN_VALUE); }
  function sqrtCase(exponent) {
    var x = Math.pow(10, exponent), truth = 1 / (Math.sqrt(1 + x) + 1);
    var naive = (Math.sqrt(1 + x) - 1) / x, stable = truth;
    return { x: x, truth: truth, naive: naive, stable: stable, naiveError: relativeError(naive, truth), stableError: 0, expected: "stable", formula: "(√(1+x)-1)/x → 1/(√(1+x)+1)" };
  }
  function cosCase(exponent) {
    var x = Math.pow(10, exponent), truth = 2 * Math.sin(x / 2) * Math.sin(x / 2);
    var naive = 1 - Math.cos(x), stable = truth;
    return { x: x, truth: truth, naive: naive, stable: stable, naiveError: relativeError(naive, truth), stableError: 0, expected: "stable", formula: "1-cos x → 2 sin²(x/2)" };
  }
  function derivativePoint(exponent) {
    var h = Math.pow(10, exponent), truth = Math.exp(1), approx = (Math.exp(1 + h) - Math.exp(1 - h)) / (2 * h);
    return { x: h, truth: truth, naive: approx, stable: truth, naiveError: relativeError(approx, truth), stableError: 0, expected: "balance", formula: "[e^(1+h)-e^(1-h)]/(2h)" };
  }
  function naiveSum(values) { var total = 0; values.forEach(function (v) { total += v; }); return total; }
  function kahanSum(values) { var total = 0, c = 0; values.forEach(function (value) { var y = value - c, t = total + y; c = (t - total) - y; total = t; }); return total; }
  function sumCase() {
    var repeats = 20000, values = [1e16]; for (var i = 0; i < repeats; i += 1) values.push(1); values.push(-1e16);
    var truth = repeats, naive = naiveSum(values), stable = kahanSum(values);
    return { x: repeats, truth: truth, naive: naive, stable: stable, naiveError: relativeError(naive, truth), stableError: relativeError(stable, truth), expected: "compensated", formula: "10¹⁶ + 1 + ··· + 1 − 10¹⁶" };
  }
  function evaluate(problem, exponent) { if (problem === "sqrt") return sqrtCase(exponent); if (problem === "cos") return cosCase(exponent); if (problem === "derivative") return derivativePoint(exponent); return sumCase(); }
  function errorCurve(problem) {
    var points = [];
    if (problem === "sum") {
      [1,10,100,1000,5000,10000,20000].forEach(function (n) { var values=[1e16]; for(var i=0;i<n;i+=1) values.push(1); values.push(-1e16); points.push({ exponent:Math.log10(n), naive:relativeError(naiveSum(values),n), stable:relativeError(kahanSum(values),n) }); });
    } else {
      for (var e = -16; e <= -1; e += .25) { var row = evaluate(problem, e); points.push({ exponent:e, naive:row.naiveError, stable:row.stableError }); }
    }
    return points;
  }
  function format(value, digits) { if (!Number.isFinite(value)) return "∞"; if (value === 0) return "0"; if (Math.abs(value) < .001 || Math.abs(value) >= 10000) return value.toExponential(2); var text=value.toFixed(digits===undefined?4:digits); return text.replace(/0+$/,"").replace(/\.$/,""); }
  function svgNode(doc, tag, attrs, value) { var node=doc.createElementNS(SVG_NS,tag); Object.keys(attrs||{}).forEach(function(k){node.setAttribute(k,String(attrs[k]));}); if(value!==undefined)node.textContent=value; return node; }
  function path(points,x,y){return points.map(function(p,i){return(i?"L":"M")+x(p)+" "+y(p);}).join(" ");}
  function chartSvg(doc, problem, selectedExponent) {
    var curve=errorCurve(problem), svg=svgNode(doc,"svg",{viewBox:"0 0 760 330",role:"img","aria-label":"相对误差随尺度变化的对数图"}); svg.appendChild(svgNode(doc,"title",{},"相对误差账本"));
    var minX=Math.min.apply(null,curve.map(function(p){return p.exponent;})),maxX=Math.max.apply(null,curve.map(function(p){return p.exponent;}));
    var logs=[]; curve.forEach(function(p){logs.push(Math.log10(Math.max(p.naive,1e-18)),Math.log10(Math.max(p.stable,1e-18)));}); var minY=Math.max(-18,Math.min.apply(null,logs)-.3),maxY=Math.min(1,Math.max.apply(null,logs)+.3);
    var mx=function(v){return 55+(v-minX)/(maxX-minX)*650;},my=function(v){return 286-(v-minY)/(maxY-minY)*235;};
    [0,.5,1].forEach(function(q){var v=minY+q*(maxY-minY),y=my(v);svg.appendChild(svgNode(doc,"line",{x1:55,y1:y,x2:705,y2:y,class:"fpe-grid"}));svg.appendChild(svgNode(doc,"text",{x:48,y:y+4,"font-size":10,"text-anchor":"end"},format(v,1)));});
    svg.appendChild(svgNode(doc,"path",{d:path(curve,function(p){return mx(p.exponent);},function(p){return my(Math.log10(Math.max(p.naive,1e-18)));}),class:"fpe-naive"}));
    svg.appendChild(svgNode(doc,"path",{d:path(curve,function(p){return mx(p.exponent);},function(p){return my(Math.log10(Math.max(p.stable,1e-18)));}),class:"fpe-stable"}));
    if(problem!=="sum"){var selected=evaluate(problem,selectedExponent);svg.appendChild(svgNode(doc,"circle",{cx:mx(selectedExponent),cy:my(Math.log10(Math.max(selected.naiveError,1e-18))),r:5,class:"fpe-selected"}));}
    svg.appendChild(svgNode(doc,"text",{x:55,y:25,"font-size":13,"font-weight":700},"log₁₀(relative error)：红=直接式，蓝=稳定式/参考")); svg.appendChild(svgNode(doc,"text",{x:705,y:310,"font-size":10,"text-anchor":"end"},problem==="sum"?"log₁₀(小项个数)":"log₁₀(scale)")); return svg;
  }
  function element(doc,tag,className,value){var n=doc.createElement(tag);if(className)n.className=className;if(value!==undefined)n.textContent=value;return n;}
  function installStyles(doc){if(doc.getElementById(STYLE_ID))return;var s=element(doc,"style");s.id=STYLE_ID;s.textContent=STYLE_TEXT;doc.head.appendChild(s);}
  function metric(doc,label,value){var b=element(doc,"div","fpe-metric");b.appendChild(element(doc,"span","",label));b.appendChild(element(doc,"strong","",value));return b;}
  function labelPrediction(value){return value==="stable"?"稳定改写更可靠":value==="balance"?"先改善、后恶化": "补偿求和更可靠";}
  function mount(root,api){
    var doc=root.ownerDocument;installStyles(doc);var state=copyPreset(PRESETS[0]),prediction=null,revealed=false;
    var shell=element(doc,"div","fpe-lab");shell.appendChild(element(doc,"p","fpe-note","先预测误差走向，再比较数学等价式在 IEEE 754 双精度中的实际结果。"));var presets=element(doc,"div","fpe-presets"),presetButtons=[];
    PRESETS.forEach(function(p){var b=element(doc,"button","",p.label);b.type="button";b.addEventListener("click",function(){state=copyPreset(p);prediction=null;revealed=false;sync();render();});presetButtons.push({id:p.id,node:b});presets.appendChild(b);});shell.appendChild(presets);
    var control=element(doc,"div","fpe-control"),label=element(doc,"label","","尺度 10^e，e="),output=element(doc,"output"),range=element(doc,"input");range.type="range";range.min="-16";range.max="-1";range.step="1";range.setAttribute("aria-label","十进制指数");label.appendChild(output);control.appendChild(label);control.appendChild(range);shell.appendChild(control);range.addEventListener("input",function(){state.exponent=Number(range.value);state.id="custom";prediction=null;revealed=false;render();});
    var predict=element(doc,"div","fpe-predict");predict.appendChild(element(doc,"strong","","先预测：缩小尺度或重排运算会怎样？"));var choices=element(doc,"div","fpe-choice"),choiceButtons=[];[["stable","稳定改写更可靠"],["balance","先改善、后恶化"],["compensated","补偿求和更可靠"]].forEach(function(item){var b=element(doc,"button","",item[1]);b.type="button";b.addEventListener("click",function(){prediction=item[0];renderPrediction();});choiceButtons.push({value:item[0],node:b});choices.appendChild(b);});predict.appendChild(choices);var actions=element(doc,"div","fpe-actions"),check=element(doc,"button","cl-primary","核对预测"),reset=element(doc,"button","","重置本预设");check.type=reset.type="button";var feedback=element(doc,"p","fpe-feedback","先选一个判断。"),results=element(doc,"div");results.hidden=true;check.addEventListener("click",function(){if(!prediction){feedback.textContent="请先作出预测。";feedback.className="fpe-feedback fpe-warn";return;}revealed=true;render();});reset.addEventListener("click",function(){var p=PRESETS.filter(function(x){return x.id===state.id;})[0]||PRESETS[0];state=copyPreset(p);prediction=null;revealed=false;sync();render();});actions.appendChild(check);actions.appendChild(reset);predict.appendChild(actions);predict.appendChild(feedback);shell.appendChild(predict);shell.appendChild(results);root.replaceChildren(shell);
    function sync(){range.value=String(state.exponent);range.disabled=state.problem==="sum";output.textContent=state.problem==="sum"?"固定序列":String(state.exponent);}
    function renderPrediction(){choiceButtons.forEach(function(i){i.node.setAttribute("aria-pressed",prediction===i.value?"true":"false");});}
    function render(){sync();presetButtons.forEach(function(i){i.node.setAttribute("aria-pressed",state.id===i.id?"true":"false");});renderPrediction();var data=evaluate(state.problem,state.exponent);if(!revealed){results.hidden=true;feedback.textContent=prediction?"预测已记录，点击“核对预测”查看误差账。":"先选一个判断。";feedback.className="fpe-feedback";return;}results.hidden=false;var correct=prediction===data.expected;feedback.textContent=(correct?"预测命中。":"对照红蓝两条误差账。")+" 本题结论：“"+labelPrediction(data.expected)+"”。";feedback.className="fpe-feedback "+(correct?"fpe-pass":"fpe-warn");if(api&&api.announce)api.announce(root,feedback.textContent);results.replaceChildren();var metrics=element(doc,"div","fpe-metrics");metrics.appendChild(metric(doc,"尺度 / 项数",format(data.x,3)));metrics.appendChild(metric(doc,"参考值",format(data.truth,10)));metrics.appendChild(metric(doc,"直接计算",format(data.naive,10)));metrics.appendChild(metric(doc,"稳定 / 补偿",format(data.stable,10)));metrics.appendChild(metric(doc,"直接式相对误差",format(data.naiveError,3)));metrics.appendChild(metric(doc,"改写式相对误差",format(data.stableError,3)));results.appendChild(metrics);results.appendChild(chartSvg(doc,state.problem,state.exponent));var wrap=element(doc,"div","fpe-ledger"),table=element(doc,"table");table.setAttribute("aria-label","数值误差诊断账本");var head=element(doc,"tr");["账", "问题本身", "算法 / 表达式", "诊断"].forEach(function(v){var th=element(doc,"th","",v);th.scope="col";head.appendChild(th);});var thead=element(doc,"thead");thead.appendChild(head);table.appendChild(thead);var body=element(doc,"tbody");[["数学值",data.formula,"实数算术等价","条件数描述输入扰动敏感度"],["浮点路径","同一输入尺度","直接式 vs 稳定改写","稳定性描述额外误差放大"],["当前结果",format(data.truth,8),format(data.naive,8)+" / "+format(data.stable,8),"相对误差 "+format(data.naiveError,3)+" / "+format(data.stableError,3)]].forEach(function(row){var tr=element(doc,"tr");row.forEach(function(v){tr.appendChild(element(doc,"td","",v));});body.appendChild(tr);});table.appendChild(body);wrap.appendChild(table);results.appendChild(wrap);results.appendChild(element(doc,"p","fpe-note","稳定改写修复的是运算路径，不会把病态问题变成良态；红蓝差距是算法账，输入扰动敏感度要另算条件数。"));}
    sync();render();
  }
  function selfTest(){var checks=0;function assert(c,m){checks+=1;if(!c)throw new Error(m);}var s=sqrtCase(-12);assert(s.naiveError>1e-5,"sqrt cancellation visible");assert(s.stable===s.truth,"sqrt rationalized exact reference");assert(Math.abs(s.truth-.5)<1e-10,"sqrt quotient tends to one half");var moderate=sqrtCase(-2);assert(Math.abs(moderate.truth-(Math.sqrt(1.01)-1)/.01)<1e-13,"rationalized identity at moderate scale");var c=cosCase(-8);assert(c.naive===0&&c.truth>0,"cos cancellation to zero");var d1=derivativePoint(-3),d2=derivativePoint(-5),d3=derivativePoint(-14);assert(d2.naiveError<d1.naiveError,"central difference initially improves");assert(d3.naiveError>d2.naiveError,"central difference roundoff rises");var sum=sumCase();assert(sum.naive!==sum.truth,"naive summation loses small terms");assert(sum.stableError<sum.naiveError,"Kahan improves adversarial sum");PRESETS.forEach(function(p){assert(evaluate(p.problem,p.exponent).expected===p.prediction,p.id+" expected");});return{checks:checks,presets:PRESETS.length};}
  var exported={PRESETS:PRESETS,sqrtCase:sqrtCase,cosCase:cosCase,derivativePoint:derivativePoint,naiveSum:naiveSum,kahanSum:kahanSum,sumCase:sumCase,evaluate:evaluate,errorCurve:errorCurve,selfTest:selfTest};if(typeof module!=="undefined"&&module.exports)module.exports=exported;if(host&&host.CourseLearning&&typeof host.CourseLearning.register==="function")host.CourseLearning.register("floating-point-error",mount);if(typeof module!=="undefined"&&module.exports&&typeof require!=="undefined"&&require.main===module){try{var report=selfTest();console.log("floating-point-error self-test: PASS ("+report.checks+" checks, "+report.presets+" presets)");}catch(error){console.error("floating-point-error self-test: FAIL\n"+error.stack);process.exitCode=1;}}
})(typeof window!=="undefined"?window:null);
