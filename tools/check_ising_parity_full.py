#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Standard-library maximum-pivot diagonalization and positive-mode parity reference."""
import math,cmath,itertools
from functools import lru_cache
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
def dot(a,b):return math.fsum(x*y for x,y in zip(a,b))
def mv(A,v):return[dot(r,v)for r in A]
def norm(v):return math.sqrt(dot(v,v))
def zero(n):return[[0.]*n for _ in range(n)]
def parity(b):return 1 if b.bit_count()%2==0 else-1
def diagonalize(H):
 n=len(H);A=[r[:]for r in H];V=[[float(i==j)for j in range(n)]for i in range(n)]
 for iteration in range(120*n*n):
  magnitude,p,q=max((abs(A[i][j]),i,j)for i in range(n)for j in range(i+1,n))
  if magnitude<2e-14:break
  off=A[p][q];tau=(A[q][q]-A[p][p])/(2*off);t=math.copysign(1.,tau)/(abs(tau)+math.hypot(1,tau));c=1/math.sqrt(1+t*t);s=t*c;app=A[p][p];aqq=A[q][q]
  for k in range(n):
   if k!=p and k!=q:
    x=A[k][p];y=A[k][q];A[k][p]=A[p][k]=c*x-s*y;A[k][q]=A[q][k]=s*x+c*y
   x=V[k][p];y=V[k][q];V[k][p]=c*x-s*y;V[k][q]=s*x+c*y
  A[p][p]=app-t*off;A[q][q]=aqq+t*off;A[p][q]=A[q][p]=0.
 else:raise AssertionError('Reference Jacobi convergence')
 order=sorted(range(n),key=lambda i:A[i][i]);return[A[i][i]for i in order],[[r[i]for r in V]for i in order]
@lru_cache(None)
def block(L,g,p):
 basis=[b for b in range(2**L)if parity(b)==p];idx={b:i for i,b in enumerate(basis)};H=zero(len(basis))
 for col,b in enumerate(basis):
  H[col][col]=-g*sum(1-2*(b>>j&1)for j in range(L))
  for j in range(L):H[idx[b^(1<<j)^(1<<((j+1)%L))]][col]-=1
 E,V=diagonalize(H);return basis,H,E,V
def annihilate(b,j,creation=False):
 if bool(b>>j&1)==creation:return None
 return(b^(1<<j),(-1)**sum(b>>i&1 for i in range(j)))
def AB(b,j,B=False):return b^(1<<j),(-1)**sum(b>>i&1 for i in range(j))*(-1 if B and b>>j&1 else 1)
def jw(L,g,bs):
 actions=[];matrices=[zero(len(b[0]))for b in bs];indices=[{b:i for i,b in enumerate(t[0])}for t in bs]
 for b in range(2**L):
  pp=parity(b);si=0 if pp==1 else 1;col=indices[si][b];field=-g*(L-2*b.bit_count());matrices[si][col][col]=field;bonds=[]
  for j in range(L):
   k=(j+1)%L;x,a=AB(b,k);y,z=AB(x,j,True);BA=a*z;coefficient=(pp if j==L-1 else-1)*BA;matrices[si][indices[si][y]][col]+=coefficient;bonds.append(dict(j=j,k=k,output=y,BA=BA,spin=-1,jw=coefficient))
  actions.append(dict(state=b,ket=''.join(str(b>>j&1)for j in range(L)),parity=pp,field=field,bonds=bonds))
 records=[]
 for j in range(L):
  row=[]
  for b in range(2**L):
   q=annihilate(b,j);row.append(dict(input=b,state=q[0]if q else None,value=q[1]if q else 0))
  records.append(row)
 return dict(annihilation=records,actions=actions,fermionBlocks=matrices,car=[dict(j=j,k=k,anticommutatorAA=0,anticommutatorAdag=0)for j in range(L)for k in range(L)])
@lru_cache(None)
def free_energies(L,g,p):
 ks=[(2*m+(1 if p==1 else 0))*math.pi/L for m in range(L)];eps=[2*math.hypot(g-math.cos(k),math.sin(k))for k in ks]
 if p==-1:eps[0]=2*abs(g-1);eps[L//2]=2*(g+1)
 vacuum=-1 if p==-1 and g<1 else 1;base=-sum(eps)/2
 return sorted(base+sum(eps[j]for j in range(L)if m>>j&1)for m in range(2**L)if vacuum*parity(m)==p)
def modes(L,g,p):
 blocks=[]
 if p==-1:
  for k in [0,math.pi]:
   coefficient=2*(g-(1 if k==0 else-1));blocks.append(dict(kind='unpaired',k=k,coefficient=coefficient,choices=[dict(energy=-coefficient/2,parity=1,label='n=0'),dict(energy=coefficient/2,parity=-1,label='n=1')]))
 ks=[(2*m+1)*math.pi/L for m in range(L//2)]if p==1 else[2*m*math.pi/L for m in range(1,L//2)]
 for k in ks:
  e=2*math.sqrt(1+g*g-2*g*math.cos(k));blocks.append(dict(kind='paired',k=k,epsilon=e,choices=[dict(energy=-e,parity=1,label='paired lower'),dict(energy=0,parity=-1,label='single k'),dict(energy=0,parity=-1,label='single -k'),dict(energy=e,parity=1,label='paired upper')]))
 configurations=[]
 for choices in itertools.product(*[range(len(q['choices']))for q in blocks]):
  selected=[b['choices'][i]for b,i in zip(blocks,choices)];pp=math.prod(q['parity']for q in selected)
  if pp==p:configurations.append(dict(choices=list(choices),energy=sum(q['energy']for q in selected),parity=pp))
 return dict(parity=p,boundary='antiperiodic'if p==1 else'periodic',modeBlocks=blocks,unrestrictedCount=2**L,configurations=configurations,energies=free_energies(L,g,p))
def gaps(L,g,E,F):
 both=sorted(E+F);epsilon=2*math.hypot(g-math.cos(math.pi/L),math.sin(math.pi/L));return dict(ground=both[0],evenGround=E[0],oddGround=F[0],fullGap=both[1]-both[0],evenGap=E[1]-E[0],oddGap=F[1]-F[0],epsilon=epsilon,allowedEvenPair=2*epsilon,sectorSplitting=F[0]-E[0])
def operator(L,kind,site):
 A=zero(2**L);sites=[site]if kind<2 else range(L);f=1 if kind<2 else 1/L
 for b in range(2**L):
  for j in sites:
   if kind%2==0:A[b][b]+=f*(1-2*(b>>j&1))
   else:A[b^(1<<j)][b]+=f
 return dict(kind=kind,site=site,axis='Z'if kind%2==0 else'X',parity=1 if kind%2==0 else-1,normalization='local'if kind<2 else'sum divided by L',matrix=A)
def weights(O,psi,bs):
 v=mv(O,psi);mean=dot(psi,v);con=[x-mean*y for x,y in zip(v,psi)];lines=[]
 for pp,(basis,H,E,V)in zip([1,-1],bs):
  raw=[v[b]for b in basis];conn=[con[b]for b in basis];start=0
  while start<len(E):
   end=start+1
   while end<len(E)and abs(E[end]-E[start])<=1e-10:end+=1
   energy=math.fsum(E[start:end])/(end-start);lines.append(dict(parity=pp,energy=energy,gap=energy-bs[0][2][0],multiplicity=end-start,spread=E[end-1]-E[start],rawWeight=math.fsum(dot(V[i],raw)**2 for i in range(start,end)),weight=math.fsum(dot(V[i],conn)**2 for i in range(start,end))));start=end
 return dict(mean=mean,secondMoment=dot(v,v),variance=dot(con,con),rawWeightSum=math.fsum(q['rawWeight']for q in lines),weightSum=math.fsum(q['weight']for q in lines),groupTolerance=1e-10,applied=v,connected=con,lines=lines)
def spectrum(lines,J,eta,omega):
 z=complex(omega,eta);chi=sum(q['weight']*(1/(z+q['gap'])-1/(z-q['gap']))for q in lines)/J;S=math.fsum(2*eta*q['weight']/((omega-q['gap'])**2+eta*eta)for q in lines)/J;return dict(omega=J*omega,omegaOverJ=omega,S=S,chi=[chi.real,chi.imag])
def correlation(lines,J,t):
 z=sum(q['weight']*cmath.exp(-1j*q['gap']*t)for q in lines);return dict(time=t/J,Jt=t,C=[z.real,z.imag],commutatorResponse=-2*z.imag)
def area(lines,J,eta,W):
 def cumulative(x,d):return .5+math.atan2(x-d,eta)/math.pi
 parts=[2*math.pi*q['weight']*(cumulative(W,q['gap'])-cumulative(-W,q['gap']))for q in lines];return dict(W=J*W,WoverJ=W,parts=parts,value=math.fsum(parts),total=2*math.pi*math.fsum(q['weight']for q in lines))
def review(s):
 c=s['parameters'];L=4+2*c['sizeIndex'];g=c['fieldTwentieths']/20;J=c['energyTenths']/10;eta=c['etaHundredths']/100;omega=c['frequencyTenths']/10;tau=c['timeTenths']/10;W=c['bandTenths']/10;window=c['windowTenths']/10;bs=[block(L,g,p)for p in[1,-1]]
 close(s['model'],dict(L=L,g=g,J=J,h=J*g,eta=J*eta,omega=J*omega,time=tau/J,W=J*W,displayMinOmega=-J*window/4,displayMaxOmega=J*window,hbar=1,siteZeroLeastSignificant=True,evenGroundSelected=True,eachPeriodicBondOnce=True),'model')
 close(s['blocks'],[dict(parity=p,basis=b[0],matrix=b[1],energies=free_energies(L,g,p))for p,b in zip([1,-1],bs)],'complete matrix and free spectrum');close(s['jw'],jw(L,g,bs),'JW');close(s['fermion'],[modes(L,g,p)for p in[1,-1]],'Fock')
 v=bs[0][3][0];v=v if sum(v)>0 else[-x for x in v];psi=[0.]*(2**L)
 for b,x in zip(bs[0][0],v):psi[b]=x
 ground=dict(sector=1,energy=bs[0][2][0],reduced=v,vector=psi,norm=dot(v,v),residual=norm([x-bs[0][2][0]*y for x,y in zip(mv(bs[0][1],v),v)]));close(s['ground'],ground,'ground')
 summary=gaps(L,g,free_energies(L,g,1),free_energies(L,g,-1));physical={k:J*v for k,v in summary.items()};close(s['dimensionless'],summary);close(s['physical'],physical)
 obs=[]
 for kind in range(4):
  op=operator(L,kind,c['site']);obs.append(dict(**op,spectral=weights(op['matrix'],psi,bs)))
 close(s['observables'],obs,'all actual projectors and probes');lines=obs[c['operator']]['spectral']['lines'];close(s['current'],spectrum(lines,J,eta,omega));close(s['correlation'],correlation(lines,J,tau));close(s['area'],area(lines,J,eta,W))
 counts={'frequencyScan':3201,'timeScan':129,'bandScan':81,'fieldScan':81,'criticalScan':31}
 for k,n in counts.items():assert len(s[k])==n
 for i,q in enumerate(s['frequencyScan']):close(q,spectrum(lines,J,eta,window*(-.25+1.25*i/3200)),'frequency')
 for i,q in enumerate(s['timeScan']):close(q,correlation(lines,J,10*i/128),'time')
 for i,q in enumerate(s['bandScan']):close(q,area(lines,J,eta,(i+1)/2),'band')
 for i,q in enumerate(s['fieldScan']):
  gg=i/40;E=free_energies(L,gg,1);F=free_energies(L,gg,-1);close(q,dict(g=gg,even=E,odd=F,fermionEven=E,fermionOdd=F,**gaps(L,gg,E,F)),'full constrained scan')
 for i,q in enumerate(s['criticalScan']):
  n=4+2*i;x=math.pi/(2*n);gap=2*math.tan(x/2);eps=4*math.sin(x);ep=-2*math.fsum(math.sin((2*m+1)*x)for m in range(n));em=-2*math.fsum(math.sin(2*m*x)for m in range(n));close(q,dict(L=n,evenGround=ep,oddGround=em,fullGap=gap,epsilon=eps,evenGap=2*eps,Lgap=n*gap,Lepsilon=n*eps,LevenGap=2*n*eps,gapLimit=math.pi/2,epsilonLimit=2*math.pi,evenGapLimit=4*math.pi,method='exact critical finite sums'),'critical sums')
 close(s['unitComparison'],dict(J=J,energies=physical,spectrum=spectrum(lines,J,eta,omega),correlation=correlation(lines,J,tau),area=area(lines,J,eta,W),unitJ=dict(energies=summary,spectrum=spectrum(lines,1,eta,omega),correlation=correlation(lines,1,tau),area=area(lines,1,eta,W))),'units')
 keys=['periodicSpinNotAlwaysPeriodicFermion','parityProjectionAfterDiagonalization','signedUnpairedModesKept','fullSpectrumMultiplicityKept','threeGapDefinitionsSeparate','operatorWeightsActuallyComputed','connectedMeanSubtractionBeforeProjection','zeroEnergyFluctuationCanRemain','degenerateWeightsGrouped','finiteCatNotBrokenSymmetry','etaNotPhysicalBath','finiteScanNotUniversalityProof','allUnitsTransformed'];close(s['boundaries'],dict.fromkeys(keys,True),'boundaries')
 assert list(s)==['parameters','model','blocks','jw','fermion','ground','dimensionless','physical','observables','current','correlation','area',*counts,'unitComparison','boundaries']

def expected_plots(s):
 L=s['model']['L'];values=[
 ('gaps',[0,2],[[[q['g'],q[k]]for q in s['fieldScan']]for k in ['fullGap','evenGap','epsilon']]),
 ('levels',[0,2**(L-1)],[[[i,E-s['ground']['energy']]for i,E in enumerate(q['energies'])]for q in s['blocks']]),
 ('spectrum',[s['model']['displayMinOmega']/s['model']['J'],s['model']['displayMaxOmega']/s['model']['J']],[[[q['omegaOverJ'],q['S']]for q in s['frequencyScan']],[[q['omegaOverJ'],q['chi'][1]]for q in s['frequencyScan']]]),
 ('weights',[0,2*math.ceil(max([1]+[t['gap']for q in s['observables']for t in q['spectral']['lines']])/2)],[[[t['gap'],t['weight']]for t in q['spectral']['lines']if t['parity']==q['parity']]for q in s['observables']]),
 ('time',[0,10],[[[q['Jt'],q['C'][i]]for q in s['timeScan']]for i in [0,1]]+[[[q['Jt'],q['commutatorResponse']]for q in s['timeScan']]]),
 ('critical',[4,64],[[[q['L'],q[k]]for q in s['criticalScan']]for k in ['Lgap','Lepsilon','LevenGap']]+[[[4,x],[64,x]]for x in [math.pi/2,2*math.pi,4*math.pi]])]
 out=[]
 for key,domain,series in values:
  ys=[p[1]for line in series for p in line if p is not None];lo=min([0]+ys);hi=max([0]+ys)
  if lo==hi:hi=lo+1
  pad=.07*(hi-lo);out.append((key,domain,[lo-pad,hi+pad],series))
 return out
def expected_tables(s):
 at=lambda q,ks:[q[k]for k in ks];names=['局部Z','局部X','平均Z','平均X'];sel=s['observables'][s['parameters']['operator']]['spectral']
 return[
 ('parameters',[[g,k,v]for g,q in [('控件',s['parameters']),('模型',s['model'])]for k,v in q.items()]),
 ('matrices',[['H/J',b['parity'],j,b['basis'][j],r,s['jw']['fermionBlocks'][i][j]]for i,b in enumerate(s['blocks'])for j,r in enumerate(b['matrix'])]+[[names[o['kind']],o['parity'],j,j,r,None]for o in s['observables']for j,r in enumerate(o['matrix'])]),
 ('ground',[[q['state'],q['ket'],q['parity'],s['ground']['vector'][q['state']],sel['applied'][q['state']],sel['connected'][q['state']]]for q in s['jw']['actions']]),
 ('jw',[[q['state'],q['ket'],q['parity'],q['field'],[at(b,['j','k','output','BA','spin','jw'])for b in q['bonds']]]for q in s['jw']['actions']]),
 ('car',[at(q,['j','k','anticommutatorAA','anticommutatorAdag'])for q in s['jw']['car']]),
 ('modes',[[f['parity'],f['boundary'],q['kind'],q['k'],q.get('coefficient'),q.get('epsilon'),[at(x,['energy','parity','label'])for x in q['choices']]]for f in s['fermion']for q in f['modeBlocks']]),
 ('fock',[[f['parity'],i,q['choices'],q['energy'],q['energy']*s['model']['J']]for f in s['fermion']for i,q in enumerate(f['configurations'])]),
 ('levels',[[b['parity'],i,E,s['fermion'][k]['energies'][i],E-s['fermion'][k]['energies'][i],E-s['ground']['energy']]for k,b in enumerate(s['blocks'])for i,E in enumerate(b['energies'])]),
 ('moments',[[names[q['kind']],q['parity'],*at(q['spectral'],['mean','secondMoment','variance','rawWeightSum','weightSum'])]for q in s['observables']]),
 ('weights',[[names[q['kind']],*at(t,['parity','energy','gap','multiplicity','spread','rawWeight','weight'])]for q in s['observables']for t in q['spectral']['lines']]),
 ('frequency',[[q['omega'],q['omegaOverJ'],q['S'],*q['chi']]for q in s['frequencyScan']]),
 ('time',[[q['time'],q['Jt'],*q['C'],q['commutatorResponse']]for q in s['timeScan']]),
 ('field',[at(q,['g','even','odd','fermionEven','fermionOdd','fullGap','evenGap','epsilon'])for q in s['fieldScan']]),
 ('critical',[at(q,['L','evenGround','oddGround','fullGap','epsilon','evenGap','Lgap','Lepsilon','LevenGap','method'])for q in s['criticalScan']]),
 ('band',[at(q,['W','WoverJ','parts','value','total'])for q in s['bandScan']]),
 ('units',[['J',s['model']['J'],1]]+[[k,s['physical'][k],s['dimensionless'][k]]for k in s['physical']]+[['频率',s['current']['omega'],s['unitComparison']['unitJ']['spectrum']['omega']],['S',s['current']['S'],s['unitComparison']['unitJ']['spectrum']['S']],['χ',s['current']['chi'],s['unitComparison']['unitJ']['spectrum']['chi']],['物理时间',s['correlation']['time'],s['unitComparison']['unitJ']['correlation']['time']],['C(t)',s['correlation']['C'],s['unitComparison']['unitJ']['correlation']['C']],['带宽',s['area']['W'],s['unitComparison']['unitJ']['area']['W']],['带内谱面积',s['area']['value'],s['unitComparison']['unitJ']['area']['value']],['归一化误差',s['ground']['norm']-1,None],['偶基态残差/J',s['ground']['residual'],None],['简并分组阈值/J',sel['groupTolerance'],None]]),
 ('boundaries',[list(q)for q in s['boundaries'].items()])]

NODE="const fs=require('fs'),a=require(process.argv[1]),f=require(process.argv[2]);\nfunction replay(x,y,path='root'){if(typeof y==='number'){if(typeof x!=='number'||!Number.isFinite(x)||Math.abs(x-y)>3e-11+5e-10*Math.abs(y))throw Error('Replay '+path);}else if(y!==null&&typeof y==='object'){if(!x||typeof x!=='object'||Array.isArray(x)!==Array.isArray(y)||JSON.stringify(Object.keys(x))!==JSON.stringify(Object.keys(y)))throw Error('Replay keys '+path);for(const k of Object.keys(y))replay(x[k],y[k],path+'.'+k);}else if(x!==y)throw Error('Replay scalar '+path);}\nconst cases=a.PRESETS.map(p=>a.compute(p.parameters));let invalid=0;\nfor(const[k,[lo,hi]]of Object.entries(a.LIMITS)){cases.push(a.compute({[k]:lo}),a.compute({[k]:hi}));for(const v of[lo-1,hi+1,lo+.5,'1',null,true,NaN,Infinity]){let bad=false;try{a.compute({[k]:v})}catch(e){bad=true}if(!bad)throw Error('Invalid accepted '+k);invalid++;}}\nfor(const v of[null,[],true,{unknown:1}]){let bad=false;try{a.compute(v)}catch(e){bad=true}if(!bad)throw Error('Bad object');invalid++;}\nfor(const r of f.records)replay(r.data,a.compute(r.data.parameters));\nconst observed=process.argv[3]?JSON.parse(fs.readFileSync(process.argv[3],'utf8')):[];for(const q of observed)replay(q,a.compute(q.parameters));\nlet feedback=0;for(let i=0;i<4;i++)for(let j=0;j<2;j++){if(a.feedback(i,j).correct!==(j===a.QUESTIONS[i][2]))throw Error('Feedback');feedback++;}\nconst snapshots=[...cases,...f.records.map(r=>r.data),...observed];const records=snapshots.map(snapshot=>({snapshot,plots:a.plots(snapshot),tables:a.tables(snapshot),svgs:a.plots(snapshot).map(a.svg)}));\nlet replayGuards=0;for(const change of[q=>q.schema='wrong',q=>q.parameters.sizeIndex=99,q=>delete q.fermion,q=>q.model.g='0',q=>q.current.chi[0]=NaN,q=>q.frequencyScan.pop(),q=>q.boundaries.parityProjectionAfterDiagonalization=false,q=>q.blocks[0].matrix=null]){const q=JSON.parse(JSON.stringify(cases[0]));change(q);try{replay(q,cases[0])}catch(e){replayGuards++;}}if(replayGuards!==8)throw Error('Replay guard');\nlet mountControls=0;\nfunction mountPresetNames(api){class E{constructor(tag,doc){this.tag=tag;this.ownerDocument=doc;this.children=[];this.attrs={};this._text='';this.classList={add(){}};}set textContent(v){this._text=String(v);this.children=[];}get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}append(...xs){this.children.push(...xs);}replaceChildren(...xs){this._text='';this.children=[...xs];}setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return Object.hasOwn(this.attrs,k)?this.attrs[k]:null;}removeAttribute(k){delete this.attrs[k];}addEventListener(){}}const doc={createElement(t){return new E(t,this)},querySelector(){return null}};doc.head=new E('head',doc);const root=new E('div',doc);api.mount(root);const all=[];function visit(e){if(e.getAttribute('data-preset')!==null)all.push(e);e.children.forEach(visit)}visit(root);if(all.length!==api.PRESETS.length)throw Error('Preset count');all.forEach((b,i)=>{const name=api.PRESETS[i].name;if(typeof name!=='string'||!name.trim()||b.textContent.trim()!==name)throw Error('Missing name')});function checkControls(c){const labels=[];function walk(e){if(e.tag==='label'&&e.children.some(x=>x.tag==='input'))labels.push(e);e.children.forEach(walk)}walk(root);if(labels.length!==10)throw Error('Control count');for(const label of labels){const field=label.children.find(e=>e.tag==='input'),output=label.children.find(e=>e.tag==='output'),k=field.getAttribute('data-field'),v=c[k],expected=k==='sizeIndex'?String(4+2*v):k==='operator'?['局部Z','局部X','平均Z','平均X'][v]:String(v/(k==='fieldTwentieths'?20:k==='etaHundredths'?100:k==='site'?1:10));if(output.textContent!==expected||field.getAttribute('aria-valuetext')!==expected)throw Error('Physical control value '+k);mountControls++;}}checkControls(api.DEFAULTS);all.forEach((b,i)=>{b.onclick();checkControls(api.config(api.PRESETS[i].parameters));});return all.length;}\nconst mountLabels=mountPresetNames(a),source=fs.readFileSync(process.argv[1],'utf8'),needle='},p.name);';if(!source.includes(needle))throw Error('Name field');const sandbox={module:{exports:{}}};require('vm').runInNewContext(source.replace(needle,'},p.label);'),sandbox);let mountMutations=0;try{mountPresetNames(sandbox.module.exports)}catch(e){mountMutations++;}if(mountMutations!==1)throw Error('Name mutation');\nconst controlSandbox={module:{exports:{}}},controlNeedle='o.textContent=controlText(k,c[k]);';if(!source.includes(controlNeedle))throw Error('Control output expression');require('vm').runInNewContext(source.replace(controlNeedle,'o.textContent=fmt(c[k]);'),controlSandbox);let controlMutations=0;try{mountPresetNames(controlSandbox.module.exports)}catch(e){controlMutations++;}if(controlMutations!==1)throw Error('Control mutation');\nconsole.log(JSON.stringify({mountControls,controlMutations,records,live:cases.length,frozen:f.records.length,observed:observed.length,invalid,feedback,replayGuards,mountLabels,mountMutations,self:a.selfTest()}));\n"
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
 assert len(record['tables'])==17

if __name__=='__main__':
 import sys,json,hashlib,subprocess,shutil,re,copy
 import xml.etree.ElementTree as ET
 from pathlib import Path
 root=Path(__file__).resolve().parents[1];js=Path(sys.argv[1]).resolve()if len(sys.argv)>1 else root/'course-shared/labs/scalar-ising-parity.js';fixture=Path(sys.argv[2]).resolve()if len(sys.argv)>2 else root/'course-shared/projects/ising-parity-certificates/run-snapshot.json'
 f=json.loads(fixture.read_text());assert f['provenance']['sourceSha256']==hashlib.sha256(js.read_bytes()).hexdigest();assert len(f['records'])==6
 args=[str(js),str(fixture)]+([str(Path(sys.argv[3]).resolve())]if len(sys.argv)>3 else[]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
 result=json.loads(subprocess.check_output(prefix+['node','-e',NODE,*args],text=True));coords=markers=ledgerRows=0
 for r in result['records']:review(r['snapshot']);viewcheck(r)
 specimens={r['key']:r['data']for r in f['records']};mutations=0
 edits=[
 ('default',lambda q:q['blocks'][0]['matrix'][0].__setitem__(0,0)),
 ('default',lambda q:q['jw']['actions'][0]['bonds'][-1].__setitem__('BA',1)),
 ('default',lambda q:q['jw']['car'][0].__setitem__('anticommutatorAdag',1)),
 ('default',lambda q:q['fermion'][0].__setitem__('boundary','periodic')),
 ('default',lambda q:q['fermion'][1]['configurations'][0].__setitem__('parity',1)),
 ('ordered',lambda q:q['fermion'][1]['modeBlocks'][0].__setitem__('coefficient',2)),
 ('default',lambda q:q['dimensionless'].__setitem__('fullGap',q['dimensionless']['epsilon'])),
 ('default',lambda q:q['dimensionless'].__setitem__('evenGap',q['dimensionless']['epsilon'])),
 ('default',lambda q:q['ground']['vector'].__setitem__(0,0)),
 ('ordered',lambda q:q['observables'][1]['spectral'].__setitem__('variance',0)),
 ('ordered',lambda q:max(q['observables'][1]['spectral']['lines'],key=lambda t:t['weight']).__setitem__('weight',0)),
 ('default',lambda q:q['observables'][0]['spectral'].__setitem__('weightSum',q['observables'][0]['spectral']['secondMoment'])),
 ('collectivex',lambda q:q['observables'][3]['matrix'][0].__setitem__(1,1)),
 ('default',lambda q:q['current']['chi'].__setitem__(1,-q['current']['chi'][1])),
 ('ordered',lambda q:q['correlation']['C'].__setitem__(0,0)),
 ('narrow',lambda q:q['area'].__setitem__('value',q['area']['total'])),
 ('default',lambda q:q['frequencyScan'][100].__setitem__('S',0)),
 ('critical6',lambda q:q['fieldScan'][40]['fermionOdd'].__setitem__(0,0)),
 ('default',lambda q:q['criticalScan'][0].__setitem__('gapLimit',2*math.pi)),
 ('default',lambda q:q['boundaries'].__setitem__('zeroEnergyFluctuationCanRemain',False))]
 for key,edit in edits:
  q=copy.deepcopy(specimens[key]);edit(q)
  try:review(q)
  except(AssertionError,TypeError,KeyError,ValueError,ZeroDivisionError):mutations+=1
  else:raise AssertionError('Undetected mutation '+key)
 assert result['mountControls']==130 and result['controlMutations']==1
 assert result['invalid']==84 and result['feedback']==8 and result['mountLabels']==12 and result['mountMutations']==1 and result['replayGuards']==8
 print(json.dumps(dict(status='PASS',records=result['live'],frozen=result['frozen'],observed=result['observed'],checks=checks,plotCoordinates=coords,markers=markers,ledgerRows=ledgerRows,invalid=result['invalid'],feedback=result['feedback'],mutations=mutations,mountControls=result['mountControls'],controlMutations=result['controlMutations'],mountLabels=result['mountLabels'],mountMutations=result['mountMutations'],replayGuards=result['replayGuards'],self=result['self']['checks'])))
