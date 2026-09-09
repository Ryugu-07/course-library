'use strict';
const assert=require('assert'),g=require('../course-shared/labs/geodesic-metric'),r=require('../course-shared/labs/riemann-curvature');let checks=0;
function near(a,b,t=1e-8){checks++;assert(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`)}
function ok(b,m){checks++;assert(b,m)}
const dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0);
// Round trip catches the old north/south reflection; metric is an independent pullback.
for(let u=-4;u<=4;u+=.4)for(let v=-3;v<=3;v+=.5){const q=[u,v],p=g.sphereStereographicToEmbedding(q),back=g.chartTransition('sphere','stereographic','spherical',q),uv=g.chartTransition('sphere','spherical','stereographic',back.target).target;near(dot(p,p),1);near(uv[0],u);near(uv[1],v);
 const h=1e-5,J=[0,1].map(k=>{let a=q.slice(),b=q.slice();a[k]+=h;b[k]-=h;const x=g.sphereStereographicToEmbedding(a),y=g.sphereStereographicToEmbedding(b);return x.map((z,i)=>(z-y[i])/(2*h));}),m=g.metricTensor('sphere','stereographic',q).matrix;
 for(let i=0;i<2;i++)for(let j=0;j<2;j++)near(dot(J[i],J[j]),m[i][j],1e-9);
}
near(g.sphereStereographicToEmbedding([0,0])[2],-1);for(const theta of [1e-8,1e-6,.01,Math.PI-1e-8]){let q=[theta,.3],uv=g.sphereSphericalToStereographic(q),p=g.sphereStereographicToEmbedding(uv);const ref=g.sphereSphericalToEmbedding(q);p.forEach((x,i)=>near(x,ref[i],1e-12));}
ok(g.metricTensor('sphere','stereographic',[10000,2]).regular,'small metric is positive');ok(g.metricTensor('plane','polar',[1e-12,0]).regular,'small polar r valid');
// Christoffel via independent numerical metric derivatives and matrix inverse.
for(const [man,chart,qs] of [['plane','polar',[[.3,.4],[2,1]]],['sphere','spherical',[[.4,1],[1.3,-.2]]],['sphere','stereographic',[[.1,.3],[2,-1],[-2,3]]]])for(const q of qs){let h=1e-5,m=g.metricTensor(man,chart,q).matrix,det=m[0][0]*m[1][1]-m[0][1]*m[1][0],inv=[[m[1][1]/det,-m[0][1]/det],[-m[1][0]/det,m[0][0]/det]],d=[0,1].map(k=>{let a=q.slice(),b=q.slice();a[k]+=h;b[k]-=h;const ma=g.metricTensor(man,chart,a).matrix,mb=g.metricTensor(man,chart,b).matrix;return ma.map((row,i)=>row.map((x,j)=>(x-mb[i][j])/(2*h)));}),G=g.christoffelSymbols(man,chart,q).symbols;for(let k=0;k<2;k++)for(let i=0;i<2;i++)for(let j=0;j<2;j++)near(G[k][i][j],.5*inv[k].reduce((sum,x,l)=>sum+x*(d[i][j][l]+d[j][i][l]-d[l][i][j]),0),1e-9);}
// Independent finite differences of the coordinate path, not the geodesic ODE.
for(const pre of g.PRESETS)for(const chart of pre.manifold==='sphere'?['spherical','stereographic']:['cartesian','polar'])for(let n=1;n<40;n++){let t=pre.duration*n/40,h=2e-4,p=g.geodesicPoint(pre.id,t,chart),a=g.geodesicPoint(pre.id,t-h,chart),b=g.geodesicPoint(pre.id,t+h,chart);near(dot(p.velocity,p.velocity),2*p.energy);if(!p.chartRegular||!a.chartRegular||!b.chartRegular)continue;near(p.coordinateEnergy,p.energy);near(p.residual,0,1e-7);for(let k=0;k<2;k++){let da=a.coordinates[k]-p.coordinates[k],db=b.coordinates[k]-p.coordinates[k];if((chart==='polar'&&k===1)||(chart==='spherical'&&k===1)){da=Math.atan2(Math.sin(da),Math.cos(da));db=Math.atan2(Math.sin(db),Math.cos(db));}near((db-da)/(2*h),p.coordinateVelocity[k],2e-5);near((db+da)/(h*h),p.coordinateAcceleration[k],2e-4);}}
// Nongeodesics must not be silently assigned accelerations that make the ODE cancel.
for(const t of [.5,1,2]){let q=g.coordinateVelocityAndAcceleration('plane','polar',[t*t,0,0],[2*t,0,0],[2,0,0]);near(q.acceleration[0],2);near(g.geodesicResidual(g.christoffelSymbols('plane','polar',[t*t,0]),q.velocity,q.acceleration),2);}
for(const th of [.4,.8,1.2]){const p=[Math.sin(th),0,Math.cos(th)],v=[0,Math.sin(th),0],a=[-Math.sin(th),0,0],q=g.coordinateVelocityAndAcceleration('sphere','spherical',p,v,a);near(q.acceleration[0],0);near(q.velocity[1],1);near(g.geodesicResidual(g.christoffelSymbols('sphere','spherical',[th,0]),q.velocity,q.acceleration),Math.abs(Math.sin(th)*Math.cos(th)));}
// RK4 first order system gives independent Jacobi reference for both initial conditions.
for(const K of [-.25,0,.25,1e-12,-1e-12])for(const init of [[1,0],[0,1],[.7,-.2]]){let y=init.slice(),dt=.002;function f(z){return[z[1],-K*z[0]]}for(let n=0;n<=4000;n++){if(n%80===0)near(r.deviationRatio(K,n*dt,init[0],init[1]),y[0],2e-10);let a=f(y),b=f(y.map((x,i)=>x+dt*a[i]/2)),c=f(y.map((x,i)=>x+dt*b[i]/2)),d=f(y.map((x,i)=>x+dt*c[i]));y=y.map((x,i)=>x+dt*(a[i]+2*b[i]+2*c[i]+d[i])/6);}}
near(r.deviationRatio(.25,Math.PI,1,0),0);near(r.deviationRatio(.25,2*Math.PI,0,1),0);near(r.deviationRatio(.25,Math.PI,0,1),2);
// Trace R directly on orthonormal basis and verify scale invariance for tiny sections.
const basis=[[1,0,0],[0,1,0],[0,0,1]];for(const K of [-.25,0,.25])for(const X of [[1,2,3],[.1,-.4,.5]])for(const Y of [[-1,2,.1],[.2,.3,-.1]]){let tr=basis.reduce((sum,e)=>sum+dot(r.riemannAction(K,e,X,Y),e),0);near(tr,r.ricciTensor(K,X,Y,3));for(const scale of [1e-8,1,1e4])near(r.sectionalData(K,X.map(x=>x*scale),Y.map(y=>y*scale)).value,K);}
// Sphere latitude rectangle: integrate connection exactly, angle = dphi(cos theta0-cos theta1).
// R convention gives -R(e1,e2)e1 towards +e2. Check small-loop sign and convergence.
for(const ell of [.02,.01,.005]){let theta0=1.1,R=2,dphi=ell/(R*Math.sin(theta0)),angle=dphi*(Math.cos(theta0)-Math.cos(theta0+ell/R));ok(angle>0,'CCW positive transport');near(angle/r.holonomyAngle(1/(R*R),ell),1,.006);}
for(const orientation of [-1,1])for(const initialMode of ['parallel','fan']){let q=r.evaluateExperiment({orientation,initialMode});near(q.holonomy,.09*orientation);near(q.firstZero,initialMode==='fan'?2*Math.PI:Math.PI);}
// Extreme finite coordinates remain valid; distinguish representability from geometry.
for(const x of [1e78,1e155,1e200,1e308])for(const sign of [-1,1]){
 const q=[sign*x,0],p=g.sphereStereographicToEmbedding(q),metric=g.metricTensor('sphere','stereographic',q),gamma=g.christoffelSymbols('sphere','stereographic',q);
 near(p[0]/(2/x),sign,1e-12);near(p[1],0);near(p[2],1);ok(metric.regular,'finite chart always regular');near(gamma.symbols[0][0][0]/(-2/x),sign,1e-12);
 if(x===1e78){near(metric.matrix[0][0]/4e-312,1,1e-10);ok(metric.numericallyUsable,'subnormal metric retained');ok(metric.determinant===null,'underflow not falsely zero determinant');}
 else {ok(!metric.numericallyUsable&&metric.matrix===null,'unrepresentable metric explicit');}
}
for(const angle of [1e-155,1e-200,1e-300]){let q=g.sphereSphericalToStereographic([angle,0]);near(q[0]/(2/angle),1,1e-12);near(q[1],0);}
for(const fn of [()=>g.sphereSphericalToStereographic([Number.MIN_VALUE,0]),()=>g.sphereStereographicToEmbedding([Infinity,0]),()=>g.metricTensor('sphere','stereographic',[NaN,0]),()=>g.christoffelSymbols('sphere','stereographic',[0,Infinity])]){checks++;assert.throws(fn);}
console.log(`Riemannian independent checks: PASS (${checks})`);
