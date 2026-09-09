"use strict";
const assert = require("node:assert/strict");
const lab = require("../course-shared/labs/physics-vacuum-cryogenic-daq.js");
let checks = 0;
function check(x, msg) { checks++; assert.ok(x, msg); }
function close(x, y, eps=1e-11) { check(Math.abs(x-y)<=eps*Math.max(1,Math.abs(y)), `${x} != ${y}`); }
// Solve the two independent balance equations for chamber/pump pressures.
for(const Q of [.001,.012,.08]) for(const S of [20,100,200]) for(const C of [5,25,80]) {
 const b=lab.vacuumBudget({gasLoad:Q,pumpSpeed:S,conductance:C});
 const pp=Q/S, pc=pp+Q/C;
 close(b.pressure,pc); close(S*pp,Q); close(C*(pc-pp),Q);
 check(b.effectiveSpeed < Math.min(S,C),"series bottleneck");
 close(b.pressure*b.effectiveSpeed,Q);
}
// Thermal ODE: a known fixed point and exact exponential approach.
const qin=.05, slope=.02, Cth=.1, Teq=4.5;
const dt=.001;let T=4;
for(let i=0;i<10000;i++) {
 const f=t=>(qin-slope*(t-2))/Cth;
 const k1=f(T), k2=f(T+dt*k1/2), k3=f(T+dt*k2/2), k4=f(T+dt*k3);
 T+=dt*(k1+2*k2+2*k3+k4)/6;
}
close(T,Teq-.5*Math.exp(-2));
for(const rad of [0,18,80]) for(const cond of [0,22,80]) for(const wires of [0,7,50]) for(const sig of [0,3,40]) for(const cooling of [20,80,180]) {
 const b=lab.cryogenicBudget({radiation:rad,conduction:cond,wires,signal:sig,cooling});
 close(b.total,rad+cond+wires+sig); close(b.headroom+b.total,cooling);
 close(b.safetyHeadroom+b.total,4*cooling/5);
 check(b.overloaded===(rad+cond+wires+sig>cooling),"overload predicate");
}
// Exhaust every code bin at low bit counts. Midpoints are independently constructed.
for(const bits of [1,2,3,8]) for(const V of [.1,1,5]) {
 const M=2**bits, delta=2*V/M; let sumsq=0;
 for(let j=0;j<M;j++) for(const frac of [.125,.375,.625,.875]) {
   const raw=-V+(j+frac)*delta, q=lab.quantizeAdc(raw,V,bits);
   check(q.code===j,"bin index"); close(q.value,-V+(j+.5)*delta);
   check(Math.abs(q.error)<=delta/2+1e-14,"bounded quantization error");
   check(!q.clipped,"in range");sumsq+=q.error*q.error;
 }
 // Four-point midpoint quadrature for e^2 has a known discretization error.
 close(sumsq/(4*M),delta*delta*(1/12-1/192));
 close(lab.quantizeAdc(V,V,bits).value,V-delta/2);
 close(lab.quantizeAdc(-V,V,bits).value,-V+delta/2);
 close(lab.quantizeAdc(0,V,bits).value,delta/2);
 const clipped=lab.quantizeAdc(1.2*V,V,bits);
 check(clipped.clipped,"overrange flagged");close(clipped.clippedValue,V);
}
for(const bits of [16,24]) for(const raw of [-1,-.72,-.001,0,.42,1,1.5]) {
 const q=lab.quantizeAdc(raw,1,bits);close(q.step,2/(2**bits));
 check(Math.abs(q.error)<=q.step/2+1e-15,"fine resolution error");
}
close(lab.quantizeAdc(-.72,1,8).code,35);
close(lab.quantizeAdc(-.72,1,8).value,-.72265625);
// Alias invariant of complex exponentials; no use of application's sine evaluator.
for(const fs of [2000,12000,30000]) for(const f of [100,2400,6000,9000,30000]) {
 const a=lab.wrapFrequency(f,fs);check(a>=-fs/2 && a<fs/2,"half-open alias interval");
 for(let n=0;n<30;n++) {
  close(Math.cos(2*Math.PI*f*n/fs),Math.cos(2*Math.PI*a*n/fs),2e-12);
  close(Math.sin(2*Math.PI*f*n/fs),Math.sin(2*Math.PI*a*n/fs),2e-12);
 }
}
for(const fs of [2000,12000,30000]) for(const f of [100,2400,9000,30000]) for(const amplitude of [0,.72,1.5]) for(const bits of [8,24]) {
 const config={sampleRate:fs,signalHz:f,amplitude,bits};
 const w=lab.daqWaveform(config), b=lab.daqBudget(config);
 check(w.segments>=64*f*w.duration,"render grid resolves original oscillation");
 close(w.duration,Math.max(4/f,12/fs));
 check(w.samples.length===Math.floor(w.duration*fs+1e-10)+1,"all ADC points");
 for(const i of [0,Math.floor(w.segments*.137),Math.floor(w.segments*.713),w.segments]) {
  const p=w.continuous[i];close(p.raw,amplitude*Math.sin(2*Math.PI*f*p.time),2e-12);
  close(p.clipped,Math.max(-1,Math.min(1,p.raw)));
 }
 for(const q of w.samples) {
  close(q.raw,amplitude*Math.sin(2*Math.PI*f*q.index/fs),3e-12);
  check(q.code>=0&&q.code<2**bits&&Number.isInteger(q.code),"digital code domain");
  check(Math.abs(q.error)<=b.lsb/2+1e-14,"sample error bound");
 }
 close(b.dataRate,fs*4*bits);
 if(amplitude===0||amplitude>1) check(b.quantizationSnr===null,"conditional SNR");
}
const edge=lab.daqWaveform({sampleRate:12000,signalHz:6000});
edge.samples.forEach(q=>close(q.raw,0,0));
for(const f of [()=>lab.wrapFrequency(1,0),()=>lab.wrapFrequency(Infinity,1),()=>lab.quantizeAdc(0,1,1.5),()=>lab.quantizeAdc(0,Number.MIN_VALUE,24),()=>lab.normalizeConfig({daq:{bits:8.5}}),()=>lab.normalizeConfig({daq:{channels:2.5}}),()=>lab.normalizeConfig({cryo:{radiation:1e308}}),()=>lab.normalizeConfig({vacuum:{gasLoad:null}}),()=>lab.normalizeConfig({daq:{sampleRate:"12000"}})]) {
 checks++;assert.throws(f,RangeError);
}
console.log(`vacuum / cryogenic / DAQ independent checks: PASS (${checks})`);
