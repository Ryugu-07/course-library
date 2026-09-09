"""Independent subgroup enumeration and cycle-based Burnside certificates."""
from pathlib import Path
from itertools import permutations,combinations
import json,math
R=Path(__file__).resolve().parents[1]
if not (R/'math-course').exists():R=Path('/Users/karasuakamatsu/course-library')
P=[(0,1,2),(1,0,2),(2,1,0),(0,2,1),(1,2,0),(2,0,1)]
tables={'c4':[[(i+j)%4 for j in range(4)] for i in range(4)],'v4':[[(i+j)%2+2*((i//2+j//2)%2) for j in range(4)] for i in range(4)],'s3':[[P.index(tuple(a[b[i]] for i in range(3))) for b in P] for a in P]}
groups={}
for name,T in tables.items():
 n=len(T);subs=[]
 for bits in range(1<<n):
  H=[i for i in range(n) if bits>>i&1]
  if 0 not in H or any(T[a][b] not in H for a in H for b in H):continue
  left=sorted({tuple(sorted(T[g][h] for h in H)) for g in range(n)});right=sorted({tuple(sorted(T[h][g] for h in H)) for g in range(n)})
  subs.append(dict(elements=H,left=left,right=right,normal=left==right))
 groups[name]=dict(table=T,subgroups=subs)
def cycles(p):
 visited=set();count=0
 for x in range(len(p)):
  if x in visited:continue
  count+=1;y=x
  while y not in visited:visited.add(y);y=p[y]
 return count
neck=[]
for n in range(3,9):
 for reflections in [False,True]:
  ps=[[(i+k)%n for i in range(n)] for k in range(n)]
  if reflections:ps += [[(k-i)%n for i in range(n)] for k in range(n)]
  fixes=[2**cycles(p) for p in ps];neck.append(dict(n=n,reflections=reflections,fixCounts=fixes,burnside=sum(fixes)//len(ps)))
# A4 subgroup orders and generation by all 3-cycles: independent finite witness only.
P4=[p for p in permutations(range(4)) if sum(p[i]>p[j] for i in range(4) for j in range(i+1,4))%2==0];T4=[[P4.index(tuple(a[b[i]] for i in range(4))) for b in P4] for a in P4];orders=[]
for bits in range(1<<12):
 H=[i for i in range(12) if bits>>i&1]
 if 0 in H and all(T4[a][b] in H for a in H for b in H):orders.append(len(H))
assert 6 not in orders
out=dict(method='Independent operation tables, all subset closure, permutation cycle count for fixed colorings',groups=groups,necklaces=neck,a4SubgroupOrders=sorted(orders))
(R/'tools/fixtures/group-reference.json').write_text(json.dumps(out,separators=(',',':'))+'\n');print({k:len(v['subgroups']) for k,v in groups.items()},'Burnside cases',len(neck),'A4 orders',sorted(set(orders)))
