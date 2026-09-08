"use strict";
const assert=require('node:assert/strict'),sr=require('../course-shared/labs/relativity'),fo=require('../course-shared/labs/fourier-optics');
let checks=0;function ok(x,msg){checks++;assert(x,msg)}function near(a,b,t=2e-11){ok(Number.isFinite(a)&&Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`)}
// Independent light-cone coordinates transform by exponential rapidity.
for(const beta of [-.95,-.8,-.6,0,.4,.8,.95])for(let xi=-38;xi<=38;xi+=2)for(let ti=-25;ti<=38;ti+=3){
 const x=xi/10,t=ti/10,z=sr.transform(x,t,beta),eta=Math.atanh(beta),plus=(t+x)*Math.exp(-eta),minus=(t-x)*Math.exp(eta);
 near(z.x,(plus-minus)/2);near(z.t,(plus+minus)/2);near(z.t*z.t-z.x*z.x,t*t-x*x);
 const back=sr.transform(z.x,z.t,-beta);near(back.x,x);near(back.t,t);
 const pt=sr.mapPoint(x,t);ok(pt.x>=0&&pt.x<=sr.PLOT.width&&pt.y>=0&&pt.y<=sr.PLOT.height,'event fits equal-scale plot');
}
for(const [x,t,type] of [[.05,0,'spacelike'],[0,.05,'timelike'],[1e-200,0,'spacelike'],[0,1e-200,'timelike'],[2,2,'lightlike'],[0,0,'coincident'],[1,1+Number.EPSILON,'timelike']])ok(sr.classify(x,t)===type,'causal boundary');
for(const b of [-1,1,NaN,Infinity])ok(Number.isNaN(sr.transform(1,2,b).x),'invalid boost');
for(const b of [-.95,0,.95])for(const [dx,dt] of [[1,0],[0,1],[1,b],[b,1],[-1,1],[1,1]])for(const p of Object.values(sr.axisSegment(dx,dt)))ok(p.x>=0&&p.x<=sr.PLOT.width&&p.y>=0&&p.y<=sr.PLOT.height,'axis contained');
// Numerically integrate each transmitting slit, rather than using its sinc formula.
for(const pattern of ['single','double','grating'])for(const n of [3,5,8])for(const w of [.12,.42,.72])for(const d of [.85,1.4,2.4])for(const u of [-8.73,-2,-.37,0,.41,2,8.91]){
 const centers=pattern==='single'?[0]:pattern==='double'?[-d/2,d/2]:Array.from({length:n},(_,i)=>(i-(n-1)/2)*d);
 let re=0,im=0;const steps=2048,h=w/steps;
 for(const c of centers)for(let j=0;j<=steps;j++){const x=c-w/2+j*h,weight=j===0||j===steps?1:j%2?4:2;re+=weight*Math.cos(2*Math.PI*u*x)*h/3;im-=weight*Math.sin(2*Math.PI*u*x)*h/3;}
 re/=centers.length*w;im/=centers.length*w;
 near(fo.normalizedIntensity(pattern,u,w,d,n),re*re+im*im,2e-10);
 const amp=fo.normalizedAmplitude(pattern,u,w,d,n);near(amp.re,re,2e-10);near(amp.im,im,2e-10);
}
// Cancellation near grating peaks compared with direct finite phasors.
for(const n of [3,4,5,8])for(let m=-20;m<=20;m++)for(const delta of [-1e-7,-1e-10,0,1e-10,1e-7]){
 const phase=m*Math.PI+delta,u=phase/(Math.PI*1.4);let sum=0;for(let j=0;j<n;j++)sum+=Math.cos(2*phase*(j-(n-1)/2));near(fo.arrayFactor(u,1.4,n),sum,2e-12);
}
for(const n of [3,5,8])for(const d of [.85,1.4,2.4]){
 const a=fo.intensitySamples({pattern:'grating',width:.12,spacing:d,slitCount:n},9);
 ok(a.includes(0),'sample includes central peak');for(let i=1;i<a.length;i++)ok(a[i]-a[i-1]<=1/(24*n*d)+1e-12,'resolve narrowest array lobe');
 for(let m=-Math.floor(9*d);m<=Math.floor(9*d);m++)ok(a.includes(m/d),'sample exact array maxima');
}
near(fo.normalizedIntensity('grating',2,.5,1.5,8),0);near(7*7-48,1);near(2+2*7,16);near((1.5-1.69)**2/(1.5+1.69)**2,(.19/3.19)**2);
console.log(`relativity/optics independent checks: PASS (${checks})`);
