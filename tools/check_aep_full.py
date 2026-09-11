"""AEP full exact-probability, chart and publication contract; standard library only."""
from pathlib import Path
from fractions import Fraction as F
from math import comb,log2,isclose
import json,subprocess,random,shutil,sys,hashlib,re,html,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/aep-typicality.js'
FIXTURE=JS.with_name('aep-snapshot149.json')if len(sys.argv)>1 else ROOT/'course-shared/projects/aep-typicality/run-snapshot.json'
configs=[{}, {'p':'0.5','epsilon':'0'}, {'p':'0','epsilon':'0'}, {'p':'1','epsilon':'0'}, {'n':1,'ell':0}, {'n':2,'p':'0.5','ell':1}, {'p':'0.9','epsilon':'0'}, {'n':256,'p':'0.000001','epsilon':'0.1'}, {'n':256,'p':'0.999999','ell':256}, {'n':100,'p':'0.9','epsilon':'0.4'}, {'n':256,'p':'0.5','epsilon':'0','ell':255}]
configs += [dict(mode='mixture',**c) for c in [{},{'n':256},{'pA':'0','pB':'1'},{'pA':'0.5','pB':'0.5','epsilon':'0'},{'weight':'0'},{'weight':'1'},{'n':1},{'pA':'0.000001','pB':'0.999999','n':256},{'pA':'0.1','pB':'0.9','epsilon':'0.05'}]]
configs += [dict(mode='markov',n=6,**c)for c in [{},{'a':'1','b':'1'},{'a':'0','b':'0'},{'a':'0','b':'0','initial':'0'},{'a':'0','b':'0.4'},{'a':'0.1','b':'0.2','start':'chosen','initial':'1'},{'modelA':'0'},{'modelB':'1'},{'modelInitial':'0'},{'a':'0.5','b':'0.5','modelA':'0.5','modelB':'0.5'},{'a':'0.000001','b':'0.999999','start':'chosen','initial':'0.000001'}]]
random.seed(149)
for i in range(24):
 mode=['iid','mixture','markov'][i%3];c={'mode':mode,'n':random.randint(1,9 if mode=='markov' else 120)}
 if mode=='iid':c.update(p=str(random.randint(0,100)/100),epsilon=str(random.randint(0,20)/100),ell=random.randint(0,120))
 elif mode=='mixture':c.update(pA=str(random.randint(0,100)/100),pB=str(random.randint(0,100)/100),weight=str(random.randint(0,100)/100),epsilon=str(random.randint(0,20)/100),ell=random.randint(0,120))
 else:c.update(**{k:str(random.randint(0,100)/100)for k in ['a','b','initial','modelA','modelB','modelInitial']},start='chosen')
 configs.append(c)

code=r"""const a=require(process.argv[1]),fs=require('fs'),c=JSON.parse(fs.readFileSync(0,'utf8')),f=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const decorate=d=>({...d,plots:a.plots(d),ledgers:a.ledgers(d),svgs:a.plots(d).map(a.svg)});
let invalid=0;const bad=(v)=>{let fail=false;try{a.snapshot(v);}catch(e){fail=true;}if(!fail)throw Error('Accepted invalid '+JSON.stringify(v));invalid++;};
const junk=[null,true,false,[],{},'', 'NaN','Infinity','0x1','1e-3','0.0000001','-0.1','1.2.3'];
for(const [base,keys]of [[{},['p','epsilon','ell','n']],[{mode:'mixture'},['pA','pB','weight','epsilon','ell','n']],[{mode:'markov',n:3},['a','b','initial','modelA','modelB','modelInitial','n']]])for(const k of keys)for(const x of junk)bad({...base,[k]:x});
for(const v of [{p:1.1},{epsilon:2.1},{n:0},{n:257},{ell:257},{ell:-1},{mode:'unknown'},{mode:'markov',n:10},{mode:'markov',n:3,start:'unknown'},{mode:'markov',n:3,a:1.1},{mode:'mixture',weight:1.1},{mode:'mixture',pA:1.1},{mode:'mixture',pB:1.1},null,[],false])bad(v);
const live=c.concat(a.PRESETS.map(p=>p.values)).map(a.snapshot),frozen=['biased','empty','periodic','mix'].map(k=>f[k]);
console.log(JSON.stringify({states:live.concat(frozen).map(decorate),live:live.length,invalid,self:a.selfTest()}));"""
bundle=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve()),str(FIXTURE.resolve())],input=json.dumps(configs).encode()))
data=bundle['states']
checks=0
def ck(v,m):
 global checks;checks+=1
 assert v,m
def close(x,y,m):ck(x is not None and isclose(x,float(y),rel_tol=4e-12,abs_tol=3e-12),f'{m}: {x} != {y}')
def mf(q):return float(q)
def lg(q):return log2(q.numerator)-log2(q.denominator)
def ent(q):return sum(-mf(z)*lg(z)for z in [q,1-q]if z)
def packed(d,q,m):
 ck(F(int(d['numerator']),int(d['denominator']))==q,m+' exact')
 ck(d['status']==('zero'if not q else 'underflow'if float(q)==0 else 'finite'),m+' status')
 if q and not float(q):ck(d['value']is None,m+' underflow null')
 else:close(d['value'],q,m+' approximation')
 if q>0:close(d['log2'],lg(q),m+' log')
 else:ck(d['log2']is None,m+' log zero')
def coded(d,raw,c):
 remain=2**c['ell'];covered=F(0);recovered=0
 ranks=sorted([r for r in raw if r[2]],key=lambda r:(-r[2],r[0]))
 ck(len(ranks)==len(d['allocation']),'allocation length')
 for j,((k,count,p),z)in enumerate(zip(ranks,d['allocation'])):
  take=min(count,remain);remain-=take;covered+=take*p;recovered+=take
  ck((z['rank'],z['k'],int(z['count']),int(z['selected']))==(j+1,k,count,take),'allocation')
  packed(z['sequenceProbability'],p,'code probability');packed(z['selectedMass'],take*p,'code mass')
 support=sum(count for k,count,p in raw if p)
 ck(int(d['capacity'])==2**c['ell']and int(d['unused'])==remain and int(d['recovered'])==recovered and int(d['support'])==support,'code totals')
 ck(d['zeroErrorBits']==(support-1).bit_length(),'support bits')
 packed(d['covered'],covered,'coverage');packed(d['error'],1-covered,'error')
for state in data:
 c,d=state['parameters'],state['result'];n=c['n'];mode=c['mode']
 if mode in ['iid','mixture']:
  if mode=='iid':
   p=F(str(c['p']));h=ent(p);raw=[(k,comb(n,k),p**k*(1-p)**(n-k))for k in range(n+1)]
   close(d['entropy'],h,'H binary');packed(d['p'],p,'p');variance=p*(1-p)*lg((1-p)/p)**2 if 0<p<1 else 0.0
   close(d['variance'],variance,'variance')
   if F(str(c['epsilon'])):close(d['chebyshev'],variance/n/F(str(c['epsilon']))**2,'Chebyshev')
   else:ck(d['chebyshev']is None,'no epsilon0 bound')
  else:
   pA,pB,w=[F(str(c[k]))for k in ['pA','pB','weight']];h=w*ent(pA)+(1-w)*ent(pB)
   pairs=[(pA**k*(1-pA)**(n-k),pB**k*(1-pB)**(n-k))for k in range(n+1)]
   raw=[(k,comb(n,k),w*a+(1-w)*b)for k,(a,b)in enumerate(pairs)]
   close(d['entropyRate'],h,'mixture rate');conditional=0.0
   for (k,count,q),(a,b),z in zip(raw,pairs,d['posterior']):
    packed(z['jointA'],w*a,'joint A');packed(z['jointB'],(1-w)*b,'joint B')
    if q:
     post=w*a/q;packed(z['posteriorA'],post,'posterior');close(z['posteriorEntropy'],ent(post),'posterior H');conditional+=mf(count*q)*ent(post)
    else:ck(z['posteriorA']is None and z['posteriorEntropy']is None,'impossible posterior')
   close(d['conditionalLatentEntropy'],conditional,'conditional latent');close(d['latentEntropy'],ent(w),'latent H');close(d['mutualInformation'],ent(w)-conditional,'MI');close(d['entropyIdentity'],n*h+ent(w)-conditional,'mixture identity');close(d['entropyIdentityGap'],0,'identity gap')
  ck(len(d['rows'])==n+1,'full types');total=F(0);typical=F(0);count=0;H=0.0
  for (k,num,q),z in zip(raw,d['rows']):
   ck(z['k']==k and int(z['count'])==num,'binomial');packed(z['sequenceProbability'],q,'sequence');packed(z['mass'],num*q,'mass');total+=num*q
   if q:
    info=-lg(q)/n;H+=mf(num*q)*info*n;close(z['information'],info,'information');close(z['difference'],info-h,'difference');close(z['margin'],mf(F(str(c['epsilon'])))-abs(info-h),'margin')
    ck(z['typical']==(z['margin']>=0),'membership actual margin')
   else:ck(z['information']is None and z['difference']is None and not z['typical'],'impossible type')
   if z['typical']:typical+=num*q;count+=num
  packed(d['total'],total,'total');ck(total==1,'normalization');packed(d['typicalMass'],typical,'typical mass');packed(d['atypicalMass'],1-typical,'atypical mass');ck(int(d['typicalCount'])==count and d['empty']==(count==0),'count');ck(d['typicalBits']==((count-1).bit_length()if count else None),'typical bits');close(d['blockEntropy'],H,'H block')
  if count:close(d['typicalLogCount'],lg(F(count)),'log count')
  else:ck(d['typicalLogCount']is None,'empty log')
  coded(d['coding'],raw,c)
 else:
  a,b,mu,ma,mb,mi=[F(str(c[k]))for k in ['a','b','initial','modelA','modelB','modelInitial']];Q=[[1-a,a],[b,1-b]];R=[[1-ma,ma],[mb,1-mb]];stationary=[b/(a+b),a/(a+b)]if a+b else None;pi=stationary if c['start']=='stationary'and stationary else [1-mu,mu];nu=[1-mi,mi]
  for M,name in [(Q,'Q'),(R,'modelQ')]:
   for i in range(2):
    for j in range(2):packed(d[name][i][j],M[i][j],name)
  for i in range(2):packed(d['initial'][i],pi[i],'initial');packed(d['modelInitial'][i],nu[i],'model initial')
  isstat=all(pi[j]==sum(pi[i]*Q[i][j]for i in range(2))for j in range(2));ck(d['stationaryActual']==isstat,'stationarity')
  if isstat:close(d['entropyRate'],sum(mf(pi[i])*ent(Q[i][1])for i in range(2)),'entropy rate')
  else:ck(d['entropyRate']is None,'nonstationary no claimed rate')
  ck(len(d['rows'])==2**n,'all paths');H=CE=KL=0.0;unsupported=False
  for index,z in enumerate(d['rows']):
   path=f'{index:0{n}b}';x=list(map(int,path));p=pi[x[0]];q=nu[x[0]];counts=[[0,0],[0,0]]
   for u,v in zip(x,x[1:]):p*=Q[u][v];q*=R[u][v];counts[u][v]+=1
   ck(z['path']==path and z['counts']==counts,'path transitions');packed(z['probability'],p,'path P');packed(z['modelProbability'],q,'path Q')
   ck(z['possible']==bool(p)and z['unsupported']==bool(p and not q),'path support')
   if p:H-=mf(p)*lg(p);close(z['information'],-lg(p),'path information')
   else:ck(z['information']is None,'impossible P')
   if q:close(z['modelInformation'],-lg(q),'model information');close(z['empiricalCrossEntropy'],-lg(q)/n,'sample CE')
   else:ck(z['modelInformation']is None and z['empiricalCrossEntropy']is None,'model infinity')
   if p and q:CE-=mf(p)*lg(q);KL+=mf(p)*lg(p/q);close(z['logRatio'],lg(p/q),'log ratio')
   elif p:unsupported=True
  close(d['blockEntropy'],H,'path H');close(d['chainEntropy'],H,'chain H');close(d['chainGap'],0,'chain gap');ck(d['infiniteCrossEntropy']==unsupported,'infinite CE')
  if unsupported:ck(d['crossEntropy']is None and d['relativeEntropy']is None and d['identityGap']is None,'infinite outputs')
  else:close(d['crossEntropy'],CE,'expected CE');close(d['relativeEntropy'],KL,'expected KL');close(d['identityGap'],0,'CE identity')
  dist=pi;acc=0.0
  for t,z in enumerate(d['chain']):
   h=ent(pi[1])if t==0 else sum(mf(dist[i])*ent(Q[i][1])for i in range(2));acc+=h;close(z['conditionalEntropy'],h,'conditional chain');close(z['cumulativeEntropy'],acc,'cumulative chain')
   if t:
    for i in range(2):packed(z['previousDistribution'][i],dist[i],'chain dist')
    dist=[sum(dist[i]*Q[i][j]for i in range(2))for j in range(2)]

print('science PASS',checks)
def vector(a,b,m):
 ck(len(a)==len(b),m+' length')
 for x,y in zip(a,b):close(x,y,m)
def expected_series(d):
 c,r=d['parameters'],d['result'];n=c['n']
 if c['mode']=='markov':return[
  {'true':[[z['index'],z['probability']['value']]for z in r['rows']if z['probability']['value']is not None],'model':[[z['index'],z['modelProbability']['value']]for z in r['rows']if z['modelProbability']['value']is not None]},
  {'information':[[z['index'],z['information']/n]for z in r['rows']if z['information']is not None],'loss':[[z['index'],z['modelInformation']/n]for z in r['rows']if z['modelInformation']is not None],'rate':[]if r['entropyRate']is None else[[0,r['entropyRate']],[2**n-1,r['entropyRate']]]},
  {'conditional':[[z['t'],z['conditionalEntropy']]for z in r['chain']],'rate':[]if r['entropyRate']is None else[[0,r['entropyRate']],[n-1,r['entropyRate']]]},
  {'ratio':[[z['index'],z['logRatio']]for z in r['rows']if z['logRatio']is not None]}]
 alloc={z['k']:z for z in r['coding']['allocation']};h=r['center'];eps=float(c['epsilon'])
 out=[
  {'mass':[[z['k'],z['mass']['value']]for z in r['rows']if z['mass']['value']is not None],'typical':[[z['k'],z['mass']['value']]for z in r['rows']if z['typical']and z['mass']['value']is not None]},
  {'information':[[z['k'],z['information']]for z in r['rows']if z['information']is not None],'center':[[0,h],[n,h]],'lower':[[0,h-eps],[n,h-eps]],'upper':[[0,h+eps],[n,h+eps]]},
  {'all':[[z['k'],log2(int(z['count']))]for z in r['rows']],'chosen':sorted([[z['k'],log2(int(z['selected']))]for z in r['coding']['allocation']if int(z['selected'])])},
  {'available':[[z['k'],z['mass']['value']]for z in r['rows']if z['mass']['value']is not None],'selected':[[z['k'],alloc[z['k']]['selectedMass']['value']if z['k']in alloc else 0]for z in r['rows']if z['k']not in alloc or alloc[z['k']]['selectedMass']['value']is not None]}]
 if c['mode']=='mixture':out.append({'posterior':[[z['k'],z['posteriorA']['value']]for z in r['posterior']if z['posteriorA']is not None and z['posteriorA']['value']is not None],'prior':[[0,r['weight']['value']],[n,r['weight']['value']]]})
 return out
def svg_check(raw,q):
 e=ET.fromstring(raw)if isinstance(raw,str)else raw;ns={'s':'http://www.w3.org/2000/svg'}
 ck(e.get('width')=='900'and e.get('height')=='425','readable native size');ck(e.find('s:title',ns).text==q['title'],'accessible chart title')
 X=lambda v:100+750*(v-q['xmin'])/(q['xmax']-q['xmin']);Y=lambda v:335-250*(v-q['ymin'])/(q['ymax']-q['ymin'])
 nodes=e.findall('s:circle[@data-series]',ns);ck(len(nodes)==sum(len(s['points'])for s in q['series']),'all chart points')
 for s in q['series']:
  pts=[v for v in nodes if v.get('data-series')==s['key']];ck(len(pts)==len(s['points']),'all series points')
  for k,(node,(x,y))in enumerate(zip(pts,s['points'])):
   ck(node.get('data-index')==str(k),'point order');close(float(node.get('cx')),X(x),'chart x');close(float(node.get('cy')),Y(y),'chart y');ck(node.get('fill')==s['color'],'chart color')
  lines=[v for v in e.findall('s:polyline',ns)if v.get('data-series')==s['key']];ck(len(lines)==int(s['line']),'connection policy')
  if lines:
   nums=list(map(float,re.split('[ ,]+',lines[0].get('points'))))if lines[0].get('points')else[];vector(nums,[z for x,y in s['points']for z in[X(x),Y(y)]],'all line coordinates')
def view_check(d):
 expected=expected_series(d);r=d['result'];ck(len(d['plots'])==len(expected),'all plots')
 for i,(q,ref)in enumerate(zip(d['plots'],expected)):
  ck([s['key']for s in q['series']]==list(ref),'all named series')
  for s in q['series']:
   ck(len(s['points'])==len(ref[s['key']]),'full record mapping')
   for x,y in zip(s['points'],ref[s['key']]):vector(x,y,'record plot coordinate')
   ck(s['line']==(s['key']!='typical'),'discrete guide policy')
  n=d['parameters']['n'];xmax=2**n-1 if d['parameters']['mode']=='markov'and i!=2 else n-1 if d['parameters']['mode']=='markov'else n
  ck(q['xmin']==0 and q['xmax']==max(1,xmax),'finite x domain')
  ck(q['xTicks']==list(dict.fromkeys(int(max(1,xmax)*i/4+.5)for i in range(5))),'integer ticks for discrete indices')
  vals=[0]+[p[1]for s in q['series']for p in s['points']];lo=min(vals);hi=max(vals);pad=(hi-lo or 1)*.08
  close(q['ymin'],lo-pad,'unclipped y minimum');close(q['ymax'],hi+pad,'unclipped y maximum');svg_check(d['svgs'][i],q)
 tabs={t['key']:t for t in d['ledgers']};ck(len(tabs)==len(d['ledgers']),'unique table keys')
 ck([z[1]for z in tabs['summary']['rows']]==[v for k,v in r.items()if k not in ['rows','coding','posterior','chain']],'all summary fields')
 for key,rows in [('rows',r['rows'])]+([('allocation',r['coding']['allocation'])]if 'coding'in r else[])+([('posterior',r['posterior'])]if 'posterior'in r else[])+([('chain',r['chain'])]if 'chain'in r else[]):
  ck(tabs[key]['rows']==[list(row.values())for row in rows],'all complete table fields '+key)
 if 'coding'in r:ck([z[1]for z in tabs['coding']['rows']]==[v for k,v in r['coding'].items()if k!='allocation'],'all codebook summary')
 for t in tabs.values():
  ck(bool(t['title'])and all(len(row)==len(t['headers'])for row in t['rows']),'rectangular labeled tables')
for d in data:view_check(d)
f=json.loads(FIXTURE.read_text());ck(f['schema']==1 and f['provenance']['jsSha256']==hashlib.sha256(JS.read_bytes()).hexdigest(),'fixed full snapshot provenance')
ck(f['provenance']=={'date':'2026-09-11','node':'v24.14.0','platform':'darwin','arch':'arm64','jsSha256':hashlib.sha256(JS.read_bytes()).hexdigest()},'fixed environment')
ck(bundle['invalid']==237 and bundle['self']['status']=='PASS'and bundle['self']['checks']==12,'invalid and self checks')
if len(sys.argv)==1:
 from html.parser import HTMLParser
 src=(ROOT/'grad-math/lectures/it2-01-aep.md').read_text();site=(ROOT/'grad-math/site/it2-01-aep.html').read_text()
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
 for course in ['ai-course','grad-math','math-course']:ck((ROOT/course/'site/assets/learning/labs/aep-typicality.js').read_bytes()==JS.read_bytes(),'JS mirror')
 ck((ROOT/'grad-math/site/assets/learning/projects/aep-typicality/run-snapshot.json').read_bytes()==FIXTURE.read_bytes(),'snapshot mirror')
 ck((ROOT/'.github/workflows/course-audit.yml').read_text().count('python tools/check_aep_full.py')==1,'CI invocation')
 image=ROOT/'grad-math/images/it2-01-aep-ledgers.svg';ck(image.read_bytes()==(ROOT/'grad-math/site/assets/img/it2-01-aep-ledgers.svg').read_bytes(),'static mirror')
 panels=ET.parse(image).getroot().findall('.//{http://www.w3.org/2000/svg}svg');ck(len(panels)==4,'four fixed panels');frozen=data[-4:]
 def compare_svg(a,b):
  ck(a.tag==b.tag and set(a.attrib)==set(b.attrib),'full static structure');ck(a.text==b.text and a.tail==b.tail,'static text exact')
  pattern=r'[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?'
  for key,v in a.attrib.items():
   w=b.attrib[key]
   if key in {'x','y','x1','x2','y1','y2','cx','cy','r','width','height'}:ck(abs(float(v)-float(w))<=1e-9,'static subnanopixel coordinate')
   elif key in {'points','d'}:
    ck(re.sub(pattern,'#',v)==re.sub(pattern,'#',w),'static geometry syntax');av=re.findall(pattern,v);bv=re.findall(pattern,w);ck(len(av)==len(bv),'static geometry length')
    for x,y in zip(av,bv):ck(abs(float(x)-float(y))<=1e-9,'static subnanopixel geometry')
   else:ck(v==w,'static attribute '+key)
  ck(len(a)==len(b),'static children')
  for x,y in zip(a,b):compare_svg(x,y)
 for panel,(run,index)in zip(panels,[(0,0),(0,1),(2,2),(3,1)]):
  svg_check(panel,frozen[run]['plots'][index]);panel.attrib.pop('x');panel.attrib.pop('y');compare_svg(panel,ET.fromstring(frozen[run]['svgs'][index]))
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
 table=re.search(r'data-learning-lab="aep-typicality".*?<tbody>(.*?)</tbody>',site,re.S).group(1)
 vals=[float(html.unescape(x))for x in re.findall(r'<tr>\s*<td>.*?</td>\s*<td[^>]*>(.*?)</td>\s*</tr>',table,re.S)]
 b,e,p,m=[f[k]['result']for k in ['biased','empty','periodic','mix']]
 refs=[b['entropy'],b['typicalMass']['value'],b['typicalLogCount'],b['typicalBits'],b['coding']['covered']['value'],b['coding']['error']['value'],b['rows'][100]['information'],int(e['typicalCount']),e['coding']['covered']['value'],p['blockEntropy'],p['entropyRate'],p['crossEntropy'],p['relativeEntropy'],m['entropyRate'],m['blockEntropy'],m['mutualInformation'],m['typicalMass']['value'],m['blockEntropy']/100]
 ck(len(vals)==len(refs)==18,'all 18 fallback values')
 for x,y in zip(vals,refs):close(x,y,'fixed numeric fallback')
 for word in ['不可检测','区间证书','不替代SMB定理','run-snapshot.json','overflow-wrap:anywhere']:ck(word in site,'evidence boundary '+word)
 print('formulas',len(formulas))
print(json.dumps({'status':'PASS','liveStates':bundle['live'],'frozenStates':4,'checks':checks,'invalid':bundle['invalid'],'self':bundle['self']['checks']},ensure_ascii=False))
