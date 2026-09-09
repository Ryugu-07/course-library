"use strict";
const assert=require('assert'),m=require('../course-shared/labs/physics-magnetic-order');let checks=0;
function near(a,b,tol=1e-9){assert(Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);checks++;}
function free(a,b,c){const entropy=x=>{const p=(1+x)/2,q=1-p;return(p?p*Math.log(p):0)+(q?q*Math.log(q):0);};return (c.model==='ferro'?-1:1)*c.coupling*a*b/2-c.field*(a+b)/2+c.temperature*(entropy(a)+entropy(b))/2;}
for(const model of ['ferro','antiferro'])for(const K of [.4,1,1.8])for(const T of [.2,.6,.9999,1,1.001,1.8,2.8])for(const h of [-.6,-.01,0,.01,.6]){
 const c={model,coupling:K,temperature:T,field:h},r=m.solveMeanField(c),s=model==='ferro'?1:-1;
 near(r.residualA,0);near(r.residualB,0);near(r.freeEnergy,free(r.mA,r.mB,c));assert(T*T-K*K*(1-r.mA*r.mA)*(1-r.mB*r.mB)>-1e-10);checks++;
 // An independent two-dimensional free-energy mesh must not beat the stationary minimum.
 for(let i=0;i<=24;i++)for(let j=0;j<=24;j++){assert(r.freeEnergy<=free(-1+i/12,-1+j/12,c)+1e-10);checks++;}
 const flip=m.solveMeanField({...c,field:-h});near(flip.freeEnergy,r.freeEnergy);if(h!==0)near(flip.magnetization,-r.magnetization);
 const swapped=free(r.mB,r.mA,c);near(swapped,r.freeEnergy);
 const chi=m.susceptibility(c);
 if(T>K&&h===0)near(chi,1/(T-s*K),2e-10);
 if(h!==0&&Math.abs(h)<.59){const dx=1e-5,l=m.solveMeanField({...c,field:h-dx}),u=m.solveMeanField({...c,field:h+dx});near(chi,(u.magnetization-l.magnetization)/(2*dx),1e-6);}
}
near(m.solveMeanField({coupling:1,temperature:.9999,field:0}).magnetization,.01731981524349,1e-10);
assert.equal(m.susceptibility({coupling:1,temperature:1,field:0}),Infinity);checks++;
near(m.susceptibility({model:'antiferro',coupling:1,temperature:1,field:0}),.5);
for(const [K,m0] of [[.4,.1],[1,.2],[1.8,.1]]){const Tc=K*(1-m0*m0),hc=Tc*Math.atanh(m0)+K*m0,critical={model:'antiferro',coupling:K,temperature:Tc,field:hc};near(m.solveMeanField(critical).staggered,0,2e-12);near(m.susceptibility(critical),1/(2*K),2e-12);const below=m.solveMeanField({...critical,temperature:Tc*(1-1e-12)});assert(Math.abs(below.staggered)>2e-7);checks++;const above=m.solveMeanField({...critical,temperature:Tc*(1+1e-12)});near(above.staggered,0,2e-12);}
near(Math.abs(m.solveMeanField({model:'antiferro',coupling:1,temperature:.95999999999904,field:.39462325189191894}).staggered),.000001628710228035701,2e-10);
for(const c of [{coupling:.4},{coupling:1.8,model:'antiferro'}]){const curve=m.phaseCurve(c,67);near(curve[0].temperature,.2);near(curve.at(-1).temperature,2.8);for(let i=1;i<curve.length;i++){assert(curve[i].order<=curve[i-1].order+1e-10);checks++;}}
for(const h of [-.6,0,.6]){const c={model:'antiferro',coupling:1,temperature:.6,field:h},curve=m.landscape(c,61);for(let i=0;i<curve.length;i++){near(curve[i].freeEnergy,curve[curve.length-1-i].freeEnergy);near(curve[i].freeEnergy,free(curve[i].mA,curve[i].mB,c));}}
console.log(`Magnetic independent checks: ${checks} PASS`);
