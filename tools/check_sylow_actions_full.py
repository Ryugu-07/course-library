from pathlib import Path
from itertools import permutations,product
import json,subprocess,sys,shutil,hashlib,html,re
import xml.etree.ElementTree as ET
checks=0
def ck(v,msg='assertion'):
 global checks
 checks+=1
 if not v:raise AssertionError(msg)
def compose(a,b):return tuple(a[b[i]]for i in range(len(a)))
def close_perms(gens,n):
 e=tuple(range(n));s={e};queue=[e]
 for x in queue:
  for y in gens:
   z=compose(y,x)
   if z not in s:s.add(z);queue.append(z)
 return s
def group_values(g):
 n=g['degree'];name=g['id']
 if name in ('s3','s4','s5','a4','a5'):
  return sorted(p for p in permutations(range(n))if name[0]=='s'or sum(p[i]>p[j]for i in range(n)for j in range(i+1,n))%2==0)
 if name=='d4':return sorted(tuple((s*i+r)%4 for i in range(4))for s in [-1,1]for r in range(4))
 if name=='v4':return sorted(tuple((i//2+a)%2*2+(i%2+b)%2 for i in range(4))for a,b in product(range(2),repeat=2))
 if name=='c15':return sorted(tuple((i+a)%15 for i in range(15))for a in range(15))
 if name=='trivial':return [(0,)]
 if name=='q8':
  units=[(1,0,0,0),(0,1,0,0),(0,0,1,0),(0,0,0,1),(-1,0,0,0),(0,-1,0,0),(0,0,-1,0),(0,0,0,-1)]
  def mult(x,y):
   a,b,c,d=x;h,i,j,k=y
   return(a*h-b*i-c*j-d*k,a*i+b*h+c*k-d*j,a*j-b*k+c*h+d*i,a*k+b*j-c*i+d*h)
  return sorted(tuple(units.index(mult(x,y))for y in units)for x in units)
 raise AssertionError(name)
def validate_group(g):
 vals=group_values(g);n=len(vals);e=vals.index(tuple(range(g['degree'])));index={v:i for i,v in enumerate(vals)}
 ck(vals==[tuple(x)for x in g['permutations']],'construction '+g['id']);ck(g['order']==n and g['identity']==e)
 mul=[[index[compose(x,y)]for y in vals]for x in vals];inv=[next(j for j in range(n)if mul[i][j]==e)for i in range(n)]
 ck(g['multiplication']==mul);ck(g['inverses']==inv)
 conj=[[mul[mul[a][x]][inv[a]]for x in range(n)]for a in range(n)];ck(g['conjugation']==conj)
 subs=g['subgroups'];sets=[frozenset(h['members'])for h in subs];ck(len(set(sets))==len(sets));ck(frozenset([e])in sets);ck(frozenset(range(n))in sets)
 # Independently enumerate via joins of cyclic permutation groups. No shipping closure/table routine.
 cyclic=[close_perms([x],g['degree'])for x in vals]
 found={frozenset([vals[e]])};queue=list(found)
 for h in queue:
  for cy in cyclic:
   if cy.issubset(h):continue
   extension=frozenset(close_perms(list(h|cy),g['degree']))
   if extension not in found:found.add(extension);queue.append(extension)
 ck(set(sets)=={frozenset(index[v]for v in h)for h in found},'complete subgroup list '+g['id'])
 def evalword(w):
  q=e
  for x in w:q=mul[q][x]
  return q
 for h,H in zip(subs,sets):
  ck(h['order']==len(H));ck(e in H and all(inv[x]in H for x in H));ck(all(mul[x][y]in H for x in H for y in H))
  ck({index[v]for v in close_perms([vals[x]for x in h['generators']],g['degree'])}==H)
  ck(set(map(int,h['words']))==H)
  for x,w in h['words'].items():ck(all(t in h['generators']for t in w)and evalword(w)==int(x))
  C=[frozenset(conj[x][a]for a in H)for x in range(n)];N=[x for x in range(n)if C[x]==H]
  ck(h['conjugates']==[sets.index(t)for t in C]);ck(h['conjugacyOrbit']==sorted({sets.index(t)for t in C}));ck(h['normalizer']==N);ck(h['normal']==(len(N)==n))
  ck(h['centralizer']==[x for x in range(n)if all(mul[x][y]==mul[y][x]for y in H)])
  ck(len(h['conjugacyOrbit'])*len(N)==n)
 for t in g['enumerationTransitions']:
  f=sets[t['from']];target=close_perms([vals[x]for x in f|{t['adjoin']}],g['degree']);ck({index[v]for v in target}==sets[t['to']])
 inc=[[i,j]for i,a in enumerate(sets)for j,b in enumerate(sets)if a<b];cov=[[i,j]for i,j in inc if not any(sets[i]<c<sets[j]for c in sets)]
 ck(g['inclusions']==inc);ck(g['covers']==cov)
 classes={frozenset(conj[x][y]for x in range(n))for y in range(n)};ck(classes=={frozenset(c['members'])for c in g['classes']})
 for c in g['classes']:
  ck(c['size']==len(c['members']));ck(c['centralizer']==[x for x in range(n)if mul[x][c['representative']]==mul[c['representative']][x]]);ck(c['size']*len(c['centralizer'])==n)
 ck(g['center']==[x for x in range(n)if all(mul[x][y]==mul[y][x]for y in range(n))])
 ck(g['abelian']==(len(g['center'])==n));normals=[h['id']for h in subs if h['normal']];ck(g['normalSubgroupIds']==normals);ck(g['simple']==(n>1 and len(normals)==2))
 for row in g['elementOrders']:
  x=row['element'];powers=[e]
  while len(powers)==1 or powers[-1]!=e:powers.append(mul[powers[-1]][x])
  ck(row['powers']==powers and row['order']==len(powers)-1)
 for s in g['sylow']:
  p=s['prime'];power=1;a=0
  while n%(power*p)==0:power*=p;a+=1
  ids=[h['id']for h in subs if len(h['members'])==power];m=n//power
  ck(s['pPower']==power and s['exponent']==a and s['cofactor']==m);ck(s['subgroupIds']==ids and s['actualCount']==len(ids));ck(s['candidates']==[v for v in range(1,m+1)if m%v==0 and v%p==1]);ck(len(ids)in s['candidates'])
 validate_derived(g,g['derived'],list(range(n)))
 return vals,mul,inv,sets
def validate_derived(g,d,initial):
 vals=[tuple(v)for v in g['permutations']];index={v:i for i,v in enumerate(vals)};mul=g['multiplication'];inv=g['inverses'];members=initial
 for i,s in enumerate(d['stages']):
  ck(s['index']==i and s['members']==members and s['order']==len(members))
  comm=[{'x':x,'y':y,'value':mul[mul[mul[x][y]][inv[x]]][inv[y]]}for x in members for y in members];ck(s['commutators']==comm)
  nxt=sorted(index[v]for v in close_perms([vals[c['value']]for c in comm],g['degree']));ck(s['next']==nxt);ck(s['stable']==(nxt==members));ck(set(map(int,s['closureWords']))==set(nxt))
  for x,w in s['closureWords'].items():
   t=g['identity']
   for a in w:ck(a in [c['value']for c in comm]);t=mul[t][a]
   ck(t==int(x))
  if i<len(d['stages'])-1:ck(nxt!=members and len(members)>1)
  members=nxt
 last=d['stages'][-1];ck(last['stable']or last['order']==1);ck(d['solvable']==(last['order']==1));ck(d['length']==(len(d['stages'])-1 if last['order']==1 else None));ck(d['terminal']==last['members'])
def validate_snapshot(d,group_checked):
 g=d['group'];p=d['parameters'];n=g['order'];e=g['identity'];mul=g['multiplication'];inv=g['inverses'];h=d['selectedSubgroup'];H=h['members'];a=d['action']
 if g['id']not in group_checked:validate_group(g);group_checked.add(g['id'])
 gens=[]if not p['generators']else list(map(int,p['generators'].split(',')));ck(h['inputGenerators']==gens);vals=[tuple(v)for v in g['permutations']];idx={v:i for i,v in enumerate(vals)};ck(H==sorted(idx[v]for v in close_perms([vals[x]for x in gens],g['degree'])))
 validate_derived(g,d['subgroupDerived'],H)
 cos=[];owner={}
 for x in range(n):
  if x in owner:continue
  c=sorted(mul[x][v]for v in H);i=len(cos);cos.append({'id':i,'representative':x,'members':c});owner.update({v:i for v in c})
 if h['normal']:
  q=d['quotient'];qm=[[owner[mul[c['representative']][t['representative']]]for t in cos]for c in cos]
  ck(q['defined']and q['cosets']==cos);ck(q['projection']==[owner[i]for i in range(n)]);ck(q['multiplication']==qm);ck(q['identity']==owner[e]);ck(q['inverses']==[owner[inv[c['representative']]]for c in cos]);ck(q['abelian']==all(qm[i][j]==qm[j][i]for i in range(len(cos))for j in range(len(cos))))
  for x in range(n):
   for y in range(n):ck(owner[mul[x][y]]==qm[owner[x]][owner[y]])
 else:
  ck(not d['quotient']['defined']);w=d['quotient']['witness'];ck(w['member']in H and w['conjugate']==mul[mul[w['conjugator']][w['member']]][inv[w['conjugator']]]and w['conjugate']not in H)
 A=list(range(n))if p['actor']=='group'else H;ck(a['actingElements']==A)
 if p['action']=='natural':images=g['permutations']
 elif p['action']=='regular':images=mul
 elif p['action']=='conjugation':images=[[mul[mul[x][y]][inv[x]]for y in range(n)]for x in range(n)]
 elif p['action']=='cosets':
  images=[[owner[mul[x][c['representative']]]for c in cos]for x in range(n)]
  ck([q['members']for q in a['points']]==[c['members']for c in cos])
 else:
  s=next(t for t in g['sylow']if t['prime']==int(p['prime']));sets=[frozenset(g['subgroups'][i]['members'])for i in s['subgroupIds']];images=[[sets.index(frozenset(mul[mul[x][y]][inv[x]]for y in c))for c in sets]for x in range(n)];ck([q['subgroupId']for q in a['points']]==s['subgroupIds'])
 m=len(images[0]);ck(len(a['points'])==m);ck(a['permutations']==[{'element':x,'images':images[x]}for x in A])
 for x in A:
  ck(sorted(images[x])==list(range(m)))
  for y in A:ck(images[mul[x][y]]==[images[x][images[y][z]]for z in range(m)])
 orbits=[];seen=set()
 for z in range(m):
  if z in seen:continue
  members=sorted({images[x][z]for x in A});seen.update(members);stab=[x for x in A if images[x][z]==z];orbits.append({'id':len(orbits),'representative':z,'members':members,'size':len(members),'stabilizer':stab,'product':len(members)*len(stab)})
 ck(a['orbits']==orbits);ck(all(o['product']==len(A)for o in orbits))
 ck(a['fixed']==[z for z in range(m)if all(images[x][z]==z for x in A)]);ker=[x for x in A if images[x]==list(range(m))];ck(a['kernel']==ker and a['faithful']==(len(ker)==1));ck(a['transitive']==(len(orbits)==1))
 point=int(p['point']);orb=sorted({images[x][point]for x in A});stab=[x for x in A if images[x][point]==point];ck(a['selected']=={'point':point,'orbit':orb,'stabilizer':stab,'product':len(orb)*len(stab),'transporters':[{'point':z,'elements':[x for x in A if images[x][point]==z]}for z in orb]})
 f=[{'element':x,'points':[z for z in range(m)if images[x][z]==z]}for x in A];ck(a['fixedByElement']==f);ck(a['burnsideNumerator']==sum(len(t['points'])for t in f)==len(A)*len(orbits));ck(a['orbitCount']==len(orbits))
def near(a,b):ck(abs(float(a)-float(b))<=1e-9,'SVG coordinate')
def view_contract(d,v):
 import xml.etree.ElementTree as ET
 g=d['group'];a=d['action'];plots=v['plots'];ck(len(plots)==len(v['svgs'])==4)
 for k,(q,raw)in enumerate(zip(plots,v['svgs'])):
  svg=ET.fromstring(raw);ck(svg.get('width')=='900'and svg.get('height')=='425'and svg.get('role')=='img');ck(svg.find('{*}title').text==q['title'])
  if k==0:
   ck(q['type']=='orbits');points=[dict(id=p['id'],orbit=next(o['id']for o in a['orbits']if p['id']in o['members']),fixed=p['id']in a['fixed'],selected=p['id']==a['selected']['point'])for p in a['points']];ck(q['points']==points);ck(q['orbitCount']==a['orbitCount']and q['actingOrder']==len(a['actingElements'])and q['stabilizerOrder']==len(a['selected']['stabilizer'])and q['selectedOrbitSize']==len(a['selected']['orbit']))
   circles=svg.findall('{*}circle');ck(len(circles)==len(points))
   for c,p in zip(circles,points):
    ck(int(c.get('data-point'))==p['id']and int(c.get('data-orbit'))==p['orbit']);near(c.get('cx'),80+62*(p['id']%12));near(c.get('cy'),99+27*(p['id']//12));near(c.get('r'),11);ck(c.get('fill')==['#268bd2','#b44a72','#52863c','#9467bd','#c17a18','#3d8e8e'][p['orbit']%6]);ck(c.get('stroke')==('#c17a18'if p['fixed']else'currentColor'));near(c.get('stroke-width'),3 if p['selected']else 1)
  elif k in [1,2]:
   if k==1:ck(q['type']=='classes');rows=[dict(id=c['id'],size=c['size'],central=c['size']==1)for c in g['classes']];ck(q['total']==g['order'])
   else:
    ck(q['type']=='subgroups');orders=sorted({h['order']for h in g['subgroups']});rows=[dict(order=n,total=sum(h['order']==n for h in g['subgroups']),normal=sum(h['order']==n and h['normal']for h in g['subgroups']))for n in orders];ck(q['total']==len(g['subgroups']))
   ck(q['rows']==rows);mx=max(1,max(r['size'if k==1 else'total']for r in rows));step=750/len(rows);bars=[e for e in svg.findall('{*}rect')if e.get('data-bar')];ck(len(bars)==len(rows)*(1 if k==1 else 2))
   for i,r in enumerate(rows):
    w=min(42,step*.65);x=80+step*i;val=r['size'if k==1 else'total'];bar=next(e for e in bars if e.get('data-bar')=='total'and e.get('data-index')==str(i));near(bar.get('x'),x+(step-w)/2);near(bar.get('y'),335-240*val/mx);near(bar.get('width'),w);near(bar.get('height'),240*val/mx);ck(bar.get('fill')==('#c17a18'if k==1 and r['central']else'#268bd2'))
    if k==2:
     bar=next(e for e in bars if e.get('data-bar')=='normal'and e.get('data-index')==str(i));near(bar.get('x'),x+(step-w*.45)/2);near(bar.get('y'),335-240*r['normal']/mx);near(bar.get('width'),w*.45);near(bar.get('height'),240*r['normal']/mx);ck(bar.get('fill')=='#c17a18')
  else:
   ck(q['type']=='derived');refs=[g['derived'],d['subgroupDerived']];ck([s['orders']for s in q['series']]==[[r['order']for r in z['stages']]for z in refs]);ck([s['solvable']for s in q['series']]==[z['solvable']for z in refs]);ck([s['key']for s in q['series']]==['group','subgroup']);mx=max(r['order']for z in refs for r in z['stages']);steps=max(1,max(len(z['stages'])-1 for z in refs));nodes=svg.findall('{*}circle');lines=svg.findall('{*}polyline');ck(len(nodes)==sum(len(z['stages'])for z in refs)and len(lines)==2)
   for j,s in enumerate(q['series']):
    color=['#268bd2','#b44a72'][j];ck(s['color']==color);pts=[]
    for i,value in enumerate(s['orders']):
     x=100+720*i/steps;y=335-235*value/mx;c=next(c for c in nodes if c.get('data-series')==s['key']and c.get('data-step')==str(i));near(c.get('cx'),x);near(c.get('cy'),y);ck(c.get('fill')==color);pts.append([x,y]);t=next(t for t in svg.findall('{*}text')if t.get('data-value')==s['key']+'-'+str(i));ck(t.text==str(value));near(t.get('x'),x+(8 if j else-8));near(t.get('y'),y-9)
    line=next(l for l in lines if l.get('data-series')==s['key']);xy=[list(map(float,t.split(',')))for t in line.get('points').split()];ck(len(xy)==len(pts));ck(line.get('stroke')==color)
    for p,r in zip(xy,pts):near(p[0],r[0]);near(p[1],r[1])
 tabs={t['key']:t for t in v['ledgers']};ck(len(tabs)==len(v['ledgers']))
 def rows(k,expected):ck(tabs[k]['rows']==expected,'complete ledger '+k)
 summary=dict(tabs['summary']['rows']);ck(summary==dict(parameters=d['parameters'],group=g['label'],order=g['order'],degree=g['degree'],identity=g['identity'],center=g['center'],abelian=g['abelian'],simple=g['simple'],normalSubgroupIds=g['normalSubgroupIds'],selectedSubgroup=d['selectedSubgroup']['id'],selectedMembers=d['selectedSubgroup']['members'],selectedInputGenerators=d['selectedSubgroup']['inputGenerators'],selectedInputWords=d['selectedSubgroup']['inputClosureWords'],orbitCount=a['orbitCount'],fixed=a['fixed'],kernel=a['kernel'],faithful=a['faithful'],transitive=a['transitive'],selected=a['selected'],burnsideNumerator=a['burnsideNumerator']))
 rows('elements',[[i,g['labels'][i],v,g['inverses'][i],g['elementOrders'][i]['order'],g['elementOrders'][i]['powers']]for i,v in enumerate(g['permutations'])]);rows('multiplication',[[i]+r for i,r in enumerate(g['multiplication'])]);rows('conjugation',[[i]+r for i,r in enumerate(g['conjugation'])]);rows('classes',[[c[k]for k in ['id','representative','members','size','centralizer']]for c in g['classes']]);rows('subgroups',[[h[k]for k in ['id','order','generators','members','normal','normalizer','centralizer','conjugates','conjugacyOrbit']]for h in g['subgroups']]);rows('words',[[h[k]for k in ['id','parent','added','words']]for h in g['subgroups']]);rows('extensions',[[t[k]for k in ['from','adjoin','to']]for t in g['enumerationTransitions']]);rows('inclusions',g['inclusions']);rows('covers',g['covers']);rows('sylow',[[s[k]for k in ['prime','exponent','pPower','cofactor','candidates','actualCount','subgroupIds']]for s in g['sylow']]);rows('points',[[p['id'],p]for p in a['points']]);rows('action',[[p['element'],p['images']]for p in a['permutations']]);rows('orbits',[[o[k]for k in ['id','representative','members','size','stabilizer','product']]for o in a['orbits']]);rows('fixed',[[r['element'],r['points']]for r in a['fixedByElement']]);rows('quotient',[[k,z]for k,z in d['quotient'].items()])
 for prefix,z in [('G',g['derived']),('H',d['subgroupDerived'])]:
  rows('derived-'+prefix,[[k,z[k]]for k in ['solvable','length','terminal']])
  for s in z['stages']:
   rows(prefix+'-stage-'+str(s['index']),[[k,s[k]]for k in ['index','members','order','next','stable','closureWords']]);rows(prefix+'-commutators-'+str(s['index']),[[c[k]for k in ['x','y','value']]for c in s['commutators']])
 for t in tabs.values():ck(all(len(r)==len(t['headers'])for r in t['rows']))

ROOT=Path(__file__).resolve().parents[1]
PREFIX=["rtk","proxy"]if shutil.which("rtk")else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/"course-shared/labs/sylow-actions.js"
FIXTURE=JS.with_name("sylow-snapshot158.json")if len(sys.argv)>1 else ROOT/"course-shared/projects/sylow-actions/run-snapshot.json"
code="const a=require(process.argv[1]),fs=require('fs'),cases=[];\nfor(const [group]of a.GROUPS){const b=a.base(group);for(const action of ['natural','regular','conjugation','cosets'])for(const actor of ['group','subgroup'])cases.push({group,action,actor,generators:group==='trivial'?'':'1'});for(const s of b.sylow){const h=b.subgroups[s.subgroupIds[0]];cases.push({group,action:'sylow',actor:'subgroup',prime:String(s.prime),generators:h.generators.join(',')});}}\ncases.push(...a.PRESETS.map(p=>p.values));const data=cases.map(a.snapshot),live=data.length;\nlet frozen=0;\nif(process.argv[2]){const f=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));for(const key of ['s3','a4','s4','a5']){const d=f[key];if(JSON.stringify(a.snapshot(d.parameters))!==JSON.stringify(d))throw Error('Frozen exact replay differs '+key);data.push(d);frozen++;}}\nlet invalid=0;const bad=x=>{let failed=false;try{a.snapshot(x)}catch(e){failed=true}if(!failed)throw Error('Accepted invalid '+JSON.stringify(x));invalid++;};\nfor(const raw of [null,true,false,1,'',[],[1]])bad(raw);\nfor(const key of ['group','action','actor'])for(const value of [null,true,[],{},0,'','bad'])bad({[key]:value});\nfor(const value of [null,1,true,{},[],',','1,','1,1','-1','6','01','1.0','1e0','1, 2'])bad({generators:value});\nfor(const value of [null,true,[],{},1,'','-1','3','119','120','00','1.5','1e0',' 1'])bad({point:value});\nfor(const value of [null,true,[],{},2,'','1','4','7','2.0'])bad({prime:value});\nbad({group:'trivial',generators:'1'});bad({group:'a4',action:'sylow',prime:'5'});bad({group:'s3',action:'sylow',prime:'5'});\nconst views=data.map(d=>({plots:a.plots(d),svgs:a.plots(d).map(a.svg),ledgers:a.ledgers(d)}));\nconst groups=Object.fromEntries(a.GROUPS.map(([id])=>[id,a.base(id)]));\nconsole.log(JSON.stringify({live,frozen,invalid,self:a.selfTest(),groups,data:data.map(d=>({...d,group:d.group.id})),views}));\n"
bundle=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve())]+([str(FIXTURE.resolve())]if FIXTURE.exists()else[]),text=True))
data=[{**d,'group':bundle['groups'][d['group']]}for d in bundle['data']];checked=set()
for d,v in zip(data,bundle['views']):validate_snapshot(d,checked);view_contract(d,v)
ck(bundle['live']==127);ck(bundle['invalid']==69);ck(bundle['self']=={'status':'PASS','checks':43,'presets':30})
print(json.dumps({'status':'PASS','live':bundle['live'],'frozen':bundle['frozen'],'groups':len(checked),'checks':checks,'invalid':bundle['invalid'],'self':bundle['self']}))

data=[{**d,**v}for d,v in zip(data,bundle["views"])]
f=json.loads(FIXTURE.read_text());ck(f['schema']==1 and f['provenance']['jsSha256']==hashlib.sha256(JS.read_bytes()).hexdigest(),'fixed full snapshot provenance')
ck(f['provenance']=={'date':'2026-09-11','node':'v24.14.0','platform':'darwin','arch':'arm64','jsSha256':hashlib.sha256(JS.read_bytes()).hexdigest()},'fixed environment')
ck(bundle['invalid']==69 and bundle['self']['status']=='PASS'and bundle['self']['checks']==43,'invalid and self checks')
if len(sys.argv)==1:
 from html.parser import HTMLParser
 src=(ROOT/'grad-math/lectures/alg2-01-groups-advanced.md').read_text();site=(ROOT/'grad-math/site/alg2-01-groups-advanced.html').read_text()
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
 for course in ['ai-course','grad-math','math-course']:ck((ROOT/course/'site/assets/learning/labs/sylow-actions.js').read_bytes()==JS.read_bytes(),'JS mirror')
 ck((ROOT/'grad-math/site/assets/learning/projects/sylow-actions/run-snapshot.json').read_bytes()==FIXTURE.read_bytes(),'snapshot mirror')
 ck((ROOT/'.github/workflows/course-audit.yml').read_text().count('python tools/check_sylow_actions_full.py')==1,'CI invocation')
 image=ROOT/'grad-math/images/alg2-01-sylow-ledgers.svg';ck(image.read_bytes()==(ROOT/'grad-math/site/assets/img/alg2-01-sylow-ledgers.svg').read_bytes(),'static mirror')
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
 for panel,(run,index)in zip(panels,[(0,0),(1,0),(2,3),(3,1)]):
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
 table=re.search(r'data-learning-lab="sylow-actions".*?<tbody>(.*?)</tbody>',site,re.S).group(1)
 vals=[html.unescape(x).strip()for x in re.findall(r'<tr>\s*<td>.*?</td>\s*<td[^>]*>(.*?)</td>\s*</tr>',table,re.S)]
 a=f['s3'];b=f['a4'];c=f['s4'];d=f['a5']
 refs=[a['group']['order'],a['selectedSubgroup']['order'],len(a['action']['points']),len(a['action']['selected']['stabilizer']),len(a['action']['kernel']),'是'if a['quotient']['defined']else'否',len(b['action']['actingElements']),','.join(str(o['size'])for o in b['action']['orbits']),len(b['action']['fixed']),next(s['actualCount']for s in b['group']['sylow']if s['prime']==3),','.join(str(s['order'])for s in c['group']['derived']['stages']),'是'if c['group']['derived']['solvable']else'否',c['group']['derived']['length'],len(c['group']['subgroups']),len(c['group']['normalSubgroupIds']),','.join(str(q['size'])for q in d['group']['classes']),'是'if d['group']['simple']else'否',','.join(str(s['order'])for s in d['group']['derived']['stages']),'是'if d['group']['derived']['solvable']else'否',len(d['group']['subgroups']),len(d['group']['normalSubgroupIds'])]
 ck(len(vals)==len(refs)==21,'all 21 fallback values')
 for x,y in zip(vals,refs):ck(x==str(y),'full fixed reference')
 for word in ['正规化子','导出列','作用核','run-snapshot.json','overflow-wrap:anywhere']:ck(word in site,'evidence boundary '+word)
 print('formulas',len(formulas))
print(json.dumps({'status':'PASS','liveStates':bundle['live'],'frozenStates':4,'checks':checks,'invalid':bundle['invalid'],'self':bundle['self']['checks']},ensure_ascii=False))
