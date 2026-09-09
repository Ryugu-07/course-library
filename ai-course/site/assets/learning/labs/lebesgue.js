(function(host){
'use strict';
var serial=0,SCENARIOS={
 indicator:{label:'递增指标 1_[1/n,1]',limit:1,monotone:true,dominated:true,pointLimit:'x>0 时为1；x=0 时为0',dominator:'g=1 可积',note:'区间向左扩张。n=1时仅端点x=1取1，积分仍为0。'},
 spike:{label:'集中尖峰 n·1_(0,1/n)',limit:0,monotone:false,dominated:false,pointLimit:'每个固定x处最终都为0',dominator:'任何统一控制在0附近至少为1/(2x)，不可积',note:'宽度1/n、高度n，面积恒为1。图上纵轴随n改变，不能凭屏幕面积比较积分。'},
 power:{label:'递减幂函数 x^n',limit:0,monotone:false,dominated:true,pointLimit:'x<1 时为0；x=1 时为1',dominator:'g=1 可积',note:'x^n递减，不能直接套递增版MCT；可对1−x^n用MCT，或对原序列用DCT。'}
};
function params(key,n){if(!Object.hasOwn(SCENARIOS,key))throw new Error('unknown sequence');if(!Number.isInteger(n)||n<1||n>40)throw new Error('n must be integer in [1,40]');}
function value(key,n,x){params(key,n);if(typeof x!=='number'||!Number.isFinite(x)||x<0||x>1)throw new Error('x outside [0,1]');return key==='indicator'?(x>=1/n?1:0):key==='spike'?(x>0&&x<1/n?n:0):x**n;}
function integral(key,n){params(key,n);return key==='indicator'?1-1/n:key==='spike'?1:1/(n+1);}
function evaluate(key='indicator',n=10){params(key,n);return{key,n,scenario:SCENARIOS[key],integral:integral(key,n),limitIntegral:SCENARIOS[key].limit,yMax:key==='spike'?1.12*n:1.12,areaSeries:Array.from({length:40},(_,j)=>({n:j+1,value:integral(key,j+1)}))};}
function fmt(v){if(!Number.isFinite(v))return '—';return v!==0&&Math.abs(v)<1e-4?v.toExponential(3):String(Number(v.toFixed(6)));}
function el(doc,tag,attrs={},children=[]){const n=doc.createElement(tag);for(const[k,v]of Object.entries(attrs)){if(k==='className')n.setAttribute('class',v);else if(k==='text')n.textContent=v;else n.setAttribute(k,String(v));}for(const c of children)n.appendChild(c&&c.nodeType?c:doc.createTextNode(String(c)));return n;}
function sv(doc,tag,attrs={},children=[]){const n=doc.createElementNS('http://www.w3.org/2000/svg',tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,String(v));for(const c of children)n.appendChild(c&&c.nodeType?c:doc.createTextNode(String(c)));return n;}
function drawChart(doc,d){
 const svg=sv(doc,'svg',{viewBox:'0 0 760 565',role:'img','aria-label':d.scenario.label+'，n='+d.n+'；上图函数，下图精确积分序列'}),left=58,right=735,top=42,bottom=265,W=right-left,H=bottom-top;
 const X=x=>left+W*x,Y=y=>bottom-H*y/d.yMax;
 const add=n=>svg.appendChild(n),text=(x,y,s,a={})=>add(sv(doc,'text',{x,y,'font-size':12,'text-anchor':'middle',...a},[s]));
 add(sv(doc,'title',{},[d.scenario.label+'：点值和积分分别观察']));
 for(const x of[0,.25,.5,.75,1]){add(sv(doc,'line',{x1:X(x),x2:X(x),y1:top,y2:bottom,class:'lb-grid'}));text(X(x),286,x);}
 for(const y of[0,d.yMax/2,d.yMax]){add(sv(doc,'line',{x1:left,x2:right,y1:Y(y),y2:Y(y),class:'lb-grid'}));text(left-8,Y(y)+4,fmt(y),{'text-anchor':'end'});}
 text(left,20,'f_n(x)：实线；金虚线表示 a.e. 极限',{'text-anchor':'start'});text(right,307,'x',{'text-anchor':'end'});
 const segment=(a,b,y)=>{if(b>a)add(sv(doc,'line',{x1:X(a),x2:X(b),y1:Y(y),y2:Y(y),class:'lb-profile'}));};
 const dot=(x,y,closed)=>add(sv(doc,'circle',{cx:X(x),cy:Y(y),r:3.5,class:closed?'lb-closed':'lb-open'}));
 if(d.key==='power'){
  const points=Array.from({length:321},(_,i)=>[X(i/320),Y((i/320)**d.n)]);add(sv(doc,'path',{d:points.map((p,i)=>(i?'L':'M')+p.map(v=>v.toFixed(8)).join(' ')).join(' '),class:'lb-profile'}));dot(1,1,true);
 }else{const b=1/d.n,h=d.key==='spike'?d.n:1,a=d.key==='spike'?0:b,z=d.key==='spike'?b:1;
  add(sv(doc,'rect',{x:X(a),y:Y(h),width:W*(z-a),height:H*h/d.yMax,class:'lb-area'}));
  if(d.key==='indicator'){segment(0,b,0);segment(b,1,1);dot(b,0,false);dot(b,1,true);if(b<1)dot(1,1,true);}else{segment(0,b,d.n);segment(b,1,0);dot(0,d.n,false);dot(b,d.n,false);dot(0,0,true);dot(b,0,true);}
 }
 add(sv(doc,'line',{x1:left,x2:right,y1:Y(d.limitIntegral),y2:Y(d.limitIntegral),class:'lb-limit'}));
 text(left,333,d.key==='spike'?'填色是面积区域；竖边不是函数值。纵轴上限 = 1.12 n。':'填色表示面积；端点取值见空心/实心点与文字读数。',{'text-anchor':'start','font-size':12});
 const areaTop=384,areaBottom=504,AY=v=>areaBottom-(areaBottom-areaTop)*v/1.1,NX=n=>left+(n-1)/39*W;
 text(left,365,'积分序列：纵轴固定，蓝点为 ∫f_j，金虚线为 ∫lim f_j',{'text-anchor':'start'});
 for(const v of[0,.5,1]){add(sv(doc,'line',{x1:left,x2:right,y1:AY(v),y2:AY(v),class:'lb-grid'}));text(left-8,AY(v)+4,v,{'text-anchor':'end'});}
 for(const j of[1,10,20,30,40])text(NX(j),526,j);
 add(sv(doc,'line',{x1:left,x2:right,y1:AY(d.limitIntegral),y2:AY(d.limitIntegral),class:'lb-limit'}));
 for(const q of d.areaSeries)add(sv(doc,'circle',{cx:NX(q.n),cy:AY(q.value),r:q.n===d.n?5:2.5,class:q.n===d.n?'lb-current':'lb-area-point','data-n':q.n}));
 text(right,554,'序号 j（圈出当前 n）',{'text-anchor':'end'});return svg;
}
function mount(root,api){if(!root||!root.ownerDocument)return;const doc=root.ownerDocument,id='lebesgue-'+(++serial);root.classList.add('lb-lab');if(!doc.getElementById('lb-styles'))doc.head.appendChild(el(doc,'style',{id:'lb-styles',text:`
.lb-lab{min-width:0;max-width:100%;color:var(--fg)}.lb-lab *{box-sizing:border-box}.lb-lab [hidden]{display:none!important}.lb-lab button,.lb-lab select{font:inherit;color:var(--fg);background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:9px;min-height:44px;max-width:100%}.lb-lab button[aria-pressed=true]{border-color:var(--accent);background:var(--accent);color:var(--bg)}.lb-lab [tabindex]:focus-visible,.lb-lab button:focus-visible,.lb-lab input:focus-visible,.lb-lab select:focus-visible{outline:3px solid var(--accent);outline-offset:2px}.lb-lab input[type=range]{width:100%;min-height:44px}.lb-controls{display:grid;grid-template-columns:minmax(0,1fr);gap:10px}.lb-prediction{margin:15px 0;padding:12px;border:1px solid var(--border)}.lb-choices{display:flex;gap:8px;flex-wrap:wrap}.lb-feedback,.lb-note{line-height:1.65;color:var(--fg-soft)}.lb-chart-scroll{max-width:100%;overflow-x:auto;border:1px solid var(--border);padding:8px}.lb-chart-scroll svg{display:block;width:100%;min-width:700px;height:auto;color:var(--fg)}.lb-chart-scroll text{fill:currentColor;font-family:inherit;letter-spacing:0}.lb-grid{stroke:var(--border);stroke-width:1}.lb-profile{stroke:var(--accent);stroke-width:2.5;fill:none}.lb-area{fill:var(--accent);fill-opacity:.17;stroke:none}.lb-limit{stroke:#a47527;stroke-width:2;stroke-dasharray:7 5}.lb-closed,.lb-area-point{fill:var(--accent);stroke:var(--accent)}.lb-open{fill:var(--bg);stroke:var(--accent);stroke-width:2}.lb-current{fill:var(--bg);stroke:var(--accent);stroke-width:3}.lb-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;margin:12px 0}.lb-metrics div{border-top:2px solid var(--accent);background:var(--bg);padding:10px;min-width:0;overflow-wrap:anywhere}.lb-metrics strong,.lb-metrics span{display:block}.lb-table-scroll{max-width:100%;overflow-x:auto}.lb-table{display:table;min-width:700px;width:100%;border-collapse:collapse}.lb-table th,.lb-table td{text-align:left;padding:8px;border:1px solid var(--border)}html[data-theme=dark] .lb-limit{stroke:#e7c26e}.lb-lab ul{line-height:1.7}
`}));
 const state={key:'indicator',n:10,prediction:null,revealed:false};
 const select=el(doc,'select',{id:id+'-scenario','aria-label':'函数序列'},Object.entries(SCENARIOS).map(([k,v])=>el(doc,'option',{value:k},[v.label]))),range=el(doc,'input',{id:id+'-n',type:'range',min:1,max:40,step:1,value:10,'aria-label':'序号 n'}),output=el(doc,'output',{for:id+'-n'},['10']);
 const controls=el(doc,'div',{className:'lb-controls'},[el(doc,'label',{for:id+'-scenario'},['序列']),select,el(doc,'label',{for:id+'-n'},['n = ',output]),range]);
 const choices=el(doc,'div',{className:'lb-choices'}),choiceNodes=[];for(const[v,label]of[['yes','可以换序'],['no','不能换序']]){const button=el(doc,'button',{type:'button','aria-pressed':'false'},[label]);button.addEventListener('click',()=>{state.prediction=v;state.revealed=false;render();});choices.appendChild(button);choiceNodes.push([v,button]);}
 const feedback=el(doc,'p',{className:'lb-feedback',role:'status','aria-live':'polite'},['先预测再查看图和读数。']),submit=el(doc,'button',{type:'button'},['核对并揭示']),reset=el(doc,'button',{type:'button'},['重新预测']);
 const gate=el(doc,'fieldset',{className:'lb-prediction'},[el(doc,'legend',{},['当前整个序列能否交换 lim 与积分？']),choices,submit,reset,feedback]);
 const results=el(doc,'section',{className:'lb-results','aria-label':'积分与定理条件结果'}),chart=el(doc,'div',{className:'lb-chart-scroll',tabindex:0,role:'region','aria-label':'可横向滚动的函数与积分图'}),metrics=el(doc,'div',{className:'lb-metrics'}),note=el(doc,'p',{className:'lb-note'}),tableWrap=el(doc,'div',{className:'lb-table-scroll',tabindex:0,role:'region','aria-label':'可横向滚动的定理条件表'});
 results.append(metrics,chart,note,tableWrap);root.replaceChildren(el(doc,'h3',{},['点值极限与积分极限，分别记账']),el(doc,'p',{},['三例都在[0,1]上。先判断整个序列，揭晓后可以连续调节n；换序列或改答案会重新隐藏结果。']),controls,gate,results);
 function render(){const d=evaluate(state.key,state.n);range.value=state.n;output.textContent=state.n;choiceNodes.forEach(([v,b])=>b.setAttribute('aria-pressed',String(v===state.prediction)));results.hidden=!state.revealed;if(!state.revealed){feedback.textContent=state.prediction?'已记录预测，点击核对。':'请先选择能否换序。';return;}
 const expected=d.scenario.dominated?'yes':'no';feedback.textContent=(state.prediction===expected?'✓ 判断正确。':'请修正判断：')+(expected==='yes'?'本序列可以换序。':'本序列不能换序，Fatou只给严格不等式。');
 metrics.replaceChildren(...[['当前积分',fmt(d.integral)],['极限函数的积分',fmt(d.limitIntegral)],['逐点极限',d.scenario.pointLimit],['统一控制',d.scenario.dominator]].map(([a,b])=>el(doc,'div',{},[el(doc,'span',{},[a]),el(doc,'strong',{},[b])])));chart.replaceChildren(drawChart(doc,d));note.textContent=d.scenario.note+' 虚线描述a.e.极限；端点差异不改变积分。';
 const table=el(doc,'table',{className:'lb-table'},[el(doc,'caption',{},['同一序列的三条定理检查']),el(doc,'thead',{},[el(doc,'tr',{},['定理','条件核查','结论'].map(x=>el(doc,'th',{scope:'col'},[x])))]),el(doc,'tbody',{},[
 ['MCT',d.scenario.monotone?'非负且递增':'原序列不是递增序列',d.scenario.monotone?'积分递增趋于1':'不能直接使用递增版'],['Fatou','三个序列都非负',d.key==='spike'?'0 < 1；不等式严格':'两侧相等'],['DCT',d.scenario.dominated?'a.e.收敛且被可积的1控制':'缺少可积统一控制',d.scenario.dominated?'L¹收敛，积分可以换序':'本定理不适用']
 ].map(row=>el(doc,'tr',{},row.map(x=>el(doc,'td',{},[x])))))]);tableWrap.replaceChildren(table);}
 select.addEventListener('change',()=>{state.key=select.value;state.prediction=null;state.revealed=false;render();});range.addEventListener('input',()=>{state.n=Number(range.value);render();});submit.addEventListener('click',()=>{if(!state.prediction){feedback.textContent='请先选择一个预测。';choiceNodes[0][1].focus();return;}state.revealed=true;render();chart.focus();if(api&&api.announce)api.announce(root,feedback.textContent);});reset.addEventListener('click',()=>{state.prediction=null;state.revealed=false;render();choiceNodes[0][1].focus();});render();
}
const exported={SCENARIOS,value,integral,evaluate,drawChart,mount};if(typeof module==='object'&&module.exports)module.exports=exported;if(host&&host.CourseLearning)host.CourseLearning.register('lebesgue',mount);
})(typeof window!=='undefined'?window:null);
