from fractions import Fraction as F
from pathlib import Path
import json,random,math,itertools
R=Path(__file__).resolve().parents[1]
if not (R/'math-course').exists():R=Path('/Users/karasuakamatsu/course-library')
def conic(values):
 a,b,l,m,r=map(F,values);shift=r+(l*l/(4*a) if a else 0)+(m*m/(4*b) if b else 0)
 if a and b:
  if a*b>0:k='point' if not shift else 'ellipse' if shift*a>0 else 'empty'
  else:k='pair-of-lines' if not shift else 'hyperbola'
 elif a or b:
  q=a or b;free=m if a else l;k='parabola' if free else 'double-line' if not shift else 'parallel-lines' if shift*q>0 else 'empty'
 else:k='line' if l or m else 'whole-plane' if not r else 'empty'
 return dict(kind=k,sign=(shift>0)-(shift<0))
rows=[]
for v in itertools.product([-1,0,1],repeat=5):rows.append(dict(input=v,expected=conic(v)))
rng=random.Random(890902)
for i in range(700):
 scale=math.ldexp(1.,rng.choice([-900,-500,-100,0,100,500,900]));v=[rng.randint(-8,8)*scale for _ in range(5)];rows.append(dict(input=v,expected=conic(v)))
for scale in [math.ulp(0.),1e-300,1e-12,1,1e300]:
 for v in [[scale,scale,0,0,scale],[scale,-scale,0,0,scale],[scale,0,0,scale,0],[0,0,0,0,scale]]:rows.append(dict(input=v,expected=conic(v)))
models=[('ellipsoid',[1,2,3],[0,0,0],1),('one-sheet',[1,1,-1],[0,0,0],1),('two-sheet',[1,-1,-1],[0,0,0],1),('cone',[1,1,-1],[0,0,0],0),('paraboloid',[1,1,0],[0,0,-1],0),('saddle',[1,-1,0],[0,0,-1],0),('elliptic-cylinder',[1,2,0],[0,0,0],1),('hyperbolic-cylinder',[1,-1,0],[0,0,0],1),('parabolic-cylinder',[1,0,0],[0,-1,0],0),('point',[1,2,3],[0,0,0],0),('intersecting-planes',[1,-1,0],[0,0,0],0),('parallel-planes',[1,0,0],[0,0,0],1),('double-plane',[1,0,0],[0,0,0],0),('empty',[1,2,3],[0,0,0],-1)]
cuts=[]
for name,lam,linear,rho in models:
 for axis in range(3):
  for s in [-4,-2,-1,-1e-12,0,math.ulp(0.),1e-300,1e-12,.5,1/math.sqrt(3),math.nextafter(1/math.sqrt(3),0),math.nextafter(1/math.sqrt(3),1),1,2,4]:
   rest=[j for j in range(3) if j!=axis];rhs=F(rho)-F(lam[axis])*F(s)**2-F(linear[axis])*F(s);expected=conic([lam[rest[0]],lam[rest[1]],linear[rest[0]],linear[rest[1]],rhs]);cuts.append(dict(modelId=name,axis=axis,slice=s,expected=expected))
out=dict(method='Exact Python rational completion of squares, including binary64 slice before evaluation',conics=rows,cuts=cuts)
(R/'tools/fixtures/quadric-reference.json').write_text(json.dumps(out,separators=(',',':'))+'\n');print(len(rows),'conics',len(cuts),'slices')
