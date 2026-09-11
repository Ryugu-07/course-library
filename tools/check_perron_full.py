"""Independent nonnegative-matrix identities, exact certificates and publication."""
from pathlib import Path
from fractions import Fraction as F
from decimal import Decimal as D,localcontext
import subprocess,shutil,json,math,sys,re,html,hashlib,itertools,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/perron-frobenius.js'
code=r'''
const a=require(process.argv[1]),cs=a.PRESETS.map(p=>p.values);let invalid=0;
for(const t of [0,1e-12,.25,2])for(const u of [0,1e-12,1,4])for(const scaleExponent of [-6,6])cs.push({a:t,b:u,c:t,d:u,scaleExponent,steps:16});
for(const w1 of [1e-6,.5,4])for(const w2 of [1e-6,2])for(const shift of [0,1e-12,1])for(const scaleExponent of [-6,6])cs.push({mode:"cycle",w1,w2,w3:.25,shift,scaleExponent,steps:12});
for(const network of ["cycle","closed","dangling"])for(const alpha of [0,.5,1023/1024,1])for(const lazy of [0,.5,1])cs.push({mode:"markov",network,alpha,lazy,teleport1:.25,teleport2:.75,mass1:0,mass2:.5,steps:12});
for(const [c,keys]of [[{},["a","b","c","d","x1","x2","steps","scaleExponent"]],[{mode:"cycle"},["w1","w2","w3","shift","x1","x2","x3","steps","scaleExponent"]],[{mode:"markov"},["alpha","lazy","teleport1","teleport2","mass1","mass2","steps"]]]){
 for(const k of keys)for(const v of ["",null,true,false,[],{},NaN,Infinity,-Infinity,"0x10","2x","1e309","1e-400"]){let bad=false;try{a.config({...c,[k]:v});}catch(e){bad=true;}if(!bad)throw Error("invalid "+k);invalid++;}
}
for(const p of [null,[],{mode:"x"},{a:-1},{d:5},{a:1e-15},{x1:0,x2:0},{x1:5},{steps:65},{steps:.5},{scaleExponent:7},{scaleExponent:.5},{mode:"cycle",w1:0},{mode:"cycle",w2:1e-7},{mode:"cycle",x2:-1},{mode:"markov",network:"bad"},{mode:"markov",alpha:.1},{mode:"markov",alpha:2},{mode:"markov",teleport1:1,teleport2:.5},{mode:"markov",mass1:1,mass2:1}]){
 let bad=false;try{a.config(p);}catch(e){bad=true;}if(!bad)throw Error("boundary");invalid++;
}
a.snapshot({mode:"markov",a:null,scaleExponent:"",x1:[]});a.snapshot({mode:"cycle",a:null,alpha:""});a.snapshot({alpha:null,w1:""});
console.log(JSON.stringify({invalid,self:a.selfTest(),states:cs.map((c,i)=>{const d=a.snapshot(c);return i<a.PRESETS.length?{...d,plots:a.plots(d),ledgers:a.ledgers(d),svgs:a.plots(d).map(a.svg)}:d;})}));
'''
data=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve())],text=True),parse_int=float);checks=0
def ck(v,m):
 global checks
 assert v,m;checks+=1
def close(a,b,m,scale=1,tol=4e-12):
 b=float(b);ck(type(a)in[int,float]and math.isfinite(a)and abs(a-b)<=tol*max(scale,abs(b)),(m,a,b,scale))
def vec(a,b,m,**kw):
 ck(len(a)==len(b),m+' length')
 for x,y in zip(a,b):close(x,y,m,**kw)
def mat(a,b,m,**kw):
 ck(len(a)==len(b),m+' rows')
 for x,y in zip(a,b):vec(x,y,m,**kw)
def dot(x,y):return sum(a*b for a,b in zip(x,y))
def mv(A,x):return[dot(r,x)for r in A]
def tr(A):return list(map(list,zip(*A)))
def mm(A,B):return[[dot(r,c)for c in tr(B)]for r in A]
def sub(A,B):return[[a-b for a,b in zip(r,s)]for r,s in zip(A,B)]
def eye(n):return[[int(i==j)for j in range(n)]for i in range(n)]
def mul(A,s):return[[x*s for x in r]for r in A]
def l1(x):return sum(abs(v)for v in x)
def qmat(A):return[[F(x)for x in r]for r in A]
def frac(q):
 f=F(int(q['numerator']),int(q['denominator']));ck(str(f.numerator)==q['numerator']and str(f.denominator)==q['denominator'],'reduced positive denominator')
 close(q['value'],f,'fraction approximate display',scale=max(abs(float(f)),1e-300),tol=8e-16);return f
def qvec(v):return[frac(q)for q in v]
def graph_check(A,g):
 n=len(A);edges=[{'from':j,'to':i,'weight':A[i][j]}for j in range(n)for i in range(n)if A[i][j]>0]
 ck(g['edges']==edges,'column-oriented actual edges')
 reach=[]
 for i in range(n):
  seen={i};front=[i]
  for u in front:
   for e in edges:
    if e['from']==u and e['to']not in seen:seen.add(e['to']);front.append(e['to'])
  reach.append([j in seen for j in range(n)])
 ck(reach==g['reach'],'all actual reachability')
 groups=[];used=set()
 for i in range(n):
  if i not in used:
   group=[j for j in range(n)if reach[i][j]and reach[j][i]];used.update(group);groups.append(group)
 ck([q['vertices']for q in g['classes']]==groups,'SCC partition')
 for group,cl in zip(groups,g['classes']):
  cycles=[]
  for size in range(1,len(group)+1):
   for p in itertools.permutations(group,size):
    if all(A[p[(i+1)%size]][p[i]]>0 for i in range(size)):cycles.append(size)
  period=math.gcd(*cycles)if cycles else None
  ck(cl['period']==period,'period from complete simple cycles')
  ck(cl['closed']==(not any(e['from']in group and e['to']not in group for e in edges)),'closed classes')
  ck(cl['matrix']==[[A[i][j]for j in group]for i in group],'SCC full matrix')
  ds=[None]*n;ds[group[0]]=0;front=[group[0]]
  for u in front:
   for e in edges:
    if e['from']==u and e['to']in group and ds[e['to']]is None:ds[e['to']]=ds[u]+1;front.append(e['to'])
  ck(cl['distances']==ds,'BFS distances')
  ck(cl['periodEdges']==[{**e,'difference':ds[e['from']]+1-ds[e['to']]}for e in edges if e['from']in group and e['to']in group],'each gcd edge')
 ck(g['irreducible']==(len(groups)==1),'irreducible')
 ck(g['period']==(g['classes'][0]['period']if len(groups)==1 else None),'global period')
 ck(g['primitive']==(len(groups)==1 and g['period']==1),'primitive')
 ck(g['positive']==all(x>0 for row in A for x in row),'positive')
def power_check(A,r,steps):
 scale=max([abs(x)for row in A for x in row]+[1e-300]);x=[v/l1(r['initial'])for v in r['initial']]
 ck(r['normalization']=='l1','normalization')
 for k,row in enumerate(r['rows']):
  ck(row['k']==k,'power step');vec(row['x'],x,'actual normalized state')
  # Compute downstream checks from the actual stored input, not a drifting replay.
  xx=row['x'];ax=mv(A,xx);vec(row['ax'],ax,'actual Ax',scale=scale);growth=l1(ax);close(row['growth'],growth,'growth',scale=scale)
  q=mv(qmat(A),list(map(F,xx)))
  if all(v>0 for v in xx):
   ratios=[z/F(v)for z,v in zip(q,xx)];cw=row['collatz'];ck(cw is not None,'CW present')
   ck(qvec(cw['ratios'])==ratios,'all exact CW ratios');ck(frac(cw['lower'])==min(ratios),'CW lower');ck(frac(cw['upper'])==max(ratios),'CW upper');ck(frac(cw['width'])==max(ratios)-min(ratios),'CW width');vec(cw['ax'],ax,'CW actual multiplication',scale=scale)
  else:ck(row['collatz']is None,'CW outside positive cone')
  if r['target']is not None:close(row['targetError'],l1([a-b for a,b in zip(xx,r['target'])]),'reference error')
  else:ck(row['targetError']is None,'missing reference')
  if not growth:
   ck(row['next']is None and row['delta']is None and r['stopped']and k==len(r['rows'])-1,'stop on exact zero');break
  x=[v/growth for v in ax];vec(row['next'],x,'actual next state');close(row['delta'],l1([a-b for a,b in zip(x,xx)]),'successive difference')
 else:ck(not r['stopped']and len(r['rows'])==steps+1,'complete finite window')
def two_check(p,r):
 scale=10**p['scaleExponent'];A=mul([[p['a'],p['b']],[p['c'],p['d']]],scale);ck(r['A']==A,'actual two matrix');a,b=A[0];c,d=A[1]
 determinant=F(a)*F(d)-F(b)*F(c);ck(frac(r['determinant'])==determinant,'exact determinant')
 with localcontext()as ctx:
  ctx.prec=85;aa,bb,cc,dd=map(D,[a,b,c,d]);disc=((aa-dd)**2+4*bb*cc).sqrt();roots=[(aa+dd+disc)/2,(aa+dd-disc)/2]
 close(r['rho'],roots[0],'positive root',scale=scale*1e-18,tol=2e-15)
 close(r['other'],roots[1],'stable other root',scale=scale*1e-18,tol=2e-15)
 close(r['discriminant'],disc,'root difference',scale=scale*1e-18,tol=2e-15)
 dim=2 if a==d and b==c==0 else 1;mult=2 if a==d and b*c==0 else 1
 ck(r['dimension']==dim and r['algebraicMultiplicity']==mult and r['simple']==(mult==1),'exact dimension/multiplicity')
 branch='irreducible'if b>0 and c>0 else'first-dominant'if a>d else'second-dominant'if d>a else'jordan-upper'if b>0 else'jordan-lower'if c>0 else'scalar'
 ck(r['caseName']==branch,'structural branch')
 for name,M in [('right',A),('left',tr(A))]:
  ck(len(r[name])==dim,'whole eigenspace basis')
  for v,res in zip(r[name],r[name+'Residuals']):
   close(l1(v),1,'basis normalization',tol=3e-15);ck(all(z>=0 for z in v),'nonnegative basis')
   actual=[z-r['rho']*w for z,w in zip(mv(M,v),v)];vec(res,actual,'reported eigen residual',scale=scale)
   ck(math.hypot(*actual)<=3e-14*max(scale,math.hypot(*sum(A,[]))),'small actual eigensolution residual')
 ck(r['rightSupport']==[[i for i,v in enumerate(w)if v>0]for w in r['right']],'strict support')
 graph_check(A,r['graph'])
 critical=[0]if r['graph']['irreducible']else[i for i,q in enumerate(r['graph']['classes'])if q['matrix'][0][0]==r['rho']]
 ck(r['criticalClasses']==critical,'critical SCCs')
 if r['projection']is not None:
  if a>d:w=[F(a)-F(d),F(b)]
  elif d>a:w=[F(c),F(d)-F(a)]
  else:w=[F(1),F(1)]
  ck(frac(r['projection'])==dot(w,list(map(F,[p['x1'],p['x2']]))),'exact special-case left projection')
 if mult==1:close(r['approximateProjection'],dot(r['left'][0],[p['x1'],p['x2']]),'approximate left projection')
 else:ck(r['approximateProjection']is None and r['projection']is None,'Jordan has no simple projector')
 if r['rho']:close(r['subdominantRatio'],abs(r['other'])/r['rho'],'ratio')
 else:ck(r['subdominantRatio']is None,'zero rho ratio')
 ck(r['theoremNonnegative']==(r['graph']['primitive']and p['x1']>=0 and p['x2']>=0),'nonnegative starting theorem')
 S=[[x+(scale if i==j else 0)for j,x in enumerate(row)]for i,row in enumerate(A)];ck(r['shiftedMatrix']==S,'scale covariant shift')
 power_check(A,r['power'],int(p['steps']));power_check(S,r['shifted'],int(p['steps']))
def cycle_check(p,r):
 scale=10**p['scaleExponent'];N=mul([[0,0,p['w3']],[p['w1'],0,0],[0,p['w2'],0]],scale);diagonal=p['shift']*scale;A=[[x+(diagonal if i==j else 0)for j,x in enumerate(row)]for i,row in enumerate(N)]
 ck(r['A']==A and r['N']==N,'weighted cycle actual matrices');graph_check(A,r['graph'])
 product=F(N[1][0])*F(N[2][1])*F(N[0][2]);ck(frac(r['exactProduct'])==product,'exact cycle product')
 with localcontext()as ctx:
  ctx.prec=80;z=D(product.numerator)/D(product.denominator);beta=z**(D(1)/D(3))
 close(r['beta'],beta,'cycle cube root',scale=scale*1e-20,tol=2e-15);close(r['rho'],beta+D(diagonal),'cycle spectral radius',scale=scale*1e-20,tol=2e-15)
 roots=[complex(float(beta)),complex(-float(beta)/2,math.sqrt(3)*float(beta)/2),complex(-float(beta)/2,-math.sqrt(3)*float(beta)/2)]
 for z,ev in zip(r['eigen'],roots):
  lam=ev+diagonal;close(z['lambda']['re'],lam.real,'full spectrum real',scale=scale);close(z['lambda']['im'],lam.imag,'full spectrum imag',scale=scale)
  v=[complex(t['re'],t['im'])for t in z['vector']];actualLambda=complex(z['lambda']['re'],z['lambda']['im']);av=mv(A,v);res=[x-actualLambda*y for x,y in zip(av,v)]
  close(math.sqrt(sum(abs(x)**2 for x in v)),1,'complex vector norm',tol=3e-15)
  for key,ref in [('av',av),('residual',res)]:
   vec([t['re']for t in z[key]],[x.real for x in ref],'complex '+key+' real',scale=scale)
   vec([t['im']for t in z[key]],[x.imag for x in ref],'complex '+key+' imag',scale=scale)
  close(z['residualNorm'],math.sqrt(sum(abs(x)**2 for x in res)),'complex residual norm',scale=scale)
  ck(math.sqrt(sum(abs(x)**2 for x in res))<1e-12*scale,'complex residual small')
  close(z['modulus'],abs(actualLambda),'actual modulus',scale=scale)
 cube=mm(mm(N,N),N);pred=mul(eye(3),r['product']);mat(r['cube'],cube,'cube',scale=scale**3);mat(r['predictedCube'],pred,'predicted cube',scale=scale**3);mat(r['cubeGap'],sub(cube,pred),'cube defect',scale=scale**3)
 close(r['cubeGapNorm'],math.hypot(*sum(r['cubeGap'],[])),'cube defect norm',scale=scale**3)
 for name,M in [('right',A),('left',tr(A))]:
  vec(r[name+'Residual'],[x-r['rho']*v for x,v in zip(mv(M,r[name]),r[name])],'cycle '+name+' residual',scale=scale)
  close(l1(r[name]),1,'cycle l1 normalized');ck(all(x>0 for x in r[name]),'positive cycle vector')
 S=[[x+(scale if i==j else 0)for j,x in enumerate(row)]for i,row in enumerate(A)];ck(r['shiftedMatrix']==S,'cycle shifted matrix')
 power_check(A,r['power'],int(p['steps']));power_check(S,r['shifted'],int(p['steps']))
def markov_check(p,r):
 v=[p['teleport1'],p['teleport2'],1-p['teleport1']-p['teleport2']];initial=[p['mass1'],p['mass2'],1-p['mass1']-p['mass2']]
 bases={'cycle':[[0,0,1],[1,0,0],[0,1,0]],'closed':[[1,0,0],[0,1,1],[0,0,0]],'dangling':[[0,0,0],[1,0,0],[0,1,0]]};raw=bases[p['network']];dangling=[all(raw[i][j]==0 for i in range(3))for j in range(3)]
 comp=[[v[i]if dangling[j]else raw[i][j]for j in range(3)]for i in range(3)];lazy=p['lazy'];alpha=p['alpha']
 P=[[(1-lazy)*comp[i][j]+(lazy if i==j else 0)for j in range(3)]for i in range(3)]
 G=[[alpha*P[i][j]+(1-alpha)*v[i]for j in range(3)]for i in range(3)];B=[[int(i==j)-alpha*P[i][j]for j in range(3)]for i in range(3)];b=[(1-alpha)*x for x in v]
 for key,val in [('raw',raw),('dangling',dangling),('completed',comp),('P',P),('G',G),('B',B),('b',b),('v',v),('initial',initial)]:ck(r[key]==val,'Markov '+key)
 graph_check(P,r['graph']);graph_check(G,r['googleGraph'])
 ck(all(sum(col)==1 for col in tr(qmat(P))),'exact P stochastic');ck(qvec(r['colSums'])==[F(1)]*3 and r['stochasticExact'],'exact G stochastic')
 # Independently reproduce exact row-equivalence trace and test the resulting equations.
 R=[row+[F(z)]for row,z in zip(qmat(B),b)];trace=r['solve']['trace'];ck([[frac(v)for v in row]for row in trace[0]['matrix']]==R,'RREF input');row=0;pivots=[]
 for col in range(3):
  nz=next((i for i in range(row,3)if R[i][col]),None)
  if nz is None:continue
  R[row],R[nz]=R[nz],R[row];pivot=R[row][col];R[row]=[x/pivot for x in R[row]]
  for i in range(3):
   if i!=row:
    factor=R[i][col];R[i]=[x-factor*y for x,y in zip(R[i],R[row])]
  z=trace[row+1];ck(z['row']==row and z['col']==col and z['swapped']==nz and frac(z['pivot'])==pivot,'RREF pivot')
  ck([[frac(v)for v in rr]for rr in z['matrix']]==R,'every exact elimination matrix');pivots.append(col);row+=1
 ck(r['solve']['rank']==row and r['solve']['pivots']==pivots and len(trace)==row+1,'exact rank trace')
 ck(r['solve']['consistent']and r['solve']['unique']==(row==3),'consistent linear system')
 pi=[rr[-1]for rr in R]if row==3 else None
 if pi:
  ck(qvec(r['solve']['solution'])==pi and mv(qmat(B),pi)==list(map(F,b)),'exact PageRank solution')
  ck(sum(pi)==1 and all(x>=0 for x in pi),'exact probability solution')
 else:ck(r['solve']['solution']is None,'no unnormalized unique solution')
 ck(r['contraction']==(alpha if alpha<1 else None),'contraction boundary')
 x=initial[:]
 for k,z in enumerate(r['rows']):
  ck(z['k']==k,'PageRank step');vec(z['x'],x,'affine trajectory')
  xx=z['x'];px=mv(P,xx);nxt=[alpha*a+(1-alpha)*vv for a,vv in zip(px,v)];gx=mv(G,xx)
  for key,value in [('px',px),('linearNext',nxt),('matrixNext',gx),('matrixGap',[a-b for a,b in zip(gx,nxt)]),('fixedResidual',[a-b for a,b in zip(nxt,xx)])]:vec(z[key],value,'actual '+key,tol=3e-15)
  qx=list(map(F,xx));qres=[bb-y for bb,y in zip(map(F,b),mv(qmat(B),qx))];rn=l1(qres)
  ck(qvec(z['exactResidual'])==qres and frac(z['residualNorm'])==rn,'exact stored candidate residual')
  ck(frac(z['mass'])==sum(qx)and frac(z['massDefect'])==sum(qx)-1,'exact candidate mass')
  fx=[F(alpha)*y+(1-F(alpha))*F(vv)for y,vv in zip(mv(qmat(P),qx),v)]
  ck(qvec(z['arithmeticDefect'])==[F(t)-y for t,y in zip(z['linearNext'],fx)],'one-step actual arithmetic defect')
  if alpha<1:
   err=l1([a-b for a,b in zip(qx,pi)]);bound=rn/(1-F(alpha));ck(frac(z['error'])==err and frac(z['bound'])==bound and err<=bound,'rigorous actual residual error bound')
  else:ck(z['error']is None and z['bound']is None,'alpha one no residual theorem')
  x=nxt
 ck(len(r['rows'])==p['steps']+1,'all PageRank steps')
 x=initial[:];av=[0]*3
 for k,z in enumerate(r['rawRows']):
  av=[(k*a+b)/(k+1)for a,b in zip(av,x)];nxt=mv(P,x)
  ck(z['k']==k,'raw step')
  for key,value in [('x',x),('next',nxt),('average',av),('averageResidual',[a-b for a,b in zip(mv(P,av),av)])]:vec(z[key],value,'raw '+key,tol=3e-15)
  close(z['delta'],l1([a-b for a,b in zip(nxt,x)]),'raw change',tol=3e-15);ck(frac(z['mass'])==sum(map(F,z['x'])),'raw mass');x=nxt
def science(d):
 p=d['parameters'];r=d['result']
 if p['mode']=='two':two_check(p,r)
 elif p['mode']=='cycle':cycle_check(p,r)
 else:markov_check(p,r)
for d in data['states']:science(d)
print('science stage: PASS',checks)
def expected_series(d):
 p=d['parameters'];r=d['result'];mode=p['mode'];last=max(1,p['steps'])
 def positive(rows,get):return[[z['k'],math.log10(get(z))]for z in rows if get(z)is not None and get(z)>0]
 if mode!='markov':
  n=len(r['A']);out=[
   None,
   {f'x{i}':[[z['k'],z['x'][i]]for z in r['power']['rows']]for i in range(n)},
   {'raw':positive(r['power']['rows'],lambda z:z['targetError']),'shifted':positive(r['shifted']['rows'],lambda z:z['targetError'])},
   {'lower':[[z['k'],z['collatz']['lower']['value']/r['scale']]for z in r['power']['rows']if z['collatz']],
    'upper':[[z['k'],z['collatz']['upper']['value']/r['scale']]for z in r['power']['rows']if z['collatz']],
    'rho':[[0,r['rho']/r['scale']],[last,r['rho']/r['scale']]]}]
  if mode=='cycle':out.insert(1,{'eigen':[[z['lambda']['re']/r['rho'],z['lambda']['im']/r['rho']]for z in r['eigen']]})
  return out
 return[None,None,
  {'raw':[[z['k'],z['x'][0]]for z in r['rawRows']],'average':[[z['k'],z['average'][0]]for z in r['rawRows']]},
  {f'x{i}':[[z['k'],z['x'][i]]for z in r['rows']]for i in range(3)},
  {'error':positive(r['rows'],lambda z:z['error']['value']if z['error']else None),'bound':positive(r['rows'],lambda z:z['bound']['value']if z['bound']else None),'residual':positive(r['rows'],lambda z:z['residualNorm']['value'])},
  {'mass':positive(r['rows'],lambda z:abs(z['massDefect']['value'])),'arithmetic':positive(r['rows'],lambda z:l1([q['value']for q in z['arithmeticDefect']]))}]
def svg_check(raw,q):
 e=ET.fromstring(raw)if isinstance(raw,str)else raw;ns={'s':'http://www.w3.org/2000/svg'}
 ck(e.get('width')=='900'and e.get('height')=='425','native readable dimensions')
 ck(e.find('s:title',ns).text==q['title'],'accessible title')
 if q.get('type')=='network':
  edges=e.findall('s:path[@data-edge]',ns);polys=e.findall('s:polygon',ns);labels=e.findall('s:text[@data-edge-weight]',ns)
  ck(len(edges)==len(polys)==len(labels)==len(q['edges']),'all graph edges/arrows/labels')
  for k,(edge,line,poly,label)in enumerate(zip(q['edges'],edges,polys,labels)):
   i=int(edge['from']);j=int(edge['to']);x,y=q['nodes'][i];u,v=q['nodes'][j]
   ck(line.get('data-from')==str(i)and line.get('data-to')==str(j)and line.get('data-edge')==str(k),'arrow orientation')
   if i==j:
    ref=[x-13,y-20,x-75,y-105,x+75,y-105,x+13,y-20];cx,cy=x,y-90;tip=[x+13,y-20];direction=[-62,85];ck('C'in line.get('d'),'visible self loop')
   else:
    dx=u-x;dy=v-y;n=math.hypot(dx,dy);a=[x+23*dx/n,y+23*dy/n];b=[u-23*dx/n,v-23*dy/n];control=[(x+u)/2-36*dy/n,(y+v)/2+36*dx/n];ref=a+control+b
    cx=(a[0]+2*control[0]+b[0])/4-12*dy/n;cy=(a[1]+2*control[1]+b[1])/4+12*dx/n;tip=b;direction=[b[0]-control[0],b[1]-control[1]];ck('Q'in line.get('d'),'separated opposite directions')
   nums=list(map(float,re.findall(r'[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?',line.get('d'),re.I)));vec(nums,ref,'full graph path',tol=1e-12)
   close(float(label.get('x')),cx,'edge label x',tol=1e-12);close(float(label.get('y')),cy,'edge label y',tol=1e-12);close(float(label.text),edge['weight'],'actual edge weight text',scale=max(edge['weight'],1e-300),tol=5e-9)
   dx,dy=direction;n=math.hypot(dx,dy);dx/=n;dy/=n;xx,yy=tip;ref=tip+[xx-10*dx+4*dy,yy-10*dy-4*dx,xx-10*dx-4*dy,yy-10*dy+4*dx]
   vec(list(map(float,re.split('[ ,]+',poly.get('points')))),ref,'visible arrow polygon',tol=1e-12)
  for node,(x,y)in zip(e.findall('s:circle[@data-node]',ns),q['nodes']):
   close(float(node.get('cx')),x,'node x');close(float(node.get('cy')),y,'node y');ck(float(node.get('r'))==22,'node size')
  return
 left,width=(325,250)if q['square']else(100,750);X=lambda v:left+width*(v-q['xmin'])/(q['xmax']-q['xmin']);Y=lambda v:335-250*(v-q['ymin'])/(q['ymax']-q['ymin'])
 nodes=e.findall('s:circle[@data-series]',ns);ck(len(nodes)==sum(len(s['points'])for s in q['series']),'all scientific points')
 for s in q['series']:
  pts=[v for v in nodes if v.get('data-series')==s['key']];ck(len(pts)==len(s['points']),'series all points')
  for k,(node,(x,y))in enumerate(zip(pts,s['points'])):
   ck(node.get('data-index')==str(k),'ordered point index');close(float(node.get('cx')),X(x),'point x',tol=1e-12);close(float(node.get('cy')),Y(y),'point y',tol=1e-12);ck(node.get('fill')==s['color'],'series color')
  lines=[v for v in e.findall('s:polyline',ns)if v.get('data-series')==s['key']]
  ck(len(lines)==int(s['line']),'line/points policy')
  if lines:
   nums=list(map(float,re.split('[ ,]+',lines[0].get('points'))))if lines[0].get('points')else[]
   vec(nums,[z for x,y in s['points']for z in [X(x),Y(y)]],'all connecting coordinates',tol=1e-12)
def flattened(v):
 if isinstance(v,dict):
  if 'numerator'in v and 'denominator'in v:return[(v['value'],v['numerator']+'/'+v['denominator'])]
  return list(itertools.chain.from_iterable(flattened(x)for x in v.values()))
 if isinstance(v,list):return list(itertools.chain.from_iterable(flattened(x)for x in v))
 return[(v,'')]
def view_check(d):
 q=d['plots'];p=d['parameters'];r=d['result'];expected=expected_series(d);ck(len(q)==len(expected),'complete plot count')
 for i,(spec,points)in enumerate(zip(q,expected)):
  if points is None:
   g=r['googleGraph']if p['mode']=='markov'and i==1 else r['graph']
   ck(spec['type']=='network'and spec['edges']==g['edges'],'graph uses actual computed edges')
   ck(spec['nodes']==([[260,230],[640,230]]if len(g['reach'])==2 else[[450,180],[240,330],[660,330]]),'fixed visible graph layout')
  else:
   ck([z['key']for z in spec['series']]==list(points),'all expected series')
   for z in spec['series']:
    mat(z['points'],points[z['key']],'record-to-chart mapping',tol=3e-14)
    ck(z['line']==(z['key']!='eigen'),'explicit line policy')
   if spec['square']:
    ck(spec['xmin']==spec['ymin']==-1.2 and spec['xmax']==spec['ymax']==1.2,'equal-unit complex axes')
   else:
    ck(spec['xmin']==0 and spec['xmax']==max(1,p['steps']),'finite iteration domain')
    ys=[z[1]for s in spec['series']for z in s['points']]
    if not spec['y'].startswith('log₁₀'):ys=[0]+ys
    lo=min(ys)if ys else 0;hi=max(ys)if ys else 0;pad=(hi-lo or 1)*.08
    close(spec['ymin'],lo-pad,'unclipped minimum');close(spec['ymax'],hi+pad,'unclipped maximum')
  ck(bool(spec['title']),'plot title');svg_check(d['svgs'][i],spec)
 tables={t['key']:t for t in d['ledgers']};ck(len(tables)==len(d['ledgers']),'unique ledger identifiers')
 # Every scalar of these complete records must appear, including exact fractions.
 records={'structure':r['graph'],'power':r['power'],'shifted':r['shifted']}if p['mode']!='markov'else{'structure':{'P':r['graph'],'G':r['googleGraph']},'solve':r['solve'],'power':r['rows'],'averages':r['rawRows']}
 if p['mode']=='cycle':records['spectrum']=r['eigen']
 for key,obj in records.items():
  ck([(row[1],row[2])for row in tables[key]['rows']]==flattened(obj),'complete ledger '+key)
 for t in tables.values():
  ck(len(t['headers'])==3 and bool(t['title']),'readable ledger')
  for row in t['rows']:ck(len(row)==3 and bool(row[0])and not isinstance(row[1],(list,dict)),'flat named actual ledger value')
for d in data['states']:
 if 'plots'in d:view_check(d)
fixture=ROOT/'course-shared/projects/perron-frobenius/run-snapshot.json'if len(sys.argv)==1 else JS.with_name('perron-snapshot148.json')
if fixture.exists():
 f=json.loads(fixture.read_text(),parse_int=float);ck(f['schema']==1,'snapshot schema')
 ck(f['provenance']['jsSha256']==hashlib.sha256(JS.read_bytes()).hexdigest(),'numeric snapshot source provenance')
 cmd="const a=require(process.argv[1]),f=JSON.parse(require('fs').readFileSync(process.argv[2],'utf8'));console.log(JSON.stringify(['cycle','periodic','jordan','pagerank'].map(k=>{const d=f[k];return {...d,plots:a.plots(d),ledgers:a.ledgers(d),svgs:a.plots(d).map(a.svg)}})))"
 frozen=json.loads(subprocess.check_output(PREFIX+['node','-e',cmd,str(JS.resolve()),str(fixture.resolve())],text=True),parse_int=float)
 for d in frozen:science(d);view_check(d)
 print('snapshot stage: PASS',checks)
if len(sys.argv)==1:
 from html.parser import HTMLParser
 provenance=f['provenance'];ck(provenance['date']=='2026-09-11'and provenance['node']=='v24.14.0'and provenance['platform']=='darwin'and provenance['arch']=='arm64','fixed environment')
 ck((ROOT/'grad-math/site/assets/learning/projects/perron-frobenius/run-snapshot.json').read_bytes()==fixture.read_bytes(),'snapshot publication mirror')
 ck(f['cycle']['parameters']['w1']==2 and f['cycle']['parameters']['w2']==.5 and f['cycle']['parameters']['w3']==1 and f['cycle']['parameters']['shift']==0,'fixed cycle')
 ck(f['periodic']['result']['A']==[[0,1],[1,0]]and f['jordan']['result']['power']['initial']==[1,1]and f['pagerank']['parameters']['alpha']==.5,'fixed boundary inputs')
 src=(ROOT/'grad-math/lectures/ma-03-perron.md').read_text();site=(ROOT/'grad-math/site/ma-03-perron.html').read_text()
 formulas=[(a or b).strip()for a,b in re.findall(r'\$\$(.*?)\$\$|(?<!\\)\$(?!\$)(.*?)(?<!\\)\$(?!\$)',src,re.S)]
 actual=[html.unescape(a or b).strip()for a,b in re.findall(r'<(?:span|div) class="arithmatex">(?:\\\((.*?)\\\)|\\\[(.*?)\\\])</(?:span|div)>',site,re.S)]
 ck(formulas==actual,'all source formulas preserved');ck(all('<'not in s for s in formulas),'HTML-safe math')
 ck(not re.search(r'<p>\s*<details|</details>\s*</p>',site),'balanced disclosure paragraphs')
 class Disclosure(HTMLParser):
  def __init__(self):super().__init__();self.stack=[];self.answers=0
  def handle_starttag(self,tag,attrs):
   if tag=='details':
    ck(not self.stack,'no nested disclosure');kind=dict(attrs).get('class');ck(kind in ['answer','page-toc'],'known disclosure');self.stack.append([kind,0]);self.answers+=kind=='answer'
   if tag=='summary':ck(bool(self.stack),'summary owned');self.stack[-1][1]+=1
  def handle_endtag(self,tag):
   if tag=='details':ck(bool(self.stack),'no orphan close');ck(self.stack.pop()[1]==1,'one summary')
 parser=Disclosure();parser.feed(re.search(r'<article[^>]*>(.*?)</article>',site,re.S).group(1));ck(parser.answers==4 and not parser.stack,'four complete answers')
 ck(len(re.findall(r'^## [0-9]+\.',src,re.M))==12,'twelve formal sections')
 for link in re.findall(r'(?:href|src)="([^"]+)"',site):
  target=link.split('#')[0].split('?')[0]
  if target and not re.match(r'^[a-zA-Z]+:',target)and not target.startswith('/'):ck((ROOT/'grad-math/site'/target).exists(),('local target',target))
 for course in ['ai-course','grad-math','math-course']:ck((ROOT/course/'site/assets/learning/labs/perron-frobenius.js').read_bytes()==JS.read_bytes(),'shared lab mirror')
 ck((ROOT/'.github/workflows/course-audit.yml').read_text().count('python tools/check_perron_full.py')==1,'CI invocation')
 image=ROOT/'grad-math/images/ma-03-perron-ledgers.svg';ck(image.read_bytes()==(ROOT/'grad-math/site/assets/img/ma-03-perron-ledgers.svg').read_bytes(),'static image mirror')
 panels=ET.parse(image).getroot().findall('.//{http://www.w3.org/2000/svg}svg');ck(len(panels)==4,'four static panels')
 chosen=[(0,0),(0,1),(1,1),(3,4)]
 def compare_svg(a,b):
  ck(a.tag==b.tag and set(a.attrib)==set(b.attrib),'static full structure')
  ck(a.text==b.text and a.tail==b.tail,'static text exact')
  pattern=r'[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?'
  for key,v in a.attrib.items():
   w=b.attrib[key]
   if key in {'x','y','x1','x2','y1','y2','cx','cy','r','width','height'}:ck(abs(float(v)-float(w))<=1e-9,'static subnanopixel coordinate')
   elif key in {'points','d'}:
    ck(re.sub(pattern,'#',v)==re.sub(pattern,'#',w),'static geometry syntax');av=re.findall(pattern,v);bv=re.findall(pattern,w);ck(len(av)==len(bv),'static geometry length')
    for x,y in zip(av,bv):ck(abs(float(x)-float(y))<=1e-9,'static subnanopixel geometry')
   else:ck(v==w,('static attribute',key))
  ck(len(a)==len(b),'static child count')
  for x,y in zip(a,b):compare_svg(x,y)
 for panel,(run,index)in zip(panels,chosen):
  q=frozen[run]['plots'][index];svg_check(panel,q)
  panel.attrib.pop('x');panel.attrib.pop('y');compare_svg(panel,ET.fromstring(frozen[run]['svgs'][index]))
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
  ck(rejected,('comparator negative control',mutation))
 table=re.search(r'data-learning-lab="perron-frobenius".*?<tbody>(.*?)</tbody>',site,re.S).group(1)
 vals=[float(html.unescape(x))for x in re.findall(r'<tr>\s*<td>.*?</td>\s*<td[^>]*>(.*?)</td>\s*</tr>',table,re.S)]
 c=f['cycle']['result'];p=f['periodic']['result'];j=f['jordan']['result'];v=f['pagerank']['result']
 refs=[c['rho'],c['eigen'][1]['lambda']['re'],c['eigen'][1]['lambda']['im'],c['graph']['period'],c['right'][0],c['right'][1],p['rho'],p['other'],p['graph']['period'],p['power']['rows'][0]['x'][0],p['power']['rows'][1]['x'][0],p['power']['rows'][0]['collatz']['lower']['value'],j['dimension'],j['algebraicMultiplicity'],j['power']['rows'][24]['targetError']]+[z['value']for z in v['solve']['solution']]
 ck(len(vals)==len(refs)==18,'all fallback numbers')
 for x,y in zip(vals,refs):close(x,y,'fixed numeric fallback',tol=2e-11,scale=max(abs(y),1e-28))
 ck('run-snapshot.json'in site and '精确分数'in site and '代数单根'in site and '不替代周期定理'in site,'evidence limits retained')
 print('formulas',len(formulas))
print(json.dumps({'status':'PASS','states':len(data['states']),'checks':checks,'invalid':data['invalid'],'self':data['self']['checks']},ensure_ascii=False))
