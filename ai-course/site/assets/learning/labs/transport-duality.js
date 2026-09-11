(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root&&root.CourseLearning)root.CourseLearning.register('transport-duality',api.mount);})(typeof window!=='undefined'?window:globalThis,function(){
"use strict";
const abs=n=>n<0n?-n:n;
function gcd(a,b){a=abs(a);b=abs(b);while(b){const t=a%b;a=b;b=t;}return a;}
function rat(n,d=1n){if(d===0n)throw Error('分母为零');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return{n:n/g,d:d/g};}
const ZERO=rat(0n),ONE=rat(1n),add=(a,b)=>rat(a.n*b.d+b.n*a.d,a.d*b.d),sub=(a,b)=>rat(a.n*b.d-b.n*a.d,a.d*b.d),mul=(a,b)=>rat(a.n*b.n,a.d*b.d),div=(a,b)=>rat(a.n*b.d,a.d*b.n),cmp=(a,b)=>a.n*b.d-b.n*a.d,neg=a=>rat(-a.n,a.d),ar=a=>rat(abs(a.n),a.d),sum=xs=>xs.reduce(add,ZERO),key=a=>a.n+'/'+a.d;
const pack=q=>({numerator:String(q.n),denominator:String(q.d),value:Number(q.n)/Number(q.d)});
function decimal(value,label,lo=-1000000,hi=1000000){if(typeof value!=='string'&&typeof value!=='number')throw Error(label+'须为十进制数');const s=String(value).trim();if(!/^-?(?:\d+(?:\.\d{1,6})?|\.\d{1,6})$/.test(s))throw Error(label+'须为最多6位小数（不接受指数记法）');const x=Number(s);if(!Number.isFinite(x)||x<lo||x>hi)throw Error(label+'超出范围');const v=s.replace('-','').split('.'),d=10n**BigInt((v[1]||'').length),n=BigInt(v[0]||'0')*d+BigInt(v[1]||'0');return rat(s[0]==='-'?-n:n,d);}
function list(value,label,lo=-1000000,hi=1000000){if(typeof value!=='string'||value.length>512)throw Error(label+'须为逗号分隔列表');const xs=value.split(',');if(xs.length<1||xs.length>4)throw Error(label+'需要1–4项');return xs.map(x=>decimal(x,label,lo,hi));}
function matrix(value,label,m,n,lo=-1000000,hi=1000000){if(typeof value!=='string'||value.length>2048)throw Error(label+'须为分号分行、逗号分列');const rows=value.split(';').map(x=>list(x,label,lo,hi));if(rows.length!==m||rows.some(row=>row.length!==n))throw Error(label+'形状与边缘不一致');return rows;}
const DEFAULTS={mode:'optimal',metric:'absolute',a:'0.75,0.25',b:'0.25,0.75',x:'0,1',y:'0.25,1.25',costs:'0.25,1.25;0.75,0.25',gauge:'0',candidatePlan:'0.25,0.5;0,0.25',candidatePhi:'1.25,0.25',candidatePsi:'-1,0'};
function config(raw={}){if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('参数需要对象');const c={...DEFAULTS,...raw};if(!['optimal','candidate','line'].includes(c.mode))throw Error('未知实验');if(!['absolute','quadratic','custom'].includes(c.metric))throw Error('未知成本');if(c.mode==='line'&&c.metric==='custom')throw Error('分位数实验需要真实一维位置与距离成本');const a=list(c.a,'源质量',0,1),b=list(c.b,'目标质量',0,1),m=a.length,n=b.length;if(m*n>12)throw Error('矩阵最多12格');if(cmp(sum(a),ONE)!==0n||cmp(sum(b),ONE)!==0n)throw Error('两侧必须分别精确合计为1，不自动归一化');decimal(c.gauge,'势平移',-1000,1000);
 if(c.metric==='custom')matrix(c.costs,'成本矩阵',m,n);
 else{const x=list(c.x,'源位置',-1000,1000),y=list(c.y,'目标位置',-1000,1000);if(x.length!==m||y.length!==n)throw Error('位置数与质量数不一致');if(new Set(x.map(key)).size!==m||new Set(y.map(key)).size!==n)throw Error('同侧重复位置请先合并原子');}
 if(c.mode==='candidate'){matrix(c.candidatePlan,'候选计划',m,n,-1,1);if(list(c.candidatePhi,'源势').length!==m||list(c.candidatePsi,'目标势').length!==n)throw Error('候选势长度不符');}
 return{...c,m,n};}
function inputs(c){const a=list(c.a,'源质量'),b=list(c.b,'目标质量'),x=c.metric==='custom'?null:list(c.x,'源位置'),y=c.metric==='custom'?null:list(c.y,'目标位置'),C=c.metric==='custom'?matrix(c.costs,'成本',c.m,c.n):x.map(v=>y.map(w=>{const d=sub(v,w);return c.metric==='absolute'?ar(d):mul(d,d);}));return{a,b,x,y,C};}
const zeros=(m,n)=>Array.from({length:m},()=>Array(n).fill(ZERO)),pm=P=>P.map(row=>row.map(pack));
function cost(P,C){return sum(P.flatMap((row,i)=>row.map((v,j)=>mul(v,C[i][j]))));}
function certificate(a,b,C,P,phi,psi){const m=a.length,n=b.length,rowSums=P.map(sum),colSums=b.map((_,j)=>sum(P.map(row=>row[j]))),rowResiduals=rowSums.map((v,i)=>sub(v,a[i])),columnResiduals=colSums.map((v,j)=>sub(v,b[j])),slacks=C.map((row,i)=>row.map((v,j)=>sub(sub(v,phi[i]),psi[j]))),edges=[];
 for(let i=0;i<m;i++)for(let j=0;j<n;j++)edges.push({i,j,mass:pack(P[i][j]),cost:pack(C[i][j]),contribution:pack(mul(P[i][j],C[i][j])),price:pack(add(phi[i],psi[j])),slack:pack(slacks[i][j]),weightedSlack:pack(mul(P[i][j],slacks[i][j])),positive:P[i][j].n>0n,tight:slacks[i][j].n===0n});
 const primal=cost(P,C),dual=add(sum(a.map((v,i)=>mul(v,phi[i]))),sum(b.map((v,j)=>mul(v,psi[j])))),gap=sub(primal,dual),slackSum=cost(P,slacks),residualCorrection=add(sum(phi.map((v,i)=>mul(v,rowResiduals[i]))),sum(psi.map((v,j)=>mul(v,columnResiduals[j])))),nonnegative=P.flat().every(v=>v.n>=0n),balanced=rowResiduals.concat(columnResiduals).every(v=>v.n===0n),dualFeasible=slacks.flat().every(v=>v.n>=0n),primalFeasible=nonnegative&&balanced;
 return{plan:pm(P),phi:phi.map(pack),psi:psi.map(pack),rowSums:rowSums.map(pack),columnSums:colSums.map(pack),rowResiduals:rowResiduals.map(pack),columnResiduals:columnResiduals.map(pack),edges,primal:pack(primal),dual:pack(dual),gap:pack(gap),slackSum:pack(slackSum),residualCorrection:pack(residualCorrection),identity:cmp(gap,add(slackSum,residualCorrection))===0n,nonnegative,balanced,primalFeasible,dualFeasible,complementary:edges.every(e=>e.weightedSlack.numerator==='0'),certifiedOptimal:primalFeasible&&dualFeasible&&gap.n===0n};}
function combinations(n,k){const out=[];function visit(start,row){if(row.length===k){out.push(row);return;}for(let j=start;j<=n-(k-row.length);j++)visit(j+1,row.concat(j));}visit(0,[]);return out;}
function treeBasis(edges,a,b,C){const m=a.length,n=b.length,V=m+n,adj=Array.from({length:V},()=>[]);for(const e of edges){const i=Math.floor(e/n),j=m+e%n;adj[i].push([j,e]);adj[j].push([i,e]);}
 const potentials=Array(V).fill(null),queue=[0];potentials[0]=ZERO;for(let t=0;t<queue.length;t++){const v=queue[t];for(const[w,e]of adj[v])if(potentials[w]===null){potentials[w]=sub(C[Math.floor(e/n)][e%n],potentials[v]);queue.push(w);}}if(queue.length!==V)return null;
 const remaining=a.concat(b).slice(),degree=adj.map(x=>x.length),used=new Set(),P=zeros(m,n);
 for(let t=0;t<edges.length;t++){const v=degree.findIndex(x=>x===1);if(v<0)throw Error('生成树叶消元失败');const[w,e]=adj[v].find(([,e])=>!used.has(e)),value=remaining[v];P[Math.floor(e/n)][e%n]=value;remaining[w]=sub(remaining[w],value);remaining[v]=ZERO;degree[v]--;degree[w]--;used.add(e);}
 if(remaining.some(v=>v.n!==0n))throw Error('树边缘残量不平');const phi=potentials.slice(0,m),psi=potentials.slice(m),primal=cost(P,C),dual=add(sum(a.map((v,i)=>mul(v,phi[i]))),sum(b.map((v,j)=>mul(v,psi[j])))),slacks=C.map((row,i)=>row.map((v,j)=>sub(sub(v,phi[i]),psi[j])));
 return{edges,P,phi,psi,primal,dual,primalFeasible:P.flat().every(v=>v.n>=0n),dualFeasible:slacks.flat().every(v=>v.n>=0n)};}
function solve(a,b,C){const m=a.length,n=b.length,all=combinations(m*n,m+n-1),trees=[],vertices=[],seen=new Map();let best=null,bestDual=null;
 for(const edges of all){const t=treeBasis(edges,a,b,C);if(!t)continue;trees.push(t);if(t.primalFeasible){const k=t.P.flat().map(key).join(',');if(!seen.has(k)){seen.set(k,vertices.length);vertices.push({P:t.P,cost:t.primal,bases:[]});}vertices[seen.get(k)].bases.push(trees.length-1);if(best===null||cmp(t.primal,best.primal)<0n)best=t;}if(t.dualFeasible&&(bestDual===null||cmp(t.dual,bestDual.dual)>0n))bestDual=t;}
 if(!best||!bestDual||cmp(best.primal,bestDual.dual)!==0n)throw Error('精确有限强对偶未闭合');return{attempted:all.length,trees,vertices,best,bestDual};}
function monge(a,b,C){const m=a.length,n=b.length,rows=[];function visit(i,assignment){if(i<m){for(let j=0;j<(a[i].n===0n?1:n);j++)visit(i+1,assignment.concat(j));return;}const loads=Array(n).fill(ZERO);let value=ZERO;for(let k=0;k<m;k++){loads[assignment[k]]=add(loads[assignment[k]],a[k]);value=add(value,mul(a[k],C[k][assignment[k]]));}rows.push({assignment,loads,cost:value,feasible:loads.every((v,j)=>cmp(v,b[j])===0n)});}visit(0,[]);const feasible=rows.filter(z=>z.feasible);let best=null;for(const z of feasible)if(best===null||cmp(z.cost,best.cost)<0n)best=z;return{rows,feasible,best};}
function transform(C,phi){const candidates=C.map((row,i)=>row.map(v=>sub(v,phi[i]))),psi=C[0].map((_,j)=>candidates.map(row=>row[j]).reduce((a,b)=>cmp(a,b)<=0n?a:b)),closed=C.map(row=>row.map((v,j)=>sub(v,psi[j])).reduce((a,b)=>cmp(a,b)<=0n?a:b));return{candidates,psi,closed};}
function lineTransport(a,b,x,y){const m=a.length,n=b.length,ix=x.map((_,i)=>i).sort((i,j)=>cmp(x[i],x[j])<0n?-1:1),iy=y.map((_,i)=>i).sort((i,j)=>cmp(y[i],y[j])<0n?-1:1),aa=a.slice(),bb=b.slice(),P=zeros(m,n),quantiles=[];let i=0,j=0,t=ZERO,W1=ZERO,W2=ZERO;
 while(i<m&&j<n){if(aa[ix[i]].n===0n){i++;continue;}if(bb[iy[j]].n===0n){j++;continue;}const u=ix[i],v=iy[j],mass=cmp(aa[u],bb[v])<=0n?aa[u]:bb[v],end=add(t,mass),displacement=sub(y[v],x[u]),d1=ar(displacement),d2=mul(displacement,displacement);P[u][v]=add(P[u][v],mass);quantiles.push({start:pack(t),end:pack(end),mass:pack(mass),source:u,target:v,x:pack(x[u]),y:pack(y[v]),displacement:pack(displacement),absoluteContribution:pack(mul(mass,d1)),squareContribution:pack(mul(mass,d2))});W1=add(W1,mul(mass,d1));W2=add(W2,mul(mass,d2));aa[u]=sub(aa[u],mass);bb[v]=sub(bb[v],mass);t=end;}
 if(cmp(t,ONE)!==0n)throw Error('分位数未覆盖整段');const unique=new Map();for(const z of x.concat(y))unique.set(key(z),z);const z=[...unique.values()].sort((a,b)=>cmp(a,b)<0n?-1:1),points=[],intervals=[];let Fa=ZERO,Fb=ZERO,f=ZERO,area=ZERO,dual=ZERO;
 for(let k=0;k<z.length;k++){const sa=sum(a.filter((_,i)=>cmp(x[i],z[k])===0n)),sb=sum(b.filter((_,j)=>cmp(y[j],z[k])===0n)),surplus=sub(sa,sb);Fa=add(Fa,sa);Fb=add(Fb,sb);dual=add(dual,mul(f,surplus));points.push({k,z:pack(z[k]),sourceMass:pack(sa),targetMass:pack(sb),sourceCDF:pack(Fa),targetCDF:pack(Fb),surplus:pack(surplus),potential:pack(f)});
  if(k+1<z.length){const width=sub(z[k+1],z[k]),delta=sub(Fa,Fb),sign=delta.n<0n?-1:delta.n>0n?1:0,contribution=mul(width,ar(delta)),endF=sub(f,mul(rat(BigInt(sign)),width));intervals.push({k,left:pack(z[k]),right:pack(z[k+1]),width:pack(width),cdfDifference:pack(delta),absoluteArea:pack(contribution),slope:-sign,leftPotential:pack(f),rightPotential:pack(endF)});area=add(area,contribution);f=endF;}}
 const get=z0=>{const r=points.find(p=>cmp(rat(BigInt(p.z.numerator),BigInt(p.z.denominator)),z0)===0n).potential;return rat(BigInt(r.numerator),BigInt(r.denominator));},phi=x.map(get),psi=y.map(v=>neg(get(v))),C=x.map(v=>y.map(w=>ar(sub(v,w))));
 if(cmp(area,W1)!==0n||cmp(dual,W1)!==0n)throw Error('CDF与分位数及检验函数未闭合');return{sourceOrder:ix,targetOrder:iy,plan:pm(P),quantiles,points,intervals,W1:pack(W1),W2Squared:pack(W2),W2Approximation:Math.sqrt(pack(W2).value),cdfArea:pack(area),testObjective:pack(dual),testCertificate:certificate(a,b,C,P,phi,psi)};}
function snapshot(raw={}){const c=config(raw),{a,b,x,y,C}=inputs(c),sol=solve(a,b,C),maps=monge(a,b,C),shift=decimal(c.gauge,'势平移'),basePhi=sol.bestDual.phi,basePsi=sol.bestDual.psi,phi=basePhi.map(v=>add(v,shift)),psi=basePsi.map(v=>sub(v,shift)),opt=certificate(a,b,C,sol.best.P,phi,psi),vertices=sol.vertices.map((z,index)=>({index,plan:pm(z.P),cost:pack(z.cost),bases:z.bases,optimal:cmp(z.cost,sol.best.primal)===0n})),basisRows=sol.trees.map((z,index)=>({index,edges:z.edges,plan:pm(z.P),phi:z.phi.map(pack),psi:z.psi.map(pack),primal:pack(z.primal),dual:pack(z.dual),primalFeasible:z.primalFeasible,dualFeasible:z.dualFeasible})),mapRows=maps.rows.map((z,index)=>({index,assignment:z.assignment,loads:z.loads.map(pack),cost:pack(z.cost),feasible:z.feasible}));
 let candidate=null,repair=null;if(c.mode==='candidate'){const P=matrix(c.candidatePlan,'候选计划',c.m,c.n,-1,1),f=list(c.candidatePhi,'源势').map(v=>add(v,shift)),g=list(c.candidatePsi,'目标势').map(v=>sub(v,shift));candidate=certificate(a,b,C,P,f,g);const tr=transform(C,f);repair={columnCandidates:pm(tr.candidates),maximalPsi:tr.psi.map(pack),closedPhi:tr.closed.map(pack),afterOne:certificate(a,b,C,P,f,tr.psi),afterTwo:certificate(a,b,C,P,tr.closed,tr.psi)};}
 return{parameters:c,result:{sourceMasses:a.map(pack),targetMasses:b.map(pack),sourcePositions:x&&x.map(pack),targetPositions:y&&y.map(pack),costs:pm(C),gauge:pack(shift),basePhi:basePhi.map(pack),basePsi:basePsi.map(pack),optimal:opt,attemptedBases:sol.attempted,spanningTrees:sol.trees.length,feasibleBases:sol.trees.filter(z=>z.primalFeasible).length,vertexCount:vertices.length,optimalVertexCount:vertices.filter(z=>z.optimal).length,uniqueOptimalPlan:vertices.filter(z=>z.optimal).length===1,vertices,basisRows,mapRows,mongeFeasibleCount:maps.feasible.length,mongeBestCost:maps.best&&pack(maps.best.cost),mongeGap:maps.best&&pack(sub(maps.best.cost,sol.best.primal)),candidate,repair,line:x?lineTransport(a,b,x,y):null}};}
const PRESETS=[
 {id:'monotone',label:'分位数能拆分',values:{}},
 {id:'split',label:'一点拆成两份',values:{a:'1',b:'0.5,0.5',x:'0',y:'-1,1'}},
 {id:'quadratic',label:'同一边缘平方成本',values:{metric:'quadratic'}},
 {id:'tie',label:'所有计划同价',values:{metric:'custom',a:'0.5,0.5',b:'0.5,0.5',costs:'1,1;1,1'}},
 {id:'separated',label:'交叉也可能最优',values:{a:'0.5,0.5',b:'0.5,0.5',x:'0,1',y:'2,3'}},
 {id:'strict',label:'严格凸排除交叉',values:{a:'0.5,0.5',b:'0.5,0.5',x:'0,1',y:'2,3',metric:'quadratic'}},
 {id:'negative-cost',label:'成本可负但非距离',values:{metric:'custom',a:'0.5,0.5',b:'0.5,0.5',costs:'-1,2;3,-4'}},
 {id:'zero-row',label:'保留零质量原子',values:{a:'0,1',b:'0.5,0.5'}},
 {id:'tiny',label:'百万分之一不抹零',values:{a:'0.000001,0.999999',b:'0.999999,0.000001'}},
 {id:'gauge',label:'精确平移势',values:{gauge:'-0.123456'}},
 {id:'relaxation',label:'Monge可行仍更贵',values:{metric:'custom',a:'0.5,0.25,0.25',b:'0.5,0.5',costs:'0,0;0,10;10,0'}},
 {id:'assignment',label:'等权与置换顶点',values:{a:'0.5,0.5',b:'0.5,0.5',metric:'quadratic'}},
 {id:'wide',label:'三到四的完整顶点',values:{a:'0.5,0.25,0.25',b:'0.25,0.25,0.25,0.25',x:'0,2,4',y:'1,2,3,5',metric:'quadratic'}},
 {id:'one',label:'一到一',values:{a:'1',b:'1',x:'0',y:'2'}},
 {id:'valid',label:'手填正确证书',values:{mode:'candidate'}},
 {id:'false-zero',label:'差为零却不守恒',values:{mode:'candidate',candidatePlan:'0,0;0,0',candidatePhi:'0,0',candidatePsi:'0,0'}},
 {id:'suboptimal',label:'可行仍非最优',values:{mode:'candidate',candidatePlan:'0,0.75;0.25,0'}},
 {id:'negative-plan',label:'边缘对了质量却负',values:{mode:'candidate',candidatePlan:'-0.1,0.85;0.35,-0.1'}},
 {id:'bad-prices',label:'报价超过自运成本',values:{mode:'candidate',candidatePhi:'3,3',candidatePsi:'0,0'}},
 {id:'closure-stalls',label:'c变换闭合仍不最优',values:{mode:'candidate',candidatePhi:'0,0',candidatePsi:'0.25,0.25'}},
 {id:'cycle',label:'两两交换不足',values:{mode:'candidate',metric:'custom',a:'0.5,0.25,0.25',b:'0.5,0.25,0.25',costs:'2,0,5;5,2,0;0,5,2',candidatePlan:'0.5,0,0;0,0.25,0;0,0,0.25',candidatePhi:'0,0,0',candidatePsi:'0,0,0'}},
 {id:'candidate-gauge',label:'坏计划的规范不变',values:{mode:'candidate',candidatePlan:'0,0;0,0',candidatePhi:'1,2',candidatePsi:'3,4',gauge:'1000'}},
 {id:'line',label:'分位数、CDF和检验函数',values:{mode:'line'}},
 {id:'unsorted',label:'输入顺序不是几何顺序',values:{mode:'line',x:'1,0',y:'1.25,0.25'}},
 {id:'line-split',label:'分位数中的原子拆分',values:{mode:'line',a:'1',b:'0.5,0.5',x:'0',y:'-1,1'}},
 {id:'identical',label:'同分布的零距离',values:{mode:'line',a:'0.5,0.5',b:'0.5,0.5',x:'0,1',y:'0,1'}},
 {id:'translated',label:'平移两单位',values:{mode:'line',a:'0.5,0.5',b:'0.5,0.5',x:'0,1',y:'2,3'}},
 {id:'line-zero',label:'单点无区间',values:{mode:'line',a:'1',b:'1',x:'0',y:'0'}},
 {id:'line-tiny',label:'极小质量的CDF面积',values:{mode:'line',a:'0.000001,0.999999',b:'0.999999,0.000001',x:'-1,1',y:'-1,1'}},
 {id:'line-square',label:'W2需要开平方',values:{mode:'line',metric:'quadratic'}}
];
const QUESTIONS=[
 ['耦合原始目标与对偶收入相等，是否已足以证明最优？',['还须核对非负质量、边缘与全部报价约束','只要相等即可','还需要势本身唯一']],
 ['某条边的对偶slack为零，是否必须运货？',['不必，零slack只允许它承载质量','必须运正质量','这种边必须删除']],
 ['Monge映射可行时，最优值是否必等于Kantorovich？',['不一定，原子分配可能受限','总相等','Kantorovich一定更贵']],
 ['一维绝对距离成本是否要求所有最优计划不交叉？',['不要求，仿射区间可能使交换取等','所有最优计划都不交叉','单调方案从不最优']]
].map(q=>[q[0],q[1],0]);
const B='#268bd2',O='#cb6a16',G='#29966c',V='#9966bb',R='#b44a72';
const series=(key,label,color,points,line=true)=>({key,label,color,points,line});
function chart(title,x,y,ss,xmin,xmax,discrete=false){const vals=ss.flatMap(s=>s.points.map(z=>z[1])),lo=Math.min(0,...vals),hi=Math.max(0,...vals),pad=(hi-lo||1)*.08;if(xmax===xmin)xmax=xmin+1;return{type:'chart',title,x,y,series:ss,xmin,xmax,ymin:lo-pad,ymax:hi+pad,square:false,markers:[],xTicks:[...new Set(Array.from({length:5},(_,j)=>discrete?Math.round(xmin+(xmax-xmin)*j/4):xmin+(xmax-xmin)*j/4))]};}
function network(d,q){return{type:'network',title:'逐条运输边：颜色表示正、零与负质量',x:'左边源标签，右边目标标签；上下顺序是输入标签顺序',y:'蓝为正质量，玫红为非法负质量，灰虚线为零',series:[series('positive','正质量',B,[]),series('negative','候选负质量',R,[])],m:d.parameters.m,n:d.parameters.n,a:d.result.sourceMasses,b:d.result.targetMasses,edges:q.edges};}
function heat(title,matrix,label){return{type:'heat',title,x:'列j：目标标签',y:'行i：源标签；每格显示'+label+'近似值',series:[],matrix,m:matrix.length,n:matrix[0].length};}
function plots(d){const c=d.parameters,r=d.result,q=c.mode==='candidate'?r.candidate:r.optimal;
 if(c.mode==='line'){const l=r.line,first=l.points[0].z.value,last=l.points[l.points.length-1].z.value;return[
  chart('共同分位数：同一u对应两边的位置','累计概率u','位置；横段端点处的取值不影响积分',[series('source','源分位数',B,l.quantiles.flatMap(z=>[[z.start.value,z.x.value],[z.end.value,z.x.value]])),series('target','目标分位数',O,l.quantiles.flatMap(z=>[[z.start.value,z.y.value],[z.end.value,z.y.value]]))],0,1),
  chart('CDF差的面积就是W1','合并后的实际位置z','有符号累计质量差，绝对面积计成本',[series('difference','源CDF减目标CDF',B,l.intervals.flatMap(z=>[[z.left.value,z.cdfDifference.value],[z.right.value,z.cdfDifference.value]]))],first,last),
  chart('最优1-Lipschitz检验函数','实际位置z','固定最左位置的势为0',[series('potential','检验函数f',G,l.points.map(z=>[z.z.value,z.potential.value]))],first,last),
  chart('每段分位数交叠付出的成本','分位数交叠段编号','蓝：W1贡献；橙：W2平方贡献',[series('absolute','绝对距离贡献',B,l.quantiles.map((z,i)=>[i,z.absoluteContribution.value])),series('square','平方距离贡献',O,l.quantiles.map((z,i)=>[i,z.squareContribution.value]))],0,Math.max(1,l.quantiles.length-1),true)
 ];}
 const slack=q.plan.map((row,i)=>row.map((_,j)=>q.edges[i*c.n+j].slack));
 if(c.mode==='candidate')return[network(d,q),heat('提交的候选质量：负数不隐藏',q.plan,'质量'),heat('候选报价的逐格slack',slack,'slack'),chart('差额恒等式保留边缘修正','0=原始减对偶；1=质量乘slack；2=残差修正','成本单位；后两项之和等于第一项',[series('identity','实际三项',V,[q.gap,q.slackSum,q.residualCorrection].map((z,i)=>[i,z.value]),false)],0,2,true)];
 return[network(d,q),heat('实际成本矩阵',r.costs,'成本'),heat('最优证书的完整slack',slack,'slack'),chart('全部不同顶点的目标值','不同顶点编号，不是基编号','成本；橙线为全局最优值',[series('vertices','各顶点成本',B,r.vertices.map(z=>[z.index,z.cost.value])),series('minimum','最优值',O,[[0,q.primal.value],[Math.max(1,r.vertices.length-1),q.primal.value]])],0,Math.max(1,r.vertices.length-1),true)];}
const WORDS={numerator:'分子',denominator:'分母',value:'近似值',sourceMasses:'源质量',targetMasses:'目标质量',sourcePositions:'源位置',targetPositions:'目标位置',costs:'成本矩阵',gauge:'势平移',basePhi:'未平移源势',basePsi:'未平移目标势',attemptedBases:'枚举边子集数',spanningTrees:'全部生成树数',feasibleBases:'非负可行基数',vertexCount:'不同顶点数',optimalVertexCount:'最优顶点数',uniqueOptimalPlan:'整个最优计划是否唯一',mongeFeasibleCount:'不同正质量原子映射可行数',mongeBestCost:'最优Monge成本',mongeGap:'Monge减Kantorovich',plan:'完整质量矩阵',phi:'源势',psi:'目标势',rowSums:'实际行和',columnSums:'实际列和',rowResiduals:'行和减源质量',columnResiduals:'列和减目标质量',primal:'原始目标',dual:'对偶目标',gap:'原始减对偶',slackSum:'质量乘slack之和',residualCorrection:'边缘残差修正',identity:'完整差额恒等式成立',nonnegative:'全部质量非负',balanced:'边缘守恒',primalFeasible:'原始可行',dualFeasible:'对偶可行',complementary:'逐格质量乘slack为零',certifiedOptimal:'精确最优证书成立',index:'编号',i:'源标签i',j:'目标标签j',mass:'质量',cost:'成本',contribution:'成本贡献',price:'两端总报价',slack:'成本减报价',weightedSlack:'质量乘slack',positive:'质量严格为正',tight:'slack严格为零',edges:'树边或全部格记录',bases:'描述此顶点的基编号',optimal:'最优顶点',assignment:'每个源原子的目标标签',loads:'各目标实际收到质量',feasible:'原子映射可行',columnCandidates:'全部成本减源势',maximalPsi:'最大可行目标回复',closedPhi:'反向c变换源势',sourceOrder:'按真实位置的源排序',targetOrder:'按真实位置的目标排序',W1:'W1精确值',W2Squared:'W2平方精确值',W2Approximation:'W2开平方近似',cdfArea:'CDF差绝对面积',testObjective:'检验函数积分差',start:'u左端点',end:'u右端点',source:'源标签',target:'目标标签',x:'源位置',y:'目标位置',displacement:'目标减源位置',absoluteContribution:'W1成本贡献',squareContribution:'W2平方贡献',k:'位置或区间编号',z:'实际位置',sourceMass:'此点源质量',targetMass:'此点目标质量',sourceCDF:'源CDF',targetCDF:'目标CDF',surplus:'此点质量差',potential:'最优检验函数值',left:'位置左端',right:'位置右端',width:'位置区间长',cdfDifference:'CDF差',absoluteArea:'CDF绝对面积',slope:'检验函数斜率',leftPotential:'左端函数值',rightPotential:'右端函数值'};
function fmt(v){if(v===null||v===undefined)return'—';if(typeof v==='boolean')return v?'是':'否';if(typeof v==='number'){if(!Number.isFinite(v))throw Error('非有限值');return v===0?'0':Math.abs(v)<1e-4||Math.abs(v)>=1e6?v.toExponential(8):String(Number(v.toPrecision(10)));}if(typeof v==='object')return Array.isArray(v)?'['+v.map(fmt).join('；')+']':Object.entries(v).map(([k,z])=>(WORDS[k]||k)+'='+fmt(z)).join('；');return WORDS[v]||String(v);}
function summaryTable(key,title,r,exclude=[]){return{key,title,headers:['量','完整记录'],rows:Object.entries(r).filter(([k])=>!exclude.includes(k)).map(([k,v])=>[WORDS[k]||k,v])};}
function recordTable(key,title,rows){const keys=rows.length?Object.keys(rows[0]):[];return{key,title,headers:keys.map(k=>WORDS[k]||k),rows:rows.map(z=>keys.map(k=>z[k]))};}
function ledgers(d){const r=d.result,out=[summaryTable('summary','问题、计数与结论',r,['optimal','vertices','basisRows','mapRows','candidate','repair','line']),summaryTable('optimal','完整最优证书',r.optimal,['edges']),recordTable('optimalEdges','最优计划每一格',r.optimal.edges),recordTable('vertices','全部不同顶点',r.vertices),recordTable('basisRows','全部生成树基（含不可行者）',r.basisRows),recordTable('mapRows','全部正质量原子映射',r.mapRows)];
 if(r.candidate){out.push(summaryTable('candidate','候选证书诊断',r.candidate,['edges']),recordTable('candidateEdges','候选每一格',r.candidate.edges),summaryTable('repair','c变换候选与回复',r.repair,['afterOne','afterTwo']));for(const key of ['afterOne','afterTwo'])out.push(summaryTable(key,key==='afterOne'?'一次修复后的完整证书':'两次变换后的完整证书',r.repair[key],['edges']),recordTable(key+'Edges','变换后逐格证书',r.repair[key].edges));}
 if(r.line){const l=r.line;out.push(summaryTable('line','一维几何汇总',l,['quantiles','points','intervals','testCertificate']),recordTable('quantiles','全部分位数交叠',l.quantiles),recordTable('points','合并位置与CDF/势',l.points),recordTable('intervals','全部CDF面积区间',l.intervals),summaryTable('testCertificate','W1检验函数完整证书',l.testCertificate,['edges']),recordTable('testEdges','W1检验函数逐格验证',l.testCertificate.edges));}return out;}
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const tick=v=>v===0?"0":Math.abs(v)<1e-3||Math.abs(v)>=1e4?v.toExponential(2):String(Number(v.toPrecision(4)));
 function chartSvg(q){
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
function svg(q){if(q.type==='chart')return chartSvg(q);let out='<svg xmlns="http://www.w3.org/2000/svg" width="900" height="425" role="img" aria-label="'+esc(q.title)+'"><title>'+esc(q.title)+'</title><text x="25" y="32" font-size="22">'+esc(q.title)+'</text><text x="25" y="65" font-size="16">'+esc(q.y)+'</text>';
 if(q.type==='network'){const yy=(i,n)=>n===1?215:110+210*i/(n-1);for(const e of q.edges){const color=e.mass.value>0?B:e.mass.value<0?R:'#87949f';out+='<line data-edge="'+e.i+'-'+e.j+'" x1="230" y1="'+yy(e.i,q.m)+'" x2="670" y2="'+yy(e.j,q.n)+'" stroke="'+color+'" stroke-width="'+(e.mass.value===0?1:2.5)+'"'+(e.mass.value<=0?' stroke-dasharray="6 5"':'')+'><title>'+esc('i='+e.i+' 到 j='+e.j+'，质量='+fmt(e.mass))+'</title></line>';}
  for(const [side,masses,xx]of [['source',q.a,230],['target',q.b,670]])masses.forEach((v,i)=>{const y=yy(i,masses.length),left=side==='source';out+='<circle data-node="'+side+'-'+i+'" cx="'+xx+'" cy="'+y+'" r="11" fill="'+(left?B:G)+'"/><text x="'+(left?20:695)+'" y="'+(y+5)+'" font-size="17">'+esc((left?'i=':'j=')+i+'，质量 '+fmt(v.value))+'</text>';});
  out+='<text x="25" y="370" font-size="16">所有非零边等宽，颜色不表示最优性；精确质量与费用见逐格表。</text>';
 }else{const w=690/q.n,h=235/q.m;for(let j=0;j<q.n;j++)out+='<text x="'+(150+(j+.5)*w)+'" y="94" text-anchor="middle">j='+j+'</text>';for(let i=0;i<q.m;i++){out+='<text x="125" y="'+(110+(i+.5)*h+5)+'" text-anchor="end">i='+i+'</text>';for(let j=0;j<q.n;j++){const v=q.matrix[i][j].value,x=150+j*w,y=110+i*h;out+='<rect data-cell="'+i+'-'+j+'" x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+(v<0?'#f7d8df':v>0?'#deebf7':'#edf1f4')+'" stroke="#87949f"/><text data-value="'+i+'-'+j+'" x="'+(x+w/2)+'" y="'+(y+h/2+6)+'" text-anchor="middle" font-size="18" fill="#253346">'+esc(fmt(v))+'</text>';}}}
 return out+'<text x="450" y="405" text-anchor="middle" font-size="16">'+esc(q.x)+'</text></svg>';}

 const STYLE=".transport152{color:var(--fg,#273646)}.transport152 .transport-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}.transport152 label{display:flex;flex-direction:column;gap:6px}.transport152 input,.transport152 select{font:inherit;padding:8px;max-width:100%;background:var(--bg,#fff);color:inherit;border:1px solid #8b98a0;border-radius:5px}.transport152 button{font:inherit;padding:8px 12px;margin:5px;cursor:pointer}.transport152 button[aria-pressed=true]{outline:3px solid #478aaa}.transport152 .transport-scroll{overflow:auto;max-width:100%;margin:16px 0}.transport152 .transport-scroll:focus{outline:3px solid #478aaa}.transport152 .transport-ledger{max-height:420px}.transport152 svg{width:900px!important;max-width:none!important;display:block;fill:currentColor;font:16px system-ui}.transport152 table{display:table;overflow:visible;width:max-content;max-width:none;min-width:900px;border-collapse:collapse;font-variant-numeric:tabular-nums}.transport152 th,.transport152 td{padding:9px;border:1px solid #98a4ab;text-align:left;white-space:nowrap}.transport152 .transport-error{color:#c74b39}.transport152 [hidden]{display:none!important}.transport152 fieldset{margin:16px 0;padding:12px}.transport152 details{margin:16px 0}.transport152 summary{cursor:pointer;font-weight:600}.transport152 .transport-legend{font-size:.95em}.transport152 .transport-note{line-height:1.7}.transport152 [hidden]{display:none!important}.transport152 select{font:inherit;color:var(--fg,#282820);background:var(--bg,#faf7ef);padding:8px;max-width:100%}.transport152 td{max-width:540px;white-space:normal;overflow-wrap:anywhere}.transport152 .transport-controls{min-width:0}.transport152 input{min-width:0;width:100%;box-sizing:border-box}";
 function mount(container){
  const doc=container.ownerDocument;
  if(!doc.getElementById("transport152-style")){const style=doc.createElement("style");style.id="transport152-style";style.textContent=STYLE;doc.head.appendChild(style);}
  const field=(key,label,modes,metrics='absolute quadratic custom')=>'<label data-modes="'+modes+'" data-metrics="'+metrics+'">'+label+'<input data-key="'+key+'" type="text"></label>';
  container.innerHTML='<div class="transport152"><h3>让运输计划与最优性证书逐格相遇</h3><p>精确枚举小型运输表；候选对象的非法质量与不可行报价会完整显示。</p><div class="transport-presets">'+PRESETS.map(p=>'<button type="button" data-preset="'+p.id+'">'+esc(p.label)+'</button>').join('')+'</div><div class="transport-controls"><label>实验<select data-key="mode"><option value="optimal">精确最优计划</option><option value="candidate">提交候选证书</option><option value="line">一维分位数与W1</option></select></label><label>成本<select data-key="metric"><option value="absolute">一维绝对距离</option><option value="quadratic">一维平方距离</option><option value="custom">自定义矩阵</option></select></label>'+
   field('a','源质量（逗号分隔，各0–1，精确合计1）','optimal candidate line')+field('b','目标质量（逗号分隔，各0–1，精确合计1）','optimal candidate line')+
   field('x','源位置（各−1000至1000，同侧不得重复）','optimal candidate line','absolute quadratic')+field('y','目标位置（各−1000至1000，同侧不得重复）','optimal candidate line','absolute quadratic')+
   field('costs','成本矩阵：分号分行、逗号分列（各±1000000）','optimal candidate','custom')+field('gauge','对偶势平移（−1000至1000）','optimal candidate line')+
   field('candidatePlan','候选质量矩阵：分号分行、逗号分列（各−1至1）','candidate')+field('candidatePhi','候选源势，逗号分隔（各±1000000）','candidate')+field('candidatePsi','候选目标势，逗号分隔（各±1000000）','candidate')+'</div><p>输入最多六位小数，不接受指数记法。两侧分别合计为1，每侧最多4项，最多12格。候选模式允许输入负质量来检查失败原因。一般成本矩阵不自动成为距离。</p>'+
   QUESTIONS.map((q,i)=>'<fieldset data-question="'+i+'"><legend>'+(i+1)+'. '+esc(q[0])+'</legend>'+q[1].map((v,j)=>'<button type="button" data-choice="'+j+'" aria-pressed="false">'+esc(v)+'</button>').join("")+'</fieldset>').join("")+
   '<button type="button" data-action="reveal">揭示图与完整账本</button><button type="button" data-action="reset">重置预测</button><p class="transport-error" role="alert"></p><p role="status"></p><div class="transport-results" hidden></div></div>';
  const fields=Array.from(container.querySelectorAll("[data-key]")),answers=Array(4).fill(null),result=container.querySelector(".transport-results"),reveal=container.querySelector("[data-action=reveal]"),feedback=container.querySelector("[role=status]"),error=container.querySelector("[role=alert]");
  fields.forEach(e=>e.value=DEFAULTS[e.dataset.key]);
  let revealed=false,valid=null;
  function render(d){
   const notes={optimal:'完整枚举生成树基并去重顶点；基数、不同顶点数与最优面分别说明。另枚举正质量源原子的全部映射。精确对偶价格与每格slack给出全局证书；非唯一时不会把选中的代表冒称唯一。',candidate:'先检查质量非负、边缘守恒和全部报价约束，再判断零gap是否为最优证书。边缘错误时保留残差修正；c变换修复报价不保证全局最优，也不替你修复运输质量。',line:'按真实位置排序，通过累计概率区间交叠构造共同分位数计划；再独立计算CDF差面积和最优Lipschitz检验函数。W1三份账一致，W2平方与开平方分开。竖线只是阶梯图的跳跃连接，不增加积分面积。'};
   result.innerHTML='<p>'+notes[d.parameters.mode]+'</p>'+
    plots(d).map(q=>'<p>'+q.series.filter((s,i,ss)=>ss.findIndex(t=>t.label===s.label&&t.color===s.color)===i).map(s=>esc(s.label)+'（'+({"#268bd2":"蓝","#cb6a16":"橙","#29966c":"绿","#9966bb":"紫","#b44a72":"玫红"}[s.color])+'）').join("；")+'</p><div class="transport-scroll" role="region" tabindex="0" aria-label="'+esc(q.title)+'">'+svg(q)+'</div>').join("")+
    ledgers(d).map(t=>'<details data-ledger="'+t.key+'"'+(t.key==="summary"?' open':"")+'><summary>'+esc(t.title)+'（'+t.rows.length+' 行）</summary><div class="transport-scroll transport-ledger" role="region" tabindex="0" aria-label="'+esc(t.title)+'"><table data-table="'+t.key+'"><thead><tr>'+t.headers.map(x=>'<th scope="col">'+esc(x)+'</th>').join("")+'</tr></thead><tbody>'+t.rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(fmt(x))+'</td>').join("")+'</tr>').join("")+'</tbody></table></div></details>').join("")+
    '<p>“—”表示当前对象不存在或不适用，例如Monge无可行映射，不表示零成本。小数为近似显示，分子分母保留精确值。网络只表示质量符号，顶点图连线不代表顶点之间的枚举顺序有几何意义；所有完整表可键盘横向滚动。</p>';
  }
  function update(){
   const raw=Object.fromEntries(fields.map(e=>[e.dataset.key,e.value]));
   container.querySelectorAll("[data-modes]").forEach(e=>e.hidden=!e.dataset.modes.split(" ").includes(raw.mode)||!e.dataset.metrics.split(" ").includes(raw.metric));
   try{valid=config(raw);error.textContent="";}catch(e){valid=null;revealed=false;error.textContent=e.message;}
   reveal.disabled=!valid||answers.some(x=>x===null);result.hidden=!revealed;
   if(revealed&&valid)render(snapshot(valid));
   feedback.textContent=revealed?answers.filter((x,i)=>x===QUESTIONS[i][2]).length+" / 4。"+"可行性、最优值和唯一性分别核对。":"";
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



















function selfTest(){let checks=0;const ck=(v,m)=>{checks++;if(!v)throw Error(m);};let r=snapshot().result;ck(r.optimal.primal.value===.75&&r.optimal.certifiedOptimal,'finite primal dual');ck(r.mongeBestCost.value===1.125&&r.mongeGap.value===.375,'atomic relaxation');ck(r.line.W1.value===.75&&r.line.W2Squared.value===.8125,'line costs');
const run=id=>snapshot(PRESETS.find(p=>p.id===id).values).result;
r=run('split');ck(r.mongeBestCost===null&&r.optimal.primal.value===1,'Monge infeasible');r=run('false-zero');ck(r.candidate.gap.value===0&&!r.candidate.certifiedOptimal,'false zero');r=run('negative-plan');ck(r.candidate.balanced&&!r.candidate.nonnegative,'signed fake plan');r=run('closure-stalls');ck(r.repair.afterTwo.dual.value===.25&&!r.repair.afterTwo.certifiedOptimal,'closure not optimum');r=run('cycle');ck(r.optimal.primal.value===.5&&r.candidate.primal.value===2,'three cycle');r=run('separated');ck(r.optimalVertexCount===2&&!r.uniqueOptimalPlan,'nonunique distance');r=run('strict');ck(r.uniqueOptimalPlan&&r.optimal.primal.value===4,'strict convex');r=run('line-zero');ck(r.line.intervals.length===0&&r.line.W1.value===0,'single point');r=run('tiny');ck(r.optimal.edges.some(e=>e.mass.value===.000001),'tiny mass preserved');return{status:'PASS',checks};}
return{DEFAULTS,PRESETS,QUESTIONS,config,snapshot,rat,pack,decimal,inputs,certificate,treeBasis,solve,monge,transform,lineTransport,plots,ledgers,fmt,svg,mount,selfTest};
});
