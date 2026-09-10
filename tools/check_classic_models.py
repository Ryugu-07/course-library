"""Independent Decimal Taylor-series SIR, analytic models and SVG geometry."""
from pathlib import Path
from decimal import Decimal as D, localcontext
import json, math, re, shutil, subprocess, xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
JS=r"""
const c=require('./course-shared/labs/classic-models.js'),assert=require('assert'),growth=[],sir=[],queue=[],plots=[];
for(const rate of [0,.1,.35,1.2])for(const capacity of [300,600,1000])for(const initial of [0,80,600,1200,1500])for(const horizon of [0,1,10,20]){
const p={rate,capacity,initial,horizon};growth.push({p,points:c.growthPoints(rate,capacity,initial,horizon)});
}
for(const beta of [.1,.6,1.5])for(const gamma of [.05,.2,.8])for(const initial of [0,.02,.2])for(const removed of [0,.8]){
const p={beta,gamma,initial,removed,horizon:80};sir.push({p,result:c.sirAnalyze(beta,gamma,initial,80,removed)});
}
sir.push({p:{beta:.625,gamma:.5,initial:.2,removed:0,horizon:0},result:c.sirAnalyze(.625,.5,.2,0,0)});
sir.push({p:{beta:1,gamma:.5,initial:.2,removed:.3,horizon:0},result:c.sirAnalyze(1,.5,.2,0,.3)});
for(let a=0;a<=28;a++)for(let m=10;m<=30;m++)queue.push({arrival:a/20,service:m/20,result:c.queueMetrics(a/20,m/20)});
for(const [arrival,service]of[[0,Number.MIN_VALUE],[Number.MIN_VALUE,Number.MIN_VALUE*2],[1e-300,1e-299],[1e150,1e151],[1-Number.EPSILON,1],[1.15-Number.EPSILON,1.15],[Number.MAX_VALUE,Number.MIN_VALUE]])
queue.push({arrival,service,result:c.queueMetrics(arrival,service)});
for(const kind of Object.keys(c.PRESETS))for(const preset of c.PRESETS[kind]){
const p=preset.values;plots.push({kind,p,svg:kind==='growth'?c.renderGrowthSvg(p):kind==='sir'?c.renderSirSvg(c.sirPoints(p.beta,p.gamma,p.initial,p.horizon,p.removed)):c.renderQueueSvg(p.arrival,p.service)});
}
let strict=0;function reject(f){assert.throws(f);strict++}
for(const bad of [null,'1',NaN,Infinity,-1]){reject(()=>c.logisticValue(bad,.35,600,80));reject(()=>c.queueMetrics(bad,1));reject(()=>c.sirPoints(.6,.2,bad,40));}
reject(()=>c.queueMetrics(.8,0));reject(()=>c.sirPoints(.6,.2,.02,40,0,0));reject(()=>c.logisticValue(1,.35,0,80));
console.log(JSON.stringify({growth,sir,queue,plots,strict,self:c.selfTest()},(k,v)=>typeof v==='number'&&!Number.isFinite(v)?String(v):v));
"""
data=json.loads(subprocess.check_output((['rtk','proxy']if shutil.which('rtk')else[])+['node','-e',JS],cwd=ROOT,text=True));checks=0
def ok(v,msg):
    global checks
    checks+=1
    if not v:raise AssertionError(msg)
def near(a,b,rtol=4e-12,atol=1e-11):
    a=float(a);b=float(b);ok(a==b or(math.isfinite(a)and math.isfinite(b)and abs(a-b)<=max(atol,rtol*abs(b))),f'{a} versus {b}')
def dec(v):return D.from_float(float(v))
def growth(p,t):
    K,N,r=dec(p['capacity']),dec(p['initial']),dec(p['rate'])
    return N if N==0 or r==0 else K/(1+(K/N-1)*(-r*dec(t)).exp())
def series_step(state,b,g,h):
    # Coefficients of a local power series, computed by convolution,
    # rather than using any Runge-Kutta stage formula.
    s=[state[0]];i=[state[1]];r=[state[2]]
    for n in range(18):
        infection=b*sum(s[k]*i[n-k]for k in range(n+1))
        s.append(-infection/(n+1));i.append((infection-g*i[n])/(n+1));r.append(g*i[n]/(n+1))
    def horner(coefs):
        ans=D(0)
        for c in reversed(coefs):ans=c+h*ans
        return ans
    return [horner(s),horner(i),horner(r)]
def path_coords(s):return[(float(x),float(y))for x,y in re.findall(r'[ML]([-\d.e+]+) ([-\d.e+]+)',s)]
with localcontext()as ctx:
    ctx.prec=55
    for item in data['growth']:
        p=item['p'];ok(len(item['points'])==161,'complete Logistic grid')
        for point in item['points']:
            near(point['n'],growth(p,point['t']));ok(min(p['initial'],p['capacity'])-1e-9<=point['n']<=max(p['initial'],p['capacity'])+1e-9 or p['initial']==0,'Logistic interval')
    for item in data['sir']:
        p=item['p'];b,g=dec(p['beta']),dec(p['gamma']);state=[dec(1-(p['initial']+p['removed'])),dec(p['initial']),dec(p['removed'])];initial=state[:];last=D(0)
        for point in item['result']['points']:
            t=dec(point['t']);state=series_step(state,b,g,t-last);last=t
            for key,value in zip(['s','i','r'],state):near(point[key],value,rtol=3e-9,atol=2e-10)
            near(point['s']+point['i']+point['r'],1,atol=2e-13)
        result=item['result'];R0=b/g;s0,i0,r0=initial
        expected='absent'if i0==0 else'outbreak'if b*s0>g else'fade';ok(result['initialGrowth']==expected,'SIR initial-growth condition')
        peak=i0+s0-1/R0-(R0*s0).ln()/R0 if expected=='outbreak'else i0
        near(result['analyticPeak'],peak)
        ok(result['refinement']<3e-10 and result['drift']<2e-13,'reported numerical diagnostics')
        final=result['finalSize']
        if i0==0:near(final['s'],s0);near(final['r'],r0)
        elif s0==0:ok(final['s']==0 and final['r']==1 and final['logRatio']is None,'zero susceptible boundary')
        else:
            lo=-R0*(s0+i0);hi=D(0)
            for k in range(190):
                w=(lo+hi)/2;v=w+R0*(i0+s0*(1-w.exp()))
                if v>0:hi=w
                else:lo=w
            w=(lo+hi)/2;near(final['s'],s0*w.exp());near(final['r'],r0+i0+s0*(1-w.exp()))
    for item in data['queue']:
        a,m=dec(item['arrival']),dec(item['service']);q=item['result'];ok(q['stable']==(a<m),'stability uses actual rates')
        if a>=m:ok(all(q[k]is None for k in ['L','Lq','W','Wq','flowError']),'undefined stationary quantities');continue
        for key,value in dict(rho=a/m,L=a/(m-a),Lq=a*a/(m*(m-a)),W=1/(m-a),Wq=a/(m*(m-a))).items():near(q[key],value,rtol=2e-14,atol=5e-324)
    for item in data['plots']:
        root=ET.fromstring(item['svg']);p=item['p'];kind=item['kind']
        if kind=='growth':
            ymax=float(root.get('data-max-y'))
            for node in root.iter('path'):
                pts=path_coords(node.get('d'));ok(len(pts)==161,'growth plot vertices')
                for j,(x,y)in enumerate(pts):
                    t=p['horizon']*j/160;near(x,80+(730*t/p['horizon']if p['horizon']else 0));near(y,325-245*float(growth(p,t))/ymax,atol=1e-9)
        elif kind=='queue':
            xmax=float(root.get('data-max-x'));ymax=float(root.get('data-max-y'));rho=p['arrival']/p['service']
            marks=[n for n in root.iter()if n.get('data-rho')is not None];ok(len(marks)==1,'one current marker')
            mark=marks[0];near(mark.get('cx')if mark.tag=='circle'else mark.get('x1'),80+730*rho/xmax)
            if p['arrival']>=p['service']:ok(mark.tag=='line','no false stationary point at overload')
            else:near(mark.get('cy'),325-245*p['arrival']/(p['service']-p['arrival'])/ymax,atol=1e-9)
        else:
            b,g=dec(p['beta']),dec(p['gamma']);state=[dec(1-(p['initial']+p['removed'])),dec(p['initial']),dec(p['removed'])];states=[state];count=math.ceil(p['horizon']/.2)
            for j in range(1,count+1):state=series_step(state,b,g,dec(p['horizon']*j/count)-dec(p['horizon']*(j-1)/count));states.append(state)
            for node in root.iter('path'):
                key=node.get('data-series');q=['s','i','r'].index(key);pts=path_coords(node.get('d'));ok(len(pts)==count+1,'all SIR plot vertices')
                for j,(x,y)in enumerate(pts):near(x,80+730*j/count);near(y,325-245*float(states[j][q]),atol=5e-8)
    root=ET.parse(ROOT/'math-course/images/model-02-classic-boundaries.svg')
    for node in root.iter():
        if node.get('data-initial')is not None:
            p={'capacity':600,'rate':.35,'initial':float(node.get('data-initial'))}
            pts=path_coords(node.get('d'));ok(len(pts)==161,'all static growth points')
            for j,(x,y)in enumerate(pts):near(x,80+550*(j/16)/10);near(y,290-170*float(growth(p,j/16))/1200,atol=1e-9)
        if node.get('data-component'):near(node.get('width'),100*float(node.get('data-value')))
        if node.get('data-growth'):
            s,i=float(node.get('data-s0')),float(node.get('data-i0'));near(node.get('data-re'),3*s);near(node.get('data-growth'),i*(.6*s-.2))
source=(ROOT/'course-shared/labs/classic-models.js').read_bytes()
for course in ['math-course','grad-math','ai-course']:ok((ROOT/course/'site/assets/learning/labs/classic-models.js').read_bytes()==source,'mirrors')
print(f'Classic models reference PASS: {checks} checks, {len(data["growth"])} growth cases, {len(data["sir"])} Taylor SIR cases, {len(data["queue"])} queues, {len(data["plots"])} plots, {data["strict"]} strict failures, {data["self"]["checks"]} self-tests')
