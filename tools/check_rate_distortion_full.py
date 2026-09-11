"""Exact finite rate-distortion, decimal BA dual, complete view and publication checks."""
from pathlib import Path
from fractions import Fraction as F
from math import comb,isclose,isfinite
from itertools import product
from decimal import Decimal,localcontext,getcontext
import json,subprocess,random,shutil,sys,hashlib,re,html,xml.etree.ElementTree as ET
getcontext().prec=80
class DecimalOracle:
 @staticmethod
 def mpf(x):return Decimal(str(x))
 @staticmethod
 def log(x,b=None):
  v=Decimal(x).ln();return v if b is None else v/Decimal(b).ln()
 @staticmethod
 def exp(x):return Decimal(x).exp()
mp=DecimalOracle()
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/rate-distortion.js'
FIXTURE=JS.with_name('distortion-snapshot151.json')if len(sys.argv)>1 else ROOT/'course-shared/projects/rate-distortion/run-snapshot.json'
configs=[{}, {'p':'0.5','D':'0.2'}, {'p':'0.9','D':'0.05'}, {'p':'0'}, {'p':'1'}, {'D':'0'}, {'D':'0.1'}, {'D':'0.8'}, {'D':'2'}, {'p':'0.5','D':'0.499999'}, {'initialQ':'0'}, {'initialQ':'1'}, {'initialQ':'0.000001'}, {'beta':'0'}, {'beta':'1000'}, {'beta':'0.000001'}, {'p':'0.000001','steps':200}, {'steps':1}, {'p':'0.5','D':'0.5'}]
configs += [dict(mode='finite',**c)for c in [{},{'p':'0.5'},{'p':'0'},{'p':'1'},{'codebook':'0'},{'codebook':'0,0,1'},{'codebook':'00,01,10,11'},{'codebook':'00000000,11111111','p':'0.000001'},{'D':'0'},{'D':'1'},{'D':'0.333333'}]]
configs += [dict(mode='types',**c)for c in [{},{'p':'0.5'},{'p':'0'},{'p':'1'},{'n':101,'event':'point'},{'n':100,'event':'point'},{'threshold':'0'},{'threshold':'1'},{'n':512,'p':'0.000001','threshold':'1'},{'n':512,'p':'0.999999','threshold':'0.1'},{'n':1},{'p':'0.7'},{'event':'point','threshold':'0.000001'}]]
configs += [dict(mode='water',**c)for c in [{},{'totalD':'0'},{'totalD':'14'},{'totalD':'8000'},{'varianceList':'0,0','totalD':'0'},{'varianceList':'0,9,0,1','totalD':'1'},{'varianceList':'1,1,1','totalD':'1'},{'varianceList':'1','totalD':'0.1'},{'varianceList':'1000,0.000001,1000','totalD':'0.000001'},{'varianceList':'9,4,1','totalD':'6'}]]
random.seed(151)
for i in range(16):
 mode=['rate','finite','types','water'][i%4];p=str(random.randint(1,99)/100)
 if mode=='rate':configs.append(dict(mode=mode,p=p,D=str(random.randint(0,50)/100),beta=str(random.randint(0,100)/10),initialQ=str(random.randint(1,99)/100),steps=25))
 elif mode=='finite':
  n=random.randint(1,8);words=[f'{random.randrange(2**n):0{n}b}'for _ in range(random.randint(1,10))];configs.append(dict(mode=mode,p=p,codebook=','.join(words)))
 elif mode=='types':configs.append(dict(mode=mode,p=p,n=random.randint(1,200),threshold=str(random.randint(0,100)/100),event=random.choice(['tail','point'])))
 else:configs.append(dict(mode=mode,varianceList=','.join(str(random.randint(0,10))for _ in range(5)),totalD=str(random.randint(0,50)/2)))

code=r"""const a=require(process.argv[1]),fs=require('fs'),c=JSON.parse(fs.readFileSync(0,'utf8')),f=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const decorate=d=>({...d,plots:a.plots(d),ledgers:a.ledgers(d),svgs:a.plots(d).map(a.svg)});
let invalid=0;const bad=v=>{let failed=false;try{a.snapshot(v);}catch(e){failed=true;}if(!failed)throw Error('Accepted invalid '+JSON.stringify(v));invalid++;};
const junk=[null,true,false,[],{},'', 'NaN','Infinity','0x1','1e-3','0.0000001','-0.1','1.2.3'];
for(const [base,keys]of [[{},['p','D','beta','initialQ','steps']],[{mode:'finite'},['p','D']],[{mode:'types'},['p','n','threshold']],[{mode:'water'},['totalD']]])for(const k of keys)for(const x of junk)bad({...base,[k]:x});
for(const v of [null,[],false,{mode:'unknown'},{p:1.1},{D:2.1},{beta:1001},{initialQ:1.1},{steps:0},{steps:201},{mode:'finite',codebook:''},{mode:'finite',codebook:0},{mode:'finite',codebook:'0,11'},{mode:'finite',codebook:'00,2'},{mode:'finite',codebook:'0,,1'},{mode:'finite',codebook:'0,'},{mode:'finite',codebook:'000000000'},{mode:'finite',codebook:Array(17).fill('0').join(',')},{mode:'types',n:0},{mode:'types',n:513},{mode:'types',threshold:1.1},{mode:'types',event:'unknown'},{mode:'water',totalD:8001},{mode:'water',varianceList:'1,,2'},{mode:'water',varianceList:'1,'},{mode:'water',varianceList:''},{mode:'water',varianceList:[]},{mode:'water',varianceList:'1001'},{mode:'water',varianceList:Array(9).fill('1').join(',')}])bad(v);
const live=c.concat(a.PRESETS.map(p=>p.values)).map(a.snapshot),frozen=['biased','finite','tail','water'].map(k=>f[k]);
console.log(JSON.stringify({states:live.concat(frozen).map(decorate),live:live.length,invalid,self:a.selfTest()}));"""
bundle=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve()),str(FIXTURE.resolve())],input=json.dumps(configs).encode()))
data=bundle['states']
checks=0
def ck(v,m):
 global checks;checks+=1;assert v,m
def m(q):return mp.mpf(q.numerator)/q.denominator if isinstance(q,F)else mp.mpf(q)
def log(q):return mp.log(m(q),2)
def H(p):return sum(-m(q)*log(q)for q in[p,1-p]if q)
def close(x,y,msg,tol=2e-10):ck(x is not None and isclose(x,float(y),rel_tol=2e-11,abs_tol=tol),f'{msg}: {x} vs {float(y)}')
def packed(z,q,msg):
 q=F(q);ck(F(int(z['numerator']),int(z['denominator']))==q,msg+' exact')
 try:v=float(q)
 except OverflowError:v=float('inf')
 status='zero'if not q else'overflow'if not isfinite(v)else'underflow'if not v else'finite';ck(z['status']==status,msg+' status')
 if status in['underflow','overflow']:ck(z['value']is None,msg+' no float')
 else:close(z['value'],v,msg+' approximate')
 if q:close(z['log2'],log(q),msg+' log')
 else:ck(z['log2']is None,msg+' zero log')
def rd(p,D):return mp.mpf(0)if D>=min(p,1-p)else H(p)-H(D)
def binary(r,p,D):
 threshold=min(p,1-p);zero=D>=threshold;q=F(int(p>F(1,2)))if zero else(p-D)/(1-2*D)
 joint=[[(1-p)*(1-q),(1-p)*q],[p*(1-q),p*q]]if zero else[[(1-q)*(1-D),q*D],[(1-q)*D,q*(1-D)]]
 packed(r['p'],p,'source');packed(r['budget'],D,'budget');packed(r['zeroRateThreshold'],threshold,'zero threshold');ck(r['zeroRate']==zero,'zero platform')
 for i in range(2):
  packed(r['reproduction'][i],[1-q,q][i],'reproduction marginal')
  for j in range(2):packed(r['joint'][i][j],joint[i][j],'joint distribution')
  if [1-p,p][i]:
   for j in range(2):packed(r['forward'][i][j],joint[i][j]/[1-p,p][i],'Bayes forward')
  else:ck(r['forward'][i]is None,'zero source row')
  if [1-q,q][i]:
   for j in range(2):packed(r['backward'][i][j],joint[j][i]/[1-q,q][i],'backward channel')
  else:ck(r['backward'][i]is None,'zero reproduction row')
 distortion=joint[0][1]+joint[1][0];packed(r['distortion'],distortion,'actual distortion');packed(r['slack'],D-distortion,'budget slack');close(r['entropy'],H(p),'source entropy');close(r['rate'],rd(p,D),'rate',1e-20);close(r['mutualInformation'],rd(p,D),'actual mutual information');ck(r['strictFiniteZeroDistortionRate']==(0 if p in[0,1]else 1),'exact zero finite rate')
def logrecord(z,q,msg):
 if q==0:ck(z=={'log':None,'value':0,'status':'zero'},msg+' exact zero');return
 v=float(q);ck(z['status']==('underflow'if v==0 else'finite'),msg+' status');close(z['log'],mp.log(q),msg+' log')
 if v==0:ck(z['value']is None,msg+' underflow explicit')
 else:close(z['value'],v,msg+' value')
def ba_check(r,c,p):
 beta=m(F(str(c['beta'])));q1=m(F(str(c['initialQ'])));q=[1-q1,q1];ps=[m(1-p),m(p)];ck(len(r['rows'])==c['steps'],'all BA steps')
 packed(r['p'],p,'BA source');packed(r['initialQ'],F(str(c['initialQ'])),'BA initial support');close(r['beta'],beta,'BA multiplier');ck(r['steps']==c['steps']and r['boundKind']=='floating-dual-diagnostic','BA scope')
 for t,z in enumerate(r['rows']):
  Z=[sum(q[y]*mp.exp(-beta*(x!=y))for y in range(2))for x in range(2)];W=[[q[y]*mp.exp(-beta*(x!=y))/Z[x]for y in range(2)]for x in range(2)];nq=[sum(ps[x]*W[x][y]for x in range(2))for y in range(2)]
  D=sum(ps[x]*W[x][y]*(x!=y)for x in range(2)for y in range(2));I=sum(ps[x]*W[x][y]*mp.log(W[x][y]/nq[y],2)for x in range(2)for y in range(2)if ps[x]*W[x][y]);col=[sum(ps[x]*mp.exp(-beta*(x!=y))/Z[x]for x in range(2))for y in range(2)];g=-sum(ps[x]*mp.log(Z[x])for x in range(2));upper=I*mp.log(2)+beta*D;lower=g-mp.log(max(col));delta=max(abs(nq[y]-q[y])for y in range(2))
  ck(z['t']==t,'iteration index')
  for y in range(2):logrecord(z['inputMarginal'][y],q[y],'BA input');logrecord(z['normalizers'][y],Z[y],'BA normalizer');logrecord(z['outputMarginal'][y],nq[y],'BA output');close(z['logColumnConstraints'][y],mp.log(col[y]),'dual column log')
  for x in range(2):
   for y in range(2):logrecord(z['channel'][x][y],W[x][y],'BA conditional')
  for key,v in [('distortion',D),('mutualInformation',I),('objectiveNats',upper),('dualLowerNats',lower),('gapNats',upper-lower),('marginalDelta',delta)]:close(z[key],v,key)
  dopt=min(m(min(p,1-p)),1/(1+mp.exp(beta)));ropt=0 if dopt==m(min(p,1-p))else H(p)-H(dopt);opt=ropt*mp.log(2)+beta*dopt
  ck(lower<=opt+mp.mpf('1e-70')and opt<=upper+mp.mpf('1e-70'),'independent primal dual sandwich')
  q=nq
 close(r['referenceDistortion'],dopt,'beta optimum D');close(r['referenceRate'],ropt,'beta optimum rate');close(r['referenceObjectiveNats'],opt,'beta optimum objective');ck(r['final']==r['rows'][-1],'final equals last full step')
 ck(r['supportLocked']==any(v==0 for v in q),'actual final locked support')
for state in data:
 c,r=state['parameters'],state['result']
 if c['mode']=='rate':
  p=F(str(c['p']));D=F(str(c['D']));binary(r['optimal'],p,D);ba_check(r['ba'],c,p);ck(len(r['curve'])==101,'full rate curve')
  for j,z in enumerate(r['curve']):packed(z['D'],max(1,D)*F(j,100),'curve budget');close(z['rate'],rd(p,max(1,D)*F(j,100)),'curve rate',1e-20)
 elif c['mode']=='finite':
  p=F(str(c['p']));D=F(str(c['D']));words=c['codewords'];n=c['n'];M=len(words);cells=[[0,F(0),F(0)]for _ in words];by=[F(0)]*(n+1);avg=excess=total=F(0);worst=F(0)
  packed(r['p'],p,'finite source');packed(r['budget'],D,'finite budget');ck(r['n']==n and r['M']==M and r['codewords']==words and r['distinct']==len(set(words)),'finite codebook labels');close(r['rate'],log(M)/n,'integer label rate');ck(r['strictFiniteZeroDistortionRate']==int(p not in [0,1]),'finite exact zero convention')
  ck(len(r['rows'])==2**n,'all source words')
  for index,z in enumerate(r['rows']):
   x=f'{index:0{n}b}';k=x.count('1');prob=p**k*(1-p)**(n-k);dist=[sum(a!=b for a,b in zip(x,y))for y in words];best=min(dist);winners=[j for j,v in enumerate(dist)if v==best];chosen=winners[0];d=F(best,n)
   ck(z['index']==index and z['word']==x and z['ones']==k and z['distances']==dist and z['winners']==winners and z['chosen']==chosen and z['reconstruction']==words[chosen]and z['exceeds']==(d>D),'source reconstruction record')
   for key,v in [('probability',prob),('distortion',d),('contribution',prob*d)]:packed(z[key],v,'finite '+key)
   total+=prob;avg+=prob*d;excess+=prob*(d>D);worst=max(worst,d if prob else 0);cells[chosen][0]+=1;cells[chosen][1]+=prob;cells[chosen][2]+=prob*d;by[best]+=prob
  for j,z in enumerate(r['cells']):ck(z['label']==j and z['word']==words[j]and z['count']==cells[j][0],'cell count');packed(z['mass'],cells[j][1],'cell mass');packed(z['distortion'],cells[j][2],'cell contribution')
  for k,z in enumerate(r['byDistance']):ck(z['k']==k,'distance');packed(z['mass'],by[k],'distortion histogram')
  for key,v in [('total',total),('averageDistortion',avg),('maximumSupportedDistortion',worst),('excessProbability',excess)]:packed(r[key],v,key)
  h=sum(-m(z[1])*log(z[1])for z in cells if z[1]);close(r['reconstructionEntropy'],h,'cell entropy');close(r['informationPerSymbol'],h/n,'deterministic mutual information');close(r['rateLowerAtActualDistortion'],rd(p,avg),'finite converse actual');close(r['rateLowerAtBudget'],rd(p,D),'finite budget RD');ck(r['meetsAverage']==(avg<=D),'average criterion');ck(h/n+mp.mpf('1e-70')>=rd(p,avg),'independent finite information converse')
 elif c['mode']=='types':
  p=F(str(c['p']));a=F(str(c['threshold']));n=c['n'];total=event=num=maximum=F(0);selected=possible=0;minKL=None;ck(len(r['rows'])==n+1,'all types')
  packed(r['p'],p,'type source');packed(r['threshold'],a,'type threshold');ck(r['n']==n and r['event']==c['event'],'type event metadata')
  for k,z in enumerate(r['rows']):
   q=F(k,n);single=p**k*(1-p)**(n-k);mass=comb(n,k)*single;chosen=q>=a if c['event']=='tail'else q==a;kl=None if (q and not p)or((1-q)and not(1-p))else sum(m(x)*log(x/y)for x,y in[(q,p),(1-q,1-p)]if x)
   ck(z['k']==k and int(z['count'])==comb(n,k)and z['chosen']==chosen,'type label/count/event');packed(z['frequency'],q,'frequency');packed(z['singleProbability'],single,'single source word');packed(z['mass'],mass,'type mass');close(z['entropy'],H(q),'type entropy');close(z['logCount'],log(comb(n,k)),'type size');close(z['logPrefactor'],log(comb(n,k))-n*H(q),'prefactor')
   ck(z['logPrefactor']<=1e-10 and z['logPrefactor']>=-2*float(log(n+1))-1e-10,'finite type combinatorial bounds')
   if kl is None:ck(z['divergence']is None and z['infiniteDivergence']and z['logExponent']is None and z['logTypeLower']is None,'support KL infinity')
   else:close(z['divergence'],kl,'KL direction');close(z['logExponent'],-n*kl,'exponent');close(z['logTypeLower'],-n*kl-2*log(n+1),'type lower exponent')
   total+=mass
   if chosen:
    selected+=1;event+=mass;num+=q*mass;maximum=max(maximum,mass)
    if mass:possible+=1;minKL=kl if minKL is None else min(minKL,kl)
  for key,v in [('total',total),('eventMass',event),('maximumTypeMass',maximum),('exactTypeUnionRaw',possible*maximum),('exactTypeUnionCapped',min(1,possible*maximum))]:packed(r[key],v,key)
  ck(r['selectedTypes']==selected and r['possibleSelectedTypes']==possible and r['emptyOnGrid']==(selected==0)and r['impossible']==(event==0)and r['thresholdOnGrid']==((a*n).denominator==1),'grid and support state')
  if event:
   packed(r['conditionalMean'],num/event,'conditional frequency');close(r['finiteRate'],-log(event)/n,'actual finite exponent');close(r['minimumSelectedDivergence'],minKL,'minimum type divergence')
   for z in r['rows']:packed(z['conditionalMass'],F(int(z['mass']['numerator']),int(z['mass']['denominator']))/event if z['chosen']else 0,'every conditional type')
  else:ck(r['conditionalMean']is None and r['finiteRate']is None and r['minimumSelectedDivergence']is None and all(z['conditionalMass']is None for z in r['rows']),'zero event has no conditional law')
  ldp=None if c['event']=='point'else 0 if a<=p else None if p==0 else sum(m(x)*log(x/y)for x,y in [(a,p),(1-a,1-p)]if x)
  if ldp is None:ck(r['tailLimitRate']is None,'no finite tail rate')
  else:close(r['tailLimitRate'],ldp,'closed tail asymptotic rate')
  ck(r['tailLimitInfinite']==(c['event']=='tail'and ldp is None),'tail infinity distinct from point nonlimit')
 else:
  vs=[F(x)for x in c['variances']];D=F(str(c['totalD']));budget=min(D,sum(vs));modes=len(vs)
  ck(r['dimensions']==modes and len(r['rows'])==modes and r['model']=='independent-real-Gaussian-coordinates','Gaussian scope');packed(r['budget'],D,'vector budget');packed(r['totalVariance'],sum(vs),'total input variance')
  for z,v in zip(r['variances'],vs):packed(z,v,'input component variance')
  # Independent enumeration of all active sets, rather than the sorted-water loop.
  theta=None
  if budget==sum(vs):theta=max(vs)
  else:
   for mask in product([False,True],repeat=modes):
    count=sum(mask)
    if not count:continue
    t=(budget-sum(v for v,active in zip(vs,mask)if not active))/count
    if t>=0 and all((v>t)if active else(v<=t)for v,active in zip(vs,mask)):theta=t;break
  ck(theta is not None,'valid active set');packed(r['waterLevel'],theta,'water level');dist=[min(v,theta)for v in vs];infinite=any(v>0 and d==0 for v,d in zip(vs,dist));rate=sum(log(v/d)/2 for v,d in zip(vs,dist)if v>d and d)
  ck(r['activeCount']==sum(v>d for v,d in zip(vs,dist)),'all active coordinates')
  for j,(v,d,z)in enumerate(zip(vs,dist,r['rows'])):
   ck(z['j']==j and z['active']==(v>d)and z['infiniteRate']==(v>0 and not d),'active component');packed(z['variance'],v,'variance');packed(z['distortion'],d,'component distortion');packed(z['reconstructionVariance'],v-d,'backward reconstruction variance');packed(z['forwardNoiseVariance'],(v-d)*d/v if v else 0,'forward noise')
   if v:packed(z['forwardCoefficient'],(v-d)/v,'forward gain')
   else:ck(z['forwardCoefficient']is None,'zero variance gain not defined')
   if v>0 and not d:ck(z['rate']is None,'infinite component rate')
   else:close(z['rate'],log(v/d)/2 if v>d else 0,'component rate')
  packed(r['actualDistortion'],sum(dist),'total used distortion');packed(r['slack'],D-sum(dist),'unused budget');ck(r['infiniteRate']==infinite,'infinite total state')
  if infinite:ck(r['ratePerVector']is None and r['ratePerCoordinate']is None,'explicit infinite rate')
  else:close(r['ratePerVector'],rate,'vector rate');close(r['ratePerCoordinate'],rate/modes,'coordinate rate')

print('science PASS',checks)
def vector(a,b,msg):
 ck(len(a)==len(b),msg+' length')
 for x,y in zip(a,b):close(x,y,msg)
def pts(rows,x,y):return [[x(z),y(z)]for z in rows if y(z)is not None]
def expected_series(d):
 c,r=d['parameters'],d['result']
 if c['mode']=='rate':
  o,b=r['optimal'],r['ba'];end=b['steps']-1
  return [
   {'curve':[[z['D']['value'],z['rate']]for z in r['curve']],'selected':[[o['budget']['value'],o['rate']]]},
   {'joint':[[2*x+y,z['value']]for x,row in enumerate(o['joint'])for y,z in enumerate(row)]},
   {'upper':[[z['t'],z['objectiveNats']]for z in b['rows']],'lower':[[z['t'],z['dualLowerNats']]for z in b['rows']],'optimum':[[0,b['referenceObjectiveNats']],[end,b['referenceObjectiveNats']]]},
   {'distortion':[[z['t'],z['distortion']]for z in b['rows']],'reference':[[0,b['referenceDistortion']],[end,b['referenceDistortion']]]},
   {'gap':[[z['t'],z['gapNats']]for z in b['rows']]}]
 if c['mode']=='finite':return [
  {'probability':pts(r['rows'],lambda z:z['index'],lambda z:z['probability']['value']),'contribution':pts(r['rows'],lambda z:z['index'],lambda z:z['contribution']['value'])},
  {'distortion':[[z['index'],z['distortion']['value']]for z in r['rows']],'budget':[[0,r['budget']['value']],[2**c['n']-1,r['budget']['value']]]},
  {'cells':[[z['label'],z['mass']['value']]for z in r['cells']]},
  {'distance':[[z['k'],z['mass']['value']]for z in r['byDistance']]}]
 if c['mode']=='types':return [
  {'mass':pts(r['rows'],lambda z:z['k'],lambda z:z['mass']['value']),'selected':pts([z for z in r['rows']if z['chosen']],lambda z:z['k'],lambda z:z['mass']['value'])},
  {'actual':pts(r['rows'],lambda z:z['k'],lambda z:z['mass']['log2']),'exponent':pts(r['rows'],lambda z:z['k'],lambda z:z['logExponent']),'lower':pts(r['rows'],lambda z:z['k'],lambda z:z['logTypeLower'])},
  {'conditional':pts(r['rows'],lambda z:z['k'],lambda z:z['conditionalMass']['value']if z['conditionalMass']else None)},
  {'kl':pts(r['rows'],lambda z:z['k'],lambda z:z['divergence']),'minimum':[]if r['minimumSelectedDivergence']is None else[[0,r['minimumSelectedDivergence']],[c['n'],r['minimumSelectedDivergence']]]}]
 return [
  {'variance':[[z['j'],z['variance']['value']]for z in r['rows']],'distortion':[[z['j'],z['distortion']['value']]for z in r['rows']],'water':[[0,r['waterLevel']['value']],[r['dimensions']-1,r['waterLevel']['value']]]},
  {'rate':pts(r['rows'],lambda z:z['j'],lambda z:z['rate'])},
  {'reconstruction':[[z['j'],z['reconstructionVariance']['value']]for z in r['rows']]},
  {'gain':pts(r['rows'],lambda z:z['j'],lambda z:z['forwardCoefficient']['value']if z['forwardCoefficient']else None)}]
def view_check(d):
 c,r=d['parameters'],d['result'];expected=expected_series(d);ck(len(d['plots'])==len(expected),'all model charts')
 if c['mode']=='rate':maxima=[max(1,float(c['D'])),3]+[c['steps']-1]*3
 elif c['mode']=='finite':maxima=[2**c['n']-1]*2+[r['M']-1,c['n']]
 elif c['mode']=='types':maxima=[c['n']]*4
 else:maxima=[r['dimensions']-1]*4
 for i,(q,ref)in enumerate(zip(d['plots'],expected)):
  ck([s['key']for s in q['series']]==list(ref),'all named series')
  for s in q['series']:
   ck(len(s['points'])==len(ref[s['key']]),'all data points')
   for x,y in zip(s['points'],ref[s['key']]):vector(x,y,'coordinate from full record')
   ck(s['line']==(s['key']!='selected'),'connection policy')
  xmax=max(1,maxima[i]);ck(q['xmin']==0 and q['xmax']==xmax,'full x domain')
  ticks=[xmax*j/4 for j in range(5)]if c['mode']=='rate'and i==0 else list(dict.fromkeys(int(xmax*j/4+.5)for j in range(5)))
  vector(q['xTicks'],ticks,'appropriate ticks')
  vals=[0]+[z[1]for s in q['series']for z in s['points']];lo=min(vals);hi=max(vals);pad=(hi-lo or 1)*.08;close(q['ymin'],lo-pad,'unclipped minimum');close(q['ymax'],hi+pad,'unclipped maximum');svg_check(d['svgs'][i],q)
 tabs={t['key']:t for t in d['ledgers']};ck(len(tabs)==len(d['ledgers']),'unique ledgers')
 if c['mode']=='rate':
  for key,obj,excluded in [('summary',r['optimal'],[]),('ba',r['ba'],['rows','final']),('final',r['ba']['final'],[])]:ck([z[1]for z in tabs[key]['rows']]==[v for k,v in obj.items()if k not in excluded],'complete summary '+key)
  for key,rows in [('iterations',r['ba']['rows']),('curve',r['curve'])]:ck(tabs[key]['rows']==[list(z.values())for z in rows],'all nested fields '+key)
 else:
  ck([z[1]for z in tabs['summary']['rows']]==[v for k,v in r.items()if k not in ['rows','cells','byDistance']],'complete summary')
  for key in ['rows']+(['cells','byDistance']if c['mode']=='finite'else[]):ck(tabs[key]['rows']==[list(z.values())for z in r[key]],'all nested fields '+key)
 for t in tabs.values():ck(bool(t['title'])and all(len(z)==len(t['headers'])for z in t['rows']),'rectangular complete labeled table')

def svg_check(raw,q):
 e=ET.fromstring(raw)if isinstance(raw,str)else raw;ns={'s':'http://www.w3.org/2000/svg'}
 ck(e.get('width')=='900'and e.get('height')=='425','readable native size');ck(e.find('s:title',ns).text==q['title'],'accessible chart title')
 X=lambda v:100+750*(v-q['xmin'])/(q['xmax']-q['xmin']);Y=lambda v:335-250*(v-q['ymin'])/(q['ymax']-q['ymin'])
 nodes=e.findall('s:circle[@data-series]',ns);ck(len(nodes)==sum(len(s['points'])for s in q['series']),'all chart points')
 for s in q['series']:
  pts=[v for v in nodes if v.get('data-series')==s['key']];ck(len(pts)==len(s['points']),'all series points')
  for k,(node,(x,y))in enumerate(zip(pts,s['points'])):
   ck(node.get('data-index')==str(k),'point order');close(float(node.get('cx')),X(x),'chart x');close(float(node.get('cy')),Y(y),'chart y');ck(node.get('fill')==s['color'],'chart color')
  lines=[v for v in e.findall('s:polyline',ns)if v.get('data-series')==s['key']];ck(len(lines)==int(s['line']),'connection policy')
  if lines:
   nums=list(map(float,re.split('[ ,]+',lines[0].get('points'))))if lines[0].get('points')else[];vector(nums,[z for x,y in s['points']for z in[X(x),Y(y)]],'all line coordinates')


for d in data:view_check(d)
f=json.loads(FIXTURE.read_text());ck(f['schema']==1 and f['provenance']['jsSha256']==hashlib.sha256(JS.read_bytes()).hexdigest(),'fixed full snapshot provenance')
ck(f['provenance']=={'date':'2026-09-11','node':'v24.14.0','platform':'darwin','arch':'arm64','jsSha256':hashlib.sha256(JS.read_bytes()).hexdigest()},'fixed environment')
ck(bundle['invalid']==172 and bundle['self']['status']=='PASS'and bundle['self']['checks']==12,'invalid and self checks')
if len(sys.argv)==1:
 from html.parser import HTMLParser
 src=(ROOT/'grad-math/lectures/it2-03-rate-distortion.md').read_text();site=(ROOT/'grad-math/site/it2-03-rate-distortion.html').read_text()
 formulas=[(a or b).strip()for a,b in re.findall(r'\$\$(.*?)\$\$|(?<!\\)\$(?!\$)(.*?)(?<!\\)\$(?!\$)',src,re.S)]
 actual=[html.unescape(a or b).strip()for a,b in re.findall(r'<(?:span|div) class="arithmatex">(?:\\\((.*?)\\\)|\\\[(.*?)\\\])</(?:span|div)>',site,re.S)]
 ck(formulas==actual,'every source formula preserved');ck(all('<'not in s for s in formulas),'HTML safe formulas');ck(len(re.findall(r'^## [0-9]+\.',src,re.M))==12,'twelve sections')
 ck(not re.search(r'<p>\s*<details|</details>\s*</p>',site),'balanced disclosure paragraphs')
 class Disclosure(HTMLParser):
  def __init__(self):super().__init__();self.stack=[];self.answers=0
  def handle_starttag(self,tag,attrs):
   if tag=='details':
    ck(not self.stack,'no nested answers');kind=dict(attrs).get('class');ck(kind in ['answer','page-toc'],'known disclosure');self.stack.append([kind,0]);self.answers+=kind=='answer'
   if tag=='summary':ck(bool(self.stack),'owned summary');self.stack[-1][1]+=1
  def handle_endtag(self,tag):
   if tag=='details':ck(bool(self.stack),'paired disclosure');ck(self.stack.pop()[1]==1,'one summary')
 parser=Disclosure();parser.feed(re.search(r'<article[^>]*>(.*?)</article>',site,re.S).group(1));ck(parser.answers==4 and not parser.stack,'four complete answers')
 for link in re.findall(r'(?:href|src)="([^"]+)"',site):
  target=link.split('#')[0].split('?')[0]
  if target and not re.match(r'^[a-zA-Z]+:',target)and not target.startswith('/'):ck((ROOT/'grad-math/site'/target).exists(),'local target '+target)
 for course in ['ai-course','grad-math','math-course']:ck((ROOT/course/'site/assets/learning/labs/rate-distortion.js').read_bytes()==JS.read_bytes(),'JS mirror')
 ck((ROOT/'grad-math/site/assets/learning/projects/rate-distortion/run-snapshot.json').read_bytes()==FIXTURE.read_bytes(),'snapshot mirror')
 ck((ROOT/'.github/workflows/course-audit.yml').read_text().count('python tools/check_rate_distortion_full.py')==1,'CI invocation')
 image=ROOT/'grad-math/images/it2-03-rate-distortion-ledgers.svg';ck(image.read_bytes()==(ROOT/'grad-math/site/assets/img/it2-03-rate-distortion-ledgers.svg').read_bytes(),'static mirror')
 panels=ET.parse(image).getroot().findall('.//{http://www.w3.org/2000/svg}svg');ck(len(panels)==4,'four fixed panels');frozen=data[-4:]
 def compare_svg(a,b):
  ck(a.tag==b.tag and set(a.attrib)==set(b.attrib),'full static structure');ck(a.text==b.text and a.tail==b.tail,'static text exact')
  pattern=r'[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?'
  for key,v in a.attrib.items():
   w=b.attrib[key]
   if key in {'x','y','x1','x2','y1','y2','cx','cy','r','width','height'}:ck(abs(float(v)-float(w))<=1e-9,'static subnanopixel coordinate')
   elif key in {'points','d'}:
    ck(re.sub(pattern,'#',v)==re.sub(pattern,'#',w),'static geometry syntax');av=re.findall(pattern,v);bv=re.findall(pattern,w);ck(len(av)==len(bv),'static geometry length')
    for x,y in zip(av,bv):ck(abs(float(x)-float(y))<=1e-9,'static subnanopixel geometry')
   else:ck(v==w,'static attribute '+key)
  ck(len(a)==len(b),'static children')
  for x,y in zip(a,b):compare_svg(x,y)
 for panel,(run,index)in zip(panels,[(0,1),(1,1),(2,1),(3,0)]):
  svg_check(panel,frozen[run]['plots'][index]);panel.attrib.pop('x');panel.attrib.pop('y');compare_svg(panel,ET.fromstring(frozen[run]['svgs'][index]))
 original=ET.fromstring('<svg><text x="10">target</text><polyline points="1,2 3,4"/></svg>');tiny=ET.fromstring(ET.tostring(original));tiny[0].set('x','10.000000000000002');compare_svg(original,tiny)
 for mutation in ['coordinate','point','label','attribute','node']:
  changed=ET.fromstring(ET.tostring(original))
  if mutation=='coordinate':changed[0].set('x','10.000001')
  elif mutation=='point':changed[1].set('points','1,2')
  elif mutation=='label':changed[0].text='wrong'
  elif mutation=='attribute':changed[1].set('stroke','red')
  else:changed.remove(changed[1])
  rejected=False
  try:compare_svg(original,changed)
  except AssertionError:rejected=True
  ck(rejected,'negative control '+mutation)
 table=re.search(r'data-learning-lab="rate-distortion".*?<tbody>(.*?)</tbody>',site,re.S).group(1)
 vals=[float(html.unescape(x))for x in re.findall(r'<tr>\s*<td>.*?</td>\s*<td[^>]*>(.*?)</td>\s*</tr>',table,re.S)]
 o=f['biased']['result']['optimal'];e=f['finite']['result'];t=f['tail']['result'];w=f['water']['result']
 refs=[o['rate'],o['reproduction'][1]['value'],o['forward'][0][1]['value'],o['forward'][1][0]['value'],o['distortion']['value'],e['averageDistortion']['value'],e['maximumSupportedDistortion']['value'],e['excessProbability']['value'],e['reconstructionEntropy'],t['eventMass']['value'],t['finiteRate'],t['tailLimitRate'],t['conditionalMean']['value'],w['waterLevel']['value'],w['ratePerVector'],w['ratePerCoordinate'],w['rows'][0]['forwardCoefficient']['value'],w['rows'][0]['forwardNoiseVariance']['value']]
 ck(len(vals)==len(refs)==18,'all 18 fallback values')
 for x,y in zip(vals,refs):close(x,y,'fixed numeric fallback')
 for word in ['平局','区间证书','有限码本','run-snapshot.json','overflow-wrap:anywhere']:ck(word in site,'evidence boundary '+word)
 print('formulas',len(formulas))
print(json.dumps({'status':'PASS','liveStates':bundle['live'],'frozenStates':4,'checks':checks,'invalid':bundle['invalid'],'self':bundle['self']['checks']},ensure_ascii=False))
