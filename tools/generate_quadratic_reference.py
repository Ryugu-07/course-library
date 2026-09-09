"""Optional reference regeneration; mpmath eigsy at 800 digits, seed 6501."""
from pathlib import Path
import json, math, random
import mpmath as mp
mp.mp.dps=800
rng=random.Random(6501)
def eigen(a):
 m=mp.matrix([[mp.mpf(x) for x in row] for row in a])
 if mp.det(m)==0: vals=sorted([mp.mpf(0),m[0,0]+m[1,1]],reverse=True)
 else: vals=list(reversed(list(mp.eigsy(m,eigvals_only=True))))
 out=[float(x) for x in vals]
 return 'unrepresentable' if any(not math.isfinite(v) or (v==0 and x!=0) for v,x in zip(out,vals)) else out
family=[]
for name in ['positive','indefinite','semidefinite']:
 for i in range(60):
  b=rng.uniform(-1.8,1.8);s=rng.uniform(-1.5,1.5);mb=mp.mpf(b);ms=mp.mpf(s)
  A=mp.matrix([[2,mb],[mb,2]]) if name=='positive' else mp.matrix([[1,mb],[mb,-1]]) if name=='indefinite' else mp.matrix([[1,mb],[mb,mb*mb]])
  C=mp.matrix([[1,ms],[0,1]]);B=C.T*A*C
  family.append(dict(familyId=name,b=b,shear=s,eigen=eigen(A.tolist()),congruentEigen=eigen(B.tolist())))
tiny=math.ulp(0.0);maximum=float.fromhex('0x1.fffffffffffffp+1023')
generic=[[[tiny,tiny],[tiny,0]],[[tiny,tiny],[tiny,tiny]],[[1e308,0],[0,1e-308]],[[1,1],[1,math.nextafter(1,2)]],[[maximum,maximum],[maximum,maximum]],[[0,0],[0,0]],[[1,2],[2,4]],[[1e-300,1e-300],[1e-300,1e-300]],[[maximum,0],[0,tiny]],[[0,tiny],[tiny,0]]]
for i in range(150):
 a=math.ldexp(rng.uniform(-1,1),rng.randint(-1000,1000));b=math.ldexp(rng.uniform(-1,1),rng.randint(-1000,1000));c=math.ldexp(rng.uniform(-1,1),rng.randint(-1000,1000));generic.append([[a,b],[b,c]])
out={'reference':'mpmath eigsy 800 digits; exact float inputs; constructed family uses exact parameters','mpmath':mp.__version__,'seed':6501,'family':family,'generic':[dict(matrix=a,eigen=eigen(a)) for a in generic]}
path=Path(__file__).parent/'fixtures/quadratic-spectrum-reference.json';path.write_text(json.dumps(out,indent=2)+'\n');print(len(family),'family',len(generic),'generic')
