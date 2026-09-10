"""Decimal entropy/KL reference, strict domains, full chart coordinates."""
from pathlib import Path
from decimal import Decimal as D, localcontext
import json, math, shutil, subprocess, xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
JS=r"""
const c=require('./course-shared/labs/information-processing.js'),assert=require('assert');
const cases=[], entropies=[], kls=[], plots=[];
for(let a=0;a<=50;a++)for(let b=0;b<=50;b++)cases.push(c.summarize(a/100,b/100));
const edges=[0,Number.MIN_VALUE,1e-300,1e-20,1e-10,.1,.25,.4999,.49999999999999994,.5];
for(const a of edges)for(const b of edges)cases.push(c.summarize(a,b));
for(const p of [...edges,...edges.map(x=>1-x),...Array.from({length:101},(_,i)=>i/100)])
entropies.push({p,value:c.h2(p)});
for(const p of edges)for(const q of edges)kls.push({p:[1-p,p],q:[1-q,q],value:c.kl([1-p,p],[1-q,q])});
for(const [p,q]of[[[1,0],[0,1]],[[.25,.25,.5],[.5,.25,.25]],[[0,.5,.5],[.25,.25,.5]],[[.5000000000000001,.4999999999999999],[.5,.5]],[[.2,.3,.5],[.3,.3,.4]],[[1e-300,1],[1e-299,1]]])
kls.push({p,q,value:c.kl(p,q)});
class Node{
constructor(tag){this.tag=tag;this.attrs={};this.children=[];}
setAttribute(k,v){this.attrs[k]=String(v);}appendChild(n){this.children.push(n);}
get firstChild(){return this.children[0];}removeChild(n){this.children.splice(this.children.indexOf(n),1);}
}
const doc={createElementNS:(_,tag)=>new Node(tag),createTextNode:s=>String(s)};
for(const p of c.PRESETS){const svg=new Node('svg'),data=c.summarize(p.eta,p.rho);c.drawChart(doc,svg,data,'test');plots.push({p,data,svg});}
let strict=0;function reject(f){assert.throws(f);strict++;}
for(const bad of [null,'0',NaN,Infinity,-.1,.5001]){reject(()=>c.summarize(bad,.1));reject(()=>c.summarize(.1,bad));}
for(const [p,q]of[[[],[]],[[1],[1,0]],[[1,0],[0,NaN]],[[1,0],[0,-1]],[[1,0],[0,2]],[[.2,.2],[.5,.5]],[[1],[.999]],[[1],null],[Array(257).fill(1/257),Array(257).fill(1/257)]])reject(()=>c.kl(p,q));
assert(c.format(1e-15)!=='0');assert(c.format(10)==='10');assert(c.format(0)==='0');
console.log(JSON.stringify({cases,entropies,kls,plots,strict,self:c.selfTest()},(k,v)=>typeof v==='number'&&!isFinite(v)?String(v):v));
"""
data=json.loads(subprocess.check_output((['rtk','proxy'] if shutil.which('rtk') else [])+['node','-e',JS],cwd=ROOT,text=True))
checks=0
def ok(v,msg):
    global checks
    checks+=1
    if not v:raise AssertionError(msg)
def dec(x):return D.from_float(float(x))
def near(a,b,rtol=4e-14,atol=1e-323):
    a=float(a);b=float(b)
    ok(a==b or (math.isfinite(a) and math.isfinite(b) and abs(a-b)<=max(atol,rtol*abs(b))),f'{a} vs {b}')
def entropy(p):
    p=min(p,1-p)
    if p==0:return D(0)
    complement=p-p*p/2 if p<D('1e-50') else -(1-p)*(1-p).ln()
    return (-p*p.ln()+complement)/D(2).ln()
def divergence(p,q):
    p=[dec(x)for x in p];q=[dec(x)for x in q]
    a=sum(p);b=sum(q);p=[x/a for x in p];q=[x/b for x in q]
    if any(x>0 and y==0 for x,y in zip(p,q)):return D('Infinity')
    # A direct signed log-ratio sum at high precision, unlike runtime f-divergence.
    return sum(x*(x/y).ln()for x,y in zip(p,q)if x)/D(2).ln()
with localcontext() as ctx:
    ctx.prec=110
    for r in data['cases']:
        a,b=dec(r['eta']),dec(r['rho']);t=a+b-2*a*b
        for key,value in [('tau',t),('hEta',entropy(a)),('hTau',entropy(t)),('iXY',1-entropy(a)),('iXZ',1-entropy(t))]:
            near(r[key],value)
        near(r['biasY'],1-2*a);near(r['biasZ'],(1-2*a)*(1-2*b))
        ok(r['dpiEquality']==(a==D('.5')or b==0),'exact equality condition')
        ok(0<=r['iXZ']<=r['iXY']<=1,'DPI and bounds')
        for noise,key in [(a,'inputConditionalKL'),(t,'outputConditionalKL')]:
            expected=D('Infinity')if noise==0 else (1-2*noise)*((1-noise).ln()-noise.ln())/D(2).ln()
            near(r[key],expected)
        for rows,total in [(r['yMiRows'],r['iXY']),(r['zMiRows'],r['iXZ'])]:
            ok(len(rows)==2,'both MI rows')
            near(sum(x['contribution']for x in rows),total)
            for row in rows:near(row['contribution'],row['kl']/2);near(sum(row['row']),1)
    for r in data['entropies']:near(r['value'],entropy(dec(r['p'])))
    ctx.prec=400  # Normalize 1 + a subnormal tail without dropping that tail.
    for r in data['kls']:
        # The public API normalizes tiny permitted mass roundoff. Ordinary
        # multinomial rows get an absolute rounding allowance; exact binary
        # near-equal two-entry rows are checked relatively with no such floor.
        ref=divergence(r['p'],r['q'])
        near(r['value'],ref,atol=2e-15 if len(r['p'])>2 else 1e-323,rtol=3e-13)
    ctx.prec=110
    def walk(n):
        if isinstance(n,str):return
        yield n
        for c in n['children']:yield from walk(c)
    for r in data['plots']:
        nodes=list(walk(r['svg']))
        bars=[n for n in nodes if n['tag']=='rect']
        ok(len(bars)==2,'both un-clipped bars')
        for j,n in enumerate(bars):
            v=r['data'][['iXY','iXZ'][j]];attrs=n['attrs']
            near(attrs['x'],[156,346][j]);near(attrs['width'],96)
            near(attrs['height'],210*v);near(attrs['y'],248-210*v,atol=1e-12)
        grids=[n for n in nodes if n['attrs'].get('class')=='ip-grid']
        ok(len(grids)==5,'all fixed-axis ticks')
        for j,n in enumerate(grids):
            for k,v in dict(x1=72,x2=502,y1=248-j*52.5,y2=248-j*52.5).items():near(n['attrs'][k],v)
    root=ET.parse(ROOT/'math-course/images/info-02-information-ledger.svg')
    for n in root.iter():
        if n.get('data-default')is not None:
            eta=D('.1');rho=D('.2');t=eta if n.get('data-default')=='0'else eta+rho-2*eta*rho;v=1-entropy(t)
            near(n.get('data-value'),v);near(n.get('width'),600*v);near(n.get('x'),200)
        if n.get('data-rare')is not None:
            eta=D('.4999');t=eta if n.get('data-rare')=='0'else 2*eta-2*eta*eta;v=1-entropy(t)
            near(n.get('data-value'),v);near(n.get('cx'),200+650*(float(v.log10())+16)/16,atol=1e-10)
source=(ROOT/'course-shared/labs/information-processing.js').read_bytes()
for course in ['math-course','grad-math','ai-course']:
    ok((ROOT/course/'site/assets/learning/labs/information-processing.js').read_bytes()==source,'tracked mirror')
print(f'Information processing reference PASS: {checks} checks, {len(data["cases"])} BSC cases, {len(data["entropies"])} entropies, {len(data["kls"])} KL pairs, {len(data["plots"])} plots, {data["strict"]} strict failures, {data["self"]["checks"]} self-checks')
