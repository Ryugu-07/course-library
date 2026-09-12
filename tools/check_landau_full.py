"""Independent rational Sturm counts and Gauss-Legendre finite-volume oracle."""
import math
from fractions import Fraction as F
from functools import lru_cache
checks=0
def eq(a,b):
 global checks
 checks+=1;assert a==b,(a,b)
def near(a,b,tol=3e-9):
 global checks
 if isinstance(a,list):
  eq(len(a),len(b))
  for x,y in zip(a,b):near(x,y,tol)
 else:
  checks+=1;assert math.isfinite(a)and math.isfinite(b)and abs(a-b)<=tol*max(1,abs(a),abs(b)),(a,b)
def trim(p):
 while len(p)>1 and p[-1]==0:p.pop()
 return p
def remainder(a,b):
 a=a[:]
 while len(a)>=len(b)and any(a):
  q=a[-1]/b[-1];shift=len(a)-len(b)
  for j,x in enumerate(b):a[j+shift]-=q*x
  trim(a)
 return a
@lru_cache(maxsize=4096)
def root_count(t,u,v,h):
 p=[-F(str(h)),F(str(t)),F(0),F(str(u)),F(0),F(str(v))]
 seq=[p,[i*p[i]for i in range(1,len(p))]]
 while any(seq[-1]):
  rem=[-x for x in remainder(seq[-2],seq[-1])]
  if not any(rem):break
  seq.append(rem)
 def variations(side):
  signs=[(1 if p[-1]>0 else -1)*(side**(len(p)-1))for p in seq]
  return sum(a!=b for a,b in zip(signs,signs[1:]))
 return variations(-1)-variations(1)
@lru_cache(maxsize=2)
def legendre(n=64):
 out=[]
 for j in range(1,n+1):
  z=math.cos(math.pi*(j-.25)/(n+.5))
  for k in range(30):
   p0,p1=1.,z
   for i in range(2,n+1):p0,p1=p1,((2*i-1)*z*p1-(i-1)*p0)/i
   derivative=n*(z*p1-p0)/(z*z-1);new=z-p1/derivative
   if abs(new-z)<2e-16:z=new;break
   z=new
  p0,p1=1.,z
  for i in range(2,n+1):p0,p1=p1,((2*i-1)*z*p1-(i-1)*p0)/i
  derivative=n*(z*p1-p0)/(z*z-1);out.append((z,2/((1-z*z)*derivative**2)))
 return out
@lru_cache(maxsize=2048)
def moments(t,u,v,h,V):
 # Fixed subintervals independent of product roots/adaptive leaves.
 f=lambda x:t*x*x/2+u*x**4/4+v*x**6/6-h*x
 shift=min(f(-4+i/64)for i in range(513))
 sums=[[]for k in range(6)]
 for i in range(64):
  a=-4+i/8;b=a+1/8
  for z,w in legendre():
   x=(a+b)/2+(b-a)*z/2;weight=(b-a)*w/2*math.exp(-V*(f(x)-shift))
   for k in range(6):sums[k].append(weight*(abs(x)if k==5 else x**k))
 ints=[math.fsum(s)for s in sums];mom=[x/ints[0]for x in ints]
 return mom,-V*shift+math.log(ints[0])
def check_snapshot(s):
 global checks
 c=s['parameters'];t,u,v,h,V=[c[k]for k in['t','u','v','h','volume']];st=s['stationary'];fv=s['finite'];g=s['gaussian']
 f=lambda x:t*x*x/2+u*x**4/4+v*x**6/6-h*x
 slope=lambda x:t*x+u*x**3+v*x**5-h
 eq(len(st['roots']),root_count(t,u,v,h))
 xs=[r['m']for r in st['roots']];eq(xs,sorted(xs));assert all(b-a>2e-8 for a,b in zip(xs,xs[1:]));checks+=1
 near(st['bound'],1+max(abs(t),abs(u),abs(h))/v)
 fmin=min(f(x)for x in xs);near(st['fmin'],fmin)
 for index,r in enumerate(st['roots']):
  eq(type(r['id']),int);eq(r['id'],index)
  x=r['m'];near(r['f'],f(x));near(r['residual'],slope(x));near(slope(x),0,2e-11)
  ds=[t+3*u*x*x+5*v*x**4,6*u*x+20*v*x**3,6*u+60*v*x*x,120*v*x,120*v];near(r['derivatives'],ds)
  at=next(i for i,z in enumerate(ds)if abs(z)>2e-9);order=at+2;kind='stationary-inflection'if order%2 else('minimum'if order==2 else'flat-minimum')if ds[at]>0 else('maximum'if order==2 else'flat-maximum')
  eq(r['kind'],kind);eq(r['leadingOrder'],order);eq(r['localMinimum'],kind in['minimum','flat-minimum']);near(r['deltaF'],f(x)-fmin);eq(r['globalCandidate'],r['localMinimum']and abs(f(x)-fmin)<=1e-10);eq(r['metastable'],r['localMinimum']and not r['globalCandidate'])
  if r['localMinimum']and ds[0]>2e-9:near(r['susceptibility'],1/ds[0])
  else:eq(r['susceptibility'],None)
 def finite(c,row):
  m,logZ=moments(*[c[k]for k in['t','u','v','h','volume']]);near(row['moments'],m);near(row['mean'],m[1]);near(row['absoluteMean'],m[5]);var=m[2]-m[1]**2
  near(row['variance'],var);near(row['susceptibility'],c['volume']*var);near(row['binder'],1-m[4]/(3*m[2]**2));near(row['logZ'],logZ);near(row['freeEnergyPerVolume'],-logZ/c['volume']);eq(row['converged'],True)
 finite(c,fv)
 for row in s['scans']['volumes']+s['scans']['fields']:finite({**c,'volume':row['volume'],'h':row['h']},row)
 for i,r in enumerate(fv['rows']):
  a,b=r['a'],r['b'];assert a<b;checks+=1
  if i:near(a,fv['rows'][i-1]['b'])
  vals=[]
  for x in[a,(3*a+b)/4,(a+b)/2,(a+3*b)/4,b]:
   w=math.exp(-V*(f(x)-fmin));vals.append([w*x**k for k in range(5)]+[abs(x)*w])
  near([r[k]for k in['fa','fl','fm','fr','fb']],vals)
  coarse=[(b-a)*(vals[0][k]+4*vals[2][k]+vals[4][k])/6 for k in range(6)]
  fine=[(b-a)*(vals[0][k]+4*vals[1][k]+2*vals[2][k]+4*vals[3][k]+vals[4][k])/12 for k in range(6)]
  correction=[(x-y)/15 for x,y in zip(fine,coarse)]
  near(r['coarse'],coarse);near(r['fine'],fine);near(r['correction'],correction);near(r['value'],[x+y for x,y in zip(fine,correction)]);near(r['error'],max(map(abs,correction)));eq(r['converged'],r['error']<=r['tolerance']);near(r['tolerance'],2e-13*(b-a)/8)
 near(fv['integrals'],[math.fsum(r['value'][k]for r in fv['rows'])for k in range(6)]);near(fv['cuts'][0],-4);near(fv['cuts'][-1],4)
 for r in fv['tailBounds']:
  side,k=r['side'],r['moment'];x=side*4;out=side*slope(x);decay=V*out-k/4;near(r['slopeOutward'],out);near(r['decay'],decay);near(r['curvature'],t+3*u*x*x+5*v*x**4);near(r['logBound'],k*math.log(4)-V*(f(x)-fmin)-math.log(decay));near(r['numericBound'],math.exp(r['logBound']));eq(r['underflow'],r['numericBound']==0)
 for r in fv['density']:
  w=math.exp(-V*(f(r['m'])-fmin));near(r['f'],f(r['m']));near(r['weight'],w);near(r['density'],w/fv['integrals'][0])
 for row in s['scans']['temperature']:
  eq(len(row['roots']),root_count(row['t'],u,v,h));vals=[]
  for r in row['roots']:
   x=r['m'];near(row['t']*x+u*x**3+v*x**5-h,0,2e-11);ff=row['t']*x*x/2+u*x**4/4+v*x**6/6-h*x;vals.append(ff);near(r['f'],ff);near(r['curvature'],row['t']+3*u*x*x+5*v*x**4)
  near(row['fmin'],min(vals))
 def gaussian(c,g):
  m=g['m'];r=c['t']+3*c['u']*m*m+5*c['v']*m**4;k=c['stiffness'];near(g['curvature'],r)
  if r<=2e-9:
   eq(g['xi'],None)
   for row in g['fluctuation']:eq(row['variance'],None);eq(row['ratio'],None)
   return
  xi=math.sqrt(k/r);qmax=min(c['cutoff'],1/xi);near(g['xi'],xi)
  for row in g['fluctuation']:
   d=row['d'];A=2*math.pi**(d/2)/math.gamma(d/2)/(2*math.pi)**d;value=A*math.fsum(qmax*w/2*(qmax*(z+1)/2)**(d-1)/(r+k*(qmax*(z+1)/2)**2)for z,w in legendre())
   near(row['prefactor'],A);near(row['variance'],value);near(row['z'],qmax*xi)
   near(row['radial'],math.fsum(qmax*xi*w/2*(qmax*xi*(z+1)/2)**(d-1)/(1+(qmax*xi*(z+1)/2)**2)for z,w in legendre()))
   if c['h']==0 and abs(m)>1e-8:near(row['ratio'],value/m**2)
   else:eq(row['ratio'],None)
   near(row['quarticExponent'],d/2-2);near(row['tricriticalExponent'],(d-3)/2)
  for row in g['spectrum']:near(row['inverse'],r+k*row['q']**2);near(row['response'],1/(r+k*row['q']**2))
 gaussian(c,g)
 for row in s['scans']['ginzburg']:
  cc={**c,'t':row['t'],'u':0 if row['family']=='tricritical'else 1,'h':0}
  gaussian(cc,{'m':row['m'],'curvature':row['curvature'],'xi':row['xi'],'fluctuation':row['dimensions'],'spectrum':[]})
def check_records(records):
 global checks
 checks=0
 for s in records:check_snapshot(s)
 return checks

if __name__=='__main__':
 import subprocess,shutil,tempfile,hashlib,re,copy,json,sys,xml.etree.ElementTree as ET
 from pathlib import Path
 root=Path(__file__).resolve().parents[1];staging=len(sys.argv)>1
 js=Path(sys.argv[1])if staging else root/'course-shared/labs/landau-free-energy.js'
 fixture=Path(sys.argv[2])if staging else root/'course-shared/projects/landau-certificates/run-snapshot.json'
 prefix=['rtk','proxy']if shutil.which('rtk')else[]
 code=r'''const a=require(process.argv[1]),f=require(process.argv[2]);let invalid=[];for(const k of Object.keys(a.DEFAULT))for(const v of[null,false,'1',[],{},Infinity,NaN])invalid.push({[k]:v});invalid.push(null,[],{constructor:1},{toString:1},{unknown:1},{t:-1.1},{t:1.1},{u:-1.1},{u:1.1},{v:.4},{v:2.1},{h:-.6},{h:.6},{volume:0},{volume:129},{stiffness:.1},{stiffness:2.1},{dimension:0},{dimension:1.5},{dimension:6},{cutoff:.4},{cutoff:4.1});let rejected=0;for(const c of invalid){try{a.config(c)}catch(e){rejected++}}const configs=a.PRESETS.map(p=>p.config);for(const t of[-1,0,1])for(const h of[-.5,.5])configs.push({t,h,u:-1,v:.5,volume:128});for(const dimension of[1,2,3,4,5])configs.push({dimension,stiffness:.2,cutoff:4});configs.push({t:1,u:1,v:2,h:-.5,volume:1},{t:.1,u:-.7,v:1.3,h:.02,volume:4});const records=configs.map(a.compute),views=a.PRESETS.map((p,i)=>({key:p.key,plots:a.plots(records[i]),svgs:a.plots(records[i]).map(a.svg),tables:a.tables(records[i])}));console.log(JSON.stringify({records,views,frozen:f.records.map(r=>a.compute(r.data.parameters)),invalid:invalid.length,rejected,feedback:a.QUESTIONS.map((q,i)=>[a.feedback(i,0),a.feedback(i,1)]),self:a.selfTest()}));'''
 d=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True));f=json.loads(fixture.read_text())
 assert fixture.stat().st_size<25*1024*1024
 eq(f['provenance']['sourceSha256'],hashlib.sha256(js.read_bytes()).hexdigest());eq(len(f['records']),6);eq(len({r['key']for r in f['records']}),6);eq(d['invalid'],d['rejected']);assert d['invalid']>=75
 def replay(a,b,path='$'):
  if isinstance(a,dict):
   assert isinstance(b,dict)and a.keys()==b.keys(),path
   for k in a:replay(a[k],b[k],path+'.'+k)
  elif isinstance(a,list):
   assert isinstance(b,list)and len(a)==len(b),path
   for i,(x,y)in enumerate(zip(a,b)):replay(x,y,path+'['+str(i)+']')
  elif type(a)in(int,float)and type(b)in(int,float):
   key=path.rsplit('.',1)[-1]
   if key in {'id','index','leadingOrder','selectedRoot','dimension','d','side','moment','depth','interval','step','steps','schemaVersion'}:
    assert type(a)is int and type(b)is int and a==b,(path,a,b)
   elif '.parameters.'in path:assert type(a)is type(b)and a==b,(path,a,b)
   else:assert math.isfinite(a)and math.isfinite(b)and math.isclose(a,b,rel_tol=2e-12,abs_tol=2e-14),(path,a,b)
  else:assert type(a)is type(b)and a==b,(path,a,b)
 def physical_view(record):
  record=copy.deepcopy(record)
  # Adaptive meshes/work counts can change after a last-bit libm difference.
  # Every stored and recomputed mesh is independently audited by check_records.
  del record['finite']['rows']
  for group in ['volumes','fields']:
   for row in record['scans'][group]:del row['leafCount']
  return record
 replay([physical_view(r)for r in d['frozen']],[physical_view(r['data'])for r in f['records']])
 replay({'x':1.0},{'x':math.nextafter(1.0,2.0)})
 replayCases=[(1,1.0),(1,1.0000000000001),(1.0,1),(1.0000000000001,1),(1.0,1.00001),(True,1),(None,0),([1],[]),({'x':1},{'y':1}),(2,3)]
 replayGuards=0
 for a,b in replayCases:
  try:replay({'id':a},{'id':b})if type(a)in(int,float)and type(b)in(int,float)and (type(a)is int or type(b)is int)else replay(a,b)
  except AssertionError:replayGuards+=1
 assert replayGuards==len(replayCases)

 total=check_records(d['records']+d['frozen']+[r['data']for r in f['records']]);coords=0;markers=0;rows=0
 def same(a,b):assert a==b,(a,b)
 def close(a,b):assert abs(a-b)<=2e-5*max(1,abs(a),abs(b)),(a,b)
 for i,view in enumerate(d['views']):
  s=d['records'][i];c=s['parameters'];st=s['stationary'];fv=s['finite'];g=s['gaussian'];sc=s['scans'];ts={t['key']:t['rows']for t in view['tables']}
  same([p['key']for p in view['plots']],['energy','density','branches','volume','spectrum','ginzburg']);same(list(ts),['parameters','roots','isolation','temperature','integral','moments','fields','spectrum','fluctuation','ginzburg'])
  same(ts['parameters'][:8],[[k,v,'当前模型参数']for k,v in c.items()])
  same(ts['roots'],[[r['id'],r['m'],r['f'],r['residual'],r['derivatives'],r['leadingOrder'],r['kind'],r['deltaF'],r['globalCandidate'],r['metastable'],r['susceptibility']]for r in st['roots']])
  fp=lambda x:c['t']*x+c['u']*x**3+c['v']*x**5-c['h']
  same(ts['isolation'],[['单调区间',j,a,st['monotoneCuts'][j+1],fp(a),fp(st['monotoneCuts'][j+1]),None,None]for j,a in enumerate(st['monotoneCuts'][:-1])]+[['二分步 '+str(r['interval']),r['step'],r['a'],r['b'],r['fa'],r['fb'],r['m'],r['fm']]for r in st['trace']]+([['零场解析法',0,None,None,None,None,'m=0及 y=(−u±√(u²−4vt))/(2v)>0','m=±√y']]if c['h']==0 else[]))
  same(ts['temperature'],[[r['t'],q['m'],q['f'],r['fmin'],q['kind'],q['globalCandidate'],q['metastable'],q['curvature']]for r in sc['temperature']for q in r['roots']])
  same(ts['integral'],[['叶区间',r['a'],r['b'],[r[k]for k in['fa','fl','fm','fr','fb']],r['coarse'],r['fine'],r['correction'],r['value'],r['error'],r['tolerance'],r['converged']]for r in fv['rows']]+[['尾界',r['side'],r['moment'],[r[k]for k in['endpoint','slopeOutward','curvature','decay']],None,None,None,r['logBound'],r['numericBound'],r['underflow'],True]for r in fv['tailBounds']])
  same(ts['moments'],[[r[k]for k in['volume','mean','absoluteMean','moments','variance','susceptibility','binder','logZ','freeEnergyPerVolume','estimatedError','converged']]for r in sc['volumes']])
  same(ts['fields'],[[r[k]for k in['h','volume','mean','absoluteMean','variance','susceptibility','binder','logZ','freeEnergyPerVolume','estimatedError','converged']]for r in sc['fields']])
  same(ts['spectrum'],[[r['q'],r['inverse'],r['response'],g['xi'],g['qMax'],r['q']<=g['qMax']if g['valid']else None]for r in g['spectrum']])
  same(ts['fluctuation'],[[r[k]for k in['d','sphereArea','prefactor','z','radial','variance','ratio','quarticExponent','tricriticalExponent']]for r in g['fluctuation']])
  same(ts['ginzburg'],[[r['family'],r['t'],r['m'],r['curvature'],r['xi'],q['d'],q['variance'],q['ratio'],q['z']]for r in sc['ginzburg']for q in r['dimensions']])
  for table in view['tables']:
   rows+=len(table['rows']);assert all(len(r)==len(table['headers'])for r in table['rows'])
  radius=max(.6,1.15*max(abs(r['m'])for r in st['roots']));xs=sorted(set([-radius+2*radius*j/240 for j in range(241)]+[r['m']for r in st['roots']]))
  branches=[[],[],[]]
  for r in sc['temperature']:
   for q in r['roots']:branches[0 if q['globalCandidate']else 1 if q['metastable']else 2].append([r['t'],q['m']])
  expected=[
   [[[x,c['t']*x*x/2+c['u']*x**4/4+c['v']*x**6/6-c['h']*x-st['fmin']]for x in xs],[[r['m'],r['deltaF']]for r in st['roots']]],
   [[[r['m'],r['density']]for r in fv['density']]],
   branches,
   [[[math.log2(r['volume']),r['susceptibility']]for r in sc['volumes']]],
   [[None if r['response']is None else[r['q'],r['response']]for r in g['spectrum']]],
   [[[math.log10(-r['t']),math.log10(r['dimensions'][c['dimension']-1]['ratio'])]for r in sc['ginzburg']if r['family']==family]for family in['quartic','tricritical']]
  ]
  domains=[[-radius,radius],[-4,4],[-1,1],[0,7],[0,c['cutoff']],[-4,0]]
  for p,markup,curves,domain in zip(view['plots'],view['svgs'],expected,domains):
   pts=[q for curve in curves for q in curve if q is not None];ys=[q[1]for q in pts];xmin,xmax=domain;ymin,ymax=(min(ys),max(ys))if ys else(0,1)
   if not pts:xmin,xmax=0,1
   if ymin==ymax:ymin-=.5;ymax+=.5
   pad=.08*(ymax-ymin);near([p[k]for k in['xMin','xMax','yMin','yMax']],[xmin,xmax,0 if p['key']in['energy','density','volume','spectrum']and ymin>=-1e-12 else ymin-pad,ymax+pad])
   same(len(p['series']),len(curves));tree=ET.fromstring(markup);paths=[e for e in tree.iter()if e.tag.endswith('path')];same(len(paths),len(curves))
   for line,path,points in zip(p['series'],paths,curves):
    same(len(line['points']),len(points));numbers=[];commands=[];pen=False
    for actual,pt in zip(line['points'],points):
     if pt is None:same(actual,None);pen=False;continue
     near(actual,pt);coords+=2;commands.append('L'if pen and not line.get('markersOnly')else'M');pen=True
     numbers.extend([100+(pt[0]-p['xMin'])/(p['xMax']-p['xMin'])*755,385-(pt[1]-p['yMin'])/(p['yMax']-p['yMin'])*290])
    same(re.findall('[ML]',path.attrib['d']),commands);values=list(map(float,re.findall(r'[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?',path.attrib['d'])));same(len(values),len(numbers))
    for a,b in zip(values,numbers):close(a,b)
   circles=[e for e in tree.iter()if e.tag.endswith('circle')];expectedMarks=[]
   for line in p['series']:
    pts=[x for x in line['points']if x is not None];marks=pts if line.get('markersOnly')else[pts[0]]+([pts[-1]]if len(pts)>1 else[])if line.get('boundaryMarkers')and pts else pts if len(pts)==1 else[]
    expectedMarks.extend(marks)
   same(len(circles),len(expectedMarks));markers+=len(circles)
   for circle,pt in zip(circles,expectedMarks):close(float(circle.attrib['cx']),100+(pt[0]-p['xMin'])/(p['xMax']-p['xMin'])*755);close(float(circle.attrib['cy']),385-(pt[1]-p['yMin'])/(p['yMax']-p['yMin'])*290)
 for i,pair in enumerate(d['feedback']):
  same([x['correct']for x in pair],[i in[1,3],i in[0,2]])
  for x in pair:assert x['text'].startswith('正确。'if x['correct']else'需要修正。')and len(x['text'])>20
 mutations=[('stationary','roots',0,'f'),('stationary','roots',0,'leadingOrder'),('finite','mean'),('finite','susceptibility'),('finite','binder'),('finite','rows',0,'fa',0),('finite','tailBounds',0,'logBound'),('finite','density',0,'weight'),('scans','volumes',0,'logZ'),('scans','fields',0,'susceptibility'),('scans','temperature',0,'roots',0,'curvature'),('gaussian','curvature'),('gaussian','fluctuation',2,'variance'),('scans','ginzburg',0,'dimensions',2,'ratio')]
 caught=0
 for path in mutations:
  record=copy.deepcopy(d['records'][0]);target=record
  for k in path[:-1]:target=target[k]
  target[path[-1]]+=1
  try:check_records([record])
  except AssertionError:caught+=1
 same(caught,len(mutations));same(d['self']['status'],'PASS')
 if not staging:
  for course in ['ai-course','grad-math','math-course','physics-course']:same((root/course/'site/assets/learning/labs/landau-free-energy.js').read_bytes(),js.read_bytes())
  same((root/'physics-course/site/assets/learning/projects/landau-certificates/run-snapshot.json').read_bytes(),fixture.read_bytes())
  for p in ['physics-course/lectures/asm-01-phase-transitions.md','physics-course/site/asm-01-phase-transitions.html']:assert 'ld184-course'in(root/p).read_text()
  with tempfile.TemporaryDirectory()as tmp:
   target=Path(tmp);subprocess.run(prefix+['python3',str(root/'tools/build_landau_figure.py'),str(js),str(fixture),str(target/'figure.svg'),str(target/'fallback.md')],check=True,stdout=subprocess.PIPE)
   same((target/'figure.svg').read_bytes(),(root/'physics-course/images/asm-01-landau-ledgers.svg').read_bytes());same((target/'figure.svg').read_bytes(),(root/'physics-course/site/assets/img/asm-01-landau-ledgers.svg').read_bytes());assert(target/'fallback.md').read_text()in(root/'physics-course/lectures/asm-01-phase-transitions.md').read_text()
 print(json.dumps({'status':'PASS','records':len(d['records']),'frozen':6,'checks':total,'plotCoordinates':coords,'markers':markers,'ledgerRows':rows,'invalid':d['invalid'],'feedback':8,'mutations':caught,'self':d['self']['checks'],'replayGuards':replayGuards}))
