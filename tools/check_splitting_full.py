from pathlib import Path
import decimal,json,sys,math
decimal.getcontext().prec=80
D=decimal.Decimal;checks=0;B=[D(3),D('-1.5')]
def dd(x):return D(str(x))
def near(a,b,label):
 global checks
 b=float(b);assert math.isfinite(a) and abs(a-b)<=4e-10*max(1,abs(b)),(label,a,b);checks+=1
def vv(a,b,label):
 assert len(a)==len(b)
 for x,y in zip(a,b):near(x,y,label)
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def sub(a,b):return[x-y for x,y in zip(a,b)]
def n2(x):return dot(x,x)
def shrink(v,l):return max(v-l,D(0))if v>=0 else min(v+l,D(0))
def box(v,l):return min(l,max(-l,v))
def smooth(x):return n2(sub(x,B))/2
def val(x,l):return smooth(x)+l*sum(abs(v)for v in x)
def step(x,a,l):return[shrink((1-a)*v+a*b,a*l)for v,b in zip(x,B)]
def certificate(c,x,candidate,l):
 y=[box(v,l)for v in candidate];p=val(x,l);d=dot(B,y)-n2(y)/2
 vv(c['candidate'],candidate,'candidate');vv(c['y'],y,'projected multiplier');vv(c['projection'],sub(y,candidate),'projection difference')
 # Feasibility flags describe the actual floating-point candidate, including a one-ulp box violation.
 assert c['candidateFeasible']==all(abs(v)<=float(l)for v in c['candidate'])
 assert c['feasible'] and all(abs(v)<=float(l)for v in c['y'])
 for k,v in [('primal',p),('dual',d),('gap',p-d),('quadraticGap',n2([x[i]-B[i]+y[i]for i in range(2)])/2),('l1Gap',l*sum(abs(v)for v in x)-dot(x,y))]:near(c[k],v,k)
 assert p-d>=D('-1e-65')
def check_records(records):
 global checks
 for record in records:
  c=record['parameters'];a,rho,l,d=map(dd,[c['alpha'],c['rho'],c['lambda'],c['dualStart']]);opt=[shrink(v,l)for v in B];ys=sub(B,opt);minimum=val(opt,l)
  vv(record['problem']['star'],opt,'optimum');vv(record['problem']['ystar'],ys,'optimal multiplier');near(record['problem']['minimum'],minimum,'minimum')
  xp=[D(0),D(0)];z=xp[:];y=[d,-d];V=n2(sub(y,ys))/rho+rho*n2(sub(z,opt));cum=D(0)
  assert len(record['pg'])==len(record['admm'])==c['iterations']
  for k,(p,r)in enumerate(zip(record['pg'],record['admm']),1):
   assert p['k']==r['k']==k
   old=xp[:];xp=step(old,a,l);mb=[v/a for v in sub(old,xp)];ma=[v/a for v in sub(xp,step(xp,a,l))];pgap=val(xp,l)-minimum
   for name,v in [('input',old),('x',xp),('mappingBefore',mb),('mappingAfter',ma)]:vv(p[name],v,name)
   for name,v in [('objective',val(xp,l)),('rawGap',pgap),('gap',pgap),('mappingBeforeNorm',n2(mb).sqrt()),('mappingAfterNorm',n2(ma).sqrt())]:near(p[name],v,name)
   assert p['stepValid']==(a<=1)
   if a<=1:near(p['bound'],n2(opt)/(2*a*k),'PG bound');assert pgap<=n2(opt)/(2*a*k)+D('1e-65')
   else:assert p['bound']is None
   certificate(p['certificate'],xp,sub(B,xp),l)
   pz=z[:];py=y[:];pv=V
   x=[(B[i]+rho*pz[i]-py[i])/(1+rho)for i in range(2)];v=[x[i]+py[i]/rho for i in range(2)];z=[shrink(w,l/rho)for w in v]
   rr=sub(x,z);ss=[-rho*w for w in sub(z,pz)];y=[py[i]+rho*rr[i]for i in range(2)];V=n2(sub(y,ys))/rho+rho*n2(sub(z,opt));cost=rho*n2(rr)+n2(ss)/rho;cross=-2*dot(rr,ss);valid=k>1 or abs(d)<=l
   if valid:cum+=cost
   for name,vv0 in [('x',x),('z',z),('y',y),('u',[w/rho for w in y]),('previousZ',pz),('previousY',py),('proxInput',v),('r',rr),('s',ss),('xStationarity',[x[i]-B[i]+y[i]for i in range(2)]),('xStepDefect',[D(0),D(0)]),('zSubgradientDefect',[D(0),D(0)])]:vv(r[name],vv0,name)
   feasible=val(z,l);split=smooth(x)+l*sum(abs(w)for w in z);sg=split-minimum;lower=-dot(ys,rr);upper=-dot(y,rr)+dot(sub(x,opt),ss)
   values={'primalResidual':n2(rr).sqrt(),'dualResidual':n2(ss).sqrt(),'objective':feasible,'rawGap':feasible-minimum,'gap':feasible-minimum,'splitObjective':split,'splitGap':sg,'splitLower':lower,'splitUpper':upper,'lowerSlack':sg-lower,'upperSlack':upper-sg,'V':V,'previousV':pv,'VDrop':pv-V,'residualCost':cost,'crossTerm':cross,'descentSlack':pv-V-cost,'cumulativeResidualCost':cum}
   for name,vv0 in values.items():near(r[name],vv0,name)
   assert r['monotonicityApplies']==valid
   assert lower<=sg+D('1e-65') and sg<=upper+D('1e-65')
   # The first inequality uses optimality against a saddle point; the stronger residual budget also uses adjacent z optimality.
   assert pv-V>=cost+cross-D('1e-65')
   if valid:assert cross>=D('-1e-65') and pv-V>=cost-D('1e-65')
   certificate(r['certificate'],z,y,l)

import subprocess,shutil,hashlib,re,xml.etree.ElementTree as ET,copy
prefix=['rtk','proxy']if shutil.which('rtk')else[]
staging=len(sys.argv)>1;root=Path(sys.argv[1])if staging else Path(__file__).resolve().parents[1]
js=root/'operator-splitting173.js'if staging else root/'course-shared/labs/operator-splitting.js'
fixture=root/'splitting-snapshot173.json'if staging else root/'course-shared/projects/splitting-certificates/run-snapshot.json'
code=r'''const a=require(process.argv[1]),f=require(process.argv[2]),d={records:a.PRESETS.map(p=>a.snapshot(p.config)),views:[],invalid:0,self:a.selfTest(),feedback:[]};
for(const rho of [.125,.5,1,3,8])for(const lambda of [0,.75,1.5,3,4])for(const dualStart of [-4,0,4])d.records.push(a.snapshot({rho,lambda,dualStart,iterations:32}));
for(const alpha of [.1,1,2.5])for(const rho of [.125,8])d.records.push(a.snapshot({alpha,rho,lambda:0,dualStart:4,iterations:80}));
for(const s of d.records.slice(0,12))d.views.push({s,plots:a.plots(s),svg:a.plots(s).map(a.svg),tables:a.tables(s)});
function bad(o){let threw=false;try{a.config(o)}catch(e){threw=true;}if(!threw)throw Error('invalid accepted');d.invalid++;}
for(const o of [null,[],true,1,'x',{unknown:1}])bad(o);
for(const key of Object.keys(a.DEFAULTS))for(const v of [NaN,Infinity,-Infinity,null,[],true,'1'])bad({[key]:v});
for(const o of [{iterations:0},{iterations:1.5},{iterations:81},{alpha:0},{alpha:2.6},{rho:0},{rho:9},{dualStart:-5},{dualStart:5},{lambda:-1},{lambda:5}])bad(o);
for(let i=0;i<4;i++)for(let j=0;j<2;j++)d.feedback.push({i,j,...a.feedback(i,j)});
d.replay=f.records.map(r=>a.snapshot(r.data.parameters));console.log(JSON.stringify(d));'''
d=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True));f=json.loads(fixture.read_text());assert hashlib.sha256(js.read_bytes()).hexdigest()==f['provenance']['sourceSha256'];assert d['self']=={'checks':24,'presets':12}
check_records(d['records']+[r['data']for r in f['records']])
def rec(a,b):
 if isinstance(b,dict):assert a.keys()==b.keys();[rec(a[k],v)for k,v in b.items()]
 elif isinstance(b,(list,tuple)):assert len(a)==len(b);[rec(x,y)for x,y in zip(a,b)]
 elif isinstance(b,(int,float))and not isinstance(b,bool):near(a,b,'replay')
 else:assert a==b,(a,b)
for a,b in zip(d['replay'],f['records']):rec(a,b['data'])
coords=rows=0
for view in d['views']:
 s=view['s'];assert len(view['plots'])==6 and len(view['tables'])==8
 specs=[([('pg','gap'),('admm','gap')],True),([('admm','objective'),('admm','splitObjective'),('admm','minimum')],False),([('admm','primalResidual'),('admm','dualResidual')],True),([('admm','V'),('admm','VDrop'),('admm','residualCost')],False),([('pg','mappingBeforeNorm'),('pg','mappingAfterNorm')],True),([('pg','certificate'),('admm','certificate')],True)]
 for p,svg,(items,log)in zip(view['plots'],view['svg'],specs):
  paths=ET.fromstring(svg).findall('{*}path');assert len(paths)==len(items)==len(p['series']);assert p['xMax']>p['xMin']and p['yMax']>p['yMin']
  for ser,path,(method,key)in zip(p['series'],paths,items):
   expected=[]
   for r in s[method]:
    v=s['problem']['minimum']if key=='minimum'else r['certificate']['gap']if key=='certificate'else r[key]
    expected.append(None if log and v<=0 else[r['k'],math.log10(v)if log else v])
   rec(ser['points'],expected);xy=[];segments=0;pen=False
   for point in expected:
    if point is None:pen=False;continue
    if not pen:segments+=1
    pen=True;x,y=point;assert p['xMin']<=x<=p['xMax']and p['yMin']<=y<=p['yMax'];xy.extend([100+(x-p['xMin'])/(p['xMax']-p['xMin'])*755,385-(y-p['yMin'])/(p['yMax']-p['yMin'])*290])
   assert path.attrib['d'].count('M')==segments
   actual=list(map(float,re.findall(r'-?\d+(?:\.\d+)?',path.attrib['d'])));assert len(actual)==len(xy)
   for x,y in zip(actual,xy):assert abs(x-y)<6e-7;coords+=1
 ts={t['key']:t for t in view['tables']}
 specs=[('pg','pg',['k','input','x','objective','rawGap','gap','mappingBefore','mappingAfter','mappingBeforeNorm','mappingAfterNorm','stepValid','bound']),('admm','admm',['k','x','z','y','u','previousZ','previousY','proxInput']),('residuals','admm',['k','r','s','primalResidual','dualResidual','xStationarity','xStepDefect','zSubgradientDefect']),('objectives','admm',['k','objective','rawGap','gap','splitObjective','splitGap','splitLower','splitUpper','lowerSlack','upperSlack']),('energy','admm',['k','V','previousV','VDrop','residualCost','crossTerm','descentSlack','monotonicityApplies','cumulativeResidualCost'])]
 for key,method,keys in specs:
  expected=[[r[k]for k in keys]for r in s[method]];rec(ts[key]['rows'],expected);rows+=len(expected)
 for method in ['pg','admm']:
  expected=[[r['k']]+[r['certificate'][k]for k in ['candidate','candidateFeasible','projection','y','feasible','primal','dual','gap','quadraticGap','l1Gap']]for r in s[method]];rec(ts[method+'-dual']['rows'],expected);rows+=len(expected)
 rec(ts['parameters']['rows'],list(s['parameters'].items())+list(s['problem'].items()))
 for t in view['tables']:assert all(len(row)==len(t['headers'])for row in t['rows'])
for r in d['feedback']:assert r['correct']==(r['j']==[0,1,0,1][r['i']])and len(r['text'])>30 and 'undefined'not in r['text']
mutations=0
for field in ['x','s','splitObjective','V','monotonicityApplies','certificate']:
 s=copy.deepcopy(d['records'][0]);r=s['admm'][0]
 if field in ['x','s']:r[field][0]+=1
 elif field=='certificate':r['certificate']['gap']+=1
 elif field=='monotonicityApplies':r[field]=False
 else:r[field]+=1
 try:check_records([s])
 except AssertionError:mutations+=1
 else:raise AssertionError('missed mutation '+field)
if not staging:
 for course in ['ai-course','grad-math','math-course']:assert(root/course/'site/assets/learning/labs/operator-splitting.js').read_bytes()==js.read_bytes()
 assert(root/'grad-math/site/assets/learning/projects/splitting-certificates/run-snapshot.json').read_bytes()==fixture.read_bytes()
 assert(root/'grad-math/images/cvx-03-splitting-ledgers.svg').read_bytes()==(root/'grad-math/site/assets/img/cvx-03-splitting-ledgers.svg').read_bytes()
 src=(root/'grad-math/lectures/cvx-03-splitting.md').read_text();assert len(re.findall(r'^## \d+\.',src,re.M))==12 and src.count('$$')==28 and src.count('<details class="answer"')==8
 page=(root/'grad-math/site/cvx-03-splitting.html').read_text();assert 'assets/learning/projects/splitting-certificates/run-snapshot.json'in page and 'assets/learning/labs/operator-splitting.js'in page
 assert(root/'.github/workflows/course-audit.yml').read_text().count('python tools/check_splitting_full.py')==1
print(json.dumps({'status':'PASS','records':len(d['records']),'frozen':len(f['records']),'checks':checks,'plotCoordinates':coords,'ledgerRows':rows,'invalid':d['invalid'],'feedback':len(d['feedback']),'mutations':mutations,'self':24}))
