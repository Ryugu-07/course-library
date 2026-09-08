(function(root,factory){
 "use strict";const lib=factory(typeof module==="object"&&module.exports?require("../research-renderer.js"):root.ResearchLab);
 if(typeof module==="object"&&module.exports)module.exports=lib;else if(root.CourseLearning)root.CourseLearning.register("research-scattering-loop",lib.mount);
})(typeof globalThis!=="undefined"?globalThis:this,function(core){
 "use strict";
 const C=1/(32*Math.PI**2);
 // F(r)=integral_0^1 log(1-r*x*(1-x)-i0) dx, r=p^2/m^2.
 function bubble(r){
  if(!Number.isFinite(r)||Math.abs(r)>1e6)throw Error("泡函数要求有限 |p²/m²|≤10⁶");
  if(Math.abs(r)<.01){let term=r/6,sum=term;for(let n=1;n<20;n++){term*=r*n/(2*(2*n+3));sum+=term;}return {re:-sum,im:0};}
  if(r<0){const b=Math.sqrt(1-4/r);return {re:-2+2*b*Math.atanh(1/b),im:0};}
  if(r<4){const a=Math.sqrt(4/r-1);return {re:-2+2*a*Math.atan(1/a),im:0};}
  if(r===4)return {re:-2,im:0};
  const b=Math.sqrt(1-4/r);return {re:-2+2*b*Math.atanh(b),im:-Math.PI*b};
 }
 function amplitude(s,t,u,mu,lambda,m=1){
  if(!(m>0&&mu>0&&lambda>=0&&[m,mu,lambda].every(Number.isFinite)))throw Error("要求正质量、正减法尺度及非负有限耦合");
  const sub=bubble(-((mu/m)**2)).re,channels=[s,t,u].map(p=>bubble(p/m**2));
  const loopRe=C*lambda**2*channels.reduce((a,f)=>a+sub-f.re,0),loopIm=-C*lambda**2*channels.reduce((a,f)=>a+f.im,0);
  return {re:-lambda+loopRe,im:loopIm,loopRe,loopIm,channels,sub};
 }
 function scattering(r,z,mu,lambda,m=1){
  if(!(Number.isFinite(r)&&r>=4&&r<=1e4&&Number.isFinite(z)&&Math.abs(z)<=1))throw Error("散射要求4≤s/m²≤10⁴、−1≤cosθ≤1");
  const s=r*m*m,t=-(s-4*m*m)*(1-z)/2,u=-(s-4*m*m)*(1+z)/2;
  const a=amplitude(s,t,u,mu,lambda,m),treeSquared=lambda**2,nloSquared=treeSquared-2*lambda*a.loopRe;
  return {...a,s,t,u,beta:Math.sqrt(1-4/r),treeSquared,nloSquared,
   dsTree:treeSquared/(128*Math.PI**2*s),dsNlo:nloSquared/(128*Math.PI**2*s),
   relativeCorrection:lambda===0?0:-2*a.loopRe/lambda};
 }
 function matchedCoupling(lambda,mu1,mu2,m=1){
  if(!([lambda,mu1,mu2,m].every(Number.isFinite)&&lambda>=0&&mu1>0&&mu2>0&&m>0))throw Error("匹配参数越界");
  return lambda+3*C*lambda**2*(bubble(-((mu2/m)**2)).re-bubble(-((mu1/m)**2)).re);
 }
 function matching(lambda,mu2){
  const lambda2=matchedCoupling(lambda,1,mu2),a=scattering(8,0,1,lambda),fixed=scattering(8,0,mu2,lambda),b=scattering(8,0,mu2,lambda2);
  return {lambda2,original:a,matched:b,fixed,difference:Math.hypot(b.re-a.re,b.im-a.im),fixedDifference:Math.hypot(fixed.re-a.re,fixed.im-a.im)};
 }
 const controls=[["r","能量平方 s/m²",4.2,16,.2,8],["z","散射角 cosθ",-1,1,.1,0],["mu","减法尺度 μ/m",.5,4,.25,1],["lambda","耦合 λ(μ)",.2,2,.1,1]];
 const configs={
  angular:{title:"同一个单圈振幅，怎样变成角分布？",predict:"先预测：交换两个相同出射粒子使cosθ变号，截面应如何改变？保持λ不变只调μ，算的是同一个已匹配理论吗？",
   scope:"四维有质量实λφ⁴；m=ℏ=c=1，λ由对称Euclidean MOM定义。全立体角计数含相同粒子1/2!。截面只保留λ²与λ³；m²dσ/dΩ无量纲。",
   controls,compute(v){const r=scattering(v.r,v.z,v.mu,v.lambda);return {numeric:r,rows:[["s / m²",r.s],["t / m²",r.t],["u / m²",r.u],["Re M_loop",r.loopRe],["Im M_loop",r.loopIm],["树级 m² dσ/dΩ",r.dsTree],["NLO m² dσ/dΩ",r.dsNlo],["相对截面修正",r.relativeCorrection],["只平方已算振幅会混入的λ⁴项",r.loopRe**2+r.loopIm**2]],
    chart:{title:"角分布：相同粒子的前后对称",xlabel:"cosθ",ylabel:"m² dσ/dΩ",series:[{label:"树级",points:[[-1,r.dsTree],[1,r.dsTree]]},{label:"树级＋单圈干涉（NLO）",points:Array.from({length:41},(_,i)=>{const z=-1+i/20;return [z,scattering(v.r,z,v.mu,v.lambda).dsNlo];})}]},
    text:"t与u交换而总振幅不变。虚部在单圈振幅中是真实必需的，但本模型树级为实数，虚部不进入λ³截面干涉。表中λ⁴项不是完整两圈截面。μ滑块固定数值λ，改变了参数定义下的理论；一致换点请用后面的匹配实验。小修正只是一项微扰诊断，不是所有高阶误差的认证界。"};}},
  threshold:{title:"泡图的虚部为什么恰好在两粒子阈值打开？",predict:"先预测：当s/m²从3.9跨到4.1时，参数积分里哪一段对数变成负实数？它的区间长度如何决定虚部？",
   scope:"此处r=p²/m²是泡图的虚拟通道变量；r<4不是可达的两入射粒子散射能量。−i0指定对数支路，图中数值除以λ²。",
   controls:[["r","通道 r=p²/m²",0,16,.1,4.1]],compute(v){const f=bubble(v.r),b=v.r>4?Math.sqrt(1-4/v.r):0,im=-C*f.im;return {numeric:{...f,beta:b,im},rows:[["Re F(r)",f.re],["Im F(r)",f.im],["负对数区间长度 β",b],["2 Im M_s / λ²",2*im],["(1/2!) × 两体相空间",b/(16*Math.PI)]],
    chart:{title:"虚部与同一模型的两粒子相空间",xlabel:"r = p²/m²",ylabel:"2 Im M_s / λ²",series:[{label:"解析对数支路",points:Array.from({length:161},(_,i)=>[i/10,-2*C*bubble(i/10).im])},{label:"所选r",points:[[v.r,2*im]],dots:true}]},
    text:"r>4时根x±=(1±β)/2之间有log(负数−i0)=log|负数|−iπ。长度β产生Im F=−πβ，振幅带前面的减号后虚部为正。右侧独立相空间相等式来自幺正性；若漏掉泡图或末态计数的1/2，会在这里差一倍。"};}},
  matching:{title:"换减法点：同时换耦合，剩下的是哪一阶？",predict:"先预测：将λ减半后，固定λ换μ产生的振幅差约缩小4倍，而一致单圈匹配后的剩余差约缩小8倍，为什么？",
   scope:"固定m=1、s=8、cosθ=0、原尺度μ₁=1。μ₂处λ₂只匹配到λ₁²；保留公式数值求值中的高阶剩余，用于阶数诊断，不能当成已算出的两圈振幅。",
   controls:[["lambda","原耦合 λ₁",.1,2,.1,1],["mu","新尺度 μ₂/m",.5,4,.25,2]],compute(v){const r=matching(v.lambda,v.mu),half=matching(v.lambda/2,v.mu);return {numeric:r,rows:[["匹配后 λ₂",r.lambda2],["固定λ换点的振幅差",r.fixedDifference],["一致匹配后的振幅差",r.difference],["λ减半后的剩余差",half.difference],["原剩余差 / 减半剩余差",half.difference>1e-14?r.difference/half.difference:"同点或差太小，不显示比值"]],
    chart:{title:"参数匹配消去λ²阶尺度差",xlabel:"原耦合 λ₁",ylabel:"复振幅差的模",series:[{label:"固定λ，仅换μ",points:Array.from({length:20},(_,i)=>{const l=(i+1)/10;return [l,matching(l,v.mu).fixedDifference];})},{label:"λ随μ作单圈匹配",points:Array.from({length:20},(_,i)=>{const l=(i+1)/10;return [l,matching(l,v.mu).difference];})}]},
    text:"两条曲线比较同一运动学。匹配只保证到所算阶次：剩余通常从λ³起，有限λ时比值不必恰好8；μ₂=μ₁时两者都精确为0。尺度变化不能单独给出严格的未知高阶误差界。"};}}
 };
 return Object.assign(core.create("research-scattering-loop",configs),{bubble,amplitude,scattering,matchedCoupling,matching});
});
