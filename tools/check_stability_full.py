"""Independent Fraction ERM and direct-weight online reconstruction."""
from pathlib import Path
from fractions import Fraction as F
from functools import lru_cache
from itertools import product
from math import comb,exp,log,sqrt,fsum
import json,sys
checks=0;count_rows=0;path_rows=0
def ok(x):
 global checks
 checks+=1;assert x
def near(a,b):
 global checks
 checks+=1;assert abs(a-b)<=4e-12*(1+abs(a)+abs(b)),(a,b)
def frac(r,v):
 ok(type(r['numerator'])is str and type(r['denominator'])is str)
 ok(int(r['numerator'])==v.numerator and int(r['denominator'])==v.denominator);near(r['value'],float(v))
@lru_cache(None)
def stable(m,lp,pp,delta):
 lam=F(lp,100);mu=F(2*pp-100,100);opt=(1-abs(mu))/2;den=100**m;rows=[]
 for k in range(m+1):
  mean=F(2*k-m,m);u=mean/(2*lam);w=max(F(-1),min(F(1),u));train=(1-w*mean)/2;risk=(1-w*mu)/2;reg=lam*w*w/2
  row={'positiveCount':k,'multiplicity':comb(m,k),'probabilityNumerator':comb(m,k)*pp**k*(100-pp)**(m-k),'mean':mean,'unconstrained':u,'weight':w,'gradient':lam*w-mean/2,'trainingRisk':train,'populationRisk':risk,'gap':risk-train,'excess':risk-opt,'objective':train+reg,'regularizer':reg,'testLosses':[(1+w)/2,(1-w)/2]}
  assert row['gradient']==0 if -1<w<1 else row['gradient']>=0 if w==-1 else row['gradient']<=0
  rows.append(row)
 beta=max(abs(rows[k+1]['weight']-rows[k]['weight'])/2 for k in range(m))
 theorem=F(50,lp*m);cap=min(F(1),theorem);slack=sqrt(log(100/delta)/(2*m));bound=float(cap)+(2*m*float(cap)+1)*slack;exactbound=float(beta)+(2*m*float(beta)+1)*slack
 expected={k:sum((F(r['probabilityNumerator'],den)*r[k]for r in rows),F())for k in ['trainingRisk','populationRisk','gap','excess','weight']}
 expected['absoluteGap']=sum((F(r['probabilityNumerator'],den)*abs(r['gap'])for r in rows),F());expected['squaredWeight']=sum((F(r['probabilityNumerator'],den)*r['weight']**2 for r in rows),F())
 for r in rows:r['certificateFailure']=float(r['gap'])>bound;r['exactCertificateFailure']=float(r['gap'])>exactbound
 failure=F(sum(r['probabilityNumerator']for r in rows if r['certificateFailure']),den);exactfailure=F(sum(r['probabilityNumerator']for r in rows if r['exactCertificateFailure']),den)
 return rows,beta,theorem,cap,bound,exactbound,expected,opt,mu,den,failure,exactfailure
def verify_stable(c,s,detail):
 global count_rows
 m=c['trainCount'];lp=c['lambdaPercent'];pp=c['positivePercent'];rows,beta,theorem,cap,bound,exactbound,e,opt,mu,den,failure,exactfailure=stable(m,lp,pp,c['deltaPercent'])
 ok(s['samples']==m and s['lambdaPercent']==lp and s['positivePercent']==pp and s['probabilityDenominator']==str(den))
 for k,v in [('populationMean',mu),('populationOptimum',opt),('theoreticalBeta',theorem),('cappedBeta',cap),('actualUniformBeta',beta),('certificateFailure',failure),('exactCertificateFailure',exactfailure),('excessBound',cap+F(lp,200))]:frac(s[k],v)
 near(s['gapBound'],bound);near(s['exactGapBound'],exactbound)
 for k,v in e.items():frac(s['expected'][k],v)
 ok(abs(e['gap'])<=beta<=cap);ok(e['excess']<=cap+F(lp,200));ok(failure<=F(c['deltaPercent'],100)and exactfailure<=F(c['deltaPercent'],100))
 ok(e['populationRisk']-e['trainingRisk']==e['gap']);ok(e['absoluteGap']>=abs(e['gap']))
 if detail:
  ok(len(s['fits'])==m+1 and len(s['neighbors'])==m and s['selected']==s['fits'][c['trainPositives']])
  for actual,row in zip(s['fits'],rows):
   count_rows+=1;ok(actual['positiveCount']==row['positiveCount'])
   for k in ['multiplicity','probabilityNumerator']:ok(actual[k]==str(row[k]))
   for k in ['mean','unconstrained','weight','gradient','trainingRisk','populationRisk','gap','excess','objective','regularizer']:frac(actual[k],row[k])
   for a,b in zip(actual['testLosses'],row['testLosses']):frac(a,b)
   for k in ['certificateFailure','exactCertificateFailure']:ok(type(actual[k])is bool and actual[k]==row[k])
  for k,n in enumerate(s['neighbors']):
   dw=abs(rows[k+1]['weight']-rows[k]['weight']);ok(n['from']==k and n['to']==k+1);frac(n['weightDifference'],dw);frac(n['uniformSensitivity'],dw/2)
   for test,a in enumerate(n['lossDifferences']):frac(a,abs(rows[k+1]['testLosses'][test]-rows[k]['testLosses'][test]))
def direct_online(labels,ep):
 eta=ep/100;weights=[1.,1.];cum=[0.,0.];online=ogdloss=dynamic=mix=gap=wp=wo=postw=postloss=0.;w=0.;rows=[];T=len(labels)
 for t,y in enumerate(labels):
  total=fsum(weights);p=[v/total for v in weights];pre=p[1]-p[0];ls=[(1+y)/2,(1-y)/2];r=fsum(p[k]*ls[k]for k in range(2));before=log(total/2);ratio=fsum(p[k]*exp(-eta*ls[k])for k in range(2));ml=-log(ratio)/eta;g=r-ml;gradient=-y/2;unprojected=w-eta*gradient;nextw=max(-1,min(1,unprojected));ol=(1-y*w)/2
  wp+=pre;wo+=w;online+=r;ogdloss+=ol;dynamic+=min(ls);mix+=ml;gap+=g
  for k in range(2):cum[k]+=ls[k];weights[k]*=exp(-eta*ls[k])
  postp=[v/fsum(weights)for v in weights];post=postp[1]-postp[0];postw+=post;postloss+=(1-y*post)/2
  rows.append({'round':t+1,'label':y,'probabilities':p,'preWeight':pre,'losses':ls,'learnerLoss':r,'cumulativeLearner':online,'cumulativeExperts':cum[:],'bestFixedLoss':min(cum),'regret':online-min(cum),'dynamicComparator':dynamic,'logPotentialBefore':before,'logPotentialAfter':log(fsum(weights)/2),'logRatio':log(ratio),'mixLoss':ml,'mixGap':g,'cumulativeMixLoss':mix,'cumulativeMixGap':gap,'hoeffdingAllowance':eta/8,'bound':log(2)/eta+eta*(t+1)/8,'postProbabilities':postp,'postWeight':post,'ogdWeight':w,'ogdGradient':gradient,'ogdUnprojected':unprojected,'ogdNextWeight':nextw,'ogdLoss':ol,'cumulativeOgd':ogdloss,'ogdRegret':ogdloss-min(cum),'ogdBound':2/eta+eta*(t+1)/8});w=nextw
 comparator=-1 if cum[0]<=cum[1]else 1
 for row in rows:
  row.update(comparator=comparator,ogdDistanceBefore=(row['ogdWeight']-comparator)**2,ogdDistanceAfter=(row['ogdNextWeight']-comparator)**2)
  row['ogdPotentialUpper']=(row['ogdDistanceBefore']-row['ogdDistanceAfter'])/(2*eta)+eta*row['ogdGradient']**2/2
  row['ogdComparatorDifference']=row['ogdLoss']-(1-row['label']*comparator)/2
 return {'rounds':T,'eta':eta,'experts':[-1,1],'learnerLoss':online,'expertLosses':cum,'bestFixedLoss':min(cum),'comparator':comparator,'regret':online-min(cum),'bound':log(2)/eta+eta*T/8,'optimalEta':sqrt(8*log(2)/T),'optimalBound':sqrt(T*log(2)/2),'dynamicComparator':dynamic,'logPotential':log(fsum(weights)/2),'mixLoss':mix,'mixGap':gap,'comparatorPotentialSlack':log(2)+log(fsum(weights)/2)+eta*min(cum),'averageWeight':wp/T,'averageOgdWeight':wo/T,'ogdLoss':ogdloss,'ogdRegret':ogdloss-min(cum),'ogdBound':2/eta+eta*T/8,'postUpdateAverageWeight':postw/T,'postUpdateLeakedLoss':postloss,'rows':rows}
def numerical_tree(a,b):
 if isinstance(b,dict):
  ok(set(a)==set(b))
  for k,v in b.items():numerical_tree(a[k],v)
 elif isinstance(b,list):
  ok(len(a)==len(b))
  for x,y in zip(a,b):numerical_tree(x,y)
 else:near(a,b)
def sequence(c):
 T=c['rounds'];mode=c['sequence']
 if mode=='steady':return[1]*T
 if mode=='alternating':return[1 if i%2==0 else-1 for i in range(T)]
 if mode=='switch':return[1 if i<(T+1)//2 else-1 for i in range(T)]
 if mode=='tie':return[0]*T
 # For complementary binary losses the larger-weight expert is the one that won more past labels.
 total=0;ys=[]
 for _ in range(T):y=-1 if total>=0 else 1;ys.append(y);total+=y
 return ys
@lru_cache(None)
def paths(T,ep,pp):
 den=100**T;mu=F(2*pp-100,100);opt=float((1-abs(mu))/2);rows=[]
 for mask in range(2**T):
  ys=[2*((mask>>i)&1)-1 for i in range(T)];k=ys.count(1);probnum=pp**k*(100-pp)**(T-k);o=direct_online(ys,ep);risk=(1-float(mu)*o['averageWeight'])/2;ogdrisk=(1-float(mu)*o['averageOgdWeight'])/2
  rows.append({'mask':mask,'positiveCount':k,'probabilityNumerator':str(probnum),'averageWeight':o['averageWeight'],'onlineLoss':o['learnerLoss']/T,'risk':risk,'excess':risk-opt,'regret':o['regret'],'bestFixedLoss':o['bestFixedLoss']/T,'averageOgdWeight':o['averageOgdWeight'],'ogdRisk':ogdrisk,'ogdOnlineLoss':o['ogdLoss']/T,'ogdExcess':ogdrisk-opt,'ogdRegret':o['ogdRegret'],'postUpdateRisk':(1-float(mu)*o['postUpdateAverageWeight'])/2,'postUpdateLeakedLoss':o['postUpdateLeakedLoss']/T})
 keys=['risk','onlineLoss','excess','regret','bestFixedLoss','ogdRisk','ogdOnlineLoss','ogdExcess','ogdRegret','postUpdateRisk','postUpdateLeakedLoss']
 expected={k:fsum(float(F(int(r['probabilityNumerator']),den))*r[k]for r in rows)for k in keys}
 return rows,expected,den,float(mu),opt
def verify_batch(c,s,detail):
 global path_rows
 T=s['rounds'];ep=c['etaPercent'];pp=c['positivePercent'];rows,e,den,mu,opt=paths(T,ep,pp)
 ok(s['paths']==2**T and s['probabilityDenominator']==str(den) and s['positivePercent']==pp);near(s['populationMean'],mu);near(s['populationOptimum'],opt);ok(sum(int(r['probabilityNumerator'])for r in rows)==den)
 for k,v in e.items():near(s['expected'][k],v)
 near(s['hedgeExcessBound'],log(2)/(ep/100*T)+ep/800);near(s['ogdExcessBound'],2/(ep/100*T)+ep/800)
 near(e['risk'],e['onlineLoss']);near(e['ogdRisk'],e['ogdOnlineLoss']);ok(e['excess']<=e['regret']/T+1e-12<=s['hedgeExcessBound']+1e-12);ok(e['ogdExcess']<=e['ogdRegret']/T+1e-12<=s['ogdExcessBound']+1e-12)
 if detail:
  ok(len(s['rows'])==2**T)
  for actual,row in zip(s['rows'],rows):
   path_rows+=1;ok(set(actual)==set(row))
   for k,v in row.items():
    if isinstance(v,str):ok(actual[k]==v)
    elif k in ['mask','positiveCount']:ok(type(actual[k])is int and actual[k]==v)
    else:near(actual[k],v)
def verify(s):
 c=s['parameters'];ok(s['schemaVersion']==1);verify_stable(c,s['stability'],True)
 ok(len(s['sampleScan'])==64 and len(s['lambdaScan'])==200)
 for i,r in enumerate(s['sampleScan']):verify_stable({**c,'trainCount':i+1,'trainPositives':0},r,False)
 for i,r in enumerate(s['lambdaScan']):verify_stable({**c,'lambdaPercent':i+1},r,False)
 o=s['online'];expected=direct_online(sequence(c),c['etaPercent']);numerical_tree(o,expected)
 for r in o['rows']:
  ok(-1e-12<=r['mixGap']<=r['hoeffdingAllowance']+1e-12);near(r['logPotentialAfter']-r['logPotentialBefore'],r['logRatio'])
  ok(r['ogdComparatorDifference']<=r['ogdPotentialUpper']+1e-12);ok(r['regret']<=r['bound']+1e-12 and r['ogdRegret']<=r['ogdBound']+1e-12)
 near(o['learnerLoss'],o['mixLoss']+o['mixGap']);near(o['mixLoss'],-o['logPotential']/o['eta']);ok(o['comparatorPotentialSlack']>=-1e-12)
 verify_batch(c,s['onlineBatch'],True);ok(len(s['batchScan'])==10)
 for i,b in enumerate(s['batchScan']):ok(b['rounds']==i+1);verify_batch(c,b,False)
from pathlib import Path
import subprocess,sys,json,hashlib,shutil,copy,re,math,xml.etree.ElementTree as ET
prefix=['rtk','proxy']if shutil.which('rtk')else[]
ROOT=Path(__file__).resolve().parents[1]
js=Path(sys.argv[1]).resolve()if len(sys.argv)>1 else ROOT/'course-shared/labs/online-regret.js'
fixture=Path(sys.argv[2]).resolve()if len(sys.argv)>2 else ROOT/'course-shared/projects/stability-certificates/run-snapshot.json'
f=json.loads(fixture.read_text());assert f['provenance']['sourceSha256']==hashlib.sha256(js.read_bytes()).hexdigest()
code=r"""
const a=require(process.argv[1]),f=require(process.argv[2]);
const extras=[{trainCount:1,trainPositives:0,lambdaPercent:200,positivePercent:1,rounds:1,etaPercent:1,sequence:'tie'},{trainCount:64,trainPositives:0,positivePercent:50,rounds:10},{trainCount:64,trainPositives:64,positivePercent:99,lambdaPercent:1,etaPercent:200,sequence:'adaptive'},{trainCount:63,trainPositives:31,lambdaPercent:1},{trainCount:64,trainPositives:32,lambdaPercent:1},{trainCount:5,trainPositives:2,lambdaPercent:51,positivePercent:37,deltaPercent:25},{trainCount:7,trainPositives:7,lambdaPercent:49,positivePercent:63},{trainCount:4,trainPositives:0,lambdaPercent:25,positivePercent:25},{trainCount:6,trainPositives:3,lambdaPercent:100,positivePercent:75},{trainCount:2,trainPositives:2,positivePercent:100,rounds:2,sequence:'steady'},{trainCount:3,trainPositives:0,positivePercent:0,rounds:3,sequence:'alternating'},{trainCount:10,trainPositives:5,lambdaPercent:10,etaPercent:137,rounds:10,deltaPercent:1}];
const records=[...a.PRESETS.map(p=>a.compute(p.parameters)),...extras.map(p=>a.compute(p))],frozen=f.records.map(r=>a.compute(r.data.parameters));let invalid=0;
const bad=[null,[],1,'x',{x:0},{sequence:null},{sequence:'bad'},{sequence:0},{sequence:[]},{sequence:{}},{trainCount:1,trainPositives:2}];for(const[k,[lo,hi]]of Object.entries(a.LIMITS))for(const v of [null,'1',NaN,Infinity,-Infinity,1.5,lo-1,hi+1])bad.push({[k]:v});
for(const p of bad){let rejected=false;try{a.compute(p)}catch(e){rejected=true}if(!rejected)throw Error('Invalid accepted '+JSON.stringify(p));invalid++;}
let feedback=0;for(let i=0;i<4;i++)for(let j=0;j<2;j++){const r=a.feedback(i,j);if(r.correct!==(j===a.QUESTIONS[i][2])||!r.text)throw Error('Feedback');feedback++;}
process.stdout.write(JSON.stringify({records,frozen,invalid,feedback,self:a.selfTest(),rendered:records.map(r=>({plots:a.plots(r),tables:a.tables(r),svgs:a.plots(r).map(a.svg)}))}));
"""
d=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js),str(fixture)],text=True))
assert len(d['records'])==24 and len(d['frozen'])==6 and d['self']['status']=='PASS'
for s in d['records']+d['frozen']+[r['data']for r in f['records']]:verify(s)
science_checks=checks
INTEGER_KEYS={'schemaVersion','trainCount','lambdaPercent','positivePercent','trainPositives','deltaPercent','rounds','etaPercent','samples','mask','positiveCount','from','to','round','label','comparator','paths','experts'}
def replay(g,v,key=None):
 if isinstance(v,dict):
  assert isinstance(g,dict)and set(g)==set(v)
  for k in v:replay(g[k],v[k],k)
 elif isinstance(v,list):
  assert isinstance(g,list)and len(g)==len(v)
  for x,y in zip(g,v):replay(x,y,key)
 elif isinstance(v,bool)or v is None or isinstance(v,str):assert type(g)is type(v)and g==v
 elif key in INTEGER_KEYS:assert type(g)is int and type(v)is int and g==v
 else:assert isinstance(g,(float,int))and not isinstance(g,bool)and math.isfinite(g)and abs(g-v)<=4e-12*(1+abs(v)),(key,g,v)
for old,new in zip(f['records'],d['frozen']):replay(old['data'],new)
base=f['records'][0]['data'];guards=0
for change in [
 lambda x:x.update(schemaVersion=1.0000000000001),
 lambda x:x['parameters'].update(trainCount=8.0000000000001),
 lambda x:x['stability']['fits'][0].update(positiveCount=.0000000000001),
 lambda x:x['online']['rows'][0].update(round=1.0000000000001),
 lambda x:x['stability']['fits'][0].update(certificateFailure=0),
 lambda x:x['stability']['fits'][0].update(probabilityNumerator=0),
 lambda x:x['onlineBatch']['rows'][0].update(mask=.0000000000001),
 lambda x:x['online'].update(regret=float('nan')),
 lambda x:x['stability']['expected']['gap'].update(numerator=x['stability']['expected']['gap']['numerator']+'0'),
 lambda x:x['online'].update(comparator=1.0000000000001)
]:
 mutant=copy.deepcopy(base);change(mutant)
 try:replay(mutant,base)
 except AssertionError:guards+=1
 else:raise AssertionError('Replay guard')
def expected_points(s):
 st=s['stability'];o=s['online']
 return [
  [[[r['positiveCount'],r['weight']['value']]for r in st['fits']],[[s['parameters']['trainPositives'],st['selected']['weight']['value']]]],
  [[[r['samples'],r['expected']['gap']['value']]for r in s['sampleScan']],[[r['samples'],r['actualUniformBeta']['value']]for r in s['sampleScan']],[[r['samples'],r['cappedBeta']['value']]for r in s['sampleScan']]],
  [[[r['lambdaPercent']/100,r['expected']['excess']['value']]for r in s['lambdaScan']],[[r['lambdaPercent']/100,r['expected']['gap']['value']]for r in s['lambdaScan']],[[r['lambdaPercent']/100,r['actualUniformBeta']['value']]for r in s['lambdaScan']]],
  [[[r['round'],r[k]]for r in o['rows']]for k in ['regret','bound','ogdRegret','ogdBound']],
  [[[r['round'],r[k]]for r in o['rows']]for k in ['preWeight','ogdWeight','label']],
  [[[r['rounds'],r['expected'][k]]for r in s['batchScan']]for k in ['risk','onlineLoss','postUpdateLeakedLoss']]+[[[r['rounds'],r['populationOptimum']]for r in s['batchScan']],[[r['rounds'],min(1,r['populationOptimum']+r['hedgeExcessBound'])]for r in s['batchScan']]]
 ]
def expected_tables(s):
 st=s['stability'];o=s['online'];b=s['onlineBatch']
 return {
 'parameters':[list(x)for x in s['parameters'].items()],
 'fits':[[r[k]for k in ['positiveCount','multiplicity','probabilityNumerator','mean','unconstrained','weight','gradient','trainingRisk','populationRisk','gap','excess','regularizer','objective','certificateFailure','exactCertificateFailure']]for r in st['fits']],
 'neighbors':[[r['from'],r['to'],r['weightDifference'],*r['lossDifferences'],r['uniformSensitivity']]for r in st['neighbors']],
 'selected':[list(x)for x in st['selected'].items()],
 'expectations':[list(x)for x in st['expected'].items()]+[[k,st[k]]for k in ['populationOptimum','populationMean','probabilityDenominator','theoreticalBeta','cappedBeta','actualUniformBeta','gapBound','exactGapBound','certificateFailure','exactCertificateFailure','excessBound']],
 'sample-scan':[[r['samples'],r['cappedBeta'],r['actualUniformBeta'],r['expected']['trainingRisk'],r['expected']['populationRisk'],r['expected']['gap'],r['expected']['absoluteGap'],r['expected']['excess'],r['gapBound'],r['certificateFailure']]for r in s['sampleScan']],
 'lambda-scan':[[r['lambdaPercent'],r['actualUniformBeta'],r['expected']['gap'],r['expected']['excess'],r['excessBound']]for r in s['lambdaScan']],
 'hedge':[[r[k]for k in ['round','label','probabilities','preWeight','losses','learnerLoss','cumulativeLearner','cumulativeExperts','bestFixedLoss','regret','logPotentialBefore','logPotentialAfter','logRatio','mixLoss','mixGap','hoeffdingAllowance','bound']]for r in o['rows']],
 'ogd':[[r[k]for k in ['round','ogdWeight','ogdGradient','ogdUnprojected','ogdNextWeight','ogdLoss','cumulativeOgd','ogdRegret','ogdBound','comparator','ogdDistanceBefore','ogdDistanceAfter','ogdComparatorDifference','ogdPotentialUpper']]for r in o['rows']],
 'protocol':[[r[k]for k in ['round','preWeight','postWeight','learnerLoss','dynamicComparator','bestFixedLoss']]for r in o['rows']],
 'iid-paths':[[r[k]for k in ['mask','positiveCount','probabilityNumerator','averageWeight','onlineLoss','risk','excess','regret','bestFixedLoss','averageOgdWeight','ogdRisk','ogdOnlineLoss','ogdExcess','ogdRegret','postUpdateRisk','postUpdateLeakedLoss']]for r in b['rows']],
 'batch-expectations':[list(x)for x in b['expected'].items()]+[[k,b[k]]for k in ['rounds','paths','probabilityDenominator','populationMean','populationOptimum','hedgeExcessBound','ogdExcessBound']],
 'batch-scan':[[r['rounds'],r['paths'],r['expected']['risk'],r['expected']['onlineLoss'],r['expected']['excess'],r['expected']['regret']/r['rounds'],r['hedgeExcessBound'],r['expected']['ogdRisk'],r['expected']['ogdOnlineLoss'],r['expected']['postUpdateLeakedLoss']]for r in s['batchScan']]
 }
plotcoords=markers=table_rows=0;NS='{http://www.w3.org/2000/svg}'
for record,render in zip(d['records'],d['rendered']):
 assert len(render['plots'])==6 and len(render['tables'])==13 and len(render['svgs'])==6
 for p,source,expected in zip(render['plots'],render['svgs'],expected_points(record)):
  replay([s['points']for s in p['series']],expected)
  assert p['xMin']<p['xMax']and p['yMin']<p['yMax']
  root=ET.fromstring(source);assert root.get('viewBox')=='0 0 900 580'and root.get('role')=='img'and root.get('aria-label')==p['title']
  assert root.find(NS+'title').text==p['title'];ps=[x for x in root.findall(NS+'path')if x.get('data-series')is not None];assert len(ps)==len(p['series'])
  expected_markers=[]
  for i,(series,path)in enumerate(zip(p['series'],ps)):
   assert path.get('data-series')==str(i)and path.get('stroke')==series['color']
   coords=re.findall(r'[ML](-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)',path.get('d',''));points=series['points'];assert len(coords)==len(points)
   assert path.get('d').count('M')==(len(points)if series.get('markersOnly')else 1)
   for xy,(x,y)in zip(coords,points):
    assert math.isfinite(x)and math.isfinite(y)and p['xMin']-1e-12<=x<=p['xMax']+1e-12 and p['yMin']-1e-12<=y<=p['yMax']+1e-12
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
 lambda x:x['stability']['fits'][0]['weight'].update(numerator='0'),
 lambda x:x['stability']['fits'][1].update(multiplicity='1'),
 lambda x:x['stability']['fits'][0].update(probabilityNumerator='1'),
 lambda x:x['stability']['fits'][0].update(certificateFailure=True),
 lambda x:x['stability']['neighbors'][0]['uniformSensitivity'].update(numerator='0'),
 lambda x:x['stability']['actualUniformBeta'].update(numerator='0'),
 lambda x:x['stability']['expected']['gap'].update(numerator='0'),
 lambda x:x['stability'].update(gapBound=0),
 lambda x:x['sampleScan'][0]['expected']['excess'].update(value=0),
 lambda x:x['lambdaScan'][0]['actualUniformBeta'].update(value=0),
 lambda x:x['online']['rows'][0]['probabilities'].__setitem__(0,0),
 lambda x:x['online']['rows'][0].update(mixGap=1),
 lambda x:x['online']['rows'][0].update(ogdNextWeight=-1),
 lambda x:x['online']['rows'][0].update(ogdPotentialUpper=0),
 lambda x:x['onlineBatch']['rows'][0].update(probabilityNumerator='0'),
 lambda x:x['onlineBatch']['rows'][0].update(risk=0),
 lambda x:x['onlineBatch']['expected'].update(postUpdateLeakedLoss=0),
 lambda x:x['batchScan'][0].update(hedgeExcessBound=0)
]:
 mutant=copy.deepcopy(base);change(mutant)
 try:verify(mutant)
 except AssertionError:mutations+=1
 else:raise AssertionError('Undetected scientific mutation')
print(json.dumps({'status':'PASS','records':len(d['records']),'frozen':len(f['records']),'checks':science_checks,'plotCoordinates':plotcoords,'markers':markers,'ledgerRows':table_rows,'invalid':d['invalid'],'feedback':d['feedback'],'mutations':mutations,'self':d['self']['checks'],'replayGuards':guards}))
