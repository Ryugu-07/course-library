(function(root,factory){"use strict";var a=factory();if(typeof module==="object"&&module.exports)module.exports=a;if(root&&root.CourseLearning)root.CourseLearning.register("physics-kerr-causality",a.mount);})(typeof window!=="undefined"?window:null,function(){"use strict";
var MODES={exterior:"外部：因果锥与局部能量",area:"面积：可逆抽取的上界"};
var ACTIVE={exterior:["spin","position","offset","velocity"],area:["spin","fraction"]};
var DEFAULTS={mode:"exterior",spin:.8,position:"offset",offset:.2,velocity:-.8,fraction:.5};
function number(x,name,min,max){if(typeof x!=="number"||!Number.isFinite(x)||x<min||x>max)throw Error(name+"超出范围或不是有限数");return x;}
function object(o){if(!o||typeof o!=="object"||Array.isArray(o))throw Error("参数须为对象");}
function config(o){if(o===undefined)o={};object(o);var c=Object.assign({},DEFAULTS,o);if(!Object.hasOwn(MODES,c.mode))throw Error("未知模型");
number(c.spin,"自旋",-.9999,.9999);number(c.offset,"外部偏移",1e-5,20);number(c.velocity,"局部方位速度",-.99,.99);number(c.fraction,"角动量抽取比例",0,1);
if(!["offset","static"].includes(c.position))throw Error("未知位置选择");
if(c.mode==="exterior"&&c.position==="static"&&Math.abs(c.spin)<.01)throw Error("精确静止极限预设要求|a*|≥0.01；a*=0时该面为视界，不能悬停");
return c;}
function horizon(spin){
number(spin,"自旋",-.9999,.9999);
var s=Math.sqrt((1-spin)*(1+spin)),outer=1+s,inner=spin*spin/outer,mirr=Math.sqrt(outer/2);
return{spin:spin,root:s,outer:outer,inner:inner,omegaH:spin/(2*outer),kappa:s/(2*outer),area:8*Math.PI*outer,mirr:mirr,extractable:spin*spin/(2*outer*(1+mirr))};
}
function at(spin,offset,exactStatic){
var h=horizon(spin);number(offset,"径向偏移",1e-5,20);
if(exactStatic!==undefined&&typeof exactStatic!=="boolean")throw Error("位置标记须为布尔值");
if(exactStatic&&Math.abs(spin)<.01)throw Error("静止极限预设要求|a*|≥0.01");
var d=exactStatic?h.inner:offset,r=exactStatic?2:h.outer+d,delta=exactStatic?spin*spin:d*(d+2*h.root),gtt=exactStatic?0:(h.inner-d)/r,gtphi=-2*spin/r,gpp=r*r+spin*spin+2*spin*spin/r;
var sq=Math.sqrt(delta),omega=-gtphi/gpp,half=sq/gpp,lower,upper;
if(spin>0){upper=(-gtphi+sq)/gpp;lower=gtt/(gpp*upper);}else if(spin<0){lower=(-gtphi-sq)/gpp;upper=gtt/(gpp*lower);}else{lower=-half;upper=half;}
var alpha=Math.sqrt(delta/gpp),groot=Math.sqrt(gpp),gap=d-h.inner,tol=64*Number.EPSILON*Math.max(1,d,h.inner);
var region=exactStatic?"static":Math.abs(gap)<=tol?"unresolved":gap<0?"ergoregion":"outside";
return{spin:spin,offset:d,radius:r,delta:delta,gtt:gtt,gtphi:gtphi,gphiphi:gpp,omega:omega,halfWidth:half,lower:lower,upper:upper,alpha:alpha,sqrtG:groot,region:region,
negativeThreshold:spin===0?null:-alpha/(omega*groot),horizon:h};
}
function particle(p,velocity){
object(p);number(velocity,"局部方位速度",-.99,.99);
var gamma=1/Math.sqrt((1-velocity)*(1+velocity)),ell=gamma*p.sqrtG*velocity;
return{velocity:velocity,gamma:gamma,energy:gamma*(p.alpha+p.omega*p.sqrtG*velocity),angularMomentum:ell,
omega:p.omega+p.alpha*velocity/p.sqrtG,uTime:gamma/p.alpha,uPhi:gamma/p.alpha*(p.omega+p.alpha*velocity/p.sqrtG),
properRate:p.alpha/gamma,causalNorm:-p.alpha*p.alpha*(1-velocity*velocity),localEnergy:gamma};
}
function exterior(o){
if(o!==undefined)object(o);
var c=config(Object.assign({},o,{mode:"exterior"})),p=at(c.spin,c.offset,c.position==="static"),h=p.horizon;
var offsets=Array.from({length:401},function(_,i){return Math.pow(10,-5+Math.log10(20/1e-5)*i/400);});offsets[0]=1e-5;offsets[400]=20;
offsets.push(p.offset);if(h.inner>=1e-5)offsets.push(h.inner);
offsets=Array.from(new Set(offsets)).sort(function(a,b){return a-b;});
var radial=offsets.map(function(d,i){var q=at(c.spin,d,d===h.inner&&Math.abs(c.spin)>=.01);q.i=i;q.logOffset=Math.log10(q.offset);return q;});
var velocities=Array.from({length:397},function(_,i){return -.99+.005*i;});velocities[0]=-.99;velocities[396]=.99;velocities.push(c.velocity,0);
if(p.negativeThreshold!==null&&Math.abs(p.negativeThreshold)<=.99)velocities.push(p.negativeThreshold);
velocities=Array.from(new Set(velocities)).sort(function(a,b){return a-b;});
var velocityRows=velocities.map(function(v,i){return Object.assign({i:i},particle(p,v));});
var surfaces=Array.from({length:361},function(_,i){var theta=i/2,rad=theta*Math.PI/180,co=i===180?0:i===0?1:i===360?-1:Math.cos(rad),se=i===0||i===360?0:i===180?1:Math.sin(rad);
var t=Math.sqrt(h.root*h.root+c.spin*c.spin*se*se),width=c.spin*c.spin*se*se/(t+h.root);
return{i:i,theta:theta,outer:h.outer,ergosurface:1+t,width:width,cos:co};});
return{config:c,sample:p,particle:particle(p,c.velocity),radial:radial,velocityRows:velocityRows,surfaces:surfaces};
}
function reversible(spin,fraction){
var h=horizon(spin);number(fraction,"角动量抽取比例",0,1);var j=spin*(1-fraction),m2=h.mirr*h.mirr+j*j/(4*h.mirr*h.mirr),mass=Math.sqrt(m2),aStar=j/m2;
if(fraction===0){mass=1;aStar=spin;}
var irr2=h.mirr*h.mirr;
// Stable difference 1-M along constant-Mirr path, rather than subtracting two nearly equal masses.
var extracted=spin*spin*fraction*(2-fraction)/(4*h.mirr*h.mirr*(1+mass));
return{fraction:fraction,angularMomentum:j,mass:mass,spin:aStar,extracted:extracted,area:h.area,mirr:h.mirr,
omegaH:j/(4*irr2*mass),kappa:(2*irr2-Math.abs(j))*(2*irr2+Math.abs(j))/(16*irr2*irr2*mass),outer:2*irr2/mass};
}
function area(o){
if(o!==undefined)object(o);
var c=config(Object.assign({},o,{mode:"area"})),h=horizon(c.spin);
var spins=Array.from({length:401},function(_,i){return -.9999+1.9998*i/400;});spins[0]=-.9999;spins[200]=0;spins[400]=.9999;spins.push(c.spin);
spins=Array.from(new Set(spins)).sort(function(a,b){return a-b;});
var spinRows=spins.map(function(a,i){return Object.assign({i:i},horizon(a));});
var fractions=Array.from({length:401},function(_,i){return i/400;});fractions.push(c.fraction);fractions=Array.from(new Set(fractions)).sort(function(a,b){return a-b;});
var path=fractions.map(function(f,i){return Object.assign({i:i},reversible(c.spin,f));});
return{config:c,sample:h,current:reversible(c.spin,c.fraction),spinRows:spinRows,path:path};
}
function snapshot(o){var c=config(o);return c.mode==="exterior"?exterior(c):area(c);}
function fmt(x){if(x===null)return"—（不适用）";if(typeof x!=="number")return String(x);if(!Number.isFinite(x))throw Error("非有限显示值");return x===0?"0":x.toPrecision(8);}
function selfTest(){var n=0;function ck(b){if(!b)throw Error("Kerr self check "+n);n++;}
var s=snapshot();ck(Math.abs(s.sample.radius-1.8)<1e-14);ck(s.sample.region==="ergoregion");ck(s.sample.lower>0);ck(s.particle.energy<0);ck(s.particle.omega>0&&s.particle.angularMomentum<0);
var m=snapshot({spin:-.8,velocity:.8});ck(m.sample.upper<0&&m.particle.energy<0);ck(snapshot({position:"static"}).sample.gtt===0);
ck(snapshot({spin:0}).sample.lower===-snapshot({spin:0}).sample.upper);ck(reversible(.8,1).mass===horizon(.8).mirr);ck(reversible(0,1).extracted===0);
return{status:"PASS",checks:n};}
var REGIONS={static:"精确静止极限：Ω=0为类光边界",unresolved:"静止极限附近：数值未分辨",ergoregion:"能层内：角速度须与自旋同号",outside:"能层外：允许与自旋反向"};
function ledgers(s){
var c=s.config;
if(c.mode==="exterior"){var p=s.sample,u=s.particle,h=p.horizon;return[
{key:"summary",title:"当前位置：坐标、局部速度与能量",headers:["量","值","约定"],rows:[
["区域",REGIONS[p.region],"外视界之外；不是内部导航"],
["自旋a*",c.spin,"G=c=M=1"],["外视界r+",h.outer,"Boyer–Lindquist坐标半径"],["内视界r−",h.inner,"理想Kerr根"],["当前位置r",p.radius,"赤道面"],["到外视界偏移",p.offset,"精确静止极限时由解析位置决定"],
["Ω下界",p.lower,"局部类光切向方向"],["Ω上界",p.upper,"局部类光切向方向"],["ZAMO ω",p.omega,"坐标角速度"],["lapse α",p.alpha,"ZAMO dτ/dt"],["视界ΩH",h.omegaH,"生成元参数"],
["局部方位速度v",u.velocity,"ZAMO测量，以c为单位"],["当地E/μ",u.localEnergy,"γ>0"],["坐标Ω",u.omega,"固定r的切向量，一般非测地线"],
["Killing E/μ",u.energy,"时间平移对称性"],["轴向L/μ",u.angularMomentum,"轴对称性"],["E−ΩH L",u.energy-h.omegaH*u.angularMomentum,"视界条件只是必要条件，此处未积分轨道"],
["负E的速度阈值",p.negativeThreshold,"a>0取v更小；a<0取v更大；区间外不绘竖线"],
["粒子dτ/dt",u.properRate,"α/γ"],["g(∂t+Ω∂φ,∂t+Ω∂φ)",u.causalNorm,"严格负值；不是归一化四速度"]]},
{key:"radial",title:"全部外部径向因果锥节点",headers:["i","r−r+","log10偏移","r","Δ","gtt","gtφ","gφφ","α","ω","Ω−","Ω+","区域"],rows:s.radial.map(function(p){return[p.i,p.offset,p.logOffset,p.radius,p.delta,p.gtt,p.gtphi,p.gphiphi,p.alpha,p.omega,p.lower,p.upper,REGIONS[p.region]];})},
{key:"velocity",title:"全部局部速度与粒子读数",headers:["i","v","γ=当地E/μ","E/μ","L/μ","Ω","ut","uφ","dτ/dt","坐标切向范数"],rows:s.velocityRows.map(function(r){return[r.i,r.velocity,r.localEnergy,r.energy,r.angularMomentum,r.omega,r.uTime,r.uPhi,r.properRate,r.causalNorm];})},
{key:"surface",title:"全部纬度曲面节点（坐标半径，非欧氏嵌入）",headers:["i","θ度","r+","rE(θ)","rE−r+"],rows:s.surfaces.map(function(r){return[r.i,r.theta,r.outer,r.ergosurface,r.width];})}
];}
var h=s.sample,p=s.current;return[
{key:"summary",title:"初始黑洞与当前理想可逆状态",headers:["量","值","约定"],rows:[
["初始自旋",c.spin,"M0=1、J0=a0"],["初始不可约质量",h.mirr,"以M0为单位"],["不变面积",h.area,"以初始rg²为单位"],["初始κ",h.kappa,"几何单位"],["初始ΩH",h.omegaH,"几何单位"],
["理想总可抽取比例",h.extractable,"不是单次Penrose效率或喷流效率"],["已移除角动量比例f",c.fraction,"J=J0(1−f)"],["当前J",p.angularMomentum,"初始质量单位固定"],["当前M",p.mass,"没有逐步重新归一为1"],
["当前无量纲自旋",p.spin,"J/M²"],["累计释放能量",p.extracted,"以M0c²为单位"],["当前外视界r+",p.outer,"初始rg为单位"],["当前ΩH=dM/dJ",p.omegaH,"固定不可约质量"],
["当前κ",p.kappa,"dM=κdA/(8π)+ΩHdJ"],["Smarr右侧",p.kappa*p.area/(4*Math.PI)+2*p.omegaH*p.angularMomentum,"应等于当前M"]]},
{key:"spin",title:"全部初始自旋与储量节点",headers:["i","a*","r+","r−","ΩH","κ","A","Mirr","Emax/M0"],rows:s.spinRows.map(function(h){return[h.i,h.spin,h.outer,h.inner,h.omegaH,h.kappa,h.area,h.mirr,h.extractable];})},
{key:"path",title:"全部可逆路径节点",headers:["i","f","J","M","a*=J/M²","Eout","A","Mirr","r+","ΩH","κ"],rows:s.path.map(function(p){return[p.i,p.fraction,p.angularMomentum,p.mass,p.spin,p.extracted,p.area,p.mirr,p.outer,p.omegaH,p.kappa];})}
];}
function plots(s){
function make(title,xlabel,ylabel,xs,series,vertical){var ys=series.flatMap(function(z){return z.values;}),lo=Math.min(0,...ys),hi=Math.max(0,...ys),pad=Math.max((hi-lo)*.09,1e-8);return{title:title,xlabel:xlabel,ylabel:ylabel,xs:xs,series:series,xmin:Math.min(...xs),xmax:Math.max(...xs),ymin:lo-pad,ymax:hi+pad,vertical:vertical||[]};}
if(s.config.mode==="exterior"){
var p=s.sample,r=s.radial,v=s.velocityRows,marks=[{x:Math.log10(p.offset),label:"当前位置"}];
if(p.horizon.inner>=1e-5&&p.region!=="static")marks.push({x:Math.log10(p.horizon.inner),label:"静止极限"});
var vm=[{x:s.config.velocity,label:"当前局部v"}];if(p.negativeThreshold!==null&&Math.abs(p.negativeThreshold)<=.99&&Math.abs(p.negativeThreshold-s.config.velocity)>.01)vm.push({x:p.negativeThreshold,label:"E=0阈值"});
return[
make("外部因果角速度：正负自旋都按同一几何判据","log10(r−r+)；全外部偏移10⁻⁵至20","Boyer–Lindquist坐标角速度",r.map(function(x){return x.logOffset;}),[
{key:"lower",label:"Ω−：下界",values:r.map(function(x){return x.lower;})},{key:"center",label:"ω：ZAMO",values:r.map(function(x){return x.omega;})},{key:"upper",label:"Ω+：上界",values:r.map(function(x){return x.upper;})}],marks),
make("同一粒子：当地能量始终为正，Killing能量可以为负","ZAMO局部方位速度v/c；不是坐标角速度","能量/μc²",v.map(function(x){return x.velocity;}),[
{key:"killing",label:"E/μ：时间平移能量",values:v.map(function(x){return x.energy;})},{key:"local",label:"当地E/μ=γ",values:v.map(function(x){return x.localEnergy;})}],vm)
];}
return[
make("初始旋转能的理想总储量上界","初始无量纲自旋a*","初始质量能的比例",s.spinRows.map(function(x){return x.spin;}),[
{key:"irreducible",label:"Mirr/M0",values:s.spinRows.map(function(x){return x.mirr;})},{key:"extractable",label:"Emax/(M0c²)",values:s.spinRows.map(function(x){return x.extractable;})}],[{x:s.config.spin,label:"当前初始自旋"}]),
make("保持面积不变的理想可逆路径","f：已移除的初始角动量比例","初始质量能的比例",s.path.map(function(x){return x.fraction;}),[
{key:"mass",label:"M/M0",values:s.path.map(function(x){return x.mass;})},{key:"out",label:"Eout/(M0c²)",values:s.path.map(function(x){return x.extracted;})}],[{x:s.config.fraction,label:"当前路径位置"}])
];}

var KC_INSTANCE=0;
function mount(root){
var doc=root.ownerDocument,id="kc128-"+(++KC_INSTANCE),fields={},state={predictions:[null,null,null,null],revealed:false,error:false},last=null;
if(!doc.getElementById("kc128-style")){
var style=doc.createElement("style");style.id="kc128-style";
style.textContent=".kc128{color:var(--fg);line-height:1.65;min-width:0}.kc128 *{box-sizing:border-box}.kc128 [hidden]{display:none!important}.kc128 input,.kc128 select,.kc128 button{font:inherit;min-height:44px;background:var(--bg);color:var(--fg);border:1px solid var(--border);border-radius:5px;padding:7px}.kc128 input,.kc128 select{width:100%}.kc128 button{cursor:pointer}.kc128 button:disabled{opacity:.5;cursor:default}.kc128 .kc-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.kc128 .kc-field{display:grid;gap:4px;min-width:0}.kc128 .kc-question{margin:14px 0;padding:12px;border:1px solid var(--border)}.kc128 .kc-choices,.kc128 .kc-actions{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.kc128 [aria-pressed=true]{background:var(--accent);color:var(--bg)}.kc128 .kc-region{max-width:100%;overflow:auto;margin:14px 0}.kc128 details .kc-region{max-height:480px}.kc128 summary{cursor:pointer;padding:12px;border:1px solid var(--border)}.kc128 .kc-region:focus-visible,.kc128 button:focus-visible,.kc128 input:focus-visible,.kc128 select:focus-visible,.kc128 summary:focus-visible{outline:3px solid var(--accent);outline-offset:2px}.kc128 svg{display:block;width:900px;min-width:900px;max-width:none;background:var(--bg);color:var(--fg)}.kc128 table{min-width:900px;width:100%;border-collapse:collapse;font-size:14px}.kc128 th,.kc128 td{padding:9px;border:1px solid var(--border);text-align:left;vertical-align:top}.kc128 caption{font-weight:700;text-align:left;margin:8px 0}.kc128 .kc-feedback{padding:10px;border-left:3px solid var(--accent)}.kc128 .kc-legend{min-width:900px;display:flex;gap:20px;flex-wrap:wrap}.kc128 .kc-note{font-size:14px;color:var(--fg-soft)}@media(max-width:700px){.kc128 .kc-controls{grid-template-columns:1fr}}";
doc.head.appendChild(style);}
function el(tag,attrs,text){var e=doc.createElement(tag);Object.keys(attrs||{}).forEach(function(k){e.setAttribute(k,attrs[k]);});if(text!==undefined)e.textContent=text;return e;}
var lab=el("div",{class:"kc128"});lab.appendChild(el("h3",{},"Kerr：坐标共转、局部速度与能量"));
var controls=el("div",{class:"kc-controls"});
function select(key,label,options){var w=el("label",{class:"kc-field"},label),e=el("select",{"data-key":key,"aria-label":label});Object.keys(options).forEach(function(k){e.appendChild(el("option",{value:k},options[k]));});fields[key]=e;w.appendChild(e);controls.appendChild(w);}
function input(key,label,min,max){var w=el("label",{class:"kc-field"},label),e=el("input",{type:"number",step:"any",min:min,max:max,"data-key":key,"aria-label":label});fields[key]=e;w.appendChild(e);controls.appendChild(w);}
select("mode","实验模型",MODES);
input("spin","无量纲自旋a*（−0.9999至0.9999）",-.9999,.9999);
select("position","位置选择",{offset:"手动外部偏移",static:"精确赤道静止极限r=2（|a*|≥0.01）"});
input("offset","距外视界偏移r−r+（10⁻⁵至20）",1e-5,20);
input("velocity","ZAMO局部方位速度v/c（−0.99至0.99）",-.99,.99);
input("fraction","已移除的初始角动量比例f（0至1）",0,1);
lab.appendChild(controls);
lab.appendChild(el("p",{class:"kc-note"},"外部切向量一般不是测地线；负E不意味着当地负能。可逆路径只给理想储量上界。仅当前模式与位置使用的字段参与计算，隐藏的输入保留原值。"));
function activeKeys(){return ACTIVE[fields.mode.value].filter(function(k){return !(k==="offset"&&fields.position.value==="static");});}
function visibleFields(){Object.keys(fields).forEach(function(k){fields[k].parentElement.hidden=k!=="mode"&&!activeKeys().includes(k);});}
var presets=el("div",{class:"kc-actions"});
[
["正自旋负能量",{mode:"exterior",spin:.8,position:"offset",offset:.2,velocity:-.8}],
["负自旋镜像",{mode:"exterior",spin:-.8,position:"offset",offset:.2,velocity:.8}],
["精确静止极限",{mode:"exterior",spin:.8,position:"static",velocity:0}],
["无自旋外部",{mode:"exterior",spin:0,position:"offset",offset:.2,velocity:0}],
["角动量减半",{mode:"area",spin:.8,fraction:.5}],
["理想抽尽旋转",{mode:"area",spin:.8,fraction:1}]
].forEach(function(pair){var b=el("button",{type:"button","data-preset":pair[0]},pair[0]);b.onclick=function(){Object.keys(pair[1]).forEach(function(k){fields[k].value=String(pair[1][k]);});visibleFields();validate(true);};presets.appendChild(b);});lab.appendChild(presets);
var questions=[
["负自旋黑洞能层里的负角速度，一定是逆着黑洞转吗？",["不是，负角速度与负自旋同向","是，负号总表示逆转"]],
["静止极限上的固定位置类光曲线，一定是光子测地线吗？",["不一定，还要检查测地线条件","是，类光就自动满足测地线方程"]],
["负Killing能量等于当地测得负能量吗？",["不等，当地测量仍为正","相等，只是同一个量的两种写法"]],
["29.29%的极限储量能直接当成单次Penrose效率吗？",["不能，它是理想总可抽取上界","可以，每次过程都能达到"]]
],buttons=[];
questions.forEach(function(q,i){var w=el("section",{class:"kc-question","data-question":i});w.appendChild(el("p",{},(i+1)+". "+q[0]));var opts=el("div",{class:"kc-choices"});buttons[i]=[];q[1].forEach(function(t,j){var b=el("button",{type:"button","data-choice":j,"aria-pressed":"false"},t);b.onclick=function(){state.predictions[i]=j;buttons[i].forEach(function(b,k){b.setAttribute("aria-pressed",k===j?"true":"false");});validate(false);if(state.revealed&&!state.error)feedback.textContent=score();};buttons[i].push(b);opts.appendChild(b);});w.appendChild(opts);lab.appendChild(w);});
var actions=el("div",{class:"kc-actions"}),submit=el("button",{type:"button","data-action":"submit"},"揭示并核对"),reset=el("button",{type:"button","data-action":"reset"},"重置");actions.appendChild(submit);actions.appendChild(reset);lab.appendChild(actions);
var feedback=el("p",{class:"kc-feedback",role:"status"},"先回答四个预测。"),results=el("div",{class:"kc-results",hidden:""});lab.appendChild(feedback);lab.appendChild(results);root.replaceChildren(lab);
function score(){return state.predictions.filter(function(x){return x===0;}).length+" / 4 个预测命中。分别核对自旋方向、参考系与理想路径的条件。";}
function read(){var o={mode:fields.mode.value};activeKeys().forEach(function(k){var e=fields[k];if(e.value.trim()===""||!e.validity.valid)throw Error(e.getAttribute("aria-label")+"：输入无效，保留原值");o[k]=e.tagName==="SELECT"?e.value:Number(e.value);});return config(o);}
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
(p.vertical||[]).forEach(function(v,i){s.appendChild(e("line",{"data-vertical":i,x1:x(v.x),x2:x(v.x),y1:top,y2:bottom,stroke:"currentColor","stroke-dasharray":"5 4"}));s.appendChild(e("text",{x:x(v.x)+7,y:top+20+(i%3)*22,fill:"currentColor","font-size":13},v.label));});
if(p.empty)s.appendChild(e("text",{x:450,y:190,"text-anchor":"middle",fill:"currentColor","font-size":19},"全部比较起点均超出或过近截止；没有可展示的演化区间"));
p.series.forEach(function(q,j){var xs=q.xs||p.xs,points=[];q.values.forEach(function(v,i){var xp=x(xs[i]),yp=y(v);points.push(xp+","+yp);s.appendChild(e("circle",{"data-series":q.key,"data-index":i,cx:xp,cy:yp,r:1.5,fill:colors[j%4]}));});s.appendChild(e("polyline",{"data-series":q.key,points:points.join(" "),fill:"none",stroke:colors[j%4],"stroke-width":1.6,"stroke-dasharray":q.key==="newton"?"5 4":"none"}));});
(p.roots||[]).forEach(function(r,i){s.appendChild(e("circle",{"data-root":i,cx:x(r.u),cy:y(0),r:r.multiplicity>1?6:4,fill:"var(--bg)",stroke:"currentColor","stroke-width":2}));});
s.appendChild(e("text",{x:450,y:bottom+65,"text-anchor":"middle",fill:"currentColor","font-size":15},p.xlabel));s.appendChild(e("text",{x:450,y:bottom+96,"text-anchor":"middle",fill:"currentColor","font-size":14},"纵轴："+p.ylabel));return s;
}
function region(label){return el("div",{class:"kc-region",role:"region",tabindex:"0","aria-label":label+"，可滚动查看全部内容"});}
function render(s){
results.replaceChildren();results.appendChild(el("h4",{tabindex:"-1"},"实验结果与完整账本"));
if(s.config.mode==="exterior")results.appendChild(el("p",{class:"kc-feedback"},REGIONS[s.sample.region]+"。E和L是局部切向动量的Killing读数；尚未计算分裂、逃逸或捕获轨道。"));
else results.appendChild(el("p",{class:"kc-feedback"},"固定初始质量单位，沿面积不变的理想路径改变J和M；不代表实际装置效率。"));
plots(s).forEach(function(p){var r=region(p.title);r.appendChild(svg(p));var l=el("div",{class:"kc-legend"});p.series.forEach(function(q,j){var t=el("span",{},q.label);t.style.color=colors[j%4];l.appendChild(t);});if(p.allowed)l.appendChild(el("span",{},"浅绿：F>0连通区；圆圈：根，重根不自动是反弹点"));r.appendChild(l);results.appendChild(r);});
ledgers(s).forEach(function(d){var r=region(d.title),t=el("table",{"data-table":d.key});t.appendChild(el("caption",{},d.title));var th=el("tr",{});d.headers.forEach(function(h){th.appendChild(el("th",{scope:"col"},h));});t.appendChild(el("thead",{}));t.lastChild.appendChild(th);var body=el("tbody",{});d.rows.forEach(function(row){var tr=el("tr",{});row.forEach(function(v){tr.appendChild(el("td",{},fmt(v)));});body.appendChild(tr);});t.appendChild(body);r.appendChild(t);
if(d.key==="summary")results.appendChild(r);else{var detail=el("details",{"data-ledger":d.key});detail.appendChild(el("summary",{},d.title+"（"+d.rows.length+"行）"));detail.appendChild(r);if(d.rows.length===0)detail.appendChild(el("p",{},"此轨迹超出或过近所选截断，没有生成演化节点。"));results.appendChild(detail);}});
results.hidden=false;
}
submit.onclick=function(){try{last=read();if(state.predictions.some(function(x){return x===null;}))return;state.error=false;state.revealed=true;render(snapshot(last));submit.disabled=true;feedback.textContent=score();results.querySelector("h4").focus();}catch(e){state.error=true;results.hidden=true;submit.disabled=true;feedback.textContent=e.message;}};
function defaults(){Object.keys(fields).forEach(function(k){fields[k].value=String(DEFAULTS[k]);});visibleFields();}
reset.onclick=function(){defaults();state={predictions:[null,null,null,null],revealed:false,error:false};buttons.flat().forEach(function(b){b.setAttribute("aria-pressed","false");});results.replaceChildren();results.hidden=true;feedback.textContent="先回答四个预测。";validate(false);buttons[0][0].focus();};
Object.keys(fields).forEach(function(k){fields[k].addEventListener(fields[k].tagName==="SELECT"?"change":"input",function(){if(k==="mode"||k==="position")visibleFields();validate(true);});});defaults();validate(false);
}

return{MODES:MODES,ACTIVE:ACTIVE,DEFAULTS:DEFAULTS,config:config,horizon:horizon,at:at,particle:particle,exterior:exterior,reversible:reversible,area:area,snapshot:snapshot,fmt:fmt,selfTest:selfTest,ledgers:ledgers,plots:plots,mount:mount};
});
