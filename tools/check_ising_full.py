"""Independent microscopic sums and uint32 replay, portable standard library."""
import math
from functools import lru_cache
from collections import Counter
checks=0
def eq(a,b):
 global checks
 checks+=1
 assert type(a)is type(b)and a==b,(a,b)
def near(a,b,tol=3e-10):
 global checks
 if isinstance(a,list):
  assert isinstance(b,list);eq(len(a),len(b))
  for x,y in zip(a,b):near(x,y,tol)
 else:
  checks+=1;assert type(a)in(int,float)and type(b)in(int,float)and math.isfinite(a)and math.isfinite(b)and abs(a-b)<=tol*max(1,abs(a),abs(b)),(a,b)
def shape(key):
 if key.startswith('chain'):return int(key[5:]),'chain',None
 if key.startswith('square'):w=int(key[6:]);return w*w,'square',w
 assert key=='cw16';return 16,'cw',None
def bits(mask,n):return [1 if mask&(1<<i)else -1 for i in range(n)]
def micro(mask,c):
 n,kind,w=shape(c['graph']);ss=bits(mask,n);M=sum(ss)
 if kind=='cw':B=M*M;den=2*n
 elif kind=='chain':B=sum(ss[i]*ss[(i+1)%n]for i in range(n));den=1
 else:B=sum(ss[y*w+x]*(ss[y*w+(x+1)%w]+ss[((y+1)%w)*w+x])for y in range(w)for x in range(w));den=1
 return M,-c['coupling']*B/den-c['field']*M,B
@lru_cache(None)
def dos(key):
 n,kind,w=shape(key);c={'graph':key,'coupling':1,'field':0};counts=Counter()
 for mask in range(1<<n):M,E,B=micro(mask,c);counts[B,M]+=1
 return sorted((B,M,g)for(B,M),g in counts.items())
@lru_cache(maxsize=8192)
def finite(key,T,J,h):
 n,kind,w=shape(key);den=2*n if kind=='cw'else 1
 raw=[(B,M,g,-J*B/den-h*M)for B,M,g in dos(key)];shift=max(-E/T for B,M,g,E in raw)
 weights=[g*math.exp(-E/T-shift)for B,M,g,E in raw];z=math.fsum(weights);probs=[v/z for v in weights]
 Ms=[math.fsum(p*M**k for p,(B,M,g,E)in zip(probs,raw))for k in range(5)]
 Es=[math.fsum(p*E**k for p,(B,M,g,E)in zip(probs,raw))for k in range(3)]
 vm=math.fsum(p*(M-Ms[1])**2 for p,(B,M,g,E)in zip(probs,raw));ve=math.fsum(p*(E-Es[1])**2 for p,(B,M,g,E)in zip(probs,raw))
 logZ=shift+math.log(z);am=math.fsum(p*abs(M)for p,(B,M,g,E)in zip(probs,raw))/n
 return {'logZ':logZ,'freeEnergyPerSpin':-T*logZ/n,'mean':Ms[1]/n,'absoluteMean':am,'energyPerSpin':Es[1]/n,'susceptibility':vm/(n*T),'heatCapacity':ve/(n*T*T),'varianceM':vm,'varianceEnergy':ve,'binder':1-Ms[4]/(3*Ms[2]**2),'moments':Ms,'energyMoments':Es,'raw':raw,'probabilities':probs,'shift':shift,'z':z}
def check_summary(record,c):
 x=finite(c['graph'],c['temperature'],c['coupling'],c['field'])
 for k in ['logZ','freeEnergyPerSpin','mean','absoluteMean','energyPerSpin','susceptibility','heatCapacity','varianceM','varianceEnergy','binder']:near(record[k],x[k])
 return x
def check_mf(rows,c):
 n,kind,w=shape(c['graph']);K=c['coupling']*(1 if kind=='cw'else 2 if kind=='chain'else 4);T=c['temperature'];h=c['field']
 # Number of intersections follows from derivative extrema; no product roots used.
 q=math.acosh(math.sqrt(K/T))if K>T else None
 f=lambda y:T*y-K*math.tanh(y)-h
 if q is None:count=1
 else:
  upper=f(-q);lower=f(q)
  count=3 if upper>2e-12 and lower<-2e-12 else 2 if abs(upper)<=2e-12 or abs(lower)<=2e-12 else 1
 eq(len(rows),count)
 assert all(rows[i]['y']<rows[i+1]['y'] for i in range(len(rows)-1))
 for i,r in enumerate(rows):
  eq(r['id'],i);y=r['y'];m=math.tanh(y);near(r['m'],m);near(r['residual'],f(y));near(f(y),0,2e-9)
  s2=1/math.cosh(y)**2;cur=T/s2-K;near(r['sechSquared'],s2);near(r['curvature'],cur)
  entropy=math.fsum(p*math.log(p)for p in[(1+m)/2,(1-m)/2]if p>0)
  F=-K*m*m/2-h*m+T*entropy;near(r['entropy'],entropy);near(r['freeEnergy'],F)
  den=T-K*s2
  typ=('flat minimum'if abs(y)<2e-9 and abs(T-K)<2e-10 else 'stationary inflection')if abs(den)<2e-10 else 'minimum'if den>0 else 'maximum'
  eq(r['classification'],typ)
  if typ=='minimum':near(r['localSusceptibility'],1/cur)
  else:eq(r['localSusceptibility'],None)
 minima=[r['freeEnergy']for r in rows if r['classification']in['minimum','flat minimum']]
 assert minima
 for r in rows:eq(r['global'],r['classification']in['minimum','flat minimum']and abs(r['freeEnergy']-min(minima))<=1e-10)
def check_sample(s,c):
 n,kind,w=shape(c['graph']);state=c['seed']
 def draw():
  nonlocal state
  state=(state^(state<<13))&0xffffffff;state^=state>>17;state=(state^(state<<5))&0xffffffff;return state
 eq(s['laziness'],.5);eq(s['parameters'],c)
 if c['initial']=='up':mask=(1<<n)-1;eq(s['initialDraws'],[])
 elif c['initial']=='alternating':mask=sum(1<<i for i in range(0,n,2));eq(s['initialDraws'],[])
 else:
  mask=0;eq(len(s['initialDraws']),n)
  for i in range(n):
   raw=draw();eq(s['initialDraws'][i],{'site':i,'raw':raw})
   if raw>=2**31:mask|=1<<i
 eq(s['initialMask'],mask);M,E,B=micro(mask,c);eq(s['initialEnergy']['M'],M);near(s['initialEnergy']['energy'],E)
 eq(len(s['attempts']),(c['burn']+c['sweeps'])*n)
 samples=[];accepted=retained=0;runningM=runningA=runningE=0;sweepAccepted=0
 for k,row in enumerate(s['attempts']):
  sweep=k//n+1;step=k%n;rawsite=draw();rawaccept=draw();site=rawsite*n//2**32;u=rawaccept/2**32
  for name,value in [('index',k),('sweep',sweep),('step',step),('retained',sweep>c['burn']),('rawSite',rawsite),('rawAccept',rawaccept),('site',site),('beforeMask',mask),('beforeM',M)]:eq(row[name],value)
  near(row['u'],u);near(row['beforeEnergy'],E)
  spin=1 if mask&(1<<site)else -1;eq(row['spin'],spin);nextMask=mask^(1<<site);nextM,nextE,B=micro(nextMask,c);delta=nextE-E
  near(row['delta'],delta)
  if c['coupling']>0:near(row['neighborSum'],(delta/(2*spin)-c['field'])/c['coupling'])
  else:
   unit={**c,'coupling':1,'field':0};_,e0,_=micro(mask,unit);_,e1,_=micro(nextMask,unit);near(row['neighborSum'],(e1-e0)/(2*spin))
  probability=min(1,math.exp(-delta/c['temperature']));near(row['metropolisProbability'],probability);near(row['probability'],probability/2);take=u<probability/2;eq(row['accepted'],take)
  if take:mask=nextMask;M=nextM;E=nextE;accepted+=1;sweepAccepted+=1;retained+=sweep>c['burn']
  eq(row['afterMask'],mask);eq(row['afterM'],M);near(row['afterEnergy'],E)
  if step==n-1:
   if sweep>c['burn']:
    runningM+=M;runningA+=abs(M);runningE+=E;j=len(samples);r=s['samples'][j]
    for name,value in [('index',j),('sweep',sweep),('mask',mask),('M',M),('accepted',sweepAccepted)]:eq(r[name],value)
    for name,value in [('energy',E),('mean',M/n),('absoluteMean',abs(M)/n),('runningMean',runningM/(j+1)/n),('runningAbsoluteMean',runningA/(j+1)/n),('runningEnergy',runningE/(j+1)/n)]:near(r[name],value)
    samples.append((M,E))
   sweepAccepted=0
 eq(len(samples),c['sweeps']);eq(s['accepted'],accepted);eq(s['retainedAccepted'],retained);eq(s['finalMask'],mask);eq(s['finalRng'],state)
 near(s['acceptanceRate'],accepted/len(s['attempts']));near(s['retainedAcceptanceRate'],retained/(len(samples)*n))
 mean=math.fsum(x[0]for x in samples)/len(samples);energy=math.fsum(x[1]for x in samples)/len(samples)
 vm=math.fsum((x[0]-mean)**2 for x in samples)/len(samples);ve=math.fsum((x[1]-energy)**2 for x in samples)/len(samples)
 for name,value in [('mean',mean/n),('absoluteMean',math.fsum(abs(x[0])for x in samples)/len(samples)/n),('energyPerSpin',energy/n),('varianceM',vm),('varianceEnergy',ve),('susceptibilityEstimate',vm/(n*c['temperature'])),('heatCapacityEstimate',ve/(n*c['temperature']**2))]:near(s[name],value)
 eq(len(s['histogram']),n+1)
 for i,r in enumerate(s['histogram']):
  M=-n+2*i;count=sum(x[0]==M for x in samples);eq(r['M'],M);eq(r['count'],count);near(r['frequency'],count/len(samples))
 eq(len(s['autocorrelation']),min(16,len(samples)-1)+1)
 for lag,r in enumerate(s['autocorrelation']):
  pairs=len(samples)-lag;cov=math.fsum((samples[i][0]-mean)*(samples[i+lag][0]-mean)for i in range(pairs))/pairs
  eq(r['lag'],lag);eq(r['pairs'],pairs);near(r['covariance'],cov)
  if vm:near(r['correlation'],cov/vm)
  else:eq(r['correlation'],None)
def matmul(a,b):return [[math.fsum(x*y for x,y in zip(row,col))for col in zip(*b)]for row in a]
def check_snapshot(s):
 c=s['parameters'];n,kind,w=shape(c['graph']);e=s['exact'];tr=s['transfer'];x=check_summary(e,c)
 eq(s['schemaVersion'],1);eq(e['parameters'],c);eq(e['states'],1<<n);eq(e['denominator'],2*n if kind=='cw'else 1)
 eq(e['graph']['size'],n)
 expected=[]
 if kind=='chain':expected=[(i,(i+1)%n,1)for i in range(n)]
 elif kind=='square':
  for y in range(w):
   for xx in range(w):expected.extend([(y*w+xx,y*w+(xx+1)%w,1),(y*w+xx,((y+1)%w)*w+xx,1)])
 else:expected=[(i,j,1/n)for i in range(n)for j in range(i+1,n)]
 eq(len(e['graph']['edges']),len(expected))
 for i,(row,(a,b,weight))in enumerate(zip(e['graph']['edges'],expected)):eq(row['id'],i);eq(row['a'],a);eq(row['b'],b);near(row['weight'],weight)
 near(e['graph']['selfConstant'],-.5 if kind=='cw'else 0)
 for i,neighbors in enumerate(e['graph']['neighbors']):
  want=[(b if a==i else a,weight,j)for j,(a,b,weight)in enumerate(expected)if i in(a,b)]
  eq(len(neighbors),len(want))
  for row,(site,weight,edge)in zip(neighbors,want):eq(row['site'],site);near(row['weight'],weight);eq(row['edge'],edge)
 eq(len(e['rows']),len(x['raw']));seen=set()
 for row in e['rows']:
  pair=(row['bondNumerator'],row['magnetization']);assert pair not in seen;seen.add(pair)
  j=next(i for i,r in enumerate(x['raw'])if r[:2]==pair);B,M,g,E=x['raw'][j]
  eq(row['multiplicity'],g);eq(type(row['representativeMask']).__name__,'int')
  rm,re,rb=micro(row['representativeMask'],c);eq((rb,rm),(B,M));near(row['energy'],E);near(row['exponent'],-E/c['temperature']);near(row['shiftedWeight'],g*math.exp(-E/c['temperature']-x['shift']));near(row['probability'],x['probabilities'][j])
 near(e['maxExponent'],x['shift']);near(e['Zscaled'],x['z']);near(e['magnetizationMoments'],x['moments']);near(e['rawMagnetizationMoments'],x['moments']);near(e['energyMoments'],x['energyMoments'])
 eq(len(e['magnetizationBins']),n+1)
 for i,row in enumerate(e['magnetizationBins']):
  M=-n+2*i;eq(row['M'],M);near(row['probability'],math.fsum(p for p,r in zip(x['probabilities'],x['raw'])if r[1]==M))
 if kind=='cw':eq(tr['applicable'],False)
 else:
  width=1 if kind=='chain'else w;length=n//width;states=[bits(mask,width)for mask in range(1<<width)];d=len(states)
  B=[0 if width==1 else sum(a[i]*a[(i+1)%width]for i in range(width))for a in states];M=[sum(a)for a in states]
  A=[[math.exp((c['coupling']*(sum(u*v for u,v in zip(a,b))+(B[i]+B[j])/2)+c['field']*(M[i]+M[j])/2)/c['temperature'])for j,b in enumerate(states)]for i,a in enumerate(states)]
  near(tr['matrix'],A);eq(tr['width'],width);eq(tr['length'],length);eq(len(tr['powers']),length+1)
  power=[[int(i==j)for j in range(d)]for i in range(d)]
  for j in range(length+1):
   near(tr['powers'][j],power)
   if j<length:power=matmul(power,A)
  z=math.fsum(power[i][i]for i in range(d));near(tr['partition'],z);near(tr['logZ'],math.log(z));near(tr['logZ'],e['logZ'])
  if kind=='chain':
   ch=tr['chain'];K=c['coupling']/c['temperature'];h=c['field']/c['temperature'];root=math.sqrt(math.sinh(h)**2+math.exp(-4*K))
   plus=math.exp(K)*(math.cosh(h)+root);minus=(math.exp(2*K)-math.exp(-2*K))/plus
   near(ch['lambdaPlus'],plus);near(ch['lambdaMinus'],minus);near(ch['eigenPartition'],z);near(ch['infiniteMagnetization'],math.sinh(h)/root);near(ch['infiniteLogZPerSpin'],math.log(plus))
   eq(len(ch['correlations']),n+1)
   # Direct weighted microscopic spin products, independent of transfer insertions.
   shift=x['shift'];weights=[]
   for mask in range(1<<n):mm,E,B=micro(mask,c);weights.append(math.exp(-E/c['temperature']-shift))
   total=math.fsum(weights)
   for rr in ch['correlations']:
    distance=rr['distance'];value=math.fsum(weight*bits(mask,n)[0]*bits(mask,n)[distance%n]for mask,weight in enumerate(weights))/total;near(rr['finite'],value)
    if c['field']==0:near(rr['zeroFieldFormula'],value)
    else:eq(rr['zeroFieldFormula'],None)
   if c['field']==0:near(ch['zeroFieldCorrelationLength'],0 if K==0 else -1/math.log(math.tanh(K)))
   else:eq(ch['zeroFieldCorrelationLength'],None)
  else:eq(tr['chain'],None)
 mf=s['meanField'];K=c['coupling']*(1 if kind=='cw'else 2 if kind=='chain'else 4);near(mf['K'],K);near(mf['temperature'],c['temperature']);near(mf['field'],c['field'])
 eq(len(mf['landscape']),201)
 for i,row in enumerate(mf['landscape']):
  m=-1+i/100;near(row['m'],m);ent=math.fsum(p*math.log(p)for p in[(1+m)/2,(1-m)/2]if p>0);near(row['freeEnergy'],-K*m*m/2-c['field']*m+c['temperature']*ent)
 sq=s['squareInfinite'];applicable=kind=='square'and c['field']==0;eq(sq['applicable'],applicable);Tc=2*c['coupling']/math.log(1+math.sqrt(2));near(sq['Tc'],Tc)
 if applicable:near(sq['spontaneousMagnetization'],(1-math.sinh(2*c['coupling']/c['temperature'])**-4)**.125 if c['coupling']>0 and c['temperature']<Tc else 0)
 else:eq(sq['spontaneousMagnetization'],None)
 check_sample(s['sample'],c);check_mf(s['meanField']['rows'],c)
 selected=[r['id']for r in s['meanField']['rows']if r['global']][-1];eq(s['meanField']['selectedRoot'],selected)
 for row in s['temperatureScan']:
  cc={**c,'temperature':row['temperature']};check_summary(row,cc);check_mf(row['meanFieldRoots'],cc)
  chosen=[r for r in row['meanFieldRoots']if r['global']][-1];near(row['meanFieldMagnetization'],chosen['m'])
  if chosen['localSusceptibility']is None:eq(row['meanFieldSusceptibility'],None)
  else:near(row['meanFieldSusceptibility'],chosen['localSusceptibility'])
  Tc=2*c['coupling']/math.log(1+math.sqrt(2))
  if kind=='square'and c['field']==0:
   m=(1-math.sinh(2*c['coupling']/cc['temperature'])**-4)**.125 if c['coupling']>0 and cc['temperature']<Tc else 0;near(row['squareSpontaneousMagnetization'],m)
  else:eq(row['squareSpontaneousMagnetization'],None)
 for row in s['fieldScan']:check_summary(row,{**c,'field':row['field']})
 for row in s['sizeScan']:check_summary(row,{**c,'graph':row['graph']});eq(row['size'],shape(row['graph'])[0]);eq(row['states'],1<<row['size'])
 for i,row in enumerate(s['detailedBalance']['rows']):
  eq(row['id'],i);mask=row['mask'];site=row['site'];eq(row['nextMask'],mask^(1<<site));M,E,B=micro(mask,c);MM,EE,BB=micro(mask^(1<<site),c);delta=EE-E
  near(row['energy'],E);near(row['nextEnergy'],EE);near(row['delta'],delta)
  logPi=-E/c['temperature']-e['logZ'];logNext=-EE/c['temperature']-e['logZ'];lf=-math.log(2*n)-max(0,delta/c['temperature']);lr=-math.log(2*n)-max(0,-delta/c['temperature'])
  for k,v in [('logPi',logPi),('logPiNext',logNext),('logForward',lf),('logReverse',lr),('logForwardFlux',logPi+lf),('logReverseFlux',logNext+lr),('forwardFlux',math.exp(logPi+lf)),('reverseFlux',math.exp(logNext+lr))]:near(row[k],v)
  near(row['logForwardFlux'],row['logReverseFlux'])
def check_records(records):
 global checks
 before=checks
 for r in records:check_snapshot(r)
 return checks-before

if __name__=='__main__':
 import subprocess,shutil,tempfile,hashlib,re,copy,json,sys,xml.etree.ElementTree as ET
 from pathlib import Path
 root=Path(__file__).resolve().parents[1];staging=len(sys.argv)>1
 js=Path(sys.argv[1])if staging else root/'course-shared/labs/ising-mean-field.js'
 fixture=Path(sys.argv[2])if staging else root/'course-shared/projects/ising-certificates/run-snapshot.json'
 prefix=['rtk','proxy']if shutil.which('rtk')else[]
 code=r'''const a=require(process.argv[1]),f=require(process.argv[2]);let invalid=[];for(const k of Object.keys(a.DEFAULT))for(const v of[null,false,'1',[],{},Infinity,NaN])invalid.push({[k]:v});invalid.push(null,[],{constructor:1},{toString:1},{unknown:1},{temperature:0},{temperature:5.1},{coupling:-.1},{coupling:2.1},{field:-.6},{field:.6},{seed:0},{seed:4294967296},{seed:1.5},{sweeps:15},{sweeps:513},{sweeps:16.5},{burn:-1},{burn:129},{burn:.5},{graph:'square5'},{initial:'down'});let rejected=0;for(const c of invalid){try{a.config(c)}catch(e){rejected++;}}const configs=a.PRESETS.map(p=>p.parameters);for(const graph of Object.keys(a.GRAPHS)){configs.push({graph,coupling:0,field:0,sweeps:16,burn:0,initial:'alternating'});configs.push({graph,coupling:2,temperature:.3,field:-.5,seed:1,sweeps:16,burn:0,initial:'random'});}const q=Math.acosh(Math.sqrt(2)),h=.5*q-Math.tanh(q);configs.push({graph:'cw16',temperature:.5,field:h,sweeps:16},{graph:'cw16',temperature:.5,field:-h,sweeps:16});const records=configs.map(a.compute),views=a.PRESETS.map((p,i)=>({key:p.id,plots:a.plots(records[i]),svgs:a.plots(records[i]).map(a.svg),tables:a.tables(records[i])}));console.log(JSON.stringify({records,views,frozen:f.records.map(r=>a.compute(r.data.parameters)),invalid:invalid.length,rejected,feedback:a.QUESTIONS.map((q,i)=>[a.feedback(i,0),a.feedback(i,1)]),self:a.selfTest()}));'''
 d=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True));f=json.loads(fixture.read_text())
 assert fixture.stat().st_size<25*1024*1024
 eq(f['provenance']['sourceSha256'],hashlib.sha256(js.read_bytes()).hexdigest());eq(len(f['records']),6);eq(len({r['key']for r in f['records']}),6);eq(d['invalid'],d['rejected']);assert d['invalid']>=75
 integers={'id','index','mask','beforeMask','afterMask','nextMask','finalMask','initialMask','representativeMask','site','raw','rawSite','rawAccept','finalRng','sweep','step','M','beforeM','afterM','magnetization','bondNumerator','multiplicity','states','size','width','height','length','distance','lag','pairs','count','denominator','schemaVersion','edge','a','b','selectedRoot','accepted','retainedAccepted'}
 def replay(a,b,path='$'):
  if isinstance(a,dict):
   assert isinstance(b,dict)and a.keys()==b.keys(),path
   for k in a:replay(a[k],b[k],path+'.'+k)
  elif isinstance(a,list):
   assert isinstance(b,list)and len(a)==len(b),path
   for i,(x,y)in enumerate(zip(a,b)):replay(x,y,path+'['+str(i)+']')
  elif type(a)in(int,float)and type(b)in(int,float):
   key=path.rsplit('.',1)[-1]
   if key in integers:assert type(a)is int and type(b)is int and a==b,(path,a,b)
   elif '.parameters.'in path:assert type(a)is type(b)and a==b,(path,a,b)
   else:assert math.isfinite(a)and math.isfinite(b)and math.isclose(a,b,rel_tol=2e-12,abs_tol=2e-14),(path,a,b)
  else:assert type(a)is type(b)and a==b,(path,a,b)
 replay(d['frozen'],[r['data']for r in f['records']])
 replay({'x':1.0},{'x':math.nextafter(1.,2.)})
 cases=[(1,1.0),(1,1.0000000000001),(1.0,1),(1.0000000000001,1),(1.,1.00001),(True,1),(None,0),([1],[]),({'x':1},{'y':1}),(2,3)]
 caught=0
 for a,b in cases:
  try:replay({'id':a},{'id':b})if type(a)in(int,float)and type(b)in(int,float)and(type(a)is int or type(b)is int)else replay(a,b)
  except AssertionError:caught+=1
 eq(caught,len(cases));guards=caught
 total=check_records(d['records']+d['frozen']+[r['data']for r in f['records']])
 coordinates=markers=ledgerRows=graphEdges=0
 for i,view in enumerate(d['views']):
  s=d['records'][i];c=s['parameters'];e=s['exact'];mc=s['sample'];tr=s['transfer'];mf=s['meanField'];n=e['graph']['size']
  eq([p['key']for p in view['plots']],['configuration','histogram','heat','trajectory','correlation','magnetization'])
  ts={t['key']:t['rows']for t in view['tables']}
  eq(list(ts),['parameters','bonds','dos','transfer','thermodynamics','temperature','attempts','samples','mean-field','balance'])
  eq(ts['parameters'][:8],[[k,v,'当前实验参数']for k,v in c.items()])
  eq(ts['bonds'],[[r[k]for k in['id','a','b','weight','axis','wrap']]for r in e['graph']['edges']])
  eq(ts['dos'],[[r[k]for k in['bondNumerator','magnetization','multiplicity','representativeMask','energy','exponent','shiftedWeight','probability']]for r in e['rows']])
  expectedTransfer=[[k,i,j,value,tr['partition']if k==tr['length']else None,tr['logZ']if k==tr['length']else None]for k,A in enumerate(tr['powers'])for i,row in enumerate(A)for j,value in enumerate(row)]if tr['applicable']else[['不适用',None,None,'CW改用精确二项式DOS',None,None]]
  eq(ts['transfer'],expectedTransfer)
  fields=['mean','absoluteMean','energyPerSpin','susceptibility','heatCapacity','binder','logZ','freeEnergyPerSpin']
  eq(ts['thermodynamics'],[['所选',c['graph']]+[e[k]for k in fields]]+[['外场',r['field']]+[r[k]for k in fields]for r in s['fieldScan']]+[['尺寸',r['graph']]+[r[k]for k in fields]for r in s['sizeScan']])
  eq(ts['temperature'],[[r[k]for k in['temperature','mean','absoluteMean','energyPerSpin','susceptibility','heatCapacity','binder','logZ','meanFieldMagnetization','meanFieldSusceptibility','squareSpontaneousMagnetization']]for r in s['temperatureScan']])
  eq(ts['attempts'],[[r[k]for k in['index','sweep','step','retained','rawSite','rawAccept','site','u','spin','neighborSum','delta','metropolisProbability','probability','accepted','beforeMask','afterMask','beforeM','afterM','beforeEnergy','afterEnergy']]for r in mc['attempts']])
  eq(ts['samples'],[['样本']+[r[k]for k in['index','sweep','mask','M','energy','mean','runningMean','runningAbsoluteMean','runningEnergy']]+[None,None]for r in mc['samples']]+[['相关',r['lag'],r['pairs'],None,None,None,None,None,None,None,r['covariance'],r['correlation']]for r in mc['autocorrelation']])
  eq(ts['mean-field'],[[r['temperature']]+[q[k]for k in['id','y','m','residual','freeEnergy','curvature','classification','global','localSusceptibility']]for r in s['temperatureScan']for q in r['meanFieldRoots']])
  eq(ts['balance'],[[r[k]for k in['id','mask','nextMask','site','energy','nextEnergy','delta','logPi','logPiNext','logForward','logReverse','logForwardFlux','logReverseFlux','forwardFlux','reverseFlux']]for r in s['detailedBalance']['rows']])
  for t in view['tables']:ledgerRows+=len(t['rows']);assert all(len(row)==len(t['headers'])for row in t['rows'])
  correlations=tr['chain']['correlations']if tr.get('chain')else []
  curves=[
   [[[r['M'],r['probability']]for r in e['magnetizationBins']],[[r['M'],r['frequency']]for r in mc['histogram']]],
   [[[r['temperature'],r['heatCapacity']]for r in s['temperatureScan']]],
   [[[r['index']+1,r['mean']]for r in mc['samples']],[[r['index']+1,r['runningMean']]for r in mc['samples']],[[1,e['mean']],[c['sweeps'],e['mean']]]],
   [[[r['distance'],r['finite']]for r in correlations],[[r['distance'],math.tanh(c['coupling']/c['temperature'])**r['distance']]for r in correlations]if c['field']==0 else []],
   [[[r['temperature'],r['absoluteMean']if c['field']==0 else r['mean']]for r in s['temperatureScan']],[[r['temperature'],r['meanFieldMagnetization']]if r['meanFieldMagnetization']is not None else None for r in s['temperatureScan']],[[r['temperature'],r['squareSpontaneousMagnetization']]if r['squareSpontaneousMagnetization']is not None else None for r in s['temperatureScan']]]
  ]
  for p,markup,expected in zip(view['plots'][1:],view['svgs'][1:],curves):
   tree=ET.fromstring(markup);paths=[x for x in tree.iter()if 'data-series'in x.attrib];eq(len(paths),len(expected));eq(len(p['series']),len(expected))
   assert p['xMin']<p['xMax']and p['yMin']<p['yMax']
   allmarkers=[]
   for series,path,points in zip(p['series'],paths,expected):
    eq(len(series['points']),len(points));values=[];commands=[];pen=False;valid=[]
    for actual,pt in zip(series['points'],points):
     if pt is None:eq(actual,None);pen=False;continue
     near(actual,pt);coordinates+=2;valid.append(pt);assert p['xMin']-1e-10<=pt[0]<=p['xMax']+1e-10 and p['yMin']-1e-10<=pt[1]<=p['yMax']+1e-10
     values.extend([100+(pt[0]-p['xMin'])/(p['xMax']-p['xMin'])*755,385-(pt[1]-p['yMin'])/(p['yMax']-p['yMin'])*290]);commands.append('L'if pen and not series.get('markersOnly')else'M');pen=True
    eq(re.findall('[ML]',path.attrib['d']),commands)
    actual=list(map(float,re.findall(r'[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?',path.attrib['d'])));near(actual,values,2e-5)
    allmarkers.extend(valid if series.get('markersOnly')else valid if len(valid)==1 else[])
   circles=[x for x in tree.iter()if x.tag.endswith('circle')];eq(len(circles),len(allmarkers));markers+=len(circles)
   for circle,pt in zip(circles,allmarkers):near(float(circle.attrib['cx']),100+(pt[0]-p['xMin'])/(p['xMax']-p['xMin'])*755,2e-5);near(float(circle.attrib['cy']),385-(pt[1]-p['yMin'])/(p['yMax']-p['yMin'])*290,2e-5)
  p=view['plots'][0];tree=ET.fromstring(view['svgs'][0]);eq(p['mask'],mc['finalMask']);eq(p['spins'],bits(mc['finalMask'],n))
  edges=[x for x in tree.iter()if 'data-edge'in x.attrib];nodes=[x for x in tree.iter()if 'data-site'in x.attrib];eq(len(edges),len(e['graph']['edges']));eq(len(nodes),n);graphEdges+=len(edges)
  xy={int(x.attrib['data-site']):(float(x.attrib['cx']),float(x.attrib['cy']))for x in nodes};pairs={}
  for path,edge in zip(edges,e['graph']['edges']):
   eq(int(path.attrib['data-edge']),edge['id']);vals=list(map(float,re.findall(r'[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?',path.attrib['d'])));eq(len(vals),6)
   near(vals[:2],list(xy[edge['a']]));near(vals[-2:],list(xy[edge['b']]))
   key=tuple(sorted([edge['a'],edge['b']]));pairs.setdefault(key,[]).append(vals[2:4])
  for controls in pairs.values():
   if len(controls)>1:assert math.dist(controls[0],controls[1])>1
  for node in nodes:
   j=int(node.attrib['data-site']);eq(node.attrib['fill'],'#c55b32'if p['spins'][j]>0 else'#3875ba')
 for i,pair in enumerate(d['feedback']):
  eq([x['correct']for x in pair],[i in[1,3],i in[0,2]])
  for x in pair:assert x['text'].startswith('正确。'if x['correct']else'需要修正。')and len(x['text'])>20
 mutations=[('exact','rows',0,'multiplicity'),('exact','rows',0,'energy'),('exact','logZ'),('exact','susceptibility'),('exact','graph','edges',0,'weight'),('transfer','matrix',0,0),('sample','attempts',0,'rawSite'),('sample','attempts',0,'delta'),('sample','samples',0,'mask'),('sample','mean'),('sample','autocorrelation',0,'covariance'),('meanField','rows',0,'curvature'),('meanField','landscape',0,'freeEnergy'),('temperatureScan',0,'heatCapacity'),('fieldScan',0,'mean'),('sizeScan',0,'logZ'),('detailedBalance','rows',0,'logForwardFlux'),('squareInfinite','spontaneousMagnetization')]
 caught=0
 for path in mutations:
  record=copy.deepcopy(d['records'][0]);target=record
  for k in path[:-1]:target=target[k]
  target[path[-1]]+=1
  try:check_records([record])
  except AssertionError:caught+=1
 eq(caught,len(mutations));eq(d['self']['status'],'PASS')
 if not staging:
  for course in['ai-course','grad-math','math-course','physics-course']:eq((root/course/'site/assets/learning/labs/ising-mean-field.js').read_bytes(),js.read_bytes())
  eq((root/'physics-course/site/assets/learning/projects/ising-certificates/run-snapshot.json').read_bytes(),fixture.read_bytes())
  for name in['physics-course/lectures/asm-02-ising.md','physics-course/site/asm-02-ising.html']:assert 'is185-course'in(root/name).read_text()
  with tempfile.TemporaryDirectory()as tmp:
   target=Path(tmp);subprocess.run(prefix+['python3',str(root/'tools/build_ising_figure.py'),str(js),str(fixture),str(target/'figure.svg'),str(target/'fallback.md')],check=True,stdout=subprocess.PIPE)
   eq((target/'figure.svg').read_bytes(),(root/'physics-course/images/asm-02-ising-ledgers.svg').read_bytes());eq((target/'figure.svg').read_bytes(),(root/'physics-course/site/assets/img/asm-02-ising-ledgers.svg').read_bytes());assert(target/'fallback.md').read_text()in(root/'physics-course/lectures/asm-02-ising.md').read_text()
 print(json.dumps({'status':'PASS','records':len(d['records']),'frozen':6,'checks':total,'plotCoordinates':coordinates,'markers':markers,'graphEdges':graphEdges,'ledgerRows':ledgerRows,'invalid':d['invalid'],'feedback':8,'mutations':caught,'self':d['self']['checks'],'replayGuards':guards}))
