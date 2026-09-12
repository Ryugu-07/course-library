from pathlib import Path
import json,sys,decimal,math
decimal.getcontext().prec=80
D=decimal.Decimal;checks=0
def dd(v):return D(str(v))
def near(v,w,label,atol=2e-9):
 global checks
 w=float(w);assert math.isfinite(v)and abs(v-w)<=atol*max(1,abs(w)),(label,v,w);checks+=1
def vv(v,w,label):
 assert len(v)==len(w)
 for a,b in zip(v,w):near(a,b,label)
def dot(x,y):return sum(a*b for a,b in zip(x,y))
def slack(x):return[x[0],x[1],1-x[0]-x[1]]
def data(x,t):
 u,v,w=slack(x);g=[-t-1/u+1/w,-2*t-1/v+1/w];h=[[1/u**2+1/w**2,1/w**2],[1/w**2,1/v**2+1/w**2]];det=h[0][0]*h[1][1]-h[0][1]**2;p=[(-h[1][1]*g[0]+h[0][1]*g[1])/det,(h[1][0]*g[0]-h[0][0]*g[1])/det]
 return g,h,p
def check_data(r,t):
 x=list(map(dd,r['x']));ss=slack(x);g,h,p=data(x,t);vv(r['slacks'],ss,'slack');vv(r['gradient'],g,'gradient');vv(r['direction'],p,'direction')
 for a,b in zip(r['H'],h):vv(a,b,'Hessian')
 near(r['det'],h[0][0]*h[1][1]-h[0][1]*h[1][0],'Hessian determinant')
 for i in range(2):
  residual=sum(r['H'][i][j]*r['direction'][j]for j in range(2))+r['gradient'][i]
  near(r['linearResidual'][i],residual,'stored linear residual')
  scale=sum(abs(r['H'][i][j]*r['direction'][j])for j in range(2))+abs(r['gradient'][i]);assert abs(residual)<=5e-10*max(scale,1e-30)
 near(r['linearResidualNorm'],math.hypot(*r['linearResidual']),'stored residual norm')
 near(r['decrementSquared'],-dot(g,p),'decrement');near(r['objective'],-x[0]-2*x[1],'primal');near(r['barrier'],-sum(v.ln()for v in ss),'barrier');near(r['value'],t*(-x[0]-2*x[1])-sum(v.ln()for v in ss),'barrier objective')
 assert all(v>0 for v in ss)
 return x,ss,g,p
def reference(r,t):
 lo=D(0);hi=3/t
 for k in range(270):
  d=(lo+hi)/2;v=1/(t*(d+1))+1/(t*d)+1/(t*(d+2))-1
  if v>0:lo=d
  else:hi=d
 d=(lo+hi)/2;q=d+2;xx=[1/(t*(d+1)),1/(t*d)]
 vv(r['x'],xx,'reference point');near(r['q'],q,'reference dual parameter');vv(r['lambda'],[q-1,q-2,q],'reference multiplier');vv(r['slacks'],xx+[1/(t*q)],'reference slacks');near(r['primal'],-xx[0]-2*xx[1],'reference primal');near(r['dual'],-q,'reference dual');near(r['gap'],3/t,'reference gap')
 assert len(r['brackets'])==65
 flo=0.;fhi=3/float(t)
 for k,b in enumerate(r['brackets']):
  assert b['k']==k;near(b['lo'],flo,'bisection lower');near(b['hi'],fhi,'bisection upper');near(b['mid'],(b['lo']+b['hi'])/2,'bisection midpoint');assert 0<=b['lo']<=b['mid']<=b['hi']
  m=dd(b['mid']);near(b['value'],1/(t*(m+1))+1/(t*m)+1/(t*(m+2))-1,'bisection equation')
  flo,fhi=(b['mid'],b['hi'])if b['value']>0 else(b['lo'],b['mid'])
 return xx
def sdp(r):
 t=dd(r['t']);z=(1+t*t).sqrt();q=t/(2*(z+1));y=-(z+1)/t
 near(r['q'],q,'SDP coordinate');near(r['y'],y,'SDP dual');near(r['gap'],2/t,'SDP gap');near(r['primalGap'],1-2*q,'SDP primal gap');near(r['determinant'],D('.25')-q*q,'SDP determinant')
 near(r['primal'],-2*q,'SDP primal');near(r['dual'],y,'SDP dual value');near(r['targetGap'],2/t,'SDP target');near(r['trace'],1,'SDP trace');near(r['barrier'],-(D('.25')-q*q).ln(),'SDP log determinant')
 for a,b in zip(r['X'],[[D('.5'),q],[q,D('.5')]]):vv(a,b,'SDP primal matrix')
 for a,b in zip(r['S'],[[-y,-1],[-1,-y]]):vv(a,b,'SDP dual slack')
 vv(r['eigenX'],[D('.5')-q,D('.5')+q],'SDP primal eigenvalues');vv(r['eigenS'],[-y-1,-y+1],'SDP slack eigenvalues');assert r['strictPrimal']and r['strictDual']
 for i,row in enumerate(r['product']):vv(row,[1/t if j==i else D(0)for j in range(2)],'SDP complementarity')
 for i,row in enumerate(r['complementarityDefect']):vv(row,[r['product'][i][j]-(1/float(t)if i==j else 0)for j in range(2)],'SDP stored defect')
def check_records(records):
 for s in records:
  c=s['parameters'];r=s['lp'];t=dd(r['t']);ref=reference(s['reference'],t);sdp(s['sdp'])
  for p in s['path']:reference(p['lp'],dd(p['sdp']['t']));sdp(p['sdp'])
  if c['scenario']in['boundary','outside','noStrict']:
   assert not r['rows']and r['final']is None and r['certificate']is None
   assert r['status']==('no-strict-feasible-point'if c['scenario']=='noStrict'else'not-strict-feasible-start');continue
  previous=r['start']
  for row in r['rows']:
   vv(row['x'],previous,'iterate chain');previous=row['next']
   x,ss,g,p=check_data(row,t);assert row['accepted'];assert row['trials'][-1]['accepted']and not any(v['accepted']for v in row['trials'][:-1])
   for j,trial in enumerate(row['trials']):
    assert trial['j']==j;initial=1 if c['method']=='backtracking'else 1/(1+math.sqrt(row['decrementSquared']));near(trial['alpha'],initial*.5**j,'backtracking step')
    a=dd(trial['alpha']);xx=[x[i]+a*dd(row['direction'][i])for i in range(2)];vv(trial['x'],xx,'trial point');vv(trial['slacks'],slack(xx),'trial slack')
    assert trial['inside']==all(v>0 for v in trial['slacks'])
    if trial['inside']:
     delta=[a*dd(row['direction'][i])for i in range(2)];ds=[delta[0],delta[1],-delta[0]-delta[1]];change=t*(-delta[0]-2*delta[1])-sum((1+v/w).ln()for v,w in zip(ds,ss));near(trial['difference'],change,'line-search change');near(trial['armijo'],D('.25')*a*dot(list(map(dd,row['gradient'])),list(map(dd,row['direction']))),'Armijo rhs');assert trial['accepted']==(trial['difference']<=trial['armijo'])
    else:assert trial['difference']is None and not trial['accepted']
   vv(row['next'],row['trials'][-1]['x'],'accepted point')
  vv(r['final']['x'],previous,'final iterate');x,ss,g,p=check_data(r['final'],t);cert=r['certificate'];lam=[1/(t*v)for v in ss];station=[-1-lam[0]+lam[2],-2-lam[1]+lam[2]];vv(cert['lambda'],lam,'candidate multiplier');vv(cert['stationarity'],station,'candidate stationarity');near(cert['gapIdentityDefect'],0,'gap identity',1e-5)
  q=max(D(2),dd(cert['lambda'][2]));legal=[q-1,q-2,q];vv(cert['feasibleLambda'],legal,'legal multiplier');near(cert['certifiedGap'],-x[0]-2*x[1]+q,'certificate');near(cert['dual'],-q,'legal dual');assert q>=2
  near(cert['primal'],-x[0]-2*x[1],'certificate primal');vv(cert['slacks'],ss,'certificate slacks');assert cert['nonnegative']==all(v>=0 for v in cert['lambda']);near(cert['stationarityNorm'],sum(v*v for v in station).sqrt(),'stationarity norm');near(cert['candidateValue'],-lam[2],'candidate formal value');near(cert['candidateGap'],-x[0]-2*x[1]+lam[2],'candidate formal gap');vv(cert['complementarity'],[1/t]*3,'candidate products');near(cert['targetGap'],3/t,'LP target');vv(cert['certifiedComplementarity'],[a*b for a,b in zip(ss,legal)],'legal products');vv(cert['feasibleStationarity'],[0,0],'legal stationarity')
  vv(cert['projection'],[legal[i]-dd(cert['lambda'][i])for i in range(3)],'projection');assert cert['candidateExactlyFeasible']==all(v==0 for v in cert['stationarity'])
  if r['status']=='converged':vv(r['final']['x'],ref,'converged center');assert r['final']['decrementSquared']<=1e-22
  else:assert r['status']=='max-steps'and len(r['rows'])==c['maxSteps']
import subprocess,shutil,hashlib,re,xml.etree.ElementTree as ET,copy
prefix=['rtk','proxy']if shutil.which('rtk')else[]
staging=len(sys.argv)>1;root=Path(sys.argv[1])if staging else Path(__file__).resolve().parents[1]
js=root/'interior-central-path174-final.js'if staging else root/'course-shared/labs/interior-central-path.js'
fixture=root/'interior-snapshot174-final.json'if staging else root/'course-shared/projects/interior-certificates/run-snapshot.json'
code=r'''const a=require(process.argv[1]),f=require(process.argv[2]),d={records:a.PRESETS.map(p=>a.snapshot(p.config)),views:[],invalid:0,self:a.selfTest(),feedback:[]};
for(const scenario of ['normal','near','boundary','outside','noStrict'])for(const logT of [-1,-.3,0,.7,1,2,3])for(const method of ['backtracking','damped'])d.records.push(a.snapshot({scenario,logT,method}));
for(const scenario of ['normal','near'])for(const maxSteps of [1,2,5])d.records.push(a.snapshot({scenario,maxSteps,logT:3}));
for(const s of d.records.slice(0,12))d.views.push({s,plots:a.plots(s),svg:a.plots(s).map(a.svg),tables:a.tables(s)});
function bad(o){let threw=false;try{a.config(o)}catch(e){threw=true;}if(!threw)throw Error('invalid accepted');d.invalid++;}
for(const o of [null,[],true,1,'x',{unknown:1},JSON.parse('{"__proto__":1}')])bad(o);
for(const key of ['logT','maxSteps'])for(const v of [NaN,Infinity,-Infinity,null,[],true,'1'])bad({[key]:v});
for(const key of ['scenario','method'])for(const v of [NaN,Infinity,null,[],true,1,{},'invalid','toString','__proto__'])bad({[key]:v});
for(const o of [{logT:-1.1},{logT:3.1},{maxSteps:0},{maxSteps:1.5},{maxSteps:81}])bad(o);
for(let i=0;i<4;i++)for(let j=0;j<2;j++)d.feedback.push({i,j,...a.feedback(i,j)});
d.replay=f.records.map(r=>a.snapshot(r.data.parameters));console.log(JSON.stringify(d));'''
d=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True));f=json.loads(fixture.read_text());assert hashlib.sha256(js.read_bytes()).hexdigest()==f['provenance']['sourceSha256'];assert d['self']=={'checks':24,'presets':12}
def rec(a,b):
 if isinstance(b,dict):assert a.keys()==b.keys();[rec(a[k],v)for k,v in b.items()]
 elif isinstance(b,(list,tuple)):assert len(a)==len(b);[rec(x,y)for x,y in zip(a,b)]
 elif isinstance(b,(int,float))and not isinstance(b,bool):near(a,b,'replay')
 else:assert a==b,(a,b)
check_records(d['records']+[r['data']for r in f['records']])
for a,b in zip(d['replay'],f['records']):rec(a,b['data'])
for s in d['records']:
 c=s['parameters'];assert s['version']==174;near(s['lp']['t'],10**c['logT'],'configured t');assert len(s['path'])==17
 rec(s['lp']['start'],{'normal':[1/3,1/3],'near':[1e-10,.5],'boundary':[0,.5],'outside':[.8,.5],'noStrict':[0,0]}[c['scenario']])
 for k,p in enumerate(s['path']):near(p['logT'],-1+k/4,'path coordinate');near(p['sdp']['t'],10**p['logT'],'path t')
 for k,r in enumerate(s['lp']['rows']):assert r['k']==k+1;near(r['alpha'],r['trials'][-1]['alpha'],'accepted alpha')
def candidate(x,t):
 slack3=1-x[0]-x[1];q=1/(t*slack3);p=-x[0]-2*x[1]
 return [p+q,p+max(2,q),3/t]
coords=rows=0
for view in d['views']:
 s=view['s'];assert len(view['plots'])==6 and len(view['tables'])==8
 nr=s['lp']['rows'];trace=[r['x']for r in nr]+([s['lp']['final']['x']]if s['lp']['final']else[])
 def logpoints(points):return[None if v<=0 else[x,math.log10(v)]for x,v in points]
 expected=[[[[0,0],[1,0],[0,1],[0,0]],[p['lp']['x']for p in s['path']],trace],
  [logpoints([[r['k'],r['decrementSquared']]for r in nr])],
  [logpoints([[r['k'],candidate(r['x'],s['lp']['t'])[i]]for r in nr])for i in range(3)],
  [logpoints([[p['logT'],p['lp']['primal']+2]for p in s['path']]),logpoints([[p['logT'],p['lp']['gap']]for p in s['path']])],
  [logpoints([[p['logT'],p['sdp']['eigenX'][i]]for p in s['path']])for i in range(2)],
  [logpoints([[p['logT'],p['sdp'][key]]for p in s['path']])for key in ['primalGap','gap']]]
 for p,svg,series in zip(view['plots'],view['svg'],expected):
  paths=ET.fromstring(svg).findall('{*}path');assert len(paths)==len(series)==len(p['series']);assert p['xMax']>p['xMin']and p['yMax']>p['yMin']
  for ser,path,points in zip(p['series'],paths,series):
   rec(ser['points'],points);xy=[];segments=0;pen=False
   for point in points:
    if point is None:pen=False;continue
    if not pen:segments+=1
    pen=True;x,y=point;assert p['xMin']<=x<=p['xMax']and p['yMin']<=y<=p['yMax'];xy.extend([100+(x-p['xMin'])/(p['xMax']-p['xMin'])*755,385-(y-p['yMin'])/(p['yMax']-p['yMin'])*290])
   assert path.attrib['d'].count('M')==segments
   actual=list(map(float,re.findall(r'-?\d+(?:\.\d+)?',path.attrib['d'])));assert len(actual)==len(xy)
   for x,y in zip(actual,xy):assert abs(x-y)<6e-7;coords+=1
 ts={t['key']:t for t in view['tables']}
 specs={'newton':[[r[k]for k in ['k','x','slacks','gradient','H','det','direction','decrementSquared','linearResidual','linearResidualNorm','accepted','alpha','next']]for r in nr],
  'trials':[[r['k']]+[v[k]for k in ['j','alpha','x','slacks','inside','difference','armijo','accepted']]for r in nr for v in r['trials']],
  'root':[[r[k]for k in ['k','lo','hi','mid','value']]for r in s['reference']['brackets']],
  'path':[[p['logT'],p['lp']['x'],p['lp']['slacks'],p['lp']['lambda'],p['lp']['primal'],p['lp']['dual'],p['lp']['gap'],p['sdp']['X'],p['sdp']['y'],p['sdp']['S'],p['sdp']['eigenX'],p['sdp']['gap']]for p in s['path']]}
 for key,expectedRows in specs.items():rec(ts[key]['rows'],expectedRows);rows+=len(expectedRows)
 for key,obj in [('final',s['lp']['final']),('dual',s['lp']['certificate']),('sdp',s['sdp'])]:
  rr=ts[key]['rows'];rec([r[1]for r in rr],list(obj.values())if obj else[s['lp']['reason']]);assert all(re.search('[\u4e00-\u9fff]',r[0])or r[0]in['Hessian','XS−I/t']for r in rr);rows+=len(rr)
 rec([r[1]for r in ts['parameters']['rows']],list(s['parameters'].values())+[s['lp']['t'],s['lp']['start'],s['lp']['status'],s['lp']['reason']]);rows+=len(ts['parameters']['rows'])
 for t in view['tables']:assert all(len(row)==len(t['headers'])for row in t['rows'])
for r in d['feedback']:assert r['correct']==(r['j']==[0,1,0,1][r['i']])and len(r['text'])>30 and 'undefined'not in r['text']
mutations=0
for field in ['direction','H','det','trial','candidate','dual','sdp','root','failure']:
 s=copy.deepcopy(d['records'][0]);r=s['lp']['rows'][0]
 if field=='direction':r['direction'][0]+=1
 elif field=='H':r['H'][0][0]+=1
 elif field=='det':r['det']+=10
 elif field=='trial':r['trials'][0]['difference']+=1
 elif field=='candidate':s['lp']['certificate']['candidateGap']+=1
 elif field=='dual':s['lp']['certificate']['feasibleLambda'][0]+=1
 elif field=='sdp':s['sdp']['eigenX'][0]+=1
 elif field=='root':s['reference']['brackets'][0]['value']+=1
 else:s['parameters']['scenario']='boundary'
 try:check_records([s])
 except AssertionError:mutations+=1
 else:raise AssertionError('missed mutation '+field)
if not staging:
 for course in ['ai-course','grad-math','math-course']:assert(root/course/'site/assets/learning/labs/interior-central-path.js').read_bytes()==js.read_bytes()
 assert(root/'grad-math/site/assets/learning/projects/interior-certificates/run-snapshot.json').read_bytes()==fixture.read_bytes()
 assert(root/'grad-math/images/cvx-04-interior-ledgers.svg').read_bytes()==(root/'grad-math/site/assets/img/cvx-04-interior-ledgers.svg').read_bytes()
 src=(root/'grad-math/lectures/cvx-04-interior-point.md').read_text();assert len(re.findall(r'^## \d+\.',src,re.M))==12 and src.count('$$')==28 and src.count('<details class="answer"')==8
 page=(root/'grad-math/site/cvx-04-interior-point.html').read_text();assert 'assets/learning/projects/interior-certificates/run-snapshot.json'in page and 'assets/learning/labs/interior-central-path.js'in page
 assert(root/'.github/workflows/course-audit.yml').read_text().count('python tools/check_interior_full.py')==1
print(json.dumps({'status':'PASS','records':len(d['records']),'frozen':len(f['records']),'checks':checks,'plotCoordinates':coords,'ledgerRows':rows,'invalid':d['invalid'],'feedback':len(d['feedback']),'mutations':mutations,'self':24}))
