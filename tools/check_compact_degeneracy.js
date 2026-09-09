'use strict';const assert=require('assert'),fs=require('fs'),path=require('path'),m=require('../course-shared/labs/compact-degeneracy.js');let checks=0,maxPressureError=0;
function check(v,msg){assert(v,msg);checks++;}function near(a,b,rel=3e-12,abs=1e-300){check(Number.isFinite(a)&&Math.abs(a-b)<=abs+rel*Math.abs(b),`${a} vs ${b}`);}
class Node{constructor(tag){this.tag=tag;this.attrs={};this.children=[];this.nodeType=1;}setAttribute(k,v){this.attrs[k]=String(v)}appendChild(n){this.children.push(n);return n;}}
const doc={createElementNS:(ns,t)=>new Node(t),createTextNode:t=>({nodeType:3,text:t})};function points(d){const v=d.match(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?/gi).map(Number);return Array.from({length:v.length/2},(_,i)=>[v[i*2],v[i*2+1]]);}
const fixture=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/compact-reference.json'))),C=m.CONSTANTS;
for(const row of fixture.rows){const pressure=m.fermiPressure(row.x);near(pressure,row.pressure,1e-12);maxPressureError=Math.max(maxPressureError,Math.abs(pressure/row.pressure-1));}
for(const mu of [1.5,2,3]){const K=C.HBAR*C.C*(3*Math.PI**2)**(1/3)/(4*(mu*C.atomicMass)**(4/3)),mass=4*Math.PI*(K/(Math.PI*C.G))**1.5*fixture.omega3/C.solarMass;near(m.chandrasekharOrderMassSolar(mu),mass,3e-10);}
for(const mass of [.2,.8,1.4,2.05,3,12])for(const radius of [2,6,12,100,10000])for(const eos of ['soft','stiff']){
 const ns=m.neutronStarLedger(mass,radius,eos),M=mass*C.solarMass,R=radius*1000,rhoc=15*M/(8*Math.PI*R**3),ep=m.EOS_PRESETS.find(e=>e.id===eos);
 near(ns.maxCompactnessRatio,2*C.G*M/(R*C.C**2)*25/24);
 for(const row of ns.profile){const f=row.fraction,r=f*R,rho=rhoc*(1-f*f),P=ep.pressureAtReference*(rho/3e17)**ep.gamma;
  // Independent Simpson quadrature integrates the specified density, not its primitive.
  const N=400,h=f/N;let integral=0;for(let i=0;i<=N;i++){const u=i*h;integral+=(i===0||i===N?1:i%2?4:2)*u*u*(1-u*u);}const enclosed=4*Math.PI*R**3*rhoc*h*integral/3;near(row.enclosedMassSolar*C.solarMass,enclosed,3e-10,1e-200);
  near(row.density,rho);near(row.pressure,P);
  const den=f===0?1:1-2*C.G*enclosed/(r*C.C**2);near(row.denominator,den,1e-8,1e-8);
  const supplied=2*ep.gamma*ep.pressureAtReference*(rhoc/3e17)**ep.gamma*f*(1-f*f)**(ep.gamma-1)/R;near(row.eosGradient,supplied);
  if(row.tovGradient!==null){const need=f===0?0:C.G*(rho+P/C.C**2)*(enclosed+4*Math.PI*r**3*P/C.C**2)/(r*r*den);near(row.tovGradient,need,1e-7,1e-200);if(f===0||f===1)check(row.relativeResidual===null,'0/0 residual');else near(row.relativeResidual,(supplied-need)/Math.max(supplied,need),1e-6,1e-7);}
  near(row.soundSpeedRatio,rho===0?0:ep.gamma*P/(rho*C.C**2));
 }
 const model=m.compactModel('neutron-star',mass,radius,2,eos),svg=m.massRadiusSvg(doc,model,'test');for(const node of svg.children.filter(n=>n.tag==='circle')){const r=node.attrs['data-point']==='input'?radius:2*C.G*M/C.C**2/1000;near(+node.attrs.cx,72+Math.log(mass/.05)/Math.log(240)*640);near(+node.attrs.cy,306-Math.log(r/.1)/Math.log(300000)*250);}
 check(!('maxMassSolar' in ns.eos),'no invented mass limit');check(!('eosMassBoundary' in ns),'no invented boundary');
 if(model.neutronStar){const graph=m.gradientSvg(doc,model);const rows=Array.from({length:101},(_,j)=>m.tovPoint(mass,radius,eos,j/100,ns.densityProfile)),max=Math.max(...rows.flatMap(r=>[r.eosGradient,r.tovGradient===null?0:r.tovGradient]));for(const node of graph.children.filter(n=>n.tag==='path')){const key=node.attrs['data-gradient'],actual=points(node.attrs.d),valid=rows.filter(r=>r[key]!==null);check(actual.length===valid.length,'singular segments excluded');actual.forEach((q,i)=>{check(Math.abs(q[0]-(72+640*valid[i].fraction))<.000006,'gradient x');check(Math.abs(q[1]-(260-180*valid[i][key]/max))<.000006,'gradient y');});}}
}
for(const args of [['typo',1,100,2,'soft'],['neutron-star','1',12,2,'soft'],['white-dwarf',1,0,2,'soft'],['neutron-star',1,12,2,'typo'],['white-dwarf',Infinity,100,2,'soft'],['white-dwarf',1,100,NaN,'soft']]){assert.throws(()=>m.compactModel(...args));checks++;}
check(m.formatNumber(10,0)==='10','integer formatting');check(m.formatNumber(1e-15)!=='0','tiny diagnostic retained');
// SVG geometry checks use independent quadrature over t in [0,1].
const svg=fs.readFileSync(path.join(__dirname,'../physics-course/images/ap-04-mass-radius.svg'),'utf8');
for(const id of ['exact','nr','er','nr-ratio','er-ratio']){const ps=points(svg.match(new RegExp('<path id="'+id+'" d="([^"]+)"'))[1]);check(ps.length===601,'complete static curve');for(let j=0;j<=600;j++){const x=10**(-2+j/150);let I=0,N=2048;for(let k=0;k<=N;k++){const t=k/N;I+=(k===0||k===N?1:k%2?4:2)*t**4/Math.sqrt(1+x*x*t*t);}I*=x**5/(3*N);let v=id==='exact'?I:id==='nr'?x**5/5:id==='er'?x**4/4:id==='nr-ratio'?x**5/5/I:x**4/4/I;const y=id.endsWith('ratio')?611-Math.log10(v)/2.2*180:314-(Math.log10(v)+12)/22*215;check(Math.abs(ps[j][0]-(90+(Math.log10(x)+2)*195))<1e-7,'static x');check(Math.abs(ps[j][1]-y)<1e-6,'static pressure y');}}
for(const p of m.PRESETS.filter(p=>p.objectType==='neutron-star'))check(m.neutronStarLedger(p.massSolar,p.radiusKm,p.eosId).validDomain,'default neutron profile domain');
console.log('compact-degeneracy independent: PASS',{checks,maxPressureError,pressureCases:fixture.rows.length});
