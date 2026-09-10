"""Independent finite-tree probability, metric and covering arithmetic."""
from pathlib import Path
from decimal import Decimal as D,getcontext
import math,json,subprocess,shutil,sys
getcontext().prec=65
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/chaining-tree.js'
code=r"""
const a=require(process.argv[1]),states=[];
for(const depth of [1,2,5,6])for(const rho of [0,.01,.42,1])for(const seed of [0,3,31031])states.push(a.snapshot({depth,rho,seed,reference:2**depth-1}));
for(const sigma of [.01,4])for(const delta of [1e-6,.5])states.push(a.snapshot({sigma,delta,depth:6,seed:4294967295}));
let invalid=0;function bad(x){let ok=false;try{a.snapshot(x)}catch(e){ok=true}if(!ok)throw Error('bad accepted '+JSON.stringify(x));invalid++;}
for(const x of [null,[],1,true,'x'])bad(x);
for(const [key,vs]of Object.entries({depth:[0,7,1.5,'',null],sigma:[0,5,'',null],rho:[-.1,1.1,.001,'',null],seed:[-1,4294967296,1.5,'',null],delta:[0,1,.0000001,'',null],reference:[-1,32,1.5,'',null]}))for(const v of vs)bad({[key]:v});
const cover=states.map(d=>({config:d.config,at:d.distances.map(e=>a.coverage(d,e)),mid:d.entropy.map(r=>a.coverage(d,(r.lower+r.upper)/2))}));
console.log(JSON.stringify({states,cover,invalid,self:a.selfTest(),ui:states.filter((_,i)=>i%6===0).map(d=>({d,tables:a.ledgers(d),plots:a.plots(d)}))}));
"""
data=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve())],text=True));checks=0
def ck(x,m):
 global checks
 assert x,m;checks+=1
def de(x):return D.from_float(x)if isinstance(x,float)else D(x)
def close(x,y,label,rel=D('4e-12'),scale=D(1)):
 x=de(x);y=de(y);ck(abs(x-y)<=rel*max(abs(y),de(scale)),(label,str(x),str(y)))
def normals(seed):
 state=seed
 while True:
  state=(1664525*state+1013904223)%2**32;u=(state+.5)/2**32
  state=(1664525*state+1013904223)%2**32;v=(state+.5)/2**32
  radius=math.sqrt(-2*math.log(u));theta=2*math.pi*v
  yield radius*math.cos(theta);yield radius*math.sin(theta)
def path_ids(index,depth):return [(k,index//2**(depth-k))for k in range(1,depth+1)]
LN2=D(2).ln()
for state,cover in zip(data['states'],data['cover']):
 s=state['config'];K=s['depth'];a=de(s['sigma']);rho=de(s['rho']);rng=normals(s['seed']);values={(0,0):D(0)};deltas={};variances=[]
 expectedchain=D(0);highchain=D(0);samplechain=D(0);budget=D(0)
 for k in range(1,K+1):
  sigma=a*rho**(k-1)if k>1 else a;variances.append(sigma*sigma)
  row=state['levels'][k-1];observed=[]
  ck(row['count']==2**k,'complete edges count')
  for index,n in enumerate(state['nodes'][k]):
   g=next(rng);increment=sigma*de(g);parent=values[(k-1,index//2)];value=parent+increment
   ck(n['parent']==index//2 and n['level']==k and n['index']==index,'node ancestry')
   close(n['gaussian'],g,'seeded Gaussian',rel=D('5e-14'))
   close(n['sigma'],sigma,'geometric scale',rel=D('1e-14'),scale=abs(sigma))
   close(n['increment'],increment,'increment',scale=abs(sigma));close(n['value'],value,'path sum',scale=a)
   values[k,index]=value;deltas[k,index]=increment;observed.append(increment)
  contribution=sigma*(D(2*k)*LN2).sqrt();failure=de(s['delta'])*D(2)**(-k)/(1-D(2)**(-K));high=sigma*(2*(D(k)*LN2-failure.ln())).sqrt()
  expectedchain+=contribution;highchain+=high;budget+=failure;samplechain+=max(observed)
  for key,expected in [('variance',sigma*sigma),('expected',contribution),('cumulative',expectedchain),('failure',failure),('high',high),('highCumulative',highchain),('sampleCumulative',samplechain),('maxIncrement',max(observed))]:close(row[key],expected,'level '+key,scale=a if key not in ['variance','failure']else abs(expected))
  ck(0<=row['maxIndex']<2**k,'max edge index');close(state['nodes'][k][row['maxIndex']]['increment'],max(observed),'argmax')
 variance=sum(variances);single=(2*variance*K*LN2).sqrt();hSingle=(2*variance*(D(K)*LN2-de(s['delta']).ln())).sqrt()
 maximum=max(v for (k,i),v in values.items()if k==K)
 for key,val in [('variance',variance),('single',single),('chain',expectedchain),('highSingle',hSingle),('highChain',highchain),('maximum',maximum),('sampleChain',samplechain)]:close(state[key],val,'summary '+key,scale=a)
 close(budget,s['delta'],'total union budget',rel=D('1e-60'),scale=de(s['delta']))
 ck(maximum<=samplechain+D('1e-50'),'sample max bound')
 for leaf in state['leaves']:
  ids=path_ids(leaf['index'],K);ck(leaf['addresses']==[i for k,i in ids],'all path addresses');ck(leaf['address']==format(leaf['index'],f'0{K}b'),'binary address')
  close(leaf['value'],sum(deltas[p]for p in ids),'leaf total',scale=a)
  for x,p in zip(leaf['increments'],ids):close(x,deltas[p],'leaf edge',scale=a)
 for r,row in enumerate(state['metric']):
  first=path_ids(s['reference'],K);second=path_ids(r,K);common=set(first)&set(second)
  covariance=sum((variances[k-1]for k,i in common),D(0));symmetric=set(first)^set(second);distance=sum((variances[k-1]for k,i in symmetric),D(0)).sqrt()
  ck(row['common']==len(common),'LCA length');close(row['covariance'],covariance,'shared edge covariance',scale=variance);close(row['distance'],distance,'symmetric-difference L2 distance',scale=distance)
  close(row['sampleDifference'],values[K,r]-values[K,s['reference']],'sample difference',scale=a)
 expectedI=D(0);distances=[(2*sum(variances[r:],D(0))).sqrt()for r in range(K+1)]
 for r,row in enumerate(state['entropy'],1):
  width=distances[r-1]-distances[r];height=(D(r)*LN2).sqrt();expectedI+=width*height
  for key,val in [('lower',distances[r]),('upper',distances[r-1]),('width',width),('height',height),('contribution',width*height),('cumulative',expectedI)]:close(row[key],val,'entropy '+key,scale=a)
  ck(row['count']==2**r,'prefix covering count')
  if width>0:ck(cover['mid'][r-1]==2**r,'interior coverage')
 close(state['integral'],expectedI,'exact step integral',scale=a)
 for r,count in enumerate(cover['at']):
  # At zero-distance degeneracy, first positive layer determines distinct classes.
  first=next(j for j in range(K+1)if distances[r]>=distances[j])
  ck(count==2**first,'closed radius boundary')
 ck(state['highSingle']>=state['single']and state['highChain']>=state['chain'],'tail penalty nonnegative')
 if s['rho']==0:ck(cover['at'][-1]==2,'zero metric quotient')
 if s['rho']==1 and K>1:ck(state['chain']>state['single'],'flat scale counterexample')
 if K==1 and s['seed']==3:ck(state['maximum']<0 and state['sampleChain']<0,'negative maximum retained')
for q in data['ui']:
 d=q['d'];tables={t['key']:t for t in q['tables']}
 ck(len(tables['nodes']['rows'])==2**(d['config']['depth']+1)-2,'every edge exposed')
 ck(len(tables['leaves']['rows'])==2**d['config']['depth'],'every leaf exposed')
 for p in q['plots']:
  ck(p['xmax']>p['xmin']and p['ymax']>p['ymin'],'positive plot range')
  for series in p['series']:
   for x,y in series['points']:ck(p['xmin']<=x<=p['xmax']and p['ymin']<=y<=p['ymax'],'signed point visible')
if len(sys.argv)==1:
 import re,html,xml.etree.ElementTree as ET
 src=(ROOT/'grad-math/lectures/hdp-04-chaining.md').read_text();site=(ROOT/'grad-math/site/hdp-04-chaining.html').read_text()
 formulas=[(a or b).strip()for a,b in re.findall(r'\$\$(.*?)\$\$|(?<!\\)\$(?!\$)(.*?)(?<!\\)\$(?!\$)',src,re.S)]
 actual=[html.unescape(a or b).strip()for a,b in re.findall(r'<(?:span|div) class="arithmatex">(?:\\\((.*?)\\\)|\\\[(.*?)\\\])</(?:span|div)>',site,re.S)]
 ck(formulas==actual,'all source formulas preserved');ck(src.count('<details class="exercise"')==4,'four complete answers')
 mirrors=list(ROOT.glob('*/site/assets/learning/labs/chaining-tree.js'))
 ck(all(ROOT/(c+'/site/assets/learning/labs/chaining-tree.js')in mirrors for c in ['grad-math','math-course','ai-course']),'three existing mirrors')
 for p in mirrors:ck(p.read_bytes()==JS.read_bytes(),'JS exact mirror')
 svg=ROOT/'grad-math/images/hdp-04-chaining-ledgers.svg';ck(svg.read_bytes()==(ROOT/'grad-math/site/assets/img/hdp-04-chaining-ledgers.svg').read_bytes(),'SVG exact mirror')
 ns={'s':'http://www.w3.org/2000/svg'};root=ET.parse(svg).getroot();panels=root.findall('.//s:svg',ns);ck(len(panels)==4,'four actual panels')
 d=json.loads(subprocess.check_output(PREFIX+['node','-e',"const a=require(process.argv[1]),d=a.snapshot(),n=a.snapshot({depth:1,seed:3});console.log(JSON.stringify({d,plots:[a.plots(d)[1],a.plots(d)[2],a.plots(n)[1]]}))",str(JS.resolve())],text=True))
 K=d['d']['config']['depth'];height=max(420,2**K*13+120);xf=lambda k:55+795*k/K;yf=lambda k,i:70+(height-125)*(i+.5)/2**k
 nodes=panels[0].findall('.//s:circle',ns);edges=panels[0].findall('.//s:line',ns);ck(len(nodes)==2**(K+1)-1 and len(edges)==len(nodes)-1,'all static tree nodes and edges')
 for n in nodes:
  k,i=map(int,n.get('data-node').split(':'));close(float(n.get('cx')),xf(k),'tree x');close(float(n.get('cy')),yf(k,i),'tree y')
 for n in edges:
  k,i=map(int,n.get('data-edge').split(':'))
  for attr,value in [('x1',xf(k-1)),('y1',yf(k-1,i//2)),('x2',xf(k)),('y2',yf(k,i))]:close(float(n.get(attr)),value,'tree edge '+attr)
 for panel,q in zip(panels[1:],d['plots']):
  xf=lambda v:100+750*(v-q['xmin'])/(q['xmax']-q['xmin']);yf=lambda v:335-250*(v-q['ymin'])/(q['ymax']-q['ymin'])
  zero=panel.find('.//s:line[@data-zero]',ns);close(float(zero.get('y1')),yf(0),'explicit zero axis')
  for series in q['series']:
   nodes=panel.findall('.//s:circle[@data-series="'+series['key']+'"]',ns);ck(len(nodes)==len(series['points']),'all static plot nodes')
   for i,(node,(x,y))in enumerate(zip(nodes,series['points'])):
    ck(int(node.get('data-index'))==i,'node index');close(float(node.get('cx')),xf(x),'plot x');close(float(node.get('cy')),yf(y),'plot y')
    ck(node.get('data-open')==str(bool(series.get('endOpen')and i==len(nodes)-1)).lower(),'closed/open endpoints')
   if series['line']:
    poly=panel.find('.//s:polyline[@data-series="'+series['key']+'"]',ns);pts=[list(map(float,t.split(',')))for t in poly.get('points').split()]
    ck(len(pts)==len(nodes),'whole polyline')
    for (x,y),(u,v)in zip(pts,series['points']):close(x,xf(u),'poly x');close(y,yf(v),'poly y')
   if series.get('area'):
    area=panel.find('.//s:rect[@data-area="'+series['key']+'"]',ns);(u,v),(w,z)=series['points']
    for key,val in [('x',xf(u)),('y',yf(v)),('width',xf(w)-xf(u)),('height',yf(0)-yf(v))]:close(float(area.get(key)),val,'entropy area '+key)
 print('Formula parity:',len(formulas))
print(json.dumps({'status':'PASS','checks':checks,'states':len(data['states']),'invalid':data['invalid'],'self':data['self']}))
