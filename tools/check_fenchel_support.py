"""Independent Decimal conjugates, exact boundary classification, and clipped geometry."""
from pathlib import Path
from decimal import Decimal as D, localcontext
from fractions import Fraction as F
import json,math,re,shutil,subprocess,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
JS=r"""
const c=require('./course-shared/labs/fenchel-support.js'),a=require('assert'),rows=[],plots=[];
const special={quadratic:[-3,0,3],absolute:[-1-Number.EPSILON,-1,-1+Number.EPSILON/2,1-Number.EPSILON/2,1,1+Number.EPSILON],softplus:[-Number.MIN_VALUE,0,Number.MIN_VALUE,1e-12,1-1e-12,1-Number.EPSILON/2,1,1+Number.EPSILON]};
class N{constructor(tag,attrs,children){this.tag=tag;this.attrs=attrs||{};this.children=(children||[]).map(x=>typeof x==='string'?new N('#text',{text:x}):x);this.nodeType=1}appendChild(n){this.children.push(n)}get firstChild(){return this.children[0]}removeChild(n){this.children.splice(this.children.indexOf(n),1)}setAttribute(k,v){this.attrs[k]=v}}
const api={svg:(t,a,ch)=>new N(t,a,Array.isArray(ch)?ch:ch===undefined?[]:[ch])};
for(const p of c.PRESETS){
 const slopes=Array.from({length:81},(_,j)=>p.sliderMin+(p.sliderMax-p.sliderMin)*j/80).concat(special[p.id]);
 for(const s of slopes)for(const delta of [-2,-.1,0,.1,2])rows.push(c.evaluate(p.id,s,delta));
 for(const s of special[p.id])for(const delta of [-2,0,2]){const d=c.evaluate(p.id,s,delta),tree=new N('svg');c.drawScene(api,tree,p,d,'title-'+plots.length,'desc-'+plots.length);plots.push({data:d,tree});}
}
let strict=0;for(const bad of [null,'1',NaN,Infinity,undefined]){a.throws(()=>c.evaluate('absolute',bad));strict++;a.throws(()=>c.evaluate('absolute',0,bad===undefined?3:bad));strict++;}
for(const bad of [-3,3]){a.throws(()=>c.evaluate('absolute',bad));strict++;}
a.throws(()=>c.evaluate('missing',0));a.throws(()=>c.evaluate({},0));a(Object.isFrozen(c.PRESETS)&&c.PRESETS.every(Object.isFrozen));
console.log(JSON.stringify({rows,plots,strict,self:c.selfTest()}));
"""
data=json.loads(subprocess.check_output((['rtk','proxy']if shutil.which('rtk')else[])+['node','-e',JS],cwd=ROOT,text=True))
checks=0
def ok(b,msg):
    global checks
    checks+=1
    if not b:raise AssertionError(msg)
def walk(n):
    yield n
    for ch in n['children']:yield from walk(ch)
def near(a,b,tol,msg):ok(abs(float(a)-float(b))<=tol,msg)
with localcontext() as ctx:
    ctx.prec=120
    for r in data['rows']:
        s=D.from_float(float(r['s']));ident=r['id']
        finite=ident=='quadratic' or (abs(s)<=1 if ident=='absolute' else 0<=s<=1)
        ok(r['finite']==finite,'strict conjugate domain')
        if not finite:
            ok(r['star']is None and not r['lowerBound'] and r['contact']['type']=='none','outside no finite line/contact')
            continue
        star=s*s/2 if ident=='quadratic' else D(0) if ident=='absolute' or s==0 or s==1 else s*s.ln()+(1-s)*(1-s).ln()
        estimate=D.from_float(float(r['star']))
        ok(abs(estimate-star)<=max(abs(star)*D('6e-15'),D('2e-323')),'independent conjugate value')
        if ident=='quadratic':typ='point';x=s
        elif ident=='absolute':typ='point'if abs(s)<1 else'ray';x=D(0)
        else:typ='asymptotic'if s==0 or s==1 else'point';x=s.ln()-(1-s).ln()if typ=='point'else D(0)
        ok(r['contact']['type']==typ,'point/ray/asymptote')
        if typ=='point':ok(abs(D.from_float(float(r['contact']['x']))-x)<max(abs(x)*D('3e-15'),D('1e-15')),'contact inverse derivative')
        if typ=='ray':ok(r['contact']['side']==('right'if s==1 else'left'),'ray orientation')
        delta=D.from_float(float(r['offset']))
        ok(r['globalGapInfimum']==-r['offset'],'global gap infimum')
        ok(r['lowerBound']==(delta<=0),'lower bound status')
        ok(r['touches']==(delta==0 and typ in ['point','ray']),'highest line contact status')
        for x0 in [D(-10),D(-1),D(0),D(1),D(10)]:
            fx=x0*x0/2 if ident=='quadratic'else abs(x0)if ident=='absolute'else (1+x0.exp()).ln()
            gap=fx+star-s*x0
            ok(gap>=-D('1e-115'),'independent Fenchel Young global sample')
        if typ=='point':
            fx=x*x/2 if ident=='quadratic'else abs(x)if ident=='absolute'else (1+x.exp()).ln()
            ok(abs(fx+star-s*x)<D('1e-112'),'contact equality')
    # Counterexample and soft-threshold proofs use independent rational arithmetic.
    for tau in [F(0),F(1,10),F(1),F(3)]:
        for a in [F(k,4)for k in range(-20,21)]:
            x=(1 if a>0 else -1 if a<0 else 0)*max(abs(a)-tau,0)
            g=F(1)if x>0 else F(-1)if x<0 else (a/tau if tau else F(0))
            ok(x-a+tau*g==0 and abs(g)<=1,'soft threshold subgradient')
            for y in [x-F(1,10),x+F(1,10),F(0)]:
                ok((x-a)**2/2+tau*abs(x)<=(y-a)**2/2+tau*abs(y),'unique soft threshold sample')
    for mu in [F(1,10**k)for k in range(10)]:
        y=mu/10;ok(y**4<mu*y*y/2,'strict not strong for arbitrarily small mu corpus')
    for delta in [D('1e-20'),D('.001'),D('.1'),D(1),D(2)]:
        # Independent high-precision crossing of the raised asymptotic line.
        x=-(delta.exp()-1).ln();ok(abs((1+(-x).exp()).ln()-delta)<D('1e-110'),'softplus raised line crossing')
    # Second derivative at zero of softplus(-w²) is -1, via Taylor coefficient.
    for h in [D('1e-3'),D('1e-6')]:
        loss=(1+(-h*h).exp()).ln();sec=2*(loss-D(2).ln())/(h*h)
        ok(abs(sec+1)<h*h,'nonconvex parameterized cross entropy')
def fn(ident,x):
    if ident=='quadratic':return x*x/2
    if ident=='absolute':return abs(x)
    return max(x,0)+math.log1p(math.exp(-abs(x)))
def fs(ident,s):
    if ident=='quadratic':return s*s/2
    if ident=='absolute' or s==0 or s==1:return 0
    return s*math.log(s)+(1-s)*math.log1p(-s)
for plot in data['plots']:
    d=plot['data'];nodes=list(walk(plot['tree']));groups=[n for n in nodes if 'data-panel'in n['attrs']]
    ok(len(groups)==2,'two coordinate panels')
    clips={n['attrs'].get('id')for n in nodes if n['tag']=='clipPath'}
    for g in groups:
        a=g['attrs'];clip=a['clip-path'];ok(clip[5:-1]in clips,'actual SVG clipping reference')
        xm=float(a['data-xmin']);xx=float(a['data-xmax']);ym=float(a['data-ymin']);yy=float(a['data-ymax'])
        mx=lambda x:a['data-left']+(x-xm)/(xx-xm)*(a['data-right']-a['data-left'])
        my=lambda y:a['data-bottom']-(y-ym)/(yy-ym)*(a['data-bottom']-a['data-top'])
        for n in g['children']:
            at=n['attrs'];cls=at.get('className','')
            if cls=='fs-under':
                coords=re.findall(r'[ML](-?[\d.]+),(-?[\d.]+)',at['d']);ok(len(coords)==2,'line endpoints')
                for (px,py),x in zip(coords,[xm,xx]):
                    near(px,mx(x),.00500001,'line x')
                    near(py,my(d['s']*x-d['star']+d['offset']),.00500001,'raised line actual equation')
            if cls in ['fs-function','fs-conjugate','fs-contact-set']:
                coords=re.findall(r'[ML](-?[\d.]+),(-?[\d.]+)',at['d'])
                if cls=='fs-function':lo,hi,num=xm,xx,220;fun=lambda x:fn(d['id'],x)
                elif cls=='fs-conjugate':
                    lo,hi=(-1,1)if d['id']=='absolute'else(0,1)if d['id']=='softplus'else(xm,xx);num=220;fun=lambda x:fs(d['id'],x)
                else:lo,hi=(0,xx)if at['data-ray']=='right'else(xm,0);num=80;fun=lambda x:abs(x)
                ok(len(coords)==num+1,'complete curve mesh')
                for j,(px,py)in enumerate(coords):
                    x=lo+(hi-lo)*j/num;near(px,mx(x),.00500001,'curve x');near(py,my(fun(x)),.00500001,'curve y')
            if 'data-contact-x'in at:
                near(at['cx'],mx(at['data-contact-x']),1e-10,'contact x')
                near(at['cy'],my(fn(d['id'],at['data-contact-x'])),1e-10,'contact y')
            if 'data-current-s'in at:
                near(at['cx'],mx(d['s']),1e-10,'current slope');near(at['cy'],my(d['star']),1e-10,'current conjugate')
        under=[n for n in g['children']if n['attrs'].get('className')=='fs-under']
        if a['data-panel']=='left':ok(len(under)==int(d['finite']),'no finite line outside domain')
    for n in nodes:ok('NaN'not in str(n['attrs'])and'Infinity'not in str(n['attrs']),'finite rendered geometry')
tree=ET.parse(ROOT/'math-course/images/opt-01-convex.svg')
for g in tree.iter():
    if g.get('id')not in ['quadratic','quartic']:continue
    left=float(g.get('data-left'));xmin=float(g.get('data-xmin'));xmax=float(g.get('data-xmax'));ymin=float(g.get('data-ymin'));ymax=float(g.get('data-ymax'))
    for n in g:
        name=n.get('data-curve')
        if name:
            for sx,sy in re.findall(r'[ML](-?[\d.]+),(-?[\d.]+)',n.get('d')):
                x=xmin+(float(sx)-left)/390*(xmax-xmin)
                y={'quadratic':lambda:x*x/2,'chord':lambda:x/4+1.5,'tangent':lambda:x/2-.125,'quartic':lambda:x**4,'quadratic-bound':lambda:x*x/2}[name]()
                near(sy,370-270*(y-ymin)/(ymax-ymin),1e-7,'static polynomial coordinate')
print(f'Fenchel independent PASS: {checks} checks, {len(data["rows"])} cases, {len(data["plots"])} geometries, {data["strict"]} strict failures, {data["self"]["checks"]} self-tests')
