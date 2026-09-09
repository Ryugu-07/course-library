"""Independent rational powers, cycle enumeration, first-step equations and SVG checks."""
from pathlib import Path
from fractions import Fraction as F
import itertools, json, math, re, shutil, subprocess, xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
JS=r"""
const c=require('./course-shared/labs/markov-mixing.js'),a=require('assert'),cases=[],graphs=[],powers=[],plots=[];
class N {
 constructor(tag,doc){this.tag=tag;this.attrs={};this.children=[];this.ownerDocument=doc;this.nodeType=1;}
 setAttribute(k,v){this.attrs[k]=String(v)} appendChild(n){this.children.push(n);return n}
 get firstChild(){return this.children[0]} removeChild(n){this.children.splice(this.children.indexOf(n),1)}
 set textContent(v){this.children=[];this.text=String(v)}
}
const doc={createElementNS:(ns,t)=>new N(t,doc),createTextNode:v=>({tag:'#text',text:String(v),nodeType:3})};
for(const p of c.PRESETS)for(let i=0;i<=p.matrix.length;i++)for(let t=0;t<=12;t++){
 const r=c.compute({presetId:p.id,initialIndex:i,t});cases.push(r);
 if([0,1,12].includes(t)){const svg=new N('svg',doc);c.drawSvg(doc,svg,r,'audit');plots.push({r,svg});}
}
for(let mask=0;mask<512;mask++){
 const m=Array.from({length:3},(_,i)=>Array.from({length:3},(_,j)=>(mask>>(i*3+j))&1));
 if(m.some(row=>!row.some(Boolean)))continue;
 const q=m.map(row=>row.map(v=>v/row.reduce((a,b)=>a+b,0)));
 graphs.push({m:q,structure:c.structureOf(q),spectrum:c.spectralInfo(q)});
 for(const n of [0,1,2,5,12])powers.push({m:q,n,p:c.matrixPower(q,n)});
}
for(const m of [
 [[1-1e-12,1e-12],[1e-12,1-1e-12]],
 [[0,1,0],[1e-300,0,1],[0,1,0]],
 [[1,0,0],[0,1,0],[.5,.5,0]],
 [[.5,.5,0],[0,.5,.5],[0,0,1]]
]) graphs.push({m,structure:c.structureOf(m),spectrum:c.spectralInfo(m)});
const ring=Array.from({length:32},(_,i)=>Array.from({length:32},(_,j)=>j===(i+1)%32?1:0));a.equal(c.structureOf(ring).period,32);
for(const n of [32,128,4096])powers.push({m:[[.8,.2],[.3,.7]],n,p:c.matrixPower([[.8,.2],[.3,.7]],n)});
let strict=0;function rejects(fn){a.throws(fn);strict++}
for(const x of [null,NaN,Infinity,-1,1.5,'2',4097])rejects(()=>c.matrixPower([[1,0],[0,1]],x));
for(const x of [null,[],[[1,0]],[[1.1,-.1],[0,1]],[[1,-1e-14],[0,1]],[[.2,.2],[0,1]],[[1,NaN],[0,1]],[[1,'0'],[0,1]]])rejects(()=>c.structureOf(x));
for(const x of [null,[],true,'mixing'])rejects(()=>c.compute(x));
for(const k of ['t','initialIndex'])for(const x of [null,'0',NaN,Infinity,-1,.5,99])rejects(()=>c.compute({[k]:x}));
for(const x of [null,'',0,'unknown'])rejects(()=>c.compute({presetId:x}));
rejects(()=>c.spectralInfo([[1]]));
a(Object.isFrozen(c.PRESETS)&&Object.isFrozen(c.PRESETS[0].matrix[0]));
a.equal(c.format(10,0),'10');a.notEqual(c.format(1e-20),'0');
const clean=(k,v)=>k==='ownerDocument'?undefined:v;
console.log(JSON.stringify({cases,graphs,powers,plots,strict,self:c.selfTest()},clean));
"""
data=json.loads(subprocess.check_output((['rtk','proxy']if shutil.which('rtk')else[])+['node','-e',JS],cwd=ROOT,text=True))
checks=0
def ok(v,msg):
    global checks
    checks+=1
    if not v:raise AssertionError(msg)
def near(a,b,tol=2e-12):
    ok(abs(float(a)-float(b))<=tol,f'{a} != {b}')
def mul(a,b):
    return [[sum(x*y for x,y in zip(row,col))for col in zip(*b)]for row in a]
def eye(n):return [[F(i==j)for j in range(n)]for i in range(n)]
def rational(m):return [[F(str(v)).limit_denominator(10**6)for v in row]for row in m]
def power(m,n):
    # Sequential multiplication, independent of the lab's binary powering.
    q=eye(len(m))
    for _ in range(n):q=mul(q,m)
    return q
def compare(a,b):
    ok(len(a)==len(b),'shape')
    for x,y in zip(a,b):
        if isinstance(x,list):compare(x,y)
        else:near(x,y)
for r in data['cases']:
    p=rational(r['matrix']);n=r['time'];exact=power(p,n);compare(r['power'],exact)
    mu=[F(int(j==r['initialIndex']))for j in range(len(p))]if r['initialIndex']<len(p)else rational([r['stationary']])[0]
    dist=mul([mu],exact)[0];pi=rational([r['stationary']])[0]
    compare(r['initial'],mu);compare(r['distribution'],dist)
    tv=sum(abs(x-y)for x,y in zip(dist,pi))/2
    near(r['tv'],tv);near(r['exactTv'],tv);compare(r['rowSums'],[1]*len(p));near(r['stationaryResidual'],0)
    if r['preset']['id']=='mixing':near(r['spectralBound'],tv)
    else:ok(r['spectralBound']is None,'no universal spectral equality')
for r in data['powers']:compare(r['p'],power(rational(r['m']),r['n']))
def structure(m):
    n=len(m);reach=[[i==j or m[i][j]>0 for j in range(n)]for i in range(n)]
    for k in range(n):
        for i in range(n):
            for j in range(n):reach[i][j]|=reach[i][k]and reach[k][j]
    remaining=set(range(n));classes=[]
    while remaining:
        i=min(remaining);cls=[j for j in sorted(remaining)if reach[i][j]and reach[j][i]]
        classes.append(cls);remaining.difference_update(cls)
    info=[]
    for cls in classes:
        lengths=[]
        # Enumerate simple directed cycles, not bounded floating matrix powers or graph distances.
        def visit(path):
            for j in cls:
                if m[path[-1]][j]<=0:continue
                if j==path[0]:lengths.append(len(path))
                elif j not in path:visit(path+[j])
        for i in cls:visit([i])
        d=math.gcd(*lengths)if lengths else 0
        closed=all(m[i][j]==0 for i in cls for j in range(n)if j not in cls)
        info.append({'states':cls,'closed':closed,'period':d})
    return classes,info
for r in data['graphs']:
    m=r['m'];classes,info=structure(m);g=r['structure']
    ok(g['classes']==classes and g['classInfo']==info,'positive-edge classes, closure and periods')
    ok(g['irreducible']==(len(classes)==1),'irreducibility')
    ok(g['aperiodic']==(len(classes)==1 and info[0]['period']==1),'aperiodicity')
    # Check each reported root directly in det(zI-P), including complex conjugate pairs.
    eig=[complex(v['real'],v['imaginary'])if isinstance(v,dict)else complex(v)for v in r['spectrum']['eigenvalues']]
    for z in eig:
        determinant=0j
        for perm in itertools.permutations(range(len(m))):
            sign=(-1)**sum(perm[i]>perm[j]for i in range(len(m))for j in range(i+1,len(m)))
            term=complex(sign)
            for i,j in enumerate(perm):term*=z*(i==j)-m[i][j]
            determinant+=term
        near(abs(determinant),0,1e-12)
    near(r['spectrum']['slem'],max(map(abs,eig[1:])))
def walk(n):
    yield n
    for child in n.get('children',[]):yield from walk(child)
for item in data['plots']:
    r=item['r'];pi=rational([r['stationary']])[0];m=rational(r['matrix'])
    mu=rational([r['initial']])[0];nodes=list(walk(item['svg']))
    circles=[n for n in nodes if n.get('attrs',{}).get('class')in ['mm-current','mm-point']]
    ok(len(circles)==13,'all integer-time points')
    refs=[]
    for t,n in enumerate(circles):
        dist=mul([mu],power(m,t))[0];tv=sum(abs(x-y)for x,y in zip(dist,pi))/2;refs.append(tv);a=n['attrs']
        near(a['cx'],46+312*t/12);near(a['cy'],250-212*tv)
        near(a['data-tv'],tv);ok(int(a['data-time'])==t,'point time')
    path=next(n for n in nodes if n.get('attrs',{}).get('class')=='mm-curve')['attrs']['d']
    coords=re.findall(r'[ML]([-\d.e+]+) ([-\d.e+]+)',path);ok(len(coords)==13,'complete guide line')
    for t,(x,y)in enumerate(coords):near(x,46+312*t/12);near(y,250-212*refs[t])
    for cls,values in [('mm-bar-mu',mul([mu],power(m,r['time']))[0]),('mm-bar-pi',pi)]:
        bars=[n['attrs']for n in nodes if n.get('attrs',{}).get('class')==cls]
        ok(len(bars)==len(values),'every probability bar, including zero')
        for i,(a,v)in enumerate(zip(bars,values)):
            near(a['data-value'],v);near(a['y'],250-196*v);near(a['height'],196*v)
            w=242/len(values);bw=min(28,w*.28);center=432+w*(i+.5)
            near(a['x'],center-bw-2 if cls=='mm-bar-mu'else center+2)
    ok('NaN'not in json.dumps(item['svg'])and'Infinity'not in json.dumps(item['svg']),'finite plot')
# Exact worked examples, stopping equations, and counterexamples.
for N in range(2,31):
    for p in [F(1,5),F(2,5),F(1,2),F(3,5),F(4,5)]:
        q=1-p
        h=[F(i,N)if p==q else (1-(q/p)**i)/(1-(q/p)**N)for i in range(N+1)]
        t=[F(i*(N-i))if p==q else (N*h[i]-i)/(p-q)for i in range(N+1)]
        ok(h[0]==0 and h[-1]==1 and t[0]==t[-1]==0,'ruin boundaries')
        for i in range(1,N):
            ok(h[i]==p*h[i+1]+q*h[i-1] and t[i]==1+p*t[i+1]+q*t[i-1],'ruin probability and time equations')
            ok(0<h[i]<1 and t[i]>0,'ruin values')
Q=[[F(1,2),F(1,2)],[F(1,2),F(0)]];fund=[[F(4),F(2)],[F(2),F(2)]]
ok(mul([[F(i==j)-Q[i][j]for j in range(2)]for i in range(2)],fund)==eye(2),'fundamental inverse')
ok(mul(fund,[[F(0)],[F(1,2)]])==[[1],[1]],'certain HH absorption')
for n in range(41):
    J=[[F(1,2),F(1,2),0],[0,F(1,2),F(1,2)],[0,0,1]]
    ok(power(J,n)[0]==[F(1,2**n),F(n,2**n),1-F(n+1,2**n)],'Jordan n factor')
for a in [F(i,20)for i in range(21)]:
    for M in range(1,31):
        avg=sum(a if i%2==0 else 1-a for i in range(M))/M
        ok(abs(avg-F(1,2))==(abs(a-F(1,2))/M if M%2 else 0),'Cesaro parity')
tree=ET.parse(ROOT/'math-course/images/stoch-02-markov-converge.svg')
for group in tree.iter():
    name=group.get('data-preset')
    if name is None:continue
    matrix=next(r['matrix']for r in data['cases']if r['preset']['id']==name)
    edges={(int(n.get('data-from')),int(n.get('data-to'))):float(n.get('data-probability'))for n in group.iter()if n.get('data-from')is not None}
    ok(edges=={(i,j):p for i,row in enumerate(matrix)for j,p in enumerate(row)if p>0},'all and only positive static edges')
    ok(all(n.get('marker-end')=='url(#arrow)'for n in group.iter()if n.get('data-from')is not None),'directed static arrows')
source=(ROOT/'course-shared/labs/markov-mixing.js').read_bytes()
for c in ['math-course','grad-math','ai-course']:ok((ROOT/c/'site/assets/learning/labs/markov-mixing.js').read_bytes()==source,'tracked mirrors')
print(f'Markov independent PASS: {checks} checks, {len(data["cases"])} configurations, {len(data["graphs"])} graphs, {len(data["powers"])} matrix powers, {len(data["plots"])} plots, {data["strict"]} strict failures, {data["self"]["checks"]} self-tests')
