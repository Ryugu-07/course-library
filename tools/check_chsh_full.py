"""Portable regression oracle; matrix formulas separately verified with NumPy and symbolic algebra."""
from pathlib import Path
import json,math,sys
checks=0
def near(a,b,label):
 global checks
 assert math.isfinite(a)and abs(a-b)<=1e-10*max(1,abs(b)),(label,a,b);checks+=1
def vector(a,b,label):
 assert len(a)==len(b)
 for x,y in zip(a,b):near(x,y,label)
def matrix(a,b,label):
 for x,y in zip(a,b):vector(x,y,label)
def classical(a,b):
 delta=abs((a-b+180)%360-180);return 2*delta/180-1
def seed0(s,i):
 x=(s^((i+1)*0x9e3779b9))&0xffffffff;x^=x>>16;x=x*0x85ebca6b&0xffffffff;x^=x>>13;return x
def wr(v):
 d=(1-v)/4;return[[d,0,0,0],[0,d+v/2,-v/2,0],[0,-v/2,d+v/2,0],[0,0,0,d]]
def summary(counts):
 n=sum(counts);return None if n==0 else(counts[0]+counts[3]-counts[1]-counts[2])/n
def aggregate(r,rows):
 n=[sum(x['counts'])for x in rows];assert r['n']==n
 if not all(n):
  for k in ['estimate','absoluteEstimate','standardError','waldDescriptive','hoeffdingRadius','rawInterval','physicalInterval']:assert r[k]is None
  return
 means=[summary(x['counts'])for x in rows];value=means[0]+means[1]+means[2]-means[3];near(r['estimate'],value,'CHSH estimate');near(r['absoluteEstimate'],abs(value),'absolute');rad=math.sqrt(2*sum(1/x for x in n)*math.log(40));near(r['hoeffdingRadius'],rad,'finite confidence radius');vector(r['rawInterval'],[value-rad,value+rad],'raw confidence');vector(r['physicalInterval'],[max(-4,value-rad),min(4,value+rad)],'algebraic domain intersection');near(r['confidence'],.95,'confidence level')
 if min(n)<2:assert r['standardError']is None and r['waldDescriptive']is None
 else:
  se=math.sqrt(sum((1-v*v)/(k-1)for v,k in zip(means,n)));near(r['standardError'],se,'descriptive SE');vector(r['waldDescriptive'],[value-1.96*se,value+1.96*se],'descriptive Wald')
def checkwerner(r):
 v=r['visibility'];rho=wr(v);pt=[[rho[2*(i//2)+j%2][2*(j//2)+i%2]for j in range(4)]for i in range(4)];matrix(r['rho'],rho,'Werner matrix');matrix(r['partialTranspose'],pt,'partial transpose');vector(r['eigenvalues'],[(1+3*v)/4]+[(1-v)/4]*3,'density spectrum');vector(r['partialEigenvalues'],[(1-3*v)/4]+[(1+v)/4]*3,'partial spectrum');matrix(r['marginalA'],[[.5,0],[0,.5]],'Alice trace');matrix(r['marginalB'],[[.5,0],[0,.5]],'Bob trace');near(r['purity'],sum(x*x for row in rho for x in row),'purity');near(r['negativity'],max(0,(3*v-1)/4),'negativity');near(r['maxSpinCHSH'],2*math.sqrt(2)*v,'CHSH spin maximum');assert r['entangled']==(v>1/3)
def check_records(records):
 global checks
 for s in records:
  assert s['version']==175 and len(s['rows'])==4 and [r['id']for r in s['rows']]==['ab','abp','apb','apbp']
  assert [r['angle']for r in s['angleScan']]==list(range(-180,181,5));assert [r['visibility']for r in s['visibilityScan']]==[i/40 for i in range(41)]
  expected=[k for k in [0,1,2,4,8,16,32,64,128,256,512,1024,2048,4096]if k<=s['parameters']['shots']]
  if s['parameters']['shots']not in expected:expected.append(s['parameters']['shots'])
  assert [p['k']for p in s['prefix']]==expected
  assert len({tuple(r[k]for k in ['a','ap','b','bp'])for r in s['strategies']})==16
  c=s['parameters'];rho=wr(c['visibility']);totals=[]
  for i,r in enumerate(s['rows']):
   a,b=[(c['a'],c['b']),(c['a'],c['bp']),(c['ap'],c['b']),(c['ap'],c['bp'])][i];assert(r['a'],r['b'],r['sign'])==(a,b,-1 if i==3 else 1);e=-c['visibility']*math.cos(math.radians(a-b))if c['model']=='quantum'else classical(a,b);near(r['theory'],e,'Born correlation')
   probs=[(1+e)/4,(1-e)/4,(1-e)/4,(1+e)/4];vector(r['probabilities'],probs,'Born joint probabilities');state=seed0(c['seed'],i);assert r['initialState']==state;counts=[0]*4;assert len(r['trials'])==c['shots']
   for j,t in enumerate(r['trials']):
    state=(1664525*state+1013904223)&0xffffffff;u=state/2**32;assert t['j']==j+1 and t['state']==state;near(t['draw'],u,'uniform draw')
    if c['model']=='classical':
     lam=2*math.pi*u;near(t['lambda'],lam,'hidden variable');A=1 if math.cos(lam-math.radians(a))>=0 else-1;B=-1 if math.cos(lam-math.radians(b))>=0 else 1;cell=(0 if A==1 else 2)+(0 if B==1 else 1)
    else:
     assert t['lambda']is None;cell=next((k for k in range(4)if u<sum(probs[:k+1])),3);A=1 if cell<2 else-1;B=1 if cell%2==0 else-1
    assert(t['A'],t['B'],t['cell'],t['product'])==(A,B,cell,A*B);counts[cell]+=1;checks+=4
   assert r['finalState']==state and r['counts']==counts and r['n']==sum(counts)
   if c['shots']:
    near(r['estimate'],summary(counts),'correlation estimate');near(r['alicePlus'],(counts[0]+counts[1])/c['shots'],'Alice margin');near(r['bobPlus'],(counts[0]+counts[2])/c['shots'],'Bob margin')
   else:assert r['estimate']is None and r['alicePlus']is None and r['bobPlus']is None
   if c['shots']>1:near(r['standardError'],math.sqrt((1-summary(counts)**2)/(c['shots']-1)),'row SE')
   else:assert r['standardError']is None
  aggregate(s['sample'],s['rows']);near(s['modelS'],sum(r['sign']*r['theory']for r in s['rows']),'theory CHSH')
  pairs=[(0,1,'alicePlus'),(2,3,'alicePlus'),(0,2,'bobPlus'),(1,3,'bobPlus')]
  for r,(i,j,key)in zip(s['marginals'],pairs):
   values=[s['rows'][i][key],s['rows'][j][key]];assert r['rates']==values;vector(r['theory'],[.5,.5],'marginal theory')
   if values[0]is None:assert r['difference']is None
   else:near(r['difference'],values[0]-values[1],'marginal difference')
  for p in s['prefix']:
   assert p['k']<=c['shots']
   for i,r in enumerate(p['rows']):
    counts=[sum(t['cell']==cell for t in s['rows'][i]['trials'][:p['k']])for cell in range(4)];assert r['counts']==counts and r['n']==sum(counts);assert r['sign']==s['rows'][i]['sign']
    if p['k']:
     near(r['estimate'],summary(counts),'prefix correlation');near(r['alicePlus'],(counts[0]+counts[1])/p['k'],'prefix Alice');near(r['bobPlus'],(counts[0]+counts[2])/p['k'],'prefix Bob')
    else:assert r['estimate']is None and r['alicePlus']is None and r['bobPlus']is None
    if p['k']>1:near(r['standardError'],math.sqrt((1-summary(counts)**2)/(p['k']-1)),'prefix row SE')
    else:assert r['standardError']is None
   aggregate(p['sample'],p['rows'])
  for r in s['angleScan']:near(r['quantum'],-c['visibility']*math.cos(math.radians(c['a']-r['angle'])),'angle quantum');near(r['classical'],classical(c['a'],r['angle']),'angle classical')
  checkwerner(s['werner'])
  near(s['werner']['chshThreshold'],1/math.sqrt(2),'CHSH threshold')
  for r in s['visibilityScan']:checkwerner(r)
  assert len(s['strategies'])==16
  for r in s['strategies']:assert r['S']in[-2,2];vector(r['correlations'],[r['a']*r['b'],r['a']*r['bp'],r['ap']*r['b'],r['ap']*r['bp']],'local correlations')
import subprocess,shutil,hashlib,re,xml.etree.ElementTree as ET,copy
prefix=['rtk','proxy']if shutil.which('rtk')else[]
staging=len(sys.argv)>1;root=Path(sys.argv[1])if staging else Path(__file__).resolve().parents[1]
js=root/'chsh-experiment175.js'if staging else root/'course-shared/labs/chsh-experiment.js'
fixture=root/'chsh-snapshot175.json'if staging else root/'course-shared/projects/chsh-certificates/run-snapshot.json'
code=r'''const a=require(process.argv[1]),f=require(process.argv[2]),d={records:a.PRESETS.map(p=>a.snapshot(p.config)),views:[],invalid:0,self:a.selfTest(),feedback:[]};
for(const visibility of [0,1/3,.5,1/Math.sqrt(2),1])for(const shots of [0,1,2,24,512,4096])d.records.push(a.snapshot({visibility,shots}));
for(const shots of [0,1,2,24,512,4096])d.records.push(a.snapshot({model:'classical',shots}));
for(const model of ['quantum','classical'])for(const seed of [0,1,4294967295])d.records.push(a.snapshot({model,seed,shots:127,a:-123,ap:277,b:31,bp:-41,visibility:.73}));
d.records.push(a.snapshot({shots:2,seed:1}));
for(const s of d.records.slice(0,12))d.views.push({s,plots:a.plots(s),svg:a.plots(s).map(a.svg),tables:a.tables(s)});
function bad(o){let threw=false;try{a.config(o)}catch(e){threw=true;}if(!threw)throw Error('invalid accepted');d.invalid++;}
for(const o of [null,[],true,1,'x',{unknown:1},JSON.parse('{"__proto__":1}')])bad(o);
for(const key of Object.keys(a.DEFAULTS).filter(k=>k!=='model'))for(const v of [NaN,Infinity,-Infinity,null,[],true,'1'])bad({[key]:v});
for(const v of ['invalid',[],null,1,true,{},'toString'])bad({model:v});
for(const o of [{shots:-1},{shots:4097},{shots:1.5},{seed:-1},{seed:4294967296},{seed:1.5},{visibility:-.1},{visibility:1.1}])bad(o);
for(const key of ['a','ap','b','bp'])for(const v of [-361,361])bad({[key]:v});
for(let i=0;i<4;i++)for(let j=0;j<2;j++)d.feedback.push({i,j,...a.feedback(i,j)});
d.replay=f.records.map(r=>a.snapshot(r.data.parameters));console.log(JSON.stringify(d));'''
d=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True));f=json.loads(fixture.read_text());assert hashlib.sha256(js.read_bytes()).hexdigest()==f['provenance']['sourceSha256'];assert d['self']=={'checks':24,'presets':12}
def rec(a,b):
 if isinstance(b,dict):assert a.keys()==b.keys();[rec(a[k],v)for k,v in b.items()]
 elif isinstance(b,(list,tuple)):assert len(a)==len(b);[rec(x,y)for x,y in zip(a,b)]
 elif isinstance(b,(int,float))and not isinstance(b,bool):near(a,b,'replay')
 else:assert a==b,(a,b)
check_records(d['records']+[r['data']for r in f['records']])
assert any(s['parameters']['shots']==2 and s['sample']['standardError']==0 and s['sample']['hoeffdingRadius']>3 for s in d['records'])
for a,b in zip(d['replay'],f['records']):rec(a,b['data'])
coords=ledgerRows=circles=0
for view in d['views']:
 s=view['s'];assert len(view['plots'])==6 and len(view['tables'])==10;p=s['prefix'];positive=[r for r in p if r['k']>0];cs=s['sample']['estimate'];q=2*math.sqrt(2)
 expected=[[[[i,r['theory']]for i,r in enumerate(s['rows'])],[None if r['estimate']is None else[i,r['estimate']]for i,r in enumerate(s['rows'])]],
  [[[0,s['modelS']],None if cs is None else[1,cs]],[[-.2,-2],[1.2,-2],None,[-.2,2],[1.2,2]],[[-.2,-q],[1.2,-q],None,[-.2,q],[1.2,q]]],
  [[[r['k'],r['sample']['estimate']]for r in positive],[[r['k'],r['sample']['physicalInterval'][0]]for r in positive],[[r['k'],r['sample']['physicalInterval'][1]]for r in positive],[[r['k'],s['modelS']]for r in positive]],
  [[[r['angle'],r['quantum']]for r in s['angleScan']],[[r['angle'],r['classical']]for r in s['angleScan']]],
  [[[r['visibility'],r['partialEigenvalues'][0]]for r in s['visibilityScan']],[[r['visibility'],r['partialEigenvalues'][1]]for r in s['visibilityScan']],[[0,0],[1,0]]],
  [[[r['visibility'],r['maxSpinCHSH']]for r in s['visibilityScan']],[[0,2],[1,2]]]]
 for pi,(plot,svg,series)in enumerate(zip(view['plots'],view['svg'],expected)):
  tree=ET.fromstring(svg);paths=tree.findall('{*}path');assert len(paths)==len(series)==len(plot['series']);assert plot['xMax']>plot['xMin']and plot['yMax']>plot['yMin'];expectedMarks=[]
  for si,(ser,path,points)in enumerate(zip(plot['series'],paths,series)):
   only=pi==0 or(pi==1 and si==0);assert ser['markersOnly']==only;rec(ser['points'],points);xy=[];segments=0;pen=False
   transform=lambda point:[100+(point[0]-plot['xMin'])/(plot['xMax']-plot['xMin'])*755,385-(point[1]-plot['yMin'])/(plot['yMax']-plot['yMin'])*290]
   for point in points:
    if point is None:pen=False;continue
    if not pen or only:segments+=1
    pen=True;x,y=point;assert plot['xMin']<=x<=plot['xMax']and plot['yMin']<=y<=plot['yMax'];xy.extend(transform(point))
   assert path.attrib['d'].count('M')==segments
   actual=list(map(float,re.findall(r'-?\d+(?:\.\d+)?',path.attrib['d'])));assert len(actual)==len(xy)
   for x,y in zip(actual,xy):assert abs(x-y)<6e-7;coords+=1
   nonempty=[point for point in points if point is not None]
   if only or len(nonempty)==1:expectedMarks.extend(transform(point)for point in nonempty)
  marks=tree.findall('{*}circle');assert len(marks)==len(expectedMarks)
  for mark,point in zip(marks,expectedMarks):vector([float(mark.attrib[k])for k in ['cx','cy']],point,'marker coordinate');circles+=1
 if s['parameters']['shots']==1:assert view['plots'][1]['yMin']<=-4 and cs==-4
 if s['parameters']['shots']==0:assert all(point is None for point in view['plots'][0]['series'][1]['points'])and all(not ser['points']for ser in view['plots'][2]['series'])
 ts={t['key']:t for t in view['tables']};specs={
  'settings':[[r[k]for k in ['id','sign','a','b','probabilities','counts','n','theory','estimate','standardError','alicePlus','bobPlus','initialState','finalState']]for r in s['rows']],
  'marginals':[[r[k]for k in ['side','rates','difference','theory']]for r in s['marginals']],
  'trials':[[r['id']]+[t[k]for k in ['j','state','draw','lambda','A','B','product','cell']]for r in s['rows']for t in r['trials']],
  'prefix':[[p['k'],[r['counts']for r in p['rows']],[r['estimate']for r in p['rows']],p['sample']['estimate'],p['sample']['standardError'],p['sample']['hoeffdingRadius'],p['sample']['rawInterval'],p['sample']['physicalInterval']]for p in s['prefix']],
  'angles':[[r['angle'],r['quantum'],r['classical']]for r in s['angleScan']],
  'visibility':[[r[k]for k in ['visibility','eigenvalues','partialEigenvalues','purity','negativity','entangled','maxSpinCHSH']]for r in s['visibilityScan']],
  'strategies':[[r[k]for k in ['a','ap','b','bp','correlations','S']]for r in s['strategies']]}
 for key,expectedRows in specs.items():rec(ts[key]['rows'],expectedRows);ledgerRows+=len(expectedRows)
 for key,obj in [('parameters',s['parameters']),('sample',s['sample']),('werner',s['werner'])]:
  values=([s['modelS']]if key=='sample'else[])+[v for k,v in obj.items()if k!='scope'];rec([r[1]for r in ts[key]['rows']],values);ledgerRows+=len(values)
 for t in view['tables']:assert all(len(row)==len(t['headers'])for row in t['rows'])
for r in d['feedback']:assert r['correct']==(r['j']==[0,1,0,1][r['i']])and len(r['text'])>30 and 'undefined'not in r['text']
mutations=0
for field in ['counts','state','correlation','interval','marginal','werner','strategy','prefix','error']:
 s=copy.deepcopy(d['records'][0])
 if field=='counts':s['rows'][0]['counts'][0]+=1
 elif field=='state':s['rows'][0]['trials'][0]['state']+=1
 elif field=='correlation':s['rows'][0]['theory']+=1
 elif field=='interval':s['sample']['physicalInterval'][0]+=1
 elif field=='marginal':s['marginals'][0]['difference']+=1
 elif field=='werner':s['werner']['partialTranspose'][0][0]+=1
 elif field=='strategy':s['strategies'][0]['S']=4
 elif field=='prefix':s['prefix'][-1]['rows'][0]['estimate']+=1
 else:s['rows'][0]['standardError']+=1
 try:check_records([s])
 except AssertionError:mutations+=1
 else:raise AssertionError('missed mutation '+field)
if not staging:
 for course in ['ai-course','grad-math','math-course','physics-course']:assert(root/course/'site/assets/learning/labs/chsh-experiment.js').read_bytes()==js.read_bytes()
 assert(root/'physics-course/site/assets/learning/projects/chsh-certificates/run-snapshot.json').read_bytes()==fixture.read_bytes()
 assert(root/'physics-course/images/qi-01-chsh-ledgers.svg').read_bytes()==(root/'physics-course/site/assets/img/qi-01-chsh-ledgers.svg').read_bytes()
 src=(root/'physics-course/lectures/qi-01-qubits.md').read_text();assert len(re.findall(r'^## \d+\.',src,re.M))==12 and src.count('$$')==16 and src.count('<details class="answer"')==8
 page=(root/'physics-course/site/qi-01-qubits.html').read_text();assert 'assets/learning/projects/chsh-certificates/run-snapshot.json'in page and 'assets/learning/labs/chsh-experiment.js'in page
 assert(root/'.github/workflows/course-audit.yml').read_text().count('python tools/check_chsh_full.py')==1
print(json.dumps({'status':'PASS','records':len(d['records']),'frozen':len(f['records']),'checks':checks,'plotCoordinates':coords,'markers':circles,'ledgerRows':ledgerRows,'invalid':d['invalid'],'feedback':len(d['feedback']),'mutations':mutations,'self':24}))
