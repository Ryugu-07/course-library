(function(hostWindow){
"use strict";
// Staging numerical core. Field slots are labelled; vertex positions are not trajectories.
const DEFAULT={external:4,vertices:1,rank:0,lambda:.2,order:12,mass:1,energyRatio:1.5,cosTheta:.3};
function config(input={}){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('parameters');
 for(const k of Object.keys(input))if(!Object.prototype.hasOwnProperty.call(DEFAULT,k))throw Error('unknown '+k);
 const p={...DEFAULT,...input};
 for(const k of Object.keys(p))if(typeof p[k]!=='number'||!Number.isFinite(p[k]))throw Error(k);
 if(![0,2,4].includes(p.external)||![0,1,2].includes(p.vertices))throw Error('field count');
 const ranges={lambda:[0,2],order:[0,24],mass:[.2,2],energyRatio:[1,4],cosTheta:[-1,1]};
 for(const [k,[lo,hi]]of Object.entries(ranges))if(p[k]<lo||p[k]>hi)throw Error(k);
 if(!Number.isInteger(p.order)||!Number.isInteger(p.rank)||p.rank<0||p.rank>=doubleFactorial(p.external+4*p.vertices-1))throw Error('integer/rank');
 return p;
}
function factorial(n){let s=1;for(let j=2;j<=n;j++)s*=j;return s;}
function doubleFactorial(n){let s=1;for(let j=n;j>0;j-=2)s*=j;return s;}
function allPairings(nodes){if(!nodes.length)return [[]];const first=nodes[0],out=[];for(let j=1;j<nodes.length;j++){const rest=nodes.slice(1,j).concat(nodes.slice(j+1));for(const tail of allPairings(rest))out.push([[first,nodes[j]],...tail]);}return out;}
function components(size,edges,skip=-1){const seen=new Set(),out=[],adj=Array.from({length:size},()=>[]);edges.forEach(([a,b],i)=>{if(i!==skip){adj[a].push(b);adj[b].push(a);}});for(let v=0;v<size;v++)if(!seen.has(v)){const stack=[v],part=[];seen.add(v);while(stack.length){const a=stack.pop();part.push(a);for(const b of adj[a])if(!seen.has(b)){seen.add(b);stack.push(b);}}out.push(part.sort((a,b)=>a-b));}return out;}
function classify(pairs,E,V,id){
 const owner=n=>n<E?n:E+Math.floor((n-E)/4),edges=pairs.map(([a,b])=>[owner(a),owner(b)]),parts=components(E+V,edges),vacuum=parts.filter(c=>c.every(n=>n>=E));
 const attached=Array.from({length:V},()=>[]),self=Array(V).fill(0),internal=[];let externalEdges=0,cross=0;
 edges.forEach(([a,b],i)=>{if(a<E&&b<E)externalEdges++;else if(a<E||b<E)attached[(a<E?b:a)-E].push(a<E?a:b);else{internal.push(i);if(a===b)self[a-E]++;else cross++;}});
 const connected=parts.length===1,bridges=connected?internal.filter(i=>components(E+V,edges,i).length>1):[];
 const onePI=E>0&&V>0&&connected&&bridges.length===0;
 let category=E===0?(connected?'connected-vacuum':'vacuum-product'):externalEdges?'external-pair':vacuum.length?'vacuum-factor':!connected?'separate-external-blocks':onePI?'onePI':'onePR';
 let channel=null;if(E===4&&V===2&&onePI&&attached.every(x=>x.length===2))channel=attached.map(x=>x.join('')).sort().join('|');
 return {id,pairs,externalEdges,attached,self,cross,components:parts,vacuumComponents:vacuum.length,connected,onePI,bridges,internalEdges:internal.length,loopNumber:connected&&V>0?internal.length-V+1:null,category,channel};
}
const CACHE=new Map();
function wick(E,V){const key=E+','+V;if(CACHE.has(key))return CACHE.get(key);const records=allPairings(Array.from({length:E+4*V},(_,i)=>i)).map((p,i)=>classify(p,E,V,i)),denominator=factorial(V)*24**V,groups=new Map();for(const row of records){const key=[row.category,row.channel||'',row.cross,row.self.slice().sort().join(','),row.attached.map(a=>a.length).sort().join(',')].join(':');if(!groups.has(key))groups.set(key,{key,category:row.category,channel:row.channel,count:0,first:row.id});groups.get(key).count++;}
 const summary=Array.from(groups.values()).map(g=>({...g,denominator,coefficient:g.count/denominator}));const out={external:E,vertices:V,slots:E+4*V,total:records.length,expected:doubleFactorial(E+4*V-1),denominator,summary,records};CACHE.set(key,out);return out;}
function integrate(lambda){
 if(lambda===0)return {value:1,estimatedError:0,tailBound:0,intervals:[],exact:true};
 const f=x=>Math.sqrt(2/Math.PI)*Math.exp(-x*x/2-lambda*x**4/24),rows=[];
 function split(a,b,fa,fm,fb,coarse,tol,depth){const mid=(a+b)/2,l=(a+mid)/2,r=(mid+b)/2,fl=f(l),fr=f(r),left=(mid-a)*(fa+4*fl+fm)/6,right=(b-mid)*(fm+4*fr+fb)/6,fine=left+right,correction=(fine-coarse)/15;if(Math.abs(correction)<=tol||depth>=24){rows.push({a,b,fa,fl,fm,fr,fb,coarse,fine,correction,value:fine+correction,estimatedError:Math.abs(correction),tolerance:tol,depth,converged:Math.abs(correction)<=tol});return;}split(a,mid,fa,fl,fm,left,tol/2,depth+1);split(mid,b,fm,fr,fb,right,tol/2,depth+1);}
 const a=0,b=12,fa=f(a),fm=f(6),fb=f(b);split(a,b,fa,fm,fb,(b-a)*(fa+4*fm+fb)/6,2e-12,0);
 return {value:rows.reduce((s,r)=>s+r.value,0),estimatedError:rows.reduce((s,r)=>s+r.estimatedError,0),tailBound:Math.sqrt(2/Math.PI)*Math.exp(-72)/12,intervals:rows,exact:false};
}
function zeroDimension(lambda,N){const integral=integrate(lambda),series=[];let term=1,sum=0;for(let n=0;n<=N;n++){if(n)term*=-lambda*(4*n-1)*(4*n-3)/(24*n);sum+=term;const ratio=lambda*(4*n+3)*(4*n+1)/(24*(n+1)),next=-term*ratio;series.push({n,term,sum,next,absoluteRatio:ratio,remainderBound:Math.abs(next),numericalError:sum-integral.value});}return {lambda,order:N,integral,series};}
function dot(a,b){return a[0]*b[0]-a.slice(1).reduce((s,x,i)=>s+x*b[i+1],0);}
function scattering(mass,ratio,cosTheta,lambda){
 const energy=mass*ratio,p=mass*Math.sqrt((ratio-1)*(ratio+1)),s=4*energy**2,t=-2*p*p*(1-cosTheta),u=-2*p*p*(1+cosTheta),sn=Math.sqrt(Math.max(0,1-cosTheta*cosTheta));
 const momenta=[[energy,0,0,p],[energy,0,0,-p],[energy,p*sn,0,p*cosTheta],[energy,-p*sn,0,-p*cosTheta]],flux=8*energy*p,phaseDensity=p/(16*Math.PI**2*Math.sqrt(s)),threshold=ratio===1;
 const distinguishable=threshold?null:lambda**2/(64*Math.PI**2*s),identical=threshold?null:lambda**2/(128*Math.PI**2*s),total=threshold?null:lambda**2/(32*Math.PI*s);
 return {mass,ratio,cosTheta,lambda,energy,momentum:p,momenta,onShell:momenta.map(v=>dot(v,v)),conservation:Array.from({length:4},(_,j)=>momenta[0][j]+momenta[1][j]-momenta[2][j]-momenta[3][j]),s,t,u,sum:s+t+u,flux,phaseDensity,threshold,amplitude:-lambda,amplitudeSquared:lambda**2,distinguishable,identical,total,thresholdTotalLimit:lambda**2/(128*Math.PI*mass**2)};
}
function normalization(){
 // Formal Euclidean zero-dimensional coefficients, with all covariances = 1.
 // Division is order-by-order; no finite polynomial ratio is called the full correlator.
 const vacuum=[0,1,2].map(v=>((-1)**v)*wick(0,v).total/(factorial(v)*24**v));
 const out=[2,4].map(E=>{const raw=[0,1,2].map(v=>((-1)**v)*wick(E,v).total/(factorial(v)*24**v)),quotient=[];for(let n=0;n<=2;n++){let q=raw[n];for(let j=1;j<=n;j++)q-=vacuum[j]*quotient[n-j];quotient.push(q);}const noVacuum=[0,1,2].map(v=>((-1)**v)*wick(E,v).records.filter(r=>r.vacuumComponents===0).length/(factorial(v)*24**v)),connected=[0,1,2].map(v=>((-1)**v)*wick(E,v).records.filter(r=>r.connected).length/(factorial(v)*24**v));return {external:E,vacuum,raw,quotient,noVacuum,connected};});
 out[0].cumulant=out[0].quotient.slice();out[1].cumulant=out[1].quotient.map((v,n)=>v-3*Array.from({length:n+1},(_,j)=>out[0].quotient[j]*out[0].quotient[n-j]).reduce((s,x)=>s+x,0));return out;
}
function compute(input={}){const p=config(input),w=wick(p.external,p.vertices),zd=zeroDimension(p.lambda,p.order),cm=scattering(p.mass,p.energyRatio,p.cosTheta,p.lambda);return {schema:'feynman-ledgers-182-v1',parameters:p,wick:w,selected:w.records[p.rank],normalization:normalization(),zeroDimension:zd,scattering:cm,angles:Array.from({length:81},(_,j)=>scattering(p.mass,p.energyRatio,-1+j/40,p.lambda)),energies:Array.from({length:61},(_,j)=>scattering(p.mass,1+j/20,p.cosTheta,p.lambda))};}

const findRank=(E,V,predicate)=>wick(E,V).records.findIndex(predicate);
const TREE=findRank(4,1,r=>r.onePI),FISH=findRank(4,2,r=>r.channel==='01|23');
const PRESETS=[
{key:'tree',label:'24次连接生成一个树顶点',config:{rank:TREE}},
{key:'fish-s',label:'一圈s通道的1/2',config:{vertices:2,rank:FISH}},
{key:'fish-t',label:'交换外腿得到t通道',config:{vertices:2,rank:findRank(4,2,r=>r.channel==='02|13')}},
{key:'onepr',label:'外腿蝌蚪属于1PR',config:{vertices:2,rank:findRank(4,2,r=>r.category==='onePR')}},
{key:'blocks',label:'无真空泡仍可不连通',config:{vertices:2,rank:findRank(4,2,r=>r.category==='separate-external-blocks')}},
{key:'bubble',label:'树图乘真空泡',config:{vertices:2,rank:findRank(4,2,r=>r.category==='vacuum-factor')}},
{key:'vacuum',label:'两顶点连通真空图',config:{external:0,vertices:2,rank:findRank(0,2,r=>r.cross===4)}},
{key:'free',label:'零阶四点也有三种配对',config:{vertices:0}},
{key:'weak',label:'小耦合有限阶近似',config:{external:2,vertices:1,lambda:.01,order:24}},
{key:'divergent',label:'增加阶数反而变差',config:{external:2,vertices:1,lambda:1,order:24}},
{key:'threshold',label:'通量恰为零的边界',config:{rank:TREE,energyRatio:1}},
{key:'zero',label:'耦合为零',config:{external:0,vertices:0,lambda:0,order:0,mass:.2,energyRatio:4,cosTheta:-1}}
];
const QUESTIONS=[
['四个场的时序算符乘积，是否只等于三种完全配对？',['是，Wick定理只有三项','不是，还要加未缩并场的正规序项'],1,'算符恒等式包括无缩并项、单次缩并乘剩余正规序场以及三种完全缩并。只有取自由真空期望后，带剩余正规序场的项才消失。'],
['归一化四点函数去掉真空泡后，是否必定只剩一个连通块？',['不必，两个二点块也可以没有真空分量','必定，分母删掉所有不连通图'],0,'分母消掉没有外部场的真空分量，两个各有外部场的连通块仍保留。要得到四点连通函数还须减掉二点函数乘积。'],
['同种φ⁴的树级2→2，在完整4π立体角积分时能否漏掉末态1/2!？',['不能，交换两末态标签表示同一物理末态','可以，顶点中的4!已经负责末态计数'],0,'顶点缩并重数与末态相空间计数是两件事。这里4π覆盖交换后的重复标签，须乘1/2!；也可选择不重复区域但不能同时再除一次。'],
['零维Gaussian模型的λ>0很小，是否保证微扰级数收敛？',['保证，积分存在就能逐项求和到无穷','不保证，相邻项比最终随阶数增长'],1,'积分有限，但绝对项比λ(4n+3)(4n+1)/(24(n+1))趋向无穷。固定低阶在λ趋零时给渐近近似，不能因此交换无穷求和与积分。']
];
function feedback(i,j){if(!Number.isInteger(i)||i<0||i>=4||![0,1].includes(j))throw Error('prediction');const correct=j===QUESTIONS[i][2];return {correct,text:(correct?'预测正确。':'需要修正。')+QUESTIONS[i][3]};}
function fmt(v){if(v===null)return'不适用';if(Array.isArray(v))return JSON.stringify(v);if(typeof v==='boolean')return v?'是':'否';if(typeof v==='object')return JSON.stringify(v);if(typeof v!=='number')return String(v);if(!Number.isFinite(v))throw Error('nonfinite');if(v===0)return'0';return Math.abs(v)<.0001||Math.abs(v)>=1e6?v.toExponential(5):Number(v.toFixed(6)).toString();}
const COLORS=['#2479bc','#c97906','#23845a','#a33b66'];
function plot(key,title,xLabel,yLabel,series){const ps=series.flatMap(s=>s.points.filter(Boolean)),xs=ps.map(p=>p[0]),ys=ps.map(p=>p[1]);let xMin=xs.length?Math.min(...xs):0,xMax=xs.length?Math.max(...xs):1,yMin=ys.length?Math.min(...ys):0,yMax=ys.length?Math.max(...ys):1;if(xMax===xMin)xMax=xMin+1;const pad=(yMax-yMin||Math.max(1,Math.abs(yMax)))*.08;return {key,title,xLabel,yLabel,xMin,xMax,yMin:yMin-pad,yMax:yMax+pad,series};}
function plots(s){const S=(name,points,color,markersOnly=false)=>({name,points,color,markersOnly,boundaryMarkers:!markersOnly}),E=s.parameters.external,V=s.parameters.vertices,nodes=[];
 const count=E+4*V;for(let j=0;j<count;j++)nodes.push({id:j,label:j<E?'外'+j:'v'+Math.floor((j-E)/4)+'.'+((j-E)%4),x:count>1?50+800*j/(count-1):450,y:300});
 const diagram={key:'diagram',title:'实际缩并 #'+s.selected.id+'：'+s.selected.category,xLabel:'',yLabel:'每条弧是一对编号场槽；方框分组同一相互作用顶点',xMin:0,xMax:900,yMin:0,yMax:540,nodes,external:E,vertices:V,series:s.selected.pairs.map(([a,b])=>S(a+'—'+b,[[nodes[a].x,nodes[a].y],[nodes[b].x,nodes[b].y]],a<E||b<E?COLORS[0]:COLORS[1]))};
 return [diagram,
 plot('groups','拓扑分类：实际重数除Dyson分母','分类编号（对照完整分类表）','实数计数系数，不含传播积分',[S('完整缩并的组合系数',s.wick.summary.map((r,i)=>[i,r.coefficient]),COLORS[0],true)]),
 plot('series','零维模型：有限部分和与数值积分','截断阶 n','asinh(数值)，保持正负并压缩大值',[S('asinh S_n',s.zeroDimension.series.map(r=>[r.n,Math.asinh(r.sum)]),COLORS[0]),S('asinh Z 的数值积分',s.zeroDimension.series.map(r=>[r.n,Math.asinh(s.zeroDimension.integral.value)]),COLORS[1])]),
 plot('error','渐近误差与下一项的理论界','截断阶 n','log10(1+绝对值)，0仍为0',[S('对数值积分的误差',s.zeroDimension.series.map(r=>[r.n,Math.log10(1+Math.abs(r.numericalError))]),COLORS[0]),S('下一项绝对值界',s.zeroDimension.series.map(r=>[r.n,Math.log10(1+r.remainderBound)]),COLORS[1])]),
 plot('angles','交换末态标签：t与u互换','cos θ','Mandelstam不变量（质量单位²）',[S('t',s.angles.map(r=>[r.cosTheta,r.t]),COLORS[0]),S('u',s.angles.map(r=>[r.cosTheta,r.u]),COLORS[1]),S('s+t+u',s.angles.map(r=>[r.cosTheta,r.sum]),COLORS[2])]),
 plot('cross','同种末态树级总截面：阈值留空','每粒子能量 E/m','σ（质量单位⁻²）',[S('λ²/(32πs)，仅E/m>1',s.energies.map(r=>r.total===null?null:[r.ratio,r.total]),COLORS[0]),{...S('上阈值极限（不是阈值读数）',[[1,s.scattering.thresholdTotalLimit]],COLORS[1],true),open:true}])];
}
function tables(s){const w=s.wick,q=s.selected;return[
{key:'parameters',title:'参数：三个模型的适用范围分别读',headers:['参数','值'],rows:Object.entries(s.parameters)},
{key:'groups',title:'全部拓扑分类及Dyson系数',headers:['编号','分类','通道','组合键','重数','分母','系数','首个缩并'],rows:w.summary.map((r,i)=>[i,r.category,r.channel,r.key,r.count,r.denominator,r.coefficient,r.first])},
{key:'pairings',title:'所有缩并：不抽样、不省略',headers:['ID','完整槽配对','外外边','每顶点外腿','自环','跨顶点边','连通分量','真空分量数','全连通','1PI','内边桥编号','内边数','圈数','分类','通道'],rows:w.records.map(r=>[r.id,r.pairs,r.externalEdges,r.attached,r.self,r.cross,r.components,r.vacuumComponents,r.connected,r.onePI,r.bridges,r.internalEdges,r.loopNumber,r.category,r.channel])},
{key:'selected',title:'当前图的全部连线与槽标签',headers:['边ID','槽a','槽b','a所属','b所属','是内边桥'],rows:q.pairs.map(([a,b],i)=>[i,a,b,a<w.external?'外'+a:'v'+Math.floor((a-w.external)/4),b<w.external?'外'+b:'v'+Math.floor((b-w.external)/4),q.bridges.includes(i)])},
{key:'normalization',title:'零维形式级数：消真空因子与取连通函数是两步',headers:['外部数','阶n','分母系数','分子系数','商系数','无真空分量枚举','累积量系数','单个连通块枚举'],rows:s.normalization.flatMap(m=>[0,1,2].map(n=>[m.external,n,m.vacuum[n],m.raw[n],m.quotient[n],m.noVacuum[n],m.cumulant[n],m.connected[n]]))},
{key:'series',title:'零维积分的全部微扰项与余项界',headers:['n','本项','部分和','下一项','绝对项比','下一项界','部分和减数值积分'],rows:s.zeroDimension.series.map(r=>[r.n,r.term,r.sum,r.next,r.absoluteRatio,r.remainderBound,r.numericalError])},
{key:'integral',title:'数值积分的全部自适应子区间（误差估计不是严格证书）',headers:['a','b','f(a)','f(1/4)','f(1/2)','f(3/4)','f(b)','粗Simpson','细Simpson','修正','积分值','估计误差','局部容差','深度','满足容差'],rows:s.zeroDimension.integral.intervals.map(r=>[r.a,r.b,r.fa,r.fl,r.fm,r.fr,r.fb,r.coarse,r.fine,r.correction,r.value,r.estimatedError,r.tolerance,r.depth,r.converged])},
{key:'kinematics',title:'当前四动量、通量与相空间全部读数',headers:['项目','值'],rows:Object.entries(s.scattering).concat([['零维积分Z（数值）',s.zeroDimension.integral.value],['积分误差估计',s.zeroDimension.integral.estimatedError],['|x|>12的Gaussian尾部上界',s.zeroDimension.integral.tailBound]])},
{key:'angles',title:'81个角度的完整四动量与截面',headers:['cosθ','四动量','s','t','u','s+t+u','通量','相空间/立体角','标记末态微分σ','同种末态微分σ','总σ'],rows:s.angles.map(r=>[r.cosTheta,r.momenta,r.s,r.t,r.u,r.sum,r.flux,r.phaseDensity,r.distinguishable,r.identical,r.total])},
{key:'energies',title:'61个能量的阈值、通量与总截面',headers:['E/m','每粒子E','p','s','通量','相空间/立体角','阈值','总σ','上阈值极限'],rows:s.energies.map(r=>[r.ratio,r.energy,r.momentum,r.s,r.flux,r.phaseDensity,r.threshold,r.total,r.thresholdTotalLimit])}];}

function diagramSvg(p){const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));let s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 540" role="img" aria-label="'+esc(p.title)+'"><title>'+esc(p.title)+'</title><style>text{font:16px system-ui;fill:currentColor}</style><text x="30" y="30">'+esc(p.title)+'</text><text x="30" y="65">'+esc(p.yLabel)+'</text>';
for(let v=0;v<p.vertices;v++){const first=p.nodes[p.external+4*v],last=p.nodes[p.external+4*v+3],mid=(first.x+last.x)/2;s+='<rect x="'+(first.x-18)+'" y="279" width="'+(last.x-first.x+36)+'" height="77" rx="10" fill="none" stroke="currentColor" stroke-dasharray="4 5"/><text x="'+mid+'" y="389" text-anchor="middle">顶点 v'+v+' 的4个场槽</text>';}
p.series.forEach((line,i)=>{const[a,b]=line.points,h=35+.15*Math.abs(b[0]-a[0]),mid=(a[0]+b[0])/2,path='M'+a[0]+','+a[1]+' Q'+mid+','+(300-2*h)+' '+b[0]+','+b[1];s+='<path data-series="'+i+'" d="'+path+'" stroke="'+line.color+'" stroke-width="3" fill="none"/>';});
for(const n of p.nodes)s+='<circle cx="'+n.x+'" cy="'+n.y+'" r="7" fill="var(--bg,#fff)" stroke="currentColor" stroke-width="2"/><text x="'+n.x+'" y="330" text-anchor="middle">'+esc(n.label)+'</text>';
if(!p.nodes.length)s+='<text x="450" y="245" text-anchor="middle">零个场槽：空配对有且仅有一种</text>';return s+'<text x="35" y="445">蓝线含外部场；橙线只连内部场槽。弧的交叉不是新顶点。</text><text x="35" y="480">把每个方框收缩为一点，即得到相应拓扑图；弧形仅用于排版。</text></svg>';}

const axisFmt=v=>v===0?'0':Math.abs(v)<.001||Math.abs(v)>=10000?v.toExponential(2):Number(v.toFixed(3)).toString();
function svg(p){if(p.key==='diagram')return diagramSvg(p);const left=100,right=855,top=95,bottom=385,X=v=>left+(v-p.xMin)/(p.xMax-p.xMin)*(right-left),Y=v=>bottom-(v-p.yMin)/(p.yMax-p.yMin)*(bottom-top),esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));let out='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 540" role="img" aria-label="'+esc(p.title)+'"><title>'+esc(p.title)+'</title><style>text{font:15px system-ui;fill:currentColor}</style><text x="30" y="30" font-weight="700">'+esc(p.title)+'</text><text x="25" y="70">'+esc(p.yLabel)+'</text>';
const discrete=['groups','series','error'].includes(p.key);const xticks=discrete?[...new Set(Array.from({length:5},(_,i)=>Math.round(p.xMin+(p.xMax-p.xMin)*i/4)))]:Array.from({length:5},(_,i)=>p.xMin+(p.xMax-p.xMin)*i/4);for(let i=0;i<=4;i++){const x=p.xMin+(p.xMax-p.xMin)*i/4,y=p.yMin+(p.yMax-p.yMin)*i/4;out+='<line x1="100" x2="855" y1="'+Y(y)+'" y2="'+Y(y)+'" stroke="currentColor" opacity=".18"/><text x="85" y="'+(Y(y)+5)+'" text-anchor="end">'+axisFmt(y)+'</text>';}for(const x of xticks){out+='<text x="'+X(x)+'" y="410" text-anchor="middle">'+axisFmt(x)+'</text>';}
out+='<text x="477" y="442" text-anchor="middle">'+esc(p.xLabel)+'</text>';
p.series.forEach((s,i)=>{let pen=false;const path=s.points.map(q=>{if(!q){pen=false;return '';}const d=(pen&&!s.markersOnly?'L':'M')+X(q[0]).toFixed(6)+','+Y(q[1]).toFixed(6);pen=true;return d;}).join(' ');out+='<path data-series="'+i+'" d="'+path+'" stroke="'+s.color+'" stroke-width="2.8" fill="none"/>';const marks=s.markersOnly?s.points.filter(Boolean):s.boundaryMarkers?[...new Set([s.points.find(Boolean),s.points.filter(Boolean).at(-1)])].filter(Boolean):s.points.filter(Boolean).length===1?s.points.filter(Boolean):[];marks.forEach(q=>out+='<circle cx="'+X(q[0])+'" cy="'+Y(q[1])+'" r="'+(s.markerRadius??5)+'" stroke="'+s.color+'" fill="'+(s.hollow?'none':s.open?'var(--bg,#fff)':s.color)+'" stroke-width="'+(s.markerStrokeWidth??2.5)+'"/>');out+='<line x1="'+(40+430*(i%2))+'" x2="'+(60+430*(i%2))+'" y1="'+(473+32*Math.floor(i/2))+'" y2="'+(473+32*Math.floor(i/2))+'" stroke="'+s.color+'" stroke-width="3"/><text x="'+(68+430*(i%2))+'" y="'+(478+32*Math.floor(i/2))+'">'+esc(s.name)+'</text>';});if(!p.series.some(s=>s.points.some(Boolean)))out+='<text x="450" y="245" text-anchor="middle">无适用数据</text>';return out+'</svg>';}

var mounted=new WeakMap();
function mount(root){const doc=root.ownerDocument,previous=mounted.get(root);if(previous)previous();root.replaceChildren();root.classList.add('fy182');let c=config(PRESETS[0].config),choices={},revealed=false,url=null,current=null,view=0;
 const el=(tag,attrs={},text)=>{const e=doc.createElement(tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);if(text!==undefined)e.textContent=text;return e;};
 if(!doc.querySelector('[data-fy182-style]')){const style=el('style',{'data-fy182-style':''});style.textContent='.fy182{margin-inline:0!important;width:100%;min-width:0;color:var(--fg,#222);line-height:1.65}.fy182 *{box-sizing:border-box}.fy182 button,.fy182 select{font:inherit;min-height:44px;padding:8px;border:1px solid var(--border,#aaa);border-radius:5px;background:var(--block-bg,#eee);color:inherit;max-width:100%;white-space:normal}.fy182 button[aria-pressed="true"]{outline:2px solid var(--accent,#a33)}.fy182 button:focus-visible,.fy182 select:focus-visible,.fy182 [tabindex]:focus-visible{outline:3px solid #2474bc}.fy182 .fy-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.fy182 label{display:grid;gap:4px;min-width:0}.fy182 input{width:100%;min-height:44px;font:inherit;color:inherit;background:var(--bg,#fff)}.fy182 .fy-row{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.fy182 .fy-pred>strong{display:block;margin-bottom:6px}.fy182 .fy-pred{padding:10px 0;border-top:1px solid var(--border,#aaa)}.fy182 .fy-feedback{margin:7px 0}.fy182 .fy-scroll{max-width:100%;overflow:auto}.fy182 svg{display:block;min-width:680px;width:100%;height:auto}.fy182 table{display:table;overflow:visible;max-width:none;border-collapse:collapse;width:max-content;min-width:100%;font-variant-numeric:tabular-nums}.fy182 td,.fy182 th{white-space:nowrap;text-align:right;padding:7px;border:1px solid var(--border,#bbb)}.fy182 [hidden]{display:none!important}.fy182 details{margin:12px 0}.fy182 summary{min-height:44px;cursor:pointer}.fy182 .fy-status{border-left:3px solid var(--accent,#a33);padding:8px 12px}.fy182 .fy-correct{color:var(--cl-green,#277540)}.fy182 .fy-wrong{color:var(--cl-red,#a33)}@media(max-width:600px){.fy182 .fy-grid{grid-template-columns:1fr}}';doc.head.append(style);}
 root.append(el('h3',{},'从一次缩并到对称因子，再到可观测量'),el('p',{},'编号外部场和每个顶点的四个槽，完整生成所有两两配对。图中连线来自当前配对；零维积分另用于观察微扰级数的边界，截面来自四维同质量树级散射。'));
 const presets=el('div',{class:'fy-row','aria-label':'教学预设'});for(const p of PRESETS){const b=el('button',{type:'button','data-preset':p.key},p.label);b.onclick=()=>{c=config(p.config);sync();reset();};presets.append(b);}root.append(presets);
 const fields={},outs={},grid=el('div',{class:'fy-grid'});
 for(const[key,title,values]of[['external','外部场数 E',[0,2,4]],['vertices','四价顶点数 V',[0,1,2]]]){const label=el('label',{},title),select=el('select',{'data-field':key,'aria-label':title});for(const v of values)select.append(el('option',{value:v},String(v)));label.append(select);grid.append(label);fields[key]=select;select.onchange=()=>{c[key]=+select.value;c.rank=Math.min(c.rank,doubleFactorial(c.external+4*c.vertices-1)-1);sync();reset();};}
 const rankLabel=el('label',{},'完整枚举中的缩并编号（从0起）'),rank=el('input',{type:'number',min:0,step:1,'data-field':'rank','aria-label':'完整枚举中的缩并编号（从0起）'});rankLabel.append(rank);grid.append(rankLabel);fields.rank=rank;
 for(const[key,title,min,max,step]of[['lambda','耦合 λ（两种模型分别解释）',0,2,.01],['order','零维级数截断阶 N',0,24,1],['mass','散射粒子质量 m',.2,2,.1],['energyRatio','每粒子能量 E/m（1是阈值）',1,4,.01],['cosTheta','散射角 cos θ',-1,1,.01]]){const label=el('label',{},title),out=el('output'),input=el('input',{type:'range',min,max,step,'data-field':key,'aria-label':title});label.append(out,input);grid.append(label);fields[key]=input;outs[key]=out;input.oninput=input.onchange=()=>{c[key]=+input.value;sync();reset();};}root.append(grid);
 const note=el('p'),prediction=el('section',{'aria-label':'先预测'});root.append(note,prediction);prediction.append(el('h4',{},'先预测：Wick恒等式、真空因子、末态与渐近性'),el('p',{},'四题的条件固定写在题干里；参数用来检查例子，不自动改变问题。'));
 const feedbacks=[],buttons=[];QUESTIONS.forEach((q,i)=>{const row=el('div',{class:'fy-pred'});row.append(el('strong',{},q[0]));buttons[i]=[];q[1].forEach((text,j)=>{const b=el('button',{type:'button','data-prediction':i,'data-choice':String(j===0),'aria-pressed':'false'},text);b.onclick=()=>{choices[i]=j;buttons[i].forEach((x,k)=>x.setAttribute('aria-pressed',String(j===k)));if(revealed)showFeedback();};row.append(b);buttons[i].push(b);});feedbacks[i]=el('p',{class:'fy-feedback','data-feedback':i});row.append(feedbacks[i]);prediction.append(row);});
 const check=el('button',{type:'button','data-check':''},'核对预测并显示完整结果'),status=el('p',{class:'fy-status','aria-live':'polite'});root.append(check,status);
 const stage=el('section',{'data-stage':'',hidden:'','aria-label':'实验结果'}),summary=el('p'),plotButtons=el('div',{class:'fy-row'}),plotWrap=el('div',{class:'fy-scroll',tabindex:0,role:'region','aria-label':'图表，可横向滚动'}),plotNote=el('p',{},'分类点是离散计数，完整标签在分类表。部分和图使用asinh纵轴，误差图使用log10(1+绝对值)，原数值全部保留在表中。阈值截面留空，空心点只是上阈值极限；零读数仍显示为零。'),tableHost=el('div'),download=el('a',{'data-download':'',download:'feynman-record.json'},'下载当前完整记录（JSON）');stage.append(summary,plotButtons,plotWrap,plotNote,tableHost,download);root.append(stage);
 function sync(){rank.max=doubleFactorial(c.external+4*c.vertices-1)-1;for(const[k,e]of Object.entries(fields))e.value=c[k];rank.removeAttribute('aria-invalid');check.disabled=false;}
 function reset(){revealed=false;choices={};stage.hidden=true;delete root.__feynmanSnapshot;for(let i=0;i<4;i++){feedbacks[i].textContent='';for(const b of buttons[i])b.setAttribute('aria-pressed','false');}for(const[k,o]of Object.entries(outs))o.textContent=fmt(c[k]);note.textContent='缩并编号范围0—'+rank.max+'；修改场数或顶点数时，超过范围的旧编号会调至最后一个。组合学包含自缩并（未对相互作用正规序）；它没有替代连续场论中发散积分的正则化。';status.textContent='完成四项预测后显示当前结果。';}
 rank.oninput=rank.onchange=()=>{const n=Number(rank.value);reset();if(rank.value.trim()===''||!Number.isInteger(n)||n<0||n>Number(rank.max)){rank.setAttribute('aria-invalid','true');check.disabled=true;status.textContent='缩并编号须为0到'+rank.max+'之间的整数。';return;}c.rank=n;sync();};
 function showFeedback(){let n=0;for(let i=0;i<4;i++){if(!Number.isInteger(choices[i]))continue;const f=feedback(i,choices[i]);n+=+f.correct;feedbacks[i].textContent=f.text;feedbacks[i].className='fy-feedback '+(f.correct?'fy-correct':'fy-wrong');}status.textContent='预测核对：'+n+'/4 正确。图、表和下载均对应当前参数。';}
 function draw(){const ps=plots(current);plotWrap.innerHTML=svg(ps[view]);Array.from(plotButtons.children).forEach((b,i)=>b.setAttribute('aria-pressed',String(i===view)));}
 function render(){current=compute(c);root.__feynmanSnapshot=current;stage.hidden=false;summary.textContent='完整配对 '+current.wick.total+' 种；Dyson分母 '+current.wick.denominator+'；当前缩并 #'+c.rank+' 的分类 '+current.selected.category+'。零维Z数值 '+fmt(current.zeroDimension.integral.value)+'；同种树级总截面 '+fmt(current.scattering.total)+'。';plotButtons.replaceChildren();plots(current).forEach((p,i)=>{const b=el('button',{type:'button','data-plot':p.key},p.title);b.onclick=()=>{view=i;draw();};plotButtons.append(b);});draw();tableHost.replaceChildren();for(const t of tables(current)){const d=el('details',{'data-table':t.key});d.append(el('summary',{},t.title));d.addEventListener('toggle',()=>{if(!d.open||d.children.length>1)return;const wrap=el('div',{class:'fy-scroll',tabindex:0,role:'region','aria-label':t.title+'，可横向滚动'}),table=el('table'),thead=el('thead'),tr=el('tr'),tbody=el('tbody');for(const h of t.headers)tr.append(el('th',{scope:'col'},h));thead.append(tr);for(const row of t.rows){const r=el('tr');for(const v of row)r.append(el('td',{},fmt(v)));tbody.append(r);}table.append(thead,tbody);wrap.append(table);d.append(wrap);});tableHost.append(d);}if(url)hostWindow.URL.revokeObjectURL(url);url=hostWindow.URL.createObjectURL(new hostWindow.Blob([JSON.stringify(current)],{type:'application/json'}));download.href=url;showFeedback();}
 check.onclick=()=>{if(![0,1,2,3].every(i=>Number.isInteger(choices[i]))){status.textContent='请先为四个问题各选一个预测。';return;}revealed=true;render();};sync();reset();mounted.set(root,()=>{if(url)hostWindow.URL.revokeObjectURL(url);});
}

function selfTest(){let checks=0;const ok=(b,m)=>{checks++;if(!b)throw Error(m);};for(const E of[0,2,4])for(const V of[0,1,2]){const w=wick(E,V);ok(w.total===doubleFactorial(E+4*V-1),'pairing cardinality');ok(w.summary.reduce((s,g)=>s+g.count,0)===w.total,'partition');for(const r of w.records){ok(new Set(r.pairs.flat()).size===E+4*V,'every slot exactly once');ok(r.pairs.every(([a,b])=>a<b),'pair order');ok(!r.onePI||r.connected&&r.bridges.length===0,'onePI');}}
 const w=wick(4,2);for(const channel of['01|23','02|13','03|12'])ok(w.records.filter(r=>r.channel===channel).length===576,'channel multiplicity');ok(w.records.filter(r=>r.category==='onePR').length===2304,'external tadpole');ok(w.records.filter(r=>r.category==='separate-external-blocks').length===864,'separate two-point blocks');ok(w.records.filter(r=>r.category==='vacuum-factor').length===144,'vacuum factor');for(const n of normalization())for(let i=0;i<3;i++){ok(Math.abs(n.quotient[i]-n.noVacuum[i])<1e-12,'vacuum cancellation');ok(Math.abs(n.cumulant[i]-n.connected[i])<1e-12,'cumulant connected');}
 for(const p of PRESETS){const s=compute(p.config);ok(s.selected.id===s.parameters.rank,'rank');ok(Math.abs(s.scattering.sum-4*s.parameters.mass**2)<1e-11,'Mandelstam');for(const r of s.zeroDimension.series)ok(Math.abs(r.numericalError)<=r.remainderBound+1e-10*Math.max(1,Math.abs(r.sum)),'asymptotic bound with floating tolerance');ok(plots(s).length===6&&tables(s).length===10,'views');}
 let rejected=0;for(const p of[{external:1},{vertices:3},{rank:-1},{rank:105},{order:2.5},{lambda:-1},{mass:0},{energyRatio:.9},{cosTheta:2},{rank:''},{unknown:1},null,[]]){try{config(p);}catch(e){rejected++;}}ok(rejected===13,'invalid parameters');return {status:'PASS',checks};}

const API={DEFAULT,PRESETS,QUESTIONS,config,compute,snapshot:compute,wick,integrate,zeroDimension,scattering,normalization,plots,tables,svg,feedback,fmt,mount,selfTest};if(typeof module!=="undefined"&&module.exports)module.exports=API;if(hostWindow&&hostWindow.CourseLearning)hostWindow.CourseLearning.register("feynman",mount);
})(typeof window!=="undefined"?window:null);
