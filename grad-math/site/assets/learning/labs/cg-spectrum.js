(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;if(root&&root.CourseLearning)root.CourseLearning.register("cg-spectrum",api.mount);})(typeof window!=="undefined"?window:globalThis,function(){
"use strict";
const norm=x=>Math.hypot(...x),dot=(x,y)=>x.reduce((s,v,i)=>s+v*y[i],0),sub=(x,y)=>x.map((v,i)=>v-y[i]),axpy=(x,a,y)=>x.map((v,i)=>v+a*y[i]);
function cgRun(lambda,M,truth,x0,maxSteps,tol){
 let matvecs=0,preconditionerSolves=0;
 const operator=x=>x.map((v,i)=>lambda[i]*v),apply=x=>{matvecs++;return operator(x);},
  precondition=x=>{if(M.every(v=>v===1))return x.slice();preconditionerSolves++;return x.map((v,i)=>v/M[i]);},idealTruth=truth.slice(),b=operator(truth);
 truth=b.map((v,i)=>v/lambda[i]);
 const bn=norm(b),e0=sub(truth,x0),r0=sub(b,apply(x0)),rn0=norm(r0),mu=lambda.map((v,i)=>v/M[i]),kappa=Math.max(...mu)/Math.min(...mu),energy=x=>Math.sqrt(dot(lambda,x.map(v=>v*v))),en0=energy(e0);
 let x=x0.slice(),r=r0.slice(),z=precondition(r),rho=dot(r,z),p=z.slice(),status="iteration-budget",poly=lambda.map(()=>1),directionPoly=mu.slice();
 const rows=[],records=[],directions=[];
 function measure(k){
  const error=sub(truth,x),actual=sub(b,apply(x)),rn=norm(actual),den=bn||rn0,an=energy(error),q=kappa===1?0:(Math.sqrt(kappa)-1)/(Math.sqrt(kappa)+1),
   bound=k===0?1:kappa===1?0:Math.min(1,2*q**k);
  return{k,x:x.slice(),error,r:r.slice(),actualResidual:actual,recurrenceNorm:norm(r),actualNorm:rn,relativeResidual:den?rn/den:0,
   gap:norm(sub(r,actual)),relativeGap:den?norm(sub(r,actual))/den:0,
   aError:an,relativeAError:en0?an/en0:0,rho,poly:poly.slice(),directionPoly:directionPoly.slice(),
   actualFilter:error.map((v,i)=>e0[i]===0?null:v/e0[i]),filterGap:error.map((v,i)=>v-poly[i]*e0[i]),bound,
   weights:e0.map((v,i)=>en0?lambda[i]*v*v/(en0*en0):0),matvecs,preconditionerSolves};
 }
 function stopped(row){
  if(row.actualNorm===0)return"zero-floating-residual";
  if(row.relativeResidual<=tol)return"true-residual-threshold";
  return null;
 }
 rows.push(measure(0));
 for(let k=0;k<maxSteps;k++){
  const stop=stopped(rows.at(-1));if(stop){status=stop;break;}
  if(!(rho>0)||!Number.isFinite(rho)){status="nonpositive-rho";break;}
  const before={x:x.slice(),r:r.slice(),z:z.slice(),p:p.slice(),rho,poly:poly.slice(),directionPoly:directionPoly.slice()},Ap=apply(p),curvature=dot(p,Ap);
  if(!(curvature>0)||!Number.isFinite(curvature)){status="nonpositive-curvature";records.push({k,accepted:false,before,Ap,curvature});break;}
  const alpha=rho/curvature;x=axpy(x,alpha,p);r=axpy(r,-alpha,Ap);
  const zNext=precondition(r),rhoNext=dot(r,zNext),beta=rhoNext/rho;
  poly=poly.map((v,i)=>v-alpha*directionPoly[i]);
  directionPoly=mu.map((v,i)=>v*poly[i]+beta*directionPoly[i]);
  const pNext=axpy(zNext,beta,p);
  records.push({k,accepted:true,before,Ap,curvature,alpha,beta,zNext:zNext.slice(),rhoNext,pNext:pNext.slice()});
  directions.push(p.slice());p=pNext;z=zNext;rho=rhoNext;rows.push(measure(k+1));
 }
 const finalStop=stopped(rows.at(-1));if(finalStop)status=finalStop;
 const conjugacy=directions.map((p,i)=>directions.map(q=>{const d=Math.sqrt(dot(p,operator(p))*dot(q,operator(q)));return d?dot(p,operator(q))/d:null;}));
 return{lambda:lambda.slice(),M:M.slice(),truth:truth.slice(),idealTruth,x0:x0.slice(),b,mu,kappa,r0,e0,initialResidual:rn0,initialAError:en0,status,rows,records,final:rows.at(-1),directions,conjugacy,matvecs,preconditionerSolves};
}
function cgModel(raw={}){
 const s=Object.assign({spectrum:"uniform",condition:25,width:.01,weights:"all",preconditioner:"group",scaleExponent:0,preconditionExponent:0,steps:24,tolerance:1e-12},raw);
 for(const[k,lo,hi,int]of[["condition",1,1e6],["width",0,.1],["scaleExponent",-12,12,true],["preconditionExponent",-12,12,true],["steps",1,64,true],["tolerance",1e-15,1e-3]]){
  const v=s[k];if(typeof v!=="number"||!Number.isFinite(v)||v<lo||v>hi||(int&&!Number.isInteger(v)))throw Error("invalid "+k);
 }
 if(!["uniform","clustered","near-cluster","scalar","residual-rise"].includes(s.spectrum)||!["all","endpoints","zero"].includes(s.weights)||!["none","group","jacobi"].includes(s.preconditioner))throw Error("invalid choice");
 const scale=10**s.scaleExponent,k=s.condition,levels=[1,Math.sqrt(k),k];
 let base;
 if(s.spectrum==="residual-rise")base=[1,100];
 else if(s.spectrum==="scalar")base=Array(12).fill(7);
 else if(s.spectrum==="uniform")base=Array.from({length:12},(_,i)=>1+(k-1)*i/11);
 else base=Array.from({length:12},(_,i)=>{
  const group=Math.floor(i/4),j=i%4;
  if(s.spectrum==="clustered")return levels[group];
  if(group===0)return 1+s.width*(Math.sqrt(k)-1)*j/3;
  if(group===2)return k-s.width*(k-Math.sqrt(k))*(3-j)/3;
  return Math.sqrt(k)+s.width*Math.min(Math.sqrt(k)-1,k-Math.sqrt(k))*(2*j/3-1);
 });
 const lambda=base.map(v=>v*scale),n=lambda.length,truth=lambda.map((_,i)=>s.weights==="zero"?0:s.weights==="endpoints"?(i===0||i===n-1?1:0):1);
 if(s.spectrum==="residual-rise"&&s.weights!=="zero"){truth[0]=1;truth[1]=.001;}
 const x0=Array(n).fill(0),factor=10**s.preconditionExponent,
  M=lambda.map((v,i)=>factor*(s.preconditioner==="none"?1:s.preconditioner==="jacobi"?v:v/[1,1.25,1.5][Math.min(2,Math.floor(3*i/n))]));
 return{config:s,scale,base,lambda,M,truth,methods:[
  {id:"cg",...cgRun(lambda,Array(n).fill(1),truth,x0,s.steps,s.tolerance)},
  {id:"pcg",...cgRun(lambda,M,truth,x0,s.steps,s.tolerance)}
 ]};
}
const eye=n=>Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>+(i===j))),copy=A=>A.map(r=>r.slice()),transpose=A=>A[0].map((_,j)=>A.map(r=>r[j])),mv=(A,x)=>A.map(r=>dot(r,x)),mm=(A,B)=>A.map(r=>transpose(B).map(c=>dot(r,c))),fro=A=>norm(A.flat()),msub=(A,B)=>A.map((r,i)=>sub(r,B[i]));
function smallLS(H,rhs){
 const m=H.length,n=H[0].length,R=copy(H),g=rhs.slice(),Qt=eye(m),rotations=[];
 for(let j=0;j<n;j++)for(let i=m-1;i>j;i--){
  const a=R[i-1][j],b=R[i][j],length=Math.hypot(a,b),c=length?a/length:1,s=length?b/length:0,before=copy(R),gBefore=g.slice();
  for(let k=j;k<n;k++){const u=R[i-1][k],v=R[i][k];R[i-1][k]=c*u+s*v;R[i][k]=-s*u+c*v;}
  for(let k=0;k<m;k++){const u=Qt[i-1][k],v=Qt[i][k];Qt[i-1][k]=c*u+s*v;Qt[i][k]=-s*u+c*v;}
  const u=g[i-1],v=g[i];g[i-1]=c*u+s*v;g[i]=-s*u+c*v;R[i][j]=0;
  rotations.push({j,i,a,b,length,c,s,before,after:copy(R),gBefore,gAfter:g.slice()});
 }
 const y=Array(n).fill(0);
 for(let i=n-1;i>=0;i--){
  if(R[i][i]===0||!Number.isFinite(R[i][i]))return{status:"rank-deficient-projection",H:copy(H),rhs:rhs.slice(),R,Qt,g,rotations,y:null,residual:null};
  y[i]=(g[i]-dot(R[i].slice(i+1),y.slice(i+1)))/R[i][i];
 }
 const residual=sub(mv(H,y),rhs);
 return{status:"ok",H:copy(H),rhs:rhs.slice(),R,Qt,g,rotations,y,residual,residualNorm:norm(residual),tailNorm:norm(g.slice(n))};
}
function gmresRun(A,b,M,restart,steps,tolerance,side="none"){
 const n=A.length,bn=norm(b),an=fro(A);let x=Array(n).fill(0),status="iteration-budget",k=0,matvecs=0,preconditionerSolves=0;
 const rows=[],cycles=[],records=[];
 const apply=v=>{matvecs++;return mv(A,v);},solveM=v=>{preconditionerSolves++;return v.map((x,i)=>x/M[i]);};
 const op=v=>side==="left"?solveM(apply(v)):side==="right"?apply(solveM(v)):apply(v);
 function measure(x,cycle,inner,predicted){
  const r=sub(b,apply(x)),weighted=side==="left"?solveM(r):r.slice(),rn=norm(r),wn=norm(weighted);
  const weightedDenominator=rows.length?rows[0].weightedNorm:wn;
  return{k,cycle,inner,x:x.slice(),r,weighted,rNorm:rn,relativeResidual:bn?rn/bn:0,weightedNorm:wn,relativeWeighted:weightedDenominator?wn/weightedDenominator:0,predicted,
   predictionGap:predicted===null?null:Math.abs(wn-predicted),matvecs,preconditionerSolves};
 }
 const stopping=row=>row.rNorm===0?"zero-floating-residual":row.relativeResidual<=tolerance?"true-residual-threshold":null;
 rows.push(measure(x,0,0,null));
 while(k<steps){
  const stop=stopping(rows.at(-1));if(stop){status=stop;break;}
  const cycle=cycles.length,base=x.slice(),baseResidual=rows.at(-1).r.slice(),start=side==="left"?solveM(baseResidual):baseResidual.slice(),beta=norm(start);
  if(beta===0){status="zero-transformed-residual";break;}
  const V=[start.map(v=>v/beta)],H=Array.from({length:Math.min(restart,n)+1},()=>Array(Math.min(restart,n)).fill(0)),cycleRecord={cycle,startStep:k,base,baseResidual,start,beta,accepted:0};
  cycles.push(cycleRecord);let endCycle=false;
  for(let j=0;j<Math.min(restart,n)&&k<steps;j++){
   const raw=op(V[j]),rawNorm=norm(raw),projections=[];let w=raw.slice();
   for(let pass=0;pass<2;pass++)for(let i=0;i<=j;i++){
    const coefficient=dot(V[i],w);H[i][j]+=coefficient;const before=w.slice();w=axpy(w,-coefficient,V[i]);
    projections.push({pass,i,coefficient,before,after:w.slice()});
   }
   const h=norm(w),threshold=64*Number.EPSILON*rawNorm,nearBreakdown=h<=threshold;
   H[j+1][j]=nearBreakdown?0:h;
   if(!nearBreakdown)V.push(w.map(v=>v/h));
   const basis=V.slice(0,j+1),barBasis=V.slice(0,j+2);
   if(barBasis.length===j+1)barBasis.push(Array(n).fill(0));
   const small=H.slice(0,j+2).map(r=>r.slice(0,j+1)),rhs=[beta,...Array(j+1).fill(0)],ls=smallLS(small,rhs);
   const record={k:k+1,cycle,j,base:base.slice(),raw,rawNorm,projections,w:w.slice(),h,threshold,nearBreakdown,H:small,V:copy(basis),barV:copy(barBasis),ls,accepted:false};
   if(ls.status!=="ok"){status=ls.status;records.push(record);endCycle=true;break;}
   const correction=Array(n).fill(0);
   for(let i=0;i<=j;i++)for(let l=0;l<n;l++)correction[l]+=ls.y[i]*basis[i][l];
   const physical=side==="right"?solveM(correction):correction.slice();x=axpy(base,1,physical);k++;
   const row=measure(x,cycle,j+1,ls.residualNorm),Vmat=transpose(basis),barMat=transpose(barBasis),
    applied=basis.map(v=>side==="left"?mv(A,v).map((x,i)=>x/M[i]):side==="right"?mv(A,v.map((x,i)=>x/M[i])):mv(A,v)),
    arnoldiGap=fro(msub(transpose(applied),mm(barMat,small))),orthogonality=fro(msub(mm(transpose(Vmat),Vmat),eye(j+1)));
   // The following identities are diagnostics, not extra counted algorithm matvecs.
   Object.assign(record,{accepted:true,correction,physical,x:x.slice(),arnoldiGap,orthogonality});
   records.push(record);rows.push(row);cycleRecord.accepted++;
   const finish=stopping(row);if(finish){status=finish;endCycle=true;break;}
   if(nearBreakdown){status="arnoldi-near-breakdown";endCycle=true;break;}
  }
  cycleRecord.endStep=k;cycleRecord.final=x.slice();
  if(endCycle)break;
 }
 const stop=stopping(rows.at(-1));if(stop)status=stop;
 return{side,A:copy(A),b:b.slice(),M:M.slice(),restart,steps,tolerance,n,status,rows,records,cycles,final:rows.at(-1),matvecs,preconditionerSolves,matrixNorm:an};
}
function gmresModel(raw={}){
 const s=Object.assign({family:"grcar",gamma:1,restart:2,steps:24,tolerance:1e-12,scaleExponent:0,preconditionExponent:2},raw);
 if(!["grcar","rotation","triangular"].includes(s.family))throw Error("family");
 for(const[k,lo,hi,int]of[["gamma",0,10],["restart",1,6,true],["steps",1,48,true],["tolerance",1e-15,1e-3],["scaleExponent",-12,12,true],["preconditionExponent",-4,4,true]]){
  const v=s[k];if(typeof v!=="number"||!Number.isFinite(v)||v<lo||v>hi||(int&&!Number.isInteger(v)))throw Error("invalid "+k);
 }
 const scale=10**s.scaleExponent,n=s.family==="rotation"?2:6;
 let A;
 if(s.family==="rotation")A=[[0,-scale],[scale,0]];
 else if(s.family==="grcar")A=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>scale*(i===j?1:i===j+1?-1:j>i&&j-i<=3?s.gamma:0)));
 else A=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>scale*(i===j?1+i/5:j===i+1?s.gamma:0)));
 const b=Array.from({length:n},(_,i)=>s.family==="rotation"?(i===0?scale:0):scale),M=Array.from({length:n},(_,i)=>10**(s.preconditionExponent*i/(n-1))),ones=Array(n).fill(1);
 return{config:s,scale,A,b,M,methods:[
  {id:"full",...gmresRun(A,b,ones,n,s.steps,s.tolerance)},
  {id:"restarted",...gmresRun(A,b,ones,s.restart,s.steps,s.tolerance)},
  {id:"left",...gmresRun(A,b,M,s.restart,s.steps,s.tolerance,"left")},
  {id:"right",...gmresRun(A,b,M,s.restart,s.steps,s.tolerance,"right")}
 ]};
}
const DEFAULTS={mode:"cg",spectrum:"uniform",condition:25,width:.01,weights:"all",preconditioner:"group",scaleExponent:0,preconditionExponent:0,steps:24,tolerance:1e-12,family:"grcar",gamma:1,restart:2,metricExponent:2};
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
 const s=Object.assign({},DEFAULTS);
 const pick=(key,choices)=>{s[key]=Object.hasOwn(raw,key)?raw[key]:s[key];if(!choices.includes(s[key]))throw Error("未知"+key);};
 pick("mode",["cg","gmres","precondition"]);
 const fields=[["scaleExponent",-12,12,true],["tolerance",1e-15,1e-3]];
 if(s.mode==="cg"){
  pick("spectrum",["uniform","clustered","near-cluster","scalar","residual-rise"]);pick("weights",["all","endpoints","zero"]);pick("preconditioner",["none","group","jacobi"]);
  fields.push(["steps",1,64,true],["preconditionExponent",-12,12,true]);
  if(!["scalar","residual-rise"].includes(s.spectrum))fields.push(["condition",1,1e6]);
  if(s.spectrum==="near-cluster")fields.push(["width",0,.1]);
 }else{
  pick("family",["grcar","rotation","triangular"]);fields.push(["steps",1,48,true],["restart",1,6,true],["metricExponent",-4,4,true]);
  if(s.family!=="rotation")fields.push(["gamma",0,10]);
 }
 for(const [key,lo,hi,int]of fields)s[key]=num(Object.hasOwn(raw,key)?raw[key]:s[key],key,lo,hi,int);
 return s;
}
function snapshot(raw={}){const s=config(raw);return{config:s,result:s.mode==="cg"?cgModel(s):gmresModel({...s,preconditionExponent:s.metricExponent})};}
const PRESETS=[
 {id:"default",label:"CG：区间界与真实轨迹"},
 {id:"cluster",label:"三个不同谱点",spectrum:"clustered"},
 {id:"near-cluster",label:"三个有宽度的谱簇",spectrum:"near-cluster",condition:1000,width:.08},
 {id:"endpoints",label:"只激发首尾两个方向",weights:"endpoints"},
 {id:"zero",label:"初始残差确实为0",weights:"zero"},
 {id:"scalar",label:"κ=1：预条件也可能多走几步",spectrum:"scalar"},
 {id:"small-units",label:"单位缩小：仍检查相对真残差",scaleExponent:-12},
 {id:"scaled-M",label:"把M放大，不伪造收敛",preconditioner:"none",preconditionExponent:12},
 {id:"residual-rise",label:"CG残差首步上升4.95倍",spectrum:"residual-rise",preconditioner:"none"},
 {id:"jacobi",label:"对角模型的Jacobi就是直接求解",preconditioner:"jacobi"},
 {id:"gmres",label:"完整基与重启基",mode:"gmres"},
 {id:"rotation-one",label:"旋转：GMRES(1)停滞",mode:"gmres",family:"rotation",restart:1},
 {id:"rotation-two",label:"旋转：保留两步可解",mode:"gmres",family:"rotation",restart:2},
 {id:"near-breakdown",label:"全维浮点结果仍需验真残差",mode:"gmres",family:"triangular",gamma:10,restart:6},
 {id:"weighted",label:"加权下降，原残差反而上升",mode:"precondition",family:"grcar",gamma:0,restart:1},
 {id:"identity-M",label:"左右都取M=I的对照",mode:"precondition",metricExponent:0}
];
const QUESTIONS=[
 ["CG的精确算术最优性针对哪个量？",["A范数误差","所有误差和残差的每一种范数"],0,"A范数误差不增，不推出残差二范数单调。"],
 ["可逆矩阵能保证GMRES(1)一定收敛吗？",["不能，重启可以不断丢掉有用方向","能，每周期至少使残差严格变小"],0,"旋转矩阵上最优第一步可以是零修正，每次重启又回到同一问题。"],
 ["把M整体放大导致rᵀM⁻¹r很小，可以直接标记零残差吗？",["不能，应检查所声明的实际残差标准","可以，rho很小就是原方程已经解好"],0,"rho携带预条件器的尺度，不能替代原方程的真残差。"],
 ["左预条件GMRES实际最小化什么？",["当前空间里的||M⁻¹r||₂","一定是原始||r||₂"],0,"左右预条件保留同一个解，却可能改变搜索空间与被最小化的范数。"]
];
function fmt(x){
 if(x===null||x===undefined)return"—";if(typeof x==="boolean")return x?"是":"否";if(typeof x!=="number")return String(x);
 if(!Number.isFinite(x))throw Error("不能显示非有限结果");if(Number.isInteger(x))return String(x);
 return Math.abs(x)<1e-4||Math.abs(x)>=1e6?x.toExponential(8):String(Number(x.toPrecision(10)));
}
const B="#268bd2",O="#cb6a16",G="#29966c",R="#b44a72",V="#9966bb";
const names={cg:"原始CG",pcg:"预条件CG",full:"完整GMRES",restarted:"重启GMRES",left:"左预条件",right:"右预条件"},colors={cg:B,pcg:O,full:G,restarted:B,left:R,right:O};
const statusNames={"iteration-budget":"预算结束","zero-floating-residual":"浮点真残差为0","true-residual-threshold":"真残差达到阈值","nonpositive-rho":"rho非正或非有限","nonpositive-curvature":"方向曲率非正或非有限","zero-transformed-residual":"变换后残差为0但原残差未过关","rank-deficient-projection":"小最小二乘秩亏","arnoldi-near-breakdown":"Arnoldi近退化且真残差未过关",ok:"成功"};
const series=(key,label,color,points,line=true)=>({key,label,color,points,line});
function plot(title,x,y,ss,xmin,xmax){
 const ys=ss.flatMap(s=>s.points.map(p=>p[1])),range=y.startsWith("log₁₀")?ys:[0,...ys],lo=range.length?Math.min(...range):0,hi=range.length?Math.max(...range):0,pad=(hi-lo||1)*.08;
 return{title,x,y,series:ss,xmin,xmax:xmax>xmin?xmax:xmin+1,ymin:lo-pad,ymax:hi+pad,square:false,markers:[]};
}
function plots(d){
 const s=d.config,p=d.result;
 const traces=(key,log=true)=>p.methods.map(m=>series(m.id,names[m.id],colors[m.id],m.rows.flatMap(r=>r[key]!==null&&(!log||r[key]>0)?[[r.k,log?Math.log10(r[key]):r[key]]]:[]),!log));
 if(s.mode==="cg")return[
  plot("A范数误差与精确算术Chebyshev比较界","实际CG/PCG步数","log₁₀ 归一化A误差与区间界",p.methods.flatMap(m=>[
   series(m.id,names[m.id]+"实际A误差",colors[m.id],m.rows.filter(r=>r.relativeAError>0).map(r=>[r.k,Math.log10(r.relativeAError)]),false),
   series(m.id+"-bound",names[m.id]+"精确算术区间界",m.id==="cg"?G:R,m.rows.filter(r=>r.bound>0).map(r=>[r.k,Math.log10(r.bound)]),false)]),0,s.steps),
  plot("真实残差允许上升；不会钳到1","实际CG/PCG步数","log₁₀ ||b−Ax||₂ / ||b||₂",traces("relativeResidual"),0,s.steps),
  plot("递推与重算残差的差距，零留在表中","实际CG/PCG步数","log₁₀ ||r(rec)−r(true)||₂ / ||b||₂",traces("relativeGap"),0,s.steps),
  plot("末步多项式作用，与实际方向误差比核对","原始方向索引i","滤波值（无初始误差的方向留空）",p.methods.flatMap(m=>[
   series(m.id+"-poly",names[m.id]+"递推多项式",colors[m.id],m.final.poly.map((v,i)=>[i,v]),false),
   series(m.id+"-actual",names[m.id]+"实际误差分量比",m.id==="cg"?G:R,m.final.actualFilter.flatMap((v,i)=>v===null?[]:[[i,v]]),false)]),0,p.lambda.length-1),
  plot("同一输入方向：有效谱按自身最小值归一","原始方向索引i","μᵢ / μmin",p.methods.map(m=>series(m.id,names[m.id],colors[m.id],m.mu.map((v,i)=>[i,v/Math.min(...m.mu)]),false)),0,p.lambda.length-1),
  plot("前三步放大：能量下降，不等于残差下降","实际CG/PCG步数（最多前三步）","相对初值的范数，保留真实零",p.methods.flatMap(m=>[
   series(m.id+"-residual",names[m.id]+"真残差",colors[m.id],m.rows.filter(r=>r.k<=3).map(r=>[r.k,r.relativeResidual])),
   series(m.id+"-energy",names[m.id]+"A误差",m.id==="cg"?G:R,m.rows.filter(r=>r.k<=3).map(r=>[r.k,r.relativeAError]),false)]),0,Math.min(3,s.steps))
 ];
 const result=[
  plot("原方程真残差：所有方法按同一标准验收","全部周期累计接受步数","log₁₀ ||b−Ax||₂ / ||b||₂",traces("relativeResidual"),0,s.steps),
  plot("各方法正在最小化的范数，分母取各自初值","全部周期累计接受步数","log₁₀ 相对目标残差（左侧为加权范数）",traces("relativeWeighted"),0,s.steps),
  plot("小最小二乘预测与实际目标残差的差距","全部周期累计接受步数","log₁₀ 预测差 / 初始目标残差",p.methods.map(m=>series(m.id,names[m.id],colors[m.id],m.rows.filter(r=>r.predictionGap!==null&&r.predictionGap>0).map(r=>[r.k,Math.log10(r.predictionGap/m.rows[0].weightedNorm)]),false)),0,s.steps),
  plot("两遍正交化后的实际基正交性","全部周期累计接受步数","log₁₀ ||VᵀV−I||F",p.methods.map(m=>series(m.id,names[m.id],colors[m.id],m.records.filter(r=>r.accepted&&r.orthogonality>0).map(r=>[r.k,Math.log10(r.orthogonality)]),false)),0,s.steps)
 ];
 if(s.mode==="precondition")result.push(plot("同一运行的两种残差：左侧可以背向变化","全部周期累计接受步数","各自初值归一的残差",p.methods.filter(m=>m.id==="left"||m.id==="right").flatMap(m=>[
  series(m.id+"-true",names[m.id]+"原始残差",colors[m.id],m.rows.map(r=>[r.k,r.relativeResidual])),
  series(m.id+"-weighted",names[m.id]+"目标残差",m.id==="left"?V:B,m.rows.map(r=>[r.k,r.relativeWeighted]),false)]),0,s.steps));
 if(s.mode==="gmres")result.push(plot("线性刻度保留零：比较原始残差","全部周期累计接受步数","||b−Ax||₂ / ||b||₂（含真实零）",traces("relativeResidual",false),0,s.steps));
 return result;
}
function ledgers(d){
 const s=d.config,p=d.result,t=(key,title,headers,rows)=>({key,title,headers,rows}),col=x=>x.map(v=>[v]),
  matrices=objects=>Object.entries(objects).flatMap(([key,A])=>A.flatMap((r,i)=>r.map((v,j)=>[key,i,j,v])));
 if(s.mode==="cg")return[
  t("summary","CG问题、预条件与停止规则",["量","值"],[["谱类型",s.spectrum],["初始权重",s.weights],["维数",p.lambda.length],["原始谱条件数",Math.max(...p.lambda)/Math.min(...p.lambda)],["共同单位尺度",p.scale],["预条件类型",s.preconditioner],["M额外共同因子",10**s.preconditionExponent],["真残差相对阈值",s.tolerance],["步数预算",s.steps]]),
  t("methods","实际停止状态，不能用rho代替真残差",["方法","停止原因","接受步数","κeff","相对A误差","相对真残差","递推gap","矩阵乘向量次数","非平凡预条件求解次数"],p.methods.map(m=>[names[m.id],statusNames[m.status],m.final.k,m.kappa,m.final.relativeAError,m.final.relativeResidual,m.final.gap,m.matvecs,m.preconditionerSolves])),
  t("input","完整对角输入、理想向量与实际输入的对角参考",["方法","i","λᵢ","mᵢ","μᵢ","bᵢ","理想数据向量","实际bᵢ/λᵢ参考","x0","初始误差","初始残差","初始A能量权重"],p.methods.flatMap(m=>m.lambda.map((v,i)=>[names[m.id],i,v,m.M[i],m.mu[i],m.b[i],m.idealTruth[i],m.truth[i],m.x0[i],m.e0[i],m.r0[i],m.rows[0].weights[i]]))),
  t("trace","每一步的不同误差和实际调用量",["方法","k","A误差","归一A误差","真残差","相对真残差","递推残差","递推gap","相对gap","rho","精确算术Cheb界","matvec","M求解"],p.methods.flatMap(m=>m.rows.map(r=>[names[m.id],r.k,r.aError,r.relativeAError,r.actualNorm,r.relativeResidual,r.recurrenceNorm,r.gap,r.relativeGap,r.rho,r.bound,r.matvecs,r.preconditionerSolves]))),
  t("vectors","每一步的完整向量与逐方向多项式",["方法","k","i","xᵢ","eᵢ","r(rec)ᵢ","r(true)ᵢ","多项式P(μᵢ)","方向多项式S(μᵢ)","实际误差比","误差与P e0之差"],p.methods.flatMap(m=>m.rows.flatMap(r=>r.x.map((v,i)=>[names[m.id],r.k,i,v,r.error[i],r.r[i],r.actualResidual[i],r.poly[i],r.directionPoly[i],r.actualFilter[i],r.filterGap[i]])))),
  t("updates","所有更新系数，未接受步骤也保留",["方法","k","接受","rho前","pᵀAp","α","β","rho后"],p.methods.flatMap(m=>m.records.map(r=>[names[m.id],r.k,r.accepted,r.before.rho,r.curvature,r.alpha,r.beta,r.rhoNext]))),
  t("update-vectors","每次递推的所有输入与输出",["方法","k","对象","i","j","值"],p.methods.flatMap(m=>m.records.flatMap(r=>{
   const a={xBefore:col(r.before.x),rBefore:col(r.before.r),zBefore:col(r.before.z),pBefore:col(r.before.p),Ap:col(r.Ap),polyBefore:col(r.before.poly),directionPolyBefore:col(r.before.directionPoly)};
   if(r.accepted)Object.assign(a,{zNext:col(r.zNext),pNext:col(r.pNext)});
   return matrices(a).map(v=>[names[m.id],r.k,...v]);
  }))),
  t("conjugacy","全部搜索方向的实际归一A内积",["方法","方向i","方向j","pᵢᵀApⱼ / (||pᵢ||A ||pⱼ||A)"],p.methods.flatMap(m=>m.conjugacy.flatMap((r,i)=>r.map((v,j)=>[names[m.id],i,j,v]))))
 ];
 return[
  t("summary","GMRES输入、重启与原残差标准",["量","值"],[["矩阵族",s.family],["维数",p.A.length],["γ",s.family==="rotation"?null:s.gamma],["共同尺度",p.scale],["重启预算",s.restart],["总接受步数预算",s.steps],["真残差相对阈值",s.tolerance],["M最大指数",s.metricExponent],["近退化阈值","64u ||算子v||₂"]]),
  t("methods","四种实际运行与各自停止原因",["方法","预条件侧","停止原因","接受步数","周期数","实际周期维数上限","原始相对残差","相对目标残差","matvec","M求解"],p.methods.map(m=>[names[m.id],m.side,statusNames[m.status],m.final.k,m.cycles.length,Math.min(m.restart,m.n),m.final.relativeResidual,m.final.relativeWeighted,m.matvecs,m.preconditionerSolves])),
  t("input","完整A、b和每种运行的M",["方法","对象","i","j","值"],p.methods.flatMap(m=>matrices({A:m.A,b:col(m.b),Mdiagonal:col(m.M)}).map(v=>[names[m.id],...v]))),
  t("trace","每一步原始残差、目标残差和预测差",["方法","k","周期","周期内步","原始残差","原始相对残差","目标残差","目标相对残差","小LS预测残差","预测绝对差","matvec","M求解"],p.methods.flatMap(m=>m.rows.map(r=>[names[m.id],r.k,r.cycle,r.inner,r.rNorm,r.relativeResidual,r.weightedNorm,r.relativeWeighted,r.predicted,r.predictionGap,r.matvecs,r.preconditionerSolves]))),
  t("vectors","全部解、原始残差与目标残差向量",["方法","k","对象","i","j","值"],p.methods.flatMap(m=>m.rows.flatMap(r=>matrices({x:col(r.x),residual:col(r.r),targetResidual:col(r.weighted)}).map(v=>[names[m.id],r.k,...v])))),
  t("cycles","每次重启的实际起点",["方法","周期","起始总步","终止总步","接受步","β","对象","i","j","值"],p.methods.flatMap(m=>m.cycles.flatMap(c=>matrices({base:col(c.base),baseResidual:col(c.baseResidual),start:col(c.start),final:col(c.final||c.base)}).map(v=>[names[m.id],c.cycle,c.startStep,c.endStep,c.accepted,c.beta,...v])))),
  t("arnoldi","每步Arnoldi与近退化判据",["方法","k","周期","内索引j","接受","||算子v||","剩余h","阈值","近退化","实际Arnoldi缺陷","基正交缺陷","小LS状态"],p.methods.flatMap(m=>m.records.map(r=>[names[m.id],r.k,r.cycle,r.j,r.accepted,r.rawNorm,r.h,r.threshold,r.nearBreakdown,r.arnoldiGap,r.orthogonality,statusNames[r.ls.status]]))),
  t("bases","所有基、小H与物理修正的全部元素",["方法","k","对象","i","j","值"],p.methods.flatMap(m=>m.records.flatMap(r=>{
   const a={H:r.H,V_as_columns:transpose(r.V),barV_as_columns:transpose(r.barV),raw:col(r.raw),remaining:col(r.w),base:col(r.base)};
   if(r.accepted)Object.assign(a,{correction:col(r.correction),physical:col(r.physical),x:col(r.x)});
   return matrices(a).map(v=>[names[m.id],r.k,...v]);
  }))),
  t("projections","两遍MGS每个投影与工作向量",["方法","k","投影次序","遍","基索引","系数","坐标","之前","之后"],p.methods.flatMap(m=>m.records.flatMap(r=>r.projections.flatMap((v,j)=>v.before.map((x,i)=>[names[m.id],r.k,j,v.pass,v.i,v.coefficient,i,x,v.after[i]]))))),
  t("least-squares","每个小最小二乘的全部矩阵和向量",["方法","k","对象","i","j","值"],p.methods.flatMap(m=>m.records.flatMap(r=>{
   const v=r.ls,a={H:v.H,R:v.R,Qt:v.Qt,rhs:col(v.rhs),g:col(v.g)};
   if(v.y)Object.assign(a,{y:col(v.y),residual:col(v.residual)});
   return matrices(a).map(z=>[names[m.id],r.k,...z]);
  }))),
  t("rotations","小最小二乘Givens的全部参数",["方法","k","旋转次序","列j","下行i","a","b","hypot","c","s"],p.methods.flatMap(m=>m.records.flatMap(r=>r.ls.rotations.map((v,i)=>[names[m.id],r.k,i,v.j,v.i,v.a,v.b,v.length,v.c,v.s])))),
  t("rotation-matrices","所有Givens旋转前后的矩阵与右端",["方法","k","旋转次序","对象","i","j","值"],p.methods.flatMap(m=>m.records.flatMap(r=>r.ls.rotations.flatMap((v,i)=>matrices({before:v.before,after:v.after,gBefore:col(v.gBefore),gAfter:col(v.gAfter)}).map(z=>[names[m.id],r.k,i,...z])))))
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

 const STYLE=".krylov145{color:var(--fg,#273646)}.krylov145 .krylov-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}.krylov145 label{display:flex;flex-direction:column;gap:6px}.krylov145 input,.krylov145 select{font:inherit;padding:8px;max-width:100%;background:var(--bg,#fff);color:inherit;border:1px solid #8b98a0;border-radius:5px}.krylov145 button{font:inherit;padding:8px 12px;margin:5px;cursor:pointer}.krylov145 button[aria-pressed=true]{outline:3px solid #478aaa}.krylov145 .krylov-scroll{overflow:auto;max-width:100%;margin:16px 0}.krylov145 .krylov-scroll:focus{outline:3px solid #478aaa}.krylov145 .krylov-ledger{max-height:420px}.krylov145 svg{width:900px!important;max-width:none!important;display:block;fill:currentColor;font:16px system-ui}.krylov145 table{display:table;overflow:visible;width:max-content;max-width:none;min-width:900px;border-collapse:collapse;font-variant-numeric:tabular-nums}.krylov145 th,.krylov145 td{padding:9px;border:1px solid #98a4ab;text-align:left;white-space:nowrap}.krylov145 .krylov-error{color:#c74b39}.krylov145 [hidden]{display:none!important}.krylov145 fieldset{margin:16px 0;padding:12px}.krylov145 details{margin:16px 0}.krylov145 summary{cursor:pointer;font-weight:600}.krylov145 .krylov-legend{font-size:.95em}.krylov145 .krylov-note{line-height:1.7}.krylov145 [hidden]{display:none!important}.krylov145 select{font:inherit;color:var(--fg,#282820);background:var(--bg,#faf7ef);padding:8px;max-width:100%}";
 function mount(container){
  const doc=container.ownerDocument;
  if(!doc.getElementById("krylov145-style")){const style=doc.createElement("style");style.id="krylov145-style";style.textContent=STYLE;doc.head.appendChild(style);}
  const field=(key,label,modes,extra="")=>'<label data-modes="'+modes+'" '+extra+'>'+label+'<input data-key="'+key+'" type="number" step="any"></label>';
  container.innerHTML='<div class="krylov145"><h3>算法在变小的，是哪一种误差？</h3><p>先预测，再查看真实递推、全部基与每个残差。</p><div class="krylov-presets">'+PRESETS.map(p=>'<button type="button" data-preset="'+p.id+'">'+esc(p.label)+'</button>').join("")+'</div><div class="krylov-controls"><label>实验<select data-key="mode"><option value="cg">CG、谱与能量</option><option value="gmres">GMRES与重启</option><option value="precondition">左右预条件与两种残差</option></select></label>'+
   '<label data-modes="cg">谱类型<select data-key="spectrum"><option value="uniform">均匀谱</option><option value="clustered">三个重复谱点</option><option value="near-cluster">三个有宽度的簇</option><option value="scalar">标量矩阵7I</option><option value="residual-rise">残差上升的2维算例</option></select></label>'+
   field("condition","谱端点比κ（1–10⁶）","cg",'data-spectra="uniform clustered near-cluster"')+
   field("width","簇宽参数（0–0.1）","cg",'data-spectra="near-cluster"')+
   '<label data-modes="cg">初始误差方向<select data-key="weights"><option value="all">全部方向</option><option value="endpoints">仅首尾方向</option><option value="zero">零右端、零初值</option></select></label>'+
   '<label data-modes="cg">第二条运行的M<select data-key="preconditioner"><option value="none">共同因子乘I</option><option value="group">透明谱分组</option><option value="jacobi">Jacobi对角</option></select></label>'+
   field("preconditionExponent","M共同因子10的指数（−12–12整数）","cg")+
   '<label data-modes="gmres precondition">矩阵族<select data-key="family"><option value="grcar">六维Grcar族</option><option value="rotation">二维90°旋转</option><option value="triangular">六维上三角族</option></select></label>'+
   field("gamma","上三角耦合γ（0–10）","gmres precondition",'data-families="grcar triangular"')+
   field("restart","每周期最多维数m（1–6整数）","gmres precondition")+
   field("metricExponent","M对角从1到10的指数（−4–4整数）","gmres precondition")+
   field("steps","总步数预算（CG≤64，GMRES≤48整数）","cg gmres precondition")+
   field("tolerance","相对真残差阈值（10⁻¹⁵–10⁻³）","cg gmres precondition")+
   field("scaleExponent","A与b共同缩放10的指数（−12–12整数）","cg gmres precondition")+'</div>'+
   QUESTIONS.map((q,i)=>'<fieldset data-question="'+i+'"><legend>'+(i+1)+'. '+esc(q[0])+'</legend>'+q[1].map((v,j)=>'<button type="button" data-choice="'+j+'" aria-pressed="false">'+esc(v)+'</button>').join("")+'</fieldset>').join("")+
   '<button type="button" data-action="reveal">揭示图与完整账本</button><button type="button" data-action="reset">重置预测</button><p class="krylov-error" role="alert"></p><p role="status"></p><div class="krylov-results" hidden></div></div>';
  const fields=Array.from(container.querySelectorAll("[data-key]")),answers=Array(4).fill(null),result=container.querySelector(".krylov-results"),reveal=container.querySelector("[data-action=reveal]"),feedback=container.querySelector("[role=status]"),error=container.querySelector("[role=alert]");
  fields.forEach(e=>e.value=DEFAULTS[e.dataset.key]);
  let revealed=false,valid=null;
  function render(d){
   const notes={cg:"两条运行求解相同的对角系统。CG最小化A范数误差，原始残差可以上升；Chebyshev线是精确算术比较界，不是包含舍入的工程保证。PCG的M每项都公开，M整体缩放不应伪造成功。初始误差严格为0的方向不定义滤波比；生成数据向量与实际bᵢ/λᵢ参考单独列出。",gmres:"所有运行执行两遍MGS Arnoldi和真实Givens小最小二乘。完整GMRES最多保留n维，重启方法每周期最多保留min(m,n)维；真实原残差统一判停。近退化的剩余向量、阈值和实际Arnoldi缺陷都保留，未过原残差标准不能宣称完成。",precondition:"左预条件最小化||M⁻¹r||₂；右预条件最小化原始||r||₂。两种曲线各按自己的初始范数归一，原始残差仍按同一个阈值验收。默认加权反例可使目标残差下降而原始残差上升；M=I预设提供直接对照。"};
   result.innerHTML='<p>'+notes[d.config.mode]+'</p>'+
    plots(d).map(q=>'<p>'+q.series.filter((s,i,ss)=>ss.findIndex(t=>t.label===s.label&&t.color===s.color)===i).map(s=>esc(s.label)+'（'+({"#268bd2":"蓝","#cb6a16":"橙","#29966c":"绿","#9966bb":"紫","#b44a72":"玫红"}[s.color])+'）').join("；")+'</p><div class="krylov-scroll" role="region" tabindex="0" aria-label="'+esc(q.title)+'">'+svg(q)+'</div>').join("")+
    ledgers(d).map(t=>'<details data-ledger="'+t.key+'"'+(t.key==="summary"?' open':"")+'><summary>'+esc(t.title)+'（'+t.rows.length+' 行）</summary><div class="krylov-scroll krylov-ledger" role="region" tabindex="0" aria-label="'+esc(t.title)+'"><table data-table="'+t.key+'"><thead><tr>'+t.headers.map(x=>'<th scope="col">'+esc(x)+'</th>').join("")+'</tr></thead><tbody>'+t.rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(fmt(x))+'</td>').join("")+'</tr>').join("")+'</tbody></table></div></details>').join("")+
    '<p>“—”表示不适用、未定义或失败，不是0。对数图仅显示严格正的实际值；真实0与超过1的残差都未钳制。次数列统计求解及显式残差检查调用；额外的恒等式诊断不计入算法调用。这里逐步重建小QR，不能将其耗时当作优化库性能。有限浮点实验不替代理论证明。</p>';
  }
  function update(){
   const raw=Object.fromEntries(fields.map(e=>[e.dataset.key,e.value]));
   container.querySelectorAll("[data-modes]").forEach(e=>e.hidden=!e.dataset.modes.split(" ").includes(raw.mode)||(raw.mode==="cg"&&e.dataset.spectra&&!e.dataset.spectra.split(" ").includes(raw.spectrum))||(raw.mode!=="cg"&&e.dataset.families&&!e.dataset.families.split(" ").includes(raw.family)));
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
 ck(fmt(1e-5)!=="0","small values preserved");
 let p=snapshot({spectrum:"residual-rise"}).result.methods[0];ck(Math.abs(p.rows[1].relativeResidual-4.95)<1e-12&&p.rows[1].relativeAError<1,"residual rises while energy falls");
 p=snapshot({scaleExponent:-12}).result.methods[0];ck(p.final.k>0&&p.final.relativeResidual<1e-12,"small units are not zero solution");
 p=snapshot({preconditioner:"none",preconditionExponent:12}).result.methods[1];ck(p.final.k>0&&p.final.relativeResidual<1e-12,"M scaling is not false convergence");
 ck(snapshot({weights:"zero"}).result.methods.every(m=>m.final.k===0&&m.final.actualNorm===0),"actual initial zero");
 p=snapshot({mode:"gmres",family:"rotation",restart:1}).result;ck(p.methods[0].final.k===2&&p.methods[0].final.rNorm===0,"full rotation solved");ck(p.methods[1].final.relativeResidual===1&&p.methods[1].status==="iteration-budget","restart one stagnation");
 p=snapshot({mode:"precondition",family:"grcar",gamma:0,restart:1}).result.methods[2];ck(p.rows[1].relativeResidual>1&&p.rows[1].relativeWeighted<1,"weighted progress not physical progress");
 p=snapshot({condition:1+4*Number.EPSILON}).result.methods[0];ck(p.rows.length<2||p.rows[1].bound>0,"nearly scalar is not exact scalar");
 return{status:"PASS",checks};
}
return{DEFAULTS,PRESETS,QUESTIONS,num,config,snapshot,norm,dot,sub,axpy,eye,copy,transpose,mv,mm,fro,msub,cgRun,cgModel,smallLS,gmresRun,gmresModel,fmt,plots,ledgers,svg,mount,selfTest};
});
