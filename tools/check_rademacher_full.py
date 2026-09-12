"""Independent exact sign enumeration, Fraction sample law, and feature/Gram checks."""
from pathlib import Path
from itertools import product
from fractions import Fraction as F
from functools import lru_cache
from math import comb,factorial,log,sqrt,fsum
import json,sys
checks=0;sample_rows=0;sign_rows=0
def ok(v):
 global checks
 checks+=1;assert v
def near(a,b):
 global checks
 checks+=1;assert abs(a-b)<=3e-12*max(1,abs(a),abs(b)),(a,b)
def fraction(r,x):
 ok(F(int(r['numerator']),int(r['denominator']))==x);near(r['value'],float(x))
def compositions(m,k):
 # Choose separator positions in a stars-and-bars string.
 from itertools import combinations
 for separators in combinations(range(m+k-1),k-1):
  positions=(-1,*separators,m+k-1)
  yield tuple(positions[i+1]-positions[i]-1 for i in range(k))
@lru_cache(None)
def all_signs(m):
 return tuple(tuple(1 if mask//2**i%2 else-1 for i in range(m))for mask in range(2**m))
@lru_cache(None)
def input_complexity(counts,H):
 xs=tuple(x for x,n in enumerate(counts)for _ in range(n));m=len(xs)
 vectors=[tuple(h//2**x%2 for x in xs)for h in range(H)]
 return sum(max(sum(u*v for u,v in zip(signs,vec))for vec in vectors)for signs in all_signs(m))
def categories(c):
 px=[F(c['skewPercent'],100),F(100-c['skewPercent'],200),F(100-c['skewPercent'],200)];eta=F(c['noisePercent'],100)
 return [px[x]*(1-eta if y==((5>>x)&1)else eta)for x in range(3)for y in range(2)]
def risks(c):
 probs=categories(c);return [sum(p*int(((h>>(j//2))&1)!=(j%2))for j,p in enumerate(probs))for h in range(c['hypotheses'])]
def check_ensemble(c,e,full=True):
 global sample_rows
 m=c['trainCount'];H=c['hypotheses'];probs=categories(c);rs=risks(c);dist={};Rmean=F(0);Pmean=F(0);Gmean=F(0);failure=F(0);slack=3*sqrt(log(200/c['deltaPercent'])/(2*m))
 if full:
  ok(e['rowCount']==comb(m+5,5)==len(e['rows']));ok(int(e['denominator'])==20000**m)
  for j,r in enumerate(e['categories']):ok(r==dict(category=j,x=j//2,y=j%2,truth=(5>>(j//2))&1,numerator=int(probs[j]*20000),denominator=20000))
  for h,r in enumerate(e['hypotheses']):
   ok(r['mask']==h and r['predictions']==[(h>>x)&1 for x in range(3)]);ok(r['losses']==[int(((h>>(j//2))&1)!=(j%2))for j in range(6)]);ok(r['riskNumerator']==rs[h]*20000);near(r['risk'],float(rs[h]))
  dist={tuple(r['counts']):r for r in e['rows']};ok(len(dist)==len(e['rows']))
 for counts in compositions(m,6):
  mult=factorial(m)
  for n in counts:mult//=factorial(n)
  weight=F(mult)
  for p,n in zip(probs,counts):weight*=p**n
  xs=tuple(counts[2*x]+counts[2*x+1]for x in range(3));rn=input_complexity(xs,H);R=F(rn,m*2**m)
  errors=[sum(n*int(((h>>(j//2))&1)!=(j%2))for j,n in enumerate(counts))for h in range(H)];selected=errors.index(min(errors));gaps=[r-F(k,m)for r,k in zip(rs,errors)];phi=max(gaps)
  failed=float(phi)>2*float(R)+slack
  Rmean+=weight*R;Pmean+=weight*phi;Gmean+=weight*gaps[selected];failure+=weight*failed
  if full:
   row=dist[counts];ok(row['inputCounts']==list(xs));ok(int(row['multiplicity'])==mult);ok(int(row['weightNumerator'])==weight*20000**m)
   ok(row['errors']==errors and row['selected']==selected);ok(row['phiNumerator']==phi*20000*m and row['selectedGapNumerator']==gaps[selected]*20000*m)
   ok(row['rademacherTotal']==rn and row['certificateFailure']==failed);near(row['complexity'],float(R));sample_rows+=1
 fraction(e['expectedComplexity'],Rmean);fraction(e['expectedPhi'],Pmean);fraction(e['expectedSelectedGap'],Gmean);fraction(e['certificateFailure'],failure);near(e['slack'],slack)
 ok(Pmean<=2*Rmean)
 if full:
  profiles={tuple(r['inputCounts']):r for r in e['inputProfiles']};ok(set(profiles)==set(compositions(m,3)))
  for xs,r in profiles.items():ok(r['totalMaximum']==input_complexity(xs,H));fraction(r['complexity'],F(input_complexity(xs,H),m*2**m));ok(r['signCount']==2**m)
def check_observation(c,o):
 global sign_rows
 m=c['trainCount'];H=c['hypotheses'];probs=categories(c);rs=risks(c);state=123456789;draws=[]
 for i in range(m):
  state=(state^(state<<13))&0xffffffff;state=(state^(state>>17))&0xffffffff;state=(state^(state<<5))&0xffffffff
  u=F(state,2**32);acc=F(0)
  for j,p in enumerate(probs):
   acc+=p
   if u<acc:break
  draws.append(dict(index=i,uint32=state,category=j,x=j//2,y=j%2))
 ok(o['draws']==draws and o['seed']==123456789 and o['finalState']==state)
 counts=[sum(d['category']==j for d in draws)for j in range(6)];xs=[sum(d['x']==x for d in draws)for x in range(3)]
 ok(o['counts']==counts and o['inputCounts']==xs)
 losses=[[int(((h>>d['x'])&1)!=d['y'])for d in draws]for h in range(H)]
 errors=list(map(sum,losses));ok(o['errors']==errors and o['selected']==errors.index(min(errors)))
 total=abstotal=shifted=scoretotal=0;means=[0]*H;ok(len(o['rows'])==2**m)
 for mask,(sgn,row)in enumerate(zip(all_signs(m),o['rows'])):
  sums=[sum(u*v for u,v in zip(sgn,vec))for vec in losses];best=max(sums);ab=max(map(abs,sums));shift=max(sum(u*(v+7)for u,v in zip(sgn,vec))for vec in losses)
  ss=max(sum(sgn[i]*(2*((h>>d['x'])&1)-1)for i,d in enumerate(draws))for h in range(H))
  ok(row==dict(mask=mask,signs=list(sgn),sums=sums,maximum=best,argmax=sums.index(best),absoluteMaximum=ab,translatedMaximum=shift,signedScoreMaximum=ss))
  total+=best;abstotal+=ab;shifted+=shift;scoretotal+=ss;means=[a+b for a,b in zip(means,sums)];sign_rows+=1
 for k,v in [('complexity',total),('absoluteComplexity',abstotal),('translatedComplexity',shifted),('signedScoreComplexity',scoretotal),('supAfterMean',max(means))]:fraction(o[k],F(v,m*2**m))
 ok(total==shifted and scoretotal==2*total and all(v==0 for v in means))
 ok(total==input_complexity(tuple(xs),H));ok(0<=F(total,m*2**m)<=F(1,2))
 N=len(set(map(tuple,losses)));ok(o['distinctPatterns']==N);near(o['massartUncentered'],sqrt(2*max(errors)*log(N))/m);near(o['massartCentered'],sqrt(log(N)/(2*m)))
 near(o['slack'],3*sqrt(log(200/c['deltaPercent'])/(2*m)))
 for h,r in enumerate(o['hypotheses']):
  ok(r['mask']==h);near(r['trainingRisk'],errors[h]/m);near(r['trueRisk'],float(rs[h]));near(r['gap'],float(rs[h])-errors[h]/m)
  raw=errors[h]/m+2*total/(m*2**m)+o['slack'];near(r['certificateRaw'],raw);near(r['certificate'],min(1,raw))
 g=o['grouped'];ok(g['inputCounts']==xs and g['totalMaximum']==total and g['signCount']==2**m);fraction(g['complexity'],F(total,m*2**m))
 ok(len(g['rows'])==(xs[0]+1)*(xs[1]+1)*(xs[2]+1))
 for positive,row in zip(product(*(range(n+1)for n in xs)),g['rows']):
  sums=[sum((2*k-n)*((h>>x)&1)for x,(k,n)in enumerate(zip(positive,xs)))for h in range(H)]
  mult=1
  for n,k in zip(xs,positive):mult*=comb(n,k)
  ok(row==dict(positives=list(positive),signedCounts=[2*k-n for k,n in zip(positive,xs)],multiplicity=mult,sums=sums,maximum=max(sums),argmax=sums.index(max(sums))))
def feature_domain(mode):
 if mode=='same':return [[1,0]for _ in range(8)]
 if mode=='zero':return [[0,0]for _ in range(8)]
 if mode=='orthogonal':return [[int(i==j)for j in range(8)]for i in range(8)]
 if mode=='cross':return [[1,0],[0,1],[-1,0],[0,-1]]*2
 return [[1,t,t*t]for t in range(-3,5)]
def check_linear(c,l):
 global sign_rows
 domain=feature_domain(c['featureMode']);ps=domain[:c['trainCount']];m=len(ps);q=len(ps[0]);scale=c['scalePercent']/100;rho=c['marginPercent']/100
 ok(l['domain']==domain and l['points']==ps and l['chosenWeight']==[1]+[0]*(q-1)and l['weightNormBound']==1)
 K=[[sum(x*y for x,y in zip(a,b))for b in ps]for a in ps];ok(l['gram']==K);trace=sum(K[i][i]for i in range(m));ok(l['trace']==trace)
 norms=[];squares=[];ok(len(l['rows'])==2**m)
 for mask,(sgn,r)in enumerate(zip(all_signs(m),l['rows'])):
  vector=[sum(sgn[i]*p[j]for i,p in enumerate(ps))for j in range(q)];sq=sum(x*x for x in vector);quadratic=sum(sgn[i]*sgn[j]*K[i][j]for i in range(m)for j in range(m));ok(sq==quadratic)
  ok(r['mask']==mask and r['signs']==list(sgn)and r['vector']==vector and r['squaredNorm']==sq and r['gramQuadratic']==quadratic)
  norms.append(sqrt(sq));squares.append(sq);near(r['supremum'],scale*sqrt(sq)/m)
  opt=r['optimizer'];ok(len(opt)==q);near(sum(v*v for v in opt),1 if sq and scale else 0)
  near(sum(v*x*scale for v,x in zip(opt,vector))/m,r['supremum']);sign_rows+=1
 ok(l['normSpectrum']==[dict(squaredNorm=v,count=squares.count(v))for v in sorted(set(squares))])
 near(l['meanSquaredNorm'],sum(squares)/2**m);ok(sum(squares)==trace*2**m)
 exact=scale*fsum(norms)/(m*2**m);jensen=scale*sqrt(trace)/m;R2=max(sum(x*x for x in p)for p in domain);R=scale*sqrt(R2)
 near(l['exact'],exact);near(l['jensen'],jensen);ok(exact<=jensen+1e-14);ok(l['radiusSquared']==R2);near(l['radius'],R);near(l['populationUpper'],R/sqrt(m))
 ramps=[]
 for i,(p,r)in enumerate(zip(ps,l['losses'])):
  y=-1 if p[0]<0 else 1;score=scale*p[0];margin=y*score;num=max(0,min(c['marginPercent'],c['marginPercent']-y*c['scalePercent']*p[0]))
  ok(r['index']==i and r['features']==p and r['label']==y);near(r['score'],score);near(r['margin'],margin)
  ok(r['zeroMarginError']==(margin<=0)and r['classificationError']==((1 if score>=0 else-1)!=y))
  ok(r['rampNumerator']==num and r['rampDenominator']==c['marginPercent']);near(r['rampLoss'],num/c['marginPercent']);ramps.append(F(num,c['marginPercent']))
 empirical=float(sum(ramps)/m);penalty=2*exact/rho+3*sqrt(log(200/c['deltaPercent'])/(2*m))
 near(l['empiricalRamp'],empirical);near(l['empiricalPenalty'],penalty);near(l['empiricalCertificateRaw'],empirical+penalty);near(l['empiricalCertificate'],min(1,empirical+penalty))
 ok(len(l['scan'])==2000)
 for M,r in enumerate(l['scan'],1):
  ok(r['samples']==M);a=2*R/(rho*sqrt(M));b=sqrt(log(100/c['deltaPercent'])/(2*M))
  near(r['complexityPenalty'],a);near(r['concentration'],b);near(r['totalPenalty'],a+b)
def verify(s):
 c=s['parameters'];check_ensemble(c,s['exact']);check_observation(c,s['observed']);check_linear(c,s['linear'])
 ok(len(s['sampleScan'])==8)
 for m,e in enumerate(s['sampleScan'],1):ok(e['samples']==m and e['rowCount']==comb(m+5,5));check_ensemble({**c,'trainCount':m},e,False)
 domain=feature_domain(c['featureMode']);scale=c['scalePercent']/100;R=scale*sqrt(max(sum(v*v for v in p)for p in domain));ok(len(s['linearSampleScan'])==8)
 for m,r in enumerate(s['linearSampleScan'],1):
  ps=domain[:m];trace=sum(v*v for p in ps for v in p);terms=[]
  for signs in all_signs(m):terms.append(sqrt(sum(sum(signs[i]*p[j]for i,p in enumerate(ps))**2 for j in range(len(ps[0])))))
  ok(r['samples']==m and r['trace']==trace);near(r['exact'],scale*fsum(terms)/(m*2**m));near(r['jensen'],scale*sqrt(trace)/m);near(r['populationUpper'],R/sqrt(m));near(r['radius'],R)
from pathlib import Path
import subprocess,sys,json,hashlib,shutil,copy,re,math,xml.etree.ElementTree as ET
prefix=['rtk','proxy']if shutil.which('rtk')else[]
ROOT=Path(__file__).resolve().parents[1]
js=Path(sys.argv[1]).resolve()if len(sys.argv)>1 else ROOT/'course-shared/labs/rademacher-complexity.js'
fixture=Path(sys.argv[2]).resolve()if len(sys.argv)>2 else ROOT/'course-shared/projects/rademacher-certificates/run-snapshot.json'
f=json.loads(fixture.read_text());assert f['provenance']['sourceSha256']==hashlib.sha256(js.read_bytes()).hexdigest()
code=r"""
const a=require(process.argv[1]),f=require(process.argv[2]);
const extras=[{hypotheses:2,trainCount:2},{hypotheses:3,noisePercent:1},{hypotheses:5,trainCount:3},{hypotheses:6,noisePercent:39},{hypotheses:7,trainCount:7},{hypotheses:1,trainCount:1,scalePercent:1,marginPercent:10},{hypotheses:8,noisePercent:40,skewPercent:10,trainCount:8},{hypotheses:1,noisePercent:40,skewPercent:80,trainCount:8},{featureMode:'polynomial',trainCount:8,scalePercent:200,marginPercent:10,deltaPercent:1},{featureMode:'cross',trainCount:3,scalePercent:37,marginPercent:137,deltaPercent:25},{featureMode:'orthogonal',trainCount:1,scalePercent:0},{featureMode:'zero',trainCount:8,scalePercent:200,marginPercent:200}];
const records=[...a.PRESETS.map(p=>a.compute(p.parameters)),...extras.map(p=>a.compute(p))],frozen=f.records.map(r=>a.compute(r.data.parameters));let invalid=0;
const bad=[null,[],1,'x',{x:0},{featureMode:null},{featureMode:'bad'},{featureMode:0},{featureMode:[]},{featureMode:{}}];for(const[k,[lo,hi]]of Object.entries(a.LIMITS))for(const v of [null,'1',NaN,Infinity,-Infinity,1.5,lo-1,hi+1])bad.push({[k]:v});
for(const p of bad){let rejected=false;try{a.compute(p)}catch(e){rejected=true}if(!rejected)throw Error('Invalid accepted '+JSON.stringify(p));invalid++;}
let feedback=0;for(let i=0;i<4;i++)for(let j=0;j<2;j++){const r=a.feedback(i,j);if(r.correct!==(j===a.QUESTIONS[i][2])||!r.text)throw Error('Feedback');feedback++;}
process.stdout.write(JSON.stringify({records,frozen,invalid,feedback,self:a.selfTest(),rendered:records.map(r=>({plots:a.plots(r),tables:a.tables(r),svgs:a.plots(r).map(a.svg)}))}));
"""
d=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js),str(fixture)],text=True))
assert len(d['records'])==24 and len(d['frozen'])==6 and d['self']['status']=='PASS'
for s in d['records']+d['frozen']+[r['data']for r in f['records']]:verify(s)
science_checks=checks
INTEGER_KEYS={'schemaVersion','hypotheses','trainCount','noisePercent','skewPercent','deltaPercent','marginPercent','scalePercent','samples','rowCount','category','x','y','truth','mask','predictions','losses','riskNumerator','seed','finalState','index','uint32','counts','inputCounts','errors','selected','signs','sums','maximum','argmax','absoluteMaximum','translatedMaximum','signedScoreMaximum','distinctPatterns','positives','signedCounts','multiplicity','signCount','totalMaximum','phiNumerator','selectedGapNumerator','rademacherTotal','domain','points','gram','trace','radiusSquared','vector','squaredNorm','gramQuadratic','count','meanSquaredNorm','features','label','rampNumerator','rampDenominator'}
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
 lambda x:x['parameters'].update(trainCount=6.0000000000001),
 lambda x:x['observed']['draws'][0].update(uint32=0.0000000000001),
 lambda x:x['observed']['rows'][0].update(argmax=.0000000000001),
 lambda x:x['exact']['rows'][0].update(certificateFailure=0),
 lambda x:x['exact']['rows'][0].update(weightNumerator=0),
 lambda x:x['linear']['gram'][0].__setitem__(0,1.0000000000001),
 lambda x:x['linear'].update(exact=float('nan')),
 lambda x:x['observed']['complexity'].update(numerator=x['observed']['complexity']['numerator']+'0'),
 lambda x:x['linear']['losses'][0].update(rampNumerator=.0000000000001)
]:
 mutant=copy.deepcopy(base);change(mutant)
 try:replay(mutant,base)
 except AssertionError:guards+=1
 else:raise AssertionError('Replay guard')
def expected_points(s):
 o=s['observed'];l=s['linear'];m=s['parameters']['trainCount'];rho=s['parameters']['marginPercent']/100;xmax=max(2,max(r['margin']/rho for r in l['losses']))
 penalty=[]
 if l['radius']>0:penalty.append([[math.log10(r['samples']),math.log10(r['complexityPenalty'])]for r in l['scan']])
 penalty += [[[math.log10(r['samples']),math.log10(r[k])]for r in l['scan']]for k in ['concentration','totalPenalty']]
 return [
  [[[r['mask'],r[k]/m]for r in o['rows']]for k in ['maximum','absoluteMaximum']]+[[[0,0],[2**m-1,0]]],
  [[[r['samples'],r['expectedPhi']['value']]for r in s['sampleScan']],[[r['samples'],2*r['expectedComplexity']['value']]for r in s['sampleScan']],[[r['samples'],r['expectedSelectedGap']['value']]for r in s['sampleScan']]],
  [[[r['samples'],r[k]]for r in s['linearSampleScan']]for k in ['exact','jensen','populationUpper']],
  [[[r['squaredNorm'],r['count']/2**m]for r in l['normSpectrum']]],
  [[[-1,1],[0,1],[1,0],[xmax,0]],[[r['margin']/rho,r['rampLoss']]for r in l['losses']]],
  penalty
 ]
def expected_tables(s):
 o=s['observed'];l=s['linear']
 return {
 'parameters':[list(x)for x in s['parameters'].items()],
 'law':[[r[k]for k in ['category','x','y','truth','numerator','denominator']]for r in s['exact']['categories']],
 'observations':[[r[k]for k in ['index','uint32','category','x','y']]for r in o['draws']],
 'rules':[[r['mask'],s['exact']['hypotheses'][r['mask']]['predictions']]+[r[k]for k in ['trainingRisk','trueRisk','gap','certificateRaw','certificate']]for r in o['hypotheses']],
 'signs':[[r[k]for k in ['mask','signs','sums','maximum','argmax','absoluteMaximum','translatedMaximum','signedScoreMaximum']]for r in o['rows']],
 'grouped':[[r[k]for k in ['positives','signedCounts','multiplicity','sums','maximum','argmax']]for r in o['grouped']['rows']],
 'ensemble':[[r[k]for k in ['counts','inputCounts','multiplicity','weightNumerator','errors','selected','phiNumerator','selectedGapNumerator','rademacherTotal','complexity','certificateFailure']]for r in s['exact']['rows']],
 'sample-scan':[[r[k]for k in ['samples','rowCount','expectedComplexity','expectedPhi','expectedSelectedGap','certificateFailure','slack']]for r in s['sampleScan']],
 'features':[[i,p,i<s['parameters']['trainCount']]+[l['losses'][i][k]if i<len(l['losses'])else None for k in ['label','score','margin','zeroMarginError','classificationError','rampNumerator','rampDenominator','rampLoss']]for i,p in enumerate(l['domain'])],
 'gram':[[i]+r for i,r in enumerate(l['gram'])],
 'linear-signs':[[r[k]for k in ['mask','signs','vector','squaredNorm','gramQuadratic','supremum','optimizer']]for r in l['rows']],
 'norm-spectrum':[[r['squaredNorm'],r['count']]for r in l['normSpectrum']],
 'penalty':[[r[k]for k in ['samples','complexityPenalty','concentration','totalPenalty']]for r in l['scan']]
 }
plotcoords=markers=table_rows=0;NS='{http://www.w3.org/2000/svg}'
for record,render in zip(d['records'],d['rendered']):
 assert len(render['plots'])==6 and len(render['tables'])==13 and len(render['svgs'])==6
 for p,source,expected in zip(render['plots'],render['svgs'],expected_points(record)):
  replay([s['points']for s in p['series']],expected)
  assert p['xMin']<p['xMax'] and p['yMin']<p['yMax']
  root=ET.fromstring(source);assert root.get('viewBox')=='0 0 900 580'and root.get('role')=='img'and root.get('aria-label')==p['title']
  assert root.find(NS+'title').text==p['title'];paths=[x for x in root.findall(NS+'path')if x.get('data-series')is not None];assert len(paths)==len(p['series'])
  expected_markers=[]
  for i,(series,path)in enumerate(zip(p['series'],paths)):
   assert path.get('data-series')==str(i)and path.get('stroke')==series['color']
   coords=re.findall(r'[ML](-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)',path.get('d',''));points=series['points'];assert len(coords)==len(points)
   assert path.get('d').count('M')==(len(points)if series.get('markersOnly')else 1)
   for xy,(x,y)in zip(coords,points):
    assert math.isfinite(x)and math.isfinite(y)
    assert p['xMin']-1e-12<=x<=p['xMax']+1e-12 and p['yMin']-1e-12<=y<=p['yMax']+1e-12
    X=100+(x-p['xMin'])/(p['xMax']-p['xMin'])*755;Y=385-(y-p['yMin'])/(p['yMax']-p['yMin'])*290
    assert abs(float(xy[0])-X)<=.000001 and abs(float(xy[1])-Y)<=.000001;plotcoords+=2
    if series.get('markersOnly')or len(points)==1:expected_markers.append((X,Y,series['color'],'none'if series.get('hollow')else series['color']))
  actual=root.findall(NS+'circle');assert len(actual)==len(expected_markers);markers+=len(actual)
  for point,(X,Y,color,fill)in zip(actual,expected_markers):assert abs(float(point.get('cx'))-X)<1e-9 and abs(float(point.get('cy'))-Y)<1e-9 and point.get('stroke')==color and point.get('fill')==fill and float(point.get('r'))==5
  for node in root.findall(NS+'text'):
   if node.text in [s['name']for s in p['series']]:assert float(node.get('y'))+8<=580
 expected=expected_tables(record);assert {t['key']for t in render['tables']}==set(expected)
 for t in render['tables']:
  assert t['title']and t['headers'];replay(t['rows'],expected[t['key']])
  for row in t['rows']:assert len(row)==len(t['headers'])
  table_rows+=len(t['rows'])
mutations=0
for change in [
 lambda x:x['exact']['categories'][0].update(numerator=1),
 lambda x:x['exact']['hypotheses'][0].update(riskNumerator=0),
 lambda x:x['exact']['rows'][1].update(multiplicity='1'),
 lambda x:x['exact']['rows'][0].update(weightNumerator='1'),
 lambda x:x['exact']['rows'][0].update(selected=7),
 lambda x:x['exact']['expectedComplexity'].update(numerator='0'),
 lambda x:x['exact']['inputProfiles'][0].update(totalMaximum=0),
 lambda x:x['sampleScan'][0]['expectedPhi'].update(value=0),
 lambda x:x['observed']['draws'][0].update(uint32=0),
 lambda x:x['observed']['rows'][0].update(maximum=99),
 lambda x:x['observed'].update(massartCentered=0),
 lambda x:x['linear']['gram'][0].__setitem__(0,2),
 lambda x:x['linear']['rows'][0].update(squaredNorm=0),
 lambda x:x['linear'].update(radius=0),
 lambda x:x['linear']['losses'][0].update(rampNumerator=99),
 lambda x:x['linear']['scan'][0].update(totalPenalty=0),
 lambda x:x['linearSampleScan'][0].update(exact=0),
 lambda x:x['linear']['normSpectrum'][0].update(count=0)
]:
 mutant=copy.deepcopy(base);change(mutant)
 try:verify(mutant)
 except AssertionError:mutations+=1
 else:raise AssertionError('Undetected scientific mutation')
print(json.dumps({'status':'PASS','records':len(d['records']),'frozen':len(f['records']),'checks':science_checks,'plotCoordinates':plotcoords,'markers':markers,'ledgerRows':table_rows,'invalid':d['invalid'],'feedback':d['feedback'],'mutations':mutations,'self':d['self']['checks'],'replayGuards':guards}))
