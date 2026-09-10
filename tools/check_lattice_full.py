"""Independent finite-state enumeration, full RNG replay, statistics and rendering checks."""
from pathlib import Path
import subprocess,shutil,json,math,sys,re,html,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/physics-lattice-monte-carlo.js'
script=r'''
const a=require(process.argv[1]),configs=[...a.PRESETS];
for(const L of [3,4])for(const temperature of [.5,5])for(const field of [-1,0,1])configs.push({mode:"exact",L,temperature,field});
for(const L of [3,4,6,8,10,12])for(const initial of ["random","checker"])configs.push({L,initial,N:32,burn:3,every:2,temperature:initial==="random"?.5:5,field:initial==="random"?1:-1,seed:initial==="random"?0:4294967295});
for(const N of [64,128,256])configs.push({L:4,N,burn:0,every:4,temperature:2.27,field:.03,observable:"signed"});
configs.push({mode:"finite",temperature:1.17,field:-1});
let invalid=0;
for(const mode of ["exact","sample","finite"]){
 const keys=["temperature","field",...(mode!=="finite"?["L"]:[]),...(mode==="sample"?["N","burn","every","seed"]:[])];
 for(const key of keys)for(const val of ["",null,true,false,[],{},NaN,Infinity,-Infinity,"NaN","1e309","1e-400"]){
  let caught=false;try{a.config({mode,[key]:val});}catch(e){caught=true;}if(!caught)throw Error("accepted "+mode+key+String(val));invalid++;
 }
}
for(const c of [{mode:"bad"},{initial:"x"},{observable:"x"},{L:5},{L:2},{mode:"exact",L:6},{N:33},{N:16},{N:512},{burn:129},{every:0},{every:5},{seed:-1},{seed:4294967296},{temperature:.49},{temperature:5.01},{field:-1.01},{field:1.01},{L:12,N:256},{L:4,N:256,every:4,burn:1},null,[]]){
 let caught=false;try{a.config(c);}catch(e){caught=true;}if(!caught)throw Error("invalid boundary");invalid++;
}
const ignored=a.snapshot({mode:"finite",L:"",N:null,burn:[],every:0,seed:-1,initial:"x",observable:"x"});
if(ignored.result.rows.length!==82)throw Error("hidden fields");
const samples=[Array(32).fill(1),Array.from({length:32},(_,i)=>i%2?1:-1),Array.from({length:64},(_,i)=>Math.sin(i*.17)),Array.from({length:128},(_,i)=>i<64?-1:1),Array.from({length:256},(_,i)=>i%7-3)];
console.log(JSON.stringify({states:configs.map(c=>{const d=a.snapshot(c),plots=a.plots(d);return{...d,plots,ledgers:a.ledgers(d),svgs:plots.map(a.svg)};}),synthetic:samples.map(xs=>({xs,stats:a.statistics(xs)})),invalid,self:a.selfTest(),formats:[10,100,1000,20260910,4294967290,0].map(a.fmt)}));
'''
data=json.loads(subprocess.check_output(PREFIX+['node','-e',script,str(JS.resolve())],text=True))
checks=0
def ck(v,label):
 global checks
 assert v,label;checks+=1
def close(x,y,label,atol=3e-10,rtol=2e-9):
 ck(isinstance(x,(int,float))and math.isfinite(x)and abs(x-y)<=atol+rtol*abs(y),(label,x,y))
def maybe(x,y,label):
 if y is None:ck(x is None,label)
 else:close(x,y,label)
def measure(sp,L):
 bonds=[(i,(i//L)*L+(i+1)%L)for i in range(L*L)]+[(i,(i+L)%(L*L))for i in range(L*L)]
 return -sum(sp[i]*sp[j]for i,j in bonds),sum(sp)
dos={}
for L in [3,4]:
 n=L*L;counts={}
 for bits in range(2**n):
  sp=[2*((bits>>i)&1)-1 for i in range(n)];k=measure(sp,L);counts[k]=counts.get(k,0)+1
 dos[L]=counts
def exact(L,T,h,v):
 n=L*L;g=dos[L];emin=min(E-h*M for E,M in g)
 weights={k:count*math.exp(-(k[0]-h*k[1]-emin)/T)for k,count in g.items()};z=math.fsum(weights.values());p={k:w/z for k,w in weights.items()}
 E=math.fsum((e-h*m)*w for(e,m),w in p.items());M=math.fsum(m*w for(e,m),w in p.items())
 second=math.fsum((m/n)**2*w for(e,m),w in p.items());fourth=math.fsum((m/n)**4*w for(e,m),w in p.items())
 values=dict(energy=E/n,signed=M/n,abs=math.fsum(abs(m)*w for(e,m),w in p.items())/n,m2=second,m4=fourth,cv=math.fsum((e-h*m-E)**2*w for(e,m),w in p.items())/(n*T*T),chi=math.fsum((m-M)**2*w for(e,m),w in p.items())/(n*T),binder=1-fourth/(3*second**2),logZ=math.log(z)-emin/T)
 for key,val in values.items():close(v[key],val,'exact '+key)
 if 'rows'not in v:return values
 for key,val in [('L',L),('T',T),('h',h),('spins',n),('totalStates',2**n),('count',2**n),('mass',1),('Emin',emin),('Zscaled',z),('meanE',E),('meanM',M)]:close(v[key],val,key)
 ck([(r['E0'],r['M'])for r in v['rows']]==sorted(g),'all DOS buckets in order')
 for r in v['rows']:
  k=r['E0'],r['M'];en=k[0]-h*k[1]
  ck(r['degeneracy']==g[k],'DOS degeneracy')
  for key,val in [('energy',en),('weight',weights[k]),('probability',p[k]),('energyContribution',en*p[k]/n),('mContribution',k[1]*p[k]/n),('cvContribution',p[k]*(en-E)**2/(n*T*T)),('chiContribution',p[k]*(k[1]-M)**2/(n*T))]:close(r[key],val,'bucket '+key)
 for field,coordinate in [('energyMass','energy'),('magnetizationMass','M')]:
  grouped={}
  for(e,m),w in p.items():
   k=e-h*m if field=='energyMass'else m;grouped[k]=grouped.get(k,0)+w
  ck(len(v[field])==len(grouped),'complete marginal')
  for row,k in zip(v[field],sorted(grouped)):
   close(row[coordinate],k,'marginal support');close(row['probability'],grouped[k],'marginal mass');close(row['e'if field=='energyMass'else'm'],k/n,'normalized support')
 counts={}
 for(e,m),count in g.items():counts[e]=counts.get(e,0)+count
 ck(len(v['degeneracy'])==len(counts),'complete energy DOS')
 for row,e in zip(v['degeneracy'],sorted(counts)):
  ck(row['E0']==e and row['count']==counts[e],'energy counts');close(row['log2'],math.log2(counts[e]),'log counts')
 return values
def stats(xs,v):
 n=len(xs);mean=math.fsum(xs)/n;x=[a-mean for a in xs];ss=math.fsum(a*a for a in x)
 gam=[math.fsum(x[i]*x[i+k]for i in range(n-k))/n for k in range(n)]
 close(v['mean'],mean,'sample mean');close(v['gamma0'],gam[0],'gamma0');close(v['variance'],ss/(n-1),'sample variance');close(v['naiveSE'],math.sqrt(ss/(n-1)/n),'naive SE')
 ck(v['n']==n and len(v['acf'])==n,'all lags')
 for k,row in enumerate(v['acf']):
  ck(row['lag']==k,'lag');close(row['covariance'],gam[k],'covariance');maybe(row['rho'],gam[k]/gam[0]if gam[0]else None,'rho')
 pairs=[gam[k]+gam[k+1]for k in range(0,n,2)]
 stop=next((i for i,vv in enumerate(pairs)if vv<=0),None)if gam[0]>0 else None
 cutoff=stop if stop is not None else len(pairs)
 ips=[pairs[k]if gam[0]>0 and k<cutoff else 0 for k in range(len(pairs))]
 ims=[min(pairs[:k+1])if gam[0]>0 and k<cutoff else 0 for k in range(len(pairs))]
 ck(v['stop']==stop and len(v['pairs'])==len(pairs),'pair window')
 for k,row in enumerate(v['pairs']):
  for key,val in [('pair',k),('lag0',2*k),('lag1',2*k+1),('raw',pairs[k]),('kept',ips[k]),('monotone',ims[k])]:close(row[key],val,'pair '+key)
  ck(row['used']==(gam[0]>0 and k<cutoff),'pair retained')
 raw1=-gam[0]+2*sum(ips);raw2=-gam[0]+2*sum(ims)
 for key,val in [('ipsRaw',raw1),('imsRaw',raw2)]:close(v[key],val,key)
 # Degenerate alternating sequences have exactly zero asymptotic estimate.
 for key,val in [('ips',raw1),('ims',raw2)]:
  target=val if gam[0]>0 and val>0 else None;maybe(v[key],target,key);maybe(v[key+'SE'],math.sqrt(target/n)if target is not None else None,key+' SE')
 target=raw2 if gam[0]>0 and raw2>0 else None
 maybe(v['tau'],target/(2*gam[0])if target is not None else None,'tau');maybe(v['effective'],n*gam[0]/target if target is not None else None,'ESS')
 status='constant-sample'if gam[0]==0 else'nonpositive-estimate'if target is None else'no-cutoff-found'if stop is None else'window-estimate'
 ck(v['status']==status,'diagnostic status')
 blocks=[2**i for i in range(n.bit_length()-1)];ck([r['B']for r in v['blocks']]==blocks,'all block lengths')
 for row,B in zip(v['blocks'],blocks):
  K=n//B;means=[math.fsum(xs[k:k+B])/B for k in range(0,n,B)];variance=math.fsum((m-mean)**2 for m in means)/(K-1)
  ck(row['count']==K and len(row['means'])==K,'block budget')
  for x,y in zip(row['means'],means):close(x,y,'every block mean')
  close(row['mean'],mean,'block overall mean');close(row['variance'],variance,'block variance');close(row['se'],math.sqrt(variance/K),'block SE')
def simulate(s,v):
 L=s['L'];n=L*L;seed=s['seed'];calls=0
 def draw():
  nonlocal seed,calls
  seed=(1664525*seed+1013904223)%2**32;calls+=1;return(seed+.5)/2**32
 sp=[]
 for i,row in enumerate(v['initialRows']):
  u=draw();spin=(1 if u>=.5 else-1)if s['initial']=='random'else 1 if s['initial']=='plus'else-1 if s['initial']=='minus'else 1 if(i//L+i%L)%2==0 else-1
  sp.append(spin);ck(row==dict(i=i,u=u,spin=spin,state=seed),'initial draw')
 ck(len(sp)==n,'initial grid');e,m=measure(sp,L);ck(v['initial']==dict(E0=e,M=m),'initial energy')
 total=(s['burn']+s['N']*s['every'])*n;ck(len(v['steps'])==total,'every actual proposal')
 accepted=0;obs=[]
 for j,row in enumerate(v['steps']):
  ui=draw();ua=draw();i=int(ui*n);before=sp[i];oldE,oldM=measure(sp,L);sp[i]*=-1;newE,newM=measure(sp,L);delta0=newE-oldE;delta=delta0+2*s['field']*before
  probability=min(1,math.exp(-delta/s['temperature']));accept=ua<probability
  if not accept:sp[i]*=-1
  else:accepted+=1
  e,m=measure(sp,L);sweep=j//n+1;record=(j+1)%n==0 and sweep>s['burn']and(sweep-s['burn'])%s['every']==0
  fields=dict(attempt=j+1,sweep=sweep,index=i,siteU=ui,acceptU=ua,before=before,neighbourSum=delta0/(2*before),delta0=delta0,delta=delta,probability=probability,accepted=accept,E0=e,M=m,energy=e-s['field']*m,record=record,state=seed)
  ck(set(row)==set(fields),'proposal fields')
  for key,val in fields.items():
   if key in ['delta','probability','energy']:close(row[key],val,'proposal '+key)
   else:ck(row[key]==val,('proposal replay',j,key))
  if record:obs.append(dict(i=len(obs)+1,sweep=sweep,attempt=j+1,E0=e,M=m,energy=(e-s['field']*m)/n,signed=m/n,abs=abs(m/n)))
 ck(len(v['observations'])==len(obs)==s['N'],'actual record count')
 for actual,wanted in zip(v['observations'],obs):
  ck(set(actual)==set(wanted),'record fields')
  for key,val in wanted.items():close(actual[key],val,'record '+key)
 ck(v['spins']==sp and v['lastState']==seed and v['calls']==calls and v['accepted']==accepted and v['attempted']==total,'final replay')
 close(v['acceptance'],accepted/total,'acceptance')
 for key in ['energy','signed','abs']:stats([r[key]for r in obs],v['stats'][key])
 if L<=4:exact(L,s['temperature'],s['field'],v['exact'])
 else:ck(v['exact']is None,'no fabricated large grid oracle')
for d in data['states']:
 s=d['config'];v=d['result'];mode=s['mode']
 if mode=='exact':exact(s['L'],s['temperature'],s['field'],v)
 elif mode=='sample':simulate(s,v)
 else:
  ts=[.5+4.5*i/40 for i in range(41)]
  if s['temperature']not in ts:ts.append(s['temperature'])
  ts.sort();ck(v['temperatures']==ts,'all temperature nodes')
  maybe(v['critical'],2/math.log(1+math.sqrt(2))if s['field']==0 else None,'critical marker conditions')
  ck(len(v['rows'])==2*len(ts),'finite grid count')
  for row,(L,T)in zip(v['rows'],[(L,T)for L in [3,4]for T in ts]):
   ck(row['L']==L and row['T']==T,'finite row');exact(L,T,s['field'],row)
 # Independently map the declared observables onto every graph coordinate.
 ck(len(d['plots'])==len(d['svgs'])==(6 if mode=='sample'else 4),'plot count')
 for pi,(q,source) in enumerate(zip(d['plots'],d['svgs'])):
  root=ET.fromstring(source);ns={'s':'http://www.w3.org/2000/svg'}
  ck(root.find('s:title',ns).text==q['title'],'accessible title')
  left,width=(325,250)if q['square']else(100,750)
  xf=lambda x:left+width*(x-q['xmin'])/(q['xmax']-q['xmin'])
  yf=lambda y:335-250*(y-q['ymin'])/(q['ymax']-q['ymin'])
  if q['square']:close(q['xmax']-q['xmin'],q['ymax']-q['ymin'],'equal grid units')
  if mode=='exact':
   wanted=[{'energy-mass':[[x['e'],x['probability']]for x in v['energyMass']]},
    {'mag-mass':[[x['m'],x['probability']]for x in v['magnetizationMass']]},
    {'cv-bucket':[[i,x['cvContribution']]for i,x in enumerate(v['rows'])]},
    {'dos':[[x['E0'],math.log2(x['count'])]for x in v['degeneracy']]}][pi]
  elif mode=='finite':
   field=['cv','chi','abs','binder'][pi];wanted={'L'+str(L):[[x['T'],x[field]]for x in v['rows']if x['L']==L]for L in [3,4]}
  else:
   st=v['stats'][s['observable']];obs=v['observations'];key=s['observable']
   if pi==0:wanted={'trajectory':[[x['sweep'],x[key]]for x in obs]}
   elif pi==1:
    wanted={'mean':[[x['sweep'],math.fsum(y[key]for y in obs[:i+1])/(i+1)]for i,x in enumerate(obs)]}
    if v['exact']:wanted['target']=[[x['sweep'],v['exact'][key]]for x in obs]
   elif pi==2:wanted={'acf':[[x['lag'],x['rho']]for x in st['acf']if x['rho']is not None]}
   elif pi==3:wanted={'pair-raw':[[x['pair'],x['raw']]for x in st['pairs']],'pair-used':[[x['pair'],x['monotone']]for x in st['pairs']]}
   elif pi==4:wanted={'batch':[[math.log2(x['B']),x['se']]for x in st['blocks']]}
   else:wanted={'spin'+('plus'if spin==1 else'minus'):[[i%s['L']-(s['L']-1)/2,(s['L']-1)/2-i//s['L']]for i,x in enumerate(v['spins'])if x==spin]for spin in [-1,1]}
  ck([r['key']for r in q['series']]==list(wanted),'semantic series set')
  for line in q['series']:
   points=wanted[line['key']];ck(len(line['points'])==len(points),'complete semantic graph')
   nodes=root.findall('.//s:circle[@data-series="'+line['key']+'"]',ns);ck(len(nodes)==len(points),'all markers')
   poly=root.find('.//s:polyline[@data-series="'+line['key']+'"]',ns);ck((poly is not None)==line['line'],'line policy')
   coords=[list(map(float,x.split(',')))for x in poly.get('points').split()]if poly is not None else None
   if coords is not None:ck(len(coords)==len(points),'polyline completeness')
   for i,((x,y),(ex,ey),node)in enumerate(zip(line['points'],points,nodes)):
    close(x,ex,'graph observable x');close(y,ey,'graph observable y')
    ck(q['xmin']<=x<=q['xmax']and q['ymin']<=y<=q['ymax'],'frame contains point')
    ck(node.get('data-index')==str(i),'point index');close(float(node.get('cx')),xf(x),'circle x');close(float(node.get('cy')),yf(y),'circle y')
    if coords is not None:close(coords[i][0],xf(x),'line x');close(coords[i][1],yf(y),'line y')
  markers=root.findall('.//s:line[@data-marker]',ns);expectedMarker=mode=='finite'and s['field']==0
  ck(len(markers)==len(q['markers'])==int(expectedMarker),'critical marker count')
  if expectedMarker:
   close(q['markers'][0]['x'],2/math.log(1+math.sqrt(2)),'known critical temperature')
   close(float(markers[0].get('x1')),xf(q['markers'][0]['x']),'critical pixel')
 tables={t['key']:t for t in d['ledgers']};ck(len(tables)==len(d['ledgers']),'unique ledgers')
 wanted={}
 exactValue=v if mode=='exact'else v['exact']if mode=='sample'else None
 if exactValue:
  for key,field,names in [('dos','rows','E0 M degeneracy energy weight probability energyContribution mContribution cvContribution chiContribution'),('energy-mass','energyMass','energy e probability'),('mag-mass','magnetizationMass','M m probability'),('degeneracy','degeneracy','E0 count log2')]:
   wanted[key]=[[x[k]for k in names.split()]for x in exactValue[field]]
 if mode=='exact':summary=[s['L'],s['temperature'],s['field'],v['totalStates'],v['count'],v['mass'],v['Emin'],v['Zscaled'],v['logZ'],v['energy'],v['signed'],v['abs'],v['m2'],v['m4'],v['cv'],v['chi'],v['binder']]
 elif mode=='finite':
  summary=[s['field'],len(v['temperatures']),2,v['critical']]
  wanted['temperatures']=[[x[k]for k in 'L T energy signed abs m2 m4 cv chi binder logZ'.split()]for x in v['rows']]
 else:
  st=v['stats'][s['observable']];ref=v['exact'][s['observable']]if v['exact']else None
  names={'energy':'能量/自旋 e','signed':'有符号磁化 m','abs':'绝对磁化 |m|'}
  labels={'constant-sample':'样本恒定：经验相关未定义','nonpositive-estimate':'渐近方差估计非正：不报告ESS','no-cutoff-found':'窗口内未找到截断：仅作诊断','window-estimate':'有限窗口估计：不是收敛证书'}
  summary=[s['L'],s['temperature'],s['field'],names[s['observable']],s['initial'],s['seed'],s['burn'],s['every'],s['N'],v['attempted'],v['accepted'],v['acceptance'],v['calls'],v['lastState'],st['mean'],ref,st['mean']-ref if ref is not None else None,st['variance'],st['naiveSE'],st['ipsRaw'],st['imsRaw'],st['ipsSE'],st['imsSE'],st['tau'],st['effective'],st['stop'],labels[st['status']]]
  mappings=[('initial',v['initialRows'],'i u spin state'),('steps',v['steps'],'attempt sweep index siteU acceptU before neighbourSum delta0 delta probability accepted E0 M energy record state'),('observations',v['observations'],'i sweep attempt E0 M energy signed abs'),('acf',st['acf'],'lag covariance rho'),('pairs',st['pairs'],'pair lag0 lag1 raw kept monotone used'),('blocks',st['blocks'],'B count mean variance se')]
  for key,vs,ks in mappings:wanted[key]=[[x[k]for k in ks.split()]for x in vs]
  wanted['observables']=[[names[key],x['mean'],x['gamma0'],x['variance'],x['naiveSE'],x['ipsSE'],x['imsSE'],x['tau'],x['effective'],labels[x['status']]]for key,x in v['stats'].items()]
  wanted['block-means']=[[x['B'],i+1,i*x['B']+1,(i+1)*x['B'],m]for x in st['blocks']for i,m in enumerate(x['means'])]
  wanted['spins']=[[i,i//s['L'],i%s['L'],spin]for i,spin in enumerate(v['spins'])]
 ck(set(tables)==set(wanted)|{'summary'},'complete ledger set')
 ck([r[1]for r in tables['summary']['rows']]==summary,'every summary quantity')
 for key,rows in wanted.items():ck(tables[key]['rows']==rows,'every ledger cell '+key)
 for t in tables.values():ck(all(len(r)==len(t['headers'])for r in t['rows']),'header columns')
for row in data['synthetic']:stats(row['xs'],row['stats'])
ck(data['formats']==['10','100','1000','20260910','4294967290','0'],'integer formatting regression')
ck(data['invalid']>=150,'invalid coverage')
if len(sys.argv)==1:
 from html.parser import HTMLParser
 src=(ROOT/'physics-course/lectures/comp-04-monte-carlo-lattice.md').read_text();site=(ROOT/'physics-course/site/comp-04-monte-carlo-lattice.html').read_text()
 formulas=[(a or b).strip()for a,b in re.findall(r'\$\$(.*?)\$\$|(?<!\\)\$(?!\$)(.*?)(?<!\\)\$(?!\$)',src,re.S)]
 actual=[html.unescape(a or b).strip()for a,b in re.findall(r'<(?:span|div) class="arithmatex">(?:\\\((.*?)\\\)|\\\[(.*?)\\\])</(?:span|div)>',site,re.S)]
 ck(formulas==actual,'all formulas preserved');ck(all('<'not in v for v in formulas),'math HTML ambiguity absent')
 ck(not re.search(r'<p>\s*<details|</details>\s*</p>',site),'balanced paragraphs')
 class Disclosure(HTMLParser):
  def __init__(self):super().__init__();self.stack=[];self.answers=0
  def handle_starttag(self,tag,attrs):
   if tag=='details':
    ck(not self.stack,'no nested disclosure');kind=dict(attrs).get('class');ck(kind in ['answer','page-toc'],'known disclosure');self.stack.append([kind,0]);self.answers+=kind=='answer'
   if tag=='summary':ck(bool(self.stack),'summary owned');self.stack[-1][1]+=1
  def handle_endtag(self,tag):
   if tag=='details':ck(bool(self.stack),'no orphan close');ck(self.stack.pop()[1]==1,'one summary')
 p=Disclosure();p.feed(re.search(r'<article[^>]*>(.*?)</article>',site,re.S).group(1));ck(p.answers==4 and not p.stack,'four answers')
 for link in re.findall(r'(?:href|src)="([^"]+)"',site):
  target=link.split('#')[0].split('?')[0]
  if target and not re.match(r'^[a-zA-Z]+:',target)and not target.startswith('/'):ck((ROOT/'physics-course/site'/target).exists(),('local target',target))
 for course in ['physics-course']:ck((ROOT/course/'site/assets/learning/labs/physics-lattice-monte-carlo.js').read_bytes()==JS.read_bytes(),'tracked mirror')
 ck((ROOT/'.github/workflows/course-audit.yml').read_text().count('python tools/check_lattice_full.py')==1,'CI invocation')
 image=ROOT/'physics-course/images/comp-04-lattice-ledgers.svg'
 ck(image.read_bytes()==(ROOT/'physics-course/site/assets/img/comp-04-lattice-ledgers.svg').read_bytes(),'SVG mirror')
 panels=ET.parse(image).getroot().findall('.//{http://www.w3.org/2000/svg}svg');ck(len(panels)==4,'four static panels')
 code="const a=require(process.argv[1]);console.log(JSON.stringify([a.plots(a.snapshot({mode:'exact'}))[1],a.plots(a.snapshot({}))[1],a.plots(a.snapshot({}))[2],a.plots(a.snapshot({mode:'finite'}))[0]].map(a.svg)))"
 expected=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve())],text=True))
 # Math transcendental results can differ by a few ulps across Node/CPU builds.
 # Compare every SVG node and attribute, allowing only sub-nanopixel geometry
 # differences. Text, labels, series identities and point counts remain exact.
 def compare_svg(a,b,path='svg'):
  ck(a.tag==b.tag and set(a.attrib)==set(b.attrib),('static structure',path))
  ck(a.text==b.text and a.tail==b.tail,('static text',path,a.text,b.text))
  for key,v in a.attrib.items():
   w=b.attrib[key]
   if key in {'x','y','x1','x2','y1','y2','cx','cy','r','width','height'}:
    close(float(v),float(w),('static coordinate',path,key),rtol=0,atol=1e-9)
   elif key in {'points','d'}:
    pattern=r'[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?'
    ck(re.sub(pattern,'#',v)==re.sub(pattern,'#',w),('static geometry syntax',path,key))
    av=re.findall(pattern,v);bv=re.findall(pattern,w)
    ck(len(av)==len(bv),('static geometry length',path,key))
    for j,(x,y) in enumerate(zip(av,bv)):
     close(float(x),float(y),('static geometry value',path,key,j),rtol=0,atol=1e-9)
   else:ck(v==w,('static attribute',path,key,v,w))
  ck(len(a)==len(b),('static child count',path))
  for j,(x,y) in enumerate(zip(a,b)):compare_svg(x,y,path+'/'+str(j))
 for i,(p,s) in enumerate(zip(panels,expected)):
  e=ET.fromstring(s);p.attrib.pop('x');p.attrib.pop('y')
  compare_svg(p,e,'panel'+str(i))
 # The comparator must accept an ulp-scale coordinate change and reject
 # substantive geometry, missing points, or an altered instructional label.
 original=ET.fromstring('<svg><text x="10">target</text><polyline points="1,2 3,4"/></svg>')
 tiny=ET.fromstring(ET.tostring(original));tiny[0].set('x','10.000000000000002');compare_svg(original,tiny)
 for mutation in ['coordinate','point','label','attribute','node']:
  changed=ET.fromstring(ET.tostring(original))
  if mutation=='coordinate':changed[0].set('x','10.000001')
  elif mutation=='point':changed[1].set('points','1,2')
  elif mutation=='label':changed[0].text='wrong target'
  elif mutation=='attribute':changed[1].set('stroke','red')
  else:changed.remove(changed[1])
  rejected=False
  try:compare_svg(original,changed)
  except AssertionError:rejected=True
  ck(rejected,('static comparator negative control',mutation))
 table=re.search(r'data-learning-lab="physics-lattice-monte-carlo".*?<tbody>(.*?)</tbody>',site,re.S).group(1)
 vals=[float(html.unescape(x))for x in re.findall(r'<tr>\s*<td>.*?</td>\s*<td[^>]*>(.*?)</td>\s*</tr>',table,re.S)]
 t=data['states'][0]['result'];e=t['exact'];st=t['stats']
 refs=[e['energy'],e['signed'],e['abs'],e['cv'],e['chi'],st['energy']['mean'],st['signed']['mean'],st['abs']['mean'],t['attempted'],t['accepted'],st['abs']['imsSE'],st['abs']['effective'],st['abs']['tau'],t['calls']]
 ck(len(vals)==len(refs)==14,'fallback complete')
 for v,w in zip(vals,refs):close(v,w,'fallback')
 print('formulas',len(formulas))
print(json.dumps(dict(status='PASS',checks=checks,states=len(data['states']),invalid=data['invalid'],synthetic=len(data['synthetic']),self=data['self'])))
