"""Exact transportation LP, independent dense elimination, complete plots and publication checks."""
from pathlib import Path
from fractions import Fraction as F
from itertools import combinations,product
from math import comb,isclose
import json,subprocess,random,shutil,sys,hashlib,re,html,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/transport-duality.js'
FIXTURE=JS.with_name('transport-snapshot152.json')if len(sys.argv)>1 else ROOT/'course-shared/projects/transport-duality/run-snapshot.json'
configs=[{}, {'metric':'quadratic'}, {'a':'1','b':'0.5,0.5','x':'0','y':'-1,1'}, {'a':'0.5,0.5','b':'0.5,0.5','x':'0,1','y':'2,3'}, {'a':'0.5,0.5','b':'0.5,0.5','x':'0,1','y':'2,3','metric':'quadratic'}, {'a':'0,1','b':'0.5,0.5'}, {'a':'0.000001,0.999999','b':'0.999999,0.000001'}, {'gauge':'-0.123456'}, {'a':'1','b':'1','x':'-1000','y':'1000','metric':'quadratic'}, {'a':'0.75,0.25','b':'0.25,0.75','x':'1,0','y':'1.25,0.25'}]
configs += [dict(metric='custom',a='0.5,0.5',b='0.5,0.5',costs=C)for C in ['1,1;1,1','-1,2;3,-4','0,0;0,0','0,0.000001;0.000001,0','1000000,-1000000;-1000000,1000000']]
configs += [dict(metric='custom',a='0.5,0.25,0.25',b='0.5,0.5',costs='0,0;0,10;10,0')]
configs += [dict(mode='candidate',**c)for c in [{},{'candidatePlan':'0,0;0,0','candidatePhi':'0,0','candidatePsi':'0,0'},{'candidatePlan':'0,0.75;0.25,0'},{'candidatePlan':'-0.1,0.85;0.35,-0.1'},{'candidatePhi':'3,3','candidatePsi':'0,0'},{'candidatePhi':'-1,-2','candidatePsi':'-4,-5','gauge':'1000'}]]
random.seed(152)
for i in range(12):
 m,n=random.choice([(2,3),(3,2),(3,3),(3,4),(4,3)]);av=[0]+sorted(random.sample(range(1,100),m-1))+[100];bv=[0]+sorted(random.sample(range(1,100),n-1))+[100]
 a=','.join(str((av[j+1]-av[j])/100)for j in range(m));b=','.join(str((bv[j+1]-bv[j])/100)for j in range(n));x=','.join(map(str,random.sample(range(-8,9),m)));y=','.join(map(str,random.sample(range(-8,9),n)))
 configs.append(dict(a=a,b=b,x=x,y=y,metric=random.choice(['absolute','quadratic'])))

code=r"""const a=require(process.argv[1]),fs=require('fs'),configs=JSON.parse(fs.readFileSync(0,'utf8')),f=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
let invalid=0;const bad=v=>{let failed=false;try{a.snapshot(v);}catch(e){failed=true;}if(!failed)throw Error('Accepted invalid '+JSON.stringify(v));invalid++;};
const junk=[null,true,false,[],{},'', 'NaN','Infinity','0x1','1e-3','0.0000001','1.2.3'];
for(const [base,keys]of [[{},['a','b','x','y','gauge']],[{metric:'custom'},['costs']],[{mode:'candidate'},['candidatePlan','candidatePhi','candidatePsi']]])for(const key of keys)for(const v of junk)bad({...base,[key]:v});
const special=[null,[],false,{mode:'other'},{metric:'other'},{mode:'line',metric:'custom'},{a:'0.5,0.4'},{b:'0.25,0.750001'},{a:'-0.1,1.1'},{a:'1.1,-0.1'},{a:'0.1,0.1,0.1,0.1,0.6'},{a:'0.25,0.25,0.25,0.25',b:'0.25,0.25,0.25,0.25'},{x:'0,0'},{y:'0.25,0.25'},{x:'0'},{y:'1,2,3'},{x:'-1001,0'},{y:'0,1001'},{gauge:'1001'},{gauge:'-1001'},{metric:'custom',costs:'0,1'},{metric:'custom',costs:'0,1;2,1000001'},{mode:'candidate',candidatePlan:'0,0;0,1.000001'},{mode:'candidate',candidatePlan:'-1.000001,0;0,0'},{mode:'candidate',candidatePhi:'1'},{mode:'candidate',candidatePsi:'0,1000001'}, {a:'0.5,,0.5'},{b:'0.5,0.5,'},{x:' '.repeat(513)},{metric:'custom',costs:' '.repeat(2049)}];special.forEach(bad);
const live=configs.concat(a.PRESETS.map(p=>p.values)).map(a.snapshot),frozen=['monotone','cycle','line','tie'].map(k=>f[k]);
for(const d of frozen){if(JSON.stringify(a.snapshot(d.parameters))!==JSON.stringify(d))throw Error('Frozen snapshot drift');}
const decorate=d=>({...d,plots:a.plots(d),ledgers:a.ledgers(d),svgs:a.plots(d).map(a.svg)});
console.log(JSON.stringify({states:live.concat(frozen).map(decorate),live:live.length,invalid,self:a.selfTest()}));"""
INVALID_COUNT=138
bundle=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve()),str(FIXTURE.resolve())],input=json.dumps(configs).encode()))
data=bundle['states']
checks=0
def ck(v,msg):
 global checks;checks+=1;assert v,msg
def close(x,y,msg):ck(isclose(x,float(y),rel_tol=2e-12,abs_tol=1e-12),msg+f': {x} vs {y}')
def packed(z,q,msg):ck(F(int(z['numerator']),int(z['denominator']))==q,msg+' fraction');close(z['value'],q,msg)
def mat(z,P,msg):
 ck(len(z)==len(P)and all(len(a)==len(b)for a,b in zip(z,P)),msg+' dimensions')
 for row,ref in zip(z,P):
  for a,b in zip(row,ref):packed(a,b,msg)
def unpack(z):return F(int(z['numerator']),int(z['denominator']))
def decode(P):return[[unpack(z)for z in row]for row in P]
def gauss(A,b):
 M=[list(map(F,row))+[F(v)]for row,v in zip(A,b)];n=len(b)
 for j in range(n):
  pivot=next((i for i in range(j,n)if M[i][j]),None)
  if pivot is None:return None
  M[j],M[pivot]=M[pivot],M[j];v=M[j][j];M[j]=[x/v for x in M[j]]
  for i in range(n):
   if i!=j:
    v=M[i][j];M[i]=[x-v*y for x,y in zip(M[i],M[j])]
 return[row[-1]for row in M]
def check_certificate(r,a,b,C,P,f,g):
 m,n=len(a),len(b);mat(r['plan'],P,'certificate plan')
 for key,ref in [('phi',f),('psi',g)]:
  for z,v in zip(r[key],ref):packed(z,v,key)
 row=[sum(v)for v in P];col=[sum(P[i][j]for i in range(m))for j in range(n)];rr=[row[i]-a[i]for i in range(m)];cr=[col[j]-b[j]for j in range(n)];slack=[[C[i][j]-f[i]-g[j]for j in range(n)]for i in range(m)]
 for key,ref in [('rowSums',row),('columnSums',col),('rowResiduals',rr),('columnResiduals',cr)]:
  ck(len(r[key])==len(ref),'complete '+key)
  for z,v in zip(r[key],ref):packed(z,v,key)
 primal=sum(P[i][j]*C[i][j]for i in range(m)for j in range(n));dual=sum(v*w for v,w in zip(a,f))+sum(v*w for v,w in zip(b,g));ss=sum(P[i][j]*slack[i][j]for i in range(m)for j in range(n));cor=sum(v*w for v,w in zip(rr,f))+sum(v*w for v,w in zip(cr,g))
 for key,v in [('primal',primal),('dual',dual),('gap',primal-dual),('slackSum',ss),('residualCorrection',cor)]:packed(r[key],v,key)
 ck(r['identity']and primal-dual==ss+cor,'full residual gap identity');nonnegative=all(v>=0 for row in P for v in row);balanced=not any(rr+cr);df=all(v>=0 for row in slack for v in row)
 for key,v in [('nonnegative',nonnegative),('balanced',balanced),('primalFeasible',nonnegative and balanced),('dualFeasible',df),('complementary',all(P[i][j]*slack[i][j]==0 for i in range(m)for j in range(n))),('certifiedOptimal',nonnegative and balanced and df and primal==dual)]:ck(r[key]==v,'validity '+key)
 ck(len(r['edges'])==m*n,'all certificate edges')
 for k,z in enumerate(r['edges']):
  i,j=divmod(k,n);ck(z['i']==i and z['j']==j and z['positive']==(P[i][j]>0)and z['tight']==(slack[i][j]==0),'edge identity')
  for key,v in [('mass',P[i][j]),('cost',C[i][j]),('contribution',P[i][j]*C[i][j]),('price',f[i]+g[j]),('slack',slack[i][j]),('weightedSlack',P[i][j]*slack[i][j])]:packed(z[key],v,key)
for state in data:
 c,r=state['parameters'],state['result'];a=list(map(F,c['a'].split(',')));b=list(map(F,c['b'].split(',')));m,n=len(a),len(b);shift=F(c['gauge'])
 x=list(map(F,c['x'].split(',')))if c['metric']!='custom'else None;y=list(map(F,c['y'].split(',')))if x is not None else None
 C=[list(map(F,row.split(',')))for row in c['costs'].split(';')]if x is None else[[abs(u-v)if c['metric']=='absolute'else(u-v)**2 for v in y]for u in x]
 for key,ref in [('sourceMasses',a),('targetMasses',b)]:
  ck(len(r[key])==len(ref),'all marginal values')
  for z,v in zip(r[key],ref):packed(z,v,key)
 mat(r['costs'],C,'actual cost matrix');packed(r['gauge'],shift,'gauge input')
 if x is None:ck(r['sourcePositions']is None and r['targetPositions']is None,'no invented geometry')
 else:
  for key,ref in [('sourcePositions',x),('targetPositions',y)]:
   for z,v in zip(r[key],ref):packed(z,v,key)
 # Independent dense exact elimination, not tree leaf removal.
 A=[[int(i==k//n)for k in range(m*n)]for i in range(m)]+[[int(j==k%n)for k in range(m*n)]for j in range(n-1)];rhs=a+b[:-1];bases=[];vertices={}
 for edges in combinations(range(m*n),m+n-1):
  coeff=[[row[k]for k in edges]for row in A];values=gauss(coeff,rhs)
  if values is None:continue
  P=[[F(0)for j in range(n)]for i in range(m)]
  for k,v in zip(edges,values):P[k//n][k%n]=v
  dual=gauss(list(map(list,zip(*coeff))),[C[k//n][k%n]for k in edges]);f,g=dual[:m],dual[m:]+[F(0)];pf=all(v>=0 for v in values);df=all(f[i]+g[j]<=C[i][j]for i in range(m)for j in range(n));pc=sum(P[i][j]*C[i][j]for i in range(m)for j in range(n));dc=sum(v*w for v,w in zip(a,f))+sum(v*w for v,w in zip(b,g));bases.append((edges,P,f,g,pf,df,pc,dc))
  if pf:vertices[tuple(v for row in P for v in row)]=pc
 ck(len(bases)==m**(n-1)*n**(m-1)==r['spanningTrees'],'all spanning bases');ck(r['attemptedBases']==comb(m*n,m+n-1),'all subsets counted');ck(r['feasibleBases']==sum(z[4]for z in bases),'all feasible bases');ck(r['vertexCount']==len(vertices),'distinct primal vertices');value=min(vertices.values());dualmax=max(z[7]for z in bases if z[5]);ck(value==dualmax,'independent strong duality')
 ck(len(r['basisRows'])==len(bases)and len(r['vertices'])==len(vertices),'complete enumeration tables')
 for z,ref in zip(r['basisRows'],bases):
  edges,P,f,g,pf,df,pc,dc=ref;ck(z['edges']==list(edges)and z['primalFeasible']==pf and z['dualFeasible']==df,'every basis validity');mat(z['plan'],P,'every basis plan');packed(z['primal'],pc,'basis objective');packed(z['dual'],dc,'basis dual value')
  # Normalize the independent dual to phi_0=0 before comparing.
  for zz,v in zip(z['phi'],f):packed(zz,v-f[0],'base source potential')
  for zz,v in zip(z['psi'],g):packed(zz,v+f[0],'base target potential')
 for z in r['vertices']:ck(tuple(v for row in decode(z['plan'])for v in row)in vertices,'enumerated vertex exists');packed(z['cost'],vertices[tuple(v for row in decode(z['plan'])for v in row)],'vertex cost');ck(z['optimal']==(unpack(z['cost'])==value),'optimal vertex')
 ck(r['optimalVertexCount']==sum(v==value for v in vertices.values())and r['uniqueOptimalPlan']==(sum(v==value for v in vertices.values())==1),'uniqueness of full optimal face')
 P=decode(r['optimal']['plan']);f=list(map(unpack,r['optimal']['phi']));g=list(map(unpack,r['optimal']['psi']));check_certificate(r['optimal'],a,b,C,P,f,g);packed(r['optimal']['primal'],value,'optimal value');ck(r['optimal']['certifiedOptimal'],'exact optimal certificate')
 for z,v in zip(r['basePhi'],f):packed(z,v-shift,'source gauge')
 for z,v in zip(r['basePsi'],g):packed(z,v+shift,'target gauge')
 maps=[]
 for assignment in product(*[range(n)if v else range(1)for v in a]):
  loads=[sum(a[i]for i in range(m)if assignment[i]==j)for j in range(n)];cost=sum(a[i]*C[i][assignment[i]]for i in range(m));maps.append((assignment,loads,cost,loads==b))
 ck(len(maps)==len(r['mapRows']),'all atomic maps')
 for z,(assignment,loads,cost,feasible)in zip(r['mapRows'],maps):
  ck(z['assignment']==list(assignment)and z['feasible']==feasible,'atomic map');packed(z['cost'],cost,'map cost')
  for zz,v in zip(z['loads'],loads):packed(zz,v,'map target mass')
 feasible=[z[2]for z in maps if z[3]];ck(r['mongeFeasibleCount']==len(feasible),'Monge feasible count')
 if feasible:packed(r['mongeBestCost'],min(feasible),'best Monge');packed(r['mongeGap'],min(feasible)-value,'relaxation gap')
 else:ck(r['mongeBestCost']is None and r['mongeGap']is None,'Monge infeasible distinct from cost zero')
 if c['mode']=='candidate':
  P=[list(map(F,row.split(',')))for row in c['candidatePlan'].split(';')];f=[F(v)+shift for v in c['candidatePhi'].split(',')];g=[F(v)-shift for v in c['candidatePsi'].split(',')];check_certificate(r['candidate'],a,b,C,P,f,g);candidates=[[C[i][j]-f[i]for j in range(n)]for i in range(m)];gg=[min(row[j]for row in candidates)for j in range(n)];ff=[min(C[i][j]-gg[j]for j in range(n))for i in range(m)];tr=r['repair'];mat(tr['columnCandidates'],candidates,'all c-transform candidates');check_certificate(tr['afterOne'],a,b,C,P,f,gg);check_certificate(tr['afterTwo'],a,b,C,P,ff,gg)
  for key,ref in [('maximalPsi',gg),('closedPhi',ff)]:
   for z,v in zip(tr[key],ref):packed(z,v,key)
 else:ck(r['candidate']is None and r['repair']is None,'inactive candidate')
 if x is None:ck(r['line']is None,'general cost is not metric');continue
 L=r['line'];ix=sorted(range(m),key=lambda i:x[i]);iy=sorted(range(n),key=lambda j:y[j]);ck(L['sourceOrder']==ix and L['targetOrder']==iy,'geometric order');ac=[sum(a[i]for i in ix[:k])for k in range(m+1)];bc=[sum(b[j]for j in iy[:k])for k in range(n+1)];P=[[F(0)for j in range(n)]for i in range(m)];intervals=[]
 for ii,i in enumerate(ix):
  for jj,j in enumerate(iy):
   left=max(ac[ii],bc[jj]);right=min(ac[ii+1],bc[jj+1]);mass=max(F(0),right-left);P[i][j]=mass
   if mass:intervals.append((left,right,i,j,mass))
 intervals.sort();ck(len(intervals)==len(L['quantiles']),'all nonempty quantile overlaps');mat(L['plan'],P,'independent interval intersection plan');w1=sum(P[i][j]*abs(x[i]-y[j])for i in range(m)for j in range(n));w2=sum(P[i][j]*(x[i]-y[j])**2 for i in range(m)for j in range(n));packed(L['W1'],w1,'quantile W1');packed(L['W2Squared'],w2,'quantile W2 squared');close(L['W2Approximation'],float(w2)**.5,'root is approximate')
 for z,(left,right,i,j,mass)in zip(L['quantiles'],intervals):
  ck(z['source']==i and z['target']==j,'quantile atoms')
  for key,v in [('start',left),('end',right),('mass',mass),('x',x[i]),('y',y[j]),('displacement',y[j]-x[i]),('absoluteContribution',mass*abs(y[j]-x[i])),('squareContribution',mass*(y[j]-x[i])**2)]:packed(z[key],v,key)
 grid=sorted(set(x+y));f={grid[0]:F(0)};area=F(0)
 for k,z in enumerate(grid):
  fa=sum(v for u,v in zip(x,a)if u<=z);fb=sum(v for u,v in zip(y,b)if u<=z);sa=sum(v for u,v in zip(x,a)if u==z);sb=sum(v for u,v in zip(y,b)if u==z);record=L['points'][k]
  for key,v in [('z',z),('sourceMass',sa),('targetMass',sb),('sourceCDF',fa),('targetCDF',fb),('surplus',sa-sb),('potential',f[z])]:packed(record[key],v,key)
  if k+1<len(grid):
   width=grid[k+1]-z;delta=fa-fb;slope=-((delta>0)-(delta<0));f[grid[k+1]]=f[z]+slope*width;record=L['intervals'][k];ck(record['slope']==slope,'Lipschitz optimal slope');area+=width*abs(delta)
   for key,v in [('left',z),('right',grid[k+1]),('width',width),('cdfDifference',delta),('absoluteArea',width*abs(delta)),('leftPotential',f[z]),('rightPotential',f[grid[k+1]])]:packed(record[key],v,key)
 test=sum(v*f[u]for u,v in zip(x,a))-sum(v*f[u]for u,v in zip(y,b));packed(L['cdfArea'],area,'CDF cost');packed(L['testObjective'],test,'test integral');ck(area==test==w1,'three independent W1 representations');check_certificate(L['testCertificate'],a,b,[[abs(u-v)for v in y]for u in x],P,[f[u]for u in x],[-f[v]for v in y])

print('science PASS',checks)
def vector(a,b,msg):
 ck(len(a)==len(b),msg+' length')
 for x,y in zip(a,b):close(x,y,msg)
def expected_charts(d):
 c,r=d['parameters'],d['result'];q=r['candidate']if c['mode']=='candidate'else r['optimal']
 if c['mode']=='line':
  l=r['line'];return[
   {'source':[[v,z['x']['value']]for z in l['quantiles']for v in [z['start']['value'],z['end']['value']]],'target':[[v,z['y']['value']]for z in l['quantiles']for v in [z['start']['value'],z['end']['value']]]},
   {'difference':[[v,z['cdfDifference']['value']]for z in l['intervals']for v in [z['left']['value'],z['right']['value']]]},
   {'potential':[[z['z']['value'],z['potential']['value']]for z in l['points']]},
   {'absolute':[[i,z['absoluteContribution']['value']]for i,z in enumerate(l['quantiles'])],'square':[[i,z['squareContribution']['value']]for i,z in enumerate(l['quantiles'])]}]
 if c['mode']=='candidate':return[None,None,None,{'identity':[[i,q[k]['value']]for i,k in enumerate(['gap','slackSum','residualCorrection'])]}]
 return[None,None,None,{'vertices':[[z['index'],z['cost']['value']]for z in r['vertices']],'minimum':[[0,q['primal']['value']],[max(1,len(r['vertices'])-1),q['primal']['value']]]}]
def view_check(d):
 c,r=d['parameters'],d['result'];q=r['candidate']if c['mode']=='candidate'else r['optimal'];ck(len(d['plots'])==4,'four complete panels');expected=expected_charts(d)
 for index,(p,raw,ref)in enumerate(zip(d['plots'],d['svgs'],expected)):
  e=ET.fromstring(raw);ns={'s':'http://www.w3.org/2000/svg'};ck(e.get('width')=='900'and e.get('height')=='425','native readable chart');ck(e.find('s:title',ns).text==p['title'],'accessible title')
  if p['type']=='chart':
   ck([s['key']for s in p['series']]==list(ref),'all chart series')
   for ss in p['series']:
    ck(len(ss['points'])==len(ref[ss['key']]),'all chart points')
    for a,b in zip(ss['points'],ref[ss['key']]):vector(a,b,'chart uses every actual value')
    ck(ss['line']==(ss['key']!='identity'),'honest point connection')
   if c['mode']=='line':
    lo,hi=([0,1]if index==0 else [r['line']['points'][0]['z']['value'],r['line']['points'][-1]['z']['value']]if index in [1,2]else [0,max(1,len(r['line']['quantiles'])-1)])
   else:lo,hi=0,(2 if c['mode']=='candidate'else max(1,len(r['vertices'])-1))
   if hi==lo:hi=lo+1
   ck(p['xmin']==lo and p['xmax']==hi,'full position domain')
   ticks=[lo+(hi-lo)*j/4 for j in range(5)]if c['mode']=='line'and index<3 else list(dict.fromkeys(int(lo+(hi-lo)*j/4+.5)for j in range(5)))
   vector(p['xTicks'],ticks,'position or discrete ticks');vals=[0]+[z[1]for ss in p['series']for z in ss['points']];low,high=min(vals),max(vals);pad=(high-low or 1)*.08;close(p['ymin'],low-pad,'lower plot bound');close(p['ymax'],high+pad,'upper plot bound');svg_check(raw,p)
  elif p['type']=='network':
   ck(index==0 and c['mode']!='line'and p['m']==c['m']and p['n']==c['n']and p['a']==r['sourceMasses']and p['b']==r['targetMasses']and p['edges']==q['edges'],'network full record')
   yy=lambda i,n:215 if n==1 else 110+210*i/(n-1)
   lines=e.findall('s:line[@data-edge]',ns);ck(len(lines)==c['m']*c['n'],'all network edges')
   for z,edge in zip(lines,q['edges']):
    i,j=edge['i'],edge['j'];v=edge['mass']['value'];ck(z.get('data-edge')==f'{i}-{j}','edge labels');vector([float(z.get(k))for k in ['x1','y1','x2','y2']],[230,yy(i,c['m']),670,yy(j,c['n'])],'network coordinates');ck(z.get('stroke')==('#268bd2'if v>0 else'#b44a72'if v<0 else'#87949f'),'mass sign color');close(float(z.get('stroke-width')),1 if v==0 else 2.5,'uniform nonzero widths');ck(z.get('stroke-dasharray')==('6 5'if v<=0 else None),'nonpositive dashed edge')
   nodes=e.findall('s:circle[@data-node]',ns);ck(len(nodes)==c['m']+c['n'],'all network nodes')
   for node,(side,i,n,x)in zip(nodes,[(side,i,n,x)for side,n,x in [('source',c['m'],230),('target',c['n'],670)]for i in range(n)]):ck(node.get('data-node')==f'{side}-{i}','node order');vector([float(node.get(k))for k in ['cx','cy','r']],[x,yy(i,n),11],'node geometry')
  else:
   ck(p['type']=='heat'and index in [1,2],'known heat chart');M=r['costs']if c['mode']=='optimal'and index==1 else q['plan']if index==1 else[[q['edges'][i*c['n']+j]['slack']for j in range(c['n'])]for i in range(c['m'])];ck(p['matrix']==M and p['m']==c['m']and p['n']==c['n'],'complete heat data');rects=e.findall('s:rect[@data-cell]',ns);labels=e.findall('s:text[@data-value]',ns);ck(len(rects)==len(labels)==c['m']*c['n'],'all matrix cells and values');w,h=690/c['n'],235/c['m']
   for k,(z,label)in enumerate(zip(rects,labels)):
    i,j=divmod(k,c['n']);v=M[i][j]['value'];ck(z.get('data-cell')==label.get('data-value')==f'{i}-{j}','matrix index');vector([float(z.get(t))for t in ['x','y','width','height']],[150+j*w,110+i*h,w,h],'cell dimensions');vector([float(label.get(t))for t in ['x','y']],[150+(j+.5)*w,110+(i+.5)*h+6],'label center');close(float(label.text),v,'matrix displayed value');ck(z.get('fill')==('#f7d8df'if v<0 else'#deebf7'if v>0 else'#edf1f4'),'signed matrix color');ck(label.get('fill')=='#253346','legible matrix foreground')
 tabs={t['key']:t for t in d['ledgers']};ck(len(tabs)==len(d['ledgers']),'unique ledger keys')
 def summary(key,obj,exclude):ck([z[1]for z in tabs[key]['rows']]==[v for k,v in obj.items()if k not in exclude],'every summary field '+key)
 def table(key,rows):ck(tabs[key]['rows']==[list(z.values())for z in rows],'every nested row '+key)
 summary('summary',r,['optimal','vertices','basisRows','mapRows','candidate','repair','line']);summary('optimal',r['optimal'],['edges']);table('optimalEdges',r['optimal']['edges'])
 for key in ['vertices','basisRows','mapRows']:table(key,r[key])
 if r['candidate']:
  summary('candidate',r['candidate'],['edges']);table('candidateEdges',r['candidate']['edges']);summary('repair',r['repair'],['afterOne','afterTwo'])
  for key in ['afterOne','afterTwo']:summary(key,r['repair'][key],['edges']);table(key+'Edges',r['repair'][key]['edges'])
 if r['line']:
  l=r['line'];summary('line',l,['quantiles','points','intervals','testCertificate'])
  for key in ['quantiles','points','intervals']:table(key,l[key])
  summary('testCertificate',l['testCertificate'],['edges']);table('testEdges',l['testCertificate']['edges'])
 for t in tabs.values():ck(bool(t['title'])and all(len(z)==len(t['headers'])for z in t['rows']),'complete rectangular tables')

def svg_check(raw,q):
 e=ET.fromstring(raw)if isinstance(raw,str)else raw;ns={'s':'http://www.w3.org/2000/svg'}
 ck(e.get('width')=='900'and e.get('height')=='425','readable native size');ck(e.find('s:title',ns).text==q['title'],'accessible chart title')
 X=lambda v:100+750*(v-q['xmin'])/(q['xmax']-q['xmin']);Y=lambda v:335-250*(v-q['ymin'])/(q['ymax']-q['ymin'])
 nodes=e.findall('s:circle[@data-series]',ns);ck(len(nodes)==sum(len(s['points'])for s in q['series']),'all chart points')
 for s in q['series']:
  pts=[v for v in nodes if v.get('data-series')==s['key']];ck(len(pts)==len(s['points']),'all series points')
  for k,(node,(x,y))in enumerate(zip(pts,s['points'])):
   ck(node.get('data-index')==str(k),'point order');close(float(node.get('cx')),X(x),'chart x');close(float(node.get('cy')),Y(y),'chart y');ck(node.get('fill')==s['color'],'chart color')
  lines=[v for v in e.findall('s:polyline',ns)if v.get('data-series')==s['key']];ck(len(lines)==int(s['line']),'connection policy')
  if lines:
   nums=list(map(float,re.split('[ ,]+',lines[0].get('points'))))if lines[0].get('points')else[];vector(nums,[z for x,y in s['points']for z in[X(x),Y(y)]],'all line coordinates')



for d in data:view_check(d)
f=json.loads(FIXTURE.read_text());ck(f['schema']==1 and f['provenance']['jsSha256']==hashlib.sha256(JS.read_bytes()).hexdigest(),'fixed full snapshot provenance')
ck(f['provenance']=={'date':'2026-09-11','node':'v24.14.0','platform':'darwin','arch':'arm64','jsSha256':hashlib.sha256(JS.read_bytes()).hexdigest()},'fixed environment')
ck(bundle['invalid']==INVALID_COUNT and bundle['self']['status']=='PASS'and bundle['self']['checks']==12,'invalid and self checks')
if len(sys.argv)==1:
 from html.parser import HTMLParser
 src=(ROOT/'grad-math/lectures/ot-01-monge-kantorovich.md').read_text();site=(ROOT/'grad-math/site/ot-01-monge-kantorovich.html').read_text()
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
 for course in ['ai-course','grad-math','math-course']:ck((ROOT/course/'site/assets/learning/labs/transport-duality.js').read_bytes()==JS.read_bytes(),'JS mirror')
 ck((ROOT/'grad-math/site/assets/learning/projects/transport-duality/run-snapshot.json').read_bytes()==FIXTURE.read_bytes(),'snapshot mirror')
 ck((ROOT/'.github/workflows/course-audit.yml').read_text().count('python tools/check_transport_duality_full.py')==1,'CI invocation')
 image=ROOT/'grad-math/images/ot-01-monge-kantorovich-ledgers.svg';ck(image.read_bytes()==(ROOT/'grad-math/site/assets/img/ot-01-monge-kantorovich-ledgers.svg').read_bytes(),'static mirror')
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
 for panel,(run,index)in zip(panels,[(0,0),(1,1),(2,1),(3,3)]):
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
 table=re.search(r'data-learning-lab="transport-duality".*?<tbody>(.*?)</tbody>',site,re.S).group(1)
 vals=[float(html.unescape(x))for x in re.findall(r'<tr>\s*<td>.*?</td>\s*<td[^>]*>(.*?)</td>\s*</tr>',table,re.S)]
 o=f['monotone']['result'];c=f['cycle']['result'];l=f['line']['result']['line'];t=f['tie']['result']
 refs=[o['optimal']['primal']['value'],o['optimal']['dual']['value'],o['mongeBestCost']['value'],o['mongeGap']['value'],o['vertexCount'],o['spanningTrees'],c['candidate']['primal']['value'],c['optimal']['primal']['value'],c['candidate']['primal']['value']-c['optimal']['primal']['value'],c['mongeBestCost']['value'],l['W1']['value'],l['W2Squared']['value'],l['W2Approximation'],l['testObjective']['value'],t['vertexCount'],t['optimalVertexCount'],t['optimal']['primal']['value'],t['spanningTrees']]
 ck(len(vals)==len(refs)==18,'all 18 fallback values')
 for x,y in zip(vals,refs):close(x,y,'fixed numeric fallback')
 for word in ['不会偷偷归一化','分位数','精确最优证书','run-snapshot.json','overflow-wrap:anywhere']:ck(word in site,'evidence boundary '+word)
 print('formulas',len(formulas))
print(json.dumps({'status':'PASS','liveStates':bundle['live'],'frozenStates':4,'checks':checks,'invalid':bundle['invalid'],'self':bundle['self']['checks']},ensure_ascii=False))
