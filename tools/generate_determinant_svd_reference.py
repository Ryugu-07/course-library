# Optional fixture regeneration: requires numpy and mpmath. CI reads the checked-in JSON.
from pathlib import Path
import numpy as np,json,mpmath as mp
r=Path(__file__).resolve().parents[1];rng=np.random.default_rng(6101);fixtures=[]
for i in range(180):
 s=float(rng.uniform(.03,1.4));k=float(rng.uniform(-.8,.8));h=float(rng.uniform(-.8,.8));b=float(rng.uniform(.5,1.5));swap=bool(i%2)
 a=np.array([[s*np.exp(k),h,-h/2],[0,s,h/2],[0,0,s*np.exp(-k)]])
 if swap:a=a[:,[1,0,2]]
 sv=np.linalg.svd(a,compute_uv=False)
 fixtures.append(dict(params=dict(scale=s,anisotropy=k,shear=h,basisScale=b,swapped=swap),values=sv.tolist(),source='NumPy/LAPACK SVD'))
for exponent in [6,12,30,100]:
 mp.mp.dps=max(100,exponent*4)
 for h in ['-0.8','0.3']:
  for k in ['-0.8','0.8']:
   s=mp.mpf(10)**(-exponent);hh=mp.mpf(h);kk=mp.mpf(k)
   a=mp.matrix([[s*mp.exp(kk),hh,-hh/2],[0,s,hh/2],[0,0,s*mp.exp(-kk)]])
   sv=mp.svd(a,compute_uv=False)
   fixtures.append(dict(params=dict(scale=float(s),anisotropy=float(k),shear=float(h),basisScale=1,swapped=False),values=[float(v) for v in sv],source=f'mpmath SVD {mp.mp.dps} digits'))
generic=[]
for i in range(80):
 a=rng.normal(size=(3,3))*10.**(-(i%12));generic.append(dict(matrix=a.tolist(),values=np.linalg.svd(a,compute_uv=False).tolist()))
(r/'tools/fixtures/determinant-svd-reference.json').write_text(json.dumps(dict(provenance=dict(numpy=np.__version__,mpmath=mp.__version__,seed=6101,method="NumPy LAPACK SVD for ordinary cases; direct mpmath SVD at 100–400 decimal digits for tiny scales"),family=fixtures,generic=generic),indent=2)+'\n')
print(len(fixtures),'family and',len(generic),'generic SVD references')
