'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),a=require('../course-shared/labs/ssh-edge-state.js');
let checks=0;function ok(v,m){checks++;assert(v,m)}function close(x,y,t=1e-9){ok(Math.abs(x-y)<=t*Math.max(1,Math.abs(x),Math.abs(y)),`${x} != ${y}`)}
// Independent tridiagonal Sturm sequence + bisection, without eigenvectors or Jacobi rotations.
function sturmRoots(bonds){const n=bonds.length+1,bound=2*Math.max(...bonds)+1;
 function count(x){let p=-x;if(Math.abs(p)<1e-280)p=-1e-280;let k=p<0?1:0;for(const b of bonds){if(Math.abs(p)<1e-280)p=-1e-280;p=-x-b*b/p;if(Math.abs(p)<1e-280)p=-1e-280;if(p<0)k++;}return k;}
 return Array.from({length:n},(_,j)=>{let lo=-bound,hi=bound;for(let t=0;t<90;t++){let m=(lo+hi)/2;if(count(m)<=j)lo=m;else hi=m;}return(lo+hi)/2;});
}
for(const cells of [3,4,8,9,18])for(const [t1,t2]of[[.1,1.5],[.45,1.1],[.72,1.08],[.99,1],[.8,.8],[1.1,.45]])for(const termination of ['t1','t2']){
 const state={cells,t1,t2,termination,selected:cells},r=a.computeState(state),first=termination==='t1'?t1:t2,second=termination==='t1'?t2:t1;
 const roots=sturmRoots(Array.from({length:2*cells-1},(_,i)=>i%2?second:first));r.values.forEach((v,i)=>close(v,roots[i]));
 for(let i=0;i<2*cells;i++)for(let j=0;j<2*cells;j++){const dot=r.vectors[i].reduce((v,x,k)=>v+x*r.vectors[j][k],0);close(dot,i===j?1:0);}
 close(r.values.reduce((v,x)=>v+x*x,0),2*(cells*first*first+(cells-1)*second*second));
 ok(r.checks.eigenResidual<1e-10,'full eigen residual');
 const mu=.2,Hmu=r.matrix.map((row,i)=>row.map((v,j)=>v+(i===j?mu:0))),Hm=r.matrix.map((row,i)=>row.map((v,j)=>v+(i===j?(i%2?-mu:mu):0)));
 a.jacobiSymmetric(Hmu).values.forEach((v,i)=>close(v,r.values[i]+mu));
 
 // Extremely tiny roots can have a numerical sign ambiguity: use exact paired positive radii.
 const positive=r.values.slice(cells).map(v=>Math.hypot(v,mu));const paired=positive.map(v=>-v).concat(positive).sort((x,y)=>x-y);
 a.jacobiSymmetric(Hm).values.forEach((v,i)=>close(v,paired[i]));
}
const weak=a.computeState({cells:3,t1:.99,t2:1,termination:'t1',selected:3});ok(weak.phase.winding===1&&!weak.resolvedInGap,'short topological chain need not have in-gap levels');
const r=a.computeState({cells:9,t1:.72,t2:1.08,termination:'t1',selected:9});close(r.edgeEnergy,.01565588311510652);close(r.edgeWeight,.5587406076610355);
ok(a.formatNumber(null,1e-6,5)!=='0','do not round tiny physical splittings to exact zero');ok(a.formatNumber(null,10,0)==='10','do not strip integer trailing zero');
// Read the actual SVG and substitute each plotted frequency into the dynamical-matrix determinant.
const svg=fs.readFileSync(path.join(__dirname,'../physics-course/images/solid-01-phonon.svg'),'utf8');
const curves=[...svg.matchAll(/<polyline points="([^"]+)" class="([ao])"/g)];ok(curves.length===2,'two phonon branches');
for(const c of curves){const pts=c[1].split(' ').map(v=>v.split(',').map(Number));ok(pts.length===501,'complete Brillouin zone');for(const [x,y]of pts){const k=(x-82)/620*2*Math.PI-Math.PI,w=(342-y)/254*1.9;
 // det[[2-w², -(1+exp(-ik))],[-(1+exp(ik)),2-2w²]]=0
 close((2-w*w)*(2-2*w*w),2+2*Math.cos(k),5e-6);ok(w>=0,'positive frequency');}
 const start=(342-pts[0][1])/254*1.9,center=(342-pts[250][1])/254*1.9;
 close(start,c[2]==='a'?1:Math.SQRT2,1e-6);close(center,c[2]==='a'?0:Math.sqrt(3),1e-6);
}
console.log(`SSH/lattice independent checks: PASS (${checks})`);
