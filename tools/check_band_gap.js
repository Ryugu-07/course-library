"use strict";
const assert=require('assert'),fs=require('fs'),path=require('path'),{computeA,computeB,periodicSegments,formatNumber}=require('../course-shared/labs/band-gap-explorer.js');let count=0;
function near(a,b,tol=1e-10){assert(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);count++;}
for(const V of [-.8,-.4,-1e-10,0,1e-10,.25,.8])for(const q of [-1.25,-.8,-1e-10,0,1e-10,.6,1.25]){
 const d=computeA(V,q),a=(q+1)**2,b=(q-1)**2;
 for(const e of [d.lower,d.upper])near((a-e)*(b-e)-V*V,0);
 near(d.lower+d.upper,a+b);near(d.lower*d.upper,a*b-V*V);
 const rev=computeA(-V,q);near(rev.lower,d.lower);near(rev.upper,d.upper);
 if(V===0&&q===0){assert.equal(d.lowerPlusWeight,null);assert.equal(d.upperPlusWeight,null);count+=2;continue;}
 const theta=.5*Math.atan2(2*V,4*q),u=[Math.cos(theta),Math.sin(theta)],l=[-Math.sin(theta),Math.cos(theta)];
 for(const [e,v]of[[d.lower,l],[d.upper,u]]){near(a*v[0]+V*v[1],e*v[0]);near(V*v[0]+b*v[1],e*v[1]);}
 near(d.lowerPlusWeight,l[0]**2);near(d.upperPlusWeight,u[0]**2);
}
// Independent midpoint integration of the shifted occupied interval and finite differences of E.
for(const t of [.25,.8,1.5])for(const f of [0,1e-10,.25,.5,.75,1-1e-10,1])for(const delta of [-.35,0,.12,.35]){
 const d=computeB(t,f,0,delta),n=4000,h=2*Math.PI*f/n;let integral=0;
 for(let i=0;i<n;i++)integral+=2*t*Math.sin(delta-Math.PI*f+(i+.5)*h)*h;
 near(d.toyVelocityIntegral,integral,3e-7);
 const segments=periodicSegments(delta,Math.PI*f);near(segments.reduce((s,[a,b])=>s+b-a,0),2*Math.PI*f);
 let segint=0;for(const[a,b]of segments){assert(a>=-Math.PI-1e-14&&b<=Math.PI+1e-14&&b>=a);count++;segint+=2*t*(Math.cos(a)-Math.cos(b));}near(segint,d.toyVelocityIntegral);
 for(const x of [-Math.PI,-Math.PI/2,-.3,0,.3,Math.PI/2,Math.PI]){const v=computeB(t,f,x,delta),dx=1e-4,E=z=>-2*t*Math.cos(z);near(v.velocity,(E(x+dx)-E(x-dx))/(2*dx),1e-8);near(v.curvature,(E(x+dx)-2*E(x)+E(x-dx))/dx**2,2e-7);if(v.mass!==null)near(v.mass*v.curvature,1);}
}
assert(formatNumber(null,1e-8,3).includes('e'));assert.equal(formatNumber(null,100,0),'100');count+=2;
const svg=fs.readFileSync(path.join(__dirname,'../physics-course/images/solid-02-bands.svg'),'utf8'),curves=[...svg.matchAll(/<polyline class="(lower|upper)" points="([^"]+)"/g)];assert.equal(curves.length,2);count++;
for(const m of curves)for(const pair of m[2].split(' ')){const[x,y]=pair.split(',').map(Number),k=(x-80)/620*2*Math.PI-Math.PI,e=(232-y)/80;near(e*e,1+.6*.6+2*.6*Math.cos(k),3e-6);assert(m[1]==='lower'?e<0:e>0);count++;}
console.log(`Band-gap independent checks: ${count} PASS`);
