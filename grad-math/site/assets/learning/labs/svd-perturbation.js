(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;if(root&&root.CourseLearning)root.CourseLearning.register("svd-perturbation",api.mount);})(typeof window!=="undefined"?window:globalThis,function(){
function sum(xs){let z=0,c=0;for(const x of xs){const y=x-c,t=z+y;c=(t-z)-y;z=t;}return z;}
const dot=(a,b)=>sum(a.map((x,i)=>x*b[i]));
const transpose=A=>A[0].map((_,j)=>A.map(r=>r[j]));
const matvec=(A,v)=>A.map(r=>dot(r,v));
const matmul=(A,B)=>{const bt=transpose(B);return A.map(r=>bt.map(c=>dot(r,c)));};
const eye=n=>Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>+(i===j)));
function cholesky(A){
 const n=A.length,L=Array.from({length:n},()=>Array(n).fill(0));
 for(let i=0;i<n;i++)for(let j=0;j<=i;j++){
  const v=A[i][j]-sum(Array.from({length:j},(_,k)=>L[i][k]*L[j][k]));
  if(i===j){if(!(v>0)||!Number.isFinite(v))throw Error("精度矩阵Cholesky失效，不能伪造正方差");L[i][j]=Math.sqrt(v);}
  else L[i][j]=v/L[j][j];
 }return L;
}
function forward(L,b){const x=[];for(let i=0;i<b.length;i++)x[i]=(b[i]-sum(x.map((v,j)=>L[i][j]*v)))/L[i][i];return x;}
function backward(L,b){const x=Array(b.length).fill(0);for(let i=b.length-1;i>=0;i--)x[i]=(b[i]-sum(x.slice(i+1).map((v,j)=>L[i+1+j][i]*v)))/L[i][i];return x;}
const solve=(L,b)=>backward(L,forward(L,b));
function householder(A){
 const m=A.length,n=A[0].length,U=A.map(r=>r.slice()),Qt=eye(m),steps=[];
 for(let k=0;k<n;k++){
  const v=U.slice(k).map(r=>r[k]),norm=Math.hypot(...v);
  if(!(norm>0)||!Number.isFinite(norm))throw Error("增广矩阵QR秩失效");
  const alpha=v[0]>=0?-norm:norm;v[0]-=alpha;const vnorm=Math.hypot(...v);for(let i=0;i<v.length;i++)v[i]/=vnorm;
  for(let j=k;j<n;j++){const projection=2*sum(v.map((x,i)=>x*U[k+i][j]));for(let i=0;i<v.length;i++)U[k+i][j]-=projection*v[i];}
  for(let j=0;j<m;j++){const projection=2*sum(v.map((x,i)=>x*Qt[k+i][j]));for(let i=0;i<v.length;i++)Qt[k+i][j]-=projection*v[i];}
  // Exact structural zeros are consequences of the reflector, not a rank cutoff.
  U[k][k]=alpha;for(let i=k+1;i<m;i++)U[i][k]=0;
  steps.push({k,norm,alpha,vector:v.slice()});
 }
 for(let i=0;i<n;i++)if(U[i][i]<0){U[i]=U[i].map(x=>-x);Qt[i]=Qt[i].map(x=>-x);}
 return{upper:U.slice(0,n),Qt:Qt.slice(0,n),steps};
}
"use strict";
const DEFAULTS={mode:"spectral",second:1,eta:.05,delta:.0001,rho:0,noise:0,error:1,direction:"weak",scaleExponent:0};
function num(v,key,lo,hi,integer=false){
 if(typeof v!=="number"&&typeof v!=="string")throw Error(key+" 必须是数值");
 if(typeof v==="string"&&!v.trim())throw Error(key+" 不能为空");
 const x=Number(v);if(!Number.isFinite(x)||x<lo||x>hi||(integer&&!Number.isInteger(x)))throw Error(key+" 超出范围");
 if(x===0&&typeof v==="string"&&/[1-9]/.test(v.split(/[eE]/)[0]))throw Error(key+" 非零输入下溢");return x;
}
function config(raw={}){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))throw Error("参数必须是对象");
 const s=Object.assign({},DEFAULTS,raw);
 if(!["spectral","qr","backward"].includes(s.mode))throw Error("未知模式");
 if(s.mode==="spectral"){s.second=num(s.second,"第二对角元",.5,3);s.eta=num(s.eta,"非对角扰动",-4,4);}
 else{
  s.delta=num(s.delta,"δ",1e-10,s.mode==="qr"?.3:1);
  if(s.mode==="qr"){s.rho=num(s.rho,"正交残差幅度",0,1);s.noise=num(s.noise,"列空间扰动",0,1e-4);}
  else{s.error=num(s.error,"候选解偏移",-.9,10);s.scaleExponent=num(s.scaleExponent,"缩放指数",-12,12,true);if(!["weak","strong"].includes(s.direction))throw Error("未知偏移方向");}
 }return s;
}
const norm=x=>Math.hypot(...x),fro=A=>norm(A.flat()),sub=(a,b)=>a.map((x,i)=>x-b[i]);
const msub=(A,B)=>A.map((r,i)=>sub(r,B[i]));
const outer=(a,b)=>a.map(x=>b.map(y=>x*y));
function gridCurrent(grid,current){
 const i=grid.findIndex(x=>Math.abs(x-current)<=8*Number.EPSILON*Math.max(Math.abs(x),Math.abs(current)));
 if(i<0)grid.push(current);else grid[i]=current;return grid.sort((a,b)=>a-b);
}
function spectralPoint(second,eta){
 const a=3,b=second,gap=a-b,r=Math.hypot(gap/2,eta),large=(a+b)/2+r,small=(a*b-eta*eta)/large;
 const repeated=r===0,angle=repeated?null:.5*Math.atan2(2*eta,gap),chosen=angle===null?0:angle,v=[Math.cos(chosen),Math.sin(chosen)],w=[-v[1],v[0]];
 const A=[[a,eta],[eta,b]],V=transpose([v,w]),singular=[large,Math.abs(small)],U=transpose([v,w.map(x=>(small<0?-1:1)*x)]);
 const rankOne=outer(v,v).map(row=>row.map(x=>x*large)),tail=msub(A,rankOne);
 const shift=Math.max(Math.abs(singular[0]-a),Math.abs(singular[1]-b)),gapLower=gap-Math.abs(eta);
 const baseUnique=gap>0,rotation=baseUnique?Math.abs(chosen):null;
 return{A,V,U,large,small,singular,repeated,angle:rotation,chosenAngle:chosen,topUnique:!repeated,baseUnique,gap,gapLower,
  normE:Math.abs(eta),shift,certificate:baseUnique&&gapLower>0?Math.min(1,Math.abs(eta)/gapLower):null,rankOne,tail,
  truncations:[{rank:0,matrix:[[0,0],[0,0]],spectral:large,frobenius:Math.hypot(large,small)},
   {rank:1,matrix:rankOne,spectral:Math.abs(small),frobenius:Math.abs(small)},
   {rank:2,matrix:A.map(r=>r.slice()),spectral:0,frobenius:0}],
  circle:Array.from({length:129},(_,i)=>{const theta=2*Math.PI*i/128,x=[Math.cos(theta),Math.sin(theta)];return{i,theta,input:x,output:matvec(A,x)};})};
}
function spectralModel(s){
 const p=spectralPoint(s.second,s.eta);let etas=Array.from({length:81},(_,i)=>-4+i/10);
 if(p.gap>0)for(let i=-16;i<=16;i++)etas=gridCurrent(etas,p.gap*i/16);
 const window=Math.max(.1,Math.min(4,2*p.gap));
 for(const edge of [-window,window])etas=gridCurrent(etas,edge);
 etas=gridCurrent(etas,s.eta);
 p.study=etas.map(eta=>{const v=spectralPoint(s.second,eta);return{eta,large:v.large,small:v.small,sigma1:v.singular[0],sigma2:v.singular[1],shift:v.shift,normE:v.normE,angle:v.angle,certificate:v.certificate};});
 return p;
}
// Exact rational arithmetic is used only for a closed-form reference on the
// actual binary64 inputs. It does not participate in the tested algorithms.
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b){const t=a%b;a=b;b=t;}return a;};
function fraction(n,d=1n){if(!d)throw Error("零分母");if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return[n/g,d/g];}
const fadd=(a,b)=>fraction(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);
const fneg=a=>[-a[0],a[1]],fsub=(a,b)=>fadd(a,fneg(b));
const fmul=(a,b)=>fraction(a[0]*b[0],a[1]*b[1]),fdiv=(a,b)=>fraction(a[0]*b[1],a[1]*b[0]);
function fnumber(x){
 if(!Number.isFinite(x))throw Error("有理参考只接受有限数");if(x===0)return[0n,1n];
 const b=new ArrayBuffer(8),v=new DataView(b);v.setFloat64(0,x,false);const bits=v.getBigUint64(0,false),sign=bits>>63n?-1n:1n,e=Number((bits>>52n)&2047n),mantissa=bits&((1n<<52n)-1n);
 const n=sign*(e===0?mantissa:(1n<<52n)+mantissa),power=e===0?-1074:e-1075;
 return power>=0?fraction(n<<BigInt(power)):fraction(n,1n<<BigInt(-power));
}
function ffloat(a){
 if(a[0]===0n)return 0;const sign=a[0]<0n?-1:1,n=a[0]<0n?-a[0]:a[0],d=a[1],ns=Math.max(0,n.toString(2).length-54),ds=Math.max(0,d.toString(2).length-54);
 return sign*(Number(n>>BigInt(ns))/Number(d>>BigInt(ds)))*2**(ns-ds);
}
function lauchliReference(delta,b){
 const d=fnumber(delta),bb=b.map(fnumber),three=[3n,1n],bar=fdiv(fadd(fadd(bb[1],bb[2]),bb[3]),three),common=fdiv(fadd(bb[0],fmul(d,bar)),fadd(three,fmul(d,d)));
 const fractions=bb.slice(1).map(x=>fadd(fdiv(fsub(x,bar),d),common));
 return{x:fractions.map(ffloat),fractions:fractions.map(a=>a.map(String))};
}
function gramSchmidt(A,modified){
 const m=A.length,n=A[0].length,columns=transpose(A),qs=[],R=eye(n).map(row=>row.map(()=>0)),steps=[];
 for(let j=0;j<n;j++){
  let v=columns[j].slice();const original=v.slice();
  for(let i=0;i<j;i++){
   // Deliberately ordinary binary64 dot products in both textbook variants.
   const rhs=modified?v:original,r=qs[i].reduce((z,x,k)=>z+x*rhs[k],0);R[i][j]=r;
   v=v.map((x,k)=>x-r*qs[i][k]);steps.push({j,i,coefficient:r,work:v.slice()});
  }
  const length=norm(v);if(!(length>0))return{status:"zero-column",Q:transpose(qs),R,steps,x:null};
  R[j][j]=length;qs.push(v.map(x=>x/length));
  steps.push({j,i:j,coefficient:length,work:qs[j].slice()});
 }return{status:"ok",Q:transpose(qs),R,steps};
}
function normalEquations(A,b){
 const P=matmul(transpose(A),A),rhs=matvec(transpose(A),b),L=eye(3).map(r=>r.map(()=>0)),steps=[];
 for(let i=0;i<3;i++)for(let j=0;j<=i;j++){
  const pivot=P[i][j]-sum(Array.from({length:j},(_,k)=>L[i][k]*L[j][k]));
  steps.push({i,j,pivot});
  if(i===j){if(!(pivot>0))return{status:"nonpositive-pivot",P,rhs,L,steps,x:null};L[i][j]=Math.sqrt(pivot);}
  else L[i][j]=pivot/L[j][j];
 }
 return{status:"ok",P,rhs,L,steps,x:solve(L,rhs)};
}
function qrPoint(delta,rho,noise){
 const A=[[1,1,1],[delta,0,0],[0,delta,0],[0,0,delta]],clean=matvec(A,[1,1,1]),nullVector=[-delta,1,1,1].map(x=>x/Math.hypot(delta,Math.sqrt(3))),weakVector=[0,1/Math.SQRT2,-1/Math.SQRT2,0];
 const b=clean.map((x,i)=>x+rho*nullVector[i]+noise*weakVector[i]),ref=lauchliReference(delta,b),ideal=[1+noise/(Math.SQRT2*delta),1-noise/(Math.SQRT2*delta),1];
 const hh=householder(A),methods=[
  {id:"cgs",...gramSchmidt(A,false)},{id:"mgs",...gramSchmidt(A,true)},
  {id:"householder",status:"ok",Q:transpose(hh.Qt),R:hh.upper,steps:hh.steps},
  {id:"normal",...normalEquations(A,b)}];
 for(const z of methods){
  if(z.Q){
   z.QtQ=matmul(transpose(z.Q),z.Q);z.QR=matmul(z.Q,z.R);z.orthogonality=fro(msub(z.QtQ,eye(3)));z.reconstruction=fro(msub(z.QR,A))/fro(A);
   if(z.status==="ok"){z.projected=matvec(transpose(z.Q),b);z.x=backward(transpose(z.R),z.projected);}
  }else{z.orthogonality=null;z.reconstruction=null;}
  if(z.x){
   z.fitted=matvec(A,z.x);z.residual=sub(b,z.fitted);z.normalResidual=matvec(transpose(A),z.residual);
   z.forward=norm(sub(z.x,ref.x))/norm(ref.x);z.modelForward=norm(sub(z.x,ideal))/norm(ideal);
   z.residualNorm=norm(z.residual);z.stationarity=norm(z.normalResidual);
  }else{z.forward=null;z.modelForward=null;z.residualNorm=null;z.stationarity=null;}
 }
 const fitted=matvec(A,ref.x),residual=sub(b,fitted),bnorm=norm(b),sigmaMax=Math.hypot(Math.sqrt(3),delta),condition=sigmaMax/delta;
 return{A,b,clean,nullVector,weakVector,ref,ideal,methods,singular:[sigmaMax,delta,delta],condition,fitted,residual,
  referenceResidual:norm(residual),dataFormation: norm(sub(ref.x,ideal))/norm(ideal),
  sinTheta:norm(residual)/bnorm,tanTheta:norm(residual)/norm(fitted)};
}
function qrModel(s){
 const p=qrPoint(s.delta,s.rho,s.noise),deltas=gridCurrent([...Array.from({length:38},(_,i)=>10**(-10+i/4)),.3],s.delta);
 p.study=deltas.map(delta=>{const v=qrPoint(delta,s.rho,s.noise);return{delta,condition:v.condition,dataFormation:v.dataFormation,referenceResidual:v.referenceResidual,
  methods:v.methods.map(z=>({id:z.id,status:z.status,forward:z.forward,modelForward:z.modelForward,orthogonality:z.orthogonality,reconstruction:z.reconstruction,residualNorm:z.residualNorm,stationarity:z.stationarity}))};});
 return p;
}
function backwardPoint(s,exponent=s.scaleExponent){
 const scale=10**exponent,A=[[scale,0],[0,scale*s.delta]],truth=[1,1],b=matvec(A,truth),x=truth.slice();x[s.direction==="weak"?1:0]+=s.error;
 const r=sub(b,matvec(A,x)),rn=norm(r),an=scale,bn=norm(b),xn=norm(x),eta=rn/(an*xn+bn),u=rn?r.map(t=>t/rn):[0,0],vv=x.map(t=>t/xn),
  dA=outer(u,vv).map(row=>row.map(t=>eta*an*t)),db=u.map(t=>-eta*bn*t),changed= A.map((row,i)=>row.map((t,j)=>t+dA[i][j])),changedB=b.map((t,i)=>t+db[i]);
 const condition=1/s.delta,q=condition*eta;
 return{scale,A,truth,b,x,r,rawResidual:rn,eta,bOnly:rn/bn,forward:norm(sub(x,truth))/norm(truth),condition,
  dA,db,changed,changedB,certificateResidual:sub(matvec(changed,x),changedB),matrixRelative:fro(dA)/an,rhsRelative:norm(db)/bn,bound:q<1?2*q/(1-q):null};
}
function backwardModel(s){const p=backwardPoint(s);p.study=Array.from({length:25},(_,i)=>{const v=backwardPoint(s,i-12);return{exponent:i-12,rawResidual:v.rawResidual,eta:v.eta,forward:v.forward,bOnly:v.bOnly};});return p;}
function snapshot(raw={}){const s=config(raw);return{config:s,result:s.mode==="spectral"?spectralModel(s):s.mode==="qr"?qrModel(s):backwardModel(s)};}
const PRESETS=[
 {id:"default",label:"大间隙：值与方向分开"},
 {id:"small-gap",label:"小间隙：方向明显旋转",second:2.95},
 {id:"indefinite",label:"负特征值不是负奇异值",eta:2},
 {id:"rank-one",label:"精确秩一的边界",second:3,eta:3},
 {id:"repeated",label:"重奇异值：不指定唯一方向",second:3,eta:0},
 {id:"qr",label:"亲自算四种最小二乘",mode:"qr"},
 {id:"ill-conditioned",label:"正规矩阵丢失小方向",mode:"qr",delta:1e-10},
 {id:"nonzero-residual",label:"QR稳定也有非零残差",mode:"qr",delta:1e-8,rho:1},
 {id:"data-perturbation",label:"小数据扰动进入弱方向",mode:"qr",delta:1e-6,noise:1e-4},
 {id:"backward",label:"小残差却有大前向误差",mode:"backward",delta:1e-8},
 {id:"scaled",label:"只缩放单位，原始残差改变",mode:"backward",delta:1e-8,scaleExponent:12},
 {id:"strong",label:"同样偏移，改到强方向",mode:"backward",delta:1e-8,direction:"strong"}
];
const QUESTIONS=[
 ["实对称矩阵出现负特征值，其奇异值是否也可以为负？",["不可以；奇异值取相应特征值的绝对值","可以，奇异值保留伸缩方向的正负"],0,"方向反转由左右奇异向量承担，奇异值始终非负。"],
 ["两个奇异值完全相等时，对应的单独奇异向量是否唯一？",["不唯一，应该说明所比较的子空间","唯一，稳定算法会找出数学上唯一的那根向量"],0,"不同正交基可以张成同一子空间；算法选择一种基不等于证明该基唯一。"],
 ["最小二乘的最优残差非零，就说明QR算法不稳定吗？",["不能，数据可能本来就不在列空间","是，稳定算法必须把残差变成零"],0,"最优拟合残差与算法在输入上的后向误差是不同对象。"],
 ["把A和b同时乘一百万，相对后向误差会乘一百万吗？",["不会，分子和归一化尺度一起变化","会，残差变大就说明算法更不稳定"],0,"原始残差有尺度；相对后向误差先除以明确的输入尺度。"]
];
function fmt(x){
 if(x===null||x===undefined)return"—";if(typeof x==="boolean")return x?"是":"否";if(typeof x!=="number")return String(x);
 if(!Number.isFinite(x))throw Error("不能显示非有限结果");if(Number.isInteger(x))return String(x);
 return Math.abs(x)<1e-4||Math.abs(x)>=1e6?x.toExponential(8):String(Number(x.toPrecision(10)));
}
const series=(key,label,color,points,line=true)=>({key,label,color,points,line});
function plot(title,x,y,ss,xmin,xmax,square=false){
 const ys=ss.flatMap(s=>s.points.map(p=>p[1])),lo=Math.min(0,...ys),hi=Math.max(0,...ys),pad=(hi-lo||1)*.08;
 return{title,x,y,series:ss,xmin,xmax:xmax>xmin?xmax:xmin+1,ymin:square?xmin:lo-pad,ymax:square?xmax:hi+pad,square,markers:[]};
}
const B="#268bd2",O="#cb6a16",G="#29966c",R="#b44a72",V="#9966bb";
const names={cgs:"经典GS",mgs:"改良GS",householder:"Householder",normal:"正规方程"},colors={cgs:R,mgs:O,householder:B,normal:V};
function plots(d){
 const s=d.config,p=d.result;
 if(s.mode==="spectral"){
  const radius=Math.max(1,p.large)*1.08,angleWindow=Math.max(.1,Math.min(4,2*p.gap)),angleStudy=p.study.filter(v=>Math.abs(v.eta)<=angleWindow);
  return[
   plot("单位圆经实际矩阵映射；横纵单位相同","第一坐标","第二坐标",[
    series("circle","输入单位圆",G,p.circle.map(v=>v.input)),series("image","矩阵作用后的椭圆",B,p.circle.map(v=>v.output))],-radius,radius,true),
   plot("特征值有符号；奇异值记录非负伸缩","索引0、1","特征值／奇异值",[
    series("eigen","两条特征值",O,[[0,p.large],[1,p.small]],false),series("singular","按大小排列的奇异值",B,p.singular.map((x,i)=>[i,x]),false)],0,1),
   plot("所有扰动扫描点：Weyl控制值，间隙控制方向","非对角扰动η","奇异值最大位移与扰动范数",[
    series("shift","最大奇异值位移",B,p.study.map(v=>[v.eta,v.shift])),series("bound","||E||₂=|η|",R,p.study.map(v=>[v.eta,v.normE]))],-4,4),
   plot("秩0、1、2：实际截断重建的两种残差","保留的秩k","矩阵残差范数",[
    series("spectral","谱范数尾项",O,p.truncations.map(v=>[v.rank,v.spectral])),series("frobenius","Frobenius全部尾项",B,p.truncations.map(v=>[v.rank,v.frobenius]))],0,2),
   plot(p.baseUnique?"局部η窗口：方向变化与分离上界":"基准重根：没有唯一方向角","非对角扰动η（完整范围另见扫描表）","sin(与基准顶方向的夹角)",[
    series("angle","窗口内全部实际sinθ",B,angleStudy.filter(v=>v.angle!==null).map(v=>[v.eta,Math.sin(v.angle)])),
    series("certificate","窗口内分离条件成立的上界",R,angleStudy.filter(v=>v.certificate!==null).map(v=>[v.eta,v.certificate]),false)],-angleWindow,angleWindow)
  ];
 }
 if(s.mode==="qr"){
  const scans=(field)=>Object.keys(names).map(id=>series(id,names[id],colors[id],p.study.flatMap(v=>{const z=v.methods.find(z=>z.id===id);return z[field]!==null&&z[field]>0?[[Math.log10(v.delta),Math.log10(z[field])]]:[];}),false));
  return[
   plot("每个算法的候选解，与实际浮点输入的有理参考","解坐标","解值",[
    series("reference","实际输入的有理参考",G,p.ref.x.map((v,i)=>[i,v])),
    ...p.methods.filter(v=>v.x).map(v=>series(v.id,names[v.id],colors[v.id],v.x.map((x,i)=>[i,x]),false))],0,2),
   plot("算法前向误差：相对于同一实际输入的精确解","log₁₀ δ","log₁₀ 相对前向误差",scans("forward"),-10,Math.log10(.3)),
   plot("QᵀQ−I的Frobenius范数；正规方程没有Q","log₁₀ δ","log₁₀ 正交性缺陷",scans("orthogonality").filter(v=>v.key!=="normal"),-10,Math.log10(.3)),
   plot("QR重建残差与正交性分开看","log₁₀ δ","log₁₀ ||QR−A||F / ||A||F",scans("reconstruction").filter(v=>v.key!=="normal"),-10,Math.log10(.3)),
   plot("数据形成舍入，与算法误差是另一项","log₁₀ δ","log₁₀ 实际输入解与理想数据解的相对差",[
    series("formation","输入形成误差",O,p.study.filter(v=>v.dataFormation>0).map(v=>[Math.log10(v.delta),Math.log10(v.dataFormation)]),false)],-10,Math.log10(.3))
  ];
 }
 return[
  plot("同一个候选解：偏移发生在哪个方向","坐标","真实解／候选解",[
   series("truth","真实解",G,p.truth.map((v,i)=>[i,v])),series("candidate","候选解",O,p.x.map((v,i)=>[i,v]))],0,1),
  plot("只改单位：原始残差的大小跟着改变","十进制缩放指数","log₁₀ 原始残差（0不取对数）",[
   series("raw","||b−Ax̂||₂",O,p.study.filter(v=>v.rawResidual>0).map(v=>[v.exponent,Math.log10(v.rawResidual)]))],-12,12),
  plot("相对误差经过归一化，不随共同缩放改变","十进制缩放指数","无量纲相对误差",[
   series("backward","允许A,b变化的后向误差",B,p.study.map(v=>[v.exponent,v.eta])),
   series("forward","候选解的前向误差",R,p.study.map(v=>[v.exponent,v.forward])),
   series("rhs-only","只允许b变化的后向误差",G,p.study.map(v=>[v.exponent,v.bOnly]))],-12,12),
  plot("达到最小后向误差的显式输入扰动","对象0：A；对象1：b","相对扰动范数",[
   series("achieved","实际构造",B,[[0,p.matrixRelative],[1,p.rhsRelative]],false),
   series("minimal","最小值η",O,[[0,p.eta],[1,p.eta]])],0,1)
 ];
}
function ledgers(d){
 const s=d.config,p=d.result,t=(key,title,headers,rows)=>({key,title,headers,rows}),matrices=(objects)=>Object.entries(objects).flatMap(([name,A])=>A.flatMap((row,i)=>row.map((v,j)=>[name,i,j,v]))),col=x=>x.map(v=>[v]);
 if(s.mode==="spectral")return[
  t("summary","特征值、奇异值与唯一性",[ "量","值"],[["第二对角元",s.second],["η",s.eta],["大特征值",p.large],["小特征值",p.small],["σ1",p.singular[0]],["σ2",p.singular[1]],["基准顶方向唯一",p.baseUnique],["扰动后顶方向唯一",p.topUnique],["本次选择基的角度",p.chosenAngle],["与唯一基准方向的夹角",p.angle],["Weyl最大位移",p.shift],["||E||₂",p.normE],["gap",p.gap],["gap−||E||₂",p.gapLower],["sinθ上界",p.certificate]]),
  t("matrices","SVD、截断和实际残差的全部项",["矩阵","i","j","数值"],matrices({A:p.A,U:p.U,V:p.V,rankOne:p.rankOne,tail:p.tail})),
  t("circle","129个单位圆点与真实矩阵作用",["i","θ","输入x","输入y","输出x","输出y"],p.circle.map(v=>[v.i,v.theta,...v.input,...v.output])),
  t("ranks","每个秩的全部重建元素与尾部范数",["秩","谱残差","Frobenius残差","a00","a01","a10","a11"],p.truncations.map(v=>[v.rank,v.spectral,v.frobenius,...v.matrix.flat()])),
  t("study","完整η扫描，没有隐藏不定或重根状态",["η","λ+","λ−","σ1","σ2","最大位移","||E||₂","夹角","sinθ上界"],p.study.map(v=>[v.eta,v.large,v.small,v.sigma1,v.sigma2,v.shift,v.normE,v.angle,v.certificate]))
 ];
 if(s.mode==="qr"){
  const mats={A:p.A,b:col(p.b),clean:col(p.clean),nullVector:col(p.nullVector),weakVector:col(p.weakVector)};
  p.methods.forEach(z=>{for(const k of ["Q","R","QtQ","QR","P","L"])if(z[k])mats[z.id+"."+k]=z[k];for(const k of ["rhs","projected","x","fitted","residual","normalResidual"])if(z[k])mats[z.id+"."+k]=col(z[k]);});
  return[
   t("summary","问题条件、数据形成与最优残差",["量","值"],[["δ",s.delta],["正交残差参数ρ",s.rho],["列空间扰动ε",s.noise],["σmax",p.singular[0]],["σmin（重数2）",s.delta],["κ₂(A)",p.condition],["κ₂(AᵀA)数学值",p.condition**2],["有理参考最优残差",p.referenceResidual],["数据形成相对影响",p.dataFormation],["sinθ",p.sinTheta],["tanθ",p.tanTheta]]),
   t("methods","所有算法的实际误差；失败不填假数",["算法","状态","前向误差(实际输入)","相对理想数据解","原始残差","||Aᵀr||","正交缺陷","QR相对重建误差"],p.methods.map(z=>[names[z.id],z.status,z.forward,z.modelForward,z.residualNorm,z.stationarity,z.orthogonality,z.reconstruction])),
   t("reference","实际binary64输入的有理解与理想数据解",["i","参考分子","参考分母","参考浮点显示","理想数据解","实际输入解之差"],p.ref.x.map((v,i)=>[i,...p.ref.fractions[i],v,p.ideal[i],v-p.ideal[i]])),
   t("matrices","四种实际算法的全部矩阵与向量",["对象","i","j","数值"],matrices(mats)),
   t("gs-steps","Gram–Schmidt每步投影与全部剩余向量",["算法","列j","投影/归一i","系数","分量k","剩余向量或归一列"],p.methods.filter(z=>z.id==="cgs"||z.id==="mgs").flatMap(z=>z.steps.flatMap(v=>v.work.map((x,k)=>[names[z.id],v.j,v.i,v.coefficient,k,x])))),
   t("reflectors","Householder全部单位反射向量",["k","局部分量","列范数","目标对角","向量分量"],p.methods.find(z=>z.id==="householder").steps.flatMap(v=>v.vector.map((x,i)=>[v.k,i,v.norm,v.alpha,x]))),
   t("pivots","正规矩阵Cholesky实际主元",["i","j","消去后的值"],p.methods.find(z=>z.id==="normal").steps.map(v=>[v.i,v.j,v.pivot])),
   t("study","全部δ扫描及每种算法的输出",["δ","κ₂","数据形成误差","参考残差","算法","状态","前向误差","理想模型差","正交缺陷","QR重建差","原始残差","||Aᵀr||"],p.study.flatMap(v=>v.methods.map(z=>[v.delta,v.condition,v.dataFormation,v.referenceResidual,names[z.id],z.status,z.forward,z.modelForward,z.orthogonality,z.reconstruction,z.residualNorm,z.stationarity])))
  ];
 }
 return[
  t("summary","原始残差与两种相对后向误差",["量","值"],[["δ",s.delta],["候选偏移",s.error],["方向",s.direction],["共同缩放",p.scale],["κ₂",p.condition],["原始残差",p.rawResidual],["相对前向误差",p.forward],["允许A,b的最小后向误差η",p.eta],["只允许b的后向误差",p.bOnly],["构造ΔA的相对范数",p.matrixRelative],["构造Δb的相对范数",p.rhsRelative],["2κη/(1−κη)，条件成立时",p.bound]]),
  t("matrices","显式达到下界的扰动与解",["对象","i","j","数值"],matrices({A:p.A,b:col(p.b),truth:col(p.truth),candidate:col(p.x),residual:col(p.r),deltaA:p.dA,deltaB:col(p.db),changedA:p.changed,changedB:col(p.changedB),certificateResidual:col(p.certificateResidual)})),
  t("study","全部25个共同缩放",["指数","原始残差","相对后向误差η","相对前向误差","只允许b的后向误差"],p.study.map(v=>[v.exponent,v.rawResidual,v.eta,v.forward,v.bOnly]))
 ];
}
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const tick=v=>v===0?"0":Math.abs(v)<1e-3||Math.abs(v)>=1e4?v.toExponential(2):String(Number(v.toPrecision(4)));
 function svg(q){
  const left=q.square?325:100,width=q.square?250:750,height=250,top=85,bottom=335,x=v=>left+width*(v-q.xmin)/(q.xmax-q.xmin),y=v=>bottom-height*(v-q.ymin)/(q.ymax-q.ymin);
  let s='<svg xmlns="http://www.w3.org/2000/svg" width="900" height="425" role="img" aria-label="'+esc(q.title)+'"><title>'+esc(q.title)+'</title><text x="25" y="32" font-size="22">'+esc(q.title)+'</text>';
  for(let i=0;i<(q.square?3:5);i++){
   const v=q.ymin+(q.ymax-q.ymin)*i/(q.square?2:4);
   s+='<path d="M'+left+' '+y(v)+'H'+(left+width)+'" stroke="currentColor" opacity=".18"/><text x="'+(left-12)+'" y="'+(y(v)+5)+'" text-anchor="end">'+tick(v)+'</text>';
  }
  const ticks=q.xTicks||Array.from({length:5},(_,i)=>q.xmin+(q.xmax-q.xmin)*i/4);
  for(const v of ticks)s+='<text x="'+x(v)+'" y="'+(bottom+28)+'" text-anchor="middle">'+tick(v)+'</text>';
  if(q.ymin<=0&&q.ymax>=0)s+='<line data-zero="true" x1="'+left+'" x2="'+(left+width)+'" y1="'+y(0)+'" y2="'+y(0)+'" stroke="currentColor" opacity=".7"/>';
  s+='<text x="'+left+'" y="65">'+esc(q.y)+'</text><text x="'+(left+width/2)+'" y="'+(bottom+63)+'" text-anchor="middle">'+esc(q.x)+'</text>';
  for(const series of q.series){
   if(series.area)s+='<rect data-area="'+series.key+'" x="'+x(series.points[0][0])+'" y="'+y(series.points[0][1])+'" width="'+(x(series.points[1][0])-x(series.points[0][0]))+'" height="'+(y(0)-y(series.points[0][1]))+'" fill="'+series.color+'" opacity=".12"/>';
   if(series.line)s+='<polyline data-series="'+series.key+'" points="'+series.points.map(p=>x(p[0])+','+y(p[1])).join(" ")+'" stroke="'+series.color+'" stroke-width="2" fill="none"/>';
   series.points.forEach((p,i)=>{const open=series.endOpen&&i===series.points.length-1;s+='<circle data-series="'+series.key+'" data-index="'+i+'" data-open="'+!!open+'" cx="'+x(p[0])+'" cy="'+y(p[1])+'" r="'+(series.endOpen?3.5:series.line?1.8:3.5)+'" fill="'+(open?"var(--bg,#faf7ef)":series.color)+'" stroke="'+series.color+'"/>';});
  }
  for(const [i,m]of (q.markers||[]).entries()){
   const px=x(m.x),right=px>700;
   s+='<line data-marker="'+i+'" x1="'+px+'" x2="'+px+'" y1="'+top+'" y2="'+bottom+'" stroke="currentColor" stroke-dasharray="5 5" opacity=".65"/><text x="'+(px+(right?-4:4))+'" y="'+(80+25*q.markers.slice(0,i).filter(p=>Math.abs(px-x(p.x))<110).length)+'" font-size="13" text-anchor="'+(right?'end':'start')+'">'+esc(m.label)+'</text>';
  }
  return s+"</svg>";
 }

 const STYLE=".svd143{color:var(--fg,#273646)}.svd143 .svd-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}.svd143 label{display:flex;flex-direction:column;gap:6px}.svd143 input,.svd143 select{font:inherit;padding:8px;max-width:100%;background:var(--bg,#fff);color:inherit;border:1px solid #8b98a0;border-radius:5px}.svd143 button{font:inherit;padding:8px 12px;margin:5px;cursor:pointer}.svd143 button[aria-pressed=true]{outline:3px solid #478aaa}.svd143 .svd-scroll{overflow:auto;max-width:100%;margin:16px 0}.svd143 .svd-scroll:focus{outline:3px solid #478aaa}.svd143 .svd-ledger{max-height:420px}.svd143 svg{width:900px!important;max-width:none!important;display:block;fill:currentColor;font:16px system-ui}.svd143 table{display:table;overflow:visible;width:max-content;max-width:none;min-width:900px;border-collapse:collapse;font-variant-numeric:tabular-nums}.svd143 th,.svd143 td{padding:9px;border:1px solid #98a4ab;text-align:left;white-space:nowrap}.svd143 .svd-error{color:#c74b39}.svd143 [hidden]{display:none!important}.svd143 fieldset{margin:16px 0;padding:12px}.svd143 details{margin:16px 0}.svd143 summary{cursor:pointer;font-weight:600}.svd143 .svd-legend{font-size:.95em}.svd143 .svd-note{line-height:1.7}.svd143 [hidden]{display:none!important}.svd143 select{font:inherit;color:var(--fg,#282820);background:var(--bg,#faf7ef);padding:8px;max-width:100%}";
 function mount(container){
  const doc=container.ownerDocument;
  if(!doc.getElementById("svd143-style")){const style=doc.createElement("style");style.id="svd143-style";style.textContent=STYLE;doc.head.appendChild(style);}
  const field=(key,label,modes)=>'<label data-modes="'+modes+'">'+label+'<input data-key="'+key+'" type="number" step="any"></label>';
  container.innerHTML='<div class="svd143"><h3>同一矩阵，哪些误差可以互相推出？</h3><p>先区分伸缩、方向、拟合残差与算法误差，再执行实际矩阵运算。</p><div class="svd-presets">'+PRESETS.map(p=>'<button type="button" data-preset="'+p.id+'">'+esc(p.label)+'</button>').join("")+'</div><div class="svd-controls"><label>模型<select data-key="mode"><option value="spectral">SVD、间隙与低秩逼近</option><option value="qr">实际QR与最小二乘</option><option value="backward">后向误差与单位缩放</option></select></label>'+
   field("second","第二对角元（0.5–3）","spectral")+field("eta","非对角扰动η（−4–4）","spectral")+
   field("delta","δ（QR：10⁻¹⁰–0.3；方程：10⁻¹⁰–1）","qr backward")+
   field("rho","理想正交残差ρ（0–1）","qr")+field("noise","列空间扰动ε（0–10⁻⁴）","qr")+
   field("error","候选解偏移（−0.9–10）","backward")+field("scaleExponent","共同缩放10的指数（−12–12整数）","backward")+
   '<label data-modes="backward">候选偏移方向<select data-key="direction"><option value="weak">弱方向：第二坐标</option><option value="strong">强方向：第一坐标</option></select></label></div>'+
   QUESTIONS.map((q,i)=>'<fieldset data-question="'+i+'"><legend>'+(i+1)+'. '+esc(q[0])+'</legend>'+q[1].map((v,j)=>'<button type="button" data-choice="'+j+'" aria-pressed="false">'+esc(v)+'</button>').join("")+'</fieldset>').join("")+
   '<button type="button" data-action="reveal">揭示图与完整账本</button><button type="button" data-action="reset">重置预测</button><p class="svd-error" role="alert"></p><p role="status"></p><div class="svd-results" hidden></div></div>';
  const fields=Array.from(container.querySelectorAll("[data-key]")),answers=Array(4).fill(null),result=container.querySelector(".svd-results"),reveal=container.querySelector("[data-action=reveal]"),feedback=container.querySelector("[role=status]"),error=container.querySelector("[role=alert]");
  fields.forEach(e=>e.value=DEFAULTS[e.dataset.key]);
  let revealed=false,valid=null;
  function render(d){
   const notes={spectral:"矩阵始终实对称，但可以不定。奇异值由特征值绝对值给出；不能把负特征值画成负奇异值。重奇异值时算法仍能选取一组基，却没有数学上唯一的单根方向。角度相对于基准唯一顶方向定义；基准重根时留空。",qr:"四种方法实际计算同一4×3矩阵和右端。参考解由实际binary64输入的精确有理数闭式求得，最终显示转回浮点数；另列理想数据解，避免把生成数据时的舍入误差算到求解器头上。正规矩阵失去正主元时明确失败，不偷偷正则化。",backward:"本模式直接给定候选解，不伪装成某算法的输出。明确允许A与b同时变化，并显式构造达到最小相对后向误差的扰动；只允许b变化的量另列。原始残差随共同缩放变化，相对量保持不变到浮点舍入。"};
   result.innerHTML='<p>'+notes[d.config.mode]+'</p>'+
    plots(d).map(q=>'<p>'+q.series.filter((s,i,ss)=>ss.findIndex(t=>t.label===s.label&&t.color===s.color)===i).map(s=>esc(s.label)+'（'+({"#268bd2":"蓝","#cb6a16":"橙","#29966c":"绿","#9966bb":"紫","#b44a72":"玫红"}[s.color])+'）').join("；")+'</p><div class="svd-scroll" role="region" tabindex="0" aria-label="'+esc(q.title)+'">'+svg(q)+'</div>').join("")+
    ledgers(d).map(t=>'<details data-ledger="'+t.key+'"'+(t.key==="summary"?' open':"")+'><summary>'+esc(t.title)+'（'+t.rows.length+' 行）</summary><div class="svd-scroll svd-ledger" role="region" tabindex="0" aria-label="'+esc(t.title)+'"><table data-table="'+t.key+'"><thead><tr>'+t.headers.map(x=>'<th scope="col">'+esc(x)+'</th>').join("")+'</tr></thead><tbody>'+t.rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(fmt(x))+'</td>').join("")+'</tr>').join("")+'</tbody></table></div></details>').join("")+
    '<p>“—”表示未定义或算法失败，不是0。对数图只绘制严格正的量，真实0与失败仍在全表中分别保留，没有加绘图下限。QR重建残差、正交性缺陷、最小二乘拟合残差和前向误差各有独立列；小残差不是所有这些性质的共同证书。有限浮点核对不能替代理论证明或严格区间界。</p>';
  }
  function update(){
   const raw=Object.fromEntries(fields.map(e=>[e.dataset.key,e.value]));
   container.querySelectorAll("[data-modes]").forEach(e=>e.hidden=!e.dataset.modes.split(" ").includes(raw.mode));
   try{valid=config(raw);error.textContent="";}catch(e){valid=null;revealed=false;error.textContent=e.message;}
   reveal.disabled=!valid||answers.some(x=>x===null);result.hidden=!revealed;
   if(revealed&&valid)render(snapshot(valid));
   feedback.textContent=revealed?answers.filter((x,i)=>x===QUESTIONS[i][2]).length+" / 4。"+QUESTIONS.map(q=>q[3]).join(" "):"";
  }
  fields.forEach(e=>e.addEventListener(e.tagName==="SELECT"?"change":"input",update));
  container.querySelectorAll("[data-choice]").forEach(b=>b.addEventListener("click",()=>{
   const i=Number(b.closest("[data-question]").dataset.question);answers[i]=Number(b.dataset.choice);b.parentElement.querySelectorAll("[data-choice]").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));update();
  }));
  container.querySelectorAll("[data-preset]").forEach(b=>b.addEventListener("click",()=>{
   const s=Object.assign({},DEFAULTS,PRESETS.find(p=>p.id===b.dataset.preset));fields.forEach(e=>e.value=s[e.dataset.key]);update();
  }));
  reveal.addEventListener("click",()=>{if(!reveal.disabled){revealed=true;update();}});
  container.querySelector("[data-action=reset]").addEventListener("click",()=>{answers.fill(null);revealed=false;container.querySelectorAll("[data-choice]").forEach(b=>b.setAttribute("aria-pressed","false"));update();container.querySelector("[data-choice]").focus();});
  update();
 }












function selfTest(){
 let checks=0;const ck=(v,m)=>{checks++;if(!v)throw Error(m);};
 const a=snapshot({eta:2}).result;ck(a.small<0&&a.singular[1]>0,"negative eigenvalue is not singular value");
 ck(snapshot({second:3,eta:0}).result.angle===null,"repeated base direction undefined");
 ck(snapshot({second:3,eta:3}).result.singular[1]===0,"actual exact rank-one boundary");
 const b=qrPoint(1e-10,0,0);ck(b.methods.find(x=>x.id==="normal").status==="nonpositive-pivot","actual normal matrix failure");
 ck(b.methods.find(x=>x.id==="householder").status==="ok","QR retains actual small directions");
 const c=snapshot({mode:"backward",delta:1e-8}).result;ck(c.forward>.7&&c.eta<1e-8,"small backward large forward");
 const e=snapshot({mode:"backward",delta:1e-8,scaleExponent:12}).result;ck(Math.abs(c.eta-e.eta)<1e-20,"common scaling");
 ck(fmt(1000)==="1000","integer formatting");
 return{status:"PASS",checks};
}
return{DEFAULTS,PRESETS,QUESTIONS,num,config,sum,dot,transpose,matvec,matmul,eye,norm,fro,sub,msub,outer,householder,gramSchmidt,normalEquations,lauchliReference,spectralPoint,spectralModel,qrPoint,qrModel,backwardPoint,backwardModel,snapshot,plots,ledgers,fmt,svg,mount,selfTest};
});
