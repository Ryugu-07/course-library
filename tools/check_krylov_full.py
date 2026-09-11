"""Independent scalar/matrix identities for CG/PCG and complete Arnoldi/GMRES traces."""
from pathlib import Path
from fractions import Fraction as F
import subprocess,shutil,json,math,sys,re,html,hashlib,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/cg-spectrum.js'
code=r'''
const a=require(process.argv[1]),cs=[...a.PRESETS];
for(const spectrum of ["uniform","clustered","near-cluster","scalar","residual-rise"])for(const scaleExponent of [-12,0,12])for(const preconditioner of ["none","group","jacobi"])cs.push({spectrum,scaleExponent,preconditioner,steps:64});
for(const condition of [1,1+4*Number.EPSILON,1e6])for(const weights of ["all","endpoints","zero"])cs.push({condition,weights,steps:64});
for(const preconditionExponent of [-12,12])cs.push({preconditioner:"none",preconditionExponent});
for(const family of ["grcar","rotation","triangular"])for(const gamma of [0,1,10])for(const scaleExponent of [-12,0,12])cs.push({mode:"gmres",family,gamma,scaleExponent,steps:24});
for(const restart of [1,3,6])for(const metricExponent of [-4,0,4])cs.push({mode:"precondition",restart,metricExponent});
const groups=[
 [{},["condition","scaleExponent","preconditionExponent","steps","tolerance"]],
 [{spectrum:"near-cluster"},["width"]],
 [{mode:"gmres"},["gamma","restart","metricExponent","steps","tolerance","scaleExponent"]]
];let invalid=0;
for(const[c,fields]of groups)for(const key of fields)for(const v of ["",null,true,false,[],{},NaN,Infinity,-Infinity,"1e309","1e-400","0x10","3x"]){
 let bad=false;try{a.config({...c,[key]:v});}catch(e){bad=true;}if(!bad)throw Error("invalid "+key);invalid++;
}
for(const c of [null,[],{mode:"x"},{spectrum:"x"},{weights:"x"},{preconditioner:"x"},{condition:.9},{condition:1e7},{spectrum:"near-cluster",width:.2},{steps:1.5},{steps:0},{steps:65},{preconditionExponent:13},{scaleExponent:-13},{tolerance:0},{mode:"gmres",family:"x"},{mode:"gmres",gamma:11},{mode:"gmres",steps:49},{mode:"gmres",restart:1.5},{mode:"gmres",restart:7},{mode:"precondition",metricExponent:5}]){
 let bad=false;try{a.config(c);}catch(e){bad=true;}if(!bad)throw Error("boundary");invalid++;
}
a.snapshot({mode:"cg",family:null,gamma:NaN,metricExponent:"",restart:[]});
a.snapshot({spectrum:"scalar",condition:"",width:NaN});
a.snapshot({mode:"gmres",family:"rotation",gamma:"",condition:NaN,weights:"x",preconditionExponent:[]});
const states=cs.map((c,i)=>{const d=a.snapshot(c);return i<a.PRESETS.length?{...d,plots:a.plots(d),ledgers:a.ledgers(d),svgs:a.plots(d).map(a.svg)}:d;});
console.log(JSON.stringify({states,invalid,self:a.selfTest(),rankFailure:a.smallLS([[0],[0]],[1,0])}));
'''
data=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve())],text=True));checks=0
def ck(v,m):
 global checks
 assert v,m;checks+=1
def close(x,y,label,scale=1,rtol=3e-12,atol=4e-14):
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
def fro(A):return norm([v for row in A for v in row])
def mv(A,x):return[dot(r,x)for r in A]
def mm(A,B):return[[dot(r,c)for c in zip(*B)]for r in A]
def sub(x,y):return[a-b for a,b in zip(x,y)]
def msub(A,B):return[sub(a,b)for a,b in zip(A,B)]
def eye(n):return[[int(i==j)for j in range(n)]for i in range(n)]
def axpy(x,a,y):return[v+a*w for v,w in zip(x,y)]
def check_cg(s,p):
 scale=10**s['scaleExponent'];condition=s['condition'];spectrum=s['spectrum']
 if spectrum=='residual-rise':base=[1,100]
 elif spectrum=='scalar':base=[7]*12
 elif spectrum=='uniform':base=[1+(condition-1)*i/11 for i in range(12)]
 else:
  levels=[1,math.sqrt(condition),condition];base=[]
  for i in range(12):
   group,j=divmod(i,4)
   if spectrum=='clustered':v=levels[group]
   elif group==0:v=1+s['width']*(levels[1]-1)*j/3
   elif group==2:v=condition-s['width']*(condition-levels[1])*(3-j)/3
   else:v=levels[1]+s['width']*min(levels[1]-1,condition-levels[1])*(2*j/3-1)
   base.append(v)
 vec(p['base'],base,'specified spectrum');lam=[v*scale for v in base];vec(p['lambda'],lam,'scaled diagonal',scale=scale)
 n=len(lam);ideal=[0 if s['weights']=='zero'else 1 if s['weights']=='all'or i in [0,n-1]else 0 for i in range(n)]
 if spectrum=='residual-rise'and s['weights']!='zero':ideal=[1,.001]
 vec(p['truth'],ideal,'manufactured input vector')
 factor=10**s['preconditionExponent'];M=[factor*(1 if s['preconditioner']=='none'else v if s['preconditioner']=='jacobi'else v/[1,1.25,1.5][min(2,3*i//n)])for i,v in enumerate(lam)]
 vec(p['M'],M,'transparent preconditioner',scale=norm(M));ck([m['id']for m in p['methods']]==['cg','pcg'],'two methods')
 for m in p['methods']:
  l=m['lambda'];b=m['b'];M=m['M'];apply=lambda x:[a*v for a,v in zip(l,x)];energy=lambda e:math.sqrt(dot(l,[v*v for v in e]));bn=norm(b)
  vec(l,lam,'shared diagonal',scale=scale);vec(b,apply(ideal),'actual RHS formation',scale=bn);vec(m['idealTruth'],ideal,'ideal input stored')
  ref=[float(F(v)/F(a))for v,a in zip(b,l)];vec(m['truth'],ref,'Fraction actual diagonal reference',rtol=1e-15,atol=1e-17)
  if m['id']=='cg':vec(M,[1]*n,'unpreconditioned CG')
  else:vec(M,p['M'],'chosen M',scale=norm(M))
  e0=sub(m['truth'],m['x0']);r0=sub(b,apply(m['x0']));en=energy(e0);rn=norm(r0);den=bn or rn
  vec(m['e0'],e0,'initial error');vec(m['r0'],r0,'initial residual',scale=bn);close(m['initialResidual'],rn,'initial norm',scale=bn);close(m['initialAError'],en,'initial energy',scale=en)
  mu=[a/v for a,v in zip(l,M)];kap=max(mu)/min(mu);vec(m['mu'],mu,'actual effective spectrum',scale=norm(mu));close(m['kappa'],kap,'symmetric spectral ratio')
  rows,records=m['rows'],m['records'];ck(len(rows)==1+sum(v['accepted']for v in records),'all CG states')
  ck(m['final']==rows[-1],'final CG binding')
  for k,r in enumerate(rows):
   ck(r['k']==k,'CG step order');x=r['x'];e=sub(m['truth'],x);actual=sub(b,apply(x));rho=dot(r['r'],[v/mm for v,mm in zip(r['r'],M)])
   vec(r['error'],e,'actual reference error');vec(r['actualResidual'],actual,'explicit true residual',scale=bn)
   close(r['actualNorm'],norm(actual),'true residual norm',scale=bn);close(r['relativeResidual'],norm(actual)/den if den else 0,'true relative residual')
   close(r['recurrenceNorm'],norm(r['r']),'recursive norm',scale=bn);close(r['gap'],norm(sub(r['r'],actual)),'recursive true gap',scale=bn)
   close(r['relativeGap'],r['gap']/den if den else 0,'relative gap');close(r['aError'],energy(e),'A norm',scale=en)
   close(r['relativeAError'],r['aError']/en if en else 0,'relative A norm');close(r['rho'],rho,'actual preconditioned rho',scale=abs(rho))
   q=0 if kap==1 else (math.sqrt(kap)-1)/(math.sqrt(kap)+1);bound=1 if k==0 else 0 if kap==1 else min(1,2*q**k)
   close(r['bound'],bound,'Chebyshev with exact scalar boundary',scale=bound,atol=1e-15)
   for i,v in enumerate(r['actualFilter']):
    if e0[i]==0:ck(v is None,'zero support truly zero')
    else:close(v,e[i]/e0[i],'actual directional filter')
   vec(r['filterGap'],[v-a*p0 for v,a,p0 in zip(e,r['poly'],e0)],'polynomial versus physical error')
   vec(r['weights'],[a*v*v/(en*en)if en else 0 for a,v in zip(l,e0)],'initial energy weights')
   ck(r['matvecs']==2+2*k,'CG actual matvec count')
   ck(r['preconditionerSolves']==(0 if all(v==1 for v in M)else 1+k),'CG actual M solves')
  initial=rows[0];vec(initial['poly'],[1]*n,'initial polynomial');vec(initial['directionPoly'],mu,'initial direction polynomial')
  for k,v in enumerate(records):
   prev=v['before'];ck(v['k']==k,'CG attempt index')
   for key in ['x','r','poly','directionPoly']:vec(prev[key],rows[k][key],'step from stored '+key,scale=norm(prev[key]))
   vec(prev['z'],[a/b for a,b in zip(prev['r'],M)],'true precondition action',scale=norm(prev['z']))
   close(prev['rho'],rows[k]['rho'],'step rho',scale=abs(prev['rho']))
   if k==0:vec(prev['p'],prev['z'],'initial direction',scale=norm(prev['p']))
   else:vec(prev['p'],records[k-1]['pNext'],'connected CG direction',scale=norm(prev['p']))
   Ap=apply(prev['p']);curvature=dot(prev['p'],Ap);vec(v['Ap'],Ap,'actual Ap',scale=norm(Ap));close(v['curvature'],curvature,'direction curvature',scale=abs(curvature))
   if not v['accepted']:ck(curvature<=0 or not math.isfinite(curvature),'actual curvature failure');continue
   alpha=prev['rho']/curvature;close(v['alpha'],alpha,'CG alpha',scale=abs(alpha))
   next=rows[k+1];vec(next['x'],axpy(prev['x'],v['alpha'],prev['p']),'actual x recurrence',scale=norm(next['x']))
   vec(next['r'],axpy(prev['r'],-v['alpha'],v['Ap']),'actual r recurrence',scale=bn)
   vec(v['zNext'],[a/b for a,b in zip(next['r'],M)],'next preconditioned r',scale=norm(v['zNext']))
   close(v['rhoNext'],dot(next['r'],v['zNext']),'next rho',scale=abs(v['rhoNext']))
   close(v['beta'],v['rhoNext']/prev['rho'],'CG beta',scale=abs(v['beta']))
   vec(v['pNext'],axpy(v['zNext'],v['beta'],prev['p']),'actual p recurrence',scale=norm(v['pNext']))
   vec(next['poly'],[a-v['alpha']*b for a,b in zip(prev['poly'],prev['directionPoly'])],'residual polynomial recurrence',scale=norm(prev['poly'])+abs(v['alpha'])*norm(prev['directionPoly']))
   vec(next['directionPoly'],[a*b+v['beta']*c for a,b,c in zip(mu,next['poly'],prev['directionPoly'])],'direction polynomial recurrence',scale=norm(next['directionPoly']))
  dirs=[v['before']['p']for v in records if v['accepted']];mat(m['directions'],dirs,'all retained directions',scale=norm([x for r in dirs for x in r]))
  expected=[]
  for a in dirs:
   row=[]
   for bdir in dirs:
    denAB=math.sqrt(dot(a,apply(a))*dot(bdir,apply(bdir)));row.append(dot(a,apply(bdir))/denAB if denAB else None)
   expected.append(row)
  ck(len(m['conjugacy'])==len(expected),'complete conjugacy matrix')
  for a,bdir in zip(m['conjugacy'],expected):
   for x,y in zip(a,bdir):
    if y is None:ck(x is None,'undefined zero direction')
    else:close(x,y,'actual conjugacy')
  st=m['status'];last=m['final']
  if st=='zero-floating-residual':ck(last['actualNorm']==0,'actual zero CG')
  elif st=='true-residual-threshold':ck(last['actualNorm']>0 and last['relativeResidual']<=s['tolerance'],'true CG threshold')
  else:
   ck(last['relativeResidual']>s['tolerance'],'not falsely converged')
   if st=='iteration-budget':ck(last['k']==s['steps'],'actual CG budget')
   else:ck(st in ['nonpositive-rho','nonpositive-curvature'],'explicit CG failure')
  ck(m['matvecs']==last['matvecs']and m['preconditionerSolves']==last['preconditionerSolves'],'final operation counters')
def check_ls(v):
 H,rhs,R,Qt,g=v['H'],v['rhs'],v['R'],v['Qt'],v['g'];m=len(H);n=len(H[0]);hn=fro(H);bn=norm(rhs)
 mat(mm(Qt,H),R,'small QR reconstruction',scale=hn);mat(mm(Qt,tr(Qt)),eye(m),'small QR orthogonality')
 vec(mv(Qt,rhs),g,'transformed RHS',scale=bn)
 working=[r[:]for r in H];right=rhs[:];Q=eye(m);idx=0
 for j in range(n):
  for i in range(m-1,j,-1):
   r=v['rotations'][idx];idx+=1;ck(r['j']==j and r['i']==i,'complete LS rotation sequence')
   mat(r['before'],working,'rotation connected input',scale=hn);vec(r['gBefore'],right,'rotation connected RHS',scale=bn)
   working=[row[:]for row in r['before']];right=r['gBefore'][:]
   a,b=working[i-1][j],working[i][j];length=math.hypot(a,b);c=a/length if length else 1;s=b/length if length else 0
   vec([r['a'],r['b'],r['length']],[a,b,length],'LS rotation inputs',scale=hn);vec([r['c'],r['s']],[c,s],'LS rotation coefficients')
   for k in range(j,n):
    u,w=working[i-1][k],working[i][k];working[i-1][k]=c*u+s*w;working[i][k]=-s*u+c*w
   for k in range(m):
    u,w=Q[i-1][k],Q[i][k];Q[i-1][k]=c*u+s*w;Q[i][k]=-s*u+c*w
   u,w=right[i-1],right[i];right[i-1]=c*u+s*w;right[i]=-s*u+c*w;working[i][j]=0
   mat(r['after'],working,'LS rotation output',scale=hn);vec(r['gAfter'],right,'LS rotated RHS',scale=bn)
 ck(idx==len(v['rotations']),'all LS rotations');mat(R,working,'final R from rotations',scale=hn);mat(Qt,Q,'Qt from rotations');vec(g,right,'g from rotations',scale=bn)
 if v['status']!='ok':ck(v['status']=='rank-deficient-projection'and v['y']is None and any(R[i][i]==0 for i in range(n)),'rank failure not zero answer');return
 y=v['y'];expected=[0]*n
 for i in range(n-1,-1,-1):expected[i]=(g[i]-dot(R[i][i+1:],y[i+1:]))/R[i][i]
 vec(y,expected,'actual triangular LS solve',scale=norm(y))
 residual=sub(mv(H,y),rhs);vec(v['residual'],residual,'projected residual',scale=bn+hn*norm(y))
 close(v['residualNorm'],norm(residual),'projected norm',scale=bn+hn*norm(y));close(v['tailNorm'],norm(g[n:]),'orthogonal RHS tail',scale=bn)
 vec(mv(tr(H),residual),[0]*n,'LS normal stationarity without forming normal equations',scale=hn*(bn+hn*norm(y)),atol=2e-13)
def check_gmres(s,p):
 scale=10**s['scaleExponent'];n=2 if s['family']=='rotation'else 6
 if s['family']=='rotation':A=[[0,-scale],[scale,0]]
 else:A=[[scale*((1 if s['family']=='grcar'else 1+i/5)if i==j else(-1 if s['family']=='grcar'and i==j+1 else s['gamma']if(s['family']=='grcar'and 0<j-i<=3)or(s['family']=='triangular'and j==i+1)else 0))for j in range(n)]for i in range(n)]
 b=[(scale if i==0 else 0)if s['family']=='rotation'else scale for i in range(n)];M=[10**(s['metricExponent']*i/(n-1))for i in range(n)]
 mat(p['A'],A,'GMRES family',scale=scale);vec(p['b'],b,'GMRES RHS',scale=scale);vec(p['M'],M,'GMRES diagonal metric',scale=norm(M))
 ck([m['id']for m in p['methods']]==['full','restarted','left','right'],'four GMRES comparisons')
 for m in p['methods']:
  side=m['side'];mat(m['A'],A,'shared physical A',scale=scale);vec(m['b'],b,'shared physical b',scale=scale)
  expectedSide=m['id']if m['id']in ['left','right']else'none';ck(side==expectedSide,'actual precondition side')
  vec(m['M'],M if side!='none'else[1]*n,'applied M',scale=norm(M));metric=m['M'];bn=norm(b)
  C=[[v/metric[i]if side=='left'else v/metric[j]if side=='right'else v for j,v in enumerate(r)]for i,r in enumerate(A)];cn=fro(C)
  rows,records,cycles=m['rows'],m['records'],m['cycles'];ck(len(rows)==1+sum(v['accepted']for v in records),'complete GMRES trace')
  ck(m['final']==rows[-1],'GMRES final binding')
  for k,r in enumerate(rows):
   ck(r['k']==k,'accepted GMRES sequence');actual=sub(b,mv(A,r['x']));weighted=[v/metric[i]for i,v in enumerate(actual)]if side=='left'else actual
   vec(r['r'],actual,'physical residual',scale=bn+fro(A)*norm(r['x']))
   vec(r['weighted'],weighted,'actual minimized residual',scale=norm(weighted)+bn*max(1/v for v in metric))
   close(r['rNorm'],norm(actual),'physical residual norm',scale=bn+fro(A)*norm(r['x']))
   close(r['relativeResidual'],norm(actual)/bn,'physical relative residual',atol=2e-11)
   close(r['weightedNorm'],norm(weighted),'target residual norm',scale=norm(weighted)+bn*max(1/v for v in metric))
   close(r['relativeWeighted'],r['weightedNorm']/rows[0]['weightedNorm'],'relative minimized residual')
   if r['predicted']is None:ck(k==0 and r['predictionGap']is None,'no initial projected problem')
   else:close(r['predictionGap'],abs(r['weightedNorm']-r['predicted']),'prediction comparison',scale=bn*max(1/v for v in metric))
  counts=[1,1 if side=='left'else 0];ck([rows[0]['matvecs'],rows[0]['preconditionerSolves']]==counts,'initial measured cost')
  for cycle in cycles:
   c=cycle['cycle'];ck(cycles[c]==cycle,'cycle identity')
   vec(cycle['base'],rows[cycle['startStep']]['x'],'restart actual base');vec(cycle['baseResidual'],rows[cycle['startStep']]['r'],'restart true residual',scale=bn)
   start=[v/metric[i]for i,v in enumerate(cycle['baseResidual'])]if side=='left'else cycle['baseResidual']
   vec(cycle['start'],start,'restart transformed residual',scale=norm(start));close(cycle['beta'],norm(start),'restart beta',scale=norm(start))
   if side=='left':counts[1]+=1
   recs=[v for v in records if v['cycle']==c];ck(sum(v['accepted']for v in recs)==cycle['accepted'],'cycle accepted count')
   expectedV=[v/cycle['beta']for v in start];previousH=None
   for j,v in enumerate(recs):
    ck(v['j']==j and v['k']==cycle['startStep']+j+1,'cycle/inner step bookkeeping')
    V,bar,H=v['V'],v['barV'],v['H'];ck(len(V)==j+1 and len(H)==j+2 and all(len(r)==j+1 for r in H),'complete current basis')
    if j==0:vec(V[0],expectedV,'starting Arnoldi basis')
    else:
     for i in range(j):vec(V[i],recs[j-1]['V'][i],'retained Arnoldi columns')
     vec(V[j],recs[j-1]['barV'][j],'previous new Arnoldi column')
    raw=mv(C,V[j]);vec(v['raw'],raw,'actual preconditioned operator',scale=cn)
    close(v['rawNorm'],norm(raw),'raw column norm',scale=cn)
    working=v['raw'][:];coeff=[0]*(j+1);idx=0
    for pas in range(2):
     for i in range(j+1):
      g=v['projections'][idx];idx+=1;ck(g['pass']==pas and g['i']==i,'two MGS passes')
      vec(g['before'],working,'MGS input continuity',scale=cn)
      coefficient=dot(V[i],g['before']);close(g['coefficient'],coefficient,'actual projection coefficient',scale=cn)
      coeff[i]+=g['coefficient'];working=axpy(g['before'],-g['coefficient'],V[i]);vec(g['after'],working,'actual projection update',scale=cn)
    ck(idx==len(v['projections']),'all projections');vec(v['w'],working,'remaining Arnoldi vector',scale=cn)
    close(v['h'],norm(v['w']),'actual remaining norm',scale=cn);close(v['threshold'],64*sys.float_info.epsilon*v['rawNorm'],'near breakdown threshold',scale=cn)
    ck(v['nearBreakdown']==(v['h']<=v['threshold']),'explicit truncation decision')
    vec([H[i][j]for i in range(j+1)],coeff,'summed two-pass Hessenberg column',scale=cn)
    close(H[j+1][j],0 if v['nearBreakdown']else v['h'],'recorded truncated tail',scale=cn)
    for i in range(j+1):vec(bar[i],V[i],'bar basis prefix')
    vec(bar[j+1],[0]*n if v['nearBreakdown']else[x/v['h']for x in v['w']],'actual next column or explicit omitted tail')
    if previousH:
     for i in range(j+2):
      for l in range(j):close(H[i][l],previousH[i][l]if i<len(previousH)else 0,'previous Hessenberg columns retained',scale=cn)
    previousH=H;counts[0]+=1
    if side!='none':counts[1]+=1
    check_ls(v['ls']);mat(v['ls']['H'],H,'actual Arnoldi least squares',scale=cn)
    vec(v['ls']['rhs'],[cycle['beta']]+[0]*(j+1),'Arnoldi projected RHS',scale=cycle['beta'])
    if not v['accepted']:ck(m['status']=='rank-deficient-projection','projection failure retained');continue
    correction=mv(tr(V),v['ls']['y']);vec(v['correction'],correction,'Krylov correction',scale=norm(correction))
    physical=[x/metric[i]for i,x in enumerate(correction)]if side=='right'else correction
    vec(v['physical'],physical,'right map back to physical variables',scale=norm(physical))
    vec(v['x'],axpy(cycle['base'],1,physical),'candidate x',scale=norm(v['x']))
    r=rows[v['k']];vec(r['x'],v['x'],'accepted row linked to update',scale=norm(v['x']))
    close(r['predicted'],v['ls']['residualNorm'],'small residual prediction',scale=cycle['beta'])
    close(v['arnoldiGap'],fro(msub(mm(C,tr(V)),mm(tr(bar),H))),'actual Arnoldi relation defect',scale=cn)
    close(v['orthogonality'],fro(msub(mm(V,tr(V)),eye(j+1))),'basis orthogonality');ck(v['orthogonality']<3e-13,'two pass basis quality')
    counts[0]+=1
    if side=='right':counts[1]+=1
    if side=='left':counts[1]+=1
    ck([r['matvecs'],r['preconditionerSolves']]==counts,'actual GMRES solver plus residual-check cost')
   ck(cycle['endStep']==cycle['startStep']+cycle['accepted'],'cycle end step')
   vec(cycle['final'],rows[cycle['endStep']]['x'],'actual cycle final')
  ck([m['matvecs'],m['preconditionerSolves']]==counts,'final cost')
  st=m['status'];last=m['final']
  if st=='zero-floating-residual':ck(last['rNorm']==0,'actual physical zero GMRES')
  elif st=='true-residual-threshold':ck(last['rNorm']>0 and last['relativeResidual']<=s['tolerance'],'actual GMRES threshold')
  else:
   ck(last['relativeResidual']>s['tolerance'],'not falsely converged GMRES')
   if st=='iteration-budget':ck(last['k']==s['steps'],'real exhausted GMRES budget')
   elif st=='arnoldi-near-breakdown':ck(records[-1]['nearBreakdown'],'documented near breakdown')
   else:ck(st in ['rank-deficient-projection','zero-transformed-residual'],'explicit GMRES failure')
def science(d):
 if d['config']['mode']=='cg':check_cg(d['config'],d['result'])
 else:check_gmres(d['config'],d['result'])
NAMES={'cg':'原始CG','pcg':'预条件CG','full':'完整GMRES','restarted':'重启GMRES','left':'左预条件','right':'右预条件'}
STATUS={'iteration-budget':'预算结束','zero-floating-residual':'浮点真残差为0','true-residual-threshold':'真残差达到阈值','nonpositive-rho':'rho非正或非有限','nonpositive-curvature':'方向曲率非正或非有限','zero-transformed-residual':'变换后残差为0但原残差未过关','rank-deficient-projection':'小最小二乘秩亏','arnoldi-near-breakdown':'Arnoldi近退化且真残差未过关','ok':'成功'}
def col(x):return[[v]for v in x]
def entries(objects):return[[name,i,j,x]for name,A in objects.items()for i,r in enumerate(A)for j,x in enumerate(r)]
def verify_views(d):
 s,p=d['config'],d['result'];rows={};wanted=[];lines={}
 if s['mode']=='cg':
  wanted=[{}for _ in range(6)]
  summary=[s['spectrum'],s['weights'],len(p['lambda']),max(p['lambda'])/min(p['lambda']),p['scale'],s['preconditioner'],10**s['preconditionExponent'],s['tolerance'],s['steps']]
  rows['methods']=[[NAMES[m['id']],STATUS[m['status']],m['final']['k'],m['kappa'],m['final']['relativeAError'],m['final']['relativeResidual'],m['final']['gap'],m['matvecs'],m['preconditionerSolves']]for m in p['methods']]
  rows['input']=[];rows['trace']=[];rows['vectors']=[];rows['updates']=[];rows['update-vectors']=[];rows['conjugacy']=[]
  for m in p['methods']:
   key=m['id'];name=NAMES[key]
   for field,suffix in [('relativeAError',''),('bound','-bound')]:
    wanted[0][key+suffix]=[[r['k'],math.log10(r[field])]for r in m['rows']if r[field]>0]
   for index,field in [(1,'relativeResidual'),(2,'relativeGap')]:
    wanted[index][key]=[[r['k'],math.log10(r[field])]for r in m['rows']if r[field]>0]
   wanted[3][key+'-poly']=[[i,x]for i,x in enumerate(m['final']['poly'])]
   wanted[3][key+'-actual']=[[i,x]for i,x in enumerate(m['final']['actualFilter'])if x is not None]
   wanted[4][key]=[[i,x/min(m['mu'])]for i,x in enumerate(m['mu'])]
   wanted[5][key+'-residual']=[[r['k'],r['relativeResidual']]for r in m['rows']if r['k']<=3]
   wanted[5][key+'-energy']=[[r['k'],r['relativeAError']]for r in m['rows']if r['k']<=3]
   lines[5,key+'-residual']=True
   rows['input'].extend([[name,i,x,m['M'][i],m['mu'][i],m['b'][i],m['idealTruth'][i],m['truth'][i],m['x0'][i],m['e0'][i],m['r0'][i],m['rows'][0]['weights'][i]]for i,x in enumerate(m['lambda'])])
   for r in m['rows']:
    rows['trace'].append([name,*[r[k]for k in ['k','aError','relativeAError','actualNorm','relativeResidual','recurrenceNorm','gap','relativeGap','rho','bound','matvecs','preconditionerSolves']]])
    rows['vectors'].extend([[name,r['k'],i,x,*[r[k][i]for k in ['error','r','actualResidual','poly','directionPoly','actualFilter','filterGap']]]for i,x in enumerate(r['x'])])
   for r in m['records']:
    rows['updates'].append([name,r['k'],r['accepted'],r['before']['rho'],r['curvature'],r.get('alpha'),r.get('beta'),r.get('rhoNext')])
    a={k+'Before':col(r['before'][k])for k in ['x','r','z','p']}
    a['Ap']=col(r['Ap']);a['polyBefore']=col(r['before']['poly']);a['directionPolyBefore']=col(r['before']['directionPoly'])
    if r['accepted']:a.update(zNext=col(r['zNext']),pNext=col(r['pNext']))
    rows['update-vectors'].extend([[name,r['k'],*v]for v in entries(a)])
   rows['conjugacy'].extend([[name,i,j,x]for i,r in enumerate(m['conjugacy'])for j,x in enumerate(r)])
 else:
  wanted=[{}for _ in range(5)]
  summary=[s['family'],len(p['A']),None if s['family']=='rotation'else s['gamma'],p['scale'],s['restart'],s['steps'],s['tolerance'],s['metricExponent'],'64u ||算子v||₂']
  for key in ['methods','input','trace','vectors','cycles','arnoldi','bases','projections','least-squares','rotations','rotation-matrices']:rows[key]=[]
  for m in p['methods']:
   key=m['id'];name=NAMES[key]
   for index,field in [(0,'relativeResidual'),(1,'relativeWeighted')]:
    wanted[index][key]=[[r['k'],math.log10(r[field])]for r in m['rows']if r[field]>0]
   wanted[2][key]=[[r['k'],math.log10(r['predictionGap']/m['rows'][0]['weightedNorm'])]for r in m['rows']if r['predictionGap']is not None and r['predictionGap']>0]
   wanted[3][key]=[[r['k'],math.log10(r['orthogonality'])]for r in m['records']if r['accepted']and r['orthogonality']>0]
   if s['mode']=='gmres':
    wanted[4][key]=[[r['k'],r['relativeResidual']]for r in m['rows']]
    lines[4,key]=True
   if s['mode']=='precondition'and key in ['left','right']:
    wanted[4][key+'-true']=[[r['k'],r['relativeResidual']]for r in m['rows']]
    wanted[4][key+'-weighted']=[[r['k'],r['relativeWeighted']]for r in m['rows']]
    lines[4,key+'-true']=True
   rows['methods'].append([name,m['side'],STATUS[m['status']],m['final']['k'],len(m['cycles']),min(m['restart'],m['n']),m['final']['relativeResidual'],m['final']['relativeWeighted'],m['matvecs'],m['preconditionerSolves']])
   rows['input'].extend([[name,*v]for v in entries({'A':m['A'],'b':col(m['b']),'Mdiagonal':col(m['M'])})])
   for r in m['rows']:
    rows['trace'].append([name,*[r[k]for k in ['k','cycle','inner','rNorm','relativeResidual','weightedNorm','relativeWeighted','predicted','predictionGap','matvecs','preconditionerSolves']]])
    rows['vectors'].extend([[name,r['k'],*v]for v in entries({'x':col(r['x']),'residual':col(r['r']),'targetResidual':col(r['weighted'])})])
   for c in m['cycles']:
    rows['cycles'].extend([[name,*[c[k]for k in ['cycle','startStep','endStep','accepted','beta']],*v]for v in entries({k:col(c[k])for k in ['base','baseResidual','start','final']})])
   for r in m['records']:
    rows['arnoldi'].append([name,*[r.get(k)for k in ['k','cycle','j','accepted','rawNorm','h','threshold','nearBreakdown','arnoldiGap','orthogonality']],STATUS[r['ls']['status']]])
    a={'H':r['H'],'V_as_columns':tr(r['V']),'barV_as_columns':tr(r['barV']),'raw':col(r['raw']),'remaining':col(r['w']),'base':col(r['base'])}
    if r['accepted']:a.update({k:col(r[k])for k in ['correction','physical','x']})
    rows['bases'].extend([[name,r['k'],*v]for v in entries(a)])
    for j,v in enumerate(r['projections']):
     rows['projections'].extend([[name,r['k'],j,v['pass'],v['i'],v['coefficient'],i,x,v['after'][i]]for i,x in enumerate(v['before'])])
    ls=r['ls'];a={k:ls[k]for k in ['H','R','Qt']};a.update({k:col(ls[k])for k in ['rhs','g']})
    if ls['y']is not None:a.update({k:col(ls[k])for k in ['y','residual']})
    rows['least-squares'].extend([[name,r['k'],*v]for v in entries(a)])
    for i,v in enumerate(ls['rotations']):
     rows['rotations'].append([name,r['k'],i,*[v[k]for k in ['j','i','a','b','length','c','s']]])
     a={'before':v['before'],'after':v['after'],'gBefore':col(v['gBefore']),'gAfter':col(v['gAfter'])}
     rows['rotation-matrices'].extend([[name,r['k'],i,*z]for z in entries(a)])
 ck(len(d['plots'])==len(wanted)==len(d['svgs']),'complete plots')
 ns={'s':'http://www.w3.org/2000/svg'}
 for index,(q,expected,svg)in enumerate(zip(d['plots'],wanted,d['svgs'])):
  ck([v['key']for v in q['series']]==list(expected),'ordered graph series')
  root=ET.fromstring(svg);ck(root.find('s:title',ns).text==q['title']and root.get('aria-label')==q['title'],'accessible title')
  vals=[v[1]for line in expected.values()for v in line]
  if not q['y'].startswith('log₁₀'):vals.append(0)
  lo=min(vals)if vals else 0;hi=max(vals)if vals else 0;pad=(hi-lo or 1)*.08
  close(q['ymin'],lo-pad,'unclipped lower extent',atol=1e-12);close(q['ymax'],hi+pad,'unclipped upper extent',atol=1e-12)
  xmax=(len(p['lambda'])-1 if index in [3,4]else min(3,s['steps'])if index==5 else s['steps'])if s['mode']=='cg'else s['steps']
  ck(q['xmin']==0 and q['xmax']==xmax,'x extent')
  xf=lambda x:100+750*(x-q['xmin'])/(q['xmax']-q['xmin'])
  yf=lambda y:335-250*(y-q['ymin'])/(q['ymax']-q['ymin'])
  for line in q['series']:
   points=expected[line['key']];ck(len(line['points'])==len(points),'complete data points')
   ck(line['line']==lines.get((index,line['key']),False),'no fabricated lines across omitted zeros')
   nodes=root.findall('.//s:circle[@data-series="'+line['key']+'"]',ns);ck(len(nodes)==len(points),'complete SVG markers')
   poly=root.find('.//s:polyline[@data-series="'+line['key']+'"]',ns);ck((poly is not None)==line['line'],'line presence')
   coords=[list(map(float,x.split(',')))for x in poly.get('points').split()]if poly is not None else None
   if coords is not None:ck(len(coords)==len(points),'complete polyline')
   for i,(actual,(x,y),node)in enumerate(zip(line['points'],points,nodes)):
    vec(actual,[x,y],'graph bound to checked trace',atol=2e-12)
    ck(q['xmin']<=x<=q['xmax']and q['ymin']<=y<=q['ymax'],'point within axes')
    ck(node.get('data-index')==str(i),'marker order')
    vec([float(node.get('cx')),float(node.get('cy'))],[xf(x),yf(y)],'SVG data coordinates',atol=1e-9,rtol=0)
    if coords is not None:vec(coords[i],[xf(x),yf(y)],'line coordinates',atol=1e-9,rtol=0)
 tables={t['key']:t for t in d['ledgers']};ck(set(tables)==set(rows)|{'summary'},'all ledgers')
 def cell(a,b):
  if type(b)in [int,float]:close(a,b,'displayed number',rtol=3e-15,atol=1e-28)
  else:ck(a==b,'displayed exact cell')
 ck(len(tables['summary']['rows'])==len(summary),'summary rows')
 for r,v in zip(tables['summary']['rows'],summary):cell(r[1],v)
 for key,expected in rows.items():
  actual=tables[key]['rows'];ck(len(actual)==len(expected),'complete rows '+key)
  for a,b in zip(actual,expected):
   ck(len(a)==len(b),'row width')
   for x,y in zip(a,b):cell(x,y)
 for t in tables.values():ck(all(len(r)==len(t['headers'])for r in t['rows']),'headers fit all rows')

for d in data['states']:
 science(d)
 if 'plots'in d:verify_views(d)
check_ls(data['rankFailure'])
ck(data['invalid']==177 and data['self']=={'status':'PASS','checks':10},'input guards and self checks')
print(json.dumps(dict(status='PASS',stage='science-and-views',states=len(data['states']),checks=checks,invalid=data['invalid'],self=data['self'])))

# Publication contract145
if len(sys.argv)==1:
 from html.parser import HTMLParser
 fixture=ROOT/'course-shared/projects/krylov-methods/run-snapshot.json'
 frozen=json.loads(fixture.read_text());ck(frozen['schema']==1,'snapshot schema')
 provenance=frozen['provenance']
 ck(provenance['labSha256']==hashlib.sha256(JS.read_bytes()).hexdigest(),'snapshot exact implementation')
 ck(provenance['runtime']=='v24.14.0'and provenance['platform']=='darwin'and provenance['arch']=='arm64'and provenance['capturedOn']=='2026-09-11','snapshot environment')
 ck((ROOT/'grad-math/site/assets/learning/projects/krylov-methods/run-snapshot.json').read_bytes()==fixture.read_bytes(),'snapshot public byte identity')
 for key,mode in [('cg','cg'),('rise','cg'),('rotation','gmres'),('weighted','precondition')]:
  ck(frozen[key]['config']['mode']==mode,'snapshot named mode');science(frozen[key])
 ck(frozen['cg']['config']['condition']==25 and frozen['rise']['config']['spectrum']=='residual-rise'and frozen['rotation']['config']['family']=='rotation'and frozen['rotation']['config']['restart']==1 and frozen['weighted']['config']['gamma']==0 and frozen['weighted']['config']['metricExponent']==2 and frozen['weighted']['config']['restart']==1,'static named inputs')
 src=(ROOT/'grad-math/lectures/nla-03-krylov.md').read_text();site=(ROOT/'grad-math/site/nla-03-krylov.html').read_text()
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
 for course in ['ai-course','grad-math','math-course']:ck((ROOT/course/'site/assets/learning/labs/cg-spectrum.js').read_bytes()==JS.read_bytes(),'tracked mirror')
 ck((ROOT/'.github/workflows/course-audit.yml').read_text().count('python tools/check_krylov_full.py')==1,'CI invocation')
 image=ROOT/'grad-math/images/nla-03-krylov-ledgers.svg'
 ck(image.read_bytes()==(ROOT/'grad-math/site/assets/img/nla-03-krylov-ledgers.svg').read_bytes(),'SVG mirror')
 panels=ET.parse(image).getroot().findall('.//{http://www.w3.org/2000/svg}svg');ck(len(panels)==4,'four static panels')
 code="const a=require(process.argv[1]),f=JSON.parse(require('fs').readFileSync(process.argv[2],'utf8'));console.log(JSON.stringify([a.plots(f.cg)[0],a.plots(f.rise)[5],a.plots(f.rotation)[4],a.plots(f.weighted)[4]].map(a.svg)))"
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
 table=re.search(r'data-learning-lab="cg-spectrum".*?<tbody>(.*?)</tbody>',site,re.S).group(1)
 vals=[float(html.unescape(x))for x in re.findall(r'<tr>\s*<td>.*?</td>\s*<td[^>]*>(.*?)</td>\s*</tr>',table,re.S)]
 refs=[]
 for m in frozen['cg']['result']['methods']:refs.extend([m['final']['k'],m['final']['relativeAError'],m['final']['relativeResidual']])
 m=frozen['rise']['result']['methods'][0];r=m['rows'][1]
 refs.extend([m['records'][0]['alpha'],r['relativeResidual'],r['relativeAError'],r['rho']])
 for m in frozen['rotation']['result']['methods'][:2]:refs.extend([m['final']['k'],m['final']['relativeResidual']])
 m=frozen['weighted']['result']['methods'][2]
 for k in [1,3]:refs.extend([m['rows'][k]['relativeResidual'],m['rows'][k]['relativeWeighted']])
 ck(len(vals)==len(refs)==18,'all fallback numbers')
 for x,y in zip(vals,refs):close(x,y,'frozen fallback value',rtol=2e-11,atol=1e-28)
 ck('run-snapshot.json' in site and '预算结束' in site and '浮点真残差为0' in site,'readable snapshot and stop conditions')
 print('formulas',len(formulas))
print(json.dumps(dict(status='PASS',checks=checks,states=len(data['states']),invalid=data['invalid'],self=data['self'])))
