"use strict";
const assert=require('node:assert/strict'),lab=require('../course-shared/labs/research-derived-products');let count=0;
const pop=m=>m.toString(2).replace(/0/g,'').length,eq=(a,b)=>{assert.deepEqual(a,b);count++;},sgn=(a,s)=>Object.fromEntries(Object.entries(a).map(([m,p])=>[m,p.map(x=>s*x)]));
// Independent concatenation/sort definition of an exterior product.
function oracle(a,b,r){const list=[];for(const m of [a,b])for(let j=0;j<r;j++)if(m&(1<<j))list.push(j);if(new Set(list).size<list.length)return {};let swaps=0;for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++)if(list[i]>list[j])swaps++;return {[a|b]:[(-1)**swaps]};}
for(let r=1;r<=4;r++){const n=1<<r,eqs=Array.from({length:r},(_,i)=>[i+1,1,i%2]);for(let a=0;a<n;a++){
 const u=lab.term(a);eq(lab.differential(lab.differential(u,eqs),eqs),{});
 for(let b=0;b<n;b++){const v=lab.term(b);eq(lab.times(u,v),oracle(a,b,r));eq(lab.times(u,v),sgn(lab.times(v,u),(-1)**(pop(a)*pop(b))));eq(lab.differential(lab.times(u,v),eqs),lab.plus(lab.times(lab.differential(u,eqs),v),sgn(lab.times(u,lab.differential(v,eqs)),(-1)**pop(a))));
  for(let c=0;c<n;c++)eq(lab.times(lab.times(u,v),lab.term(c)),lab.times(u,lab.times(v,lab.term(c))));
 }
}}
for(const e of lab.examples){const u=e.u;eq(lab.differential(lab.differential(u,e.eq),e.eq),{});}
const e=lab.examples[3];eq(lab.differential(e.u,e.eq),{});eq(lab.differential(lab.term(3),e.eq),lab.times(lab.term(0,[0,1]),e.u));eq(lab.times(e.u,e.u),{});
const bad=[[0,1],[0,1]],cycle={1:[-1],2:[1]};eq(lab.differential(cycle,bad),{});eq(lab.differential(lab.term(3),bad),lab.times(lab.term(0,[0,1]),cycle));
for(const topic of lab.topics)for(const c of lab.configs[topic].controls)for(const end of [c[2],c[3]]){lab.compute(topic,{[c[0]]:end});count++;}
assert.throws(()=>lab.compute('koszul',{example:4}));count++;
console.log(`Derived-product checks: PASS (${count}; exact polynomial/exterior arithmetic, independent wedge oracle, associativity, d squared and Leibniz)`);
