"""Independent signed-frequency sums, Decimal Bessel series and exact matrix identities."""
import math,cmath
from decimal import Decimal,localcontext
from functools import lru_cache
checks=0
def eq(a,b):
 global checks
 assert a==b,(a,b);checks+=1
def near(a,b):
 global checks
 if b is None:assert a is None
 else:assert isinstance(a,(int,float))and math.isfinite(a)and abs(a-float(b))<=2e-8*max(1,abs(float(b))),(a,b)
 checks+=1
def deep(a,b):
 if isinstance(b,dict):eq(set(a),set(b));[deep(a[k],v)for k,v in b.items()]
 elif isinstance(b,list):eq(len(a),len(b));[deep(x,y)for x,y in zip(a,b)]
 elif isinstance(b,(int,float))and not isinstance(b,bool):near(a,b)
 else:eq(a,b)
@lru_cache(maxsize=16000)
def bessel(zsquare):
 with localcontext()as ctx:
  ctx.prec=50;x=Decimal(str(zsquare))/4;term=total=Decimal(1)
  for n in range(1,80):
   term*=-x/(n*n);total+=term
   if abs(term)<Decimal('1e-45'):break
  return float(total)
def ask(n,b,p):return int(n==1 and b=='cos')if p=='one-cos'else int(n<=2 and b in ['zero','cos'])if p=='product-three'else 0
def energy(c,K):
 L=c['length'];m=c['mass'];E0=exc=number=variance=0
 for n in range(K+1):
  k=2*math.pi*n/L;w=math.hypot(k,m);nq=ask(n,'zero'if n==0 else'cos',c['profile'])
  if w>0:E0+=(1 if n==0 else 2)*w/2;exc+=nq*w;number+=nq;variance+=k*k*nq
 bad=m==0 and ask(0,'zero',c['profile'])>0
 return{'cutoff':K,'modeCount':2*K+1,'momentumCutoff':2*math.pi*K/L,'positiveZero':E0,'positiveExcitation':exc,'positiveTotal':E0+exc,'zeroPoint':None if m==0 else E0,'excitation':None if bad else exc,'total':None if m==0 else E0+exc,'particleNumber':None if bad else number,'momentumMean':None if bad else 0,'momentumVariance':None if bad else variance,'identityResidual':None if m==0 else 0,'missing':[{'n':n,'basis':'cos','occupation':1}for n in range(K+1,3)if ask(n,'cos',c['profile'])],'zeroMode':'Hamiltonian p0²/2; no normalizable oscillator vacuum'if m==0 else'massive oscillator'}
def continuum(c,t,r):
 if t==0:return 0,False,[]
 imgs=[]
 for j in [-1,0,1]:
  d=r+j*c['length'];margin=t*t-d*d
  if abs(margin)<1e-12:return None,True,[]
  if margin>0:
   arg=c['mass']*math.sqrt(margin);b=bessel(arg*arg);imgs.append({'j':j,'d':d,'argument':arg,'bessel':b,'contribution':math.copysign(.5,t)*b})
 return sum(x['contribution']for x in imgs),False,imgs
def point(c,t,r):
 L=c['length'];m=c['mass'];K=c['cutoff'];C=delta=der=0.;W=0j;DF=0j
 for n in range(-K,K+1):
  k=2*math.pi*n/L;w=math.hypot(k,m);spatial=cmath.exp(1j*k*r);delta+=spatial.real/L;C+=spatial.real*(t if w==0 else math.sin(w*t)/w)/L;der+=spatial.real*math.cos(w*t)/L
  if w:W+=cmath.exp(1j*(k*r-w*t))/(2*L*w);DF+=cmath.exp(1j*(k*r-w*abs(t)))/(2*L*w)
 cont,boundary,imgs=continuum(c,t,r)
 return{'t':t,'r':r,'delta':delta,'C':C,'dC':der,'W':None if m==0 else[W.real,W.imag],'DF':None if m==0 else[DF.real,DF.imag],'Gret':C if t>0 else 0,'continuum':cont,'continuumRetarded':None if cont is None else cont if t>0 else 0,'boundary':boundary,'images':imgs,'spacelike':abs(r)>abs(t),'difference':None if cont is None else C-cont,'relationResidual':None if m==0 else 0}
def audit(s):
 eq(s['version'],181);c=s['parameters'];K=c['cutoff'];L=c['length'];m=c['mass'];expected=[]
 for n in range(K+1):
  for basis in ['zero']if n==0 else['cos','sin']:
   k=2*math.pi*n/L;w=math.hypot(k,m);q=ask(n,basis,c['profile']);expected.append({'n':n,'basis':basis,'k':k,'omega':w,'normalization':math.sqrt((1 if n==0 else 2)/L),'requestedOccupation':q,'occupation':q if w else None,'zeroPoint':w/2 if w else None,'excitation':w*q if w else None,'level':(q+.5)*w if w else None,'kind':'oscillator'if w else'free-particle-zero-mode'})
 deep(s['modes'],expected);deep(s['energy'],energy(c,K));eq(len(s['cutoffScan']),17)
 for k,row in enumerate(s['cutoffScan']):deep(row,energy(c,k))
 r=c['rFraction']*L;deep(s['probe'],point(c,c['time'],r));xs=[L*(i/128-.5)for i in range(129)];ts=[-2+i/25 for i in range(101)]
 for j in [-1,0,1]:
  for sign in [-1,1]:
   x=sign*abs(c['time'])-j*L;t=sign*abs(r+j*L)
   if -L/2<=x<=L/2:xs.append(x)
   if -2<=t<=2:ts.append(t)
 xs=sorted(set(xs));ts=sorted(set(ts));eq(len(s['space']),len(xs));eq(len(s['timeScan']),len(ts))
 for x,row in zip(xs,s['space']):deep(row,point(c,c['time'],x))
 for t,row in zip(ts,s['timeScan']):deep(row,point(c,t,r))
 eq(len(s['probeTerms']),K+1)
 for n,row in enumerate(s['probeTerms']):
  g=1 if n==0 else 2;k=2*math.pi*n/L;w=math.hypot(k,m);t=c['time'];co=math.cos(k*r);f=g*co/L;deep(row,{'n':n,'g':g,'k':k,'omega':w,'cos':co,'delta':f,'C':f*(t if w==0 else math.sin(w*t)/w),'dC':f*math.cos(w*t),'W':None if w==0 else[f*math.cos(w*t)/(2*w),-f*math.sin(w*t)/(2*w)]})
 eq(len(s['projection']),6)
 for h,rec in zip([0,1,2,3,7,20],s['projection']):
  eq(rec['h'],h);eq(rec['points'],128);near(rec['value'],int(h<=K));eq(rec['expected'],int(h<=K));eq(len(rec['terms']),128);total=0
  for j,row in enumerate(rec['terms']):
   y=L*j/128;kernel=sum(cmath.exp(2j*math.pi*n*y/L)for n in range(-K,K+1)).real/L;test=math.cos(2*math.pi*h*y/L);val=L/128*kernel*test;deep(row,{'j':j,'y':y,'kernel':kernel,'test':test,'contribution':val});total+=val
  near(rec['value'],total)
 l=s['ladder'];N=c['ladderDim'];eq(l['dimension'],N);eq(l['frequency'],1);near(l['trace'],0)
 for key in ['a','ad','q','pImag','commutator','qpImag','fromQP','projectedH','defect']:
  M=[]
  for i in range(N):
   row=[]
   for j in range(N):
    a=math.sqrt(j)if j==i+1 else 0;ad=math.sqrt(i)if i==j+1 else 0;top=i==j==N-1;diag=i==j
    value={'a':a,'ad':ad,'q':(a+ad)/math.sqrt(2),'pImag':(ad-a)/math.sqrt(2),'commutator':1-N if top else int(diag),'qpImag':1-N if top else int(diag),'fromQP':(i+.5 if diag else 0)-(N/2 if top else 0),'projectedH':i+.5 if diag else 0,'defect':-N/2 if top else 0}[key];row.append(value)
   M.append(row)
  deep(l[key],M)
 eq(len(l['rows']),N)
 for n,row in enumerate(l['rows']):deep(row,{'n':n,'commutator':1-N if n==N-1 else 1,'qpImag':1-N if n==N-1 else 1,'fromQP':n+.5-(N/2 if n==N-1 else 0),'projectedH':n+.5,'defect':-N/2 if n==N-1 else 0})
 deep(l['probe'],l['rows'][c['level']])

from pathlib import Path
import subprocess,shutil,hashlib,tempfile,copy,re,xml.etree.ElementTree as ET,json,sys
staging=len(sys.argv)>1;root=Path(sys.argv[1])if staging else Path(__file__).resolve().parents[1];prefix=['rtk','proxy']if shutil.which('rtk')else[]
js=root/'canonical-field181.js'if staging else root/'course-shared/labs/canonical-field-modes.js'
fixture=(root/'field-snapshot181.json'if(root/'field-snapshot181.json').exists()else root/'qft181-preview-observations.json')if staging else root/'course-shared/projects/canonical-certificates/run-snapshot.json'
code=r'''
const a=require(process.argv[1]),configs=a.PRESETS.map(p=>p.config);for(const mass of [0,.1,2])for(const cutoff of [0,1,16])for(const time of [-2,0])configs.push({mass,cutoff,time,length:4,profile:'product-three',ladderDim:12,level:11});configs.push({length:4,time:1,rFraction:.25},{length:12,time:2,cutoff:16},{time:1,rFraction:(1+1e-14)/(2*Math.PI)});const records=configs.map(c=>a.snapshot(c));const bad=[null,[],3,'x',{bad:1},{constructor:1},JSON.parse('{"__proto__":1}'),{mass:-.1},{mass:.01},{mass:.09999},{mass:2.01},{length:3.99},{length:12.01},{cutoff:-1},{cutoff:17},{cutoff:1.5},{time:-2.1},{time:2.1},{rFraction:-.1},{rFraction:.51},{ladderDim:1},{ladderDim:13},{ladderDim:2.5},{level:-1},{level:6},{level:1.5},{ladderDim:2,level:2}];for(const k of Object.keys(a.DEFAULTS).filter(k=>k!=='profile'))for(const v of ['1',null,NaN,Infinity,-Infinity])bad.push({[k]:v});for(const v of ['',null,1,[],{}])bad.push({profile:v});for(const c of bad){let caught=false;try{a.config(c)}catch(e){caught=true}if(!caught)throw Error('Invalid input accepted');}const feedback=[];for(let i=0;i<4;i++)for(let j=0;j<2;j++)feedback.push(a.feedback(i,j));console.log(JSON.stringify({records,views:records.map(s=>({plots:a.plots(s),svg:a.plots(s).map(a.svg),tables:a.tables(s)})),invalid:bad.length,feedback,self:a.selfTest()}));
'''
data=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve())],text=True));records=data['records']
for s in records:audit(s)
f=json.loads(fixture.read_text());eq(len(f['records']),6);eq(f['provenance']['sourceSha256'],hashlib.sha256(js.read_bytes()).hexdigest())
replays=json.loads(subprocess.check_output(prefix+['node','-e','const a=require(process.argv[1]),f=require(process.argv[2]);console.log(JSON.stringify(f.records.map(r=>a.snapshot(r.data.parameters))));',str(js.resolve()),str(fixture.resolve())],text=True))
for rec,replay in zip(f['records'],replays):audit(rec['data']);deep(rec['data'],replay)
coords=markers=ledgerRows=0;ns={'s':'http://www.w3.org/2000/svg'}
for s,view in zip(records,data['views']):
 sp=s['space'];l=s['ladder'];c=s['parameters']
 expected=[
 [[[r['k'],r['omega']]for r in s['modes']if r['basis']!='sin']],
 [[[r['cutoff'],r[key]]if r[key]is not None else None for r in s['cutoffScan']]for key in ['zeroPoint','excitation']],
 [[[r['r'],r['delta']]for r in sp]],
 [[[r['r'],r[key]]if r[key]is not None else None for r in sp]for key in ['C','continuum']],
 [[[r['r'],r['W'][i]]if r['W']is not None else None for r in sp]for i in range(2)],
 [[[r['n'],r['commutator']]for r in l['rows']],[[r['n'],1]for r in l['rows']],[[l['probe']['n'],l['probe']['commutator']]]]]
 eq(len(view['plots']),6);eq(len(view['svg']),6)
 for plot,raw,pointsExpected in zip(view['plots'],view['svg'],expected):
  eq(len(plot['series']),len(pointsExpected))
  for serie,points in zip(plot['series'],pointsExpected):deep(serie['points'],points)
  tree=ET.fromstring(raw);paths=tree.findall('s:path',ns);eq(len(paths),len(plot['series']));assert plot['xMax']>plot['xMin']and plot['yMax']>plot['yMin']
  X=lambda x:100+(x-plot['xMin'])/(plot['xMax']-plot['xMin'])*755;Y=lambda y:385-(y-plot['yMin'])/(plot['yMax']-plot['yMin'])*290
  expectedMarkers=[]
  for path,serie in zip(paths,plot['series']):
   commands=re.findall(r'([ML])([-\d.]+),([-\d.]+)',path.attrib['d']);points=[p for p in serie['points']if p is not None];eq(len(commands),len(points));pen=False;expectedCommands=[]
   for p in serie['points']:
    if p is None:pen=False;continue
    expectedCommands.append('L'if pen and not serie.get('markersOnly')else'M');pen=True
   eq([r[0]for r in commands],expectedCommands)
   for (_,x,y),p in zip(commands,points):assert abs(float(x)-X(p[0]))<=.0000006 and abs(float(y)-Y(p[1]))<=.0000006;coords+=2
   if serie.get('markersOnly'):expectedMarkers+=points
   elif serie.get('boundaryMarkers')and points:expectedMarkers+=[points[0]]+([points[-1]]if len(points)>1 else[])
  circles=tree.findall('s:circle',ns);eq(len(circles),len(expectedMarkers))
  for circle,p in zip(circles,expectedMarkers):near(float(circle.attrib['cx']),X(p[0]));near(float(circle.attrib['cy']),Y(p[1]));markers+=1
 tables={t['key']:t for t in view['tables']};eq(len(tables),10)
 expectedTables={
 'parameters':[[k,v]for k,v in c.items()],
 'modes':[[r[k]for k in ['n','basis','k','omega','normalization','requestedOccupation','occupation','zeroPoint','excitation','level','kind']]for r in s['modes']],
 'energy':[[k,v]for k,v in s['energy'].items()],
 'cutoff':[[r[k]for k in ['cutoff','modeCount','momentumCutoff','positiveZero','positiveExcitation','zeroPoint','excitation','total','particleNumber','momentumMean','momentumVariance','missing']]for r in s['cutoffScan']],
 'space':[[r[k]for k in ['r','t','delta','C','dC','W','DF','Gret','continuum','continuumRetarded','difference','boundary','spacelike','relationResidual']]for r in sp],
 'terms':[[r[k]for k in ['n','g','k','omega','cos','delta','C','dC','W']]for r in s['probeTerms']],
 'projection':[[m['h'],r['j'],r['y'],r['kernel'],r['test'],r['contribution'],m['value'],m['expected']]for m in s['projection']for r in m['terms']],
 'matrices':[[i,j]+[l[k][i][j]for k in ['a','ad','q','pImag','commutator','qpImag','fromQP','projectedH','defect']]for i in range(l['dimension'])for j in range(l['dimension'])],
 'ladder':[[r[k]for k in ['n','commutator','qpImag','fromQP','projectedH','defect']]for r in l['rows']],
 'time':[[r[k]for k in ['t','r','C','W','DF','Gret','continuum','continuumRetarded','boundary','difference']]for r in s['timeScan']]}
 for key,expected in expectedTables.items():deep(tables[key]['rows'],expected);assert all(len(r)==len(tables[key]['headers'])for r in expected);ledgerRows+=len(expected)
eq(data['invalid'],67);eq(len(data['feedback']),8)
for i,fb in enumerate(data['feedback']):eq(fb['correct'],i%2==[0,1,1,0][i//2]);assert len(fb['text'])>25
mutations=0
for path in [('modes',1,'occupation'),('energy','zeroPoint'),('cutoffScan',3,'particleNumber'),('probe','C'),('probeTerms',0,'C'),('space',10,'delta'),('space',10,'W',0),('space',10,'continuum'),('projection',0,'terms',0,'contribution'),('projection',1,'value'),('ladder','commutator',5,5),('ladder','fromQP',5,5),('ladder','probe','defect')]:
 bad=copy.deepcopy(records[0]);target=bad
 for key in path[:-1]:target=target[key]
 target[path[-1]]+=1
 try:audit(bad)
 except AssertionError:mutations+=1
 else:raise AssertionError('Mutation escaped: '+str(path))
if not staging:
 for course in ['ai-course','grad-math','math-course','physics-course']:assert(root/course/'site/assets/learning/labs/canonical-field-modes.js').read_bytes()==js.read_bytes()
 assert(root/'physics-course/site/assets/learning/projects/canonical-certificates/run-snapshot.json').read_bytes()==fixture.read_bytes()
 assert(root/'physics-course/images/qft-01-canonical-ledgers.svg').read_bytes()==(root/'physics-course/site/assets/img/qft-01-canonical-ledgers.svg').read_bytes()
 with tempfile.TemporaryDirectory()as td:
  svg=Path(td)/'replay.svg';md=Path(td)/'replay.md';subprocess.run(prefix+[sys.executable,str(root/'tools/build_canonical_figure.py'),str(js),str(fixture),str(svg),str(md)],check=True,stdout=subprocess.DEVNULL);assert svg.read_bytes()==(root/'physics-course/images/qft-01-canonical-ledgers.svg').read_bytes();assert md.read_text()in(root/'physics-course/lectures/qft-01-canonical.md').read_text()
print(json.dumps({'status':'PASS','records':len(records),'frozen':len(f['records']),'checks':checks,'plotCoordinates':coords,'markers':markers,'ledgerRows':ledgerRows,'invalid':data['invalid'],'feedback':8,'mutations':mutations,'self':data['self']['checks']}))
