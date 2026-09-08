"use strict";
const assert=require("node:assert/strict"),lab=require("../course-shared/labs/research-derived-fibers.js");let count=0;
function rank(A){const m=A.map(r=>r.slice());let pivot=0;
 for(let col=0;col<m[0].length&&pivot<m.length;col++){let row=pivot;while(row<m.length&&Math.abs(m[row][col])<1e-12)row++;if(row===m.length)continue;
  [m[row],m[pivot]]=[m[pivot],m[row]];const z=m[pivot][col];m[pivot]=m[pivot].map(x=>x/z);
  for(let i=0;i<m.length;i++)if(i!==pivot){const c=m[i][col];m[i]=m[i].map((v,j)=>v-c*m[pivot][j]);}pivot++;
 }return pivot;}
// Exact coefficient map on polynomial representatives: degree<=3 -> degree<=4.
// Expanding the target by one degree is essential: truncating t^4 would create a false kernel.
function differential(family,a){const free=family===0?2:1,torsion=family===1?1:0,rows=free*5+torsion,cols=free*4+torsion;
 const D=Array.from({length:rows},()=>Array(cols).fill(0));
 for(let b=0;b<free;b++)for(let d=0;d<4;d++){D[b*5+d][b*4+d]=-a;D[b*5+d+1][b*4+d]=1;}
 if(torsion)D[rows-1][cols-1]=-a;
 return D;
}
for(let k=-20;k<=20;k++)for(const family of [0,1]){
 const a=k/10,m=lab.compute("torsion",{family,a}).numeric,D=differential(family,a),r=rank(D);
 assert.equal(m.h0,D.length-r);assert.equal(m.hminus1,D[0].length-r);count+=2;
}
const square=lab.compute("torsion",{family:0,a:0}),torsion=lab.compute("torsion",{family:1,a:0});
assert.equal(square.numeric.h0,torsion.numeric.h0);assert.notEqual(square.numeric.hminus1,torsion.numeric.hminus1);count+=2;
assert.throws(()=>lab.compute("torsion",{family:.5}));assert.throws(()=>lab.compute("torsion",{a:Infinity}));count+=2;
console.log(`derived-fiber checks: PASS (${count}; independent polynomial coefficient ranks with untruncated targets)`);
