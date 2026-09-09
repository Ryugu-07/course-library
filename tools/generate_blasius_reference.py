"""Independent Blasius reference: SciPy adaptive collocation, not RK shooting."""
from pathlib import Path
import json
import numpy as np
from scipy.integrate import solve_bvp
from scipy.optimize import brentq

def solve(end):
    eta=np.linspace(0,end,401)
    guess=np.vstack((eta-1+np.exp(-eta),1-np.exp(-eta),np.exp(-eta)))
    sol=solve_bvp(lambda x,y:np.vstack((y[1],y[2],-.5*y[0]*y[2])),lambda a,b:np.array([a[0],a[1],b[1]-1]),eta,guess,tol=1e-11,max_nodes=30000)
    assert sol.success,sol.message
    return sol
refs={end:solve(end) for end in [10,12,16]}
sol=refs[16]
result={'method':'SciPy solve_bvp adaptive fourth-order collocation; f(0)=fp(0)=0, fp(end)=1; tol=1e-11','truncations':[{'end':end,'slope':float(s.y[2,0]),'eta99':float(brentq(lambda x:s.sol(x)[1]-.99,4,6,xtol=1e-13)),'maxResidual':float(np.max(s.rms_residuals)),'nodes':len(s.x)} for end,s in refs.items()],'samples':[{'eta':float(eta),'f':float(sol.sol(eta)[0]),'u':float(sol.sol(eta)[1]),'du':float(sol.sol(eta)[2])} for eta in sorted(set([0.,12.]+[j*.037 for j in range(325)]))]}
out=Path(__file__).parent/'fixtures/blasius-reference.json'
out.write_text(json.dumps(result,indent=2)+'\n')
print('PASS',result['truncations'])
