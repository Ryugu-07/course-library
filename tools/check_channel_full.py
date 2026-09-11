"""Full finite channel, random-code ensemble, plot and publication contract."""
from pathlib import Path
from fractions import Fraction as F
from math import comb,log2,isclose,isfinite,log
from itertools import product
import random,json,subprocess,shutil,sys,hashlib,re,html,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/channel-coding.js'
FIXTURE=JS.with_name('channel-snapshot150.json')if len(sys.argv)>1 else ROOT/'course-shared/projects/channel-coding/run-snapshot.json'
def independent_capacity(p):
 u=float(1-2*p)
 if abs(u)<.1:return sum(u**(2*k)/(2*k*(2*k-1)*log(2))for k in range(1,25))
 return 1-sum(-float(q)*(log2(q.numerator)-log2(q.denominator))for q in [p,1-p]if q)
configs=[{}, {'codebook':'0'}, {'codebook':'0,0'}, {'codebook':'00,11'}, {'codebook':'00,11','tie':'first'}, {'p':'0'}, {'p':'0.5'}, {'p':'1'}, {'p':'0.9'}, {'p':'0.9','decoder':'nearest'}, {'p':'0.5','tie':'first'}, {'decoder':'first'}, {'codebook':'00,01,10,11'}, {'codebook':'000,001,111'}, {'codebook':'0,0,1'}, {'p':'0.499999'}, {'p':'0.500001'}, {'p':'0.000001'}]
hamming=[]
for d1,d2,d3,d4 in product(range(2),repeat=4):hamming.append(''.join(map(str,[d1^d2^d4,d1^d3^d4,d1,d2^d3^d4,d2,d3,d4])))
configs += [{'codebook':','.join(hamming),'p':p}for p in ['0.1','0','0.5','1']]
configs += [dict(mode='packing',**c)for c in [{},{'n':500,'bits':200,'epsilon':'0.02'},{'p':'0'},{'p':'1'},{'p':'0.5','epsilon':'0'},{'n':3,'bits':0},{'n':1,'bits':512,'epsilon':'2'},{'n':512,'p':'0.000001','epsilon':'0.01'},{'n':100,'p':'0.9','epsilon':'0'},{'n':9,'epsilon':'0'},{'n':1,'p':'0.499999','bits':1},{'n':512,'p':'0.999999','epsilon':'2'}]]
configs += [dict(mode='ensemble',n=3,**c)for c in [{},{'p':'0'},{'p':'0.5'},{'p':'1'},{'p':'0.9'},{'inputProbability':'0'},{'inputProbability':'1'},{'inputProbability':'0.1'},{'inputProbability':'0.000001'}]]
configs += [{'mode':'ensemble','n':4},{'mode':'ensemble','n':1}]
random.seed(150)
for i in range(18):
 mode=['finite','packing','ensemble'][i%3];p=str(random.randint(0,100)/100)
 if mode=='finite':
  n=random.randint(1,7);M=random.randint(1,8);words=[f'{random.randrange(2**n):0{n}b}'for _ in range(M)];configs.append(dict(p=p,codebook=','.join(words),decoder=['ml','nearest','first'][i//3%3],tie=['uniform','first'][i//3%2]))
 elif mode=='packing':configs.append(dict(mode=mode,n=random.randint(1,120),bits=random.randint(0,120),p=p,epsilon=str(random.randint(0,25)/100)))
 else:configs.append(dict(mode=mode,n=random.randint(1,4),p=p,inputProbability=str(random.randint(0,100)/100)))

code=r"""const a=require(process.argv[1]),fs=require('fs'),c=JSON.parse(fs.readFileSync(0,'utf8')),f=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const decorate=d=>({...d,plots:a.plots(d),ledgers:a.ledgers(d),svgs:a.plots(d).map(a.svg)});
let invalid=0;const bad=v=>{let failed=false;try{a.snapshot(v);}catch(e){failed=true;}if(!failed)throw Error('Accepted invalid '+JSON.stringify(v));invalid++;};
const junk=[null,true,false,[],{},'', 'NaN','Infinity','0x1','1e-3','0.0000001','-0.1','1.2.3'];
for(const [base,keys]of [[{},['p','inspect']],[{mode:'packing'},['p','n','bits','epsilon']],[{mode:'ensemble',n:3},['p','n','inputProbability']]])for(const k of keys)for(const x of junk)bad({...base,[k]:x});
for(const v of [null,[],false,{mode:'unknown'},{p:1.1},{inspect:2},{decoder:'unknown'},{tie:'unknown'},{codebook:''},{codebook:0},{codebook:'0,11'},{codebook:'00,2'},{codebook:'0,,1'},{codebook:'0,'},{codebook:'00000000'},{codebook:Array(17).fill('0').join(',')},{mode:'packing',n:0},{mode:'packing',n:513},{mode:'packing',bits:513},{mode:'packing',epsilon:2.1},{mode:'ensemble',n:5},{mode:'ensemble',n:0},{mode:'ensemble',n:3,inputProbability:1.1}])bad(v);
const live=c.concat(a.PRESETS.map(p=>p.values)).map(a.snapshot),frozen=['even','tail','exercise','ensemble'].map(k=>f[k]);
console.log(JSON.stringify({states:live.concat(frozen).map(decorate),live:live.length,invalid,self:a.selfTest()}));"""
bundle=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve()),str(FIXTURE.resolve())],input=json.dumps(configs).encode()))
data=bundle['states']
checks=0
def ck(x,m):
 global checks;checks+=1
 assert x,m
def mf(q):return float(q)
def lg(q):return log2(q.numerator)-log2(q.denominator) if isinstance(q,F)else log2(q)
def ent(ps):return sum(-mf(q)*lg(q)for q in ps if q)
def close(x,y,m):ck(x is not None and isclose(x,float(y),rel_tol=4e-12,abs_tol=3e-12),f'{m}: {x}, {float(y)}')
def packed(z,q,m):
 ck(F(int(z['numerator']),int(z['denominator']))==q,m+' fraction')
 try:v=float(q)
 except OverflowError:v=float('inf')
 status='zero'if q==0 else'overflow'if not isfinite(v)else'underflow'if v==0 else'finite'
 ck(z['status']==status,m+' status')
 if status in ['underflow','overflow']:ck(z['value']is None,m+' absent float')
 else:close(z['value'],v,m+' approximation')
 if q>0:close(z['log2'],lg(q),m+' log')
 else:ck(z['log2']is None,m+' zero log')
def ham(a,b):return sum(x!=y for x,y in zip(a,b))
def like(n,k,p):return p**k*(1-p)**(n-k)
def rep(n,p):return F(1,2)if not n else sum(comb(n,k)*like(n,k,p)for k in range(n//2+1,n+1))+(F(comb(n,n//2),2)*like(n,n//2,p)if n%2==0 else 0)
for state in data:
 c,r=state['parameters'],state['result'];p=F(str(c['p']));n=c['n'];C=independent_capacity(p);packed(r['p'],p,'channel p')
 ck(isclose(r['capacity'],float(C),rel_tol=4e-12,abs_tol=1e-20),'stable capacity including near-half')
 if c['mode']=='finite':
  words=c['codewords'];M=len(words);prior=F(1,M);conf=[[F(0)]*M for _ in words];weight=[[F(0),F(0)]for _ in range(n+1)];HC=0.0
  ck(len(r['received'])==2**n,'all outputs')
  for index,z in enumerate(r['received']):
   y=f'{index:0{n}b}';dist=[ham(x,y)for x in words];ls=[like(n,k,p)for k in dist]
   winners=[0]if c['decoder']=='first'else[i for i in range(M)if (dist[i]==min(dist)if c['decoder']=='nearest'else ls[i]==max(ls))];chosen=winners[:1]if c['tie']=='first'else winners;decision=[F(1,len(chosen))if i in chosen else F(0)for i in range(M)]
   ck(z['word']==y and z['index']==index and z['distances']==dist and z['winners']==winners and z['chosen']==chosen,'output and decoder')
   for i in range(M):packed(z['likelihoods'][i],ls[i],'all likelihoods');packed(z['decisions'][i],decision[i],'decision probability')
   py=sum(ls)/M;packed(z['outputProbability'],py,'output probability');correct=F(0);error=F(0)
   for i in range(M):
    joint=ls[i]/M;err=joint*(1-decision[i]);correct+=joint*decision[i];error+=err;weight[dist[i]][0]+=joint;weight[dist[i]][1]+=err
    for j in range(M):conf[i][j]+=ls[i]*decision[j]
   packed(z['jointCorrect'],correct,'joint correct');packed(z['jointError'],error,'joint error')
   if py:
    post=[x/(M*py)for x in ls]
    for v,q in zip(z['posterior'],post):packed(v,q,'posterior')
    close(z['posteriorEntropy'],ent(post),'conditional local entropy');HC+=mf(py)*ent(post)
   else:ck(z['posterior']is None and z['posteriorEntropy']is None,'unreachable output')
  errors=[]
  for i in range(M):
   for j in range(M):packed(r['confusion'][i][j],conf[i][j],'confusion matrix')
   err=sum(conf[i][j]for j in range(M)if j!=i);errors.append(err);z=r['perMessage'][i];ck(z['message']==i and z['codeword']==words[i],'message label');packed(z['success'],conf[i][i],'message success');packed(z['error'],err,'message error');packed(z['total'],1,'conditional normalization')
  packed(r['averageError'],sum(errors)/M,'average error');packed(r['maximumError'],max(errors),'maximum error')
  for k,z in enumerate(r['byWeight']):ck(z['k']==k,'weight index');packed(z['mass'],weight[k][0],'weight mass');packed(z['error'],weight[k][1],'weight error');ck(weight[k][0]==comb(n,k)*like(n,k,p),'independent binomial noise')
  close(r['conditionalEntropy'],HC,'H message|output');close(r['mutualInformation'],lg(M)-HC,'mutual information');close(r['rate'],lg(M)/n,'finite rate')
  ck(r['distinct']==len(set(words))and r['pairDistances']==[[ham(x,y)for y in words]for x in words],'all pair distances')
  if M>1:
   ck(r['minDistance']==min(ham(x,y)for i,x in enumerate(words)for j,y in enumerate(words)if i!=j),'min distance');close(r['fanoUsingActualInformation'],(HC-1)/lg(M),'Fano actual');close(r['fanoUsingCapacity'],(lg(M)-n*C-1)/lg(M),'Fano capacity')
  else:ck(r['minDistance']is None and r['fanoUsingActualInformation']is None and r['fanoUsingCapacity']is None,'single message undefined Fano')
  if M>1 and M&(M-1)==0:
   k=(M-1).bit_length();ber=sum(conf[i][j]*F(ham(f'{i:0{k}b}',f'{j:0{k}b}'),M*k)for i in range(M)for j in range(M));packed(r['bitError'],ber,'bit versus block error')
  else:ck(r['bitError']is None,'no fixed binary labels')
  if r['repetitionReference']is not None:packed(r['repetitionReference'],rep(n,p if c['decoder']=='nearest'else min(p,1-p)),'repetition closed form')
 elif c['mode']=='packing':
  M=2**c['bits'];eps=F(str(c['epsilon']));H=ent([p,1-p]);t=f=F(0);count=0;maxratio=None
  ck(len(r['rows'])==n+1,'all packing types')
  for k,z in enumerate(r['rows']):
   countk=comb(n,k);l=like(n,k,p);tp=countk*l;fp=F(countk,2**n);ck(z['k']==k and int(z['count'])==countk,'type count')
   packed(z['singleLikelihood'],l,'single channel likelihood');packed(z['trueMass'],tp,'true pair mass');packed(z['falseMass'],fp,'independent pair mass')
   if l:
    info=-lg(l)/n;close(z['noiseInformation'],info,'noise info');close(z['jointInformation'],1+info,'joint info');close(z['informationDensity'],n*(1-info),'information density');close(z['difference'],info-H,'typical difference');close(z['margin'],mf(eps)-abs(info-H),'typical margin');ratio=F(1,2**n)/l;packed(z['independentToJointRatio'],ratio,'change of measure')
    ck(z['accepted']==(z['margin']>=0),'actual float selected set')
   else:ck(not z['accepted']and all(z[key]is None for key in ['noiseInformation','jointInformation','informationDensity','difference','margin','independentToJointRatio']),'impossible pair excluded')
   if z['accepted']:t+=tp;f+=fp;count+=countk;maxratio=ratio if maxratio is None else max(maxratio,ratio)
  tail=1-t;false=(M-1)*f;raw=tail+false
  for key,q in [('totalTrue',1),('totalFalse',1),('trueAccepted',t),('trueTail',tail),('falseAccepted',f),('falseTerm',false),('rawUnion',raw),('cappedUnion',min(1,raw)),('exactPackingUpper',t*maxratio if maxratio is not None else F(0))]:packed(r[key],F(q),'finite bound '+key)
  ck(int(r['acceptedDistanceStrings'])==count and int(r['M'])==M,'finite message and accepted counts')
  if maxratio is None:ck(r['maximumProbabilityRatio']is None,'empty accepted set')
  else:packed(r['maximumProbabilityRatio'],maxratio,'max ratio');ck(f<=t*maxratio,'exact packing certificate')
  for key,factor in [('generalExponentTerm',3),('uniformBscExponentTerm',1)]:
   z=r[key]
   if M==1:ck(z is None,'no false-codeword term');continue
   ref=n*(factor*mf(eps)-C)+lg(M-1);close(z['log2Value'],ref,'full untruncated exponent log')
   val=2.0**z['log2Value']if z['log2Value']<1024 else float('inf');status='overflow'if not isfinite(val)else'underflow'if val==0 else'finite';ck(z['status']==status,'exponent status')
   if status=='finite':close(z['value'],val,'exponent float')
   else:ck(z['value']is None,'out of range exponent')
 else:
  q=F(str(c['inputProbability']));words=[f'{i:0{n}b}'for i in range(2**n)];wp=[q**x.count('1')*(1-q)**x.count('0')for x in words];total=avg=collision=F(0);groups=[[0,F(0),F(0)]for _ in range(n+1)];support=[]
  ck(len(r['rows'])==2**(2*n),'all ordered codebooks')
  for index,z in enumerate(r['rows']):
   i,j=divmod(index,2**n);x0,x1=words[i],words[j];weight=wp[i]*wp[j];d=ham(x0,x1);err=F(0)
   ck(z['index']==index and z['first']==x0 and z['second']==x1 and z['distance']==d and z['collision']==(i==j),'ordered codebook labels')
   for y,row in zip(words,z['outputs']):
    l0=like(n,ham(x0,y),p);l1=like(n,ham(x1,y),p);term=min(l0,l1)/2;err+=term;ck(row['word']==y,'ensemble output');packed(row['likelihood0'],l0,'ensemble likelihood0');packed(row['likelihood1'],l1,'ensemble likelihood1');packed(row['jointError'],term,'ensemble decision error')
   ck(err==rep(d,min(p,1-p)),'independent distance formula');packed(z['probability'],weight,'codebook probability');packed(z['error'],err,'codebook error');packed(z['weightedError'],weight*err,'weighted error');total+=weight;avg+=weight*err;collision+=weight*(i==j);groups[d][0]+=1;groups[d][1]+=weight;groups[d][2]+=weight*err
   if weight:support.append(err)
  for key,value in [('total',total),('averageError',avg),('distanceAverage',avg),('collisionProbability',collision),('collisionFormula',(q*q+(1-q)**2)**n),('bestSupportedError',min(support)),('worstSupportedError',max(support))]:packed(r[key],value,'ensemble '+key)
  ck(r['supportCount']==len(support),'supported codebooks');mismatch=2*q*(1-q)
  for k,z in enumerate(r['byDistance']):
   ck(z['distance']==k and z['codebookCount']==groups[k][0],'distance multiplicity');packed(z['probability'],groups[k][1],'distance probability');packed(z['weightedError'],groups[k][2],'distance weighted error');packed(z['referenceError'],rep(k,min(p,1-p)),'distance repetition');packed(z['binomialProbability'],comb(n,k)*like(n,k,mismatch),'independent mismatch binomial')

print('science PASS',checks)
def vector(a,b,m):
 ck(len(a)==len(b),m+' length')
 for x,y in zip(a,b):close(x,y,m)
def pv(z):return F(int(z['numerator']),int(z['denominator']))
def pts(rows,x,y):return[[x(z),y(z)]for z in rows if y(z)is not None]
def expected_series(d):
 c,r=d['parameters'],d['result'];n=c['n']
 if c['mode']=='finite':
  i=c['inspect'];M=r['M']
  return[
   {'errors':[[z['message'],z['error']['value']]for z in r['perMessage']],'average':[[0,r['averageError']['value']],[M-1,r['averageError']['value']]],'maximum':[[0,r['maximumError']['value']],[M-1,r['maximumError']['value']]]},
   {'likelihood':[[z['index'],z['likelihoods'][i]['value']]for z in r['received']],'wrong':[[z['index'],float(pv(z['likelihoods'][i])*(1-pv(z['decisions'][i])))]for z in r['received']],'decision':[[z['index'],z['decisions'][i]['value']]for z in r['received']]},
   {'confusion':[[j,z['value']]for j,z in enumerate(r['confusion'][i])]},
   {'noise':[[z['k'],z['mass']['value']]for z in r['byWeight']],'error':[[z['k'],z['error']['value']]for z in r['byWeight']]}]
 if c['mode']=='packing':return[
  {'true':pts(r['rows'],lambda z:z['k'],lambda z:z['trueMass']['value']),'false':pts(r['rows'],lambda z:z['k'],lambda z:z['falseMass']['value']),'accepted':pts([z for z in r['rows']if z['accepted']],lambda z:z['k'],lambda z:z['trueMass']['value'])},
  {'information':pts(r['rows'],lambda z:z['k'],lambda z:z['noiseInformation']),'entropy':[[0,r['entropy']],[n,r['entropy']]],'lower':[[0,r['entropy']-r['epsilon']],[n,r['entropy']-r['epsilon']]],'upper':[[0,r['entropy']+r['epsilon']],[n,r['entropy']+r['epsilon']]]},
  {'logTrue':pts(r['rows'],lambda z:z['k'],lambda z:z['trueMass']['log2']),'logFalse':pts(r['rows'],lambda z:z['k'],lambda z:z['falseMass']['log2'])},
  {'terms':[[i,r[k]['value']]for i,k in enumerate(['trueTail','falseTerm','rawUnion','cappedUnion'])if r[k]['value']is not None]}]
 return[
  {'errors':[[z['index'],z['error']['value']]for z in r['rows']],'average':[[0,r['averageError']['value']],[len(r['rows'])-1,r['averageError']['value']]]},
  {'probability':[[z['index'],z['probability']['value']]for z in r['rows']],'weighted':[[z['index'],z['weightedError']['value']]for z in r['rows']]},
  {'distance':[[z['distance'],z['probability']['value']]for z in r['byDistance']],'binomial':[[z['distance'],z['binomialProbability']['value']]for z in r['byDistance']],'error':[[z['distance'],z['weightedError']['value']]for z in r['byDistance']]},
  {'reference':[[z['distance'],z['referenceError']['value']]for z in r['byDistance']]}]
def view_check(d):
 c,r=d['parameters'],d['result'];n=c['n'];expected=expected_series(d);ck(len(d['plots'])==4,'four charts')
 for i,(q,ref)in enumerate(zip(d['plots'],expected)):
  ck([s['key']for s in q['series']]==list(ref),'all named series')
  for s in q['series']:
   ck(len(s['points'])==len(ref[s['key']]),'all data points')
   for x,y in zip(s['points'],ref[s['key']]):vector(x,y,'coordinate from actual record')
   ck(s['line']==(s['key']not in ['accepted','terms']),'discrete connection policy')
  xmax=([r['M']-1,2**n-1,r['M']-1,n]if c['mode']=='finite'else[n,n,n,3]if c['mode']=='packing'else[len(r['rows'])-1,len(r['rows'])-1,n,n])[i]
  ck(q['xmin']==0 and q['xmax']==max(1,xmax),'full x domain');ck(q['xTicks']==list(dict.fromkeys(int(max(1,xmax)*j/4+.5)for j in range(5))),'discrete integer ticks')
  vals=[0]+[v[1]for s in q['series']for v in s['points']];lo=min(vals);hi=max(vals);pad=(hi-lo or 1)*.08;close(q['ymin'],lo-pad,'unclipped minimum');close(q['ymax'],hi+pad,'unclipped maximum');svg_check(d['svgs'][i],q)
 tabs={t['key']:t for t in d['ledgers']};ck(len(tabs)==len(d['ledgers']),'unique ledgers');excluded=['received','perMessage','confusion','pairDistances','byWeight','rows','byDistance']
 ck([z[1]for z in tabs['summary']['rows']]==[v for k,v in r.items()if k not in excluded],'complete summary')
 keys=['perMessage','received','byWeight']if c['mode']=='finite'else['rows']if c['mode']=='packing'else['rows','byDistance']
 for key in keys:ck(tabs[key]['rows']==[list(z.values())for z in r[key]],'all nested fields '+key)
 if c['mode']=='finite':
  for key in ['confusion','pairDistances']:ck(tabs[key]['rows']==[[i]+z for i,z in enumerate(r[key])],'complete matrix '+key)
 for t in tabs.values():ck(bool(t['title'])and all(len(z)==len(t['headers'])for z in t['rows']),'rectangular complete labeled table')

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
ck(bundle['invalid']==140 and bundle['self']['status']=='PASS'and bundle['self']['checks']==12,'invalid and self checks')
if len(sys.argv)==1:
 from html.parser import HTMLParser
 src=(ROOT/'grad-math/lectures/it2-02-channel.md').read_text();site=(ROOT/'grad-math/site/it2-02-channel.html').read_text()
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
 for course in ['ai-course','grad-math','math-course']:ck((ROOT/course/'site/assets/learning/labs/channel-coding.js').read_bytes()==JS.read_bytes(),'JS mirror')
 ck((ROOT/'grad-math/site/assets/learning/projects/channel-coding/run-snapshot.json').read_bytes()==FIXTURE.read_bytes(),'snapshot mirror')
 ck((ROOT/'.github/workflows/course-audit.yml').read_text().count('python tools/check_channel_full.py')==1,'CI invocation')
 image=ROOT/'grad-math/images/it2-02-channel-ledgers.svg';ck(image.read_bytes()==(ROOT/'grad-math/site/assets/img/it2-02-channel-ledgers.svg').read_bytes(),'static mirror')
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
 for panel,(run,index)in zip(panels,[(0,0),(1,0),(2,3),(3,3)]):
  svg_check(panel,frozen[run]['plots'][index]);panel.attrib.pop('x');panel.attrib.pop('y');compare_svg(panel,ET.fromstring(frozen[run]['svgs'][index]))
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
 table=re.search(r'data-learning-lab="channel-coding".*?<tbody>(.*?)</tbody>',site,re.S).group(1)
 vals=[float(html.unescape(x))for x in re.findall(r'<tr>\s*<td>.*?</td>\s*<td[^>]*>(.*?)</td>\s*</tr>',table,re.S)]
 e,t,x,g=[f[k]['result']for k in ['even','tail','exercise','ensemble']]
 refs=[e['perMessage'][0]['error']['value'],e['perMessage'][1]['error']['value'],e['averageError']['value'],e['maximumError']['value'],e['rate'],e['capacity'],t['trueTail']['value'],t['falseTerm']['value'],t['rawUnion']['value'],x['trueTail']['value'],x['falseAccepted']['value'],x['cappedUnion']['value'],float(F(362125,1000000)),g['averageError']['value'],g['collisionProbability']['value'],g['bestSupportedError']['value'],g['worstSupportedError']['value'],g['supportCount']]
 ck(len(vals)==len(refs)==18,'all 18 fallback values')
 for x,y in zip(vals,refs):close(x,y,'fixed numeric fallback')
 for word in ['平局','区间证书','并集上界不等于实际错误','run-snapshot.json','overflow-wrap:anywhere']:ck(word in site,'evidence boundary '+word)
 print('formulas',len(formulas))
print(json.dumps({'status':'PASS','liveStates':bundle['live'],'frozenStates':4,'checks':checks,'invalid':bundle['invalid'],'self':bundle['self']['checks']},ensure_ascii=False))
