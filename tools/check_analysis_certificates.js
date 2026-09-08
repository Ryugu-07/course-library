"use strict";
const assert=require('assert');
const roots=require('../course-shared/labs/root-interpolation.js');
const mv=require('../course-shared/labs/multivariable-derivative.js');
const fourier=require('../course-shared/labs/fourier.js');
const diff=require('../course-shared/labs/derivative-local-linearity.js');
let checks=0;
function ok(v,m){checks++;assert(v,m);}
function near(a,b,t=1e-10,m='numeric'){ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b)),m+': '+a+' vs '+b);}
// A point away from the midpoint cannot inherit the half-width bound.
const off={id:'off-center',f:x=>x-.05,df:x=>1,a:0,b:1,x0:.9,root:.05,continuous:true};
const initial=roots.runNewton(off,0,true).rows[0];
near(initial.intervalCertificate,.9);ok(initial.rootError> .5,'fixture defeats half-width');
function checkRows(preset,steps){
 const run=roots.runNewton(preset,steps,true);let left=preset.a,right=preset.b;
 for(const row of run.rows){
  ok(Number.isFinite(row.x)&&Number.isFinite(row.residual),'finite iterate');
  if(row.intervalValid){
   ok(row.intervalLeft>=left&&row.intervalRight<=right,'nested current bracket');
   ok(row.x>=row.intervalLeft&&row.x<=row.intervalRight,'point in current bracket');
   ok(preset.root>=row.intervalLeft-1e-14&&preset.root<=row.intervalRight+1e-14,'independent root enclosed');
   near(row.intervalCertificate,Math.max(row.x-row.intervalLeft,row.intervalRight-row.x));
   ok(Math.abs(row.x-preset.root)<=row.intervalCertificate+1e-14,'point error bounded');
   left=row.intervalLeft;right=row.intervalRight;
  }
 }
 return run.rows.at(-1);
}
for(const preset of roots.ROOT_PRESETS)for(let steps=0;steps<=40;steps++)checkRows(preset,steps);
for(const id of ['cos-x','cubic']){
 const p=roots.ROOT_PRESETS.find(x=>x.id===id),a=checkRows(p,12),b=checkRows(p,40);
 near(a.x,b.x,0);ok(b.residual<=1e-14,'converged result retained');ok(b.action.includes('停止'),'explicit stopping status');
}
for(const root of [-.7,-.2,.35,.8])for(const x0 of [-.95,-.5,0,.5,.95]){
 const p={f:x=>Math.atan(10*(x-root)),df:x=>10/(1+100*(x-root)**2),a:-1,b:1,x0,root,continuous:true};
 checkRows(p,40);
}
const narrow={f:x=>x-.5,df:x=>1,a:.5-1e-14,b:.5+1e-14,x0:.5+1e-14,root:.5,continuous:true};
ok(roots.runNewton(narrow,40,true).rows.length===1,'narrow interval stops before trial');
// Direct cardinal-polynomial sum is independent of the barycentric quotient.
for(const n of [4,8,12])for(const kind of ['equidistant','chebyshev']){
 const d=roots.interpolationSeries(kind,n,41);
 for(const p of d.points){let value=0,lebesgue=0;
  d.nodes.forEach((x,i)=>{let l=1;d.nodes.forEach((y,j)=>{if(j!==i)l*=(p.x-y)/(x-y);});value+=l/(1+25*x*x);lebesgue+=Math.abs(l);});
  near(p.value,value,1e-9,'direct Lagrange');near(p.lebesgue,lebesgue,1e-9,'direct Lebesgue');
 }
}
// Cubic and quadratic curves play different roles for g.
for(const t of [.1,.05,.02,.005]){
 for(const row of mv.curvedPathEvidence(t)){
  near(row.y,row.x**3,1e-15);near(row.value,.5,1e-14);near(row.quotient,.5/Math.hypot(row.x,row.x**3));
 }
 near(mv.scalarValue('all-directions',t,t*t),t/(1+t*t));
 for(const angle of [15,35,60,120,225]){
  const a=Math.cos(angle*Math.PI/180),b=Math.sin(angle*Math.PI/180);
  near(mv.directionalQuotient('all-directions',[0,0],angle,t),t*a**3*b/(t**4*a**6+b*b));
  const data=mv.analyze({kind:'smooth',angle,step:t});
  near(data.quotientError,t*(a*a+a*b+2*b*b),1e-11,'quadratic directional remainder');
 }
}
// Integrate the two half-periods separately; jumps have measure zero.
function simpson(f,a,b){const n=1200,h=(b-a)/n;let s=f(a)+f(b);for(let i=1;i<n;i++)s+=(i%2?4:2)*f(a+i*h);return s*h/3;}
for(const [key,spec] of Object.entries(fourier.FUNCTIONS))for(let n=1;n<=15;n++){
 let integral=0;for(const [a,b,sign] of [[-Math.PI,0,-1],[0,Math.PI,1]])integral+=simpson(x=>(key==='square'?sign:x)*Math.sin(n*x),a,b)/Math.PI;
 near(spec.coefficient(n),integral,2e-9,'Fourier coefficient from integration');
}
near(fourier.partialSum(fourier.FUNCTIONS.square,Math.PI/2,5),52/(15*Math.PI));
for(const spec of Object.values(fourier.FUNCTIONS))for(const n of [1,5,15,41])for(const x of spec.jumpPoints){near(fourier.partialSum(spec,x,n),0,1e-12);near(fourier.limitValue(spec,x),0);}
for(const h of [-.2,-.1,.025,.05,.1,.2]){
 const d=diff.evaluate({id:'quadratic',h});
 // Preset lookup is checked below to avoid testing a silent fallback.
 ok(d.id==='quadratic','square preset selected');near(d.secant,2+h);near(d.linearizationError,h*h);
}
console.log('analysis certificates: PASS ('+checks+' independent checks)');
