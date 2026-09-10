"""Independent exact distribution averages, reversibility, spectral bounds and plots."""
from pathlib import Path
from fractions import Fraction as F
from decimal import Decimal as D, localcontext
import json, math, re, shutil, subprocess, xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
JS=r"""
const c=require('./course-shared/labs/markov-convergence.js'),a=require('assert'),cases=[],plots=[],generic=[];
class N{
 constructor(tag,doc){this.tag=tag;this.attrs={};this.children=[];this.ownerDocument=doc;this.nodeType=1}
 setAttribute(k,v){this.attrs[k]=String(v)} appendChild(n){this.children.push(n);return n}
 set textContent(v){this.text=String(v);this.children=[]}
}
const doc={createElementNS:(ns,t)=>new N(t,doc),createTextNode:v=>({tag:'#text',text:String(v),nodeType:3})};
for(const p of c.PRESETS)for(let i=0;i<=p.matrix.length;i++)for(let time=0;time<=12;time++){
 const r=c.compute({presetId:p.id,initialIndex:i,time});cases.push(r);
 if([0,2,12].includes(time))plots.push({r,svg:c.drawSvg(doc,r,'g')});
}
let strict=0;function reject(f){a.throws(f);strict++}
for(const k of ['time','initialIndex'])for(const v of [null,'0',NaN,Infinity,-1,.5,99])reject(()=>c.compute({[k]:v}));
for(const v of [null,[],true,'mixing'])reject(()=>c.compute(v));
for(const v of [null,'',0,'unknown'])reject(()=>c.compute({presetId:v}));
for(const v of [null,-1,.5,Infinity,NaN,'2',4097])reject(()=>c.matrixPower([[1,0],[0,1]],v));
for(const m of [null,[],[[1,0]],[[1,-1e-20],[0,1]],[[1,NaN],[0,1]],[[.2,.2],[0,1]],[[1,'0'],[0,1]]])reject(()=>c.structureOf(m));
for(const v of [null,NaN,Infinity,-1])reject(()=>c.isReversible([[1,0],[0,1]],[.5,.5],v));
for(const v of [-1,Infinity,'1',.5])reject(()=>c.spectralCertificate(c.PRESETS[0].matrix,c.PRESETS[0].stationary,0,v));
for(const stationary of [[.9,.6],[-1,2],[NaN,1],[1],[0,0],[.5,.5]]){
 a(!c.spectralCertificate(c.PRESETS[0].matrix,stationary,0,4).available);strict++;
}
for(const e of [1e-12,1e-20,1e-300]){
 const m=[[1-e,e],[e,1-e]],pi=[.5,.5];
 generic.push({m,structure:c.structureOf(m),certificate:c.spectralCertificate(m,pi,0,4)});
 a(c.structureOf(m).irreducible);a(!c.spectralCertificate(m,pi,0,4).available);
}
const forged=c.spectralCertificate(c.PRESETS[3].matrix,c.PRESETS[3].stationary,0,4,{irreducible:true,aperiodic:true},{rhoStar:.1,absoluteGap:.9});a(!forged.available);strict++;
for(const p of c.PRESETS)a(Object.isFrozen(p)&&Object.isFrozen(p.matrix[0]));
a.equal(c.format(0,0),'0');a.equal(c.format(10,0),'10');
console.log(JSON.stringify({cases,plots,generic,strict,self:c.selfTest()},(k,v)=>k==='ownerDocument'?undefined:v));
"""
data=json.loads(subprocess.check_output((['rtk','proxy']if shutil.which('rtk')else[])+['node','-e',JS],cwd=ROOT,text=True))
checks=0
def ok(v,msg):
    global checks
    checks+=1
    if not v:raise AssertionError(msg)
def near(a,b,tol=2e-12):
    ok(math.isfinite(float(a))and abs(float(a)-float(b))<=tol,f'{a} != {b}')
def vec(v):return [F(str(x)).limit_denominator(10000)for x in v]
def mul(a,b):return [[sum(x*y for x,y in zip(row,col))for col in zip(*b)]for row in a]
def eye(n):return [[F(i==j)for j in range(n)]for i in range(n)]
def power(p,n):
    r=eye(len(p))
    for _ in range(n):r=mul(r,p)
    return r
def tv(a,b):return sum(abs(x-y)for x,y in zip(a,b))/2
def cmp(a,b):
    ok(len(a)==len(b),'shape')
    for x,y in zip(a,b):
        if isinstance(x,list):cmp(x,y)
        else:near(x,y)
def exact(r):
    p=list(map(vec,r['matrix']));pi=vec(r['stationary']);mu=vec(r['initial'])
    rows=[];total=[F(0)]*len(p)
    for t in range(13):
        q=mul([mu],power(p,t))[0];total=[a+b for a,b in zip(total,q)];av=[x/F(t+1)for x in total]
        rows.append((q,tv(q,pi),av,tv(av,pi)))
    return p,pi,mu,rows
expected={'mixing':(True,1,True,.5),'periodic':(True,3,False,1),'reducible':(False,0,True,1),'lazy-cycle':(True,1,False,.5),'reversible-periodic':(True,2,True,1),'unique-absorbing':(False,0,True,0)}
for r in data['cases']:
    p,pi,mu,rows=exact(r);q=rows[r['time']];n=len(p)
    cmp(r['power'],power(p,r['time']));cmp(r['distribution'],q[0]);near(r['tv'],q[1]);cmp(r['cesaro'],q[2]);near(r['cesaroTv'],q[3])
    for t,row in enumerate(r['trajectory']):
        ok(row['time']==t,'trajectory time');cmp(row['distribution'],rows[t][0]);near(row['tv'],rows[t][1]);cmp(row['average'],rows[t][2]);near(row['averageTv'],rows[t][3])
    db=max(abs(pi[i]*p[i][j]-pi[j]*p[j][i])for i in range(n)for j in range(n))
    near(r['detailedBalanceResidual'],db);near(r['stationaryResidual'],0);cmp(mul([pi],p)[0],pi)
    ir,period,rev,rho=expected[r['preset']['id']]
    ok(r['structure']['irreducible']==ir and r['structure']['period']==period,'structural hypotheses')
    ok(r['reversible']==rev,'detailed balance classification');near(r['spectrum']['rhoStar'],rho);near(r['spectrum']['absoluteGap'],1-rho)
    cert=r['spectralCertificate'];ok(cert['available']==(r['preset']['id']=='mixing'),'certificate scope')
    if cert['available']:
        chi=sum((a-b)**2/b for a,b in zip(mu,pi))
        with localcontext()as ctx:
            ctx.prec=90;factor=(D(chi.numerator)/D(chi.denominator)).sqrt()/2;bound=factor*D(2)**(-r['time'])
        near(cert['initialFactor'],factor);near(cert['bound'],bound)
        ok(float(q[1])<=float(bound)+1e-15,'theorem upper bound')
    else:ok(cert['bound']is None and bool(cert['reason']),'rejected bound has reason')
    # Roots including complex values: verify the six exact spectra, trace and determinant.
    eig=[complex(v['real'],v['imaginary'])if isinstance(v,dict)else complex(v)for v in r['spectrum']['eigenvalues']]
    near(sum(eig).real,sum(p[i][i]for i in range(n)));near(sum(eig).imag,0)
    if r['preset']['id']=='lazy-cycle':
        near(eig[1].real,.25);near(abs(eig[1].imag),math.sqrt(3)/4)
    if r['preset']['id']=='periodic':
        near(eig[1].real,-.5);near(abs(eig[1].imag),math.sqrt(3)/2)
def walk(n):
    yield n
    for child in n.get('children',[]):yield from walk(child)
for item in data['plots']:
    r=item['r'];p,pi,mu,rows=exact(r);nodes=list(walk(item['svg']))
    paths={n['attrs'].get('class'):n['attrs']['d']for n in nodes if n.get('tag')=='path'and'd'in n.get('attrs',{})}
    series={'mc-curve':[q[1]for q in rows],'mc-average':[q[3]for q in rows]}
    cert=r['spectralCertificate']
    if cert['available']:
        factor=math.sqrt(float(sum((a-b)**2/b for a,b in zip(mu,pi))))/2
        series['mc-bound']=[factor*2**(-t)for t in range(13)]
    else:ok('mc-bound'not in paths,'no invented generic spectral line')
    for name,values in series.items():
        pts=re.findall(r'[ML]([-\d.e+]+) ([-\d.e+]+)',paths[name]);ok(len(pts)==13,'all curve points')
        for t,(x,y)in enumerate(pts):near(x,48+307*t/12);near(y,250-208*float(values[t]))
    circles=[n['attrs']for n in nodes if n.get('attrs',{}).get('class')in ['mc-current','mc-point']]
    ok(len(circles)==13,'step dots')
    for t,a in enumerate(circles):near(a['data-tv'],rows[t][1]);near(a['cx'],48+307*t/12);near(a['cy'],250-208*float(rows[t][1]))
    for cls,values in [('mc-bar-mu',rows[r['time']][0]),('mc-bar-pi',pi)]:
        bars=[n['attrs']for n in nodes if n.get('attrs',{}).get('class')==cls];ok(len(bars)==len(values),'all bars')
        for i,(a,v)in enumerate(zip(bars,values)):
            w=252/len(values);bw=min(25,w*.28);center=432+w*(i+.5)
            near(a['data-value'],v);near(a['height'],196*v);near(a['y'],250-196*v);near(a['x'],center-bw-2 if cls=='mc-bar-mu'else center+2)
    ok('NaN'not in json.dumps(item['svg'])and'Infinity'not in json.dumps(item['svg']),'finite geometry')
# Algebraic examples: PageRank with zero teleport weights, MH edge flow, and sample covariance.
for alpha in [F(1,10),F(1,4),F(3,4),F(9,10)]:
    P=[[1,0],[alpha,1-alpha]]
    for n in range(31):ok(power(P,n)[1]==[1-(1-alpha)**n,(1-alpha)**n],'sparse PageRank exact contraction')
weights=[F(1),F(2),F(4)]
for a in [F(0),F(1,4),F(1,2),F(1)]:
    q=[[0,a,1-a],[F(1,2),0,F(1,2)],[F(1),0,0]]
    P=[[F(0)]*3 for _ in range(3)]
    for i in range(3):
        for j in range(3):
            if i!=j and q[i][j]>0:P[i][j]=min(q[i][j],weights[j]*q[j][i]/weights[i])
        P[i][i]=1-sum(P[i])
    pi=[w/sum(weights)for w in weights]
    for i in range(3):
        for j in range(3):ok(pi[i]*P[i][j]==pi[j]*P[j][i],'MH accepted edge detailed balance')
    cmp(mul([pi],P)[0],pi)
P=[[F(4,5),F(1,5)],[F(3,10),F(7,10)]]
for n in range(41):
    covariance=F(2,5)*power(P,n)[1][1]-F(2,5)**2
    ok(covariance==F(6,25)*F(1,2)**n,'stationary observable covariance')
for M in range(1,31):
    exactvar=sum(F(6,25)*F(1,2)**abs(i-j)for i in range(M)for j in range(M))/M**2
    formula=F(6,25*M)*(1+2*sum((1-F(k,M))*F(1,2)**k for k in range(1,M)))
    ok(exactvar==formula,'finite-sample variance, not iid assumption')
tree=ET.parse(ROOT/'math-course/images/stoch-03-markov-convergence.svg')
for group in tree.iter():
    name=group.get('data-preset')
    if name is None:continue
    r=next(r for r in data['cases']if r['preset']['id']==name and r['initialIndex']==0)
    p,pi,mu,rows=exact(r);idx=['mixing','periodic','lazy-cycle'].index(name);x0=65+360*idx
    for n in group.iter():
        series=n.get('data-series')
        if series:
            t=int(n.get('data-time'));v=rows[t][1 if series=='step'else 3];near(n.get('data-value'),v)
            x=n.get('cx')if series=='step'else float(n.get('x'))+3
            y=n.get('cy')if series=='step'else float(n.get('y'))+3
            near(x,x0+270*t/12);near(y,420-280*float(v),1e-9)
        if n.get('data-bound'):
            pts=re.findall(r'[ML]([-\d.e+]+) ([-\d.e+]+)',n.get('d'))
            for t,(x,y)in enumerate(pts):near(x,x0+270*t/12);near(y,420-280*.5*math.sqrt(2/3)*2**(-t),1e-9)
source=(ROOT/'course-shared/labs/markov-convergence.js').read_bytes()
for c in ['math-course','grad-math','ai-course']:ok((ROOT/c/'site/assets/learning/labs/markov-convergence.js').read_bytes()==source,'mirrors')
print(f'Markov convergence independent PASS: {checks} checks, {len(data["cases"])} configurations, {len(data["plots"])} plots, {data["strict"]} strict failures, {data["self"]["checks"]} self-tests')
