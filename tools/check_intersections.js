"use strict";
const assert=require("node:assert/strict"),lab=require("../course-shared/labs/research-intersections.js");let count=0;
// Multiplication by x^m, with target degree expanded: truncating the target
// to the domain degree would create a false kernel at its upper boundary.
function rank(M){M=M.map(r=>r.slice());let r=0;for(let c=0;c<M[0].length&&r<M.length;c++){let p=M.findIndex((row,i)=>i>=r&&Math.abs(row[c])>1e-12);if(p<0)continue;[M[r],M[p]]=[M[p],M[r]];let a=M[r][c];M[r]=M[r].map(x=>x/a);for(let k=0;k<M.length;k++)if(k!==r){a=M[k][c];M[k]=M[k].map((x,j)=>x-a*M[r][j]);}r++;}return r;}
for(let D=0;D<=12;D++)for(let m=1;m<=6;m++){
 let A=Array.from({length:D+m+1},(_,i)=>Array.from({length:D+1},(_,j)=>+(i===j+m))),r=rank(A);assert.equal(r,D+1);assert.equal(A.length-r,m);count+=2;
 const d=lab.compute('plane',{kind:m===1?0:1,m:Math.max(2,m)}).numeric;assert.equal(d.H1,'0');assert.equal(d.length,m);count+=2;
}
for(let D=0;D<=12;D++){const Z=Array.from({length:D+1},()=>Array(D+1).fill(0));assert.equal(rank(Z),0);assert.equal(Z.length-rank(Z),D+1);count+=2;}
for(let m=2;m<=6;m++){const d=lab.compute('plane',{kind:2,m}).numeric;assert.equal(d.H0,'C[x]');assert.equal(d.H1,'C[x]');assert.equal(d.length,null);assert.equal(d.rank,1);count+=4;}
for(const values of [{kind:.5},{kind:3},{m:1},{m:6.5}]){assert.throws(()=>lab.compute('plane',values));count++;}
console.log(`Intersection checks: PASS (${count}; expanded polynomial targets, no fake truncation kernel, growing self-intersection modules)`);
