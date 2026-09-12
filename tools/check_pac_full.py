"""Independent integer / Fraction enumeration; no imports from submitted JS."""
from fractions import Fraction as F
from itertools import product
from math import factorial,exp,log,ceil,comb
from pathlib import Path
import json,sys
checks=0
def eq(a,b):
 global checks
 checks+=1
 assert a==b,(a,b)
def near(a,b):
 global checks
 checks+=1
 assert abs(a-b)<=3e-13*max(1,abs(a),abs(b)),(a,b)
def fraction(row,n,d):
 eq(row['numerator'],str(n));eq(row['denominator'],str(d));near(row['value'],float(F(n,d)))
def counts(n,k):
 if k==1:
  yield (n,);return
 for i in range(n+1):
  for t in counts(n-i,k-1):yield(i,)+t
def law(c):
 ps=[2*c['skewPercent'],100-c['skewPercent'],100-c['skewPercent']]
 return [ps[x]*(100-c['noisePercent'] if y==(c['truthMask']//2**x)%2 else c['noisePercent'])for x in range(3)for y in range(2)]
def verify_ensemble(e,c,full):
 m=c['trainCount'];H=c['hypotheses'];D=20000;eps=c['epsilonPercent'];nums=law(c);den=D**m
 losses=[[int((h//2**x)%2!=y)for x in range(3)for y in range(2)]for h in range(H)]
 risks=[sum(a*b for a,b in zip(row,nums))for row in losses];best=min(risks)
 if full:
  eq(e['parameters'],c)
  for j,z in enumerate(e['categories']):eq(z,dict(category=j,x=j//2,y=j%2,numerator=nums[j],denominator=D))
  for h,r in enumerate(e['hypotheses']):eq(r,dict(mask=h,predictions=[(h//2**x)%2 for x in range(3)],losses=losses[h],riskNumerator=risks[h],risk=risks[h]/D))
 weights=[];chosen=[0]*H;ev=[0,0,0];tot=[0,0,0,0];positive=0
 for index,ns in enumerate(counts(m,6)):
  mult=factorial(m)//__import__('math').prod(factorial(n)for n in ns)
  w=mult*__import__('math').prod(p**n for p,n in zip(nums,ns));weights.append(w);positive+=w>0
  errors=[sum(a*b for a,b in zip(row,ns))for row in losses];h=min(range(H),key=lambda j:(errors[j],j))
  gap=risks[h]-best;dev=max(abs(m*r-D*t)for r,t in zip(risks,errors))
  flags=[gap*100>eps*D,dev*200>eps*D*m,any(r*100>eps*D and t==0 for r,t in zip(risks,errors))]
  chosen[h]+=w
  for j,v in enumerate(flags):ev[j]+=w*v
  for j,v in enumerate([errors[h],risks[h],gap,dev]):tot[j]+=w*v
  if w and flags[0]:assert flags[1]
  if full:
   eq(e['rows'][index],dict(counts=list(ns),multiplicity=str(mult),weightNumerator=str(w),errors=errors,selected=h,minimumErrors=errors[h],excessNumerator=gap,maximumDeviationNumerator=dev,failure=flags[0],uniformFailure=flags[1],badConsistent=flags[2]))
 eq(sum(weights),den);eq(e['denominator'],str(den));eq(e['rowCount'],comb(m+5,5));eq(e['positiveRows'],positive)
 if full:eq(len(e['rows']),comb(m+5,5));fraction(e['total'],den,den)
 for key,n in zip(['failure','uniformFailure','badConsistent'],ev):fraction(e['events'][key],n,den)
 for h,n in enumerate(chosen):eq(e['selectedDistribution'][h]['mask'],h);fraction(e['selectedDistribution'][h],n,den)
 for k,n,d in zip(['trainRisk','trueRisk','excessRisk','uniformDeviation'],tot,[m,D,D,D*m]):fraction(e['expectations'][k],n,den*d)
 real=c['noisePercent']==0 and c['truthMask']<H;eq(e['realizable'],real)
 b=e['bounds'];epsilon=eps/100;delta=c['deltaPercent']/100
 near(b['agnosticRaw'],2*H*exp(-m*epsilon**2/2));near(b['agnostic'],min(1,2*H*exp(-m*epsilon**2/2)))
 eq(b['agnosticSufficientSamples'],ceil(2*log(2*H/delta)/epsilon**2))
 if real:
  u=sum((D-r)**m for r in risks if r*100>eps*D)
  fraction(b['realizableUnionRaw'],u,den);fraction(b['realizableUnion'],min(u,den),den)
  near(b['realizableRaw'],H*exp(-m*epsilon));near(b['realizable'],min(1,H*exp(-m*epsilon)))
  eq(b['realizableSufficientSamples'],ceil(log(H/delta)/epsilon))
  assert ev[0]<=ev[2]<=u
 else:
  for k in ['realizableRaw','realizable','realizableUnion','realizableUnionRaw','realizableSufficientSamples']:eq(b[k],None)
 if m<=3:
  # Separate ordered-sample enumeration confirms the count-space reduction.
  selected2=[0]*H
  for zs in product(range(6),repeat=m):
   w=__import__('math').prod(nums[z]for z in zs)
   h=min(range(H),key=lambda h:sum(losses[h][z]for z in zs))
   selected2[h]+=w
  eq(selected2,chosen)
def verify_observed(o,c):
 nums=law(c);state=c['seed'];zs=[]
 for i in range(c['trainCount']+32):
  state=(state^((state<<13)&0xffffffff))&0xffffffff
  state=(state^(state>>17))&0xffffffff
  state=(state^((state<<5)&0xffffffff))&0xffffffff
  r=F(state,2**32);acc=F(0);cat=None
  for j,p in enumerate(nums):
   acc+=F(p,20000)
   if r<acc:cat=j;break
  assert cat is not None;zs.append(cat)
  actual=(o['training']+o['holdout'])[i]
  for k,v in dict(index=i,uint32=state,category=cat,x=cat//2,y=cat%2).items():eq(actual[k],v)
 eq(o['finalState'],state);ns=[zs[:c['trainCount']].count(j)for j in range(6)];eq(o['trainingCounts'],ns)
 errs=[sum(int((h//2**(j//2))%2!=j%2)for j in zs[:c['trainCount']])for h in range(c['hypotheses'])]
 h=min(range(c['hypotheses']),key=lambda h:errs[h]);eq(o['selected'],h);eq(o['errors'],errs);eq(o['minimumErrors'],errs[h]);near(o['trainingRisk'],errs[h]/c['trainCount'])
 risks=[sum(p for j,p in enumerate(nums)if(g//2**(j//2))%2!=j%2)for g in range(c['hypotheses'])]
 gap=risks[h]-min(risks);dev=max(abs(c['trainCount']*r-20000*t)for r,t in zip(risks,errs))
 for k,v in dict(excessNumerator=gap,maximumDeviationNumerator=dev,failure=100*gap>20000*c['epsilonPercent'],uniformFailure=200*dev>20000*c['epsilonPercent']*c['trainCount'],badConsistent=any(100*r>20000*c['epsilonPercent'] and t==0 for r,t in zip(risks,errs))).items():eq(o[k],v)
 risk=sum(p for j,p in enumerate(nums)if(h//2**(j//2))%2!=j%2);near(o['trueRisk'],risk/20000)
 for z in o['holdout']:eq(z['prediction'],(h//2**z['x'])%2);eq(z['error'],int(z['prediction']!=z['y']))
 near(o['holdoutRisk'],sum(z['error']for z in o['holdout'])/32)
 eq(len(o['binomial']),33)
 for k,r in enumerate(o['binomial']):
  eq(r['errors'],k);eq(r['multiplicity'],str(comb(32,k)));fraction(r,comb(32,k)*risk**k*(20000-risk)**(32-k),20000**32)
 eq(sum(int(r['numerator'])for r in o['binomial']),20000**32)
def verify_nfl(n):
 eq(n['support'],6);eq(n['samples'],3);target=[];occ={}
 for xs in product(range(6),repeat=3):
  ns=tuple(xs.count(x)for x in range(6));occ[ns]=occ.get(ns,0)+1
 for r in n['occupancy']:eq(r['multiplicity'],str(occ[tuple(r['counts'])]));eq(r['unseen'],r['counts'].count(0))
 eq(len(n['occupancy']),56)
 for h in range(64):
  errors=[sum((h//2**x)%2 for x in range(6)if x not in xs)for xs in product(range(6),repeat=3)]
  r=n['targets'][h];eq(r['mask'],h);fraction(r['expectedRisk'],sum(errors),216*6);fraction(r['failureProbability'],sum(e*8>6 for e in errors),216);target.append(sum(errors))
 fraction(n['averageRisk'],sum(target),216*6*64);fraction(n['analyticAverageRisk'],125,432)
 eq(F(sum(target),216*6*64),F(125,432))
 for m,r in enumerate(n['rows'],1):
  eq(r['samples'],m);eq(r['adversarialSupport'],2*m);eq(r['fixedSupport'],6)
  for k,v in dict(adversarialUnseen=F(2*m-1,2*m)**m,adversarialAverageRisk=F(1,2)*F(2*m-1,2*m)**m,fixedUnseen=F(5,6)**m,fixedAverageRisk=F(1,2)*F(5,6)**m).items():near(r[k],float(v))
def verify(record):
 c=record['parameters'];eq(record['schemaVersion'],1);verify_ensemble(record['exact'],c,True);verify_observed(record['observed'],c)
 eq(len(record['sampleScan']),12)
 for m,e in enumerate(record['sampleScan'],1):eq(e['samples'],m);verify_ensemble(e,{**c,'trainCount':m},False)
 verify_nfl(record['nfl'])
from pathlib import Path
import subprocess,sys,json,hashlib,shutil,copy,re,math,xml.etree.ElementTree as ET
prefix=['rtk','proxy']if shutil.which('rtk')else[]
ROOT=Path(__file__).resolve().parents[1]
js=Path(sys.argv[1]).resolve()if len(sys.argv)>1 else ROOT/'course-shared/labs/pac-sample-complexity.js'
fixture=Path(sys.argv[2]).resolve()if len(sys.argv)>2 else ROOT/'course-shared/projects/pac-certificates/run-snapshot.json'
f=json.loads(fixture.read_text());assert f['provenance']['sourceSha256']==hashlib.sha256(js.read_bytes()).hexdigest()
code=r"""
const a=require(process.argv[1]),f=require(process.argv[2]);
const extras=[{hypotheses:2,truthMask:1},{hypotheses:4,truthMask:3},{hypotheses:5,truthMask:4},{hypotheses:6,truthMask:6},{hypotheses:7,truthMask:2},{hypotheses:1,truthMask:1,trainCount:1},{hypotheses:8,truthMask:0,noisePercent:40,skewPercent:80,trainCount:12},{hypotheses:8,truthMask:7,noisePercent:40,skewPercent:10,trainCount:12},{hypotheses:3,truthMask:2,noisePercent:1,seed:1,trainCount:2},{hypotheses:7,truthMask:6,noisePercent:39,seed:2,trainCount:3},{epsilonPercent:2,deltaPercent:30,trainCount:12},{epsilonPercent:50,deltaPercent:1,trainCount:1}];
const records=[...a.PRESETS.map(p=>a.compute(p.parameters)),...extras.map(p=>a.compute(p))],frozen=f.records.map(r=>a.compute(r.data.parameters));let invalid=0;
const bad=[null,[],1,'x',{x:0}];for(const k of Object.keys(a.DEFAULT)){for(const v of [null,'1',NaN,Infinity,-Infinity,1.5])bad.push({[k]:v});bad.push({[k]:a.LIMITS[k][0]-1},{[k]:a.LIMITS[k][1]+1});}
for(const p of bad){let rejected=false;try{a.compute(p)}catch(e){rejected=true}if(!rejected)throw Error('Invalid accepted '+JSON.stringify(p));invalid++;}
let feedback=0;for(let i=0;i<4;i++)for(let j=0;j<2;j++){const r=a.feedback(i,j);if(r.correct!==(j===a.QUESTIONS[i][2])||!r.text)throw Error('Feedback');feedback++;}
process.stdout.write(JSON.stringify({records,frozen,invalid,feedback,self:a.selfTest(),rendered:records.map(r=>({plots:a.plots(r),tables:a.tables(r),svgs:a.plots(r).map(a.svg)}))}));
"""
d=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js),str(fixture)],text=True))
assert len(d['records'])==24 and len(d['frozen'])==6 and d['self']['status']=='PASS'
for s in d['records']+d['frozen']+[r['data']for r in f['records']]:verify(s)
science_checks=checks
INTEGER_KEYS={'schemaVersion','hypotheses','epsilonPercent','deltaPercent','trainCount','noisePercent','truthMask','skewPercent','seed','category','x','y','mask','predictions','losses','riskNumerator','rowCount','positiveRows','counts','errors','selected','minimumErrors','excessNumerator','maximumDeviationNumerator','index','uint32','prediction','error','trainingCounts','finalState','support','samples','unseen','adversarialSupport','fixedSupport','agnosticSufficientSamples','realizableSufficientSamples'}
def replay(g,v,key=None):
 if isinstance(v,dict):
  assert isinstance(g,dict)and set(g)==set(v)
  for k in v:replay(g[k],v[k],k)
 elif isinstance(v,list):
  assert isinstance(g,list)and len(g)==len(v)
  for x,y in zip(g,v):replay(x,y,key)
 elif isinstance(v,bool)or v is None or isinstance(v,str):assert type(g)is type(v)and g==v
 elif key in INTEGER_KEYS:assert type(g)is int and type(v)is int and g==v
 else:assert isinstance(g,(float,int))and not isinstance(g,bool)and math.isfinite(g)and abs(g-v)<=2e-12*(1+abs(v)),(key,g,v)
for old,new in zip(f['records'],d['frozen']):replay(old['data'],new)
base=f['records'][0]['data'];guards=0
for change in [
 lambda x:x.update(schemaVersion=1.0000000000001),
 lambda x:x['parameters'].update(seed=123456789.00000001),
 lambda x:x['exact']['rows'][0].update(selected=.0000000000001),
 lambda x:x['exact']['rows'][0].update(failure=1),
 lambda x:x['exact']['rows'][0].update(weightNumerator=0),
 lambda x:x['observed']['training'][0].update(uint32=0.0000000000001),
 lambda x:x['exact']['events']['failure'].update(numerator=x['exact']['events']['failure']['numerator']+'0'),
 lambda x:x['exact']['bounds'].update(agnostic=float('nan')),
 lambda x:x['exact']['hypotheses'][0].update(risk=.001),
 lambda x:x['nfl']['occupancy'][0].update(unseen=5.0000000000001)
]:
 mutant=copy.deepcopy(base);change(mutant)
 try:replay(mutant,base)
 except AssertionError:guards+=1
 else:raise AssertionError('Replay guard')
def expected_points(s):
 e=s['exact'];o=s['observed'];scan=s['sampleScan'];n=s['nfl']
 p=[[[r['samples'],r['events']['failure']['value']]for r in scan],[[r['samples'],r['events']['uniformFailure']['value']]for r in scan],[[r['samples'],r['bounds']['agnostic']]for r in scan]]
 if e['realizable']:p += [[[r['samples'],r['events']['badConsistent']['value']]for r in scan],[[r['samples'],r['bounds']['realizableUnion']['value']]for r in scan],[[r['samples'],r['bounds']['realizable']]for r in scan]]
 return [p,[[[r['mask'],r['risk']]for r in e['hypotheses']],[[r['mask'],o['errors'][r['mask']]/s['parameters']['trainCount']]for r in e['hypotheses']]],[[[r['mask'],r['value']]for r in e['selectedDistribution']]],[[[r['samples'],r['expectations'][k]['value']]for r in scan]for k in ['trainRisk','trueRisk','excessRisk']],[[[r['errors'],r['value']]for r in o['binomial']]],[[[r['samples'],r['adversarialAverageRisk']]for r in n['rows']],[[r['samples'],r['fixedAverageRisk']]for r in n['rows']],[[1,.25],[24,.25]]]]
def expected_tables(s):
 e=s['exact'];o=s['observed']
 return {
 'parameters':[list(x)for x in s['parameters'].items()],
 'categories':[[r[k]for k in ['category','x','y','numerator','denominator']]for r in e['categories']],
 'rules':[[r['mask'],r['predictions'],r['losses'],r['riskNumerator'],r['risk'],o['errors'][r['mask']],e['selectedDistribution'][r['mask']]['value']]for r in e['hypotheses']],
 'events':[[k,r['value'],r['numerator'],r['denominator']]for group in ['events','expectations']for k,r in e[group].items()]+[[k,r['value']if isinstance(r,dict)else r,r['numerator']if isinstance(r,dict)else'—',r['denominator']if isinstance(r,dict)else'—']for k,r in e['bounds'].items()],
 'counts':[[r[k]for k in ['counts','multiplicity','weightNumerator','errors','selected','excessNumerator','maximumDeviationNumerator','failure','uniformFailure','badConsistent']]for r in e['rows']],
 'sample-scan':[[r['samples'],r['rowCount'],r['positiveRows'],r['events']['failure']['value'],r['events']['uniformFailure']['value'],r['events']['badConsistent']['value'],r['bounds']['realizable'],r['bounds']['agnostic'],r['expectations']['trainRisk']['value'],r['expectations']['trueRisk']['value'],r['expectations']['excessRisk']['value']]for r in s['sampleScan']],
 'training':[[r[k]for k in ['index','uint32','category','x','y']]for r in o['training']],
 'holdout':[[r[k]for k in ['index','uint32','category','x','y','prediction','error']]for r in o['holdout']],
 'binomial':[[r[k]for k in ['errors','multiplicity','numerator','denominator','value']]for r in o['binomial']],
 'nfl-targets':[[r['mask'],r['expectedRisk']['numerator'],r['expectedRisk']['denominator'],r['expectedRisk']['value'],r['failureProbability']['value']]for r in s['nfl']['targets']],
 'nfl-occupancy':[[r[k]for k in ['counts','multiplicity','unseen']]for r in s['nfl']['occupancy']]
 }
plotcoords=markers=table_rows=0;NS='{http://www.w3.org/2000/svg}'
for record,render in zip(d['records'],d['rendered']):
 assert len(render['plots'])==6 and len(render['tables'])==11 and len(render['svgs'])==6
 for p,source,expected in zip(render['plots'],render['svgs'],expected_points(record)):
  assert [s['points']for s in p['series']]==expected
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
    if series.get('markersOnly')or len(points)==1:expected_markers.append((X,Y,series['color']))
  actual=root.findall(NS+'circle');assert len(actual)==len(expected_markers);markers+=len(actual)
  for point,(X,Y,color)in zip(actual,expected_markers):assert abs(float(point.get('cx'))-X)<1e-9 and abs(float(point.get('cy'))-Y)<1e-9 and point.get('stroke')==color
  for node in root.findall(NS+'text'):
   if node.text in [s['name']for s in p['series']]:assert float(node.get('y'))+8<=580
  if p['key']!='holdout':assert p['yMin']==0 and p['yMax']==1 if p['key']!='nfl' else p['yMin']==0 and p['yMax']==.5
 expected=expected_tables(record);assert {t['key']for t in render['tables']}==set(expected)
 for t in render['tables']:
  assert t['title']and t['headers']and t['rows']==expected[t['key']]
  for row in t['rows']:assert len(row)==len(t['headers'])
  table_rows+=len(t['rows'])
mutations=0
for change in [
 lambda x:x['exact']['categories'][0].update(numerator=1),
 lambda x:x['exact']['hypotheses'][0].update(riskNumerator=0),
 lambda x:x['exact']['rows'][1].update(multiplicity='1'),
 lambda x:x['exact']['rows'][0].update(weightNumerator='1'),
 lambda x:x['exact']['rows'][0].update(selected=7),
 lambda x:x['exact']['events']['failure'].update(numerator='0'),
 lambda x:x['exact']['selectedDistribution'][0].update(value=.5),
 lambda x:x['exact']['bounds'].update(agnosticSufficientSamples=1),
 lambda x:x['exact']['expectations']['trueRisk'].update(value=0),
 lambda x:x['sampleScan'][0]['events']['failure'].update(value=0),
 lambda x:x['observed']['training'][0].update(uint32=0),
 lambda x:x['observed'].update(maximumDeviationNumerator=-1),
 lambda x:x['observed']['holdout'][0].update(error=1),
 lambda x:x['observed']['binomial'][0].update(numerator='0'),
 lambda x:x['nfl']['targets'][63]['expectedRisk'].update(value=0),
 lambda x:x['nfl']['occupancy'][0].update(multiplicity='0')
]:
 mutant=copy.deepcopy(base);change(mutant)
 try:verify(mutant)
 except AssertionError:mutations+=1
 else:raise AssertionError('Undetected scientific mutation')
print(json.dumps({'status':'PASS','records':len(d['records']),'frozen':len(f['records']),'checks':science_checks,'plotCoordinates':plotcoords,'markers':markers,'ledgerRows':table_rows,'invalid':d['invalid'],'feedback':d['feedback'],'mutations':mutations,'self':d['self']['checks'],'replayGuards':guards}))
