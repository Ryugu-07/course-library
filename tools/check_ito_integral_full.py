from pathlib import Path
import json,subprocess,tempfile,shutil,sys
PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
STAGING='--staging'in sys.argv
ROOT=Path(__file__).resolve().parents[1]
JS=ROOT/('work/ito162.js'if STAGING else'course-shared/labs/ito-integral-ledger.js')
FIXTURE=ROOT/('work/ito-snapshot162.json'if STAGING else'course-shared/projects/ito-integral-ledger/run-snapshot.json')
NODE="const fs=require('fs'),assert=require('assert'),path=require('path'),A=require(path.resolve(process.argv[2])),states=A.PRESETS.map(p=>A.snapshot(p.values));\nfor(const integrand of ['brownian','constant','time','sign'])for(let m=2;m<=9;m++)for(const level of ['0',String(m)])states.push(A.snapshot({integrand,maxLevel:String(m),level,paths:'3',pathIndex:'2',seed:m%2?'0':'4294967295',T:m%2?'0.125':'4'}));\nconst bad=[null,[],0,'x',{extra:'1'},{integrand:'unknown'},...['seed','maxLevel','level','paths','pathIndex','T'].flatMap(k=>[NaN,1,null,[],{},true,'','NaN','Infinity','1e0',' 1','01','1.'].map(v=>({[k]:v}))),{seed:'-1'},{seed:'4294967296'},{seed:'1.5'},{maxLevel:'1'},{maxLevel:'10'},{maxLevel:'2',level:'3'},{level:'-1'},{level:'8'},{paths:'0'},{paths:'129'},{paths:'3',pathIndex:'4'},{pathIndex:'0'},{T:'-1'},{T:'4.1'}];let invalid=0;for(const x of bad){assert.throws(()=>A.snapshot(x));invalid++;}\nlet mutationGuards=0;const params={maxLevel:'3',level:'2',paths:'3'},good=JSON.stringify(A.snapshot(params));for(const change of [s=>s.paths[0].normalDraws[0][0]=99,s=>s.paths[0].unitValues[0]=99,s=>s.paths[0].values[0]=99,s=>s.selectedPath.steps[0].left=99,s=>s.selectedEnsemble.statistics.paired.mean=99,s=>s.ensembleLevels[0].samples[0].left=99]){change(A.snapshot(params));assert.equal(JSON.stringify(A.snapshot(params)),good);mutationGuards++;}\nlet coupling=0;const low=A.snapshot({maxLevel:'2',level:'2',paths:'3'}),high=A.snapshot({maxLevel:'9',level:'9',paths:'5'});for(let i=0;i<3;i++){assert.deepEqual(low.paths[i].unitValues,high.paths[i].unitValues.filter((_,j)=>j%128===0));coupling++;assert.deepEqual(low.paths[i].normalDraws,high.paths[i].normalDraws.slice(0,4));coupling++;}const same=A.snapshot({maxLevel:'9',level:'0',paths:'3'});assert.deepEqual(same.paths,high.paths.slice(0,3));coupling++;\nfunction compare(a,b){if(typeof a==='number'&&typeof b==='number'){assert(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=4e-12*(1+Math.abs(b)));return;}if(a&&b&&typeof a==='object'&&typeof b==='object'){assert.deepEqual(Object.keys(a),Object.keys(b));for(const k of Object.keys(a))compare(a[k],b[k]);return;}assert.strictEqual(a,b);}\nlet frozen=0;if(process.argv[3]!=='-'){const f=JSON.parse(fs.readFileSync(process.argv[3]));for(const k of ['coarse','brownian','single','sign']){compare(A.snapshot(f[k].parameters),f[k]);states.push(f[k]);frozen++;}}\nconst live=states.length-frozen,views=states.map(s=>{const plots=A.plots(s),tables=A.ledgers(s);return{plots,svgs:plots.map(A.svg),tables,formatted:tables.map(t=>t.rows.map(r=>r.map(A.fmt)))};});fs.writeFileSync(process.argv[4],JSON.stringify({states,views,live,frozen,invalid,mutationGuards,coupling,self:A.selfTest()}));\n"
with tempfile.TemporaryDirectory()as td:
 script=Path(td)/'export.cjs';out=Path(td)/'bundle.json';script.write_text(NODE)
 subprocess.run(PREFIX+['node',str(script),str(JS),str(FIXTURE),str(out)],check=True)
 bundle=json.loads(out.read_text())

"""Stdlib independent replay: direct hat sums, integer PRNG, Gaussian matrix traces."""
import math
checks=0
def ck(v,msg='assertion'):
 global checks
 checks+=1
 if not v:raise AssertionError(msg)
def close(a,b,msg='numeric'):
 if isinstance(a,(list,tuple)):
  ck(len(a)==len(b),msg+' length')
  for x,y in zip(a,b):close(x,y,msg)
 else:
  a,b=float(a),float(b);ck(math.isfinite(a)and math.isfinite(b)and abs(a-b)<=4e-12*(1+abs(b)),msg+': '+str((a,b)))
def normals(seed,n):
 state=seed;mask=2**32-1;out=[]
 def word():
  nonlocal state
  state=(state+0x6d2b79f5)&mask;t=((state^(state>>15))*(1|state))&mask;t=(((t+((t^(t>>7))*(61|t)&mask))&mask)^t)&mask;return(t^(t>>14))&mask
 for _ in range(n):
  a,b=word(),word();out.append([a,b,math.sqrt(-2*math.log((a+.5)/2**32))*math.cos(2*math.pi*(b+.5)/2**32)])
 return out
def hvalue(kind,t,b):return 1 if kind=='constant'else t if kind=='time'else b if kind=='brownian'else 1 if b>=0 else-1
def summarize(ys,T,kind):
 n=len(ys)-1;dt=T/n;rows=[];terms={k:[]for k in ['left','right','trapezoid','energy','quadraticVariation','covariation']}
 for j,(bl,br)in enumerate(zip(ys,ys[1:])):
  tl=j*dt;tr=(j+1)*dt;delta=br-bl;hl=hvalue(kind,tl,bl);hr=hvalue(kind,tr,br);ha=(hl+hr)/2;values=[hl*delta,hr*delta,ha*delta,hl*hl*dt,delta*delta,(hr-hl)*delta];rows.append([tl,tr,bl,br,delta,hl,hr,ha,*values])
  for k,v in zip(terms,values):terms[k].append(v)
 totals={k:math.fsum(v)for k,v in terms.items()};return{'count':n,'dt':dt,'terminal':ys[-1],'totals':totals,'leftSquare':totals['left']**2,'pairedDifference':totals['left']**2-totals['energy']},rows,terms
matrixCache={}
def matrixTraces(n):
 if n in matrixCache:return matrixCache[n]
 # Integer matrices J-I, K0 and (J-I)^2; actual pairwise entries, before dt scaling.
 a2=0;a4=0;k2=0;a2k=0
 for i in range(n):
  for j in range(n):
   k=n-1-max(i,j);aa=n-2+int(i==j);a2+=int(i!=j);a4+=aa*aa;k2+=k*k;a2k+=aa*k
 result=(a2,a4,sum(n-1-i for i in range(n)),k2,a2k);matrixCache[n]=result;return result
def theoretical(kind,T,l):
 n=2**l;d=T/n
 if kind=='brownian':
  a2,a4,k,k2,a2k=matrixTraces(n);tr2=a2*d*d/4;tr4=a4*d**4/16;trk=k*d*d;trk2=k2*d**4;tra2k=a2k*d**4/4;v=2*tr2;continuous=T*T/2;vi=48*tr4+8*tr2*tr2;ve=2*trk2;cov=8*tra2k;cert=[0,tr2,tr4,trk,trk2,tra2k,d*(n-1)/2,-d/2,n-1]
 else:v=math.fsum((j*d)**2*d for j in range(n))if kind=='time'else T;continuous=T**3/3 if kind=='time'else T;vi=2*v*v;ve=0;cov=0;cert=None
 return v,continuous,vi,ve,cov,vi+ve-2*cov,cert
def checksummary(row,ref,kind):
 close([row[k]for k in ['count','dt','terminal','leftSquare','pairedDifference']],[ref[k]for k in ['count','dt','terminal','leftSquare','pairedDifference']]);close([row['totals'][k]for k in ref['totals']],list(ref['totals'].values()));z=row['totals'];close([row['identity']['rightMinusLeftResidual'],row['identity']['trapezoidAverageResidual']],[z['right']-z['left']-z['covariation'],z['trapezoid']-(z['left']+z['right'])/2]);close(list(row['identity'].values()),[0,0])
 if kind=='brownian':
  v=row['brownianIdentity'];expected=[(row['terminal']**2-z['quadraticVariation'])/2,(row['terminal']**2+z['quadraticVariation'])/2,row['terminal']**2/2];close([v[k]for k in ['leftExpected','rightExpected','trapezoidExpected']],expected);close([v[k]for k in ['leftResidual','rightResidual','trapezoidResidual']],[z[k]-e for k,e in zip(['left','right','trapezoid'],expected)]);close([z[k]for k in ['left','right','trapezoid']],expected)
 else:ck(row['brownianIdentity']is None)
def validate(s):
 c=s['parameters'];M=int(c['maxLevel']);L=int(c['level']);N=int(c['paths']);selected=int(c['pathIndex'])-1;T=float(c['T']);kind=c['integrand'];ck(s['version']==162);ck(len(s['paths'])==N);fine=[]
 for i,p in enumerate(s['paths']):
  seed=(int(c['seed'])+i*0x9e3779b9)%2**32;ck(p['index']==i+1 and p['pathSeed']==seed);ns=normals(seed,2**M);ck(len(p['normalDraws'])==len(ns));ck([r[:2]for r in p['normalDraws']]==[r[:2]for r in ns]);close([r[2]for r in p['normalDraws']],[r[2]for r in ns]);z=[r[2]for r in ns];n=2**M;ref=[]
  for j in range(n+1):
   t=j/n;terms=[z[0]*t]
   for m in range(M):
    k=min(2**m-1,int(t*2**m));hat=max(0,1-abs(2*(2**m*t-k)-1));terms.append(z[2**m+k]*2**(-(m+2)/2)*hat)
   ref.append(math.fsum(terms))
  close(p['unitValues'],ref);close(p['values'],[x*math.sqrt(T)for x in ref]);fine.append(p['values'])
 ck(len(s['selectedLevels'])==len(s['ensembleLevels'])==M+1)
 for l,ensemble in enumerate(s['ensembleLevels']):
  refs=[summarize(ys[::2**(M-l)],T,kind)for ys in fine];ck(ensemble['level']==l and len(ensemble['samples'])==N);target,continuous,vi,ve,cov,vd,cert=theoretical(kind,T,l);th=ensemble['theory'];close([th[k]for k in ['level','count','dt','meanLeft','expectedLeftSquare','expectedEnergy','continuousTarget','discretizationBias','expectedPairedDifference','varianceLeftSquare','varianceEnergy','covarianceLeftSquareEnergy','variancePairedDifference','expectedQ','varianceQ']],[l,2**l,T/2**l,0,target,target,continuous,target-continuous,0,vi,ve,cov,vd,T,2*T*T/2**l]);
  if cert is None:ck(th['brownianCertificate']is None)
  else:close([th['brownianCertificate'][k]for k in ['traceA','traceA2','traceA4','traceK','traceK2','traceA2K','eigenvalueA1','eigenvalueARest','eigenvalueARestMultiplicity']],cert)
  for i,(r,(ref,_,terms))in enumerate(zip(ensemble['samples'],refs)):
   ck(r['index']==i+1);close([r[k]for k in ['terminal','leftSquare','pairedDifference']],[ref[k]for k in ['terminal','leftSquare','pairedDifference']]);close([r[k]for k in ref['totals']],list(ref['totals'].values()));z={'count':ref['count'],'dt':ref['dt'],'terminal':r['terminal'],'totals':{k:r[k]for k in ref['totals']},'leftSquare':r['leftSquare'],'pairedDifference':r['pairedDifference'],'identity':r['identity'],'brownianIdentity':r['brownianIdentity']};checksummary(z,ref,kind)
  checksummary(s['selectedLevels'][l],refs[selected][0],kind)
  for name,field,poptarget,popvar in [('left','left',0,target),('leftSquare','leftSquare',target,vi),('energy','energy',target,ve),('paired','pairedDifference',0,vd),('q','quadraticVariation',T,2*T*T/2**l)]:
   st=ensemble['statistics'][name];xs=[r[field]for r in ensemble['samples']];mu=math.fsum(xs)/N;squares=math.fsum((x-mu)**2 for x in xs);close([st[k]for k in ['count','mean','target','gap','sumSquaredDeviations','modelStandardError']],[N,mu,poptarget,mu-poptarget,squares,math.sqrt(max(0,popvar)/N)])
   if N==1:ck(st['sampleVariance']is None and st['estimatedStandardError']is None)
   else:close([st['sampleVariance'],st['estimatedStandardError']],[squares/(N-1),math.sqrt(squares/(N*(N-1)))])
  if l==L:
   row=s['selectedPath'];ref,steps,terms=refs[selected];checksummary(row,ref,kind);ck(row['path']==s['paths'][selected]['values'][::2**(M-L)]);ck(len(row['steps'])==2**L)
   for j,step in enumerate(row['steps']):ck(step['j']==j);close([step[k]for k in ['tLeft','tRight','bLeft','bRight','delta','hLeft','hRight','hAverage','left','right','trapezoid','energy','q','covariation']],steps[j])
   for k,values in terms.items():
    acc=0.;cumulative=[0.]
    for v in values:acc+=v;cumulative.append(acc)
    close(row['cumulative'][k],cumulative)
 ck(s['selectedEnsemble']==s['ensembleLevels'][L])
for state in bundle['states']:validate(state)

import xml.etree.ElementTree as ET
def viewcheck(s,view):
 p=s['selectedPath'];ens=s['selectedEnsemble'];levels=s['ensembleLevels'];T=float(s['parameters']['T']);L=int(s['parameters']['level']);M=int(s['parameters']['maxLevel']);N=int(s['parameters']['paths']);selected=s['paths'][int(s['parameters']['pathIndex'])-1];plots=view['plots'];ck([q['key']for q in plots]==['path','integrand','integrals','isometry','paired','sampling','bias'])
 def pairs(ys):return[[T*j/(len(ys)-1),y]for j,y in enumerate(ys)]
 expected=[]
 expected.append([pairs(p['path']),pairs(selected['values'])])
 expected.append([[[t,y]for r in p['steps']for t,y in [(r['tLeft'],r['hLeft']),(r['tRight'],r['hLeft'])]]])
 expected.append([pairs(p['cumulative'][k])for k in ['left','right','trapezoid']])
 expected.append([[[t['level'],t['statistics'][key]['mean']]for t in levels]for key in ['leftSquare','energy']]+[[[t['level'],t['theory'][key]]for t in levels]for key in ['expectedEnergy','continuousTarget']])
 expected.append([[[t['index'],t['pairedDifference']]for t in ens['samples']],[[t['index'],0]for t in ens['samples']]])
 sampling=[[[t['level'],t['statistics']['paired']['mean']]for t in levels],[[t['level'],0]for t in levels]]
 if N>1:
  for sign in [1,-1]:sampling.append([[t['level'],t['statistics']['paired']['mean']+sign*t['statistics']['paired']['estimatedStandardError']]for t in levels])
 expected.append(sampling);expected.append([[[t['level'],t['statistics']['energy']['mean']-t['theory']['continuousTarget']]for t in levels],[[t['level'],t['statistics']['energy']['gap']]for t in levels],[[t['level'],t['theory']['discretizationBias']]for t in levels]])
 ck(len(view['svgs'])==7)
 for index,(plot,ref,svgtext)in enumerate(zip(plots,expected,view['svgs'])):
  close([r['points']for r in plot['series']],ref,'graph actual values');ck(plot['width']==900 and plot['height']==460);ck(plot['xMin']<plot['xMax']and plot['yMin']<plot['yMax']);ck(plot['xDegenerate']==(len(set(q[0]for line in ref for q in line))==1));
  if index in [3,5,6]:ck(plot['integerX']and plot['selected']==L)
  root=ET.fromstring(svgtext);ns='{http://www.w3.org/2000/svg}';ck(root.find(ns+'title').text==plot['title']and root.find(ns+'desc').text==plot['caption']);lines={int(x.attrib['data-series']):x for x in root.findall(ns+'polyline')};ck(len(lines)==len(plot['series']));ck(root.attrib['viewBox']=='0 0 900 460');ck(root.find('.//'+ns+'script')is None)
  for i,line in enumerate(plot['series']):
   xy=[[float(v)for v in z.split(',')]for z in lines[i].attrib['points'].split()];ck(len(xy)==len(line['points']));ck(lines[i].attrib['stroke']==line['color'])
   for q,actual in zip(line['points'],xy):
    ck(plot['xMin']<=q[0]<=plot['xMax']and plot['yMin']<=q[1]<=plot['yMax']);close(actual,[104+(q[0]-plot['xMin'])/(plot['xMax']-plot['xMin'])*762,360-(q[1]-plot['yMin'])/(plot['yMax']-plot['yMin'])*259]);ck(104-1e-8<=actual[0]<=866+1e-8 and 101-1e-8<=actual[1]<=360+1e-8)
 tables=view['tables'];ck([t['key']for t in tables]==['summary','selected-levels','steps','current-nodes','samples','statistics','variance-terms','ensemble-levels','all-samples','normals','fine-path','theory','quadratic-forms','brownian-identities']);counts=[20,M+1,2**L,2**L+1,N,5,N,M+1,N*(M+1),2**M,2**M+1,M+1,M+1 if s['parameters']['integrand']=='brownian'else 0,M+1 if s['parameters']['integrand']=='brownian'else 0]
 for t,count,formatted in zip(tables,counts,view['formatted']):ck(len(t['rows'])==count and len(formatted)==count,t['key']+' full rows');ck(all(len(row)==len(t['headers'])for row in t['rows']));ck(all(len(row)==len(t['headers'])and all(isinstance(v,str)for v in row)for row in formatted))
 by={t['key']:t['rows']for t in tables}
 for row,r in zip(by['steps'],p['steps']):close(row,[r[k]for k in ['j','tLeft','tRight','bLeft','bRight','delta','hLeft','hRight','hAverage','left','right','trapezoid','energy','q','covariation']])
 for j,row in enumerate(by['current-nodes']):close(row,[j,j*p['dt'],p['path'][j],*[p['cumulative'][k][j]for k in ['left','right','trapezoid','energy','quadraticVariation','covariation']]])
 for row,r in zip(by['samples'],ens['samples']):close(row,[r[k]for k in ['index','terminal','left','right','trapezoid','energy','quadraticVariation','leftSquare','pairedDifference']])
 for row,(_,r)in zip(by['statistics'],ens['statistics'].items()):
  close(row[1:7],[r[k]for k in ['count','mean','target','gap','sumSquaredDeviations']]+[r['sampleVariance']])if N>1 else close(row[1:6],[r[k]for k in ['count','mean','target','gap','sumSquaredDeviations']])
  if N==1:ck(row[6]is None and row[7]is None)
  else:close(row[7],r['estimatedStandardError'])
  close(row[8],r['modelStandardError']);ck(row[9]==r['scope'])
 for row,r in zip(by['variance-terms'],ens['samples']):
  mu=ens['statistics']['paired']['mean'];d=r['pairedDifference']-mu;close(row,[r['index'],r['pairedDifference'],mu,d,d*d])
 for row,r in zip(by['selected-levels'],s['selectedLevels']):close(row,[r['level'],r['count'],r['terminal'],*[r['totals'][k]for k in ['left','right','trapezoid','energy','quadraticVariation','covariation']],r['leftSquare'],r['pairedDifference'],r['identity']['rightMinusLeftResidual'],r['identity']['trapezoidAverageResidual']])
 for row,t in zip(by['ensemble-levels'],levels):
  expected=[t['level'],N,t['statistics']['leftSquare']['mean'],t['statistics']['energy']['mean'],t['statistics']['paired']['mean'],t['statistics']['paired']['estimatedStandardError'],t['statistics']['paired']['modelStandardError'],t['theory']['expectedEnergy'],t['theory']['continuousTarget'],t['theory']['discretizationBias'],t['statistics']['energy']['mean']-t['theory']['continuousTarget']]
  for a,b in zip(row,expected):ck(a is None)if b is None else close(a,b)
 for row,(level,r)in zip(by['all-samples'],[(t['level'],r)for t in levels for r in t['samples']]):close(row,[level,*[r[k]for k in ['index','left','right','trapezoid','energy','quadraticVariation','leftSquare','pairedDifference']]])
 for j,(row,r)in enumerate(zip(by['normals'],selected['normalDraws'])):close(row,[j,r[0],r[1],(r[0]+.5)/2**32,(r[1]+.5)/2**32,r[2]])
 for j,row in enumerate(by['fine-path']):close(row,[j,j/2**M,selected['unitValues'][j],T*j/2**M,selected['values'][j]])
 for row,t in zip(by['theory'],levels):close(row,[t['theory'][k]for k in ['level','count','dt','meanLeft','expectedLeftSquare','expectedEnergy','continuousTarget','discretizationBias','varianceLeftSquare','varianceEnergy','covarianceLeftSquareEnergy','variancePairedDifference','expectedQ','varianceQ']])
 if s['parameters']['integrand']=='brownian':
  for row,t in zip(by['quadratic-forms'],levels):close(row[:10],[t['level'],*[t['theory']['brownianCertificate'][k]for k in ['traceA','traceA2','traceA4','traceK','traceK2','traceA2K','eigenvalueA1','eigenvalueARest','eigenvalueARestMultiplicity']]]);ck(row[10]==t['theory']['brownianCertificate']['matrixConvention'])
  for row,t in zip(by['brownian-identities'],s['selectedLevels']):close(row,[t['level'],*[t['brownianIdentity'][k]for k in ['leftExpected','leftResidual','rightExpected','rightResidual','trapezoidExpected','trapezoidResidual']]])
 close([r[1]for r in by['summary'][1:17]],[T,M,L,N,selected['index'],int(s['parameters']['seed']),selected['pathSeed'],p['totals']['left'],p['totals']['right'],p['totals']['trapezoid'],p['totals']['energy'],p['totals']['quadraticVariation'],p['pairedDifference'],ens['theory']['expectedEnergy'],ens['theory']['continuousTarget'],ens['theory']['discretizationBias']]);ck([r[1]for r in by['summary'][17:]]==[s['coupling'],s['comparisonScope'],s['rngConvention']])
for state,view in zip(bundle['states'],bundle['views']):viewcheck(state,view)

import re,html,hashlib
from html.parser import HTMLParser
f=json.loads(FIXTURE.read_text());ck(f['schema']==1);ck(f['provenance']=={'date':'2026-09-12','node':'v24.14.0','platform':'darwin','arch':'arm64','jsSha256':hashlib.sha256(JS.read_bytes()).hexdigest()});ck(bundle['frozen']==4)
if not STAGING:
 src=(ROOT/'grad-math/lectures/sc-02-ito-integral.md').read_text();site=(ROOT/'grad-math/site/sc-02-ito-integral.html').read_text()
 formulas=[(a or b).strip()for a,b in re.findall(r'\$\$(.*?)\$\$|(?<!\\)\$(?!\$)(.*?)(?<!\\)\$(?!\$)',src,re.S)]
 actual=[html.unescape(a or b).strip()for a,b in re.findall(r'<(?:span|div) class="arithmatex">(?:\\\((.*?)\\\)|\\\[(.*?)\\\])</(?:span|div)>',site,re.S)]
 ck(formulas==actual,'source formulas reach HTML in order');ck(len(re.findall(r'^## [0-9]+\.',src,re.M))==12);ck(not re.search(r'<p>\s*<details|</details>\s*</p>',site))
 class Disclosure(HTMLParser):
  def __init__(self):super().__init__();self.stack=[];self.answers=0
  def handle_starttag(self,tag,attrs):
   if tag=='details':
    ck(not self.stack);kind=dict(attrs).get('class');ck(kind in ['answer','page-toc']);self.stack.append([kind,0]);self.answers+=kind=='answer'
   if tag=='summary':ck(bool(self.stack));self.stack[-1][1]+=1
  def handle_endtag(self,tag):
   if tag=='details':ck(bool(self.stack));ck(self.stack.pop()[1]==1)
 parser=Disclosure();parser.feed(re.search(r'<article[^>]*>(.*?)</article>',site,re.S).group(1));ck(parser.answers==4 and not parser.stack)
 for link in re.findall(r'(?:href|src)="([^"]+)"',site):
  target=link.split('#')[0].split('?')[0]
  if target and not re.match(r'^[a-zA-Z]+:',target)and not target.startswith('/'):ck((ROOT/'grad-math/site'/target).exists(),'local target '+target)
 for course in ['ai-course','grad-math','math-course']:ck((ROOT/course/'site/assets/learning/labs/ito-integral-ledger.js').read_bytes()==JS.read_bytes())
 ck((ROOT/'grad-math/site/assets/learning/projects/ito-integral-ledger/run-snapshot.json').read_bytes()==FIXTURE.read_bytes());ck((ROOT/'.github/workflows/course-audit.yml').read_text().count('python tools/check_ito_integral_full.py')==1)
 image=ROOT/'grad-math/images/sc-02-ito-ledgers.svg';ck(image.read_bytes()==(ROOT/'grad-math/site/assets/img/sc-02-ito-ledgers.svg').read_bytes());root=ET.parse(image).getroot();ck(root.attrib['viewBox']=='0 0 1000 2300');panels=root.findall('.//{http://www.w3.org/2000/svg}svg');ck(len(panels)==4)
 def compare(a,b):
  ck(a.tag==b.tag and set(a.attrib)==set(b.attrib));ck(a.text==b.text and a.tail==b.tail)
  for k,v in a.attrib.items():
   if k in ['x','y','x1','y1','x2','y2','cx','cy','r','width','height']:close(float(v),float(b.attrib[k]))
   else:ck(v==b.attrib[k])
  ck(len(a)==len(b))
  for x,y in zip(a,b):compare(x,y)
 # Frozen bundle order: coarse, brownian, single, sign.
 for i,(p,j,k)in enumerate(zip(panels,[-4,-3,-2,-1],[3,2,5,1])):
  ck(p.attrib.pop('x')=='50'and p.attrib.pop('y')==str([85,640,1195,1750][i]));compare(p,ET.fromstring(bundle['views'][j]['svgs'][k]))
 table=re.search(r'data-learning-lab="ito-integral-ledger".*?<tbody>(.*?)</tbody>',site,re.S).group(1);vals=[html.unescape(x).strip()for x in re.findall(r'<tr>\s*<td>.*?</td>\s*<td[^>]*>(.*?)</td>\s*</tr>',table,re.S)]
 c=f['coarse']['selectedEnsemble'];b=f['brownian']['selectedPath'];e=f['brownian']['selectedEnsemble'];single=f['single']['selectedEnsemble'];g=f['sign']['selectedPath']
 refs=[0,c['statistics']['leftSquare']['mean'],c['statistics']['energy']['mean'],c['theory']['expectedEnergy'],c['theory']['continuousTarget'],4,b['totals']['left'],b['totals']['right'],b['totals']['trapezoid'],b['totals']['quadraticVariation'],b['totals']['energy'],e['statistics']['paired']['mean'],e['statistics']['paired']['estimatedStandardError'],e['theory']['expectedEnergy'],1,None,g['totals']['energy'],f['sign']['selectedEnsemble']['theory']['expectedEnergy'],g['totals']['left'],b['brownianIdentity']['leftResidual']];ck(len(vals)==len(refs)==20)
 for v,r in zip(vals,refs):ck(v=='不适用')if r is None else close(float(v),r)
 for word in ['可预测','Dynkin','π–λ','Doob','Borel–Cantelli','极化','条件Jensen','成对差','高斯二次型','局部鞅','不适用']:ck(word in src,'proof and interpretation '+word)
 with tempfile.TemporaryDirectory()as td:
  out=Path(td)/'figure.svg';fallback=Path(td)/'fallback.md';subprocess.run(PREFIX+['python3',str(ROOT/'tools/build_ito_integral_figure.py'),str(JS),str(out),str(FIXTURE),str(fallback)],check=True,stdout=subprocess.DEVNULL);compare(ET.parse(image).getroot(),ET.parse(out).getroot());ck(fallback.read_text()in src)
 print('formulas='+str(len(formulas)))
print(json.dumps({'status':'PASS','live':bundle['live'],'frozen':bundle['frozen'],'checks':checks,'invalid':bundle['invalid'],'mutationGuards':bundle['mutationGuards'],'self':bundle['self']['checks'],'coupling':bundle['coupling']}))
