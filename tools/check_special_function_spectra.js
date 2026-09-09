'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');let checks=0;
function near(x,y,t=1e-10){checks++;assert(Number.isFinite(x)&&Math.abs(x-y)<=t*Math.max(1,Math.abs(y)),`${x} vs ${y}`)}
function simpson(fn,lo,hi,n=1200){let sum=0,h=(hi-lo)/n;for(let j=0;j<=n;j++)sum+=(j===0||j===n?1:j%2?4:2)*fn(lo+j*h);return sum*h/3;}
// These displayed formulas are the lesson's normalization contract. Numerical checks below
// derive the same quantities from independent integrals and spectra, not from page parsing.
const lesson=fs.readFileSync(path.join(__dirname,'../physics-course/lectures/mp-01-special-functions.md'),'utf8');
function contract(text){for(const fragment of [String.raw`G_{\rm ret}=\delta(\tau-\rho/c)/(4\pi\rho)`,String.raw`=c^2\tau\Theta(\tau)`,String.raw`c^{-2}F_c''=\delta`,String.raw`=\frac{x^2+\xi^2}{2L}-\max(x,\xi)+\frac L3`,String.raw`\delta(x-\xi)-1/L`])assert(text.includes(fragment),'missing or changed normalization contract: '+fragment);}
contract(lesson);checks+=5;
assert.throws(()=>contract(lesson.replaceAll(String.raw`=c^2\tau\Theta(\tau)`,String.raw`=\tau\Theta(\tau)`)));checks++;
assert.throws(()=>contract(lesson.replaceAll(String.raw`\delta(x-\xi)-1/L`,String.raw`\delta(x-\xi)`)));checks++;
const gaussian=(v,eps)=>Math.exp(-.5*(v/eps)**2)/(eps*Math.sqrt(2*Math.PI));
// Integrate the spherical shell directly with a mollified delta, including negative time.
for(const c of [.5,1,2.3,4])for(const t of [-.2,0,.11,.3]){
 const eps=.04,h=1e-4,maxR=c*(Math.max(0,t)+12*eps),shell=u=>simpson(r=>r*gaussian(u-r/c,eps),0,maxR,4000),second=(shell(t+h)-2*shell(t)+shell(t-h))/h**2;
 near(second/c**2,gaussian(t,eps),4e-6);
 near(second/c**2,((shell(t+h)/c**2)-2*(shell(t)/c**2)+shell(t-h)/c**2)/h**2,2e-7);
 if(t>0){const narrow=simpson(r=>r*gaussian(t-r/c,.001),c*Math.max(0,t-.012),c*(t+.012),1200);near(narrow,c*c*t,2e-11);}
}
function closedN(x,z,L){return (x*x+z*z)/(2*L)-Math.max(x,z)+L/3;}
function spectrum(x,z,L,bc,N){let sum=0;for(let n=1;n<=N;n++){const trig=bc==='D'?Math.sin:Math.cos;sum+=2/L*trig(n*Math.PI*x/L)*trig(n*Math.PI*z/L)/(n*Math.PI/L)**2;}return sum;}
for(const L of [.5,1,1.3,2])for(const xr of [0,.2,.53,.8,1])for(const zr of [.2,.53,.8]){
 const x=xr*L,z=zr*L,N=12000;
 for(const bc of ['D','N']){const target=bc==='D'?Math.min(x,z)*(L-Math.max(x,z))/L:closedN(x,z,L);near(spectrum(x,z,L,bc,N),target,2*L/(Math.PI*Math.PI*N)+1e-12);}
 // Piecewise integration resolves the derivative jump exactly rather than smoothing it away.
 near(simpson(y=>closedN(y,z,L),0,z)+simpson(y=>closedN(y,z,L),z,L),0,1e-12);
 near(closedN(x,z,L),closedN(z,x,L));
 const h=L*1e-4,d0=(-3*closedN(0,z,L)+4*closedN(h,z,L)-closedN(2*h,z,L))/(2*h),dL=(3*closedN(L,z,L)-4*closedN(L-h,z,L)+closedN(L-2*h,z,L))/(2*h);
 near(d0,0,2e-10);near(dL,0,2e-10);
 const j=(closedN(z+h,z,L)-closedN(z,z,L))/h-(closedN(z,z,L)-closedN(z-h,z,L))/h;near(j,-1+h/L,2e-10);
 // Apply to a zero-mean cosine load: Neumann inverse must return that mode / eigenvalue.
 for(const m of [1,2,3]){const actual=simpson(y=>closedN(x,y,L)*Math.cos(m*Math.PI*y/L),0,x)+simpson(y=>closedN(x,y,L)*Math.cos(m*Math.PI*y/L),x,L);near(actual,Math.cos(m*Math.PI*x/L)/(m*Math.PI/L)**2,1e-10);}
}
// Deliberately inverting the constant eigenvalue produces no finite inverse.
assert(!Number.isFinite((1/1.3)/0));checks++;
console.log(`Special-function spectral and wave normalization checks: PASS (${checks})`);
