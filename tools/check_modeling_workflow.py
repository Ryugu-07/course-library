"""Independent high-precision calibration and complete plot-coordinate checks."""
from pathlib import Path
from decimal import Decimal as D, localcontext
from fractions import Fraction as F
import json, math, re, shutil, subprocess, xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
JS=r"""
const c=require('./course-shared/labs/modeling-workflow.js'),assert=require('assert'),models=[],cases=[],plots=[];
for(const kind of ['logistic','exponential'])for(let n=3;n<=8;n++)for(const search of [4,12]){
 const model=c.fitModel(kind,n,search);models.push({kind,n,search,model});
 for(let horizon=2;horizon<=14;horizon++)for(let j=0;j<=8;j++){
  const config={kind,n,search,horizon,sensitivity:(16+j)/20},r=c.compute(config);
  cases.push({config,training:r.trainingRmse,validation:r.validationRmse,future:r.future,low:r.low,high:r.high,rows:r.rows});
 }
 if(n===3||n===5||n===8)for(const horizon of [2,14])for(const sensitivity of [.8,1]){
  const config={kind,n,search,horizon,sensitivity},r=c.compute(config);
  plots.push({config,forecast:c.renderSvg(r),residual:c.residualSvg(r),profile:c.profileSvg(r)});
 }
}
let strict=0;function reject(f){assert.throws(f);strict++}
for(const n of [null,'5',NaN,Infinity,-1,2,9,3.5])reject(()=>c.fitLogistic(n));
for(const kind of [null,'bad',0])reject(()=>c.fitModel(kind,5));
for(const search of [null,'4',0,5,NaN])reject(()=>c.fitLogistic(5,search));
for(const horizon of [null,'8',NaN,1,15,2.5])reject(()=>c.compute({...c.DEFAULTS,horizon}));
for(const sensitivity of [null,'1',NaN,.79,1.21])reject(()=>c.compute({...c.DEFAULTS,sensitivity}));
for(const t of [null,'1',NaN,Infinity,-1,24])reject(()=>c.fitExponential(5).predict(t));
assert.equal(c.format(120,0),'120');assert.equal(c.format(0,0),'0');
console.log(JSON.stringify({models,cases,plots,strict,self:c.selfTest()}));
"""
data=json.loads(subprocess.check_output((['rtk','proxy']if shutil.which('rtk')else[])+['node','-e',JS],cwd=ROOT,text=True))
DATA=list(map(D,[120,148,182,220,260,302,345,381,410,430]));checks=0
def ok(v,msg):
    global checks
    checks+=1
    if not v:raise AssertionError(msg)
def near(a,b,rtol=3e-11,atol=1e-9):
    a=float(a);b=float(b);ok(math.isfinite(a)and math.isfinite(b)and abs(a-b)<=max(atol,rtol*abs(b)),f'{a} versus {b}')
def line(values):
    n=len(values);xm=D(n-1)/2;ym=sum(values)/n
    slope=sum((D(i)-xm)*(y-ym)for i,y in enumerate(values))/sum((D(i)-xm)**2 for i in range(n))
    return ym-slope*xm,slope
def logistic(K,C,r,t):return K/(1+C*(-r*t).exp())
def fit(kind,n,search):
    ys=DATA[:n]
    if kind=='exponential':
        b,r=line([y.ln()for y in ys]);A=b.exp()
        return dict(A=A,r=r,predict=lambda t:A*(r*t).exp(),profile=[])
    lo=D.from_float(float(ys[-1])*1.02);hi=max(ys[-1]*search,ys[-1]+400)
    best=None;profile=[]
    for j in range(361):
        # The public algorithm evaluates the candidate grid in binary64.
        # Lift each actual grid value exactly; all fitting algebra is independent Decimal.
        K=D.from_float(float(lo)+(float(hi)-float(lo))*j/360)
        b,slope=line([(K/y-1).ln()for y in ys]);C=b.exp();r=-slope
        sse=sum((y-logistic(K,C,r,D(i)))**2 for i,y in enumerate(ys))
        profile.append((K,sse))
        if best is None or sse<best['sse']:best=dict(K=K,C=C,r=r,sse=sse,index=j)
    K,C,r=best['K'],best['C'],best['r'];best['predict']=lambda t:logistic(K,C,r,t);best['profile']=profile
    return best
def forecasts(m,kind,t,f):
    factors=[min(f,2-f),max(f,2-f)]
    if kind=='exponential':return[m['A']*(m['r']*v*t).exp()for v in factors]
    N0=m['predict'](D(0))
    return[logistic(m['K']*v,m['K']*v/N0-1,m['r'],t)for v in factors]
refs={}
with localcontext()as ctx:
    ctx.prec=70
    for item in data['models']:
        kind,n,search=item['kind'],item['n'],item['search'];m=fit(kind,n,search);refs[kind,n,search]=m;js=item['model']
        sse=sum((y-m['predict'](D(i)))**2 for i,y in enumerate(DATA[:n]))
        near(js['sse'],sse,atol=2e-9)
        if kind=='exponential':near(js['A'],m['A']);near(js['growth'],m['r'])
        else:
            for key in ['K','C']:near(js[key],m[key])
            near(js['rate'],m['r']);ok(js['bestIndex']==m['index'],'actual minimum candidate')
            ok(js['boundary']==(m['index']in[0,360]),'boundary flag')
            for p,(K,sse)in zip(js['profile'],m['profile']):near(p['K'],K);near(p['sse'],sse,atol=2e-8);near(p['rmse'],(sse/n).sqrt())
    for item in data['cases']:
        c=item['config'];kind,n,search=c['kind'],c['n'],c['search'];m=refs[kind,n,search];predict=m['predict'];T=D(9+c['horizon'])
        train=sum((y-predict(D(i)))**2 for i,y in enumerate(DATA[:n]));test=sum((DATA[i]-predict(D(i)))**2 for i in range(n,10))
        near(item['training'],(train/n).sqrt());near(item['validation'],(test/(10-n)).sqrt());near(item['future'],predict(T))
        low,high=forecasts(m,kind,T,D.from_float(c['sensitivity']))
        near(item['low'],low);near(item['high'],high)
        ok(item['low']<=item['future']*(1+1e-14)<=item['high']*(1+2e-14),'monotone scenario endpoints')
        for i,row in enumerate(item['rows']):
            ok(row['time']==i and row['actual']==DATA[i]and row['training']==(i<n),'all observations and roles')
            near(row['predicted'],predict(D(i)));near(row['residual'],DATA[i]-predict(D(i)))
    def parse(s):return ET.fromstring(s)
    def coords(path):return[(float(x),float(y))for x,y in re.findall(r'[ML]([-\d.e+]+) ([-\d.e+]+)',path)]
    for item in data['plots']:
        c=item['config'];kind,n,search=c['kind'],c['n'],c['search'];m=refs[kind,n,search];end=D(9+c['horizon'])
        root=parse(item['forecast']);maxY=float(root.get('data-max-y'));X=lambda t:80+730*float(t)/float(end);Y=lambda y:315-245*float(y)/maxY
        for node in root.iter():
            if node.tag=='path':
                name=node.get('data-series');pts=coords(node.get('d'));ok(len(pts)==161,'all forecast vertices')
                for i,(x,y)in enumerate(pts):
                    t=D.from_float(float(end)*i/160)
                    value=m['predict'](t)if name=='fit'else forecasts(m,kind,t,D.from_float(c['sensitivity']))[0 if name=='lower'else 1]
                    near(x,X(t));near(y,Y(value),atol=1e-8)
            if node.tag=='circle':
                t=int(node.get('data-time'));near(node.get('cx'),X(t));near(node.get('cy'),Y(DATA[t]))
        root=parse(item['residual']);maximum=float(root.get('data-max-abs'))
        for node in root.iter('circle'):
            t=int(node.get('data-time'));res=DATA[t]-m['predict'](D(t))
            near(node.get('data-value'),res);near(node.get('cx'),80+730*t/9);near(node.get('cy'),170-105*float(res)/maximum,atol=1e-8)
        if kind=='logistic':
            root=parse(item['profile']);maxY=float(root.get('data-max-y'));lo=float(root.get('data-min-k'));hi=float(root.get('data-max-k'))
            pts=coords(next(root.iter('path')).get('d'));ok(len(pts)==361,'all capacity vertices')
            for (x,y),(K,sse)in zip(pts,m['profile']):
                near(x,80+730*(float(K)-lo)/(hi-lo));near(y,250-180*float((sse/n).sqrt())/maxY,atol=1e-8)
    root=ET.parse(ROOT/'math-course/images/model-01-modeling-cycle.svg')
    for node in root.iter():
        if node.tag.endswith('path')and node.get('data-search'):
            search=int(node.get('data-search'));m=refs['logistic',3,search];pts=coords(node.get('d'));ok(len(pts)==161,'static full curve')
            for i,(x,y)in enumerate(pts):
                t=D(17)*i/160;near(x,80+590*float(t)/17);near(y,470-330*float(m['predict'](t))/1800,atol=1e-8)
        if node.tag.endswith('circle'):
            t=int(node.get('data-time'));near(node.get('cx'),80+590*t/17);near(node.get('cy'),470-330*float(DATA[t])/1800)
    # Differentiate the fixed-initial-value capacity formula independently.
    for K in [300,600,2000]:
        for t in [0,.1,1,10]:
            K=D(K);t=D(str(t));q=(-D('.3')*t).exp();N0=D(120);den=1+(K/N0-1)*q;delta=D('1e-20')
            f=lambda k:k/(1+(k/N0-1)*q)
            near((f(K+delta)-f(K-delta))/(2*delta),(1-q)/(den*den),atol=1e-30,rtol=1e-25)
# Dimension matrix null vectors, including rank-deficient M,L,T example.
matrix=[[0,0,0,1,0],[0,1,1,0,0],[1,0,-2,0,0]]
for vector in [[1,F(-1,2),F(1,2),0,0],[0,0,0,0,1]]:
    ok(all(sum(a*b for a,b in zip(row,vector))==0 for row in matrix),'pendulum Pi group')
ok(all(sum(a*b for a,b in zip(row,[1,-1,-1]))==0 for row in [[0,0,0],[1,1,0],[0,-1,1]]),'motion Pi group')
source=(ROOT/'course-shared/labs/modeling-workflow.js').read_bytes()
for course in ['math-course','grad-math','ai-course']:ok((ROOT/course/'site/assets/learning/labs/modeling-workflow.js').read_bytes()==source,'identical mirrors')
print(f'Modeling reference PASS: {checks} checks, {len(data["models"])} fits, {len(data["cases"])} configurations, {len(data["plots"])} plot sets, {data["strict"]} strict failures, {data["self"]["checks"]} self-tests')
