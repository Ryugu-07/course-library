'use strict';
const assert=require('assert'),rigid=require('../course-shared/labs/normal-modes-rigid-body'),scatter=require('../course-shared/labs/physics-scattering-orbit');let checks=0;
const near=(a,b,t=2e-9)=>{assert(Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);checks++;};
// Reconstruct inertia directly from four nonnegative point masses, independently
// of the lesson's matrix/eigenvalue constants. This rejects the old (1,3,5) data.
const u=[1/Math.sqrt(2),1/Math.sqrt(2),0],v=[1/Math.sqrt(2),-1/Math.sqrt(2),0];
const positions=[u.map(x=>Math.sqrt(3)*x),u.map(x=>-Math.sqrt(3)*x),v,v.map(x=>-x)];
const I=Array.from({length:3},()=>[0,0,0]);
for(const r of positions){const rr=r.reduce((a,x)=>a+x*x,0);for(let i=0;i<3;i++)for(let j=0;j<3;j++)I[i][j]+=.5*((i===j?rr:0)-r[i]*r[j]);}
I.forEach((r,i)=>r.forEach((x,j)=>near(x,rigid.INERTIA[i][j])));
const moments=rigid.evaluate({}).principalAxes.map(x=>x.moment);
for(let i=0;i<3;i++){const others=moments.reduce((s,x,j)=>s+(i===j?0:x),0);assert(moments[i]<=others+1e-12);checks++;}
// Jacobian of the actual torque-free Euler vector field at each spin axis.
function rhs(w){return[(moments[1]-moments[2])*w[1]*w[2]/moments[0],(moments[2]-moments[0])*w[2]*w[0]/moments[1],(moments[0]-moments[1])*w[0]*w[1]/moments[2]];}
for(const spin of [.25,1,2.5])for(let axis=0;axis<3;axis++){
 const w=[0,0,0];w[axis]=spin;const other=[0,1,2].filter(i=>i!==axis),J=other.map(i=>other.map(j=>{const plus=w.slice(),minus=w.slice();plus[j]+=1e-5;minus[j]-=1e-5;return(rhs(plus)[i]-rhs(minus)[i])/2e-5;}));
 near(J[0][0],0);near(J[1][1],0);near(J[0][1]*J[1][0],rigid.stabilityLedger(spin)[axis].sigmaSquared);
}
for(const energy of [.5,2,20])for(const impact of [0,.1,.2,1,3,10])for(const kappa of [.2,2,8]){
 const d=scatter.scattering({energy,impact,kappa}),g=scatter.scatteringGeometry(d);
 near(g.rawPoints[g.turnIndex].x,d.rMin);near(g.rawPoints[g.turnIndex].y,0);
 for(const point of g.screenPoints){assert(point.x>=44.999&&point.x<=245.001&&point.y>=57.999&&point.y<=194.001);checks++;}
 for(const point of g.rawPoints){const r=Math.hypot(point.x,point.y);assert(Number.isFinite(r)&&r>=d.rMin-1e-8);checks++;
  if(impact>0){near(d.eccentricity*point.x-r,impact*impact/d.a);assert(energy*impact*impact/(r*r)+kappa/r<=energy+1e-8);checks++;}}
 if(impact>0){assert(g.rawPoints[0].y<0&&g.rawPoints.at(-1).y>0);checks++;}
}
console.log(`PASS ${checks} physical checks: point-mass inertia, Euler Jacobians and near-head-on Coulomb conics`);
