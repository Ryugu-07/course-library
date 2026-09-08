'use strict';
const assert=require('assert'),a=require('../course-shared/labs/atomic-spectra.js');
let checks=0;function ok(v,m){checks++;assert(v,m)}function close(x,y,t=2e-9){ok(Math.abs(x-y)<=t*Math.max(1,Math.abs(x),Math.abs(y)),`${x} != ${y}`)}
// Separate Coulomb constants path: mu c^2 alpha^2 / (2 n^2), rather than Rydberg input.
const alpha=1/137.035999084,mc2=510998.950,hc=1239.8419843320026,masses=[1836.15267343,3670.48296785];
for(let isotope=1;isotope<=2;isotope++)for(let z=1;z<=3;z++)for(let hi=2;hi<=20;hi++)for(let lo=1;lo<hi;lo++) {
 const mass=masses[isotope-1],C=.5*mc2*alpha*alpha*z*z/(1+1/mass),E=C/lo**2-C/hi**2;
 close(a.lineEnergy(hi,lo,z,isotope),E);close(a.lineWavelength(hi,lo,z,isotope),hc/E);
 if(lo>1)close(a.lineWavenumber(hi,1,z,isotope),a.lineWavenumber(hi,lo,z,isotope)+a.lineWavenumber(lo,1,z,isotope),1e-12);
}
close(a.lineWavelength(3,2,1,1),656.469606333064,1e-12);
close(a.lineWavelength(3,2,1,2),656.291030082574,1e-12);
close(a.lineWavelength(4,2,1,1),486.273782468936,1e-12);
// Keep the distinction between a legal forbidden pair and non-existent orbitals.
for(const transition of a.TRANSITIONS)for(const channel of ['allowed','same-l','delta-m'])for(const z of [1,2,3])for(const massNumber of [1,2])for(const field of [0,.01,3,10]) {
 const r=a.analyze({transition:transition.id,channel,z,massNumber,field});
 const illegal=transition.id==='lyman-alpha'&&channel!=='allowed';
 ok(r.stateLegal===!illegal,'principal quantum number validity');
 ok(r.allowed===(channel==='allowed'),'angular rule combined with existence');
 close(r.upperEnergy-r.lowerEnergy,r.energy,1e-12);
 close(r.fineScale/Math.abs(r.upperEnergy),(z*alpha)**2/transition.nHigh);
 close(r.zeemanShift,5.7883818060e-5*field,1e-12);
 const svg=a.buildSvg(r,'independent');
 ok(!/NaN|Infinity/.test(svg),'finite geometry');
 ok(svg.includes('marker-end="url(#independent-arrow-head)"')===r.allowed,'no false transition arrow for forbidden or nonexistent states');
}
const weak=a.analyze({field:.01}),large=a.analyze({field:3});
ok(weak.fieldRatio<.03&&large.fieldRatio>6,'weak reference and strong extrapolation must be distinguished');
// Inversion depends on occupation per sublevel, not total population.
const gU=3,gL=1,NU=150,NL=100,Bul=2,Blu=Bul*gU/gL;
close(NU*Bul-NL*Blu,Bul*gU*(NU/gU-NL/gL));ok(NU>NL&&NU*Bul-NL*Blu<0,'more upper particles can still absorb');
console.log(`atomic spectra independent checks: PASS (${checks})`);
