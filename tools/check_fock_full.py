# -*- coding: utf-8 -*-
"""Independent sparse tensor matrix algebra and Taylor scaling/squaring dynamics; stdlib only."""
from pathlib import Path
from functools import lru_cache
from itertools import product
from math import sqrt,isqrt,ceil,log2,pi,cos,sin,fsum
import json,sys
checks=0;relation_rows=0;time_rows=0
def ok(x):
 global checks
 checks+=1;assert x
def near(a,b):
 global checks
 checks+=1;assert isinstance(a,(int,float))and not isinstance(a,bool)and abs(a-b)<=2e-11*(1+abs(a)+abs(b)),(a,b)
def tree(a,b):
 if isinstance(b,list):
  ok(isinstance(a,list)and len(a)==len(b))
  for x,y in zip(a,b):tree(x,y)
 elif b is None or isinstance(b,(str,bool)):ok(type(a)is type(b)and a==b)
 else:near(a,b)
def rr(a,v):
 ok(set(a)=={'integer','radicand','value'}and type(a['integer'])is int and type(a['radicand'])is int)
 r=a['radicand'];ok(r>=1 and all(r%(i*i)for i in range(2,isqrt(r)+1)))
 if a['integer']==0:ok(r==1)
 near(a['integer']*sqrt(r),v);near(a['value'],v)
@lru_cache(None)
def tensor_ladder(modes,base,mode,kind,fermion):
 # Columns of tensor products: factors at modes below i are Z for CAR, identity for CCR.
 # Each local factor has at most one nonzero element in each column.
 columns=[]
 for column in range(base**modes):
  digits=[(column//base**i)%base for i in range(modes)];out=digits[:];value=1.
  for i in range(modes):
   if i==mode:
    n=digits[i];target=n+(1 if kind=='create'else-1)
    if not 0<=target<base:value=0.;break
    out[i]=target;value*=1 if fermion else sqrt(max(n,target))
   elif fermion and i<mode:value*=1-2*digits[i]
  columns.append((sum(n*base**i for i,n in enumerate(out))if value else None,value))
 return columns
def mapped(state,kind,mode,statistics,cutoff=None):
 f=statistics=='fermion';base=2 if f else max(state)+3 if cutoff is None else cutoff+1
 col=sum(n*base**i for i,n in enumerate(state));target,value=tensor_ladder(len(state),base,mode,kind,f)[col]
 return(None if target is None else[(target//base**i)%base for i in range(len(state))]),value
def check_action(a,state,kind,mode,statistics,cutoff=None):
 out,value=mapped(state,kind,mode,statistics,cutoff);tree(a['state'],out);rr(a['coefficient'],value);return out,value
def check_word(a,state,ops,statistics):
 current=state[:];value=1.;expectedsteps=[]
 for kind,mode in reversed(ops):
  if current is None:break
  out,v=mapped(current,kind,mode,statistics);expectedsteps.append((current,kind,mode,out,v));current=out;value*=v
 tree(a['state'],current);rr(a['coefficient'],value);ok(len(a['steps'])==len(expectedsteps))
 for r,(before,kind,mode,out,v)in zip(a['steps'],expectedsteps):tree(r['before'],before);tree(r['after'],out);ok(r['kind']==kind and r['mode']==mode);rr(r['coefficient'],v)
 return current,value
def check_relations(rows,states,statistics):
 global relation_rows
 modes=len(states[0]);ok(len(rows)==len(states)*modes*modes*3)
 expected=product(states,range(modes),range(modes),[('mixed','annihilate','create'),('annihilate','annihilate','annihilate'),('create','create','create')])
 for r,(state,i,j,(family,k1,k2))in zip(rows,expected):
  relation_rows+=1;tree(r['state'],state);ok(r['i']==i and r['j']==j and r['family']==family)
  x,v=check_word(r['left'],state,[(k1,i),(k2,j)],statistics);y,w=check_word(r['right'],state,[(k2,j),(k1,i)],statistics);terms={}
  for out,coef in [(x,v),(y,w*(-1 if statistics=='boson'else 1))]:
   if out is not None:terms[tuple(out)]=terms.get(tuple(out),0)+coef
  terms={k:v for k,v in terms.items()if abs(v)>1e-12};want=1 if family=='mixed'and i==j else 0;ok(r['expected']==want);ok(len(terms)==want and len(r['combined'])==want)
  if want:near(terms[tuple(state)],1);tree(r['combined'][0]['state'],state);rr(r['combined'][0]['coefficient'],1)
def mm(a,b):return[[sum(a[i][k]*b[k][j]for k in range(len(b)))for j in range(len(b[0]))]for i in range(len(a))]
def eye(n):return[[float(i==j)for j in range(n)]for i in range(n)]
@lru_cache(None)
def expm(matrix,time):
 n=len(matrix);size=max(sum(abs(x*time)for x in row)for row in matrix);k=max(0,ceil(log2(size/.25)))if size else 0;A=[[-1j*x*time/2**k for x in row]for row in matrix];out=eye(n);term=eye(n)
 for j in range(1,23):
  term=[[x/j for x in row]for row in mm(term,A)];out=[[out[i][l]+term[i][l]for l in range(n)]for i in range(n)]
 for _ in range(k):out=mm(out,out)
 return out
def boson_matrix(t,U,d):return[[U+d,-sqrt(2)*t,0],[-sqrt(2)*t,0,-sqrt(2)*t],[0,-sqrt(2)*t,U-d]]
def fermion_matrix(t,U,d):return[[0,0,0,0],[0,d/2,-t,0],[0,-t,-d/2,0],[0,0,0,U]]
def check_eigen(e,H):
 n=len(H);energies=e['energies'];V=e['vectors'];ok(len(energies)==n and len(V)==n and all(len(v)==n for v in V)and energies==sorted(energies))
 residual=max(abs(sum(H[i][j]*v[j]for j in range(n))-energies[k]*v[i])for k,v in enumerate(V)for i in range(n));gram=mm(V,list(map(list,zip(*V))));orth=max(abs(gram[i][j]-(i==j))for i in range(n)for j in range(n))
 ok(residual<1e-11 and orth<1e-11);near(e['residual'],residual);near(e['orthogonality'],orth);ok(type(e['sweeps'])is int and 0<=e['sweeps']<100)
 near(sum(energies),sum(H[i][i]for i in range(n)));near(sum(x*x for x in energies),sum(x*x for row in H for x in row))
def check_hamiltonian(h,c,statistics):
 t=c['hoppingPercent']/100;U=c['interactionPercent']/100;d=c['detuningPercent']/100;b=[[2,0],[1,1],[0,2]]if statistics=='boson'else[[0,0],[1,0],[0,1],[1,1]];H=boson_matrix(t,U,d)if statistics=='boson'else fermion_matrix(t,U,d);tree(h['basis'],b);tree(h['matrix'],H);ok(h['statistics']==statistics);tree(h['numberByBasis'],[sum(s)for s in b]);tree(h['commutator'],[[0]*len(b)for _ in b]);near(h['commutatorResidual'],0);near(h['hermiticity'],0);near(h['trace'],sum(H[i][i]for i in range(len(b))));near(h['traceSquared'],sum(x*x for row in H for x in row));check_eigen(h['eigen'],H)
 ok(len(h['terms'])==3*len(b))
 for r,(col,(name,i,j))in zip(h['terms'],product(range(len(b)),[('diagonal',0,0),('hop 1->0',0,1),('hop 0->1',1,0)])):
  state=b[col];ok(r['column']==col and r['term']==name);tree(r['input'],state);ok(r['numberIn']==sum(state))
  if name=='diagonal':ok(r['row']==col);tree(r['output'],state);near(r['value'],H[col][col]);near(r['factor'],1);ok(r['numberOut']==sum(state))
  else:
   a={'state':r['output'],'coefficient':r['radical'],'steps':r['steps']};out,v=check_word(a,state,[('create',i),('annihilate',j)],statistics);near(r['factor'],v);near(r['value'],-t*v);ok(r['row']==(b.index(out)if out is not None else None));ok(r['numberOut']==(sum(out)if out is not None else None))
 return H
def check_time(r,H,time,initial,basis):
 global time_rows
 time_rows+=1;U=expm(tuple(map(tuple,H)),time);psi=[row[initial]for row in U];p=[abs(v)**2 for v in psi];near(r['time'],time);tree(r['real'],[v.real for v in psi]);tree(r['imaginary'],[v.imag for v in psi]);tree(r['probabilities'],p);near(r['norm'],sum(p));near(r['norm'],1);energy=sum(psi[i].conjugate()*H[i][j]*psi[j]for i in range(len(H))for j in range(len(H))).real;near(r['energy'],energy);near(energy,H[initial][initial]);near(r['meanN0'],sum(p[i]*basis[i][0]for i in range(len(basis))))
def verify(s):
 c=s['parameters'];a=s['algebra'];q=c['cutoff'];statistics=c['statistics'];ok(s['schemaVersion']==1);states=[[0,0],[1,0],[0,1],[1,1]]if statistics=='fermion'else[[i,j]for j in range(q+1)for i in range(q+1)]
 ok(a['statistics']==statistics);tree(a['selectedState'],[c['occupation0'],c['occupation1']]);ok(len(a['selected'])==2 and len(a['actions'])==4*len(states));
 for r,kind in zip(a['selected'],['annihilate','create']):ok(r['kind']==kind);check_action(r['full'],a['selectedState'],kind,c['mode'],statistics);check_action(r['projected'],a['selectedState'],kind,c['mode'],statistics,q if statistics=='boson'else None)
 for r,(state,mode,kind)in zip(a['actions'],product(states,range(2),['annihilate','create'])):tree(r['input'],state);ok(r['mode']==mode and r['kind']==kind);check_action(r,state,kind,mode,statistics)
 check_relations(a['relations'],states,statistics);ok(len(a['ladder'])==q+1)
 for n,r in enumerate(a['ladder']):
  ok(r['n']==n);check_action(r['bosonCreate'],[n],'create',0,'boson');check_action(r['bosonAnnihilate'],[n],'annihilate',0,'boson');check_action(r['projectedCreate'],[n],'create',0,'boson',q);check_action(r['projectedAnnihilate'],[n],'annihilate',0,'boson',q)
  ok(r['fullCommutator']==1 and r['projectedCommutator']==(1 if n<q else-q)and r['defect']==(0 if n<q else-q-1));ok(r['normalPair']==n*(n-1)and r['naiveSquare']==n*n)
 near(a['cutoffTrace'],0);near(a['fullTraceOnDisplayedStates'],q+1)
 jw=s['jordanWigner'];basis=[[(m>>i)&1 for i in range(4)]for m in range(16)];tree(jw['basis'],basis);ok(len(jw['actions'])==128 and len(jw['reordering'])==128)
 for a,r,(mask,mode,kind)in zip(jw['actions'],jw['reordering'],product(range(16),range(4),['annihilate','create'])):
  state=basis[mask];out,v=mapped(state,kind,mode,'fermion');tree(a['input'],state);tree(a['output'],out);near(a['coefficient'],v);ok(a['mask']==mask and a['mode']==mode and a['kind']==kind and a['prefix']==sum(state[:mode]));ok(a['targetMask']==(basis.index(out)if out is not None else None));N=sum(state);outN=sum(out)if out else 0;phase=(-1)**(N*(N-1)//2);other=(-1)**(outN*(outN-1)//2);rev=(-1)**sum(state[mode+1:])if out is not None else 0
  ok(r['mask']==mask and r['mode']==mode and r['kind']==kind and r['number']==N and r['inputPhase']==phase and r['outputPhase']==other);near(r['canonical'],v);near(r['transformed'],phase*other*v);near(r['reverse'],rev);near(r['transformed'],rev)
 check_relations(jw['relations'],basis,'fermion');B=check_hamiltonian(s['boson'],c,'boson');F=check_hamiltonian(s['fermion'],c,'fermion');t=c['hoppingPercent']/100;d=c['detuningPercent']/100
 ok(len(s['spectrumScan'])==97)
 for i,r in enumerate(s['spectrumScan']):
  U=-4+i/8;near(r['U'],U);ev=r['bosonEnergies'];ok(len(ev)==3 and ev==sorted(ev));near(sum(ev),2*U);near(sum(x*x for x in ev),2*U*U+2*d*d+8*t*t);near(ev[0]*ev[1]*ev[2],-4*t*t*U)
  for x in ev:near(-x*((U-x)**2-d*d)-4*t*t*(U-x),0)
  tree(r['fermionEnergies'],sorted([0,U,-sqrt(t*t+d*d/4),sqrt(t*t+d*d/4)]));near(r['bosonTrace'],2*U);near(r['bosonTraceSquared'],2*U*U+2*d*d+8*t*t);ok(0<=r['residual']<1e-10)
 ok(len(s['dynamics'])==161)
 for i,r in enumerate(s['dynamics']):
  check_time(r,B,i/20,1,[[2,0],[1,1],[0,2]]);check_time(r['fermion'],F,i/20,3,[[0,0],[1,0],[0,1],[1,1]])
  if c['interactionPercent']==c['detuningPercent']==0:tree(r['probabilities'],[sin(2*t*i/20)**2/2,cos(2*t*i/20)**2,sin(2*t*i/20)**2/2])
 b=s['freeBunching'];ok(b['interaction']==0 and b['detuning']==0 and b['condition']=='Independent free resonant reference; not the interacting curve.')
 if t:near(b['time'],pi/(4*abs(t)));check_time(b['result'],boson_matrix(t,0,0),pi/(4*abs(t)),1,[[2,0],[1,1],[0,2]]);tree(b['result']['probabilities'],[.5,0,.5])
 else:ok(b['time']is None and b['result']is None)
 ok(s['boundaries']=={'cutoffOnlyAlgebra':True,'hamiltonianBosonSector':2,'hamiltonianUsesDisplayedOccupations':False,'fermionModesInSignCheck':4,'thermodynamicLimit':False})

from pathlib import Path
import subprocess,sys,json,hashlib,shutil,copy,re,math,xml.etree.ElementTree as ET
prefix=['rtk','proxy']if shutil.which('rtk')else[]
ROOT=Path(__file__).resolve().parents[1]
js=Path(sys.argv[1]).resolve()if len(sys.argv)>1 else ROOT/'course-shared/labs/second-quantization.js'
fixture=Path(sys.argv[2]).resolve()if len(sys.argv)>2 else ROOT/'course-shared/projects/fock-certificates/run-snapshot.json'
f=json.loads(fixture.read_text());assert f['provenance']['sourceSha256']==hashlib.sha256(js.read_bytes()).hexdigest()
code=r"""
const a=require(process.argv[1]),f=require(process.argv[2]);
const extras=[{statistics:'fermion',occupation0:0,occupation1:0,cutoff:8,mode:1,hoppingPercent:1,interactionPercent:800,detuningPercent:-200},{occupation0:0,occupation1:8,cutoff:8,mode:1,hoppingPercent:-200,interactionPercent:-400,detuningPercent:-200},{occupation0:8,occupation1:0,cutoff:8,hoppingPercent:1,interactionPercent:800},{occupation0:0,occupation1:1,cutoff:1,interactionPercent:1},{occupation0:3,occupation1:3,cutoff:3,hoppingPercent:-1,interactionPercent:-1,detuningPercent:1},{occupation0:2,occupation1:1,cutoff:2,mode:1,hoppingPercent:137,interactionPercent:251,detuningPercent:-99},{statistics:'fermion',occupation0:0,occupation1:1,mode:0,interactionPercent:-400},{statistics:'fermion',occupation0:1,occupation1:0,mode:0,interactionPercent:800},{hoppingPercent:0,interactionPercent:-200,detuningPercent:200},{hoppingPercent:0,interactionPercent:800,detuningPercent:0},{hoppingPercent:200,interactionPercent:800,detuningPercent:200},{occupation0:7,occupation1:6,cutoff:8,mode:1,hoppingPercent:-137,interactionPercent:-299,detuningPercent:187}];
const records=[...a.PRESETS.map(p=>a.compute(p.parameters)),...extras.map(p=>a.compute(p))],frozen=f.records.map(r=>a.compute(r.data.parameters));let invalid=0;
const bad=[null,[],1,'x',{x:0},{statistics:null},{statistics:'bad'},{statistics:0},{statistics:[]},{statistics:{}},{cutoff:1,occupation0:2},{statistics:'fermion',occupation1:2}];for(const[k,[lo,hi]]of Object.entries(a.LIMITS))for(const v of [null,'1',NaN,Infinity,-Infinity,1.5,lo-1,hi+1])bad.push({[k]:v});
for(const p of bad){let rejected=false;try{a.compute(p)}catch(e){rejected=true}if(!rejected)throw Error('Invalid accepted '+JSON.stringify(p));invalid++;}
let feedback=0;for(let i=0;i<4;i++)for(let j=0;j<2;j++){const r=a.feedback(i,j);if(r.correct!==(j===a.QUESTIONS[i][2])||!r.text)throw Error('Feedback');feedback++;}
process.stdout.write(JSON.stringify({records,frozen,invalid,feedback,self:a.selfTest(),rendered:records.map(r=>({plots:a.plots(r),tables:a.tables(r),svgs:a.plots(r).map(a.svg)}))}));
"""
d=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js),str(fixture)],text=True))
assert len(d['records'])==24 and len(d['frozen'])==6 and d['self']['status']=='PASS'
for s in d['records']+d['frozen']+[r['data']for r in f['records']]:verify(s)
science_checks=checks
INTEGER_KEYS={'schemaVersion','occupation0','occupation1','mode','cutoff','hoppingPercent','interactionPercent','detuningPercent','integer','radicand','n','fullCommutator','projectedCommutator','defect','normalPair','naiveSquare','cutoffTrace','fullTraceOnDisplayedStates','mask','targetMask','prefix','number','inputPhase','outputPhase','canonical','transformed','reverse','column','row','numberIn','numberOut','i','j','expected','hamiltonianBosonSector','fermionModesInSignCheck','state','input','output','before','after','selectedState','basis','numberByBasis'}
def replay(g,v,key=None):
 if isinstance(v,dict):
  assert isinstance(g,dict)and set(g)==set(v)
  for k in v:replay(g[k],v[k],k)
 elif isinstance(v,list):
  assert isinstance(g,list)and len(g)==len(v)
  for x,y in zip(g,v):replay(x,y,key)
 elif isinstance(v,bool)or v is None or isinstance(v,str):assert type(g)is type(v)and g==v
 elif key in INTEGER_KEYS:assert type(g)is int and type(v)is int and g==v,(key,g,v)
 else:assert isinstance(g,(float,int))and not isinstance(g,bool)and math.isfinite(g)and abs(g-v)<=4e-12*(1+abs(v)),(key,g,v)
for old,new in zip(f['records'],d['frozen']):replay(old['data'],new)
base=f['records'][0]['data'];guards=0
for change in [
 lambda x:x.update(schemaVersion=1.0000000000001),
 lambda x:x['parameters'].update(cutoff=3.0000000000001),
 lambda x:x['algebra']['ladder'][0].update(n=.0000000000001),
 lambda x:x['algebra']['selected'][0]['full']['coefficient'].update(radicand=1.0000000000001),
 lambda x:x['jordanWigner']['actions'][0].update(mask=.0000000000001),
 lambda x:x['boundaries'].update(cutoffOnlyAlgebra=1),
 lambda x:x['boson']['terms'][0].update(column=.0000000000001),
 lambda x:x['dynamics'][0].update(norm=float('nan')),
 lambda x:x['parameters'].update(statistics=0),
 lambda x:x['algebra']['relations'][0]['left']['state'].__setitem__(0,.0000000000001)
]:
 mutant=copy.deepcopy(base);change(mutant)
 try:replay(mutant,base)
 except AssertionError:guards+=1
 else:raise AssertionError('Replay guard')
def expected_points(s):
 a=s['algebra'];n=s['parameters']['occupation'+str(s['parameters']['mode'])];q=s['parameters']['cutoff'];rs=a['ladder']
 return[
  [[[r['n'],r['n']+1]for r in rs],[[r['n'],r['n']+1 if r['n']<q else 0]for r in rs],[[r['n'],r['n']]for r in rs],[[n,n+1]]],
  [[[r['n'],1]for r in rs],[[r['n'],r['projectedCommutator']]for r in rs],[[r['n'],r['defect']]for r in rs]],
  [[[r['mask']+(i-1.5)*.13,r['coefficient']]for r in s['jordanWigner']['actions']if r['kind']=='create'and r['mode']==i]for i in range(4)],
  [[[r['U'],r['bosonEnergies'][i]]for r in s['spectrumScan']]for i in range(3)]+[[[r['U'],r['U']]for r in s['spectrumScan']]],
  [[[r['time'],r['probabilities'][i]]for j,r in enumerate(s['dynamics'])if i!=2 or j%4==0]for i in range(3)]+[[[r['time'],r['fermion']['probabilities'][3]]for r in s['dynamics']]],
  [[[r['n'],r[k]]for r in rs]for k in ['normalPair','naiveSquare','n']]
 ]
def jsfmt(x):
 if x is None:return'无输出'
 if isinstance(x,list):return'['+', '.join(jsfmt(v)for v in x)+']'
 if isinstance(x,bool):return'是'if x else'否'
 if isinstance(x,dict):
  if 'radicand'in x:
   if not x['integer']or x['radicand']==1:return str(x['integer'])
   return(''if x['integer']==1 else'−'if x['integer']==-1 else str(x['integer']))+'√'+str(x['radicand'])+' ≈ '+jsfmt(x['value'])
  return json.dumps(x,ensure_ascii=False,separators=(',',':'))
 if isinstance(x,(int,float)):
  if x==int(x):return str(int(x))
  if abs(x)<1e-4 or abs(x)>=1e5:
   a,b=format(x,'.5e').split('e');return a+'e'+('+'if int(b)>=0 else'-')+str(abs(int(b)))
  return format(x,'.7g')
 return str(x)
def mappedtext(a):return'0（无输出态）'if a['state']is None else jsfmt(a['coefficient'])+' |'+','.join(map(str,a['state']))+'〉'
def wordtext(steps):return'；'.join(('产生'if r['kind']=='create'else'湮灭')+'模式'+str(r['mode'])+'：|'+','.join(map(str,r['before']))+'〉 → '+mappedtext({'state':r['after'],'coefficient':r['coefficient']})for r in steps)
def expected_tables(s):
 a=s['algebra'];jw=s['jordanWigner'];result={
 'parameters':[list(x)for x in s['parameters'].items()]+[list(x)for x in s['boundaries'].items()],
 'actions':[[r[k]for k in ['input','mode','kind','state','coefficient']]for r in a['actions']],
 'algebra':[[statistics+'/'+str(m),r['state'],r['i'],r['j'],r['family'],mappedtext(r['left']),mappedtext(r['right']),' + '.join(mappedtext(v)for v in r['combined'])if r['combined']else'0（无输出态）',r['expected']]for statistics,m,rows in [(a['statistics'],2,a['relations']),('fermion',4,jw['relations'])]for r in rows],
 'jordan-wigner':[[r[k]for k in ['mask','input','mode','kind','prefix','coefficient','targetMask','output']]for r in jw['actions']],
 'reordering':[[r[k]for k in ['mask','mode','kind','number','inputPhase','outputPhase','canonical','transformed','reverse']]for r in jw['reordering']],
 'cutoff':[[r['n'],*[mappedtext(r[k])for k in ['bosonCreate','projectedCreate','bosonAnnihilate','projectedAnnihilate']],r['fullCommutator'],r['projectedCommutator'],r['defect']]for r in a['ladder']],
 'eigensystem':[[k,f,v]for k in ['boson','fermion']for f,v in [*[(f,s[k][f])for f in ['basis','matrix','numberByBasis','commutator','commutatorResidual','hermiticity','trace','traceSquared']],*s[k]['eigen'].items()]],
 'spectrum-scan':[[r[k]for k in ['U','bosonEnergies','fermionEnergies','bosonTrace','bosonTraceSquared','residual']]for r in s['spectrumScan']],
 'dynamics':[[*[r[k]for k in ['time','real','imaginary','probabilities','norm','energy','meanN0']],*[r['fermion'][k]for k in ['real','imaginary','probabilities','norm','energy']]]for r in s['dynamics']],
 'pairs':[[r['n'],r['normalPair'],r['naiveSquare'],r['normalPair']/2,r['n']]for r in a['ladder']],
 'summary':[['所选初态',a['selectedState']],*[[r['kind']+' 未截断/投影',[mappedtext(r['full']),mappedtext(r['projected'])]]for r in a['selected']],['截断对易子迹',a['cutoffTrace']],['未截断恒等算符在显示基上的迹',a['fullTraceOnDisplayedStates']],*[list(x)for x in s['freeBunching'].items()]]}
 for k in ['boson','fermion']:result[k+'-matrix']=[[*[r[f]for f in ['column','row','input','output','term','factor','value','numberIn','numberOut']],wordtext(r['steps'])if'steps'in r else'对角项']for r in s[k]['terms']]
 return result

plotcoords=markers=table_rows=0;NS='{http://www.w3.org/2000/svg}'
for record,render in zip(d['records'],d['rendered']):
 assert len(render['plots'])==6 and len(render['tables'])==13 and len(render['svgs'])==6
 for p,source,expected in zip(render['plots'],render['svgs'],expected_points(record)):
  replay([s['points']for s in p['series']],expected)
  assert p['xMin']<p['xMax']and p['yMin']<p['yMax']
  root=ET.fromstring(source);assert root.get('viewBox')=='0 0 900 580'and root.get('role')=='img'and root.get('aria-label')==p['title']
  assert root.find(NS+'title').text==p['title'];ps=[x for x in root.findall(NS+'path')if x.get('data-series')is not None];assert len(ps)==len(p['series'])
  expected_markers=[]
  for i,(series,path)in enumerate(zip(p['series'],ps)):
   assert path.get('data-series')==str(i)and path.get('stroke')==series['color']
   coords=re.findall(r'[ML](-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)',path.get('d',''));points=series['points'];assert len(coords)==len(points)
   assert path.get('d').count('M')==(len(points)if series.get('markersOnly')else 1)
   for xy,(x,y)in zip(coords,points):
    assert math.isfinite(x)and math.isfinite(y)and p['xMin']-1e-12<=x<=p['xMax']+1e-12 and p['yMin']-1e-12<=y<=p['yMax']+1e-12
    X=100+(x-p['xMin'])/(p['xMax']-p['xMin'])*755;Y=385-(y-p['yMin'])/(p['yMax']-p['yMin'])*290
    assert abs(float(xy[0])-X)<=.000001 and abs(float(xy[1])-Y)<=.000001;plotcoords+=2
    if series.get('markersOnly')or len(points)==1:expected_markers.append((X,Y,series['color'],'none'if series.get('hollow')else series['color']))
  actual=root.findall(NS+'circle');assert len(actual)==len(expected_markers);markers+=len(actual)
  for point,(X,Y,color,fill)in zip(actual,expected_markers):assert abs(float(point.get('cx'))-X)<1e-9 and abs(float(point.get('cy'))-Y)<1e-9 and point.get('stroke')==color and point.get('fill')==fill and float(point.get('r'))==5
  for node in root.findall(NS+'text'):
   if node.text in [s['name']for s in p['series']]:assert float(node.get('y'))+8<=580
 expected=expected_tables(record);assert {t['key']for t in render['tables']}==set(expected)
 for t in render['tables']:
  assert t['title']and t['headers'];replay(t['rows'],expected[t['key']])
  for row in t['rows']:assert len(row)==len(t['headers'])
  table_rows+=len(t['rows'])
mutations=0
for change in [
 lambda x:x['algebra']['selected'][0]['full']['coefficient'].update(integer=2),
 lambda x:x['algebra']['actions'][0]['coefficient'].update(value=1),
 lambda x:x['algebra']['relations'][0]['left']['coefficient'].update(integer=0),
 lambda x:x['algebra']['relations'][0].update(combined=[]),
 lambda x:x['algebra']['ladder'][-1].update(projectedCommutator=1),
 lambda x:x['algebra']['ladder'][-1].update(normalPair=9),
 lambda x:x['jordanWigner']['actions'][0].update(coefficient=1),
 lambda x:x['jordanWigner']['actions'][0].update(prefix=1),
 lambda x:x['jordanWigner']['reordering'][3].update(transformed=-1),
 lambda x:x['boson']['matrix'][0].__setitem__(1,0),
 lambda x:x['fermion']['matrix'][1].__setitem__(2,1),
 lambda x:x['boson']['eigen']['energies'].__setitem__(0,0),
 lambda x:x['boson']['eigen']['vectors'][0].__setitem__(0,2),
 lambda x:x['spectrumScan'][0]['bosonEnergies'].__setitem__(0,0),
 lambda x:x['dynamics'][5]['probabilities'].__setitem__(0,.99),
 lambda x:x['dynamics'][0]['real'].__setitem__(0,1),
 lambda x:x['freeBunching']['result']['probabilities'].__setitem__(0,0),
 lambda x:x['boundaries'].update(hamiltonianUsesDisplayedOccupations=True)
]:
 mutant=copy.deepcopy(base);change(mutant)
 try:verify(mutant)
 except AssertionError:mutations+=1
 else:raise AssertionError('Undetected scientific mutation')
print(json.dumps({'status':'PASS','records':len(d['records']),'frozen':len(f['records']),'checks':science_checks,'plotCoordinates':plotcoords,'markers':markers,'ledgerRows':table_rows,'invalid':d['invalid'],'feedback':d['feedback'],'mutations':mutations,'self':d['self']['checks'],'replayGuards':guards}))
