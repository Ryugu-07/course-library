from pathlib import Path
import json, math
import numpy as np
from scipy.stats import binom, norm, gamma, irwinhall
import sympy as s
root=Path(__file__).resolve().parents[1]
rows=[]
zs=np.linspace(-4,4,33)
for n in [1,2,5,16,32,128]:
 for model in ['uniform','skewed','bimodal']:
  if model=='uniform':cdf=irwinhall.cdf(n*.5+np.sqrt(n/12)*zs,n)
  elif model=='skewed':cdf=gamma.cdf(n+math.sqrt(n)*zs,a=n)
  else:
   cdf=np.zeros_like(zs)
   for k in range(n+1):cdf+=binom.pmf(k,n,.5)*irwinhall.cdf((math.sqrt(n*76/75)*zs-(2*k-n))/.4+n/2,n)
  rows.append({'model':model,'n':n,'cdf':list(map(float,cdf))})
figures=[]
for n in [10,30,100]:
 k=np.arange(n+1);z=(k-.2*n)/math.sqrt(.16*n);cdf=binom.cdf(k,n,.2);before=binom.cdf(k-1,n,.2)
 figures.append({'n':n,'z':z.tolist(),'before':before.tolist(),'after':cdf.tolist(),'distance':float(max(np.max(np.abs(cdf-norm.cdf(z))),np.max(np.abs(before-norm.cdf(z)))))})
x=s.symbols('x',real=True)
assert s.integrate((1-x)**3*s.exp(-x),(x,0,1))+s.integrate((x-1)**3*s.exp(-x),(x,1,s.oo))==12/s.E-2
assert s.integrate((1+x)**3*s.Rational(5,2),(x,-s.Rational(1,5),s.Rational(1,5)))==s.Rational(26,25)
p=s.symbols('p',positive=True);assert s.expand(p*(1-p)**3+(1-p)*p**3-p*(1-p)*(p*p+(1-p)**2))==0
target=root/'tools/fixtures/clt-reference.json';target.write_text(json.dumps({'source':'SciPy binom/gamma/irwinhall (finite convolutions), three SymPy moment identities','zs':zs.tolist(),'rows':rows,'figures':figures,'rareTail':float(binom.sf(80,10000,.006))},indent=2))
print('PASS: 18 exact-distribution grids, 3 binomial CDFs, 3 symbolic moments; tail',binom.sf(80,10000,.006))
