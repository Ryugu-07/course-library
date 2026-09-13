"""Polynomial degree constraints, cyclic-group roots, and every chart sample."""
from pathlib import Path
import math,cmath,json,sys
checks=0;max_error=0
def close(a,b,path='root'):
 global checks,max_error
 if isinstance(b,(list,tuple)):
  assert isinstance(a,(list,tuple))and len(a)==len(b),path
  for i,(x,y)in enumerate(zip(a,b)):close(x,y,path+'.'+str(i))
 elif isinstance(b,dict):
  assert isinstance(a,dict)and set(a)==set(b),(path,'keys')
  for key in b:close(a[key],b[key],path+'.'+key)
 elif isinstance(b,(str,bool))or b is None:assert type(a)==type(b)and a==b,(path,a,b)
 else:
  assert type(a)in[int,float]and math.isfinite(a)and abs(a-b)<=3e-11+5e-10*abs(b),(path,a,b);max_error=max(max_error,abs(a-b))
 checks+=1
def h0(degree):
 # Polynomial coefficients on U0 must also be regular in u=1/z on U1.
 # A term z^k in the first frame becomes u^(degree-k) in the second.
 return sum(1 for k in range(max(1,abs(degree)+2))if degree-k>=0)
def group(w):return'μ₁={1}，平凡'if w==1 else f'μ_{w}'
def quotient(w,nonzero):
 roots=[[cmath.exp(2j*math.pi*j/w).real,cmath.exp(2j*math.pi*j/w).imag]for j in range(w)]if nonzero else[]
 for re,im in roots:close(abs(complex(re,im)**w-1),0)
 return dict(weight=w,stabilizer=f'μ_{w}'if nonzero else'Gm',finite=bool(nonzero),order=w if nonzero else None,roots=roots,invariantExponents=[d for d in range(33)if w*d==0],orbit='C×'if nonzero else'{0}',closure='A¹'if nonzero else'{0}',openQuotient=f'Bμ_{w}')
def descent(d,m,w,mode):
 degree=w*d;avail=bool(h0(degree));exists=mode==0 or avail;selected='zero'if mode==0 else'example-nonzero'if avail else'unavailable'
 aut='C×'if mode==0 else group(w)if avail else'不适用（所选非零截面不存在）'
 fiber='Gm'if mode==0 else'Gm（截面值在∞为0）'if degree>0 else group(w)if avail else'不适用（所选对象不存在）'
 return dict(degree=d,pullbackDegree=m*d,sectionDegree=degree,pullbackSectionDegree=m*degree,h0=h0(degree),pullbackH0=h0(m*degree),trivial=d==0,sectionExists=avail,zeroSectionAlwaysExists=True,nonzeroSectionAvailable=avail,selectedSection=selected,selectedObjectExists=exists,factorsThroughNonzeroOpen=exists and mode==1 and degree==0,globalAutomorphisms=aut,infinityFiberStabilizer=fiber)
def review(record):
 topic=record['topic'];q=record['result'];v=q['values'];w=v['w']
 if topic=='quotient-gm':
  nz=v['nonzero'];r=quotient(w,nz);close(q['numeric'],r);rows=[['T点的对象',f'线丛L、截面s∈Γ(T,L^⊗{w})及保持s的同构'],['当前代表','x=1'if nz else'x=0'],['当前轨道',r['orbit']],['轨道的Zariski闭包',r['closure']],['整个朴素轨道集合','{零轨道, 非零轨道}'],['仿射不变量环 / 商','C[x]^Gm=C；Spec C只有一点'],['非零开子叠',f'[C×/Gm]_w ≃ Bμ_{w}'],['当前自同构群',('μ₁={1}，平凡'if w==1 else f'μ_{w}；λ^{w}=1')if nz else'整个Gm（复一维）'],['稳定子阶',w if nz else'无限；不是仅图中的单位圆'],['当前复几何点的无穷小自同构维数',0 if nz else 1],['整个商叠是否DM','否；原点有正维稳定子']]
  circle=[[math.cos(2*math.pi*i/144),math.sin(2*math.pi*i/144)]for i in range(145)];acted=[[math.cos(w*2*math.pi*i/144),math.sin(w*2*math.pi*i/144)]if nz else[0,0]for i in range(145)];close(q['chart']['series'][0]['points'],circle);close(q['chart']['series'][1]['points'],acted);close(q['chart']['series'][2]['points'],r['roots']if nz else circle);assert q['chart']['equalScale']and q['chart']['series'][2]['dots']
 else:
  assert topic=='descent';d=v['d'];m=v['m'];mode=v['sectionMode'];r=descent(d,m,w,mode);close(q['numeric'],r)
  obj=f'(O({d}), 0)';section='零截面；任意次数都合法';order='零截面不具有有限零点阶'
  if r['selectedSection']=='example-nonzero':obj=f'(O({d}), X₀^{w*d})';section=f'齐次截面X₀^{w*d}';order=f'{w*d} / {m*w*d}'
  elif r['selectedSection']=='unavailable':obj='不存在：负次数线丛没有所选非零全局截面';section='不适用；请切换到零截面模式';order='不适用'
  rows=[['原过渡函数 / 线丛',f'z^{d} / O({d})'],['拉回过渡函数',f'(z^{m})^{d} = z^{m*d}'],['拉回线丛',f'F_{m}^*O({d})=O({m*d})'],['在两张仿射图上的torsor','分别平凡；过渡函数在重叠Gm上可逆'],['在整个P¹上是否平凡','是，d=0'if d==0 else'否，d≠0；不能用局部可逆正则函数消去'],['dim H⁰(P¹,L^⊗w)',h0(w*d)],['dim H⁰(P¹,F_m^*(L^⊗w))',h0(m*w*d)],['当前选择的T族对象',obj],['选取的截面',section],['整族的全局自同构',r['globalAutomorphisms']],['无穷远纤维稳定子',r['infinityFiberStabilizer']],['整族是否落在非零开子叠Bμ_w','不适用；对象不存在'if not r['selectedObjectExists']else'是；截面处处不消失'if r['factorsThroughNonzeroOpen']else'否；截面有零点或恒为零'],['截面在∞的零点阶（原 / 拉回）',order],['这是否计算了整个模叠','否；实际检查了一个T族的下降、箭头与基变换']]
  for line,power in zip(q['chart']['series'],[d,m*d]):close(line['points'],[[i/60,power*i/60]for i in range(61)])
  assert len(q['chart']['series'])==2
 close(q['rows'],rows);assert q['chart']['title']and q['chart']['xlabel']and q['chart']['ylabel']and q['text']

NODE="const fs=require('fs'),a=require(process.argv[1]),fixture=JSON.parse(fs.readFileSync(process.argv[2]));\nfunction replay(x,y,path='root'){if(typeof y==='number'){if(typeof x!=='number'||!Number.isFinite(x)||Math.abs(x-y)>3e-11+5e-10*Math.abs(y))throw Error('Replay '+path);}else if(y!==null&&typeof y==='object'){if(!x||typeof x!=='object'||JSON.stringify(Object.keys(x))!==JSON.stringify(Object.keys(y)))throw Error('Replay keys '+path);for(const k of Object.keys(y))replay(x[k],y[k],path+'.'+k);}else if(x!==y)throw Error('Replay scalar '+path);}\nconst records=[];for(let w=1;w<=6;w++)for(let nonzero=0;nonzero<=1;nonzero++)records.push({topic:'quotient-gm',result:a.compute('quotient-gm',{w,nonzero})});for(let d=-3;d<=3;d++)for(let m=1;m<=4;m++)for(let w=1;w<=3;w++)for(let sectionMode=0;sectionMode<=1;sectionMode++)records.push({topic:'descent',result:a.compute('descent',{d,m,w,sectionMode})});\nfor(const q of fixture.records)replay(q.result,a.compute(q.topic,q.result.values));const observed=process.argv[3]?JSON.parse(fs.readFileSync(process.argv[3])):[];for(const q of observed)replay(q.result,a.compute(q.topic,q.result.values));\nlet invalid=0;for(const topic of a.topics)for(const[k,label,lo,hi]of a.configs[topic].controls)for(const v of[lo-1,hi+1,lo+.5,'1',true,null,NaN,Infinity]){let bad=false;try{a.compute(topic,{[k]:v})}catch(e){bad=true;}if(!bad)throw Error('Invalid '+k);invalid++;}\nlet helperCases=0;const helpers=[];for(let w=1;w<=8;w++)for(let nonzero=0;nonzero<=1;nonzero++){helpers.push({kind:'quotient',args:[w,nonzero],result:a.quotient(w,nonzero)});helperCases++;}for(let d=-8;d<=8;d++)for(let m=1;m<=8;m++)for(let w=1;w<=8;w++)for(let mode=0;mode<=1;mode++){helpers.push({kind:'descent',args:[d,m,w,mode],result:a.descent(d,m,w,mode)});helperCases++;}\nlet guards=0;for(const change of[q=>q.result.numeric.order=0,q=>q.result.chart.series[0].points[0][0]=NaN,q=>q.result.values.w='2',q=>q.result.rows.pop()]){const q=JSON.parse(JSON.stringify(records[1]));change(q);try{replay(q,records[1]);}catch(e){guards++;}}if(guards!==4)throw Error('Replay guards');\nconsole.log(JSON.stringify({records:[...records,...fixture.records,...observed],live:records.length,frozen:fixture.records.length,observed:observed.length,invalid,guards,helperCases,helpers}));\n"

if __name__=='__main__':
 import hashlib,subprocess,shutil,copy
 root=Path(__file__).resolve().parents[1];js=Path(sys.argv[1]).resolve()if len(sys.argv)>1 else root/'course-shared/labs/research-moduli-stacks.js';fixture=Path(sys.argv[2]).resolve()if len(sys.argv)>2 else root/'course-shared/projects/moduli-families/run-snapshot.json';f=json.loads(fixture.read_text());assert f['provenance']['sourceSha256']==hashlib.sha256(js.read_bytes()).hexdigest();assert len(f['records'])==10
 code=NODE
 if len(sys.argv)>4:code=code.replace('a=require(process.argv[1])','a=require(process.argv[4])()')
 args=[str(js),str(fixture)]+([str(Path(sys.argv[3]).resolve())]if len(sys.argv)>3 and sys.argv[3]!='-'else[''])+([str(Path(sys.argv[4]).resolve())]if len(sys.argv)>4 else[]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
 result=json.loads(subprocess.check_output(prefix+['node','-e',code,*args],text=True))
 for q in result['records']:review(q)
 for q in result['helpers']:close(q['result'],quotient(*q['args'])if q['kind']=='quotient'else descent(*q['args']))
 mutations=0
 qpoint=next(q for q in f['records']if q['topic']=='quotient-gm'and q['result']['values']==dict(w=2,nonzero=1));qfamily=next(q for q in f['records']if q['topic']=='descent'and q['result']['values']==dict(d=1,m=3,w=2,sectionMode=1));qbad=next(q for q in f['records']if q['topic']=='descent'and q['result']['values']==dict(d=-1,m=3,w=2,sectionMode=1))
 for source,edit in [(qpoint,lambda q:q['result']['numeric'].__setitem__('order',1)),(qpoint,lambda q:q['result']['numeric']['roots'].pop()),(qpoint,lambda q:q['result']['chart']['series'][1]['points'][3].__setitem__(0,0)),(qpoint,lambda q:q['result']['rows'][7].__setitem__(1,'平凡')),(qfamily,lambda q:q['result']['numeric'].__setitem__('globalAutomorphisms','C×')),(qfamily,lambda q:q['result']['numeric'].__setitem__('infinityFiberStabilizer','μ_2')),(qfamily,lambda q:q['result']['numeric'].__setitem__('factorsThroughNonzeroOpen',True)),(qfamily,lambda q:q['result']['numeric'].__setitem__('pullbackH0',q['result']['numeric']['h0'])),(qbad,lambda q:q['result']['numeric'].__setitem__('selectedObjectExists',True)),(qbad,lambda q:q['result']['numeric'].__setitem__('zeroSectionAlwaysExists',False))]:
  q=copy.deepcopy(source);edit(q)
  try:review(q)
  except(AssertionError,KeyError,TypeError,ValueError):mutations+=1
  else:raise AssertionError('Undetected mutation')
 assert result['invalid']==48 and result['guards']==4 and mutations==10
 print(json.dumps(dict(status='PASS',live=result['live'],frozen=result['frozen'],observed=result['observed'],helperCases=result['helperCases'],checks=checks,maxAbsoluteError=max_error,invalid=result['invalid'],replayGuards=result['guards'],mutations=mutations)))
