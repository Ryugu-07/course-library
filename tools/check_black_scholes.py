"""Independent price fixtures, Brownian paths, financing identities and SVGs."""
from pathlib import Path
import json,math,re,shutil,subprocess,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
JS=r"""
const c=require('./course-shared/labs/black-scholes-hedge.js'),assert=require('assert'),fs=require('fs');
const refs=JSON.parse(fs.readFileSync('./tools/fixtures/black-scholes-reference.json')).cases;
const prices=refs.map(r=>c.blackScholes(...r.inputs)),hedges=[],plots=[],boundaries=[];
const configs=[
 {},{S0:40,K:180,sigma:.1},{S0:180,K:40,sigma:.1},{sigma:.8,T:3,mu:-.2,r:-.05},
 {sigma:0,mu:.05},{sigma:0,mu:-.2},{T:0},{S0:100,K:100,sigma:0,r:0,mu:0}
];
for(const p of configs)for(const seed of c.SEEDS)for(const steps of c.GRID_STEPS)hedges.push(c.discreteDeltaHedge({...p,seed,steps}));
class Node{
 constructor(tag){this.tag=tag;this.attrs={};this.children=[];this.nodeType=1;this.ownerDocument=doc;}
 setAttribute(k,v){this.attrs[k]=String(v);}appendChild(n){this.children.push(n);}removeChild(n){this.children.splice(this.children.indexOf(n),1);}get firstChild(){return this.children[0];}
}
const doc={createElementNS:(_,tag)=>new Node(tag),createTextNode:text=>({tag:'#text',nodeType:3,text})};
for(const p of c.PRESETS)for(const seed of c.SEEDS){const result=c.discreteDeltaHedge({...c.presetConfig(p),seed}),svg=new Node('svg');c.drawChart(doc,svg,result,'test');plots.push({result,svg});}
for(const S of [0,99.99999999999999,100,100.00000000000001,110])for(const r of [-.05,0,.2])for(const sigma of [0,.2])for(const T of [0,1])boundaries.push({inputs:[S,100,r,sigma,T],result:c.blackScholes(S,100,r,sigma,T)});
let strict=0;function reject(f){assert.throws(f);strict++;}
for(const v of [null,'1',NaN,Infinity,-1]){reject(()=>c.normalizeConfig({sigma:v}));reject(()=>c.normalizeConfig({T:v}));}
for(const p of [null,[],1,{extra:1},{steps:5},{steps:2.5},{steps:385},{seed:-1},{seed:4294967296},{seed:.5},{S0:0},{K:0},{mu:.31},{r:.21}])reject(()=>c.normalizeConfig(p));
reject(()=>c.blackScholes(100,100,0,-1,1));reject(()=>c.blackScholes(100,100,0,.2,-1));reject(()=>c.normalCdf('.5'));reject(()=>c.normalPdf('.5'));
console.log(JSON.stringify({prices,hedges,plots,boundaries,strict,self:c.selfTest()}));
"""
result=json.loads(subprocess.check_output((['rtk','proxy']if shutil.which('rtk')else[])+['node','-e',JS],cwd=ROOT,text=True))
fixtures=json.loads((ROOT/'tools/fixtures/black-scholes-reference.json').read_text())['cases']
checks=0
def ok(v,label):
 global checks
 checks+=1
 if not v:raise AssertionError(label)
def near(a,b,rtol=2e-10,atol=0):
 a=float(a);b=float(b)
 ok(a==b or abs(a-b)<=max(atol,rtol*abs(b)),f'{a} vs {b}')
for f,r in zip(fixtures,result['prices']):
 e=f['expected']
 for key in ['call','put','d1','d2']:near(r[key],e[key],rtol=5e-10,atol=3e-12 if key in ['d1','d2']else 0)
 for side in ['call','put']:
  for key in ['delta','gamma','vega','theta','rho']:
   name=key if key in ['gamma','vega']else side+key.capitalize()
   near(r['greeks'][side][key],e[name],rtol=8e-10)
 S,K,rate,sigma,T=f['inputs'];D=K*math.exp(-rate*T)
 ok(r['call']>=0 and r['put']>=0,'nonnegative prices including rare tails')
 ok(r['call']<=S*(1+1e-14)and r['put']<=D*(1+1e-14),'upper price bounds')
 # This is merely algebraic consistency; the independent erfc fixtures above
 # validate the two prices and Greeks, not a parity residual built from them.
 near(r['call']-r['put'],S-D,atol=5e-13*max(S,D),rtol=0)
for item in result['boundaries']:
 S,K,r,sigma,T=item['inputs'];v=item['result']
 if T==0:
  near(v['call'],max(S-K,0));near(v['put'],max(K-S,0))
  ok(v['greeks']['call']['vega']==v['greeks']['put']['vega']==0,'terminal payoff independent of sigma')
  ok(v['greeks']['call']['rho']==v['greeks']['put']['rho']==0,'terminal payoff independent of rate')
  if S==K:
   ok(v['greeks']['call']['gamma']is None and v['greekMetadata']['call']['delta']['status']=='convention','exact kink only')
   if sigma==0:near(v['greeks']['call']['theta'],-max(r*K,0));near(v['greeks']['put']['theta'],min(r*K,0))
  else:near(v['greeks']['call']['delta'],1 if S>K else 0);ok(v['greeks']['call']['gamma']==0,'one ulp from kink is not kink')
 elif sigma==0:
  D=K*math.exp(-r*T);diff=S-D;near(v['call'],max(diff,0));near(v['put'],max(-diff,0))
  if diff==0 and r==0:ok(v['greeks']['call']['theta']==v['greeks']['put']['theta']==0,'zero-rate zero-vol price independent of remaining time')
def uniforms(seed):
 while True:
  seed=(1664525*seed+1013904223)&(2**32-1)
  yield (seed+1)/(2**32+1)
cache={}
def brownian(seed,T):
 key=(seed,T)
 if key not in cache:
  gen=uniforms(seed);cache[key]=[math.sqrt(T/384)*math.sqrt(-2*math.log(next(gen)))*math.cos(2*math.pi*next(gen))for j in range(384)]
 return cache[key]
def call_delta(S,K,r,sigma,T):
 if T==0:return max(S-K,0),(1 if S>K else 0 if S<K else .5)
 D=K*math.exp(-r*T)
 if sigma==0:return max(S-D,0),(1 if S>D else 0 if S<D else .5)
 w=sigma*math.sqrt(T);d1=(math.log(S/K)+(r+sigma*sigma/2)*T)/w;d2=d1-w
 cdf=lambda x:math.erfc(-x/math.sqrt(2))/2
 return S*cdf(d1)-D*cdf(d2),cdf(d1)
def ledger_near(a,b,scale=None):
 if scale is not None:near(a,b,rtol=5e-9,atol=max(256*math.ulp(0.0),1e-12*scale))
 elif b!=0 and abs(b)<1e-12:near(a,b,rtol=2e-8,atol=256*math.ulp(0.0))
 else:near(a,b,rtol=5e-10,atol=4e-10)
terminals={}
for h in result['hedges']:
 c=h['config'];T=c['T'];n=c['steps'];dt=T/n;fine=brownian(c['seed'],T);B=0;block=384//n;prices=[c['S0']]
 if T:
  for j in range(n):
   B+=math.fsum(fine[j*block:(j+1)*block]);t=T if j==n-1 else (j+1)*dt
   if j==n-1:B=math.fsum(fine)
   prices.append(c['S0']*math.exp((c['mu']-.5*c['sigma']**2)*t+c['sigma']*B))
 for a,b in zip(h['path']['prices'],prices):near(a,b,rtol=5e-14)
 key=tuple((k,v)for k,v in c.items()if k!='steps')
 terminal=h['path']['prices'][-1]
 if key in terminals:ok(terminal==terminals[key],'all grids have identical terminal stock')
 else:terminals[key]=terminal
 value,shares=call_delta(c['S0'],c['K'],c['r'],c['sigma'],T);cash=value-shares*c['S0']
 for j,(row,S)in enumerate(zip(h['rows'],prices)):
  t=T if j==len(prices)-1 else j*dt;tau=T-t
  model,target=call_delta(S,c['K'],c['r'],c['sigma'],tau)
  pre=cash*math.exp(c['r']*dt)if j else cash
  trade=target-shares if 0<j<len(prices)-1 else 0
  cash=pre-trade*S
  if j and j<len(prices)-1:shares=target
  portfolio=shares*S+cash
  for name,expected in [('time',t),('remaining',tau),('targetDelta',target),('shares',shares),('cashBeforeRebalance',pre),('trade',trade),('cash',cash),('portfolio',portfolio),('modelValue',model),('hedgeError',portfolio-model)]:
   try:ledger_near(row[name],expected,max(abs(portfolio),abs(model))if name=='hedgeError'else None)
   except AssertionError as e:raise AssertionError((c,j,name,str(e)))from e
  ledger_near(row['cash'],row['cashBeforeRebalance']-row['trade']*row['stock'])
  if j:ledger_near(row['portfolio'],h['rows'][j-1]['shares']*row['stock']+row['cashBeforeRebalance'])
 ledger_near(h['terminalError'],portfolio-max(prices[-1]-c['K'],0),max(abs(portfolio),max(prices[-1]-c['K'],0)))
def nodes(n):
 yield n
 for ch in n.get('children',[]):yield from nodes(ch)
def coords(d):return[(float(x),float(y))for x,y in re.findall(r'[ML]([-\d.e+]+)[, ]([-\d.e+]+)',d)]
for item in result['plots']:
 r=item['result'];svg=item['svg'];attrs=svg['attrs'];lo=float(attrs['data-price-min']);hi=float(attrs['data-price-max']);scale=float(attrs['data-error-scale']);rows=r['rows']
 for key,cl in [('stock','bsh-stock'),('portfolio','bsh-portfolio'),('hedgeError','bsh-error')]:
  ps=[n for n in nodes(svg)if n['tag']=='path'and n['attrs'].get('class')==cl];ok(len(ps)==1,'full path series')
  points=coords(ps[0]['attrs']['d']);ok(len(points)==len(rows),'all ledger vertices')
  for j,((x,y),row)in enumerate(zip(points,rows)):
   near(x,120+(0.5 if len(rows)==1 else j/(len(rows)-1))*638,atol=1e-9)
   expected=410-((row[key]+scale)/(2*scale))*165 if key=='hedgeError'else 195-(row[key]-lo)/(hi-lo)*165
   near(y,expected,atol=1e-9);ok((245-1e-9<=y<=410+1e-9)if key=='hedgeError'else(30-1e-9<=y<=195+1e-9),'portfolio and stock inside full plot bounds')
for node in ET.parse(ROOT/'math-course/images/sde-03-gbm-payoff.svg').iter():
 key=node.get('data-series')
 if key:
  points=coords(node.get('d'));ok(len(points)==201,'all static payoff vertices')
  for j,(x,y)in enumerate(points):near(x,100+650*j/200,atol=1e-9);near(y,340-(j if key=='stock'else max(j,100)),atol=1e-9)
for S in range(201):
 call=max(S-100,0);put=max(100-S,0)
 ok(call+100==put+S==max(S,100),'independent payoff identity includes downside region')
lecture=(ROOT/'math-course/lectures/sde-03-black-scholes.md').read_text()
ok(r'\max(S_T,K)'in lecture and '两边都等于 $S_T$'not in lecture,'parity explanation')
ok(r'dV_t=\Delta_t\,dS_t+\beta_t\,dM_t'in lecture,'explicit self financing')
ok(re.search(r'dt\s*\+\\sigma S u_S\\,dW_t',lecture),'Ito formula adds stochastic term')
source=(ROOT/'course-shared/labs/black-scholes-hedge.js').read_bytes()
for course in ['math-course','grad-math','ai-course']:ok((ROOT/course/'site/assets/learning/labs/black-scholes-hedge.js').read_bytes()==source,'mirrors')
print(f"Black-Scholes PASS: {checks} checks, {len(fixtures)} high-precision price/Greek fixtures, {len(result['hedges'])} hedge ledgers, {len(result['plots'])} full plots, {result['strict']} strict failures, {result['self']['checks']} self-checks")
