from pathlib import Path
from fractions import Fraction
from math import gcd,lcm
import json,subprocess,itertools,random,sys,shutil,hashlib,html,re
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/homology-boundary.js'
FIXTURE=JS.with_name('homology-snapshot157.json')if len(sys.argv)>1 else ROOT/'course-shared/projects/homology-boundary/run-snapshot.json'
checks=0
def ck(v,m='assertion'):
 global checks
 checks+=1
 if not v:raise AssertionError(m)
def M(a):return [[int(x)for x in r]for r in a['data']]
def eye(n):return [[int(i==j)for j in range(n)]for i in range(n)]
def multiply(a,b,n):return [[sum(x*b[k][j]for k,x in enumerate(row))for j in range(n)]for row in a]
def vector(a,v):return [sum(x*y for x,y in zip(row,v))for row in a]
def columns(a,cols,n):return [[a[i][j]for j in cols]for i in range(n)]
def rank(a,p=0):
 a=[[Fraction(v)if not p else v%p for v in r]for r in a];k=0
 for j in range(len(a[0])if a else 0):
  found=next((i for i in range(k,len(a))if a[i][j]),None)
  if found is None:continue
  a[k],a[found]=a[found],a[k];inv=1/a[k][j]if not p else pow(a[k][j],-1,p);a[k]=[x*inv if not p else x*inv%p for x in a[k]]
  for i in range(k+1,len(a)):
   q=a[i][j];a[i]=[x-q*y if not p else(x-q*y)%p for x,y in zip(a[i],a[k])]
  k+=1
  if k==len(a):break
 return k
def smith_check(source,s):
 a=M(source);m,n=source['rows'],source['cols'];D,U,V,Ui,Vi=[M(s[k])for k in ['D','U','V','inverseU','inverseV']]
 ck(multiply(multiply(U,a,n),V,n)==D,'UAV certificate');ck(multiply(U,Ui,m)==multiply(Ui,U,m)==eye(m));ck(multiply(V,Vi,n)==multiply(Vi,V,n)==eye(n))
 diag=list(map(int,s['diagonal']));ck(s['rank']==rank(a)==len(diag));ck(all(x>0 for x in diag));ck(all(y%x==0 for x,y in zip(diag,diag[1:])))
 ck(all(D[i][j]==(diag[i]if i==j and i<len(diag)else 0)for i in range(m)for j in range(n)))
 current=[r.copy()for r in a]
 for i,z in enumerate(s['steps']):
  ck(z['index']==i);u,v=z['i'],z['j'];q=int(z['multiple'])if z['multiple']is not None else None
  if z['kind']=='swapRows':current[u],current[v]=current[v],current[u]
  elif z['kind']=='swapColumns':
   for row in current:row[u],row[v]=row[v],row[u]
  elif z['kind']=='addRow':current[u]=[x+q*y for x,y in zip(current[u],current[v])]
  elif z['kind']=='addColumn':
   for row in current:row[u]+=q*row[v]
  elif z['kind']=='negateRow':current[u]=[-x for x in current[u]]
  else:raise AssertionError(z['kind'])
  ck(current==M(z['matrix']),'entire integer operation')
 ck(current==D)
def input_model(p):
 if p['mode']=='simplicial':
  cells=[set()for _ in range(4)]
  for s in p['facets'].split(';'):
   for k in range(1,len(s)+1):cells[k-1].update(''.join(v)for v in itertools.combinations(s,k))
  cells=[sorted(v)for v in cells];dims=list(map(len,cells));D=[{'rows':0,'cols':dims[0],'data':[]}]
  # Incidence determined by set inclusion; missing vertex gives the sign.
  for k in range(1,4):D.append({'rows':dims[k-1],'cols':dims[k],'data':[[0 if not set(face)<set(top)else (-1)**next(i for i,v in enumerate(top)if v not in face)for top in cells[k]]for face in cells[k-1]]})
 elif p['mode']=='cellular':
  m=int(p['m']);dims,rows={'rp2':([1,1,1,0],['','2','']),'torus':([1,2,1,0],['','','']),'klein':([1,2,1,0],['',';'.join(str('abAb'.count(g)-'abAb'.count(g.upper()))for g in 'ab'),'']),'moore':([1,1,1,0],['',str(m),'']),'sphere3':([1,0,0,1],['','','']),'lens':([1,1,1,1],['',str(m),''])}[p['model']];cells=None
 else:dims=list(map(int,p['dimensions'].split(',')));rows=[p['d1'],p['d2'],p['d3']];cells=None
 if cells is None:
  cells=[['c'+str(k)+'_'+str(i)for i in range(n)]for k,n in enumerate(dims)];D=[{'rows':0,'cols':dims[0],'data':[]}]
  for k,s in enumerate(rows):D.append({'rows':dims[k],'cols':dims[k+1],'data':[[0]*dims[k+1]for _ in range(dims[k])]if not s else[list(map(int,r.split(',')))for r in s.split(';')]})
 D.append({'rows':dims[3],'cols':0,'data':[[]for _ in range(dims[3])]});return dims,cells,D
def selection_z(s,c,A,B,h):
 bd=vector(M(A),c);cycle=not any(bd);ck(s['boundary']==list(map(str,bd))and s['cycle']==cycle)
 if not cycle:ck(s['classification']=='not-cycle'and s['filling']is None and s['order']is None);return
 low=h['lowerSmith'];up=h['upperSmith'];z=vector(M(low['inverseV']),c)[low['rank']:];u=vector(M(up['U']),z);di=list(map(int,up['diagonal']));v=[x%di[j]if j<len(di)else x for j,x in enumerate(u)];ck(s['kernelCoordinates']==list(map(str,z)));ck(s['smithCoordinates']==list(map(str,u)));ck(s['classCoordinates']==list(map(str,v)))
 order=None if any(v[len(di):])else lcm(*(d//gcd(d,x)for d,x in zip(di,v)))
 ck(s['order']==(None if order is None else str(order)));ck(s['classification']==('boundary'if not any(v)else'infinite-class'if order is None else'torsion-class'))
 if order is None:ck(s['filling']is None)
 else:ck(vector(M(B),list(map(int,s['filling'])))==[order*x for x in c],'filling of minimal multiple')
def verify(d):
 p,r=d['parameters'],d['result'];dims,cells,D=input_model(p);ck(r['dimensions']==dims and r['cells']==cells)
 for a,b in zip(r['boundaries'],D):ck(a['rows']==b['rows']and a['cols']==b['cols']and M(a)==M(b),'full input boundary')
 valid=True
 for k,z in enumerate(r['chainChecks'],1):
  prod=multiply(M(D[k-1]),M(D[k]),D[k]['cols']);zero=not any(v for row in prod for v in row);valid &= zero;ck(z['degree']==k and M(z['product'])==prod and z['zero']==zero)
 ck(r['validIntegerComplex']==valid);c=[0]*dims[int(p['degree'])]if p['chain']==''else list(map(int,p['chain'].split(',')));ck(r['chain']==list(map(str,c)));ck(r['eulerChains']==sum((-1)**k*n for k,n in enumerate(dims)))
 if not valid:ck(r['integerHomology']is None and r['selected']is None and r['fieldComparisons']is None);return
 H=r['integerHomology'];ck(len(H)==4)
 for k,h in enumerate(H):
  A,B=D[k],D[k+1];a,b=M(A),M(B);lo=h['lowerSmith'];smith_check(A,lo);K=M(h['kernelBasis']);expectedK=columns(M(lo['V']),range(lo['rank'],dims[k]),dims[k]);ck(K==expectedK);ck(not any(v for row in multiply(a,K,dims[k]-lo['rank'])for v in row))
  trans=multiply(M(lo['inverseV']),b,B['cols']);ck(M(h['transformedUpper'])==trans);ck(not any(v for row in trans[:lo['rank']]for v in row));C=trans[lo['rank']:];ck(M(h['upperInKernel'])==C);ck(multiply(K,C,B['cols'])==b,'image in integer kernel basis');up=h['upperSmith'];smith_check(h['upperInKernel'],up)
  reps=multiply(K,M(up['inverseU']),len(C));ck(M(h['quotientRepresentatives'])==reps);ck(h['freeRank']==dims[k]-rank(a)-rank(b));di=list(map(int,up['diagonal']));ck(h['torsion']==[str(v)for v in di if v>1]);indices=[j for j in range(len(C))if j>=len(di)or di[j]>1];ck([z['coordinate']for z in h['generators']]==indices)
  for z in h['generators']:
   j=z['coordinate'];v=[row[j]for row in reps];ck(z['representative']==list(map(str,v)));ck(not any(vector(a,v)));order=di[j]if j<len(di)else None;ck(z['order']==(None if order is None else str(order)))
   if order is not None:ck(vector(b,list(map(int,z['fillingMultiple'])))==[order*x for x in v])
   else:ck(z['fillingMultiple']is None)
 ck(r['eulerHomology']==r['eulerChains']);k=int(p['degree']);selection_z(r['integerSelection'],c,D[k],D[k+1],H[k])
 for field in r['fieldComparisons']:
  prime=int(field['prime']);ck(prime in [2,3,5]);ck(len(field['groups'])==4)
  for j,h in enumerate(field['groups']):
   a,b=M(D[j]),M(D[j+1]);n=dims[j];ra,rb=rank(a,prime),rank(b,prime);ck(h['lowerRank']==ra and h['upperRank']==rb);ck(h['dimension']==n-ra-rb)
   kb,bb,hb=[[[int(x)for x in v]for v in h[key]]for key in ['kernelBasis','boundaryBasis','homologyBasis']]
   ck(len(kb)==n-ra and len(bb)==rb and len(hb)==n-ra-rb);ck(rank(kb,prime)==len(kb));ck(rank(bb+hb,prime)==len(bb+hb))
   for v in kb+bb+hb:ck(len(v)==n and all(0<=x<prime for x in v));ck(not any(x%prime for x in vector(a,v)))
   bt=list(map(list,zip(*b)))if b else [[]for _ in range(D[j+1]['cols'])];ck(rank(bb+bt,prime)==rb,'boundary basis spans image')
   for key,source in [('lower',D[j]),('upper',D[j+1])]:
    R=M(h[key+'Rref']);U=M(h[key+'RowChange']);ck([[v%prime for v in row]for row in multiply(U,M(source),source['cols'])]==R);ck(rank(U,prime)==source['rows']);current=[[v%prime for v in row]for row in M(source)]
    for i,z in enumerate(h[key+'Steps']):
     ck(i==z['index']);u,v,q=z['i'],z['j'],int(z['multiple'])
     if z['kind']=='swapRows':current[u],current[v]=current[v],current[u]
     elif z['kind']=='scaleRow':current[u]=[x*q%prime for x in current[u]]
     else:ck(z['kind']=='addRow');current[u]=[(x+q*y)%prime for x,y in zip(current[u],current[v])]
     ck(current==M(z['matrix']))
    ck(current==R)
   uct=H[j]['freeRank']+sum(int(v)%prime==0 for v in H[j]['torsion'])+(sum(int(v)%prime==0 for v in H[j-1]['torsion'])if j else 0);ck(h['uctDimension']==h['dimension']==uct)
  s=field['selection'];bd=[x%prime for x in vector(M(D[k]),c)];ck(s['cycle']==(not any(bd))and s['boundary']==list(map(str,bd)))
  if not s['cycle']:ck(s['classification']=='not-cycle'and s['filling']is None);continue
  g=field['groups'][k];basis=g['boundaryBasis']+g['homologyBasis'];co=list(map(int,s['decomposition']['solution']));reconstructed=[sum(int(v[j])*x for v,x in zip(basis,co))%prime for j in range(dims[k])];ck(reconstructed==[x%prime for x in c]);hc=co[len(g['boundaryBasis']):];ck(s['homologyCoordinates']==list(map(str,hc)));ck(s['classification']==('boundary'if not any(hc)else'homology-class'))
  if not any(hc):ck(s['filling']['consistent']);ck([x%prime for x in vector(M(D[k+1]),list(map(int,s['filling']['solution']))) ]==[x%prime for x in c])
  else:ck(s['filling']is None)
 expected=r['integerSelection']if p['coefficient']=='Z'else next(f['selection']for f in r['fieldComparisons']if f['prime']==p['coefficient']);ck(r['selected']==expected)
def main():
 global JS
 if len(sys.argv)>1 and sys.argv[1].endswith('.json'):data=json.loads(Path(sys.argv[1]).read_text())
 else:
  if len(sys.argv)>1:JS=Path(sys.argv[1]).resolve()
  extra=[];rng=random.Random(157)
  for i in range(24):
   # d1=(u,v), d2=t*(v,-u), hence d1*d2=0 with a nontrivial kernel basis.
   u,v,t=rng.randint(-2,2),rng.randint(-2,2),rng.randint(-3,3);extra.append({'mode':'custom','dimensions':'1,2,1,0','d1':str(u)+','+str(v),'d2':str(t*v)+';'+str(-t*u),'chain':str(v)+';'+str(-u)})
  for p in extra:p['chain']=p['chain'].replace(';',',')
  extra += [{'mode':'cellular','model':'moore','m':str(m),'chain':str(c),'coefficient':p}for m in [-8,-3,0,1,2,5,8]for c,p in [(0,'Z'),(2,'2'),(-1,'3')]]
  extra += [dict(mode='cellular',model='klein',coefficient=p,chain=c)for p in ['Z','2','3','5']for c in ['1,0','0,1','0,2','1,1']]
  code="const a=require(process.argv[1]);console.log(JSON.stringify(a.PRESETS.map(p=>p.values).concat(JSON.parse(process.argv[2])).map(a.snapshot)))"
  data=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS),json.dumps(extra)]))
 for d in data:verify(d)
 print(json.dumps({'status':'PASS','states':len(data),'checks':checks}));return data
def close(a,b,msg='coordinate'):ck(abs(a-b)<1e-9,msg)
def view_contract(d,plots,ledgers,svgs):
 import xml.etree.ElementTree as ET
 import math
 r=d['result'];ck(len(plots)==len(svgs)==4)
 for k,(q,raw)in enumerate(zip(plots,svgs)):
  e=ET.fromstring(raw);ck(e.get('width')=='900'and e.get('height')=='425'and e.get('role')=='img');ck(e.find('{*}title').text==q['title'])
  if q['type']=='complex':
   ck(k==0 and r['geometric']);ck(q['cells']==r['cells']and q['chain']==r['chain']and q['degree']==r['degree']and q['dimensions']==r['dimensions']);n=len(r['cells'][0]);positions={v:(280+180*math.cos(-math.pi/2+2*math.pi*i/max(1,n)),215+125*math.sin(-math.pi/2+2*math.pi*i/max(1,n)))for i,v in enumerate(r['cells'][0])}
   ck(len(q['positions'])==n)
   for v in q['positions']:close(v['x'],positions[v['label']][0]);close(v['y'],positions[v['label']][1])
   nodes=e.findall('{*}circle');ck(len(nodes)==n)
   for i,z in enumerate(nodes):ck(z.get('data-vertex')==str(i));close(float(z.get('cx')),positions[r['cells'][0][i]][0]);close(float(z.get('cy')),positions[r['cells'][0][i]][1])
   faces=[z for z in e.findall('{*}polygon')if z.get('data-face')is not None];ck(len(faces)==len(r['cells'][2]))
   for i,(f,z)in enumerate(zip(r['cells'][2],faces)):
    ck(z.get('data-face')==str(i));points=[list(map(float,v.split(',')))for v in z.get('points').split()];ck(len(points)==3)
    for p,v in zip(points,f):close(p[0],positions[v][0]);close(p[1],positions[v][1])
   edges=e.findall('{*}line');arrows=[z for z in e.findall('{*}polygon')if z.get('data-arrow')is not None];ck(len(edges)==len(arrows)==len(r['cells'][1]))
   for i,(s,z,ar)in enumerate(zip(r['cells'][1],edges,arrows)):
    a,b=positions[s[0]],positions[s[1]];ck(z.get('data-edge')==ar.get('data-arrow')==str(i));color='#b44a72'if r['degree']==1 and r['chain'][i]!='0'else'#268bd2';ck(z.get('stroke')==ar.get('fill')==color)
    for key,value in [('x1',a[0]),('y1',a[1]),('x2',b[0]),('y2',b[1])]:close(float(z.get(key)),value)
    dx,dy=b[0]-a[0],b[1]-a[1];le=math.hypot(dx,dy);ux,uy=dx/le,dy/le;x,y=a[0]+.6*dx,a[1]+.6*dy;expected=[[x+6*ux,y+6*uy],[x-6*ux+3*uy,y-6*uy-3*ux],[x-6*ux-3*uy,y-6*uy+3*ux]]
    values=[list(map(float,p.split(',')))for p in ar.get('points').split()];ck(len(values)==3)
    for actual,ref in zip(values,expected):close(actual[0],ref[0]);close(actual[1],ref[1])
   for kind,degree in [('edge',1),('face',2)]:
    labels=[z for z in e.findall('{*}text')if z.get('data-'+kind+'-chain')is not None];ck(len(labels)==(len(r['cells'][degree])if r['degree']==degree else 0))
    for i,z in enumerate(labels):ck(z.text==r['cells'][degree][i]+': '+r['chain'][i])
   counts=[z for z in e.findall('{*}text')if z.get('data-cell-count')is not None];ck([z.text for z in counts]==[str(i)+'维单纯形：'+str(v)for i,v in enumerate(r['dimensions'])])
  elif q['type']=='chain':
   ck(k==0 and not r['geometric']);ck(q['dimensions']==r['dimensions']and q['matrices']==r['boundaries'][1:4]and q['valid']==r['validIntegerComplex']);groups=[z for z in e.findall('{*}text')if z.get('data-chain-group')is not None];ck(len(groups)==4)
   for z in groups:
    j=int(z.get('data-chain-group'));ck(z.text=='C'+str(j)+'：Z^'+str(r['dimensions'][j]));close(float(z.get('x')),100+(3-j)*220)
   shapes=[z for z in e.findall('{*}text')if z.get('data-matrix-shape')is not None];ck(len(shapes)==3)
   for z in shapes:j=int(z.get('data-matrix-shape'));m=r['boundaries'][j];ck(z.text==str(m['rows'])+'×'+str(m['cols']))
   arrows=e.findall('{*}line');ck(len(arrows)==3)
   for z in arrows:j=int(z.get('data-chain-arrow'));x=100+(3-j)*220;close(float(z.get('x1')),x+55);close(float(z.get('x2')),x+160);close(float(z.get('y1')),180);close(float(z.get('y2')),180)
  elif q['type']=='matrix':
   expected=r['boundaries'][r['degree']]if k==1 else next(z['product']for z in r['chainChecks']if not z['zero']);ck(q['matrix']==expected);m=expected;entries=[z for z in e.findall('{*}text')if z.get('data-entry')is not None];rects=e.findall('{*}rect');ck(len(entries)==len(rects)==m['rows']*m['cols'])
   if m['rows']and m['cols']:
    size=min(42,250/m['rows'],650/m['cols'])
    for i in range(m['rows']):
     for j in range(m['cols']):
      index=i*m['cols']+j;z,b=entries[index],rects[index];v=m['data'][i][j];key=str(i)+'-'+str(j);ck(z.get('data-entry')==b.get('data-cell')==key and z.text==v);close(float(z.get('x')),120+(j+.5)*size);close(float(z.get('y')),103+(i+.5)*size+5);close(float(b.get('x')),120+j*size);close(float(b.get('y')),103+i*size);close(float(b.get('width')),size);close(float(b.get('height')),size);ck(b.get('fill')==('none'if v=='0'else'#cb6a16'if v.startswith('-')else'#268bd2'))
  else:
   ck(q['type']=='chart')
   if not r['validIntegerComplex']:expected={'dimensions':[[i,n]for i,n in enumerate(r['dimensions'])]};line=False
   elif k==2:expected={'integer':[[h['degree'],h['freeRank']]for h in r['integerHomology']],**{'p'+f['prime']:[[h['degree'],h['dimension']]for h in f['groups']]for f in r['fieldComparisons']}};line=True
   else:
    s=r['selected'];v=(s['classCoordinates']if d['parameters']['coefficient']=='Z'else s['homologyCoordinates'])if s['cycle']else s['boundary'];expected={'class'if s['cycle']else'boundary':[[i,int(x)]for i,x in enumerate(v)]};line=False
   ck({z['key']:z['points']for z in q['series']}==expected);ck(all(z['line']==line for z in q['series']));ck(not q['square']and not q['markers']);ck(all(v==int(v)for v in q['xTicks']+q['yTicks']))
   xmin,xmax,ymin,ymax=[q[key]for key in ['xmin','xmax','ymin','ymax']];ck(xmax>xmin and ymax>ymin);X=lambda v:100+750*(v-xmin)/(xmax-xmin);Y=lambda v:335-250*(v-ymin)/(ymax-ymin)
   cc=e.findall('{*}circle');ck(len(cc)==sum(len(z['points'])for z in q['series']))
   for ss in q['series']:
    nodes=[z for z in cc if z.get('data-series')==ss['key']];ck(len(nodes)==len(ss['points']))
    for i,(z,(x,y))in enumerate(zip(nodes,ss['points'])):ck(z.get('data-index')==str(i)and z.get('fill')==ss['color']);ck(xmin<=x<=xmax and ymin<=y<=ymax);close(float(z.get('cx')),X(x));close(float(z.get('cy')),Y(y))
    lines=[z for z in e.findall('{*}polyline')if z.get('data-series')==ss['key']];ck(len(lines)==int(line))
    if lines:
     points=[list(map(float,p.split(',')))for p in lines[0].get('points').split()];ck(len(points)==len(ss['points']));ck(lines[0].get('stroke')==ss['color'])
     for (x,y),(a,b)in zip(ss['points'],points):close(X(x),a);close(Y(y),b)
 tabs={z['key']:z for z in ledgers};ck(len(tabs)==len(ledgers))
 def summary(key,obj,exclude=[]):ck([z[1]for z in tabs[key]['rows']]==[v for k,v in obj.items()if k not in exclude],'full ledger '+key)
 def records(key,rows):ck(tabs[key]['rows']==[list(v.values())for v in rows],'full steps '+key)
 summary('summary',r,['boundaries','integerHomology','fieldComparisons','selected','integerSelection']);records('boundaries',[{'degree':j,'matrix':m}for j,m in enumerate(r['boundaries'])])
 if r['validIntegerComplex']:
  for h in r['integerHomology']:
   key='z'+str(h['degree']);summary(key,h,['lowerSmith','upperSmith'])
   for suffix,field in [('lower','lowerSmith'),('upper','upperSmith')]:summary(key+'-'+suffix,h[field],['steps']);records(key+'-'+suffix+'-steps',h[field]['steps'])
  for f in r['fieldComparisons']:
   for h in f['groups']:
    key='p'+f['prime']+'-h'+str(h['degree']);summary(key,h,['lowerSteps','upperSteps']);records(key+'-lower-steps',h['lowerSteps']);records(key+'-upper-steps',h['upperSteps'])
   summary('p'+f['prime']+'-selected',f['selection'])
  summary('integer-selected',r['integerSelection'])
 for t in ledgers:ck(all(len(row)==len(t['headers'])for row in t['rows']))

data=main()
live=len(data)
f=json.loads(FIXTURE.read_text());frozen=[f[k]for k in ["solid","surface","filled","torsion"]]
for d in frozen:verify(d)
data+=frozen
code=r"""const a=require(process.argv[1]),fs=require('fs'),data=JSON.parse(fs.readFileSync(0,'utf8')),f=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));const same=f.provenance.node===process.version&&f.provenance.platform===process.platform&&f.provenance.arch===process.arch;if(same)for(const d of data.slice(-4))if(JSON.stringify(a.snapshot(d.parameters))!==JSON.stringify(d))throw Error('Same runtime frozen replay changed');let invalid=0;
const bad=v=>{let threw=false;try{a.snapshot(v)}catch(e){threw=true}if(!threw)throw Error('Accepted invalid '+JSON.stringify(v));invalid++};
for(const v of [null,true,[],{},'', '0 1','10','001','01234','5','01;01','01;'.repeat(17)+'02'])bad({facets:v});
for(const v of [null,true,[],{},'1.0','1e0','1 2','13','-13','1,2','0.000001'])bad({chain:v});
for(const v of [null,true,[],{},'4','-1','00','0.5'])bad({degree:v});
for(const v of [null,true,[],{},'','1,2,3','1,2,3,7','1, 2,3,0','1,2,3,10'])bad({mode:'custom',dimensions:v,chain:''});
for(const k of ['d1','d2','d3'])for(const v of [null,true,[],{},'9','1.5','1, 0','1e0'])bad({mode:'custom',dimensions:'1,1,1,1',chain:'1',[k]:v});
for(const v of [null,true,[],{},'','9','-9','1.5','1e0'])bad({mode:'cellular',model:'moore',chain:'1',m:v});
[null,[],false,{mode:'bad'},{coefficient:'4'},{coefficient:'Q'},{mode:'cellular',model:'bad',chain:'1'},{mode:'cellular',model:'lens',m:'0',chain:'1'},{mode:'custom',dimensions:'1,0,0,0',chain:'1'},{mode:'custom',dimensions:'1,0,0,0',chain:'',d1:'0'}].forEach(bad);
console.log(JSON.stringify({invalid,self:a.selfTest(),data:data.map(d=>{const plots=a.plots(d);return{plots,ledgers:a.ledgers(d),svgs:plots.map(a.svg)}})}));"""
bundle=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve()),str(FIXTURE.resolve())],input=json.dumps(data).encode()))
for d,v in zip(data,bundle['data']):view_contract(d,v['plots'],v['ledgers'],v['svgs'])
ck(bundle['invalid']==83);ck(bundle['self']=={'status':'PASS','checks':15})
print(json.dumps({'status':'PASS','states':len(data),'checks':checks,'invalid':bundle['invalid'],'self':bundle['self']['checks']}))

data=[{**d,**v}for d,v in zip(data,bundle["data"])]
f=json.loads(FIXTURE.read_text());ck(f['schema']==1 and f['provenance']['jsSha256']==hashlib.sha256(JS.read_bytes()).hexdigest(),'fixed full snapshot provenance')
ck(f['provenance']=={'date':'2026-09-11','node':'v24.14.0','platform':'darwin','arch':'arm64','jsSha256':hashlib.sha256(JS.read_bytes()).hexdigest()},'fixed environment')
ck(bundle['invalid']==83 and bundle['self']['status']=='PASS'and bundle['self']['checks']==15,'invalid and self checks')
if len(sys.argv)==1:
 from html.parser import HTMLParser
 src=(ROOT/'grad-math/lectures/at-03-homology.md').read_text();site=(ROOT/'grad-math/site/at-03-homology.html').read_text()
 formulas=[(a or b).strip()for a,b in re.findall(r'\$\$(.*?)\$\$|(?<!\\)\$(?!\$)(.*?)(?<!\\)\$(?!\$)',src,re.S)]
 actual=[html.unescape(a or b).strip()for a,b in re.findall(r'<(?:span|div) class="arithmatex">(?:\\\((.*?)\\\)|\\\[(.*?)\\\])</(?:span|div)>',site,re.S)]
 ck(formulas==actual,'every source formula preserved');ck(all('<'not in s for s in formulas),'HTML safe formulas');ck(len(re.findall(r'^## [0-9]+\.',src,re.M))==12,'twelve sections')
 ck(not re.search(r'<p>\s*<details|</details>\s*</p>',site),'balanced disclosure paragraphs')
 class Disclosure(HTMLParser):
  def __init__(self):super().__init__();self.stack=[];self.answers=0
  def handle_starttag(self,tag,attrs):
   if tag=='details':
    ck(not self.stack,'no nested answers');kind=dict(attrs).get('class');ck(kind in ['answer','page-toc'],'known disclosure');self.stack.append([kind,0]);self.answers+=kind=='answer'
   if tag=='summary':ck(bool(self.stack),'owned summary');self.stack[-1][1]+=1
  def handle_endtag(self,tag):
   if tag=='details':ck(bool(self.stack),'paired disclosure');ck(self.stack.pop()[1]==1,'one summary')
 parser=Disclosure();parser.feed(re.search(r'<article[^>]*>(.*?)</article>',site,re.S).group(1));ck(parser.answers==4 and not parser.stack,'four complete answers')
 for link in re.findall(r'(?:href|src)="([^"]+)"',site):
  target=link.split('#')[0].split('?')[0]
  if target and not re.match(r'^[a-zA-Z]+:',target)and not target.startswith('/'):ck((ROOT/'grad-math/site'/target).exists(),'local target '+target)
 for course in ['ai-course','grad-math','math-course']:ck((ROOT/course/'site/assets/learning/labs/homology-boundary.js').read_bytes()==JS.read_bytes(),'JS mirror')
 ck((ROOT/'grad-math/site/assets/learning/projects/homology-boundary/run-snapshot.json').read_bytes()==FIXTURE.read_bytes(),'snapshot mirror')
 ck((ROOT/'.github/workflows/course-audit.yml').read_text().count('python tools/check_homology_boundary_full.py')==1,'CI invocation')
 image=ROOT/'grad-math/images/at-03-homology-ledgers.svg';ck(image.read_bytes()==(ROOT/'grad-math/site/assets/img/at-03-homology-ledgers.svg').read_bytes(),'static mirror')
 panels=ET.parse(image).getroot().findall('.//{http://www.w3.org/2000/svg}svg');ck(len(panels)==4,'four fixed panels');frozen=data[-4:]
 def compare_svg(a,b):
  ck(a.tag==b.tag and set(a.attrib)==set(b.attrib),'full static structure');ck(a.text==b.text and a.tail==b.tail,'static text exact')
  pattern=r'[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?'
  for key,v in a.attrib.items():
   w=b.attrib[key]
   if key in {'x','y','x1','x2','y1','y2','cx','cy','r','width','height'}:ck(abs(float(v)-float(w))<=1e-9,'static subnanopixel coordinate')
   elif key in {'points','d'}:
    ck(re.sub(pattern,'#',v)==re.sub(pattern,'#',w),'static geometry syntax');av=re.findall(pattern,v);bv=re.findall(pattern,w);ck(len(av)==len(bv),'static geometry length')
    for x,y in zip(av,bv):ck(abs(float(x)-float(y))<=1e-9,'static subnanopixel geometry')
   else:ck(v==w,'static attribute '+key)
  ck(len(a)==len(b),'static children')
  for x,y in zip(a,b):compare_svg(x,y)
 for panel,(run,index)in zip(panels,[(0,0),(1,0),(2,0),(3,2)]):
  panel.attrib.pop('x');panel.attrib.pop('y');compare_svg(panel,ET.fromstring(frozen[run]['svgs'][index]))
 original=ET.fromstring('<svg><text x="10">target</text><polyline points="1,2 3,4"/></svg>');tiny=ET.fromstring(ET.tostring(original));tiny[0].set('x','10.000000000000002');compare_svg(original,tiny)
 for mutation in ['coordinate','point','label','attribute','node']:
  changed=ET.fromstring(ET.tostring(original))
  if mutation=='coordinate':changed[0].set('x','10.000001')
  elif mutation=='point':changed[1].set('points','1,2')
  elif mutation=='label':changed[0].text='wrong'
  elif mutation=='attribute':changed[1].set('stroke','red')
  else:changed.remove(changed[1])
  rejected=False
  try:compare_svg(original,changed)
  except AssertionError:rejected=True
  ck(rejected,'negative control '+mutation)
 table=re.search(r'data-learning-lab="homology-boundary".*?<tbody>(.*?)</tbody>',site,re.S).group(1)
 vals=[html.unescape(x).strip()for x in re.findall(r'<tr>\s*<td>.*?</td>\s*<td[^>]*>(.*?)</td>\s*</tr>',table,re.S)]
 a=f['solid']['result'];b=f['surface']['result'];c=f['filled']['result'];d=f['torsion']['result']
 refs=[a['integerHomology'][1]['freeRank'],'边界',','.join(a['chain']),','.join(a['integerSelection']['filling']),b['integerHomology'][2]['freeRank'],'无限阶'if b['integerSelection']['order']is None else b['integerSelection']['order'],b['dimensions'][3],c['integerHomology'][2]['freeRank'],'边界',','.join(c['integerSelection']['filling']),c['dimensions'][3],d['integerHomology'][1]['freeRank'],','.join(d['integerHomology'][1]['torsion']),d['integerSelection']['order'],','.join(d['integerSelection']['filling']),d['fieldComparisons'][0]['groups'][1]['dimension'],d['fieldComparisons'][0]['groups'][2]['dimension'],d['fieldComparisons'][1]['groups'][1]['dimension']]
 ck(len(vals)==len(refs)==18,'all 18 fallback values')
 for x,y in zip(vals,refs):ck(x==str(y),'fixed full fallback')
 for word in ['整数核','三维边界','填充见证','run-snapshot.json','overflow-wrap:anywhere']:ck(word in site,'evidence boundary '+word)
 print('formulas',len(formulas))
print(json.dumps({'status':'PASS','liveStates':live,'frozenStates':4,'checks':checks,'invalid':bundle['invalid'],'self':bundle['self']['checks']},ensure_ascii=False))
