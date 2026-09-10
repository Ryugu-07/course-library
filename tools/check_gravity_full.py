"""Independent SI, local metric, Newton quadrupole and frequency-integral oracle."""
from pathlib import Path
from decimal import Decimal,localcontext
import subprocess,json,math,shutil,sys
ROOT=Path(__file__).resolve().parents[1]
PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/gravitational-chirp.js'
program=r"""
const a=require(process.argv[1]),out={blackholes:[],waves:[],chirps:[],near:[],strict:0,self:a.selfTest()};
for(const massSolar of [1e-5,1,1e6,1e10])for(const radiusRatio of [.1,.5,.9999999999999999,1,1.0000000000000002,6])out.blackholes.push(a.snapshot({mode:'blackhole',massSolar,radiusRatio}));
for(const strain of [0,1e-30,1e-21,.001])for(const angle of [0,17.3,45,90,135,180])for(const phase of [0,90,217.4])out.waves.push(a.snapshot({mode:'polarization',strain,angle,phase}));
for(const mcSource of [.5,10,100,1e4])for(const eta of [.01,.25])for(const redshift of [0,1,10])for(const xLimit of [.02,.1])out.chirps.push(a.snapshot({mode:'chirp',mcSource,eta,redshift,xLimit,fObserved:20}));
for(const fObserved of [1,2000])for(const eta of [.01,.25])out.chirps.push(a.snapshot({mode:'chirp',mcSource:10,eta,fObserved}));
for(const ratio of [1-1e-8,1-1e-12,1-1e-13,1-6e-14,1-4e-14,1-2e-14,1-1.5e-14,1-1e-15,1,1+1e-15,1+1.5e-14,1+4e-14,1+1e-13,1+1e-8]){const t=a.chirpTrack(10,.25,20,0,.1);out.near.push(a.chirpTrack(10,.25,t.fCut*ratio,0,.1));}
function bad(f){let yes=false;try{f()}catch(e){yes=true}if(!yes)throw Error('invalid accepted');out.strict++;}
for(const v of [null,false,[],1,'x'])for(const fn of ['snapshot','polarization','chirp'])bad(()=>a[fn](v));
for(const key of Object.keys(a.DEFAULTS).filter(k=>k!=='mode'))for(const v of [null,NaN,Infinity,'1'])bad(()=>a.snapshot({[key]:v}));
for(const [key,value]of [['mode','constructor'],['massSolar',0],['massSolar',1e11],['radiusRatio',0],['radiusRatio',7],['strain',1e-31],['strain',.01],['angle',181],['phase',361],['arm',0],['waveFrequency',0],['mcSource',0],['eta',.251],['eta',0],['fObserved',0],['redshift',-1],['xLimit',.101]])bad(()=>a.snapshot({[key]:value}));
bad(()=>a.polarization({arm:1e5,waveFrequency:1e4}));
for(const args of [[null,1],['1',1],[1,0],[0,1]])bad(()=>a.bhAt(...args));
for(const args of [[0,10],[30,null],[NaN,10]])bad(()=>a.chirpRate(...args));
for(const v of [null,'10',0,1e5])bad(()=>a.chirpTrack(v,.25,20,0,.1));
if(a.ledgers)out.ui=[...out.blackholes,...out.waves,...out.chirps].map(s=>({s,tables:a.ledgers(s),plots:a.plots(s)}));
out.resolution=[];
for(const mc of [.5,10,100])for(const eta of [.01,.25])for(const z of [0,1])for(const cut of [.02,.1]){
 const end=a.chirpTrack(mc,eta,20,z,cut).fCut;if(end<1.01||end>1999)continue;
 for(const gap of [1e-15,1.5e-14,2e-14,3e-14,4e-14,5e-14,6e-14,1e-13,1e-12]){
  const t=a.chirpTrack(mc,eta,end*(1-gap),z,cut);
  out.resolution.push({mc,eta,z,cut,gap,status:t.status,n:t.rows.length,frequency:new Set(t.rows.map(r=>r.frequency)).size,strict:t.rows.every((r,i)=>!i||r.frequency>t.rows[i-1].frequency&&r.elapsed>t.rows[i-1].elapsed&&r.cycles>t.rows[i-1].cycles&&r.xPN>t.rows[i-1].xPN)});
 }
}
console.log(JSON.stringify(out));
"""
d=json.loads(subprocess.check_output(PREFIX+['node','-e',program,str(JS.resolve())],text=True))
checks=0
def ck(x,label):
 global checks
 checks+=1
 assert x,label
def close(x,y,label,rel=4e-12,absolute=1e-290):
 y=float(y);ck(math.isfinite(x)and math.isclose(x,y,rel_tol=rel,abs_tol=absolute),f'{label}: {x} != {y}')
def D(x):return Decimal.from_float(x)if isinstance(x,float)else Decimal(x)
PI=D('3.14159265358979323846264338327950288419716939937510582097494459230781640628620899')
G=D('6.67430e-11');C=D(299792458);MS=D('1.98847e30');HB=D('1.054571817e-34');KB=D('1.380649e-23')
def bh(row):
 with localcontext()as ctx:
  ctx.prec=80;M=D(row['massSolar'])*MS;x=D(row['radiusRatio']);rs=2*G*M/C**2;r=rs*x
  area=16*PI*G**2*M**2/C**4;S=4*PI*G*M*M/(HB*C);T=HB*C**3/(8*PI*G*M*KB)
  vals={'massKg':M,'rs':rs,'radius':r,'area':area,'entropyOverKB':S,'entropySI':KB*S,'temperature':T,'surfaceGravity':C**4/(4*G*M),'radialTide':2*G*M/r**3,'transverseTide':-G*M/r**3,'curvature':48*G**2*M**2/(C**4*r**6),'ingoing':-1,'outgoing':(x-1)/(x+1),'gTT':-(1-1/x),'gTx':1/x,'gxx':1+1/x,'determinant':-1}
  for k,v in vals.items():close(row[k],v,'SI/metric '+k)
  close(2*row['temperature']*row['entropySI'],M*C*C,'Smarr physical energy')
  for v in [D(row['ingoing']),D(row['outgoing'])]:
   ck(abs(-(1-1/x)+2*v/x+(1+1/x)*v*v)<D('2e-15'),'both null directions in metric')
for s in d['blackholes']:
 for r in [s['sample']]+s['rows']+s['scales']:bh(r)
 ck(len(s['scales'])==201,'complete mass grid')
 ck(any(r['radiusRatio']==1 for r in s['rows']),'horizon exact node')
 for r in s['scales']:
  q=r['massRatio'];close(r['entropyOverKB']/s['sample']['entropyOverKB'],q*q,'entropy scaling')
  close(r['temperature']/s['sample']['temperature'],1/q,'temperature scaling')
  close(r['radialTide']/s['sample']['radialTide'],1/(q*q),'tide scaling')
  close(r['logEntropyRatio'],2*math.log10(q),'log entropy',absolute=5e-16)
  close(r['logTemperatureRatio'],-math.log10(q),'log temperature',absolute=5e-16)
  close(r['logTideRatio'],-2*math.log10(q),'log tide',absolute=5e-16)
trigcache={}
def trig(degrees):
 if degrees in trigcache:return trigcache[degrees]
 with localcontext()as ctx:
  ctx.prec=80
  if degrees%90==0:
   j=int(degrees/90)%4;answer=(D([1,0,-1,0][j]),D([0,1,0,-1][j]))
  else:
   t=D(degrees)*PI/180
   while t>PI:t-=2*PI
   while t<-PI:t+=2*PI
   co=term=D(1);si=st=t
   for n in range(1,65):
    term*=-t*t/D((2*n-1)*(2*n));co+=term
    st*=-t*t/D((2*n)*(2*n+1));si+=st
   answer=(co,si)
  trigcache[degrees]=answer
  return answer
for s in d['waves']:
 with localcontext()as ctx:
  ctx.prec=80;c=s['config'];h=D(c['strain']);co,si=trig(2*c['angle']);pc,ps=trig(c['phase']);hp=h*pc*co;hx=h*pc*si;L=D(c['arm']);w=2*PI*D(c['waveFrequency'])
  vals={'hPlus':hp,'hCross':hx,'armXFraction':hp/2,'armYFraction':-hp/2,'differentialFraction':hp,'deltaArmX':L*hp/2,'deltaArmY':-L*hp/2,'differentialLength':L*hp,'tidalXX':-w*w*hp/2,'tidalXY':-w*w*hx/2,'omegaArmOverC':w*L/C}
  for k,v in vals.items():close(s[k],v,'sample polarization '+k)
  ck(len(s['ring'])==361 and len(s['phases'])==361,'full angle and phase')
  for r in s['ring']:
   ux,uy=trig(r['angle']);dx=(hp*ux+hx*uy)/2;dy=(hx*ux-hp*uy)/2;visual=D(0)if h==0 else D('.3')
   close(r['x0'],ux,'unit circle x');close(r['y0'],uy,'unit circle y')
   close(r['deltaX'],dx,'physical dx',absolute=float(abs(h)*D('2e-16')))
   close(r['deltaY'],dy,'physical dy',absolute=float(abs(h)*D('2e-16')))
   close(r['drawX'],ux+visual*pc*(co*ux+si*uy)/2,'schematic x',absolute=3e-16)
   close(r['drawY'],uy+visual*pc*(si*ux-co*uy)/2,'schematic y',absolute=3e-16)
  for r in s['phases']:
   q=trig(r['phase'])[0];hp=h*q*co;hx=h*q*si
   vals={'hPlus':hp,'hCross':hx,'armXFraction':hp/2,'armYFraction':-hp/2,'differentialFraction':hp,'deltaArmX':L*hp/2,'deltaArmY':-L*hp/2,'differentialLength':L*hp,'tidalXX':-w*w*hp/2,'tidalXY':-w*w*hx/2}
   for k,v in vals.items():close(r[k],v,'all phase '+k)
  if h==0:ck(s['visualGain']is None and s['visualAmplitude']==0,'zero gain explicit')
  else:close(s['visualGain'],D('.3')/h,'declared visual amplification')
def chirp(s):
 with localcontext()as ctx:
  ctx.prec=80;mc=D(s['mcSource'])*MS;eta=D(s['eta']);z=D(s['redshift']);factor=1+z;M=mc/eta**D('.6');Mo=M*factor;f0=D(s['fObserved']);fcut=D(s['xLimit'])**D('1.5')*C**3/(PI*G*Mo)
  af=D(96)/5*PI**(D(8)/3)*(G*mc*factor/C**3)**(D(5)/3)
  tau=D(3)/(8*af)*f0**(-D(8)/3);rate=af*f0**(D(11)/3)
  close(s['totalSource'],M/MS,'total source');close(s['totalObserved'],Mo/MS,'total observed')
  close(s['m1Source']+s['m2Source'],M/MS,'mass sum');close(s['m1Source']*s['m2Source']/(s['totalSource']**2),eta,'symmetric mass ratio')
  close(s['mcObserved'],factor*mc/MS,'redshifted chirp mass');close(s['fSource'],f0*factor,'source frequency');close(s['fOrbitalObserved'],f0/2,'orbital frequency')
  close(s['rate'],rate,'chirp rate');close(s['formalTime'],tau,'formal time')
  close(s['sourceRate'],rate*factor*factor,'source rate');close(s['sourceFormalTime'],tau/factor,'source time')
  close(s['fCut'],fcut,'cutoff frequency');close(s['xStart'],(PI*G*Mo*f0/C**3)**(D(2)/3),'initial PN x')
  close(s['schwarzschildISCOFrequency'],C**3/(D(6).sqrt()*6*PI*G*Mo),'testmass reference ISCO')
  if s['status']!='valid':
   ck(not s['rows']and s['duration']is None and s['cycles']is None,'no unsupported evolution')
   if s['status']=='outside':ck(f0>fcut,'outside domain')
   else:ck(abs(f0-fcut)/fcut<D('1e-12'),'honest near-cutoff indeterminate')
   return
  ck(len(s['rows'])==201,'all chirp nodes');ck(f0<fcut,'valid cutoff ordering')
  for key in ['frequency','elapsed','cycles','xPN']:
   ck(all(s['rows'][i][key]>s['rows'][i-1][key]for i in range(1,201)),'strictly resolved '+key)
  # Use the returned cutoff as a representable endpoint when testing extremely narrow intervals.
  # Its physical value was checked above. Avoid turning its last-bit rounding into a phase error.
  endpoint=D(s['fCut'])
  dt=D(3)/(8*af)*(f0**(-D(8)/3)-endpoint**(-D(8)/3))
  N=D(3)/(5*af)*(f0**(-D(5)/3)-endpoint**(-D(5)/3))
  close(s['duration'],dt,'direct definite time integral',rel=5e-12);close(s['cycles'],N,'direct cycle integral',rel=5e-12)
  span=(endpoint/f0).ln()
  for row in s['rows']:
   lf=span*D(row['i'])/200;f=f0*lf.exp();fs=f*factor
   close(row['frequency'],f,'log frequency node')
   dt=D(3)/(8*af)*f0**(-D(8)/3)*(1-(-D(8)/3*lf).exp())
   N=D(3)/(5*af)*f0**(-D(5)/3)*(1-(-D(5)/3*lf).exp())
   close(row['elapsed'],dt,'every elapsed integral',rel=5e-12)
   close(row['cycles'],N,'every cycle integral',rel=5e-12);close(row['phase'],2*PI*N,'every phase',rel=5e-12)
   close(row['sourceFrequency'],fs,'every source frequency');close(row['sourceElapsed'],dt/factor,'every source elapsed',rel=5e-12)
   # Independent route through orbital separation and Newton quadrupole power.
   a=(G*M/(PI*fs)**2)**(D(1)/3);mu=eta*M
   E=-G*M*mu/(2*a);power=D(32)/5*G*mu*mu*a**4*(PI*fs)**6/C**5
   dEdf=G*M*mu/(3*a*fs);sourceRate=power/dEdf
   close(row['xPN'],G*M/(a*C*C),'PN via Kepler separation')
   close(row['bindingEnergySource'],E,'Newton binding energy')
   close(row['powerSource'],power,'quadrupole power')
   close(row['rate'],sourceRate/(factor*factor),'rate via energy balance')
for item in d['chirps']:
 for s in item['tracks']:chirp(s)
for s in d['near']:chirp(s)
for r in d['resolution']:
 ck((r['n']==201 and r['frequency']==201 and r['strict'])if r['status']=='valid'else(r['status']=='unresolved'and r['n']==0),'complete resolved frequency regression')
 if r['gap']==1e-12:ck(r['status']=='valid','sufficiently wide interval remains valid')
for item in d.get('ui',[]):
 s=item['s'];mode=s['config']['mode'];ts=item['tables'];ps=item['plots']
 ck(len(ts)==(5 if mode=='chirp'else 3),'complete ledger set')
 for t in ts:ck(all(len(row)==len(t['headers'])for row in t['rows']),'rectangular full table')
 ck(len(ps)==2,'two mechanism plots')
 for p in ps:
  ck(p['xmax']>p['xmin']and p['ymax']>p['ymin'],'nondegenerate graph')
  for series in p['series']:
   xs=series.get('xs',p['xs']);ys=series['values'];ck(len(xs)==len(ys),'xy count')
   for x,y in zip(xs,ys):ck(p['xmin']<=x<=p['xmax']and p['ymin']<=y<=p['ymax'],'every node visible')
 if mode=='polarization':ck(ps[0]['equalAspect']and ps[0]['xmax']-ps[0]['xmin']==ps[0]['ymax']-ps[0]['ymin'],'equal-scale ring')
 if mode=='chirp':
  valid=[t for t in s['tracks']if t['status']=='valid']
  for p,key in zip(ps,['frequency','cycles']):
   ck(len(p['series'])==len(valid),'no invented outside curve')
   ck(p['empty']==(not valid),'empty graph honestly labelled')
   for series,track in zip(p['series'],valid):
    ck(len(series['values'])==len(track['rows'])==201,'full each independent track')
    ck(series['xs']==[r['elapsed']for r in track['rows']],'all elapsed abscissae')
    ck(series['values']==[r[key]for r in track['rows']],'all track ordinates')
if len(sys.argv)==1:
 import re,html,xml.etree.ElementTree as ET
 src=(ROOT/'physics-course/lectures/gr-03-blackholes-waves.md').read_text();site=(ROOT/'physics-course/site/gr-03-blackholes-waves.html').read_text()
 formulas=[(a or b).strip()for a,b in re.findall(r'\$\$(.*?)\$\$|(?<!\\)\$(?!\$)(.*?)(?<!\\)\$(?!\$)',src,re.S)]
 actual=[html.unescape(a or b).strip()for a,b in re.findall(r'<(?:span|div) class="arithmatex">(?:\\\((.*?)\\\)|\\\[(.*?)\\\])</(?:span|div)>',site,re.S)]
 ck(formulas==actual,'all source formulas in order');ck(src.count('<details')==4,'four complete answers')
 mirrors=list(ROOT.glob('*/site/assets/learning/labs/gravitational-chirp.js'));ck(len(mirrors)==4,'four site mirrors')
 for path in mirrors:ck(path.read_bytes()==JS.read_bytes(),'exact JS mirror')
 svg=ROOT/'physics-course/images/gr-03-gw-blackhole.svg';ck(svg.read_bytes()==(ROOT/'physics-course/site/assets/img/gr-03-gw-blackhole.svg').read_bytes(),'SVG mirror')
 root=ET.parse(svg).getroot();ns={'s':'http://www.w3.org/2000/svg'}
 ck(root.get('viewBox')=='0 0 1100 2200','static canvas')
 for i,(x,xc)in enumerate([(.5,250),(1,570),(2,890)]):
  for family,v in [('in',-1),('out',(x-1)/(x+1))]:
   n=root.find('.//s:line[@data-cone="'+str(i)+'"][@data-family="'+family+'"]',ns);ck(n is not None,'every null tangent')
   close(float(n.get('x1')),xc,'cone origin x');close(float(n.get('y1')),430,'cone origin time')
   close(float(n.get('x2')),xc+140*v,'cone future direction');close(float(n.get('y2')),245,'cone future time')
 stat=json.loads(subprocess.check_output(PREFIX+['node','-e',"const a=require(process.argv[1]);console.log(JSON.stringify({bh:a.snapshot(),plus:a.polarization({angle:0}),cross:a.polarization({angle:45}),chirp:a.chirp()}))",str(JS.resolve())],text=True))
 groups=[]
 for key,kind in [('logEntropyRatio','mass-entropy'),('logTemperatureRatio','mass-temperature'),('logTideRatio','mass-tide')]:
  groups.append((kind,[(r['logMassRatio'],r[key])for r in stat['bh']['scales']],lambda x:135+490*(x+2)/4,lambda y:980-270*(y+4.6)/9.2))
 for kind,xc in [('plus',260),('cross',650)]:
  for suffix,kx,ky in [('reference','x0','y0'),('deformed','drawX','drawY')]:
   groups.append((kind+'-'+suffix,[(r[kx],r[ky])for r in stat[kind]['ring']],lambda x,xc=xc:xc+130*x,lambda y:1360-130*y))
 xmax=max(t['duration']for t in stat['chirp']['tracks'])*1.03;ymax=max(t['fCut']for t in stat['chirp']['tracks'])*1.06
 for t in stat['chirp']['tracks']:
  groups.append(('chirp-'+str(t['massFactor']),[(r['elapsed'],r['frequency'])for r in t['rows']],lambda x:135+600*x/xmax,lambda y:2010-265*y/ymax))
 for kind,points,xf,yf in groups:
  nodes=root.findall('.//s:circle[@data-kind="'+kind+'"]',ns);ck(len(nodes)==len(points),'all static '+kind)
  poly=root.find('.//s:polyline[@data-kind="'+kind+'-line"]',ns)
  coords=[list(map(float,t.split(',')))for t in poly.get('points').split()];ck(len(coords)==len(points),'all static poly vertices')
  for n,point,(x,y)in zip(nodes,coords,points):
   close(float(n.get('cx')),xf(x),'static x',rel=1e-10);close(float(n.get('cy')),yf(y),'static y',rel=1e-10)
   close(point[0],xf(x),'poly x',rel=1e-10);close(point[1],yf(y),'poly y',rel=1e-10)
 print('Formula parity:',len(formulas))
print(json.dumps({'status':'PASS','checks':checks,'blackholeStates':len(d['blackholes']),'waveStates':len(d['waves']),'chirpStates':len(d['chirps']),'nearCutoffCases':len(d['near']),'strict':d['strict'],'resolutionCases':len(d['resolution']),'self':d['self']},ensure_ascii=False))
