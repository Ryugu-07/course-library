'use strict';
const assert=require('node:assert/strict'),a=require('../course-shared/labs/asymptotic-tests'),reference=require('./asymptotic-normal-reference.json');let checks=0;
function ok(v,m){checks++;assert(v,m)}function near(x,y,atol=2e-13,rtol=2e-12){ok(Number.isFinite(x)&&Math.abs(x-y)<=atol+rtol*Math.abs(y),`${x} != ${y}`)}
for(const r of reference.rows)near(a.normalSF(r.z),r.sf,0,3e-13);
for(const z of [0,1,2,8,10,20,30])near(a.twoSidedNormalP(z),2*reference.rows.find(r=>r.z===z).sf,0,3e-13);
// Exact rational probability ordering: integer PMF numerators share b^n.
const scale=10n**300n;function ratio(x,y){return Number(x*scale/y)/1e300}
for(const n of [4,10,40,100,200])for(const [u,v] of [[1,2],[1,4],[1,100],[35,100],[99,100]]){
 const num=[];let c=1n;for(let k=0;k<=n;k++){if(k)c=c*BigInt(n-k+1)/BigInt(k);num.push(c*BigInt(u)**BigInt(k)*BigInt(v-u)**BigInt(n-k))}const den=BigInt(v)**BigInt(n);
 const pv=num.map(observed=>num.reduce((s,m)=>s+(m<=observed?m:0n),0n));
 for(let k=0;k<=n;k++){const expected=ratio(pv[k],den);if(expected>1e-290)near(a.exactPValue(n,k,u/v),expected,0,3e-11);}
 let nullMass=0n;for(let k=0;k<=n;k++)if(pv[k]*20n<=den)nullMass+=num[k];const data=a.analyze({n,p0:u/v,k:Math.floor(n*u/v),h:0,alpha:.05});near(data.exactSize,ratio(nullMass,den));near(data.finiteLocalPower,data.exactSize);ok(data.exactSize<=.05+1e-13,'valid exact size');
}
near(a.exactPValue(4,2,.25),67/256);near(a.analyze({n:4,p0:.25,k:2,h:0}).exactSize,1/256);
ok(a.exactPValue(100,100,.5)<2e-30,'no artificial PMF floor');
for(const p0 of [0,1])for(const k of [0,1,40])near(a.exactPValue(40,k,p0),k===40*p0?1:0);
const invalid=a.analyze({n:10,p0:.9,h:1});ok(invalid.localAlternative===null&&invalid.finiteLocalPower===null,'out-of-domain is not clipped');ok(invalid.localPower!==null,'fixed-interior asymptotic formula retains its meaning');
near(a.localAlternative(.9,100,1),1);near(a.localAlternative(.3,100,-1),.2);
for(const h of [0,.5,1,2]){const power=a.asymptoticLocalPower(.5,h,.05);ok(power>=.05-2e-12&&power<=1,'local power range');near(power,a.asymptoticLocalPower(.5,-h,.05));}
console.log(`asymptotic tests independent checks: PASS (${checks})`);
