"""Independent Cholesky, closed massless bubble and fixed-grid quadrature."""
from pathlib import Path
import math,json,sys
from functools import lru_cache
checks=0
def eq(a,b):
 global checks
 checks+=1;assert a==b,(a,b)
def near(a,b,tol=3e-10):
 global checks
 if b is None:eq(a,None);return
 if isinstance(b,(list,tuple)):
  eq(len(a),len(b))
  for x,y in zip(a,b):near(x,y,tol)
  return
 checks+=1;assert isinstance(a,(int,float))and math.isfinite(a)and abs(a-b)<=tol*(1+abs(b)),(a,b)
def zeros(n,m=None):return [[0.]* (n if m is None else m)for _ in range(n)]
def trans(A):return list(map(list,zip(*A)))
def mm(A,B):return [[math.fsum(x*y for x,y in zip(r,c))for c in zip(*B)]for r in A]
def mv(A,x):return [math.fsum(a*b for a,b in zip(r,x))for r in A]
def dot(x,y):return math.fsum(a*b for a,b in zip(x,y))
def chol_inverse(A):
 n=len(A);L=zeros(n)
 for i in range(n):
  for j in range(i+1):
   t=A[i][j]-math.fsum(L[i][k]*L[j][k]for k in range(j))
   L[i][j]=math.sqrt(t)if i==j else t/L[j][j]
 cols=[]
 for j in range(n):
  y=[0.]*n;x=[0.]*n
  for i in range(n):y[i]=((1. if i==j else 0.)-math.fsum(L[i][k]*y[k]for k in range(i)))/L[i][i]
  for i in range(n-1,-1,-1):x[i]=(y[i]-math.fsum(L[k][i]*x[k]for k in range(i+1,n)))/L[i][i]
  cols.append(x)
 return trans(cols),2*math.fsum(math.log(L[i][i])for i in range(n))
def precision(n,m,k):
 A=zeros(n)
 for i in range(n):
  A[i][i]=m*m+2*k;A[i][(i-1)%n]-=k;A[i][(i+1)%n]-=k
 return A
LOOP=1/(16*math.pi**2)
@lru_cache(maxsize=8192)
def integral(kind,m,Q,cut):
 if m==Q==0:return None
 if not m:
  if kind=='B':
   r=math.sqrt(1+4*cut*cut/(Q*Q));return LOOP*(math.log(cut*cut/(Q*Q))+(r+1/r)*math.atanh(1/r))
  return -LOOP*math.log(Q*Q)if kind=='BR'else 1.
 def f(t):
  if t==0 or t==math.pi:return 0.
  x=(1-math.cos(t))/2;d=m*m+x*(1-x)*Q*Q;jac=math.sin(t)/2
  if kind=='B':
   y=cut*cut/d;v=math.log1p(y)-y/(1+y)
  elif kind=='BR':v=-math.log(d/(m*m+x*(1-x)))
  else:v=x*(1-x)*Q*Q/d
  return jac*v
 def simpson(n):
  h=math.pi/n;return h/3*(4*math.fsum(f(i*h)for i in range(1,n,2))+2*math.fsum(f(i*h)for i in range(2,n,2)))
 a,b=simpson(2048),simpson(4096);assert abs(a-b)<2e-9
 return b*(1 if kind=='I'else LOOP)
def audit_gaussian(g):
 c=g['parameters'];n=c['size'];m=c['mass'];k=c['kappa'];amp=c['sourceAmplitude'];A=precision(n,m,k);J=[amp*(1 if c['sourceProfile']=='uniform'else math.cos(2*math.pi*j/n)if c['sourceProfile']=='cos'else int(j==0))for j in range(n)]
 near(g['K'],A);near(g['source'],J);jmean=math.fsum(J)/n;near(g['sourceMean'],jmean);near(g['projectedSource'],[v-jmean for v in J])
 augmented=[[A[i][j]+1/n for j in range(n)]for i in range(n)];Ca,lda=chol_inverse(augmented);Cc=[[Ca[i][j]-1/(n*(m*m+1))for j in range(n)]for i in range(n)];ldp=lda-math.log(m*m+1);cg=g['constrained']
 near(cg['covariance'],Cc);near(cg['mean'],mv(Cc,J));near(cg['projector'],[[int(i==j)-1/n for j in range(n)]for i in range(n)]);near(cg['logPseudoDeterminant'],ldp);near(cg['logRatio'],dot(J,mv(Cc,J))/2);near(cg['logZ0'],(n-1)/2*math.log(2*math.pi)-ldp/2)
 if m:
  C,ld=chol_inverse(A);mu=mv(C,J);lr=dot(J,mu)/2;z0=n/2*math.log(2*math.pi)-ld/2
  for key,v in [('covariance',C),('mean',mu),('logDeterminant',ld),('logRatio',lr),('ratio',math.exp(lr)),('logZ0',z0),('logZ',z0+lr)]:near(g[key],v)
 else:
  C=mu=None;ld=None
  for key in ['covariance','mean','logDeterminant','logRatio','ratio','logZ0','logZ']:eq(g[key],None)
 eq(len(g['spectrum']),n)
 for h,row in enumerate(g['spectrum']):
  eq(row['k'],h);near(row['angle'],2*math.pi*h/n);near(row['eigenvalue'],m*m+4*k*math.sin(math.pi*h/n)**2);eq(row['zero'],m==0 and h==0)
 eq(len(g['terms']),n**3)
 for pos,row in enumerate(g['terms']):
  i,j,h=pos//(n*n),(pos//n)%n,pos%n;eq([row[x]for x in ['i','j','k']],[i,j,h]);lam=m*m+4*k*math.sin(math.pi*h/n)**2;co=math.cos(2*math.pi*h*(i-j)/n);near(row['cosine'],co);near(row['eigenvalue'],lam);v=co/(n*lam)if lam else None;near(row['fullContribution'],v);near(row['constrainedContribution'],v if h else 0)
 lo=list(range(0,n,2));hi=list(range(1,n,2));block=lambda is_,js:[[A[i][j]for j in js]for i in is_];AA=block(lo,lo);B=block(lo,hi);H=block(hi,hi);Hi,ldh=chol_inverse(H);cor=mm(mm(B,Hi),trans(B));S=[[AA[i][j]-cor[i][j]for j in range(n//2)]for i in range(n//2)];jl=[J[i]for i in lo];jh=[J[i]for i in hi];jc=mv(mm(B,Hi),jh);je=[a-b for a,b in zip(jl,jc)];constant=dot(jh,mv(Hi,jh))/2;ss=g['schur'];efk=k*k/(m*m+2*k);efm=m*m*(m*m+4*k)/(m*m+2*k)
 eq(ss['low'],lo);eq(ss['high'],hi)
 for key,v in [('Kll',AA),('Klh',B),('Khl',trans(B)),('Khh',H),('correction',cor),('matrix',S),('Jl',jl),('Jh',jh),('sourceCorrection',jc),('effectiveSource',je),('constant',constant),('effectiveKappa',efk),('effectiveMassSquared',efm),('analyticMatrix',S),('analyticResidual',0),('highLogFactor',n/4*math.log(2*math.pi)-ldh/2+constant)]:near(ss[key],v)
 near(ss['highInverse']['inverse'],Hi);near(ss['highInverse']['determinant'],math.exp(ldh));probe=[.25*math.cos(2*math.pi*i/n)for i in lo];near(ss['lowProbe'],probe);near(ss['conditionalCovariance'],Hi);near(ss['conditionalMean'],mv(Hi,[x-y for x,y in zip(jh,mv(trans(B),probe))]))
 if m:
  Si,lds=chol_inverse(S);near(ss['lowInverse']['inverse'],Si);near(ss['lowInverse']['determinant'],math.exp(lds));near(ss['lowCovariance'],[[C[i][j]for j in lo]for i in lo]);near(ss['covarianceResidual'],0);lowz=n/4*math.log(2*math.pi)-lds/2+dot(je,mv(Si,je))/2;near(ss['lowLogZ'],lowz);near(ss['totalLogZ'],g['logZ']);near(ss['determinantResidual'],ldh+lds-ld)
 else:
  for key in ['lowCovariance','covarianceResidual','lowLogZ','totalLogZ','determinantResidual']:eq(ss[key],None)
  eq(ss['lowInverse']['inverse'],None)
 eq(len(ss['rows']),(n//2)**2)
 for r in ss['rows']:
  i,j=r['i'],r['j']
  for key,v in [('Kll',AA[i][j]),('Klh',B[i][j]),('Khh',H[i][j]),('inverseHigh',Hi[i][j]),('eliminationCorrection',cor[i][j]),('Schur',S[i][j]),('analyticSchur',S[i][j]),('lowCov',C[lo[i]][lo[j]]if C else None),('inverseSchur',Si[i][j]if m else None)]:near(r[key],v)
 ids=[0,1,n//2,n-1];eq(g['wick']['indices'],ids)
 if C:
  expected=[math.prod(mu[i]for i in ids)]
  for a in range(4):
   for b in range(a+1,4):expected.append(C[ids[a]][ids[b]]*math.prod(mu[ids[t]]for t in range(4)if t not in [a,b]))
  for a,b,c,d in [(0,1,2,3),(0,2,1,3),(0,3,1,2)]:expected.append(C[ids[a]][ids[b]]*C[ids[c]][ids[d]])
  near([r['value']for r in g['wick']['terms']],expected);near(g['wick']['fourthMoment'],math.fsum(expected));near(g['wick']['fourthCumulant'],0)
 else:eq(g['wick']['terms'],[]);eq(g['wick']['fourthMoment'],None);eq(g['wick']['fourthCumulant'],None)
def audit_loop(l):
 c=l['parameters'];m,Q,cut,g=[c[k]for k in ['mass','momentum','cutoff','coupling']];near(l['coefficient'],LOOP);near(l['betaCoefficient'],3*LOOP)
 for name,kind,q in [('selected','B',Q),('reference','B',1),('renormalized','BR',Q),('mom','I',Q)]:
  value=integral(kind,m,q,cut);near(l[name]['value'],value);it=l[name]['integral']
  if value is None:eq(it,None);assert l[name]['reason'];continue
  eq(l[name]['reason'],None);eq(it['converged'],True);near(it['tolerance'],2e-12);eq(it['calls'],4*len(it['rows'])+1)
  near(it['rows'][0]['a'],0);near(it['rows'][-1]['b'],math.pi)
  for index,r in enumerate(it['rows']):
   a,b=r['a'],r['b']
   if index:near(a,it['rows'][index-1]['b'])
   vals=[]
   for t in [a,(3*a+b)/4,(a+b)/2,(a+3*b)/4,b]:
    if t==0 or t==math.pi:v=0.
    else:
     x=math.sin(t/2)**2;d=m*m+x*(1-x)*q*q
     if kind=='B':
      y=cut*cut/d if d else None;v=(math.log1p(d/(cut*cut))+d/(cut*cut+d))if not m else math.log1p(y)-y/(1+y)
     elif kind=='BR':v=0 if not m else -math.log(d/(m*m+x*(1-x)))
     else:v=1 if not m else x*(1-x)*q*q/d
     v*=math.sin(t)/2
    vals.append(v)
   near([r[k]for k in ['fa','fl','fm','fr','fb']],vals);coarse=(b-a)*(vals[0]+4*vals[2]+vals[4])/6;fine=(b-a)*(vals[0]+4*vals[1]+2*vals[2]+4*vals[3]+vals[4])/12
   for key,v in [('coarse',coarse),('fine',fine),('correction',(fine-coarse)/15),('value',fine+(fine-coarse)/15),('error',abs(fine-coarse)/15)]:near(r[key],v)
   eq(r['converged'],r['error']<=r['tolerance']);near(r['tolerance'],2e-12*(b-a)/math.pi);assert 0<=r['depth']<=24
  near(it['value'],math.fsum(r['value']for r in it['rows']));near(it['estimatedError'],math.fsum(r['error']for r in it['rows']))
  if kind!='I':
   constant=0 if m else math.log(cut*cut/(q*q))+1 if kind=='B'else -math.log(q*q);near(l[name]['analyticConstant'],constant);near(l[name]['value'],LOOP*(constant+it['value']))
  else:near(l[name]['value'],it['value'])
 ref=integral('B',m,1,cut);near(l['counterterm'],1.5*g*g*ref);near(l['bareCoupling'],g+1.5*g*g*ref)
 eq([r['cutoff']for r in l['cutoffScan']],sorted(set([2**i for i in range(11)]+[cut])))
 for r in l['cutoffScan']:
  b=integral('B',m,Q,r['cutoff']);ref=integral('B',m,1,r['cutoff']);lim=integral('BR',m,Q,cut);d=b-ref if b is not None else None
  for key,v in [('Bq',b),('Breference',ref),('difference',d),('limit',lim),('error',None if d is None else d-lim),('counterterm',1.5*g*g*ref),('bareCoupling',g+1.5*g*g*ref),('fixedBareVertex',None if b is None else g-1.5*g*g*b),('tunedVertex',None if d is None else g-1.5*g*g*d),('limitVertex',None if lim is None else g-1.5*g*g*lim)]:near(r[key],v)
 eq([r['Q']for r in l['momentumScan']],sorted(set([i/10 for i in range(41)]+[Q])))
 for r in l['momentumScan']:
  q=r['Q'];br=integral('BR',m,q,cut);ii=integral('I',m,q,cut)
  for key,v in [('renormalizedBubble',br),('vertex',None if br is None else g-1.5*g*g*br),('threshold',ii),('betaMOM',None if ii is None else 3*LOOP*g*g*ii),('betaMS',3*LOOP*g*g)]:near(r[key],v)
 a=Q/2;ps=[[a,a,a,0],[a,-a,-a,0],[-a,a,-a,0],[-a,-a,a,0]];near(l['momenta'],ps);eq(len(l['kinematics']),10)
 for r in l['kinematics']:
  i,j=r['i'],r['j'];near(r['dot'],dot(ps[i],ps[j]));near(r['pairSquared'],None if i==j else Q*Q)
 pole=1/(3*LOOP*g)if g else None;near(l['pole'],pole);ells=sorted(set([-8+i/2 for i in range(97)]+([pole]if pole is not None and pole<=40 else[])));near([r['ell']for r in l['rg']],ells)
 for r in l['rg']:
  ell=r['ell'];den=1-3*LOOP*g*ell;value=g/den if pole is None or ell<pole else None;near(r['denominator'],den);near(r['coupling'],value);near(r['derivative'],None if value is None else 3*LOOP*value*value);near(r['loopParameter'],None if value is None else LOOP*value);eq(r['status'],'connected one-loop branch'if value is not None else'Landau pole'if ell==pole else'outside connected branch')
def check_records(records):
 global checks
 checks=0
 for s in records:
  eq(s['version'],1)
  for k,v in s['gaussian']['parameters'].items():eq(v,s['parameters'][k])
  for k,v in s['loop']['parameters'].items():eq(v,s['parameters']['momentum'if k=='momentum'else k])
  audit_gaussian(s['gaussian']);audit_loop(s['loop'])
 return checks

if __name__=='__main__':
 import subprocess,shutil,tempfile,hashlib,re,copy,xml.etree.ElementTree as ET
 root=Path(__file__).resolve().parents[1];staging=len(sys.argv)>1
 js=Path(sys.argv[1])if staging else root/'course-shared/labs/renormalization-scale.js'
 fixture=Path(sys.argv[2])if staging else root/'course-shared/projects/renormalization-certificates/run-snapshot.json'
 prefix=['rtk','proxy']if shutil.which('rtk')else[]
 code=r'''const a=require(process.argv[1]),f=require(process.argv[2]);let invalid=[];for(const k of Object.keys(a.DEFAULT))for(const v of[null,false,'1',[],{},Infinity,NaN])invalid.push({[k]:v});invalid.push(null,[],{constructor:1},{toString:1},{unknown:1},{size:2},{size:5},{size:14},{mass:-1},{mass:.1},{mass:3},{kappa:0},{kappa:3},{sourceAmplitude:-2},{sourceAmplitude:2},{sourceProfile:'bad'},{cutoff:0},{cutoff:1025},{momentum:-1},{momentum:5},{coupling:-1},{coupling:3});let rejected=0;for(const x of invalid){try{a.config(x);}catch(e){rejected++;}}let configs=a.PRESETS.map(p=>p.config);for(const size of[4,6,8,10,12])for(const mass of[0,.2,1,2])configs.push({size,mass,sourceProfile:'uniform',sourceAmplitude:1});configs.push({size:10,mass:.5,kappa:2,sourceProfile:'point',sourceAmplitude:-1,cutoff:3.5,momentum:.33,coupling:.01});configs.push({size:6,mass:.5,sourceAmplitude:0,cutoff:1,momentum:0,coupling:0});const records=configs.map(a.compute),views=a.PRESETS.map((p,i)=>{const s=records[i],ps=a.plots(s);return{key:p.key,plots:ps,svgs:ps.map(a.svg),tables:a.tables(s)};});console.log(JSON.stringify({records,views,frozen:f.records.map(r=>a.compute(r.data.parameters)),invalid:invalid.length,rejected,feedback:a.QUESTIONS.map((q,i)=>[a.feedback(i,0),a.feedback(i,1)]),self:a.selfTest()}));'''
 d=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True));f=json.loads(fixture.read_text())
 # Frozen source identity remains byte-exact; libm results need numeric replay.
 def replay(a,b,path='$'):
  if isinstance(a,dict):
   assert isinstance(b,dict) and a.keys()==b.keys(),('replay keys',path)
   for key in a:replay(a[key],b[key],path+'.'+key)
  elif isinstance(a,list):
   assert isinstance(b,list) and len(a)==len(b),('replay length',path)
   for i,(x,y) in enumerate(zip(a,b)):replay(x,y,path+'['+str(i)+']')
  elif type(a)in(int,float) and type(b)in(int,float):
   if type(a)is int or type(b)is int:assert type(a)is type(b) and a==b,('replay integer',path,a,b)
   else:assert math.isfinite(a) and math.isfinite(b) and math.isclose(a,b,rel_tol=2e-12,abs_tol=2e-14),('replay number',path,a,b)
  else:assert type(a)is type(b) and a==b,('replay exact',path,a,b)
 replay(d['frozen'],[r['data']for r in f['records']])
 # The replay accepts last-bit rounding, but rejects structural and numeric drift.
 replay({'x':[1.0,None,True,2]}, {'x':[math.nextafter(1.0,2.0),None,True,2]})
 replayGuardCases=[({'x':1.0},{'x':1.00001}),({'x':1},{'x':2}),({'x':1},{'x':1.0}),({'x':1},{'x':1.0000000000001}),({'x':1.0},{'x':1}),({'x':1.0000000000001},{'x':1}),({'x':None},{'x':0}),({'x':True},{'x':1}),({'x':[1]},{'x':[]}),({'x':1},{'y':1})]
 replayGuards=0
 for a,b in replayGuardCases:
  try:replay(a,b)
  except AssertionError:replayGuards+=1
 assert replayGuards==len(replayGuardCases)

 eq(f['provenance']['sourceSha256'],hashlib.sha256(js.read_bytes()).hexdigest());eq(len(f['records']),6);eq(len({r['key']for r in f['records']}),6);eq(d['invalid'],d['rejected']);assert d['invalid']>=75
 total=check_records(d['records']+[r['data']for r in f['records']]);plotCoordinates=0;ledgerRows=0;markers=0
 def close(a,b):assert abs(a-b)<=2e-5*max(1,abs(a),abs(b)),(a,b)
 for vi,v in enumerate(d['views']):
  s=d['records'][vi];g=s['gaussian'];l=s['loop'];n=s['parameters']['size']
  eq([p['key']for p in v['plots']],['covariance','spectrum','bubble','vertex','threshold','rg'])
  eq([t['key']for t in v['tables']],['parameters','gaussian','modes','schur','wick','integral','cutoff','momentum','kinematics','rg']);t={r['key']:r['rows']for r in v['tables']}
  param=[[k,x]for k,x in s['parameters'].items()]
  mapped={'logDetK':g['logDeterminant'],'logZ0':g['logZ0'],'logRatio':g['logRatio'],'Zratio':g['ratio'],'logZ':g['logZ'],'constrainedLogPseudoDet':g['constrained']['logPseudoDeterminant'],'constrainedLogZ0':g['constrained']['logZ0'],'constrainedLogRatio':g['constrained']['logRatio'],'highLogFactor':g['schur']['highLogFactor'],'lowLogZ':g['schur']['lowLogZ'],'SchurTotalLogZ':g['schur']['totalLogZ'],'effectiveMassSquared':g['schur']['effectiveMassSquared'],'effectiveKappa':g['schur']['effectiveKappa'],'effectiveSource':g['schur']['effectiveSource'],'sourceConstant':g['schur']['constant'],'lowProbe':g['schur']['lowProbe'],'conditionalMean':g['schur']['conditionalMean'],'bubbleAnalyticConstant':l['selected']['analyticConstant'],'subtractionAnalyticConstant':l['renormalized']['analyticConstant'],'counterterm':l['counterterm'],'bareCoupling':l['bareCoupling'],'LandauPole':l['pole'],'scope':s['scope']}
  eq(t['parameters'],param+[[k,x]for k,x in mapped.items()])
  eq(t['gaussian'],[[i,j,g['K'][i][j],None if g['covariance']is None else g['covariance'][i][j],g['constrained']['covariance'][i][j],g['source'][i],None if g['mean']is None else g['mean'][i],g['constrained']['mean'][i]]for i in range(n)for j in range(n)])
  eq(t['modes'],[[r[k]for k in ['i','j','k','cosine','eigenvalue','fullContribution','constrainedContribution']]for r in g['terms']])
  eq(t['schur'],[[r[k]for k in ['i','j','Kll','Klh','Khh','inverseHigh','eliminationCorrection','Schur','analyticSchur','lowCov','inverseSchur']]for r in g['schur']['rows']])
  eq(t['wick'],[[i,r['kind'],r.get('indices',g['wick']['indices']),r['value']]for i,r in enumerate(g['wick']['terms'])]+[['合计','四点矩',g['wick']['indices'],g['wick']['fourthMoment']],['累积量','四阶连通',g['wick']['indices'],g['wick']['fourthCumulant']]])
  eq(t['integral'],[[name]+[r[k]for k in ['a','b','fa','fl','fm','fr','fb','coarse','fine','correction','value','error','tolerance','depth','converged']]for name in ['selected','reference','renormalized','mom']for r in ([]if l[name]['integral']is None else l[name]['integral']['rows'])])
  eq(t['cutoff'],[[r[k]for k in ['cutoff','Bq','Breference','difference','limit','error','counterterm','bareCoupling','fixedBareVertex','tunedVertex','limitVertex','qError','referenceError']]for r in l['cutoffScan']])
  eq(t['momentum'],[[r[k]for k in ['Q','renormalizedBubble','vertex','threshold','betaMOM','betaMS']]for r in l['momentumScan']])
  eq(t['kinematics'],[[r['i'],r['j'],l['momenta'][r['i']],l['momenta'][r['j']],r['dot'],r['pairSquared']]for r in l['kinematics']])
  eq(t['rg'],[[r[k]for k in ['ell','denominator','coupling','derivative','loopParameter','status']]for r in l['rg']])
  for table in v['tables']:ledgerRows+=len(table['rows']);assert all(len(r)==len(table['headers'])for r in table['rows'])
  curves=[
   [[None if g['covariance']is None else [j,g['covariance'][0][j]]for j in range(n)],[[j,x]for j,x in enumerate(g['constrained']['covariance'][0])]],
   [[[r['k'],r['eigenvalue']]for r in g['spectrum']]],
   [[None if r[key]is None else [math.log2(r['cutoff']),r[key]]for r in l['cutoffScan']]for key in ['Bq','Breference']],
   [[None if r[key]is None else [math.log2(r['cutoff']),r[key]]for r in l['cutoffScan']]for key in ['fixedBareVertex','tunedVertex','limitVertex']],
   [[None if r[key]is None else [r['Q'],r[key]]for r in l['momentumScan']]for key in ['betaMOM','betaMS']],
   [[None if r['coupling']is None else [r['ell'],math.log10(1+r['coupling'])]for r in l['rg']]]
  ]
  for pi,(p,markup,lines)in enumerate(zip(v['plots'],v['svgs'],curves)):
   points=[pt for line in lines for pt in line if pt is not None];xs=[pt[0]for pt in points];ys=[pt[1]for pt in points];xmin=min(xs)if xs else 0;xmax=max(xs)if xs else 1;ymin=min(ys)if ys else 0;ymax=max(ys)if ys else 1
   if xmax==xmin:xmax=xmin+1
   if pi==5:xmin,xmax=-8,40
   pad=(ymax-ymin or max(1,abs(ymax)))*.08
   for key,val in zip(['xMin','xMax','yMin','yMax'],[xmin,xmax,ymin-pad,ymax+pad]):close(p[key],val)
   eq(len(p['series']),len(lines));tree=ET.fromstring(markup);eq(tree.attrib['aria-label'],p['title']);paths=[e for e in tree.iter()if 'data-series'in e.attrib];eq(len(paths),len(lines));expectedMarks=[]
   for si,(line,expected,path)in enumerate(zip(p['series'],lines,paths)):
    eq(len(line['points']),len(expected));eq(path.attrib['data-series'],str(si));eq(path.attrib['stroke'],line['color']);eq(line['markersOnly'],pi in [0,1])
    for a,b in zip(line['points'],expected):
     if b is None:eq(a,None)
     else:
      for aa,bb in zip(a,b):close(aa,bb);plotCoordinates+=1
    commands=[];nums=[];pen=False
    for pt in expected:
     if pt is None:pen=False;continue
     commands.append('L'if pen and not line['markersOnly']else'M');pen=True;nums.extend([100+(pt[0]-p['xMin'])/(p['xMax']-p['xMin'])*755,385-(pt[1]-p['yMin'])/(p['yMax']-p['yMin'])*290])
    eq(re.findall('[MLQ]',path.attrib['d']),commands);actual=list(map(float,re.findall(r'[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?',path.attrib['d'])));eq(len(actual),len(nums))
    for a,b in zip(actual,nums):close(a,b)
    pts=[pt for pt in expected if pt is not None];chosen=pts if line['markersOnly']else [pts[0]]+([pts[-1]]if len(pts)>1 else[])if pts else []
    for x,y in chosen:expectedMarks.append((100+(x-p['xMin'])/(p['xMax']-p['xMin'])*755,385-(y-p['yMin'])/(p['yMax']-p['yMin'])*290,line['color']))
   circles=[e for e in tree.iter()if e.tag.endswith('circle')];markers+=len(circles);eq(len(circles),len(expectedMarks))
   for node,(x,y,color)in zip(circles,expectedMarks):close(float(node.attrib['cx']),x);close(float(node.attrib['cy']),y);eq(node.attrib['fill'],color)
 for i,pair in enumerate(d['feedback']):
  eq([x['correct']for x in pair],[i in [1,2],i in [0,3]])
  for x in pair:assert x['text'].startswith('预测正确。'if x['correct']else'需要修正。')and len(x['text'])>10
 mutations=[('gaussian','K',0,0),('gaussian','covariance',0,0),('gaussian','logZ'),('gaussian','constrained','covariance',0,0),('gaussian','constrained','logPseudoDeterminant'),('gaussian','schur','matrix',0,0),('gaussian','schur','constant'),('gaussian','schur','effectiveSource',0),('gaussian','terms',0,'fullContribution'),('gaussian','wick','fourthMoment'),('loop','selected','value'),('loop','selected','integral','rows',0,'fa'),('loop','cutoffScan',0,'tunedVertex'),('loop','momentumScan',1,'betaMOM'),('loop','rg',0,'coupling'),('loop','kinematics',1,'dot')]
 caught=0
 for path in mutations:
  changed=copy.deepcopy(d['records'][0]);target=changed
  for k in path[:-1]:target=target[k]
  target[path[-1]]+=1
  try:check_records([changed])
  except AssertionError:caught+=1
 eq(caught,len(mutations));eq(d['self']['status'],'PASS')
 if not staging:
  for course in ['ai-course','grad-math','math-course','physics-course']:eq((root/course/'site/assets/learning/labs/renormalization-scale.js').read_bytes(),js.read_bytes())
  eq((root/'physics-course/site/assets/learning/projects/renormalization-certificates/run-snapshot.json').read_bytes(),fixture.read_bytes())
  for path in ['physics-course/lectures/qft-03-path-renorm.md','physics-course/site/qft-03-path-renorm.html']:assert 'pr183-course'in(root/path).read_text()
  with tempfile.TemporaryDirectory()as tmp:
   target=Path(tmp);subprocess.run(prefix+['python3',str(root/'tools/build_renormalization_figure.py'),str(js),str(fixture),str(target/'figure.svg'),str(target/'fallback.md')],check=True,stdout=subprocess.PIPE)
   for path in ['physics-course/images/qft-03-renormalization-ledgers.svg','physics-course/site/assets/img/qft-03-renormalization-ledgers.svg']:eq((target/'figure.svg').read_bytes(),(root/path).read_bytes())
   assert(target/'fallback.md').read_text()in(root/'physics-course/lectures/qft-03-path-renorm.md').read_text()
 print(json.dumps({'status':'PASS','records':len(d['records']),'frozen':6,'checks':total,'plotCoordinates':plotCoordinates,'markers':markers,'ledgerRows':ledgerRows,'invalid':d['invalid'],'feedback':8,'mutations':caught,'self':d['self']['checks'],'replayGuards':replayGuards}))
