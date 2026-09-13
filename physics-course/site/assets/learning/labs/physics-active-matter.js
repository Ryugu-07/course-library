(function(hostWindow){"use strict";
'use strict';
const LIMITS={speedTenths:[0,40],rotTenths:[0,40],turnTenths:[-40,40],thermalHundredths:[1,100],mobilityTenths:[1,40],trapTenths:[1,40],timeTenths:[1,100],frequencyTenths:[0,60],densityHundredths:[0,100],slowdownTenths:[0,60],gradientTenths:[1,40],waveTenths:[0,40]};
const DEFAULT={speedTenths:20,rotTenths:5,turnTenths:0,thermalHundredths:20,mobilityTenths:10,trapTenths:10,timeTenths:60,frequencyTenths:10,densityHundredths:75,slowdownTenths:20,gradientTenths:10,waveTenths:5};
const PRESETS=[
['default','推进与热噪声',{}],['passive','被动平衡',{speedTenths:0}],['straight','不转向的边界',{rotTenths:0,turnTenths:0}],['circle','不扩散转向的圆周',{rotTenths:0,turnTenths:10}],['chiral','带旋转的方向记忆',{turnTenths:10}],['opposite','反向手性',{turnTenths:-10}],['fast','方向很快遗忘',{rotTenths:40}],['trap','强约束的温度读数',{trapTenths:40}],['short','热噪声主导的短时',{timeTenths:1}],['spinodal','集体长波不稳定',{speedTenths:40}],['dilute','低密度集体对照',{densityHundredths:10}],['no-slowdown','速度不随密度下降',{slowdownTenths:0}]
].map(([id,name,parameters])=>({id,name,parameters}));
function config(p={}){if(!p||typeof p!=='object'||Array.isArray(p)||Object.getPrototypeOf(p)!==Object.prototype)throw Error('Expected plain input object');for(const k of Object.keys(p))if(!Object.hasOwn(LIMITS,k))throw Error('Unknown '+k);const c={...DEFAULT,...p};for(const[k,[a,b]]of Object.entries(LIMITS))if(!Number.isInteger(c[k])||c[k]<a||c[k]>b)throw Error('Invalid '+k);return c;}
function model(c){return {speed:c.speedTenths/10,rot:c.rotTenths/10,turn:c.turnTenths/10,thermal:c.thermalHundredths/100,mobility:c.mobilityTenths/10,stiffness:c.trapTenths/10,time:c.timeTenths/10,frequency:c.frequencyTenths/10,density:c.densityHundredths/100,slowdown:c.slowdownTenths/10,gradient:c.gradientTenths/10,wave:c.waveTenths/10};}
const mul=(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]];
const div=(a,b)=>{const d=b[0]*b[0]+b[1]*b[1];return [(a[0]*b[0]+a[1]*b[1])/d,(a[1]*b[0]-a[0]*b[1])/d];};
function memoryIntegral(M,t){
 const z=[M.rot,-M.turn],u=[-z[0]*t,-z[1]*t];
 if(Math.hypot(...u)<.15){let term=[1,0],first=[1,0],second=[.5,0];for(let n=1;n<=18;n++){term=mul(term,u).map(x=>x/(n+1));first=first.map((x,j)=>x+term[j]);second=second.map((x,j)=>x+term[j]/(n+2));}return {first:first.map(x=>x*t),second:second.map(x=>x*t*t)};}
 const e=Math.exp(-M.rot*t),angle=M.turn*t,one=[-Math.expm1(-M.rot*t)+2*e*Math.sin(angle/2)**2,-e*Math.sin(angle)],first=div(one,z);
 return {first,second:div([t-first[0],-first[1]],z)};
}
function diffusion(M){if(M.speed===0)return {active:0,effective:M.thermal,status:'passive-diffusion'};if(M.rot===0&&M.turn===0)return {active:null,effective:null,status:'ballistic-no-finite-diffusion'};const active=M.speed**2*M.rot/(2*(M.rot**2+M.turn**2));return {active,effective:M.thermal+active,status:M.rot===0?'bounded-circular-active-displacement':'mixing-orientation-diffusion'};}
function timed(M,t){
 const q=memoryIntegral(M,t),thermal=4*M.thermal*t;
 let active=2*M.speed**2*q.second[0];
 if(M.rot===0)active=M.turn===0?M.speed**2*t*t:4*M.speed**2*Math.sin(M.turn*t/2)**2/M.turn**2;
 const msd=thermal+active,derivative=4*M.thermal+2*M.speed**2*q.first[0],d=diffusion(M);
 return {t,thermal,active,msd,ballistic:M.speed**2*t*t,shortApprox:thermal+M.speed**2*t*t,longSlope:d.effective===null?null:4*d.effective*t,longAsymptote:M.rot>0?4*d.effective*t-2*M.speed**2*(M.rot**2-M.turn**2)/(M.rot**2+M.turn**2)**2:M.speed===0?thermal:null,derivative,localExponent:t===0?1:t*derivative/msd,orientationCos:Math.exp(-M.rot*t)*Math.cos(M.turn*t),orientationSin:Math.exp(-M.rot*t)*Math.sin(M.turn*t),angleMean:M.turn*t,angleVariance:2*M.rot*t,angleMSD:M.turn**2*t*t+2*M.rot*t,conditionalX:M.speed*q.first[0],conditionalY:M.speed*q.first[1],meanConvention:'conditional theta(0)=0; not a sample path',isotropicMeanX:0,isotropicMeanY:0,forceStepResponse:M.mobility*t};
}
function trap(M,k=M.stiffness){const rate=M.mobility*k,a=rate+M.rot,den=a*a+M.turn*M.turn,thermalVariance=M.thermal/rate,activeVariance=M.speed**2*a/(2*rate*den),variance=thermalVariance+activeVariance;
 const atoms=M.rot===0&&M.speed>0?(M.turn===0?[{omega:0,weight:Math.PI*M.speed**2/rate**2}]:[-Math.abs(M.turn),Math.abs(M.turn)].map(omega=>({omega,weight:Math.PI*M.speed**2/(2*(rate**2+M.turn**2))}))):[];
 return {stiffness:k,rate,thermalVariance,activeVariance,variance,equipartitionReading:k*variance,bathTemperature:M.thermal/M.mobility,crossParallel:M.speed*a/den,crossPerpendicular:M.speed*M.turn/den,atoms,atomVariance:atoms.reduce((s,x)=>s+x.weight/(2*Math.PI),0),spectrumType:atoms.length?'thermal-continuum-plus-active-delta-atoms':'continuous',stationarity:M.rot===0?'prescribed-uniform-initial-angle-ensemble; not unique angular mixing':'stationary isotropic ABP ensemble'};
}
function spectrum(M,w,k=M.stiffness){const rate=M.mobility*k,den=rate*rate+w*w,thermal=2*M.thermal/den,active=M.rot===0?0:M.speed**2*M.rot/2*(1/(M.rot**2+(w-M.turn)**2)+1/(M.rot**2+(w+M.turn)**2))/den,real=M.mobility*rate/den,imag=M.mobility*w/den,ratio=(thermal+active)*den/(2*M.mobility),hasAtoms=M.rot===0&&M.speed>0;
 return {omega:w,thermal,activeContinuous:active,totalContinuous:thermal+active,responseReal:real,responseImag:imag,bathFDT:2*M.thermal/den,continuousTemperatureReading:ratio,wholeSpectrumTemperatureReading:hasAtoms?null:ratio,ratioConvention:w===0?'continuous-part omega->0 limit; not division by zero':'omega S_cont/(2 Im chi)',hasActiveAtoms:hasAtoms};
}
function density(M,rho=M.density){const speed=M.speed*Math.exp(-M.slowdown*rho),derivative=-M.slowdown*speed,A=speed+rho*derivative,Dcollective=M.rot===0?null:M.thermal+speed*A/(2*M.rot);
 return {rho,speed,speedDerivative:derivative,polarizationCoupling:A,singleParticleDiffusion:M.rot===0?M.speed===0?M.thermal:null:M.thermal+speed*speed/(2*M.rot),collectiveDiffusion:Dcollective,spinodal:Dcollective===null?null:Dcollective<0,reductionStatus:M.rot===0?'no-fast-angular-relaxation':'long-time-long-wavelength-closure',chirality:0};
}
function growth(M,q,rho=M.density){const d=density(M,rho),a=-M.thermal*q*q-M.gradient*q**4,b=-q*d.speed,c=q*d.polarizationCoupling/2,e=-M.rot-M.thermal*q*q,half=(a+e)/2,discriminant=((a-e)/2)**2+b*c,determinant=a*e-b*c;let plus,minus;
 if(discriminant<0){plus={real:half,imag:Math.sqrt(-discriminant)};minus={real:half,imag:-Math.sqrt(-discriminant)};}
 else{const root=Math.sqrt(discriminant),fast=half-root,slow=fast===0?0:determinant/fast;plus={real:slow,imag:0};minus={real:fast,imag:0};}
 const reduced=d.collectiveDiffusion===null?null:-d.collectiveDiffusion*q*q-M.gradient*q**4;
 return {q,rho,matrix:[[a,b],[c,e]],trace:a+e,determinant,discriminant,plus,minus,maxGrowth:Math.max(plus.real,minus.real),reducedGrowth:reduced,gap:M.rot,gradientCoefficient:M.gradient,model:'nonchiral two-moment closure with phenomenological density q^4 damping'};
}
function compute(p={}){const c=config(p),M=model(c),D=diffusion(M),T=trap(M),den=density(M),chosen=growth(M,M.wave),thermalCrossover=M.speed===0?null:4*M.thermal/M.speed**2,memoryCeiling=Math.max(M.rot,Math.abs(M.turn))===0?null:1/Math.max(M.rot,Math.abs(M.turn));
 return {schema:'active202-v1',parameters:c,model:M,diffusion:D,windows:{thermalCrossover,memoryCeiling,scaleSeparation:thermalCrossover===null||memoryCeiling===null?null:memoryCeiling/thermalCrossover,rotationalTime:M.rot===0?null:1/M.rot,persistenceLength:M.rot===0?null:M.speed/M.rot,warning:'ballistic visibility requires lower time bound as well as upper; no arbitrary pass/fail cutoff'},chosenTime:timed(M,M.time),times:Array.from({length:241},(_,i)=>timed(M,M.time*i/240)),trap:T,chosenSpectrum:spectrum(M,M.frequency),frequencies:Array.from({length:241},(_,i)=>spectrum(M,i/30)),trapScan:Array.from({length:80},(_,i)=>trap(M,(i+1)/20)),density:den,densityScan:Array.from({length:201},(_,i)=>density(M,i/200)),growth:chosen,growthScan:Array.from({length:241},(_,i)=>growth(M,i/60)),longwaveScan:[1e-1,1e-2,1e-3,1e-4,1e-5].map(q=>({...growth(M,q),negativeSlowOverQ2:-growth(M,q).maxGrowth/(q*q)})),readings:{bathTemperature:M.thermal/M.mobility,freeDiffusionTemperature:D.effective===null?null:D.effective/M.mobility,trapTemperature:T.equipartitionReading,spectralTemperature:spectrum(M,M.frequency).wholeSpectrumTemperatureReading},boundaries:{thermalDominatesShortestTime:true,ballisticWindowNeedsSeparation:true,chiralitySignRetainedInCrossCorrelation:true,zeroAngularDiffusionNotClamped:true,circleNotBallisticDiffusion:true,ensembleMeanNotSamplePath:true,ABPNotGaussianProcess:true,secondMomentsNotFullDistribution:true,deltaAtomsNotDensityHeights:true,forceDoesNotTorqueOrientation:true,linearTrapResponseNotThermalization:true,nonchiralCollectiveModelSeparate:true,angularHierarchyTruncated:true,gradientTermPhenomenological:true,spinodalNotCoexistence:true,fuelDissipationNotInferred:true}};
}
function coreSelfTest(){let checks=0;const ok=v=>{if(!v)throw Error('Active202 check '+checks);checks++;};for(const p of PRESETS){const s=compute(p.parameters);ok(s.times[0].msd===0);ok(s.times.every(x=>Number.isFinite(x.msd)&&x.msd>=0));ok(s.trap.variance>0);ok(s.growthScan[0].plus.real===0);ok(s.growthScan[0].minus.real===-s.model.rot);for(const q of s.growthScan){ok(Math.abs(q.plus.real+q.minus.real-q.trace)<1e-9);ok(Math.abs(q.plus.imag+q.minus.imag)<1e-12);}ok(s.trap.atoms.every(a=>a.weight>0));}
 const passive=compute({speedTenths:0}),circle=compute({rotTenths:0,turnTenths:10}),straight=compute({rotTenths:0});ok(passive.readings.freeDiffusionTemperature===passive.readings.bathTemperature);ok(straight.diffusion.effective===null);ok(circle.diffusion.active===0);ok(circle.trap.atoms.length===2);ok(compute({speedTenths:40}).density.spinodal);return {status:'PASS',checks};}
const QUESTIONS=[
['当平移热扩散Dt>0时，把观察时间不断缩短，一定更容易看清主动t²项吗？',['不是；t→0时热噪声的t项相对更大','是；越短时间越接近直线，所以总MSD越呈t²'],0,'主动项与热项之比约v²t/(4Dt)。弹道窗口必须晚于4Dt/v²，同时早于转向记忆时间。短时展开有t²项，不代表总位移由它主导。'],
['Dr=0而恒定转速Ω≠0时，主动位移会永久按t²增长吗？',['会；没有旋转噪声就不会改变方向','不会；确定性转向形成圆周，主动位移有界'],1,'朝向仍以Ω旋转。主动MSD=4v²sin²(Ωt/2)/Ω²；Dr=0、Ω=0才是持续直线边界。平移热噪声仍可扩散。'],
['由长时扩散得到一个Teff，就足以保证谐阱和所有频率都满足同一温度FDT吗？',['不足以；应独立比较力响应、谐阱方差和频谱','足以；只要总MSD最终呈线性，就恢复了热平衡'],0,'响应由迁移率和约束决定，主动噪声额外带有方向记忆。不同观测给出的比值一般不同；相同的单个二阶数值也不能证明详细平衡。'],
['密度—极化闭合模型出现长波增长，就已经算出真实粒子的两相共存密度了吗？',['已经；增长率正负就是完整相图','没有；这里只检验指定闭合方程的线性稳定性'],1,'线性不稳定不是共存条件。非线性、角度高阶矩、相互作用、边界和涨落仍需另建模型；本页不把速度下降假设当成粒子碰撞仿真。']
];
function feedback(i,j){if(!Number.isInteger(i)||i<0||i>=4||![0,1].includes(j))throw Error('choice');return {correct:j===QUESTIONS[i][2],text:(j===QUESTIONS[i][2]?'正确。':'需要修正。')+QUESTIONS[i][3]};}
const LABELS={speedTenths:'推进速度 v ×10',rotTenths:'旋转扩散 Dr ×10（允许0）',turnTenths:'恒定转速 Ω ×10（仅单粒子模型）',thermalHundredths:'平移扩散 Dt ×100',mobilityTenths:'迁移率 μ ×10',trapTenths:'谐阱刚度 k ×10',timeTenths:'观察时长 t ×10',frequencyTenths:'读数角频率 ω ×10',densityHundredths:'集体模型参考密度 ρ ×100',slowdownTenths:'密度减速系数 s ×10',gradientTenths:'现象学梯度系数 κ ×10',waveTenths:'集体扰动波数 q ×10',
thermalDominatesShortestTime:'Dt>0时最短时间由热项主导',ballisticWindowNeedsSeparation:'弹道窗口同时需要下限与上限',chiralitySignRetainedInCrossCorrelation:'手性符号保留在交叉相关与条件均值',zeroAngularDiffusionNotClamped:'Dr=0边界不偷换为小正数',circleNotBallisticDiffusion:'圆周边界与直线弹道不同',ensembleMeanNotSamplePath:'条件均值不是一条随机轨迹',ABPNotGaussianProcess:'ABP朝向并非高斯过程',secondMomentsNotFullDistribution:'二阶矩不确定完整概率分布',deltaAtomsNotDensityHeights:'离散谱权重不是密度高度',forceDoesNotTorqueOrientation:'小外力不改变朝向动力学',linearTrapResponseNotThermalization:'线性力响应不意味着热平衡',nonchiralCollectiveModelSeparate:'集体闭合模型单独规定Ω=0',angularHierarchyTruncated:'密度极化模型截断角度高阶矩',gradientTermPhenomenological:'κ项是明确加入的现象学正则项',spinodalNotCoexistence:'线性失稳不等于两相共存',fuelDissipationNotInferred:'运动模型不足以计算燃料耗散',
'bathTemperature':'热浴温度 Dt/μ','freeDiffusionTemperature':'自由扩散读数 Deff/μ','trapTemperature':'谐阱读数 k Var(x)','spectralTemperature':'完整谱的选频温度读数',
'speed':'推进速度v','rot':'旋转扩散Dr','turn':'恒定转速Ω','thermal':'平移扩散Dt','mobility':'迁移率μ','stiffness':'谐阱刚度k','time':'观察时长','frequency':'选频ω','density':'参考密度ρ','slowdown':'密度减速系数s','gradient':'梯度系数κ','wave':'波数q',
'conditional theta(0)=0; not a sample path':'初始方向θ(0)=0的系综均值，不是样本轨迹',
'continuous-part omega->0 limit; not division by zero':'连续部分的ω→0极限，避免直接0/0',
'omega S_cont/(2 Im chi)':'连续部分ωS/(2Imχ)',
'prescribed-uniform-initial-angle-ensemble; not unique angular mixing':'指定均匀初始角度系综，不保证唯一的角度混合',
'stationary isotropic ABP ensemble':'平稳各向同性ABP系综',
'continuous':'连续谱','thermal-continuum-plus-active-delta-atoms':'热连续谱加主动δ谱线',
'passive-diffusion':'被动扩散','ballistic-no-finite-diffusion':'持续弹道，无有限扩散系数',
'bounded-circular-active-displacement':'圆周主动位移有界','mixing-orientation-diffusion':'方向混合后的长时扩散',
'no-fast-angular-relaxation':'没有可先消去的角度松弛','long-time-long-wavelength-closure':'仅适用于长时间、长波长闭合',
'nonchiral two-moment closure with phenomenological density q^4 damping':'非手性两矩闭合，另加现象学密度q⁴阻尼',
'ballistic visibility requires lower time bound as well as upper; no arbitrary pass/fail cutoff':'弹道可见性需要时间下限和上限，不设武断的通过倍数',
'active':'主动扩散贡献','effective':'有效总扩散','status':'极限状态','thermalCrossover':'主动/热项交叉时间','memoryCeiling':'方向记忆上限尺度','scaleSeparation':'上下限尺度之比','rotationalTime':'旋转记忆时间','persistenceLength':'无手性持久长度v/Dr','warning':'解释边界'};
function fmt(x){if(x===null||x===undefined)return'不适用';if(typeof x==='boolean')return x?'是':'否';if(Array.isArray(x))return'['+x.map(fmt).join(', ')+']';if(typeof x==='object')return JSON.stringify(x);if(typeof x==='number')return Number.isInteger(x)&&Math.abs(x)<1e6?String(x):Math.abs(x)<1e-4||Math.abs(x)>=1e5?x.toExponential(5):Number(x.toPrecision(7)).toString();return LABELS[x]??String(x);}
const COLORS=['#3875ba','#c55b32','#368661','#9860a8','#856722','#646e7c'];
function frame(key,title,xLabel,yLabel,series,domain){const ys=series.flatMap(s=>s.points.filter(Boolean).map(p=>p[1]));let lo=Math.min(0,...ys),hi=Math.max(0,...ys);if(hi===lo)hi=lo+1;const pad=.07*(hi-lo);return{key,title,xLabel,yLabel,xMin:domain[0],xMax:domain[1],yMin:lo-pad,yMax:hi+pad,series};}
function plots(s){const M=s.model,line=(name,c,points,extra={})=>({name,color:COLORS[c],points,...extra});
return [
frame('time','热扩散、持续推进与确定性转向','t（参考时间单位）','二维MSD（参考长度平方）',[
line('精确总MSD',0,s.times.map(p=>[p.t,p.msd])),
line('平移热噪声 4Dt t',2,s.times.map(p=>[p.t,p.thermal])),
line('短时展开 4Dt t+v²t²',1,s.times.map(p=>[p.t,p.shortApprox])),
line('长时斜率线 4Deff t',3,s.times.map(p=>p.longSlope===null?null:[p.t,p.longSlope]))
],[0,M.time]),
frame('orientation','手性使记忆振荡；旋转噪声使记忆衰减','t（参考时间单位）','朝向相关（无量纲）',[
line('〈p(t)·p(0)〉',0,s.times.map(p=>[p.t,p.orientationCos])),
line('〈sin[θ(t)−θ(0)]〉',1,s.times.map(p=>[p.t,p.orientationSin])),
line('旋转噪声包络 exp(−Dr t)',2,s.times.map(p=>[p.t,Math.exp(-M.rot*p.t)]))
],[0,M.time]),
frame('spectrum','约束中位置谱：热噪声与主动连续谱','角频率 ω（参考时间的倒数）','双边 Sxx；离散δ权重另列完整表',[
line('总连续谱（不含δ线）',0,s.frequencies.map(p=>[p.omega,p.totalContinuous])),
line('热浴FDT基线',2,s.frequencies.map(p=>[p.omega,p.bathFDT])),
line('主动连续部分',1,s.frequencies.map(p=>[p.omega,p.activeContinuous])),
line('选频的连续谱',4,[[M.frequency,s.chosenSpectrum.totalContinuous]],{markersOnly:true})
],[0,8]),
frame('trap','不同约束与读数不能共享一个普适温度','谐阱刚度 k（参考单位）','温度型比值（kB=1）',[
line('谐阱 k Var(x)',0,s.trapScan.map(p=>[p.stiffness,p.equipartitionReading])),
line('热浴 Dt/μ',2,[[.05,s.readings.bathTemperature],[4,s.readings.bathTemperature]]),
line('自由长时 Deff/μ',1,s.readings.freeDiffusionTemperature===null?[]:[[.05,s.readings.freeDiffusionTemperature],[4,s.readings.freeDiffusionTemperature]]),
line('选频的完整谱读数',3,s.readings.spectralTemperature===null?[]:[[.05,s.readings.spectralTemperature],[4,s.readings.spectralTemperature]])
],[.05,4]),
frame('density','速度下降何时放大密度扰动？','参考密度 ρ（集体模型固定Ω=0）','长波扩散系数；Dr=0时约化不适用',[
line('集体扩散 Dcoll',0,s.densityScan.map(p=>p.collectiveDiffusion===null?null:[p.rho,p.collectiveDiffusion])),
line('局部单粒子扩散',1,s.densityScan.map(p=>p.singleParticleDiffusion===null?null:[p.rho,p.singleParticleDiffusion])),
line('被动扩散 Dt',2,[[0,M.thermal],[1,M.thermal]]),
line('选定密度的集体系数',4,s.density.collectiveDiffusion===null?[]:[[M.density,s.density.collectiveDiffusion]],{markersOnly:true})
],[0,1]),
frame('growth','低波数放大：保留极化与消去极化的差异','波数 q；完整0至4扫描保留在表中','增长率 Re λ；正值只表示线性失稳',[
line('两场闭合的最大实部',0,s.growthScan.filter(p=>p.q<=.5).map(p=>[p.q,p.maxGrowth])),
line('长波约化 −Dcoll q²−κq⁴',1,s.growthScan.filter(p=>p.q<=.5).map(p=>p.reducedGrowth===null?null:[p.q,p.reducedGrowth])),
line('零增长参照',2,[[0,0],[.5,0]]),
line('选定波数',4,M.wave<=.5?[[M.wave,s.growth.maxGrowth]]:[],{markersOnly:true})
],[0,.5])
];}
function tables(s){return[
{key:'parameters',title:'12项输入与三组模型的实际参数',headers:['类别','量','值'],rows:[...Object.entries(s.parameters).map(([k,v])=>['输入',k,v]),...Object.entries(s.model).map(([k,v])=>['参考物理量',k,v]),['单位','约定','长度、时间、能量各用固定参考单位；kB=1'],['集体模型','Ω',0]]},
{key:'time',title:'全部241时刻：MSD、短时展开与长时斜率',headers:['t','热项','主动项','总MSD','主动弹道项','总短时展开','长时斜率线','带常数的长时渐近式','MSD导数','局部指数'],rows:s.times.map(p=>[p.t,p.thermal,p.active,p.msd,p.ballistic,p.shortApprox,p.longSlope,p.longAsymptote,p.derivative,p.localExponent])},
{key:'orientation',title:'全部朝向统计与条件均值：不伪装成随机轨迹',headers:['t','cos相关','sin相关','角均值','角方差','角MSD','条件平均x','条件平均y','各向同性平均x','各向同性平均y','均值定义'],rows:s.times.map(p=>[p.t,p.orientationCos,p.orientationSin,p.angleMean,p.angleVariance,p.angleMSD,p.conditionalX,p.conditionalY,p.isotropicMeanX,p.isotropicMeanY,p.meanConvention])},
{key:'frequency',title:'全部241频率：连续谱、力响应与温度比值',headers:['ω','热连续谱','主动连续谱','总连续谱','Re χ','Im χ','热FDT','连续部分温度读数','完整谱温度读数','含主动δ线','零频定义'],rows:s.frequencies.map(p=>[p.omega,p.thermal,p.activeContinuous,p.totalContinuous,p.responseReal,p.responseImag,p.bathFDT,p.continuousTemperatureReading,p.wholeSpectrumTemperatureReading,p.hasActiveAtoms,p.ratioConvention])},
{key:'trap',title:'80个刚度与当前谐阱的全部二阶矩',headers:['k','衰减率μk','热方差','主动方差','总方差','kVar(x)','热浴温度','r·p','r×p','谱类型','稳态含义'],rows:[...s.trapScan,s.trap].map(p=>[p.stiffness,p.rate,p.thermalVariance,p.activeVariance,p.variance,p.equipartitionReading,p.bathTemperature,p.crossParallel,p.crossPerpendicular,p.spectrumType,p.stationarity])},
{key:'atoms',title:'Dr=0时的δ谱线：积分系数单列，不当密度高度',headers:['项目','频率/量','权重/值','含义'],rows:[...s.trap.atoms.map(p=>['δ谱线',p.omega,p.weight,'Sxx含weight×δ(ω−此频率)']),['谱类型',null,s.trap.spectrumType,'Dr>0时主动谱连续，无δ行'],['原子方差',null,s.trap.atomVariance,'全部δ权重之和/(2π)'],['主动总方差',null,s.trap.activeVariance,'Dr>0时由连续谱积分得到']]},
{key:'windows',title:'弹道窗口的两个尺度与长期极限状态',headers:['量','值'],rows:[...Object.entries(s.windows),...Object.entries(s.diffusion),['当前时刻MSD',s.chosenTime.msd],['当前时刻主动/热比',s.chosenTime.active/s.chosenTime.thermal],['当前时刻力阶跃响应',s.chosenTime.forceStepResponse]]},
{key:'density',title:'201个密度：减速假设与集体系数完整扫描',headers:['ρ','v(ρ)','v导数','v+ρv导数','局部单粒子扩散','集体扩散','长波失稳','约化适用性','Ω'],rows:s.densityScan.map(p=>[p.rho,p.speed,p.speedDerivative,p.polarizationCoupling,p.singleParticleDiffusion,p.collectiveDiffusion,p.spinodal,p.reductionStatus,p.chirality])},
{key:'growth',title:'241个波数：两个本征值、矩阵与约化增长率',headers:['q','矩阵','迹','行列式','判别式','λ+实部','λ+虚部','λ−实部','λ−虚部','最大实部','约化增长率'],rows:s.growthScan.map(p=>[p.q,p.matrix,p.trace,p.determinant,p.discriminant,p.plus.real,p.plus.imag,p.minus.real,p.minus.imag,p.maxGrowth,p.reducedGrowth])},
{key:'longwave',title:'逐次缩小波数：检查消去极化的适用极限',headers:['q','最大实部','−Re λslow/q²','约化系数Dcoll','约化增长率','角度间隙Dr'],rows:s.longwaveScan.map(p=>[p.q,p.maxGrowth,p.negativeSlowOverQ2,s.density.collectiveDiffusion,p.reducedGrowth,p.gap])},
{key:'readings',title:'当前参数下的读数、谱状态与线性稳定性',headers:['量','值'],rows:[...Object.entries(s.readings),['完整谱是否含δ线',s.chosenSpectrum.hasActiveAtoms],['连续谱温度比值',s.chosenSpectrum.continuousTemperatureReading],['当前集体模型Dcoll',s.density.collectiveDiffusion],['当前波数最大增长率',s.growth.maxGrowth],['当前长波约化增长率',s.growth.reducedGrowth],['当前集体模型',s.growth.model]]},
{key:'boundaries',title:'模型假设与结论边界',headers:['边界','是否明确'],rows:Object.entries(s.boundaries)}
];}
const axisFmt=v=>v===0?'0':Math.abs(v)<.001||Math.abs(v)>=10000?v.toExponential(2):Number(v.toFixed(3)).toString();
function svg(p){const left=100,right=855,top=95,bottom=385,X=v=>left+(v-p.xMin)/(p.xMax-p.xMin)*(right-left),Y=v=>bottom-(v-p.yMin)/(p.yMax-p.yMin)*(bottom-top),esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));let out='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 580" role="img" aria-label="'+esc(p.title)+'"><title>'+esc(p.title)+'</title><style>text{font:15px system-ui;fill:currentColor}</style><text x="30" y="30" font-weight="700">'+esc(p.title)+'</text><text x="25" y="70">'+esc(p.yLabel)+'</text>';
const discrete=false;const xticks=discrete?[...new Set(Array.from({length:5},(_,i)=>Math.round(p.xMin+(p.xMax-p.xMin)*i/4)))]:Array.from({length:5},(_,i)=>p.xMin+(p.xMax-p.xMin)*i/4);for(let i=0;i<=4;i++){const x=p.xMin+(p.xMax-p.xMin)*i/4,y=p.yMin+(p.yMax-p.yMin)*i/4;out+='<line x1="100" x2="855" y1="'+Y(y)+'" y2="'+Y(y)+'" stroke="currentColor" opacity=".18"/><text x="85" y="'+(Y(y)+5)+'" text-anchor="end">'+axisFmt(y)+'</text>';}for(const x of xticks){out+='<text x="'+X(x)+'" y="410" text-anchor="middle">'+axisFmt(x)+'</text>';}
out+='<text x="477" y="442" text-anchor="middle">'+esc(p.xLabel)+'</text>';
p.series.forEach((s,i)=>{let pen=false;const path=s.points.map(q=>{if(!q){pen=false;return '';}const d=(pen&&!s.markersOnly?'L':'M')+X(q[0]).toFixed(6)+','+Y(q[1]).toFixed(6);pen=true;return d;}).join(' ');out+='<path data-series="'+i+'" d="'+path+'" stroke="'+s.color+'" stroke-width="2.8" fill="none"/>';const marks=s.markersOnly?s.points.filter(Boolean):s.boundaryMarkers?[...new Set([s.points.find(Boolean),s.points.filter(Boolean).at(-1)])].filter(Boolean):s.points.filter(Boolean).length===1?s.points.filter(Boolean):[];marks.forEach(q=>out+='<circle cx="'+X(q[0])+'" cy="'+Y(q[1])+'" r="'+(s.markerRadius??5)+'" stroke="'+s.color+'" fill="'+(s.hollow?'none':s.open?'var(--bg,#fff)':s.color)+'" stroke-width="'+(s.markerStrokeWidth??2.5)+'"/>');out+='<line x1="'+(40+430*(i%2))+'" x2="'+(60+430*(i%2))+'" y1="'+(473+32*Math.floor(i/2))+'" y2="'+(473+32*Math.floor(i/2))+'" stroke="'+s.color+'" stroke-width="3"/><text x="'+(68+430*(i%2))+'" y="'+(478+32*Math.floor(i/2))+'">'+esc(s.name)+'</text>';});if(!p.series.some(s=>s.points.some(Boolean)))out+='<text x="450" y="245" text-anchor="middle">当前模型在此参数下无适用数据</text>';return out+'</svg>';}

var mounted=new WeakMap();
function mount(root){const doc=root.ownerDocument,previous=mounted.get(root);if(previous)previous();root.replaceChildren();root.classList.add('active202');let c=config(PRESETS[0].parameters),choices={},revealed=false,url=null,current=null,view=0,valid=true;
 const el=(tag,attrs={},text)=>{const e=doc.createElement(tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);if(text!==undefined)e.textContent=text;return e;};
 if(!doc.querySelector('[data-active202-style]')){const style=el('style',{'data-active202-style':''});style.textContent='.active202{margin-inline:0!important;width:100%;min-width:0;color:var(--fg,#222);line-height:1.65}.active202 *{box-sizing:border-box}.active202 button,.active202 select{font:inherit;min-height:44px;padding:8px;border:1px solid var(--border,#aaa);border-radius:5px;background:var(--block-bg,#eee);color:inherit;max-width:100%;white-space:normal}.active202 button[aria-pressed="true"]{outline:2px solid var(--accent,#a33)}.active202 button:focus-visible,.active202 select:focus-visible,.active202 [tabindex]:focus-visible{outline:3px solid #2474bc}.active202 .am-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.active202 label{display:grid;gap:4px;min-width:0}.active202 input{width:100%;min-height:44px;font:inherit;color:inherit;background:var(--bg,#fff)}.active202 .am-row{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.active202 .am-pred>strong{display:block;margin-bottom:6px}.active202 .am-pred{padding:10px 0;border-top:1px solid var(--border,#aaa)}.active202 .am-feedback{margin:7px 0}.active202 .am-scroll{max-width:100%;overflow:auto}.active202 svg{display:block;min-width:680px;width:100%;height:auto}.active202 table{display:table;overflow:visible;max-width:none;border-collapse:collapse;width:max-content;min-width:100%;font-variant-numeric:tabular-nums}.active202 td,.active202 th{white-space:nowrap;text-align:right;padding:7px;border:1px solid var(--border,#bbb)}.active202 [hidden]{display:none!important}.active202 details{margin:12px 0}.active202 summary{min-height:44px;cursor:pointer}.active202 .am-status{border-left:3px solid var(--accent,#a33);padding:8px 12px}.active202 .am-correct{color:var(--cl-green,#277540)}.active202 .am-wrong{color:var(--cl-red,#a33)}@media(max-width:600px){.active202 .am-grid{grid-template-columns:1fr}}';doc.head.append(style);}
 root.append(el('h3',{},'会自己推进的粒子，什么时候看起来像扩散？'),el('p',{},'自由手性ABP、受约束粒子和独立的集体闭合模型，分别检验位移、响应与密度失稳。先预测，再读完整表格。'));
 const presets=el('div',{class:'am-row','aria-label':'教学预设'});for(const p of PRESETS){const b=el('button',{type:'button','data-preset':p.id},p.name);b.onclick=()=>{c=config(p.parameters);valid=true;sync();reset();};presets.append(b);}root.append(presets);
 const fields={},outs={},grid=el('div',{class:'am-grid'});




 for(const[key,title]of Object.entries(LABELS).filter(([key])=>Object.hasOwn(LIMITS,key))){const[min,max]=LIMITS[key],label=el('label',{},title),out=el('output'),input=el('input',{type:'range',min,max,step:1,'data-field':key,'aria-label':title});label.append(out,input);grid.append(label);fields[key]=input;outs[key]=out;input.oninput=input.onchange=change;}root.append(grid);
 function change(){try{c=config(Object.fromEntries(Object.entries(fields).map(([k,e])=>[k,e.value===''?NaN:Number(e.value)])));valid=true;sync();reset();}catch(e){valid=false;reset();status.textContent='请使用控件范围内的整数，再按标签倍率换成实际量。';}}
 const note=el('p'),prediction=el('section',{'aria-label':'先预测'});root.append(note,prediction);prediction.append(el('h4',{},'先预测：热噪声、圆周、温度读数与集体失稳'),el('p',{},'四题的条件固定写在题干里；参数用来检查例子，不自动改变问题。'));
 const feedbacks=[],buttons=[];QUESTIONS.forEach((q,i)=>{const row=el('div',{class:'am-pred'});row.append(el('strong',{},q[0]));buttons[i]=[];q[1].forEach((text,j)=>{const b=el('button',{type:'button','data-prediction':i,'data-choice':String(j===0),'aria-pressed':'false'},text);b.onclick=()=>{choices[i]=j;buttons[i].forEach((x,k)=>x.setAttribute('aria-pressed',String(j===k)));if(revealed)showFeedback();};row.append(b);buttons[i].push(b);});feedbacks[i]=el('p',{class:'am-feedback','data-feedback':i});row.append(feedbacks[i]);prediction.append(row);});
 const check=el('button',{type:'button','data-check':''},'核对预测并显示完整结果'),status=el('p',{class:'am-status','aria-live':'polite'});root.append(check,status);
 const stage=el('section',{'data-stage':'',hidden:'','aria-label':'实验结果'}),summary=el('p'),plotButtons=el('div',{class:'am-row'}),plotWrap=el('div',{class:'am-scroll',tabindex:0,role:'region','aria-label':'图表，可横向滚动'}),plotNote=el('p',{},'短时展开和长波约化线在完整范围展示，便于看出失效；它们并非全域准确。谱图只画连续部分，Dr=0的δ权重在完整表中单列。增长率大于0只表示指定闭合模型的线性失稳。'),tableHost=el('div'),download=el('a',{'data-download':'',download:'am-record.json'},'下载当前完整记录（JSON）');stage.append(summary,plotButtons,plotWrap,plotNote,tableHost,download);root.append(stage);
 function sync(){for(const[k,e]of Object.entries(fields))e.value=c[k];}
 function reset(){if(url){hostWindow.URL.revokeObjectURL(url);url=null;download.removeAttribute('href');}revealed=false;choices={};stage.hidden=true;delete root.__activeSnapshot;for(let i=0;i<4;i++){feedbacks[i].textContent='';for(const b of buttons[i])b.setAttribute('aria-pressed','false');}for(const[k,o]of Object.entries(outs))o.textContent=fmt(c[k]);note.textContent='所有量用固定参考长度、时间和能量单位，kB=1。Ω只改变两组单粒子模型；集体模型独立规定Ω=0。Dt与μ定义被动热浴T=Dt/μ，主动推进不改变这个基线。';status.textContent='完成四项预测后显示当前结果。';}
 function showFeedback(){let n=0;for(let i=0;i<4;i++){if(!Number.isInteger(choices[i]))continue;const f=feedback(i,choices[i]);n+=+f.correct;feedbacks[i].textContent=f.text;feedbacks[i].className='am-feedback '+(f.correct?'am-correct':'am-wrong');}status.textContent='预测核对：'+n+'/4 正确。图、表和下载均对应当前参数。';}
 function draw(){const ps=plots(current);plotWrap.innerHTML=svg(ps[view]);Array.from(plotButtons.children).forEach((b,i)=>b.setAttribute('aria-pressed',String(i===view)));}
 function render(){current=compute(c);root.__activeSnapshot=current;stage.hidden=false;summary.textContent='热浴温度='+fmt(current.readings.bathTemperature)+'；自由扩散读数='+fmt(current.readings.freeDiffusionTemperature)+'；谐阱读数='+fmt(current.readings.trapTemperature)+'；选频完整谱读数='+fmt(current.readings.spectralTemperature)+'。当前集体闭合Dcoll='+fmt(current.density.collectiveDiffusion)+'。'+(current.trap.atoms.length?'存在主动δ谱线，连续谱曲线不能代表完整谱。':'主动噪声在本组参数下为连续谱。');plotButtons.replaceChildren();plots(current).forEach((p,i)=>{const b=el('button',{type:'button','data-plot':p.key},p.title);b.onclick=()=>{view=i;draw();};plotButtons.append(b);});draw();tableHost.replaceChildren();for(const t of tables(current)){const d=el('details',{'data-table':t.key});d.append(el('summary',{},t.title));d.addEventListener('toggle',()=>{if(!d.open||d.children.length>1)return;const wrap=el('div',{class:'am-scroll',tabindex:0,role:'region','aria-label':t.title+'，可横向滚动'}),table=el('table'),thead=el('thead'),tr=el('tr'),tbody=el('tbody');for(const h of t.headers)tr.append(el('th',{scope:'col'},h));thead.append(tr);for(const row of t.rows){const r=el('tr');for(const v of row)r.append(el('td',{},fmt(v)));tbody.append(r);}table.append(thead,tbody);wrap.append(table);d.append(wrap);});tableHost.append(d);}if(url)hostWindow.URL.revokeObjectURL(url);url=hostWindow.URL.createObjectURL(new hostWindow.Blob([JSON.stringify(current)],{type:'application/json'}));download.href=url;showFeedback();}
 check.onclick=()=>{if(!valid){status.textContent='请先修正无效参数。';return;}if(![0,1,2,3].every(i=>Number.isInteger(choices[i]))){status.textContent='请先为四个问题各选一个预测。';return;}revealed=true;render();};sync();reset();mounted.set(root,()=>{if(url)hostWindow.URL.revokeObjectURL(url);});
}

function selfTest(){let checks=coreSelfTest().checks;const ok=v=>{if(!v)throw Error('Kubo201 view '+checks);checks++;};for(const p of PRESETS){const s=compute(p.parameters);ok(plots(s).length===6);ok(tables(s).length===12);for(const plot of plots(s))for(const q of plot.series)for(const v of q.points)if(v)ok(v.every(Number.isFinite));for(let i=0;i<4;i++)ok(feedback(i,QUESTIONS[i][2]).correct);}return {status:'PASS',checks};}
const API={LIMITS,DEFAULT,PRESETS,config,QUESTIONS,compute,snapshot:compute,plots,tables,svg,feedback,fmt,mount,selfTest,model,memoryIntegral,diffusion,timed,trap,spectrum,density,growth};if(typeof module!=="undefined"&&module.exports)module.exports=API;if(hostWindow&&hostWindow.CourseLearning)hostWindow.CourseLearning.register("physics-active-matter",mount);})(typeof window!=="undefined"?window:null);
