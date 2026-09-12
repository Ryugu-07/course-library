"""Independent graph union-find, counting formula and SciPy quadrature oracle."""
import json,math,sys
from fractions import Fraction
from pathlib import Path
from functools import lru_cache
checks=0
def eq(a,b):
 global checks
 checks+=1
 assert a==b,(a,b)
def near(a,b,tol=2e-10):
 global checks
 checks+=1
 assert abs(a-b)<=tol*max(1,abs(a),abs(b)),(a,b)
def parts(n,edges,skip=None):
 p=list(range(n))
 def find(a):
  while p[a]!=a:a=p[a]
  return a
 for j,(a,b) in enumerate(edges):
  if j!=skip:p[find(a)]=find(b)
 out={}
 for i in range(n):out.setdefault(find(i),[]).append(i)
 return sorted(out.values())
def df(n):return math.prod(range(n,0,-2))

@lru_cache(maxsize=64)
def quad_for_lambda(lam):
 if lam==0:return 1.,0.
 def estimate(n):
  h=12/n
  f=lambda x:math.sqrt(2/math.pi)*math.exp(-x*x/2-lam*x**4/24)
  return h/3*(f(0)+f(12)+4*math.fsum(f(i*h)for i in range(1,n,2))+2*math.fsum(f(i*h)for i in range(2,n,2)))
 a,b=estimate(8192),estimate(16384)
 return b,abs(b-a)/15
def check_records(data):
 global checks
 checks=0
 for snap in data:
  c=snap['parameters'];w=snap['wick'];E=c['external'];V=c['vertices'];size=E+4*V
  eq(w['total'],df(size-1));eq(len(w['records']),w['total']);eq(w['denominator'],math.factorial(V)*24**V)
  seen=set();groups={}
  for record in w['records']:
   pair=record['pairs'];key=tuple(sorted(tuple(sorted(x))for x in pair));eq(key in seen,False);seen.add(key)
   eq(sorted(x for e in pair for x in e),list(range(size)))
   own=lambda x:x if x<E else E+(x-E)//4
   edges=[(own(a),own(b))for a,b in pair];pp=parts(E+V,edges)
   eq(record['components'],pp);vac=sum(all(x>=E for x in p)for p in pp);eq(record['vacuumComponents'],vac)
   internal=[j for j,(a,b)in enumerate(edges)if min(a,b)>=E];conn=len(pp)==1
   eq(record['connected'],conn);eq(record['internalEdges'],len(internal))
   bridges=[j for j in internal if len(parts(E+V,edges,j))>1]if conn else []
   eq(record['bridges'],bridges);one=E>0 and V>0 and conn and not bridges;eq(record['onePI'],one)
   eq(record['loopNumber'],len(internal)-V+1 if conn and V else None)
   ext=sum(max(a,b)<E for a,b in edges);eq(record['externalEdges'],ext)
   att=[[min(a,b)for a,b in edges if min(a,b)<E and max(a,b)==E+j]for j in range(V)]
   loops=[sum(a==b==E+j for a,b in edges)for j in range(V)];cross=sum(a!=b for a,b in edges if min(a,b)>=E)
   eq(record['attached'],att);eq(record['self'],loops);eq(record['cross'],cross)
   category=('connected-vacuum'if conn else 'vacuum-product')if E==0 else 'external-pair'if ext else 'vacuum-factor'if vac else 'separate-external-blocks'if not conn else 'onePI'if one else 'onePR'
   eq(record['category'],category);channel='|'.join(sorted(''.join(map(str,x))for x in att))if E==4 and V==2 and one and all(len(x)==2 for x in att)else None;eq(record['channel'],channel)
   g=category+':'+(channel or '')+':'+str(cross)+':'+','.join(map(str,sorted(loops)))+':'+','.join(map(str,sorted(map(len,att))))
   groups[g]=groups.get(g,0)+1
  eq({x['key']:x['count']for x in w['summary']},groups)
  # Count each labelled vertex allocation using factorials, without enumerating matchings.
  for g in w['summary']:
   r=w['records'][g['first']];a=list(map(len,r['attached']));h=r['self'];cross=r['cross'];e=r['externalEdges']
   # Fixed attachment labels and external-pair pattern: choose internal slots, then pair.
   slot_count=math.prod(math.factorial(4)//(2**h[j]*math.factorial(h[j]))for j in range(V))
   if V==2:slot_count//=math.factorial(cross)
   # The core groups some external label assignments together; verify individual patterns.
   pattern=(tuple(tuple(x)for x in r['attached']),tuple(h),tuple(tuple(sorted([x,y]))for x,y in r['pairs']if x<E and y<E))
   same=sum((tuple(tuple(x)for x in z['attached']),tuple(z['self']),tuple(tuple(sorted([x,y]))for x,y in z['pairs']if x<E and y<E))==pattern for z in w['records'])
   eq(same,slot_count);near(g['coefficient'],Fraction(g['count'],w['denominator']))
  eq(snap['selected'],w['records'][c['rank']])
  for norm in snap['normalization']:
   e=norm['external'];raw=[Fraction((-1)**n*df(e+4*n-1),24**n*math.factorial(n))for n in range(3)];vac=[Fraction((-1)**n*df(4*n-1),24**n*math.factorial(n))for n in range(3)];out=[]
   for n in range(3):out.append(raw[n]-sum(vac[j]*out[n-j]for j in range(1,n+1)))
   cumulant=out if e==2 else [Fraction(0),Fraction(-1),Fraction(7,2)]
   for name,expected in [('raw',raw),('vacuum',vac),('quotient',out),('noVacuum',out),('cumulant',cumulant),('connected',cumulant)]:
    for a,b in zip(norm[name],expected):near(a,b)
  zd=snap['zeroDimension'];lam=c['lambda'];ref,err=quad_for_lambda(lam)
  near(zd['integral']['value'],ref,5e-12)
  cumulative=0
  for row in zd['series']:
   n=row['n'];term=(-lam)**n*df(4*n-1)/(24**n*math.factorial(n));cumulative+=term
   for name,value in [('term',term),('sum',cumulative),('next',(-lam)**(n+1)*df(4*n+3)/(24**(n+1)*math.factorial(n+1))),('absoluteRatio',lam*(4*n+3)*(4*n+1)/(24*(n+1))),('numericalError',cumulative-ref)]:near(row[name],value)
   near(row['remainderBound'],abs(row['next']))
  intervals=zd['integral']['intervals']
  if lam:
   near(intervals[0]['a'],0);near(intervals[-1]['b'],12)
   for i,r in enumerate(intervals):
    if i:near(r['a'],intervals[i-1]['b'])
    a,b=r['a'],r['b'];pts=[a,(3*a+b)/4,(a+b)/2,(a+3*b)/4,b]
    vals=[math.sqrt(2/math.pi)*math.exp(-x*x/2-lam*x**4/24)for x in pts]
    for name,v in zip(['fa','fl','fm','fr','fb'],vals):near(r[name],v)
    coarse=(b-a)*(vals[0]+4*vals[2]+vals[4])/6;fine=(b-a)*(vals[0]+4*vals[1]+2*vals[2]+4*vals[3]+vals[4])/12
    near(r['coarse'],coarse);near(r['fine'],fine);near(r['correction'],(fine-coarse)/15);near(r['value'],fine+(fine-coarse)/15);eq(r['converged'],abs(r['correction'])<=r['tolerance'])
   near(sum(r['value']for r in intervals),ref,5e-12)
  for s in [snap['scattering']]+snap['angles']+snap['energies']:
   m=s['mass'];ratio=s['ratio'];cos=s['cosTheta'];en=m*ratio;mom=m*math.sqrt(ratio**2-1);inv=4*en**2
   near(s['s'],inv);near(s['t'],-2*mom**2*(1-cos));near(s['u'],-2*mom**2*(1+cos));near(s['sum'],4*m*m)
   for v in s['momenta']:near(v[0]**2-sum(x*x for x in v[1:]),m*m)
   for z in s['conservation']:near(z,0)
   near(s['flux'],8*en*mom);near(s['phaseDensity'],mom/(16*math.pi**2*math.sqrt(inv)));near(s['thresholdTotalLimit'],lam**2/(128*math.pi*m*m))
   if ratio==1:
    for key in ['distinguishable','identical','total']:eq(s[key],None)
   else:
    near(s['distinguishable'],lam**2*s['phaseDensity']/s['flux']);near(s['identical'],s['distinguishable']/2);near(s['total'],4*math.pi*s['identical'])
 return checks

if __name__=='__main__':
 import subprocess,shutil,tempfile,hashlib,re,copy,xml.etree.ElementTree as ET
 root=Path(__file__).resolve().parents[1];staging=len(sys.argv)>1
 js=Path(sys.argv[1])if staging else root/'course-shared/labs/feynman.js'
 fixture=Path(sys.argv[2])if staging else root/'course-shared/projects/feynman-certificates/run-snapshot.json'
 prefix=['rtk','proxy']if shutil.which('rtk')else[]
 code=r'''const a=require(process.argv[1]),f=require(process.argv[2]);let invalid=[];for(const k of Object.keys(a.DEFAULT))for(const v of [null,false,'1',[],{},Infinity,NaN])invalid.push({[k]:v});invalid.push(null,[],{toString:1},{constructor:1},{unknown:1},{external:1},{vertices:3},{rank:-1},{rank:105},{order:25},{order:1.5},{lambda:-.1},{lambda:2.1},{mass:0},{mass:3},{energyRatio:.9},{energyRatio:5},{cosTheta:1.1});let rejected=0;for(const x of invalid){try{a.config(x);}catch(e){rejected++;}}const configs=a.PRESETS.map(p=>p.config);for(const external of[0,2,4])for(const vertices of[0,1,2]){const w=a.wick(external,vertices);configs.push({external,vertices,rank:w.total-1});}for(const lambda of[0,.01,.5,2])for(const order of[0,24])configs.push({external:2,vertices:1,lambda,order});const records=configs.map(a.compute),views=a.PRESETS.map((p,i)=>{const s=records[i],ps=a.plots(s);return{key:p.key,plots:ps,svgs:ps.map(a.svg),tables:a.tables(s)};});console.log(JSON.stringify({records,views,frozen:f.records.map(r=>a.compute(r.data.parameters)),invalid:invalid.length,rejected,feedback:a.QUESTIONS.map((q,i)=>[a.feedback(i,0),a.feedback(i,1)]),self:a.selfTest()}));'''
 d=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True));f=json.loads(fixture.read_text())
 assert f['provenance']['sourceSha256']==hashlib.sha256(js.read_bytes()).hexdigest()
 assert len(f['records'])==6 and len({r['key']for r in f['records']})==6
 # Frozen source identity remains byte-exact; libm results need numeric replay.
 def replay(a,b,path='$'):
  if isinstance(a,dict):
   assert isinstance(b,dict) and a.keys()==b.keys(),('replay keys',path)
   for key in a:replay(a[key],b[key],path+'.'+key)
  elif isinstance(a,list):
   assert isinstance(b,list) and len(a)==len(b),('replay length',path)
   for i,(x,y) in enumerate(zip(a,b)):replay(x,y,path+'['+str(i)+']')
  elif type(a)in(int,float) and type(b)in(int,float):
   if type(a)is int and type(b)is int:assert a==b,('replay integer',path,a,b)
   else:assert math.isfinite(a) and math.isfinite(b) and math.isclose(a,b,rel_tol=2e-12,abs_tol=2e-14),('replay number',path,a,b)
  else:assert type(a)is type(b) and a==b,('replay exact',path,a,b)
 replay(d['frozen'],[r['data']for r in f['records']])
 # The replay accepts last-bit rounding, but rejects structural and numeric drift.
 replay({'x':[1.0,None,True,2]}, {'x':[math.nextafter(1.0,2.0),None,True,2]})
 replayGuardCases=[({'x':1.0},{'x':1.00001}),({'x':1},{'x':2}),({'x':None},{'x':0}),({'x':True},{'x':1}),({'x':[1]},{'x':[]}),({'x':1},{'y':1})]
 replayGuards=0
 for a,b in replayGuardCases:
  try:replay(a,b)
  except AssertionError:replayGuards+=1
 assert replayGuards==len(replayGuardCases)

 assert d['invalid']==d['rejected']and d['invalid']>=70
 total=check_records(d['records']+[r['data']for r in f['records']]);plotCoordinates=0;ledgerRows=0;markers=0
 def close(a,b):assert abs(a-b)<=2e-5*max(1,abs(a),abs(b)),(a,b)
 def same(a,b):assert a==b,(a,b)
 for vi,v in enumerate(d['views']):
  s=d['records'][vi];E=s['parameters']['external'];V=s['parameters']['vertices'];slots=E+4*V
  same([p['key']for p in v['plots']],['diagram','groups','series','error','angles','cross'])
  same([t['key']for t in v['tables']],['parameters','groups','pairings','selected','normalization','series','integral','kinematics','angles','energies'])
  # Tables must expose every row and all declared numeric fields, including zero/null.
  tables={t['key']:t for t in v['tables']}
  same(tables['parameters']['rows'],[[k,x]for k,x in s['parameters'].items()])
  same(tables['groups']['rows'],[[i,r['category'],r['channel'],r['key'],r['count'],r['denominator'],r['coefficient'],r['first']]for i,r in enumerate(s['wick']['summary'])])
  same(tables['pairings']['rows'],[[r[k]for k in ['id','pairs','externalEdges','attached','self','cross','components','vacuumComponents','connected','onePI','bridges','internalEdges','loopNumber','category','channel']]for r in s['wick']['records']])
  same(tables['selected']['rows'],[[i,a,b,'外'+str(a)if a<E else 'v'+str((a-E)//4),'外'+str(b)if b<E else 'v'+str((b-E)//4),i in s['selected']['bridges']]for i,(a,b)in enumerate(s['selected']['pairs'])])
  same(tables['normalization']['rows'],[[r['external'],n,r['vacuum'][n],r['raw'][n],r['quotient'][n],r['noVacuum'][n],r['cumulant'][n],r['connected'][n]]for r in s['normalization']for n in range(3)])
  same(tables['series']['rows'],[[r[k]for k in ['n','term','sum','next','absoluteRatio','remainderBound','numericalError']]for r in s['zeroDimension']['series']])
  same(tables['integral']['rows'],[[r[k]for k in ['a','b','fa','fl','fm','fr','fb','coarse','fine','correction','value','estimatedError','tolerance','depth','converged']]for r in s['zeroDimension']['integral']['intervals']])
  same(tables['kinematics']['rows'][:len(s['scattering'])],[[k,x]for k,x in s['scattering'].items()])
  same(tables['kinematics']['rows'][-3:],[[label,s['zeroDimension']['integral'][key]]for label,key in [('零维积分Z（数值）','value'),('积分误差估计','estimatedError'),('|x|>12的Gaussian尾部上界','tailBound')]])
  same(tables['angles']['rows'],[[r[k]for k in ['cosTheta','momenta','s','t','u','sum','flux','phaseDensity','distinguishable','identical','total']]for r in s['angles']])
  same(tables['energies']['rows'],[[r[k]for k in ['ratio','energy','momentum','s','flux','phaseDensity','threshold','total','thresholdTotalLimit']]for r in s['energies']])
  for t in v['tables']:
   ledgerRows+=len(t['rows']);assert all(len(r)==len(t['headers'])for r in t['rows'])
  expected=[
   [[[50+800*a/(slots-1),300],[50+800*b/(slots-1),300]]for a,b in s['selected']['pairs']]if slots>1 else [],
   [[[i,r['coefficient']]for i,r in enumerate(s['wick']['summary'])]],
   [[[r['n'],math.asinh(r['sum'])]for r in s['zeroDimension']['series']],[[r['n'],math.asinh(s['zeroDimension']['integral']['value'])]for r in s['zeroDimension']['series']]],
   [[[r['n'],math.log10(1+abs(r['numericalError']))]for r in s['zeroDimension']['series']],[[r['n'],math.log10(1+r['remainderBound'])]for r in s['zeroDimension']['series']]],
   [[[r['cosTheta'],r[k]]for r in s['angles']]for k in ['t','u','sum']],
   [[None if r['total']is None else [r['ratio'],r['total']]for r in s['energies']],[[1,s['scattering']['thresholdTotalLimit']]]]
  ]
  for pi,(p,markup,curves)in enumerate(zip(v['plots'],v['svgs'],expected)):
   if pi==0:same([p[k]for k in ['xMin','xMax','yMin','yMax']],[0,900,0,540])
   else:
    points=[pt for curve in curves for pt in curve if pt is not None];xs=[pt[0]for pt in points];ys=[pt[1]for pt in points];xmin=min(xs)if xs else 0;xmax=max(xs)if xs else 1;ymin=min(ys)if ys else 0;ymax=max(ys)if ys else 1
    if xmax==xmin:xmax=xmin+1
    pad=(ymax-ymin or max(1,abs(ymax)))*.08
    for key,val in zip(['xMin','xMax','yMin','yMax'],[xmin,xmax,ymin-pad,ymax+pad]):close(p[key],val)
   same(len(p['series']),len(curves));tree=ET.fromstring(markup);same(tree.attrib['aria-label'],p['title']);paths=[e for e in tree.iter()if 'data-series'in e.attrib];same(len(paths),len(curves))
   for si,(line,points,path)in enumerate(zip(p['series'],curves,paths)):
    same(len(line['points']),len(points));same(path.attrib['data-series'],str(si));same(path.attrib['stroke'],line['color'])
    for actual,expect in zip(line['points'],points):
     if expect is None:same(actual,None)
     else:
      for a,b in zip(actual,expect):close(a,b);plotCoordinates+=1
    if pi==0:
     a,b=points;h=35+.15*abs(b[0]-a[0]);nums=[a[0],300,(a[0]+b[0])/2,300-2*h,b[0],300];same(re.findall('[MLQ]',path.attrib['d']),['M','Q'])
    else:
     nums=[];commands=[];pen=False
     for pt in points:
      if pt is None:pen=False;continue
      commands.append('L'if pen and not line.get('markersOnly')else'M');pen=True
      nums.extend([100+(pt[0]-p['xMin'])/(p['xMax']-p['xMin'])*755,385-(pt[1]-p['yMin'])/(p['yMax']-p['yMin'])*290])
     same(re.findall('[MLQ]',path.attrib['d']),commands)
    actual=list(map(float,re.findall(r'[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?',path.attrib['d'])));same(len(actual),len(nums))
    for a,b in zip(actual,nums):close(a,b)
   circles=[e for e in tree.iter()if e.tag.endswith('circle')];markers+=len(circles)
   if pi==0:
    same(len(circles),slots)
    for i,node in enumerate(circles):close(float(node.attrib['cx']),50+800*i/(slots-1));close(float(node.attrib['cy']),300)
   else:
    expectedMarks=[]
    for line in p['series']:
     points=[pt for pt in line['points']if pt is not None]
     selected=points if line.get('markersOnly')else [points[0]]+([points[-1]]if len(points)>1 else[])if line.get('boundaryMarkers')and points else points if len(points)==1 else []
     for x,y in selected:expectedMarks.append((100+(x-p['xMin'])/(p['xMax']-p['xMin'])*755,385-(y-p['yMin'])/(p['yMax']-p['yMin'])*290,'var(--bg,#fff)'if line.get('open')else line['color']))
    same(len(circles),len(expectedMarks))
    for node,(x,y,fill)in zip(circles,expectedMarks):close(float(node.attrib['cx']),x);close(float(node.attrib['cy']),y);same(node.attrib['fill'],fill)
 for i,pair in enumerate(d['feedback']):
  same([x['correct']for x in pair],[i in [1,2],i in [0,3]])
  for x in pair:assert x['text'].startswith('预测正确。'if x['correct']else'需要修正。')and len(x['text'])>10
 mutations=[('wick','total'),('wick','denominator'),('selected','id'),('zeroDimension','integral','value'),('zeroDimension','series',0,'sum'),('zeroDimension','series',0,'next'),('zeroDimension','integral','intervals',0,'fa'),('scattering','flux'),('scattering','identical'),('normalization',1,'cumulant',2),('normalization',1,'noVacuum',2),('wick','summary',0,'count'),('wick','records',0,'vacuumComponents'),('angles',0,'t')]
 caught=0
 for path in mutations:
  changed=copy.deepcopy(d['records'][0]);target=changed
  for k in path[:-1]:target=target[k]
  target[path[-1]]+=1
  try:check_records([changed])
  except AssertionError:caught+=1
 same(caught,len(mutations));same(d['self']['status'],'PASS')
 if not staging:
  for course in ['ai-course','grad-math','math-course','physics-course']:same((root/course/'site/assets/learning/labs/feynman.js').read_bytes(),js.read_bytes())
  same((root/'physics-course/site/assets/learning/projects/feynman-certificates/run-snapshot.json').read_bytes(),fixture.read_bytes())
  for p in ['physics-course/lectures/qft-02-feynman.md','physics-course/site/qft-02-feynman.html']:assert 'fy182-course'in(root/p).read_text()
  with tempfile.TemporaryDirectory()as tmp:
   target=Path(tmp);subprocess.run(prefix+['python3',str(root/'tools/build_feynman_figure.py'),str(js),str(fixture),str(target/'figure.svg'),str(target/'fallback.md')],check=True,stdout=subprocess.PIPE)
   same((target/'figure.svg').read_bytes(),(root/'physics-course/images/qft-02-feynman-ledgers.svg').read_bytes());same((target/'figure.svg').read_bytes(),(root/'physics-course/site/assets/img/qft-02-feynman-ledgers.svg').read_bytes());assert(target/'fallback.md').read_text()in(root/'physics-course/lectures/qft-02-feynman.md').read_text()
 print(json.dumps({'status':'PASS','records':len(d['records']),'frozen':6,'checks':total,'plotCoordinates':plotCoordinates,'markers':markers,'ledgerRows':ledgerRows,'invalid':d['invalid'],'feedback':8,'mutations':caught,'self':d['self']['checks'],'replayGuards':replayGuards}))
