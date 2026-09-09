"""Independent high precision integrals, polylogarithmic wave tails and heat series."""
from pathlib import Path
import json,math
import mpmath as m
m.mp.dps=85
out={'method':'mpmath 85 digits: quadrature coefficients/norms; infinite wave tails via polylog; heat positive series to 4096 (Hurwitz zeta at t=0)','coefficients':[],'tails':[],'laplace':[]}
for n in range(1,33):out['coefficients'].append([n,float(2/m.pi*m.quad(lambda x:x*(m.pi-x)*m.sin(n*x),[0,m.pi]))])
out['initialL2Squared']=float(m.quad(lambda x:x*x*(m.pi-x)**2,[0,m.pi]));out['waveEnergy']=float(m.quad(lambda x:(m.pi-2*x)**2/2,[0,m.pi]))
for mode in ['heat','wave']:
 for N in [1,2,7,15,16]:
  for time in [0,.0001,.45,1,math.pi/2,2]:
   t=m.mpf(time)
   if mode=='wave':
    total=((1-m.mpf(2)**-6)*m.zeta(6)+m.re(m.polylog(6,m.exp(2j*t))-m.polylog(6,m.exp(4j*t))/64))/2
    tail=total-m.fsum(m.cos(n*t)**2/m.mpf(n)**6 for n in range(1,N+1,2))
   elif time==0:
    first=N+1 if N%2==0 else N+2;tail=m.zeta(6,m.mpf(first)/2)/64
   else:tail=m.fsum(m.exp(-2*n*n*t)/m.mpf(n)**6 for n in range(N+1,4097) if n%2)
   assert tail>=0
   out['tails'].append({'mode':mode,'N':N,'time':time,'norm':float(m.sqrt(32/m.pi*tail))})
for n in [1,3,7,16,512,4096]:
 for y in [0,1e-12,math.pi/2,math.nextafter(math.pi,0),math.pi]:
  # The JS domain endpoint is the represented Math.PI; use the same exact represented endpoint.
  out['laplace'].append({'n':n,'y':y,'factor':float(m.sinh(n*m.mpf(y))/m.sinh(n*m.mpf(math.pi)))})
p=Path(__file__).parent/'fixtures/pde-separation-reference.json';p.write_text(json.dumps(out,indent=2)+'\n');print('PASS reference',len(out['coefficients']),len(out['tails']),len(out['laplace']))
