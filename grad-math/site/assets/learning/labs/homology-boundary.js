(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root&&root.CourseLearning)root.CourseLearning.register('homology-boundary',api.mount);})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const Z=(m,n)=>({rows:m,cols:n,data:Array.from({length:m},()=>Array(n).fill(0n))}),I=n=>{const a=Z(n,n);for(let i=0;i<n;i++)a.data[i][i]=1n;return a;},clone=a=>({rows:a.rows,cols:a.cols,data:a.data.map(r=>r.slice())});
const abs=x=>x<0n?-x:x,mod=(x,p)=>((x%p)+p)%p;
function mul(a,b){if(a.cols!==b.rows)throw Error('矩阵尺寸不匹配');const c=Z(a.rows,b.cols);for(let i=0;i<a.rows;i++)for(let j=0;j<b.cols;j++)for(let k=0;k<a.cols;k++)c.data[i][j]+=a.data[i][k]*b.data[k][j];return c;}
const vec=(a,v)=>a.data.map(r=>r.reduce((s,x,j)=>s+x*v[j],0n)),isZero=a=>a.data.every(r=>r.every(x=>x===0n)),col=(a,j)=>a.data.map(r=>r[j]);
function columns(vectors,n){const a=Z(n,vectors.length);vectors.forEach((v,j)=>v.forEach((x,i)=>a.data[i][j]=x));return a;}
const pack=a=>({rows:a.rows,cols:a.cols,data:a.data.map(r=>r.map(String))});
function smith(input){
 const D=clone(input),U=I(input.rows),V=I(input.cols),Ui=I(input.rows),Vi=I(input.cols),steps=[];
 const rowSwap=(a,i,j)=>{[a.data[i],a.data[j]]=[a.data[j],a.data[i]];},colSwap=(a,i,j)=>a.data.forEach(r=>{[r[i],r[j]]=[r[j],r[i]];}),rowAdd=(a,i,j,q)=>a.data[i].forEach((_,k)=>a.data[i][k]+=q*a.data[j][k]),colAdd=(a,i,j,q)=>a.data.forEach(r=>r[i]+=q*r[j]);
 function op(kind,i,j=null,q=null){
  if(kind==='swapRows'){rowSwap(D,i,j);rowSwap(U,i,j);colSwap(Ui,i,j);}
  else if(kind==='swapColumns'){colSwap(D,i,j);colSwap(V,i,j);rowSwap(Vi,i,j);}
  else if(kind==='addRow'){rowAdd(D,i,j,q);rowAdd(U,i,j,q);colAdd(Ui,j,i,-q);}
  else if(kind==='addColumn'){colAdd(D,i,j,q);colAdd(V,i,j,q);rowAdd(Vi,j,i,-q);}
  else if(kind==='negateRow'){D.data[i]=D.data[i].map(x=>-x);U.data[i]=U.data[i].map(x=>-x);Ui.data.forEach(r=>r[i]=-r[i]);}
  steps.push({index:steps.length,kind,i,j,multiple:q===null?null:String(q),matrix:pack(D)});
  if(steps.length>4000)throw Error('整数消元超过本实验的4000步上限；未给出同调结论');
 }
 let k=0;
 while(k<Math.min(D.rows,D.cols)){
  let pos=null;for(let i=k;i<D.rows;i++)for(let j=k;j<D.cols;j++)if(D.data[i][j]!==0n&&(!pos||abs(D.data[i][j])<abs(D.data[pos[0]][pos[1]])))pos=[i,j];
  if(!pos)break;if(pos[0]!==k)op('swapRows',k,pos[0]);if(pos[1]!==k)op('swapColumns',k,pos[1]);
  while(true){
   let restart=false;
   for(let i=k+1;i<D.rows;i++)if(D.data[i][k]!==0n){const q=D.data[i][k]/D.data[k][k];if(q!==0n)op('addRow',i,k,-q);if(D.data[i][k]!==0n)op('swapRows',i,k);restart=true;break;}
   if(restart)continue;
   for(let j=k+1;j<D.cols;j++)if(D.data[k][j]!==0n){const q=D.data[k][j]/D.data[k][k];if(q!==0n)op('addColumn',j,k,-q);if(D.data[k][j]!==0n)op('swapColumns',j,k);restart=true;break;}
   if(restart)continue;
   let bad=null;for(let i=k+1;i<D.rows&&!bad;i++)for(let j=k+1;j<D.cols;j++)if(D.data[i][j]%D.data[k][k]!==0n){bad=[i,j];break;}
   if(bad){op('addRow',k,bad[0],1n);continue;}break;
  }
  if(D.data[k][k]<0n)op('negateRow',k);k++;
 }
 return{D,U,V,Ui,Vi,rank:k,diagonal:Array.from({length:k},(_,j)=>D.data[j][j]),steps};
}
const smithRecord=s=>({diagonal:s.diagonal.map(String),rank:s.rank,D:pack(s.D),U:pack(s.U),V:pack(s.V),inverseU:pack(s.Ui),inverseV:pack(s.Vi),steps:s.steps});
function rref(input,p){
 const a=clone(input);a.data=a.data.map(r=>r.map(v=>mod(v,p)));const U=I(a.rows),pivots=[],steps=[];let k=0;
 function record(kind,i,j,multiple){steps.push({index:steps.length,kind,i,j,multiple:String(multiple),matrix:pack(a)});}
 for(let j=0;j<a.cols&&k<a.rows;j++){
  const found=a.data.findIndex((r,i)=>i>=k&&r[j]!==0n);if(found<0)continue;
  if(found!==k){[a.data[k],a.data[found]]=[a.data[found],a.data[k]];[U.data[k],U.data[found]]=[U.data[found],U.data[k]];record('swapRows',k,found,1n);}
  let inv=1n;while(mod(a.data[k][j]*inv,p)!==1n)inv++;
  if(inv!==1n){a.data[k]=a.data[k].map(x=>mod(x*inv,p));U.data[k]=U.data[k].map(x=>mod(x*inv,p));record('scaleRow',k,k,inv);}
  for(let i=0;i<a.rows;i++)if(i!==k&&a.data[i][j]!==0n){const q=-a.data[i][j];a.data[i]=a.data[i].map((x,t)=>mod(x+q*a.data[k][t],p));U.data[i]=U.data[i].map((x,t)=>mod(x+q*U.data[k][t],p));record('addRow',i,k,q);}
  pivots.push(j);k++;
 }
 return{matrix:a,U,pivots,rank:k,steps};
}
function solveF(A,b,p){const R=rref(A,p),rhs=vec(R.U,b).map(v=>mod(v,p));const consistent=rhs.slice(R.rank).every(v=>v===0n);if(!consistent)return{consistent:false,solution:null,transformed:rhs.map(String),certificate:pack(R.U)};const x=Array(A.cols).fill(0n);R.pivots.forEach((j,i)=>x[j]=rhs[i]);return{consistent:true,solution:x.map(String),transformed:rhs.map(String),certificate:pack(R.U)};}
function kernelF(A,p,R=rref(A,p)){const free=Array.from({length:A.cols},(_,i)=>i).filter(i=>!R.pivots.includes(i));return free.map(j=>{const v=Array(A.cols).fill(0n);v[j]=1n;R.pivots.forEach((c,i)=>v[c]=mod(-R.matrix.data[i][j],p));return v;});}
function integerGroup(A,B){
 const s=smith(A),trans=mul(s.Vi,B);if(trans.data.slice(0,s.rank).some(r=>r.some(v=>v!==0n)))throw Error('相邻基变换不兼容');
 const kernel=Z(A.cols,A.cols-s.rank);for(let i=0;i<A.cols;i++)for(let j=s.rank;j<A.cols;j++)kernel.data[i][j-s.rank]=s.V.data[i][j];
 const coordinates={rows:A.cols-s.rank,cols:B.cols,data:trans.data.slice(s.rank).map(r=>r.slice())},t=smith(coordinates),reps=mul(kernel,t.Ui);
 const generators=[];for(let j=0;j<coordinates.rows;j++)if(j>=t.rank||t.diagonal[j]>1n){const order=j<t.rank?t.diagonal[j]:null;generators.push({coordinate:j,order:order===null?null:String(order),representative:col(reps,j).map(String),fillingMultiple:order===null?null:col(t.V,j).map(String)});}
 return{lower:s,upper:t,kernel,transformedUpper:trans,coordinates,representatives:reps,generators,freeRank:coordinates.rows-t.rank,torsion:t.diagonal.filter(v=>v>1n).map(String)};
}
function integerSelection(c,A,B,h){
 const boundary=vec(A,c),cycle=boundary.every(v=>v===0n);if(!cycle)return{cycle:false,boundary:boundary.map(String),classification:'not-cycle',classCoordinates:null,order:null,filling:null};
 const coordinates=vec(h.lower.Vi,c).slice(h.lower.rank),smithCoordinates=vec(h.upper.U,coordinates),classes=smithCoordinates.map((v,j)=>j<h.upper.rank?mod(v,h.upper.diagonal[j]):v);
 const zero=classes.every(v=>v===0n);let order=1n;
 const gcd=(a,b)=>{a=abs(a);b=abs(b);while(b!==0n)[a,b]=[b,a%b];return a;};
 for(let j=0;j<classes.length;j++){if(j>=h.upper.rank&&classes[j]!==0n){order=null;break;}if(j<h.upper.rank){const d=h.upper.diagonal[j],o=d/gcd(d,classes[j]);order=order/gcd(order,o)*o;}}
 let filling=null;
 if(order!==null){const z=Array(B.cols).fill(0n);for(let j=0;j<h.upper.rank;j++)z[j]=smithCoordinates[j]*order/h.upper.diagonal[j];filling=vec(h.upper.V,z).map(String);}
 return{cycle,boundary:boundary.map(String),kernelCoordinates:coordinates.map(String),smithCoordinates:smithCoordinates.map(String),classCoordinates:classes.map(String),classification:zero?'boundary':order===null?'infinite-class':'torsion-class',order:order===null?null:String(order),filling};
}
function fieldGroup(A,B,p){
 const lo=rref(A,p),up=rref(B,p),kernel=kernelF(A,p,lo),boundary=up.pivots.map(j=>col(B,j).map(v=>mod(v,p))),homology=[];let current=boundary.slice();
 for(const v of kernel){if(rref(columns([...current,v],A.cols),p).rank>current.length){homology.push(v);current.push(v);}}
 return{lower:lo,upper:up,kernel,boundary,homology,dimension:homology.length};
}
function fieldSelection(c,A,B,h,p){
 const boundary=vec(A,c).map(v=>mod(v,p)),cycle=boundary.every(v=>v===0n);if(!cycle)return{cycle:false,boundary:boundary.map(String),classification:'not-cycle',decomposition:null,homologyCoordinates:null,filling:null};
 const decomposition=solveF(columns([...h.boundary,...h.homology],A.cols),c,p);if(!decomposition.consistent)throw Error('同调基未张成闭链');const hc=decomposition.solution.slice(h.boundary.length),zero=hc.every(v=>v==='0');const filling=zero?solveF(B,c,p):null;
 return{cycle,boundary:boundary.map(String),classification:zero?'boundary':'homology-class',decomposition,homologyCoordinates:hc,filling};
}
const DEFAULTS={mode:'simplicial',facets:'012',model:'rp2',degree:'1',chain:'1,-1,1',coefficient:'Z',m:'6',dimensions:'1,2,1,0',d1:'',d2:'2;0',d3:''};
function integerText(x,label,limit){if(typeof x!=='string'||! /^-?(?:0|[1-9]\d*)$/.test(x)||abs(BigInt(x))>BigInt(limit))throw Error(label+'须为范围内的十进制整数，不含空格');return BigInt(x);}
function readMatrix(raw,m,n,label){if(typeof raw!=='string')throw Error(label+'须为文本矩阵');if(raw==='')return Z(m,n);if(!m||!n)throw Error(label+'的零维矩阵必须留空');const rows=raw.split(';').map(r=>r.split(',').map(v=>integerText(v,label,8)));if(rows.length!==m||rows.some(r=>r.length!==n))throw Error(label+'须为'+m+'行'+n+'列，行用分号、列用逗号');return{rows:m,cols:n,data:rows};}
function simplicial(facets){if(typeof facets!=='string'||!facets||facets.length>80)throw Error('单纯形须为非空编号文本，最多80字符');const top=facets.split(';');if(top.length>16||new Set(top).size!==top.length)throw Error('最多16个不同单纯形');for(const s of top)if(!/^[0-4]{1,4}$/.test(s)||[...s].some((c,i)=>i&&c<=s[i-1]))throw Error('每个单纯形用0至4的严格递增编号，最多4个顶点');const sets=Array.from({length:4},()=>new Set());for(const s of top)for(let mask=1;mask<2**s.length;mask++){const f=[...s].filter((_,i)=>mask&(1<<i)).join('');sets[f.length-1].add(f);}const cells=sets.map(v=>[...v].sort()),dimensions=cells.map(c=>c.length),boundaries=[Z(0,dimensions[0])];for(let k=1;k<=3;k++){const D=Z(dimensions[k-1],dimensions[k]);cells[k].forEach((s,j)=>{for(let i=0;i<s.length;i++){const face=s.slice(0,i)+s.slice(i+1),row=cells[k-1].indexOf(face);D.data[row][j]=i%2?-1n:1n;}});boundaries.push(D);}boundaries.push(Z(dimensions[3],0));return{dimensions,cells,boundaries,label:'有限三维单纯复形（自动补齐全部面）',geometric:true};}
function attachingColumn(word,basis){return [...basis].map(g=>[...word].reduce((n,c)=>n+(c===g?1:c===g.toUpperCase()?-1:0),0)).join(';');}
function modelData(p){
 if(p.mode==='simplicial')return simplicial(p.facets);
 let dimensions,inputs,label;
 if(p.mode==='cellular'){
  const m=integerText(p.m,'附加度数',8);const models={rp2:[[1,1,1,0],['','2',''],'射影平面RP²的胞腔链'],torus:[[1,2,1,0],['',attachingColumn('abAB','ab'),''],'环面T²的胞腔链'],klein:[[1,2,1,0],['',attachingColumn('abAb','ab'),''],'Klein瓶的胞腔链（基序a,b；b系数为2）'],moore:[[1,1,1,0],['',String(m),''],'圆周沿度数m附加一个圆盘'],sphere3:[[1,0,0,1],['','',''],'三维球面S³的胞腔链'],lens:[[1,1,1,1],['',String(m),''],'标准三维透镜空间链型（m非零时）']};
  if(!Object.hasOwn(models,p.model))throw Error('未知胞腔模型');if(p.model==='lens'&&m===0n)throw Error('透镜空间模型要求非零度数');[dimensions,inputs,label]=models[p.model];
 }else{if(typeof p.dimensions!=='string'||!/^\d,\d,\d,\d$/.test(p.dimensions))throw Error('维数须为四个0至6整数');dimensions=p.dimensions.split(',').map(Number);if(dimensions.some(v=>v>6))throw Error('自定义各链群最多6维');inputs=[p.d1,p.d2,p.d3];label='自定义有限自由整数链候选；不自动宣称可由空间实现';}
 const cells=dimensions.map((n,k)=>Array.from({length:n},(_,j)=>'c'+k+'_'+j)),boundaries=[Z(0,dimensions[0]),...inputs.map((s,i)=>readMatrix(s,dimensions[i],dimensions[i+1],'d'+(i+1))),Z(dimensions[3],0)];return{dimensions,cells,boundaries,label,geometric:false};
}
function config(raw={}){if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('参数须为对象');const p={...DEFAULTS,...raw};if(!['simplicial','cellular','custom'].includes(p.mode))throw Error('未知模型类型');if(!['Z','2','3','5'].includes(p.coefficient))throw Error('系数须为Z或素域2、3、5');if(typeof p.degree!=='string'||! /^[0-3]$/.test(p.degree))throw Error('链次数须为0至3');const m=modelData(p),n=m.dimensions[Number(p.degree)];if(typeof p.chain!=='string')throw Error('链系数须为文本');if(p.chain!==''){const v=p.chain.split(',').map(x=>integerText(x,'链系数',12));if(v.length!==n)throw Error('当前次数需要'+n+'个链系数；留空表示零链');}return p;}
function snapshot(raw={}){
 const p=config(raw),model=modelData(p),k=Number(p.degree),c=p.chain===''?Array(model.dimensions[k]).fill(0n):p.chain.split(',').map(BigInt),checks=[];
 for(let j=1;j<=3;j++){const product=mul(model.boundaries[j-1],model.boundaries[j]);checks.push({degree:j,product:pack(product),zero:isZero(product)});}
 const valid=checks.every(z=>z.zero),result={model:model.label,geometric:model.geometric,dimensions:model.dimensions,cells:model.cells,boundaries:model.boundaries.map(pack),chainChecks:checks,validIntegerComplex:valid,degree:k,chain:c.map(String),eulerChains:model.dimensions.reduce((s,n,i)=>s+(i%2?-n:n),0),integerHomology:null,fieldComparisons:null,selected:null};
 if(!valid){result.scope='相邻边界复合不为零，商群尚未定义；即使某个模p乘积碰巧为零，也不把该输入冒充整数链复形的系数变换。';return{parameters:p,result};}
 const H=Array.from({length:4},(_,j)=>integerGroup(model.boundaries[j],model.boundaries[j+1]));
 result.integerHomology=H.map((h,j)=>({degree:j,freeRank:h.freeRank,torsion:h.torsion,generators:h.generators,lowerSmith:smithRecord(h.lower),kernelBasis:pack(h.kernel),transformedUpper:pack(h.transformedUpper),upperInKernel:pack(h.coordinates),upperSmith:smithRecord(h.upper),quotientRepresentatives:pack(h.representatives)}));
 result.eulerHomology=H.reduce((s,h,j)=>s+(j%2?-h.freeRank:h.freeRank),0);
 const fields=[2n,3n,5n].map(prime=>{const groups=Array.from({length:4},(_,j)=>fieldGroup(model.boundaries[j],model.boundaries[j+1],prime));return{prime:String(prime),groups:groups.map((h,j)=>({degree:j,dimension:h.dimension,lowerRank:h.lower.rank,upperRank:h.upper.rank,kernelBasis:h.kernel.map(v=>v.map(String)),boundaryBasis:h.boundary.map(v=>v.map(String)),homologyBasis:h.homology.map(v=>v.map(String)),lowerRref:pack(h.lower.matrix),upperRref:pack(h.upper.matrix),lowerRowChange:pack(h.lower.U),upperRowChange:pack(h.upper.U),lowerSteps:h.lower.steps,upperSteps:h.upper.steps,uctDimension:H[j].freeRank+H[j].torsion.filter(x=>BigInt(x)%prime===0n).length+(j?H[j-1].torsion.filter(x=>BigInt(x)%prime===0n).length:0)})),selection:fieldSelection(c,model.boundaries[k],model.boundaries[k+1],groups[k],prime)};});
 result.fieldComparisons=fields;result.integerSelection=integerSelection(c,model.boundaries[k],model.boundaries[k+1],H[k]);result.selected=p.coefficient==='Z'?result.integerSelection:fields.find(f=>f.prime===p.coefficient).selection;result.scope='整数计算使用BigInt与可逆整数基变换；素域计算分别重做消元。0至3次均计算，4次链群为零；记录不含浮点同调判定。';return{parameters:p,result};
}
const PRESETS=[
 {id:'solid',label:'三角形填面：闭链是边界',values:{}},
 {id:'hollow',label:'只有三角边：无限阶类',values:{facets:'01;02;12'}},
 {id:'one-edge',label:'只取一条边：不是闭链',values:{chain:'1,0,0'}},
 {id:'isolated',label:'环加孤立点：H0分成两份',values:{facets:'01;02;12;3',degree:'0',chain:'1,0,0,-1'}},
 {id:'surface',label:'四面体表面：非零H2',values:{facets:'012;013;023;123',degree:'2',chain:'-1,1,-1,1'}},
 {id:'solid-tetra',label:'填入三维单纯形：同一面链变边界',values:{facets:'0123',degree:'2',chain:'-1,1,-1,1'}},
 {id:'tetra-chain',label:'三维实体自身不是3闭链',values:{facets:'0123',degree:'3',chain:'1'}},
 {id:'two-triangles',label:'共边双三角形：方向抵消',values:{facets:'012;123',degree:'2',chain:'1,-1'}},
 {id:'rp2',label:'RP²整数H1：二次才填得掉',values:{mode:'cellular',model:'rp2',chain:'1'}},
 {id:'rp2-mod2',label:'RP²模2：H1和H2都出现',values:{mode:'cellular',model:'rp2',coefficient:'2',degree:'2',chain:'1'}},
 {id:'rp2-mod3',label:'RP²模3：乘2可以求逆',values:{mode:'cellular',model:'rp2',coefficient:'3',chain:'1'}},
 {id:'moore6',label:'度数6附加：Z/6',values:{mode:'cellular',model:'moore',chain:'1'}},
 {id:'moore6-double',label:'Z/6中的2：实际阶为3',values:{mode:'cellular',model:'moore',chain:'2'}},
 {id:'moore6-negative',label:'负定向不改变群',values:{mode:'cellular',model:'moore',m:'-6',chain:'1'}},
 {id:'moore0',label:'度数0：H1和H2自由',values:{mode:'cellular',model:'moore',m:'0',chain:'1'}},
 {id:'torus',label:'环面的整数自由类',values:{mode:'cellular',model:'torus',chain:'1,1'}},
 {id:'klein',label:'Klein瓶：自由与二挠并存',values:{mode:'cellular',model:'klein',chain:'1,1'}},
 {id:'klein-torsion',label:'Klein瓶的纯挠类',values:{mode:'cellular',model:'klein',chain:'0,1'}},
 {id:'sphere3',label:'S³的三维基本类',values:{mode:'cellular',model:'sphere3',degree:'3',chain:'1'}},
 {id:'lens',label:'透镜空间链型：H1挠与H3自由',values:{mode:'cellular',model:'lens',degree:'3',chain:'1'}},
 {id:'coupled',label:'必须同步基变换：H1为Z/2',values:{mode:'custom',dimensions:'1,2,1,0',d1:'1,1',d2:'2;-2',chain:'1,-1'}},
 {id:'smith6',label:'2与3需要组合成Smith因子6',values:{mode:'custom',dimensions:'1,2,2,0',d1:'',d2:'2,0;0,3',chain:'1,1'}},
 {id:'invalid',label:'边界的边界非零：拒绝计算同调',values:{mode:'custom',dimensions:'1,1,1,0',d1:'2',d2:'1',chain:'1'}},
 {id:'zero',label:'零链：填充见证也是零',values:{chain:''}}
];
function selfTest(){let checks=0;const ck=(v,m)=>{checks++;if(!v)throw Error(m);},r=id=>snapshot(PRESETS.find(p=>p.id===id).values).result;ck(r('solid').selected.classification==='boundary','solid');ck(r('hollow').integerHomology[1].freeRank===1,'circle');ck(!r('one-edge').selected.cycle,'edge');ck(r('surface').integerHomology[2].freeRank===1,'sphere2');ck(r('solid-tetra').selected.classification==='boundary','tetra');ck(r('rp2').selected.order==='2','rp2');ck(r('rp2-mod2').fieldComparisons[0].groups[2].dimension===1,'UCT');ck(r('moore6-double').selected.order==='3','order');ck(r('coupled').integerHomology[1].torsion.join()==='2','coupled');ck(r('smith6').integerHomology[1].torsion.join()==='6','smith');ck(!r('invalid').validIntegerComplex,'invalid complex');ck(r('zero').selected.order==='1','zero');ck(r('klein-torsion').selected.order==='2','Klein b torsion');ck(snapshot({mode:'cellular',model:'klein',chain:'1,0'}).result.selected.order===null,'Klein a free');ck(r('klein-torsion').boundaries[2].data.map(x=>x[0]).join()==='0,2','Klein attaching word');return{status:'PASS',checks};}

 const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const tick=v=>v===0?"0":Math.abs(v)<1e-3||Math.abs(v)>=1e4?v.toExponential(2):String(Number(v.toPrecision(4)));
 function curveSvg(q){
  const left=q.square?325:100,width=q.square?250:750,height=250,top=85,bottom=335,x=v=>left+width*(v-q.xmin)/(q.xmax-q.xmin),y=v=>bottom-height*(v-q.ymin)/(q.ymax-q.ymin);
  let s='<svg xmlns="http://www.w3.org/2000/svg" width="900" height="425" role="img" aria-label="'+esc(q.title)+'"><title>'+esc(q.title)+'</title><text x="25" y="32" font-size="22">'+esc(q.title)+'</text>';
  const yticks=q.yTicks||Array.from({length:q.square?3:5},(_,i)=>q.ymin+(q.ymax-q.ymin)*i/(q.square?2:4));
  for(const v of yticks){
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

const STYLE='.homology157{color:var(--fg,#273646)}.homology157 .homology-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px;min-width:0}.homology157 label{display:flex;flex-direction:column;gap:6px}.homology157 input,.homology157 select{font:inherit;padding:8px;max-width:100%;min-width:0;box-sizing:border-box;background:var(--bg,#fff);color:inherit;border:1px solid #8b98a0;border-radius:5px}.homology157 input{width:100%}.homology157 button{font:inherit;padding:8px 12px;margin:5px;cursor:pointer}.homology157 button[aria-pressed=true]{outline:3px solid #478aaa}.homology157 .homology-scroll{overflow:auto;max-width:100%;margin:16px 0}.homology157 .homology-scroll:focus{outline:3px solid #478aaa}.homology157 .homology-ledger{max-height:420px}.homology157 svg{width:900px!important;max-width:none!important;display:block;fill:currentColor;font:16px system-ui}.homology157 table{display:table;overflow:visible;width:max-content;max-width:none;min-width:900px;border-collapse:collapse;font-variant-numeric:tabular-nums}.homology157 th,.homology157 td{padding:9px;border:1px solid #98a4ab;text-align:left}.homology157 td{max-width:540px;white-space:normal;overflow-wrap:anywhere}.homology157 .homology-error{color:#c74b39}.homology157 [hidden]{display:none!important}.homology157 fieldset{margin:16px 0;padding:12px}.homology157 details{margin:16px 0}.homology157 summary{cursor:pointer;font-weight:600}';
const QUESTIONS=[['一条链的非零倍数能被填充，它自己就一定是边界吗？',['不一定，可能代表有限阶挠元','一定，除以这个倍数即可'],0],['整数同调自由秩为0，模2同调也一定为0吗？',['不一定，整数挠会改变模2结果','一定，维数不会因系数改变'],0],['四面体表面上的二维闭链，填入实体后仍一定非零吗？',['不一定，它可成为三维边界','一定，原来的面没有变化'],0],['给核取若干整数向量，只要在有理数上张成就够了吗？',['不够，还要完整生成整数核格点','够了，同一有理子空间就是同一整数群'],0]];
const BLUE='#268bd2',ORANGE='#cb6a16',GREEN='#29966c',VIOLET='#9966bb',ROSE='#b44a72';
const series=(key,label,color,points,line=true)=>({key,label,color,points,line});
function chart(title,x,y,ss){const xx=ss.flatMap(s=>s.points.map(p=>p[0])),yy=ss.flatMap(s=>s.points.map(p=>p[1])),hi=Math.max(1,...xx),lo=Math.min(0,...yy),top=Math.max(0,...yy),pad=(top-lo||1)*.08;return{type:'chart',title,x,y,series:ss,xmin:0,xmax:hi,ymin:lo-pad,ymax:top+pad,square:false,markers:[],xTicks:[...new Set(Array.from({length:5},(_,i)=>Math.round(hi*i/4)))],yTicks:[...new Set(Array.from({length:5},(_,i)=>Math.round(lo+(top-lo)*i/4)))]};}
function geometry(r){const n=r.cells[0].length,positions=r.cells[0].map((v,i)=>({label:v,x:280+180*Math.cos(-Math.PI/2+2*Math.PI*i/Math.max(1,n)),y:215+125*Math.sin(-Math.PI/2+2*Math.PI*i/Math.max(1,n))}));return{type:'complex',title:'有向单纯形与选定链：投影不改变关联',positions,cells:r.cells,degree:r.degree,chain:r.chain,dimensions:r.dimensions,series:[]};}
function diagram(r){return{type:'chain',title:'胞腔或代数链：箭头由带符号矩阵给出',dimensions:r.dimensions,matrices:r.boundaries.slice(1,4),valid:r.validIntegerComplex,series:[]};}
function matrixPlot(title,m){return{type:'matrix',title,matrix:m,series:[]};}
function plots(d){const r=d.result,first=r.geometric?geometry(r):diagram(r),out=[first,matrixPlot('选定次数的边界D'+r.degree+'：列出发，行到达',r.boundaries[r.degree])];if(!r.validIntegerComplex)return [...out,matrixPlot('首个失败的相邻边界复合',r.chainChecks.find(c=>!c.zero).product),chart('只有链群维数；同调未定义','次数','链群维数',[series('dimensions','链群的维数',ROSE,r.dimensions.map((n,k)=>[k,n]),false)])];
 out.push(chart('同一整数链复形，换系数后逐次比较','同调次数0、1、2、3','维数；蓝色仅整数自由秩',[series('integer','整数自由秩',BLUE,r.integerHomology.map(h=>[h.degree,h.freeRank])),...r.fieldComparisons.map((f,i)=>series('p'+f.prime,'模'+f.prime+'同调维数',[ORANGE,GREEN,VIOLET][i],f.groups.map(h=>[h.degree,h.dimension]))) ]));
 const s=r.selected;if(s.cycle){const coords=d.parameters.coefficient==='Z'?s.classCoordinates:s.homologyCoordinates;out.push(chart('选定类在商群中的坐标','商坐标编号（含单位因子时坐标为0）','坐标值；模数及代表见完整表',[series('class','所选系数下的商坐标',ROSE,coords.map((v,i)=>[i,Number(v)]),false)]));}else out.push(chart('当前链没有闭合：边界的每个坐标','到达链群基编号','非零坐标阻止它成为同调代表',[series('boundary','所选系数下的边界',ROSE,s.boundary.map((v,i)=>[i,Number(v)]),false)]));return out;
}
function svgStart(q){return'<svg xmlns="http://www.w3.org/2000/svg" width="900" height="425" role="img" aria-label="'+esc(q.title)+'"><title>'+esc(q.title)+'</title><text x="25" y="30" font-size="22">'+esc(q.title)+'</text>';}
function complexSvg(q){let s=svgStart(q);const pos=Object.fromEntries(q.positions.map(v=>[v.label,v]));
 for(const [i,f]of q.cells[2].entries()){const pp=[...f].map(v=>pos[v]);s+='<polygon data-face="'+i+'" points="'+pp.map(v=>v.x+','+v.y).join(' ')+'" fill="'+BLUE+'" fill-opacity=".1" stroke="none"/>';if(q.degree===2){const x=pp.reduce((a,v)=>a+v.x,0)/3,y=pp.reduce((a,v)=>a+v.y,0)/3;s+='<text data-face-chain="'+i+'" x="'+x+'" y="'+y+'" text-anchor="middle" font-size="14">'+esc(f+': '+q.chain[i])+'</text>';}}
 for(const [i,e]of q.cells[1].entries()){const a=pos[e[0]],b=pos[e[1]],value=q.degree===1?q.chain[i]:null,color=value!==null&&value!=='0'?ROSE:BLUE,dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len,x=a.x+.6*dx,y=a.y+.6*dy,pts=[[x+6*ux,y+6*uy],[x-6*ux+3*uy,y-6*uy-3*ux],[x-6*ux-3*uy,y-6*uy+3*ux]];s+='<line data-edge="'+i+'" x1="'+a.x+'" y1="'+a.y+'" x2="'+b.x+'" y2="'+b.y+'" stroke="'+color+'" stroke-width="2"/><polygon data-arrow="'+i+'" points="'+pts.map(p=>p.join(',')).join(' ')+'" fill="'+color+'"/>';if(value!==null)s+='<text data-edge-chain="'+i+'" x="'+((a.x+b.x)/2+8)+'" y="'+((a.y+b.y)/2-8)+'" font-size="14">'+esc(e+': '+value)+'</text>';}
 for(const [i,v]of q.positions.entries())s+='<circle data-vertex="'+i+'" cx="'+v.x+'" cy="'+v.y+'" r="6" fill="'+BLUE+'"/><text x="'+(v.x+12)+'" y="'+(v.y-8)+'">'+esc(v.label+(q.degree===0?': '+q.chain[i]:''))+'</text>';
 s+='<text x="550" y="100">当前链次数：'+q.degree+'</text>';q.dimensions.forEach((n,k)=>s+='<text data-cell-count="'+k+'" x="550" y="'+(140+k*35)+'">'+k+'维单纯形：'+n+'</text>');s+='<text x="550" y="305">三维单纯形：'+esc(q.cells[3].join('；')||'无')+'</text><text x="25" y="382">箭头固定基的正方向；负系数表示反向。重叠只来自平面投影。</text>';return s+'</svg>';}
function chainSvg(q){let s=svgStart(q);for(let k=3;k>=0;k--){const x=100+(3-k)*220;s+='<rect x="'+(x-50)+'" y="145" width="100" height="70" rx="8" fill="none" stroke="'+BLUE+'"/><text data-chain-group="'+k+'" x="'+x+'" y="186" text-anchor="middle">C'+k+'：Z^'+q.dimensions[k]+'</text>';if(k>0){s+='<line data-chain-arrow="'+k+'" x1="'+(x+55)+'" y1="180" x2="'+(x+160)+'" y2="180" stroke="'+GREEN+'"/><polygon points="'+(x+160)+',180 '+(x+151)+',175 '+(x+151)+',185" fill="'+GREEN+'"/><text x="'+(x+108)+'" y="150" text-anchor="middle">D'+k+'</text><text data-matrix-shape="'+k+'" x="'+(x+108)+'" y="244" text-anchor="middle">'+q.matrices[k-1].rows+'×'+q.matrices[k-1].cols+'</text>';}}
 s+='<text x="25" y="325">'+(q.valid?'每对相邻箭头复合为零：可以定义同调商群。':'有相邻箭头复合不为零：不能定义这份整数同调。')+'</text><text x="25" y="377">箭头不是空间里的边；此图显示链群及矩阵尺寸，完整矩阵见下表。</text>';return s+'</svg>';}
function matrixSvg(q){let s=svgStart(q),m=q.matrix;s+='<text x="25" y="67">矩阵形状 '+m.rows+' × '+m.cols+'；负数保留定向，空维数仍有意义。</text>';if(!m.rows||!m.cols)return s+'<text x="80" y="210" font-size="24">零维矩阵：没有可显示的元素。</text></svg>';const size=Math.min(42,250/m.rows,650/m.cols),x0=120,y0=103;for(let i=0;i<m.rows;i++)for(let j=0;j<m.cols;j++){const v=m.data[i][j];s+='<rect data-cell="'+i+'-'+j+'" x="'+(x0+j*size)+'" y="'+(y0+i*size)+'" width="'+size+'" height="'+size+'" fill="'+(v==='0'?'none':v.startsWith('-')?ORANGE:BLUE)+'" fill-opacity=".15" stroke="#8b8b8b" stroke-width=".5"/><text data-entry="'+i+'-'+j+'" x="'+(x0+(j+.5)*size)+'" y="'+(y0+(i+.5)*size+5)+'" text-anchor="middle" font-size="13">'+esc(v)+'</text>';}
 for(let j=0;j<m.cols;j++)s+='<text x="'+(x0+(j+.5)*size)+'" y="92" text-anchor="middle" font-size="12">'+j+'</text>';for(let i=0;i<m.rows;i++)s+='<text x="100" y="'+(y0+(i+.5)*size+5)+'" font-size="12">'+i+'</text>';return s+'<text x="25" y="395">行列编号从0开始；蓝=正，橙=负；表中保留全部精确整数。</text></svg>';}
function svg(q){return q.type==='chart'?curveSvg(q):q.type==='complex'?complexSvg(q):q.type==='chain'?chainSvg(q):matrixSvg(q);}
const WORDS={model:'模型说明',geometric:'有单纯复形关联图',dimensions:'各次链群维数',cells:'各次基的完整编号',chainChecks:'相邻边界检查',validIntegerComplex:'有效整数链复形',degree:'次数',chain:'当前链完整坐标',eulerChains:'链群Euler和',eulerHomology:'整数同调自由秩Euler和',scope:'结论范围',freeRank:'整数自由秩',torsion:'非单位不变量因子',generators:'全部商群生成元及倍数填充',coordinate:'商坐标编号',order:'精确阶；不适用或无限阶须结合分类',representative:'原链基中的代表',fillingMultiple:'乘该阶后的填充链',rank:'秩',diagonal:'全部正Smith因子',D:'Smith矩阵',U:'左基变换',V:'右基变换',inverseU:'左变换的整数逆',inverseV:'右变换的整数逆',kernelBasis:'完整闭链基',transformedUpper:'同步换基后的上行矩阵',upperInKernel:'上行像的闭链基坐标',quotientRepresentatives:'全部Smith商坐标的原链代表',index:'步号',kind:'操作类型',i:'目标行列',j:'来源行列',multiple:'操作倍数',matrix:'此步后的完整矩阵',prime:'素数',dimension:'该系数下的同调维数',lowerRank:'下行秩',upperRank:'上行秩',boundaryBasis:'边界像的一组基',homologyBasis:'同调类的全部基代表',lowerRref:'下行简化矩阵',upperRref:'上行简化矩阵',lowerRowChange:'下行左变换',upperRowChange:'上行左变换',uctDimension:'独立系数公式应有维数',cycle:'当前链闭合',boundary:'当前链的边界',classification:'当前链分类',kernelCoordinates:'闭链基坐标',smithCoordinates:'取模前Smith坐标',classCoordinates:'整数商坐标',homologyCoordinates:'域上的商坐标',filling:'填充记录，整数有限类填最小正倍数',consistent:'方程可解',solution:'完整解向量',transformed:'变换后的右端',certificate:'可核对的左变换',decomposition:'边界基与同调基中的分解',zero:'全零',product:'完整复合矩阵'};
const CLASS={'not-cycle':'不是闭链','boundary':'边界，代表零类','infinite-class':'无限阶非零类','torsion-class':'有限阶非零挠类','homology-class':'域上的非零同调类'};
function fmt(v){if(v===null||v===undefined)return'—（不适用；无限阶见分类）';if(typeof v==='boolean')return v?'是':'否';if(typeof v==='object'){if('rows'in v&&'cols'in v&&Array.isArray(v.data))return v.rows+'×'+v.cols+' ['+v.data.map(r=>r.join(',')).join('；')+']';return Array.isArray(v)?'['+v.map(fmt).join('；')+']':Object.entries(v).map(([k,z])=>(WORDS[k]||k)+'='+fmt(z)).join('；');}if(v==='')return'（空）';return CLASS[v]||String(v);}
function summ(key,title,obj,exclude=[]){return{key,title,headers:['量','完整记录'],rows:Object.entries(obj).filter(([k])=>!exclude.includes(k)).map(([k,v])=>[WORDS[k]||k,v])};}
function rows(key,title,items){const keys=items.length?Object.keys(items[0]):[];return{key,title,headers:keys.map(k=>WORDS[k]||k),rows:items.map(z=>keys.map(k=>z[k]))};}
function ledgers(d){const r=d.result,out=[summ('summary','模型、系数边界与链群',r,['boundaries','integerHomology','fieldComparisons','selected','integerSelection']),rows('boundaries','D0至D4：全部原始边界及尺寸',r.boundaries.map((m,k)=>({degree:k,matrix:m})))];if(!r.validIntegerComplex)return out;
 for(const h of r.integerHomology){const key='z'+h.degree;out.push(summ(key,'H'+h.degree+'整数核、像与全部代表',h,['lowerSmith','upperSmith']));for(const [suffix,s]of [['lower',h.lowerSmith],['upper',h.upperSmith]])out.push(summ(key+'-'+suffix,'H'+h.degree+' '+(suffix==='lower'?'下行':'闭链基中上行')+'的完整Smith证书',s,['steps']),rows(key+'-'+suffix+'-steps','逐步整数消元：保留整张矩阵',s.steps));}
 for(const f of r.fieldComparisons){for(const h of f.groups){const key='p'+f.prime+'-h'+h.degree;out.push(summ(key,'模'+f.prime+' H'+h.degree+'全部基与消元证书',h,['lowerSteps','upperSteps']),rows(key+'-lower-steps','下行域消元全部步骤',h.lowerSteps),rows(key+'-upper-steps','上行域消元全部步骤',h.upperSteps));}out.push(summ('p'+f.prime+'-selected','当前链在模'+f.prime+'下的完整分类与填充',f.selection));}
 out.push(summ('integer-selected','当前链的整数阶、商坐标与倍数填充',r.integerSelection));return out;
}
function mount(container){const doc=container.ownerDocument;if(!doc.getElementById('homology157-style')){const s=doc.createElement('style');s.id='homology157-style';s.textContent=STYLE;doc.head.appendChild(s);}const field=(key,label,modes='simplicial cellular custom')=>'<label data-modes="'+modes+'">'+label+'<input data-key="'+key+'" type="text"></label>';container.innerHTML='<div class="homology157"><h3>把“能不能填”变成一份精确证书</h3><p>先分清链、闭链和同调类；改变系数时重新计算。所有整数基及其逆保存在表中。</p><div>'+PRESETS.map(p=>'<button type="button" data-preset="'+p.id+'">'+esc(p.label)+'</button>').join('')+'</div><div class="homology-controls"><label>模型类型<select data-key="mode"><option value="simplicial">单纯形及全部面</option><option value="cellular">给定胞腔模型</option><option value="custom">自定义整数链候选</option></select></label>'+field('facets','单纯形：如012;03，自动补齐面','simplicial')+'<label data-modes="cellular">胞腔模型<select data-key="model"><option value="rp2">射影平面RP²</option><option value="torus">环面T²</option><option value="klein">Klein瓶</option><option value="moore">沿度数m附加圆盘</option><option value="sphere3">三维球面S³</option><option value="lens">透镜空间链型</option></select></label>'+field('m','附加度数m（仅Moore/透镜模型使用）','cellular')+field('dimensions','C0,C1,C2,C3维数（各0至6）','custom')+field('d1','D1：分号分行，逗号分列；空=零矩阵','custom')+field('d2','D2：行=C1基，列=C2基','custom')+field('d3','D3：行=C2基，列=C3基','custom')+'<label>当前链次数<select data-key="degree">'+[0,1,2,3].map(k=>'<option value="'+k+'">'+k+'次链</option>').join('')+'</select></label>'+field('chain','当前链系数（逗号分隔；空=零链）')+'<label>观察所选链的系数<select data-key="coefficient"><option value="Z">整数Z</option><option value="2">素域F₂</option><option value="3">素域F₃</option><option value="5">素域F₅</option></select></label></div><p>单纯形用0至4的递增编号，每个最多4顶点、共至多16项。矩阵输入整数限−8至8，链系数限−12至12。不接受空格或小数；改模型或次数后，需要让链系数个数匹配，也可留空检查零链。</p>'+QUESTIONS.map((q,i)=>'<fieldset data-question="'+i+'"><legend>'+(i+1)+'. '+esc(q[0])+'</legend>'+q[1].map((v,j)=>'<button type="button" data-choice="'+j+'" aria-pressed="false">'+esc(v)+'</button>').join('')+'</fieldset>').join('')+'<button type="button" data-action="reveal">揭示图与完整证书</button><button type="button" data-action="reset">重置预测</button><p class="homology-error" role="alert"></p><p role="status"></p><div class="homology-results" hidden></div></div>';
 const fields=[...container.querySelectorAll('[data-key]')],answers=Array(4).fill(null),result=container.querySelector('.homology-results'),reveal=container.querySelector('[data-action=reveal]'),error=container.querySelector('[role=alert]'),status=container.querySelector('[role=status]');fields.forEach(e=>e.value=DEFAULTS[e.dataset.key]);let revealed=false,valid=null;
 function render(d){const r=d.result;result.innerHTML='<p data-conclusion>'+esc(!r.validIntegerComplex?'边界的边界非零：尚未定义同调。':fmt(r.selected.classification)+(r.selected.order===null?'':r.selected.order?'；整数类精确阶='+r.selected.order:'')+'。')+'</p><p>'+esc(r.scope)+'</p>'+plots(d).map(q=>'<p>'+q.series.map(s=>esc(s.label)+'（'+({'#268bd2':'蓝','#cb6a16':'橙','#29966c':'绿','#9966bb':'紫','#b44a72':'玫红'}[s.color])+'）').join('；')+'</p><div class="homology-scroll" role="region" tabindex="0" aria-label="'+esc(q.title)+'">'+svg(q)+'</div>').join('')+ledgers(d).map(z=>'<details data-ledger="'+z.key+'"'+(z.key==='summary'?' open':'')+'><summary>'+esc(z.title)+'（'+z.rows.length+'行）</summary><div class="homology-scroll homology-ledger" role="region" tabindex="0" aria-label="'+esc(z.title)+'"><table data-table="'+z.key+'"><thead><tr>'+z.headers.map(v=>'<th scope="col">'+esc(v)+'</th>').join('')+'</tr></thead><tbody>'+z.rows.map(row=>'<tr>'+row.map(v=>'<td>'+esc(fmt(v))+'</td>').join('')+'</tr>').join('')+'</tbody></table></div></details>').join('')+'<p>图的几何坐标只负责排版。矩阵、同调类和整数判定均保留精确值；“无限阶”与“不适用”须结合分类读取。每个图表可用键盘横向滚动。</p>';}
 function update(){const raw=Object.fromEntries(fields.map(e=>[e.dataset.key,e.value]));container.querySelectorAll('[data-modes]').forEach(e=>e.hidden=!e.dataset.modes.split(' ').includes(raw.mode));try{valid=config(raw);error.textContent='';}catch(e){valid=null;revealed=false;error.textContent=e.message;}reveal.disabled=!valid||answers.some(v=>v===null);result.hidden=!revealed;if(revealed&&valid){try{render(snapshot(valid));}catch(e){revealed=false;result.hidden=true;error.textContent=e.message;}}status.textContent=revealed?answers.filter((a,i)=>a===QUESTIONS[i][2]).length+' / 4。再检查每个结论的系数与次数。':'';}
 fields.forEach(e=>e.addEventListener(e.tagName==='SELECT'?'change':'input',update));container.querySelectorAll('[data-choice]').forEach(b=>b.addEventListener('click',()=>{const i=Number(b.closest('[data-question]').dataset.question);answers[i]=Number(b.dataset.choice);b.parentElement.querySelectorAll('[data-choice]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));update();}));container.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>{const p={...DEFAULTS,...PRESETS.find(z=>z.id===b.dataset.preset).values};fields.forEach(e=>e.value=p[e.dataset.key]);update();}));reveal.addEventListener('click',()=>{if(!reveal.disabled){revealed=true;update();}});container.querySelector('[data-action=reset]').addEventListener('click',()=>{answers.fill(null);revealed=false;container.querySelectorAll('[data-choice]').forEach(b=>b.setAttribute('aria-pressed','false'));update();container.querySelector('[data-choice]').focus();});update();}

return {DEFAULTS,PRESETS,QUESTIONS,config,snapshot,plots,ledgers,fmt,svg,mount,selfTest};});
