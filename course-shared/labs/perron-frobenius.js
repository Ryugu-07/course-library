(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;if(root&&root.CourseLearning)root.CourseLearning.register("perron-frobenius",api.mount);})(typeof window!=="undefined"?window:globalThis,function(){
"use strict";
const dot=(x,y)=>x.reduce((s,v,i)=>s+v*y[i],0),l1=x=>x.reduce((s,v)=>s+Math.abs(v),0),norm=x=>Math.hypot(...x),tr=A=>A[0].map((_,j)=>A.map(r=>r[j])),mv=(A,x)=>A.map(r=>dot(r,x)),mm=(A,B)=>A.map(r=>tr(B).map(c=>dot(r,c))),eye=n=>Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>+(i===j))),add=(A,B)=>A.map((r,i)=>r.map((x,j)=>x+B[i][j])),sub=(A,B)=>A.map((r,i)=>r.map((x,j)=>x-B[i][j])),mul=(A,c)=>A.map(r=>r.map(x=>x*c)),fro=A=>norm(A.flat()),outer=(x,y)=>x.map(v=>y.map(w=>v*w)),unit=x=>{const n=l1(x);return n?x.map(v=>v/n):null;};
function gcd(a,b){a=a<0n?-a:a;b=b<0n?-b:b;while(b){const t=a%b;a=b;b=t;}return a;}
function rat(n,d=1n){if(!d)throw Error("zero rational denominator");if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return{n:n/g,d:d/g};}
function exact(x){
 if(!Number.isFinite(x))throw Error("finite number required");if(x===0)return rat(0n);
 const v=new DataView(new ArrayBuffer(8));v.setFloat64(0,x);
 const h=v.getUint32(0),l=v.getUint32(4),e=(h>>>20)&2047,sign=(h>>>31)?-1n:1n,m=(BigInt(h&1048575)<<32n)|BigInt(l);
 const n=sign*(e?m+(1n<<52n):m),k=e?e-1075:-1074;
 return k>=0?rat(n<<BigInt(k)):rat(n,1n<<BigInt(-k));
}
const qa=(a,b)=>rat(a.n*b.d+b.n*a.d,a.d*b.d),qn=a=>({n:-a.n,d:a.d}),qs=(a,b)=>qa(a,qn(b)),qm=(a,b)=>rat(a.n*b.n,a.d*b.d),qd=(a,b)=>rat(a.n*b.d,a.d*b.n),qabs=a=>({n:a.n<0n?-a.n:a.n,d:a.d}),qcmp=(a,b)=>{const n=a.n*b.d-b.n*a.d;return n<0n?-1:n>0n?1:0;};
function qvalue(a){if(!a.n)return 0;const sign=a.n<0n?-1:1,n=a.n<0n?-a.n:a.n,s=Math.max(0,n.toString(2).length-53),t=Math.max(0,a.d.toString(2).length-53);return sign*Number(n>>BigInt(s))/Number(a.d>>BigInt(t))*2**(s-t);}
const packed=a=>({numerator:a.n.toString(),denominator:a.d.toString(),value:qvalue(a)}),qsum=x=>x.reduce(qa,rat(0n)),qdot=(x,y)=>qsum(x.map((v,i)=>qm(v,y[i]))),qmv=(A,x)=>A.map(r=>qdot(r,x)),qpvec=x=>x.map(packed),qpmat=A=>A.map(qpvec),qmatrix=A=>A.map(r=>r.map(exact));
function solveExact(A,b){
 let R=qmatrix(A).map((r,i)=>r.concat(exact(b[i]))),pivots=[],trace=[{stage:"input",matrix:qpmat(R)}],row=0;
 for(let col=0;col<A.length&&row<A.length;col++){
  let p=row;while(p<A.length&&!R[p][col].n)p++;if(p===A.length)continue;
  [R[row],R[p]]=[R[p],R[row]];const pivot=R[row][col];R[row]=R[row].map(v=>qd(v,pivot));
  for(let i=0;i<A.length;i++)if(i!==row){const factor=R[i][col];R[i]=R[i].map((v,j)=>qs(v,qm(factor,R[row][j])));}
  pivots.push(col);trace.push({stage:"pivot",row,col,swapped:p,pivot:packed(pivot),matrix:qpmat(R)});row++;
 }
 const consistent=R.every(r=>r.slice(0,A.length).some(v=>v.n)||!r[A.length].n),unique=consistent&&row===A.length;
 const solution=unique?R.map(r=>r[A.length]):null;
 return{rank:row,consistent,unique,pivots,trace,solution:solution?qpvec(solution):null,_solution:solution};
}
function graph(A){
 const n=A.length,edges=[];for(let j=0;j<n;j++)for(let i=0;i<n;i++)if(A[i][j]>0)edges.push({from:j,to:i,weight:A[i][j]});
 let reach=eye(n).map(r=>r.map(Boolean));edges.forEach(e=>reach[e.from][e.to]=true);
 for(let k=0;k<n;k++)for(let i=0;i<n;i++)for(let j=0;j<n;j++)reach[i][j]=reach[i][j]||(reach[i][k]&&reach[k][j]);
 const assigned=new Set(),classes=[];
 for(let i=0;i<n;i++)if(!assigned.has(i)){
  const vertices=Array.from({length:n},(_,j)=>j).filter(j=>reach[i][j]&&reach[j][i]);vertices.forEach(j=>assigned.add(j));
  const distances=Array(n).fill(null),queue=[i];distances[i]=0;
  for(let k=0;k<queue.length;k++)edges.filter(e=>e.from===queue[k]&&vertices.includes(e.to)).forEach(e=>{if(distances[e.to]===null){distances[e.to]=distances[e.from]+1;queue.push(e.to);}});
  let g=0n;const periods=edges.filter(e=>vertices.includes(e.from)&&vertices.includes(e.to)).map(e=>{const difference=distances[e.from]+1-distances[e.to];g=gcd(g,BigInt(difference));return{...e,difference};});
  classes.push({vertices,distances,periodEdges:periods,period:g?Number(g):null,closed:!edges.some(e=>vertices.includes(e.from)&&!vertices.includes(e.to)),matrix:vertices.map(i=>vertices.map(j=>A[i][j]))});
 }
 return{edges,reach,classes,irreducible:classes.length===1,period:classes.length===1?classes[0].period:null,primitive:classes.length===1&&classes[0].period===1,positive:A.every(r=>r.every(v=>v>0))};
}
function collatz(A,x){
 if(!x.every(v=>v>0))return null;
 const exactAX=qmv(qmatrix(A),x.map(exact)),ratios=exactAX.map((v,i)=>qd(v,exact(x[i])));
 let lo=ratios[0],hi=lo;ratios.forEach(v=>{if(qcmp(v,lo)<0)lo=v;if(qcmp(v,hi)>0)hi=v;});
 return{ax:mv(A,x),ratios:qpvec(ratios),lower:packed(lo),upper:packed(hi),width:packed(qs(hi,lo))};
}
function iterate(A,x0,steps,target=null){
 let x=unit(x0),rows=[],stopped=false;if(!x)throw Error("nonzero initial vector required");
 for(let k=0;k<=steps;k++){
  const ax=mv(A,x),growth=l1(ax),next=growth?ax.map(v=>v/growth):null;
  rows.push({k,x:x.slice(),ax,growth,next,delta:next?l1(next.map((v,i)=>v-x[i])):null,targetError:target?l1(x.map((v,i)=>v-target[i])):null,collatz:collatz(A,x)});
  if(!next){stopped=true;break;}x=next;
 }
 return{rows,stopped,initial:x0.slice(),normalization:"l1",target};
}
const c=(re,im=0)=>({re,im}),ca=(a,b)=>c(a.re+b.re,a.im+b.im),cm=(a,b)=>c(a.re*b.re-a.im*b.im,a.re*b.im+a.im*b.re),cs=(a,b)=>c(a.re-b.re,a.im-b.im),cr=(a,t)=>c(a.re*t,a.im*t),cvnorm=x=>Math.hypot(...x.flatMap(v=>[v.re,v.im]));
function complexEvidence(A,lambda,vector){
 const n=cvnorm(vector),v=vector.map(z=>cr(z,1/n)),av=A.map(r=>r.reduce((s,a,j)=>ca(s,cr(v[j],a)),c(0))),residual=av.map((z,i)=>cs(z,cm(lambda,v[i])));
 return{lambda,vector:v,av,residual,residualNorm:cvnorm(residual),modulus:Math.hypot(lambda.re,lambda.im)};
}
function two(p){
 const scale=10**p.scaleExponent,A=mul([[p.a,p.b],[p.c,p.d]],scale),[[a,b],[cc,d]]=A,g=graph(A);
 const determinant=qs(qm(exact(a),exact(d)),qm(exact(b),exact(cc))),disc=Math.hypot(a-d,2*Math.sqrt(b)*Math.sqrt(cc));
 const rho=b>0&&cc>0?(a/2+d/2+disc/2):Math.max(a,d),other=rho?(a===0&&d===0?-rho:qvalue(determinant)/rho):0;
 let right,left,algebraicMultiplicity=(b*cc===0&&a===d)?2:1,dimension,caseName;
 if(b>0&&cc>0){
  const gap=a>=d?2*b*cc/(disc+a-d):(disc+d-a)/2;
  right=[unit([b,gap])];left=[unit([cc,gap])];dimension=1;caseName="irreducible";
 }else if(a>d){right=[unit([a-d,cc])];left=[unit([a-d,b])];dimension=1;caseName="first-dominant";}
 else if(d>a){right=[unit([b,d-a])];left=[unit([cc,d-a])];dimension=1;caseName="second-dominant";}
 else if(b>0){right=[[1,0]];left=[[0,1]];dimension=1;caseName="jordan-upper";}
 else if(cc>0){right=[[0,1]];left=[[1,0]];dimension=1;caseName="jordan-lower";}
 else{right=[[1,0],[0,1]];left=[[1,0],[0,1]];dimension=2;caseName="scalar";}
 const rightResiduals=right.map(v=>mv(A,v).map((x,i)=>x-rho*v[i])),leftResiduals=left.map(v=>mv(tr(A),v).map((x,i)=>x-rho*v[i]));
 const x0=[p.x1,p.x2],nonnegative=x0.every(x=>x>=0),simple=algebraicMultiplicity===1;
 let exactProjection=null,projectionReason="非简单主根不使用单一左右向量投影公式";
 if(simple){
  if(a>d&&b*cc===0){exactProjection=qdot([qs(exact(a),exact(d)),exact(b)],x0.map(exact));projectionReason="未归一化精确左向量(a−d,b)";}
  else if(d>a&&b*cc===0){exactProjection=qdot([exact(cc),qs(exact(d),exact(a))],x0.map(exact));projectionReason="未归一化精确左向量(c,d−a)";}
  else if(a===d&&b===cc){exactProjection=qs(exact(x0[0]),{n:-exact(x0[1]).n,d:exact(x0[1]).d});projectionReason="对称等对角模型：精确左方向(1,1)";}
  else projectionReason=nonnegative?"不可约且非零非负起点：正左向量保证正投影":"一般带符号起点：浮点内积仅作诊断";
 }
 const projection=exactProjection?packed(exactProjection):null,approximateProjection=simple?dot(left[0],x0):null;
 const shiftedMatrix=A.map((r,i)=>r.map((v,j)=>v+(i===j?scale:0))),target=dimension===1&&nonnegative?right[0]:null,power=iterate(A,x0,p.steps,target),shifted=iterate(shiftedMatrix,x0,p.steps,target);
 const spectrum=[{re:rho,im:0,modulus:rho},{re:other,im:0,modulus:Math.abs(other)}];
 const criticalClasses=g.classes.length===1?[0]:g.classes.map((cl,i)=>cl.matrix[0][0]===rho?i:null).filter(i=>i!==null);
 return{mode:"two",scale,A,graph:g,determinant:packed(determinant),discriminant:disc,rho,other,spectrum,right,left,rightResiduals,leftResiduals,dimension,algebraicMultiplicity,caseName,simple,rightSupport:right.map(v=>v.map((x,i)=>x>0?i:null).filter(i=>i!==null)),criticalClasses,projection,projectionReason,approximateProjection,
  theoremNonnegative:g.primitive&&nonnegative,subdominantRatio:rho?Math.abs(other)/rho:null,power,shiftedMatrix,shifted};
}
function cycle(p){
 const scale=10**p.scaleExponent,N=mul([[0,0,p.w3],[p.w1,0,0],[0,p.w2,0]],scale),diagonal=scale*p.shift,A=N.map((r,i)=>r.map((v,j)=>v+(i===j?diagonal:0)));
 const u=N[1][0],v=N[2][1],w=N[0][2],product=u*v*w,beta=Math.cbrt(product),rho=diagonal+beta;
 const roots=[c(beta),c(-beta/2,Math.sqrt(3)*beta/2),c(-beta/2,-Math.sqrt(3)*beta/2)];
 const eigen=roots.map(z=>complexEvidence(A,c(z.re+diagonal,z.im),[cm(z,z),c(u*z.re,u*z.im),c(u*v)]));
 const right=unit([beta*beta,u*beta,u*v]),left=unit([u*v,v*beta,beta*beta]),cube=mm(mm(N,N),N),predictedCube=mul(eye(3),product);
 const x0=[p.x1,p.x2,p.x3],shiftedMatrix=A.map((r,i)=>r.map((x,j)=>x+(i===j?scale:0)));
 return{mode:"cycle",scale,A,N,diagonal,product,exactProduct:packed(qm(qm(exact(u),exact(v)),exact(w))),beta,rho,graph:graph(A),eigen,right,left,rightResidual:mv(A,right).map((x,i)=>x-rho*right[i]),leftResidual:mv(tr(A),left).map((x,i)=>x-rho*left[i]),cube,predictedCube,cubeGap:sub(cube,predictedCube),cubeGapNorm:fro(sub(cube,predictedCube)),shiftedMatrix,
  power:iterate(A,x0,p.steps,right),shifted:iterate(shiftedMatrix,x0,p.steps,right),subdominantRatio:eigen[1].modulus/rho};
}
function markov(p){
 const v=[p.teleport1,p.teleport2,1-p.teleport1-p.teleport2],initial=[p.mass1,p.mass2,1-p.mass1-p.mass2];
 const bases={cycle:[[0,0,1],[1,0,0],[0,1,0]],closed:[[1,0,0],[0,1,1],[0,0,0]],dangling:[[0,0,0],[1,0,0],[0,1,0]]},raw=bases[p.network].map(r=>r.slice());
 const dangling=raw[0].map((_,j)=>raw.every(r=>r[j]===0)),completed=raw.map((r,i)=>r.map((x,j)=>dangling[j]?v[i]:x));
 const P=completed.map((r,i)=>r.map((x,j)=>(1-p.lazy)*x+(i===j?p.lazy:0))),alpha=p.alpha;
 const G=P.map((r,i)=>r.map((x,j)=>alpha*x+(1-alpha)*v[i])),B=P.map((r,i)=>r.map((x,j)=>(i===j?1:0)-alpha*x)),b=v.map(x=>(1-alpha)*x);
 const solve=solveExact(B,b),pi=solve._solution;delete solve._solution;
 const exactP=qmatrix(P),exactG=qmatrix(G),exactB=qmatrix(B),qb=b.map(exact),colSums=G[0].map((_,j)=>qsum(exactG.map(r=>r[j])));
 const rows=[],rawRows=[];let x=initial.slice(),rawX=initial.slice(),average=Array(3).fill(0);
 for(let k=0;k<=p.steps;k++){
  const px=mv(P,x),linearNext=px.map((z,i)=>alpha*z+(1-alpha)*v[i]),matrixNext=mv(G,x),fixedResidual=linearNext.map((z,i)=>z-x[i]);
  const qx=x.map(exact),qres=qmv(exactB,qx).map((z,i)=>qs(qb[i],z)),residualNorm=qsum(qres.map(qabs)),bound=alpha<1?qd(residualNorm,qs(rat(1n),exact(alpha))):null;
  const exactError=pi?qsum(qx.map((z,i)=>qabs(qs(z,pi[i])))):null;
  const mass=qsum(qx),matrixGap=matrixNext.map((z,i)=>z-linearNext[i]),qnext=linearNext.map(exact);
  const arithmeticDefect=qnext.map((z,i)=>qs(z,qa(qm(exact(alpha),qmv(exactP,qx)[i]),qm(qs(rat(1n),exact(alpha)),exact(v[i])))));
  rows.push({k,x:x.slice(),px,linearNext,matrixNext,matrixGap,fixedResidual,exactResidual:qpvec(qres),residualNorm:packed(residualNorm),bound:bound?packed(bound):null,error:exactError?packed(exactError):null,mass:packed(mass),massDefect:packed(qs(mass,rat(1n))),arithmeticDefect:qpvec(arithmeticDefect)});
  average=average.map((z,i)=>(k*z+rawX[i])/(k+1));const rawNext=mv(P,rawX);
  rawRows.push({k,x:rawX.slice(),next:rawNext,average:average.slice(),delta:l1(rawNext.map((z,i)=>z-rawX[i])),averageResidual:mv(P,average).map((z,i)=>z-average[i]),mass:packed(qsum(rawX.map(exact)))});
  x=linearNext;rawX=rawNext;
 }
 return{mode:"markov",network:p.network,raw,dangling,completed,P,G,B,b,v,initial,alpha,lazy:p.lazy,colSums:qpvec(colSums),stochasticExact:colSums.every(z=>z.n===z.d),graph:graph(P),googleGraph:graph(G),solve,rows,rawRows,contraction:alpha<1?alpha:null};
}
const DEFAULTS={mode:"two",a:2,b:1,c:1,d:2,scaleExponent:0,x1:1,x2:.25,x3:.5,steps:24,w1:1,w2:1,w3:1,shift:0,network:"cycle",alpha:.875,lazy:0,teleport1:.5,teleport2:.25,mass1:1,mass2:0};
const PRESETS=[
 {id:"positive",label:"正矩阵：主方向",values:{}},
 {id:"primitive",label:"含零但本原",values:{a:0,b:1,c:2,d:1}},
 {id:"periodic",label:"两步轮换",values:{a:0,b:1,c:1,d:0}},
 {id:"special-start",label:"周期网络也能静止",values:{a:0,b:1,c:1,d:0,x2:1}},
 {id:"near-periodic",label:"微小自环，漫长混合",values:{a:1e-6,b:1,c:1,d:1e-6}},
 {id:"near-reducible",label:"微小连边仍存在",values:{a:1,b:1e-12,c:1e-12,d:1}},
 {id:"small-units",label:"整体单位10⁻⁶",values:{scaleExponent:-6}},
 {id:"large-units",label:"整体单位10⁶",values:{scaleExponent:6}},
 {id:"zero-projection",label:"带符号零主投影",values:{x1:1,x2:-1}},
 {id:"zero-component",label:"非负起点有零分量",values:{x1:0,x2:1}},
 {id:"reducible",label:"可约而主空间一维",values:{a:2,b:1,c:0,d:1}},
 {id:"reducible-positive",label:"可约却有唯一全正主方向",values:{a:2,b:0,c:1,d:1}},
 {id:"missed-class",label:"起点漏掉主类",values:{a:2,b:0,c:0,d:1,x1:0,x2:1}},
 {id:"multiple",label:"两个独立主方向",values:{a:1,b:0,c:0,d:1}},
 {id:"jordan",label:"同根耦合与Jordan",values:{a:1,b:1,c:0,d:1}},
 {id:"nilpotent",label:"两步归零",values:{a:0,b:1,c:0,d:0}},
 {id:"zero",label:"零矩阵边界",values:{a:0,b:0,c:0,d:0}},
 {id:"cycle",label:"三周期与复特征值",values:{mode:"cycle"}},
 {id:"weighted-cycle",label:"加权三环",values:{mode:"cycle",w1:2,w2:.5,w3:1}},
 {id:"shifted-cycle",label:"加自环移走周期",values:{mode:"cycle",shift:.5}},
 {id:"tiny-cycle",label:"三环改变整体单位",values:{mode:"cycle",scaleExponent:-6}},
 {id:"pagerank",label:"个性化PageRank",values:{mode:"markov"}},
 {id:"undamped",label:"α=1：原始周期",values:{mode:"markov",alpha:1}},
 {id:"lazy",label:"惰性化三环",values:{mode:"markov",alpha:1,lazy:.5}},
 {id:"closed",label:"两个闭类",values:{mode:"markov",network:"closed",alpha:1}},
 {id:"closed-teleport",label:"跳转连接闭类",values:{mode:"markov",network:"closed"}},
 {id:"dangling",label:"悬挂节点补列",values:{mode:"markov",network:"dangling"}},
 {id:"personalized-zero",label:"跳转分布含零",values:{mode:"markov",network:"closed",teleport1:1,teleport2:0}},
 {id:"alpha-zero",label:"α=0：一步跳转",values:{mode:"markov",alpha:0}},
 {id:"slow-teleport",label:"α=1023/1024",values:{mode:"markov",alpha:1023/1024,steps:48}}
];
const QUESTIONS=[
 {text:"不可约网络的原始迭代一定混合吗？",options:["还要检查周期和起点","强连通就足够"],correct:0},
 {text:"可约是否意味着主特征空间一定多维？",options:["需要实际计算","一定多维"],correct:0},
 {text:"曲线在有限步看似平稳，能否证明本原？",options:["不能，特殊起点也可能静止","能够"],correct:0},
 {text:"PageRank残差上界 r/(1−α) 在α=1时呢？",options:["这个界不再适用","把分母直接改成1"],correct:0}
];
function num(value){
 if(typeof value==="string"){if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value.trim()))throw Error("请输入有限十进制数");const s=value;value=Number(value);if(value===0&&/[1-9]/.test(s.split(/[eE]/)[0]))throw Error("输入发生下溢");}
 if(typeof value!=="number"||!Number.isFinite(value))throw Error("请输入有限数");return value;
}
function config(input={}){
 if(!input||typeof input!=="object"||Array.isArray(input))throw Error("参数对象无效");
 const p={...DEFAULTS},mode=input.mode===undefined?p.mode:input.mode;if(!["two","cycle","markov"].includes(mode))throw Error("未知实验");p.mode=mode;
 const active=mode==="two"?["a","b","c","d","scaleExponent","x1","x2","steps"]:mode==="cycle"?["w1","w2","w3","shift","scaleExponent","x1","x2","x3","steps"]:["alpha","lazy","teleport1","teleport2","mass1","mass2","steps"];
 active.forEach(k=>{if(input[k]!==undefined)p[k]=num(input[k]);});
 const range=(k,lo,hi,integer=false)=>{if(p[k]<lo||p[k]>hi||(integer&&!Number.isInteger(p[k])))throw Error(k+"超出范围");};
 range("steps",0,64,true);
 if(mode!=="markov"){
  range("scaleExponent",-6,6,true);
  for(const k of(mode==="two"?["a","b","c","d"]:["w1","w2","w3","shift"])){range(k,0,4);if(p[k]!==0&&p[k]<1e-12)throw Error("非零矩阵参数至少1e−12");}
  if(mode==="cycle"&&["w1","w2","w3"].some(k=>p[k]<1e-6))throw Error("三环权重至少1e−6；断环边界请用二维模型");
  for(const k of(mode==="two"?["x1","x2"]:["x1","x2","x3"])){range(k,mode==="two"?-4:0,4);if(p[k]!==0&&Math.abs(p[k])<1e-12)throw Error("非零起点分量至少1e−12");}
  if((mode==="two"?[p.x1,p.x2]:[p.x1,p.x2,p.x3]).every(x=>x===0))throw Error("起点不能全零");
 }else{
  p.network=input.network===undefined?p.network:input.network;if(!["cycle","closed","dangling"].includes(p.network))throw Error("未知转移网络");
  for(const k of["alpha","lazy","teleport1","teleport2","mass1","mass2"]){range(k,0,1);if(!Number.isInteger(p[k]*1024))throw Error("概率参数必须为1/1024的整数倍");}
  if(p.teleport1+p.teleport2>1||p.mass1+p.mass2>1)throw Error("前两个概率之和不能超过1");
 }
 return p;
}
function snapshot(input={}){const parameters=config(input);return{parameters,result:parameters.mode==="two"?two(parameters):parameters.mode==="cycle"?cycle(parameters):markov(parameters)};}
function fmt(x){if(x===null||x===undefined)return"—";if(typeof x==="boolean")return x?"是":"否";if(typeof x!=="number")return String(x);if(!Number.isFinite(x))throw Error("不能显示非有限数");if(Number.isInteger(x))return String(x);return Math.abs(x)<1e-4||Math.abs(x)>=1e6?x.toExponential(8):String(Number(x.toPrecision(10)));}
const B="#268bd2",O="#cb6a16",G="#29966c",R="#b44a72",V="#9966bb",COLORS=[B,O,G,R,V],series=(key,label,color,points,line=true)=>({key,label,color,points,line});
function plot(title,x,y,ss,xmin,xmax,square=false){
 const v=ss.flatMap(s=>s.points.map(p=>p[1])),ys=y.startsWith("log₁₀")?v:[0,...v],lo=ys.length?Math.min(...ys):0,hi=ys.length?Math.max(...ys):0,pad=(hi-lo||1)*.08;
 return{title,x,y,series:ss,xmin,xmax:xmax>xmin?xmax:xmin+1,ymin:lo-pad,ymax:hi+pad,square,markers:[]};
}
function networkPlot(title,g){
 const n=g.reach.length,nodes=n===2?[[260,230],[640,230]]:[[450,180],[240,330],[660,330]];
 return{type:"network",title,nodes,edges:g.edges,series:[]};
}
function plots(d){
 const p=d.parameters,r=d.result,last=Math.max(1,p.steps),positive=(rows,get)=>rows.flatMap(z=>{const y=get(z);return y!==null&&y>0?[[z.k,Math.log10(y)]]:[];});
 const history=(title,rows,n)=>plot(title,"迭代步k","归一化分量（保留负值与零）",Array.from({length:n},(_,i)=>series("x"+i,"分量"+i,COLORS[i],rows.map(z=>[z.k,z.x[i]]))),0,last);
 if(p.mode!=="markov"){
  const n=r.A.length,qs=[
   networkPlot("实际传递方向：Aᵢⱼ把节点j送到节点i",r.graph),
   history("原始幂法：每次真实乘法后的方向",r.power.rows,n),
   plot("到所列参考方向的距离：原始与加自环","迭代步k","log₁₀ L¹方向误差；无参考方向时留空",[
    series("raw","原始A",B,positive(r.power.rows,z=>z.targetError)),series("shifted","A+单位尺度·I",O,positive(r.shifted.rows,z=>z.targetError))],0,last),
   plot("正测试向量给出的Collatz–Wielandt夹逼","迭代步k","谱半径 / 单位尺度；带符号或零分量时留空",[
    series("lower","精确分数下界的近似显示",B,r.power.rows.flatMap(z=>z.collatz?[[z.k,z.collatz.lower.value/r.scale]]:[])),
    series("upper","精确分数上界的近似显示",O,r.power.rows.flatMap(z=>z.collatz?[[z.k,z.collatz.upper.value/r.scale]]:[])),
    series("rho","解析谱半径的浮点值",G,[[0,r.rho/r.scale],[last,r.rho/r.scale]])],0,last)
  ];
  if(p.mode==="cycle"){
   const points=r.eigen.map(z=>[z.lambda.re/r.rho,z.lambda.im/r.rho]),q=plot("完整三点复谱：实部不能代替特征值","Re λ / ρ","Im λ / ρ",[series("eigen","三个本征值",B,points,false)],-1.2,1.2,true);q.ymin=-1.2;q.ymax=1.2;qs.splice(1,0,q);
  }
  return qs;
 }
 return[
  networkPlot("补齐悬挂列并惰性化后的转移P",r.graph),
  networkPlot("加入个性化跳转后的转移G",r.googleGraph),
  plot("原始链：节点0的瞬时概率与时间平均","迭代步k","概率；平均包括第0步到第k步",[
   series("raw","Pᵏx₀的第0分量",B,r.rawRows.map(z=>[z.k,z.x[0]])),series("average","Cesàro平均第0分量",O,r.rawRows.map(z=>[z.k,z.average[0]]))],0,last),
  history("PageRank仿射迭代：每个节点的实际概率",r.rows,3),
  plot("误差与残差上界：用同一实际向量核对","迭代步k","log₁₀ L¹量；α=1时误差与上界留空",[
   series("error","到精确分布的实际误差",B,positive(r.rows,z=>z.error?.value??null)),
   series("bound","精确残差/(1−α)上界",O,positive(r.rows,z=>z.bound?.value??null)),
   series("residual","精确残差",G,positive(r.rows,z=>z.residualNorm.value))],0,last),
  plot("浮点实现的质量与运算缺陷","迭代步k","log₁₀ L¹缺陷；零值不画点",[
   series("mass","实际概率和偏离1",R,positive(r.rows,z=>Math.abs(z.massDefect.value))),
   series("arithmetic","一步浮点舍入缺陷",V,positive(r.rows,z=>l1(z.arithmeticDefect.map(v=>v.value))))],0,last)
 ];
}
const WORDS={A:"矩阵A",N:"环矩阵N",P:"列随机P",G:"跳转矩阵G",B:"线性方程矩阵",b:"线性方程右端",v:"跳转分布",initial:"初始概率",rho:"谱半径",other:"另一个根",right:"右向量基",left:"左向量基",rightResiduals:"右本征残差",leftResiduals:"左本征残差",rightResidual:"右本征残差",leftResidual:"左本征残差",dimension:"主空间维数",algebraicMultiplicity:"主根代数重数",discriminant:"二次方程根差",determinant:"行列式",k:"步",x:"当前向量",ax:"实际Ax",next:"下一方向",growth:"乘法后L¹范数",delta:"相邻方向差",targetError:"到参考方向的L¹差",target:"参考方向",collatz:"CW夹逼",ratios:"各分量比值",lower:"下界",upper:"上界",width:"夹逼宽度",edges:"边",from:"起点j",to:"终点i",weight:"权重Aij",reach:"可达性",classes:"强连通类",vertices:"节点",distances:"广搜距离",periodEdges:"周期计算各边",difference:"距离差加1",period:"周期",closed:"是否闭类",matrix:"矩阵",positive:"全元素严格正",primitive:"本原",irreducible:"不可约",eigen:"本征对",lambda:"特征值",re:"实部",im:"虚部",vector:"向量",av:"实际Av",residual:"残差",residualNorm:"残差L¹或本征二范数",modulus:"复模",cube:"实际N³",predictedCube:"权重积乘I",cubeGap:"三次恒等式缺陷",cubeGapNorm:"三次缺陷F范数",raw:"原始转移",dangling:"是否悬挂列",completed:"补齐悬挂列",colSums:"G精确列和",solve:"有理数消元",rank:"精确秩",consistent:"相容",unique:"唯一解",pivots:"枢轴列",trace:"完整消元",stage:"阶段",row:"行",col:"列",swapped:"交换来源行",pivot:"原枢轴",solution:"精确解",linearNext:"实际仿射下一步",matrixNext:"实际Gx",matrixGap:"Gx减仿射下一步",fixedResidual:"浮点固定点残差",exactResidual:"精确固定点残差",bound:"严格后验上界",error:"到精确解的误差",mass:"实际向量分量和",massDefect:"概率和减1",arithmeticDefect:"一步实际舍入",px:"实际Px",average:"时间平均",averageResidual:"时间平均的平稳残差"};
function leafRows(value,path="",out=[]){
 if(value===null||typeof value!=="object"){out.push([path,value,""]);return out;}
 if("numerator"in value&&"denominator"in value){out.push([path,value.value,value.numerator+"/"+value.denominator]);return out;}
 for(const [key,v]of Object.entries(value))leafRows(v,path?path+" / "+(WORDS[key]||key):(WORDS[key]||key),out);
 return out;
}
function ledgers(d){
 const p=d.parameters,r=d.result,t=(key,title,o)=>({key,title,headers:["对象 / 索引","数值或状态","精确分数（若有）"],rows:leafRows(o)});
 if(p.mode==="two")return[
  t("summary","先按结构判断，再看有限步",{"单位尺度":r.scale,"本原":r.graph.primitive,"不可约":r.graph.irreducible,"周期":r.graph.period,"谱半径":r.rho,"主空间维数":r.dimension,"代数重数":r.algebraicMultiplicity,"精确结构分支":r.caseName,"非负起点的本原定理适用":r.theoremNonnegative,"单位尺度化次根模比例":r.subdominantRatio,"左投影说明":r.projectionReason,"精确未归一化左投影":r.projection,"近似归一化左投影":r.approximateProjection}),
  t("matrices","完整矩阵、左右方向与实际残差",{A:r.A,shiftedMatrix:r.shiftedMatrix,determinant:r.determinant,discriminant:r.discriminant,right:r.right,left:r.left,rightResiduals:r.rightResiduals,leftResiduals:r.leftResiduals,spectrum:r.spectrum,rightSupport:r.rightSupport,criticalClasses:r.criticalClasses}),
  t("structure","支持图、所有可达关系与周期计算",r.graph),
  t("power","原始幂法：每一步、全部分量与精确CW分数",r.power),
  t("shifted","加单位尺度自环后的完整迭代",r.shifted)
 ];
 if(p.mode==="cycle")return[
  t("summary","周期三环与自环的作用",{"单位尺度":r.scale,"谱半径":r.rho,"周期":r.graph.period,"本原":r.graph.primitive,"次根模比例":r.subdominantRatio,"实际三次恒等式缺陷":r.cubeGapNorm,"精确权重乘积":r.exactProduct}),
  t("matrices","完整输入与三次恒等式",{A:r.A,N:r.N,shiftedMatrix:r.shiftedMatrix,cube:r.cube,predictedCube:r.predictedCube,cubeGap:r.cubeGap,right:r.right,left:r.left,rightResidual:r.rightResidual,leftResidual:r.leftResidual}),
  t("structure","实际边、可达性与周期",r.graph),
  t("spectrum","三组完整复特征值、向量与残差",r.eigen),
  t("power","原始幂法与CW夹逼",r.power),
  t("shifted","加单位尺度自环后的完整迭代",r.shifted)
 ];
 return[
  t("summary","概率守恒、唯一性与上界适用范围",{"跟随链接概率α":r.alpha,"精确列和为1":r.stochasticExact,"G严格正":r.googleGraph.positive,"G本原":r.googleGraph.primitive,"收缩常数":r.contraction,"线性方程唯一解":r.solve.unique,"边界说明":r.alpha===1?"α=1时本线性方程为齐次；唯一平稳分布需另加归一化并看闭类，不使用该残差上界":"α<1即有唯一仿射固定点；跳转分布含零时也成立"}),
  t("matrices","从原始规则到PageRank的全部矩阵",{raw:r.raw,dangling:r.dangling,completed:r.completed,P:r.P,G:r.G,B:r.B,b:r.b,v:r.v,initial:r.initial,colSums:r.colSums}),
  t("structure","P与G的实际类结构",{P:r.graph,G:r.googleGraph}),
  t("solve","精确有理数消元的每个枢轴与完整矩阵",r.solve),
  t("power","PageRank每一步：实际值、精确误差与上界",r.rows),
  t("averages","原始链每一步与完整Cesàro平均",r.rawRows)
 ];
}
function networkSVG(q){
 let s='<svg xmlns="http://www.w3.org/2000/svg" width="900" height="425" role="img" aria-label="'+esc(q.title)+'"><title>'+esc(q.title)+'</title><text x="25" y="32" font-size="22">'+esc(q.title)+'</text><text x="25" y="60">箭头起点j → 终点i；每条非零边保留实际权重，自环单独画出。</text>';
 const arrow=(x,y,dx,dy)=>{const n=Math.hypot(dx,dy),u=dx/n,v=dy/n;return'<polygon points="'+x+','+y+' '+(x-10*u+4*v)+','+(y-10*v-4*u)+' '+(x-10*u-4*v)+','+(y-10*v+4*u)+'" fill="'+B+'"/>';};
 q.edges.forEach((e,k)=>{
  const [x,y]=q.nodes[e.from],[u,v]=q.nodes[e.to];let path,label,tip,dir;
  if(e.from===e.to){path="M"+(x-13)+" "+(y-20)+" C"+(x-75)+" "+(y-105)+" "+(x+75)+" "+(y-105)+" "+(x+13)+" "+(y-20);label=[x,y-90];tip=[x+13,y-20];dir=[-62,85];}
  else{
   const dx=u-x,dy=v-y,n=Math.hypot(dx,dy),a=[x+23*dx/n,y+23*dy/n],b=[u-23*dx/n,v-23*dy/n],control=[(x+u)/2-36*dy/n,(y+v)/2+36*dx/n];
   path="M"+a[0]+" "+a[1]+" Q"+control[0]+" "+control[1]+" "+b[0]+" "+b[1];label=[(a[0]+2*control[0]+b[0])/4-12*dy/n,(a[1]+2*control[1]+b[1])/4+12*dx/n];tip=b;dir=[b[0]-control[0],b[1]-control[1]];
  }
  s+='<path data-edge="'+k+'" data-from="'+e.from+'" data-to="'+e.to+'" d="'+path+'" stroke="'+B+'" stroke-width="2" fill="none"/>'+arrow(...tip,...dir)+'<text data-edge-weight="'+k+'" x="'+label[0]+'" y="'+label[1]+'" text-anchor="middle" font-size="16">'+esc(fmt(e.weight))+'</text>';
 });
 q.nodes.forEach(([x,y],i)=>{s+='<circle data-node="'+i+'" cx="'+x+'" cy="'+y+'" r="22" fill="var(--bg,#faf7ef)" stroke="currentColor"/><text x="'+x+'" y="'+(y+6)+'" text-anchor="middle">'+i+'</text>';});
 return s+'</svg>';
}
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const tick=v=>v===0?"0":Math.abs(v)<1e-3||Math.abs(v)>=1e4?v.toExponential(2):String(Number(v.toPrecision(4)));
 function svg(q){
  if(q.type==="network")return networkSVG(q);
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

 const STYLE=".perron148{color:var(--fg,#273646)}.perron148 .perron-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}.perron148 label{display:flex;flex-direction:column;gap:6px}.perron148 input,.perron148 select{font:inherit;padding:8px;max-width:100%;background:var(--bg,#fff);color:inherit;border:1px solid #8b98a0;border-radius:5px}.perron148 button{font:inherit;padding:8px 12px;margin:5px;cursor:pointer}.perron148 button[aria-pressed=true]{outline:3px solid #478aaa}.perron148 .perron-scroll{overflow:auto;max-width:100%;margin:16px 0}.perron148 .perron-scroll:focus{outline:3px solid #478aaa}.perron148 .perron-ledger{max-height:420px}.perron148 svg{width:900px!important;max-width:none!important;display:block;fill:currentColor;font:16px system-ui}.perron148 table{display:table;overflow:visible;width:max-content;max-width:none;min-width:900px;border-collapse:collapse;font-variant-numeric:tabular-nums}.perron148 th,.perron148 td{padding:9px;border:1px solid #98a4ab;text-align:left;white-space:nowrap}.perron148 .perron-error{color:#c74b39}.perron148 [hidden]{display:none!important}.perron148 fieldset{margin:16px 0;padding:12px}.perron148 details{margin:16px 0}.perron148 summary{cursor:pointer;font-weight:600}.perron148 .perron-legend{font-size:.95em}.perron148 .perron-note{line-height:1.7}.perron148 [hidden]{display:none!important}.perron148 select{font:inherit;color:var(--fg,#282820);background:var(--bg,#faf7ef);padding:8px;max-width:100%}";
 function mount(container){
  const doc=container.ownerDocument;
  if(!doc.getElementById("perron148-style")){const style=doc.createElement("style");style.id="perron148-style";style.textContent=STYLE;doc.head.appendChild(style);}
  const field=(key,label,modes)=>'<label data-modes="'+modes+'">'+label+'<input data-key="'+key+'" type="number" step="any"></label>';
  container.innerHTML='<div class="perron148"><h3>网络能互通，就一定会混合吗？</h3><p>先预测，再改变矩阵、起点或跳转规则；每次乘法与结论条件都能展开核对。</p><div class="perron-presets">'+PRESETS.map(p=>'<button type="button" data-preset="'+p.id+'">'+esc(p.label)+'</button>').join("")+'</div><div class="perron-controls"><label>实验<select data-key="mode"><option value="two">二维非负矩阵与起点</option><option value="cycle">三环、复谱与自环</option><option value="markov">随机链与个性化PageRank</option></select></label>'+
   field("a","矩阵a₀₀（0–4）","two")+field("b","矩阵a₀₁（0–4）","two")+field("c","矩阵a₁₀（0–4）","two")+field("d","矩阵a₁₁（0–4）","two")+
   field("w1","环权重0→1（1e−6–4）","cycle")+field("w2","环权重1→2（1e−6–4）","cycle")+field("w3","环权重2→0（1e−6–4）","cycle")+field("shift","共同自环δ（0–4）","cycle")+
   field("scaleExponent","整体单位10的指数（−6–6整数）","two cycle")+
   field("x1","起点第0分量（二维−4–4，三环0–4）","two cycle")+field("x2","起点第1分量（二维−4–4，三环0–4）","two cycle")+field("x3","起点第2分量（0–4）","cycle")+
   '<label data-modes="markov">原始转移规则<select data-key="network"><option value="cycle">三周期环</option><option value="closed">两个闭类</option><option value="dangling">末节点无出边</option></select></label>'+
   field("alpha","跟随链接概率α（0–1）","markov")+field("lazy","停在原地的概率（0–1）","markov")+
   field("teleport1","跳转到节点0的概率（0–1）","markov")+field("teleport2","跳转到节点1的概率（0–1）","markov")+
   field("mass1","初始节点0概率（0–1）","markov")+field("mass2","初始节点1概率（0–1）","markov")+
   field("steps","观察步数（0–64整数）","two cycle markov")+'</div><p>概率参数取1/1024的整数倍，第三个概率由总和1确定。其他非零参数至少1e−12；三环权重至少1e−6。二维允许带符号起点；全零起点不定义归一化。</p>'+
   QUESTIONS.map((q,i)=>'<fieldset data-question="'+i+'"><legend>'+(i+1)+'. '+esc(q.text)+'</legend>'+q.options.map((v,j)=>'<button type="button" data-choice="'+j+'" aria-pressed="false">'+esc(v)+'</button>').join("")+'</fieldset>').join("")+
   '<button type="button" data-action="reveal">揭示图与完整账本</button><button type="button" data-action="reset">重置预测</button><p class="perron-error" role="alert"></p><p role="status"></p><div class="perron-results" hidden></div></div>';
  const fields=Array.from(container.querySelectorAll("[data-key]")),answers=Array(4).fill(null),result=container.querySelector(".perron-results"),reveal=container.querySelector("[data-action=reveal]"),feedback=container.querySelector("[role=status]"),error=container.querySelector("[role=alert]");
  fields.forEach(e=>e.value=DEFAULTS[e.dataset.key]);
  let revealed=false,valid=null;
  function render(d){
   const notes={two:"二维模型的主空间维数与重数由精确结构分支决定；本征值和向量按稳定解析式计算，实际残差完整保留。带符号起点的近似左投影不能作为一般精确零判据。参考方向的距离不自动意味着会趋零；可约Jordan情形也不使用简单主根投影公式。",cycle:"三环模型明确使用三次特征方程，显示全部复特征值与复向量残差。整体缩放时，附加自环也按同一单位缩放。CW的有理分数针对实际输入与当前浮点向量提供严格夹逼；图上显示的是分数近似值。",markov:"每条边都按列向量方向j→i。先补齐悬挂列，再惰性化，最后加入个性化跳转。α<1时用有理数解线性方程；误差、残差和上界针对同一个实际存储向量计算，精确分数才是证书。α=1时不冒用收缩界，也不由齐次方程未给唯一解来断言平稳分布不唯一。"};
   result.innerHTML='<p>'+notes[d.parameters.mode]+'</p>'+
    plots(d).map(q=>'<p>'+q.series.filter((s,i,ss)=>ss.findIndex(t=>t.label===s.label&&t.color===s.color)===i).map(s=>esc(s.label)+'（'+({"#268bd2":"蓝","#cb6a16":"橙","#29966c":"绿","#9966bb":"紫","#b44a72":"玫红"}[s.color])+'）').join("；")+'</p><div class="perron-scroll" role="region" tabindex="0" aria-label="'+esc(q.title)+'">'+svg(q)+'</div>').join("")+
    ledgers(d).map(t=>'<details data-ledger="'+t.key+'"'+(t.key==="summary"?' open':"")+'><summary>'+esc(t.title)+'（'+t.rows.length+' 行）</summary><div class="perron-scroll perron-ledger" role="region" tabindex="0" aria-label="'+esc(t.title)+'"><table data-table="'+t.key+'"><thead><tr>'+t.headers.map(x=>'<th scope="col">'+esc(x)+'</th>').join("")+'</tr></thead><tbody>'+t.rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(fmt(x))+'</td>').join("")+'</tr>').join("")+'</tbody></table></div></details>').join("")+
    '<p>“—”表示不适用、未定义或有限精度不足，不是0。对数图仅画严格正的实际值；线性图保留零。所有显示图与表都来自同一组计算记录。精确算术定理、浮点诊断与严格数值证书要分别理解。</p>';
  }
  function update(){
   const raw=Object.fromEntries(fields.map(e=>[e.dataset.key,e.value]));
   container.querySelectorAll("[data-modes]").forEach(e=>e.hidden=!e.dataset.modes.split(" ").includes(raw.mode));
   try{valid=config(raw);error.textContent="";}catch(e){valid=null;revealed=false;error.textContent=e.message;}
   reveal.disabled=!valid||answers.some(x=>x===null);result.hidden=!revealed;
   if(revealed&&valid)render(snapshot(valid));
   feedback.textContent=revealed?answers.filter((x,i)=>x===QUESTIONS[i].correct).length+" / 4。"+"结构定理、有限迭代和误差证书分别核对。":"";
  }
  fields.forEach(e=>e.addEventListener(e.tagName==="SELECT"?"change":"input",update));
  container.querySelectorAll("[data-choice]").forEach(b=>b.addEventListener("click",()=>{
   const i=Number(b.closest("[data-question]").dataset.question);answers[i]=Number(b.dataset.choice);b.parentElement.querySelectorAll("[data-choice]").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));update();
  }));
  container.querySelectorAll("[data-preset]").forEach(b=>b.addEventListener("click",()=>{
   const s=Object.assign({},DEFAULTS,PRESETS.find(p=>p.id===b.dataset.preset).values);fields.forEach(e=>e.value=s[e.dataset.key]);update();
  }));
  reveal.addEventListener("click",()=>{if(!reveal.disabled){revealed=true;update();}});
  container.querySelector("[data-action=reset]").addEventListener("click",()=>{answers.fill(null);revealed=false;container.querySelectorAll("[data-choice]").forEach(b=>b.setAttribute("aria-pressed","false"));update();container.querySelector("[data-choice]").focus();});
  update();
 }
















function selfTest(){
 let checks=0;const ck=(v,m)=>{checks++;if(!v)throw Error(m);};
 let r=snapshot().result;ck(r.graph.primitive&&r.rho===3,"positive");
 r=snapshot({a:0,b:1,c:1,d:0}).result;ck(r.graph.period===2&&r.other===-1,"periodic");
 r=snapshot({a:1,b:1,c:0,d:1}).result;ck(r.dimension===1&&r.algebraicMultiplicity===2,"Jordan");
 r=snapshot({a:1,b:0,c:0,d:1}).result;ck(r.dimension===2,"multiple");
 r=snapshot({a:0,b:1,c:0,d:0}).result;ck(r.power.stopped&&r.rho===0,"nilpotent");
 r=snapshot({x1:1,x2:-1}).result;ck(r.projection.numerator==="0","zero projection");
 r=snapshot({mode:"cycle"}).result;ck(r.graph.period===3&&r.eigen[1].lambda.im>0,"complex cycle");
 r=snapshot({mode:"markov"}).result;ck(r.solve.unique&&r.stochasticExact,"PageRank");
 r=snapshot({mode:"markov",alpha:1}).result;ck(r.contraction===null&&r.rows.every(z=>z.bound===null),"undamped");
 r=snapshot({mode:"markov",network:"dangling"}).result;ck(r.dangling[2]&&r.stochasticExact,"dangling");
 ck(fmt(1e-15)!=="0"&&fmt(0)==="0","small values visible");
 ck(graph([[0]]).period===null&&!graph([[0]]).primitive,"zero singleton exception");
 return{status:"PASS",checks};
}
return{DEFAULTS,PRESETS,QUESTIONS,num,config,snapshot,two,cycle,markov,graph,iterate,collatz,exact,packed,solveExact,fmt,plots,ledgers,svg,mount,selfTest};
});
