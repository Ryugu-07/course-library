(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;if(root&&root.CourseLearning)root.CourseLearning.register("eigen-iteration",api.mount);})(typeof window!=="undefined"?window:globalThis,function(){
"use strict";
const norm=x=>Math.hypot(...x),dot=(x,y)=>x.reduce((s,v,i)=>s+v*y[i],0);
const transpose=A=>A[0].map((_,j)=>A.map(r=>r[j]));
const mm=(A,B)=>{const bt=transpose(B);return A.map(r=>bt.map(c=>dot(r,c)));};
const mv=(A,x)=>A.map(r=>dot(r,x)),sub=(x,y)=>x.map((v,i)=>v-y[i]),msub=(A,B)=>A.map((r,i)=>sub(r,B[i]));
const zeros=(m,n)=>Array.from({length:m},()=>Array(n).fill(0)),eye=n=>Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>+(i===j)));
const fro=A=>norm(A.flat()),copy=A=>A.map(r=>r.slice()),off=A=>norm(A.flatMap((r,i)=>r.filter((_,j)=>i!==j)));
function givensQR(A){
 const n=A.length,R=copy(A),Qt=eye(n),rotations=[];
 for(let j=0;j<n-1;j++)for(let i=n-1;i>j;i--){
  const a=R[i-1][j],b=R[i][j],length=Math.hypot(a,b),c=length?a/length:1,s=length?b/length:0;
  const before=R.map(r=>r.slice());
  for(let k=j;k<n;k++){const x=R[i-1][k],y=R[i][k];R[i-1][k]=c*x+s*y;R[i][k]=-s*x+c*y;}
  for(let k=0;k<n;k++){const x=Qt[i-1][k],y=Qt[i][k];Qt[i-1][k]=c*x+s*y;Qt[i][k]=-s*x+c*y;}
  R[i][j]=0;
  rotations.push({j,i,a,b,length,c,s,skipped:length===0,before,after:copy(R)});
 }
 return{Q:transpose(Qt),R,rotations};
}
function wilkinson(T,m){
 const a=T[m-2][m-2],d=T[m-1][m-1],b=(T[m-2][m-1]+T[m-1][m-2])/2,delta=(a-d)/2;
 if(b===0)return{value:d,a,d,b,delta,denominator:0};
 const denominator=Math.abs(delta)+Math.hypot(delta,b);
 return{value:d-(delta<0?-1:1)*b*(b/denominator),a,d,b,delta,denominator};
}
function qrChain(center=2,coupling=.4,scaleExponent=0){
 const scale=10**scaleExponent,A=zeros(4,4);
 for(let i=0;i<4;i++){A[i][i]=center*scale;if(i<3)A[i][i+1]=A[i+1][i]=coupling*scale;}
 const phi=(1+Math.sqrt(5))/2,spectrum=[center-coupling*phi,center-coupling/phi,center+coupling/phi,center+coupling*phi].map(v=>v*scale);
 return{A,spectrum,scale,center,coupling};
}
function qrRun(A,spectrum,steps,shifted){
 const n=A.length,an=fro(A);let T=copy(A),Z=eye(n),active=n,budget=0;
 const records=[],rows=[],events=[];
 function deflate(iteration){
  const local=[];
  while(active>1){
   const i=active-1,values=[];
   for(let j=0;j<i;j++)values.push(T[i][j],T[j][i]);
   const couplingNorm=norm(values),threshold=64*Number.EPSILON*(Math.abs(T[i][i])+Math.abs(T[i-1][i-1]));
   if(couplingNorm!==0&&couplingNorm>threshold)break;
   const correction=zeros(n,n),before=copy(T);
   for(let j=0;j<i;j++){correction[i][j]=-T[i][j];correction[j][i]=-T[j][i];T[i][j]=T[j][i]=0;}
   const size=fro(correction);budget+=size;
   const v={iteration,index:i,couplingNorm,threshold,size,budget,before,correction,after:copy(T)};
   local.push(v);events.push(v);active--;
  }return local;
 }
 function measure(k){
  const diagonal=T.map((r,i)=>r[i]),similarity=fro(msub(mm(mm(transpose(Z),A),Z),T)),eigenResidual=fro(msub(mm(A,Z),mm(Z,T)));
  return{k,active,diagonal,offDiagonal:off(T),tail:active>1?Math.abs(T[active-1][active-2]):0,
   diagonalDeviation:norm(sub(diagonal.slice().sort((a,b)=>a-b),spectrum)),similarity,eigenResidual,
   relativeSimilarity:an?similarity/an:0,orthogonality:fro(msub(mm(transpose(Z),Z),eye(n))),
   deflationBudget:budget,relativeDeflationBudget:an?budget/an:0,T:copy(T),Z:copy(Z)};
 }
 deflate(0);rows.push(measure(0));
 for(let k=1;k<=steps&&active>1;k++){
  const m=active,before=copy(T),shift=shifted?wilkinson(T,m):{value:0,a:null,d:null,b:null,delta:null,denominator:null};
  const shiftedMatrix=T.slice(0,m).map((r,i)=>r.slice(0,m).map((v,j)=>v-(i===j?shift.value:0)));
  const qr=givensQR(shiftedMatrix),next=mm(qr.R,qr.Q),embedded=eye(n);
  for(let i=0;i<m;i++)for(let j=0;j<m;j++){T[i][j]=next[i][j]+(i===j?shift.value:0);embedded[i][j]=qr.Q[i][j];}
  Z=mm(Z,embedded);const raw=copy(T),deflations=deflate(k);
  records.push({k,activeBefore:m,before,shift,shiftedMatrix,...qr,raw,deflations:copy(deflations.map(v=>[v.index,v.size]))});
  rows.push(measure(k));
 }
 return{method:shifted?"wilkinson":"unshifted",status:active===1?"deflated":"iteration-budget",stepsTaken:records.length,active,
  A:copy(A),spectrum:spectrum.slice(),rows,records,events,final:rows[rows.length-1]};
}
function qrModel(raw={}){
 const c=Object.assign({center:2,coupling:.4,scaleExponent:0,steps:32},raw);
 for(const [key,lo,hi,integer]of [["center",-2,4,false],["coupling",0,1,false],["scaleExponent",-12,12,true],["steps",1,64,true]]){
  const v=c[key];if(typeof v!=="number"||!Number.isFinite(v)||v<lo||v>hi||(integer&&!Number.isInteger(v)))throw Error("invalid "+key);
 }
 const p=qrChain(c.center,c.coupling,c.scaleExponent);
 return{config:c,...p,methods:[qrRun(p.A,p.spectrum,c.steps,false),qrRun(p.A,p.spectrum,c.steps,true)]};
}
function unitAngle(degrees){
 if(degrees%90===0){const k=((degrees/90)%4+4)%4;return[[1,0],[0,1],[-1,0],[0,-1]][k].slice();}
 const t=degrees*Math.PI/180;return[Math.cos(t),Math.sin(t)];
}
const normalize=x=>{const n=norm(x);if(!n||!Number.isFinite(n))throw Error("zero or nonfinite vector");return x.map(v=>v/n);};
function matrixFamily(s){
 let A,normal,real=true,values,vectors;
 if(s.kind==="symmetric"){
  const [c,t]=unitAngle(2*s.axisAngle),mid=2-s.gap/2,b=s.gap/2*t;
  A=[[mid+s.gap/2*c,b],[b,mid-s.gap/2*c]];normal=true;
  const m=(A[0][0]+A[1][1])/2,r=Math.hypot((A[0][0]-A[1][1])/2,b),large=m+r,small=(A[0][0]*A[1][1]-b*b)/large;
  values=[large,small];
  if(r===0)vectors=[null,null];
  else if(b===0)vectors=A[0][0]>A[1][1]?[[1,0],[0,1]]:[[0,1],[1,0]];
  else{const theta=.5*Math.atan2(2*b,A[0][0]-A[1][1]),v=[Math.cos(theta),Math.sin(theta)];vectors=[v,[-v[1],v[0]]];}
 }else if(s.kind==="nonnormal"){
  A=[[2,s.gamma],[0,1]];normal=s.gamma===0;values=[2,1];vectors=[[1,0],normalize([-s.gamma,1])];
 }else{
  A=[[s.realPart,-s.omega],[s.omega,s.realPart]];normal=true;real=false;values=[{real:s.realPart,imag:s.omega},{real:s.realPart,imag:-s.omega}];vectors=[null,null];
 }
 const scale=10**s.scaleExponent;A=A.map(r=>r.map(v=>v*scale));
 values=real?values.map(v=>v*scale):values.map(v=>({real:v.real*scale,imag:v.imag*scale}));
 const dominant=real&&Math.abs(values[0])!==Math.abs(values[1])?(Math.abs(values[0])>Math.abs(values[1])?0:1):null;
 return{A,normal,real,values,vectors,scale,dominant,gap:real?Math.abs(values[0]-values[1]):null};
}
function linearSolve2(M,b){
 const size=fro(M);if(size===0)return{status:"singular-shift",M:copy(M),b:b.slice(),size};
 const B=M.map(r=>r.map(v=>v/size)),rhs=b.map(v=>v/size),swapped=Math.abs(B[1][0])>Math.abs(B[0][0]);
 if(swapped){[B[0],B[1]]=[B[1],B[0]];[rhs[0],rhs[1]]=[rhs[1],rhs[0]];}
 if(B[0][0]===0)return{status:"singular-shift",M:copy(M),b:b.slice(),size,swapped};
 const multiplier=B[1][0]/B[0][0],pivot=B[1][1]-multiplier*B[0][1],last=rhs[1]-multiplier*rhs[0];
 if(pivot===0)return{status:"singular-shift",M:copy(M),b:b.slice(),size,swapped,multiplier,pivot};
 const x1=last/pivot,x0=(rhs[0]-B[0][1]*x1)/B[0][0],x=[x0,x1],residual=sub(mv(M,x),b);
 if(!x.every(Number.isFinite))return{status:"nonfinite-solve",M:copy(M),b:b.slice(),size,swapped,multiplier,pivot};
 return{status:"ok",M:copy(M),b:b.slice(),size,swapped,multiplier,pivot,
  L:[[1,0],[multiplier,1]],U:[[B[0][0],B[0][1]],[0,pivot]],permutedRhs:rhs,forwardRhs:[rhs[0],last],x,residual,
  relativeResidual:norm(residual)/(size*norm(x)+norm(b))};
}
function nearest(info,rho){
 if(!info.real||info.values[0]===info.values[1])return null;
 const a=Math.abs(info.values[0]-rho),b=Math.abs(info.values[1]-rho);return a===b?null:a<b?0:1;
}
function measure(info,x,k){
 const nx=norm(x),rho=dot(x,mv(info.A,x))/dot(x,x),residual=sub(mv(info.A,x),x.map(v=>rho*v)),rn=norm(residual),
  index=nearest(info,rho),target=index===null?null:info.vectors[index],angle=target?Math.atan2(Math.abs(x[0]*target[1]-x[1]*target[0]),Math.abs(dot(x,target))):null,
  separation=index===null?null:Math.abs(info.values[1-index]-rho),certificate=info.normal&&angle!==null&&separation>0?Math.min(1,rn/(nx*separation)):null;
 const perturbation=residual.map(v=>x.map(t=>-v*t/dot(x,x))),distance=info.real?Math.min(...info.values.map(v=>Math.abs(v-rho))):Math.hypot(rho-info.values[0].real,info.values[0].imag);
 return{k,x:x.slice(),rho,residual,residualNorm:rn,relativeResidual:fro(info.A)?rn/(fro(info.A)*nx):0,nearestIndex:index,
  targetValue:index===null?null:info.values[index],angle,separation,certificate,distance,perturbation,backwardNorm:rn/nx};
}
function vectorRun(info,x0,steps,method,fixedShift){
 let x=normalize(x0),status="iteration-budget";const rows=[measure(info,x,0)],records=[];
 for(let k=1;k<=steps;k++){
  const row=rows[rows.length-1];
  if(row.residualNorm===0){status="zero-floating-residual";break;}
  if(row.relativeResidual<=64*Number.EPSILON){status="residual-threshold";break;}
  const before=x.slice();let raw,solver=null,shift=null;
  if(method==="power"){
   raw=mv(info.A,x);if(norm(raw)===0){status="zero-product";break;}
  }else{
   shift=method==="inverse"?fixedShift:row.rho;
   const M=info.A.map((r,i)=>r.map((v,j)=>v-(i===j?shift:0)));solver=linearSolve2(M,x);
   if(solver.status!=="ok"){status=solver.status;records.push({k,before,shift,solver,accepted:false});break;}
   raw=solver.x;
  }
  x=normalize(raw);records.push({k,before,shift,solver,raw:raw.slice(),normalizer:norm(raw),after:x.slice(),accepted:true});
  rows.push(measure(info,x,k));
 }
 const last=rows[rows.length-1];
 if(status==="iteration-budget"&&last.residualNorm===0)status="zero-floating-residual";
 else if(status==="iteration-budget"&&last.relativeResidual<=64*Number.EPSILON)status="residual-threshold";
 return{method,status,rows,records,final:last,expectedIndex:method==="power"?info.dominant:method==="inverse"?nearest(info,fixedShift):null};
}
function iterationModel(raw={}){
 const s=Object.assign({kind:"symmetric",gap:2,axisAngle:20,initialAngle:5,gamma:6,realPart:0,omega:1,shift:1.9,steps:16,scaleExponent:0},raw);
 if(!["symmetric","nonnormal","rotation"].includes(s.kind))throw Error("kind");
 const fields=[["initialAngle",-90,90,false],["shift",-5,5,false],["steps",1,64,true],["scaleExponent",-12,12,true]];
 if(s.kind==="symmetric")fields.push(["gap",0,6,false],["axisAngle",0,90,false]);
 else if(s.kind==="nonnormal")fields.push(["gamma",0,50,false]);
 else fields.push(["realPart",-2,2,false],["omega",.1,2,false]);
 for(const [key,lo,hi,integer]of fields){const v=s[key];if(typeof v!=="number"||!Number.isFinite(v)||v<lo||v>hi||(integer&&!Number.isInteger(v)))throw Error("invalid "+key);}
 const info=matrixFamily(s),x0=unitAngle(s.initialAngle),shift=s.shift*info.scale;
 return{config:s,info,x0,shift,methods:["power","inverse","rayleigh"].map(method=>vectorRun(info,x0,s.steps,method,shift))};
}
function pseudospectralPoint(gamma,z,scale=1){
 const a=2-z,d=1-z,M=[[a,gamma],[0,d]],g00=a*a,g01=a*gamma,g11=gamma*gamma+d*d,
  large=(g00+g11)/2+Math.hypot((g00-g11)/2,g01),small=(a*d)**2/large;
 const candidates=[[-g01,g00-small],[g11-small,-g01]],picked=norm(candidates[0])>=norm(candidates[1])?candidates[0]:candidates[1],length=norm(picked),
  v=length?picked.map(x=>x/length):[1,0],raw=mv(M,v),E=raw.map(x=>v.map(y=>-x*y)),A=[[2,gamma],[0,1]],
  changed=A.map((r,i)=>r.map((x,j)=>(x+E[i][j])*scale)),changedResidual=sub(mv(changed,v),v.map(x=>z*scale*x));
 return{z,gamma,A:A.map(r=>r.map(x=>x*scale)),M:M.map(r=>r.map(x=>x*scale)),v,
  sigmaMin:Math.sqrt(small)*scale,sigmaMax:Math.sqrt(large)*scale,distance:Math.min(Math.abs(z-2),Math.abs(z-1))*scale,
  residual:raw.map(x=>x*scale),actualResidual:norm(raw)*scale,E:E.map(r=>r.map(x=>x*scale)),
  perturbationNorm:fro(E)*scale,changed,changedResidual};
}
function sensitivityModel(raw={}){
 const s=Object.assign({gamma:6,z:1.5,epsilon:.1,scaleExponent:0},raw);
 for(const [key,lo,hi,integer]of [["gamma",0,50,false],["z",-1,4,false],["epsilon",1e-6,1,false],["scaleExponent",-12,12,true]]){
  const v=s[key];if(typeof v!=="number"||!Number.isFinite(v)||v<lo||v>hi||(integer&&!Number.isInteger(v)))throw Error("invalid "+key);
 }
 const scale=10**s.scaleExponent,p=pseudospectralPoint(s.gamma,s.z,scale),grid=Array.from({length:101},(_,i)=>-1+i/20),
  near=grid.findIndex(x=>Math.abs(x-s.z)<=8*Number.EPSILON*Math.max(Math.abs(x),Math.abs(s.z)));
 if(near<0)grid.push(s.z);else grid[near]=s.z;grid.sort((a,b)=>a-b);
 return{config:s,scale,threshold:s.epsilon*scale,result:p,study:grid.map(z=>pseudospectralPoint(s.gamma,z,scale))};
}
const DEFAULTS={mode:"iteration",kind:"symmetric",gap:2,axisAngle:20,initialAngle:5,gamma:6,realPart:0,omega:1,shift:1.9,steps:16,scaleExponent:0,center:2,coupling:.4,z:1.5,epsilon:.1};
function num(v,key,lo,hi,integer=false){
 if(typeof v!=="number"&&typeof v!=="string")throw Error(key+"必须是有限数值");
 if(typeof v==="string"){
  v=v.trim();if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(v))throw Error(key+"不能为空或含非数字内容");
  const original=v;v=Number(v);if(v===0&&/[1-9]/.test(original.split(/e/i)[0]))throw Error(key+"发生下溢");
 }
 if(!Number.isFinite(v)||v<lo||v>hi||(integer&&!Number.isInteger(v)))throw Error(key+"须在"+lo+"至"+hi+"之间"+(integer?"且为整数":""));
 return v;
}
function config(raw={}){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))throw Error("配置须为对象");
 const s=Object.assign({},DEFAULTS),mode=Object.hasOwn(raw,"mode")?raw.mode:s.mode;
 if(!["iteration","qr","sensitivity"].includes(mode))throw Error("未知实验模式");s.mode=mode;
 const fields=[["scaleExponent",-12,12,true]];
 if(mode==="iteration"){
  s.kind=Object.hasOwn(raw,"kind")?raw.kind:s.kind;
  if(!["symmetric","nonnormal","rotation"].includes(s.kind))throw Error("未知矩阵族");
  fields.push(["initialAngle",-90,90],["shift",-5,5],["steps",1,64,true]);
  if(s.kind==="symmetric")fields.push(["gap",0,6],["axisAngle",0,90]);
  else if(s.kind==="nonnormal")fields.push(["gamma",0,50]);
  else fields.push(["realPart",-2,2],["omega",.1,2]);
 }else if(mode==="qr")fields.push(["center",-2,4],["coupling",0,1],["steps",1,64,true]);
 else fields.push(["gamma",0,50],["z",-1,4],["epsilon",1e-6,1]);
 for(const [key,lo,hi,int]of fields)s[key]=num(Object.hasOwn(raw,key)?raw[key]:s[key],key,lo,hi,int);
 return s;
}
function snapshot(raw={}){
 const s=config(raw);
 return{config:s,result:s.mode==="iteration"?iterationModel(s):s.mode==="qr"?qrModel(s):sensitivityModel(s)};
}
const PRESETS=[
 {id:"default",label:"对称：三种向量迭代"},
 {id:"small-gap",label:"小间隙：方向需要额外证据",gap:1e-8,axisAngle:0,initialAngle:35,shift:1.99999999},
 {id:"missing",label:"没有主方向的起始投影",axisAngle:0,gap:1,initialAngle:90},
 {id:"negative",label:"负特征值的模长最大",axisAngle:0,gap:5,initialAngle:35},
 {id:"equal-modulus",label:"正负模长打平",axisAngle:0,gap:4,initialAngle:35},
 {id:"repeated",label:"重根：不指定唯一方向",gap:0},
 {id:"singular",label:"固定移位正好落在谱上",axisAngle:0,gap:1,shift:2},
 {id:"nonnormal",label:"非正规：不借用角度上界",kind:"nonnormal",gamma:20},
 {id:"rotation",label:"旋转：实数域没有特征方向",kind:"rotation"},
 {id:"qr",label:"四维QR：实际移位与缩减",mode:"qr",steps:32},
 {id:"qr-tie",label:"四维正负谱：无移位停滞",mode:"qr",center:0,steps:32},
 {id:"qr-diagonal",label:"已经对角：零步缩减",mode:"qr",coupling:0},
 {id:"qr-cluster",label:"四维聚簇谱",mode:"qr",coupling:1e-8,steps:32},
 {id:"qr-scale",label:"四维链共同放大10¹²",mode:"qr",scaleExponent:12,steps:32},
 {id:"sensitivity",label:"原谱不动，伪谱截面变宽",mode:"sensitivity",gamma:20},
 {id:"normal-slice",label:"正规对照：残差等于谱距离",mode:"sensitivity",gamma:0},
 {id:"on-spectrum",label:"在原谱上：真实最小值为0",mode:"sensitivity",z:2}
];
const QUESTIONS=[
 ["幂法每轮放大的主方向由什么决定？",["特征值的模长，并且起点要有该方向的分量","代数值最大的特征值，与起点无关"],0,"模长打平或目标系数为0时，常用收敛结论的条件不成立。"],
 ["程序达到小残差阈值，能直接说向量方向已经准确吗？",["还需正规性和谱分离等条件","可以，任何矩阵都适用同一个角度上界"],0,"残差先给出非结构后向误差；方向结论还有分母和唯一性条件。"],
 ["QR缩减把小耦合设为0时，应该怎样记录？",["记录实际删除的矩阵和范数","当作精确相似变换的一部分，不必记录"],0,"缩减是有控制的近似修改，不能与正交相似变换混为一谈。"],
 ["非正规矩阵的最小奇异值很小，意味着什么？",["一个小矩阵扰动可使所选z成为特征值","所选z一定同样接近原矩阵的谱"],0,"实轴伪谱截面描述邻近矩阵的谱，原谱距离另列。"]
];
function fmt(x){
 if(x===null||x===undefined)return"—";if(typeof x==="boolean")return x?"是":"否";if(typeof x!=="number")return String(x);
 if(!Number.isFinite(x))throw Error("不能显示非有限结果");if(Number.isInteger(x))return String(x);
 return Math.abs(x)<1e-4||Math.abs(x)>=1e6?x.toExponential(8):String(Number(x.toPrecision(10)));
}
const B="#268bd2",O="#cb6a16",G="#29966c",R="#b44a72",V="#9966bb";
const names={power:"幂法",inverse:"固定移位反幂",rayleigh:"Rayleigh商迭代",unshifted:"无移位QR",wilkinson:"Wilkinson移位"};
const colors={power:B,inverse:O,rayleigh:G,unshifted:R,wilkinson:B};
const statusNames={"iteration-budget":"预算结束","zero-floating-residual":"浮点零残差","residual-threshold":"达到残差阈值","zero-product":"矩阵乘积为零","singular-shift":"移位系统奇异","nonfinite-solve":"求解产生非有限值",deflated:"已完成尾端缩减",ok:"成功"};
const series=(key,label,color,points,line=true)=>({key,label,color,points,line});
function plot(title,x,y,ss,xmin,xmax,square=false){
 const ys=ss.flatMap(s=>s.points.map(p=>p[1])),anchor=y.startsWith("log₁₀")?[]:[0],
  range=[...anchor,...ys],lo=range.length?Math.min(...range):0,hi=range.length?Math.max(...range):0,pad=(hi-lo||1)*.08;
 return{title,x,y,series:ss,xmin,xmax:xmax>xmin?xmax:xmin+1,ymin:square?xmin:lo-pad,ymax:square?xmax:hi+pad,square,markers:[]};
}
function plots(d){
 const s=d.config,p=d.result;
 if(s.mode==="iteration"){
  const methodSeries=(fn,log=false)=>p.methods.map(m=>series(m.method,names[m.method],colors[m.method],m.rows.flatMap(v=>{const y=fn(v);return y!==null&&(!log||y>0)?[[v.k,log?Math.log10(y):y]]:[];}),!log));
  return[
   plot("Rayleigh估计与实际谱：先辨认目标","已接受的迭代步","Rayleigh值 / 共同尺度",[
    ...methodSeries(v=>v.rho/p.info.scale),
    ...(p.info.real?p.info.values.map((v,i)=>series("lambda"+i,"参考特征值"+i,i?V:R,[[0,v/p.info.scale],[s.steps,v/p.info.scale]])):[])],0,s.steps),
   plot("相对残差：零值只在全表保留","已接受的迭代步","log₁₀ ||r||₂ / (||A||F ||x||₂)",methodSeries(v=>v.relativeResidual,true),0,s.steps),
   plot("最近唯一实方向：角度和正规分离上界","已接受的迭代步","sinθ 与当前sep给出的上界",p.methods.flatMap(m=>[
    series(m.method,names[m.method]+"实际sinθ",colors[m.method],m.rows.filter(v=>v.angle!==null).map(v=>[v.k,Math.sin(v.angle)]),false),
    series(m.method+"-bound",names[m.method]+"分离上界",colors[m.method],m.rows.filter(v=>v.certificate!==null).map(v=>[v.k,v.certificate]),false)]),0,s.steps),
   plot("每次归一化后的实际向量，横纵同单位","第一坐标","第二坐标",p.methods.map(m=>series(m.method,names[m.method],colors[m.method],m.rows.map(v=>v.x),false)),-1.1,1.1,true)
  ];
 }
 if(s.mode==="qr"){
  const trace=(field)=>p.methods.map(m=>series(m.method,names[m.method],colors[m.method],m.rows.filter(v=>v[field]>0).map(v=>[v.k,Math.log10(v[field])]),false));
  return[
   plot("非对角量：零值与预算结束各有记录","实际QR步数","log₁₀ ||off(Tₖ)||F / 共同尺度",p.methods.map(m=>series(m.method,names[m.method],colors[m.method],m.rows.filter(v=>v.offDiagonal>0).map(v=>[v.k,Math.log10(v.offDiagonal/p.scale)]),false)),0,s.steps),
   plot("末步对角估计与解析谱，尚未收敛时有差异","升序索引","对角估计 / 共同尺度",[
    series("reference","四维链解析谱",G,p.spectrum.map((v,i)=>[i,v/p.scale])),
    ...p.methods.map(m=>series(m.method,names[m.method],colors[m.method],m.final.diagonal.slice().sort((a,b)=>a-b).map((v,i)=>[i,v/p.scale]),false))],0,3),
   plot("累计基的正交性与相似关系分别检查","实际QR步数","log₁₀ 相对相似误差或正交性缺陷",[
    ...trace("relativeSimilarity").map(v=>({...v,key:v.key+"-similarity",label:v.label+"相似误差"})),
    ...trace("orthogonality").map(v=>({...v,key:v.key+"-orthogonality",label:v.label+"正交缺陷",color:v.key==="unshifted"?O:G}))],0,s.steps),
   plot("缩减是显式扰动：累计删除范数","实际QR步数","累计 ||ΔT||F / ||A||F",p.methods.map(m=>series(m.method,names[m.method],colors[m.method],m.rows.map(v=>[v.k,v.relativeDeflationBudget]))),0,s.steps)
  ];
 }
 return[
  plot("只看实轴截面：最小扰动与原谱距离","实数 z / 共同尺度","谱范数 / 共同尺度",[
   series("sigma","σmin(A−zI)",B,p.study.map(v=>[v.z,v.sigmaMin/p.scale])),
   series("distance","到原谱{1,2}的距离",R,p.study.map(v=>[v.z,v.distance/p.scale])),
   series("epsilon","选定扰动容许量ε",O,[[-1,s.epsilon],[4,s.epsilon]])],-1,4),
  plot("同一个向量：实际残差与最小奇异值","实数 z / 共同尺度","谱范数 / 共同尺度",[
   series("minimum","理论最小奇异值",B,p.study.map(v=>[v.z,v.sigmaMin/p.scale])),
   series("achieved","实际构造的扰动范数",G,p.study.map(v=>[v.z,v.perturbationNorm/p.scale]),false)],-1,4),
  plot("构造之后仍核对实际浮点特征方程","实数 z / 共同尺度","log₁₀ ||(A+E)v−zv||₂ / 共同尺度",[
   series("check","构造后的实际残差（零不取对数）",O,p.study.filter(v=>norm(v.changedResidual)>0).map(v=>[v.z,Math.log10(norm(v.changedResidual)/p.scale)]),false)],-1,4)
 ];
}
function ledgers(d){
 const s=d.config,p=d.result,t=(key,title,headers,rows)=>({key,title,headers,rows}),col=x=>x.map(v=>[v]),
 matrixRows=(objects)=>Object.entries(objects).flatMap(([key,A])=>A.flatMap((r,i)=>r.map((v,j)=>[key,i,j,v])));
 if(s.mode==="iteration"){
  const target=(i)=>i===null?null:p.info.values[i],mats={A:p.info.A,x0:col(p.x0)};
  const records=p.methods.flatMap(m=>m.records.map(r=>({m,...r})));
  return[
   t("summary","输入、停止规则与参考谱",["量","值"],[["矩阵族",s.kind],["正规",p.info.normal],["谱全实",p.info.real],["λ0（实部）",p.info.real?p.info.values[0]:p.info.values[0].real],["λ1（实部）",p.info.real?p.info.values[1]:p.info.values[1].real],["虚部绝对值",p.info.real?0:p.info.values[0].imag],["共同尺度",p.info.scale],["固定移位（实际单位）",p.shift],["相对残差停止阈值",64*Number.EPSILON],["残差分母", "||A||F ||x||₂"],["最大模唯一目标索引",p.info.dominant]]),
   t("methods","先读停止原因，再辨认返回的谱点",["算法","停止原因","接受步数","规则预期目标","末步最近谱点","ρ","相对残差","sinθ","正规分离上界"],p.methods.map(m=>[names[m.method],statusNames[m.status],m.final.k,target(m.expectedIndex),m.final.targetValue,m.final.rho,m.final.relativeResidual,m.final.angle===null?null:Math.sin(m.final.angle),m.final.certificate])),
   t("input","实际矩阵和初始向量",["对象","i","j","值"],matrixRows(mats)),
   t("trace","每一步的残差、当前分离和实际方向",["算法","k","x0","x1","ρ","r0","r1","||r||","相对残差","最近索引","最近谱值","到原谱距离","夹角(rad)","sep","sinθ上界","最小后向扰动范数"],p.methods.flatMap(m=>m.rows.map(r=>[names[m.method],r.k,...r.x,r.rho,...r.residual,r.residualNorm,r.relativeResidual,r.nearestIndex,r.targetValue,r.distance,r.angle,r.separation,r.certificate,r.backwardNorm]))),
   t("perturbations","每一步达到最小后向误差的显式ΔA",["算法","k","对象","i","j","值"],p.methods.flatMap(m=>m.rows.flatMap(r=>matrixRows({deltaA:r.perturbation}).map(v=>[names[m.method],r.k,...v])))),
   t("updates","所有尝试，包括奇异移位失败",["算法","k","接受","移位","之前x0","之前x1","未归一y0","未归一y1","归一尺度","之后x0","之后x1","线性求解状态","求解相对残差"],records.map(r=>[names[r.m.method],r.k,r.accepted,r.shift,...r.before,...(r.raw||[null,null]),r.normalizer,...(r.after||[null,null]),r.solver?statusNames[r.solver.status]:"矩阵乘法",r.solver?.relativeResidual])),
   t("solves","每次消元的矩阵、向量、L与U全部元素",["算法","k","对象","i","j","值"],records.filter(r=>r.solver).flatMap(r=>{const v=r.solver,m={M:v.M,b:col(v.b)};for(const key of["L","U"])if(v[key])m[key]=v[key];for(const key of["permutedRhs","forwardRhs","x","residual"])if(v[key])m[key]=col(v[key]);return matrixRows(m).map(z=>[names[r.m.method],r.k,...z]);})),
   t("pivots","消元的缩放、换行、乘子和实际主元",["算法","k","求解状态","矩阵尺度","换行","消元乘子","第二主元"],records.filter(r=>r.solver).map(r=>[names[r.m.method],r.k,statusNames[r.solver.status],r.solver.size,r.solver.swapped,r.solver.multiplier,r.solver.pivot]))
  ];
 }
 if(s.mode==="qr")return[
  t("summary","四维链与完整QR运行的边界",["量","值"],[["中心c",s.center],["近邻耦合b",s.coupling],["共同尺度",p.scale],["||A||F",fro(p.A)],...p.spectrum.map((v,i)=>["解析λ"+i,v]),["缩减常数64u",64*Number.EPSILON],["尾连接条件","||全部尾行列连接||₂ ≤ 64u(|tᵢᵢ|+|tᵢ₋₁,ᵢ₋₁|)"]]),
  t("methods","两种算法的实际末步",["算法","状态","QR步数","活动维数","非对角范数","升序对角估计差","相对相似误差","正交缺陷","累计缩减范数"],p.methods.map(m=>[names[m.method],statusNames[m.status],m.stepsTaken,m.active,m.final.offDiagonal,m.final.diagonalDeviation,m.final.relativeSimilarity,m.final.orthogonality,m.final.deflationBudget])),
  t("trace","每次相似变换后的全部误差",["算法","k","活动维数","t00","t11","t22","t33","非对角范数","活动尾元","对角估计差","||ZᵀAZ−T||F","||AZ−ZT||F","相对相似误差","正交缺陷","缩减预算","相对缩减预算"],p.methods.flatMap(m=>m.rows.map(r=>[names[m.method],r.k,r.active,...r.diagonal,r.offDiagonal,r.tail,r.diagonalDeviation,r.similarity,r.eigenResidual,r.relativeSimilarity,r.orthogonality,r.deflationBudget,r.relativeDeflationBudget]))),
  t("bases","每一步完整T和累计Z",["算法","k","对象","i","j","值"],p.methods.flatMap(m=>m.rows.flatMap(r=>matrixRows({T:r.T,Z:r.Z}).map(v=>[names[m.method],r.k,...v])))),
  t("shifts","实际局部移位参数",["算法","k","活动维数","移位μ","a","d","平均对称b","δ","稳定公式分母"],p.methods.flatMap(m=>m.records.map(r=>[names[m.method],r.k,r.activeBefore,r.shift.value,r.shift.a,r.shift.d,r.shift.b,r.shift.delta,r.shift.denominator]))),
  t("factorizations","每次分解前后、Q和R全部元素",["算法","k","对象","i","j","值"],p.methods.flatMap(m=>m.records.flatMap(r=>matrixRows({before:r.before,shifted:r.shiftedMatrix,Q:r.Q,R:r.R,raw:r.raw}).map(v=>[names[m.method],r.k,...v])))),
  t("rotations","Givens每次旋转的全部参数",["算法","k","旋转序号","消元列j","下行i","a","b","hypot","c","s","零长度跳过"],p.methods.flatMap(m=>m.records.flatMap(r=>r.rotations.map((v,i)=>[names[m.method],r.k,i,v.j,v.i,v.a,v.b,v.length,v.c,v.s,v.skipped])))),
  t("rotation-matrices","每次Givens旋转前后的完整工作矩阵",["算法","k","旋转序号","对象","i","j","值"],p.methods.flatMap(m=>m.records.flatMap(r=>r.rotations.flatMap((v,i)=>matrixRows({before:v.before,after:v.after}).map(z=>[names[m.method],r.k,i,...z]))))),
  t("deflations","每次缩减的真实删除量",["算法","事件","k","尾索引","连接范数","阈值","修改F范数","累计预算"],p.methods.flatMap(m=>m.events.map((v,i)=>[names[m.method],i,v.iteration,v.index,v.couplingNorm,v.threshold,v.size,v.budget]))),
  t("deflation-matrices","缩减前、实际修改和缩减后完整矩阵",["算法","事件","对象","i","j","值"],p.methods.flatMap(m=>m.events.flatMap((v,i)=>matrixRows({before:v.before,correction:v.correction,after:v.after}).map(z=>[names[m.method],i,...z]))))
 ];
 const q=p.result;
 return[
  t("summary","原谱距离、最小扰动和实际核对",["量","值"],[["γ",s.gamma],["共同尺度",p.scale],["实际z",s.z*p.scale],["实际容许扰动ε",p.threshold],["到原谱距离",q.distance],["σmin",q.sigmaMin],["σmax",q.sigmaMax],["实际||(A−zI)v||",q.actualResidual],["实际||E||₂=||E||F（秩1）",q.perturbationNorm],["||(A+E)v−zv||",norm(q.changedResidual)],["按σmin判定在容许集合内",q.sigmaMin<=p.threshold]]),
  t("matrices","达到下界的向量与扰动全部元素",["对象","i","j","值"],matrixRows({A:q.A,M:q.M,v:col(q.v),residual:col(q.residual),E:q.E,changed:q.changed,changedResidual:col(q.changedResidual)})),
  t("study","完整实轴扫描，不隐藏原谱上的0",["z（未缩放）","σmin","σmax","到原谱距离","v0","v1","实际残差范数","实际扰动范数","构造后残差范数","在ε集合内"],p.study.map(v=>[v.z,v.sigmaMin,v.sigmaMax,v.distance,...v.v,v.actualResidual,v.perturbationNorm,norm(v.changedResidual),v.sigmaMin<=p.threshold])),
  t("scan-matrices","每个扫描点的全部向量、扰动和构造核对",["z（未缩放）","对象","i","j","值"],p.study.flatMap(v=>matrixRows({M:v.M,v:col(v.v),residual:col(v.residual),E:v.E,changed:v.changed,changedResidual:col(v.changedResidual)}).map(row=>[v.z,...row])))
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

 const STYLE=".eigen144{color:var(--fg,#273646)}.eigen144 .eigen-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}.eigen144 label{display:flex;flex-direction:column;gap:6px}.eigen144 input,.eigen144 select{font:inherit;padding:8px;max-width:100%;background:var(--bg,#fff);color:inherit;border:1px solid #8b98a0;border-radius:5px}.eigen144 button{font:inherit;padding:8px 12px;margin:5px;cursor:pointer}.eigen144 button[aria-pressed=true]{outline:3px solid #478aaa}.eigen144 .eigen-scroll{overflow:auto;max-width:100%;margin:16px 0}.eigen144 .eigen-scroll:focus{outline:3px solid #478aaa}.eigen144 .eigen-ledger{max-height:420px}.eigen144 svg{width:900px!important;max-width:none!important;display:block;fill:currentColor;font:16px system-ui}.eigen144 table{display:table;overflow:visible;width:max-content;max-width:none;min-width:900px;border-collapse:collapse;font-variant-numeric:tabular-nums}.eigen144 th,.eigen144 td{padding:9px;border:1px solid #98a4ab;text-align:left;white-space:nowrap}.eigen144 .eigen-error{color:#c74b39}.eigen144 [hidden]{display:none!important}.eigen144 fieldset{margin:16px 0;padding:12px}.eigen144 details{margin:16px 0}.eigen144 summary{cursor:pointer;font-weight:600}.eigen144 .eigen-legend{font-size:.95em}.eigen144 .eigen-note{line-height:1.7}.eigen144 [hidden]{display:none!important}.eigen144 select{font:inherit;color:var(--fg,#282820);background:var(--bg,#faf7ef);padding:8px;max-width:100%}";
 function mount(container){
  const doc=container.ownerDocument;
  if(!doc.getElementById("eigen144-style")){const style=doc.createElement("style");style.id="eigen144-style";style.textContent=STYLE;doc.head.appendChild(style);}
  const field=(key,label,modes,kinds="")=>'<label data-modes="'+modes+'"'+(kinds?' data-kinds="'+kinds+'"':"")+'>'+label+'<input data-key="'+key+'" type="number" step="any"></label>';
  container.innerHTML='<div class="eigen144"><h3>残差小了，目标找对了吗？</h3><p>先预测，再逐步核对真实向量、相似变换和显式扰动。</p><div class="eigen-presets">'+PRESETS.map(p=>'<button type="button" data-preset="'+p.id+'">'+esc(p.label)+'</button>').join("")+'</div><div class="eigen-controls"><label>实验<select data-key="mode"><option value="iteration">二维向量迭代</option><option value="qr">四维实际QR</option><option value="sensitivity">实轴伪谱截面</option></select></label>'+
   '<label data-modes="iteration">矩阵族<select data-key="kind"><option value="symmetric">实对称</option><option value="nonnormal">上三角非正规</option><option value="rotation">旋转与复谱</option></select></label>'+
   field("gap","对称谱隙（0–6）","iteration","symmetric")+field("axisAngle","特征轴角度°（0–90）","iteration","symmetric")+
   field("initialAngle","初始向量角度°（−90–90）","iteration")+field("shift","固定移位 / 共同尺度（−5–5）","iteration")+
   field("gamma","上三角γ（0–50）","iteration sensitivity","nonnormal")+
   field("realPart","复谱实部 / 尺度（−2–2）","iteration","rotation")+field("omega","旋转频率 / 尺度（0.1–2）","iteration","rotation")+
   field("steps","迭代预算（1–64整数）","iteration qr")+field("scaleExponent","共同缩放10的指数（−12–12整数）","iteration qr sensitivity")+
   field("center","四维链中心c（−2–4）","qr")+field("coupling","四维链近邻耦合b（0–1）","qr")+
   field("z","实数z / 共同尺度（−1–4）","sensitivity")+field("epsilon","容许扰动ε / 尺度（10⁻⁶–1）","sensitivity")+'</div>'+
   QUESTIONS.map((q,i)=>'<fieldset data-question="'+i+'"><legend>'+(i+1)+'. '+esc(q[0])+'</legend>'+q[1].map((v,j)=>'<button type="button" data-choice="'+j+'" aria-pressed="false">'+esc(v)+'</button>').join("")+'</fieldset>').join("")+
   '<button type="button" data-action="reveal">揭示图与完整账本</button><button type="button" data-action="reset">重置预测</button><p class="eigen-error" role="alert"></p><p role="status"></p><div class="eigen-results" hidden></div></div>';
  const fields=Array.from(container.querySelectorAll("[data-key]")),answers=Array(4).fill(null),result=container.querySelector(".eigen-results"),reveal=container.querySelector("[data-action=reveal]"),feedback=container.querySelector("[role=status]"),error=container.querySelector("[role=alert]");
  fields.forEach(e=>e.value=DEFAULTS[e.dataset.key]);
  let revealed=false,valid=null;
  function render(d){
   const notes={iteration:"先比较规则预期目标与实际最近谱点，再读停止原因。相对残差分母为||A||F ||x||₂，阈值64×机器精度；浮点零残差不称为实数意义的精确收敛。角度按一维子空间比较，向量变号不等于方向失败。非正规、重根、谱点打平或没有实特征方向时不提供正规单方向证书。",qr:"实际执行四维显式Givens QR，并累计完整基Z。Wilkinson移位取当前活动块末尾2×2块的局部谱信息，零耦合单独处理。缩减检查全部尾行列连接，记录删除矩阵和范数；未完成缩减时明确显示预算结束。",sensitivity:"这里只计算实轴截面，不是完整复平面伪谱。原谱始终是共同尺度乘{1,2}。每个z都有实际最小奇异向量与秩一扰动E，并单独核对(A+E)v=zv的浮点残差；ε按同一尺度缩放。"};
   result.innerHTML='<p>'+notes[d.config.mode]+'</p>'+
    plots(d).map(q=>'<p>'+q.series.filter((s,i,ss)=>ss.findIndex(t=>t.label===s.label&&t.color===s.color)===i).map(s=>esc(s.label)+'（'+({"#268bd2":"蓝","#cb6a16":"橙","#29966c":"绿","#9966bb":"紫","#b44a72":"玫红"}[s.color])+'）').join("；")+'</p><div class="eigen-scroll" role="region" tabindex="0" aria-label="'+esc(q.title)+'">'+svg(q)+'</div>').join("")+
    ledgers(d).map(t=>'<details data-ledger="'+t.key+'"'+(t.key==="summary"?' open':"")+'><summary>'+esc(t.title)+'（'+t.rows.length+' 行）</summary><div class="eigen-scroll eigen-ledger" role="region" tabindex="0" aria-label="'+esc(t.title)+'"><table data-table="'+t.key+'"><thead><tr>'+t.headers.map(x=>'<th scope="col">'+esc(x)+'</th>').join("")+'</tr></thead><tbody>'+t.rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(fmt(x))+'</td>').join("")+'</tr>').join("")+'</tbody></table></div></details>').join("")+
    '<p>“—”表示对象未定义、不适用或步骤失败，不是0。对数图仅画严格正的实际值，真实0保留在完整表格中；未加绘图下限。图中每个点都来自本次运行。有限浮点核对不能替代理论证明或严格区间界。</p>';
  }
  function update(){
   const raw=Object.fromEntries(fields.map(e=>[e.dataset.key,e.value]));
   container.querySelectorAll("[data-modes]").forEach(e=>e.hidden=!e.dataset.modes.split(" ").includes(raw.mode)||(raw.mode==="iteration"&&e.dataset.kinds&&!e.dataset.kinds.split(" ").includes(raw.kind)));
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
 ck(fmt(0)==="0"&&fmt(10)==="10"&&fmt(-10)==="-10","integer display");
 let p=snapshot({axisAngle:0,gap:5,initialAngle:35,steps:64}).result;ck(p.info.dominant===1&&p.methods[0].final.targetValue===-3,"maximum modulus negative eigenvalue");
 p=snapshot({axisAngle:0,gap:1,initialAngle:90}).result;ck(p.methods[0].final.targetValue===1&&p.methods[0].expectedIndex===0,"missing initial projection");
 ck(snapshot({gap:0}).result.methods.every(m=>m.final.angle===null),"repeated direction undefined");
 ck(snapshot({kind:"rotation"}).result.methods.every(m=>m.final.certificate===null),"complex spectrum no real direction certificate");
 ck(snapshot({kind:"nonnormal"}).result.methods.every(m=>m.rows.every(r=>r.certificate===null)),"nonnormal no normal theorem");
 ck(snapshot({axisAngle:0,gap:1,shift:2}).result.methods[1].status==="singular-shift","singular fixed shift preserved");
 ck(snapshot({mode:"qr",coupling:0}).result.methods.every(m=>m.stepsTaken===0&&m.status==="deflated"),"diagonal input");
 p=snapshot({mode:"qr",center:0,steps:32}).result;ck(p.methods[0].status==="iteration-budget"&&p.methods[1].status==="deflated","positive negative modulus tie");
 p=snapshot({mode:"sensitivity",gamma:20}).result.result;ck(p.sigmaMin<.013&&p.distance===.5,"nonnormal small perturbation far from spectrum");
 ck(snapshot({mode:"sensitivity",z:2}).result.result.sigmaMin===0,"true zero not floored");
 return{status:"PASS",checks};
}
return{DEFAULTS,PRESETS,QUESTIONS,num,config,snapshot,norm,dot,transpose,mm,mv,sub,msub,zeros,eye,fro,off,copy,givensQR,wilkinson,qrChain,qrRun,qrModel,unitAngle,normalize,matrixFamily,linearSolve2,nearest,measure,vectorRun,iterationModel,pseudospectralPoint,sensitivityModel,plots,ledgers,fmt,svg,mount,selfTest};
});
