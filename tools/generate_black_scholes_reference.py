"""Offline high-precision references; CI reads the checked-in fixture."""
from pathlib import Path
import json, math
import mpmath as mp
ROOT=Path(__file__).resolve().parents[1]
mp.mp.dps=260
inputs=[]
for S in [1,40,99.99999999,100,100.00000001,180,250]:
 for K in [40,100,180]:
  for r in [-.05,0,.2]:
   for sigma in [1e-8,.1,.8]:
    for T in [.001,1,3]:inputs.append([S,K,r,sigma,T])
for sigma in [1e-100,1e-20,1e-10,1e-6]:
 inputs.append([100,100,0,sigma,1])
for epsilon in [1e-12,1e-10,1e-8,1e-6,.001,.1,1,3,7.99,8,8.01,20,37]:
 for sigma in [1e-8,.01,.8]:
  for sign in [-1,1]:
   S=float(100*mp.exp(sign*mp.mpf(epsilon)*mp.mpf(sigma)))
   if S<=1e12:inputs.append([S,100,0,sigma,1])
def reference(p):
 S,K,r,sigma,T=map(mp.mpf,p)
 discount=K*mp.exp(-r*T);w=sigma*mp.sqrt(T);m=mp.log(S/K)+r*T;d1=m/w+w/2;d2=d1-w
 cdf=lambda x:mp.erfc(-x/mp.sqrt(2))/2
 pdf=mp.exp(-d1*d1/2)/mp.sqrt(2*mp.pi)
 call=S*cdf(d1)-discount*cdf(d2);put=discount*cdf(-d2)-S*cdf(-d1)
 if S==K and r==0:call=put=S*mp.erf(w/(2*mp.sqrt(2)))
 return dict(call=float(call),put=float(put),d1=float(d1),d2=float(d2),callDelta=float(cdf(d1)),putDelta=float(-cdf(-d1)),
   gamma=float(pdf/(S*w)),vega=float(S*pdf*mp.sqrt(T)),callTheta=float(-S*pdf*sigma/(2*mp.sqrt(T))-r*discount*cdf(d2)),
   putTheta=float(-S*pdf*sigma/(2*mp.sqrt(T))+r*discount*cdf(-d2)),callRho=float(T*discount*cdf(d2)),putRho=float(-T*discount*cdf(-d2)))
rows=[dict(inputs=p,expected=reference(p))for p in inputs]
path=ROOT/'tools/fixtures/black-scholes-reference.json'
path.write_text(json.dumps(dict(precision=260,method="Direct erfc Black-Scholes formulas; exact binary float inputs; ATM erf identity",cases=rows),ensure_ascii=False,indent=2,allow_nan=False)+'\n')
print(f'Wrote {len(rows)} independent pricing/Greek cases')
