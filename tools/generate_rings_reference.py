"""Independent polynomial reduction, subset ideals and rational fixed spaces."""
from pathlib import Path
import itertools,json
import sympy as sp
x=sp.symbols('x')
models=[('f2-field',2,x*x+x+1),('f2-repeated',2,x*x+1),('f3-field',3,x*x+1),('f3-split',3,x*x-1)]
reference={'extensions':{},'galois':[]}
for name,p,f in models:
 pairs=list(itertools.product(range(p),repeat=2))
 polynomials=[a+b*x for a,b in pairs]
 products=[]
 for a in polynomials:
  row=[]
  for b in polynomials:
   rem=sp.Poly(sp.rem(a*b,f,domain=sp.GF(p)),x,modulus=p)
   row.append(pairs.index((int(rem.nth(0))%p,int(rem.nth(1))%p)))
  products.append(row)
 addition=[[pairs.index(((a[0]+b[0])%p,(a[1]+b[1])%p)) for b in pairs] for a in pairs]
 ideals=[]
 for mask in range(1,2**len(pairs),2):
  I=[i for i in range(len(pairs)) if mask>>i&1];S=set(I)
  if all(addition[a][b] in S for a in I for b in I) and all(products[a][b] in S for a in I for b in range(len(pairs))):ideals.append(I)
 reference['extensions'][name]={'pairs':pairs,'products':products,'addition':addition,'ideals':ideals,'roots':[a for a in range(p) if int(f.subs(x,a))%p==0],'irreducible':bool(sp.Poly(f,x,modulus=p).is_irreducible)}
ops=[sp.diag(1,s,t,s*t) for s,t in [(1,1),(-1,1),(1,-1),(-1,-1)]]
for subgroup in [[0],[0,1],[0,2],[0,3],[0,1,2,3]]:
 constraints=sp.Matrix.vstack(*(ops[i]-sp.eye(4) for i in subgroup))
 basis=constraints.nullspace()
 reference['galois'].append({'ops':subgroup,'basis':[[int(v) for v in b] for b in basis]})
target=Path(__file__).with_name('fixtures')/'rings-reference.json'
target.write_text(json.dumps(reference,ensure_ascii=False,indent=2)+'\n')
print('SymPy quotient multiplication, all ideals and rational fixed spaces generated')
