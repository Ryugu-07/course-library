'use strict';
const assert=require('assert'),a=require('../course-shared/labs/physics-uncertainty-fit'),ref=require('./fixtures/uncertainty-gls-scipy.json');let checks=0;
function near(x,y,t=1e-10){checks++;assert(Number.isFinite(x)&&Math.abs(x-y)<=t*Math.max(1,Math.abs(y)),`${x} vs ${y}`)}
for(const row of ref.fits){const f=a.fitModel(row.model,row.sigma,row.rho);f.coefficients.forEach((x,i)=>near(x,row.coefficients[i],1e-11));f.parameterCovariance.forEach((r,i)=>r.forEach((x,j)=>near(x,row.parameterCovariance[i][j],1e-12)));near(f.chiSquare,row.chiSquare);near(f.residuals.reduce((s,x)=>s+x,0),0);near(f.standardized.reduce((s,x)=>s+x*x,0),f.chiSquare);f.standardErrors.forEach((x,i)=>near(x*x,row.parameterCovariance[i][i]));}
// Central differences of the physical forward model independently establish sensitivities.
const g=(L,T)=>4*Math.PI**2*L/T**2;
for(const L of [.1,.7,1,3])for(const T of [.1,.8,2.006,5,10])for(const rho of [-1,-.95,-.6,0,.6,.95,1])for(const sig of [.0001,.01,.1]){
 const f=a.propagate({L,T,sigmaL:sig,sigmaT:sig,rho}),hL=L*1e-3,hT=T*1e-3,dL=(-g(L+2*hL,T)+8*g(L+hL,T)-8*g(L-hL,T)+g(L-2*hL,T))/(12*hL),dT=(-g(L,T+2*hT)+8*g(L,T+hT)-8*g(L,T-hT)+g(L,T-2*hT))/(12*hT);
 near(f.dL,dL,4e-10);near(f.dT,dT,4e-10);
 // Four equally weighted, zero-mean correlated perturbations have the requested covariance.
 const vectors=[[Math.SQRT2*sig,Math.SQRT2*rho*sig],[-Math.SQRT2*sig,-Math.SQRT2*rho*sig],[0,Math.SQRT2*sig*Math.sqrt(1-rho*rho)],[0,-Math.SQRT2*sig*Math.sqrt(1-rho*rho)]];
 const variance=vectors.reduce((sum,v)=>sum+(dL*v[0]+dT*v[1])**2/4,0);near(f.variance,variance,8e-10);near(f.g,g(L,T));assert(f.variance>=0);checks++;
}
near(a.propagate({L:1,T:2,sigmaL:.01,sigmaT:.01,rho:1}).variance,0,1e-25);
for(const row of ref.pendulum){near(row.periodRatio,1+row.theta**2/16,6e-6);near(row.naiveGravityRatio,1-row.theta**2/8,8e-6);near(row.periodRatio,1+row.theta**2/16+11*row.theta**4/3072,2e-8);}
for(const fn of [()=>a.propagate({rho:1.01}),()=>a.propagate({L:0}),()=>a.propagate({T:NaN}),()=>a.propagate({sigmaT:Infinity}),()=>a.propagate({L:'1'}),()=>a.fitModel('bad',.12),()=>a.fitModel('linear',0),()=>a.fitModel('linear',.12,1),()=>a.fitModel('linear',.12,-.1),()=>a.fitModel('linear',.12,NaN)]){assert.throws(fn,RangeError);checks++;}
console.log(`Uncertainty and GLS independent checks: PASS (${checks})`);
