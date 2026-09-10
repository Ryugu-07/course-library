(function(root,factory){"use strict";var h=factory();if(typeof module==="object"&&module.exports)module.exports=h;if(root&&root.CourseLearning)root.CourseLearning.register("equivalence-tides",h.mount);})(typeof window!=="undefined"?window:null,function(){
"use strict";
var G=6.67430e-11,C=299792458,MS=1.98847e30;
var PRESETS=Object.freeze({
tower:Object.freeze({label:"地球塔楼",mass:5.9722e24,radius:6.371e6,height:22.5,maxHeight:100}),
gps:Object.freeze({label:"GPS高度的静止钟对照",mass:5.9722e24,radius:6.371e6,height:2.02e7,maxHeight:3e7}),
whiteDwarf:Object.freeze({label:"非旋转白矮星外部",mass:MS,radius:6e6,height:6e6,maxHeight:3e7}),
neutronStar:Object.freeze({label:"非旋转中子星外部",mass:1.4*MS,radius:12000,height:12000,maxHeight:60000})});
var MODES=Object.freeze({clocks:"静止钟：微小红移与强场对照",rindler:"加速实验室：有红移但曲率为零",tides:"潮汐方向：径向伸长、横向压缩"});
var DEFAULTS=Object.freeze({mode:"clocks",preset:"tower",height:22.5,separation:10,angle:0,acceleration:9.80665,chi:.5});
function finite(v,lo,hi,name){if(typeof v!=="number"||!Number.isFinite(v)||v<lo||v>hi)throw RangeError(name+" must be in ["+lo+","+hi+"]");return v;}
function config(o){if(!o||typeof o!=="object"||Array.isArray(o))throw TypeError("config required");var c=Object.assign({},DEFAULTS,o);if(!Object.hasOwn(MODES,c.mode)||typeof c.mode!=="string")throw RangeError("mode");if(!Object.hasOwn(PRESETS,c.preset)||typeof c.preset!=="string")throw RangeError("preset");finite(c.height,0,3e7,"height");finite(c.separation,0,1000,"separation");finite(c.angle,0,90,"angle");finite(c.acceleration,.001,1e16,"acceleration");finite(c.chi,0,2,"chi");for(var key of ["height","separation"]){if(c[key]>0&&c[key]<1e-9)throw RangeError(key+" must be zero or at least 1e-9 m");}if(c.chi>0&&c.chi<1e-24)throw RangeError("chi must be zero or at least 1e-24");return c;}
function unique(xs){return Array.from(new Set(xs)).sort(function(a,b){return a-b;});}
function schwarzschildRadius(mass){finite(mass,1e15,1e35,"mass");return 2*G*mass/(C*C);}
function bodyCheck(body){if(!body||typeof body!=="object"||Array.isArray(body))throw TypeError("body required");schwarzschildRadius(body.mass);finite(body.radius,1000,1e12,"radius");if(!(body.radius>schwarzschildRadius(body.mass)))throw RangeError("static exterior requires R>rs");}
function distance(v,hi,name){finite(v,0,hi,name);if(v>0&&v<1e-9)throw RangeError(name+" must be zero or at least 1e-9 m");}
function clockAt(body,height){
 bodyCheck(body);distance(height,3e7,"height");
 var mu=G*body.mass,R=body.radius,rs=2*mu/(C*C),r2=R+height,u=rs/R,f1=1-u;
 if(!(f1>0))throw RangeError("static exterior requires R>rs");
 var q=u*(height/r2)/f1,logRatio=-.5*Math.log1p(q),loss=-Math.expm1(logRatio),z=Math.expm1(-logRatio),weak=.5*u*(height/r2);
 var g=mu/(R*R),localG=g/Math.sqrt(f1),linear=g*height/(C*C),v=rs/r2,f2=1-v,rootF=Math.sqrt(f1*f2);
 return {height:height,r1:R,r2:r2,rs:rs,compactness:u/2,logRatio:logRatio,ratio:Math.exp(logRatio),loss:loss,z:z,weak:weak,linear:linear,
 relativeMismatch:height===0?null:(v+(u+v-u*v)/(1+rootF))/(f2+rootF),
 linearMismatch:height===0?null:height/R,
 clockGain:z,clockGainMicrosecondsPerDay:z*86400*1e6,surfaceNewtonG:g,surfaceProperG:localG,
 toInfinityLoss:-Math.expm1(.5*Math.log1p(-u)),toInfinityZ:Math.expm1(-.5*Math.log1p(-u))};
}
function rindlerAt(acc,chi){
 finite(acc,.001,1e16,"acceleration");finite(chi,0,2,"chi");if(chi>0&&chi<1e-24)throw RangeError("chi must be zero or at least 1e-24");
 var scale=C*C/acc,s=Math.log1p(chi),ct=(1+chi)*Math.sinh(s),x=chi+(1+chi)*2*Math.sinh(s/2)*Math.sinh(s/2);
 return {chi:chi,acceleration:acc,length:scale*chi,upperProperAcceleration:acc/(1+chi),logRatio:-Math.log1p(chi),ratio:1/(1+chi),loss:chi/(1+chi),z:chi,flightParameter:s,flightCoordinateTime:C/acc*s,arrivalCT:ct,arrivalX:x,curvature:0};
}
function tidalAt(body,height,ell,angle){
 bodyCheck(body);distance(height,3e7,"height");distance(ell,1000,"separation");finite(angle,0,90,"angle");
 var r=body.radius+height,mu=G*body.mass,delta=ell/r,theta=angle*Math.PI/180;
 var co=angle===90?0:Math.cos(theta),si=angle===0?0:Math.sin(theta),k=mu/(r*r*r);
 var linearR=2*k*ell*co,linearT=-k*ell*si;
 // Symmetric finite separation in the Newtonian point-mass field; no subtraction of nearly equal accelerations.
 var zm=-delta*co+delta*delta/4,fm=Math.exp(-1.5*Math.log1p(zm)),lr=-1.5*Math.log1p(2*delta*co/(1+zm)),change=Math.expm1(lr);
 var difference=fm*change,total=fm*(2+change);
 var exactR=-mu/(r*r)*(difference+delta*co*total/2),exactT=-mu/(r*r)*delta*si*total/2;
 var correctionR=null,correctionT=null;
 if(delta<.1){
  // Gegenbauer/binomial series for (1+delta*cos(theta)+delta^2/4)^(-3/2).
  // Subtract the linear coefficient symbolically, before floating-point evaluation.
  var coeff=[1,-1.5*co];
  for(var n=2;n<=25;n++)coeff[n]=(-(n+.5)*co*coeff[n-1]-(n+1)*coeff[n-2]/4)/n;
  correctionR=0;correctionT=0;var power=delta*delta;
  for(var j=1;j<=12;j++){correctionR-=(2*coeff[2*j+1]+co*coeff[2*j])*power;correctionT-=si*coeff[2*j]*power;power*=delta*delta;}
  exactR=k*ell*(2*co+correctionR);exactT=k*ell*(-si+correctionT);
 }
 var norm=Math.hypot(linearR,linearT),finiteNorm=Math.hypot(exactR,exactT);
 return {radius:r,separation:ell,angle:angle,ratio:delta,co:co,si:si,k:k,radialEigen:2*k,transverseEigen:-k,
 linearR:linearR,linearT:linearT,linearNorm:norm,finiteR:exactR,finiteT:exactT,finiteNorm:finiteNorm,
 relativeMismatch:ell===0?null:(correctionR===null?Math.hypot(exactR-linearR,exactT-linearT)/norm:Math.hypot(correctionR,correctionT)/Math.hypot(2*co,si)),
 curvatureK:48*(mu/(C*C))*(mu/(C*C))/Math.pow(r,6),compactness:mu/(r*C*C)};
}
function snapshot(o){
 var c=config(o===undefined?{}:o),body=PRESETS[c.preset],out={config:c,body:body};
 if(c.mode==="clocks"){
  out.sample=clockAt(body,c.height);out.rows=unique(Array.from({length:201},function(_,i){return body.maxHeight*i/200;}).concat([0,.001,c.height])).map(function(h){return clockAt(body,h);});
  out.comparison=Object.keys(PRESETS).map(function(key){var b=PRESETS[key];return Object.assign({key:key,label:b.label},clockAt(b,b.height));});
 }else if(c.mode==="rindler"){
  out.sample=rindlerAt(c.acceleration,c.chi);out.rows=unique(Array.from({length:201},function(_,i){return i/100;}).concat([c.chi])).map(function(x){return rindlerAt(c.acceleration,x);});
  out.worldlines=Array.from({length:201},function(_,i){var s=-2+i/50;return{s:s,lowerCT:Math.sinh(s),lowerX:2*Math.sinh(s/2)*Math.sinh(s/2),upperCT:(1+c.chi)*Math.sinh(s),upperX:c.chi+(1+c.chi)*2*Math.sinh(s/2)*Math.sinh(s/2)};});
 }else{
  out.sample=tidalAt(body,c.height,c.separation,c.angle);out.rows=unique(Array.from({length:181},function(_,i){return i/2;}).concat([c.angle])).map(function(a){return tidalAt(body,c.height,c.separation,a);});
  out.separations=unique(Array.from({length:201},function(_,i){return i*5;}).concat([c.separation])).map(function(e){return tidalAt(body,c.height,e,c.angle);});
 }return out;
}
function fmt(v){if(v===null)return"未定义（零差值）";if(typeof v!=="number")return String(v);if(!Number.isFinite(v))throw Error("nonfinite display");if(v===0)return"0";return v.toPrecision(8).replace(/e-/g,"e−");}
function selfTest(){var checks=0;function ck(v,s){checks++;if(!v)throw Error(s);}var a=clockAt(PRESETS.tower,.001);ck(a.loss>0&&a.loss<1e-18,"millimetre loss");ck(Math.abs(a.loss/a.weak-1)<1e-8,"weak field");ck(clockAt(PRESETS.tower,0).relativeMismatch===null,"zero mismatch undefined");var r=rindlerAt(9.8,.5);ck(r.loss===1/3&&r.z===.5,"Rindler");ck(Math.abs(r.arrivalX-r.arrivalCT)<1e-14,"null arrival");var t=tidalAt(PRESETS.tower,22.5,10,90);ck(t.linearR===0&&t.linearT<0,"transverse");t=tidalAt(PRESETS.tower,22.5,10,0);ck(t.linearR>0&&t.linearT===0,"radial");ck(snapshot({mode:"rindler",height:3e7}).sample.curvature===0,"flat curvature");return{status:"PASS",checks:checks};}
function ledgers(s){
var c=s.config,v=s.sample,summary=[],tables=[];
if(c.mode==="clocks"){
summary=[["天体",s.body.label,"非旋转球对称外部；静止发射/接收钟"],["R / r₂ (m)",v.r1,v.r2],["紧致度 GM/(Rc²)",v.compactness,"不是精确谱线红移"],["ln(ν接收/ν发射)",v.logRatio,"沿静态时空光线，Killing能量守恒"],["ν接收/ν发射",v.ratio,"极小差会在比值显示精度中消失"],["频率损失 1−比值",v.loss,"用expm1稳定计算，不由显示比值相减"],["谱线红移 z",v.z,"ν发射/ν接收−1"],["弱场势差 ΔΦ/c²",v.weak,"保留完整1/R−1/r₂"],["地面g·h/c²",v.linear,"还要求h/R很小；大高差会失效"],["弱场损失相对误差",v.relativeMismatch,"相对于ΔΦ/c²；h=0时未定义"],["g·h与势差相对误差",v.linearMismatch,"恰为h/R"],["上钟相对下钟的速率增量",v.clockGain,"静止钟速率比恰是光子频率比的倒数"],["每下钟日，上钟多读 (µs)",v.clockGainMicrosecondsPerDay,"不含任何运动项"],["表面Newton g (m/s²)",v.surfaceNewtonG,"GM/R²"],["表面静止固有加速度 (m/s²)",v.surfaceProperG,"GM/(R²√(1−r_s/R))"],["表面→无穷远：损失 / z",v.toInfinityLoss,v.toInfinityZ]];
tables.push({key:"presets",title:"四个默认静止钟模型",headers:["情境","h(m)","紧致度","频率损失","弱场势差","z","每下钟日增量µs"],rows:s.comparison.map(function(r){return[r.label,r.height,r.compactness,r.loss,r.weak,r.z,r.clockGainMicrosecondsPerDay];})});
tables.push({key:"clockNodes",title:"完整高差节点；h不是径向固有距离",headers:["h(m)","r₂(m)","ln比值","损失","弱场","g·h/c²","z","弱场相对误差"],rows:s.rows.map(function(r){return[r.height,r.r2,r.logRatio,r.loss,r.weak,r.linear,r.z,r.relativeMismatch];})});
}else if(c.mode==="rindler"){
summary=[["模型","平直Minkowski的Rindler坐标","支持加速实验室，不是真实均匀引力源解"],["下钟固有加速度 (m/s²)",v.acceleration,"a₀"],["χ=a₀L/c²",v.chi,"L为同时Rindler切片上的固有间隔"],["间隔L (m)",v.length,"为展示强效果，可远大于任何真实实验室"],["上钟固有加速度 (m/s²)",v.upperProperAcceleration,"Born刚性要求不同高度的加速度不同"],["ν接收/ν发射",v.ratio,"1/(1+χ)"],["频率损失 / z",v.loss,v.z],["光子到达的 s=a₀t/c",v.flightParameter,"ln(1+χ)"],["Rindler坐标飞行时间 (s)",v.flightCoordinateTime,"不是两地固有时差"],["到达惯性坐标 cT / X（均除c²/a₀）",v.arrivalCT,v.arrivalX],["Riemann曲率",0,"N''=0；所有分量为0"]];
tables.push({key:"rindlerNodes",title:"完整χ节点",headers:["χ","L(m)","上钟固有加速度","比值","损失","z","到达s","到达cT","到达X"],rows:s.rows.map(function(r){return[r.chi,r.length,r.upperProperAcceleration,r.ratio,r.loss,r.z,r.flightParameter,r.arrivalCT,r.arrivalX];})});
tables.push({key:"worldlines",title:"两条匀加速世界线：全部201节点",headers:["s","下钟cT","下钟X","上钟cT","上钟X"],rows:s.worldlines.map(function(r){return[r.s,r.lowerCT,r.lowerX,r.upperCT,r.upperX];})});
}else{
summary=[["位置r=R+h (m)",v.radius,"潮汐实验位于上钟高度；不与表面读数混淆"],["分离ℓ / 方向θ",v.separation,v.angle],["ℓ/r",v.ratio,"有限实验室与线性偏离尺度"],["局部紧致度",v.compactness,"强场处下方有限Newton对照只作近似教学"],["径向特征值 (s⁻²)",v.radialEigen,"伸长"],["横向特征值 (s⁻²)",v.transverseEigen,"两条横向均压缩"],["线性 Δa径向 (m/s²)",v.linearR,"2GMℓcosθ/r³"],["线性 Δa横向 (m/s²)",v.linearT,"−GMℓsinθ/r³"],["线性 |Δa| (m/s²)",v.linearNorm,"两分量合成"],["有限Newton Δa径向 / 横向",v.finiteR,v.finiteT],["有限Newton |Δa| (m/s²)",v.finiteNorm,"同一瞬时Cartesian切片，两点关于中心对称"],["有限分离相对修正",v.relativeMismatch,"有限Newton与其线性化之差；不是GR误差估计"],["Schwarzschild曲率标量 (m⁻⁴)",v.curvatureK,"48G²M²/(c⁴r⁶)，这是另列的相对论外部标量"]];
tables.push({key:"angles",title:"全部方向节点：θ=0径向，θ=90°横向",headers:["θ","线性径向","线性横向","线性模长","有限径向","有限横向","有限模长","相对修正"],rows:s.rows.map(function(r){return[r.angle,r.linearR,r.linearT,r.linearNorm,r.finiteR,r.finiteT,r.finiteNorm,r.relativeMismatch];})});
tables.push({key:"separations",title:"全部分离长度节点",headers:["ℓ(m)","ℓ/r","线性径向","线性横向","有限径向","有限横向","相对修正"],rows:s.separations.map(function(r){return[r.separation,r.ratio,r.linearR,r.linearT,r.finiteR,r.finiteT,r.relativeMismatch];})});
}
tables.unshift({key:"summary",title:"当前模型、数值与条件",headers:["量","读数","条件或第二读数"],rows:summary});return tables;
}
function plots(s){
var c=s.config,v=s.sample,ps=[];
function curve(title,xlabel,ylabel,rows,xkey,series){var xs=rows.map(function(r){return r[xkey];}),vals=[];series.forEach(function(q){q.values=rows.map(function(r){return r[q.key];});q.values.forEach(function(y){if(y!==null)vals.push(y);});});var lo=Math.min.apply(null,vals.concat([0])),hi=Math.max.apply(null,vals.concat([0]));if(hi===lo){lo=-1;hi=1;}else{var pad=(hi-lo)*.08;if(lo<0)lo-=pad;hi+=pad;}return{title:title,xlabel:xlabel,ylabel:ylabel,xmin:Math.min.apply(null,xs),xmax:Math.max.apply(null,xs)||1,ymin:lo,ymax:hi,xs:xs,series:series};}
if(c.mode==="clocks"){
ps.push(curve("同一光子：真实静止频率损失与弱场势差","h（Schwarzschild径向坐标差，m）","分数频率损失",s.rows,"height",[{key:"loss",label:"Schwarzschild静止钟"},{key:"weak",label:"完整Newton势差/c²"}]));
ps.push(curve("弱场近似的相对差：先读纵轴量级","h（m）","|精确损失−弱场|/弱场；h=0未定义",s.rows,"height",[{key:"relativeMismatch",label:"数值差，不是测量不确定度"}]));
}else if(c.mode==="rindler"){
ps.push(curve("平直时空中的加速钟比","χ=a₀L/c²","频率比与频率损失",s.rows,"chi",[{key:"ratio",label:"接收/发射频率"},{key:"loss",label:"频率损失"}]));
var xs=[],l=[],u=[];s.worldlines.forEach(function(r){xs.push(r.lowerX);l.push(r.lowerCT);u.push(r.upperCT);});
// Each worldline has its own inertial X; the generic renderer supports per-series abscissae.
var allX=s.worldlines.flatMap(function(r){return[r.lowerX,r.upperX];}).concat([0,v.arrivalX]);
var allY=s.worldlines.flatMap(function(r){return[r.lowerCT,r.upperCT];}).concat([0,v.arrivalCT]);
ps.push({title:"Minkowski图：两条加速世界线与一条直光线",xlabel:"X/(c²/a₀)",ylabel:"cT/(c²/a₀)",xmin:0,xmax:Math.max.apply(null,allX)*1.05||1,ymin:Math.min.apply(null,allY)*1.05,ymax:Math.max.apply(null,allY)*1.05,xs:xs,series:[{key:"lower",label:"下钟x=0",values:l},{key:"upper",label:"上钟x=L",xs:s.worldlines.map(function(r){return r.upperX;}),values:u},{key:"light",label:"光子X=cT",xs:[0,v.arrivalX],values:[0,v.arrivalCT]}]});
}else{
ps.push(curve("分离方向决定伸长还是压缩","θ（相对径向，度）","相对加速度分量（m/s²）",s.rows,"angle",[{key:"linearR",label:"线性径向分量"},{key:"linearT",label:"线性横向分量"},{key:"finiteR",label:"有限Newton径向"},{key:"finiteT",label:"有限Newton横向"}]));
ps.push(curve("有限实验室：只核对Newton线性化的误差","ℓ（m）","有限分离相对修正；ℓ=0未定义",s.separations,"separation",[{key:"relativeMismatch",label:"Newton有限场对照"}]));
}return ps;
}
var ET_INSTANCE=0;
function mount(root){
var doc=root.ownerDocument,id="et125-"+(++ET_INSTANCE),fields={},state={predictions:[null,null,null,null],revealed:false,error:false},last=null;
if(!doc.getElementById("et125-style")){var style=doc.createElement("style");style.id="et125-style";style.textContent=".et125{color:var(--fg);line-height:1.65;min-width:0}.et125 *{box-sizing:border-box}.et125 [hidden]{display:none!important}.et125 input,.et125 select,.et125 button{font:inherit;min-height:44px;background:var(--bg);color:var(--fg);border:1px solid var(--border);border-radius:5px;padding:7px}.et125 input,.et125 select{width:100%}.et125 button{cursor:pointer}.et125 button:disabled{opacity:.5;cursor:default}.et125 .et-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.et125 label{display:block}.et125 .et-field{display:grid;gap:4px;min-width:0}.et125 .et-question{margin:14px 0;padding:12px;border:1px solid var(--border)}.et125 .et-choices{display:flex;gap:8px;flex-wrap:wrap}.et125 [aria-pressed=true]{background:var(--accent);color:var(--bg)}.et125 .et-actions{display:flex;gap:10px;margin:14px 0}.et125 .et-region{max-width:100%;overflow-x:auto;margin:14px 0}.et125 .et-region:focus-visible,.et125 button:focus-visible,.et125 input:focus-visible,.et125 select:focus-visible{outline:3px solid var(--accent);outline-offset:2px}.et125 svg{display:block;width:900px;min-width:900px;max-width:none;background:var(--bg);color:var(--fg)}.et125 table{min-width:900px;width:100%;border-collapse:collapse;font-size:14px}.et125 th,.et125 td{padding:9px;border:1px solid var(--border);text-align:left;vertical-align:top}.et125 caption{font-weight:700;text-align:left;margin:8px 0}.et125 .et-feedback{padding:10px;border-left:3px solid var(--accent)}.et125 .et-legend{min-width:900px;display:flex;gap:20px;flex-wrap:wrap}.et125 .et-note{font-size:14px;color:var(--fg-soft)}@media(max-width:700px){.et125 .et-controls{grid-template-columns:1fr}}";doc.head.appendChild(style);}
function el(tag,attrs,text){var e=doc.createElement(tag);Object.keys(attrs||{}).forEach(function(k){e.setAttribute(k,attrs[k]);});if(text!==undefined)e.textContent=text;return e;}
var lab=el("div",{class:"et125"});lab.appendChild(el("h3",{},"静止钟、加速坐标与潮汐：先确认测量对象"));
var controls=el("div",{class:"et-controls"});
function select(key,label,options){var w=el("label",{class:"et-field"},label),e=el("select",{"data-key":key,"aria-label":label});Object.keys(options).forEach(function(k){e.appendChild(el("option",{value:k},typeof options[k]==="string"?options[k]:options[k].label));});fields[key]=e;w.appendChild(e);controls.appendChild(w);}
function input(key,label,min,max){var w=el("label",{class:"et-field"},label),e=el("input",{type:"number",step:"any",min:min,max:max,"data-key":key,"aria-label":label});fields[key]=e;w.appendChild(e);controls.appendChild(w);}
select("mode","实验模型",MODES);select("preset","天体参数（用于静止钟与潮汐）",PRESETS);
input("height","高差h：0或至少1纳米，最多30000 km（m）",0,3e7);
input("separation","双球分离ℓ：0或至少1纳米，最多1000 m",0,1000);
input("angle","分离与径向夹角θ（0–90°）",0,90);
input("acceleration","Rindler下钟固有加速度a₀（m/s²）",.001,1e16);
input("chi","Rindler χ=a₀L/c²：0或10⁻²⁴–2",0,2);
lab.appendChild(controls);lab.appendChild(el("p",{class:"et-note"},"切换天体会载入该天体的默认高差。静止钟和潮汐使用h；Rindler独立使用a₀与χ。表中小数为数值模型，不是测量数据。"));
var questions=[
["上钟接收到低处发来的光频率变小，是否意味着上钟本身走得更慢？",["否，比较对象与分母不同","是，两者是同一个比值"]],
["加速实验室存在钟速梯度，是否足以证明时空曲率非零？",["不足；Rindler就是平直反例","足够；任何红移都说明曲率"]],
["同一半径同样分离长度，横向与径向潮汐是否相同？",["不同，横向压缩而径向伸长","相同，都用2GMℓ/r³"]],
["毫米高差中，显示出的频率比舍入到1，能否断言红移严格为0？",["不能，需要稳定计算微小差","可以，显示值就是精确值"]]
],buttons=[];
questions.forEach(function(q,i){var w=el("section",{class:"et-question","data-question":i});w.appendChild(el("p",{},(i+1)+". "+q[0]));var opts=el("div",{class:"et-choices"});buttons[i]=[];q[1].forEach(function(t,j){var b=el("button",{type:"button","data-choice":j,"aria-pressed":"false"},t);b.onclick=function(){state.predictions[i]=j;buttons[i].forEach(function(b,k){b.setAttribute("aria-pressed",k===j?"true":"false");});validate(false);if(state.revealed&&!state.error)feedback.textContent=state.predictions.filter(function(x){return x===0;}).length+" / 4 个预测命中。读数使用表中明确的模型与参考钟。";};buttons[i].push(b);opts.appendChild(b);});w.appendChild(opts);lab.appendChild(w);});
var actions=el("div",{class:"et-actions"}),submit=el("button",{type:"button","data-action":"submit"},"揭示并核对"),reset=el("button",{type:"button","data-action":"reset"},"重置");actions.appendChild(submit);actions.appendChild(reset);lab.appendChild(actions);
var feedback=el("p",{class:"et-feedback",role:"status"},"先回答四个预测。"),results=el("div",{class:"et-results",hidden:""});lab.appendChild(feedback);lab.appendChild(results);root.replaceChildren(lab);
function read(){var o={};Object.keys(fields).forEach(function(k){var e=fields[k];if(e.tagName==="SELECT")o[k]=e.value;else{if(e.value.trim()===""||!e.validity.valid)throw Error(e.getAttribute("aria-label")+"：输入无效，保留原值");o[k]=Number(e.value);}});return config(o);}
function validate(auto){try{last=read();submit.disabled=state.predictions.some(function(x){return x===null;})||(state.revealed&&!state.error);if(state.error||!state.revealed){results.hidden=true;if(!submit.disabled)feedback.textContent="参数与预测已记录，点击揭示。";}else if(auto)render(snapshot(last));}catch(e){state.error=true;results.hidden=true;submit.disabled=true;feedback.textContent=e.message;}}
var colors=["#347fbd","#b87b20","#348557","#af4f96"];
function svg(p){
var ns="http://www.w3.org/2000/svg";function e(tag,attrs,text){var n=doc.createElementNS(ns,tag);Object.keys(attrs||{}).forEach(function(k){n.setAttribute(k,attrs[k]);});if(text!==undefined)n.textContent=text;return n;}
var s=e("svg",{viewBox:"0 0 900 440",role:"img","aria-label":p.title}),x=function(v){return 120+740*(v-p.xmin)/(p.xmax-p.xmin);},y=function(v){return 310-230*(v-p.ymin)/(p.ymax-p.ymin);};
s.appendChild(e("title",{},p.title));s.appendChild(e("text",{x:30,y:30,fill:"currentColor","font-size":17},p.title));
for(var i=0;i<=4;i++){var xv=p.xmin+(p.xmax-p.xmin)*i/4,yv=p.ymin+(p.ymax-p.ymin)*i/4;s.appendChild(e("line",{x1:120,x2:860,y1:y(yv),y2:y(yv),stroke:"currentColor","stroke-opacity":.2}));s.appendChild(e("text",{x:112,y:y(yv)+4,"text-anchor":"end",fill:"currentColor","font-size":12},fmt(yv)));s.appendChild(e("text",{x:x(xv),y:335,"text-anchor":"middle",fill:"currentColor","font-size":12},fmt(xv)));}
p.series.forEach(function(q,j){var xs=q.xs||p.xs,segments=[],part=[];q.values.forEach(function(v,i){if(v===null){if(part.length)segments.push(part);part=[];return;}var xp=x(xs[i]),yp=y(v);part.push(xp+","+yp);s.appendChild(e("circle",{"data-series":q.key,"data-index":i,cx:xp,cy:yp,r:2,fill:colors[j%4]}));});if(part.length)segments.push(part);segments.forEach(function(seg,k){s.appendChild(e("polyline",{"data-series":q.key,"data-chunk":k,points:seg.join(" "),fill:"none",stroke:colors[j%4],"stroke-width":1.8}));});});
s.appendChild(e("text",{x:490,y:376,"text-anchor":"middle",fill:"currentColor","font-size":15},p.xlabel));s.appendChild(e("text",{x:490,y:407,"text-anchor":"middle",fill:"currentColor","font-size":14},"纵轴："+p.ylabel));return s;
}
function region(label){return el("div",{class:"et-region",role:"region",tabindex:"0","aria-label":label+"，可左右滚动"});}
function render(s){results.replaceChildren();var h=el("h4",{tabindex:"-1"},"实验结果与完整账本");results.appendChild(h);
plots(s).forEach(function(p){var r=region(p.title);r.appendChild(svg(p));var l=el("div",{class:"et-legend"});p.series.forEach(function(q,j){var t=el("span",{},q.label);t.style.color=colors[j%4];l.appendChild(t);});r.appendChild(l);results.appendChild(r);});
ledgers(s).forEach(function(d){var r=region(d.title),t=el("table",{"data-table":d.key});t.appendChild(el("caption",{},d.title));var th=el("tr",{});d.headers.forEach(function(h){th.appendChild(el("th",{scope:"col"},h));});t.appendChild(el("thead",{}));t.lastChild.appendChild(th);var body=el("tbody",{});d.rows.forEach(function(row){var tr=el("tr",{});row.forEach(function(v){tr.appendChild(el("td",{},fmt(v)));});body.appendChild(tr);});t.appendChild(body);r.appendChild(t);results.appendChild(r);});results.hidden=false;
}
submit.onclick=function(){try{last=read();if(state.predictions.some(function(x){return x===null;}))return;state.error=false;state.revealed=true;render(snapshot(last));submit.disabled=true;feedback.textContent=state.predictions.filter(function(x){return x===0;}).length+" / 4 个预测命中。读数使用表中明确的模型与参考钟。";results.querySelector("h4").focus();}catch(e){state.error=true;results.hidden=true;submit.disabled=true;feedback.textContent=e.message;}};
function defaults(){Object.keys(fields).forEach(function(k){fields[k].value=String(DEFAULTS[k]);});}
reset.onclick=function(){defaults();state={predictions:[null,null,null,null],revealed:false,error:false};buttons.flat().forEach(function(b){b.setAttribute("aria-pressed","false");});results.replaceChildren();results.hidden=true;feedback.textContent="先回答四个预测。";validate(false);buttons[0][0].focus();};
Object.keys(fields).forEach(function(k){fields[k].addEventListener(fields[k].tagName==="SELECT"?"change":"input",function(){if(k==="preset")fields.height.value=String(PRESETS[fields.preset.value].height);validate(true);});});defaults();validate(false);
}
return {mount:mount,ledgers:ledgers,plots:plots,G:G,C:C,PRESETS:PRESETS,MODES:MODES,DEFAULTS:DEFAULTS,config:config,clockAt:clockAt,rindlerAt:rindlerAt,tidalAt:tidalAt,snapshot:snapshot,fmt:fmt,selfTest:selfTest};
});
