(function(hostWindow){"use strict";

const LIMITS={sites:[8,64],mode:[0,32],massPercent:[0,200],stiffnessPercent:[1,200],mobilityPercent:[1,200],temperaturePercent:[1,200],timeTenths:[0,200],stepMillis:[1,2000]};
const DEFAULT={sites:16,mode:1,massPercent:25,stiffnessPercent:100,mobilityPercent:100,temperaturePercent:100,timeTenths:10,stepMillis:100};
function config(input={}){if(input===null||typeof input!=='object'||Array.isArray(input))throw Error('parameters');for(const k of Object.keys(input))if(!Object.prototype.hasOwnProperty.call(LIMITS,k))throw Error('unknown '+k);const c={...DEFAULT,...input};for(const[k,[lo,hi]]of Object.entries(LIMITS))if(!Number.isInteger(c[k])||c[k]<lo||c[k]>hi)throw Error('domain '+k);if(c.mode>Math.floor(c.sites/2))throw Error('mode exceeds Nyquist');return c;}
const PRESETS=[
['default','默认：守恒长波模式',{}],
['zero','零模：固定总量没有涨落',{mode:0}],
['critical','r=0：有限环的受约束高斯场',{massPercent:0}],
['short','Nyquist模式：长波近似失效',{mode:8}],
['large','64点环的最慢非零模',{sites:64}],
['small','8点环的最低模式',{sites:8}],
['stiff','大梯度代价',{stiffnessPercent:200}],
['soft','几乎局域的静态自由能',{stiffnessPercent:1,massPercent:200}],
['slow','只减慢迁移率',{mobilityPercent:1}],
['hot','只提高温度',{temperaturePercent:200}],
['biased-step','Euler稳定但方差明显偏大',{mode:4,stepMillis:300}],
['unstable-step','Euler不稳定；精确OU仍稳定',{mode:8,massPercent:200,stiffnessPercent:200,mobilityPercent:200,stepMillis:2000}]
].map(([id,label,p])=>({id,label,parameters:config(p)}));
const matrix=(n,fn)=>Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>fn(i,j)));
const multiply=(A,B)=>matrix(A.length,(i,j)=>A[i].reduce((sum,x,k)=>sum+x*B[k][j],0));
function model(c){
 const N=c.sites,r=c.massPercent/100,kappa=c.stiffnessPercent/100,M=c.mobilityPercent/100,theta=c.temperaturePercent/100;
 const L=matrix(N,(i,j)=>(i===j?2:0)-((i+1)%N===j?1:0)-((i+N-1)%N===j?1:0)),H=matrix(N,(i,j)=>kappa*L[i][j]+(i===j?r:0)),A=multiply(L,H).map(row=>row.map(x=>M*x)),Q=L.map(row=>row.map(x=>2*theta*M*x));
 const modes=Array.from({length:N},(_,m)=>{const q=2*Math.PI*m/N,folded=Math.min(m,N-m),wave=2*Math.PI*folded/N,laplacian=4*Math.sin(Math.PI*m/N)**2,h=r+kappa*laplacian,rate=M*laplacian*h,zero=m===0;
 return{index:m,wave,phaseWave:q,laplacian,stiffness:h,staticVariance:zero?0:theta/h,staticResponse:zero?0:1/h,rate:zero?0:rate,rateA:M*h,diffusionRate:M*r*wave*wave,continuumRate:M*wave*wave*(r+kappa*wave*wave),noisePower:2*theta*M*laplacian,zeroMode:zero};
 });
 const spatial=Array.from({length:N},(_,j)=>{const C=modes.reduce((s,m)=>s+m.staticVariance*Math.cos(m.phaseWave*j),0)/N;
 return{site:j,distance:Math.min(j,N-j),covariance:C,unconstrainedCovariance:r>0?C+theta/(N*r):null};});
 const C=matrix(N,(i,j)=>spatial[(i-j+N)%N].covariance),P=matrix(N,(i,j)=>(i===j?1:0)-1/N);
 return{N,r,kappa,M,theta,L,H,A,Q,C,P,modes,spatial,continuumCorrelationLength:r>0?Math.sqrt(kappa/r):null,unconstrainedZeroVariance:r>0?theta/r:null,diffusionCoefficient:M*r,conductivityFactor:M};
}
function selectedTime(m,theta,t){const decay=Math.exp(-m.rate*Math.abs(t)),causal=t>=0,plus=Math.exp(-m.rate*Math.max(0,t));return{time:t,correlation:m.staticVariance*decay,response:causal?m.noisePower/(2*theta)*plus:0,normalizedCorrelation:m.zeroMode?null:decay,normalizedResponse:m.zeroMode?null:causal?plus:0,varianceCold:t<0?null:m.staticVariance*(-Math.expm1(-2*m.rate*t)),varianceNoiseOff:t<0?null:m.staticVariance*Math.exp(-2*m.rate*t),varianceEquilibrium:m.staticVariance,causal};}
function selectedFrequency(m,theta,x){if(m.zeroMode)return{scaledFrequency:x,omega:x,spectrum:0,response:[0,0],fdtSpectrum:0,active:false};const omega=x*m.rate,den=m.rate*m.rate+omega*omega,source=m.noisePower/(2*theta),spectrum=2*m.staticVariance*m.rate/den;return{scaledFrequency:x,omega,spectrum,response:[source*m.rate/den,source*omega/den],fdtSpectrum:2*theta*source/den,active:true};}
function stepping(m,theta,dt){
 const x=m.rate*dt,alpha=Math.exp(-x),noise=m.staticVariance*(-Math.expm1(-2*x)),eulerAlpha=1-x,eulerNoise=m.noisePower*dt,stable=!m.zeroMode&&x<2;
 let exactVariance=0,eulerVariance=0;
 const rows=Array.from({length:65},(_,step)=>{if(step){exactVariance=alpha*alpha*exactVariance+noise;eulerVariance=eulerAlpha*eulerAlpha*eulerVariance+eulerNoise;}return{step,time:step*dt,exactVariance,eulerVariance,noiseOffVariance:m.staticVariance*Math.exp(-2*x*step),equilibriumVariance:m.staticVariance};});
 return{dt,rateStep:x,alpha,noiseVariance:noise,eulerAlpha,eulerNoiseVariance:eulerNoise,eulerStable:stable,eulerStatus:m.zeroMode?'constrained-zero':x<2?'stable':x===2?'marginal-growth':'unstable',eulerStationaryVariance:stable?m.staticVariance/(1-x/2):null,exactStationaryVariance:m.staticVariance,rows};
}
function compute(input={}){
 const c=config(input),s=model(c),selected=s.modes[c.mode],grid=Array.from({length:241},(_,i)=>(i-40)/10);
 if(!selected.zeroMode)for(const x of [.0625,.125,.25,.5,.75,1,1.5,2,3,4,6,8])for(const sign of [-1,1]){const t=sign*x/selected.rate;if(t>=-4&&t<=20)grid.push(t);}
 const time=[...new Set(grid)].sort((a,b)=>a-b).map(t=>selectedTime(selected,s.theta,t)),frequency=Array.from({length:201},(_,i)=>selectedFrequency(selected,s.theta,(i-100)/10));
 const t=c.timeTenths/10,profile=Array.from({length:s.N},(_,j)=>({site:j,initial:(j===0?1:0)-1/s.N,value:s.modes.slice(1).reduce((sum,m)=>sum+Math.exp(-m.rate*t)*Math.cos(m.phaseWave*j),0)/s.N,covarianceAtTime:s.modes.reduce((sum,m)=>sum+m.staticVariance*Math.exp(-m.rate*t)*Math.cos(m.phaseWave*j),0)/s.N}));
 const windows=Array.from({length:100},(_,i)=>{const scaledHalfWidth=(i+1)/10;return{scaledHalfWidth,halfWidth:selected.zeroMode?scaledHalfWidth:scaledHalfWidth*selected.rate,spectralMass:selected.zeroMode?0:2*selected.staticVariance*Math.atan(scaledHalfWidth)/Math.PI,fullMass:selected.staticVariance};});
 return{schema:'transport194-v1',parameters:c,units:{space:'lattice spacing a',energy:'E0',time:'t0',temperature:'kBT/E0',field:'dimensionless density deviation; sum fixed to zero',source:'free energy/E0 contains -h dot phi'},model:s,selected,time,frequency,windows,profile,selectedTime:selectedTime(selected,s.theta,t),step:stepping(selected,s.theta,c.stepMillis/1000),boundaries:{canonicalZeroRemoved:true,gaussianFiniteRing:true,noiseConservesTotal:true,negativeCovarianceAllowed:true,matrixCovariancePositiveSemidefinite:true,zeroResponseNotGrandCanonicalSusceptibility:true,criticalInfiniteVolumeNotClaimed:true,modelANonzeroComparisonOnly:true,frequencyGridUsesSelectedRate:!selected.zeroMode,eulerInstabilityIsNumerical:true,quantumFDTNotUsed:true,conductivityNeedsPhysicalUnits:true}};
}
const QUESTIONS=[
['固定总量的封闭环上，m=0 的密度涨落是多少？',['为零；总量不是随机变量','等于温度除以 r，和其他模式一样'],0,'本实验选择总密度严格固定的系综，因此零模的协方差和响应均为零。允许与粒子库交换的静态系综需要另行定义。'],
['从平衡态出发，只保留耗散漂移并关闭噪声，会怎样？',['仍保持相同平衡方差','非零模式的方差逐渐消失'],1,'耗散使方差按 exp(−2Γt) 减小。热噪声以匹配的强度补回方差，才维持平衡分布。'],
['Euler 满足 0<ΓΔt<2，就准确保持平衡方差吗？',['是；稳定就表示正确','否；稳态方差仍有步长偏差'],1,'Euler 的稳态方差为 S/(1−ΓΔt/2)。精确 OU 步进使用 S(1−exp(−2ΓΔt)) 的噪声方差，才能精确保持 S。'],
['在同一个平衡协方差下，把迁移率 M 加倍，会怎样？',['静态涨落不变，弛豫加快','静态涨落和相关长度都加倍'],0,'M 同时进入耗散和噪声，二者的比值决定平衡方差。温度和自由能决定静态涨落，守恒律和迁移率还决定动力学。']
];
function feedback(i,j){if(!Number.isInteger(i)||i<0||i>=4||![0,1].includes(j))throw Error('choice');return{correct:j===QUESTIONS[i][2],text:(j===QUESTIONS[i][2]?'正确。':'需要修正。')+QUESTIONS[i][3]};}
const LABELS={sites:'环上格点数 N',mode:'选定模式 m',massPercent:'局部代价 r ×100',stiffnessPercent:'梯度代价 κ ×100',mobilityPercent:'迁移率 M ×100',temperaturePercent:'温度 Θ ×100',timeTenths:'观察时间 ×10',stepMillis:'步长 ×1000',canonicalZeroRemoved:'固定总量，零模移除',gaussianFiniteRing:'有限环的高斯模型',noiseConservesTotal:'噪声来自守恒通量',negativeCovarianceAllowed:'空间协方差可为负',matrixCovariancePositiveSemidefinite:'完整协方差矩阵半正定',zeroResponseNotGrandCanonicalSusceptibility:'零模响应不能替代粒子库静态响应',criticalInfiniteVolumeNotClaimed:'不宣称无限系统临界平衡',modelANonzeroComparisonOnly:'Model A 只比较非零模式',frequencyGridUsesSelectedRate:'频率以选定弛豫率缩放',eulerInstabilityIsNumerical:'Euler 失稳是数值效应',quantumFDTNotUsed:'使用经典涨落耗散关系',conductivityNeedsPhysicalUnits:'电导率须恢复物理单位'};
function fmt(x){if(x===null||x===undefined)return'不适用／极限见说明';if(typeof x==='boolean')return x?'是':'否';if(Array.isArray(x))return'['+x.map(fmt).join(', ')+']';if(typeof x==='object')return JSON.stringify(x);if(typeof x==='number')return Number.isInteger(x)&&Math.abs(x)<1e6?String(x):Math.abs(x)<1e-4||Math.abs(x)>=1e5?x.toExponential(5):Number(x.toPrecision(7)).toString();return LABELS[x]??String(x);}
const COLORS=['#3875ba','#c55b32','#368661','#9860a8','#856722','#646e7c'];
function frame(key,title,xLabel,yLabel,series,domain,range){const ys=series.flatMap(s=>s.points.filter(Boolean).map(p=>p[1]));let ymin=range?.[0]??Math.min(0,...ys),ymax=range?.[1]??Math.max(0,...ys);if(ymin===ymax)ymax=ymin+1;if(!range){const pad=.07*(ymax-ymin);ymin-=pad;ymax+=pad;}return{key,title,xLabel,yLabel,xMin:domain[0],xMax:domain[1],yMin:ymin,yMax:ymax,series};}
function plots(s){const series=(name,color,points,extra={})=>({name,color:COLORS[color],points,...extra}),half=s.model.modes.slice(1,Math.floor(s.model.N/2)+1),m=s.selected,S=m.staticVariance,positive=s.time.filter(r=>r.time>=0),normalize=v=>m.zeroMode?null:v/S;
return[
frame('space','空间相关：负相关也能满足正定性','格点 j；周期环，a=1','C(j)=〈φj φ0〉',[
series('固定总量：含补偿性负相关',0,s.model.spatial.map(r=>[r.site,r.covariance]),{boundaryMarkers:true}),
series('允许总量涨落的静态系综（r>0）',1,s.model.spatial.map(r=>r.unconstrainedCovariance===null?null:[r.site,r.unconstrainedCovariance]))
],[0,s.model.N-1]),
frame('rates','相同静态自由能，不同动力学','q a；仅比较非零模式','弛豫率 Γ t0',[
series('守恒 Model B：格点精确值',0,half.map(r=>[r.wave,r.rate]),{markersOnly:true}),
series('非守恒 Model A：对照',1,half.map(r=>[r.wave,r.rateA]),{markersOnly:true}),
series('Model B 连续近似',2,half.map(r=>[r.wave,r.continuumRate])),
series('仅 Fick 的 Dq² 近似',3,half.map(r=>[r.wave,r.diffusionRate]))
],[0,Math.PI],[0,Math.max(...half.flatMap(r=>[r.rate,r.rateA,r.continuumRate,r.diffusionRate]))*1.05]),
frame('time','相关有负时间；响应必须因果','t/t0','分别归一化：C/S 与 R/(Mℓ)',[
series('相关 C(t)/S',0,s.time.map(r=>r.normalizedCorrelation===null?null:[r.time,r.normalizedCorrelation])),
series('响应 t≥0；t=0 取右极限',1,positive.map(r=>r.normalizedResponse===null?null:[r.time,r.normalizedResponse])),
series('响应 t<0 为零',2,m.zeroMode?[]:[[-4,0],[-.01,0]])
],[-4,20],[0,1.05]),
frame('frequency','频谱与响应：缩放后直接核对 FDT','ω/Γ；零模没有可缩放的谱','Γ C̃/(2S)；Reχ/χ静；Imχ/χ静',[
series('涨落谱（蓝）',0,s.frequency.map(r=>r.active?[r.scaledFrequency,r.spectrum*m.rate/(2*S)]:null)),
series('响应实部（与蓝重合）',1,s.frequency.map(r=>r.active?[r.scaledFrequency,r.response[0]/m.staticResponse]:null)),
series('响应虚部',2,s.frequency.map(r=>r.active?[r.scaledFrequency,r.response[1]/m.staticResponse]:null)),
series('FDT 重构谱（与蓝重合）',3,s.frequency.filter((_,i)=>i%10===0).map(r=>r.active?[r.scaledFrequency,r.fdtSpectrum*m.rate/(2*S)]:null),{markersOnly:true,markerRadius:3})
],[-10,10],[-.55,1.05]),
frame('noise','同一漂移：噪声决定是否维持平衡','t/t0','方差 / 平衡方差 S',[
series('冷初态 + 匹配噪声',0,positive.map(r=>m.zeroMode?null:[r.time,normalize(r.varianceCold)])),
series('平衡初态，关闭噪声',1,positive.map(r=>m.zeroMode?null:[r.time,normalize(r.varianceNoiseOff)])),
series('平衡初态 + 匹配噪声',2,positive.map(r=>m.zeroMode?null:[r.time,1]))
],[0,20],[0,1.05]),
frame('steps','精确 OU 与 Euler：稳定仍可能有偏差','步数 k；两者从 V0=0 出发','log10(1+V/S)；原始方差完整保留在表中',[
series('精确 OU',0,s.step.rows.map(r=>m.zeroMode?null:[r.step,Math.log10(1+r.exactVariance/S)])),
series('Euler-Maruyama',1,s.step.rows.map(r=>m.zeroMode?null:[r.step,Math.log10(1+r.eulerVariance/S)])),
series('平衡 S：log10(2)',2,m.zeroMode?[]:[[0,Math.log10(2)],[64,Math.log10(2)]])
],[0,64],[0,m.zeroMode?1:1.05*Math.max(Math.log10(2),...s.step.rows.map(r=>Math.log10(1+r.eulerVariance/S)))])
];}
function tables(s){const m=s.selected;return[
{key:'parameters',title:'8 个输入及缩放：N、m 不缩放',headers:['参数','滑块整数'],rows:Object.entries(s.parameters)},
{key:'model',title:'模型与选定模式：零模不作 0/0 归一化',headers:['量','值'],rows:[['r',s.model.r],['κ',s.model.kappa],['M',s.model.M],['Θ',s.model.theta],['连续近似 ξ/a；r=0 不给无限体积解释',s.model.continuumCorrelationLength],['Fick 系数 D=Mr',s.model.diffusionCoefficient],['选定 ℓ',m.laplacian],['选定 h',m.stiffness],['平衡方差 S',m.staticVariance],['静态响应 χ',m.staticResponse],['Γ',m.rate],['噪声功率 Q',m.noisePower],['ΓΔt',s.step.rateStep],['Euler 状态',s.step.eulerStatus],['Euler 稳态方差（仅稳定非零模）',s.step.eulerStationaryVariance]]},
{key:'modes',title:'全部 Fourier 模式：m 与 N−m 成对',headers:['m','折叠 q','原始相位 q','ℓ','h','S','χ静','ΓB','ΓA（仅非零模比较）','Dq²','连续 ΓB','Q','零模'],rows:s.model.modes.map(r=>[r.index,r.wave,r.phaseWave,r.laplacian,r.stiffness,r.staticVariance,r.staticResponse,r.rate,r.zeroMode?null:r.rateA,r.diffusionRate,r.continuumRate,r.noisePower,r.zeroMode])},
{key:'space',title:'全部空间相关：总和为零；负值不是负概率',headers:['j','环上距离','固定总量 C(j)','未约束静态 C(j)，仅 r>0'],rows:s.model.spatial.map(r=>[r.site,r.distance,r.covariance,r.unconstrainedCovariance])},
{key:'matrices',title:'完整矩阵：每行一条记录，列编号 0…N−1',headers:['矩阵','行编号','完整行'],rows:['L','H','A','Q','C','P'].flatMap(key=>s.model[key].map((row,i)=>[key,i,row]))},
{key:'time',title:'时间采样：固定网格加弛豫时标附近的加密点',headers:['t','C(t)','R(t)','C/S','R/(Mℓ)','冷初态方差','关闭噪声方差','平衡方差','t≥0'],rows:s.time.map(r=>[r.time,r.correlation,r.response,r.normalizedCorrelation,r.normalizedResponse,r.varianceCold,r.varianceNoiseOff,r.varianceEquilibrium,r.causal])},
{key:'frequency',title:'201 个频率点：零模 active=false，横轴缩放不适用',headers:['ω/Γ 标签','实际 ω（零模只是占位）','C̃','Reχ','Imχ','FDT 重构 C̃','非零模'],rows:s.frequency.map(r=>[r.scaledFrequency,r.omega,r.spectrum,...r.response,r.fdtSpectrum,r.active])},
{key:'windows',title:'100 个有限频窗：积分测度 dω/(2π)',headers:['W/Γ 标签','W（零模只是占位）','窗内方差质量','全轴方差 S'],rows:s.windows.map(r=>[r.scaledHalfWidth,r.halfWidth,r.spectralMass,r.fullMass])},
{key:'profile',title:'当前观察时间：局部扰动带均匀补偿，保持总和零',headers:['j','初始 δj0−1/N','当前均值扰动','当前两时空间协方差'],rows:s.profile.map(r=>[r.site,r.initial,r.value,r.covarianceAtTime])},
{key:'step',title:'步进系数：噪声栏是增量方差',headers:['量','值'],rows:[['Δt',s.step.dt],['ΓΔt',s.step.rateStep],['精确 α',s.step.alpha],['精确增量方差',s.step.noiseVariance],['Euler α',s.step.eulerAlpha],['Euler 增量方差',s.step.eulerNoiseVariance],['Euler 稳定（零模单独受约束）',s.step.eulerStable],['Euler 状态',s.step.eulerStatus],['Euler 稳态方差',s.step.eulerStationaryVariance],['精确平衡方差',s.step.exactStationaryVariance]]},
{key:'steps',title:'65 个离散步：未经对数变换的原始方差',headers:['k','t','精确 OU 方差','Euler 方差','关闭噪声方差','平衡方差'],rows:s.step.rows.map(r=>[r.step,r.time,r.exactVariance,r.eulerVariance,r.noiseOffVariance,r.equilibriumVariance])},
{key:'boundaries',title:'解释边界与守恒条件',headers:['条件','成立'],rows:Object.entries(s.boundaries)}
];}
const axisFmt=v=>v===0?'0':Math.abs(v)<.001||Math.abs(v)>=10000?v.toExponential(2):Number(v.toFixed(3)).toString();
function svg(p){const left=100,right=855,top=95,bottom=385,X=v=>left+(v-p.xMin)/(p.xMax-p.xMin)*(right-left),Y=v=>bottom-(v-p.yMin)/(p.yMax-p.yMin)*(bottom-top),esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));let out='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 580" role="img" aria-label="'+esc(p.title)+'"><title>'+esc(p.title)+'</title><style>text{font:15px system-ui;fill:currentColor}</style><text x="30" y="30" font-weight="700">'+esc(p.title)+'</text><text x="25" y="70">'+esc(p.yLabel)+'</text>';
const discrete=['space','steps'].includes(p.key);const xticks=discrete?[...new Set(Array.from({length:5},(_,i)=>Math.round(p.xMin+(p.xMax-p.xMin)*i/4)))]:Array.from({length:5},(_,i)=>p.xMin+(p.xMax-p.xMin)*i/4);for(let i=0;i<=4;i++){const x=p.xMin+(p.xMax-p.xMin)*i/4,y=p.yMin+(p.yMax-p.yMin)*i/4;out+='<line x1="100" x2="855" y1="'+Y(y)+'" y2="'+Y(y)+'" stroke="currentColor" opacity=".18"/><text x="85" y="'+(Y(y)+5)+'" text-anchor="end">'+axisFmt(y)+'</text>';}for(const x of xticks){out+='<text x="'+X(x)+'" y="410" text-anchor="middle">'+axisFmt(x)+'</text>';}
out+='<text x="477" y="442" text-anchor="middle">'+esc(p.xLabel)+'</text>';
p.series.forEach((s,i)=>{let pen=false;const path=s.points.map(q=>{if(!q){pen=false;return '';}const d=(pen&&!s.markersOnly?'L':'M')+X(q[0]).toFixed(6)+','+Y(q[1]).toFixed(6);pen=true;return d;}).join(' ');out+='<path data-series="'+i+'" d="'+path+'" stroke="'+s.color+'" stroke-width="2.8" fill="none"/>';const marks=s.markersOnly?s.points.filter(Boolean):s.boundaryMarkers?[...new Set([s.points.find(Boolean),s.points.filter(Boolean).at(-1)])].filter(Boolean):s.points.filter(Boolean).length===1?s.points.filter(Boolean):[];marks.forEach(q=>out+='<circle cx="'+X(q[0])+'" cy="'+Y(q[1])+'" r="'+(s.markerRadius??5)+'" stroke="'+s.color+'" fill="'+(s.hollow?'none':s.open?'var(--bg,#fff)':s.color)+'" stroke-width="'+(s.markerStrokeWidth??2.5)+'"/>');out+='<line x1="'+(40+430*(i%2))+'" x2="'+(60+430*(i%2))+'" y1="'+(473+32*Math.floor(i/2))+'" y2="'+(473+32*Math.floor(i/2))+'" stroke="'+s.color+'" stroke-width="3"/><text x="'+(68+430*(i%2))+'" y="'+(478+32*Math.floor(i/2))+'">'+esc(s.name)+'</text>';});if(!p.series.some(s=>s.points.some(Boolean)))out+='<text x="450" y="245" text-anchor="middle">当前模型在此参数下无适用数据</text>';return out+'</svg>';}

var mounted=new WeakMap();
function mount(root){const doc=root.ownerDocument,previous=mounted.get(root);if(previous)previous();root.replaceChildren();root.classList.add('transport194');let c=config(PRESETS[0].parameters),choices={},revealed=false,url=null,current=null,view=0,valid=true;
 const el=(tag,attrs={},text)=>{const e=doc.createElement(tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);if(text!==undefined)e.textContent=text;return e;};
 if(!doc.querySelector('[data-transport194-style]')){const style=el('style',{'data-transport194-style':''});style.textContent='.transport194{margin-inline:0!important;width:100%;min-width:0;color:var(--fg,#222);line-height:1.65}.transport194 *{box-sizing:border-box}.transport194 button,.transport194 select{font:inherit;min-height:44px;padding:8px;border:1px solid var(--border,#aaa);border-radius:5px;background:var(--block-bg,#eee);color:inherit;max-width:100%;white-space:normal}.transport194 button[aria-pressed="true"]{outline:2px solid var(--accent,#a33)}.transport194 button:focus-visible,.transport194 select:focus-visible,.transport194 [tabindex]:focus-visible{outline:3px solid #2474bc}.transport194 .tr-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.transport194 label{display:grid;gap:4px;min-width:0}.transport194 input{width:100%;min-height:44px;font:inherit;color:inherit;background:var(--bg,#fff)}.transport194 .tr-row{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.transport194 .tr-pred>strong{display:block;margin-bottom:6px}.transport194 .tr-pred{padding:10px 0;border-top:1px solid var(--border,#aaa)}.transport194 .tr-feedback{margin:7px 0}.transport194 .tr-scroll{max-width:100%;overflow:auto}.transport194 svg{display:block;min-width:680px;width:100%;height:auto}.transport194 table{display:table;overflow:visible;max-width:none;border-collapse:collapse;width:max-content;min-width:100%;font-variant-numeric:tabular-nums}.transport194 td,.transport194 th{white-space:nowrap;text-align:right;padding:7px;border:1px solid var(--border,#bbb)}.transport194 [hidden]{display:none!important}.transport194 details{margin:12px 0}.transport194 summary{min-height:44px;cursor:pointer}.transport194 .tr-status{border-left:3px solid var(--accent,#a33);padding:8px 12px}.transport194 .tr-correct{color:var(--cl-green,#277540)}.transport194 .tr-wrong{color:var(--cl-red,#a33)}@media(max-width:600px){.transport194 .tr-grid{grid-template-columns:1fr}}';doc.head.append(style);}
 root.append(el('h3',{},'同一个平衡态，怎样同时得到相关、响应和守恒输运？'),el('p',{},'在有限周期环上计算完整协方差与守恒随机动力学。先预测，再比较有噪声、无噪声和不同数值步进的方差。'));
 const presets=el('div',{class:'tr-row','aria-label':'教学预设'});for(const p of PRESETS){const b=el('button',{type:'button','data-preset':p.id},p.label);b.onclick=()=>{c=config(p.parameters);adjustedSites=null;valid=true;sync();reset();};presets.append(b);}root.append(presets);
 const fields={},outs={},grid=el('div',{class:'tr-grid'});




 for(const[key,title]of Object.entries(LABELS).filter(([key])=>Object.hasOwn(LIMITS,key))){const[min,max]=LIMITS[key],label=el('label',{},title),out=el('output'),input=el('input',{type:'range',min,max,step:1,'data-field':key,'aria-label':title});label.append(out,input);grid.append(label);fields[key]=input;outs[key]=out;input.oninput=input.onchange=change;}root.append(grid);
 let adjustedSites=null;
 function change(event){try{const values=Object.fromEntries(Object.entries(fields).map(([k,e])=>[k,e.value===''?NaN:Number(e.value)]));let adjusted=event?.currentTarget?.dataset.field==='sites'&&adjustedSites===values.sites;if(event?.currentTarget?.dataset.field==='sites'&&Number.isInteger(values.sites)&&values.sites>=8&&values.sites<=64&&values.mode>Math.floor(values.sites/2)){values.mode=Math.floor(values.sites/2);adjusted=true;}c=config(values);adjustedSites=adjusted?values.sites:null;valid=true;sync();reset();if(adjusted)status.textContent='N 减小后，m 已调整到新的 Nyquist 上限；请重新预测。';}catch(e){valid=false;reset();status.textContent='请使用范围内整数，且 m 不超过 floor(N/2)。';}}
 const note=el('p'),prediction=el('section',{'aria-label':'先预测'});root.append(note,prediction);prediction.append(el('h4',{},'先预测：零模、噪声、稳定性与静态涨落'),el('p',{},'四题的条件固定写在题干里；参数用来检查例子，不自动改变问题。'));
 const feedbacks=[],buttons=[];QUESTIONS.forEach((q,i)=>{const row=el('div',{class:'tr-pred'});row.append(el('strong',{},q[0]));buttons[i]=[];q[1].forEach((text,j)=>{const b=el('button',{type:'button','data-prediction':i,'data-choice':String(j===0),'aria-pressed':'false'},text);b.onclick=()=>{choices[i]=j;buttons[i].forEach((x,k)=>x.setAttribute('aria-pressed',String(j===k)));if(revealed)showFeedback();};row.append(b);buttons[i].push(b);});feedbacks[i]=el('p',{class:'tr-feedback','data-feedback':i});row.append(feedbacks[i]);prediction.append(row);});
 const check=el('button',{type:'button','data-check':''},'核对预测并显示完整结果'),status=el('p',{class:'tr-status','aria-live':'polite'});root.append(check,status);
 const stage=el('section',{'data-stage':'',hidden:'','aria-label':'实验结果'}),summary=el('p'),plotButtons=el('div',{class:'tr-row'}),plotWrap=el('div',{class:'tr-scroll',tabindex:0,role:'region','aria-label':'图表，可横向滚动'}),plotNote=el('p',{},'格点空间和模式值是离散数据。时间图分别按各自零时刻尺度归一化，不能把相关与响应的原始单位混用。零模的归一化图留空。第六图使用 log10(1+V/S)，只为同时显示极大数值误差；原始方差完整列在表中。'),tableHost=el('div'),download=el('a',{'data-download':'',download:'tr-record.json'},'下载当前完整记录（JSON）');stage.append(summary,plotButtons,plotWrap,plotNote,tableHost,download);root.append(stage);
 function sync(){fields.mode.max=Math.floor(c.sites/2);for(const[k,e]of Object.entries(fields))e.value=c[k];}
 function reset(){if(url){hostWindow.URL.revokeObjectURL(url);url=null;download.removeAttribute('href');}revealed=false;choices={};stage.hidden=true;delete root.__transportSnapshot;for(let i=0;i<4;i++){feedbacks[i].textContent='';for(const b of buttons[i])b.setAttribute('aria-pressed','false');}for(const[k,o]of Object.entries(outs))o.textContent=fmt(c[k]);note.textContent='格距 a=1，能量 E0，时间 t0。r、κ、M、Θ 输入除以100；观察时间除以10；步长除以1000。观察时间只改变局部扰动表，步长只改变数值步进对照；其余图按标明的时间/频率网格计算。';status.textContent='完成四项预测后显示当前结果。';}
 function showFeedback(){let n=0;for(let i=0;i<4;i++){if(!Number.isInteger(choices[i]))continue;const f=feedback(i,choices[i]);n+=+f.correct;feedbacks[i].textContent=f.text;feedbacks[i].className='tr-feedback '+(f.correct?'tr-correct':'tr-wrong');}status.textContent='预测核对：'+n+'/4 正确。图、表和下载均对应当前参数。';}
 function draw(){const ps=plots(current);plotWrap.innerHTML=svg(ps[view]);Array.from(plotButtons.children).forEach((b,i)=>b.setAttribute('aria-pressed',String(i===view)));}
 function render(){current=compute(c);root.__transportSnapshot=current;stage.hidden=false;summary.textContent='选定模式 m='+current.parameters.mode+'：S='+fmt(current.selected.staticVariance)+'，Γ='+fmt(current.selected.rate)+'，ΓΔt='+fmt(current.step.rateStep)+'。Euler 状态：'+current.step.eulerStatus+'；固定总量的零模单独记为 constrained-zero，不属于数值失稳。频窗 |ω|≤10Γ 只收集 '+(current.selected.zeroMode?'0':fmt(2*Math.atan(10)/Math.PI))+' 倍平衡方差。';plotButtons.replaceChildren();plots(current).forEach((p,i)=>{const b=el('button',{type:'button','data-plot':p.key},p.title);b.onclick=()=>{view=i;draw();};plotButtons.append(b);});draw();tableHost.replaceChildren();for(const t of tables(current)){const d=el('details',{'data-table':t.key});d.append(el('summary',{},t.title));d.addEventListener('toggle',()=>{if(!d.open||d.children.length>1)return;const wrap=el('div',{class:'tr-scroll',tabindex:0,role:'region','aria-label':t.title+'，可横向滚动'}),table=el('table'),thead=el('thead'),tr=el('tr'),tbody=el('tbody');for(const h of t.headers)tr.append(el('th',{scope:'col'},h));thead.append(tr);for(const row of t.rows){const r=el('tr');for(const v of row)r.append(el('td',{},fmt(v)));tbody.append(r);}table.append(thead,tbody);wrap.append(table);d.append(wrap);});tableHost.append(d);}if(url)hostWindow.URL.revokeObjectURL(url);url=hostWindow.URL.createObjectURL(new hostWindow.Blob([JSON.stringify(current)],{type:'application/json'}));download.href=url;showFeedback();}
 check.onclick=()=>{if(!valid){status.textContent='请先修正无效参数。';return;}if(![0,1,2,3].every(i=>Number.isInteger(choices[i]))){status.textContent='请先为四个问题各选一个预测。';return;}revealed=true;render();};sync();reset();mounted.set(root,()=>{if(url)hostWindow.URL.revokeObjectURL(url);});
}

function selfTest(){let checks=0;const ok=x=>{checks++;if(!x)throw Error('Transport invariant '+checks);};for(const p of PRESETS){const s=compute(p.parameters);ok(plots(s).length===6);ok(tables(s).length===12);ok(Math.abs(s.model.spatial.reduce((v,r)=>v+r.covariance,0))<1e-9);ok(s.model.modes[0].staticVariance===0);for(const r of s.time){ok(r.correlation>=0);if(r.time<0)ok(r.response===0);else ok(Math.abs(r.varianceCold+r.varianceNoiseOff-r.varianceEquilibrium)<1e-10);}for(const r of s.frequency)ok(Math.abs(r.spectrum-r.fdtSpectrum)<1e-8*Math.max(1,r.spectrum));for(const p of plots(s))for(const t of p.series)for(const q of t.points)if(q)ok(q.every(Number.isFinite));for(let i=0;i<4;i++)ok(feedback(i,QUESTIONS[i][2]).correct);}return{status:'PASS',checks};}
const API={LIMITS,DEFAULT,config,PRESETS,QUESTIONS,compute,snapshot:compute,plots,tables,svg,feedback,fmt,mount,selfTest,model,selectedTime,selectedFrequency,stepping};if(typeof module!=="undefined"&&module.exports)module.exports=API;if(hostWindow&&hostWindow.CourseLearning)hostWindow.CourseLearning.register("physics-correlated-transport",mount);})(typeof window!=="undefined"?window:null);
