"""Independent QWZ references from NumPy Hermitian eigensolvers; no lab code."""
import json
from pathlib import Path
import numpy as np
sx=np.array([[0,1],[1,0]],complex);sy=np.array([[0,-1j],[1j,0]]);sz=np.diag([1,-1])
# Exact special angles prevent sin(pi) roundoff dominating a 1e-12 gap.
def sn(x): return 0. if x==0 or abs(x)==np.pi else np.sin(x)
def cs(x): return 0. if abs(x)==np.pi/2 else np.cos(x)
def ham(x,y,m): return sn(x)*sx+sn(y)*sy+(m+cs(x)+cs(y))*sz
def state(x,y,m): return np.linalg.eigh(ham(x,y,m))[1][:,0]
rows=[]
for m in [-3.2,-2.01,-1.99,-1,-.001,0,.001,1,1.99,2.01,3.2]:
 for x in [-np.pi,-1.2,0,1e-12,.7,np.pi]:
  for y in [-np.pi,-.8,0,np.pi/2]:
   if np.linalg.norm(ham(x,y,m))<1e-14:continue
   u=state(x,y,m);P=np.outer(u,u.conj());rows.append(dict(m=m,x=x,y=y,projector=np.stack([P.real,P.imag],axis=-1).tolist()))
loops=[]
for m in [-2.6,-2,-1.99,-1,-.001,0,.001,1,1.99,2,2.6]:
 for y in [-2.7,-.7,.4,np.pi/2,2.9]:
  us=[state(x,y,m) for x in np.linspace(-np.pi,np.pi,513)];z=1+0j
  for a,b in zip(us,us[1:]):z*=np.vdot(a,b)/abs(np.vdot(a,b))
  loops.append(dict(m=m,y=y,phase=float(-np.angle(z))))
edges=[]
T=(sz-1j*sx)/2
for m,y in [(-1,.5),(-.2,0),(.2,np.pi),(-1,0)]:
 for L in [12,24,48]:
  A=np.sin(y)*sy+(m+np.cos(y))*sz
  H=np.kron(np.eye(L),A)+np.kron(np.diag(np.ones(L-1),1),T)+np.kron(np.diag(np.ones(L-1),-1),T.conj().T)
  es,vs=np.linalg.eigh(H);i=int(np.argmin(abs(es-np.sin(y))));edges.append(dict(m=m,y=y,L=L,energy=float(es[i]),leftWeight=float(np.sum(abs(vs[:4,i])**2))))
Path(__file__).with_name('fixtures').joinpath('topological-numpy.json').write_text(json.dumps(dict(numpy=np.__version__,projectors=rows,loops=loops,edges=edges),indent=2)+'\n')
print('Wrote',len(rows),'projectors,',len(loops),'Wilson loops,',len(edges),'finite chains')
