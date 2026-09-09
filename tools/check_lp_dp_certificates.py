"""General rational intersections and exhaustive bounded selections, independent of lab solvers."""
from fractions import Fraction as F
from pathlib import Path
import itertools,json,math,re,shutil,subprocess,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
JS=r"""
const c=require('./course-shared/labs/lp-dp-certificates.js'),a=require('assert'),cases=[],plots=[],shadows=[];
for(let x=0;x<=8;x++)for(let b=0;b<=20;b++)for(let z=0;z<=30;z++){
 const params={a:x,b,c:z},primal=c.solvePrimal(params),integer=c.solveInteger(params),dynamic=c.solveDynamic(params),dual=c.solveDual(params),cert=c.certificate(primal,dual);
 cases.push({params,primal,integer,dynamic,dual,cert});
}
for(const params of [{a:20,b:40,c:60},{a:0,b:40,c:60},{a:20,b:0,c:60},{a:20,b:40,c:0}]){
 const primal=c.solvePrimal(params),integer=c.solveInteger(params),dynamic=c.solveDynamic(params),dual=c.solveDual(params);cases.push({params,primal,integer,dynamic,dual,cert:c.certificate(primal,dual)});
}
for(const params of c.PRESETS.concat([{a:0,b:20,c:12},{a:8,b:0,c:12},{a:8,b:20,c:1},{a:8,b:20,c:30},{a:20,b:40,c:60}])){
 const primal=c.solvePrimal(params),integer=c.solveInteger(params),dynamic=c.solveDynamic(params),transitions=[];
 for(let i=0;i<=dynamic.stages;i++)for(let w=0;w<=dynamic.capacity;w++)transitions.push(c.transition(dynamic,i,w));
 plots.push({params,primal,integer,svg:c.renderSvg(primal,integer,params),transitions});
 for(let C=0;C<=60;C+=.25)shadows.push({params,C,value:c.shadowValue(params,C)});
}
let strict=0;
for(const key of ['a','b','c'])for(const v of [null,undefined,NaN,Infinity,'1',-.1,.5,10000]){
 for(const fn of ['solvePrimal','solveDual','solveInteger','solveDynamic']){a.throws(()=>c[fn]({...c.DEFAULTS,[key]:v}));strict++;}
}
a(Object.isFrozen(c.PRESETS)&&c.PRESETS.every(Object.isFrozen));
console.log(JSON.stringify({cases,plots,shadows,strict,self:c.selfTest()}));
"""
data=json.loads(subprocess.check_output((['rtk','proxy']if shutil.which('rtk')else[])+['node','-e',JS],cwd=ROOT,text=True))
count=0
def ok(test,msg):
    global count
    count+=1
    if not test:raise AssertionError(msg)
def near(a,b,tol=1e-9):ok(abs(float(a)-float(b))<=tol,f'geometry {a} != {b}')
def vertices(a,b,c):
    rows=[(F(1),F(0),F(a)),(F(0),F(2),F(b)),(F(3),F(2),F(c)),(F(-1),F(0),F(0)),(F(0),F(-1),F(0))]
    found=set()
    for u,v in itertools.combinations(rows,2):
        det=u[0]*v[1]-v[0]*u[1]
        if not det:continue
        x=(u[2]*v[1]-v[2]*u[1])/det;y=(u[0]*v[2]-v[0]*u[2])/det
        if all(r[0]*x+r[1]*y<=r[2]for r in rows):found.add((x,y))
    return found
def selected_best(nx,ny,capacity):
    # Enumerate item counts, then form prefix maxima for capacity-at-most semantics.
    exact=[0]*(capacity+1)
    for x in range(nx+1):
        for y in range(ny+1):
            weight=3*x+2*y
            if weight<=capacity:exact[weight]=max(exact[weight],3*x+5*y)
    best=0;result=[]
    for v in exact:best=max(best,v);result.append(best)
    return result
for case in data['cases']:
    p=case['params'];a,b,c=p['a'],p['b'],p['c'];r=case['primal'];d=case['dual'];integer=case['integer'];dp=case['dynamic'];cert=case['cert']
    vs=vertices(a,b,c);value=max(3*x+5*y for x,y in vs)
    x,y=F(r['X'],6),F(r['Y'],6)
    ok((x,y)in vs and 3*x+5*y==value,'rational vertex optimum')
    ok({(F(v['X'],6),F(v['Y'],6))for v in r['candidates']}==vs,'all unique rational vertices')
    ok(F(r['valueNumerator'],6)==value,'exact objective numerator')
    slacks=[a-x,b-2*y,c-3*x-2*y];active=dict(zip(['r1','r2','r3','x0','y0'],[v==0 for v in slacks]+[x==0,y==0]))
    ok(r['active']==active,'all active constraints including degenerate axes')
    ok([F(n,6)for n in r['slackNumerators']]==slacks,'exact slack numerators')
    u=[F(n,2)for n in d['U']];ds=[u[0]+3*u[2]-3,2*u[1]+2*u[2]-5]
    ok(min(u)>=0 and min(ds)>=0,'dual feasibility independently evaluated')
    ok(a*u[0]+b*u[1]+c*u[2]==value,'dual bound attains primal')
    ok(all(v*w==0 for v,w in zip(slacks,u))and x*ds[0]==0 and y*ds[1]==0,'complementarity all five')
    ok(cert['exact']and cert['gapNumerator']==0 and cert['complementarity']==0,'exact certificate')
    points=[(ix,iy)for ix in range(a+1)for iy in range(b//2+1)if 3*ix+2*iy<=c]
    iv=max(3*ix+5*iy for ix,iy in points);ties={(ix,iy)for ix,iy in points if 3*ix+5*iy==iv}
    ok({(v['x'],v['y'])for v in integer['ties']}==ties,'all integer optima')
    for sol in [integer,dp]:ok((sol['x'],sol['y'])in ties and sol['value']==iv,'integer and DP independently feasible optimal')
    ok(iv<=value,'LP upper bound')
    ok(dp['stages']==a+b//2 and dp['capacity']==c and len(dp['table'])==dp['stages']+1,'DP dimensions')
    for i,row in enumerate(dp['table']):
        reference=selected_best(min(i,a),max(0,i-a),c)
        ok(row==reference,'every DP row via count enumeration')
        count+=len(row)
for p in data['plots']:
    c=p['params'];r=p['primal'];integer=p['integer'];tree=ET.fromstring(p['svg']);extent=float(tree.get('data-extent'));mx=lambda x:100+440*x/extent;my=lambda y:510-440*y/extent
    clip=tree.find('defs/clipPath');ok(clip is not None,'real clipPath')
    ok(tree.find("g").get('clip-path')=='url(#'+clip.get('id')+')','clip used')
    rect=clip.find('rect');ok(rect.get('width')==rect.get('height')=='440','equal-unit square')
    lattice=[]
    for n in tree.iter():
        cls=n.get('class')
        if cls=='lpc-lattice':
            x=int(n.get('data-x'));y=int(n.get('data-y'));lattice.append((x,y));ok((n.get('data-feasible')=='true')==(3*x+2*y<=c['c']),'lattice feasibility');near(n.get('cx'),mx(x));near(n.get('cy'),my(y))
        if cls in ['lpc-primal','lpc-integer']:
            v=r if cls=='lpc-primal'else integer;near(n.get('cx'),mx(v['x']));near(n.get('cy'),my(v['y']))
        if cls=='lpc-objective':
            for xk,yk in [('x1','y1'),('x2','y2')]:
                x=(float(n.get(xk))-100)*extent/440;y=(510-float(n.get(yk)))*extent/440;near(3*x+5*y,r['value'])
        if cls=='lpc-boundary':
            i=int(n.get('data-index'))
            for xk,yk in [('x1','y1'),('x2','y2')]:
                x=(float(n.get(xk))-100)*extent/440;y=(510-float(n.get(yk)))*extent/440;near([x,2*y,3*x+2*y][i],[c['a'],c['b'],c['c']][i])
        if cls=='lpc-polygon':
            coords=re.findall(r'[ML]([-\d.e+]+) ([-\d.e+]+)',n.get('d'));ok(len(coords)==len(r['candidates']),'complete polygon vertices')
            for px,py in coords:
                x=(float(px)-100)*extent/440;y=(510-float(py))*extent/440
                ok(any(abs(x-v['x'])<1e-9 and abs(y-v['y'])<1e-9 for v in r['candidates']),'polygon is true candidate')
    ok(len(lattice)==(c['a']+1)*(c['b']//2+1),'complete bounded lattice')
    for t in p['transitions']:
        i,w=t['i'],t['w'];best=selected_best(min(i,c['a']),max(0,i-c['a']),w)[-1]
        ok(t['value']==best,'inspector value')
        if i==0:ok(t['choice']=='boundary'and t['skip']is None and t['take']is None,'boundary inspector');continue
        item=(3,3)if i<=c['a']else(2,5)
        skip=selected_best(min(i-1,c['a']),max(0,i-1-c['a']),w)[-1]
        take=None if w<item[0]else selected_best(min(i-1,c['a']),max(0,i-1-c['a']),w-item[0])[-1]+item[1]
        ok(t['skip']==skip and t['take']==take,'both inspector predecessors')
        ok(t['choice']==('take'if take is not None and take>skip else'skip'),'inspector tie convention')
for r in data['shadows']:
    p=r['params'];vs=vertices(p['a'],p['b'],F.from_float(r['C']));value=max(3*x+5*y for x,y in vs)
    ok(F.from_float(r['value'])==value,'shadow curve exact rational LP reference')
tree=ET.parse(ROOT/'math-course/images/opt-04-lp.svg')
for g in tree.iter():
    if g.get('id')not in ['polygon','value']:continue
    left=float(g.get('data-left'));xmax=float(g.get('data-xmax'));ymax=float(g.get('data-ymax'))
    for n in g.iter():
        name=n.get('data-curve')
        if name:
            for px,py in re.findall(r'[ML]([-\d.]+),([-\d.]+)',n.get('d')):
                x=(float(px)-left)*xmax/400;y=(505-float(py))*ymax/400
                if name=='x-limit':near(x,4)
                elif name=='y-limit':near(y,6)
                elif name=='mixed-limit':near(3*x+2*y,18)
                elif name=='objective':near(3*x+5*y,36)
                elif name=='value':near(y,min(42,18+x,2.5*x))
                else:near(y,18+x)
        if n.get('data-C'):near(n.get('cx'),left+400*float(n.get('data-C'))/xmax);near(n.get('cy'),505-400*float(n.get('data-V'))/ymax)
print(f'LP/DP independent PASS: {count} checks, {len(data["cases"])} capacity cases, {len(data["plots"])} plots, {len(data["shadows"])} shadow values, {data["strict"]} strict failures, {data["self"]["checks"]} self-tests')
