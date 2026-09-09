"use strict";

const assert = require("assert");
const magnetic = require("../course-shared/labs/physics-magnetic-order");

let checks = 0;

function check(condition, message) {
  checks += 1;
  assert(condition, message);
}

function near(actual, expected, tolerance, message) {
  checks += 1;
  assert(
    Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(actual), Math.abs(expected)),
    `${message}: ${actual} != ${expected}`
  );
}

let constructedCases = 0;
for (const K of [0.4, 0.6, 0.8, 1, 1.2, 1.4, 1.6, 1.8]) {
  for (let index = 1; index <= 80; index += 1) {
    const criticalM = (index % 2 ? 1 : -1) * index / 100;
    const criticalT = K * (1 - criticalM * criticalM);
    const criticalH = criticalT * Math.atanh(criticalM) + K * criticalM;
    if (criticalT < 0.2 || Math.abs(criticalH) > 0.6) continue;
    constructedCases += 1;

    const atCritical = magnetic.solveMeanField({
      model: "antiferro",
      coupling: K,
      temperature: criticalT,
      field: criticalH
    });
    near(atCritical.staggered, 0, 2e-12, "critical solution stays on the uniform branch");
    check(atCritical.candidates.length === 1, "critical root is not duplicated by roundoff");
    near(
      magnetic.susceptibility(atCritical.config),
      1 / (2 * K),
      2e-12,
      "critical uniform susceptibility uses the reduced branch"
    );

    const above = magnetic.solveMeanField({
      model: "antiferro",
      coupling: K,
      temperature: criticalT * (1 + 1e-12),
      field: criticalH
    });
    near(above.staggered, 0, 2e-12, "stable side has no spurious staggered order");

    const below = magnetic.solveMeanField({
      model: "antiferro",
      coupling: K,
      temperature: criticalT * (1 - 1e-12),
      field: criticalH
    });
    check(Math.abs(below.staggered) > 1e-8, "ordered side retains the small physical branch");
    check(Math.max(Math.abs(below.residualA), Math.abs(below.residualB)) < 2e-9, "ordered critical branch is self-consistent");
    const swapped = below.candidates.some((candidate) =>
      Math.abs(candidate.mA - below.mB) < 2e-8 && Math.abs(candidate.mB - below.mA) < 2e-8
    );
    check(swapped, "finite uniform field preserves the AF sublattice-exchange partner");
  }
}

check(constructedCases === 276, "constructed critical grid covers 276 finite-field cases");

const decimalRegression = magnetic.solveMeanField({
  model: "antiferro",
  coupling: 1,
  temperature: 0.95999999999904,
  field: 0.39462325189191894
});
near(decimalRegression.magnetization, 0.19999999999982099, 2e-10, "decimal regression M");
near(Math.abs(decimalRegression.staggered), 0.000001628710228035701, 2e-10, "decimal regression q");

const lowerScaleRegression = magnetic.solveMeanField({
  model: "antiferro",
  coupling: 0.4,
  temperature: 0.384 * (1 - 1e-11),
  field: 0.15784930075676756
});
check(Math.abs(lowerScaleRegression.staggered) > 1e-6, "scaled stability tolerance works at K=0.4");

// Root review: offsets 1e-12 through 1e-5, extra couplings and Landau scale.
for(const K of [.4,.55,.7,1,1.25,1.4,1.8])for(let i=1;i<=70;i+=3)for(const sign of [-1,1]){let m0=sign*i/100,Tc=K*(1-m0*m0),hc=Tc*Math.atanh(m0)+K*m0;if(Tc<.201||Math.abs(hc)>.599)continue;
for(const delta of [-1e-5,-1e-7,-1e-9,-1e-11,-1e-12,0,1e-12,1e-9,1e-5]){let T=Tc*(1+delta),c={model:'antiferro',coupling:K,temperature:T,field:hc},r=magnetic.solveMeanField(c);check(Math.max(Math.abs(r.residualA),Math.abs(r.residualB))<1e-9,'stationary');if(delta>=0){check(Math.abs(r.staggered)<2e-8,'uniform side '+JSON.stringify({K,m0,T,hc,delta,q:r.staggered,chi:magnetic.susceptibility(c)}));if(delta===0)check(Math.abs(magnetic.susceptibility(c)-1/(2*K))<1e-10,'critical reduced response');}else{check(r.staggered>0,'ordered branch');let M=m0;for(let j=0;j<10;j++)M-=(K*M+T*Math.atanh(M)-hc)/(K+T/(1-M*M));let d=1-M*M,lambda=T/d-K,quadratic=T*((1+3*M*M)/(3*d*d*d)-2*T*M*M/(d*d*d*d*(K+T/d))),q2=-lambda/quadratic;check(Math.abs(r.staggered*r.staggered/q2-1)<.02,'Landau leading scale');if(delta===-1e-5){let expected=(1+3*m0*m0)/(2*K),chi=magnetic.susceptibility(c);check(Math.abs(chi/expected-1)<.001,'ordered one-sided critical response');}}}}

console.log(`Magnetic critical checks: ${checks} PASS (${constructedCases} critical triples)`);
