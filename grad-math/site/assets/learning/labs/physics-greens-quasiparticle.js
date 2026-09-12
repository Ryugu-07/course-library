(function(hostWindow){"use strict";

const LIMITS={levelPercent:[-300,300],bathPercent:[-300,300],hybridPercent:[0,200],gammaPercent:[0,200],etaPercent:[1,100],interactionPercent:[0,600],chemicalPercent:[-200,800],temperaturePercent:[0,200]};
const DEFAULT={levelPercent:100,bathPercent:-100,hybridPercent:100,gammaPercent:30,etaPercent:10,interactionPercent:400,chemicalPercent:200,temperaturePercent:50};
function config(input={}){if(input===null||typeof input!=='object'||Array.isArray(input))throw Error('parameters');for(const k of Object.keys(input))if(!Object.prototype.hasOwnProperty.call(LIMITS,k))throw Error('unknown '+k);const c={...DEFAULT,...input};for(const[k,[lo,hi]]of Object.entries(LIMITS))if(!Number.isInteger(c[k])||c[k]<lo||c[k]>hi)throw Error('domain '+k);return c;}
const PRESETS=[
['default','三模型默认对照',{}],
['resonant','两能级共振：完全转移',{levelPercent:0,bathPercent:0}],
['decoupled','关闭杂化：只有一条可见谱线',{hybridPercent:0}],
['degenerate','零杂化且两能级简并',{levelPercent:0,bathPercent:0,hybridPercent:0}],
['sharp','Gamma=0：离散谱边界',{gammaPercent:0,etaPercent:1}],
['blurred','只改显示 eta：动力学不变',{etaPercent:100}],
['broad','宽带模型大 Gamma',{gammaPercent:200}],
['noninteracting','原子 U=0：两跃迁合并',{interactionPercent:0,chemicalPercent:0}],
['empty','原子零温空态',{chemicalPercent:-200,temperaturePercent:0}],
['full','原子零温满态',{chemicalPercent:800,temperaturePercent:0}],
['atomic-degenerate','原子零温空/单占据简并',{chemicalPercent:0,temperaturePercent:0}],
['hot','原子高温、非半填充',{chemicalPercent:100,temperaturePercent:200}]
].map(([id,label,p])=>({id,label,parameters:config(p)}));
const add=(a,b)=>[a[0]+b[0],a[1]+b[1]],mul=(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]];
function div(a,b){const d=b[0]*b[0]+b[1]*b[1];if(d===0)throw Error('complex pole');return[(a[0]*b[0]+a[1]*b[1])/d,(a[1]*b[0]-a[0]*b[1])/d];}
const abs2=z=>z[0]*z[0]+z[1]*z[1];
const phase=(e,t)=>[Math.cos(e*t),-Math.sin(e*t)];
function fermi(e,T){if(T===0)return e<0?1:e>0?0:.5;const q=Math.exp(-Math.abs(e)/T);return e>=0?q/(1+q):1/(1+q);}
function pole(e,center,width){if(width===0)return{value:e===center?null:0,discrete:true,atPole:e===center};return{value:width/(Math.PI*((e-center)**2+width**2)),discrete:false,atPole:false};}
function mass(center,width,lo,hi){if(width===0)return center>lo&&center<hi?1:center===lo||center===hi?.5:0;return(Math.atan((hi-center)/width)-Math.atan((lo-center)/width))/Math.PI;}
function twoLevel(ea,eb,v){const mean=(ea+eb)/2,d=(ea-eb)/2,r=Math.hypot(d,v),degenerate=r===0;
 const poles=degenerate?[{energy:mean,weight:1,projector:[[1,0],[0,1]],rank:2}]:[-1,1].map(sign=>({energy:mean+sign*r,weight:(1+sign*d/r)/2,projector:[[(1+sign*d/r)/2,sign*v/(2*r)],[sign*v/(2*r),(1-sign*d/r)/2]],rank:1}));
 return{hamiltonian:[[ea,v],[v,eb]],mean,d,r,degenerate,poles,period:r===0?null:Math.PI/r,transferMaximum:r===0?0:v*v/(r*r),moments:[1,ea,ea*ea+v*v],zero:v===0?null:eb};
}
function dynamics(m,t,eta){if(t<0)return{time:t,causal:false,amplitude:[0,0],transfer:[0,0],survival:null,transferProbability:null,smoothed:[0,0],anticommutator:[0,0]};
 const ct=Math.cos(m.r*t),st=m.r===0?t:Math.sin(m.r*t)/m.r,global=phase(m.mean,t),a=mul(global,[ct,-m.d*st]),b=mul(global,[0,-m.hamiltonian[0][1]*st]);
 return{time:t,causal:true,amplitude:a,transfer:b,survival:abs2(a),transferProbability:abs2(b),smoothed:a.map(x=>x*Math.exp(-eta*t)),anticommutator:a};
}
function atom(U,mu,T){const energies=[0,-mu,-mu,U-2*mu],minimum=Math.min(...energies),boltzmann=energies.map(e=>T===0?+(e===minimum):Math.exp(-(e-minimum)/T)),shiftedPartition=boltzmann.reduce((a,b)=>a+b,0),probabilities=boltzmann.map(q=>q/shiftedPartition),n=probabilities[2]+probabilities[3];
 const transitions=[{from:0,to:1,energy:-mu,addition:probabilities[0],removal:probabilities[1],weight:probabilities[0]+probabilities[1]},{from:2,to:3,energy:U-mu,addition:probabilities[2],removal:probabilities[3],weight:probabilities[2]+probabilities[3]}].map(r=>({...r,fermi:fermi(r.energy,T)}));
 const poles=U===0?[{energy:-mu,weight:1}]:transitions.map(({energy,weight})=>({energy,weight}));
 return{U,mu,T,energies,minimum,shiftedPartition,probabilities,occupation:n,doubleOccupation:probabilities[3],transitions,poles,moments:[1,-mu+U*n,mu*mu-2*mu*U*n+U*U*n],occupiedSpectralWeight:transitions.reduce((s,r)=>s+r.weight*r.fermi,0),zero:U*U*n*(1-n)===0?null:U*(1-n)-mu,groundMultiplicity:energies.filter(e=>e===minimum).length};
}
function spectral(poles,E,eta){return poles.reduce((s,p)=>add(s,div([p.weight,0],[E-p.energy,eta])),[0,0]);}
function twoSigma(m,E,eta){const v=m.hamiltonian[0][1];return v===0?[0,0]:div([v*v,0],[E-m.hamiltonian[1][1],eta]);}
function atomSigma(a,E,eta){const n=a.occupation,coefficient=a.U*a.U*n*(1-n);return coefficient===0?[a.U*n,0]:add([a.U*n,0],div([coefficient,0],[E+a.mu-a.U*(1-n),eta]));}
function timePole(e,g,t){if(t<0)return{time:t,causal:false,amplitude:[0,0],envelope:0,squaredEnvelope:0};const envelope=Math.exp(-g*t);return{time:t,causal:true,amplitude:phase(e,t).map(x=>x*envelope),envelope,squaredEnvelope:envelope*envelope};}
function atomicTime(a,t){if(t<0)return[0,0];return a.poles.reduce((s,p)=>add(s,phase(p.energy,t).map(x=>x*p.weight)),[0,0]);}
function compute(input={}){
 const c=config(input),ea=c.levelPercent/100,eb=c.bathPercent/100,v=c.hybridPercent/100,gamma=c.gammaPercent/100,eta=c.etaPercent/100,a=atom(c.interactionPercent/100,c.chemicalPercent/100,c.temperaturePercent/100),m=twoLevel(ea,eb,v);
 const centers=[[ea,gamma],...m.poles.map(p=>[p.energy,eta]),...a.poles.map(p=>[p.energy,eta]),[eb,eta],...(a.zero===null?[]:[[a.zero,eta]])];
 const local=centers.flatMap(([e,width])=>[-8,-4,-2,-1,-.5,-.25,0,.25,.5,1,2,4,8].map(q=>e+q*width)).filter(e=>e>=-10&&e<=10);
 const energyGrid=Array.from(new Set([...Array.from({length:201},(_,i)=>(i-100)/10),...local])).sort((x,y)=>x-y);
 const spectrum=energyGrid.map(E=>{const gt=spectral(m.poles,E,eta),ga=spectral(a.poles,E,eta),st=twoSigma(m,E,eta),sa=atomSigma(a,E,eta);return{energy:E,wide:pole(E,ea,gamma),twoGreen:gt,twoA:-gt[1]/Math.PI,atomGreen:ga,atomA:-ga[1]/Math.PI,twoSigma:st,atomSigma:sa};});
 const times=Array.from({length:211},(_,i)=>(i-10)/10),time=times.map(t=>{const atomic=atomicTime(a,t);return{time:t,wide:timePole(ea,gamma,t),two:dynamics(m,t,eta),atomicAnticommutator:atomic,atomicSquaredModulus:t<0?null:abs2(atomic)};});
 const windows=Array.from({length:100},(_,i)=>{const W=(i+1)/10;return{halfWidth:W,wideMass:mass(ea,gamma,-W,W),twoMass:m.poles.reduce((s,p)=>s+p.weight*mass(p.energy,eta,-W,W),0),atomMass:a.poles.reduce((s,p)=>s+p.weight*mass(p.energy,eta,-W,W),0)};});
 const poles=m.poles.map(p=>({...p,derivativeResidue:v===0?p.weight:1/(1+v*v/(p.energy-eb)**2),visible:p.weight>0}));
 return{schema:'greens193-v1',parameters:c,units:{energy:'E0',time:'hbar/E0',spectral:'1/E0',temperature:'kBT/E0',chemicalPotential:'atomic level is zero; energies relative to mu'},wide:{center:ea,gamma,physicalModel:'wide-band Markov pole',weight:1,fwhm:2*gamma,amplitudeTime:gamma===0?null:1/gamma,squaredAmplitudeTime:gamma===0?null:1/(2*gamma),discrete:gamma===0,moments:gamma===0?[1,ea,ea*ea]:[1,null,null]},two:{...m,poles},atom:a,eta,spectrum,time,windows,windowMass:windows[99],boundaries:{etaOnlyDisplay:true,closedTwoLevelNoDecay:true,atomicPeaksNoDecay:true,atomicSquaredIsNotPopulation:true,widePopulationNeedsModel:true,broadenedHigherMomentsUndefined:true,singleFermionDiagonal:true,tZeroIsRightLimit:true,windowEndpointHalfWeight:true,atomicTZeroEqualGroundMixture:true,atomicModelIsNotLatticeMottProof:true,exactPolesWithinWindow:[...m.poles,...a.poles].every(p=>Math.abs(p.energy)<10)}};
}
const QUESTIONS=[
['只把封闭两能级谱的显示 eta 加倍，真实回返概率怎样？',['保持不变；eta 只做显示平滑','指数衰减速度加倍'],0,'本实验的封闭 Hamiltonian 不含 eta。谱的显示卷积会改变曲线；真实幺正动力学仍由两个实能量决定。'],
['一条归一化 Lorentzian 在有限图窗里的面积一定是 1 吗？',['一定；和规则要求每个图窗为1','不一定；图窗外有尾部'],1,'和规则对全能量轴成立。有限窗用 arctan 积分单独计算；Gamma=0 时按离散谱质量记录。'],
['Hubbard 原子谱有两条理想峰，就有有限单粒子寿命吗？',['有；两个峰说明粒子分裂并耗散','没有；有限封闭模型只有离散跃迁和相干时间依赖'],1,'相互作用可以改变峰数和权重而不产生不可逆衰减。原子极限也不等于已经证明晶格的 Mott 相变。'],
['一般多体平衡态的 |iℏGᴿ(t)|²，可以直接当电子占据吗？',['不可以；它混合添加与移除，需另查占据相关函数','可以；所有 Green 函数都是概率振幅'],0,'只有明确的一粒子传播或指定衰减模型才能如此解释平方。原子的占据是热概率之和，也等于每条谱线乘 Fermi 因子后的总和。']
];
function feedback(i,j){if(!Number.isInteger(i)||i<0||i>=4||![0,1].includes(j))throw Error('choice');return{correct:j===QUESTIONS[i][2],text:(j===QUESTIONS[i][2]?'正确。':'需要修正。')+QUESTIONS[i][3]};}
const LABELS={levelPercent:'两能级/宽带中心 ea ×100',bathPercent:'第二能级 eb ×100',hybridPercent:'杂化 v ×100',gammaPercent:'仅宽带内禀 Γ ×100',etaPercent:'仅封闭谱显示 η ×100',interactionPercent:'原子 U ×100',chemicalPercent:'原子 μ ×100',temperaturePercent:'原子 kBT ×100',etaOnlyDisplay:'η只改变封闭谱的显示',closedTwoLevelNoDecay:'两能级没有内禀衰减',atomicPeaksNoDecay:'原子谱峰没有内禀衰减',atomicSquaredIsNotPopulation:'原子反对易函数平方不是占据',widePopulationNeedsModel:'宽带平方的占据解释需要模型',broadenedHigherMomentsUndefined:'Lorentzian平滑谱高阶矩不收敛',singleFermionDiagonal:'本页正性指规范费米子对角谱',tZeroIsRightLimit:'t=0使用右极限',windowEndpointHalfWeight:'δ落在窗边时采用半质量约定',atomicTZeroEqualGroundMixture:'原子零温取简并基态等权混合',atomicModelIsNotLatticeMottProof:'原子模型不能证明晶格Mott相变',exactPolesWithinWindow:'所有理想谱线均位于默认窗内'};
function fmt(x){if(x===null||x===undefined)return'不适用／极限值见说明';if(typeof x==='boolean')return x?'是':'否';if(Array.isArray(x))return'['+x.map(fmt).join(', ')+']';if(typeof x==='object')return JSON.stringify(x);if(typeof x==='number')return Number.isInteger(x)?String(x):Math.abs(x)<1e-4||Math.abs(x)>=1e5?x.toExponential(5):Number(x.toPrecision(7)).toString();return LABELS[x]??String(x);}
const COLORS=['#3875ba','#c55b32','#368661','#9860a8','#856722','#646e7c'];
function frame(key,title,xLabel,yLabel,series,domain,range){const ys=series.flatMap(s=>s.points.filter(Boolean).map(p=>p[1]));let ymin=range?.[0]??Math.min(...ys),ymax=range?.[1]??Math.max(...ys);if(ymin===ymax)ymax=ymin+1;if(!range){const pad=.07*(ymax-ymin);ymin-=pad;ymax+=pad;}return{key,title,xLabel,yLabel,xMin:domain[0],xMax:domain[1],yMin:ymin,yMax:ymax,series};}
function plots(s){
 const series=(name,color,points,extra={})=>({name,color:COLORS[color],points,...extra});
 const positive=fn=>s.time.filter(r=>r.time>=0).map(r=>[r.time,fn(r)]);
 const wide=s.wide.discrete?[series('δ线的质量1；不是有限峰高',0,[[s.wide.center,1]],{markersOnly:true}),series('谱线位置',1,[[s.wide.center,0],[s.wide.center,1]])]:[series('宽带模型 A(E)',0,s.spectrum.map(r=>[r.energy,r.wide.value]))];
 return[
 frame('wide','宽带模型：Gamma 是半宽；零宽时改画谱线质量','E/E0',s.wide.discrete?'δ线质量（无量纲）':'E0 A(E)',wide,[-10,10],s.wide.discrete?[0,1.1]:[0,Math.max(...s.spectrum.map(r=>r.wide.value))*1.06]),
 frame('spectra','两个封闭模型：eta 仅用于显示平滑','E/E0','E0 Aη(E)；理想谱线与权重在表中',[
 series('两能级投影谱',0,s.spectrum.map(r=>[r.energy,r.twoA])),
 series('Hubbard原子每自旋谱',1,s.spectrum.map(r=>[r.energy,r.atomA]))
 ],[-10,10],[0,Math.max(...s.spectrum.flatMap(r=>[r.twoA,r.atomA]))*1.06]),
 frame('complex','因果函数：t=0取右极限，负时间单独为零','t E0/ℏ','F(t)=iℏGᴿ(t) 的实部/虚部',[
 series('两能级 Re F',0,positive(r=>r.two.amplitude[0])),
 series('两能级 Im F',1,positive(r=>r.two.amplitude[1])),
 series('原子 Re F（不是占据）',2,positive(r=>r.atomicAnticommutator[0])),
 series('原子 Im F',3,positive(r=>r.atomicAnticommutator[1])),
 series('t<0：retarded为0',5,[[-1,0],[-.01,0]])
 ],[-1,20],[-1,1]),
 frame('time','相干回返与宽带衰减：先分清模型','t E0/ℏ','概率；标明的曲线仅为模平方',[
 series('两能级：回到a的概率',0,positive(r=>r.two.survival)),
 series('两能级：转移到b的概率',1,positive(r=>r.two.transferProbability)),
 series('宽带：衰减振幅模平方',2,positive(r=>r.wide.squaredEnvelope)),
 series('平滑后的两能级模平方（非真实）',3,positive(r=>abs2(r.two.smoothed)))
 ],[0,20],[0,1]),
 frame('selfenergy','同一解析自能：实部与虚部一起计算','E/E0；使用 z=E+iη','Σ(z)/E0',[
 series('两能级 Re Σ',0,s.spectrum.map(r=>[r.energy,r.twoSigma[0]])),
 series('两能级 Im Σ',1,s.spectrum.map(r=>[r.energy,r.twoSigma[1]])),
 series('原子 Re Σ',2,s.spectrum.map(r=>[r.energy,r.atomSigma[0]])),
 series('原子 Im Σ',3,s.spectrum.map(r=>[r.energy,r.atomSigma[1]]))
 ],[-10,10]),
 frame('window','全轴权重为1，不表示有限窗已经收全','图窗半宽 W/E0，积分区间[-W,W]','窗内谱质量（δ在边界取一半）',[
 series('宽带模型',0,s.windows.map(r=>[r.halfWidth,r.wideMass]),{markersOnly:s.wide.discrete}),
 series('两能级显示平滑谱',1,s.windows.map(r=>[r.halfWidth,r.twoMass])),
 series('原子显示平滑谱',2,s.windows.map(r=>[r.halfWidth,r.atomMass]))
 ],[0,10],[0,1])
 ];
}
function tables(s){return[
{key:'parameters',title:'8个参数：全部以E0为能量单位',headers:['参数（滑块整数须除以100）','值'],rows:Object.entries(s.parameters)},
{key:'models',title:'模型和时标：null不表示零寿命',headers:['量','值'],rows:[['宽带中心 ea/E0',s.wide.center],['宽带半宽 Γ/E0',s.wide.gamma],['宽带FWHM/E0',s.wide.fwhm],['振幅时间 E0/ℏ；Γ=0为∞',s.wide.amplitudeTime],['指定衰减模型平方时间 E0/ℏ；Γ=0为∞',s.wide.squaredAmplitudeTime],['显示η/E0',s.eta],['两能级真实回返周期 E0/ℏ；简并时常数',s.two.period],['两能级最大转移概率',s.two.transferMaximum],['原子每自旋占据',s.atom.occupation]]},
{key:'poles',title:'理想离散谱：能量与质量，不用峰高冒充权重',headers:['模型','能量/E0','谱质量','是否可见'],rows:[...s.two.poles.map(p=>['两能级',p.energy,p.weight,p.visible]),...s.atom.poles.map(p=>['原子',p.energy,p.weight,p.weight>0])]},
{key:'states',title:'原子完整四态：热概率采用移位配分函数',headers:['态(上,下)','K/E0','概率'],rows:s.atom.energies.map((e,i)=>[['(0,0)','(1,0)','(0,1)','(1,1)'][i],e,s.atom.probabilities[i]])},
{key:'transitions',title:'上自旋两条Lehmann跃迁：添加、移除与占据',headers:['低粒子数态编号','高粒子数态编号','跃迁能量/E0','添加权重','移除权重','合计谱权重','Fermi因子','谱权重×Fermi'],rows:s.atom.transitions.map(r=>[r.from,r.to,r.energy,r.addition,r.removal,r.weight,r.fermi,r.weight*r.fermi])},
{key:'spectrum',title:'能量采样：绝对谱密度，Γ=0的δ另见谱线表',headers:['E/E0','宽带A×E0（δ点不填）','宽带为离散谱','两能级ReG×E0','两能级ImG×E0','两能级Aη×E0','原子ReG×E0','原子ImG×E0','原子Aη×E0'],rows:s.spectrum.map(r=>[r.energy,r.wide.value,r.wide.discrete,...r.twoGreen,r.twoA,...r.atomGreen,r.atomA])},
{key:'selfenergy',title:'自能采样：η是复频率参数，不是推断出的内禀寿命',headers:['E/E0','两能级ReΣ/E0','两能级ImΣ/E0','原子ReΣ/E0','原子ImΣ/E0'],rows:s.spectrum.map(r=>[r.energy,...r.twoSigma,...r.atomSigma])},
{key:'time',title:'211个时间点：负时间只记录因果函数，不定义生存概率',headers:['tE0/ℏ','t≥0','两能级ReF','两能级ImF','到b振幅Re','到b振幅Im','生存概率','转移概率','平滑ReF','平滑ImF','宽带ReF','宽带ImF','宽带模平方','原子ReF','原子ImF','原子模平方（非占据）'],rows:s.time.map(r=>[r.time,r.two.causal,...r.two.amplitude,...r.two.transfer,r.two.survival,r.two.transferProbability,...r.two.smoothed,...r.wide.amplitude,r.wide.squaredEnvelope,...r.atomicAnticommutator,r.atomicSquaredModulus])},
{key:'windows',title:'100个有限图窗：atan解析积分，不是网格梯形面积',headers:['W/E0','宽带窗内质量','两能级显示谱窗内质量','原子显示谱窗内质量'],rows:s.windows.map(r=>[r.halfWidth,r.wideMass,r.twoMass,r.atomMass])},
{key:'moments',title:'未平滑谱的0/1/2阶矩：Lorentzian高阶矩不收敛',headers:['模型','M0','M1/E0','M2/E0²'],rows:[['宽带；Γ>0时高阶不填',...s.wide.moments],['两能级理想谱',...s.two.moments],['原子理想谱',...s.atom.moments]]},
{key:'residues',title:'两能级投影与极点留数；暗态没有a通道谱峰',headers:['能量/E0','a通道权重','导数留数/解耦极限','谱投影矩阵','投影秩'],rows:s.two.poles.map(p=>[p.energy,p.weight,p.derivativeResidue,p.projector,p.rank])},
{key:'boundaries',title:'适用范围与不能作出的推断',headers:['检查','说明'],rows:Object.entries(s.boundaries)}
];}
const axisFmt=v=>v===0?'0':Math.abs(v)<.001||Math.abs(v)>=10000?v.toExponential(2):Number(v.toFixed(3)).toString();
function svg(p){const left=100,right=855,top=95,bottom=385,X=v=>left+(v-p.xMin)/(p.xMax-p.xMin)*(right-left),Y=v=>bottom-(v-p.yMin)/(p.yMax-p.yMin)*(bottom-top),esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));let out='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 580" role="img" aria-label="'+esc(p.title)+'"><title>'+esc(p.title)+'</title><style>text{font:15px system-ui;fill:currentColor}</style><text x="30" y="30" font-weight="700">'+esc(p.title)+'</text><text x="25" y="70">'+esc(p.yLabel)+'</text>';
const discrete=false;const xticks=discrete?[...new Set(Array.from({length:5},(_,i)=>Math.round(p.xMin+(p.xMax-p.xMin)*i/4)))]:Array.from({length:5},(_,i)=>p.xMin+(p.xMax-p.xMin)*i/4);for(let i=0;i<=4;i++){const x=p.xMin+(p.xMax-p.xMin)*i/4,y=p.yMin+(p.yMax-p.yMin)*i/4;out+='<line x1="100" x2="855" y1="'+Y(y)+'" y2="'+Y(y)+'" stroke="currentColor" opacity=".18"/><text x="85" y="'+(Y(y)+5)+'" text-anchor="end">'+axisFmt(y)+'</text>';}for(const x of xticks){out+='<text x="'+X(x)+'" y="410" text-anchor="middle">'+axisFmt(x)+'</text>';}
out+='<text x="477" y="442" text-anchor="middle">'+esc(p.xLabel)+'</text>';
p.series.forEach((s,i)=>{let pen=false;const path=s.points.map(q=>{if(!q){pen=false;return '';}const d=(pen&&!s.markersOnly?'L':'M')+X(q[0]).toFixed(6)+','+Y(q[1]).toFixed(6);pen=true;return d;}).join(' ');out+='<path data-series="'+i+'" d="'+path+'" stroke="'+s.color+'" stroke-width="2.8" fill="none"/>';const marks=s.markersOnly?s.points.filter(Boolean):s.boundaryMarkers?[...new Set([s.points.find(Boolean),s.points.filter(Boolean).at(-1)])].filter(Boolean):s.points.filter(Boolean).length===1?s.points.filter(Boolean):[];marks.forEach(q=>out+='<circle cx="'+X(q[0])+'" cy="'+Y(q[1])+'" r="'+(s.markerRadius??5)+'" stroke="'+s.color+'" fill="'+(s.hollow?'none':s.open?'var(--bg,#fff)':s.color)+'" stroke-width="'+(s.markerStrokeWidth??2.5)+'"/>');out+='<line x1="'+(40+430*(i%2))+'" x2="'+(60+430*(i%2))+'" y1="'+(473+32*Math.floor(i/2))+'" y2="'+(473+32*Math.floor(i/2))+'" stroke="'+s.color+'" stroke-width="3"/><text x="'+(68+430*(i%2))+'" y="'+(478+32*Math.floor(i/2))+'">'+esc(s.name)+'</text>';});if(!p.series.some(s=>s.points.some(Boolean)))out+='<text x="450" y="245" text-anchor="middle">当前模型在此参数下无适用数据</text>';return out+'</svg>';}

var mounted=new WeakMap();
function mount(root){const doc=root.ownerDocument,previous=mounted.get(root);if(previous)previous();root.replaceChildren();root.classList.add('greens193');let c=config(PRESETS[0].parameters),choices={},revealed=false,url=null,current=null,view=0,valid=true;
 const el=(tag,attrs={},text)=>{const e=doc.createElement(tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);if(text!==undefined)e.textContent=text;return e;};
 if(!doc.querySelector('[data-greens193-style]')){const style=el('style',{'data-greens193-style':''});style.textContent='.greens193{margin-inline:0!important;width:100%;min-width:0;color:var(--fg,#222);line-height:1.65}.greens193 *{box-sizing:border-box}.greens193 button,.greens193 select{font:inherit;min-height:44px;padding:8px;border:1px solid var(--border,#aaa);border-radius:5px;background:var(--block-bg,#eee);color:inherit;max-width:100%;white-space:normal}.greens193 button[aria-pressed="true"]{outline:2px solid var(--accent,#a33)}.greens193 button:focus-visible,.greens193 select:focus-visible,.greens193 [tabindex]:focus-visible{outline:3px solid #2474bc}.greens193 .gr-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.greens193 label{display:grid;gap:4px;min-width:0}.greens193 input{width:100%;min-height:44px;font:inherit;color:inherit;background:var(--bg,#fff)}.greens193 .gr-row{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.greens193 .gr-pred>strong{display:block;margin-bottom:6px}.greens193 .gr-pred{padding:10px 0;border-top:1px solid var(--border,#aaa)}.greens193 .gr-feedback{margin:7px 0}.greens193 .gr-scroll{max-width:100%;overflow:auto}.greens193 svg{display:block;min-width:680px;width:100%;height:auto}.greens193 table{display:table;overflow:visible;max-width:none;border-collapse:collapse;width:max-content;min-width:100%;font-variant-numeric:tabular-nums}.greens193 td,.greens193 th{white-space:nowrap;text-align:right;padding:7px;border:1px solid var(--border,#bbb)}.greens193 [hidden]{display:none!important}.greens193 details{margin:12px 0}.greens193 summary{min-height:44px;cursor:pointer}.greens193 .gr-status{border-left:3px solid var(--accent,#a33);padding:8px 12px}.greens193 .gr-correct{color:var(--cl-green,#277540)}.greens193 .gr-wrong{color:var(--cl-red,#a33)}@media(max-width:600px){.greens193 .gr-grid{grid-template-columns:1fr}}';doc.head.append(style);}
 root.append(el('h3',{},'同样是谱峰，背后可以是三种不同机制'),el('p',{},'先比较宽带衰减、封闭两能级和Hubbard原子。三个模型并列计算；eta只对后两者作显示平滑，不能从它反推真实寿命。'));
 const presets=el('div',{class:'gr-row','aria-label':'教学预设'});for(const p of PRESETS){const b=el('button',{type:'button','data-preset':p.id},p.label);b.onclick=()=>{c=config(p.parameters);valid=true;sync();reset();};presets.append(b);}root.append(presets);
 const fields={},outs={},grid=el('div',{class:'gr-grid'});




 for(const[key,title]of [['levelPercent','两能级/宽带：ea/E0 ×100'],['bathPercent','两能级：eb/E0 ×100'],['hybridPercent','两能级：杂化v/E0 ×100'],['gammaPercent','仅宽带：内禀半宽Γ/E0 ×100'],['etaPercent','仅封闭谱显示：η/E0 ×100'],['interactionPercent','原子：U/E0 ×100'],['chemicalPercent','原子：μ/E0 ×100'],['temperaturePercent','原子：kBT/E0 ×100']]){const[min,max]=LIMITS[key],label=el('label',{},title),out=el('output'),input=el('input',{type:'range',min,max,step:1,'data-field':key,'aria-label':title});label.append(out,input);grid.append(label);fields[key]=input;outs[key]=out;input.oninput=input.onchange=change;}root.append(grid);
 function change(){try{c=config(Object.fromEntries(Object.entries(fields).map(([k,e])=>[k,e.value===''?NaN:Number(e.value)])));valid=true;sync();reset();}catch(e){valid=false;reset();status.textContent='请使用所示范围内的整数；能量输入会在计算时除以100。';}}
 const note=el('p'),prediction=el('section',{'aria-label':'先预测'});root.append(note,prediction);prediction.append(el('h4',{},'先预测：谱窗、显示平滑、相干回返与占据'),el('p',{},'四题的条件固定写在题干里；参数用来检查例子，不自动改变问题。'));
 const feedbacks=[],buttons=[];QUESTIONS.forEach((q,i)=>{const row=el('div',{class:'gr-pred'});row.append(el('strong',{},q[0]));buttons[i]=[];q[1].forEach((text,j)=>{const b=el('button',{type:'button','data-prediction':i,'data-choice':String(j===0),'aria-pressed':'false'},text);b.onclick=()=>{choices[i]=j;buttons[i].forEach((x,k)=>x.setAttribute('aria-pressed',String(j===k)));if(revealed)showFeedback();};row.append(b);buttons[i].push(b);});feedbacks[i]=el('p',{class:'gr-feedback','data-feedback':i});row.append(feedbacks[i]);prediction.append(row);});
 const check=el('button',{type:'button','data-check':''},'核对预测并显示完整结果'),status=el('p',{class:'gr-status','aria-live':'polite'});root.append(check,status);
 const stage=el('section',{'data-stage':'',hidden:'','aria-label':'实验结果'}),summary=el('p'),plotButtons=el('div',{class:'gr-row'}),plotWrap=el('div',{class:'gr-scroll',tabindex:0,role:'region','aria-label':'图表，可横向滚动'}),plotNote=el('p',{},'Γ=0时第一图改画δ线质量，不把δ函数画成有限峰高。封闭谱使用η平滑，理想谱线能量与权重另列在表中。负时间的因果函数单独画零线，不跨t=0连线。窗内质量采用解析积分，谱图采样不能代替面积验算。'),tableHost=el('div'),download=el('a',{'data-download':'',download:'gr-record.json'},'下载当前完整记录（JSON）');stage.append(summary,plotButtons,plotWrap,plotNote,tableHost,download);root.append(stage);
 function sync(){for(const[k,e]of Object.entries(fields))e.value=c[k];}
 function reset(){if(url){hostWindow.URL.revokeObjectURL(url);url=null;download.removeAttribute('href');}revealed=false;choices={};stage.hidden=true;delete root.__greensSnapshot;for(let i=0;i<4;i++){feedbacks[i].textContent='';for(const b of buttons[i])b.setAttribute('aria-pressed','false');}for(const[k,o]of Object.entries(outs))o.textContent=fmt(c[k]);note.textContent='能量单位E0；时间单位ℏ/E0。宽带半宽Γ不作用于封闭模型；显示η不作用于真实动力学。原子kBT=0取简并基态等权混合。改变任何参数后，请重新核对预测。';status.textContent='完成四项预测后显示当前结果。';}
 function showFeedback(){let n=0;for(let i=0;i<4;i++){if(!Number.isInteger(choices[i]))continue;const f=feedback(i,choices[i]);n+=+f.correct;feedbacks[i].textContent=f.text;feedbacks[i].className='gr-feedback '+(f.correct?'gr-correct':'gr-wrong');}status.textContent='预测核对：'+n+'/4 正确。图、表和下载均对应当前参数。';}
 function draw(){const ps=plots(current);plotWrap.innerHTML=svg(ps[view]);Array.from(plotButtons.children).forEach((b,i)=>b.setAttribute('aria-pressed',String(i===view)));}
 function render(){current=compute(c);root.__greensSnapshot=current;stage.hidden=false;summary.textContent='默认能量图窗[-10,10]内：宽带质量='+fmt(current.windowMass.wideMass)+'，两能级显示谱='+fmt(current.windowMass.twoMass)+'，原子显示谱='+fmt(current.windowMass.atomMass)+'。原子每自旋占据='+fmt(current.atom.occupation)+'，逐谱线乘Fermi因子的结果='+fmt(current.atom.occupiedSpectralWeight)+'。全轴谱权重均为1；η='+fmt(current.eta)+'只用于显示。';plotButtons.replaceChildren();plots(current).forEach((p,i)=>{const b=el('button',{type:'button','data-plot':p.key},p.title);b.onclick=()=>{view=i;draw();};plotButtons.append(b);});draw();tableHost.replaceChildren();for(const t of tables(current)){const d=el('details',{'data-table':t.key});d.append(el('summary',{},t.title));d.addEventListener('toggle',()=>{if(!d.open||d.children.length>1)return;const wrap=el('div',{class:'gr-scroll',tabindex:0,role:'region','aria-label':t.title+'，可横向滚动'}),table=el('table'),thead=el('thead'),tr=el('tr'),tbody=el('tbody');for(const h of t.headers)tr.append(el('th',{scope:'col'},h));thead.append(tr);for(const row of t.rows){const r=el('tr');for(const v of row)r.append(el('td',{},fmt(v)));tbody.append(r);}table.append(thead,tbody);wrap.append(table);d.append(wrap);});tableHost.append(d);}if(url)hostWindow.URL.revokeObjectURL(url);url=hostWindow.URL.createObjectURL(new hostWindow.Blob([JSON.stringify(current)],{type:'application/json'}));download.href=url;showFeedback();}
 check.onclick=()=>{if(!valid){status.textContent='请先修正无效参数。';return;}if(![0,1,2,3].every(i=>Number.isInteger(choices[i]))){status.textContent='请先为四个问题各选一个预测。';return;}revealed=true;render();};sync();reset();mounted.set(root,()=>{if(url)hostWindow.URL.revokeObjectURL(url);});
}

function selfTest(){let checks=0;const ok=x=>{checks++;if(!x)throw Error('Green invariant '+checks);};for(const p of PRESETS){const s=compute(p.parameters);ok(plots(s).length===6);ok(tables(s).length===12);ok(Math.abs(s.atom.occupation-s.atom.occupiedSpectralWeight)<1e-12);for(const r of s.time)if(r.time>=0){ok(Math.abs(r.two.survival+r.two.transferProbability-1)<1e-12);ok(r.wide.squaredEnvelope<=1);}for(const r of s.spectrum){ok(r.twoA>=0&&r.atomA>=0);ok(r.twoSigma[1]<=0&&r.atomSigma[1]<=0);}for(let i=0;i<4;i++)ok(feedback(i,QUESTIONS[i][2]).correct);}return{status:'PASS',checks};}
const API={LIMITS,DEFAULT,config,PRESETS,QUESTIONS,compute,snapshot:compute,plots,tables,svg,feedback,fmt,mount,selfTest,twoLevel,atom,spectral,twoSigma,atomSigma,dynamics,mass,fermi};if(typeof module!=="undefined"&&module.exports)module.exports=API;if(hostWindow&&hostWindow.CourseLearning)hostWindow.CourseLearning.register("physics-greens-quasiparticle",mount);})(typeof window!=="undefined"?window:null);
