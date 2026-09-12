from pathlib import Path
import json,sys,decimal,math
decimal.getcontext().prec=70
D=decimal.Decimal;checks=0
def dd(x):return D(str(x))
def near(a,b,label):
 global checks
 b=float(b);assert math.isfinite(a)and abs(a-b)<=3e-10*max(1,abs(b)),(label,a,b);checks+=1
def vv(a,b,label):
 assert len(a)==len(b)
 for x,y in zip(a,b):near(x,y,label)
q=[D(1),D(4)];center=[D(2),D(-2)]
def soft(x,l):return max(x-l,D(0))if x>=0 else min(x+l,D(0))
def grad(x):return[q[i]*(x[i]-center[i])for i in range(2)]
def val(x,l):return sum(q[i]*(x[i]-center[i])**2/2+l*abs(x[i])for i in range(2))
def sub(a,b):return[x-y for x,y in zip(a,b)]
def n2(x):return sum(v*v for v in x)
def prox(x,a,l):return[soft(v-a*g,a*l)for v,g in zip(x,grad(x))]
def check_records(records):
 global checks
 for s in records:
  c=s['parameters'];a=dd(c['stepFactor'])/4;valid=c['stepFactor']<=1
  for m in s['methods']:
   l=dd(c['lambda'])if m['target']=='F'else D(0);star=[soft(center[i],l/q[i])for i in range(2)];x=list(map(dd,[c['start1'],c['start2']]));y=x[:];z=x[:];t=D(1);R=n2(sub(x,star));energy=R;gap0=val(x,l)-val(star,l);acc=m['method']in['nesterov','fista'];total=D(0)
   vv(m['star'],star,'star');near(m['optimum'],val(star,l),'optimum');near(m['radiusSquared'],R,'radius');near(m['initialGap'],gap0,'initial gap');assert m['stepValid']==valid
   for r in m['rows']:
    previous=x[:];input=y[:];prevz=z[:];used=t;x=prox(input,a,l);nextt=(1+(1+4*t*t).sqrt())/2;g=grad(x);mapping=[v/a for v in sub(x,prox(x,a,l))];gap=val(x,l)-val(star,l);total+=gap;z=[t*x[i]-(t-1)*previous[i]for i in range(2)]if acc else x[:];e=2*a*t*t*gap+n2(sub(z,star))if acc else 2*a*total+n2(sub(x,star));k=r['k']
    vv(r['x'],x,'iterate');vv(r['input'],input,'extrapolation');vv(r['z'],z,'z');vv(r['previousZ'],prevz,'previous z');vv(r['gradient'],g,'gradient');vv(r['mapping'],mapping,'mapping');near(r['t'],t if acc else 1,'t');near(r['objective'],val(x,l),'objective');near(r['rawGap'],gap,'raw gap');near(r['gap'],gap,'stable gap');near(r['gradientNorm'],n2(g).sqrt(),'gradient norm');near(r['mappingNorm'],n2(mapping).sqrt(),'mapping norm');near(r['residual'],n2(g if m['target']=='f'else mapping).sqrt(),'residual');near(r['energy'],e,'energy');near(r['previousEnergy'],energy,'previous energy');near(r['energyDrop'],energy-e,'energy decrease');near(r['threePointDefect'],n2(sub(star,input))-n2(sub(star,x))-2*a*gap,'three point');assert r['stepValid']==valid
    if valid:
     bound=2*R/(a*(k+1)**2)if acc else R/(2*a*k);near(r['bound'],bound,'bound');assert gap<=bound+D('1e-55')and e<=energy+D('1e-50')
     if not acc:near(r['strongBound'],(1-a)**k*gap0,'strong');assert gap<=(1-a)**k*gap0+D('1e-50')
     else:assert r['strongBound']is None
    else:assert r['bound']is None and r['strongBound']is None
    if m['target']=='F':
     cy=[min(l,max(-l,-v))for v in g];dual=sum(center[i]*cy[i]-cy[i]**2/(2*q[i])for i in range(2));cert=r['certificate'];vv(cert['y'],cy,'dual point');near(cert['primal'],val(x,l),'primal');near(cert['dual'],dual,'dual');near(cert['gap'],val(x,l)-dual,'dual gap');near(cert['quadraticGap'],sum((g[i]+cy[i])**2/(2*q[i])for i in range(2)),'quadratic gap');near(cert['l1Gap'],l*sum(abs(v)for v in x)-sum(x[i]*cy[i]for i in range(2)),'l1 gap');assert cert['feasible']and val(x,l)>=dual-D('1e-50')
    else:assert r['certificate']is None
    energy=e
    if acc:y=[x[i]+(t-1)/nextt*(x[i]-previous[i])for i in range(2)];t=nextt
    else:y=x[:]

import subprocess,shutil,hashlib,re,xml.etree.ElementTree as ET,copy
prefix=['rtk','proxy']if shutil.which('rtk')else[]
staging=len(sys.argv)>1;root=Path(sys.argv[1])if staging else Path(__file__).resolve().parents[1]
js=root/'first-order-methods172.js'if staging else root/'course-shared/labs/first-order-methods.js'
fixture=root/'firstorder-snapshot172.json'if staging else root/'course-shared/projects/first-order-certificates/run-snapshot.json'
code=r'''const a=require(process.argv[1]),f=require(process.argv[2]),d={records:a.PRESETS.map(p=>a.snapshot(p.config)),views:[],invalid:0,self:a.selfTest(),feedback:[]};
for(const stepFactor of [.1,.7,1,1.25,2.5])for(const lambda of [0,.5,2,3,8])d.records.push(a.snapshot({stepFactor,lambda,iterations:32,start1:-3.25,start2:2.75}));
for(const stepFactor of [.1,2.5])for(const lambda of [0,8])d.records.push(a.snapshot({stepFactor,lambda,iterations:80,start1:6,start2:-6}));
for(const s of d.records.slice(0,12))d.views.push({s,plots:a.plots(s),svg:a.plots(s).map(a.svg),tables:a.tables(s)});
function bad(o){let threw=false;try{a.config(o)}catch(e){threw=true;}if(!threw)throw Error('invalid accepted');d.invalid++;}
for(const o of [null,[],true,1,'x',{unknown:1}])bad(o);
for(const key of Object.keys(a.DEFAULTS))for(const v of [NaN,Infinity,-Infinity,null,[],true,'1'])bad({[key]:v});
for(const o of [{iterations:0},{iterations:1.5},{iterations:81},{stepFactor:0},{stepFactor:2.6},{start1:7},{start2:-7},{lambda:-1},{lambda:9}])bad(o);
for(let i=0;i<4;i++)for(let j=0;j<2;j++)d.feedback.push({i,j,...a.feedback(i,j)});
d.replay=f.records.map(r=>a.snapshot(r.data.parameters));console.log(JSON.stringify(d));'''
d=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True));f=json.loads(fixture.read_text());assert hashlib.sha256(js.read_bytes()).hexdigest()==f['provenance']['sourceSha256'];assert d['self']=={'checks':23,'presets':12}
check_records(d['records']+[r['data']for r in f['records']])
def rec(a,b):
 if isinstance(b,dict):assert a.keys()==b.keys();[rec(a[k],v)for k,v in b.items()]
 elif isinstance(b,(list,tuple)):assert len(a)==len(b);[rec(x,y)for x,y in zip(a,b)]
 elif isinstance(b,(int,float))and not isinstance(b,bool):near(a,b,'replay')
 else:assert a==b,(a,b)
for a,b in zip(d['replay'],f['records']):rec(a,b['data'])
coords=rows=0
for v in d['views']:
 s=v['s'];assert len(v['plots'])==6 and len(v['tables'])==11
 for p,svg,(ids,key,log)in zip(v['plots'],v['svg'],[([0,1],'gap',True),([2,3],'gap',True),([0,1],'residual',True),([2,3],'residual',True),([0,1,2,3],'energy',False),([2,3],'certificate',True)]):
  paths=ET.fromstring(svg).findall('{*}path');assert len(paths)==len(ids)==len(p['series']);assert p['xMax']>p['xMin']and p['yMax']>p['yMin']
  for ser,path,i in zip(p['series'],paths,ids):
   m=s['methods'][i];expected=[]
   for r in m['rows']:
    value=r['certificate']['gap']if key=='certificate'else r[key]
    if key=='energy':value=value/m['radiusSquared']if m['radiusSquared']>0 else None
    expected.append(None if value is None or log and value<=0 else[r['k'],math.log10(value)if log else value])
   rec(ser['points'],expected);xy=[];segments=0;pen=False
   for point in expected:
    if point is None:pen=False;continue
    if not pen:segments+=1
    pen=True;x,y=point;assert p['xMin']<=x<=p['xMax']and p['yMin']<=y<=p['yMax'];xy.extend([100+(x-p['xMin'])/(p['xMax']-p['xMin'])*755,385-(y-p['yMin'])/(p['yMax']-p['yMin'])*290])
   assert path.attrib['d'].count('M')==segments
   actual=list(map(float,re.findall(r'-?\d+(?:\.\d+)?',path.attrib['d'])));assert len(actual)==len(xy)
   for x,y in zip(actual,xy):assert abs(x-y)<6e-7;coords+=1
 ts={t['key']:t for t in v['tables']}
 for m in s['methods']:
  expected=[[r[k]for k in ['k','x','input','t','objective','rawGap','gap','residual','bound','strongBound','stepValid']]for r in m['rows']];rec(ts[m['method']]['rows'],expected);rows+=len(expected)
  expected=[[r[k]for k in ['k','z','previousZ','energy','previousEnergy','energyDrop','threePointDefect']]for r in m['rows']];rec(ts[m['method']+'-proof']['rows'],expected);rows+=len(expected)
  if m['target']=='F':
   expected=[[r['k']]+[r['certificate'][k]for k in ['y','feasible','primal','dual','gap','quadraticGap','l1Gap']]+[r['gradientNorm'],r['mappingNorm']]for r in m['rows']];rec(ts[m['method']+'-dual']['rows'],expected);rows+=len(expected)
 for t in v['tables']:assert all(len(row)==len(t['headers'])for row in t['rows'])
for r in d['feedback']:assert r['correct']==(r['j']==[0,1,0,1][r['i']])and len(r['text'])>30 and 'undefined'not in r['text']
mutations=0
for field in ['x','gap','bound','energy','certificate']:
 s=copy.deepcopy(d['records'][0]);r=s['methods'][2]['rows'][0]
 if field=='x':r['x'][0]+=1
 elif field=='certificate':r['certificate']['gap']+=1
 else:r[field]+=1
 try:check_records([s])
 except AssertionError:mutations+=1
 else:raise AssertionError('missed mutation '+field)
if not staging:
 for course in ['ai-course','grad-math','math-course']:assert(root/course/'site/assets/learning/labs/first-order-methods.js').read_bytes()==js.read_bytes()
 assert(root/'grad-math/site/assets/learning/projects/first-order-certificates/run-snapshot.json').read_bytes()==fixture.read_bytes()
 assert(root/'grad-math/images/cvx-02-first-order-ledgers.svg').read_bytes()==(root/'grad-math/site/assets/img/cvx-02-first-order-ledgers.svg').read_bytes()
 src=(root/'grad-math/lectures/cvx-02-first-order.md').read_text();assert len(re.findall(r'^## \d+\.',src,re.M))==12 and src.count('$$')==38 and src.count('<details class="answer"')==8
 page=(root/'grad-math/site/cvx-02-first-order.html').read_text();assert 'assets/learning/projects/first-order-certificates/run-snapshot.json'in page and 'assets/learning/labs/first-order-methods.js'in page
 assert(root/'.github/workflows/course-audit.yml').read_text().count('python tools/check_first_order_full.py')==1
print(json.dumps({'status':'PASS','records':len(d['records']),'frozen':len(f['records']),'checks':checks,'plotCoordinates':coords,'ledgerRows':rows,'invalid':d['invalid'],'feedback':len(d['feedback']),'mutations':mutations,'self':23}))
