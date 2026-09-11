from pathlib import Path
from fractions import Fraction as F
import json,math,subprocess,sys,random,re,shutil,hashlib,html
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/winding-lift.js'
FIXTURE=JS.with_name('winding-snapshot155.json')if len(sys.argv)>1 else ROOT/'course-shared/projects/winding-lift/run-snapshot.json'
checks=0
def ck(v,m='assertion'):
 global checks
 checks+=1
 if not v:raise AssertionError(m)
def q(o):
 v=F(int(o['numerator']),int(o['denominator']))
 ck(str(v.numerator)==o['numerator'] and str(v.denominator)==o['denominator'],'canonical fraction')
 ck(math.isclose(o['value'],float(v),rel_tol=2e-15,abs_tol=1e-300),'fraction float')
 return v
def close(a,b,m='float'):
 ck(math.isclose(a,b,rel_tol=4e-13,abs_tol=4e-13),m)
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def parse(s):return list(map(F,s.split(',')))
def val(a,t):
 if t==1:return a[-1]
 for i in range(len(a)-1):
  lo,hi=F(i,len(a)-1),F(i+1,len(a)-1)
  if lo<=t<=hi:return a[i]+(a[i+1]-a[i])*(t-lo)/(hi-lo)
 raise AssertionError('no interval')
def reduce(w):
 while True:
  next=re.sub('aA|Aa|bB|Bb','',w)
  if next==w:return w
  w=next
def inverse(w):return w.swapcase()[::-1]
def cyclic(w):
 while len(w)>1 and w[0]==w[-1].swapcase():w=w[1:-1]
 return w
def check_word(rec):
 w=rec['input'];r=reduce(w)
 ck(rec['reduced']==r);ck(rec['length']==len(r));ck(rec['abelianization']==[w.count('a')-w.count('A'),w.count('b')-w.count('B')])
 ck(len(rec['trace'])==len(w)+1)
 for j,z in enumerate(rec['trace']):
  ck(z['step']==j);ck(z['stack']==reduce(w[:j]));ck(z['length']==len(reduce(w[:j])));ck(z['a']==w[:j].count('a')-w[:j].count('A'));ck(z['b']==w[:j].count('b')-w[:j].count('B'))
  if j:ck(z['letter']==w[j-1]);ck(z['action']==('cancel'if len(reduce(w[:j]))<len(reduce(w[:j-1]))else'push'))
 used=[]
 for i,j in rec['pairs']:ck(i<j and w[i]==inverse(w[j]));used +=[i,j]
 ck(len(used)==len(set(used)));ck(''.join(c for i,c in enumerate(w)if i not in used)==r)
def verify(d):
 p,r=d['parameters'],d['result']
 if p['mode']=='lift':
  a,b=parse(p['liftA']),parse(p['liftB']);s=F(p['s']);op=p['operation']
  def f(t):
   if op=='homotopy':return (1-s)*val(a,t)+s*val(b,t)
   if op=='inverse':return val(a,1-t)-a[-1]
   return val(a,2*t)if t<=F(1,2)else a[-1]+val(b,2*t-1)
  ck(q(r['winding'])==f(F(1)));ck(q(r['start'])==0);ck(r['sameClass']==(a[-1]==b[-1]))
  for name,arr in [('a',a),('b',b)]:ck([q(z)for z in r[name]]==arr)
  ck(q(r['s'])==s);ck(q(r['t'])==F(p['t']));ck(q(r['endA'])==a[-1]);ck(q(r['endB'])==b[-1])
  ta=[F(i,len(a)-1)for i in range(len(a))];tb=[F(i,len(b)-1)for i in range(len(b))]
  expected=sorted(set(ta+tb))if op=='homotopy'else sorted(set([v/2 for v in ta]+[(1+v)/2 for v in tb]))if op=='concat'else sorted(1-v for v in ta)
  ck([q(z['t'])for z in r['knots']]==expected)
  ck([q(z['t'])for z in r['samples']]==sorted(set(expected+[F(p['t'])]+[F(i,240)for i in range(241)])))
  for z in r['knots']+r['samples']+[r['current']]:
   t=q(z['t']);v=q(z['value']);ck(v==f(t));ck(q(z['a'])==val(a,t));ck(q(z['b'])==val(b,t));close(z['projection'][0],math.cos(2*math.pi*float(v)));close(z['projection'][1],math.sin(2*math.pi*float(v)))
  ck(q(r['current']['t'])==F(p['t']))
 elif p['mode']=='polygon':
  raw=[parse(s)for s in p['polygon'].split(';')];off=[F(p['offsetX']),F(p['offsetY'])];v=[[a[i]+off[i]for i in range(2)]for a in raw];valid=True; winding=0; dist=[];angles=[];cum=0
  ck([[q(x)for x in a]for a in r['input']]==raw);ck([q(x)for x in r['offset']]==off);ck([[q(x)for x in a]for a in r['vertices']]==v);ck(len(r['segments'])==len(v)-1)
  for j,(a,b,z)in enumerate(zip(v,v[1:],r['segments'])):
   d=[y-x for x,y in zip(a,b)];dd=dot(d,d);cross=a[0]*b[1]-a[1]*b[0]
   # independent distance: choose endpoint if outside foot, otherwise area^2/base^2
   if dd==0 or dot(a,d)>=0:nearest=a;u=F(0);dist2=dot(a,a)
   elif dot(b,d)<=0:nearest=b;u=F(1);dist2=dot(b,b)
   else:u=-dot(a,d)/dd;nearest=[x+u*y for x,y in zip(a,d)];dist2=cross**2/dd
   collision=dist2==0;valid &= not collision;dist.append(dist2)
   # independent cut: cross NEGATIVE y axis, rightward = positive turn
   if a[0]<=0<b[0] and cross>0:winding+=1
   elif b[0]<=0<a[0] and cross<0:winding-=1
   for field,value in [('cross',cross),('dot',dot(a,b)),('length2',dd),('nearestParameter',u),('distance2',dist2)]:ck(q(z[field])==value,field)
   ck(z['index']==j);ck([q(x)for x in z['a']]==a);ck([q(x)for x in z['b']]==b);ck([q(x)for x in z['nearest']]==nearest);ck(z['collision']==collision)
   up=a[1]<=0<b[1];down=b[1]<=0<a[1];ck(z['up']==up);ck(z['down']==down)
   ray=None if not(up or down)else a[0]-a[1]*(b[0]-a[0])/(b[1]-a[1])
   ck((None if z['rayX']is None else q(z['rayX']))==ray)
   c=(1 if up else -1)if ray is not None and ray>0 else 0
   ck(z['contribution']==(None if collision else c));cum+=c
   if collision:ck(z['angleDelta']is None)
   else:
    delta=math.atan2(float(cross),float(dot(a,b)));angles.append(delta);close(z['angleDelta'],delta)
   if valid:close(z['cumulativeAngle'],sum(angles));ck(z['cumulativeCrossings']==cum)
   else:ck(z['cumulativeAngle']is None);ck(z['cumulativeCrossings']is None)
  ck(r['valid']==valid);ck(q(r['minimumDistance2'])==min(dist));ck(r['collisionSegments']==[i for i,x in enumerate(dist)if x==0]);ck(r['winding']==(winding if valid else None))
  for k in ['angleSum','angleWinding','angleDifference']:
   if not valid:ck(r[k]is None)
  if valid:close(r['angleSum'],sum(angles));close(r['angleWinding'],winding);close(r['angleDifference'],r['angleWinding']-winding)
  t=F(p['t']);ck(q(r['t'])==t);h=t*(len(v)-1);j=min(int(h),len(v)-2);u=h-j
  ck([q(x)for x in r['current']]==[v[j][i]+u*(v[j+1][i]-v[j][i])for i in range(2)])
  ck(len(r['samples'])==16*(len(v)-1)+1)
  for k,z in enumerate(r['samples']):
   j=min(k//16,len(v)-2);u=F(k-j*16,16);a=[v[j][i]+u*(v[j+1][i]-v[j][i])for i in range(2)];ck(q(z['t'])==F(k,16*(len(v)-1)));ck([q(x)for x in z['position']]==a)
   if dot(a,a)==0:ck(z['projection']is None)
   else:
    for x,y in zip(z['projection'],a):close(x,float(y)/math.sqrt(float(dot(a,a))))
 else:
  for field in ['a','b','h','result']:check_word(r[field])
  ck(r['a']['input']==p['word']);ck(r['b']['input']==p['wordB']);ck(r['h']['input']==p['conjugator'])
  raw=inverse(p['word'])if p['operation']=='inverse'else p['conjugator']+p['word']+inverse(p['conjugator'])if p['operation']=='conjugate'else p['word']+p['wordB']if p['operation']=='concat'else p['word'];ck(r['result']['input']==raw)
  a,b=reduce(p['word']),reduce(p['wordB']);ca,cb=cyclic(a),cyclic(b)
  for field,w in [('cyclicA',a),('cyclicB',b)]:
   z=r[field];c=cyclic(w);ck(z['core']==c);ck(z['reduced']==w);ck(z['prefix']+c+inverse(z['prefix'])==w)
   rotations=set(c[i:]+c[:i]for i in range(len(c)))if c else {''};ck(set(z['rotations'])==rotations);ck(z['canonical']==min(rotations));ck(z['removed']==[[x,inverse(x)]for x in z['prefix']])
  ck(r['equal']==(a==b));ck(r['sameAbelianization']==(r['a']['abelianization']==r['b']['abelianization']));ck(r['conjugate']==(len(ca)==len(cb)and cb in ca+ca))
def main():
 global JS
 if len(sys.argv)>1 and sys.argv[1].endswith('.json'):data=json.loads(Path(sys.argv[1]).read_text())
 else:
  if len(sys.argv)>1:JS=Path(sys.argv[1]).resolve()
  script='const a=require(process.argv[1]);let c=a.PRESETS.map(p=>p.values);const more=JSON.parse(process.argv[2]);console.log(JSON.stringify(c.concat(more).map(p=>a.snapshot(p))))'
  rng=random.Random(155);more=[]
  for k in range(18):
   n=rng.randint(-8,8);m=rng.randint(-8,8);op=['homotopy','concat','inverse'][k%3]
   more.append({'liftA':','.join(map(str,[0]+[rng.randint(-12,12)for _ in range(rng.randint(0,10))]+[n])),'liftB':','.join(map(str,[0]+[rng.randint(-12,12)for _ in range(rng.randint(0,10))]+[n if op=='homotopy'else m])),'operation':op,'s':str(k/20),'t':str((18-k)/20)})
  for k in range(18):
   vertices=[[rng.randint(-10,10),rng.randint(-10,10)]for _ in range(2+k%7)];vertices.append(vertices[0]);more.append({'mode':'polygon','polygon':';'.join(','.join(map(str,a))for a in vertices),'t':str(k/20),'offsetX':'.000001'if k%2 else '0'})
  for k in range(24):more.append({'mode':'word','operation':['homotopy','concat','inverse','conjugate'][k%4],'word':''.join(rng.choice('aAbB')for _ in range(k*2)),'wordB':''.join(rng.choice('aAbB')for _ in range(k)),'conjugator':''.join(rng.choice('aAbB')for _ in range(k//2))})
  data=json.loads(subprocess.check_output(PREFIX+['node','-e',script,str(JS),json.dumps(more)]))
 for d in data:verify(d)
 print(json.dumps({'status':'PASS','states':len(data),'checks':checks}))
 return data
def view_contract(d,plots,ledgers,svgs):
 import xml.etree.ElementTree as ET
 r=d['result'];mode=r['mode'];ck(len(plots)==len(svgs)==4)
 if mode=='lift':
  a=r['samples'];c=r['current']
  expected=[{'a':[[z['t']['value'],z['a']['value']]for z in a],'b':[[z['t']['value'],z['b']['value']]for z in a],'result':[[z['t']['value'],z['value']['value']]for z in a],'current':[[c['t']['value'],c['value']['value']]]},{'projection':[z['projection']for z in a],'current':[c['projection']],'origin':[[0,0]]},{'endpoints':[[0,r['endA']['value']],[1,r['endB']['value']],[2,r['winding']['value']]]},{'real':[[z['t']['value'],z['projection'][0]]for z in a],'imag':[[z['t']['value'],z['projection'][1]]for z in a]}]
  exclude=['knots','samples'];records={'knots':r['knots'],'samples':r['samples']}
 elif mode=='polygon':
  a=r['segments'];expected=[{'polygon':[[z['value']for z in v]for v in r['vertices']],'nearest':[[z['value']for z in v['nearest']]for v in a],'current':[[z['value']for z in r['current']]],'origin':[[0,0]]},{'angle':[[0,0]]+[[z['index']+1,z['cumulativeAngle']/(2*math.pi)]for z in a if z['cumulativeAngle']is not None]},{'distance':[[z['index'],z['distance2']['value']]for z in a]},{'crossings':[[z['index'],z['contribution']]for z in a if z['contribution']is not None]}]
  exclude=['segments','samples'];records={'segments':r['segments'],'samples':r['samples']}
 else:
  a=r['a']['trace'];b=r['result']['trace'];expected=[{'stack':[[z['step'],z['length']]for z in a]},{'a':[[z['step'],z['a']]for z in a],'b':[[z['step'],z['b']]for z in a]},{'result':[[z['step'],z['length']]for z in b]},{'path':[[z['a'],z['b']]for z in a],'end':[r['a']['abelianization']]}]
  exclude=['a','b','h','result','cyclicA','cyclicB'];records={k+'-trace':r[k]['trace']for k in ['a','b','h','result']}
 for p,e,s in zip(plots,expected,svgs):
  ck({z['key']:z['points']for z in p['series']}==e,'plot points bound to ledger')
  root=ET.fromstring(s);ck(root.attrib['width']=='900'and root.attrib['height']=='425');ck(root.attrib['role']=='img');ck(root.find('{*}title').text==p['title'])
  ck(len(root.findall('{*}circle'))==sum(len(z['points'])for z in p['series']))
  xmin,xmax,ymin,ymax=[p[k]for k in ['xmin','xmax','ymin','ymax']];ck(xmax>xmin and ymax>ymin)
  square=p['square'];left=325 if square else 100;width=250 if square else 750
  if square:close(xmax-xmin,ymax-ymin,'square aspect')
  for z in p['series']:
   points=z['points'];circles=[c for c in root.findall('{*}circle')if c.attrib['data-series']==z['key']];ck(len(circles)==len(points))
   for j,(c,(x,y))in enumerate(zip(circles,points)):
    ck(xmin<=x<=xmax and ymin<=y<=ymax,'inside chart');ck(c.attrib['data-index']==str(j));close(float(c.attrib['cx']),left+width*(x-xmin)/(xmax-xmin));close(float(c.attrib['cy']),335-250*(y-ymin)/(ymax-ymin));ck(c.attrib['fill']==z['color']);ck(c.attrib['stroke']==z['color'])
   lines=[c for c in root.findall('{*}polyline')if c.attrib['data-series']==z['key']];ck(len(lines)==int(z['line']))
   if lines:
    coords=[list(map(float,v.split(',')))for v in lines[0].attrib['points'].split()];ck(len(coords)==len(points));ck(lines[0].attrib['stroke']==z['color']);ck(lines[0].attrib['fill']=='none')
    for (x,y),(cx,cy)in zip(points,coords):close(cx,left+width*(x-xmin)/(xmax-xmin));close(cy,335-250*(y-ymin)/(ymax-ymin))
  for i,m in enumerate(p['markers']):
   line=[c for c in root.findall('{*}line')if c.attrib.get('data-marker')==str(i)];ck(len(line)==1);close(float(line[0].attrib['x1']),left+width*(m['x']-xmin)/(xmax-xmin));close(float(line[0].attrib['x2']),float(line[0].attrib['x1']))
  if p.get('xTicks') is not None and not square:ck(all(x==int(x)for x in p['xTicks']),'integer ticks')
  if square:ck(len(p['xTicks'])==3,'three spaced square ticks')
  arrows=root.findall('{*}polygon')
  expected_arrows=[]
  for z in p['series']:
   if not z.get('arrows'):continue
   for j,(a,b)in enumerate(zip(z['points'],z['points'][1:])):
    ax=left+width*(a[0]-xmin)/(xmax-xmin);ay=335-250*(a[1]-ymin)/(ymax-ymin)
    bx=left+width*(b[0]-xmin)/(xmax-xmin);by=335-250*(b[1]-ymin)/(ymax-ymin);dx=bx-ax;dy=by-ay;length=math.hypot(dx,dy)
    if not length:continue
    ux,uy=dx/length,dy/length;px,py=ax+.6*dx,ay+.6*dy;size=min(7,length*.2)
    expected_arrows.append((z['key'],j,z['color'],[[px+size*ux,py+size*uy],[px-size*ux+size*.55*uy,py-size*uy-size*.55*ux],[px-size*ux-size*.55*uy,py-size*uy+size*.55*ux]]))
  ck(len(arrows)==len(expected_arrows))
  for z,(key,j,color,points)in zip(arrows,expected_arrows):
   ck(z.attrib['data-arrow']==key and z.attrib['data-index']==str(j) and z.attrib['fill']==color)
   coords=[list(map(float,v.split(',')))for v in z.attrib['points'].split()];ck(len(coords)==3)
   for a,b in zip(coords,points):close(a[0],b[0]);close(a[1],b[1])
 table={z['key']:z for z in ledgers};ck(len(table)==len(ledgers));ck([row[1]for row in table['summary']['rows']]==[v for k,v in r.items()if k not in exclude],'all summary values')
 for key,rows in records.items():ck(table[key]['rows']==[list(z.values())for z in rows],'complete records '+key)
 if mode=='word':
  for k in ['a','b','h','result']:ck([row[1]for row in table[k]['rows']]==[v for key,v in r[k].items()if key!='trace'])
  for k in ['cyclicA','cyclicB']:ck([row[1]for row in table[k]['rows']]==list(r[k].values()))

data=main()
live=len(data)
f=json.loads(FIXTURE.read_text());frozen=[f[k]for k in ["lift","tiny","touch","word"]]
for d in frozen:verify(d)
data+=frozen
code=r"""const a=require(process.argv[1]),fs=require('fs');const data=JSON.parse(fs.readFileSync(0,'utf8')),f=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));const same=f.provenance.node===process.version&&f.provenance.platform===process.platform&&f.provenance.arch===process.arch;if(same)for(const d of data.slice(-4))if(JSON.stringify(a.snapshot(d.parameters))!==JSON.stringify(d))throw Error('Same runtime frozen replay changed');let invalid=0;
const bad=v=>{let threw=false;try{a.snapshot(v)}catch(e){threw=true}if(!threw)throw Error('Accepted invalid '+JSON.stringify(v));invalid++};
for(const k of ['s','t','liftA','liftB'])for(const v of [null,true,[],{},'', 'NaN','Infinity','1e-6','0.0000001'])bad({[k]:v});
for(const k of ['offsetX','offsetY','t','polygon'])for(const v of [null,true,[],{},'', 'NaN','Infinity','1e-6','0.0000001'])bad({mode:'polygon',[k]:v});
for(const k of ['word','wordB','conjugator'])for(const v of [null,true,[],{},'a A','c','a'.repeat(65)])bad({mode:'word',[k]:v});
[null,[],false,{mode:'bad'},{operation:'bad'},{liftA:'0,1.5'},{liftA:'1,1'},{liftA:'0,9'},{liftA:'0,-9'},{liftA:'0,12.000001,1'},{liftA:'0,-12.000001,1'},{liftA:'0'},{liftA:'0,'.repeat(13)+'1'},{liftB:'0,2'},{s:'-0.000001'},{s:'1.000001'},{t:'-0.000001'},{t:'1.000001'},{mode:'polygon',polygon:'1,0;0,1'},{mode:'polygon',polygon:'1,0,0;1,0,0'},{mode:'polygon',polygon:'1,0'},{mode:'polygon',polygon:'1,0;'.repeat(33)+'1,0'},{mode:'polygon',polygon:'10.000001,0;10.000001,0'},{mode:'polygon',offsetX:'10.000001'},{mode:'polygon',offsetY:'-10.000001'},{mode:'polygon',t:'-1'},{mode:'word',operation:'bad'}].forEach(bad);
console.log(JSON.stringify({invalid,self:a.selfTest(),data:data.map(d=>{const plots=a.plots(d);return {plots,ledgers:a.ledgers(d),svgs:plots.map(a.svg)}})}));"""
bundle=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve()),str(FIXTURE.resolve())],input=json.dumps(data).encode()))
for d,v in zip(data,bundle['data']):view_contract(d,v['plots'],v['ledgers'],v['svgs'])
ck(bundle['invalid']==120,'invalid count');ck(bundle['self']=={'status':'PASS','checks':12})
print(json.dumps({'status':'PASS','states':len(data),'checks':checks,'invalid':bundle['invalid'],'self':bundle['self']['checks']}))

data=[{**d,**v}for d,v in zip(data,bundle["data"])]
f=json.loads(FIXTURE.read_text());ck(f['schema']==1 and f['provenance']['jsSha256']==hashlib.sha256(JS.read_bytes()).hexdigest(),'fixed full snapshot provenance')
ck(f['provenance']=={'date':'2026-09-11','node':'v24.14.0','platform':'darwin','arch':'arm64','jsSha256':hashlib.sha256(JS.read_bytes()).hexdigest()},'fixed environment')
ck(bundle['invalid']==120 and bundle['self']['status']=='PASS'and bundle['self']['checks']==12,'invalid and self checks')
if len(sys.argv)==1:
 from html.parser import HTMLParser
 src=(ROOT/'grad-math/lectures/at-01-fundamental-group.md').read_text();site=(ROOT/'grad-math/site/at-01-fundamental-group.html').read_text()
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
 for course in ['ai-course','grad-math','math-course']:ck((ROOT/course/'site/assets/learning/labs/winding-lift.js').read_bytes()==JS.read_bytes(),'JS mirror')
 ck((ROOT/'grad-math/site/assets/learning/projects/winding-lift/run-snapshot.json').read_bytes()==FIXTURE.read_bytes(),'snapshot mirror')
 ck((ROOT/'.github/workflows/course-audit.yml').read_text().count('python tools/check_winding_lift_full.py')==1,'CI invocation')
 image=ROOT/'grad-math/images/at-01-winding-ledgers.svg';ck(image.read_bytes()==(ROOT/'grad-math/site/assets/img/at-01-winding-ledgers.svg').read_bytes(),'static mirror')
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
 for panel,(run,index)in zip(panels,[(0,0),(1,0),(2,0),(3,0)]):
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
 table=re.search(r'data-learning-lab="winding-lift".*?<tbody>(.*?)</tbody>',site,re.S).group(1)
 vals=[html.unescape(x).strip()for x in re.findall(r'<tr>\s*<td>.*?</td>\s*<td[^>]*>(.*?)</td>\s*</tr>',table,re.S)]
 a=f['lift']['result'];b=f['tiny']['result'];c=f['touch']['result'];d=f['word']['result']
 refs=[a['start']['value'],a['endA']['value'],a['endB']['value'],a['winding']['value'],a['current']['value']['value'],len(a['knots']),b['winding'],b['minimumDistance2']['value'],len(b['segments']),b['angleWinding'],'是'if c['valid']else'否','未定义'if c['winding']is None else c['winding'],','.join(map(str,c['collisionSegments'])),c['minimumDistance2']['value'],d['a']['reduced'],d['a']['length'],d['a']['abelianization'][0],d['a']['abelianization'][1]]
 ck(len(vals)==len(refs)==18,'all 18 fallback values')
 for x,y in zip(vals,refs):ck(x==(format(y,'.12g')if isinstance(y,(int,float))else str(y)),'fixed full fallback')
 for word in ['绕数未定义','精确分数','循环旋转','run-snapshot.json','overflow-wrap:anywhere']:ck(word in site,'evidence boundary '+word)
 print('formulas',len(formulas))
print(json.dumps({'status':'PASS','liveStates':live,'frozenStates':4,'checks':checks,'invalid':bundle['invalid'],'self':bundle['self']['checks']},ensure_ascii=False))
