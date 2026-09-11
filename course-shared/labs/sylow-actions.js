(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root&&root.CourseLearning)root.CourseLearning.register('sylow-actions',api.mount);})(typeof window!=='undefined'?window:typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const range=n=>Array.from({length:n},(_,i)=>i),same=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]),sorted=s=>Array.from(new Set(s)).sort((a,b)=>a-b),key=a=>a.join(','),comp=(a,b)=>b.map(v=>a[v]);
function permutations(n){if(!n)return [[]];return permutations(n-1).flatMap(a=>range(n).map(i=>a.slice(0,i).concat(n-1,a.slice(i))));}
function parity(a){let q=0;for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++)q+=a[i]>a[j];return q%2;}
function label(a){const seen=new Set(),cycles=[];for(let i=0;i<a.length;i++){if(seen.has(i))continue;let j=i,c=[];do{seen.add(j);c.push(j+1);j=a[j];}while(j!==i);if(c.length>1)cycles.push('('+c.join(' ')+')');}return cycles.join('')||'e';}
function permClosure(gens,n){const values=[range(n)],seen=new Set([key(values[0])]);for(let i=0;i<values.length;i++)for(const g of gens){const v=comp(values[i],g),k=key(v);if(!seen.has(k)){seen.add(k);values.push(v);}}return values;}
function quaternion(){const unit=[[0,1,2,3],[1,0,3,2],[2,3,0,1],[3,2,1,0]],negative=[[0,0,0,0],[0,1,0,1],[0,1,1,0],[0,0,1,1]];return range(8).map(a=>range(8).map(b=>unit[a%4][b%4]+4*((Math.floor(a/4)+Math.floor(b/4)+negative[a%4][b%4])%2)));}
const GROUPS=[['s3','S₃'],['a4','A₄'],['d4','D₄（阶8）'],['q8','Q₈'],['v4','V₄'],['c15','C₁₅'],['s4','S₄'],['a5','A₅'],['s5','S₅'],['trivial','平凡群']];
function makeGroup(id){
 let values;
 if(['s3','s4','s5','a4','a5'].includes(id)){values=permutations(+id[1]);if(id[0]==='a')values=values.filter(v=>!parity(v));}
 else if(id==='d4')values=permClosure([[1,2,3,0],[0,3,2,1]],4);
 else if(id==='v4')values=range(4).map(a=>range(4).map(b=>a^b));
 else if(id==='c15')values=range(15).map(a=>range(15).map(b=>(a+b)%15));
 else if(id==='q8')values=quaternion();
 else if(id==='trivial')values=[[0]];
 else throw Error('未知群');
 values.sort((a,b)=>{for(let i=0;i<a.length;i++)if(a[i]!==b[i])return a[i]-b[i];return 0;});
 const index=new Map(values.map((v,i)=>[key(v),i])),n=values.length,e=index.get(key(range(values[0].length))),mul=values.map(a=>values.map(b=>index.get(key(comp(a,b))))),inv=range(n).map(i=>mul[i].indexOf(e));
 if(mul.some(r=>r.includes(undefined))||inv.includes(-1))throw Error('群构造失败');
 const conjugate=range(n).map(g=>range(n).map(x=>mul[mul[g][x]][inv[g]]));
 return {id,label:GROUPS.find(q=>q[0]===id)[1],order:n,degree:values[0].length,identity:e,permutations:values,labels:values.map(label),multiplication:mul,inverses:inv,conjugation:conjugate};
}
function closure(g,generators){const seen=new Set([g.identity]),queue=[g.identity],words={[g.identity]:[]},gens=sorted(generators);for(let i=0;i<queue.length;i++)for(const a of gens){const v=g.multiplication[queue[i]][a];if(!seen.has(v)){seen.add(v);queue.push(v);words[v]=words[queue[i]].concat(a);}}return {members:sorted(queue),generators:gens,words};}
function allSubgroups(g){
 const nodes=[{...closure(g,[]),parent:null,added:null}],index=new Map([[key(nodes[0].members),0]]),transitions=[];
 for(let i=0;i<nodes.length;i++){
  const h=nodes[i],covered=new Set(h.members);
  for(let x=0;x<g.order;x++){
   if(covered.has(x))continue;
   // Hx: each representative generates the same extension as every member of its right coset.
   for(const h0 of h.members)covered.add(g.multiplication[h0][x]);
   const c=closure(g,h.generators.concat(x)),k=key(c.members);let j=index.get(k);
   if(j===undefined){j=nodes.length;index.set(k,j);nodes.push({...c,parent:i,added:x});}
   transitions.push({from:i,adjoin:x,to:j});
  }
 }
 const rows=nodes.map((h,i)=>{const conjugates=g.conjugation.map(row=>index.get(key(sorted(h.members.map(x=>row[x]))))),normalizer=range(g.order).filter(x=>conjugates[x]===i),centralizer=range(g.order).filter(x=>h.members.every(y=>g.multiplication[x][y]===g.multiplication[y][x]));return {id:i,...h,order:h.members.length,normalizer,centralizer,normal:normalizer.length===g.order,conjugates,conjugacyOrbit:sorted(conjugates)};});
 const inclusions=[];for(const a of rows)for(const b of rows)if(a.id!==b.id&&a.members.every(x=>b.members.includes(x)))inclusions.push([a.id,b.id]);
 const covers=inclusions.filter(([a,b])=>!rows.some(c=>c.id!==a&&c.id!==b&&rows[a].members.every(x=>c.members.includes(x))&&c.members.every(x=>rows[b].members.includes(x))));
 return {subgroups:rows,enumerationTransitions:transitions,inclusions,covers};
}
function primeFactors(n){const out=[];for(let p=2;p<=n;p++)if(n%p===0){let power=1,exponent=0;while(n%p===0){n/=p;power*=p;exponent++;}out.push({prime:p,pPower:power,exponent});}return out;}
function cosets(g,h){const owner=Array(g.order).fill(-1),rows=[];for(let x=0;x<g.order;x++){if(owner[x]>=0)continue;const members=sorted(h.map(a=>g.multiplication[x][a])),i=rows.length;members.forEach(a=>owner[a]=i);rows.push({id:i,representative:x,members});}return {rows,owner};}
function derived(g,initial){const stages=[];let members=initial.slice();for(;;){const commutators=members.flatMap(x=>members.map(y=>({x,y,value:g.multiplication[g.multiplication[g.multiplication[x][y]][g.inverses[x]]][g.inverses[y]]}))),next=closure(g,sorted(commutators.map(q=>q.value))),stable=same(members,next.members);stages.push({index:stages.length,members,order:members.length,commutators,next:next.members,closureWords:next.words,stable});if(members.length===1||stable)break;members=next.members;}return {stages,solvable:stages.at(-1).order===1,length:stages.at(-1).order===1?stages.length-1:null,terminal:stages.at(-1).members};}
function freeze(o){if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;}
const CACHE=new Map();
function base(id){if(CACHE.has(id))return CACHE.get(id);const g=makeGroup(id),subs=allSubgroups(g),classes=[],seen=new Set();for(let x=0;x<g.order;x++){if(seen.has(x))continue;const members=sorted(g.conjugation.map(row=>row[x]));members.forEach(v=>seen.add(v));classes.push({id:classes.length,representative:x,members,size:members.length,centralizer:range(g.order).filter(y=>g.multiplication[x][y]===g.multiplication[y][x])});}
 const center=range(g.order).filter(x=>g.multiplication[x].every((v,y)=>v===g.multiplication[y][x]));
 const elementOrders=range(g.order).map(x=>{let y=g.identity,powers=[y];do{y=g.multiplication[y][x];powers.push(y);}while(y!==g.identity);return {element:x,order:powers.length-1,powers};});
 const sylow=primeFactors(g.order).map(f=>{const cofactor=g.order/f.pPower,subgroupIds=subs.subgroups.filter(h=>h.order===f.pPower).map(h=>h.id),candidates=range(cofactor).map(i=>i+1).filter(v=>cofactor%v===0&&v%f.prime===1);return {...f,cofactor,subgroupIds,actualCount:subgroupIds.length,candidates};});
 const normals=subs.subgroups.filter(h=>h.normal).map(h=>h.id),d=derived(g,range(g.order));
 const result=freeze({...g,...subs,classes,center,elementOrders,sylow,normalSubgroupIds:normals,simple:g.order>1&&normals.length===2,abelian:center.length===g.order,derived:d});CACHE.set(id,result);return result;
}
const DEFAULTS={group:'s3',generators:'1',action:'natural',actor:'group',point:'0',prime:'2'};
function integer(s,min,max,name){if(typeof s!=='string'||! /^(0|[1-9][0-9]*)$/.test(s)||+s<min||+s>max)throw Error(name+'须为'+min+'至'+max+'的整数编号');return +s;}
function config(raw={}){if(!raw||typeof raw!=="object"||Array.isArray(raw))throw Error("参数须为对象");const p=Object.assign({},DEFAULTS,raw);if(!GROUPS.some(g=>g[0]===p.group))throw Error('请选择已列出的有限群');if(!['natural','regular','conjugation','cosets','sylow'].includes(p.action))throw Error('未知作用');if(!['group','subgroup'].includes(p.actor))throw Error('未知作用群');const g=base(p.group);if(typeof p.generators!=='string'||p.generators.length>400)throw Error('生成元须为逗号分隔编号');const generators=p.generators===''?[]:p.generators.split(',').map(v=>integer(v,0,g.order-1,'生成元'));if(new Set(generators).size!==generators.length)throw Error('生成元编号不可重复');integer(p.point,0,119,'作用点');integer(p.prime,2,5,'素数');if(!['2','3','5'].includes(p.prime))throw Error('素数只允许2、3、5');return {p,g,generators};}
function quotient(g,h){if(!h.normal)return {defined:false,reason:'子群不正规；代表元乘法不能降到左陪集。',witness:(()=>{for(let x=0;x<g.order;x++)for(const a of h.members)if(!h.members.includes(g.conjugation[x][a]))return {conjugator:x,member:a,conjugate:g.conjugation[x][a]};})()};const c=cosets(g,h.members),mul=c.rows.map(a=>c.rows.map(b=>c.owner[g.multiplication[a.representative][b.representative]])),identity=c.owner[g.identity];return {defined:true,cosets:c.rows,projection:c.owner,multiplication:mul,identity,inverses:c.rows.map(a=>c.owner[g.inverses[a.representative]]),abelian:mul.every((r,i)=>r.every((v,j)=>v===mul[j][i]))};}
function snapshot(raw){
 const {p,g,generators}=config(raw),cl=closure(g,generators),h=g.subgroups.find(h=>same(h.members,cl.members)),acting=p.actor==='group'?range(g.order):h.members;
 let points,maps;const c=cosets(g,h.members);
 if(p.action==='natural'){points=range(g.degree).map(i=>({id:i,label:String(i+1)}));maps=g.permutations;}
 else if(p.action==='regular'){points=g.labels.map((label,id)=>({id,label}));maps=g.multiplication;}
 else if(p.action==='conjugation'){points=g.labels.map((label,id)=>({id,label}));maps=g.conjugation;}
 else if(p.action==='cosets'){points=c.rows.map(q=>({id:q.id,label:g.labels[q.representative]+'H',members:q.members,representative:q.representative}));maps=range(g.order).map(x=>c.rows.map(q=>c.owner[g.multiplication[x][q.representative]]));}
 else {const syl=g.sylow.find(q=>q.prime===+p.prime);if(!syl)throw Error('所选素数不整除群阶，当前实验不创建该Sylow作用');points=syl.subgroupIds.map((id,i)=>({id:i,label:'H'+id,subgroupId:id,members:g.subgroups[id].members}));maps=range(g.order).map(x=>syl.subgroupIds.map(id=>syl.subgroupIds.indexOf(g.subgroups[id].conjugates[x])));}
 const point=integer(p.point,0,points.length-1,'作用点'),seen=new Set(),orbits=[];for(let i=0;i<points.length;i++){if(seen.has(i))continue;const members=sorted(acting.map(x=>maps[x][i])),stabilizer=acting.filter(x=>maps[x][i]===i);members.forEach(x=>seen.add(x));orbits.push({id:orbits.length,representative:i,members,size:members.length,stabilizer,product:members.length*stabilizer.length});}
 const selectedOrbit=sorted(acting.map(x=>maps[x][point])),stabilizer=acting.filter(x=>maps[x][point]===point),fixed=points.filter(q=>acting.every(x=>maps[x][q.id]===q.id)).map(q=>q.id),kernel=acting.filter(x=>points.every(q=>maps[x][q.id]===q.id)),fixedByElement=acting.map(x=>({element:x,points:points.filter(q=>maps[x][q.id]===q.id).map(q=>q.id)}));
 const transporters=selectedOrbit.map(y=>({point:y,elements:acting.filter(x=>maps[x][point]===y)}));
 return {schema:'sylow-actions/v2',parameters:p,group:g,selectedSubgroup:{...h,inputGenerators:generators,inputClosureWords:cl.words},quotient:quotient(g,h),subgroupDerived:derived(g,h.members),action:{kind:p.action,actingElements:acting,points,permutations:acting.map(x=>({element:x,images:maps[x]})),orbits,fixed,kernel,faithful:kernel.length===1,transitive:orbits.length===1,selected:{point,orbit:selectedOrbit,stabilizer,product:selectedOrbit.length*stabilizer.length,transporters},fixedByElement,burnsideNumerator:fixedByElement.reduce((s,q)=>s+q.points.length,0),orbitCount:orbits.length}};
}

const COLORS=['#268bd2','#b44a72','#52863c','#9467bd','#c17a18','#3d8e8e'];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function plots(d){const g=d.group,a=d.action,orders=sorted(g.subgroups.map(h=>h.order));return [
 {type:'orbits',title:'当前作用：完整轨道与固定点',points:a.points.map(p=>({id:p.id,orbit:a.orbits.find(o=>o.members.includes(p.id)).id,fixed:a.fixed.includes(p.id),selected:p.id===a.selected.point})),orbitCount:a.orbitCount,actingOrder:a.actingElements.length,stabilizerOrder:a.selected.stabilizer.length,selectedOrbitSize:a.selected.orbit.length},
 {type:'classes',title:'共轭类大小：单点类组成中心',rows:g.classes.map(c=>({id:c.id,size:c.size,central:c.size===1})),total:g.order},
 {type:'subgroups',title:'按阶统计全部子群与正规子群',rows:orders.map(order=>({order,total:g.subgroups.filter(h=>h.order===order).length,normal:g.subgroups.filter(h=>h.order===order&&h.normal).length})),total:g.subgroups.length},
 {type:'derived',title:'导出列：下降到1，或在非平凡群稳定',series:[{key:'group',label:'全群G',color:COLORS[0],orders:g.derived.stages.map(s=>s.order),solvable:g.derived.solvable},{key:'subgroup',label:'所选H',color:COLORS[1],orders:d.subgroupDerived.stages.map(s=>s.order),solvable:d.subgroupDerived.solvable}]}
];}
function svg(q){const out=['<svg xmlns="http://www.w3.org/2000/svg" width="900" height="425" viewBox="0 0 900 425" role="img"><title>'+esc(q.title)+'</title><rect width="900" height="425" fill="var(--bg,#faf7ef)"/>'];const text=(x,y,s,attrs='')=>out.push('<text x="'+x+'" y="'+y+'" fill="currentColor" font-family="system-ui,sans-serif" '+(attrs.includes('font-size=')?'':'font-size="14" ')+attrs+'>'+esc(s)+'</text>');const line=(x1,y1,x2,y2,attrs='')=>out.push('<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="currentColor" '+attrs+'/>');
 text(25,30,q.title,'font-weight="700"');
 if(q.type==='orbits'){
  text(25,60,'作用者阶 '+q.actingOrder+'；所选轨道 '+q.selectedOrbitSize+' × 稳定子 '+q.stabilizerOrder+'；轨道总数 '+q.orbitCount);
  for(const p of q.points){const x=80+62*(p.id%12),y=99+27*Math.floor(p.id/12);out.push('<circle data-point="'+p.id+'" data-orbit="'+p.orbit+'" cx="'+x+'" cy="'+y+'" r="11" fill="'+COLORS[p.orbit%COLORS.length]+'" fill-opacity=".22" stroke="'+(p.fixed?'#c17a18':'currentColor')+'" stroke-width="'+(p.selected?3:1)+'"/>');text(x,y+4,p.id,'text-anchor="middle" font-size="11"');}
  text(25,385,'圆内是作用点编号；同轨道循环用色，完整归属见表。金边=全部作用者固定，粗边=所选点。');
  text(25,409,'编号排布不表示几何距离；颜色超过六类后重复，不能仅凭颜色判断同一轨道。');
 }else if(q.type==='classes'||q.type==='subgroups'){
  const rows=q.rows,max=Math.max(1,...rows.map(r=>q.type==='classes'?r.size:r.total)),step=750/rows.length,y=v=>335-240*v/max;
  for(let i=0;i<=4;i++){const v=max*i/4;if(!Number.isInteger(v)&&i!==4)continue;line(80,y(v),850,y(v),'opacity=".15"');text(66,y(v)+4,v,'text-anchor="end"');}
  rows.forEach((r,i)=>{const x=80+step*i,w=Math.min(42,step*.65),v=q.type==='classes'?r.size:r.total;out.push('<rect data-bar="total" data-index="'+i+'" x="'+(x+(step-w)/2)+'" y="'+y(v)+'" width="'+w+'" height="'+(335-y(v))+'" fill="'+(q.type==='classes'&&r.central?'#c17a18':COLORS[0])+'"/>');
   if(q.type==='subgroups')out.push('<rect data-bar="normal" data-index="'+i+'" x="'+(x+(step-w*.45)/2)+'" y="'+y(r.normal)+'" width="'+w*.45+'" height="'+(335-y(r.normal))+'" fill="#c17a18"/>');
   text(x+step/2,y(v)-7,String(v),'text-anchor="middle"');text(x+step/2,359,q.type==='classes'?r.id:r.order,'text-anchor="middle"');});
  text(25, 60,q.type==='classes'?'总计 '+q.total+' 个群元素；横轴共轭类编号，金色为单点类。':'共 '+q.total+' 个子群；横轴子群阶数；蓝=全部，金=其中正规者。');
  text(25,402,q.type==='classes'?'类成员与中心化子在完整表中；柱宽没有群论含义。':'正规子群包含在全部子群中，不能把两种柱高相加。');
 }else{
  const max=Math.max(...q.series.flatMap(s=>s.orders)),steps=Math.max(1,...q.series.map(s=>s.orders.length-1)),x=i=>100+720*i/steps,y=v=>335-235*v/max;
  for(let i=0;i<=4;i++){const v=max*i/4;if(!Number.isInteger(v))continue;line(100,y(v),820,y(v),'opacity=".15"');text(85,y(v)+4,v,'text-anchor="end"');}
  q.series.forEach((s,j)=>{text(25+430*j, 60,s.label+'：'+s.orders.join(' → ')+'；'+(s.solvable?'到达平凡群':'末项非平凡且已稳定'));out.push('<polyline data-series="'+s.key+'" points="'+s.orders.map((v,i)=>x(i)+','+y(v)).join(' ')+'" fill="none" stroke="'+s.color+'" stroke-width="2"/>');s.orders.forEach((v,i)=>{out.push('<circle data-series="'+s.key+'" data-step="'+i+'" cx="'+x(i)+'" cy="'+y(v)+'" r="'+(j?3:5)+'" fill="'+s.color+'"/>');text(x(i)+(j?8:-8),y(v)-9,v,'text-anchor="'+(j?'start':'end')+'" font-size="12" data-value="'+s.key+'-'+i+'"');});});
  for(let i=0;i<=steps;i++)text(x(i),360,i,'text-anchor="middle"');text(25,403,'横轴为导出次数，纵轴为群阶；相同点可能重叠，完整链及交换子生成词见表。');
 }
 out.push('</svg>');return out.join('');
}
function ledgers(d){const g=d.group,a=d.action,h=d.selectedSubgroup,out=[],add=(key,title,headers,rows)=>out.push({key,title,headers,rows});
 add('summary','参数与结论',['量','完整值'],Object.entries({parameters:d.parameters,group:g.label,order:g.order,degree:g.degree,identity:g.identity,center:g.center,abelian:g.abelian,simple:g.simple,normalSubgroupIds:g.normalSubgroupIds,selectedSubgroup:h.id,selectedMembers:h.members,selectedInputGenerators:h.inputGenerators,selectedInputWords:h.inputClosureWords,orbitCount:a.orbitCount,fixed:a.fixed,kernel:a.kernel,faithful:a.faithful,transitive:a.transitive,selected:a.selected,burnsideNumerator:a.burnsideNumerator}));
 add('elements','群元素：置换数组按0基编号',['编号','循环标签(1基)','各点的像(0基)','逆元编号','元素阶','从恒等元起的幂'],g.permutations.map((v,i)=>[i,g.labels[i],v,g.inverses[i],g.elementOrders[i].order,g.elementOrders[i].powers]));
 add('multiplication','完整乘法表：行乘列，右侧先作用',['行元素',...range(g.order)],g.multiplication.map((r,i)=>[i,...r]));
 add('conjugation','完整共轭表：行g、列x，值gxg⁻¹',['共轭者',...range(g.order)],g.conjugation.map((r,i)=>[i,...r]));
 add('classes','全部共轭类及中心化子',['类编号','代表元','成员','大小','中心化子'],g.classes.map(c=>[c.id,c.representative,c.members,c.size,c.centralizer]));
 add('subgroups','全部子群及正规化子',['子群编号','阶','生成元','成员','正规','正规化子','中心化子','各g下的共轭子群编号','共轭轨道'],g.subgroups.map(h=>[h.id,h.order,h.generators,h.members,h.normal,h.normalizer,h.centralizer,h.conjugates,h.conjugacyOrbit]));
 add('words','每个子群的构造路径与全部生成词',['子群编号','父子群','新增元素','元素编号到生成词'],g.subgroups.map(h=>[h.id,h.parent,h.added,h.words]));
 add('extensions','完整闭包扩展记录',['来源子群','加入元素','结果子群'],g.enumerationTransitions.map(t=>[t.from,t.adjoin,t.to]));
 add('inclusions','全部严格包含关系',['较小子群','较大子群'],g.inclusions);add('covers','子群格的覆盖边',['较小子群','较大子群'],g.covers);
 add('sylow','Sylow必要条件与实际完整列表',['素数','指数','最大p幂','余因子','计数候选','实际数量','Sylow子群编号'],g.sylow.map(s=>[s.prime,s.exponent,s.pPower,s.cofactor,s.candidates,s.actualCount,s.subgroupIds]));
 add('points','当前作用的全部对象',['作用点编号','对象完整说明'],a.points.map(p=>[p.id,p]));
 add('action','每个作用者对全部点的置换',['作用者编号','各点的像'],a.permutations.map(p=>[p.element,p.images]));
 add('orbits','完整轨道、稳定子与计数',['轨道编号','代表点','成员','大小','稳定子','两数乘积'],a.orbits.map(o=>[o.id,o.representative,o.members,o.size,o.stabilizer,o.product]));
 add('fixed','Burnside逐元素固定点',['群元素','所有固定点'],a.fixedByElement.map(r=>[r.element,r.points]));
 add('quotient','所选H的商群或失败见证',['量','完整值'],Object.entries(d.quotient));
 for(const [prefix,z]of [['G',g.derived],['H',d.subgroupDerived]]){
  add('derived-'+prefix,prefix+'的完整导出列',['量','完整值'],Object.entries({solvable:z.solvable,length:z.length,terminal:z.terminal}));
  for(const s of z.stages){add(prefix+'-stage-'+s.index,prefix+'第'+s.index+'步：成员与闭包见证',['量','完整值'],Object.entries({index:s.index,members:s.members,order:s.order,next:s.next,stable:s.stable,closureWords:s.closureWords}));add(prefix+'-commutators-'+s.index,prefix+'第'+s.index+'步：全部交换子',['x','y','xyx⁻¹y⁻¹'],s.commutators.map(c=>[c.x,c.y,c.value]));}
 }
 return out;
}

const QUESTIONS=[['轨道大小乘稳定子大小，等于什么？',['当前作用者的阶','总是整个预设群的阶','作用点总数']],['N_G(H)与C_G(H)有什么区别？',['前者保持H这个集合，后者逐个固定H的元素','二者按定义相同','前者只固定一个作用点']],['Sylow的同余与整除条件能直接确定所有群的n_p吗？',['只能给候选，还需结构或枚举','总能唯一确定','候选数就是群元素数']],['导出列停在非平凡K且K′=K，说明什么？',['不可解，继续导出仍为K','已经可解','只是计算迭代次数用完了']]];
function presetGenerators(group,labels){const g=base(group);return labels.map(l=>{const i=g.labels.indexOf(l);if(i<0)throw Error('Missing preset generator '+l);return i;}).join(',');}
const PRESETS=[];
function preset(id,label,values){PRESETS.push({id,label,values});}
preset('s3-natural','S₃：三个点',{});
preset('s3-point','S₃：换一个观察点',{point:'1'});
preset('s3-conjugation','S₃：共轭类',{action:'conjugation'});
preset('s3-regular','S₃：正则作用',{action:'regular'});
preset('s3-h-cosets','S₃：非正规H的陪集',{action:'cosets',generators:presetGenerators('s3',['(1 2)'])});
preset('s3-k-cosets','S₃：A₃的陪集与商群',{action:'cosets',generators:presetGenerators('s3',['(1 2 3)'])});
preset('s3-h-actor','仅换位子群作用：一个固定点',{actor:'subgroup',generators:presetGenerators('s3',['(1 2)'])});
for(const [group,prime]of [['s3',2],['a4',3],['s4',2],['a5',5]]){const g=base(group),h=g.subgroups[g.sylow.find(s=>s.prime===prime).subgroupIds[0]];preset(group+'-sylow','Sylow子群自身作用：'+g.label+'，p='+prime,{group,action:'sylow',actor:'subgroup',prime:String(prime),generators:h.generators.join(',')});}
preset('a4-natural','A₄：四点作用',{group:'a4'});
preset('a4-sylow-all','A₄全群作用于Sylow 3子群',{group:'a4',action:'sylow',prime:'3'});
preset('a4-v4','A₄/V₄：三个陪集',{group:'a4',action:'cosets',generators:presetGenerators('a4',['(1 2)(3 4)','(1 3)(2 4)'])});
preset('d4-natural','D₄：正方形顶点',{group:'d4'});
preset('d4-rotations','D₄：旋转子群的商',{group:'d4',action:'cosets',generators:presetGenerators('d4',['(1 2 3 4)'])});
preset('d4-reflection','D₄：反射子群不正规',{group:'d4',action:'cosets',generators:presetGenerators('d4',['(2 4)'])});
preset('q8-regular','Q₈：八个位置的正则作用',{group:'q8',action:'regular'});
const q=base('q8');preset('q8-center','Q₈除以中心',{group:'q8',action:'cosets',generators:q.center.filter(x=>x!==q.identity).join(',')});
preset('v4','V₄：阿贝尔但非循环',{group:'v4',action:'regular'});
preset('c15','C₁₅：十五点正则作用',{group:'c15',action:'regular'});
preset('c15-subgroup','C₁₅：三阶子群与五个陪集',{group:'c15',action:'cosets',generators:base('c15').subgroups.find(h=>h.order===3).generators.join(',')});
preset('s4','S₄：24→12→4→1',{group:'s4'});
preset('s4-v4','S₄/V₄：六个陪集',{group:'s4',action:'cosets',generators:presetGenerators('s4',['(1 2)(3 4)','(1 3)(2 4)'])});
preset('s4-a4','S₄/A₄：两个陪集',{group:'s4',action:'cosets',generators:presetGenerators('s4',['(1 2 3)','(1 2 4)'])});
preset('a5','A₅：非平凡完美群',{group:'a5'});
preset('a5-classes','A₅：五个共轭类',{group:'a5',action:'conjugation'});
preset('s5','S₅：先下降再稳定',{group:'s5'});
preset('s5-a5','S₅/A₅：可解商不代表原群可解',{group:'s5',action:'cosets',generators:presetGenerators('s5',['(1 2 3)','(3 4 5)'])});
preset('trivial','平凡群：边界情形',{group:'trivial',generators:''});
const fmt=v=>v===null?'无／不适用':typeof v==='boolean'?(v?'是':'否'):Array.isArray(v)?'['+v.map(fmt).join(', ')+']':v&&typeof v==='object'?'{'+Object.entries(v).map(([k,x])=>k+': '+fmt(x)).join('; ')+'}':String(v);
const STYLE='.sylow158{color:var(--fg);min-width:0;overflow-wrap:anywhere}.sylow158 *{box-sizing:border-box}.sylow158 [hidden]{display:none!important}.sylow158 button,.sylow158 input,.sylow158 select{font:inherit;color:inherit;background:var(--bg);border:1px solid var(--border);border-radius:5px;min-height:44px;padding:8px;max-width:100%}.sylow158 button{margin:4px 4px 4px 0;cursor:pointer;white-space:normal}.sylow158 button:disabled{opacity:.5;cursor:default}.sylow158 button[aria-pressed=true]{outline:2px solid var(--accent);background:var(--block-bg)}.sylow158 :focus-visible{outline:3px solid var(--accent);outline-offset:2px}.sylow-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:16px 0}.sylow-controls label{display:grid;gap:6px;min-width:0}.sylow158 fieldset{border:1px solid var(--border);margin:12px 0;min-width:0}.sylow158 legend{max-width:100%;font-weight:600}.sylow158 p{line-height:1.7}.sylow-error{color:var(--cl-red,#b64335)}.sylow-scroll{overflow:auto;max-width:100%;min-width:0;border:1px solid var(--border);margin:10px 0}.sylow-scroll svg{display:block;min-width:900px;width:900px;height:425px;max-width:none}.sylow-scroll table{border-collapse:collapse;min-width:900px;width:max-content;max-width:none;font-size:12px}.sylow-scroll th,.sylow-scroll td{padding:7px;vertical-align:top;text-align:left;border:1px solid var(--border);min-width:40px;max-width:550px;white-space:normal;overflow-wrap:anywhere}.sylow158 details{border:1px solid var(--border);padding:10px;margin:10px 0;min-width:0}.sylow158 summary{cursor:pointer;min-height:44px;line-height:1.7}.sylow158 .sylow-summary{padding:12px;border-left:3px solid var(--accent);background:var(--block-bg)}@media(max-width:680px){.sylow-controls{grid-template-columns:minmax(0,1fr)}}@media(prefers-reduced-motion:reduce){.sylow158 *{scroll-behavior:auto!important}}';
function tableHTML(t){return '<table data-table="'+esc(t.key)+'"><caption>'+esc(t.title)+'</caption><thead><tr>'+t.headers.map(h=>'<th scope="col">'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+t.rows.map(r=>'<tr>'+r.map(v=>'<td>'+esc(fmt(v))+'</td>').join('')+'</tr>').join('')+'</tbody></table>';}
function mount(container){const doc=container.ownerDocument,win=doc.defaultView;if(!doc.getElementById('sylow158-style')){const style=doc.createElement('style');style.id='sylow158-style';style.textContent=STYLE;doc.head.appendChild(style);}
 const field=(k,label)=>'<label>'+label+'<input type="text" data-key="'+k+'"></label>';
 container.innerHTML='<div class="sylow158"><h3>群作用：每个计数都有完整的集合见证</h3><p>先分清作用者、作用对象与固定条件，再比较Sylow候选数和实际子群。输入编号可在群元素表中查对。</p><div>'+PRESETS.map(p=>'<button type="button" data-preset="'+p.id+'">'+esc(p.label)+'</button>').join('')+'</div><div class="sylow-controls"><label>有限群<select data-key="group">'+GROUPS.map(([id,label])=>'<option value="'+id+'">'+label+'</option>').join('')+'</select></label>'+field('generators','子群H的生成元编号（逗号分隔；空=平凡群）')+'<label>作用对象<select data-key="action"><option value="natural">给定置换的点</option><option value="regular">群元素，左正则作用</option><option value="conjugation">群元素，共轭作用</option><option value="cosets">左陪集G/H</option><option value="sylow">Sylow p子群，共轭作用</option></select></label><label>谁来作用<select data-key="actor"><option value="group">全群G</option><option value="subgroup">所选子群H</option></select></label>'+field('point','观察的作用点编号（从0开始）')+'<label data-sylow>素数p<select data-key="prime"><option value="2">2</option><option value="3">3</option><option value="5">5</option></select></label></div><p>编号须为无空格的非负整数，生成元不得重复。切换群或作用后，点编号与生成元可能不再有效；可改为点0、空生成元重新开始。素数只在Sylow作用中使用，且需整除群阶。</p>'+QUESTIONS.map((q,i)=>'<fieldset data-question="'+i+'"><legend>'+(i+1)+'. '+esc(q[0])+'</legend>'+q[1].map((v,j)=>'<button type="button" data-choice="'+j+'" aria-pressed="false">'+esc(v)+'</button>').join('')+'</fieldset>').join('')+'<button type="button" data-action="reveal">核对预测并展示完整结果</button><button type="button" data-action="reset">重置实验</button><p class="sylow-error" role="alert"></p><p role="status"></p><div class="sylow-results" hidden></div></div>';
 const shell=container.querySelector('.sylow158'),inputs=[...shell.querySelectorAll('[data-key]')],result=shell.querySelector('.sylow-results'),reveal=shell.querySelector('[data-action=reveal]'),error=shell.querySelector('[role=alert]'),status=shell.querySelector('[role=status]');let choices=[null,null,null,null],d=null,url=null;
 function values(){return Object.fromEntries(inputs.map(e=>[e.dataset.key,e.value]));}
 function set(v){inputs.forEach(e=>e.value=String({...DEFAULTS,...v}[e.dataset.key]));}
 function cleanup(){if(url){win.URL.revokeObjectURL(url);url=null;}result.hidden=true;result.replaceChildren();}
 function update(){cleanup();shell.querySelector('[data-sylow]').hidden=values().action!=='sylow';try{d=snapshot(values());error.textContent='';}catch(e){d=null;error.textContent=e.message;}reveal.disabled=!d||choices.some(x=>x===null);status.textContent=choices.some(x=>x===null)?'先完成四项预测。':'预测已记录，请揭晓核对。';}
 function render(){if(!d)return;cleanup();result.hidden=false;const a=d.action,g=d.group,h=d.selectedSubgroup;const tables=ledgers(d);result.innerHTML='<div class="sylow-summary">'+esc(g.label+'，阶'+g.order+'；H'+h.id+'，阶'+h.order+'。当前作用者阶'+a.actingElements.length+'；所选轨道'+a.selected.orbit.length+' × 稳定子'+a.selected.stabilizer.length+'。作用核'+fmt(a.kernel)+'。全群'+(g.derived.solvable?'可解，长度'+g.derived.length:'不可解，末项为非平凡稳定子群')+'。')+'</div><p><a data-download download="sylow-actions-run.json">下载本次全部精确记录(JSON)</a></p>'+plots(d).map((p,i)=>'<div class="sylow-scroll" role="region" tabindex="0" aria-label="图'+(i+1)+'：'+esc(p.title)+'">'+svg(p)+'</div>').join('')+'<p>以下每个表在展开时载入全部行。乘法、生成词和所有交换子均可查阅；大表可用方向键横向滚动，也可下载JSON复算。</p>'+tables.map(t=>'<details data-ledger="'+t.key+'"><summary>'+esc(t.title)+'（'+t.rows.length+'行）</summary><div class="sylow-scroll" role="region" tabindex="0" aria-label="'+esc(t.title)+'"></div></details>').join('');
  url=win.URL.createObjectURL(new win.Blob([JSON.stringify(d,null,2)+'\n'],{type:'application/json'}));result.querySelector('[data-download]').href=url;
  for(const t of tables){const detail=result.querySelector('[data-ledger="'+t.key+'"]');detail.addEventListener('toggle',()=>{if(detail.open&&!detail.querySelector('table'))detail.querySelector('[role=region]').innerHTML=tableHTML(t);});}
  status.textContent=choices.filter(v=>v===0).length+' / 4；结果已显示。正确选项均是每题第一项；可据完整证书检查自己的推理。';
 }
 inputs.forEach(e=>e.addEventListener(e.tagName==='SELECT'?'change':'input',update));
 shell.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>{set(PRESETS.find(p=>p.id===b.dataset.preset).values);update();}));
 shell.querySelectorAll('[data-question]').forEach((f,i)=>f.querySelectorAll('[data-choice]').forEach(b=>b.addEventListener('click',()=>{choices[i]=+b.dataset.choice;f.querySelectorAll('button').forEach(q=>q.setAttribute('aria-pressed',String(q===b)));if(!result.hidden)render();else update();})));
 reveal.addEventListener('click',render);shell.querySelector('[data-action=reset]').addEventListener('click',()=>{choices=[null,null,null,null];shell.querySelectorAll('[data-choice]').forEach(b=>b.setAttribute('aria-pressed','false'));set(DEFAULTS);update();shell.querySelector('[data-choice]').focus();});set(DEFAULTS);update();
}
function selfTest(){let checks=0;const ck=(v,m)=>{checks++;if(!v)throw Error(m);};for(const [id,n,sub]of [['s3',6,6],['a4',12,10],['d4',8,10],['q8',8,6],['v4',4,5],['c15',15,4],['s4',24,30],['a5',60,59],['s5',120,156],['trivial',1,1]]){const g=base(id);ck(g.order===n&&g.subgroups.length===sub,'finite group '+id);}ck(base('s4').derived.stages.map(s=>s.order).join()==='24,12,4,1','S4');ck(base('a5').simple&&!base('a5').derived.solvable,'A5');ck(base('s5').derived.stages.map(s=>s.order).join()==='120,60','S5');for(const p of PRESETS){const d=snapshot(p.values);ck(d.action.selected.product===d.action.actingElements.length,p.id);}return {status:'PASS',checks,presets:PRESETS.length};}

return {GROUPS,DEFAULTS,PRESETS,QUESTIONS,config,snapshot,base,plots,svg,ledgers,fmt,tableHTML,mount,selfTest};
});
