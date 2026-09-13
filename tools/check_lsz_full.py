#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Independent local complex LSZ reference using Python standard library."""
import cmath,math
checks=0
def close(a,b,label='',atol=1e-10,rtol=2e-8):
 global checks
 if isinstance(b,(list,tuple)):
  assert isinstance(a,(list,tuple))and len(a)==len(b),(label,'shape')
  for x,y in zip(a,b):close(x,y,label,atol,rtol)
 elif isinstance(b,dict):
  assert isinstance(a,dict)and list(a)==list(b),(label,'keys')
  for k in b:close(a[k],b[k],label+'.'+k,atol,rtol)
 elif b is None:assert a is None,(label,a,b)
 elif isinstance(b,(bool,str)):assert type(a)==type(b)and a==b,(label,a,b)
 elif isinstance(b,complex):
  assert isinstance(a,list)and len(a)==2,(label,'complex shape')
  assert abs(complex(*a)-b)<=atol+rtol*abs(b),(label,a,b)
 else:assert math.isfinite(a)and abs(a-b)<=atol+rtol*abs(b),(label,a,b)
 checks+=1
def desc(a,b,label):
 close(a['value'],b,label);mag=abs(b)if b is not None else None
 close(a['magnitude'],mag,label+' modulus')
 if mag in[None,0]:assert a['phase']is None and a['logMagnitude']is None
 else:
  # Angles differing by 2pi describe the same phase.
  assert abs(cmath.exp(1j*a['phase'])-b/abs(b))<3e-8,(label,'phase')
  close(a['logMagnitude'],math.log10(abs(b)),label+' log',atol=1e-8)
def evaluate(m,d,e,alpha=1):
 # Decimal arithmetic isolates cancellation in the propagator before conversion
 # to the independent Python-complex calculation of products and amputations.
 from decimal import Decimal,localcontext
 with localcontext()as ctx:
  ctx.prec=90;D=lambda x:Decimal(str(x));Z,R,A=D(m['Z']),D(m['R']),D(alpha)
  props=[]
  for weight in m['weights']:
   x,y=D(weight)*D(d),D(e);den=x*x+y*y
   props.append(complex(float(A*A*Z*y/den),float(A*A*(Z*x/den+R))))
 Z=m['Z']*alpha**2;K=-1j*m['lambda']/alpha**4;B=m['B']*alpha**4;ex=math.prod(props);G=K*ex+1j*B
 direct=G*math.prod(-1j*weight*d/math.sqrt(Z)for weight in m['weights']);reg=G*math.prod((e-1j*weight*d)/math.sqrt(Z)for weight in m['weights'])
 gamma=None if ex==0 else G/ex;full=None if gamma is None else Z*Z*gamma;target=Z*Z*K
 return props,G,gamma,full,direct,reg,target
def inspect(q,m):
 d,e,alpha=q['delta'],q['eta'],q['alpha'];props,G,gamma,full,direct,reg,target=evaluate(m,d,e,alpha)
 for key,value in [('residue',m['Z']*alpha**2),('regular',m['R']*alpha**2),('contact',m['B']*alpha**4),('kernel',-1j*m['lambda']/alpha**4)]:close(q[key],value,'metadata '+key)
 desc(q['external'],math.prod(props),'external product')
 for i,(p,v)in enumerate(zip(q['legs'],props)):
  close(p['propagator'],v,'D'+str(i));close(p['inverse'],None if v==0 else 1/v,'D inverse')
  dj=d*m['weights'][i];Z=m['Z']*alpha**2
  assert p['leg']==i+1 and p['weight']==m['weights'][i]
  for key,value in [('delta',dj),('eta',e),('residue',Z),('pole',1j*Z/complex(dj,e)),('regular',1j*m['R']*alpha**2),('lszFactor',-1j*dj/math.sqrt(Z)),('regulatedFactor',(e-1j*dj)/math.sqrt(Z))]:close(p[key],value,'leg '+key)
 for key,value in [('green',G),('gamma',gamma),('full',full),('direct',direct),('regulated',reg),('target',target),('amplitude',-1j*target)]:desc(q[key],value,key)
 for key,value in [('fullError',full),('directError',direct),('regulatedError',reg)]:
  close(q[key],None if value is None else abs(value-target),'measured '+key)
  assert q[key]is None or q[key]>=0
 current=G
 for k,p in enumerate(q['sequence']):
  if k:current=None if current is None or props[k-1]==0 else current/props[k-1]
  assert p['removed']==k;desc(p,current,'partial'+str(k))
def review(s):
 assert s['schema']=='lsz205-v1';c=s['parameters'];m=s['model']
 for k,control in [('lambda','lambdaTenths'),('Z','residueTenths'),('R','regularTenths'),('B','contactTenths')]:close(m[k],c[control]/10,'model '+k)
 assert m['weights']==([1,2,3,4]if c['unequal']else[1,1,1,1])and m['referenceMassFactored']is True and m['physicalKinematics']is False
 for q,alpha in [(s['current'],1),(s['rescaled'],c['alphaTenths']/10)]:
  close(q['delta'],10**-c['deltaPower'],'controlled delta',atol=0);close(q['eta'],10**-c['etaPower'],'controlled eta',atol=0);close(q['alpha'],alpha,'controlled alpha');inspect(q,m)
 assert len(s['deltaScan'])==len(s['pathScan'])==193 and len(s['alphaScan'])==30
 for key in ['full','direct','regulated','target','amplitude']:
  close(s['rescaled'][key]['value'],complex(*s['current'][key]['value']),'field-invariant '+key)
 for i,q in enumerate(s['deltaScan']):
  close(q['power'],i/16,'scan power');close(q['delta'],10**(-i/16),'scan delta',atol=0);close(q['eta'],s['current']['eta'],'scan eta',atol=0)
  props,G,gamma,full,direct,reg,target=evaluate(m,q['delta'],q['eta'])
  for key,value in [('raw',G),('gamma',gamma),('full',full),('direct',direct),('regulated',reg),('target',target)]:desc(q[key],value,'scan '+key)
  partial=G
  for prop in props[:c['removed']]:partial=None if partial is None or prop==0 else partial/prop
  assert q['partial']['removed']==c['removed'];desc(q['partial'],partial,'scan partial')
  for key,value in [('fullError',full),('directError',direct),('regulatedError',reg)]:
   close(q[key],None if value is None else abs(value-target),'scan '+key)
   assert q[key]is None or q[key]>=0
 for i,q in enumerate(s['pathScan']):
  close(q['power'],i/16,'path power');close(q['delta'],10**(-i/16),'path delta',atol=0)
  d=q['delta']
  for key,e in [('fixedEta',s['current']['eta']),('equalEta',d),('fasterEta',d*d),('poleFirst',0)]:desc(q[key],evaluate(m,d,e)[4],'path '+key)
 for i,q in enumerate(s['alphaScan']):
  close(q['alpha'],(i+1)/10,'alpha point');close(q['residue'],m['Z']*q['alpha']**2,'alpha residue')
  _,G,gamma,full,direct,_,target=evaluate(m,s['current']['delta'],s['current']['eta'],q['alpha'])
  for key,v in [('green',G),('gamma',gamma),('full',full),('direct',direct),('target',target)]:desc(q[key],v,'alpha '+key)
 for q in s['limits']['pathLimits']:
  factor=math.prod(wt/(wt+1j*q['ratio'])for wt in m['weights']);close(q['factor'],factor,'path factor');desc(q['limit'],-1j*m['lambda']*m['Z']**2*factor,'path limit')
 close(s['limits']['etaFirstThenDelta'],-1j*m['lambda']*m['Z']**2,'ordered limit');close(s['limits']['deltaFirstThenEta'],0j,'reversed limit');assert s['limits']['stableIsolatedParticleRequired']and s['limits']['finiteRegulatorNotWidth']
 for i,q in enumerate(s['legChecks']):
  leg=s['current']['legs'][i];D=complex(*leg['propagator']);a=c['alphaTenths']/10;assert q['leg']==i+1
  for k,value in [('propagatorInverse',1+0j),('poleExtraction',D*complex(*leg['lszFactor'])),('regulatedExtraction',D*complex(*leg['regulatedFactor'])),('rescaledPropagator',D*a*a),('expectedRescaledPropagator',D*a*a)]:close(q[k],value,'leg check '+k)
 assert len(s['boundaries'])==12 and all(s['boundaries'].values())

"""Independently map scientific records into plot series and complete ledgers."""
def expected_plots(s):
 at=lambda key,field:[[p['power'],p[key][field]]if p[key][field]is not None else None for p in s['deltaScan']]
 imag=lambda rows,key:[[p['power'],p[key]['value'][1]]if p[key]['value']is not None else None for p in rows]
 error=lambda key:[[p['power'],math.log10(p[key])]if p[key]is not None and p[key]>0 else None for p in s['deltaScan']]
 al=lambda key:[[p['alpha'],p[key]['logMagnitude']]if p[key]['logMagnitude']is not None else None for p in s['alphaScan']]
 plane=[p['direct']['value']for p in s['deltaScan']];target=s['current']['target']['value'];current=s['current']['direct']['value'];xs=[p[0]for p in plane];lo=min([0,target[0]]+xs);hi=max([0,target[0]]+xs)
 if lo==hi:lo-=1;hi+=1
 pad=.07*(hi-lo);domain=[lo-pad,hi+pad]
 specs=[
 ('legs',[0,12],[at('raw','logMagnitude'),at('partial','logMagnitude'),at('gamma','logMagnitude')]),
 ('residue',[0,12],[imag(s['deltaScan'],'direct'),imag(s['deltaScan'],'regulated'),imag(s['deltaScan'],'full'),[[0,target[1]],[12,target[1]]]]),
 ('paths',[0,12],[imag(s['pathScan'],k)for k in ['fixedEta','equalEta','fasterEta','poleFirst']]),
 ('error',[0,12],[error(k)for k in ['directError','regulatedError','fullError']]),
 ('rescale',[.1,3],[al(k)for k in ['green','gamma','full']]),
 ('phase',domain,[plane,[current],[target]])]
 out=[]
 for key,domain,series in specs:
  ys=[p[1]for line in series for p in line if p is not None];lo=min([0]+ys);hi=max([0]+ys)
  if hi==lo:hi=lo+1
  pad=.07*(hi-lo);yrange=[lo-pad,hi+pad]
  if key=='phase':
   xc=sum(domain)/2;yc=sum(yrange)/2;span=max(domain[1]-domain[0],(yrange[1]-yrange[0])*755/290);domain=[xc-span/2,xc+span/2];yrange=[yc-span*290/755/2,yc+span*290/755/2]
  out.append((key,domain,yrange,series))
 return out
def expected_tables(s):
 cur=s['current'];rs=s['rescaled'];a=rs['alpha'];keys=['green','gamma','full','direct','regulated','target','amplitude']
 values=lambda q:[q[k]for k in ['value','magnitude','phase','logMagnitude']]
 scaling=lambda v,x:[p*x for p in v]
 return[
 ('parameters',[['控件',k,v]for k,v in s['parameters'].items()]+[['模型',k,v]for k,v in s['model'].items()]+[['格式','复数','[实部, 虚部]'],['格式','相位单位','弧度；零复数相位不适用']]),
 ('legs',[[q[k]for k in ['leg','weight','delta','eta','residue','pole','regular','propagator','inverse','lszFactor','regulatedFactor']]for q in cur['legs']]),
 ('partial',[[q['removed']]+values(q)for q in cur['sequence']]),
 ('current',[[k]+values(cur[k])for k in keys]),
 ('rescaled',[['α',1,a,a],['Z',cur['residue'],rs['residue'],cur['residue']*a*a],['R',cur['regular'],rs['regular'],cur['regular']*a*a],['B',cur['contact'],rs['contact'],cur['contact']*a**4],['核K',cur['kernel'],rs['kernel'],scaling(cur['kernel'],a**-4)]]+[[k,cur[k]['value'],rs[k]['value'],scaling(cur[k]['value'],a**(4 if k=='green'else-4 if k=='gamma'else 0))]for k in keys]),
 ('leg-checks',[[q[k]for k in ['leg','propagatorInverse','poleExtraction','regulatedExtraction','rescaledPropagator','expectedRescaledPropagator']]for q in s['legChecks']]),
 ('delta',[[q['power'],q['delta'],q['eta']]+[q[k]['value']for k in ['raw','partial','gamma','full','direct','regulated','target']]+[q[k]for k in ['directError','regulatedError','fullError']]for q in s['deltaScan']]),
 ('paths',[[q['power'],q['delta']]+[q[k]['value']for k in ['fixedEta','equalEta','fasterEta','poleFirst']]for q in s['pathScan']]),
 ('limits',[[q['ratio'],q['factor']]+values(q['limit'])for q in s['limits']['pathLimits']]),
 ('alpha',[[q['alpha'],q['residue']]+[q[k]['value']for k in ['green','gamma','full','direct','target']]for q in s['alphaScan']]),
 ('units',[['D','μ*⁻²','δ与η为离壳质量平方除以μ*²'],['G（已提delta）','μ*⁻⁸','本页四条外腿的局部模型'],['去k条外腿后的核','μ*^(−8+2k)','不同k的数值不具有相同原始量纲'],['Γ、iM、M','1','四维标量四点约定'],['截面','质量⁻²','本实验没有计算截面']]),
 ('boundaries',list(map(list,s['boundaries'].items())))
 ]

NODE="const fs=require('fs'),a=require(process.argv[1]),f=require(process.argv[2]);\nfunction replay(x,y,path='root'){if(typeof y==='number'){if(typeof x!=='number'||!Number.isFinite(x)||Math.abs(x-y)>3e-11+5e-10*Math.abs(y))throw Error('Replay '+path);}else if(y!==null&&typeof y==='object'){if(!x||typeof x!=='object'||Array.isArray(x)!==Array.isArray(y)||JSON.stringify(Object.keys(x))!==JSON.stringify(Object.keys(y)))throw Error('Replay keys '+path);for(const k of Object.keys(y))replay(x[k],y[k],path+'.'+k);}else if(x!==y)throw Error('Replay scalar '+path);}\nconst cases=a.PRESETS.map(p=>a.compute(p.parameters));let invalid=0;\nfor(const[k,[lo,hi]]of Object.entries(a.LIMITS)){cases.push(a.compute({[k]:lo}),a.compute({[k]:hi}));for(const v of[lo-1,hi+1,lo+.5,'1',null,true,NaN,Infinity]){let bad=false;try{a.compute({[k]:v})}catch(e){bad=true}if(!bad)throw Error('Invalid accepted '+k);invalid++;}}\nfor(const v of[null,[],true,{unknown:1}]){let bad=false;try{a.compute(v)}catch(e){bad=true}if(!bad)throw Error('Bad object');invalid++;}\nfor(const r of f.records)replay(r.data,a.compute(r.data.parameters));\nconst observed=process.argv[3]?JSON.parse(fs.readFileSync(process.argv[3],'utf8')):[];for(const q of observed)replay(q,a.compute(q.parameters));\nlet feedback=0;for(let i=0;i<4;i++)for(let j=0;j<2;j++){if(a.feedback(i,j).correct!==(j===a.QUESTIONS[i][2]))throw Error('Feedback');feedback++;}\nconst snapshots=[...cases,...f.records.map(r=>r.data),...observed];const records=snapshots.map(snapshot=>({snapshot,plots:a.plots(snapshot),tables:a.tables(snapshot),svgs:a.plots(snapshot).map(a.svg)}));\nlet replayGuards=0;for(const change of[q=>q.schema='wrong',q=>q.parameters.removed=99,q=>delete q.current,q=>q.current.full.magnitude='0',q=>q.current.directError=NaN,q=>q.deltaScan.pop(),q=>q.boundaries.notCrossSection=false,q=>q.current.gamma.value=null]){const q=JSON.parse(JSON.stringify(cases[0]));change(q);try{replay(q,cases[0])}catch(e){replayGuards++;}}if(replayGuards!==8)throw Error('Replay guard');\nfunction mountPresetNames(api){class E{constructor(tag,doc){this.tag=tag;this.ownerDocument=doc;this.children=[];this.attrs={};this._text='';this.classList={add(){}};}set textContent(v){this._text=String(v);this.children=[];}get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}append(...xs){this.children.push(...xs);}replaceChildren(...xs){this._text='';this.children=[...xs];}setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return Object.hasOwn(this.attrs,k)?this.attrs[k]:null;}removeAttribute(k){delete this.attrs[k];}addEventListener(){}}const doc={createElement(t){return new E(t,this)},querySelector(){return null}};doc.head=new E('head',doc);const root=new E('div',doc);api.mount(root);const all=[];function visit(e){if(e.getAttribute('data-preset')!==null)all.push(e);e.children.forEach(visit)}visit(root);if(all.length!==api.PRESETS.length)throw Error('Preset count');all.forEach((b,i)=>{const name=api.PRESETS[i].name;if(typeof name!=='string'||!name.trim()||b.textContent.trim()!==name)throw Error('Missing name')});return all.length;}\nconst mountLabels=mountPresetNames(a),source=fs.readFileSync(process.argv[1],'utf8'),needle='},p.name);';if(!source.includes(needle))throw Error('Name field');const sandbox={module:{exports:{}}};require('vm').runInNewContext(source.replace(needle,'},p.label);'),sandbox);let mountMutations=0;try{mountPresetNames(sandbox.module.exports)}catch(e){mountMutations++;}if(mountMutations!==1)throw Error('Name mutation');\nconsole.log(JSON.stringify({records,live:cases.length,frozen:f.records.length,observed:observed.length,invalid,feedback,replayGuards,mountLabels,mountMutations,self:a.selfTest()}));\n"
def viewcheck(record):
 global coords,markers,ledgerRows
 s=record['snapshot'];wanted=expected_plots(s);assert len(record['plots'])==len(record['svgs'])==6
 for p,(key,domain,yrange,series),markup in zip(record['plots'],wanted,record['svgs']):
  assert p['key']==key and p['title']and p['xLabel']and p['yLabel'];close([p['xMin'],p['xMax']],domain)
  close([p['yMin'],p['yMax']],yrange);assert len(p['series'])==len(series)
  if key=='phase':close(755/(domain[1]-domain[0]),290/(yrange[1]-yrange[0]),'equal complex-plane scale',atol=1e-8)
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
 root=Path(__file__).resolve().parents[1];js=Path(sys.argv[1]).resolve()if len(sys.argv)>1 else root/'course-shared/labs/scalar-lsz.js';fixture=Path(sys.argv[2]).resolve()if len(sys.argv)>2 else root/'course-shared/projects/lsz-certificates/run-snapshot.json'
 f=json.loads(fixture.read_text());assert f['provenance']['sourceSha256']==hashlib.sha256(js.read_bytes()).hexdigest();assert len(f['records'])==6
 args=[str(js),str(fixture)]+([str(Path(sys.argv[3]).resolve())]if len(sys.argv)>3 else[]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
 result=json.loads(subprocess.check_output(prefix+['node','-e',NODE,*args],text=True));coords=markers=ledgerRows=0
 for r in result['records']:review(r['snapshot']);viewcheck(r)
 specimens={r['key']:r['data']for r in f['records']};mutations=0
 edits=[
 ('residue',lambda q:q['current']['target']['value'].__setitem__(1,-.2)),
 ('rescale',lambda q:q['rescaled']['full']['value'].__setitem__(1,1)),
 ('path',lambda q:q['limits'].__setitem__('deltaFirstThenEta',q['limits']['etaFirstThenDelta'])),
 ('path',lambda q:q['limits']['pathLimits'][3]['limit'].__setitem__('value',[0,-.2])),
 ('zero',lambda q:q['current']['amplitude'].__setitem__('value',[1,0])),
 ('regular',lambda q:q['current']['direct'].__setitem__('value',[0,-.2])),
 ('default',lambda q:q['current']['green']['value'].__setitem__(1,0)),
 ('default',lambda q:q['current']['legs'][0]['inverse'].__setitem__(1,0)),
 ('default',lambda q:q['current']['sequence'][3].__setitem__('value',[0,0])),
 ('default',lambda q:q['deltaScan'][100]['partial'].__setitem__('magnitude',0)),
 ('default',lambda q:q['pathScan'][50]['equalEta'].__setitem__('value',[0,0])),
 ('rescale',lambda q:q['alphaScan'][5].__setitem__('residue',1)),
 ('default',lambda q:q['legChecks'][0].__setitem__('propagatorInverse',[0,0])),
 ('default',lambda q:q['boundaries'].__setitem__('notCrossSection',False))]
 for key,edit in edits:
  q=copy.deepcopy(specimens[key]);edit(q)
  try:review(q)
  except(AssertionError,TypeError,KeyError,ValueError,ZeroDivisionError):mutations+=1
  else:raise AssertionError('Undetected mutation '+key)
 assert result['invalid']==76 and result['feedback']==8 and result['mountLabels']==12 and result['mountMutations']==1 and result['replayGuards']==8
 print(json.dumps(dict(status='PASS',records=result['live'],frozen=result['frozen'],observed=result['observed'],checks=checks,plotCoordinates=coords,markers=markers,ledgerRows=ledgerRows,invalid=result['invalid'],feedback=result['feedback'],mutations=mutations,mountLabels=result['mountLabels'],mountMutations=result['mountMutations'],replayGuards=result['replayGuards'],self=result['self']['checks'])))
