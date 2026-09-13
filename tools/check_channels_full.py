#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Independent standard-library complex-matrix and closed-superoperator reference."""
import math,cmath
checks=0
def close(a,b,label='',atol=2e-10,rtol=2e-8):
 global checks
 if isinstance(b,(list,tuple)):
  assert isinstance(a,(list,tuple))and len(a)==len(b),(label,'shape')
  for x,y in zip(a,b):close(x,y,label,atol,rtol)
 elif isinstance(b,dict):
  assert isinstance(a,dict)and list(a)==list(b),(label,'keys',list(a),list(b))
  for k in b:close(a[k],b[k],label+'.'+k,atol,rtol)
 elif b is None:assert a is None,(label,a,b)
 elif isinstance(b,(str,bool)):assert type(a)==type(b)and a==b,(label,a,b)
 else:assert type(a)in(int,float,complex)and math.isfinite(abs(a))and abs(a-b)<=atol+rtol*abs(b),(label,a,b)
 checks+=1
def pack(v):
 if isinstance(v,complex):return[v.real,v.imag]
 if isinstance(v,list):return[pack(x)for x in v]
 if isinstance(v,dict):return{k:pack(x)for k,x in v.items()}
 return v
def mat(rows):return[[complex(x)for x in r]for r in rows]
def eye(n):return mat([[int(i==j)for j in range(n)]for i in range(n)])
def scale(A,x):return[[z*x for z in r]for r in A]
def plus(A,B):return[[x+y for x,y in zip(r,s)]for r,s in zip(A,B)]
def adj(A):return[[A[j][i].conjugate()for j in range(len(A))]for i in range(len(A[0]))]
def mm(A,B):return[[sum(x*y for x,y in zip(r,c))for c in zip(*B)]for r in A]
def outer(v):return[[x*y.conjugate()for y in v]for x in v]
def tr(A):return sum(r[i]for i,r in enumerate(A))
def kron(A,B):return[[x*y for x in r for y in s]for r in A for s in B]
def part(A,over):return[[sum(A[2*k+i][2*k+j]if over==0 else A[2*i+k][2*j+k]for k in range(2))for j in range(2)]for i in range(2)]
def norm(A):return math.sqrt(sum(abs(z)**2 for r in A for z in r))
def eig2(A,i=0,j=1):
 a=A[i][i].real;b=A[j][j].real;gap=math.sqrt((a-b)**2+4*abs(A[i][j])**2);return[(a+b-gap)/2,(a+b+gap)/2]
def eigx(A):return sorted([A[1][1].real,A[2][2].real,*eig2(A,0,3)])
def info(A):return dict(matrix=A,trace=tr(A),purity=tr(mm(A,A)).real,eigenvalues=eig2(A),bloch=[2*A[0][1].real,-2*A[0][1].imag,(A[0][0]-A[1][1]).real],excited=A[1][1].real,coherence=abs(A[0][1]))
def phase(k):
 if k%2==0:return[1+0j,1j,-1+0j,-1j][(k//2)%4]
 return cmath.exp(1j*k*math.pi/4)
def angle(deg):
 if deg==0:return 1.,0.
 if deg==180:return 0.,1.
 if deg==90:return math.sqrt(.5),math.sqrt(.5)
 return math.cos(deg*math.pi/360),math.sin(deg*math.pi/360)
def state(deg,k,r):
 a,b=angle(deg);v=[complex(a),phase(k)*b];return dict(vector=v,rho=plus(scale(outer(v),r),scale(eye(2),(1-r)/2)),radius=r)
def K(p):return[mat([[1,0],[0,math.sqrt(1-p)]]),mat([[0,math.sqrt(p)],[0,0]])]
def apply(ops,A):
 out=scale(A,0)
 for op in ops:out=plus(out,mm(mm(op,A),adj(op)))
 return out
def complete(ops):
 out=scale(eye(2),0)
 for op in ops:out=plus(out,mm(adj(op),op))
 return out
def CJ(ops):
 out=scale(eye(4),0)
 for op in ops:out=plus(out,scale(outer([z for r in op for z in r]),.5))
 return out
def damping(A,p):
 a,b=A[0];c,d=A[1];return[[a+p*d,math.sqrt(1-p)*b],[math.sqrt(1-p)*c,(1-p)*d]]
def noise(A,q):return[[((1-q)*A[j][i]+(q*tr(A)/2 if i==j else 0))for j in range(2)]for i in range(2)]
def recover(J,A):
 # Trace of J(I tensor transpose(A)), using explicit matrix multiplication.
 AT=[list(r)for r in zip(*A)];return scale(part(mm(J,kron(eye(2),AT)),1),2)
def branches(ops,st,conditional):
 out=[]
 for op in ops:
  R=mm(mm(op,st['rho']),adj(op));prob=tr(R).real
  out.append(dict(operator=op,unnormalized=R,probability=prob,**({'conditional':None if prob==0 else scale(R,1/prob)}if conditional else{})))
 return out
def rotate(ops,deg,k):
 c,s=angle(2*deg);z=phase(k);W=[[complex(c),s*z],[-s*z.conjugate(),complex(c)]];rot=[plus(scale(ops[0],r[0]),scale(ops[1],r[1]))for r in W];return W,rot
def spectral_kraus(spec):return[scale([q['vector'][:2],q['vector'][2:]],math.sqrt(2*q['value']))for q in spec if q['value']>0]
def damp_record(p,st,g,k):
 ops=K(p);a=math.sqrt(1-p);b=math.sqrt(p);U=mat([[1,0,0,0],[0,a,b,0],[0,-b,a,0],[0,0,0,1]]);V=[[row[0],row[2]]for row in U]
 joint=mm(mm(V,st['rho']),adj(V));J=mat([[.5,0,0,a/2],[0,p/2,0,0],[0,0,0,0],[a/2,0,0,(1-p)/2]])
 spec=[dict(value=(2-p)/2,vector=[complex(1/math.sqrt(2-p)),0j,0j,complex(a/math.sqrt(2-p))]),dict(value=p/2,vector=[0j,1+0j,0j,0j])];rec=spectral_kraus(spec);W,rot=rotate(ops,g,k)
 return dict(p=p,kraus=ops,completeness=complete(ops),U=U,unitarity=mm(adj(U),U),V=V,isometry=mm(adj(V),V),joint=joint,system=info(part(joint,1)),environment=info(part(joint,0)),output=info(damping(st['rho'],p)),branches=branches(ops,st,True),choi=J,choiTrace=tr(J),choiMarginal=part(J,0),choiEigenvalues=[0,0,p/2,1-p/2],spectral=spec,reconstructedKraus=rec,reconstructedOutput=apply(rec,st['rho']),choiRecoveredOutput=recover(J,st['rho']),krausChoi=CJ(ops),rotated=dict(W=W,kraus=rot,completeness=complete(rot),output=apply(rot,st['rho']),choi=CJ(rot),branches=branches(rot,st,False)))
PAULI=[eye(2),mat([[0,1],[1,0]]),mat([[0,-1j],[1j,0]]),mat([[1,0],[0,-1]])]
def noise_record(q,st,deg,k):
 F=mat([[1,0,0,0],[0,0,1,0],[0,1,0,0],[0,0,0,1]]);J=plus(scale(F,(1-q)/2),scale(eye(4),q/4));wp=(2-q)/4;wm=(3*q-2)/4;weights=[wp,wp,wm,wp];cp=q>=2/3
 ops=[scale(A,math.sqrt(w))for A,w in zip(PAULI,weights)]if cp else None
 spec=[dict(value=w,vector=[z/math.sqrt(2)for row in A for z in row])for A,w in zip(PAULI,weights)];rec=spectral_kraus(spec)if cp else None
 a,b=angle(deg);v=[complex(a),0j,0j,b*phase(k)];R=outer(v);RT=[[R[2*(j//2)+i%2][2*(i//2)+j%2]for j in range(4)]for i in range(4)];Q=plus(scale(RT,1-q),scale(kron(eye(2),part(R,0)),q/2));ev=sorted([Q[0][0].real,Q[3][3].real,*eig2(Q,1,2)])
 return dict(q=q,cp=cp,positive=True,tracePreserving=True,choi=J,eigenvalues=sorted([wm,wp,wp,wp]),choiTrace=tr(J),choiMarginal=part(J,0),singletWitness=complex(wm),pauliWeights=weights,pauliKraus=ops,spectral=spec,reconstructedKraus=rec,single=info(noise(st['rho'],q)),reconstructedSingle=apply(rec,st['rho'])if cp else None,pauliSingle=apply(ops,st['rho'])if cp else None,pauliCompleteness=complete(ops)if cp else None,pauliChoi=CJ(ops)if cp else None,choiRecoveredSingle=recover(J,st['rho']),jointInput=R,jointOutput=Q,jointEigenvalues=ev,jointTrace=tr(Q),referenceInput=part(R,0),referenceOutput=part(Q,0),schmidtDegrees=deg,schmidtPhaseQuarters=k)
def euler_choi(pop,coh):return mat([[.5,0,0,coh/2],[0,(1-pop)/2,0,0],[0,0,0,0],[coh/2,0,0,pop/2]])
def euler_super(pop,coh):return mat([[1,0,0,1-pop],[0,coh,0,0],[0,0,coh,0],[0,0,0,pop]])
def euler_output(A,pop,coh):return[[A[0][0]+(1-pop)*A[1][1],coh*A[0][1]],[coh*A[1][0],pop*A[1][1]]]
def time_record(x,M,st):
 h=x/M;pop=(1-h)**M;coh=(1-h/2)**M;J=euler_choi(pop,coh);step=euler_choi(1-h,1-h/2);exact=euler_choi(math.exp(-x),math.exp(-x/2));A=st['rho']
 return dict(x=x,M=M,h=h,stepSuper=euler_super(1-h,1-h/2),totalSuper=euler_super(pop,coh),stepChoi=step,stepEigenvalues=eigx(step),stepCornerDeterminant=-h*h/16,choi=J,eigenvalues=eigx(J),marginal=part(J,0),choiTrace=tr(J),exactP=-math.expm1(-x),exactChoi=exact,choiError=norm(plus(J,scale(exact,-1))),output=info(euler_output(A,pop,coh)),exactOutput=info(euler_output(A,math.exp(-x),math.exp(-x/2))),twoHalfSteps=euler_output(euler_output(A,math.exp(-x/2),math.exp(-x/4)),math.exp(-x/2),math.exp(-x/4)))
def review(s):
 p=s['parameters'];dp=p['dampingPercent']/100;q=p['noiseThirtieths']/30;x=p['durationTenths']/10;M=2**p['stepLevel'];st=state(p['inputPolar'],p['inputPhaseQuarters'],p['blochTenths']/10)
 def check(actual,expected,label):close(actual,pack(expected),label)
 check(s['model'],dict(systemFirst=True,normalizedChoi=True,choiReconstructionFactor=2,p=dp,q=q,inputPolar=p['inputPolar'],inputPhase=p['inputPhaseQuarters']*math.pi/4,blochRadius=p['blochTenths']/10,schmidtDegrees=p['schmidtDegrees'],krausMixDegrees=p['krausMixDegrees'],x=x,M=M),'model')
 check(s['input'],dict(**st,info=info(st['rho'])),'input')
 d=damp_record(dp,st,p['krausMixDegrees'],p['krausPhaseQuarters']);n=noise_record(q,st,p['schmidtDegrees'],p['schmidtPhaseQuarters']);check(s['damping'],d,'damping');check(s['noise'],n,'noise');check(s['time'],time_record(x,M,st),'time')
 units=[]
 for i in range(2):
  for j in range(2):
   E=scale(eye(2),0);E[i][j]=1+0j;units.append(dict(i=i,j=j,input=E,damping=damping(E,dp),dampingRecovered=recover(d['choi'],E),noise=noise(E,q),noiseRecovered=recover(n['choi'],E)))
 check(s['matrixUnits'],units,'units')
 sizes={'dampingScan':101,'noiseScan':121,'schmidtScan':181,'gaugeScan':91,'resolutionScan':9,'stepScan':81}
 for key,count in sizes.items():assert len(s[key])==count
 for i,v in enumerate(s['dampingScan']):check(v,dict(p=i/100,**info(damping(st['rho'],i/100))),'damping scan')
 for i,v in enumerate(s['noiseScan']):
  z=noise_record(i/120,st,p['schmidtDegrees'],p['schmidtPhaseQuarters']);check(v,dict(q=i/120,choi=z['choi'],eigenvalues=z['eigenvalues'],witness=z['singletWitness'],jointMinimum=z['jointEigenvalues'][0],singleMinimum=z['single']['eigenvalues'][0],cp=z['cp']),'noise scan')
 for i,v in enumerate(s['schmidtScan']):
  z=noise_record(q,st,i,p['schmidtPhaseQuarters']);check(v,dict(degrees=i,joint=z['jointOutput'],eigenvalues=z['jointEigenvalues'],reference=z['referenceOutput']),'Schmidt scan')
 for i,v in enumerate(s['gaugeScan']):
  W,ops=rotate(d['kraus'],i,p['krausPhaseQuarters']);check(v,dict(degrees=i,W=W,probabilities=[r['probability']for r in branches(ops,st,False)],output=apply(ops,st['rho']),choi=CJ(ops)),'gauge scan')
 for i,v in enumerate(s['resolutionScan']):check(v,time_record(x,2**i,st),'resolution scan')
 for i,v in enumerate(s['stepScan']):
  h=i/20;J=euler_choi(1-h,1-h/2);E=euler_choi(math.exp(-h),math.exp(-h/2));check(v,dict(h=h,choi=J,eigenvalues=eigx(J),exactChoi=E,exactEigenvalues=eigx(E),cornerDeterminant=-h*h/16),'step scan')
 keys=['complexMatricesKept','systemReferenceOrderFixed','choiNormalizedTraceOne','reconstructionUsesTransposeAndFactorTwo','completePositivityNeedsAncilla','negativeEigenvaluesNeverClipped','illegalTransposeNotImplementation','krausBasisPreservesUnconditionalMap','conditionalStateNeedsNonzeroProbability','environmentInitiallyUncorrelated','singleCPTPDoesNotProveSemigroup','eulerTracePreservingNotCP'];close(s['boundaries'],dict.fromkeys(keys,True),'boundaries')
 assert list(s)==['parameters','model','input','damping','noise','matrixUnits','time',*sizes,'boundaries']

def expected_plots(s):
 log=lambda rows:[None if y==0 else[x,math.log10(abs(y))]for x,y in rows]
 values=[
 ('damping',[0,1],[[[q['p'],q[k]]for q in s['dampingScan']]for k in ['purity','excited','coherence']]),
 ('choi',[0,1],[[[q['q'],q['eigenvalues'][i]]for q in s['noiseScan']]for i in [0,3]]),
 ('ancilla',[0,180],[[[q['degrees'],q['eigenvalues'][0]]for q in s['schmidtScan']],[[0,0],[180,0]]]),
 ('basis',[0,90],[[[q['degrees'],q['probabilities'][i]]for q in s['gaugeScan']]for i in [0,1]]+[[[q['degrees'],q['output'][1][1][0]]for q in s['gaugeScan']]]),
 ('euler',[0,4],[[[q['h'],q[k][0]]for q in s['stepScan']]for k in ['eigenvalues','exactEigenvalues']]),
 ('resolution',[0,8],[log([[math.log2(q['M']),q['choiError']]for q in s['resolutionScan']]),log([[math.log2(q['M']),max(0,-q['eigenvalues'][0])]for q in s['resolutionScan']])])]
 out=[]
 for key,domain,series in values:
  ys=[p[1]for line in series for p in line if p is not None];lo=min([0]+ys);hi=max([0]+ys)
  if lo==hi:hi=lo+1
  pad=.07*(hi-lo);out.append((key,domain,[lo-pad,hi+pad],series))
 return out
def expected_tables(s):
 at=lambda q,ks:[q[k]for k in ks];d=s['damping'];n=s['noise']
 return[
 ('parameters',[[g,k,v]for g,q in [('控件',s['parameters']),('模型',s['model'])]for k,v in q.items()]+[['输入','纯态方向向量',s['input']['vector']],['输入','实际密度矩阵',s['input']['rho']],['输入','本征值',s['input']['info']['eigenvalues']],['输入','纯度',s['input']['info']['purity']]]),
 ('damping',[['原始Kraus算符',d['kraus']],['ΣK†K',d['completeness']],['系统环境幺正U',d['U']],['U†U',d['unitarity']],['等距V',d['V']],['V†V',d['isometry']],['联合系统环境态',d['joint']],['系统偏迹',d['system']['matrix']],['环境偏迹',d['environment']['matrix']],['直接Kraus输出',d['output']['matrix']],['系统纯度',d['system']['purity']],['环境纯度',d['environment']['purity']],['环境基底变换W',d['rotated']['W']],['变换后的Kraus',d['rotated']['kraus']],['变换后的ΣK†K',d['rotated']['completeness']],['变换后的无条件输出',d['rotated']['output']]]),
 ('branches',[[label,i,q['operator'],q['unnormalized'],q['probability'],q.get('conditional')]for label,rows in [('原始',d['branches']),('变换后（仅列未归一化态）',d['rotated']['branches'])]for i,q in enumerate(rows)]),
 ('choi',[['完整Choi',d['choi'],n['choi']],['迹',d['choiTrace'],n['choiTrace']],['输出系统偏迹',d['choiMarginal'],n['choiMarginal']],['本征值',d['choiEigenvalues'],n['eigenvalues']],['完全正',True,n['cp']],['谱分解重建Kraus',d['reconstructedKraus'],n['reconstructedKraus']],['谱分解Kraus输出',d['reconstructedOutput'],n['reconstructedSingle']],['Choi直接重建输出',d['choiRecoveredOutput'],n['choiRecoveredSingle']],['I/X/Y/Z概率',None,n['pauliWeights']],['合法Pauli Kraus',None,n['pauliKraus']],['Pauli实现的输出',None,n['pauliSingle']],['Pauli实现的Choi',None,n['pauliChoi']],['反对称Choi方向期望',None,n['singletWitness']]]),
 ('basis',[at(q,['i','j','input','damping','dampingRecovered','noise','noiseRecovered'])for q in s['matrixUnits']]),
 ('ancilla',[['单系统输出',n['single']['matrix']],['单系统本征值',n['single']['eigenvalues']],['联合输入',n['jointInput']],['实际联合输出候选',n['jointOutput']],['联合输出本征值',n['jointEigenvalues']],['联合输出迹',n['jointTrace']],['操作前参考系统边缘态',n['referenceInput']],['操作后参考系统边缘态',n['referenceOutput']]]),
 ('resolution',[['当前'if i==0 else'扫描',*at(q,['x','M','h','stepSuper','totalSuper','stepChoi','stepEigenvalues','stepCornerDeterminant','choi','eigenvalues','marginal','choiTrace','exactP','exactChoi','choiError']),q['output']['matrix'],q['exactOutput']['matrix'],q['twoHalfSteps']]for i,q in enumerate([s['time'],*s['resolutionScan']])]),
 ('damping-scan',[at(q,['p','matrix','trace','purity','eigenvalues','bloch','excited','coherence'])for q in s['dampingScan']]),
 ('noise-scan',[at(q,['q','choi','eigenvalues','witness','jointMinimum','singleMinimum','cp'])for q in s['noiseScan']]),
 ('schmidt',[at(q,['degrees','joint','eigenvalues','reference'])for q in s['schmidtScan']]),
 ('gauge',[at(q,['degrees','W','probabilities','output','choi'])for q in s['gaugeScan']]),
 ('step',[at(q,['h','choi','eigenvalues','exactChoi','exactEigenvalues','cornerDeterminant'])for q in s['stepScan']]),
 ('boundaries',[list(q)for q in s['boundaries'].items()])]

NODE="const fs=require('fs'),a=require(process.argv[1]),f=require(process.argv[2]);\nfunction replay(x,y,path='root'){if(typeof y==='number'){if(typeof x!=='number'||!Number.isFinite(x)||Math.abs(x-y)>3e-11+5e-10*Math.abs(y))throw Error('Replay '+path);}else if(y!==null&&typeof y==='object'){if(!x||typeof x!=='object'||Array.isArray(x)!==Array.isArray(y)||JSON.stringify(Object.keys(x))!==JSON.stringify(Object.keys(y)))throw Error('Replay keys '+path);for(const k of Object.keys(y))replay(x[k],y[k],path+'.'+k);}else if(x!==y)throw Error('Replay scalar '+path);}\nconst cases=a.PRESETS.map(p=>a.compute(p.parameters));let invalid=0;\nfor(const[k,[lo,hi]]of Object.entries(a.LIMITS)){cases.push(a.compute({[k]:lo}),a.compute({[k]:hi}));for(const v of[lo-1,hi+1,lo+.5,'1',null,true,NaN,Infinity]){let bad=false;try{a.compute({[k]:v})}catch(e){bad=true}if(!bad)throw Error('Invalid accepted '+k);invalid++;}}\nfor(const v of[null,[],true,{unknown:1}]){let bad=false;try{a.compute(v)}catch(e){bad=true}if(!bad)throw Error('Bad object');invalid++;}\nfor(const r of f.records)replay(r.data,a.compute(r.data.parameters));\nconst observed=process.argv[3]?JSON.parse(fs.readFileSync(process.argv[3],'utf8')):[];for(const q of observed)replay(q,a.compute(q.parameters));\nlet feedback=0;for(let i=0;i<4;i++)for(let j=0;j<2;j++){if(a.feedback(i,j).correct!==(j===a.QUESTIONS[i][2]))throw Error('Feedback');feedback++;}\nconst snapshots=[...cases,...f.records.map(r=>r.data),...observed];const records=snapshots.map(snapshot=>({snapshot,plots:a.plots(snapshot),tables:a.tables(snapshot),svgs:a.plots(snapshot).map(a.svg)}));\nlet replayGuards=0;for(const change of[q=>q.schema='wrong',q=>q.parameters.stepLevel=99,q=>delete q.noise,q=>q.noise.q='0',q=>q.noise.choi[0][0][0]=NaN,q=>q.noiseScan.pop(),q=>q.boundaries.negativeEigenvaluesNeverClipped=false,q=>q.time.totalSuper=null]){const q=JSON.parse(JSON.stringify(cases[0]));change(q);try{replay(q,cases[0])}catch(e){replayGuards++;}}if(replayGuards!==8)throw Error('Replay guard');\nfunction mountPresetNames(api){class E{constructor(tag,doc){this.tag=tag;this.ownerDocument=doc;this.children=[];this.attrs={};this._text='';this.classList={add(){}};}set textContent(v){this._text=String(v);this.children=[];}get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}append(...xs){this.children.push(...xs);}replaceChildren(...xs){this._text='';this.children=[...xs];}setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return Object.hasOwn(this.attrs,k)?this.attrs[k]:null;}removeAttribute(k){delete this.attrs[k];}addEventListener(){}}const doc={createElement(t){return new E(t,this)},querySelector(){return null}};doc.head=new E('head',doc);const root=new E('div',doc);api.mount(root);const all=[];function visit(e){if(e.getAttribute('data-preset')!==null)all.push(e);e.children.forEach(visit)}visit(root);if(all.length!==api.PRESETS.length)throw Error('Preset count');all.forEach((b,i)=>{const name=api.PRESETS[i].name;if(typeof name!=='string'||!name.trim()||b.textContent.trim()!==name)throw Error('Missing name')});return all.length;}\nconst mountLabels=mountPresetNames(a),source=fs.readFileSync(process.argv[1],'utf8'),needle='},p.name);';if(!source.includes(needle))throw Error('Name field');const sandbox={module:{exports:{}}};require('vm').runInNewContext(source.replace(needle,'},p.label);'),sandbox);let mountMutations=0;try{mountPresetNames(sandbox.module.exports)}catch(e){mountMutations++;}if(mountMutations!==1)throw Error('Name mutation');\nconsole.log(JSON.stringify({records,live:cases.length,frozen:f.records.length,observed:observed.length,invalid,feedback,replayGuards,mountLabels,mountMutations,self:a.selfTest()}));\n"
def viewcheck(record):
 global coords,markers,ledgerRows
 s=record['snapshot'];wanted=expected_plots(s);assert len(record['plots'])==len(record['svgs'])==6
 for p,(key,domain,yrange,series),markup in zip(record['plots'],wanted,record['svgs']):
  assert p['key']==key and p['title']and p['xLabel']and p['yLabel'];close([p['xMin'],p['xMax']],domain)
  close([p['yMin'],p['yMax']],yrange);assert len(p['series'])==len(series)
  tree=ET.fromstring(markup);assert tree.attrib['viewBox']=='0 0 900 580'and tree.attrib['role']=='img'and tree.attrib['aria-label']==p['title'];paths=tree.findall('.//{*}path');circles=tree.findall('.//{*}circle');assert len(paths)==len(series)
  mark=0
  for i,(line,expected,path)in enumerate(zip(p['series'],series,paths)):
   close(line['points'],expected,'scientific plot');assert path.attrib['data-series']==str(i)and path.attrib['stroke']==line['color']
   commands=re.findall(r'([ML])([-+\deE.]+),([-+\deE.]+)',path.attrib['d']);points=[q for q in expected if q is not None];assert len(commands)==len(points)
   pen=False;idx=0
   for q in expected:
    if q is None:pen=False;continue
    kind,x,y=commands[idx];assert kind==('L'if pen else'M');pen=True;idx+=1
    assert domain[0]-1e-10<=q[0]<=domain[1]+1e-10 and p['yMin']<=q[1]<=p['yMax']
    X=100+(q[0]-domain[0])/(domain[1]-domain[0])*755;Y=385-(q[1]-p['yMin'])/(p['yMax']-p['yMin'])*290
    close([float(x),float(y)],[X,Y],'SVG coordinate',atol=6e-7,rtol=0);coords+=2
    if idx in [1,len(points)]:
     c=circles[mark];mark+=1;close([float(c.attrib['cx']),float(c.attrib['cy']),float(c.attrib['r'])],[X,Y,3.5+1.5*i]);assert c.attrib['stroke']==line['color']and c.attrib['fill']==('none'if i else line['color']);markers+=1
  assert mark==len(circles)
 for t,(key,rows)in zip(record['tables'],expected_tables(s)):
  assert t['key']==key and t['title'];close(t['rows'],rows,'full table '+key);assert all(len(r)==len(t['headers'])for r in t['rows']);ledgerRows+=len(rows)
 assert len(record['tables'])==13

if __name__=='__main__':
 import sys,json,hashlib,subprocess,shutil,re,copy
 import xml.etree.ElementTree as ET
 from pathlib import Path
 root=Path(__file__).resolve().parents[1];js=Path(sys.argv[1]).resolve()if len(sys.argv)>1 else root/'course-shared/labs/scalar-quantum-channels.js';fixture=Path(sys.argv[2]).resolve()if len(sys.argv)>2 else root/'course-shared/projects/channels-certificates/run-snapshot.json'
 f=json.loads(fixture.read_text());assert f['provenance']['sourceSha256']==hashlib.sha256(js.read_bytes()).hexdigest();assert len(f['records'])==6
 args=[str(js),str(fixture)]+([str(Path(sys.argv[3]).resolve())]if len(sys.argv)>3 else[]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
 result=json.loads(subprocess.check_output(prefix+['node','-e',NODE,*args],text=True));coords=markers=ledgerRows=0
 for r in result['records']:review(r['snapshot']);viewcheck(r)
 specimens={r['key']:r['data']for r in f['records']};mutations=0
 edits=[
 ('default',lambda q:q['damping']['system']['matrix'][0][1].__setitem__(1,-q['damping']['system']['matrix'][0][1][1])),
 ('default',lambda q:q['damping']['U'][2][1].__setitem__(0,-q['damping']['U'][2][1][0])),
 ('reset',lambda q:q['damping']['environment'].__setitem__('matrix',q['damping']['system']['matrix'])),
 ('zero',lambda q:q['damping']['branches'][1].__setitem__('conditional',q['input']['rho'])),
 ('default',lambda q:q['damping']['choiMarginal'][0][0].__setitem__(0,1)),
 ('default',lambda q:q['damping']['choiRecoveredOutput'][0][0].__setitem__(0,q['damping']['choiRecoveredOutput'][0][0][0]/2)),
 ('default',lambda q:q['matrixUnits'][1].__setitem__('dampingRecovered',q['matrixUnits'][2]['dampingRecovered'])),
 ('default',lambda q:q['noise']['eigenvalues'].__setitem__(0,0)),
 ('default',lambda q:q['noise'].__setitem__('cp',True)),
 ('default',lambda q:q['noise'].__setitem__('pauliKraus',[])),
 ('boundary',lambda q:q['noise']['pauliWeights'].__setitem__(2,.01)),
 ('pauli',lambda q:q['noise']['pauliChoi'][1][2].__setitem__(0,0)),
 ('default',lambda q:q['noise']['jointOutput'][1][2].__setitem__(1,-q['noise']['jointOutput'][1][2][1])),
 ('default',lambda q:q['gaugeScan'][45]['probabilities'].__setitem__(0,0)),
 ('default',lambda q:q['schmidtScan'][90]['eigenvalues'].__setitem__(0,0)),
 ('default',lambda q:q['time'].__setitem__('stepCornerDeterminant',0)),
 ('coarse',lambda q:q['time'].__setitem__('totalSuper',q['time']['exactChoi'])),
 ('default',lambda q:q['resolutionScan'][0].__setitem__('choiError',0)),
 ('default',lambda q:q['stepScan'][1].__setitem__('eigenvalues',q['stepScan'][1]['exactEigenvalues'])),
 ('default',lambda q:q['boundaries'].__setitem__('negativeEigenvaluesNeverClipped',False))]
 for key,edit in edits:
  q=copy.deepcopy(specimens[key]);edit(q)
  try:review(q)
  except(AssertionError,TypeError,KeyError,ValueError,ZeroDivisionError):mutations+=1
  else:raise AssertionError('Undetected mutation '+key)
 assert result['invalid']==92 and result['feedback']==8 and result['mountLabels']==12 and result['mountMutations']==1 and result['replayGuards']==8
 print(json.dumps(dict(status='PASS',records=result['live'],frozen=result['frozen'],observed=result['observed'],checks=checks,plotCoordinates=coords,markers=markers,ledgerRows=ledgerRows,invalid=result['invalid'],feedback=result['feedback'],mutations=mutations,mountLabels=result['mountLabels'],mountMutations=result['mountMutations'],replayGuards=result['replayGuards'],self=result['self']['checks'])))
