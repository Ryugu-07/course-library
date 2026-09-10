(function(root,factory){
 "use strict";const api=factory();
 if(typeof module==="object"&&module.exports){module.exports=api;if(typeof require==="function"&&require.main===module)console.log("measure-expectation self-test: PASS ("+api.selfTest().checks+" checks)");}
 if(root.CourseLearning)root.CourseLearning.register("measure-expectation",api.mount);
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const C=6/(Math.PI*Math.PI),ATOMS=Object.freeze([{x:0,p:.5},{x:1,p:.25},{x:2,p:.125},{x:4,p:.125}].map(Object.freeze));
 const MODELS=Object.freeze({
  atoms:{label:"原子：有限分布",description:"P(X=0,1,2,4)=(1/2,1/4,1/8,1/8)，K 表示数值上限",kind:"finite"},
  density:{label:"密度：Exp(1)",description:"同一指数分布，比较丢弃尾部与封顶；T 是积分上限",kind:"density"},
  tail:{label:"尾积分：Exp(1)",description:"尾面积等于 E[min(X,T)]，无需密度；本例有密度可作对照",kind:"tail"},
  positive:{label:"正重尾：X=J²",description:"P(J=k)=c/k²，c=6/π²；K 是数值上限",kind:"positive"},
  signed:{label:"变号重尾：Y=(−1)ᴶJ",description:"K 是索引截断 J≤K，有限部分和与原期望分开",kind:"signed"},
  spike:{label:"尖峰族：一致可积",description:"Xₙ=n^α 1{0<U<1/n}，U 为同一个均匀变量；M 是尾部高度阈值",kind:"spike"}
 });
 Object.values(MODELS).forEach(Object.freeze);
 const DEFAULTS={modelId:"atoms",K:4,T:2,steps:160,n:16,alpha:.5,M:4};
 const PRESETS=Object.freeze(Object.keys(MODELS).map(id=>Object.freeze({id,label:MODELS[id].label,...DEFAULTS,modelId:id,K:id==="positive"||id==="signed"?100:4})));
 function finite(v,label){if(typeof v!=="number"||!Number.isFinite(v))throw new TypeError(label+" must be a finite number");return v;}
 function range(v,lo,hi,label){finite(v,label);if(v<lo||v>hi)throw new RangeError(label+" outside ["+lo+","+hi+"]");return v;}
 function integer(v,lo,hi,label){range(v,lo,hi,label);if(!Number.isInteger(v))throw new TypeError(label+" must be an integer");return v;}
 function sum(values){let s=0,c=0;for(const x of values){const y=x-c,t=s+y;c=(t-s)-y;s=t;}return s;}
 function atomsChecked(atoms=ATOMS,nonnegative=false){
  if(!Array.isArray(atoms)||!atoms.length)throw new TypeError("nonempty atoms required");
  for(let i=0;i<atoms.length;i++){const a=atoms[i];if(!a||typeof a!=="object")throw new TypeError("atom required");finite(a.x,"atom x");range(a.p,0,1,"atom probability");if(nonnegative&&a.x<0)throw new RangeError("nonnegative atoms required");}
  if(Math.abs(sum(atoms.map(a=>a.p))-1)>8*Number.EPSILON)throw new RangeError("probabilities must sum to one to input precision");
  return atoms;
 }
 function atomProbability(atoms=ATOMS){return sum(atomsChecked(atoms).map(a=>a.p));}
 function atomExpectation(atoms=ATOMS){return finite(sum(atomsChecked(atoms).map(a=>a.x*a.p)),"atom expectation");}
 function atomTruncation(cap,atoms=ATOMS){range(cap,0,1e6,"cap");return sum(atomsChecked(atoms,true).map(a=>Math.min(a.x,cap)*a.p));}
 function densityValue(x){finite(x,"x");return x<0?0:Math.exp(-x);}
 function survivalValue(modelId,t){if(modelId!=="tail"&&modelId!=="density")throw new RangeError("exponential model required");range(t,0,100,"time");return Math.exp(-t);}
 function finiteDensity(T){
  if(T===0)return 0;
  if(T<.5){
   let term=.5,total=term;
   for(let n=1;n<80;n++){term*=(-T/n)*(n+1)/(n+2);const next=total+term;if(next===total)break;total=next;}
   return T*(T*total);
  }
  return -Math.expm1(-T)-T*Math.exp(-T);
 }
 function quadrature(upper,steps,kind){
  range(upper,0,100,"upper");integer(steps,1,2000,"steps");
  const rows=[];let normalizedTotal=0,compensation=0,total=0;
  const rescale=v=>kind==="density"?upper*(upper*(v/steps)):upper*(v/steps);
  for(let i=0;i<steps;i++){
   const fraction=(i+.5)/steps,midpoint=upper*fraction,exponential=Math.exp(-midpoint);
   const normalized=(kind==="density"?fraction:1)*exponential,integrand=(kind==="density"?midpoint:1)*exponential;
   const y=normalized-compensation,next=normalizedTotal+y;
   compensation=(next-normalizedTotal)-y;normalizedTotal=next;total=rescale(normalizedTotal);
   rows.push({index:i+1,left:upper*(i/steps),right:upper*((i+1)/steps),midpoint,integrand,area:rescale(normalized),cumulative:total});
  }
  const exactFinite=kind==="density"?finiteDensity(upper):-Math.expm1(-upper);
  const missingTail=(kind==="density"?1+upper:1)*Math.exp(-upper);
  return {upper,steps,value:total,exactFinite,missingTail,exact:1,error:total-exactFinite,midpointErrorBound:upper**3/((kind==="density"?12:24)*steps**2),rows};
 }
 function densityExpectation(upper,steps=240){return quadrature(upper,steps,"density");}
 function tailIntegral(modelId,upper,steps=240){if(modelId!=="tail"&&modelId!=="density")throw new RangeError("exponential model required");return quadrature(upper,steps,"tail");}
 function positiveTruncation(cap){
  range(cap,0,1e6,"cap");let cutoff=Math.floor(Math.sqrt(cap));
  while(cutoff*cutoff>cap)cutoff--;while((cutoff+1)**2<=cap)cutoff++;
  const terms=Array.from({length:cutoff},(_,i)=>1/(i+1)**2);
  const tailMass=1-C*sum(terms),observedTerms=C*cutoff;
  return {cap,cutoff,observedTerms,tailMass,value:observedTerms+cap*tailMass,exact:Infinity};
 }
 function signedPartial(n){
  integer(n,0,10000,"index cutoff");
  const positive=sum(Array.from({length:Math.floor(n/2)},(_,i)=>C/(2*i+2)));
  const negativeMagnitude=sum(Array.from({length:Math.ceil(n/2)},(_,i)=>C/(2*i+1)));
  const finitePartial=sum(Array.from({length:n},(_,i)=>(i%2===0?-1:1)*C/(i+1)));
  return {n,positive,negativeMagnitude,absolute:positive+negativeMagnitude,finitePartial,signed:null,exact:null,orderedLimit:-C*Math.LN2};
 }
 function spikeSnapshot(n,alpha,M){
  integer(n,1,400,"n");range(M,0,100,"M");
  if(![0,.5,1,1.5].includes(alpha))throw new RangeError("unsupported alpha");
  // Compare integer powers with the exact square of the input binary64 threshold.
  const dv=new DataView(new ArrayBuffer(8));dv.setFloat64(0,M);
  const bits=dv.getBigUint64(0),exp=Number((bits>>52n)&2047n),mant=(bits&((1n<<52n)-1n))+(exp?1n<<52n:0n),power=2*(exp?exp-1075:-1074);
  const square=mant*mant,floorSquare=Number(power<0?square>>BigInt(-power):square<<BigInt(power));
  const rows=Array.from({length:n},(_,i)=>{
   const k=i+1,height=k**alpha,width=1/k,expectation=k**(alpha-1);
   const above=alpha===0?1>M:alpha===.5?k>floorSquare:alpha===1?k>M:k**3>floorSquare;
   return {n:k,height,width,expectation,tailExpectation:above?expectation:0};
  });
  const finiteTailMaximum=Math.max(...rows.map(r=>r.tailExpectation));
  let infiniteTailSupremum;
  if(alpha===0)infiniteTailSupremum=M<1?1:0;
  else if(alpha===.5)infiniteTailSupremum=1/Math.sqrt(floorSquare+1);
  else if(alpha===1)infiniteTailSupremum=1;
  else infiniteTailSupremum=Infinity;
  return {n,alpha,M,rows,current:rows[n-1],finiteTailMaximum,infiniteTailSupremum,uniformlyIntegrable:alpha<1,almostSureLimit:0,expectationLimit:alpha<1?0:alpha===1?1:Infinity};
 }
 function normalizeConfig(config={}){
  if(!config||typeof config!=="object"||Array.isArray(config))throw new TypeError("config object required");
  const s={...DEFAULTS,...config};
  if(!Object.hasOwn(MODELS,s.modelId))throw new RangeError("unknown model");
  integer(s.K,0,400,"K");range(s.T,0,12,"T");integer(s.steps,1,600,"steps");integer(s.n,1,400,"n");range(s.M,0,100,"M");
  if(![0,.5,1,1.5].includes(s.alpha))throw new RangeError("unsupported alpha");
  return s;
 }
 function expectationSnapshot(config){
  const state=normalizeConfig(config),model=MODELS[state.modelId],s={...state,label:model.label,kind:model.kind,atoms:null,density:null,tail:null,positive:null,signed:null,spike:null,finiteValue:null,exact:null,series:[]};
  if(state.modelId==="atoms"){
   s.atoms={probability:atomProbability(),exact:atomExpectation(),truncated:atomTruncation(state.K),rows:ATOMS.map(a=>({...a,clipped:Math.min(a.x,state.K),contribution:Math.min(a.x,state.K)*a.p}))};s.finiteValue=s.atoms.truncated;s.exact=s.atoms.exact;
  }else if(state.modelId==="density"||state.modelId==="tail"){
   s.density=densityExpectation(state.T,state.steps);s.tail=tailIntegral(state.modelId,state.T,state.steps);
   s.finiteValue=state.modelId==="density"?s.density.value:s.tail.value;s.exact=1;
   s.series=Array.from({length:81},(_,i)=>{const t=state.T*i/80;return {x:t,densityIntegrand:t*Math.exp(-t),survival:Math.exp(-t),densityIntegral:finiteDensity(t),tailIntegral:-Math.expm1(-t)};});
  }else if(state.modelId==="positive"){
   s.positive=positiveTruncation(state.K);s.finiteValue=s.positive.value;s.exact=Infinity;
   s.series=Array.from({length:state.K+1},(_,k)=>positiveTruncation(k));
  }else if(state.modelId==="signed"){
   s.signed=signedPartial(state.K);s.finiteValue=s.signed.finitePartial;s.exact=null;
   s.series=Array.from({length:state.K+1},(_,k)=>signedPartial(k));
  }else{
   s.spike=spikeSnapshot(state.n,state.alpha,state.M);s.finiteValue=s.spike.current.expectation;s.exact=s.spike.expectationLimit;s.series=s.spike.rows;
  }
  return s;
 }
 function selfTest(){
  let checks=0;const ck=(v)=>{checks++;if(!v)throw Error("measure-expectation self test "+checks);};
  ck(atomProbability()===1);ck(atomExpectation()===1);ck(atomTruncation(1)<atomTruncation(4));
  const d=densityExpectation(12,600),t=tailIntegral("tail",12,600);
  ck(Math.abs(d.value-1)<.01);ck(Math.abs(d.exactFinite+d.missingTail-1)<1e-14);ck(Math.abs(t.value-1)<.01);ck(t.exactFinite+t.missingTail===1);
  ck(survivalValue("tail",0)===1);ck(positiveTruncation(4).value<positiveTruncation(100).value);ck(positiveTruncation(100).exact===Infinity);
  const a=signedPartial(4),b=signedPartial(100);ck(a.positive>0&&a.negativeMagnitude>0);ck(b.positive>a.positive&&b.negativeMagnitude>a.negativeMagnitude);ck(b.signed===null&&Number.isFinite(b.finitePartial));ck(expectationSnapshot({modelId:"tail"}).finiteValue===expectationSnapshot({modelId:"tail"}).finiteValue);ck(PRESETS.length===6);
  return {checks,models:6};
 }

 const fmt=v=>{
  if(v===Infinity)return"+∞";if(v===-Infinity)return"−∞";if(v===null)return"未定义";
  if(typeof v!=="number"||!Number.isFinite(v))return"不可表示";if(v===0)return"0";
  if(Math.abs(v)<.0001||Math.abs(v)>=10000)return v.toExponential(5);
  if(Number.isInteger(v))return String(v);return v.toFixed(6).replace(/0+$/,"").replace(/\.$/,"");
 };
 const colors=["#477cbd","#b27b28","#9d6cba","#2b8c6a"];
 function drawMeasurePlot(svg,title,series,{xmax=1,unit="",step=false}={}){
  const all=series.flatMap(s=>s.values),lo0=Math.min(0,...all),hi0=Math.max(0,...all),pad=hi0===lo0?1:Math.max((hi0-lo0)*.08,8*Number.MIN_VALUE),lo=lo0-pad,hi=hi0+pad;
  const barXs=series.filter(s=>s.bars).flatMap(s=>s.xs),xmin=barXs.length?Math.min(...barXs)-.25:0,domainMax=barXs.length?Math.max(...barXs)+.25:xmax;
  const X=x=>125+740*((x-xmin)/(domainMax-xmin||1)),Y=y=>285-235*((y-lo)/(hi-lo));
  const g=svg("svg",{viewBox:"0 0 900 380",role:"img","aria-label":title,class:"me-chart"},[svg("title",{},title),svg("desc",{},"全部有限计算值逐点绘制；理论极限与尾部解释见相邻表格。"),svg("text",{x:125,y:25},title),svg("text",{x:15,y:25},unit)]);
  for(let i=0;i<=4;i++){
   const y=lo+(hi-lo)*i/4;
   g.append(svg("line",{x1:125,x2:865,y1:Y(y),y2:Y(y),stroke:"currentColor","stroke-opacity":.16}),svg("text",{x:113,y:Y(y)+5,"text-anchor":"end"},fmt(y)));
   if(!barXs.length&&(xmax!==0||i===0))g.append(svg("text",{x:125+740*i/4,y:312,"text-anchor":"middle"},fmt(xmax*i/4)));
  }
  for(const x of [...new Set(barXs)].sort((a,b)=>a-b))g.append(svg("text",{x:X(x),y:312,"text-anchor":"middle"},fmt(x)));
  g.append(svg("text",{x:865,y:341,"text-anchor":"end"},unit==="概率"?"取值 x":unit==="高度"?"ω":step?"索引 n / 上限 K":"上限 / 位置 t"));
  series.forEach((s,i)=>{
   const color=s.color||colors[i],xs=s.xs;
   if(s.bars){
    s.values.forEach((v,j)=>g.append(svg("rect",{"data-bar":s.key,"data-index":j,x:X(xs[j])-14,y:Math.min(Y(v),Y(0)),width:28,height:Math.abs(Y(v)-Y(0)),fill:color})));
   }else{
    g.append(svg("polyline",{"data-series":s.key,points:s.values.map((v,j)=>X(xs[j])+","+Y(v)).join(" "),fill:"none",stroke:color,"stroke-width":2.5,"stroke-dasharray":s.dash||"none"}));
    s.values.forEach((v,j)=>g.append(svg("circle",{"data-point":s.key,"data-index":j,cx:X(xs[j]),cy:Y(v),r:s.values.length>100?1.5:3,fill:color})));
   }
  });
  return g;
 }
 function mount(root,api){
  if(root.dataset.meMounted)return;root.dataset.meMounted="true";const {el,svg}=api,doc=root.ownerDocument;
  if(!doc.getElementById("measure-expectation-lab-styles"))doc.head.append(el("style",{id:"measure-expectation-lab-styles"},
   ".me-lab{min-width:0;line-height:1.75}.me-lab [hidden]{display:none!important}.me-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}.me-controls label{display:flex;flex-direction:column;gap:6px}.me-lab button,.me-lab input,.me-lab select{font:inherit;padding:9px;color:inherit;background:var(--bg);border:1px solid #80808060;border-radius:5px;max-width:100%}.me-lab button{cursor:pointer}.me-lab button[aria-pressed=true]{outline:2px solid #477cbd}.me-lab button:disabled{opacity:.5;cursor:default}.me-lab :focus-visible{outline:3px solid #477cbd;outline-offset:3px}.me-lab fieldset{min-width:0;border:1px solid #80808050;margin:14px 0;padding:12px}.me-lab fieldset button{margin:5px}.me-lab svg.me-chart{display:block;width:900px!important;min-width:900px;max-width:none!important;color:inherit}.me-chart text{font:15px sans-serif;fill:currentColor}.me-chart text:first-of-type{font-size:19px}.me-scroll{overflow:auto;max-height:500px;margin:14px 0}.me-lab table{min-width:900px;width:100%;font-size:14px}.me-lab th,.me-lab td{padding:7px;text-align:right;white-space:nowrap}.me-lab th:first-child,.me-lab td:first-child{text-align:left}.me-lab figure{margin:20px 0}.me-legend{display:flex;flex-wrap:wrap;gap:8px 24px}.me-legend span{display:flex;align-items:center;gap:5px}.me-legend i{display:inline-block;width:22px;border-top:3px solid}.me-note{border-left:3px solid #477cbd;padding-left:12px}.me-lab details{margin:16px 0}"
  ));
  let state={...DEFAULTS},snapshot=expectationSnapshot(state),revealed=false,answers=[null,null,null],invalid=null;
  const shell=el("div",{className:"me-lab"}),controls=el("div",{className:"me-controls"}),known=el("p",{className:"me-note"}),results=el("section",{className:"me-results",hidden:true}),feedback=el("p",{className:"me-feedback","aria-live":"polite"}),inputs={},labels={};
  const region=(child,title)=>el("div",{className:"me-scroll",role:"region",tabindex:"0","aria-label":title+"，可横向和纵向滚动"},child);
  function table(key,title,headers,rows){return region(el("table",{"data-table":key},[el("caption",{},title),el("thead",{},el("tr",{},headers.map(h=>el("th",{scope:"col"},h)))),el("tbody",{},rows.map(row=>el("tr",{},row.map((v,i)=>el(i?"td":"th",i?{}:{scope:"row"},typeof v==="number"||v===null?fmt(v):v)))))]),title);}
  function figure(title,series,options={}){
   return el("figure",{},[region(drawMeasurePlot(svg,title,series,options),title),el("figcaption",{},[el("div",{className:"me-legend"},series.map((s,i)=>el("span",{},[el("i",{style:"border-color:"+(s.color||colors[i])+";border-top-style:"+(s.dash?"dashed":"solid")}),s.label]))),el("p",{},options.note||"纵轴独立缩放。图只画有限范围；结论的量词由正文中的证明给出。")])]);
  }
  function input(key,title,options){
   const e=options?el("select",{"data-key":key,"aria-label":title},options.map(([v,t])=>el("option",{value:v},t))):el("input",{"data-key":key,"aria-label":title,type:"number",step:key==="T"||key==="M"?"any":"1",min:"0",max:key==="steps"?"600":key==="T"?"12":key==="M"?"100":"400"});
   if(key==="n"||key==="steps")e.min="1";e.value=String(state[key]);inputs[key]=e;
   labels[key]=el("label",{},[title,e]);controls.append(labels[key]);e.addEventListener(options?"change":"input",change);
  }
  input("modelId","实验模型",Object.keys(MODELS).map(k=>[k,MODELS[k].label]));
  input("K","K：数值上限 / 索引截断");input("T","T：积分上限");input("steps","中点求积步数");
  input("n","已查看的前 n 项");input("alpha","尖峰指数 α",[0,.5,1,1.5].map(a=>[a,String(a)]));input("M","UI 尾部高度阈值 M");
  const qs=[
   ["非负变量的尾积分公式是否要求它有概率密度？",[["no-density","不要求，非负可测就能使用"],["density","必须有密度"]],"no-density"],
   ["MCT/Tonelli 是否允许共同积分为 +∞？",[["infinite","允许，但不等于可积"],["finite","不允许，必须有限"]],"infinite"],
   ["有符号有限索引部分和收敛，是否证明原期望存在？",[["no","不能，还须检查正负部"],["yes","可以，有限值已趋于稳定"]],"no"]
  ];
  const predictions=el("div",{className:"me-predictions"},qs.map((q,i)=>el("fieldset",{},[el("legend",{},(i+1)+". "+q[0]),...q[1].map(([value,label])=>{
   const b=el("button",{type:"button","data-question":i,"data-answer":value,"aria-pressed":"false"},label);
   b.addEventListener("click",()=>{answers[i]=value;revealed=false;predictions.querySelectorAll('[data-question="'+i+'"]').forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.answer===value)));render();});return b;
  })])));
  const reveal=el("button",{type:"button",disabled:true},"核对预测并展开计算");
  reveal.addEventListener("click",()=>{if(invalid||answers.includes(null))return;revealed=true;render();results.querySelector("h4").focus();});
  const reset=el("button",{type:"button"},"重置实验");reset.addEventListener("click",()=>{
   state={...DEFAULTS};snapshot=expectationSnapshot(state);revealed=false;answers=[null,null,null];invalid=null;
   for(const k of Object.keys(inputs))inputs[k].value=String(state[k]);predictions.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed","false"));render();predictions.querySelector("button").focus();
  });
  shell.append(el("h3",{},"期望、截断与整个序列的尾部"),controls,known,predictions,el("p",{},[reveal," ",reset]),feedback,results);root.replaceChildren(shell);
  function change(){
   const next={};
   try{
    for(const k of Object.keys(inputs)){
     if(inputs[k].value.trim()==="")throw Error("请填入 "+inputs[k].getAttribute("aria-label"));
     next[k]=k==="modelId"?inputs[k].value:Number(inputs[k].value);
    }
    state=normalizeConfig(next);snapshot=expectationSnapshot(state);invalid=null;
   }catch(e){invalid=e.message;revealed=false;}
   render();
  }
  function render(){
   const model=inputs.modelId.value,exponential=model==="density"||model==="tail",spike=model==="spike";
   labels.K.hidden=exponential||spike;labels.T.hidden=!exponential;labels.steps.hidden=!exponential;
   labels.n.hidden=!spike;labels.alpha.hidden=!spike;labels.M.hidden=!spike;
   known.textContent=invalid?"输入尚未有效："+invalid:MODELS[state.modelId].description;
   reveal.disabled=!!invalid||answers.includes(null)||revealed;results.hidden=!revealed||!!invalid;
   feedback.textContent=invalid?"保留你输入的内容；修正参数后再展开。":revealed?"预测核对："+answers.filter((a,i)=>a===qs[i][2]).length+" / 3。非负尾积分无需密度；非负极限可无限；有符号级数的排列极限不是期望存在证明。":"先完成三项预测，再展开有限计算与理论结论。";
   results.replaceChildren();if(!revealed||invalid)return;
   const s=snapshot;
   results.append(el("h4",{tabindex:"-1"},"当前模型："+s.label),table("status","先分清有限计算与极限对象",["对象","数值 / 结论","解释"],[
    ["当前有限计算",s.finiteValue,s.kind==="signed"?"有限索引部分和，可以相减":s.kind==="spike"?"当前第 n 项的期望":"当前截断 / 求积数值"],
    [s.kind==="spike"?"期望序列的极限":"原随机变量的期望",s.exact,s.kind==="signed"?"正负部期望都无限，因此原期望未定义":s.kind==="spike"?"几乎处处极限都为0，但期望极限随α改变":"允许扩展值；可积专指绝对期望有限"]
   ]));
   if(s.kind==="finite"){
    const xs=ATOMS.map(a=>a.x);results.append(
     figure("四个原子的概率",[{key:"probability",label:"原子概率",xs,values:ATOMS.map(a=>a.p),bars:true}],{xmax:5,unit:"概率"}),
     table("atoms","全部原子与封顶贡献",["x","p","min(x,K)","p min(x,K)"],s.atoms.rows.map(a=>[a.x,a.p,a.clipped,a.contribution])),
     el("p",{className:"me-note"},"概率总和为 "+fmt(s.atoms.probability)+"；原期望为 1。这里的原子分布与指数分布只有平均值碰巧相同，并不是同一个分布。"));
   }else if(exponential){
    const xs=s.series.map(r=>r.x);
    results.append(
     figure("两个被积函数：面积对应不同截断",[{key:"density",label:"x e⁻ˣ",xs,values:s.series.map(r=>r.densityIntegrand)},{key:"survival",label:"e⁻ˣ",xs,values:s.series.map(r=>r.survival),dash:"8 4"}],{xmax:s.T}),
     figure("从0积到当前横坐标：D 与 C 的差别",[{key:"D",label:"D(t)：超出上限的样本记为0",xs,values:s.series.map(r=>r.densityIntegral)},{key:"C",label:"C(t)：超出上限的样本记为t",xs,values:s.series.map(r=>r.tailIntegral),dash:"8 4"}],{xmax:s.T}),
     table("integrals","两种截断分别补回各自尾部",["账本","中点求积","有限解析值","遗漏尾部","解析值+尾部","求积−解析值","中点离散误差界"],[["密度 D",...["value","exactFinite","missingTail"].map(k=>s.density[k]),s.density.exactFinite+s.density.missingTail,s.density.error,s.density.midpointErrorBound],["尾积分 C",...["value","exactFinite","missingTail"].map(k=>s.tail[k]),s.tail.exactFinite+s.tail.missingTail,s.tail.error,s.tail.midpointErrorBound]]),
     el("p",{className:"me-note"},"C(T)−D(T)=T e⁻ᵀ="+fmt(s.T*Math.exp(-s.T))+"。中点误差界只控制精确算术下的求积离散误差，不包括浮点舍入。累计值先在缩放后的坐标中累加，再还原尺度；极小单元可先舍入为0而总量仍可表示。低于浮点范围的量可能显示0。"),
     ...[["density","密度"],["tail","尾积分"]].map(([key,label])=>el("details",{className:"me-quadrature"},[el("summary",{},"展开"+label+"全部 "+s.steps+" 个中点单元"),table(key+"-rows",label+"逐单元账本",["单元","左端","右端","中点","被积函数","单元贡献","累计值"],s[key].rows.map(r=>[String(r.index),r.left,r.right,r.midpoint,r.integrand,r.area,r.cumulative]))])),
     el("details",{},[el("summary",{},"展开图上全部81个解析取样点"),table("analytic","解析曲线的全部取样点",["t","t e⁻ᵗ","e⁻ᵗ","D(t)","C(t)"],s.series.map(r=>[r.x,r.densityIntegrand,r.survival,r.densityIntegral,r.tailIntegral]))])
    );
   }else if(s.kind==="positive"){
    results.append(
     figure("正重尾：每个整数上限的封顶期望",[{key:"cap",label:"E[min(J²,K)]",xs:s.series.map(r=>r.cap),values:s.series.map(r=>r.value)}],{xmax:s.K,step:true}),
     table("positive-current","当前封顶值的两部分",["K","m=floor √K","低于上限的贡献 c m","其余概率质量","封顶尾部贡献 K×质量","合计"],[[s.K,s.positive.cutoff,s.positive.observedTerms,s.positive.tailMass,s.K*s.positive.tailMass,s.positive.value]]),
     table("positive-all","从0到K的全部有限封顶账",["K","m","已见贡献","其余概率","尾部封顶贡献","总期望"],s.series.map(r=>[r.cap,r.cutoff,r.observedTerms,r.tailMass,r.cap*r.tailMass,r.value])),
     el("p",{className:"me-note"},"原期望为+∞由 c floor(√K)→∞ 证明。图的上升趋势不能代替这个量词；c 和有限计算在网页中采用浮点近似。")
    );
   }else if(s.kind==="signed"){
    const xs=s.series.map(r=>r.n);
    results.append(
     figure("有限索引部分：三笔可计算的账",[{key:"positive",label:"正部部分和",xs,values:s.series.map(r=>r.positive)},{key:"negative",label:"负部幅度部分和",xs,values:s.series.map(r=>r.negativeMagnitude),dash:"8 4"},{key:"signed",label:"有限有符号部分和",xs,values:s.series.map(r=>r.finitePartial),dash:"2 5"}],{xmax:s.K,step:true}),
     table("signed-all","全部索引截断：有限差有值，原期望未定义",["N","正部部分和","负部幅度部分和","绝对值部分和","有限有符号部分和"],s.series.map(r=>[r.n,r.positive,r.negativeMagnitude,r.absolute,r.finitePartial])),
     el("p",{className:"me-note"},"固定自然排列的有符号部分和趋于 −c log2≈"+fmt(s.signed.orderedLimit)+"；这个数不是 E[Y]。原变量的正部、负部期望分别为+∞。零阶索引截断 N=0 表示尚未纳入任何结果，其有限部分和为0。")
    );
   }else{
    const a=s.spike,r=a.current,xs=a.rows.map(r=>r.n);
    results.append(
     figure("当前尖峰的宽度与高度",[{key:"spike",label:"Xₙ(ω)，端点按指标函数定义",xs:[0,0,r.width,r.width,1],values:[0,r.height,r.height,0,0]}],{xmax:1,unit:"高度",note:"竖边示意跳跃，不是额外函数取值。端点的差异不改变 Lebesgue 积分；所有 n 使用同一个 U。"}),
     figure("前n项的面积与超过M的面积",[{key:"mean",label:"E[Xⱼ]",xs,values:a.rows.map(r=>r.expectation)},{key:"tail",label:"E[Xⱼ 1{Xⱼ>M}]",xs,values:a.rows.map(r=>r.tailExpectation),dash:"8 4"}],{xmax:s.n,step:true}),
     table("ui","先取上确界，再让M增大",["对象","数值 / 结论","范围"],[
      ["前n项尾部最大值",a.finiteTailMaximum,"只在 j=1…n 内取最大"],
      ["整个无限族的尾部上确界",a.infiniteTailSupremum,"固定M，对所有正整数j取上确界"],
      ["整个族是否UI",a.uniformlyIntegrable?"是":"否","还须让M→∞"],
      ["几乎处处极限",0,"每个固定U>0最终离开缩小区间"],
      ["期望序列的极限",a.expectationLimit,"由 j^(α−1) 的极限判断"]
     ]),
     table("spike-all","前n项完整尖峰与尾部账",["j","高度 j^α","宽度 1/j","面积 E[Xⱼ]","超过M的面积"],a.rows.map(r=>[r.n,r.height,r.width,r.expectation,r.tailExpectation])),
     el("p",{className:"me-note"},"有限个可积变量总能同时压住尾部；这不能证明无限族UI。α=1/2 的无限上确界为 1/√(floor(M²)+1)，阈值使用严格 >；α=1 时恒为1，α=3/2 时为+∞。")
    );
   }
  }
  render();
 }
 return {ATOMS,MODELS,PRESETS,DEFAULTS,atomExpectation,atomProbability,atomTruncation,densityExpectation,survivalValue,tailIntegral,positiveTruncation,signedPartial,spikeSnapshot,expectationSnapshot,drawMeasurePlot,mount,selfTest};
});
