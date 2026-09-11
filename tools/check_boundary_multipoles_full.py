from pathlib import Path
import json,subprocess,tempfile,shutil,sys
PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
STAGING='--staging'in sys.argv
ROOT=Path(__file__).resolve().parents[1]
JS=ROOT/('work/boundary164.js'if STAGING else'course-shared/labs/image-charge-boundary.js')
FIXTURE=ROOT/('work/boundary-snapshot164.json'if STAGING else'course-shared/projects/image-charge-boundary/run-snapshot.json')
NODE="const fs=require('fs'),assert=require('assert'),a=require(require('path').resolve(process.argv[2])),states=a.PRESETS.map(p=>a.snapshot(p.values));\nfor(const geometry of ['plane','grounded','isolated'])for(const q of ['-2','0','2'])for(const scale of [0,1,2])states.push(a.snapshot({geometry,q,a:scale===0?'0.25':'2',gap:scale===0?'4':scale===1?'0.05':'1',Q:scale===0?'-2':'2',farRatio:scale===0?'10':'1.05',angle:scale===1?'0':geometry==='plane'?'90':'180',order:scale===0?'0':'12'}));\nlet invalid=0;const bads=[null,[],true,1,'',{extra:'1'}];for(const key of Object.keys(a.DEFAULTS))for(const v of [null,undefined,[],{},1,Infinity])bads.push({[key]:v});\nfor(const[k,vs]of Object.entries({geometry:['sphere','','Plane'],q:['-2.1','2.1','1e0','+1','01','--1'],a:['0','0.249','2.01','1e0'],gap:['0','0.049','4.01','1e0'],Q:['-2.1','2.1','1e0'],farRatio:['1','1.049','10.01'],order:['-1','13','1.5','01','1e0',''],angle:['-1','90.1','181','1e0']}))for(const v of vs)bads.push({[k]:v});bads.push({geometry:'isolated',angle:'180.1'});for(const v of bads){assert.throws(()=>a.snapshot(v));invalid++;}\nfor(const charge of [-1,1])assert.throws(()=>a.fieldAt(0,1,[{role:'real',q:charge,z:1}]));assert.deepEqual(a.fieldAt(0,1,[{role:'real',q:0,z:1}]),{potential:0,ex:0,ez:0,terms:[]});assert.throws(()=>a.fieldAt(NaN,0,[]));\nconst original=JSON.stringify(a.snapshot());for(const mutate of [d=>d.model.sources[0].q=99,d=>d.boundary[0].terms[0].potential=99,d=>d.quadrature[0].leaves[0].fa=99,d=>d.far[0].orders[0].sourceTerms[0].moment=99]){const d=a.snapshot();mutate(d);assert.equal(JSON.stringify(a.snapshot()),original);}\nlet invariance=0;const same=(x,y)=>assert.equal(JSON.stringify(x),JSON.stringify(y));for(const geometry of ['plane','grounded']){const x=a.snapshot({geometry}),y=a.snapshot({geometry,Q:'2'});same(x.boundary,y.boundary);same(x.force,y.force);same(x.far,y.far);invariance++;}const x=a.snapshot(),y=a.snapshot({a:'2'});same(x.boundary,y.boundary);same(x.force,y.force);same(x.far,y.far);invariance++;const u=a.snapshot(),v=a.snapshot({order:'12',angle:'90'});same(u.boundary,v.boundary);same(u.force,v.force);same(u.far,v.far);invariance++;\nfunction compare(x,y){if(typeof x==='number'&&typeof y==='number'){assert(Number.isFinite(x)&&Number.isFinite(y)&&Math.abs(x-y)<=4e-12*(1+Math.abs(y)));return;}if(x&&y&&typeof x==='object'&&typeof y==='object'){assert.deepEqual(Object.keys(x),Object.keys(y));for(const k of Object.keys(x))compare(x[k],y[k]);return;}assert.strictEqual(x,y);}\nlet frozen=0;if(process.argv[3]!=='-'){const f=JSON.parse(fs.readFileSync(process.argv[3]));for(const k of ['plane','grounded','isolated','zero']){compare(a.snapshot(f[k].parameters),f[k]);states.push(f[k]);frozen++;}}\nconst views=states.map(s=>{const p=a.plots(s),tables=a.ledgers(s);return{plots:p,svgs:p.map(a.svg),tables,formatted:tables.map(t=>t.rows.map(r=>r.map(a.fmt)))};});fs.writeFileSync(process.argv[4],JSON.stringify({states,views,live:states.length-frozen,frozen,invalid,mutationGuards:4,invariance,self:a.selfTest()}));\n"
with tempfile.TemporaryDirectory()as td:
 script=Path(td)/'export.cjs';out=Path(td)/'bundle.json';script.write_text(NODE)
 subprocess.run(PREFIX+['node',str(script),str(JS),str(FIXTURE),str(out)],check=True)
 bundle=json.loads(out.read_text())

import math
checks=0
def ck(v,msg='assertion'):
 global checks
 checks+=1
 if not v:raise AssertionError(msg)
def close(a,b,msg='number',tol=8e-11):
 ck(math.isfinite(a)and math.isfinite(b)and abs(a-b)<=tol*(1+abs(b)),msg+str((a,b)))
def legendre_exact(n,x):
 # Rodrigues finite polynomial, independent of the live three-term recurrence.
 return math.fsum((-1)**j*math.factorial(2*n-2*j)/(2**n*math.factorial(j)*math.factorial(n-j)*math.factorial(n-2*j))*x**(n-2*j) for j in range(n//2+1))
def verify_field(f,x,z,sources):
 vals=calc_field(x,z,sources)
 for k,v in zip(['potential','ex','ez'],vals):close(f[k],v,k)
 expected=[(q,z0)for q,z0 in sources if q!=0];ck(len(f['terms'])==len(expected))
 for term,(q,z0)in zip(f['terms'],expected):
  R=math.hypot(x,z-z0)
  for k,v in [('distance',R),('potential',q/R),('ex',q*x/R**3),('ez',q*(z-z0)/R**3)]:close(term[k],v,k)
def energy(q,a,gap,Q,geometry):
 d=gap if geometry=='plane'else a+gap
 if geometry=='plane':return -q*q/(4*d)
 base=-q*q*a/(2*(d-a)*(d+a))
 return q*Q/d+base+q*q*a/(2*d*d)if geometry=='isolated'else base
def calc_field(x,z,sources):
 potential=[];ex=[];ez=[]
 for q,pos in sources:
  if q==0:continue
  R=math.hypot(x,z-pos);potential.append(q/R);ex.append(q*x/R**3);ez.append(q*(z-pos)/R**3)
 return list(map(math.fsum,[potential,ex,ez]))
def check_state(s):
 c=s['parameters'];q=float(c['q']);a=float(c['a']);gap=float(c['gap']);Q=float(c['Q']);plane=c['geometry']=='plane';d=gap if plane else a+gap;b=-d if plane else a*a/d;qp=-q if plane else-a*q/d;q0=Q+a*q/d if c['geometry']=='isolated'else 0;sources=[(q,d),(qp,b)]+([(q0,0)]if c['geometry']=='isolated'else[])
 ck(s['version']==164);ck(len(s['boundary'])==65 and len(s['quadrature'])==64 and len(s['forceScan'])==49 and len(s['far'])==65)
 for key,value in [('q',q),('a',a),('gap',gap),('d',d),('Q',Q),('qp',qp),('b',b),('q0',q0),('surfacePotential',0 if plane else q0/a)]:close(s['model'][key],value,key)
 for actual,(qi,zi),role in zip(s['model']['sources'],sources,['real','image','central-image']):
  ck(actual['role']==role);close(actual['q'],qi);close(actual['z'],zi)
 for j,row in enumerate(s['boundary']):
  u=(8 if plane else math.pi)*j/64;close(row['coordinate'],u);ck(row['angle']is None)if plane else close(row['angle'],u)
  for x,y in zip(row['normal'],[0,1]if plane else[math.sin(u),math.cos(u)]):close(x,y)
  for x,y in zip(row['tangent'],[1,0]if plane else[math.cos(u),-math.sin(u)]):close(x,y)
  verify_field(row,row['x'],row['z'],sources);close(row['expectedDensity'],row['expectedNormal']/(4*math.pi))
 ck(len(s['model']['sources'])==len(sources));close(s['model']['surfaceCharge'],-q if plane else qp+q0)
 for row in s['boundary']:
  u=row['coordinate'];x=u*d if plane else a*math.sin(u);z=0 if plane else a*math.cos(u);V,ex,ez=calc_field(x,z,sources);en=ez if plane else ex*math.sin(u)+ez*math.cos(u);et=ex if plane else ex*math.cos(u)-ez*math.sin(u)
  for k,v in [('x',x),('z',z),('potential',V),('ex',ex),('ez',ez),('normalField',en),('tangentialField',et),('density',en/(4*math.pi))]:close(row[k],v,k)
  # Numerical differentiation of scalar potential independently checks the field.
  h=min(gap,1)*2e-5
  for coord,k in [(0,'ex'),(1,'ez')]:
   ps=[]
   for shift in [-2,-1,1,2]:ps.append(calc_field(x+shift*h if coord==0 else x,z+shift*h if coord==1 else z,sources)[0])
   deriv=(ps[0]-8*ps[1]+8*ps[2]-ps[3])/(12*h);close(row[k],-deriv,'potential gradient',2e-8)
  close(row['normalResidual'],en-row['expectedNormal']);close(row['potentialResidual'],V-(0 if plane else q0/a))
  close(row['normalResidual'],0,'boundary normal identity',2e-9);close(et,0,'tangent identity',2e-9)
 def charge_integrand(u):
  if plane:
   rho=u*d;return -q*d*rho/(rho*rho+d*d)**1.5*d
  R=math.sqrt(gap*gap+4*a*d*math.sin(u/2)**2);return(-q*a*(d*d-a*a)/(2*R**3)+q0/2)*math.sin(u)
 for j,row in enumerate(s['quadrature']):
  end=(8 if plane else math.pi)*(j+1)/64;R=math.sqrt(gap*gap+4*a*d*math.sin(end/2)**2);reference=-q*(1-1/math.sqrt(1+end*end)) if plane else -q*(d*d-a*a)/(2*d)*(1/gap-1/R)+q0*(1-math.cos(end))/2;close(row['exactCap'],reference,'cap closed vs quadrature');close(row['cumulative'],reference,'actual adaptive quadrature',2e-9);ck(row['converged'])
  close(row['value'],math.fsum(v['corrected']for v in row['leaves']));close(row['estimatedError'],math.fsum(v['estimatedError']for v in row['leaves']))
  for leaf in row['leaves']:
   aa,bb=leaf['a'],leaf['b'];mid=(aa+bb)/2
   for name,pos in [('fa',aa),('fm',mid),('fb',bb),('fl',(aa+mid)/2),('fr',(mid+bb)/2)]:close(leaf[name],charge_integrand(pos),'actual integrand')
   left=(mid-aa)*(leaf['fa']+4*leaf['fl']+leaf['fm'])/6;right=(bb-mid)*(leaf['fm']+4*leaf['fr']+leaf['fb'])/6;whole=(bb-aa)*(leaf['fa']+4*leaf['fm']+leaf['fb'])/6;close(leaf['corrected'],left+right+(left+right-whole)/15)
  close(row['evaluations'],4*len(row['leaves'])+1)
  close(row['leaves'][0]['a'],(8 if plane else math.pi)*j/64);close(row['leaves'][-1]['b'],end)
  for k,t in enumerate(row['leaves']):
   if k:close(row['leaves'][k-1]['b'],t['a'])
   length=t['b']-t['a'];whole=length*(t['fa']+4*t['fm']+t['fb'])/6;left=length*(t['fa']+4*t['fl']+t['fm'])/12;right=length*(t['fm']+4*t['fr']+t['fb'])/12;delta=left+right-whole
   for key,v in [('whole',whole),('left',left),('right',right),('delta',delta),('estimatedError',abs(delta)/15),('tolerance',1e-10*(1+abs(q)+abs(Q))/64/2**t['depthUsed'])]:close(t[key],v,key,1e-12)
   ck(t['accepted']==(abs(delta)/15<=t['tolerance']));ck(0<=t['depthUsed']<=18);close(length,(8 if plane else math.pi)/64/2**t['depthUsed'])
  close(row['actualError'],row['cumulative']-row['exactCap']);close(row['cumulative'],math.fsum(t['value']for t in s['quadrature'][:j+1]));close(row['estimatedCumulativeError'],math.fsum(t['estimatedError']for t in s['quadrature'][:j+1]));close(s['boundary'][j+1]['capCharge'],reference)
 status=s['quadratureStatus'];close(status['total'],s['quadrature'][-1]['cumulative']);close(status['estimatedError'],s['quadrature'][-1]['estimatedCumulativeError']);close(status['exactFinite'],s['boundary'][-1]['capCharge']);close(status['infiniteOrFullCharge'],-q if plane else qp+q0);close(status['remainingCharge'],status['infiniteOrFullCharge']-status['exactFinite']);ck(status['converged']==all(t['converged']for t in s['quadrature']))
 verify_field(s['force']['imageField'],0,d,sources[1:]);close(s['force']['energy'],energy(q,a,gap,Q,c['geometry']));close(s['force']['groundEnergy'],energy(q,a,gap,Q,'plane'if plane else'grounded'))
 for j,t in enumerate(s['forceScan']):
  g=.05+3.95*j/48;dd=g if plane else a+g;pp=-q if plane else-a*q/dd;bb=-dd if plane else a*a/dd;qq=Q+a*q/dd if c['geometry']=='isolated'else 0;F=q*(pp/(dd-bb)**2+qq/dd**2);h=min(1e-4*max(dd,1),g/8);es=[energy(q,a,g+i*h,Q,c['geometry'])for i in[-2,-1,1,2]]
  for key,v in [('gap',g),('d',dd),('force',F),('energy',energy(q,a,g,Q,c['geometry'])),('step',h)]:close(t[key],v,key)
  for v,w in zip(t['energySamples'],es):close(v,w,'energy sample')
  derivative=(t['energySamples'][0]-8*t['energySamples'][1]+8*t['energySamples'][2]-t['energySamples'][3])/(12*h);close(t['negativeNumericalDerivative'],-derivative);close(t['derivativeResidual'],F+derivative);close(F,-derivative,'force vs numerical energy derivative',3e-7)
 force=q*calc_field(0,d,sources[1:])[2];close(s['force']['force'],force);close(s['force']['expectedForce'],force);close(s['force']['forceResidual'],s['force']['force']-s['force']['expectedForce'])
 for row in [*s['far'],s['probe']]:
  R=row['radius'];angle=row['theta'];close(R,float(c['farRatio'])*d);close(row['x'],R*math.sin(angle));close(row['z'],R*math.cos(angle));verify_field(row['direct'],row['x'],row['z'],sources);ck(len(row['orders'])==13);v=calc_field(R*math.sin(angle),R*math.cos(angle),sources)[0];partial=0
  for index,order in enumerate(row['orders']):
   ck(order['order']==index)
   l=order['order'];P=legendre_exact(l,math.cos(angle));moment=math.fsum(qi*zi**l for qi,zi in sources);term=moment*P/R**(l+1);partial+=term;bound=math.fsum(abs(qi)/R*(abs(zi)/R)**(l+1)/(1-abs(zi)/R)for qi,zi in sources)
   for name,value in [('P',P),('moment',moment),('term',term),('partial',partial),('direct',v),('error',partial-v),('tailBound',bound)]:close(order[name],value,name)
   ck(abs(partial-v)<=bound+2e-12*(1+abs(v)),'rigorous multipole tail')
   close(order['absoluteError'],abs(partial-v));ck(len(order['sourceTerms'])==len(sources));ck(len(order['tailTerms'])==len(sources))
   for t,(qi,zi),tail,role in zip(order['sourceTerms'],sources,order['tailTerms'],['real','image','central-image']):
    ck(t['role']==role)
    for key,value in [('charge',qi),('position',zi),('moment',qi*zi**l),('contribution',qi*zi**l*P/R**(l+1))]:close(t[key],value,key)
    close(tail,abs(qi)/R*(abs(zi)/R)**(l+1)/(1-abs(zi)/R))
 for j,r in enumerate(s['far']):close(r['theta'],(math.pi/2 if plane else math.pi)*j/64)
 close(s['probe']['theta'],float(c['angle'])*math.pi/180);ck(s['selectedOrder']==int(c['order']))

import xml.etree.ElementTree as ET
def equal_values(a,b):
 if isinstance(a,(int,float))and not isinstance(a,bool)and isinstance(b,(int,float))and not isinstance(b,bool):close(a,b);return
 if isinstance(a,list)and isinstance(b,list):
  ck(len(a)==len(b))
  for x,y in zip(a,b):equal_values(x,y)
 else:ck(a==b,'view value '+str((a,b))[:160])
def fields(r,keys):return[r[k]for k in keys.split()]
def check_view(s,v):
 m=s['model'];plane=m['geometry']=='plane';b=s['boundary'];quad=s['quadrature'];far=s['far']+[s['probe']];order=s['selectedOrder'];cx=lambda r:r['coordinate']if plane else r['coordinate']*180/math.pi
 expected=[
  None,
  [[cx(r),r[k]]for r in b for k in []],
 ]
 # Each displayed series is matched to its independently checked physical quantity.
 plot_series=[None,
  [[[cx(r),r[k]]for r in b]for k in ['potential','expectedPotential']],
  [[[cx(r),r[k]]for r in b]for k in ['density','expectedDensity']],
  [[[0,0]]+[[cx(b[j+1]),r['cumulative']]for j,r in enumerate(quad)],[[cx(r),r['capCharge']]for r in b],[[cx(r),m['surfaceCharge']]for r in b]],
  [[[r['gap'],r[k]]for r in s['forceScan']]for k in ['force','negativeNumericalDerivative']],
  [[[r['gap'],r['energy']]for r in s['forceScan']]],
  [[[r['theta']*180/math.pi,r['direct']['potential']]for r in s['far']],[[r['theta']*180/math.pi,r['orders'][order]['partial']]for r in s['far']]],
  [[[r['order'],r[k]]for r in s['probe']['orders']]for k in ['absoluteError','tailBound']]]
 ck([p['key']for p in v['plots']]==['geometry','potential','density','charge','force','energy','multipole','tail']);ck(len(v['svgs'])==8)
 for j,(p,svg)in enumerate(zip(v['plots'],v['svgs'])):
  if j:
   ck(len(p['series'])==len(plot_series[j]))
   for r,expected in zip(p['series'],plot_series[j]):equal_values(r['points'],expected)
  else:
   ck(len(p['series'])==len(m['sources'])+1);close((p['xMax']-p['xMin'])/762,(p['yMax']-p['yMin'])/259)
   for r,t in zip(p['series'],m['sources']):equal_values(r['points'],[[0,t['z']]])
   curve=p['series'][-1]['points'];ck(len(curve)==129)
   for i,(x,z)in enumerate(curve):
    if plane:close(z,0);close(x,p['xMin']+(p['xMax']-p['xMin'])*i/128)
    else:close(x,m['a']*math.sin(2*math.pi*i/128));close(z,m['a']*math.cos(2*math.pi*i/128));close(x*x+z*z,m['a']**2)
  root=ET.fromstring(svg);ck(root.attrib['viewBox']=='0 0 900 460');ns='{http://www.w3.org/2000/svg}';ck(root.find(ns+'title').text==p['title']);ck(root.find(ns+'desc').text==p['caption']);lines={int(e.attrib['data-series']):e for e in root.findall(ns+'polyline')};ck(len(lines)==len(p['series']))
  for k,r in enumerate(p['series']):
   points=[[float(c)for c in t.split(',')]for t in lines[k].attrib['points'].split()];ck(len(points)==len(r['points']));ck(lines[k].attrib['stroke']==r['color'])
   for actual,(x,y)in zip(points,r['points']):
    ck(p['xMin']<=x<=p['xMax']and p['yMin']<=y<=p['yMax']);close(actual[0],104+(x-p['xMin'])/(p['xMax']-p['xMin'])*762);close(actual[1],360-(y-p['yMin'])/(p['yMax']-p['yMin'])*259)
 def orow(r,t):return [r['theta'],r['radius']]+fields(t,'order P moment term partial direct error absoluteError tailBound')
 summary=[m['geometry'],m['q'],None if plane else m['a'],m['gap'],m['d'],m['Q']if m['geometry']=='isolated'else None,m['surfacePotential'],m['surfaceCharge'],s['quadratureStatus']['total'],s['quadratureStatus']['exactFinite'],s['quadratureStatus']['remainingCharge'],s['quadratureStatus']['estimatedError'],s['quadratureStatus']['converged'],s['force']['force'],s['force']['expectedForce'],s['force']['forceResidual'],s['force']['energy'],m['physicalDomain'],s['units'],s['scope']]
 expected={
 'sources':[fields(r,'role q z')for r in m['sources']],
 'boundary':[[j]+fields(r,'coordinate x z potential expectedPotential potentialResidual ex ez normalField expectedNormal normalResidual tangentialField density expectedDensity capCharge')for j,r in enumerate(b)],
 'boundary-sources':[[j]+fields(t,'role distance potential ex ez')for j,r in enumerate(b)for t in r['terms']],
 'integrals':[[j,b[j]['coordinate'],b[j+1]['coordinate']]+fields(r,'value cumulative exactCap actualError estimatedError estimatedCumulativeError evaluations converged')+[len(r['leaves'])]for j,r in enumerate(quad)],
 'leaves':[[j,k]+fields(t,'a b fa fm fb fl fr whole left right delta corrected estimatedError tolerance accepted depthUsed')for j,r in enumerate(quad)for k,t in enumerate(r['leaves'])],
 'force-scan':[fields(r,'gap d force energy step')+r['energySamples']+fields(r,'negativeNumericalDerivative derivativeResidual')for r in s['forceScan']],
 'force-sources':[fields(t,'role distance potential ex ez')for t in s['force']['imageField']['terms']],
 'probe':[orow(s['probe'],t)for t in s['probe']['orders']],
 'far':[orow(r,t)for r in s['far']for t in r['orders']],
 'multipole-sources':[['探针'if j==65 else j,r['theta'],t['order']]+fields(w,'role charge position moment contribution')+[t['tailTerms'][i]]for j,r in enumerate(far)for t in r['orders']for i,w in enumerate(t['sourceTerms'])],
 'far-fields':[['探针'if j==65 else j]+fields(r,'theta radius x z')+fields(r['direct'],'potential ex ez')+fields(t,'role distance potential ex ez')for j,r in enumerate(far)for t in r['direct']['terms']]}
 ck([t['key']for t in v['tables']]==['summary']+list(expected));ck(len(v['formatted'])==12)
 for t,formatted in zip(v['tables'],v['formatted']):
  if t['key']=='summary':equal_values([r[1]for r in t['rows']],summary);ck(all(len(r)==2 and r[0]for r in t['rows']))
  else:equal_values(t['rows'],expected[t['key']])
  ck(len(formatted)==len(t['rows']));ck(all(len(r)==len(t['headers'])for r in t['rows']))
  for row,raw in zip(formatted,t['rows']):
   ck(len(row)==len(raw))
   for text,value in zip(row,raw):
    ck(isinstance(text,str))
    if isinstance(value,bool):ck(text==str(value).lower())
    elif isinstance(value,(int,float)):close(float(text),value,'formatted number',6e-8)
    elif value is None:ck(text=='不适用')
    else:ck(text==value)

for d,v in zip(bundle["states"],bundle["views"]):check_state(d);check_view(d,v)

import re,html,hashlib
from html.parser import HTMLParser
f=json.loads(FIXTURE.read_text());ck(f['schema']==1);ck(f['provenance']=={'date':'2026-09-12','node':'v24.14.0','platform':'darwin','arch':'arm64','jsSha256':hashlib.sha256(JS.read_bytes()).hexdigest()});ck(bundle['frozen']==4)
if not STAGING:
 src=(ROOT/'physics-course/lectures/ced-01-boundary.md').read_text();site=(ROOT/'physics-course/site/ced-01-boundary.html').read_text()
 formulas=[(a or b).strip()for a,b in re.findall(r'\$\$(.*?)\$\$|(?<!\\)\$(?!\$)(.*?)(?<!\\)\$(?!\$)',src,re.S)]
 actual=[html.unescape(a or b).strip()for a,b in re.findall(r'<(?:span|div) class="arithmatex">(?:\\\((.*?)\\\)|\\\[(.*?)\\\])</(?:span|div)>',site,re.S)]
 ck(formulas==actual,'source formulas reach HTML in order');ck(len(re.findall(r'^## [0-9]+\.',src,re.M))==12);ck(not re.search(r'<p>\s*<details|</details>\s*</p>',site))
 class Disclosure(HTMLParser):
  def __init__(self):super().__init__();self.stack=[];self.answers=0
  def handle_starttag(self,tag,attrs):
   if tag=='details':
    ck(not self.stack);kind=dict(attrs).get('class');ck(kind in ['answer','page-toc']);self.stack.append([kind,0]);self.answers+=kind=='answer'
   if tag=='summary':ck(bool(self.stack));self.stack[-1][1]+=1
  def handle_endtag(self,tag):
   if tag=='details':ck(bool(self.stack));ck(self.stack.pop()[1]==1)
 parser=Disclosure();parser.feed(re.search(r'<article[^>]*>(.*?)</article>',site,re.S).group(1));ck(parser.answers==4 and not parser.stack)
 for link in re.findall(r'(?:href|src)="([^"]+)"',site):
  target=link.split('#')[0].split('?')[0]
  if target and not re.match(r'^[a-zA-Z]+:',target)and not target.startswith('/'):ck((ROOT/'physics-course/site'/target).exists(),'local target '+target)
 for course in ['ai-course','grad-math','math-course','physics-course']:ck((ROOT/course/'site/assets/learning/labs/image-charge-boundary.js').read_bytes()==JS.read_bytes())
 ck((ROOT/'physics-course/site/assets/learning/projects/image-charge-boundary/run-snapshot.json').read_bytes()==FIXTURE.read_bytes());ck((ROOT/'.github/workflows/course-audit.yml').read_text().count('python tools/check_boundary_multipoles_full.py')==1)
 image=ROOT/'physics-course/images/ced-01-boundary-ledgers.svg';ck(image.read_bytes()==(ROOT/'physics-course/site/assets/img/ced-01-boundary-ledgers.svg').read_bytes());root=ET.parse(image).getroot();ck(root.attrib['viewBox']=='0 0 1000 2300');panels=root.findall('.//{http://www.w3.org/2000/svg}svg');ck(len(panels)==4)
 def compare(a,b):
  ck(a.tag==b.tag and set(a.attrib)==set(b.attrib));ck(a.text==b.text and a.tail==b.tail)
  for k,v in a.attrib.items():
   if k in ['x','y','x1','y1','x2','y2','cx','cy','r','width','height']:close(float(v),float(b.attrib[k]))
   else:ck(v==b.attrib[k])
  ck(len(a)==len(b))
  for x,y in zip(a,b):compare(x,y)
 # Frozen bundle order: plane, grounded, isolated, zero.
 for i,(p,j,k)in enumerate(zip(panels,[-4,-3,-2,-1],[3,2,4,0])):
  ck(p.attrib.pop('x')=='50'and p.attrib.pop('y')==str([85,640,1195,1750][i]));compare(p,ET.fromstring(bundle['views'][j]['svgs'][k]))
 table=re.search(r'data-learning-lab="image-charge-boundary".*?<tbody>(.*?)</tbody>',site,re.S).group(1);vals=[html.unescape(x).strip()for x in re.findall(r'<tr>\s*<td>.*?</td>\s*<td[^>]*>(.*?)</td>\s*</tr>',table,re.S)]
 s=f['plane'];g=f['grounded'];n=f['isolated'];z=f['zero']
 refs=[s['model']['surfacePotential'],s['model']['surfaceCharge'],s['quadratureStatus']['total'],s['quadratureStatus']['remainingCharge'],s['force']['force'],s['force']['energy'],g['model']['qp'],g['model']['b'],g['model']['surfacePotential'],g['model']['surfaceCharge'],g['force']['force'],g['force']['energy'],n['model']['q0'],n['model']['surfacePotential'],n['model']['surfaceCharge'],n['force']['force'],n['force']['energy'],z['boundary'][0]['normalField'],z['force']['force'],z['probe']['orders'][4]['tailBound']];ck(len(vals)==len(refs)==20)
 for v,r in zip(vals,refs):close(float(v),r)
 for word in ['必要兼容条件','固定总电荷','半因子','自场','无迹四极','绝对尾界','Simpson','球心','互易性','色散力']:ck(word in src,'proof and interpretation '+word)
 with tempfile.TemporaryDirectory()as td:
  out=Path(td)/'figure.svg';fallback=Path(td)/'fallback.md';subprocess.run(PREFIX+['python3',str(ROOT/'tools/build_boundary_multipoles_figure.py'),str(JS),str(out),str(FIXTURE),str(fallback)],check=True,stdout=subprocess.DEVNULL);compare(ET.parse(image).getroot(),ET.parse(out).getroot());ck(fallback.read_text()in src)
 print('formulas='+str(len(formulas)))
print(json.dumps({'status':'PASS','live':bundle['live'],'frozen':bundle['frozen'],'checks':checks,'invalid':bundle['invalid'],'mutationGuards':bundle['mutationGuards'],'self':bundle['self']['checks'],'invariance':bundle['invariance']}))
