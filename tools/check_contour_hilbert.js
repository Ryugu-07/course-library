'use strict';
const assert=require('assert'),cw=require('../course-shared/labs/contour-winding.js'),rl=require('../course-shared/labs/residue-ledger.js'),lp=require('../course-shared/labs/lp-geometry.js'),hp=require('../course-shared/labs/hilbert-projection.js');let checks=0;
const ok=(x,m)=>{checks++;assert(x,m)},near=(a,b,t=1e-10)=>ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b)),a+' vs '+b);
// A true circular boundary can be missed by every sampled vertex.
for(const theta of [Math.PI/17,.321,1.23,2.99])for(const shape of [0,.12,.24])for(const orientation of [-1,1])for(const subdivisions of [16,32,64,128,256]){
 const r=1+shape*Math.cos(3*theta),d=cw.evaluate({shape,orientation,subdivisions,pole:[r*Math.cos(theta),r*Math.sin(theta)]});
 ok(d.current.winding===null,'analytic on-curve rejection');ok(!d.current.numerical.valid,'no false quadrature value');ok(d.current.exact===null,'no false exact value');
}
const theta=Math.PI/16,pole=[.99*Math.cos(theta),.99*Math.sin(theta)];
const coarse=cw.evaluate({shape:0,pole,subdivisions:16});ok(coarse.current.winding===1,'true circle inside');ok(coarse.current.sampledWinding===0,'polygon is a different diagnostic');
for(const shape of [0,.08,.16,.24])for(const orientation of [-1,1])for(const pole of [[0,0],[.35,.18],[1.35,.18]]){
 const a=cw.evaluate({shape,orientation,pole,subdivisions:32}),b=cw.evaluate({shape,orientation,pole,subdivisions:256});
 const expected=Math.hypot(...pole)<.76?orientation:0;
 ok(a.current.winding===expected&&b.current.winding===expected,'N-independent analytic winding');
 near(b.current.exact[1],2*Math.PI*expected);ok(b.current.numericalError<a.current.numericalError,'refined quadrature');
 ok(b.current.numericalError<.002,'quadrature accuracy in separated cases');
}
// Integrate an explicit rational function, including all higher-order pole terms.
const mul=(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]],add=(a,b)=>[a[0]+b[0],a[1]+b[1]];
for(const preset of rl.PRESETS)for(const radius of [.8,1.1,2])for(const direction of ['cw','ccw'])for(const turns of [1,2,3]){
 const c={...preset,radius,direction,turns},d=rl.analyze(c);if(!d.ordinaryTheoremApplicable)continue;
 let sum=[0,0];const n=4096,sign=direction==='cw'?-1:1;
 for(let i=0;i<n;i++){const t=2*Math.PI*i/n,z=[c.center.x+radius*Math.cos(t),c.center.y+radius*Math.sin(t)],dz=[-radius*Math.sin(t),radius*Math.cos(t)];let f=[0,0];
  for(const pole of c.poles){const re=z[0]-pole.x,im=z[1]-pole.y,den=re*re+im*im,inv=[re/den,-im/den],res=typeof pole.residue==='number'?[pole.residue,0]:[pole.residue.re,pole.residue.im];f=add(f,mul(res,inv));if(pole.order>1){let power=[1,0];for(let j=0;j<pole.order;j++)power=mul(power,inv);f=add(f,power);}}
  sum=add(sum,mul(f,dz));
 }
 near(d.integral.re,sum[0]*2*Math.PI/n*sign*turns,1e-9);near(d.integral.im,sum[1]*2*Math.PI/n*sign*turns,1e-9);
}
for(const f of [[1,2,4],[-1,2,-4],[1,0,0],[0,0,0],[1,1,1]])for(const g of [[2,1,3],[-2,-4,8],[0,0,0]])for(const p of [1,1.1,2,4,8,Infinity])for(const measure of ['probability','counting']){
 const d=lp.compute({values:f,partner:g,p,measure}),w=measure==='probability'?1/3:1;
 const norm=(v,q)=>q===Infinity?Math.max(...v.map(Math.abs)):Math.max(...v.map(Math.abs))===0?0:Math.exp(Math.log(v.reduce((s,x)=>s+w*Math.abs(x)**q,0))/q);
 near(d.norm,norm(f,p));near(d.holder.left,f.reduce((s,x,i)=>s+w*Math.abs(x*g[i]),0));near(d.holder.right,norm(f,p)*norm(g,p===1?Infinity:p===Infinity?1:p/(p-1)));
 near(d.minkowski.left,norm(f.map((x,i)=>x+g[i]),p));near(d.minkowski.right,norm(f,p)+norm(g,p));
 near(d.holder.gap,d.holder.right-d.holder.left);near(d.minkowski.gap,d.minkowski.right-d.minkowski.left);
 ok(d.holder.left<=d.holder.right+1e-10&&d.minkowski.left<=d.minkowski.right+1e-10,'inequalities before any clipping');
 if(f.every(x=>x===0))ok(d.countToProbability===null,'0/0 is not a normalization factor');
}
// Gram normal equations solved directly, independent of Gram-Schmidt.
const dot=(x,y)=>x.reduce((s,v,i)=>s+v*y[i],0);
for(const u of [[1,1,0],[2,-1,1],[0,1,0]])for(const v of [[0,1,1],[1,0,2],[1,2,3]])for(const x of [[2,-1,3],[0,0,0],[-3,4,2]]){
 const A=dot(u,u),B=dot(u,v),C=dot(v,v),det=A*C-B*B;if(!det)continue;
 const d=hp.project(x,[u,v]),alpha=(C*dot(u,x)-B*dot(v,x))/det,beta=(A*dot(v,x)-B*dot(u,x))/det;
 d.projected.forEach((y,i)=>near(y,alpha*u[i]+beta*v[i]));near(dot(d.residual,u),0);near(dot(d.residual,v),0);near(d.vectorSquared,d.projectedSquared+d.residualSquared);
}
console.log('contour/Hilbert: PASS ('+checks+' independent checks)');
