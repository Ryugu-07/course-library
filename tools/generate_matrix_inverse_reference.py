"""Regenerate exact binary-input 2x2 references using Python's Fraction."""
from pathlib import Path
from fractions import Fraction
import math, random, json
rng=random.Random(6201)
matrices=[[[0.,0.],[0.,0.]],[[1.,2.],[2.,4.]],[[1.,1.],[1.,math.nextafter(1.,2.)]],[[1e-200,0.],[0.,1e-200]],[[1e200,0.],[0.,1e200]],[[math.ulp(0.),0.],[0.,1.]],[[1e308,1e308],[1e308,math.nextafter(1e308,0.)]]]
for i in range(400):
 exponent=rng.randint(-900,900)
 matrices.append([[math.ldexp(float(rng.randint(-16,16)),exponent if i%2 else rng.randint(-900,900)) for _ in range(2)] for _ in range(2)])
rows=[]
for a in matrices:
 f=[[Fraction.from_float(v) for v in row] for row in a];det=f[0][0]*f[1][1]-f[0][1]*f[1][0]
 rank=2 if det else 1 if any(v for row in a for v in row) else 0
 try: value=float(det)
 except OverflowError: value='overflow'
 inv=None
 if det:
  exact=[[f[1][1]/det,-f[0][1]/det],[-f[1][0]/det,f[0][0]/det]]
  try:
   inv=[[float(v) for v in row] for row in exact]
   if any(v and converted==0 for row,out in zip(exact,inv) for v,converted in zip(row,out)):inv='unrepresentable'
  except OverflowError:inv='unrepresentable'
 rows.append(dict(matrix=a,rank=rank,determinant=value,inverse=inv))
target=Path(__file__).resolve().parent/'fixtures/matrix-exact-reference.json'
target.write_text(json.dumps(dict(provenance='Python fractions.Fraction.from_float exact binary input; seed 6201',cases=rows),indent=2)+'\n')
print(len(rows),'exact rank/determinant/inverse fixtures')
