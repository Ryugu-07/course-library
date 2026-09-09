const assert=require('assert'),fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..'),c=require(root+'/course-shared/labs/linear-conditioning.js');
let checks=0;function ok(v,msg){checks++;assert(v,msg)}function close(a,b,label,tol=2e-13){ok(Number.isFinite(a)&&Number.isFinite(b),label+' finite');ok(b===0?a===0:Math.abs((a-b)/b)<=tol,label+' '+a+' vs '+b)}
const fixture=JSON.parse(fs.readFileSync(root+'/tools/fixtures/linear-conditioning-reference.json'));
for(const r of fixture.rows){const d=c.compute(r.spec),v=r.values;
 for(const[k,x]of Object.entries({sigmaMin:d.spectrum.sigmaMin,sigmaMax:d.spectrum.sigmaMax,kappa:d.spectrum.kappa,bNorm:d.bNorm,forward:d.forwardError,gain:d.directionGain,rho:d.rawRelativeResidual,backward:d.backwardError}))close(x,v[k],k);
 for(let j=0;j<2;j++){close(d.deltaB[j],r.deltaB[j],'deltaB');close(d.deltaX[j],r.deltaX[j],'deltaX')}
 ok(d.forwardError<=d.conditionBound*(1+2e-14),'model condition bound');close(d.exactForward,d.forwardError,'independent identity');
 ok(d.inputRoundingLoss>=0,'input rounding loss');ok(d.actualX.every(Number.isFinite),'actual solve finite');
 const denom=d.spectrum.sigmaMax*Math.hypot(...d.actualX)+d.bNorm;
 ok(d.actualSolveResidual<=denom*2e-15,'floating solve residual bound');
}
for(const theta of [0,1e-20,1e-12,1e-8,2,90]){const v=c.singularValues(theta);if(theta)close(v.kappa,1/Math.tan(theta*Math.PI/360),'stable halfangle spectrum',1e-14);else ok(v.kappa===Infinity,'zero angle singular')}
for(const spec of [null,[],{thetaDeg:0},{thetaDeg:1e-13},{thetaDeg:91},{thetaDeg:'5'},{perturbation:null},{perturbation:'0.01'},{direction:'bad'},{xMode:'bad'},{xScale:0},{xScale:Infinity},{xScale:1e101}]){assert.throws(()=>c.compute(spec));checks++}
for(const scale of [1e-200,1e-100,1,1e100,1e200]){const x=c.solve2x2([[scale,0],[0,scale]],[scale,2*scale]);close(x[0],1,'scaled invertible matrix');close(x[1],2,'scaled invertible matrix')}
for(const a of [[[0,0],[0,0]],[[1,1],[2,2]],[[1,NaN],[0,1]]]){assert.throws(()=>c.solve2x2(a,[1,1]));checks++}
ok(Object.isFrozen(c.DEFAULT)&&Object.isFrozen(c.PRESETS)&&c.PRESETS.every(Object.isFrozen),'immutable presets');
const tiny=c.compute({perturbation:1e-18});ok(tiny.forwardError>0&&tiny.actualForwardError===0&&tiny.inputRoundingLoss===1,'tiny requested perturbation lost in actual input');
// Exercise exported geometry with a minimal DOM; all world mappings are verified independently.
ok(typeof c.drawGeometry==='function','geometry exported for verification');
if(c.drawGeometry){
 class N{constructor(tag,doc){this.tag=tag;this.ownerDocument=doc;this.nodeType=1;this.attrs={};this.children=[]}setAttribute(k,v){this.attrs[k]=String(v)}appendChild(n){this.children.push(n);return n}get firstChild(){return this.children[0]}removeChild(n){this.children.splice(this.children.indexOf(n),1)}}
 const doc={createElementNS:(ns,t)=>new N(t,doc),createTextNode:text=>({text,nodeType:3})};
 for(const thetaDeg of [2,5,45,90])for(const perturbation of [0,1e-18,.01,.1])for(const direction of ['min','max']){
  const d=c.compute({thetaDeg,perturbation,direction}),svg=new N('svg',doc);c.drawGeometry(doc,svg,d,'independent');const scale=+svg.attrs['data-world-scale'],minX=+svg.attrs['data-world-min-x'],minY=+svg.attrs['data-world-min-y'];const pts=svg.children.filter(n=>n.tag==='circle');
  for(let j=0;j<2;j++){const w=j?d.xHat:d.xTrue;close(+pts[j].attrs.cx,58+(w[0]-minX)*scale,'true plotted point');close(+pts[j].attrs.cy,298-(w[1]-minY)*scale,'true plotted point')}
  ok(scale>0&&Number.isFinite(scale),'uniform geometry scale');
 }
}
const staticSvg=fs.readFileSync(root+'/math-course/images/num-02-condition.svg','utf8');
function attrs(text){return Object.fromEntries([...text.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]))}
let groups=0;for(const match of staticSvg.matchAll(/<g (data-angle="[^"]+"[^>]*)>([\s\S]*?)<\/g>/g)){
 const g=attrs(match[1]),d=c.compute({thetaDeg:+g['data-angle'],direction:g['data-direction']}),sc=+g['data-scale'],cx=+g['data-cx'],cy=+g['data-cy'];groups++;
 const lines=[...match[2].matchAll(/<line [^>]*data-a="[^"]*"[^>]*\/>/g)].map(m=>attrs(m[0]));
 ok(lines.length===4,'four exact equation segments');
 for(let j=0;j<4;j++){const a=lines[j],row=j%2,rhs=j<2?d.b[row]:d.bPerturbed[row];close(+a['data-a'],d.A[row][0],'line coefficient a');close(+a['data-b'],d.A[row][1],'line coefficient b');close(+a['data-rhs'],rhs,'line rhs');
  for(const q of ['1','2']){const x=.5+(+a['x'+q]-cx)/sc,y=(cy-+a['y'+q])/sc;ok(Math.abs(d.A[row][0]*x+d.A[row][1]*y-rhs)<=2e-14,'static line actually satisfies equation');ok(x>=-.65-1e-12&&x<=1.65+1e-12&&y>=-.7-1e-12&&y<=.7+1e-12,'bounded static segments')}
 }
 const pts=[...match[2].matchAll(/<circle data-point="[^"]+"[^>]*\/>/g)].map(m=>attrs(m[0]));ok(pts.length===2,'two exact intersections');
 for(const a of pts){const w=a['data-point']==='true'?d.xTrue:d.xHat;close(+a.cx,cx+sc*(w[0]-.5),'static intersection x');close(+a.cy,cy-sc*w[1],'static intersection y')}
}
ok(groups===3,'all static panels verified');
console.log('Linear conditioning independent PASS',{checks,cases:fixture.rows.length,self:c.selfTest()});
