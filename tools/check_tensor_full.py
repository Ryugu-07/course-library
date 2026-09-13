#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Standard-library reference: Gram eigenvalues, projections and full-state residuals."""
import math,cmath
checks=0
def close(a,b,label='',atol=2e-10,rtol=2e-9):
 global checks
 if isinstance(b,(list,tuple)):
  assert isinstance(a,(list,tuple))and len(a)==len(b),(label,'shape')
  for x,y in zip(a,b):close(x,y,label,atol,rtol)
 elif isinstance(b,(float,int,complex))and not isinstance(b,bool):
  assert isinstance(a,(int,float,complex))and not isinstance(a,bool),(label,'number')
  assert math.isfinite(abs(a))and abs(a-b)<=atol+rtol*abs(b),(label,a,b)
 else:assert type(a)==type(b)and a==b,(label,a,b)
 checks+=1
def cx(v):
 if isinstance(v,list)and len(v)==2 and all(isinstance(x,(int,float))for x in v):return complex(*v)
 return[cx(x)for x in v]
def dot(a,b):return sum(x.conjugate()*y for x,y in zip(a,b))
def norm2(v):return sum(abs(x)**2 for x in v)
def dagger(M):return[[M[i][j].conjugate()for i in range(len(M))]for j in range(len(M[0]))]
def mm(A,B):return[[sum(x*B[k][j]for k,x in enumerate(row))for j in range(len(B[0]))]for row in A]
def reshape(v,rows):
 n=len(v)//rows;assert rows*n==len(v);return[v[i*n:(i+1)*n]for i in range(rows)]
def flat(M):return[x for row in M for x in row]
def identity(n):return[[complex(i==j)for j in range(n)]for i in range(n)]
def normalize(v):return[x/math.sqrt(norm2(v))for x in v]
def weights(M):
 G=mm(M,dagger(M))if len(M)<=len(M[0])else mm(dagger(M),M);n=len(G)
 A=[[0.]*(2*n)for _ in range(2*n)]
 for i in range(n):
  for j in range(n):A[i][j]=A[i+n][j+n]=G[i][j].real;A[i][j+n]=-G[i][j].imag;A[i+n][j]=G[i][j].imag
 N=2*n;scale=max(1,max(abs(A[i][i])for i in range(N)))
 for _ in range(80):
  changed=False
  for p in range(N):
   for q in range(p+1,N):
    b=A[p][q]
    if abs(b)<=2e-16*scale:continue
    changed=True;tau=(A[q][q]-A[p][p])/(2*b);t=(1 if tau>=0 else -1)/(abs(tau)+math.sqrt(1+tau*tau));c=1/math.sqrt(1+t*t);s=t*c
    ap,aq=A[p][p],A[q][q];A[p][p]=ap-t*b;A[q][q]=aq+t*b;A[p][q]=A[q][p]=0.
    for k in range(N):
     if k in[p,q]:continue
     u,v=A[k][p],A[k][q];A[k][p]=A[p][k]=c*u-s*v;A[k][q]=A[q][k]=s*u+c*v
  if not changed:break
 else:raise AssertionError('Independent real Gram Jacobi did not converge')
 eigen=sorted([A[i][i]for i in range(N)],reverse=True)
 return[max(0,(eigen[2*i]+eigen[2*i+1])/2)for i in range(n)]
def state(c):
 v=[0j]*64;k=c['state']
 if k==0:v[0]=1
 elif k==1:v[0]=v[63]=1/math.sqrt(2)
 elif k==2:
  for b in range(64):v[b]=(-1)**sum(((b>>j)&3)==3 for j in range(5))/8
 elif k==3:
  for b in range(64):
   if all(((b>>j)&1)==((b>>(j+1))&1)for j in[0,2,4]):v[b]=1/math.sqrt(8)
 elif k==4:
  for i,p in enumerate([.8,.1,.1]):v[9*i]=math.sqrt(p)
 elif k==5:
  e=10**(-c['tailPower'])
  for i in range(8):v[9*i]=math.sqrt(1-e if i==0 else e/7)
 else:
  seed=c['seed'];values=[]
  for _ in range(128):seed=(1664525*seed+1013904223)%2**32;values.append((seed+.5)/2**32-.5)
  v=[complex(*values[2*i:2*i+2])for i in range(64)]
 v=normalize(v)
 return[x*cmath.exp(1j*math.pi*c['phaseSteps']/12*sum((j+1)*((b>>(5-j))&1)for j in range(6)))for b,x in enumerate(v)]
def applyH(v,J,h):
 out=[]
 for b,x in enumerate(v):
  zz=sum(1 if ((b>>j)&1)==((b>>(j+1))&1)else-1 for j in range(5));out.append(-J*zz*x-h*sum(v[b^(1<<j)]for j in range(6)))
 return out
def obs(v,J,h,q):
 n=norm2(v);hv=applyH(v,J,h);mean=dot(v,hv)/n;E=mean.real;res=[x-E*y for x,y in zip(hv,v)];ps=[abs(x)**2/n for x in v]
 close([q['normSquared'],q['energy'],q['energyImaginary'],q['variance']],[n,E,mean.imag,norm2(res)/n],'full residual')
 sampled=0;nodes=0;localmean=0j;nodeCount=0
 for b,row in enumerate(q['local']):
  assert row['basis']==b;close(row['probability'],ps[b],'probability');close(row['residualWeight'],abs(res[b])**2/n,'residual row')
  if v[b]!=0:
   loc=hv[b]/v[b];close(cx(row['localEnergy']),loc,'local energy',atol=1e-8);sampled+=ps[b]*abs(loc-E)**2;localmean+=ps[b]*loc
  else:assert row['localEnergy']is None;nodes+=abs(hv[b])**2/n;nodeCount+=1
 close([q['sampledLocalVariance'],q['nodeResidual'],q['nodes']],[sampled,nodes,nodeCount],'support');close(cx(q['localEnergyMean']),localmean,'local mean');close(q['variance'],sampled+nodes,'variance decomposition')
 close(q['magnetization'],sum(ps[b]*sum(1-2*((b>>j)&1)for j in range(6))/6 for b in range(64)),'magnetization')
 close(q['neighborZZ'],sum(ps[b]*sum(1 if((b>>j)&1)==((b>>(j+1))&1)else-1 for j in range(5))/5 for b in range(64)),'ZZ')
 return E
def review(q):
 c=q['parameters'];known=[[1,1,1,1,1],[2,2,2,2,2],[2,2,2,2,2],[2,1,2,1,2],[1,2,3,3,2],[2,4,8,4,2],None][c['state']];assert q['state']['knownExactRanks']==known;v=state(c);close(cx(q['state']['amplitudes']),v,'state');assert q['schema']=='tensor203-v1';assert len(q['cuts'])==5
 for k,cut in enumerate(q['cuts'],1):
  M=reshape(v,2**k);p=weights(M);close(cut['weights'],p,'Gram spectrum');close([x*x for x in cut['sigmas']],p,'singular squares');assert cut['cut']==k and cut['rows']==len(M)and cut['columns']==len(M[0]);close(cx(cut['coefficients']),M,'matrix')
  keep=min(c['chi'],len(p));lost=sum(p[keep:]);close(cut['discardedWeight'],lost,'cut tail');close(cut['entropy'],-sum(x*math.log(x)for x in p if x>0),'entropy')
  raw=cx(cut['raw']);nv=cx(cut['normalized']);close(nv,normalize(raw),'cut normalization');close(cut['errorSquared'],norm2([x-y for x,y in zip(v,raw)]),'cut measured error');close(cut['errorSquared'],lost,'cut optimality');close(cut['squaredFidelity'],abs(dot(v,nv))**2,'cut overlap');close(cut['squaredFidelity'],1-lost,'cut F2');close(cut['overlapAmplitude']**2,cut['squaredFidelity'],'F convention')
  assert cut['rankThreshold']==1e-6 and cut['numericalRank']==sum(x>1e-6 for x in cut['sigmas'])
  for x,e in zip(cut['weights'],cut['entanglementEnergies']):
   if x>0:close(e,-math.log(x),'entanglement energy')
   else:assert e is None
 chain=q['chain'];ts=cx(chain['tensors']);R=v;left=1;total=0
 for A,step in zip(ts[:-1],chain['steps']):
  M=reshape(R,2*left);L=[A[bit][l]for l in range(left)for bit in range(2)];keep=len(L[0]);close(mm(dagger(L),L),identity(keep),'canonical');B=mm(dagger(L),M);p=weights(M)
  close(step['weights'],p,'step spectrum');lost=sum(p[keep:]);total+=step['discardedWeight'];close(step['discardedWeight'],lost,'step optimal tail');close(norm2([x-y for x,y in zip(flat(M),flat(mm(L,B)))]),lost,'step projection error')
  close([step['incomingNormSquared'],step['retainedNormSquared']],[norm2(flat(M)),norm2(flat(B))],'step norm');R=flat(B);left=keep
 close([ts[-1][bit][l][0]for l in range(left)for bit in range(2)],R,'last tensor')
 rows=[[1+0j]]
 for A in ts:rows=[[sum(x*A[bit][l][r]for l,x in enumerate(row))for r in range(len(A[0][0]))]for row in rows for bit in range(2)]
 raw=flat(rows);nv=normalize(raw);close(cx(chain['raw']),raw,'contract');close(cx(chain['normalized']),nv,'normalize chain')
 close(chain['sumDiscarded'],total,'sum steps');close(chain['errorSquared'],norm2([x-y for x,y in zip(v,raw)]),'chain measured error');close(chain['errorSquared'],total,'nested error sum');close(chain['retainedNormSquared'],norm2(raw),'retained norm');close(chain['squaredFidelity'],abs(dot(v,nv))**2,'chain fidelity');close(cx(chain['projectionOverlap']),dot(v,raw),'projection overlap');close(dot(v,raw),norm2(raw),'nested projection');close(chain['normalizedDistanceSquared'],norm2([x-y for x,y in zip(v,nv)]),'normalized distance')
 if c['state']==5:
  p=[1-10**(-c['tailPower'])]+[10**(-c['tailPower'])/7]*7;mid=q['cuts'][2]
  for x,y in zip(mid['weights'],p):close(x,y,'positive tiny eigenweight',atol=0,rtol=1e-7)
  close(mid['discardedWeight'],sum(p[c['chi']:]),'positive tiny tail',atol=1e-29,rtol=1e-7)
  if c['chi']==1:close(chain['sumDiscarded'],10**(-c['tailPower']),'tiny chain error',atol=0,rtol=1e-7)
 J=c['couplingTenths']/10;h=c['fieldTenths']/10;before=obs(v,J,h,q['observables']['original']);after=obs(nv,J,h,q['observables']['compressed']);close(q['observables']['energyShift'],after-before,'energy shift');bound=2*(5*abs(J)+6*abs(h))*math.sqrt(total);close(q['observables']['energyShiftBound'],bound,'energy bound');assert abs(after-before)<=bound+1e-9
 close(q['comparison']['productOriginalCutFidelities'],math.prod(x['squaredFidelity']for x in q['cuts']),'product cut F2');close(q['comparison']['sumOriginalCutTails'],sum(x['discardedWeight']for x in q['cuts']),'original tail sum');close(q['comparison']['sumActualStepTails'],total,'actual tail sum')
 assert all(x is True for x in q['boundaries'].values())and len(q['boundaries'])==14
 return True

"""Independent view mapping for tensor203; no runtime calls."""
import math
def plots(s):
 w=s['selected']['weights'];keep=s['selected']['retained'];n=max(2,len(w));cuts=s['cuts'];chain=s['chain'];acc=0;cum=[]
 for p in chain['steps']:acc+=p['discardedWeight'];cum.append([p['cut'],acc])
 return[
 ('spectrum',[1,n],[[[i+1,p]if i<keep else None for i,p in enumerate(w)],[[i+1,p]if i>=keep else None for i,p in enumerate(w)]]),
 ('tail',[1,n],[[[i+1,math.log10(p)]if p>0 else None for i,p in enumerate(w)],[[1,-12],[n,-12]]]),
 ('cuts',[1,5],[[[p['cut'],p['entropy']]for p in cuts],[[i+1,math.log(r)]for i,r in enumerate(s['state']['knownExactRanks'])]if s['state']['knownExactRanks']else[],[[1,math.log(s['parameters']['chi'])],[5,math.log(s['parameters']['chi'])]]]),
 ('fidelity',[1,8],[[[p['chi'],p['squaredFidelity']]for p in s['chiScan']],[[p['chi'],p['retainedNormSquared']]for p in s['chiScan']]]),
 ('steps',[1,5],[[[p['cut'],p['discardedWeight']]for p in chain['steps']],cum,[[p['cut'],p['discardedWeight']]for p in cuts]]),
 ('energy',[1,8],[[[p['chi'],p['energy']]for p in s['chiScan']],[[1,s['observables']['original']['energy']],[8,s['observables']['original']['energy']]]])]
def tables(s):
 def entries(d):return[list(x)for x in d.items()]
 def nums(p,keys):return[p[k]for k in keys.split()]
 scalar=lambda d:[(k,v)for k,v in d.items()if k!='local']
 return[
 ('parameters',entries(s['parameters'])+[['态族',s['state']['name']],['自旋数N',6],['相位门','第j站点乘exp(i j θ sⱼ)，θ=步数×π/12'],['数值秩阈值',s['selected']['rankThreshold']],['熵单位','自然对数'],['复数格式','[实部, 虚部]']]),
 ('cuts',[[p['cut'],p['rows'],p['columns'],s['state']['knownExactRanks'][i]if s['state']['knownExactRanks']else None]+nums(p,'numericalRank entropy retained discardedWeight overlapAmplitude squaredFidelity errorSquared factorizationError orthogonalityError')for i,p in enumerate(s['cuts'])]),
 ('coefficients',[[i,j,z[0],z[1],z[0]**2+z[1]**2]for i,row in enumerate(s['selected']['coefficients'])for j,z in enumerate(row)]),
 ('spectrum',[[i+1,s['selected']['sigmas'][i],p,s['selected']['entanglementEnergies'][i],i<s['selected']['retained']]for i,p in enumerate(s['selected']['weights'])]),
 ('amplitudes',[[format(i,'06b'),z,s['selected']['normalized'][i],s['chain']['raw'][i],s['chain']['normalized'][i]]for i,z in enumerate(s['state']['amplitudes'])]),
 ('steps',[nums(p,'cut inputRows inputColumns leftDimension rightDimension incomingNormSquared discardedWeight retainedNormSquared leftCanonicalError')for p in s['chain']['steps']]),
 ('step-spectrum',[[p['cut'],i+1,v,i<p['rightDimension']]for p in s['chain']['steps']for i,v in enumerate(p['weights'])]),
 ('tensors',[[j+1,b,l,r,z[0],z[1]]for j,A in enumerate(s['chain']['tensors'])for b,M in enumerate(A)for l,row in enumerate(M)for r,z in enumerate(row)]),
 ('chi',[nums(p,'chi sumDiscarded errorSquared retainedNormSquared squaredFidelity energy variance tensorEntries maxCanonicalError')for p in s['chiScan']]),
 ('observables',[['原始态',k,v]for k,v in scalar(s['observables']['original'])]+[['全链近似',k,v]for k,v in scalar(s['observables']['compressed'])]+[['比较','能量变化',s['observables']['energyShift']],['比较','能量变化保守界',s['observables']['energyShiftBound']],['比较','原始切口F²乘积（一般不等于全链）',s['comparison']['productOriginalCutFidelities']],['比较','原始切口尾部之和',s['comparison']['sumOriginalCutTails']],['比较','实际步骤尾部之和',s['comparison']['sumActualStepTails']],['比较','原态与未归一化重建态内积',s['chain']['projectionOverlap']]]),
 ('local',[[format(p['basis'],'06b'),p['probability'],p['localEnergy'],p['residualWeight']]for p in s['observables']['original']['local']]),
 ('boundaries',entries(s['boundaries']))]

NODE="const fs=require('fs'),a=require(process.argv[1]),f=require(process.argv[2]);\nfunction replay(x,y,path='root'){if(typeof y==='number'){if(typeof x!=='number'||!Number.isFinite(x)||Math.abs(x-y)>3e-10+3e-9*Math.abs(y))throw Error('Replay '+path);}else if(y!==null&&typeof y==='object'){if(!x||typeof x!=='object'||Array.isArray(x)!==Array.isArray(y)||JSON.stringify(Object.keys(x))!==JSON.stringify(Object.keys(y)))throw Error('Replay keys '+path);for(const k of Object.keys(y))replay(x[k],y[k],path+'.'+k);}else if(x!==y)throw Error('Replay scalar '+path);}\nconst cases=a.PRESETS.map(p=>a.compute(p.parameters));\nlet invalid=0;for(const [key,[lo,hi]]of Object.entries(a.LIMITS)){cases.push(a.compute({[key]:lo}),a.compute({[key]:hi}));for(const v of[lo-1,hi+1,lo+.5,'1',null,true,NaN,Infinity]){let failed=false;try{a.compute({[key]:v});}catch(e){failed=true;}if(!failed)throw Error('Invalid accepted '+key);invalid++;}}\nfor(const v of[null,[],true,{unknown:1}]){let failed=false;try{a.compute(v);}catch(e){failed=true;}if(!failed)throw Error('Invalid object');invalid++;}\nconst observed=process.argv[3]?JSON.parse(fs.readFileSync(process.argv[3],'utf8')):[];\n// Node versions and browsers may choose different internal SVD gauges.\n// This comparison excludes only gauge-dependent tensor entries. The ORIGINAL\n// frozen and observed tensors remain in records and are independently checked\n// below for canonicality, step optimality and full-state contraction.\nfor(const r of [...f.records.map(x=>x.data),...observed]){\n const expected=a.compute(r.parameters);\n replay({...r,chain:{...r.chain,tensors:expected.chain.tensors}},expected);\n}\nlet feedback=0;for(let i=0;i<4;i++)for(let j=0;j<2;j++){if(a.feedback(i,j).correct!==(j===a.QUESTIONS[i][2]))throw Error('Feedback');feedback++;}\nconst records=[...cases,...f.records.map(r=>r.data),...observed].map(snapshot=>({snapshot,plots:a.plots(snapshot),tables:a.tables(snapshot),svgs:a.plots(snapshot).map(a.svg)}));\nconst chiCases=cases.flatMap(q=>Array.from({length:8},(_,i)=>a.compute({...q.parameters,chi:i+1})));\nlet replayGuards=0;const original=cases[0];for(const mutate of [q=>q.schema='wrong',q=>q.parameters.chi=99,q=>delete q.chain,q=>q.chain.squaredFidelity=null,q=>q.chain.squaredFidelity='0.5',q=>q.chain.squaredFidelity=NaN,q=>q.state.amplitudes.pop(),q=>q.boundaries.zeroVarianceNotGroundCertificate=false]){const q=JSON.parse(JSON.stringify(original));mutate(q);try{replay(q,original);}catch(e){replayGuards++;}}\nif(replayGuards!==8)throw Error('Replay guard');\n// Mount the actual runtime; check names before any reveal or numeric computation.\nfunction mountPresetNames(api){\n class E{\n  constructor(tag,doc){this.tag=tag;this.ownerDocument=doc;this.children=[];this.attrs={};this._text='';this.classList={add(){}};}\n  set textContent(v){this._text=String(v);this.children=[];}\n  get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}\n  append(...xs){this.children.push(...xs);}\n  replaceChildren(...xs){this._text='';this.children=[...xs];}\n  setAttribute(k,v){this.attrs[k]=String(v);}\n  getAttribute(k){return Object.hasOwn(this.attrs,k)?this.attrs[k]:null;}\n  removeAttribute(k){delete this.attrs[k];}\n  addEventListener(){}\n }\n const doc={createElement(t){return new E(t,this);},querySelector(){return null;}};doc.head=new E('head',doc);\n const root=new E('div',doc);api.mount(root);const all=[];function visit(e){if(e.getAttribute('data-preset')!==null)all.push(e);e.children.forEach(visit);}visit(root);\n if(all.length!==api.PRESETS.length)throw Error('Preset mount count');\n all.forEach((b,i)=>{const p=api.PRESETS[i],expected=p.name??p.label,name=(b.getAttribute('aria-label')||b.textContent).trim();if(typeof expected!=='string'||!expected.trim()||name!==expected||b.textContent.trim()!==expected)throw Error('Missing preset accessible name: '+p.id);});\n return all.length;\n}\nconst mountLabels=mountPresetNames(a);\nconst originalSource=require('fs').readFileSync(process.argv[1],'utf8'),needle='},p.name);';\nif(!originalSource.includes(needle))throw Error('Expected mounted name field');\nconst mutantSource=originalSource.replace(needle,'},p.label);'),sandbox={module:{exports:{}}};\nrequire('vm').runInNewContext(mutantSource,sandbox);let mountMutations=0;\ntry{mountPresetNames(sandbox.module.exports);}catch(e){mountMutations++;}\nif(mountMutations!==1)throw Error('Blank-label mutation not detected');\n\nconsole.log(JSON.stringify({records,chiCases,live:cases.length,frozen:f.records.length,observed:observed.length,invalid,feedback,replayGuards,mountLabels,mountMutations,self:a.selfTest()}));\n"
def deep(a,b,label='payload'):
 if isinstance(b,dict):
  assert isinstance(a,dict)and list(a)==list(b),(label,'keys')
  for k in b:deep(a[k],b[k],label+'.'+k)
 else:close(a,b,label)
def viewcheck(record):
 global coords,markers,ledgerRows
 s=record['snapshot'];expected=plots(s);assert len(record['plots'])==len(record['svgs'])==6
 for p,(key,domain,series),markup in zip(record['plots'],expected,record['svgs']):
  assert p['key']==key;close([p['xMin'],p['xMax']],domain,'x range');assert len(p['series'])==len(series)
  ys=[x[1]for line in series for x in line if x is not None];lo=min([0]+ys);hi=max([0]+ys)
  if hi==lo:hi=lo+1
  pad=.07*(hi-lo);close([p['yMin'],p['yMax']],[lo-pad,hi+pad],'y range')
  tree=ET.fromstring(markup);paths=tree.findall('.//{*}path');circles=tree.findall('.//{*}circle');assert len(paths)==len(series)
  assert tree.attrib['aria-label']==p['title'];mark=0
  for i,(line,wanted,path)in enumerate(zip(p['series'],series,paths)):
   close(line['points'],wanted,'plot scientific series');assert path.attrib['data-series']==str(i)
   commands=re.findall(r'([ML])([-+\deE.]+),([-+\deE.]+)',path.attrib['d']);points=[q for q in wanted if q is not None];assert len(commands)==len(points)
   pen=False;idx=0
   for q in wanted:
    if q is None:pen=False;continue
    kind,x,y=commands[idx];assert kind==('L'if pen else'M');pen=True;idx+=1
    X=100+(q[0]-domain[0])/(domain[1]-domain[0])*755;Y=385-(q[1]-p['yMin'])/(p['yMax']-p['yMin'])*290
    close([float(x),float(y)],[X,Y],'SVG path',atol=6e-7,rtol=0);coords+=2
    circle=circles[mark];mark+=1;close([float(circle.attrib['cx']),float(circle.attrib['cy']),float(circle.attrib['r'])],[X,Y,3.5+1.5*i],'SVG marker');markers+=1
    assert circle.attrib['stroke']==line['color']and circle.attrib['fill']==('none'if i>0 else line['color'])
  assert mark==len(circles)
 expected=tables(s);assert len(record['tables'])==12
 for t,(key,rows)in zip(record['tables'],expected):
  assert t['key']==key;close(t['rows'],rows,'complete table '+key);assert all(len(row)==len(t['headers'])for row in rows);ledgerRows+=len(rows)

if __name__=='__main__':
 import sys,json,hashlib,subprocess,shutil,re,copy
 import xml.etree.ElementTree as ET
 from pathlib import Path
 root=Path(__file__).resolve().parents[1];js=Path(sys.argv[1]).resolve()if len(sys.argv)>1 else root/'course-shared/labs/entanglement-cut.js';fixture=Path(sys.argv[2]).resolve()if len(sys.argv)>2 else root/'course-shared/projects/tensor-certificates/run-snapshot.json'
 f=json.loads(fixture.read_text());assert f['provenance']['sourceSha256']==hashlib.sha256(js.read_bytes()).hexdigest();assert len(f['records'])==6
 args=[str(js),str(fixture)]+([str(Path(sys.argv[3]).resolve())]if len(sys.argv)>3 else[]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
 result=json.loads(subprocess.check_output(prefix+['node','-e',NODE,*args],text=True));coords=markers=ledgerRows=0
 for record in result['records']:review(record['snapshot']);viewcheck(record)
 for q in result['chiCases']:review(q)
 for i,record in enumerate(result['records'][:result['live']]):
  for chi,q in enumerate(result['chiCases'][8*i:8*i+8],1):
   p=record['snapshot']['chiScan'][chi-1];chain=q['chain'];o=q['observables']['compressed']
   close([p[k]for k in ['chi','sumDiscarded','errorSquared','retainedNormSquared','squaredFidelity','energy','variance','tensorEntries','maxCanonicalError']],[chi,chain['sumDiscarded'],chain['errorSquared'],chain['retainedNormSquared'],chain['squaredFidelity'],o['energy'],o['variance'],chain['tensorEntries'],chain['maxCanonicalError']],'chi scan independent chain')
 mutations=0
 specimens={r['key']:r['data']for r in f['records']}
 edits=[('ghz',lambda q:q['chain'].__setitem__('squaredFidelity',1/32)),('ghz',lambda q:q['chain'].__setitem__('errorSquared',0)),('tiny',lambda q:q['cuts'][2]['weights'].__setitem__(7,0)),('tiny',lambda q:q['cuts'][2].__setitem__('discardedWeight',0)),('tiny',lambda q:q['chain'].__setitem__('sumDiscarded',0)),('entropy',lambda q:q['selected'].__setitem__('squaredFidelity',1)),('random',lambda q:q['state']['amplitudes'][0].__setitem__(1,0)),('random',lambda q:q['chain']['tensors'][1][0][0][0].__setitem__(0,1)),('random',lambda q:q['observables']['original'].__setitem__('variance',0)),('ghz',lambda q:q['boundaries'].__setitem__('zeroVarianceNotGroundCertificate',False))]
 for key,edit in edits:
  q=copy.deepcopy(specimens[key]);edit(q)
  try:review(q);deep(q['selected'],q['cuts'][q['parameters']['cut']-1],'selected copy')
  except(AssertionError,TypeError,ValueError,KeyError,ZeroDivisionError):mutations+=1
  else:raise AssertionError('Undetected mutation '+key)
 for record in result['records']:deep(record['snapshot']['selected'],record['snapshot']['cuts'][record['snapshot']['parameters']['cut']-1],'selected copy')
 assert result['mountLabels']==12 and result['mountMutations']==1 and result['replayGuards']==8 and result['invalid']==68 and result['feedback']==8
 print(json.dumps(dict(status='PASS',records=result['live'],frozen=result['frozen'],observed=result['observed'],chiReconstructions=len(result['chiCases']),checks=checks,plotCoordinates=coords,markers=markers,ledgerRows=ledgerRows,invalid=result['invalid'],feedback=result['feedback'],mutations=mutations,mountLabels=result['mountLabels'],mountMutations=result['mountMutations'],replayGuards=result['replayGuards'],self=result['self']['checks'])))
