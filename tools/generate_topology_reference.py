"""Independent finite topology data from reflexive transitive relations."""
from pathlib import Path
import itertools,json
def preorders(n):
 off=[(i,j) for i in range(n) for j in range(n) if i!=j]
 for flags in itertools.product([0,1],repeat=len(off)):
  R=[[i==j for j in range(n)] for i in range(n)]
  for (i,j),v in zip(off,flags):R[i][j]=bool(v)
  if all(not(R[i][j] and R[j][k]) or R[i][k] for i in range(n) for j in range(n) for k in range(n)):yield R
def opens(R):
 n=len(R)
 return [U for U in range(2**n) if all(not(U>>i&1 and R[i][j]) or U>>j&1 for i in range(n) for j in range(n))]
records=[{'relation':R,'opens':opens(R)} for R in preorders(3)]
records.sort(key=lambda row:sum(2**U for U in row['opens']))
maps=[[code%3,code//3%3,code//9] for code in range(27)]
continuous=[]
for A in records:
 for B in records:
  good=[code for code,f in enumerate(maps) if all(not A['relation'][i][j] or B['relation'][f[i]][f[j]] for i in range(3) for j in range(3))]
  continuous.append(good)
quotients=[]
for source,A in enumerate(records):
 for f in itertools.product(range(2),repeat=3):
  if len(set(f))!=2:continue
  R=[[i==j for j in range(2)] for i in range(2)]
  for i in range(3):
   for j in range(3):
    if A['relation'][i][j]:R[f[i]][f[j]]=True
  for k in range(2):
   for i in range(2):
    for j in range(2):R[i][j] |= R[i][k] and R[k][j]
  quotients.append({'source':source,'map':f,'opens':opens(R)})
products=[]
two=[{'relation':R,'opens':opens(R)} for R in preorders(2)]
for i,A in enumerate(two):
 for j,B in enumerate(two):
  R=[[A['relation'][a//2][b//2] and B['relation'][a%2][b%2] for b in range(4)] for a in range(4)]
  products.append({'x':A['opens'],'y':B['opens'],'opens':opens(R)})
data={'topologies':records,'continuousMapCodes':continuous,'quotients':quotients,'products':products}
(Path(__file__).with_name('fixtures')/'topology-reference.json').write_text(json.dumps(data,separators=(',',':'))+'\n')
print('Independent preorder reference:',len(records),'topologies,',len(continuous)*27,'maps,',len(quotients),'quotients,',len(products),'products')
