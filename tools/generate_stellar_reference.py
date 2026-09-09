"""DOP853 reference for the Lane-Emden initial-value surface and quadratures."""
import json,math
from pathlib import Path
import numpy as np
from scipy.integrate import solve_ivp
cases=[]
for n in [1,1.5,2,2.5,3,3.5,4,4.5]:
 x=1e-5;t=1-x*x/6+n*x**4/120;v=-x/3+n*x**3/30
 def f(x,y):
  th=max(0,y[0]);return [y[1],-2*y[1]/x-th**n,x*x*th**(n+1),(-x*x*y[1])*x*th**n]
 def surface(x,y):return y[0]
 surface.terminal=True;surface.direction=-1
 sol=solve_ivp(f,(x,50),[t,v,x**3/3,x**5/15],method='DOP853',rtol=3e-13,atol=3e-15,events=surface,dense_output=True,max_step=.025)
 assert sol.success and len(sol.t_events[0])==1
 xi=float(sol.t_events[0][0]);y=sol.sol(xi);mu=-xi*xi*y[1]
 samples=[]
 for z in np.linspace(.01,xi*.99,101):
  yy=sol.sol(z);samples.append([float(z),float(yy[0]),float(yy[1])])
 cases.append(dict(n=n,xi=xi,mu=float(mu),pressureIntegral=float(y[2]),gravityIntegral=float(y[3]),samples=samples))
p=Path(__file__).parent/'fixtures/stellar-reference.json';p.write_text(json.dumps(dict(method='SciPy DOP853 with terminal first-zero event, rtol=3e-13, independent small center start',cases=cases),indent=2)+'\n');print(len(cases),'reference polytropes')
