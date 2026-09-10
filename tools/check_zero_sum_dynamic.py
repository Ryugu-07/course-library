#!/usr/bin/env python3
"""Independent exact-envelope oracle for matrix and rounded Shapley iterates."""
from pathlib import Path
from fractions import Fraction as F
from itertools import product
from decimal import Decimal, localcontext
import json, math, shutil, subprocess
ROOT=Path(__file__).resolve().parents[1]
checks=0
def check(c,label):
 global checks
 checks+=1
 if not c:raise AssertionError(label)
def number(v):
 try:return float(v)
 except OverflowError:return None
def up(v):
 x=number(v)
 if x is None:return None
 return math.nextafter(x,math.inf) if F(x)<v else x
def solve(g):
 a,b=g[0];c,d=g[1];den=a-b-c+d
 ps=[F(0),F(1)];qs=[F(0),F(1)]
 if den:
  if 0<(d-c)/den<1:ps.append((d-c)/den)
  if 0<(d-b)/den<1:qs.append((d-b)/den)
 lower=max(min(p*a+(1-p)*c,p*b+(1-p)*d)for p in ps)
 upper=min(max(q*a+(1-q)*b,q*c+(1-q)*d)for q in qs)
 assert lower==upper
 return lower
def check_solution(g,s,tag):
 p,q=F(s['exactP']),F(s['exactQ']);a,b=g[0];c,d=g[1];v=solve(g)
 check(0<=p<=1 and 0<=q<=1,(tag,'probability'))
 check(min(p*a+(1-p)*c,p*b+(1-p)*d)==max(q*a+(1-q)*b,q*c+(1-q)*d)==v,(tag,'saddle'))
 check(F(s['exactValue'])==v and s['value']==number(v),(tag,'value rounding'))
 check(s['rowProbability']==number(p) and s['columnProbability']==number(q),(tag,'probability rounding'))
 pure=[dict(row=i,column=j)for i,j in product(range(2),repeat=2)if g[i][j]==min(g[i])==max(g[0][j],g[1][j])]
 check(s['pureCells']==pure and s['pure']==bool(pure) and s['mixed']==(not pure),(tag,'actual pure cells'))
 check(F(s['exactRowSecurity'])==max(map(min,g)) and F(s['exactColumnSecurity'])==min(max(g[0][j],g[1][j])for j in range(2)),(tag,'pure security'))
 check(F(s['lower']['exact'])==F(s['upper']['exact'])==v and s['exactGap']=='0',(tag,'certificate'))
 return v,p,q
matrices=[[[a,b],[c,d]]for a,b,c,d in product(range(-2,3),repeat=4)]
M=float.fromhex('0x1.fffffffffffffp+1023');tiny=math.ulp(0.0)
for scale in [tiny,1e-300,1e-100,1e100,M]:
 matrices += [[[scale,-scale],[-scale,scale]],[[scale,scale],[scale,0]],[[scale,0],[0,scale]],[[scale,scale],[scale,scale]]]
for v in [tiny,1e-300,math.ulp(1.0)]:
 matrices += [[[1,0],[0,v]],[[v,0],[0,1]],[[1e12,1e12],[math.nextafter(1e12,math.inf),1e12]]]
presets={'pennies':[[1,-1],[-1,1]],'mixed':[[3,0],[1,2]],'saddle':[[3,0],[5,1]]}
trans=[[[18,4],[5,15]],[[14,3],[7,16]]]
configs=[]
for preset,gamma,mobility,initial in product(presets,[0,.5,.8,.99,math.nextafter(1,0),1],[0,.5,1],[-10,0,10]):
 configs.append(dict(preset=preset,gamma=gamma,mobility=mobility,initial=initial,iterations=24,samples=80,seed=[0,1,4294967295][len(configs)%3]))
for preset,gamma,k in product(presets,[0,1],[0,1,80]):
 configs.append(dict(preset=preset,gamma=gamma,mobility=0,initial=0,iterations=k,samples=20,seed=0))
for preset,n,seed in product(presets,[20,240,2000],[0,1,4294967295]):
 configs.append(dict(preset=preset,gamma=.8,mobility=1,initial=0,iterations=8,samples=n,seed=seed))
for preset,gamma,mobility in product(presets,[tiny,1e-300,1e-12],[0,.3,1]):
 configs.append(dict(preset=preset,gamma=gamma,mobility=mobility,initial=0,iterations=4,samples=20,seed=0))
plot_configs=[dict(preset=p,gamma=g,mobility=a,initial=0,iterations=8,samples=20,seed=0)
 for p,g,a in product(presets,[0,.8,1],[0,1])]
plot_configs += [dict(preset='pennies',gamma=g,mobility=.3,initial=0,iterations=4,samples=20,seed=0)for g in [tiny,1e-300,1e-12]]
sample_cases=[]
for scale,n in product([tiny,1e-300,1e-100,1,1e100,M],[1,20,10000]):
 sample_cases.append(dict(matrix=[[scale,-scale],[-scale,scale]],p='1/3',q='2/3',samples=n,seed=0))
probe=r"""
const m=require('./course-shared/labs/zero-sum-dynamic.js'),fs=require('fs'),a=JSON.parse(fs.readFileSync(0,'utf8'));
const matrices=a.matrices.map(m.matrixValue),runs=a.configs.map(m.iterate),samples=a.samples.map(s=>m.sampleLedger(s.matrix,s.p,s.q,s.samples,s.seed));
let strict=0;function bad(fn){let failed=false;try{fn()}catch(e){failed=true}if(!failed)throw Error('invalid accepted '+strict);strict++;}
for(const x of [null,false,'x',[],{preset:'missing'},{gamma:-.1},{gamma:1.1},{gamma:'0.8'},{gamma:NaN},{mobility:-1},{mobility:2},{mobility:null},{initial:11},{initial:-11},{iterations:-1},{iterations:81},{iterations:1.5},{samples:19},{samples:2001},{samples:40.5},{seed:-1},{seed:4294967296},{seed:.5}])bad(()=>m.iterate(x));
for(const x of [null,[],[[1,2]],new Array(2),[[1,2],new Array(2)],[[1,'2'],[3,4]],[[1,Infinity],[3,4]]])bad(()=>m.matrixValue(x));
for(const v of [null,[],[1],[1,2,3],new Array(2),[null,1],[NaN,1]])bad(()=>m.shapley(v,.8));
for(const p of [-1,2,NaN,null,'1/0'])bad(()=>m.sampleLedger([[1,0],[0,1]],p,.5,20,0));
bad(()=>m.sampleLedger([[1,0],[0,1]],.5,.5,0,0));bad(()=>m.dynamicMatrix(2,[0,0],.8));
class Node{constructor(tag){this.tag=tag;this.attrs={};this.children=[];this.textContent='';}setAttribute(k,v){this.attrs[k]=String(v);}appendChild(c){this.children.push(c);return c;}}
const doc={createElementNS(ns,t){return new Node(t);}};
const plots=a.plots.map(c=>{const d=m.iterate(c);return {data:d,svgs:[m.drawStageMatrix(doc,d,true,'stage'),m.drawIterationChart(doc,d,'values'),m.drawResidualChart(doc,d,'residual'),m.drawSamplingChart(doc,d,'samples')]};});
process.stdout.write(JSON.stringify({matrices,runs,samples,plots,strict,self:m.selfTest()}));
"""
cmd=(['rtk','proxy']if shutil.which('rtk')else[])+['node','-e',probe]
r=subprocess.run(cmd,cwd=ROOT,input=json.dumps(dict(matrices=matrices,configs=configs,samples=sample_cases,plots=plot_configs)),text=True,capture_output=True)
if r.returncode:raise RuntimeError(r.stderr)
out=json.loads(r.stdout)
for i,(g,s)in enumerate(zip(matrices,out['matrices'])):check_solution([[F(x)for x in row]for row in g],s,('matrix',i))
def effective(c,v,state):
 mob,gamma=F(c['mobility']),F(c['gamma'])
 return [[F(presets[c['preset']][i][j]+state)+gamma*(p*v[0]+(1-p)*v[1])
  for j in range(2)for p in [(1-mob)*(state==0)+mob*F(trans[state][i][j],20)]]for i in range(2)]
def sample_check(g,p,q,n,seed,s,tag):
 counts=[[0,0],[0,0]];state=seed;total=F(0)
 weights=[[p*q,p*(1-q)],[(1-p)*q,(1-p)*(1-q)]]
 expected=sum(weights[i][j]*g[i][j]for i,j in product(range(2),repeat=2))
 var=sum(weights[i][j]*(g[i][j]-expected)**2 for i,j in product(range(2),repeat=2))
 for k in range(n):
  state=(1664525*state+1013904223)%2**32;i=0 if F(2*state+1,2**33)<p else 1
  state=(1664525*state+1013904223)%2**32;j=0 if F(2*state+1,2**33)<q else 1
  counts[i][j]+=1;total+=g[i][j]
  check(s['prefix'][k]==number(total/(k+1)),(tag,'full prefix',k))
 check(s['counts']==counts,(tag,'counts'))
 for key,v in [('total',total),('mean',total/n),('expected',expected),('variance',var),('seSquared',var/n)]:
  check(F(s[key]['exact'])==v and s[key]['value']==number(v),(tag,key))
 check(F(s['exactDifference'])==total/n-expected,(tag,'difference'))
 with localcontext()as ctx:
  ctx.prec=100
  se=float((Decimal(var.numerator)/Decimal(var.denominator)/Decimal(n)).sqrt())
 check(s['standardError'] is not None and math.isclose(s['standardError'],se,rel_tol=4e-15,abs_tol=math.ulp(0.0)),(tag,'scaled SE',s['standardError'],se))
 check(s['samples']==n and s['seed']==seed,(tag,'configuration'))
for index,(c,run)in enumerate(zip(configs,out['runs'])):
 v=[F(c['initial'])]*2
 check(len(run['rows'])==c['iterations']+1,(index,'all iteration rows'))
 stage=solve([[F(x)for x in row]for row in presets[c['preset']]])
 fixed=[(stage+s)/(1-F(c['gamma'])) for s in range(2)]if c['gamma']<1 and (c['gamma']==0 or c['mobility']==0)else None
 for k,row in enumerate(run['rows']):
  check(row['step']==k and row['values']==list(map(number,v)),(index,k,'iterate'))
  mats=[effective(c,v,s)for s in range(2)]
  nxt=[solve(g)for g in mats]
  for s in range(2):
   check([[F(x)for x in rr]for rr in row['exactMatrices'][s]]==mats[s],(index,k,s,'matrix exact'))
   check(row['matrices'][s]==[[number(x)for x in rr]for rr in mats[s]],(index,k,s,'matrix displayed'))
   check_solution(mats[s],row['certificates'][s],(index,k,s))
  residual=max(abs(nxt[s]-v[s])for s in range(2))
  check(F(row['exactResidual'])==residual and row['residual']==number(residual),(index,k,'exact residual'))
  check(row['next']==list(map(number,nxt)) and list(map(F,row['exactNext']))==nxt,(index,k,'next'))
  if c['gamma']<1:
   bound=residual/(1-F(c['gamma']))
   check(F(row['exactBound'])==bound and float(row['bound'])==up(bound),(index,k,'outward bound',row['bound'],up(bound),row['exactBound'],str(bound)))
   check(F(float(row['bound']))>=bound,(index,k,'bound never rounds down'))
   if fixed:
    error=max(abs(v[s]-fixed[s])for s in range(2))
    check(error<=bound and float(row['actualError'])==up(error),(index,k,'analytic fixed point'))
  else:check(row['bound'] is None and row['exactBound'] is None,(index,k,'gamma1 no certificate'))
  v=list(map(lambda x:F(float(x)),nxt))
 for s in range(2):
  m=[[F(x)for x in rr]for rr in run['last']['exactMatrices'][s]];cert=run['last']['certificates'][s]
  sample_check(m,F(cert['exactP']),F(cert['exactQ']),c['samples'],(c['seed']+(29 if s else 11))%2**32,run['sampling'][s],(index,'sample',s))
 for row in run['modelRows']:
  s,i,j=row['state'],row['row'],row['column'];p0=(1-F(c['mobility']))*(s==0)+F(c['mobility'])*F(trans[s][i][j],20)
  check(F(row['p0']['exact'])==p0 and F(row['p1']['exact'])==1-p0 and row['reward']==presets[c['preset']][i][j]+s,(index,'transition'))
for i,(c,s)in enumerate(zip(sample_cases,out['samples'])):
 sample_check([[F(x)for x in row]for row in c['matrix']],F(c['p']),F(c['q']),c['samples'],c['seed'],s,('extreme sampling',i))

# Full native SVG geometry: independently map the complete verified data to each axis.
import re, xml.etree.ElementTree as ET
def descendants(n):
 yield n
 for c in n['children']:yield from descendants(c)
def log_exact(x):
 with localcontext()as ctx:
  ctx.prec=100
  a=F(x)
  return float((Decimal(a.numerator)/Decimal(a.denominator)).log10()) if a else None
for index,plot in enumerate(out['plots']):
 data=plot['data'];n=data['config']['iterations'];svg=plot['svgs']
 pure=[e['attrs']['data-cell']for e in descendants(svg[0])if e['attrs'].get('data-pure')=='true']
 check(pure==[str(c['row'])+','+str(c['column'])for c in data['stage']['pureCells']],('plot',index,'actual saddle cells'))
 value=[[(r['step'],r['values'][state])for r in data['rows']]for state in range(2)]
 residual=[[(r['step'],log_exact(r['exactResidual']))for r in data['rows']]]
 if data['contractive']:residual.append([(r['step'],log_exact(r['exactBound']))for r in data['rows']])
 if data['closedForm']:residual.append([(r['step'],math.log10(r['actualError']) if r['actualError'] else None)for r in data['rows']])
 sampling=[[(k+1,v)for k,v in enumerate(a['prefix'])]for a in data['sampling']]
 sampling += [[(1,a['expected']['value']),(data['config']['samples'],a['expected']['value'])]for a in data['sampling']]
 for si,series,islog,maxx in [(1,value,False,n),(2,residual,True,n),(3,sampling,False,data['config']['samples'])]:
  vals=[v for line in series for k,v in line if v is not None];lo=min(vals)if vals else 0;hi=max(vals)if vals else 1
  if islog and hi-lo<1:
   center=(lo+hi)/2;lo=center-.5;hi=center+.5
  elif lo==hi:
   pad=1 if lo==0 else abs(lo)*.1;lo-=pad;hi+=pad
  paths=[e for e in descendants(svg[si])if e['tag']=='path'and'data-series'in e['attrs']]
  check(len(paths)==len(series),('plot',index,si,'series count'))
  for j,line in enumerate(series):
   numbers=list(map(float,re.findall(r'-?\d+(?:\.\d+)?',paths[j]['attrs']['d'])))
   expected=[(125+k/max(1,maxx)*740,45+(hi-v)/(hi-lo)*233)for k,v in line if v is not None]
   check(len(numbers)==2*len(expected),('plot',index,si,j,'all vertices'))
   for k,(x,y)in enumerate(expected):
    check(abs(numbers[2*k]-x)<=.00051 and abs(numbers[2*k+1]-y)<=.002,('plot',index,si,j,k,'coordinates'))
   if islog:
    zero=[e for e in descendants(svg[si])if e['attrs'].get('data-zero-series')==str(j)]
    check(len(zero)==sum(v is None for k,v in line),('plot',index,j,'exact zero markers'))
    positive=[e for e in descendants(svg[si])if e['attrs'].get('data-positive-series')==str(j)]
    check(len(positive)==sum(v is not None for k,v in line),('plot',index,j,'isolated positive values visible'))
    for e,(k,v)in zip(zero,[(k,v)for k,v in line if v is None]):
     check(abs(float(e['attrs']['cx'])-(125+k/max(1,maxx)*740))<1e-10 and float(e['attrs']['cy'])==326,('zero lane',index,j))

ns={'s':'http://www.w3.org/2000/svg'}
tree=ET.parse(ROOT/'math-course/images/game-02-minimax-tree.svg')
texts={(float(e.get('x')),float(e.get('y'))):''.join(e.itertext())for e in tree.findall('.//s:text',ns)}
points=[(float(e.get('cx')),float(e.get('cy')))for e in tree.findall('.//s:circle',ns)if e.get('r')=='7']
check(points==[(192.5,320),(835,320)],'static envelope optima')
check(texts[170,803]=='(2, 0)' and texts[560,918]=='(1, 3)' and texts[915,918]=='(3, 2)','visible tree leaves')
envelopes=tree.findall('.//s:polyline',ns)
check([e.get('points')for e in envelopes]==['100,355 192.5,320.0 470,425','650,285 835.0,320.0 1020,215'],'actual envelope vertices')
check((ROOT/'math-course/images/game-02-minimax-tree.svg').read_bytes()==(ROOT/'math-course/site/assets/img/game-02-minimax-tree.svg').read_bytes(),'static mirror')
body=(ROOT/'math-course/lectures/game-02-zerosum-dynamic.md').read_text()
check(body.count('<details class="answer" markdown="1">')==3,'three full answers')
check(body.count(r'\boxed')==3,'three boxed certificates')
for token in [r'+\alpha P_{\rm base}',r'+\lVert TV-TV^*\rVert_\infty',r'\frac{4\delta-2}{1-\delta}',r'\frac{n-1}{n}v']:
 check(token in body,('formula integrity',token))
# Worked examples: all bids in a finite grid, rather than just the quoted favorable scenario.
for v,m in product(range(11),repeat=2):
 truthful=F(v-m)if v>m else F(0)
 for b in range(13):check(truthful>=(v-m if b>m else 0),('Vickrey',v,m,b))
for n,v in product(range(2,11),[F(0),F(1,10),F(1,2),F(1)]):
 alpha=F(n-1,n);beta=alpha*v;value=(v-beta)*(beta/alpha)**(n-1)
 for j in range(101):
  bid=F(j,100);u=(v-bid)*min(F(1),(bid/alpha)**(n-1))
  check(value>=u,('first price',n,v,bid))
check(F(1,2)*(10-1)-(10-9)==F(7,2),'GSP profitable deviation')
for delta in [F(0),F(2,5),F(1,2),F(4,5),F(99,100)]:
 gap=3/(1-delta)-(5+delta/(1-delta))
 check(gap==(4*delta-2)/(1-delta) and (gap>=0)==(delta>=F(1,2)),'public grim threshold')
for x,y,eta in product(range(-3,4),range(-3,4),[F(1,10),F(1,2),F(1)]):
 check((x-eta*y)**2+(y+eta*x)**2==(1+eta**2)*(x*x+y*y),'simultaneous gradient radius')
for path in ROOT.glob('*/site/assets/learning/labs/zero-sum-dynamic.js'):
 check(path.read_bytes()==(ROOT/'course-shared/labs/zero-sum-dynamic.js').read_bytes(),'JS mirror '+str(path))

checks+=out['strict']+out['self']['checks']
print(f"Zero-sum/Shapley PASS: {checks} checks; {len(matrices)} matrices, {len(configs)} full iterations, {len(sample_cases)} extreme sampling, {len(plot_configs)} complete four-plot cases; {out['strict']} strict, {out['self']['checks']} self")
