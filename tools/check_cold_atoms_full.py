"""Independent stdlib moment ledger and state checks. No production imports."""
import math,cmath
CHECKS=0
def near(a,b,label,tol=3e-11):
 global CHECKS
 assert isinstance(a,(int,float)) and not isinstance(a,bool) and math.isfinite(a),(label,a)
 assert abs(a-b)<=tol*max(1,abs(b)),(label,a,b)
 CHECKS+=1
def photons(delta,s,u):
 dirs=(1,-1,0,0,0,0);rates=[s*.5/(1+4*(delta-v*u)**2)for v in dirs]
 return rates,sum(v*r for v,r in zip(dirs,rates)),sum(v*v*r for v,r in zip(dirs,rates))*.5,sum(rates)/6
def oracle_coeff(c):
 _,derivative,_,_=photons(c['delta'],c['saturation'],1e-20j)
 A=-derivative.imag/1e-20;rates,force,d1,d2=photons(c['delta'],c['saturation'],0)
 return A,d1+d2
def check_cooling(r):
 c=r['parameters'];A,d0=oracle_coeff(c);eps=c['recoil'];D=eps*d0;co=r['coefficients']
 assert r['version']==170
 for k,v in [('friction',A),('diffusion0',d0),('scaledDiffusion',D),('recoilTemperature',eps/2)]:near(co[k],v,k)
 if A>0:near(co['equilibriumTemperature'],d0/A,'equilibrium')
 else:assert co['equilibriumTemperature']is None
 assert co['status']==('light-off'if c['saturation']==0 else 'cooling'if A>0 else 'anti-damping'if A<0 else 'diffusion-only')
 assert len(r['forces'])==257 and len(r['nodes'])==(1 if c['time']==0 else 129) and len(r['density'])==257
 for i,row in enumerate(r['forces']):near(row['u'],-2+i/64,'force grid');near(row['linearForce'],-A*row['u'],'tangent')
 for row in r['forces']+[r['selected']]:
  rates,f,da,de=photons(c['delta'],c['saturation'],row['u'])
  for k,v in [('plus',rates[0]),('minus',rates[1]),('transverse',rates[2]),('total',sum(rates)),('force',f),('diffusionAbsorption',da),('diffusionEmission',de),('diffusion',da+de)]:near(row[k],v,k)
 near(r['selected']['u'],c['velocity'],'selected u')
 # Exact integrating factor, independently deriving Gaussian moments.
 for i,row in enumerate(r['nodes']+[r['current']]):
  t=c['time'] if i==len(r['nodes']) else c['time']*i/128
  e=math.exp(-A*t);mu=c['mean']*e;noise=2*D*t if A==0 else D*(-math.expm1(-2*A*t))/A;v=eps*c['temperature']*e*e+noise;sig=math.sqrt(v);span=(abs(mu)+3*sig)/(math.sqrt(1+4*c['delta']**2)/2)
  for k,w in [('time',t),('attenuation',e),('varianceInitial',eps*c['temperature']),('noiseVariance',noise),('variance',v),('mean',mu),('sigma',sig),('temperature',v/eps),('kineticTemperatureIncludingDrift',(v+mu*mu)/eps),('lineWidthScale',math.sqrt(1+4*c['delta']**2)/2),('spanRatio',span)]:near(row[k],w,k)
 # Numerical RK4 integration independently checks the endpoint without an exponential formula.
 y=[c['mean'],eps*c['temperature']];steps=1024;dt=c['time']/steps
 def rhs(y):return[-A*y[0],-2*A*y[1]+2*D]
 for _ in range(steps):
  k1=rhs(y);k2=rhs([y[j]+dt*k1[j]/2 for j in range(2)]);k3=rhs([y[j]+dt*k2[j]/2 for j in range(2)]);k4=rhs([y[j]+dt*k3[j]for j in range(2)]);y=[y[j]+dt*(k1[j]+2*k2[j]+2*k3[j]+k4[j])/6 for j in range(2)]
 near(r['current']['mean'],y[0],'RK4 mean',1e-7);near(r['current']['variance'],y[1],'RK4 variance',1e-7)
 last=r['current'];integ=0
 for i,row in enumerate(r['density']):
  z=-4+i/32;u=last['mean']+last['sigma']*z;pdf=math.exp(-z*z/2)/(math.sqrt(2*math.pi)*last['sigma'])
  near(row['z'],z,'density z');near(row['u'],u,'density u');near(row['pdf'],pdf,'density pdf')
  if i:prev=r['density'][i-1];integ+=(row['u']-prev['u'])*(row['pdf']+prev['pdf'])/2
 near(r['densityIntegral'],integ,'integral');near(integ,math.erf(4/math.sqrt(2)),'finite window',1e-7)
 scan=r['detuningScan'];assert any(row['delta']==-.5 for row in scan)
 assert all(scan[i]['delta']<scan[i+1]['delta']for i in range(len(scan)-1))
 for row in scan:
  ac,dc=oracle_coeff({**c,'delta':row['delta']});near(row['friction'],ac,'scan A');near(row['diffusion0'],dc,'scan D')
  if ac>0:near(row['equilibriumTemperature'],dc/ac,'scan T')
  else:assert row['equilibriumTemperature']is None
 near(r['validity']['weakTotalSaturation'],6*c['saturation'],'6s');near(r['validity']['spanRatio'],last['spanRatio'],'span');near(r['validity']['recoilTemperature'],eps/2,'recoil');near(r['validity']['temperatureToRecoil'],last['temperature']/(eps/2),'recoil ratio')
def exp_wave(c,t):
 # Taylor action of the 2x2 complex Hamiltonian; subdivision controls convergence.
 steps=max(1,math.ceil(math.hypot(c['omega'],c['delta'])*t));h=t/steps;v=[1+0j,0j]
 for _ in range(steps):
  total=v[:];term=v[:]
  for n in range(1,24):
   term=[(-1j*h/(2*n))*(c['delta']*term[0]+c['omega']*term[1]),(-1j*h/(2*n))*(c['omega']*term[0]-c['delta']*term[1])]
   total=[total[j]+term[j]for j in range(2)]
  v=total
 return v
def check_amp(amp,v,label):
 for key,z in zip(['ground','excited'],v):near(amp[key][0],z.real,label+' real');near(amp[key][1],z.imag,label+' imag')
 near(amp['norm'],1,'norm')
def check_rabi(r):
 c=r['result']['params'];v=exp_wave(c,c['t']);assert r['version']==170;check_amp(r['amplitudes'],v,'current');near(r['result']['probability'],abs(v[1])**2,'Pe');E=math.hypot(c['omega'],c['delta']);near(r['result']['effectiveOmega'],E,'E');near(r['result']['amplitude'],c['omega']**2/E**2 if E else 0,'ceiling')
 for i in range(2):
  for j in range(2):z=v[i]*v[j].conjugate();near(r['density'][i][j][0],z.real,'rho real');near(r['density'][i][j][1],z.imag,'rho imag')
 assert len(r['nodes'])==121
 for n,curve in zip(r['nodes'],r['result']['curve']):
  v=exp_wave(c,n['t']);check_amp(n['amplitudes'],v,'curve');near(n['probability'],abs(v[1])**2,'curve Pe');near(curve['t'],n['t'],'t');near(curve['probability'],n['probability'],'curve record')
 for n in r['comparisons']:
  c=n['parameters'];v=exp_wave(c,c['t']);near(n['probability'],abs(v[1])**2,'comparison');check_amp(n['amplitudes'],v,'comparison')

from pathlib import Path
import subprocess,json,sys,hashlib,shutil,re,xml.etree.ElementTree as ET,copy
PREFIX=['rtk','proxy'] if shutil.which('rtk') else []
if len(sys.argv)>1:
 root=Path(sys.argv[1]);staging=True;cjs=root/'doppler-cooling170.js';rjs=root/'rabi-control170.js';fixture=root/'cold-atoms-snapshot170.json'
else:
 root=Path(__file__).resolve().parents[1];staging=False;cjs=root/'course-shared/labs/doppler-cooling.js';rjs=root/'course-shared/labs/rabi-control.js';fixture=root/'course-shared/projects/cold-atoms/run-snapshot.json'
code=r'''const c=require(process.argv[1]),r=require(process.argv[2]),fs=require('fs'),f=JSON.parse(fs.readFileSync(process.argv[3],'utf8')),out={cooling:[],rabi:[],presets:[],views:[],invalid:0,feedback:[],self:r.selfTest()};
for(const delta of [-2,-.5,-.05,0,.5,2])for(const saturation of [0,.001,.01,.02])for(const time of [0,10,200])out.cooling.push(c.snapshot({delta,saturation,time}));
for(const omega of [0,.01,1,3])for(const delta of [-3,0,1,3])for(const t of [0,Math.PI,2*Math.PI,4*Math.PI])out.rabi.push(r.buildRecord({omega,delta,t}));
for(const p of c.PRESETS){const s=c.snapshot(p.config);out.presets.push(s);out.views.push({data:s,plots:c.plots(s),svg:c.plots(s).map(p=>c.svg(p)),tables:c.tables(s)});}
function bad(fn,v){let rejected=false;try{fn(v)}catch(e){rejected=true}if(!rejected)throw Error('invalid input accepted: '+JSON.stringify(v));out.invalid++;}
for(const[fn,defs]of[[c.config,c.DEFAULTS],[r.normalizeParams,r.DEFAULTS]]){for(const v of[null,[],true,'x'])bad(fn,v);for(const k of Object.keys(defs))for(const v of[NaN,Infinity,-Infinity,null,'1',[],true])bad(fn,{[k]:v});bad(fn,{unknown:1});}
for(const v of[{delta:2.1},{delta:.001},{saturation:.03},{saturation:.0001},{recoil:0},{time:-1},{time:401},{mean:.3},{temperature:0},{velocity:3}])bad(c.config,v);
for(const v of[{omega:-1},{omega:4},{delta:-4},{t:-1},{t:13}])bad(r.normalizeParams,v);
for(let i=0;i<4;i++)for(let j=0;j<2;j++)out.feedback.push({kind:'cooling',i,j,result:c.feedback(i,j)});
for(const q of r.QUESTIONS)for(const choice of q.choices)out.feedback.push({kind:'rabi',key:q.key,choice:choice[0],result:r.questionFeedback(q.key,choice[0])});
out.replay={cooling:f.cooling.map(v=>c.snapshot(v.data.parameters)),rabi:f.rabi.map(v=>r.buildRecord(v.data.result.params))};console.log(JSON.stringify(out));'''
d=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(cjs.resolve()),str(rjs.resolve()),str(fixture.resolve())],text=True));f=json.loads(fixture.read_text());assert d['self']['checks']==22
for name,p in [('doppler-cooling',cjs),('rabi-control',rjs)]:assert hashlib.sha256(p.read_bytes()).hexdigest()==f['provenance']['sources'][name]
for r in d['cooling']+d['presets']+[v['data']for v in f['cooling']]:check_cooling(r)
for r in d['rabi']+[v['data']for v in f['rabi']]:check_rabi(r)
def recursive(a,b):
 if isinstance(b,dict):assert a.keys()==b.keys();[recursive(a[k],v)for k,v in b.items()]
 elif isinstance(b,list):assert len(a)==len(b);[recursive(x,y)for x,y in zip(a,b)]
 elif isinstance(b,(int,float))and not isinstance(b,bool):near(a,b,'replay')
 else:assert a==b
for kind in ['cooling','rabi']:
 for a,b in zip(d['replay'][kind],f[kind]):recursive(a,b['data'])
coords=0
for v in d['views']:
 s=v['data'];ps=v['plots'];ts=v['tables'];assert len(ps)==5 and len(ts)==7
 # Every tab points to the recorded scientific observable, with no omitted or synthetic nodes.
 expected=[[[(r['u'],r['force'])for r in s['forces']],[(r['u'],r['linearForce'])for r in s['forces']],[(s['selected']['u'],s['selected']['force'])]],
 [[(r['u'],r[k])for r in s['forces']]for k in ['plus','minus','diffusion']],
 [[(r['time'],r[k])for r in s['nodes']]for k in ['temperature','kineticTemperatureIncludingDrift']],
 [[(r['u'],r['pdf'])for r in s['density']]],
 [[(r['delta'],r['equilibriumTemperature'])for r in s['detuningScan']]]if s['coefficients']['equilibriumTemperature']is not None or s['parameters']['saturation']>0 else []]
 if s['coefficients']['equilibriumTemperature']is not None:expected[2].append([(0,s['coefficients']['equilibriumTemperature']),(s['parameters']['time'],s['coefficients']['equilibriumTemperature'])])
 if s['parameters']['saturation']>0:expected[4].append([(-2,.5),(max(-.05,max(r['delta']for r in s['detuningScan'])),.5)])
 for p,series,svg in zip(ps,expected,v['svg']):
  assert len(p['series'])==len(series)
  tree=ET.fromstring(svg);paths=tree.findall('{*}path');circles=tree.findall('{*}circle');assert len(paths)==len(series)==len(circles)
  for ser,exp,path,circle in zip(p['series'],series,paths,circles):
   assert len(ser['points'])==len(exp)
   xy=[]
   for actual,(x,y)in zip(ser['points'],exp):
    near(actual[0],x,'plot x');near(actual[1],y,'plot y');xy.extend([100+(x-p['xMin'])/(p['xMax']-p['xMin'])*755,385-(y-p['yMin'])/(p['yMax']-p['yMin'])*290])
   actual=list(map(float,re.findall(r'-?\d+(?:\.\d+)?',path.attrib['d'])));assert len(actual)==len(xy)
   for x,y in zip(actual,xy):near(x,y,'SVG coordinate',6e-7);coords+=1
   near(float(circle.attrib['cx']),xy[-2],'endpoint x');near(float(circle.attrib['cy']),xy[-1],'endpoint y')
 # Tables expose every numeric ledger field in the declared order.
 rowsets=[None,None,None,[[r[k]for k in ['u','plus','minus','transverse','total','force','linearForce','diffusionAbsorption','diffusionEmission','diffusion']]for r in s['forces']],[[r[k]for k in ['time','attenuation','mean','variance','noiseVariance','temperature','kineticTemperatureIncludingDrift','spanRatio']]for r in s['nodes']],[[r[k]for k in ['delta','friction','diffusion0','equilibriumTemperature']]for r in s['detuningScan']],[[r[k]for k in ['z','u','pdf']]for r in s['density']]]
 summary=[s['coefficients']['status']]+[s['current'][k]for k in ['mean','variance','temperature','kineticTemperatureIncludingDrift']]+[s['coefficients']['equilibriumTemperature'],s['current']['spanRatio'],s['validity']['temperatureToRecoil'],s['validity']['weakTotalSaturation']]
 recursive([r[1]for r in ts[0]['rows']],summary);recursive([r[1]for r in ts[1]['rows']],[s['coefficients'][k]for k in ['friction','diffusion0','scaledDiffusion','recoilTemperature']]);recursive([r[1]for r in ts[2]['rows']],[s['selected'][k]for k in ['u','plus','minus','transverse','total','force','diffusionAbsorption','diffusionEmission','diffusion']])
 for t,rows in zip(ts[3:],rowsets[3:]):recursive(t['rows'],rows)
for fb in d['feedback']:
 correct=fb['j']==[0,1,0,1][fb['i']] if fb['kind']=='cooling'else fb['choice']=={'resonant':'one','detuned':'ceiling','twoPi':'zero'}[fb['key']]
 assert fb['result']['correct']==correct and len(fb['result']['text'])>35 and 'undefined'not in fb['result']['text']
mutations=0
for key in ['friction','diffusion0','scaledDiffusion']:
 m=copy.deepcopy(d['presets'][0]);m['coefficients'][key]+=.01
 try:check_cooling(m)
 except AssertionError:mutations+=1
 else:raise AssertionError('undetected cooling mutation')
m=copy.deepcopy(d['rabi'][30]);m['amplitudes']['ground'][1]+=.1
try:check_rabi(m)
except AssertionError:mutations+=1
else:raise AssertionError('undetected amplitude mutation')
if not staging:
 for course in ['ai-course','grad-math','math-course','physics-course']:
  for name,p in [('doppler-cooling',cjs),('rabi-control',rjs)]:assert(root/course/'site/assets/learning/labs'/f'{name}.js').read_bytes()==p.read_bytes()
 assert(root/'physics-course/site/assets/learning/projects/cold-atoms/run-snapshot.json').read_bytes()==fixture.read_bytes()
 lecture=(root/'physics-course/lectures/amo-01-cold-atoms.md').read_text();assert len(re.findall(r'^## \d+\.',lecture,re.M))==12 and lecture.count('<details class="answer"')==8 and lecture.count('$$')==44
 page=(root/'physics-course/site/amo-01-cold-atoms.html').read_text()
 for lab in ['rabi-control','doppler-cooling']:assert f'data-learning-lab="{lab}"'in page and f'assets/learning/labs/{lab}.js'in page
 for name in ['doppler','rabi']:assert(root/f'physics-course/images/amo-01-{name}-ledgers.svg').read_bytes()==(root/f'physics-course/site/assets/img/amo-01-{name}-ledgers.svg').read_bytes()
 assert (root/'.github/workflows/course-audit.yml').read_text().count('python tools/check_cold_atoms_full.py')==1
print(json.dumps({'status':'PASS','cooling':len(d['cooling']),'rabi':len(d['rabi']),'presets':len(d['presets']),'frozen':7,'checks':CHECKS,'plotCoordinates':coords,'invalid':d['invalid'],'feedback':len(d['feedback']),'mutations':mutations,'self':22}))
