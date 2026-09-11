(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;if(root&&root.CourseLearning)root.CourseLearning.register("matrix-order-functions",api.mount);})(typeof window!=="undefined"?window:globalThis,function(){
"use strict";
const dot=(x,y)=>x.reduce((s,v,i)=>s+v*y[i],0),norm=x=>Math.hypot(...x),tr=A=>A[0].map((_,j)=>A.map(r=>r[j])),mv=(A,x)=>A.map(r=>dot(r,x)),mm=(A,B)=>A.map(r=>tr(B).map(c=>dot(r,c))),eye=n=>Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>+(i===j))),add=(A,B)=>A.map((r,i)=>r.map((x,j)=>x+B[i][j])),sub=(A,B)=>A.map((r,i)=>r.map((x,j)=>x-B[i][j])),mul=(A,c)=>A.map(r=>r.map(x=>x*c)),fro=A=>norm(A.flat()),outer=(x,y)=>x.map(v=>y.map(w=>v*w));
// Exact dyadic arithmetic is used for signs of the stored finite matrices.
function dyad(x){
 if(!Number.isFinite(x))throw Error("finite dyadic input required");
 if(x===0)return{n:0n,e:0};const b=new DataView(new ArrayBuffer(8));b.setFloat64(0,x);
 const hi=b.getUint32(0),lo=b.getUint32(4),ex=(hi>>>20)&2047,m=(BigInt(hi&0xfffff)<<32n)|BigInt(lo);
 return{n:((hi>>>31)?-1n:1n)*(ex?m+(1n<<52n):m),e:ex?ex-1023-52:-1074};
}
const dmul=(a,b)=>({n:a.n*b.n,e:a.e+b.e}),dneg=a=>({n:-a.n,e:a.e});
function dadd(a,b){const e=Math.min(a.e,b.e);return{n:(a.n<<BigInt(a.e-e))+(b.n<<BigInt(b.e-e)),e};}
const dsign=a=>a.n>0n?1:a.n<0n?-1:0;
function dfloat(a){if(!a.n)return 0;const neg=a.n<0n,n=neg?-a.n:a.n,bits=n.toString(2).length,cut=Math.max(0,bits-53);return(neg?-1:1)*Number(n>>BigInt(cut))*2**(a.e+cut);}
function determinant(A){
 if(A.length===1)return dyad(A[0][0]);
 let d={n:0n,e:0};
 for(let j=0;j<A.length;j++){let v=dmul(dyad(A[0][j]),determinant(A.slice(1).map(r=>r.filter((_,k)=>k!==j))));if(j%2)v=dneg(v);d=dadd(d,v);}return d;
}
function positivity(A){
 const n=A.length,symmetric=A.every((r,i)=>r.every((v,j)=>v===A[j][i])),minors=[];
 for(let mask=1;mask<(1<<n);mask++){
  const indices=Array.from({length:n},(_,i)=>i).filter(i=>mask&(1<<i)),d=determinant(indices.map(i=>indices.map(j=>A[i][j])));
  minors.push({indices,numerator:d.n.toString(),exponent:d.e,sign:dsign(d),value:dfloat(d)});
 }
 const psd=symmetric&&minors.every(q=>q.sign>=0),pd=symmetric&&minors.filter(q=>q.indices.every((i,j)=>i===j)).every(q=>q.sign>0);
 return{symmetric,psd,pd,minors,status:!symmetric?"not-symmetric":pd?"positive-definite":psd?"positive-semidefinite":"not-positive-semidefinite"};
}
function eig2(A){
 const m=A[0][0]/2+A[1][1]/2,h=A[0][0]/2-A[1][1]/2,b=A[0][1],r=Math.hypot(h,b),det=determinant(A);
 let hi=m+r,lo=m-r;
 // Use the large-magnitude eigenvalue to recover its partner without cancellation.
 if(m>=0&&hi!==0)lo=dfloat(det)/hi;else if(m<0&&lo!==0)hi=dfloat(det)/lo;
 const raw=r===0?[1,0]:h>=0?[r+h,b]:[b,r-h],n=norm(raw),v=raw.map(x=>x/n),w=[-v[1],v[0]],values=[hi,lo],vectors=[v,w];
 return{values,vectors,residuals:vectors.map((v,i)=>mv(A,v).map((x,j)=>x-values[i]*v[j])),orthogonality:fro(sub(mm(vectors,tr(vectors)),eye(2))),determinant:dfloat(det),simple:r!==0};
}
function inverse2(A){const det=determinant(A);if(dsign(det)===0)return null;return mul([[A[1][1],-A[0][1]],[-A[1][0],A[0][0]]],1/dfloat(det));}
function symmetrize(A){return A.map((r,i)=>r.map((v,j)=>i===j?v:(v+A[j][i])/2));}
function evidence(A){const e=eig2(A),v=e.vectors[1];return{matrix:A,exact:positivity(A),eig:e,witness:v,quadratic:dot(v,mv(A,v))};}
function order(s){
 const scale=10**s.scaleExponent,B=mul([[1+s.delta,0],[0,s.delta]],scale),requested=mul([[s.t,s.t],[s.t,s.t]],scale),A=add(B,requested),D=sub(A,B),X=[[1,s.shear],[0,s.stretch]];
 const A2=mm(A,A),B2=mm(B,B),D2=sub(A2,B2),rawCongruent=mm(mm(tr(X),D),X),C=symmetrize(rawCongruent),iA=inverse2(A),iB=inverse2(B),inverseGap=iA&&iB?sub(iB,iA):null;
 const theta=s.theta*Math.PI/180,v=s.theta===0?[1,0]:Math.abs(s.theta)===90?[0,Math.sign(s.theta)]:Math.abs(s.theta)===180?[-1,0]:[Math.cos(theta),Math.sin(theta)],Xv=mv(X,v);
 const rays=Array.from({length:181},(_,j)=>{const a=j*Math.PI/180,u=j===0?[1,0]:j===90?[0,1]:j===180?[-1,0]:[Math.cos(a),Math.sin(a)];return{degrees:j,v:u,order:dot(u,mv(D,u))/scale,square:dot(u,mv(D2,u))/(scale*scale),congruent:dot(u,mv(C,u))/scale};});
 return{scale,A,B,requested,D,formationGap:fro(sub(D,requested)),X,A2,B2,D2,C,rawCongruent,congruenceCorrection:sub(C,rawCongruent),iA,iB,inverseGap,
  AProof:positivity(A),BProof:positivity(B),order:evidence(D),square:evidence(D2),congruent:evidence(C),inverse:inverseGap?evidence(inverseGap):null,
  inverseDefects:iA&&iB?{A:sub(mm(A,iA),eye(2)),B:sub(mm(B,iB),eye(2))}:null,
  inverseTheorem:positivity(A).pd&&positivity(B).pd&&positivity(D).psd,
  commutator:sub(mm(A,B),mm(B,A)),v,Xv,quadraticBefore:dot(Xv,mv(D,Xv)),quadraticAfter:dot(v,mv(C,v)),rays};
}
function jacobi3(A){
 let T=A.map(r=>r.slice()),Q=eye(3);const records=[],threshold=64*Number.EPSILON*fro(A);let status="iteration-budget";
 for(let step=0;step<100;step++){
  let p=0,q=1;
  for(const[i,j]of [[0,2],[1,2]])if(Math.abs(T[i][j])>Math.abs(T[p][q])){p=i;q=j;}
  const off=Math.hypot(T[0][1],T[0][2],T[1][2])*Math.SQRT2;
  if(off<=threshold){status=off===0?"exact-diagonal":"off-diagonal-threshold";break;}
  const before=T.map(r=>r.slice()),Qbefore=Q.map(r=>r.slice()),a=T[p][p],b=T[p][q],d=T[q][q],tau=(d-a)/(2*b);
  const t=(tau>=0?1:-1)/(Math.abs(tau)+Math.hypot(1,tau)),c=1/Math.hypot(1,t),s=t*c,J=eye(3);
  J[p][p]=J[q][q]=c;J[p][q]=s;J[q][p]=-s;
  const raw=mm(mm(tr(J),T),J),after=raw.map(r=>r.slice());
  after[p][q]=after[q][p]=0;
  for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)after[i][j]=after[j][i]=(raw[i][j]+raw[j][i])/2;
  // Keep the chosen off-diagonal truncation distinct from symmetrization.
  after[p][q]=after[q][p]=0;
  const correction=sub(after,raw);T=after;Q=mm(Q,J);
  records.push({step,p,q,off,threshold,before,Qbefore,tau,t,c,s,J,raw,correction,after:T.map(r=>r.slice()),Q:Q.map(r=>r.slice())});
 }
 const pairs=[0,1,2].map(i=>{const value=T[i][i],v=Q.map(r=>r[i]),residual=mv(A,v).map((x,j)=>x-value*v[j]);return{value,v,residual,residualNorm:norm(residual),radius:norm(residual)/norm(v)};}).sort((a,b)=>a.value-b.value);
 return{A,T,Q,records,status,threshold,pairs,orthogonality:fro(sub(mm(tr(Q),Q),eye(3))),similarity:fro(sub(T,mm(mm(tr(Q),A),Q))),correctionBudget:records.reduce((s,r)=>s+fro(r.correction),0)};
}
function schur(s){
 const scale=10**s.scaleExponent,A=mul([[s.a1,0],[0,s.a2]],scale),b=[s.b1*scale,s.b2*scale],c=s.c*scale,M=[[A[0][0],0,b[0]],[0,A[1][1],b[1]],[b[0],b[1],c]],diagonal=[A[0][0],A[1][1]];
 const pinv=diagonal.map(x=>x===0?0:1/x),pseudo=[[pinv[0],0],[0,pinv[1]]],xstar=mv(pseudo,b).map(x=>-x),rangeResidual=b.map((x,i)=>diagonal[i]===0?x:0),inRange=rangeResidual.every(x=>x===0),positivePivot=diagonal.every(x=>x>=0),strictPivot=diagonal.every(x=>x>0),finiteMinimum=inRange&&positivePivot;
 const S=c-dot(b,mv(pseudo,b)),L=[[1,0,0],[0,1,0],[xstar[0],xstar[1],1]],congruent=mm(mm(L,M),tr(L)),target=[[A[0][0],0,rangeResidual[0]],[0,A[1][1],rangeResidual[1]],[rangeResidual[0],rangeResidual[1],S]];
 let escape=[1,0],escapeType="positive-pivot";
 const neg=diagonal.findIndex(x=>x<0),outside=rangeResidual.findIndex(x=>x!==0);
 if(neg>=0){escape=[0,0];escape[neg]=1;escapeType="negative-curvature";}
 else if(outside>=0){escape=[0,0];escape[outside]=-Math.sign(rangeResidual[outside]);escapeType="range-failure";}
 else if(diagonal.some(x=>x===0)){escape=[0,0];escape[diagonal.indexOf(0)]=1;escapeType="flat-minimizers";}
 const samples=Array.from({length:41},(_,i)=>{
  const t=(i-20)/2,x=xstar.map((v,j)=>v+t*escape[j]),v=[...x,1],q=dot(v,mv(M,v)),shift=x.map((v,j)=>v-xstar[j]),completed=dot(shift,mv(A,shift))+S+2*dot(rangeResidual,x);
  return{t,x,v,q,completed,gap:q-completed};
 });
 return{scale,A,b,c,M,pseudo,diagonal,pinv,xstar,rangeResidual,inRange,positivePivot,strictPivot,finiteMinimum,S,L,congruent,target,congruenceGap:sub(congruent,target),exact:positivity(M),pivotExact:positivity(A),eig:jacobi3(M),escape,escapeType,samples,minimum:finiteMinimum?S:null,
  normalResidual:mv(A,xstar).map((v,i)=>v+b[i]),actualAtCandidate:dot([...xstar,1],mv(M,[...xstar,1])),covarianceAllowed:positivity(M).psd&&positivePivot&&inRange};
}
const FUNCTIONS=["square","sqrt","log","negative-inverse","exp"];
function scalarFunction(f,x){return f==="square"?x*x:f==="sqrt"?Math.sqrt(x):f==="log"?Math.log(x):f==="negative-inverse"?-1/x:Math.exp(x);}
function derivative(f,x){return f==="square"?2*x:f==="sqrt"?1/(2*Math.sqrt(x)):f==="log"?1/x:f==="negative-inverse"?1/(x*x):Math.exp(x);}
function divided(f,x,y){
 if(x===y)return derivative(f,x);
 if(x<y){const t=x;x=y;y=t;}
 if(f==="square")return x+y;if(f==="sqrt")return 1/(Math.sqrt(x)+Math.sqrt(y));
 if(f==="negative-inverse")return 1/(x*y);
 if(f==="log")return Math.log1p((x-y)/y)/(x-y);
 return Math.exp(y)*Math.expm1(x-y)/(x-y);
}
function matrixFunction(A,f){
 const e=eig2(A),p=positivity(A),domain=f==="sqrt"?p.psd:f==="log"||f==="negative-inverse"?p.pd:true;
 if(!domain)return{status:"outside-domain",eig:e,matrix:null,scalar:null,reconstruction:null};
 const values=e.values;
 // Positivity is proved for the stored input. Negative numerical eigenvalues
 // never get silently clamped into a different function domain.
 if((f==="sqrt"&&values.some(x=>x<0))||((f==="log"||f==="negative-inverse")&&values.some(x=>x<=0)))return{status:"unresolved-spectrum",eig:e,matrix:null,scalar:null,reconstruction:null};
 const fv=values.map(x=>scalarFunction(f,x)),F=add(mul(outer(e.vectors[0],e.vectors[0]),fv[0]),mul(outer(e.vectors[1],e.vectors[1]),fv[1]));
 const reconstruction=sub(A,add(mul(outer(e.vectors[0],e.vectors[0]),values[0]),mul(outer(e.vectors[1],e.vectors[1]),values[1])));
 return{status:"computed",eig:e,matrix:F,scalar:fv,reconstruction};
}
function functions(s){
 const B=[[1+s.delta,0],[0,s.delta]],H=[[1,1],[1,1]],A=add(B,mul(H,s.t)),D=sub(A,B),base=eig2(B);
 const records=FUNCTIONS.map(f=>{
  const a=matrixFunction(A,f),b=matrixFunction(B,f),difference=a.matrix&&b.matrix?sub(a.matrix,b.matrix):null;
  const domainDerivative=f==="square"||f==="exp"||s.delta>0;
  const L=domainDerivative?base.values.map(x=>base.values.map(y=>divided(f,x,y))):null;
  // B is diagonal here, with the same ordered coordinate basis for every delta.
  const actualDerivative=L?L.map((r,i)=>r.map((v,j)=>v*H[i][j])):null;
  const quotient=difference&&s.t>0?mul(difference,1/s.t):null;
  const backward=f==="sqrt"&&a.matrix?sub(mm(a.matrix,a.matrix),A):f==="negative-inverse"&&a.matrix?sub(mm(A,mul(a.matrix,-1)),eye(2)):null;
  return{f,a,b,difference,evidence:difference?evidence(difference):null,L,derivative:actualDerivative,derivativeEvidence:actualDerivative?evidence(actualDerivative):null,quotient,linearizationGap:quotient&&actualDerivative?fro(sub(quotient,actualDerivative)):null,backward};
 });
 const mixture=add(mul(A,s.weight),mul(B,1-s.weight)),squareJensen=sub(add(mul(mm(A,A),s.weight),mul(mm(B,B),1-s.weight)),mm(mixture,mixture)),squarePredicted=mul(mm(sub(A,B),sub(A,B)),s.weight*(1-s.weight));
 return{A,B,H,D,formationGap:fro(sub(D,mul(H,s.t))),inputOrder:positivity(D),records,mixture,squareJensen,squarePredicted,squareJensenGap:fro(sub(squareJensen,squarePredicted)),squareJensenEvidence:evidence(squareJensen)};
}
const DEFAULTS={mode:"order",t:1,delta:0,shear:2,stretch:1,theta:90,scaleExponent:0,a1:4,a2:2,b1:2,b2:0,c:3,weight:.5};
function num(v,key,lo,hi,integer=false){
 if(typeof v!=="number"&&typeof v!=="string")throw Error(key+"必须是有限数");
 if(typeof v==="string"){
  v=v.trim();if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(v))throw Error(key+"不能为空或含非数字内容");
  const raw=v;v=Number(v);if(v===0&&/[1-9]/.test(raw.split(/e/i)[0]))throw Error(key+"发生下溢");
 }
 if(!Number.isFinite(v)||v<lo||v>hi||(integer&&!Number.isInteger(v)))throw Error(key+"须在"+lo+"至"+hi+"之间"+(integer?"且为整数":""));
 if(!integer&&v!==0&&Math.abs(v)<1e-15)throw Error(key+"取0或绝对值至少1e-15");
 return v;
}
function config(raw={}){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))throw Error("配置须是对象");
 const s={...DEFAULTS,mode:Object.hasOwn(raw,"mode")?raw.mode:DEFAULTS.mode};
 if(!["order","schur","functions"].includes(s.mode))throw Error("未知实验");
 const fields=s.mode==="order"?[["t",0,2],["delta",0,2],["shear",-3,3],["stretch",0,2],["theta",-180,180],["scaleExponent",-6,6,true]]:
 s.mode==="functions"?[["t",0,2],["delta",0,2],["weight",0,1]]:
 [["a1",-4,4],["a2",-4,4],["b1",-3,3],["b2",-3,3],["c",-2,4],["scaleExponent",-6,6,true]];
 for(const[k,lo,hi,i]of fields)s[k]=num(Object.hasOwn(raw,k)?raw[k]:s[k],k,lo,hi,i);
 if(s.mode==="schur"&&[s.a1,s.a2].some(x=>x!==0&&Math.abs(x)<1e-12))throw Error("枢轴取0或绝对值至少1e-12");
 if(s.mode==="functions"&&s.delta!==0&&s.delta<1e-12)throw Error("函数实验的δ取0或至少1e-12");
 return s;
}
function snapshot(raw={}){
 const s=config(raw),result=s.mode==="order"?order(s):s.mode==="schur"?schur(s):functions(s);
 if(s.mode!=="functions")return{config:s,result};
 const values=[...new Set([0,...Array.from({length:21},(_,i)=>i/10),s.t])].sort((a,b)=>a-b);
 return{config:s,result,study:values.map(t=>({t,result:functions({...s,t})}))};
}
const PRESETS=[
 {id:"default",label:"平方反例与方向"},
 {id:"positive",label:"两个矩阵都严格正定",delta:.1},
 {id:"equal",label:"t=0：相等边界",t:0},
 {id:"tiny",label:"小扰动保留实际差",t:1e-12,delta:.1},
 {id:"small-units",label:"单位尺度10⁻⁶",scaleExponent:-6},
 {id:"large-units",label:"单位尺度10⁶",scaleExponent:6},
 {id:"singular-x",label:"合同X不满秩",stretch:0},
 {id:"negative-ray",label:"负方向可以直接代入",theta:-56.309932474020215},
 {id:"functions",label:"五种实际矩阵函数",mode:"functions",delta:.1},
 {id:"function-boundary",label:"零谱：log与逆留空",mode:"functions",delta:0},
 {id:"function-small",label:"差商与导数比较",mode:"functions",delta:.1,t:1e-8},
 {id:"function-rounding",label:"过小步长的舍入",mode:"functions",delta:.1,t:1e-15},
 {id:"function-near-zero",label:"接近零谱的敏感性",mode:"functions",delta:1e-12},
 {id:"function-equal",label:"函数差为零不定义差商",mode:"functions",delta:.1,t:0},
 {id:"schur",label:"配方后的最小值2",mode:"schur"},
 {id:"flat",label:"零枢轴与一族最小解",mode:"schur",a2:0},
 {id:"range-failure",label:"广义Schur为2却无下界",mode:"schur",a2:0,b2:1},
 {id:"negative-pivot",label:"负枢轴：二次逃逸",mode:"schur",a2:-1},
 {id:"zero-schur",label:"Schur为零的边界",mode:"schur",c:1},
 {id:"negative-schur",label:"正枢轴、负Schur",mode:"schur",c:0},
 {id:"small-pivot",label:"小枢轴不是零枢轴",mode:"schur",a2:1e-12,b2:1},
 {id:"scaled-schur",label:"换单位再看主子式",mode:"schur",scaleExponent:-6}
];
const QUESTIONS=[
 ["A≽B且两者正定，平方后必然保序吗？",["不保证，可找到负方向","保证，标量平方递增"],0,"正定域平方反例的差行列式为−t²。"],
 ["X不满秩时，Xᵀ(A−B)X仍半正定吗？",["仍然半正定，但可能失去正定性","不满秩便不保序"],0,"测试向量换成Xv；它可以把一些方向送到零。"],
 ["奇异枢轴的广义Schur补非负，就足够了吗？",["还需要枢轴半正定与范围条件","足够，广义逆自动解决零方向"],0,"耦合若进入枢轴的零空间，二次型沿该方向线性逃逸。"],
 ["平方不保序，是否意味着它也不是矩阵凸？",["不是，两种量词比较不同对象","是，保序与凸性等价"],0,"凸性差恰为α(1−α)(A−B)²，始终半正定。"]
];
function fmt(x){if(x===null||x===undefined)return"—";if(typeof x==="boolean")return x?"是":"否";if(typeof x!=="number")return String(x);if(!Number.isFinite(x))throw Error("不能显示非有限数");if(Number.isInteger(x))return String(x);return Math.abs(x)<1e-4||Math.abs(x)>=1e6?x.toExponential(8):String(Number(x.toPrecision(10)));}
const B="#268bd2",O="#cb6a16",G="#29966c",R="#b44a72",V="#9966bb",COLORS=[B,O,G,R,V],FNAMES={square:"平方",sqrt:"平方根",log:"对数","negative-inverse":"负倒数",exp:"指数"},series=(key,label,color,points,line=true)=>({key,label,color,points,line});
function plot(title,x,y,ss,xmin,xmax,markers=[]){
 const v=ss.flatMap(s=>s.points.map(p=>p[1])),ys=y.startsWith("log₁₀")?v:[0,...v],lo=ys.length?Math.min(...ys):0,hi=ys.length?Math.max(...ys):0,pad=(hi-lo||1)*.08;
 return{title,x,y,series:ss,xmin,xmax:xmax>xmin?xmax:xmin+1,ymin:lo-pad,ymax:hi+pad,square:false,markers};
}
function plots(d){
 const s=d.config,p=d.result;
 if(s.mode==="order"){
  const rs=p.rays,marker=s.theta>=0?[{x:s.theta,label:"当前θ"}]:[],span=[0,180];
  return[
   plot("平方差沿方向的二次型：负值足以推翻保序","方向角（度）","vᵀ(A²−B²)v / 单位尺度²",[
    series("square","实际平方差",B,rs.map(r=>[r.degrees,r.square])),
    series("min","最小特征值参照",R,[[0,p.square.eig.values[1]/p.scale**2],[180,p.square.eig.values[1]/p.scale**2]])],...span,marker),
   plot("同一方向经过X后的变化：合同不等于谱不变","测试方向角（度）","二次型 / 单位尺度",[
    series("order","原序关系",B,rs.map(r=>[r.degrees,r.order])),
    series("congruent","合同后的差",O,rs.map(r=>[r.degrees,r.congruent]))],...span,marker),
   plot("求逆反序的实际方向读数：奇异时留空","方向角（度）","vᵀ(B⁻¹−A⁻¹)v × 单位尺度",[
    series("inverse","实际逆矩阵差",G,p.inverseGap?rs.map(r=>[r.degrees,dot(r.v,mv(p.inverseGap,r.v))*p.scale]):[])],...span,marker)
  ];
 }
 if(s.mode==="schur")return[
  plot("沿明确路径移动x：配方与原二次型可逐点对照","x=x*+s d 的路径参数s","二次代价 / 共同单位尺度",[
   series("actual","实际代入M",B,p.samples.map(r=>[r.t,r.q/p.scale])),
   series("completed","含范围残差的配方",O,p.samples.map(r=>[r.t,r.completed/p.scale])),
   series("minimum","有限最小值（若存在）",G,p.minimum===null?[]:[[-10,p.minimum/p.scale],[10,p.minimum/p.scale]])],-10,10),
  plot("本征方程与消元的实际缺陷","本征对索引i","log₁₀ 范数 / 共同单位尺度",[
   series("residual","M本征残差",B,p.eig.pairs.flatMap((r,i)=>r.residualNorm>0?[[i,Math.log10(r.residualNorm/p.scale)]]:[]),false),
   series("congruence","消元恒等式缺陷",O,fro(p.congruenceGap)>0?[[0,Math.log10(fro(p.congruenceGap)/p.scale)]]:[],false)],0,2)
 ];
 const xs=d.study,rec=(v,f)=>v.result.records.find(r=>r.f===f),scaled=(v,f)=>{const r=rec(v,f);if(!r.evidence)return[];const den=fro(r.a.matrix)+fro(r.b.matrix);return[[v.t,den===0?0:r.evidence.eig.values[1]/den]];};
 return[
  plot("平方与指数：输入增加，某些输出方向却减小","扰动参数t","最小特征值差 / (||f(A)||F+||f(B)||F)",["square","exp"].map((f,i)=>series(f,FNAMES[f],i===0?B:R,xs.flatMap(v=>scaled(v,f)),false)),0,2),
  plot("开方、对数、负倒数：定理与实际舍入分别看","扰动参数t","最小特征值差 / (||f(A)||F+||f(B)||F)",["sqrt","log","negative-inverse"].map((f,i)=>series(f,FNAMES[f],[O,G,V][i],xs.flatMap(v=>scaled(v,f)),false)),0,2),
  plot("有限差商趋近导数，但过小步长会受舍入影响","扰动参数t（t=0不定义差商）","log₁₀ ||函数差/t−导数||F",FUNCTIONS.map((f,i)=>series(f,FNAMES[f],COLORS[i],xs.flatMap(v=>{const r=rec(v,f);return r.linearizationGap!==null&&r.linearizationGap>0?[[v.t,Math.log10(r.linearizationGap)]]:[];}),false)),0,2),
  plot("平方的凸性：同时看两个特征方向","扰动参数t","凸性差矩阵的实际特征值",[
   series("jensen","实际最小特征值",B,xs.map(v=>[v.t,v.result.squareJensenEvidence.eig.values[1]])),
   series("jensen-max","实际最大特征值",O,xs.map(v=>[v.t,v.result.squareJensenEvidence.eig.values[0]]))],0,2),
  plot("本例解析最小值为0：放大浮点偏离供诊断","扰动参数t","实际λmin；微小负值不否定正文定理",[
   series("roundoff","实际浮点最小特征值",B,xs.map(v=>[v.t,v.result.squareJensenEvidence.eig.values[1]]),false),
   series("zero","解析零值",G,[[0,0],[2,0]])],0,2)
 ];
}
const names={"positive-definite":"存储矩阵正定","positive-semidefinite":"存储矩阵半正定","not-positive-semidefinite":"存储矩阵非半正定","not-symmetric":"存储矩阵非对称","computed":"已计算","outside-domain":"不在所选实函数定义域","unresolved-spectrum":"浮点谱不足以使用定义域","negative-curvature":"负曲率，二次逃逸","range-failure":"范围失配，线性逃逸","flat-minimizers":"平坦的最小解族","positive-pivot":"沿正枢轴偏离最小解"};
function ledgers(d){
 const s=d.config,p=d.result,t=(key,title,headers,rows)=>({key,title,headers,rows}),col=x=>x.map(v=>[v]),entries=o=>Object.entries(o).flatMap(([k,A])=>A?A.flatMap((r,i)=>r.map((v,j)=>[k,i,j,v])):[]),
 proof=(label,p)=>p.minors.map(q=>[label,q.indices.join(","),q.sign,q.value,q.numerator,q.exponent]),eigen=(label,e)=>e.values.map((l,i)=>[label,i,l,...e.vectors[i],...e.residuals[i]]);
 if(s.mode==="order")return[
  t("summary","输入与判定对象",["量","值"],[["单位尺度",p.scale],["要求t",s.t],["共同移位δ",s.delta],["实际A−B形成缺陷",p.formationGap],["原序关系",names[p.order.exact.status]],["平方差",names[p.square.exact.status]],["X秩",s.stretch===0?1:2],["合同差",names[p.congruent.exact.status]],["逆序定理前提",p.inverseTheorem],["逆矩阵均存在",p.inverseGap!==null],["合同二次型左边",p.quadraticAfter],["合同二次型右边",p.quadraticBefore],["当前方向角",s.theta]]),
  t("matrices","完整输入与每个运算结果",["对象","i","j","值"],entries({A:p.A,B:p.B,requested:p.requested,D:p.D,X:p.X,A2:p.A2,B2:p.B2,D2:p.D2,rawCongruent:p.rawCongruent,C:p.C,congruenceCorrection:p.congruenceCorrection,inverseA:p.iA,inverseB:p.iB,inverseGap:p.inverseGap,commutator:p.commutator,v:col(p.v),Xv:col(p.Xv),...p.inverseDefects?{inverseDefectA:p.inverseDefects.A,inverseDefectB:p.inverseDefects.B}:{}})),
  t("proofs","精确二进制主子式：只针对存储矩阵",["对象","索引","符号","近似数值","整数分子","2的指数"],[...proof("A",p.AProof),...proof("B",p.BProof),...["order","square","congruent","inverse"].flatMap(k=>p[k]?proof(k,p[k].exact):[])]),
  t("eigen","实际特征值、向量与残差",["对象","i","λ","v0","v1","r0","r1"],["order","square","congruent","inverse"].flatMap(k=>p[k]?eigen(k,p[k].eig):[])),
  t("rays","181个实际测试方向，网格不是全方向证明",["角度","v0","v1","原差/尺度","平方差/尺度²","合同差/尺度"],p.rays.map(r=>[r.degrees,...r.v,r.order,r.square,r.congruent]))
 ];
 if(s.mode==="schur")return[
  t("summary","先判断是否真的存在最小值",["量","值"],[["单位尺度",p.scale],["枢轴正定",p.strictPivot],["枢轴半正定",p.positivePivot],["范围相容",p.inRange],["有限最小值存在",p.finiteMinimum],["形式上的Schur值",p.S],["实际有限最小值",p.minimum],["路径类型",names[p.escapeType]],["完整M判定",names[p.exact.status]],["可作协方差矩阵",p.covarianceAllowed],["消元恒等式缺陷",fro(p.congruenceGap)],["Jacobi旋转数",p.eig.records.length],["Jacobi状态",p.eig.status],["基正交缺陷",p.eig.orthogonality],["实际相似误差",p.eig.similarity]]),
  t("matrices","全部分块、广义逆与消元矩阵",["对象","i","j","值"],entries({A:p.A,b:col(p.b),M:p.M,pseudo:p.pseudo,xstar:col(p.xstar),rangeResidual:col(p.rangeResidual),L:p.L,congruent:p.congruent,target:p.target,congruenceGap:p.congruenceGap,normalResidual:col(p.normalResidual),escape:col(p.escape),Q:p.eig.Q,T:p.eig.T})),
  t("proofs","完整M与枢轴的所有主子式",["对象","索引","符号","近似数值","整数分子","2的指数"],[...proof("M",p.exact),...proof("A",p.pivotExact)]),
  t("path","每个路径点的原二次型与配方",["s","x1","x2","原二次型","配方值","两者差"],p.samples.map(r=>[r.t,...r.x,r.q,r.completed,r.gap])),
  t("eigen","三维实际本征对",["i","λ","v0","v1","v2","r0","r1","r2","残差范数"],p.eig.pairs.map((r,i)=>[i,r.value,...r.v,...r.residual,r.residualNorm])),
  t("rotations","全部旋转参数与显式修正",["步","p","q","非对角范数","阈值","tau","tan","cos","sin","修正F范数"],p.eig.records.map(r=>[r.step,r.p,r.q,r.off,r.threshold,r.tau,r.t,r.c,r.s,fro(r.correction)])),
  t("rotation-matrices","每次旋转的完整前后矩阵",["步","对象","i","j","值"],p.eig.records.flatMap(r=>entries({before:r.before,Qbefore:r.Qbefore,J:r.J,raw:r.raw,correction:r.correction,after:r.after,Q:r.Q}).map(v=>[r.step,...v])))
 ];
 const runs=[{t:s.t,current:true,result:p},...d.study.map(v=>({...v,current:false}))];
 return[
  t("summary","函数定义域、全维度定理与当前计算分开",["量","值"],[["共同移位δ",s.delta],["扰动参数t",s.t],["实际输入形成缺陷",p.formationGap],["实际输入序关系",names[p.inputOrder.status]],["凸组合权重",s.weight],["平方凸性恒等式缺陷",p.squareJensenGap],["判定范围","精确符号只判断存储矩阵，不认证真实函数值"]]),
  t("input","当前完整输入及平方凸性",["对象","i","j","值"],entries({A:p.A,B:p.B,H:p.H,D:p.D,mixture:p.mixture,squareJensen:p.squareJensen,squarePredicted:p.squarePredicted})),
  t("current","五种函数的实际证据",["函数","A状态","B状态","差的λmin","差的负方向二次型","差的存储正性","导数λmin","差商误差","反算缺陷"],p.records.map(r=>[FNAMES[r.f],names[r.a.status],names[r.b.status],r.evidence?.eig.values[1],r.evidence?.quadratic,r.evidence?names[r.evidence.exact.status]:null,r.derivativeEvidence?.eig.values[1],r.linearizationGap,r.backward?fro(r.backward):null])),
  t("run-matrices","当前与全部扫描的实际函数矩阵",["当前","t","函数","对象","i","j","值"],runs.flatMap(v=>v.result.records.flatMap(r=>entries({A:v.result.A,B:v.result.B,fA:r.a.matrix,fB:r.b.matrix,difference:r.difference,L:r.L,derivative:r.derivative,quotient:r.quotient,backward:r.backward,reconstructionA:r.a.reconstruction,reconstructionB:r.b.reconstruction}).map(z=>[v.current,v.t,r.f,...z])))),
  t("run-values","全部扫描的值与定义域状态",["当前","t","函数","A状态","B状态","λmin差","λmax差","差的存储正性","差商误差"],runs.flatMap(v=>v.result.records.map(r=>[v.current,v.t,r.f,names[r.a.status],names[r.b.status],r.evidence?.eig.values[1],r.evidence?.eig.values[0],r.evidence?names[r.evidence.exact.status]:null,r.linearizationGap]))),
  t("run-proofs","全部扫描实际函数差的精确主子式",["当前","t","对象","索引","符号","近似数值","整数分子","2的指数"],runs.flatMap(v=>v.result.records.flatMap(r=>r.evidence?proof(r.f,r.evidence.exact).map(z=>[v.current,v.t,...z]):[]))),
  t("run-eigen","全部扫描的谱向量与实际残差",["当前","t","对象","i","λ","v0","v1","r0","r1"],runs.flatMap(v=>v.result.records.flatMap(r=>[...eigen(r.f+":A",r.a.eig),...eigen(r.f+":B",r.b.eig),...r.evidence?eigen(r.f+":difference",r.evidence.eig):[],...r.derivativeEvidence?eigen(r.f+":derivative",r.derivativeEvidence.eig):[]].map(z=>[v.current,v.t,...z]))))
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

 const STYLE=".order147{color:var(--fg,#273646)}.order147 .order-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}.order147 label{display:flex;flex-direction:column;gap:6px}.order147 input,.order147 select{font:inherit;padding:8px;max-width:100%;background:var(--bg,#fff);color:inherit;border:1px solid #8b98a0;border-radius:5px}.order147 button{font:inherit;padding:8px 12px;margin:5px;cursor:pointer}.order147 button[aria-pressed=true]{outline:3px solid #478aaa}.order147 .order-scroll{overflow:auto;max-width:100%;margin:16px 0}.order147 .order-scroll:focus{outline:3px solid #478aaa}.order147 .order-ledger{max-height:420px}.order147 svg{width:900px!important;max-width:none!important;display:block;fill:currentColor;font:16px system-ui}.order147 table{display:table;overflow:visible;width:max-content;max-width:none;min-width:900px;border-collapse:collapse;font-variant-numeric:tabular-nums}.order147 th,.order147 td{padding:9px;border:1px solid #98a4ab;text-align:left;white-space:nowrap}.order147 .order-error{color:#c74b39}.order147 [hidden]{display:none!important}.order147 fieldset{margin:16px 0;padding:12px}.order147 details{margin:16px 0}.order147 summary{cursor:pointer;font-weight:600}.order147 .order-legend{font-size:.95em}.order147 .order-note{line-height:1.7}.order147 [hidden]{display:none!important}.order147 select{font:inherit;color:var(--fg,#282820);background:var(--bg,#faf7ef);padding:8px;max-width:100%}";
 function mount(container){
  const doc=container.ownerDocument;
  if(!doc.getElementById("order147-style")){const style=doc.createElement("style");style.id="order147-style";style.textContent=STYLE;doc.head.appendChild(style);}
  const field=(key,label,modes)=>'<label data-modes="'+modes+'">'+label+'<input data-key="'+key+'" type="number" step="any"></label>';
  container.innerHTML='<div class="order147"><h3>每个方向都更大，下一步运算还可靠吗？</h3><p>先预测，再改变参数；展开矩阵与残差核对每一步。</p><div class="order-presets">'+PRESETS.map(p=>'<button type="button" data-preset="'+p.id+'">'+esc(p.label)+'</button>').join("")+'</div><div class="order-controls"><label>实验<select data-key="mode"><option value="order">矩阵序与合同变换</option><option value="schur">Schur配方与范围条件</option><option value="functions">五种实际谱函数</option></select></label>'+
   field("t","扰动参数t（0–2）","order functions")+field("delta","共同移位δ（0–2）","order functions")+
   field("shear","合同X的剪切（−3–3）","order")+field("stretch","合同X的第二轴尺度（0–2）","order")+field("theta","当前测试方向θ（−180–180度）","order")+
   field("scaleExponent","共同单位10的指数（−6–6整数）","order schur")+
   field("a1","第一枢轴（−4–4）","schur")+field("a2","第二枢轴（−4–4）","schur")+field("b1","第一耦合（−3–3）","schur")+field("b2","第二耦合（−3–3）","schur")+field("c","剩余对角C（−2–4）","schur")+
   field("weight","凸组合权重α（0–1）","functions")+'</div><p>非零输入的绝对值至少1e−15；Schur非零枢轴、函数实验非零δ至少1e−12。单位尺度只用于前两类模型。</p>'+
   QUESTIONS.map((q,i)=>'<fieldset data-question="'+i+'"><legend>'+(i+1)+'. '+esc(q[0])+'</legend>'+q[1].map((v,j)=>'<button type="button" data-choice="'+j+'" aria-pressed="false">'+esc(v)+'</button>').join("")+'</fieldset>').join("")+
   '<button type="button" data-action="reveal">揭示图与完整账本</button><button type="button" data-action="reset">重置预测</button><p class="order-error" role="alert"></p><p role="status"></p><div class="order-results" hidden></div></div>';
  const fields=Array.from(container.querySelectorAll("[data-key]")),answers=Array(4).fill(null),result=container.querySelector(".order-results"),reveal=container.querySelector("[data-action=reveal]"),feedback=container.querySelector("[role=status]"),error=container.querySelector("[role=alert]");
  fields.forEach(e=>e.value=DEFAULTS[e.dataset.key]);
  let revealed=false,valid=null;
  function render(d){
   const notes={order:"原序与平方差分别计算；即使两个输入都正定，平方仍可不保序。合同X不满秩时可以丢失方向。每个实际存储矩阵用全部主子式作精确二进制符号检查，浮点谱与实际负方向另列。要求的扰动与实际A−B也分别保留。",schur:"先判断枢轴正性和范围条件，再决定形式Schur值是否真是最小值。曲线的蓝色实际代入与橙色配方通常重合；只有存在有限最小值时才画绿色线。零枢轴有耦合时沿零方向线性逃逸，负枢轴则沿负方向二次逃逸。Jacobi记录包含实际旋转和显式修正。",functions:"五种函数均按谱实际计算，不是只显示定理名单。函数值差、导数、有限差商和反算缺陷分别保留。超越函数的浮点结果可能因舍入出现微小负方向；存储矩阵的精确符号不认证理想函数真值。t=0没有差商，δ=0时对数与负倒数不定义；平方凸性与平方单调性是不同问题。"};
   result.innerHTML='<p>'+notes[d.config.mode]+'</p>'+
    plots(d).map(q=>'<p>'+q.series.filter((s,i,ss)=>ss.findIndex(t=>t.label===s.label&&t.color===s.color)===i).map(s=>esc(s.label)+'（'+({"#268bd2":"蓝","#cb6a16":"橙","#29966c":"绿","#9966bb":"紫","#b44a72":"玫红"}[s.color])+'）').join("；")+'</p><div class="order-scroll" role="region" tabindex="0" aria-label="'+esc(q.title)+'">'+svg(q)+'</div>').join("")+
    ledgers(d).map(t=>'<details data-ledger="'+t.key+'"'+(t.key==="summary"?' open':"")+'><summary>'+esc(t.title)+'（'+t.rows.length+' 行）</summary><div class="order-scroll order-ledger" role="region" tabindex="0" aria-label="'+esc(t.title)+'"><table data-table="'+t.key+'"><thead><tr>'+t.headers.map(x=>'<th scope="col">'+esc(x)+'</th>').join("")+'</tr></thead><tbody>'+t.rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(fmt(x))+'</td>').join("")+'</tr>').join("")+'</tbody></table></div></details>').join("")+
    '<p>“—”表示不适用、未定义或有限精度不足，不是0。对数图仅画严格正的实际值；线性图保留零。所有显示图与表都来自同一组计算记录。精确算术定理、浮点诊断与严格数值证书要分别理解。</p>';
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
 ck(fmt(1e-15)!=="0"&&fmt(0)==="0","small values not zero");
 ck(!positivity([[0,0],[0,-1]]).psd,"all principal minors");
 ck(positivity([[1e-20,0],[0,1e-20]]).pd,"scale-independent exact positivity");
 ck(!positivity([[1,1],[1,1-Number.EPSILON]]).psd,"actual negative determinant");
 let p=snapshot().result;ck(p.square.exact.minors.at(-1).sign===-1,"square fails order");
 p=snapshot({delta:.1}).result;ck(p.AProof.pd&&p.BProof.pd&&!p.square.exact.psd,"strict positive counterexample");
 p=snapshot({mode:"schur",a2:0}).result;ck(p.minimum===2&&p.escapeType==="flat-minimizers","flat minimum");
 p=snapshot({mode:"schur",a2:0,b2:1}).result;ck(p.S===2&&p.minimum===null&&!p.exact.psd,"range condition");
 p=snapshot({mode:"schur",a2:-1}).result;ck(p.minimum===null&&p.escapeType==="negative-curvature","negative pivot");
 p=snapshot({mode:"functions",delta:0}).result;ck(p.records.filter(r=>r.b.matrix===null).length===2,"function domain");
 p=snapshot({mode:"functions",delta:.1}).result;ck(p.records.find(r=>r.f==="exp").derivativeEvidence.exact.minors.at(-1).sign===-1,"exp derivative");
 p=snapshot({mode:"functions",delta:.1,t:0}).result;ck(p.records.every(r=>r.quotient===null),"zero step not derivative");
 return{status:"PASS",checks};
}
return{DEFAULTS,PRESETS,QUESTIONS,FUNCTIONS,num,config,snapshot,dot,norm,tr,mv,mm,eye,add,sub,mul,fro,outer,dyad,dmul,dneg,dadd,dsign,dfloat,determinant,positivity,eig2,inverse2,symmetrize,evidence,order,jacobi3,schur,scalarFunction,derivative,divided,matrixFunction,functions,fmt,plots,ledgers,svg,mount,selfTest};
});
