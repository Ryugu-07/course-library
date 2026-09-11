from fractions import Fraction as Q
from itertools import combinations,product
from pathlib import Path
import json,subprocess,sys,shutil,hashlib,re,html
ROOT=Path(__file__).resolve().parents[1]
PREFIX=['rtk','proxy'] if shutil.which('rtk') else []
JS=ROOT/'course-shared/labs/galois-correspondence.js'
FIXTURE=ROOT/'course-shared/projects/galois-correspondence/run-snapshot.json'
checks=0
def ck(v,msg='assertion'):
 global checks
 checks+=1
 if not v:raise AssertionError(msg)
DRIVER="const L=require(process.argv[1]),fs=require('fs'),assert=require('assert');const live=[];\nlet defs=L.MODELS.filter(x=>x.id!=='finite').map(x=>({model:x.id,n:x.degree}));for(const[p,f]of[[2,'0,1'],[2,'1,1,1'],[2,'1,1,0,1'],[2,'1,1,0,0,1'],[2,'1,0,1,0,0,1'],[2,'1,1,0,0,0,0,1'],[3,'1,0,1'],[3,'1,-1,0,1'],[5,'2,0,1'],[5,'1,1,0,1'],[7,'1,0,1']])defs.push({model:'finite',prime:String(p),polynomial:f,n:f.split(',').length-1});\nfor(const d of defs){const c={model:d.model,prime:d.prime||'2',polynomial:d.polynomial||'1,1,0,1',generators:'',element:Array(d.n).fill('0').join(',')},b=L.snapshot(c);assert(b.valid);for(const h of b.base.group.subgroups)live.push(L.snapshot({...c,generators:h.generators.join(','),element:Array.from({length:d.n},(_,i)=>String((i+h.id)%3-1)).join(',')}));live.push(b);live.push(L.snapshot({...c,element:Array.from({length:d.n},(_,i)=>i===Math.min(1,d.n-1)?'1':'0').join(',')}));}\nfor(const p of L.PRESETS)live.push(L.snapshot(p.values));\nconst bad=[null,[],42,'',{x:1},{model:null},{model:'Q'},{prime:2},{prime:'4'},{prime:'11'},{prime:''},{polynomial:null},{polynomial:'1'},{polynomial:'1,2'},{polynomial:'1,0,0,0,0,0,0,1'},{polynomial:'1,,1'},{polynomial:'1, 1'},{polynomial:'01,1'},{polynomial:'1e1,1'},{polynomial:'13,1'},{prime:'7',polynomial:'1,0,0,1'},{generators:null},{generators:'0,0'},{generators:'1,'},{generators:'01'},{generators:'-1'},{generators:'8'},{generators:'4'},{generators:'NaN'},{generators:'1.0'},{element:null},{element:''},{element:'0,1'},{element:'0,0,0,0,0'},{element:'1/0,0,0,0'},{element:'13,0,0,0'},{element:'1/13,0,0,0'},{element:'1/02,0,0,0'},{element:' 1,0,0,0'},{element:'1e2,0,0,0'},{element:'Infinity,0,0,0'},{element:'0x1,0,0,0'},{element:'1//2,0,0,0'},{element:'1/-2,0,0,0'},{model:'finite',element:'1/2,0,0'},{model:'nonnormal',element:'0,1,0',generators:'1'},{polynomial:'1'.repeat(101)},{generators:'1'.repeat(201)},{element:'0'.repeat(201)}];let invalid=0;for(const c of bad){assert.throws(()=>L.snapshot(c),undefined,JSON.stringify(c));invalid++;}\nconst old=L.snapshot();old.base.fixedFields[0].basis[0][0]='corrupt';assert.equal(L.snapshot().base.fixedFields[0].basis[0][0],'1');invalid++;\nconst frozen=[];if(process.argv[2]){const f=JSON.parse(fs.readFileSync(process.argv[2]));for(const k of ['biquadratic','cubic','finite','nonnormal']){const d=L.snapshot(f[k].parameters);assert.equal(JSON.stringify(d),JSON.stringify(f[k]));frozen.push(d);}}\nconst data=live.concat(frozen),views=data.map(d=>({plots:L.plots(d),svgs:L.plots(d).map(L.svg),ledgers:L.ledgers(d)}));console.log(JSON.stringify({live:live.length,invalid,self:L.selfTest(),data,views}));\n"
bundle=json.loads(subprocess.check_output(PREFIX+['node','-e',DRIVER,str(JS)]+([str(FIXTURE)]if FIXTURE.exists()else []),text=True))
data=bundle['data']
base_seen=set()
for s in data:
 if not s['valid']:
  ck(not s['irreducibility']['irreducible'] and '不是域' in s['reason']);continue
 b=s['base'];n=b['degree'];p=b['prime'];fx=list(map(int,b['relations']['x']));fy=list(map(int,b['relations']['y']));nx=len(fx)-1;ny=len(fy)-1
 def num(a):
  q=Q(a)
  return (q.numerator*pow(q.denominator,-1,p))%p if p else q
 def norm(a):return a%p if p else a
 def vec(a):return list(map(num,a))
 def add(a,b):return [norm(x+y)for x,y in zip(a,b)]
 def scale(a,c):return [norm(x*c)for x in a]
 zero=[num(0)]*n;one=[num(1)]+zero[1:]
 def mul(a,b):
  d={}
  for i,u in enumerate(a):
   for j,v in enumerate(b):
    e=(i%nx+j%nx,i//nx+j//nx);d[e]=norm(d.get(e,0)+u*v)
  for axis,f in [(0,fx),(1,fy)]:
   lim=len(f)-1
   while any(e[axis]>=lim and c for e,c in d.items()):
    e=max((e for e,c in d.items()if e[axis]>=lim and c),key=lambda e:e[axis]);c=d.pop(e)
    for j,a in enumerate(f[:-1]):
     q=list(e);q[axis]=e[axis]-lim+j;q=tuple(q);d[q]=norm(d.get(q,0)-c*a)
  return [norm(d.get((i,j),0))for j in range(ny)for i in range(nx)]
 def power(a,k):
  out=one
  for _ in range(k):out=mul(out,a)
  return out
 def mv(m,v):return [norm(sum(x*y for x,y in zip(r,v)))for r in m]
 def mm(m,k):return [[norm(sum(x*k[t][j]for t,x in enumerate(r)))for j in range(len(k[0]))]for r in m]
 def eye(d):return [[num(int(i==j))for j in range(d)]for i in range(d)]
 def rr(m,cols):
  r=[row[:]for row in m];pivot=[];i=0
  for j in range(cols):
   candidates=[k for k in range(i,len(r))if r[k][j]]
   if not candidates:continue
   k=candidates[-1];r[i],r[k]=r[k],r[i];c=r[i][j];r[i]=[norm(v*(pow(int(c),-1,p)if p else 1/c))for v in r[i]]
   for k in range(len(r)):
    if k!=i:r[k]=[norm(a-r[k][j]*b)for a,b in zip(r[k],r[i])]
   pivot.append(j);i+=1
  return r,pivot
 def rank(m,cols):return len(rr(m,cols)[1])
 def coords(bs,v):
  a=[[u[i]for u in bs]+[v[i]]for i in range(n)];r,piv=rr(a,len(bs)+1)
  if len(bs)in piv:return None
  out=[num(0)]*len(bs)
  for i,j in enumerate(piv):out[j]=r[i][-1]
  return out
 mats=[[vec(r)for r in a['matrix']['data']]for a in b['automorphisms']];g=len(mats)
 k=json.dumps([b['model'],p,fx,fy]);first=k not in base_seen
 if first:
  base_seen.add(k)
  X=[num(0)]*n;Y=X[:]
  X[1 if nx>1 else 0]=num(1 if nx>1 else -fx[0]);Y[nx if ny>1 else 0]=num(1 if ny>1 else -fy[0])
  expected=[]
  if b['model']=='biquadratic':expected=[(scale(X,sx),scale(Y,sy))for sy in [1,-1]for sx in [1,-1]]
  elif b['model']=='cubic':expected=[(mul(X,power(Y,k)),power(Y,t))for t in [1,2]for k in range(3)]
  elif b['model']=='quartic':expected=[(mul(X,power(Y,k)),power(Y,t))for t in [1,3]for k in range(4)]
  elif b['model'].startswith('cyclo'):
   from math import gcd
   modulus=int(b['model'][5:]);expected=[(power(X,k),Y)for k in range(1,modulus)if gcd(k,modulus)==1]
  elif b['model']=='finite':expected=[(power(X,p**k),Y)for k in range(n)]
  else:expected=[(X,Y)]
  ck(len(expected)==g)
  for a,(xx,yy)in zip(b['automorphisms'],expected):
   cols=[mul(power(xx,i),power(yy,j))for j in range(ny)for i in range(nx)];ck(mats[a['id']]==[list(r)for r in zip(*cols)],'actual substitution matrix');ck(vec(a['x'])==xx and vec(a['y'])==yy)
  ck(mats[0]==eye(n))
  for i in range(n):
   for j in range(n):ck(mul(eye(n)[i],eye(n)[j])==vec(b['structure'][i][j]),'ambient basis multiplication')
  table=[[mats.index(mm(a,z))for z in mats]for a in mats];ck(table==b['group']['multiplication'],'composition')
  all_subs=[]
  for mask in range(1<<g):
   h=[i for i in range(g)if mask>>i&1]
   if 0 in h and all(table[i][j]in h for i in h for j in h):all_subs.append(h)
  ck(sorted(all_subs)==sorted(h['elements']for h in b['group']['subgroups']),'complete subgroups')
  for h,f in zip(b['group']['subgroups'],b['fixedFields']):
   els=h['elements'];bs=[vec(v)for v in f['basis']];eqs=[[norm(v-int(i==j))for j,v in enumerate(mats[a][i])]for a in els for i in range(n)];R,piv=rr(eqs,n)
   ck([vec(r)for r in f['equations']['data']]==eqs);ck([vec(r)for r in f['rref']['data']]==R and f['pivots']==piv)
   U=[vec(r)for r in f['left']['data']];ck(mm(U,eqs)==R and rank(U,len(U))==len(U),'row certificate')
   ck(len(bs)==n-len(piv) and rank(bs,n)==len(bs),'complete fixed basis')
   for v in bs:
    for a in els:ck(mv(mats[a],v)==v)
   for i in range(len(bs)):
    for j in range(len(bs)):ck(coords(bs,mul(bs[i],bs[j]))==vec(f['multiplication'][i][j]))
   conjugates=[sorted(table[table[a][x]][b['group']['inverses'][a]]for x in els)for a in range(g)]
   ck(h['normal']==all(v==els for v in conjugates));ck(h['normalizer']==[a for a,v in enumerate(conjugates)if v==els])
   ck([b['group']['subgroups'][i]['elements']for i in h['conjugates']]==conjugates)
   if b['galois']:ck(n==len(bs)*len(els))
  inc=[]
  for f in b['fixedFields']:
   for z in b['fixedFields']:
    if f!=z and all(coords([vec(w)for w in z['basis']],vec(v))is not None for v in f['basis']):inc.append([f['subgroupId'],z['subgroupId']])
  ck(inc==b['fieldInclusions'])
  if b['galois']:ck(sorted(inc)==sorted([k,h]for h,k in b['group']['inclusions']))
 e=s['element'];v=vec(e['coordinates']);minimal=e['minimalPolynomial'];deg=minimal['degree'];powers=[power(v,i)for i in range(deg+1)];ck(powers==[vec(w)for w in minimal['powers']]);ck(rank(powers[:-1],n)==deg);ck([norm(sum(num(c)*powers[j][i]for j,c in enumerate(minimal['coefficients'])))for i in range(n)]==zero);ck(e['primitive']==(deg==n))
 if e['inverse']is not None:ck(mul(v,vec(e['inverse']))==one)
 else:ck(v==zero)
 cols=[mul(v,u)for u in eye(n)];M=[list(r)for r in zip(*cols)];ck(M==[vec(r)for r in e['multiplication']['data']]);ck(num(e['trace'])==norm(sum(M[i][i]for i in range(n))))
 # Leibniz determinant is independent of elimination; at most 8! terms.
 from itertools import permutations
 determinant=0
 for perm in permutations(range(n)):
  q=num((-1)**sum(perm[i]>perm[j]for i in range(n)for j in range(i+1,n)))
  for i,j in enumerate(perm):q=norm(q*M[i][j])
  determinant=norm(determinant+q)
 ck(num(e['norm'])==determinant)
 images=[mv(m,v)for m in mats];ck(images==[vec(w)for w in e['images']]);st=[i for i,w in enumerate(images)if w==v];ck(st==e['stabilizer']);orbit=[]
 for w in images:
  if w not in orbit:orbit.append(w)
 ck(orbit==[vec(w)for w in e['orbit']]);ck(len(orbit)*len(st)==g)
 pol=[one]
 for root in orbit:
  t=[zero[:]for _ in range(len(pol)+1)]
  for i,c in enumerate(pol):t[i]=add(t[i],scale(mul(root,c),-1));t[i+1]=add(t[i+1],c)
  pol=t
 ck(pol==[vec(w)for w in e['orbitPolynomial']]);ck(e['orbitPolynomialOverBase']==all(not any(w[1:])for w in pol))
 if b['galois']:ck([w[0]for w in pol]==vec(minimal['coefficients']))
 h=b['group']['subgroups'][s['selected']['subgroupId']];f=b['fixedFields'][h['id']];bs=[vec(w)for w in f['basis']];tr=zero;nm=one
 for a in h['elements']:tr=add(tr,images[a]);nm=mul(nm,images[a])
 ck(tr==vec(e['relativeTrace']) and nm==vec(e['relativeNorm']));ck(coords(bs,tr)==vec(e['relativeTraceCoordinates']) and coords(bs,nm)==vec(e['relativeNormCoordinates']))
 for f,member in zip(b['fixedFields'],e['membership']):ck(coords([vec(w)for w in f['basis']],v)==(None if member['coordinates']is None else vec(member['coordinates'])))
 q=s['selected']['quotient'];ck(q['exists']==h['normal'])
 if q['exists']:
  tab=b['group']['multiplication'];ck(sorted(x for row in q['cosets']for x in row)==list(range(g)))
  for i,row in enumerate(q['cosets']):
   ck(row==sorted(tab[row[0]][a]for a in h['elements']))
   for a in row:ck(q['projection'][a]==i)
  ck(q['multiplication']==[[q['projection'][tab[a[0]][z[0]]]for z in q['cosets']]for a in q['cosets']])
  for coset,R in zip(q['cosets'],q['restrictions']):
   for a in coset:
    columns=[coords(bs,mv(mats[a],w))for w in bs];ck([list(r)for r in zip(*columns)]==[vec(r)for r in R['data']],'restrictions constant on cosets')
  if b['galois']:ck(len(q['cosets'])==len(bs))
 else:
  w=mv(mats[q['conjugator']],bs[q['basisIndex']]);ck(w==vec(q['image']) and coords(bs,w)is None,'non-normal conjugate-field witness')
print(json.dumps({'status':'PASS','models':len(base_seen),'states':len(data),'checks':checks}))

import xml.etree.ElementTree as ET

def svg_check(raw,p):
 root=ET.fromstring(raw);ns='{http://www.w3.org/2000/svg}';ck(root.tag==ns+'svg' and root.get('width')=='900' and root.get('height')=='460');ck(root.get('role')=='img' and root.get('aria-label')==p['title']);ck(root.find(ns+'title').text==p['title'] and root.find(ns+'desc').text==p['caption']);nodes=list(root)[3:];ck(len(nodes)==len(p['items']),'all plotted primitives')
 for node,it in zip(nodes,p['items']):
  ck(node.tag==ns+it['tag']);attrs={k:v for k,v in it.items()if k not in ['tag','text']};attrs={ {'size':'font-size','anchor':'text-anchor','strokeWidth':'stroke-width'}.get(k,k):v for k,v in attrs.items()}
  if it['tag']=='text':attrs['font-family']='system-ui,sans-serif'
  ck(set(node.attrib)==set(attrs),'all attributes')
  for k,v in attrs.items():
   if isinstance(v,(float,int)):ck(abs(float(node.get(k))-v)<1e-9,'coordinate '+k)
   else:ck(node.get(k)==v,'attribute '+k)
  ck(node.text==(str(it['text'])if it['tag']=='text'else None),'text exact')

def view_check(s,v):
 ps=v['plots'];tabs={t['key']:t for t in v['ledgers']};ck(len(tabs)==len(v['ledgers']))
 for t in tabs.values():ck(all(len(row)==len(t['headers'])for row in t['rows']),'rectangular '+t['key'])
 if not s['valid']:
  ck(ps==[] and v['svgs']==[]);ck(tabs['irreducibility']['rows']==[list(x)for x in s['irreducibility'].items()]);return
 b=s['base'];g=b['group'];h=g['subgroups'][s['selected']['subgroupId']];f=b['fixedFields'][h['id']];e=s['element'];n=b['degree'];ck([p['key']for p in ps]==['correspondence','fixed-basis','element-degrees','composition']);ck(len(v['svgs'])==4)
 for p,raw in zip(ps,v['svgs']):svg_check(raw,p)
 text0=[it['text']for it in ps[0]['items']if it['tag']=='text'];ck(sorted(t for t in text0 if t.startswith('H'))==sorted('H'+str(h['id'])+': '+str(h['order'])for h in g['subgroups']));ck(sorted(t for t in text0 if t.startswith('K'))==sorted('K'+str(f['subgroupId'])+': '+str(f['dimension'])for f in b['fixedFields']))
 rects=[it for it in ps[0]['items']if it['tag']=='rect'];ck(len(rects)==2*len(g['subgroups']));ck(sum(it['fill']=='#fff0d4'for it in rects)==2)
 for i,a in enumerate(rects):
  for z in rects[i+1:]:
   if a['y']==z['y']:ck(a['x']+a['width']<=z['x'] or z['x']+z['width']<=a['x'],'disjoint same-level nodes')
 ck(sum(it['tag']=='line'for it in ps[0]['items'])==2*len(g['covers']))
 cells=[it for it in ps[1]['items']if it['tag']=='rect'];ck(len(cells)==n*f['dimension']);values=[it['text']for it in ps[1]['items']if it['tag']=='text'and it.get('size')==13 and 90<it['y']<400];ck(values==[c for row in f['basis']for c in row]);ck([c['fill']=='#ffffff'for c in cells]==[v=='0'for row in f['basis']for v in row])
 bars=[it for it in ps[2]['items']if it['tag']=='rect'];ck([it['width']/65 for it in bars]==[n,e['minimalPolynomial']['degree'],len(e['orbit']),len(e['stabilizer']),g['order']]);ck(all(it['x']==225 for it in bars))
 comp=[it for it in ps[3]['items']if it['tag']=='text' and it.get('size')==14 and it.get('x')!=275 and it['y']>80];ck([int(it['text'])for it in comp]==[x for r in g['multiplication']for x in r]);ck(sum(it['tag']=='rect'for it in ps[3]['items'])==g['order']**2)
 ck(tabs['automorphisms']['rows']==[[a['id'],a['label'],a['x'],a['y']]for a in b['automorphisms']]);ck(tabs['automorphism-matrices']['rows']==[[a['id'],i]+r for a in b['automorphisms']for i,r in enumerate(a['matrix']['data'])]);ck(tabs['group']['rows']==[[i]+r for i,r in enumerate(g['multiplication'])]);ck(tabs['subgroups']['rows']==[[h[k]for k in ['id','generators','elements','order','normal','normalizer','conjugates']]for h in g['subgroups']])
 ck([[r[0],r[1],r[2],r[4]]for r in tabs['fixed-fields']['rows']]==[[f['subgroupId'],f['dimension'],i,w]for f in b['fixedFields']for i,w in enumerate(f['basis'])]);ck(tabs['field-products']['rows']==[[f['subgroupId'],i,j,w]for f in b['fixedFields']for i,row in enumerate(f['multiplication'])for j,w in enumerate(row)]);ck(tabs['ambient-products']['rows']==[[i,j,w]for i,row in enumerate(b['structure'])for j,w in enumerate(row)])
 ck(tabs['inclusions']['rows']==[['H包含',a,z]for a,z in g['inclusions']]+[['固定域包含',a,z]for a,z in b['fieldInclusions']]+[['H覆盖',a,z]for a,z in g['covers']])
 for key in ['equations','rref','left']:ck(tabs[key]['rows']==[[i]+r for i,r in enumerate(f[key]['data'])])
 ck(tabs['operations']['rows']==[[i,o['kind'],o['i'],o.get('j'),o.get('multiple')]for i,o in enumerate(f['rowOperations'])]);ck(tabs['powers']['rows']==[[i]+r for i,r in enumerate(e['minimalPolynomial']['powers'])]);ck(tabs['multiply-element']['rows']==[[i]+r for i,r in enumerate(e['multiplication']['data'])]);ck([[r[0],r[2]]for r in tabs['images']['rows']]==[[i,r]for i,r in enumerate(e['images'])]);ck(tabs['membership']['rows']==[[m['subgroupId'],m['coordinates']]for m in e['membership']])
 q=s['selected']['quotient']
 if q['exists']:
  ck(tabs['quotient-products']['rows']==[[i]+r for i,r in enumerate(q['multiplication'])]);ck(tabs['restrictions']['rows']==[[j,i]+r for j,m in enumerate(q['restrictions'])for i,r in enumerate(m['data'])])
 else:ck(tabs['nonnormal']['rows']==[list(x)for x in q.items()])
 if b['irreducibility']:ck(tabs['irreducibility']['rows']==[list(x)for x in b['irreducibility'].items()])
for s,v in zip(data,bundle['views']):view_check(s,v)
print(json.dumps({'status':'PASS','live':bundle['live'],'frozen':len(data)-bundle['live'],'checks':checks,'invalid':bundle['invalid'],'self':bundle['self']}))

data=[{**d,**v}for d,v in zip(data,bundle["views"])]
f=json.loads(FIXTURE.read_text());ck(f['schema']==1 and f['provenance']['jsSha256']==hashlib.sha256(JS.read_bytes()).hexdigest(),'fixed full snapshot provenance')
ck(f['provenance']=={'date':'2026-09-11','node':'v24.14.0','platform':'darwin','arch':'arm64','jsSha256':hashlib.sha256(JS.read_bytes()).hexdigest()},'fixed environment')
ck(bundle['invalid']==50 and bundle['self']['status']=='PASS'and bundle['self']['checks']==67,'invalid and self checks')
if len(sys.argv)==1:
 from html.parser import HTMLParser
 src=(ROOT/'grad-math/lectures/alg2-02-galois.md').read_text();site=(ROOT/'grad-math/site/alg2-02-galois.html').read_text()
 formulas=[(a or b).strip()for a,b in re.findall(r'\$\$(.*?)\$\$|(?<!\\)\$(?!\$)(.*?)(?<!\\)\$(?!\$)',src,re.S)]
 actual=[html.unescape(a or b).strip()for a,b in re.findall(r'<(?:span|div) class="arithmatex">(?:\\\((.*?)\\\)|\\\[(.*?)\\\])</(?:span|div)>',site,re.S)]
 ck(formulas==actual,'every source formula preserved');ck(all('<'not in s for s in formulas),'HTML safe formulas');ck(len(re.findall(r'^## [0-9]+\.',src,re.M))==12,'twelve sections')
 ck(not re.search(r'<p>\s*<details|</details>\s*</p>',site),'balanced disclosure paragraphs')
 class Disclosure(HTMLParser):
  def __init__(self):super().__init__();self.stack=[];self.answers=0
  def handle_starttag(self,tag,attrs):
   if tag=='details':
    ck(not self.stack,'no nested answers');kind=dict(attrs).get('class');ck(kind in ['answer','page-toc'],'known disclosure');self.stack.append([kind,0]);self.answers+=kind=='answer'
   if tag=='summary':ck(bool(self.stack),'owned summary');self.stack[-1][1]+=1
  def handle_endtag(self,tag):
   if tag=='details':ck(bool(self.stack),'paired disclosure');ck(self.stack.pop()[1]==1,'one summary')
 parser=Disclosure();parser.feed(re.search(r'<article[^>]*>(.*?)</article>',site,re.S).group(1));ck(parser.answers==4 and not parser.stack,'four complete answers')
 for link in re.findall(r'(?:href|src)="([^"]+)"',site):
  target=link.split('#')[0].split('?')[0]
  if target and not re.match(r'^[a-zA-Z]+:',target)and not target.startswith('/'):ck((ROOT/'grad-math/site'/target).exists(),'local target '+target)
 for course in ['ai-course','grad-math','math-course']:ck((ROOT/course/'site/assets/learning/labs/galois-correspondence.js').read_bytes()==JS.read_bytes(),'JS mirror')
 ck((ROOT/'grad-math/site/assets/learning/projects/galois-correspondence/run-snapshot.json').read_bytes()==FIXTURE.read_bytes(),'snapshot mirror')
 ck((ROOT/'.github/workflows/course-audit.yml').read_text().count('python tools/check_galois_correspondence_full.py')==1,'CI invocation')
 image=ROOT/'grad-math/images/alg2-02-galois-ledgers.svg';ck(image.read_bytes()==(ROOT/'grad-math/site/assets/img/alg2-02-galois-ledgers.svg').read_bytes(),'static mirror')
 panels=ET.parse(image).getroot().findall('.//{http://www.w3.org/2000/svg}svg');ck(len(panels)==4,'four fixed panels');frozen=data[-4:]
 def compare_svg(a,b):
  ck(a.tag==b.tag and set(a.attrib)==set(b.attrib),'full static structure');ck(a.text==b.text and a.tail==b.tail,'static text exact')
  pattern=r'[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?'
  for key,v in a.attrib.items():
   w=b.attrib[key]
   if key in {'x','y','x1','x2','y1','y2','cx','cy','r','width','height'}:ck(abs(float(v)-float(w))<=1e-9,'static subnanopixel coordinate')
   elif key in {'points','d'}:
    ck(re.sub(pattern,'#',v)==re.sub(pattern,'#',w),'static geometry syntax');av=re.findall(pattern,v);bv=re.findall(pattern,w);ck(len(av)==len(bv),'static geometry length')
    for x,y in zip(av,bv):ck(abs(float(x)-float(y))<=1e-9,'static subnanopixel geometry')
   else:ck(v==w,'static attribute '+key)
  ck(len(a)==len(b),'static children')
  for x,y in zip(a,b):compare_svg(x,y)
 for panel,(run,index)in zip(panels,[(0,0),(1,1),(2,3),(3,2)]):
  panel.attrib.pop('x');panel.attrib.pop('y');compare_svg(panel,ET.fromstring(frozen[run]['svgs'][index]))
 original=ET.fromstring('<svg><text x="10">target</text><polyline points="1,2 3,4"/></svg>');tiny=ET.fromstring(ET.tostring(original));tiny[0].set('x','10.000000000000002');compare_svg(original,tiny)
 for mutation in ['coordinate','point','label','attribute','node']:
  changed=ET.fromstring(ET.tostring(original))
  if mutation=='coordinate':changed[0].set('x','10.000001')
  elif mutation=='point':changed[1].set('points','1,2')
  elif mutation=='label':changed[0].text='wrong'
  elif mutation=='attribute':changed[1].set('stroke','red')
  else:changed.remove(changed[1])
  rejected=False
  try:compare_svg(original,changed)
  except AssertionError:rejected=True
  ck(rejected,'negative control '+mutation)
 table=re.search(r'data-learning-lab="galois-correspondence".*?<tbody>(.*?)</tbody>',site,re.S).group(1)
 vals=[html.unescape(x).strip()for x in re.findall(r'<tr>\s*<td>.*?</td>\s*<td[^>]*>(.*?)</td>\s*</tr>',table,re.S)]
 a=f['biquadratic'];b=f['cubic'];c=f['finite'];d=f['nonnormal']
 refs=[a['base']['degree'],a['base']['group']['order'],a['selected']['order'],a['selected']['fixedDimension'],a['element']['minimalPolynomial']['degree'],a['element']['trace'],a['element']['norm'],b['base']['degree'],b['selected']['order'],b['selected']['fixedDimension'],'是'if b['selected']['normal']else'否',b['element']['trace'],b['element']['norm'],c['base']['prime']**c['base']['degree'],c['base']['group']['order'],c['selected']['order'],c['selected']['fixedDimension'],c['base']['prime']**c['selected']['fixedDimension'],d['base']['degree'],d['base']['group']['order'],d['element']['minimalPolynomial']['degree'],len(d['element']['orbit']),'是'if d['element']['orbitPolynomialOverBase']else'否']
 ck(len(vals)==len(refs)==23,'all 23 fallback values')
 for x,y in zip(vals,refs):ck(x==str(y),'full fixed reference')
 for word in ['固定域','极小多项式','非正规','run-snapshot.json','overflow-wrap:anywhere']:ck(word in site,'evidence boundary '+word)
 print('formulas',len(formulas))
print(json.dumps({'status':'PASS','liveStates':bundle['live'],'frozenStates':4,'checks':checks,'invalid':bundle['invalid'],'self':bundle['self']['checks']},ensure_ascii=False))
