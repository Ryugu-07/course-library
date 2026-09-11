"""Independent exact identities, floating traces and complete view mappings."""
from pathlib import Path
from fractions import Fraction as F
from decimal import Decimal as D,localcontext
import subprocess,shutil,json,math,sys,re,html,hashlib,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/matrix-order-functions.js'
code=r'''
const a=require(process.argv[1]),cs=[...a.PRESETS];let invalid=0;
for(const delta of [0,1e-12,.1,2])for(const t of [0,1e-15,.3,2])for(const scaleExponent of [-6,6])cs.push({delta,t,scaleExponent,shear:-3,stretch:.2,theta:-90});
for(const delta of [0,1e-12,.1,2])for(const t of [0,1e-15,.1,2])for(const weight of [0,.5,1])cs.push({mode:"functions",delta,t,weight});
for(const a2 of [-1,0,1e-12,2])for(const b2 of [0,1])for(const c of [0,3])for(const scaleExponent of [-6,6])cs.push({mode:"schur",a2,b2,c,scaleExponent});
for(const [c,keys]of [[{},["t","delta","shear","stretch","theta","scaleExponent"]],[{mode:"functions"},["t","delta","weight"]],[{mode:"schur"},["a1","a2","b1","b2","c","scaleExponent"]]]){
 for(const k of keys)for(const v of ["",null,true,false,[],{},NaN,Infinity,-Infinity,"0x10","2x","1e309","1e-400"]){
  let bad=false;try{a.config({...c,[k]:v});}catch(e){bad=true;}if(!bad)throw Error("invalid "+k);invalid++;
 }
}
for(const c of [null,[],{mode:"x"},{t:-1},{delta:3},{shear:4},{stretch:3},{theta:181},{scaleExponent:6.5},{t:1e-16},{mode:"functions",weight:2},{mode:"functions",delta:1e-15},{mode:"schur",a1:1e-15},{mode:"schur",a2:5},{mode:"schur",c:5}]){
 let bad=false;try{a.config(c);}catch(e){bad=true;}if(!bad)throw Error("boundary");invalid++;
}
a.snapshot({mode:"schur",delta:"",t:null,weight:[]});a.snapshot({mode:"functions",a1:null,scaleExponent:"",theta:NaN});a.snapshot({weight:null,c:[],a1:""});
console.log(JSON.stringify({invalid,self:a.selfTest(),states:cs.map((c,i)=>{const d=a.snapshot(c);return i<a.PRESETS.length?{...d,plots:a.plots(d),ledgers:a.ledgers(d),svgs:a.plots(d).map(a.svg)}:d;})}));
'''
data=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve())],text=True),parse_int=float);checks=0
def ck(v,m):
 global checks
 assert v,m;checks+=1
def close(a,b,m,scale=1,rtol=5e-12,atol=5e-14):
 b=float(b);ck(type(a)in[int,float]and math.isfinite(a)and abs(a-b)<=atol*scale+rtol*abs(b),(m,a,b,scale))
def vec(a,b,m,**kw):
 ck(len(a)==len(b),m+' length')
 for x,y in zip(a,b):close(x,y,m,**kw)
def mat(a,b,m,**kw):
 ck(len(a)==len(b),m+' rows')
 for x,y in zip(a,b):vec(x,y,m,**kw)
def dot(x,y):return math.fsum(a*b for a,b in zip(x,y))
def norm(x):return math.hypot(*x)
def tr(A):return list(map(list,zip(*A)))
def mm(A,B):return[[dot(r,c)for c in tr(B)]for r in A]
def mv(A,x):return[dot(r,x)for r in A]
def add(A,B):return[[a+b for a,b in zip(r,s)]for r,s in zip(A,B)]
def sub(A,B):return[[a-b for a,b in zip(r,s)]for r,s in zip(A,B)]
def mul(A,c):return[[x*c for x in r]for r in A]
def eye(n):return[[int(i==j)for j in range(n)]for i in range(n)]
def fro(A):return norm([x for r in A for x in r])
def outer(x,y):return[[a*b for b in y]for a in x]
def det(A):
 if len(A)==1:return F(A[0][0])
 return sum(((-1)**j*F(A[0][j])*det([r[:j]+r[j+1:]for r in A[1:]])for j in range(len(A))),F())
def positive(A,p):
 ids=[tuple(i for i in range(len(A))if mask&(1<<i))for mask in range(1,1<<len(A))]
 ck([tuple(q['indices'])for q in p['minors']]==ids,'every principal subset')
 signs=[]
 for q,indices in zip(p['minors'],ids):
  value=det([[A[i][j]for j in indices]for i in indices]);sign=(value>0)-(value<0);signs.append(sign)
  ck(q['sign']==sign,'exact determinant sign');ck(F(int(q['numerator']))*F(2)**int(q['exponent'])==value,'exact determinant complete value')
  close(q['value'],value,'dyadic approximate display',rtol=4e-16,atol=1e-300)
 symmetric=A==tr(A);psd=symmetric and all(v>=0 for v in signs);pd=symmetric and all(signs[ids.index(tuple(range(k))) ]>0 for k in range(1,len(A)+1))
 ck(p['symmetric']==symmetric and p['psd']==psd and p['pd']==pd,'strict definiteness')
 status='not-symmetric'if not symmetric else'positive-definite'if pd else'positive-semidefinite'if psd else'not-positive-semidefinite'
 ck(p['status']==status,'definiteness wording')
def eigen2(A,e):
 with localcontext()as c:
  c.prec=75;a,b,z=map(D,[A[0][0],A[0][1],A[1][1]]);m=(a+z)/2;r=(((a-z)/2)**2+b*b).sqrt();ref=[m+r,m-r]
 scale=max(fro(A),1e-300);vec(e['values'],ref,'independent decimal eigenvalues',scale=scale)
 V=e['vectors'];mat(mm(V,tr(V)),eye(2),'orthonormal vectors',atol=2e-14)
 for i,v in enumerate(V):
  actual=[x-e['values'][i]*y for x,y in zip(mv(A,v),v)]
  vec(e['residuals'][i],actual,'actual residual',scale=scale)
  ck(norm(actual)<=2e-13*scale,'computed eigensolution')
 close(e['orthogonality'],fro(sub(mm(V,tr(V)),eye(2))),'basis defect',atol=2e-15)
 close(e['determinant'],det(A),'det determinant',scale=scale*scale)
 ck(e['simple']==(A[0][0]!=A[1][1]or A[0][1]!=0),'strict multiplicity')
def evidence(A,e):
 mat(e['matrix'],A,'evidence actual matrix');A=e['matrix'];positive(A,e['exact']);eigen2(A,e['eig']);vec(e['witness'],e['eig']['vectors'][1],'negative direction')
 close(e['quadratic'],dot(e['witness'],mv(A,e['witness'])),'actual witness',scale=max(fro(A),1e-300))
def order_check(s,p):
 sc=10**s['scaleExponent'];B=mul([[1+s['delta'],0],[0,s['delta']]],sc);E=mul([[s['t']]*2]*2,sc);A=add(B,E);D0=sub(A,B);A2=mm(A,A);B2=mm(B,B);X=[[1,s['shear']],[0,s['stretch']]];raw=mm(mm(tr(X),D0),X);C=[[raw[i][j]if i==j else(raw[i][j]+raw[j][i])/2 for j in range(2)]for i in range(2)]
 for key,v in [('A',A),('B',B),('requested',E),('D',D0),('A2',A2),('B2',B2),('X',X),('D2',sub(A2,B2)),('rawCongruent',raw),('C',C),('congruenceCorrection',sub(C,raw)),('commutator',sub(mm(A,B),mm(B,A)))]:mat(p[key],v,key,scale=max(sc*sc,sc,1e-30))
 close(p['formationGap'],fro(sub(D0,E)),'formation',scale=sc,atol=1e-15)
 for k in ['A','B']:positive(p[k],p[k+'Proof'])
 for k,A0 in [('order',D0),('square',p['D2']),('congruent',C)]:evidence(A0,p[k])
 ck((p['inverse']is None)==(det(A)==0 or det(B)==0),'actual inverse existence')
 if p['inverse']is not None:
  for name,M in [('A',A),('B',B)]:
   d=det(M);inv=[[F(M[1][1])/d,-F(M[0][1])/d],[-F(M[1][0])/d,F(M[0][0])/d]]
   mat(p['i'+name],inv,'exact rational inverse',scale=1/sc)
   mat(p['inverseDefects'][name],sub(mm(M,p['i'+name]),eye(2)),'actual inverse defect',scale=max(1,fro(M)*fro(p['i'+name])))
  evidence(sub(p['iB'],p['iA']),p['inverse'])
 ck(p['inverseTheorem']==(p['AProof']['pd']and p['BProof']['pd']and p['order']['exact']['psd']),'inverse theorem condition')
 theta=s['theta'];v={0:[1,0],90:[0,1],-90:[0,-1],180:[-1,0],-180:[-1,0]}.get(theta,[math.cos(math.radians(theta)),math.sin(math.radians(theta))])
 vec(p['v'],v,'selected angle');vec(p['Xv'],mv(X,p['v']),'changed direction')
 close(p['quadraticBefore'],dot(p['Xv'],mv(D0,p['Xv'])),'before congruence',scale=sc)
 close(p['quadraticAfter'],dot(p['v'],mv(C,p['v'])),'after congruence',scale=sc)
 ck(len(p['rays'])==181,'all direction samples')
 for j,r in enumerate(p['rays']):
  ck(r['degrees']==j,'direction index');u={0:[1,0],90:[0,1],180:[-1,0]}.get(j,[math.cos(math.radians(j)),math.sin(math.radians(j))]);vec(r['v'],u,'sample direction',atol=2e-15)
  for key,M,z in [('order',D0,sc),('square',p['D2'],sc*sc),('congruent',C,sc)]:close(r[key],dot(r['v'],mv(M,r['v']))/z,'direction '+key)
def jacobi_check(M,e):
 T=[r[:]for r in M];Q=eye(3);sc=max(fro(M),1e-300);threshold=64*2**-52*sc
 close(e['threshold'],threshold,'threshold',scale=sc,atol=1e-15)
 for step,r in enumerate(e['records']):
  mat(r['before'],T,'before',scale=sc);mat(r['Qbefore'],Q,'Qbefore');ck(r['step']==step,'iteration number')
  pair=max([(0,1),(0,2),(1,2)],key=lambda z:abs(T[z[0]][z[1]]));ck(pair==(r['p'],r['q']),'actual largest pivot')
  off=math.sqrt(2)*norm([T[0][1],T[0][2],T[1][2]]);close(r['off'],off,'off-diagonal',scale=sc);ck(off>threshold,'continued only above threshold')
  i,j=pair;tau=(T[j][j]-T[i][i])/(2*T[i][j]);t=(1 if tau>=0 else-1)/(abs(tau)+math.hypot(1,tau));c=1/math.hypot(1,t);s=t*c
  vec([r['tau'],r['t'],r['c'],r['s']],[tau,t,c,s],'rotation scalars')
  J=eye(3);J[i][i]=J[j][j]=c;J[i][j]=s;J[j][i]=-s;mat(r['J'],J,'actual rotation')
  raw=mm(mm(tr(J),T),J);mat(r['raw'],raw,'raw similarity',scale=sc)
  after=[[raw[i][j]if i==j else(raw[i][j]+raw[j][i])/2 for j in range(3)]for i in range(3)];after[pair[0]][pair[1]]=after[pair[1]][pair[0]]=0
  mat(r['after'],after,'symmetric truncation',scale=sc);mat(r['correction'],sub(r['after'],r['raw']),'actual explicit correction',scale=sc)
  T=r['after'];Q=mm(Q,J);mat(r['Q'],Q,'accumulated Q')
 mat(e['T'],T,'final T',scale=sc);mat(e['Q'],Q,'final Q')
 ck(e['status']==('exact-diagonal'if norm([T[0][1],T[0][2],T[1][2]])==0 else'off-diagonal-threshold'),'stop state')
 ck(math.sqrt(2)*norm([T[0][1],T[0][2],T[1][2]])<=threshold,'stopped at threshold')
 for p in e['pairs']:
  v=p['v'];res=[x-p['value']*y for x,y in zip(mv(M,v),v)];vec(p['residual'],res,'actual eigen residual',scale=sc)
  close(p['residualNorm'],norm(res),'residual norm',scale=sc);close(p['radius'],norm(res)/norm(v),'residual radius',scale=sc)
  ck(norm(res)<5e-13*sc,'independent eigensolution')
 close(sum(p['value']for p in e['pairs']),sum(M[i][i]for i in range(3)),'trace invariant',scale=sc)
 close(e['orthogonality'],fro(sub(mm(tr(Q),Q),eye(3))),'basis defect',atol=2e-14)
 close(e['similarity'],fro(sub(T,mm(mm(tr(Q),M),Q))),'similarity defect',scale=sc)
 close(e['correctionBudget'],sum(fro(r['correction'])for r in e['records']),'correction budget',scale=sc)
def schur_check(s,p):
 sc=10**s['scaleExponent'];A=mul([[s['a1'],0],[0,s['a2']]],sc);b=[s['b1']*sc,s['b2']*sc];c=s['c']*sc;M=[[A[0][0],0,b[0]],[0,A[1][1],b[1]],[b[0],b[1],c]]
 mat(p['A'],A,'pivot');mat(p['M'],M,'block M');vec(p['b'],b,'coupling');close(p['c'],c,'C')
 pinv=[0 if A[i][i]==0 else 1/A[i][i]for i in range(2)];pseudo=[[pinv[0],0],[0,pinv[1]]];x=[-pinv[i]*b[i]for i in range(2)];rr=[b[i]if A[i][i]==0 else 0 for i in range(2)]
 mat(p['pseudo'],pseudo,'exact rank pseudo',scale=1/sc);vec(p['xstar'],x,'candidate');vec(p['rangeResidual'],rr,'range residual');vec(p['pinv'],pinv,'inverse pivots',scale=1/sc)
 positive(M,p['exact']);positive(A,p['pivotExact']);inrange=all(v==0 for v in rr);pos=all(A[i][i]>=0 for i in range(2));finite=pos and inrange
 ck(p['inRange']==inrange and p['positivePivot']==pos and p['strictPivot']==all(A[i][i]>0 for i in range(2))and p['finiteMinimum']==finite,'all Schur conditions')
 S=c-dot(b,mv(pseudo,b));close(p['S'],S,'Schur',scale=max(sc,abs(S)))
 ck((p['minimum']is None)==(not finite),'no invented minimum')
 if finite:close(p['minimum'],S,'finite minimum',scale=max(sc,abs(S)))
 L=[[1,0,0],[0,1,0],[*x,1]];target=[[A[0][0],0,rr[0]],[0,A[1][1],rr[1]],[rr[0],rr[1],S]]
 mat(p['L'],L,'full L');mat(p['target'],target,'target with range',scale=max(sc,abs(S)))
 mat(p['congruent'],mm(mm(L,M),tr(L)),'actual full congruence',scale=max(sc,abs(S)))
 mat(p['congruenceGap'],sub(p['congruent'],p['target']),'congruence defect',scale=max(sc,abs(S)))
 for r in p['samples']:
  vec(r['x'],[x[i]+r['t']*p['escape'][i]for i in range(2)],'path x');vec(r['v'],r['x']+[1],'path v')
  q=dot(r['v'],mv(M,r['v']));close(r['q'],q,'path actual Q',scale=max(sc,abs(q)))
  z=[r['x'][i]-x[i]for i in range(2)];completed=dot(z,mv(A,z))+S+2*dot(rr,r['x'])
  close(r['completed'],completed,'completed with range',scale=max(sc,abs(completed)));close(r['gap'],r['q']-r['completed'],'completion actual defect',scale=max(sc,abs(q)))
 ck(p['covarianceAllowed']==p['exact']['psd'],'valid covariance requires full positivity')
 jacobi_check(M,p['eig'])
def function_check(s,p):
 B=[[1+s['delta'],0],[0,s['delta']]];H=[[1,1],[1,1]];A=add(B,mul(H,s['t']))
 for k,v in [('A',A),('B',B),('H',H),('D',sub(A,B))]:mat(p[k],v,'function '+k)
 positive(p['D'],p['inputOrder']);close(p['formationGap'],fro(sub(p['D'],mul(H,s['t']))),'function formation',atol=1e-15)
 ck([r['f']for r in p['records']]==['square','sqrt','log','negative-inverse','exp'],'all five functions')
 for r in p['records']:
  f=r['f']
  for key,M in [('a',A),('b',B)]:
   z=r[key];eigen2(M,z['eig']);valid=(f not in ['sqrt','log','negative-inverse'])or(det(M)>=0 and all(M[i][i]>=0 for i in range(2))and(f=='sqrt'or det(M)>0))
   ck((z['matrix']is not None)==valid,'actual function domain')
   if not valid:ck(z['status']=='outside-domain','domain reason');continue
   ck(z['status']=='computed','computed status')
   with localcontext()as ctx:
    ctx.prec=70
    scalar=[]
    for val in z['eig']['values']:
     x=D(val);scalar.append(x*x if f=='square'else x.sqrt()if f=='sqrt'else x.ln()if f=='log'else -1/x if f=='negative-inverse'else x.exp())
   vec(z['scalar'],scalar,'decimal scalar '+f,rtol=3e-15,atol=1e-300)
   V=z['eig']['vectors'];F0=add(mul(outer(V[0],V[0]),z['scalar'][0]),mul(outer(V[1],V[1]),z['scalar'][1]));mat(z['matrix'],F0,'actual spectral function',scale=max(1,fro(F0)))
   rec=sub(M,add(mul(outer(V[0],V[0]),z['eig']['values'][0]),mul(outer(V[1],V[1]),z['eig']['values'][1])))
   mat(z['reconstruction'],rec,'actual spectral reconstruction',scale=max(1,fro(M)))
  valid=r['a']['matrix']is not None and r['b']['matrix']is not None
  if valid:
   gap=sub(r['a']['matrix'],r['b']['matrix']);evidence(gap,r['evidence']);mat(r['difference'],gap,'actual function difference',scale=max(1,fro(gap)))
  else:ck(r['difference']is None and r['evidence']is None,'unavailable difference')
  derivativeValid=f in ['square','exp']or s['delta']>0
  ck((r['L']is not None)==derivativeValid,'derivative domain')
  if derivativeValid:
   with localcontext()as ctx:
    ctx.prec=70;x=D(B[0][0]);y=D(B[1][1])
    fun=lambda z:z*z if f=='square'else z.sqrt()if f=='sqrt'else z.ln()if f=='log'else -1/z if f=='negative-inverse'else z.exp()
    df=lambda z:2*z if f=='square'else 1/(2*z.sqrt())if f=='sqrt'else 1/z if f=='log'else 1/(z*z)if f=='negative-inverse'else z.exp()
    off=(fun(x)-fun(y))/(x-y);L=[[df(x),off],[off,df(y)]]
   mat(r['L'],L,'decimal divided differences',rtol=5e-15,atol=1e-300);mat(r['L'],tr(r['L']),'bit-identical symmetric divided difference',rtol=0,atol=0)
   evidence(r['derivative'],r['derivativeEvidence']);mat(r['derivative'],r['L'],'Hadamard H')
  ck((r['quotient']is not None)==(valid and s['t']>0),'finite quotient domain')
  if r['quotient']is not None:
   mat(r['quotient'],mul(r['difference'],1/s['t']),'actual quotient',scale=max(1,fro(r['quotient'])))
   if derivativeValid:close(r['linearizationGap'],fro(sub(r['quotient'],r['derivative'])),'actual linearization defect',scale=max(1,r['linearizationGap']))
  if r['backward']is not None:
   expected=sub(mm(r['a']['matrix'],r['a']['matrix']),A)if f=='sqrt'else sub(mm(A,mul(r['a']['matrix'],-1)),eye(2))
   mat(r['backward'],expected,'function backward identity',scale=max(1,fro(A)*fro(r['a']['matrix'])))
 w=s['weight'];mix=add(mul(A,w),mul(B,1-w));J=sub(add(mul(mm(A,A),w),mul(mm(B,B),1-w)),mm(mix,mix));pred=mul(mm(sub(A,B),sub(A,B)),w*(1-w))
 mat(p['mixture'],mix,'mixture');mat(p['squareJensen'],J,'actual square Jensen');mat(p['squarePredicted'],pred,'square identity RHS')
 close(p['squareJensenGap'],fro(sub(J,pred)),'Jensen arithmetic defect');evidence(J,p['squareJensenEvidence'])
def science(d):
 s=d['config'];p=d['result']
 if s['mode']=='order':order_check(s,p)
 elif s['mode']=='schur':schur_check(s,p)
 else:
  function_check(s,p);values=sorted(set([i/10 for i in range(21)]+[s['t']]))
  ck([r['t']for r in d['study']]==values,'complete t study including exact input')
  for r in d['study']:function_check(dict(s,t=r['t']),r['result'])
def verify_views(d):
 s=d['config'];p=d['result'];rows={};expected=[];policies=[];summary=[]
 def col(v):return[[x]for x in v]
 def entries(o):return[[key,i,j,x]for key,A in o.items()if A is not None for i,r in enumerate(A)for j,x in enumerate(r)]
 def proof(label,z):return[[label,','.join(str(int(i))for i in q['indices']),q['sign'],q['value'],q['numerator'],q['exponent']]for q in z['minors']]
 def eig(label,z):return[[label,i,v,*z['vectors'][i],*z['residuals'][i]]for i,v in enumerate(z['values'])]
 names={'positive-definite':'存储矩阵正定','positive-semidefinite':'存储矩阵半正定','not-positive-semidefinite':'存储矩阵非半正定','not-symmetric':'存储矩阵非对称','computed':'已计算','outside-domain':'不在所选实函数定义域','unresolved-spectrum':'浮点谱不足以使用定义域','negative-curvature':'负曲率，二次逃逸','range-failure':'范围失配，线性逃逸','flat-minimizers':'平坦的最小解族','positive-pivot':'沿正枢轴偏离最小解'}
 funcs=['square','sqrt','log','negative-inverse','exp'];labels=['平方','平方根','对数','负倒数','指数']
 if s['mode']=='order':
  sc=p['scale'];rs=p['rays'];summary=[sc,s['t'],s['delta'],p['formationGap'],names[p['order']['exact']['status']],names[p['square']['exact']['status']],1 if s['stretch']==0 else 2,names[p['congruent']['exact']['status']],p['inverseTheorem'],p['inverseGap']is not None,p['quadraticAfter'],p['quadraticBefore'],s['theta']]
  keys=['A','B','requested','D','X','A2','B2','D2','rawCongruent','C','congruenceCorrection']
  matrices={k:p[k]for k in keys};matrices.update(inverseA=p['iA'],inverseB=p['iB'],inverseGap=p['inverseGap'],commutator=p['commutator'],v=col(p['v']),Xv=col(p['Xv']))
  if p['inverseDefects']is not None:matrices.update(inverseDefectA=p['inverseDefects']['A'],inverseDefectB=p['inverseDefects']['B'])
  rows['matrices']=entries(matrices)
  rows['proofs']=proof('A',p['AProof'])+proof('B',p['BProof'])+sum((proof(k,p[k]['exact'])for k in ['order','square','congruent','inverse']if p[k]is not None),[])
  rows['eigen']=sum((eig(k,p[k]['eig'])for k in ['order','square','congruent','inverse']if p[k]is not None),[])
  rows['rays']=[[r['degrees'],*r['v'],r['order'],r['square'],r['congruent']]for r in rs]
  expected=[{'square':[[r['degrees'],r['square']]for r in rs],'min':[[j,p['square']['eig']['values'][1]/sc**2]for j in [0,180]]},{k:[[r['degrees'],r[k]]for r in rs]for k in ['order','congruent']},{'inverse':[[r['degrees'],dot(r['v'],mv(p['inverseGap'],r['v']))*sc]for r in rs]if p['inverseGap']is not None else[]}]
  policies=[{k:True for k in q}for q in expected];xmin,xmax=0,180
 elif s['mode']=='schur':
  sc=p['scale'];summary=[sc,p['strictPivot'],p['positivePivot'],p['inRange'],p['finiteMinimum'],p['S'],p['minimum'],names[p['escapeType']],names[p['exact']['status']],p['covarianceAllowed'],fro(p['congruenceGap']),len(p['eig']['records']),p['eig']['status'],p['eig']['orthogonality'],p['eig']['similarity']]
  rows['matrices']=entries(dict(A=p['A'],b=col(p['b']),M=p['M'],pseudo=p['pseudo'],xstar=col(p['xstar']),rangeResidual=col(p['rangeResidual']),L=p['L'],congruent=p['congruent'],target=p['target'],congruenceGap=p['congruenceGap'],normalResidual=col(p['normalResidual']),escape=col(p['escape']),Q=p['eig']['Q'],T=p['eig']['T']))
  rows['proofs']=proof('M',p['exact'])+proof('A',p['pivotExact'])
  rows['path']=[[r['t'],*r['x'],r['q'],r['completed'],r['gap']]for r in p['samples']]
  rows['eigen']=[[i,r['value'],*r['v'],*r['residual'],r['residualNorm']]for i,r in enumerate(p['eig']['pairs'])]
  rows['rotations']=[[r['step'],r['p'],r['q'],r['off'],r['threshold'],r['tau'],r['t'],r['c'],r['s'],fro(r['correction'])]for r in p['eig']['records']]
  rows['rotation-matrices']=[[r['step'],*v]for r in p['eig']['records']for v in entries({k:r[k]for k in ['before','Qbefore','J','raw','correction','after','Q']})]
  expected=[{'actual':[[r['t'],r['q']/sc]for r in p['samples']],'completed':[[r['t'],r['completed']/sc]for r in p['samples']],'minimum':[[j,p['minimum']/sc]for j in [-10,10]]if p['minimum']is not None else[]},{'residual':[[i,math.log10(r['residualNorm']/sc)]for i,r in enumerate(p['eig']['pairs'])if r['residualNorm']>0],'congruence':[[0,math.log10(fro(p['congruenceGap'])/sc)]]if fro(p['congruenceGap'])>0 else[]}]
  policies=[{k:True for k in expected[0]},{k:False for k in expected[1]}]
 else:
  summary=[s['delta'],s['t'],p['formationGap'],names[p['inputOrder']['status']],s['weight'],p['squareJensenGap'],'精确符号只判断存储矩阵，不认证真实函数值']
  rows['input']=entries({k:p[k]for k in ['A','B','H','D','mixture','squareJensen','squarePredicted']})
  rows['current']=[]
  for label,r in zip(labels,p['records']):
   e=r['evidence'];de=r['derivativeEvidence']
   rows['current'].append([label,names[r['a']['status']],names[r['b']['status']],e['eig']['values'][1]if e else None,e['quadratic']if e else None,names[e['exact']['status']]if e else None,de['eig']['values'][1]if de else None,r['linearizationGap'],fro(r['backward'])if r['backward']is not None else None])
  for k in ['run-matrices','run-values','run-proofs','run-eigen']:rows[k]=[]
  runs=[dict(t=s['t'],current=True,result=p)]+[dict(**r,current=False)for r in d['study']]
  for v in runs:
   for r in v['result']['records']:
    obj=dict(A=v['result']['A'],B=v['result']['B'],fA=r['a']['matrix'],fB=r['b']['matrix'],difference=r['difference'],L=r['L'],derivative=r['derivative'],quotient=r['quotient'],backward=r['backward'],reconstructionA=r['a']['reconstruction'],reconstructionB=r['b']['reconstruction'])
    rows['run-matrices'] += [[v['current'],v['t'],r['f'],*z]for z in entries(obj)]
    e=r['evidence']
    rows['run-values'].append([v['current'],v['t'],r['f'],names[r['a']['status']],names[r['b']['status']],e['eig']['values'][1]if e else None,e['eig']['values'][0]if e else None,names[e['exact']['status']]if e else None,r['linearizationGap']])
    if e:rows['run-proofs'] += [[v['current'],v['t'],*z]for z in proof(r['f'],e['exact'])]
    es=eig(r['f']+':A',r['a']['eig'])+eig(r['f']+':B',r['b']['eig'])
    if e:es+=eig(r['f']+':difference',e['eig'])
    if r['derivativeEvidence']:es+=eig(r['f']+':derivative',r['derivativeEvidence']['eig'])
    rows['run-eigen'] += [[v['current'],v['t'],*z]for z in es]
  expected=[]
  for fs in [['square','exp'],['sqrt','log','negative-inverse']]:
   q={}
   for f in fs:
    pts=[]
    for v in d['study']:
     r=next(r for r in v['result']['records']if r['f']==f)
     if r['evidence']:
      den=fro(r['a']['matrix'])+fro(r['b']['matrix']);pts.append([v['t'],r['evidence']['eig']['values'][1]/den if den else 0])
    q[f]=pts
   expected.append(q)
  expected.append({f:[[v['t'],math.log10(r['linearizationGap'])]for v in d['study']for r in v['result']['records']if r['f']==f and r['linearizationGap']is not None and r['linearizationGap']>0]for f in funcs})
  expected.append({'jensen':[[v['t'],v['result']['squareJensenEvidence']['eig']['values'][1]]for v in d['study']],'jensen-max':[[v['t'],v['result']['squareJensenEvidence']['eig']['values'][0]]for v in d['study']]})
  expected.append({'roundoff':[[v['t'],v['result']['squareJensenEvidence']['eig']['values'][1]]for v in d['study']],'zero':[[0,0],[2,0]]})
  policies=[{k:i==3 or(i==4 and k=='zero')for k in q}for i,q in enumerate(expected)];xmin,xmax=0,2
 tables={t['key']:t for t in d['ledgers']};ck(set(tables)==set(rows)|{'summary'},'all complete ledgers')
 def cell(a,b):
  if type(b)in[int,float]:close(a,b,'displayed record',rtol=4e-15,atol=1e-28)
  else:ck(a==b,'displayed exact cell')
 ck(len(tables['summary']['rows'])==len(summary),'all summary rows')
 for r,b in zip(tables['summary']['rows'],summary):cell(r[1],b)
 for key,rs in rows.items():
  actual=tables[key]['rows'];ck(len(actual)==len(rs),'complete ledger '+key)
  for a,b in zip(actual,rs):
   ck(len(a)==len(b),'full row');ck(len(a)==len(tables[key]['headers']),'header coverage')
   for x,y in zip(a,b):cell(x,y)
 ck(len(d['plots'])==len(expected)==len(d['svgs']),'all panels')
 ns={'s':'http://www.w3.org/2000/svg'}
 for i,(q,ex,raw)in enumerate(zip(d['plots'],expected,d['svgs'])):
  root=ET.fromstring(raw);ck(root.get('width')=='900'and root.get('height')=='425','native readable figure')
  ck([z['key']for z in q['series']]==list(ex),'complete plotted series')
  if s['mode']=='schur':xmin,xmax=(-10,10)if i==0 else(0,2)
  ck(q['xmin']==xmin and q['xmax']==xmax,'declared horizontal domain')
  values=[y for ps in ex.values()for _,y in ps]
  if not q['y'].startswith('log₁₀'):values=[0,*values]
  lo=min(values)if values else 0;hi=max(values)if values else 0;pad=(hi-lo or 1)*.08
  close(q['ymin'],lo-pad,'no artificial log zero lower',atol=1e-12);close(q['ymax'],hi+pad,'data extent upper',atol=1e-12)
  xf=lambda x:100+750*(x-q['xmin'])/(q['xmax']-q['xmin']);yf=lambda y:335-250*(y-q['ymin'])/(q['ymax']-q['ymin'])
  for z in q['series']:
   pts=ex[z['key']];ck(len(z['points'])==len(pts),'all actual points');ck(z['line']==policies[i][z['key']],'line policy')
   nodes=root.findall('.//s:circle[@data-series="'+z['key']+'"]',ns);ck(len(nodes)==len(pts),'all visible markers')
   poly=root.find('.//s:polyline[@data-series="'+z['key']+'"]',ns);ck((poly is not None)==z['line'],'line presence')
   coordinates=[list(map(float,p.split(',')))for p in poly.get('points').split()]if poly is not None else None
   if coordinates is not None:ck(len(coordinates)==len(pts),'complete polyline')
   for j,(a,b,n)in enumerate(zip(z['points'],pts,nodes)):
    vec(a,b,'record to plotted point',atol=3e-12);ck(q['xmin']<=a[0]<=q['xmax']and q['ymin']<=a[1]<=q['ymax'],'unclipped')
    ck(n.get('data-index')==str(j),'marker order')
    vec([float(n.get('cx')),float(n.get('cy'))],[xf(a[0]),yf(a[1])],'actual SVG geometry',rtol=0,atol=1e-9)
    if coordinates is not None:vec(coordinates[j],[xf(a[0]),yf(a[1])],'line geometry',rtol=0,atol=1e-9)
  markers=root.findall('.//s:line[@data-marker]',ns);expected_markers=[s['theta']]if s['mode']=='order'and s['theta']>=0 else[]
  ck([m['x']for m in q['markers']]==expected_markers,'current direction marker');ck(len(markers)==len(expected_markers),'all marker lines')
  for m,x in zip(markers,expected_markers):vec([float(m.get('x1')),float(m.get('x2'))],[xf(x),xf(x)],'marker placement',rtol=0,atol=1e-9)

for d in data['states']:
 science(d)
 if 'plots'in d:verify_views(d)
ck(data['invalid']==210 and data['self']=={'status':'PASS','checks':12},'strict public input guards')
print(json.dumps(dict(status='PASS',stage='science',states=len(data['states']),checks=checks,invalid=data['invalid'],self=data['self'])))

# Publication contract147
if len(sys.argv)==1:
 from html.parser import HTMLParser
 fixture=ROOT/'course-shared/projects/matrix-order/run-snapshot.json'
 frozen=json.loads(fixture.read_text(),parse_int=float);ck(frozen['schema']==1,'snapshot schema')
 provenance=frozen['provenance']
 ck(provenance['labSha256']==hashlib.sha256(JS.read_bytes()).hexdigest(),'snapshot exact implementation')
 ck(provenance['runtime']=='v24.14.0'and provenance['platform']=='darwin'and provenance['arch']=='arm64'and provenance['capturedOn']=='2026-09-11','snapshot environment')
 ck((ROOT/'grad-math/site/assets/learning/projects/matrix-order/run-snapshot.json').read_bytes()==fixture.read_bytes(),'snapshot public byte identity')
 for key,mode in [('positive','order'),('flat','schur'),('escape','schur'),('functions','functions')]:
  ck(frozen[key]['config']['mode']==mode,'snapshot named mode');science(frozen[key])
 ck(frozen['positive']['config']['delta']==.1 and frozen['positive']['config']['t']==1 and frozen['flat']['config']['a2']==0 and frozen['flat']['config']['b2']==0 and frozen['escape']['config']['a2']==0 and frozen['escape']['config']['b2']==1 and frozen['functions']['config']['delta']==.1 and frozen['functions']['config']['t']==1,'named fixed inputs')
 src=(ROOT/'grad-math/lectures/ma-02-psd-functions.md').read_text();site=(ROOT/'grad-math/site/ma-02-psd-functions.html').read_text()
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
 for course in ['ai-course','grad-math','math-course']:ck((ROOT/course/'site/assets/learning/labs/matrix-order-functions.js').read_bytes()==JS.read_bytes(),'tracked mirror')
 ck((ROOT/'.github/workflows/course-audit.yml').read_text().count('python tools/check_matrix_order_full.py')==1,'CI invocation')
 image=ROOT/'grad-math/images/ma-02-order-ledgers.svg'
 ck(image.read_bytes()==(ROOT/'grad-math/site/assets/img/ma-02-order-ledgers.svg').read_bytes(),'SVG mirror')
 panels=ET.parse(image).getroot().findall('.//{http://www.w3.org/2000/svg}svg');ck(len(panels)==4,'four static panels')
 code="const a=require(process.argv[1]),f=JSON.parse(require('fs').readFileSync(process.argv[2],'utf8'));console.log(JSON.stringify([a.plots(f.positive)[0],a.plots(f.flat)[0],a.plots(f.escape)[0],a.plots(f.functions)[0]].map(a.svg)))"
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
 table=re.search(r'data-learning-lab="matrix-order-functions".*?<tbody>(.*?)</tbody>',site,re.S).group(1)
 vals=[float(html.unescape(x))for x in re.findall(r'<tr>\s*<td>.*?</td>\s*<td[^>]*>(.*?)</td>\s*</tr>',table,re.S)]
 p=frozen['positive']['result'];q=frozen['flat']['result'];e=frozen['escape']['result'];v=frozen['functions']['result']
 A=p['A'];amin=A[0][0]/2+A[1][1]/2-math.hypot((A[0][0]-A[1][1])/2,A[0][1])
 refs=[amin,p['B'][1][1],p['square']['eig']['determinant'],p['square']['quadratic'],q['S'],q['minimum'],sum(x!=0 for x in q['diagonal']),q['actualAtCandidate'],e['S'],norm(e['rangeResidual']),e['samples'][-1]['q'],int(e['finiteMinimum'])]
 refs += [next(r for r in v['records']if r['f']==f)['evidence']['eig']['values'][1]for f in ['square','exp','sqrt','log','negative-inverse']]
 refs.append(v['squareJensenGap'])
 ck(len(vals)==len(refs)==18,'all fixed values')
 for x,y in zip(vals,refs):close(x,y,'frozen fallback number',rtol=2e-11,atol=1e-28)
 ck('run-snapshot.json'in site and '形式Schur值不是最小值'in site and '全维度定理'in site,'readable fixed evidence limits')
 ck(len(re.findall(r'^## [0-9]+\.',src,re.M))==12,'twelve numbered sections')
 print('formulas',len(formulas))
print(json.dumps(dict(status='PASS',checks=checks,states=len(data['states']),invalid=data['invalid'],self=data['self'])))
