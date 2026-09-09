'use strict';
const assert=require('assert'),a=require('../course-shared/labs/physics-spectroscopy-imaging'),ref=require('./fixtures/spectroscopy-svd.json');let checks=0;
function near(x,y,t=1e-10){checks++;assert(Number.isFinite(x)&&Math.abs(x-y)<=t*Math.max(1,Math.abs(y)),`${x} vs ${y}`)}
for(const row of ref.rows){const r=a.buildData(row.config);r.blurred.forEach((v,i)=>near(v,row.blurred[i],1e-13));if(row.reconstruction===null){assert.equal(r.reconstruction,null);assert(r.inverseStatus.includes('λ=0'));checks+=2;}else{r.reconstruction.forEach((v,i)=>near(v,row.reconstruction[i],2e-9));near(r.metrics.reconstructedMean,r.metrics.observedMean/(1+row.config.regularization),1e-10);}
const sum=r.truth.reduce((s,v)=>s+v,0),blur=r.blurred.reduce((s,v)=>s+v,0);near(sum,blur,1e-12);
for(const [k,point]of r.discreteTransfer.entries()){const q=2*Math.PI*k/6;near(point.q,q);near(point.magnitude,a.dftMagnitudeAtQ(r.kernel,q),1e-13);}
}
// Known eigenvectors of circular convolution independently test both real and complex phases.
for(const N of [8,16,32])for(let mode=0;mode<N;mode++){
 const kernel=Array(N).fill(0);kernel[0]=.7;kernel[1]=.3;
 const input=Array.from({length:N},(_,i)=>Math.cos(2*Math.PI*mode*i/N)+.4*Math.sin(2*Math.PI*mode*i/N));
 const output=a.circularConvolution(input,kernel);output.forEach((v,i)=>near(v,.7*input[i]+.3*input[(i-1+N)%N],1e-13));
 a.regularizedInverse(output,kernel,0).forEach((v,i)=>near(v,input[i],2e-13));
 const lambda=.2,rec=a.regularizedInverse(output,kernel,lambda),h2=.58+.42*Math.cos(2*Math.PI*mode/N);rec.forEach((v,i)=>near(v,input[i]*h2/(h2+lambda),2e-13));
}
// DC shrinkage happens even without noise; lambda=0 is exact rather than a hidden ridge.
for(const lambda of [0,1e-14,.02,.2]){const y=Array(16).fill(1),h=Array(16).fill(0);h[0]=1;const r=a.regularizedInverse(y,h,lambda);r.forEach(v=>near(v,1/(1+lambda),2e-14));}
const meanKernel=Array(16).fill(1/16);assert.throws(()=>a.regularizedInverse(Array(16).fill(1),meanKernel,0),e=>e.code==='UNRESOLVED_INVERSE');checks++;
// The equal-Gaussian midpoint curvature changes sign at d=2s, independently by finite differences.
for(const s of [.1,.2,.4])for(const ratio of [1.8,2,2.2]){const d=ratio*s,f=x=>Math.exp(-.5*((x-d/2)/s)**2)+Math.exp(-.5*((x+d/2)/s)**2),step=s*1e-3,numeric=(-f(2*step)+16*f(step)-30*f(0)+16*f(-step)-f(-2*step))/(12*step**2),exact=2*Math.exp(-d*d/(8*s*s))*(d*d/(4*s**4)-1/s**2);near(numeric,exact,2e-7);}
for(const fn of [()=>a.circularConvolution([1],[1,2]),()=>a.dft([]),()=>a.dft([NaN]),()=>a.dft([{}]),()=>a.regularizedInverse([1],[1],-1),()=>a.regularizedInverse([1],[1e-308],0),()=>a.dftMagnitudeAtQ([1],Infinity),()=>a.analyticTransfer(0,1),()=>a.sourceSignal(.1),()=>a.normalizeConfig({noise:'0.1'})]){assert.throws(fn,RangeError);checks++;}
console.log(`Spectroscopy independent checks: PASS (${checks})`);
