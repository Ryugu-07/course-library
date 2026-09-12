(function(hostWindow){"use strict";

const DEFAULT={couplingPercent:30,cutoffPercent:100,temperaturePercent:50,gammaPercent:4,xiPercent:50,phaseDegrees:90,fluxPercent:0,asymmetryPercent:0};
const LIMITS={couplingPercent:[15,80],cutoffPercent:[50,200],temperaturePercent:[0,130],gammaPercent:[0,30],xiPercent:[-300,300],phaseDegrees:[0,360],fluxPercent:[-200,200],asymmetryPercent:[0,100]};
function config(input={}){if(!input||typeof input!=='object'||Array.isArray(input))throw Error('object');for(const k of Object.keys(input))if(!Object.hasOwn(DEFAULT,k))throw Error('key');const c={...DEFAULT,...input};for(const[k,[lo,hi]]of Object.entries(LIMITS))if(!Number.isInteger(c[k])||c[k]<lo||c[k]>hi)throw Error('integer/domain');return c;}
// Adaptive Simpson with eight initial panels. Error is an estimator, not an interval proof.
function quad(f,a,b,tol=2e-10){let evaluations=0,error=0,leaves=0;const F=x=>{evaluations++;const y=f(x);if(!Number.isFinite(y))throw Error('nonfinite integrand');return y;};
function rec(l,r,fl,fm,fr,S,eps,depth){const m=(l+r)/2,lm=(l+m)/2,rm=(m+r)/2,f1=F(lm),f2=F(rm),A=(m-l)*(fl+4*f1+fm)/6,B=(r-m)*(fm+4*f2+fr)/6,d=A+B-S;if(Math.abs(d)<=15*eps){error+=Math.abs(d)/15;leaves++;return A+B+d/15;}if(!depth)throw Error('quadrature convergence');return rec(l,m,fl,f1,fm,A,eps/2,depth-1)+rec(m,r,fm,f2,fr,B,eps/2,depth-1);}
let value=0;for(let i=0;i<8;i++){const l=a+(b-a)*i/8,r=a+(b-a)*(i+1)/8,m=(l+r)/2,fl=F(l),fm=F(m),fr=F(r);value+=rec(l,r,fl,fm,fr,(r-l)*(fl+4*fm+fr)/6,tol/8,24);}return{value,errorEstimate:error,evaluations,leaves};}
function integral(delta,T,tol=2e-10){if(delta<0||T<0||!Number.isFinite(delta+T))throw Error('integral domain');if(T===0)return{value:delta?Math.asinh(1/delta):null,errorEstimate:0,evaluations:0,leaves:0,originSingularity:delta===0};
const s=2*T,L=Math.asinh(1/s);return quad(u=>{const x=s*Math.sinh(u),E=Math.hypot(x,delta);return(E?Math.tanh(E/s)/E:1/s)*s*Math.cosh(u);},0,L,tol);}
const tcCache=new Map();
function scales(lambda){if(!(lambda>0)||!Number.isFinite(lambda))throw Error('coupling');if(tcCache.has(lambda))return{...tcCache.get(lambda)};
const delta0=1/Math.sinh(1/lambda);let low=delta0/4,high=1;for(let i=0;i<48;i++){const m=(low+high)/2;if(integral(0,m).value>1/lambda)low=m;else high=m;}
const tc=(low+high)/2,q=integral(0,tc),out={lambda,delta0,tc,ratio:2*delta0/tc,tcLow:low,tcHigh:high,tcResidual:lambda*q.value-1,tcQuadrature:q};tcCache.set(lambda,out);return{...out};}
function gap(lambda,ratio){const s=scales(lambda),T=ratio*s.tc;if(ratio<0||!Number.isFinite(ratio))throw Error('temperature');if(ratio===0)return{ratio,T,delta:s.delta0,relative:1,status:'zero-temperature',low:s.delta0,high:s.delta0,residual:0,quadrature:integral(s.delta0,0),normalStationary:true,normalCurvature:null};
const normal=integral(0,T),curvature=2*(1/lambda-normal.value);if(ratio>=1)return{ratio,T,delta:0,relative:0,status:ratio===1?'critical':'normal',low:0,high:0,residual:lambda*normal.value-1,quadrature:normal,normalStationary:true,normalCurvature:curvature};
let low=0,high=s.delta0;for(let i=0;i<43;i++){const m=(low+high)/2;if(integral(m,T).value>1/lambda)low=m;else high=m;}
const delta=(low+high)/2,q=integral(delta,T);return{ratio,T,delta,relative:delta/s.delta0,status:'paired',low,high,residual:lambda*q.value-1,quadrature:q,normalStationary:true,normalCurvature:curvature};}
// Omega difference / (N0 Delta0^2), finite pairing shell |xi|<=E_D; N0 per spin.
function potential(lambda,T,relative){const d0=scales(lambda).delta0,d=relative*d0;if(relative<0||T<0)throw Error('potential domain');if(d===0)return{relative,value:0,derivative:0,thermal:0,errorEstimate:0};
const zero=relative**2*(1/lambda-1/(Math.hypot(1,d)+1)-Math.asinh(1/d));let thermal=0,error=0;if(T){const L=Math.asinh(1/(2*T)),q=quad(u=>{const x=2*T*Math.sinh(u),E=Math.hypot(x,d);return-4*T*(Math.log1p(Math.exp(-E/T))-Math.log1p(Math.exp(-x/T)))*2*T*Math.cosh(u)/(d0*d0);},0,L);thermal=q.value;error=q.errorEstimate;}
const I=integral(d,T);return{relative,value:zero+thermal,derivative:2*relative*(1/lambda-I.value),thermal,errorEstimate:error};}
function coherence(xi,delta,T){const E=Math.hypot(xi,delta),thermal=E?(T?Math.tanh(E/(2*T)):1):0,u2=E?(1+xi/E)/2:null,v2=E?(1-xi/E)/2:null,anomalous=E?delta/(2*E)*thermal:0,occupation=E?(1-xi/E*thermal)/2:.5;
return{xi,delta,E,u2,v2,thermal,anomalous,occupation,degenerate:E===0,bdg:[[xi,-delta],[-delta,-xi]],projectorPositive:E?[[(1+xi/E)/2,-delta/(2*E)],[-delta/(2*E),(1-xi/E)/2]]:null};}
// Positive-energy branch followed by particle-hole symmetry. Null explicitly represents ideal edge divergence.
function dos(energy,delta,gamma){if(!Number.isFinite(energy+delta+gamma)||delta<0||gamma<0)throw Error('DOS domain');const e=Math.abs(energy);if(delta===0)return{value:1,singular:false};if(gamma===0){if(e<delta)return{value:0,singular:false};if(e===delta)return{value:null,singular:true};return{value:e/Math.sqrt((e-delta)*(e+delta)),singular:false};}
const a=e*e-gamma*gamma-delta*delta,b=2*e*gamma,r=Math.hypot(a,b),v=Math.sqrt(Math.max(0,(r-a)/2)),u=v?e*gamma/v:Math.sqrt(Math.max(0,(r+a)/2));return{value:(e*u+gamma*v)/r,singular:false};}
function kernel(x,T){const a=Math.exp(-Math.abs(x)/T);return a/(T*(1+a)**2);}
// Ideal spectral DOS convolved with -f'. Gamma is intentionally not applied here.
// E=sqrt(xi^2+Delta^2) removes the square-root edge exactly.
function conductance(voltage,delta,T){if(!Number.isFinite(voltage+delta+T)||delta<0||T<0)throw Error('conductance domain');if(!T){const d=dos(voltage,delta,0);return{...d,errorEstimate:0,tailBound:0,upper:null,evaluations:0};}if(!delta)return{value:1,singular:false,errorEstimate:0,tailBound:0,upper:null,evaluations:0};
const v=Math.abs(voltage),upper=v+40*T+Math.max(delta,1),peak=Math.sqrt(Math.max(0,v*v-delta*delta)),cuts=[0,upper];for(const m of [-20,-8,-2,0,2,8,20]){const x=peak+m*T;if(x>0&&x<upper)cuts.push(x);}cuts.sort((a,b)=>a-b);let value=0,error=0,evaluations=0;
for(let i=1;i<cuts.length;i++)if(cuts[i]>cuts[i-1]){const q=quad(x=>{const E=Math.hypot(x,delta);return kernel(E-v,T)+kernel(E+v,T);},cuts[i-1],cuts[i],1e-10/cuts.length);value+=q.value;error+=q.errorEstimate;evaluations+=q.evaluations;}
return{value,singular:false,errorEstimate:error,tailBound:2*Math.exp(-(upper-v)/T),upper,evaluations};}
function squid(flux,phase,asymmetry){const p=Math.PI*flux,a=asymmetry,phase1=phase+p,phase2=phase-p,I1=(1+a)*Math.sin(phase1),I2=(1-a)*Math.sin(phase2),A=2*Math.cos(p),B=2*a*Math.sin(p),critical=Math.hypot(A,B);return{flux,phase,asymmetry,phase1,phase2,I1,I2,current:I1+I2,A,B,critical,maximizingPhase:critical?Math.atan2(A,B):null};}
const core={DEFAULT,LIMITS,config,quad,integral,scales,gap,potential,coherence,dos,kernel,conductance,squid};


const PRESETS=[
['default','低温到临界的起点',{}],['zero','零温理想谱',{temperaturePercent:0,gammaPercent:0,xiPercent:0}],['weak','弱耦合指数尺度',{couplingPercent:15,temperaturePercent:1,gammaPercent:1}],['critical','临界点：零曲率',{temperaturePercent:100,xiPercent:0}],['normal','临界点以上',{temperaturePercent:130,xiPercent:-200}],['near','Tc 下方的正根',{temperaturePercent:99}],['cutoff','加倍能量截断',{cutoffPercent:200}],['finite','有限截断的形式扫描',{couplingPercent:80,cutoffPercent:50}],['broad','Dynes 与热卷积不同',{gammaPercent:30,temperaturePercent:10}],['half','对称结的半磁通相消',{fluxPercent:50}],['asymmetric','不对称结留下谷底',{fluxPercent:50,asymmetryPercent:50}],['single','单结极限与相位',{asymmetryPercent:100,fluxPercent:-200,phaseDegrees:270}]
].map(([id,label,parameters])=>({id,label,parameters:core.config(parameters)}));
const cache=new Map();
function thermalModel(lambda,ratio){const key=lambda+':'+ratio;if(cache.has(key))return JSON.parse(JSON.stringify(cache.get(key)));const scale=core.scales(lambda),selected=core.gap(lambda,ratio),gapCurve=Array.from({length:66},(_,i)=>core.gap(lambda,i/50)),potential=Array.from({length:101},(_,i)=>core.potential(lambda,selected.T,i/50)),equilibrium=core.potential(lambda,selected.T,selected.relative),out={scale,selected,gapCurve,potential,equilibrium};if(cache.size>100)cache.clear();cache.set(key,out);return JSON.parse(JSON.stringify(out));}
function compute(input={}){const c=core.config(input),lambda=c.couplingPercent/100,D=c.cutoffPercent/100,m=thermalModel(lambda,c.temperaturePercent/100),d=m.selected.relative,T=m.selected.T/m.scale.delta0,gamma=c.gammaPercent/100;
const coherence=Array.from({length:121},(_,i)=>core.coherence(-3+i/20,d,T)),selectedCoherence=core.coherence(c.xiPercent/100,d,T);
const energies=[...new Set(Array.from({length:161},(_,i)=>-4+i/20).concat([-d,d,0]))].sort((a,b)=>a-b);
const density=energies.map(energy=>({energy,ideal:core.dos(energy,d,0),dynes:core.dos(energy,d,gamma)}));
const voltages=[...new Set(Array.from({length:81},(_,i)=>-4+i/10).concat([-d,d,0]))].sort((a,b)=>a-b);
const tunneling=voltages.map(voltage=>({voltage,...core.conductance(voltage,d,T)}));
const phase=c.phaseDegrees*Math.PI/180,flux=c.fluxPercent/100,asymmetry=c.asymmetryPercent/100;
const interference=Array.from({length:161},(_,i)=>core.squid(-2+i/40,phase,asymmetry)),phaseScan=Array.from({length:145},(_,i)=>core.squid(flux,i*Math.PI/72,asymmetry)),selectedSquid=core.squid(flux,phase,asymmetry);
return{schemaVersion:1,parameters:c,units:{energy:'E0',cutoff:D,delta0:D*m.scale.delta0,kBTc:D*m.scale.tc,delta:D*m.selected.delta,kBT:D*m.selected.T,densityOfStates:'per spin per volume N0',spectralEnergy:'Delta0',phase:'gauge-invariant mean junction phase'},...m,coherence,selectedCoherence,density,tunneling,interference,phaseScan,selectedSquid,
boundaries:{finiteShellThermodynamics:true,spectralModel:'wide-band constant-gap approximation, separate from finite shell thermodynamics',spectralWindowWithinShell:4*m.scale.delta0<1,thermalConvolutionIncludesGamma:false,inductance:0,squidCurrentUnit:'mean single-junction critical current I0',squidIsIndependentPhaseModel:true,quadratureErrorIsEstimate:true,materialPrediction:false}};}
const QUESTIONS=[
['把能隙方程除以 Δ 后，还保留了所有平衡候选态吗？',['没有；Δ=0 始终是原自由能的驻点，稳定性另判','保留了；没有正根就没有正常态'],0,'除法会丢掉零解。低于Tc时正常态不稳定，正根降低巨正则势；Tc以上正常态成为最小值。'],
['只看到隧穿谱的峰变钝，能唯一测出准粒子寿命吗？',['能，峰宽总是等于同一种寿命倒数','不能；热卷积、环境和谱展宽需要分别建模'],1,'本页把Dynes谱和理想谱的热卷积分开显示。相似形状不等于唯一的微观来源。'],
['对称、可忽略自感的双结SQUID，在半个磁通量子处怎样？',['两结的临界电流直接相加为2I0','相位约束使两条电流相消，临界电流为0'],1,'要先相加带相位的电流，再对共同相位取最大值。不对称结一般保留非零谷底。'],
['本页把耦合λ调大后，2Δ0/(kBTc)偏离3.53，说明什么？',['有限截断模型偏离弱耦合极限；不能据此预测强耦合材料','所有超导材料都必须出现相同偏离'],0,'3.53是特定模型的弱耦合极限。频率依赖相互作用、多能带、各向异性和涨落并未包含。']
];
function feedback(i,j){if(!Number.isInteger(i)||i<0||i>=4||![0,1].includes(j))throw Error('choice');const correct=j===QUESTIONS[i][2];return{correct,text:(correct?'正确。':'需要修正。')+QUESTIONS[i][3]};}
const FIELD_LABELS={couplingPercent:'λ ×100',cutoffPercent:'ED/E0 ×100',temperaturePercent:'T/Tc ×100',gammaPercent:'Γ/Δ0 ×100（仅Dynes）',xiPercent:'当前ξ/Δ0 ×100',phaseDegrees:'共同相位（度）',fluxPercent:'Φ/Φ0 ×100',asymmetryPercent:'双结不对称度a ×100',energy:'能量单位',cutoff:'能量截断ED/E0',delta0:'Δ0/E0',kBTc:'kBTc/E0',delta:'当前能隙Δ（单位见表注）',kBT:'kBT/E0',densityOfStates:'正常态DOS约定',spectralEnergy:'谱图的能量单位',phase:'相位约定',ratio:'T/Tc',relative:'Δ/Δ0',status:'所选振幅的状态',normalStationary:'正常态仍是候选驻点',normalCurvature:'正常态曲率/N0（T=0不填）',xi:'ξ/Δ0',E:'E/Δ0',u2:'正能谱权重u²',v2:'负能谱权重v²',thermal:'tanh(E/2kBT)',anomalous:'实规范下的配对平均',occupation:'单自旋电子占据',degenerate:'是否处于简并原点',bdg:'实规范BdG矩阵',projectorPositive:'正能量谱投影',finiteShellThermodynamics:'热力学使用有限配对壳层',spectralModel:'谱采用另一项低能近似',spectralWindowWithinShell:'所绘谱窗是否位于壳层内',thermalConvolutionIncludesGamma:'热卷积是否加入Γ',inductance:'双结环路自感',squidCurrentUnit:'双结电流单位',squidIsIndependentPhaseModel:'双结是否是独立相位模型',quadratureErrorIsEstimate:'求积误差是否只是估计',materialPrediction:'是否直接预测材料','zero-temperature':'零温稳定态',paired:'稳定配对态',critical:'临界正常态',normal:'稳定正常态','per spin per volume N0':'每自旋、每体积的N0','gauge-invariant mean junction phase':'两结规范不变相位的均值','wide-band constant-gap approximation, separate from finite shell thermodynamics':'宽带常数能隙近似；与有限壳层热力学区分','mean single-junction critical current I0':'两结临界电流均值I0'};
function fmt(x){if(x===null||x===undefined)return'不适用／未定义（见列注）';if(Array.isArray(x))return'['+x.map(fmt).join(', ')+']';if(typeof x==='boolean')return x?'是':'否';if(typeof x==='object')return JSON.stringify(x);if(typeof x==='number')return Number.isInteger(x)?String(x):Math.abs(x)<1e-4||Math.abs(x)>=1e5?x.toExponential(5):Number(x.toPrecision(7)).toString();return FIELD_LABELS[x]??String(x);}
const COLORS=['#c55b32','#3875ba','#368661','#9860a8','#856722','#646e7c'];
function frame(key,title,xLabel,yLabel,series,domain,range){const pts=series.flatMap(s=>s.points.filter(Boolean)),ys=pts.map(p=>p[1]);let ymin=range?.[0]??Math.min(...ys),ymax=range?.[1]??Math.max(...ys);if(ymin===ymax)ymax=ymin+1;if(!range){const pad=.08*(ymax-ymin);ymin-=pad;ymax+=pad;}return{key,title,xLabel,yLabel,xMin:domain[0],xMax:domain[1],yMin:ymin,yMax:ymax,series};}
function plots(s){const d=s.selected.relative,point=(x,r)=>r.singular?null:[x,Math.min(6,r.value)];return[
frame('gap','配对振幅：先找正根，再判断稳定性','T/Tc','Δ(T)/Δ0',[
{name:'稳定振幅',color:COLORS[1],points:s.gapCurve.map(r=>[r.ratio,r.relative])},
{name:'正常态候选 Δ=0',color:COLORS[2],points:[[0,0],[1.3,0]]},
{name:'当前温度',color:COLORS[0],markersOnly:true,points:[[s.selected.ratio,d]]}
],[0,1.3],[0,1]),
frame('potential','固定温度：正常态与配对态的势密度','试探振幅 Δ/Δ0','F/(N0 Δ0²)',[
{name:'有限配对壳层的势密度',color:COLORS[1],points:s.potential.map(r=>[r.relative,r.value])},
{name:'稳定点',color:COLORS[0],markersOnly:true,points:[[d,s.equilibrium.value]]},
{name:'正常态候选',color:COLORS[2],markersOnly:true,hollow:true,points:[[0,0]]}
],[0,2]),
frame('coherence','谱权重与实际电子占据不相同','ξ/Δ0','权重、占据与配对平均',[
{name:'u²：正能量电子权重',color:COLORS[1],points:s.coherence.map(r=>r.u2===null?null:[r.xi,r.u2])},
{name:'v²：负能量电子权重',color:COLORS[0],points:s.coherence.map(r=>r.v2===null?null:[r.xi,r.v2])},
{name:'有限温度电子占据 nξ',color:COLORS[2],points:s.coherence.map(r=>[r.xi,r.occupation])},
{name:'实规范下的配对平均',color:COLORS[3],points:s.coherence.map(r=>[r.xi,r.anomalous])}
],[-3,3],[0,1]),
frame('dos','低能宽带近似：理想谱与Dynes谱','E/Δ0；纵轴图窗上限为6','每自旋 Ns(E)/N0',[
{name:'理想谱：边缘断开表示发散',color:COLORS[1],points:s.density.map(r=>point(r.energy,r.ideal))},
{name:'Dynes谱：独立的Γ参数',color:COLORS[0],points:s.density.map(r=>point(r.energy,r.dynes))},
{name:'理想奇点/超图窗：空心点',color:COLORS[2],markersOnly:true,hollow:true,points:s.density.filter(r=>r.ideal.singular||r.ideal.value>6).map(r=>[r.energy,6])}
],[-4,4],[0,6]),
frame('tunneling','测量再经过热卷积：这里未加入Γ','eV/Δ0；纵轴图窗上限为6','G(V)/GN（理想谱的热卷积）',[
{name:'当前温度的微分电导',color:COLORS[1],points:s.tunneling.map(r=>point(r.voltage,r))},
{name:'正常金属参照：1',color:COLORS[0],points:[[-4,1],[4,1]]},
{name:'奇点/超图窗：空心点',color:COLORS[2],markersOnly:true,hollow:true,points:s.tunneling.filter(r=>r.singular||r.value>6).map(r=>[r.voltage,6])}
],[-4,4],[0,6]),
frame('interference','独立相位模型：先干涉，再取临界电流','穿环磁通 Φ/Φ0（忽略自感）','I/I0；I0 为两结临界电流均值',[
{name:'临界电流 +Ic/I0',color:COLORS[1],points:s.interference.map(r=>[r.flux,r.critical])},
{name:'反向边界 −Ic/I0',color:COLORS[0],points:s.interference.map(r=>[r.flux,-r.critical])},
{name:'所选共同相位的电流',color:COLORS[2],points:s.interference.map(r=>[r.flux,r.current])},
{name:'当前磁通与共同相位',color:COLORS[3],markersOnly:true,points:[[s.selectedSquid.flux,s.selectedSquid.current]]}
],[-2,2],[-2,2])
];}
function tables(s){return[
{key:'parameters',title:'输入参数（百分数滑块须除以100）',headers:['输入','值'],rows:Object.entries(s.parameters)},
{key:'scales',title:'能量尺度：ED是能量，不是角频率',headers:['量','值'],rows:[...Object.entries(s.units),['2Δ0/kBTc',s.scale.ratio],['Tc/ED二分下界',s.scale.tcLow],['Tc/ED二分上界',s.scale.tcHigh],['Tc处 λI−1',s.scale.tcResidual]]},
{key:'selected',title:'当前温度：驻点、稳定性与谱近似范围',headers:['量','值'],rows:[...['ratio','delta','relative','status','normalStationary','normalCurvature'].map(k=>[k,s.selected[k]]),['稳定点势差/(N0Δ0²)',s.equilibrium.value],['所显示|E|≤4Δ0是否位于ED内',s.boundaries.spectralWindowWithinShell],['无量纲零温理想凝聚能',-1/(Math.hypot(1,s.scale.delta0)+1)]]},
{key:'temperature',title:'66个温度点：根区间与独立稳定性判据',headers:['T/Tc','kBT/ED','Δ/ED','Δ/Δ0','状态','根下界','根上界','λI−1','正常态曲率/N0','积分','积分误差估计'],rows:s.gapCurve.map(r=>[r.ratio,r.T,r.delta,r.relative,r.status,r.low,r.high,r.residual,r.normalCurvature,r.quadrature.value,r.quadrature.errorEstimate])},
{key:'potential',title:'101个试探振幅：保留Δ=0的自由能比较',headers:['Δ/Δ0','势差/(N0Δ0²)','对Δ/Δ0求导','热贡献','积分误差估计'],rows:s.potential.map(r=>[r.relative,r.value,r.derivative,r.thermal,r.errorEstimate])},
{key:'coherence',title:'121个动量能量点：权重、占据与配对平均',headers:['ξ/Δ0','E/Δ0','u²','v²','tanh(E/2kBT)','电子占据','配对平均','是否简并'],rows:s.coherence.map(r=>[r.xi,r.E,r.u2,r.v2,r.thermal,r.occupation,r.anomalous,r.degenerate])},
{key:'bdg',title:'当前ξ：BdG矩阵与正能量投影；简并原点不指定投影',headers:['量','值'],rows:Object.entries(s.selectedCoherence)},
{key:'density',title:'完整谱值：null对应显式奇点，不当作0',headers:['E/Δ0','理想DOS','理想发散','Dynes DOS','Dynes发散','理想超过图窗','Dynes超过图窗'],rows:s.density.map(r=>[r.energy,r.ideal.singular?'∞（理想边缘）':r.ideal.value,r.ideal.singular,r.dynes.singular?'∞（Γ=0边缘）':r.dynes.value,r.dynes.singular,r.ideal.singular||r.ideal.value>6,r.dynes.singular||r.dynes.value>6])},
{key:'tunneling',title:'热卷积：换元移去奇点；误差估计与尾界分开',headers:['eV/Δ0','G/GN','是否发散','积分误差估计','遗漏尾部上界','ξ积分上限/Δ0','求值次数'],rows:s.tunneling.map(r=>[r.voltage,r.singular?'∞（T=0边缘）':r.value,r.singular,r.errorEstimate,r.tailBound,r.upper,r.evaluations])},
{key:'flux',title:'161个磁通点：完整两结电流与最大值',headers:['Φ/Φ0','共同相位/rad','结1相位','结2相位','I1/I0','I2/I0','I/I0','Ic/I0','达到正Ic的共同相位'],rows:s.interference.map(r=>[r.flux,r.phase,r.phase1,r.phase2,r.I1,r.I2,r.current,r.critical,r.maximizingPhase])},
{key:'phase',title:'当前磁通的145个共同相位：不能先分别取最大',headers:['共同相位/rad','I1/I0','I2/I0','I/I0','Ic/I0'],rows:s.phaseScan.map(r=>[r.phase,r.I1,r.I2,r.current,r.critical])},
{key:'boundaries',title:'各子模型的边界与适用范围',headers:['范围','说明'],rows:Object.entries(s.boundaries)}
];}
const axisFmt=v=>v===0?'0':Math.abs(v)<.001||Math.abs(v)>=10000?v.toExponential(2):Number(v.toFixed(3)).toString();
function svg(p){const left=100,right=855,top=95,bottom=385,X=v=>left+(v-p.xMin)/(p.xMax-p.xMin)*(right-left),Y=v=>bottom-(v-p.yMin)/(p.yMax-p.yMin)*(bottom-top),esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));let out='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 580" role="img" aria-label="'+esc(p.title)+'"><title>'+esc(p.title)+'</title><style>text{font:15px system-ui;fill:currentColor}</style><text x="30" y="30" font-weight="700">'+esc(p.title)+'</text><text x="25" y="70">'+esc(p.yLabel)+'</text>';
const discrete=false;const xticks=discrete?[...new Set(Array.from({length:5},(_,i)=>Math.round(p.xMin+(p.xMax-p.xMin)*i/4)))]:Array.from({length:5},(_,i)=>p.xMin+(p.xMax-p.xMin)*i/4);for(let i=0;i<=4;i++){const x=p.xMin+(p.xMax-p.xMin)*i/4,y=p.yMin+(p.yMax-p.yMin)*i/4;out+='<line x1="100" x2="855" y1="'+Y(y)+'" y2="'+Y(y)+'" stroke="currentColor" opacity=".18"/><text x="85" y="'+(Y(y)+5)+'" text-anchor="end">'+axisFmt(y)+'</text>';}for(const x of xticks){out+='<text x="'+X(x)+'" y="410" text-anchor="middle">'+axisFmt(x)+'</text>';}
out+='<text x="477" y="442" text-anchor="middle">'+esc(p.xLabel)+'</text>';
p.series.forEach((s,i)=>{let pen=false;const path=s.points.map(q=>{if(!q){pen=false;return '';}const d=(pen&&!s.markersOnly?'L':'M')+X(q[0]).toFixed(6)+','+Y(q[1]).toFixed(6);pen=true;return d;}).join(' ');out+='<path data-series="'+i+'" d="'+path+'" stroke="'+s.color+'" stroke-width="2.8" fill="none"/>';const marks=s.markersOnly?s.points.filter(Boolean):s.boundaryMarkers?[...new Set([s.points.find(Boolean),s.points.filter(Boolean).at(-1)])].filter(Boolean):s.points.filter(Boolean).length===1?s.points.filter(Boolean):[];marks.forEach(q=>out+='<circle cx="'+X(q[0])+'" cy="'+Y(q[1])+'" r="'+(s.markerRadius??5)+'" stroke="'+s.color+'" fill="'+(s.hollow?'none':s.open?'var(--bg,#fff)':s.color)+'" stroke-width="'+(s.markerStrokeWidth??2.5)+'"/>');out+='<line x1="'+(40+430*(i%2))+'" x2="'+(60+430*(i%2))+'" y1="'+(473+32*Math.floor(i/2))+'" y2="'+(473+32*Math.floor(i/2))+'" stroke="'+s.color+'" stroke-width="3"/><text x="'+(68+430*(i%2))+'" y="'+(478+32*Math.floor(i/2))+'">'+esc(s.name)+'</text>';});if(!p.series.some(s=>s.points.some(Boolean)))out+='<text x="450" y="245" text-anchor="middle">当前模型在此参数下无适用数据</text>';return out+'</svg>';}

var mounted=new WeakMap();
function mount(root){const doc=root.ownerDocument,previous=mounted.get(root);if(previous)previous();root.replaceChildren();root.classList.add('bcs192');let c=config(PRESETS[0].parameters),choices={},revealed=false,url=null,current=null,view=0,valid=true;
 const el=(tag,attrs={},text)=>{const e=doc.createElement(tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);if(text!==undefined)e.textContent=text;return e;};
 if(!doc.querySelector('[data-bcs192-style]')){const style=el('style',{'data-bcs192-style':''});style.textContent='.bcs192{margin-inline:0!important;width:100%;min-width:0;color:var(--fg,#222);line-height:1.65}.bcs192 *{box-sizing:border-box}.bcs192 button,.bcs192 select{font:inherit;min-height:44px;padding:8px;border:1px solid var(--border,#aaa);border-radius:5px;background:var(--block-bg,#eee);color:inherit;max-width:100%;white-space:normal}.bcs192 button[aria-pressed="true"]{outline:2px solid var(--accent,#a33)}.bcs192 button:focus-visible,.bcs192 select:focus-visible,.bcs192 [tabindex]:focus-visible{outline:3px solid #2474bc}.bcs192 .bc-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.bcs192 label{display:grid;gap:4px;min-width:0}.bcs192 input{width:100%;min-height:44px;font:inherit;color:inherit;background:var(--bg,#fff)}.bcs192 .bc-row{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.bcs192 .bc-pred>strong{display:block;margin-bottom:6px}.bcs192 .bc-pred{padding:10px 0;border-top:1px solid var(--border,#aaa)}.bcs192 .bc-feedback{margin:7px 0}.bcs192 .bc-scroll{max-width:100%;overflow:auto}.bcs192 svg{display:block;min-width:680px;width:100%;height:auto}.bcs192 table{display:table;overflow:visible;max-width:none;border-collapse:collapse;width:max-content;min-width:100%;font-variant-numeric:tabular-nums}.bcs192 td,.bcs192 th{white-space:nowrap;text-align:right;padding:7px;border:1px solid var(--border,#bbb)}.bcs192 [hidden]{display:none!important}.bcs192 details{margin:12px 0}.bcs192 summary{min-height:44px;cursor:pointer}.bcs192 .bc-status{border-left:3px solid var(--accent,#a33);padding:8px 12px}.bcs192 .bc-correct{color:var(--cl-green,#277540)}.bcs192 .bc-wrong{color:var(--cl-red,#a33)}@media(max-width:600px){.bcs192 .bc-grid{grid-template-columns:1fr}}';doc.head.append(style);}
 root.append(el('h3',{},'从配对振幅到能谱，再到可测量的电流'),el('p',{},'先比较有限配对壳层的势密度，再区分谱函数与热卷积。最后用独立的双结相位模型检查干涉。三个子模型的参数和近似分别标明。'));
 const presets=el('div',{class:'bc-row','aria-label':'教学预设'});for(const p of PRESETS){const b=el('button',{type:'button','data-preset':p.id},p.label);b.onclick=()=>{c=config(p.parameters);valid=true;sync();reset();};presets.append(b);}root.append(presets);
 const fields={},outs={},grid=el('div',{class:'bc-grid'});




 for(const[key,title]of [['couplingPercent','配对耦合 λ ×100'],['cutoffPercent','能量截断 ED/E0 ×100'],['temperaturePercent','约化温度 T/Tc ×100'],['gammaPercent','仅Dynes谱：Γ/Δ0 ×100'],['xiPercent','当前BdG态：ξ/Δ0 ×100'],['phaseDegrees','独立双结模型：共同规范不变相位（度）'],['fluxPercent','独立双结模型：磁通 Φ/Φ0 ×100'],['asymmetryPercent','独立双结模型：不对称度 a ×100']]){const[min,max]=LIMITS[key],label=el('label',{},title),out=el('output'),input=el('input',{type:'range',min,max,step:1,'data-field':key,'aria-label':title});label.append(out,input);grid.append(label);fields[key]=input;outs[key]=out;input.oninput=input.onchange=change;}root.append(grid);
 function change(){try{c=config(Object.fromEntries(Object.entries(fields).map(([k,e])=>[k,e.value===''?NaN:Number(e.value)])));valid=true;sync();reset();}catch(e){valid=false;reset();status.textContent='请使用所示范围内的整数；百分数输入会在计算时除以100。';}}
 const note=el('p'),prediction=el('section',{'aria-label':'先预测'});root.append(note,prediction);prediction.append(el('h4',{},'先预测：正常态、峰宽、干涉与适用范围'),el('p',{},'四题的条件固定写在题干里；参数用来检查例子，不自动改变问题。'));
 const feedbacks=[],buttons=[];QUESTIONS.forEach((q,i)=>{const row=el('div',{class:'bc-pred'});row.append(el('strong',{},q[0]));buttons[i]=[];q[1].forEach((text,j)=>{const b=el('button',{type:'button','data-prediction':i,'data-choice':String(j===0),'aria-pressed':'false'},text);b.onclick=()=>{choices[i]=j;buttons[i].forEach((x,k)=>x.setAttribute('aria-pressed',String(j===k)));if(revealed)showFeedback();};row.append(b);buttons[i].push(b);});feedbacks[i]=el('p',{class:'bc-feedback','data-feedback':i});row.append(feedbacks[i]);prediction.append(row);});
 const check=el('button',{type:'button','data-check':''},'核对预测并显示完整结果'),status=el('p',{class:'bc-status','aria-live':'polite'});root.append(check,status);
 const stage=el('section',{'data-stage':'',hidden:'','aria-label':'实验结果'}),summary=el('p'),plotButtons=el('div',{class:'bc-row'}),plotWrap=el('div',{class:'bc-scroll',tabindex:0,role:'region','aria-label':'图表，可横向滚动'}),plotNote=el('p',{},'DOS与电导纵轴只显示到6；空心点标出发散或超出图窗，完整值在表中。理想边缘处断线不表示零态密度。BdG简并原点不指定唯一谱权重。双结电流以给定I0归一化，不由本页能隙推算。'),tableHost=el('div'),download=el('a',{'data-download':'',download:'bc-record.json'},'下载当前完整记录（JSON）');stage.append(summary,plotButtons,plotWrap,plotNote,tableHost,download);root.append(stage);
 function sync(){for(const[k,e]of Object.entries(fields))e.value=c[k];}
 function reset(){revealed=false;choices={};stage.hidden=true;delete root.__bcsSnapshot;for(let i=0;i<4;i++){feedbacks[i].textContent='';for(const b of buttons[i])b.setAttribute('aria-pressed','false');}for(const[k,o]of Object.entries(outs))o.textContent=fmt(c[k]);note.textContent='ED是能量截断；N0是每自旋正常态DOS。能隙和自由能使用有限壳层。DOS与热卷积使用另外注明的低能宽带近似；热卷积未加入Γ。双结模型忽略自感，a=1退化为一条有效结。';status.textContent='完成四项预测后显示当前结果。';}
 function showFeedback(){let n=0;for(let i=0;i<4;i++){if(!Number.isInteger(choices[i]))continue;const f=feedback(i,choices[i]);n+=+f.correct;feedbacks[i].textContent=f.text;feedbacks[i].className='bc-feedback '+(f.correct?'bc-correct':'bc-wrong');}status.textContent='预测核对：'+n+'/4 正确。图、表和下载均对应当前参数。';}
 function draw(){const ps=plots(current);plotWrap.innerHTML=svg(ps[view]);Array.from(plotButtons.children).forEach((b,i)=>b.setAttribute('aria-pressed',String(i===view)));}
 function render(){current=compute(c);root.__bcsSnapshot=current;stage.hidden=false;summary.textContent='当前 Δ/Δ0='+fmt(current.selected.relative)+'，2Δ0/(kBTc)='+fmt(current.scale.ratio)+'；稳定点巨正则势密度差/(N0Δ0²)='+fmt(current.equilibrium.value)+'。正常态始终是候选驻点。独立双结模型的 Ic/I0='+fmt(current.selectedSquid.critical)+'。'+(current.boundaries.spectralWindowWithinShell?'所绘谱窗位于配对壳层能量内；宽带近似仍需低能条件。':'当前谱窗延伸到ED以外；谱图只能作宽带模型形式对照，不是此有限壳层的精确材料谱。');plotButtons.replaceChildren();plots(current).forEach((p,i)=>{const b=el('button',{type:'button','data-plot':p.key},p.title);b.onclick=()=>{view=i;draw();};plotButtons.append(b);});draw();tableHost.replaceChildren();for(const t of tables(current)){const d=el('details',{'data-table':t.key});d.append(el('summary',{},t.title));d.addEventListener('toggle',()=>{if(!d.open||d.children.length>1)return;const wrap=el('div',{class:'bc-scroll',tabindex:0,role:'region','aria-label':t.title+'，可横向滚动'}),table=el('table'),thead=el('thead'),tr=el('tr'),tbody=el('tbody');for(const h of t.headers)tr.append(el('th',{scope:'col'},h));thead.append(tr);for(const row of t.rows){const r=el('tr');for(const v of row)r.append(el('td',{},fmt(v)));tbody.append(r);}table.append(thead,tbody);wrap.append(table);d.append(wrap);});tableHost.append(d);}if(url)hostWindow.URL.revokeObjectURL(url);url=hostWindow.URL.createObjectURL(new hostWindow.Blob([JSON.stringify(current)],{type:'application/json'}));download.href=url;showFeedback();}
 check.onclick=()=>{if(!valid){status.textContent='请先修正无效参数。';return;}if(![0,1,2,3].every(i=>Number.isInteger(choices[i]))){status.textContent='请先为四个问题各选一个预测。';return;}revealed=true;render();};sync();reset();mounted.set(root,()=>{if(url)hostWindow.URL.revokeObjectURL(url);});
}

function selfTest(){let checks=0;const ok=x=>{checks++;if(!x)throw Error('BCS invariant '+checks);};for(const p of PRESETS){const s=compute(p.parameters);ok(plots(s).length===6);ok(tables(s).length===12);ok(s.selected.normalStationary);ok(s.equilibrium.value<=2e-9);for(const r of s.gapCurve){ok(r.relative>=0&&r.relative<=1+1e-10);ok(r.low<=r.delta&&r.delta<=r.high);if(r.ratio<=1)ok(Math.abs(r.residual)<1e-8);}for(let i=1;i<s.gapCurve.length;i++)ok(s.gapCurve[i].relative<=s.gapCurve[i-1].relative+1e-9);for(const r of s.coherence){ok(r.occupation>=0&&r.occupation<=1);if(!r.degenerate)ok(Math.abs(r.u2+r.v2-1)<1e-12);}for(const r of s.interference){ok(Math.abs(r.current)<=r.critical+1e-12);ok(Math.abs(r.I1+r.I2-r.current)<1e-12);}for(let i=0;i<4;i++)ok(feedback(i,QUESTIONS[i][2]).correct);}return{status:'PASS',checks};}
const API={...core,PRESETS,QUESTIONS,compute,snapshot:compute,plots,tables,svg,feedback,fmt,mount,selfTest};if(typeof module!=="undefined"&&module.exports)module.exports=API;if(hostWindow&&hostWindow.CourseLearning)hostWindow.CourseLearning.register("bcs-gap",mount);})(typeof window!=="undefined"?window:null);
