'use strict';
const fs=require('fs'),assert=require('assert'),path=require('path'),lab=require('../course-shared/labs/linear-ode-resonance.js'),ref=require('./fixtures/linear-ode-reference.json');let checks=0;
function close(a,b,tol,msg){checks++;assert(Number.isFinite(a)&&Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${msg}: ${a} vs ${b}`)}
for(const c of ref.forced)for(const [t,y] of c.points)close(lab.undampedResponse(c.omega0,c.omega,c.force,t),y,8e-10,'DOP853 forced');
for(const c of ref.free)for(const [t,y] of c.points)close(lab.freeResponse(c.zeta,c.omega0,t),y,2e-11,'DOP853 free');
for(const c of ref.highPrecision)close(lab.undampedResponse(c.omega0,c.omega,c.force,c.t),c.y,2e-11,'80 digit response');
for(const z of [0,.3,1-Number.EPSILON,1,1+Number.EPSILON,1.4,5])for(const w of [.01,1,10]){
 const r=lab.rootClassification(z,w);checks++;assert.equal(r.type,z<1?'underdamped':z===1?'critical':'overdamped');
 for(const q of r.roots){close(q.re*q.re-q.im*q.im+2*z*w*q.re+w*w,0,2e-12,'characteristic real');close(2*q.re*q.im+2*z*w*q.im,0,2e-12,'characteristic imag');}
 close(lab.freeResponse(z,w,0),1,0,'free IC');
 for(const t of [0,1e-12,1,100,1000])assert(Number.isFinite(lab.freeResponse(z,w,t))),checks++;
}
for(const r of [.5,.919999,.92,1-Number.EPSILON,1,1+Number.EPSILON,1.08,1.080001,1.5]){checks++;assert.equal(lab.classifyForcing(r),r===1?'exact':r>=.92&&r<=1.08?'near':'off');}
for(const fn of [()=>lab.trace(1,.98,1,40,0),()=>lab.trace(1,.98,1,40,2.5),()=>lab.trace(1,.98,1,0,500),()=>lab.trace(1,.98,1,40,20001),()=>lab.undampedResponse(0,1,1,1),()=>lab.undampedResponse(1,1,'1',1),()=>lab.undampedResponse(1,1,1,-1),()=>lab.freeResponse(-1,1,1),()=>lab.rootClassification(NaN,1),()=>lab.classifyForcing('1'),()=>lab.classifyForcing(2)]){assert.throws(fn);checks++;}
function coords(svg,id){const m=svg.match(new RegExp('<path id="'+id+'" d="([^"]+)"'));assert(m,id);const vals=m[1].match(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?/gi).map(Number);return Array.from({length:vals.length/2},(_,i)=>[vals[2*i],vals[2*i+1]]);}
for(const ratio of [.5,.7,.92,.98,1,1+1e-12,1.08,1.5])for(const horizon of [10,40,80])for(const zeta of [.3,1,1.4]){
 const points=lab.trace(1,ratio,1,horizon,500),svg=lab.renderSvg(points,horizon,zeta),extent=Math.max(.5,...points.map(p=>p.envelope));
 const ys=coords(svg,'lor-forced'),upper=coords(svg,'lor-envelope-upper'),lower=coords(svg,'lor-envelope-lower'),qs=coords(svg,'lor-free');
 for(let i=0;i<points.length;i++){const p=points[i],a=ys[i],up=upper[i],lo=lower[i],q=qs[i],t=horizon*i/500;
  close(a[0],65+570*t/horizon,1e-7,'actual time');close(a[1],155-90*p.y/extent,1e-7,'actual forced');close(up[1],155-90*p.envelope/extent,1e-7,'actual upper');close(lo[1],155+90*p.envelope/extent,1e-7,'actual lower');close(q[1],438-90*lab.freeResponse(zeta,1,t),1e-7,'actual free');assert(Math.abs(p.y)<=p.envelope+1e-12);checks++;
 }
}
const staticSvg=fs.readFileSync(path.join(__dirname,'../math-course/images/ode-02-damping.svg'),'utf8');
for(const [i,z] of [.3,1,1.4].entries()){
 const c=ref.free.find(c=>c.zeta===z&&c.omega0===1),p=coords(staticSvg,'damping-'+i),f=coords(staticSvg,'frequency-'+i);assert.equal(p.length,601);assert.equal(f.length,601);
 for(let j=0;j<=600;j++){close(p[j][0],70+350*j/600,1e-9,'static time');close(p[j][1],350-220*(c.points[j][1]+.5)/1.6,2e-10,'static independent DOP853 q');const r=2*j/600,complexMagnitude=Math.hypot(1-r*r,2*z*r);close(f[j][0],560+340*j/600,1e-9,'frequency axis');close(f[j][1],350-110/complexMagnitude,1e-9,'complex impedance amplitude');}
}
console.log(`linear-ode independent: PASS (${checks} checks)`);
