"""Independent physical identities, adaptive Planck integration, and complete finite ledgers."""
from pathlib import Path
import itertools, json, math, shutil, subprocess, re, html, xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
MODULE=ROOT/'course-shared/labs/accretion-eddington.js'
count=0
def check(ok,label):
 global count
 count+=1
 if not ok:raise AssertionError(label)
def near(a,b,label,rel=4e-12,abs_=0):
 check(isinstance(a,(float,int))and math.isfinite(a)and abs(a-b)<=abs_+rel*abs(b),f'{label}: {a} != {b}')
def node(s):
 return json.loads(subprocess.check_output(PREFIX+['node','-e',s],cwd=ROOT,text=True))
def query(expr):
 return node("const h=require("+json.dumps(str(MODULE))+");console.log(JSON.stringify("+expr+"));")
G=6.67430e-11;c0=299792458;ms=1.98847e30;mp=1.67262192369e-27;st=6.6524587321e-29;h=6.62607015e-34;kb=1.380649e-23;year=31557600
sigma=2*math.pi**5*kb**4/(15*h**3*c0**2)
configs=[{}]
for mass,lam,Y in itertools.product([1,10,1e10],[0,1e-12,.5,3],[2,1000,1e5]):
 configs.append(dict(massSolar=mass,lambda_=lam,outerRatio=Y,sampleRatio=Y,xIn=1000 if mass==1e10 else 6))
for eff,R,xi in itertools.product(['disk','surface','schwarzschild','extreme','thorne'],[2,1e6],[3,1000]):
 configs.append(dict(efficiencyId=eff,surfaceRadiusRg=R,xIn=xi,hydrogen=0,alpha=1,aspect=.5))
configs=[{('lambda'if k=='lambda_'else k):v for k,v in q.items()}for q in configs]
data=query(json.dumps(configs)+".map(c=>{const s=h.snapshot(c);return{s,plots:h.plots(s)}})")
for out in data:
 s=out['s'];c=s['config'];d=s['disk'];M=c['massSolar']*ms;rg=G*M/c0**2;rin=c['xIn']*rg
 eta={'disk':1/(2*c['xIn']),'surface':1/c['surfaceRadiusRg'],'schwarzschild':1-math.sqrt(8/9),'extreme':1-1/math.sqrt(3),'thorne':.3}[c['efficiencyId']]
 kappa=st/mp*(1+c['hydrogen'])/2;LE=4*math.pi*G*M*c0/kappa;L=c['lambda']*LE;mdot=L/eta/c0**2;LN=G*M*mdot/(2*rin);Tstar=(3*G*M*mdot/(8*math.pi*sigma*rin**3))**.25
 for k,v in dict(rG=rg,opacity=kappa,Ledd=LE,luminosity=L,eta=eta,mdot=mdot,mdotSolarYear=mdot*year/ms,etaNewtonian=1/(2*c['xIn']),newtonianLuminosity=LN,temperatureScale=Tstar,peakRatio=49/36).items():near(d[k],v,k)
 check(d['energyConsistent']==(c['efficiencyId']=='disk'),'consistent model flag')
 if L==0:check(d['newtonianObservedRatio']is None,'zero ratio is undefined')
 else:near(d['newtonianObservedRatio'],LN/L,'global model ratio')
 Y=c['outerRatio'];frac=1-3/Y+2/Y**1.5
 near(d['outerFraction'],frac,'finite outer fraction');near(d['outerLuminosity'],frac*LN,'finite luminosity')
 near(s['spectrum']['integrated'],frac,'independent bolometric closure',rel=4e-9)
 near(s['spectrum']['closureResidual'],s['spectrum']['integrated']-frac,'residual',abs_=3e-15)
 ys=[1 if i==0 else Y if i==200 else math.exp(math.log(Y)*i/200)for i in range(201)]+[49/36,9/4,c['sampleRatio']]
 ys=sorted(set(y for y in ys if y<=Y));check(len(s['radial'])==len(ys),'complete radial grid')
 for r,y in zip(s['radial'],ys):
  near(r['y'],y,'radial position');x=c['xIn']*y;radius=x*rg;f=1-1/math.sqrt(y);theta=y**(-.75)*f**.25
  for k,v in dict(x=x,radius=radius,factor=f,theta=theta,farTheta=y**(-.75),temperature=Tstar*theta,asymptoticTemperature=Tstar*y**(-.75),flux=3*G*M*mdot*f/(8*math.pi*radius**3),cumulative=1-3/y+2/y**1.5,powerPerLog=3*f/y,luminosityWithin=LN*(1-3/y+2/y**1.5)).items():
   near(r[k],v,'radial '+k,rel=3e-10,abs_=2e-15 if k=='cumulative'else 0)
  td=math.sqrt(radius**3/(G*M))
  for k,v in dict(dynamical=td,orbital=2*math.pi*td,thermal=td/c['alpha'],viscous=td/(c['alpha']*c['aspect']**2)).items():near(r['times'][k],v,'time '+k)
 check(len(s['spectrum']['rows'])==161,'all frequency rows')
 for i,r in enumerate(s['spectrum']['rows']):
  u=1e-5*(30/1e-5)**(i/160);near(r['u'],u,'frequency grid')
  near(r['perLog'],r['u']*r['density'],'spectrum convention')
  if Tstar==0:check(r['frequency']is None and r['luminosityDensity']==0 and r['luminosityPerLog']==0,'zero physical spectrum')
  else:
   nu=kb*Tstar/h*u;near(r['frequency'],nu,'physical frequency');near(r['luminosityDensity'],LN*r['density']/(kb*Tstar/h),'Lnu dimensional factor');near(r['luminosityPerLog'],nu*r['luminosityDensity'],'nu Lnu')
 grid=s['spectrum']['grid'];check(len(grid)==801,'all quadrature nodes')
 dt=math.log(Y)**.25/800
 for i,r in enumerate(grid):
  t=i*dt;y=math.exp(t**4);f=1-1/math.sqrt(y)
  for k,v in dict(i=i,t=t,y=y,weight=dt/3*(1 if i in[0,800]else 4 if i%2 else 2),jacobian=4*t**3*y**2).items():near(r[k],v,'quadrature '+k)
  # Near t=0 direct 1-y^-1/2 cancels; use log-based independent exp relation.
  theta=0 if t==0 else math.exp(-.75*t**4)*(-math.expm1(-.5*t**4))**.25
  near(r['theta'],theta,'quadrature temperature')
 for i,dplot in enumerate(out['plots']):
  check(len(dplot['xs'])==(161 if i==2 else len(ys)),'complete plot abscissas')
  for series in dplot['series']:
   check(len(series['values'])==len(dplot['xs']),'complete plot ordinates')
   for x,v in zip(dplot['xs'],series['values']):check(math.isfinite(v)and dplot['xmin']<=x<=dplot['xmax']and dplot['ymin']<=v<=dplot['ymax'],'no clipping')
# Independent adaptive integration in v=(y-1)^(1/4), not the product logarithmic grid.
def adaptive(f,a,b,eps,depth=28):
 mid=(a+b)/2;fa=f(a);fm=f(mid);fb=f(b);whole=(b-a)*(fa+4*fm+fb)/6
 def rec(a,b,fa,fm,fb,old,eps,depth):
  m=(a+b)/2;l=(a+m)/2;r=(m+b)/2;fl=f(l);fr=f(r)
  left=(m-a)*(fa+4*fl+fm)/6;right=(b-m)*(fm+4*fr+fb)/6;new=left+right
  if abs(new-old)<=15*eps:return new+(new-old)/15
  if depth==0:raise AssertionError('adaptive integration did not converge')
  return rec(a,m,fa,fl,fm,left,eps/2,depth-1)+rec(m,b,fm,fr,fb,right,eps/2,depth-1)
 return rec(a,b,fa,fm,fb,whole,eps,depth)
def reference(Y,u):
 vmax=(Y-1)**.25;breaks=sorted(set([vmax*i/32 for i in range(33)]+[(49/36-1)**.25]))
 def raw(v):
  if v==0:return 0
  y=1+v**4;theta=v*y**(-.875)*(math.sqrt(y)+1)**(-.25);arg=u/theta
  if arg>700:return 0
  return 4*v**3*y/math.expm1(arg)
 scale=max(raw(v)for v in breaks)
 val=sum(adaptive(lambda v:raw(v)/scale,a,b,1e-11/len(breaks))for a,b in zip(breaks,breaks[1:]))*scale
 return 45/math.pi**4*u**3*val
cases=list(itertools.product([2,10,1000,100000],[1e-5,.001,.03,.1,1,10,30]))
spec=query(json.dumps(cases)+".map(([Y,u])=>h.spectralShape(u,Y))")
worst=0
for(Y,u),r in zip(cases,spec):
 ref=reference(Y,u);worst=max(worst,abs(r['density']/ref-1));near(r['density'],ref,'adaptive Planck spectrum',rel=2.1e-7)
# All local modes: substitute roots into the dispersion polynomial and check growth.
qs=[0,1e-200,1e-100,1e-12]+[i/1000 for i in range(3001)]+[math.sqrt(15)/4,math.nextafter(math.sqrt(3),0),math.sqrt(3),math.nextafter(math.sqrt(3),math.inf)]
mris=query(json.dumps(qs)+".map(q=>h.mri(q))")
for q,r in zip(qs,mris):
 q2=q*q;A=1+2*q2;B=q2*(q2-3);w1=r['omegaMinusSquared'];w2=r['omegaPlusSquared']
 near(w1+w2,A,'root sum');near(w1*w2,B,'root product',rel=8e-12,abs_=5e-324)
 near(w1*w1-A*w1+B,0,'low root residual',abs_=5e-13)
 check(r['unstable']==(q>0 and q2<3),'strict MRI sign')
 growth=q*math.sqrt(2*(3-q2)/(A+math.sqrt(1+16*q2)))if 0<q and q2<3 else 0
 near(r['growth'],growth,'growth stable including tiny q')
 near(r['growth']**2,max(0,-w1),'growth square',rel=5e-12,abs_=5e-324)
jets=list(itertools.product([0,1e-12,.1,.5,.9,.99,.999999],[0,1e-8,.01,.1,1,5,30,60,90,179,180]))
values=query(json.dumps(jets)+".map(([beta,angle])=>h.jet(beta,angle))")
for(beta,angle),r in zip(jets,values):
 theta=math.radians(angle);den=1-beta*math.cos(theta);gamma=(1-beta*beta)**(-.5);sn=0 if angle in[0,180]else math.sin(theta);app=beta*sn/den
 near(r['arrivalFactor'],den,'arrival delay',rel=7e-11);near(r['gamma'],gamma,'Lorentz factor',rel=7e-11);near(r['apparent'],app,'apparent speed',rel=7e-11);near(r['doppler'],1/(gamma*den),'Doppler',rel=7e-11)
 check(r['minimumGammaFromApparent']<=r['gamma']*(1+1e-12),'kinematic lower bound')
 near(r['maximumApparent'],math.sqrt(max(0,(gamma-1)*(gamma+1))),'maximum apparent',rel=1e-11,abs_=1e-12)
extra=query("[{mode:'mri',q:0},{mode:'mri',q:3},{mode:'jet',beta:0},{mode:'jet',beta:.999999,angle:.04}].map(c=>{const s=h.snapshot(c);return{s,plots:h.plots(s)}})")
for out in extra:
 s=out['s'];rows=s['rows'];check(len(rows)>=181,'all mode nodes')
 for p in out['plots']:
  check(len(p['xs'])==len(rows),'all mode x')
  for series in p['series']:
   check(len(series['values'])==len(rows),'all mode y')
   for v in series['values']:check(p['ymin']<=v<=p['ymax'],'mode plot bounds')
# Non-coercion and all named parameter limits.
strict=query("""(()=>{let q=[];const f=[()=>h.config(null),()=>h.config([]),...['mode','efficiencyId'].flatMap(k=>['constructor','toString','',null].map(v=>()=>h.config({[k]:v}))),...Object.keys(h.DEFAULTS).filter(k=>typeof h.DEFAULTS[k]==='number').flatMap(k=>[null,'1',NaN,Infinity,-Infinity].map(v=>()=>h.config({[k]:v}))),()=>h.config({lambda:1e-13}),()=>h.config({sampleRatio:1001}),()=>h.config({massSolar:0}),()=>h.config({xIn:2}),()=>h.config({outerRatio:100001}),()=>h.config({alpha:0}),()=>h.config({aspect:0}),()=>h.config({hydrogen:2}),()=>h.config({beta:1}),()=>h.config({angle:181}),()=>h.config({q:-1}),()=>h.spectralShape(0,2),()=>h.spectralShape(1,2,41),()=>h.spectralShape(1,2,3202),()=>h.efficiency('constructor'),()=>h.efficiency('surface',1),()=>h.efficiency('disk',1,2),()=>h.thinDiskFlux(1,-1,6,6),()=>h.innerBoundaryFactor(5,6),()=>h.massRateFromLuminosity(1,0)];f.forEach(fn=>{try{fn();q.push(false)}catch(e){q.push(true)}});return{q,self:h.selfTest()};})()""")
for ok in strict['q']:check(ok,'strict input')
check(strict['self']['status']=='PASS','self')
source=(ROOT/'physics-course/lectures/ap-05-accretion.md').read_text();site=(ROOT/'physics-course/site/ap-05-accretion.html').read_text()
blocks=re.findall(r'\$\$(.*?)\$\$',source,re.S)
for b in blocks:check(b in html.unescape(site),'every display formula shipped unchanged')
check(re.search(r'<img[^>]+src="assets/img/ap-05-accretion-disk.svg"',site)is not None,'real static image')
check(source.count('<details class="answer"')==4,'four answers')
for term in [r'+q^2(q^2-3)=0',r'4\pi^2\int',r'\frac{45}{\pi^4}',r'1.4571',r'17.7M_\odot',r'0.293Mc^2']:check(term in source,'essential factor/sign '+term)
paths=[ROOT/p for p in subprocess.check_output(PREFIX+['git','ls-files','*assets/learning/labs/accretion-eddington.js'],cwd=ROOT,text=True).splitlines()]
check(len(paths)==4,'four site mirrors')
for p in paths:check(p.read_bytes()==MODULE.read_bytes(),'JS mirror')
image=ROOT/'physics-course/images/ap-05-accretion-disk.svg';check(image.read_bytes()==(ROOT/'physics-course/site/assets/img/ap-05-accretion-disk.svg').read_bytes(),'SVG mirror')
tree=ET.parse(image);ns={'s':'http://www.w3.org/2000/svg'};plots=data[0]['plots'];order=[plots[0],plots[2],plots[1]]
for i,p in enumerate(order):
 top=110+425*i
 for ser in p['series']:
  e=tree.find('.//s:polyline[@data-plot="'+p['key']+'"][@data-series="'+ser['key']+'"]',ns);check(e is not None,'static complete series')
  points=[tuple(map(float,pair.split(',')))for pair in e.get('points').split()];check(len(points)==len(p['xs']),'static complete nodes')
  for(x,y),a,b in zip(points,p['xs'],ser['values']):
   near(x,140+900*(a-p['xmin'])/(p['xmax']-p['xmin']),'static x',abs_=5e-9)
   near(y,top+287-210*(b-p['ymin'])/(p['ymax']-p['ymin']),'static y',abs_=5e-9)
print(f'Accretion PASS: {count:,} checks; {len(configs)} full disk snapshots; {len(cases)} independent adaptive spectra (worst relative {worst:.3g}); {len(qs)} MRI modes; {len(jets)} jet cases; {len(blocks)} formulas; {len(strict["q"])} strict; 9 self')
