"""Independent SPARC parsing, dynamical identities, projection integrals and published plots."""
from pathlib import Path
import decimal, hashlib, html, itertools, json, math, re, shutil, subprocess, xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
PREFIX=['rtk','proxy'] if shutil.which('rtk') else []
MODULE=ROOT/'course-shared/labs/galaxy-rotation.js'
count=0
def check(ok,label):
 global count
 count+=1
 if not ok:raise AssertionError(label)
def near(a,b,label,rel=8e-12,abs_=0):
 check(isinstance(a,(int,float)) and math.isfinite(a) and abs(a-b)<=abs_+rel*abs(b),f'{label}: {a} != {b}')
def query(expr):
 return json.loads(subprocess.check_output(PREFIX+['node','-e',"const h=require("+json.dumps(str(MODULE))+");console.log(JSON.stringify("+expr+"));"],cwd=ROOT,text=True))
G=6.67430e-11*1.98847e30/(3.0856775814913673e19*1e6)
folder=ROOT/'course-shared/projects/sparc-ngc3198'
manifest=json.loads((folder/'manifest.json').read_text())
for name,item in manifest['files'].items():
 raw=(folder/name).read_bytes()
 check(len(raw)==item['bytes'] and hashlib.sha256(raw).hexdigest()==item['sha256'],'frozen '+name)
check(manifest['files']['MassModels_Lelli2016c.mrt']['sha256']=='9108994b12cc401b94a1768beca61c53ec354779385c9c9cc571049f3043244c','upstream mass hash')
check(manifest['files']['SPARC_Lelli2016c.mrt']['sha256']=='5aa0501f6b0d881fa579030e315e7b5b6ef561a5bd3a07472f9929c7e5728243','upstream sample hash')
lines=[r for r in (folder/'MassModels_Lelli2016c.mrt').read_text().splitlines() if r.split() and r.split()[0]=='NGC3198']
rawrows=[[float(x)for x in r.split()[1:]]for r in lines]
check(len(rawrows)==43 and all(len(r)==9 for r in rawrows),'all 43 published rows')
check((folder/'NGC3198-extract.txt').read_text()=='\n'.join(lines)+'\n','exact extraction')
published=json.loads((folder/'NGC3198.json').read_text());embedded=query('h.DATA')
check(embedded==published and embedded['rows']==rawrows,'embedded JSON data parity')
check(sum(r[4]<0 for r in rawrows)==6 and all(r[6]==0 for r in rawrows),'signed gas and zero bulge')
check(embedded['distanceMpc']==13.8 and embedded['inclinationDeg']==73,'published calibration')
def obs_reference(c):
 d=c['distance']/13.8;v=math.sin(math.radians(73))/math.sin(math.radians(c['inclination']));out=[]
 for i,a in enumerate(rawrows):
  r=a[1]*d;o=a[2]*v;e=a[3]*v;gas=d*a[4]*abs(a[4]);disk=d*c['massToLight']*a[5]**2
  bar=gas+disk;halo=c['vInfinity']**2/(1+(c['haloCore']/r)**2);total=math.sqrt(bar+halo);z=(total-o)/e;bz=(math.sqrt(bar)-o)/e
  out.append(dict(i=i,r=r,observed=o,error=e,gasSquared=gas,diskSquared=disk,baryonSquared=bar,haloSquared=halo,baryon=math.sqrt(bar),halo=math.sqrt(halo),total=total,residual=z,baryonResidual=bz,chi=z*z,baryonChi=bz*bz,sphericalEquivalentMass=r*o*o/G,haloMass=r*halo/G))
 return out
configs=[{},dict(massToLight=.05,distance=8,inclination=40),dict(massToLight=1.5,distance=20,inclination=89),dict(massToLight=1,distance=12,inclination=70),dict(vInfinity=0,haloCore=.5),dict(vInfinity=300,haloCore=15)]
observations=query(json.dumps(configs)+'.map(c=>{const s=h.snapshot(c);return {s,plots:h.plots(s)}})')
def golden_min(f):
 # Function-value search in speed, independent of product derivative bisection in speed squared.
 a=0.;b=300.;q=(math.sqrt(5)-1)/2;x=b-q*(b-a);y=a+q*(b-a);fx=f(x);fy=f(y)
 for _ in range(110):
  if fx<fy:b,y,fy=y,x,fx;x=b-q*(b-a);fx=f(x)
  else:a,x,fx=x,y,fy;y=a+q*(b-a);fy=f(y)
 return min([(0.,f(0.)),(300.,f(300.)),(x,fx),(y,fy)],key=lambda t:t[1])
worst=0
for item in observations:
 s=item['s'];refs=obs_reference(s['config']);check(len(s['rows'])==43,'observed count')
 for row,ref,raw in zip(s['rows'],refs,rawrows):
  for k,v in ref.items():near(row[k],v,'observation '+k,abs_=2e-13 if 'residual' in k.lower() else 0)
  check(row['raw']==raw,'unscaled raw row')
 near(s['chi'],math.fsum(r['chi']for r in refs),'chi total');near(s['baryonChi'],math.fsum(r['baryonChi']for r in refs),'baryon chi total')
 check(len(s['profile'])==146,'complete profile')
 for i,p in enumerate(s['profile']):
  rc=(i+5)/10;near(p['core'],rc,'core grid')
  qs=[r['r']**2/(r['r']**2+rc**2)for r in refs]
  def objective(speed):return math.fsum(((math.sqrt(r['baryonSquared']+speed*speed*q)-r['observed'])/r['error'])**2 for r,q in zip(refs,qs))
  speed,chi=golden_min(objective);worst=max(worst,abs(p['chi']/chi-1))
  near(p['chi'],chi,'independent profile minimum',rel=5e-12)
  near(p['chi'],objective(p['speed']),'profile objective');near(p['A'],p['speed']**2,'amplitude')
  check(0<=p['lo']<=p['A']<=p['hi']<=90000,'final floating bracket')
  check(p['hi']-p['lo']<=max(1,p['A'])*5e-16,'resolved floating bracket')
  derivative=math.fsum(q*(1-r['observed']/math.sqrt(r['baryonSquared']+p['A']*q))/r['error']**2 for r,q in zip(refs,qs))
  near(p['derivative'],derivative,'derivative ledger',abs_=2e-14)
  check((p['A']==0 and derivative>=-1e-13)or(p['A']==90000 and derivative<=1e-13)or(0<p['A']<90000 and abs(derivative)<1e-12),'KKT sign')
 check(s['best']==min(s['profile'],key=lambda p:p['chi']),'finite candidate selection')
decimal.getcontext().prec=80
def fraction(x):
 d=decimal.Decimal(str(x))
 return float(1-(-d).exp()*(1+d))
xs=[0,1e-12,1e-8,.001,.01,.099999,.1,.100001,.5,1,2,10,100,200]
for x,y in zip(xs,query(json.dumps(xs)+'.map(h.baryonFraction)')):near(y,fraction(x),'80-digit cumulative mass',rel=3e-13)
sconfigs=[dict(mode='spherical',baryonMass=m,diskScale=d,haloSpeed=v,coreRadius=rc,mondA0=a,outerRadius=40,sampleRadius=.05 if m==.1 else 40)for m,d,v,rc,a in itertools.product([.1,20],[.2,6],[0,3],[.2,6],[.005,1])]
sconfigs.append(dict(mode='spherical'))
spheres=query(json.dumps(sconfigs)+'.map(c=>{const s=h.snapshot(c);return {s,plots:h.plots(s)}})')
for item in spheres:
 s=item['s'];c=s['config'];radii=[.05 if i==0 else c['outerRadius']if i==200 else .05*math.exp(math.log(c['outerRadius']/.05)*i/200) for i in range(201)]
 check(len(s['rows']) in [201,202],'complete spherical grid')
 for r in s['rows']+[s['sample']]:
  z=r['r'];x=z/c['diskScale'];M=c['baryonMass']*fraction(x);vb2=M/z;vh2=c['haloSpeed']**2/(1+(c['coreRadius']/z)**2);gn=M/z**2
  gm=(gn+math.sqrt(gn**2+4*c['mondA0']*gn))/2
  rb=c['baryonMass']*math.exp(-x)/(4*math.pi*c['diskScale']**2*z)
  rh=c['haloSpeed']**2*(z*z+3*c['coreRadius']**2)/(4*math.pi*(z*z+c['coreRadius']**2)**2)
  ab=.5*(4*math.pi*z**3*rb/M-1);at=.5*(4*math.pi*z*z*(rb+rh)/(vb2+vh2)-1)
  # Log derivative of g^2/(g+a0)=gN, independently implicit rather than explicit-root differentiation.
  am=.5*(1+(2*ab-1)*(gm+c['mondA0'])/(gm+2*c['mondA0']))
  refs=dict(baryonMass=M,haloMass=z*vh2,totalMass=M+z*vh2,baryon=math.sqrt(vb2),halo=math.sqrt(vh2),total=math.sqrt(vb2+vh2),mond=math.sqrt(gm*z),newtonianAcceleration=gn,mondAcceleration=gm,baryonDensity=rb,haloDensity=rh,totalDensity=rb+rh,baryonSlope=ab,totalSlope=at,mondSlope=am,mondEquivalentMass=z*z*gm,deepMondRatio=(gm*z)**2/(c['baryonMass']*c['mondA0']))
  for k,v in refs.items():near(r[k],v,'sphere '+k,rel=3e-11,abs_=3e-14 if 'Slope'in k else 0)
  near(r['mondAcceleration']**2/(r['mondAcceleration']+c['mondA0']),gn,'MOND implicit force')
 for a,b in zip(s['rows'],s['rows'][1:]):check(a['r']<b['r'] and a['baryonMass']<=b['baryonMass'],'radius and mass monotonicity')
 check(any(abs(r['r']-c['sampleRadius'])<1e-14 for r in s['rows']),'sample included')
 for x in radii:check(any(abs(r['r']-x)<=1e-12*x for r in s['rows']),'every log grid node')
jconfigs=[dict(mode='jeans',tracerSlope=g,anisotropy=b,sigmaLos=sg,jeansRadius=R)for g,b,sg,R in itertools.product([2,2.1,3,4,5],[-1,0,.5,.9],[10,400],[.1,100])]
jeans=query(json.dumps(jconfigs)+'.map(c=>{const s=h.snapshot(c);return {s,plots:h.plots(s)}})')
def jref(g,b,sg,R):
 P=1-b*(g-1)/g;sr=sg/math.sqrt(P);vc2=(g-2*b)*sg**2/P
 return dict(beta=b,projection=P,sigmaRadial=sr,sigmaLos=sg,vc=math.sqrt(vc2),mass=R*vc2/G,density=vc2/(4*math.pi*G*R**2),radialPressureSlope=-g,jeansLeft=-vc2,jeansRight=-vc2)
for item in jeans:
 s=item['s'];c=s['config'];g=c['tracerSlope'];b=c['anisotropy'];sg=c['sigmaLos'];R=c['jeansRadius']
 check(len(s['rows'])in [191,192] and len(s['projectionGrid'])==201,'complete Jeans ledgers')
 for row in s['rows']+[s['sample']]:
  for k,v in jref(g,row['beta'],sg,R).items():near(row[k],v,'Jeans '+k)
  if g==3:near(row['vc']**2,3*sg**2,'special gamma3 cancellation')
 for i,row in enumerate(s['projectionGrid']):
  theta=i*math.pi/400;cs=0 if i==200 else math.cos(theta);w=1 if g==2 else cs**(g-2);n=w*(1-b*cs**2)
  for k,v in dict(i=i,theta=theta,cosine=cs,denominator=w,numerator=n,weightedSigmaSquared=sg**2*n/(1-b*(g-1)/g)).items():near(row[k],v,'projection grid '+k)
 if g==3:
  p=item['plots'][0];check(p['ymax']-p['ymin']>.09*s['sample']['mass'],'do not magnify rounding into a trend')
# Independent Simpson integration with u=cos(theta)^(1/4): smooths fractional gamma endpoint.
integrals=0
for g,b in itertools.product([2,2.1,2.5,3,4,5],[-1,0,.5,.9]):
 # theta=pi/2-t^4, t in [0,(pi/2)^(1/4)] smooths both endpoints.
 n=4096;dt=(math.pi/2)**.25/n;den=[];num=[]
 for i in range(n+1):
  t=i*dt;cs=math.sin(t**4);weight=0 if i==0 else 4*t**3*cs**(g-2)
  sim=1 if i in[0,n] else 4 if i%2 else 2
  den.append(sim*weight);num.append(sim*weight*(1-b*cs*cs))
 near(math.fsum(num)/math.fsum(den),1-b*(g-1)/g,'independent line-of-sight integral',rel=3e-11);integrals+=1
allitems=observations+spheres+jeans
for item in allitems:
 s=item['s']
 for p in item['plots']:
  check(p['xmax']>p['xmin'] and p['ymax']>p['ymin'],'nondegenerate axes')
  for ser in p['series']:
   check(len(ser['values'])==len(p['xs']),'complete plotted series')
   for i,(x,v)in enumerate(zip(p['xs'],ser['values'])):
    err=ser['errors'][i]if ser['errors']else 0
    check(p['xmin']<=x<=p['xmax'] and p['ymin']<=v-err<=v+err<=p['ymax'],'all values and error bars in bounds')
   if s['config']['mode']=='observed':
    key={'rotation':{'total':'total','baryon':'baryon','observed':'observed'},'residual':{'residual':'residual'},'profile':{'profile':'chi'}}[p['key']][ser['key']]
    refs=s['profile']if p['key']=='profile'else s['rows']
   elif s['config']['mode']=='spherical':key=({'total':'total','baryon':'baryon','mond':'mond'}if p['key']=='spherical-speed'else{'total':'totalMass','baryon':'baryonMass','mond-equivalent':'mondEquivalentMass'})[ser['key']];refs=s['rows']
   else:key=ser['key'];refs=s['rows']if p['key']=='jeans-mass'else s['projectionGrid']
   for v,r in zip(ser['values'],refs):near(v,r[key],'plot points match independently verified ledger')
strict=query("""(()=>{const f=[()=>h.config(null),()=>h.config([]),...['constructor','toString','',null].map(mode=>()=>h.config({mode})),...Object.keys(h.DEFAULTS).filter(k=>typeof h.DEFAULTS[k]==='number').flatMap(k=>[null,'1',NaN,Infinity,-Infinity].map(v=>()=>h.config({[k]:v}))),...Object.entries({massToLight:[.049,1.501],distance:[7,21],inclination:[39,90],vInfinity:[-1,301],haloCore:[.49,16],baryonMass:[0,21],diskScale:[.1,7],haloSpeed:[-1,4],coreRadius:[.1,7],mondA0:[0,2],outerRadius:[5,41],sampleRadius:[0,13],tracerSlope:[1,6],anisotropy:[-2,1],sigmaLos:[0,401],jeansRadius:[0,101]}).flatMap(([k,vs])=>vs.map(v=>()=>h.config({[k]:v}))),()=>h.baryonFraction(-1),()=>h.baryonFraction(201),()=>h.baryonEnclosed('1',1,1),()=>h.jeansAt(3,1,150,10)];return{q:f.map(fn=>{try{fn();return false}catch(e){return true}}),self:h.selfTest()}})()""")
for ok in strict['q']:check(ok,'strict input')
check(strict['self']['status']=='PASS','self test')
source=(ROOT/'physics-course/lectures/ap-06-galaxies.md').read_text();site=(ROOT/'physics-course/site/ap-06-galaxies.html').read_text()
blocks=re.findall(r'\$\$(.*?)\$\$',source,re.S)
for b in blocks:check(b in html.unescape(site),'display formula shipped unchanged')
check(len(blocks)==28,'display count');check(source.count('<details class="answer"')==4,'four full answers')
for term in [r'+\mathbf v\cdot',r'+\frac{\partial(\nu\overline{v_i v_j})}',r'+\frac{2\beta}{r}',r'+\Upsilon_d',r'(1+2\alpha)',r'2\epsilon_i^2(b_i+Aq_i)^{3/2}',r'1-\beta\frac{\gamma-1}{\gamma}',r'32.4286',r'2.2753',r'-2.0449']:check(term in source,'essential sign/factor '+term)
check(re.search(r'<img[^>]+src="assets/img/ap-06-rotation-curve.svg"',site)is not None,'actual image')
check('assets/learning/labs/galaxy-rotation.js' in site,'actual product script')
for name in ['README.md','NGC3198-extract.txt','NGC3198.json','manifest.json']:
 check('assets/learning/projects/sparc-ngc3198/'+name in site,'local download link')
 check((ROOT/'physics-course/site/assets/learning/projects/sparc-ngc3198'/name).read_bytes()==(folder/name).read_bytes(),'download mirror '+name)
paths=subprocess.check_output(PREFIX+['git','ls-files','*assets/learning/labs/galaxy-rotation.js'],cwd=ROOT,text=True).splitlines()
check(len(paths)==4,'four JS mirrors')
for p in paths:check((ROOT/p).read_bytes()==MODULE.read_bytes(),'JS mirror')
# Static geometry from independently verified model outputs, no generator import/execution.
svg=(ROOT/'physics-course/images/ap-06-rotation-curve.svg').read_bytes()
check(svg==(ROOT/'physics-course/site/assets/img/ap-06-rotation-curve.svg').read_bytes(),'SVG mirror')
tree=ET.fromstring(svg);ns={'s':'http://www.w3.org/2000/svg'}
check(tree.attrib['viewBox']=='0 0 1100 1510','static dimensions')
jd=query("(()=>{let s=h.snapshot({mode:'jeans'});return {s,p:h.plots(s)[0]}})()")
ps=observations[0]['plots'][:2]+[jd['p']]
ps[2]['ymin']=.9*3*150**2*10/G
ps[2]['series'].append(dict(key='gamma3',values=[3*150**2*10/G]*len(jd['s']['rows'])))
lines=tree.findall('s:polyline',ns);check(len(lines)==5,'five complete static series')
for n,p in enumerate(ps):
 xx=lambda v:145+890*(v-p['xmin'])/(p['xmax']-p['xmin'])
 yy=lambda v:110+440*n+295-210*(v-p['ymin'])/(p['ymax']-p['ymin'])
 for ser in p['series']:
  if ser.get('pointsOnly'):continue
  line=next(e for e in lines if e.attrib['data-plot']==p['key'] and e.attrib['data-series']==ser['key'])
  pts=[[float(z)for z in pair.split(',')]for pair in line.attrib['points'].split()]
  check(len(pts)==len(p['xs']),'static every node')
  for pair,x,v in zip(pts,p['xs'],ser['values']):
   near(pair[0],xx(x),'static x',abs_=2e-8);near(pair[1],yy(v),'static y',abs_=2e-8)
 if n==0:
  pts=tree.findall('s:circle[@data-observed]',ns);bars=tree.findall('s:line[@data-error]',ns)
  check(len(pts)==43 and len(bars)==43,'all real points/error bars')
  for i,(pt,bar,r)in enumerate(zip(pts,bars,obs_reference(observations[0]['s']['config']))):
   check(int(pt.attrib['data-observed'])==i and int(bar.attrib['data-error'])==i,'static original order')
   for e,k,v in [(pt,'cx',xx(r['r'])),(pt,'cy',yy(r['observed'])),(bar,'x1',xx(r['r'])),(bar,'x2',xx(r['r'])),(bar,'y1',yy(r['observed']-r['error'])),(bar,'y2',yy(r['observed']+r['error']))]:near(float(e.attrib[k]),v,'static error coordinate',abs_=2e-8)
print(f"Galaxy PASS: {count:,} checks; {len(observations)*146} independent profile fits (worst relative {worst:.3g}); {len(spheres)} full sphere and {len(jeans)} Jeans snapshots; {integrals} projection integrals; {len(blocks)} formulas; {len(strict['q'])} strict; {strict['self']['checks']} self")
