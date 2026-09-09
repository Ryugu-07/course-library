"""Independent Decimal/Taylor verification of browser algorithms and their plots."""
from pathlib import Path
from decimal import Decimal as D, localcontext
from fractions import Fraction
import subprocess,json,math,xml.etree.ElementTree as ET,sys,shutil
ROOT=Path(__file__).resolve().parents[1]
JS=r"""
const c=require('./course-shared/labs/floating-point-error.js'),assert=require('assert');
const all=[];for(const id of ['sqrt','cos','derivative'])for(const r of c.REFERENCE)all.push(c.evaluate(id,r.exponent));
const sums=[];for(const order of ['large-first','small-first','counterexample'])for(const n of [...Array(201).keys()].slice(1).concat([999,1000,1001,9999,10000,10001,19999,20000]))sums.push(c.sumCase(n,order));
let strict=0;for(const v of [null,'-12',NaN,Infinity,-17,0,-1.1]){assert.throws(()=>c.refAt(v));strict++}
for(const v of [null,'unknown',0]){assert.throws(()=>c.evaluate(v));strict++}
for(const n of [0,-1,1.5,20001,NaN,'2',null]){assert.throws(()=>c.sumCase(n));strict++}
assert.throws(()=>c.sumCase(1,'bad'));assert.throws(()=>c.kahanSum([1,,2]));assert.throws(()=>c.neumaierSum([Infinity]));
assert(Object.isFrozen(c.PRESETS)&&c.PRESETS.every(Object.isFrozen));assert(Object.isFrozen(c.REFERENCE)&&c.REFERENCE.every(Object.isFrozen));
class N{constructor(tag){this.tag=tag;this.attrs={};this.children=[]}setAttribute(k,v){this.attrs[k]=v}append(...n){this.children.push(...n)}}
const doc={createElementNS:(ns,tag)=>new N(tag)},plots=[];
for(const id of ['sqrt','cos','derivative','sum'])for(const order of id==='sum'?['large-first','small-first','counterexample']:['large-first'])plots.push({id,order,tree:c.chartSvg(doc,id,-12,order)});
assert.deepEqual(c.counterTrace().map(r=>[r.exact,r.kahan,r.compensation,r.neumaier]),[["10000000000000000",1e16,0,1e16],["10000000000000001",1e16,-1,1e16],["1",0,0,1],["4",3,0,4]]);const errors=[];let state=37;for(let k=0;k<100;k++){const a=[];for(let j=0;j<30;j++){state=(Math.imul(state,1664525)+1013904223)>>>0;const x=(state&1?-1:1)*2**((state>>>1)%54);a.push(x)}errors.push({values:a,naive:c.naiveSum(a),kahan:c.kahanSum(a),neumaier:c.neumaierSum(a)})}
console.log(JSON.stringify({all,sums,plots,errors,strict,refs:c.REFERENCE,self:c.selfTest()}));
"""
data=json.loads(subprocess.check_output((['rtk','proxy'] if shutil.which('rtk') else [])+['node','-e',JS],cwd=ROOT,text=True))
checks=0
def ok(b,msg):
 global checks
 checks+=1
 if not b:raise AssertionError(msg)
def cosine(x):
 term=D(1);s=term
 for n in range(1,300):
  term*=-(x*x)/D((2*n-1)*(2*n));s+=term
  if abs(term)<D('1e-105'):break
 return s
def sinh(x):
 return (x.exp()-(-x).exp())/2
with localcontext() as ctx:
 ctx.prec=110
 refjson=json.loads((ROOT/'tools/fixtures/floating-point-reference.json').read_text())
 ok(data['refs']==refjson['rows'],'embedded references agree with fixture')
 for row in data['refs']:
  x=D.from_float(row['x'])
  ok(row['x']==float(D(10)**(D(str(row['exponent'])))),'correctly rounded input')
  values={'sqrt':((1+x).sqrt()-1)/x,'cos':1-cosine(x),'derivative':D(1).exp(),'finiteDifference':D(1).exp()*sinh(x)/x}
  for key,y in values.items():
   ref=row[key];hi=D.from_float(ref['hi']);lo=D.from_float(ref['lo'])
   ok(abs(hi+lo-y)<=abs(y)*D('1e-31'),'two-word reference '+key)
   ok(abs(D(ref['decimal'])-y)<=abs(y)*D('1e-64'),'65 digit reference '+key)
  trunc=sinh(x)/x-1
  ok(abs(D.from_float(row['truncation'])-trunc)<trunc*D('2e-16'),'tiny truncation retained')
 for row in data['all']:
  x=D.from_float(row['x']);y= {'sqrt':lambda:((1+x).sqrt()-1)/x,'cos':lambda:1-cosine(x),'derivative':lambda:D(1).exp()}[row['id']]()
  for m in row['methods']:
   exacterror=abs(D.from_float(m['value'])-y)/abs(y)
   estimate=D.from_float(m['error'])
   ok(abs(estimate-exacterror)<=max(D('2e-30'),exacterror*D('3e-14')),'independent actual error '+str((row['id'],row['exponent'],m['name'],estimate,exacterror)))
   ok(m['error']>0,'nonexact transcendental output not labelled zero')
 if len(sys.argv)>1:
  for row in json.loads(Path(sys.argv[1]).read_text()):
   if row['id']=='sum':continue
   x=D.from_float(row['x']);y={'sqrt':lambda:((1+x).sqrt()-1)/x,'cos':lambda:1-cosine(x),'derivative':lambda:D(1).exp()}[row['id']]()
   for m in row['methods']:
    exacterror=abs(D.from_float(m['value'])-y)/abs(y)
    ok(abs(D.from_float(m['error'])-exacterror)<=max(D('2e-30'),exacterror*D('3e-14')),'independent browser error')
 for row in data['sums']:
  n=row['n'];truth=4 if row['order']=='counterexample' else n
  vals=[m['value']for m in row['methods']]
  # All integer truths are independent. Nearest even integer derives from spacing 2 at 1e16.
  nearest=2*round(Fraction(n,2))
  expected=[3,3,4]if row['order']=='counterexample' else [nearest,nearest,n]if row['order']=='small-first' else [0,nearest,n]
  ok(vals==expected,'sum integer rounding '+str((row['order'],n,vals,expected)))
  for m in row['methods']:ok(m['error']==abs(m['value']-truth)/truth,'sum error')
 for row in data['errors']:
  truth=sum(Fraction(x)for x in row['values']);absolute=sum(abs(Fraction(x))for x in row['values']);u=Fraction(1,2**53);gamma=29*u/(1-29*u)
  ok(abs(Fraction(row['naive'])-truth)<=gamma*absolute,'naive summation proven bound')
  # Independent exact-integer reference; Neumaier results need not be exact but stay within one ulp here.
  ok(abs(Fraction(row['neumaier'])-truth)<=Fraction(math.ulp(float(truth))),'Neumaier generated corpus accuracy')
 def walk(n):
  yield n
  for c in n['children']:yield from walk(c)
 for plot in data['plots']:
  nodes=list(walk(plot['tree']));pts=[n for n in nodes if 'data-error-point'in n['attrs']]
  ok(len(pts)==(39 if plot['id']=='sum' else 122),'complete plotted sample count')
  for n in pts:
   a=n['attrs'];x=float(a['cx']);y=float(a['cy']);e=float(a['data-error'])
   ok(80-1e-9<=x<=690+1e-9 and 60-1e-9<=y<=330+1e-9,'plot bounds')
   ok((y==330)==(e==0),'zero kept separate')
  for n in nodes:
   ok('NaN'not in str(n['attrs'])and'Infinity'not in str(n['attrs']),'finite geometry')
 tree=ET.parse(ROOT/'math-course/images/num-01-float-line.svg')
 floats=[e for e in tree.iter()if'data-float-value'in e.attrib];ok(len(floats)==9,'all p3 model floats')
 for e in floats:
  v=float(e.attrib['data-float-value']);ok(float(e.attrib['cx'])==130+270*(v-1),'true scaled number line')
  ok(Fraction(v) in [Fraction(1)+Fraction(k,4)for k in range(4)]+[Fraction(2)+Fraction(k,2)for k in range(5)],'representable p3 value')
 for e in tree.iter():
  if'data-binary-offset'in e.attrib:ok(float(e.attrib['cx'])==480+120*int(e.attrib['data-binary-offset']),'binary64 left/right spacing')
print(f'Floating point independent PASS: {checks} checks, 244 Decimal references, 366 actual errors, {len(data["sums"])} sums; {data["self"]["checks"]} self checks')
