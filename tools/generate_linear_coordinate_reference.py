"""Optional regeneration: Fraction for exact binary solves, mpmath for SVD."""
from pathlib import Path
from fractions import Fraction
import json, math, mpmath as mp
root=Path(__file__).resolve().parent
source=json.loads((root/'fixtures/matrix-exact-reference.json').read_text())
cases=[]
def converted(values):
 try:
  result=[float(v) for v in values]
  return 'unrepresentable' if any(v and out==0 for v,out in zip(values,result)) else result
 except OverflowError:return 'unrepresentable'
for item in source['cases']:
 a=item['matrix'];f=[[Fraction.from_float(v) for v in row] for row in a];det=f[0][0]*f[1][1]-f[0][1]*f[1][0]
 answers=[]
 for target in [[1,0],[0,1],[3,2]]:
  values=None if not det else converted([(target[0]*f[1][1]-f[0][1]*target[1])/det,(f[0][0]*target[1]-target[0]*f[1][0])/det])
  answers.append(dict(target=target,coordinates=values))
 cases.append(dict(matrix=a,rank=item['rank'],answers=answers))
mp.mp.dps=100;near=[]
for t in [math.nextafter(2.,0.),math.nextafter(2.,3.),2-1e-10,2+1e-10,-2.,0.,3.,4.]:
 for px,py in [(3.,2.),(.1,.3),(-8.,8.)]:
  tf,xf,yf=map(Fraction.from_float,[t,px,py]);d=tf-2
  coords=converted([(tf*xf-2*yf)/d,(yf-xf)/d]);a=mp.matrix([[1,2],[1,mp.mpf(t)]]);values=mp.svd(a,compute_uv=False)
  near.append(dict(t=t,px=px,py=py,coordinates=coords,condition=float(values[0]/values[1])))
(root/'fixtures/linear-coordinate-reference.json').write_text(json.dumps(dict(provenance=f'Fraction.from_float exact Cramer solves; mpmath {mp.__version__} direct SVD at 100 digits',generic=cases,near=near),indent=2)+'\n')
print(len(cases),'generic exact solve fixtures;',len(near),'basis/condition references')
