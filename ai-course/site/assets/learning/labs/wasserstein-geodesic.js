(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root&&root.CourseLearning)root.CourseLearning.register('wasserstein-geodesic',api.mount);})(typeof window!=='undefined'?window:globalThis,function(){
"use strict";
const abs=n=>n<0n?-n:n;
function gcd(a,b){a=abs(a);b=abs(b);while(b){const t=a%b;a=b;b=t;}return a;}
function rat(n,d=1n){if(d===0n)throw Error('分母为零');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return{n:n/g,d:d/g};}
const ZERO=rat(0n),ONE=rat(1n),add=(a,b)=>rat(a.n*b.d+b.n*a.d,a.d*b.d),sub=(a,b)=>rat(a.n*b.d-b.n*a.d,a.d*b.d),mul=(a,b)=>rat(a.n*b.n,a.d*b.d),div=(a,b)=>rat(a.n*b.d,a.d*b.n),cmp=(a,b)=>a.n*b.d-b.n*a.d,neg=a=>rat(-a.n,a.d),ar=a=>rat(abs(a.n),a.d),sum=xs=>xs.reduce(add,ZERO),key=a=>a.n+'/'+a.d;
const pack=q=>({numerator:String(q.n),denominator:String(q.d),value:Number(q.n)/Number(q.d)});
function decimal(value,label,lo=-1000000,hi=1000000){if(typeof value!=='string'&&typeof value!=='number')throw Error(label+'须为十进制数');const s=String(value).trim();if(!/^-?(?:\d+(?:\.\d{1,6})?|\.\d{1,6})$/.test(s))throw Error(label+'须为最多6位小数（不接受指数记法）');const x=Number(s);if(!Number.isFinite(x)||x<lo||x>hi)throw Error(label+'超出范围');const v=s.replace('-','').split('.'),d=10n**BigInt((v[1]||'').length),n=BigInt(v[0]||'0')*d+BigInt(v[1]||'0');return rat(s[0]==='-'?-n:n,d);}
function list(value,label,lo=-1000000,hi=1000000){if(typeof value!=='string'||value.length>512)throw Error(label+'须为逗号分隔列表');const xs=value.split(',');if(xs.length<1||xs.length>4)throw Error(label+'需要1–4项');return xs.map(x=>decimal(x,label,lo,hi));}
function matrix(value,label,m,n,lo=-1000000,hi=1000000){if(typeof value!=='string'||value.length>2048)throw Error(label+'须为分号分行、逗号分列');const rows=value.split(';').map(x=>list(x,label,lo,hi));if(rows.length!==m||rows.some(row=>row.length!==n))throw Error(label+'形状与边缘不一致');return rows;}
const sq=q=>mul(q,q),half=rat(1n,2n),lerp=(x,y,t)=>add(x,mul(t,sub(y,x)));
const DEFAULTS={mode:'atomic',a:'1',x:'0',b:'0.35,0.65',y:'-2,2',thirdMass:'0.5,0.5',thirdX:'0,4',weights:'0.25,0.25,0.5',candidateMass:'1',candidateX:'1',s:'0.25',t:'0.5',sourcePoints:'-1,0;1,0',targetPoints:'0,-1;0,1',pairing:'direct',sourceMean:'0,0',targetMean:'1,-1',sourceCov:'4,1;1,1',targetCov:'1,-0.5;-0.5,2'};
function probability(v,name){const a=list(v,name,0,1);if(cmp(sum(a),ONE)!==0n)throw Error(name+'必须精确合计为1，不自动归一化');return a;}
function atoms(masses,positions,name){const a=probability(masses,name+'质量'),x=list(positions,name+'位置',-1000,1000);if(a.length!==x.length)throw Error(name+'位置与质量数不符');if(new Set(x.map(key)).size!==x.length)throw Error(name+'重复位置请先合并');return x.map((x,i)=>({x,mass:a[i]}));}
function vec2(value,name){const x=list(value,name,-1000,1000);if(x.length!==2)throw Error(name+'需要两坐标');return x;}
function pair(value,name){const P=matrix(value,name,2,2,-1000,1000);if(P[0].every((q,k)=>cmp(q,P[1][k])===0n))throw Error(name+'两点须不同');return P;}
function covariance(value,name,source){const M=matrix(value,name,2,2,-100,100);if(cmp(M[0][1],M[1][0])!==0n)throw Error(name+'必须对称');const determinant=sub(mul(M[0][0],M[1][1]),sq(M[0][1])),trace=add(M[0][0],M[1][1]);if(M[0][0].n<0n||M[1][1].n<0n||determinant.n<0n)throw Error(name+'必须半正定');if(source&&(trace.n===0n||cmp(determinant,mul(rat(1n,10000n),trace))<0n))throw Error('源协方差须正定且det/trace至少0.0001');return M;}
function config(raw={}){if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('参数需要对象');const c={...DEFAULTS,...raw};if(!['atomic','barycenter','plane','gaussian'].includes(c.mode))throw Error('未知实验');decimal(c.s,'比较时刻',0,1);decimal(c.t,'当前时刻',0,1);
 if(c.mode==='atomic'||c.mode==='barycenter'){atoms(c.a,c.x,'源');atoms(c.b,c.y,'目标');}
 if(c.mode==='barycenter'){atoms(c.thirdMass,c.thirdX,'第三分布');atoms(c.candidateMass,c.candidateX,'候选分布');if(probability(c.weights,'重心权重').length!==3)throw Error('需三个权重');}
 if(c.mode==='plane'){pair(c.sourcePoints,'源点');pair(c.targetPoints,'目标点');if(!['direct','cross'].includes(c.pairing))throw Error('未知配对');}
 if(c.mode==='gaussian'){vec2(c.sourceMean,'源均值');vec2(c.targetMean,'目标均值');covariance(c.sourceCov,'源协方差',true);covariance(c.targetCov,'目标协方差',false);}
 return c;}
function merge(A){const by=new Map();for(const v of A){if(v.mass.n===0n)continue;const k=key(v.x);if(by.has(k))by.get(k).mass=add(by.get(k).mass,v.mass);else by.set(k,{x:v.x,mass:v.mass});}return[...by.values()].sort((a,b)=>cmp(a.x,b.x)<0n?-1:1);}
function segments(A){let u=ZERO;return merge(A).map(v=>{const start=u;u=add(u,v.mass);return{...v,start,end:u};});}
function joinQuantiles(distributions){const all=distributions.map(segments),ends=new Map([[key(ZERO),ZERO],[key(ONE),ONE]]);for(const ds of all)for(const z of ds)ends.set(key(z.end),z.end);const grid=[...ends.values()].sort((a,b)=>cmp(a,b)<0n?-1:1);return grid.slice(0,-1).map((left,k)=>{const right=grid[k+1],positions=all.map(ds=>ds.find(z=>cmp(z.start,left)<=0n&&cmp(z.end,left)>0n).x);return{left,right,mass:sub(right,left),positions};});}
function distance2(A,B){return sum(joinQuantiles([A,B]).map(z=>mul(z.mass,sq(sub(z.positions[0],z.positions[1])))));}
const pAtoms=A=>A.map(z=>({position:pack(z.x),mass:pack(z.mass)}));
function stats(A){const mean=sum(A.map(z=>mul(z.mass,z.x))),second=sum(A.map(z=>mul(z.mass,sq(z.x))));return{mass:pack(sum(A.map(z=>z.mass))),mean:pack(mean),secondMoment:pack(second),variance:pack(sub(second,sq(mean)))};}
function times(c){const xs=Array.from({length:21},(_,i)=>rat(BigInt(i),20n)).concat([decimal(c.s,'s'),decimal(c.t,'t')]),m=new Map(xs.map(z=>[key(z),z]));return[...m.values()].sort((a,b)=>cmp(a,b)<0n?-1:1);}
function atomic(c){const A=atoms(c.a,c.x,'源'),B=atoms(c.b,c.y,'目标'),rows=joinQuantiles([A,B]),D=distance2(A,B),s=decimal(c.s,'s'),t=decimal(c.t,'t');
 const displacement=v=>merge(rows.map(z=>({x:lerp(...z.positions,v),mass:z.mass}))),mixture=v=>merge(A.map(z=>({x:z.x,mass:mul(sub(ONE,v),z.mass)})).concat(B.map(z=>({x:z.x,mass:mul(v,z.mass)})))),S=displacement(s),T=displacement(t),M=mixture(t);
 const timeRows=times(c).map(u=>{const U=displacement(u),V=mixture(u),start=distance2(A,U),end=distance2(U,B),expectedStart=mul(sq(u),D),expectedEnd=mul(sq(sub(ONE,u)),D);if(cmp(start,expectedStart)!==0n||cmp(end,expectedEnd)!==0n)throw Error('精确匀速未闭合');return{time:pack(u),displacement:pAtoms(U),mixture:pAtoms(V),startSquared:pack(start),endSquared:pack(end),expectedStartSquared:pack(expectedStart),expectedEndSquared:pack(expectedEnd),mixtureStartSquared:pack(distance2(A,V)),mixtureEndSquared:pack(distance2(V,B)),displacementStats:stats(U),mixtureStats:stats(V)};});
 const st=distance2(S,T),bound=mul(sq(sub(t,s)),D);if(cmp(st,bound)!==0n)throw Error('中间时刻距离未闭合');return{source:pAtoms(merge(A)),target:pAtoms(merge(B)),quantiles:rows.map((z,k)=>({k,left:pack(z.left),right:pack(z.right),mass:pack(z.mass),x:pack(z.positions[0]),y:pack(z.positions[1]),velocity:pack(sub(z.positions[1],z.positions[0])),atS:pack(lerp(...z.positions,s)),atT:pack(lerp(...z.positions,t)),cost:pack(mul(z.mass,sq(sub(z.positions[1],z.positions[0]))))})),distanceSquared:pack(D),distanceApproximation:Math.sqrt(pack(D).value),atS:pAtoms(S),displacement:pAtoms(T),mixture:pAtoms(M),betweenSquared:pack(st),expectedBetweenSquared:pack(bound),sameDistribution:D.n===0n,timeRows};}
function barycenter(c){const ds=[atoms(c.a,c.x,'第一'),atoms(c.b,c.y,'第二'),atoms(c.thirdMass,c.thirdX,'第三')],w=probability(c.weights,'权重'),candidate=atoms(c.candidateMass,c.candidateX,'候选'),rows=joinQuantiles(ds),bar=merge(rows.map(z=>({x:sum(z.positions.map((x,k)=>mul(w[k],x))),mass:z.mass}))),optimalCosts=ds.map(D=>distance2(D,bar)),candidateCosts=ds.map(D=>distance2(D,candidate)),objective=sum(optimalCosts.map((x,k)=>mul(w[k],x))),candidateObjective=sum(candidateCosts.map((x,k)=>mul(w[k],x))),gap=sub(candidateObjective,objective),distance=distance2(candidate,bar);
 if(cmp(gap,distance)!==0n)throw Error('重心方差恒等式未闭合');return{distributions:ds.map(D=>pAtoms(merge(D))),weights:w.map(pack),candidate:pAtoms(merge(candidate)),barycenter:pAtoms(bar),quantiles:rows.map((z,k)=>{const q=sum(z.positions.map((x,k)=>mul(w[k],x)));return{k,left:pack(z.left),right:pack(z.right),mass:pack(z.mass),positions:z.positions.map(pack),barycenterPosition:pack(q),weightedVariance:pack(sum(z.positions.map((x,k)=>mul(w[k],sq(sub(x,q))))))};}),costRows:ds.map((D,k)=>({k,weight:pack(w[k]),optimalCost:pack(optimalCosts[k]),candidateCost:pack(candidateCosts[k]),optimalContribution:pack(mul(w[k],optimalCosts[k])),candidateContribution:pack(mul(w[k],candidateCosts[k]))})),objective:pack(objective),candidateObjective:pack(candidateObjective),gap:pack(gap),candidateDistanceSquared:pack(distance),certifiedOptimal:gap.n===0n,barycenterStats:stats(bar),candidateStats:stats(candidate)};}
const dot=(v,w)=>sum(v.map((z,k)=>mul(z,w[k]))),vectorDiff=(v,w)=>v.map((z,k)=>sub(z,w[k])),planeCost=(X,Y,p)=>mul(half,sum(X.map((v,i)=>dot(vectorDiff(v,Y[p[i]]),vectorDiff(v,Y[p[i]]))))),pointPack=P=>P.map(v=>v.map(pack));
function planeDistance(X,Y){const a=planeCost(X,Y,[0,1]),b=planeCost(X,Y,[1,0]);return cmp(a,b)<=0n?a:b;}
function plane(c){const X=pair(c.sourcePoints,'源'),Y=pair(c.targetPoints,'目标'),perms=[[0,1],[1,0]],costs=perms.map(p=>planeCost(X,Y,p)),best=cmp(costs[0],costs[1])<=0n?0:1,selected=c.pairing==='direct'?0:1,D=costs[best],C=costs[selected],at=(v,index=selected)=>X.map((x,i)=>x.map((q,k)=>lerp(q,Y[perms[index][i]][k],v))),s=decimal(c.s,'s'),t=decimal(c.t,'t'),S=at(s),T=at(t);
 return{source:pointPack(X),target:pointPack(Y),massPerLabel:pack(half),assignments:perms.map((p,k)=>({k,permutation:p,cost:pack(costs[k]),optimal:cmp(costs[k],D)===0n})),selected,optimalAssignments:costs.filter(v=>cmp(v,D)===0n).length,selectedOptimal:cmp(C,D)===0n,distanceSquared:pack(D),selectedCost:pack(C),excessCost:pack(sub(C,D)),atS:pointPack(S),atT:pointPack(T),alternativeAtT:pointPack(at(t,1-selected)),betweenSquared:pack(planeDistance(S,T)),particleBoundSquared:pack(mul(sq(sub(t,s)),C)),timeRows:times(c).map(v=>({time:pack(v),positions:pointPack(at(v)),alternativePositions:pointPack(at(v,1-selected)),startSquared:pack(planeDistance(X,at(v))),endSquared:pack(planeDistance(at(v),Y)),optimalSpeedStartSquared:pack(mul(sq(v),D)),optimalSpeedEndSquared:pack(mul(sq(sub(ONE,v)),D)),particleStartBoundSquared:pack(mul(sq(v),C)),particleEndBoundSquared:pack(mul(sq(sub(ONE,v)),C))}))};}
const I=[[1,0],[0,1]],num=M=>M.map(row=>row.map(q=>pack(q).value)),mm=(A,B)=>A.map(row=>B[0].map((_,j)=>row.reduce((s,v,k)=>s+v*B[k][j],0))),mt=A=>A[0].map((_,j)=>A.map(row=>row[j])),ma=(A,B)=>A.map((row,i)=>row.map((v,j)=>v+B[i][j])),ms=(A,k)=>A.map(row=>row.map(v=>v*k)),tr=A=>A[0][0]+A[1][1],det=A=>A[0][0]*A[1][1]-A[0][1]*A[1][0],norm=A=>Math.sqrt(A.flat().reduce((s,v)=>s+v*v,0)),sym=A=>[[A[0][0],(A[0][1]+A[1][0])/2],[(A[0][1]+A[1][0])/2,A[1][1]]];
function sqrtPSD(A,knownDeterminant){const d=knownDeterminant===undefined?det(A):knownDeterminant,scale=Math.max(1,norm(A)**2);if(d< -1e-12*scale)throw Error('平方根遇到数值非半正定');const z=Math.sqrt(Math.max(0,d)),den=Math.sqrt(Math.max(0,tr(A)+2*z));if(den===0)return[[0,0],[0,0]];return ms(ma(A,ms(I,z)),1/den);}
function inverse(A){const d=det(A);return[[A[1][1]/d,-A[0][1]/d],[-A[1][0]/d,A[0][0]/d]];}
function gaussian(c){const sourceQ=covariance(c.sourceCov,'源协方差',true),targetQ=covariance(c.targetCov,'目标协方差',false),qdet=M=>sub(mul(M[0][0],M[1][1]),sq(M[0][1])),S0=num(sourceQ),S1=num(targetQ),m0=vec2(c.sourceMean,'源均值').map(q=>pack(q).value),m1=vec2(c.targetMean,'目标均值').map(q=>pack(q).value),R=sqrtPSD(S0,pack(qdet(sourceQ)).value),Ri=inverse(R),H=sym(mm(mm(R,S1),R)),B=sqrtPSD(H,pack(mul(qdet(sourceQ),qdet(targetQ))).value),computedMap=sym(mm(mm(Ri,B),Ri)),identicalCovariance=sourceQ.every((row,i)=>row.every((q,j)=>cmp(q,targetQ[i][j])===0n)),A=identicalCovariance?I:computedMap,E=ma(A,ms(I,-1)),energy=norm(mm(E,R))**2,meanCost=m0.reduce((v,x,k)=>v+(m1[k]-x)**2,0),D=energy+meanCost,traceCost=meanCost+tr(S0)+tr(S1)-2*tr(B),s=Number(c.s),t=Number(c.t);
 function at(u){const M=ma(ms(I,1-u),ms(A,u)),cov=sym(mm(mm(M,S0),mt(M))),mean=m0.map((v,k)=>(1-u)*v+u*m1[k]);return{mean,covariance:cov,map:M,trace:tr(cov),determinant:det(cov)};}
 const diagnostics={identityMapResidual:identicalCovariance?norm(ma(computedMap,ms(I,-1))):null,mapSymmetry:norm(ma(A,ms(mt(A),-1))),pushforwardResidual:norm(ma(mm(mm(A,S0),mt(A)),ms(S1,-1))),sourceRootResidual:norm(ma(mm(R,R),ms(S0,-1))),middleRootResidual:norm(ma(mm(B,B),ms(H,-1))),traceCostResidual:traceCost-D,sourceDeterminant:det(S0),targetDeterminant:det(S1),sourceDetOverTrace:det(S0)/tr(S0)};
 const timeRows=times(c).map(q=>{const time=pack(q).value,z=at(time);return{time,...z,startSquared:time*time*D,endSquared:(1-time)**2*D,covarianceLinearBlend:ma(ms(S0,1-time),ms(S1,time))};});
 return{identicalCovariance,sourceMean:m0,targetMean:m1,sourceCovariance:S0,targetCovariance:S1,sourceRoot:R,sourceInverseRoot:Ri,middle:H,middleRoot:B,map:A,mapOffset:m1.map((v,k)=>v-A[k].reduce((s,w,j)=>s+w*m0[j],0)),meanCost,covarianceCost:energy,distanceSquared:D,distanceApproximation:Math.sqrt(D),traceFormulaValue:traceCost,atS:at(s),atT:at(t),betweenSquared:(t-s)**2*D,diagnostics,timeRows};}
function snapshot(raw={}){const c=config(raw),result=({atomic,barycenter,plane,gaussian})[c.mode](c);return{schema:1,parameters:c,result};}
const PRESETS=[
 {id:'split',label:'一原子拆分',values:{}},
 {id:'shift',label:'整体平移三峰',values:{a:'0.25,0.5,0.25',x:'-2,0,2',b:'0.25,0.5,0.25',y:'-1,1,3'}},
 {id:'merge',label:'两峰汇成一点',values:{a:'0.5,0.5',x:'-2,2',b:'1',y:'0'}},
 {id:'same',label:'零距离常值路径',values:{a:'0.4,0.6',x:'-1,1.5',b:'0.4,0.6',y:'-1,1.5',t:'0.37'}},
 {id:'atomic',label:'拆分与汇合共存',values:{a:'0.4,0.6',x:'-2,1',b:'0.2,0.3,0.5',y:'-1,0,3'}},
 {id:'zero',label:'零质量标签',values:{a:'0,1',x:'-100,0',b:'0.35,0.65',y:'-2,2'}},
 {id:'tiny',label:'百万分之一质量',values:{a:'0.000001,0.999999',x:'-1,1',b:'0.999999,0.000001',y:'-1,1',t:'0.000001'}},
 {id:'endpoints',label:'倒序比较端点',values:{s:'1',t:'0'}},
 {id:'barycenter',label:'三分布重心',values:{mode:'barycenter'}},
 {id:'bary-shift',label:'三个平移点的平均',values:{mode:'barycenter',a:'1',x:'0',b:'1',y:'2',thirdMass:'1',thirdX:'4',candidateMass:'1',candidateX:'2'}},
 {id:'bary-edge',label:'权重全给第二份',values:{mode:'barycenter',weights:'0,1,0',candidateMass:'0.35,0.65',candidateX:'-2,2'}},
 {id:'bary-zero',label:'零权重也保留记录',values:{mode:'barycenter',weights:'0.5,0.5,0'}},
 {id:'bary-correct',label:'提交精确重心',values:{mode:'barycenter',a:'1',x:'0',b:'1',y:'2',thirdMass:'1',thirdX:'4',candidateMass:'1',candidateX:'2.5'}},
 {id:'bary-grid',label:'四原子网格错开',values:{mode:'barycenter',a:'0.1,0.2,0.3,0.4',x:'-3,-1,1,4',b:'0.4,0.3,0.2,0.1',y:'-4,0,2,5',thirdMass:'0.25,0.25,0.25,0.25',thirdX:'-2,1,3,6',weights:'0.000001,0.499999,0.5'}},
 {id:'plane-direct',label:'正交两点：第一条最短路',values:{mode:'plane'}},
 {id:'plane-cross',label:'同样端点：另一条最短路',values:{mode:'plane',pairing:'cross'}},
 {id:'plane-unique',label:'平移时选择正确配对',values:{mode:'plane',targetPoints:'0,0;2,0'}},
 {id:'plane-bad',label:'相同端点却来回搬运',values:{mode:'plane',targetPoints:'-1,0;1,0',pairing:'cross'}},
 {id:'plane-near',label:'很接近也不是成本平局',values:{mode:'plane',targetPoints:'0,-1;0.000001,1',pairing:'cross'}},
 {id:'plane-collapse',label:'错误配对在中点汇合',values:{mode:'plane',targetPoints:'-1,0;1,0',pairing:'cross',s:'0.25',t:'0.75'}},
 {id:'gaussian',label:'不交换的协方差',values:{mode:'gaussian'}},
 {id:'gaussian-diagonal',label:'对角缩放可手算',values:{mode:'gaussian',sourceCov:'1,0;0,4',targetCov:'4,0;0,1',targetMean:'0,0'}},
 {id:'gaussian-same',label:'相同高斯分布',values:{mode:'gaussian',targetCov:'4,1;1,1',targetMean:'0,0'}},
 {id:'gaussian-shift',label:'高斯仅平移',values:{mode:'gaussian',targetCov:'4,1;1,1',targetMean:'3,4'}},
 {id:'gaussian-rank',label:'目标压到一条线',values:{mode:'gaussian',targetCov:'1,1;1,1'}},
 {id:'gaussian-zero',label:'目标压成一点',values:{mode:'gaussian',targetCov:'0,0;0,0'}},
 {id:'gaussian-conditioned',label:'允许的扁长源',values:{mode:'gaussian',sourceCov:'100,0;0,0.0002',targetCov:'2,1;1,1'}},
 {id:'gaussian-near',label:'协方差仅差百万分之一',values:{mode:'gaussian',sourceCov:'1,0;0,1',targetCov:'1.000001,0;0,1',targetMean:'0,0'}},
 {id:'gaussian-end',label:'奇异目标端点',values:{mode:'gaussian',targetCov:'1,1;1,1',t:'1',s:'0'}},
 {id:'gaussian-reverse',label:'倒序比较高斯时刻',values:{mode:'gaussian',s:'1',t:'0'}}
];
const QUESTIONS=[
 ['粒子沿直线运动，就一定给出最短分布路径吗？',['还要核对配对是否最优','直线已经足够']],
 ['平方Wasserstein重心在一维怎样计算？',['平均共同分位数','平均每个位置的概率质量']],
 ['Brenier定理的绝对连续条件放在哪一端？',['源测度','只要求目标有密度']],
 ['高斯协方差沿W2测地线怎样变化？',['由最优仿射映射推前，通常不是直接平均','始终是两协方差的算术平均']]
].map(q=>[q[0],q[1],0]);
const BLUE='#268bd2',ORANGE='#cb6a16',GREEN='#29966c',VIOLET='#9966bb',ROSE='#b44a72';
const series=(key,label,color,points,line=true)=>({key,label,color,points,line});
function chart(title,x,y,ss,range=null,discrete=false,square=false){const xx=ss.flatMap(s=>s.points.map(z=>z[0])),yy=ss.flatMap(s=>s.points.map(z=>z[1]));let xmin=range?range[0]:Math.min(0,...xx),xmax=range?range[1]:Math.max(0,...xx),ymin=Math.min(0,...yy),ymax=Math.max(0,...yy);if(xmax===xmin)xmax=xmin+1;const pad=(ymax-ymin||1)*.08;ymin-=pad;ymax+=pad;
 if(square){const lo=Math.min(xmin,ymin),hi=Math.max(xmax,ymax),pad=(hi-lo)*.08;xmin=ymin=lo-pad;xmax=ymax=hi+pad;}
 return{type:'chart',title,x,y,series:ss,xmin,xmax,ymin,ymax,square,markers:[],xTicks:[...new Set(Array.from({length:square?3:5},(_,i)=>{const v=xmin+(xmax-xmin)*i/(square?2:4);return discrete?Math.round(v):v;}))]};}
const step=(rows,value)=>rows.flatMap(z=>[[z.left.value,value(z)],[z.right.value,value(z)]]),atomPoints=A=>A.map(z=>[z.position.value,z.mass.value]),planePoints=P=>P.map(v=>v.map(q=>q.value));
function plots(d){const c=d.parameters,r=d.result;
 if(c.mode==='atomic')return[
  chart('共同分位数沿直线变化','累计概率u','蓝源、橙目标、绿当前位置',[series('source','源分位数',BLUE,step(r.quantiles,z=>z.x.value)),series('target','目标分位数',ORANGE,step(r.quantiles,z=>z.y.value)),series('current','当前分位数',GREEN,step(r.quantiles,z=>z.atT.value))],[0,1]),
  chart('当前位移分布：点高就是质量','实际位置x','离散质量，不是概率密度',[series('displacement','位移原子质量',GREEN,atomPoints(r.displacement),false)]),
  chart('当前混合分布：保留端点位置','实际位置x','离散质量，不是概率密度',[series('mixture','混合原子质量',VIOLET,atomPoints(r.mixture),false)]),
  chart('重新求运输距离，再核对常速','时间t','到源的距离平方；绿线与蓝线应重合',[series('actual','位移的实际W2平方',BLUE,r.timeRows.map(z=>[z.time.value,z.startSquared.value])),series('expected','t平方乘端点成本',GREEN,r.timeRows.map(z=>[z.time.value,z.expectedStartSquared.value])),series('mixture','混合的实际W2平方',VIOLET,r.timeRows.map(z=>[z.time.value,z.mixtureStartSquared.value]))],[0,1])
 ];
 if(c.mode==='barycenter')return[
  chart('平均共同分位数得到重心','累计概率u','蓝、橙、绿为三输入，紫为重心',[...[[0,BLUE],[1,ORANGE],[2,GREEN]].map(([i,color])=>series('input'+i,'第'+(i+1)+'份分位数',color,step(r.quantiles,z=>z.positions[i].value))),series('barycenter','重心分位数',VIOLET,step(r.quantiles,z=>z.barycenterPosition.value))],[0,1]),
  chart('重心与提交的候选分布','实际位置x','点高为质量；同位置可能重叠',[series('barycenter','重心原子',VIOLET,atomPoints(r.barycenter),false),series('candidate','候选原子',ORANGE,atomPoints(r.candidate),false)]),
  chart('每份输入对目标的加权贡献','输入分布编号','成本已乘以重心权重',[series('optimal','最优贡献',GREEN,r.costRows.map(z=>[z.k,z.optimalContribution.value]),false),series('candidate','候选贡献',ORANGE,r.costRows.map(z=>[z.k,z.candidateContribution.value]),false)],[0,2],true),
  chart('逐段加权方差：积分是最优目标','累计概率u','横段高度为加权平方差，宽度为质量',[series('variance','逐段加权方差',BLUE,step(r.quantiles,z=>z.weightedVariance.value))],[0,1])
 ];
 if(c.mode==='plane'){
  const X=planePoints(r.source),Y=planePoints(r.target),selected=r.assignments[r.selected].permutation,alt=r.assignments[1-r.selected].permutation;
  const scene=(p,current,title)=>chart(title,'第一坐标x','第二坐标y；两轴同尺度',[...X.map((v,i)=>series('trajectory'+i,'粒子'+i+'路线',i?ORANGE:BLUE,[v,Y[p[i]]])),series('current','当前两粒子，各质量1/2',GREEN,planePoints(current),false)],null,false,true);
  return[scene(selected,r.atT,'所选配对的两条粒子路线'),scene(alt,r.alternativeAtT,'另一配对产生的中间分布'),chart('两个置换端点决定精确最优值','0=直接；1=交叉','成本，不是距离',[series('costs','置换成本',BLUE,r.assignments.map(z=>[z.k,z.cost.value]),false),series('minimum','全局最小成本',GREEN,[[0,r.distanceSquared.value],[1,r.distanceSquared.value]])],[0,1],true),chart('粒子成本上界与实际分布距离','时间t','到源的距离平方；错误配对可不取等',[series('actual','实际W2平方',BLUE,r.timeRows.map(z=>[z.time.value,z.startSquared.value])),series('optimal','最短路应有的t平方D平方',GREEN,r.timeRows.map(z=>[z.time.value,z.optimalSpeedStartSquared.value])),series('bound','固定标签粒子成本上界',ORANGE,r.timeRows.map(z=>[z.time.value,z.particleStartBoundSquared.value]))],[0,1])];
 }
 const ellipse=(mean,L)=>Array.from({length:65},(_,k)=>{const theta=2*Math.PI*k/64,v=[Math.cos(theta),Math.sin(theta)];return mean.map((q,i)=>q+L[i].reduce((s,x,j)=>s+x*v[j],0));}),target=covariance(c.targetCov,'目标',false),td=pack(sub(mul(target[0][0],target[1][1]),sq(target[0][1]))).value;
 return[
  chart('高斯协方差轮廓：并非分布的边界','第一坐标x','第二坐标y；轮廓参数半径1',[series('source','源协方差轮廓',BLUE,ellipse(r.sourceMean,r.sourceRoot)),series('target','目标协方差轮廓',ORANGE,ellipse(r.targetMean,sqrtPSD(r.targetCovariance,td))),series('current','当前协方差轮廓',GREEN,ellipse(r.atT.mean,mm(r.atT.map,r.sourceRoot)))],null,false,true),
  chart('最优线性部分A：两列的作用','第一坐标x','第二坐标y；仿射偏移另见账本',[series('column0','A作用于第一基向量',BLUE,[[0,0],[r.map[0][0],r.map[1][0]]]),series('column1','A作用于第二基向量',ORANGE,[[0,0],[r.map[0][1],r.map[1][1]]])],null,false,true),
  chart('协方差推前通常不是算术平均','时间t','迹：两方向方差之和',[series('geodesic','位移协方差迹',GREEN,r.timeRows.map(z=>[z.time,z.trace])),series('linear','协方差线性混合迹',ORANGE,r.timeRows.map(z=>[z.time,tr(z.covarianceLinearBlend)]))],[0,1]),
  chart('高斯常速公式的两端距离','时间t','按已证明测地线公式计算距离平方',[series('start','到源W2平方',BLUE,r.timeRows.map(z=>[z.time,z.startSquared])),series('end','到目标W2平方',ORANGE,r.timeRows.map(z=>[z.time,z.endSquared]))],[0,1])
 ];
}
const WORDS={numerator:'分子',denominator:'分母',value:'近似值',source:'源原子',target:'目标原子',position:'位置',mass:'质量',left:'u左端点',right:'u右端点',x:'源位置',y:'目标位置',k:'编号',velocity:'粒子速度',atS:'比较时刻的对象',atT:'当前时刻的对象',cost:'平方成本',distanceSquared:'端点W2平方',distanceApproximation:'端点W2近似值',displacement:'当前位移分布',mixture:'当前混合分布',betweenSquared:'两时刻W2平方',expectedBetweenSquared:'常速公式的平方距离',sameDistribution:'两端分布完全相同',time:'时间',startSquared:'到源W2平方',endSquared:'到目标W2平方',expectedStartSquared:'t平方乘端点成本',expectedEndSquared:'1减t的平方乘端点成本',mixtureStartSquared:'混合到源W2平方',mixtureEndSquared:'混合到目标W2平方',displacementStats:'位移统计量',mixtureStats:'混合统计量',mean:'均值',secondMoment:'二阶矩',variance:'方差',distributions:'全部输入分布',weights:'重心权重',candidate:'候选分布',barycenter:'重心分布',positions:'所有位置',barycenterPosition:'重心分位数位置',weightedVariance:'逐段加权方差',weight:'重心权重',optimalCost:'到重心成本',candidateCost:'到候选成本',optimalContribution:'重心加权成本',candidateContribution:'候选加权成本',objective:'最优目标',candidateObjective:'候选目标',gap:'目标差',candidateDistanceSquared:'候选到重心W2平方',certifiedOptimal:'候选精确最优',barycenterStats:'重心统计量',candidateStats:'候选统计量',massPerLabel:'每个粒子质量',permutation:'置换配对',optimal:'该置换最优',selected:'选中置换编号',optimalAssignments:'最优置换个数',selectedOptimal:'选中配对是否最优',selectedCost:'选中配对成本',excessCost:'选中成本减最优成本',alternativeAtT:'另一配对当前时刻',particleBoundSquared:'固定标签两时刻成本上界',alternativePositions:'另一配对位置',optimalSpeedStartSquared:'最短路到源平方距离',optimalSpeedEndSquared:'最短路到目标平方距离',particleStartBoundSquared:'固定标签到源成本上界',particleEndBoundSquared:'固定标签到目标成本上界',identicalCovariance:'输入协方差精确相同',sourceMean:'源均值',targetMean:'目标均值',sourceCovariance:'源协方差',targetCovariance:'目标协方差',sourceRoot:'源主平方根',sourceInverseRoot:'源平方根的逆',middle:'中间矩阵',middleRoot:'中间矩阵主平方根',map:'线性映射矩阵',mapOffset:'仿射偏移',meanCost:'均值位移成本',covarianceCost:'协方差位移成本',traceFormulaValue:'迹公式数值',covariance:'协方差',trace:'迹',determinant:'行列式',covarianceLinearBlend:'算术平均协方差',identityMapResidual:'通用公式偏离恒等映射的残差',mapSymmetry:'映射不对称残差',pushforwardResidual:'协方差推前残差',sourceRootResidual:'源平方根残差',middleRootResidual:'中间平方根残差',traceCostResidual:'迹公式减平方范数成本',sourceDeterminant:'源行列式',targetDeterminant:'目标行列式',sourceDetOverTrace:'源行列式除以迹'};
function fmt(v){if(v===null||v===undefined)return'—';if(typeof v==='boolean')return v?'是':'否';if(typeof v==='number'){if(!Number.isFinite(v))throw Error('非有限值');return v===0?'0':Math.abs(v)<1e-4||Math.abs(v)>=1e6?v.toExponential(8):String(Number(v.toPrecision(10)));}if(typeof v==='object')return Array.isArray(v)?'['+v.map(fmt).join('；')+']':Object.entries(v).map(([k,z])=>(WORDS[k]||k)+'='+fmt(z)).join('；');return WORDS[v]||String(v);}
function summaryTable(key,title,r,exclude=[]){return{key,title,headers:['量','完整记录'],rows:Object.entries(r).filter(([k])=>!exclude.includes(k)).map(([k,v])=>[WORDS[k]||k,v])};}
function recordTable(key,title,rows){const keys=rows.length?Object.keys(rows[0]):[];return{key,title,headers:keys.map(k=>WORDS[k]||k),rows:rows.map(z=>keys.map(k=>z[k]))};}
function ledgers(d){const r=d.result,out=[summaryTable('summary','完整输入对象与几何结论',r,['quantiles','timeRows','costRows','assignments','diagnostics'])];for(const [key,title]of [['quantiles','全部共同分位数段'],['timeRows','全部时间读数与实际分布'],['costRows','每份输入的全部成本'],['assignments','两种完整置换']])if(r[key])out.push(recordTable(key,title,r[key]));if(r.diagnostics)out.push(summaryTable('diagnostics','浮点误差诊断（不是严格区间证书）',r.diagnostics));return out;}
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

 const STYLE=".geometry153{color:var(--fg,#273646)}.geometry153 .geometry-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}.geometry153 label{display:flex;flex-direction:column;gap:6px}.geometry153 input,.geometry153 select{font:inherit;padding:8px;max-width:100%;background:var(--bg,#fff);color:inherit;border:1px solid #8b98a0;border-radius:5px}.geometry153 button{font:inherit;padding:8px 12px;margin:5px;cursor:pointer}.geometry153 button[aria-pressed=true]{outline:3px solid #478aaa}.geometry153 .geometry-scroll{overflow:auto;max-width:100%;margin:16px 0}.geometry153 .geometry-scroll:focus{outline:3px solid #478aaa}.geometry153 .geometry-ledger{max-height:420px}.geometry153 svg{width:900px!important;max-width:none!important;display:block;fill:currentColor;font:16px system-ui}.geometry153 table{display:table;overflow:visible;width:max-content;max-width:none;min-width:900px;border-collapse:collapse;font-variant-numeric:tabular-nums}.geometry153 th,.geometry153 td{padding:9px;border:1px solid #98a4ab;text-align:left;white-space:nowrap}.geometry153 .geometry-error{color:#c74b39}.geometry153 [hidden]{display:none!important}.geometry153 fieldset{margin:16px 0;padding:12px}.geometry153 details{margin:16px 0}.geometry153 summary{cursor:pointer;font-weight:600}.geometry153 .geometry-legend{font-size:.95em}.geometry153 .geometry-note{line-height:1.7}.geometry153 [hidden]{display:none!important}.geometry153 select{font:inherit;color:var(--fg,#282820);background:var(--bg,#faf7ef);padding:8px;max-width:100%}.geometry153 td{max-width:540px;white-space:normal;overflow-wrap:anywhere}.geometry153 .geometry-controls{min-width:0}.geometry153 input{min-width:0;width:100%;box-sizing:border-box}";
 function mount(container){
  const doc=container.ownerDocument;
  if(!doc.getElementById("geometry153-style")){const style=doc.createElement("style");style.id="geometry153-style";style.textContent=STYLE;doc.head.appendChild(style);}
  const field=(key,label,modes)=>'<label data-modes="'+modes+'">'+label+'<input data-key="'+key+'" type="text"></label>';
  container.innerHTML='<div class="geometry153"><h3>先核对配对，再观察分布怎样走</h3><p>一维分数账本、二维两点反例与高斯矩阵推前，分别核对它们的适用条件。</p><div class="geometry-presets">'+PRESETS.map(p=>'<button type="button" data-preset="'+p.id+'">'+esc(p.label)+'</button>').join('')+'</div><div class="geometry-controls"><label>实验<select data-key="mode"><option value="atomic">一维位移与混合</option><option value="barycenter">三分布重心</option><option value="plane">二维两点配对</option><option value="gaussian">二维高斯几何</option></select></label>'+
   field('a','第一份质量（逗号分隔，合计1）','atomic barycenter')+field('x','第一份位置（逗号分隔，±1000）','atomic barycenter')+field('b','第二份质量（合计1）','atomic barycenter')+field('y','第二份位置（±1000）','atomic barycenter')+
   field('thirdMass','第三份质量（合计1）','barycenter')+field('thirdX','第三份位置（±1000）','barycenter')+field('weights','三份重心权重（合计1）','barycenter')+field('candidateMass','候选质量（合计1）','barycenter')+field('candidateX','候选位置（±1000）','barycenter')+
   field('sourcePoints','两个源点：分号分点，逗号分坐标（±1000）','plane')+field('targetPoints','两个目标点：分号分点，逗号分坐标（±1000）','plane')+'<label data-modes="plane">所选配对<select data-key="pairing"><option value="direct">直接0→0、1→1</option><option value="cross">交叉0→1、1→0</option></select></label>'+
   field('sourceMean','源均值（两坐标，±1000）','gaussian')+field('targetMean','目标均值（两坐标，±1000）','gaussian')+field('sourceCov','源协方差：分号分行（各±100；正定且det/trace≥0.0001）','gaussian')+field('targetCov','目标协方差：分号分行（各±100；可半正定）','gaussian')+
   field('s','比较时刻s（0至1）','atomic plane gaussian')+field('t','当前时刻t（0至1）','atomic plane gaussian')+'</div><p>各输入最多六位小数，不接受指数记法。原子每份最多4个，同份位置不得重复；质量与权重不自动归一化。二维离散两点各有一半质量。高斯采用浮点矩阵计算，残差另列。</p>'+
   QUESTIONS.map((q,i)=>'<fieldset data-question="'+i+'"><legend>'+(i+1)+'. '+esc(q[0])+'</legend>'+q[1].map((v,j)=>'<button type="button" data-choice="'+j+'" aria-pressed="false">'+esc(v)+'</button>').join("")+'</fieldset>').join("")+
   '<button type="button" data-action="reveal">揭示图与完整账本</button><button type="button" data-action="reset">重置预测</button><p class="geometry-error" role="alert"></p><p role="status"></p><div class="geometry-results" hidden></div></div>';
  const fields=Array.from(container.querySelectorAll("[data-key]")),answers=Array(4).fill(null),result=container.querySelector(".geometry-results"),reveal=container.querySelector("[data-action=reveal]"),feedback=container.querySelector("[role=status]"),error=container.querySelector("[role=alert]");
  fields.forEach(e=>e.value=DEFAULTS[e.dataset.key]);
  let revealed=false,valid=null;
  function render(d){
   const notes={atomic:'共同分位数段保持质量，位移位置线性变化；混合保留端点位置。两个时刻及每个时间读数都重新计算实际运输距离，比较常速公式。概率点的高度直接表示质量，没有用点半径假装比例。',barycenter:'平均共同分位数得到一维重心。目标差精确等于候选到重心的W2平方；每份输入与零权重都保留完整记录。此结论不自动推广为高维映射平均。',plane:'两点等权的运输多面体是一条线段，比较两个置换就能得到全局最优值。选中的配对可能不最优；粒子成本只是实际分布距离的上界。两条最优配对也可能给出不同中点。',gaussian:'源正定、目标半正定的高斯模型，使用完整凸梯度仿射映射。协方差轮廓由矩阵平方根作用于单位圆绘制，不是抽样点云，也不覆盖全部概率质量。时间距离按已证明的测地线公式计算；残差只是浮点诊断。'};
   result.innerHTML='<p>'+notes[d.parameters.mode]+'</p>'+
    plots(d).map(q=>'<p>'+q.series.filter((s,i,ss)=>ss.findIndex(t=>t.label===s.label&&t.color===s.color)===i).map(s=>esc(s.label)+'（'+({"#268bd2":"蓝","#cb6a16":"橙","#29966c":"绿","#9966bb":"紫","#b44a72":"玫红"}[s.color])+'）').join("；")+'</p><div class="geometry-scroll" role="region" tabindex="0" aria-label="'+esc(q.title)+'">'+svg(q)+'</div>').join("")+
    ledgers(d).map(t=>'<details data-ledger="'+t.key+'"'+(t.key==="summary"?' open':"")+'><summary>'+esc(t.title)+'（'+t.rows.length+' 行）</summary><div class="geometry-scroll geometry-ledger" role="region" tabindex="0" aria-label="'+esc(t.title)+'"><table data-table="'+t.key+'"><thead><tr>'+t.headers.map(x=>'<th scope="col">'+esc(x)+'</th>').join("")+'</tr></thead><tbody>'+t.rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(fmt(x))+'</td>').join("")+'</tr>').join("")+'</tbody></table></div></details>').join("")+
    '<p>“—”表示该项不适用，不是数值零。精确分数保留分子分母；高斯矩阵、开方与图坐标为近似。曲线连接读数只辅助阅读，相同曲线可能重叠。完整图和表可键盘横向滚动。</p>';
  }
  function update(){
   const raw=Object.fromEntries(fields.map(e=>[e.dataset.key,e.value]));
   container.querySelectorAll("[data-modes]").forEach(e=>e.hidden=!e.dataset.modes.split(" ").includes(raw.mode));
   try{valid=config(raw);error.textContent="";}catch(e){valid=null;revealed=false;error.textContent=e.message;}
   reveal.disabled=!valid||answers.some(x=>x===null);result.hidden=!revealed;
   if(revealed&&valid)render(snapshot(valid));
   feedback.textContent=revealed?answers.filter((x,i)=>x===QUESTIONS[i][2]).length+" / 4。"+"配对最优性、真实距离和公式条件分别核对。":"";
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




















function selfTest(){let checks=0;const ck=(v,m)=>{checks++;if(!v)throw Error(m);},run=id=>snapshot(PRESETS.find(p=>p.id===id).values).result;let r=run('split');ck(r.distanceSquared.value===4,'split cost');ck(r.displacement.length===2&&r.mixture.length===3,'two paths');ck(r.betweenSquared.value===.25,'intermediate actual distance');r=run('same');ck(r.sameDistribution&&r.distanceSquared.value===0,'zero path');r=run('tiny');ck(r.source.some(z=>z.mass.value===.000001),'tiny preserved');r=run('bary-correct');ck(r.certifiedOptimal&&r.objective.value===2.75,'barycenter');r=run('bary-shift');ck(r.gap.value===.25&&r.candidateDistanceSquared.value===.25,'variance gap');r=run('plane-direct');ck(r.optimalAssignments===2&&r.selectedOptimal,'nonunique plane');r=run('plane-bad');ck(!r.selectedOptimal&&r.selectedCost.value===4&&r.distanceSquared.value===0,'bad pairing');r=run('plane-collapse');ck(r.betweenSquared.value===0&&r.particleBoundSquared.value===1,'label upper bound');r=run('gaussian-same');ck(r.identicalCovariance&&r.distanceSquared===0,'exact identity branch');r=run('gaussian-rank');ck(r.diagnostics.pushforwardResidual<1e-10,'singular target');return{status:'PASS',checks};}
return{DEFAULTS,PRESETS,QUESTIONS,config,snapshot,plots,ledgers,fmt,svg,mount,selfTest};
});
