"use strict";
const assert=require("node:assert/strict"),lab=require("../course-shared/labs/research-fibers.js");let checks=0;
function near(a,b){assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);checks++;}
for(let k=-20;k<=20;k++){
 const a=k/10,m=lab.compute("square",{a}).numeric;
 assert.equal(m.distinct,a===0?1:2);assert.equal(m.reduced,a!==0);assert.equal(m.distinct*m.multiplicity,2);checks+=3;
 // The actual complex roots and regular representation obey x^2=a, including negative real a.
 for(const [x,y] of m.roots){near(x*x-y*y,a);near(2*x*y,0);}
 const A=m.multiplyX;for(let i=0;i<2;i++)for(let j=0;j<2;j++)near(A[i][0]*A[0][j]+A[i][1]*A[1][j],i===j?a:0);
 // Multiplication in the quotient ring evaluated at each complex root agrees with ordinary multiplication.
 const u=[2,3],v=[-1,4],product=[u[0]*v[0]+a*u[1]*v[1],u[0]*v[1]+u[1]*v[0]];
 for(const [x,y] of m.roots){const ur=u[0]+u[1]*x,ui=u[1]*y,vr=v[0]+v[1]*x,vi=v[1]*y;near(product[0]+product[1]*x,ur*vr-ui*vi);near(product[1]*y,ur*vi+ui*vr);}
}
assert.notDeepEqual(lab.fiber(0).multiplyX,[[0,0],[0,0]]);checks++;
assert.throws(()=>lab.compute("square",{a:3}));assert.throws(()=>lab.compute("square",{a:NaN}));checks+=2;
console.log(`fiber checks: PASS (${checks}; complex roots, nonzero nilpotent multiplication, quotient-ring evaluations)`);
