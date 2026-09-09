"""Independent mpmath/QUADPACK/Radau reference; not needed by browser or CI."""
import json
from pathlib import Path
import mpmath as mp
from scipy.integrate import quad, solve_ivp
mp.mp.dps=100
rows=[]
for Iin,S in [(0,0),(.25,1.4),(2,.5),(.8,.8),(1e-8,1e-10),(1e6,2e5)]:
 for tau in [0,1e-16,1e-10,.05,.25,1.1,5,8,50,700,1000]:
  a,b,t=map(mp.mpf,(Iin,S,tau));esc=mp.exp(-t)
  for bins in [1,6,8,17,256]:
   layers=[]
   for k in range(bins):
    # Reflect precisely the binary endpoints passed through the JS interface.
    start=tau*k/bins;end=tau*(k+1)/bins;lo,hi=mp.mpf(start),mp.mpf(end)
    weight=mp.exp(-(t-hi))*(-mp.expm1(-(hi-lo)))
    layers.append(float(b*weight))
   rows.append(dict(Iin=Iin,S=S,tau=tau,bins=bins,transmitted=float(a*esc),emitted=float(b*(-mp.expm1(-t))),Iout=float(a*esc+b*(-mp.expm1(-t))),layers=layers))
ode=[]
for Iin,S in [(.25,1.4),(2,.5),(.8,.8)]:
 for tau in [.05,.25,1.1,5,8,50]:
  sol=solve_ivp(lambda t,y:[S-y[0]],(0,tau),[Iin],method='Radau',rtol=2e-12,atol=2e-14)
  assert sol.success
  ode.append(dict(Iin=Iin,S=S,tau=tau,Iout=float(sol.y[0,-1])))
barbier=[]
for mu in [.001,.05,.2,.5,1]:
 for a,b,c in [(1,2,0),(1,2,.4),(0,0,1)]:
  value,error=quad(lambda u:(a+b*mu*u+c*mu*mu*u*u)*__import__('math').exp(-u),0,__import__('numpy').inf,epsabs=2e-12,epsrel=2e-12)
  barbier.append(dict(mu=mu,a=a,b=b,c=c,I=value,error=error))
out=dict(method='mpmath 100 digits (exact binary inputs), SciPy Radau ODE and QUADPACK surface integral',slabs=rows,ode=ode,barbier=barbier)
p=Path(__file__).parent/'fixtures/radiative-reference.json';p.write_text(json.dumps(out,indent=2)+'\n');print(len(rows),'slabs',len(ode),'ODEs',len(barbier),'surface integrals')
