"""Independent 90-digit finite-sum risks and symbolic lesson identities."""
from pathlib import Path
import json, math
import mpmath as mp
import sympy as s
mp.mp.dps=90
rows=[]
for n in [1,2,5,10,20,55,100]:
 for pf in [0,5e-324,1e-20,1e-13,.001,.1,.37,.5,.9,1-1e-13,math.nextafter(1,0),1]:
  p=mp.mpf(pf);weights=[mp.binomial(n,k)*p**k*(1-p)**(n-k)for k in range(n+1)]
  assert abs(sum(weights)-1)<mp.mpf('1e-85')
  stats=[]
  for a in [0,1,2]:
   values=[mp.mpf(k+a)/(n+2*a) for k in range(n+1)];mean=mp.fsum(w*x for w,x in zip(weights,values));variance=mp.fsum(w*(x-mean)**2 for w,x in zip(weights,values));mse=mp.fsum(w*(x-p)**2 for w,x in zip(weights,values))
   stats.append(dict(mean=float(mean),variance=float(variance),mse=float(mse)))
  rows.append(dict(n=n,p=pf,weights=list(map(float,weights)),stats=stats))
n,a,p=s.symbols('n a p',positive=True);q=p*(1-p);r=(n*q+a*a*(1-2*p)**2)/(n+2*a)**2
assert s.simplify((r-q/n)*n*(n+2*a)**2-a*(n*a-4*(n*(a+1)+a)*q))==0
assert s.simplify(s.integrate(r.subs(a,1),(p,0,1))-1/(6*(n+2)))==0
assert s.simplify(s.integrate((q/n),(p,0,1))-1/(6*n))==0
x,t=s.symbols('x t',positive=True)
assert s.simplify(s.integrate(n*x**(n-1)*x,(x,0,1))-n/(n+1))==0
assert s.simplify(s.integrate(n*x**(n-1)*x*x,(x,0,1))-(n/(n+2)))==0
theta=s.symbols('theta',positive=True)
assert s.simplify(s.diff(n*s.log(theta)-theta*t,theta)-(n/theta-t))==0
fixtures=[]
for ni in [5,20,100]:
 for ai in [0,1,2]:
  risk=[]
  for i in range(601):
   pi=mp.mpf(i)/600
   risk.append(float((ni*pi*(1-pi)+ai*ai*(1-2*pi)**2)/(ni+2*ai)**2))
  fixtures.append(dict(n=ni,a=ai,risk=risk))
root=Path(__file__).resolve().parents[1];path=root/'tools/fixtures/estimator-risk-reference.json';path.write_text(json.dumps(dict(rows=rows,figures=fixtures,crossing=float((1-mp.sqrt(mp.mpf(11)/21))/2),symbolicChecks=6),indent=2)+'\n');print('PASS',len(rows),'high precision PMFs and 6 symbolic identities',path)
