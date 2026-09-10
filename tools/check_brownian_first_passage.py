"""Independent erfc/Decimal formulas, uint32 replay, bridge identities and SVG geometry."""
from pathlib import Path
from decimal import Decimal as D, localcontext
from fractions import Fraction as F
import json, math, re, shutil, subprocess, xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
PI=D('3.141592653589793238462643383279502884197169399375105820974944592307816406286208998628034825342117067982148086513282306647')
JS=r"""
const c=require('./course-shared/labs/brownian-first-passage.js'),assert=require('assert'),cases=[],normal=[],paths=[],plots=[],bridges=[];
for(let ia=-10;ia<=30;ia++)for(let it=0;it<=40;it++)cases.push(c.analyze(ia/10,it/20));
for(const a of [Number.MIN_VALUE,1e-162,1e-150,1,1e150,1e300])for(const T of [Number.MIN_VALUE,1e-300,1,1e300])cases.push(c.analyze(a,T));
for(let i=-390;i<=390;i++)normal.push({z:i/10,p:c.normalTail(i/10),log:c.normalLogTail(i/10),cdf:c.normalCdf(i/10)});
for(const z of [1e-300,Math.sqrt(3)-1e-14,Math.sqrt(3),Math.sqrt(3)+1e-14,40,100,1000])normal.push({z,p:c.normalTail(z),log:c.normalLogTail(z),cdf:c.normalCdf(z)});
for(const seed of [0,20260722,31415926,27182818,4294967295])for(const T of [0,.05,1,2,1e-300])for(const steps of [16,128]){
 paths.push(c.samplePath(seed,T,steps,1));
}
class N{constructor(tag,attrs,children){this.tag=tag;this.attrs={};for(const[k,v]of Object.entries(attrs||{}))this.attrs[k==='className'?'class':k]=v;this.children=(Array.isArray(children)?children:children===undefined?[]:[children]).map(v=>typeof v==='string'?new N('#text',{text:v}):v);}}
const api={svg:(t,a,ch)=>new N(t,a,ch)};
for(const [a,T]of [[1,1],[0,1],[-.5,1],[1,0],[0,0],[3,.05],[3,2],[-1,2]]){
 plots.push({a,T,svg:c.drawChart(api,null,a,T,'t'),samples:c.PATH_SEEDS.map(seed=>c.samplePath(seed,T,128,a))});
}
for(const a of [0,.1,1,3])for(const x of [-1,0,.5,2])for(const y of [-1,0,.5,2])for(const dt of [.05,.5,1,2])bridges.push({a,x,y,dt,p:c.bridgeCrossing(a,x,y,dt)});
let strict=0;function reject(f){assert.throws(f);strict++}
for(const bad of [null,'1',NaN,Infinity,-1,.5,4294967296])reject(()=>c.makeRng(bad));
for(const bad of [0,1,-1,NaN,Infinity,'0.5',null])reject(()=>c.gaussian(()=>bad));
for(const bad of [null,'1',NaN]){reject(()=>c.normalTail(bad));reject(()=>c.normalCdf(bad));reject(()=>c.erf(bad));}
for(const bad of [null,'1',NaN,Infinity])reject(()=>c.analyze(bad,1));
for(const bad of [null,'1',NaN,Infinity,-1])reject(()=>c.analyze(1,bad));
for(const bad of [0,-1,1.5,1025,NaN,'16'])reject(()=>c.samplePath(1,1,bad,1));
reject(()=>c.samplePath(1,Number.MIN_VALUE,128,1));reject(()=>c.samplePath(1,Number.MIN_VALUE*77,128,1));
assert.equal(c.samplePath(1,0,128,0).firstDiscreteIndex,0);
assert.equal(c.samplePath(1,1,128,-1).firstDiscreteIndex,0);
assert.equal(c.formatNumber({format:()=> '0'},1e-40), '1.00000e-40');
assert.equal(c.formatNumber(null,10,0),'10');assert.equal(c.formatNumber(null,1,2),'1');
console.log(JSON.stringify({cases,normal,paths,plots,bridges,strict,self:c.selfTest()},(k,v)=>typeof v==='number'&&!Number.isFinite(v)?String(v):v));
"""
data=json.loads(subprocess.check_output((['rtk','proxy']if shutil.which('rtk')else[])+['node','-e',JS],cwd=ROOT,text=True))
checks=0;draws=0
def ok(v,msg):
    global checks
    checks+=1
    if not v:raise AssertionError(msg)
def near(a,b,rtol=1e-12,atol=5e-324):
    a=float(a);b=float(b)
    ok(a==b or (math.isfinite(a)and math.isfinite(b)and abs(a-b)<=max(rtol*abs(b),atol)),f'{a} versus {b}')
def exactfloat(v):return D.from_float(float(v))
def logtail(z):
    if z<0:return D(str(math.log(.5*math.erfc(z/math.sqrt(2)))))
    if z<20:return D(str(math.log(.5*math.erfc(z/math.sqrt(2)))))
    # Avoid taking a log after erfc has rounded a subnormal value.
    # Repeated integration by parts gives alternating Mills bounds; at z>=20, 30 terms suffice.
    z=exactfloat(z);term=D(1);series=term
    for k in range(1,31):term*=-(2*k-1)/(z*z);series+=term
    return -z*z/2-(2*PI).ln()/2-z.ln()+series.ln()
def uniforms(seed):
    state=seed;mask=2**32-1
    while True:
        state=(state+1831565813)&mask
        v=((state^(state>>15))*(1|state))&mask
        v=((v+((v^(v>>7))*(61|v)&mask))^v)&mask
        yield ((v^(v>>14))+.5)/2**32
def cos_decimal(x):
    term=D(1);total=term
    for k in range(1,140):
        term*=-(x*x)/D((2*k-1)*(2*k));total+=term
        if abs(term)<D('1e-110'):break
    return total
def replay(seed,T,n):
    global draws
    rng=uniforms(seed);scale=(exactfloat(T)/D(n)).sqrt();v=D(0);points=[v]
    for i in range(n):
        u,w=next(rng),next(rng);draws+=2
        g=(-2*exactfloat(u).ln()).sqrt()*cos_decimal(2*PI*exactfloat(w))
        v+=scale*g;points.append(v)
    return points
with localcontext()as ctx:
    ctx.prec=120
    for r in data['normal']:
        z=r['z'];p=.5*math.erfc(z/math.sqrt(2))
        near(r['p'],p,rtol=7e-13);near(r['cdf'],.5*math.erfc(-z/math.sqrt(2)),rtol=7e-13)
        near(r['log'],logtail(z),rtol=5e-14,atol=4e-14)
    for r in data['cases']:
        a,T=float(r['a']),float(r['T'])
        if T==0:
            ok(r['endpoint']==r['maximum']==r['firstPassageCdf']==int(a<=0),'zero time probabilities')
        else:
            z=a/math.sqrt(T);endpoint=.5*math.erfc(z/math.sqrt(2))
            maximum=1 if a<=0 else math.erfc(z/math.sqrt(2))
            near(r['endpoint'],endpoint,rtol=8e-13);near(r['maximum'],maximum,rtol=8e-13)
            near(r['firstPassageCdf'],maximum,rtol=8e-13)
        if a<=0:ok(r['firstPassageDensity']is None and r['logDensity']is None,'atom has no ordinary density')
        elif T==0:ok(r['firstPassageDensity']==0 and r['logDensity']=='-Infinity','right density limit')
        else:
            da,dt=exactfloat(a),exactfloat(T)
            ld=da.ln()-(2*PI).ln()/2-D('1.5')*dt.ln()-da*da/(2*dt)
            if abs(ld)>D('1.7976931348623157e308'):ok(r['logDensity']=='-Infinity','unrepresentable log density')
            else:near(r['logDensity'],ld,rtol=7e-13,atol=1e-12)
            # Decimal exp at absurdly negative values is unnecessary; binary64 necessarily rounds to zero.
            value=D(0)if ld<-800 else D('Infinity')if ld>710 else ld.exp()
            near(r['firstPassageDensity'],value,rtol=3e-12)
    for r in data['bridges']:
        a,x,y,dt=map(exactfloat,[r[k]for k in ['a','x','y','dt']])
        ref=D(1)if x>=a or y>=a else (-2*(a-x)*(a-y)/dt).exp()
        near(r['p'],ref,rtol=3e-13)
    for r in data['paths']+[s for p in data['plots']for s in p['samples']]:
        values=replay(r['seed'],r['T'],r['steps']);T=float(r['T']);n=r['steps']
        scale=math.sqrt(T)or 1
        ok(len(r['path'])==n+1,'complete grid')
        for i,(point,v)in enumerate(zip(r['path'],values)):
            near(point['t'],T*(i/n));near(point['value'],v,rtol=8e-13,atol=scale*5e-14)
        near(r['endpoint'],values[-1],atol=scale*5e-14);near(r['max'],max(values),atol=scale*5e-14)
        first=next((i for i,v in enumerate(values)if v>=exactfloat(r['a'])),None)
        ok(r['firstDiscreteIndex']==first,'first grid passage includes time zero')
        if first is not None:near(r['bridgeCrossing'],1)
        elif T==0:near(r['bridgeCrossing'],0)
        else:
            dt=exactfloat(T)/D(n);a=exactfloat(r['a']);no=D(1)
            for x,y in zip(values,values[1:]):
                exponent=-2*(a-x)*(a-y)/dt
                no*=1-(D(0) if exponent < -1000 else exponent.exp())
            near(r['bridgeCrossing'],1-no,rtol=2e-11,atol=2e-110)
def walk(n):
    yield n
    for child in n.get('children',[]):yield from walk(child)
for p in data['plots']:
    svg=p['svg'];lo=svg['attrs']['data-y-min'];hi=svg['attrs']['data-y-max'];mx=lambda t:80+(0 if p['T']==0 else t/p['T']*690);my=lambda y:40+(hi-y)/(hi-lo)*280
    nodes=list(walk(svg));paths=[n for n in nodes if n['tag']=='path' and n['attrs'].get('class')=='bfp-path']
    ok(len(paths)==3,'three full sampled paths')
    for n,s in zip(paths,p['samples']):
        coords=re.findall(r'[ML] ([-\d.e+]+) ([-\d.e+]+)',n['attrs']['d']);ok(len(coords)==129,'all path vertices')
        for (x,y),pt in zip(coords,s['path']):near(x,mx(pt['t']),atol=1e-10);near(y,my(pt['value']),atol=1e-10)
    dots=[n for n in nodes if n['tag']=='circle']
    for n,s in zip(dots,p['samples']):near(n['attrs']['cx'],mx(p['T']),atol=1e-10);near(n['attrs']['cy'],my(s['endpoint']),atol=1e-10)
    ok('NaN'not in json.dumps(svg)and'Infinity'not in json.dumps(svg),'finite UI geometry')
tree=ET.parse(ROOT/'math-course/images/stoch-04-brownian.svg')
original=[(0,0),(.2,.8),(.35,1),(.6,1.3),(.8,.2),(1,.4)]
for n in tree.iter():
    series=n.get('data-series')
    if series and n.tag.endswith('circle'):
        t,y=float(n.get('data-time')),float(n.get('data-value'));ref=dict(original)[t]
        if series=='reflected'and t>.35:ref=2-ref
        near(y,ref);near(n.get('cx'),70+420*t);near(n.get('cy'),440-300*(y+.2)/2.4)
    if n.tag.endswith('path')and n.get('data-probability'):
        multiple=2 if n.get('data-probability')=='maximum'else 1
        pts=re.findall(r'[ML]([-\d.e+]+) ([-\d.e+]+)',n.get('d'));ok(len(pts)==121,'complete static probability curve')
        for i,(x,y)in enumerate(pts):
            t=i/40;v=0 if i==0 else multiple*.5*math.erfc(1/math.sqrt(2*t))
            near(x,635+400*t/3,atol=1e-9);near(y,440-280*v,atol=1e-9)
# OST truncation example and Brownian quadratic variation/bridge algebra.
for m in range(1,101):
    success=F(m,m+1);failure=F(1,m+1)
    ok(success-m*failure==0 and m*failure>0,'rare negative payoff does not vanish in expectation')
for n in [1,2,4,16,128,1024]:
    T=F(3,2);ok(2*n*(T/n)**2==2*T*T/n,'quadratic variation variance')
source=(ROOT/'course-shared/labs/brownian-first-passage.js').read_bytes()
for c in ['math-course','grad-math','ai-course']:ok((ROOT/c/'site/assets/learning/labs/brownian-first-passage.js').read_bytes()==source,'mirrors')
print(f'Brownian independent PASS: {checks} checks, {len(data["cases"])} analytic cases, {len(data["normal"])} normal tails, {draws} replayed draws, {len(data["plots"])} plots, {len(data["bridges"])} bridge cases, {data["strict"]} strict failures, {data["self"]["checks"]} self-tests')
