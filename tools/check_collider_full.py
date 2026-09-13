# -*- coding: utf-8 -*-
"""Independent stdlib oracle: erfc, integer binomial coefficients, concave score bisection."""
import math,json,sys
CHECKS=0
LIMITS={'massGeV':(20,400),'logPtWidthPercent':(0,20),'calibrationPercent':(-10,10),'rapidityHundred':(-200,200),'signalCount':(0,200),'backgroundCount':(0,500),'windowGeV':(1,60),'etaCutHundred':(20,300),'onCount':(0,200),'offCount':(0,500),'tauTenths':(1,100),'seed':(1,99)}
INTEGER_KEYS=set(LIMITS)|{'index','state','N','n','m','k','upperFrom','bin','truthSignal','truthBackground','recoSignal','recoBackground','selectedSignal','selectedBackground'}
def close(a,b,label='root',tol=4e-10):
 global CHECKS
 CHECKS+=1
 if isinstance(b,dict):
  assert isinstance(a,dict)and set(a)==set(b),(label,'keys')
  for k in b:close(a[k],b[k],label+'/'+k,tol)
 elif isinstance(b,(list,tuple)):
  assert isinstance(a,(list,tuple))and len(a)==len(b),(label,'length')
  for i,(x,y)in enumerate(zip(a,b)):close(x,y,label+'/'+str(i),tol)
 elif b is None or isinstance(b,(bool,str)):assert type(a)is type(b)and a==b,(label,a,b)
 else:assert isinstance(a,(int,float))and not isinstance(a,bool)and math.isfinite(a)and abs(a-b)<=tol*(1+abs(b)),(label,a,b)
def relative(a,b,label):
 global CHECKS
 CHECKS+=1
 assert math.isfinite(a)and abs(a-b)<=max(1e-300,4e-10*abs(b)),(label,a,b)
def kin(p1,p2,e1,e2,f1=0,f2=math.pi):
 def vector(pt,eta,phi):
  # Light-cone components, then reconstruct time/longitudinal components.
  plus=pt*math.exp(eta);minus=pt*math.exp(-eta)
  return[(plus+minus)/2,pt*math.cos(phi),pt*math.sin(phi),(plus-minus)/2]
 a=vector(p1,e1,f1);b=vector(p2,e2,f2);v=[x+y for x,y in zip(a,b)]
 transverse=2*p1*p2*(math.cosh(e1-e2)-math.cos(f1-f2))
 return dict(pt1=p1,pt2=p2,eta1=e1,eta2=e2,phi1=f1,phi2=f2,p1=a,p2=b,total=v,massSquared=transverse,transverseFormula=transverse,mass=math.sqrt(transverse),missingPt=[-v[1],-v[2]],missingPtMagnitude=math.hypot(v[1],v[2]))
def kernel(M,c):
 r=c['logPtWidthPercent']/100;g=1+c['calibrationPercent']/100
 mu=math.log(M*g)-r*r/2;sd=r/math.sqrt(2)
 def below(x):
  if sd==0:return float(M*g<x)
  return .5*math.erfc(-(math.log(x)-mu)/(sd*math.sqrt(2)))
 bins=[dict(low=x,high=x+10,probability=below(x+10)-below(x))for x in range(20,500,10)]
 return dict(truthMass=M,logMean=mu,logSD=sd,meanMass=M*g*math.exp(-r*r/4),medianMass=M*g*math.exp(-r*r/2),bins=bins,underflow=below(20),overflow=1-below(500),totalProbability=1.,containsAcceptance=False)
def ll(n,m,t,s,b):
 def term(k,x):return -x if k==0 else k*math.log(x)-x if x>0 else -math.inf
 return term(n,s+b)+term(m,t*b)
def fitted_b(n,m,t,s):
 # The log likelihood is concave. Locate the zero of its monotone score,
 # independently of the submitted closed-form quadratic root.
 if m==0 and (n==0 or s>0 and n/s<=1+t):return 0.
 lo=0.;hi=n+m+s+1
 for _ in range(100):
  b=(lo+hi)/2
  score=n/(s+b)+m/b-(1+t)
  if score>0:lo=b
  else:hi=b
 return (lo+hi)/2
def profile(n,m,t,s,hat):
 b=fitted_b(n,m,t,s);value=ll(n,m,t,s,b);q=2*(hat['logL']-value)
 fb=m/t;fixed=ll(n,m,t,s,fb);fhat=ll(n,m,t,max(0,n-fb),fb)
 return dict(s=s,b=b,meanOn=s+b,meanOff=t*b,logL=value,qRaw=q,q=max(0,q),fixedB=fb,fixedLogL=fixed if math.isfinite(fixed)else None,fixedQ=max(0,2*(fhat-fixed))if math.isfinite(fixed)else None,fixedStatus='finite'if math.isfinite(fixed)else'zero-mean-contradiction',backgroundScore=n/(s+b)+m/b-(1+t)if b>0 else None)
def conditional(n,m,t,full):
 N=n+m;p=1/(1+t)
 logs=[math.log(math.comb(N,k))+k*math.log(p)+(N-k)*math.log1p(-p)for k in range(N+1)]
 peak=max(logs[n:]);raw=peak+math.log(math.fsum(math.exp(x-peak)for x in logs[n:]))
 lp=min(0,raw);tail=math.exp(lp)
 out=dict(N=N,p=p,upperFrom=n,logTail=lp,rawLogTail=raw,tail=tail,bonferroni20=min(1,20*tail),independent20=1 if tail==1 else -math.expm1(20*math.log1p(-tail)),twentyTestsAreIllustrative=True)
 if full:
  out['distribution']=[dict(k=k,logProbability=x,probability=math.exp(x),inUpperTail=k>=n)for k,x in enumerate(logs)]
  out['probabilitySum']=math.fsum(math.exp(x)for x in logs)
 return out
def onoff(n,m,t,full=False):
 u=n-m/t;hat=dict(s=max(0,u),b=m/t if u>=0 else(n+m)/(1+t));hat['logL']=ll(n,m,t,hat['s'],hat['b'])
 zero=profile(n,m,t,0,hat)
 # At s=0 the two Poisson terms combine into the sufficient total count.
 # Use its analytic MLE for the scalar q0, avoiding bisection roundoff before sqrt.
 q=0 if u<=0 else max(0,2*(hat['logL']-ll(n,m,t,0,(n+m)/(1+t))))
 z=math.sqrt(q);tail=.5*math.erfc(z/math.sqrt(2))
 return dict(n=n,m=m,tau=t,unrestrictedS=u,atBoundary=u<=0,hat=hat,zero=zero,q0=q,asymptoticZ=z,asymptoticLogTail=math.log(tail),asymptoticTail=tail,conditional=conditional(n,m,t,full),asymptoticNotExact=True)
def check_count(p,n,m,t,full=False):
 e=onoff(n,m,t,full);close(p,e,'onoff')
 for key in ['asymptoticTail']:relative(p[key],e[key],key)
 for key in ['tail','bonferroni20','independent20']:relative(p['conditional'][key],e['conditional'][key],key)
 if full:
  for a,b in zip(p['conditional']['distribution'],e['conditional']['distribution']):relative(a['probability'],b['probability'],'PMF')
def boundary(raw,edges):
 tol=128*2**-52*max(1,abs(raw));near=next((x for x in edges if abs(x-raw)<=tol),None)
 return dict(raw=raw,value=raw if near is None else near,tolerance=tol,nearBoundary=near is not None,shift=0 if near is None else near-raw,rule='snap only within 128*epsilon*max(1,abs(mass)); raw mass retained')
def validate(s):
 global CHECKS
 close(s['schema'],'collider199-v1','schema')
 assert set(s)==set(['schema','parameters','units','data','count','maxSignal','profileScan','onScan','tauScan','kernel','responseMatrix','example','boostScan','calibrationScan','boundaries'])
 c=s['parameters'];assert set(c)==set(LIMITS)
 for k,(lo,hi)in LIMITS.items():assert type(c[k])is int and lo<=c[k]<=hi
 close(s['units'],dict(energy='GeV',rapidity='dimensionless; eta=y for massless objects',fourVector='[E,px,py,pz], metric +---',logPtWidth='standard deviation of ln(pT response)',counts='template counts and independent on/off observations',tau='known control-to-signal background exposure ratio'))
 keys=['syntheticTruthNotObservedSignal','fixedTemplateCountsNotPoisson','onOffCountsIndependentOfTemplates','noHardClampedBackground','positiveLognormalResponse','unbiasedPtNotUnbiasedMass','massKernelExcludesAcceptance','underflowOverflowRetained','boostChangesAcceptanceNotInvariantMass','missingPtNotProofOfInvisibleParticle','tauAssumedExactlyKnown','zeroOffNotKnownZeroBackground','conditionalTailFiniteSample','asymptoticZNotExactTailConversion','twentyIndependentTestsNotCorrelatedWindowScan','profileNotBayesianMarginalization','noDiscoveryClaim']
 close(s['boundaries'],dict.fromkeys(keys,True))
 data=s['data'];assert set(data)==set(['events','randomRecords','bins','ledger','window','fixedTemplateCountsNotPoissonData','truthLabelsForDiagnosticsOnly'])
 close(data['fixedTemplateCountsNotPoissonData'],True);close(data['truthLabelsForDiagnosticsOnly'],True)
 close(data['window'],dict(low=c['massGeV']-c['windowGeV'],high=c['massGeV']+c['windowGeV'],convention='[low,high)'))
 length=c['signalCount']+c['backgroundCount'];assert len(data['events'])==length and len(data['randomRecords'])==4*length
 state=c['seed'];uniforms=[]
 for i,p in enumerate(data['randomRecords']):
  state=(state*1664525+1013904223)%4294967296;u=(state+.5)/4294967296;uniforms.append(u)
  assert p==dict(index=i,state=state,u=u);CHECKS+=3
 bins=[dict(index=i,low=20+10*i,high=30+10*i,truthSignal=0,truthBackground=0,recoSignal=0,recoBackground=0,selectedSignal=0,selectedBackground=0)for i in range(48)]
 ledger={k:dict(signal=0,background=0)for k in ['generated','accepted','rejected','underflow','overflow','selectedUnderflow','selectedOverflow','window']}
 r=c['logPtWidthPercent']/100;g=1+c['calibrationPercent']/100;y=c['rapidityHundred']/100;etaCut=c['etaCutHundred']/100
 for i,e in enumerate(data['events']):
  us=uniforms[4*i:4*i+4];kind='signal'if i<c['signalCount']else'background'
  M=c['massGeV']if kind=='signal'else 20-80*math.log(1-us[0]*(1-math.exp(-6)))
  ct=-.96+1.92*us[1];eta=.5*math.log((1+ct)/(1-ct));pt=M/(2*math.cosh(eta));rad=math.sqrt(-2*math.log(us[2]));z1=rad*math.cos(2*math.pi*us[3]);z2=rad*math.sin(2*math.pi*us[3]);R1=math.exp(r*z1-r*r/2);R2=math.exp(r*z2-r*r/2)
  truth=kin(pt,pt,y+eta,y-eta);reco=kin(pt*g*R1,pt*g*R2,y+eta,y-eta)
  angle=abs(y+eta)<etaCut and abs(y-eta)<etaCut;ptpass=pt*g*R1>10 and pt*g*R2>10
  # Raw numerical mass is independently checked above and retained here only
  # for the documented machine-roundoff classification policy.
  bn=boundary(e['reco']['mass'],range(20,501,10));wn=boundary(e['reco']['mass'],[c['massGeV']-c['windowGeV'],c['massGeV']+c['windowGeV']])
  value=bn['value'];idx=-1 if value<20 else 48 if value>=500 else math.floor((value-20)/10);accepted=angle and ptpass;win=accepted and data['window']['low']<=wn['value']<data['window']['high']
  expected=dict(index=i,kind=kind,uniforms=us,truthMass=M,cosTheta=ct,etaStar=eta,z1=z1,z2=z2,response1=R1,response2=R2,truth=truth,reco=reco,anglePass=angle,ptPass=ptpass,accepted=accepted,binning=bn,windowBinning=wn,bin=idx,inWindow=win)
  close(e,expected,'event')
  assert e['bin']==idx and e['index']==i
  for prefix,v in [('truth',e['truth']),('reco',e['reco'])]:
   total=v['total'];raw=total[0]**2-total[1]**2-total[2]**2-total[3]**2
   close(v['massSquared'],raw,prefix+' raw metric',2e-12)
  relative(e['binning']['tolerance'],bn['tolerance'],'bin tolerance')
  suffix='Signal'if kind=='signal'else'Background';truthidx=math.floor((M-20)/10)
  if 0<=truthidx<48:bins[truthidx]['truth'+suffix]+=1
  if 0<=idx<48:
   bins[idx]['reco'+suffix]+=1
   if accepted:bins[idx]['selected'+suffix]+=1
  ledger['generated'][kind]+=1;ledger['accepted'if accepted else'rejected'][kind]+=1
  if idx<0:ledger['underflow'][kind]+=1;ledger['selectedUnderflow'][kind]+=int(accepted)
  if idx>=48:ledger['overflow'][kind]+=1;ledger['selectedOverflow'][kind]+=int(accepted)
  ledger['window'][kind]+=int(win)
 close(data['bins'],bins,'histogram');assert data['ledger']==ledger;CHECKS+=16
 close(s['kernel'],kernel(c['massGeV'],c),'current kernel')
 close(s['responseMatrix'],[kernel(20+20*i,c)for i in range(21)],'response matrix')
 pt=c['massGeV']/(2*math.cosh(.7));close(s['example'],kin(pt,pt,y+.7,y-.7),'example')
 close(s['boostScan'],[dict(y=-2+i/20,**kin(pt,pt,-2+i/20+.7,-2+i/20-.7),angleAccepted=abs(-2+i/20+.7)<etaCut and abs(-2+i/20-.7)<etaCut)for i in range(81)],'boost scan')
 close(s['calibrationScan'],[dict(percent=i,meanMass=c['massGeV']*(1+i/100)*math.exp(-r*r/4),medianMass=c['massGeV']*(1+i/100)*math.exp(-r*r/2))for i in range(-10,11)],'calibration scan')
 n,m,t=c['onCount'],c['offCount'],c['tauTenths']/10;check_count(s['count'],n,m,t,True)
 assert len(s['onScan'])==201 and len(s['tauScan'])==100 and len(s['profileScan'])==201
 for i,p in enumerate(s['onScan']):check_count(p,i,m,t)
 for i,p in enumerate(s['tauScan']):check_count(p,n,m,(i+1)/10)
 mx=max(50,n+6*math.sqrt(n+m+1));close(s['maxSignal'],mx)
 hat=onoff(n,m,t)['hat']
 for i,p in enumerate(s['profileScan']):close(p,profile(n,m,t,mx*i/200,hat),'profile scan')
 return True
from pathlib import Path
import subprocess,hashlib,shutil,copy,re,xml.etree.ElementTree as ET
prefix=['rtk','proxy']if shutil.which('rtk')else[]
ROOT=Path(__file__).resolve().parents[1]
js=Path(sys.argv[1]).resolve()if len(sys.argv)>1 else ROOT/'course-shared/labs/physics-collider-detector.js'
fixture=Path(sys.argv[2]).resolve()if len(sys.argv)>2 else ROOT/'course-shared/projects/collider-certificates/run-snapshot.json'
f=json.loads(fixture.read_text());assert f['provenance']['sourceSha256']==hashlib.sha256(js.read_bytes()).hexdigest()
code=r"""
const a=require(process.argv[1]),f=require(process.argv[2]);
const extras=[{massGeV:20,logPtWidthPercent:0},{massGeV:100,logPtWidthPercent:0},{massGeV:400,logPtWidthPercent:0},{signalCount:0,backgroundCount:0,onCount:0,offCount:0},{onCount:55,offCount:484,tauTenths:88},{rapidityHundred:-200,etaCutHundred:20},{onCount:200,offCount:500,tauTenths:1},{onCount:1,offCount:0,tauTenths:100},{onCount:0,offCount:500},{massGeV:20,calibrationPercent:-10},{signalCount:200,backgroundCount:500,seed:99},{massGeV:337,logPtWidthPercent:13,calibrationPercent:-7,rapidityHundred:117,signalCount:137,backgroundCount:319,windowGeV:43,etaCutHundred:167,onCount:173,offCount:277,tauTenths:71,seed:41}];
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
for change in [lambda x:x.update(schema=None),lambda x:x['parameters'].update(massGeV=125.0000000000001),lambda x:x['parameters'].update(onCount=35.0000000000001),lambda x:x['count']['conditional'].update(N=135.0000000000001),lambda x:x['data']['events'][0].update(accepted=1),lambda x:x['boundaries'].update(noDiscoveryClaim=1),lambda x:x['data']['events'][0]['reco']['p1'].__setitem__(0,float('nan')),lambda x:x['kernel'].update(extra=0),lambda x:x['data']['events'][0].update(bin=10.0000000000001),lambda x:x['units'].update(energy=None)]:
 mutant=copy.deepcopy(base);change(mutant)
 try:replay(mutant,base)
 except AssertionError:guards+=1
 else:raise AssertionError('Replay guard')
def expected_points(s):
 def step(rows,f):return [q for p in rows for q in [[p['low'],f(p)],[p['high'],f(p)]]]
 c=s['count']
 return [
  [step(s['data']['bins'],lambda p:p['truthSignal']+p['truthBackground']),step(s['data']['bins'],lambda p:p['recoSignal']+p['recoBackground']),step(s['data']['bins'],lambda p:p['selectedSignal']+p['selectedBackground']),[[(p['low']+p['high'])/2,p['selectedSignal']]for p in s['data']['bins']]],
  [[[p['y'],p['total'][0]]for p in s['boostScan']],[[p['y'],p['mass']]for p in s['boostScan']],[[s['parameters']['rapidityHundred']/100,s['example']['mass']]]],
  [step(p['bins'],lambda x:x['probability'])for p in [s['kernel'],*[s['responseMatrix'][j]for j in [4,9,14]]]],
  [[None if p['q']>12 else[p['s'],p['q']]for p in s['profileScan']],[None if p['fixedQ']is None or p['fixedQ']>12 else[p['s'],p['fixedQ']]for p in s['profileScan']],[[c['hat']['s'],0]]],
  [[[p['n'],-p['conditional']['logTail']/math.log(10)]for p in s['onScan']],[[p['n'],-p['asymptoticLogTail']/math.log(10)]for p in s['onScan']],[[c['n'],-c['conditional']['logTail']/math.log(10)]]],
  [[[p['k'],p['probability']]for p in c['conditional']['distribution']],[[p['k'],p['probability']]for p in c['conditional']['distribution']if p['inUpperTail']]]
 ]
def expected_tables(s):
 c=s['count'];a=c['conditional'];h=c['hat'];z=c['zero']
 return {
  'parameters':[list(p)for p in s['parameters'].items()],
  'events':[[e['index'],e['kind'],e['truthMass'],e['cosTheta'],e['etaStar'],[e['z1'],e['z2']],[e['response1'],e['response2']],e['truth']['mass'],e['reco']['mass'],e['anglePass'],e['ptPass'],e['accepted'],e['bin'],e['inWindow'],e['binning']['value'],e['binning']['nearBoundary'],e['binning']['shift'],e['binning']['tolerance'],e['windowBinning']['value']]for e in s['data']['events']],
  'vectors':[[e['index'],'真值'if k=='truth'else'重建',[v['pt1'],v['pt2']],[v['eta1'],v['eta2']],[v['phi1'],v['phi2']],v['p1'],v['p2'],v['total'],v['massSquared'],v['transverseFormula'],v['mass'],v['missingPt'],v['missingPtMagnitude']]for e in s['data']['events']for k in ['truth','reco']for v in [e[k]]],
  'random':[[p['index'],p['state'],p['u']]for p in s['data']['randomRecords']],
  'histogram':[['[low,high)',p['low'],p['high'],p['truthSignal'],p['truthBackground'],p['recoSignal'],p['recoBackground'],p['selectedSignal'],p['selectedBackground']]for p in s['data']['bins']]+[['计数账',None,k,v['signal'],v['background'],None,None,None,None]for k,v in s['data']['ledger'].items()],
  'response':[[n,p['truthMass'],p['logMean'],p['logSD'],p['meanMass'],p['medianMass'],[x['probability']for x in p['bins']],p['underflow'],p['overflow'],p['totalProbability'],p['containsAcceptance']]for n,p in [('当前',s['kernel'])]+[('矩阵列',p)for p in s['responseMatrix']]],
  'count':[
   ['观察n,m,τ',[c['n'],c['m'],c['tau']]],['未约束信号估计 n−m/τ',c['unrestrictedS']],['是否位于s=0边界',c['atBoundary']],['约束MLE s,b,logL',[h['s'],h['b'],h['logL']]],
   ['H0下b与两区期望',[z['b'],z['meanOn'],z['meanOff']]],['H0 logL',z['logL']],['发现统计量q0',c['q0']],['渐近Z=sqrt(q0)',c['asymptoticZ']],['渐近正态尾',c['asymptoticTail']],['渐近尾自然对数',c['asymptoticLogTail']],
   ['条件N,p',[a['N'],a['p']]],['精确条件尾',a['tail']],['精确条件尾自然对数',a['logTail']],['直接求和的原始log尾',a['rawLogTail']],['20测试Bonferroni上界',a['bonferroni20']],['20独立同分布测试的示例',a['independent20']],['条件PMF总和',a['probabilitySum']]
  ],
  'profile':[[p[k]for k in ['s','b','meanOn','meanOff','logL','qRaw','q','fixedB','fixedLogL','fixedQ','fixedStatus','backgroundScore']]for p in s['profileScan']],
  'on':[[p['n'],p['m'],p['tau'],p['hat']['s'],p['hat']['b'],p['q0'],p['asymptoticZ'],p['asymptoticLogTail'],p['conditional']['logTail'],p['conditional']['tail'],p['conditional']['bonferroni20']]for p in s['onScan']],
  'tau':[[p['tau'],p['n'],p['m'],p['hat']['s'],p['hat']['b'],p['q0'],p['asymptoticZ'],p['conditional']['logTail'],p['conditional']['tail']]for p in s['tauScan']],
  'conditional':[[p['k'],p['logProbability'],p['probability'],p['inUpperTail']]for p in a['distribution']],
  'kinematics':[['共同boost',p['y'],p['total'],p['mass'],p['total'][0],p['angleAccepted']]for p in s['boostScan']]+[['共同校准百分数',p['percent'],None,p['medianMass'],p['meanMass'],None]for p in s['calibrationScan']]+[['模型边界',k,v,None,None,None]for k,v in s['boundaries'].items()]+[['单位约定',k,v,None,None,None]for k,v in s['units'].items()]
 }
NS='{http://www.w3.org/2000/svg}';plotcoords=markers=table_rows=0
for s,render in zip(d['records'],d['rendered']):
 assert len(render['plots'])==6 and len(render['tables'])==12 and len(render['svgs'])==6
 for p,source,expected in zip(render['plots'],render['svgs'],expected_points(s)):
  replay([q['points']for q in p['series']],expected)
  assert p['xMin']<p['xMax']and p['yMin']<p['yMax']
  if p['key']in ['counts','conditional']:assert all(q.get('markersOnly')for q in p['series'])
  domains=[[20,500],[-2,2],[20,500],[0,s['maxSignal']],[0,200],[0,max(1,s['count']['conditional']['N'])]]
  replay([p['xMin'],p['xMax']],domains[['mass','boost','response','profile','counts','conditional'].index(p['key'])])
  if p['key']=='profile':replay([p['yMin'],p['yMax']],[-.4,12.4])
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
for change in [lambda x:x['data']['events'][0]['reco']['p1'].__setitem__(0,0),lambda x:x['data']['events'][0]['truth'].update(mass=0),lambda x:x['data']['events'][0].update(response1=0),lambda x:x['data']['events'][0].update(accepted=False),lambda x:x['data']['events'][0]['binning'].update(value=0),lambda x:x['data']['ledger']['overflow'].update(signal=99),lambda x:x['data']['bins'][10].update(recoSignal=99),lambda x:x['kernel']['bins'][10].update(probability=.99),lambda x:x['kernel'].update(containsAcceptance=True),lambda x:x['count']['hat'].update(b=0),lambda x:x['count'].update(q0=0),lambda x:x['count']['conditional'].update(tail=.5),lambda x:x['count']['conditional']['distribution'][0].update(logProbability=0),lambda x:x['profileScan'][100].update(b=0),lambda x:x['onScan'][150]['conditional'].update(logTail=0),lambda x:x['tauScan'][50]['hat'].update(s=99),lambda x:x['boostScan'][10].update(mass=0),lambda x:x['boundaries'].update(zeroOffNotKnownZeroBackground=False)]:
 mutant=copy.deepcopy(base);change(mutant)
 try:validate(mutant)
 except AssertionError:mutations+=1
 else:raise AssertionError('Undetected scientific mutation '+str(mutations))
print(json.dumps({'status':'PASS','records':len(d['records']),'frozen':len(f['records']),'checks':science_checks,'plotCoordinates':plotcoords,'markers':markers,'ledgerRows':table_rows,'invalid':d['invalid'],'feedback':d['feedback'],'mutations':mutations,'self':d['self']['checks'],'replayGuards':guards}))
