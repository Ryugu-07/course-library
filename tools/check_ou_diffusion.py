"""Independent OU coupling, analytic covariance and complete SVG geometry."""
from pathlib import Path
from decimal import Decimal as D, localcontext
import json, math, re, shutil, subprocess, xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
JS=r"""
const c=require('./course-shared/labs/sde-path-distribution.js'),assert=require('assert');
const moments=[],cases=[],plots=[],kernels=[],rngs=[];
for(const theta of [0,1e-100,1e-20,.1,1.15,4,5])for(const sigma of [0,1e-100,.85])for(const x0 of [-2,0,1.4])for(const level of c.LEVELS){
 const config={theta,sigma,x0};moments.push({config,result:c.moments(config,2**level)});
}
for(const seed of c.SEEDS)for(const theta of [0,1.15,4,5])for(const sigma of [0,.85])for(const horizon of [.5,2]){
 const config={seed,theta,sigma,horizon,x0:theta===4?0:-1.4,level:2,path:255};cases.push(c.simulate(config));
}
for(const x of [0,1e-300,1e-100,1e-20,1e-8,.001,.099999,.1,.5,1,2,5,10,20])kernels.push({x,result:c.kernel(x)});
for(const seed of [0,107,4294967295]){const r=c.rng(seed);rngs.push({seed,values:Array.from({length:512},()=>r())});}
class Node{constructor(tag){this.tag=tag;this.attrs={};this.children=[];}setAttribute(k,v){this.attrs[k]=String(v);}appendChild(n){this.children.push(n);}}
const doc={createElementNS:(_,tag)=>new Node(tag)};
for(const preset of c.PRESETS.concat([{values:{theta:0,sigma:1.5,horizon:.5,x0:-2,level:8}}]))for(const seed of c.SEEDS){const data=c.simulate({...preset.values,seed,path:255});plots.push({data,path:c.drawPath(doc,data),hist:c.drawHistogram(doc,data),error:c.drawErrors(doc,data)});}
let strict=0;function reject(f){assert.throws(f);strict++;}
for(const bad of [null,'1',NaN,Infinity,-1]){reject(()=>c.config({theta:bad}));reject(()=>c.config({sigma:bad}));}
for(const input of [null,[],1,{theta:5.1},{sigma:1.51},{path:256},{path:.5},{level:1},{level:9},{level:2.5},{seed:-1},{seed:2**32},{seed:1.5},{horizon:0},{x0:3},{extra:1}])reject(()=>c.config(input));
reject(()=>c.normal(()=>0));reject(()=>c.normal(()=>1));reject(()=>c.normal(()=>'.5'));reject(()=>c.moments({},0));reject(()=>c.moments({},257));reject(()=>c.moments({},1.5));
console.log(JSON.stringify({moments,cases,plots,kernels,rngs,strict,self:c.selfTest()}));
"""
data=json.loads(subprocess.check_output((['rtk','proxy']if shutil.which('rtk')else[])+['node','-e',JS],cwd=ROOT,text=True))
checks=0
def ok(v,label):
    global checks
    checks+=1
    if not v:raise AssertionError(label)
def near(a,b,rtol=4e-11,atol=4e-12):
    a=float(a);b=float(b)
    ok(a==b or abs(a-b)<=max(atol,rtol*abs(b)),f'{a} vs {b}')
def dc(x):return D.from_float(x)
with localcontext()as ctx:
    # Direct exp/subtract/divide loses roughly three times the tiny x exponent.
    # The independent reference therefore needs >900 digits at x=1e-300.
    ctx.prec=1060
    for k in data['kernels']:
        x=dc(k['x'])
        c=(1-(-x).exp())/x if x else D(1)
        q=(1-(-2*x).exp())/(2*x)-c*c if x else D(0)
        near(k['result']['c'],c,rtol=3e-14,atol=0)
        near(k['result']['loss'],1-c,rtol=5e-14,atol=0)
        near(k['result']['bridge'],q.sqrt(),rtol=8e-14,atol=0)
    ctx.prec=460
    for item in data['moments']:
        c={'horizon':2,**item['config']};r=item['result'];n=r['steps']
        theta=dc(c['theta']);sigma=dc(c['sigma']);x0=dc(c['x0']);T=dc(c['horizon']);h=T/n;x=theta*h;A=1-x;E=(-x).exp()
        cn=(1-E)/x if x else D(1)
        mean=x0*A**n;exactmean=x0*(-theta*T).exp();bias=mean-exactmean
        geom=D(1)+sum((A**(2*j) for j in range(1,n)),D(0))
        var=sigma*sigma*h*geom
        exactvar=sigma*sigma*(1-(-2*theta*T).exp())/(2*theta)if theta else sigma*sigma*T
        cross=sigma*sigma*h*cn*(D(1)+sum(((A*E)**j for j in range(1,n)),D(0)))
        strong2=bias*bias+var+exactvar-2*cross
        if abs(strong2)<D('1e-450'):strong2=D(0)
        for key,v in [('mean',mean),('exactMean',exactmean),('bias',bias),('weak',abs(bias)),('variance',var),('wrongVariance',h*var),('exactVariance',exactvar),('strong',strong2.sqrt())]:
            near(r[key],v,rtol=1e-10,atol=0)
MASK=2**32-1
def uniforms(seed):
    while True:
        seed=(seed+0x6D2B79F5)&MASK;t=seed;t=((t^(t>>15))*(t|1))&MASK;t=(t^((t+(((t^(t>>7))*(t|61))&MASK))&MASK))&MASK
        yield (((t^(t>>14))&MASK)+.5)/2**32
for item in data['rngs']:
    gen=uniforms(item['seed'])
    for v in item['values']:ok(v==next(gen)and 0<v<1,'open uniform bit-for-bit')
rawcache={}
def raw(seed):
    if seed not in rawcache:
        result=[]
        for j in range(256):
            g=uniforms((seed+j*7919)&MASK);z=[];w=[]
            for i in range(256):
                z.append(math.sqrt(-2*math.log(next(g)))*math.cos(2*math.pi*next(g)))
                w.append(math.sqrt(-2*math.log(next(g)))*math.cos(2*math.pi*next(g)))
            result.append((z,w))
        rawcache[seed]=result
    return rawcache[seed]
def popvar(vals):
    m=math.fsum(vals)/len(vals)
    return math.fsum((v-m)**2 for v in vals)/len(vals)
for item in data['cases']:
    c=item['config'];theta=c['theta'];sigma=c['sigma'];T=c['horizon'];dt=T/256;x=theta*dt;E=math.exp(-x)
    with localcontext()as ctx:
        ctx.prec=60
        xd=dc(theta)*dc(dt);ed=(-xd).exp()
        cd=(1-ed)/xd if xd else D(1)
        qd=(1-(-2*xd).exp())/(2*xd)-cd*cd if xd else D(0)
        cc=float(cd);bridge=float(qd.sqrt())
    paths=[];dwpaths=[]
    for z,w in raw(c['seed']):
        dw=[math.sqrt(dt)*v for v in z];values=[c['x0']];stochastic=0
        for j in range(256):
            stochastic=E*stochastic+sigma*(cc*dw[j]+math.sqrt(dt)*bridge*w[j])
            values.append(c['x0']*math.exp(-theta*(j+1)*dt)+stochastic)
        paths.append(values);dwpaths.append(dw)
    exact=[p[-1]for p in paths]
    for a,b in zip(item['exact'],exact):near(a,b)
    for r in item['rows']:
        n=r['steps'];block=256//n;h=T/n;A=1-theta*h;numeric=[];wrong=[]
        for j,dw in enumerate(dwpaths):
            em=c['x0'];bad=c['x0'];empath=[em];badpath=[bad]
            for k in range(n):
                inc=math.fsum(dw[k*block:(k+1)*block]);em=A*em+sigma*inc;bad=A*bad+sigma*math.sqrt(h)*inc;empath.append(em);badpath.append(bad)
            numeric.append(em);wrong.append(bad)
            near(r['numeric'][j],em);near(r['wrong'][j],bad);near(r['exact'][j],exact[j])
            if j==c['path']:
                for key,vals in [('numeric',empath),('wrong',badpath),('exact',paths[j][::block])]:
                    for a,b in zip(r['trace'][key],vals):near(a,b)
        diffs=[a-b for a,b in zip(numeric,exact)]
        for key,v in [('sampleMean',math.fsum(numeric)/256),('sampleVariance',popvar(numeric)),('wrongSampleVariance',popvar(wrong)),('sampleRMS',math.hypot(*diffs)/16),('pairedMean',math.fsum(diffs)/256),('pairedSE',math.sqrt(popvar(diffs)/255))]:near(r[key],v)
def nodes(n):
    yield n
    for ch in n['children']:yield from nodes(ch)
def coords(d):return[(float(x),float(y))for x,y in re.findall(r'[ML]([-\d.e+]+) ([-\d.e+]+)',d)]
for item in data['plots']:
    d=item['data'];r=d['selected'];c=d['config'];svg=item['path'];lo=float(svg['attrs']['data-min']);hi=float(svg['attrs']['data-max'])
    ps=[n for n in nodes(svg)if n['tag']=='path'];ok(len(ps)==4,'four complete path curves')
    for n in ps:
        key=n['attrs']['class'][3:];vals=r['trace'][key]if key!='mean'else[c['x0']*math.exp(-c['theta']*j*r['h'])for j in range(r['steps']+1)]
        points=coords(n['attrs']['d']);ok(len(points)==len(vals),'every path vertex')
        for j,((x,y),v)in enumerate(zip(points,vals)):
            near(x,80+760*j/(len(vals)-1),atol=1e-9);near(y,280-(v-lo)*240/(hi-lo),atol=1e-9);ok(40-1e-9<=y<=280+1e-9,'all values within plot')
    svg=item['hist'];lo=float(svg['attrs']['data-min']);hi=float(svg['attrs']['data-max']);ym=float(svg['attrs']['data-count-max']);width=(hi-lo)/24
    for k,key in enumerate(['numeric','wrong','exact']):
        counts=[0]*24
        for v in r[key]:
            ok(lo<=v<=hi,'histogram input inside actual bounds')
            counts[min(23,math.floor((v-lo)/width))]+=1
        bars=[n for n in nodes(svg)if n['tag']=='rect'and n['attrs']['class']=='ou-'+key];ok(len(bars)==24 and sum(counts)==256,'full histogram mass')
        for j,(bar,count)in enumerate(zip(bars,counts)):
            a=bar['attrs'];near(a['x'],80+32*j+1+10*k);near(a['width'],9);near(a['height'],230*count/ym);near(a['y'],275-230*count/ym);ok(int(a['data-count'])==count,'reported count')
    svg=item['error'];lo=float(svg['attrs']['data-log-min']);hi=float(svg['attrs']['data-log-max'])
    for key in ['sampleRMS','strong','weak']:
        marks=[n for n in nodes(svg)if n['tag']=='circle'and n['attrs']['data-series']==key];positive=[(j,r)for j,r in enumerate(d['rows'])if r[key]>0]
        ok(len(marks)==len(positive),'no artificial positive errors')
        for mark,(j,row)in zip(marks,positive):near(mark['attrs']['cx'],80+760*j/6,atol=1e-9);near(mark['attrs']['cy'],275-(math.log10(row[key])-lo)*230/(hi-lo),atol=1e-9)
for n in ET.parse(ROOT/'math-course/images/sde-02-diffusion.svg').iter():
    key=n.get('data-series')
    if key in ['exact','euler']:
        pts=coords(n.get('d'));ok(len(pts)==201,'every static multiplier vertex')
        for j,(x,y)in enumerate(pts):
            t=j/80;value=math.exp(-t)if key=='exact'else 1-t
            near(x,100+700*t/2.5,atol=1e-9);near(y,280-160*(value+1.5)/2.5,atol=1e-9)
    if key in ['em-var','wrong-var']:
        steps=int(n.get('data-n'));h=1/steps;var=h*sum((1-h)**(2*j)for j in range(steps))
        if key=='wrong-var':var*=h
        near(n.get('cx'),100+700*math.log2(steps)/8,atol=1e-9);near(n.get('cy'),620-170*var,atol=1e-9)
source=(ROOT/'course-shared/labs/sde-path-distribution.js').read_bytes()
for course in ['math-course','grad-math','ai-course']:ok((ROOT/course/'site/assets/learning/labs/sde-path-distribution.js').read_bytes()==source,'tracked mirror')
lecture=(ROOT/'math-course/lectures/sde-02-sde-diffusion.md').read_text()
ok(re.search(r'x_0e\^\{-\\theta t\}\s*\+\\sigma\\int',lecture),'OU solution additive noise term')
ok(re.search(r'X_k\^h\+b\(t_k,X_k\^h\)h\s*\+a\(t_k,X_k\^h\)',lecture),'EM adds diffusion term')
ok(r'f(t,X_t)-\frac12g(t)^2\nabla\log p_t(X_t)'in lecture,'probability flow score sign and half factor')
print(f"OU diffusion PASS: {checks} checks, {len(data['cases'])} ensembles, {len(data['moments'])} Decimal moments, {len(data['plots'])} complete plot sets, {data['strict']} strict failures, {data['self']['checks']} self-checks")
