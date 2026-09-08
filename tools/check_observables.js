"use strict";
const assert=require("node:assert/strict");
const lab=require("../course-shared/labs/research-observables.js");
let checks=0;
const equal=(a,b)=>{assert.deepEqual(a,b);checks++;};
const near=(a,b,t=1e-8)=>{assert.ok(Math.abs(a-b)<t,`${a} vs ${b}, tolerance ${t}`);checks++;};
function integrate(f,a,b,N=16000){let s=f(a)+f(b);for(let j=1;j<N;j++)s+=(j%2?4:2)*f(a+(b-a)*j/N);return s*(b-a)/(3*N);}
// Class equality uses a change of lift; middle-group torsion is checked by
// enumerating solutions in the finite quotient, without a gcd implementation.
for(let n=2;n<=12;n++)for(let a=0;a<=12;a++){
 const r=lab.compute("ext",{n,a}).numeric;
 const divisible=[];for(let k=0;k<n;k++)if(a*k%n===0)divisible.push(k);
 equal(r.torsion,divisible.length);
 const lifted=[];for(let b=-12;b<=12;b++)if(a+n*b===0)lifted.push(b);
 equal(r.split,lifted.length>0);
 equal(r.class,a-n*Math.floor(a/n));
}
equal(lab.compute("ext",{n:6,a:1}).numeric.torsion,lab.compute("ext",{n:6,a:5}).numeric.torsion);
assert.notEqual(lab.compute("ext",{n:6,a:1}).numeric.class,lab.compute("ext",{n:6,a:5}).numeric.class);checks++;

// Integrate dy/dphi=i alpha y in real components with RK4, including negative alpha.
function monodromy(alpha,turns){let re=1,im=0;const N=12000,h=2*Math.PI*turns/N;
 const f=(x,y)=>[-alpha*y,alpha*x];
 for(let j=0;j<N;j++){const a=f(re,im),b=f(re+h*a[0]/2,im+h*a[1]/2),c=f(re+h*b[0]/2,im+h*b[1]/2),d=f(re+h*c[0],im+h*c[1]);re+=h*(a[0]+2*b[0]+2*c[0]+d[0])/6;im+=h*(a[1]+2*b[1]+2*c[1]+d[1])/6;}return [re,im];}
for(const alpha of [-2,-.7,0,.5,1,1.8,2])for(const m of [-2,0,2])for(const w of [1,2,4]){
 const v=lab.compute("connection",{alpha,m,w}).numeric,exact=monodromy(alpha-m,w);
 near(v.re,exact[0],1e-7);near(v.im,exact[1],1e-7);
 const base=lab.compute("connection",{alpha,m:0,w}).numeric;near(v.re,base.re);near(v.im,base.im);
 equal(v.dimension,Number.isInteger(alpha)?1:0);
}
const twice=lab.compute("connection",{alpha:.5,m:0,w:2}).numeric;near(twice.re,1);equal(twice.dimension,0);

// Direct 2x2 matrices: evolve B and take the thermal commutator trace.
const add=(a,b)=>[a[0]+b[0],a[1]+b[1]],mul=(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]];
const phase=t=>[Math.cos(t),Math.sin(t)];
const matmul=(a,b)=>a.map((r,i)=>b[0].map((_,j)=>r.reduce((s,x,k)=>add(s,mul(x,b[k][j])),[0,0])));
function commutatorKernel(delta,beta,t){
 const z=[0,0],B=[[z,[1,0]],[[1,0],z]],U=[[phase(delta*t/2),z],[z,phase(-delta*t/2)]],Ud=[[phase(-delta*t/2),z],[z,phase(delta*t/2)]];
 const Bt=matmul(matmul(U,B),Ud),left=matmul(Bt,B),right=matmul(B,Bt);
 // basis order excited, ground; Boltzmann weights independently normalized
 const pe=Math.exp(-beta*delta)/(1+Math.exp(-beta*delta)),pg=1-pe;
 const trace=add(mul([pe,0],add(left[0][0],mul([-1,0],right[0][0]))),mul([pg,0],add(left[1][1],mul([-1,0],right[1][1]))));
 return mul([0,1],trace)[0];
}
for(const delta of [.5,1,2])for(const beta of [.2,2,5]){
 const v=lab.compute("response",{delta,beta}).numeric;
 near(v.pg+v.pe,1);near(v.pe/v.pg,Math.exp(-beta*delta));near(v.noisePositive+v.noiseNegative,2*Math.PI);
 for(const t of [.3,1,2])near(commutatorKernel(delta,beta,t),2*v.r*Math.sin(delta*t));
 for(const omega of [.3,1.2]){
  const eta=.2,r=lab.compute("response",{delta,beta,eta,omega}).numeric,T=150;
  // Numerical transform of the causal real time kernel; no pole formula.
  near(r.re,integrate(t=>commutatorKernel(delta,beta,t)*Math.exp(-eta*t)*Math.cos(omega*t),0,T),2e-7);
  near(r.im,integrate(t=>commutatorKernel(delta,beta,t)*Math.exp(-eta*t)*Math.sin(omega*t),0,T),2e-7);
 }
 // Exact thermal ground-axis rotation under H=Delta sigma_z/2-f sigma_x.
 const eps=1e-5;const equilibrium=f=>{const e=Math.hypot(delta/2,f);return f/e*Math.tanh(beta*e);};
 near(v.staticIdeal,(equilibrium(eps)-equilibrium(-eps))/(2*eps),1e-8);
}
for(const omega of [-3,-1,0,1,3]){const p=lab.compute("response",{omega}).numeric,n=lab.compute("response",{omega:-omega}).numeric;near(p.re,n.re);near(p.im,-n.im);}

// Direct integration of the two complex oscillating terms, including interference.
for(const theta of [.1,.5,.9])for(const T of [2,20,40])for(const omega of [.2,1,1.7]){
 const a=.03,v=lab.compute("spectroscopy",{theta,T,omega,a}).numeric;
 const re=integrate(t=>Math.cos(omega*t)*Math.cos(t),0,T,8000),im=integrate(t=>Math.cos(omega*t)*Math.sin(t),0,T,8000);
 near(v.p,a*a*Math.sin(Math.PI*theta)**2/4*(re*re+im*im),1e-9);
 near(v.weightedArea*2/(Math.PI*a*a),v.metric);
}
// Independent unitary time stepping for the full linearized driven two-level
// Hamiltonian. This verifies the weak-drive approximation, not its validity at large P.
function exactDriven(a,T,omega){let u=[[1,0],[0,0]],N=12000,h=T/N;
 for(let j=0;j<N;j++){
  const t=(j+.5)*h,x=a*.5*Math.cos(omega*t),z=-.5,n=Math.hypot(x,z),c=Math.cos(n*h),s=Math.sin(n*h)/n;
  const M=[[[c,-s*z],[0,-s*x]],[[0,-s*x],[c,s*z]]];
  u=M.map(r=>r.reduce((v,el,k)=>add(v,mul(el,u[k])),[0,0]));
 }
 return u[1][0]**2+u[1][1]**2;
}
for(const omega of [.5,1,1.5]){const v=lab.compute("spectroscopy",{theta:.5,a:.01,T:10,omega}).numeric;near(v.p,exactDriven(.01,10,omega),2e-7);}
const bad=lab.compute("spectroscopy",{theta:.5,a:.2,T:40,omega:1}).numeric;assert.ok(bad.p>1&&bad.exceedsOne);checks++;
for(const topic of lab.topics){const key=Object.keys(lab.defaults(topic))[0];assert.throws(()=>lab.compute(topic,{[key]:NaN}));checks++;}
console.log(`observables checks: PASS (${checks}; independent commutators, quadrature, time evolution and extension enumeration)`);
