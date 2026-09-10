"""Independent Gaussian coupling, finite-sum identities and Decimal weak bias."""
from pathlib import Path
from decimal import Decimal as D, localcontext
import json, math, re, shutil, subprocess, xml.etree.ElementTree as ET, runpy, tempfile
ROOT=Path(__file__).resolve().parents[1]
JS=r"""
const c=require('./course-shared/labs/ito-sde.js'),assert=require('assert'),cases=[],means=[],plots=[],rngs=[];
for(const model of ['ode','ito','strat'])for(const drift of [-1,0,.35,1])for(const sigma of [0,.7,1.4])for(const horizon of [.5,2])for(const x0 of [.2,3])for(const seed of c.SEEDS)
cases.push(c.simulate({model,drift,sigma,horizon,x0,seed,path:4}));
for(const model of ['ode','ito','strat'])for(const drift of [0,1e-20,.35,-1])for(const sigma of [0,1e-20,.7,1.4])for(const steps of c.LEVELS){
 const config={model,drift,sigma};means.push({config,steps,result:c.discreteMean(config,steps)});
}
for(const seed of [0,107,20260722,4294967295]){const rng=c.makeRng(seed);rngs.push({seed,values:Array.from({length:512},()=>rng())});}
class Node {constructor(tag){this.tag=tag;this.attrs={};this.children=[];}setAttribute(k,v){this.attrs[k]=String(v);}appendChild(n){this.children.push(n);}}
const doc={createElementNS:(_,tag)=>new Node(tag)};
for(const model of ['ode','ito','strat'])for(const [drift,sigma] of [[0,0],[.35,.7],[-1,1.4]])for(const seed of c.SEEDS){
 const data=c.simulate({model,drift,sigma,seed,horizon:2,level:0,path:63});
 plots.push({data,path:c.drawPathChart(doc,data,'p'),dist:c.drawDistributionChart(doc,data),error:c.drawErrorChart(doc,data)});
}
let strict=0;function reject(f){assert.throws(f);strict++;}
for(const bad of [null,'1',NaN,Infinity,-2]){
 reject(()=>c.copyConfig({sigma:bad}));reject(()=>c.copyConfig({seed:bad}));
}
for(const input of [{model:'other'},{level:1.5},{path:64},{paths:32},{noiseSteps:128},{horizon:0},{x0:0},{seed:4294967296},{extra:1}])reject(()=>c.simulate(input));
reject(()=>c.aggregateIncrements([1,2],3,2));reject(()=>c.aggregateIncrements([NaN],1,1));
reject(()=>c.gaussian(()=>0));reject(()=>c.gaussian(()=>1));reject(()=>c.exactValue('other',1,1,.3,.7,0));
console.log(JSON.stringify({cases,means,plots,rngs,strict,self:c.selfTest()}));
"""
data=json.loads(subprocess.check_output((['rtk','proxy']if shutil.which('rtk')else[])+['node','-e',JS],cwd=ROOT,text=True))
checks=0
def ok(v,msg):
    global checks
    checks+=1
    if not v:raise AssertionError(msg)
def near(a,b,rtol=3e-11,atol=3e-12):
    a=float(a);b=float(b)
    ok(a==b or(abs(a-b)<=max(atol,rtol*abs(b))),f'{a} vs {b}')
MASK=2**32-1
def draws(seed):
    while True:
        seed=(seed+0x6D2B79F5)&MASK;t=seed
        t=((t^(t>>15))*(t|1))&MASK
        t=(t^((t+(((t^(t>>7))*(t|61))&MASK))&MASK))&MASK
        yield (((t^(t>>14))&MASK)+.5)/2**32
for item in data['rngs']:
    rng=draws(item['seed'])
    for v in item['values']:ok(v==next(rng) and 0<v<1,'open uniform RNG bit-for-bit')
noise_cache={}
def noise(seed,T):
    key=(seed,T)
    if key not in noise_cache:
        paths=[]
        for j in range(64):
            rng=draws((seed+j*7919)&MASK);vals=[]
            for k in range(256):
                u=next(rng);v=next(rng);vals.append(math.sqrt(T/256)*math.sqrt(-2*math.log(u))*math.cos(2*math.pi*v))
            paths.append(vals)
        noise_cache[key]=paths
    return noise_cache[key]
def expected(c,t,B):
    a=c['drift'];sig=c['sigma'];m=c['model']
    return c['x0']*math.exp(a*t if m=='ode'else (a-(sig*sig/2 if m=='ito'else 0))*t+sig*B)
def aggregate(path,n):return [math.fsum(path[i*256//n:(i+1)*256//n])for i in range(n)]
def trace(c,inc):
    h=c['horizon']/len(inc);x=c['x0'];values=[x]
    for dw in inc:
        u=c['drift']*h+(0 if c['model']=='ode'else c['sigma']*dw)
        x*=1+u+(.5*u*u if c['model']=='strat'else 0);values.append(x)
    return values
def popvar(vals):m=math.fsum(vals)/len(vals);return math.fsum((x-m)**2 for x in vals)/len(vals)
def coords(d):return[(float(x),float(y))for x,y in re.findall(r'[ML]([-\d.e+]+) ([-\d.e+]+)',d)]
with localcontext()as ctx:
    ctx.prec=110
    for r in data['means']:
        c={'horizon':1,'x0':1,**r['config']};n=r['steps'];h=D.from_float(c['horizon'])/n;a=D.from_float(c['drift']);sigma=D.from_float(c['sigma'])
        mult=1+a*h+((a*a*h*h+sigma*sigma*h)/2 if c['model']=='strat'else 0)
        exact=(a+(sigma*sigma/2 if c['model']=='strat'else 0)).exp()
        mean=mult**n;bias=mean-exact
        near(r['result']['mean'],mean,rtol=3e-14,atol=0);near(r['result']['bias'],bias,rtol=3e-12,atol=1e-100);near(r['result']['weak'],abs(bias),rtol=3e-12,atol=1e-100)
    for result in data['cases']:
        c=result['config'];paths=noise(c['seed'],c['horizon']);M=64
        exact=[expected(c,c['horizon'],math.fsum(p))for p in paths]
        for r in result['rows']:
            n=r['steps'];numerical=[trace(c,aggregate(p,n))[-1]for p in paths]
            for a,b in zip(r['numerical'],numerical):near(a,b)
            for a,b in zip(r['exact'],exact):near(a,b)
            differences=[a-b for a,b in zip(numerical,exact)]
            m=math.fsum(numerical)/M;paired=math.fsum(differences)/M
            near(r['strong'],math.sqrt(math.fsum(d*d for d in differences)/M))
            near(r['pairedMean'],paired);near(r['pairedSE'],math.sqrt(popvar(differences)/(M-1)))
            near(r['numericalMean'],m);near(r['numericalVariance'],popvar(numerical))
            near(r['exactVariance'],popvar(exact));near(r['exactSampleMean'],math.fsum(exact)/M)
            near(r['samplingDeviation']+r['analyticBias'],r['totalMeanDeviation'])
            ok(r['negativeEndpoints']==sum(x<0 for x in numerical),'negative endpoints preserved')
        for r in result['qvRows']:
            inc=aggregate(paths[c['path']],r['steps']);B=0;left=0;trap=0
            for dw in inc:left+=B*dw;trap+=(B+dw/2)*dw;B+=dw
            q=math.fsum(dw*dw for dw in inc)
            for k,v in dict(qv=q,brownian=B,left=left,trapezoid=trap,leftIdentity=(B*B-q)/2,trapezoidIdentity=B*B/2,itoTarget=(B*B-c['horizon'])/2).items():near(r[k],v)
            near(r['left'],r['leftIdentity']);near(r['trapezoid'],r['trapezoidIdentity'])
        inc=aggregate(paths[c['path']],result['selected']['steps']);values=trace(c,inc)
        for a,b in zip(result['selectedTrace'],values):near(a,b)
        B=0;target=[c['x0']]
        for j,dw in enumerate(inc):B+=dw;target.append(expected(c,(j+1)*c['horizon']/len(inc),B))
        for a,b in zip(result['selectedExactTrace'],target):near(a,b)
    def nodes(n):
        yield n
        for ch in n['children']:yield from nodes(ch)
    for item in data['plots']:
        r=item['data'];c=r['config'];svg=item['path'];lo=float(svg['attrs']['data-min']);hi=float(svg['attrs']['data-max'])
        paths=[n for n in nodes(svg)if n['tag']=='path']
        ok(len(paths)==(2 if c['model']=='ode'else 3),'full plot series')
        for n in paths:
            cl=n['attrs']['class'];values=r['selectedExactTrace']if cl=='isde-exact'else r['selectedTrace']if cl=='isde-num'else[expected({**c,'model':'ode'},j*c['horizon']/(len(r['selectedTrace'])-1),0)for j in range(len(r['selectedTrace']))]
            pts=coords(n['attrs']['d']);ok(len(pts)==len(values),'all path vertices')
            for j,((x,y),v)in enumerate(zip(pts,values)):
                near(x,48+614*j/(len(values)-1),atol=1e-9);near(y,22+(hi-v)*224/(hi-lo),atol=1e-9);ok(22-1e-9<=y<=246+1e-9,'ODE and random curves within world bounds')
        svg=item['dist'];a=float(svg['attrs']['data-min']);b=float(svg['attrs']['data-max']);ymax=float(svg['attrs']['data-count-max'])
        for key,cls in [('numerical','isde-hist'),('exact','isde-exact-hist')]:
            counts=[0]*16
            for v in r['selected'][key]:counts[min(15,math.floor((v-a)/(b-a)*16))]+=1
            bars=[n for n in nodes(svg)if n['attrs'].get('class')==cls]
            ok(len(bars)==16 and sum(counts)==64,'full histogram')
            for j,(bar,v)in enumerate(zip(bars,counts)):
                attrs=bar['attrs'];near(attrs['height'],200*v/ymax);near(attrs['y'],235-200*v/ymax)
                near(attrs['x'],70+35*j+(1 if key=='numerical'else 5.25));near(attrs['width'],33 if key=='numerical'else 24.5)
        svg=item['error'];lo=float(svg['attrs']['data-log-min']);hi=float(svg['attrs']['data-log-max'])
        for key in ['strong','weak']:
            marks=[n for n in nodes(svg)if n['tag']=='circle'and n['attrs'].get('data-series')==key]
            positive=[(j,row)for j,row in enumerate(r['rows'])if row[key]>0];ok(len(marks)==len(positive),'zero error omitted, never floored')
            for n,(j,row)in zip(marks,positive):
                near(n['attrs']['cx'],90+540*j/4);near(n['attrs']['cy'],230-(math.log10(row[key])-lo)*190/(hi-lo),atol=1e-9)
    root=ET.parse(ROOT/'math-course/images/sde-01-quadratic-variation.svg')
    for n in root.iter():
        if n.get('data-series')=='sd':
            pts=coords(n.get('d'));ok(len(pts)==181,'full SD graph')
            for j,(x,y)in enumerate(pts):near(x,100+500*(j/20)/9,atol=1e-9);near(y,320-200*math.sqrt(2/2**(3+j/20))/.55,atol=1e-9)
        if n.get('data-series')=='finite-path':
            pts=coords(n.get('d'))
            for j,((x,y),v)in enumerate(zip(pts,[0,.5,.25,1,.5])):near(x,100+125*j);near(y,640-120*v)
source=(ROOT/'course-shared/labs/ito-sde.js').read_bytes()
for course in ['math-course','grad-math','ai-course']:ok((ROOT/course/'site/assets/learning/labs/ito-sde.js').read_bytes()==source,'mirror')
guard=runpy.run_path(str(ROOT/'tools/build_public_site.py'))['check_packaged_images']
with tempfile.TemporaryDirectory()as td:
    base=Path(td);output=base/'public';output.mkdir()
    (base/'source-only.svg').write_text('<svg/>')
    (output/'image one.svg').write_text('<svg/>')
    (output/'index.html').write_text('<img src="../source-only.svg"><img src="image%20one.svg"><img src="https://example.com/remote.svg">')
    count,missing=guard(output)
    ok(count==2 and missing==['index.html: ../source-only.svg'],'source-only image must fail packaged guard')
    (output/'index.html').write_text('<img src="/image%20one.svg">')
    ok(guard(output)==(1,[]),'packaged absolute image path')
for page in ['info-02-kl-mi','sde-01-ito']:
    html=(ROOT/'math-course/site'/f'{page}.html').read_text()
    ok('src="../images/'not in html,'actual generated image URL is deployable')
print(f'Ito SDE reference PASS: {checks} checks, {len(data["cases"])} ensembles, {len(data["means"])} Decimal moments, {len(data["plots"])} plot sets, {data["strict"]} strict failures, {data["self"]["checks"]} self-checks')
