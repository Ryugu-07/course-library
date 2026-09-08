"""Independent high-precision blocks and multivariate Gaussian path KL references."""
from pathlib import Path
import json
import mpmath as mp
import numpy as np
mp.mp.dps=80
blocks=[]
for h0 in [1,1.5,2,3,4,5.5,8]:
 h=mp.mpf(h0)
 def g(z):return z**h*mp.hyp2f1(h,h,2*h,z)
 def F(z):return (1-z)*g(z)-z*g(1-z)
 alpha=mp.diff(F,mp.mpf('.5'),3)-4*mp.diff(F,mp.mpf('.5'))
 for z0 in [.1,.5,.9]:
  z=mp.mpf(str(z0))
  for N in [64,128,256]:
   terms=[z**(h+n)*mp.rf(h,n)**2/(mp.rf(2*h,n)*mp.factorial(n)) for n in range(N+1)]
   partial=mp.fsum(terms);dpartial=mp.fsum((h+n)*t/z for n,t in enumerate(terms))
   blocks.append(dict(h=h0,z=z0,N=N,g=float(g(z)),d=float(mp.diff(g,z)),partial=float(partial),dpartial=float(dpartial),remainder=float(g(z)-partial),dremainder=float(mp.diff(g,z)-dpartial),alpha=float(alpha)))
controls=[]
for a in [-2,0,1,2]:
 for b in [0,1,3]:
  for e in [.5,1,2]:
   for T in [.5,1,2]:
    n=12;t=np.arange(1,n+1)*T/n;D=1+b*e*T
    base=e*np.minimum.outer(t,t);cov=base-b*e**2*np.outer(t,t)/D;mean=a*e*t/D
    KL=.5*(np.trace(np.linalg.solve(base,cov))+mean@np.linalg.solve(base,mean)-n+np.linalg.slogdet(base)[1]-np.linalg.slogdet(cov)[1])
    controls.append(dict(a=a,b=b,epsilon=e,T=T,KL=float(KL),mean=float(mean[-1]),variance=float(cov[-1,-1])))
out=Path(__file__).with_name('fixtures')/'control-blocks-reference.json';out.write_text(json.dumps(dict(blocks=blocks,controls=controls),indent=2)+'\n')
print(f'Generated {len(blocks)} block and {len(controls)} Gaussian path references')
