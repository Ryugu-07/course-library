#!/usr/bin/env python3
"""Independent Fraction oracle: partition probability space at payoff-line roots."""
from pathlib import Path
from fractions import Fraction as F
from itertools import product
import json, math, shutil, subprocess

ROOT=Path(__file__).resolve().parents[1]
checks=0
def check(ok,label):
    global checks
    checks+=1
    if not ok: raise AssertionError(label)
def f(x): return F(x)
def num(x):
    try: return float(x)
    except OverflowError: return None
def matrix(values): return [[list(values[:2]),list(values[2:4])],[list(values[4:6]),list(values[6:])]]
games=[matrix(v) for v in product((-1,0,1),repeat=8)]
basic=len(games)
M=float.fromhex('0x1.fffffffffffffp+1023'); tiny=math.ulp(0.0)
extremes=[
    [M,-M,-M,M,-M,M,M,-M],
    [tiny,-tiny,-tiny,tiny,-tiny,tiny,tiny,-tiny],
    [M,M,M,M,M,M,M,M],
    [1e12,1e12,1e12,1e12,math.nextafter(1e12,math.inf),1e12,math.nextafter(1e12,math.inf),1e12],
    [1,0,0,1e-300,0,1,1e-300,0],
    [1e-300,0,0,1,0,1e-300,1,0],
    [1,0,0,tiny,0,1,tiny,0],
    [tiny,0,0,1,0,tiny,1,0],
    [0,1,0,0,0,0,0,1e-300],
    [0,1e-300,0,0,0,0,0,1],
    [0,tiny,0,0,0,0,0,1],
    [0,1,0,0,0,0,0,tiny],
    [tiny,0,tiny,0,tiny,0,tiny,0],
    [1e12,-1e12,1e12,-1e12,math.nextafter(1e12,math.inf),-1e12,math.nextafter(1e12,math.inf),-1e12],
]
for v in extremes:
    g=matrix(v);games.append(g)
    games.append([[g[1-i][j][:] for j in range(2)] for i in range(2)])
    games.append([[g[j][i][::-1] for j in range(2)] for i in range(2)])
trials=[["0","0"],["1","1"],["1/2","1/2"],["1/3","2/3"],["1/100","99/100"]]
probe=r"""
const m=require('./course-shared/labs/nash-equilibrium.js'),fs=require('fs');
const input=JSON.parse(fs.readFileSync(0,'utf8'));
const out=input.games.map((payoffs,i)=>{
 const g={payoffs},a=m.analyze(g);
 return {sets:a.equilibriumSets,pure:a.pure,unique:a.uniqueness,count:a.equilibriumCount,inner:a.mixed.hasInterior,
   social:a.socialOptima,zero:a.zeroSum,minimax:a.minimax,
   trial:i%97===0||i>=input.basic?input.trials.map(([p,q])=>m.deviationLedger(g,p,q)):null};
});
let strict=0;
function bad(fn){let thrown=false;try{fn();}catch(e){thrown=true;}if(!thrown)throw Error('invalid accepted '+strict);strict++;}
for(const v of [null,false,3,'x',[],{presetId:'missing'},{presetId:''},{payoffs:null},
 {payoffs:new Array(2)},{payoffs:[[new Array(2),[1,2]],[[1,2],[1,2]]]}])bad(()=>m.analyze(v));
for(const x of [null,'1',true,NaN,Infinity,-Infinity,undefined]){
 const g={payoffs:[[[x,0],[0,0]],[[0,0],[0,0]]]};bad(()=>m.analyze(g));
}
for(const a of [[],['a'],['a',null],new Array(2),['', 'a'],['x'.repeat(25),'a']])bad(()=>m.analyze({rowLabels:a}));
for(const x of [-.1,1.1,NaN,Infinity,null,true,'1/0','1.2','2/1','-1/2','1/01','1/'.repeat(2000)]){
 bad(()=>m.deviationLedger({},x,0));bad(()=>m.expectedPayoffs({},0,x));
}
process.stdout.write(JSON.stringify({out,strict,self:m.selfTest()}));
"""
cmd=(['rtk','proxy'] if shutil.which('rtk') else [])+['node','-e',probe]
run=subprocess.run(cmd,cwd=ROOT,input=json.dumps(dict(games=games,trials=trials,basic=basic)),text=True,capture_output=True)
if run.returncode: raise RuntimeError(run.stderr)
response=json.loads(run.stdout);out=response['out']
def payoff(g,p,q,k):
    return sum((p if i==0 else 1-p)*(q if j==0 else 1-q)*g[i][j][k] for i in range(2) for j in range(2))
def gains(g,p,q):
    return [max(payoff(g,F(i),q,0) for i in (0,1))-payoff(g,p,q,0),
            max(payoff(g,p,F(j),1) for j in (0,1))-payoff(g,p,q,1)]
def partition(a,b):
    cuts={F(0),F(1)}
    if a!=b:
        x=-a/(b-a)
        if 0<=x<=1:cuts.add(x)
    cuts=sorted(cuts)
    return sorted(set(cuts+[(a+b)/2 for a,b in zip(cuts,cuts[1:])])),cuts
def contains(s,p,q):return s[0]<=p<=s[1] and s[2]<=q<=s[3]
for index,(game,result) in enumerate(zip(games,out)):
    g=[[[F(x) for x in c] for c in row] for row in game]
    ps,pcuts=partition(g[1][0][1]-g[1][1][1],g[0][0][1]-g[0][1][1])
    qs,qcuts=partition(g[0][1][0]-g[1][1][0],g[0][0][0]-g[1][0][0])
    sets=[]
    for s in result['sets']:
        a,b=map(F,s['exactP']);c,d=map(F,s['exactQ']);sets.append((a,b,c,d))
        check(0<=a<=b<=1 and 0<=c<=d<=1,(index,'range'))
        check(a in pcuts and b in pcuts and c in qcuts and d in qcuts,(index,'root endpoints'))
        check(s['type']==('region' if a<b and c<d else 'p-line' if a<b else 'q-line' if c<d else 'point'),(index,'dimension'))
        check(s['pRange']==[num(a),num(b)] and s['qRange']==[num(c),num(d)],(index,'rounded endpoints'))
        # Corners plus midpoint prove both linearly-affine best response restrictions on each returned rectangle.
        for p,q in product(set((a,b,(a+b)/2)),set((c,d,(c+d)/2))):
            check(gains(g,p,q)==[0,0],(index,'false equilibrium',s,p,q))
    for p,q in product(ps,qs):
        expected=gains(g,p,q)==[0,0]
        check(any(contains(s,p,q) for s in sets)==expected,(index,'partition completeness',p,q))
    for i,s in enumerate(sets):
        check(not any(i!=j and t[0]<=s[0]<=s[1]<=t[1] and t[2]<=s[2]<=s[3]<=t[3] for j,t in enumerate(sets)),(index,'redundant set'))
    continuum=any(a<b or c<d for a,b,c,d in sets)
    check(result['unique']==('continuum' if continuum else 'unique' if len(sets)==1 else 'multiple'),(index,'unique'))
    check(result['count']==('continuum' if continuum else len(sets)),(index,'count'))
    check(result['inner']==any(b>0 and a<1 and d>0 and c<1 for a,b,c,d in sets),(index,'interior'))
    pure=[(i,j) for i,j in product(range(2),repeat=2) if gains(g,F(1-i),F(1-j))==[0,0]]
    check([(p['row'],p['column']) for p in result['pure']]==pure,(index,'pure'))
    totals=[(i,j,sum(g[i][j])) for i,j in product(range(2),repeat=2)];maximum=max(t[2] for t in totals)
    check(F(result['social']['exactMaximum'])==maximum and result['social']['maximum']==num(maximum),(index,'max sum'))
    check([(x['row'],x['column']) for x in result['social']['cells']]==[(i,j) for i,j,v in totals if v==maximum],(index,'sum ties'))
    zero=all(t[2]==0 for t in totals)
    check(result['zero']==zero and result['minimax']['applicable']==zero,(index,'zero sum'))
    if zero:
        m=result['minimax'];p=F(m['row']['exactP']);q=F(m['column']['exactQ'])
        lower=min(payoff(g,p,F(j),0) for j in (0,1));upper=max(payoff(g,F(i),q,0) for i in (0,1))
        check(lower==upper==F(m['exactValue']) and m['exactGap']=='0',(index,'saddle'))
        check(F(m['lower']['exact'])==lower and F(m['upper']['exact'])==upper,(index,'lower upper'))
        check(m['value']==num(lower) and m['row']['p']==num(p) and m['column']['q']==num(q),(index,'minimax rounding'))
    if result['trial']:
        for (pp,qq),trial in zip(trials,result['trial']):
            p,q=F(pp),F(qq)
            check(trial['p']['exact']==str(p) and trial['q']['exact']==str(q),(index,'trial input'))
            for k,row in enumerate(trial['players']):
                current=payoff(g,p,q,k)
                a=payoff(g,F(1),q,0) if k==0 else payoff(g,p,F(1),1)
                b=payoff(g,F(0),q,0) if k==0 else payoff(g,p,F(0),1)
                for key,value in [('current',current),('action0',a),('action1',b),('best',max(a,b)),('gain',max(a,b)-current)]:
                    check(F(row[key]['exact'])==value and row[key]['value']==num(value),(index,'trial',key))
            check(trial['isNash']==(gains(g,p,q)==[0,0]),(index,'trial Nash'))
# Static picture: validate the actual visible numbers, coordinates and arrow directions.
import xml.etree.ElementTree as ET
tree=ET.parse(ROOT/'math-course/images/game-01-nash-payoff.svg')
ns={'s':'http://www.w3.org/2000/svg'}
texts={(float(e.get('x')),float(e.get('y'))):''.join(e.itertext()) for e in tree.findall('.//s:text',ns)}
for i,j in product(range(2),repeat=2):
    check(texts[218+205*j,261+220*i]==str([[(3,3),(0,5)],[(5,0),(1,1)]][i][j]),'static visible payoff')
arrows=[e for e in tree.findall('.//s:line',ns) if e.get('marker-end')]
check(len(arrows)==4,'four unilateral arrows')
for e in arrows:
    x,y,xx,yy=[float(e.get(k)) for k in ('x1','y1','x2','y2')]
    check((x==xx and yy>y) or (y==yy and xx>x),'arrow changes exactly one action')
circles=tree.findall('.//s:circle',ns)
check(sorted((float(e.get('cx')),float(e.get('cy'))) for e in circles)==[(670,570),(790,450),(1030,210)],'three coordination equilibria')
check(any(v=='(1/3, 1/3)' for v in texts.values()),'visible exact midpoint')
check((ROOT/'math-course/images/game-01-nash-payoff.svg').read_bytes()==(ROOT/'math-course/site/assets/img/game-01-nash-payoff.svg').read_bytes(),'static mirror')
body=(ROOT/'math-course/lectures/game-01-nash.md').read_text()
check(body.count('<details class="answer" markdown="1">')==3,'three full answers')
check(body.count(r'\boxed')==2,'two definitions boxed')
check(r'+\frac{67}{100}\frac{67}{50}' in body,'exercise sum retains plus')
for path in ROOT.glob('*/site/assets/learning/labs/nash-equilibrium.js'):
    check(path.read_bytes()==(ROOT/'course-shared/labs/nash-equilibrium.js').read_bytes(),'JS mirror '+str(path))
checks+=response['strict']+response['self']['checks']
print(f"Nash exact audit PASS: {checks} checks; {basic} complete integer games, {len(games)-basic} extreme games; {response['strict']} strict, {response['self']['checks']} self")
