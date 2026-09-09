"""Independent adaptive IVP and dense eigensolver references for the RBC lesson."""
from pathlib import Path
import json,math
import numpy as np
from scipy.integrate import solve_ivp
from scipy.linalg import eigvals
out={'method':'SciPy DOP853 rtol 2e-12 atol 2e-14; scipy.linalg.eigvals','amplitudes':[],'growth':[]}
for mu in [-.9,-.3,-1e-10,0,1e-10,.3,1.1]:
 for a0 in [-.9,-.12,0,.12,.9]:
  sol=solve_ivp(lambda t,y:mu*y-1.2*y**3,[0,12],[a0],method='DOP853',rtol=2e-12,atol=2e-14,dense_output=True)
  assert sol.success
  for t in [0,.01,.3,1,5,12]:out['amplitudes'].append({'mu':mu,'a0':a0,'time':t,'A':float(sol.sol(t)[0])})
for ra in [400,500,657.5113644795163,900,1400]:
 for a in [.8,math.pi/math.sqrt(2),3.1,4.4,5.8]:
  q=a*a+math.pi**2
  for pr in [.01,.1,1,7,100]:
   m=[[-pr*q,pr*ra*a*a/q],[1,-q]];v=eigvals(m);assert np.max(np.abs(v.imag))<1e-12
   out['growth'].append({'ra':ra,'a':a,'pr':pr,'roots':sorted(float(x.real)for x in v)})
p=Path(__file__).parent/'fixtures/rbc-reference.json';p.write_text(json.dumps(out,indent=2)+'\n');print(f'Wrote {len(out["amplitudes"])} IVP and {len(out["growth"])} eigensolver references')
