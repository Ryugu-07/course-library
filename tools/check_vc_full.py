"""Independent halfspace feasibility via scipy linprog and exact certificate arithmetic."""
from pathlib import Path
from itertools import product,combinations
import json,sys
checks=0;lp=0
def ok(x):
 global checks
 checks+=1;assert x
def verify_geometry(record):
 global lp
 c=record['parameters'];ps=record['points'];g=record['geometry'];n=len(ps)
 ok(len(g['records'])==2**n);feasible=[]
 for mask,row in enumerate(g['records']):
  ys=[(mask//2**i)%2 for i in range(n)]
  ok(row['mask']==mask and row['labels']==ys)
  if c['model']!='halfspace':
   runs=sum(y and(i==0 or not ys[i-1])for i,y in enumerate(ys))
   expected=mask==0 if c['model']=='constant' else all(a<=b for a,b in zip(ys,ys[1:]))if c['model']=='threshold' else runs<=(1 if c['model']=='interval'else 2)
   ok(row['feasible']==expected)
  if row['feasible']:
   ok(row['witness']['kind']=={'halfspace':'halfspace','constant':'constant','threshold':'threshold','interval':'intervals','two-intervals':'intervals'}[c['model']])
   feasible.append(mask);ok(row['obstruction']is None);w=row['witness']
   if w['kind']=='halfspace':
    scores=[w['wx']*x+w['wy']*y+w['b']for x,y in ps]
    ok(scores==w['scores']);ok([abs(v)for v in scores]==w['signedMargins'])
    ok(all((2*y-1)*v>=1 for y,v in zip(ys,scores)))
    ok(all(type(w[k])is int for k in ['wx','wy','b']))
   elif w['kind']=='threshold':ok([int(2*i>=w['thresholdTwice'])for i in range(n)]==ys)
   elif w['kind']=='intervals':ok([int(any(a<=2*i<=b for a,b in w['endpointsTwice']))for i in range(n)]==ys)
   else:ok(w=={'kind':'constant','value':0}and not any(ys))
  else:
   ok(row['witness']is None);o=row['obstruction']
   if o['kind']=='radon':
    ok({k:v for k,v in o.items()if k not in ['kind','circuitIndex','orientation']}==g['circuits'][o['circuitIndex']]);alpha=o['alpha'];ok(len(alpha)==n and sum(alpha)==0)
    ok(all(sum(a*p[j]for a,p in zip(alpha,ps))==0 for j in range(2)))
    pos=[i for i,a in enumerate(alpha)if a>0];neg=[i for i,a in enumerate(alpha)if a<0]
    ok(pos==o['positive']and neg==o['negative']and pos and neg)
    ok(len({ys[i]for i in pos})==1 and len({ys[i]for i in neg})==1 and ys[pos[0]]!=ys[neg[0]])
    total=sum(alpha[i]for i in pos);ok(total==o['weightSum']==o['intersectionDenominator'])
    ok([sum(alpha[i]*ps[i][j]for i in pos)for j in range(2)]==o['intersectionNumerator'])
    ok(o['orientation']==(1 if ys[pos[0]]else-1))
   elif o['kind']=='order':i,j=o['indices'];ok(i<j and ys[i]==1 and ys[j]==0)
   elif o['kind']=='alternating':ids=o['indices'];ok(ids==sorted(ids));ok([ys[i]for i in ids]==[1,0,1]if c['model']=='interval'else[ys[i]for i in ids]==[1,0,1,0,1])
   else:ok(o['indices']==[ys.index(1)])
 ok(record['patterns']==feasible)
 # Every subset restriction is independently rebuilt as tuples.
 dim=0
 for mask,row in enumerate(record['subsets']):
  ids=[i for i in range(n)if(mask//2**i)%2];patterns={tuple((h//2**i)%2 for i in ids)for h in feasible};codes=sorted(sum(y*2**j for j,y in enumerate(t))for t in patterns);shattered=len(patterns)==2**len(ids)
  ok(row==dict(subset=mask,indices=ids,patterns=codes,count=len(codes),shattered=shattered))
  if shattered:dim=max(dim,len(ids))
 ok(record['localDimension']==dim)
from pathlib import Path
from itertools import product,combinations
from math import comb,exp,log
import json,sys
def ok(x):
 global checks
 checks+=1;assert x
def near(x,y):
 global checks
 checks+=1;assert abs(x-y)<=3e-13*max(1,abs(x),abs(y)),(x,y)
def dimension(family,n):
 if not family:return -1
 for k in range(n,-1,-1):
  for ids in combinations(range(n),k):
   if len({tuple((h>>i)&1 for i in ids)for h in family})==2**k:return k
 raise AssertionError()
def verify_combinatorics(s):
 c=s['parameters'];n=c['pointCount'];patterns=s['patterns'];global_d={'constant':0,'threshold':1,'interval':2,'two-intervals':4,'halfspace':3}[c['model']]
 ok(s['globalDimension']==global_d);ok(len(s['deletions'])==n);ok(s['localDimension']==dimension(patterns,n))
 for j,r in enumerate(s['deletions']):
  ids=[i for i in range(n)if i!=j];groups=[set(),set()]
  for h in patterns:groups[(h>>j)&1].add(sum(((h>>i)&1)*2**k for k,i in enumerate(ids)))
  u=groups[0]|groups[1];v=groups[0]&groups[1]
  expected=dict(index=j,indices=ids,zero=sorted(groups[0]),one=sorted(groups[1]),union=sorted(u),intersection=sorted(v),total=len(patterns),unionCount=len(u),intersectionCount=len(v),unionDimension=dimension(u,n-1),intersectionDimension=dimension(v,n-1))
  ok(r==expected);ok(len(patterns)==len(u)+len(v));ok(expected['unionDimension']<=s['localDimension']);ok(expected['intersectionDimension']<=s['localDimension']-1)
 ok(s['selectedDeletion']==s['deletions'][c['deleteIndex']]);ok(s['selectedTarget']==s['geometry']['records'][c['targetMask']])
 def B(n,d):return sum(comb(n,j)for j in range(min(n,d)+1))
 def growth(n):
  if not n:return 1
  if c['model']=='constant':return 1
  if c['model']=='threshold':return n+1
  if c['model']=='interval':return B(n,2)
  if c['model']=='two-intervals':return B(n,4)
  return n*(n-1)+2
 for n0,r in enumerate(s['growthRows']):
  ok(r==dict(points=n0,allLabels=2**n0,growth=growth(n0),sauer=B(n0,global_d),dimension=global_d,binomialTerms=[comb(n0,j)if j<=n0 else 0 for j in range(global_d+1)]))
  ok(r['growth']<=r['sauer']<=r['allLabels'])
 sw=s['swap'];m=c['pairCount'];pairs=[dict(pair=i,first=i%n,second=(3*i+1)%n,firstLabel=(c['targetMask']>>(i%n))&1,secondLabel=(c['targetMask']>>((3*i+1)%n))&1)for i in range(m)]
 ok(sw['pairs']==pairs);ids=[r['first']for r in pairs]+[r['second']for r in pairs];ok(sw['combinedIndices']==ids)
 groups={}
 for h in patterns:
  key=tuple((h>>i)&1 for i in ids);groups.setdefault(key,[]).append(h)
 codes=sorted((sum(y*2**i for i,y in enumerate(key)),members)for key,members in groups.items())
 ok(len(sw['behaviors'])==len(codes))
 differences=[]
 for r,(code,hs)in zip(sw['behaviors'],codes):
  h=min(hs);a=[int(((h>>p['first'])&1)!=p['firstLabel'])for p in pairs];b=[int(((h>>p['second'])&1)!=p['secondLabel'])for p in pairs];delta=[x-y for x,y in zip(a,b)];differences.append(delta)
  ok(r==dict(restriction=code,representative=h,members=hs,firstLosses=a,secondLosses=b,differences=delta))
 histogram=[0]*(m+1);failed=0
 for mask,row in enumerate(sw['rows']):
  signs=[1 if(mask>>i)&1 else-1 for i in range(m)]
  # Reconstruct actual swapped first/second loss totals independently.
  diffs=[]
  for behavior in sw['behaviors']:
   first=sum(a if sign>0 else b for a,b,sign in zip(behavior['firstLosses'],behavior['secondLosses'],signs))
   second=sum(b if sign>0 else a for a,b,sign in zip(behavior['firstLosses'],behavior['secondLosses'],signs))
   diffs.append(first-second)
  maxgap=max(map(abs,diffs));event=200*maxgap>c['epsilonPercent']*m
  ok(row==dict(mask=mask,signs=signs,sums=diffs,maximum=maxgap,meanGap=maxgap/m,failure=event));histogram[maxgap]+=1;failed+=event
 ok(len(sw['rows'])==2**m);ok(sw['failures']==failed and sw['denominator']==2**m and sw['failureProbability']==failed/2**m)
 for k,r in enumerate(sw['distribution']):ok(r==dict(maximum=k,meanGap=k/m,count=histogram[k],denominator=2**m,probability=histogram[k]/2**m))
 bound=2*len(groups)*exp(-m*(c['epsilonPercent']/100)**2/8);near(sw['conditionalBoundRaw'],bound);near(sw['conditionalBound'],min(1,bound));ok(sw['failureProbability']<=min(1,bound)+1e-14)
 ok(len(s['boundScan'])==1000)
 for M,r in enumerate(s['boundScan'],1):
  eps=c['epsilonPercent']/100;ga=M*c['epsilonPercent']**2>=20000;gr=M*c['epsilonPercent']>=800;pi=growth(2*M)
  for k,v in dict(samples=M,epsilon=eps,dimension=global_d,growthAtDouble=pi,sauerAtDouble=B(2*M,global_d),ghostApplicable=ga,realizableGhostApplicable=gr).items():ok(r[k]==v)
  for applicable,rawkey,boundkey,raw in[(ga,'uniformRaw','uniformBound',4*pi*exp(-M*eps*eps/8)),(gr,'realizableRaw','realizableBound',2*pi*exp(-M*eps/4))]:
   if applicable:near(r[rawkey],raw);near(r[boundkey],min(1,raw))
   else:ok(r[rawkey]is None and r[boundkey]==1)
 ok(s['bound']==s['boundScan'][c['boundSampleCount']-1])
from pathlib import Path
import subprocess,sys,json,hashlib,shutil,copy,re,math,xml.etree.ElementTree as ET
prefix=['rtk','proxy']if shutil.which('rtk')else[]
ROOT=Path(__file__).resolve().parents[1]
js=Path(sys.argv[1]).resolve()if len(sys.argv)>1 else ROOT/'course-shared/labs/vc-shattering.js'
fixture=Path(sys.argv[2]).resolve()if len(sys.argv)>2 else ROOT/'course-shared/projects/vc-certificates/run-snapshot.json'
f=json.loads(fixture.read_text());assert f['provenance']['sourceSha256']==hashlib.sha256(js.read_bytes()).hexdigest()
code=r"""
const a=require(process.argv[1]),f=require(process.argv[2]);
const extras=[{pointCount:1,targetMask:0,deleteIndex:0},{pointCount:2,targetMask:1,deleteIndex:0},{geometry:'interior',pointCount:8,targetMask:127,deleteIndex:7},{geometry:'convex',pointCount:5,targetMask:21,deleteIndex:4,epsilonPercent:5,boundSampleCount:800},{model:'threshold',pointCount:8,targetMask:127,deleteIndex:7},{model:'interval',pointCount:8,targetMask:170,deleteIndex:7},{model:'two-intervals',pointCount:8,targetMask:170,deleteIndex:7},{model:'constant',pointCount:8,targetMask:255,deleteIndex:7},{epsilonPercent:50,boundSampleCount:7},{epsilonPercent:50,boundSampleCount:8},{epsilonPercent:5,boundSampleCount:159},{epsilonPercent:5,boundSampleCount:160}];
const records=[...a.PRESETS.map(p=>a.compute(p.parameters)),...extras.map(p=>a.compute(p))],frozen=f.records.map(r=>a.compute(r.data.parameters));let invalid=0;
const bad=[null,[],1,'x',{x:0},{model:'tree'},{geometry:'random'}];for(const k of ['pointCount','targetMask','deleteIndex','pairCount','epsilonPercent','boundSampleCount'])for(const v of [null,'1',NaN,Infinity,-Infinity,1.5])bad.push({[k]:v});for(const[k,min,max]of [['pointCount',1,8],['targetMask',0,15],['deleteIndex',0,3],['pairCount',1,6],['epsilonPercent',5,90],['boundSampleCount',1,1000]])bad.push({[k]:min-1},{[k]:max+1});bad.push({pointCount:1},{pointCount:3,deleteIndex:3},{pointCount:1,targetMask:2,deleteIndex:0});
for(const p of bad){let rejected=false;try{a.compute(p)}catch(e){rejected=true}if(!rejected)throw Error('Invalid accepted '+JSON.stringify(p));invalid++;}
let feedback=0;for(let i=0;i<4;i++)for(let j=0;j<2;j++){const r=a.feedback(i,j);if(r.correct!==(j===a.QUESTIONS[i][2])||!r.text)throw Error('Feedback');feedback++;}
process.stdout.write(JSON.stringify({records,frozen,invalid,feedback,self:a.selfTest(),rendered:records.map(r=>({plots:a.plots(r),tables:a.tables(r),svgs:a.plots(r).map(a.svg)}))}));
"""
d=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js),str(fixture)],text=True))
assert len(d['records'])==24 and len(d['frozen'])==6 and d['self']['status']=='PASS'
def verify_extra(s):
 c=s['parameters'];n=c['pointCount']
 presets={'square':[[-2,-2],[2,-2],[2,2],[-2,2],[0,0],[0,-2],[2,0],[-2,0]],'convex':[[3,0],[2,2],[0,3],[-2,2],[-3,0],[-2,-2],[0,-3],[2,-2]],'parabola':[[i-3,(i-3)**2]for i in range(8)],'interior':[[-4,-3],[4,-3],[0,5],[0,0],[-1,0],[1,0],[0,1],[0,-1]],'collinear':[[i-3,2*(i-3)+1]for i in range(8)]}
 ps=presets[c['geometry']][:n]if c['model']=='halfspace'else[[i,0]for i in range(n)];ok(s['points']==ps)
 ok(len(s['subsets'])==2**n);ok(len(s['growthRows'])==17)
 if c['model']!='halfspace':ok(s['geometry']['circuits']==[]);return
 for r in s['geometry']['circuits']:
  alpha=r['alpha'];ok(len(alpha)==n and all(type(x)is int for x in alpha));ok(sum(alpha)==0)
  ok(all(sum(a*p[j]for a,p in zip(alpha,ps))==0 for j in range(2)))
  pos=[i for i,a in enumerate(alpha)if a>0];neg=[i for i,a in enumerate(alpha)if a<0];ok(pos==r['positive']and neg==r['negative']and pos and neg)
  weight=sum(alpha[i]for i in pos);ok(weight==r['weightSum']==r['intersectionDenominator'])
  ok([sum(alpha[i]*ps[i][j]for i in pos)for j in range(2)]==r['intersectionNumerator'])
 for r in s['geometry']['candidates']:
  scores=[r['wx']*x+r['wy']*y+r['b']for x,y in ps]
  ok(scores==r['scores']and all(scores));ok(r['signedMargins']==list(map(abs,scores)))
  ok(r['mask']==sum(2**i for i,v in enumerate(scores)if v>0));ok(r['mask']in s['patterns'])
def verify(s):verify_geometry(s);verify_combinatorics(s);verify_extra(s)
for s in d['records']+d['frozen']+[r['data']for r in f['records']]:verify(s)
science_checks=checks
# These fields are real-valued by semantics, even if JSON happens to spell 0 or 1.
REAL_KEYS={'epsilon','meanGap','probability','failureProbability','conditionalBoundRaw','conditionalBound','uniformRaw','uniformBound','realizableRaw','realizableBound'}
def replay(g,v,key=None):
 if isinstance(v,dict):
  assert isinstance(g,dict)and set(g)==set(v)
  for k in v:replay(g[k],v[k],k)
 elif isinstance(v,list):
  assert isinstance(g,list)and len(g)==len(v)
  for x,y in zip(g,v):replay(x,y,key)
 elif isinstance(v,bool)or v is None or isinstance(v,str):assert type(g)is type(v)and g==v
 elif key in REAL_KEYS:assert isinstance(g,(float,int))and not isinstance(g,bool)and math.isfinite(g)and abs(g-v)<=2e-12*(1+abs(v)),(key,g,v)
 else:assert type(g)is int and type(v)is int and g==v,(key,g,v)
for old,new in zip(f['records'],d['frozen']):replay(old['data'],new)
base=f['records'][0]['data'];guards=0
for change in [
 lambda x:x.update(schemaVersion=1.0000000000001),
 lambda x:x['parameters'].update(targetMask=5.0000000000001),
 lambda x:x['geometry']['records'][0]['witness'].update(wx=.0000000000001),
 lambda x:x['geometry']['records'][0].update(feasible=1),
 lambda x:x['geometry']['circuits'][0]['alpha'].__setitem__(0,1.0000000000001),
 lambda x:x['subsets'][0].update(count=True),
 lambda x:x['deletions'][0].update(total=14.0000000000001),
 lambda x:x['swap']['rows'][0].update(maximum=.0000000000001),
 lambda x:x['bound'].update(uniformBound=float('nan')),
 lambda x:x['swap'].update(failureProbability=.1234567)
]:
 mutant=copy.deepcopy(base);change(mutant)
 try:replay(mutant,base)
 except AssertionError:guards+=1
 else:raise AssertionError('Replay guard')
def independent_hull(points):
 # Gift wrapping: a different construction from the runtime's monotone chain.
 ps=sorted(set(map(tuple,points)))
 if len(ps)<2:return [list(p)for p in ps]
 start=ps[0];out=[];p=start
 while True:
  out.append(p);q=next(x for x in ps if x!=p)
  for r in ps:
   cross=(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0])
   if cross<0 or(cross==0 and sum((r[j]-p[j])**2 for j in range(2))>sum((q[j]-p[j])**2 for j in range(2))):q=r
  p=q
  if p==start:break
 return [list(p)for p in out+[start]]
def expected_geometry(s):
 ps=s['points'];t=s['selectedTarget'];w=t['witness'];o=t['obstruction']
 series=[[p for i,p in enumerate(ps)if t['labels'][i]==1],[p for i,p in enumerate(ps)if t['labels'][i]==0]]
 x0=min(p[0]for p in ps)-1;x1=max(p[0]for p in ps)+1;y0=min(p[1]for p in ps)-1;y1=max(p[1]for p in ps)+1
 if w:
  if w['kind']=='halfspace'and(w['wx']or w['wy']):
   pts=[]
   def add(x,y):
    if x0-1e-10<=x<=x1+1e-10 and y0-1e-10<=y<=y1+1e-10 and not any(abs(x-a)+abs(y-b)<1e-10 for a,b in pts):pts.append([x,y])
   if w['wy']:
    for x in [x0,x1]:add(x,-(w['wx']*x+w['b'])/w['wy'])
   if w['wx']:
    for y in [y0,y1]:add(-(w['wy']*y+w['b'])/w['wx'],y)
   series.append(pts[:2])
  elif w['kind']=='threshold':series.append([[w['thresholdTwice']/2,y0],[w['thresholdTwice']/2,y1]])
  elif w['kind']=='intervals':
   for ab in w['endpointsTwice']:
    for v in ab:series.append([[v/2,y0],[v/2,y1]])
 if o:
  if o['kind']=='radon':series +=[independent_hull([ps[i]for i in o['positive']]),independent_hull([ps[i]for i in o['negative']]),[[v/o['intersectionDenominator']for v in o['intersectionNumerator']]]]
  else:series.append([ps[i]for i in o['indices']])
 return series
def expected_points(s):
 n=s['parameters']['pointCount'];local=[max(r['count']for r in s['subsets']if len(r['indices'])==k)for k in range(n+1)]
 return [
  expected_geometry(s),
  [[[r['points'],r['points']]for r in s['growthRows']],[[r['points'],math.log2(r['growth'])]for r in s['growthRows']],[[r['points'],math.log2(r['sauer'])]for r in s['growthRows']]],
  [[[k,v]for k,v in enumerate(local)],[[r['points'],r['growth']]for r in s['growthRows'][:n+1]],[[k,2**k]for k in range(n+1)]],
  [[[r['index'],r[k]]for r in s['deletions']]for k in ['unionCount','intersectionCount','total']],
  [[[r['maximum'],r['probability']]for r in s['swap']['distribution']]],
  [[[r['samples'],math.log10(r[k])]for r in s['boundScan']]for k in ['uniformBound','realizableBound']]
 ]
def near_tree(a,b):
 if isinstance(b,list):
  assert isinstance(a,list)and len(a)==len(b)
  for x,y in zip(a,b):near_tree(x,y)
 else:assert abs(a-b)<=1e-11*max(1,abs(b))
def expected_tables(s):
 return {
 'parameters':[list(x)for x in s['parameters'].items()],
 'points':[[i,*p,s['selectedTarget']['labels'][i]]for i,p in enumerate(s['points'])],
 'labels':[[r[k]for k in ['mask','labels','feasible','witness','obstruction']]for r in s['geometry']['records']],
 'subsets':[[r[k]for k in ['subset','indices','patterns','count','shattered']]for r in s['subsets']],
 'deletions':[[r[k]for k in ['index','indices','zero','one','union','intersection','total','unionDimension','intersectionDimension']]for r in s['deletions']],
 'growth':[[r[k]for k in ['points','allLabels','growth','sauer','dimension','binomialTerms']]for r in s['growthRows']],
 'pairs':[[r[k]for k in ['pair','first','second','firstLabel','secondLabel']]for r in s['swap']['pairs']],
 'behaviors':[[r[k]for k in ['restriction','representative','members','firstLosses','secondLosses','differences']]for r in s['swap']['behaviors']],
 'swaps':[[r[k]for k in ['mask','signs','sums','maximum','meanGap','failure']]for r in s['swap']['rows']],
 'bounds':[[r[k]for k in ['samples','epsilon','dimension','growthAtDouble','sauerAtDouble','ghostApplicable','uniformRaw','uniformBound','realizableGhostApplicable','realizableRaw','realizableBound']]for r in s['boundScan']],
 'certificates':[[i]+[r[k]for k in ['alpha','positive','negative','weightSum','intersectionNumerator','intersectionDenominator']]for i,r in enumerate(s['geometry']['circuits'])]
 }
plotcoords=markers=table_rows=annotations=0;NS='{http://www.w3.org/2000/svg}'
for record,render in zip(d['records'],d['rendered']):
 assert len(render['plots'])==6 and len(render['tables'])==11 and len(render['svgs'])==6
 for p,source,expected in zip(render['plots'],render['svgs'],expected_points(record)):
  near_tree([s['points']for s in p['series']],expected)
  root=ET.fromstring(source);assert root.get('viewBox')=='0 0 900 580'and root.get('role')=='img'and root.get('aria-label')==p['title']
  assert root.find(NS+'title').text==p['title'];paths=[x for x in root.findall(NS+'path')if x.get('data-series')is not None];assert len(paths)==len(p['series'])
  expected_markers=[]
  for i,(series,path)in enumerate(zip(p['series'],paths)):
   assert path.get('data-series')==str(i)and path.get('stroke')==series['color']
   coords=re.findall(r'[ML](-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)',path.get('d',''));points=series['points'];assert len(coords)==len(points)
   for xy,(x,y)in zip(coords,points):
    assert math.isfinite(x)and math.isfinite(y)
    X=100+(x-p['xMin'])/(p['xMax']-p['xMin'])*755;Y=385-(y-p['yMin'])/(p['yMax']-p['yMin'])*290
    assert abs(float(xy[0])-X)<=.000001 and abs(float(xy[1])-Y)<=.000001;plotcoords+=2
    if series.get('markersOnly')or len(points)==1:expected_markers.append((X,Y,series['color'],'none'if series.get('hollow')else series['color'],series.get('markerRadius',5)))
  actual=root.findall(NS+'circle');assert len(actual)==len(expected_markers);markers+=len(actual)
  for point,(X,Y,color,fill,radius)in zip(actual,expected_markers):assert abs(float(point.get('cx'))-X)<1e-9 and abs(float(point.get('cy'))-Y)<1e-9 and point.get('stroke')==color and point.get('fill')==fill and float(point.get('r'))==radius
  labs=[x for x in root.findall(NS+'text')if x.get('data-point-label')is not None]
  if p['key']=='geometry':
   assert len(labs)==len(record['points'])
   for i,(node,(x,y))in enumerate(zip(labs,record['points'])):
    assert node.text==node.get('data-point-label')=='x'+str(i)
    assert abs(float(node.get('x'))-(108+(x-p['xMin'])/(p['xMax']-p['xMin'])*755))<1e-9
    assert abs(float(node.get('y'))-(375-(y-p['yMin'])/(p['yMax']-p['yMin'])*290))<1e-9;annotations+=1
  else:assert not labs
  if p['key']=='bounds':assert p['yMax']==0 and p['yMin']<=-1
  for node in root.findall(NS+'text'):
   if node.text in [s['name']for s in p['series']]:assert float(node.get('y'))+8<=580
 expected=expected_tables(record);assert {t['key']for t in render['tables']}==set(expected)
 for t in render['tables']:
  assert t['title']and t['headers']and t['rows']==expected[t['key']]
  for row in t['rows']:assert len(row)==len(t['headers'])
  table_rows+=len(t['rows'])
mutations=0
for change in [
 lambda x:x['points'][0].__setitem__(0,-3),
 lambda x:x['geometry']['records'][0]['witness'].update(b=1),
 lambda x:x['geometry']['records'][5]['obstruction']['alpha'].__setitem__(0,2),
 lambda x:x['geometry']['records'][5]['obstruction'].update(orientation=-1),
 lambda x:x['patterns'].pop(),
 lambda x:x['subsets'][3].update(shattered=False),
 lambda x:x['deletions'][0].update(unionCount=7),
 lambda x:x['deletions'][0].update(intersectionDimension=3),
 lambda x:x['growthRows'][5].update(growth=26),
 lambda x:x['swap']['pairs'][0].update(secondLabel=1),
 lambda x:x['swap']['behaviors'][0]['differences'].__setitem__(0,8),
 lambda x:x['swap']['rows'][0].update(maximum=99),
 lambda x:x['swap'].update(failureProbability=.123),
 lambda x:x['boundScan'][0].update(ghostApplicable=True),
 lambda x:x['boundScan'][7].update(uniformRaw=0),
 lambda x:x['boundScan'][15].update(realizableRaw=0)
]:
 mutant=copy.deepcopy(base);change(mutant)
 try:verify(mutant)
 except AssertionError:mutations+=1
 else:raise AssertionError('Undetected scientific mutation')
print(json.dumps({'status':'PASS','records':len(d['records']),'frozen':len(f['records']),'checks':science_checks,'plotCoordinates':plotcoords,'markers':markers,'annotations':annotations,'ledgerRows':table_rows,'invalid':d['invalid'],'feedback':d['feedback'],'mutations':mutations,'self':d['self']['checks'],'replayGuards':guards}))
