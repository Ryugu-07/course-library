"""Independent finite-dimensional identities, complete traces and publication contracts."""
from pathlib import Path
from fractions import Fraction as F
from decimal import Decimal as D,localcontext
import subprocess,shutil,json,math,sys,re,html,hashlib,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/non-normal-transient.js'
code=r'''
const a=require(process.argv[1]),cs=[...a.PRESETS];let invalid=0;
for(const r of [-1.1,-1,-.9,0,.9,1-1e-13,1,1+1e-13,1.1])for(const g of [0,1e-13,20])for(const z of [.5,1.3,0])cs.push({r,g,z,k:30,theta:180});
for(const gap of [0,1e-15,1e-12,2])for(const epsilon of [0,1e-15,.5,2])for(const axisAngle of [0,35])for(const scaleExponent of [-12,12])cs.push({mode:"perturbation",gap,epsilon,axisAngle,scaleExponent});
for(const d of [[4,3,-2],[1,1,1],[-5,0,5],[0,0,0]])for(const coupling of [0,1/3,5/3,-4])for(const scaleExponent of [-12,12])cs.push({mode:"gershgorin",d1:d[0],d2:d[1],d3:d[2],coupling,scaleExponent});
for(const [c,keys]of [[{},["r","g","k","theta","z"]],[{mode:"perturbation"},["center","gap","axisAngle","epsilon","perturbAngle","scaleExponent"]],[{mode:"gershgorin"},["d1","d2","d3","coupling","scaleExponent"]]]){
 for(const key of keys)for(const v of ["",null,true,false,[],{},NaN,Infinity,-Infinity,"1e309","1e-400","0x10","3x"]){
  let bad=false;try{a.config({...c,[key]:v});}catch(e){bad=true;}if(!bad)throw Error("invalid "+key);invalid++;
 }
}
for(const c of [null,[],{mode:"x"},{r:1.2},{g:21},{k:1.5},{k:61},{theta:181},{z:.01},{mode:"perturbation",gap:-1},{mode:"perturbation",epsilon:3},{mode:"perturbation",scaleExponent:1.5},{mode:"gershgorin",d1:1.5},{mode:"gershgorin",coupling:5}]){
 let bad=false;try{a.config(c);}catch(e){bad=true;}if(!bad)throw Error("boundary");invalid++;
}
a.snapshot({mode:"transient",epsilon:null,gap:"",coupling:NaN,scaleExponent:""});
a.snapshot({mode:"perturbation",r:"",g:NaN,k:[],z:0.00001});
a.snapshot({mode:"gershgorin",epsilon:null,theta:NaN,gap:"",z:[]});
console.log(JSON.stringify({invalid,self:a.selfTest(),states:cs.map((c,i)=>{const d=a.snapshot(c);return i<a.PRESETS.length?{...d,plots:a.plots(d),ledgers:a.ledgers(d),svgs:a.plots(d).map(a.svg)}:d;})}));
'''
data=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve())],text=True));checks=0
def ck(v,m):
 global checks
 assert v,m;checks+=1
def close(x,y,label,scale=1,rtol=4e-12,atol=5e-14):
 y=float(y);ck(type(x)in [int,float]and math.isfinite(x)and abs(x-y)<=atol*scale+rtol*abs(y),(label,x,y,scale))
def vec(x,y,label,**kw):
 ck(len(x)==len(y),label+' length')
 for a,b in zip(x,y):close(a,b,label,**kw)
def mat(A,B,label,**kw):
 ck(len(A)==len(B),label+' rows')
 for a,b in zip(A,B):vec(a,b,label,**kw)
def tr(A):return list(map(list,zip(*A)))
def dot(x,y):return math.fsum(a*b for a,b in zip(x,y))
def norm(x):return math.hypot(*x)
def fro(A):return norm([v for r in A for v in r])
def mv(A,x):return[dot(r,x)for r in A]
def mm(A,B):return[[dot(r,c)for c in zip(*B)]for r in A]
def sub(x,y):return[a-b for a,b in zip(x,y)]
def msub(A,B):return[sub(a,b)for a,b in zip(A,B)]
def madd(A,B):return[[a+b for a,b in zip(r,s)]for r,s in zip(A,B)]
def mul(A,s):return[[x*s for x in r]for r in A]
def eye(n):return[[int(i==j)for j in range(n)]for i in range(n)]
def unit(angle):
 k=angle%360
 if k in [0,90,180,270]:return{0:[1,0],90:[0,1],180:[-1,0],270:[0,-1]}[k]
 return[math.cos(angle*math.pi/180),math.sin(angle*math.pi/180)]
def tri_values(a,b):
 with localcontext()as ctx:
  ctx.prec=80;x=D(a);y=D(b);trace=2*x*x+y*y;disc=(y*y*(y*y+4*x*x)).sqrt()
  maximum=((trace+disc)/2).sqrt();minimum=abs(x*x/maximum)if maximum else D(0)
  return[float(maximum),float(minimum)]
def verify_svd(v,A):
 size=fro(A);mat(v['A'],A,'SVD input',scale=size);wanted=tri_values(A[0][0],A[0][1])
 vec([v['max'],v['min']],wanted,'Decimal Gram spectrum',scale=size)
 for key,image in [('vMax','maxImage'),('vMin','minImage')]:
  close(norm(v[key]),1,'unit singular direction');vec(v[image],mv(A,v[key]),'actual singular-vector action',scale=size)
 close(dot(v['vMax'],v['vMin']),0,'orthogonal singular directions')
 close(norm(v['maxImage']),v['max'],'largest direction attained',scale=size)
 # The computed least direction is retained even when its attained residual is
 # much larger than the analytic tiny singular value due to rounding.
def check_transient(s,p):
 r,g,k,z=s['r'],s['g'],s['k'],s['z'];A=[[r,g],[0,r]];mat(p['A'],A,'Jordan input');vec(p['x0'],unit(s['theta']),'exact cardinal input')
 ck(len(p['rows'])==k+1 and p['final']==p['rows'][-1],'all time steps');P=eye(2);S=[[0,0],[0,0]]
 for j,v in enumerate(p['rows']):
  ck(v['j']==j,'time index');mat(v['before'],P,'connected matrix recurrence',scale=fro(P))
  if j:P=mm(A,P)
  mat(v['P'],P,'actual full multiplication',scale=fro(P))
  # Continue from the already checked stored product to avoid CPU drift cascades.
  P=v['P'];closed=eye(2)if j==0 else([[0,g],[0,0]]if j==1 else[[0,0],[0,0]])if r==0 else[[r**j,j*g*r**(j-1)],[0,r**j]]
  mat(v['closed'],closed,'independent Jordan formula',scale=fro(P)+fro(closed))
  close(v['closedGap'],fro(msub(P,closed)),'actual closed-form discrepancy',scale=fro(P)+fro(closed))
  x=mv(P,p['x0']);vec(v['x'],x,'actual orbit',scale=norm(x));close(v['selected'],norm(x),'selected gain',scale=norm(x));close(v['normal'],abs(r)**j,'same-spectrum control')
  verify_svd(v['svd'],P);close(v['envelope'],v['svd']['max'],'operator gain');ck(v['selected']<=v['envelope']+2e-13*max(1,v['envelope']),'selected within envelope')
  if j:close(v['rootGain'],v['envelope']**(1/j),'finite root rate')
  else:ck(v['rootGain']is None,'zeroth root undefined')
  if z==0:
   ck(all(v[key]is None for key in ['term','sum','identityResidual','tail','identityGap','remainder','remainderPredicted','remainderGap','partialNorm','remainderNorm']),'undefined Neumann objects');continue
  term=mul(P,z**(-j-1));S=madd(S,term);scale=fro(S)
  mat(v['term'],term,'actual Neumann term',scale=scale);mat(v['sum'],S,'actual finite sum',scale=scale);S=v['sum']
  M=[[z-r,-g],[0,z-r]];tail=mul(mm(A,P),z**(-j-1));res=msub(eye(2),mm(M,S));budget=1+fro(M)*fro(S)+fro(tail)
  mat(v['tail'],tail,'full polynomial tail',scale=budget);mat(v['identityResidual'],res,'finite telescoping residual',scale=budget)
  close(v['identityGap'],fro(msub(v['identityResidual'],v['tail'])),'reported identity defect',scale=budget)
  ck(v['identityGap']<=5e-12*budget,'finite identity within arithmetic')
  close(v['partialNorm'],tri_values(S[0][0],S[0][1])[0],'partial norm',scale=fro(S))
  if z==r:ck(all(v[key]is None for key in ['remainder','remainderPredicted','remainderGap','remainderNorm']),'inverse undefined separately')
  else:
   R=[[1/(z-r),g/(z-r)**2],[0,1/(z-r)]];rem=msub(R,S);pred=mm(R,tail);budget=fro(R)+fro(S)+fro(R)*fro(tail)
   mat(v['remainder'],rem,'actual inverse minus sum',scale=budget);mat(v['remainderPredicted'],pred,'actual resolvent tail',scale=budget)
   close(v['remainderGap'],fro(msub(v['remainder'],v['remainderPredicted'])),'actual remainder defect',scale=budget)
   ck(v['remainderGap']<=7e-12*budget,'remainder identity within arithmetic')
   close(v['remainderNorm'],tri_values(v['remainder'][0][0],v['remainder'][0][1])[0],'actual remainder norm',scale=budget)
 close(p['rho'],abs(r),'spectral radius');ck(p['normal']==(g==0)and p['diagonalizable']==(g==0),'strict nonnormal boundary')
 ck(p['asymptotic']==('decay'if abs(r)<1 else'growth'if abs(r)>1 else'bounded-nondecaying'if g==0 else'polynomial-growth'),'exact asymptotic alternatives')
 close(p['nonNormality'],g*g,'commutator norm')
 for field,out in [('selected','selectedPeak'),('envelope','envelopePeak')]:ck(p[out]==max(range(k+1),key=lambda j:p['rows'][j][field]),'first window maximum')
 q=p['resolvent'];M=[[z-r,-g],[0,z-r]];mat(q['M'],M,'shifted Jordan');verify_svd(q['svd'],M)
 ck(q['status']==('spectral-point'if z==r else'invertible'),'singular status')
 ck(q['neumann']==('undefined-at-zero'if z==0 else'convergent'if abs(z)>abs(r)else'not-convergent'),'series convergence separate from inverse')
 if z==r:ck(q['norm']is None and q['inverse']is None,'no fake inverse')
 else:
  R=[[1/(z-r),g/(z-r)**2],[0,1/(z-r)]];mat(q['inverse'],R,'explicit inverse',scale=fro(R));close(q['norm'],tri_values(R[0][0],R[0][1])[0],'inverse norm',scale=fro(R))
 v=q['v'];vec(v,q['svd']['vMin'],'selected least direction');w=mv(M,v);vec(q['Ev'],w,'actual witness action',scale=fro(M));E=[[x*y for y in v]for x in w];mat(q['E'],E,'rank-one witness',scale=fro(M))
 mat(q['changed'],madd(A,E),'perturbed matrix',scale=fro(A)+fro(E));res=sub(mv(q['changed'],v),[z*x for x in v]);vec(q['changedResidual'],res,'actual constructed eigen residual',scale=fro(A)+fro(E)+abs(z))
 close(q['perturbationNorm'],fro(E),'actual rank-one norm',scale=fro(E));close(q['attainmentGap'],abs(fro(E)-q['svd']['min']),'do not conceal attainment rounding',scale=fro(M))
def verify_eig2(e,A):
 size=fro(A);mat(e['A'],A,'symmetric eig input',scale=size)
 with localcontext()as ctx:
  ctx.prec=80;a,b,d=D(A[0][0]),D(A[0][1]),D(A[1][1]);c=(a+d)/2;rad=(((a-d)/2)**2+b*b).sqrt();values=[float(c+rad),float(c-rad)]
 vec(e['values'],values,'Decimal symmetric eigenvalues',scale=size)
 close(e['center'],A[0][0]/2+A[1][1]/2,'actual center',scale=size);close(e['radius'],math.hypot(A[0][0]/2-A[1][1]/2,A[0][1]),'actual spectral radius about center',scale=size)
 ck(e['simple']==(A[0][0]!=A[1][1]or A[0][1]!=0),'exact scalar degeneracy')
 mat(mm(e['vectors'],tr(e['vectors'])),eye(2),'orthogonal eigenbasis')
 for value,v,res in zip(e['values'],e['vectors'],e['residuals']):
  vec(res,sub(mv(A,v),[value*x for x in v]),'stored actual eig residual',scale=size)
  ck(norm(res)<=4e-13*size,'actual eig quality')
def check_perturbation(s,p):
 scale=10**s['scaleExponent'];c,si=unit(2*s['axisAngle']);h=s['gap']/2
 A=mul([[s['center']+h*c,h*si],[h*si,s['center']-h*c]],scale)
 c,si=unit(2*s['perturbAngle']);h=s['epsilon'];requested=mul([[h*c,h*si],[h*si,-h*c]],scale)
 mat(p['A'],A,'specified symmetric input',scale=fro(A));mat(p['requestedE'],requested,'requested perturbation',scale=fro(requested))
 mat(p['B'],madd(p['A'],p['requestedE']),'actual B formation',scale=fro(A)+fro(requested));mat(p['E'],msub(p['B'],p['A']),'actual matrix perturbation',scale=fro(A)+fro(requested))
 A,B,E=p['A'],p['B'],p['E'];size=fro(A)+fro(B);close(p['formationGap'],fro(msub(E,p['requestedE'])),'formation loss',scale=size)
 for key,M in [('ae',A),('be',B),('ee',E)]:verify_eig2(p[key],M)
 eta=max(abs(x)for x in p['ee']['values']);gap=2*p['ae']['radius'];resolution=64*sys.float_info.epsilon*size
 close(p['eta'],eta,'actual operator perturbation',scale=fro(E));close(p['gap'],gap,'actual gap',scale=size);close(p['resolution'],resolution,'explicit nonrigorous diagnostic scale',scale=resolution)
 ck(len(p['comparisons'])==2,'both directions')
 for i,r in enumerate(p['comparisons']):
  v=r['v'];value=p['be']['values'][i];original=p['ae']['values'][i];other=1-i;both=p['ae']['simple']and p['be']['simple']
  ck(r['i']==i,'ordered index');close(r['value'],value,'ordered changed eigenvalue',scale=size);close(r['originalValue'],original,'ordered original eigenvalue',scale=size);close(r['deviation'],abs(value-original),'absolute change',scale=size)
  ck(r['deviation']<=eta+3e-13*size,'Weyl within arithmetic');vec(v,p['be']['vectors'][i],'changed direction')
  shifted=[[x-(value if j==k else 0)for k,x in enumerate(row)]for j,row in enumerate(A)];mat(r['shifted'],shifted,'shift first',scale=size)
  res=mv(shifted,v);vec(r['residual'],res,'shifted matrix action',scale=size);close(r['residualNorm'],norm(res),'residual norm',scale=size);Ev=mv(E,v);vec(r['Ev'],Ev,'actual E action',scale=fro(E))
  vec(r['residualIdentity'],[a+b for a,b in zip(res,Ev)],'finite precision identity defect',scale=size)
  sep=abs(value-p['ae']['values'][other]);close(r['separation'],sep,'specified other spectral distance',scale=size)
  c=dot(p['ae']['vectors'][other],v);projected=dot(p['ae']['vectors'][other],res)
  close(r['projected'],projected,'projected actual residual',scale=size);close(r['identityLeft'],(p['ae']['values'][other]-value)*c,'projected ideal eigen identity',scale=size)
  P=[[x*y for y in v]for x in v];u=p['ae']['vectors'][i];P0=[[x*y for y in u]for x in u]
  mat(r['P'],P,'changed projector');mat(r['P0'],P0,'original projector');mat(r['projectorDifference'],msub(P,P0),'projector difference')
  if not both:ck(all(r[k]is None for k in ['sinAngle','angle','rawBound','bound','gapBound','projectorFro']),'multiple direction not invented')
  else:
   sine=abs(c);close(r['sinAngle'],sine,'unsigned direction angle');close(r['angle'],math.atan2(sine,abs(dot(u,v))),'actual acute angle');close(r['projectorFro'],fro(msub(P,P0)),'actual projector Frobenius norm')
   close(r['projectorFro'],math.sqrt(2)*sine,'rank-one projector geometry')
   if sep>0:close(r['rawBound'],norm(res)/sep,'unmodified raw reading')
   else:ck(r['rawBound']is None,'zero division absent')
   if sep>resolution:close(r['bound'],(norm(res)+resolution)/(sep-resolution),'stated diagnostic, not interval proof')
   else:ck(r['bound']is None,'unresolved estimate omitted')
   if gap>2*resolution and eta<gap/2:close(r['gapBound'],eta/(gap-eta),'small perturbation gap estimate')
   else:ck(r['gapBound']is None,'gap assumptions required')
  ck(r['resolved']==(both and sep>resolution),'honest numerical resolution status');close(r['resolution'],resolution,'per-row resolution',scale=resolution)
def check_gershgorin(s,p):
 scale=10**s['scaleExponent'];A=mul([[s['d1'],s['coupling'],0],[s['coupling'],s['d2'],s['coupling']],[0,s['coupling'],s['d3']]],scale);size=fro(A)
 mat(p['A'],A,'three-dimensional chain',scale=size)
 disks=p['disks'];ck(len(disks)==3 and len(p['edges'])==3,'all rows and edges')
 for i,d in enumerate(disks):
  ck(d['i']==i,'disk index');close(d['center'],A[i][i],'disk center',scale=size)
  radius=sum(abs(F(x))for j,x in enumerate(A[i])if j!=i);close(d['radius'],float(radius),'exact row radius',scale=size)
 for e in p['edges']:
  a,b=[disks[i]for i in [e['i'],e['j']]];gap=abs(F(a['center'])-F(b['center']))-F(a['radius'])-F(b['radius']);sign=(gap>0)-(gap<0)
  ck(e['exactSign']==sign and e['connected']==(sign<=0),'closed disks exact dyadic comparison')
  close(e['separation'],abs(a['center']-b['center'])-a['radius']-b['radius'],'displayed separation',scale=size)
 unseen=set(range(3));components=[]
 while unseen:
  group={min(unseen)};changed=True
  while changed:
   old=set(group)
   for e in p['edges']:
    if e['connected']and(e['i']in group or e['j']in group):group.update([e['i'],e['j']])
   changed=group!=old
  components.append(sorted(group));unseen-=group
 ck([g['indices']for g in p['groups']]==components,'independent component search')
 for g in p['groups']:
  ck(g['theoremCount']==len(g['indices']),'theorem multiplicity from disk count')
  close(g['lower'],min(disks[i]['center']-disks[i]['radius']for i in g['indices']),'component lower',scale=size)
  close(g['upper'],max(disks[i]['center']+disks[i]['radius']for i in g['indices']),'component upper',scale=size)
 for i,v in enumerate(p['dominance']):
  gap=abs(F(A[i][i]))-sum(abs(F(x))for j,x in enumerate(A[i])if j!=i);ck(v['strict']==(gap>0),'exact strict dominance')
  close(v['margin'],abs(A[i][i])-disks[i]['radius'],'dominance displayed margin',scale=size)
 ck(p['strictlyDominant']==all(v['strict']for v in p['dominance']),'all rows required')
 eig=p['eig'];T=A;Q=eye(3);threshold=64*sys.float_info.epsilon*size;budget=0
 close(eig['threshold'],threshold,'Jacobi threshold',scale=threshold)
 for step,r in enumerate(eig['records']):
  mat(r['before'],T,'connected Jacobi input',scale=size);mat(r['Qbefore'],Q,'connected Jacobi basis');T=r['before'];Q=r['Qbefore']
  p0,q0=max([(0,1),(0,2),(1,2)],key=lambda ij:abs(T[ij[0]][ij[1]]));ck([r['step'],r['p'],r['q']]==[step,p0,q0],'maximum pivot and step')
  off=math.sqrt(2)*math.hypot(T[0][1],T[0][2],T[1][2]);close(r['off'],off,'full off-diagonal norm',scale=size);ck(off>threshold,'actual stopping rule')
  tau=(T[q0][q0]-T[p0][p0])/(2*T[p0][q0]);t=(1 if tau>=0 else-1)/(abs(tau)+math.hypot(1,tau));c=1/math.hypot(1,t);si=t*c
  vec([r['tau'],r['t'],r['c'],r['s']],[tau,t,c,si],'Jacobi coefficients')
  J=eye(3);J[p0][p0]=J[q0][q0]=c;J[p0][q0]=si;J[q0][p0]=-si;mat(r['J'],J,'actual rotation')
  raw=mm(mm(tr(J),T),J);mat(r['raw'],raw,'full similarity rotation',scale=size)
  raw=r['raw'];after=[row[:]for row in raw]
  for i in range(3):
   for j in range(i+1,3):after[i][j]=after[j][i]=(raw[i][j]+raw[j][i])/2
  after[p0][q0]=after[q0][p0]=0
  mat(r['after'],after,'documented symmetrization and truncation',scale=size);mat(r['correction'],msub(after,raw),'explicit correction',scale=size)
  Q=mm(Q,J);mat(r['Q'],Q,'accumulated basis');Q=r['Q'];T=r['after'];budget+=fro(r['correction'])
 mat(eig['T'],T,'final projected matrix',scale=size);mat(eig['Q'],Q,'final basis')
 close(eig['correctionBudget'],budget,'sum actual modifications',scale=size);close(eig['orthogonality'],fro(msub(mm(tr(Q),Q),eye(3))),'actual basis defect')
 close(eig['similarity'],fro(msub(T,mm(mm(tr(Q),A),Q))),'actual similarity defect',scale=size)
 off=math.sqrt(2)*math.hypot(T[0][1],T[0][2],T[1][2])
 if eig['status']=='iteration-budget':ck(len(eig['records'])==100,'budget used')
 else:ck(eig['status']==('exact-diagonal'if off==0 else'off-diagonal-threshold')and off<=threshold,'actual final status')
 order=sorted(range(3),key=lambda i:T[i][i])
 ck(len(p['pairs'])==3,'three computed pairs')
 for q,i in zip(p['pairs'],order):
  value=T[i][i];v=[r[i]for r in Q];res=sub(mv(A,v),[value*x for x in v])
  close(q['value'],value,'sorted final value',scale=size);vec(q['v'],v,'actual Ritz direction');vec(q['residual'],res,'actual eigen residual',scale=size)
  close(q['residualNorm'],norm(res),'actual residual norm',scale=size);close(q['radius'],norm(res)/norm(v),'residual spectral radius',scale=size)
  ck(norm(res)<=5e-13*size,'independent pair quality')
  vec(q['margins'],[d['radius']-abs(value-d['center'])for d in disks],'actual disk margins',scale=size)
  groups=[j for j,g in enumerate(p['groups'])if value+q['radius']>=g['lower']and value-q['radius']<=g['upper']]
  ck(q['groups']==groups,'sample grouping with actual residual radius')
 close(sum(q['value']for q in p['pairs']),sum(A[i][i]for i in range(3)),'trace invariant',scale=size)
 close(sum(q['value']**2 for q in p['pairs']),sum(x*x for row in A for x in row),'symmetric quadratic trace',scale=size*size)
 ck(p['negativeCount']==sum(g['theoremCount']for g in p['groups']if g['upper']<0),'negative region count')
 ck(p['positiveCount']==sum(g['theoremCount']for g in p['groups']if g['lower']>0),'positive region count')
def science(d):
 s,p=d['config'],d['result']
 if s['mode']=='transient':check_transient(s,p);return
 if s['mode']=='perturbation':
  check_perturbation(s,p);values=sorted(set([i/10 for i in range(21)]+[s['epsilon']]))
  ck([v['epsilon']for v in d['study']]==values,'complete parameter scan including selected point')
  for v in d['study']:check_perturbation({**s,'epsilon':v['epsilon']},v['result'])
 else:
  check_gershgorin(s,p);ck([v['t']for v in d['study']]==[i/10 for i in range(11)],'full declared homotopy mesh')
  for v in d['study']:check_gershgorin({**s,'coupling':s['coupling']*v['t']},v['result'])
STATE={'decay':'渐近衰减','growth':'指数增长','bounded-nondecaying':'有界但不衰减','polynomial-growth':'多项式增长','invertible':'逆矩阵存在','spectral-point':'谱点：逆不存在','convergent':'Neumann收敛','not-convergent':'Neumann不收敛','undefined-at-zero':'z=0：有限和不定义','exact-diagonal':'浮点非对角恰为0','off-diagonal-threshold':'非对角达到阈值','iteration-budget':'预算结束'}
def col(x):return[[v]for v in x]
def entries(a):return[[k,i,j,x]for k,A in a.items()for i,r in enumerate(A)for j,x in enumerate(r)]
def verify_views(d):
 s,p=d['config'],d['result'];rows={};wanted=[];lines={}
 if s['mode']=='transient':
  wanted=[{}, {}, {}, {}, {}];rs=p['rows']
  for key in ['envelope','selected','normal']:wanted[0][key]=[[r['j'],r[key]]for r in rs];lines[0,key]=True
  wanted[1]['rootGain']=[[r['j'],r['rootGain']]for r in rs if r['rootGain']is not None];wanted[1]['rho']=[[0,p['rho']],[max(1,s['k']),p['rho']]];lines[1,'rootGain']=lines[1,'rho']=True
  wanted[2]['partialNorm']=[[r['j'],r['partialNorm']]for r in rs if r['partialNorm']is not None];wanted[2]['inverse']=[]if p['resolvent']['norm']is None else[[0,p['resolvent']['norm']],[max(1,s['k']),p['resolvent']['norm']]];lines[2,'partialNorm']=lines[2,'inverse']=True
  for key in ['remainderNorm','identityGap','remainderGap']:wanted[3][key]=[[r['j'],math.log10(r[key])]for r in rs if r[key]is not None and r[key]>0]
  wanted[4]['closedGap']=[[r['j'],math.log10(r['closedGap'])]for r in rs if r['closedGap']>0]
  q=p['resolvent']
  summary=[s['r'],s['g'],s['k'],s['theta'],p['rho'],STATE[p['asymptotic']],p['normal'],p['diagonalizable'],p['nonNormality'],p['selectedPeak'],p['envelopePeak'],s['z'],STATE[q['status']],STATE[q['neumann']]]
  rows['input']=entries({'A':p['A'],'x0':col(p['x0']),'shifted':q['M']})
  rows['trace']=[[r['j'],r['selected'],r['normal'],r['envelope'],r['svd']['min'],r['rootGain'],r['closedGap'],r['partialNorm'],r['remainderNorm'],r['identityGap'],r['remainderGap']]for r in rs]
  rows['powers']=[];rows['neumann']=[]
  for r in rs:
   rows['powers'].extend([[r['j'],*v]for v in entries({'before':r['before'],'P':r['P'],'closed':r['closed'],'x':col(r['x']),'maxDirection':col(r['svd']['vMax']),'minDirection':col(r['svd']['vMin']),'maxImage':col(r['svd']['maxImage']),'minImage':col(r['svd']['minImage'])})])
   rows['neumann'].extend([[r['j'],*v]for v in entries({k:r[k]for k in ['term','sum','identityResidual','tail','remainder','remainderPredicted']if r[k]is not None})])
  rows['resolvent']=[[key,v]for key,v in zip(['逆矩阵范数','移位矩阵最大奇异值','移位矩阵最小奇异值','实际扰动范数','达到最小值的浮点差距','构造后残差'],[q['norm'],q['svd']['max'],q['svd']['min'],q['perturbationNorm'],q['attainmentGap'],norm(q['changedResidual'])])]
  a={'inverse':q['inverse']}if q['inverse']is not None else{}
  a.update(v=col(q['v']),Ev=col(q['Ev']),E=q['E'],changed=q['changed'],changedResidual=col(q['changedResidual']));rows['witness']=entries(a)
 elif s['mode']=='perturbation':
  wanted=[{}, {}, {}, {}]
  for i in range(2):
   wanted[0]['e'+str(i)]=[[v['epsilon'],v['result']['be']['values'][i]/p['scale']]for v in d['study']]
   for sign,key in [(1,'upper'),(-1,'lower')]:wanted[0][key+str(i)]=[[v['epsilon'],(v['result']['ae']['values'][i]+sign*v['result']['eta'])/p['scale']]for v in d['study']]
   for key in ['e','upper','lower']:lines[0,key+str(i)]=True
   for key,field in [('angle','sinAngle'),('gap','gapBound')]:wanted[1][key+str(i)]=[[v['epsilon'],v['result']['comparisons'][i][field]]for v in d['study']if v['result']['comparisons'][i][field]is not None]
  for key,field in [('angle','sinAngle'),('raw','rawBound'),('buffered','bound')]:wanted[2][key]=[[v['epsilon'],v['result']['comparisons'][0][field]]for v in d['study']if v['result']['comparisons'][0][field]is not None]
  wanted[3]['formation']=[[v['epsilon'],math.log10(v['result']['formationGap']/p['scale'])]for v in d['study']if v['result']['formationGap']>0]
  wanted[3]['eigen']=[[v['epsilon'],math.log10(fro(v['result']['be']['residuals'])/p['scale'])]for v in d['study']if fro(v['result']['be']['residuals'])>0]
  summary=[p['scale'],s['gap']*p['scale'],p['gap'],s['epsilon']*p['scale'],p['eta'],p['formationGap'],p['resolution'],p['ae']['simple'],p['be']['simple'],'浮点诊断，非区间证书']
  def matrices(v):
   a={k:v[k]for k in ['A','requestedE','B','E']}
   for k in ['ae','be','ee']:a[k+'Vectors']=tr(v[k]['vectors']);a[k+'Residuals']=tr(v[k]['residuals'])
   return entries(a)
  def dirs(v,label):return[[label,r['i'],r['originalValue'],r['value'],r['deviation'],r['residualNorm'],r['separation'],r['sinAngle'],r['rawBound'],r['bound'],r['gapBound'],r['resolution'],r['resolved'],r['projectorFro']]for r in v['comparisons']]
  def vectors(v):return[[r['i'],*z]for r in v['comparisons']for z in entries({'v':col(r['v']),'shifted':r['shifted'],'residual':col(r['residual']),'Ev':col(r['Ev']),'identity':col(r['residualIdentity']),'P':r['P'],'P0':r['P0'],'difference':r['projectorDifference']})]
  rows['input']=matrices(p);rows['directions']=dirs(p,s['epsilon']);rows['vectors']=vectors(p)
  rows['scan']=[r for v in d['study']for r in dirs(v['result'],v['epsilon'])]
  rows['scan-matrices']=[[v['epsilon'],*r]for v in d['study']for r in matrices(v['result'])]
  rows['scan-vectors']=[[v['epsilon'],*r]for v in d['study']for r in vectors(v['result'])]
 else:
  wanted=[{}, {}, {}]
  for i,q in enumerate(p['disks']):
   wanted[0]['disk'+str(i)]=[[q['center']/p['scale']+q['radius']/p['scale']*unit(j*3)[0],q['radius']/p['scale']*unit(j*3)[1]]for j in range(121)]
   lines[0,'disk'+str(i)]=True
  wanted[0]['eigen']=[[q['value']/p['scale'],0]for q in p['pairs']]
  for i in range(3):wanted[1]['eigen'+str(i)]=[[v['t'],v['result']['pairs'][i]['value']/p['scale']]for v in d['study']];lines[1,'eigen'+str(i)]=True
  wanted[2]['residual']=[[v['t'],math.log10(norm([x for q in v['result']['pairs']for x in q['residual']])/p['scale'])]for v in d['study']if norm([x for q in v['result']['pairs']for x in q['residual']])>0]
  wanted[2]['similarity']=[[v['t'],math.log10(v['result']['eig']['similarity']/p['scale'])]for v in d['study']if v['result']['eig']['similarity']>0]
  summary=[p['scale'],len(p['groups']),p['strictlyDominant'],p['negativeCount'],p['positiveCount'],STATE[p['eig']['status']],len(p['eig']['records']),p['eig']['orthogonality'],p['eig']['similarity'],p['eig']['correctionBudget']]
  rows['input']=entries({'A':p['A'],'T':p['eig']['T'],'Q':p['eig']['Q']})
  rows['disks']=[[i,v['center'],v['radius'],v['center']-v['radius'],v['center']+v['radius'],p['dominance'][i]['margin'],p['dominance'][i]['strict']]for i,v in enumerate(p['disks'])]
  rows['edges']=[[v['i'],v['j'],v['separation'],v['exactSign'],v['connected']]for v in p['edges']]
  rows['groups']=[[i,','.join(map(str,v['indices'])),v['lower'],v['upper'],v['theoremCount']]for i,v in enumerate(p['groups'])]
  for k in ['spectra','vectors','rotations','rotation-matrices']:rows[k]=[]
  for current,t,v in [(True,1,p)]+[(False,z['t'],z['result'])for z in d['study']]:
   for i,q in enumerate(v['pairs']):
    rows['spectra'].append([current,t,i,q['value'],q['residualNorm'],q['radius'],','.join(map(str,q['groups']))])
    rows['vectors'].extend([[current,t,i,j,x,q['residual'][j]]for j,x in enumerate(q['v'])])
   for q in v['eig']['records']:
    rows['rotations'].append([current,t,*[q[k]for k in ['step','p','q','off','threshold','tau','t','c','s']]])
    rows['rotation-matrices'].extend([[current,t,q['step'],*z]for z in entries({k:q[k]for k in ['before','Qbefore','J','raw','correction','after','Q']})])
  rows['homotopy-matrices']=[[v['t'],*z]for v in d['study']for z in entries({'A':v['result']['A'],'T':v['result']['eig']['T'],'Q':v['result']['eig']['Q'],'disks':[[q['center'],q['radius']]for q in v['result']['disks']]})]
 ck(len(d['plots'])==len(wanted)==len(d['svgs']),'all graphs')
 ns={'s':'http://www.w3.org/2000/svg'}
 for index,(q,expected,svg)in enumerate(zip(d['plots'],wanted,d['svgs'])):
  ck([v['key']for v in q['series']]==list(expected),'ordered semantic series')
  root=ET.fromstring(svg);ck(root.find('s:title',ns).text==q['title']and root.get('aria-label')==q['title'],'accessible title')
  if s['mode']=='gershgorin'and index==0:
   disks=p['disks'];cs=[v['center']/p['scale']for v in disks];rs=[v['radius']/p['scale']for v in disks];left=min(c-r for c,r in zip(cs,rs));right=max(c+r for c,r in zip(cs,rs));mid=(left+right)/2;h=max(1,*rs,(right-left)/6)*1.12
   vec([q['xmin'],q['xmax'],q['ymin'],q['ymax']],[mid-3*h,mid+3*h,-h,h],'complex plane fixed units')
   close(750/(q['xmax']-q['xmin']),250/(q['ymax']-q['ymin']),'equal real/imag units')
  else:
   vals=[v[1]for line in expected.values()for v in line]
   if not q['y'].startswith('log₁₀'):vals.append(0)
   lo=min(vals)if vals else 0;hi=max(vals)if vals else 0;pad=(hi-lo or 1)*.08
   close(q['ymin'],lo-pad,'actual lower data extent',atol=1e-12);close(q['ymax'],hi+pad,'actual upper data extent',atol=1e-12)
   ck(q['xmin']==0 and q['xmax']==(max(1,s['k'])if s['mode']=='transient'else 2 if s['mode']=='perturbation'else 1),'declared x axis')
  xf=lambda x:100+750*(x-q['xmin'])/(q['xmax']-q['xmin']);yf=lambda y:335-250*(y-q['ymin'])/(q['ymax']-q['ymin'])
  for line in q['series']:
   points=expected[line['key']];ck(len(line['points'])==len(points),'all actual plotted points');ck(line['line']==lines.get((index,line['key']),False),'line policy across undefined values')
   nodes=root.findall('.//s:circle[@data-series="'+line['key']+'"]',ns);ck(len(nodes)==len(points),'complete SVG markers')
   poly=root.find('.//s:polyline[@data-series="'+line['key']+'"]',ns);ck((poly is not None)==line['line'],'polyline presence')
   coords=[list(map(float,x.split(',')))for x in poly.get('points').split()]if poly is not None else None
   if coords is not None:ck(len(coords)==len(points),'all polyline positions')
   for i,(actual,(x,y),node)in enumerate(zip(line['points'],points,nodes)):
    vec(actual,[x,y],'model to graph',atol=3e-12)
    ck(q['xmin']<=x<=q['xmax']and q['ymin']<=y<=q['ymax'],'unclipped point');ck(node.get('data-index')==str(i),'marker order')
    vec([float(node.get('cx')),float(node.get('cy'))],[xf(x),yf(y)],'actual SVG coordinates',atol=1e-9,rtol=0)
    if coords is not None:vec(coords[i],[xf(x),yf(y)],'actual polyline coordinate',atol=1e-9,rtol=0)
 tables={t['key']:t for t in d['ledgers']};ck(set(tables)==set(rows)|{'summary'},'complete ledgers')
 def cell(a,b):
  if type(b)in [int,float]:close(a,b,'displayed number',rtol=3e-15,atol=1e-28)
  else:ck(a==b,'displayed exact cell')
 ck(len(tables['summary']['rows'])==len(summary),'summary size')
 for r,v in zip(tables['summary']['rows'],summary):cell(r[1],v)
 for key,expected in rows.items():
  actual=tables[key]['rows'];ck(len(actual)==len(expected),'full ledger '+key)
  for a,b in zip(actual,expected):
   ck(len(a)==len(b),'full row width')
   for x,y in zip(a,b):cell(x,y)
 for t in tables.values():ck(all(len(r)==len(t['headers'])for r in t['rows']),'headers fit every row')
for d in data['states']:
 science(d)
 if 'plots'in d:verify_views(d)
ck(data['invalid']==222 and data['self']=={'status':'PASS','checks':12},'guards and built-in tests')
print(json.dumps(dict(status='PASS',stage='science-and-views',states=len(data['states']),checks=checks,invalid=data['invalid'],self=data['self'])))

# Publication contract146
if len(sys.argv)==1:
 from html.parser import HTMLParser
 fixture=ROOT/'course-shared/projects/matrix-norms/run-snapshot.json'
 frozen=json.loads(fixture.read_text());ck(frozen['schema']==1,'snapshot schema')
 provenance=frozen['provenance']
 ck(provenance['labSha256']==hashlib.sha256(JS.read_bytes()).hexdigest(),'snapshot exact implementation')
 ck(provenance['runtime']=='v24.14.0'and provenance['platform']=='darwin'and provenance['arch']=='arm64'and provenance['capturedOn']=='2026-09-11','snapshot environment')
 ck((ROOT/'grad-math/site/assets/learning/projects/matrix-norms/run-snapshot.json').read_bytes()==fixture.read_bytes(),'snapshot public byte identity')
 for key,mode in [('transient','transient'),('divergent','transient'),('perturbation','perturbation'),('disks','gershgorin')]:
  ck(frozen[key]['config']['mode']==mode,'snapshot named mode');science(frozen[key])
 ck(frozen['transient']['config']['k']==30 and frozen['transient']['config']['r']==.9 and frozen['transient']['config']['g']==10 and frozen['divergent']['config']['g']==0 and frozen['divergent']['config']['z']==.5 and frozen['divergent']['config']['k']==8 and frozen['perturbation']['config']['gap']==1 and frozen['perturbation']['config']['epsilon']==.1 and frozen['disks']['config']['coupling']==1,'static named inputs')
 src=(ROOT/'grad-math/lectures/ma-01-norms-perturbation.md').read_text();site=(ROOT/'grad-math/site/ma-01-norms-perturbation.html').read_text()
 formulas=[(a or b).strip()for a,b in re.findall(r'\$\$(.*?)\$\$|(?<!\\)\$(?!\$)(.*?)(?<!\\)\$(?!\$)',src,re.S)]
 actual=[html.unescape(a or b).strip()for a,b in re.findall(r'<(?:span|div) class="arithmatex">(?:\\\((.*?)\\\)|\\\[(.*?)\\\])</(?:span|div)>',site,re.S)]
 ck(formulas==actual,'all formulas preserved');ck(all('<'not in v for v in formulas),'math HTML ambiguity absent')
 ck(not re.search(r'<p>\s*<details|</details>\s*</p>',site),'balanced paragraphs')
 class Disclosure(HTMLParser):
  def __init__(self):super().__init__();self.stack=[];self.answers=0
  def handle_starttag(self,tag,attrs):
   if tag=='details':
    ck(not self.stack,'no nested disclosure');kind=dict(attrs).get('class');ck(kind in ['answer','page-toc'],'known disclosure');self.stack.append([kind,0]);self.answers+=kind=='answer'
   if tag=='summary':ck(bool(self.stack),'summary owned');self.stack[-1][1]+=1
  def handle_endtag(self,tag):
   if tag=='details':ck(bool(self.stack),'no orphan close');ck(self.stack.pop()[1]==1,'one summary')
 p=Disclosure();p.feed(re.search(r'<article[^>]*>(.*?)</article>',site,re.S).group(1));ck(p.answers==4 and not p.stack,'four answers')
 for link in re.findall(r'(?:href|src)="([^"]+)"',site):
  target=link.split('#')[0].split('?')[0]
  if target and not re.match(r'^[a-zA-Z]+:',target)and not target.startswith('/'):ck((ROOT/'grad-math/site'/target).exists(),('local target',target))
 for course in ['ai-course','grad-math','math-course']:ck((ROOT/course/'site/assets/learning/labs/non-normal-transient.js').read_bytes()==JS.read_bytes(),'tracked mirror')
 ck((ROOT/'.github/workflows/course-audit.yml').read_text().count('python tools/check_matrix_norm_full.py')==1,'CI invocation')
 image=ROOT/'grad-math/images/ma-01-norm-ledgers.svg'
 ck(image.read_bytes()==(ROOT/'grad-math/site/assets/img/ma-01-norm-ledgers.svg').read_bytes(),'SVG mirror')
 panels=ET.parse(image).getroot().findall('.//{http://www.w3.org/2000/svg}svg');ck(len(panels)==4,'four static panels')
 code="const a=require(process.argv[1]),f=JSON.parse(require('fs').readFileSync(process.argv[2],'utf8'));console.log(JSON.stringify([a.plots(f.transient)[0],a.plots(f.divergent)[2],a.plots(f.perturbation)[1],a.plots(f.disks)[0]].map(a.svg)))"
 expected=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve()),str(fixture)],text=True))
 # Math transcendental results can differ by a few ulps across Node/CPU builds.
 # Compare every SVG node and attribute, allowing only sub-nanopixel geometry
 # differences. Text, labels, series identities and point counts remain exact.
 def compare_svg(a,b,path='svg'):
  ck(a.tag==b.tag and set(a.attrib)==set(b.attrib),('static structure',path))
  ck(a.text==b.text and a.tail==b.tail,('static text',path,a.text,b.text))
  for key,v in a.attrib.items():
   w=b.attrib[key]
   if key in {'x','y','x1','x2','y1','y2','cx','cy','r','width','height'}:
    close(float(v),float(w),('static coordinate',path,key),rtol=0,atol=1e-9)
   elif key in {'points','d'}:
    pattern=r'[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?'
    ck(re.sub(pattern,'#',v)==re.sub(pattern,'#',w),('static geometry syntax',path,key))
    av=re.findall(pattern,v);bv=re.findall(pattern,w)
    ck(len(av)==len(bv),('static geometry length',path,key))
    for j,(x,y) in enumerate(zip(av,bv)):
     close(float(x),float(y),('static geometry value',path,key,j),rtol=0,atol=1e-9)
   else:ck(v==w,('static attribute',path,key,v,w))
  ck(len(a)==len(b),('static child count',path))
  for j,(x,y) in enumerate(zip(a,b)):compare_svg(x,y,path+'/'+str(j))
 for i,(p,s) in enumerate(zip(panels,expected)):
  e=ET.fromstring(s);p.attrib.pop('x');p.attrib.pop('y')
  compare_svg(p,e,'panel'+str(i))
 # The comparator must accept an ulp-scale coordinate change and reject
 # substantive geometry, missing points, or an altered instructional label.
 original=ET.fromstring('<svg><text x="10">target</text><polyline points="1,2 3,4"/></svg>')
 tiny=ET.fromstring(ET.tostring(original));tiny[0].set('x','10.000000000000002');compare_svg(original,tiny)
 for mutation in ['coordinate','point','label','attribute','node']:
  changed=ET.fromstring(ET.tostring(original))
  if mutation=='coordinate':changed[0].set('x','10.000001')
  elif mutation=='point':changed[1].set('points','1,2')
  elif mutation=='label':changed[0].text='wrong target'
  elif mutation=='attribute':changed[1].set('stroke','red')
  else:changed.remove(changed[1])
  rejected=False
  try:compare_svg(original,changed)
  except AssertionError:rejected=True
  ck(rejected,('static comparator negative control',mutation))
 table=re.search(r'data-learning-lab="non-normal-transient".*?<tbody>(.*?)</tbody>',site,re.S).group(1)
 vals=[float(html.unescape(x))for x in re.findall(r'<tr>\s*<td>.*?</td>\s*<td[^>]*>(.*?)</td>\s*</tr>',table,re.S)]
 p=frozen['transient']['result'];q=frozen['divergent']['result'];v=frozen['perturbation']['result'];g=frozen['disks']['result']
 refs=[p['rho'],p['rows'][1]['selected'],p['rows'][p['envelopePeak']]['envelope'],p['envelopePeak'],p['final']['selected'],q['resolvent']['norm'],q['final']['partialNorm'],q['final']['remainderNorm'],v['eta'],v['comparisons'][0]['deviation'],v['comparisons'][0]['sinAngle'],v['comparisons'][0]['gapBound'],*[x['radius']for x in g['disks']],g['negativeCount'],g['positiveCount'],max(x['residualNorm']for x in g['pairs'])]
 ck(len(vals)==len(refs)==18,'all fallback numbers')
 for x,y in zip(vals,refs):close(x,y,'frozen fallback value',rtol=2e-11,atol=1e-28)
 ck('run-snapshot.json' in site and '30步窗口' in site and 'Neumann级数不收敛' in site,'readable snapshot and stop conditions')
 print('formulas',len(formulas))
print(json.dumps(dict(status='PASS',checks=checks,states=len(data['states']),invalid=data['invalid'],self=data['self'])))
