"""Portable complex-matrix regression oracle, cross-checked independently with NumPy."""
from pathlib import Path
import json,math,itertools,sys
checks=0
def eq(a,b):
 global checks
 assert a==b,'values differ';checks+=1
def near(a,b):
 global checks
 assert math.isfinite(abs(a))and abs(a-b)<=2e-10*max(1,abs(b)),(a,b);checks+=1
def rec(a,b):
 if isinstance(b,dict):eq(set(a),set(b));[rec(a[k],v)for k,v in b.items()]
 elif isinstance(b,list):eq(len(a),len(b));[rec(x,y)for x,y in zip(a,b)]
 elif isinstance(b,(bool,str))or b is None:eq(a,b)
 else:near(a,b)
def z(v):return complex(*v)
def cm(a,b):
 eq(len(a),len(b))
 for r,s in zip(a,b):
  eq(len(r),len(s))
  for x,y in zip(r,s):near(z(x),y)
def zeros(n,m=None):return[[0j]*(n if m is None else m)for _ in range(n)]
def eye(n):return[[complex(i==j)for j in range(n)]for i in range(n)]
def dagger(A):return[[A[j][i].conjugate()for j in range(len(A))]for i in range(len(A[0]))]
def mm(A,B):return[[sum(a*B[k][j]for k,a in enumerate(row))for j in range(len(B[0]))]for row in A]
def ms(A,t):return[[t*z for z in row]for row in A]
def ma(A,B):return[[x+y for x,y in zip(r,s)]for r,s in zip(A,B)]
def trace(A):return sum(row[i]for i,row in enumerate(A))
def kron(A,B):return[[a*b for a in row for b in line]for row in A for line in B]
P={'I':eye(2),'X':[[0j,1+0j],[1+0j,0j]],'Y':[[0j,-1j],[1j,0j]],'Z':[[1+0j,0j],[0j,-1+0j]]}
def tensor(word):
 A=[[1+0j]]
 for k in word:A=kron(A,P[k])
 return A
def rotation(axis,angle):return ma(ms(P['I'],math.cos(angle/2)),ms(P[axis],-1j*math.sin(angle/2)))
def maxmod(A):return max(abs(z)for r in A for z in r)
def channel(Ks,rho):
 out=zeros(2)
 for K in Ks:out=ma(out,mm(mm(K,rho),dagger(K)))
 return out
def sx(word):return[sum(a!='I'and b!='I'and a!=b for a,b in zip(word,g))%2 for g in ['ZZI','IZZ']]
SIGNS=['++','+-','-+','--'];RWORDS=['III','IIX','XII','IXI'];V=zeros(8,2);V[0][0]=V[7][1]=1
PROJ=[]
for a,b in [(1,1),(1,-1),(-1,1),(-1,-1)]:PROJ.append(ms(mm(ma(eye(8),ms(tensor('ZZI'),a)),ma(eye(8),ms(tensor('IZZ'),b))),.25))
REC=[tensor(w)for w in RWORDS]
def kraus(E,j):return mm(mm(mm(dagger(V),REC[j]),PROJ[j]),mm(E,V))
PAULIS={}
for chars in itertools.product('IXYZ',repeat=3):
 word=''.join(chars);s=sx(word);j=2*s[0]+s[1];K=kraus(tensor(word),j);coeff={k:trace(mm(M,K))/2 for k,M in P.items()};key=max(coeff,key=lambda k:abs(coeff[k]));PAULIS[word]=(j,K,key,coeff[key])
def check_shor(s):
 gens=['ZZIIIIIII','IZZIIIIII','IIIZZIIII','IIIIZZIII','IIIIIIZZI','IIIIIIIZZ','XXXXXXIII','IIIXXXXXX'];eq([g['word']for g in s['generators']],gens)
 def mask(word,letters):return int(''.join('1'if k in letters else'0'for k in word),2)
 def parity(x):return x.bit_count()%2
 def apply(word,state):
  out={}
  for index,value in state.items():
   bits=list(format(index,'09b'));phase=1
   for j,k in enumerate(word):
    if k=='X':bits[j]='1'if bits[j]=='0'else'0'
    elif k=='Z':phase*=1 if bits[j]=='0'else-1
    elif k=='Y':phase*=1j if bits[j]=='0'else-1j;bits[j]='1'if bits[j]=='0'else'0'
   out[int(''.join(bits),2)]=phase*value
  return out
 def dot(a,b):return sum(v.conjugate()*b.get(i,0)for i,v in a.items())
 def decoded(raw):return{int(k):z(v)for k,v in raw.items()}
 def vector(raw,expected):eq(set(map(int,raw)),set(expected));[near(z(raw[str(k)]),v)for k,v in expected.items()]
 basis=[{},{}]
 for bits in itertools.product([0,1],repeat=3):
  index=int(''.join('111'if b else'000'for b in bits),2);basis[0][index]=1/math.sqrt(8);basis[1][index]=(-1)**sum(bits)/math.sqrt(8)
 for raw,v in zip(s['basis'],basis):vector(raw,v)
 def syndrome(word):return[sum(a!='I'and b!='I'and a!=b for a,b in zip(word,g))%2 for g in gens]
 eq(s['commutation'],[syndrome(g)for g in gens]);group=set()
 for row in s['group']:
  bits=row['bits'];wordx=wordz=0;state=basis[0]
  for j,g in enumerate(gens):
   if bits&(1<<j):wordx^=mask(g,'XY');wordz^=mask(g,'YZ');state=apply(g,state)
  eq(row['x'],wordx);eq(row['z'],wordz);near(z(row['fixesCode0']),dot(basis[0],state));group.add((wordx,wordz));[near(state[k],v)for k,v in basis[0].items()]
 eq(len(s['group']),256);eq(len(group),s['groupSize']);eq(s['dimension'],2)
 for g in s['generators']:eq(g['x'],mask(g['word'],'XY'));eq(g['z'],mask(g['word'],'YZ'));eq(g['y'],g['word'].count('Y'))
 words=['I'*9]+['I'*j+k+'I'*(8-j)for j in range(9)for k in 'XYZ'];eq([e['word']for e in s['errors']],words);states={w:[apply(w,v)for v in basis]for w in words}
 for e in s['errors']:
  eq(e['syndrome'],syndrome(e['word']));vector(e['code0'],states[e['word']][0]);vector(e['code1'],states[e['word']][1])
 eq(len(s['knillLaflamme']),784)
 for index,row in enumerate(s['knillLaflamme']):
  eq(row['a'],words[index//28]);eq(row['b'],words[index%28]);A=[[dot(v,w)for w in states[row['b']]]for v in states[row['a']]];scalar=trace(A)/2;cm(row['matrix'],A);near(z(row['scalar']),scalar);near(row['defect'],maxmod(ma(A,ms(eye(2),-scalar))));near(row['defect'],0)
 near(s['maxKLDefect'],0);eq(len(s['distanceEnumeration']),2619);seen=set();distance=99
 for row in s['distanceEnumeration']:
  word=row['word'];eq(len(word),9);assert set(word)<=set(P);assert word not in seen;seen.add(word);weight=sum(k!='I'for k in word);assert 1<=weight<=3;eq(row['weight'],weight);sy=syndrome(word);eq(row['syndrome'],sy);commutes=not any(sy);stabilizer=(mask(word,'XY'),mask(word,'YZ'))in group;eq(row['commutes'],commutes);eq(row['stabilizer'],stabilizer);eq(row['nontrivialLogical'],commutes and not stabilizer)
  if commutes and not stabilizer:distance=min(distance,weight)
 eq(s['distance'],distance);eq(distance,3)
 for name,expected in [('logicalX',P['X']),('logicalZ',P['Z'])]:
  block=[[dot(v,apply(s[name],w))for w in basis]for v in basis];cm(s[name+'Block'],block)
  for r,t in zip(block,expected):[near(x,y)for x,y in zip(r,t)]
def check_records(records):
 common=None
 for r in records:
  q=r['parameters'];theta,phi=q['theta'],q['phi'];psi=[complex(math.cos(theta/2)),math.sin(theta/2)*complex(math.cos(phi),math.sin(phi))];rho=[[a*b.conjugate()for b in psi]for a in psi];[near(z(a),b)for a,b in zip(r['initial']['psi'],psi)];cm(r['initial']['rho'],rho);model,p=q['model'],q['p'];errors=[]
  if model=='pauli':errors=[(q['error'],1,tensor(q['error']))]
  elif model=='correlated':errors=[('III',1-p,ms(eye(8),math.sqrt(1-p))),('XXX',p,ms(tensor('XXX'),math.sqrt(p)))]
  elif model in ['independent','depolarizing']:
   letters='IX'if model=='independent'else'IXYZ'
   for chars in itertools.product(letters,repeat=3):
    word=''.join(chars);weight=math.prod(1-p if k=='I'else p/(len(letters)-1)for k in word);errors.append((word,weight,ms(tensor(word),math.sqrt(weight))))
  else:
   E=[[1+0j]]
   for i in range(1,4):E=kron(E,rotation(q['axis'],q['angle'])if model=='coherentAll'or i==q['site']else eye(2))
   errors=[(model,1,E)]
  eq(len(r['noise']),len(errors));eq(len(r['branches']),4*len(errors));Ks=[];syndromes=[zeros(2)for _ in range(4)]
  for i,(name,weight,E)in enumerate(errors):
   e=r['noise'][i];eq(e['label'],name);near(e['weight'],weight);cm(e['matrix'],E)
   for j in range(4):
    K=kraus(E,j);state=channel([K],rho);prob=trace(state).real;b=r['branches'][4*i+j];eq(b['error'],name);eq(b['syndrome'],SIGNS[j]);near(b['weight'],weight);eq(b['correctionMask'],[0,1,4,2][j]);cm(b['K'],K);cm(b['unnormalized'],state);near(b['probability'],prob)
    if prob==0:eq(b['conditional'],None)
    else:cm(b['conditional'],ms(state,1/prob))
    Ks.append(K);syndromes[j]=ma(syndromes[j],state)
  out=channel(Ks,rho);complete=zeros(2)
  for K in Ks:complete=ma(complete,mm(dagger(K),K))
  cm(r['output'],out);cm(r['completeness'],complete);near(r['tracePreservationDefect'],maxmod(ma(complete,ms(eye(2),-1))));near(r['normalizationDefect'],trace(out).real-1);near(r['fidelity'],trace(mm(rho,out)).real);near(r['purity'],trace(mm(out,out)).real)
  rec(r['inputBloch'],[trace(mm(P[k],rho)).real for k in 'XYZ']);rec(r['outputBloch'],[trace(mm(P[k],out)).real for k in 'XYZ']);rec(r['pauliTransferMatrix'],[[trace(mm(A,channel(Ks,B))).real/2 for B in P.values()]for A in P.values()])
  eq(len(r['syndromes']),4)
  for j,b in enumerate(r['syndromes']):
   state=syndromes[j];prob=trace(state).real;eq(b['syndrome'],SIGNS[j]);near(b['probability'],prob);cm(b['unnormalized'],state)
   if prob==0:eq(b['conditional'],None)
   else:cm(b['conditional'],ms(state,1/prob))
  eq(len(r['paulis']),64);weights={k:0 for k in P}
  for row,(word,(j,K,logical,phase))in zip(r['paulis'],PAULIS.items()):
   eq(row['word'],word);eq(row['logical'],logical);eq(row['universallyCorrected'],logical=='I');eq(row['syndrome'],SIGNS[j]);cm(row['matrix'],K);near(z(row['phase']),phase);eq(row['weight'],sum(k!='I'for k in word));eq(row['bitMask'],int(''.join('1'if k in'XY'else'0'for k in word),2));eq(row['correctionMask'],[0,1,4,2][j])
   if model=='pauli':weight=int(word==q['error'])
   elif model=='correlated':weight=1-p if word=='III'else p if word=='XXX'else 0
   else:weight=math.prod(1-p if k=='I'else(p if k=='X'else 0)if model=='independent'else p/3 for k in word)
   weights[logical]+=weight
  ref=r['reference']
  if model.startswith('coherent'):
   if q['axis']=='Z':U=rotation('Z',q['angle']*(3 if model=='coherentAll'else 1));expected=channel([U],rho);eq(ref['q'],None);eq(ref['kappa'],None)
   elif model=='coherentSingle':expected=rho;near(ref['q'],0);near(ref['kappa'],0)
   else:
    c,t=math.cos(q['angle']/2),math.sin(q['angle']/2);fail=3*c*c*t**4+t**6;kappa=2*c**3*t**3;expected=ma(ma(ms(rho,1-fail),ms(mm(mm(P['X'],rho),P['X']),fail)),ms(ma(mm(P['X'],rho),ms(mm(rho,P['X']),-1)),-1j*kappa));near(ref['q'],fail);near(ref['kappa'],kappa)
  else:
   expected=zeros(2)
   for k,v in weights.items():expected=ma(expected,ms(mm(mm(P[k],rho),P[k]),v));near(ref['weights'][k],v)
   near(ref['q'],weights['X']);near(ref['kappa'],0)
  cm(ref['rho'],expected);near(r['referenceDefect'],maxmod(ma(out,ms(expected,-1))));near(r['independentFailure'],3*p*p-2*p**3);near(r['correlatedFailure'],p)
  if 'probabilityScan'in r:
   eq(len(r['probabilityScan']),51)
   for i,row in enumerate(r['probabilityScan']):
    p0=i/50;f=3*p0*p0-2*p0**3;rec(row,{'p':p0,'independent':f,'correlated':p0,'improvement':p0-f})
  if 'angleScan'in r:
   eq(len(r['angleScan']),81)
   for i,row in enumerate(r['angleScan']):
    angle=-math.pi+2*math.pi*i/80;U=rotation('X',angle);E=kron(kron(U,U),U);coherent=channel([kraus(E,j)for j in range(4)],rho);p0=math.sin(angle/2)**2;fail=3*p0*p0-2*p0**3;random=ma(ms(rho,1-fail),ms(mm(mm(P['X'],rho),P['X']),fail));near(row['angle'],angle);near(row['p'],p0);near(row['q'],fail);near(row['kappa'],2*math.cos(angle/2)**3*math.sin(angle/2)**3);cm(row['coherentState'],coherent);cm(row['randomState'],random);near(row['coherentFidelity'],trace(mm(rho,coherent)).real);near(row['randomFidelity'],trace(mm(rho,random)).real);near(row['coherentZ'],trace(mm(P['Z'],coherent)).real);near(row['randomZ'],trace(mm(P['Z'],random)).real)
  if 'shor'in r:
   if common is None:check_shor(r['shor']);common=r['shor']
   else:eq(r['shor'],common)

import subprocess,shutil,hashlib,re,xml.etree.ElementTree as ET,copy
prefix=['rtk','proxy']if shutil.which('rtk')else[]
staging=len(sys.argv)>1;root=Path(sys.argv[1])if staging else Path(__file__).resolve().parents[1]
js=root/'qec-channel177.js'if staging else root/'course-shared/labs/qec-channel.js'
fixture=(root/'qec-snapshot177.json'if(root/'qec-snapshot177.json').exists()else root/'qec177-preview-observations.json')if staging else root/'course-shared/projects/qec-certificates/run-snapshot.json'
code=r'''const a=require(process.argv[1]),d={records:a.PRESETS.map(p=>a.snapshot(p.config)),views:[],invalid:0,self:a.selfTest(),feedback:[]};
for(const model of a.MODELS)for(const p of [0,.5,1])d.records.push(a.snapshot({model,p}));
for(const axis of ['X','Z'])for(const angle of [-Math.PI,0,Math.PI])for(const model of ['coherentSingle','coherentAll'])d.records.push(a.snapshot({axis,angle,model,theta:.8,phi:-1.2,site:3}));
for(const error of ['III','XYZ','YYY','ZZZ','ZIZ','YXY'])d.records.push(a.snapshot({model:'pauli',error,theta:.4,phi:.8}));
for(const s of d.records.slice(0,12))d.views.push({s,plots:a.plots(s),svg:a.plots(s).map(a.svg),tables:a.tables(s)});
function bad(o){let threw=false;try{a.config(o)}catch(e){threw=true;}if(!threw)throw Error('invalid accepted');d.invalid++;}
for(const o of [null,[],true,1,'x',{unknown:1},{constructor:1},JSON.parse('{"__proto__":1}')])bad(o);
for(const key of ['p','angle','theta','phi','site'])for(const v of [NaN,Infinity,-Infinity,null,[],true,'1',{}])bad({[key]:v});
for(const key of ['model','error','axis'])for(const v of ['invalid',null,[],true,1,{},'toString'])bad({[key]:v});
for(const o of [{p:-.1},{p:1.1},{angle:-4},{angle:4},{theta:-1},{theta:4},{phi:-4},{phi:4},{site:0},{site:4},{site:1.5},{error:'XX'}])bad(o);
for(let i=0;i<4;i++)for(let j=0;j<2;j++)d.feedback.push({i,j,...a.feedback(i,j)});
console.log(JSON.stringify(d));'''
d=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve())],text=True));check_records(d['records']);eq(d['self'],{'checks':24,'presets':12})
f=json.loads(fixture.read_text());eq(f['provenance']['sourceSha256'],hashlib.sha256(js.read_bytes()).hexdigest());eq(len(f['records']),6)
replays=json.loads(subprocess.check_output(prefix+['node','-e','const a=require(process.argv[1]),f=require(process.argv[2]);console.log(JSON.stringify(f.records.map(r=>a.snapshot(r.data.parameters))))',str(js.resolve()),str(fixture.resolve())],text=True))
for record,replay in zip(f['records'],replays):rec(record['data'],replay)
check_records([r['data']for r in f['records']]);coords=markers=ledgerRows=0
for view in d['views']:
 s=view['s'];expected={
 'syndromes':[[[i,r['probability']]for i,r in enumerate(s['syndromes'])]],
 'bloch':[[[i,v]for i,v in enumerate(s[k])]for k in ['inputBloch','outputBloch']],
 'probability':[[[r['p'],r[k]]for r in s['probabilityScan']]for k in ['independent','correlated']],
 'angle':[[[r['angle'],r[k]]for r in s['angleScan']]for k in ['coherentZ','randomZ']],
 'transfer':[[[4*i+j,v]for i,row in enumerate(s['pauliTransferMatrix'])for j,v in enumerate(row)]],
 'kl':[[[i,r['defect']]for i,r in enumerate(s['shor']['knillLaflamme'])]]}
 eq(len(view['plots']),6);eq(len(view['svg']),6)
 for p,svgtext in zip(view['plots'],view['svg']):
  eq(len(p['series']),len(expected[p['key']]));xml=ET.fromstring(svgtext);ns={'s':'http://www.w3.org/2000/svg'};paths=xml.findall('s:path',ns);circles=xml.findall('s:circle',ns);eq(len(paths),len(p['series']));expectedCircles=[]
  for ser,path,points in zip(p['series'],paths,expected[p['key']]):
   rec(ser['points'],points);xy=[]
   for x,y in points:
    assert p['xMin']<=x<=p['xMax']and p['yMin']<=y<=p['yMax'];xy.extend([100+(x-p['xMin'])/(p['xMax']-p['xMin'])*755,385-(y-p['yMin'])/(p['yMax']-p['yMin'])*290])
   eq(path.attrib['d'].count('M'),len(points)if ser['markersOnly']else 1);actual=list(map(float,re.findall(r'-?\d+(?:\.\d+)?',path.attrib['d'])));eq(len(actual),len(xy))
   for x,y in zip(actual,xy):assert abs(x-y)<6e-7;coords+=1
   for x,y in(points if ser['markersOnly']or len(points)==1 else[]):expectedCircles.append((100+(x-p['xMin'])/(p['xMax']-p['xMin'])*755,385-(y-p['yMin'])/(p['yMax']-p['yMin'])*290,ser.get('markerRadius',5),ser.get('markerStrokeWidth',2.5),'none'if ser.get('hollow')else ser['color']))
  eq(len(circles),len(expectedCircles))
  for circle,(x,y,radius,width,fill)in zip(circles,expectedCircles):near(float(circle.attrib['cx']),x);near(float(circle.attrib['cy']),y);near(float(circle.attrib['r']),radius);near(float(circle.attrib['stroke-width']),width);eq(circle.attrib['fill'],fill);markers+=1
 ts={t['key']:t for t in view['tables']};eq(len(ts),13)
 def rows(key,source,keys):
  global ledgerRows
  expected=[[r[k]for k in keys]for r in source];rec(ts[key]['rows'],expected);ledgerRows+=len(expected)
 rows('branches',s['branches'],['error','syndrome','probability','correctionMask','K','unnormalized','conditional']);rows('syndromes',s['syndromes'],['syndrome','probability','unnormalized','conditional']);rows('paulis',s['paulis'],['word','weight','bitMask','syndrome','correctionMask','logical','phase','matrix','universallyCorrected']);rows('scan',s['angleScan'],['angle','p','q','kappa','coherentFidelity','randomFidelity','coherentZ','randomZ','coherentState','randomState']);rows('kl',s['shor']['knillLaflamme'],['a','b','matrix','scalar','defect']);rows('distance',s['shor']['distanceEnumeration'],['word','weight','syndrome','commutes','stabilizer','nontrivialLogical']);rows('probability',s['probabilityScan'],['p','independent','correlated','improvement']);rows('group',s['shor']['group'],['bits','x','z','fixesCode0'])
 expected=[[label,i,j,*value]for label,A in [('输入',s['initial']['rho']),('输出',s['output']),('参照',s['reference']['rho']),('ΣK†K',s['completeness'])]for i,row in enumerate(A)for j,value in enumerate(row)];rec(ts['states']['rows'],expected)
 rec(ts['noise']['rows'],[[e['label'],e['weight'],i,j,*value]for e in s['noise']for i,row in enumerate(e['matrix'])for j,value in enumerate(row)])
 rec(ts['transfer']['rows'],[['IXYZ'[i],'IXYZ'[j],v]for i,row in enumerate(s['pauliTransferMatrix'])for j,v in enumerate(row)])
 rec(ts['shor']['rows'],[['码基','III…III',None,None,*s['shor']['basis']]]+[['生成元',r['word'],r['x'],r['z'],None,None]for r in s['shor']['generators']]+[['错误',r['word'],r['syndrome'],None,r['code0'],r['code1']]for r in s['shor']['errors']])
 rec(ts['parameters']['rows'],[[k,v]for k,v in s['parameters'].items()]+[['分支数（包括零权重）',len(s['branches'])],['保真度（只针对当前输入）',s['fidelity']],['纯度',s['purity']],['TP残差',s['tracePreservationDefect']],['迹减1',s['normalizationDefect']],['解析参照差',s['referenceDefect']]])
 ledgerRows+=sum(len(ts[k]['rows'])for k in ['states','noise','transfer','shor','parameters'])
 for t in ts.values():assert all(len(row)==len(t['headers'])for row in t['rows'])
for row in d['feedback']:eq(row['correct'],row['j']==[0,1,0,1][row['i']]);assert len(row['text'])>30 and'undefined'not in row['text']
mutations=0
for field in ['physical','logical','probability','conditional','output','pauli','kl','distance','scan']:
 s=copy.deepcopy(d['records'][0])
 if field=='physical':s['noise'][0]['matrix'][0][0][0]+=1
 elif field=='logical':s['branches'][0]['K'][0][0][0]+=1
 elif field=='probability':s['branches'][0]['probability']+=1
 elif field=='conditional':s['branches'][0]['conditional'][0][0][0]+=1
 elif field=='output':s['output'][0][0][1]+=1
 elif field=='pauli':s['paulis'][0]['phase'][1]+=1
 elif field=='kl':s['shor']['knillLaflamme'][0]['matrix'][0][0][0]+=1
 elif field=='distance':s['shor']['distanceEnumeration'][0]['nontrivialLogical']=True
 else:s['angleScan'][40]['coherentZ']+=1
 try:check_records([s])
 except AssertionError:mutations+=1
 else:raise AssertionError('missed mutation '+field)
if not staging:
 for course in ['ai-course','grad-math','math-course','physics-course']:assert(root/course/'site/assets/learning/labs/qec-channel.js').read_bytes()==js.read_bytes()
 assert(root/'physics-course/site/assets/learning/projects/qec-certificates/run-snapshot.json').read_bytes()==fixture.read_bytes()
 assert(root/'physics-course/images/qi-03-qec-ledgers.svg').read_bytes()==(root/'physics-course/site/assets/img/qi-03-qec-ledgers.svg').read_bytes()
 src=(root/'physics-course/lectures/qi-03-error-correction.md').read_text();assert len(re.findall(r'^## \d+\.',src,re.M))==12 and src.count('$$')==12 and src.count('<details class="answer"')==8
 page=(root/'physics-course/site/qi-03-error-correction.html').read_text();assert 'assets/learning/projects/qec-certificates/run-snapshot.json'in page and 'assets/learning/labs/qec-channel.js'in page
 assert(root/'.github/workflows/course-audit.yml').read_text().count('python tools/check_qec_full.py')==1
print(json.dumps({'status':'PASS','records':len(d['records']),'frozen':len(f['records']),'checks':checks,'plotCoordinates':coords,'markers':markers,'ledgerRows':ledgerRows,'invalid':d['invalid'],'feedback':len(d['feedback']),'mutations':mutations,'self':d['self']['checks']}))
