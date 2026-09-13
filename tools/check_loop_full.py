#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Independent Euclidean x integration, using 160-point Gauss-Legendre quadrature."""
import math
checks=integrals=0
def close(a,b,label='',atol=3e-12,rtol=3e-9):
 global checks
 if isinstance(b,(list,tuple)):
  assert isinstance(a,(list,tuple))and len(a)==len(b),(label,'shape')
  for x,y in zip(a,b):close(x,y,label,atol,rtol)
 elif isinstance(b,dict):
  assert isinstance(a,dict)and list(a)==list(b),(label,'keys')
  for k in b:close(a[k],b[k],label+'.'+k,atol,rtol)
 elif b is None:assert a is None,(label,a,b)
 elif isinstance(b,(bool,str)):assert type(a)==type(b)and a==b,(label,a,b)
 else:assert isinstance(a,(float,int))and not isinstance(a,bool)and math.isfinite(a)and abs(a-b)<=atol+rtol*abs(b),(label,a,b)
 checks+=1
def gauss(n):
 nodes=[]
 for i in range((n+1)//2):
  z=math.cos(math.pi*(i+.75)/(n+.5))
  for _ in range(30):
   p0,p1=1.,z
   for k in range(2,n+1):p0,p1=p1,((2*k-1)*z*p1-(k-1)*p0)/k
   derivative=n*(z*p1-p0)/(z*z-1);new=z-p1/derivative
   if abs(new-z)<2e-16:z=new;break
   z=new
  p0,p1=1.,z
  for k in range(2,n+1):p0,p1=p1,((2*k-1)*z*p1-(k-1)*p0)/k
  derivative=n*(z*p1-p0)/(z*z-1);weight=1/((1-z*z)*derivative*derivative)
  nodes.extend([((1-z)/2,weight),((1+z)/2,weight)])
 assert abs(sum(v for x,v in nodes)-1)<3e-14
 return sorted(nodes)
GAUSS=gauss(160)
def integral(f):
 global integrals
 integrals+=1;return math.fsum(weight*f(x)for x,weight in GAUSS)
DEN=16*math.pi**2
def bracket(r):return math.log1p(r)-r/(1+r)
def bubble(m,Q,L):return integral(lambda x:bracket(L*L/(m*m+x*(1-x)*Q*Q)))/DEN
def subtraction(m,Q,Q0,L,continuum_needed=True):
 def values(x):
  t=x*(1-x);M0=m*m+t*Q0*Q0;d=t*(Q*Q-Q0*Q0);M=M0+d;return M0,d,M
 continuum=-integral(lambda x:math.log1p(values(x)[1]/values(x)[0]))/DEN if continuum_needed else None
 correction=integral(lambda x:math.log1p(values(x)[1]/(L*L+values(x)[0]))+L*L*values(x)[1]/((L*L+values(x)[0])*(L*L+values(x)[2])))/DEN
 return continuum,correction
def matching(m,Q,Q0,Q1,g,c,q):
 D0=subtraction(m,Q,Q0,1)[0];D10=subtraction(m,Q1,Q0,1)[0];D1=subtraction(m,Q,Q1,1)[0];g1=g+c*g*g*D10;F0=g+c*g*g*D0;F1=g1+c*g1*g1*D1;higher=2*c*c*g**3*D10*D1+c**3*g**4*D10*D10*D1
 for k,v in dict(g=g,c=c,Q0=Q0,Q1=Q1,Q=Q,D0=D0,D10=D10,D1=D1,g1=g1,F0=F0,F1=F1,order2=F0,higherOrder=higher,directDifference=F1-F0,relativeLoopSize=None if g==0 else abs(c*g*D0)).items():close(q[k],v,'matching '+k)
 assert q['completeTheoryBetaFunction']is False
def quadrature(m,Q,Q0,L,N,q,save):
 rows=[]
 for i in range(N+1):
  x=i/N;t=x*(1-x);M=m*m+t*Q*Q;M0=m*m+t*Q0*Q0
  b=bracket(L*L/M)/DEN;b0=bracket(L*L/M0)/DEN;weight=1 if i in[0,N]else 4 if i%2 else 2
  row=dict(index=i,x=x,weight=weight,massSquared=M,referenceMassSquared=M0,integrand=b,referenceIntegrand=b0,difference=b-b0,weightedDifference=weight*(b-b0)/(3*N));rows.append(row)
  if save:
   assert len(q['nodes'])==N+1
   for k,v in row.items():close(q['nodes'][i][k],v,'node '+k)
 close([q['bubble'],q['reference'],q['difference']],[math.fsum(r['weight']*r[k]for r in rows)/(3*N)for k in ['integrand','referenceIntegrand','difference']],'Simpson values')
def review(s):
 assert s['schema']=='loop206-v1';c=s['parameters'];m=s['model']['m'];Q=s['model']['Q'];Q0=s['model']['Q0'];Q1=s['model']['Q1'];L=s['model']['L'];g=s['model']['g'];coef=s['model']['c'];N=s['model']['N'];rho=s['model']['rho'];kappa=s['model']['kappa'];alpha=s['model']['alpha'];cur=s['current']
 close([m,Q,Q0,Q1,L,g,coef,N,rho,kappa,alpha],[c['massTenths']/10,c['qQuarters']/4,c['referenceQuarters']/4,c['newReferenceQuarters']/4,10**(c['cutoffLogTenths']/10),c['couplingHundredths']/100,c['coefficientTenths']/10,16*2**c['quadratureLevel'],c['mismatchTenths']/10,c['kappaTenths']/10,c['alphaTenths']/10],'parameters')
 cont,corr=subtraction(m,Q,Q0,L);BQ=bubble(m,Q,L);B0=bubble(m,Q0,L)
 close([s['model']['radialAngularFactor'],s['model']['parameterFactor']],[1/(8*math.pi**2),1/DEN],'angular factors')
 close([cur['cutoffBound'],cur['leadingCorrection']],[abs(Q*Q-Q0*Q0)/(48*math.pi**2*L*L),(Q*Q-Q0*Q0)/(48*math.pi**2*L*L)],'current bound')
 assert len(s['cutoffScan'])==97 and len(s['quadratureScan'])==7 and len(s['referenceScan'])==41
 close([cur[k]for k in ['continuum','correction','finite','bubble','reference','directFiniteDifference']],[cont,corr,cont+corr,BQ,B0,BQ-B0],'main integrals')
 quadrature(m,Q,Q0,L,N,cur['quadrature'],True)
 close([cur['quadratureError'],cur['totalNumericalError']],[cur['quadrature']['difference']-cont-corr,cur['quadrature']['difference']-cont],'separate errors')
 close(cur['mismatched'],BQ-bubble(m,Q0,rho*L),'mismatch');close(cur['mismatchLimit'],cont-math.log(rho)/(8*math.pi**2),'mismatch limit')
 g0=g-coef*g*g*B0;close([cur['bareOrder2'],cur['renormalizedOrder2'],cur['naiveBareSubstitution']],[g0,g+coef*g*g*(cont+corr),g0+coef*g0*g0*BQ],'fixed order bare bookkeeping')
 assert cur['quadrature']['N']==N
 matching(m,Q,Q0,Q1,g,coef,s['matching'])
 for i,q in enumerate(s['cutoffScan']):
  close(q['logCutoff'],i/16);cutoff=10**(i/16);continuum,correction=subtraction(m,Q,Q0,cutoff);movingQ=kappa*cutoff;_,moving=subtraction(m,movingQ,0,cutoff,continuum_needed=False);bound=abs(Q*Q-Q0*Q0)/(48*math.pi**2*cutoff**2)
  close([q[k]for k in ['cutoff','continuum','finite','correction','bubble','reference','cutoffBound','leadingCorrection','mismatched','movingQ','movingCorrection','movingBound']],[cutoff,continuum,continuum+correction,correction,bubble(m,Q,cutoff),bubble(m,Q0,cutoff),bound,(Q*Q-Q0*Q0)/(48*math.pi**2*cutoff**2),bubble(m,Q,cutoff)-bubble(m,Q0,rho*cutoff),movingQ,moving,kappa*kappa/(48*math.pi**2)],'cutoff scan')
  assert abs(correction)<=bound+2e-14
  close(q['correction'],correction,'strict cutoff correction',atol=1e-30,rtol=2e-8)
 for i,q in enumerate(s['quadratureScan']):
  assert q['level']==i and q['N']==16*2**i;quadrature(m,Q,Q0,L,q['N'],q,False);close(q['error'],q['difference']-cont-corr,'quadrature error')
 for i,q in enumerate(s['referenceScan']):matching(m,Q,Q0,i/4,g,coef,q)
 rs=s['rescaled'];close([rs['mass'],rs['Q'],rs['Q0'],rs['Q1'],rs['cutoff'],rs['alpha']],[alpha*m,alpha*Q,alpha*Q0,alpha*Q1,alpha*L,alpha],'units');close([rs['bubble'],rs['reference']],[BQ,B0],'unit invariance');close([rs['subtraction']['continuum'],rs['subtraction']['correction'],rs['subtraction']['finite']],[cont,corr,cont+corr],'unit subtraction');close([rs['subtraction']['cutoffBound'],rs['subtraction']['leadingCorrection']],[cur['cutoffBound'],cur['leadingCorrection']],'unit bound');matching(alpha*m,alpha*Q,alpha*Q0,alpha*Q1,g,coef,rs['matching'])
 limit=integral(lambda x:math.log1p(kappa*kappa*x*(1-x))+kappa*kappa*x*(1-x)/(1+kappa*kappa*x*(1-x)))/DEN;close(s['movingLimit'],limit,'moving limit')
 close([s['lowMomentum'][k]for k in ['QOverMass','exactZeroReference','leading']],[Q/m,subtraction(m,Q,0,L)[0],-Q*Q/(96*math.pi**2*m*m)],'low momentum');assert s['lowMomentum']['requiresSmallRatio']is True
 assert len(s['boundaries'])==12 and all(s['boundaries'].values())

def expected_plots(s):
 scan=lambda key:[[q['logCutoff'],q[key]]for q in s['cutoffScan']]
 flat=lambda value:[[0,value],[6,value]]
 log=lambda rows:[None if y==0 else[x,math.log10(abs(y))]for x,y in rows]
 specs=[
 ('subtraction',[0,6],[scan('bubble'),scan('reference'),scan('finite'),flat(s['current']['continuum'])]),
 ('cutoff',[0,6],[log(scan('correction')),log(scan('cutoffBound'))]),
 ('quadrature',[4,10],[log([[math.log2(q['N']),q['error']]for q in s['quadratureScan']])]),
 ('prescription',[0,6],[scan('finite'),scan('mismatched'),flat(s['current']['continuum']),flat(s['current']['mismatchLimit'])]),
 ('matching',[0,10],[[[q['Q1'],q[k]-q['F0']if k=='order2'else q[k]]for q in s['referenceScan']]for k in ['order2','directDifference','higherOrder']]),
 ('moving',[0,6],[scan('correction'),scan('movingCorrection'),flat(s['movingLimit']),flat(s['model']['kappa']**2/(48*math.pi**2))])]
 out=[]
 for key,domain,series in specs:
  ys=[p[1]for row in series for p in row if p is not None];lo=min([0]+ys);hi=max([0]+ys)
  if hi==lo:hi=lo+1
  pad=.07*(hi-lo);out.append((key,domain,[lo-pad,hi+pad],series))
 return out
def expected_tables(s):
 cur=s['current'];match=s['matching'];keys=['g','c','Q0','Q1','Q','D0','D10','D1','g1','F0','F1','order2','higherOrder','directDifference','relativeLoopSize']
 extract=lambda q,ks:[q[k]for k in ks]
 return[
 ('parameters',[['控件',k,v]for k,v in s['parameters'].items()]+[['模型',k,v]for k,v in s['model'].items()]),
 ('current',[[k,v]for k,v in cur.items()if k!='quadrature']),
 ('quadrature-current',[extract(cur['quadrature'],['N','bubble','reference','difference'])]),
 ('nodes',[extract(q,['index','x','weight','massSquared','referenceMassSquared','integrand','referenceIntegrand','difference','weightedDifference'])for q in cur['quadrature']['nodes']]),
 ('cutoff',[extract(q,['logCutoff','cutoff','bubble','reference','finite','continuum','correction','cutoffBound','leadingCorrection','mismatched','movingQ','movingCorrection','movingBound'])for q in s['cutoffScan']]),
 ('quadrature',[extract(q,['level','N','bubble','reference','difference','error'])for q in s['quadratureScan']]),
 ('matching',[[k,match[k]]for k in keys]),
 ('reference',[extract(q,keys)for q in s['referenceScan']]),
 ('units',[['m',s['model']['m'],s['rescaled']['mass']],['Q',s['model']['Q'],s['rescaled']['Q']],['Q₀',s['model']['Q0'],s['rescaled']['Q0']],['Q₁',s['model']['Q1'],s['rescaled']['Q1']],['Λ',s['model']['L'],s['rescaled']['cutoff']],['B(Q)',cur['bubble'],s['rescaled']['bubble']],['B(Q₀)',cur['reference'],s['rescaled']['reference']]]+[[k,cur[k],s['rescaled']['subtraction'][k]]for k in ['continuum','finite','correction','cutoffBound','leadingCorrection']]+[[k,match[k],s['rescaled']['matching'][k]]for k in keys if k not in ['Q','Q0','Q1']]),
 ('limits',[['固定动量，同截断',cur['continuum'],'m>0，Q和Q₀固定'],['参考截断ρΛ',cur['mismatchLimit'],'ρ固定，需要另做参数匹配'],['Q=κΛ的余项',s['movingLimit'],'Q₀=0，κ固定']]),
 ('low-momentum',[[s['lowMomentum']['QOverMass'],s['lowMomentum']['exactZeroReference'],s['lowMomentum']['leading'],'Q/m远小于1；不能外推到大Q']]),
 ('boundaries',list(map(list,s['boundaries'].items())))
 ]

NODE="const fs=require('fs'),a=require(process.argv[1]),f=require(process.argv[2]);\nfunction replay(x,y,path='root'){if(typeof y==='number'){if(typeof x!=='number'||!Number.isFinite(x)||Math.abs(x-y)>3e-11+5e-10*Math.abs(y))throw Error('Replay '+path);}else if(y!==null&&typeof y==='object'){if(!x||typeof x!=='object'||Array.isArray(x)!==Array.isArray(y)||JSON.stringify(Object.keys(x))!==JSON.stringify(Object.keys(y)))throw Error('Replay keys '+path);for(const k of Object.keys(y))replay(x[k],y[k],path+'.'+k);}else if(x!==y)throw Error('Replay scalar '+path);}\nconst cases=a.PRESETS.map(p=>a.compute(p.parameters));let invalid=0;\nfor(const[k,[lo,hi]]of Object.entries(a.LIMITS)){cases.push(a.compute({[k]:lo}),a.compute({[k]:hi}));for(const v of[lo-1,hi+1,lo+.5,'1',null,true,NaN,Infinity]){let bad=false;try{a.compute({[k]:v})}catch(e){bad=true}if(!bad)throw Error('Invalid accepted '+k);invalid++;}}\nfor(const v of[null,[],true,{unknown:1}]){let bad=false;try{a.compute(v)}catch(e){bad=true}if(!bad)throw Error('Bad object');invalid++;}\nfor(const r of f.records)replay(r.data,a.compute(r.data.parameters));\nconst observed=process.argv[3]?JSON.parse(fs.readFileSync(process.argv[3],'utf8')):[];for(const q of observed)replay(q,a.compute(q.parameters));\nlet feedback=0;for(let i=0;i<4;i++)for(let j=0;j<2;j++){if(a.feedback(i,j).correct!==(j===a.QUESTIONS[i][2]))throw Error('Feedback');feedback++;}\nconst snapshots=[...cases,...f.records.map(r=>r.data),...observed];const records=snapshots.map(snapshot=>({snapshot,plots:a.plots(snapshot),tables:a.tables(snapshot),svgs:a.plots(snapshot).map(a.svg)}));\nlet replayGuards=0;for(const change of[q=>q.schema='wrong',q=>q.parameters.quadratureLevel=99,q=>delete q.current,q=>q.current.finite='0',q=>q.current.correction=NaN,q=>q.cutoffScan.pop(),q=>q.boundaries.samePrescriptionRequired=false,q=>q.current.quadrature=null]){const q=JSON.parse(JSON.stringify(cases[0]));change(q);try{replay(q,cases[0])}catch(e){replayGuards++;}}if(replayGuards!==8)throw Error('Replay guard');\nfunction mountPresetNames(api){class E{constructor(tag,doc){this.tag=tag;this.ownerDocument=doc;this.children=[];this.attrs={};this._text='';this.classList={add(){}};}set textContent(v){this._text=String(v);this.children=[];}get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}append(...xs){this.children.push(...xs);}replaceChildren(...xs){this._text='';this.children=[...xs];}setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return Object.hasOwn(this.attrs,k)?this.attrs[k]:null;}removeAttribute(k){delete this.attrs[k];}addEventListener(){}}const doc={createElement(t){return new E(t,this)},querySelector(){return null}};doc.head=new E('head',doc);const root=new E('div',doc);api.mount(root);const all=[];function visit(e){if(e.getAttribute('data-preset')!==null)all.push(e);e.children.forEach(visit)}visit(root);if(all.length!==api.PRESETS.length)throw Error('Preset count');all.forEach((b,i)=>{const name=api.PRESETS[i].name;if(typeof name!=='string'||!name.trim()||b.textContent.trim()!==name)throw Error('Missing name')});return all.length;}\nconst mountLabels=mountPresetNames(a),source=fs.readFileSync(process.argv[1],'utf8'),needle='},p.name);';if(!source.includes(needle))throw Error('Name field');const sandbox={module:{exports:{}}};require('vm').runInNewContext(source.replace(needle,'},p.label);'),sandbox);let mountMutations=0;try{mountPresetNames(sandbox.module.exports)}catch(e){mountMutations++;}if(mountMutations!==1)throw Error('Name mutation');\nconsole.log(JSON.stringify({records,live:cases.length,frozen:f.records.length,observed:observed.length,invalid,feedback,replayGuards,mountLabels,mountMutations,self:a.selfTest()}));\n"
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
 assert len(record['tables'])==12

if __name__=='__main__':
 import sys,json,hashlib,subprocess,shutil,re,copy
 import xml.etree.ElementTree as ET
 from pathlib import Path
 root=Path(__file__).resolve().parents[1];js=Path(sys.argv[1]).resolve()if len(sys.argv)>1 else root/'course-shared/labs/scalar-loop-subtraction.js';fixture=Path(sys.argv[2]).resolve()if len(sys.argv)>2 else root/'course-shared/projects/loop-certificates/run-snapshot.json'
 f=json.loads(fixture.read_text());assert f['provenance']['sourceSha256']==hashlib.sha256(js.read_bytes()).hexdigest();assert len(f['records'])==6
 args=[str(js),str(fixture)]+([str(Path(sys.argv[3]).resolve())]if len(sys.argv)>3 else[]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
 result=json.loads(subprocess.check_output(prefix+['node','-e',NODE,*args],text=True));coords=markers=ledgerRows=0
 for r in result['records']:review(r['snapshot']);viewcheck(r)
 specimens={r['key']:r['data']for r in f['records']};mutations=0
 edits=[
 ('default',lambda q:q['current'].__setitem__('finite',0)),
 ('default',lambda q:q['current'].__setitem__('continuum',0)),
 ('default',lambda q:q['current'].__setitem__('cutoffBound',0)),
 ('default',lambda q:q['current'].__setitem__('quadratureError',.1)),
 ('quadrature',lambda q:q['current']['quadrature']['nodes'][1].__setitem__('weight',2)),
 ('quadrature',lambda q:q['current']['quadrature']['nodes'][1].__setitem__('weightedDifference',0)),
 ('mismatch',lambda q:q['current'].__setitem__('mismatchLimit',q['current']['continuum'])),
 ('matching',lambda q:q['matching'].__setitem__('g1',q['matching']['g'])),
 ('matching',lambda q:q['matching'].__setitem__('higherOrder',0)),
 ('matching',lambda q:q['matching'].__setitem__('order2',0)),
 ('moving',lambda q:q.__setitem__('movingLimit',0)),
 ('moving',lambda q:q['cutoffScan'][80].__setitem__('movingCorrection',0)),
 ('default',lambda q:q['cutoffScan'][96].__setitem__('correction',0)),
 ('quadrature',lambda q:q['quadratureScan'][0].__setitem__('difference',0)),
 ('matching',lambda q:q['referenceScan'][20].__setitem__('D10',0)),
 ('units',lambda q:q['rescaled'].__setitem__('cutoff',q['model']['L'])),
 ('default',lambda q:q['current'].__setitem__('bareOrder2',q['model']['g'])),
 ('default',lambda q:q['boundaries'].__setitem__('fixedMomentumForCutoffLimit',False))]
 for key,edit in edits:
  q=copy.deepcopy(specimens[key]);edit(q)
  try:review(q)
  except(AssertionError,TypeError,KeyError,ValueError,ZeroDivisionError):mutations+=1
  else:raise AssertionError('Undetected mutation '+key)
 assert result['invalid']==92 and result['feedback']==8 and result['mountLabels']==12 and result['mountMutations']==1 and result['replayGuards']==8
 print(json.dumps(dict(status='PASS',records=result['live'],frozen=result['frozen'],observed=result['observed'],checks=checks,plotCoordinates=coords,markers=markers,ledgerRows=ledgerRows,invalid=result['invalid'],feedback=result['feedback'],mutations=mutations,mountLabels=result['mountLabels'],mountMutations=result['mountMutations'],replayGuards=result['replayGuards'],self=result['self']['checks'])))
