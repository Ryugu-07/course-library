"""Independent simultaneous-ODE references via SciPy expm and DOP853."""
from pathlib import Path
import json
import numpy as np
from scipy.linalg import expm
from scipy.integrate import solve_ivp
root=Path(__file__).resolve().parents[1]
base=np.array([.012,.06,3,.035,.022]);powers=np.array([4,18,0,8,6])
initial=np.array([.72,.27,0,.005,.005,0.])
rows=[];cross=0;maxdiff=0
for mode in ['steady','cooling']:
 for theta in [.4,.7,.9,1.,1.13,1.25,1.35]:
  for gamma in [.01,.06,.14]:
   y=initial.copy()
   for step in range(80):
    t=max(.12,theta*np.exp(-gamma*step)) if mode=='cooling' else theta
    rates=base*t**powers;Q=np.zeros((6,6))
    for j,k in enumerate(rates):Q[j,j]=-k;Q[j+1,j]=k
    result=expm(Q*.5)@y
    if step in [0,31,79]:
     other=solve_ivp(lambda _,v:Q@v,[0,.5],y,method='DOP853',rtol=2.3e-14,atol=1e-16).y[:,-1]
     err=float(np.max(np.abs(result-other)));assert err<2e-14,err
     maxdiff=max(maxdiff,err);cross+=1
    y=result
    if step in [0,1,7,31,79]:rows.append({'params':{'mode':mode,'theta':theta,'coolingRate':gamma,'steps':step+1},'reference':y.tolist()})
path=root/'tools/fixtures/nucleosynthesis-reference.json'
path.write_text(json.dumps({'method':'SciPy expm; selected individual steps cross-checked with DOP853','crossChecks':cross,'maxCrossDifference':maxdiff,'rows':rows},indent=2)+'\n')
print(len(rows),'cases;',cross,'DOP853 checks;',maxdiff,'max difference')
