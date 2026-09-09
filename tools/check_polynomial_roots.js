"use strict";
// Independent factor convolution, derivatives, sign tests and floating-point boundaries.
const assert = require("assert");
const lab = require("../course-shared/labs/polynomial-roots.js");
let checks = 0;
function check(ok, message) { checks++; assert(ok, message); }
function close(a,b,message,tol=2e-11) { check(Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b)),message); }
function multiply(a,b) { const c=Array(a.length+b.length-1).fill(0); a.forEach((x,i)=>b.forEach((y,j)=>c[i+j]+=x*y)); return c; }
function poly(a,x) { return a.reduceRight((v,c)=>v*x+c,0); }
function derivative(a) { return a.slice(1).map((x,i)=>(i+1)*x); }
for(let ci=0;ci<=20;ci++) for(let di=0;di<=20;di++) for(let gi=0;gi<=16;gi++) {
  const c=.5+ci/20,d=-3+di/10,g=gi/20,p={center:c,anchor:d,gap:g},r=lab.evaluate(p);
  const coefficients=multiply(multiply([-c+g,1],[-c-g,1]),[-d,1]);
  [r.coefficients.a0,r.coefficients.a1,r.coefficients.a2,r.coefficients.a3].forEach((v,i)=>close(v,coefficients[i],"factor convolution"));
  check(r.roots.reduce((v,x)=>v+x.multiplicity,0)===3,"degree counted with multiplicity");
  check(r.rootsResolved,"UI domain roots resolve");
  close(r.coefficientShift,-g*g,"theoretical shift");
  close(r.coefficients.a0-r.baseline.a0,d*g*g,"constant shift");
  close(r.separation,2*g,"root separation");
  r.roots.forEach(root=>{
    close(poly(coefficients,root.value),0,"root residual");
    const first=poly(derivative(coefficients),root.value),second=poly(derivative(derivative(coefficients)),root.value);
    check(root.multiplicity===1 ? Math.abs(first)>1e-5 : Math.abs(first)<1e-10 && Math.abs(second)>1,"exact multiplicity");
    const step=g===0 ? .01 : Math.min(.01,g/4);
    const sign=poly(coefficients,root.value-step)*poly(coefficients,root.value+step);
    check(root.crosses ? sign<0 : sign>0,"parity and local crossing");
  });
  for(const u of [-1.5,-1,-.25,0,.25,1,1.5]) {
    const h=g||.25,x=c+h*u;
    close(lab.localValue(u,p),poly(coefficients,x)/(h*h*(c-d)),"independent local scaling",2e-9);
  }
  for(const x of [d-1.1,0,c+.123,c+g+1.1]) {
    close(lab.factoredValue(x,p),poly(coefficients,x),"factor and expanded evaluation");
    close(lab.polynomialValue(x,r.coefficients),poly(coefficients,x),"Horner coefficient evaluation");
  }
}
for(const c of [.5,1,1.5]) for(const g of [1e-8,1e-11,1e-16,1e-20,1e-160,1e-200,Number.MIN_VALUE]) {
  const p={center:c,anchor:-2,gap:g},r=lab.evaluate(p);
  check(r.roots.length===3 && r.roots.every(x=>x.multiplicity===1),"symbolic positive gaps never merge");
  check(r.rootsResolved === (c-g<c && c+g>c),"absolute coordinate representation status");
  if(g*g===0) check(r.coefficientShift===null,"underflow is unavailable, not zero");
  else check(r.coefficientShift===-g*g && r.coefficientShift<0,"tiny shift retains sign");
  check(lab.localValue(-1,p)===0 && lab.localValue(1,p)===0,"scaled roots survive absolute rounding");
  check(lab.format(g)!=="0","tiny display not rounded to zero");
  check(r.separation>0,"positive separation survives");
}
check(lab.evaluate({center:1,anchor:-2,gap:1e-11}).storedCoefficientShift===0,"stored coefficients may coincide");
check(lab.format(12000,0)==="12000","integer zeros preserved");
for(const key of ["center","anchor","gap"]) for(const value of [NaN,Infinity,-Infinity,null,"1",undefined]) {
  checks++; assert.throws(()=>lab.evaluate({...lab.DEFAULTS,[key]:value}),RangeError);
}
for(const p of [{center:.49,anchor:-2,gap:0},{center:1.51,anchor:-2,gap:0},{center:1,anchor:-3.01,gap:0},{center:1,anchor:-.99,gap:0},{center:1,anchor:-2,gap:-.01},{center:1,anchor:-2,gap:.81}]) {
  checks++;assert.throws(()=>lab.evaluate(p),RangeError);
}
for(const x of [NaN,Infinity,"1",null,1e308]) {
  checks++;assert.throws(()=>lab.polynomialValue(x,lab.evaluate(lab.DEFAULTS).coefficients),RangeError);
}
// Exact integer identities for the two exercises, independent of the UI family.
const f=[-1,2,0,-2,1],fp=derivative(f),rem=[-.75,1.5,-.75];
const qfp=multiply([-.125,.25],fp);
f.forEach((v,i)=>close(v,qfp[i]+(rem[i]||0),"first Euclidean division"));
multiply([-8/3,-16/3],rem).forEach((v,i)=>close(v,fp[i],"second Euclidean division"));
let shifted=[0];for(let n=0;n<=4;n++){let power=[1];for(let k=0;k<n;k++)power=multiply(power,[1,1]);power.forEach((v,i)=>shifted[i]=(shifted[i]||0)+v);}
check(JSON.stringify(shifted)===JSON.stringify([5,10,10,5,1]),"cyclotomic translation");
check(shifted[4]%5!==0&&shifted.slice(0,4).every(v=>v%5===0)&&shifted[0]%25!==0,"Eisenstein five");
const svg = require("fs").readFileSync(require("path").join(__dirname,"../math-course/images/algebra-01-root-split.svg"),"utf8");
const curves=[...svg.matchAll(/<path d="([^"]+)" fill="none" stroke="#1d4ed8"/g)];
check(curves.length===2,"two static curve panels");
curves.forEach((curve,k)=>{
 const points=[...curve[1].matchAll(/[ML]([\d.]+) ([\d.]+)/g)];check(points.length===401,"static sample count");
 points.forEach((point,i)=>{const x=(Number(point[1])-105)/500+.4,y=(90+k*218+170-Number(point[2]))/90-.3,g=k*.25;close(x,.4+1.2*i/400,"static x coordinate",2e-6);close(y,((x-1)**2-g*g)*(x+2),"static curve formula",1e-5);});
});
// Inline mathematics must not be broken by an interpreted escape such as \n.
const lecture = require("fs").readFileSync(require("path").join(__dirname,"../math-course/lectures/algebra-01-polynomial.md"),"utf8");
check(!/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(lecture),"no control-character damage in lecture");
for (const inline of lecture.replace(/\$\$[\s\S]*?\$\$/g,"").matchAll(/(?<![\\$])\$(?!\$)([\s\S]*?)(?<!\\)\$(?!\$)/g)) check(!inline[1].includes("\n"),"inline math must stay intact on one line");
console.log(`polynomial roots: PASS (${checks} independent checks; ${lab.selfTest().checks} self-tests)`);
