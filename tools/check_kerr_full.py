from pathlib import Path
from decimal import Decimal as D, getcontext
import subprocess,json,sys,shutil,math
getcontext().prec=80
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/physics-kerr-causality.js'
CODE=r"""
const a=require(process.argv[1]),ext=[],areas=[];let strict=0;
const spins=[-.9999,-.8,-.01,-1e-12,0,1e-12,.01,.8,.9999];
for(const spin of spins)for(const offset of [1e-5,.2,1,20])ext.push(a.snapshot({spin,offset,velocity:spin<0?.8:-.8}));
for(const spin of [-.9999,-.8,-.01,.01,.8,.9999]){
 ext.push(a.snapshot({spin,position:'static'}));
 const d=a.horizon(spin).inner;for(const mul of [1-1e-8,1-1e-14,1+1e-14,1+1e-8])ext.push(a.snapshot({spin,offset:d*mul}));
}
for(const spin of spins)for(const fraction of [0,1e-14,.333,1])areas.push(a.snapshot({mode:'area',spin,fraction}));
function bad(fn){let ok=false;try{fn()}catch(e){ok=true}if(!ok)throw Error('accepted invalid #'+strict);strict++;}
for(const x of [null,[],true,'x',4])for(const fn of ['config','snapshot','exterior','area'])bad(()=>a[fn](x));
for(const [key,values]of Object.entries({spin:[null,'0.8',NaN,Infinity,-1,1],offset:[null,'0.2',NaN,0,1e-6,21],velocity:[null,'0',NaN,-1,1],fraction:[null,'0.5',NaN,-1,2],position:['x',null,4],mode:['x',null,4]}))for(const x of values)bad(()=>a.config({[key]:x}));
for(const spin of [0,.001,-.001])bad(()=>a.config({spin,position:'static'}));
for(const x of [null,'0.8',NaN,Infinity,1])bad(()=>a.horizon(x));
for(const x of [null,'0.5',NaN,Infinity,-1,2])bad(()=>a.reversible(.8,x));
const ui=a.ledgers?ext.concat(areas).map(s=>({s,tables:a.ledgers(s),plots:a.plots(s)})):[];
console.log(JSON.stringify({ext,areas,strict,self:a.selfTest(),ui}));
"""
d=json.loads(subprocess.check_output(PREFIX+['node','-e',CODE,str(JS.resolve())],text=True))
checks=0;PI=D('3.141592653589793238462643383279502884197169399375105820974944592307816406286')
def ck(b,msg):
 global checks
 assert b,msg;checks+=1
def de(x):return x if isinstance(x,D)else D(x)if isinstance(x,int)else D.from_float(x)
def close(x,y,label,rel=D('3e-11'),scale=None):
 y=D(y);xx=de(x);bound=rel*max(abs(y),D('1e-290'))if scale is None else rel*max(abs(y),D(scale))
 ck(abs(xx-y)<=bound,(label,x,str(y),str(abs(xx-y)/max(abs(y),D('1e-290')))))
def horizon(a):
 a=de(a)if not isinstance(a,D)else a;s=(1-a*a).sqrt();rp=1+s;rm=1-s;I=rp/2;m=I.sqrt()
 return dict(spin=a,root=s,outer=rp,inner=rm,omegaH=a/(2*rp),kappa=s/(2*rp),area=8*PI*rp,mirr=m,extractable=1-m)
def bh(h):
 q=horizon(h['spin'])
 for k,v in q.items():close(h[k],v,'horizon '+k,rel=D('2e-12'))
 return q
def metric(p):
 a=de(p['spin']);h=horizon(a);deltaOff=de(p['offset']);r=1+h['root']+deltaOff
 if p['region']=='static':r=D(2);deltaOff=h['inner']
 delta=r*r-2*r+a*a;gtt=2/r-1;gtp=-2*a/r;gpp=r*r+a*a+2*a*a/r
 w=-gtp/gpp;alpha=(delta/gpp).sqrt();sq=delta.sqrt()
 expected={'radius':r,'delta':delta,'gtt':gtt,'gtphi':gtp,'gphiphi':gpp,'omega':w,'halfWidth':sq/gpp,'lower':(-gtp-sq)/gpp,'upper':(-gtp+sq)/gpp,'alpha':alpha,'sqrtG':gpp.sqrt()}
 # Near r=2 the irrational horizon-to-static gap is stored as a binary64.
 # Bound its absolute rounding error rather than demand relative accuracy at a zero.
 for k,v in expected.items():close(p[k],v,'metric '+k,scale=D('1e-5')if k in ['gtt','lower','upper']else None)
 # Lorentzian norm and determinant, calculated from independently derived metric.
 close(gpp*de(p['lower'])**2+2*gtp*de(p['lower'])+gtt,0,'lower null residual',scale=max(abs(gtt),abs(2*gtp*de(p['lower'])),D('1e-5')))
 close(gpp*de(p['upper'])**2+2*gtp*de(p['upper'])+gtt,0,'upper null residual',scale=max(abs(gtt),abs(2*gtp*de(p['upper'])),D('1e-5')))
 if p['region']=='ergoregion':ck((p['lower']>0 and p['upper']>0)if a>0 else(p['lower']<0 and p['upper']<0),'both spin orientations forced')
 if p['region']=='outside':ck(p['lower']<0<p['upper'],'outside counterrotation')
 if a==0:ck(p['negativeThreshold']is None,'no zero-spin negative energy threshold')
 else:close(p['negativeThreshold'],-alpha/(w*gpp.sqrt()),'negative energy threshold')
 return expected
def particle(row,q):
 v=de(row['velocity']);gam=1/(1-v*v).sqrt();alpha=q['alpha'];b=q['sqrtG'];w=q['omega'];ut=gam/alpha;up=ut*(w+alpha*v/b)
 # Lower the 4-momentum with the full BL metric, independently of the product's E/L shortcut.
 E=-(q['gtt']*ut+q['gtphi']*up);L=q['gtphi']*ut+q['gphiphi']*up
 vals={'gamma':gam,'energy':E,'angularMomentum':L,'omega':up/ut,'uTime':ut,'uPhi':up,'properRate':1/ut,'causalNorm':-1/(ut*ut),'localEnergy':gam}
 scales={'energy':gam*(alpha+abs(w*b*v)),'angularMomentum':gam*b,'omega':abs(w)+abs(alpha*v/b),'uPhi':ut*(abs(w)+abs(alpha*v/b))}
 for k,val in vals.items():close(row[k],val,'particle '+k,scale=scales.get(k))
 close(-de(row['energy'])+w*de(row['angularMomentum']),-alpha*gam,'positive local energy identity',scale=alpha*gam)
 close(q['gtt']*ut*ut+2*q['gtphi']*ut*up+q['gphiphi']*up*up,-1,'normalized future timelike',rel=D('1e-60'))
def cos_decimal(t):
 if t in [0,90,180]:return {D(0):D(1),D(90):D(0),D(180):D(-1)}[t]
 x=t*PI/180;s=D(1);term=D(1)
 for n in range(1,70):term*=-x*x/(D(2*n-1)*D(2*n));s+=term
 return s
for s in d['ext']:
 q=metric(s['sample']);bh(s['sample']['horizon']);particle(s['particle'],q)
 ck(all(s['radial'][i]['offset']<s['radial'][i+1]['offset']for i in range(len(s['radial'])-1)),'sorted full radial')
 for p in s['radial']:metric(p);close(p['logOffset'],de(p['offset']).log10(),'log offset')
 for row in s['velocityRows']:particle(row,q)
 h=horizon(s['config']['spin']);a=h['spin']
 for row in s['surfaces']:
  co=cos_decimal(de(row['theta']));rr=1+(1-a*a*co*co).sqrt();width=rr-h['outer']
  close(row['outer'],h['outer'],'surface horizon');close(row['ergosurface'],rr,'surface static')
  close(row['width'],width,'surface width',scale=D('1e-75'))
def path(row,spin):
 h=horizon(spin);I=h['mirr']**2;f=de(row['fraction']);j=de(spin)*(1-f);m=(I+j*j/(4*I)).sqrt();astar=j/(m*m)
 R=m+(m*m-(j/m)**2).sqrt();kap=(R-m)/(2*m*R);w=j/(2*m*m*R)
 values={'angularMomentum':j,'mass':m,'spin':astar,'extracted':D(0)if f==0 or spin==0 else 1-m,'area':h['area'],'mirr':h['mirr'],'omegaH':w,'kappa':kap,'outer':R}
 for k,v in values.items():close(row[k],v,'reversible '+k,rel=D('4e-12'))
 close(m,kap*h['area']/(4*PI)+2*w*j,'Smarr',rel=D('1e-65'))
for s in d['areas']:
 bh(s['sample']);path(s['current'],s['config']['spin'])
 for h in s['spinRows']:bh(h)
 for row in s['path']:path(row,s['config']['spin'])
for u in d['ui']:
 for t in u['tables']:ck(all(len(row)==len(t['headers'])for row in t['rows']),'rectangular ledger')
 ck(len(u['plots'])==2,'two plots')
 for p in u['plots']:
  ck(p['xmax']>p['xmin']and p['ymax']>p['ymin'],'positive axis extent')
  for series in p['series']:
   xs=series.get('xs',p['xs']);ck(len(xs)==len(series['values']),'xy same lengths')
   for x,y in zip(xs,series['values']):ck(p['xmin']<=x<=p['xmax']and p['ymin']<=y<=p['ymax'],'all nodes visible')
if len(sys.argv)==1:
 import re,html,xml.etree.ElementTree as ET
 src=(ROOT/'physics-course/lectures/gr-04-kerr-causal.md').read_text();site=(ROOT/'physics-course/site/gr-04-kerr-causal.html').read_text()
 formulas=[(a or b).strip()for a,b in re.findall(r'\$\$(.*?)\$\$|(?<!\\)\$(?!\$)(.*?)(?<!\\)\$(?!\$)',src,re.S)]
 actual=[html.unescape(a or b).strip()for a,b in re.findall(r'<(?:span|div) class="arithmatex">(?:\\\((.*?)\\\)|\\\[(.*?)\\\])</(?:span|div)>',site,re.S)]
 ck(formulas==actual,'all source formulas in order');ck(src.count('<details')==4,'four complete answers')
 mirrors=list(ROOT.glob('*/site/assets/learning/labs/physics-kerr-causality.js'));ck(ROOT/'physics-course/site/assets/learning/labs/physics-kerr-causality.js'in mirrors,'required physics site mirror')
 for p in mirrors:ck(p.read_bytes()==JS.read_bytes(),'exact JS mirror')
 svg=ROOT/'physics-course/images/gr-04-kerr-ledgers.svg';ck(svg.read_bytes()==(ROOT/'physics-course/site/assets/img/gr-04-kerr-ledgers.svg').read_bytes(),'SVG mirror')
 root=ET.parse(svg).getroot();ns={'s':'http://www.w3.org/2000/svg'};ck(root.get('viewBox')=='0 0 1100 2200','static canvas')
 stat=json.loads(subprocess.check_output(PREFIX+['node','-e',"const a=require(process.argv[1]);console.log(JSON.stringify({ext:a.snapshot(),area:a.snapshot({mode:'area'})}))",str(JS.resolve())],text=True))
 groups=[]
 for key,kind in [('outer','horizon'),('ergosurface','ergosurface')]:
  groups.append((kind,[(r['theta'],r[key])for r in stat['ext']['surfaces']],lambda x:125+600*x/180,lambda y:470-275*(y-1.5)/.6))
 for key,kind in [('lower','omega-minus'),('omega','zamo'),('upper','omega-plus')]:
  groups.append((kind,[(r['logOffset'],r[key])for r in stat['ext']['radial']],lambda x:125+600*(x+5)/(math.log10(20)+5),lambda y:978-270*(y+.2)/.56))
 rows=stat['ext']['velocityRows'];lo=min(r['energy']for r in rows)*1.1;hi=max(r['localEnergy']for r in rows)*1.06
 for key,kind in [('energy','killing-energy'),('localEnergy','local-energy')]:
  groups.append((kind,[(r['velocity'],r[key])for r in rows],lambda x:125+600*(x+.99)/1.98,lambda y:1485-270*(y-lo)/(hi-lo)))
 groups.append(('reversible-mass',[(r['fraction'],r['mass'])for r in stat['area']['path']],lambda x:125+600*x,lambda y:1993-270*(y-.88)/.13))
 for kind,points,xf,yf in groups:
  nodes=root.findall('.//s:circle[@data-kind="'+kind+'"]',ns);ck(len(nodes)==len(points),'all static nodes '+kind)
  poly=root.find('.//s:polyline[@data-kind="'+kind+'-line"]',ns);coords=[list(map(float,t.split(',')))for t in poly.get('points').split()];ck(len(coords)==len(points),'all poly vertices')
  for n,point,(x,y)in zip(nodes,coords,points):
   close(float(n.get('cx')),de(xf(x)),'static x',rel=D('1e-10'));close(float(n.get('cy')),de(yf(y)),'static y',rel=D('1e-10'))
   close(point[0],de(xf(x)),'poly x',rel=D('1e-10'));close(point[1],de(yf(y)),'poly y',rel=D('1e-10'))
 print('Formula parity:',len(formulas))
print(json.dumps({'status':'PASS','checks':checks,'exterior':len(d['ext']),'area':len(d['areas']),'strict':d['strict'],'self':d['self']}))
