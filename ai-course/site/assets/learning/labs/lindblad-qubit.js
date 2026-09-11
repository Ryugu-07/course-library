(function(hostWindow){"use strict";
  var INITIAL = {x: .8, y: .4, z: Math.sqrt(.2)};
  var INITIALS = {
    tilted: {label: '倾斜纯态', vector: INITIAL},
    excited: {label: '激发态 |1〉', vector: {x:0,y:0,z:-1}},
    ground: {label: '基态 |0〉', vector: {x:0,y:0,z:1}},
    plus: {label: '叠加态 |+〉', vector: {x:1,y:0,z:0}},
    mixed: {label: '最大混合态 I/2', vector: {x:0,y:0,z:0}}
  };
  var DEFAULTS = {channel:'combined',time:2,omega:1.4,T1:2,Tphi:1.5,initial:'tilted',q:.2};
  var CHANNELS = [
    {key:'unitary',label:'幺正进动',short:'只转相位'},
    {key:'dephasing',label:'纯退相位',short:'C 衰减，布居不变'},
    {key:'amplitude',label:'零温振幅阻尼',short:'只有向下跃迁'},
    {key:'combined',label:'零温合并通道',short:'进动 + 弛豫 + 退相位'},
    {key:'thermal',label:'有限温合并通道',short:'增加向上跃迁，p₁ 趋向 q'}
  ];
  var METRICS = [
    {key:'population',label:'布居 p₁',short:'激发态概率'},
    {key:'coherence',label:'相干 C',short:'固定能量基底中的 2|ρ₀₁|'},
    {key:'purity',label:'纯度 Tr ρ²',short:'纯度可先降后升'},
    {key:'energy',label:'相对能量 E',short:'本模型中 E/(ℏω₀)=p₁'}
  ];
  function finite(v){return Number.isFinite(v);}
  function number(v,f){var n=Number(v);return finite(n)?n:f;}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function checkedNumber(v,a,b,name){if(typeof v!=='number'||!finite(v)||v<a||v>b)throw Error(name+' 超出允许范围');return v;}
  function validVector(v){if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).sort().join(',')!=='x,y,z')throw Error('Bloch 向量需要 x,y,z');['x','y','z'].forEach(k=>checkedNumber(v[k],-1,1,k));if(v.x*v.x+v.y*v.y+v.z*v.z>1+2e-14)throw Error('初态不在 Bloch 球内');return v;}
  function normalizeConfig(input){if(input===undefined)input={};if(!input||typeof input!=='object'||Array.isArray(input))throw Error('参数需要对象');var c=Object.assign({},DEFAULTS);Object.keys(input).forEach(k=>{if(!Object.hasOwn(DEFAULTS,k))throw Error('未知参数 '+k);c[k]=input[k];});if(!CHANNELS.some(a=>a.key===c.channel))throw Error('未知通道');if(typeof c.initial!=='string'||!Object.hasOwn(INITIALS,c.initial))throw Error('未知初态');checkedNumber(c.time,0,1e6,'time');checkedNumber(c.omega,-4,4,'omega');checkedNumber(c.T1,.2,8,'T1');checkedNumber(c.Tphi,.2,8,'Tphi');checkedNumber(c.q,0,.5,'q');return c;}
  function t2FromRates(T1,Tphi){checkedNumber(T1,.2,8,'T1');checkedNumber(Tphi,.2,8,'Tphi');return 1/(.5/T1+1/Tphi);}
  function rates(c){var damping=['amplitude','combined','thermal'].includes(c.channel),phase=['dephasing','combined','thermal'].includes(c.channel),rot=['unitary','combined','thermal'].includes(c.channel),g1=damping?1/c.T1:0,q=c.channel==='thermal'?c.q:0;return{gamma1:g1,gammaPhi:phase?1/c.Tphi:0,gamma2:g1/2+(phase?1/c.Tphi:0),down:g1*(1-q),up:g1*q,q:q,zEq:1-2*q,omega:rot?c.omega:0};}
  function evolve(channel,time,omega,T1,Tphi,initial,q){var c=normalizeConfig({channel,time,omega,T1,Tphi,q:q===undefined?DEFAULTS.q:q}),r=rates(c),v=validVector(initial===undefined?INITIAL:initial),e=Math.exp(-r.gamma1*time),loss=-Math.expm1(-r.gamma1*time),a=Math.exp(-r.gamma2*time),p=r.omega*time,co=Math.cos(p),si=Math.sin(p);return{x:a*(v.x*co-v.y*si),y:a*(v.x*si+v.y*co),z:e*v.z+loss*r.zEq};}
  function densityFromBloch(v){validVector(v);return{rho00:(1+v.z)/2,rho01Real:v.x/2,rho01Imag:-v.y/2,rho11:(1-v.z)/2};}
  function diagnostics(v){var d=densityFromBloch(v),r=Math.hypot(v.x,v.y,v.z),C=Math.hypot(v.x,v.y),l0=(1-r)/2,l1=(1+r)/2;return{trace:d.rho00+d.rho11,population:d.rho11,coherence:C,rho01Abs:C/2,purity:(1+r*r)/2,minEigenvalue:l0,eigenvalues:[l0,l1],entropy:[l0,l1].reduce((s,x)=>s-(x>0?x*Math.log2(x):0),0),energy:d.rho11,radius:r,density:d};}
  function close(a,b,tol){return Math.abs(a-b)<=(tol===undefined?1e-8:tol);}
  function changeFlags(channel,time,omega,T1,Tphi,initial,q){var v=initial===undefined?INITIAL:initial,a=diagnostics(v),b=diagnostics(evolve(channel,time,omega,T1,Tphi,v,q)),out={};METRICS.forEach(m=>out[m.key]=!close(a[m.key],b[m.key],1e-8));return out;}
  function predictionFeedback(metric,choice,c){if(!METRICS.some(m=>m.key===metric)||typeof choice!=='boolean')throw Error('无效预测');c=normalizeConfig(c);var before=diagnostics(INITIALS[c.initial].vector),after=diagnostics(evolve(c.channel,c.time,c.omega,c.T1,c.Tphi,INITIALS[c.initial].vector,c.q)),changed=Math.abs(after[metric]-before[metric])>1e-8;var why={population:'p₁=q+(p₁(0)−q)e^(−Γ₁t)；未开弛豫时 Γ₁=0。初态已平衡也可以不变。',coherence:'C=C₀e^(−Γ₂t)。只转相位不改变模；初始 C₀=0 时也不会凭空产生相干。',purity:'P=(1+C²+z²)/2。它不是普遍单调量；零温激发态衰减可先变混，再趋向纯基态。',energy:'这里固定 H₀，E/(ℏω₀)=p₁，因此与布居的答案相同；这不是所有哈密顿量的普遍结论。'}[metric];return{correct:choice===changed,changed,before:before[metric],after:after[metric],text:(choice===changed?'预测正确。':'需要修正。')+why+' 本题比较当前时刻与初始值，绝对差不超过 10⁻⁸ 记为“不变”；不表示整个时间区间内恒定。'};}
  // Complex matrices use [real, imaginary], with input-first Choi ordering |i〉⊗|a〉.
  const cz=()=>[0,0],ca=(a,b)=>[a[0]+b[0],a[1]+b[1]],cm=(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]],cc=a=>[a[0],-a[1]],cs=(a,s)=>[a[0]*s,a[1]*s];
  const zm=n=>Array.from({length:n},()=>Array.from({length:n},cz));
  const dag=a=>a[0].map((_,j)=>a.map(r=>cc(r[j])));
  const mul=(a,b)=>a.map(r=>b[0].map((_,j)=>r.reduce((s,v,k)=>ca(s,cm(v,b[k][j])),cz())));
  const addm=(a,b)=>a.map((r,i)=>r.map((v,j)=>ca(v,b[i][j])));
  const diffm=(a,b)=>a.map((r,i)=>r.map((v,j)=>ca(v,cs(b[i][j],-1))));
  const eye=n=>Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>[+(i===j),0]));
  function rhoMatrix(v){return[ [[(1+v.z)/2,0],[v.x/2,-v.y/2]],[[v.x/2,v.y/2],[(1-v.z)/2,0]] ];}
  function channelRecord(c){var r=rates(c),t=c.time,eta=Math.exp(-r.gamma1*t),loss=-Math.expm1(-r.gamma1*t),d=Math.exp(-r.gammaPhi*t),lambda=Math.exp(-r.gamma2*t),shift=r.zEq*loss,angle=r.omega*t,s=Math.sqrt(eta),l=Math.sqrt(loss),p=Math.sqrt(1-r.q),q=Math.sqrt(r.q),real=[[[p,0],[0,p*s]],[[0,p*l],[0,0]],[[q*s,0],[0,q]],[[0,0],[q*l,0]]];
    var damping=real.map(a=>a.map(row=>row.map(x=>[x,0]))),phase=[[[[Math.sqrt((1+d)/2),0],cz()],[cz(),[Math.sqrt((1+d)/2),0]]],[[[Math.sqrt((1-d)/2),0],cz()],[cz(),[-Math.sqrt((1-d)/2),0]]]],u=[[[Math.cos(angle/2),-Math.sin(angle/2)],cz()],[cz(),[Math.cos(angle/2),Math.sin(angle/2)]]];
    var kraus=[];phase.forEach((D,j)=>damping.forEach((A,i)=>kraus.push({phase:j,damping:i,matrix:mul(u,mul(D,A))})));
    var completeness=kraus.reduce((a,k)=>addm(a,mul(dag(k.matrix),k.matrix)),zm(2)),choi=zm(4);
    kraus.forEach(k=>{for(var i=0;i<2;i++)for(var a=0;a<2;a++)for(var j=0;j<2;j++)for(var b=0;b<2;b++)choi[2*i+a][2*j+b]=ca(choi[2*i+a][2*j+b],cs(cm(k.matrix[a][i],cc(k.matrix[b][j])),.5));});
    var diagonal=[(1+shift+eta)/4,(1-shift-eta)/4,(1+shift-eta)/4,(1-shift+eta)/4],off=[lambda*Math.cos(angle)/2,-lambda*Math.sin(angle)/2],closed=zm(4);diagonal.forEach((v,i)=>closed[i][i]=[v,0]);closed[0][3]=off;closed[3][0]=cc(off);
    var large=(diagonal[0]+diagonal[3]+Math.hypot(diagonal[0]-diagonal[3],lambda))/2,small=large===0?0:(diagonal[0]*diagonal[3]-lambda*lambda/4)/large,eigenvalues=[diagonal[1],diagonal[2],small,large].sort((a,b)=>a-b);
    return{rates:r,eta,loss,dephasing:d,lambda,shift,angle,damping,phase,unitary:u,kraus,completeness,completenessResidual:diffm(completeness,eye(2)),choi,choiClosed:closed,choiResidual:diffm(choi,closed),choiEigenvalues:eigenvalues};
  }
  function snapshot(input){var c=normalizeConfig(input),initial=INITIALS[c.initial].vector,ch=channelRecord(c),vector=evolve(c.channel,c.time,c.omega,c.T1,c.Tphi,initial,c.q),rho0=rhoMatrix(initial),rho=rhoMatrix(vector),terms=ch.kraus.map(k=>mul(mul(k.matrix,rho0),dag(k.matrix))),krausRho=terms.reduce(addm,zm(2)),half=evolve(c.channel,c.time/2,c.omega,c.T1,c.Tphi,initial,c.q),twice=evolve(c.channel,c.time/2,c.omega,c.T1,c.Tphi,half,c.q),times=c.time===0?[0]:Array.from({length:129},(_,i)=>c.time*i/128),nodes=times.map(t=>{var v=evolve(c.channel,t,c.omega,c.T1,c.Tphi,initial,c.q);return{time:t,vector:v,diagnostics:diagnostics(v)};});return{version:169,parameters:c,scope:'固定能量基底；时间齐次、非负常速率的单比特 CPTP 半群；q∈[0,1/2]，q=1/2 为无限温极限。Choi 状态归一化为迹 1，按输入⊗输出排序。纯度和端点预测不代表单调性；无随机抽样。',initial,channel:ch,vector,diagnostics:diagnostics(vector),rho0,rho,krausTerms:terms,krausRho,krausResidual:diffm(krausRho,rho),semigroup:{half,twice,residual:{x:twice.x-vector.x,y:twice.y-vector.y,z:twice.z-vector.z}},nodes};}
  function numericSelfChecks(){var checks=[];function check(name,value,expected,tol){checks.push({name,value,expected,ok:close(value,expected,tol||2e-12)});}CHANNELS.forEach(c=>Object.keys(INITIALS).forEach(initial=>{var s=snapshot({channel:c.key,initial});check(c.key+'/'+initial+' trace',s.diagnostics.trace,1);check(c.key+'/'+initial+' Kraus',Math.max(...s.krausResidual.flat(2).map(Math.abs)),0);check(c.key+'/'+initial+' Choi',Math.max(...s.channel.choiResidual.flat(2).map(Math.abs)),0);check(c.key+'/'+initial+' semigroup',Math.max(...Object.values(s.semigroup.residual).map(Math.abs)),0);}));var passed=checks.filter(c=>c.ok).length;return{passed,total:checks.length,ok:passed===checks.length,checks};}

  var PRESETS=[
    {key:'default',label:'倾斜纯态 · 零温合并',config:{}},
    {key:'unitary',label:'只转相位',config:{channel:'unitary'}},
    {key:'dephasing',label:'退相位不失能',config:{channel:'dephasing'}},
    {key:'excited',label:'纯度先降后升',config:{channel:'amplitude',initial:'excited',time:6}},
    {key:'ground',label:'基态不再衰减',config:{channel:'amplitude',initial:'ground'}},
    {key:'mixed',label:'混合态被冷却',config:{channel:'amplitude',initial:'mixed',time:6}},
    {key:'thermal',label:'有限温吸收与发射',config:{channel:'thermal',initial:'ground',time:6,q:.2}},
    {key:'hot',label:'无限温极限',config:{channel:'thermal',initial:'excited',time:10,q:.5}},
    {key:'zero',label:'初始时刻',config:{time:0}},
    {key:'phase',label:'相位反转方向',config:{channel:'unitary',initial:'plus',omega:-4,time:3}}
  ];
  function fmt(v){if(typeof v==='string')return v;if(!finite(v))throw Error('非有限显示值');if(v===0)return'0';if(Math.abs(v)<1e-5)return v.toExponential(5);return v.toFixed(6).replace(/\.?0+$/,'');}
  function complexText(v){return fmt(v[0])+(v[1]<0?' − ':' + ')+fmt(Math.abs(v[1]))+'i';}
  function plots(s){var n=s.nodes,t=s.parameters.time||1,line=(name,color,points)=>({name,color,points});return[
    {key:'population',title:'布居、相干与纯度：三种不同的变化',xLabel:'时间 t',yLabel:'诊断量',xMin:0,xMax:t,yMin:0,yMax:1,degenerate:s.parameters.time===0,series:[line('p₁ · 激发态布居','#376fbb',n.map(r=>[r.time,r.diagnostics.population])),line('C · 固定基底相干','#348054',n.map(r=>[r.time,r.diagnostics.coherence])),line('P · 纯度','#b76b16',n.map(r=>[r.time,r.diagnostics.purity]))]},
    {key:'bloch',title:'x–y 平面投影：长度表示相干模 C',xLabel:'x',yLabel:'y',xMin:-1,xMax:1,yMin:-1,yMax:1,series:[line('单位圆投影边界','#8b8790',Array.from({length:129},(_,i)=>[Math.cos(2*Math.PI*i/128),Math.sin(2*Math.PI*i/128)])),line('当前初态的时间轨迹','#376fbb',n.map(r=>[r.vector.x,r.vector.y]))]},
    {key:'spectrum',title:'约化态的本征值与熵',xLabel:'时间 t',yLabel:'本征值 / 熵（bit）',xMin:0,xMax:t,yMin:0,yMax:1,degenerate:s.parameters.time===0,series:[line('λmin','#376fbb',n.map(r=>[r.time,r.diagnostics.minEigenvalue])),line('λmax','#348054',n.map(r=>[r.time,r.diagnostics.eigenvalues[1]])),line('S · 冯诺依曼熵','#b76b16',n.map(r=>[r.time,r.diagnostics.entropy]))]}
  ];}
  function svg(plot){const W=900,H=500,left=plot.key==="bloch"?325:100,right=plot.key==="bloch"?615:855,top=95,bottom=385,x=v=>left+(v-plot.xMin)/(plot.xMax-plot.xMin)*(right-left),y=v=>bottom-(v-plot.yMin)/(plot.yMax-plot.yMin)*(bottom-top),esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));let out='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(plot.title)+'"><title>'+esc(plot.title)+'</title><style>text{font-family:system-ui,sans-serif;fill:currentColor;font-size:15px}</style>';
    out+='<text x="30" y="30" font-weight="700">'+esc(plot.title)+'</text>';
    for(let i=0;i<=4;i++){let a=plot.xMin+(plot.xMax-plot.xMin)*i/4,b=plot.yMin+(plot.yMax-plot.yMin)*i/4;if(!plot.degenerate||i===0)out+='<text x="'+x(a)+'" y="410" text-anchor="middle">'+fmt(a)+'</text>';out+='<line x1="'+left+'" y1="'+y(b)+'" x2="'+right+'" y2="'+y(b)+'" stroke="currentColor" opacity=".18"/><text x="'+(left-15)+'" y="'+(y(b)+5)+'" text-anchor="end">'+fmt(b)+'</text>';}
    out+='<text x="'+((left+right)/2)+'" y="442" text-anchor="middle">'+esc(plot.xLabel)+(plot.degenerate?'（此时只有 t=0 一点）':'')+'</text><text x="25" y="70">'+esc(plot.yLabel)+'</text>';
    plot.series.forEach((s,i)=>{let d=s.points.map((p,j)=>(j?'L':'M')+x(p[0]).toFixed(6)+','+y(p[1]).toFixed(6)).join(' ');out+='<path data-series="'+i+'" d="'+d+'" fill="none" stroke="'+s.color+'" stroke-width="2.6"/>';const last=s.points[s.points.length-1];out+='<circle data-endpoint="'+i+'" cx="'+x(last[0])+'" cy="'+y(last[1])+'" r="4" fill="'+s.color+'"/><line x1="'+(40+i*280)+'" y1="473" x2="'+(60+i*280)+'" y2="473" stroke="'+s.color+'" stroke-width="3"/><text x="'+(68+i*280)+'" y="478">'+esc(s.name)+'</text>';});return out+'</svg>';
  }
  function tables(s){var rows=[],d=s.diagnostics;[['x',s.vector.x],['y',s.vector.y],['z',s.vector.z],['p₁ = E/(ℏω₀)',d.population],['C',d.coherence],['P',d.purity],['λmin',d.minEigenvalue],['S / bit',d.entropy],['Tr ρ',d.trace]].forEach(a=>rows.push(a));var matrixRows=(a)=>a.flatMap((r,i)=>r.map((v,j)=>[i,j,complexText(v)]));return[
    {key:'summary',title:'当前读数',headers:['量','值'],rows},
    {key:'rates',title:'实际启用的速率（未启用的旋钮不参与演化）',headers:['量','值'],rows:Object.entries(s.channel.rates)},
    {key:'states',title:'全部 129 个时间节点（t=0 时仅一个）',headers:['t','x','y','z','p₁','C','P','λmin','S / bit'],rows:s.nodes.map(n=>[n.time,n.vector.x,n.vector.y,n.vector.z,n.diagnostics.population,n.diagnostics.coherence,n.diagnostics.purity,n.diagnostics.minEigenvalue,n.diagnostics.entropy])},
    {key:'rho',title:'密度矩阵：Bloch 公式与 Kraus 求和',headers:['行','列','ρ','ΣKρK†','差'],rows:matrixRows(s.rho).map(r=>[...r,complexText(s.krausRho[r[0]][r[1]]),complexText(s.krausResidual[r[0]][r[1]])])},
    {key:'kraus',title:'8 个复合 Kraus 算符（含零算符）',headers:['退相位分支','热交换分支','行','列','元素'],rows:s.channel.kraus.flatMap(k=>matrixRows(k.matrix).map(r=>[k.phase,k.damping,...r]))},
    {key:'completeness',title:'保迹检验 ΣK†K = I',headers:['行','列','ΣK†K','与 I 的差'],rows:matrixRows(s.channel.completeness).map(r=>[...r,complexText(s.channel.completenessResidual[r[0]][r[1]])])},
    {key:'choi',title:'归一化 Choi 状态：输入 ⊗ 输出顺序',headers:['行','列','Kraus 构造','闭式','差'],rows:matrixRows(s.channel.choi).map(r=>[...r,complexText(s.channel.choiClosed[r[0]][r[1]]),complexText(s.channel.choiResidual[r[0]][r[1]])])},
    {key:'choi-spectrum',title:'Choi 本征值（升序；迹为 1）',headers:['序号','本征值'],rows:s.channel.choiEigenvalues.map((v,i)=>[i,v])},
    {key:'semigroup',title:'半群检验：一次 t 与两次 t/2',headers:['分量','Φt(r₀)','Φt/2(Φt/2(r₀))','差'],rows:['x','y','z'].map(k=>[k,s.vector[k],s.semigroup.twice[k],s.semigroup.residual[k]])}
  ];}

  var mounted=new WeakMap();
  function mount(root){var doc=root.ownerDocument;var previous=mounted.get(root);if(previous)previous();var url=null,c=normalizeConfig(),choices={},revealed=false,view=0;root.replaceChildren();root.classList.add('lq169');
    function el(tag,attrs={},text){var e=doc.createElement(tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));if(text!==undefined)e.textContent=text;return e;}
    if(!doc.querySelector('[data-lq169-style]')){let style=el('style',{'data-lq169-style':''});style.textContent='.lq169{min-width:0;color:var(--fg,#222);line-height:1.65}.lq169 *{box-sizing:border-box}.lq169 button,.lq169 select{font:inherit;min-height:44px;padding:8px;border:1px solid var(--border,#aaa);border-radius:5px;background:var(--block-bg,#eee);color:inherit;max-width:100%;white-space:normal}.lq169 button[aria-pressed="true"]{outline:2px solid var(--accent,#a33)}.lq169 button:focus-visible,.lq169 select:focus-visible,.lq169 [tabindex]:focus-visible{outline:3px solid #2474bc}.lq169 .lq-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.lq169 label{display:grid;gap:4px;min-width:0}.lq169 input{width:100%;min-height:44px}.lq169 .lq-row{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.lq169 .lq-pred{padding:10px 0;border-top:1px solid var(--border,#aaa)}.lq169 .lq-feedback{margin:7px 0}.lq169 .lq-scroll{max-width:100%;overflow:auto}.lq169 svg{display:block;min-width:680px;width:100%;height:auto}.lq169 table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums}.lq169 td,.lq169 th{white-space:nowrap;text-align:right;padding:7px;border:1px solid var(--border,#bbb)}.lq169 [hidden]{display:none!important}.lq169 details{margin:12px 0}.lq169 summary{min-height:44px;cursor:pointer}.lq169 .lq-status{border-left:3px solid var(--accent,#a33);padding:8px 12px}.lq169 .lq-correct{color:var(--cl-green,#277540)}.lq169 .lq-wrong{color:var(--cl-red,#a33)}@media(max-width:600px){.lq169 .lq-grid{grid-template-columns:1fr}}';doc.head.appendChild(style);}
    root.append(el('h3',{},'单比特开放系统：态、通道与环境分开核对'));
    root.append(el('p',{},'先选初态与环境，再预测。结果包含相同模型的 Bloch 解、Kraus 求和和 Choi 状态；纯度不一定随耗散单调下降。'));
    var presets=el('div',{class:'lq-row','aria-label':'教学预设'});PRESETS.forEach(p=>{let b=el('button',{type:'button','data-preset':p.key},p.label);b.onclick=()=>{c=normalizeConfig(p.config);sync();reset();};presets.append(b);});root.append(presets);
    var fields={},grid=el('div',{class:'lq-grid'});
    function select(key,title,options){let label=el('label',{},title),input=el('select',{'data-field':key,'aria-label':title});options.forEach(([v,t])=>input.append(el('option',{value:v},t)));label.append(input);grid.append(label);fields[key]=input;input.onchange=()=>{c[key]=input.value;reset();};}
    select('channel','动力学通道',CHANNELS.map(r=>[r.key,r.label]));select('initial','初态',Object.entries(INITIALS).map(([k,v])=>[k,v.label]));
    var outs={};[['time','观察时间 t',0,10,.05],['omega','进动角频率 Ω',-4,4,.05],['T1','总布居弛豫时间 T₁',.2,8,.1],['Tphi','纯退相位时间 Tφ',.2,8,.1],['q','有限温平衡激发布居 q',0,.5,.01]].forEach(([key,title,min,max,step])=>{let label=el('label',{},title),out=el('output'),input=el('input',{type:'range',min,max,step,'data-field':key,'aria-label':title});label.append(out,input);grid.append(label);fields[key]=input;outs[key]=out;input.oninput=()=>{c[key]=+input.value;reset();};});root.append(grid);
    var rateNote=el('p'),prediction=el('section',{'aria-label':'先预测'});root.append(rateNote,prediction);prediction.append(el('h4',{},'当前时刻与 t=0 比较：会变还是不变？'),el('p',{},'比较端点差值，阈值为 10⁻⁸；“不变”不等于整段轨迹恒定。相干只比较模。能量与布居在固定 H₀ 下是同一项检查。'));
    var predButtons={},feedbacks={};METRICS.forEach(m=>{let row=el('div',{class:'lq-pred'});row.append(el('strong',{},m.label));predButtons[m.key]=[];[true,false].forEach(v=>{let b=el('button',{type:'button','data-prediction':m.key,'data-choice':String(v),'aria-pressed':'false'},v?'会变':'不变');b.onclick=()=>{choices[m.key]=v;predButtons[m.key].forEach(b=>b.setAttribute('aria-pressed',String(b.getAttribute('data-choice')===String(v))));if(revealed)showFeedback();};predButtons[m.key].push(b);row.append(b);});let f=el('p',{class:'lq-feedback','data-feedback':m.key});feedbacks[m.key]=f;row.append(f);prediction.append(row);});
    var check=el('button',{type:'button','data-check':''},'核对预测并显示结果'),status=el('p',{class:'lq-status','aria-live':'polite'});root.append(check,status);
    var stage=el('section',{'data-stage':'',hidden:'','aria-label':'实验结果'}),plotButtons=el('div',{class:'lq-row'}),plotWrap=el('div',{class:'lq-scroll',tabindex:'0',role:'region','aria-label':'图表，可横向滚动'}),plotNote=el('p',{},'手机可在图表区域横向滚动；端点用实心点标出。x–y 图只画平面投影，完整态还需要 z。'),summary=el('p'),tableHost=el('div'),download=el('a',{'data-download':'',download:'lindblad-qubit-record.json'},'下载当前完整数值记录（JSON）');stage.append(summary,plotButtons,plotWrap,plotNote,tableHost,download);root.append(stage);var current;
    function showFeedback(){let total=0;METRICS.forEach(m=>{if(typeof choices[m.key]!=='boolean')return;let f=predictionFeedback(m.key,choices[m.key],c);total+=+f.correct;feedbacks[m.key].textContent=f.text+' 初值 '+fmt(f.before)+' → 当前 '+fmt(f.after)+'。';feedbacks[m.key].className='lq-feedback '+(f.correct?'lq-correct':'lq-wrong');});status.textContent='预测核对：'+total+'/4 正确。读数、曲线和下载均对应当前参数。';}
    function draw(){var ps=plots(current);plotWrap.innerHTML=svg(ps[view]);Array.from(plotButtons.children).forEach((b,i)=>b.setAttribute('aria-pressed',String(i===view)));}
    function render(){current=snapshot(c);root.__lindbladSnapshot=current;stage.hidden=false;summary.textContent=INITIALS[c.initial].label+'；z='+fmt(current.vector.z)+'，p₁='+fmt(current.diagnostics.population)+'，C='+fmt(current.diagnostics.coherence)+'，P='+fmt(current.diagnostics.purity)+'。';plotButtons.replaceChildren();plots(current).forEach((p,i)=>{let b=el('button',{type:'button','data-plot':p.key},p.title);b.onclick=()=>{view=i;draw();};plotButtons.append(b);});draw();tableHost.replaceChildren();tables(current).forEach(t=>{let details=el('details',{'data-table':t.key}),heading=el('summary',{},t.title);details.append(heading);details.addEventListener('toggle',()=>{if(!details.open||details.children.length>1)return;let wrap=el('div',{class:'lq-scroll',tabindex:'0',role:'region','aria-label':t.title+'，可横向滚动'}),table=el('table'),head=el('thead'),tr=el('tr'),body=el('tbody');t.headers.forEach(h=>tr.append(el('th',{scope:'col'},h)));head.append(tr);t.rows.forEach(r=>{let row=el('tr');r.forEach(v=>row.append(el('td',{},typeof v==='number'?fmt(v):v)));body.append(row);});table.append(head,body);wrap.append(table);details.append(wrap);});tableHost.append(details);});if(url)hostWindow.URL.revokeObjectURL(url);url=hostWindow.URL.createObjectURL(new hostWindow.Blob([JSON.stringify(current,null,2)],{type:'application/json'}));download.href=url;showFeedback();}
    function sync(){Object.entries(fields).forEach(([k,e])=>e.value=c[k]);}
    function reset(){c=normalizeConfig(c);revealed=false;choices={};stage.hidden=true;delete root.__lindbladSnapshot;METRICS.forEach(m=>{feedbacks[m.key].textContent='';predButtons[m.key].forEach(b=>b.setAttribute('aria-pressed','false'));});Object.entries(outs).forEach(([k,o])=>o.textContent=fmt(c[k]));const r=rates(c);fields.q.disabled=c.channel!=='thermal';fields.omega.disabled=!['unitary','combined','thermal'].includes(c.channel);fields.T1.disabled=r.gamma1===0;fields.Tphi.disabled=r.gammaPhi===0;rateNote.textContent='实际速率：Γ↓='+fmt(r.down)+'，Γ↑='+fmt(r.up)+'，Γφ='+fmt(r.gammaPhi)+'，Γ₂='+fmt(r.gamma2)+'。灰色旋钮在本通道中不启用。';status.textContent='参数已就绪。完成四项预测后显示结果。';}
    check.onclick=()=>{if(!METRICS.every(m=>typeof choices[m.key]==='boolean')){status.textContent='请先为四个量各选一个预测。';return;}revealed=true;render();};sync();reset();mounted.set(root,()=>{if(url)hostWindow.URL.revokeObjectURL(url);});
  }

if(typeof module!=="undefined"&&module.exports)module.exports={INITIAL,INITIALS,DEFAULTS,CHANNELS,PRESETS,normalizeConfig,t2FromRates,evolve,diagnostics,changeFlags,predictionFeedback,numericSelfChecks,snapshot,plots,tables,svg,fmt};
if(hostWindow&&hostWindow.CourseLearning)hostWindow.CourseLearning.register("lindblad-qubit",mount);
})(typeof window!=="undefined"?window:null);
