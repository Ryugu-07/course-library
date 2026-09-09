"""Independent real 2x2 Fourier IVP (Radau), quadrature and 100-digit plasma boundaries."""
from pathlib import Path
import json
import math
import mpmath as mp
from scipy.integrate import solve_ivp,quad
from scipy.constants import hbar,m_e,c,k,e,epsilon_0,mu_0,m_p
mp.mp.dps=100
rows=[]
for L in [.5,1,2]:
 for U in [-.6,0,.6]:
  for eta in [0,.025,.25]:
   for mode in [1,2,8]:
    q=2*math.pi*mode/L;decay=eta*q*q;omega=U*q
    sol=solve_ivp(lambda t,a:[-decay*a[0]+omega*a[1],-omega*a[0]-decay*a[1]],[0,.15],[math.cos(.3),math.sin(.3)],method='Radau',rtol=2e-11,atol=2e-13)
    assert sol.success
    power=quad(lambda x:eta*(q*math.sin(q*x+.3))**2,0,L,epsabs=1e-10)[0]/L
    loss=quad(lambda t:power*math.exp(-2*decay*t),0,.15,epsabs=1e-10)[0]
    rows.append(dict(params=dict(L=L,U=U,eta=eta,mode=mode,phase=.3,time=.15),a=sol.y[:,-1].tolist(),joule=loss))
fermi=[]
for exponent in range(6,39):
 n=mp.mpf(10)**exponent;pf=mp.mpf(hbar)*(3*mp.pi**2*n)**(mp.mpf(1)/3)
 tf=(mp.sqrt(mp.mpf(m_e)**2*mp.mpf(c)**4+pf**2*mp.mpf(c)**2)-mp.mpf(m_e)*mp.mpf(c)**2)/mp.mpf(k)
 tg=mp.mpf(e)**2/(4*mp.pi*mp.mpf(epsilon_0)*mp.mpf(k))*(4*mp.pi*n/3)**(mp.mpf(1)/3)
 fermi.append(dict(n=float(n),tf=float(tf),tg=float(tg)))
const=dict(hbar=hbar,me=m_e,c=c,k=k,e=e,eps0=epsilon_0,mu0=mu_0,mp=m_p)
p=Path(__file__).with_name('fixtures')/'mhd-reference.json';p.write_text(json.dumps(dict(method='SciPy Radau real Fourier system; independent QUADPACK spatial/time quadrature; mpmath 100 digit boundaries',modes=rows,boundaries=fermi,constants=const),indent=2)+'\n')
print(len(rows),'independent mode/energy references;',len(fermi),'boundary references')
