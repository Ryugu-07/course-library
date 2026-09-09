"""Independent Decimal mode powers, optimization counterexamples and SVG geometry."""
from decimal import Decimal as D, localcontext
from fractions import Fraction as F
from pathlib import Path
import json,math,re,shutil,subprocess,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
JS=r"""
const c=require('./course-shared/labs/optimization-landscape.js'),a=require('assert'),cases=[],plots=[];
class N{constructor(tag){this.tag=tag;this.attrs={};this.children=[]}setAttribute(k,v){this.attrs[k]=String(v)}appendChild(n){this.children.push(n);return n}}
const doc={createElementNS:(_,t)=>new N(t)};
for(const kappa of [1,1.5,4,10,25,100,10000])for(const beta of [0,.01,.5,1,1.85,2-Number.EPSILON,2,2+2*Number.EPSILON,2.4,3]){
 for(const [initial,angle,rotation]of [['slow',28,28],['fast',28,28],['almost-slow',28,28],['angle',-20,30],['angle',1e-14,0],['angle',90,0]]){
  const config={kappa,beta,initial,angle,rotation,steps:120},result=c.simulate(config);cases.push({config,result});
 }
}
for(const config of c.PRESETS.concat([
 {kappa:1,beta:1,rotation:0,angle:0,steps:120},
 {kappa:1,beta:3,rotation:90,angle:0,steps:120},
 {kappa:100,beta:3,rotation:-90,angle:73,steps:500},
 {kappa:1,beta:.9,rotation:0,angle:0,steps:500},
 {kappa:10000,beta:Number.MIN_VALUE,rotation:0,angle:0,steps:2}
])){const result=c.simulate(config);cases.push({config,result});
 if(config.steps<=120)for(const local of [false,true])plots.push({config,result,local,contour:c.contourSvg(doc,config,result,local),energy:c.energySvg(doc,result)});
}
let strict=0;const base={kappa:10,beta:1,rotation:0,angle:0,steps:3};
for(const key of ['kappa','beta','rotation','angle','steps'])for(const v of [null,undefined,NaN,Infinity,'1']){a.throws(()=>c.simulate({...base,[key]:v}));strict++}
for(const [key,v]of [['kappa',.9],['kappa',10001],['beta',-.01],['beta',3.01],['rotation',91],['angle',181],['steps',0],['steps',501],['steps',1.5],['initial','bad']]){a.throws(()=>c.simulate({...base,[key]:v}));strict++}
a(Object.isFrozen(c.PRESETS)&&c.PRESETS.every(Object.isFrozen));
a(c.format(1e-14)!=='0');a(c.format(100,0)==='100');
console.log(JSON.stringify({cases,plots,strict,self:c.selfTest()}));
"""
data=json.loads(subprocess.check_output((['rtk','proxy']if shutil.which('rtk')else[])+['node','-e',JS],cwd=ROOT,text=True))
checks=0
def ok(test,msg):
    global checks
    checks+=1
    if not test:raise AssertionError(msg)
def near(a,b,rtol=3e-13,atol=4e-323,msg='numeric'):
    a=float(a);b=float(b);ok(math.isfinite(a)and abs(a-b)<=max(abs(b)*rtol,atol),f'{msg}: {a} versus {b}')
def start(c):
    mode=c.get('initial','angle')
    if mode=='slow':return (1.,0.)
    if mode=='fast':return (0.,1.)
    if mode=='almost-slow':return (1.,1e-14)
    a=c['angle']-c['rotation']
    if a%90==0:return [(1.,0.),(0.,1.),(-1.,0.),(0.,-1.)][round(a/90)%4]
    return math.cos(math.radians(a)),math.sin(math.radians(a))
with localcontext()as ctx:
    ctx.prec=110
    for case in data['cases']:
        c=case['config'];r=case['result'];kappa=float(c['kappa']);beta=float(c['beta'])
        z0=start(c);fac=(1-beta/kappa,1-beta)
        for key,value in zip(['slow','fast'],fac):near(r['factors'][key],value,0,0,'factor')
        active=[f for f,z in zip(fac,z0)if z!=0]
        rho=max(map(abs,active));kind='diverge'if rho>1 else'neutral'if rho==1 else'oscillate'if min(active)<0 else'converge'
        ok(r['kind']==kind,'classification without epsilon')
        ok(r['rhoAll']==max(map(abs,fac))and r['rhoActive']==rho,'global and active')
        ok(r['allInitialConverge']==(0<beta<2),'real all-initial criterion')
        ok(len(r['rows'])==c['steps']+1,'all rows')
        e0=(D.from_float(z0[0])**2+D.from_float(kappa)*D.from_float(z0[1])**2)/2
        d0=(D.from_float(z0[0])**2+D.from_float(z0[1])**2).sqrt()
        angle=math.radians(c['rotation']);co,si=math.cos(angle),math.sin(angle)
        for row in r['rows']:
            n=row['k']
            zs=[D.from_float(z)*(D.from_float(f)**n if n else D(1))for z,f in zip(z0,fac)]
            e=(zs[0]**2+D.from_float(kappa)*zs[1]**2)/2;dist=(zs[0]**2+zs[1]**2).sqrt();grad=(zs[0]**2+(D.from_float(kappa)*zs[1])**2).sqrt()
            for key,ref in [('slow',zs[0]),('fast',zs[1]),('energy',e),('relative',e/e0),('distance',dist),('relativeDistance',dist/d0),('gradNorm',grad)]:
                near(row[key],ref,msg=key)
            # Rotation has its own libm rounding; allow its scale, not a fixed large absolute error.
            scale=float(abs(zs[0])+abs(zs[1]))
            near(row['x'],float(zs[0])*co-float(zs[1])*si,atol=max(scale*3e-13,4e-323),msg='rotation x')
            near(row['y'],float(zs[0])*si+float(zs[1])*co,atol=max(scale*3e-13,4e-323),msg='rotation y')
        ok(r['monotoneEnergy']==all(b['energy']<=a['energy']for a,b in zip(r['rows'],r['rows'][1:])),'energy flag')
    # Exact line-search example: distinguish norm and objective ratios.
    q=F(99,101);x=[F(100),F(1)]
    for n in range(130):
        g=[x[0],100*x[1]];alpha=(g[0]**2+g[1]**2)/(g[0]**2+100*g[1]**2)
        ok(alpha==F(2,101),'exact line search')
        ok(x==[100*q**n,(-q)**n],'exact trajectory')
        ok((x[0]**2+100*x[1]**2)/10100==q**(2*n),'objective ratio')
        x=[v-alpha*gv for v,gv in zip(x,g)]
    ok(q**230>F(1,100)and q**232<=F(1,100),'116 steps at one percent')
    x=F(1,5);g=x**3-x;H=3*x*x-1;d=-g/H
    fun=lambda t:t**4/4-t*t/2
    ok(x+d==F(-1,55)and g*d>0 and fun(x+d)>fun(x),'Newton ascent toward maximum')
    ok(F(-9,4)<=-1+F(1,2)*F(1,4)*(-2)*2 and F(1,2)*(-1)<0,'Armijo does not ensure BFGS curvature')
    # Diagonal SPD quadratics independently verify descent and distance inequalities.
    for lam in [F(1),F(4),F(10)]:
        for b in [F(1,10),F(1),F(19,10),F(2)]:
            alpha=b/10;x=[F(2),F(-3)];g=[x[0],lam*x[1]];y=[v-alpha*w for v,w in zip(x,g)]
            f=lambda z:(z[0]**2+lam*z[1]**2)/2
            gn=sum(v*v for v in g)
            ok(f(y)<=f(x)-alpha*(1-alpha*5)*gn,'L smooth descent with L=10')
            ok(sum(v*v for v in y)<=sum(v*v for v in x)-alpha*(F(1,5)-alpha)*gn,'convex distance bound')
    # BFGS positive-definiteness via exact 2x2 Sylvester minors and secant equation.
    for t in range(1,21):
        B=[[F(2),F(1)],[F(1),F(3)]]
        s=[F(1),F(t,10)];y=[2*s[0]+s[1],s[0]+4*s[1]]
        bs=[sum(B[i][j]*s[j]for j in range(2))for i in range(2)]
        sy=sum(s[i]*y[i]for i in range(2));sb=sum(s[i]*bs[i]for i in range(2))
        new=[[B[i][j]-bs[i]*bs[j]/sb+y[i]*y[j]/sy for j in range(2)]for i in range(2)]
        ok(new[0][0]>0 and new[0][0]*new[1][1]-new[0][1]**2>0,'BFGS SPD')
        ok([sum(new[i][j]*s[j]for j in range(2))for i in range(2)]==y,'BFGS secant')
def walk(n):
    yield n
    for ch in n['children']:yield from walk(ch)
for p in data['plots']:
    c=p['config'];r=p['result'];nodes=list(walk(p['contour']));a=p['contour']['attrs'];extent=float(a['data-extent'])
    mx=lambda x:300+200*x/extent;my=lambda y:274-200*y/extent
    clips=[n for n in nodes if n['tag']=='clipPath']
    ok(len(clips)==1,'one actual clipping region')
    ok(any(n['attrs'].get('clip-path')=='url(#'+clips[0]['attrs']['id']+')'for n in nodes),'clip reference')
    rect=clips[0]['children'][0]['attrs'];ok(rect=={'x':'100','y':'74','width':'400','height':'400'},'square equal-unit viewport')
    for n in nodes:
        a=n['attrs'];cls=a.get('class')
        if cls=='opl-iterate':
            row=r['rows'][int(a['data-k'])];near(a['cx'],mx(row['x']),msg='actual unclamped x');near(a['cy'],my(row['y']),msg='actual unclamped y')
        if cls=='opl-contour':
            frac=float(a['data-fraction']);coords=re.findall(r'[ML]([-\d.e+]+) ([-\d.e+]+)',a['d']);ok(len(coords)==161,'contour mesh')
            for j,(px,py)in enumerate(coords):
                t=math.tau*j/160;radius=math.sqrt(2*r['rows'][0]['energy']*frac)
                slow=radius*math.cos(t);fast=radius*math.sin(t)/math.sqrt(c['kappa'])
                co=math.cos(math.radians(c['rotation']));si=math.sin(math.radians(c['rotation']))
                near(px,mx(co*slow-si*fast),atol=1e-10,msg='ellipse x');near(py,my(si*slow+co*fast),atol=1e-10,msg='ellipse y')
    energy=p['energy'];a=energy['attrs'];lo=float(a['data-log-min']);hi=float(a['data-log-max'])
    for n in walk(energy):
        a=n['attrs']
        if n['tag']=='circle':
            row=r['rows'][int(a['data-k'])];v=row[a['data-series']]
            near(a['cx'],82+460*row['k']/c['steps'],atol=1e-10,msg='log x')
            near(a['cy'],362 if v==0 else 320-240*(math.log10(v)-lo)/(hi-lo),atol=1e-10,msg='no-floor log y')
            ok(float(a['data-value'])==float(v),'curve records same value as ledger')
    for n in nodes+list(walk(energy)):ok('NaN'not in str(n['attrs'])and'Infinity'not in str(n['attrs']),'finite geometry')
tree=ET.parse(ROOT/'math-course/images/opt-02-gradient-descent.svg')
for g in tree.iter():
    if g.get('id')not in ['stable','unstable']:continue
    extent=float(g.get('data-extent'));center=float(g.get('data-center'));alpha=float(g.get('data-alpha'))
    co,si=math.cos(math.pi/6),math.sin(math.pi/6);z0=(math.cos(-50*math.pi/180),math.sin(-50*math.pi/180))
    e0=(z0[0]**2+10*z0[1]**2)/2
    for n in g.iter():
        if n.get('data-k')is not None:
            k=int(n.get('data-k'));a=z0[0]*(1-alpha)**k;b=z0[1]*(1-10*alpha)**k
            near(n.get('cx'),center+200*(co*a-si*b)/extent,atol=1e-8,msg='static iterate x')
            near(n.get('cy'),320-200*(si*a+co*b)/extent,atol=1e-8,msg='static iterate y')
        if n.get('data-contour'):
            frac=float(n.get('data-contour'));coords=re.findall(r'[ML]([-\d.]+),([-\d.]+)',n.get('d'))
            for px,py in coords:
                x=(float(px)-center)*extent/200;y=(320-float(py))*extent/200
                z=(co*x+si*y,-si*x+co*y)
                near((z[0]**2+10*z[1]**2)/2,e0*frac,atol=1e-9,msg='static same quadratic')
print(f'Optimization independent PASS: {checks} checks, {len(data["cases"])} cases, {len(data["plots"])} geometries, {data["strict"]} strict failures, {data["self"]["checks"]} self-tests')
