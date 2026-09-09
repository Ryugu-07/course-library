"use strict";
const assert=require("assert"),lab=require("../course-shared/labs/matrix-transformations.js"),fixtures=require("./fixtures/matrix-exact-reference.json");
let checks=0;
function check(ok,message){checks++;assert(ok,message);}
function relative(a,b,message){check(a===b||Math.abs(a-b)<=2e-14*Math.max(Math.abs(a),Math.abs(b)),`${message}: ${a} != ${b}`);}
function close(a,b,message){check(Math.abs(a-b)<2e-12,message);}
function mul(a,b){return a.map(row=>b[0].map((_,j)=>row.reduce((sum,v,k)=>sum+v*b[k][j],0)));}
function mv(a,v){return a.map(row=>row.reduce((sum,x,i)=>sum+x*v[i],0));}
function eq(a,b,message){a.flat().forEach((v,i)=>close(v,b.flat()[i],message));}
for(const item of fixtures.cases){
 check(lab.rank(item.matrix)===item.rank,"exact Fraction rank");
 if(item.determinant==='overflow'){checks++;assert.throws(()=>lab.determinant(item.matrix),RangeError);}
 else relative(lab.determinant(item.matrix),item.determinant,"exact Fraction determinant converted to double");
 if(item.inverse==='unrepresentable'){checks++;assert.throws(()=>lab.inverse(item.matrix),RangeError);}
 else if(item.inverse===null)check(lab.inverse(item.matrix)===null,"exact singular inverse");
 else lab.inverse(item.matrix).flat().forEach((v,i)=>relative(v,item.inverse.flat()[i],"exact Fraction inverse rounded"));
}
const maps={projection:[[1,0],[0,0]],shear:[[1,.8],[0,1]],scale:[[1.5,0],[0,.5]],swap:[[0,1],[1,0]]};
for(const a of Object.keys(maps))for(const b of Object.keys(maps))for(const x of [-2,0,1,2])for(const y of [-2,0,1,2])for(const t of [-1,0,1])for(const l of [-1,0,1])for(const r of [-1,0,1]){
 const d=lab.evaluate({a,b,x,y,basis:t,left:l,right:r}),A=maps[a],B=maps[b],T=[[1,t],[0,1]],Ti=[[1,-t],[0,1]],L=[[1,0],[l,1]],R=[[1,r],[0,1]];
 eq(d.AB,mul(A,B),"composition AB");eq(d.BA,mul(B,A),"composition BA");
 eq([d.ABx.x,d.ABx.y],mv(mul(A,B),[x,y]),"AB action");eq([d.BAx.x,d.BAx.y],mv(mul(B,A),[x,y]),"BA action");
 eq(d.coordinateA,mul(Ti,mul(A,T)),"similarity");eq(d.LAR,mul(L,mul(A,R)),"left/right operation order");
 eq([d.newInput.x,d.newInput.y],[x-t*y,y],"input new coordinates");eq([d.restoredOutput.x,d.restoredOutput.y],mv(A,[x,y]),"same physical output");
 check(d.rankA===(a==='projection'?1:2)&&d.rankLAR===d.rankA,"structural rank preserved");
 check(d.commute===(JSON.stringify(mul(A,B))===JSON.stringify(mul(B,A))),"matrix equality independent of input vector");
 if(a==='projection'){
  eq(mv(d.LAR,[-r,1]),[0,0],"pulled-back kernel direction");eq(mv(d.LAR,[1,0]),[1,l],"pushed-forward image generator");
  check(d.kernelLAR.includes('span{(')&&d.imageLAR.includes('span{('),"span contains one vector, not two scalars");
 }
}
const coincidence=lab.evaluate({...lab.DEFAULTS,x:1,y:0});check(!coincidence.commute&&coincidence.ABx.x===coincidence.BAx.x&&coincidence.ABx.y===coincidence.BAx.y,"one matching trajectory cannot prove commuting matrices");
for(const key of ['x','y','basis','left','right'])for(const value of [null,'1',undefined,NaN,Infinity,-Infinity,3,-3]){checks++;assert.throws(()=>lab.evaluate({...lab.DEFAULTS,[key]:value}),RangeError);}
for(const bad of [[],Array(2),[[1,0],[0]],[[1,0],[0,null]],[[1,0],[0,Infinity]]])for(const name of ['rank','determinant','inverse']){checks++;assert.throws(()=>lab[name](bad));}
check(lab.format(12000,0)==='12000','integer zeros preserved');check(lab.format(1e-20)!=='0','tiny displayed number nonzero');
// Textbook identities with exact small integer/rational coefficients.
const A3=[[1,2,3],[2,5,3],[1,0,8]],inv3=[[-40,16,9],[13,-5,-3],[5,-2,-1]];eq(mul(A3,inv3),[[1,0,0],[0,1,0],[0,0,1]],'textbook inverse');
const D=[[2,1],[1,1]],C=[[1,0],[2,-1]],B=[[1,2],[0,1]],Z=[[0,0],[0,0]];
const Di=[[1,-1],[-1,2]],Bi=[[1,-2],[0,1]],blockInverse=[...Di.map(row=>[...row,0,0]),...mul(mul(Bi,C),Di).map((row,i)=>[...row.map(v=>-v),...Bi[i]])];
const block=[...D.map(row=>[...row,0,0]),...C.map((row,i)=>[...row,...B[i]])];eq(mul(block,blockInverse),[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]],'ordered block inverse');
const fs=require('fs'),path=require('path'),lecture=fs.readFileSync(path.join(__dirname,'../math-course/lectures/algebra-03-matrix.md'),'utf8');
check(!/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(lecture),'no escaped control character damage');
for(const inline of lecture.replace(/\$\$[\s\S]*?\$\$/g,'').matchAll(/(?<![\\$])\$(?!\$)([\s\S]*?)(?<!\\)\$(?!\$)/g))check(!inline[1].includes('\n'),'inline mathematics remains intact');
const svg=fs.readFileSync(path.join(__dirname,'../math-course/images/algebra-03-kernel-image.svg'),'utf8');
const marked=[...svg.matchAll(/<circle cx="([\d.]+)" cy="([\d.]+)" r="5" fill="#7c3aed"/g)];
check(marked.length===2,'two static generating vectors');
marked.forEach((m,i)=>{const x=(Number(m[1])-(200+400*i))/76,y=(226-Number(m[2]))/76;eq([x,y],i?[1,.5]:[.5,1],'static generator coordinates');});
const directions=[...svg.matchAll(/<path d="M([\d.]+) ([\d.]+)L([\d.]+) ([\d.]+)" stroke="#7c3aed"/g)];
check(directions.length===2,'two transformed subspace lines');
directions.forEach((m,i)=>{const dx=Number(m[3])-Number(m[1]),dy=Number(m[2])-Number(m[4]);close(dy/dx,i?.5:2,'static subspace slope');});
console.log(`matrix transformations: PASS (${checks} independent checks; ${lab.selfTest().checks} self-tests)`);
