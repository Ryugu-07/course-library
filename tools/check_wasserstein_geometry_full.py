"""Exact atomic geometry, decimal spectral Gaussian oracle, full views and publication contract."""
from pathlib import Path
from fractions import Fraction as F
from itertools import product
from math import isclose
import json,subprocess,random,shutil,sys,re,html,hashlib,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/wasserstein-geodesic.js'
FIXTURE=JS.with_name('geometry-snapshot153.json')if len(sys.argv)>1 else ROOT/'course-shared/projects/wasserstein-geodesic/run-snapshot.json'
from decimal import Decimal,getcontext
getcontext().prec=80
def dec(x):return x if isinstance(x,Decimal)else Decimal(str(x))
class Matrix:
 def __init__(self,x):
  if isinstance(x,Matrix):x=x.a
  if not isinstance(x[0],(list,tuple)):x=[[v]for v in x]
  self.a=[[dec(v)for v in row]for row in x];self.rows=len(x);self.cols=len(x[0])
 def __iter__(self):return iter(v for row in self.a for v in row)
 def __getitem__(self,key):return self.a[key[0]][key[1]]if isinstance(key,tuple)else self.a[key][0]
 def __add__(self,o):return Matrix([[self[i,j]+o[i,j]for j in range(self.cols)]for i in range(self.rows)])
 def __sub__(self,o):return self+(-1)*o
 def __mul__(self,o):
  if not isinstance(o,Matrix):return Matrix([[v*dec(o)for v in row]for row in self.a])
  return Matrix([[sum(self[i,k]*o[k,j]for k in range(self.cols))for j in range(o.cols)]for i in range(self.rows)])
 def __rmul__(self,o):return self*o
 def __eq__(self,o):return self.a==o.a
 def __pow__(self,p):
  assert p==-1 and self.rows==self.cols==2
  d=self[0,0]*self[1,1]-self[0,1]*self[1,0]
  return Matrix([[self[1,1]/d,-self[0,1]/d],[-self[1,0]/d,self[0,0]/d]])
 @property
 def T(self):return Matrix(list(map(list,zip(*self.a))))
class DecimalSpectral:
 mpf=staticmethod(dec)
 matrix=Matrix
 sqrt=staticmethod(lambda x:dec(x).sqrt())
 @staticmethod
 def eye(n):return Matrix([[int(i==j)for j in range(n)]for i in range(n)])
 @staticmethod
 def diag(v):return Matrix([[v[i]if i==j else 0 for j in range(len(v))]for i in range(len(v))])
 @staticmethod
 def det(M):return M[0,0]*M[1,1]-M[0,1]*M[1,0]
 @staticmethod
 def eigsy(M):
  a,b,d=M[0,0],M[0,1],M[1,1]
  if b==0:return [a,d],Matrix([[1,0],[0,1]])
  center=(a+d)/2;radius=(((a-d)/2)**2+b*b).sqrt();lo,hi=center-radius,center+radius
  # Spectral projection via a normalized eigenvector; distinct from the JS Cayley-Hamilton root.
  v=[b,hi-a];norm=(v[0]*v[0]+v[1]*v[1]).sqrt();v=[z/norm for z in v]
  return [lo,hi],Matrix([[-v[1],v[0]],[v[0],v[1]]])
mp=DecimalSpectral()
configs=[]
for mode in ['atomic','barycenter','plane','gaussian']:
 for t in ['0','1','0.000001','0.999999','0.37']:configs.append(dict(mode=mode,t=t,s='0.83'))
random.seed(153)
def distribution():
 n=random.randint(1,4);cuts=[0]+sorted(random.sample(range(1,100),n-1))+[100];return ','.join(str((cuts[i+1]-cuts[i])/100)for i in range(n)),','.join(map(str,random.sample(range(-20,21),n)))
for k in range(20):
 a,x=distribution();b,y=distribution();m,z=distribution();cm,cx=distribution();configs.append(dict(mode='barycenter'if k%2 else'atomic',a=a,x=x,b=b,y=y,thirdMass=m,thirdX=z,candidateMass=cm,candidateX=cx,t='0.123456',s='0.654321'))
for k in range(10):
 X=','.join(map(str,random.sample(range(-10,11),2)))+';'+','.join(map(str,random.sample(range(-10,11),2)));Y=','.join(map(str,random.sample(range(-10,11),2)))+';'+','.join(map(str,random.sample(range(-10,11),2)));configs.append(dict(mode='plane',sourcePoints=X,targetPoints=Y,pairing='cross'if k%2 else'direct',s='0.1',t='0.9'))
for k in range(10):
 def cov():
  a,b,c=[random.randint(1,7)for _ in range(3)];return f'{a*a},{a*b};{a*b},{b*b+c*c}'
 configs.append(dict(mode='gaussian',sourceCov=cov(),targetCov=cov(),s='0.123456',t='0.654321'))

code=r"""const a=require(process.argv[1]),fs=require('fs'),configs=JSON.parse(fs.readFileSync(0,'utf8')),f=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
let invalid=0;const bad=v=>{let failed=false;try{a.snapshot(v);}catch(e){failed=true;}if(!failed)throw Error('Accepted invalid '+JSON.stringify(v));invalid++;};
const junk=[null,true,false,[],{},'', 'NaN','Infinity','0x1','1e-3','0.0000001','1.2.3'];
for(const [base,keys]of [[{},['a','b','x','y','s','t']],[{mode:'barycenter'},['thirdMass','thirdX','weights','candidateMass','candidateX']],[{mode:'plane'},['sourcePoints','targetPoints']],[{mode:'gaussian'},['sourceMean','targetMean','sourceCov','targetCov']]])for(const key of keys)for(const v of junk)bad({...base,[key]:v});
const special=[null,[],false,{mode:'unknown'},{a:'0.9'},{b:'0.35,0.650001'},{a:'-0.1,1.1',x:'-1,1'},{a:'1.1,-0.1',x:'-1,1'},{a:'0.2,0.2,0.2,0.2,0.2',x:'-2,-1,0,1,2'},{a:'0.5,0.5',x:'0,0'},{x:'0,1'},{x:'1001'},{y:'-1001,0'},{s:'-0.000001'},{t:'1.000001'},{mode:'barycenter',weights:'0.5,0.5'},{mode:'barycenter',weights:'0.25,0.25,0.500001'},{mode:'barycenter',candidateMass:'0.5,0.5',candidateX:'1,1'},{mode:'plane',sourcePoints:'0,0;0,0'},{mode:'plane',targetPoints:'0,0;1,1;2,2'},{mode:'plane',pairing:'unknown'},{mode:'gaussian',sourceMean:'1'},{mode:'gaussian',targetMean:'0,1001'},{mode:'gaussian',sourceCov:'0,0;0,0'},{mode:'gaussian',sourceCov:'1,1;1,1'},{mode:'gaussian',sourceCov:'1,0;0,0.0001'},{mode:'gaussian',sourceCov:'1,0.1;0.2,1'},{mode:'gaussian',targetCov:'1,2;2,1'},{mode:'gaussian',targetCov:'-1,0;0,1'},{mode:'gaussian',targetCov:'101,0;0,1'},{mode:'gaussian',targetCov:'1,0;0,1;0,1'},{a:' '.repeat(513)},{mode:'gaussian',sourceCov:' '.repeat(2049)}];special.forEach(bad);
const live=configs.concat(a.PRESETS.map(p=>p.values)).map(a.snapshot),frozen=['atomic','barycenter','plane','gaussian'].map(k=>f[k]);
for(const d of frozen)if(JSON.stringify(a.snapshot(d.parameters))!==JSON.stringify(d))throw Error('Frozen drift');
console.log(JSON.stringify({states:live.concat(frozen).map(d=>({...d,plots:a.plots(d),ledgers:a.ledgers(d),svgs:a.plots(d).map(a.svg)})),live:live.length,invalid,self:a.selfTest()}));"""
INVALID_COUNT=237
bundle=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve()),str(FIXTURE.resolve())],input=json.dumps(configs).encode()))
data=bundle['states']
checks=0
def ck(v,msg):
 global checks;checks+=1;assert v,msg
def close(x,y,msg,tol=2e-10):ck(isclose(x,float(y),rel_tol=tol,abs_tol=tol),msg+f': {x} vs {y}')
def packed(z,q,msg):ck(F(int(z['numerator']),int(z['denominator']))==q,msg+' fraction');close(z['value'],q,msg,2e-12)
def atoms(a,x):return sorted([(F(p),F(m))for p,m in zip(x.split(','),a.split(','))if F(m)])
def merge(A):
 m={}
 for x,v in A:m[x]=m.get(x,F(0))+v
 return sorted((x,v)for x,v in m.items()if v)
def quantiles(A):
 u=F(0);out=[]
 for x,m in A:out.append((u,u+m,x));u+=m
 return out
def joint(ds):
 out=[]
 # Independent Cartesian intersections, not union-grid lookup.
 for items in product(*[quantiles(A)for A in ds]):
  left=max(z[0]for z in items);right=min(z[1]for z in items)
  if right>left:out.append((left,right,[z[2]for z in items]))
 return sorted(out)
def distance(A,B):return sum((r-l)*(z[0]-z[1])**2 for l,r,z in joint([A,B]))
def atomcheck(actual,A,msg):
 ck(len(actual)==len(A),msg+' all atoms')
 for z,(x,m)in zip(actual,A):packed(z['position'],x,msg+' position');packed(z['mass'],m,msg+' mass')
def statscheck(z,A):
 mean=sum(x*m for x,m in A);second=sum(x*x*m for x,m in A)
 for key,v in [('mass',sum(m for x,m in A)),('mean',mean),('secondMoment',second),('variance',second-mean*mean)]:packed(z[key],v,'statistics '+key)
def timegrid(c):return sorted(set([F(k,20)for k in range(21)]+[F(c['s']),F(c['t'])]))
def matcheck(actual,ref,msg):
 ck(len(actual)==len(ref)and all(len(a)==len(b)for a,b in zip(actual,ref)),msg+' shape')
 for a,b in zip(actual,ref):
  for z,q in zip(a,b):packed(z,q,msg)
for state in data:
 c,r=state['parameters'],state['result'];mode=c['mode'];s,t=F(c['s']),F(c['t'])
 if mode in ['atomic','barycenter']:
  A=atoms(c['a'],c['x']);B=atoms(c['b'],c['y'])
 if mode=='atomic':
  J=joint([A,B]);D=distance(A,B);disp=lambda v:merge([((1-v)*x+v*y,rr-l)for l,rr,(x,y)in J]);mix=lambda v:merge([(x,(1-v)*m)for x,m in A]+[(x,v*m)for x,m in B]);atomcheck(r['source'],A,'source');atomcheck(r['target'],B,'target');packed(r['distanceSquared'],D,'distance squared');close(r['distanceApproximation'],float(D)**.5,'W2 square root');ck(r['sameDistribution']==(D==0),'exact identical distributions');ck(len(r['quantiles'])==len(J),'all overlaps')
  for k,(z,(left,right,(x,y)))in enumerate(zip(r['quantiles'],J)):
   ck(z['k']==k,'quantile index')
   for key,v in [('left',left),('right',right),('mass',right-left),('x',x),('y',y),('velocity',y-x),('atS',(1-s)*x+s*y),('atT',(1-t)*x+t*y),('cost',(right-left)*(y-x)**2)]:packed(z[key],v,key)
  for key,A0 in [('atS',disp(s)),('displacement',disp(t)),('mixture',mix(t))]:atomcheck(r[key],A0,key)
  packed(r['betweenSquared'],distance(disp(s),disp(t)),'independent intermediate transport');packed(r['expectedBetweenSquared'],(s-t)**2*D,'constant speed')
  ck(len(r['timeRows'])==len(timegrid(c)),'all time rows')
  for z,u in zip(r['timeRows'],timegrid(c)):
   U,V=disp(u),mix(u);packed(z['time'],u,'time');atomcheck(z['displacement'],U,'time displacement');atomcheck(z['mixture'],V,'time mixture');statscheck(z['displacementStats'],U);statscheck(z['mixtureStats'],V)
   for key,v in [('startSquared',distance(A,U)),('endSquared',distance(U,B)),('expectedStartSquared',u*u*D),('expectedEndSquared',(1-u)**2*D),('mixtureStartSquared',distance(A,V)),('mixtureEndSquared',distance(V,B))]:packed(z[key],v,key)
 elif mode=='barycenter':
  ds=[A,B,atoms(c['thirdMass'],c['thirdX'])];w=list(map(F,c['weights'].split(',')));candidate=atoms(c['candidateMass'],c['candidateX']);J=joint(ds);bar=merge([(sum(ww*x for ww,x in zip(w,xs)),right-left)for left,right,xs in J]);atomcheck(r['barycenter'],bar,'barycenter');atomcheck(r['candidate'],candidate,'candidate')
  for actual,D in zip(r['distributions'],ds):atomcheck(actual,D,'input distribution')
  for z,v in zip(r['weights'],w):packed(z,v,'bary weights')
  ck(len(r['quantiles'])==len(J),'all common quantile cells')
  for k,(z,(left,right,xs))in enumerate(zip(r['quantiles'],J)):
   q=sum(ww*x for ww,x in zip(w,xs));ck(z['k']==k,'index')
   for key,v in [('left',left),('right',right),('mass',right-left),('barycenterPosition',q),('weightedVariance',sum(ww*(x-q)**2 for ww,x in zip(w,xs)))]:packed(z[key],v,key)
   for zz,v in zip(z['positions'],xs):packed(zz,v,'all coordinates')
  opt=0;value=0
  for k,(z,D,ww)in enumerate(zip(r['costRows'],ds,w)):
   d0,d1=distance(D,bar),distance(D,candidate);opt+=ww*d0;value+=ww*d1;ck(z['k']==k,'cost index')
   for key,v in [('weight',ww),('optimalCost',d0),('candidateCost',d1),('optimalContribution',ww*d0),('candidateContribution',ww*d1)]:packed(z[key],v,key)
  for key,v in [('objective',opt),('candidateObjective',value),('gap',value-opt),('candidateDistanceSquared',distance(candidate,bar))]:packed(r[key],v,key)
  ck(value-opt==distance(candidate,bar),'independent quantile variance identity');ck(r['certifiedOptimal']==(value==opt),'bary exact optimal');statscheck(r['barycenterStats'],bar);statscheck(r['candidateStats'],candidate)
 elif mode=='plane':
  X=[list(map(F,row.split(',')))for row in c['sourcePoints'].split(';')];Y=[list(map(F,row.split(',')))for row in c['targetPoints'].split(';')];perms=[[0,1],[1,0]]
  def cost(X,Y,p):return sum(sum((x-y)**2 for x,y in zip(X[i],Y[p[i]]))for i in range(2))/2
  def distance2(X,Y):return min(cost(X,Y,p)for p in perms)
  costs=[cost(X,Y,p)for p in perms];D=min(costs);selected=int(c['pairing']=='cross');C=costs[selected]
  def at(v,k=selected):return[[(1-v)*X[i][j]+v*Y[perms[k][i]][j]for j in range(2)]for i in range(2)]
  matcheck(r['source'],X,'plane source');matcheck(r['target'],Y,'plane target');packed(r['massPerLabel'],F(1,2),'label mass');ck(r['selected']==selected and r['selectedOptimal']==(C==D)and r['optimalAssignments']==sum(v==D for v in costs),'plane optimality')
  for k,z in enumerate(r['assignments']):ck(z['k']==k and z['permutation']==perms[k]and z['optimal']==(costs[k]==D),'assignment');packed(z['cost'],costs[k],'assignment cost')
  for key,v in [('distanceSquared',D),('selectedCost',C),('excessCost',C-D),('betweenSquared',distance2(at(s),at(t))),('particleBoundSquared',(s-t)**2*C)]:packed(r[key],v,key)
  for key,M in [('atS',at(s)),('atT',at(t)),('alternativeAtT',at(t,1-selected))]:matcheck(r[key],M,key)
  ck(len(r['timeRows'])==len(timegrid(c)),'plane all times')
  for z,u in zip(r['timeRows'],timegrid(c)):
   packed(z['time'],u,'plane time');matcheck(z['positions'],at(u),'particle positions');matcheck(z['alternativePositions'],at(u,1-selected),'alternative particles')
   for key,v in [('startSquared',distance2(X,at(u))),('endSquared',distance2(at(u),Y)),('optimalSpeedStartSquared',u*u*D),('optimalSpeedEndSquared',(1-u)**2*D),('particleStartBoundSquared',u*u*C),('particleEndBoundSquared',(1-u)**2*C)]:packed(z[key],v,key)
 else:
  def M(value):return mp.matrix([[mp.mpf(z)for z in row.split(',')]for row in value.split(';')])
  def root(A):
   eig,Q=mp.eigsy(A);return Q*mp.diag([mp.sqrt(max(mp.mpf(0),v))for v in eig])*Q.T
  def tr(M):return sum(M[i,i]for i in range(M.rows))
  def frob(M):return mp.sqrt(sum(v*v for v in M))
  def matrixcheck(actual,M,msg):
   ck(len(actual)==M.rows and all(len(row)==M.cols for row in actual),msg+' shape')
   for i,row in enumerate(actual):
    for j,v in enumerate(row):close(v,M[i,j],msg,2e-9)
  S0,S1=M(c['sourceCov']),M(c['targetCov']);m0=mp.matrix([mp.mpf(z)for z in c['sourceMean'].split(',')]);m1=mp.matrix([mp.mpf(z)for z in c['targetMean'].split(',')]);I=mp.eye(2);R=root(S0);H=R*S1*R;B=root(H);A=R**-1*B*R**-1;D=tr(S0+S1-2*B)+sum(v*v for v in m1-m0)
  ck(r['identicalCovariance']==(S0==S1),'exact equal covariance branch')
  for key,mat in [('sourceCovariance',S0),('targetCovariance',S1),('sourceRoot',R),('sourceInverseRoot',R**-1),('middle',H),('middleRoot',B),('map',A)]:matrixcheck(r[key],mat,key)
  for key,vec in [('sourceMean',m0),('targetMean',m1),('mapOffset',m1-A*m0)]:
   for z,v in zip(r[key],vec):close(z,v,key)
  mean=sum(v*v for v in m1-m0)
  for key,v in [('meanCost',mean),('covarianceCost',tr(S0+S1-2*B)),('distanceSquared',D),('traceFormulaValue',D),('distanceApproximation',mp.sqrt(max(mp.mpf(0),D))),('betweenSquared',(mp.mpf(c['s'])-mp.mpf(c['t']))**2*D)]:close(r[key],v,key,3e-9)
  if c['sourceCov']=='1,0;0,1'and c['targetCov']=='1.000001,0;0,1':ck(abs(mp.mpf(r['distanceSquared'])/D-1)<mp.mpf('1e-8'),'tiny positive cost relative precision')
  def atcheck(z,u):
   MM=(1-u)*I+u*A;S=MM*S0*MM.T;matrixcheck(z['map'],MM,'interpolated map');matrixcheck(z['covariance'],S,'path covariance')
   for vv,ref in zip(z['mean'],(1-u)*m0+u*m1):close(vv,ref,'path mean')
   close(z['trace'],tr(S),'path trace');close(z['determinant'],mp.det(S),'path determinant',2e-8)
  atcheck(r['atS'],mp.mpf(c['s']));atcheck(r['atT'],mp.mpf(c['t']));ck(len(r['timeRows'])==len(timegrid(c)),'Gaussian all times')
  def actual_at(u):
   MM=(1-u)*I+u*A;return MM*S0*MM.T,(1-u)*m0+u*m1
  def actual_distance(SA,ma,SB,mb):
   RA=root(SA);return tr(SA+SB-2*root(RA*SB*RA))+sum(v*v for v in ma-mb)
  SS,ms=actual_at(mp.mpf(c['s']));ST,mt=actual_at(mp.mpf(c['t']));close(r['betweenSquared'],actual_distance(SS,ms,ST,mt),'new Gaussian OT between intermediate covariances',3e-9)
  for z,u0 in zip(r['timeRows'],timegrid(c)):
   u=mp.mpf(u0.numerator)/u0.denominator;close(z['time'],u,'Gaussian time');atcheck(z,u);matrixcheck(z['covarianceLinearBlend'],(1-u)*S0+u*S1,'linear covariance distinct path');close(z['startSquared'],u*u*D,'Gaussian start');close(z['endSquared'],(1-u)**2*D,'Gaussian end');SU,mu=actual_at(u);close(z['startSquared'],actual_distance(S0,m0,SU,mu),'independent Gaussian start transport',3e-9);close(z['endSquared'],actual_distance(SU,mu,S1,m1),'independent Gaussian end transport',3e-9)
  observed=mp.matrix(r['map']);ck(frob(observed*S0*observed.T-S1)<mp.mpf('1e-7'),'independent pushforward residual');ck(min(mp.eigsy(observed)[0])>mp.mpf('-1e-8'),'PSD gradient map')
  for key in ['mapSymmetry','pushforwardResidual','sourceRootResidual','middleRootResidual']:ck(abs(r['diagnostics'][key])<1e-7,'reported residual '+key)

print('science PASS',checks)
def vector(a,b,msg):
 ck(len(a)==len(b),msg+' length')
 for x,y in zip(a,b):close(x,y,msg)
def view_check(d):
 c,r=d['parameters'],d['result'];mode=c['mode'];expected=[]
 def steps(rows,f):return [[v,f(z)]for z in rows for v in [z['left']['value'],z['right']['value']]]
 def atom_points(A):return [[z['position']['value'],z['mass']['value']]for z in A]
 def points(P):return [[z['value']for z in row]for row in P]
 def times(key):return [[z['time']['value'],z[key]['value']]for z in r['timeRows']]
 if mode=='atomic':
  expected=[{'source':steps(r['quantiles'],lambda z:z['x']['value']),'target':steps(r['quantiles'],lambda z:z['y']['value']),'current':steps(r['quantiles'],lambda z:z['atT']['value'])},{'displacement':atom_points(r['displacement'])},{'mixture':atom_points(r['mixture'])},{'actual':times('startSquared'),'expected':times('expectedStartSquared'),'mixture':times('mixtureStartSquared')}]
 elif mode=='barycenter':
  expected=[{**{'input'+str(i):steps(r['quantiles'],lambda z,i=i:z['positions'][i]['value'])for i in range(3)},'barycenter':steps(r['quantiles'],lambda z:z['barycenterPosition']['value'])},{'barycenter':atom_points(r['barycenter']),'candidate':atom_points(r['candidate'])},{'optimal':[[z['k'],z['optimalContribution']['value']]for z in r['costRows']],'candidate':[[z['k'],z['candidateContribution']['value']]for z in r['costRows']]},{'variance':steps(r['quantiles'],lambda z:z['weightedVariance']['value'])}]
 elif mode=='plane':
  X,Y=points(r['source']),points(r['target'])
  for k,key in [(r['selected'],'atT'),(1-r['selected'],'alternativeAtT')]:
   perm=r['assignments'][k]['permutation'];expected.append({**{'trajectory'+str(i):[X[i],Y[perm[i]]]for i in range(2)},'current':points(r[key])})
  expected += [{'costs':[[z['k'],z['cost']['value']]for z in r['assignments']],'minimum':[[0,r['distanceSquared']['value']],[1,r['distanceSquared']['value']]]},{'actual':times('startSquared'),'optimal':times('optimalSpeedStartSquared'),'bound':times('particleStartBoundSquared')}]
 else:
  from math import cos,sin,pi
  # Independent high precision spectral root for the target contour.
  target=mp.matrix([[mp.mpf(z)for z in row.split(',')]for row in c['targetCov'].split(';')]);eig,Q=mp.eigsy(target);target_root=Q*mp.diag([mp.sqrt(max(mp.mpf(0),v))for v in eig])*Q.T
  def ellipse(mean,L):return [[mean[i]+sum(float(L[i,j])*v for j,v in enumerate([cos(2*pi*k/64),sin(2*pi*k/64)]))for i in range(2)]for k in range(65)]
  expected=[{'source':ellipse(r['sourceMean'],mp.matrix(r['sourceRoot'])),'target':ellipse(r['targetMean'],target_root),'current':ellipse(r['atT']['mean'],mp.matrix(r['atT']['map'])*mp.matrix(r['sourceRoot']))},{'column0':[[0,0],[r['map'][0][0],r['map'][1][0]]],'column1':[[0,0],[r['map'][0][1],r['map'][1][1]]]},{'geodesic':[[z['time'],z['trace']]for z in r['timeRows']],'linear':[[z['time'],z['covarianceLinearBlend'][0][0]+z['covarianceLinearBlend'][1][1]]for z in r['timeRows']]},{'start':[[z['time'],z['startSquared']]for z in r['timeRows']],'end':[[z['time'],z['endSquared']]for z in r['timeRows']]}]
 ck(len(d['plots'])==len(d['svgs'])==4,'four complete charts')
 for index,(p,raw,ref)in enumerate(zip(d['plots'],d['svgs'],expected)):
  ck(p['type']=='chart'and [ss['key']for ss in p['series']]==list(ref),'every expected series')
  xx=[];yy=[]
  for ss in p['series']:
   exp=ref[ss['key']];ck(len(ss['points'])==len(exp),'all actual points')
   for point,actual in zip(ss['points'],exp):vector(point,actual,'actual chart values')
   xx += [z[0]for z in exp];yy += [z[1]for z in exp]
   no_line=(mode=='atomic'and index in [1,2])or(mode=='barycenter'and index in [1,2])or(mode=='plane'and((index<2 and ss['key']=='current')or(index==2 and ss['key']=='costs')))
   ck(ss['line']==(not no_line),'discrete probability and path connection policy')
  square=mode in ['plane','gaussian']and index<2;ck(p['square']==square,'equal physical axes')
  if square:close(p['xmin'],p['ymin'],'same lower geometry scale');close(p['xmax'],p['ymax'],'same upper geometry scale')
  ck(p['xmin']<=min(xx)and p['xmax']>=max(xx)and p['ymin']<=min(yy)and p['ymax']>=max(yy),'every value within plot range')
  if(mode=='atomic'and index in [0,3])or(mode=='barycenter'and index in [0,3])or(mode in ['plane','gaussian']and index==3)or(mode=='gaussian'and index==2):vector([p['xmin'],p['xmax']],[0,1],'full time/probability axis')
  if(mode=='barycenter'and index==2)or(mode=='plane'and index==2):ck(all(int(v)==v for v in p['xTicks']),'discrete axis labels')
  ck(not p['markers'],'no fabricated selected markers');svg_check(raw,p)
 tabs={z['key']:z for z in d['ledgers']};exclude=['quantiles','timeRows','costRows','assignments','diagnostics']
 ck([z[1]for z in tabs['summary']['rows']]==[v for k,v in r.items()if k not in exclude],'all summary fields')
 for key in ['quantiles','timeRows','costRows','assignments']:
  if key in r:ck(tabs[key]['rows']==[list(z.values())for z in r[key]],'complete nested records '+key)
 if 'diagnostics'in r:ck([z[1]for z in tabs['diagnostics']['rows']]==list(r['diagnostics'].values()),'all floating diagnostics')
 for z in tabs.values():ck(all(len(row)==len(z['headers'])for row in z['rows']),'complete rectangular ledger')

def svg_check(raw,q):
 e=ET.fromstring(raw)if isinstance(raw,str)else raw;ns={'s':'http://www.w3.org/2000/svg'}
 ck(e.get('width')=='900'and e.get('height')=='425','readable native size');ck(e.find('s:title',ns).text==q['title'],'accessible chart title')
 X=lambda v:(325 if q['square']else 100)+(250 if q['square']else 750)*(v-q['xmin'])/(q['xmax']-q['xmin']);Y=lambda v:335-250*(v-q['ymin'])/(q['ymax']-q['ymin'])
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
ck(bundle['invalid']==INVALID_COUNT and bundle['self']['status']=='PASS'and bundle['self']['checks']==12,'invalid and self checks')
if len(sys.argv)==1:
 from html.parser import HTMLParser
 src=(ROOT/'grad-math/lectures/ot-02-wasserstein.md').read_text();site=(ROOT/'grad-math/site/ot-02-wasserstein.html').read_text()
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
 for course in ['ai-course','grad-math','math-course']:ck((ROOT/course/'site/assets/learning/labs/wasserstein-geodesic.js').read_bytes()==JS.read_bytes(),'JS mirror')
 ck((ROOT/'grad-math/site/assets/learning/projects/wasserstein-geodesic/run-snapshot.json').read_bytes()==FIXTURE.read_bytes(),'snapshot mirror')
 ck((ROOT/'.github/workflows/course-audit.yml').read_text().count('python tools/check_wasserstein_geometry_full.py')==1,'CI invocation')
 image=ROOT/'grad-math/images/ot-02-wasserstein-ledgers.svg';ck(image.read_bytes()==(ROOT/'grad-math/site/assets/img/ot-02-wasserstein-ledgers.svg').read_bytes(),'static mirror')
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
 for panel,(run,index)in zip(panels,[(0,0),(1,0),(2,3),(3,2)]):
  panel.attrib.pop('x');panel.attrib.pop('y');compare_svg(panel,ET.fromstring(frozen[run]['svgs'][index]))
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
 table=re.search(r'data-learning-lab="wasserstein-geodesic".*?<tbody>(.*?)</tbody>',site,re.S).group(1)
 vals=[float(html.unescape(x))for x in re.findall(r'<tr>\s*<td>.*?</td>\s*<td[^>]*>(.*?)</td>\s*</tr>',table,re.S)]
 a=f['atomic']['result'];b=f['barycenter']['result'];p=f['plane']['result'];g=f['gaussian']['result'];mid=next(z for z in a['timeRows']if z['time']['value']==0.5)
 refs=[a['distanceSquared']['value'],a['distanceApproximation'],a['betweenSquared']['value'],mid['displacementStats']['mean']['value'],mid['displacementStats']['variance']['value'],mid['mixtureStats']['variance']['value'],b['objective']['value'],b['candidateObjective']['value'],b['gap']['value'],b['barycenter'][0]['position']['value'],p['distanceSquared']['value'],p['selectedCost']['value'],next(z for z in p['timeRows']if z['time']['value']==0.5)['startSquared']['value'],p['betweenSquared']['value'],g['distanceSquared'],g['map'][0][0],g['atT']['covariance'][0][0],g['atT']['covariance'][1][1]]
 ck(len(vals)==len(refs)==18,'all 18 fallback values')
 for x,y in zip(vals,refs):close(x,y,'fixed numeric fallback')
 for word in ['不自动归一化','分位数','目标差','run-snapshot.json','overflow-wrap:anywhere']:ck(word in site,'evidence boundary '+word)
 print('formulas',len(formulas))
print(json.dumps({'status':'PASS','liveStates':bundle['live'],'frozenStates':4,'checks':checks,'invalid':bundle['invalid'],'self':bundle['self']['checks']},ensure_ascii=False))
