(function(root,factory){"use strict";var api=factory();if(typeof module==="object"&&module.exports)module.exports=api;if(root&&root.CourseLearning)root.CourseLearning.register("schwarzschild-orbits",api.mount);})(typeof window!=="undefined"?window:null,function(){
"use strict";
var MODES=Object.freeze({potential:"类时：全外部有效势与根",photon:"光子：捕获、临界与散射",precession:"束缚轨道：精确进动与弱场近似"});
var LEVELS=Object.freeze({manual:"手动K",stable:"加载外支稳定圆轨道能量",unstable:"加载内支不稳定圆轨道能量",isco:"精确ISCO（要求q=12）"});
var DEFAULTS=Object.freeze({mode:"potential",q:16,K:-.0246875,level:"manual",beta:1.2,p:10,e:.3});
function finite(x,lo,hi,key){if(typeof x!=="number"||!Number.isFinite(x)||x<lo||x>hi)throw RangeError(key+" must be in ["+lo+","+hi+"]");return x;}
function config(o){if(!o||typeof o!=="object"||Array.isArray(o))throw TypeError("config object required");var c=Object.assign({},DEFAULTS,o);if(typeof c.mode!=="string"||!Object.hasOwn(MODES,c.mode))throw RangeError("mode");if(typeof c.level!=="string"||!Object.hasOwn(LEVELS,c.level))throw RangeError("level");finite(c.q,0,100,"q");finite(c.K,-.12,.2,"K");if(c.K!==0&&Math.abs(c.K)<1e-12)throw RangeError("K must be zero or have magnitude at least 1e-12");finite(c.beta,0,4,"beta");finite(c.p,6,1e8,"p");finite(c.e,0,.9,"e");if(c.mode==="potential"){if(c.level==="isco"&&c.q!==12)throw RangeError("exact ISCO requires q=12");if(["stable","unstable"].includes(c.level)&&c.q<=12)throw RangeError("two circular branches require q>12");}if(c.mode==="precession"&&c.p<6+2*c.e+.02)throw RangeError("this model requires p >= 6+2e+0.02");return c;}
function unique(xs){return Array.from(new Set(xs)).sort(function(a,b){return a-b;});}
function potential(u,q){return u*(q*u*(.5-u)-1);}
function radial(u,q,K){return 2*K+u*(2+q*u*(2*u-1));}
function circular(q){
 finite(q,0,100,"q");if(q<12)return[];
 function row(u,type){var r=1/u,K=potential(u,q);return{u:u,r:r,type:type,K:K,E:Math.sqrt(1+2*K),second:(r-6)/(r*r*r*(r-3))};}
 if(q===12)return[row(1/6,"ISCO")];
 var w=Math.sqrt(1-12/q);return[row((1+w)/6,"不稳定"),row(2/(q*(1+w)),"稳定")];
}
function bisect(fn,a,b){var fa=fn(a),fb=fn(b);if(fa===0)return a;if(fb===0)return b;if(!(fa*fb<0))throw Error("not bracketed");for(var i=0;i<120;i++){var m=a+(b-a)/2;if(m===a||m===b)return m;var fm=fn(m);if(fm===0)return m;if((fm>0)===(fa>0)){a=m;fa=fm;}else b=m;}return a+(b-a)/2;}
function intervals(fn,roots){var cuts=unique([0,.5].concat(roots.map(function(r){return r.u;}))),out=[];for(var i=0;i<cuts.length-1;i++){var a=cuts[i],b=cuts[i+1];if(fn((a+b)/2)>0)out.push({uMin:a,uMax:b,rMin:1/b,rMax:a===0?null:1/a});}return out;}
function timelike(o){
 if(o!==undefined&&(!o||typeof o!=="object"||Array.isArray(o)))throw TypeError("config object required");
 var c=config(Object.assign({},o,{mode:"potential"})),orbits=circular(c.q),q=c.q,K=c.K,rootRows=[],status="resolved",reason="",critical=null,fn;
 if(c.level!=="manual"){
  critical=c.level==="isco"?orbits[0]:orbits[c.level==="stable"?1:0];K=critical.K;
  var u0=critical.u,other=.5-2*u0;
  if(c.level==="isco"){fn=function(u){return 24*Math.pow(u-1/6,3);};rootRows=[{u:1/6,r:6,multiplicity:3,kind:"临界圆轨道；非普通反弹点"}];}
  else{
   fn=function(u){return 2*q*(u-u0)*(u-u0)*(u-other);};
   rootRows=[{u:u0,r:1/u0,multiplicity:2,kind:c.level==="stable"?"孤立稳定圆轨道":"不稳定圆轨道；渐近端点"}];
   if(other>0&&other<.5)rootRows.push({u:other,r:1/other,multiplicity:1,kind:"普通转向点"});
  }
 }else{
  fn=function(u){return radial(u,q,K);};
  // Close-to-critical inputs are retained and plotted, but no uncertified root classification is emitted.
  var unresolved=orbits.filter(function(r){return Math.abs(K-r.K)<=64*Number.EPSILON*Math.max(1,Math.abs(K),Math.abs(r.K));});
  if(unresolved.length){status="unresolved";reason="手动能量距圆轨道阈值低于此双精度分类的分辨率；请选择明确圆轨道模型或改变K。";}
  else{
   var cuts=unique([0,.5].concat(orbits.map(function(r){return r.u;})));
   for(var i=0;i<cuts.length-1;i++){var a=cuts[i],b=cuts[i+1],fa=fn(a),fb=fn(b);if(fa*fb<0){var u=bisect(fn,a,b);rootRows.push({u:u,r:1/u,multiplicity:1,kind:"普通转向点"});}}
  }
 }
 rootRows.sort(function(a,b){return a.u-b.u;});rootRows.forEach(function(r){r.residual=fn(r.u);});
 var allowed=status==="resolved"?intervals(fn,rootRows):[];
 var grid=unique(Array.from({length:501},function(_,i){return i/1000;}).concat(rootRows.map(function(r){return r.u;}),orbits.map(function(r){return r.u;})));
 return{config:c,q:q,ell:Math.sqrt(q),K:K,E:Math.sqrt(1+2*K),orbits:orbits,roots:rootRows,allowed:allowed,status:status,reason:reason,critical:critical,
 rows:grid.map(function(u){return{u:u,r:u===0?null:1/u,potential:potential(u,q),K:K,radialSquared:fn(u),newton:-u+.5*q*u*u};})};
}
function photon(beta){
 finite(beta,0,4,"beta");var b=3*Math.sqrt(3)*beta,fn=function(u){return -(beta-1)*(beta+1)+beta*beta*(1-3*u)*(1-3*u)*(1+6*u);},roots=[],kind;
 if(beta<1)kind="从无穷远入射会被捕获";
 else if(beta===1){kind="临界：渐近光子圆轨道";roots=[{u:1/3,r:3,multiplicity:2,kind:"渐近端点"}];}
 else{kind="从无穷远入射会散射返回";for(var bracket of [[0,1/3],[1/3,.5]]){var u=bisect(fn,bracket[0],bracket[1]);roots.push({u:u,r:1/u,multiplicity:1,kind:"普通转向点"});}}
 roots.forEach(function(r){r.residual=fn(r.u);});
 var us=unique(Array.from({length:501},function(_,i){return i/1000;}).concat([1/3],roots.map(function(r){return r.u;})));
 return{beta:beta,b:b,kind:kind,roots:roots,allowed:intervals(fn,roots),closestFromInfinity:beta>1?roots[0].r:beta===1?3:null,
 rows:us.map(function(u){return{u:u,r:u===0?null:1/u,barrier:27*beta*beta*u*u*(1-2*u),radialSquared:fn(u),energy:1};})};
}
function excess(p,e,chi){var alpha=6+2*e*Math.cos(chi),x=alpha/p,s=Math.sqrt(1-x);return x/(s*(1+s));}
function integrateAdvance(p,e,n,higher){
 var step=2*Math.PI/n,sum=0,correction=0;
 for(var i=0;i<=n;i++){var w=i===0||i===n?1:i%2?4:2,x=(6+2*e*Math.cos(i*step))/p,s=Math.sqrt(1-x),value=w*(higher?x*x*(s+2)/(2*s*(1+s)*(1+s)):excess(p,e,i*step)),y=value-correction,t=sum+y;correction=(t-sum)-y;sum=t;}
 return sum*step/3;
}
function precession(p,e){
 finite(p,6,1e8,"p");finite(e,0,.9,"e");if(p<6+2*e+.02)throw RangeError("p must be >=6+2e+0.02");
 var n=1024,step=2*Math.PI/n,rows=[],cumulative=0;
 // Boole's rule per displayed interval; all three interior evaluations are retained.
 for(var i=0;i<=n;i++){
  var chi=i*step,v=excess(p,e,chi),mid=i?excess(p,e,chi-step/2):null,q1=i?excess(p,e,chi-3*step/4):null,q3=i?excess(p,e,chi-step/4):null;
  if(i)cumulative+=step*(7*rows[i-1].excess+32*q1+12*mid+32*q3+7*v)/90;
  var ratio=1/(1+e*Math.cos(chi)),phi=chi+cumulative;
  rows.push({i:i,chi:chi,r:p*ratio,rOverP:ratio,excess:v,quarter1Excess:q1,midpointExcess:mid,quarter3Excess:q3,advanceSoFar:cumulative,phi:phi,x:ratio*Math.cos(phi),y:ratio*Math.sin(phi),newtonX:ratio*Math.cos(chi),newtonY:ratio*Math.sin(chi)});
 }
 var delta=integrateAdvance(p,e,2048),weak=6*Math.PI/p,convergence=[256,512,1024,2048].map(function(n){return{n:n,advance:integrateAdvance(p,e,n)};});
 var q=p*p/(p-3-e*e),K=(1-e*e)*(4-p)/(2*p*(p-3-e*e)),E2=1+2*K,higher=integrateAdvance(p,e,2048,true);
 var second=rows.slice(1).map(function(r){var phi=r.phi+2*Math.PI+delta;return{chi:r.chi+2*Math.PI,phi:phi,rOverP:r.rOverP,x:r.rOverP*Math.cos(phi),y:r.rOverP*Math.sin(phi)};});
 return{p:p,e:e,gap:p-6-2*e,q:q,E:Math.sqrt(E2),K:K,periapsis:p/(1+e),apoapsis:p/(1-e),advance:delta,weak:weak,higher:higher,relativeWeakError:higher/delta,frequencyRatio:1+delta/(2*Math.PI),circularLimit:e===0,rows:rows,secondCycle:second,convergence:convergence,convergenceDifference:Math.abs(convergence[3].advance-convergence[2].advance)};
}
function snapshot(o){var c=config(o===undefined?{}:o),s=c.mode==="potential"?timelike(c):c.mode==="photon"?photon(c.beta):precession(c.p,c.e);s.config=c;return s;}
function fmt(v){if(v===null)return"—（边界或不适用）";if(typeof v!=="number")return String(v);if(!Number.isFinite(v))throw Error("nonfinite display");if(v===0)return"0";return v.toPrecision(8).replace(/e-/g,"e−");}
function selfTest(){var checks=0;function ck(x,s){checks++;if(!x)throw Error(s);}ck(circular(11.99999999).length===0,"below threshold");ck(circular(12).length===1,"exact threshold");ck(circular(12.00000001).length===2,"above threshold");var a=timelike({q:12,level:"isco"});ck(a.roots.length===1&&a.roots[0].multiplicity===3,"triple");a=timelike({q:16,level:"stable"});ck(a.roots.length===2&&a.roots.some(function(r){return r.r===12;}),"stable");ck(photon(1).roots[0].multiplicity===2,"photon critical");ck(photon(.99999999).roots.length===0,"capture");ck(photon(1.00000001).roots.length===2,"scatter");var s=precession(1e8,.2);ck(s.advance>0&&Math.abs(s.advance/s.weak-1)<1e-6,"weak advance");return{status:"PASS",checks:checks};}
function ledgers(s){
var mode=s.config.mode,tables=[],summary;
function add(key,title,headers,rows){tables.push({key:key,title:title,headers:headers,rows:rows});}
if(mode==="potential"){
summary=[["模型","类时测试粒子","G=M=c=1；只算r>2的真空外部"],["q=ℓ² / ℓ",s.q,s.ell],["实际K / E",s.K,s.E],["输入方式",LEVELS[s.config.level],"手动K仅在手动模式中决定能量"],["根分类",s.status,s.reason||"普通根、重根及分离允许区分别列出"],["极值 / 外部根数量",s.orbits.length,s.roots.length],["边界u=0 / u=0.5","r→∞ / r→2+","图含边界极限；两端不属于开放外部域"]];
add("circles","圆轨道：极值与稳定性",["u","r","类型","K","E","V″(r)"],s.orbits.map(function(r){return[r.u,r.r,r.type,r.K,r.E,r.second];}));
}else if(mode==="photon"){
summary=[["模型","无穷远入射、初始向内的光子","守恒量按光子能量归一化"],["β=b/(3√3) / b",s.beta,s.b],["入射结果",s.kind,"β=1是明确临界输入；不以容差吞并两侧"],["无穷远入射最近半径",s.closestFromInfinity,s.beta===1?"渐近r=3，不能在有限仿射参数到达":s.beta<1?"无外部转向点；穿过视界":"到外根后散射返回"],["光子球 / 视界",3,2],["边界说明","u=0和u=0.5为极限","阴影也可能含入射光无法抵达的另一分支"]];
}else{
summary=[["模型","Schwarzschild束缚测试粒子","无自力、无辐射；p≥6+2e+0.02"],["p / e",s.p,s.e],["距分界线p−6−2e",s.gap,"网格精度限制；不是物理新分界线"],["q / E",s.q,s.E],["K",s.K,"由精确端点参数得到"],["近日点 / 远日点半径",s.periapsis,s.apoapsis],["精确进动(rad/径向周期)",s.advance,"2048子区间复合Simpson"],["1PN进动(rad/径向周期)",s.weak,"6π/p"],["一阶近似相对误差",s.relativeWeakError,"(精确−1PN)/精确；稳定计算高阶余项"],["方位/径向频率比",s.frequencyRatio,s.circularLimit?"e=0：解释为圆轨道附近微扰极限":"一个径向周期的总角/2π"],["2048与1024进动之差",s.convergenceDifference,"收敛诊断；不是严格误差界"],["图形相位末值减2π",s.rows[s.rows.length-1].advanceSoFar,"逐段Boole，独立于上方整周期Simpson"],["圆轨道解释",s.circularLimit?"无唯一近日点":"近日点方向随径向周期改变","坐标轨迹，不是相机成像"]];
add("convergence","整周期求积收敛对照",["Simpson子区间数","进动(rad)"],s.convergence.map(function(r){return[r.n,r.advance];}));
add("quadrature","完整求积账本：1025端点与3072内部评估",["i","χ","f(χ)","前段1/4的f","前段1/2的f","前段3/4的f","累计额外角","φ=χ+额外角"],s.rows.map(function(r){return[r.i,r.chi,r.excess,r.quarter1Excess,r.midpointExcess,r.quarter3Excess,r.advanceSoFar,r.phi];}));
add("orbit","第一径向周期：完整1025轨迹节点",["χ","r","r/p","φ","x/p","y/p","Newton x/p","Newton y/p"],s.rows.map(function(r){return[r.chi,r.r,r.rOverP,r.phi,r.x,r.y,r.newtonX,r.newtonY];}));
add("secondCycle","第二径向周期：完整1024后续节点",["χ","φ","r/p","x/p","y/p"],s.secondCycle.map(function(r){return[r.chi,r.phi,r.rOverP,r.x,r.y];}));
}
if(mode!=="precession"){
add("roots","外部根：重数决定能否普通反弹",["u","r","重数","类型","数值残差"],s.roots.map(function(r){return[r.u,r.r,r.multiplicity,r.kind,r.residual];}));
add("allowed","径向速度平方严格为正的连通区间",["u下界","u上界","r下界","r上界"],s.allowed.map(function(r){return[r.uMin,r.uMax,r.rMin,r.rMax===null?"∞":r.rMax];}));
add("nodes","全外部节点：边界极限、全部极值与全部根",mode==="potential"?["u","r","V","实际K","(dr/dτ)²","Newton V"]:["u","r","光子势垒","归一化能量","归一化径向速度²"],s.rows.map(function(r){return mode==="potential"?[r.u,r.r,r.potential,r.K,r.radialSquared,r.newton]:[r.u,r.r,r.barrier,r.energy,r.radialSquared];}));
}
tables.unshift({key:"summary",title:"当前参数、可观测量与模型条件",headers:["量","读数","解释或第二读数"],rows:summary});return tables;
}
function plots(s){
function curve(title,xlabel,ylabel,rows,xkey,series){
var xs=rows.map(function(r){return r[xkey];}),all=[];
series.forEach(function(q){q.values=rows.map(function(r){var v=q.value?q.value(r):r[q.key];all.push(v);return v;});});
var lo=Math.min.apply(null,all.concat([0])),hi=Math.max.apply(null,all.concat([0])),pad=(hi-lo)*.08||1;
return{title:title,xlabel:xlabel,ylabel:ylabel,xmin:Math.min.apply(null,xs),xmax:Math.max.apply(null,xs),ymin:lo-pad,ymax:hi+pad,xs:xs,series:series};
}
var a,b,mode=s.config.mode;
if(mode==="potential"){
a=curve("类时：紧化横轴覆盖整个真空外部","u=1/r；左端∞，右端视界r=2","每单位质量的有效势",s.rows,"u",[{key:"potential",label:"Schwarzschild V"},{key:"K",label:"实际K"},{key:"newton",label:"Newton V"}]);
b=curve("类时：只有F>0的区间允许径向运动","u=1/r（仍绘制dr/dτ，而不是du/dτ）","F=(dr/dτ)²",s.rows,"u",[{key:"radialSquared",label:"径向速度平方"}]);b.allowed=s.allowed;b.roots=s.roots;
}else if(mode==="photon"){
a=curve("光子：归一化势垒与入射能量","u=1/r；光子球位于u=1/3","势垒/光子能量²",s.rows,"u",[{key:"barrier",label:"27β²u²(1−2u)"},{key:"energy",label:"归一化能量1"}]);
b=curve("光子：入射光只能沿连通允许分支传播","u=1/r；不能跨过F<0禁区","归一化径向速度平方",s.rows,"u",[{key:"radialSquared",label:"1−27β²u²(1−2u)"}]);b.allowed=s.allowed;b.roots=s.roots;
}else{
var span=1/(1-s.e)*1.06,joined=[s.rows[s.rows.length-1]].concat(s.secondCycle);
a={title:s.circularLimit?"圆轨道：几何圆与径向微扰频率分开":"相同尺度的两次径向周期：近日点方向改变",xlabel:"x/p（横纵等比例）",ylabel:"y/p",xmin:-span,xmax:span,ymin:-span,ymax:span,equalAspect:true,
xs:s.rows.map(function(r){return r.x;}),series:[{key:"first",label:"第一径向周期",values:s.rows.map(function(r){return r.y;})},{key:"second",label:"第二径向周期",xs:joined.map(function(r){return r.x;}),values:joined.map(function(r){return r.y;})},{key:"newton",label:"Newton闭合椭圆参考",xs:s.rows.map(function(r){return r.newtonX;}),values:s.rows.map(function(r){return r.newtonY;})}]};
b=curve("额外角的累积：整周期再比较1PN","Darwin径向相位χ（rad）","φ−χ（rad）",s.rows,"chi",[{key:"advanceSoFar",label:"精确积分数值相位"},{key:"weak",label:"1PN局部积分",value:function(r){return(3*r.chi+s.e*Math.sin(r.chi))/s.p;}}]);
}return[a,b];
}
var SO_INSTANCE=0;
function mount(root){
var doc=root.ownerDocument,id="so126-"+(++SO_INSTANCE),fields={},state={predictions:[null,null,null,null],revealed:false,error:false},last=null;
if(!doc.getElementById("so126-style")){
var style=doc.createElement("style");style.id="so126-style";
style.textContent=".so126{color:var(--fg);line-height:1.65;min-width:0}.so126 *{box-sizing:border-box}.so126 [hidden]{display:none!important}.so126 input,.so126 select,.so126 button{font:inherit;min-height:44px;background:var(--bg);color:var(--fg);border:1px solid var(--border);border-radius:5px;padding:7px}.so126 input,.so126 select{width:100%}.so126 button{cursor:pointer}.so126 button:disabled{opacity:.5;cursor:default}.so126 .so-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.so126 .so-field{display:grid;gap:4px;min-width:0}.so126 .so-question{margin:14px 0;padding:12px;border:1px solid var(--border)}.so126 .so-choices,.so126 .so-actions{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.so126 [aria-pressed=true]{background:var(--accent);color:var(--bg)}.so126 .so-region{max-width:100%;overflow:auto;margin:14px 0}.so126 details .so-region{max-height:480px}.so126 summary{cursor:pointer;padding:12px;border:1px solid var(--border)}.so126 .so-region:focus-visible,.so126 button:focus-visible,.so126 input:focus-visible,.so126 select:focus-visible,.so126 summary:focus-visible{outline:3px solid var(--accent);outline-offset:2px}.so126 svg{display:block;width:900px;min-width:900px;max-width:none;background:var(--bg);color:var(--fg)}.so126 table{min-width:900px;width:100%;border-collapse:collapse;font-size:14px}.so126 th,.so126 td{padding:9px;border:1px solid var(--border);text-align:left;vertical-align:top}.so126 caption{font-weight:700;text-align:left;margin:8px 0}.so126 .so-feedback{padding:10px;border-left:3px solid var(--accent)}.so126 .so-legend{min-width:900px;display:flex;gap:20px;flex-wrap:wrap}.so126 .so-note{font-size:14px;color:var(--fg-soft)}@media(max-width:700px){.so126 .so-controls{grid-template-columns:1fr}}";
doc.head.appendChild(style);}
function el(tag,attrs,text){var e=doc.createElement(tag);Object.keys(attrs||{}).forEach(function(k){e.setAttribute(k,attrs[k]);});if(text!==undefined)e.textContent=text;return e;}
var lab=el("div",{class:"so126"});lab.appendChild(el("h3",{},"从允许区到近日点进动：三个模型逐项核对"));
var controls=el("div",{class:"so-controls"});
function select(key,label,options){var w=el("label",{class:"so-field"},label),e=el("select",{"data-key":key,"aria-label":label});Object.keys(options).forEach(function(k){e.appendChild(el("option",{value:k},options[k]));});fields[key]=e;w.appendChild(e);controls.appendChild(w);}
function input(key,label,min,max){var w=el("label",{class:"so-field"},label),e=el("input",{type:"number",step:"any",min:min,max:max,"data-key":key,"aria-label":label});fields[key]=e;w.appendChild(e);controls.appendChild(w);}
select("mode","实验模型",MODES);
input("q","类时 q=ℓ²（0–100）",0,100);
select("level","类时能量输入方式",LEVELS);
input("K","手动K（−0.12–0.2；非零绝对值至少10⁻¹²）",-.12,.2);
input("beta","光子 β=b/(3√3)（0–4）",0,4);
input("p","束缚轨道 p（6+2e+0.02 至10⁸）",6,1e8);
input("e","束缚轨道 e（0–0.9）",0,.9);
lab.appendChild(controls);
lab.appendChild(el("p",{class:"so-note"},"三个模型分别使用q与能量、β、p与e。所有输入仍须是有效数值；仅当前模型检查参数间的条件。解析圆轨道模式直接使用重根模型，不能把舍入后的手动K当作精确临界值。"));
var presets=el("div",{class:"so-actions"});
[
["普通束缚区",{mode:"potential",q:16,K:-.0246875,level:"manual"}],
["孤立稳定圆轨道",{mode:"potential",q:16,level:"stable"}],
["精确ISCO",{mode:"potential",q:12,level:"isco"}],
["临界光子",{mode:"photon",beta:1}],
["近分界线进动",{mode:"precession",p:7.82,e:.9}],
["近圆弱场",{mode:"precession",p:1e8,e:0}]
].forEach(function(pair){var b=el("button",{type:"button","data-preset":pair[0]},pair[0]);b.onclick=function(){Object.keys(pair[1]).forEach(function(k){fields[k].value=String(pair[1][k]);});validate(true);};presets.appendChild(b);});
lab.appendChild(presets);
var questions=[
["q略小于12、恰为12、略大于12，能否都称为同一个ISCO？",["不能，圆轨道根结构不同","可以，用一个小容差统一"]],
["光子轨道能否只靠改变类时能量E来计算？",["不能，归一化与径向方程不同","可以，其余方程全部照用"]],
["孤立稳定圆轨道与有限束缚区，是否描述同一类径向初值？",["不是，孤立点没有有限振幅径向往返","是，所有根之间都可运动"]],
["e=0时，是否仍有唯一近日点方向可直接观测进动？",["没有；频率比解释为微扰极限","有，圆轨道上可任选一个当真实近日点"]]
],buttons=[];
questions.forEach(function(q,i){var w=el("section",{class:"so-question","data-question":i});w.appendChild(el("p",{},(i+1)+". "+q[0]));var opts=el("div",{class:"so-choices"});buttons[i]=[];q[1].forEach(function(t,j){var b=el("button",{type:"button","data-choice":j,"aria-pressed":"false"},t);b.onclick=function(){state.predictions[i]=j;buttons[i].forEach(function(b,k){b.setAttribute("aria-pressed",k===j?"true":"false");});validate(false);if(state.revealed&&!state.error)feedback.textContent=score();};buttons[i].push(b);opts.appendChild(b);});w.appendChild(opts);lab.appendChild(w);});
var actions=el("div",{class:"so-actions"}),submit=el("button",{type:"button","data-action":"submit"},"揭示并核对"),reset=el("button",{type:"button","data-action":"reset"},"重置");actions.appendChild(submit);actions.appendChild(reset);lab.appendChild(actions);
var feedback=el("p",{class:"so-feedback",role:"status"},"先回答四个预测。"),results=el("div",{class:"so-results",hidden:""});lab.appendChild(feedback);lab.appendChild(results);root.replaceChildren(lab);
function score(){return state.predictions.filter(function(x){return x===0;}).length+" / 4 个预测命中。先确认当前模型，再检查根、允许区和量的单位。";}
function read(){var o={};Object.keys(fields).forEach(function(k){var e=fields[k];if(e.tagName==="SELECT")o[k]=e.value;else{if(e.value.trim()===""||!e.validity.valid)throw Error(e.getAttribute("aria-label")+"：输入无效，保留原值");o[k]=Number(e.value);}});return config(o);}
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
p.series.forEach(function(q,j){var xs=q.xs||p.xs,points=[];q.values.forEach(function(v,i){var xp=x(xs[i]),yp=y(v);points.push(xp+","+yp);s.appendChild(e("circle",{"data-series":q.key,"data-index":i,cx:xp,cy:yp,r:1.5,fill:colors[j%4]}));});s.appendChild(e("polyline",{"data-series":q.key,points:points.join(" "),fill:"none",stroke:colors[j%4],"stroke-width":1.6,"stroke-dasharray":q.key==="newton"?"5 4":"none"}));});
(p.roots||[]).forEach(function(r,i){s.appendChild(e("circle",{"data-root":i,cx:x(r.u),cy:y(0),r:r.multiplicity>1?6:4,fill:"var(--bg)",stroke:"currentColor","stroke-width":2}));});
s.appendChild(e("text",{x:450,y:bottom+65,"text-anchor":"middle",fill:"currentColor","font-size":15},p.xlabel));s.appendChild(e("text",{x:450,y:bottom+96,"text-anchor":"middle",fill:"currentColor","font-size":14},"纵轴："+p.ylabel));return s;
}
function region(label){return el("div",{class:"so-region",role:"region",tabindex:"0","aria-label":label+"，可滚动查看全部内容"});}
function render(s){
results.replaceChildren();results.appendChild(el("h4",{tabindex:"-1"},"实验结果与完整账本"));
if(s.status==="unresolved")results.appendChild(el("p",{class:"so-feedback"},s.reason));
if(s.config.mode==="precession"&&s.circularLimit)results.appendChild(el("p",{class:"so-feedback"},"当前e=0：轨迹是圆；进动读数只表示附近径向微扰的频率极限。"));
plots(s).forEach(function(p){var r=region(p.title);r.appendChild(svg(p));var l=el("div",{class:"so-legend"});p.series.forEach(function(q,j){var t=el("span",{},q.label);t.style.color=colors[j%4];l.appendChild(t);});if(p.allowed)l.appendChild(el("span",{},"浅绿：F>0连通区；圆圈：根，重根不自动是反弹点"));r.appendChild(l);results.appendChild(r);});
ledgers(s).forEach(function(d){var r=region(d.title),t=el("table",{"data-table":d.key});t.appendChild(el("caption",{},d.title));var th=el("tr",{});d.headers.forEach(function(h){th.appendChild(el("th",{scope:"col"},h));});t.appendChild(el("thead",{}));t.lastChild.appendChild(th);var body=el("tbody",{});d.rows.forEach(function(row){var tr=el("tr",{});row.forEach(function(v){tr.appendChild(el("td",{},fmt(v)));});body.appendChild(tr);});t.appendChild(body);r.appendChild(t);
if(d.key==="summary")results.appendChild(r);else{var detail=el("details",{"data-ledger":d.key});detail.appendChild(el("summary",{},d.title+"（"+d.rows.length+"行）"));detail.appendChild(r);if(d.rows.length===0)detail.appendChild(el("p",{},"此参数下没有此类条目；未解析状态不代表已经证明不存在。"));results.appendChild(detail);}});
results.hidden=false;
}
submit.onclick=function(){try{last=read();if(state.predictions.some(function(x){return x===null;}))return;state.error=false;state.revealed=true;render(snapshot(last));submit.disabled=true;feedback.textContent=score();results.querySelector("h4").focus();}catch(e){state.error=true;results.hidden=true;submit.disabled=true;feedback.textContent=e.message;}};
function defaults(){Object.keys(fields).forEach(function(k){fields[k].value=String(DEFAULTS[k]);});}
reset.onclick=function(){defaults();state={predictions:[null,null,null,null],revealed:false,error:false};buttons.flat().forEach(function(b){b.setAttribute("aria-pressed","false");});results.replaceChildren();results.hidden=true;feedback.textContent="先回答四个预测。";validate(false);buttons[0][0].focus();};
Object.keys(fields).forEach(function(k){fields[k].addEventListener(fields[k].tagName==="SELECT"?"change":"input",function(){validate(true);});});defaults();validate(false);
}

return{MODES:MODES,LEVELS:LEVELS,DEFAULTS:DEFAULTS,config:config,potential:potential,radial:radial,circular:circular,timelike:timelike,photon:photon,precession:precession,snapshot:snapshot,fmt:fmt,selfTest:selfTest,ledgers:ledgers,plots:plots,mount:mount};
});
