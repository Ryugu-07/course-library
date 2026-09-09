'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert'),root=path.resolve(__dirname,'..');
const m=require(path.join(root,'course-shared/labs/rings-fields.js')),ref=require('./fixtures/rings-reference.json');
let checks=0;function ok(v,msg){checks++;assert(v,msg)}function eq(a,b,msg){ok(JSON.stringify(a)===JSON.stringify(b),msg)}
const key=a=>JSON.stringify(a),range=n=>Array.from({length:n},(_,i)=>i);
for(let n=2;n<=15;n++){
 const r=m.analyzeZMod(n),units=range(n).filter(a=>range(n).some(b=>a*b%n===1)),zeros=range(n).filter(a=>a&&range(n).some(b=>b&&a*b%n===0));
 eq(r.units,units,'enumerated mod-n units');eq(r.zeroDivisors,zeros,'enumerated mod-n zero divisors');
 for(const w of r.inverses)ok(w.element*w.inverse%n===1,'actual inverse');for(const w of r.witnesses)ok(w.element&&w.other&&w.element*w.other%n===0,'nonzero witness');
 const ideals=[];for(let mask=1;mask<2**n;mask+=2){const I=range(n).filter(i=>mask>>i&1),S=new Set(I);if(I.every(a=>I.every(b=>S.has((a+b)%n)))&&I.every(a=>range(n).every(b=>S.has(a*b%n))))ideals.push(I);}
 eq(r.ideals.map(i=>i.members).sort((a,b)=>a.length-b.length),ideals.sort((a,b)=>a.length-b.length),'all ideals independent subsets');
 for(const I of r.ideals){const q=m.quotientReport(n,I.generator);eq(q.members,I.members,'quotient kernel');eq(q.map,range(n).map(a=>a%q.d),'actual map');
  for(let a=0;a<n;a++)for(let b=0;b<n;b++){
   ok(q.addition[q.map[a]][q.map[b]]===q.map[(a+b)%n],'quotient addition all representatives');
   ok(q.multiplication[q.map[a]][q.map[b]]===q.map[a*b%n],'quotient multiplication all representatives');
  }
 }
}
for(const spec of m.EXTENSIONS){
 const r=m.analyzeExtension(spec.id),f=ref.extensions[spec.id],index=a=>r.elements.findIndex(b=>key(a)===key(b));
 eq(r.elements,f.pairs,'pair ordering');eq(r.roots,f.roots,'independent polynomial roots');ok(r.irreducible===f.irreducible,'SymPy irreducibility');
 eq(r.ideals.map(I=>I.map(index)),f.ideals,'all quadratic quotient ideals');
 ok(Object.isFrozen(r)&&Object.isFrozen(r.relation)&&Object.isFrozen(r.elements[0]),'cached result immutable');
 for(const a of r.elements)for(const b of r.elements){
  eq(r.multiply(a,b),f.pairs[f.products[index(a)][index(b)]],'independent polynomial remainder product');
  eq(r.add(a,b),f.pairs[f.addition[index(a)][index(b)]],'addition');
  for(const c of r.elements){
   eq(r.multiply(r.multiply(a,b),c),r.multiply(a,r.multiply(b,c)),'associativity');
   eq(r.multiply(a,r.add(b,c)),r.add(r.multiply(a,b),r.multiply(a,c)),'distributivity');
  }
 }
 for(const w of r.inverses)eq(r.multiply(w.element,w.inverse),[1,0],'true quadratic inverse');
 for(const w of r.witnesses){ok(key(w.element)!=='[0,0]'&&key(w.other)!=='[0,0]','nonzero factors');eq(r.multiply(w.element,w.other),[0,0],'true zero product');}
 for(const w of r.frobenius){let value=[1,0];for(let i=0;i<r.prime;i++)value=r.multiply(value,w.element);eq(value,w.image,'Frobenius exact power');}
 const expected=spec.id==='f2-repeated'?[[1,1]]:[];eq(r.nilpotents,expected,'nilpotents distinguish repeated vs split');
 const imageCount=new Set(r.frobenius.map(w=>key(w.image))).size;ok((imageCount===r.order)===(spec.id!=='f2-repeated'),'Frobenius injectivity including split ring');
}
for(let h=0;h<5;h++){
 const f=ref.galois[h],baseline=m.galoisReport(h),basis=f.basis.map(v=>v.indexOf(1));eq(baseline.basis,basis,'independent rational nullspace');
 ok(baseline.degree*baseline.relativeDegree===4,'tower sizes');
 for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++)for(let c=-2;c<=2;c++)for(let d=-2;d<=2;d++){
  const coeff=[a,b,c,d],r=m.galoisReport(h,coeff);ok(r.fixed===coeff.every((v,j)=>basis.includes(j)||v===0),'every coefficient fixed iff in nullspace');
  for(const image of r.images){const op=m.GAL_OPS.find(o=>o.label===image.label);eq(image.coefficients,coeff.map((v,j)=>v*op.signs[j]),'exact image coefficients');}
 }
}
// Automorphism signs preserve products of the four algebraic basis elements.
const basisProduct=(i,j)=>({index:i^j,factor:(i&j&1?2:1)*(i&j&2?3:1)});
for(const op of m.GAL_OPS)for(let i=0;i<4;i++)for(let j=0;j<4;j++){
 const p=basisProduct(i,j);ok(op.signs[i]*op.signs[j]*p.factor===op.signs[p.index]*p.factor,'sign action preserves basis multiplication');
}
for(const bad of [null,'12',NaN,Infinity,1,16,2.5]){checks++;assert.throws(()=>m.analyzeZMod(bad));}
for(const bad of [null,'',42,'missing']){checks++;assert.throws(()=>m.analyzeExtension(bad));}
for(const d of [0,5,2.5,'3',NaN]){checks++;assert.throws(()=>m.quotientReport(12,d));}
for(const pair of [[],[0],[0,0,0],[2,0],[-1,0],[0,'1'],[NaN,0]]){checks++;assert.throws(()=>m.analyzeExtension().multiply(pair,[1,0]));}
for(const args of [[5,[0,0,0,0]],[-1,[0,0,0,0]],[0,[1,2,3]],[0,[10,0,0,0]],[0,[0.5,0,0,0]],[0,[null,0,0,0]]]){checks++;assert.throws(()=>m.galoisReport(...args));}
const svg=fs.readFileSync(path.join(root,'math-course/images/alg-abs-02-galois-lattice.svg'),'utf8');
ok((svg.match(/data-node=/g)||[]).length===10,'actual 10 lattice nodes');ok((svg.match(/data-edge=/g)||[]).length===12,'actual 12 inclusions');
for(let i=0;i<4;i++)for(let j=0;j<4;j++)ok(svg.includes('data-sign="'+i+','+j+'">'+(m.GAL_OPS[i].signs[j]===1?'+':'−')+'</text>'),'static sign coefficient');
ok(!svg.includes('data and control'),'placeholder removed');
console.log('rings and fields independent: PASS',{checks});
