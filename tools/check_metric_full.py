#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Native complex matrices and invariant secular polynomial reference, no NumPy."""
import math,cmath
checks=0
def close(a,b,label='',atol=3e-9,rtol=3e-8):
 global checks
 if isinstance(b,(list,tuple)):
  assert isinstance(a,(list,tuple)) and len(a)==len(b),(label,'shape')
  for x,y in zip(a,b):close(x,y,label,atol,rtol)
 elif isinstance(b,dict):
  assert isinstance(a,dict)and list(a)==list(b),(label,'keys')
  for k in b:close(a[k],b[k],label+'.'+k,atol,rtol)
 elif b is None:assert a is None,(label,a,b)
 elif isinstance(b,(str,bool)):assert type(a)==type(b)and a==b,(label,a,b)
 else:assert type(a)in(int,float,complex)and math.isfinite(abs(a))and abs(a-b)<=atol+rtol*abs(b),(label,a,b)
 checks+=1
def z(x):return complex(*x)
def mat(x):return[[z(v)for v in r]for r in x]
def vec(x):return list(map(z,x))
def eye(n):return[[complex(i==j)for j in range(n)]for i in range(n)]
def dag(A):return[[A[i][j].conjugate()for i in range(len(A))]for j in range(len(A[0]))]
def mv(A,v):return[sum(x*y for x,y in zip(r,v))for r in A]
def mm(A,B):return[[sum(A[i][k]*B[k][j]for k in range(len(B)))for j in range(len(B[0]))]for i in range(len(A))]
def inn(a,b):return sum(x.conjugate()*y for x,y in zip(a,b))
def norm(v):return math.sqrt(sum(abs(x)**2 for x in v))
def scale(A,t):return[[x*t for x in r]for r in A]
def add(A,B):return[[x+y for x,y in zip(r,s)]for r,s in zip(A,B)]
def sub(A,B):return add(A,scale(B,-1))
def outer(v):return[[x*y.conjugate()for y in v]for x in v]
def tr(A):return sum(A[i][i]for i in range(len(A))).real
def det(A):return(A[0][0]*A[1][1]-A[0][1]*A[1][0]).real
def spectrum(A):
 if len(A)==1:return[A[0][0].real]
 t=tr(A)/2;r=math.sqrt(((A[0][0].real-A[1][1].real)/2)**2+abs(A[0][1])**2);return[t-r,t+r]
def trig(d):
 k=d%360;h=math.sqrt(.5);special={0:(1.,0.),45:(h,h),90:(0.,1.),135:(-h,h),180:(-1.,0.),225:(-h,-h),270:(0.,-1.),315:(h,-h)}
 return special[k]if k in special else(math.cos(math.radians(d)),math.sin(math.radians(d)))
def reference(c):
 t,s=trig(c['theta']);u,v=trig(c['beta']);d=10.**c['scalePower'];phi=cmath.exp(1j*c['gaugePhase']*math.pi/4);shift=c['shiftTenths']/10;lam=c['lambdaTenths']/10;mu=c['muTenths']/10
 H=scale(eye(4),shift)
 for i,x in enumerate([-1,.4,.8,1]):H[i][i]+=x
 H[0][3]=H[3][0]=-lam;H[1][2]=-1j*mu;H[2][1]=1j*mu
 Q=[[u,0],[v,0],[0,v],[0,u]];R=[[d,t*phi],[0,s/d]];W=mm(Q,R);N=mm(dag(W),W);A=mm(mm(dag(W),H),W);K=mm(mm(dag(Q),H),Q);delta=s*s;large=(tr(N)+math.sqrt((N[0][0].real-N[1][1].real)**2+4*abs(N[0][1])**2))/2;small=delta/large;rank=1 if c['theta']==0 else 2
 full=sorted([shift-math.sqrt(1+lam*lam),shift+math.sqrt(1+lam*lam),shift+.6-math.sqrt(.04+mu*mu),shift+.6+math.sqrt(.04+mu*mu)])
 return dict(H=H,Q=Q,R=R,W=W,N=N,A=A,K=K,delta=delta,ns=[small,large],rank=rank,full=full,exact=K[0][0].real if rank==1 else spectrum(K)[0])
def generalized_spectrum(m,eta):
 # det(A-e(N+eta I)) from basis-independent invariants. This does not
 # diagonalize the runtime whitening matrix or use its candidate vector.
 a=m['delta']+eta*tr(m['N'])+eta*eta;b=m['delta']*tr(m['K'])+eta*tr(m['A']);c=m['delta']*det(m['K'])
 if eta==0:return[m['exact']]if m['rank']==1 else spectrum(m['K'])
 disc=max(0,b*b-4*a*c);q=.5*(b+math.copysign(math.sqrt(disc),b))
 return[0.,0.]if q==0 else sorted([q/a,c/q])
def threshold_energy(m,tau):
 keep=2 if m['rank']==2 and m['ns'][0]>tau*m['ns'][1]else 1
 if keep==2:return keep,m['exact']
 P=scale(sub(m['N'],scale(eye(2),m['ns'][0])),1/(m['ns'][1]-m['ns'][0]));rho=mm(mm(m['W'],P),dag(m['W']));return 1,tr(mm(m['H'],rho))/tr(rho)
def physical(q,m):
 a=vec(q['coordinate']);raw=mv(m['W'],a);n=inn(raw,raw).real;num=inn(raw,mv(m['H'],raw)).real;close(vec(q['raw']),raw);close(q['norm'],n);close(q['numerator'],num)
 if q['exactNull']or n==0:
  close(n,0,atol=1e-22);assert all(q[k]is None for k in ['energy','state','projector','residual']);return
 v=vec(q['state']);close(norm(v),1);close(mat(q['projector']),outer(v));close(mat(q['projector']),scale(outer(raw),1/n));E=inn(v,mv(m['H'],v)).real;close(q['energy'],E);close(q['residual'],norm([x-E*y for x,y in zip(mv(m['H'],v),v)]));assert E>=m['full'][0]-1e-8
def solve(q,m):
 eta=q['eta'];tau=q['cutoff'];M=add(m['N'],scale(eye(2),eta));rank,E=threshold_energy(m,tau)if eta==0 else(2,generalized_spectrum(m,eta)[0]);values=generalized_spectrum(m,eta)if eta else([E]if rank==1 else spectrum(m['K']));close(q['objectiveSpectrum'],values);close(q['objective'],E);assert q['rank']==rank
 indices=[0,1]if rank==2 else[1];close(q['keptIndices'],indices);close(q['normEigenvalues'],[x+eta for x in m['ns']]);S=mat(q['basis']);close(mm(mm(dag(S),M),S),eye(rank));close(mat(q['whitenedMetric']),eye(rank));B=mm(mm(dag(S),m['A']),S);close(mat(q['whitenedHamiltonian']),B);close(spectrum(B),values)
 if rank==1:
  v=[r[0]for r in S];close(mv(m['N'],v),[m['ns'][1]*x for x in v])
 physical(q['candidate'],m);a=vec(q['candidate']['coordinate']);close(q['metricNorm'],inn(a,mv(M,a)).real);res=[x-q['objective']*y for x,y in zip(mv(m['A'],a),mv(M,a))];close(q['generalizedResidual'],norm(res));close(mv(dag(S),res),[0]*rank,atol=1e-7)
 if q['candidate']['exactNull']:assert eta>0 and m['rank']==1 and m['K'][0][0].real>=0
 elif eta==0:close(q['candidate']['energy'],E)
 else:
  aN=inn(a,mv(m['N'],a)).real;close(q['candidate']['energy'],q['objective']*q['metricNorm']/aN)
def compact(q,c):
 m=reference(c);tau=0 if c['cutoffLevel']==0 else 10.**(c['cutoffLevel']-9);eta=0 if c['regularizerLevel']==0 else 10.**(c['regularizerLevel']-6);rank,E=threshold_energy(m,tau);close(q['theta'],c['theta']);close(q['beta'],c['beta']);close(q['shift'],c['shiftTenths']/10);close(q['rank'],m['rank']);close(q['normEigenvalues'],m['ns']);close(q['conditionN'],None if m['rank']==1 else m['ns'][1]/m['ns'][0]);close(q['exact'],m['exact']);close(q['fullGround'],m['full'][0]);close(q['ordinary'],spectrum(m['A'])[0]);close(q['thresholdRank'],rank);close(q['thresholdEnergy'],E);close(q['eta'],eta);close(q['regularized'],generalized_spectrum(m,eta)[0]);isnull=eta>0 and m['rank']==1 and m['K'][0][0].real>=0;close(q['regularizedNull'],isnull)
 # The compact ledger keeps candidate energies. Recover them from the
 # spectral projector of the ordinary or generalized two-dimensional problem.
 lo,hi=spectrum(m['A'])
 if m['rank']==1 and m['K'][0][0].real>=0:wrong=None
 else:
  P=scale(sub(scale(eye(2),hi),m['A']),1/(hi-lo));rho=mm(mm(m['W'],P),dag(m['W']));wrong=tr(mm(m['H'],rho))/tr(rho)
 close(q['ordinaryPhysical'],wrong)
 if isnull:close(q['regularizedPhysical'],None)
 elif not eta:close(q['regularizedPhysical'],m['exact'])
 else:
  # For a simple eigenvalue, implicit differentiation w.r.t. the physical
  # energy shift gives a†Na / a†(N+eta I)a. Ephysical=objective/derivative.
  ev=q['regularized'];aa=m['delta']+eta*tr(m['N'])+eta*eta;bb=m['delta']*tr(m['K'])+eta*tr(m['A']);bp=2*m['delta']+eta*tr(m['N']);cp=m['delta']*tr(m['K']);der=(bp*ev-cp)/(2*aa*ev-bb)
  if abs(ev)>1e-12 and abs(der)>1e-12:close(q['regularizedPhysical'],ev/der)
  else:
   # At an exact zero of the objective in full rank, numerator is zero too.
   close(q['regularizedPhysical'],0 if m['rank']==2 else m['exact'])
def review(s):
 c=s['parameters'];m=reference(c);q=s['model']
 for name,key in [('H','H'),('Q','Q'),('R','R'),('W','W'),('N','N'),('Heff','A'),('K','K')]:close(mat(q[name]),m[key],name)
 for key,value in dict(theta=c['theta'],beta=c['beta'],lambda_=c['lambdaTenths']/10,mu=c['muTenths']/10,shift=c['shiftTenths']/10,scale=10.**c['scalePower'],gaugePhase=c['gaugePhase']*math.pi/4,rank=m['rank'],conditionN=None if m['rank']==1 else m['ns'][1]/m['ns'][0],conditionW=None if m['rank']==1 else math.sqrt(m['ns'][1]/m['ns'][0]),determinantN=m['delta'],physicalSpectrum=m['full'],fullGround=m['full'][0]).items():close(q['lambda'if key=='lambda_'else key],value,key)
 close(q['normSpectrum']['values'],m['ns']);V=dag([vec(v)for v in q['normSpectrum']['vectors']]);close(mm(dag(V),V),eye(2))
 for i,v in enumerate(q['normSpectrum']['vectors']):v=vec(v);close(mv(m['N'],v),[m['ns'][i]*x for x in v])
 physical(s['exact'],m);close(s['exact']['energy'],m['exact']);close(s['exact']['allowedGround'],m['exact']);close(s['exact']['variationalExcess'],m['exact']-m['full'][0]);close(s['exact']['subspaceSpectrum'],[m['exact']]if m['rank']==1 else spectrum(m['K']));a=vec(s['exact']['coordinate']);close(vec(s['exact']['canonicalCoordinate']),mv(m['R'],a));res=[x-s['exact']['energy']*y for x,y in zip(mv(m['A'],a),mv(m['N'],a))];close(s['exact']['generalizedResidual'],norm(res));close(norm(res),0,atol=1e-7)
 close(s['ordinary']['spectrum'],spectrum(m['A']));close(s['ordinary']['reported'],spectrum(m['A'])[0]);physical(s['ordinary']['candidate'],m);a=vec(s['ordinary']['candidate']['coordinate']);close(norm(a),1);close(mv(m['A'],a),[s['ordinary']['reported']*x for x in a])
 tau=0 if c['cutoffLevel']==0 else 10.**(c['cutoffLevel']-9);eta=0 if c['regularizerLevel']==0 else 10.**(c['regularizerLevel']-6);close(s['cutoff'],tau);close(s['eta'],eta)
 for key,t,e in [('support',0,0),('threshold',tau,0),('regularized',0,eta)]:close(s[key]['cutoff'],t);close(s[key]['eta'],e);solve(s[key],m)
 physical(s['candidate'],m);a=vec(s['candidate']['coordinate']);t,u=trig(c['candidateAngle']/2);close(a,[t,u*cmath.exp(1j*c['candidatePhase']*math.pi/4)]);close(s['candidate']['euclideanNorm'],1);close(s['candidate']['metricNorm'],inn(a,mv(m['N'],a)).real);close(s['candidate']['coordinateNumerator'],inn(a,mv(m['A'],a)).real)
 for key,field,values in [('thetaScan','theta',range(91)),('subspaceScan','beta',range(91)),('shiftScan','shiftTenths',range(-20,21))]:
  assert len(s[key])==len(values)
  for v,q in zip(values,s[key]):compact(q,{**c,field:v})
 for key in ['cutoffScan','etaScan']:
  assert len(s[key])==9
  for i,q in enumerate(s[key]):
   close(q['level'],i);close(q['cutoff'],(0 if i==0 else 10.**(i-9))if key=='cutoffScan'else 0);close(q['eta'],(0 if i==0 else 10.**(i-6))if key=='etaScan'else 0);solve(q,m)
 assert len(s['ellipse'])==361
 for i,q in enumerate(s['ellipse']):
  close(q['degrees'],i);v=vec(q['direction']);close(v,trig(i));n=norm(mv(m['W'],v))**2;close(q['metricNorm'],n)
  if q['unit']is None:close(n,0,atol=1e-22);assert q['physical']is None
  else:
   u=vec(q['unit']);close([x*math.sqrt(n)for x in u],v);close(vec(q['physical']),mv(m['W'],u));close(norm(mv(m['W'],u)),1)
 assert len(s['boundaries'])==12 and all(s['boundaries'].values())

def display_control(k,v):
 def number(x):
  if x==int(x)and abs(x)<1e6:return str(int(x))
  if abs(x)<1e-4 or abs(x)>=1e5:
   a,b=format(x,'.5e').split('e');return a+'e'+('+'if int(b)>=0 else'-')+str(abs(int(b)))
  return format(float(format(x,'.7g')),'.15g')
 if k=='cutoffLevel':return'关闭（tau=0）'if v==0 else number(10.**(v-9))
 if k=='regularizerLevel':return'关闭（eta=0）'if v==0 else number(10.**(v-6))
 if k=='scalePower':return'd='+number(10.**v)+'，1/d='+number(10.**(-v))
 if k in ['gaugePhase','candidatePhase']:return str(v)+'π/4'
 return number(v/10 if k in ['lambdaTenths','muTenths','shiftTenths']else v)
def expected_plots(s):
 points=lambda rows,x,y:[None if q[y]is None else[q[x],q[y]]for q in rows]
 ellipse=[None if q['unit']is None else[q['unit'][0][0],q['unit'][1][0]]for q in s['ellipse']];span=max([1]+[abs(x)for p in ellipse if p is not None for x in p])
 values=[
 ('theta',[0,90],[[[q['theta'],q['exact']]if q['theta']else None for q in s['thetaScan']],points(s['thetaScan'],'theta','ordinary'),points(s['thetaScan'],'theta','ordinaryPhysical'),[[0,s['thetaScan'][0]['exact']]]]),
 ('condition',[0,90],[[None if q['conditionN']is None else[q['theta'],f*math.log10(q['conditionN'])]for q in s['thetaScan']]for f in [1,.5]]),
 ('subspace',[0,90],[points(s['subspaceScan'],'beta',key)for key in ['exact','fullGround','ordinaryPhysical']]),
 ('cutoff',[0,8],[[[q['level'],q['candidate']['energy']]for q in s['cutoffScan']],[[0,s['exact']['energy']],[8,s['exact']['energy']]]]),
 ('eta',[0,8],[[[q['level'],q['objective']]for q in s['etaScan']],[None if q['candidate']['energy']is None else[q['level'],q['candidate']['energy']]for q in s['etaScan']],[[0,s['exact']['energy']],[8,s['exact']['energy']]]]),
 ('shift',[-2,2],[points(s['shiftScan'],'shift',key)for key in ['exact','regularized','regularizedPhysical','ordinary']]),
 ('ellipse',[-1.07*span*755/290,1.07*span*755/290],[ellipse,[[q['direction'][0][0],q['direction'][1][0]]for q in s['ellipse']]])]
 out=[]
 for key,domain,series in values:
  ys=[p[1]for line in series for p in line if p is not None];lo=min([0]+ys);hi=max([0]+ys)
  if lo==hi:hi=lo+1
  pad=.07*(hi-lo);yrange=[-1.07*span,1.07*span]if key=='ellipse'else[lo-pad,hi+pad];out.append((key,domain,yrange,series))
 return out
def expected_tables(s):
 m=s['model'];at=lambda q,ks:[q[k]for k in ks];rows=lambda q:at(q,['coordinate','norm','numerator','energy','state','projector','residual','exactNull'])
 return[
 ('parameters',[[k,display_control(k,v),v]for k,v in s['parameters'].items()]),
 ('matrices',[[k,i,r]for k in ['H','Q','R','W','N','Heff','K']for i,r in enumerate(m[k])]),
 ('norm',[['实际秩',m['rank']],['N的两个本征值',m['normSpectrum']['values']],['对应单位本征矢',m['normSpectrum']['vectors']],['det N',m['determinantN']],['kappa(N)，秩亏时不适用',m['conditionN']],['kappa(W)，秩亏时不适用',m['conditionW']],['完整物理谱',m['physicalSpectrum']],['允许空间谱',s['exact']['subspaceSpectrum']]]),
 ('candidates',[[k,*rows(q)]for k,q in [('正确解',s['exact']),('忽略N',s['ordinary']['candidate']),('完整支撑',s['support']['candidate']),('阈值截断',s['threshold']['candidate']),('正则化',s['regularized']['candidate']),('试探坐标',s['candidate'])]]),
 ('objectives',[['正确求解',s['exact']['energy'],s['exact']['allowedGround'],s['exact']['generalizedResidual'],s['exact']['norm']],['忽略N',s['ordinary']['reported'],s['ordinary']['candidate']['energy'],None,s['ordinary']['candidate']['norm']]]+[[k,s[k]['objective'],s[k]['candidate']['energy'],s[k]['generalizedResidual'],s[k]['candidate']['norm']]for k in ['support','threshold','regularized']]),
 ('whitening',[[k,*at(s[k],['cutoff','eta','keptIndices','rank','basis','whitenedMetric','whitenedHamiltonian','objectiveSpectrum'])]for k in ['support','threshold','regularized']]),
 ('trial',[['a†a',s['candidate']['euclideanNorm']],['a†Na',s['candidate']['metricNorm']],['(Wa)†Wa',s['candidate']['norm']],['a†Heff a',s['candidate']['coordinateNumerator']],['(Wa)†H(Wa)',s['candidate']['numerator']],['真实Rayleigh商',s['candidate']['energy']]]),
 ('theta',[at(q,['theta','rank','normEigenvalues','conditionN','exact','ordinary','ordinaryPhysical','thresholdRank','thresholdEnergy'])for q in s['thetaScan']]),
 ('subspace',[at(q,['beta','fullGround','exact','ordinaryPhysical','regularized','regularizedPhysical'])for q in s['subspaceScan']]),
 ('cutoff',[[q['level'],q['cutoff'],q['rank'],q['keptIndices'],q['objectiveSpectrum'],q['candidate']['energy'],q['candidate']['state'],q['generalizedResidual']]for q in s['cutoffScan']]),
 ('eta',[[q['level'],q['eta'],q['objectiveSpectrum'],q['objective'],q['candidate']['energy'],q['candidate']['norm'],q['candidate']['coordinate'],q['candidate']['exactNull']]for q in s['etaScan']]),
 ('shift',[at(q,['shift','exact','ordinary','ordinaryPhysical','regularized','regularizedPhysical','regularizedNull'])for q in s['shiftScan']]),
 ('ellipse',[at(q,['degrees','direction','metricNorm','unit','physical'])for q in s['ellipse']]),
 ('boundaries',[list(q)for q in s['boundaries'].items()])]

NODE="const fs=require('fs'),a=require(process.argv[1]),f=require(process.argv[2]);\nfunction replay(x,y,path='root'){if(typeof y==='number'){if(typeof x!=='number'||!Number.isFinite(x)||Math.abs(x-y)>3e-11+5e-10*Math.abs(y))throw Error('Replay '+path);}else if(y!==null&&typeof y==='object'){if(!x||typeof x!=='object'||Array.isArray(x)!==Array.isArray(y)||JSON.stringify(Object.keys(x))!==JSON.stringify(Object.keys(y)))throw Error('Replay keys '+path);for(const k of Object.keys(y))replay(x[k],y[k],path+'.'+k);}else if(x!==y)throw Error('Replay scalar '+path);}\nconst cases=a.PRESETS.map(p=>a.compute(p.parameters));let invalid=0;\nfor(const[k,[lo,hi]]of Object.entries(a.LIMITS)){cases.push(a.compute({[k]:lo}),a.compute({[k]:hi}));for(const v of[lo-1,hi+1,lo+.5,'1',null,true,NaN,Infinity]){let bad=false;try{a.compute({[k]:v})}catch(e){bad=true}if(!bad)throw Error('Invalid accepted '+k);invalid++;}}\nfor(const v of[null,[],true,{unknown:1}]){let bad=false;try{a.compute(v)}catch(e){bad=true}if(!bad)throw Error('Bad object');invalid++;}\nfor(const r of f.records)replay(r.data,a.compute(r.data.parameters));\nconst observed=process.argv[3]?JSON.parse(fs.readFileSync(process.argv[3],'utf8')):[];for(const q of observed)replay(q,a.compute(q.parameters));\nlet feedback=0;for(let i=0;i<4;i++)for(let j=0;j<2;j++){if(a.feedback(i,j).correct!==(j===a.QUESTIONS[i][2]))throw Error('Feedback');feedback++;}\nconst snapshots=[...cases,...f.records.map(r=>r.data),...observed];const records=snapshots.map(snapshot=>({snapshot,plots:a.plots(snapshot),tables:a.tables(snapshot),svgs:a.plots(snapshot).map(a.svg)}));\nlet replayGuards=0;for(const change of[q=>q.schema='wrong',q=>q.parameters.theta=99,q=>delete q.support,q=>q.model.lambda='0',q=>q.model.N[0][0][0]=NaN,q=>q.thetaScan.pop(),q=>q.boundaries.complexAdjointRequired=false,q=>q.exact.state=null]){const q=JSON.parse(JSON.stringify(cases[0]));change(q);try{replay(q,cases[0])}catch(e){replayGuards++;}}if(replayGuards!==8)throw Error('Replay guard');\nlet mountControls=0;\nfunction mountPresetNames(api){class E{constructor(tag,doc){this.tag=tag;this.ownerDocument=doc;this.children=[];this.attrs={};this._text='';this.classList={add(){}};}set textContent(v){this._text=String(v);this.children=[];}get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}append(...xs){this.children.push(...xs);}replaceChildren(...xs){this._text='';this.children=[...xs];}setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return Object.hasOwn(this.attrs,k)?this.attrs[k]:null;}removeAttribute(k){delete this.attrs[k];}addEventListener(){}}const doc={createElement(t){return new E(t,this)},querySelector(){return null}};doc.head=new E('head',doc);const root=new E('div',doc);api.mount(root);const all=[];function visit(e){if(e.getAttribute('data-preset')!==null)all.push(e);e.children.forEach(visit)}visit(root);if(all.length!==api.PRESETS.length)throw Error('Preset count');all.forEach((b,i)=>{const name=api.PRESETS[i].name;if(typeof name!=='string'||!name.trim()||b.textContent.trim()!==name)throw Error('Missing name')});function checkControls(c){const labels=[];function walk(e){if(e.tag==='label'&&e.children.some(x=>x.tag==='input'))labels.push(e);e.children.forEach(walk)}walk(root);if(labels.length!==11)throw Error('Control count');for(const label of labels){const field=label.children.find(e=>e.tag==='input'),output=label.children.find(e=>e.tag==='output'),k=field.getAttribute('data-field'),v=c[k],expected=(function(){const f=x=>Number.isInteger(x)&&Math.abs(x)<1e6?String(x):Math.abs(x)<1e-4||Math.abs(x)>=1e5?x.toExponential(5):Number(x.toPrecision(7)).toString();if(k==='cutoffLevel')return v===0?'关闭（tau=0）':f(10**(v-9));if(k==='regularizerLevel')return v===0?'关闭（eta=0）':f(10**(v-6));if(k==='scalePower')return'd='+f(10**v)+'，1/d='+f(10**(-v));if(k==='gaugePhase'||k==='candidatePhase')return v+'π/4';return f(['lambdaTenths','muTenths','shiftTenths'].includes(k)?v/10:v);})();if(output.textContent!==expected||field.getAttribute('aria-valuetext')!==expected)throw Error('Physical control value '+k);if(api===a)mountControls++;}}checkControls(api.DEFAULTS);all.forEach((b,i)=>{b.onclick();checkControls(api.config(api.PRESETS[i].parameters));});return all.length;}\nconst mountLabels=mountPresetNames(a),source=fs.readFileSync(process.argv[1],'utf8'),needle='},p.name);';if(!source.includes(needle))throw Error('Name field');const sandbox={module:{exports:{}}};require('vm').runInNewContext(source.replace(needle,'},p.label);'),sandbox);let mountMutations=0;try{mountPresetNames(sandbox.module.exports)}catch(e){mountMutations++;}if(mountMutations!==1)throw Error('Name mutation');\nconst controlSandbox={module:{exports:{}}},controlNeedle='o.textContent=controlText(k,c[k]);';if(!source.includes(controlNeedle))throw Error('Control output expression');require('vm').runInNewContext(source.replace(controlNeedle,'o.textContent=fmt(c[k]);'),controlSandbox);let controlMutations=0;try{mountPresetNames(controlSandbox.module.exports)}catch(e){controlMutations++;}if(controlMutations!==1)throw Error('Control mutation');\nconsole.log(JSON.stringify({mountControls,controlMutations,records,live:cases.length,frozen:f.records.length,observed:observed.length,invalid,feedback,replayGuards,mountLabels,mountMutations,self:a.selfTest()}));\n"
def viewcheck(record):
 global coords,markers,ledgerRows
 s=record['snapshot'];wanted=expected_plots(s);assert len(record['plots'])==len(record['svgs'])==7
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
 assert len(record['tables'])==14

if __name__=='__main__':
 import sys,json,hashlib,subprocess,shutil,re,copy
 import xml.etree.ElementTree as ET
 from pathlib import Path
 root=Path(__file__).resolve().parents[1];js=Path(sys.argv[1]).resolve()if len(sys.argv)>1 else root/'course-shared/labs/scalar-mps-metric.js';fixture=Path(sys.argv[2]).resolve()if len(sys.argv)>2 else root/'course-shared/projects/metric-certificates/run-snapshot.json'
 f=json.loads(fixture.read_text());assert f['provenance']['sourceSha256']==hashlib.sha256(js.read_bytes()).hexdigest();assert len(f['records'])==6
 args=[str(js),str(fixture)]+([str(Path(sys.argv[3]).resolve())]if len(sys.argv)>3 else[]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
 result=json.loads(subprocess.check_output(prefix+['node','-e',NODE,*args],text=True));coords=markers=ledgerRows=0
 for r in result['records']:review(r['snapshot']);viewcheck(r)
 specimens={r['key']:r['data']for r in f['records']};mutations=0
 edits=[
 ('default',lambda q:q['model']['H'][0][0].__setitem__(0,0)),
 ('complex',lambda q:q['model']['N'][0][1].__setitem__(1,0)),
 ('default',lambda q:q['model']['Heff'][0][0].__setitem__(0,0)),
 ('rankone',lambda q:q['model'].__setitem__('rank',2)),
 ('default',lambda q:q['model'].__setitem__('conditionW',q['model']['conditionN'])),
 ('default',lambda q:q['exact'].__setitem__('energy',q['ordinary']['reported'])),
 ('default',lambda q:q['ordinary']['candidate'].__setitem__('energy',q['ordinary']['reported'])),
 ('default',lambda q:q['support']['whitenedMetric'][0][0].__setitem__(0,2)),
 ('cutoff',lambda q:q['threshold'].__setitem__('rank',2)),
 ('regularized',lambda q:q['regularized']['candidate'].__setitem__('energy',q['regularized']['objective'])),
 ('null',lambda q:q['regularized']['candidate'].__setitem__('energy',0)),
 ('null',lambda q:q['regularized']['candidate'].__setitem__('exactNull',False)),
 ('default',lambda q:q['candidate'].__setitem__('metricNorm',q['candidate']['euclideanNorm'])),
 ('default',lambda q:q['thetaScan'][0].__setitem__('exact',q['thetaScan'][1]['exact'])),
 ('default',lambda q:q['subspaceScan'][90].__setitem__('exact',q['model']['fullGround'])),
 ('cutoff',lambda q:q['cutoffScan'][8].__setitem__('keptIndices',[0,1])),
 ('regularized',lambda q:q['etaScan'][8].__setitem__('objective',q['exact']['energy'])),
 ('default',lambda q:q['shiftScan'][-1].__setitem__('exact',q['exact']['energy'])),
 ('default',lambda q:q['ellipse'][45].__setitem__('metricNorm',1)),
 ('default',lambda q:q['boundaries'].__setitem__('energyShiftAddsShiftTimesN',False))]
 for key,edit in edits:
  q=copy.deepcopy(specimens[key]);edit(q)
  try:review(q)
  except(AssertionError,TypeError,KeyError,ValueError,ZeroDivisionError):mutations+=1
  else:raise AssertionError('Undetected mutation '+key)
 assert result['mountControls']==143 and result['controlMutations']==1
 assert result['invalid']==92 and result['feedback']==8 and result['mountLabels']==12 and result['mountMutations']==1 and result['replayGuards']==8
 print(json.dumps(dict(status='PASS',records=result['live'],frozen=result['frozen'],observed=result['observed'],checks=checks,plotCoordinates=coords,markers=markers,ledgerRows=ledgerRows,invalid=result['invalid'],feedback=result['feedback'],mutations=mutations,mountControls=result['mountControls'],controlMutations=result['controlMutations'],mountLabels=result['mountLabels'],mountMutations=result['mountMutations'],replayGuards=result['replayGuards'],self=result['self']['checks'])))
