"""Independent 100-digit recurrence and adaptive RK45 Lorenz reference."""
from pathlib import Path
import json
import mpmath as mp
from scipy.integrate import solve_ivp
mp.mp.dps=100
rows=[]
for r in [0.,.5,1.,2.8,3.2,3.5,3.83,3.9,4.]:
 for initial in [0.,.2,.5,.75,1.]:
  x=mp.mpf(initial); rr=mp.mpf(r); values=[]
  for n in range(21):
   values.append(float(x));x=rr*x*(1-x)
  rows.append(dict(r=r,x0=initial,values=values))
def rhs(t,s):
 x,y,z=s;return [10*(y-x),x*(28-z)-y,x*y-8*z/3]
sol=solve_ivp(rhs,[0,10],[1,1,20],method='RK45',rtol=2e-13,atol=2e-15)
assert sol.success
out=dict(method='mpmath 100 decimal digits; exact input binary floats; RK45 independently of static DOP853',orbits=rows,lorenz_t10=sol.y[:,-1].tolist())
Path(__file__).with_name('fixtures').joinpath('logistic-reference.json').write_text(json.dumps(out,indent=2)+'\n')
print('wrote',len(rows),'high-precision orbits and independent Lorenz endpoint')
