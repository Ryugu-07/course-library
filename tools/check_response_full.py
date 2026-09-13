#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Standard-library reference: Lehmann sums and general matrix exponentials."""
import math,cmath
checks=0
def close(a,b,label='',atol=2e-10,rtol=2e-8):
 global checks
 if isinstance(b,(list,tuple)):
  assert isinstance(a,(list,tuple))and len(a)==len(b),(label,'shape')
  for x,y in zip(a,b):close(x,y,label,atol,rtol)
 elif isinstance(b,dict):
  assert isinstance(a,dict)and list(a)==list(b),(label,'keys')
  for k in b:close(a[k],b[k],label+'.'+k,atol,rtol)
 elif b is None:assert a is None,(label,a,b)
 elif isinstance(b,(str,bool)):assert type(a)==type(b)and a==b,(label,a,b)
 else:assert isinstance(a,(int,float,complex))and math.isfinite(abs(a))and abs(a-b)<=atol+rtol*abs(b),(label,a,b)
 checks+=1
def cv(z):return complex(*z)
def pair(z):return[z.real,z.imag]
def mm(A,B):return[[sum(A[i][k]*B[k][j]for k in range(2))for j in range(2)]for i in range(2)]
def adj(A):return[[A[j][i].conjugate()for j in range(2)]for i in range(2)]
def scale(A,x):return[[v*x for v in row]for row in A]
def trace(A):return A[0][0]+A[1][1]
def matrix_exp(A):
 n=max(sum(abs(z)for z in row)for row in A);s=max(0,math.ceil(math.log2(n/.25)))if n else 0;X=scale(A,1/2**s);out=[[1+0j,0j],[0j,1+0j]];term=[row[:]for row in out]
 for k in range(1,33):
  term=scale(mm(term,X),1/k);out=[[out[i][j]+term[i][j]for j in range(2)]for i in range(2)]
  if max(abs(z)for row in term for z in row)<1e-19:break
 for _ in range(s):out=mm(out,out)
 return out
def make(p):
 d=p['gapTenths']/10;beta=p['betaTenths']/10;q=p['chargeTenths']/10;theta=p['tiltDegrees']*math.pi/180;st=math.sin(theta);ct=math.cos(theta);pe=1/(1+math.exp(beta*d));pg=1-pe;r=pg-pe
 return dict(hbar=1,delta=d,beta=beta,q=q,theta=theta,s=st,z=ct,r=r,pg=pg,pe=pe,transverse=(q*st)**2,diagonal=(q*ct)**2*4*pg*pe,mean=-q*ct*r,eta=p['etaHundredths']/100,omega=d*p['frequencyTenths']/10,T=p['observationQuarters']*math.pi/(2*d),M=16*2**p['level'],f=d*p['fieldTenths']/(20*q),W=d*p['bandTenths']/10,alpha=p['unitsTenths']/10)
def moments(m):
 d=m['delta'];r=m['r'];v=m['transverse'];diag=m['diagonal'];ret=2*r*v/d
 return dict(mean=m['mean'],retarded=ret,thermalDiagonal=m['beta']*diag,isothermal=ret+m['beta']*diag,broadened=ret*d*d/(d*d+m['eta']**2),weights=[2*math.pi*v*m['pg'],2*math.pi*v*m['pe'],2*math.pi*diag],connectedVariance=v+diag,rawSecondMoment=m['q']**2,meanSquared=m['mean']**2)
def spectrum(m,w):
 d=m['delta'];e=m['eta'];v=m['transverse'];r=m['r'];terms=[2*e*weight/((w-freq)**2+e*e)for freq,weight in [(d,v*m['pg']),(-d,v*m['pe']),(0,m['diagonal'])]];S=sum(terms);Sm=2*e*(v*m['pg']/((w+d)**2+e*e)+v*m['pe']/((w-d)**2+e*e)+m['diagonal']/(w*w+e*e));chi=sum(-difference*v/complex(w-freq,e)for freq,difference in [(d,r),(-d,-r)])
 # Stable analytic continuation, independent population construction.
 rb=d/2 if m['beta']==0 else r/m['beta'];x=m['beta']*w/2;xc=1 if x==0 else x/math.tanh(x);formal=8*rb*v*e*d*xc/(((w-d)**2+e*e)*((w+d)**2+e*e));sym=(S+Sm)/2;bol=math.exp(-m['beta']*w)
 return dict(omega=w,chi=pair(chi),positive=terms[0],negative=terms[1],zero=terms[2],S=S,Sminus=Sm,sym=sym,antisymmetric=(S-Sm)/2,formalFDT=formal,fdtResidual=sym-formal,detailedBalanceMismatch=(Sm-bol*S)/(Sm+bol*S))
def corr(m,t):return m['transverse']*(m['pg']*cmath.exp(-1j*m['delta']*t)+m['pe']*cmath.exp(1j*m['delta']*t))+m['diagonal']
def kernel(m,t):return 0 if t<0 else -2*corr(m,t).imag*math.exp(-m['eta']*t)
def finite(m,T):
 def J(x):
  z=complex(-m['eta'],x);return(cmath.exp(z*T)-1)/z
 return 1j*sum(weight*(J(m['omega']-freq)-J(m['omega']+freq))for freq,weight in [(m['delta'],m['transverse']*m['pg']),(-m['delta'],m['transverse']*m['pe'])])
def midpoint(m,M,keep):
 dt=m['T']/M;nodes=[];terms=[]
 for j in range(M):
  t=(j+.5)*dt;k=kernel(m,t);term=k*cmath.exp(1j*m['omega']*t)*dt;terms.append(term)
  if keep:nodes.append(dict(j=j,t=t,kernel=k,contribution=pair(term)))
 value=complex(math.fsum(x.real for x in terms),math.fsum(x.imag for x in terms));exact=finite(m,m['T']);out=dict(M=M,dt=dt,value=pair(value),exact=pair(exact),error=abs(value-exact))
 if keep:out['nodes']=nodes
 return out
def fields(m,f):
 hx=-f*m['q']*m['s'];hz=m['delta']/2-f*m['q']*m['z'];return hx,hz,[[hz+0j,hx+0j],[hx+0j,-hz+0j]]
def equilibrium(m,f):
 hx,hz,H=fields(m,f);R=matrix_exp(scale(H,-m['beta']));rho=scale(R,1/trace(R));B=[[m['q']*m['z'],m['q']*m['s']],[m['q']*m['s'],-m['q']*m['z']]];mean=trace(mm(rho,B)).real;h=math.hypot(hx,hz)
 return dict(f=f,hx=hx,hz=hz,h=h,energies=[-h,h],mean=mean,change=mean-m['mean'])
def quench(m,t):
 _,_,H=fields(m,m['f']);U=matrix_exp(scale(H,-1j*t));rho=mm(mm(U,[[m['pe']+0j,0j],[0j,m['pg']+0j]]),adj(U));b=[2*rho[0][1].real,-2*rho[0][1].imag,(rho[0][0]-rho[1][1]).real];mean=m['q']*(m['s']*b[0]+m['z']*b[2]);return dict(t=t,bloch=b,length=math.sqrt(sum(x*x for x in b)),mean=mean,change=mean-m['mean'],linear=moments(m)['retarded']*m['f']*(1-math.cos(m['delta']*t)))
def areas(m,W):
 def cumulative(x,c):return .5+math.atan2(x-c,m['eta'])/math.pi
 weights=moments(m)['weights'];parts=[cumulative(W,c)-cumulative(-W,c)for c in [m['delta'],-m['delta'],0]];half=[cumulative(W,c)-cumulative(0,c)for c in [m['delta'],-m['delta']]];A=m['r']*m['transverse']
 return dict(W=W,parts=parts,noise=sum(x*y for x,y in zip(weights,parts)),noiseAll=sum(weights),responsePositive=math.pi*A*(half[0]-half[1]),responsePositiveAll=2*A*math.atan(m['delta']/m['eta']),idealPositiveLine=math.pi*A)
def review(s):
 p=s['parameters'];m=make(p);close(s['model'],m,'model');close(s['static'],moments(m),'static');close(s['current'],spectrum(m,m['omega']),'current');f=finite(m,m['T']);tail=abs(f-cv(spectrum(m,m['omega'])['chi']));bound=2*abs(m['r']*m['transverse'])*math.exp(-m['eta']*m['T'])/m['eta'];close(s['window'],dict(T=m['T'],value=pair(f),tailError=tail,tailBound=bound),'window');assert tail<=bound+2e-9
 close(s['numerical'],midpoint(m,m['M'],True),'all midpoint nodes');close(s['equilibrium'],equilibrium(m,m['f']),'field equilibrium');close(s['quench'],quench(m,m['T']),'exact quench');close(s['areas'],areas(m,m['W']),'band area')
 assert len(s['frequencyScan'])==1281 and len(s['timeScan'])==129 and len(s['resolutionScan'])==9 and len(s['durationScan'])==81 and len(s['fieldScan'])==161 and len(s['temperatureScan'])==81 and len(s['bandScan'])==81
 for i,v in enumerate(s['frequencyScan']):close(v,spectrum(m,m['delta']*(-4+i/160)),'frequency')
 for i,v in enumerate(s['timeScan']):
  t=m['T']*i/128;close(v,dict(t=t,correlation=pair(corr(m,t)),kernel=kernel(m,t),quench=quench(m,t)),'time')
 for i,v in enumerate(s['resolutionScan']):close(v,midpoint(m,16*2**i,False),'resolution')
 for i,v in enumerate(s['durationScan']):
  T=(i+1)*math.pi/(2*m['delta']);value=finite(m,T);close(v,dict(T=T,value=pair(value),error=abs(value-cv(spectrum(m,m['omega'])['chi'])),bound=2*abs(m['r']*m['transverse'])*math.exp(-m['eta']*T)/m['eta']),'duration')
 for i,v in enumerate(s['fieldScan']):
  x=-2+i/40;f=m['delta']*x/(2*m['q']);close(v,dict(x=x,**equilibrium(m,f),linear=moments(m)['isothermal']*f),'field')
 for i,v in enumerate(s['temperatureScan']):
  n=make({**p,'betaTenths':i});close(v,dict(beta=n['beta'],r=n['r'],**moments(n)),'temperature')
 for i,v in enumerate(s['bandScan']):close(v,areas(m,m['delta']*(i+1)/10),'band scan')
 a=m['alpha'];n={**m,'delta':m['delta']*a,'beta':m['beta']/a,'eta':m['eta']*a,'omega':m['omega']*a,'T':m['T']/a,'f':m['f']*a,'W':m['W']*a};num=midpoint(n,m['M'],False);num['nodes']=[]
 close(s['rescaled'],dict(model=n,spectrum=spectrum(n,n['omega']),static=moments(n),window=pair(finite(n,n['T'])),numerical=num,equilibrium=equilibrium(n,n['f']),quench=quench(n,n['T']),areas=areas(n,n['W'])),'units')
 keys=['sourceMinusFB','fourierPlusIomegaT','commutatorOrderFixed','connectedNoiseSubtractsMean','zeroModeNotDynamicResponse','isothermalNeedsPopulationChange','etaNotDerivedBath','broadenedThermalFDTNotExact','finiteTimeDifferentFromTimeGrid','spectralAreaDifferentFromPeakHeight','finiteFieldDegeneracyHandled','allEnergyAndTimeUnitsTransformed'];close(s['boundaries'],dict.fromkeys(keys,True),'boundaries')

def expected_plots(s):
 d=s['model']['delta'];T=s['model']['T'];log=lambda rows:[None if y==0 else[x,math.log10(abs(y))]for x,y in rows]
 values=[
 ('spectrum',[-4,4],[[[q['omega']/d,q[k]]for q in s['frequencyScan']]for k in ['positive','negative','zero']]+[[[q['omega']/d,q['chi'][1]]for q in s['frequencyScan']]]),
 ('fdt',[-4,4],[[[q['omega']/d,q[k]]for q in s['frequencyScan']]for k in ['sym','formalFDT']]),
 ('quench',[0,1],[[[q['t']/T,q['quench'][k]]for q in s['timeScan']]for k in ['change','linear']]+[[[0,s['equilibrium']['change']],[1,s['equilibrium']['change']]]]),
 ('grid',[4,12],[log([[math.log2(q['M']),q['error']]for q in s['resolutionScan']]),log([[4,s['window']['tailError']],[12,s['window']['tailError']]])]),
 ('duration',[.25,20.25],[log([[q['T']*d/(2*math.pi),q[k]]for q in s['durationScan']])for k in ['error','bound']]),
 ('field',[-2,2],[[[q['x'],q[k]]for q in s['fieldScan']]for k in ['change','linear']])]
 out=[]
 for key,domain,series in values:
  ys=[p[1]for line in series for p in line if p is not None];lo=min([0]+ys);hi=max([0]+ys)
  if lo==hi:hi=lo+1
  pad=.07*(hi-lo);out.append((key,domain,[lo-pad,hi+pad],series))
 return out
def expected_tables(s):
 at=lambda q,ks:[q[k]for k in ks]
 return[
 ('parameters',[[g,k,v]for g,q in [('控件',s['parameters']),('模型',s['model'])]for k,v in q.items()]),
 ('static',[list(q)for q in s['static'].items()]),('current',[list(q)for q in s['current'].items()]),
 ('frequency',[at(q,['omega','chi','positive','negative','zero','S','Sminus','sym','formalFDT','fdtResidual','detailedBalanceMismatch'])for q in s['frequencyScan']]),
 ('nodes',[at(q,['j','t','kernel','contribution'])for q in s['numerical']['nodes']]),
 ('resolution',[at(q,['M','dt','value','exact','error'])for q in s['resolutionScan']]),
 ('duration',[at(q,['T','value','error','bound'])for q in s['durationScan']]),
 ('time',[[q['t'],q['correlation'],q['kernel'],*at(q['quench'],['bloch','length','mean','change','linear'])]for q in s['timeScan']]),
 ('field',[at(q,['x','f','hx','hz','h','energies','mean','change','linear'])for q in s['fieldScan']]),
 ('temperature',[at(q,['beta','r','mean','retarded','thermalDiagonal','isothermal','weights','connectedVariance'])for q in s['temperatureScan']]),
 ('band',[at(q,['W','parts','noise','noiseAll','responsePositive','responsePositiveAll','idealPositiveLine'])for q in s['bandScan']]),
 ('units',[[key,x,y]for key,x,y in [('Δ',s['model']['delta'],s['rescaled']['model']['delta']),('β',s['model']['beta'],s['rescaled']['model']['beta']),('η',s['model']['eta'],s['rescaled']['model']['eta']),('ω',s['model']['omega'],s['rescaled']['model']['omega']),('T',s['model']['T'],s['rescaled']['model']['T']),('f',s['model']['f'],s['rescaled']['model']['f']),('χ',s['current']['chi'],s['rescaled']['spectrum']['chi']),('S(ω)',s['current']['S'],s['rescaled']['spectrum']['S']),('有限记录复积分',s['window']['value'],s['rescaled']['window']),('中点和',s['numerical']['value'],s['rescaled']['numerical']['value']),('等温导数',s['static']['isothermal'],s['rescaled']['static']['isothermal']),('有限场热平均',s['equilibrium']['mean'],s['rescaled']['equilibrium']['mean']),('封闭演化Bloch向量',s['quench']['bloch'],s['rescaled']['quench']['bloch']),('带内噪声面积',s['areas']['noise'],s['rescaled']['areas']['noise'])]]),
 ('boundaries',[list(q)for q in s['boundaries'].items()])]

NODE="const fs=require('fs'),a=require(process.argv[1]),f=require(process.argv[2]);\nfunction replay(x,y,path='root'){if(typeof y==='number'){if(typeof x!=='number'||!Number.isFinite(x)||Math.abs(x-y)>3e-11+5e-10*Math.abs(y))throw Error('Replay '+path);}else if(y!==null&&typeof y==='object'){if(!x||typeof x!=='object'||Array.isArray(x)!==Array.isArray(y)||JSON.stringify(Object.keys(x))!==JSON.stringify(Object.keys(y)))throw Error('Replay keys '+path);for(const k of Object.keys(y))replay(x[k],y[k],path+'.'+k);}else if(x!==y)throw Error('Replay scalar '+path);}\nconst cases=a.PRESETS.map(p=>a.compute(p.parameters));let invalid=0;\nfor(const[k,[lo,hi]]of Object.entries(a.LIMITS)){cases.push(a.compute({[k]:lo}),a.compute({[k]:hi}));for(const v of[lo-1,hi+1,lo+.5,'1',null,true,NaN,Infinity]){let bad=false;try{a.compute({[k]:v})}catch(e){bad=true}if(!bad)throw Error('Invalid accepted '+k);invalid++;}}\nfor(const v of[null,[],true,{unknown:1}]){let bad=false;try{a.compute(v)}catch(e){bad=true}if(!bad)throw Error('Bad object');invalid++;}\nfor(const r of f.records)replay(r.data,a.compute(r.data.parameters));\nconst observed=process.argv[3]?JSON.parse(fs.readFileSync(process.argv[3],'utf8')):[];for(const q of observed)replay(q,a.compute(q.parameters));\nlet feedback=0;for(let i=0;i<4;i++)for(let j=0;j<2;j++){if(a.feedback(i,j).correct!==(j===a.QUESTIONS[i][2]))throw Error('Feedback');feedback++;}\nconst snapshots=[...cases,...f.records.map(r=>r.data),...observed];const records=snapshots.map(snapshot=>({snapshot,plots:a.plots(snapshot),tables:a.tables(snapshot),svgs:a.plots(snapshot).map(a.svg)}));\nlet replayGuards=0;for(const change of[q=>q.schema='wrong',q=>q.parameters.level=99,q=>delete q.current,q=>q.current.S='0',q=>q.current.chi[0]=NaN,q=>q.frequencyScan.pop(),q=>q.boundaries.etaNotDerivedBath=false,q=>q.numerical.nodes=null]){const q=JSON.parse(JSON.stringify(cases[0]));change(q);try{replay(q,cases[0])}catch(e){replayGuards++;}}if(replayGuards!==8)throw Error('Replay guard');\nfunction mountPresetNames(api){class E{constructor(tag,doc){this.tag=tag;this.ownerDocument=doc;this.children=[];this.attrs={};this._text='';this.classList={add(){}};}set textContent(v){this._text=String(v);this.children=[];}get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}append(...xs){this.children.push(...xs);}replaceChildren(...xs){this._text='';this.children=[...xs];}setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return Object.hasOwn(this.attrs,k)?this.attrs[k]:null;}removeAttribute(k){delete this.attrs[k];}addEventListener(){}}const doc={createElement(t){return new E(t,this)},querySelector(){return null}};doc.head=new E('head',doc);const root=new E('div',doc);api.mount(root);const all=[];function visit(e){if(e.getAttribute('data-preset')!==null)all.push(e);e.children.forEach(visit)}visit(root);if(all.length!==api.PRESETS.length)throw Error('Preset count');all.forEach((b,i)=>{const name=api.PRESETS[i].name;if(typeof name!=='string'||!name.trim()||b.textContent.trim()!==name)throw Error('Missing name')});return all.length;}\nconst mountLabels=mountPresetNames(a),source=fs.readFileSync(process.argv[1],'utf8'),needle='},p.name);';if(!source.includes(needle))throw Error('Name field');const sandbox={module:{exports:{}}};require('vm').runInNewContext(source.replace(needle,'},p.label);'),sandbox);let mountMutations=0;try{mountPresetNames(sandbox.module.exports)}catch(e){mountMutations++;}if(mountMutations!==1)throw Error('Name mutation');\nconsole.log(JSON.stringify({records,live:cases.length,frozen:f.records.length,observed:observed.length,invalid,feedback,replayGuards,mountLabels,mountMutations,self:a.selfTest()}));\n"
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
 root=Path(__file__).resolve().parents[1];js=Path(sys.argv[1]).resolve()if len(sys.argv)>1 else root/'course-shared/labs/scalar-spectral-response.js';fixture=Path(sys.argv[2]).resolve()if len(sys.argv)>2 else root/'course-shared/projects/response-certificates/run-snapshot.json'
 f=json.loads(fixture.read_text());assert f['provenance']['sourceSha256']==hashlib.sha256(js.read_bytes()).hexdigest();assert len(f['records'])==6
 args=[str(js),str(fixture)]+([str(Path(sys.argv[3]).resolve())]if len(sys.argv)>3 else[]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
 result=json.loads(subprocess.check_output(prefix+['node','-e',NODE,*args],text=True));coords=markers=ledgerRows=0
 for r in result['records']:review(r['snapshot']);viewcheck(r)
 specimens={r['key']:r['data']for r in f['records']};mutations=0
 edits=[
 ('default',lambda q:q['current']['chi'].__setitem__(1,-q['current']['chi'][1])),
 ('mixed',lambda q:q['current'].__setitem__('zero',0)),
 ('mixed',lambda q:q['static'].__setitem__('thermalDiagonal',0)),
 ('commuting',lambda q:q['static'].__setitem__('retarded',q['static']['isothermal'])),
 ('commuting',lambda q:q['quench'].__setitem__('change',q['equilibrium']['change'])),
 ('degenerate',lambda q:q['equilibrium'].__setitem__('mean',q['model']['mean'])),
 ('default',lambda q:q['window'].__setitem__('value',q['current']['chi'])),
 ('coarse',lambda q:q['numerical'].__setitem__('error',0)),
 ('default',lambda q:q['numerical']['nodes'][0].__setitem__('contribution',[0,0])),
 ('default',lambda q:q['resolutionScan'][0].__setitem__('value',[0,0])),
 ('narrow',lambda q:q['durationScan'][0].__setitem__('bound',0)),
 ('default',lambda q:q['current'].__setitem__('formalFDT',q['current']['sym'])),
 ('mixed',lambda q:q['current'].__setitem__('detailedBalanceMismatch',0)),
 ('mixed',lambda q:q['static'].__setitem__('connectedVariance',q['static']['rawSecondMoment'])),
 ('default',lambda q:q['areas'].__setitem__('responsePositiveAll',q['areas']['idealPositiveLine'])),
 ('default',lambda q:q['bandScan'][0].__setitem__('noise',q['areas']['noiseAll'])),
 ('mixed',lambda q:q['temperatureScan'][0].__setitem__('connectedVariance',0)),
 ('default',lambda q:q['timeScan'][20]['quench'].__setitem__('bloch',[0,0,0])),
 ('default',lambda q:q['rescaled']['model'].__setitem__('T',2*q['model']['T'])),
 ('default',lambda q:q['boundaries'].__setitem__('etaNotDerivedBath',False))]
 for key,edit in edits:
  q=copy.deepcopy(specimens[key]);edit(q)
  try:review(q)
  except(AssertionError,TypeError,KeyError,ValueError,ZeroDivisionError):mutations+=1
  else:raise AssertionError('Undetected mutation '+key)
 assert result['invalid']==92 and result['feedback']==8 and result['mountLabels']==12 and result['mountMutations']==1 and result['replayGuards']==8
 print(json.dumps(dict(status='PASS',records=result['live'],frozen=result['frozen'],observed=result['observed'],checks=checks,plotCoordinates=coords,markers=markers,ledgerRows=ledgerRows,invalid=result['invalid'],feedback=result['feedback'],mutations=mutations,mountLabels=result['mountLabels'],mountMutations=result['mountMutations'],replayGuards=result['replayGuards'],self=result['self']['checks'])))
