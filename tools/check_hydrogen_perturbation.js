'use strict';
const assert=require('assert'),h=require('../course-shared/labs/hydrogen-spectrum'),p=require('../course-shared/labs/perturbation-avoided-crossing');let checks=0;
function near(x,y,t=2e-11){checks++;assert(Math.abs(x-y)<=t,`${x} != ${y} (${t})`);}
function fact(n){let x=1;for(let k=2;k<=n;k++)x*=k;return x;}
function lag(k,a,x){let y=0;for(let j=0;j<=k;j++)y+=(-1)**j*fact(k+a)/(fact(k-j)*fact(a+j))*x**j/fact(j);return y;}
function R(n,l,r){return Math.sqrt((2/n)**3*fact(n-l-1)/(2*n*fact(n+l)))*Math.exp(-r/n)*(2*r/n)**l*lag(n-l-1,2*l+1,2*r/n);}
function simpson(f,A,B,N=12000){const dx=(B-A)/N;let sum=0;for(let i=0;i<=N;i++)sum+=(i===0||i===N?1:i%2?4:2)*f(A+i*dx);return sum*dx/3;}
for(let n=1;n<=5;n++)for(let l=0;l<n;l++){
 for(let k=0;k<=120;k++){const r=k*n*n/15;near(h.radialWavefunction(n,l,r),R(n,l,r),1e-12);}
 near(simpson(r=>r*r*R(n,l,r)**2,0,20*n*n),1,2e-8);
 near(simpson(r=>r**3*R(n,l,r)**2,0,20*n*n),.5*(3*n*n-l*(l+1)),2e-7);
 const coarse=h.radialSummary(n,l),fine=h.radialSummary(n,l,720);
 near(fine.normalization,simpson(r=>r*r*R(n,l,r)**2,0,8*n*n),3e-5);
 near(coarse.nodePositions.length,n-l-1,0);
 for(const z of coarse.nodePositions)near(lag(n-l-1,2*l+1,2*z/n),0,5e-10);
}
near(h.radialProbability(2,0,0),0,0);near(h.radialWavefunction(2,0,0)**2/(4*Math.PI),1/(8*Math.PI));
// Specific angular integrals: z conserves m through the azimuthal integral.
for(let d=-4;d<=4;d++)near(simpson(phi=>Math.cos(d*phi),0,2*Math.PI),d===0?2*Math.PI:0);
for(let n=1;n<=5;n++){let count=0;for(let l=0;l<n;l++)for(let m=-l;m<=l;m++)count++;near(h.shellDegeneracy(n,false),count,0);near(h.shellDegeneracy(n,true),2*count,0);}
for(const x of [0,10,20,-10]){checks++;assert.equal(h.format(x,0),String(x));}
// Jacobi rotation: calculate eigenvector components then H quadratic forms.
for(const d of [-1.5,-.8,-.01,0,.01,.8,1.5])for(const v of [-.3,-.04,0,.04,.3]){
 const theta=.5*Math.atan2(2*v,d),u=[-Math.sin(theta),Math.cos(theta)],w=[Math.cos(theta),Math.sin(theta)];
 const quad=z=>d/2*(z[0]**2-z[1]**2)+2*v*z[0]*z[1];
 for(let phi=-180;phi<=180;phi+=9){
  const a=p.compute({delta:d,v,phiDeg:phi}),z=[Math.cos(phi*Math.PI/180),Math.sin(phi*Math.PI/180)];
  near(a.ground,quad(u));near(a.excited,quad(w));near(a.trialEnergy,quad(z));
  near(a.variationalGap,(a.excited-a.ground)*(z[0]*w[0]+z[1]*w[1])**2);
  if(d||v){near(a.groundP1,u[0]**2);near(a.groundP2,u[1]**2);}
  if(d){near(a.approxError,Math.abs(a.approxGround-a.ground));checks++;assert(a.approxError<=a.errorBound+1e-14);}
 }
}
for(const d of [-1,1])for(const v of [1e-10,1e-20,1e-40]){
 const a=p.compute({delta:d,v,phiDeg:0}),small=d>0?a.groundP1:a.groundP2;
 near(small/(v*v),1,1e-12);near(a.approxError/v**4,1,1e-12);checks++;assert(!a.trueCrossing);
}
for(const d of [0,1e-12])for(const v of [0,1e-12]){const a=p.compute({delta:d,v,phiDeg:17});checks++;assert.equal(a.trueCrossing,d===0&&v===0);checks++;assert.equal(a.degenerate,d===0);}
// Gaussian trial energy from independent radial integrals, including kinetic gradient norm.
for(const a of [.05,.2,8/(9*Math.PI),1]){
 const norm=(2*a/Math.PI)**1.5,f=r=>4*Math.PI*r*r*norm*Math.exp(-2*a*r*r);
 const T=simpson(r=>.5*4*a*a*r*r*f(r),0,12/Math.sqrt(a));
 const V=simpson(r=>r===0?0:-f(r)/r,0,12/Math.sqrt(a));
 near(T+V,1.5*a-2*Math.sqrt(2*a/Math.PI),1e-10);
}
console.log(`hydrogen/perturbation independent checks: ${checks} PASS`);
