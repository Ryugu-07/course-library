"""Independent standard-library eigenvalue references, step identities and presentation contracts."""
from pathlib import Path
from decimal import Decimal as D,localcontext
import subprocess,shutil,json,math,sys,re,html,hashlib,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/eigen-iteration.js'
code=r'''
const a=require(process.argv[1]),cs=[...a.PRESETS];
for(const gap of [0,1e-8,2,4,5,6])for(const initialAngle of [0,5,90])cs.push({gap,initialAngle,axisAngle:0});
for(const gamma of [0,6,50])for(const shift of [1,1.01,2,3])cs.push({kind:"nonnormal",gamma,shift});
for(const realPart of [-2,0,2])cs.push({kind:"rotation",realPart});
for(const scaleExponent of [-12,12])for(const kind of ["symmetric","nonnormal","rotation"])cs.push({kind,scaleExponent});
for(const center of [-2,0,2,4])for(const coupling of [0,1e-8,.4,1])for(const scaleExponent of [-12,0,12])cs.push({mode:"qr",center,coupling,scaleExponent,steps:64});
for(const gamma of [0,6,50])for(const scaleExponent of [-12,0,12])for(const z of [1,1.5,2,2.00000001])cs.push({mode:"sensitivity",gamma,scaleExponent,z});
cs.push({mode:"sensitivity",z:1.5*(1+Number.EPSILON)});
let invalid=0;
const groups=[
 [{},["gap","axisAngle","initialAngle","shift","steps","scaleExponent"]],
 [{kind:"nonnormal"},["gamma"]],[{kind:"rotation"},["realPart","omega"]],
 [{mode:"qr"},["center","coupling","steps","scaleExponent"]],
 [{mode:"sensitivity"},["gamma","z","epsilon","scaleExponent"]]
];
for(const [c,fields]of groups)for(const key of fields)for(const v of ["",null,true,false,[],{},NaN,Infinity,-Infinity,"1e309","1e-400","0x10","3x"]){
 let bad=false;try{a.config({...c,[key]:v});}catch(e){bad=true;}if(!bad)throw Error("invalid "+key);invalid++;
}
for(const c of [null,[],{mode:"x"},{kind:"x"},{steps:1.5},{steps:0},{steps:65},{gap:-1},{gap:6.1},{axisAngle:91},{initialAngle:-91},{shift:6},{scaleExponent:1.5},{scaleExponent:13},{kind:"rotation",omega:0},{kind:"nonnormal",gamma:51},{mode:"qr",coupling:-.1},{mode:"qr",center:5},{mode:"sensitivity",epsilon:0},{mode:"sensitivity",z:5}]){
 let bad=false;try{a.config(c);}catch(e){bad=true;}if(!bad)throw Error("boundary");invalid++;
}
a.snapshot({mode:"qr",gap:null,kind:"x",gamma:NaN,z:""});
a.snapshot({kind:"symmetric",gamma:null,realPart:"",omega:NaN});
a.snapshot({mode:"sensitivity",steps:"",center:null,coupling:NaN,kind:"x"});
if(a.config({steps:"10",scaleExponent:"-0",gap:"2e0"}).steps!==10)throw Error("numeric strings");
const states=cs.map((c,i)=>{const d=a.snapshot(c);return i<a.PRESETS.length?{...d,plots:a.plots(d),ledgers:a.ledgers(d),svgs:a.plots(d).map(a.svg)}:d;});
console.log(JSON.stringify({states,invalid,self:a.selfTest()}));
'''
data=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve())],text=True));checks=0
def ck(v,label):
 global checks
 assert v,label;checks+=1
def close(x,y,label,scale=1,rtol=3e-12,atol=3e-14):
 y=float(y);ck(isinstance(x,(int,float))and math.isfinite(x)and abs(x-y)<=atol*scale+rtol*abs(y),(label,x,y,scale))
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
def eye(n):return[[int(i==j)for j in range(n)]for i in range(n)]
def outer(x,y):return[[a*b for b in y]for a in x]
def dec(x):return D.from_float(x)if isinstance(x,float)else D(x)
def angle(degrees):
 if degrees%90==0:return[[1,0],[0,1],[-1,0],[0,-1]][int(degrees/90)%4]
 return[math.cos(math.radians(degrees)),math.sin(math.radians(degrees))]
def check_solver(v):
 M,b=v['M'],v['b'];size=fro(M);close(v['size'],size,'solve normalization',scale=size)
 if not size:ck(v['status']=='singular-shift','zero shifted matrix');return
 B=[[x/size for x in r]for r in M];rhs=[x/size for x in b]
 swap=abs(B[1][0])>abs(B[0][0]);ck(v['swapped']==swap,'actual partial pivot choice')
 if swap:B.reverse();rhs.reverse()
 if B[0][0]==0:ck(v['status']=='singular-shift','zero first pivot');return
 multiplier=B[1][0]/B[0][0];pivot=B[1][1]-multiplier*B[0][1]
 close(v['multiplier'],multiplier,'elimination multiplier');close(v['pivot'],pivot,'actual second pivot',atol=1e-15)
 if pivot==0:ck(v['status']=='singular-shift','zero second pivot');return
 ck(v['status']=='ok','finite 2x2 solve')
 L=[[1,0],[multiplier,1]];U=[[B[0][0],B[0][1]],[0,pivot]]
 mat(v['L'],L,'L');mat(v['U'],U,'U');mat(mm(L,U),B,'PLU reconstruction')
 vec(v['permutedRhs'],rhs,'permuted RHS',scale=norm(rhs))
 f=[rhs[0],rhs[1]-multiplier*rhs[0]];vec(v['forwardRhs'],f,'forward substitution',scale=norm(rhs))
 # Near-singular shifts amplify tiny cross-runtime scaling differences.
 # Verify the actual stored factor solve, after checking its backward identities.
 actualU,actualF=v['U'],v['forwardRhs']
 x1=actualF[1]/actualU[1][1];x0=(actualF[0]-actualU[0][1]*x1)/actualU[0][0]
 vec(v['x'],[x0,x1],'back substitution',scale=norm([x0,x1]))
 r=sub(mv(M,v['x']),b);den=size*norm(v['x'])+norm(b)
 vec(v['residual'],r,'linear solve residual',scale=den)
 close(v['relativeResidual'],norm(r)/den,'linear solve relative residual')
 ck(v['relativeResidual']<2e-14,'small solve backward error')
def check_iteration(s,p):
 f=p['info'];scale=10**s['scaleExponent'];close(f['scale'],scale,'input scale',scale=scale)
 if s['kind']=='symmetric':
  c,t=angle(2*s['axisAngle']);mid=2-s['gap']/2;b=s['gap']/2*t
  A=[[scale*(mid+s['gap']/2*c),scale*b],[scale*b,scale*(mid-s['gap']/2*c)]]
  ck(f['normal']and f['real'],'symmetric classification')
 elif s['kind']=='nonnormal':
  A=[[2*scale,s['gamma']*scale],[0,scale]];ck(f['normal']==(s['gamma']==0)and f['real'],'triangular classification')
 else:
  A=[[s['realPart']*scale,-s['omega']*scale],[s['omega']*scale,s['realPart']*scale]]
  ck(f['normal']and not f['real'],'rotation classification')
 mat(f['A'],A,'actual family',scale=scale);A=f['A'];an=fro(A)
 with localcontext()as ctx:
  ctx.prec=70;a,b,c,d=map(dec,[A[0][0],A[0][1],A[1][0],A[1][1]])
  mid=(a+d)/2;disc=((a-d)/2)**2+b*c
  if f['real']:
   radius=disc.sqrt();values=[float(mid+radius),float(mid-radius)]
   vec(f['values'],values,'independent quadratic spectrum',scale=scale)
   for i,v in enumerate(f['vectors']):
    if v is not None:
     close(norm(v),1,'unit spectral reference');vec(mv(A,v),[f['values'][i]*x for x in v],'spectral vector equation',scale=an)
   unique=abs(f['values'][0])!=abs(f['values'][1]);expected=0 if abs(f['values'][0])>abs(f['values'][1])else 1
   ck(f['dominant']==(expected if unique else None),'maximum absolute eigenvalue')
   close(f['gap'],abs(f['values'][0]-f['values'][1]),'actual spectral gap',scale=scale)
  else:
   for i,v in enumerate(f['values']):
    close(v['real'],mid,'complex real part',scale=scale);close(v['imag'],float((-disc).sqrt())*(1 if i==0 else-1),'complex imaginary part',scale=scale)
   ck(f['dominant']is None and f['gap']is None and f['vectors']==[None,None],'no real eigenvector')
 vec(p['x0'],angle(s['initialAngle']),'exact quadrant initial vector')
 close(p['shift'],s['shift']*scale,'actual fixed shift',scale=scale)
 ck([m['method']for m in p['methods']]==['power','inverse','rayleigh'],'three vector algorithms')
 for run in p['methods']:
  rows,records=run['rows'],run['records']
  ck(len(rows)==1+sum(r['accepted']for r in records),'full accepted trace')
  ck(run['final']==rows[-1],'final row bound to trace')
  for k,row in enumerate(rows):
   ck(row['k']==k,'sequential accepted steps');x=row['x'];nx=norm(x);close(nx,1,'unit iterate')
   rho=dot(x,mv(A,x))/dot(x,x);r=sub(mv(A,x),[rho*v for v in x]);rn=norm(r)
   close(row['rho'],rho,'Rayleigh quotient',scale=an);vec(row['residual'],r,'actual eigen residual',scale=an)
   close(row['residualNorm'],rn,'residual norm',scale=an);close(row['relativeResidual'],rn/(an*nx)if an else 0,'relative residual')
   perturbation=outer([-v/dot(x,x)for v in row['residual']],x)
   mat(row['perturbation'],perturbation,'minimum rank-one perturbation',scale=an)
   vec(mv([[a+b for a,b in zip(u,v)]for u,v in zip(A,perturbation)],x),[row['rho']*v for v in x],'attained eigenpair',scale=an)
   close(row['backwardNorm'],row['residualNorm']/nx,'minimum perturbation norm',scale=an)
   if f['real']:
    dist=[abs(v-row['rho'])for v in f['values']];idx=None if f['values'][0]==f['values'][1]or dist[0]==dist[1]else(0 if dist[0]<dist[1]else 1)
    close(row['distance'],min(dist),'distance to real spectrum',scale=an)
   else:
    idx=None;close(row['distance'],math.hypot(row['rho']-f['values'][0]['real'],f['values'][0]['imag']),'distance to complex spectrum',scale=an)
   ck(row['nearestIndex']==idx,'nearest unique actual target')
   if idx is None:ck(all(row[q]is None for q in ['targetValue','angle','separation','certificate']),'undefined direction fields')
   else:
    v=f['vectors'][idx];theta=math.atan2(abs(x[0]*v[1]-x[1]*v[0]),abs(dot(x,v)));sep=abs(f['values'][1-idx]-row['rho'])
    close(row['targetValue'],f['values'][idx],'target value',scale=an);close(row['angle'],theta,'subspace angle');close(row['separation'],sep,'current separation',scale=an)
    if f['normal']and sep>0:
     close(row['certificate'],min(1,row['residualNorm']/(nx*sep)),'normal angle certificate')
     ck(math.sin(theta)<=row['certificate']+16*sys.float_info.epsilon*an/sep,'normal angle bound with spectrum rounding allowance')
    else:ck(row['certificate']is None,'no unauthorized normal theorem')
  for k,v in enumerate(records,1):
   ck(v['k']==k,'attempt sequence');vec(v['before'],rows[k-1]['x'],'step starts from stored iterate')
   if run['method']=='power':ck(v['solver']is None and v['shift']is None,'power is matrix product');vec(v['raw'],mv(A,v['before']),'actual matrix product',scale=an)
   else:
    shift=p['shift']if run['method']=='inverse'else rows[k-1]['rho'];close(v['shift'],shift,'actual applied shift',scale=an)
    mat(v['solver']['M'],[[a-(shift if i==j else 0)for j,a in enumerate(r)]for i,r in enumerate(A)],'shifted system',scale=an)
    vec(v['solver']['b'],v['before'],'shifted RHS');check_solver(v['solver'])
   if v['accepted']:
    if v['solver']:vec(v['raw'],v['solver']['x'],'use actual solve',scale=norm(v['raw']))
    close(v['normalizer'],norm(v['raw']),'normalization factor',scale=norm(v['raw']))
    vec(v['after'],[x/norm(v['raw'])for x in v['raw']],'normalized update');vec(v['after'],rows[k]['x'],'update in trace')
   else:ck(v['solver']['status']==run['status'],'failure not hidden')
  last=run['final'];st=run['status']
  if st=='zero-floating-residual':ck(last['residualNorm']==0,'reported actual floating zero')
  elif st=='residual-threshold':ck(0<last['relativeResidual']<=64*sys.float_info.epsilon,'reported threshold stop')
  elif st=='iteration-budget':ck(last['k']==s['steps']and last['relativeResidual']>64*sys.float_info.epsilon,'budget really exhausted')
  elif st=='zero-product':ck(norm(mv(A,last['x']))==0,'actual zero product')
  else:ck(st in ['singular-shift','nonfinite-solve'],'explicit solve failure')
  expected=f['dominant']if run['method']=='power'else None
  if run['method']=='inverse'and f['real']and f['values'][0]!=f['values'][1]:
   ds=[abs(v-p['shift'])for v in f['values']];expected=None if ds[0]==ds[1]else (0 if ds[0]<ds[1]else 1)
  ck(run['expectedIndex']==expected,'algorithm target rule')
def check_qr(s,p):
 scale=10**s['scaleExponent'];A=[[scale*(s['center']if i==j else s['coupling']if abs(i-j)==1 else 0)for j in range(4)]for i in range(4)]
 an=fro(A);mat(p['A'],A,'four site chain',scale=scale)
 spectrum=sorted(scale*(s['center']+2*s['coupling']*math.cos(k*math.pi/5))for k in range(1,5))
 vec(p['spectrum'],spectrum,'independent sine-mode spectrum',scale=scale);close(p['scale'],scale,'QR scale',scale=scale)
 ck([m['method']for m in p['methods']]==['unshifted','wilkinson'],'both QR strategies')
 for run in p['methods']:
  rows,records,events=run['rows'],run['records'],run['events']
  ck(len(rows)==len(records)+1 and run['stepsTaken']==len(records),'all QR steps')
  ck(run['final']==rows[-1]and run['active']==rows[-1]['active'],'QR final row')
  budget=0;lastindex=4
  for v in events:
   i=v['index'];ck(i==lastindex-1,'successive tail deflation');lastindex=i
   before=v['before'];connections=[before[j][i]for j in range(i)]+[before[i][j]for j in range(i)]
   threshold=64*sys.float_info.epsilon*(abs(before[i][i])+abs(before[i-1][i-1]))
   close(v['threshold'],threshold,'deflation threshold',scale=scale);close(v['couplingNorm'],norm(connections),'all tail connections',scale=scale)
   ck(v['couplingNorm']==0 or v['couplingNorm']<=v['threshold'],'deletion allowed')
   correction=[[(-before[a][b]if(a==i and b<i)or(b==i and a<i)else 0)for b in range(4)]for a in range(4)]
   mat(v['correction'],correction,'all explicit deleted entries',scale=scale)
   mat(v['after'],[[a+b for a,b in zip(r,t)]for r,t in zip(before,correction)],'actual deflated matrix',scale=scale)
   close(v['size'],fro(correction),'deletion norm',scale=scale);budget+=v['size'];close(v['budget'],budget,'accumulated deletion budget',scale=scale)
  for k,row in enumerate(rows):
   ck(row['k']==k,'QR row index');T,Z=row['T'],row['Z']
   vec(row['diagonal'],[T[i][i]for i in range(4)],'actual diagonal',scale=scale)
   close(row['offDiagonal'],norm([v for i,r in enumerate(T)for j,v in enumerate(r)if i!=j]),'all off diagonal entries',scale=scale)
   close(row['tail'],abs(T[row['active']-1][row['active']-2])if row['active']>1 else 0,'active tail',scale=scale)
   close(row['diagonalDeviation'],norm(sub(sorted(row['diagonal']),p['spectrum'])),'diagonal estimate deviation',scale=scale)
   similarity=fro(msub(mm(mm(tr(Z),A),Z),T));orth=fro(msub(mm(tr(Z),Z),eye(4)))
   close(row['similarity'],similarity,'actual similarity residual',scale=an);close(row['eigenResidual'],fro(msub(mm(A,Z),mm(Z,T))),'basis eigen residual',scale=an)
   close(row['relativeSimilarity'],similarity/an if an else 0,'relative similarity');close(row['orthogonality'],orth,'cumulative basis orthogonality')
   ck(orth<4e-13,'basis remains orthogonal')
   e=[v for v in events if v['iteration']<=k];b=sum(v['size']for v in e)
   close(row['deflationBudget'],b,'all deletions to date',scale=scale);close(row['relativeDeflationBudget'],b/an if an else 0,'relative budget')
   ck(row['active']==4-len(e),'active dimension follows deletions')
  for k,v in enumerate(records,1):
   m=v['activeBefore'];ck(v['k']==k and m==rows[k-1]['active'],'active QR sequence')
   before=v['before'];mat(before,rows[k-1]['T'],'step starts from actual preceding T',scale=scale)
   shift=v['shift']
   if run['method']=='unshifted':ck(shift['value']==0 and all(shift[x]is None for x in ['a','b','d','delta','denominator']),'unshifted has no hidden shift')
   else:
    a,d=before[m-2][m-2],before[m-1][m-1];b=(before[m-2][m-1]+before[m-1][m-2])/2;delta=(a-d)/2;den=abs(delta)+math.hypot(delta,b)
    expected=d if b==0 else d-(1 if delta>=0 else-1)*b*(b/den)
    vec([shift[x]for x in ['a','d','b','delta','value','denominator']],[a,d,b,delta,expected,den if b else 0],'local stable shift formula',scale=scale)
   M=[[before[i][j]-(shift['value']if i==j else 0)for j in range(m)]for i in range(m)]
   mat(v['shiftedMatrix'],M,'actual shifted active block',scale=scale)
   Q,R=v['Q'],v['R'];mat(mm(Q,R),M,'Givens factor reconstruction',scale=scale);mat(mm(tr(Q),Q),eye(m),'Q orthogonal')
   work=[r[:]for r in M];Qt=eye(m);idx=0
   for j in range(m-1):
    for i in range(m-1,j,-1):
     g=v['rotations'][idx];idx+=1;ck(g['j']==j and g['i']==i,'complete ordered rotation list')
     mat(g['before'],work,'rotation actual input',scale=scale)
     # Check each recorded input, then replay that operation. Replaying a whole
     # near-zero elimination chain on another CPU can choose a different rotation.
     work=[r[:]for r in g['before']]
     a,b=work[i-1][j],work[i][j];length=math.hypot(a,b);c=a/length if length else 1;sn=b/length if length else 0
     vec([g['a'],g['b'],g['length']],[a,b,length],'rotation inputs',scale=scale);vec([g['c'],g['s']],[c,sn],'rotation coefficients');ck(g['skipped']==(length==0),'zero rotation boundary')
     for l in range(j,m):
      x,y=work[i-1][l],work[i][l];work[i-1][l]=c*x+sn*y;work[i][l]=-sn*x+c*y
     for l in range(m):
      x,y=Qt[i-1][l],Qt[i][l];Qt[i-1][l]=c*x+sn*y;Qt[i][l]=-sn*x+c*y
     work[i][j]=0;mat(g['after'],work,'actual rotation output',scale=scale)
   ck(idx==len(v['rotations']),'no missing rotation');mat(R,work,'R after rotations',scale=scale);mat(Q,tr(Qt),'Q from rotations')
   raw=[r[:]for r in before];nextT=mm(R,Q);embedded=eye(4)
   for i in range(m):
    for j in range(m):raw[i][j]=nextT[i][j]+(shift['value']if i==j else 0);embedded[i][j]=Q[i][j]
   mat(v['raw'],raw,'actual RQ plus shift',scale=scale)
   mat(rows[k]['Z'],mm(rows[k-1]['Z'],embedded),'cumulative actual Q product')
   local=[e for e in events if e['iteration']==k];ck(v['deflations']==[[e['index'],e['size']]for e in local],'recorded deletion references')
   current=v['raw']
   for e in local:mat(e['before'],current,'deletion starts after this QR',scale=scale);current=e['after']
   mat(rows[k]['T'],current,'QR plus explicit deletions',scale=scale)
  initial=[e for e in events if e['iteration']==0];current=A
  for e in initial:mat(e['before'],current,'initial deflation begins at input',scale=scale);current=e['after']
  mat(rows[0]['T'],current,'initial state');mat(rows[0]['Z'],eye(4),'initial basis')
  if run['status']=='deflated':ck(run['active']==1,'complete tail deflation');vec(sorted(run['final']['diagonal']),spectrum,'completed spectrum',scale=scale,atol=3e-12)
  else:ck(run['status']=='iteration-budget'and run['stepsTaken']==s['steps']and run['active']>1,'honest QR budget')
def check_sensitivity(s,p):
 scale=10**s['scaleExponent'];close(p['scale'],scale,'sensitivity scale',scale=scale);close(p['threshold'],s['epsilon']*scale,'scaled tolerance',scale=scale)
 grid=[-1+i/20 for i in range(101)];near=[i for i,x in enumerate(grid)if abs(x-s['z'])<=8*sys.float_info.epsilon*max(abs(x),abs(s['z']))]
 ck(len(near)<=1,'single representable neighbour')
 if near:grid[near[0]]=s['z']
 else:grid.append(s['z'])
 vec([v['z']for v in p['study']],sorted(grid),'complete real slice',atol=1e-15)
 ck(s['z']in [v['z']for v in p['study']],'exact current slice point')
 for v in [p['result'],*p['study']]:
  z=v['z'];gamma=s['gamma'];A=[[2*scale,gamma*scale],[0,scale]];M=[[x-(z*scale if i==j else 0)for j,x in enumerate(r)]for i,r in enumerate(A)]
  mat(v['A'],A,'triangular matrix',scale=scale);mat(v['M'],M,'shifted triangular matrix',scale=scale)
  with localcontext()as ctx:
   ctx.prec=80;a=2-dec(z);b=dec(gamma);d=1-dec(z);trace=a*a+b*b+d*d;det=(a*d)**2
   large=(trace+(trace*trace-4*det).sqrt())/2;small=det/large
   sig=[float(large.sqrt())*scale,float(small.sqrt())*scale]
  vec([v['sigmaMax'],v['sigmaMin']],sig,'independent Decimal singular values',scale=scale)
  close(v['distance'],min(abs(z-2),abs(z-1))*scale,'distance independent of gamma',scale=scale)
  x=v['v'];close(norm(x),1,'unit singular vector')
  r=mv(v['M'],x);vec(v['residual'],r,'actual witness residual',scale=scale);close(v['actualResidual'],norm(r),'witness residual norm',scale=scale)
  close(norm(r),v['sigmaMin'],'attains least residual',scale=scale,atol=2e-13)
  E=outer([-a for a in r],x);mat(v['E'],E,'rank-one minimizing E',scale=scale)
  close(v['perturbationNorm'],fro(E),'rank-one spectral equals Frobenius norm',scale=scale)
  changed=[[a+b for a,b in zip(r,t)]for r,t in zip(A,v['E'])];mat(v['changed'],changed,'changed matrix',scale=scale)
  res=sub(mv(v['changed'],x),[z*scale*a for a in x]);vec(v['changedResidual'],res,'actual final equation residual',scale=scale)
  vec(res,[0,0],'attained eigenpair up to arithmetic',scale=scale,atol=3e-13)
  if gamma==0:close(v['distance'],v['sigmaMin'],'normal case distance equality',scale=scale)
def check_science(d):
 s,p=d['config'],d['result']
 if s['mode']=='iteration':check_iteration(s,p)
 elif s['mode']=='qr':check_qr(s,p)
 else:check_sensitivity(s,p)
NAMES={'power':'幂法','inverse':'固定移位反幂','rayleigh':'Rayleigh商迭代','unshifted':'无移位QR','wilkinson':'Wilkinson移位'}
STATUS={'iteration-budget':'预算结束','zero-floating-residual':'浮点零残差','residual-threshold':'达到残差阈值','zero-product':'矩阵乘积为零','singular-shift':'移位系统奇异','nonfinite-solve':'求解产生非有限值','deflated':'已完成尾端缩减','ok':'成功'}
def col(x):return[[v]for v in x]
def entries(objects):return[[name,i,j,x]for name,A in objects.items()for i,r in enumerate(A)for j,x in enumerate(r)]
def verify_views(d):
 s,p=d['config'],d['result'];plots=d['plots'];rows={};summary=[]
 if s['mode']=='iteration':
  wanted=[{}, {}, {}, {}]
  f=p['info'];scale=f['scale']
  for m in p['methods']:
   key=m['method'];rs=m['rows'];name=NAMES[key]
   wanted[0][key]=[[v['k'],v['rho']/scale]for v in rs]
   wanted[1][key]=[[v['k'],math.log10(v['relativeResidual'])]for v in rs if v['relativeResidual']>0]
   wanted[2][key]=[[v['k'],math.sin(v['angle'])]for v in rs if v['angle']is not None]
   wanted[2][key+'-bound']=[[v['k'],v['certificate']]for v in rs if v['certificate']is not None]
   wanted[3][key]=[v['x']for v in rs]
  if f['real']:
   for i,v in enumerate(f['values']):wanted[0]['lambda'+str(i)]=[[0,v/scale],[s['steps'],v/scale]]
  summary=[s['kind'],f['normal'],f['real'],f['values'][0]if f['real']else f['values'][0]['real'],f['values'][1]if f['real']else f['values'][1]['real'],0 if f['real']else f['values'][0]['imag'],scale,p['shift'],64*sys.float_info.epsilon,'||A||F ||x||₂',f['dominant']]
  rows['methods']=[[NAMES[m['method']],STATUS[m['status']],m['final']['k'],None if m['expectedIndex']is None else f['values'][m['expectedIndex']],m['final']['targetValue'],m['final']['rho'],m['final']['relativeResidual'],None if m['final']['angle']is None else math.sin(m['final']['angle']),m['final']['certificate']]for m in p['methods']]
  rows['input']=entries({'A':f['A'],'x0':col(p['x0'])})
  rows['trace']=[[NAMES[m['method']],r['k'],*r['x'],r['rho'],*r['residual'],r['residualNorm'],r['relativeResidual'],r['nearestIndex'],r['targetValue'],r['distance'],r['angle'],r['separation'],r['certificate'],r['backwardNorm']]for m in p['methods']for r in m['rows']]
  rows['perturbations']=[[NAMES[m['method']],r['k'],*v]for m in p['methods']for r in m['rows']for v in entries({'deltaA':r['perturbation']})]
  rows['updates']=[];rows['solves']=[];rows['pivots']=[]
  for m in p['methods']:
   for r in m['records']:
    v=r['solver'];name=NAMES[m['method']]
    rows['updates'].append([name,r['k'],r['accepted'],r['shift'],*r['before'],*(r.get('raw')or[None,None]),r.get('normalizer'),*(r.get('after')or[None,None]),STATUS[v['status']]if v else'矩阵乘法',v.get('relativeResidual')if v else None])
    if v:
     mats={'M':v['M'],'b':col(v['b'])}
     for k in ['L','U']:
      if k in v:mats[k]=v[k]
     for k in ['permutedRhs','forwardRhs','x','residual']:
      if k in v:mats[k]=col(v[k])
     rows['solves'].extend([[name,r['k'],*z]for z in entries(mats)])
     rows['pivots'].append([name,r['k'],STATUS[v['status']],v['size'],v.get('swapped'),v.get('multiplier'),v.get('pivot')])
 elif s['mode']=='qr':
  wanted=[{}, {'reference':[[i,v/p['scale']]for i,v in enumerate(p['spectrum'])]}, {}, {}]
  for m in p['methods']:
   key=m['method'];rs=m['rows']
   wanted[0][key]=[[v['k'],math.log10(v['offDiagonal']/p['scale'])]for v in rs if v['offDiagonal']>0]
   wanted[1][key]=[[i,v/p['scale']]for i,v in enumerate(sorted(m['final']['diagonal']))]
   for field,suffix in [('relativeSimilarity','-similarity'),('orthogonality','-orthogonality')]:wanted[2][key+suffix]=[[v['k'],math.log10(v[field])]for v in rs if v[field]>0]
   wanted[3][key]=[[v['k'],v['relativeDeflationBudget']]for v in rs]
  summary=[s['center'],s['coupling'],p['scale'],fro(p['A']),*p['spectrum'],64*sys.float_info.epsilon,'||全部尾行列连接||₂ ≤ 64u(|tᵢᵢ|+|tᵢ₋₁,ᵢ₋₁|)']
  rows['methods']=[[NAMES[m['method']],STATUS[m['status']],m['stepsTaken'],m['active'],m['final']['offDiagonal'],m['final']['diagonalDeviation'],m['final']['relativeSimilarity'],m['final']['orthogonality'],m['final']['deflationBudget']]for m in p['methods']]
  rows['trace']=[[NAMES[m['method']],r['k'],r['active'],*r['diagonal'],*[r[k]for k in ['offDiagonal','tail','diagonalDeviation','similarity','eigenResidual','relativeSimilarity','orthogonality','deflationBudget','relativeDeflationBudget']]]for m in p['methods']for r in m['rows']]
  rows['bases']=[[NAMES[m['method']],r['k'],*v]for m in p['methods']for r in m['rows']for v in entries({'T':r['T'],'Z':r['Z']})]
  rows['shifts']=[[NAMES[m['method']],r['k'],r['activeBefore'],*[r['shift'][k]for k in ['value','a','d','b','delta','denominator']]]for m in p['methods']for r in m['records']]
  rows['factorizations']=[[NAMES[m['method']],r['k'],*v]for m in p['methods']for r in m['records']for v in entries({'before':r['before'],'shifted':r['shiftedMatrix'],'Q':r['Q'],'R':r['R'],'raw':r['raw']})]
  rows['rotations']=[[NAMES[m['method']],r['k'],i,*[v[k]for k in ['j','i','a','b','length','c','s','skipped']]]for m in p['methods']for r in m['records']for i,v in enumerate(r['rotations'])]
  rows['rotation-matrices']=[[NAMES[m['method']],r['k'],i,*z]for m in p['methods']for r in m['records']for i,v in enumerate(r['rotations'])for z in entries({'before':v['before'],'after':v['after']})]
  rows['deflations']=[[NAMES[m['method']],i,*[v[k]for k in ['iteration','index','couplingNorm','threshold','size','budget']]]for m in p['methods']for i,v in enumerate(m['events'])]
  rows['deflation-matrices']=[[NAMES[m['method']],i,*z]for m in p['methods']for i,v in enumerate(m['events'])for z in entries({'before':v['before'],'correction':v['correction'],'after':v['after']})]
 else:
  scale=p['scale'];v=p['result']
  wanted=[
   {'sigma':[[r['z'],r['sigmaMin']/scale]for r in p['study']],'distance':[[r['z'],r['distance']/scale]for r in p['study']],'epsilon':[[-1,s['epsilon']],[4,s['epsilon']]]},
   {'minimum':[[r['z'],r['sigmaMin']/scale]for r in p['study']],'achieved':[[r['z'],r['perturbationNorm']/scale]for r in p['study']]},
   {'check':[[r['z'],math.log10(norm(r['changedResidual'])/scale)]for r in p['study']if norm(r['changedResidual'])>0]}
  ]
  summary=[s['gamma'],scale,s['z']*scale,p['threshold'],v['distance'],v['sigmaMin'],v['sigmaMax'],v['actualResidual'],v['perturbationNorm'],norm(v['changedResidual']),v['sigmaMin']<=p['threshold']]
  rows['matrices']=entries({'A':v['A'],'M':v['M'],'v':col(v['v']),'residual':col(v['residual']),'E':v['E'],'changed':v['changed'],'changedResidual':col(v['changedResidual'])})
  rows['study']=[[r['z'],r['sigmaMin'],r['sigmaMax'],r['distance'],*r['v'],r['actualResidual'],r['perturbationNorm'],norm(r['changedResidual']),r['sigmaMin']<=p['threshold']]for r in p['study']]
  rows['scan-matrices']=[[r['z'],*z]for r in p['study']for z in entries({'M':r['M'],'v':col(r['v']),'residual':col(r['residual']),'E':r['E'],'changed':r['changed'],'changedResidual':col(r['changedResidual'])})]
 ck(len(plots)==len(wanted)==len(d['svgs']),'complete plot collection')
 ns={'s':'http://www.w3.org/2000/svg'}
 for index,(q,expected,svg)in enumerate(zip(plots,wanted,d['svgs'])):
  ck({v['key']for v in q['series']}==set(expected),'semantic graph series')
  root=ET.fromstring(svg);ck(root.find('s:title',ns).text==q['title']and root.get('aria-label')==q['title'],'accessible plot title')
  ck(q['xmax']>q['xmin']and q['ymax']>q['ymin'],'positive axis extent')
  vals=[v[1]for line in expected.values()for v in line]
  if not q['y'].startswith('log₁₀'):vals.append(0)
  lo=min(vals)if vals else 0;hi=max(vals)if vals else 0;pad=(hi-lo or 1)*.08
  if not q['square']:
   close(q['ymin'],lo-pad,'actual data lower extent',atol=1e-12);close(q['ymax'],hi+pad,'actual data upper extent',atol=1e-12)
  left,width=(325,250)if q['square']else(100,750)
  xf=lambda x:left+width*(x-q['xmin'])/(q['xmax']-q['xmin'])
  yf=lambda y:335-250*(y-q['ymin'])/(q['ymax']-q['ymin'])
  if q['square']:ck(q['xmin']==q['ymin']and q['xmax']==q['ymax'],'same-unit vector coordinates')
  for line in q['series']:
   points=expected[line['key']];ck(len(line['points'])==len(points),'complete plotted series')
   expected_line=(index==0)if s['mode']=='iteration'else ((index==1 and line['key']=='reference')or index==3)if s['mode']=='qr'else index==0 or(index==1 and line['key']=='minimum')
   ck(line['line']==expected_line,'no false line across zero or undefined values')
   nodes=root.findall('.//s:circle[@data-series="'+line['key']+'"]',ns);ck(len(nodes)==len(points),'all SVG markers')
   poly=root.find('.//s:polyline[@data-series="'+line['key']+'"]',ns);ck((poly is not None)==line['line'],'line contract')
   coords=[list(map(float,x.split(',')))for x in poly.get('points').split()]if poly is not None else None
   if coords is not None:ck(len(coords)==len(points),'complete line coordinates')
   for i,(actual,(x,y),node)in enumerate(zip(line['points'],points,nodes)):
    vec(actual,[x,y],'plot derived from checked data',atol=2e-12)
    ck(q['xmin']-1e-12<=x<=q['xmax']+1e-12 and q['ymin']-1e-12<=y<=q['ymax']+1e-12,'point inside graph')
    ck(node.get('data-index')==str(i),'point order')
    vec([float(node.get('cx')),float(node.get('cy'))],[xf(x),yf(y)],'actual SVG coordinates',atol=1e-9,rtol=0)
    if coords is not None:vec(coords[i],[xf(x),yf(y)],'line coordinates',atol=1e-9,rtol=0)
 tables={t['key']:t for t in d['ledgers']};ck(set(tables)==set(rows)|{'summary'},'all full ledgers')
 def cell(a,b):
  if type(b)in [int,float]:close(a,b,'numeric displayed cell',rtol=3e-15,atol=1e-28)
  else:ck(a==b,'exact displayed cell')
 ck(len(tables['summary']['rows'])==len(summary),'summary size')
 for row,value in zip(tables['summary']['rows'],summary):cell(row[1],value)
 for key,expected in rows.items():
  actual=tables[key]['rows'];ck(len(actual)==len(expected),'all rows '+key)
  for a,b in zip(actual,expected):
   ck(len(a)==len(b),'ledger row width')
   for x,y in zip(a,b):cell(x,y)
 for t in tables.values():ck(all(len(r)==len(t['headers'])for r in t['rows']),'header width')
for d in data['states']:
 check_science(d)
 if 'plots'in d:verify_views(d)
ck(data['invalid']==241 and data['self']=={'status':'PASS','checks':11},'invalid cases and self-tests')
print(json.dumps(dict(status='PASS',stage='science-and-views',states=len(data['states']),checks=checks,invalid=data['invalid'],self=data['self'])))

# Publication contract144
if len(sys.argv)==1:
 from html.parser import HTMLParser
 fixture=ROOT/'course-shared/projects/eigen-iteration/run-snapshot.json'
 frozen=json.loads(fixture.read_text());ck(frozen['schema']==1,'snapshot schema')
 provenance=frozen['provenance']
 ck(provenance['labSha256']==hashlib.sha256(JS.read_bytes()).hexdigest(),'snapshot exact implementation')
 ck(provenance['runtime']=='v24.14.0'and provenance['platform']=='darwin'and provenance['arch']=='arm64'and provenance['capturedOn']=='2026-09-11','snapshot environment')
 ck((ROOT/'grad-math/site/assets/learning/projects/eigen-iteration/run-snapshot.json').read_bytes()==fixture.read_bytes(),'snapshot public byte identity')
 for key,mode in [('vectors','iteration'),('chain','qr'),('slice','sensitivity')]:
  ck(frozen[key]['config']['mode']==mode,'snapshot named mode');check_science(frozen[key])
 ck(frozen['chain']['config']['steps']==32 and frozen['chain']['config']['center']==2 and frozen['chain']['config']['coupling']==.4 and frozen['slice']['config']['gamma']==20,'static named inputs')
 src=(ROOT/'grad-math/lectures/nla-02-eigen.md').read_text();site=(ROOT/'grad-math/site/nla-02-eigen.html').read_text()
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
 for course in ['ai-course','grad-math','math-course']:ck((ROOT/course/'site/assets/learning/labs/eigen-iteration.js').read_bytes()==JS.read_bytes(),'tracked mirror')
 ck((ROOT/'.github/workflows/course-audit.yml').read_text().count('python tools/check_eigen_full.py')==1,'CI invocation')
 image=ROOT/'grad-math/images/nla-02-eigen-ledgers.svg'
 ck(image.read_bytes()==(ROOT/'grad-math/site/assets/img/nla-02-eigen-ledgers.svg').read_bytes(),'SVG mirror')
 panels=ET.parse(image).getroot().findall('.//{http://www.w3.org/2000/svg}svg');ck(len(panels)==4,'four static panels')
 code="const a=require(process.argv[1]),f=JSON.parse(require('fs').readFileSync(process.argv[2],'utf8'));console.log(JSON.stringify([a.plots(f.vectors)[1],a.plots(f.chain)[0],a.plots(f.chain)[2],a.plots(f.slice)[0]].map(a.svg)))"
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
 table=re.search(r'data-learning-lab="eigen-iteration".*?<tbody>(.*?)</tbody>',site,re.S).group(1)
 vals=[float(html.unescape(x))for x in re.findall(r'<tr>\s*<td>.*?</td>\s*<td[^>]*>(.*?)</td>\s*</tr>',table,re.S)]
 v,q,ss=frozen['vectors']['result'],frozen['chain']['result'],frozen['slice']['result'];z=ss['result']
 refs=[]
 for m in v['methods']:refs.extend([m['final']['rho'],m['final']['relativeResidual']])
 for m in q['methods']:refs.extend([m['stepsTaken'],m['final']['offDiagonal'],m['final']['relativeSimilarity']])
 refs.extend([z['distance'],z['sigmaMin'],z['actualResidual'],z['perturbationNorm'],norm(z['changedResidual']),ss['threshold']])
 ck(len(vals)==len(refs)==18,'all fallback numbers')
 for x,y in zip(vals,refs):close(x,y,'frozen fallback value',rtol=2e-11,atol=1e-28)
 ck('run-snapshot.json' in site and '预算结束' in site and '浮点运算得到零残差' in site,'readable snapshot and stop conditions')
 print('formulas',len(formulas))
print(json.dumps(dict(status='PASS',checks=checks,states=len(data['states']),invalid=data['invalid'],self=data['self'])))
