"""Finite graph enumeration, Prüfer tree oracle, integer combinatorics, SVGs."""
from pathlib import Path
from decimal import Decimal,localcontext
import itertools,json,math,re,shutil,subprocess,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
JS=r"""
const a=require('./course-shared/labs/graph-counting.js'),assert=require('assert');
const graphs=[],models=[],plots=[],coins=[],derangements=[],determinants=[];
for(let n=1;n<=5;n++){
 const pairs=[];for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)pairs.push([i,j]);
 for(let mask=0;mask<2**pairs.length;mask++){
  const matrix=Array.from({length:n},()=>Array(n).fill(0));pairs.forEach(([i,j],bit)=>{if(mask&2**bit)matrix[i][j]=matrix[j][i]=1});
  graphs.push({n,mask,connected:a.isConnected(matrix),degree:a.degrees(matrix),trees:a.spanningTreeCount(matrix),
   simple:Array.from({length:n},(_,start)=>Array.from({length:n+2},(_,k)=>a.countSimplePaths(matrix,start,k))),
   walks:Array.from({length:n},(_,start)=>Array.from({length:13},(_,k)=>a.countWalks(matrix,start,k)))});
 }
}
const doc={createElementNS:(_,tag)=>new Node(tag),createTextNode:text=>({tag:'#text',text:String(text),nodeType:3})};
class Node{
 constructor(tag){this.tag=tag;this.attrs={};this.children=[];this.nodeType=1;this.ownerDocument=doc;}
 setAttribute(k,v){this.attrs[k]=String(v)}appendChild(n){this.children.push(n)}removeChild(n){this.children.splice(this.children.indexOf(n),1)}get firstChild(){return this.children[0]}
}
for(const kind of['path','cycle','complete','disconnected'])for(let n=3;n<=7;n++)for(let k=0;k<=12;k++)for(const m of[0,5,100]){
 const r=a.analyzeGraph(kind,n,k,m);models.push(r);
 if(m===5&&[0,2,n-1,n,12].includes(k)){const svg=new Node('svg');a.drawGraph(doc,svg,r,'test');plots.push({r,svg});}
}
for(let m=0;m<=100;m++)coins.push(a.coinLedger(m));
for(let n=0;n<=12;n++)derangements.push(a.derangementLedger(n));
for(const m of[[],[[0]],[[1]],[[0,1],[1,0]],[[1,2],[2,4]],[[0,2,1],[3,0,4],[5,6,0]],[[7,-7,2],[-1,3,0],[2,1,5]]])determinants.push({m,value:a.determinant(m)});
let strict=0;const reject=f=>{assert.throws(f);strict++};
for(const args of[['x',4,2,5],['path','4',2,5],['path',2,2,5],['path',8,2,5],['path',4,-1,5],['path',4,13,5],['path',4,2,101],['path',4,2,.5]])reject(()=>a.analyzeGraph(...args));
for(const m of[[],[[1]],[[0,1],[0,0]],[[0,2],[2,0]],[[0,1],[1]],[[0,NaN],[NaN,0]],[[0,,0],[,0,0],[0,0,0]],Array(3)])reject(()=>a.validateMatrix(m));
for(const v of[-1,.5,'3',null,NaN,Infinity]){reject(()=>a.coinLedger(v));reject(()=>a.derangementLedger(v));}
reject(()=>a.coinLedger(101));reject(()=>a.derangementLedger(13));reject(()=>a.countWalks([[0]],1,0));reject(()=>a.countSimplePaths([[0]],0,-1));
console.log(JSON.stringify({graphs,models,plots,coins,derangements,determinants,strict,self:a.selfTest()},(_,v)=>typeof v==='bigint'?v.toString():v));
"""
r=json.loads(subprocess.check_output((['rtk','proxy']if shutil.which('rtk')else[])+['node','-e',JS],cwd=ROOT,text=True))
checks=0
def ok(v,msg):
 global checks
 checks+=1
 if not v:raise AssertionError(msg)
def exact(a,b):ok(int(a)==b,f'{a} != {b}')
def near(a,b):ok(abs(float(a)-b)<1e-9,f'{a} != {b}')
def tree_masks(n):
 pairs=list(itertools.combinations(range(n),2));index={edge:j for j,edge in enumerate(pairs)}
 if n==1:return[0]
 out=[]
 for code in itertools.product(range(n),repeat=n-2):
  degree=[1]*n
  for v in code:degree[v]+=1
  edges=[]
  for v in code:
   leaf=next(j for j in range(n)if degree[j]==1);edges.append(tuple(sorted((leaf,v))));degree[leaf]-=1;degree[v]-=1
  leaves=[j for j in range(n)if degree[j]==1];edges.append(tuple(leaves))
  out.append(sum(1<<index[e]for e in edges))
 assert len(set(out))==len(out)
 return out
tm={n:tree_masks(n)for n in range(1,8)}
for g in r['graphs']:
 n=g['n'];mask=g['mask'];pairs=list(itertools.combinations(range(n),2));adj=[[0]*n for _ in range(n)]
 for bit,(i,j)in enumerate(pairs):
  if mask&(1<<bit):adj[i][j]=adj[j][i]=1
 trees=sum((t&mask)==t for t in tm[n]);exact(g['trees'],trees);ok(g['connected']==(trees>0),'connected via spanning tree enumeration')
 for i in range(n):exact(g['degree'][i],sum(adj[i]))
 for start in range(n):
  counts=[0]*(n+2)
  for length in range(n):
   for tail in itertools.permutations([v for v in range(n)if v!=start],length):
    route=(start,)+tail
    if all(adj[a][b]for a,b in zip(route,route[1:])):counts[length]+=1
  for a,b in zip(g['simple'][start],counts):exact(a,b)
 # All-pairs matrix powers, rather than the product's single-source vector DP.
 power=[[int(i==j)for j in range(n)]for i in range(n)]
 for k in range(13):
  for start in range(n):exact(g['walks'][start][k],sum(power[start]))
  power=[[sum(power[i][t]*adj[t][j]for t in range(n))for j in range(n)]for i in range(n)]
def fibcoef(m):return sum(math.comb(m-j,j)for j in range(m//2+1))
for g in r['models']:
 n=g['n'];k=g['length'];kind=g['kind'];exact(g['generatingCoefficient'],fibcoef(g['coefficient']))
 exact(g['degreeSum'],2*len(g['edges']));ok(g['handshake'],'handshake')
 pairs=list(itertools.combinations(range(n),2));index={e:i for i,e in enumerate(pairs)}
 mask=sum(1<<index[tuple(e)]for e in g['edges']);exact(g['spanningTrees'],sum((t&mask)==t for t in tm[n]))
 if kind=='complete':
  exact(g['walks'],(n-1)**k);exact(g['simplePaths'],math.factorial(n-1)//math.factorial(n-1-k)if k<n else 0);exact(g['cayley'],n**(n-2))
 elif kind=='cycle':exact(g['walks'],2**k);exact(g['simplePaths'],1 if k==0 else 2 if k<n else 0)
 elif kind=='disconnected':ok(not g['connected']and not g['tree'],'disconnected sparse-mask regression');exact(g['walks'],1);exact(g['simplePaths'],1 if k<=1 else 0)
 if kind!='complete':ok(g['cayley']is None,'Cayley scope')
coinrefs={}
for m in range(101):
 sols=[]
 for a in range(m+1):
  for b in range(m//2+1):
   remainder=m-a-2*b
   if remainder>=0 and remainder%5==0:
    c=remainder//5;orders=math.factorial(a+b+c)//(math.factorial(a)*math.factorial(b)*math.factorial(c));sols.append((a,b,c,orders))
 coinrefs[m]=(len(sols),sum(v[3]for v in sols),sols)
for c in r['coins']:
 m=c['amount'];unordered,ordered,sols=coinrefs[m];exact(c['unordered'],unordered);exact(c['ordered'],ordered)
 actual=sorted((v['ones'],v['twos'],v['fives'],int(v['orders']))for v in c['solutions']);ok(actual==sorted(sols),'complete coin multiset enumeration')
 ok(len(c['rows'])==m+1,'all intermediate amounts')
 for row in c['rows']:
  j=row['amount'];u,o,_=coinrefs[j];exact(row['one'],1);exact(row['oneTwo'],j//2+1);exact(row['unordered'],u);exact(row['ordered'],o);exact(row['stairs'],fibcoef(j))
 # Formal multiplication: denominator coefficients annihilate all positive terms.
 coeff=[int(row['ordered'])for row in c['rows']]
 for j in range(m+1):exact(coeff[j]-sum(coeff[j-d]for d in[1,2,5]if j>=d),int(j==0))
with localcontext()as ctx:
 ctx.prec=100;einv=(-Decimal(1)).exp()
 for d in r['derangements']:
  n=d['n'];total=math.factorial(n);count=sum((-1)**j*math.factorial(n)//math.factorial(j)for j in range(n+1))
  exact(d['total'],total);exact(d['count'],count);exact(d['recurrence'],count)
  if n<=8:exact(count,sum(all(i!=p[i]for i in range(n))for p in itertools.permutations(range(n))))
  acc=0
  for row in d['rows']:
   j=row['j'];choices=math.comb(n,j);intersection=math.factorial(n-j);term=(-1)**j*choices*intersection;acc+=term
   for name,value in [('choices',choices),('intersection',intersection),('signedTerm',term),('cumulative',acc)]:exact(row[name],value)
  exact(d['errorBoundDenominator'],math.factorial(n+1));ok(abs(Decimal(count)/Decimal(total)-einv)<1/Decimal(math.factorial(n+1)),'strict alternating-series probability error')
def perm_det(m):
 n=len(m);total=0
 for perm in itertools.permutations(range(n)):
  sign=(-1)**sum(perm[i]>perm[j]for i in range(n)for j in range(i+1,n));total+=sign*math.prod(m[i][perm[i]]for i in range(n))
 return total
for d in r['determinants']:exact(d['value'],perm_det(d['m']))
def nodes(node):
 yield node
 for c in node.get('children',[]):yield from nodes(c)
for item in r['plots']:
 g=item['r'];n=g['n'];kind=g['kind'];svg=item['svg'];ok(svg['attrs']['viewBox']=='0 0 620 400','native graph bounds')
 if kind=='path':pts=[(65+i*490/(n-1),170)for i in range(n)]
 else:
  radius=105 if kind=='complete'else 115
  pts=[(300+radius*math.cos(-math.pi/2+2*math.pi*i/n),165+radius*math.sin(-math.pi/2+2*math.pi*i/n))for i in range(n)]
 flat=list(nodes(svg));circles=[v for v in flat if v.get('attrs',{}).get('class')=='gcnt-node'];ok(len(circles)==n,'all vertices')
 for v,(x,y)in zip(circles,pts):near(v['attrs']['cx'],x);near(v['attrs']['cy'],y);ok(19<=x<=601 and 19<=y<=345,'node inside view')
 edges=[v for v in flat if v.get('attrs',{}).get('class')=='gcnt-edge'];ok(len(edges)==len(g['edges']),'all edges')
 for v,(i,j)in zip(edges,g['edges']):
  for key,value in zip(['x1','y1','x2','y2'],[*pts[i],*pts[j]]):near(v['attrs'][key],value)
 highlights=[v for v in flat if v.get('attrs',{}).get('class')=='gcnt-highlight'];ok(len(highlights)==(g['length']if g['simplePaths']else 0),'all witness edges')
 witness=[0]
 for v in highlights:
  ends=[]
  for a,b in [('x1','y1'),('x2','y2')]:
   ends.append(next(i for i,(x,y)in enumerate(pts)if abs(float(v['attrs'][a])-x)<1e-9 and abs(float(v['attrs'][b])-y)<1e-9))
  ok(sorted(ends)in g['edges'],'witness uses actual edges')
  ok(ends[0]==witness[-1] and ends[1]not in witness,'ordered simple-path witness');witness.append(ends[1])
root=ET.parse(ROOT/'math-course/images/graph-01-pascal.svg');combos=[];seqs=[];pascal=[]
texts={(float(e.get('x')),float(e.get('y'))):e.text for e in root.iter()if e.tag.endswith('}text')}
for e in root.iter():
 if e.get('data-combination')is not None:combos.append((*map(int,e.get('data-combination').split(',')),int(e.get('data-orders'))))
 if e.get('data-sequence')is not None:seqs.append(tuple(map(int,e.get('data-sequence').split(','))))
 if e.get('data-pascal-n')is not None:
  n=int(e.get('data-pascal-n'));k=int(e.get('data-pascal-k'));exact(e.get('data-value'),math.comb(n,k));pascal.append((n,k));exact(texts[(285+(k-n/2)*61,590+n*43)],math.comb(n,k))
ok(sorted(combos)==sorted(coinrefs[5][2]),'static all four multisets')
ok(len(seqs)==len(set(seqs))==9 and all(sum(v)==5 and set(v)<={1,2,5}for v in seqs),'static all nine ordered sequences')
ok(len(pascal)==28,'full Pascal rows 0..6')
for i,seq in enumerate(seqs):
 for j,v in enumerate(seq):exact(texts[(646.5+j*55,167+i*35)],v)
for i,(_,_,_,multiplicity)in enumerate(combos):ok(texts[(65,203+i*77)]==f'对应 {multiplicity} 条有序序列','visible multiplicity')
source=(ROOT/'course-shared/labs/graph-counting.js').read_bytes()
for course in ['math-course','grad-math','ai-course']:ok((ROOT/course/'site/assets/learning/labs/graph-counting.js').read_bytes()==source,'mirrors')
print(f"Counting PASS: {checks} checks, {len(r['graphs'])} exhaustive small graphs, {len(r['models'])} configured models, {len(r['plots'])} full graphs, 101 coin ledgers, 13 derangement ledgers, {r['strict']} strict failures, {r['self']['checks']} self-checks")
