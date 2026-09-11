(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root&&root.CourseLearning)root.CourseLearning.register('sinkhorn',api.mount);})(typeof window!=='undefined'?window:globalThis,function(){
"use strict";
const abs=n=>n<0n?-n:n;
function gcd(a,b){a=abs(a);b=abs(b);while(b){const t=a%b;a=b;b=t;}return a;}
function rat(n,d=1n){if(d===0n)throw Error('分母为零');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return{n:n/g,d:d/g};}
const ZERO=rat(0n),ONE=rat(1n),add=(a,b)=>rat(a.n*b.d+b.n*a.d,a.d*b.d),sub=(a,b)=>rat(a.n*b.d-b.n*a.d,a.d*b.d),mul=(a,b)=>rat(a.n*b.n,a.d*b.d),div=(a,b)=>rat(a.n*b.d,a.d*b.n),cmp=(a,b)=>a.n*b.d-b.n*a.d,neg=a=>rat(-a.n,a.d),ar=a=>rat(abs(a.n),a.d),sum=xs=>xs.reduce(add,ZERO),key=a=>a.n+'/'+a.d;
function number(q){if(!q.n)return 0;const a=String(abs(q.n)),b=String(q.d),k=16;const [v,e]=((q.n<0n?-1:1)*Number(a.slice(0,k))/Number(b.slice(0,k))).toExponential(16).split('e');return Number(v+'e'+(Number(e)+Math.max(0,a.length-k)-Math.max(0,b.length-k)));}
const pack=q=>({numerator:String(q.n),denominator:String(q.d),value:number(q)});
function fromNumber(x){if(!Number.isFinite(x))throw Error('非有限浮点数');const [m,e0]=String(x).split('e'),e=Number(e0||0),[u,v='']=m.replace('-','').split('.'),n=BigInt(u+v)*(x<0?-1n:1n),power=e-v.length;return power>=0?rat(n*10n**BigInt(power)):rat(n,10n**BigInt(-power));}
function decimal(value,label,lo=-1000000,hi=1000000){if(typeof value!=='string'&&typeof value!=='number')throw Error(label+'须为十进制数');const s=String(value).trim();if(!/^-?(?:\d+(?:\.\d{1,6})?|\.\d{1,6})$/.test(s))throw Error(label+'须为最多6位小数（不接受指数记法）');const x=Number(s);if(!Number.isFinite(x)||x<lo||x>hi)throw Error(label+'超出范围');const v=s.replace('-','').split('.'),d=10n**BigInt((v[1]||'').length),n=BigInt(v[0]||'0')*d+BigInt(v[1]||'0');return rat(s[0]==='-'?-n:n,d);}
function list(value,label,lo=-1000000,hi=1000000){if(typeof value!=='string'||value.length>512)throw Error(label+'须为逗号分隔列表');const xs=value.split(',');if(xs.length<1||xs.length>4)throw Error(label+'需要1–4项');return xs.map(x=>decimal(x,label,lo,hi));}
function matrix(value,label,m,n,lo=-1000000,hi=1000000){if(typeof value!=='string'||value.length>2048)throw Error(label+'须为分号分行、逗号分列');const rows=value.split(';').map(x=>list(x,label,lo,hi));if(rows.length!==m||rows.some(row=>row.length!==n))throw Error(label+'形状与边缘不一致');return rows;}

const zeros=(m,n)=>Array.from({length:m},()=>Array(n).fill(ZERO)),pm=P=>P.map(row=>row.map(pack));
function cost(P,C){return sum(P.flatMap((row,i)=>row.map((v,j)=>mul(v,C[i][j]))));}

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
const DEFAULTS={mode:'iterate',metric:'quadratic',a:'0.5,0.3,0.2',b:'0.2,0.3,0.5',x:'0,1,2',y:'0,1,2',costs:'0,1,4;1,0,1;4,1,0',epsilon:'0.8',steps:'20'};
function probability(s,name){const a=list(s,name,0,1);if(a.length>3)throw Error(name+'最多3项');if(cmp(sum(a),ONE)!==0n)throw Error(name+'必须精确合计1，不自动归一化');return a;}
function config(raw={}){if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('参数须为对象');const c={...DEFAULTS,...raw};if(!['iterate','bias','underflow'].includes(c.mode))throw Error('未知实验');if(!['quadratic','custom'].includes(c.metric))throw Error('未知成本');if(c.mode==='bias'&&c.metric!=='quadratic')throw Error('去偏实验需要同一一维空间的平方成本');const a=probability(c.a,'源质量'),b=probability(c.b,'目标质量');if(c.metric==='quadratic'){const x=list(c.x,'源位置',-5,5),y=list(c.y,'目标位置',-5,5);if(x.length!==a.length||y.length!==b.length)throw Error('位置数与质量数不符');if(new Set(x.map(key)).size!==x.length||new Set(y.map(key)).size!==y.length)throw Error('同侧重复位置须先合并');}else matrix(c.costs,'成本',a.length,b.length,0,100);decimal(c.epsilon,'ε',0.0001,100);if(typeof c.steps!=='string'&&typeof c.steps!=='number')throw Error('轮数须为整数');if(!/^\d{1,3}$/.test(String(c.steps))||Number(c.steps)>100)throw Error('轮数须为0到100的整数');return c;}
function inputs(c){const a=probability(c.a,'源质量'),b=probability(c.b,'目标质量'),x=c.metric==='quadratic'?list(c.x,'源位置'):null,y=c.metric==='quadratic'?list(c.y,'目标位置'):null,C=x?x.map(v=>y.map(w=>mul(sub(v,w),sub(v,w)))):matrix(c.costs,'成本',a.length,b.length);return{a,b,x,y,C};}
const total=xs=>xs.reduce((a,b)=>a+b,0),maxAbs=xs=>Math.max(0,...xs.map(Math.abs)),l1=xs=>total(xs.map(Math.abs));
function lse(xs){const m=Math.max(...xs);return m+Math.log(total(xs.map(x=>Math.exp(x-m))));}
function margins(P,a,b){const rows=P.map(total),columns=b.map((_,j)=>total(P.map(r=>r[j]))),rowResiduals=rows.map((v,i)=>v-a[i]),columnResiduals=columns.map((v,j)=>v-b[j]);return{rows,columns,rowResiduals,columnResiduals,mass:total(rows),maxResidual:maxAbs(rowResiduals.concat(columnResiduals)),l1Residual:l1(rowResiduals)+l1(columnResiduals)};}
function entropyObjective(P,C,a,b,epsilon){let transport=0,kl=0;for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++){const p=P[i][j];transport+=p*C[i][j];if(p>0)kl+=p*(Math.log(p)-Math.log(a[i])-Math.log(b[j]));}const mass=total(P.flat()),generalizedKL=kl-mass+1;return{transport,kl,generalizedKL,regularized:transport+epsilon*generalizedKL};}
function state(f,g,a,b,C,epsilon,iteration,phase){const logs=a.map((v,i)=>b.map((w,j)=>v>0&&w>0?Math.log(v)+Math.log(w)+(f[i]+g[j]-C[i][j])/epsilon:null)),plan=logs.map(r=>r.map(v=>v===null?0:Math.exp(v))),m=margins(plan,a,b),obj=entropyObjective(plan,C,a,b,epsilon),dual=total(f.map((v,i)=>v===null?0:a[i]*v))+total(g.map((v,j)=>v===null?0:b[j]*v))+epsilon*(1-m.mass);return{iteration,phase,f:f.slice(),g:g.slice(),logs,plan,...m,...obj,dual,underflows:logs.flat().filter(v=>v!==null&&Math.exp(v)===0).length};}
function logRun(a,b,C,epsilon,steps,keep=true){let f=a.map(v=>v>0?0:null),g=b.map(v=>v>0?0:null);const history=[],save=(k,p)=>{const s=state(f,g,a,b,C,epsilon,k,p);if(keep)history.push(s);return s;};let current=save(0,'initial');for(let k=1;k<=steps;k++){
 f=f.map((_,i)=>a[i]>0?-epsilon*lse(b.flatMap((v,j)=>v>0?[Math.log(v)+(g[j]-C[i][j])/epsilon]:[])):null);let shift=total(f.map((v,i)=>v===null?0:a[i]*v));f=f.map(v=>v===null?null:v-shift);g=g.map(v=>v===null?null:v+shift);current=save(k,'row');
 g=g.map((_,j)=>b[j]>0?-epsilon*lse(a.flatMap((v,i)=>v>0?[Math.log(v)+(f[i]-C[i][j])/epsilon]:[])):null);shift=total(f.map((v,i)=>v===null?0:a[i]*v));f=f.map(v=>v===null?null:v-shift);g=g.map(v=>v===null?null:v+shift);current=save(k,'column');
 }return{history,current};}
// Exact rational repair of the decimal rendering of the floating-point iterate.
// It certifies this repaired discrete plan, not the transcendental Sinkhorn optimum.
function roundedCertificate(a,b,C,P,f){const F=P.map(r=>r.map(fromNumber)),rows=F.map(sum),rowScale=rows.map((v,i)=>!v.n?ONE:cmp(v,a[i])>0n?div(a[i],v):ONE),rowCapped=F.map((r,i)=>r.map(v=>mul(v,rowScale[i]))),cols=b.map((_,j)=>sum(rowCapped.map(r=>r[j]))),columnScale=cols.map((v,j)=>!v.n?ONE:cmp(v,b[j])>0n?div(b[j],v):ONE),capped=rowCapped.map(r=>r.map((v,j)=>mul(v,columnScale[j]))),dr=a.map((v,i)=>sub(v,sum(capped[i]))),dc=b.map((v,j)=>sub(v,sum(capped.map(r=>r[j])))),deficit=sum(dr);if(cmp(deficit,sum(dc))!==0n||dr.concat(dc).some(v=>v.n<0n))throw Error('精确补账余量错误');const Q=capped.map((r,i)=>r.map((v,j)=>add(v,deficit.n?div(mul(dr[i],dc[j]),deficit):ZERO))),phi=f.map(v=>v===null?ZERO:fromNumber(v)),psi=b.map((_,j)=>C.map((r,i)=>sub(r[j],phi[i])).reduce((u,v)=>cmp(u,v)<0n?u:v)),slack=C.map((r,i)=>r.map((v,j)=>sub(sub(v,phi[i]),psi[j]))),upper=cost(Q,C),lower=add(sum(a.map((v,i)=>mul(v,phi[i]))),sum(b.map((v,j)=>mul(v,psi[j])))),gap=sub(upper,lower),delta=sum(Q.flatMap((r,i)=>r.map((v,j)=>ar(sub(v,F[i][j]))))),residual=sum(rows.map((v,i)=>ar(sub(v,a[i]))).concat(b.map((v,j)=>ar(sub(sum(F.map(r=>r[j])),v))))),identity=cmp(gap,cost(Q,slack))===0n;
 if(Q.some((r,i)=>cmp(sum(r),a[i])!==0n)||b.some((v,j)=>cmp(sum(Q.map(r=>r[j])),v)!==0n)||slack.flat().some(v=>v.n<0n)||!identity||cmp(delta,mul(rat(2n),residual))>0n)throw Error('精确可行证书失败');return{input:pm(F),rowScale:rowScale.map(pack),rowCapped:pm(rowCapped),columnScale:columnScale.map(pack),capped:pm(capped),rowDeficit:dr.map(pack),columnDeficit:dc.map(pack),deficit:pack(deficit),plan:pm(Q),phi:phi.map(pack),psi:psi.map(pack),slacks:pm(slack),upper:pack(upper),lower:pack(lower),gap:pack(gap),l1Change:pack(delta),inputL1Residual:pack(residual),roundingBound:pack(mul(rat(2n),residual)),identity,certifiedFeasible:true,certifiedOptimal:gap.n===0n};}
function naiveRun(a,b,C,epsilon,steps){const K=C.map(r=>r.map(v=>Math.exp(-v/epsilon))),u=a.map(()=>1),v=b.map(()=>1);let plan=a.map((p,i)=>b.map((q,j)=>p*q*K[i][j])),completed=0,failure=null;for(let k=1;k<=steps;k++){for(let i=0;i<a.length;i++){if(!a[i]){u[i]=0;continue;}const d=total(b.map((p,j)=>p*K[i][j]*v[j]));if(!(d>0)&&!failure)failure={iteration:k,phase:'row',index:i,reason:'zero-denominator'};else if(!Number.isFinite(1/d)&&!failure)failure={iteration:k,phase:'row',index:i,reason:'nonfinite-scaling'};if(failure)break;u[i]=1/d;}if(failure)break;for(let j=0;j<b.length;j++){if(!b[j]){v[j]=0;continue;}const d=total(a.map((p,i)=>p*K[i][j]*u[i]));if(!(d>0)&&!failure)failure={iteration:k,phase:'column',index:j,reason:'zero-denominator'};else if(!Number.isFinite(1/d)&&!failure)failure={iteration:k,phase:'column',index:j,reason:'nonfinite-scaling'};if(failure)break;v[j]=1/d;}if(failure)break;const next=a.map((p,i)=>b.map((q,j)=>p*q*u[i]*K[i][j]*v[j]));if(next.flat().some(x=>!Number.isFinite(x))){failure={iteration:k,phase:'plan',index:-1,reason:'nonfinite-plan'};break;}plan=next;completed=k;}return{kernel:K,kernelLogs:C.map(r=>r.map(v=>-v/epsilon)),kernelUnderflows:K.flat().filter(v=>v===0).length,completed,failure,plan,...margins(plan,a,b)};}
function regularizedEvidence(a,b,C,epsilon,steps,keep){const an=a.map(number),bn=b.map(number),Cn=C.map(r=>r.map(number)),run=logRun(an,bn,Cn,epsilon,steps,keep),certificate=roundedCertificate(a,b,C,run.current.plan,run.current.f),Q=certificate.plan.map(r=>r.map(p=>p.value)),obj=entropyObjective(Q,Cn,an,bn,epsilon),dual=run.current.dual;return{...run,certificate,roundedObjective:obj,regularizedDual:dual,numericalGap:obj.regularized-dual,numericalMidpoint:(obj.regularized+dual)/2};}
function snapshot(raw={}){const c=config(raw),{a,b,x,y,C}=inputs(c),epsilon=number(decimal(c.epsilon,'ε')),steps=Number(c.steps),an=a.map(number),bn=b.map(number),Cn=C.map(r=>r.map(number)),solution=solve(a,b,C),exact={cost:pack(solution.best.primal),plan:pm(solution.best.P),phi:solution.bestDual.phi.map(pack),psi:solution.bestDual.psi.map(pack),vertices:solution.vertices.length,optimalVertices:solution.vertices.filter(v=>cmp(v.cost,solution.best.primal)===0n).length},run=regularizedEvidence(a,b,C,epsilon,steps,true),naive=naiveRun(an,bn,Cn,epsilon,steps),Ha=-total(an.filter(v=>v>0).map(v=>v*Math.log(v))),Hb=-total(bn.filter(v=>v>0).map(v=>v*Math.log(v))),bound=epsilon*Math.min(Ha,Hb);let sweep=null;
 if(c.mode==='bias'){const epsilons=[...new Set([.25,.5,1,2,4].map(v=>Math.min(100,Math.max(.0001,epsilon*v))))].sort((a,b)=>a-b),xx=x.map(v=>x.map(w=>mul(sub(v,w),sub(v,w)))),yy=y.map(v=>y.map(w=>mul(sub(v,w),sub(v,w))));sweep=epsilons.map(e=>{const ab=regularizedEvidence(a,b,C,e,steps,false),aa=regularizedEvidence(a,a,xx,e,steps,false),bb=regularizedEvidence(b,b,yy,e,steps,false),estimate=ab.numericalMidpoint-.5*aa.numericalMidpoint-.5*bb.numericalMidpoint,lower=ab.regularizedDual-.5*aa.roundedObjective.regularized-.5*bb.roundedObjective.regularized,upper=ab.roundedObjective.regularized-.5*aa.regularizedDual-.5*bb.regularizedDual;return{epsilon:e,ab,aa,bb,estimate,lower,upper,width:upper-lower,maxResidual:Math.max(ab.current.maxResidual,aa.current.maxResidual,bb.current.maxResidual),biasBound:e*Math.min(Ha,Hb)};});}
 return{parameters:c,result:{source:a.map(pack),target:b.map(pack),sourcePositions:x&&x.map(pack),targetPositions:y&&y.map(pack),costs:pm(C),epsilon,steps,sourceEntropy:Ha,targetEntropy:Hb,exact,asymptoticTransportBiasBound:bound,run,naive,naivePlanDifference:naive.failure?null:l1(naive.plan.flat().map((v,k)=>v-run.current.plan.flat()[k])),sweep}};}
const PRESETS=[
{id:'default',label:'三仓库交替补账',values:{}},
{id:'initial',label:'未迭代的核不是耦合',values:{steps:'0'}},
{id:'one-round',label:'一轮后列齐行未齐',values:{steps:'1'}},
{id:'slow',label:'小ε还没收敛',values:{epsilon:'0.01',steps:'100'}},
{id:'tiny',label:'保留百万分之一质量',values:{a:'0.000001,0.499999,0.5',b:'0.5,0.499999,0.000001'}},
{id:'zero',label:'零质量剥离再放回',values:{a:'0,0.5,0.5',b:'0.5,0,0.5'}},
{id:'one-to-many',label:'一点必须分三份',values:{a:'1',x:'0',b:'0.2,0.3,0.5',y:'-1,0,2',steps:'1'}},
{id:'unequal',label:'两行三列',values:{a:'0.3,0.7',x:'0,2',b:'0.2,0.3,0.5',y:'-1,0,2'}},
{id:'tie',label:'同价时选择独立耦合',values:{metric:'custom',costs:'2,2,2;2,2,2;2,2,2',steps:'1'}},
{id:'large',label:'大ε与独立耦合',values:{epsilon:'100',steps:'20'}},
{id:'bias',label:'三个目标一起去偏',values:{mode:'bias',steps:'50'}},
{id:'bias-same',label:'相同分布自成本非零',values:{mode:'bias',b:'0.5,0.3,0.2',steps:'50'}},
{id:'bias-point',label:'两个点质量的去偏',values:{mode:'bias',a:'1',b:'1',x:'-1',y:'1',steps:'1'}},
{id:'bias-unresolved',label:'只算一轮能判去偏吗',values:{mode:'bias',epsilon:'0.02',steps:'1'}},
{id:'underflow-all',label:'核全下溢仍可补账',values:{mode:'underflow',metric:'custom',costs:'100,100,100;100,100,100;100,100,100',epsilon:'0.0001',steps:'2'}},
{id:'underflow-partial',label:'核留对角却配不平',values:{mode:'underflow',epsilon:'0.0001',steps:'100'}},
{id:'underflow-reference',label:'常规ε两种实现对照',values:{mode:'underflow'}},
{id:'one',label:'单格精确可行',values:{a:'1',b:'1',x:'-5',y:'5',epsilon:'0.0001',steps:'1'}}
];
const QUESTIONS=[['只看列边缘为零误差，能判定耦合可行吗？',['还要检查行边缘和非负性','能，列和已经足够'],0],['有限步熵目标就是原始OT成本吗？',['要区分目标、可行性与正则化偏差','是同一个量'],0],['核值显示0，是否证明那条路的最优质量严格为0？',['可能只是浮点下溢，应查看log质量','是，计算机的0就是数学的0'],0],['自成本相减后，任意矩阵都会产生一个距离吗？',['还需要成本/核的条件，且不自动满足三角不等式','是，相减就得到距离'],0]];
const BLUE='#268bd2',ORANGE='#cb6a16',GREEN='#29966c',VIOLET='#9966bb',ROSE='#b44a72';
const series=(key,label,color,points,line=true)=>({key,label,color,points,line});
function chart(title,x,y,ss,range=null){const xx=ss.flatMap(s=>s.points.map(z=>z[0])),yy=ss.flatMap(s=>s.points.map(z=>z[1]));let xmin=range?range[0]:Math.min(0,...xx),xmax=range?range[1]:Math.max(0,...xx),ymin=Math.min(0,...yy),ymax=Math.max(0,...yy);if(xmax===xmin)xmax=xmin+1;const pad=(ymax-ymin||1)*.08;ymin-=pad;ymax+=pad;return{type:'chart',title,x,y,series:ss,xmin,xmax,ymin,ymax,markers:[],xTicks:x.startsWith('半步')?[...new Set(Array.from({length:5},(_,i)=>Math.round(xmin+(xmax-xmin)*i/4)))]:x.startsWith('0=')?[0,1,2]:undefined};}
function heat(title,P,logs,kind){return{type:'heat',title,kind,rows:P.length,columns:P[0].length,series:[],cells:P.flatMap((r,i)=>r.map((v,j)=>({i,j,value:v,log:logs[i][j],underflow:logs[i][j]!==null&&v===0}))),note:'每格第一行为浮点值，第二行为自然对数；填色透明度等于值（0到1），不另行归一化。'};}
function plots(d){const r=d.result,h=r.run.history,current=r.run.current,cert=r.run.certificate,n=Math.max(1,2*r.steps),points=f=>h.map((z,k)=>[k,f(z)]),residual=()=>chart('两个半步：一张账齐，另一张可能偏','半步编号：奇数行缩放，偶数列缩放','最大绝对边缘残差',[series('rows','行残差',BLUE,points(z=>maxAbs(z.rowResiduals))),series('columns','列残差',ORANGE,points(z=>maxAbs(z.columnResiduals)))],[0,n]),bracket=()=>chart('原始运输成本：精确可行上下界','0=下界；1=精确LP；2=修复计划成本','同一线性成本，分数原值见表',[series('bracket','可行证书范围',GREEN,[[0,cert.lower.value],[2,cert.upper.value]],false),series('exact','精确LP最优值',ORANGE,[[0,r.exact.cost.value],[2,r.exact.cost.value]]),series('three','三个成本读数',BLUE,[[0,cert.lower.value],[1,r.exact.cost.value],[2,cert.upper.value]],false)],[0,2]);
 const first=heat('当前log迭代矩阵：先检查边缘再称耦合',current.plan,current.logs,'plan');
 if(d.parameters.mode==='bias'){const z=r.sweep,lo=z[0].epsilon,hi=z[z.length-1].epsilon;return[first,chart('三份完整KL正则化目标的数值中点','ε（线性坐标）','跨分布与两个自分布',[series('ab','跨分布目标',BLUE,z.map(q=>[q.epsilon,q.ab.numericalMidpoint])),series('aa','源自成本',ORANGE,z.map(q=>[q.epsilon,q.aa.numericalMidpoint])),series('bb','目标自成本',GREEN,z.map(q=>[q.epsilon,q.bb.numericalMidpoint]))],[lo,hi]),chart('去偏估计与三份误差合成的数值端点','ε（线性坐标）','不含严格浮点区间保证',[series('estimate','去偏估计',BLUE,z.map(q=>[q.epsilon,q.estimate])),series('lower','数值下端',ORANGE,z.map(q=>[q.epsilon,q.lower])),series('upper','数值上端',GREEN,z.map(q=>[q.epsilon,q.upper]))],[lo,hi]),chart('三份问题的最大边缘残差','ε（线性坐标）','固定轮数，不宣称全已收敛',[series('residual','三份最大残差',VIOLET,z.map(q=>[q.epsilon,q.maxResidual]))],[lo,hi])];}
 if(d.parameters.mode==='underflow')return[first,heat('直接指数化的核：0可能来自下溢',r.naive.kernel,r.naive.kernelLogs,'kernel'),residual(),bracket()];
 return[first,residual(),chart('完整熵目标的对偶进展与修复上端','半步编号','浮点诊断；不与原始OT目标混用',[series('dual','熵对偶值',BLUE,points(z=>z.dual)),series('upper','最后修复计划的熵目标',GREEN,[[0,r.run.roundedObjective.regularized],[n,r.run.roundedObjective.regularized]])],[0,n]),bracket()];
}
const WORDS={numerator:'分子',denominator:'分母',value:'近似值',source:'源质量',target:'目标质量',sourcePositions:'源位置',targetPositions:'目标位置',costs:'成本矩阵',epsilon:'ε',steps:'完整轮数',sourceEntropy:'源熵',targetEntropy:'目标熵',asymptoticTransportBiasBound:'仅对已求得熵最优计划的运输偏差界',exact:'原始LP精确结果',cost:'成本',plan:'计划矩阵',phi:'源势',psi:'目标势',vertices:'可行顶点数',optimalVertices:'最优顶点数',naivePlanDifference:'直接法与log法最终计划L1差（失败时不比）',iteration:'轮数',phase:'阶段',initial:'初始',row:'行缩放',column:'列缩放',f:'log源势',g:'log目标势',logs:'自然对数质量',rows:'行和',columns:'列和',rowResiduals:'行残差',columnResiduals:'列残差',mass:'总质量',maxResidual:'最大边缘残差',l1Residual:'两侧L1残差和',transport:'运输部分',kl:'原始对数和',generalizedKL:'广义KL',regularized:'广义KL完整目标',dual:'熵对偶值',underflows:'活跃格质量下溢数',input:'精确十进制输入',rowScale:'行削减系数',rowCapped:'行削减后',columnScale:'列削减系数',capped:'两次削减后',rowDeficit:'行缺口',columnDeficit:'列缺口',deficit:'总缺口',slacks:'精确对偶余量',upper:'上端',lower:'下端',gap:'精确原始成本上界减下界',l1Change:'精确修复L1改变量',inputL1Residual:'精确输入两侧L1残差',roundingBound:'两倍输入残差',identity:'精确加权余量恒等式',certifiedFeasible:'修复计划精确可行',certifiedOptimal:'该原始成本证书精确最优',roundedObjective:'修复计划熵目标（浮点）',regularizedDual:'熵对偶下端（浮点）',numericalGap:'熵目标数值上端减下端',numericalMidpoint:'熵目标数值中点',kernel:'直接指数核',kernelLogs:'自然对数核',kernelUnderflows:'核下溢格数',completed:'直接法完成轮数',failure:'直接法失败位置',index:'编号',reason:'原因','zero-denominator':'分母为零','nonfinite-scaling':'缩放值非有限','nonfinite-plan':'计划非有限',estimate:'去偏估计',width:'数值上端减下端（保留舍入符号）',biasBound:'熵最优计划渐近运输偏差界',rowIndex:'源编号',columnIndex:'目标编号',logMass:'log质量',floatMass:'浮点质量',roundedMass:'精确修复质量',costEntry:'每单位成本',slackEntry:'精确余量',afterRow:'第一次削减质量',afterColumn:'第二次削减质量'};
function fmt(v){if(v===null||v===undefined)return'—';if(typeof v==='boolean')return v?'是':'否';if(typeof v==='number'){if(!Number.isFinite(v))throw Error('非有限值');return v===0?'0':Math.abs(v)<1e-4||Math.abs(v)>=1e6?v.toExponential(8):String(Number(v.toPrecision(10)));}if(typeof v==='object')return Array.isArray(v)?'['+v.map(fmt).join('；')+']':Object.entries(v).map(([k,z])=>(WORDS[k]||k)+'='+fmt(z)).join('；');return WORDS[v]||String(v);}
function summaryTable(key,title,r,exclude=[]){return{key,title,headers:['量','完整记录'],rows:Object.entries(r).filter(([k])=>!exclude.includes(k)).map(([k,v])=>[WORDS[k]||k,v])};}
function recordTable(key,title,rows){const keys=rows.length?Object.keys(rows[0]):[];return{key,title,headers:keys.map(k=>WORDS[k]||k),rows:rows.map(z=>keys.map(k=>z[k]))};}
function runLedgers(key,title,run,C){const z=run.current,t=run.certificate,cells=z.plan.flatMap((row,i)=>row.map((v,j)=>({rowIndex:i,columnIndex:j,costEntry:C[i][j],floatMass:v,logMass:z.logs[i][j],afterRow:t.rowCapped[i][j],afterColumn:t.capped[i][j],roundedMass:t.plan[i][j],slackEntry:t.slacks[i][j]})));return[summaryTable(key+'-state',title+'：当前状态与熵数值诊断',{...z,roundedObjective:run.roundedObjective,regularizedDual:run.regularizedDual,numericalGap:run.numericalGap,numericalMidpoint:run.numericalMidpoint}),summaryTable(key+'-certificate',title+'：精确补账与原始成本证书',t),recordTable(key+'-cells',title+'：每个格子的前后变化',cells)];}
function ledgers(d){const r=d.result,out=[summaryTable('summary','输入、原始精确基准与偏差边界',r,['run','naive','sweep']),...runLedgers('current','当前ε',r.run,r.costs),recordTable('history','每一轮的两个半步：完整矩阵、势与边缘',r.run.history),summaryTable('naive','直接核计算的完整结果与失败位置',r.naive)];if(r.sweep){out.push(recordTable('sweep','去偏扫描：三个问题的数值端点',r.sweep.map(z=>({epsilon:z.epsilon,estimate:z.estimate,lower:z.lower,upper:z.upper,width:z.width,maxResidual:z.maxResidual,biasBound:z.biasBound}))));for(const[zindex,z]of r.sweep.entries()){for(const[k,title,coords]of [['ab','跨分布',null],['aa','源自分布',r.sourcePositions],['bb','目标自分布',r.targetPositions]]){const C=coords?coords.map(v=>coords.map(w=>pack(mul(sub(rat(BigInt(v.numerator),BigInt(v.denominator)),rat(BigInt(w.numerator),BigInt(w.denominator))),sub(rat(BigInt(v.numerator),BigInt(v.denominator)),rat(BigInt(w.numerator),BigInt(w.denominator))))))):r.costs;out.push(...runLedgers('sweep-'+zindex+'-'+k,'ε='+fmt(z.epsilon)+' '+title,z[k],C));}}}return out;}
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const tick=v=>v===0?"0":Math.abs(v)<1e-3||Math.abs(v)>=1e4?v.toExponential(2):String(Number(v.toPrecision(4)));
 function curveSvg(q){
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

 function svg(q){if(q.type!=='heat')return curveSvg(q);const left=190,top=90,cw=150,ch=75;let s='<svg xmlns="http://www.w3.org/2000/svg" width="900" height="425" role="img" aria-label="'+esc(q.title)+'"><title>'+esc(q.title)+'</title><text x="25" y="32" font-size="22">'+esc(q.title)+'</text><text x="25" y="65">'+esc(q.kind==='kernel'?'K=exp(−C/ε)，不是运输质量':'P浮点质量；先看边缘残差')+'</text>';
 for(let i=0;i<q.rows;i++)s+='<text x="175" y="'+(top+i*ch+40)+'" text-anchor="end">源 '+i+'</text>';
 for(let j=0;j<q.columns;j++)s+='<text x="'+(left+(j+.5)*cw)+'" y="'+(top+q.rows*ch+26)+'" text-anchor="middle">目标 '+j+'</text>';
 for(const c of q.cells){const x=left+c.j*cw,y=top+c.i*ch;s+='<rect data-cell="'+c.i+'-'+c.j+'" x="'+x+'" y="'+y+'" width="'+cw+'" height="'+ch+'" fill="'+BLUE+'" fill-opacity="'+c.value+'" stroke="currentColor" stroke-opacity=".35"/><text x="'+(x+cw/2)+'" y="'+(y+28)+'" text-anchor="middle">'+esc(tick(c.value))+'</text><text x="'+(x+cw/2)+'" y="'+(y+53)+'" text-anchor="middle" font-size="13">ln='+esc(c.log===null?'—':tick(c.log))+'</text>';}
 return s+'<text x="25" y="380">'+esc('颜色强度=v；小值看科学记数。0且ln有限表示下溢。')+'</text></svg>';}

 const STYLE=".sinkhorn154{color:var(--fg,#273646)}.sinkhorn154 .sinkhorn-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}.sinkhorn154 label{display:flex;flex-direction:column;gap:6px}.sinkhorn154 input,.sinkhorn154 select{font:inherit;padding:8px;max-width:100%;background:var(--bg,#fff);color:inherit;border:1px solid #8b98a0;border-radius:5px}.sinkhorn154 button{font:inherit;padding:8px 12px;margin:5px;cursor:pointer}.sinkhorn154 button[aria-pressed=true]{outline:3px solid #478aaa}.sinkhorn154 .sinkhorn-scroll{overflow:auto;max-width:100%;margin:16px 0}.sinkhorn154 .sinkhorn-scroll:focus{outline:3px solid #478aaa}.sinkhorn154 .sinkhorn-ledger{max-height:420px}.sinkhorn154 svg{width:900px!important;max-width:none!important;display:block;fill:currentColor;font:16px system-ui}.sinkhorn154 table{display:table;overflow:visible;width:max-content;max-width:none;min-width:900px;border-collapse:collapse;font-variant-numeric:tabular-nums}.sinkhorn154 th,.sinkhorn154 td{padding:9px;border:1px solid #98a4ab;text-align:left;white-space:nowrap}.sinkhorn154 .sinkhorn-error{color:#c74b39}.sinkhorn154 [hidden]{display:none!important}.sinkhorn154 fieldset{margin:16px 0;padding:12px}.sinkhorn154 details{margin:16px 0}.sinkhorn154 summary{cursor:pointer;font-weight:600}.sinkhorn154 .sinkhorn-legend{font-size:.95em}.sinkhorn154 .sinkhorn-note{line-height:1.7}.sinkhorn154 [hidden]{display:none!important}.sinkhorn154 select{font:inherit;color:var(--fg,#282820);background:var(--bg,#faf7ef);padding:8px;max-width:100%}.sinkhorn154 td{max-width:540px;white-space:normal;overflow-wrap:anywhere}.sinkhorn154 .sinkhorn-controls{min-width:0}.sinkhorn154 input{min-width:0;width:100%;box-sizing:border-box}";
 function mount(container){
  const doc=container.ownerDocument;
  if(!doc.getElementById("sinkhorn154-style")){const style=doc.createElement("style");style.id="sinkhorn154-style";style.textContent=STYLE;doc.head.appendChild(style);}
  const field=(key,label,metrics='quadratic custom')=>'<label data-modes="iterate bias underflow" data-metrics="'+metrics+'">'+label+'<input data-key="'+key+'" type="text"></label>';
  container.innerHTML='<div class="sinkhorn154"><h3>先对平两种边缘，再检查目标误差</h3><p>每个半步留下完整记录；精确分数负责可行补账，log数值负责熵迭代。</p><div class="sinkhorn-presets">'+PRESETS.map(p=>'<button type="button" data-preset="'+p.id+'">'+esc(p.label)+'</button>').join('')+'</div><div class="sinkhorn-controls"><label>实验<select data-key="mode"><option value="iterate">交替缩放与可行证书</option><option value="bias">正则化与去偏扫描</option><option value="underflow">直接核与log下溢对照</option></select></label><label>成本<select data-key="metric"><option value="quadratic">一维平方距离</option><option value="custom">自定义非负矩阵</option></select></label>'+
   field('a','源质量（逗号分隔，精确合计1）')+field('b','目标质量（逗号分隔，精确合计1）')+field('x','源位置（−5至5，同侧不重复）','quadratic')+field('y','目标位置（−5至5，同侧不重复）','quadratic')+field('costs','成本：分号分行、逗号分列（0至100）','custom')+field('epsilon','ε（0.0001至100）')+field('steps','完整轮数（0至100的整数）')+'</div><p>每侧最多3项，质量允许0；小数最多6位，不用指数记法。扫描只接受同一实线的平方成本。满100轮不是收敛标记。</p>'+
   QUESTIONS.map((q,i)=>'<fieldset data-question="'+i+'"><legend>'+(i+1)+'. '+esc(q[0])+'</legend>'+q[1].map((v,j)=>'<button type="button" data-choice="'+j+'" aria-pressed="false">'+esc(v)+'</button>').join("")+'</fieldset>').join("")+
   '<button type="button" data-action="reveal">揭示图与完整账本</button><button type="button" data-action="reset">重置预测</button><p class="sinkhorn-error" role="alert"></p><p role="status"></p><div class="sinkhorn-results" hidden></div></div>';
  const fields=Array.from(container.querySelectorAll("[data-key]")),answers=Array(4).fill(null),result=container.querySelector(".sinkhorn-results"),reveal=container.querySelector("[data-action=reveal]"),feedback=container.querySelector("[role=status]"),error=container.querySelector("[role=alert]");
  fields.forEach(e=>e.value=DEFAULTS[e.dataset.key]);
  let revealed=false,valid=null;
  function render(d){
   const notes={iterate:'蓝橙曲线逐半步显示两种边缘残差。熵对偶与修复熵上端只作浮点诊断；原始运输成本的上下界另用精确分数保证。初始或未对平矩阵不能仅凭热图称为合法耦合。',bias:'每个ε重算跨分布与两个自分布问题，去偏估计取三份数值中点的组合。完整记录保留上端减下端的符号，微小负宽度可能是舍入。三份都未算准时，不能把估计当成精确散度。',underflow:'直接核不偷偷填充分母；失败位置完整显示。log质量可能有限而浮点质量显示0，这不是数学零。稳定计算不意味着已收敛，仍需查看两侧边缘与原始成本范围。'};
   result.innerHTML='<p>'+notes[d.parameters.mode]+'</p>'+
    plots(d).map(q=>'<p>'+q.series.filter((s,i,ss)=>ss.findIndex(t=>t.label===s.label&&t.color===s.color)===i).map(s=>esc(s.label)+'（'+({"#268bd2":"蓝","#cb6a16":"橙","#29966c":"绿","#9966bb":"紫","#b44a72":"玫红"}[s.color])+'）').join("；")+'</p><div class="sinkhorn-scroll" role="region" tabindex="0" aria-label="'+esc(q.title)+'">'+svg(q)+'</div>').join("")+
    ledgers(d).map(t=>'<details data-ledger="'+t.key+'"'+(t.key==="summary"?' open':"")+'><summary>'+esc(t.title)+'（'+t.rows.length+' 行）</summary><div class="sinkhorn-scroll sinkhorn-ledger" role="region" tabindex="0" aria-label="'+esc(t.title)+'"><table data-table="'+t.key+'"><thead><tr>'+t.headers.map(x=>'<th scope="col">'+esc(x)+'</th>').join("")+'</tr></thead><tbody>'+t.rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(fmt(x))+'</td>').join("")+'</tr>').join("")+'</tbody></table></div></details>').join("")+
    '<p>“—”是不适用，不是零。分子分母记录精确补账对象；指数、对数、熵目标与图坐标是近似。横向图表可用键盘滚动；曲线只连接保存的读数。</p>';
  }
  function update(){
   const raw=Object.fromEntries(fields.map(e=>[e.dataset.key,e.value]));
   container.querySelectorAll("[data-modes]").forEach(e=>e.hidden=!e.dataset.modes.split(" ").includes(raw.mode)||!e.dataset.metrics.split(" ").includes(raw.metric));
   try{valid=config(raw);error.textContent="";}catch(e){valid=null;revealed=false;error.textContent=e.message;}
   reveal.disabled=!valid||answers.some(x=>x===null);result.hidden=!revealed;
   if(revealed&&valid)render(snapshot(valid));
   feedback.textContent=revealed?answers.filter((x,i)=>x===QUESTIONS[i][2]).length+" / 4。"+"边缘、目标约定与数值误差分别核对。":"";
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




















function selfTest(){let checks=0;const ck=(v,m)=>{checks++;if(!v)throw Error(m);},run=id=>snapshot(PRESETS.find(p=>p.id===id).values).result;let r=run('initial');ck(r.run.current.mass<1,'initial not coupling');r=run('one-round');ck(maxAbs(r.run.current.columnResiduals)<1e-12&&maxAbs(r.run.current.rowResiduals)>.1,'half steps differ');r=run('tie');ck(r.exact.cost.value===2&&r.run.certificate.upper.value===2,'same costs');r=run('slow');ck(r.run.current.maxResidual>.2,'log not convergence');r=run('underflow-all');ck(r.naive.failure.reason==='zero-denominator','honest failure');ck(r.run.current.maxResidual<1e-12&&r.run.current.underflows===0,'log recovers constant cost');r=run('tiny');ck(r.source[0].value===.000001,'tiny retained');r=run('zero');ck(r.run.current.f[0]===null&&r.run.current.g[1]===null,'inactive potential');r=run('bias-same');ck(r.sweep.every(z=>z.estimate===0),'self debias');r=run('bias-point');ck(r.sweep.every(z=>z.estimate===4),'point debias');r=run('one');ck(r.run.certificate.certifiedOptimal&&r.exact.cost.value===100,'one cell exact');ck(number(fromNumber(5e-324))===5e-324,'subnormal rational conversion');return{status:'PASS',checks};}
return{DEFAULTS,PRESETS,QUESTIONS,config,snapshot,plots,ledgers,fmt,svg,mount,selfTest};
});
