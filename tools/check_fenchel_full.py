"""Independent real-arithmetic conjugacy and primal/dual certificates."""
import math
CHECKS=0
def decode(v):return math.inf if v=='+Infinity'else-math.inf if v=='-Infinity'else v
def near(a,b,label,tol=3e-10):
 global CHECKS
 a=decode(a);b=decode(b);assert isinstance(a,(int,float))and not isinstance(a,bool),(label,a)
 assert a==b or math.isfinite(a)and math.isfinite(b)and abs(a-b)<=tol*max(1,abs(b)),(label,a,b);CHECKS+=1
def fvalue(m,x):
 if m=='quadratic':return x*x/2
 if m=='absolute':return abs(x)
 if m=='exponential':return math.exp(x)
 if m=='hinge':return max(0,1-x)
 if m=='closedInterval':return 0 if 0<=x<=1 else math.inf
 if m=='openInterval':return 0 if 0<x<1 else math.inf
 return(x*x-1)**2
def fstar(m,y):
 if m=='quadratic':return y*y/2
 if m=='absolute':return 0 if abs(y)<=1 else math.inf
 if m=='exponential':return y*math.log(y)-y if y>0 else 0 if y==0 else math.inf
 if m=='hinge':return y if -1<=y<=0 else math.inf
 if m in ['closedInterval','openInterval']:return max(0,y)
 z=3*math.sqrt(3)*abs(y)/8;r=2/math.sqrt(3)*(math.cos(math.acos(z)/3)if z<=1 else math.cosh(math.acosh(z)/3));return abs(y)*r-(r*r-1)**2
def envelope(m,x):return 0 if m=='doubleWell'and abs(x)<=1 else fvalue('closedInterval',x)if m=='openInterval'else fvalue(m,x)
def check_dual(d):
 c=d['parameters'];a,b,l=c['a'],c['b'],c['lambda'];P=lambda x:l*abs(x)+(a*x-b)**2/2;bound=l/abs(a)if a else math.inf
 for r in [d['current'],d['optimal']]:
  x,y=r['x'],r['y'];feasible=abs(y)<=bound;D=b*y-y*y/2 if feasible else-math.inf
  assert r['dualFeasible']==feasible
  for k,v in [('dualBound',bound),('primal',P(x)),('dual',D),('residual',a*x-b+y),('quadraticGap',(a*x-b+y)**2/2),('l1Gap',l*abs(x)-a*x*y if feasible else math.inf),('gap',P(x)-D),('gapSum',P(x)-D),('dualViolation',abs(a)*max(0,abs(y)-bound)if a else 0)]:near(r[k],v,k)
 candidates=[0]
 if a:
  for sign in [-1,1]:
   x=(a*b-l*sign)/(a*a)
   if x*sign>=0:candidates.append(x)
 best=min(map(P,candidates));near(d['optimal']['primal'],best,'bestP');near(d['optimal']['dual'],best,'bestD')
 assert d['primalSolutions']==('all-real'if a==0 and l==0 else'unique')
 for r in d['primalScan']:near(r['value'],P(r['x']),'Pscan')
 for r in d['dualScan']:assert r['feasible']==(abs(r['y'])<=bound);near(r['value'],b*r['y']-r['y']**2/2 if r['feasible']else-math.inf,'Dscan')
def check_snapshot(s):
 assert s['version']==171;c=s['parameters'];m,x,y=c['model'],c['x'],c['y'];r=s['current'];f=fvalue(m,x);star=fstar(m,y)
 for k,v in [('f',f),('star',star),('pairing',x*y),('gap',f+star-x*y),('supportAtX',x*y-star),('biconjugate',envelope(m,x))]:near(r[k],v,k)
 assert r['effectiveDomain']==math.isfinite(f)and r['dualDomain']==math.isfinite(star)
 attained=math.isfinite(star)and not(m=='exponential'and y==0)and not(m=='openInterval'and y!=0);assert r['attained']==attained
 contact=False;residual=None
 if math.isfinite(f)and math.isfinite(star):
  if m=='absolute':contact=abs(y)<=1 if x==0 else y==(1 if x>0 else-1)
  elif m=='hinge':contact=y==-1 if x<1 else y==0 if x>1 else-1<=y<=0
  elif m in ['closedInterval','openInterval']:contact=y==0 or(m=='closedInterval'and((x==0 and y<0)or(x==1 and y>0)))
  else:
   residual=y-(x if m=='quadratic'else math.exp(x)if m=='exponential'else 4*x*(x*x-1));contact=residual==0 and(m!='doubleWell'or abs(x)>=1)
 assert r['contactByExactModelConditions']==contact
 if residual is None:assert r['slopeResidual']is None
 else:near(r['slopeResidual'],residual,'slope')
 gap=f+star-x*y;small=math.isfinite(gap)and abs(gap)<=1e-10*max(1,abs(f),abs(star),abs(x*y));assert r['numericallySmallGap']==small
 assert len(s['curves'])>=257 and len(s['slopes'])>=129
 for n in s['curves']:
  near(n['f'],fvalue(m,n['x']),'curve');near(n['support'],y*n['x']-star,'support');near(n['biconjugate'],envelope(m,n['x']),'envelope');assert decode(n['support'])<=decode(n['f'])+3e-10
 for n in s['slopes']:
  v=fstar(m,n['y']);near(n['value'],v,'slope scan');assert n['finite']==math.isfinite(v);assert n['attained']==(math.isfinite(v)and not(m=='exponential'and n['y']==0)and not(m=='openInterval'and n['y']!=0))
 for n in r['brackets']:
  assert n['lo']<=n['mid']<=n['hi'];assert 4*n['lo']*(n['lo']**2-1)<=abs(y)+2e-12 and 4*n['hi']*(n['hi']**2-1)>=abs(y)-2e-12;near(n['residual'],4*n['mid']*(n['mid']**2-1)-abs(y),'root bracket')
 arg=r['argmax']
 if not attained:assert arg['kind']=='empty'
 for z in arg.get('points',[]):near(y*z-fvalue(m,z),star,'argmax witness')
 check_dual(s['dual'])

from pathlib import Path
import sys,json,subprocess,shutil,hashlib,re,copy,xml.etree.ElementTree as ET
PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
if len(sys.argv)>1:
 root=Path(sys.argv[1]);staging=True;js=root/'fenchel-duality171.js';fixture=root/'fenchel-snapshot171.json'
else:
 root=Path(__file__).resolve().parents[1];staging=False;js=root/'course-shared/labs/fenchel-duality.js';fixture=root/'course-shared/projects/fenchel-certificates/run-snapshot.json'
code=r'''const a=require(process.argv[1]),fs=require('fs'),f=JSON.parse(fs.readFileSync(process.argv[2],'utf8')),d={live:[],dual:[],presets:[],views:[],invalid:0,feedback:[],self:a.selfTest()};
for(const model of a.MODELS)for(const x of[-3,-1,0,.5,1,3])for(const y of[-2,-1,0,.5,1,3])d.live.push(a.snapshot({model,x,y}));
for(const av of[-3,-1,-.25,0,.25,1,3])for(const b of[-3,0,2])for(const lambda of[0,.5,3])d.dual.push(a.snapshot({a:av,b,lambda,x:1,y:1}).dual);
for(const p of a.PRESETS){const s=a.snapshot(p.config);d.presets.push(s);d.views.push({data:s,plots:a.plots(s),tables:a.tables(s),svg:a.plots(s).map(p=>a.svg(p))});}
function bad(v){let rejected=false;try{a.config(v)}catch(e){rejected=true}if(!rejected)throw Error('invalid accepted:'+JSON.stringify(v));d.invalid++;}
for(const v of[null,[],true,'x',{extra:1},{model:'bad'},{model:['quadratic']},{model:null}])bad(v);
for(const key of['x','y','a','b','lambda'])for(const value of[NaN,Infinity,-Infinity,null,[],true,'1'])bad({[key]:value});
for(const v of[{x:-4.1},{x:4.1},{y:-4.1},{y:4.1},{y:.0001},{a:.01},{a:4},{b:4},{lambda:-.1},{lambda:4}])bad(v);
for(let i=0;i<4;i++)for(let j=0;j<2;j++)d.feedback.push({i,j,...a.feedback(i,j)});
d.replay=f.records.map(r=>a.snapshot(r.data.parameters));console.log(JSON.stringify(d));'''
d=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True));f=json.loads(fixture.read_text());assert hashlib.sha256(js.read_bytes()).hexdigest()==f['provenance']['sourceSha256'];assert d['self']=={'checks':22,'models':7}
for s in d['live']+d['presets']+[r['data']for r in f['records']]:check_snapshot(s)
for s in d['dual']:check_dual(s)
def rec(a,b):
 if isinstance(b,dict):assert a.keys()==b.keys();[rec(a[k],v)for k,v in b.items()]
 elif isinstance(b,(list,tuple)):assert len(a)==len(b);[rec(x,y)for x,y in zip(a,b)]
 elif isinstance(b,(int,float))and not isinstance(b,bool):near(a,b,'replay')
 else:assert a==b,(a,b)
for a,b in zip(d['replay'],f['records']):rec(a,b['data'])
coords=0;rows=0
def finite_rows(a):return [[x,decode(y)]for x,y in a if isinstance(x,(int,float))and math.isfinite(x)and isinstance(decode(y),(int,float))and math.isfinite(decode(y))]
for v in d['views']:
 s=v['data'];c=s['current'];dr=s['dual'];domain=s['parameters']['model']in ['closedInterval','openInterval'];curve=s['curves']
 function=[[0,0],[1,0]]if domain else finite_rows([[r['x'],r['f']]for r in curve]);env=[[0,0],[1,0]]if domain else finite_rows([[r['x'],r['biconjugate']]for r in curve]);support=finite_rows([[r['x'],r['support']]for r in curve]);gap=[]
 if math.isfinite(decode(c['f']))and math.isfinite(decode(c['supportAtX'])):gap=[[s['parameters']['x'],c['f']],[s['parameters']['x'],c['supportAtX']]]
 expected=[[function,support,gap],[env],[finite_rows([[r['y'],r['value']]for r in s['slopes']])],[[[r['x'],r['value']]for r in dr['primalScan']],[[dr['current']['x'],dr['current']['primal']]],[[dr['optimal']['x'],dr['optimal']['primal']]]],[finite_rows([[r['y'],r['value']]for r in dr['dualScan']]),finite_rows([[dr['current']['y'],dr['current']['dual']]]),[[dr['optimal']['y'],dr['optimal']['dual']]]]]
 assert len(v['plots'])==5 and len(v['tables'])==9
 for p,series,svg in zip(v['plots'],expected,v['svg']):
  series=[a for a in series if a];assert len(p['series'])==len(series);tree=ET.fromstring(svg);paths=tree.findall('{*}path');assert len(paths)==len(series)
  for ser,points,path in zip(p['series'],series,paths):
   rec(ser['points'],points);assert p['xMax']>p['xMin']and p['yMax']>p['yMin'];xy=[]
   for x,y in points:
    assert p['xMin']-1e-12<=x<=p['xMax']+1e-12 and p['yMin']-1e-12<=y<=p['yMax']+1e-12
    xy.extend([100+(x-p['xMin'])/(p['xMax']-p['xMin'])*755,385-(y-p['yMin'])/(p['yMax']-p['yMin'])*290])
   actual=list(map(float,re.findall(r'-?\d+(?:\.\d+)?',path.attrib['d'])));assert len(actual)==len(xy)
   for x,y in zip(actual,xy):assert abs(x-y)<=6e-7;coords+=1
  if p['key']=='support'and domain:
   first=p['series'][0];assert first['boundaryMarkers']and first['open']==(s['parameters']['model']=='openInterval')
 ts={t['key']:t for t in v['tables']}
 for key,expect in [('curves',[[r[k]for k in ['x','f','support','biconjugate']]for r in curve]),('slopes',[[r[k]for k in ['y','value','finite','attained']]for r in s['slopes']]),('brackets',[[r[k]for k in ['step','lo','hi','mid','residual']]for r in c['brackets']]),('primalScan',[[r['x'],r['value']]for r in dr['primalScan']]),('dualScan',[[r['y'],r['value'],r['feasible']]for r in dr['dualScan']])]:rec(ts[key]['rows'],expect);rows+=len(expect)
 rec([r[1]for r in ts['dualcurrent']['rows']],list(dr['current'].values()));rec([r[1]for r in ts['optimal']['rows'][1:]],list(dr['optimal'].values()))
 # Numerical summary entries preserve exact raw values; argmax gets a human-readable explanation.
 pairs=[(k,value)for k,value in c.items()if k!='brackets'];assert len(ts['current']['rows'])==len(pairs)
 for row,(key,value)in zip(ts['current']['rows'],pairs):
  if key=='argmax':assert isinstance(row[1],str)and len(row[1])>2
  else:rec(row[1],value)
for q in d['feedback']:assert q['correct']==(q['j']==[0,1,0,1][q['i']])and len(q['text'])>30 and 'undefined'not in q['text']
mutations=0
for change in ['star','gap','feasible','curve','null']:
 s=copy.deepcopy(d['presets'][0])
 if change in ['star','gap']:s['current'][change]+=.5
 elif change=='feasible':s['dual']['current']['dualFeasible']=False
 elif change=='curve':s['curves'][0]['f']=0
 else:s['current']['star']=None
 try:check_snapshot(s)
 except(AssertionError,TypeError):mutations+=1
 else:raise AssertionError('undetected mutation '+change)
if not staging:
 # Physics copies only labs referenced by its own lectures; this lab is math-only.
 for course in ['ai-course','grad-math','math-course']:assert(root/course/'site/assets/learning/labs/fenchel-duality.js').read_bytes()==js.read_bytes()
 assert(root/'grad-math/site/assets/learning/projects/fenchel-certificates/run-snapshot.json').read_bytes()==fixture.read_bytes()
 assert(root/'grad-math/images/cvx-01-fenchel-ledgers.svg').read_bytes()==(root/'grad-math/site/assets/img/cvx-01-fenchel-ledgers.svg').read_bytes()
 raw=(root/'grad-math/lectures/cvx-01-conjugate.md').read_text();assert len(re.findall(r'^## \d+\.',raw,re.M))==12 and raw.count('<details class="answer"')==8 and raw.count('$$')==38
 page=(root/'grad-math/site/cvx-01-conjugate.html').read_text();assert 'data-learning-lab="fenchel-duality"'in page and 'assets/learning/labs/fenchel-duality.js'in page and 'assets/learning/projects/fenchel-certificates/run-snapshot.json'in page
 assert(root/'.github/workflows/course-audit.yml').read_text().count('python tools/check_fenchel_full.py')==1
print(json.dumps({'status':'PASS','support':len(d['live']),'dual':len(d['dual']),'presets':len(d['presets']),'frozen':len(f['records']),'checks':CHECKS,'plotCoordinates':coords,'ledgerRows':rows,'invalid':d['invalid'],'feedback':len(d['feedback']),'mutations':mutations,'self':22}))
