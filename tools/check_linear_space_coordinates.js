"use strict";
const assert=require('assert'),fs=require('fs'),path=require('path'),lab=require('../course-shared/labs/linear-space-coordinates.js'),reference=require('./fixtures/linear-coordinate-reference.json');
let checks=0;
function check(ok,message){checks++;assert(ok,message);}
function close(a,b,message){check(Math.abs(a-b)<1e-11,message);}
function relative(a,b,message){check(a===b||Math.abs(a-b)<=3e-14*Math.max(Math.abs(a),Math.abs(b)),`${message}: ${a} vs ${b}`);}
function combine(vectors,coeffs){return[0,1].map(j=>vectors.reduce((sum,v,i)=>sum+v[j]*coeffs[i],0));}
for(const fixture of reference.generic){check(lab.matrixRank(fixture.matrix)===fixture.rank,'Fraction rank');const a=fixture.matrix.map(row=>row[0]),b=fixture.matrix.map(row=>row[1]);for(const item of fixture.answers){if(item.coordinates==='unrepresentable'){checks++;assert.throws(()=>lab.solve2(a,b,item.target),RangeError);}else if(item.coordinates===null)check(lab.solve2(a,b,item.target)===null,'singular coordinate basis');else lab.solve2(a,b,item.target).forEach((v,i)=>relative(v,item.coordinates[i],'Fraction Cramer coordinates'));}}
for(const row of reference.near){const data=lab.analyze({presetId:'parameter',...row});check(data.basis&&data.rank===2,'near two remains a basis');data.coordinates.forEach((v,i)=>relative(v,row.coordinates[i],'near singular Fraction solution'));relative(data.condition,row.condition,'100 digit independent SVD condition');}
for(const presetId of ['parameter','redundant','collinear'])for(let ti=-8;ti<=16;ti++)for(const px of [-8,-3,0,3,8])for(const py of [-8,-3,0,3,8]){
 const t=ti/4,d=lab.analyze({presetId,t,px,py}),n=d.vectors.length,r=presetId==='redundant'?2:presetId==='collinear'||t===2?1:2;
 check(d.rank===r&&d.nullity===n-r,'dimension and relation dimension');check(d.spans===(r===2)&&d.independent===(r===n)&&d.basis===(r===2&&r===n),'span independent basis distinction');
 check(d.inSpan===(r===2||px===py),'target membership');check(d.relations.length===n-r,'complete relation basis dimension');
 d.relations.forEach(z=>combine(d.vectors,z).forEach(v=>close(v,0,'relation annihilates columns')));
 if(d.inSpan){check(d.particular!==null,'solution exists');combine(d.vectors,d.particular).forEach((v,i)=>close(v,[px,py][i],'particular solves target'));for(const coefficient of [-3,.5,4])for(const z of d.relations){const c=d.particular.map((v,i)=>v+coefficient*z[i]);combine(d.vectors,c).forEach((v,i)=>close(v,[px,py][i],'affine family solves same target'));}check(d.representation===(n-r?'无穷多种表示':'唯一表示'),'uniqueness from nullity');}
 else check(d.particular===null&&d.reconstructed===null&&d.residual===null&&d.representation==='无表示','inconsistent is not merely nonunique');
 if(presetId==='parameter')close(lab.determinant2(d.vectors[0],d.vectors[1]),t-2,'determinant sign and singular point');
 if(presetId==='redundant'){check(d.coordinates[0]===px&&d.coordinates[1]===py,'first two form coordinate basis');check(!d.basis&&d.spans,'full three columns not a basis');}
}
check(lab.determinant2([1,1],[2,3])===1,'t three determinant is positive one');
check(lab.analyze({presetId:'parameter',t:2,px:3,py:3}).representation==='无穷多种表示','singular but consistent target');
for(const name of ['t','px','py'])for(const value of [NaN,Infinity,-Infinity,null,'1',99,-99]){checks++;assert.throws(()=>lab.analyze({[name]:value}),RangeError);}
for(const bad of [null,2,'parameter']){checks++;assert.throws(()=>lab.analyze(bad),TypeError);}
for(const bad of [[],Array(2),[[],[]],[[1,2],[1]],[[1,0],[0,null]],[Array(65).fill(0),Array(65).fill(0)]]){checks++;assert.throws(()=>lab.matrixRank(bad));}
check(lab.formatNumber(12000,0)==='12000','integer trailing zeros');check(lab.formatNumber(1e-20)!=='0','tiny nonzero display');
// Derivative in two polynomial bases and dual coefficient evaluations.
const mul=(a,b)=>a.map(row=>b[0].map((_,j)=>row.reduce((v,c,k)=>v+c*b[k][j],0)));
const D=[[0,1,0],[0,0,2],[0,0,0]],T=[[1,0,0],[0,1,0],[0,0,.5]],Ti=[[1,0,0],[0,1,0],[0,0,2]],C=mul(Ti,mul(D,T));
check(JSON.stringify(C)===JSON.stringify([[0,1,0],[0,0,1],[0,0,0]]),'divided power derivative matrix');check(mul(C,mul(C,C)).flat().every(v=>v===0)&&C[0][1]===1,'nilpotent not zero');
for(let k=3;k<=6;k++){const v1=new Set([1,2,3,4,5,6]),v2=new Set([...Array.from({length:k},(_,i)=>i+1),...Array.from({length:7-k},(_,i)=>i+7)]);check(v2.size===7&&[...v2].filter(i=>v1.has(i)).length===k,'every integer intersection dimension realized');}
const lecture=fs.readFileSync(path.join(__dirname,'../math-course/lectures/algebra-04-linear-space.md'),'utf8');check(!/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(lecture),'no control damage');for(const inline of lecture.replace(/\$\$[\s\S]*?\$\$/g,'').matchAll(/(?<![\\$])\$(?!\$)([\s\S]*?)(?<!\\)\$(?!\$)/g))check(!inline[1].includes('\n'),'inline TeX remains intact');
const svg=fs.readFileSync(path.join(__dirname,'../math-course/images/algebra-04-linear-map.svg'),'utf8');const point=[...svg.matchAll(/<circle cx="([\d.]+)" cy="([\d.]+)" r="6" fill="#be123c"/g)];check(point.length===1,'one fixed target');close((Number(point[0][1])-70)/70,3,'static target x');close((325-Number(point[0][2]))/70,2,'static target y');
for(const [color,expected]of [['#1d4ed8',[1,1]],['#b45309',[2,0]]]){const re=new RegExp('<circle cx="([0-9.]+)" cy="([0-9.]+)" r="5" fill="'+color+'"'),m=svg.match(re);check(!!m,'static basis endpoint');close((Number(m[1])-70)/70,expected[0],'basis x');close((325-Number(m[2]))/70,expected[1],'basis y');}
const decomposition=svg.match(/<path d="M([0-9.]+) ([0-9.]+)L([0-9.]+) ([0-9.]+)L([0-9.]+) ([0-9.]+)" stroke="#15803d"/);check(!!decomposition,'decomposition path');[[0,0],[2,2],[3,2]].forEach((v,i)=>{close((Number(decomposition[1+2*i])-70)/70,v[0],'decomposition x');close((325-Number(decomposition[2+2*i]))/70,v[1],'decomposition y');});
check(!/^\+(?:$|\*\*)/m.test(lecture),'no prose patch-prefix residue');
console.log(`linear space coordinates: PASS (${checks} independent checks; ${lab.selfTest().checks} self-tests)`);
