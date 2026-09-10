(function(root,factory){
"use strict";var api=factory();
if(typeof module==="object"&&module.exports)module.exports=api;
if(root&&root.CourseLearning)root.CourseLearning.register("accretion-eddington",api.mount);
if(typeof module==="object"&&module.exports&&typeof require==="function"&&require.main===module)console.log(JSON.stringify(api.selfTest()));
})(typeof window!=="undefined"?window:null,function(){
"use strict";
var CONSTANTS=Object.freeze({G:6.67430e-11,C:299792458,M_P:1.67262192369e-27,SIGMA_T:6.6524587321e-29,SIGMA_SB:2*Math.pow(Math.PI,5)*Math.pow(1.380649e-23,4)/(15*Math.pow(6.62607015e-34,3)*299792458*299792458),M_SUN:1.98847e30,H_PLANCK:6.62607015e-34,K_B:1.380649e-23,YEAR:31557600});
var EFFICIENCIES=Object.freeze({
  disk:{label:"Newton 零力矩薄盘",note:"η=1/(2x_in)，与本页 Newton 通量积分一致"},
  surface:{label:"Newton 表面势能估计",note:"η≈1/(R/r_g)，有表面且弱场；不等于仅盘辐射"},
  schwarzschild:{label:"Schwarzschild ISCO",eta:1-Math.sqrt(8/9),note:"GR 理想薄盘的轨道绑定能，不是 Newton 通量积分"},
  extreme:{label:"极端顺行 Kerr（理想）",eta:1-1/Math.sqrt(3),note:"理想极端 test-particle 效率；不是含俘获的稳态自旋值"},
  thorne:{label:"辐射俘获自旋上限附近",eta:.30,note:"约 a*=0.998 的效率量级，具体值依辐射模型"}
});
var MODES=Object.freeze({disk:"盘：能量、温度与谱",mri:"局域 MRI 条件",jet:"喷流几何"});
var DEFAULTS=Object.freeze({mode:"disk",massSolar:10,lambda:.5,efficiencyId:"disk",surfaceRadiusRg:100,xIn:6,outerRatio:1000,sampleRatio:5/3,alpha:.01,aspect:.05,hydrogen:1,q:1,beta:.99,angle:5});
var INSTANCE=0;
function finite(x,lo,hi,integer,name){if(typeof x!=="number"||!Number.isFinite(x)||x<lo||x>hi||(integer&&!Number.isInteger(x)))throw RangeError(name+" must be "+(integer?"an integer ":"")+"in ["+lo+", "+hi+"]");return x;}
function config(o){if(!o||typeof o!=="object"||Array.isArray(o))throw TypeError("configuration required");var c=Object.assign({},DEFAULTS,o);
if(typeof c.mode!=="string"||!Object.hasOwn(MODES,c.mode))throw RangeError("unknown mode");
if(typeof c.efficiencyId!=="string"||!Object.hasOwn(EFFICIENCIES,c.efficiencyId))throw RangeError("unknown efficiency");
finite(c.massSolar,1,1e10,false,"massSolar");finite(c.lambda,0,3,false,"lambda");if(c.lambda>0&&c.lambda<1e-12)throw RangeError("lambda must be zero or at least 1e-12");finite(c.surfaceRadiusRg,2,1e6,false,"surfaceRadiusRg");finite(c.xIn,3,1000,false,"xIn");finite(c.outerRatio,2,1e5,false,"outerRatio");finite(c.sampleRatio,1,c.outerRatio,false,"sampleRatio");finite(c.alpha,.001,1,false,"alpha");finite(c.aspect,.001,.5,false,"aspect");finite(c.hydrogen,0,1,false,"hydrogen");finite(c.q,0,3,false,"q");finite(c.beta,0,.999999,false,"beta");finite(c.angle,0,180,false,"angle");return c;}
function sum(xs){var s=0,c=0;xs.forEach(function(x){var y=x-c,t=s+y;c=(t-s)-y;s=t;});return s;}
function opacity(hydrogen){finite(hydrogen,0,1,false,"hydrogen");return CONSTANTS.SIGMA_T/CONSTANTS.M_P*(1+hydrogen)/2;}
function eddingtonLuminosity(massSolar,hydrogen){finite(massSolar,1,1e10,false,"massSolar");if(hydrogen===undefined)hydrogen=1;return 4*Math.PI*CONSTANTS.G*CONSTANTS.M_SUN*massSolar*CONSTANTS.C/opacity(hydrogen);}
function gravitationalRadius(massSolar){finite(massSolar,1,1e10,false,"massSolar");return CONSTANTS.G*CONSTANTS.M_SUN*massSolar/(CONSTANTS.C*CONSTANTS.C);}
function efficiency(id,surfaceRadiusRg,xIn){
if(typeof id!=="string"||!Object.hasOwn(EFFICIENCIES,id))throw RangeError("unknown efficiency");
if(id==="surface"){finite(surfaceRadiusRg,2,1e6,false,"surfaceRadiusRg");return 1/surfaceRadiusRg;}
if(id==="disk"){finite(xIn,3,1000,false,"xIn");return 1/(2*xIn);}return EFFICIENCIES[id].eta;
}
function massRateFromLuminosity(L,eta){finite(L,0,1e50,false,"luminosity");finite(eta,1e-8,1,false,"eta");return L/(eta*CONSTANTS.C*CONSTANTS.C);}
function massRateSolarYear(L,eta){return massRateFromLuminosity(L,eta)*CONSTANTS.YEAR/CONSTANTS.M_SUN;}
function innerBoundaryFactor(x,xIn){finite(xIn,3,1000,false,"xIn");finite(x,xIn,1e8,false,"x");return-Math.expm1(-.5*Math.log1p((x-xIn)/xIn));}
function shape(y){finite(y,1,1e5,false,"radius ratio");var f=-Math.expm1(-.5*Math.log1p(y-1));return{factor:f,temperature:Math.pow(y,-.75)*Math.pow(f,.25),asymptote:Math.pow(y,-.75),cumulative:f*f*(3-2*f),powerPerLog:3*f/y};}
function thinDiskFlux(massSolar,mdot,x,xIn){finite(mdot,0,1e33,false,"mdot");var rg=gravitationalRadius(massSolar),r=x*rg,f=innerBoundaryFactor(x,xIn);return 3*CONSTANTS.G*(massSolar*CONSTANTS.M_SUN)*mdot/(8*Math.PI*r*r*r)*f;}
function thinDiskTemperature(massSolar,mdot,x,xIn){return Math.pow(thinDiskFlux(massSolar,mdot,x,xIn)/CONSTANTS.SIGMA_SB,.25);}
function timescales(massSolar,x,alpha,aspect){
finite(x,3,1e8,false,"x");finite(alpha,.001,1,false,"alpha");finite(aspect,.001,.5,false,"aspect");
var tdyn=gravitationalRadius(massSolar)/CONSTANTS.C*Math.pow(x,1.5);
return{dynamical:tdyn,orbital:2*Math.PI*tdyn,thermal:tdyn/alpha,viscous:tdyn/(alpha*aspect*aspect)};
}
function disk(c){
var rg=gravitationalRadius(c.massSolar),Ledd=eddingtonLuminosity(c.massSolar,c.hydrogen),L=c.lambda*Ledd,eta=efficiency(c.efficiencyId,c.surfaceRadiusRg,c.xIn),mdot=massRateFromLuminosity(L,eta),rin=c.xIn*rg,etaN=1/(2*c.xIn),LN=mdot*CONSTANTS.C*CONSTANTS.C*etaN;
var tstar=Math.pow(3*CONSTANTS.G*c.massSolar*CONSTANTS.M_SUN*mdot/(8*Math.PI*CONSTANTS.SIGMA_SB*rin*rin*rin),.25),sample=shape(c.sampleRatio),outer=shape(c.outerRatio),scale=timescales(c.massSolar,c.xIn*c.sampleRatio,c.alpha,c.aspect);
return{rG:rg,opacity:opacity(c.hydrogen),Ledd:Ledd,luminosity:L,eta:eta,mdot:mdot,mdotSolarYear:mdot*CONSTANTS.YEAR/CONSTANTS.M_SUN,etaNewtonian:etaN,newtonianLuminosity:LN,newtonianObservedRatio:L===0?null:etaN/eta,outerLuminosity:LN*outer.cumulative,outerFraction:outer.cumulative,temperatureScale:tstar,peakRatio:49/36,peakTemperature:tstar*shape(49/36).temperature,sample:{x:c.xIn*c.sampleRatio,radius:rin*c.sampleRatio,factor:sample.factor,flux:thinDiskFlux(c.massSolar,mdot,c.xIn*c.sampleRatio,c.xIn),temperature:tstar*sample.temperature,asymptoticTemperature:tstar*sample.asymptote,cumulative:sample.cumulative,powerPerLog:sample.powerPerLog,times:scale},energyConsistent:c.efficiencyId==="disk"};
}
function radialRows(c,d){
var ys=[];for(var i=0;i<=200;i++)ys.push(i===0?1:i===200?c.outerRatio:Math.exp(Math.log(c.outerRatio)*i/200));
[49/36,9/4,c.sampleRatio].forEach(function(y){if(y<=c.outerRatio)ys.push(y);});ys=Array.from(new Set(ys)).sort(function(a,b){return a-b;});
return ys.map(function(y){var s=shape(y),x=c.xIn*y;return{y:y,x:x,radius:x*d.rG,factor:s.factor,theta:s.temperature,farTheta:s.asymptote,temperature:d.temperatureScale*s.temperature,asymptoticTemperature:d.temperatureScale*s.asymptote,flux:thinDiskFlux(c.massSolar,d.mdot,x,c.xIn),cumulative:s.cumulative,powerPerLog:s.powerPerLog,luminosityWithin:d.newtonianLuminosity*s.cumulative,times:timescales(c.massSolar,x,c.alpha,c.aspect)};});
}
function spectralQuadrature(outerRatio,steps){
finite(outerRatio,2,1e5,false,"outerRatio");finite(steps,40,3200,true,"quadrature steps");if(steps%2)throw RangeError("even quadrature steps required");
var tmax=Math.pow(Math.log(outerRatio),.25),dt=tmax/steps;
return Array.from({length:steps+1},function(_,i){var t=i*dt,z=Math.pow(t,4),y=Math.exp(z),theta=i===0?0:Math.exp(-.75*z)*Math.pow(-Math.expm1(-.5*z),.25);
return{i:i,t:t,y:y,theta:theta,weight:dt/3*(i===0||i===steps?1:i%2?4:2),jacobian:4*t*t*t*Math.exp(2*z)};});
}
function spectrumAt(u,grid){
finite(u,1e-8,100,false,"dimensionless frequency");
var values=grid.map(function(r){if(r.theta===0)return 0;var a=u/r.theta,occupation=a>50?Math.exp(-a)/(1-Math.exp(-a)):1/Math.expm1(a);return r.weight*r.jacobian*occupation;});
var integral=sum(values),density=45/Math.pow(Math.PI,4)*Math.pow(u,3)*integral;
return{u:u,integral:integral,density:density,perLog:u*density};
}
function spectrumRows(c,d,steps){
var grid=spectralQuadrature(c.outerRatio,steps===undefined?800:steps),rows=[];
for(var i=0;i<=160;i++){var u=Math.exp(Math.log(1e-5)+Math.log(30/1e-5)*i/160),s=spectrumAt(u,grid),frequency=d.temperatureScale===0?null:CONSTANTS.K_B*d.temperatureScale/CONSTANTS.H_PLANCK*u;
rows.push({i:i,u:u,density:s.density,perLog:s.perLog,frequency:frequency,luminosityDensity:frequency===null?0:d.newtonianLuminosity*s.perLog/frequency,luminosityPerLog:d.newtonianLuminosity*s.perLog});}
var dl=Math.log(30/1e-5)/160,integrated=sum(rows.map(function(r,i){return r.perLog*(i===0||i===160?1:i%2?4:2);}))*dl/3;
return{rows:rows,grid:grid,integrated:integrated,closureResidual:integrated-d.outerFraction};
}
function mri(q){
finite(q,0,3,false,"q");var q2=q*q,A=1+2*q2,D=Math.sqrt(1+16*q2),minus=q2===0?0:2*q2*(q2-3)/(A+D),plus=(A+D)/2;
var unstable=q>0&&q2<3;
return{q:q,omegaMinusSquared:minus,omegaPlusSquared:plus,growth:unstable?q*Math.sqrt(2*(3-q2)/(A+D)):0,unstable:unstable};
}
function jet(beta,angle){
finite(beta,0,.999999,false,"beta");finite(angle,0,180,false,"angle");var theta=angle*Math.PI/180,den=1-beta+2*beta*Math.pow(Math.sin(theta/2),2),gamma=1/Math.sqrt((1-beta)*(1+beta)),sin=angle===0||angle===180?0:Math.sin(theta),apparent=beta*sin/den;
return{beta:beta,angle:angle,gamma:gamma,doppler:1/(gamma*den),arrivalFactor:den,apparent:apparent,minimumGammaFromApparent:Math.sqrt(1+apparent*apparent),maximumApparent:gamma*beta,maximumAngle:Math.acos(beta)*180/Math.PI};
}
function evaluate(o){var c=config(o);return{config:c,disk:disk(c),mri:mri(c.q),jet:jet(c.beta,c.angle)};}
function snapshot(o){var r=evaluate(o),c=r.config;
if(c.mode==="disk"){r.radial=radialRows(c,r.disk);r.spectrum=spectrumRows(c,r.disk);}
if(c.mode==="mri"){var qs=Array.from({length:241},function(_,i){return i/80;}).concat([c.q,Math.sqrt(15)/4,Math.sqrt(3)]);r.rows=Array.from(new Set(qs)).sort(function(a,b){return a-b;}).map(mri);}
if(c.mode==="jet"){var angles=Array.from({length:181},function(_,i){return i;}).concat([c.angle,r.jet.maximumAngle]);r.rows=Array.from(new Set(angles)).sort(function(a,b){return a-b;}).map(function(a){return jet(c.beta,a);});}
return r;}
function selfTest(){var checks=0;function check(x){checks++;if(!x)throw Error("self "+checks);}
var d=disk(config({}));check(d.eta===1/12);check(d.newtonianObservedRatio===1);check(shape(1).temperature===0);check(shape(4).cumulative===.5);check(mri(0).growth===0);check(Math.abs(mri(Math.sqrt(15)/4).growth-.75)<1e-14);check(jet(.9,0).apparent===0);check(jet(.9,180).apparent===0);check(Math.abs(jet(.9,Math.acos(.9)*180/Math.PI).apparent-.9/Math.sqrt(.19))<1e-13);return{status:"PASS",checks:checks};}
function fmt(x){if(x===null)return"未定义";if(x===0)return"0";if(!Number.isFinite(x))throw Error("nonfinite display");if(Math.abs(x)<.0001||Math.abs(x)>=100000)return x.toExponential(4);return String(Number(x.toPrecision(5)));}
function ledgers(s){
var d=s.disk,c=s.config,list=[],summary;
if(c.mode==="disk"){
summary=[["输入效率模型",EFFICIENCIES[c.efficiencyId].label,EFFICIENCIES[c.efficiencyId].note],["κ / m² kg⁻¹",d.opacity,"完全电离 H/He；X="+fmt(c.hydrogen)],["r_g / m",d.rG,"GM/c²"],["L_Edd / W",d.Ledd,"4πGMc/κ"],["输入 L / W",d.luminosity,"λ L_Edd"],["所选 η",d.eta,"用于反推质量流率"],["Ṁ / kg s⁻¹",d.mdot,"L/(ηc²)"],["Ṁ / M☉ yr⁻¹",d.mdotSolarYear,"1 yr = 31557600 s"],["Newton 全盘 η",d.etaNewtonian,"1/(2x_in)"],["Newton 全盘 L_N / W",d.newtonianLuminosity,"双面通量积分到无穷远"],["L_N / 输入 L",d.newtonianObservedRatio,d.luminosity===0?"零流率时是 0/0；没有定义":d.energyConsistent?"同一 Newton 模型内一致":"检查不同效率与 Newton 通量的模型差额"],["有限盘 L / W",d.outerLuminosity,"只积分到所设外半径"],["有限盘光度比例",d.outerFraction,"1−3/Y+2/Y^(3/2)"],["谱的 d ln u 积分",s.spectrum.integrated,"161 个频率点的 Simpson 求和"],["谱积分减解析比例",s.spectrum.closureResidual,"有限频段及双重积分误差；不是物理能量损失"],["T* / K",d.temperatureScale,"两条温度曲线共用的温标"],["最高 T_eff / K",d.peakTemperature,"y=49/36"],["模型适用性","仍需另外判断","λ≤1 或所设 H/r 小都不足以认证真实薄盘"]];
list.push({key:"sample",title:"所选半径的局部量",headers:["项目","值","单位 / 约定"],rows:[["r/r_g",d.sample.x,"无量纲"],["r",d.sample.radius,"m"],["边界因子",d.sample.factor,"1−y^(−1/2)"],["单面 F",d.sample.flux,"W m⁻²"],["T_eff",d.sample.temperature,"K"],["远处渐近 T",d.sample.asymptoticTemperature,"K；内缘附近不适用"],["内侧累计比例",d.sample.cumulative,"相对 L_N"],["dL/d ln r / L_N",d.sample.powerPerLog,"单位对数半径"],["动力学时标",d.sample.times.dynamical,"s；1/Ω"],["轨道周期",d.sample.times.orbital,"s；2π/Ω"],["热时标估计",d.sample.times.thermal,"s；1/(αΩ)"],["黏性时标估计",d.sample.times.viscous,"s；1/(α(H/r)²Ω)"]],detail:true});
list.push({key:"radial",title:"全部径向节点：面积、温度与辐射",headers:["y=r/r_in","r/r_g","r / m","边界因子","θ=T/T*","远处 θ","T / K","远处 T / K","单面 F / W m⁻²","累计 L/L_N","dL/d ln r / L_N","累计 L / W"],rows:s.radial.map(function(r){return[r.y,r.x,r.radius,r.factor,r.theta,r.farTheta,r.temperature,r.asymptoticTemperature,r.flux,r.cumulative,r.powerPerLog,r.luminosityWithin];}),detail:true});
list.push({key:"times",title:"全部径向节点的四个时标",headers:["y","r/r_g","t_dyn / s","P_orb / s","t_th / s","t_visc / s"],rows:s.radial.map(function(r){return[r.y,r.x,r.times.dynamical,r.times.orbital,r.times.thermal,r.times.viscous];}),detail:true});
list.push({key:"spectrum",title:"全部频率：实际 Planck 环带积分",headers:["i","u=hν/(k_B T*)","Sν=(ν*/L_N)Lν","u Sν","ν / Hz","Lν / W Hz⁻¹","ν Lν / W"],rows:s.spectrum.rows.map(function(r){return[r.i,r.u,r.density,r.perLog,r.frequency,r.luminosityDensity,r.luminosityPerLog];}),detail:true});
list.push({key:"quadrature",title:"全部径向积分节点与权重",headers:["i","t=(ln y)^(1/4)","y","θ","Simpson 权重 w","Jacobian J=4t³e^(2t⁴)"],rows:s.spectrum.grid.map(function(r){return[r.i,r.t,r.y,r.theta,r.weight,r.jacobian];}),detail:true});
}else if(c.mode==="mri"){
var m=s.mri;summary=[["q=kv_A/Ω",m.q,"理想、局域、不可压、竖直波数及背景场"],["ω₋²/Ω²",m.omegaMinusSquared,"负值对应指数增长"],["ω₊²/Ω²",m.omegaPlusSquared,"另一支平方频率"],["γ/Ω",m.growth,m.unstable?"当前浮点 q 对应增长支":"当前 q 无严格指数增长"],["严格不稳定区间","0 < q < √3","端点中性；输入的小数是有限精度近似"],["最快 q",Math.sqrt(15)/4,"Kepler 盘，给 γ/Ω=3/4"],["湍流 α","不能由这里推出","线性结果不决定非线性饱和"]];
list.push({key:"mri",title:"全部局域波数及两支频率",headers:["q","ω₋²/Ω²","ω₊²/Ω²","γ/Ω","当前有限 q 的增长判据"],rows:s.rows.map(function(r){return[r.q,r.omegaMinusSquared,r.omegaPlusSquared,r.growth,r.unstable?"增长":"无严格增长"];}),detail:true});
}else{
var j=s.jet;summary=[["物质速度 β",j.beta,"严格小于 1"],["夹角 θ / deg",j.angle,"0° 为朝向观察者"],["Γ",j.gamma,"1/√(1−β²)"],["到达时差 / 发射时差",j.arrivalFactor,"1−β cosθ；未加宇宙学时间膨胀"],["视横向速度 β_app",j.apparent,"不等于物质速度"],["Doppler 因子 δ",j.doppler,"1/[Γ(1−β cosθ)]"],["仅由当前 β_app 推出的 Γ 下界",j.minimumGammaFromApparent,"不能唯一反推 β、θ"],["固定 β 的最大 β_app",j.maximumApparent,"Γβ"],["取最大值的 θ / deg",j.maximumAngle,"arccos β；β=0 时所有方向均为零"],["辐射增亮","还需发射区与频谱模型","不使用一个通用 δ 指数"]];
list.push({key:"jet",title:"全部视角的光行时与视速度",headers:["θ / deg","Γ","1−β cosθ","β_app","δ","Γ 下界"],rows:s.rows.map(function(r){return[r.angle,r.gamma,r.arrivalFactor,r.apparent,r.doppler,r.minimumGammaFromApparent];}),detail:true});
}
list.unshift({key:"summary",title:MODES[c.mode]+"：计算与适用范围",headers:["项目","数值 / 结论","定义与限制"],rows:summary,detail:false});return list;
}
function plots(s){
var colors=["#3979b8","#b16b18"],out=[];
function make(key,title,xlabel,xs,series,ymin,ymax){out.push({key:key,title:title,xlabel:xlabel,xs:xs,series:series.map(function(a,i){return{key:a[0],label:a[1],values:a[2],color:colors[i],dash:i?"7 4":""};}),xmin:xs[0],xmax:xs[xs.length-1],ymin:ymin,ymax:ymax});}
if(s.config.mode==="disk"){
var r=s.radial,xs=r.map(function(r){return Math.log10(r.y);});
make("temperature","同一个 T*：温度剖面与远处渐近式","横轴 log₁₀(r/r_in)；纵轴 T/T*",xs,[["temperature","θ = y⁻³ᐟ⁴(1−y⁻¹ᐟ²)¹ᐟ⁴",r.map(function(r){return r.theta;})],["far","远处 θ = y⁻³ᐟ⁴",r.map(function(r){return r.farTheta;})]],0,1.05);
make("energy","累计双面辐射与每个对数环带的贡献","横轴 log₁₀(r/r_in)；纵轴相对 L_N",xs,[["cumulative","L(<r)/L_N",r.map(function(r){return r.cumulative;})],["power","(dL/d ln r)/L_N",r.map(function(r){return r.powerPerLog;})]],0,1.05);
var f=s.spectrum.rows,logs=f.map(function(r){return Math.log10(r.density);}),lo=Math.floor(Math.min.apply(null,logs)),hi=Math.ceil(Math.max.apply(null,logs));
make("spectrum","多色黑体：每个点都是环带 Planck 积分","横轴 log₁₀ u；纵轴 log₁₀ Sν",f.map(function(r){return Math.log10(r.u);}),[["spectrum","Sν=(ν*/L_N)Lν；ν*=k_B T*/h",logs]],lo,hi===lo?lo+1:hi);
}else if(s.config.mode==="mri"){
var rs=s.rows,qs=rs.map(function(r){return r.q;});
make("roots","MRI 两支平方频率：低支穿过零","横轴 q=kv_A/Ω；纵轴 ω²/Ω²",qs,[["minus","ω₋²/Ω²",rs.map(function(r){return r.omegaMinusSquared;})],["plus","ω₊²/Ω²",rs.map(function(r){return r.omegaPlusSquared;})]],-1,16);
make("growth","MRI 线性增长率；两个端点中性","横轴 q=kv_A/Ω；纵轴 γ/Ω",qs,[["growth","γ/Ω = √(−ω₋²/Ω²)，仅负支时",rs.map(function(r){return r.growth;})]],0,.8);
}else{
var js=s.rows,as=js.map(function(r){return r.angle;});
make("apparent","视横向速度：峰值不在正对观察者方向","横轴 θ / deg；纵轴 β_app",as,[["apparent","β sinθ/(1−β cosθ)",js.map(function(r){return r.apparent;})]],0,s.jet.maximumApparent===0?1:s.jet.maximumApparent*1.08);
make("doppler","Doppler 因子：频率变换，不等于增亮指数","横轴 θ / deg；纵轴 δ",as,[["doppler","1/[Γ(1−β cosθ)]",js.map(function(r){return r.doppler;})]],0,js[0].doppler*1.08);
}
return out;
}
function drawPlot(doc,d,id){
var ns="http://www.w3.org/2000/svg";function el(tag,attrs,text){var e=doc.createElementNS(ns,tag);Object.keys(attrs||{}).forEach(function(k){e.setAttribute(k,String(attrs[k]));});if(text!==undefined)e.textContent=text;return e;}
var svg=el("svg",{class:"ae-chart",viewBox:"0 0 900 390",role:"img","data-plot":d.key,"aria-labelledby":id+"-title "+id+"-desc"}),x=function(v){return 120+740*(v-d.xmin)/(d.xmax-d.xmin);},y=function(v){return 290-230*(v-d.ymin)/(d.ymax-d.ymin);};
svg.append(el("title",{id:id+"-title"},d.title),el("desc",{id:id+"-desc"},"全部数值节点与图旁表格一致。对数轴已经明示；点的大小不代表贡献，线段只连接节点。"),el("text",{x:120,y:28,"font-size":18},d.title));
for(var i=0;i<=4;i++){var v=d.ymin+(d.ymax-d.ymin)*i/4,xx=d.xmin+(d.xmax-d.xmin)*i/4;svg.append(el("line",{x1:120,x2:860,y1:y(v),y2:y(v),stroke:"currentColor",opacity:.18}),el("text",{x:108,y:y(v)+5,"text-anchor":"end","font-size":13},fmt(v)),el("text",{x:x(xx),y:320,"text-anchor":i===0?"start":i===4?"end":"middle","font-size":13},fmt(xx)));}
if(d.ymin<0&&d.ymax>0)svg.append(el("line",{x1:120,x2:860,y1:y(0),y2:y(0),stroke:"currentColor","stroke-dasharray":"3 3"}));
svg.append(el("text",{x:860,y:355,"text-anchor":"end","font-size":15},d.xlabel));
d.series.forEach(function(r){svg.append(el("polyline",{"data-series":r.key,points:r.values.map(function(v,i){return x(d.xs[i])+","+y(v);}).join(" "),fill:"none",stroke:r.color,"stroke-width":2,"stroke-dasharray":r.dash}));r.values.forEach(function(v,i){svg.append(el("circle",{"data-series":r.key,"data-index":i,cx:x(d.xs[i]),cy:y(v),r:1.7,fill:r.color}));});});return svg;
}
function inject(doc){if(doc.getElementById("ae-full-style"))return;var style=doc.createElement("style");style.id="ae-full-style";style.textContent=[
".ae-lab{color:var(--fg);max-width:100%;min-width:0;line-height:1.65}.ae-lab *{box-sizing:border-box}.ae-lab [hidden]{display:none!important}.ae-lab button,.ae-lab input,.ae-lab select{font:inherit;max-width:100%;color:var(--fg);background:var(--bg);border:1px solid var(--border);border-radius:6px;min-height:44px;padding:8px}.ae-lab button{cursor:pointer}.ae-lab button[aria-pressed=true]{background:var(--accent);color:var(--bg)}.ae-lab button:disabled{opacity:.55;cursor:default}.ae-lab :focus-visible{outline:3px solid var(--accent);outline-offset:2px}",
".ae-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:15px 0}.ae-controls label,.ae-mode{display:grid;gap:5px}.ae-lab fieldset{min-width:0;margin:12px 0;padding:12px;border:1px solid var(--border)}.ae-choices,.ae-actions{display:flex;gap:8px;flex-wrap:wrap}.ae-choices>*{flex:1 1 180px}.ae-note{padding:10px 12px;border-left:3px solid var(--accent)}.ae-feedback{min-height:2em}",
".ae-results h4{margin-top:24px}.ae-results figure{margin:15px 0}.ae-region{max-width:100%;overflow-x:auto;margin:12px 0}.ae-lab svg.ae-chart{display:block;width:900px!important;min-width:900px;max-width:none!important;height:auto;color:var(--fg)}.ae-chart text{fill:currentColor;font-family:inherit;letter-spacing:0}.ae-legend{display:flex;gap:15px;flex-wrap:wrap;font-size:13px}.ae-legend span{display:inline-flex;align-items:center;gap:5px}.ae-legend i{width:24px;border-top:3px solid}.ae-lab table{border-collapse:collapse;min-width:900px;font-size:13px}.ae-lab th,.ae-lab td{padding:8px;border:1px solid var(--border);white-space:nowrap;text-align:left}.ae-lab caption{padding:8px;font-weight:bold}.ae-lab details{margin:16px 0}.ae-lab summary{cursor:pointer;min-height:44px;padding:8px}@media(max-width:600px){.ae-controls{grid-template-columns:minmax(0,1fr)}}"
].join("\n");doc.head.append(style);}
function mount(container){
if(!container||container.getAttribute("data-ae-mounted")==="true")return;container.setAttribute("data-ae-mounted","true");
var doc=container.ownerDocument;inject(doc);var id="ae-full-"+(++INSTANCE),selected=[null,null,null,null,null],c=Object.assign({},DEFAULTS);
function input(key,label,min,max){return'<label>'+label+'<input type="number" data-key="'+key+'" min="'+min+'" max="'+max+'" step="any" value="'+DEFAULTS[key]+'"></label>';}
container.innerHTML='<div class="ae-lab"><h3>从守恒账读吸积、MRI 与喷流</h3><label class="ae-mode">实验场景<select data-key="mode">'+Object.keys(MODES).map(function(k){return'<option value="'+k+'">'+MODES[k]+'</option>';}).join("")+'</select></label><details data-controls="disk" open><summary>盘模型参数（仅盘场景使用）</summary><div class="ae-controls">'+input("massSolar","中心质量 M / M☉（1–10¹⁰）",1,1e10)+input("lambda","λ=L/L_Edd（0 或 10⁻¹²–3）",0,3)+'<label>反推流率所用效率<select data-key="efficiencyId">'+Object.keys(EFFICIENCIES).map(function(k){return'<option value="'+k+'">'+EFFICIENCIES[k].label+'</option>';}).join("")+'</select></label>'+input("surfaceRadiusRg","表面 R/r_g（仅表面效率使用；弱场才可靠）",2,1e6)+input("xIn","内缘 x_in=r_in/r_g（3–1000）",3,1000)+input("outerRatio","外半径 Y=r_out/r_in（2–10⁵）",2,1e5)+input("sampleRatio","取样 y=r/r_in（1–Y）",1,1e5)+input("hydrogen","完全电离 H/He 的氢质量分数 X（0–1）",0,1)+input("alpha","输运参数 α（0.001–1）",.001,1)+input("aspect","厚度参数 H/r（0.001–0.5）",.001,.5)+'</div></details><details data-controls="mri"><summary>MRI 参数（仅 MRI 场景使用）</summary><div class="ae-controls">'+input("q","局域 q=kv_A/Ω（0–3）",0,3)+'</div></details><details data-controls="jet"><summary>喷流参数（仅喷流场景使用）</summary><div class="ae-controls">'+input("beta","物质速度 β=v/c（0–0.999999）",0,.999999)+input("angle","视线夹角 θ / deg（0–180）",0,180)+'</div></details><p class="ae-note">输入范围是实验边界，不代表模型在全范围都适用于真实天体。所有参数需合法；有错的参数组会自动展开。</p>'+
[["1. 零力矩内缘的局部 F？",["0","无穷大"]],["2. 远处温度幂律？",["r⁻³ᐟ⁴","r⁻³"]],["3. 固定 L，η 从 0.06 到 0.30，Ṁ？",["变为 5 倍","变为 1/5"]],["4. 黏性时标如何缩放？",["1/[α(H/r)²Ω]","α(H/r)²/Ω"]],["5. x_in=6 的 Newton 盘积分效率？",["1/12","0.05719"]]].map(function(q,i){return'<fieldset data-question="'+i+'"><legend>'+q[0]+'</legend><div class="ae-choices">'+q[1].map(function(a,j){return'<button type="button" data-choice="'+j+'" aria-pressed="false">'+a+'</button>';}).join("")+'</div></fieldset>';}).join("")+
'<div class="ae-actions"><button type="button" data-action="submit" disabled>核对五项预测并揭示结果</button><button type="button" data-action="reset">重置实验</button></div><p class="ae-feedback" role="status" aria-live="polite"></p><div class="ae-results" hidden><h4 tabindex="-1">计算结果与适用条件</h4><div data-content></div></div></div>';
var lab=container.querySelector(".ae-lab"),results=lab.querySelector(".ae-results"),submit=lab.querySelector('[data-action="submit"]'),feedback=lab.querySelector(".ae-feedback"),content=lab.querySelector("[data-content]");
function read(){var o={},bad=null;lab.querySelectorAll("[data-key]").forEach(function(e){var k=e.getAttribute("data-key");if(e.tagName==="SELECT")o[k]=e.value;else{if(e.value.trim()===""||!e.validity.valid){bad=bad||e;}o[k]=Number(e.value);}});if(bad){bad.closest("details").open=true;throw Error(bad.parentElement.firstChild.textContent+"：保留输入，请修正");}if(o.sampleRatio>o.outerRatio){lab.querySelector('[data-controls="disk"]').open=true;throw Error("取样半径 y 不能超过外半径 Y");}if(o.lambda>0&&o.lambda<1e-12){lab.querySelector('[data-controls="disk"]').open=true;throw Error("λ 的非零值须至少为 10⁻¹²；也可明确取 0");}return config(o);}
function note(text){var p=doc.createElement("p");p.className="ae-note";p.textContent=text;content.append(p);}
function region(title){var r=doc.createElement("div");r.className="ae-region";r.setAttribute("role","region");r.tabIndex=0;r.setAttribute("aria-label",title+"，可左右滚动");return r;}
function table(d){var r=region(d.title),t=doc.createElement("table"),caption=doc.createElement("caption"),head=doc.createElement("thead"),tr=doc.createElement("tr"),body=doc.createElement("tbody");t.setAttribute("data-table",d.key);caption.textContent=d.title;t.append(caption);d.headers.forEach(function(x){var th=doc.createElement("th");th.scope="col";th.textContent=x;tr.append(th);});head.append(tr);t.append(head);d.rows.forEach(function(row){var tr=doc.createElement("tr");row.forEach(function(x){var td=doc.createElement("td");td.textContent=typeof x==="number"||x===null?fmt(x):x;tr.append(td);});body.append(tr);});t.append(body);r.append(t);if(d.detail){var details=doc.createElement("details"),summary=doc.createElement("summary");summary.textContent="展开 "+d.rows.length+" 行："+d.title;details.append(summary,r);content.append(details);}else content.append(r);}
function render(){var s=snapshot(c),tables=ledgers(s);content.replaceChildren();table(tables[0]);
if(c.mode==="disk"){note("谱用 800 段、801 个径向节点做 Simpson 积分，保留全部 161 个频率与径向权重。显示约 5 位有效数字；有限网格误差另见能量残差。径向表与积分表采用不同网格，分别完整列出。");note("Sν=(ν*/L_N)Lν，ν*=k_B T*/h。两个对数图的轴已作 log₁₀ 变换；谱图中的中频斜率约 1/3 只在条件满足的频段适用。");if(c.lambda===0)note("当前 Ṁ=0：真实温度和全部物理光度为零，ν* 与 L_N 也为零。图中的 θ、累计比例和 Sν 只显示非零流率族的无量纲极限形状；不把这些 0/0 比值当成当前物理值，频率列标为未定义。");}
if(c.mode==="mri")note("严格边界是数学上的 q=0 与 q=√3。把 √3 输入为有限小数可能落在边界某一侧并留下极小增长率；不要从舍入后的 q 显示值判断符号。极小 q 的平方频率可能下溢为零，增长率另用稳定式计算。这里只检验理想局域线性模型。");
if(c.mode==="jet")note("曲线含 0–180° 的每个整数角、当前角及解析峰角；相连直线只帮助读节点，不是连续曲线的误差保证。高 Γ 时峰很窄；到达时差与 Doppler 因子仍可在全部表格中核对。");
plots(s).forEach(function(d,i){var figure=doc.createElement("figure"),r=region(d.title),caption=doc.createElement("figcaption");r.append(drawPlot(doc,d,id+"-"+i));caption.className="ae-legend";d.series.forEach(function(s){var span=doc.createElement("span"),line=doc.createElement("i");line.style.borderColor=s.color;if(s.dash)line.style.borderTopStyle="dashed";span.append(line,doc.createTextNode(s.label));caption.append(span);});figure.append(r,caption);content.append(figure);});tables.slice(1).forEach(table);results.hidden=false;}
function complete(){return selected.every(function(x){return x!==null;});}
function state(){var ok=true;try{c=read();}catch(e){ok=false;results.hidden=true;feedback.textContent="输入无效："+e.message;}submit.disabled=!ok||!complete()||!results.hidden;return ok;}
lab.querySelectorAll("[data-choice]").forEach(function(b){b.addEventListener("click",function(){var f=b.closest("[data-question]"),i=Number(f.getAttribute("data-question"));selected[i]=Number(b.getAttribute("data-choice"));f.querySelectorAll("[data-choice]").forEach(function(x){x.setAttribute("aria-pressed",x===b?"true":"false");});results.hidden=true;if(state())feedback.textContent=complete()?"五项已填，请点击核对。":"请完成五项预测。";});});
lab.querySelectorAll("[data-key]").forEach(function(e){e.addEventListener(e.tagName==="SELECT"?"change":"input",function(){var visible=!results.hidden;if(e.getAttribute("data-key")==="mode")lab.querySelectorAll("[data-controls]").forEach(function(d){d.open=d.getAttribute("data-controls")===e.value;});if(state()){if(visible){render();submit.disabled=true;}else feedback.textContent=complete()?"输入已恢复，请手动核对。":"请先完成五项预测。";}});});
submit.addEventListener("click",function(){if(!state()||!complete())return;render();submit.disabled=true;var n=selected.filter(function(x,i){return x===[0,0,1,0,0][i];}).length;feedback.textContent="预测 "+n+" / 5。对照公式、完整表格与模型条件。";results.querySelector("h4").focus();});
lab.querySelector('[data-action="reset"]').addEventListener("click",function(){selected=[null,null,null,null,null];lab.querySelectorAll("[data-choice]").forEach(function(b){b.setAttribute("aria-pressed","false");});lab.querySelectorAll("[data-key]").forEach(function(e){e.value=String(DEFAULTS[e.getAttribute("data-key")]);});lab.querySelectorAll("[data-controls]").forEach(function(d){d.open=d.getAttribute("data-controls")==="disk";});results.hidden=true;state();feedback.textContent="已复位，请重新预测。";lab.querySelector("[data-choice]").focus();});state();
}
return {CONSTANTS:CONSTANTS,DEFAULTS:DEFAULTS,MODES:MODES,EFFICIENCIES:EFFICIENCIES,config:config,opacity:opacity,eddingtonLuminosity:eddingtonLuminosity,gravitationalRadius:gravitationalRadius,efficiency:efficiency,massRateFromLuminosity:massRateFromLuminosity,massRateSolarYear:massRateSolarYear,innerBoundaryFactor:innerBoundaryFactor,shape:shape,thinDiskFlux:thinDiskFlux,thinDiskTemperature:thinDiskTemperature,timescales:timescales,evaluate:evaluate,snapshot:snapshot,mri:mri,jet:jet,selfTest:selfTest,spectralShape:function(u,Y,N){return spectrumAt(u,spectralQuadrature(Y,N===undefined?800:N));},plots:plots,ledgers:ledgers,fmt:fmt,mount:mount};
});
