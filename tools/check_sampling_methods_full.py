"""Independent probability, quadrature, RNG, figure and document verification."""
from pathlib import Path
import subprocess,shutil,json,math,sys,re,html,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/monte-carlo-md.js'
script=r'''
const a=require(process.argv[1]),configs=[...a.PRESETS];
for(const eta of [-4,4])for(const proposal of [0,1e-6,1])for(const initial of ["stationary","plus","minus"])configs.push({eta,proposal,initial,N:17,burn:256,stride:8});
for(const proposal of [0,.5-Number.EPSILON,.5,.5+Number.EPSILON,1-Number.EPSILON/2,1])for(const N of [1,2,255,256])configs.push({proposal,N});
for(const N of [1,2,3,16,256])configs.push({mode:"integration",N,seed:N===1?0:4294967295});
for(const energy of [0,.001,4])for(const turns of [0,.125,.5,1,2])configs.push({mode:"ensemble",energy,turns,N:31,beta:.25,omega:4,phase:.25});
configs.push({mode:"ensemble",energy:4,beta:4,omega:.25,N:256,phase:.33,turns:1.23});
let invalid=0;
for(const mode of ["integration","chain","ensemble"]){
 const keys=["N","seed",...(mode==="chain"?["eta","proposal","burn","stride"]:mode==="ensemble"?["beta","energy","omega","phase","turns"]:[])];
 for(const key of keys)for(const val of ["",null,true,[],{},NaN,Infinity,-Infinity,"1e309","1e-400"]){
  let caught=false;try{a.config({mode,[key]:val});}catch(e){caught=true;}if(!caught)throw Error("accepted invalid "+mode+key+String(val));invalid++;
 }
}
for(const c of [{mode:"x"},{initial:"x"},{N:1.5},{N:0},{N:257},{seed:-1},{seed:4294967296},{eta:4.01},{proposal:1.1},{proposal:1e-7},{burn:-1},{stride:0},{stride:9},{mode:"ensemble",energy:-1},{mode:"ensemble",beta:0},{mode:"ensemble",turns:2.1},null,[]]){
 let caught=false;try{a.config(c);}catch(e){caught=true;}if(!caught)throw Error("accepted invalid config");invalid++;
}
const ignored=a.snapshot({mode:"integration",eta:"",proposal:null,burn:NaN,stride:0,initial:"x",beta:0,energy:-1,omega:null,phase:[],turns:{}});if(ignored.result.rows.length!==128)throw Error("inactive fields");
console.log(JSON.stringify({states:configs.map(c=>{const d=a.snapshot(c),plots=a.plots(d);return{...d,plots,ledgers:a.ledgers(d),svgs:plots.map(a.svg)};}),invalid,self:a.selfTest()}));
'''
data=json.loads(subprocess.check_output(PREFIX+['node','-e',script,str(JS.resolve())],text=True))
checks=0
def ck(v,label):
 global checks
 assert v,label;checks+=1
def close(x,y,label,rtol=2e-9,atol=2e-12):
 ck(isinstance(x,(int,float))and math.isfinite(x)and abs(x-y)<=atol+rtol*abs(y),(label,x,y))
def mm(A,B):return[[sum(A[i][k]*B[k][j]for k in range(2))for j in range(2)]for i in range(2)]
def power(A,n):
 B=[[1.,0.],[0.,1.]]
 while n:
  if n%2:B=mm(B,A)
  A=mm(A,A);n//=2
 return B
def mv(v,A):return[sum(v[i]*A[i][j]for i in range(2))for j in range(2)]
def uniforms(seed,n):
 out=[]
 for i in range(n):
  seed=(1664525*seed+1013904223)%2**32;out.append(((seed+.5)/2**32,seed))
 return out
for d in data['states']:
 s=d['config'];v=d['result'];n=s['N'];mode=s['mode']
 expectedCalls=1+2*(s['burn']+n*s['stride'])if mode=='chain'else n if mode=='integration'else 2*n
 uu=uniforms(s['seed'],expectedCalls);ck(v['calls']==len(uu),'RNG calls');ck(v['lastState']==uu[-1][1],'last RNG state')
 if mode=='chain':
  t=v['theory'];eta=s['eta'];r=s['proposal'];ep=math.exp(eta);em=math.exp(-eta);pi=[ep/(ep+em),em/(ep+em)]
  a=r*min(1,math.exp(-2*eta));b=r*min(1,math.exp(2*eta));P=[[1-a,a],[b,1-b]]
  Q=power(P,s['stride']);init=pi if s['initial']=='stationary'else[1,0]if s['initial']=='plus'else[0,1]
  first=mv(init,power(P,s['burn']+s['stride']))
  dp={(1,1):first[0],(-1,-1):first[1]}
  for j in range(1,n):
   nxt={}
   for (last,total),p0 in dp.items():
    for k,nextState in enumerate([1,-1]):
     key=(nextState,total+nextState);nxt[key]=nxt.get(key,0)+p0*Q[0 if last==1 else 1][k]
   dp=nxt
  mean=math.fsum(k[1]/n*x for k,x in dp.items());variance=math.fsum((k[1]/n-mean)**2*x for k,x in dp.items());target=math.tanh(eta)
  for key,value in [('piPlus',pi[0]),('piMinus',pi[1]),('m',target),('v',1/math.cosh(eta)**2),('a',a),('b',b),('lambda',1-a-b),('R',(1-a-b)**s['stride']),('expected',mean),('variance',variance),('bias',mean-target),('mse',variance+(mean-target)**2),('se',math.sqrt(variance)),('distributionMass',1),('distributionMean',mean),('distributionVariance',variance)]:
   close(t[key],value,'theory '+key)
  for i in range(2):
   for j in range(2):close(t['P'][i][j],P[i][j],'P')
  R=(1-a-b)**s['stride'];factor=(1+R)/(1-R)if abs(R)<1 else None
  if factor is None:ck(t['factor']is None and t['tau']is None and t['asymptoticESS']is None,'boundary not mixing')
  else:
   close(t['factor'],factor,'factor');close(t['tau'],factor/2,'tau');close(t['asymptoticESS'],n/factor,'ESS')
  for row in t['distribution']:
   k=2*row['plusCount']-n
   close(row['endPlus'],dp.get((1,k),0),'DP plus');close(row['endMinus'],dp.get((-1,k),0),'DP minus')
   close(row['probability'],dp.get((1,k),0)+dp.get((-1,k),0),'DP sum');ck(row['probability']>=0,'nonnegative probability')
   close(row['mean'],k/n,'DP coordinate')
  for i,row in enumerate(t['moments']):
   prob=mv(init,power(P,s['burn']+(i+1)*s['stride']))
   close(row['plus'],prob[0],'marginal plus');close(row['minus'],prob[1],'marginal minus')
   close(row['mean'],prob[0]-prob[1],'marginal mean');close(row['variance'],4*prob[0]*prob[1],'marginal variance')
   ck(row['innovation']>=0 and row['contribution']>=0,'nonnegative variance decomposition')
   if i:
    prev=t['moments'][i-1]
    expected=4*(prev['plus']*Q[0][1]*Q[0][0]+prev['minus']*Q[1][0]*Q[1][1])
   else:expected=4*prob[0]*prob[1]
   close(row['innovation'],expected,'innovation');close(row['weight'],math.fsum(R**j for j in range(n-i)),'weight')
   close(row['contribution'],expected*row['weight']**2/n**2,'variance contribution')
  close(math.fsum(x['contribution']for x in t['moments']),variance,'positive contribution total')
  actual=(1 if uu[0][0]<pi[0]else-1)if s['initial']=='stationary'else 1 if s['initial']=='plus'else-1
  ck(v['initialState']==actual,'initial draw');observed=[];proposed=accepted=0
  for j,row in enumerate(v['steps']):
   up,ua=uu[2*j+1][0],uu[2*j+2][0];before=actual
   prop=up<r;acc=prop and ua<min(1,math.exp(-2*eta*actual));proposed+=prop;accepted+=acc
   if acc:actual=-actual
   record=j+1>s['burn']and(j+1-s['burn'])%s['stride']==0
   for key,value in [('t',j+1),('before',before),('proposalU',up),('acceptU',ua),('delta',2*eta*before),('accept',min(1,math.exp(-2*eta*before))),('proposed',prop),('accepted',acc),('after',actual),('record',record),('state',uu[2*j+2][1])]:close(row[key],value,'step '+key)
   if record:observed.append(actual)
  ck(len(observed)==n and len(v['observations'])==n,'actual observations')
  for j,row in enumerate(v['observations']):
   ck(row['state']==observed[j]and row['t']==s['burn']+(j+1)*s['stride'],'record time and state')
   close(row['mean'],sum(observed[:j+1])/(j+1),'running mean')
  meanObs=sum(observed)/n;ss=sum((x-meanObs)**2 for x in observed)
  close(v['mean'],meanObs,'observed mean');close(v['observedError'],meanObs-target,'observed error')
  ck(v['proposedCount']==proposed and v['acceptedCount']==accepted,'counts')
  if proposed:close(v['acceptance'],accepted/proposed,'acceptance')
  else:ck(v['acceptance']is None,'no proposal acceptance undefined')
  if n>1:close(v['sampleVariance'],ss/(n-1),'sample variance');close(v['naiveSE'],math.sqrt(ss/(n-1)/n),'naive SE')
  else:ck(v['sampleVariance']is None and v['naiveSE']is None,'one sample variance undefined')
  for k,row in enumerate(v['acf']):
   close(row['theory'],R**k,'stationary ACF')
   if ss==0:ck(row['empirical']is None,'constant ACF undefined')
   else:close(row['empirical'],sum((observed[i]-meanObs)*(observed[i+k]-meanObs)for i in range(n-k))/ss,'empirical ACF')
 elif mode=='integration':
  iid=strat=0
  for j,row in enumerate(v['rows']):
   u,state=uu[j];x=(j+u)/n;iid+=u*u;strat+=x*x/n
   # Integrate raw powers on a stratum, independently of the shipped expanded polynomial.
   mu=((j+1)**3-j**3)/(3*n*n);raw4=((j+1)**5-j**5)/(5*n**4);var=raw4-mu*mu
   for key,value in [('u',u),('state',state),('x',x),('iid',u*u),('strat',x*x),('layerMean',mu),('layerVariance',var),('iidMean',iid/(j+1)),('partial',strat),('partialTruth',(j+1)**3/(3*n**3))]:close(row[key],value,'integral '+key,atol=1e-11)
  close(v['iid'],iid/n,'IID estimate');close(v['strat'],strat,'strat estimate')
  for row in v['study']:
   k=row['N'];close(row['iidVariance'],4/(45*k),'IID variance')
   close(row['stratVariance'],math.fsum((j*j/3+j/3+4/45)/k**6 for j in range(k)),'strat variance',atol=1e-18)
 else:
  beta,omega,E=s['beta'],s['omega'],s['energy'];amp=math.sqrt(2*E)/omega
  sums=[0.,0.,0.,0.,0.]
  for i,row in enumerate(v['rows']):
   ue,ut=uu[2*i][0],uu[2*i+1][0];e=-math.log(ue)/beta
   angle=2*math.pi*((s['phase']+i*s['turns'])%1);phi=2*math.pi*ut
   q=amp*math.cos(angle);p=-amp*omega*math.sin(angle);cq=math.sqrt(2*e)/omega*math.cos(phi);cp=-math.sqrt(2*e)*math.sin(phi)
   for key,value in [('t',2*math.pi*i*s['turns']/omega),('uEnergy',ue),('uPhase',ut),('energy',e),('q',q),('p',p),('canonicalQ',cq),('canonicalP',cp),('state',uu[2*i+1][1])]:close(row[key],value,'ensemble '+key)
   for j,value in enumerate([q*q,q**4,cq*cq,cq**4,e]):sums[j]+=value
   for key,value in zip(['microQ2','microQ4','canonicalQ2','canonicalQ4','canonicalEnergy'],sums):close(row[key],value/(i+1),'moment prefix')
  for key,value in [('microEnergy',E),('canonicalEnergy',1/beta),('microQ2',E/omega**2),('canonicalQ2',1/(beta*omega**2)),('microQ4',1.5*E*E/omega**4),('canonicalQ4',3/(beta*omega**2)**2)]:close(v['moments'][key],value,'ensemble moment')
  for i,row in enumerate(v['circle']):close(row['q'],amp*math.cos(2*math.pi*i/256),'circle q');close(row['p'],-amp*omega*math.sin(2*math.pi*i/256),'circle p')
  for i,row in enumerate(v['bins']):
   expected=(math.acos(1-(i+1)/8)-math.acos(1-i/8))/math.pi if E else 1 if i==8 else 0
   close(row['probability'],expected,'interval probability')
   freq=sum(x['q']>=row['left']and(x['q']<row['right']or i==15 and x['q']==row['right'])for x in v['rows'])/n
   close(row['observed'],freq,'interval frequency')
  close(sum(x['observed']for x in v['bins']),1,'all actual positions binned')
 # Every graph point is framed and every emitted SVG coordinate preserves it.
 ck(len(d['plots'])==4,'four plots')
 for plotIndex,(plot,source) in enumerate(zip(d['plots'],d['svgs'])):
  e=ET.fromstring(source);ns={'s':'http://www.w3.org/2000/svg'}
  L,W=(325,250)if plot['square']else(100,750)
  xf=lambda x:L+W*(x-plot['xmin'])/(plot['xmax']-plot['xmin'])
  yf=lambda y:335-250*(y-plot['ymin'])/(plot['ymax']-plot['ymin'])
  if plot['square']:close(plot['xmax']-plot['xmin'],plot['ymax']-plot['ymin'],'equal units')
  for series in plot['series']:
   key=series['key']
   if mode=='integration':
    if plotIndex==0:
     expected=[[i/256,(i/256)**2]for i in range(257)]if key=='function'else[[x['u'],x['iid']]if key=='iid'else[x['x'],x['strat']]for x in v['rows']]
    elif plotIndex==1:expected=[[x['i'],x['partial']if key=='partial'else x['partialTruth']]for x in v['rows']]
    elif plotIndex==2:expected=[[x['i'],x['iidMean']if key=='running'else 1/3]for x in v['rows']]
    else:expected=[[math.log10(x['N']),math.log10(math.sqrt(x['iidVariance']if key=='iid-se'else x['stratVariance']))]for x in v['study']]
   elif mode=='chain':
    if plotIndex==0:expected=[[x['t'],x['state']]for x in v['observations']]
    elif plotIndex==1:
     if key=='actual':expected=[[x['t'],x['mean']]for x in v['observations']]
     elif key=='target':expected=[[x['t'],v['theory']['m']]for x in v['observations']]
     else:expected=[[x['t'],math.fsum(q['mean']for q in v['theory']['moments'][:i+1])/(i+1)]for i,x in enumerate(v['theory']['moments'])]
    elif plotIndex==2:expected=[[x['lag'],x['theory']if key=='theory'else x['empirical']]for x in v['acf']if key=='theory'or x['empirical']is not None]
    else:expected=[[x['mean'],x['probability']]for x in v['theory']['distribution']]
   else:
    if plotIndex==0:
     vs=v['circle']if key=='orbit'else v['rows'];expected=[[x['canonicalQ'],x['canonicalP']/s['omega']]if key=='canonical'else[x['q'],x['p']/s['omega']]for x in vs]
    elif plotIndex in [1,2]:
     field=('micro'if key.startswith('micro')else'canonical')+('Q2'if plotIndex==1 else'Q4')
     expected=[[x['i'],v['moments'][field]if key.endswith('truth')else x[field]]for x in v['rows']]
    else:expected=[[(x['left']+x['right'])/2,x['probability']if key=='bins'else x['observed']]for x in v['bins']]
   ck(len(series['points'])==len(expected),'all semantic graph points')
   for (x,y),(u,w)in zip(series['points'],expected):close(x,u,'graph model x');close(y,w,'graph model y')
   nodes=e.findall('.//s:circle[@data-series="'+series['key']+'"]',ns);ck(len(nodes)==len(series['points']),'all nodes')
   poly=e.find('.//s:polyline[@data-series="'+series['key']+'"]',ns)
   coords=[list(map(float,p.split(',')))for p in poly.get('points').split()]if poly is not None else None
   ck((coords is not None)==bool(series['line']),'line policy')
   if coords is not None:ck(len(coords)==len(nodes),'all polyline points')
   for i,(node,(x,y))in enumerate(zip(nodes,series['points'])):
    ck(plot['xmin']<=x<=plot['xmax']and plot['ymin']<=y<=plot['ymax'],'framed')
    close(float(node.get('cx')),xf(x),'SVG x');close(float(node.get('cy')),yf(y),'SVG y')
    if coords is not None:close(coords[i][0],xf(x),'poly x');close(coords[i][1],yf(y),'poly y')
  for i,m in enumerate(plot['markers']):
   node=e.find('.//s:line[@data-marker="'+str(i)+'"]',ns);ck(node is not None,'marker')
   close(float(node.get('x1')),xf(m['x']),'marker x')
 # Full data arrays must remain in the tables; explicit field ordering protects mapping.
 tables={t['key']:t for t in d['ledgers']}
 mappings={'integration':[('samples',v['rows'],'i state u x iid strat layerMean layerVariance iidMean partial partialTruth'),('study',v['study'],'N iidVariance stratVariance')]}if mode=='integration'else{}
 if mode=='chain':mappings={mode:[('steps',v['steps'],'t before proposalU acceptU delta accept proposed accepted after record state'),('observations',v['observations'],'i t state mean'),('moments',v['theory']['moments'],'i t plus minus mean variance innovation weight contribution'),('acf',v['acf'],'lag theory empirical'),('distribution',v['theory']['distribution'],'plusCount mean probability endPlus endMinus')]}
 if mode=='ensemble':mappings={mode:[('samples',v['rows'],'i t uEnergy uPhase energy q p canonicalQ canonicalP microQ2 microQ4 canonicalQ2 canonicalQ4 canonicalEnergy state'),('bins',v['bins'],'i left right probability observed')]}
 for key,values,fields in mappings[mode]:
  ck(tables[key]['rows']==[[v[k]for k in fields.split()]for v in values],'complete table '+key)
 for t in tables.values():ck(all(len(r)==len(t['headers'])for r in t['rows']),'table column count')
ck(data['invalid']>=150,'invalid coverage')
if len(sys.argv)==1:
 from html.parser import HTMLParser
 src=(ROOT/'physics-course/lectures/comp-01-methods.md').read_text();site=(ROOT/'physics-course/site/comp-01-methods.html').read_text()
 formulas=[(a or b).strip()for a,b in re.findall(r'\$\$(.*?)\$\$|(?<!\\)\$(?!\$)(.*?)(?<!\\)\$(?!\$)',src,re.S)]
 actual=[html.unescape(a or b).strip()for a,b in re.findall(r'<(?:span|div) class="arithmatex">(?:\\\((.*?)\\\)|\\\[(.*?)\\\])</(?:span|div)>',site,re.S)]
 ck(formulas==actual,'all formulas preserved');ck(all('<'not in v for v in formulas),'math HTML ambiguity absent')
 ck(not re.search(r'<p>\s*<details|</details>\s*</p>',site),'balanced paragraphs')
 class Disclosure(HTMLParser):
  def __init__(self):super().__init__();self.stack=[];self.answers=0
  def handle_starttag(self,tag,attrs):
   if tag=='details':
    ck(not self.stack,'no nested disclosure');kind=dict(attrs).get('class');ck(kind in ['answer','page-toc'],'known disclosure');self.stack.append([kind,0]);self.answers+=kind=='answer'
   if tag=='summary':ck(bool(self.stack),'summary owned');self.stack[-1][1]+=1
  def handle_endtag(self,tag):
   if tag=='details':ck(bool(self.stack),'no orphan close');ck(self.stack.pop()[1]==1,'one summary')
 p=Disclosure();p.feed(re.search(r'<article[^>]*>(.*?)</article>',site,re.S).group(1));ck(p.answers==4 and not p.stack,'four answers')
 for link in re.findall(r'(?:href|src)="([^"]+)"',site):
  target=link.split('#')[0].split('?')[0]
  if target and not re.match(r'^[a-zA-Z]+:',target)and not target.startswith('/'):ck((ROOT/'physics-course/site'/target).exists(),('local target',target))
 for course in ['physics-course','math-course','grad-math','ai-course']:ck((ROOT/course/'site/assets/learning/labs/monte-carlo-md.js').read_bytes()==JS.read_bytes(),'tracked mirror')
 ck((ROOT/'.github/workflows/course-audit.yml').read_text().count('python tools/check_sampling_methods_full.py')==1,'CI invocation')
 image=ROOT/'physics-course/images/comp-01-sampling-ledgers.svg'
 ck(image.read_bytes()==(ROOT/'physics-course/site/assets/img/comp-01-sampling-ledgers.svg').read_bytes(),'SVG mirror')
 panels=ET.parse(image).getroot().findall('.//{http://www.w3.org/2000/svg}svg');ck(len(panels)==4,'four static panels')
 code="const a=require(process.argv[1]);console.log(JSON.stringify([a.plots(a.snapshot({mode:'integration'}))[3],a.plots(a.snapshot({}))[2],a.plots(a.snapshot({proposal:.9}))[3],a.plots(a.snapshot({mode:'ensemble'}))[0]].map(a.svg)))"
 expected=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve())],text=True))
 for p,s in zip(panels,expected):
  e=ET.fromstring(s);p.attrib.pop('x');p.attrib.pop('y');ck(ET.tostring(p)==ET.tostring(e),'static panel exact')
 table=re.search(r'data-learning-lab="monte-carlo-md".*?<tbody>(.*?)</tbody>',site,re.S).group(1)
 vals=[float(html.unescape(x))for x in re.findall(r'<tr>\s*<td>.*?</td>\s*<td[^>]*>(.*?)</td>\s*</tr>',table,re.S)]
 t=data['states'][0]['result'];th=t['theory']
 refs=[th['lambda'],th['expected'],th['variance'],th['se'],th['iidSE'],th['tau'],th['asymptoticESS'],t['mean'],t['sampleVariance'],t['naiveSE'],t['proposedCount'],t['acceptedCount']]
 ck(len(vals)==len(refs)==12,'fallback complete')
 for v,w in zip(vals,refs):close(v,w,'fallback')
 print('formulas',len(formulas))
print(json.dumps(dict(status='PASS',checks=checks,states=len(data['states']),invalid=data['invalid'],self=data['self'])))
