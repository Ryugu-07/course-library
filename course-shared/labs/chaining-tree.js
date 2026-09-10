(function(root,factory){
 "use strict";const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;
 if(root&&root.CourseLearning)root.CourseLearning.register("chaining-tree",api.mount);
 if(typeof require==="function"&&require.main===module)console.log(api.selfTest());
})(typeof window!=="undefined"?window:globalThis,function(){
 "use strict";
 const DEFAULTS={depth:5,sigma:.86,rho:.42,seed:31031,delta:.05,reference:0};
 const PRESETS=[
  {id:"default",label:"快速衰减",depth:5,rho:.42,seed:31031},
  {id:"flat",label:"各层同尺度",depth:5,rho:1,seed:31031},
  {id:"zero",label:"只有第一层",depth:5,rho:0,seed:31031},
  {id:"shallow",label:"两片叶都为负",depth:1,rho:.42,seed:3},
  {id:"deep",label:"增加一层，保留旧增量",depth:6,rho:.42,seed:31031}
 ];
 const QUESTIONS=[
  ["多尺度期望上界是否在每种尺度安排下都更小？",["不一定，要比较同一模型的两种证明","必然更小"],0,"各层同尺度时，逐层取最大值可能支付更多代价。"],
  ["一次样本最大值超过某个期望上界，是否推翻定理？",["没有，期望上界不是逐样本保证","是，所有样本都应不超过它"],0,"样本最大值、期望与有失败概率的上界是三个对象。"],
  ["把同一个随机常数加到全部叶值上，会改变什么？",["距离不变，绝对最大值可能改变","距离一定改变"],0,"增量几何不记录共同平移；绝对值上界必须处理锚点。"],
  ["未截断熵积分发散，是否意味着一致大数定律失败？",["不能这样推断，只是该上界未提供有限证书","一定失败"],0,"有限覆盖与单函数大数定律仍可能证明一致收敛。"]
 ];
 function number(v,name,lo,hi,integer=false){
  if(typeof v==="string"){if(!v.trim())throw Error(name+"不能为空");v=Number(v);}
  if(typeof v!=="number"||!Number.isFinite(v)||v<lo||v>hi||(integer&&!Number.isInteger(v)))throw Error(name+"须为"+lo+"至"+hi+"的"+(integer?"整数":"有限数"));
  return v;
 }
 function config(raw={}){
  if(!raw||typeof raw!=="object"||Array.isArray(raw))throw Error("参数须为对象");
  const s=Object.assign({},DEFAULTS,raw);
  s.depth=number(s.depth,"深度 K",1,6,true);s.sigma=number(s.sigma,"第一层标准差",.01,4);
  s.rho=number(s.rho,"衰减比",0,1);if(s.rho>0&&s.rho<.01)throw Error("衰减比取0，或0.01至1；更小正数超出本实验数值范围");
  s.seed=number(s.seed,"seed",0,4294967295,true);s.delta=number(s.delta,"失败概率 δ",1e-6,.5);
  s.reference=number(s.reference,"参照叶索引",0,2**s.depth-1,true);return s;
 }
 function rng(seed){
  let state=seed,spare=null;
  const uniform=()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return(state+.5)/4294967296;};
  return()=>{if(spare!==null){const z=spare;spare=null;return z;}const r=Math.sqrt(-2*Math.log(uniform())),a=2*Math.PI*uniform();spare=r*Math.sin(a);return r*Math.cos(a);};
 }
 function prefix(i,j,depth){
  let common=0;
  for(let bit=depth-1;bit>=0;bit--){if((i>>bit&1)!==(j>>bit&1))break;common++;}
  return common;
 }
 function snapshot(raw){
  const s=config(raw),normal=rng(s.seed),levels=[],nodes=[[{level:0,index:0,parent:null,gaussian:null,sigma:0,increment:0,value:0}]];
  let variance=0,chain=0,sampleChain=0,highChain=0;
  for(let k=1;k<=s.depth;k++){
   const sigma=s.sigma*Math.pow(s.rho,k-1),count=2**k,current=[];
   for(let index=0;index<count;index++){
    const gaussian=normal(),increment=sigma*gaussian,parent=Math.floor(index/2);
    current.push({level:k,index,parent,gaussian,sigma,increment,value:nodes[k-1][parent].value+increment});
   }
   nodes.push(current);
   const maxNode=current.reduce((a,b)=>b.increment>a.increment?b:a);
   const expected=sigma*Math.sqrt(2*k*Math.LN2),failure=s.delta*2**(-k)/(1-2**(-s.depth));
   const high=sigma*Math.sqrt(2*(k*Math.LN2-Math.log(failure)));
   variance+=sigma*sigma;chain+=expected;sampleChain+=maxNode.increment;highChain+=high;
   levels.push({level:k,count,sigma,variance:sigma*sigma,maxIncrement:maxNode.increment,maxIndex:maxNode.index,expected,cumulative:chain,sampleCumulative:sampleChain,failure,high,highCumulative:highChain});
  }
  const leaves=nodes.at(-1).map(n=>{
   const increments=[],addresses=[];let index=n.index;
   for(let k=s.depth;k>=1;k--){increments.unshift(nodes[k][index].increment);addresses.unshift(index);index=Math.floor(index/2);}
   return {index:n.index,address:n.index.toString(2).padStart(s.depth,"0"),value:n.value,increments,addresses};
  });
  const maximum=leaves.reduce((a,b)=>b.value>a.value?b:a),single=Math.sqrt(2*variance*s.depth*Math.LN2),highSingle=Math.sqrt(2*variance*(s.depth*Math.LN2-Math.log(s.delta)));
  const tails=Array(s.depth+1).fill(0);
  for(let k=s.depth-1;k>=0;k--)tails[k]=tails[k+1]+levels[k].variance;
  const distances=tails.map(v=>Math.sqrt(2*v)),entropy=[];let integral=0;
  for(let r=1;r<=s.depth;r++){
   const lower=distances[r],upper=distances[r-1],width=upper-lower,logCount=r*Math.LN2,contribution=width*Math.sqrt(logCount);integral+=contribution;
   entropy.push({prefix:r,lower,upper,width,count:2**r,logCount,height:Math.sqrt(logCount),contribution,cumulative:integral});
  }
  const metric=leaves.map(leaf=>{
   const common=prefix(s.reference,leaf.index,s.depth),covariance=levels.slice(0,common).reduce((v,r)=>v+r.variance,0);
   return {index:leaf.index,address:leaf.address,common,covariance,distance:distances[common],sampleDifference:leaf.value-leaves[s.reference].value};
  });
  return {config:s,levels,nodes,leaves,maximum:maximum.value,maxIndex:maximum.index,variance,single,chain,sampleChain,highSingle,highChain,tails,distances,entropy,integral,metric};
 }
 function coverage(d,epsilon){
  epsilon=number(epsilon,"覆盖半径",0,1e6);
  for(let r=0;r<=d.config.depth;r++)if(epsilon>=d.distances[r])return 2**r;
  throw Error("未找到覆盖层级");
 }
 function ledgers(d){
  return [
   {key:"summary",title:"三种量词的六本账",headers:["对象","数值","适用含义"],rows:[
    ["一次叶最大值",d.maximum,"固定种子的观测"],
    ["一次样本链上界",d.sampleChain,"逐样本 M≤Σ层最大增量"],
    ["单尺度期望上界",d.single,"E M≤该值"],
    ["多尺度期望上界",d.chain,"E M≤该值"],
    ["单尺度高概率上界",d.highSingle,"P(M>该值)≤δ"],
    ["分层高概率上界",d.highChain,"P(M>该值)≤δ"],
    ["几何熵积分 I",d.integral,"Dudley 为 E M≤C I；这里未把 C 设成1"],
    ["叶方差 V",d.variance,"真实高斯模型的方差"],
    ["参照叶",d.config.reference,"距离账本的参照索引"]
   ]},
   {key:"levels",title:"所有层级与两种尾概率预算",headers:["k","边数","σk","σk²","最大增量","实现边索引","期望贡献","期望累计","样本链累计","δk","高概率贡献","高概率累计"],rows:d.levels.map(r=>[r.level,r.count,r.sigma,r.variance,r.maxIncrement,r.maxIndex,r.expected,r.cumulative,r.sampleCumulative,r.failure,r.high,r.highCumulative])},
   {key:"nodes",title:"每条边和每个节点（根另记为0）",headers:["层","索引","父索引","g","σ","Δ","父值","子值"],rows:d.nodes.slice(1).flatMap(level=>level.map(n=>[n.level,n.index,n.parent,n.gaussian,n.sigma,n.increment,d.nodes[n.level-1][n.parent].value,n.value]))},
   {key:"leaves",title:"全部叶子的完整路径",headers:["索引","二进制地址","各层边索引","各层增量","叶值"],rows:d.leaves.map(r=>[r.index,r.address,r.addresses,r.increments,r.value])},
   {key:"metric",title:"参照叶到全部叶子的协方差与距离",headers:["叶索引","地址","共同前缀长度","协方差","canonical 距离","当前样本差"],rows:d.metric.map(r=>[r.index,r.address,r.common,r.covariance,r.distance,r.sampleDifference])},
   {key:"entropy",title:"精确覆盖阶梯与熵积分分段",headers:["前缀r","下端Dᵣ（含）","上端Dᵣ₋₁（不含）","区间宽","覆盖数2ʳ","ln覆盖数","√ln覆盖数","积分贡献","积分累计"],rows:d.entropy.map(r=>[r.prefix,r.lower,r.upper,r.width,r.count,r.logCount,r.height,r.contribution,r.cumulative])}
  ];
 }
 function plots(d){
  const signed=[d.maximum,d.sampleChain,d.single,d.chain,d.highSingle,d.highChain],lo=Math.min(0,...signed),hi=Math.max(...signed),pad=(hi-lo)*.12||1;
  const entropy=d.entropy.filter(r=>r.width>0).slice().reverse();
  return [
   {title:"层级尺度：每一层付多少代价",x:"层 k",y:"贡献（与 X 同单位）",xmin:1,xmax:Math.max(2,d.config.depth),ymin:Math.min(0,...d.levels.map(r=>r.maxIncrement))*1.15,ymax:Math.max(...d.levels.map(r=>r.high))*1.15,series:[
    {key:"expected",color:"#3685bd",points:d.levels.map(r=>[r.level,r.expected]),line:true},
    {key:"observed",color:"#bf691e",points:d.levels.map(r=>[r.level,r.maxIncrement]),line:true},
    {key:"high",color:"#398462",points:d.levels.map(r=>[r.level,r.high]),line:true}
   ]},
   {title:"样本、期望上界和高概率上界",x:"编号（对应下方六本账的前六行）",y:"值（负数保留）",xmin:.5,xmax:6.5,xTicks:[1,2,3,4,5,6],ymin:lo-pad,ymax:hi+pad,series:signed.map((v,i)=>({key:"quantity-"+i,color:["#bf691e","#9d6430","#3685bd","#7656a4","#398462","#b74257"][i],points:[[i+1,0],[i+1,v]],line:true}))},
   {title:"真正的覆盖阶梯：面积为 I，尚未乘 Dudley 常数",x:"覆盖半径 ε",y:"√ln N(ε)",xmin:0,xmax:d.distances[0]*1.06,ymin:0,ymax:Math.max(...entropy.map(r=>r.height))*1.2,series:[...entropy.map(r=>({key:"entropy-"+r.prefix,color:"#3685bd",points:[[r.lower,r.height],[r.upper,r.height]],line:true,endOpen:true,area:true})),{key:"one-ball",color:"#3685bd",points:[[d.distances[0],0],[d.distances[0]*1.06,0]],line:true}]},
   {title:"参照叶的几何距离与一次样本差",x:"叶索引",y:"距离／样本差",xmin:0,xmax:2**d.config.depth-1,ymin:Math.min(0,...d.metric.map(r=>r.sampleDifference))*1.15,ymax:Math.max(...d.metric.map(r=>Math.max(r.distance,r.sampleDifference)))*1.15,series:[
    {key:"metric",color:"#7656a4",points:d.metric.map(r=>[r.index,r.distance]),line:false},
    {key:"sample",color:"#bf691e",points:d.metric.map(r=>[r.index,r.sampleDifference]),line:false}
   ]}
  ];
 }
 function tree(d){
  const depth=d.config.depth,rows=2**depth,height=Math.max(420,rows*13+120),left=55,right=850,top=70,bottom=height-55;
  const x=k=>left+(right-left)*k/depth,y=(k,i)=>top+(bottom-top)*(i+.5)/2**k;
  let s='<svg xmlns="http://www.w3.org/2000/svg" width="900" height="'+height+'" role="img" aria-label="完整二叉树：空间位置只表示拓扑"><title>完整二叉树：所有父子连接和节点</title><text x="25" y="30" font-size="22">完整树：位置表示祖先关系；蓝非负、红负，金线为最大叶路径</text>';
  const path=new Set(d.leaves[d.maxIndex].addresses.map((index,i)=>(i+1)+':'+index));
  for(const level of d.nodes)for(const n of level){
   if(n.level)s+='<line data-edge="'+n.level+':'+n.index+'" x1="'+x(n.level-1)+'" y1="'+y(n.level-1,n.parent)+'" x2="'+x(n.level)+'" y2="'+y(n.level,n.index)+'" stroke="'+(path.has(n.level+':'+n.index)?'#bf691e':'#92a1aa')+'" stroke-width="'+(path.has(n.level+':'+n.index)?2.5:1)+'"/>';
   s+='<circle data-node="'+n.level+':'+n.index+'" cx="'+x(n.level)+'" cy="'+y(n.level,n.index)+'" r="3" fill="'+(n.value>=0?'#3685bd':'#c64d49')+'"><title>层'+n.level+'，索引'+n.index+'，值'+fmt(n.value)+'</title></circle>';
  }
  for(let k=0;k<=depth;k++)s+='<text x="'+x(k)+'" y="'+(height-18)+'" text-anchor="middle">k='+k+'</text>';
  return s+'</svg>';
 }

  function fmt(x){
    if(x===null||x===undefined)return "—";
    if(Array.isArray(x))return "["+x.map(fmt).join(", ")+"]";
    if(typeof x!=="number")return String(x);
    if(x===0)return "0";
    return Number(x.toPrecision(9)).toString();
  }

 const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 function svg(q){
  const left=100,width=750,height=250,top=85,bottom=335,x=v=>left+width*(v-q.xmin)/(q.xmax-q.xmin),y=v=>bottom-height*(v-q.ymin)/(q.ymax-q.ymin);
  let s='<svg xmlns="http://www.w3.org/2000/svg" width="900" height="425" role="img" aria-label="'+esc(q.title)+'"><title>'+esc(q.title)+'</title><text x="25" y="32" font-size="22">'+esc(q.title)+'</text>';
  for(let i=0;i<5;i++){
   const v=q.ymin+(q.ymax-q.ymin)*i/4;
   s+='<path d="M'+left+' '+y(v)+'H'+(left+width)+'" stroke="currentColor" opacity=".18"/><text x="'+(left-12)+'" y="'+(y(v)+5)+'" text-anchor="end">'+fmt(Number(v.toPrecision(4)))+'</text>';
  }
  const ticks=q.xTicks||Array.from({length:5},(_,i)=>q.xmin+(q.xmax-q.xmin)*i/4);
  for(const v of ticks)s+='<text x="'+x(v)+'" y="'+(bottom+28)+'" text-anchor="middle">'+fmt(Number(v.toPrecision(4)))+'</text>';
  if(q.ymin<=0&&q.ymax>=0)s+='<line data-zero="true" x1="'+left+'" x2="'+(left+width)+'" y1="'+y(0)+'" y2="'+y(0)+'" stroke="currentColor" opacity=".7"/>';
  s+='<text x="'+left+'" y="65">'+esc(q.y)+'</text><text x="'+(left+width/2)+'" y="'+(bottom+63)+'" text-anchor="middle">'+esc(q.x)+'</text>';
  for(const series of q.series){
   if(series.area)s+='<rect data-area="'+series.key+'" x="'+x(series.points[0][0])+'" y="'+y(series.points[0][1])+'" width="'+(x(series.points[1][0])-x(series.points[0][0]))+'" height="'+(y(0)-y(series.points[0][1]))+'" fill="'+series.color+'" opacity=".12"/>';
   if(series.line)s+='<polyline data-series="'+series.key+'" points="'+series.points.map(p=>x(p[0])+','+y(p[1])).join(" ")+'" stroke="'+series.color+'" stroke-width="2" fill="none"/>';
   series.points.forEach((p,i)=>{const open=series.endOpen&&i===series.points.length-1;s+='<circle data-series="'+series.key+'" data-index="'+i+'" data-open="'+!!open+'" cx="'+x(p[0])+'" cy="'+y(p[1])+'" r="'+(series.endOpen?3.5:series.line?1.8:3.5)+'" fill="'+(open?"var(--bg,#faf7ef)":series.color)+'" stroke="'+series.color+'"/>';});
  }
  return s+"</svg>";
 }

 const STYLE=".ct130{color:var(--fg,#273646)}.ct130 .ct-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}.ct130 label{display:flex;flex-direction:column;gap:6px}.ct130 input,.ct130 select{font:inherit;padding:8px;max-width:100%;background:var(--bg,#fff);color:inherit;border:1px solid #8b98a0;border-radius:5px}.ct130 button{font:inherit;padding:8px 12px;margin:5px;cursor:pointer}.ct130 button[aria-pressed=true]{outline:3px solid #478aaa}.ct130 .ct-scroll{overflow:auto;max-width:100%;margin:16px 0}.ct130 .ct-scroll:focus{outline:3px solid #478aaa}.ct130 .ct-ledger{max-height:420px}.ct130 svg{width:900px!important;max-width:none!important;display:block;fill:currentColor;font:16px system-ui}.ct130 table{min-width:900px;border-collapse:collapse;font-variant-numeric:tabular-nums}.ct130 th,.ct130 td{padding:9px;border:1px solid #98a4ab;text-align:left;white-space:nowrap}.ct130 .ct-error{color:#c74b39}.ct130 [hidden]{display:none!important}.ct130 fieldset{margin:16px 0;padding:12px}.ct130 details{margin:16px 0}.ct130 summary{cursor:pointer;font-weight:600}.ct130 .ct-legend{font-size:.95em}.ct130 .ct-note{line-height:1.7}";
 function mount(container){
  const doc=container.ownerDocument;
  if(!doc.getElementById("ct130-style")){
   const style=doc.createElement("style");style.id="ct130-style";style.textContent=STYLE;doc.head.appendChild(style);
  }
  const field=(key,label)=>'<label>'+label+'<input data-key="'+key+'" type="number" step="any"></label>';
  container.innerHTML='<div class="ct130"><h3>有限树：从共同祖先到覆盖数</h3><p>先预测，再揭示。预设和参数变化保留预测；无效输入保留原值，修正后需重新揭示。ρ可取0或0.01–1。</p><div class="ct-presets">'+PRESETS.map(p=>'<button type="button" data-preset="'+p.id+'">'+p.label+'</button>').join("")+'</div><div class="ct-controls">'+
   field("depth","完整树深度 K（1–6）")+field("sigma","第一层标准差（0.01–4）")+field("rho","每层衰减比 ρ")+field("seed","seed（0–4294967295）")+field("delta","失败概率 δ（0.000001–0.5）")+field("reference","距离参照叶（0–2ᴷ−1）")+
   '</div>'+QUESTIONS.map((q,i)=>'<fieldset data-question="'+i+'"><legend>'+(i+1)+'. '+q[0]+'</legend>'+q[1].map((v,j)=>'<button type="button" data-choice="'+j+'" aria-pressed="false">'+v+'</button>').join("")+'</fieldset>').join("")+
   '<button type="button" data-action="reveal">揭示完整账本</button><button type="button" data-action="reset">重置预测</button><p class="ct-error" role="alert"></p><p role="status"></p><div class="ct-results" hidden></div></div>';
  const fields=Array.from(container.querySelectorAll("[data-key]")),answers=Array(4).fill(null),result=container.querySelector(".ct-results"),reveal=container.querySelector("[data-action=reveal]"),feedback=container.querySelector("[role=status]"),error=container.querySelector("[role=alert]");
  fields.forEach(e=>e.value=DEFAULTS[e.dataset.key]);
  let revealed=false,valid=null;
  function render(d){
   const order=d.chain<d.single?"这组尺度下，多尺度期望上界更紧。":d.chain>d.single?"这组尺度下，单尺度期望上界更紧。":"两条期望上界相等。";
   result.innerHTML='<p>'+order+' 固定样本最大值 '+fmt(d.maximum)+'，样本链上界 '+fmt(d.sampleChain)+'。它们可以为负。δ='+fmt(d.config.delta)+' 只属于两种高概率保证，不改变期望上界。熵积分 I='+fmt(d.integral)+' 是几何量，未乘未指定的 Dudley 常数。</p><p>蓝：期望贡献／覆盖阶梯；橙：样本增量；绿：高概率贡献；紫：canonical 距离。阶梯实心左端包含、空心右端不包含。图表可聚焦后用方向键横向滚动。</p>'+
    '<details open><summary>完整树与最大叶路径</summary><div class="ct-scroll" role="region" tabindex="0" aria-label="完整树">'+tree(d)+'</div></details>'+
    plots(d).map(q=>'<div class="ct-scroll" role="region" tabindex="0" aria-label="'+esc(q.title)+'">'+svg(q)+'</div>').join("")+
    ledgers(d).map(t=>'<details data-ledger="'+t.key+'"><summary>'+esc(t.title)+'（'+t.rows.length+' 行）</summary><div class="ct-scroll ct-ledger" role="region" tabindex="0" aria-label="'+esc(t.title)+'"><table data-table="'+t.key+'"><thead><tr>'+t.headers.map(x=>'<th scope="col">'+esc(x)+'</th>').join("")+'</tr></thead><tbody>'+t.rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(fmt(x))+'</td>').join("")+'</tr>').join("")+'</tbody></table></div></details>').join("")+
    '<p>真实理论模型为独立标准高斯边；本图是固定32位LCG与Box–Muller的伪随机样本。树图位置只编码拓扑，不能把屏幕长度解释为canonical距离。ρ=0时后续增量为零、叶子可能距离为零，覆盖数按伪度量的零距离等价类计算。熵表零宽区间保留用于核算，不是实际存在的覆盖层。</p>';
  }
  function update(){
   try{valid=config(Object.fromEntries(fields.map(e=>[e.dataset.key,e.value])));error.textContent="";}catch(e){valid=null;revealed=false;error.textContent=e.message;}
   reveal.disabled=!valid||answers.some(x=>x===null);result.hidden=!revealed;
   if(revealed&&valid)render(snapshot(valid));
   feedback.textContent=revealed?answers.filter((x,i)=>x===QUESTIONS[i][2]).length+" / 4。"+QUESTIONS.map(q=>q[3]).join(" "):"";
  }
  fields.forEach(e=>e.addEventListener("input",update));
  container.querySelectorAll("[data-choice]").forEach(b=>b.addEventListener("click",()=>{
   const i=Number(b.parentElement.dataset.question);answers[i]=Number(b.dataset.choice);b.parentElement.querySelectorAll("[data-choice]").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));update();
  }));
  container.querySelectorAll("[data-preset]").forEach(b=>b.addEventListener("click",()=>{
   const s=Object.assign({},DEFAULTS,PRESETS.find(p=>p.id===b.dataset.preset));fields.forEach(e=>e.value=s[e.dataset.key]);update();
  }));
  reveal.addEventListener("click",()=>{if(!reveal.disabled){revealed=true;update();}});
  container.querySelector("[data-action=reset]").addEventListener("click",()=>{answers.fill(null);revealed=false;container.querySelectorAll("[data-choice]").forEach(b=>b.setAttribute("aria-pressed","false"));update();container.querySelector("[data-choice]").focus();});
  update();
 }
 function selfTest(){
  let checks=0;const ck=(b,m)=>{checks++;if(!b)throw Error(m);};
  const d=snapshot();ck(d.maximum<=d.sampleChain,"sample inequality");ck(d.chain<d.single,"fast decay");
  const flat=snapshot({rho:1});ck(flat.chain>flat.single,"flat scales");
  const zero=snapshot({rho:0});ck(coverage(zero,0)===2,"zero-distance quotient");ck(zero.entropy.filter(r=>r.width>0).length===1,"zero-width intervals");
  ck(coverage(d,d.distances[0])===1&&coverage(d,0)===32,"coverage endpoints");
  return {status:"PASS",checks};
 }
 return {DEFAULTS,PRESETS,QUESTIONS,config,snapshot,evaluate:snapshot,coverage,prefix,ledgers,plots,tree,svg,fmt,mount,selfTest};
});
