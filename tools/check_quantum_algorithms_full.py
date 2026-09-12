from pathlib import Path
import json,math,cmath,sys
checks=0
def near(a,b):
 global checks
 assert isinstance(a,(int,float))and not isinstance(a,bool)and math.isfinite(a)and abs(a-float(b))<=5e-10*max(1,abs(b)),(a,b);checks+=1
def eq(a,b):
 global checks
 assert a==b and (not(isinstance(a,bool)or isinstance(b,bool))or type(a)is type(b)),(a,b);checks+=1
def fft(x):
 n=len(x);assert n and n&(n-1)==0;y=list(map(complex,x));j=0
 for i in range(1,n):
  bit=n>>1
  while j&bit:j^=bit;bit>>=1
  j^=bit
  if i<j:y[i],y[j]=y[j],y[i]
 size=2
 while size<=n:
  unit=cmath.exp(-2j*math.pi/size)
  for start in range(0,n,size):
   w=1
   for k in range(size//2):u=y[start+k];v=w*y[start+k+size//2];y[start+k]=u+v;y[start+k+size//2]=u-v;w*=unit
  size*=2
 return y
def phase_fft(Q,phi):return[z/Q for z in fft([cmath.exp(2j*math.pi*x*phi)for x in range(Q)])]
def cf(y,Q,N,a):
 n,d=y,Q;pm2,pm1=0,1;qm2,qm1=1,0;rows=[]
 while d:
  term,rem=divmod(n,d);p,q=term*pm1+pm2,term*qm1+qm2;err=abs(y*q-Q*p);power=pow(a,q,N)if q<N else None;verified=power==1;even=q%2==0;half=pow(a,q//2,N)if verified and even else None;minus=math.gcd(half-1,N)if half is not None else None;plus=math.gcd(half+1,N)if half is not None else None;factor=next((v for v in [minus,plus]if v is not None and 1<v<N),None)
  status='分母超过候选范围'if q>=N else'模幂未通过'if not verified else'已验证指数为奇数'if not even else'平方根为+1'if half==1 else'平方根为−1'if half==N-1 else'未提取因子'if factor is None else'因子已验证'
  rows.append(dict(index=len(rows),numeratorInput=n,denominatorInput=d,quotient=term,remainder=rem,p=p,q=q,errorNumerator=err,error=err/(Q*q),legendreClose=2*q*err<Q,withinOrderRange=q<N,power=power,verifiedMultiple=verified,even=even,half=half,gMinus=minus,gPlus=plus,factor=factor,cofactor=None if factor is None else N//factor,status=status))
  n,d=d,rem;pm2,pm1=pm1,p;qm2,qm1=qm1,q
 return rows
def check_records(data):
 for s in data:
  c=s['parameters'];Q=2**c['bits'];eq(s['Q'],Q);cost=s['cost'];eq(cost['genericBaseUCalls'],Q-1);eq(cost['controlledPowers'],c['bits']);eq(cost['qftHadamards'],c['bits']);eq(cost['qftControlledPhases'],c['bits']*(c['bits']-1)//2);eq(cost['qftSwaps'],c['bits']//2);eq(cost['inputHadamards'],c['bits'])
  eq(len(cost['powers']),c['bits'])
  for j,row in enumerate(cost['powers']):eq(row,dict(j=j,exponent=2**j,genericBaseUCalls=2**j,modularMultiplier=pow(c['a'],2**j,c['N'])if c['mode']=='order'and math.gcd(c['a'],c['N'])==1 else None))
  if c['mode']=='phase':
   eq(s['order'],None);v=s['phase'];phi=c['phase']%1;eq(v['phase'],phi);wave=[cmath.exp(2j*math.pi*x*phi)/math.sqrt(Q)for x in range(Q)];out=phase_fft(Q,phi);prob=[abs(z)**2 for z in out];eq(len(v['input']),Q);eq(len(v['outcomes']),Q);eq(len(v['selectedTerms']),Q)
   for x,row in enumerate(v['input']):eq(row['x'],x);near(row['re'],wave[x].real);near(row['im'],wave[x].imag)
   nearest=[]
   for y,row in enumerate(v['outcomes']):
    eq(row['y'],y);near(row['re'],out[y].real);near(row['im'],out[y].imag);near(row['probability'],prob[y]);near(row['theory'],prob[y]);near(row['defect'],row['probability']-row['theory']);dist=min(abs(phi-y/Q),1-abs(phi-y/Q));near(row['circularError'],dist);eq(row['nearest'],dist<=.5/Q)
    if dist<=.5/Q:nearest.append(y)
    if float(Q*phi).is_integer():eq(row['theory'],1 if y==int(Q*phi)else 0)
    assert row['probability']>=0
   acc=0j
   for x,row in enumerate(v['selectedTerms']):
    z=cmath.exp(2j*math.pi*x*(phi-c['y']/Q))/Q;acc+=z;eq(row['x'],x);near(row['turns'],x*(phi-c['y']/Q));near(row['re'],z.real);near(row['im'],z.imag);near(row['sumRe'],acc.real);near(row['sumIm'],acc.imag)
   eq(v['nearestBins'],nearest);near(v['totalProbability'],sum(prob));near(v['normalizationDefect'],sum(prob)-1);near(v['nearestProbability'],sum(prob[y]for y in nearest));near(v['nearestLowerBound'],4/math.pi**2);assert v['nearestProbability']>=4/math.pi**2-1e-12
  else:
   eq(s['phase'],None);v=s['order'];N,a=c['N'],c['a'];common=math.gcd(a,N);eq(v['gcd'],common)
   if common!=1:
    eq(v['status'],'classical-factor');eq(v['factor'],common);eq(v['cofactor'],N//common)
    for key in ['powers','permutation','input','groups','outcomes','selectedTerms','continuedFractions']:eq(v[key],[])
    for key in ['referenceOrder','totalProbability','normalizationDefect','verifiedFactorProbability']:eq(v[key],None)
    continue
   eq(v['status'],'quantum-order-toy');eq(v['factor'],None);eq(v['cofactor'],None);r=next(d for d in range(1,N)if pow(a,d,N)==1);eq(v['referenceOrder'],r);eq(v['powers'],[pow(a,x,N)for x in range(r)]);values=[pow(a,x,N)for x in range(Q)];eq(v['input'],[dict(x=x,value=val)for x,val in enumerate(values)])
   eq(v['permutation'],[dict(x=x,image=a*x%N if x<N else x)for x in range(2**(N-1).bit_length())]);eq(len({p['image']for p in v['permutation']}),len(v['permutation']))
   groupvalues=list(dict.fromkeys(values));amplitudes={z:[u/Q for u in fft([int(val==z)for val in values])]for z in groupvalues};prob=[sum(abs(amplitudes[z][y])**2 for z in groupvalues)for y in range(Q)];phaseparts=[[abs(v)**2/r for v in phase_fft(Q,j/r)]for j in range(r)];eq(len(v['groups']),len(groupvalues));eq(len(v['outcomes']),Q)
   for g,z in zip(v['groups'],groupvalues):eq(g,dict(value=z,indices=[x for x in range(Q)if values[x]==z],count=values.count(z),weight=values.count(z)/Q))
   success=0
   for y,row in enumerate(v['outcomes']):
    eq(row['y'],y);near(row['probability'],prob[y]);near(row['theory'],sum(part[y]for part in phaseparts));near(row['defect'],row['probability']-row['theory']);near(row['probability'],row['theory']);eq(len(row['branches']),len(groupvalues));eq(len(row['components']),r)
    for b,z in zip(row['branches'],groupvalues):
     w=values.count(z)/Q;eq(b['value'],z);near(b['re'],amplitudes[z][y].real);near(b['im'],amplitudes[z][y].imag);near(b['jointProbability'],abs(amplitudes[z][y])**2);near(b['conditionalProbability'],abs(amplitudes[z][y])**2/w);near(b['weight'],w)
    for j,part in enumerate(row['components']):eq(part['j'],j);near(part['phase'],j/r);near(part['probability'],phaseparts[j][y])
    candidates=cf(y,Q,N,a);factor=next((t['factor']for t in candidates if t['factor']is not None),None);eq(row['factor'],factor);eq(row['cofactor'],None if factor is None else N//factor)
    if factor is not None:assert N%factor==0;success+=prob[y]
   selected=[]
   for z in groupvalues:
    acc=0j
    for x in range(Q):
     if values[x]!=z:continue
     term=cmath.exp(-2j*math.pi*x*c['y']/Q)/Q;acc+=term;selected.append(dict(value=z,x=x,re=term.real,im=term.imag,sumRe=acc.real,sumIm=acc.imag))
   eq(len(v['selectedTerms']),len(selected))
   for row,expected in zip(v['selectedTerms'],selected):
    for k,val in expected.items():near(row[k],val)
   expectedcf=cf(c['y'],Q,N,a);eq(len(v['continuedFractions']),len(expectedcf))
   for row,expected in zip(v['continuedFractions'],expectedcf):
    for k,val in expected.items():
     if k=='error':near(row[k],val)
     else:eq(row[k],val)
   near(v['totalProbability'],sum(prob));near(v['normalizationDefect'],sum(prob)-1);near(v['verifiedFactorProbability'],success)

import subprocess,shutil,hashlib,re,xml.etree.ElementTree as ET,copy
prefix=['rtk','proxy']if shutil.which('rtk')else[]
staging=len(sys.argv)>1;root=Path(sys.argv[1])if staging else Path(__file__).resolve().parents[1]
js=root/'phase-estimation176.js'if staging else root/'course-shared/labs/phase-estimation.js'
fixture=(root/'phase-snapshot176.json'if(root/'phase-snapshot176.json').exists()else root/'phase176-preview-observations.json')if staging else root/'course-shared/projects/phase-certificates/run-snapshot.json'
grover=root/'grover-amplification176.js'if staging else root/'course-shared/labs/grover-amplification.js'
code=r'''const a=require(process.argv[1]),g=require(process.argv[2]),d={records:a.PRESETS.map(p=>a.snapshot(p.config)),views:[],invalid:0,self:a.selfTest(),feedback:[],grover:[],groverSelf:g.selfTest()};
for(let bits=2;bits<=9;bits++)for(const phase of [0,.3,1])d.records.push(a.snapshot({bits,phase,y:0}));
for(const N of [15,21,33,35])for(const base of [2,3,N-1])d.records.push(a.snapshot({mode:'order',N,a:base,bits:6,y:11}));
for(const s of d.records.slice(0,12))d.views.push({s,plots:a.plots(s),svg:a.plots(s).map(a.svg),tables:a.tables(s)});
function bad(o){let threw=false;try{a.config(o)}catch(e){threw=true;}if(!threw)throw Error('invalid accepted');d.invalid++;}
for(const o of [null,[],true,1,'x',{unknown:1},{constructor:1},JSON.parse('{"__proto__":1}')])bad(o);
for(const key of ['bits','phase','N','a','y'])for(const v of [NaN,Infinity,-Infinity,null,[],true,'1',{}])bad({[key]:v});
for(const v of ['invalid',null,[],true,1,{},'toString'])bad({mode:v});
for(const o of [{bits:1},{bits:10},{bits:2.5},{phase:-.1},{phase:1.1},{N:22},{a:1},{a:21},{a:2.2},{y:-1},{y:32},{y:.5}])bad(o);
for(let i=0;i<4;i++)for(let j=0;j<2;j++)d.feedback.push({i,j,...a.feedback(i,j)});
for(const N of [4,8,16,32])for(const M of [1,N/2,N-1]){let state=g.init({N,M});const states=[state];for(let k=0;k<12;k++){states.push(g.oracle(state));state=g.iterate(state);states.push(state);}d.grover.push({N,M,states});}
console.log(JSON.stringify(d));'''
d=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(grover.resolve())],text=True));check_records(d['records']);eq(d['self'],{'status':'PASS','checks':21});assert d['groverSelf']['ok']and d['groverSelf']['checks']==631
f=json.loads(fixture.read_text());assert f['provenance']['sourceSha256']==hashlib.sha256(js.read_bytes()).hexdigest();eq(len(f['records']),6)
def rec(a,b):
 if isinstance(b,dict):eq(set(a),set(b));[rec(a[k],v)for k,v in b.items()]
 elif isinstance(b,list):eq(len(a),len(b));[rec(x,y)for x,y in zip(a,b)]
 elif isinstance(b,bool)or b is None or isinstance(b,str):eq(a,b)
 else:near(a,b)
replays=json.loads(subprocess.check_output(prefix+['node','-e','const a=require(process.argv[1]),f=require(process.argv[2]);console.log(JSON.stringify(f.records.map(r=>a.snapshot(r.data.parameters))))',str(js.resolve()),str(fixture.resolve())],text=True))
for record,replay in zip(f['records'],replays):rec(record['data'],replay)
check_records([r['data']for r in f['records']]);coords=markers=ledgerRows=0
for view in d['views']:
 s=view['s'];v=s['phase']or s['order'];isPhase=s['phase']is not None;out=v['outcomes'];terms=v['selectedTerms']if isPhase else[r for r in v['selectedTerms']if r['value']==1]
 expected={
 'distribution':[[[r['y'],r['probability']]for r in out],[[r['y'],r['theory']]for r in out]],
 'amplitude':[[[i,(r if isPhase else next(b for b in r['branches']if b['value']==1))[k]]for i,r in enumerate(out)]for k in ['re','im']],
 'phasor':[[[0,0]]+[[r['sumRe'],r['sumIm']]for r in terms]if terms else[]],
 'defect':[[[r['y'],r['defect']]for r in out]],
 'cost':[[[r['j'],r['genericBaseUCalls']]for r in s['cost']['powers']]],
 'certificate':[[[0,v['nearestProbability']]],[[1,v['nearestLowerBound']]]]if isPhase else[[[r['y'],r['probability']]for r in out],[[r['y'],r['probability']if r['factor']is not None else 0]for r in out]]}
 eq(len(view['plots']),6);eq(len(view['svg']),6)
 for p,svgtext in zip(view['plots'],view['svg']):
  eq(len(p['series']),len(expected[p['key']]));xml=ET.fromstring(svgtext);ns={'s':'http://www.w3.org/2000/svg'};paths=xml.findall('s:path',ns);circles=xml.findall('s:circle',ns);eq(len(paths),len(p['series']));expectedCircles=[]
  for ser,path,points in zip(p['series'],paths,expected[p['key']]):
   rec(ser['points'],points);xy=[];segments=0;pen=False
   for point in points:
    if point is None:pen=False;continue
    if not pen or ser['markersOnly']:segments+=1
    pen=True;x,y=point;assert p['xMin']<=x<=p['xMax']and p['yMin']<=y<=p['yMax'];xy.extend([100+(x-p['xMin'])/(p['xMax']-p['xMin'])*755,385-(y-p['yMin'])/(p['yMax']-p['yMin'])*290])
   eq(path.attrib['d'].count('M'),segments);actual=list(map(float,re.findall(r'-?\d+(?:\.\d+)?',path.attrib['d'])));eq(len(actual),len(xy))
   for x,y in zip(actual,xy):assert abs(x-y)<6e-7;coords+=1
   marked=points if ser['markersOnly']or len(points)==1 else[]
   for x,y in marked:expectedCircles.append((100+(x-p['xMin'])/(p['xMax']-p['xMin'])*755,385-(y-p['yMin'])/(p['yMax']-p['yMin'])*290,ser.get('markerRadius',5),ser.get('markerStrokeWidth',2.5),'none'if ser.get('hollow')else ser['color']))
  eq(len(circles),len(expectedCircles))
  for circle,(x,y,radius,width,fill)in zip(circles,expectedCircles):near(float(circle.attrib['cx']),x);near(float(circle.attrib['cy']),y);near(float(circle.attrib['r']),radius);near(float(circle.attrib['stroke-width']),width);eq(circle.attrib['fill'],fill);markers+=1
  if not out and p['key']!='cost':assert '本次没有执行量子步骤' in svgtext
 ts={t['key']:t for t in view['tables']};eq(len(ts),10)
 def rows(key,source,keys):
  global ledgerRows
  expected=[[r[k]for k in keys]for r in source];rec(ts[key]['rows'],expected);ledgerRows+=len(expected)
 rows('input',v['input'],['x','re','im']if isPhase else['x','value']);rows('distribution',out,['y','re','im','probability','theory','defect','circularError','nearest']if isPhase else['y','probability','theory','defect','factor','cofactor']);rows('phasors',v['selectedTerms'],['x','turns','re','im','sumRe','sumIm']if isPhase else['value','x','re','im','sumRe','sumIm']);rows('cost',s['cost']['powers'],['j','exponent','genericBaseUCalls','modularMultiplier']);rows('order',s['order']['permutation']if s['order']else[],['x','image'])
 rows('fractions',s['order']['continuedFractions']if s['order']else[],['index','numeratorInput','denominatorInput','quotient','remainder','p','q','errorNumerator','error','legendreClose','withinOrderRange','power','verifiedMultiple','even','half','gMinus','gPlus','factor','cofactor','status'])
 rec(ts['branches']['rows'],[[r['y']]+[b[k]for k in ['value','re','im','jointProbability','conditionalProbability','weight']]for r in(s['order']['outcomes']if s['order']else[])for b in r['branches']]);rec(ts['mixture']['rows'],[[r['y'],b['j'],b['phase'],b['probability']]for r in(s['order']['outcomes']if s['order']else[])for b in r['components']]);ledgerRows+=len(ts['branches']['rows'])+len(ts['mixture']['rows'])
 params=s['parameters'];rec(ts['parameters']['rows'],[['模式',params['mode']],['控制位m',params['bits']],['Q',s['Q']],['相位输入（求阶模式不使用）',params['phase']],['N（相位模式不使用）',params['N']],['底数a（相位模式不使用）',params['a']],['所选y（条件查看，并未抽样）',params['y']]])
 summary=[v['totalProbability'],v['normalizationDefect'],v['nearestProbability']if isPhase else None,s['order']['status']if s['order']else None,s['order']['referenceOrder']if s['order']else None,s['order']['verifiedFactorProbability']if s['order']else None,s['order']['factor']if s['order']else None,s['cost']['qftHadamards'],s['cost']['qftControlledPhases'],s['cost']['qftSwaps'],s['cost']['inputHadamards'],s['cost']['genericBaseUCalls']];rec([r[1]for r in ts['summary']['rows']],summary)
 for t in ts.values():assert all(len(row)==len(t['headers'])for row in t['rows'])
for row in d['feedback']:eq(row['correct'],row['j']==[0,1,0,1][row['i']]);assert len(row['text'])>30 and 'undefined'not in row['text']
groverRows=0
for case in d['grover']:
 N,M=case['N'],case['M'];states=case['states'];marked=set(states[0]['marked']);eq(len(marked),M);values=[1/math.sqrt(N)]*N
 for index,row in enumerate(states):
  if index:
   if index%2:values=[-v if i in marked else v for i,v in enumerate(values)]
   else:mean=sum(values)/N;values=[2*mean-v for v in values]
  rec(row['amplitudes'],values);rec(row['signedAmplitudes'],values);norm=sum(v*v for v in values);near(row['normSquared'],norm);near(row['norm'],math.sqrt(norm));near(row['mean'],sum(values)/N);near(row['successProbability'],sum(values[i]**2 for i in marked)/norm);eq(row['queryCount'],(index+1)//2);eq(row['iteration'],index//2);groverRows+=1
mutations=0
for target,key in [('phase','re'),('phase','probability'),('phase','theory'),('phase','sumRe'),('order','referenceOrder'),('order','factor'),('order','jointProbability'),('cost','genericBaseUCalls')]:
 s=copy.deepcopy(next(s for s in d['records']if s[target]is not None and(target!='order'or s['order']['status']=='quantum-order-toy'))if target!='cost'else d['records'][0])
 if target=='cost':s['cost'][key]+=1
 elif key=='sumRe':s['phase']['selectedTerms'][0][key]+=1
 elif key=='referenceOrder':s['order'][key]+=1
 elif key=='jointProbability':s['order']['outcomes'][0]['branches'][0][key]+=1
 else:s[target]['outcomes'][0][key]=999
 try:check_records([s])
 except AssertionError:mutations+=1
 else:raise AssertionError('missed mutation '+key)
if not staging:
 for course in ['ai-course','grad-math','math-course','physics-course']:
  assert(root/course/'site/assets/learning/labs/phase-estimation.js').read_bytes()==js.read_bytes();assert(root/course/'site/assets/learning/labs/grover-amplification.js').read_bytes()==grover.read_bytes()
 assert(root/'physics-course/site/assets/learning/projects/phase-certificates/run-snapshot.json').read_bytes()==fixture.read_bytes()
 assert(root/'physics-course/images/qi-02-phase-ledgers.svg').read_bytes()==(root/'physics-course/site/assets/img/qi-02-phase-ledgers.svg').read_bytes()
 src=(root/'physics-course/lectures/qi-02-algorithms.md').read_text();assert len(re.findall(r'^## \d+\.',src,re.M))==12 and src.count('$$')==10 and src.count('<details class="answer"')==8
 assert(root/'.github/workflows/course-audit.yml').read_text().count('python tools/check_quantum_algorithms_full.py')==1
print(json.dumps({'status':'PASS','records':len(d['records']),'frozen':len(f['records']),'checks':checks,'plotCoordinates':coords,'markers':markers,'ledgerRows':ledgerRows,'invalid':d['invalid'],'feedback':len(d['feedback']),'mutations':mutations,'self':d['self']['checks'],'groverRows':groverRows,'groverSelf':631}))
