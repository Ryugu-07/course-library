"use strict";
const assert=require('assert'),a=require('../course-shared/labs/physics-topological-band'),ref=require('./fixtures/topological-numpy.json');let checks=0;
function ok(c,m){checks++;assert(c,m)}
function close(x,y,t,m){ok(Math.abs(x-y)<t,m+': '+x+' vs '+y)}
for(const r of ref.projectors){const u=a.lowerEigenvector(r.x,r.y,r.m);ok(!!u,'state exists');for(let i=0;i<2;i++)for(let j=0;j<2;j++){close(u[i].re*u[j].re+u[i].im*u[j].im,r.projector[i][j][0],2e-10,'projector real');close(u[i].im*u[j].re-u[i].re*u[j].im,r.projector[i][j][1],2e-10,'projector imag')}}
for(const r of ref.loops){let e=a.berryPhase(r.m,r.y,512)-r.phase;close(Math.atan2(Math.sin(e),Math.cos(e)),0,2e-11,'eigh Wilson')}
for(const r of ref.edges){const edge=a.edgeSlice(r.m,r.y);ok(edge.exists,'normalizable edge');ok(Math.abs(r.energy-edge.positiveEnergy)<2*Math.pow(edge.decay,r.L)+1e-12,'finite chain converges to half-space');if(r.m===-1&&r.y===.5)ok(r.leftWeight>.99,'positive branch on left boundary')}
const hybrid=ref.edges.filter(r=>r.m===-.2);ok(Math.abs(hybrid[2].energy)<Math.abs(hybrid[1].energy)&&Math.abs(hybrid[1].energy)<Math.abs(hybrid[0].energy),'finite width hybridization decreases');ok(Math.abs(hybrid[0].energy)>1e-3,'finite chain not exactly half-space');
for(let im=0;im<=64;im++){const m=-3.2+im*.1,gap=a.bulkGap(m);close(Math.min(...[0,Math.PI].flatMap(x=>[0,Math.PI].map(y=>2*Math.hypot(Math.sin(x),Math.sin(y),m+Math.cos(x)+Math.cos(y))))),gap,1e-12,'minimum attained at corner');for(let ix=0;ix<=32;ix++)for(let iy=0;iy<=32;iy++){let x=-Math.PI+ix*Math.PI/16,y=-Math.PI+iy*Math.PI/16;let n=2*Math.hypot(Math.sin(x),Math.sin(y),m+Math.cos(x)+Math.cos(y));ok(n+1e-12>=gap,'global analytic minimum')}}
for(const m of [-2,0,2]){ok(Number.isNaN(a.chernEstimate(m).value),'critical C undefined');ok(Number.isFinite(a.berryPhase(m,Math.PI/2,512)),'gapped loop at critical bulk')}
close(a.berryPhase(0,Math.PI/2,512),Math.PI*(1-1/Math.sqrt(2)),2e-5,'solid angle circle');
for(const m of [-.001,.001,1e-12]){const e=a.chernEstimate(m);ok(!e.converged&&e.status==='under-resolved','narrow peak flagged');ok(Math.abs(e.value-e.analytic)>.1,'raw integral not replaced')}
for(const m of [-2.6,-1,1,2.6]){const e=a.chernEstimate(m);ok(e.converged,'resolved far from transition');close(e.value,e.analytic,1e-7,'resolved integral')}
for(const dims of [[0,1],[-1,3],[513,3]])assert.throws(()=>a.curvatureMap(0,...dims));
for(const r of ref.fineLoops){let phase=a.berryPhase(r.m,r.y,r.points),e=phase-r.phase;close(Math.atan2(Math.sin(e),Math.cos(e)),0,3e-11,'high resolution independent eigensolver');}
close(a.berryPhase(0,Math.PI/2,4096),Math.PI*(1-1/Math.sqrt(2)),3e-7,'fine loop approaches exact solid angle');
for(const r of ref.rightEdges){const edge=a.edgeSlice(r.m,r.y);ok(edge.exists,'right branch exists');close(r.energy,edge.negativeEnergy,2*Math.pow(edge.decay,r.L)+1e-12,'right finite chain converges');ok(r.rightWeight>.99&&r.leftWeight<1e-5,'negative branch on right endpoint');}
for(const row of ref.fhs){close(row.value,row.count===41?1:-1,1e-9,'coarse FHS integer counterexample');}
console.log('topological resolution: PASS ('+checks+' checks; NumPy projectors, Wilson loops and finite chains)');
