from pathlib import Path
import itertools,json,subprocess,random,re,sys,shutil,hashlib,html
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/covering-monodromy.js'
FIXTURE=JS.with_name('covering-snapshot156.json')if len(sys.argv)>1 else ROOT/'course-shared/projects/covering-monodromy/run-snapshot.json'
checks=0
def ck(v,m='assertion'):
 global checks
 checks+=1
 if not v:raise AssertionError(m)
def reduce(w):
 while True:
  v=re.sub('aA|Aa|bB|Bb','',w)
  if v==w:return w
  w=v
def inverse(w):return w.swapcase()[::-1]
def action(w,g,n):
 # Evaluate separately from every starting point, rather than composing a permutation array.
 out=[]
 for s in range(n):
  for c in w:s=g[c][s]
  out.append(s)
 return out
def check_walk(r,g):
 s=r['start'];ck(len(r['steps'])==len(r['word']));ck(r['reduced']==reduce(r['word']))
 for j,(c,z)in enumerate(zip(r['word'],r['steps'])):
  to=g[c][s];ck(z=={'index':j,'letter':c,'from':s,'to':to});s=to
 ck(r['end']==s);ck(r['closed']==(s==r['start']))
def int_reduce(a):
 a=a.copy()
 while True:
  for i in range(len(a)-1,0,-1):
   if a[i]==-a[i-1]:del a[i-1:i+1];break
  else:return a
def check_rewrite(r,T,g):
 reps={v['sheet']:v['word']for v in T['representatives']};edges={z['edge']:z for z in T['edges']};basis={v['index']:v['reducedWord']for v in T['basis']};current=r['from'];unreduced=[]
 ck(len(r['steps'])==len(r['word']))
 for i,(c,z)in enumerate(zip(r['word'],r['steps'])):
  to=g[c][current];edge=c+':'+str(current)if c.islower()else c.lower()+':'+str(to);e=edges[edge];b=0 if e['tree']else e['basis']*(1 if c.islower()else -1)
  before=int_reduce(unreduced)
  if b:unreduced.append(b)
  ck(z=={'index':i,'letter':c,'from':current,'to':to,'edge':edge,'basisLetter':b,'before':before,'after':int_reduce(unreduced)})
  current=to
 reduced=int_reduce(unreduced);ck(r['basisWord']==reduced);ck(r['to']==current);ck(r['closed']==(current==r['from']))
 expanded=''.join(basis[k]if k>0 else inverse(basis[-k])for k in reduced);complete=reps[r['from']]+r['word']+inverse(reps[current]);ck(r['expandedWord']==expanded);ck(r['completedLoop']==complete);ck(r['reducedExpansion']==reduce(expanded));ck(r['reducedCompletedLoop']==reduce(complete));ck(reduce(expanded)==reduce(complete));ck(r['identity'])
def verify(d):
 p,r=d['parameters'],d['result'];a=list(map(int,p['a'].split(',')));b=list(map(int,p['b'].split(',')));n=len(a);start=int(p['start']);g={'a':a,'b':b,'A':[a.index(i)for i in range(n)],'B':[b.index(i)for i in range(n)]};ck(r['n']==n);ck(r['generators']==g)
 allp=list(itertools.permutations(range(n)));idx={v:i for i,v in enumerate(allp)};parents=list(range(len(allp)))
 def root(i):
  while parents[i]!=i:i=parents[i]
  return i
 # Independent group generation: connected component in the entire finite Cayley graph, union-find.
 for i,q in enumerate(allp):
  for c in ['a','b']:
   j=idx[tuple(q[g[c][s]]for s in range(n))];parents[root(i)]=root(j)
 M={q for i,q in enumerate(allp)if root(i)==root(0)}
 ck({tuple(v['permutation'])for v in r['imageElements']}==M);ck(len(r['imageElements'])==len(M));ck(r['imageOrder']==len(M));ck(r['kernelIndex']==len(M))
 for i,z in enumerate(r['imageElements']):
  ck(z['index']==i);ck(z['permutation']==action(z['witness'],g,n))
  if i:ck(0<=z['parent']<i);ck(z['witness']==r['imageElements'][z['parent']]['witness']+z['letter'])
  else:ck(z['witness']==''and z['parent']is None and z['letter']is None)
 ck(len(r['imageTransitions'])==4*len(M))
 for z in r['imageTransitions']:
  src=r['imageElements'][z['from']]['permutation'];dst=r['imageElements'][z['to']]['permutation'];ck(dst==[g[z['letter']][s]for s in src])
 orbits=sorted({tuple(sorted({q[s]for q in M}))for s in range(n)});ck(r['orbits']==[list(v)for v in orbits]);selected=next(v for v in orbits if start in v);ck(r['selectedOrbit']==list(selected));ck(r['componentIndex']==len(selected));ck(r['connected']==(len(orbits)==1))
 stab=[z['index']for z in r['imageElements']if z['permutation'][start]==start];ck(r['imageStabilizerIndices']==stab);ck(r['imageStabilizerOrder']==len(stab));ck(len(stab)*len(selected)==len(M));ck(r['normalForConnected']==(len(stab)==1 if len(orbits)==1 else None))
 # Centralizer is verified against every image-group element, independently of generator-only filtering.
 deck=[q for q in allp if all(q[v[s]]==v[q[s]]for v in M for s in range(n))];ck(r['deckPermutations']==[list(v)for v in deck]);ck(r['deckOrder']==len(deck));ck(len(r['deckCandidateChecks'])==len(allp))
 for i,(q,z)in enumerate(zip(allp,r['deckCandidateChecks'])):
  failures=[{'letter':c,'sheet':s,'deckAfterMove':q[g[c][s]],'moveAfterDeck':g[c][q[s]]}for c in ['a','b']for s in range(n)if q[g[c][s]]!=g[c][q[s]]]
  ck(z=={'index':i,'permutation':list(q),'commutes':q in deck,'failures':failures})
 ck(r['deckOrbits']==[list(v)for v in sorted({tuple(sorted({q[s]for q in deck}))for s in range(n)})])
 if r['connected']:
  ck(all(q==tuple(range(n))or all(q[s]!=s for s in range(n))for q in deck),'deck action free on connected total cover')
  ck((len(deck)==n)==r['normalForConnected'])
 ck(r['wordPermutation']==action(p['word'],g,n));ck(len(r['wordRuns'])==n)
 for i,z in enumerate(r['wordRuns']):ck(z['start']==i and z['word']==p['word']);check_walk(z,g)
 ck(r['selectedRun']==r['wordRuns'][start])
 rels={'rose':[],'torus':['abAB'],'klein':['abAb'],'projective':['aa','b'],'circle':['b']}.get(p['space'],[]if p['relators']==''else p['relators'].split(';'));ck(r['relators']==rels);ck(len(r['relationRuns'])==len(rels));valid=True
 for j,(w,z)in enumerate(zip(rels,r['relationRuns'])):
  ac=action(w,g,n);valid &= ac==list(range(n));ck(z['index']==j and z['word']==w and z['reduced']==reduce(w));ck(z['permutation']==ac);ck(z['identity']==(ac==list(range(n))));ck(z['failures']==[i for i,v in enumerate(ac)if i!=v]);ck(len(z['runs'])==n)
  for i,v in enumerate(z['runs']):ck(v['start']==i and v['word']==w);check_walk(v,g)
 ck(r['validForPresentation']==valid);ck(r['subgroupPresentationAvailable']==valid)
 T=r['tree'];ck(T['start']==start);ck(T['vertices']==list(selected));rep={z['sheet']:z for z in T['representatives']};ck(set(rep)==set(selected));ck(rep[start]['word']=='');ck(len(T['treeEdges'])==len(selected)-1);ck(len(set(T['treeEdges']))==len(T['treeEdges']));ck(len(T['edges'])==2*len(selected))
 distance=[[0 if i==j else 99 for j in range(n)]for i in range(n)]
 for i in range(n):
  for c in g:distance[i][g[c][i]]=min(distance[i][g[c][i]],1)
 for k in range(n):
  for i in range(n):
   for j in range(n):distance[i][j]=min(distance[i][j],distance[i][k]+distance[k][j])
 for s,z in rep.items():
  ck(action(z['word'],g,n)[start]==s);ck(len(z['word'])==distance[start][s]);ck(reduce(z['word'])==z['word'])
  if s==start:ck(z['parent']is None)
  else:
   parent=z['parent'];ck(z['word']==rep[parent['from']]['word']+parent['letter']);ck(g[parent['letter']][parent['from']]==s)
 for z in T['edges']:
  v,c,j=z['from'],z['letter'],z['to'];ck(z['edge']==c+':'+str(v));ck(j==g[c][v]);ck(z['tree']==(z['edge']in T['treeEdges']));raw=rep[v]['word']+c+inverse(rep[j]['word']);ck(z['rawWord']==raw and z['reducedWord']==reduce(raw));ck(action(raw,g,n)[start]==start)
  if z['tree']:ck(z['basis']is None and reduce(raw)=='')
  else:ck(z['basis']>=1 and reduce(raw)!='')
 basis=[z for z in T['edges']if not z['tree']];ck(T['basis']==[{**z,'index':i+1}for i,z in enumerate(basis)]);ck([z['basis']for z in basis]==list(range(1,len(basis)+1)));ck(T['graphRank']==len(basis)==len(selected)+1);ck(r['freeRankForRose']==(len(basis)if p['space']=='rose'else None))
 check_rewrite(r['rewrite'],T,g);ck(r['rewrite']['from']==start and r['rewrite']['word']==p['word'])
 ck(len(r['liftedRelations'])==(len(selected)*len(rels)if valid else 0))
 for z in r['liftedRelations']:
  s,j=z['sheet'],z['relationIndex'];ck(z['relator']==rels[j]);ck(z['conjugated']==rep[s]['word']+rels[j]+inverse(rep[s]['word']));ck(z['rewrite']['word']==z['conjugated']and z['rewrite']['from']==start);check_rewrite(z['rewrite'],T,g);ck(z['rewrite']['closed'])
def main():
 global JS
 if len(sys.argv)>1 and sys.argv[1].endswith('.json'):data=json.loads(Path(sys.argv[1]).read_text())
 else:
  if len(sys.argv)>1:JS=Path(sys.argv[1]).resolve()
  more=[];rng=random.Random(156)
  for n in range(1,6):
   for i in range(8):
    a=list(range(n));b=list(range(n));rng.shuffle(a);rng.shuffle(b)
    more.append({'a':','.join(map(str,a)),'b':','.join(map(str,b)),'start':str(i%n),'word':''.join(rng.choice('aAbB')for _ in range(i*7)),'space':['rose','torus','klein','circle'][i%4]})
  code="const a=require(process.argv[1]);console.log(JSON.stringify(a.PRESETS.map(p=>p.values).concat(JSON.parse(process.argv[2])).map(a.snapshot)))"
  data=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS),json.dumps(more)]))
 for d in data:verify(d)
 print(json.dumps({'status':'PASS','states':len(data),'checks':checks}))
 return data
def close(a,b,msg='coordinate'):
 ck(abs(a-b)<=1e-9,msg)
def view_contract(d,plots,ledgers,svgs):
 import xml.etree.ElementTree as ET
 import math
 r=d['result'];mode=d['parameters']['mode'];n=r['n'];ck(len(plots)==len(svgs)==4)
 def walks(runs):return {'sheet'+str(z['start']):[[0,z['start']]]+[[v['index']+1,v['to']]for v in z['steps']]for z in runs}
 if mode=='action':expected=[None,walks(r['wordRuns']),{'fixed':[[z['index'],sum(v==i for i,v in enumerate(z['permutation']))]for z in r['imageElements']]},{'deck':[[z['index'],int(z['commutes'])]for z in r['deckCandidateChecks']]}];lines=[None,True,False,False]
 elif mode=='relations':
  rr=r['relationRuns'];chosen=next((z for z in rr if not z['identity']),rr[0]if rr else None)
  expected=[None,{'failures':[[z['index'],len(z['failures'])]for z in rr]},walks(chosen['runs']if chosen else r['wordRuns']),{'sizes':[[0,n],[1,r['imageOrder']],[2,r['deckOrder']],[3,r['imageStabilizerOrder']]]}];lines=[None,False,True,False]
 else:
  last={'relations':[[i,len(z['rewrite']['basisWord'])]for i,z in enumerate(r['liftedRelations'])]}if r['validForPresentation']and r['relators']else {'letters':[[z['index'],z['basisLetter']]for z in r['rewrite']['steps']]}
  expected=[None,{'basis':[[z['index'],len(z['reducedWord'])]for z in r['tree']['basis']]},{'rewrite':[[0,0]]+[[z['index']+1,len(z['after'])]for z in r['rewrite']['steps']]},last];lines=[None,False,True,False]
 for k,(p,s,e)in enumerate(zip(plots,svgs,expected)):
  root=ET.fromstring(s);ck(root.get('width')=='900'and root.get('height')=='425'and root.get('role')=='img');ck(root.find('{*}title').text==p['title'])
  if k==0:
   ck(p['type']=='maps'and p['n']==n and p['showTree']==(mode=='schreier'))
   all_edges=root.findall('{*}line');arrows=root.findall('{*}polygon');nodes=root.findall('{*}circle');labels=[z for z in root.findall('{*}text')if z.get('data-basis-label')is not None]
   ck(len(all_edges)==len(arrows)==2*n and len(nodes)==4*n);ck(len(labels)==(2*n if mode=='schreier'else 0))
   T={z['edge']:z for z in r['tree']['edges']}
   for j,c in enumerate(['a','b']):
    m=p['maps'][j];ck(m['key']==c and m['permutation']==r['generators'][c]);ck(len(m['edges'])==n)
    x0=85+440*j;x1=x0+270;y=lambda i:215 if n==1 else 100+220*i/(n-1)
    for i,to in enumerate(r['generators'][c]):
     edge=T.get(c+':'+str(i));ref={'from':i,'to':to,'tree':edge['tree']if edge else False,'basis':edge['basis']if edge else None,'inSelected':edge is not None};ck(m['edges'][i]==ref)
     z=all_edges[j*n+i];ck(z.get('data-map')==c and z.get('data-from')==str(i)and z.get('data-to')==str(to));ck(z.get('stroke')==m['color']);istree=mode=='schreier'and ref['tree'];ck(z.get('data-tree')==str(istree).lower()and z.get('stroke-dasharray')==('7 4'if istree else'none'))
     for key,v in [('x1',x0),('x2',x1),('y1',y(i)),('y2',y(to))]:close(float(z.get(key)),v)
     dx,dy=270,y(to)-y(i);le=math.hypot(dx,dy);ux,uy=dx/le,dy/le;px,py=x0+.82*dx,y(i)+.82*dy
     coords=[[px+7*ux,py+7*uy],[px-7*ux+4*uy,py-7*uy-4*ux],[px-7*ux-4*uy,py-7*uy+4*ux]];ar=arrows[j*n+i];ck(ar.get('data-map-arrow')==c and ar.get('data-from')==str(i)and ar.get('fill')==m['color'])
     actual=[list(map(float,v.split(',')))for v in ar.get('points').split()];ck(len(actual)==3)
     for aa,bb in zip(actual,coords):close(aa[0],bb[0]);close(aa[1],bb[1])
     for side,x in [('from',x0),('to',x1)]:
      nn=[z for z in nodes if z.get('data-map-node')==c+'-'+side+'-'+str(i)];ck(len(nn)==1);close(float(nn[0].get('cx')),x);close(float(nn[0].get('cy')),y(i))
     if mode=='schreier':ck(labels[j*n+i].text==('其他分支'if not edge else 'T'if edge['tree']else'h'+str(edge['basis'])))
   continue
  ck(p['type']=='chart'and not p['square']);ck({z['key']:z['points']for z in p['series']}==e,'complete graph series')
  ck(all(z['line']==lines[k]for z in p['series']),'discrete connection policy');ck(all(v==int(v)for v in p['xTicks']+p['yTicks']),'integer ticks');ck(not p['markers'])
  xmin,xmax,ymin,ymax=[p[key]for key in ['xmin','xmax','ymin','ymax']];ck(xmax>xmin and ymax>ymin)
  X=lambda v:100+750*(v-xmin)/(xmax-xmin);Y=lambda v:335-250*(v-ymin)/(ymax-ymin)
  circles=root.findall('{*}circle');ck(len(circles)==sum(len(z['points'])for z in p['series']))
  for ss in p['series']:
   cc=[z for z in circles if z.get('data-series')==ss['key']];ck(len(cc)==len(ss['points']))
   for j,(z,(x,y))in enumerate(zip(cc,ss['points'])):
    ck(z.get('data-index')==str(j)and z.get('fill')==ss['color']);ck(xmin<=x<=xmax and ymin<=y<=ymax);close(float(z.get('cx')),X(x));close(float(z.get('cy')),Y(y))
   ll=[z for z in root.findall('{*}polyline')if z.get('data-series')==ss['key']];ck(len(ll)==int(ss['line']))
   if ll:
    vals=[list(map(float,v.split(',')))for v in ll[0].get('points').split()];ck(len(vals)==len(ss['points']));ck(ll[0].get('stroke')==ss['color'])
    for (x,y),(u,v)in zip(ss['points'],vals):close(X(x),u);close(Y(y),v)
 table={z['key']:z for z in ledgers};ck(len(table)==len(ledgers))
 def summ(key,obj,exclude=[]):ck([v[1]for v in table[key]['rows']]==[v for k,v in obj.items()if k not in exclude],'all summary '+key)
 def rows(key,values):ck(table[key]['rows']==[list(z.values())for z in values],'complete records '+key)
 summ('summary',r,['imageElements','imageTransitions','deckCandidateChecks','wordRuns','selectedRun','relationRuns','tree','rewrite','liftedRelations'])
 for key,field in [('image','imageElements'),('image-transitions','imageTransitions'),('deck','deckCandidateChecks'),('relations','relationRuns'),('lifted-relations','liftedRelations')]:rows(key,r[field])
 for z in r['wordRuns']:summ('walk-'+str(z['start']),z,['steps']);rows('walk-'+str(z['start'])+'-steps',z['steps'])
 summ('tree',r['tree'],['edges','basis']);rows('edges',r['tree']['edges']);rows('basis',r['tree']['basis']);summ('rewrite',r['rewrite'],['steps']);rows('rewrite-steps',r['rewrite']['steps'])
 for t in ledgers:ck(all(len(z)==len(t['headers'])for z in t['rows']))

data=main()
live=len(data)
f=json.loads(FIXTURE.read_text());frozen=[f[k]for k in ["action","partial","disconnected","schreier"]]
for d in frozen:verify(d)
data+=frozen
code=r"""const a=require(process.argv[1]),fs=require('fs'),data=JSON.parse(fs.readFileSync(0,'utf8')),f=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));const same=f.provenance.node===process.version&&f.provenance.platform===process.platform&&f.provenance.arch===process.arch;if(same)for(const d of data.slice(-4))if(JSON.stringify(a.snapshot(d.parameters))!==JSON.stringify(d))throw Error('Same runtime frozen replay changed');let invalid=0;
const bad=v=>{let threw=false;try{a.snapshot(v)}catch(e){threw=true}if(!threw)throw Error('Accepted invalid '+JSON.stringify(v));invalid++};
for(const k of ['a','b'])for(const v of [null,true,[],{},'', '0,0','1,2','0, 1','0,1,2,3,4,5','0,1,2,3,5','0.0','-1','00'])bad({[k]:v});
for(const v of [null,true,[],{},'', '3','-1','0.5','00','1e0',' 0'])bad({start:v});
for(const v of [null,true,[],{},'a A','c','a'.repeat(65)])bad({word:v});
for(const v of [null,true,[],{},'a A','c','a'.repeat(65),'a;b;a;b;a','a'.repeat(261)])bad({space:'custom',relators:v});
[null,[],false,{mode:'bad'},{space:'bad'},{a:'0'},{b:'0,1'}].forEach(bad);
console.log(JSON.stringify({invalid,self:a.selfTest(),data:data.map(d=>{const plots=a.plots(d);return{plots,ledgers:a.ledgers(d),svgs:plots.map(a.svg)}})}));"""
bundle=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve()),str(FIXTURE.resolve())],input=json.dumps(data).encode()))
for d,v in zip(data,bundle['data']):view_contract(d,v['plots'],v['ledgers'],v['svgs'])
ck(bundle['invalid']==60);ck(bundle['self']=={'status':'PASS','checks':12})
print(json.dumps({'status':'PASS','states':len(data),'checks':checks,'invalid':bundle['invalid'],'self':bundle['self']['checks']}))

data=[{**d,**v}for d,v in zip(data,bundle["data"])]
f=json.loads(FIXTURE.read_text());ck(f['schema']==1 and f['provenance']['jsSha256']==hashlib.sha256(JS.read_bytes()).hexdigest(),'fixed full snapshot provenance')
ck(f['provenance']=={'date':'2026-09-11','node':'v24.14.0','platform':'darwin','arch':'arm64','jsSha256':hashlib.sha256(JS.read_bytes()).hexdigest()},'fixed environment')
ck(bundle['invalid']==60 and bundle['self']['status']=='PASS'and bundle['self']['checks']==12,'invalid and self checks')
if len(sys.argv)==1:
 from html.parser import HTMLParser
 src=(ROOT/'grad-math/lectures/at-02-covering.md').read_text();site=(ROOT/'grad-math/site/at-02-covering.html').read_text()
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
 for course in ['ai-course','grad-math','math-course']:ck((ROOT/course/'site/assets/learning/labs/covering-monodromy.js').read_bytes()==JS.read_bytes(),'JS mirror')
 ck((ROOT/'grad-math/site/assets/learning/projects/covering-monodromy/run-snapshot.json').read_bytes()==FIXTURE.read_bytes(),'snapshot mirror')
 ck((ROOT/'.github/workflows/course-audit.yml').read_text().count('python tools/check_covering_monodromy_full.py')==1,'CI invocation')
 image=ROOT/'grad-math/images/at-02-covering-ledgers.svg';ck(image.read_bytes()==(ROOT/'grad-math/site/assets/img/at-02-covering-ledgers.svg').read_bytes(),'static mirror')
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
 for panel,(run,index)in zip(panels,[(0,0),(1,2),(2,0),(3,0)]):
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
 table=re.search(r'data-learning-lab="covering-monodromy".*?<tbody>(.*?)</tbody>',site,re.S).group(1)
 vals=[html.unescape(x).strip()for x in re.findall(r'<tr>\s*<td>.*?</td>\s*<td[^>]*>(.*?)</td>\s*</tr>',table,re.S)]
 a=f['action']['result'];b=f['partial']['result'];c=f['disconnected']['result'];d=f['schreier']['result']
 refs=[a['n'],a['imageOrder'],a['imageStabilizerOrder'],a['deckOrder'],a['freeRankForRose'],a['selectedRun']['end'],b['n'],','.join(map(str,b['relationRuns'][0]['failures'])),b['relationRuns'][0]['runs'][3]['end'],'是'if b['validForPresentation']else'否',len(c['orbits']),c['imageOrder'],c['deckOrder'],d['tree']['graphRank'],len(d['tree']['treeEdges']),len(d['liftedRelations']),'是'if d['validForPresentation']else'否','不适用'if d['freeRankForRose']is None else d['freeRankForRose']]
 ck(len(vals)==len(refs)==18,'all 18 fallback values')
 for x,y in zip(vals,refs):ck(x==str(y),'fixed full fallback')
 for word in ['一维骨架','子群指数','所有纤维','run-snapshot.json','overflow-wrap:anywhere']:ck(word in site,'evidence boundary '+word)
 print('formulas',len(formulas))
print(json.dumps({'status':'PASS','liveStates':live,'frozenStates':4,'checks':checks,'invalid':bundle['invalid'],'self':bundle['self']['checks']},ensure_ascii=False))
