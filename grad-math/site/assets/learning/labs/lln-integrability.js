(function(root,factory){"use strict";var api=factory();if(typeof module==="object"&&module.exports)module.exports=api;if(root&&root.CourseLearning)root.CourseLearning.register("lln-integrability",api.mount);if(typeof module==="object"&&module.exports&&typeof require==="function"&&require.main===module)console.log(JSON.stringify(api.selfTest()));})(typeof window!=="undefined"?window:null,function(){"use strict";
var MODELS=Object.freeze({
 bernoulli:Object.freeze({label:"Bernoulli(0.6)",mean:.6,independent:true,integrable:true,variance:.24}),
 pareto:Object.freeze({label:"Pareto α=1.5",mean:3,independent:true,integrable:true,variance:Infinity}),
 cauchy:Object.freeze({label:"标准 Cauchy",mean:null,independent:true,integrable:false,variance:null}),
 dependent:Object.freeze({label:"完全依赖 ±1",mean:0,independent:false,integrable:true,variance:1})
});
var DEFAULTS=Object.freeze({modelId:"bernoulli",n:1000,seed:13,alpha:1.5}),INSTANCE=0;
function finite(x,lo,hi,integer,name){if(typeof x!=="number"||!Number.isFinite(x)||x<lo||x>hi||(integer&&!Number.isInteger(x)))throw new RangeError(name+" must be "+(integer?"an integer ":"")+"in ["+lo+", "+hi+"]");return x;}
function config(o){if(!o||typeof o!=="object"||Array.isArray(o))throw new TypeError("configuration required");var c=Object.assign({},DEFAULTS,o);if(typeof c.modelId!=="string"||!Object.hasOwn(MODELS,c.modelId))throw new RangeError("unknown model");finite(c.n,1,5000,true,"n");finite(c.seed,0,4294967295,true,"seed");finite(c.alpha,.5,5,false,"alpha");return c;}
function makeRandom(seed){var state=finite(seed,0,4294967295,true,"seed");return function(){state=(Math.imul(1664525,state)+1013904223)>>>0;return(state+.5)/4294967296;};}
function kahan(){var sum=0,correction=0;return function(x){var y=x-correction,t=sum+y;correction=(t-sum)-y;sum=t;return sum;};}
function theory(modelId,alpha){if(!Object.hasOwn(MODELS,modelId))throw new RangeError("unknown model");finite(alpha,.5,5,false,"alpha");if(modelId!=="pareto")return MODELS[modelId];return Object.freeze({label:"Pareto α="+alpha,mean:alpha>1?alpha/(alpha-1):Infinity,variance:alpha>2?alpha/((alpha-1)*(alpha-1)*(alpha-2)):Infinity,integrable:alpha>1,independent:true});}
function truncatedMoments(modelId,i,alpha){if(!Object.hasOwn(MODELS,modelId))throw new RangeError("unknown model");finite(i,1,5000,true,"i");finite(alpha,.5,5,false,"alpha");
 if(modelId==="bernoulli")return{mean:.6,second:.6,variance:.24,tail:0};
 if(modelId==="dependent")return{mean:0,second:1,variance:1,tail:0};
 if(modelId==="cauchy"){var v=2/Math.PI*(i-Math.atan(i));return{mean:0,second:v,variance:v,tail:2/Math.PI*Math.atan(1/i)};}
 var log=Math.log(i);function moment(r){var d=r-alpha;return alpha*(d===0?log:Math.expm1(d*log)/d);}
 var a=moment(1),b=moment(2),variance=b-a*a;if(variance<0)throw new RangeError("negative truncation variance");
 return{mean:a,second:b,variance:variance,tail:Math.exp(-alpha*log)};
}
function samplePath(modelId,length,seed,alpha){var c=config({modelId:modelId,n:length,seed:seed,alpha:alpha===undefined?1.5:alpha}),random=makeRandom(c.seed);
 // Retain the established draw order: one shared-sign draw precedes all four models.
 var sharedU=random(),shared=sharedU<.5?-1:1,values=[],running=[],rows=[],sum=kahan(),tsum=kahan(),esum=kahan(),vsum=kahan(),ps=kahan(),maxAbs=0,discarded=0;
 for(var i=1;i<=c.n;i++){var u=c.modelId==="dependent"?sharedU:random(),x=c.modelId==="dependent"?shared:c.modelId==="bernoulli"?(u<.6?1:0):c.modelId==="pareto"?Math.exp(-Math.log1p(-u)/c.alpha):Math.tan(Math.PI*(u-.5));
  var y=Math.abs(x)<=i?x:0,s=sum(x),t=tsum(y),m=truncatedMoments(c.modelId,i,c.alpha),expected=esum(m.mean),weighted=vsum(m.variance/(i*i)),probabilitySum=ps(m.tail);
  if(y!==x)discarded++;maxAbs=Math.max(maxAbs,Math.abs(x));values.push(x);running.push(s/i);rows.push({i:i,u:u,x:x,sum:s,average:s/i,y:y,truncatedSum:t,truncatedAverage:t/i,expected:m.mean,expectedAverage:expected/i,second:m.second,variance:m.variance,tail:m.tail,weightedVarianceSum:weighted,tailProbabilitySum:probabilitySum,discarded:discarded});
 }
 return{config:c,modelId:c.modelId,values:values,running:running,rows:rows,finalMean:running[c.n-1],maxAbs:maxAbs,theory:theory(c.modelId,c.alpha),sharedU:sharedU,discarded:discarded};
}
function fourthMomentBound(n,epsilon){finite(n,1,1000000,true,"n");finite(epsilon,.001,2,false,"epsilon");var moment=.0672*n+.1728*n*(n-1),raw=moment/Math.pow(n*epsilon,4);return{n:n,epsilon:epsilon,fourth:moment,raw:raw,probabilityBound:Math.min(1,raw),chebyshev:Math.min(1,.24/(n*epsilon*epsilon))};}
function plotData(result,kind){if(kind!=="averages"&&kind!=="observations")throw new RangeError("unknown plot");var rows=result.rows,series=kind==="averages"?[
 {label:"原始平均 Sᵢ/i",key:"average",color:"#3979b8",dash:""},
 {label:"截断平均 Tᵢ/i",key:"truncatedAverage",color:"#af731a",dash:"7 4"},
 {label:"截断期望平均 ETᵢ/i",key:"expectedAverage",color:"#9360b4",dash:"2 4"}
 ]:[{label:"原始观测 Xᵢ",key:"x",color:"#3979b8",dash:""},{label:"逐项截断 Yᵢ",key:"y",color:"#af731a",dash:"7 4"}];
 var lo=0,hi=0;series.forEach(function(s){s.values=rows.map(function(r){return r[s.key];});s.values.forEach(function(v){lo=Math.min(lo,v);hi=Math.max(hi,v);});});
 var ref=kind==="averages"&&Number.isFinite(result.theory.mean)?result.theory.mean:null;if(ref!==null){lo=Math.min(lo,ref);hi=Math.max(hi,ref);}
 var pad=hi===lo?1:.08*(hi-lo);return{kind:kind,n:rows.length,series:series,ymin:lo-pad,ymax:hi+pad,reference:ref};
}
function fmt(x){if(x===null)return"未定义";if(x===Infinity)return"+∞";if(x===0)return"0";if(Math.abs(x)<.0001||Math.abs(x)>=100000)return x.toExponential(6);if(Number.isInteger(x))return String(x);return x.toFixed(7).replace(/0+$/,"").replace(/\.$/,"");}
function selfTest(){var count=0;function check(v){count++;if(!v)throw Error("self check "+count);}var a=samplePath("bernoulli",100,7),b=samplePath("bernoulli",100,7);check(JSON.stringify(a)===JSON.stringify(b));check(a.values.every(function(x){return x===0||x===1;}));Object.keys(MODELS).forEach(function(id){var p=samplePath(id,500,11);check(p.rows.length===500);check(p.running.every(Number.isFinite));});var d=samplePath("dependent",40,2);check(d.values.every(function(x){return x===d.values[0];}));check(d.running.every(function(x){return x===d.values[0];}));check(truncatedMoments("pareto",4,1.5).variance===.75);check(theory("pareto",1).mean===Infinity);check(theory("cauchy",1.5).mean===null);check(makeRandom(0)()!==makeRandom(1)());check(Math.abs(fourthMomentBound(100,.1).raw-.171744)<1e-14);return{status:"PASS",checks:count};}
function drawPlot(doc,data,id){var ns="http://www.w3.org/2000/svg";function el(tag,attrs,text){var e=doc.createElementNS(ns,tag);Object.keys(attrs||{}).forEach(function(k){e.setAttribute(k,String(attrs[k]));});if(text!==undefined)e.textContent=text;return e;}
 var svg=el("svg",{viewBox:"0 0 900 390",class:"li-chart",role:"img","aria-labelledby":id+"-title "+id+"-desc"}),x=function(i){return data.n===1?125:125+740*(i-1)/(data.n-1);},y=function(v){return 290-230*(v-data.ymin)/(data.ymax-data.ymin);};
 svg.append(el("title",{id:id+"-title"},data.kind==="averages"?"逐项平均与截断期望":"全部观测与逐项截断"),el("desc",{id:id+"-desc"},"横轴为真实整数指标；纵轴保留完整范围，不裁切、不抽稀。完整数值见下方表格。"));
 for(var j=0;j<=4;j++){var v=data.ymin+(data.ymax-data.ymin)*j/4,yy=y(v);svg.append(el("line",{x1:125,x2:865,y1:yy,y2:yy,stroke:"currentColor",opacity:.18}),el("text",{x:113,y:yy+5,"text-anchor":"end","font-size":13},fmt(v)));}
 var ticks=Array.from(new Set([1,Math.round(1+(data.n-1)/4),Math.round(1+(data.n-1)/2),Math.round(1+3*(data.n-1)/4),data.n]));
 ticks.forEach(function(i){svg.append(el("text",{x:x(i),y:320,"text-anchor":"middle","font-size":13},String(i)));});
 svg.append(el("text",{x:865,y:355,"text-anchor":"end","font-size":15},"观测指标 i"),el("text",{x:125,y:29,"font-size":18},data.kind==="averages"?"原始平均、截断平均与截断期望平均":"原始观测与截断值（离散点）"));
 data.series.forEach(function(s){if(data.kind==="averages"){svg.append(el("polyline",{"data-series":s.key,points:s.values.map(function(v,i){return x(i+1)+","+y(v);}).join(" "),fill:"none",stroke:s.color,"stroke-width":2,"stroke-dasharray":s.dash}));if(data.n===1)svg.append(el("circle",{"data-single":s.key,cx:x(1),cy:y(s.values[0]),r:4,fill:s.color}));}
 else s.values.forEach(function(v,i){svg.append(el("circle",{"data-series":s.key,"data-i":i+1,cx:x(i+1),cy:y(v),r:s.key==="x"?3:1.7,fill:s.key==="x"?"none":s.color,stroke:s.color,"stroke-width":1.2}));});});
 if(data.reference!==null)svg.append(el("line",{"data-reference":"mean",x1:125,x2:865,y1:y(data.reference),y2:y(data.reference),stroke:"#3c8b59","stroke-width":2,"stroke-dasharray":"10 6"}));
 return svg;
}
function inject(doc){if(doc.getElementById("li-full-style"))return;var s=doc.createElement("style");s.id="li-full-style";s.textContent=[
 ".li-lab{color:var(--fg);max-width:100%;min-width:0;line-height:1.65}.li-lab *{box-sizing:border-box}.li-lab [hidden]{display:none!important}",
 ".li-lab button,.li-lab input,.li-lab select{font:inherit;color:var(--fg);background:var(--bg);border:1px solid var(--border);border-radius:6px;min-height:44px;padding:8px;max-width:100%}.li-lab button{cursor:pointer}.li-lab button[aria-pressed=true]{background:var(--accent);color:var(--bg)}.li-lab button:disabled{opacity:.55;cursor:default}",
 ".li-lab :focus-visible{outline:3px solid var(--accent);outline-offset:2px}.li-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:15px 0}.li-controls label{display:grid;gap:5px}.li-lab fieldset{min-width:0;margin:12px 0;padding:12px;border:1px solid var(--border)}.li-choices,.li-actions{display:flex;gap:8px;flex-wrap:wrap}.li-choices>*{flex:1 1 200px}",
 ".li-note{padding:10px 12px;border-left:3px solid var(--accent)}.li-feedback{min-height:2em}.li-results h4{margin-top:24px}.li-results figure{margin:15px 0}.li-region{overflow-x:auto;max-width:100%;margin:12px 0}.li-lab svg.li-chart{display:block;width:900px!important;min-width:900px;max-width:none!important;height:auto;color:var(--fg)}.li-chart text{fill:currentColor;font-family:inherit;letter-spacing:0}",
 ".li-lab table{border-collapse:collapse;min-width:900px;font-size:13px}.li-lab th,.li-lab td{border:1px solid var(--border);padding:8px;text-align:left;white-space:nowrap}.li-lab caption{padding:8px;font-weight:bold}.li-legend{display:flex;gap:15px;flex-wrap:wrap;font-size:13px}.li-legend span{display:inline-flex;align-items:center;gap:5px}.li-legend i{width:24px;border-top:3px solid}.li-results details{margin:16px 0}.li-results summary{cursor:pointer;padding:8px;min-height:44px}",
 "@media(max-width:600px){.li-controls{grid-template-columns:minmax(0,1fr)}}"
 ].join("\n");doc.head.append(s);}
function mount(container){if(!container||container.getAttribute("data-li-mounted")==="true")return;container.setAttribute("data-li-mounted","true");var doc=container.ownerDocument;inject(doc);var id="li-full-"+(++INSTANCE),selected=[null,null,null],c=Object.assign({},DEFAULTS),latest=null;
 container.innerHTML='<div class="li-lab"><h3>平均、重尾与逐项截断</h3><div class="li-controls"><label>模型<select data-key="modelId">'+Object.keys(MODELS).map(function(k){return'<option value="'+k+'">'+MODELS[k].label+'</option>';}).join("")+'</select></label><label>路径长度 n（1–5000）<input data-key="n" type="number" min="1" max="5000" step="1" value="1000"></label><label>seed（0–4294967295）<input data-key="seed" type="number" min="0" max="4294967295" step="1" value="13"></label><label data-alpha-label hidden>Pareto α（0.5–5）<input data-key="alpha" type="number" min=".5" max="5" step="any" value="1.5"></label></div><p class="li-note">先作三项预测。极端值保留在完整纵轴内，表格可横向滚动；有限回放不能证明无限序列结论。</p>'+
 [['1. 一般 i.i.d. 强大数律必须有有限方差吗？',['必须','不必，有限一阶绝对矩已够','中位数存在就够']],
 ['2. 标准 Cauchy 的平均会集中到 0 吗？',['会','不会：每个 n 仍为标准 Cauchy','超过 1000 项就会']],
 ['3. 所有 Xᵢ 都等于同一个 Z，平均是否自动趋于 EZ？',['自动','只要有方差就会','不会，平均恒为 Z']]]
 .map(function(q,i){return'<fieldset data-question="'+i+'"><legend>'+q[0]+'</legend><div class="li-choices">'+q[1].map(function(a,j){return'<button type="button" data-choice="'+j+'" aria-pressed="false">'+a+'</button>';}).join("")+'</div></fieldset>';}).join("")+
 '<div class="li-actions"><button type="button" data-action="submit" disabled>核对预测并显示完整账本</button><button type="button" data-action="reset">重置实验</button></div><p class="li-feedback" role="status" aria-live="polite"></p><div class="li-results" hidden><h4 tabindex="-1">计算结果与适用条件</h4><div data-content></div></div></div>';
 var lab=container.querySelector(".li-lab"),results=lab.querySelector(".li-results"),feedback=lab.querySelector(".li-feedback"),submit=lab.querySelector('[data-action="submit"]'),content=lab.querySelector("[data-content]");
 function read(){var o={};lab.querySelectorAll("[data-key]").forEach(function(e){var key=e.getAttribute("data-key");if(key==="modelId")o[key]=e.value;else{if(e.value.trim()==="")throw Error(key+" 不能为空");o[key]=Number(e.value);}});return config(o);}
 function table(key,title,headers,rows,detail){var region=doc.createElement("div");region.className="li-region";region.setAttribute("role","region");region.setAttribute("tabindex","0");region.setAttribute("aria-label",title+"，可左右滚动");var t=doc.createElement("table");t.setAttribute("data-table",key);
 var cap=doc.createElement("caption");cap.textContent=title;t.append(cap);var head=doc.createElement("thead"),tr=doc.createElement("tr");headers.forEach(function(x){var th=doc.createElement("th");th.scope="col";th.textContent=x;tr.append(th);});head.append(tr);t.append(head);var body=doc.createElement("tbody");rows.forEach(function(row){var r=doc.createElement("tr");row.forEach(function(v){var td=doc.createElement("td");td.textContent=typeof v==="number"||v===null?fmt(v):v;r.append(td);});body.append(r);});t.append(body);region.append(t);
 if(detail){var d=doc.createElement("details"),summary=doc.createElement("summary");summary.textContent="展开 "+rows.length+" 行："+title;d.append(summary,region);content.append(d);}else content.append(region);}
 function paragraph(text){var p=doc.createElement("p");p.className="li-note";p.textContent=text;content.append(p);}
 function render(){latest=samplePath(c.modelId,c.n,c.seed,c.alpha);var t=latest.theory,last=latest.rows[c.n-1];content.replaceChildren();
 table("status","当前完整回放",["项目","数值","范围"],[["理想总体均值",t.mean,"从分布公式得到"],["末端原始平均",latest.finalMean,"固定 seed 的有限路径"],["末端截断平均",last.truncatedAverage,"Yᵢ=Xᵢ 1{|Xᵢ|≤i}"],["最大 |Xᵢ|",latest.maxAbs,"所有 n 项"],["丢弃项数",latest.discarded,"本次回放，不是理论概率"]]);
 table("conditions","核对理想分布的条件",["条件","当前模型","推论"],[["同分布","是","逐项截断后一般不再同分布"],["相互独立",t.independent?"是":"否",t.independent?"方差可相加":"共同变量不能被平均消除"],["E|X|<∞",t.integrable?"是":"否",t.integrable?"仍须核对依赖结构":"没有有限的 i.i.d. SLLN 目标"],["总体方差",t.variance,c.modelId==="cauchy"?"均值未定义，不能定义方差":"有限方差不是一般 SLLN 的必要条件"]]);
 ["averages","observations"].forEach(function(kind){var data=plotData(latest,kind),figure=doc.createElement("figure"),region=doc.createElement("div");region.className="li-region";region.setAttribute("role","region");region.setAttribute("tabindex","0");region.setAttribute("aria-label",(kind==="averages"?"全部平均":"全部观测")+"图，可左右滚动");region.append(drawPlot(doc,data,id+"-"+kind));var legend=doc.createElement("figcaption");legend.className="li-legend";
 var ls=data.series.map(function(s){return{label:s.label,color:s.color,dash:s.dash};});if(data.reference!==null)ls.push({label:"理想总体均值 "+fmt(data.reference),color:"#3c8b59",dash:"10 6"});ls.forEach(function(s){var span=doc.createElement("span"),line=doc.createElement("i");line.style.borderColor=s.color;line.style.borderTopStyle=s.dash?"dashed":"solid";span.append(line,doc.createTextNode(s.label));legend.append(span);});figure.append(region,legend);content.append(figure);});
 paragraph("平均图连接相邻整数指标，只帮助追踪序列，不把中间位置当成额外观测。观测图只画离散点。每张图独立使用完整纵轴；极端值会压缩较小波动，表中仍可核对。");
 table("path","所有观测、均值与截断",["i","u（生成用）","Xᵢ","Sᵢ","Sᵢ/i","Yᵢ","Tᵢ","Tᵢ/i"],latest.rows.map(function(r){return[r.i,r.u,r.x,r.sum,r.average,r.y,r.truncatedSum,r.truncatedAverage];}),true);
 table("proof","逐项理论截断与证明所用和",["i","EYᵢ","EYᵢ²","Var(Yᵢ)","ETᵢ/i","P(|Xᵢ|>i)","Σⱼ≤ᵢ Var(Yⱼ)/j²","Σⱼ≤ᵢ P(|Xⱼ|>j)"],latest.rows.map(function(r){return[r.i,r.expected,r.second,r.variance,r.expectedAverage,r.tail,r.weightedVarianceSum,r.tailProbabilitySum];}),true);
 paragraph(c.modelId==="dependent"?"Xᵢ=Z，所以平均恒等于 Z。这里所有行共用同一个 u；单项方差为 1，但 Var(Sₙ)=n²，不能用 n 代替。表中的加权单项方差和不构成 SLLN 证明。":c.modelId==="cauchy"?"理想 Cauchy 原期望未定义；每个有界对称截断的期望却为 0。有限截断可以有期望，不能反推原变量有期望。":c.modelId==="pareto"?(c.alpha<=1?"理想非负 Pareto 均值为 +∞，平均 a.s. 趋于 +∞。有限 seed 回放不是这一无限极限的证明。":c.alpha<=2?"理想 Pareto 可积但无有限方差。SLLN 适用，有限样本的大幅波动不推翻 a.s. 收敛。":"理想 Pareto 均值与方差都有限；SLLN 适用，经典 CLT 也具备矩条件。"):"理想 Bernoulli 的均值为 0.6、方差为 0.24。每项绝对值不超过 1，所以逐项截断不改变任何观测。");
 paragraph("理论量属于理想分布。LCG 伪随机数和浮点变换只给可重放的有限近似；Pareto、Cauchy 回放存在有限的可生成最大幅度，不能用这条有限序列检验无限矩。");
 }
 function update(){lab.querySelector("[data-alpha-label]").hidden=lab.querySelector('[data-key="modelId"]').value!=="pareto";try{c=read();submit.disabled=selected.some(function(x){return x===null;})||!results.hidden;if(!results.hidden)render();else feedback.textContent="参数已就绪；完成预测后手动展开。";}catch(e){results.hidden=true;submit.disabled=true;feedback.textContent="参数无效："+e.message;}}
 lab.addEventListener("input",function(e){if(e.target.matches("input[data-key]"))update();});lab.addEventListener("change",function(e){if(e.target.matches("select[data-key]"))update();});
 lab.addEventListener("click",function(e){var b=e.target.closest("button");if(!b||!lab.contains(b))return;if(b.hasAttribute("data-choice")){var q=b.closest("[data-question]"),i=+q.getAttribute("data-question");selected[i]=+b.getAttribute("data-choice");q.querySelectorAll("button").forEach(function(x){x.setAttribute("aria-pressed",String(x===b));});results.hidden=true;update();return;}
 var action=b.getAttribute("data-action");if(action==="submit"){try{c=read();}catch(error){update();return;}if(selected.some(function(x){return x===null;}))return;var score=selected.reduce(function(s,x,i){return s+(x===[1,1,2][i]?1:0);},0);render();results.hidden=false;submit.disabled=true;feedback.textContent="预测 "+score+" / 3。逐项核对原始数据、截断和理论条件。";results.querySelector("h4").focus();}
 if(action==="reset"){selected=[null,null,null];lab.querySelectorAll("[data-key]").forEach(function(x){x.value=String(DEFAULTS[x.getAttribute("data-key")]);});lab.querySelectorAll("[data-choice]").forEach(function(x){x.setAttribute("aria-pressed","false");});results.hidden=true;content.replaceChildren();latest=null;update();lab.querySelector("[data-choice]").focus();}});
 update();
}
return{MODELS:MODELS,DEFAULTS:DEFAULTS,makeRandom:makeRandom,theory:theory,truncatedMoments:truncatedMoments,samplePath:samplePath,fourthMomentBound:fourthMomentBound,plotData:plotData,drawPlot:drawPlot,format:fmt,mount:mount,selfTest:selfTest};
});
