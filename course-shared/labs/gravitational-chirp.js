(function(root,factory){"use strict";var a=factory();if(typeof module==="object"&&module.exports)module.exports=a;if(root&&root.CourseLearning)root.CourseLearning.register("gravitational-chirp",a.mount);})(typeof window!=="undefined"?window:null,function(){
"use strict";
var G=6.67430e-11,C=299792458,MSUN=1.98847e30,HBAR=1.054571817e-34,KB=1.380649e-23;
var MODES=Object.freeze({blackhole:"黑洞：光锥、温度与熵",polarization:"引力波：偏振与差分臂长",chirp:"旋近：能量平衡与频率截断"});
var DEFAULTS=Object.freeze({mode:"blackhole",massSolar:1,radiusRatio:1,strain:1e-21,angle:0,phase:0,arm:4000,waveFrequency:100,mcSource:10,eta:.25,fObserved:20,redshift:0,xLimit:.1});
var ACTIVE=Object.freeze({blackhole:["massSolar","radiusRatio"],polarization:["strain","angle","phase","arm","waveFrequency"],chirp:["mcSource","eta","fObserved","redshift","xLimit"]});
function finite(x,lo,hi,name){if(typeof x!=="number"||!Number.isFinite(x)||x<lo||x>hi)throw RangeError(name+" must be in ["+lo+","+hi+"]");return x;}
function config(o){
if(!o||typeof o!=="object"||Array.isArray(o))throw TypeError("config object required");
var c=Object.assign({},DEFAULTS,o);if(typeof c.mode!=="string"||!Object.hasOwn(MODES,c.mode))throw RangeError("mode");
finite(c.massSolar,1e-5,1e10,"massSolar");finite(c.radiusRatio,.1,6,"radiusRatio");
finite(c.strain,0,.001,"strain");if(c.strain!==0&&c.strain<1e-30)throw RangeError("strain must be zero or at least 1e-30");
finite(c.angle,0,180,"angle");finite(c.phase,0,360,"phase");finite(c.arm,.001,1e5,"arm");finite(c.waveFrequency,.001,1e4,"waveFrequency");
finite(c.mcSource,.5,1e4,"mcSource");finite(c.eta,.01,.25,"eta");finite(c.fObserved,1,2000,"fObserved");finite(c.redshift,0,10,"redshift");finite(c.xLimit,.02,.1,"xLimit");
if(c.mode==="polarization"&&2*Math.PI*c.waveFrequency*c.arm/C>.1)throw RangeError("此长波长响应要求 2πfL/c ≤ 0.1；请降低频率或臂长。");
return c;
}
function bhAt(massSolar,x){
finite(massSolar,1e-7,1e12,"massSolar");finite(x,.1,6,"radiusRatio");
var mass=massSolar*MSUN,mu=G*mass,rs=2*mu/(C*C),r=rs*x,area=4*Math.PI*rs*rs,entropyOverKB=area*C*C*C/(4*G*HBAR),temperature=HBAR*C*C*C/(8*Math.PI*mu*KB),k=mu/(r*r*r);
return{massSolar:massSolar,massKg:mass,rs:rs,radius:r,radiusRatio:x,area:area,entropyOverKB:entropyOverKB,entropySI:KB*entropyOverKB,temperature:temperature,surfaceGravity:C*C*C*C/(4*mu),radialTide:2*k,transverseTide:-k,curvature:12/(Math.pow(rs,4)*Math.pow(x,6)),ingoing:-1,outgoing:(x-1)/(x+1),gTT:-(x-1)/x,gTx:1/x,gxx:1+1/x,determinant:-1};
}
function blackhole(massSolar,x){
finite(massSolar,1e-5,1e10,"massSolar");finite(x,.1,6,"radiusRatio");
var sample=bhAt(massSolar,x),grid=Array.from(new Set(Array.from({length:401},function(_,i){return .1+5.9*i/400;}).concat([1,x]))).sort(function(a,b){return a-b;});
var rows=grid.map(function(v){return bhAt(massSolar,v);}),scales=[];
for(var i=0;i<=200;i++){var logRatio=-2+i/50,ratio=Math.pow(10,logRatio),r=bhAt(massSolar*ratio,x);r.logMassRatio=logRatio;r.massRatio=ratio;r.logEntropyRatio=2*logRatio;r.logTemperatureRatio=-logRatio;r.logTideRatio=-2*logRatio;scales.push(r);}
return{sample:sample,rows:rows,scales:scales,region:x<1?"未来黑洞内部：两族光线的r都不增加":x===1?"事件视界：出射族沿视界前进":"外部：出射族可以增大r",curvatureAtHorizon:bhAt(massSolar,1).curvature};
}
function trigDegrees(deg){
var n=deg/90;if(Number.isInteger(n)){var k=((n%4)+4)%4;return{cos:[1,0,-1,0][k],sin:[0,1,0,-1][k]};}
var t=deg*Math.PI/180;return{cos:Math.cos(t),sin:Math.sin(t)};
}
function polarization(o){
if(o!==undefined&&(!o||typeof o!=="object"||Array.isArray(o)))throw TypeError("config object required");
var c=config(Object.assign({},o,{mode:"polarization"})),rot=trigDegrees(2*c.angle),phase=trigDegrees(c.phase),h=c.strain*phase.cos,hp=h*rot.cos,hx=h*rot.sin,omega=2*Math.PI*c.waveFrequency,visual=c.strain===0?0:.3;
var ring=[],phases=[];
for(var i=0;i<=360;i++){
var t=trigDegrees(i),dx=.5*(hp*t.cos+hx*t.sin),dy=.5*(hx*t.cos-hp*t.sin),drawPlus=visual*phase.cos*rot.cos,drawCross=visual*phase.cos*rot.sin;
ring.push({angle:i,x0:t.cos,y0:t.sin,deltaX:dx,deltaY:dy,drawX:t.cos+.5*(drawPlus*t.cos+drawCross*t.sin),drawY:t.sin+.5*(drawCross*t.cos-drawPlus*t.sin)});
var v=c.strain*trigDegrees(i).cos,plus=v*rot.cos,cross=v*rot.sin;
phases.push({phase:i,hPlus:plus,hCross:cross,armXFraction:plus/2,armYFraction:-plus/2,differentialFraction:plus,deltaArmX:c.arm*plus/2,deltaArmY:-c.arm*plus/2,differentialLength:c.arm*plus,tidalXX:-omega*omega*plus/2,tidalXY:-omega*omega*cross/2});
}
return{config:c,hPlus:hp,hCross:hx,armXFraction:hp/2,armYFraction:-hp/2,differentialFraction:hp,deltaArmX:c.arm*hp/2,deltaArmY:-c.arm*hp/2,differentialLength:c.arm*hp,tidalXX:-omega*omega*hp/2,tidalXY:-omega*omega*hx/2,omegaArmOverC:omega*c.arm/C,visualAmplitude:visual,visualGain:c.strain===0?null:visual/c.strain,ring:ring,phases:phases};
}
function chirpRate(f,m){
finite(f,1e-6,1e8,"frequency");finite(m,1e-4,1e6,"chirp mass");
var seconds=G*m*MSUN/(C*C*C);return(96/5)*Math.pow(Math.PI,8/3)*Math.pow(seconds,5/3)*Math.pow(f,11/3);
}
function formalTime(f,m){return 3*f/(8*chirpRate(f,m));}
function chirpTrack(mcSource,eta,fObserved,redshift,xLimit){
finite(mcSource,.25,2e4,"mcSource");finite(eta,.01,.25,"eta");finite(fObserved,1,2000,"fObserved");finite(redshift,0,10,"redshift");finite(xLimit,.02,.1,"xLimit");
var factor=1+redshift,totalSource=mcSource/Math.pow(eta,.6),totalObserved=factor*totalSource,mcObserved=factor*mcSource,massSeconds=G*totalObserved*MSUN/(C*C*C);
var fCut=Math.pow(xLimit,1.5)/(Math.PI*massSeconds),x0=Math.pow(Math.PI*massSeconds*fObserved,2/3),fSource=factor*fObserved,tau=formalTime(fObserved,mcObserved),rate=chirpRate(fObserved,mcObserved),sourceTau=formalTime(fSource,mcSource),sourceRate=chirpRate(fSource,mcSource);
var gap=fCut-fObserved,status=Math.abs(gap)<=64*Number.EPSILON*Math.max(fCut,fObserved)?"unresolved":gap<0?"outside":"valid",logSpan=status==="valid"?Math.log1p(gap/fObserved):null,rows=[],duration=null,cycles=null;
if(status==="valid"){
 duration=tau*(-Math.expm1(-8*logSpan/3));cycles=(8/5)*fObserved*tau*(-Math.expm1(-5*logSpan/3));
 for(var i=0;i<=200;i++){
  var lf=logSpan*i/200,f=i===200?fCut:fObserved*Math.exp(lf),elapsed=tau*(-Math.expm1(-8*lf/3)),n=(8/5)*fObserved*tau*(-Math.expm1(-5*lf/3)),x=i===200?xLimit:x0*Math.exp(2*lf/3),power=(32/5)*Math.pow(C,5)/G*eta*eta*Math.pow(x,5),binding=-.5*eta*totalSource*MSUN*C*C*x;
  rows.push({i:i,frequency:f,elapsed:elapsed,sourceFrequency:f*factor,sourceElapsed:elapsed/factor,rate:chirpRate(f,mcObserved),cycles:n,phase:2*Math.PI*n,xPN:x,bindingEnergySource:binding,powerSource:power});
 }
}
var discriminant=Math.sqrt(1-4*eta);
return{mcSource:mcSource,mcObserved:mcObserved,eta:eta,totalSource:totalSource,totalObserved:totalObserved,m1Source:totalSource*(1+discriminant)/2,m2Source:2*eta*totalSource/(1+discriminant),fObserved:fObserved,fSource:fSource,fOrbitalObserved:fObserved/2,redshift:redshift,xLimit:xLimit,xStart:x0,fCut:fCut,schwarzschildISCOFrequency:1/(Math.pow(6,1.5)*Math.PI*massSeconds),formalTime:tau,sourceFormalTime:sourceTau,rate:rate,sourceRate:sourceRate,status:status,duration:duration,cycles:cycles,rows:rows};
}
function chirp(o){
if(o!==undefined&&(!o||typeof o!=="object"||Array.isArray(o)))throw TypeError("config object required");
var c=config(Object.assign({},o,{mode:"chirp"})),tracks=[.5,1,2].map(function(r){var s=chirpTrack(c.mcSource*r,c.eta,c.fObserved,c.redshift,c.xLimit);s.massFactor=r;return s;});
return{config:c,sample:tracks[1],tracks:tracks};
}
function snapshot(o){var c=config(o===undefined?{}:o),s=c.mode==="blackhole"?blackhole(c.massSolar,c.radiusRatio):c.mode==="polarization"?polarization(c):chirp(c);s.config=c;return s;}
function fmt(v){if(v===null)return"—（不适用）";if(typeof v!=="number")return String(v);if(!Number.isFinite(v))throw Error("nonfinite display");return v===0?"0":v.toPrecision(8).replace(/e-/g,"e−");}
function selfTest(){
var n=0;function ck(v,s){n++;if(!v)throw Error(s);}
var b=bhAt(1,1);ck(b.outgoing===0&&b.ingoing===-1,"horizon null slopes");ck(b.entropyOverKB>1e77&&b.entropyOverKB<1.1e77,"solar entropy units");ck(Math.abs(2*b.temperature*b.entropySI/(MSUN*C*C)-1)<1e-14,"Smarr");
ck(bhAt(1,.9).outgoing<0&&bhAt(1,1.1).outgoing>0,"future cones");
var w=polarization({angle:45});ck(w.hPlus===0&&w.differentialLength===0,"cross polarization detector null");
w=polarization({strain:0});ck(w.visualGain===null&&w.ring.every(function(r){return r.drawX===r.x0&&r.drawY===r.y0;}),"zero strain");
var q=chirpTrack(10,.25,20,1,.1);ck(Math.abs(q.formalTime/q.sourceFormalTime-2)<1e-13,"redshift time");ck(Math.abs(q.sourceRate/q.rate-4)<1e-12,"redshift rate");ck(q.rows.length===201&&q.rows[200].frequency===q.fCut,"bounded trajectory");
q=chirpTrack(10000,.25,2000,10,.1);ck(q.status==="outside"&&q.rows.length===0&&q.duration===null,"no outside trajectory");
return{status:"PASS",checks:n};
}
function ledgers(s){
var c=s.config,mode=c.mode,summary=[],tables=[];
function add(key,title,headers,rows){tables.push({key:key,title:title,headers:headers,rows:rows});}
if(mode==="blackhole"){
var v=s.sample;
summary=[["模型","Schwarzschild未来黑洞片","非旋转、无电荷；x=r/rs；所有输入为教学参数"],["质量（太阳质量）",v.massSolar,"不是实际事件质量拟合"],["rs / r（m）",v.rs,v.radius],["位置类别",s.region,"由正则坐标中的未来光锥判断"],["入射 / 出射 dx/dT",v.ingoing,v.outgoing],["径向度规行列式",v.determinant,"V=cv/rs，T=V−x；当地光速仍为c"],["面积（m²）",v.area,"事件视界面积，不是r处球面面积"],["S/kB（无量纲）",v.entropyOverKB,"与下一行是同一个熵"],["S（J/K）",v.entropySI,"不能给这个数直接加kB单位"],["Hawking温度（K）",v.temperature,"半经典输入；不是本页实测"],["表面引力κ（m/s²）",v.surfaceGravity,"红移归一化；不同于视界上静止钟的固有加速度"],["局部径向潮汐（s⁻²）",v.radialTide,"径向自由落体标架，单位分离的线性偏离"],["局部横向潮汐（s⁻²）",v.transverseTide,"两个横向方向相同"],["当前位置曲率K（m⁻⁴）",v.curvature,"与加速度或坐标速度不同"],["视界处曲率K（m⁻⁴）",s.curvatureAtHorizon,"有限不代表小；r=0不在实验域"]];
add("radial","完整径向网格：包括精确视界和当前半径",["x=r/rs","r(m)","gTT","gTx","gxx","入射速度","出射速度","径向潮汐s⁻²","横向潮汐s⁻²","曲率m⁻⁴"],s.rows.map(function(r){return[r.radiusRatio,r.radius,r.gTT,r.gTx,r.gxx,r.ingoing,r.outgoing,r.radialTide,r.transverseTide,r.curvature];}));
add("scales","全部201质量缩放节点：固定r/rs",["log10(M/M₀)","质量/太阳","rs(m)","S/kB","S(J/K)","TH(K)","径向潮汐s⁻²","log熵比","log温度比","log潮汐比"],s.scales.map(function(r){return[r.logMassRatio,r.massSolar,r.rs,r.entropyOverKB,r.entropySI,r.temperature,r.radialTide,r.logEntropyRatio,r.logTemperatureRatio,r.logTideRatio];}));
}else if(mode==="polarization"){
summary=[["模型","沿+z正入射的线偏振","正交x/y等臂、自由测试质量、长波长领先响应"],["真实应变幅度h₀",c.strain,"图中形变另外放大"],["偏振方向ψ / 相位φ（度）",c.angle,c.phase],["h+ / h×",s.hPlus,s.hCross],["单臂x / y相对变化",s.armXFraction,s.armYFraction],["差分应变",s.differentialFraction,"(δLx−δLy)/L；不是单臂变化"],["单臂x / y变化（m）",s.deltaArmX,s.deltaArmY],["差分臂长变化（m）",s.differentialLength,"完整光学腔、噪声、天线标定不在模型中"],["潮汐矩阵xx / xy（s⁻²）",s.tidalXX,s.tidalXY],["2πfL/c",s.omegaArmOverC,"要求≤0.1；范围限制不是严格误差证书"],["示意图幅度 / 放大倍数",s.visualAmplitude,s.visualGain],["图的含义","线性响应方向示意","不能把0.3的展示幅度当成真实强波解"]];
add("ring","完整361角节点：实际位移与示意位置分别列出",["环上角度","初始x/L","初始y/L","真实δx/L","真实δy/L","放大图x","放大图y"],s.ring.map(function(r){return[r.angle,r.x0,r.y0,r.deltaX,r.deltaY,r.drawX,r.drawY];}));
add("phases","完整361相位节点：各臂、差分与曲率响应",["φ(度)","h+","h×","δLx/L","δLy/L","差分/L","δLx(m)","δLy(m)","差分(m)","潮汐xx(s⁻²)","潮汐xy(s⁻²)"],s.phases.map(function(r){return[r.phase,r.hPlus,r.hCross,r.armXFraction,r.armYFraction,r.differentialFraction,r.deltaArmX,r.deltaArmY,r.differentialLength,r.tidalXX,r.tidalXY];}));
}else{
var v=s.sample,status={valid:"在所选截断内",outside:"起点超出所选截断",unresolved:"起点与截断在双精度内未分辨"};
summary=[["模型","Newton圆轨道+领先四极辐射","无自旋/偏心；固定红移；不含并合/铃宕"],["当前轨迹状态",status[v.status],"不自动修改起始频率"],["Mc源 / Mc观测（太阳质量）",v.mcSource,v.mcObserved],["η / z",v.eta,v.redshift],["M源 / M观测（太阳质量）",v.totalSource,v.totalObserved],["m1源 / m2源（太阳质量）",v.m1Source,v.m2Source],["起始f观测 / f源（Hz）",v.fObserved,v.fSource],["观测轨道频率（Hz）",v.fOrbitalObserved,"主导GW频率的一半"],["观测速率 / 源速率（Hz/s）",v.rate,v.sourceRate],["起点xPN / 截断xPN",v.xStart,v.xLimit],["截断观测频率（Hz）",v.fCut,"由总质量与xcut决定；不是并合频率"],["Schwarzschild ISCO参考（Hz）",v.schwarzschildISCOFrequency,"把总质量放入测试粒子公式；非可比质量双星的精确阈值"],["到截断的观测时长（s）",v.duration,"未解析或范围外时不生成演化"],["到截断的波周期数",v.cycles,"轨道圈数为其一半"],["形式τ观测 / τ源（s）",v.formalTime,v.sourceFormalTime],["形式τ的含义","将领先阶方程外推至无限频率","不等于真实并合剩余时间"],["比较曲线","Mc分别×0.5、1、2，η固定","每条都保留自己的完整截止区间"]];
add("comparisons","三条轨迹的独立截断与缩放",["Mc倍数","Mc源","M源","起点xPN","fcut(Hz)","状态","Δt(s)","波周期N"],s.tracks.map(function(t){return[t.massFactor,t.mcSource,t.totalSource,t.xStart,t.fCut,status[t.status],t.duration,t.cycles];}));
s.tracks.forEach(function(t){add("track"+t.massFactor,"Mc×"+t.massFactor+"：全部"+t.rows.length+"节点",["i","t观测(s)","f观测(Hz)","t源(s)","f源(Hz)","df/dt观测","波周期N","相位(rad)","xPN","E源(J)","P源(W)"],t.rows.map(function(r){return[r.i,r.elapsed,r.frequency,r.sourceElapsed,r.sourceFrequency,r.rate,r.cycles,r.phase,r.xPN,r.bindingEnergySource,r.powerSource];}));});
}
tables.unshift({key:"summary",title:"当前模型、单位与适用条件",headers:["量","读数","解释或第二读数"],rows:summary});return tables;
}
function plots(s){
var c=s.config;
function curve(title,xlabel,ylabel,rows,xkey,series){
var xs=rows.map(function(r){return r[xkey];}),vals=[];
series.forEach(function(q){q.values=rows.map(function(r){vals.push(r[q.key]);return r[q.key];});});
var lo=Math.min.apply(null,vals.concat([0])),hi=Math.max.apply(null,vals.concat([0])),pad=(hi-lo)*.08||1;
return{title:title,xlabel:xlabel,ylabel:ylabel,xmin:Math.min.apply(null,xs),xmax:Math.max.apply(null,xs),ymin:lo-pad,ymax:hi+pad,xs:xs,series:series};
}
if(c.mode==="blackhole"){
var a=curve("正则时间坐标中的两族未来光线","x=r/rs；虚线x=1为视界","dx/dT；这是坐标速度",s.rows,"radiusRatio",[{key:"ingoing",label:"入射族 −1"},{key:"outgoing",label:"出射族 (x−1)/(x+1)"}]);a.vertical=[{x:1,label:"视界"}];
var b=curve("固定相对半径：大黑洞的温度与潮汐更低","log10(M/M₀)","各量相对当前模型的log10比值",s.scales,"logMassRatio",[{key:"logEntropyRatio",label:"log10(S/S₀)"},{key:"logTemperatureRatio",label:"log10(T/T₀)"},{key:"logTideRatio",label:"log10(λ径/λ径₀)"}]);return[a,b];
}
if(c.mode==="polarization"){
var a={title:"偏振方向示意：形变已放大，真实位移另列",xlabel:"示意横坐标（横纵等比例）",ylabel:"示意纵坐标",xmin:-1.2,xmax:1.2,ymin:-1.2,ymax:1.2,equalAspect:true,xs:s.ring.map(function(r){return r.x0;}),series:[{key:"reference",label:"未变形单位圆",values:s.ring.map(function(r){return r.y0;})},{key:"deformed",label:"放大后的线性形变方向",xs:s.ring.map(function(r){return r.drawX;}),values:s.ring.map(function(r){return r.drawY;})}]};
var b=curve("实际臂长响应：单臂与差分的系数不同","波相位φ（度）","ΔL（m）；零响应也保留参考刻度",s.phases,"phase",[{key:"deltaArmX",label:"x臂变化"},{key:"deltaArmY",label:"y臂变化"},{key:"differentialLength",label:"两臂差分"}]);
var scale=1.1*(c.strain||1e-21)*c.arm;b.ymin=-scale;b.ymax=scale;return[a,b];
}
function trackPlot(key,title,ylabel){
var active=s.tracks.filter(function(t){return t.status==="valid";}),xmax=0,ymax=0;
active.forEach(function(t){t.rows.forEach(function(r){xmax=Math.max(xmax,r.elapsed);ymax=Math.max(ymax,r[key]);});});
return{title:title,xlabel:"观测时间（s）；每条曲线有各自终点",ylabel:ylabel,xmin:0,xmax:xmax||1,ymin:0,ymax:ymax*1.06||1,xs:[],empty:active.length===0,series:active.map(function(t){return{key:"mass"+t.massFactor,label:"Mc×"+t.massFactor+"，到xcut即止",xs:t.rows.map(function(r){return r.elapsed;}),values:t.rows.map(function(r){return r[key];})};})};
}
return[trackPlot("frequency","有限频率区间内的旋近：不外推并合","GW观测频率（Hz）"),trackPlot("cycles","累计波周期数：不采样伪造快速应变振荡","从起点累计的波周期数")];
}

var GW_INSTANCE=0;
function mount(root){
var doc=root.ownerDocument,id="gw127-"+(++GW_INSTANCE),fields={},state={predictions:[null,null,null,null],revealed:false,error:false},last=null;
if(!doc.getElementById("gw127-style")){
var style=doc.createElement("style");style.id="gw127-style";
style.textContent=".gw127{color:var(--fg);line-height:1.65;min-width:0}.gw127 *{box-sizing:border-box}.gw127 [hidden]{display:none!important}.gw127 input,.gw127 select,.gw127 button{font:inherit;min-height:44px;background:var(--bg);color:var(--fg);border:1px solid var(--border);border-radius:5px;padding:7px}.gw127 input,.gw127 select{width:100%}.gw127 button{cursor:pointer}.gw127 button:disabled{opacity:.5;cursor:default}.gw127 .gw-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.gw127 .gw-field{display:grid;gap:4px;min-width:0}.gw127 .gw-question{margin:14px 0;padding:12px;border:1px solid var(--border)}.gw127 .gw-choices,.gw127 .gw-actions{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.gw127 [aria-pressed=true]{background:var(--accent);color:var(--bg)}.gw127 .gw-region{max-width:100%;overflow:auto;margin:14px 0}.gw127 details .gw-region{max-height:480px}.gw127 summary{cursor:pointer;padding:12px;border:1px solid var(--border)}.gw127 .gw-region:focus-visible,.gw127 button:focus-visible,.gw127 input:focus-visible,.gw127 select:focus-visible,.gw127 summary:focus-visible{outline:3px solid var(--accent);outline-offset:2px}.gw127 svg{display:block;width:900px;min-width:900px;max-width:none;background:var(--bg);color:var(--fg)}.gw127 table{min-width:900px;width:100%;border-collapse:collapse;font-size:14px}.gw127 th,.gw127 td{padding:9px;border:1px solid var(--border);text-align:left;vertical-align:top}.gw127 caption{font-weight:700;text-align:left;margin:8px 0}.gw127 .gw-feedback{padding:10px;border-left:3px solid var(--accent)}.gw127 .gw-legend{min-width:900px;display:flex;gap:20px;flex-wrap:wrap}.gw127 .gw-note{font-size:14px;color:var(--fg-soft)}@media(max-width:700px){.gw127 .gw-controls{grid-template-columns:1fr}}";
doc.head.appendChild(style);}
function el(tag,attrs,text){var e=doc.createElement(tag);Object.keys(attrs||{}).forEach(function(k){e.setAttribute(k,attrs[k]);});if(text!==undefined)e.textContent=text;return e;}
var lab=el("div",{class:"gw127"});lab.appendChild(el("h3",{},"光锥、偏振与旋近：先选清楚计算对象"));
var controls=el("div",{class:"gw-controls"});
function select(key,label,options){var w=el("label",{class:"gw-field"},label),e=el("select",{"data-key":key,"aria-label":label});Object.keys(options).forEach(function(k){e.appendChild(el("option",{value:k},options[k]));});fields[key]=e;w.appendChild(e);controls.appendChild(w);}
function input(key,label,min,max){var w=el("label",{class:"gw-field"},label),e=el("input",{type:"number",step:"any",min:min,max:max,"data-key":key,"aria-label":label});fields[key]=e;w.appendChild(e);controls.appendChild(w);}
select("mode","实验模型",MODES);
input("massSolar","黑洞质量（太阳质量；10⁻⁵–10¹⁰）",1e-5,1e10);
input("radiusRatio","相对半径x=r/rs（0.1–6）",.1,6);
input("strain","真实应变h₀（0或10⁻³⁰–10⁻³）",0,.001);
input("angle","线偏振主轴ψ（度，0–180）",0,180);
input("phase","波相位φ（度，0–360）",0,360);
input("arm","正交臂长L（m，0.001–10⁵）",.001,1e5);
input("waveFrequency","平面波频率（Hz，0.001–10⁴）",.001,1e4);
input("mcSource","源帧啁啾质量Mc（太阳质量，0.5–10⁴）",.5,1e4);
input("eta","对称质量比η（0.01–0.25）",.01,.25);
input("fObserved","起始GW观测频率（Hz，1–2000）",1,2000);
input("redshift","红移z（0–10，观测期间固定）",0,10);
input("xLimit","教学截断xPN（0.02–0.1）",.02,.1);
lab.appendChild(controls);
lab.appendChild(el("p",{class:"gw-note"},"仅当前模型的参数参与计算。切换模型会保留各自输入；无效值不会被自动更改。偏振示意图另有明确放大倍数；旋近只到指定截断，超出范围不生成曲线。"));
function visibleFields(){Object.keys(fields).forEach(function(k){fields[k].parentElement.hidden=k!=="mode"&&!ACTIVE[fields.mode.value].includes(k);});}
var presets=el("div",{class:"gw-actions"});
[
["视界光锥",{mode:"blackhole",massSolar:1,radiusRatio:1}],
["百万太阳质量",{mode:"blackhole",massSolar:1e6,radiusRatio:1}],
["加偏振",{mode:"polarization",strain:1e-21,angle:0,phase:0,arm:4000,waveFrequency:100}],
["交叉偏振",{mode:"polarization",strain:1e-21,angle:45,phase:0,arm:4000,waveFrequency:100}],
["默认有限旋近",{mode:"chirp",mcSource:10,eta:.25,fObserved:20,redshift:0,xLimit:.1}],
["起点超出截断",{mode:"chirp",mcSource:100,eta:.25,fObserved:200,redshift:1,xLimit:.1}]
].forEach(function(pair){var b=el("button",{type:"button","data-preset":pair[0]},pair[0]);b.onclick=function(){Object.keys(pair[1]).forEach(function(k){fields[k].value=String(pair[1][k]);});visibleFields();validate(true);};presets.appendChild(b);});lab.appendChild(presets);
var questions=[
["视界处曲率有限，能否据此判断任意质量黑洞的潮汐都很弱？",["不能，有限与数值很小不同","可以，有限就意味着没有可测作用"]],
["熵约10⁵⁴ J/K，能否直接改写成10⁵⁴ kB？",["不能，须再除以kB的SI数值","可以，只是两种单位名称"]],
["正入射加偏振中，每条臂与两臂差分都等于hL吗？",["不是，单臂有1/2，差分为hL","是，两者系数相同"]],
["领先阶chirp质量是否能独自确定两颗质量，并给出真实铃宕？",["不能，还缺质量比和更完整波形","能，延长同一曲线即可"]]
],buttons=[];
questions.forEach(function(q,i){var w=el("section",{class:"gw-question","data-question":i});w.appendChild(el("p",{},(i+1)+". "+q[0]));var opts=el("div",{class:"gw-choices"});buttons[i]=[];q[1].forEach(function(t,j){var b=el("button",{type:"button","data-choice":j,"aria-pressed":"false"},t);b.onclick=function(){state.predictions[i]=j;buttons[i].forEach(function(b,k){b.setAttribute("aria-pressed",k===j?"true":"false");});validate(false);if(state.revealed&&!state.error)feedback.textContent=score();};buttons[i].push(b);opts.appendChild(b);});w.appendChild(opts);lab.appendChild(w);});
var actions=el("div",{class:"gw-actions"}),submit=el("button",{type:"button","data-action":"submit"},"揭示并核对"),reset=el("button",{type:"button","data-action":"reset"},"重置");actions.appendChild(submit);actions.appendChild(reset);lab.appendChild(actions);
var feedback=el("p",{class:"gw-feedback",role:"status"},"先回答四个预测。"),results=el("div",{class:"gw-results",hidden:""});lab.appendChild(feedback);lab.appendChild(results);root.replaceChildren(lab);
function score(){return state.predictions.filter(function(x){return x===0;}).length+" / 4 个预测命中。先确认当前模型，再检查单位、坐标与近似。";}
function read(){var o={mode:fields.mode.value};ACTIVE[o.mode].forEach(function(k){var e=fields[k];if(e.value.trim()===""||!e.validity.valid)throw Error(e.getAttribute("aria-label")+"：输入无效，保留原值");o[k]=Number(e.value);});return config(o);}
function validate(auto){try{last=read();submit.disabled=state.predictions.some(function(x){return x===null;})||(state.revealed&&!state.error);if(state.error||!state.revealed){results.hidden=true;if(!submit.disabled)feedback.textContent="参数与预测已记录，点击揭示。";}else if(auto)render(snapshot(last));}catch(e){state.error=true;results.hidden=true;submit.disabled=true;feedback.textContent=e.message;}}
var colors=["#347fbd","#b87b20","#348557","#af4f96"];
function svg(p){
var ns="http://www.w3.org/2000/svg";function e(tag,attrs,text){var n=doc.createElementNS(ns,tag);Object.keys(attrs||{}).forEach(function(k){n.setAttribute(k,attrs[k]);});if(text!==undefined)n.textContent=text;return n;}
var left=p.equalAspect?250:120,width=p.equalAspect?400:740,top=80,height=p.equalAspect?400:230,bottom=top+height;
var s=e("svg",{viewBox:"0 0 900 "+(bottom+130),role:"img","aria-label":p.title,"data-equal-aspect":String(!!p.equalAspect)}),x=function(v){return left+width*(v-p.xmin)/(p.xmax-p.xmin);},y=function(v){return bottom-height*(v-p.ymin)/(p.ymax-p.ymin);};
s.appendChild(e("title",{},p.title));s.appendChild(e("text",{x:30,y:30,fill:"currentColor","font-size":17},p.title));
(p.allowed||[]).forEach(function(a,i){s.appendChild(e("rect",{"data-allowed":i,x:x(a.uMin),y:top,width:x(a.uMax)-x(a.uMin),height:height,fill:"#348557","fill-opacity":.13}));});
for(var i=0;i<=4;i++){var xv=p.xmin+(p.xmax-p.xmin)*i/4,yv=p.ymin+(p.ymax-p.ymin)*i/4;s.appendChild(e("line",{x1:left,x2:left+width,y1:y(yv),y2:y(yv),stroke:"currentColor","stroke-opacity":.2}));s.appendChild(e("text",{x:left-8,y:y(yv)+4,"text-anchor":"end",fill:"currentColor","font-size":12},fmt(yv)));s.appendChild(e("text",{x:x(xv),y:bottom+25,"text-anchor":"middle",fill:"currentColor","font-size":12},fmt(xv)));}
if(p.ymin<=0&&p.ymax>=0)s.appendChild(e("line",{x1:left,x2:left+width,y1:y(0),y2:y(0),stroke:"currentColor","stroke-width":1}));
(p.vertical||[]).forEach(function(v,i){s.appendChild(e("line",{"data-vertical":i,x1:x(v.x),x2:x(v.x),y1:top,y2:bottom,stroke:"currentColor","stroke-dasharray":"5 4"}));s.appendChild(e("text",{x:x(v.x)+7,y:top+20,fill:"currentColor","font-size":13},v.label));});
if(p.empty)s.appendChild(e("text",{x:450,y:190,"text-anchor":"middle",fill:"currentColor","font-size":19},"全部比较起点均超出或过近截止；没有可展示的演化区间"));
p.series.forEach(function(q,j){var xs=q.xs||p.xs,points=[];q.values.forEach(function(v,i){var xp=x(xs[i]),yp=y(v);points.push(xp+","+yp);s.appendChild(e("circle",{"data-series":q.key,"data-index":i,cx:xp,cy:yp,r:1.5,fill:colors[j%4]}));});s.appendChild(e("polyline",{"data-series":q.key,points:points.join(" "),fill:"none",stroke:colors[j%4],"stroke-width":1.6,"stroke-dasharray":q.key==="newton"?"5 4":"none"}));});
(p.roots||[]).forEach(function(r,i){s.appendChild(e("circle",{"data-root":i,cx:x(r.u),cy:y(0),r:r.multiplicity>1?6:4,fill:"var(--bg)",stroke:"currentColor","stroke-width":2}));});
s.appendChild(e("text",{x:450,y:bottom+65,"text-anchor":"middle",fill:"currentColor","font-size":15},p.xlabel));s.appendChild(e("text",{x:450,y:bottom+96,"text-anchor":"middle",fill:"currentColor","font-size":14},"纵轴："+p.ylabel));return s;
}
function region(label){return el("div",{class:"gw-region",role:"region",tabindex:"0","aria-label":label+"，可滚动查看全部内容"});}
function render(s){
results.replaceChildren();results.appendChild(el("h4",{tabindex:"-1"},"实验结果与完整账本"));
if(s.config.mode==="chirp"&&s.sample.status!=="valid")results.appendChild(el("p",{class:"gw-feedback"},"当前质量的起点超出或过近所选截断。其读数只作代数标记，不生成当前轨迹；其他比较曲线分别按自己的截断判断。"));
if(s.config.mode==="polarization")results.appendChild(el("p",{class:"gw-feedback"},"圆环只展示放大的线性形变方向。图的幅度与放大倍数已单列；下方臂长曲线和真实位移表使用实际应变。"));
plots(s).forEach(function(p){var r=region(p.title);r.appendChild(svg(p));var l=el("div",{class:"gw-legend"});p.series.forEach(function(q,j){var t=el("span",{},q.label);t.style.color=colors[j%4];l.appendChild(t);});if(p.allowed)l.appendChild(el("span",{},"浅绿：F>0连通区；圆圈：根，重根不自动是反弹点"));r.appendChild(l);results.appendChild(r);});
ledgers(s).forEach(function(d){var r=region(d.title),t=el("table",{"data-table":d.key});t.appendChild(el("caption",{},d.title));var th=el("tr",{});d.headers.forEach(function(h){th.appendChild(el("th",{scope:"col"},h));});t.appendChild(el("thead",{}));t.lastChild.appendChild(th);var body=el("tbody",{});d.rows.forEach(function(row){var tr=el("tr",{});row.forEach(function(v){tr.appendChild(el("td",{},fmt(v)));});body.appendChild(tr);});t.appendChild(body);r.appendChild(t);
if(d.key==="summary")results.appendChild(r);else{var detail=el("details",{"data-ledger":d.key});detail.appendChild(el("summary",{},d.title+"（"+d.rows.length+"行）"));detail.appendChild(r);if(d.rows.length===0)detail.appendChild(el("p",{},"此轨迹超出或过近所选截断，没有生成演化节点。"));results.appendChild(detail);}});
results.hidden=false;
}
submit.onclick=function(){try{last=read();if(state.predictions.some(function(x){return x===null;}))return;state.error=false;state.revealed=true;render(snapshot(last));submit.disabled=true;feedback.textContent=score();results.querySelector("h4").focus();}catch(e){state.error=true;results.hidden=true;submit.disabled=true;feedback.textContent=e.message;}};
function defaults(){Object.keys(fields).forEach(function(k){fields[k].value=String(DEFAULTS[k]);});visibleFields();}
reset.onclick=function(){defaults();state={predictions:[null,null,null,null],revealed:false,error:false};buttons.flat().forEach(function(b){b.setAttribute("aria-pressed","false");});results.replaceChildren();results.hidden=true;feedback.textContent="先回答四个预测。";validate(false);buttons[0][0].focus();};
Object.keys(fields).forEach(function(k){fields[k].addEventListener(fields[k].tagName==="SELECT"?"change":"input",function(){if(k==="mode")visibleFields();validate(true);});});defaults();validate(false);
}

return{G:G,C:C,MSUN:MSUN,HBAR:HBAR,KB:KB,MODES:MODES,ACTIVE:ACTIVE,DEFAULTS:DEFAULTS,config:config,bhAt:bhAt,blackhole:blackhole,trigDegrees:trigDegrees,polarization:polarization,chirpRate:chirpRate,formalTime:formalTime,chirpTrack:chirpTrack,chirp:chirp,snapshot:snapshot,fmt:fmt,selfTest:selfTest,ledgers:ledgers,plots:plots,mount:mount};
});
