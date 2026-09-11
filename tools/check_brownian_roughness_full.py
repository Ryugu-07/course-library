from pathlib import Path
import json,subprocess,tempfile,shutil,sys
PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
STAGING='--staging'in sys.argv
ROOT=Path(__file__).resolve().parents[1]
JS=ROOT/('work/brownian161.js'if STAGING else'course-shared/labs/brownian-roughness.js')
FIXTURE=ROOT/('work/brownian-snapshot161.json'if STAGING else'course-shared/projects/brownian-roughness/run-snapshot.json')
NODE="const fs=require('fs'),assert=require('assert'),path=require('path'),A=require(path.resolve(process.argv[2])),states=A.PRESETS.map(p=>A.snapshot(p.values));\nfor(const method of ['levy','aggregate'])for(const seed of ['0','1','20260722'])for(const maxLevel of ['2','6','10'])states.push(A.snapshot({method,seed,maxLevel,level:String(+maxLevel+4),theta:seed==='0'?'-4':seed==='1'?'0':'4',delta:seed==='0'?'0.000000001':seed==='1'?'0.25':'0.01'}));\nconst bad=[null,[],0,'x',{extra:'1'},{method:'other'},{pathView:'x'},...['seed','maxLevel','level','delta','theta'].flatMap(k=>[NaN,1,null,[],{},true,'','NaN','Infinity','1e0',' 1','01','1.'].map(v=>({[k]:v}))),...['-1','4294967296','0.5'].map(seed=>({seed})),...['1','11','2.5'].map(maxLevel=>({maxLevel})),{maxLevel:'2',level:'7'},{level:'15'},{level:'-1'},{delta:'0'},{delta:'0.0000000001'},{delta:'0.251'},{theta:'4.1'},{theta:'-4.1'}];let invalid=0;for(const x of bad){assert.throws(()=>A.snapshot(x));invalid++;}\nlet mutationGuards=0;for(const method of ['levy','aggregate']){const params={method,maxLevel:'4',level:'8'},good=JSON.stringify(A.snapshot(params));for(const change of [s=>s.record.levels[4].path[0]=99,s=>s.record.coefficients[0].z=99,s=>s.record.normalDraws[0].word1=99,s=>s.record.covariance.rows[0].lcCovariance=99]){change(A.snapshot(params));assert.equal(JSON.stringify(A.snapshot(params)),good);mutationGuards++;}}\nfunction compare(a,b){if(typeof a==='number'&&typeof b==='number'){assert(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=3e-12*(1+Math.abs(b)));return;}if(a&&b&&typeof a==='object'&&typeof b==='object'){assert.deepEqual(Object.keys(a),Object.keys(b));for(const k of Object.keys(a))compare(a[k],b[k]);return;}assert.strictEqual(a,b);}\nlet frozen=0;if(process.argv[3]!=='-'){const f=JSON.parse(fs.readFileSync(process.argv[3]));for(const k of ['generated','frozen','midpoint','bridge']){const current=A.snapshot(f[k].parameters);compare(current,f[k]);states.push(f[k]);frozen++;}}\nconst live=states.length-frozen,views=states.map(s=>{const plots=A.plots(s);return{plots,svgs:plots.map(A.svg),tables:A.ledgers(s),formatted:A.ledgers(s).map(t=>t.rows.map(r=>r.map(A.fmt)))};});\nfs.writeFileSync(process.argv[4],JSON.stringify({states,views,live,frozen,invalid,mutationGuards,self:A.selfTest()}));\n"
with tempfile.TemporaryDirectory()as td:
 script=Path(td)/'export.cjs';out=Path(td)/'bundle.json';script.write_text(NODE)
 subprocess.run(PREFIX+['node',str(script),str(JS),str(FIXTURE),str(out)],check=True)
 bundle=json.loads(out.read_text())

"""Independent stdlib reference: direct Schauder sums, integer RNG, Fraction covariance."""
import math
from fractions import Fraction
checks=0
def ck(v,msg='assertion'):
 global checks
 checks+=1
 if not v:raise AssertionError(msg)
def close(a,b,msg='floating value'):
 if isinstance(a,(list,tuple)):
  ck(len(a)==len(b),msg+' length')
  for x,y in zip(a,b):close(x,y,msg)
 else:
  a,b=float(a),float(b);ck(math.isfinite(a)and math.isfinite(b)and abs(a-b)<=3e-12*(1+abs(b)),msg+': '+str((a,b)))
def normals(seed,n):
 state=seed;mask=2**32-1;out=[]
 def word():
  nonlocal state
  state=(state+0x6d2b79f5)&mask;t=((state^(state>>15))*(1|state))&mask;t=(((t+((t^(t>>7))*(61|t)&mask))&mask)^t)&mask
  return (t^(t>>14))&mask
 for i in range(n):
  a,b=word(),word();u,v=(a+.5)/2**32,(b+.5)/2**32;out.append((a,b,u,v,math.sqrt(-2*math.log(u))*math.cos(2*math.pi*v)))
 return out
def hat(m,k,t):return max(0,1-abs(2*(2**m*t-k)-1))
def smooth(t):
 def sn(x):return {0.:0.,.5:1.,1.:0.,1.5:-1.}.get(x%2,math.sin(math.pi*x))
 return .75*sn(2*t)+.25*sn(6*t)
def validate(s):
 c=s['parameters'];b=s['record'];M=int(c['maxLevel']);N=2**M;L=int(c['level']);ck(s['version']==161);ck(s['selectedLevel']==L);ck(s['selectedHatLayer']==min(M-1,max(0,L-1)));ck((b['method'],b['seed'],b['maxLevel'])==(c['method'],int(c['seed']),M));ns=normals(int(c['seed']),N);ck(len(b['normalDraws'])==N)
 for i,(ref,r)in enumerate(zip(ns,b['normalDraws'])):ck(r['index']==i and (r['word1'],r['word2'])==ref[:2]);close([r['u1'],r['u2'],r['z']],ref[2:])
 zs=[t[-1]for t in ns]
 if c['method']=='aggregate':
  fine=[0.]
  for z in zs:fine.append(fine[-1]+z/math.sqrt(N))
 else:fine=[math.fsum([zs[0]*j/N]+[zs[2**m+k]*2**(-(m+2)/2)*hat(m,k,j/N)for m in range(M)for k in [min(2**m-1,int(2**m*j/N))]])for j in range(N+1)]
 close(b['levels'][M]['path'],fine,'independent fine path');close(b['endpoint'],fine[-1]);ck(len(b['coefficients'])==N-1)
 for index,r in enumerate(b['coefficients']):
  m=int(math.log2(index+1));k=index-(2**m-1);ck((r['m'],r['k'])==(m,k));step=2**(M-m);left,right,mid=fine[k*step],fine[(k+1)*step],fine[k*step+step//2];mean=(left+right)/2;scale=math.sqrt(2**(-m)/4);close([r['left'],r['right'],r['midpoint'],r['mean'],r['scale'],r['amplitude'],r['z']],[left,right,mid,mean,scale,mid-mean,(mid-mean)/scale]);ck(r['normalIndex']==(2**m+k if c['method']=='levy'else None))
 close(b['reconstruction']['values'],fine);close(b['reconstruction']['residuals'],[x-y for x,y in zip(b['reconstruction']['values'],b['levels'][M]['path'])]);close(b['reconstruction']['maxAbsResidual'],max(map(abs,b['reconstruction']['residuals'])))
 ck(len(b['layers'])==M)
 for m,r in enumerate(b['layers']):
  cs=b['coefficients'][2**m-1:2**(m+1)-1];ck(r['m']==m and r['count']==2**m and r['coefficients']==list(range(2**m-1,2**(m+1)-1)));close([r['maxAbsNormal'],r['supAmplitude']],[max(abs(x['z'])for x in cs),max(abs(x['amplitude'])for x in cs)])
 ck(len(b['levels'])==M+5);prevV=-1
 for level,r in enumerate(b['levels']):
  n=2**level;ck(r['level']==level and r['count']==n and len(r['path'])==n+1)
  if level<=M:path=fine[::2**(M-level)];ck(r['path']==b['levels'][M]['path'][::2**(M-level)] and r['kind']=='brownian-grid' and r['frozenIdentity']is None)
  else:
   q=2**(level-M);path=[fine[j//q]if j%q==0 else ((q-j%q)*fine[j//q]+(j%q)*fine[j//q+1])/q for j in range(n+1)];ck(r['kind']=='frozen-polygon')
  control=[smooth(j/n)for j in range(n+1)];close(r['path'],path);close(r['smoothPath'],control)
  for name,ys in [('actual',r['path']),('control',control)]:
   z=r[name];inc=[y-x for x,y in zip(ys,ys[1:])];close(z['increments'],inc);qsum=0.;cumulative=[0.]
   for v in inc:qsum+=v*v;cumulative.append(qsum)
   close(z['cumulativeQ'],cumulative);close([z['totalVariation'],z['quadraticVariation'],z['maxIncrement']],[math.fsum(map(abs,inc)),math.fsum(v*v for v in inc),max(map(abs,inc))])
  ck(r['actual']['totalVariation']>=prevV-1e-10,'nested variation monotonicity');prevV=r['actual']['totalVariation'];scale=2**min(0,M-level);close([r['theory'][k]for k in ['expectedQ','varianceQ','expectedV','varianceV']],[scale,2**(1-min(level,M))*scale*scale,math.sqrt(2**(min(level,M)+1)/math.pi),1-2/math.pi]);ck(r['actual']['quadraticVariation']<=r['actual']['totalVariation']*r['actual']['maxIncrement']+1e-12)
  energy=math.fsum([b['endpoint']**2]+[t['z']**2 for t in b['coefficients']if t['m']<min(level,M)]);expectedQ=energy/2**min(level,M)*scale;close([r['parseval']['coefficientEnergy'],r['parseval']['expectedQ'],r['parseval']['residual']],[energy,expectedQ,r['actual']['quadraticVariation']-expectedQ]);close(expectedQ,r['actual']['quadraticVariation'])
  if level>M:
   z=r['frozenIdentity'];ref=b['levels'][M]['actual'];expected=[scale*ref['quadraticVariation'],ref['totalVariation'],scale*ref['maxIncrement']];actual=[r['actual']['quadraticVariation'],r['actual']['totalVariation'],r['actual']['maxIncrement']];close([z['qExpected'],z['vExpected'],z['maxExpected']],expected);close([z['qResidual'],z['vResidual'],z['maxResidual']],[a-e for a,e in zip(actual,expected)]);close(actual,expected)
 cv=b['covariance'];ck(cv['denominator']==4*N);ts=[Fraction(k,4*N)for k in cv['ticks']];close(cv['times'],ts);ck(len(cv['rows'])==len(ts)**2)
 def weights(t):
  if t==1:return[(N,Fraction(1))]
  k=int(t*N);u=t*N-k;return[(k,1-u),(k+1,u)]
 for pos,r in enumerate(cv['rows']):
  ck((r['i'],r['j'])==divmod(pos,len(ts)));a,z=ts[r['i']],ts[r['j']];cov=sum(w*v*Fraction(min(i,j),N)for i,w in weights(a)for j,v in weights(z));close([r['lcCovariance'],r['brownianCovariance'],r['missingBridgeCovariance'],r['interpolationCovariance'],r['residual']],[cov,min(a,z),min(a,z)-cov,cov,r['lcCovariance']-float(cov)])
 tail=s['tail'];delta=float(c['delta']);rr=1/math.sqrt(2);a=2*((M+2)*math.log(2)-math.log(delta));slope=4*math.log(2);bound=2**(-(M+2)/2)*math.sqrt(a/(1-rr)**2+slope*rr/(1-rr)**3);series=math.fsum(2**(-(M+j+2)/2)*math.sqrt(a+slope*j)for j in range(200));ck(bound>=series);close([tail['delta'],tail['ratio'],tail['a'],tail['slope'],tail['analyticUpperBoundApproximation'],tail['remainingProbabilityAfterRows']],[delta,rr,a,slope,bound,delta/2**16]);ck(tail['firstOmittedLayer']==M and len(tail['rows'])==16)
 for j,r in enumerate(tail['rows']):
  m=M+j;eps=delta*2**(-j-1);threshold=math.sqrt(2*math.log(2**(m+1)/eps));ck(r['m']==m);close([r['probabilityAllocation'],r['normalThreshold'],r['hatScale'],r['layerBound'],r['unionBound']],[eps,threshold,2**(-(m+2)/2),threshold*2**(-(m+2)/2),eps])
 theta=float(c['theta']);close(s['martingales']['theta'],theta);ck(len(s['martingales']['rows'])==N+1)
 for j,r in enumerate(s['martingales']['rows']):
  t=j/N;x=b['levels'][M]['path'][j];ck(r['j']==j);close([r['t'],r['B'],r['centeredSquare'],r['exponential']],[t,x,x*x-t,math.exp(theta*x-theta*theta*t/2)])
for state in bundle['states']:validate(state)

import xml.etree.ElementTree as ET
def viewcheck(s,view):
 b=s['record'];L=s['selectedLevel'];M=b['maxLevel'];selected=b['levels'][L];plots=view['plots'];ck([p['key']for p in plots]==[s['parameters']['pathView'],'q','v','max','cumulative-q','missing-bridge'])
 def pairs(ys):return[[j/(len(ys)-1),y]for j,y in enumerate(ys)]
 if s['parameters']['pathView']=='paths':expected=[pairs(selected['path']),pairs(selected['smoothPath']),pairs(b['levels'][M]['path'])]
 else:
  m=s['selectedHatLayer'];before=b['levels'][m]['path'];after=b['levels'][m+1]['path'];coarse=[before[j//2]if j%2==0 else (before[j//2]+before[j//2+1])/2 for j in range(len(after))];expected=[pairs(after),pairs(coarse),pairs([v-c for v,c in zip(after,coarse)])]
 close([p['points']for p in plots[0]['series']],expected,'path view values')
 for index,(metric,mean)in enumerate([('quadraticVariation','expectedQ'),('totalVariation','expectedV'),('maxIncrement',None)],1):
  p=plots[index];expected=[[[t['level'],t[field][metric]]for t in b['levels']]for field in ['actual','control']]
  if mean:expected.append([[t['level'],t['theory'][mean]]for t in b['levels']])
  close([r['points']for r in p['series']],expected);ck(p['frozenAfter']==M and p['selected']==L)
 close([r['points']for r in plots[4]['series']],[pairs(selected['actual']['cumulativeQ']),pairs(selected['control']['cumulativeQ']),[[j/selected['count'],j/selected['count']*selected['theory']['expectedQ']]for j in range(selected['count']+1)]])
 cv=b['covariance'];n=2**M;a=(n//3)/n;fixed=a+1/(4*n);i=cv['times'].index(fixed);rows=[r for r in cv['rows']if r['i']==i and a<=cv['times'][r['j']]<=a+2/n];close([r['points']for r in plots[5]['series']],[[[cv['times'][r['j']],r['brownianCovariance']-r['lcCovariance']]for r in rows],[[cv['times'][r['j']],r['missingBridgeCovariance']]for r in rows]])
 for p,svgtext in zip(plots,view['svgs']):
  ck(p['width']==900 and p['height']==460);ck(p['xMin']<p['xMax']and p['yMin']<p['yMax']);root=ET.fromstring(svgtext);ns='{http://www.w3.org/2000/svg}';ck(root.find(ns+'title').text==p['title']and root.find(ns+'desc').text==p['caption']);lines={int(x.attrib['data-series']):x for x in root.findall(ns+'polyline')};ck(len(lines)==len(p['series']));ck(root.attrib['viewBox']=='0 0 900 460');ck(root.find('.//'+ns+'script')is None)
  for index,r in enumerate(p['series']):
   actual=[[float(v)for v in pair.split(',')]for pair in lines[index].attrib['points'].split()];ck(lines[index].attrib['stroke']==r['color']);ck(len(actual)==len(r['points']))
   for q,pixel in zip(r['points'],actual):
    ck(p['xMin']<=q[0]<=p['xMax']and p['yMin']<=q[1]<=p['yMax'],'all actual curves fit axes');close(pixel,[104+(q[0]-p['xMin'])/(p['xMax']-p['xMin'])*762,360-(q[1]-p['yMin'])/(p['yMax']-p['yMin'])*259]);ck(104-1e-8<=pixel[0]<=866+1e-8 and 101-1e-8<=pixel[1]<=360+1e-8)
 tables=view['tables'];ck([t['key']for t in tables]==['summary','levels','selected-grid','frozen','normals','hats','layers','reconstruction','covariance','tail','tail-summary','martingales']);expectedCounts=[18,M+5,2**L+1,4,n,n-1,M,n+1,len(cv['times'])**2,16,6,n+1]
 for t,count,formatted in zip(tables,expectedCounts,view['formatted']):
  ck(len(t['rows'])==count and len(formatted)==count,t['key']+' all rows');ck(all(len(row)==len(t['headers'])for row in t['rows']));ck(all(len(row)==len(t['headers'])and all(isinstance(v,str)for v in row)for row in formatted))
 by={t['key']:t['rows']for t in tables}
 for j,row in enumerate(by['selected-grid']):
  close(row[:4],[j,j/selected['count'],selected['path'][j],selected['smoothPath'][j]]);ck((row[4]is None and row[5]is None)if j==0 else row[4:6]==[selected['actual']['increments'][j-1],selected['control']['increments'][j-1]]);close(row[6:],[selected['actual']['cumulativeQ'][j],selected['control']['cumulativeQ'][j]])
 for row,r in zip(by['levels'],b['levels']):
  ck(row[0]==r['level'] and row[1]==('生成网格'if r['kind']=='brownian-grid'else'冻结折线细分'));close(row[2:],[r['count'],r['actual']['totalVariation'],r['actual']['quadraticVariation'],r['actual']['maxIncrement'],r['control']['totalVariation'],r['control']['quadraticVariation'],r['control']['maxIncrement'],r['theory']['expectedQ'],r['theory']['varianceQ'],r['theory']['expectedV'],r['theory']['varianceV'],r['parseval']['coefficientEnergy'],r['parseval']['expectedQ'],r['parseval']['residual']])
 for row,r in zip(by['normals'],b['normalDraws']):close(row,[r[k]for k in ['index','word1','word2','u1','u2','z']])
 for row,r in zip(by['hats'],b['coefficients']):close(row[:9],[r[k]for k in ['m','k','left','right','mean','scale','z','amplitude','midpoint']]);ck(row[9]==r['normalIndex'])
 for row,r in zip(by['layers'],b['layers']):close(row[:4],[r[k]for k in ['m','count','maxAbsNormal','supAmplitude']]);ck(row[4]==r['coefficients'])
 for j,row in enumerate(by['reconstruction']):close(row,[j,j/n,b['levels'][M]['path'][j],b['reconstruction']['values'][j],b['reconstruction']['residuals'][j]])
 for row,r in zip(by['covariance'],cv['rows']):close(row,[cv['times'][r['i']],cv['times'][r['j']],*[r[k]for k in ['lcCovariance','brownianCovariance','missingBridgeCovariance','interpolationCovariance','residual']]])
 for row,r in zip(by['tail'],s['tail']['rows']):close(row,[r[k]for k in ['m','probabilityAllocation','normalThreshold','hatScale','layerBound','unionBound']])
 for row,r in zip(by['martingales'],s['martingales']['rows']):close(row,[r[k]for k in ['j','t','B','centeredSquare','exponential']])
 for row,r in zip(by['frozen'],b['levels'][M+1:]):close(row,[r['level'],*[r['frozenIdentity'][k]for k in ['qExpected','qResidual','vExpected','vResidual','maxExpected','maxResidual']]])
 # Human summaries must retain actual metrics and both probabilistic boundaries.
 close([by['summary'][i][1]for i in [1,2,3,5,6,7,8,9,10,11,12,13,15]],[b['seed'],M,L,selected['count'],selected['actual']['totalVariation'],selected['actual']['quadraticVariation'],selected['actual']['maxIncrement'],selected['control']['totalVariation'],selected['control']['quadraticVariation'],selected['control']['maxIncrement'],s['tail']['analyticUpperBoundApproximation'],s['tail']['delta'],b['reconstruction']['maxAbsResidual']]);ck(by['summary'][14][1]==s['tail']['scope']);ck(by['tail-summary'][-1][1]==s['tail']['scope']);close([row[1]for row in by['tail-summary'][:5]],[s['tail'][k]for k in ['a','slope','ratio','remainingProbabilityAfterRows','analyticUpperBoundApproximation']])
for state,view in zip(bundle['states'],bundle['views']):viewcheck(state,view)

import re,html,hashlib
from html.parser import HTMLParser
f=json.loads(FIXTURE.read_text());ck(f['schema']==1);ck(f['provenance']=={'date':'2026-09-12','node':'v24.14.0','platform':'darwin','arch':'arm64','jsSha256':hashlib.sha256(JS.read_bytes()).hexdigest()});ck(bundle['frozen']==4)
if not STAGING:
 src=(ROOT/'grad-math/lectures/sc-01-brownian-rigorous.md').read_text();site=(ROOT/'grad-math/site/sc-01-brownian-rigorous.html').read_text()
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
 for course in ['ai-course','grad-math','math-course']:ck((ROOT/course/'site/assets/learning/labs/brownian-roughness.js').read_bytes()==JS.read_bytes())
 ck((ROOT/'grad-math/site/assets/learning/projects/brownian-roughness/run-snapshot.json').read_bytes()==FIXTURE.read_bytes());ck((ROOT/'.github/workflows/course-audit.yml').read_text().count('python tools/check_brownian_roughness_full.py')==1)
 image=ROOT/'grad-math/images/sc-01-brownian-ledgers.svg';ck(image.read_bytes()==(ROOT/'grad-math/site/assets/img/sc-01-brownian-ledgers.svg').read_bytes());root=ET.parse(image).getroot();ck(root.attrib['viewBox']=='0 0 1000 2300');panels=root.findall('.//{http://www.w3.org/2000/svg}svg');ck(len(panels)==4)
 def compare(a,b):
  ck(a.tag==b.tag and set(a.attrib)==set(b.attrib));ck(a.text==b.text and a.tail==b.tail)
  for k,v in a.attrib.items():
   if k in ['x','y','x1','y1','x2','y2','cx','cy','r','width','height']:close(float(v),float(b.attrib[k]))
   else:ck(v==b.attrib[k])
  ck(len(a)==len(b))
  for x,y in zip(a,b):compare(x,y)
 # Frozen bundle order: generated, frozen, midpoint, bridge.
 for i,(p,j,k)in enumerate(zip(panels,[-2,-4,-3,-1],[0,1,1,5])):
  ck(p.attrib.pop('x')=='50'and p.attrib.pop('y')==str([85,640,1195,1750][i]));compare(p,ET.fromstring(bundle['views'][j]['svgs'][k]))
 table=re.search(r'data-learning-lab="brownian-roughness".*?<tbody>(.*?)</tbody>',site,re.S).group(1);vals=[html.unescape(x).strip()for x in re.findall(r'<tr>\s*<td>.*?</td>\s*<td[^>]*>(.*?)</td>\s*</tr>',table,re.S)]
 g=f['generated']['record']['levels'][4];z=f['frozen']['record']['levels'][8];m=f['midpoint']['record']['coefficients'][0];t=f['bridge']['tail'];refs=[4,4,g['actual']['totalVariation'],g['actual']['quadraticVariation'],g['actual']['maxIncrement'],8,z['actual']['totalVariation'],z['actual']['quadraticVariation'],z['actual']['maxIncrement'],1/16,z['frozenIdentity']['qResidual'],m['m'],m['scale'],m['z'],m['amplitude'],m['midpoint'],t['delta'],t['analyticUpperBoundApproximation'],t['remainingProbabilityAfterRows'],f['generated']['record']['reconstruction']['maxAbsResidual']];ck(len(vals)==len(refs)==20)
 close([float(v)for v in vals],refs)
 for word in ['高斯','冻结','有限右导数','Borel–Cantelli','Cauchy–Schwarz','强Markov','支配收敛','不是当前有限样本的确定误差']:ck(word in (src if word!='不是当前有限样本的确定误差'else FIXTURE.read_text()))
 with tempfile.TemporaryDirectory()as td:
  out=Path(td)/'figure.svg';fallback=Path(td)/'fallback.md';subprocess.run(PREFIX+['python3',str(ROOT/'tools/build_brownian_roughness_figure.py'),str(JS),str(out),str(FIXTURE),str(fallback)],check=True,stdout=subprocess.DEVNULL);compare(ET.parse(image).getroot(),ET.parse(out).getroot());ck(fallback.read_text()in src)
 print('formulas='+str(len(formulas)))
print(json.dumps({'status':'PASS','live':bundle['live'],'frozen':bundle['frozen'],'checks':checks,'invalid':bundle['invalid'],'mutationGuards':bundle['mutationGuards'],'self':bundle['self']['checks']}))
