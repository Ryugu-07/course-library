"""Independent Decimal/Fraction references, complete scans, and visible evidence."""
from pathlib import Path
from fractions import Fraction as F
from decimal import Decimal as D, localcontext
import subprocess,shutil,json,math,sys,re,html,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/svd-perturbation.js'
code=r'''
const a=require(process.argv[1]),cs=[...a.PRESETS];
for(const second of [.5,1,2.95,3])for(const eta of [-4,0,4])cs.push({second,eta});
for(const delta of [1e-10,1e-8,.3])for(const rho of [0,1])for(const noise of [0,1e-4])cs.push({mode:"qr",delta,rho,noise});
for(const delta of [1e-10,1])for(const error of [-.9,0,10])for(const direction of ["weak","strong"])cs.push({mode:"backward",delta,error,direction,scaleExponent:12});
cs.push({eta:.1*(1+Number.EPSILON)},{mode:"qr",delta:1e-5*(1+Number.EPSILON)});
let invalid=0;
for(const [mode,fields]of [["spectral",["second","eta"]],["qr",["delta","rho","noise"]],["backward",["delta","error","scaleExponent"]]]){
 for(const field of fields)for(const v of ["",null,true,false,[],{},NaN,Infinity,-Infinity,"1e309","1e-400"]){
  let bad=false;try{a.config({mode,[field]:v});}catch(e){bad=true;}
  if(!bad)throw Error("invalid "+mode+field+String(v));invalid++;
 }
}
for(const c of [null,[],{mode:"x"},{second:.49},{second:3.01},{eta:4.01},{eta:-4.01},{mode:"qr",delta:0},{mode:"qr",delta:.31},{mode:"qr",rho:-.01},{mode:"qr",rho:1.01},{mode:"qr",noise:1e-3},{mode:"qr",noise:-1e-5},{mode:"backward",delta:1.1},{mode:"backward",error:-1},{mode:"backward",error:11},{mode:"backward",scaleExponent:1.5},{mode:"backward",scaleExponent:13},{mode:"backward",direction:"x"}]){
 let bad=false;try{a.config(c);}catch(e){bad=true;}if(!bad)throw Error("boundary");invalid++;
}
a.snapshot({mode:"spectral",delta:"",rho:null,noise:[],error:NaN,direction:"x",scaleExponent:Infinity});
a.snapshot({mode:"qr",eta:"",second:[],error:NaN,direction:"x",scaleExponent:Infinity});
a.snapshot({mode:"backward",second:[],eta:"",noise:null,rho:Infinity});
const states=cs.map(c=>{const d=a.snapshot(c);return {...d,plots:a.plots(d),ledgers:a.ledgers(d),svgs:a.plots(d).map(a.svg)};}),scan=new Map();
for(const d of states)if(d.config.mode==="qr")for(const row of d.result.study){
 const c={mode:"qr",delta:row.delta,rho:d.config.rho,noise:d.config.noise},key=JSON.stringify(c);
 if(!scan.has(key))scan.set(key,{config:c,result:a.qrPoint(c.delta,c.rho,c.noise)});
}
console.log(JSON.stringify({states,scan:[...scan.values()],invalid,self:a.selfTest()}));
'''
data=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve())],text=True));checks=0
def ck(v,label):
 global checks
 assert v,label;checks+=1
def close(x,y,label,rtol=3e-12,atol=2e-13):
 y=float(y);ck(isinstance(x,(float,int))and math.isfinite(x)and abs(x-y)<=atol+rtol*abs(y),(label,x,y))
def vec(x,y,label,**kw):
 ck(len(x)==len(y),label+' length')
 for a,b in zip(x,y):close(a,b,label,**kw)
def mat(x,y,label,**kw):
 ck(len(x)==len(y),label+' rows')
 for a,b in zip(x,y):vec(a,b,label,**kw)
def dec(x):return D.from_float(x)if isinstance(x,float)else D(x)
def transpose(A):return list(map(list,zip(*A)))
def dot(a,b):return math.fsum(x*y for x,y in zip(a,b))
def mv(A,x):return[dot(row,x)for row in A]
def mm(A,B):return[[dot(row,col)for col in zip(*B)]for row in A]
def sub(x,y):return[a-b for a,b in zip(x,y)]
def norm(x):return math.hypot(*x)
def fro(A):return norm([x for row in A for x in row])
def eye(n):return[[int(i==j)for j in range(n)]for i in range(n)]
def msub(A,B):return[sub(a,b)for a,b in zip(A,B)]
def outer(x,y):return[[a*b for b in y]for a in x]
def grid(base,current):
 near=[i for i,x in enumerate(base)if abs(x-current)<=8*sys.float_info.epsilon*max(abs(x),abs(current))]
 ck(len(near)<=1,'single ulp neighbour')
 if near:base[near[0]]=current
 else:base.append(current)
 return sorted(base)
def spectral_ref(second,eta):
 b,e=dec(second),dec(eta);r=(((3-b)/2)**2+e*e).sqrt();large=(3+b)/2+r;small=(3*b-e*e)/large
 return float(large),float(small)
def check_spectral(s,p):
 b,e=s['second'],s['eta'];large,small=spectral_ref(b,e)
 A=[[3,e],[e,b]];mat(p['A'],A,'spectral matrix')
 close(p['large'],large,'large eigenvalue');close(p['small'],small,'signed small eigenvalue')
 vec(p['singular'],[large,abs(small)],'nonnegative singular values')
 ck(all(v>=0 for v in p['singular']),'nonnegative')
 mat(mm(transpose(p['U']),p['U']),eye(2),'orthonormal U')
 mat(mm(transpose(p['V']),p['V']),eye(2),'orthonormal V')
 mat(mm(mm(p['U'],[[large,0],[0,abs(small)]]),transpose(p['V'])),A,'SVD reconstruction')
 ck(p['baseUnique']==(b<3)and p['topUnique']==not_equal(b,e),'unique direction flags')
 ck(p['repeated']==(b==3 and e==0),'repeated')
 if b==3:ck(p['angle']is None and p['certificate']is None,'no fictitious baseline angle')
 else:
  angle=abs(.5*math.atan2(2*e,3-b));close(p['angle'],angle,'eigenvector direction')
  if 3-b-abs(e)>0:
   bound=min(1,abs(e)/(3-b-abs(e)));close(p['certificate'],bound,'separated direction bound');ck(math.sin(angle)<=bound+1e-14,'bound holds')
  else:ck(p['certificate']is None,'separation not certified')
 ck(p['shift']<=abs(e)+1e-13,'Weyl theorem')
 ck(len(p['circle'])==129,'complete circle')
 for i,v in enumerate(p['circle']):
  t=2*math.pi*i/128;vec([v['i'],v['theta'],*v['input'],*v['output']],[i,t,math.cos(t),math.sin(t),*mv(A,[math.cos(t),math.sin(t)])],'circle map')
 for k,v in enumerate(p['truncations']):
  ck(v['rank']==k,'every rank')
  if k==0:expected=[[0,0],[0,0]]
  elif k==2:expected=A
  else:
   theta=.5*math.atan2(2*e,3-b)if (3-b or e)else 0
   u=[math.cos(theta),math.sin(theta)];expected=[[large*x for x in row]for row in outer(u,u)]
  mat(v['matrix'],expected,'actual truncated matrix')
  close(v['spectral'],[large,abs(small),0][k],'Eckart Young spectral tail')
  close(v['frobenius'],[math.hypot(large,small),abs(small),0][k],'Eckart Young Frobenius tail')
  close(fro(msub(A,v['matrix'])),v['frobenius'],'actual Frobenius residual')
 mat(p['rankOne'],p['truncations'][1]['matrix'],'rank one consistency');mat(p['tail'],msub(A,p['rankOne']),'actual tail')
 expected=[-4+i/10 for i in range(81)]
 if b<3:
  for i in range(-16,17):expected=grid(expected,(3-b)*i/16)
 window=max(.1,min(4,2*(3-b)))
 for edge in [-window,window]:expected=grid(expected,edge)
 expected=grid(expected,e);vec([v['eta']for v in p['study']],expected,'complete eta grid',atol=1e-14)
 ck(e in [v['eta']for v in p['study']],'exact current eta')
 for v in p['study']:
  l,t=spectral_ref(b,v['eta']);vec([v[k]for k in ['large','small','sigma1','sigma2','shift','normE']],[l,t,l,abs(t),max(abs(l-3),abs(abs(t)-b)),abs(v['eta'])],'all spectral scan values')
  if b==3:ck(v['angle']is None and v['certificate']is None,'scan base undefined')
  else:
   close(v['angle'],abs(.5*math.atan2(2*v['eta'],3-b)),'scan angle')
   sep=3-b-abs(v['eta'])
   if sep>0:close(v['certificate'],min(1,abs(v['eta'])/sep),'scan certificate')
   else:ck(v['certificate']is None,'scan no certificate')
def not_equal(b,e):return not (b==3 and e==0)
def reference(delta,b):
 d=F(delta);bb=list(map(F,b));bar=sum(bb[1:])/3;common=(bb[0]+d*bar)/(3+d*d)
 return[(x-bar)/d+common for x in bb[1:]]
def check_qr(s,p):
 d,rho,eps=s['delta'],s['rho'],s['noise'];A=[[1,1,1],[d,0,0],[0,d,0],[0,0,d]]
 mat(p['A'],A,'Lauchli matrix');vec(p['singular'],[math.hypot(math.sqrt(3),d),d,d],'Lauchli singular values')
 close(p['condition'],math.hypot(math.sqrt(3),d)/d,'matrix condition')
 n=[-d,1,1,1];n=[v/math.hypot(d,math.sqrt(3))for v in n];w=[0,1/math.sqrt(2),-1/math.sqrt(2),0]
 vec(p['nullVector'],n,'null vector');vec(mv(transpose(A),n),[0,0,0],'A transpose n zero');close(norm(n),1,'unit null')
 vec(p['weakVector'],w,'weak data direction');vec(p['clean'],[3,d,d,d],'clean data')
 formed=[x+rho*y+eps*z for x,y,z in zip([3,d,d,d],n,w)];vec(p['b'],formed,'formed data',atol=1e-15)
 exact=reference(d,p['b']);ck(p['ref']['fractions']==[[str(x.numerator),str(x.denominator)]for x in exact],'Fraction reference on actual binary inputs')
 vec(p['ref']['x'],[float(x)for x in exact],'reference conversion',rtol=5e-16,atol=1e-15)
 ideal=[1+eps/(math.sqrt(2)*d),1-eps/(math.sqrt(2)*d),1];vec(p['ideal'],ideal,'ideal input solution')
 ref=p['ref']['x'];fit=mv(A,ref);res=sub(p['b'],fit)
 vec(p['fitted'],fit,'reference fitted',atol=2e-10);vec(p['residual'],res,'reference residual',atol=2e-10)
 close(p['referenceResidual'],norm(res),'reference residual norm',atol=2e-10)
 close(p['dataFormation'],norm(sub(ref,ideal))/norm(ideal),'data formation difference',atol=1e-15)
 close(p['sinTheta'],norm(res)/norm(p['b']),'residual angle sin',atol=2e-10)
 close(p['tanTheta'],norm(res)/norm(fit),'residual angle tan',atol=2e-10)
 ck([z['id']for z in p['methods']]==['cgs','mgs','householder','normal'],'all actual algorithms')
 for z in p['methods']:
  if z.get('Q'):
   Q,R=z['Q'],z['R'];qtq=mm(transpose(Q),Q);qr=mm(Q,R)
   mat(z['QtQ'],qtq,'reported QtQ',atol=1e-15);mat(z['QR'],qr,'reported QR',atol=1e-15)
   close(z['orthogonality'],fro(msub(qtq,eye(3))),'orthogonality metric',atol=2e-15)
   close(z['reconstruction'],fro(msub(qr,A))/fro(A),'factor residual metric',atol=2e-15)
   vec(z['projected'],mv(transpose(Q),p['b']),'actual projected rhs',atol=2e-15)
   vec(mv(R,z['x']),z['projected'],'triangular solution',atol=2e-10)
   if z['id']=='householder':
    ck(z['orthogonality']<8e-15 and z['reconstruction']<8e-15,'Householder backward identities')
    ck(len(z['steps'])==3,'three reflectors')
    for k,v in enumerate(z['steps']):
     ck(v['k']==k and len(v['vector'])==4-k,'full reflector vector')
     close(norm(v['vector']),1,'unit Householder vector');close(abs(v['alpha']),v['norm'],'target norm')
   else:
    ck(len(z['steps'])==6,'all GS projections and normalizations')
    for v in z['steps']:
     j,i=v['j'],v['i'];close(v['coefficient'],R[i][j],'GS coefficient stored')
     if i==j:vec(v['work'],transpose(Q)[j],'normalized GS column')
     else:
      original=transpose(A)[j]
      expected=[original[k]-math.fsum(R[t][j]*Q[k][t]for t in range(i+1))for k in range(4)]
      vec(v['work'],expected,'GS remaining vector',atol=1e-15)
  else:
   ck(z['orthogonality']is None and z['reconstruction']is None,'normal equations do not have Q')
   mat(z['P'],mm(transpose(A),A),'actually formed normal matrix',atol=1e-15)
   vec(z['rhs'],mv(transpose(A),p['b']),'normal rhs',atol=1e-15)
   for v in z['steps']:
    i,j=v['i'],v['j'];expected=z['P'][i][j]-math.fsum(z['L'][i][k]*z['L'][j][k]for k in range(j))
    close(v['pivot'],expected,'actual normal pivot',atol=2e-15)
   if z['status']=='nonpositive-pivot':
    ck(z['steps'][-1]['i']==z['steps'][-1]['j'] and z['steps'][-1]['pivot']<=0,'failure has real nonpositive pivot')
    ck(all(z[k]is None for k in ['x','forward','modelForward','residualNorm','stationarity']),'failure is not fake zero')
   else:
    ck(z['status']=='ok','normal success status')
    mat(mm(z['L'],transpose(z['L'])),z['P'],'Cholesky reconstruction',atol=3e-15)
    vec(mv(z['P'],z['x']),z['rhs'],'normal solve',atol=3e-9)
  if z['x']is not None:
   x=z['x'];fit=mv(A,x);res=sub(p['b'],fit);station=mv(transpose(A),res)
   vec(z['fitted'],fit,'actual candidate fit',atol=3e-10);vec(z['residual'],res,'candidate residual',atol=3e-10)
   vec(z['normalResidual'],station,'candidate stationarity',atol=1e-9)
   close(z['forward'],norm(sub(x,ref))/norm(ref),'forward vs actual input',atol=1e-15)
   close(z['modelForward'],norm(sub(x,ideal))/norm(ideal),'forward vs ideal input',atol=1e-15)
   close(z['residualNorm'],norm(res),'candidate residual norm',atol=3e-10);close(z['stationarity'],norm(station),'stationarity norm',atol=1e-9)
 if 'study'in p:
  expected=grid([10**(-10+i/4)for i in range(38)]+[.3],d)
  vec([v['delta']for v in p['study']],expected,'complete delta grid',atol=1e-20)
  ck(d in [v['delta']for v in p['study']],'exact current delta')
  for v in p['study']:
   close(v['condition'],math.hypot(math.sqrt(3),v['delta'])/v['delta'],'all scan conditions')
   ck(len(v['methods'])==4,'all four methods at every delta')
def check_backward(s,p):
 scale=10**s['scaleExponent'];A=[[scale,0],[0,scale*s['delta']]];b=[scale,scale*s['delta']];x=[1,1];x[1 if s['direction']=='weak'else 0]+=s['error']
 mat(p['A'],A,'scaled actual matrix',atol=0);vec(p['b'],b,'scaled rhs',atol=0);vec(p['x'],x,'given candidate')
 r=sub(b,mv(A,x));rn=norm(r);eta=rn/(scale*norm(x)+norm(b));vec(p['r'],r,'raw residual vector',atol=1e-20)
 close(p['rawResidual'],rn,'raw residual',atol=1e-20);close(p['eta'],eta,'minimal joint backward error',atol=1e-25)
 close(p['bOnly'],rn/norm(b),'rhs-only error',atol=1e-25);close(p['forward'],norm(sub(x,[1,1]))/math.sqrt(2),'relative forward')
 u=[v/rn for v in r]if rn else[0,0];vv=[v/norm(x)for v in x]
 dA=[[eta*scale*z for z in row]for row in outer(u,vv)];db=[-eta*norm(b)*z for z in u]
 mat(p['dA'],dA,'attaining matrix perturbation',atol=1e-25);vec(p['db'],db,'attaining rhs perturbation',atol=1e-25)
 mat(p['changed'],[[v+dA[i][j]for j,v in enumerate(row)]for i,row in enumerate(A)],'perturbed A',atol=1e-25)
 vec(p['changedB'],[v+db[i]for i,v in enumerate(b)],'perturbed b',atol=1e-25)
 ck(norm(sub(mv(p['changed'],x),p['changedB']))<2e-14*scale*max(1,norm(x)),'attained exact equation within roundoff')
 close(p['matrixRelative'],eta,'DeltaA attains eta',atol=1e-25);close(p['rhsRelative'],eta,'Deltab attains eta',atol=1e-25)
 q=eta/s['delta'];close(p['condition'],1/s['delta'],'condition')
 if q<1:
  close(p['bound'],2*q/(1-q),'forward certificate',atol=1e-25);ck(p['forward']<=p['bound']+1e-12,'forward inequality')
 else:ck(p['bound']is None,'no certificate outside hypothesis')
 ck(len(p['study'])==25,'all unit scalings')
 for i,v in enumerate(p['study']):
  exponent=i-12;scaled=10**exponent;aa=[[scaled,0],[0,scaled*s['delta']]];bb=[scaled,scaled*s['delta']];rr=norm(sub(bb,mv(aa,x)))
  vec([v['exponent'],v['rawResidual'],v['eta'],v['forward'],v['bOnly']],[exponent,rr,rr/(scaled*norm(x)+norm(bb)),p['forward'],rr/norm(bb)],'complete scaling study',atol=1e-24)
def view_expectations(d):
 s,p=d['config'],d['result'];mode=s['mode'];names={'cgs':'经典GS','mgs':'改良GS','householder':'Householder','normal':'正规方程'}
 if mode=='spectral':
  charts=[{'circle':[v['input']for v in p['circle']],'image':[v['output']for v in p['circle']]},
   {'eigen':[[0,p['large']],[1,p['small']]],'singular':list(enumerate(p['singular']))},
   {'shift':[(v['eta'],v['shift'])for v in p['study']],'bound':[(v['eta'],v['normE'])for v in p['study']]},
   {'spectral':[(v['rank'],v['spectral'])for v in p['truncations']],'frobenius':[(v['rank'],v['frobenius'])for v in p['truncations']]},
   {'angle':[(v['eta'],math.sin(v['angle']))for v in p['study']if v['angle']is not None and abs(v['eta'])<=max(.1,min(4,2*p['gap']))],'certificate':[(v['eta'],v['certificate'])for v in p['study']if v['certificate']is not None and abs(v['eta'])<=max(.1,min(4,2*p['gap']))]}]
  mats={k:p[k]for k in ['A','U','V','rankOne','tail']}
  rows={'circle':[[v['i'],v['theta'],*v['input'],*v['output']]for v in p['circle']],
   'ranks':[[v['rank'],v['spectral'],v['frobenius'],*sum(v['matrix'],[])]for v in p['truncations']],
   'study':[[v[k]for k in ['eta','large','small','sigma1','sigma2','shift','normE','angle','certificate']]for v in p['study']]}
  summary=[s['second'],s['eta'],p['large'],p['small'],*p['singular'],p['baseUnique'],p['topUnique'],p['chosenAngle'],p['angle'],p['shift'],p['normE'],p['gap'],p['gapLower'],p['certificate']]
 elif mode=='qr':
  first={'reference':list(enumerate(p['ref']['x']))};first.update({z['id']:list(enumerate(z['x']))for z in p['methods']if z['x']is not None})
  charts=[first]
  for field in ['forward','orthogonality','reconstruction']:
   charts.append({id:[(math.log10(v['delta']),math.log10(z[field]))for v in p['study']for z in v['methods']if z['id']==id and z[field]is not None and z[field]>0]for id in names if field=='forward'or id!='normal'})
  charts.append({'formation':[(math.log10(v['delta']),math.log10(v['dataFormation']))for v in p['study']if v['dataFormation']>0]})
  mats={'A':p['A'],**{k:[[v]for v in p[k]]for k in ['b','clean','nullVector','weakVector']}}
  for z in p['methods']:
   for k in ['Q','R','QtQ','QR','P','L']:
    if k in z:mats[z['id']+'.'+k]=z[k]
   for k in ['rhs','projected','x','fitted','residual','normalResidual']:
    if z.get(k)is not None:mats[z['id']+'.'+k]=[[v]for v in z[k]]
  rows={'methods':[[names[z['id']],z['status'],*[z[k]for k in ['forward','modelForward','residualNorm','stationarity','orthogonality','reconstruction']]]for z in p['methods']],
   'reference':[[i,*p['ref']['fractions'][i],v,p['ideal'][i],v-p['ideal'][i]]for i,v in enumerate(p['ref']['x'])],
   'gs-steps':[[names[z['id']],v['j'],v['i'],v['coefficient'],k,x]for z in p['methods']if z['id']in ['cgs','mgs']for v in z['steps']for k,x in enumerate(v['work'])],
   'reflectors':[[v['k'],i,v['norm'],v['alpha'],x]for v in p['methods'][2]['steps']for i,x in enumerate(v['vector'])],
   'pivots':[[v['i'],v['j'],v['pivot']]for v in p['methods'][3]['steps']],
   'study':[[v['delta'],v['condition'],v['dataFormation'],v['referenceResidual'],names[z['id']],z['status'],*[z[k]for k in ['forward','modelForward','orthogonality','reconstruction','residualNorm','stationarity']]]for v in p['study']for z in v['methods']]}
  summary=[s['delta'],s['rho'],s['noise'],p['singular'][0],s['delta'],p['condition'],p['condition']**2,p['referenceResidual'],p['dataFormation'],p['sinTheta'],p['tanTheta']]
 else:
  charts=[{'truth':list(enumerate(p['truth'])),'candidate':list(enumerate(p['x']))},
   {'raw':[(v['exponent'],math.log10(v['rawResidual']))for v in p['study']if v['rawResidual']>0]},
   {key:[(v['exponent'],v[field])for v in p['study']]for key,field in [('backward','eta'),('forward','forward'),('rhs-only','bOnly')]},
   {'achieved':[(0,p['matrixRelative']),(1,p['rhsRelative'])],'minimal':[(0,p['eta']),(1,p['eta'])]}]
  mats={'A':p['A'],'b':[[v]for v in p['b']],'truth':[[v]for v in p['truth']],'candidate':[[v]for v in p['x']],'residual':[[v]for v in p['r']],'deltaA':p['dA'],'deltaB':[[v]for v in p['db']],'changedA':p['changed'],'changedB':[[v]for v in p['changedB']],'certificateResidual':[[v]for v in p['certificateResidual']]}
  rows={'study':[[v[k]for k in ['exponent','rawResidual','eta','forward','bOnly']]for v in p['study']]}
  summary=[s['delta'],s['error'],s['direction'],p['scale'],p['condition'],p['rawResidual'],p['forward'],p['eta'],p['bOnly'],p['matrixRelative'],p['rhsRelative'],p['bound']]
 rows['matrices']=[[name,i,j,x]for name,A in mats.items()for i,row in enumerate(A)for j,x in enumerate(row)]
 return charts,rows,summary
def verify_views(d):
 charts,rows,summary=view_expectations(d);ck(len(d['plots'])==len(charts)==len(d['svgs']),'every plot')
 for q,wanted,source in zip(d['plots'],charts,d['svgs']):
  root=ET.fromstring(source);ns={'s':'http://www.w3.org/2000/svg'}
  ck(root.find('s:title',ns).text==q['title'],'accessible title')
  ck([v['key']for v in q['series']]==list(wanted),'semantic series')
  xf=lambda x:(325 if q['square']else 100)+(250 if q['square']else 750)*(x-q['xmin'])/(q['xmax']-q['xmin'])
  yf=lambda y:335-250*(y-q['ymin'])/(q['ymax']-q['ymin'])
  if q['square']:close(250/(q['xmax']-q['xmin']),250/(q['ymax']-q['ymin']),'equal coordinate units',atol=0)
  for line in q['series']:
   points=wanted[line['key']];ck(len(line['points'])==len(points),'complete data series')
   nodes=root.findall('.//s:circle[@data-series="'+line['key']+'"]',ns);ck(len(nodes)==len(points),'all native markers')
   poly=root.find('.//s:polyline[@data-series="'+line['key']+'"]',ns);ck((poly is not None)==line['line'],'no artificial line over missing states')
   coords=[list(map(float,x.split(',')))for x in poly.get('points').split()]if poly is not None else None
   if coords is not None:ck(len(coords)==len(points),'all line coordinates')
   for i,(actual,(x,y),node)in enumerate(zip(line['points'],points,nodes)):
    vec(actual,[x,y],'semantic data point',atol=1e-12)
    ck(q['xmin']-1e-13<=x<=q['xmax']+1e-13 and q['ymin']-1e-13<=y<=q['ymax']+1e-13,'point in graph range')
    ck(node.get('data-index')==str(i),'point index');vec([float(node.get('cx')),float(node.get('cy'))],[xf(x),yf(y)],'SVG projection',atol=1e-9,rtol=0)
    if coords is not None:vec(coords[i],[xf(x),yf(y)],'polyline projection',atol=1e-9,rtol=0)
 tables={t['key']:t for t in d['ledgers']};ck(set(tables)==set(rows)|{'summary'},'all ledger kinds')
 actual=[v[1]for v in tables['summary']['rows']];ck(len(actual)==len(summary),'summary rows')
 for x,y in zip(actual,summary):
  if type(y)in [float,int]:close(x,y,'summary numeric cell',rtol=1e-15,atol=0)
  else:ck(x==y,'summary exact cell')
 for k,v in rows.items():ck(tables[k]['rows']==v,'every ledger cell '+k)
 for t in tables.values():ck(all(len(r)==len(t['headers'])for r in t['rows']),'ledger header alignment')
with localcontext()as ctx:
 ctx.prec=65
 scan={}
 for d in data['scan']:
  check_qr(d['config'],d['result']);s=d['config'];scan[s['delta'],s['rho'],s['noise']]=d['result']
 for d in data['states']:
  {'spectral':check_spectral,'qr':check_qr,'backward':check_backward}[d['config']['mode']](d['config'],d['result'])
  verify_views(d)
  if d['config']['mode']=='qr':
   s=d['config']
   for row in d['result']['study']:
    ref=scan[row['delta'],s['rho'],s['noise']]
    for key in ['condition','dataFormation','referenceResidual']:ck(row[key]==ref[key],'checked full scan scalar')
    for a,b in zip(row['methods'],ref['methods']):
     ck(all(a[key]==b[key]for key in a),'checked full scan method')
ck(data['invalid']>=100,'strict active controls');ck(data['self']['status']=='PASS'and data['self']['checks']==8,'self tests')
if len(sys.argv)==1:
 from html.parser import HTMLParser
 src=(ROOT/'grad-math/lectures/nla-01-svd-stability.md').read_text();site=(ROOT/'grad-math/site/nla-01-svd-stability.html').read_text()
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
 for course in ['ai-course','grad-math','math-course']:ck((ROOT/course/'site/assets/learning/labs/svd-perturbation.js').read_bytes()==JS.read_bytes(),'tracked mirror')
 ck((ROOT/'.github/workflows/course-audit.yml').read_text().count('python tools/check_svd_full.py')==1,'CI invocation')
 image=ROOT/'grad-math/images/nla-01-stability-ledgers.svg'
 ck(image.read_bytes()==(ROOT/'grad-math/site/assets/img/nla-01-stability-ledgers.svg').read_bytes(),'SVG mirror')
 panels=ET.parse(image).getroot().findall('.//{http://www.w3.org/2000/svg}svg');ck(len(panels)==4,'four static panels')
 code="const a=require(process.argv[1]);console.log(JSON.stringify([a.plots(a.snapshot({eta:2}))[1],a.plots(a.snapshot({second:2.95}))[4],a.plots(a.snapshot({mode:'qr',delta:1e-8,rho:1}))[2],a.plots(a.snapshot({mode:'backward',delta:1e-8}))[2]].map(a.svg)))"
 expected=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve())],text=True))
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
 table=re.search(r'data-learning-lab="svd-perturbation".*?<tbody>(.*?)</tbody>',site,re.S).group(1)
 vals=[float(html.unescape(x))for x in re.findall(r'<tr>\s*<td>.*?</td>\s*<td[^>]*>(.*?)</td>\s*</tr>',table,re.S)]
 code="const a=require(process.argv[1]);console.log(JSON.stringify([a.snapshot({}).result,a.snapshot({mode:'qr'}).result,a.snapshot({mode:'backward',delta:1e-8}).result]))"
 t,q,b=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve())],text=True))
 refs=[t['large'],t['small'],*t['singular'],t['angle'],t['certificate'],t['truncations'][1]['spectral'],t['truncations'][0]['frobenius'],q['condition'],*[z['forward']for z in q['methods']],*[z['orthogonality']for z in q['methods'][:3]],b['eta'],b['forward']]
 ck(len(vals)==len(refs)==18,'fallback complete')
 for v,w in zip(vals,refs):close(v,w,'fallback',rtol=2e-11,atol=1e-25)
 print('formulas',len(formulas))

print(json.dumps(dict(status='PASS',checks=checks,states=len(data['states']),scanStates=len(data['scan']),invalid=data['invalid'],self=data['self'])))
