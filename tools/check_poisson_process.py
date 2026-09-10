"""Independent uint32 replay, Decimal waiting times, rational moments and plot geometry."""
from pathlib import Path
from decimal import Decimal as D,localcontext
from fractions import Fraction as F
import json,math,re,shutil,subprocess,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
JS=r"""
const c=require('./course-shared/labs/poisson-process.js'),a=require('assert'),cases=[],plots=[],rngs=[],masses=[];
const seeds=[0,1,7,20260822,4294967295];
for(const seed of seeds){const rng=c.makeRng(seed);rngs.push({seed,values:Array.from({length:128},()=>rng())});}
for(const lambda of [.1,.5,2,8,20])for(const horizon of [0,1,4,20])for(const repetitions of [2,40,180]){
 const config={lambda,horizon,repetitions,seed:seeds[cases.length%seeds.length]},result=c.simulate(config);cases.push(result);
}
for(const lambda of [.1,2,20])for(const horizon of [Number.MIN_VALUE,1e-320,1e-300])for(const repetitions of [2,1000]){
 const r=c.simulate({lambda,horizon,repetitions,seed:1});
 a(r.countMeanSE>0);cases.push(r);
}
class N{constructor(tag,attrs,children){this.tag=tag;this.attrs={};for(const[k,v]of Object.entries(attrs||{}))this.attrs[k==='className'?'class':k]=v;this.children=(Array.isArray(children)?children:children===undefined?[]:[children]).map(v=>typeof v==='string'?new N('#text',{text:v}):v);}}
const api={svg:(tag,attrs,children)=>new N(tag,attrs,children)};
for(const config of [c.DEFAULTS,{lambda:.5,horizon:1,repetitions:40,seed:0},{lambda:8,horizon:12,repetitions:180,seed:7},{lambda:.1,horizon:0,repetitions:2,seed:1}]){
 const result=c.simulate(config);plots.push({result,path:c.chart(api,null,result,'t'+plots.length),hist:c.histogramChart(api,null,result,'h'+plots.length)});
}
for(const rate of [0,Number.MIN_VALUE,1e-12,.1,1,8,96,400])for(const k of [0,1,2,8,20,100,400,800,2048])masses.push({k,rate,value:c.poissonPmf(k,rate)});
let strict=0;
for(const bad of [null,'0',NaN,Infinity,-1,4294967296,1.5]){a.throws(()=>c.makeRng(bad));strict++;}
for(const bad of [0,1,-.1,1.1,NaN,Infinity,'0.5',null]){a.throws(()=>c.exponential(()=>bad,2));strict++;}
for(const key of ['lambda','horizon','repetitions','seed'])for(const bad of [null,'1',NaN,Infinity,-1]){a.throws(()=>c.simulate({...c.DEFAULTS,[key]:bad}));strict++;}
for(const [key,bad]of [['lambda',0],['lambda',21],['horizon',21],['repetitions',1],['repetitions',1001],['repetitions',2.5],['seed',.5]]){a.throws(()=>c.simulate({...c.DEFAULTS,[key]:bad}));strict++;}
a.throws(()=>c.simulatePath(1,1,()=>Math.exp(-.1),2));strict++;
let j=0;a.throws(()=>c.simulatePath(20,2,()=>j++===0?Math.exp(-20):1-Number.EPSILON/2));strict++;
for(const [k,r]of [[-1,1],[1.5,1],[2049,1],[0,-1],[0,401]]){a.throws(()=>c.poissonPmf(k,r));strict++;}
a.equal(c.format(80,0),'80');a.equal(c.format(180,0),'180');a.notEqual(c.format(1e-20),'0');a.equal(c.format(null),'未定义');a(Object.isFrozen(c.DEFAULTS));
const boundary=c.simulatePath(1,1,()=>Math.exp(-1));a.deepEqual(boundary,[1]);
console.log(JSON.stringify({cases,plots,rngs,masses,strict,self:c.selfTest()}));
"""
data=json.loads(subprocess.check_output((['rtk','proxy']if shutil.which('rtk')else[])+['node','-e',JS],cwd=ROOT,text=True))
checks=0;draws=0
def ok(test,msg):
    global checks
    checks+=1
    if not test:raise AssertionError(msg)
def near(a,b,rtol=8e-13,atol=5e-323,msg='number'):
    a=float(a);b=float(b)
    ok(math.isfinite(a)and abs(a-b)<=max(abs(b)*rtol,atol),f'{msg}: {a} versus {b}')
def uniforms(seed):
    mask=2**32-1;state=seed
    while True:
        state=(state+1831565813)&mask
        v=((state^(state>>15))*(1|state))&mask
        v=((v+((v^(v>>7))*(61|v)&mask))^v)&mask
        yield ((v^(v>>14))+.5)/2**32
def average(v):return sum(v)/len(v)
def variance(v):
    m=average(v);return sum((x-m)**2 for x in v)/(len(v)-1)
def covariance(v,w):
    m,n=average(v),average(w);return sum((x-m)*(y-n)for x,y in zip(v,w))/(len(v)-1)
def pmf(k,rate):
    if rate==0:return D(1)if k==0 else D(0)
    return (-rate).exp()*rate**k/D(math.factorial(k))
with localcontext()as ctx:
    ctx.prec=100
    for row in data['rngs']:
        u=uniforms(row['seed'])
        for v in row['values']:ok(v==next(u)and 0<v<1,'open-grid uint32 PRNG replay')
    for result in data['cases']+[p['result']for p in data['plots']]:
        c=result['config'];lam=D.from_float(float(c['lambda']));T=D.from_float(float(c['horizon']));R=c['repetitions'];rng=uniforms(c['seed'])
        first=[];second=[];counts=[];waits=[];first_path=None
        def wait():
            global draws
            draws+=1
            return -D.from_float(next(rng)).ln()/lam
        for j in range(R):
            times=[];t=D(0)
            while True:
                t+=wait()
                if t>T:break
                times.append(t)
            if first_path is None:first_path=times
            n=sum(t<=T/2 for t in times);first.append(n);second.append(len(times)-n);counts.append(len(times));waits.append(wait())
        ok(result['fullCounts']==counts and result['firstHalf']==first and result['secondHalf']==second,'all replication counts and disjoint intervals')
        ok(len(result['firstPath'])==len(first_path),'first path count')
        for a,b in zip(result['firstPath'],first_path):near(a,b,msg='Decimal event time')
        for a,b in zip(result['waits'],waits):near(a,b,msg='uncensored separate wait')
        countsF=list(map(F,counts));firstF=list(map(F,first));secondF=list(map(F,second))
        for key,ref in [('empiricalFull',average(countsF)),('empiricalHalf',average(firstF)),('empiricalSecondHalf',average(secondF)),('empiricalVariance',variance(countsF)),('incrementCovariance',covariance(firstF,secondF)),('meanWait',average(waits))]:
            near(result[key],ref,atol=1e-12,msg=key)
        for key,ref in [('expectedFull',lam*T),('expectedHalf',lam*T/2),('expectedWait',1/lam),('countMeanSE',(lam*T/D(R)).sqrt()),('waitMeanSE',1/(lam*D(R).sqrt()))]:
            near(result[key],ref,msg=key)
        u=D.from_float(.4)/lam;v=D.from_float(.6)/lam
        su=sum(w>u for w in waits);suv=sum(w>u+v for w in waits);sv=sum(w>v for w in waits)
        ok([result[k]for k in ['survivesU','survivesUV','survivesV']]==[su,suv,sv],'conditional denominator and both numerators')
        if su:near(result['memorylessConditional'],F(suv,su),msg='conditional frequency')
        else:ok(result['memorylessConditional']is None,'no survivors means undefined')
        near(result['memorylessTail'],F(sv,R),msg='unconditional frequency')
        near(result['memorylessTheoretical'],(-D.from_float(.6)).exp(),msg='theoretical conditional tail')
        h=result['histogram'];ok(h['cutoff']==max(counts),'cutoff is actual maximum')
        total=D(0);rate=D.from_float(float(c['lambda'])*float(c['horizon']))
        for bin in h['bins']:
            k=bin['k'];ref=pmf(k,rate);total+=ref
            ok(bin['count']==counts.count(k),'histogram count')
            near(bin['empirical'],F(counts.count(k),R),msg='histogram relative frequency');near(bin['theory'],ref,msg='theory bin')
        near(h['tail'],1-total,atol=2e-95,msg='retained theoretical tail')
        ok(sum(b['count']for b in h['bins'])==R and h['tailEmpirical']==0,'no sample dropped')
    for r in data['masses']:near(r['value'],pmf(r['k'],D.from_float(float(r['rate']))),rtol=3e-12,msg='independent Poisson PMF')
    # Exact/count identities and explicit counterexamples.
    for lam in [D('.1'),D(2),D(4),D(20)]:
        for t in [D('.01'),D('.5'),D(1),D(5)]:
            q=lam*t;ok(abs(((-q).exp()*q)-pmf(1,q))<D('1e-95'),'one-count identity')
            conditional=1/lam-t/((lam*t).exp()-1);ok(0<conditional<1/lam,'truncation selects shorter waits')
    for n in range(21):
        probs=[F(math.comb(n,k),2**n)for k in range(n+1)]
        ex=sum(F(k)*probs[k]for k in range(n+1));ex2=sum(F(k*k)*probs[k]for k in range(n+1))
        ok(ex2-ex*ex==F(n,4),'conditional half-count variance')
        ok(sum(F(k*(n-k))*probs[k]for k in range(n+1))-ex*(n-ex)==F(-n,4),'conditional covariance')
    for n1 in range(6):
        for n2 in range(6):
            # Ordered simplex volumes and Poisson sum/binomial splitting give the same joint law.
            a=D(2);b=D(3)
            lhs=pmf(n1+n2,a+b)*D(math.comb(n1+n2,n1))*(a/(a+b))**n1*(b/(a+b))**n2
            ok(abs(lhs-pmf(n1,a)*pmf(n2,b))<D('1e-95'),'independent splitting identity')
def walk(n):
    yield n
    for v in n['children']:yield from walk(v)
for p in data['plots']:
    r=p['result'];T=r['config']['horizon'];maximum=max(1,len(r['firstPath'])+1)
    mx=lambda t:70+690*t/(T or 1);my=lambda n:55+(maximum-n)*235/maximum
    nodes=list(walk(p['path']));limits=[n for n in nodes if n['attrs'].get('class')=='pp-left-limit'];values=[n for n in nodes if n['attrs'].get('class')=='pp-event']
    ok(len(limits)==len(values)==len(r['firstPath']),'both sides of every jump')
    for arr,offset in [(limits,0),(values,1)]:
        for j,n in enumerate(arr):
            a=n['attrs'];near(a['cx'],mx(r['firstPath'][j]),atol=1e-10,msg='jump x');near(a['cy'],my(j+offset),atol=1e-10,msg='jump y');ok(a['data-count']==j+offset,'right continuity labels')
    path=next(n for n in nodes if n['attrs'].get('class')=='pp-path')['attrs']['d'];coords=re.findall(r'[ML]([-\d.e+]+) ([-\d.e+]+)',path)
    pts=[(0,0)]+[(t,j+offset)for j,t in enumerate(r['firstPath'])for offset in [0,1]]+[(T,len(r['firstPath']))]
    ok(len(coords)==len(pts),'full stair points')
    for (x,y),(t,k)in zip(coords,pts):near(x,mx(t),atol=1e-10);near(y,my(k),atol=1e-10)
    hist=p['hist'];maxprob=hist['attrs']['data-prob-max'];bins=r['histogram']['bins'];bw=690/(len(bins)+1)
    for n in walk(hist):
        a=n['attrs'];cls=a.get('class')
        if cls in ['pp-hist-empirical','pp-hist-theory']:
            k=a['data-k'];j=len(bins)if k=='tail'else k;theory=cls=='pp-hist-theory'
            value=(r['histogram']['tail']if theory else 0)if k=='tail'else bins[k]['theory'if theory else'empirical']
            near(a['data-value'],value,msg='bar data');near(a['x'],70+bw*(j+.1+.4*int(theory)),atol=1e-10)
            near(a['y'],295-220*value/maxprob,atol=1e-10);near(a['height'],220*value/maxprob,atol=1e-10)
    for n in nodes+list(walk(hist)):ok('NaN'not in str(n['attrs'])and'Infinity'not in str(n['attrs']),'finite plotted geometry')
tree=ET.parse(ROOT/'math-course/images/stoch-01-poisson-process.svg')
rng=uniforms(20260822);events=[];t=0.
while True:
    t-=math.log(next(rng))/2
    if t>4:break
    events.append(t)
for n in tree.iter():
    if n.get('data-event')is not None:
        i=int(n.get('data-event'));k=int(n.get('data-count'));near(n.get('data-time'),events[i],atol=1e-14)
        near(n.get('cx'),80+100*events[i],atol=1e-8);near(n.get('cy'),465-340*k/(len(events)+1),atol=1e-8)
    if n.get('data-k')is not None:
        k=n.get('data-k');value=float(n.get('data-prob'))
        ref=math.fsum(math.exp(-8)*8.**j/math.factorial(j)for j in range(21,121))if k=='tail'else math.exp(-8)*8**int(k)/math.factorial(int(k))
        near(value,ref);near(n.get('height'),340*value/.16,atol=1e-8);near(n.get('y'),465-340*value/.16,atol=1e-8)
print(f'Poisson independent PASS: {checks} checks, {len(data["cases"])} simulation cases, {draws} replayed draws, {len(data["plots"])} plots, {len(data["masses"])} PMF cases, {data["strict"]} strict failures, {data["self"]["checks"]} self-tests')
