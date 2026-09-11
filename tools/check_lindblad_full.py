"""Full independent scientific and publication checks for the open-qubit course."""
import math,cmath
checks=0
def ck(ok,label):
 global checks
 assert ok,label;checks+=1
def near(a,b,label,tol=3e-11):
 global checks
 if isinstance(a,(list,tuple)):
  ck(len(a)==len(b),label+' length')
  for x,y in zip(a,b):near(x,y,label,tol)
 else:ck(abs(a-b)<=tol*max(1,abs(b)),(label,a,b))
def matrix(n):return [[0j]*n for _ in range(n)]
def eye(n):return [[complex(i==j)for j in range(n)]for i in range(n)]
def add(a,b):return [[x+y for x,y in zip(r,s)]for r,s in zip(a,b)]
def scale(a,s):return [[x*s for x in r]for r in a]
def mm(a,b):return [[sum(a[i][k]*b[k][j]for k in range(len(b)))for j in range(len(b[0]))]for i in range(len(a))]
def adj(a):return [[a[j][i].conjugate()for j in range(len(a))]for i in range(len(a[0]))]
def flat(a):return [x for r in a for x in r]
def magnitude(a):return max(map(abs,flat(a)))
def cm(a):return [[complex(*x)for x in r]for r in a]
def expm(a):
 n=len(a);norm=max(sum(map(abs,r))for r in a);s=max(0,math.ceil(math.log2(norm/.5)))if norm else 0;a=scale(a,2**-s);term=eye(n);out=eye(n)
 for k in range(1,35):
  term=scale(mm(term,a),1/k);out=add(out,term)
  if magnitude(term)<2e-18:break
 for _ in range(s):out=mm(out,out)
 return out
def eigvals(h):
 # Real embedding of a complex Hermitian matrix; eigenvalues occur twice.
 n=len(h);a=[[h[i%n][j%n].real if (i<n)==(j<n) else (-1 if i<n else 1)*h[i%n][j%n].imag for j in range(2*n)]for i in range(2*n)];N=2*n
 for _ in range(800):
  p,q=max(((i,j)for i in range(N)for j in range(i+1,N)),key=lambda ij:abs(a[ij[0]][ij[1]]))
  if abs(a[p][q])<2e-16:break
  theta=.5*math.atan2(2*a[p][q],a[q][q]-a[p][p]);c=math.cos(theta);s=math.sin(theta);app=a[p][p];aqq=a[q][q];apq=a[p][q]
  for k in range(N):
   if k not in (p,q):v=a[k][p];w=a[k][q];a[k][p]=a[p][k]=c*v-s*w;a[k][q]=a[q][k]=s*v+c*w
  a[p][p]=c*c*app-2*c*s*apq+s*s*aqq;a[q][q]=s*s*app+2*c*s*apq+c*c*aqq;a[p][q]=a[q][p]=0
 else:raise AssertionError('Jacobi convergence')
 ev=sorted(a[i][i]for i in range(N));return [(ev[i]+ev[i+1])/2 for i in range(0,N,2)]
def rho(v):return [[(1+v['z'])/2,complex(v['x'],-v['y'])/2],[complex(v['x'],v['y'])/2,(1-v['z'])/2]]
def validate(s):
 c=s['parameters'];channel=c['channel'];g=1/c['T1']if channel in ('amplitude','combined','thermal')else 0;q=c['q']if channel=='thermal'else 0;phi=1/c['Tphi']if channel in ('dephasing','combined','thermal')else 0;omega=c['omega']if channel in ('unitary','combined','thermal')else 0
 initial={'tilted':{'x':.8,'y':.4,'z':math.sqrt(.2)},'excited':{'x':0,'y':0,'z':-1},'ground':{'x':0,'y':0,'z':1},'plus':{'x':1,'y':0,'z':0},'mixed':{'x':0,'y':0,'z':0}}[c['initial']];ck(s['initial']==initial,'initial');r0=rho(initial);H=[[omega/2,0],[0,-omega/2]];Ls=[[[0,math.sqrt(g*(1-q))],[0,0]],[[0,0],[math.sqrt(g*q),0]],[[math.sqrt(phi/2),0],[0,-math.sqrt(phi/2)]]]
 def rhs(a):
  result=scale(add(mm(H,a),scale(mm(a,H),-1)),-1j)
  for L in Ls:
   ld=adj(L);ldl=mm(ld,L);result=add(result,add(mm(mm(L,a),ld),scale(add(mm(ldl,a),mm(a,ldl)),-.5)))
  return result
 basis=[]
 for i in range(4):b=matrix(2);b[i//2][i%2]=1;basis.append(b)
 columns=[flat(rhs(b))for b in basis];G=[[columns[j][i]for j in range(4)]for i in range(4)];prop=expm(scale(G,c['time']))
 def apply(p,a):v=mm(p,[[x]for x in flat(a)]);return [[v[2*i+j][0]for j in range(2)]for i in range(2)]
 expected=apply(prop,r0);near(cm(s['rho0']),r0,'rho0');near(cm(s['rho']),expected,'rho');near(cm(s['krausRho']),expected,'kraus rho');near(rho(s['vector']),expected,'Bloch rho')
 completeness=matrix(2);krausRho=matrix(2);choi=matrix(4)
 for k,term in zip(s['channel']['kraus'],s['krausTerms']):
  K=cm(k['matrix']);kt=mm(mm(K,r0),adj(K));near(cm(term),kt,'individual Kraus term');completeness=add(completeness,mm(adj(K),K));krausRho=add(krausRho,kt)
  for i in range(2):
   for a in range(2):
    for j in range(2):
     for b in range(2):choi[2*i+a][2*j+b]+=K[a][i]*K[b][j].conjugate()/2
 near(completeness,eye(2),'completeness');near(cm(s['channel']['completeness']),completeness,'stored completeness');near(krausRho,expected,'all Kraus action')
 independent=matrix(4)
 for i in range(2):
  for j in range(2):
   B=matrix(2);B[i][j]=1;v=apply(prop,B)
   for a in range(2):
    for b in range(2):independent[2*i+a][2*j+b]=v[a][b]/2
 near(choi,independent,'Choi from matrix units');near(cm(s['channel']['choi']),independent,'stored Choi');near(cm(s['channel']['choiClosed']),independent,'closed Choi');ev=eigvals(independent);near(s['channel']['choiEigenvalues'],ev,'Choi spectrum');ck(min(ev)>=-3e-11,'CP')
 for key in ('completenessResidual','choiResidual'):near(cm(s['channel'][key]),matrix(2 if key=='completenessResidual'else 4),key)
 near(cm(s['krausResidual']),matrix(2),'kraus residual');half=apply(expm(scale(G,c['time']/2)),r0);near(rho(s['semigroup']['half']),half,'half');near(rho(s['semigroup']['twice']),expected,'twice');near(list(s['semigroup']['residual'].values()),[0]*3,'semigroup residual')
 expectedRates={'gamma1':g,'gammaPhi':phi,'gamma2':g/2+phi,'down':g*(1-q),'up':g*q,'q':q,'zEq':1-2*q,'omega':omega}
 for k,v in expectedRates.items():near(s['channel']['rates'][k],v,'rate '+k)
 dt=c['time']/128;step=expm(scale(G,dt));state=r0
 ck(len(s['nodes'])==(1 if c['time']==0 else 129),'node count')
 rows=s['nodes']+[{'time':c['time'],'vector':s['vector'],'diagnostics':s['diagnostics']}]
 for i,n in enumerate(rows):
  if i==len(s['nodes']):state=expected
  near(n['time'],c['time'] if i==len(s['nodes'])else i*dt,'time');near(rho(n['vector']),state,'node rho');d=n['diagnostics'];ev=eigvals(state);near(d['eigenvalues'],ev,'rho spectrum');near(d['minEigenvalue'],ev[0],'min eigenvalue');near(d['population'],state[1][1].real,'p1');near(d['energy'],state[1][1].real,'energy');near(d['coherence'],2*abs(state[0][1]),'C');near(d['rho01Abs'],abs(state[0][1]),'abs rho01');near(d['purity'],sum(mm(state,state)[j][j]for j in range(2)).real,'P');near(d['trace'],sum(state[j][j]for j in range(2)).real,'trace');near(d['radius'],ev[1]-ev[0],'radius');near(d['entropy'],-sum(v*math.log2(v)for v in ev if v>0),'entropy',5e-10)
  for k,v in {'rho00':state[0][0].real,'rho11':state[1][1].real,'rho01Real':state[0][1].real,'rho01Imag':state[0][1].imag}.items():near(d['density'][k],v,'density '+k)
  state=apply(step,state)
 near(s['diagnostics']['purity'],s['nodes'][-1]['diagnostics']['purity'],'last node')

from pathlib import Path
import sys,json,subprocess,shutil,hashlib,tempfile,copy,re,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1];STAGING='--staging'in sys.argv;PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=ROOT/('work/lindblad-qubit169.js'if STAGING else'course-shared/labs/lindblad-qubit.js');FIXTURE=ROOT/('work/lindblad-snapshot169-v2.json'if STAGING else'course-shared/projects/lindblad-qubit/run-snapshot.json');LECTURE=ROOT/('work/lindblad169-complete.md'if STAGING else'physics-course/lectures/oqs-01-decoherence.md')
export=r'''
const a=require(process.argv[1]);let invalid=0;function rejects(fn){let failed=false;try{fn()}catch(e){failed=true;}if(!failed)throw Error('Invalid input accepted');invalid++;}
for(const v of [null,[],0,false,''])rejects(()=>a.normalizeConfig(v));
for(const key of ['time','omega','T1','Tphi','q'])for(const v of [null,false,'1',[],{},NaN,Infinity,-Infinity])rejects(()=>a.normalizeConfig({[key]:v}));
for(const [k,v]of [['time',-1],['time',1000001],['omega',4.1],['omega',-4.1],['T1',0],['T1',8.1],['Tphi',.1],['q',-.1],['q',.51],['channel','oops'],['initial',['tilted']],['initial',null],['initial',new String('tilted')],['extra',1]])rejects(()=>a.normalizeConfig({[k]:v}));
for(const v of [{x:1,y:1,z:0},{x:'0',y:0,z:0},{x:0,y:0},{x:0,y:0,z:0,w:1}])rejects(()=>a.evolve('unitary',1,1,2,1.5,v));
rejects(()=>a.predictionFeedback('oops',true,{}));rejects(()=>a.predictionFeedback('purity','true',{}));
const records=[];for(const channel of a.CHANNELS)for(const initial of Object.keys(a.INITIALS))for(const time of [0,1e-8,.3,2,10,100])records.push(a.snapshot({channel:channel.key,initial,time}));
for(const q of [0,.1,.5])for(const T1 of [.2,8])for(const Tphi of [.2,8])records.push(a.snapshot({channel:'thermal',initial:'plus',q,T1,Tphi,omega:-4,time:.7}));
const presets=a.PRESETS.map(p=>{const s=a.snapshot(p.config);return{key:p.key,data:s,plots:a.plots(s),svgs:a.plots(s).map(a.svg),tables:a.tables(s),feedback:['population','coherence','purity','energy'].flatMap(m=>[true,false].map(v=>({metric:m,choice:v,...a.predictionFeedback(m,v,p.config)})))};});
console.log(JSON.stringify({records,presets,invalid,self:a.numericSelfChecks()}));
'''
bundle=json.loads(subprocess.check_output(PREFIX+['node','-e',export,str(JS)],text=True));ck(bundle['invalid']==65,'invalid inputs');ck(bundle['self']['ok']and bundle['self']['total']==100,'self checks')
for s in bundle['records']:validate(s)
fixed=json.loads(FIXTURE.read_text());ck(fixed['provenance']['sourceSha256']==hashlib.sha256(JS.read_bytes()).hexdigest(),'fixture source hash');ck(len(fixed['records'])==4,'frozen records')
for r in fixed['records']:validate(r['data'])
viewChecks=0
for p in bundle['presets']:
 s=p['data'];validate(s);ck(len(p['plots'])==3 and len(p['tables'])==9,'views')
 for pl,svgtext in zip(p['plots'],p['svgs']):
  n=s['nodes'];expected=[]
  if pl['key']=='population':expected=[[[r['time'],r['diagnostics'][k]]for r in n]for k in ['population','coherence','purity']]
  elif pl['key']=='spectrum':expected=[[[r['time'],r['diagnostics']['eigenvalues'][i]]for r in n]for i in [0,1]]+[[[r['time'],r['diagnostics']['entropy']]for r in n]]
  else:expected=[[[math.cos(2*math.pi*i/128),math.sin(2*math.pi*i/128)]for i in range(129)],[[r['vector']['x'],r['vector']['y']]for r in n]]
  ck(len(pl['series'])==len(expected),'series count');tree=ET.fromstring(svgtext);paths=tree.findall('{*}path');circles=tree.findall('{*}circle');ck(len(paths)==len(expected)and len(circles)==len(expected),'SVG objects');left,right=(325,615)if pl['key']=='bloch'else(100,855)
  for i,(series,ex)in enumerate(zip(pl['series'],expected)):
   near(series['points'],ex,'plot source');coords=[float(v)for v in re.findall(r'-?\d+(?:\.\d+)?',paths[i].get('d'))];points=[(left+(x-pl['xMin'])/(pl['xMax']-pl['xMin'])*(right-left),385-(y-pl['yMin'])/(pl['yMax']-pl['yMin'])*290)for x,y in ex];near(coords,[v for pair in points for v in pair],'SVG path',1e-6);near([float(circles[i].get(k))for k in ['cx','cy']],points[-1],'SVG endpoint');viewChecks+=len(coords)
 for f in p['feedback']:
  d0={'population':(1-s['initial']['z'])/2,'energy':(1-s['initial']['z'])/2,'coherence':math.hypot(s['initial']['x'],s['initial']['y']),'purity':(1+sum(v*v for v in s['initial'].values()))/2}[f['metric']];changed=abs(s['diagnostics'][f['metric']]-d0)>1e-8;ck(f['changed']==changed and f['correct']==(f['choice']==changed),'feedback truth');near(f['before'],d0,'feedback before');near(f['after'],s['diagnostics'][f['metric']],'feedback after');ck(len(f['text'])>80 and not re.search('undefined|NaN',f['text']),'feedback explanation')
 # Every table's numeric meaning is checked through the independently validated record.
 table={t['key']:t for t in p['tables']};ck(set(table)=={'summary','rates','states','rho','kraus','completeness','choi','choi-spectrum','semigroup'},'table keys')
 near([r[1]for r in table['summary']['rows']],[s['vector'][k]for k in ['x','y','z']]+[s['diagnostics'][k]for k in ['population','coherence','purity','minEigenvalue','entropy','trace']],'summary table')
 near(table['states']['rows'],[[n['time'],*[n['vector'][k]for k in ['x','y','z']],*[n['diagnostics'][k]for k in ['population','coherence','purity','minEigenvalue','entropy']]]for n in s['nodes']],'states table');near([r[1]for r in table['choi-spectrum']['rows']],s['channel']['choiEigenvalues'],'Choi table');ck(len(table['kraus']['rows'])==32,'Kraus rows');ck(len(table['choi']['rows'])==16,'Choi rows')
 def parsed(v):
  number=r'(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)';m=re.fullmatch(number+r' ([+−]) '+number+r'i',v);ck(m is not None,'complex text syntax');return complex(float(m[1]),float(m[3])*(1 if m[2]=='+'else-1))
 for row in table['rho']['rows']:
  i,j=row[:2]
  for value,key in zip(row[2:],['rho','krausRho','krausResidual']):near(parsed(value),complex(*s[key][i][j]),'rho table value',2e-6)
 for row in table['kraus']['rows']:
  phase,damping,i,j,value=row;K=next(k['matrix']for k in s['channel']['kraus']if k['phase']==phase and k['damping']==damping);near(parsed(value),complex(*K[i][j]),'Kraus table value',2e-6)
 for key,fields in [('completeness',['completeness','completenessResidual']),('choi',['choi','choiClosed','choiResidual'])]:
  for row in table[key]['rows']:
   i,j=row[:2]
   for value,field in zip(row[2:],fields):near(parsed(value),complex(*s['channel'][field][i][j]),key+' table value',2e-6)
 for key,value in table['rates']['rows']:near(value,s['channel']['rates'][key],'rates table')
 for key,v,twice,residual in table['semigroup']['rows']:near([v,twice,residual],[s['vector'][key],s['semigroup']['twice'][key],s['semigroup']['residual'][key]],'semigroup table')
 # Fixed records must still represent the same configurations under the frozen code.
for record in fixed['records']:
 same=next(p['data']for p in bundle['presets']if p['key']==record['key']);ck(same==record['data'],'fixed data replay')
mutations=0
for field in ['rho','current','node','choi','term']:
 s=copy.deepcopy(bundle['records'][3])
 if field=='rho':s['rho'][0][0][0]+=.1
 elif field=='current':s['diagnostics']['population']+=.1
 elif field=='node':s['nodes'][30]['diagnostics']['purity']+=.1
 elif field=='choi':s['channel']['choi'][0][0][0]+=.1
 else:s['krausTerms'][0][0][0][0]+=.1
 try:validate(s)
 except AssertionError:mutations+=1
 else:raise AssertionError('Oracle accepted mutation '+field)
lecture=LECTURE.read_text();ck(len(re.findall(r'^## \d+\.',lecture,re.M))==12,'12 sections');ck(lecture.count('<details class="answer"')==6,'6 worked answers');ck(len(re.findall(r'\$\$(.*?)\$\$',lecture,re.S))==18,'18 formulas');ck(lecture.count('class="learning-layer"')==1,'one learning layer');ck('<!-- LINDBLAD169_STATIC -->'not in lecture,'static content inserted')
builder=ROOT/('work/build_lindblad169_figure.py'if STAGING else'tools/build_lindblad_figure.py');canonical=ROOT/('work/oqs-01-lindblad-ledgers.svg'if STAGING else'physics-course/images/oqs-01-lindblad-ledgers.svg')
with tempfile.TemporaryDirectory()as td:
 target=Path(td)/'figure.svg';fallback=Path(td)/'fallback.md';subprocess.run(PREFIX+['python3',str(builder),str(JS),str(FIXTURE),str(target),str(fallback)],check=True,stdout=subprocess.DEVNULL);ck(target.read_bytes()==canonical.read_bytes(),'SVG replay');ck(fallback.read_text().strip()in lecture,'fallback replay')
if not STAGING:
 for course in ['ai-course','grad-math','math-course','physics-course']:ck((ROOT/course/'site/assets/learning/labs/lindblad-qubit.js').read_bytes()==JS.read_bytes(),'JS mirror')
 ck((ROOT/'physics-course/site/assets/learning/projects/lindblad-qubit/run-snapshot.json').read_bytes()==FIXTURE.read_bytes(),'fixture mirror');ck((ROOT/'physics-course/site/assets/img/oqs-01-lindblad-ledgers.svg').read_bytes()==canonical.read_bytes(),'SVG mirror');ck((ROOT/'.github/workflows/course-audit.yml').read_text().count('python tools/check_lindblad_full.py')==1,'CI wiring')
print(json.dumps({'status':'PASS','live':len(bundle['records']),'presets':len(bundle['presets']),'frozen':len(fixed['records']),'checks':checks,'plotCoordinates':viewChecks,'invalid':bundle['invalid'],'feedback':80,'mutations':mutations,'self':100}))
