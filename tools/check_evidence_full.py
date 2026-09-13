"""Standard-library reference for the three explicit synthetic inference models."""
import math
from decimal import Decimal,localcontext
checks=0
LIMITS={'energyTenths':(0,100),'scaleTenths':(10,190),'c6Tenths':(-20,20),'c8Tenths':(-20,20),'precisionExp':(1,18),'order':(1,4),'responseTenths':(-10,10),'sharedTenths':(0,100),'y1Tenths':(-40,40),'y2Tenths':(-40,40),'boundTenths':(0,40),'powerChoice':(0,1)}
Z=1.959963984540054
def close(a,b,label='',atol=3e-11,rtol=5e-10):
 global checks
 checks+=1
 if b is None or isinstance(b,(bool,str)):assert type(a)is type(b)and a==b,(label,a,b)
 elif isinstance(b,dict):
  assert isinstance(a,dict)and list(a)==list(b),(label,'keys')
  for k in b:close(a[k],b[k],label+'.'+k,atol,rtol)
 elif isinstance(b,(list,tuple)):
  assert isinstance(a,(list,tuple))and len(a)==len(b),(label,'shape')
  for i,(x,y)in enumerate(zip(a,b)):close(x,y,label+'.'+str(i),atol,rtol)
 else:assert type(a)in(int,float)and math.isfinite(a)and abs(a-b)<=atol+rtol*abs(b),(label,a,b)
def inv(A):
 a,b=A[0];c,d=A[1];det=a*d-b*c;assert det!=0
 return[[d/det,-b/det],[-c/det,a/det]]
def transpose(A):return list(map(list,zip(*A)))
def mm(A,B):return[[sum(x*y for x,y in zip(r,col))for col in zip(*B)]for r in A]
def mv(A,v):return[sum(x*y for x,y in zip(r,v))for r in A]
def dot(u,v):return sum(x*y for x,y in zip(u,v))
def cdf(x):return .5*math.erfc(-x/math.sqrt(2))
def series(q):
 with localcontext()as ctx:
  ctx.prec=240;x=Decimal(str(q['x']));c=Decimal(str(q['c']));terms=[c*(-1)**j*x**(j+1)for j in range(q['order'])];partial=sum(terms);exact=c*x/(1+x);rem=exact-partial
  close([q['exact'],q['partial'],q['remainder'],q['absoluteRemainder']],[float(exact),float(partial),float(rem),abs(float(rem))],'240-digit remainder',atol=1e-220)
  close(q['relativeError'],None if c==0 else float(abs(rem/exact)),atol=1e-220)
  close(q['nextTermBound'],float(abs(c*x**(q['order']+1))),atol=1e-220)
  close(q['terms'],[dict(order=i+1,term=float(t),partial=float(sum(terms[:i+1])))for i,t in enumerate(terms)],atol=1e-220)
  close(q['insideGeometricDomain'],x<1);close(q['seriesConverges'],c==0 or x<1)
  close(q['directDifference'],q['exact']-q['partial'],atol=2e-15*(abs(q['exact'])+abs(q['partial'])))
def interval(q):
 y,s,B=q['y'],q['sigma'],q['B'];h=Z*s+B;wrong=math.hypot(Z*s,B)
 close([q['z'],q['halfWidth'],q['wrongQuadratureHalfWidth']],[Z,h,wrong],atol=1e-28)
 close(q['interval'],[y-h,y+h],atol=1e-28);close(q['nullIncluded'],abs(y)<=h)
 with localcontext()as ctx:
  ctx.prec=65;sd=Decimal(str(s));Bd=Decimal(str(B));zd=Decimal(str(Z));rd=((zd*sd)**2+Bd**2).sqrt()
  hi=float((rd-Bd)/sd);lo=float((-rd-Bd)/sd)
 close([q['coverageAtZeroBias'],q['coverageAtExtremeBias'],q['wrongCoverageAtExtremeBias']],[cdf(Z+B/s)-cdf(-Z-B/s),cdf(Z)-cdf(-Z-2*B/s),cdf(hi)-cdf(lo)],'normal integral coverage',atol=3e-12,rtol=1e-11)
 assert q['coverageAtExtremeBias']>=.95-2e-12
def scale(q):
 E,c,n,s,B=q['E'],q['c'],q['n'],q['sigma'],q['B'];u=Z*s+B;close(q['U'],u,atol=1e-28)
 if c==0:close([q['lower'],q['logLower'],q['controlledExcludedInterval']],[None,None,None])
 else:
  lower=E*(abs(c)/u)**(1/n);close(q['lower'],lower);close(q['logLower'],math.log10(lower));close(q['controlledExcludedInterval'],[E,lower]if lower>E else None)
 close(q['assumptions'],'zero central observation; fixed coupling; pure power response')
def review(q):
 global checks
 c=q['parameters'];assert set(c)==set(LIMITS)
 for k,(lo,hi)in LIMITS.items():assert type(c[k])is int and lo<=c[k]<=hi
 close(q['schema'],'lookout204-v1');m=q['model'];n=4 if c['powerChoice']else 2
 expected=dict(E=10**(c['energyTenths']/10),Lambda=10**(c['scaleTenths']/10),x=10**((c['energyTenths']-c['scaleTenths'])/5),c6=c['c6Tenths']/10,c8=c['c8Tenths']/10,sigma=10**-c['precisionExp'],B=c['boundTenths']*1e-11,n=n,scaleCoupling=c['c6Tenths']/10 if n==2 else c['c8Tenths']/10,r=c['responseTenths']/10,tau=c['sharedTenths']/10,y1=c['y1Tenths']/10,y2=c['y2Tenths']/10)
 close(m,expected,'physical model',atol=1e-60)
 ex=q['expansion'];close([ex['x'],ex['c'],ex['order']],[m['x'],m['c6'],c['order']],atol=1e-60);series(ex)
 assert len(q['expansionScan'])==87
 for i,p in enumerate(q['expansionScan']):close(p['logRatio'],-4+i*.05);close([p['x'],p['c'],p['order']],[10**(2*(-4+i*.05)),m['c6'],c['order']],atol=1e-60);series(p)
 x=m['x'];L=m['c6']*x;N=m['c8']*x*x;pol=q['polynomial'];close([pol['leading'],pol['next']],[L,N],atol=1e-100)
 close(pol['total'],math.fsum([L,N]),atol=2e-15*(abs(L)+abs(N)));close(pol['signalOverSigma'],(L+N)/m['sigma']);close(pol['nextToLeading'],None if m['c6']==0 else abs(N/L));close(pol['unknownFurtherTermsBound'],None)
 assert len(q['coefficientScan'])==81
 for i,p in enumerate(q['coefficientScan']):
  d=-2+i*.05;close([p['c8'],p['leading'],p['next']],[d,L,d*x*x],atol=1e-100);close(p['total'],L+d*x*x,atol=2e-15*(abs(L)+abs(d*x*x)))
 r=m['r'];tau=m['tau'];M=[[1,1],[1,r]];C=[[1+tau*tau,tau*tau],[tau*tau,1+tau*tau]];W=inv(C);y=[m['y1'],m['y2']];u=[1,1];f=q['fit'];close([f['design'],f['covariance'],f['precision']],[M,C,W])
 for k in ['r','tau','y1','y2']:close(f[k],m[k])
 singular=r==1;close(f['singular'],singular);close(f['rank'],1 if singular else 2)
 if singular:
  close([f[k]for k in ['a','b','varA','varB','covAB','aInterval','bInterval','conditionNumber']],[None]*8)
 else:
  inverse=inv(M);theta=mv(inverse,y);cov=mm(mm(inverse,C),transpose(inverse));close([f['a'],f['b']],theta);close([[f['varA'],f['covAB']],[f['covAB'],f['varB']]],cov)
  for i,k in enumerate(['aInterval','bInterval']):close(f[k],[theta[i]-Z*math.sqrt(cov[i][i]),theta[i]+Z*math.sqrt(cov[i][i])])
  G=mm(transpose(M),M);trace=G[0][0]+G[1][1];det=(1-r)**2;root=math.sqrt(trace*trace-4*det);top=(trace+root)/2;close(f['conditionNumber'],top/math.sqrt(det))
 Wu=mv(W,u);fixed=dot(Wu,y)/dot(u,Wu);variance=1/dot(u,Wu);res=[v-fixed for v in y];fixedChi=dot(res,mv(W,res))
 close([f['fixedB'],f['fixedA'],f['fixedVariance'],f['fixedChi2'],f['naiveIndependentVariance']],[0,fixed,variance,fixedChi,(C[0][0]+C[1][1])/4])
 close(f['chi2Min'],fixedChi if singular else 0);close(f['fixedAInterval'],[fixed-Z*math.sqrt(variance),fixed+Z*math.sqrt(variance)])
 close(f['identifiedCombination'],'a+b'if singular else'a and b');close(f['identifiedSumEstimate'],fixed if singular else None);close(f['identifiedSumVariance'],variance if singular else None)
 assert len(q['profileScan'])==81
 for p in q['profileScan']:
  v=[1,r];e=[z-p['a']for z in y];Wv=mv(W,v);b=dot(Wv,e)/dot(Wv,v);res=[e[i]-v[i]*b for i in range(2)];chi=dot(res,mv(W,res));close([p['b'],p['chi2']],[b,chi]);close(p['deltaChi2'],chi-f['chi2Min'],atol=1e-8);close(p['fixedDeltaChi2'],(p['a']-fixed)**2/variance)
 assert len(q['sharedScan'])==51
 for i,p in enumerate(q['sharedScan']):close(p,dict(tau=i/5,correctVariance=.5+(i/5)**2,naiveVariance=(1+(i/5)**2)/2))
 bnd=q['bounded'];close([bnd['y'],bnd['sigma'],bnd['B']],[m['y1']*m['sigma'],m['sigma'],m['B']],atol=1e-28);interval(bnd)
 for k,v in [('nuisanceDistribution','deterministic unknown bias in [-B,B]'),('noiseDistribution','Gaussian with known sigma')]:close(bnd[k],v)
 reach=q['scale'];close([reach['E'],reach['c'],reach['n'],reach['sigma'],reach['B']],[m['E'],m['scaleCoupling'],m['n'],m['sigma'],m['B']],atol=1e-28);scale(reach)
 assert len(q['boundedProfile'])==81 and len(q['precisionScan'])==69
 for i,p in enumerate(q['boundedProfile']):
  mu=bnd['y']+(-2+4*i/80)*bnd['halfWidth'];e=bnd['y']-mu;beta=min(m['B'],max(-m['B'],e));close([p['mu'],p['biasBest']],[mu,beta],atol=1e-28);close(p['q'],((e-beta)/m['sigma'])**2,atol=1e-8)
 for i,p in enumerate(q['precisionScan']):
  prec=1+i/4;close([p['precisionExp'],p['sigma'],p['B'],p['y']],[prec,10**-prec,m['B'],bnd['y']],atol=1e-28);interval(p)
  for k,B in [('scale',m['B']),('scaleNoBias',0)]:
   t=p[k];close([t['E'],t['c'],t['n'],t['sigma'],t['B']],[m['E'],m['scaleCoupling'],m['n'],p['sigma'],B],atol=1e-28);scale(t)
 assert len(q['boundaries'])==12 and all(type(v)is bool and v for v in q['boundaries'].values());checks+=12
 return True

def expected_plots(s):
 def points(rows,x,y):return[None if p[y]is None else[p[x],p[y]]for p in rows]
 prof=s['profileScan'];scan=s['precisionScan']
 return[
 ('expansion',[-4,.3],[points(s['expansionScan'],'logRatio',k)for k in ['exact','partial','remainder']]),
 ('cancellation',[-2,2],[points(s['coefficientScan'],'c8',k)for k in ['leading','next','total']]+[[[s['model']['c8'],s['polynomial']['total']]]]),
 ('profile',[prof[0]['a'],prof[-1]['a']],[[[p['a'],math.log1p(p[k])]for p in prof]for k in ['deltaChi2','fixedDeltaChi2']]+[[[prof[0]['a'],math.log1p(Z*Z)],[prof[-1]['a'],math.log1p(Z*Z)]]]),
 ('shared',[0,10],[[[p['tau'],math.sqrt(p[k])]for p in s['sharedScan']]for k in ['correctVariance','naiveVariance']]),
 ('interval',[1,18],[[[p['precisionExp'],math.log10(p[k])]for p in scan]for k in ['halfWidth','wrongQuadratureHalfWidth']]+[[[p['precisionExp'],math.log10(Z*p['sigma'])]for p in scan]]),
 ('scale',[1,18],[[None if p[k]['logLower']is None else[p['precisionExp'],p[k]['logLower']]for p in scan]for k in ['scale','scaleNoBias']]+[[[1,math.log10(s['model']['E'])],[18,math.log10(s['model']['E'])]]])]
def expected_tables(s):
 def values(p,keys):return[p[k]for k in keys.split()]
 pairs=lambda name,obj:[[name,k,v]for k,v in obj.items()]
 return[
 ('parameters',pairs('控件',s['parameters'])+pairs('单位与比例',s['model'])+pairs('独立两算符',s['polynomial'])+pairs('单测量有界偏差',s['bounded'])),
 ('terms',[[k,v]for k,v in s['expansion'].items()if k!='terms']+sum([[['第'+str(p['order'])+'项',p['term']],['第'+str(p['order'])+'部分和',p['partial']]]for p in s['expansion']['terms']],[])),
 ('expansion',[values(p,'logRatio x order exact partial remainder absoluteRemainder directDifference relativeError nextTermBound insideGeometricDomain')for p in s['expansionScan']]),
 ('coefficient',[values(p,'c8 leading next total')for p in s['coefficientScan']]),
 ('fit',[[k,v]for k,v in s['fit'].items()if k not in ['design','covariance','precision']]),
 ('matrices',[[k,i+1,j+1,v]for k in ['design','covariance','precision']for i,row in enumerate(s['fit'][k])for j,v in enumerate(row)]),
 ('profile',[values(p,'a b chi2 deltaChi2 fixedDeltaChi2')for p in s['profileScan']]),
 ('shared',[values(p,'tau correctVariance naiveVariance')for p in s['sharedScan']]),
 ('interval',[values(p,'mu biasBest q')for p in s['boundedProfile']]),
 ('precision',[values(p,'precisionExp sigma B halfWidth wrongQuadratureHalfWidth')+p['interval']+values(p,'coverageAtZeroBias coverageAtExtremeBias wrongCoverageAtExtremeBias')for p in s['precisionScan']]),
 ('scales',[[p['precisionExp']]+values(p['scale'],'E c n B U lower logLower controlledExcludedInterval')+[p['scaleNoBias']['lower']]for p in s['precisionScan']]),
 ('boundaries',list(map(list,s['boundaries'].items())))
 ]

NODE="const fs=require('fs'),a=require(process.argv[1]),f=require(process.argv[2]);\nfunction replay(x,y,path='root'){if(typeof y==='number'){if(typeof x!=='number'||!Number.isFinite(x)||Math.abs(x-y)>3e-11+5e-10*Math.abs(y))throw Error('Replay '+path);}else if(y!==null&&typeof y==='object'){if(!x||typeof x!=='object'||Array.isArray(x)!==Array.isArray(y)||JSON.stringify(Object.keys(x))!==JSON.stringify(Object.keys(y)))throw Error('Replay keys '+path);for(const k of Object.keys(y))replay(x[k],y[k],path+'.'+k);}else if(x!==y)throw Error('Replay scalar '+path);}\nconst cases=a.PRESETS.map(p=>a.compute(p.parameters));let invalid=0;\nfor(const[k,[lo,hi]]of Object.entries(a.LIMITS)){cases.push(a.compute({[k]:lo}),a.compute({[k]:hi}));for(const v of[lo-1,hi+1,lo+.5,'1',null,true,NaN,Infinity]){let bad=false;try{a.compute({[k]:v})}catch(e){bad=true}if(!bad)throw Error('Invalid accepted '+k);invalid++;}}\nfor(const v of[null,[],true,{unknown:1}]){let bad=false;try{a.compute(v)}catch(e){bad=true}if(!bad)throw Error('Bad object');invalid++;}\nfor(const r of f.records)replay(r.data,a.compute(r.data.parameters));\nconst observed=process.argv[3]?JSON.parse(fs.readFileSync(process.argv[3],'utf8')):[];for(const q of observed)replay(q,a.compute(q.parameters));\nlet feedback=0;for(let i=0;i<4;i++)for(let j=0;j<2;j++){if(a.feedback(i,j).correct!==(j===a.QUESTIONS[i][2]))throw Error('Feedback');feedback++;}\nconst snapshots=[...cases,...f.records.map(r=>r.data),...observed];const records=snapshots.map(snapshot=>({snapshot,plots:a.plots(snapshot),tables:a.tables(snapshot),svgs:a.plots(snapshot).map(a.svg)}));\nlet replayGuards=0;for(const change of[q=>q.schema='wrong',q=>q.parameters.order=99,q=>delete q.fit,q=>q.scale.lower='0',q=>q.expansion.remainder=NaN,q=>q.profileScan.pop(),q=>q.boundaries.confidenceNotPosterior=false,q=>q.bounded.interval=null]){const q=JSON.parse(JSON.stringify(cases[0]));change(q);try{replay(q,cases[0])}catch(e){replayGuards++;}}if(replayGuards!==8)throw Error('Replay guard');\nfunction mountPresetNames(api){class E{constructor(tag,doc){this.tag=tag;this.ownerDocument=doc;this.children=[];this.attrs={};this._text='';this.classList={add(){}};}set textContent(v){this._text=String(v);this.children=[];}get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}append(...xs){this.children.push(...xs);}replaceChildren(...xs){this._text='';this.children=[...xs];}setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return Object.hasOwn(this.attrs,k)?this.attrs[k]:null;}removeAttribute(k){delete this.attrs[k];}addEventListener(){}}const doc={createElement(t){return new E(t,this)},querySelector(){return null}};doc.head=new E('head',doc);const root=new E('div',doc);api.mount(root);const all=[];function visit(e){if(e.getAttribute('data-preset')!==null)all.push(e);e.children.forEach(visit)}visit(root);if(all.length!==api.PRESETS.length)throw Error('Preset count');all.forEach((b,i)=>{const name=api.PRESETS[i].name;if(typeof name!=='string'||!name.trim()||b.textContent.trim()!==name)throw Error('Missing name')});return all.length;}\nconst mountLabels=mountPresetNames(a),source=fs.readFileSync(process.argv[1],'utf8'),needle='},p.name);';if(!source.includes(needle))throw Error('Name field');const sandbox={module:{exports:{}}};require('vm').runInNewContext(source.replace(needle,'},p.label);'),sandbox);let mountMutations=0;try{mountPresetNames(sandbox.module.exports)}catch(e){mountMutations++;}if(mountMutations!==1)throw Error('Name mutation');\nconsole.log(JSON.stringify({records,live:cases.length,frozen:f.records.length,observed:observed.length,invalid,feedback,replayGuards,mountLabels,mountMutations,self:a.selfTest()}));\n"
def viewcheck(record):
 global coords,markers,ledgerRows
 s=record['snapshot'];wanted=expected_plots(s);assert len(record['plots'])==len(record['svgs'])==6
 for p,(key,domain,series),markup in zip(record['plots'],wanted,record['svgs']):
  assert p['key']==key and p['title']and p['xLabel']and p['yLabel'];close([p['xMin'],p['xMax']],domain)
  ys=[q[1]for line in series for q in line if q is not None];lo=min([0]+ys);hi=max([0]+ys)
  if hi==lo:hi=lo+1
  pad=.07*(hi-lo);close([p['yMin'],p['yMax']],[lo-pad,hi+pad]);assert len(p['series'])==len(series)
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
 root=Path(__file__).resolve().parents[1];js=Path(sys.argv[1]).resolve()if len(sys.argv)>1 else root/'course-shared/labs/frontier-evidence.js';fixture=Path(sys.argv[2]).resolve()if len(sys.argv)>2 else root/'course-shared/projects/evidence-certificates/run-snapshot.json'
 f=json.loads(fixture.read_text());assert f['provenance']['sourceSha256']==hashlib.sha256(js.read_bytes()).hexdigest();assert len(f['records'])==6
 args=[str(js),str(fixture)]+([str(Path(sys.argv[3]).resolve())]if len(sys.argv)>3 else[]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
 result=json.loads(subprocess.check_output(prefix+['node','-e',NODE,*args],text=True));coords=markers=ledgerRows=0
 for r in result['records']:review(r['snapshot']);viewcheck(r)
 specimens={r['key']:r['data']for r in f['records']};mutations=0
 edits=[('default',lambda q:q['expansion'].__setitem__('remainder',0)),('default',lambda q:q['expansion'].__setitem__('partial',0)),('default',lambda q:q['polynomial'].__setitem__('leading',0)),('cancel',lambda q:q['polynomial'].__setitem__('total',.01)),('default',lambda q:q['fit'].__setitem__('varA',0)),('shared',lambda q:q['fit'].__setitem__('fixedVariance',q['fit']['naiveIndependentVariance'])),('shared',lambda q:q['fit']['precision'][0].__setitem__(1,0)),('singular',lambda q:q['fit'].__setitem__('aInterval',[0,0])),('bounded',lambda q:q['bounded'].__setitem__('halfWidth',q['bounded']['wrongQuadratureHalfWidth'])),('bounded',lambda q:q['bounded'].__setitem__('wrongCoverageAtExtremeBias',.95)),('zero',lambda q:q['scale'].__setitem__('lower',1e9)),('default',lambda q:q['boundaries'].__setitem__('confidenceNotPosterior',False)),('default',lambda q:q['precisionScan'][30]['scaleNoBias'].__setitem__('lower',0)),('default',lambda q:q['profileScan'][10].__setitem__('b',100))]
 for key,edit in edits:
  q=copy.deepcopy(specimens[key]);edit(q)
  try:review(q)
  except(AssertionError,TypeError,KeyError,ValueError,ZeroDivisionError):mutations+=1
  else:raise AssertionError('Undetected mutation '+key)
 assert result['invalid']==100 and result['feedback']==8 and result['mountLabels']==12 and result['mountMutations']==1 and result['replayGuards']==8
 print(json.dumps(dict(status='PASS',records=result['live'],frozen=result['frozen'],observed=result['observed'],checks=checks,plotCoordinates=coords,markers=markers,ledgerRows=ledgerRows,invalid=result['invalid'],feedback=result['feedback'],mutations=mutations,mountLabels=result['mountLabels'],mountMutations=result['mountMutations'],replayGuards=result['replayGuards'],self=result['self']['checks'])))
