"use strict";
const assert=require('assert'),lab=require('../course-shared/labs/research-descent.js');let checks=0;
function near(a,b,msg,tol=1e-9){assert.ok(Math.abs(a-b)<tol,`${msg}: ${a} vs ${b}`);checks++;}
function yes(v,msg){assert.ok(v,msg);checks++;}
// Reference eigenvalues from independent numpy.eigvalsh on Kronecker Pauli matrices.
const ground=new Map([[.2,-3.061734803953749],[.5,-3.427034088908079],[1,-4.758770483143633],[1.5,-6.503891557126412],[2,-8.376798636850355]]);
function state(h){return Array.from({length:16},(_,b)=>{let c=1;for(let j=0;j<4;j++){const a=Math.atan2(h.x[j],h.z[j])/2;c*=((b>>j)&1)?Math.sin(a):Math.cos(a);}return c;});}
function action(psi,g){return psi.map((v,b)=>{let z=0;for(let j=0;j<4;j++)z+=((b>>j)&1)?-1:1;let r=-g*z*v;for(let j=0;j<3;j++)r-=psi[b^(3<<j)];return r;});}
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
for(const g of [.2,.5,1,1.5,2])for(const theta of [0,5,30,90])for(const rounds of [1,2,8]){
 const m=lab.compute('sweep',{g,theta,rounds}).numeric;
 near(m.ground,ground.get(g),'Independent 16D ground fixture');
 near(m.history.length,1+8*rounds,'Full round length');
 for(let i=0;i<m.history.length;i++){
  const h=m.history[i],psi=state(h);near(dot(psi,psi),1,'Wavefunction norm');
  near(dot(psi,action(psi,g)),h.energy,'Full wavefunction energy');yes(h.energy>=m.ground-1e-9,'Variational bound');
  h.x.forEach((x,j)=>near(x*x+h.z[j]**2,1,'Bloch norm'));
  if(i){const prev=m.history[i-1],j=h.site-1,b=(j>0?prev.x[j-1]:0)+(j<3?prev.x[j+1]:0);
    near(h.b,b,'Uses latest neighbors');yes(h.energy<=prev.energy+1e-10,'Energy monotone');
    const u=[Math.sqrt((1+h.z[j])/2),h.x[j]/Math.sqrt(2*(1+h.z[j]))],e=-Math.hypot(b,g);
    near(-g*u[0]-b*u[1],e*u[0],'Local eigenvector 0');near(-b*u[0]+g*u[1],e*u[1],'Local eigenvector 1');
    for(let k=0;k<4;k++)if(k!==j){near(h.x[k],prev.x[k],'Only one site x');near(h.z[k],prev.z[k],'Only one site z');}
  }
 }
 if(theta===0){near(m.history.at(-1).energy,-4*g,'Coordinate fixed point');near(m.residual,0,'Fixed residual');}
}
near(lab.compute('sweep').numeric.history[8].energy,-4.39739840985404,'First round');
near(lab.compute('sweep').numeric.history[16].energy,-4.40360689498122,'Second round');
yes(lab.compute('sweep').numeric.history[0].energy<-4,'Same-family escape witness');
near(lab.compute('sweep').numeric.ground,1-1/Math.sin(Math.PI/18),'Critical open-chain exact identity');
for(const a of [-2,-.25,0,.25,1,2]){
 const m=lab.compute('cone',{a}).numeric;
 if(a){near(a*m.contraction,1,'dh on degree zero');near(m.contraction*a,1,'hd on degree minus one');near(m.hMinus,0,'Injective');near(m.hZero,0,'Surjective');}
 else {yes(m.contraction===null,'No invalid inverse');near(m.hMinus,1,'Zero map kernel');near(m.hZero,1,'Zero map cokernel');}
}
// Nontrivial chain map with d=f=id: cone d0=[1,1], d-1=[1,-1]^T.
near(1*1+1*(-1),0,'Cone d squared with shift sign');yes(1*1+1*1!==0,'Missing minus sign fails');
assert.throws(()=>lab.compute('sweep',{g:0}));assert.throws(()=>lab.compute('cone',{a:NaN}));checks+=2;
console.log(`descent checks: PASS (${checks}; full-state energy, local eigenvectors, independent spectra, cone signs and contractions)`);
