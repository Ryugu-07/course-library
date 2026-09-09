"""Independent Decimal/Fraction checks, strict boundaries, and actual SVG coordinates."""
from pathlib import Path
from decimal import Decimal as D, localcontext
from fractions import Fraction as F
import json, math, re, shutil, subprocess, xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
JS=r"""
const c=require('./course-shared/labs/quadrature-ode.js'),a=require('assert');
const qs=[];for(const id of ['smooth','peak','bump'])for(const n of [2,4,8,16,32,64,128,256,512])for(const tol of [1e-6,1e-9,1e-12])qs.push(c.quadratureExperiment(id,n,tol));
const os=[];for(const z of [1e-12,.1,1,1.25,1.9999999999999998,2,2.0000000000000004,2.78,2.79,5,40,700])for(const n of [1,2,8,32,256])if(z*n<=700)os.push(c.odeExperiment(z*n,1,n));
let strict=0;function bad(fn){a.throws(fn);strict++;}
for(const v of [null,'2',NaN,Infinity,-1,1.5,4097]){bad(()=>c.quadratureExperiment('smooth',v));bad(()=>c.odeExperiment(1,1,v));}
for(const v of [null,'1',NaN,Infinity,0,-1]){bad(()=>c.odeExperiment(v,1,1));bad(()=>c.adaptiveSimpson(x=>x,0,1,v));}
bad(()=>c.compositeSimpson(x=>x,0,1,3));bad(()=>c.compositeTrapezoid(x=>Infinity,0,1,2));bad(()=>c.compositeSimpson(x=>x,1,0,2));
bad(()=>c.adaptiveSimpson(x=>x,0,1,1e-9,21));bad(()=>c.adaptiveSimpson(x=>x,0,1,1e-9,1,5000));
bad(()=>c.odeExperiment(701,1,1));bad(()=>c.predictionAnswers('bad'));
const stops={
pass:c.adaptiveSimpson(x=>x*x*x,0,1,1e-10,0),
depth:c.adaptiveSimpson(x=>Math.exp(x),0,1,1e-30,0),
budget:c.adaptiveSimpson(x=>Math.exp(x),0,1,1e-30,18,5),
mid:c.adaptiveSimpson(x=>1,1,1+Number.EPSILON,1e-12)};
a(!stops.pass.reachedLimit);a(stops.depth.reachedLimit);a(stops.budget.reachedLimit);a(stops.mid.reachedLimit);
a(!c.odeExperiment(2.0000000000000004,1,1).rows[0].stable);
a(Object.isFrozen(c.QUADRATURE_PRESETS)&&c.QUADRATURE_PRESETS.every(Object.isFrozen));
a(Object.isFrozen(c.ODE_METHODS)&&c.ODE_METHODS.every(Object.isFrozen));
class N{constructor(tag){this.tag=tag;this.attrs={};this.children=[];this.nodeType=1}setAttribute(k,v){this.attrs[k]=v}appendChild(n){this.children.push(n)}}
const doc={createElementNS:(ns,t)=>new N(t),createTextNode:t=>({text:t,attrs:{},children:[]})};
const plots=[];for(const id of ['smooth','peak','bump']){const q=c.quadratureExperiment(id,64,1e-9);plots.push({mode:'quadrature',data:q,tree:c.drawQuadratureChart(null,doc,q)});plots.push({mode:'error',data:q,tree:c.drawErrorChart(null,doc,q)});}
for(const z of [.1,1.25,2,2.0000000000000004,5,40]){const d=c.odeExperiment(z*8,1,8);plots.push({mode:'ode',data:d,tree:c.drawOdeChart(null,doc,d)});}
console.log(JSON.stringify({qs,os,stops,strict,plots,refs:c.integralReferences,self:c.selfTest()}));
"""
data=json.loads(subprocess.check_output((['rtk','proxy'] if shutil.which('rtk') else [])+['node','-e',JS],cwd=ROOT,text=True))
checks=0
def ok(b,msg):
    global checks
    checks+=1
    if not b: raise AssertionError(msg)
def sincos(x,cos=False):
    t=D(1) if cos else x;s=t
    for n in range(1,180):
        t*= -x*x/D((2*n-1)*(2*n) if cos else (2*n)*(2*n+1));s+=t
        if abs(t)<D('1e-105'):break
    return s
def atan_small(x):
    term=x;s=term
    for n in range(1,250):
        term*= -x*x;s+=term/D(2*n+1)
        if abs(term)<D('1e-105'):break
    return s
def bump(x):
    u=128*(x-F(39,64))
    return (1-u*u)**5 if abs(u)<1 else F(0)
with localcontext() as ctx:
    ctx.prec=110
    pi=16*atan_small(D(1)/5)-4*atan_small(D(1)/239)
    refs={'smooth':sincos(D(1))+D(1)/3,'peak':(pi-atan_small(D(1)/7)-atan_small(D(1)/13))/20,'bump':D(4)/693}
    ok(data['refs']==json.loads((ROOT/'tools/fixtures/quadrature-reference.json').read_text()),'reference fixture')
    for k,v in refs.items():
        ref=data['refs'][k]
        ok(abs(D(ref['text'])-v)<abs(v)*D('1e-64'),'65 digit reference')
        ok(abs(D.from_float(ref['hi'])+D.from_float(ref['lo'])-v)<abs(v)*D('1e-31'),'two-word reference')
    for q in data['qs']:
        n=q['n'];ident=q['id']
        def f(x):
            if ident=='smooth':return sincos(x,True)+x*x
            if ident=='peak':return 1/(1+400*(x-D(13)/20)**2)
            b=bump(F(x));return D(b.numerator)/D(b.denominator)
        values=[f(D(j)/n)for j in range(n+1)]
        t=(sum(values)-(values[0]+values[-1])/2)/n
        s=(values[0]+values[-1]+sum((4 if j%2 else 2)*values[j]for j in range(1,n)))/(3*n)
        for key,truth in [('trapezoid',t),('simpson',s)]:
            ok(abs(D.from_float(q['values'][key])-truth)<max(abs(truth)*D('5e-14'),D('1e-28')),'independent quadrature '+ident+key)
        for key,value in q['values'].items():
            err=abs(D.from_float(value)-refs[ident])
            ok(abs(D.from_float(q['errors'][key])-err)<max(err*D('3e-15'),D('1e-32')),'actual error '+key)
        ad=q['adaptive']
        ok(ad['evaluations']==len(ad['samples'])<=4096,'bounded actual evaluations')
        for x,y in ad['samples']:
            ok(abs(D.from_float(y)-f(D.from_float(x)))<D('3e-14'),'recorded actual sample')
        if ident=='bump':
            ok(ad['value']==ad['errorEstimate']==0 and ad['evaluations']==5 and not ad['reachedLimit'],'missed smooth peak')
            ok(q['errors']['adaptive']>.005,'miss actual positive error')
            ok(q['errors']['split']<q['tolerance'],'known split works on this corpus')
            if n==32:ok(q['values']['trapezoid']==q['values']['simpson']==0,'N32 misses')
            if n==64:ok(q['values']['trapezoid']==1/64 and q['values']['simpson']==1/48,'N64 weights')
    for o in data['os']:
        z=D.from_float(o['z']);n=o['steps']
        gs=[1-z,1-z+z*z/2,1-z+z*z/2-z**3/6+z**4/24,1/(1+z)]
        for row,g in zip(o['rows'],gs):
            ok(abs(D.from_float(row['factor'])-g)<max(abs(g)*D('8e-15'),D('1e-16')),'ODE amplification polynomial')
            # Power is evaluated from the actual rounded amplification factor.
            gp=D.from_float(row['factor'])**n
            ok(abs(D.from_float(row['endpoint'])-gp)<max(abs(gp)*D('3e-15'),D('1e-320')),'ODE endpoint power')
            ok(row['stable']==(abs(row['factor'])<=1),'strict stability')
            ok(row['decays']==(abs(row['factor'])<1),'strict decay')
            ok(float(row['absoluteError'])==abs(float(row['endpoint'])-float(o['exact'])),'declared double-reference error')
        ok(abs(D.from_float(o['exact'])-(-D.from_float(o['lambda'])).exp())<max(D.from_float(o['exact'])*D('3e-15'),D('1e-320')),'ODE exp reference')
    # Algebraic facts in the prose, independent rational and complex identities.
    integral=F(2,128)*sum((-1)**k*math.comb(5,k)*F(1,2*k+1)for k in range(6))
    ok(integral==F(4,693),'bump exact integral')
    h=F(1,4);rk=(1+h+h*h/2+h**3/6+h**4/24)**4
    ok(abs(float(rk)-2.7182099392)<5e-11,'RK example')
    for x in [-100,-10,-1,-.01,0]:
        for y in [-100,-2,0,3,100]:
            z=complex(x,y);ok(abs(1/(1-z))<=1+1e-15,'implicit Euler A stable corpus')
            ok(abs((1+z/2)/(1-z/2))<=1+1e-15,'trapezoid A stable corpus')
def walk(tree):
    for k,v in list(tree['attrs'].items()):
        if isinstance(v,str):
            try: tree['attrs'][k]=float(v)
            except ValueError: pass
    yield tree
    for child in tree['children']:yield from walk(child)
for plot in data['plots']:
    tree=plot['tree'];nodes=list(walk(tree));d=plot['data']
    for n in nodes:ok('NaN'not in str(n['attrs'])and'Infinity'not in str(n['attrs']),'finite SVG')
    if plot['mode']=='quadrature':
        probes=[n for n in nodes if 'data-probe'in n['attrs']]
        expected=d['n']+1+d['adaptive']['evaluations']+(d['split']['evaluations']if d['split']else 0)
        ok(len(probes)==expected,'all actual probes drawn')
        for n in probes:
            a=n['attrs'];ok(abs(a['x1']-(60+660*a['data-x']))<1e-10,'probe world coordinate')
            ok(a['x1']==a['x2'],'vertical probe')
    elif plot['mode']=='error':
        for n in nodes:
            a=n['attrs']
            if 'data-error'not in a:continue
            e=d['errors'][a['data-error']];lo=tree['attrs']['data-log-min'];hi=tree['attrs']['data-log-max']
            y=268 if e==0 else 220-175*(math.log10(e)-lo)/(hi-lo)
            ok(abs(a['cy']-y)<1e-10,'unclipped log error point')
    else:
        pts=[n for n in nodes if 'data-method'in n['attrs']]
        ok(len(pts)==4*(d['steps']+1),'every ODE point drawn')
        limit=tree['attrs']['data-limit'];transform=tree['attrs']['data-transform']
        for n in pts:
            a=n['attrs'];v=a['data-y'];y=290-230*((math.asinh(v)if transform=='asinh'else v)+limit)/(2*limit)
            ok(abs(a['cy']-y)<1e-10,'unclipped ODE value')
            ok(abs(a['cx']-(100+620*a['data-t']/d['finalTime']))<1e-10,'ODE time coordinate')
svg=ET.parse(ROOT/'math-course/images/num-04-missed-peak.svg')
ns={'s':'http://www.w3.org/2000/svg'}
for g in svg.findall('.//s:g',ns):
    if g.get('id')not in ['whole','zoom']:continue
    left=F(float(g.get('data-left')));right=F(float(g.get('data-right')))
    path=next(e for e in g if e.get('class')=='function')
    coords=re.findall(r'[ML]([\d.]+),([\d.]+)',path.get('d'))
    for sx,sy in coords:
        x=left+(right-left)*F(sx)/660-(right-left)*F(70,660)
        # Nine-decimal pixel serialization perturbs the reconstructed rational x.
        ok(abs(float(sy)-(235-170*float(bump(x))))<3e-7,'static curve from same function')
ok(len(svg.findall('.//s:circle',ns))==5,'five static initial probes')
print(f'Quadrature/ODE independent PASS: {checks} checks, {len(data["qs"])} quadrature + {len(data["os"])} ODE cases, {data["strict"]} rejected inputs, {data["self"]["checks"]} self-tests')
