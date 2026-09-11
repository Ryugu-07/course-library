"""Independent, stdlib-only certificate replay; does not import the JS algorithms."""
from fractions import Fraction as F
from itertools import permutations, product
from math import isqrt
import json,sys
checks=0
def ck(v,msg='certificate'):
 global checks
 checks+=1
 if not v:raise AssertionError(msg)
def trim(a):
 a=list(a)
 while len(a)>1 and not a[-1]:a.pop()
 return a
def norm(a,p=0):return trim([int(v)%p if p else F(v) for v in a])
def add(a,b,p=0):return norm([(a[i] if i<len(a)else 0)+(b[i] if i<len(b)else 0)for i in range(max(len(a),len(b)))],p)
def mul(a,b,p=0):
 c=[0]*(len(a)+len(b)-1)
 for i,x in enumerate(a):
  for j,y in enumerate(b):c[i+j]+=x*y
 return norm(c,p)
def div(a,b,p=0):
 a,b=norm(a,p),norm(b,p);q=[0]*max(1,len(a)-len(b)+1)
 while a!=[0]and len(a)>=len(b):
  k=len(a)-len(b);v=a[-1]*pow(b[-1],-1,p)%p if p else a[-1]/b[-1];q[k]+=v
  a=add(a,[0]*k+[-v*x for x in b],p)
 return norm(q,p),a
def gcd(a,b,p=0):
 while b!=[0]:a,b=b,div(a,b,p)[1]
 return norm([x*(pow(a[-1],-1,p)if p else 1/a[-1])for x in a],p)
def derivative(a,p=0):return norm([i*a[i]for i in range(1,len(a))]or[0],p)
def evaluate(a,x):return sum(v*x**i for i,v in enumerate(a))
def powmod(a,n,f,p):
 r=[1]
 while n:
  if n&1:r=div(mul(r,a,p),f,p)[1]
  a=div(mul(a,a,p),f,p)[1];n//=2
 return r
def determinant(matrix):
 a=[[F(v)for v in r]for r in matrix];det=F(1)
 for i in range(len(a)):
  j=next((j for j in range(i,len(a))if a[j][i]),None)
  if j is None:return F(0)
  if i!=j:a[i],a[j]=a[j],a[i];det=-det
  pivot=a[i][i];det*=pivot
  for j in range(i+1,len(a)):
   q=a[j][i]/pivot
   a[j]=[x-q*y for x,y in zip(a[j],a[i])]
 return det
def divisions(rows,p=0):
 for t in rows:ck(div(norm(t['dividend'],p),norm(t['divisor'],p),p)==(norm(t['quotient'],p),norm(t['remainder'],p)),'division replay')
def polynomial(b):
 f=norm(b['coefficients']);n=len(f)-1;q=b['rational'];B=1+max(abs(v)for v in f[:-1]);ck(q['bound']==B);fs=[norm(v)for v in q['factors']];v=[F(1)]
 for z in fs:v=mul(v,z)
 ck(v==f==norm(q['product']));ck(q['degrees']==[len(z)-1 for z in fs]);ck(q['irreducible']==(len(fs)==1))
 for s in q['searches']:
  a=norm(s['polynomial']);ck(s['bound']==B);ts=s['linearTrials'];ck([int(t['root'])for t in ts]==list(range(-int(B),-int(B)+len(ts))))
  for t in ts:ck(evaluate(a,F(t['root']))==F(t['value']))
  cs=[c for k in range(1,abs(int(a[0]))+1)if int(a[0])%k==0 for c in [-k,k]];expected=list(product(range(-2*int(B),2*int(B)+1),cs)) if len(a)>=5 else []
  qs=s['quadraticTrials'];ck([(t['linearCoefficient'],int(t['constant']))for t in qs]==expected[:len(qs)])
  for t in qs:ck(div(a,[F(t['constant']),F(t['linearCoefficient']),F(1)])[1]==norm(t['remainder']))
  if s['found'] is None:ck(len(ts)==2*B+1 and len(qs)==len(expected))
  else:ck(mul(norm(s['found']),norm(s['quotient']))==a)
 for z in fs:
  if len(z)<=2:continue
  ck(all(evaluate(z,F(k))!=0 for k in range(-int(B),int(B)+1)))
  if len(z)>=5:
   for k in range(1,abs(int(z[0]))+1):
    if int(z[0])%k:continue
    for c in [-k,k]:
     for d in range(-2*int(B),2*int(B)+1):ck(div(z,[F(c),F(d),F(1)])[1]!=[0],'terminal rational factor irreducible')
 disc=b['discriminant'];df=derivative(f);rows=[]
 for a,count in [(f,n-1),(df,n)]:
  for k in range(count):rows.append([0]*k+list(reversed(a))+[0]*(2*n-1-k-len(a)))
 ck([[F(v)for v in r]for r in disc['sylvester']]==rows);res=determinant(rows);value=(-1)**(n*(n-1)//2)*res;ck(F(disc['resultant'])==res and F(disc['value'])==value);v=int(value);ck(disc['square']['square']==(v>=0 and isqrt(v)**2==v));ck(disc['square']['root']==(str(isqrt(v))if v>=0 else None))
 # Replay fraction-free states while determinant above uses ordinary rational elimination.
 a=[r[:]for r in rows];previous=1
 for k,t in enumerate(disc['bareiss']):
  j=next(j for j in range(k,len(a))if a[j][k]);ck(t['column']==k and t['swappedWith']==j);a[k],a[j]=a[j],a[k];pivot=a[k][k];ck(F(t['pivot'])==pivot and F(t['previousPivot'])==previous)
  old=[r[:]for r in a]
  for i in range(k+1,len(a)):
   for j in range(k+1,len(a)):a[i][j]=(pivot*old[i][j]-old[i][k]*old[k][j])/previous
   a[i][k]=0
  ck(a==[[F(v)for v in r]for r in t['matrix']]);previous=pivot
 for row in b['reductions']:
  p=row['prime'];a=norm(f,p);parts=[norm(z,p)for z in row['factors']];v=[1]
  for z in parts:
   v=mul(v,z,p)
   # Independent exhaustive trial division, separate from the Frobenius certificate.
   for deg in range(1,(len(z)-1)//2+1):
    for cs in product(range(p),repeat=deg):ck(div(z,list(cs)+[1],p)[1]!=[0],'finite factor irreducible')
  ck(v==a==norm(row['reduced'],p)==norm(row['product'],p));ck(row['degrees']==[len(z)-1 for z in parts]);g=gcd(a,derivative(a,p),p);ck(norm(row['gcd'],p)==g and norm(row['derivative'],p)==derivative(a,p));ck(row['good']==(len(g)==1));ck(row['cycleType']==(','.join(map(str,row['degrees']))if len(g)==1 else None));divisions(row['gcdSteps'],p)
  for t in row['divisions']:ck(mul(norm(t['factor'],p),norm(t['quotient'],p),p)==norm(t['dividend'],p))
  ck(len(row['irreducibilityCertificates'])==len(parts))
  for z,c in zip(parts,row['irreducibilityCertificates']):
   ck(norm(c['factor'],p)==z);ck(len(c['frobeniusRemainders'])==len(z))
   for k,r in enumerate(c['frobeniusRemainders']):ck(norm(r,p)==powmod([0,1],p**k,z,p))
   degree=len(z)-1;primes=[k for k in range(2,degree+1)if degree%k==0 and all(k%d for d in range(2,k))];ck([t['divisor']for t in c['tests']]==primes)
   for t in c['tests']:
    ck(t['iteration']==degree//t['divisor']);diff=add(powmod([0,1],p**t['iteration'],z,p),[-x for x in div([0,1],z,p)[1]],p);ck(norm(t['difference'],p)==diff);ck(norm(t['gcd'],p)==gcd(z,diff,p)==[1]);divisions(t['steps'],p)
   ck(norm(c['terminalDifference'],p)==add(powmod([0,1],p**degree,z,p),[-x for x in div([0,1],z,p)[1]],p)==[0])
 st=b['real'];common=gcd(f,df);sf=div(f,common)[0];ck(norm(st['gcd'])==common and norm(st['squareFreePart'])==sf);divisions(st['gcdSteps']);divisions(st['divisions']);seq=[sf,derivative(sf)]
 while True:
  rem=div(seq[-2],seq[-1])[1]
  if rem==[0]:break
  seq.append([-v for v in rem])
 ck([norm(v)for v in st['sequence']]==seq)
 def sign(v):return (v>0)-(v<0)
 def variation(ss):
  ss=[s for s in ss if s]
  return sum(a!=b for a,b in zip(ss,ss[1:]))
 left=[sign(z[-1])*(-1)**(len(z)-1)for z in seq];right=[sign(z[-1])for z in seq];ck(st['leftInfinity']==left and st['rightInfinity']==right);ck(st['leftVariation']==variation(left)and st['rightVariation']==variation(right));ck(st['rootCount']==variation(left)-variation(right));ck(st['intervalConvention']=='(left,right]' and st['bound']==B)
 nodes=st['nodes'];ck(nodes[0]['parent']is None and F(nodes[0]['left'])==-B and F(nodes[0]['right'])==B);reached={0};final=[]
 for i,t in enumerate(nodes):
  ck(t['id']==i and i in reached);lo,hi=F(t['left']),F(t['right']);ck(lo<hi);ls=[sign(evaluate(z,lo))for z in seq];rs=[sign(evaluate(z,hi))for z in seq];ck(t['leftSigns']==ls and t['rightSigns']==rs);ck(t['leftVariation']==variation(ls)and t['rightVariation']==variation(rs));ck(t['count']==variation(ls)-variation(rs)>=0)
  if t['children']:
   ck(len(t['children'])==2);u,v=[nodes[j]for j in t['children']];ck(u['parent']==v['parent']==i);ck(F(u['left'])==lo and F(u['right'])==F(v['left'])==(lo+hi)/2 and F(v['right'])==hi);ck(u['count']+v['count']==t['count']);reached.update(t['children'])
  elif t['count']:ck(t['count']==1 and hi-lo<=F(1,2**st['bits']));final.append(i)
 ck(st['leaves']==sorted(final,key=lambda i:F(nodes[i]['left'])) and len(final)==st['rootCount']);ck(len(reached)==len(nodes))
 for e in b['eisenstein']:
  p=e['prime'];flags=[int(v)%p==0 for v in f[:-1]];last=int(f[0])%(p*p)!=0;ck(e['divisible']==flags and e['constantNotDivisibleBySquare']==last and e['valid']==(all(flags)and last))
def groups(models):
 allps=list(permutations(range(5)));lookup_models={}
 def parity(p):return (-1)**sum(p[i]>p[j]for i in range(5)for j in range(i+1,5))
 def ctype(p):
  seen=set();sizes=[]
  for i in range(5):
   if i in seen:continue
   j=i;size=0
   while j not in seen:seen.add(j);size+=1;j=p[j]
   sizes.append(size)
  return ','.join(map(str,sorted(sizes)))
 for g in models:
  name=g['id'];aa={'C5':[1],'D5':[1,4],'F20':[1,2,3,4]}.get(name)
  ps=sorted(tuple((a*x+b)%5 for x in range(5))for a in aa for b in range(5))if aa else [p for p in allps if name=='S5'or parity(p)==1];ck(ps==[tuple(p)for p in g['permutations']]);index={p:i for i,p in enumerate(ps)}
  def compose(i,j):return index[tuple(ps[i][ps[j][x]]for x in range(5))]
  tab=[[compose(i,j)for j in range(len(ps))]for i in range(len(ps))];ck(tab==g['multiplication']);inv=[next(j for j in range(len(ps))if tab[i][j]==tab[j][i]==0)for i in range(len(ps))];ck(inv==g['inverses']);types=[ctype(p)for p in ps];ck(types==g['cycleTypes'] and sorted(set(types))==g['availableTypes']);ck(g['even']==all(parity(p)==1 for p in ps));current=set(range(len(ps)))
  for k,t in enumerate(g['derived']):
   ck(t['elements']==sorted(current));triples=[[i,j,tab[tab[tab[i][j]][inv[i]]][inv[j]]]for i in sorted(current)for j in sorted(current)];ck(triples==t['commutators']);gens=sorted({z for i,j,z in triples});ck(gens==t['generators']);cl={0};todo=[0]
   for i in todo:
    for j in gens:
     if tab[i][j]not in cl:cl.add(tab[i][j]);todo.append(tab[i][j])
   ck(sorted(cl)==t['next']);ck(set(map(int,t['words']))==cl)
   for i,word in t['words'].items():
    z=0
    for j in word:ck(j in gens);z=tab[z][j]
    ck(z==int(i))
   stopped=cl==current
   ck((k==len(g['derived'])-1)==stopped);current=cl
  ck(g['solvable']==(len(current)==1));lookup_models[name]={'types':set(types),'even':g['even'],'solvable':g['solvable']}
 return lookup_models
def evidence(s,models):
 b=s['polynomial'];c=s['parameters'];es=[];unused=[]
 for p in ([]if not c['evidencePrimes']else list(map(int,c['evidencePrimes'].split(',')))):
  r=next(r for r in b['reductions']if r['prime']==p)
  if r['good']:es.append({'kind':'cycle','source':'prime','prime':p,'type':r['cycleType']})
  else:unused.append(p)
 d=len(b['real']['squareFreePart'])-1;r=b['real']['rootCount'];pairs=(d-r)//2;typ=','.join(map(str,[1]*r+[2]*pairs));ck(s['realConjugation']=={'rootDegree':d,'realCount':r,'complexPairs':pairs,'type':typ})
 if c['useReal']=='yes':es.append({'kind':'cycle','source':'complex-conjugation','type':typ,'realRoots':r,'complexPairs':pairs})
 if c['useDiscriminant']=='yes'and b['discriminant']['value']!='0':es.append({'kind':'parity','source':'discriminant','square':b['discriminant']['square']['square']})
 if c['useConstruction']=='yes'and b['construction']:es.append({'kind':'construction','source':b['construction']['kind'],'group':b['construction']['group']})
 ck(s['evidence']==es and [r['prime']for r in s['unusedEvidence']]==unused);cl=s['classification'];app=b['degree']==5 and b['rational']['irreducible'];ck(cl['applicable']==app)
 if not app:ck(cl['solvable']and cl['exactGroup']is None and cl['remaining']==[]and cl['steps']==[]);return
 remaining=list(models);ck(len(cl['steps'])==len(es))
 for e,t in zip(es,cl['steps']):
  ck(t['before']==remaining and t['evidence']==e);before=remaining[:];remaining=[g for g in remaining if (g==e['group']if e['kind']=='construction'else models[g]['even']==e['square']if e['kind']=='parity'else e['type']in models[g]['types'])];ck(t['remaining']==remaining and [x['group']for x in t['excluded']]==[g for g in before if g not in remaining])
 ck(cl['remaining']==remaining and remaining);solvable=all(models[g]['solvable']for g in remaining);unsolvable=all(not models[g]['solvable']for g in remaining);ck(cl['solvable']==(True if solvable else False if unsolvable else None));ck(cl['exactGroup']==(remaining[0]if len(remaining)==1 else None))
def construction(b):
 c=b['construction']
 if c is None:return
 binomial=c['kind']=='binomial-quintic';fx=norm(b['coefficients'])if binomial else [F(1)]*11;fy=[F(1)]*5 if binomial else [F(0),F(1)];nx,ny=len(fx)-1,len(fy)-1;N=nx*ny
 def basis(k):return [F(i==k)for i in range(N)]
 one=basis(0);zero=[F(0)]*N
 def plus(a,b):return [x+y for x,y in zip(a,b)]
 def times(a,b):
  out=zero[:]
  for i,x in enumerate(a):
   if not x:continue
   for j,y in enumerate(b):
    if not y:continue
    xx=div([F(0)]*(i%nx+j%nx)+[F(1)],fx)[1];yy=div([F(0)]*(i//nx+j//nx)+[F(1)],fy)[1]
    for k,u in enumerate(xx):
     for l,v in enumerate(yy):out[k+nx*l]+=x*y*u*v
  return out
 def power(a,k):
  v=one[:]
  for _ in range(k):v=times(v,a)
  return v
 X=basis(1);Y=basis(nx)if ny>1 else zero
 roots=[times(X,power(Y,j))for j in range(5)]if binomial else [plus(power(X,j),power(X,11-j))for j in range(1,6)]
 ck(c['roots']==[[str(v)for v in r]for r in roots]);ck(c['ambientDegree']==N and c['group']==('F20'if binomial else 'C5'))
 coefficients=[one]
 for root in roots:
  out=[zero[:]for _ in range(len(coefficients)+1)]
  for i,v in enumerate(coefficients):out[i]=plus(out[i],[-x for x in times(v,root)]);out[i+1]=plus(out[i+1],v)
  coefficients=out
 ck([[F(v)for v in r]for r in c['polynomialProduct']]==coefficients);ck(coefficients==[[F(v)]+[F(0)]*(N-1)for v in b['coefficients']])
 if binomial:
  ck(c['relations']=={'alpha':b['coefficients'],'zeta':[1,1,1,1,1]});ck(c['basis']==[{'alphaExponent':i%nx,'zetaExponent':i//nx}for i in range(N)])
  ck(c['radicand']==-b['coefficients'][0]);ck([(t['power'],t['radicand'],t['degree'])for t in c['tower']]==[(5,'1',4),(5,str(c['radicand']),5)])
  for g,(x,y)in zip(c['generators'],[(times(X,Y),Y),(X,power(Y,2))]):
   M=[[F(v)for v in r]for r in g['matrix']['data']];ck(determinant(M)!=0)
   for j in range(N):ck([M[i][j]for i in range(N)]==times(power(x,j%nx),power(y,j//nx)))
 else:
  v=roots[0];bs=[power(v,i)for i in range(5)];ck([[F(v)for v in r]for r in c['fixedBasis']]==bs);ck(c['minimalPolynomial']['degree']==5 and norm(c['minimalPolynomial']['coefficients'])==norm(b['coefficients']));ck([[F(v)for v in r]for r in c['minimalPolynomial']['powers']]==[power(v,i)for i in range(6)])
  ck(c['quotientRepresentatives']==[1,2,3,4,5]);ck(c['quotientMultiplication']==[[min((i*j)%11,11-(i*j)%11)-1 for j in range(1,6)]for i in range(1,6)])
  for j,m in enumerate(c['restrictions']):
   M=[[F(v)for v in r]for r in m['data']];ck(determinant(M)!=0)
   for i in range(5):ck(power(roots[j],i)==[sum(M[k][i]*bs[k][t]for k in range(5))for t in range(N)])
def verify_bundle(bundle):
 models=groups(bundle['models']);seen=set()
 for s in bundle['states']:
  key=(tuple(s['polynomial']['coefficients']),s['parameters']['bits'])
  if key not in seen:polynomial(s['polynomial']);construction(s['polynomial']);seen.add(key)
  evidence(s,models)
 return {'status':'PASS','states':len(bundle['states']),'polynomials':len(seen),'checks':checks}

import xml.etree.ElementTree as ET
def verify_views(bundle):
 for s,v in zip(bundle['states'],bundle['views']):
  b=s['polynomial'];ps=v['plots'];ck(len(ps)==len(v['svgs'])==4);ck([p['key']for p in ps]==['factor-cycles','candidate-filter','real-intervals','derived-series'])
  for p,raw in zip(ps,v['svgs']):
   ck(p['width']==900 and p['height']==460);root=ET.fromstring(raw);ck(root.attrib['viewBox']=='0 0 900 460' and root.attrib['role']=='img');ck(root.find('{*}title').text==p['title'] and root.find('{*}desc').text==p['caption']);els=list(root)[3:];ck(len(els)==len(p['items']))
   for el,it in zip(els,p['items']):
    ck(el.tag.split('}')[-1]==it['tag']);ck(el.text==(str(it['text'])if it['tag']=='text'else None));
    for k,x in it.items():
     if k in ['tag','text']:continue
     key={'size':'font-size','anchor':'text-anchor','strokeWidth':'stroke-width'}.get(k,k);ck(el.attrib[key]==str(x))
    for key in ['x','x1','x2','cx']:
     if key in it:ck(0<=it[key]<=900)
    for key in ['y','y1','y2','cy']:
     if key in it:ck(0<=it[key]<=460)
    if it['tag']=='rect':ck(it['width']>0 and it['height']>0 and it.get('x',0)+it['width']<=900 and it.get('y',0)+it['height']<=460)
  row=next(r for r in b['reductions']if r['prime']==s['selectedPrime']);ck(len([it for it in ps[0]['items']if it['tag']=='circle'])==b['degree']);ck(len([it for it in ps[0]['items']if it['tag']=='line'])==(sum(n for n in row['degrees']if n>1)if row['good']else 0))
  ck(len([it for it in ps[2]['items']if it['tag']=='line'])==b['real']['rootCount']);ck(len([it for it in ps[3]['items']if it['tag']=='rect'])==sum(len(g['derived'])for g in bundle['models']))
  ts={t['key']:t for t in v['tables']};ck(len(ts)==len(v['tables']))
  for t in ts.values():
   ck(all(len(r)==len(t['headers'])for r in t['rows']),'table rectangular '+t['key'])
  ck(len(ts['rational-factors']['rows'])==len(b['rational']['factors']));ck([r[2]for r in ts['rational-factors']['rows']]==b['rational']['factors'])
  ck(len(ts['rational-linear']['rows'])==sum(len(r['linearTrials'])for r in b['rational']['searches']));ck(len(ts['rational-quadratic']['rows'])==sum(len(r['quadraticTrials'])for r in b['rational']['searches']));ck(len(ts['sturm-tree']['rows'])==len(b['real']['nodes']));ck([r[2:4]for r in ts['sturm-tree']['rows']]==[[t['left'],t['right']]for t in b['real']['nodes']]);ck(len(ts['reductions']['rows'])==10)
  ck(ts['sylvester']['rows']==[[i]+r for i,r in enumerate(b['discriminant']['sylvester'])]);ck(len(ts['bareiss']['rows'])==sum(len(t['matrix'])for t in b['discriminant']['bareiss']));ck(len(ts['evidence']['rows'])==len(s['classification']['steps']))
  for g in bundle['models']:
   ck(ts['multiplication-'+g['id']]['rows']==[[i]+r for i,r in enumerate(g['multiplication'])]);ck(len(ts['elements-'+g['id']]['rows'])==g['order']);ck([r[1]for r in ts['derived-'+g['id']]['rows']]==[t['elements']for t in g['derived']])
  if b['construction']:
   c=b['construction'];ck(ts['constructed-roots']['rows']==[[i]+[r]for i,r in enumerate(c['roots'])]);ck(ts['constructed-product']['rows']==[[i]+[r]for i,r in enumerate(c['polynomialProduct'])])

from pathlib import Path
import subprocess,shutil,tempfile
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
STAGING=len(sys.argv)>1
JS=Path(sys.argv[1]).resolve()if STAGING else ROOT/'course-shared/labs/galois-insolvability.js'
FIXTURE=(Path(sys.argv[2]).resolve()if len(sys.argv)>2 else None)if STAGING else ROOT/'course-shared/projects/galois-insolvability/run-snapshot.json'
DRIVER="const L=require(process.argv[2]),fs=require('fs'),assert=require('assert');const states=[],views=[];\nconst inputs=L.PRESETS.map(p=>p.values);for(let n=2;n<=5;n++)for(let k=0;k<12;k++)inputs.push({coefficients:Array.from({length:n},(_,j)=>((j+3)*(k+5)+n)%17-8).concat(1).join(',')});\nfor(const p of L.PRIMES)inputs.push({prime:String(p),evidencePrimes:String(p),useReal:'no',useDiscriminant:'no',useConstruction:'no'});\nfor(const useReal of ['yes','no'])for(const useDiscriminant of ['yes','no'])for(const useConstruction of ['yes','no'])inputs.push({useReal,useDiscriminant,useConstruction});\nfor(const coefficients of ['-32,0,0,0,0,1','32,0,0,0,0,1','32,-32,32,-32,32,1','-32,32,1','1,0,-2,0,1'])inputs.push({coefficients});\nlet models=null;function append(s){models=s.candidateModels;delete s.candidateModels;const again={...s,candidateModels:models};states.push(s);const plots=L.plots(again),tables=L.ledgers(again);views.push({plots,svgs:plots.map(L.svg),tables});}\nfor(const input of inputs)append(L.snapshot(input));const live=states.length;\nif(process.argv[3]&&process.argv[3]!=='-'){const f=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));for(const key of ['insufficient','nonsolvable','binomial','alternating']){const s=L.snapshot(f[key].parameters);assert.equal(JSON.stringify(s),JSON.stringify(f[key]),'frozen replay '+key);append(s);}}\nconst invalid=[null,[],1,'bad',{unknown:'1'},{coefficients:1},{coefficients:''},{coefficients:'1,1'},{coefficients:'1,0,0,0,0,0,1'},{coefficients:'1,0,2'},{coefficients:'33,0,1'},{coefficients:'-33,0,1'},{coefficients:'1,0,1.0'},{coefficients:'1, 0,1'},{coefficients:'1/2,0,1'},{coefficients:'01,0,1'},{coefficients:'+1,0,1'},{coefficients:'1e1,0,1'},{coefficients:'NaN,0,1'},{coefficients:'1,0,1,'},{coefficients:'1,0,-1'},{prime:2},{prime:'4'},{prime:'31'},{prime:'02'},{prime:''},{evidencePrimes:[]},{evidencePrimes:'2,2'},{evidencePrimes:'2,4'},{evidencePrimes:'2,31'},{evidencePrimes:'2, 3'},{evidencePrimes:'2,'},{evidencePrimes:'02'},{evidencePrimes:'0'},{useReal:true},{useReal:'YES'},{useDiscriminant:false},{useDiscriminant:null},{useConstruction:1},{useConstruction:'maybe'},{bits:8},{bits:'3'},{bits:'13'},{bits:'8.0'},{bits:'08'},{bits:'-1'}];for(const p of invalid)assert.throws(()=>L.snapshot(p),'must reject '+JSON.stringify(p));\nconst before=L.snapshot(),copy=JSON.stringify(before);before.polynomial.coefficients[0]=99;before.polynomial.rational.factors[0][0]='999';before.polynomial.real.nodes[0].count=99;before.candidateModels[0].permutations[0][0]=99;before.classification.remaining.length=0;assert.equal(JSON.stringify(L.snapshot()),copy,'snapshot mutation cannot poison caches');\nconst self=L.selfTest();assert.equal(self.checks,62);const bundle={models,states,views,invalid:invalid.length,mutationGuards:5,self,live,frozen:states.length-live};fs.writeFileSync(process.argv[4]||'bundle160.json',JSON.stringify(bundle));console.log(JSON.stringify({live,frozen:bundle.frozen,invalid:invalid.length,self:self.checks}));\n"
with tempfile.TemporaryDirectory()as td:
 script=Path(td)/'driver.cjs';out=Path(td)/'bundle.json';script.write_text(DRIVER)
 subprocess.run(PREFIX+['node',str(script),str(JS),str(FIXTURE)if FIXTURE else '-',str(out)],check=True,stdout=subprocess.DEVNULL)
 bundle=json.loads(out.read_text())
verify_bundle(bundle);verify_views(bundle)
ck(bundle['live']==99 and bundle['invalid']==46 and bundle['mutationGuards']==5 and bundle['self']=={'status':'PASS','checks':62,'presets':28})
# Publication contract, appended after the scientific and view checks.
import re,html,hashlib
from html.parser import HTMLParser
if FIXTURE is not None:
 f=json.loads(FIXTURE.read_text());ck(f['schema']==1);ck(f['provenance']=={'date':'2026-09-11','node':'v24.14.0','platform':'darwin','arch':'arm64','jsSha256':hashlib.sha256(JS.read_bytes()).hexdigest()});ck(bundle['frozen']==4)
if not STAGING:
 src=(ROOT/'grad-math/lectures/alg2-03-insolvability.md').read_text();site=(ROOT/'grad-math/site/alg2-03-insolvability.html').read_text()
 formulas=[(a or b).strip()for a,b in re.findall(r'\$\$(.*?)\$\$|(?<!\\)\$(?!\$)(.*?)(?<!\\)\$(?!\$)',src,re.S)]
 actual=[html.unescape(a or b).strip()for a,b in re.findall(r'<(?:span|div) class="arithmatex">(?:\\\((.*?)\\\)|\\\[(.*?)\\\])</(?:span|div)>',site,re.S)]
 ck(formulas==actual,'source formulas reach HTML in order');ck(len(re.findall(r'^## [0-9]+\.',src,re.M))==12);ck(not re.search(r'<p>\s*<details|</details>\s*</p>',site))
 class Disclosure(HTMLParser):
  def __init__(self):super().__init__();self.stack=[];self.answers=0
  def handle_starttag(self,tag,attrs):
   if tag=='details':
    ck(not self.stack);kind=dict(attrs).get('class');ck(kind in ['answer','page-toc']);self.stack.append([kind,0]);self.answers+=kind=='answer'
   if tag=='summary':ck(bool(self.stack));self.stack[-1][1]+=1
  def handle_endtag(self,tag):
   if tag=='details':ck(bool(self.stack));ck(self.stack.pop()[1]==1)
 parser=Disclosure();parser.feed(re.search(r'<article[^>]*>(.*?)</article>',site,re.S).group(1));ck(parser.answers==4 and not parser.stack)
 for link in re.findall(r'(?:href|src)="([^"]+)"',site):
  target=link.split('#')[0].split('?')[0]
  if target and not re.match(r'^[a-zA-Z]+:',target)and not target.startswith('/'):ck((ROOT/'grad-math/site'/target).exists(),'local target '+target)
 for course in ['ai-course','grad-math','math-course']:ck((ROOT/course/'site/assets/learning/labs/galois-insolvability.js').read_bytes()==JS.read_bytes())
 ck((ROOT/'grad-math/site/assets/learning/projects/galois-insolvability/run-snapshot.json').read_bytes()==FIXTURE.read_bytes());ck((ROOT/'.github/workflows/course-audit.yml').read_text().count('python tools/check_galois_insolvability_full.py')==1)
 image=ROOT/'grad-math/images/alg2-03-insolvability-ledgers.svg';ck(image.read_bytes()==(ROOT/'grad-math/site/assets/img/alg2-03-insolvability-ledgers.svg').read_bytes());root=ET.parse(image).getroot();ck(root.attrib['viewBox']=='0 0 1000 2300');panels=root.findall('.//{http://www.w3.org/2000/svg}svg');ck(len(panels)==4)
 def compare(a,b):
  ck(a.tag==b.tag and set(a.attrib)==set(b.attrib));ck(a.text==b.text and a.tail==b.tail)
  for k,v in a.attrib.items():
   if k in ['x','y','x1','y1','x2','y2','cx','cy','r','width','height']:ck(abs(float(v)-float(b.attrib[k]))<1e-9)
   else:ck(v==b.attrib[k])
  ck(len(a)==len(b))
  for x,y in zip(a,b):compare(x,y)
 for i,(p,k)in enumerate(zip(panels,[1,2,3,0])):
  ck(p.attrib.pop('x')=='50'and p.attrib.pop('y')==str([85,640,1195,1750][i]));compare(p,ET.fromstring(bundle['views'][-4+i]['svgs'][k]))
 table=re.search(r'data-learning-lab="galois-insolvability".*?<tbody>(.*?)</tbody>',site,re.S).group(1);vals=[html.unescape(x).strip()for x in re.findall(r'<tr>\s*<td>.*?</td>\s*<td[^>]*>(.*?)</td>\s*</tr>',table,re.S)]
 a=f['insufficient'];b=f['nonsolvable'];c=f['binomial'];d=f['alternating'];refs=[a['polynomial']['degree'],'、'.join(a['classification']['remaining']),'证据不足',b['polynomial']['real']['rootCount'],b['polynomial']['real']['leftVariation'],b['polynomial']['real']['rightVariation'],b['polynomial']['discriminant']['value'],b['classification']['exactGroup'],'否',c['polynomial']['construction']['ambientDegree'],len(c['polynomial']['construction']['roots']),c['classification']['exactGroup'],'是',d['polynomial']['discriminant']['value'],d['polynomial']['discriminant']['square']['root'],d['classification']['exactGroup'],'否']
 for id in b['polynomial']['real']['leaves']:
  t=b['polynomial']['real']['nodes'][id];refs.append('('+t['left']+', '+t['right']+']')
 ck(len(vals)==len(refs)==20)
 for v,r in zip(vals,refs):ck(v==str(r),'fallback exact value')
 for word in ['证据不足','所有共轭','平方','(left,right]']:
  ck(word in (src if word!='(left,right]'else FIXTURE.read_text()))
 with tempfile.TemporaryDirectory()as td:
  out=Path(td)/'figure.svg';fallback=Path(td)/'fallback.md';subprocess.run(PREFIX+['python3',str(ROOT/'tools/build_galois_insolvability_figure.py'),str(JS),str(out),str(FIXTURE),str(fallback)],check=True,stdout=subprocess.DEVNULL)
  # Cross-platform trig coordinates may differ below a nanometre of a screen pixel.
  compare(ET.parse(image).getroot(),ET.parse(out).getroot());ck(fallback.read_text()in src)
 print('formulas='+str(len(formulas)))
print(json.dumps({'status':'PASS','live':bundle['live'],'frozen':bundle['frozen'],'checks':checks,'invalid':bundle['invalid'],'mutationGuards':bundle['mutationGuards'],'self':bundle['self']['checks']}))
