"""Independent Decimal geometry and full-node checks for the equivalence lab."""
from pathlib import Path
from decimal import Decimal, localcontext
import subprocess,json,math,shutil,sys
ROOT=Path(__file__).resolve().parents[1]
PREFIX=['rtk','proxy'] if shutil.which('rtk') else []
JS=Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'course-shared/labs/equivalence-tides.js'
checks=0
def ck(ok,msg):
 global checks
 checks+=1
 assert ok,msg
def close(got,want,msg,tol=4e-13,absolute=0):
 want=float(want)
 ck(math.isfinite(got) and math.isclose(got,want,rel_tol=tol,abs_tol=absolute),f'{msg}: {got} != {want}')
program=r"""
const a=require(process.argv[1]),out={runs:[],strict:0,self:a.selfTest()};
for(const preset of Object.keys(a.PRESETS))for(const height of [0,.001,22.5,3e7])for(const mode of ['clocks','tides']){
 const s=a.snapshot({mode,preset,height,separation:1000,angle:37.25});
 out.runs.push({s,tables:a.ledgers(s),plots:a.plots(s)});
}
for(const acceleration of [.001,9.80665,1e8,1e16])for(const chi of [0,1e-24,1e-16,.5,2]){
 const s=a.snapshot({mode:'rindler',acceleration,chi});out.runs.push({s,tables:a.ledgers(s),plots:a.plots(s)});
}
out.tiny=[];for(const body of Object.values(a.PRESETS))for(const h of [1e-9,1e-6,.001])for(const angle of [0,45,90]){
 out.tiny.push({body,clock:a.clockAt(body,h),tide:a.tidalAt(body,h,1e-9,angle)});
}
out.extraTides=[];for(const ell of [100,500,1000])for(const angle of [0,15,45,90]){const body={mass:1e18,radius:1000};out.extraTides.push({body,row:a.tidalAt(body,0,ell,angle)});}
function bad(f){let caught=false;try{f()}catch(e){caught=true}if(!caught)throw Error('invalid accepted');out.strict++;}
for(const v of [null,false,[],3,'x'])bad(()=>a.snapshot(v));
for(const field of ['height','separation','angle','acceleration','chi'])for(const v of [null,'1',NaN,Infinity,-1])bad(()=>a.snapshot({[field]:v}));
for(const [field,v] of [['height',3e7+1],['height',1e-10],['separation',1001],['separation',1e-10],['angle',91],['acceleration',0],['acceleration',1e17],['chi',3],['chi',1e-25],['mode','constructor'],['preset','toString']])bad(()=>a.snapshot({[field]:v}));
for(const v of [null,{},[],{mass:1e35,radius:1000},{mass:1,radius:1000}])bad(()=>a.clockAt(v,1));
for(const v of [null,NaN,-1,1e-10,3e7+1])bad(()=>a.clockAt(a.PRESETS.tower,v));
for(const v of [null,NaN,-1,1e-10,1001])bad(()=>a.tidalAt(a.PRESETS.tower,0,v,0));
for(const v of [null,NaN,-1,91])bad(()=>a.tidalAt(a.PRESETS.tower,0,1,v));
for(const v of [null,NaN,-1,1e-25,3])bad(()=>a.rindlerAt(9.8,v));
for(const v of [null,NaN,0,1e17])bad(()=>a.rindlerAt(v,.5));
console.log(JSON.stringify(out));
"""
d=json.loads(subprocess.check_output(PREFIX+['node','-e',program,str(JS.resolve())],text=True))
D=lambda x:Decimal(str(x))
G=D('6.67430e-11');C=D(299792458);one=D(1)
def clock(row,b):
 with localcontext()as ctx:
  ctx.prec=80;M=D(b['mass']);R=D(b['radius']);h=D(row['height']);mu=G*M;rs=2*mu/C**2;r=R+h
  f=one-rs/R;f2=one-rs/r;ratio=(f/f2).sqrt();loss=one-ratio;z=one/ratio-one
  weak=mu*h/(C*C*R*r);linear=mu*h/(C*C*R*R)
  vals={'r1':R,'r2':r,'rs':rs,'compactness':mu/(R*C*C),'ratio':ratio,'logRatio':ratio.ln(),'loss':loss,'z':z,'weak':weak,'linear':linear,'clockGain':z,'clockGainMicrosecondsPerDay':z*86400*10**6,'surfaceNewtonG':mu/R**2,'surfaceProperG':mu/(R*R*f.sqrt()),'toInfinityLoss':one-f.sqrt(),'toInfinityZ':one/f.sqrt()-one}
  for key,val in vals.items():close(row[key],val,'clock '+key)
  if h:
   close(row['relativeMismatch'],abs(loss-weak)/weak,'stable weak relative',tol=2e-12)
   close(row['linearMismatch'],h/R,'linear relative')
  else:ck(row['relativeMismatch'] is None and row['linearMismatch'] is None,'zero clock undefined')
def tide(row,b,h):
 with localcontext()as ctx:
  ctx.prec=80;r=D(b['radius'])+D(h);mu=G*D(b['mass']);ell=D(row['separation']);theta=row['angle']*math.pi/180
  co=D(0 if row['angle']==90 else math.cos(theta));si=D(0 if row['angle']==0 else math.sin(theta));k=mu/r**3
  xp=r+ell*co/2;xm=r-ell*co/2;yp=ell*si/2;ym=-yp
  rp=(xp*xp+yp*yp).sqrt();rm=(xm*xm+ym*ym).sqrt()
  ar=-mu*xp/rp**3+mu*xm/rm**3;at=-mu*yp/rp**3+mu*ym/rm**3
  lr=2*k*ell*co;lt=-k*ell*si;norm=(lr*lr+lt*lt).sqrt();fn=(ar*ar+at*at).sqrt()
  vals={'radius':r,'ratio':ell/r,'k':k,'radialEigen':2*k,'transverseEigen':-k,'linearR':lr,'linearT':lt,'linearNorm':norm,'finiteR':ar,'finiteT':at,'finiteNorm':fn,'curvatureK':48*(mu/C**2)**2/r**6,'compactness':mu/(r*C*C)}
  for key,val in vals.items():close(row[key],val,'tide '+key,tol=3e-12)
  if ell:close(row['relativeMismatch'],((ar-lr)**2+(at-lt)**2).sqrt()/norm,'finite relative',tol=3e-10,absolute=1e-42)
  else:ck(row['relativeMismatch'] is None,'zero tide undefined')
def rindler(row):
 with localcontext()as ctx:
  ctx.prec=80;a=D(row['acceleration']);chi=D(row['chi']);s=(one+chi).ln()
  # Arrival on the null line, obtained algebraically from its intersection with the upper hyperbola.
  arrival=((one+chi)**2-one)/2
  vals={'length':C*C*chi/a,'upperProperAcceleration':a/(one+chi),'logRatio':-s,'ratio':one/(one+chi),'loss':chi/(one+chi),'z':chi,'flightParameter':s,'flightCoordinateTime':C/a*s,'arrivalCT':arrival,'arrivalX':arrival,'curvature':0}
  for key,val in vals.items():close(row[key],val,'rindler '+key)
for rr in d['runs']:
 s=rr['s'];c=s['config'];mode=c['mode']
 ck(len(rr['tables'])==3 and len(rr['plots'])==2,'evidence regions')
 for t in rr['tables']:
  ck(all(len(r)==len(t['headers'])for r in t['rows']),'rectangular ledger')
 if mode=='clocks':
  for row in [s['sample']]+s['rows']:clock(row,s['body'])
 elif mode=='tides':
  for row in [s['sample']]+s['rows']+s['separations']:tide(row,s['body'],c['height'])
 else:
  for row in [s['sample']]+s['rows']:rindler(row)
  for row in s['worldlines']:
   t=row['s'];chi=c['chi']
   close(row['lowerCT'],math.sinh(t),'lower CT')
   close(row['lowerX'],math.cosh(t)-1,'lower X',absolute=4e-16)
   close(row['upperCT'],(1+chi)*math.sinh(t),'upper CT')
   close(row['upperX'],(1+chi)*math.cosh(t)-1,'upper X',absolute=2e-15)
 for p in rr['plots']:
  ck(p['xmax']>p['xmin'] and p['ymax']>p['ymin'],'nondegenerate scales')
  for series in p['series']:
   xs=series.get('xs',p['xs']);ys=series['values'];ck(len(xs)==len(ys),'xy length')
   for x,y in zip(xs,ys):
    ck(p['xmin']<=x<=p['xmax'],'x fully visible')
    if y is not None:ck(p['ymin']<=y<=p['ymax'],'y fully visible')
for q in d['tiny']:
 clock(q['clock'],q['body']);tide(q['tide'],q['body'],q['clock']['height'])
for q in d['extraTides']:tide(q['row'],q['body'],0)
ck(d['self']=={'status':'PASS','checks':8},'self separately')
if len(sys.argv)==1:
 import re,html,xml.etree.ElementTree as ET
 src=(ROOT/'physics-course/lectures/gr-01-equivalence.md').read_text()
 site=(ROOT/'physics-course/site/gr-01-equivalence.html').read_text()
 formulas=[(a or b).strip()for a,b in re.findall(r'\$\$(.*?)\$\$|(?<!\\)\$(?!\$)(.*?)(?<!\\)\$(?!\$)',src,re.S)]
 actual=[html.unescape(a or b).strip()for a,b in re.findall(r'<(?:span|div) class="arithmatex">(?:\\\((.*?)\\\)|\\\[(.*?)\\\])</(?:span|div)>',site,re.S)]
 ck(formulas==actual,'all source formulas preserved')
 ck(src.count('<details')==4,'four complete answers')
 for path in ROOT.glob('*/site/assets/learning/labs/equivalence-tides.js'):ck(path.read_bytes()==JS.read_bytes(),'JS mirror')
 svg=ROOT/'physics-course/images/gr-01-light-bending.svg'
 ck(svg.read_bytes()==(ROOT/'physics-course/site/assets/img/gr-01-light-bending.svg').read_bytes(),'SVG mirror')
 root=ET.parse(svg).getroot();ns={'s':'http://www.w3.org/2000/svg'}
 ck(root.get('viewBox')=='0 0 1100 1840','static dimensions')
 rows=next(q['s']['worldlines']for q in d['runs']if q['s']['config']['mode']=='rindler'and q['s']['config']['chi']==.5)
 xmax=max(r['upperX']for r in rows)*1.05;ymax=max(r['upperCT']for r in rows)*1.05
 for kind,points in [
  ('lower-worldline',[(r['lowerX'],r['lowerCT'])for r in rows]),
  ('upper-worldline',[(r['upperX'],r['upperCT'])for r in rows]),
  ('null-light',[(0,0),(.625,.625)])]:
  nodes=root.findall('.//s:circle[@data-kind="'+kind+'"]',ns);ck(len(nodes)==len(points),'static '+kind+' count')
  for node,(x,y)in zip(nodes,points):
   close(float(node.get('cx')),135+475*x/xmax,'static inertial X',tol=1e-10)
   close(float(node.get('cy')),1020-340*(y+ymax)/(2*ymax),'static inertial CT',tol=1e-10)
 for kind,f in [('radial-angle',lambda t:2*math.cos(t)),('transverse-angle',lambda t:-math.sin(t))]:
  nodes=root.findall('.//s:circle[@data-kind="'+kind+'"]',ns);ck(len(nodes)==181,'static angle count')
  for i,node in enumerate(nodes):
   close(float(node.get('cx')),135+880*(i/2)/90,'static theta',tol=1e-10)
   close(float(node.get('cy')),1680-220*(f(i*math.pi/360)+1.2)/3.4,'static signed tide',tol=1e-10)
  poly=root.find('.//s:polyline[@data-kind="'+kind+'-line"]',ns)
  coords=[list(map(float,t.split(',')))for t in poly.get('points').split()];ck(len(coords)==181,'static poly count')
  for point,node in zip(coords,nodes):
   close(point[0],float(node.get('cx')),'poly x');close(point[1],float(node.get('cy')),'poly y')
 print('Formula parity:',len(formulas))
print(json.dumps({'status':'PASS','checks':checks,'completeStates':len(d['runs']),'tinyCases':len(d['tiny']),'strict':d['strict']},ensure_ascii=False))
