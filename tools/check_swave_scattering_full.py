from pathlib import Path
import json,subprocess,tempfile,shutil,sys
PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
STAGING='--staging'in sys.argv
ROOT=Path(__file__).resolve().parents[1]
JS=ROOT/('work/scattering167.js'if STAGING else'course-shared/labs/swave-scattering.js')
FIXTURE=ROOT/('work/scattering-snapshot167-v2.json'if STAGING else'course-shared/projects/swave-scattering/run-snapshot.json')
NODE='const fs=require(\'fs\'),assert=require(\'assert\'),a=require(require(\'path\').resolve(process.argv[2])),states=a.PRESETS.map(p=>a.snapshot(p.values));\nfor(const depth of [\'0\',\'0.00000001\',\'0.25\',\'2.4674011002723395\',\'9.869604401089358\',\'20.19\',\'22.206609902451056\',\'25\'])for(const k of [\'0.02\',\'0.35\',\'1.1\',\'2.5\'])for(const eta of [\'1\',\'0.4\',\'0\'])states.push(a.snapshot({depth,k,eta,lmax:\'6\'}));\nlet invalid=0;const bads=[null,[],true,0,\'\',{extra:\'1\'},{constructor:\'1\'},JSON.parse(\'{"__proto__":"1"}\')];for(const k of Object.keys(a.DEFAULTS))for(const v of [null,undefined,[],{},1,Infinity,\'1e0\',\'NaN\',\'\',\' 1\',\'1 \',\'0.00000000000000000000000001\'])bads.push({[k]:v});for(const [k,values]of [[\'depth\',[\'-0.01\',\'25.1\']],[\'k\',[\'0\',\'0.019\',\'2.51\']],[\'eta\',[\'-0.01\',\'1.01\']],[\'angle\',[\'-1\',\'180.1\']],[\'lmax\',[\'-0\',\'+1\',\'01\',\'1.0\',\'0.5\',\'7\']]])for(const v of values)bads.push({[k]:v});for(const v of bads){assert.throws(()=>a.snapshot(v));invalid++;}\nconst canonical=JSON.stringify(a.snapshot());for(const mutate of [s=>s.partials[0].sin=99,s=>s.radial[0].u=99,s=>s.angular[0].terms[0].real=99,s=>s.energyScan[0].partials[0].delta=99]){const s=a.snapshot();mutate(s);assert.equal(JSON.stringify(a.snapshot()),canonical);}\nconst close=(x,y)=>assert(Number.isFinite(x)&&Number.isFinite(y)&&Math.abs(x-y)<2e-10*(1+Math.abs(y)));\nlet invariance=0;\nfor(const eta of [\'1\',\'0.4\']){const x=a.snapshot({eta,angle:\'0\'}),y=a.snapshot({eta,angle:\'180\'});delete x.parameters;delete y.parameters;delete x.selected;delete y.selected;assert.equal(JSON.stringify(x),JSON.stringify(y));invariance++;}\nfor(const k of [\'0.02\',\'2.5\']){const x=a.snapshot({eta:\'0\',depth:\'0\',k}),y=a.snapshot({eta:\'0\',depth:\'25\',k});for(const key of [\'elastic\',\'reaction\',\'total\',\'optical\'])close(x.totals[key],y.totals[key]);x.angular.forEach((r,j)=>{for(const key of [\'real\',\'imag\',\'differential\'])close(r[key],y.angular[j][key]);});invariance++;}\nfunction compare(x,y){if(typeof x===\'number\'&&typeof y===\'number\'){close(x,y);return;}if(x&&y&&typeof x===\'object\'&&typeof y===\'object\'){assert.deepEqual(Object.keys(x),Object.keys(y));for(const k of Object.keys(x))compare(x[k],y[k]);return;}assert.strictEqual(x,y);}\nlet frozen=0;if(process.argv[3]!==\'-\'){const f=JSON.parse(fs.readFileSync(process.argv[3]));for(const k of [\'default\',\'threshold\',\'deep\',\'black\']){compare(a.snapshot(f[k].parameters),f[k]);states.push(f[k]);frozen++;}}\nconst views=states.map(s=>{const p=a.plots(s),tables=a.ledgers(s);return{plots:p,svgs:p.map(a.svg),tables,formatted:tables.map(t=>t.rows.map(r=>r.map(a.fmt)))};});fs.writeFileSync(process.argv[4],JSON.stringify({states,views,live:states.length-frozen,frozen,invalid,mutationGuards:4,invariance,self:a.selfTest()}));\n'
with tempfile.TemporaryDirectory()as td:
 script=Path(td)/'export.cjs';out=Path(td)/'bundle.json';script.write_text(NODE)
 subprocess.run(PREFIX+['node',str(script),str(JS),str(FIXTURE),str(out)],check=True)
 bundle=json.loads(out.read_text())

import math
from decimal import Decimal,localcontext
from functools import lru_cache
checks=0
def ck(v,label='check'):
 global checks
 checks+=1
 if not v:raise AssertionError(label)
def close(a,b,label='number',tol=3e-9):
 ck(isinstance(a,(int,float))and isinstance(b,(int,float))and math.isfinite(a)and math.isfinite(b)and abs(a-b)<=tol*max(1,abs(b)),(label,a,b))
def same(a,b):
 if isinstance(b,dict):
  ck(isinstance(a,dict)and set(a)==set(b));[same(a[k],v)for k,v in b.items()]
 elif isinstance(b,list):
  ck(isinstance(a,list)and len(a)==len(b));[same(x,y)for x,y in zip(a,b)]
 elif isinstance(b,bool)or b is None or isinstance(b,str):ck(a==b)
 else:close(a,b)
@lru_cache(None)
def special(l,value):
 # Independent high-precision upward recurrence, not the live j_l power series.
 with localcontext()as ctx:
  ctx.prec=70;x=Decimal(str(value));ss=x;cc=Decimal(1);ts=x;tc=Decimal(1)
  for n in range(1,130):
   ts*= -x*x/((2*n)*(2*n+1));tc*= -x*x/((2*n-1)*(2*n));ss+=ts;cc+=tc
   if abs(ts)+abs(tc)<Decimal('1e-68'):break
  js=[ss/x,ss/x**2-cc/x];ys=[-cc/x,-cc/x**2-ss/x]
  for n in range(1,l+1):js.append((2*n+1)*js[-1]/x-js[-2]);ys.append((2*n+1)*ys[-1]/x-ys[-2])
  return tuple(float(v)for v in [x*js[l],(l+1)*js[l]-x*js[l+1],-x*ys[l],-(l+1)*ys[l]+x*ys[l+1]])
def partial_check(r,V,k,eta):
 l=r['l'];ck(isinstance(l,int)and 0<=l<=6);q=math.sqrt(k*k+V);F,fd,_,_=special(l,q);s,sd,c,cd=special(l,k);Fp=q*fd;sp=k*sd;cp=k*cd
 a=Fp*c-F*cp;b=F*sp-Fp*s;norm=math.hypot(a,b);co=a/norm;si=b/norm
 if V==0:co=1.;si=0.
 u=co*s+si*c;du=co*sp+si*cp;A=(F*u+Fp*du)/(F*F+Fp*Fp);d=(1-eta)+2*eta*si*si;im=2*eta*si*co;fac=math.pi*(2*l+1)/(k*k)
 expect=dict(l=l,q=q,F=F,Fp=Fp,s=s,sp=sp,c=c,cp=cp,a=a,b=b,norm=norm,cos=co,sin=si,delta=math.atan2(si,co),amplitude=A,u=u,du=du,uInside=A*F,duInside=A*Fp,uResidual=A*F-u,duResidual=A*Fp-du,sr=1-d,si=im,oneMinusSr=d,modulusSquared=(1-d)**2+im*im,elastic=fac*(d*d+im*im),reaction=fac*(1-eta)*(1+eta),total=2*fac*d,optical=2*fac*d,unitarity=4*fac,wronskian=s*cp-sp*c)
 same(r,expect);close(r['uResidual'],0);close(r['duResidual'],0);close(r['wronskian'],-k);close(r['modulusSquared'],eta*eta)
 return complex(im,d)*(2*l+1)/(2*k)
def P(l,x):
 # Rodrigues formula expanded as a polynomial, independent of live recurrence.
 return sum((-1)**j*math.factorial(2*l-2*j)*x**(l-2*j)/(2**l*math.factorial(j)*math.factorial(l-j)*math.factorial(l-2*j))for j in range(l//2+1))
def amplitude_check(r,coeff,x):
 terms=[dict(l=l,P=P(l,x),real=(z*P(l,x)).real,imag=(z*P(l,x)).imag)for l,z in enumerate(coeff)];z=sum((complex(v['real'],v['imag'])for v in terms),0j)
 for key,v in dict(x=x,real=z.real,imag=z.imag,differential=abs(z)**2,terms=terms).items():same(r[key],v)
def born_check(r,V,k,x):
 Q=k*math.sqrt(max(0,2*(1-x)))
 with localcontext()as ctx:
  ctx.prec=60;z=Decimal(str(Q));ss=z;cc=Decimal(1);ts=z;tc=Decimal(1)
  for n in range(1,100):
   ts*= -z*z/((2*n)*(2*n+1));tc*= -z*z/((2*n-1)*(2*n));ss+=ts;cc+=tc
  f=float(Decimal(str(V))*(ss-z*cc)/z**3)if Q else V/3
 same(r,dict(Q=Q,real=f,imag=0,differential=f*f))
def totals_check(t,partials,k,L,coeff):
 elastic=reaction=total=0.;rows=[]
 for l,r in enumerate(partials):
  elastic+=r['elastic'];reaction+=r['reaction'];total+=r['total'];rows.append(dict(l=l,elastic=elastic,reaction=reaction,total=total,increment=r['elastic']))
 same(t['rows'],rows);chosen=rows[L]
 for key in ['l','elastic','reaction','total']:same(t[key],chosen[key])
 same(t['increment'],chosen['increment']);amplitude_check(t['forward'],coeff[:L+1],1);close(t['optical'],4*math.pi*t['forward']['imag']/k);close(t['closure'],t['elastic']+t['reaction']-t['total']);close(t['opticalResidual'],t['optical']-t['total']);close(t['closure'],0,tol=3e-8);close(t['opticalResidual'],0,tol=3e-8)
def check_state(s):
 ck(s['schema']==1);p=s['parameters'];V=float(p['depth']);k=float(p['k']);eta=float(p['eta']);L=int(p['lmax']);angle=float(p['angle']);ck(0<=V<=25 and .02<=k<=2.5 and 0<=eta<=1 and 0<=L<=6 and 0<=angle<=180)
 ck(len(s['partials'])==7);coeff=[partial_check(r,V,k,eta)for r in s['partials']];totals_check(s['totals'],s['partials'],k,L,coeff)
 ck(len(s['radial'])==194)
 for i,r in enumerate(s['radial']):
  inside=i<=64;rr=i/64 if inside else 1+11*(i-65)/128;ck(r['side']==('inside'if inside else'outside'));close(r['r'],rr);r0=s['partials'][0];phase=k*rr+r0['delta'];u=r0['amplitude']*math.sin(r0['q']*rr)if inside else math.sin(phase);du=r0['amplitude']*r0['q']*math.cos(r0['q']*rr)if inside else k*math.cos(phase);close(r['u'],u);close(r['du'],du)
 ck(s['radial'][64]['r']==s['radial'][65]['r']==1)
 ck(len(s['angular'])==129)
 for i,r in enumerate(s['angular']):
  theta=i*180/128;close(r['theta'],theta);x=math.cos(math.radians(theta));amplitude_check(r,coeff[:L+1],x);born_check(r['born'],V,k,x)
 close(s['selected']['theta'],angle);x=math.cos(math.radians(angle));amplitude_check(s['selected'],coeff[:L+1],x);born_check(s['selected']['born'],V,k,x)
 nodes=s['quadrature'];ck(len(nodes)==32);ck(all(-1<r['x']<1 and r['weight']>0 for r in nodes));ck(all(nodes[i]['x']<nodes[i+1]['x']for i in range(31)))
 for m in range(64):close(sum(r['weight']*r['x']**m for r in nodes),2/(m+1)if m%2==0 else 0,'Gauss moments',1e-12)
 for i,r in enumerate(nodes):
  ck(r['index']==i);amplitude_check(r['f'],coeff[:L+1],r['x']);born_check(r['born'],V,k,r['x']);close(r['elasticContribution'],2*math.pi*r['weight']*r['f']['differential']);close(r['bornContribution'],2*math.pi*r['weight']*r['born']['differential'])
 close(s['integratedElastic'],sum(r['elasticContribution']for r in nodes));close(s['integratedBorn'],sum(r['bornContribution']for r in nodes));close(s['angularResidual'],s['integratedElastic']-s['totals']['elastic']);close(s['integratedElastic'],s['totals']['elastic']);born_check(s['bornForward'],V,k,1)
 ck(len(s['energyScan'])==65)
 for i,r in enumerate(s['energyScan']):
  wave=.02+2.48*i/64;close(r['k'],wave);ck(len(r['partials'])==7);c=[partial_check(v,V,wave,eta)for v in r['partials']];totals_check(r['totals'],r['partials'],wave,L,c)
 depths=[r['depth']for r in s['depthScan']];ck(len(depths)>=129 and depths==sorted(set(depths)));ck(all(25*i/128 in depths for i in range(129)));ck(V in depths)
 for root in s['depthRoots']:
  ck(root in depths and 0<=root<=25);q=math.sqrt(k*k+root);close(q*math.cos(q)*math.cos(k)+k*math.sin(q)*math.sin(k),0,'resonance root',1e-12)
 for r in s['depthScan']:
  depth=r['depth'];partial_check(r['partial'],depth,k,1);close(r['sinSquared'],r['partial']['sin']**2)
 a=s['scatteringLength'];x=math.sqrt(V);close(a['x'],x)
 if V==0:same(a,dict(x=0,numerator=0,denominator=1,value=0,nearPole=False))
 else:
  numerator=x*math.cos(x)-math.sin(x);den=x*math.cos(x);close(a['numerator'],numerator);close(a['denominator'],den);ck(a['nearPole']==(abs(den)<1e-10))
  if a['value']is not None:close(a['value']*a['denominator'],a['numerator'])
  else:ck(den==0)

import xml.etree.ElementTree as ET
def vals(r,keys):return[r[k]for k in keys.split()]
def check_view(s,v):
 p=s['parameters'];L=int(p['lmax']);t=s['totals'];a=s['scatteringLength'];k=float(p['k'])
 expected=[
  [[[r['r'],r['u']]for r in s['radial']if r['side']==side]for side in ['inside','outside']],
  [[[r['r'],r['du']]for r in s['radial']if r['side']==side]for side in ['inside','outside']],
  [[[r['theta'],r['differential']]for r in s['angular']],[[r['theta'],r['born']['differential']]for r in s['angular']]],
  [[[r['l'],r[key]]for r in t['rows']]for key in ['elastic','reaction','total']],
  [[[r['k'],r['totals'][key]]for r in s['energyScan']]for key in ['elastic','total']]+[[[r['k'],4*math.pi*r['partials'][0]['sin']**2/r['k']**2]for r in s['energyScan']]],
  [[[r['depth'],r['sinSquared']]for r in s['depthScan']]],
  [[[r['l'],r[key]]for r in s['partials'][:L+1]]for key in ['sr','si','modulusSquared']],
  [[[r['theta'],r[key]]for r in s['angular']]for key in ['real','imag']]+[[[r['theta'],r['born']['real']]for r in s['angular']]]]
 ck([r['key']for r in v['plots']]==['radial','derivative','angular','convergence','energy','depth','s-elements','amplitudes']);ck(len(v['svgs'])==8)
 for index,(plot,svg,lines)in enumerate(zip(v['plots'],v['svgs'],expected)):
  root=ET.fromstring(svg);ns='{http://www.w3.org/2000/svg}';ck(root.attrib['viewBox']=='0 0 900 460');ck(root.find(ns+'title').text==plot['title']);ck(root.find(ns+'desc').text==plot['caption']);ck(len(plot['series'])==len(lines));rendered={int(e.attrib['data-series']):e for e in root.findall(ns+'polyline')};ck(len(rendered)==len(lines))
  for j,(series,points)in enumerate(zip(plot['series'],lines)):
   same(series['points'],points);e=rendered[j];ck(e.attrib['stroke']==series['color']);xy=[[float(x)for x in pair.split(',')]for pair in e.attrib['points'].split()];ck(len(xy)==len(points))
   for actual,(x,y)in zip(xy,points):
    ck(plot['xMin']<=x<=plot['xMax']and plot['yMin']<=y<=plot['yMax']);close(actual[0],104+762*(x-plot['xMin'])/(plot['xMax']-plot['xMin']));close(actual[1],360-259*(y-plot['yMin'])/(plot['yMax']-plot['yMin']))
  markers=[e for e in root.findall(ns+'line')if e.attrib.get('stroke-dasharray')=='2 5']
  if index in [0,1,3]:
   ck(len(markers)==1);value=1 if index<2 else L;close(float(markers[0].attrib['x1']),104+762*(value-plot['xMin'])/(plot['xMax']-plot['xMin']))
  else:ck(not markers)
  if index in [3,6]:ck(plot['integerX']is True)
 summary=[float(p[key])for key in ['depth','k','lmax','eta','angle']]+vals(s['selected'],'x real imag differential')+[s['selected']['born'][key]for key in ['real','differential']]+vals(t,'elastic reaction total optical')+[s['integratedElastic'],s['angularResidual']]+vals(t,'closure opticalResidual')+vals(t['forward'],'real imag')+[s['integratedBorn']]+vals(s['bornForward'],'real imag')+vals(a,'x numerator denominator value')+['是：不把机器大数当作精确无穷'if a['nearPole']else'否',s['scope']]
 pr=lambda r:vals(r,'l q F Fp s sp c cp a b norm cos sin delta amplitude u du uInside duInside uResidual duResidual sr si oneMinusSr modulusSquared elastic reaction total unitarity wronskian')
 tr=lambda tag,r:[tag]+vals(r,'l P real imag');sr=lambda r:vals(r,'l elastic reaction total increment')
 tables={
 'partials':[pr(r)for r in s['partials']],
 'radial':[vals(r,'side r u du')for r in s['radial']],
 'angles':[vals(r,'theta x real imag differential')+vals(r['born'],'Q real imag differential')for r in s['angular']],
 'angle-terms':[tr(r['theta'],q)for r in s['angular']for q in r['terms']],
 'selected-terms':[tr('当前',r)for r in s['selected']['terms']]+[tr('前向',r)for r in t['forward']['terms']],
 'quadrature':[vals(r,'index x weight')+vals(r['f'],'real imag differential')+vals(r['born'],'Q real differential')+vals(r,'elasticContribution bornContribution')for r in s['quadrature']],
 'quadrature-terms':[tr(r['index'],q)for r in s['quadrature']for q in r['f']['terms']],
 'convergence':[sr(r)for r in t['rows']],
 'energy':[[r['k']]+vals(r['totals'],'l elastic reaction total optical closure opticalResidual')+vals(r['totals']['forward'],'real imag')for r in s['energyScan']],
 'energy-partials':[[r['k']]+pr(q)for r in s['energyScan']for q in r['partials']],
 'energy-convergence':[[r['k']]+sr(q)for r in s['energyScan']for q in r['totals']['rows']],
 'depth':[[r['depth'],r['sinSquared']]+pr(r['partial'])for r in s['depthScan']]}
 ck([r['key']for r in v['tables']]==['summary']+list(tables));ck(len(v['formatted'])==13)
 for table,formatted in zip(v['tables'],v['formatted']):
  if table['key']=='summary':same([r[1]for r in table['rows']],summary);ck(all(len(r)==2 and r[0]for r in table['rows']))
  else:same(table['rows'],tables[table['key']])
  ck(len(formatted)==len(table['rows']));ck(all(len(r)==len(table['headers'])for r in table['rows']))
  for row,raw in zip(formatted,table['rows']):
   ck(len(row)==len(raw))
   for text,value in zip(row,raw):
    ck(isinstance(text,str))
    if isinstance(value,(int,float)):close(float(text),value,'formatted number',6e-8)
    elif value is None:ck(text=='不适用')
    else:ck(text==value)

for d,v in zip(bundle["states"],bundle["views"]):check_state(d);check_view(d,v)

import re,html,hashlib
from html.parser import HTMLParser
f=json.loads(FIXTURE.read_text());ck(f['schema']==1);ck(f['provenance']=={'date':'2026-09-12','node':'v24.14.0','platform':'darwin','arch':'arm64','jsSha256':hashlib.sha256(JS.read_bytes()).hexdigest()});ck(bundle['frozen']==4)
if not STAGING:
 src=(ROOT/'physics-course/lectures/aqm-02-scattering.md').read_text();site=(ROOT/'physics-course/site/aqm-02-scattering.html').read_text()
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
 for course in ['ai-course','grad-math','math-course','physics-course']:ck((ROOT/course/'site/assets/learning/labs/swave-scattering.js').read_bytes()==JS.read_bytes())
 ck((ROOT/'physics-course/site/assets/learning/projects/swave-scattering/run-snapshot.json').read_bytes()==FIXTURE.read_bytes());ck((ROOT/'.github/workflows/course-audit.yml').read_text().count('python tools/check_swave_scattering_full.py')==1)
 image=ROOT/'physics-course/images/aqm-02-scattering-ledgers.svg';ck(image.read_bytes()==(ROOT/'physics-course/site/assets/img/aqm-02-scattering-ledgers.svg').read_bytes());root=ET.parse(image).getroot();ck(root.attrib['viewBox']=='0 0 1000 2300');panels=root.findall('.//{http://www.w3.org/2000/svg}svg');ck(len(panels)==4)
 def compare(a,b):
  ck(a.tag==b.tag and set(a.attrib)==set(b.attrib));ck(a.text==b.text and a.tail==b.tail)
  for k,v in a.attrib.items():
   if k in ['x','y','x1','y1','x2','y2','cx','cy','r','width','height']:close(float(v),float(b.attrib[k]))
   else:ck(v==b.attrib[k])
  ck(len(a)==len(b))
  for x,y in zip(a,b):compare(x,y)
 # Frozen bundle order: default, threshold, deep, black.
 for i,(p,j,k)in enumerate(zip(panels,[-4,-3,-2,-1],[0,5,2,3])):
  ck(p.attrib.pop('x')=='50'and p.attrib.pop('y')==str([85,640,1195,1750][i]));compare(p,ET.fromstring(bundle['views'][j]['svgs'][k]))
 table=re.search(r'data-learning-lab="swave-scattering".*?<tbody>(.*?)</tbody>',site,re.S).group(1);vals=[html.unescape(x).strip()for x in re.findall(r'<tr>\s*<td>.*?</td>\s*<td[^>]*>(.*?)</td>\s*</tr>',table,re.S)]
 d=f['default'];t=f['threshold'];h=f['deep'];b=f['black']
 refs=[d['totals']['elastic'],d['totals']['reaction'],d['totals']['total'],d['totals']['optical'],d['scatteringLength']['value'],t['partials'][0]['sin']**2,t['totals']['elastic'],t['totals']['optical'],float(t['parameters']['k']),float(t['parameters']['depth']),h['totals']['elastic'],h['totals']['rows'][0]['elastic'],h['totals']['forward']['imag'],h['integratedBorn'],h['scatteringLength']['value'],float(b['parameters']['eta']),float(b['parameters']['lmax']),b['totals']['elastic'],b['totals']['reaction'],b['totals']['total']];ck(len(vals)==len(refs)==20)
 for v,r in zip(vals,refs):close(float(v),r)
 for word in ['概率流','Wronskian','半束缚态','有效程','出射Green','前向虚部','微扰阶数','现象学','同一分波','Born','指数符号','加密']:ck(word in src,'proof and interpretation '+word)
 with tempfile.TemporaryDirectory()as td:
  out=Path(td)/'figure.svg';fallback=Path(td)/'fallback.md';subprocess.run(PREFIX+['python3',str(ROOT/'tools/build_swave_scattering_figure.py'),str(JS),str(out),str(FIXTURE),str(fallback)],check=True,stdout=subprocess.DEVNULL);compare(ET.parse(image).getroot(),ET.parse(out).getroot());ck(fallback.read_text()in src)
 print('formulas='+str(len(formulas)))
print(json.dumps({'status':'PASS','live':bundle['live'],'frozen':bundle['frozen'],'checks':checks,'invalid':bundle['invalid'],'mutationGuards':bundle['mutationGuards'],'self':bundle['self']['checks'],'invariance':bundle['invariance']}))
