"""Independent DOP853 IVP and 80-digit response references; no JavaScript imports."""
from pathlib import Path
import json,math
import numpy as np
import mpmath as mp
from scipy.integrate import solve_ivp
mp.mp.dps=80
out={'method':'SciPy DOP853 rtol=2e-13 atol=2e-14 max_step=.02/omega0, and mpmath 80-digit difference of cosines; float inputs represented exactly','forced':[],'free':[],'highPrecision':[]}
for w0 in [.1,1,3]:
 for ratio in [.5,.98,1,1+1e-12,1.5]:
  force=-2 if ratio==.5 else 1.;h=80/w0;ts=np.linspace(0,h,161);w=w0*ratio
  sol=solve_ivp(lambda t,v:[v[1],force*math.cos(w*t)-w0*w0*v[0]],(0,h),[0.,0.],method='DOP853',rtol=2e-13,atol=2e-14,t_eval=ts,max_step=.02/w0)
  assert sol.success
  out['forced'].append({'omega0':w0,'omega':w,'force':force,'points':[[float(t),float(y)] for t,y in zip(ts,sol.y[0])]})
for z in [0,.3,1-1e-12,1,1+1e-12,1.4,5]:
 for w0 in [.1,1,3]:
  h=12/w0;ts=np.linspace(0,h,601)
  sol=solve_ivp(lambda t,v:[v[1],-2*z*w0*v[1]-w0*w0*v[0]],(0,h),[1.,0.],method='DOP853',rtol=2e-13,atol=2e-14,t_eval=ts,max_step=.02/w0)
  assert sol.success
  out['free'].append({'zeta':z,'omega0':w0,'points':[[float(t),float(y)] for t,y in zip(ts,sol.y[0])]})
for w0 in [.01,1,10]:
 for w in [w0,math.nextafter(w0,math.inf),math.nextafter(w0,0),w0*(1+1e-12),0]:
  for t in [0,1e-12,.3,40,1000]:
   for force in [-2,0,3]:
    a,b,T,F=map(mp.mpf,[w0,w,t,force])
    y=F*T*mp.sin(a*T)/(2*a) if a==b else F*(mp.cos(b*T)-mp.cos(a*T))/(a*a-b*b)
    out['highPrecision'].append({'omega0':w0,'omega':w,'force':force,'t':t,'y':float(y)})
p=Path(__file__).parent/'fixtures/linear-ode-reference.json';p.write_text(json.dumps(out,indent=2)+'\n');print('PASS references',len(out['forced']),len(out['free']),len(out['highPrecision']))
