"use strict";
// Independent references: tensor amplitudes, quadrature, and eigenvector differences.
const assert = require('assert');
const ex = require('../course-shared/labs/physics-exchange-statistics.js');
const semi = require('../course-shared/labs/physics-semiclassical-tools.js');
let checks = 0;
function ok(value, message) { checks++; assert(value, message); }
function close(a,b,tol=1e-10) { ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b)), `${a} != ${b}`); }
function simpson(f,a,b,n=2000) { let sum=f(a)+f(b); const h=(b-a)/n; for(let i=1;i<n;i++) sum+=(i%2?4:2)*f(a+i*h); return sum*h/3; }
// Two orthogonal incoming modes, with internal vectors (1,0), (s,sqrt(1-s²)).
// Propagate each one-particle state, symmetrize, then sum squared tensor entries.
function tensorCounts(T,s,eta) {
  const R=1-T, c=Math.sqrt(T), d=Math.sqrt(R), t=Math.sqrt(1-s*s);
  const u=[c,0,d,0],v=[d*s,d*t,-c*s,-c*t]; let same=0,coin=0,norm=0;
  for(let i=0;i<4;i++)for(let j=0;j<4;j++) {
    const z=(u[i]*v[j]+eta*v[i]*u[j])/Math.SQRT2;
    norm+=z*z; if((i<2)===(j<2))same+=z*z;else coin+=z*z;
  }
  return {same,coin,norm};
}
for(const eta of [-1,1])for(let i=0;i<=200;i++) {
  const s=i/200, ref=tensorCounts(.5,s,eta), actual=ex.exchangeModel({statistics:eta===1?'boson':'fermion',overlap:s});
  close(ref.norm,1); close(actual.sameOutput,ref.same); close(actual.coincidence,ref.coin);
  for(const T of [0,.2,.8,1]) {
    const r=tensorCounts(T,s,eta); close(r.norm,1); close(r.coin,T*T+(1-T)**2-2*eta*T*(1-T)*s*s);
  }
}
close(tensorCounts(.8,.6,1).coin,.5648); close(tensorCounts(.8,.6,-1).coin,.7952);
// The spin singlet has antisymmetric spin and symmetric spatial input.
// Apply U tensor U directly to the symmetric spatial vector.
const U=[[1/Math.SQRT2,1/Math.SQRT2],[1/Math.SQRT2,-1/Math.SQRT2]];
let same=0,coin=0;
for(let c=0;c<2;c++)for(let d=0;d<2;d++) {
  const amplitude=(U[c][0]*U[d][1]+U[c][1]*U[d][0])/Math.SQRT2;
  if(c===d)same+=amplitude**2;else coin+=amplitude**2;
}
close(same,1);close(coin,0);
for(let n=0;n<=12;n++) {
  const r=semi.wkbOscillator(n),a=r.turningPoint;
  const action=4*simpson(t=>a*a*Math.cos(t)**2,0,Math.PI/2);
  close(action,r.action);close(action/(2*Math.PI),r.n+.5);
  const b=semi.wkbPlotBounds(n);ok(b.xMax>a&&b.yMax>r.energy,'visible turning points');
}
for(let k=1;k<=64;k++) {
  const a=k/8, r=semi.variationalGaussian(a),limit=9/Math.sqrt(a);
  const rho=x=>Math.sqrt(a/Math.PI)*Math.exp(-a*x*x);
  const norm=simpson(rho,-limit,limit);
  const kinetic=simpson(x=>a*a*x*x*rho(x)/2,-limit,limit);
  const potential=simpson(x=>x*x*rho(x)/2,-limit,limit);
  close(norm,1);close(r.kinetic,kinetic);close(r.potential,potential);close(r.energy,kinetic+potential);ok(r.excess>=0,'upper bound');
  const fourth=simpson(x=>x**4*rho(x),-limit,limit);close(fourth,3/(4*a*a));
}
for(const m of [.2,1,5])for(const lambda of [.1,1,10])for(const hbar of [.3,1,3]) {
  const a=Math.cbrt(6*m*lambda/(hbar*hbar)),lim=9/Math.sqrt(a);
  const rho=x=>Math.sqrt(a/Math.PI)*Math.exp(-a*x*x);
  const T=simpson(x=>hbar*hbar*a*a*x*x*rho(x)/(2*m),-lim,lim);
  const V=simpson(x=>lambda*x**4*rho(x),-lim,lim);
  close(T,2*V);close(T+V,3*hbar*hbar*a/(8*m));
}
function lower(s,g) { const theta=Math.atan2(g,s);return [-Math.sin(theta/2),Math.cos(theta/2)]; }
for(let i=-40;i<=40;i++)for(const g of [.05,.1,.2,.5])for(const rate of [.001,.005,.05]) {
  const s=i/40,r=semi.adiabaticMetric(s,g,rate),v=lower(s,g),h=1e-6;
  const H=[[s,g],[g,-s]];
  for(let j=0;j<2;j++)close(H[j][0]*v[0]+H[j][1]*v[1],-r.gap*v[j]/2);
  close(r.firstBasisProbability,v[0]*v[0]);
  const lo=lower(s-h,g),hi=lower(s+h,g),upper=[v[1],-v[0]];
  const coupling=Math.abs(upper[0]*(hi[0]-lo[0])/(2*h)+upper[1]*(hi[1]-lo[1])/(2*h));
  close(r.epsilon,coupling*rate/r.gap,2e-8);
}
ok(semi.adiabaticMetric(0,0,.01).epsilon===null,'degenerate diagnostic undefined');
ok(semi.adiabaticMetric(0,0,.01).firstBasisProbability===null,'no unique ground state');
close(semi.adiabaticMetric(1,0,.01).epsilon,0);
close(semi.adiabaticMetric(0,.05,.05).epsilon,5);
const svg=ex.dashboardSvg(ex.exchangeModel({statistics:'boson',overlap:1}),'test');
ok((svg.match(/class="ex-arrow"/g)||[]).length===2,'exactly two output ports');
console.log(`exchange / semiclassical independent checks: PASS (${checks})`);
