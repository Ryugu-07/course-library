from pathlib import Path
import json,subprocess,tempfile,shutil,sys
PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
STAGING='--staging'in sys.argv
ROOT=Path(__file__).resolve().parents[1]
JS=ROOT/('work/sde163.js'if STAGING else'course-shared/labs/ito-quadratic-variation.js')
FIXTURE=ROOT/('work/sde-snapshot163.json'if STAGING else'course-shared/projects/ito-quadratic-variation/run-snapshot.json')
NODE="const fs=require('fs'),a=require(require('path').resolve(process.argv[2])),assert=require('assert'),states=a.PRESETS.map(p=>a.snapshot(p.values));\nfor(const fn of ['square','quartic'])for(const M of [2,3,6,10])for(const L of [0,Math.floor(M/2),M])for(const seed of ['0','31415926','4294967295'])states.push(a.snapshot({function:fn,maxLevel:String(M),level:String(L),seed,T:M===3?'0.125':M===6?'4':'1',mu:M===2?'-2':'0.3',sigma:L===0?'0':'2'}));\nlet invalid=0;const bads=[null,[],true,0,'',()=>{}, {extra:'1'}];for(const k of Object.keys(a.DEFAULTS))for(const v of [null,undefined,[],{},1,Infinity])bads.push({[k]:v});\nfor(const[k,vs]of Object.entries({function:['Square','x2',''],T:['','-1','4.1','01','1e0','NaN','Infinity','1 '.repeat(20)],seed:['-1','4294967296','01','1.0','1e0'],maxLevel:['1','11','2.5','02'],level:['-1','11','3.5','01'],mu:['-2.1','2.1','1e0','--1','+1'],sigma:['-1','2.1','1e0','+1']}))for(const v of vs)bads.push({[k]:v});bads.push({maxLevel:'2',level:'3'});for(const v of bads){assert.throws(()=>a.snapshot(v));invalid++;}\nconst original=JSON.stringify(a.snapshot());const d=a.snapshot();d.brownian[1]=123;d.random.unitValues[1]=123;d.random.normalDraws[0][2]=123;d.selected.chain.steps[0].first=123;d.selected.gbm.euler[1]=123;assert.equal(JSON.stringify(a.snapshot()),original);\nlet coupling=0;for(let M=2;M<10;M++){const x=a.snapshot({maxLevel:String(M),level:'2'}),y=a.snapshot({maxLevel:String(M+1),level:'2'});assert.deepEqual(x.brownian,y.brownian.filter((_,j)=>j%2===0));assert.deepEqual(x.selected,y.selected);coupling++;}\nfunction compare(a,b){if(typeof a==='number'&&typeof b==='number'){assert(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=4e-12*(1+Math.abs(b)));return;}if(a&&b&&typeof a==='object'&&typeof b==='object'){assert.deepEqual(Object.keys(a),Object.keys(b));for(const k of Object.keys(a))compare(a[k],b[k]);return;}assert.strictEqual(a,b);}\nlet frozen=0;if(process.argv[3]!=='-'){const f=JSON.parse(fs.readFileSync(process.argv[3]));for(const k of ['square','quartic','negative','zero']){compare(a.snapshot(f[k].parameters),f[k]);states.push(f[k]);frozen++;}}\nconst live=states.length-frozen,views=states.map(s=>{const plots=a.plots(s),tables=a.ledgers(s);return{plots,svgs:plots.map(a.svg),tables,formatted:tables.map(t=>t.rows.map(r=>r.map(a.fmt)))};});fs.writeFileSync(process.argv[4],JSON.stringify({states,views,live,frozen,invalid,mutationGuards:5,coupling,self:a.selfTest()}));\n"
with tempfile.TemporaryDirectory()as td:
 script=Path(td)/'export.cjs';out=Path(td)/'bundle.json';script.write_text(NODE)
 subprocess.run(PREFIX+['node',str(script),str(JS),str(FIXTURE),str(out)],check=True)
 bundle=json.loads(out.read_text())

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
  a,b=float(a),float(b);ck(math.isfinite(a)and math.isfinite(b)and abs(a-b)<=5e-12*(1+abs(b)),msg+str((a,b)))
def normals(seed,n):
 state=seed;mask=2**32-1;out=[]
 def word():
  nonlocal state
  state=(state+0x6d2b79f5)&mask;t=((state^(state>>15))*(1|state))&mask;t=(((t+((t^(t>>7))*(61|t)&mask))&mask)^t)&mask;return(t^(t>>14))&mask
 for _ in range(n):
  a,b=word(),word();out.append([a,b,math.sqrt(-2*math.log((a+.5)/2**32))*math.cos(2*math.pi*(b+.5)/2**32)])
 return out
def chain(row,path,T,kind):
 n=len(path)-1;h=T/n;power=2 if kind=='square'else 4;terms={k:[]for k in ['first','second','remainder','timeCorrection','q','absoluteCubic','totalVariation']};steps=[]
 for j,(x,y)in enumerate(zip(path,path[1:])):
  z=y-x
  # Binomial coefficients give every degree directly, including the exact remainder.
  expansion=[math.comb(power,k)*x**(power-k)*z**k for k in range(1,power+1)]
  vals=[expansion[0],expansion[1],math.fsum(expansion[2:]),math.comb(power,2)*x**(power-2)*h,z*z,abs(z)**3,abs(z)]
  for k,v in zip(terms,vals):terms[k].append(v)
  steps.append([j*h,(j+1)*h,x,y,z,x**power,y**power,*vals,y**power-x**power-math.fsum(expansion)])
 total={k:math.fsum(v)for k,v in terms.items()};endpoint=path[-1]**power-path[0]**power
 ck(row['count']==n);close([row[k]for k in ['dt','terminal','endpointDifference','identityResidual','timeResidual','weightedNoise','maxIncrement']],[h,path[-1],endpoint,endpoint-total['first']-total['second']-total['remainder'],endpoint-total['first']-total['timeCorrection'],total['second']-total['timeCorrection'],max(abs(y-x)for x,y in zip(path,path[1:]))]);ck(set(row['totals'])==set(total))
 for k,v in total.items():close(row['totals'][k],v,k)
 if 'steps'in row:
  close(row['path'],path);ck(len(row['steps'])==n)
  for j,(a,b)in enumerate(zip(row['steps'],steps)):
   ck(a['j']==j);close([a[k]for k in ['tLeft','tRight','x','next','delta','fLeft','fRight','first','second','remainder','timeCorrection','q','absoluteCubic','totalVariation','stepResidual']],b)
  for k,vs in terms.items():
   acc=0.;refs=[0.]
   for v in vs:acc+=v;refs.append(acc)
   close(row['cumulative'][k],refs)
def gbm(row,path,T,mu,sigma):
 n=len(path)-1;h=T/n;exact=[1.];naive=[1.];euler=[1.];steps=[];first=None
 for j,(x,y)in enumerate(zip(path,path[1:])):
  z=y-x;t=(j+1)*h;factor=1+mu*h+sigma*z;drift=mu*euler[-1]*h;noise=sigma*euler[-1]*z
  # Additive Euler equation is independent of production's multiplicative recurrence.
  nxt=math.fsum([euler[-1],drift,noise]);truth=math.exp((mu-sigma*sigma/2)*t+sigma*y);wrong=math.exp(mu*t+sigma*y)
  steps.append([j*h,t,z,factor,euler[-1],drift,noise,nxt,truth,wrong,nxt-truth]);exact.append(truth);naive.append(wrong);euler.append(nxt)
  if nxt<=0 and first is None:first=j+1
 ck(row['count']==n);close([row[k]for k in ['dt','exactTerminal','naiveTerminal','eulerTerminal','terminalError','maxGridError']],[h,exact[-1],naive[-1],euler[-1],euler[-1]-exact[-1],max(abs(a-b)for a,b in zip(exact,euler))]);ck(row['firstNonPositive']==first)
 a=1+mu*h;b=a*a+sigma*sigma*h;r=row['reference'];close([r[k]for k in ['exactMean','exactSecondMoment','eulerMean','eulerSecondMoment','oneStepMeanFactor','oneStepSecondMomentFactor']],[math.exp(mu*T),math.exp((2*mu+sigma*sigma)*T),a**n,b**n,a,b])
 if 'steps'in row:
  close(row['exact'],exact);close(row['naive'],naive);close(row['euler'],euler);ck(len(row['steps'])==n)
  for j,(a,b)in enumerate(zip(row['steps'],steps)):ck(a['j']==j);close([a[k]for k in ['tLeft','tRight','delta','factor','eulerLeft','drift','noise','eulerRight','exact','naive','error']],b)
def validate(s):
 c=s['parameters'];M=int(c['maxLevel']);L=int(c['level']);T=float(c['T']);mu=float(c['mu']);sigma=float(c['sigma']);seed=int(c['seed']);n=2**M;ck(s['version']==163);draws=normals(seed,n);ck(s['random']['pathSeed']==seed);close(s['random']['normalDraws'],draws)
 # Direct Schauder hat sum, not the midpoint insertion algorithm used by JS.
 unit=[]
 for j in range(n+1):
  t=j/n;pieces=[draws[0][2]*t]
  for m in range(M):
   u=t*2**m;k=min(int(u),2**m-1);hat=max(0.,1-abs(2*(u-k)-1));pieces.append(2**(-(m+2)/2)*hat*draws[2**m+k][2])
  unit.append(math.fsum(pieces))
 close(s['random']['unitValues'],unit);path=[math.sqrt(T)*x for x in unit];smooth=[.75*math.sin(2*math.pi*T*j/n)+.25*math.sin(6*math.pi*T*j/n)for j in range(n+1)];close(s['brownian'],path);close(s['smooth'],smooth);ck(len(s['levels'])==M+1)
 # Replay the exported actual nodes as well as checking their independent construction.
 for row in [*s['levels'],s['selected']]:
  l=row['level'];stride=2**(M-l);xs=s['brownian'][::stride];ys=s['smooth'][::stride];chain(row['chain'],xs,T,c['function']);chain(row['smooth'],ys,T,c['function']);gbm(row['gbm'],xs,T,mu,sigma);close([row['qReference']['mean'],row['qReference']['variance']],[T,2*T*T/2**l])
 ck(s['selected']['level']==L)
for state in bundle['states']:validate(state)

import xml.etree.ElementTree as ET
def viewcheck(s,v):
 p=s['selected']['chain'];g=s['selected']['gbm'];levels=s['levels'];T=float(s['parameters']['T']);L=int(s['parameters']['level']);M=int(s['parameters']['maxLevel']);power=2 if s['parameters']['function']=='square'else 4
 def pairs(ys):return[[T*j/(len(ys)-1),y]for j,y in enumerate(ys)]
 def lp(fn):return[[r['level'],fn(r)]for r in levels]
 refs=[[pairs(p['path']),pairs(s['brownian']),pairs(s['selected']['smooth']['path'])],[lp(lambda r:r['chain']['totals']['q']),lp(lambda r:r['smooth']['totals']['q']),lp(lambda r:T),lp(lambda r:0)],[pairs([x**power for x in p['path']]),*[pairs(p['cumulative'][k])for k in ['first','second','remainder']]],[lp(lambda r:r['chain']['timeResidual']),lp(lambda r:r['chain']['weightedNoise']),lp(lambda r:r['chain']['totals']['remainder'])],[pairs(g[k])for k in ['exact','euler','naive']],[lp(lambda r:abs(r['gbm']['terminalError'])),lp(lambda r:r['gbm']['maxGridError']),lp(lambda r:0)],[lp(lambda r:r['gbm']['reference']['eulerMean']/r['gbm']['reference']['exactMean']),lp(lambda r:r['gbm']['reference']['eulerSecondMoment']/r['gbm']['reference']['exactSecondMoment']),lp(lambda r:1)]]
 ck([r['key']for r in v['plots']]==['path','qv','taylor','remainders','gbm','errors','moments']);ck(len(v['svgs'])==7)
 for i,(plot,ref,raw)in enumerate(zip(v['plots'],refs,v['svgs'])):
  close([r['points']for r in plot['series']],ref);ck(plot['width']==900 and plot['height']==460);ck(plot['xMin']<plot['xMax']and plot['yMin']<plot['yMax']);ck(plot['xDegenerate']==(len({q[0]for line in ref for q in line})==1))
  if i in [1,3,5,6]:ck(plot['integerX']and plot['selected']==L)
  ns='{http://www.w3.org/2000/svg}';root=ET.fromstring(raw);ck(root.attrib['viewBox']=='0 0 900 460');ck(root.find(ns+'title').text==plot['title']);ck(root.find(ns+'desc').text==plot['caption']);lines={int(e.attrib['data-series']):e for e in root.findall(ns+'polyline')};ck(len(lines)==len(ref))
  for j,line in enumerate(plot['series']):
   xy=[[float(x)for x in q.split(',')]for q in lines[j].attrib['points'].split()];ck(len(xy)==len(line['points']));ck(lines[j].attrib['stroke']==line['color'])
   for point,actual in zip(line['points'],xy):
    x,y=point;ck(plot['xMin']<=x<=plot['xMax']and plot['yMin']<=y<=plot['yMax']);close(actual,[104+(x-plot['xMin'])/(plot['xMax']-plot['xMin'])*762,360-(y-plot['yMin'])/(plot['yMax']-plot['yMin'])*259])
 tables=v['tables'];ck([r['key']for r in tables]==['summary','steps','nodes','levels','smooth-steps','smooth-levels','gbm-steps','gbm-levels','normals','fine']);counts=[17,2**L,2**L+1,M+1,2**L,M+1,2**L,M+1,2**M,2**M+1]
 for table,count in zip(tables,counts):ck(len(table['rows'])==count);ck(all(len(r)==len(table['headers'])for r in table['rows']))
 by={t['key']:t['rows']for t in tables}
 for row,r in zip(by['steps'],p['steps']):close(row,[r[k]for k in ['j','tLeft','tRight','x','next','delta','fLeft','fRight','first','second','remainder','timeCorrection','q','absoluteCubic','totalVariation','stepResidual']])
 for j,row in enumerate(by['nodes']):close(row,[j,j*p['dt'],p['path'][j],p['path'][j]**power,*[p['cumulative'][k][j]for k in ['first','second','remainder','timeCorrection','q']]])
 for row,r in zip(by['levels'],levels):
  a=r['chain'];t=a['totals'];close(row,[r['level'],a['count'],a['dt'],a['terminal'],a['endpointDifference'],*[t[k]for k in ['first','second','remainder','timeCorrection','q']],a['weightedNoise'],a['timeResidual'],a['identityResidual'],a['maxIncrement'],t['absoluteCubic'],t['totalVariation'],r['qReference']['mean'],r['qReference']['variance']])
 for row,r in zip(by['smooth-steps'],s['selected']['smooth']['steps']):close(row,[r[k]for k in ['j','tLeft','tRight','x','next','delta','first','second','remainder','q','stepResidual']])
 for row,r in zip(by['smooth-levels'],levels):
  a=r['smooth'];t=a['totals'];close(row,[r['level'],a['count'],a['endpointDifference'],*[t[k]for k in ['first','second','remainder','q']],a['identityResidual'],t['totalVariation'],a['maxIncrement']])
 for row,r in zip(by['gbm-steps'],g['steps']):close(row,[r[k]for k in ['j','tLeft','tRight','delta','factor','eulerLeft','drift','noise','eulerRight','exact','naive','error']])
 for row,r in zip(by['gbm-levels'],levels):
  a=r['gbm'];b=a['reference'];expected=[r['level'],a['count'],a['dt'],a['exactTerminal'],a['eulerTerminal'],a['naiveTerminal'],a['terminalError'],a['maxGridError'],a['firstNonPositive'],*[b[k]for k in ['eulerMean','exactMean','eulerSecondMoment','exactSecondMoment','oneStepMeanFactor','oneStepSecondMomentFactor']]]
  for x,y in zip(row,expected):ck(x is None)if y is None else close(x,y)
 for j,(row,r)in enumerate(zip(by['normals'],s['random']['normalDraws'])):close(row,[j,r[0],r[1],(r[0]+.5)/2**32,(r[1]+.5)/2**32,r[2]])
 for j,row in enumerate(by['fine']):close(row,[j,j/2**M,s['random']['unitValues'][j],T*j/2**M,s['brownian'][j],s['smooth'][j]])
 summary=by['summary'];ck(summary[0][1]==('x²'if power==2 else'x⁴'));close([r[1]for r in summary[1:15]],[T,M,L,int(s['parameters']['seed']),float(s['parameters']['mu']),float(s['parameters']['sigma']),*[p['totals'][k]for k in ['q','first','second','remainder']],p['identityResidual'],p['timeResidual'],g['exactTerminal'],g['eulerTerminal']]);ck(summary[15][1]==g['firstNonPositive']);ck(summary[16][1]==s['scope'])
for state,view in zip(bundle['states'],bundle['views']):viewcheck(state,view)

import re,html,hashlib
from html.parser import HTMLParser
f=json.loads(FIXTURE.read_text());ck(f['schema']==1);ck(f['provenance']=={'date':'2026-09-12','node':'v24.14.0','platform':'darwin','arch':'arm64','jsSha256':hashlib.sha256(JS.read_bytes()).hexdigest()});ck(bundle['frozen']==4)
if not STAGING:
 src=(ROOT/'grad-math/lectures/sc-03-ito-formula-sde.md').read_text();site=(ROOT/'grad-math/site/sc-03-ito-formula-sde.html').read_text()
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
 for course in ['ai-course','grad-math','math-course']:ck((ROOT/course/'site/assets/learning/labs/ito-quadratic-variation.js').read_bytes()==JS.read_bytes())
 ck((ROOT/'grad-math/site/assets/learning/projects/ito-quadratic-variation/run-snapshot.json').read_bytes()==FIXTURE.read_bytes());ck((ROOT/'.github/workflows/course-audit.yml').read_text().count('python tools/check_ito_formula_sde_full.py')==1)
 image=ROOT/'grad-math/images/sc-03-ito-sde-ledgers.svg';ck(image.read_bytes()==(ROOT/'grad-math/site/assets/img/sc-03-ito-sde-ledgers.svg').read_bytes());root=ET.parse(image).getroot();ck(root.attrib['viewBox']=='0 0 1000 2300');panels=root.findall('.//{http://www.w3.org/2000/svg}svg');ck(len(panels)==4)
 def compare(a,b):
  ck(a.tag==b.tag and set(a.attrib)==set(b.attrib));ck(a.text==b.text and a.tail==b.tail)
  for k,v in a.attrib.items():
   if k in ['x','y','x1','y1','x2','y2','cx','cy','r','width','height']:close(float(v),float(b.attrib[k]))
   else:ck(v==b.attrib[k])
  ck(len(a)==len(b))
  for x,y in zip(a,b):compare(x,y)
 # Frozen bundle order: square, quartic, negative, zero.
 for i,(p,j,k)in enumerate(zip(panels,[-4,-3,-2,-1],[2,3,4,0])):
  ck(p.attrib.pop('x')=='50'and p.attrib.pop('y')==str([85,640,1195,1750][i]));compare(p,ET.fromstring(bundle['views'][j]['svgs'][k]))
 table=re.search(r'data-learning-lab="ito-quadratic-variation".*?<tbody>(.*?)</tbody>',site,re.S).group(1);vals=[html.unescape(x).strip()for x in re.findall(r'<tr>\s*<td>.*?</td>\s*<td[^>]*>(.*?)</td>\s*</tr>',table,re.S)]
 s=f['square']['selected']['chain'];q=f['quartic']['selected']['chain'];g=f['negative']['selected']['gbm'];z=f['zero']['selected']
 refs=[4,s['totals']['q'],s['totals']['first'],s['totals']['second'],s['totals']['remainder'],s['identityResidual'],s['timeResidual'],q['totals']['first'],q['totals']['second'],q['totals']['remainder'],q['weightedNoise'],q['timeResidual'],g['exactTerminal'],g['eulerTerminal'],g['firstNonPositive'],g['reference']['eulerMean'],z['chain']['totals']['q'],z['gbm']['exactTerminal'],z['gbm']['eulerTerminal'],z['gbm']['firstNonPositive']];ck(len(vals)==len(refs)==20)
 for v,r in zip(vals,refs):ck(v=='未出现')if r is None else close(float(v),r)
 for word in ['加权二次变差','Cauchy–Schwarz','可预测','一致连续','Doob','Picard','完备','不可区分','非正','OU','1_Q']:ck(word in src,'proof and interpretation '+word)
 with tempfile.TemporaryDirectory()as td:
  out=Path(td)/'figure.svg';fallback=Path(td)/'fallback.md';subprocess.run(PREFIX+['python3',str(ROOT/'tools/build_ito_formula_sde_figure.py'),str(JS),str(out),str(FIXTURE),str(fallback)],check=True,stdout=subprocess.DEVNULL);compare(ET.parse(image).getroot(),ET.parse(out).getroot());ck(fallback.read_text()in src)
 print('formulas='+str(len(formulas)))
print(json.dumps({'status':'PASS','live':bundle['live'],'frozen':bundle['frozen'],'checks':checks,'invalid':bundle['invalid'],'mutationGuards':bundle['mutationGuards'],'self':bundle['self']['checks'],'coupling':bundle['coupling']}))
