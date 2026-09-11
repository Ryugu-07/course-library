from pathlib import Path
from decimal import Decimal as D,getcontext
from fractions import Fraction as F
from itertools import combinations
import json,subprocess,random,math,sys,shutil,hashlib,html
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/sinkhorn.js'
FIXTURE=JS.with_name('sinkhorn-snapshot154.json')if len(sys.argv)>1 else ROOT/'course-shared/projects/sinkhorn/run-snapshot.json'
getcontext().prec=80
getcontext().Emin=-9999999;getcontext().Emax=9999999
configs=[dict(steps=str(k),epsilon=e)for k in [0,1,2,7,100]for e in ['0.0001','0.01','0.8','100']]
configs += [dict(mode='bias',epsilon='100',steps='1'),dict(mode='bias',epsilon='0.0001',steps='0'),dict(mode='bias',a='1',b='1',x='0',y='0',steps='0'),dict(mode='underflow',metric='custom',a='0,1',b='1,0',costs='100,100;100,100',epsilon='0.0001',steps='2')]
random.seed(154)
for _ in range(12):
 m,n=random.choice([(1,3),(2,3),(3,2),(3,3)])
 def masses(k):
  cuts=[0]+sorted(random.sample(range(1,100),k-1))+[100]
  return ','.join(str(D(cuts[i+1]-cuts[i])/100)for i in range(k))
 configs.append(dict(metric='custom',a=masses(m),b=masses(n),costs=';'.join(','.join(str(random.randrange(0,10000)/100)for j in range(n))for i in range(m)),epsilon=random.choice(['0.0001','0.1','1','100']),steps=str(random.choice([1,3,20]))))

code=r"""const a=require(process.argv[1]),fs=require('fs'),configs=JSON.parse(fs.readFileSync(0,'utf8'));let invalid=0;
const bad=v=>{let failed=false;try{a.snapshot(v);}catch(e){failed=true;}if(!failed)throw Error('Accepted invalid '+JSON.stringify(v));invalid++;};
const junk=[null,true,false,[],{},'', 'NaN','Infinity','0x1','1e-3','0.0000001','1.2.3'];for(const key of ['a','b','x','y','epsilon','steps'])for(const v of junk)bad({[key]:v});for(const v of junk)bad({metric:'custom',costs:v});
const special=[null,[],false,{mode:'unknown'},{metric:'absolute'},{mode:'bias',metric:'custom'},{a:'0.9'},{b:'0.2,0.3,0.500001'},{a:'-0.1,1.1',x:'0,1'},{a:'0.25,0.25,0.25,0.25',x:'0,1,2,3'},{a:'0.5,0.5',x:'0,0'},{x:'0,1'},{x:'-5.000001,0,1'},{y:'0,1,5.000001'},{epsilon:'0'},{epsilon:'-0.0001'},{epsilon:'100.000001'},{steps:'101'},{steps:'-1'},{steps:'1.0'},{steps:' 1 '},{metric:'custom',costs:'0,1;1,0'},{metric:'custom',costs:'0,1,2;1,0,2;1,2,-0.000001'},{metric:'custom',costs:'0,1,2;1,0,2;1,2,100.000001'},{a:' '.repeat(513)},{metric:'custom',costs:' '.repeat(2049)}];special.forEach(bad);
const live=configs.concat(a.PRESETS.map(p=>p.values)).map(a.snapshot),f=JSON.parse(fs.readFileSync(process.argv[2],'utf8')),frozen=['oneRound','converging','bias','underflow'].map(k=>f[k]);const same=f.provenance.node===process.version&&f.provenance.platform===process.platform&&f.provenance.arch===process.arch;if(same)for(const d of frozen)if(JSON.stringify(a.snapshot(d.parameters))!==JSON.stringify(d))throw Error('Same runtime frozen replay changed');const data=live.concat(frozen).map(d=>{const plots=a.plots(d);return{...d,plots,svgs:plots.map(a.svg),ledgers:a.ledgers(d)};});console.log(JSON.stringify({data,live:live.length,invalid,self:a.selfTest(),frozenReplayExact:same?true:null}));"""
bundle=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve()),str(FIXTURE.resolve())],input=json.dumps(configs).encode()));data=bundle['data']
checks=0
def ck(v,msg):
 global checks;checks+=1;assert v,msg
def dec(q):return D(q.numerator)/D(q.denominator)if isinstance(q,F)else D(str(q))
def near(x,y,msg,rtol=3e-10,atol=3e-10):
 z=float(y);ck(math.isfinite(x)and abs(x-z)<=atol+rtol*abs(z),msg+f': {x} vs {z}')
def unpack(z):
 q=F(int(z['numerator']),int(z['denominator']));near(z['value'],q,'packed float',2e-14,1e-300);return q
def packed(z,q,msg):ck(unpack(z)==q,msg)
def mat(z,P,msg):
 ck(len(z)==len(P)and all(len(a)==len(b)for a,b in zip(z,P)),msg+' shape')
 for a,b in zip(z,P):
  for v,w in zip(a,b):packed(v,w,msg)
def gauss(A,b):
 M=[list(map(F,row))+[F(v)]for row,v in zip(A,b)];n=len(b)
 for j in range(n):
  pivot=next((i for i in range(j,n)if M[i][j]),None)
  if pivot is None:return None
  M[j],M[pivot]=M[pivot],M[j];v=M[j][j];M[j]=[x/v for x in M[j]]
  for i in range(n):
   if i!=j:
    v=M[i][j];M[i]=[x-v*y for x,y in zip(M[i],M[j])]
 return[row[-1]for row in M]
def exact_lp(r,a,b,C):
 m,n=len(a),len(b);A=[[int(i==k//n)for k in range(m*n)]for i in range(m)]+[[int(j==k%n)for k in range(m*n)]for j in range(n-1)];vertices={}
 for edges in combinations(range(m*n),m+n-1):
  values=gauss([[row[k]for k in edges]for row in A],a+b[:-1])
  if values is None or any(v<0 for v in values):continue
  plan=[F(0)]*(m*n)
  for k,v in zip(edges,values):plan[k]=v
  vertices[tuple(plan)]=sum(plan[k]*C[k//n][k%n]for k in range(m*n))
 best=min(vertices.values());packed(r['cost'],best,'dense LP');ck(r['vertices']==len(vertices)and r['optimalVertices']==sum(v==best for v in vertices.values()),'complete LP vertex counts')
 p=[[unpack(v)for v in row]for row in r['plan']];f=list(map(unpack,r['phi']));g=list(map(unpack,r['psi']));ck([sum(row)for row in p]==a and[sum(row[j]for row in p)for j in range(n)]==b and all(v>=0 for row in p for v in row),'LP primal feasible');ck(all(f[i]+g[j]<=C[i][j]for i in range(m)for j in range(n)),'LP dual feasible');ck(sum(a[i]*f[i]for i in range(m))+sum(b[j]*g[j]for j in range(n))==best,'LP dual equality');return best

def exact_repair(r,a,b,C,P,ff,opt):
 m,n=len(a),len(b)
 # Read floating inputs exactly from their JSON decimal. Python Fraction(str) is independent of JS exponent parser.
 F0=[[F(str(v))for v in row]for row in P];mat(r['input'],F0,'input decimal fractions')
 rows=[sum(row)for row in F0];scales=[min(F(1),a[i]/v)if v else F(1)for i,v in enumerate(rows)];R=[[F0[i][j]*scales[i]for j in range(n)]for i in range(m)];cols=[sum(row[j]for row in R)for j in range(n)];cs=[min(F(1),b[j]/v)if v else F(1)for j,v in enumerate(cols)];T=[[R[i][j]*cs[j]for j in range(n)]for i in range(m)];dr=[a[i]-sum(T[i])for i in range(m)];dc=[b[j]-sum(row[j]for row in T)for j in range(n)];mass=sum(dr);Q=[[T[i][j]+(dr[i]*dc[j]/mass if mass else 0)for j in range(n)]for i in range(m)];phi=[F(str(v))if v is not None else F(0)for v in ff];psi=[min(C[i][j]-phi[i]for i in range(m))for j in range(n)];slack=[[C[i][j]-phi[i]-psi[j]for j in range(n)]for i in range(m)]
 for key,v in [('rowScale',scales),('columnScale',cs),('rowDeficit',dr),('columnDeficit',dc),('phi',phi),('psi',psi)]:
  ck(len(r[key])==len(v),'complete '+key)
  for z,q in zip(r[key],v):packed(z,q,key)
 for key,v in [('rowCapped',R),('capped',T),('plan',Q),('slacks',slack)]:mat(r[key],v,key)
 upper=sum(Q[i][j]*C[i][j]for i in range(m)for j in range(n));lower=sum(v*w for v,w in zip(a,phi))+sum(v*w for v,w in zip(b,psi));change=sum(abs(Q[i][j]-F0[i][j])for i in range(m)for j in range(n));err=sum(abs(rows[i]-a[i])for i in range(m))+sum(abs(sum(row[j]for row in F0)-b[j])for j in range(n))
 for key,q in [('deficit',mass),('upper',upper),('lower',lower),('gap',upper-lower),('l1Change',change),('inputL1Residual',err),('roundingBound',2*err)]:packed(r[key],q,key)
 ck([sum(row)for row in Q]==a and[sum(row[j]for row in Q)for j in range(n)]==b,'repaired marginals exact');ck(lower<=opt<=upper,'strict original OT bracket');ck(upper-lower==sum(Q[i][j]*slack[i][j]for i in range(m)for j in range(n)),'complementary gap');ck(change<=2*err and r['identity']and r['certifiedFeasible']and r['certifiedOptimal']==(upper==lower),'certificate assertions');return Q

def scalar_obj(P,C,a,b,e):
 transport=sum(P[i][j]*C[i][j]for i in range(len(a))for j in range(len(b)));kl=sum(P[i][j]*(P[i][j].ln()-a[i].ln()-b[j].ln())for i in range(len(a))for j in range(len(b))if P[i][j]>0);general=kl-sum(v for row in P for v in row)+1
 return dict(transport=transport,kl=kl,generalizedKL=general,regularized=transport+e*general)

def evidence(r,af,bf,Cf,e,steps,opt,keep):
 a,b=[dec(v)for v in af],[dec(v)for v in bf];C=[[dec(v)for v in row]for row in Cf];e=dec(e);m,n=len(a),len(b)
 # Independent positive-kernel scaling at 80 decimal digits. No log-sum-exp update.
 K=[[(-C[i][j]/e).exp()for j in range(n)]for i in range(m)];u=[D(1)]*m;v=[D(1)]*n;hist=[]
 def state(k,phase):
  P=[[a[i]*b[j]*u[i]*K[i][j]*v[j]for j in range(n)]for i in range(m)];f=[e*z.ln()if a[i]>0 else None for i,z in enumerate(u)];g=[e*z.ln()if b[j]>0 else None for j,z in enumerate(v)];shift=sum(a[i]*f[i]for i in range(m)if f[i]is not None);f=[z-shift if z is not None else None for z in f];g=[z+shift if z is not None else None for z in g];rows=[sum(row)for row in P];cols=[sum(row[j]for row in P)for j in range(n)];rr=[rows[i]-a[i]for i in range(m)];cr=[cols[j]-b[j]for j in range(n)];mass=sum(rows);dual=sum(a[i]*f[i]for i in range(m)if f[i]is not None)+sum(b[j]*g[j]for j in range(n)if g[j]is not None)+e*(1-mass)
  return dict(iteration=k,phase=phase,f=f,g=g,plan=P,logs=[[p.ln()if p>0 else None for p in row]for row in P],rows=rows,columns=cols,rowResiduals=rr,columnResiduals=cr,mass=mass,maxResidual=max(map(abs,rr+cr)),l1Residual=sum(map(abs,rr+cr)),dual=dual,**scalar_obj(P,C,a,b,e))
 hist.append(state(0,'initial'))
 for k in range(1,steps+1):
  u=[1/sum(b[j]*K[i][j]*v[j]for j in range(n))if a[i]>0 else D(0)for i in range(m)];hist.append(state(k,'row'))
  v=[1/sum(a[i]*K[i][j]*u[i]for i in range(m))if b[j]>0 else D(0)for j in range(n)];hist.append(state(k,'column'))
 ck(len(r['history'])==(len(hist)if keep else 0),'all half steps retained')
 def compare(z,h):
  ck(z['iteration']==h['iteration']and z['phase']==h['phase'],'half step identity')
  for key in ['f','g','rows','columns','rowResiduals','columnResiduals']:
   ck(len(z[key])==len(h[key]),'full '+key)
   for q,w in zip(z[key],h[key]):
    if w is None:ck(q is None,'inactive potential')
    else:near(q,w,key)
  for key in ['plan','logs']:
   ck(len(z[key])==m and all(len(row)==n for row in z[key]),'all cells '+key)
   for i in range(m):
    for j in range(n):
     w=h[key][i][j];q=z[key][i][j]
     if w is None:ck(q is None,'inactive log')
     elif key=='plan':near(q,w,key,3e-9,1e-300)
     else:near(q,w,key)
  for key in ['mass','maxResidual','l1Residual','transport','kl','generalizedKL','regularized','dual']:near(z[key],h[key],key)
  # Underflow counts are representation diagnostics, not evidence of zero mathematical mass.
  ck(z['underflows']==sum(q is not None and math.exp(q)==0 for row in z['logs']for q in row),'honest underflow count')
 for z,h in zip(r['history'],hist):compare(z,h)
 compare(r['current'],hist[-1]);Q=exact_repair(r['certificate'],af,bf,Cf,r['current']['plan'],r['current']['f'],opt);obj=scalar_obj([[dec(v)for v in row]for row in Q],C,a,b,e)
 for key,w in obj.items():near(r['roundedObjective'][key],w,'rounded '+key)
 near(r['regularizedDual'],hist[-1]['dual'],'dual');near(r['numericalGap'],obj['regularized']-hist[-1]['dual'],'numerical gap');near(r['numericalMidpoint'],(obj['regularized']+hist[-1]['dual'])/2,'numerical midpoint')
 ck(r['numericalGap']>=-1e-9,'primal dual gap up to numeric tolerance')
 return obj['regularized'],hist[-1]['dual']

for no,d in enumerate(data):
 c,r=d['parameters'],d['result'];a=list(map(F,c['a'].split(',')));b=list(map(F,c['b'].split(',')));x=list(map(F,c['x'].split(',')))if c['metric']=='quadratic'else None;y=list(map(F,c['y'].split(',')))if x is not None else None;C=[[(u-v)**2 for v in y]for u in x]if x is not None else[list(map(F,row.split(',')))for row in c['costs'].split(';')];steps=int(c['steps']);e=F(c['epsilon']);opt=exact_lp(r['exact'],a,b,C)
 mat(r['costs'],C,'input costs');near(r['epsilon'],e,'epsilon');ck(r['steps']==steps,'steps');Ha=-sum(dec(v)*dec(v).ln()for v in a if v);Hb=-sum(dec(v)*dec(v).ln()for v in b if v);near(r['sourceEntropy'],Ha,'source entropy');near(r['targetEntropy'],Hb,'target entropy');near(r['asymptoticTransportBiasBound'],dec(e)*min(Ha,Hb),'asymptotic bias bound')
 evidence(r['run'],a,b,C,e,steps,opt,True)
 if c['mode']=='bias':
  eps=sorted(set(min(D(100),max(D('.0001'),dec(e)*D(str(v))))for v in [.25,.5,1,2,4]));ck(len(r['sweep'])==len(eps),'all epsilon sweep entries')
  XX=[[(v-w)**2 for w in x]for v in x];YY=[[(v-w)**2 for w in y]for v in y]
  for z,ee in zip(r['sweep'],eps):
   near(z['epsilon'],ee,'sweep epsilon');U,Dab=evidence(z['ab'],a,b,C,ee,steps,opt,False);Ua,Da=evidence(z['aa'],a,a,XX,ee,steps,F(0),False);Ub,Db=evidence(z['bb'],b,b,YY,ee,steps,F(0),False)
   for key,w in [('estimate',(U+Dab)/2-(Ua+Da+Ub+Db)/4),('lower',Dab-(Ua+Ub)/2),('upper',U-(Da+Db)/2),('width',U-Dab+(Ua-Da+Ub-Db)/2),('biasBound',ee*min(Ha,Hb))]:near(z[key],w,'debiased '+key)
 else:ck(r['sweep']is None,'inactive sweep')
 print(no+1,'PASS',c['mode'],steps,c['epsilon'],flush=True)
print(json.dumps({'status':'PASS','states':len(data),'checks':checks}))

# Appended to the independent scientific checker; all data are fresh live snapshots.
for d in data:
 r=d['result'];N=r['naive'];C=[[float(unpack(v))for v in row]for row in r['costs']];a=[float(unpack(v))for v in r['source']];b=[float(unpack(v))for v in r['target']];e=r['epsilon'];K=[[math.exp(-v/e)for v in row]for row in C]
 for i,row in enumerate(K):
  for j,v in enumerate(row):near(N['kernel'][i][j],v,'direct exponential kernel',2e-14,1e-300);near(N['kernelLogs'][i][j],-C[i][j]/e,'kernel log')
 ck(N['kernelUnderflows']==sum(v==0 for row in K for v in row),'all zero kernel cells counted')
 for key,expected in [('rows',[sum(row)for row in N['plan']]),('columns',[sum(row[j]for row in N['plan'])for j in range(len(b))])]:
  for v,w in zip(N[key],expected):near(v,w,'naive '+key)
 ck(N['completed']<=r['steps'],'direct steps finite');ck(N['failure']is None or N['completed']<N['failure']['iteration']<=r['steps'],'failure not shown as success')
 # A direct iteration on the mass matrix is independent of the implementation's u/v storage.
 P=[[a[i]*b[j]*K[i][j]for j in range(len(b))]for i in range(len(a))];safe=True
 for _ in range(r['steps']):
  rows=[sum(row)for row in P]
  if any(a[i]>0 and rows[i]==0 for i in range(len(a))):safe=False;break
  P=[[P[i][j]*a[i]/rows[i]if rows[i]else 0 for j in range(len(b))]for i in range(len(a))];cols=[sum(row[j]for row in P)for j in range(len(b))]
  if any(b[j]>0 and cols[j]==0 for j in range(len(b))):safe=False;break
  P=[[P[i][j]*b[j]/cols[j]if cols[j]else 0 for j in range(len(b))]for i in range(len(a))]
 if safe and N['failure']is None:
  for i,row in enumerate(P):
   for j,v in enumerate(row):near(N['plan'][i][j],v,'direct mass iteration',3e-9,1e-15)
 if N['failure']is None:near(r['naivePlanDifference'],sum(abs(v-r['run']['current']['plan'][i][j])for i,row in enumerate(N['plan'])for j,v in enumerate(row)),'reported method difference')
 else:ck(r['naivePlanDifference']is None,'no compare of failed method')
 H=r['run']['history']
 for i,h in enumerate(H):
  if i:ck(h['dual']>=H[i-1]['dual']-1e-8,'real dual ascent allows float roundoff')
  if h['phase']in ['row','column']:ck(max(map(abs,h['rowResiduals'if h['phase']=='row'else'columnResiduals']))<1e-8,'updated marginal is satisfied')
print(json.dumps({'status':'PASS','states':len(data),'checks':checks,'oracle':'80-digit direct kernel scaling + exact dense LP + exact feasible repair + naive mass-matrix iteration'}))

import xml.etree.ElementTree as ET,re
def vector(a,b,msg):
 ck(len(a)==len(b),msg+' length')
 for x,y in zip(a,b):near(x,y,msg,2e-12,1e-12)
def svg_check(raw,q):
 E=ET.fromstring(raw)if isinstance(raw,str)else raw;ns={'s':'http://www.w3.org/2000/svg'};ck(E.get('width')=='900'and E.get('height')=='425','native chart size');ck(E.find('s:title',ns).text==q['title'],'accessible title')
 if q['type']=='heat':
  rects=E.findall('s:rect[@data-cell]',ns);ck(len(rects)==len(q['cells']),'full heatmap')
  for node,z in zip(rects,q['cells']):
   ck(node.get('data-cell')==str(z['i'])+'-'+str(z['j']),'cell identity');near(float(node.get('x')),190+150*z['j'],'cell x');near(float(node.get('y')),90+75*z['i'],'cell y');ck(node.get('width')=='150'and node.get('height')=='75','cell geometry');near(float(node.get('fill-opacity')),z['value'],'absolute color scale',0,0);ck(node.get('fill')=='#268bd2','cell color')
  return
 X=lambda v:100+750*(v-q['xmin'])/(q['xmax']-q['xmin']);Y=lambda v:335-250*(v-q['ymin'])/(q['ymax']-q['ymin']);nodes=E.findall('s:circle[@data-series]',ns);ck(len(nodes)==sum(len(z['points'])for z in q['series']),'all plot points')
 for z in q['series']:
  points=[p for p in nodes if p.get('data-series')==z['key']];ck(len(points)==len(z['points']),'all series points')
  for k,(p,(x,y))in enumerate(zip(points,z['points'])):ck(p.get('data-index')==str(k),'point order');near(float(p.get('cx')),X(x),'x coordinate');near(float(p.get('cy')),Y(y),'y coordinate');ck(p.get('fill')==z['color'],'series color')
  lines=[p for p in E.findall('s:polyline',ns)if p.get('data-series')==z['key']];ck(len(lines)==int(z['line']),'connection policy')
  if lines:vector(list(map(float,re.split('[ ,]+',lines[0].get('points')))),[v for x,y in z['points']for v in[X(x),Y(y)]],'line geometry')
def view_check(d):
 r=d['result'];c=d['parameters'];h=r['run']['history'];cur=r['run']['current'];cert=r['run']['certificate'];maxrows=[[i,max(map(abs,z['rowResiduals']))]for i,z in enumerate(h)];maxcols=[[i,max(map(abs,z['columnResiduals']))]for i,z in enumerate(h)];n=max(1,2*r['steps']);ref=[('heat',cur['plan'],cur['logs'])]
 bracket={'bracket':[[0,cert['lower']['value']],[2,cert['upper']['value']]],'exact':[[0,r['exact']['cost']['value']],[2,r['exact']['cost']['value']]],'three':[[0,cert['lower']['value']],[1,r['exact']['cost']['value']],[2,cert['upper']['value']]]}
 if c['mode']=='iterate':ref+=[{'rows':maxrows,'columns':maxcols},{'dual':[[i,z['dual']]for i,z in enumerate(h)],'upper':[[0,r['run']['roundedObjective']['regularized']],[n,r['run']['roundedObjective']['regularized']]]},bracket]
 elif c['mode']=='underflow':ref+=[('heat',r['naive']['kernel'],r['naive']['kernelLogs']),{'rows':maxrows,'columns':maxcols},bracket]
 else:
  ref+=[{key:[[z['epsilon'],z[key]['numericalMidpoint']]for z in r['sweep']]for key in ['ab','aa','bb']},{key:[[z['epsilon'],z[key]]for z in r['sweep']]for key in ['estimate','lower','upper']},{'residual':[[z['epsilon'],z['maxResidual']]for z in r['sweep']]}]
 ck(len(d['plots'])==len(d['svgs'])==4,'four complete views')
 for k,(q,raw,z)in enumerate(zip(d['plots'],d['svgs'],ref)):
  if isinstance(z,tuple):
   _,P,L=z;ck(q['type']=='heat'and q['rows']==len(P)and q['columns']==len(P[0]),'heat dimensions');ck(len(q['cells'])==len(P)*len(P[0]),'all heat cells')
   for cell in q['cells']:
    i,j=cell['i'],cell['j'];near(cell['value'],P[i][j],'actual heat value',0,0);ck(cell['log']==L[i][j],'actual heat log');ck(cell['underflow']==(L[i][j]is not None and P[i][j]==0),'underflow designation')
  else:
   ck(q['type']=='chart'and[z['key']for z in q['series']]==list(z),'all expected plotted series');xx=[];yy=[]
   for series in q['series']:
    expect=z[series['key']];ck(len(series['points'])==len(expect),'complete plot reads')
    for p,a in zip(series['points'],expect):vector(p,a,'actual plot value')
    ck(series['line']==(not(c['mode']!='bias'and k==3 and series['key']in ['bracket','three'])),'discrete cost points are unconnected')
    xx += [p[0]for p in expect];yy += [p[1]for p in expect]
   ck(q['xmin']<=min(xx)and q['xmax']>=max(xx)and q['ymin']<=min(yy)and q['ymax']>=max(yy),'values inside actual domains');ck(not q['markers'],'no fabricated markers')
   if c['mode']=='bias':vector([q['xmin'],q['xmax']],[r['sweep'][0]['epsilon'],r['sweep'][-1]['epsilon']],'actual epsilon axis')
   elif k==3:ck(q['xTicks']==[0,1,2],'three cost labels')
   else:ck(all(int(v)==v for v in q['xTicks']),'integer half-step ticks')
  svg_check(raw,q)
 tabs={z['key']:z for z in d['ledgers']};ck(len(tabs)==len(d['ledgers']),'unique ledger keys')
 ck([row[1]for row in tabs['summary']['rows']]==[v for k,v in r.items()if k not in ['run','naive','sweep']],'all summary fields');ck(tabs['history']['rows']==[list(v.values())for v in h],'every half-step complete');ck([row[1]for row in tabs['naive']['rows']]==list(r['naive'].values()),'all naive diagnostics')
 def run_tables(key,run,C):
  state={**run['current'],**{k:run[k]for k in ['roundedObjective','regularizedDual','numericalGap','numericalMidpoint']}};ck([row[1]for row in tabs[key+'-state']['rows']]==list(state.values()),'all current state fields');ck([row[1]for row in tabs[key+'-certificate']['rows']]==list(run['certificate'].values()),'all exact repair stages and certificate fields');t=run['certificate'];expected=[]
  for i,row in enumerate(run['current']['plan']):
   for j,v in enumerate(row):expected.append([i,j,C[i][j],v,run['current']['logs'][i][j],t['rowCapped'][i][j],t['capped'][i][j],t['plan'][i][j],t['slacks'][i][j]])
  ck(tabs[key+'-cells']['rows']==expected,'every cell transformation')
 run_tables('current',r['run'],r['costs'])
 if r['sweep']:
  ck(tabs['sweep']['rows']==[[z[k]for k in ['epsilon','estimate','lower','upper','width','maxResidual','biasBound']]for z in r['sweep']],'all sweep summaries')
  for i,z in enumerate(r['sweep']):
   for key,coords in [('ab',None),('aa',r['sourcePositions']),('bb',r['targetPositions'])]:
    if coords:
     C=[]
     for x in coords:
      row=[]
      for y in coords:
       q=(unpack(x)-unpack(y))**2;row.append({'numerator':str(q.numerator),'denominator':str(q.denominator),'value':float(q)})
      C.append(row)
    else:C=r['costs']
    run_tables('sweep-'+str(i)+'-'+key,z[key],C)
 for z in tabs.values():ck(all(len(row)==len(z['headers'])for row in z['rows']),'rectangular full ledger')
for d in data:view_check(d)

ck(bundle['invalid']==110,'all invalid inputs rejected');ck(bundle['self']=={'status':'PASS','checks':12},'embedded self tests')
print(json.dumps({'status':'PASS','states':len(data),'checks':checks,'invalid':bundle['invalid'],'self':bundle['self']['checks']}))

f=json.loads(FIXTURE.read_text());ck(f['schema']==1 and f['provenance']['jsSha256']==hashlib.sha256(JS.read_bytes()).hexdigest(),'fixed full snapshot provenance')
ck(f['provenance']=={'date':'2026-09-11','node':'v24.14.0','platform':'darwin','arch':'arm64','jsSha256':hashlib.sha256(JS.read_bytes()).hexdigest()},'fixed environment')
ck(bundle['invalid']==110 and bundle['self']['status']=='PASS'and bundle['self']['checks']==12,'invalid and self checks')
if len(sys.argv)==1:
 from html.parser import HTMLParser
 src=(ROOT/'grad-math/lectures/ot-03-computational.md').read_text();site=(ROOT/'grad-math/site/ot-03-computational.html').read_text()
 formulas=[(a or b).strip()for a,b in re.findall(r'\$\$(.*?)\$\$|(?<!\\)\$(?!\$)(.*?)(?<!\\)\$(?!\$)',src,re.S)]
 actual=[html.unescape(a or b).strip()for a,b in re.findall(r'<(?:span|div) class="arithmatex">(?:\\\((.*?)\\\)|\\\[(.*?)\\\])</(?:span|div)>',site,re.S)]
 ck(formulas==actual,'every source formula preserved');ck(all('<'not in s for s in formulas),'HTML safe formulas');ck(len(re.findall(r'^## [0-9]+\.',src,re.M))==12,'twelve sections')
 ck(not re.search(r'<p>\s*<details|</details>\s*</p>',site),'balanced disclosure paragraphs')
 class Disclosure(HTMLParser):
  def __init__(self):super().__init__();self.stack=[];self.answers=0
  def handle_starttag(self,tag,attrs):
   if tag=='details':
    ck(not self.stack,'no nested answers');kind=dict(attrs).get('class');ck(kind in ['answer','page-toc'],'known disclosure');self.stack.append([kind,0]);self.answers+=kind=='answer'
   if tag=='summary':ck(bool(self.stack),'owned summary');self.stack[-1][1]+=1
  def handle_endtag(self,tag):
   if tag=='details':ck(bool(self.stack),'paired disclosure');ck(self.stack.pop()[1]==1,'one summary')
 parser=Disclosure();parser.feed(re.search(r'<article[^>]*>(.*?)</article>',site,re.S).group(1));ck(parser.answers==4 and not parser.stack,'four complete answers')
 for link in re.findall(r'(?:href|src)="([^"]+)"',site):
  target=link.split('#')[0].split('?')[0]
  if target and not re.match(r'^[a-zA-Z]+:',target)and not target.startswith('/'):ck((ROOT/'grad-math/site'/target).exists(),'local target '+target)
 for course in ['ai-course','grad-math','math-course']:ck((ROOT/course/'site/assets/learning/labs/sinkhorn.js').read_bytes()==JS.read_bytes(),'JS mirror')
 ck((ROOT/'grad-math/site/assets/learning/projects/sinkhorn/run-snapshot.json').read_bytes()==FIXTURE.read_bytes(),'snapshot mirror')
 ck((ROOT/'.github/workflows/course-audit.yml').read_text().count('python tools/check_sinkhorn_full.py')==1,'CI invocation')
 image=ROOT/'grad-math/images/ot-03-sinkhorn-ledgers.svg';ck(image.read_bytes()==(ROOT/'grad-math/site/assets/img/ot-03-sinkhorn-ledgers.svg').read_bytes(),'static mirror')
 panels=ET.parse(image).getroot().findall('.//{http://www.w3.org/2000/svg}svg');ck(len(panels)==4,'four fixed panels');frozen=data[-4:]
 def compare_svg(a,b):
  ck(a.tag==b.tag and set(a.attrib)==set(b.attrib),'full static structure');ck(a.text==b.text and a.tail==b.tail,'static text exact')
  pattern=r'[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?'
  for key,v in a.attrib.items():
   w=b.attrib[key]
   if key in {'x','y','x1','x2','y1','y2','cx','cy','r','width','height','fill-opacity'}:ck(abs(float(v)-float(w))<=1e-9,'static subnanopixel coordinate')
   elif key in {'points','d'}:
    ck(re.sub(pattern,'#',v)==re.sub(pattern,'#',w),'static geometry syntax');av=re.findall(pattern,v);bv=re.findall(pattern,w);ck(len(av)==len(bv),'static geometry length')
    for x,y in zip(av,bv):ck(abs(float(x)-float(y))<=1e-9,'static subnanopixel geometry')
   else:ck(v==w,'static attribute '+key)
  ck(len(a)==len(b),'static children')
  for x,y in zip(a,b):compare_svg(x,y)
 for panel,(run,index)in zip(panels,[(0,0),(1,1),(2,2),(3,1)]):
  panel.attrib.pop('x');panel.attrib.pop('y');compare_svg(panel,ET.fromstring(frozen[run]['svgs'][index]))
 original=ET.fromstring('<svg><text x="10">target</text><polyline points="1,2 3,4"/></svg>');tiny=ET.fromstring(ET.tostring(original));tiny[0].set('x','10.000000000000002');compare_svg(original,tiny)
 for mutation in ['coordinate','point','label','attribute','node']:
  changed=ET.fromstring(ET.tostring(original))
  if mutation=='coordinate':changed[0].set('x','10.000001')
  elif mutation=='point':changed[1].set('points','1,2')
  elif mutation=='label':changed[0].text='wrong'
  elif mutation=='attribute':changed[1].set('stroke','red')
  else:changed.remove(changed[1])
  rejected=False
  try:compare_svg(original,changed)
  except AssertionError:rejected=True
  ck(rejected,'negative control '+mutation)
 table=re.search(r'data-learning-lab="sinkhorn".*?<tbody>(.*?)</tbody>',site,re.S).group(1)
 vals=[float(html.unescape(x))for x in re.findall(r'<tr>\s*<td>.*?</td>\s*<td[^>]*>(.*?)</td>\s*</tr>',table,re.S)]
 a=f['oneRound']['result'];b=f['converging']['result'];c=f['bias']['result'];u=f['underflow']['result'];z=next(q for q in c['sweep']if q['epsilon']==0.8)
 refs=[a['steps'],a['run']['current']['mass'],max(map(abs,a['run']['current']['rowResiduals'])),max(map(abs,a['run']['current']['columnResiduals'])),a['run']['current']['transport'],a['run']['certificate']['upper']['value'],a['run']['certificate']['lower']['value'],a['exact']['cost']['value'],b['run']['current']['maxResidual'],b['run']['numericalGap'],b['run']['roundedObjective']['transport'],b['run']['roundedObjective']['regularized'],z['estimate'],z['width'],u['naive']['kernelUnderflows'],u['naive']['failure']['iteration'],u['run']['current']['maxResidual'],u['run']['certificate']['upper']['value']]
 ck(len(vals)==len(refs)==18,'all 18 fallback values')
 for x,y in zip(vals,refs):near(x,y,'fixed numeric fallback')
 for word in ['不会偷偷归一化','数值诊断','精确证书','run-snapshot.json','overflow-wrap:anywhere']:ck(word in site,'evidence boundary '+word)
 print('formulas',len(formulas))
print(json.dumps({'status':'PASS','liveStates':bundle['live'],'frozenStates':4,'checks':checks,'invalid':bundle['invalid'],'self':bundle['self']['checks']},ensure_ascii=False))
