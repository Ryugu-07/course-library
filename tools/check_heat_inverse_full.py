"""Independent stdlib protocol, split, risk cubature, geometry and input audit."""
from pathlib import Path
import subprocess,json,math,shutil,xml.etree.ElementTree as ET
R=Path(__file__).resolve().parents[1]
prefix=['rtk','proxy']if shutil.which('rtk')else[]
code=r'''
const h=require("./course-shared/labs/heat-inverse-project.js"),all=[];
const node=(tag,attrs={},children=[])=>({tag,attrs,children:[].concat(children),append(...es){this.children.push(...es)}});
for(const t of [.5,1,1.5])for(const sigma of [0,.02,.05]){
 const b=h.buildBenchmark(t,sigma),ledgers=[],plots=[];
 for(const scenario of ["smooth","high-frequency","wrong-diffusivity"])for(const index of [0,1,15,31])for(const lambda of [1e-6,1e-5,1e-4,.001,.01,.1]){
  const l=h.trajectoryLedger(b.splits.test[scenario][index],t,sigma,lambda,b.fitted.learned_weights);
  ledgers.push({scenario,index,lambda,l});
  if(index===0&&lambda===.001){
   const r=b.splits.test[scenario][index],m=l.modes;
   const series=[
    {values:r.observed_K,points:true,key:"given"},
    {values:l.estimates.tikhonov.initial_K,key:"initial"},
    {values:m.map(v=>v.risk.tikhonov.shrinkage),key:"shrink"},
    {values:m.map(v=>v.risk.tikhonov.bias_squared_K2),key:"bias2"},
    {values:m.map(v=>v.risk.tikhonov.variance_K2),key:"variance"},
    {values:m.map(v=>v.risk.tikhonov.mse_K2),key:"mse"}
   ];
   plots.push({scenario,series,charts:[h.drawHeatChart(node,"given",[series[0]]),h.drawHeatChart(node,"initial",[series[1]]),h.drawHeatChart(node,"shrink",[series[2]],{modes:true}),h.drawHeatChart(node,"risk",series.slice(3),{modes:true})]});
  }
 }
 all.push({t,sigma,b,ledgers,plots});
}
const bad=[
 ()=>h.generate("toString",1,.02),()=>h.generate("constructor",1,.02),()=>h.generate(null,1,.02),
 ()=>h.generate("train","1",.02),()=>h.generate("test",1,-.02),()=>h.generate("train",1,.02,"high-frequency"),
 ()=>h.fitLearned([]),()=>h.fitLearned(new Array(1)),()=>h.fitLearned(all[0].b.splits.validation),
 ()=>h.fitLearned([{split:"train",coefficients_K:Array(8).fill(1),observed_K:Array(16).fill(0),initial_K:Array(16).fill(1)}]),
 ()=>h.selectLambda(all[0].b.splits.train,1),()=>h.selectLambda([],1),
 ()=>h.field(new Array(8)),()=>h.field(Array(7).fill(0)),()=>h.field(Array(8).fill("1")),
 ()=>h.project(new Array(16)),()=>h.project(Array(16).fill(NaN)),
 ()=>h.attenuation(-1),()=>h.attenuation(Infinity),()=>h.attenuation("1"),()=>h.attenuation(1,-.01),
 ()=>h.reconstruct(Array(16).fill(1),1,"tikhonov",-.1),
 ()=>h.reconstruct(Array(16).fill(1),1,"learned",null,new Array(8)),
 ()=>h.reconstruct(Array(16).fill(1),1,"unknown"),
 ()=>h.reconstruct(Array(16).fill(1),1e6,"least_squares"),
 ()=>h.metrics({initial_K:[],observed_K:[],future_observed_K:[]},Array(8).fill(0),1),
 ()=>h.trajectoryLedger(all[0].b.splits.test.smooth[0],1,-1,.001,Array(8).fill(1))
];
let rejected=0;for(const f of bad){try{f()}catch(e){rejected++}}
console.log(JSON.stringify({all,rejected,bad:bad.length,zero:h.attenuation(0,Number.MAX_VALUE),frozen:Object.isFrozen(h.Q)&&h.Q.every(Object.isFrozen)&&Object.isFrozen(h.x)}));
'''
d=json.loads(subprocess.check_output(prefix+['node','-e',code],cwd=R,text=True))
count=0
def eq(a,b,label,tol=3e-10):
 global count
 assert isinstance(a,(int,float))and math.isfinite(a),(label,a)
 assert abs(a-b)<=tol*max(1,abs(b)),(label,a,b,a-b)
 count+=1
def arr(a,b,label,tol=3e-10):
 assert len(a)==len(b),(label,len(a),len(b))
 for i,(u,v)in enumerate(zip(a,b)):eq(u,v,(label,i),tol)
Q=[[math.sqrt(2/17)*math.sin(j*k*math.pi/17)for k in range(1,9)]for j in range(1,17)]
def dot(a,b):return math.fsum(u*v for u,v in zip(a,b))
def field(a):return[dot(row,a)for row in Q]
def project(y):return[math.fsum(Q[j][k]*y[j]for j in range(16))for k in range(8)]
def decay(t,kappa=.01):return[math.exp(-kappa*(k*math.pi)**2*t)for k in range(1,9)]
def forward(a,t,kappa=.01):return field([u*v for u,v in zip(a,decay(t,kappa))])
def mse(a,b):return math.fsum((u-v)**2 for u,v in zip(a,b))/16
class RNG:
 def __init__(self,s):self.s=s&0xffffffff
 def u(self):self.s=(1664525*self.s+1013904223)&0xffffffff;return(self.s+.5)/2**32
 def n(self):return math.sqrt(-2*math.log(self.u()))*math.cos(2*math.pi*self.u())
def rows(split,t,sigma,scenario='smooth'):
 seed,n={'train':(101,128),'validation':(202,32),'test':(303,32)}[split];out=[]
 for i in range(n):
  rng=RNG(seed+104729*i);z=[rng.n()for _ in range(8)]
  a=[6+.6*z[0]]+[1.5*z[k]/max(k,1)**2 for k in range(1,8)]
  if scenario=='high-frequency':a[5]+=6 if i%2==0 else -6
  kap=.016 if scenario=='wrong-diffusivity'else .01
  noise=[rng.n()for _ in range(16)];newnoise=[rng.n()for _ in range(16)]
  out.append(dict(a=a,initial=field(a),observed=[u+sigma*v for u,v in zip(forward(a,t,kap),noise)],future=[u+sigma*v for u,v in zip(forward(a,t+.5,kap),newnoise)],kappa=kap))
 return out
methods=['least_squares','tikhonov','learned'];scenarios=['smooth','high-frequency','wrong-diffusivity'];lambdas=[1e-6,1e-5,1e-4,.001,.01,.1]
def gains(t,method,lam,w):
 s=decay(t)
 return[1/v for v in s]if method=='least_squares'else[v/(v*v+lam)for v in s]if method=='tikhonov'else w
def reconstruct(y,t,method,lam,w):return[u*v for u,v in zip(project(y),gains(t,method,lam,w))]
def metrics(row,a,t):return[math.sqrt(mse(field(a),row['initial'])),math.sqrt(mse(forward(a,t),row['observed'])),math.sqrt(mse(forward(a,t+.5),row['future']))]
for item in d['all']:
 t,sigma,b=item['t'],item['sigma'],item['b'];s=decay(t)
 train=rows('train',t,sigma);val=rows('validation',t,sigma)
 bs=[project(r['observed'])for r in train]
 w=[math.fsum(v[k]*r['a'][k]for v,r in zip(bs,train))/math.fsum(v[k]**2 for v in bs)for k in range(8)]
 arr(b['fitted']['learned_weights'],w,'weights')
 scores=[math.fsum(mse(field(reconstruct(r['observed'],t,'tikhonov',lam,w)),r['initial'])for r in val)/32 for lam in lambdas]
 selected=lambdas[min(range(6),key=lambda i:(scores[i],lambdas[i]))]
 assert b['fitted']['validation_selected_lambda']==selected
 arr([r['initial_field_mse_K2']for r in b['fitted']['validation_scores']],scores,'validation')
 for split,expected in [('train',train),('validation',val)]:
  for i,(actual,truth)in enumerate(zip(b['splits'][split],expected)):
   assert actual['split']==split and actual['index']==i
   for key,fieldname in [('coefficients_K','a'),('initial_K','initial'),('observed_K','observed'),('future_observed_K','future')]:arr(actual[key],truth[fieldname],(split,i,key))
 tests={}
 for scenario in scenarios:
  tests[scenario]=rows('test',t,sigma,scenario);metricrows={method:[]for method in methods}
  for i,(actual,truth)in enumerate(zip(b['splits']['test'][scenario],tests[scenario])):
   for key,fieldname in [('coefficients_K','a'),('initial_K','initial'),('observed_K','observed'),('future_observed_K','future')]:arr(actual[key],truth[fieldname],(scenario,i,key))
   for method in methods:
    a=reconstruct(truth['observed'],t,method,selected,w);actuale=actual['estimators'][method];mt=metrics(truth,a,t);metricrows[method].append(mt)
    arr(actuale['coefficients_K'],a,'test estimate');arr(actuale['initial_K'],field(a),'test field');arr(list(actuale['metrics'].values()),mt,'test metrics')
  for method in methods:arr(list(b['metrics'][scenario][method].values()),[math.sqrt(math.fsum(r[j]**2 for r in metricrows[method])/32)for j in range(3)],'aggregate')
 for packet in item['ledgers']:
  truth=tests[packet['scenario']][packet['index']];lam=packet['lambda'];actual=packet['l'];bp=project(truth['observed']);st=decay(t,truth['kappa'])
  estimates={method:reconstruct(truth['observed'],t,method,lam,w)for method in methods}
  for method in methods:
   a=estimates[method];ae=actual['estimates'][method];g=gains(t,method,lam,w)
   for key,value in [('coefficients_K',a),('initial_K',field(a)),('observed_fit_K',forward(a,t)),('future_fit_K',forward(a,t+.5))]:arr(ae[key],value,key)
   arr(list(ae['metrics'].values()),metrics(truth,a,t),'manual metrics')
   bias=[(g[k]*st[k]-1)*truth['a'][k]for k in range(8)];variance=[(gk*sigma)**2 for gk in g]
   for k,mode in enumerate(actual['modes']):
    r=mode['risk'][method]
    for key,value in [('gain',g[k]),('shrinkage',g[k]*s[k]),('bias_K',bias[k]),('bias_squared_K2',bias[k]**2),('variance_K2',variance[k]),('mse_K2',bias[k]**2+variance[k]),('error_K',a[k]-truth['a'][k])]:eq(r[key],value,key)
    if sigma==0:assert r['variance_K2']==0
   risk=actual['conditionalRisk'][method];bias2=math.fsum(v*v for v in bias)/16;var=math.fsum(variance)/16
   arr(list(risk.values()),[bias2,var,bias2+var,math.sqrt(bias2+var)],'conditional risk')
   # Independent 32-point sensor-noise cubature has exactly sigma² I covariance.
   if packet['index']==0 and lam==.001:
    errors=[]
    clean=forward(truth['a'],t,truth['kappa'])
    for j in range(16):
     for sign in [-1,1]:
      y=clean.copy();y[j]+=sign*4*sigma
      ahat=reconstruct(y,t,method,lam,w);errors.append(mse(field(ahat),truth['initial']))
    eq(risk['mse_K2'],math.fsum(errors)/32,'independent cubature',1e-9)
   orth=[u-v for u,v in zip(truth['observed'],field(bp))]
   o2=dot(orth,orth);modal=math.fsum((s[k]*a[k]-bp[k])**2 for k in range(8));residual=16*mse(forward(a,t),truth['observed'])
   pr=actual['projection']['methods'][method]
   arr([pr['modal_sse_K2'],pr['residual_sse_K2'],pr['sum_sse_K2']],[modal,residual,modal+o2],'projection')
  for k,mode in enumerate(actual['modes']):
   vals=[s[k],st[k],truth['a'][k],st[k]*truth['a'][k],bp[k],bp[k]-st[k]*truth['a'][k],sigma]
   arr([mode[key]for key in ['s','true_s','truth_K','signal_K','projected_K','projected_noise_K','noise_sd_K']],vals,'modal data')
  for j,sensor in enumerate(actual['sensors']):
   arr([sensor[key]for key in ['x_m','truth_K','observed_K','future_observed_K']],[(j+1)/17,truth['initial'][j],truth['observed'][j],truth['future'][j]],'sensor')
   for method in methods:arr(list(sensor['estimates'][method].values()),[field(estimates[method])[j],forward(estimates[method],t)[j],forward(estimates[method],t+.5)[j]],'sensor estimates')
 for plot in item['plots']:
  for ci,chart in enumerate(plot['charts']):
   series=[plot['series'][ci]]if ci<3 else plot['series'][3:]
   allvalues=[v for se in series for v in se['values']];mi=min(0,*allvalues);ma=max(0,*allvalues);pad=max(.08*(ma-mi),1e-12);lo=mi-pad;hi=ma+pad
   expected={}
   for se in series:
    xs=list(range(1,9))if ci>=2 else[(j+1)/17 for j in range(16)]
    expected[se['key']]=[(125+(v-1)/7*740 if ci>=2 else 125+740*v,295-(y-lo)/(hi-lo)*245)for v,y in zip(xs,se['values'])]
   points=[n for n in chart['children']if isinstance(n,dict)and n['tag']=='circle']
   assert len(points)==sum(len(v)for v in expected.values())
   for n in points:
    at=n['attrs'];xy=expected[at['data-point']][at['data-index']]
    arr([at['cx'],at['cy']],xy,'plot coordinate',1e-12)
   for n in chart['children']:
    if isinstance(n,dict)and n['tag']=='polyline':
     xy=[tuple(map(float,p.split(',')))for p in n['attrs']['points'].split()]
     assert len(xy)==len(expected[n['attrs']['data-series']])
     for a,e in zip(xy,expected[n['attrs']['data-series']]):arr(a,e,'polyline',1e-12)
assert d['rejected']==d['bad']==27 and d['frozen']
assert d['zero']==[1]*8
for k in range(8):
 for l in range(8):eq(math.fsum(row[k]*row[l]for row in Q),int(k==l),'orthogonality',3e-15)
# Three worked exercises, hand example, and the spatial sampling nullspace.
s6=decay(1)[5];a=.2;b=s6*a+.02
for actual,expected in [(b/s6,.898399),(s6*b/(s6*s6+.001),.404793),(6*s6*s6/(s6*s6+.001),2.703432)]:eq(actual,expected,'hand round',2e-6)
for t in [.5,1,1.5]:
 for j in range(1,17):eq(math.sin(j*math.pi)*math.exp(-.01*(17*math.pi)**2*t),0,'invisible mode',1e-14)
tree=ET.parse(R/'math-course/images/project-01-heat-inverse.svg');ns={'s':'http://www.w3.org/2000/svg'}
for p in tree.findall('.//s:polyline',ns):
 a=p.attrib;pts=[tuple(map(float,x.split(',')))for x in a['points'].split()]
 assert len(pts)==8
 for k,(xx,yy)in enumerate(pts,1):
  if 'data-decay'in a:
   t=float(a['data-decay']);expected=(105+(k-1)/7*370,210+.01*(k*math.pi)**2*t/math.log(10)/5*280)
  else:
   lam=float(a['data-filter']);sk=decay(1)[k-1];expected=(655+(k-1)/7*370,490-sk*sk/(sk*sk+lam)*280)
  arr([xx,yy],expected,'static',1e-10)
body=(R/'math-course/lectures/project-01-heat-inverse.md').read_text()
assert body.count('<details class="answer"')==3
assert '\n+\\underbrace{g_k^2\\sigma^2}'in body and '\n-\\begin{bmatrix}y\\\\0\\end{bmatrix}'in body
shared=(R/'course-shared/labs/heat-inverse-project.js').read_bytes()
mirrors=list(R.glob('*-course/site/assets/learning/labs/heat-inverse-project.js'))
# grad-math has no "-course" suffix.
mirrors+=list(R.glob('grad-math/site/assets/learning/labs/heat-inverse-project.js'))
assert len(mirrors)>=3
for p in mirrors:assert p.read_bytes()==shared,p
assert (R/'math-course/site/assets/img/project-01-heat-inverse.svg').read_bytes()==(R/'math-course/images/project-01-heat-inverse.svg').read_bytes()
print(json.dumps(dict(status='PASS',numeric_checks=count,benchmarks=9,complete_test_trajectories=864,manual_ledgers=648,plot_sets=27,strict_rejections=d['bad'],conditional_risk_cubatures=81),ensure_ascii=False))
