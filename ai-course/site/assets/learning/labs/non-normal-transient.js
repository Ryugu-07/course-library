(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;if(root&&root.CourseLearning)root.CourseLearning.register("non-normal-transient",api.mount);})(typeof window!=="undefined"?window:globalThis,function(){
"use strict";
const norm=x=>Math.hypot(...x),dot=(x,y)=>x.reduce((s,v,i)=>s+v*y[i],0),mv=(A,x)=>A.map(r=>dot(r,x)),tr=A=>A[0].map((_,i)=>A.map(r=>r[i])),mm=(A,B)=>A.map(r=>tr(B).map(c=>dot(r,c))),sub=(x,y)=>x.map((v,i)=>v-y[i]),msub=(A,B)=>A.map((r,i)=>sub(r,B[i])),madd=(A,B)=>A.map((r,i)=>r.map((v,j)=>v+B[i][j])),mul=(A,s)=>A.map(r=>r.map(v=>s*v)),fro=A=>norm(A.flat()),eye=n=>Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>+(i===j)));
function unit(angle){
 const k=((angle%360)+360)%360;
 if(k===0)return[1,0];if(k===90)return[0,1];if(k===180)return[-1,0];if(k===270)return[0,-1];
 return[Math.cos(angle*Math.PI/180),Math.sin(angle*Math.PI/180)];
}
function triangularSVD(a,b){
 const A=[[a,b],[0,a]],size=Math.max(Math.abs(a),Math.abs(b));
 if(size===0)return{A,max:0,min:0,vMax:[1,0],vMin:[0,1],maxImage:[0,0],minImage:[0,0]};
 const x=a/size,y=b/size,hi=(Math.hypot(2*x,y)+Math.abs(y))/2,lo=(Math.abs(x)/hi)*Math.abs(x);
 let vMax;
 if(y===0)vMax=[1,0];else{const length=Math.hypot(x,hi);vMax=[x*Math.sign(y)/length,hi/length];}
 const vMin=[-vMax[1],vMax[0]];
 return{A,max:hi*size,min:lo*size,vMax,vMin,maxImage:mv(A,vMax),minImage:mv(A,vMin)};
}
function jordanPower(r,g,j){
 if(j===0)return eye(2);if(r===0)return j===1?[[0,g],[0,0]]:[[0,0],[0,0]];
 return[[r**j,j*g*r**(j-1)],[0,r**j]];
}
function transient(s){
 const {r,g,k,theta,z}=s,A=[[r,g],[0,r]],x0=unit(theta),rho=Math.abs(r),rows=[];
 let P=eye(2),S=[[0,0],[0,0]];
 const M=[[z-r,-g],[0,z-r]],sv=triangularSVD(z-r,-g);
 const inverse=z===r?null:[[1/(z-r),g/(z-r)**2],[0,1/(z-r)]];
 const v=sv.vMin,Ev=mv(M,v),E=Ev.map(a=>v.map(b=>a*b)),changed=madd(A,E),changedResidual=sub(mv(changed,v),v.map(a=>z*a));
 for(let j=0;j<=k;j++){
  const before=P.map(r=>r.slice());
  if(j>0)P=mm(A,P);
  const closed=jordanPower(r,g,j),x=mv(P,x0),svd=triangularSVD(P[0][0],P[0][1]),normal=Math.abs(r)**j;
  let term=null,sum=null,identityResidual=null,tail=null,identityGap=null,remainder=null,remainderPredicted=null,remainderGap=null;
  if(z!==0){
   term=mul(P,z**(-j-1));S=madd(S,term);sum=S.map(r=>r.slice());
   identityResidual=msub(eye(2),mm(M,S));tail=mul(mm(A,P),z**(-j-1));identityGap=fro(msub(identityResidual,tail));
   if(inverse){remainder=msub(inverse,S);remainderPredicted=mm(inverse,tail);remainderGap=fro(msub(remainder,remainderPredicted));}
  }
  rows.push({j,before,P:P.map(r=>r.slice()),closed,closedGap:fro(msub(P,closed)),x,selected:norm(x),normal,svd,envelope:svd.max,
   rootGain:j?svd.max**(1/j):null,term,sum,identityResidual,tail,identityGap,remainder,remainderPredicted,remainderGap,
   partialNorm:sum?triangularSVD(S[0][0],S[0][1]).max:null,remainderNorm:remainder?triangularSVD(remainder[0][0],remainder[0][1]).max:null});
 }
 const peak=(field)=>rows.reduce((best,row)=>row[field]>best[field]?row:best,rows[0]);
 return{A,x0,rho,normal:g===0,diagonalizable:g===0,asymptotic:rho<1?"decay":rho>1?"growth":g===0?"bounded-nondecaying":"polynomial-growth",
  nonNormality:g*g,rows,selectedPeak:peak("selected").j,envelopePeak:peak("envelope").j,final:rows.at(-1),
  resolvent:{z,M,svd:sv,status:inverse?"invertible":"spectral-point",inverse,norm:inverse?triangularSVD(inverse[0][0],inverse[0][1]).max:null,
   neumann:z===0?"undefined-at-zero":Math.abs(z)>rho?"convergent":"not-convergent",v,Ev,E,changed,changedResidual,perturbationNorm:fro(E),attainmentGap:Math.abs(fro(E)-sv.min)}};
}
function symEig2(A){
 const c=A[0][0]/2+A[1][1]/2,d=A[0][0]/2-A[1][1]/2,b=A[0][1],rad=Math.hypot(d,b),values=[c+rad,c-rad];
 if(rad===0)return{A,center:c,radius:rad,values,simple:false,vectors:[[1,0],[0,1]],residuals:[[0,0],[0,0]]};
 const v=d>=0?[rad+d,b]:[b,rad-d],n=norm(v),hi=v.map(x=>x/n),lo=[-hi[1],hi[0]],vectors=[hi,lo];
 return{A,center:c,radius:rad,values,simple:true,vectors,residuals:vectors.map((v,i)=>sub(mv(A,v),v.map(x=>x*values[i])))};
}
function symmetricFrom(center,radius,angle){
 const [c,s]=unit(2*angle),a=radius*c,b=radius*s;
 return[[center+a,b],[b,center-a]];
}
function perturbation(s){
 const scale=10**s.scaleExponent,A=mul(symmetricFrom(s.center,s.gap/2,s.axisAngle),scale),requestedE=mul(symmetricFrom(0,s.epsilon,s.perturbAngle),scale);
 const B=madd(A,requestedE),E=msub(B,A),ae=symEig2(A),be=symEig2(B),ee=symEig2(E),eta=Math.max(...ee.values.map(Math.abs)),gap=2*ae.radius;
 const resolution=64*Number.EPSILON*(fro(A)+fro(B));
 const comparisons=be.values.map((value,i)=>{
  const v=be.vectors[i],other=1-i,shifted=A.map((row,j)=>row.map((x,k)=>j===k?x-value:x)),residual=mv(shifted,v),separation=Math.abs(value-ae.values[other]),bothSimple=ae.simple&&be.simple;
  const sinAngle=bothSimple?Math.abs(dot(ae.vectors[other],v)):null,angle=bothSimple?Math.atan2(sinAngle,Math.abs(dot(ae.vectors[i],v))):null;
  const projected=dot(ae.vectors[other],residual),identityLeft=(ae.values[other]-value)*dot(ae.vectors[other],v);
  const rawBound=bothSimple&&separation>0?norm(residual)/separation:null;
  const bound=bothSimple&&separation>resolution?(norm(residual)+resolution)/(separation-resolution):null;
  const gapBound=bothSimple&&gap>2*resolution&&eta<gap/2?eta/(gap-eta):null;
  const P=v.map(a=>v.map(b=>a*b)),u=ae.vectors[i],P0=u.map(a=>u.map(b=>a*b)),projectorDifference=msub(P,P0);
  return{i,value,originalValue:ae.values[i],deviation:Math.abs(value-ae.values[i]),v,shifted,residual,residualNorm:norm(residual),Ev:mv(E,v),residualIdentity:sub(residual,mv(E,v).map(x=>-x)),separation,
   sinAngle,angle,projected,identityLeft,rawBound,bound,gapBound,resolution,resolved:bothSimple&&separation>resolution,P,P0,projectorDifference,projectorFro:bothSimple?fro(projectorDifference):null};
 });
 return{scale,A,requestedE,B,E,formationGap:fro(msub(E,requestedE)),ae,be,ee,eta,gap,resolution,comparisons,
  absoluteWeyl:eta,relativeScale:Math.max(...ae.values.map(Math.abs)),distinctAfter:be.simple};
}
function exactSignSum(values){
 const buf=new ArrayBuffer(8),view=new DataView(buf);
 const terms=values.map(x=>{
  view.setFloat64(0,x,false);const bits=view.getBigUint64(0,false),sign=(bits>>63n)?-1n:1n,e=Number((bits>>52n)&2047n),f=bits&((1n<<52n)-1n);
  return{n:sign*(e?f+(1n<<52n):f),e:e?e-1023-52:-1074};
 }).filter(t=>t.n!==0n);
 if(!terms.length)return 0;const base=Math.min(...terms.map(t=>t.e)),n=terms.reduce((a,t)=>a+(t.n<<BigInt(t.e-base)),0n);return n>0n?1:n<0n?-1:0;
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
  const correction=msub(after,raw);T=after;Q=mm(Q,J);
  records.push({step,p,q,off,threshold,before,Qbefore,tau,t,c,s,J,raw,correction,after:T.map(r=>r.slice()),Q:Q.map(r=>r.slice())});
 }
 const pairs=[0,1,2].map(i=>{const value=T[i][i],v=Q.map(r=>r[i]),residual=sub(mv(A,v),v.map(x=>value*x));return{value,v,residual,residualNorm:norm(residual),radius:norm(residual)/norm(v)};}).sort((a,b)=>a.value-b.value);
 return{A,T,Q,records,status,threshold,pairs,orthogonality:fro(msub(mm(tr(Q),Q),eye(3))),similarity:fro(msub(T,mm(mm(tr(Q),A),Q))),correctionBudget:records.reduce((s,r)=>s+fro(r.correction),0)};
}
function gershgorin(s){
 const scale=10**s.scaleExponent,A=mul([[s.d1,s.coupling,0],[s.coupling,s.d2,s.coupling],[0,s.coupling,s.d3]],scale),disks=A.map((r,i)=>({i,center:r[i],radius:r.reduce((a,x,j)=>a+(i===j?0:Math.abs(x)),0)}));
 const edges=[],parents=[0,1,2],find=i=>parents[i]===i?i:(parents[i]=find(parents[i]));
 for(let i=0;i<3;i++)for(let j=i+1;j<3;j++){
  const a=disks[i],b=disks[j],terms=a.center>=b.center?[a.center,-b.center,-a.radius,-b.radius]:[b.center,-a.center,-a.radius,-b.radius],sign=exactSignSum(terms),connected=sign<=0;
  edges.push({i,j,separation:Math.abs(a.center-b.center)-a.radius-b.radius,exactSign:sign,connected});if(connected)parents[find(j)]=find(i);
 }
 const groups=[];
 for(let i=0;i<3;i++){const root=find(i);let g=groups.find(g=>g.root===root);if(!g){g={root,indices:[]};groups.push(g);}g.indices.push(i);}
 for(const g of groups){g.lower=Math.min(...g.indices.map(i=>disks[i].center-disks[i].radius));g.upper=Math.max(...g.indices.map(i=>disks[i].center+disks[i].radius));g.theoremCount=g.indices.length;}
 const eig=jacobi3(A),pairs=eig.pairs.map(p=>({...p,margins:disks.map(d=>d.radius-Math.abs(p.value-d.center)),groups:groups.flatMap((g,i)=>p.value+p.radius>=g.lower&&p.value-p.radius<=g.upper?[i]:[])}));
 const dominance=disks.map(d=>({i:d.i,margin:Math.abs(d.center)-d.radius,strict:exactSignSum([Math.abs(d.center),-d.radius])>0}));
 return{scale,A,disks,edges,groups,eig,pairs,dominance,strictlyDominant:dominance.every(d=>d.strict),negativeCount:groups.filter(g=>g.upper<0).reduce((s,g)=>s+g.theoremCount,0),positiveCount:groups.filter(g=>g.lower>0).reduce((s,g)=>s+g.theoremCount,0)};
}
const DEFAULTS={mode:"transient",r:.9,g:10,k:30,theta:90,z:1.3,center:1,gap:1,axisAngle:0,epsilon:.1,perturbAngle:45,scaleExponent:0,d1:4,d2:3,d3:-2,coupling:1};
function num(v,key,lo,hi,integer=false){
 if(typeof v!=="number"&&typeof v!=="string")throw Error(key+"必须为有限数值");
 if(typeof v==="string"){
  v=v.trim();if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(v))throw Error(key+"不能为空或含非数字内容");
  const original=v;v=Number(v);if(v===0&&/[1-9]/.test(original.split(/e/i)[0]))throw Error(key+"发生下溢");
 }
 if(!Number.isFinite(v)||v<lo||v>hi||(integer&&!Number.isInteger(v)))throw Error(key+"须在"+lo+"至"+hi+"之间"+(integer?"且为整数":""));
 return v;
}
function config(raw={}){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))throw Error("配置须为对象");
 const s={...DEFAULTS,mode:Object.hasOwn(raw,"mode")?raw.mode:DEFAULTS.mode};
 if(!["transient","perturbation","gershgorin"].includes(s.mode))throw Error("未知实验");
 const fields=s.mode==="transient"?[["r",-1.1,1.1],["g",-20,20],["k",0,60,true],["theta",-180,180],["z",-2,2]]:
 s.mode==="perturbation"?[["center",-2,2],["gap",0,4],["axisAngle",-180,180],["epsilon",0,2],["perturbAngle",-180,180],["scaleExponent",-12,12,true]]:
 [["d1",-5,5,true],["d2",-5,5,true],["d3",-5,5,true],["coupling",-4,4],["scaleExponent",-12,12,true]];
 for(const[key,lo,hi,int]of fields)s[key]=num(Object.hasOwn(raw,key)?raw[key]:s[key],key,lo,hi,int);
 if(s.mode==="transient"&&s.z!==0&&Math.abs(s.z)<.1)throw Error("探针z取0或绝对值至少0.1，以保持有限和可表示");
 return s;
}
function snapshot(raw={}){
 const s=config(raw);
 if(s.mode==="transient")return{config:s,result:transient(s)};
 if(s.mode==="perturbation"){
  const values=[...new Set([...Array.from({length:21},(_,i)=>i/10),s.epsilon])].sort((a,b)=>a-b);
  return{config:s,result:perturbation(s),study:values.map(epsilon=>({epsilon,result:perturbation({...s,epsilon})}))};
 }
 return{config:s,result:gershgorin(s),study:Array.from({length:11},(_,i)=>({t:i/10,result:gershgorin({...s,coupling:s.coupling*i/10})}))};
}
const PRESETS=[
 {id:"default",label:"稳定但先放大"},
 {id:"normal",label:"g=0：同谱正规控制",g:0},
 {id:"eigen",label:"e1：看不到剪切",theta:0},
 {id:"nilpotent",label:"r=0：两步幂零",r:0,k:4},
 {id:"critical",label:"r=1：线性增长",r:1},
 {id:"negative",label:"负r：交替符号也会瞬态",r:-.9,g:-10},
 {id:"near-critical",label:"接近1仍不是1",r:1-1e-13,g:0},
 {id:"tiny-coupling",label:"微小非零耦合仍非正规",g:1e-13},
 {id:"unstable",label:"r>1：长期增长",r:1.1},
 {id:"neumann-fail",label:"逆存在，Neumann却发散",g:0,z:.5,k:20},
 {id:"spectral",label:"探针恰为谱点",z:.9},
 {id:"zero-probe",label:"z=0：有限和不定义",z:0},
 {id:"weyl",label:"Weyl绝对变化与方向",mode:"perturbation"},
 {id:"small-gap",label:"小谱隙：方向更敏感",mode:"perturbation",gap:.02},
 {id:"degenerate",label:"重根：方向不唯一",mode:"perturbation",gap:0},
 {id:"rounding",label:"机器尺度：不伪造方向保证",mode:"perturbation",gap:1e-15,epsilon:1e-15,axisAngle:35,perturbAngle:-60},
 {id:"commuting",label:"对易扰动与方向交换",mode:"perturbation",perturbAngle:90,epsilon:1},
 {id:"disks",label:"圆盘：两正一负",mode:"gershgorin"},
 {id:"touch",label:"圆盘相接的边界",mode:"gershgorin",coupling:5/3},
 {id:"all-connected",label:"相连圆盘不能分别计数",mode:"gershgorin",coupling:4},
 {id:"diagonal",label:"零半径圆盘",mode:"gershgorin",coupling:0},
 {id:"repeated",label:"重特征值也按重数计",mode:"gershgorin",d1:1,d2:1,d3:1,coupling:0}
];
const QUESTIONS=[
 ["谱半径小于1能保证每一步范数都下降吗？",["不能，它只给渐近衰减","能，每次都会收缩"],0,"Jordan剪切可以先放大再衰减，方向也影响可见增益。"],
 ["zI−A可逆，Neumann无限和就一定收敛吗？",["不能，展开还要求相应谱半径小于1","能，可逆足够"],0,"有限恒等式始终可核对，取无限极限还需要尾项消失。"],
 ["对称特征值变化很小，可以保证主方向稳定吗？",["还要检查谱分离以及方向是否唯一","可以，Weyl已经保证方向"],0,"值的绝对稳定与向量的谱隙条件是不同问题。"],
 ["两个闭Gershgorin圆盘相切时，可分别各数一个根吗？",["不能，需要与其余圆盘真正分离","可以，相切不算相连"],0,"相切属于相连，计数定理按分离的区域组使用。"]
];
function fmt(x){
 if(x===null||x===undefined)return"—";if(typeof x==="boolean")return x?"是":"否";if(typeof x!=="number")return String(x);
 if(!Number.isFinite(x))throw Error("不能显示非有限结果");if(Number.isInteger(x))return String(x);
 return Math.abs(x)<1e-4||Math.abs(x)>=1e6?x.toExponential(8):String(Number(x.toPrecision(10)));
}
const B="#268bd2",O="#cb6a16",G="#29966c",R="#b44a72",V="#9966bb",series=(key,label,color,points,line=true)=>({key,label,color,points,line});
function plot(title,x,y,ss,xmin,xmax){
 const ys=ss.flatMap(s=>s.points.map(p=>p[1])),range=y.startsWith("log₁₀")?ys:[0,...ys],lo=range.length?Math.min(...range):0,hi=range.length?Math.max(...range):0,pad=(hi-lo||1)*.08;
 return{title,x,y,series:ss,xmin,xmax:xmax>xmin?xmax:xmin+1,ymin:lo-pad,ymax:hi+pad,square:false,markers:[]};
}
function plots(d){
 const s=d.config,p=d.result;
 if(s.mode==="transient"){
  const rows=p.rows,trace=(key,label,color,log=false)=>series(key,label,color,rows.flatMap(r=>r[key]!==null&&(!log||r[key]>0)?[[r.j,log?Math.log10(r[key]):r[key]]]:[]),!log);
  return[
   plot("同谱的有限时间表现：方向与最坏增益","矩阵作用次数j","向量长度或欧氏算子范数",[trace("envelope","最坏方向增益",B),trace("selected","所选方向增益",O),trace("normal","同谱正规控制",G)],0,s.k),
   plot("根速率趋于谱半径，不是每一步的收缩率","矩阵作用次数j（j=0不定义）","||Aʲ||₂的j次根",[trace("rootGain","当前根速率",B),series("rho","谱半径",R,[[0,p.rho],[Math.max(1,s.k),p.rho]])],0,s.k),
   plot("有限Neumann和：逆存在也可能不收敛","部分和最高次数j","部分和与逆矩阵范数",[trace("partialNorm","部分和范数",O),series("inverse","逆矩阵范数",B,p.resolvent.norm===null?[]:[[0,p.resolvent.norm],[Math.max(1,s.k),p.resolvent.norm]])],0,s.k),
   plot("实际Neumann余项与有限恒等式缺陷","部分和最高次数j","log₁₀ 实际误差（零留在表中）",[trace("remainderNorm","逆减部分和",B,true),trace("identityGap","有限恒等式缺陷",O,true),trace("remainderGap","余项等式缺陷",G,true)],0,s.k),
   plot("逐次矩阵乘法与闭式公式的差距","矩阵作用次数j","log₁₀ ||P(乘法)−P(闭式)||F",[trace("closedGap","实际差距",B,true)],0,s.k)
  ];
 }
 if(s.mode==="perturbation"){
  const xs=d.study,points=(i,key,valid=x=>x!==null)=>xs.flatMap(v=>valid(v.result.comparisons[i][key])?[[v.epsilon,v.result.comparisons[i][key]]]:[]);
  return[
   plot("有序特征值：显示的是绝对变化","要求的扰动幅度ε（单位尺度前）","特征值 / 共同尺度",[0,1].flatMap(i=>[
    series("e"+i,"第"+(i+1)+"个特征值",i===0?B:O,xs.map(v=>[v.epsilon,v.result.be.values[i]/p.scale])),
    series("upper"+i,"Weyl上界"+i,i===0?G:V,xs.map(v=>[v.epsilon,(v.result.ae.values[i]+v.result.eta)/p.scale])),
    series("lower"+i,"Weyl下界"+i,i===0?G:V,xs.map(v=>[v.epsilon,(v.result.ae.values[i]-v.result.eta)/p.scale]))]),0,2),
   plot("方向变化：谱隙条件不满足时留空","要求的扰动幅度ε（单位尺度前）","sin角度与理论间隔比较（上界可超过1）",[0,1].flatMap(i=>[
    series("angle"+i,"第"+(i+1)+"个方向",i===0?B:O,points(i,"sinAngle"),false),
    series("gap"+i,"小扰动间隔估计"+i,i===0?G:V,points(i,"gapBound"),false)]),0,2),
   plot("残差读数与有限精度缓冲，不能当区间证书","要求的扰动幅度ε（单位尺度前）","方向角正弦、原读数与缓冲估计",[
    series("angle","首方向实际sin角",B,points(0,"sinAngle"),false),
    series("raw","原始残差/分离读数",O,points(0,"rawBound"),false),
    series("buffered","带64u尺度的诊断",R,points(0,"bound"),false)],0,2),
   plot("要求的扰动与实际形成的矩阵差","要求的扰动幅度ε（单位尺度前）","log₁₀ 共同尺度归一的舍入缺陷",[
    series("formation","形成B时的差距",B,xs.flatMap(v=>v.result.formationGap>0?[[v.epsilon,Math.log10(v.result.formationGap/p.scale)]]:[]),false),
    series("eigen","B的本征方程缺陷",O,xs.flatMap(v=>{const n=norm(v.result.be.residuals.flat());return n>0?[[v.epsilon,Math.log10(n/p.scale)]]:[];}),false)],0,2)
  ];
 }
 const disks=p.disks,cs=disks.map(q=>q.center/p.scale),rs=disks.map(q=>q.radius/p.scale),left=Math.min(...cs.map((c,i)=>c-rs[i])),right=Math.max(...cs.map((c,i)=>c+rs[i])),mid=(left+right)/2,h=Math.max(1,...rs,(right-left)/6)*1.12;
 const circles=disks.map((q,i)=>series("disk"+i,"第"+(i+1)+"行圆盘",[B,O,V][i],Array.from({length:121},(_,j)=>{const u=unit(j*3);return[cs[i]+rs[i]*u[0],rs[i]*u[1]];})));
 circles.push(series("eigen","实际Jacobi特征值",R,p.pairs.map(q=>[q.value/p.scale,0]),false));
 const diskPlot={title:"Gershgorin闭圆盘：等单位复平面与真实谱点",x:"实部 / 共同尺度",y:"虚部 / 共同尺度",series:circles,xmin:mid-3*h,xmax:mid+3*h,ymin:-h,ymax:h,square:false,equalUnits:true,markers:[]};
 return[diskPlot,
  plot("同伦中的实际对称谱：计数证明不依赖此网格","H(t)=D+t(A−D)的t","按大小排序的特征值 / 共同尺度",[0,1,2].map(i=>series("eigen"+i,"第"+(i+1)+"小特征值",[B,O,V][i],d.study.map(v=>[v.t,v.result.pairs[i].value/p.scale]))),0,1),
  plot("Jacobi的实际本征残差与相似误差","H(t)=D+t(A−D)的t","log₁₀ 共同尺度归一的实际缺陷",[
   series("residual","全部本征残差",B,d.study.flatMap(v=>{const x=norm(v.result.pairs.flatMap(r=>r.residual));return x>0?[[v.t,Math.log10(x/p.scale)]]:[];}),false),
   series("similarity","相似误差",O,d.study.flatMap(v=>v.result.eig.similarity>0?[[v.t,Math.log10(v.result.eig.similarity/p.scale)]]:[]),false)],0,1)];
}
const stateNames={decay:"渐近衰减",growth:"指数增长","bounded-nondecaying":"有界但不衰减","polynomial-growth":"多项式增长",invertible:"逆矩阵存在","spectral-point":"谱点：逆不存在",convergent:"Neumann收敛","not-convergent":"Neumann不收敛","undefined-at-zero":"z=0：有限和不定义","exact-diagonal":"浮点非对角恰为0","off-diagonal-threshold":"非对角达到阈值","iteration-budget":"预算结束"};
function ledgers(d){
 const s=d.config,p=d.result,col=x=>x.map(v=>[v]),entries=a=>Object.entries(a).flatMap(([key,A])=>A.flatMap((r,i)=>r.map((v,j)=>[key,i,j,v]))),t=(key,title,headers,rows)=>({key,title,headers,rows});
 if(s.mode==="transient")return[
  t("summary","输入、精确边界与窗口峰值",["量","值"],[["r",s.r],["g",s.g],["窗口k",s.k],["方向角",s.theta],["谱半径",p.rho],["渐近状态",stateNames[p.asymptotic]],["正规",p.normal],["存在特征基",p.diagonalizable],["非正规性缺陷",p.nonNormality],["方向峰值所在j",p.selectedPeak],["最坏增益峰值所在j",p.envelopePeak],["探针z",s.z],["逆状态",stateNames[p.resolvent.status]],["级数状态",stateNames[p.resolvent.neumann]]]),
  t("input","完整输入",["对象","i","j","值"],entries({A:p.A,x0:col(p.x0),shifted:p.resolvent.M})),
  t("trace","每一步的增益、根速率与余项",["j","所选增益","正规控制","算子增益","最小奇异值","j次根","乘法闭式差","部分和范数","逆减部分和范数","有限恒等式缺陷","余项恒等式缺陷"],p.rows.map(r=>[r.j,r.selected,r.normal,r.envelope,r.svd.min,r.rootGain,r.closedGap,r.partialNorm,r.remainderNorm,r.identityGap,r.remainderGap])),
  t("powers","每一步实际乘法、闭式和方向",["j","对象","i","j","值"],p.rows.flatMap(r=>entries({before:r.before,P:r.P,closed:r.closed,x:col(r.x),maxDirection:col(r.svd.vMax),minDirection:col(r.svd.vMin),maxImage:col(r.svd.maxImage),minImage:col(r.svd.minImage)}).map(v=>[r.j,...v]))),
  t("neumann","每一项、部分和、尾项与实际余项",["最高次数","对象","i","j","值"],p.rows.flatMap(r=>entries(Object.fromEntries(["term","sum","identityResidual","tail","remainder","remainderPredicted"].filter(k=>r[k]!==null).map(k=>[k,r[k]]))).map(v=>[r.j,...v]))),
  t("resolvent","最小扰动公式与实际浮点见证",["量","值"],[["逆矩阵范数",p.resolvent.norm],["移位矩阵最大奇异值",p.resolvent.svd.max],["移位矩阵最小奇异值",p.resolvent.svd.min],["实际扰动范数",p.resolvent.perturbationNorm],["达到最小值的浮点差距",p.resolvent.attainmentGap],["构造后残差",norm(p.resolvent.changedResidual)]]),
  t("witness","逆矩阵、奇异向量与显式扰动所有元素",["对象","i","j","值"],entries({...p.resolvent.inverse?{inverse:p.resolvent.inverse}:{},v:col(p.resolvent.v),Ev:col(p.resolvent.Ev),E:p.resolvent.E,changed:p.resolvent.changed,changedResidual:col(p.resolvent.changedResidual)}))
 ];
 const perturbRows=(v,label)=>v.comparisons.map(r=>[label,r.i,r.originalValue,r.value,r.deviation,r.residualNorm,r.separation,r.sinAngle,r.rawBound,r.bound,r.gapBound,r.resolution,r.resolved,r.projectorFro]);
 const perturbMatrices=v=>entries({A:v.A,requestedE:v.requestedE,B:v.B,E:v.E,...Object.fromEntries(["ae","be","ee"].flatMap(k=>[[k+"Vectors",tr(v[k].vectors)],[k+"Residuals",tr(v[k].residuals)]]))});
 const perturbVectors=v=>v.comparisons.flatMap(r=>entries({v:col(r.v),shifted:r.shifted,residual:col(r.residual),Ev:col(r.Ev),identity:col(r.residualIdentity),P:r.P,P0:r.P0,difference:r.projectorDifference}).map(z=>[r.i,...z]));
 if(s.mode==="perturbation")return[
  t("summary","实际扰动与有限精度尺度",["量","值"],[["共同尺度",p.scale],["要求的谱隙",s.gap*p.scale],["实际A谱隙",p.gap],["要求的扰动幅度",s.epsilon*p.scale],["实际B-A范数",p.eta],["形成矩阵差距",p.formationGap],["64u诊断尺度",p.resolution],["原始方向唯一",p.ae.simple],["扰动后方向唯一",p.be.simple],["估计性质","浮点诊断，非区间证书"]]),
  t("input","实际矩阵与所有谱分解",["对象","i","j","值"],perturbMatrices(p)),
  t("directions","当前两个方向的完整证据",["参数ε","方向i","原值","新值","绝对变化","残差范数","分离δ","sin角","原残差/δ","缓冲估计","小扰动间隔估计","64u尺度","分离可解析","投影差F范数"],perturbRows(p,s.epsilon)),
  t("vectors","当前向量、残差与投影矩阵",["方向","对象","i","j","值"],perturbVectors(p)),
  t("scan","扫描所有谱值、方向读数和无效状态",["参数ε","方向i","原值","新值","绝对变化","残差范数","分离δ","sin角","原残差/δ","缓冲估计","小扰动间隔估计","64u尺度","分离可解析","投影差F范数"],d.study.flatMap(v=>perturbRows(v.result,v.epsilon))),
  t("scan-matrices","每个扫描点的完整矩阵",["参数ε","对象","i","j","值"],d.study.flatMap(v=>perturbMatrices(v.result).map(z=>[v.epsilon,...z]))),
  t("scan-vectors","每个扫描点的完整向量与投影",["参数ε","方向","对象","i","j","值"],d.study.flatMap(v=>perturbVectors(v.result).map(z=>[v.epsilon,...z])))
 ];
 const runs=[{t:1,current:true,result:p},...d.study.map(v=>({...v,current:false}))];
 return[
  t("summary","圆盘与对称谱计数",["量","值"],[["共同尺度",p.scale],["分离组数",p.groups.length],["严格对角占优",p.strictlyDominant],["由分离组确定的负特征值数",p.negativeCount],["由分离组确定的正特征值数",p.positiveCount],["Jacobi状态",stateNames[p.eig.status]],["旋转次数",p.eig.records.length],["本征基正交缺陷",p.eig.orthogonality],["相似误差",p.eig.similarity],["显式修正范数之和",p.eig.correctionBudget]]),
  t("input","完整三维矩阵",["对象","i","j","值"],entries({A:p.A,T:p.eig.T,Q:p.eig.Q})),
  t("disks","每一行圆盘与严格占优",["行i","圆心","半径","实轴下端","实轴上端","占优余量","严格占优"],p.disks.map((v,i)=>[i,v.center,v.radius,v.center-v.radius,v.center+v.radius,p.dominance[i].margin,p.dominance[i].strict])),
  t("edges","相切属于相连：二进制数精确比较",["圆盘i","圆盘j","浮点分离读数","精确分离符号","相连"],p.edges.map(v=>[v.i,v.j,v.separation,v.exactSign,v.connected])),
  t("groups","分离区域的定理计数",["组号","所含行","实轴下端","实轴上端","按代数重数的计数"],p.groups.map((v,i)=>[i,v.indices.join(","),v.lower,v.upper,v.theoremCount])),
  t("spectra","当前与全部同伦采样的实际谱",["当前参数","t","特征值i","值","残差范数","残差/向量范数","相交区域组"],runs.flatMap(v=>v.result.pairs.map((q,i)=>[v.current,v.t,i,q.value,q.residualNorm,q.radius,q.groups.join(",")]))),
  t("vectors","全部谱向量与实际残差",["当前参数","t","特征值i","坐标j","向量","残差"],runs.flatMap(v=>v.result.pairs.flatMap((q,i)=>q.v.map((x,j)=>[v.current,v.t,i,j,x,q.residual[j]])))),
  t("rotations","每个Jacobi旋转参数",["当前参数","t","步","p","q","非对角范数","阈值","tau","tan","cos","sin"],runs.flatMap(v=>v.result.eig.records.map(q=>[v.current,v.t,q.step,q.p,q.q,q.off,q.threshold,q.tau,q.t,q.c,q.s]))),
  t("rotation-matrices","全部旋转前后矩阵与截断修正",["当前参数","t","步","对象","i","j","值"],runs.flatMap(v=>v.result.eig.records.flatMap(q=>entries({before:q.before,Qbefore:q.Qbefore,J:q.J,raw:q.raw,correction:q.correction,after:q.after,Q:q.Q}).map(z=>[v.current,v.t,q.step,...z])))),
  t("homotopy-matrices","全部同伦矩阵、圆盘与基",["t","对象","i","j","值"],d.study.flatMap(v=>entries({A:v.result.A,T:v.result.eig.T,Q:v.result.eig.Q,disks:v.result.disks.map(q=>[q.center,q.radius])}).map(z=>[v.t,...z])))
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

 const STYLE=".matrix146{color:var(--fg,#273646)}.matrix146 .matrix-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}.matrix146 label{display:flex;flex-direction:column;gap:6px}.matrix146 input,.matrix146 select{font:inherit;padding:8px;max-width:100%;background:var(--bg,#fff);color:inherit;border:1px solid #8b98a0;border-radius:5px}.matrix146 button{font:inherit;padding:8px 12px;margin:5px;cursor:pointer}.matrix146 button[aria-pressed=true]{outline:3px solid #478aaa}.matrix146 .matrix-scroll{overflow:auto;max-width:100%;margin:16px 0}.matrix146 .matrix-scroll:focus{outline:3px solid #478aaa}.matrix146 .matrix-ledger{max-height:420px}.matrix146 svg{width:900px!important;max-width:none!important;display:block;fill:currentColor;font:16px system-ui}.matrix146 table{display:table;overflow:visible;width:max-content;max-width:none;min-width:900px;border-collapse:collapse;font-variant-numeric:tabular-nums}.matrix146 th,.matrix146 td{padding:9px;border:1px solid #98a4ab;text-align:left;white-space:nowrap}.matrix146 .matrix-error{color:#c74b39}.matrix146 [hidden]{display:none!important}.matrix146 fieldset{margin:16px 0;padding:12px}.matrix146 details{margin:16px 0}.matrix146 summary{cursor:pointer;font-weight:600}.matrix146 .matrix-legend{font-size:.95em}.matrix146 .matrix-note{line-height:1.7}.matrix146 [hidden]{display:none!important}.matrix146 select{font:inherit;color:var(--fg,#282820);background:var(--bg,#faf7ef);padding:8px;max-width:100%}";
 function mount(container){
  const doc=container.ownerDocument;
  if(!doc.getElementById("matrix146-style")){const style=doc.createElement("style");style.id="matrix146-style";style.textContent=STYLE;doc.head.appendChild(style);}
  const field=(key,label,modes)=>'<label data-modes="'+modes+'">'+label+'<input data-key="'+key+'" type="number" step="any"></label>';
  container.innerHTML='<div class="matrix146"><h3>矩阵变了，哪一种证据仍然可靠？</h3><p>先预测，再核对实际矩阵、每次运算和读数的条件。</p><div class="matrix-presets">'+PRESETS.map(p=>'<button type="button" data-preset="'+p.id+'">'+esc(p.label)+'</button>').join("")+'</div><div class="matrix-controls"><label>实验<select data-key="mode"><option value="transient">Jordan瞬态与Neumann和</option><option value="perturbation">对称谱与方向扰动</option><option value="gershgorin">Gershgorin圆盘与计数</option></select></label>'+
   field("r","Jordan对角r（−1.1–1.1）","transient")+field("g","剪切耦合g（−20–20）","transient")+field("k","观察窗口k（0–60整数）","transient")+field("theta","初始方向θ（−180–180度）","transient")+field("z","实探针z（0或0.1≤|z|≤2）","transient")+
   field("center","原谱中心（−2–2）","perturbation")+field("gap","要求的原谱隙（0–4）","perturbation")+field("axisAngle","原主轴角（−180–180度）","perturbation")+field("epsilon","要求的扰动幅度（0–2）","perturbation")+field("perturbAngle","扰动正方向角（−180–180度）","perturbation")+
   field("d1","第一行对角（−5–5整数）","gershgorin")+field("d2","第二行对角（−5–5整数）","gershgorin")+field("d3","第三行对角（−5–5整数）","gershgorin")+field("coupling","相邻耦合（−4–4）","gershgorin")+
   field("scaleExponent","共同尺度10的指数（−12–12整数）","perturbation gershgorin")+'</div>'+
   QUESTIONS.map((q,i)=>'<fieldset data-question="'+i+'"><legend>'+(i+1)+'. '+esc(q[0])+'</legend>'+q[1].map((v,j)=>'<button type="button" data-choice="'+j+'" aria-pressed="false">'+esc(v)+'</button>').join("")+'</fieldset>').join("")+
   '<button type="button" data-action="reveal">揭示图与完整账本</button><button type="button" data-action="reset">重置预测</button><p class="matrix-error" role="alert"></p><p role="status"></p><div class="matrix-results" hidden></div></div>';
  const fields=Array.from(container.querySelectorAll("[data-key]")),answers=Array(4).fill(null),result=container.querySelector(".matrix-results"),reveal=container.querySelector("[data-action=reveal]"),feedback=container.querySelector("[role=status]"),error=container.querySelector("[role=alert]");
  fields.forEach(e=>e.value=DEFAULTS[e.dataset.key]);
  let revealed=false,valid=null;
  function render(d){
   const notes={transient:"谱半径与g是否为0按实际输入严格区分，不把接近边界当成等号。窗口峰值只属于当前有限窗口。逐次乘法、闭式、Neumann每一项和实际余项均保留；逆不存在与级数不收敛不同。最小奇异值、实际构造的扰动和其残差不强制相等。",perturbation:"Weyl控制有序特征值的绝对变化。方向证据需要明确分离，重根时方向不唯一。要求的E与实际B−A分别列出；64u缓冲只是有限精度诊断，不是区间证书，分离不足时估计留空。扫描横轴改变扰动幅度，当前精确输入也加入网格。",gershgorin:"当前模型是三维实对称链，因此真实谱在实轴；圆盘仍按等单位复平面绘出。相切判为相连，分离关系对实际二进制圆心/半径作精确比较。Jacobi计算记录全部旋转、对称化与非对角截断修正；同伦网格展示现象，不替代连续参数的计数证明。"};
   result.innerHTML='<p>'+notes[d.config.mode]+'</p>'+
    plots(d).map(q=>'<p>'+q.series.filter((s,i,ss)=>ss.findIndex(t=>t.label===s.label&&t.color===s.color)===i).map(s=>esc(s.label)+'（'+({"#268bd2":"蓝","#cb6a16":"橙","#29966c":"绿","#9966bb":"紫","#b44a72":"玫红"}[s.color])+'）').join("；")+'</p><div class="matrix-scroll" role="region" tabindex="0" aria-label="'+esc(q.title)+'">'+svg(q)+'</div>').join("")+
    ledgers(d).map(t=>'<details data-ledger="'+t.key+'"'+(t.key==="summary"?' open':"")+'><summary>'+esc(t.title)+'（'+t.rows.length+' 行）</summary><div class="matrix-scroll matrix-ledger" role="region" tabindex="0" aria-label="'+esc(t.title)+'"><table data-table="'+t.key+'"><thead><tr>'+t.headers.map(x=>'<th scope="col">'+esc(x)+'</th>').join("")+'</tr></thead><tbody>'+t.rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(fmt(x))+'</td>').join("")+'</tr>').join("")+'</tbody></table></div></details>').join("")+
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
 ck(fmt(1e-15)!=="0"&&fmt(0)==="0","small display");
 ck(unit(90)[0]===0&&unit(180)[1]===0,"exact cardinal directions");
 let p=snapshot().result;ck(p.rho===.9&&p.final.envelope>1&&p.asymptotic==="decay","transient is compatible with decay");
 p=snapshot({r:0,k:4}).result;ck(p.rows[1].envelope===10&&p.rows[2].envelope===0,"actual nilpotence");
 p=snapshot({r:1-1e-13,g:1e-13}).result;ck(p.asymptotic==="decay"&&!p.normal,"strict boundary not epsilon");
 p=snapshot({z:.5,g:0}).result;ck(p.resolvent.status==="invertible"&&p.resolvent.neumann==="not-convergent","invertible not Neumann");
 p=snapshot({z:.9}).result;ck(p.resolvent.inverse===null&&p.resolvent.svd.min===0,"spectral singularity");
 p=snapshot({z:0}).result;ck(p.rows.every(r=>r.sum===null)&&p.resolvent.status==="invertible","undefined sum separate");
 p=snapshot({mode:"perturbation",gap:0}).result;ck(p.comparisons.every(r=>r.sinAngle===null),"multiple direction undefined");
 p=snapshot({mode:"perturbation",gap:1e-15,epsilon:1e-15}).result;ck(p.comparisons.every(r=>r.bound===null),"precision unresolved");
 p=snapshot({mode:"gershgorin"}).result;ck(p.disks[2].radius===1&&p.negativeCount===1&&p.positiveCount===2,"correct Gershgorin example");
 ck(exactSignSum([1,-.5,-.5])===0&&exactSignSum([1,-.5,-.5000000000000001])<0,"exact disk contact");
 return{status:"PASS",checks};
}
return{DEFAULTS,PRESETS,QUESTIONS,num,config,snapshot,norm,dot,mv,tr,mm,sub,msub,madd,mul,fro,eye,unit,triangularSVD,jordanPower,transient,symEig2,symmetricFrom,perturbation,exactSignSum,jacobi3,gershgorin,fmt,plots,ledgers,svg,mount,selfTest};
});
