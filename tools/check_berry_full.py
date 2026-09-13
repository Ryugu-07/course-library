#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Independent complex matrices: Taylor scaling/squaring and ordered propagation."""
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
def cv(v):return complex(*v)
def vector(v):return[cv(z)for z in v]
def dot(a,b):return sum(x.conjugate()*y for x,y in zip(a,b))
def length(a):return math.sqrt(sum(abs(z)**2 for z in a))
def mv(A,v):return[sum(A[i][j]*v[j]for j in range(2))for i in range(2)]
def mm(A,B):return[[sum(A[i][k]*B[k][j]for k in range(2))for j in range(2)]for i in range(2)]
def matrix_exp(A):
 # General 2x2 matrix exponential; independent of Pauli closed-form runtime.
 n=max(sum(abs(z)for z in row)for row in A);s=max(0,math.ceil(math.log2(n/.25)))if n else 0
 X=[[z/2**s for z in row]for row in A];out=[[1+0j,0j],[0j,1+0j]];term=[row[:]for row in out]
 for k in range(1,33):
  term=[[z/k for z in row]for row in mm(term,X)];out=[[out[i][j]+term[i][j]for j in range(2)]for i in range(2)]
  if max(abs(z)for row in term for z in row)<1e-19:break
 for _ in range(s):out=mm(out,out)
 return out
def u(degrees,phi):
 theta=degrees*math.pi/180;return[-cmath.exp(-1j*phi)*math.sin(theta/2),complex(math.cos(theta/2))]
def hamiltonian(degrees,E,phi):
 theta=degrees*math.pi/180;x=E*math.sin(theta);z=E*math.cos(theta)
 return[[z,x*cmath.exp(-1j*phi)],[x*cmath.exp(1j*phi),-z]]
def geometric(q,degrees,N,orientation,patch,a,b):
 theta=degrees*math.pi/180;gamma=orientation*math.pi*(1-math.cos(theta));dphi=orientation*2*math.pi/N;z=math.cos(theta/2)**2+math.sin(theta/2)**2*cmath.exp(-1j*dphi)
 assert q['N']==N and q['orientation']==orientation and q['patch']==patch
 close([q['theta'],q['a'],q['b'],q['gamma'],q['connectionIntegral'],q['curvature']],[theta,a,b,gamma,gamma-(patch+a)*orientation*2*math.pi,math.sin(theta)/2],'geometry metadata')
 expected=cmath.exp(1j*gamma);close(cv(q['expected']),expected,'family holonomy');close(cv(q['endpointCorrected']),expected,'endpoint corrected')
 end=orientation*2*math.pi;endpoint=cmath.exp(1j*(patch+a)*end);close(cv(q['endpoint']),endpoint,'endpoint');close(cmath.exp(1j*q['endpointPhase']),endpoint,'endpoint phase')
 null=N==2 and degrees==90;assert q['defined']==(not null)
 if null:
  for k in ['invariant','discretePhase','circularError','rawPhaseSum','logMagnitude']:close(q[k],None,'orthogonal '+k)
  close(q['minOverlap'],0,'zero overlap');close(cv(q['rawOpen']),0j);close(cv(q['rawClosed']),0j)
 else:
  phase=-N*cmath.phase(z);want=cmath.exp(1j*phase);close(cv(q['invariant']),want,'discrete holonomy');close(cmath.exp(1j*q['discretePhase']),want,'discrete phase');close(q['circularError'],math.atan2(math.sin(phase-gamma),math.cos(phase-gamma)),'circular error')
  close([q['logMagnitude'],q['minOverlap']],[N*math.log(abs(z)),abs(z)],'product modulus');close(cv(q['rawOpen']),z**N*endpoint,'open product');close(cv(q['rawClosed']),z**N,'closed product')
 if q['nodes']:
  assert len(q['nodes'])==N+1 and len(q['links'])==N;rawPhase=0
  for j,node in enumerate(q['nodes']):
   phi=j*dphi;chi=(patch+a)*phi+b*math.sin(3*phi);v=[cmath.exp(1j*chi)*z for z in u(degrees,phi)]
   close(vector(node['state']),v,'node state');close([node['index'],node['phi'],node['chi'],node['norm'],node['connectionCoefficient'],node['curvature']],[j,phi,chi,1,(1-math.cos(theta))/2-patch-a-3*b*math.cos(3*phi),math.sin(theta)/2],'node metadata')
   H=hamiltonian(degrees,1,phi);close(mv(H,v),[-z for z in v],'eigenvector')
   close([[v[i]*v[j].conjugate()for j in range(2)]for i in range(2)],[[(int(i==j)-H[i][j])/2 for j in range(2)]for i in range(2)],'projector')
   if j<N:
    nxt=phi+dphi;chi1=(patch+a)*nxt+b*math.sin(3*nxt);link=0j if null else z*cmath.exp(1j*(chi1-chi));r=q['links'][j]
    close(cv(r['overlap']),link,'link');close([r['index'],r['from'],r['to'],r['magnitude']],[j,phi,nxt,abs(link)])
    if null:close(r['phase'],None)
    else:close(cmath.exp(1j*r['phase']),link/abs(link),'link phase');rawPhase+=cmath.phase(link)
  if not null:close(q['rawPhaseSum'],rawPhase,'phase sum',atol=3e-8)
 else:assert q['links']==[]
def analytic_state(degrees,E,omega,t):
 H=hamiltonian(degrees,E,0);H[0][0]-=omega/2;H[1][1]+=omega/2
 v=mv(matrix_exp([[-1j*t*z for z in row]for row in H]),u(degrees,0))
 return[cmath.exp(-1j*omega*t/2)*v[0],cmath.exp(1j*omega*t/2)*v[1]]
def inspect_state(q,v,degrees,E,phi):
 theta=degrees*math.pi/180;lo=dot(u(degrees,phi),v);hi=dot([complex(math.cos(theta/2)),cmath.exp(1j*phi)*math.sin(theta/2)],v)
 close(vector(q['state']),v,'state');close(q['norm'],dot(v,v).real,'norm');close(cv(q['lowerOverlap']),lo,'lower');close(cv(q['upperOverlap']),hi,'upper');close([q['selectedLowerProbability'],q['selectedUpperProbability']],[abs(lo)**2,abs(hi)**2],'probability')
 z=v[0].conjugate()*v[1];close(q['bloch'],[2*z.real,2*z.imag,abs(v[0])**2-abs(v[1])**2],'Bloch');assert q['bandPopulationsDefined']==(E>0)
def envelope(q,degrees,E,omega):
 theta=degrees*math.pi/180;h=[E*math.sin(theta),0,E*math.cos(theta)-omega/2];r=length(h);bound=0 if r==0 else omega**2*math.sin(theta)**2/(4*r*r)
 close(q['rotatingField'],h,'rotating field');close(q['leakageEnvelope'],bound,'envelope');assert q['selectedUpperProbability']<=bound+3e-10
def final(q,degrees,E,omega,reference):
 envelope(q,degrees,E,omega);T=2*math.pi/abs(omega);v=analytic_state(degrees,E,omega,T);inspect_state(q,v,degrees,E,omega*T);survival=dot(u(degrees,0),v);amp=cmath.exp(-1j*E*T)*survival;gamma=(1 if omega>0 else-1)*math.pi*(1-math.cos(degrees*math.pi/180));berry=cmath.exp(1j*gamma)if E>0 else None
 close([q['T'],q['time'],q['phi'],q['omega'],q['E'],q['referencePhase']],[T,T,omega*T,omega,E,reference],'final metadata');close(cv(q['survival']),survival);close(cv(q['amplitude']),amp);close(q['visibility'],abs(amp));close(q['port'],(1+(cmath.exp(-1j*reference)*amp).real)/2,'port')
 if abs(amp)>0:close(cmath.exp(1j*q['phase']),amp/abs(amp),'survival phase')
 else:close(q['phase'],None)
 if berry is None:
  for k in ['berry','phaseError','adiabaticAmplitudeError','adiabaticPort']:close(q[k],None,'closed gap '+k)
 else:
  close(cv(q['berry']),berry);close(q['adiabaticAmplitudeError'],abs(amp-berry));close(q['adiabaticPort'],(1+(cmath.exp(-1j*reference)*berry).real)/2)
  close(q['phaseError'],math.atan2(math.sin(cmath.phase(amp)-gamma),math.cos(cmath.phase(amp)-gamma))if abs(amp)>0 else None,'phase difference',atol=2e-9)
 return v
def numerical_state(degrees,E,omega,T,M):
 dt=T/M;V=matrix_exp([[-1j*dt*z for z in row]for row in hamiltonian(degrees,E,0)]);v=u(degrees,0)
 # Conjugate one independently evaluated step exponential by the exact z rotation.
 for j in range(M):
  phi=omega*(j+.5)*dt;U=[[V[0][0],V[0][1]*cmath.exp(-1j*phi)],[V[1][0]*cmath.exp(1j*phi),V[1][1]]];v=mv(U,v)
 return v
def review(s):
 assert s['schema']=='berry207-v1';c=s['parameters'];m=s['model'];degrees=c['thetaDegrees'];N=2*2**c['level'];M=16*2**c['timeLevel'];orientation=-1 if c['reverse']else 1;E=c['energyTenths']/10;omega=orientation*10**(c['speedLogTenths']/10);ref=c['referenceQuarters']*math.pi/4;a=c['twistTenths']/10;b=c['wobbleTenths']/10;alpha=c['unitsTenths']/10
 close([m[k]for k in ['N','M','orientation','E','gap','omega','theta','a','b','referencePhase','alpha','hbar']],[N,M,orientation,E,2*E,omega,degrees*math.pi/180,a,b,ref,alpha,1],'parameters');assert m['isolatedBand']==(E>0)
 geometric(s['current'],degrees,N,orientation,c['south'],a,b);assert len(s['current']['nodes'])==N+1
 assert len(s['geometryScan'])==9 and len(s['latitudeScan'])==181 and len(s['gaugeScan'])==241 and len(s['surfaceScan'])==8
 for level,q in enumerate(s['geometryScan']):assert q['level']==level;geometric(q,degrees,2*2**level,orientation,c['south'],a,b)
 for j,q in enumerate(s['latitudeScan']):assert q['degrees']==j;geometric(q,j,N,orientation,c['south'],a,b)
 for j,q in enumerate(s['gaugeScan']):geometric(q,degrees,N,orientation,c['south'],(j-120)/40,b)
 for j,q in enumerate(s['surfaceScan']):
  n=8*2**j;mid=math.pi/(2*n)/math.sin(math.pi/(2*n));close([q['bins'],q['midpointChern'],q['midpointFlux'],q['cellFlux'],q['exactCellChern']],[n,mid,2*math.pi*mid,2*math.pi,1],'flux');close(q['bandChern'],1 if E>0 else None,'band Chern')
 v=final(s['dynamics'],degrees,E,omega,ref);T=2*math.pi/abs(omega)
 assert len(s['timeScan'])==129 and len(s['resolutionScan'])==9 and len(s['speedScan'])==81 and len(s['fringeScan'])==65
 for i,q in enumerate(s['timeScan']):
  envelope(q,degrees,E,omega);t=T*i/128;want=analytic_state(degrees,E,omega,t);inspect_state(q,want,degrees,E,omega*t);close([q['fraction'],q['time'],q['phi']],[i/128,t,omega*t])
 for i,q in enumerate(s['speedScan']):close(q['logSpeed'],-3+i/20);final(q,degrees,E,orientation*10**(-3+i/20),ref)
 final(s['rescaled'],degrees,alpha*E,alpha*omega,ref);close(vector(s['rescaled']['state']),v,'unit invariance')
 for i,q in enumerate(s['fringeScan']):
  phase=2*math.pi*i/64;close(q['referencePhase'],phase);close(q['port'],(1+(cmath.exp(-1j*phase)*cv(s['dynamics']['amplitude'])).real)/2)
  close(q['adiabaticPort'],None if E==0 else(1+(cmath.exp(-1j*phase)*cv(s['dynamics']['berry'])).real)/2)
 for i,q in enumerate([s['numerical']]+s['resolutionScan']):
  count=M if i==0 else 16*2**(i-1);close([q['M'],q['dt']],[count,T/count],'time resolution')
  if i>0:assert q['level']==i-1
  num=numerical_state(degrees,E,omega,T,count);inspect_state(q,num,degrees,E,omega*T);close(q['stateError'],length([x-y for x,y in zip(num,v)]),'state error',atol=3e-9);close(q['populationError'],q['selectedUpperProbability']-s['dynamics']['selectedUpperProbability'])
 assert len(s['boundaries'])==12 and all(s['boundaries'].values())

def expected_plots(s):
 log=lambda rows:[None if y is None or y==0 else[x,math.log10(abs(y))]for x,y in rows]
 specs=[
 ('geometry',[1,9],[log([[math.log2(q['N']),q['circularError']]for q in s['geometryScan']])]),
 ('gauge',[-3,3],[[[q['a'],math.cos(q['connectionIntegral'])]for q in s['gaugeScan']],[[q['a'],math.sin(q['connectionIntegral'])]for q in s['gaugeScan']]]+[[[q['a'],q['endpointCorrected'][i]]for q in s['gaugeScan']]for i in [0,1]]),
 ('dynamics',[0,1],[[[q['fraction'],q[k]]for q in s['timeScan']]for k in ['selectedLowerProbability','selectedUpperProbability']]+[[[0,s['dynamics']['leakageEnvelope']],[1,s['dynamics']['leakageEnvelope']]]]),
 ('timestep',[4,12],[log([[math.log2(q['M']),q['stateError']]for q in s['resolutionScan']]),log([[math.log2(q['M']),q['norm']-1]for q in s['resolutionScan']])]),
 ('speed',[-3,1],[[[q['logSpeed'],q['selectedUpperProbability']]for q in s['speedScan']],[None if q['adiabaticAmplitudeError']is None else[q['logSpeed'],q['adiabaticAmplitudeError']]for q in s['speedScan']]]),
 ('fringe',[0,2*math.pi],[[[q['referencePhase'],q['port']]for q in s['fringeScan']],[None if q['adiabaticPort']is None else[q['referencePhase'],q['adiabaticPort']]for q in s['fringeScan']]])]
 out=[]
 for key,domain,series in specs:
  ys=[p[1]for line in series for p in line if p is not None];lo=min([0]+ys);hi=max([0]+ys)
  if hi==lo:hi=lo+1
  pad=.07*(hi-lo);out.append((key,domain,[lo-pad,hi+pad],series))
 return out
def expected_tables(s):
 at=lambda q,keys:[q[k]for k in keys]
 geomKeys=['theta','N','orientation','patch','a','b','gamma','connectionIntegral','endpoint','endpointPhase','endpointCorrected','expected','curvature','rawOpen','rawClosed','rawPhaseSum','logMagnitude','minOverlap','defined','invariant','discretePhase','circularError']
 return[
 ('parameters',[['控件',k,v]for k,v in s['parameters'].items()]+[['模型',k,v]for k,v in s['model'].items()]),
 ('geometry-current',[[k,s['current'][k]]for k in geomKeys]),
 ('path',[at(q,['index','phi','chi','state','norm','connectionCoefficient','curvature'])+(at(s['current']['links'][i],['overlap','magnitude','phase'])if i<len(s['current']['links'])else[None,None,None])for i,q in enumerate(s['current']['nodes'])]),
 ('geometry-grid',[at(q,['N','defined','minOverlap','invariant','discretePhase','circularError'])for q in s['geometryScan']]),
 ('latitude',[at(q,['degrees','curvature','gamma','expected','invariant','circularError','defined'])for q in s['latitudeScan']]),
 ('gauge',[at(q,['a','connectionIntegral','endpointPhase','endpointCorrected','invariant','rawOpen'])for q in s['gaugeScan']]),
 ('surface',[at(q,['bins','midpointFlux','cellFlux','midpointChern','exactCellChern','bandChern'])for q in s['surfaceScan']]),
 ('dynamics-current',[[label,s['dynamics'][key],s['rescaled'][key]]for label,key in [('E','E'),('ω','omega'),('T','T'),('终态','state'),('范数平方','norm'),('上态投影概率','selectedUpperProbability'),('存活复振幅','survival'),('减参考动力学相位后的振幅','amplitude'),('可见度','visibility'),('Berry预测','berry'),('端口概率','port'),('绝热端口预测','adiabaticPort')]]),
 ('time',[at(q,['fraction','time','phi','state','norm','selectedLowerProbability','selectedUpperProbability','bloch','bandPopulationsDefined'])for q in s['timeScan']]),
 ('resolution',[at(q,['M','dt','state','norm','selectedUpperProbability','stateError','populationError'])for q in s['resolutionScan']]),
 ('speed',[at(q,['logSpeed','omega','T','selectedUpperProbability','amplitude','visibility','adiabaticAmplitudeError','port','adiabaticPort'])for q in s['speedScan']]),
 ('fringe',[at(q,['referencePhase','port','adiabaticPort'])for q in s['fringeScan']]),
 ('boundaries',list(map(list,s['boundaries'].items())))
 ]

NODE="const fs=require('fs'),a=require(process.argv[1]),f=require(process.argv[2]);\nfunction replay(x,y,path='root'){if(typeof y==='number'){if(typeof x!=='number'||!Number.isFinite(x)||(path.endsWith('.discretePhase')?(Math.abs(x)>Math.PI+3e-11||Math.abs(y)>Math.PI+3e-11||Math.abs(Math.atan2(Math.sin(x-y),Math.cos(x-y)))>3e-11+5e-10*Math.abs(y)):Math.abs(x-y)>3e-11+5e-10*Math.abs(y)))throw Error('Replay '+path);}else if(y!==null&&typeof y==='object'){if(!x||typeof x!=='object'||Array.isArray(x)!==Array.isArray(y)||JSON.stringify(Object.keys(x))!==JSON.stringify(Object.keys(y)))throw Error('Replay keys '+path);for(const k of Object.keys(y))replay(x[k],y[k],path+'.'+k);}else if(x!==y)throw Error('Replay scalar '+path);}\nlet circularReplay=0;replay({discretePhase:Math.PI},{discretePhase:-Math.PI});circularReplay++;for(const[x,y]of[[{discretePhase:Math.PI-.1},{discretePhase:-Math.PI}],[{port:2*Math.PI},{port:0}]]){try{replay(x,y)}catch(e){circularReplay++;}}if(circularReplay!==3)throw Error('Circular replay guards');\nconst cases=a.PRESETS.map(p=>a.compute(p.parameters));let invalid=0;\nfor(const[k,[lo,hi]]of Object.entries(a.LIMITS)){cases.push(a.compute({[k]:lo}),a.compute({[k]:hi}));for(const v of[lo-1,hi+1,lo+.5,'1',null,true,NaN,Infinity]){let bad=false;try{a.compute({[k]:v})}catch(e){bad=true}if(!bad)throw Error('Invalid accepted '+k);invalid++;}}\nfor(const v of[null,[],true,{unknown:1}]){let bad=false;try{a.compute(v)}catch(e){bad=true}if(!bad)throw Error('Bad object');invalid++;}\nfor(const r of f.records)replay(r.data,a.compute(r.data.parameters));\nconst observed=process.argv[3]?JSON.parse(fs.readFileSync(process.argv[3],'utf8')):[];for(const q of observed)replay(q,a.compute(q.parameters));\nlet feedback=0;for(let i=0;i<4;i++)for(let j=0;j<2;j++){if(a.feedback(i,j).correct!==(j===a.QUESTIONS[i][2]))throw Error('Feedback');feedback++;}\nconst snapshots=[...cases,...f.records.map(r=>r.data),...observed];const records=snapshots.map(snapshot=>({snapshot,plots:a.plots(snapshot),tables:a.tables(snapshot),svgs:a.plots(snapshot).map(a.svg)}));\nlet replayGuards=0;for(const change of[q=>q.schema='wrong',q=>q.parameters.timeLevel=99,q=>delete q.current,q=>q.current.gamma='0',q=>q.dynamics.port=NaN,q=>q.timeScan.pop(),q=>q.boundaries.finiteSpeedNotBerryPhase=false,q=>q.dynamics.state=null]){const q=JSON.parse(JSON.stringify(cases[0]));change(q);try{replay(q,cases[0])}catch(e){replayGuards++;}}if(replayGuards!==8)throw Error('Replay guard');\nfunction mountPresetNames(api){class E{constructor(tag,doc){this.tag=tag;this.ownerDocument=doc;this.children=[];this.attrs={};this._text='';this.classList={add(){}};}set textContent(v){this._text=String(v);this.children=[];}get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}append(...xs){this.children.push(...xs);}replaceChildren(...xs){this._text='';this.children=[...xs];}setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return Object.hasOwn(this.attrs,k)?this.attrs[k]:null;}removeAttribute(k){delete this.attrs[k];}addEventListener(){}}const doc={createElement(t){return new E(t,this)},querySelector(){return null}};doc.head=new E('head',doc);const root=new E('div',doc);api.mount(root);const all=[];function visit(e){if(e.getAttribute('data-preset')!==null)all.push(e);e.children.forEach(visit)}visit(root);if(all.length!==api.PRESETS.length)throw Error('Preset count');all.forEach((b,i)=>{const name=api.PRESETS[i].name;if(typeof name!=='string'||!name.trim()||b.textContent.trim()!==name)throw Error('Missing name')});return all.length;}\nconst mountLabels=mountPresetNames(a),source=fs.readFileSync(process.argv[1],'utf8'),needle='},p.name);';if(!source.includes(needle))throw Error('Name field');const sandbox={module:{exports:{}}};require('vm').runInNewContext(source.replace(needle,'},p.label);'),sandbox);let mountMutations=0;try{mountPresetNames(sandbox.module.exports)}catch(e){mountMutations++;}if(mountMutations!==1)throw Error('Name mutation');\nconsole.log(JSON.stringify({records,live:cases.length,frozen:f.records.length,observed:observed.length,circularReplay,invalid,feedback,replayGuards,mountLabels,mountMutations,self:a.selfTest()}));\n"
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
 root=Path(__file__).resolve().parents[1];js=Path(sys.argv[1]).resolve()if len(sys.argv)>1 else root/'course-shared/labs/scalar-berry.js';fixture=Path(sys.argv[2]).resolve()if len(sys.argv)>2 else root/'course-shared/projects/berry-certificates/run-snapshot.json'
 f=json.loads(fixture.read_text());assert f['provenance']['sourceSha256']==hashlib.sha256(js.read_bytes()).hexdigest();assert len(f['records'])==6
 args=[str(js),str(fixture)]+([str(Path(sys.argv[3]).resolve())]if len(sys.argv)>3 else[]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
 result=json.loads(subprocess.check_output(prefix+['node','-e',NODE,*args],text=True));coords=markers=ledgerRows=0
 for r in result['records']:review(r['snapshot']);viewcheck(r)
 specimens={r['key']:r['data']for r in f['records']};mutations=0
 edits=[
 ('default',lambda q:q['current'].__setitem__('curvature',-q['current']['curvature'])),
 ('twist',lambda q:q['current'].__setitem__('endpointCorrected',[1,0])),
 ('twist',lambda q:q['current'].__setitem__('endpointPhase',0)),
 ('orthogonal',lambda q:q['current'].__setitem__('defined',True)),
 ('closedgap',lambda q:q['model'].__setitem__('isolatedBand',True)),
 ('closedgap',lambda q:q['dynamics'].__setitem__('berry',[1,0])),
 ('default',lambda q:q['surfaceScan'][0].__setitem__('bandChern',0)),
 ('default',lambda q:q['current']['nodes'][0].__setitem__('norm',2)),
 ('fast',lambda q:q['timeScan'][64].__setitem__('selectedUpperProbability',0)),
 ('fast',lambda q:q['dynamics']['state'][0].__setitem__(0,0)),
 ('coarse',lambda q:q['numerical'].__setitem__('stateError',0)),
 ('coarse',lambda q:q['resolutionScan'][0].__setitem__('norm',0)),
 ('fast',lambda q:q['dynamics'].__setitem__('amplitude',[1,0])),
 ('fast',lambda q:q['fringeScan'][0].__setitem__('port',0)),
 ('default',lambda q:q['gaugeScan'][100].__setitem__('invariant',[0,0])),
 ('default',lambda q:q['latitudeScan'][40].__setitem__('curvature',0)),
 ('default',lambda q:q['current']['links'][0].__setitem__('phase',0)),
 ('default',lambda q:q['timeScan'][64].__setitem__('leakageEnvelope',0)),
 ('default',lambda q:q['rescaled'].__setitem__('T',2*q['rescaled']['T'])),
 ('default',lambda q:q['boundaries'].__setitem__('finiteSpeedNotBerryPhase',False))]
 for key,edit in edits:
  q=copy.deepcopy(specimens[key]);edit(q)
  try:review(q)
  except(AssertionError,TypeError,KeyError,ValueError,ZeroDivisionError):mutations+=1
  else:raise AssertionError('Undetected mutation '+key)
 assert result['invalid']==92 and result['feedback']==8 and result['mountLabels']==12 and result['mountMutations']==1 and result['replayGuards']==8
 print(json.dumps(dict(status='PASS',records=result['live'],frozen=result['frozen'],observed=result['observed'],circularReplay=result['circularReplay'],checks=checks,plotCoordinates=coords,markers=markers,ledgerRows=ledgerRows,invalid=result['invalid'],feedback=result['feedback'],mutations=mutations,mountLabels=result['mountLabels'],mountMutations=result['mountMutations'],replayGuards=result['replayGuards'],self=result['self']['checks'])))
