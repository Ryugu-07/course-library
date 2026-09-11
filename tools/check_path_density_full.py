from pathlib import Path
import json,subprocess,tempfile,shutil,sys
PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
STAGING='--staging'in sys.argv
ROOT=Path(__file__).resolve().parents[1]
PATH_JS=ROOT/('work/euclidean-paths168.js'if STAGING else'course-shared/labs/euclidean-paths.js')
JUMP_JS=ROOT/('work/quantum-jump168.js'if STAGING else'course-shared/labs/quantum-jump.js')
FIXTURE=ROOT/('work/path-density-snapshot168.json'if STAGING else'course-shared/projects/quantum-path-density/run-snapshot.json')
NODE='const fs=require(\'fs\'),assert=require(\'assert\'),path=require(\'path\'),a=require(path.resolve(process.argv[2])),j=require(path.resolve(process.argv[3]));\nconst states=a.PRESETS.map(p=>a.snapshot(p.values));for(const mass of [\'0.5\',\'2\'])for(const omega of [\'0.25\',\'2\'])for(const beta of [\'0.2\',\'4\'])for(const slices of [\'1\',\'2\',\'4\',\'8\',\'16\',\'32\'])states.push(a.snapshot({mass,omega,beta,slices,samples:\'8\',seed:String(states.length)}));states.push(a.snapshot({seed:\'2463401483\',samples:\'8\'}));\nconst near=(x,y)=>assert(Number.isFinite(x)&&Number.isFinite(y)&&Math.abs(x-y)<2e-8*(1+Math.abs(y)));\nfunction compare(x,y){if(typeof x===\'number\'&&typeof y===\'number\'){near(x,y);return;}if(x&&y&&typeof x===\'object\'&&typeof y===\'object\'){assert.deepEqual(Object.keys(x),Object.keys(y));for(const k of Object.keys(x))compare(x[k],y[k]);return;}assert.strictEqual(x,y);}\nlet invalid=0;const bads=[null,[],true,0,\'\',{extra:\'1\'},{constructor:\'1\'},JSON.parse(\'{"__proto__":"1"}\')];for(const k of Object.keys(a.DEFAULTS))for(const v of [null,undefined,[],{},1,Infinity,\'1e0\',\'NaN\',\'\',\' 1\',\'1 \',\'0.000000000000000000000001\'])bads.push({[k]:v});for(const [k,vs]of [[\'mass\',[\'0\',\'0.49\',\'2.01\']],[\'omega\',[\'0\',\'0.24\',\'2.01\']],[\'beta\',[\'0\',\'0.19\',\'4.01\']],[\'slices\',[\'0\',\'3\',\'64\',\'01\',\'1.0\']],[\'samples\',[\'0\',\'1\',\'129\',\'032\']],[\'seed\',[\'-1\',\'4294967296\',\'01\',\'1.5\']]])for(const v of vs)bads.push({[k]:v});for(const v of bads){assert.throws(()=>a.snapshot(v));invalid++;}\nlet feedbackBranches=0;for(const q of a.QUESTIONS){assert.equal(q.length,4);assert(q[3].length>20);for(const c of [q[2],1-q[2]]){assert.equal(a.feedback(q,c),(c===q[2]?\'预测正确。\':\'需要修正。\')+q[3]);assert(!/undefined|null/.test(a.feedback(q,c)));feedbackBranches++;}}assert.throws(()=>a.feedback(a.QUESTIONS[0].slice(0,3),0));assert.throws(()=>a.feedback(a.QUESTIONS[0],2));\nconst base=JSON.stringify(a.snapshot());for(const mutate of [s=>s.model.A[0][0]=99,s=>s.model.covariance[0][0]=99,s=>s.samples.paths[0].x[0]=99,s=>s.samples.random.pairs[0].u.integer=99]){const s=a.snapshot();mutate(s);assert.equal(JSON.stringify(a.snapshot()),base);}\nlet invariances=0;const light=a.snapshot({mass:\'1\'}),heavy=a.snapshot({mass:\'2\'});near(light.model.Z,heavy.model.Z);near(light.model.energy,heavy.model.energy);light.model.covariance.forEach((r,i)=>r.forEach((x,k)=>near(x,2*heavy.model.covariance[i][k])));light.samples.paths.forEach((r,i)=>r.x.forEach((x,k)=>near(x,Math.SQRT2*heavy.samples.paths[i].x[k])));invariances++;\nconst few=a.snapshot({samples:\'8\'}),many=a.snapshot({samples:\'128\'});assert.equal(JSON.stringify(few.model),JSON.stringify(many.model));assert.equal(JSON.stringify(few.samples.paths),JSON.stringify(many.samples.paths.slice(0,8)));assert.equal(JSON.stringify(few.convergence),JSON.stringify(many.convergence));invariances++;assert.equal(JSON.stringify(a.snapshot({seed:\'0\'}).model),JSON.stringify(light.model));invariances++;\nconst jumps=j.PRESETS.map(p=>{const{key,label,...v}=p;return j.buildRecord(v)});for(const gamma of [0,1e-8,.8,3])for(const N of [1,4,128])for(const T of [0,1,8])jumps.push(j.buildRecord({gamma,N,T,seed:jumps.length,time:T*.4,trajectory:N}));jumps.push(j.buildRecord({seed:2463401483,N:1,T:0,time:0}));jumps.push(j.buildRecord({seed:4294967295,N:128,T:8,time:8}));\nlet jumpInvalid=0;const badJump=[null,[],true,0,\'\',{extra:1},{constructor:1},JSON.parse(\'{"__proto__":1}\')];for(const k of Object.keys(j.DEFAULTS))for(const v of [null,undefined,[],{},\'1\',Infinity,NaN,-1])badJump.push({[k]:v});for(const v of [{gamma:3.1},{N:0},{N:129},{N:1.5},{T:8.1},{T:0,time:1},{time:5},{trajectory:0},{trajectory:33},{seed:1.5},{seed:4294967296}])badJump.push(v);for(const v of badJump){assert.throws(()=>j.buildRecord(v));jumpInvalid++;}\nfor(const q of j.QUESTIONS)for(const c of q.choices){const expected=(c.key===q.expected?\'预测正确。\':\'需要修正。\')+q.explanation;assert.equal(j.questionFeedback(q,c.key),expected);assert(!/undefined|null/.test(expected));feedbackBranches++;}assert.throws(()=>j.questionFeedback({...j.QUESTIONS[0],explanation:\'\'},\'step\'));assert.throws(()=>j.questionFeedback(j.QUESTIONS[0],\'missing\'));\nfor(const u of [0,1,-1,1.1,NaN,Infinity,\'0.5\',null])assert.throws(()=>j.uniformToJumpTime(1,u));for(const g of [.01,1,3])for(const u of [2**-33,.25,.5,1-2**-33])near(j.uniformToJumpTime(g,u),-Math.log1p(-u)/g);assert.equal(j.sampleJumpTime(0,()=>{throw Error(\'must not draw\')}),Infinity);assert.equal(j.createRng(2463401483)(),2**-33);\nconst ja=j.buildRecord({N:4}),jb=j.buildRecord({N:128});assert.equal(JSON.stringify(ja.ensemble.trajectories),JSON.stringify(jb.ensemble.trajectories.slice(0,4)));const pristine=JSON.stringify(j.buildRecord());const mutated=j.buildRecord();mutated.ensemble.trajectories[0].uniform=99;assert.equal(JSON.stringify(j.buildRecord()),pristine);\nlet frozen=0;if(process.argv[4]!==\'-\'){const f=JSON.parse(fs.readFileSync(process.argv[4]));for(const k of [\'default\',\'one\',\'cold\',\'soft\']){compare(a.snapshot(f.path[k].parameters),f.path[k]);states.push(f.path[k]);frozen++;}for(const k of [\'baseline\',\'few\',\'zero\',\'zero-window\']){const e=f.jump[k].ensemble,config=Object.fromEntries(Object.keys(j.DEFAULTS).map(k=>[k,e[k]]));compare(j.buildRecord(config),f.jump[k]);jumps.push(f.jump[k]);frozen++;}}\nconst jumpViews=jumps.map(r=>{const plot=j.frozenPlot(r);return{plot,svg:a.svg(plot)}});\nconst views=states.map(s=>{const plots=a.plots(s),tables=a.ledgers(s);return{plots,svgs:plots.map(a.svg),tables,formatted:tables.map(t=>t.rows.map(r=>r.map(a.fmt)))}});const self=a.selfTest(),jumpSelf=j.numericSelfChecks();assert.equal(self.status,\'PASS\');assert(jumpSelf.ok);\nfs.writeFileSync(process.argv[5],JSON.stringify({states,views,jumps,jumpViews,invalid,jumpInvalid,feedbackBranches,mutationGuards:5,invariances,pathLive:61,jumpLive:42,frozen,self,jumpSelf:{passed:jumpSelf.passed,total:jumpSelf.total}}));console.log({pathLive:61,jumpLive:42,frozen,invalid,jumpInvalid,feedbackBranches,self,jumpSelf:jumpSelf.passed});\n'
with tempfile.TemporaryDirectory()as td:
 script=Path(td)/'export.cjs';out=Path(td)/'bundle.json';script.write_text(NODE)
 subprocess.run(PREFIX+['node',str(script),str(PATH_JS),str(JUMP_JS),str(FIXTURE),str(out)],check=True)
 bundle=json.loads(out.read_text())
"""Independent periodic Green function and matrix identities; standard library only."""
import math
checks=0
def ck(ok,label='contract'):
 global checks
 checks+=1
 assert ok,label
def near(a,b,label='number',atol=2e-8):
 if isinstance(b,list):
  ck(isinstance(a,list)and len(a)==len(b),label+' shape')
  for x,y in zip(a,b):near(x,y,label,atol)
 else:
  ck(isinstance(a,(int,float))and not isinstance(a,bool)and math.isfinite(a)and math.isfinite(b),label+' finite')
  ck(abs(a-b)<=atol*(1+abs(b)),(label,a,b))
def transpose(a):return list(map(list,zip(*a)))
def dot(a,b):return math.fsum(x*y for x,y in zip(a,b))
def multiply(a,b):return[[dot(row,col)for col in transpose(b)]for row in a]
def identity(n):return[[int(i==j)for j in range(n)]for i in range(n)]
def difference(a,b):return[[x-y for x,y in zip(ar,br)]for ar,br in zip(a,b)]
def model(d,m,w,b,complete):
 n=d['n'];eps=b/n;A=[[eps*m*w*w*int(i==j)for j in range(n)]for i in range(n)]
 for i in range(n):
  v=[0]*n;v[i]-=1;v[(i+1)%n]+=1
  for j in range(n):
   for k in range(n):A[j][k]+=m/eps*v[j]*v[k]
 alpha=2*math.asinh(eps*w/2);C=[[eps*math.cosh(alpha*(n/2-abs(i-j)))/(2*m*math.sinh(alpha)*math.sinh(n*alpha/2))for j in range(n)]for i in range(n)]
 eigen=[m/eps*(4*math.sin(math.pi*p/n)**2+(eps*w)**2)for p in range(n)];ld=math.fsum(math.log(x)for x in eigen);lz=n/2*math.log(m/eps)-ld/2
 near([d['eps'],d['logDet'],d['logPrefactor'],d['logZ'],d['Z']],[eps,ld,n/2*math.log(m/eps),lz,math.exp(lz)],'determinant')
 u=n*math.asinh(b*w/(2*n));z=1/(2*math.sinh(u));E=w/(2*math.tanh(u)*math.sqrt(1+(b*w/(2*n))**2))
 near([d['portal'],d['logZClosed'],d['ZClosed'],d['energyClosed'],d['energy']],[u,math.log(z),z,E,E],'closed Z/E')
 exact=[-math.log(2*math.sinh(b*w/2)),1/(2*m*w*math.tanh(b*w/2)),w/(2*math.tanh(b*w/2))]
 near([d['reference'][k]for k in ['logZ','variance','energy']],exact,'continuous references')
 near([d['variance'],d['logZError'],d['energyError']],[C[0][0],lz-exact[0],E-exact[2]],'errors')
 near(d['varianceError'],C[0][0]-exact[1],'variance subtraction',atol=4e-10*max(1,exact[1]))
 near([[r['mode'],r['eigenvalue'],r['logValue']]for r in d['spectral']],[[p,v,math.log(v)]for p,v in enumerate(eigen)],'spectrum')
 ck(len(d['correlations'])==n+1,'correlation length')
 for j,r in enumerate(d['correlations']):
  i=j%n;t=b*j/n;terms=[math.cos(2*math.pi*p*i/n)/(n*v)for p,v in enumerate(eigen)];c=math.cosh(w*(b/2-t))/(2*m*w*math.sinh(b*w/2))
  near([r[k]for k in ['j','index','tau','value','spectral','exact']],[j,i,t,C[0][i],math.fsum(terms),c],'correlation');near(r['spectralTerms'],terms,'spectral terms')
 inc=[C[i][i]+C[(i+1)%n][(i+1)%n]-2*C[i][(i+1)%n]for i in range(n)]
 near([[r['i'],r['j'],r['value']]for r in d['increments']],[[i,(i+1)%n,v]for i,v in enumerate(inc)],'increments')
 near([d['kineticEstimator'],d['potentialEstimator']],[n/(2*b)-m*n*math.fsum(inc)/(2*b*b),m*w*w*sum(C[i][i]for i in range(n))/(2*n)],'estimators')
 if complete:
  L=d['factor']['L'];near(d['A'],A,'A');near(d['covariance'],C,'C');ck(len(L)==n and all(len(row)==n for row in L),'L shape')
  ck(all(L[i][i]>0 and all(L[i][j]==0 for j in range(i+1,n))for i in range(n)),'positive lower triangle')
  near(multiply(L,transpose(L)),A,'unique Cholesky identity')
  near(d['factor']['residual'],difference(multiply(L,transpose(L)),A),'LLT residual record');near(d['factor']['residual'],[[0]*n for _ in range(n)],'LLT residual bound')
  near(d['inverseResidual'],difference(multiply(A,d['covariance']),identity(n)),'AC residual record');near(d['inverseResidual'],[[0]*n for _ in range(n)],'AC residual bound')
  near([[e['i'],e['j'],e['strength']]for e in d['edges']],[[i,(i+1)%n,m/eps]for i in range(n)],'edges')
  ck([(r['i'],r['j'])for r in d['factor']['steps']]==[(i,j)for i in range(n)for j in range(i+1)],'factor step indices')
  for r in d['factor']['steps']:
   i,j=r['i'],r['j'];products=[L[i][k]*L[j][k]for k in range(j)];s=math.fsum(products);near(r['products'],products,'factor products');near([r['subtotal'],r['residual'],r['value']],[s,A[i][j]-s,L[i][j]],'factor step')
  ck(len(d['inverseSolves'])==n,'solve columns')
  for i,r in enumerate(d['inverseSolves']):
   unit=identity(n)[i];near(r['b'],unit,'solve b');near([dot(row,r['y'])for row in L],unit,'Ly=b');near([dot(row,r['x'])for row in transpose(L)],r['y'],'LTx=y');near(r['x'],[row[i]for row in C],'solve inverse column')
 return A,C
MASK=2**32-1
def prng(state):
 state=(state+1831565813)&MASK;t=((state^(state>>15))*(state|1))&MASK;t=(t^((t+((t^(t>>7))*(t|61)))&MASK))&MASK
 integer=(t^(t>>14))&MASK
 return state,integer,(integer+.5)/2**32
def check_path(s):
 p=s['parameters'];m,w,b=map(float,[p['mass'],p['omega'],p['beta']]);n=int(p['slices']);M=int(p['samples']);seed=int(p['seed']);ck(s['version']==168 and s['model']['n']==n,'version/slices')
 A,C=model(s['model'],m,w,b,True);ck([r['n']for r in s['convergence']]==[1,2,4,8,16,32,64],'convergence grid')
 for d in s['convergence']:model(d,m,w,b,False)
 ck(len(s['continuous'])==129,'continuous grid')
 for i,r in enumerate(s['continuous']):
  t=b*i/128;near([r['tau'],r['value']],[t,math.cosh(w*(b/2-t))/(2*m*w*math.sinh(b*w/2))],'continuous plot')
 samples=s['samples'];ck(samples['count']==M and samples['seed']==seed,'sampling metadata');state=seed;z=[]
 ck(len(samples['random']['pairs'])==math.ceil(M*n/2),'pair count')
 for i,r in enumerate(samples['random']['pairs']):
  state,ui,u=prng(state);state,vi,v=prng(state);radius=math.sqrt(-2*math.log(u));angle=2*math.pi*v;z0=radius*math.cos(angle);z1=radius*math.sin(angle);z.extend([z0,z1])
  ck(r['index']==i and r['state']==state and r['u']['integer']==ui and r['v']['integer']==vi,'integer PRNG')
  near([r['u']['value'],r['v']['value'],r['radius'],r['angle'],r['z0'],r['z1']],[u,v,radius,angle,z0,z1],'Box Muller')
 z=z[:M*n];near(samples['random']['values'],z,'normal values');L=s['model']['factor']['L'];X=[];ck(len(samples['paths'])==M,'sample count')
 for i,r in enumerate(samples['paths']):
  normal=z[i*n:(i+1)*n];x=r['x'];ck(r['index']==i,'path index');near(r['z'],normal,'path normal');near([dot(row,x)for row in transpose(L)],normal,'sample triangular equation');X.append(x)
  near([r['action'],r['normalAction']],[.5*dot(x,[dot(row,x)for row in A]),.5*dot(normal,normal)],'path action');near(r['action'],r['normalAction'],'action identity')
 second=[[math.fsum(row[i]*row[j]for row in X)/M for j in range(n)]for i in range(n)]
 near(samples['mean'],[math.fsum(row[i]for row in X)/M for i in range(n)],'empirical mean');near(samples['secondMoment'],second,'uncentered second moment')
 ck(len(samples['correlations'])==n+1 and len(samples['prefix'])==M,'sample records')
 for j,r in enumerate(samples['correlations']):
  i=j%n;v=second[0][i];ref=C[0][i];se=math.sqrt((C[0][0]*C[i][i]+ref*ref)/M)
  near([r[k]for k in ['j','index','tau','empirical','reference','error','standardError']],[j,i,b*j/n,v,ref,v-ref,se],'sample correlation')
 for j,r in enumerate(samples['prefix']):
  k=j+1;v=math.fsum(row[0]**2 for row in X[:k])/k;ref=C[0][0];near([r[x]for x in ['size','value','reference','error','standardError']],[k,v,ref,v-ref,ref*math.sqrt(2/k)],'prefix mean')

import xml.etree.ElementTree as ET
def values(r,keys):return[r[k]for k in keys.split()]
def check_path_view(s,v):
 m=s['model'];p=s['parameters'];sample=s['samples'];expected=[
  [[[c['tau'],r['x'][c['index']]]for c in m['correlations']]for r in sample['paths'][:4]],
  [[[r['tau'],r['value']]for r in m['correlations']],[[r['tau'],r['value']]for r in s['continuous']],[[r['tau'],r['empirical']]for r in sample['correlations']]],
 ]
 for key in ['logZ','energy','variance']:expected.append([[[math.log2(r['n']),r[key]]for r in s['convergence']],[[math.log2(r['n']),r['reference'][key]]for r in s['convergence']]])
 expected.append([[[r['size'],r['value']]for r in sample['prefix']],[[r['size'],r['reference']]for r in sample['prefix']]])
 ck([x['key']for x in v['plots']]==['paths','correlation','partition','energy','variance','sampling'],'plot keys');ck(len(v['svgs'])==6,'SVG count')
 for i,(plot,code,lines)in enumerate(zip(v['plots'],v['svgs'],expected)):
  root=ET.fromstring(code);ns='{http://www.w3.org/2000/svg}';ck(root.attrib['viewBox']=='0 0 900 460','SVG viewport');ck(root.find(ns+'title').text==plot['title']and root.find(ns+'desc').text==plot['caption'],'SVG description')
  xs=[x for line in lines for x,y in line];ys=[y for line in lines for x,y in line];xMin=min(xs);xMax=max(xs);xMax=xMax if xMax!=xMin else xMin+1;yMin=min(0,min(ys));yMax=max(0,max(ys));pad=(yMax-yMin)*.08 or 1
  near([plot[k]for k in ['xMin','xMax','yMin','yMax']],[xMin,xMax,yMin-pad,yMax+pad],'axis range')
  rendered={int(e.attrib['data-series']):e for e in root.findall(ns+'polyline')};ck(len(rendered)==len(lines)==len(plot['series']),'series count')
  sx=lambda x:104+762*(x-plot['xMin'])/(plot['xMax']-plot['xMin']);sy=lambda y:360-259*(y-plot['yMin'])/(plot['yMax']-plot['yMin'])
  for j,(series,points)in enumerate(zip(plot['series'],lines)):
   near(series['points'],points,'plot data');e=rendered[j];ck(e.attrib['stroke']==series['color']==['#256c91','#ae6017','#687981','#26705b'][j%4],'series color');ck(e.attrib.get('stroke-dasharray')==('5 4'if j>=2 else None),'series dash')
   xy=[[float(x)for x in pair.split(',')]for pair in e.attrib['points'].split()];near(xy,[[sx(x),sy(y)]for x,y in points],'SVG coordinates')
  circles=root.findall(ns+'circle');circleRefs=[(j,q)for j in range(len(lines)-1,-1,-1)if len(lines[j])<=128 for q in lines[j]];ck(len(circles)==len(circleRefs),'point count')
  for e,(j,(x,y))in zip(circles,circleRefs):near([float(e.attrib[k])for k in ['cx','cy','r']],[sx(x),sy(y),3],'point coordinate');ck(e.attrib['fill']==plot['series'][j]['color'],'point color')
  markers=[e for e in root.findall(ns+'line')if e.attrib.get('stroke-dasharray')=='2 5'];ck(len(markers)==int(i in [2,3,4]),'selected marker count')
  if markers:near(plot['selected'],math.log2(m['n']),'selected N');near(float(markers[0].attrib['x1']),sx(math.log2(m['n'])),'selected x');ck(plot['integerX']is True,'integer ticks')
 matrix=lambda A:[[i,j,v]for i,row in enumerate(A)for j,v in enumerate(row)]
 tables={
  'action-matrix':matrix(m['A']),'factor':matrix(m['factor']['L']),'covariance':matrix(m['covariance']),'sample-moment':matrix(sample['secondMoment']),
  'factor-steps':[values(r,'i j products subtotal residual value')for r in m['factor']['steps']],
  'solves':[[j,i,b,r['y'][i],r['x'][i]]for j,r in enumerate(m['inverseSolves'])for i,b in enumerate(r['b'])],
  'correlation':[values(r,'j index tau value spectral exact')+values(sample['correlations'][i],'empirical error standardError')for i,r in enumerate(m['correlations'])],
  'spectrum':[values(r,'mode eigenvalue logValue')for r in m['spectral']],
  'correlation-terms':[[r['j'],p,t]for r in m['correlations']for p,t in enumerate(r['spectralTerms'])],
  'edges':[values(r,'i j strength')+[m['increments'][i]['value']]for i,r in enumerate(m['edges'])],
  'convergence':[values(r,'n eps logDet logZ logZClosed logZError energy energyClosed energyError variance varianceError')for r in s['convergence']],
  'paths':[[r['index']+1,i,m['eps']*i,r['z'][i],x]for r in sample['paths']for i,x in enumerate(r['x'])],
  'actions':[[r['index']+1,r['action'],r['normalAction'],r['action']-r['normalAction']]for r in sample['paths']],
  'random':[[r['index'],r['state'],r['u']['integer'],r['v']['integer'],r['u']['value'],r['v']['value'],r['radius'],r['angle'],r['z0'],r['z1']]for r in sample['random']['pairs']],
  'sampling':[values(r,'size value reference error standardError')for r in sample['prefix']]
 }
 summary=[float(p[k])for k in ['mass','omega','beta','slices','samples','seed']]+values(m,'eps logDet logPrefactor logZ Z logZClosed ZClosed')+[m['reference']['logZ'],m['logZError'],m['energy'],m['energyClosed'],m['reference']['energy']]+values(m,'energyError kineticEstimator potentialEstimator variance')+[m['reference']['variance'],m['varianceError'],max(abs(x)for row in m['factor']['residual']for x in row),max(abs(x)for row in m['inverseResidual']for x in row),s['scope']]
 ck([t['key']for t in v['tables']]==['summary']+list(tables),'table order');ck(len(v['formatted'])==16,'formatted table count')
 def same(a,b):
  if isinstance(b,list):
   ck(isinstance(a,list)and len(a)==len(b),'table shape')
   for x,y in zip(a,b):same(x,y)
  elif isinstance(b,(float,int)):near(a,b,'table value')
  else:ck(a==b,'table string')
 def formatted(text,value):
  ck(isinstance(text,str),'formatted string')
  if isinstance(value,list):
   parts=text.split(', ')if text else[];ck(len(parts)==len(value),'formatted vector length')
   for x,y in zip(parts,value):formatted(x,y)
  elif isinstance(value,(int,float)):near(float(text),value,'formatted number',6e-8)
  else:ck(text==value,'formatted text')
 for t,f in zip(v['tables'],v['formatted']):
  if t['key']=='summary':same([r[1]for r in t['rows']],summary);ck(all(len(r)==2 and r[0]for r in t['rows']),'summary labels')
  else:same(t['rows'],tables[t['key']])
  ck(all(len(row)==len(t['headers'])for row in t['rows']),'table headers');ck(len(f)==len(t['rows']),'formatted rows')
  for line,row in zip(f,t['rows']):
   ck(len(line)==len(row),'formatted columns')
   for text,value in zip(line,row):formatted(text,value)

for state,view in zip(bundle["states"],bundle["views"]):check_path(state);check_path_view(state,view)
JUMP_ORACLE='"""Independent scalar probability and integer replay of quantum-jump records."""\nfrom pathlib import Path\nimport json,math\nchecks=0\ndef ck(ok,label):\n global checks\n checks+=1;assert ok,label\ndef near(a,b,label):ck(isinstance(a,(int,float))and math.isfinite(a)and abs(a-b)<=2e-12*(1+abs(b)),(label,a,b))\nMASK=2**32-1\ndef random_integer(state):\n state=(state+1831565813)&MASK\n t=((state^(state>>15))*(state|1))&MASK\n t=(t^((t+((t^(t>>7))*(t|61)))&MASK))&MASK\n return state,(t^(t>>14))&MASK\ndef review(r):\n e=r[\'ensemble\'];g=e[\'gamma\'];N=e[\'N\'];T=e[\'T\'];t=e[\'time\'];state=e[\'seed\'];tau=[];counts=dict(observed=0,censored=0,structural=0)\n ck(len(e[\'trajectories\'])==N,\'N records\')\n for i,record in enumerate(e[\'trajectories\']):\n  ck(record[\'index\']==i+1,\'index\')\n  if g==0:\n   ck(record[\'uniform\']is None and record[\'uniformInteger\']is None and record[\'jumpTime\']is None,\'structural nulls\');x=math.inf;outcome=\'structural-no-jump\';counts[\'structural\']+=1\n  else:\n   state,integer=random_integer(state);u=(integer+.5)/2**32;x=-math.log1p(-u)/g\n   ck(record[\'uniformInteger\']==integer,\'integer\');near(record[\'uniform\'],u,\'u\');ck(0<record[\'uniform\']<1,\'open interval\');near(record[\'jumpTime\'],x,\'inverse cdf\')\n   outcome=\'observed\'if x<=T else\'right-censored\';counts[\'observed\'if x<=T else\'censored\']+=1\n  ck(record[\'outcome\']==outcome,\'status\');ck(record[\'observed\']==(x<=T),\'observed\');ck(record[\'rightCensored\']==(g>0 and x>T),\'censored\');ck(record[\'structuralNoJump\']==(g==0),\'structural\');ck(record[\'p1AtCurrent\']==int(x>t),\'current p1\');ck(record[\'p1AtWindow\']==int(x>T),\'window p1\');tau.append(x)\n ck([e[\'observedJumpCount\'],e[\'censoredCount\'],e[\'structuralNoJumpCount\']]==[counts[\'observed\'],counts[\'censored\'],counts[\'structural\']],\'partition N\')\n def reading(d,t):\n  prob=math.exp(-g*t);ground=-math.expm1(-g*t);emp=sum(x>t for x in tau)/N;err=emp-prob\n  expected=dict(time=t,empiricalP1=emp,analyticP1=prob,error=err,absoluteError=abs(err),standardError=math.sqrt(prob*ground/N),empiricalGround=1-emp,analyticGround=ground)\n  for k,v in expected.items():near(d[k],v,k)\n times=sorted(set([T*i/128 for i in range(129)]+[t]));ck(len(times)==len(r[\'nodes\']),\'nodes length\')\n for d,x in zip(r[\'nodes\'],times):\n  reading(d,x);near(d[\'selectedP1\'],int(tau[e[\'trajectory\']-1]>x),\'selected\');near(d[\'noJumpAmplitude\'],math.exp(-g*x/2),\'amplitude\');near(d[\'noJumpProbability\'],math.exp(-g*x),\'norm\');ck(d[\'conditionalNoJumpP1\']==1,\'conditioned\')\n reading(r[\'reading\'],t)\n ck(len(r[\'analyticPoints\'])==49,\'analytic plot nodes\')\n for i,q in enumerate(r[\'analyticPoints\']):near(q[0],T*i/48,\'analytic x\');near(q[1],math.exp(-g*T*i/48),\'analytic y\')\n points=[[0,1]];left=N\n for x in sorted(x for x in tau if x<=T):points.extend([[x,left/N],[x,(left-1)/N]]);left-=1\n points.append([T,left/N]);ck(len(points)==len(r[\'ensemblePoints\']),\'step point count\')\n for a,b in zip(r[\'ensemblePoints\'],points):near(a[0],b[0],\'step time\');near(a[1],b[1],\'step height\')\n x=tau[e[\'trajectory\']-1];points=[[0,1],[x,1],[x,0],[T,0]]if x<=T else[[0,1],[T,1]];ck(len(points)==len(r[\'singlePoints\']),\'single points\')\n for a,b in zip(r[\'singlePoints\'],points):near(a[0],b[0],\'single time\');near(a[1],b[1],\'single height\')\nif __name__==\'__main__\':\n records=json.loads(Path(\'work/jump168-live.json\').read_text())\n for item in records:review(item[\'record\'])\n result=dict(status=\'PASS\',states=len(records),checks=checks);Path(\'work/batch168-jump-independent.json\').write_text(json.dumps(result,indent=2));print(result)\n'
jumpOracle={"__name__":"jump_oracle"};exec(JUMP_ORACLE,jumpOracle)
for state in bundle["jumps"]:jumpOracle["review"](state)
import re,html,hashlib,xml.etree.ElementTree as ET
from html.parser import HTMLParser
f=json.loads(FIXTURE.read_text());ck(f['schema']==1,'fixture schema');ck(f['provenance']=={'date':'2026-09-12','node':'v24.14.0','platform':'darwin','arch':'arm64','pathJsSha256':hashlib.sha256(PATH_JS.read_bytes()).hexdigest(),'jumpJsSha256':hashlib.sha256(JUMP_JS.read_bytes()).hexdigest()},'fixture provenance')
ck(list(f['path'])==['default','one','cold','soft']and list(f['jump'])==['baseline','few','zero','zero-window'],'fixed keys')
ck(bundle['frozen']==8 and bundle['feedbackBranches']==16,'freeze and feedback coverage')
for r,v in zip(bundle['jumps'],bundle['jumpViews']):
 p=v['plot'];ck(p['key']=='jump-survival','jump plot');near(p['xMin'],0);near(p['xMax'],r['ensemble']['T']or 1);near([p['yMin'],p['yMax']],[-.08,1.08]);ck(p['xDegenerate']==(r['ensemble']['T']==0));ck(len(p['series'])==3)
 root=ET.fromstring(v['svg']);ns='{http://www.w3.org/2000/svg}';ck(root.find(ns+'title').text==p['title']);rendered={int(e.attrib['data-series']):e for e in root.findall(ns+'polyline')};ck(len(rendered)==3)
 for i,key in enumerate(['ensemblePoints','singlePoints','analyticPoints']):
  near(p['series'][i]['points'],r[key],'jump curve data');xy=[[float(t)for t in pair.split(',')]for pair in rendered[i].attrib['points'].split()];near(xy,[[104+762*x/p['xMax'],360-259*(y+.08)/1.16]for x,y in r[key]],'jump static SVG');ck(rendered[i].attrib['stroke']==p['series'][i]['color']);ck(rendered[i].attrib.get('stroke-dasharray')==('5 4'if i==2 else None))
if not STAGING:
 src=(ROOT/'physics-course/lectures/aqm-03-path-density.md').read_text();site=(ROOT/'physics-course/site/aqm-03-path-density.html').read_text()
 formulas=[(a or b).strip()for a,b in re.findall(r'\$\$(.*?)\$\$|(?<!\\)\$(?!\$)(.*?)(?<!\\)\$(?!\$)',src,re.S)]
 actual=[html.unescape(a or b).strip()for a,b in re.findall(r'<(?:span|div) class="arithmatex">(?:\\\((.*?)\\\)|\\\[(.*?)\\\])</(?:span|div)>',site,re.S)]
 ck(formulas==actual and len(formulas)==25,'formulas survive build');ck(len(re.findall(r'^## \d+\.',src,re.M))==12,'sections');ck('<!-- PATH168_STATIC -->'not in src and '<!-- JUMP168_STATIC -->'not in src,'static content installed')
 class Disclosure(HTMLParser):
  def __init__(self):super().__init__();self.stack=[];self.answers=0
  def handle_starttag(self,tag,attrs):
   if tag=='details':
    ck(not self.stack,'nested disclosure');kind=dict(attrs).get('class');ck(kind in ['answer','page-toc']);self.stack.append([kind,0]);self.answers+=kind=='answer'
   if tag=='summary':ck(bool(self.stack));self.stack[-1][1]+=1
  def handle_endtag(self,tag):
   if tag=='details':ck(bool(self.stack));ck(self.stack.pop()[1]==1)
 parser=Disclosure();parser.feed(re.search(r'<article[^>]*>(.*?)</article>',site,re.S).group(1));ck(parser.answers==6 and not parser.stack,'six answers');ck(not re.search(r'<p>\s*<details|</details>\s*</p>',site),'proper disclosures')
 for link in re.findall(r'(?:href|src)="([^"]+)"',site):
  target=link.split('#')[0].split('?')[0]
  if target and not re.match(r'^[a-zA-Z]+:',target)and not target.startswith('/'):ck((ROOT/'physics-course/site'/target).exists(),'local link '+target)
 for course in ['ai-course','grad-math','math-course','physics-course']:
  for name,js in [('euclidean-paths',PATH_JS),('quantum-jump',JUMP_JS)]:ck((ROOT/course/'site/assets/learning/labs'/f'{name}.js').read_bytes()==js.read_bytes(),'mirror '+course+name)
 ck((ROOT/'physics-course/site/assets/learning/projects/quantum-path-density/run-snapshot.json').read_bytes()==FIXTURE.read_bytes(),'fixture mirror');ck((ROOT/'.github/workflows/course-audit.yml').read_text().count('python tools/check_path_density_full.py')==1,'CI wiring')
 def xmlsame(a,b):
  ck(a.tag==b.tag and set(a.attrib)==set(b.attrib));ck(a.text==b.text and a.tail==b.tail)
  for key,value in a.attrib.items():
   if key in ['x','y','x1','y1','x2','y2','cx','cy','r','width','height']:near(float(value),float(b.attrib[key]))
   else:ck(value==b.attrib[key],key)
  ck(len(a)==len(b))
  for x,y in zip(a,b):xmlsame(x,y)
 for name,height,refs in [('aqm-03-euclidean-paths',2300,[bundle['views'][-3]['svgs'][0],bundle['views'][-4]['svgs'][1],bundle['views'][-2]['svgs'][2],bundle['views'][-1]['svgs'][5]]),('aqm-03-quantum-jump',1190,[bundle['jumpViews'][-4]['svg'],bundle['jumpViews'][-1]['svg']])]:
  image=ROOT/'physics-course/images'/f'{name}.svg';ck(image.read_bytes()==(ROOT/'physics-course/site/assets/img'/f'{name}.svg').read_bytes(),'SVG mirror');root=ET.parse(image).getroot();ck(root.attrib['viewBox']=='0 0 1000 '+str(height));panels=root.findall(ns+'svg');ck(len(panels)==len(refs))
  for i,(panel,ref)in enumerate(zip(panels,refs)):ck(panel.attrib.pop('x')=='50'and panel.attrib.pop('y')==str(85+555*i));xmlsame(panel,ET.fromstring(ref))
 d=f['path']['default'];o=f['path']['one'];c=f['path']['cold'];s=f['path']['soft'];b=f['jump']['baseline'];z=f['jump']['zero-window']
 pathValues=[d['model']['n'],d['samples']['count'],d['model']['Z'],d['model']['energy'],d['model']['variance'],d['model']['reference']['variance'],d['samples']['prefix'][-1]['value'],d['samples']['prefix'][-1]['standardError'],o['model']['Z'],o['model']['energy'],c['model']['logZ'],c['model']['reference']['logZ'],s['model']['variance'],s['samples']['prefix'][-1]['value']]
 jumpValues=[b['ensemble']['N'],b['ensemble']['T'],b['ensemble']['time'],b['reading']['empiricalP1'],b['reading']['analyticP1'],b['reading']['standardError'],b['ensemble']['observedJumpCount'],b['ensemble']['censoredCount'],z['ensemble']['censoredCount'],z['ensemble']['trajectories'][0]['uniformInteger'],z['ensemble']['trajectories'][0]['uniform'],z['ensemble']['trajectories'][0]['jumpTime']]
 for name,refs in [('euclidean-paths',pathValues),('quantum-jump',jumpValues)]:
  table=re.search(r'data-learning-lab="'+name+r'".*?<tbody>(.*?)</tbody>',site,re.S).group(1);vals=[float(html.unescape(x).strip())for x in re.findall(r'<tr>\s*<td>.*?</td>\s*<td[^>]*>(.*?)</td>\s*</tr>',table,re.S)];near(vals,refs,'static values')
 for word in ['归一化','三阶','无界算符','单位根','Cholesky','右连续','半正定','Kraus','详细平衡','右删失']:ck(word in src,'proof marker '+word)
 with tempfile.TemporaryDirectory()as td:
  out=[Path(td)/name for name in ['path.svg','jump.svg','path.md','jump.md']];subprocess.run(PREFIX+['python3',str(ROOT/'tools/build_path_density_figure.py'),str(PATH_JS),str(JUMP_JS),str(FIXTURE),*[str(x)for x in out]],check=True,stdout=subprocess.DEVNULL)
  for image,file in zip(['aqm-03-euclidean-paths','aqm-03-quantum-jump'],out[:2]):xmlsame(ET.parse(ROOT/'physics-course/images'/f'{image}.svg').getroot(),ET.parse(file).getroot())
  ck(out[2].read_text()in src and out[3].read_text()in src,'fixed text reproduction')
print(json.dumps({'status':'PASS','pathLive':bundle['pathLive'],'jumpLive':bundle['jumpLive'],'frozen':bundle['frozen'],'pathChecks':checks,'jumpChecks':jumpOracle['checks'],'invalid':bundle['invalid'],'jumpInvalid':bundle['jumpInvalid'],'feedbackBranches':bundle['feedbackBranches'],'self':bundle['self']['checks'],'jumpSelf':bundle['jumpSelf']['passed']}))
