"use strict";
const assert=require("node:assert/strict"),lab=require("../course-shared/labs/research-two-site.js"),env=require("../course-shared/labs/research-environments.js");
let checks=0;
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),T=A=>A[0].map((_,j)=>A.map(r=>r[j])),mul=(A,B)=>A.map(r=>T(B).map(c=>dot(r,c))),mv=(A,v)=>A.map(row=>dot(row,v));
function near(a,b,label,tol=1e-9){assert.ok(Math.abs(a-b)<=tol,`${label}: ${a} != ${b}`);checks++;}
function matrix(A,B,label){A.forEach((r,i)=>r.forEach((x,j)=>near(x,B[i][j],label)));}
const I=[[1,0],[0,1]],X=[[0,1],[1,0]],Z=[[1,0],[0,-1]],kron=(A,B)=>A.flatMap(row=>B.map(br=>row.flatMap(a=>br.map(b=>a*b))));
function tensor(ops){return ops.reduce(kron,[[1]]);}
function h(g){const H=Array.from({length:16},()=>Array(16).fill(0));
 for(let j=0;j<4;j++){const term=tensor(Array.from({length:4},(_,i)=>i===j?Z:I));H.forEach((r,a)=>r.forEach((_,b)=>H[a][b]-=g*term[a][b]));}
 for(let j=0;j<3;j++){const term=tensor(Array.from({length:4},(_,i)=>i===j||i===j+1?X:I));H.forEach((r,a)=>r.forEach((_,b)=>H[a][b]-=term[a][b]));}return H;}
const fixtures=[{"g":0.2,"ground":-3.0617348039537458,"top":3.0617348039537475,"singular":[0.7346027232503093,0.6784936945069167,0.0016663558966919375,0.0015390794682977253],"rows":[{"r":1,"epsilon":0.4603588389932293,"energy":-2.1467589355627243,"residual":1.0078258958226884,"bound":2.818993359306619},{"r":2,"epsilon":5.145507584175601e-06,"energy":-3.061713522256256,"residual":0.009402307325909066,"bound":3.15083593089568e-05},{"r":3,"epsilon":2.368765609735609e-06,"energy":-3.0617224662236726,"residual":0.008164975777000372,"bound":1.4505064219472463e-05},{"r":4,"epsilon":0.0,"energy":-3.061734803953747,"residual":2.4423103964372757e-15,"bound":0.0}]},{"g":0.5,"ground":-3.4270340889080786,"top":3.4270340889080795,"singular":[0.8449096645216694,0.5348461698783261,0.006928150285452484,0.00438566961666043],"rows":[{"r":1,"epsilon":0.2861276587978796,"energy":-2.818229766000389,"residual":1.014293100151378,"bound":1.961138480959586},{"r":2,"epsilon":6.723336436431377e-05,"energy":-3.426716271052093,"residual":0.03906743608679063,"bound":0.0004608220631769619},{"r":3,"epsilon":1.9234097986498444e-05,"energy":-3.4269139645806597,"residual":0.027748548214925735,"bound":0.00013183181893825684},{"r":4,"epsilon":0.0,"energy":-3.4270340889080795,"residual":2.0470828901012724e-15,"bound":0.0}]},{"g":1,"ground":-4.758770483143635,"top":4.758770483143637,"singular":[0.957934079919117,0.2869150204300599,0.00621339342721249,0.0018610006048215384],"rows":[{"r":1,"epsilon":0.08236229852951416,"energy":-4.4707001773045345,"residual":1.0032048456444964,"bound":0.7838865503322329},{"r":2,"epsilon":4.206958113247351e-05,"energy":-4.758517166265119,"residual":0.03956551518259967,"bound":0.0004003989618628627},{"r":3,"epsilon":3.4633232511461315e-06,"energy":-4.758738518392595,"residual":0.01727721852207194,"bound":3.2962320922278525e-05},{"r":4,"epsilon":0.0,"energy":-4.758770483143633,"residual":1.4884000381564986e-15,"bound":0.0}]},{"g":1.5,"ground":-6.503891557126413,"top":6.503891557126413,"singular":[0.9835285222445086,0.18072670811308317,0.003031916541135232,0.0005571249672581916],"rows":[{"r":1,"epsilon":0.032671645931533114,"energy":-6.3243220758561405,"residual":1.0007372984051934,"bound":0.42498568426304345},{"r":2,"epsilon":9.50290614155187e-06,"energy":-6.503820169064896,"residual":0.02344045964978304,"bound":0.0001236117420444079},{"r":3,"epsilon":3.103882291424411e-07,"energy":-6.503887575398663,"residual":0.00716863198411092,"bound":4.037462765901882e-06},{"r":4,"epsilon":0.0,"energy":-6.50389155712641,"residual":6.768958156951938e-15,"bound":0.0}]},{"g":2,"ground":-8.376798636850364,"top":8.376798636850358,"singular":[0.9913333905453101,0.131360982026929,0.001536149899722367,0.00020355428485779157],"rows":[{"r":1,"epsilon":0.017258108789940465,"energy":-8.246152922557911,"residual":1.00024046553558,"bound":0.289135404372377},{"r":2,"epsilon":2.401190861301005e-06,"energy":-8.376776584952422,"residual":0.014366671801890767,"bound":4.02285846675276e-05},{"r":3,"epsilon":4.1434346883966955e-08,"energy":-8.376797948089191,"residual":0.003389793115127589,"bound":6.941743609927988e-07},{"r":4,"epsilon":0.0,"energy":-8.376798636850364,"residual":3.8940113615561844e-15,"bound":0.0}]}];
for(const fixture of fixtures){
 const H=h(fixture.g);matrix(env.hamiltonian(fixture.g),H,"Full Hamiltonian from independent tensor products");
 const plus=Array(16).fill(.25);near(dot(plus,mv(H,plus)),-3,"Initial product energy");
 for(const ref of fixture.rows){
  const m=lab.calculate(fixture.g,ref.r);
  near(m.ground,fixture.ground,"NumPy ground");near(m.top,fixture.top,"NumPy top");
  for(const key of ["epsilon","energy","residual","bound"])near(m[key],ref[key],"NumPy "+key);
  m.weights.forEach((v,i)=>near(v,fixture.singular[i]**2,"NumPy Schmidt weight"));
  matrix(mul(T(m.A),m.A),Array.from({length:ref.r},(_,i)=>Array.from({length:ref.r},(_,j)=>+(i===j))),"Left canonical tensor");
  matrix(mul(m.A,m.B),Array.from({length:4},(_,i)=>m.phi.slice(4*i,4*i+4)),"Physical reconstruction");
  near(dot(m.phi,m.phi),1,"Normalized physical state");near(dot(m.phi,mv(H,m.phi)),m.energy,"Physical energy");
  near(m.q+m.epsilon,1,"Schmidt sum");near(m.fidelity,1-m.epsilon,"Fidelity identity");
  near(m.distance*m.distance,2-2*Math.sqrt(1-m.epsilon),"Normalized distance");
  near(dot(m.unnormalized.flat().map((x,i)=>x-m.psi[i]),m.unnormalized.flat().map((x,i)=>x-m.psi[i])),m.epsilon,"Unnormalized distance");
  assert.ok(m.gap>=-1e-9&&m.gap<=m.bound+1e-9);checks++;
  const residual=mv(H,m.phi).map((v,i)=>v-m.energy*m.phi[i]);near(dot(m.phi,residual),0,"Rayleigh residual orthogonal");
 }
}
// Analytic singular values, rank deficiency and rectangular matrices exercise split independently of the Ising ground state.
for(const M of [[[.8,0,0],[0,.6,0]],[[.8,0],[0,.6],[0,0]],[[1,0],[0,0]]]){
 for(let r=1;r<=Math.min(M.length,M[0].length);r++){
  const m=lab.split(M,r);near(m.epsilon,r===1?M[1][1]**2:0,"Known rectangular discarded weight");
  matrix(mul(T(m.A),m.A),Array.from({length:r},(_,i)=>Array.from({length:r},(_,j)=>+(i===j))),"Rectangular U orthonormal");
  if(r===Math.min(M.length,M[0].length))matrix(m.unnormalized,M,"Full-rank rectangular reconstruction");
 }
}
assert.ok(lab.calculate(.2,1).energy>-3);checks++;
assert.throws(()=>lab.compute("split",{r:1.5}));assert.throws(()=>lab.compute("split",{g:0}));assert.throws(()=>lab.split([[0,0],[0,0]],1));checks+=3;
console.log(`two-site checks: PASS (${checks}; NumPy references, full-state energies, SVD identities, rectangular/rank-deficient splits)`);
