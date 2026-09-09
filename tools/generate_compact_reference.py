"""Independent 90-digit pressure quadrature and analytic profile checks."""
from pathlib import Path
import json
import mpmath as m
import sympy as s
from scipy.integrate import solve_ivp
m.mp.dps=90;root=Path(__file__).resolve().parents[1]
me=m.mpf('9.1093837015e-31');c=m.mpf(299792458);hb=m.mpf('1.054571817e-34');pref=me**4*c**5/(3*m.pi**2*hb**3)
xs=sorted(set([10**(-8+14*i/180) for i in range(181)]+[.499999,.5,.500001,.8,1.6]))
rows=[]
for x in xs:
 z=m.mpf(str(x));val=z**5*m.quad(lambda t:t**4/m.sqrt(1+z*z*t*t),[0,min(m.mpf('.1'),1/z),1])
 rows.append({'x':x,'integral':float(val),'pressure':float(pref*val)})
# Verify profile and pressure derivative without using JavaScript formulas.
f,M,R,rho,P0,r0,gamma=s.symbols('f M R rho P0 r0 gamma',positive=True)
mass=4*s.pi*R**3*rho*s.integrate(f**2*(1-f*f),(f,0,f))
assert s.simplify(mass.subs(rho,15*M/(8*s.pi*R**3))-M*(5*f**3-3*f**5)/2)==0
P=P0*(rho/r0)**gamma*(1-f*f)**gamma
assert s.simplify(-s.diff(P,f)/R-2*gamma*P0*(rho/r0)**gamma*f*(1-f*f)**(gamma-1)/R)==0
q=(5*f*f-3*f**4)/2;assert s.simplify(q.subs(f,s.sqrt(s.Rational(5,6)))-s.Rational(25,24))==0
# Independently solve n=3 Lane-Emden; supplies the dimensionless structural mass.
eps=1e-6
def rhs(x,y):return [y[1],-2*y[1]/x-y[0]**3]
def surface(x,y):return y[0]
surface.terminal=True;surface.direction=-1
sol=solve_ivp(rhs,[eps,10],[1-eps*eps/6, -eps/3],method='DOP853',rtol=2.3e-14,atol=1e-15,events=surface,max_step=.03)
xi=sol.t[-1];omega=-xi*xi*sol.y[1,-1];assert abs(omega-2.018235951)<1e-9
(root/'tools/fixtures/compact-reference.json').write_text(json.dumps({'method':'90-digit scaled integral; independent n=3 DOP853 structure','xi1':xi,'omega3':omega,'symbolicChecks':3,'rows':rows},indent=2)+'\n')
print(len(rows),'pressure cases; 3 symbolic; Lane-Emden',xi,omega)
