# -*- coding: utf-8 -*-
"""Independent stdlib oracle: full Gaussian covariance contractions and exact binomial coefficients."""
import math,json,sys
CHECKS=0
LIMITS={'temperatureTenths':(1,40),'frictionTenths':(1,40),'stiffnessTenths':(1,40),'massTenths':(1,40),'distanceTenths':(-40,40),'durationTenths':(1,100),'protocolSteps':(1,40),'initialOffsetTenths':(-20,20),'coinPercent':(5,95),'coinSteps':(1,40),'samples':(16,256),'seed':(1,99)}
INTEGER_KEYS=set(LIMITS)|{'index','state','step','N','n','sites','start','end','current','negativeCount','directions','states'}
def close(a,b,label='root',tol=5e-10):
 global CHECKS
 CHECKS+=1
 if isinstance(b,dict):
  assert isinstance(a,dict)and set(a)==set(b),(label,'keys',set(a)^set(b))
  for k in b:close(a[k],b[k],label+'/'+k,tol)
 elif isinstance(b,(list,tuple)):
  assert isinstance(a,(list,tuple))and len(a)==len(b),(label,'length')
  for i,(x,y)in enumerate(zip(a,b)):close(x,y,label+'/'+str(i),tol)
 elif b is None or isinstance(b,(bool,str)):assert type(a)is type(b)and a==b,(label,a,b)
 else:assert isinstance(a,(int,float))and not isinstance(a,bool)and math.isfinite(a)and abs(a-b)<=tol*(1+abs(b)),(label,a,b)
def relative(a,b,label):
 global CHECKS
 CHECKS+=1
 assert math.isfinite(a)and abs(a-b)<=max(1e-300,5e-10*abs(b)),(label,a,b)
def logg(x,mu,v):return -.5*math.log(2*math.pi*v)-.5*(x-mu)**2/v
def logmean(xs):
 mx=max(xs);return mx+math.log(math.fsum(math.exp(x-mx)for x in xs)/len(xs))
class Random:
 def __init__(self,seed):self.state=seed;self.records=[]
 def next(self):
  self.state=(1664525*self.state+1013904223)%2**32;u=(self.state+.5)/2**32
  self.records.append(dict(index=len(self.records),state=self.state,u=u));return u
 def normal(self):
  a,b=self.next(),self.next();return math.sqrt(-2*math.log(a))*math.cos(2*math.pi*b)
def ou(c):
 T,g,m=c['temperatureTenths']/10,c['frictionTenths']/10,c['massTenths']/10;tau=m/g;D=T/g;times=[]
 for i in range(201):
  z=i/20;t=z*tau;decay=math.exp(-z)
  # Sum the integrated exponential series at small z.
  bracket=math.fsum((-1)**j*z**j/math.factorial(j)for j in range(2,25))if z<.5 else z+math.expm1(-z)
  times.append(dict(time=t,correlation=T/m*decay,response=decay/m,temperatureTimesResponse=T/m*decay,stepMobility=-math.expm1(-z)/g,velocityVarianceFromZero=T/m*(-math.expm1(-2*z)),stationaryVelocityVariance=T/m,msd=2*D*tau*bracket,ballistic=T/m*t*t,diffusive=2*D*t))
 spectrum=[]
 for i in range(161):
  w=(i/16)/tau;mob=1/complex(g,-m*w);psd=2*T*mob.real
  spectrum.append(dict(omega=w,scaledFrequency=i/16,velocityPSD=psd,mobilityReal=mob.real,mobilityImag=mob.imag,temperatureTwiceRealMobility=psd))
 return dict(T=T,gamma=g,m=m,tau=tau,forceNoiseIntensity=g*T,spatialDiffusion=D,stationaryVelocityVariance=T/m,PSDConvention='two-sided Fourier transform int C(t) exp(i omega t) dt',responseConvention='force impulse to velocity; causal; exp(-gamma t/m)/m',times=times,spectrum=spectrum)
def protocol(c):
 T,k,g=c['temperatureTenths']/10,c['stiffnessTenths']/10,c['frictionTenths']/10;L,d,N,a0=c['distanceTenths']/10,c['durationTenths']/10,c['protocolSteps'],c['initialOffsetTenths']/10
 h=d/N;delta=L/N;alpha=math.exp(-k*h/g);v=T/k;noise=v*(-math.expm1(-2*k*h/g));beta=1/T
 means=[a0*alpha**j+delta*(j-math.fsum(alpha**i for i in range(1,j+1)))for j in range(N+1)]
 covariance=[[v*alpha**abs(i-j)for j in range(N+1)]for i in range(N+1)]
 coefficient=-k*delta;moments=[]
 for j in range(N+1):
  mw=k*delta*delta*j*j/2+coefficient*math.fsum(means[:j])
  vw=coefficient*coefficient*math.fsum(covariance[i][l]for i in range(j)for l in range(j))
  cx=coefficient*math.fsum(covariance[j][:j]);ci=coefficient*math.fsum(covariance[0][:j])
  moments.append(dict(step=j,lambda_=j*delta,meanX=means[j],varianceX=v,meanW=mw,varW=vw,covXW=cx,covWInitial=ci))
  moments[-1]['lambda']=moments[-1].pop('lambda_')
 last=moments[-1];mw,vw,cx,ci=last['meanW'],last['varW'],last['covXW'],last['covWInitial'];ikl=a0*a0/(2*v);fkl=(means[-1]-L)**2/(2*v)
 chi=[coefficient/T]*N+[0.];chi[0]+=a0/v;total=chi.copy();total[-1]-=(means[-1]-L)/v
 def quadratic(a):return math.fsum(a[i]*covariance[i][j]*a[j]for i in range(N+1)for j in range(N+1))
 mchi=mw/T+ikl;vchi=quadratic(chi);mt=mchi-fkl;vt=quadratic(total)
 eqmw=mw+k*delta*a0*math.fsum(alpha**j for j in range(N));eqvar=2*T*eqmw
 lj=-mw/T+vw/(2*T*T);lc=-mchi+vchi/2;lt=-mt+vt/2
 continuous=g*(L/d)**2*(d-g/k*(-math.expm1(-k*d/g)))
 return dict(T=T,k=k,gamma=g,L=L,duration=d,N=N,offset=a0,h=h,delta=delta,alpha=alpha,variance=v,noiseVariance=noise,beta=beta,deltaFreeEnergy=0,moments=moments,finalMean=means[-1],meanWork=mw,varianceWork=vw,covFinalWork=cx,covInitialWork=ci,initialKL=ikl,finalKL=fkl,meanCorrectedEntropy=mchi,varianceCorrectedEntropy=vchi,meanTotalEntropy=mt,varianceTotalEntropy=vt,logJarzynski=lj,jarzynski=math.exp(lj),logCorrectedIFT=lc,correctedIFT=math.exp(lc),logTotalIFT=lt,totalIFT=math.exp(lt),equilibriumMeanWork=eqmw,equilibriumVarianceWork=eqvar,continuumMeanWork=continuous,initialEquilibrium=a0==0,protocolConvention='forward jump then OU relaxation; reverse OU relaxation then jump',heatConvention='Qbath positive into environment; DeltaU=W-Qbath')
def ring(c):
 p=c['coinPercent']/100;q=1-p;n=c['coinSteps'];A=math.log(p/q);rows=[]
 for k in range(n+1):
  J=2*k-n;ss=J*A;choose=math.log(math.comb(n,k));lp=choose+k*math.log(p)+(n-k)*math.log(q);lr=choose+(n-k)*math.log(p)+k*math.log(q)
  rows.append(dict(k=k,current=J,sigma=ss,logProbability=lp,probability=math.exp(lp),logReverseProbability=lr,reverseProbability=math.exp(lr),logRatio=lp-lr,weightedProbability=math.exp(lp-ss)))
 mean=n*(2*p-1)*A;variance=4*n*p*q*A*A;negative=math.fsum(x['probability']for x in rows if x['sigma']<0);ift=math.fsum(x['weightedProbability']for x in rows)
 second=n*math.log(p*math.exp(-2*A)+q*math.exp(2*A));varExp=math.expm1(second);needed=None if negative==0 else math.log(.05)/math.log1p(-negative)
 random=Random(c['seed']);paths=[];prefix=[];sigmas=[];weights=[]
 for j in range(c['samples']):
  start=math.floor(5*random.next());site=start;states=[site];directions=[];uniforms=[]
  for i in range(n):
   u=random.next();d=1 if u<p else -1;uniforms.append(u);directions.append(d);site=(site+d)%5;states.append(site)
  k=directions.count(1);J=2*k-n;ss=J*A;lf=-math.log(5)+k*math.log(p)+(n-k)*math.log(q);lr=-math.log(5)+(n-k)*math.log(p)+k*math.log(q)
  paths.append(dict(index=j,start=start,end=site,k=k,current=J,sigma=ss,states=states,directions=directions,uniforms=uniforms,logForward=lf,logReverse=lr,logRatio=lf-lr,systemEntropyChange=0,mediumEntropy=ss))
  sigmas.append(ss);weights.append(-ss);le=logmean(weights)
  prefix.append(dict(samples=j+1,meanSigma=math.fsum(sigmas)/(j+1),negativeCount=sum(x<0 for x in sigmas),logExponentialMean=le,exponentialMean=math.exp(le)))
 matrix=[[p if j==(i+1)%5 else q if j==(i+4)%5 else 0 for j in range(5)]for i in range(5)]
 return dict(p=p,q=q,n=n,affinity=A,sites=5,initialProbability=[.2]*5,transition=matrix,rows=rows,mean=mean,variance=variance,probabilitySum=math.fsum(x['probability']for x in rows),negativeProbability=negative,ift=ift,logSecondMoment=second,exponentialVariance=varExp,exactSampleMeanVariance=varExp/c['samples'],estimatedSamples95=needed,minimumSamples95Safe=math.ceil(needed)if needed is not None and needed<=2**53-1 else None,negativeSeenProbability=-math.expm1(c['samples']*math.log1p(-negative)),paths=paths,prefix=prefix,randomRecords=random.records)
def trajectories(c,P):
 random=Random(c['seed']+1000);paths=[];prefix=[];wv=[];cv=[];sv=[];works=[];sigmas=[];k=P['k'];v=P['variance'];beta=P['beta']
 for j in range(c['samples']):
  z0=random.normal();x0=P['offset']+math.sqrt(v)*z0;x=x0;U0=k*x*x/2;W=Q=lf=lr=0.;steps=[]
  for i in range(1,P['N']+1):
   old=(i-1)*P['delta'];lam=i*P['delta'];before=x;uold=k*(before-old)**2/2;ujump=k*(before-lam)**2/2;dw=ujump-uold
   mu=lam+P['alpha']*(before-lam);z=random.normal();x=mu+math.sqrt(P['noiseVariance'])*z;uafter=k*(x-lam)**2/2;dq=ujump-uafter;rev=lam+P['alpha']*(x-lam)
   logf=logg(x,mu,P['noiseVariance']);logr=logg(before,rev,P['noiseVariance']);W+=dw;Q+=dq;lf+=logf;lr+=logr
   row=dict(step=i,oldLambda=old,lambda_=lam,before=before,after=x,normal=z,conditionalMean=mu,reverseConditionalMean=rev,oldU=uold,jumpedU=ujump,afterU=uafter,work=dw,heatBath=dq,energyChange=uafter-uold,cumulativeWork=W,cumulativeHeatBath=Q,logForward=logf,logReverse=logr,localLogRatio=logf-logr,betaHeat=beta*dq);row['lambda']=row.pop('lambda_');steps.append(row)
  UN=k*(x-P['L'])**2/2;du=UN-U0;li=logg(x0,P['offset'],v);lie=logg(x0,0,v);lend=logg(x,P['finalMean'],v);lee=logg(x,P['L'],v);I0=li-lie;ds=li-lend;st=beta*Q+ds;chi=beta*W+I0
  paths.append(dict(index=j,initialNormal=z0,x0=x0,xFinal=x,initialU=U0,finalU=UN,work=W,heatBath=Q,deltaU=du,firstLawResidual=du-W+Q,steps=steps,logInitial=li,logInitialEquilibrium=lie,logFinal=lend,logFinalEquilibrium=lee,initialLogDensityRatio=I0,systemEntropy=ds,totalEntropy=st,correctedEntropy=chi,betaWork=beta*W,logForwardPath=li+lf,logReverseEquilibrium=lee+lr,logReverseActual=lend+lr,crooksLogRatio=li+lf-lee-lr,totalLogRatio=li+lf-lend-lr))
  works.append(W);sigmas.append(st);wv.append(-beta*W);cv.append(-chi);sv.append(-st);lj=logmean(wv);lc=logmean(cv);lt=logmean(sv)
  prefix.append(dict(samples=j+1,meanWork=math.fsum(works)/(j+1),meanTotalEntropy=math.fsum(sigmas)/(j+1),logJarzynski=lj,jarzynski=math.exp(lj),freeEnergyEstimate=-P['T']*lj,logCorrectedIFT=lc,correctedIFT=math.exp(lc),logTotalIFT=lt,totalIFT=math.exp(lt)))
 return dict(paths=paths,prefix=prefix,randomRecords=random.records)
def expected_snapshot(c):
 P=protocol(c);sd=math.sqrt(P['varianceWork']);distribution=[]
 for i in range(161):
  z=-5+i/16;w=P['meanWork']+z*sd
  distribution.append(dict(z=z,work=w,logForwardDensity=None if sd==0 else logg(w,P['meanWork'],P['varianceWork']),logReverseNegativeDensity=None if sd==0 else logg(-w,P['equilibriumMeanWork'],P['equilibriumVarianceWork']),betaWork=P['beta']*w))
 scan=[]
 for i in range(1,41):
  p=protocol({**c,'protocolSteps':i})
  scan.append(dict(N=i,meanWork=p['meanWork'],varianceWork=p['varianceWork'],equilibriumMeanWork=p['equilibriumMeanWork'],continuumMeanWork=p['continuumMeanWork'],logJarzynski=p['logJarzynski'],meanTotalEntropy=p['meanTotalEntropy']))
 keys=['threeModelsSeparate','forceNoiseNotSpatialDiffusion','PSDTwoSided','ringUniformStationary','ringCurrentNotEntropyAtEquilibrium','finiteProtocolNotEulerApproximation','reverseSubstepOrderMatters','initialEquilibriumNeededForUnweightedJarzynski','actualFinalStateNeedNotEquilibrate','totalEntropyNotAlwaysBetaWork','heatBathSignExplicit','completeRareTailsRetained','finiteSampleNotExactIdentity','logFreeEnergyEstimatorBiased','zeroWorkDensityIsAtom','noGenerativeModelHeatEngineClaim']
 return dict(schema='fluctuation200-v1',parameters=c,units=dict(temperature='kB=1; energy unit',energy='teaching energy unit',length='teaching length unit',time='teaching time unit',entropy='dimensionless in units kB',ou='underdamped velocity; independent of harmonic overdamped work model'),ou=ou(c),ring=ring(c),protocol=P,data=trajectories(c,P),workDistribution=distribution,stepScan=scan,boundaries=dict.fromkeys(keys,True))
def validate(s):
 global CHECKS
 c=s['parameters'];assert set(c)==set(LIMITS)
 for k,(lo,hi)in LIMITS.items():assert type(c[k])is int and lo<=c[k]<=hi
 e=expected_snapshot(c);close(s,e)
 for key in ['negativeProbability','negativeSeenProbability','exponentialVariance','exactSampleMeanVariance']:
  relative(s['ring'][key],e['ring'][key],key)
 for a,b in zip(s['ring']['rows'],e['ring']['rows']):
  for key in ['probability','reverseProbability','weightedProbability']:relative(a[key],b[key],key)
 for kind in ['ring','data']:
  assert s[kind]['randomRecords']==e[kind]['randomRecords'];CHECKS+=len(e[kind]['randomRecords'])
 for t in s['data']['paths']:
  close(t['firstLawResidual'],0,'first law',1e-8)
  close(t['crooksLogRatio'],t['correctedEntropy'],'corrected path ratio',1e-8)
  close(t['totalLogRatio'],t['totalEntropy'],'total path ratio',1e-8)
  for r in t['steps']:close(r['localLogRatio'],r['betaHeat'],'local detailed balance',1e-8)
 close([s['protocol']['correctedIFT'],s['protocol']['totalIFT'],s['ring']['ift']],[1,1,1],'IFTS')
 return True
from pathlib import Path
import subprocess,hashlib,shutil,copy,re,xml.etree.ElementTree as ET
prefix=['rtk','proxy']if shutil.which('rtk')else[]
ROOT=Path(__file__).resolve().parents[1]
js=Path(sys.argv[1]).resolve()if len(sys.argv)>1 else ROOT/'course-shared/labs/fluctuation-symmetry.js'
fixture=Path(sys.argv[2]).resolve()if len(sys.argv)>2 else ROOT/'course-shared/projects/fluctuation-certificates/run-snapshot.json'
f=json.loads(fixture.read_text());assert f['provenance']['sourceSha256']==hashlib.sha256(js.read_bytes()).hexdigest()
code=r"""
const a=require(process.argv[1]),f=require(process.argv[2]);
const extras=[{temperatureTenths:1,frictionTenths:40,stiffnessTenths:40,massTenths:1,distanceTenths:40,durationTenths:1,protocolSteps:40,initialOffsetTenths:20},{temperatureTenths:1,distanceTenths:-40,initialOffsetTenths:20,stiffnessTenths:40,protocolSteps:1},{coinPercent:5,coinSteps:40},{coinPercent:95,coinSteps:40,samples:256},{coinPercent:50,coinSteps:1},{distanceTenths:0,initialOffsetTenths:-20},{durationTenths:100,frictionTenths:1,stiffnessTenths:40,protocolSteps:1},{massTenths:40,frictionTenths:1},{distanceTenths:1,protocolSteps:40},{temperatureTenths:40,stiffnessTenths:1,initialOffsetTenths:-20},{protocolSteps:40,samples:256,seed:99},{temperatureTenths:17,frictionTenths:23,stiffnessTenths:31,massTenths:19,distanceTenths:-27,durationTenths:43,protocolSteps:29,initialOffsetTenths:11,coinPercent:83,coinSteps:37,samples:173,seed:47}];
const records=[...a.PRESETS.map(p=>a.compute(p.parameters)),...extras.map(p=>a.compute(p))],frozen=f.records.map(r=>a.compute(r.data.parameters));let invalid=0;
const bad=[null,[],1,'x',{x:0},{constructor:1},{toString:1},JSON.parse('{"__proto__":{}}')];for(const[k,[lo,hi]]of Object.entries(a.LIMITS))for(const v of [null,'1',NaN,Infinity,-Infinity,1.5,lo-1,hi+1])bad.push({[k]:v});
for(const p of bad){let rejected=false;try{a.compute(p)}catch(e){rejected=true}if(!rejected)throw Error('Invalid accepted '+JSON.stringify(p));invalid++;}
let feedback=0;for(let i=0;i<4;i++)for(let j=0;j<2;j++){const r=a.feedback(i,j);if(r.correct!==(j===a.QUESTIONS[i][2])||!r.text)throw Error('Feedback');feedback++;}
process.stdout.write(JSON.stringify({records,frozen,invalid,feedback,self:a.selfTest(),rendered:records.map(r=>({plots:a.plots(r),tables:a.tables(r),svgs:a.plots(r).map(a.svg)}))}));
"""
d=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js),str(fixture)],text=True))
assert len(d['records'])==24 and len(d['frozen'])==6 and d['self']['status']=='PASS'
for s in d['records']+d['frozen']+[r['data']for r in f['records']]:validate(s)
science_checks=CHECKS

def replay(g,v,key=None):
 if isinstance(v,dict):
  assert isinstance(g,dict)and set(g)==set(v)
  for k in v:replay(g[k],v[k],k)
 elif isinstance(v,list):
  assert isinstance(g,list)and len(g)==len(v)
  for a,b in zip(g,v):replay(a,b,key)
 elif isinstance(v,bool)or v is None or isinstance(v,str):assert type(g)is type(v)and g==v
 elif key in INTEGER_KEYS:assert type(g)is int and type(v)is int and g==v,(key,g,v)
 else:assert isinstance(g,(int,float))and not isinstance(g,bool)and math.isfinite(g)and abs(g-v)<=5e-11*(1+abs(v)),(key,g,v)
for old,new in zip(f['records'],d['frozen']):replay(old['data'],new)
base=f['records'][0]['data'];guards=0
for change in [lambda x:x.update(schema=None),lambda x:x['parameters'].update(protocolSteps=12.0000000000001),lambda x:x['parameters'].update(samples=64.0000000000001),lambda x:x['protocol'].update(N=12.0000000000001),lambda x:x['protocol'].update(initialEquilibrium=1),lambda x:x['boundaries'].update(PSDTwoSided=1),lambda x:x['ou']['times'][0].update(correlation=float('nan')),lambda x:x['ring'].update(extra=0),lambda x:x['data']['paths'][0].update(index=.0000000000001),lambda x:x['units'].update(energy=None)]:
 mutant=copy.deepcopy(base);change(mutant)
 try:replay(mutant,base)
 except AssertionError:guards+=1
 else:raise AssertionError('Replay guard')
def expected_points(s):
 O=s['ou'];P=s['protocol'];R=s['ring'];last=s['data']['paths'][0]
 return [
  [[[p['time']/O['tau'],p['correlation']/O['stationaryVelocityVariance']]for p in O['times']],[[p['time']/O['tau'],p['temperatureTimesResponse']/O['stationaryVelocityVariance']]for p in O['times']],[[p['time']/O['tau'],p['velocityVarianceFromZero']/O['stationaryVelocityVariance']]for p in O['times']]],
  [[[p['scaledFrequency'],p[key]/(2*O['stationaryVelocityVariance']*O['tau'])]for p in O['spectrum']]for key in ['velocityPSD','temperatureTwiceRealMobility']],
  [[[p['k'],p['probability']]for p in R['rows']],[[p['k'],p['probability']]for p in R['rows']if p['sigma']<0]],
  [[[0,1]],[[0,1]]]if P['varianceWork']==0 else [[[p['work'],math.exp(p[key])]for p in s['workDistribution']]for key in ['logForwardDensity','logReverseNegativeDensity']],
  [[[p['samples'],p['logExponentialMean']]for p in R['prefix']]]+[[[p['samples'],p[key]]for p in s['data']['prefix']]for key in ['logJarzynski','logCorrectedIFT','logTotalIFT']]+[[[1,P['logJarzynski']],[s['parameters']['samples'],P['logJarzynski']]],[[1,0],[s['parameters']['samples'],0]]],
  [[[0,0]]+[[p['step'],p['cumulativeWork']]for p in last['steps']],[[0,0]]+[[p['step'],p['cumulativeHeatBath']]for p in last['steps']],[[0,0]]+[[p['step'],p['afterU']-last['initialU']]for p in last['steps']],[[0,0]]+[[p['step'],p['cumulativeWork']-p['cumulativeHeatBath']]for p in last['steps']]]
 ]
def expected_tables(s):
 P=s['protocol'];R=s['ring']
 return {
  'parameters':[['输入',k,v]for k,v in s['parameters'].items()]+[['势阱协议与理论',k,v]for k,v in P.items()if k!='moments']+[['OU速度模型',k,v]for k,v in s['ou'].items()if k not in ['times','spectrum']],
  'ou':[[p[k]for k in ['time','correlation','response','temperatureTimesResponse','stepMobility','velocityVarianceFromZero','stationaryVelocityVariance','msd','ballistic','diffusive']]for p in s['ou']['times']],
  'spectrum':[[p[k]for k in ['omega','scaledFrequency','velocityPSD','mobilityReal','mobilityImag','temperatureTwiceRealMobility']]for p in s['ou']['spectrum']],
  'ring':[['计数格',p['k'],p['current'],p['sigma'],p['logProbability'],p['probability'],p['logReverseProbability'],p['reverseProbability'],p['logRatio'],p['weightedProbability']]for p in R['rows']]+[['理论',k,v,None,None,None,None,None,None,None]for k,v in R.items()if k not in ['rows','paths','prefix','randomRecords']],
  'ring-paths':[[p[k]for k in ['index','start','end','k','current','sigma','states','directions','uniforms','logForward','logReverse','logRatio','systemEntropyChange','mediumEntropy']]for p in R['paths']],
  'moments':[['当前协议',p['step'],p['lambda'],p['meanX'],p['varianceX'],p['meanW'],p['varW'],p['covXW'],p['covWInitial']]for p in P['moments']]+[['不同N协议',p['N'],p['meanWork'],p['varianceWork'],p['equilibriumMeanWork'],p['continuumMeanWork'],p['logJarzynski'],p['meanTotalEntropy'],None]for p in s['stepScan']],
  'work':[[p[k]for k in ['z','work','logForwardDensity','logReverseNegativeDensity','betaWork']]for p in s['workDistribution']],
  'paths':[[p[k]for k in ['index','initialNormal','x0','xFinal','initialU','finalU','work','heatBath','deltaU','firstLawResidual','logInitial','logInitialEquilibrium','logFinal','logFinalEquilibrium','initialLogDensityRatio','systemEntropy','totalEntropy','correctedEntropy','betaWork','logForwardPath','logReverseEquilibrium','logReverseActual','crooksLogRatio','totalLogRatio']]for p in s['data']['paths']],
  'steps':[[t['index']]+[p[k]for k in ['step','oldLambda','lambda','before','after','normal','conditionalMean','reverseConditionalMean','oldU','jumpedU','afterU','work','heatBath','energyChange','cumulativeWork','cumulativeHeatBath','logForward','logReverse','localLogRatio','betaHeat']]for t in s['data']['paths']for p in t['steps']],
  'prefix':[['势阱',p['samples'],p['meanWork'],p['meanTotalEntropy'],p['logJarzynski'],p['jarzynski'],p['freeEnergyEstimate'],p['logCorrectedIFT'],p['correctedIFT'],p['logTotalIFT'],p['totalIFT']]for p in s['data']['prefix']]+[['环流',p['samples'],p['meanSigma'],p['negativeCount'],p['logExponentialMean'],p['exponentialMean'],None,None,None,None,None]for p in R['prefix']],
  'random':[['环流',p['index'],p['state'],p['u']]for p in R['randomRecords']]+[['势阱',p['index'],p['state'],p['u']]for p in s['data']['randomRecords']],
  'boundaries':[list(x)for x in list(s['boundaries'].items())+list(s['units'].items())]
 }

NS='{http://www.w3.org/2000/svg}';plotcoords=markers=table_rows=0
for s,render in zip(d['records'],d['rendered']):
 assert len(render['plots'])==6 and len(render['tables'])==12 and len(render['svgs'])==6
 for p,source,expected in zip(render['plots'],render['svgs'],expected_points(s)):
  replay([q['points']for q in p['series']],expected)
  assert p['xMin']<p['xMax']and p['yMin']<p['yMax']
  if p['key']=='ring':assert all(q.get('markersOnly')for q in p['series'])
  P=s['protocol'];sd=math.sqrt(P['varianceWork'])
  domains=[[0,10],[0,10],[0,s['ring']['n']],[-1,1]if sd==0 else[P['meanWork']-5*sd,P['meanWork']+5*sd],[1,s['parameters']['samples']],[0,P['N']]]
  replay([p['xMin'],p['xMax']],domains[['ou','spectrum','ring','work','averages','energy'].index(p['key'])])
  if p['key']in ['ou','spectrum']:replay([p['yMin'],p['yMax']],[-.05,1.05])
  if p['key']=='work'and sd==0:assert all(q.get('markersOnly')for q in p['series'])
  root=ET.fromstring(source);assert root.get('viewBox')=='0 0 900 580'and root.get('role')=='img'and root.get('aria-label')==p['title']and root.find(NS+'title').text==p['title']
  paths=[q for q in root.findall(NS+'path')if q.get('data-series')is not None];assert len(paths)==len(p['series'])
  expected_markers=[]
  for i,(series,path)in enumerate(zip(p['series'],paths)):
   assert path.get('data-series')==str(i)and path.get('stroke')==series['color']
   coords=re.findall(r'[ML](-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)',path.get('d',''));points=[q for q in series['points']if q is not None];assert len(coords)==len(points)
   starts=0;pen=False
   for q in series['points']:
    if q is None:pen=False
    else:
     if not pen or series.get('markersOnly'):starts+=1
     pen=True
   assert path.get('d').count('M')==starts
   for index,(xy,(x,y))in enumerate(zip(coords,points)):
    assert math.isfinite(x)and math.isfinite(y)and p['xMin']-1e-12<=x<=p['xMax']+1e-12 and p['yMin']-1e-12<=y<=p['yMax']+1e-12
    X=100+(x-p['xMin'])/(p['xMax']-p['xMin'])*755;Y=385-(y-p['yMin'])/(p['yMax']-p['yMin'])*290
    assert abs(float(xy[0])-X)<=1e-6 and abs(float(xy[1])-Y)<=1e-6;plotcoords+=2
    if series.get('markersOnly')or len(points)==1 or(series.get('boundaryMarkers')and index in [0,len(points)-1]):expected_markers.append((X,Y,series['color'],'none'if series.get('hollow')else series['color'],series.get('markerRadius',5)))
  actual=root.findall(NS+'circle');assert len(actual)==len(expected_markers);markers+=len(actual)
  for q,(X,Y,color,fill,radius)in zip(actual,expected_markers):assert abs(float(q.get('cx'))-X)<1e-9 and abs(float(q.get('cy'))-Y)<1e-9 and q.get('stroke')==color and q.get('fill')==fill and float(q.get('r'))==radius
 expected=expected_tables(s);assert {t['key']for t in render['tables']}==set(expected)
 for t in render['tables']:
  assert t['title']and t['headers'];rows=t['rows'];replay(rows,expected[t['key']]);assert all(len(row)==len(t['headers'])for row in t['rows']);table_rows+=len(t['rows'])
mutations=0
for change in [lambda x:x['ou']['times'][10].update(correlation=0),lambda x:x['ou']['times'][100].update(msd=0),lambda x:x['ou']['spectrum'][80].update(velocityPSD=0),lambda x:x['ring']['rows'][1].update(logProbability=0),lambda x:x['ring'].update(negativeProbability=0),lambda x:x['ring']['paths'][0].update(sigma=123),lambda x:x['protocol'].update(meanWork=0),lambda x:x['protocol'].update(varianceWork=0),lambda x:x['protocol'].update(finalMean=0),lambda x:x['protocol'].update(totalIFT=0),lambda x:x['protocol']['moments'][5].update(covXW=0),lambda x:x['data']['paths'][0]['steps'][0].update(work=123),lambda x:x['data']['paths'][0]['steps'][1].update(logReverse=0),lambda x:x['data']['paths'][0].update(totalEntropy=123),lambda x:x['data']['prefix'][10].update(logJarzynski=123),lambda x:x['stepScan'][10].update(meanWork=0),lambda x:x['workDistribution'][80].update(logForwardDensity=0),lambda x:x['boundaries'].update(reverseSubstepOrderMatters=False)]:
 mutant=copy.deepcopy(base);change(mutant)
 try:validate(mutant)
 except AssertionError:mutations+=1
 else:raise AssertionError('Undetected scientific mutation '+str(mutations))
print(json.dumps({'status':'PASS','records':len(d['records']),'frozen':len(f['records']),'checks':science_checks,'plotCoordinates':plotcoords,'markers':markers,'ledgerRows':table_rows,'invalid':d['invalid'],'feedback':d['feedback'],'mutations':mutations,'self':d['self']['checks'],'replayGuards':guards}))
