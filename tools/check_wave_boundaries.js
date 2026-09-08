'use strict';
const assert=require('assert'),E=require('../course-shared/labs/physics-elastic-wave'),W=require('../course-shared/labs/physics-waveguide-dispersion'),P=require('../course-shared/labs/poynting-radiation');
let checks=0;const near=(a,b,t=2e-9)=>{assert(Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);checks++;};
// Derivatives of incident/reflected/transmitted displacement give traction;
// this checks the physical boundary law, not only r+t identities.
for(const material1 of Object.keys(E.MATERIALS))for(const material2 of Object.keys(E.MATERIALS))for(const mode of ['shear','longitudinal'])for(const frequency of [.05,1,20]){
 const d=E.waveModel({material1,material2,mode,frequency}),g=E.waveGeometry(d),h=1e-5/Math.max(d.k1,d.k2),phase=.73,t=phase/d.omega;
 const first=E.MATERIALS[material1],second=E.MATERIALS[material2],mod=m=>(mode==='shear'?m.shear:m.bulk+4*m.shear/3)*1e9;
 const u1=x=>Math.cos(d.k1*x-phase)+d.reflection*Math.cos(d.k1*x+phase),u2=x=>d.transmission*Math.cos(d.k2*x-phase);
 near(u1(0),u2(0));const T1=mod(first)*(u1(h)-u1(-h))/(2*h),T2=mod(second)*(u2(h)-u2(-h))/(2*h);near(T1,T2,1e-8);
 near(d.transmittance,d.z2/d.z1*d.transmission*d.transmission);near(d.reflectance+d.transmittance,1);
 assert(g.cycles1<=8+1e-12&&g.cycles2<=8+1e-12);checks++;
 near(g.physicalLength/d.wavelength1,g.cycles1);near(g.physicalLength/d.wavelength2,g.cycles2);
 for(const [path,amplitude,k,dir,x0,x1] of [[g.incident,25,d.k1,1,-g.physicalLength,0],[g.reflected,25*d.reflection,d.k1,-1,-g.physicalLength,0],[g.transmitted,25*d.transmission,d.k2,1,0,g.physicalLength]]){
  const points=[...path.matchAll(/[ML] ([\d.-]+) ([\d.-]+)/g)].map(m=>[+m[1],+m[2]]);assert(points.length===241);checks++;
  for(let j=0;j<points.length;j++){const x=x0+(x1-x0)*j/240;assert(Math.abs(points[j][1]-(g.baseline-amplitude*Math.cos(k*x)))<=.00500001);checks++; /* SVG serializes to two decimal pixels */}
 }
}
// Neumann cosine zeros determine cell boundaries, including unequal TE20 lobes.
for(const mode of Object.keys(W.MODES)){
 const d=W.waveguideModel({mode}),g=W.waveguideGeometry(d),t=g.topology;
 for(const [bounds,n] of [[t.xBounds,d.mode.m],[t.yBounds,d.mode.n]])for(const b of bounds.slice(1,-1))near(Math.cos(n*Math.PI*b),0);
 for(let r=0;r<t.yRegions;r++)for(let c=0;c<t.xRegions;c++)for(const f of [.1,.5,.9]){
  const x=t.xBounds[c]+f*(t.xBounds[c+1]-t.xBounds[c]),y=t.yBounds[r]+f*(t.yBounds[r+1]-t.yBounds[r]);
  assert(Math.sign(Math.cos(d.mode.m*Math.PI*x)*Math.cos(d.mode.n*Math.PI*y))===t.signs[r][c]);checks++;
 }
}
assert.deepEqual(W.modeTopology('te20').xBounds,[0,.25,.75,1]);checks++;
// Recover displayed coordinates and verify dispersion at all UI scale extremes.
for(const mode of Object.keys(W.MODES))for(const a of [8,22.86,60])for(const b of [5,10.16,30])for(const epsilon of [1,2,6])for(const frequency of [1,5,12,40]){
 const d=W.waveguideModel({mode,a,b,epsilon,frequency}),g=W.waveguideGeometry(d),x=(g.currentX-g.chartLeft)/(g.chartRight-g.chartLeft)*g.maxRatio,y=(g.chartBottom-g.currentY)/(g.chartBottom-g.chartTop)*g.maxBeta;
 near(x,d.ratio);near(y*y,Math.abs(x*x-1));assert(g.currentX<=g.chartRight&&g.currentY>=g.chartTop);checks++;
 if(d.propagating){const k=Math.PI*Math.sqrt((d.mode.m/(a*.001))**2+(d.mode.n/(b*.001))**2);const omega=beta=>d.speed*Math.sqrt(beta*beta+k*k),h=d.beta*1e-5;near((omega(d.beta+h)-omega(d.beta-h))/(2*h),d.groupVelocity,1e-8);}
}
// Integrate full complex near fields over a sphere in u=cos(theta).
// Simpson's rule is exact for the quadratic angular power density.
for(const kr of [.2,.7,2,8,12])for(const omega of [.5,1,3])for(const p0 of [.4,1,2]){
 let sum=0;const N=80;for(let i=0;i<=N;i++){const u=-1+2*i/N,d=P.evaluateDipole({kr,omega,p0,theta:Math.acos(u)});sum+=(i===0||i===N?1:i%2?4:2)*d.radialS*d.r*d.r;near(d.radialS*d.r*d.r,d.differentialPower,1e-9);}
 const power=2*Math.PI*sum*(2/N)/3;near(power,p0*p0*omega**4/(12*Math.PI),1e-9);
}
console.log(`PASS ${checks} wave-boundary checks: tractions, anti-alias windows, nodal geometry, dispersion and full near-field power`);
