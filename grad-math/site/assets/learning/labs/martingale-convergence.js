(function(root,factory){
  "use strict";
  var api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root&&root.CourseLearning)root.CourseLearning.register("martingale-convergence",api.mount);
  if(typeof module==="object"&&module.exports&&typeof require==="function"&&require.main===module)console.log(JSON.stringify(api.selfTest()));
})(typeof window!=="undefined"?window:null,function(){
"use strict";
var DEFAULTS=Object.freeze({model:"spike",n:8,B:5,K:1});
var MODES=Object.freeze({spike:"模型 A：稀有尖峰","absorbed-walk":"模型 B：有限走廊"});
var MODEL_A=Object.freeze({id:"spike",label:MODES.spike,limit:"0（a.s.）",l1:"否"});
var MODEL_B=Object.freeze({id:"absorbed-walk",label:MODES["absorbed-walk"],limit:"随机边界 ±B",l1:"是"});
var INSTANCE=0;
function finite(x,lo,hi,integer,name){
  if(typeof x!=="number"||!Number.isFinite(x)||x<lo||x>hi||(integer&&!Number.isInteger(x)))throw RangeError(name+" must be "+(integer?"an integer ":"")+"in ["+lo+", "+hi+"]");
  return x;
}
function config(o){
  if(!o||typeof o!=="object"||Array.isArray(o))throw TypeError("configuration required");
  var c=Object.assign({},DEFAULTS,o);
  if(typeof c.model!=="string"||!Object.hasOwn(MODES,c.model))throw RangeError("unknown model");
  finite(c.n,0,1000,true,"n");finite(c.B,1,24,true,"B");finite(c.K,0,Number.MAX_VALUE,false,"K");return c;
}
function sum(xs){var s=0,c=0;xs.forEach(function(x){var y=x-c,t=s+y;c=(t-s)-y;s=t;});return s;}
function modelA(n,K){
  finite(n,0,1000,true,"n");if(K===undefined)K=1;finite(K,0,Number.MAX_VALUE,false,"K");
  var h=Math.pow(2,n),p=Math.pow(2,-n),above=h>K;
  return{id:"spike",n:n,scale:K,spikeHeight:h,spikeProbability:p,zeroProbability:1-p,expectation:1,limit:0,l1Gap:1,tailProbability:above?p:0,tailExpectation:above?1:0,ui:false};
}
function nextDistribution(p){
  var q=Array(p.length).fill(0);q[0]=p[0];q[q.length-1]=p[p.length-1];
  for(var j=1;j<p.length-1;j++){q[j-1]+=p[j]/2;q[j+1]+=p[j]/2;}return q;
}
function walkRecord(p,B,t,K){
  var states=p.map(function(prob,i){var x=i-B;return{x:x,probability:prob,meanContribution:x*prob,absoluteContribution:Math.abs(x)*prob,secondContribution:x*x*prob,tailContribution:Math.abs(x)>K?Math.abs(x)*prob:0,l1Contribution:prob*((B-x)*(B+x)/B),conditionalPositive:(B+x)/(2*B)};});
  return{t:t,states:states,distribution:p.slice(),negativeProbability:p[0],positiveProbability:p[2*B],absorbedMass:p[0]+p[2*B],transientMass:sum(p.slice(1,-1)),mean:sum(states.map(function(r){return r.meanContribution;})),absoluteMean:sum(states.map(function(r){return r.absoluteContribution;})),second:sum(states.map(function(r){return r.secondContribution;})),l1Gap:sum(states.map(function(r){return r.l1Contribution;})),tailExpectation:sum(states.map(function(r){return r.tailContribution;})),tailProbability:sum(states.map(function(r){return Math.abs(r.x)>K?r.probability:0;}))};
}
function walkDistribution(n,B){
  finite(n,0,1000,true,"n");finite(B,1,24,true,"B");
  var p=Array(2*B+1).fill(0);p[B]=1;for(var t=0;t<n;t++)p=nextDistribution(p);return p;
}
function modelB(n,B,K){
  if(K===undefined)K=1;finite(K,0,Number.MAX_VALUE,false,"K");
  var r=walkRecord(walkDistribution(n,B),B,n,K);
  return Object.assign(r,{id:"absorbed-walk",n:n,B:B,scale:K,limitPositiveProbability:.5,limitNegativeProbability:.5,limitMean:0,ui:true});
}
function snapshot(o){
  var c=config(o),rows=[],states,joint=[],prefix=0,final;
  if(c.model==="spike"){
    for(var t=0;t<=c.n;t++){var a=modelA(t,c.K);prefix=Math.max(prefix,a.tailExpectation);rows.push({t:t,mean:1,l1Gap:1,tailExpectation:a.tailExpectation,prefixTail:prefix,spikeHeight:a.spikeHeight,spikeProbability:a.spikeProbability,zeroProbability:a.zeroProbability});}
    final=modelA(c.n,c.K);states=[{x:0,probability:final.zeroProbability,meanContribution:0,tailContribution:0},{x:final.spikeHeight,probability:final.spikeProbability,meanContribution:1,tailContribution:final.tailExpectation}];
    return{config:c,rows:rows,states:states,joint:joint,final:final,prefixTail:prefix,wholeTailSup:1};
  }
  var p=Array(2*c.B+1).fill(0);p[c.B]=1;
  for(var t=0;t<=c.n;t++){
    var r=walkRecord(p,c.B,t,c.K);prefix=Math.max(prefix,r.tailExpectation);
    rows.push({t:t,mean:r.mean,absoluteMean:r.absoluteMean,second:r.second,l1Gap:r.l1Gap,tailExpectation:r.tailExpectation,prefixTail:prefix,transientMass:r.transientMass,absorbedMass:r.absorbedMass});
    if(t===c.n)final=r;else p=nextDistribution(p);
  }
  states=final.states;
  states.forEach(function(r){[-c.B,c.B].forEach(function(z){var conditional=z>0?r.conditionalPositive:1-r.conditionalPositive,probability=r.probability*conditional;joint.push({x:r.x,z:z,stateProbability:r.probability,conditionalProbability:r.probability===0?null:conditional,jointProbability:probability,terminalContribution:z*probability,distanceContribution:Math.abs(z-r.x)*probability});});});
  return{config:c,rows:rows,states:states,joint:joint,final:final,prefixTail:prefix,wholeTailSup:c.K<c.B?c.B:0};
}
function crossing(path,a,b,w0){
  if(!Array.isArray(path)||path.length<1||path.length>1001)throw TypeError("dense finite path required");
  finite(a,-1e6,1e6,false,"a");finite(b,-1e6,1e6,false,"b");if(a>=b)throw RangeError("a < b required");if(w0===undefined)w0=0;finite(w0,-1e6,1e6,false,"initial capital");
  for(var i=0;i<path.length;i++){if(!Object.hasOwn(path,i))throw TypeError("sparse path");finite(path[i],-1e6,1e6,false,"path");}
  var holding=path[0]<=a,gain=0,U=0,rows=[{t:0,x:path[0],stake:0,increment:0,gain:0,capital:w0,upcrossings:0,lower:-Math.max(a-path[0],0),holding:holding}];
  for(var t=1;t<path.length;t++){var H=holding?1:0,dx=path[t]-path[t-1];gain+=H*dx;
    if(holding&&path[t]>=b){U++;holding=false;}else if(!holding&&path[t]<=a)holding=true;
    rows.push({t:t,x:path[t],stake:H,increment:dx,gain:gain,capital:w0+gain,upcrossings:U,lower:(b-a)*U-Math.max(a-path[t],0),holding:holding});
  }return{a:a,b:b,w0:w0,rows:rows};
}
function fmt(x){if(x===null)return"零概率状态，条件值未定义";if(x===0)return"0";if(Math.abs(x)<.0001||Math.abs(x)>=100000)return x.toExponential(6);if(Number.isInteger(x))return String(x);return x.toFixed(7).replace(/0+$/,"").replace(/\.$/,"");}
function plots(s){
  var c=s.config,first={title:"全部时刻：L¹ 距离与固定 K 的尾部期望",xlabel:"有限时刻 t",xs:s.rows.map(function(r){return r.t;}),pointsOnly:false,series:[
    {key:"gap",label:"E|Xₜ−X∞|",values:s.rows.map(function(r){return r.l1Gap;}),color:"#3979b8",dash:""},
    {key:"tail",label:"E[|Xₜ| 1{|Xₜ|>K}]",values:s.rows.map(function(r){return r.tailExpectation;}),color:"#af731a",dash:"7 4"}]},
  second={title:"当前 n 的完整状态概率",xlabel:"状态值 x（真实数值间距）",xs:s.states.map(function(r){return r.x;}),pointsOnly:true,series:[{key:"probability",label:"P(Xₙ=x)，解析或有限递推",values:s.states.map(function(r){return r.probability;}),color:"#3979b8",dash:""}]};
  return[first,second].map(function(d){var hi=0;d.series.forEach(function(v){v.values.forEach(function(x){hi=Math.max(hi,x);});});d.ymin=0;d.ymax=hi===0?1:hi*1.08;d.xmin=d.xs[0];d.xmax=d.xs[d.xs.length-1];return d;});
}
function selfTest(){
  var checks=0;function check(b){checks++;if(!b)throw Error("self "+checks);}
  check(modelA(0).spikeProbability===1);check(modelA(0).tailExpectation===0);check(modelA(1000,Math.pow(2,1000)).tailExpectation===0);
  check(modelA(1000).expectation===1);check(modelB(2,2).distribution[0]===.25);check(modelB(1,1).l1Gap===0);
  check(snapshot({n:2,B:2,model:"absorbed-walk"}).wholeTailSup===2);
  var c=crossing([0,2,0,2,-1],0,2);check(c.rows[4].upcrossings===2);check(c.rows[4].gain===4);
  return{status:"PASS",checks:checks,models:2};
}
function drawPlot(doc,d,id){var ns="http://www.w3.org/2000/svg";function e(tag,attrs,text){var n=doc.createElementNS(ns,tag);Object.keys(attrs||{}).forEach(function(k){n.setAttribute(k,String(attrs[k]));});if(text!==undefined)n.textContent=text;return n;}var svg=e("svg",{class:"mc-chart",viewBox:"0 0 900 390",role:"img","aria-labelledby":id+"-title "+id+"-desc"}),x=function(v){return d.xmax===d.xmin?125:125+740*(v-d.xmin)/(d.xmax-d.xmin);},y=function(v){return 290-230*(v-d.ymin)/(d.ymax-d.ymin);};
svg.append(e("title",{id:id+"-title"},d.title),e("desc",{id:id+"-desc"},"完整数据，不抽稀、不裁切；所有数值在相邻账表中。横轴使用真实时间或位置。"),e("text",{x:125,y:29,"font-size":18},d.title));
for(var j=0;j<=4;j++){var v=d.ymin+(d.ymax-d.ymin)*j/4,yy=y(v);svg.append(e("line",{x1:125,x2:865,y1:yy,y2:yy,stroke:"currentColor",opacity:.18}),e("text",{x:113,y:yy+5,"text-anchor":"end","font-size":13},fmt(v)));}
var ticks=Array.from(new Set([d.xmin,Math.round(d.xmin+(d.xmax-d.xmin)/4),Math.round(d.xmin+(d.xmax-d.xmin)/2),Math.round(d.xmin+3*(d.xmax-d.xmin)/4),d.xmax]));ticks.forEach(function(v){svg.append(e("text",{x:x(v),y:320,"text-anchor":v===d.xmin?"start":v===d.xmax?"end":"middle","font-size":13},fmt(v)));});svg.append(e("text",{x:865,y:355,"text-anchor":"end","font-size":15},d.xlabel));
d.series.forEach(function(s){if(!d.pointsOnly)svg.append(e("polyline",{"data-series":s.key,points:s.values.map(function(v,i){return x(d.xs[i])+","+y(v);}).join(" "),fill:"none",stroke:s.color,"stroke-width":2,"stroke-dasharray":s.dash}));s.values.forEach(function(v,i){svg.append(e("circle",{"data-series":s.key,"data-index":i,cx:x(d.xs[i]),cy:y(v),r:d.pointsOnly?3:1.8,fill:s.color}));});});return svg;}
function inject(doc){if(doc.getElementById("mc-full-style"))return;var s=doc.createElement("style");s.id="mc-full-style";s.textContent=[
 ".mc-lab{color:var(--fg);max-width:100%;min-width:0;line-height:1.65}.mc-lab *{box-sizing:border-box}.mc-lab [hidden]{display:none!important}.mc-lab button,.mc-lab input,.mc-lab select{font:inherit;max-width:100%;color:var(--fg);background:var(--bg);border:1px solid var(--border);border-radius:6px;min-height:44px;padding:8px}.mc-lab button{cursor:pointer}.mc-lab button[aria-pressed=true]{background:var(--accent);color:var(--bg)}.mc-lab button:disabled{opacity:.55;cursor:default}.mc-lab :focus-visible{outline:3px solid var(--accent);outline-offset:2px}",
 ".mc-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:15px 0}.mc-controls label{display:grid;gap:5px}.mc-lab fieldset{min-width:0;margin:12px 0;padding:12px;border:1px solid var(--border)}.mc-choices,.mc-actions{display:flex;gap:8px;flex-wrap:wrap}.mc-choices>*{flex:1 1 180px}.mc-note{padding:10px 12px;border-left:3px solid var(--accent)}.mc-feedback{min-height:2em}",
 ".mc-results h4{margin-top:24px}.mc-results figure{margin:15px 0}.mc-region{max-width:100%;overflow-x:auto;margin:12px 0}.mc-lab svg.mc-chart{display:block;width:900px!important;min-width:900px;max-width:none!important;height:auto;color:var(--fg)}.mc-chart text{fill:currentColor;font-family:inherit;letter-spacing:0}.mc-legend{display:flex;gap:15px;flex-wrap:wrap;font-size:13px}.mc-legend span{display:inline-flex;align-items:center;gap:5px}.mc-legend i{width:24px;border-top:3px solid}.mc-lab table{border-collapse:collapse;min-width:900px;font-size:13px}.mc-lab th,.mc-lab td{padding:8px;border:1px solid var(--border);white-space:nowrap;text-align:left}.mc-lab caption{padding:8px;font-weight:bold}.mc-results details{margin:16px 0}.mc-results summary{cursor:pointer;min-height:44px;padding:8px}@media(max-width:600px){.mc-controls{grid-template-columns:minmax(0,1fr)}}"
 ].join("\n");doc.head.append(s);}
function ledgers(s){
  var c=s.config,f=s.final,list=[],summary;
  if(c.model==="spike"){
    summary=[["当前期望",1,"每个有限时刻都为 1"],["a.s. 极限",0,"由首次 T 的路径证明"],["到极限的 L¹ 距离",1,"不会随 n 消失"],["当前尾部概率",f.tailProbability,"严格 Xₙ>K"],["当前尾部期望",f.tailExpectation,"严格 Xₙ>K"],["有限前缀尾部最大值",s.prefixTail,"只取 0≤t≤n"],["全部时刻尾部上确界",s.wholeTailSup,"对任何有限 K 都是 1"],["全族 UI","否","有限前缀为 0 不能证明 UI"]];
    list.push({key:"time",title:"从 0 到 n 的全部解析时刻",headers:["t","尖峰高度","尖峰概率","零点概率","期望","L¹ 距离","当前尾部期望","前缀尾部最大值"],rows:s.rows.map(function(r){return[r.t,r.spikeHeight,r.spikeProbability,r.zeroProbability,r.mean,r.l1Gap,r.tailExpectation,r.prefixTail];}),detail:true});
    list.push({key:"states",title:"两个状态的概率与均值贡献",headers:["状态值","概率","均值贡献","尾部期望贡献"],rows:s.states.map(function(r){return[r.x,r.probability,r.meanContribution,r.tailContribution];}),detail:true});
  }else{
    summary=[["期望（解析）",0,"对称性；每期均为 0"],["均值求值残差",f.mean,"单列浮点求和残差"],["a.s. 极限","随机边界 −B 或 +B","各有 1/2 概率"],["到终点的 L¹ 距离",f.l1Gap,"按联合分布加权，不等于未吸收概率"],["未吸收概率",f.transientMass,"当前 n 的有限量"],["已吸收概率",f.absorbedMass,"两个冻结边界"],["当前尾部概率",f.tailProbability,"严格 |Xₙ|>K"],["当前尾部期望",f.tailExpectation,"严格 |Xₙ|>K"],["有限前缀尾部最大值",s.prefixTail,"只取 0≤t≤n"],["全部时刻尾部上确界",s.wholeTailSup,"K<B 为 B；K≥B 为 0"],["全族 UI","是","固定 B 后一致有界"]];
    list.push({key:"time",title:"从 0 到 n 的全部有限递推",headers:["t","均值残差","绝对均值","二阶矩","L¹ 距离","未吸收概率","已吸收概率","尾部期望","前缀尾部最大值"],rows:s.rows.map(function(r){return[r.t,r.mean,r.absoluteMean,r.second,r.l1Gap,r.transientMass,r.absorbedMass,r.tailExpectation,r.prefixTail];}),detail:true});
    list.push({key:"states",title:"所有当前状态与各项贡献",headers:["s","概率","均值贡献","绝对均值贡献","二阶矩贡献","L¹ 距离贡献","尾部期望贡献"],rows:s.states.map(function(r){return[r.x,r.probability,r.meanContribution,r.absoluteContribution,r.secondContribution,r.l1Contribution,r.tailContribution];}),detail:true});
    list.push({key:"joint",title:"当前状态与未来终点的完整联合账",headers:["当前 s","终点 Z","当前状态概率","终点条件概率","联合概率","终值均值贡献","距离贡献"],rows:s.joint.map(function(r){return[r.x,r.z,r.stateProbability,r.conditionalProbability,r.jointProbability,r.terminalContribution,r.distanceContribution];}),detail:true});
  }
  list.unshift({key:"summary",title:"当前值、有限前缀与无限族分开",headers:["项目","数值 / 结论","依据与范围"],rows:summary,detail:false});return list;
}
function mount(container){
  if(!container||container.getAttribute("data-mc-mounted")==="true")return;
  container.setAttribute("data-mc-mounted","true");var doc=container.ownerDocument;inject(doc);
  var id="mc-full-"+(++INSTANCE),selected=[null,null,null,null],c=Object.assign({},DEFAULTS);
  function numberControl(key,label,min,max,step){return'<label>'+label+'<input data-key="'+key+'" type="number" min="'+min+'" max="'+max+'" step="'+step+'" value="'+DEFAULTS[key]+'"></label>';}
  container.innerHTML='<div class="mc-lab"><h3>鞅收敛：当前值、有限前缀和全族尾部</h3><div class="mc-controls"><label>模型<select data-key="model">'+Object.keys(MODES).map(function(k){return'<option value="'+k+'">'+MODES[k]+'</option>';}).join("")+'</select></label>'+numberControl("n","有限时刻 n（0–1000）",0,1000,1)+numberControl("B","固定边界半宽 B（1–24，仅模型 B 使用）",1,24,1)+numberControl("K","尾部阈值 K（有限非负数）",0,Number.MAX_VALUE,"any")+'</div><p class="mc-note">没有随机样本或 seed。极小非零概率用科学记数法列出；两图和全部表格使用完整有限数据。</p>'+
  [["1. 尖峰鞅的 a.s. 极限是什么？",["0","1"]],["2. 尖峰鞅是否 L¹ 收敛到这个极限？",["是","否"]],["3. 有界吸收走停的极限是什么？",["恒为 0","随机边界 −B 或 +B"]],["4. 固定 B 的吸收走停是否 L¹ 收敛？",["是","否"]]].map(function(q,i){return'<fieldset data-question="'+i+'"><legend>'+q[0]+'</legend><div class="mc-choices">'+q[1].map(function(a,j){return'<button type="button" data-choice="'+j+'" aria-pressed="false">'+a+'</button>';}).join("")+'</div></fieldset>';}).join("")+
  '<div class="mc-actions"><button type="button" data-action="submit" disabled>核对四项预测并揭示账本</button><button type="button" data-action="reset">重置实验</button></div><p class="mc-feedback" role="status" aria-live="polite"></p><div class="mc-results" hidden><h4 tabindex="-1">有限计算与无限时结论的边界</h4><div data-content></div></div></div>';
  var lab=container.querySelector(".mc-lab"),results=lab.querySelector(".mc-results"),submit=lab.querySelector('[data-action="submit"]'),feedback=lab.querySelector(".mc-feedback"),content=lab.querySelector("[data-content]");
  function read(){var o={};lab.querySelectorAll("[data-key]").forEach(function(e){var k=e.getAttribute("data-key");if(k==="model")o[k]=e.value;else{if(e.value.trim()==="")throw Error(k+" 不能为空");o[k]=Number(e.value);}});return config(o);}
  function note(x){var p=doc.createElement("p");p.className="mc-note";p.textContent=x;content.append(p);}
  function region(title){var r=doc.createElement("div");r.className="mc-region";r.setAttribute("role","region");r.tabIndex=0;r.setAttribute("aria-label",title+"，可左右滚动");return r;}
  function table(d){
    var r=region(d.title),t=doc.createElement("table");t.setAttribute("data-table",d.key);var caption=doc.createElement("caption");caption.textContent=d.title;t.append(caption);
    var head=doc.createElement("thead"),tr=doc.createElement("tr");d.headers.forEach(function(x){var th=doc.createElement("th");th.scope="col";th.textContent=x;tr.append(th);});head.append(tr);t.append(head);
    var body=doc.createElement("tbody");d.rows.forEach(function(row){var tr=doc.createElement("tr");row.forEach(function(x){var td=doc.createElement("td");td.textContent=typeof x==="number"||x===null?fmt(x):x;tr.append(td);});body.append(tr);});t.append(body);r.append(t);
    if(d.detail){var details=doc.createElement("details"),title=doc.createElement("summary");title.textContent="展开 "+d.rows.length+" 行："+d.title;details.append(title,r);content.append(details);}else content.append(r);
  }
  function render(){
    var s=snapshot(c),ts=ledgers(s);content.replaceChildren();table(ts[0]);
    note("固定 K 后，有限前缀只覆盖 0 到当前 n；全部时刻的上确界来自模型证明。判断 UI 必须最后让 K 趋向无穷，不能把某个有限 n 的零尾部当作结论。");
    if(c.model==="spike")note("尖峰高度最高可到 2¹⁰⁰⁰，仍可在本实验数值范围表示。零点概率 1−2⁻ⁿ 可能舍入为 1，尖峰概率仍单独保留为非零数；图上的小点面积不是其概率，读纵坐标及表格。");
    else note("联合账保留所有状态，包括零质量状态。零质量行的条件概率未定义，联合概率为零。L¹ 距离按全部联合概率加权；边界吸收后的质量继续保留。");
    plots(s).forEach(function(d,i){var figure=doc.createElement("figure"),r=region(d.title);r.append(drawPlot(doc,d,id+"-"+i));figure.append(r);
      var caption=doc.createElement("figcaption");caption.className="mc-legend";d.series.forEach(function(s){var span=doc.createElement("span"),line=doc.createElement("i");line.style.borderColor=s.color;if(s.dash)line.style.borderTopStyle="dashed";span.append(line,doc.createTextNode(s.label));caption.append(span);});figure.append(caption);content.append(figure);
    });
    ts.slice(1).forEach(table);results.hidden=false;
  }
  function validate(){try{c=read();return true;}catch(e){results.hidden=true;feedback.textContent="输入无效："+e.message;return false;}}
  function complete(){return selected.every(function(x){return x!==null;});}
  function state(){var ok=validate();submit.disabled=!ok||!complete()||!results.hidden;return ok;}
  lab.querySelectorAll("[data-choice]").forEach(function(b){b.addEventListener("click",function(){var field=b.closest("[data-question]"),i=Number(field.getAttribute("data-question"));selected[i]=Number(b.getAttribute("data-choice"));field.querySelectorAll("[data-choice]").forEach(function(x){x.setAttribute("aria-pressed",x===b?"true":"false");});results.hidden=true;if(state())feedback.textContent=complete()?"四项已填，请点击核对。":"请完成四项预测。";});});
  lab.querySelectorAll("[data-key]").forEach(function(e){e.addEventListener(e.tagName==="SELECT"?"change":"input",function(){var visible=!results.hidden;if(state()){if(visible){render();submit.disabled=true;}else feedback.textContent=complete()?"输入已恢复，请手动核对。":"请先完成四项预测。";}});});
  submit.addEventListener("click",function(){if(!state()||!complete())return;render();submit.disabled=true;var correct=selected.filter(function(x,i){return x===[0,1,1,0][i];}).length;feedback.textContent="预测 "+correct+" / 4。请对照有限账与模型证明。";results.querySelector("h4").focus();});
  lab.querySelector('[data-action="reset"]').addEventListener("click",function(){selected=[null,null,null,null];lab.querySelectorAll("[data-choice]").forEach(function(b){b.setAttribute("aria-pressed","false");});lab.querySelectorAll("[data-key]").forEach(function(e){e.value=String(DEFAULTS[e.getAttribute("data-key")]);});results.hidden=true;state();feedback.textContent="已复位，请重新预测。";lab.querySelector("[data-choice]").focus();});state();
}
return{DEFAULTS:DEFAULTS,MODES:MODES,MODEL_A:MODEL_A,MODEL_B:MODEL_B,config:config,modelA:modelA,modelB:modelB,walkDistribution:walkDistribution,snapshot:snapshot,crossing:crossing,plots:plots,ledgers:ledgers,fmt:fmt,selfTest:selfTest,mount:mount};
});
