"use strict";
const assert=require('assert'),s=require('../course-shared/labs/source-coding'),m=require('../course-shared/labs/maxent-channel');let checks=0;
function near(a,b,tol=1e-10){assert(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);checks++;}
// Enumerate binary-tree partitions, independent of the Huffman greedy construction.
function optimal(p){const memo=new Map();function visit(mask){if((mask&(mask-1))===0)return 0;if(memo.has(mask))return memo.get(mask);let best=Infinity,total=0;for(let i=0;i<p.length;i++)if(mask>>i&1)total+=p[i];const first=mask&-mask;for(let a=(mask-1)&mask;a;a=(a-1)&mask)if(a&first)best=Math.min(best,total+visit(a)+visit(mask^a));memo.set(mask,best);return best;}return visit((1<<p.length)-1);}
for(let a=0;a<=10;a++)for(let b=0;b<=10-a;b++)for(let c=0;c<=10-a-b;c++){
 const p=[a,b,c,10-a-b-c].map(v=>v/10),r=s.summarize(p,2),positive=p.filter(x=>x>0);near(r.huffman.averageLength,optimal(positive));near(r.huffman.kraft,1);
 const words=Object.values(r.huffman.codes).filter(x=>x!==null);for(let i=0;i<words.length;i++)for(let j=0;j<words.length;j++)if(i!==j){assert(!words[j].startsWith(words[i]));checks++;}
 near(s.entropy(r.block.probabilities),2*r.entropy);assert(r.block.averageBitsPerSymbol>=r.entropy-1e-10&&r.block.averageBitsPerSymbol<r.entropy+.5);checks++;
 for(let i=0;i<4;i++)for(let j=0;j<4;j++)near(r.block.probabilities[4*i+j],p[i]*p[j]);
}
for(const mean of [0,1e-30,1e-12,.05,.5,1,1.5,2,2.95,3-1e-12,3]){
 const r=m.maxEntropyForMean(mean);near(r.probabilities.reduce((a,b)=>a+b,0),1);near(r.mean,mean);if(mean>0&&mean<1e-10){assert(Math.abs(r.mean/mean-1)<1e-12);checks++;}
 const H=p=>p.reduce((a,v)=>v>0?a-v*Math.log2(v):a,0);
 for(let i=0;i<=40;i++)for(let j=0;j<=40;j++){const p2=i/40,p3=j/40,p1=mean-2*p2-3*p3,p0=1-p1-p2-p3;if(Math.min(p0,p1)<0)continue;const p=[p0,p1,p2,p3];assert(H(p)<=r.entropy+1e-10);checks++;}
 if(mean>0&&mean<3)for(let i=1;i<3;i++)near(r.probabilities[i]**2,r.probabilities[i-1]*r.probabilities[i+1]);
}
for(let i=0;i<=50;i++)for(let j=0;j<=50;j++){
 const q=i/50,e=j/100,r=m.bscStats(q,e),px=[1-q,q],py=[(1-q)*(1-e)+q*e,(1-q)*e+q*(1-e)];let I=0;
 for(let x=0;x<2;x++)for(let y=0;y<2;y++){const p=px[x]*(x===y?1-e:e);if(p>0)I+=p*Math.log2(p/(px[x]*py[y]));}near(r.mutualInformation,I);near(r.capacity,m.bscStats(.5,e).mutualInformation);assert(r.gap>=-1e-12);checks++;
}
assert(m.binaryEntropy(1e-30)>0);checks++;
for(const f of [()=>m.maxEntropyForMean(NaN),()=>m.bscStats(-.1,.1),()=>m.bscStats(.5,.7)]){assert.throws(f);checks++;}
const p=[.4,.2,.2,.1,.1],names=['A','B','C','D','E'];for(const lengths of [[1,3,3,3,3],[2,2,2,3,3]]){near(lengths.reduce((a,l,i)=>a+p[i]*l,0),optimal(p));near(lengths.reduce((a,l)=>a+2**(-l),0),1);}
console.log(`Information independent checks: ${checks} PASS`);
