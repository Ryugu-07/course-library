from pathlib import Path
import json,subprocess,tempfile,shutil,sys
PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
STAGING='--staging'in sys.argv
ROOT=Path(__file__).resolve().parents[1]
JS=ROOT/('work/symmetry166.js'if STAGING else'course-shared/labs/quantum-symmetry.js')
FIXTURE=ROOT/('work/symmetry-snapshot166.json'if STAGING else'course-shared/projects/quantum-symmetry/run-snapshot.json')
NODE='const fs=require(\'fs\'),assert=require(\'assert\'),a=require(require(\'path\').resolve(process.argv[2])),states=a.PRESETS.map(p=>a.snapshot(p.values));\nfor(const j1 of [\'0\',\'0.5\',\'1\',\'1.5\'])for(const j2 of [\'0\',\'0.5\',\'1\',\'1.5\'])for(const mode of [0,1,2])states.push(a.snapshot({j1,j2,...(mode===1?{coupling:\'-1.3\',dz:\'0.7\',dx:\'0.4\'}:mode===2?{coupling:\'1.7\',dz:\'-0.4\',dx:\'0.3\',hz:\'-0.6\',hx:\'0.9\'}:{})}));\nlet invalid=0;const bads=[null,[],true,0,\'\',{extra:\'1\'},{constructor:\'1\'},JSON.parse(\'{"__proto__":"1"}\')];for(const k of Object.keys(a.DEFAULTS))for(const v of [null,undefined,[],{},1,Infinity,\'1e0\',\'+1\',\'01\',\'NaN\',\'0.00000000000000000000001\'])bads.push({[k]:v});for(const k of [\'j1\',\'j2\'])for(const v of [\'-0\',\'2\',\'0.25\',\'-1\',\'1.0\'])bads.push({[k]:v});for(const k of [\'coupling\',\'dz\',\'dx\',\'hz\',\'hx\'])for(const v of [\'2.1\',\'-2.1\'])bads.push({[k]:v});for(const v of bads){assert.throws(()=>a.snapshot(v));invalid++;}\nconst canonical=JSON.stringify(a.snapshot());for(const mutate of [s=>s.cg.states[0].vector[0]=99,s=>s.dynamics.spectrum.states[0].vector[0]=99,s=>s.tensor.blocks[0].rows[0].value=99,s=>s.product.total.x[0][0]=99]){const s=a.snapshot();mutate(s);assert.equal(JSON.stringify(a.snapshot()),canonical);}\nconst close=(x,y)=>assert(Number.isFinite(x)&&Number.isFinite(y)&&Math.abs(x-y)<2e-10*(1+Math.abs(y)));\nlet invariance=0;\nfor(const c of [{j1:\'1\',j2:\'0.5\',coupling:\'0.7\',dz:\'0.3\',dx:\'-0.2\',hz:\'0.5\',hx:\'0.2\'},{j1:\'1.5\',j2:\'1\'}]){const x=a.snapshot(c),twice=Object.fromEntries(Object.entries({...a.DEFAULTS,...c}).map(([k,v])=>[k,[\'j1\',\'j2\'].includes(k)?v:String(2*Number(v))])),y=a.snapshot(twice);x.dynamics.spectrum.values.forEach((v,j)=>close(y.dynamics.spectrum.values[j],2*v));assert.equal(JSON.stringify(x.cg),JSON.stringify(y.cg));invariance++;}\nfor(const c of [{j1:\'1\',j2:\'0.5\',dz:\'0.3\',hx:\'0.4\'},{j1:\'1.5\',j2:\'0.5\',dx:\'-0.2\',hz:\'-0.7\'}]){const x=a.snapshot(c),y=a.snapshot({...c,j1:c.j2,j2:c.j1});x.dynamics.spectrum.values.forEach((v,j)=>close(v,y.dynamics.spectrum.values[j]));invariance++;}\nfunction compare(x,y){if(typeof x===\'number\'&&typeof y===\'number\'){close(x,y);return;}if(x&&y&&typeof x===\'object\'&&typeof y===\'object\'){assert.deepEqual(Object.keys(x),Object.keys(y));for(const k of Object.keys(x))compare(x[k],y[k]);return;}assert.strictEqual(x,y);}\nlet frozen=0;if(process.argv[3]!==\'-\'){const f=JSON.parse(fs.readFileSync(process.argv[3]));for(const k of [\'default\',\'kramers\',\'integer\',\'tiny\']){compare(a.snapshot(f[k].parameters),f[k]);states.push(f[k]);frozen++;}}\nconst views=states.map(s=>{const p=a.plots(s),tables=a.ledgers(s);return{plots:p,svgs:p.map(a.svg),tables,formatted:tables.map(t=>t.rows.map(r=>r.map(a.fmt)))};});fs.writeFileSync(process.argv[4],JSON.stringify({states,views,live:states.length-frozen,frozen,invalid,mutationGuards:4,invariance,self:a.selfTest()}));\n'
with tempfile.TemporaryDirectory()as td:
 script=Path(td)/'export.cjs';out=Path(td)/'bundle.json';script.write_text(NODE)
 subprocess.run(PREFIX+['node',str(script),str(JS),str(FIXTURE),str(out)],check=True)
 bundle=json.loads(out.read_text())

import math
from fractions import Fraction
checks=0
def ck(v,msg='assertion'):
 global checks
 checks+=1
 if not v:raise AssertionError(msg)
def close(a,b,msg='number',tol=3e-10):ck(math.isfinite(a)and math.isfinite(b)and abs(a-b)<=tol*(1+abs(b)),msg+str((a,b)))
def same(a,b):
 if isinstance(a,list)and isinstance(b,list):
  ck(len(a)==len(b),'shape')
  for x,y in zip(a,b):same(x,y)
 elif isinstance(a,(int,float))and isinstance(b,(int,float)):close(a,b)
 else:ck(a==b)
def zeros(n):return[[0.]*n for _ in range(n)]
def identity(n):return[[float(i==j)for j in range(n)]for i in range(n)]
def tr(a):return[list(x)for x in zip(*a)]
def plus(a,b):return[[x+y for x,y in zip(r,s)]for r,s in zip(a,b)]
def times(a,k):return[[k*x for x in r]for r in a]
def minus(a,b):return plus(a,times(b,-1))
def mm(a,b):return[[math.fsum(x*y for x,y in zip(r,c))for c in zip(*b)]for r in a]
def mv(a,v):return[math.fsum(x*y for x,y in zip(r,v))for r in a]
def dot(a,b):return math.fsum(x*y for x,y in zip(a,b))
def norm(v):return math.sqrt(dot(v,v))
def maxabs(a):return max([0]+[abs(x)for r in a for x in r])
def comm(a,b):return minus(mm(a,b),mm(b,a))
def kron(a,b):return[[x*y for x in r for y in s]for r in a for s in b]
def spin(j):
 n=int(2*j+1);z=zeros(n);p=zeros(n);u=zeros(n)
 for i in range(n):
  m=j-i;z[i][i]=m;u[n-1-i][i]=(-1)**i
  if i:p[i-1][i]=math.sqrt(j*(j+1)-m*(m+1))
 return{'plus':p,'minus':tr(p),'x':times(plus(p,tr(p)),.5),'yImag':times(minus(tr(p),p),.5),'z':z,'u':u}
CG_CACHE={}
def CG(a,b,J,m,q,M):
 key=(a,b,J,m,q,M)
 if key in CG_CACHE:return CG_CACHE[key]
 if M!=m+q or abs(m)>a or abs(q)>b or abs(M)>J or J<abs(a-b)or J>a+b or int(a+b-J)!=a+b-J:return 0.
 fac=lambda x:math.factorial(int(x))
 pref=Fraction(int(2*J+1)*fac(J+a-b)*fac(J-a+b)*fac(a+b-J),fac(a+b+J+1))
 for x in [J+M,J-M,a-m,a+m,b-q,b+q]:pref*=fac(x)
 terms=[]
 for k in range(int(a+b-J)+1):
  args=[k,a+b-J-k,a-m-k,b+q-k,J-b+m+k,J-a-q+k]
  if min(args)>=0:terms.append(Fraction((-1)**k,math.prod(fac(x)for x in args)))
 value=math.sqrt(float(pref))*float(sum(terms,Fraction(0)));CG_CACHE[key]=value;return value
def check_state(s):
 ck(s['version']==166);c=s['parameters'];j1=float(c['j1']);j2=float(c['j2']);n1=int(2*j1+1);n2=int(2*j2+1);n=n1*n2;p=s['product'];ck(p['dimension']==n);close(p['j1'],j1);close(p['j2'],j2);aa=spin(j1);bb=spin(j2);a={k:kron(aa[k],identity(n2))for k in ['plus','minus','x','yImag','z']};b={k:kron(identity(n1),bb[k])for k in a};j={k:plus(a[k],b[k])for k in a};cas=plus(minus(mm(j['x'],j['x']),mm(j['yImag'],j['yImag'])),mm(j['z'],j['z']));j['casimir']=cas;ex=plus(minus(mm(a['x'],b['x']),mm(a['yImag'],b['yImag'])),mm(a['z'],b['z']));u=kron(aa['u'],bb['u']);same(p['timeReversal'],u);same(p['exchange'],ex)
 for group,expected in [('first',a),('second',b),('total',j)]:
  ck(list(p[group])==list(expected))
  for k,v in expected.items():same(p[group][k],v)
 ck(len(p['basis'])==n)
 for i,r in enumerate(p['basis']):ck(r=={'index':i,'m1':j1-i//n2,'m2':j2-i%n2,'M':j1+j2-i//n2-i%n2})
 cg=s['cg'];states=cg['states'];expected_states=[(J/2,M/2)for J in range(int(2*(j1+j2)),int(2*abs(j1-j2))-1,-2)for M in range(J,-J-1,-2)];ck(len(states)==n)
 C=[[CG(j1,j2,t[0],r['m1'],r['m2'],t[1])for t in expected_states]for r in p['basis']];same(cg['matrix'],C);same(cg['orthogonality'],minus(mm(tr(C),C),identity(n)));same(cg['casimir'],mm(tr(C),mm(cas,C)));same(cg['z'],mm(tr(C),mm(j['z'],C)))
 for i,(r,(J,M))in enumerate(zip(states,expected_states)):
  ck(r['index']==i);close(r['J'],J);close(r['M'],M);v=[row[i]for row in C];same(r['vector'],v);same(r['lowering'],mv(j['minus'],v));close(r['factor'],math.sqrt((J+M)*(J-M+1)))
 ck(len(cg['highest'])==len(set(J for J,M in expected_states)))
 for h,J in zip(cg['highest'],dict.fromkeys(J for J,M in expected_states)):
  close(h['J'],J);top=next(r for r in states if r['J']==J and r['M']==J);same(h['vector'],top['vector']);same(h['raising'],mv(j['plus'],h['vector']));ck(norm(h['raising'])<1e-10);candidates=[r['index']for r in p['basis']if r['M']==J];previous=[r for r in states if r['J']>J and r['M']==J];ck(1<=len(h['attempts'])<=len(candidates))
  for attempt_index,attempt in enumerate(h['attempts']):
   ck(attempt['seed']==candidates[attempt_index]);v=[float(i==attempt['seed'])for i in range(n)];ck(len(attempt['projections'])==2*len(previous))
   for row,(passno,old)in zip(attempt['projections'],[(passno,old)for passno in range(2)for old in previous]):
    ck(row['pass']==passno);close(row['J'],old['J']);close(row['M'],old['M']);coef=dot(v,old['vector']);close(row['coefficient'],coef);v=[x-coef*y for x,y in zip(v,old['vector'])]
   same(attempt['residual'],v);close(attempt['norm'],norm(v))
   if attempt_index<len(h['attempts'])-1:ck(norm(v)<=1e-12)
   else:ck(norm(v)>1e-12);v=[x/norm(v)for x in v];v=[x*(1 if next(x for x in v if abs(x)>1e-12)>0 else -1)for x in v];same(v,h['vector'])
 terms={'exchange':times(ex,float(c['coupling'])),'axialAnisotropy':times(mm(j['z'],j['z']),float(c['dz'])),'transverseAnisotropy':times(mm(j['x'],j['x']),float(c['dx'])),'axialField':times(j['z'],float(c['hz'])),'transverseField':times(j['x'],float(c['hx']))};H=zeros(n)
 for k,t in terms.items():same(s['dynamics']['terms'][k],t);H=plus(H,t)
 d=s['dynamics'];same(d['matrix'],H);same(H,tr(H));same(d['timeReverse'],mm(u,mm(H,tr(u))));same(d['trResidual'],minus(mm(u,mm(H,tr(u))),H));same(d['square'],mm(u,u));close(d['squareSign'],(-1)**int(2*(j1+j2)));same(d['square'],times(identity(n),d['squareSign']));ck(d['timeReversalGuaranteed']==(float(c['hz'])==float(c['hx'])==0));ck(d['rotationGuaranteed']==(float(c['hz'])==float(c['hx'])==float(c['dz'])==float(c['dx'])==0))
 for k in ['x','yImag','z']:same(d['commutators'][k],comm(H,j[k]))
 spectrum=d['spectrum'];ck(spectrum['converged']);close(spectrum['threshold'],2e-14*max(1,maxabs(H)));ck(len(spectrum['states'])==n);ck(spectrum['values']==sorted(spectrum['values']));same(spectrum['vectors'],tr([r['vector']for r in spectrum['states']]));same(spectrum['orthogonality'],minus(mm(tr(spectrum['vectors']),spectrum['vectors']),identity(n)));ck(maxabs(spectrum['orthogonality'])<1e-10)
 for r,value in zip(spectrum['states'],spectrum['values']):
  close(r['value'],value);ck(r['index']in range(n));v=r['vector'];res=[x-value*y for x,y in zip(mv(H,v),v)];same(r['residual'],res);close(r['residualNorm'],norm(res));ck(norm(res)<1e-10*(1+maxabs(H)))
 # Independent replay of every recorded Jacobi rotation checks the eigenvalues rather than trusting a residual summary.
 B=[r[:]for r in H];V=identity(n)
 for i,row in enumerate(spectrum['history']):
  ck(row['step']==i);pi,qi=row['p'],row['q'];ck(0<=pi<qi<n);close(row['off'],B[pi][qi]);close(abs(row['off']),max(abs(B[x][y])for x in range(n)for y in range(x+1,n)));close(row['c']**2+row['s']**2,1);close(row['s'],row['t']*row['c']);R=identity(n);R[pi][pi]=R[qi][qi]=row['c'];R[pi][qi]=row['s'];R[qi][pi]=-row['s'];B=mm(tr(R),mm(B,R));V=mm(V,R)
 final=maxabs([[0 if i==j else x for j,x in enumerate(r)]for i,r in enumerate(B)]);close(spectrum['finalOffDiagonal'],final);ck(final<=spectrum['threshold']+1e-11);same(spectrum['values'],sorted(B[i][i]for i in range(n)))
 close(d['groupingTolerance'],1e-9*max(1,maxabs(H)));seen=[]
 for group in d['groups']:
  ck(group['indices']);close(group['reference'],spectrum['values'][group['indices'][0]])
  for index,energy in zip(group['indices'],group['energies']):close(energy,spectrum['values'][index]);ck(abs(energy-group['reference'])<=d['groupingTolerance']);seen.append(index)
 same(seen,list(range(n)))
 for row,r in zip(d['pairs'],spectrum['states']):
  ck(row['index']==r['index']);close(row['energy'],r['value']);v=mv(u,r['vector']);same(row['partner'],v);close(row['overlap'],dot(r['vector'],v));close(row['norm'],norm(v));res=[x-r['value']*y for x,y in zip(mv(H,v),v)];same(row['energyResidual'],res);close(row['energyResidualNorm'],norm(res))
 tensor=s['tensor'];ops={-1:times(a['minus'],1/math.sqrt(2)),0:a['z'],1:times(a['plus'],-1/math.sqrt(2))};converted={q:mm(tr(C),mm(op,C))for q,op in ops.items()}
 for q,op in ops.items():same(tensor['qops'][str(q)],op);same(tensor['transformed'][str(q)],converted[q])
 ck(len(tensor['commutators'])==9)
 for row in tensor['commutators']:
  q,sign=row['q'],row['sign'];factor=q if sign==0 else math.sqrt(max(0,2-q*(q+sign)));left=comm(j['z'if sign==0 else'plus'if sign==1 else'minus'],ops[q]);right=times(ops[q]if sign==0 else ops.get(q+sign,zeros(n)),factor);close(row['factor'],factor);same(row['left'],left);same(row['right'],right);same(row['residual'],minus(left,right));ck(maxabs(row['residual'])<1e-10)
 blocks=tensor['blocks'];js=list(dict.fromkeys(J for J,M in expected_states));ck([(b['J'],b['Jp'])for b in blocks]==[(J,Jp)for J in js for Jp in js])
 for block in blocks:
  J,Jp=block['J'],block['Jp'];expected=[(i,f,q)for i in states if i['J']==J for f in states if f['J']==Jp for q in [-1,0,1]];ck(len(block['rows'])==len(expected))
  for row,(initial,final,q)in zip(block['rows'],expected):
   ck(row['initial']==initial['index']and row['final']==final['index']);same([row[k]for k in ['J','M','Jp','Mp','q']],[J,initial['M'],Jp,final['M'],q]);coefficient=CG(J,1,Jp,initial['M'],q,final['M']);close(row['cg'],coefficient);ck(row['triangle']==(abs(J-1)<=Jp<=J+1));ck(row['magnetic']==(final['M']==initial['M']+q));value=converted[q][final['index']][initial['index']];close(row['value'],value);pred=0 if block['reduced']is None else coefficient*block['reduced'];close(row['predicted'],pred);close(row['residual'],value-pred);ck(abs(value-pred)<1e-10)
  denominator=math.fsum(r['cg']**2 for r in block['rows']);numerator=math.fsum(r['cg']*r['value']for r in block['rows']);close(block['denominator'],denominator);close(block['numerator'],numerator)
  if denominator:close(block['reduced'],numerator/denominator)
  else:ck(block['reduced']is None)
 ck(len(s['scan'])==65)
 for i,row in enumerate(s['scan']):
  close(row['hz'],-2+i/16);ck(len(row['values'])==n and row['values']==sorted(row['values']));ck(row['converged']);h=plus(H,times(j['z'],row['hz']-float(c['hz'])));close(sum(row['values']),sum(h[k][k]for k in range(n)),'spectrum trace');close(sum(v*v for v in row['values']),sum(x*x for r in h for x in r),'spectrum square trace');ck(row['maxResidual']<1e-10*(1+maxabs(h)))
  scale=max(1,max(sum(abs(x)for x in r)for r in h));normalized=times(h,1/scale);power=identity(n)
  for k in range(1,n+1):power=mm(power,normalized);close(math.fsum((v/scale)**k for v in row['values']),sum(power[j][j]for j in range(n)),'all characteristic moments',2e-9)
 for k,v in {'xy':minus(comm(j['x'],j['yImag']),j['z']),'yz':minus(comm(j['yImag'],j['z']),j['x']),'zx':plus(comm(j['z'],j['x']),j['yImag'])}.items():same(s['representation'][k],v);ck(maxabs(v)<1e-10)

import xml.etree.ElementTree as ET
def fields(r,keys):return[r[k]for k in keys.split()]
def check_view(s,v):
 p=s['product'];d=s['dynamics'];cg=s['cg'];t=s['tensor'];n=p['dimension'];rows=[r for b in t['blocks']for r in b['rows']]
 expected=[cg['matrix'],p['total']['plus'],[[[r['index'],r['value']]for r in d['spectrum']['states']]],[[[r['hz'],r['values'][j]]for r in s['scan']]for j in range(n)],t['transformed']['1'],[[[j,r[k]]for j,r in enumerate(rows)]for k in ['value','predicted']],p['timeReversal'],[[[r['index'],abs(r['overlap'])]for r in d['pairs']],[[r['index'],r['energyResidualNorm']/max(1,maxabs(d['matrix']))]for r in d['pairs']]]]
 ck([p['key']for p in v['plots']]==['cg','raising','energies','field-scan','tensor-plus','we','time-reversal','partners']);ck(len(v['svgs'])==8)
 def fnum(x):return str(int(x))if int(x)==x else str(x)
 plabels=[fnum(r['m1'])+','+fnum(r['m2'])for r in p['basis']];clabels=[fnum(r['J'])+','+fnum(r['M'])for r in cg['states']]
 for index,(plot,svg,exp)in enumerate(zip(v['plots'],v['svgs'],expected)):
  root=ET.fromstring(svg);ns='{http://www.w3.org/2000/svg}';ck(root.find(ns+'title').text==plot['title']);ck(root.find(ns+'desc').text==plot['caption'])
  if index in [0,1,4,6]:
   ck(plot['type']=='matrix');same(plot['matrix'],exp);ck(root.attrib['viewBox']=='0 0 900 760');ck(plot['rowLabels']==(clabels if index==4 else plabels));ck(plot['colLabels']==(clabels if index in [0,4]else plabels));close(plot['limit'],maxabs(exp)or 1);ck(plot['allZero']==(maxabs(exp)==0));rects=[e for e in root.findall(ns+'rect')if 'data-row'in e.attrib];ck(len(rects)==n*n);cell=560/n
   for rect,(i,j)in zip(rects,[(i,j)for i in range(n)for j in range(n)]):
    value=exp[i][j];ck(rect.attrib['data-row']==str(i)and rect.attrib['data-col']==str(j));close(float(rect.attrib['data-value']),value);close(float(rect.attrib['x']),190+j*cell);close(float(rect.attrib['y']),120+i*cell);close(float(rect.attrib['width']),cell);close(float(rect.attrib['height']),cell);ck(rect.attrib['fill']==('#ae6017'if value<0 else'#256c91'));close(float(rect.attrib['fill-opacity']),.65*abs(value)/plot['limit'])
   texts=root.findall(ns+'text');data=texts[5:-1];ck(len(data)==n*(n+2))
   for i in range(n):
    line=data[i*(n+2):(i+1)*(n+2)];ck(line[0].text==plot['rowLabels'][i]and line[1].text==plot['colLabels'][i])
    for j,e in enumerate(line[2:]):
     val=exp[i][j];close(float(e.attrib['x']),190+(j+.5)*cell);close(float(e.attrib['y']),120+(i+.5)*cell+min(20,cell/4.2)/3)
     if val==0:ck(e.text=='0')
     elif abs(val)<1e-12:ck(e.text=='≈0')
     else:close(float(e.text),val,'matrix 3 significant digits',.005)
  else:
   ck(plot['type']=='line');ck(root.attrib['viewBox']=='0 0 900 460');ck(len(plot['series'])==len(exp));lines={int(e.attrib['data-series']):e for e in root.findall(ns+'polyline')};ck(len(lines)==len(exp))
   for j,(series,points)in enumerate(zip(plot['series'],exp)):
    same(series['points'],points);line=lines[j];ck(line.attrib['stroke']==series['color']);actual=[[float(x)for x in pair.split(',')]for pair in line.attrib['points'].split()];ck(len(actual)==len(points))
    for xy,(x,y)in zip(actual,points):ck(plot['xMin']<=x<=plot['xMax']and plot['yMin']<=y<=plot['yMax']);close(xy[0],104+(x-plot['xMin'])/(plot['xMax']-plot['xMin'])*762);close(xy[1],360-(y-plot['yMin'])/(plot['yMax']-plot['yMin'])*259)
 expected={
 'product-basis':[fields(r,'index m1 m2 M')for r in p['basis']],
 'cg':[[r['index'],r['J'],r['M'],b['index'],b['m1'],b['m2'],r['vector'][b['index']],r['lowering'][b['index']],r['factor']]for r in cg['states']for b in p['basis']],
 'highest':[[h['J'],i,a['seed'],a['norm'],k,x,h['vector'][k],h['raising'][k]]for h in cg['highest']for i,a in enumerate(h['attempts'])for k,x in enumerate(a['residual'])],
 'projections':[[h['J'],i,a['seed']]+fields(r,'pass J M coefficient')for h in cg['highest']for i,a in enumerate(h['attempts'])for r in a['projections']]}
 matrices=[(group+'.'+k,m)for group,ms in [('first',p['first']),('second',p['second']),('total',p['total'])]for k,m in ms.items()]
 matrices+=list({'exchange':p['exchange'],'U':p['timeReversal'],'CG':cg['matrix'],'CGorthogonality':cg['orthogonality'],'CGcasimir':cg['casimir'],'CGz':cg['z'],'H':d['matrix'],**d['terms'],**d['commutators'],'timeReverse':d['timeReverse'],'timeReverseResidual':d['trResidual'],'timeReverseSquare':d['square'],'spectrumVectors':d['spectrum']['vectors'],'spectrumOrthogonality':d['spectrum']['orthogonality'],**s['representation']}.items())
 expected.update({
 'matrices':[[name,i,j,x]for name,m in matrices for i,r in enumerate(m)for j,x in enumerate(r)],
 'eigenstates':[[r['index'],r['value'],k,x,r['residual'][k],r['residualNorm']]for r in d['spectrum']['states']for k,x in enumerate(r['vector'])],
 'jacobi':[fields(r,'step p q off t c s')for r in d['spectrum']['history']],
 'groups':[[j,r['reference'],i,r['energies'][k],d['groupingTolerance']]for j,r in enumerate(d['groups'])for k,i in enumerate(r['indices'])],
 'partners':[[r['index'],r['energy'],k,x,r['overlap'],r['norm'],r['energyResidual'][k],r['energyResidualNorm']]for r in d['pairs']for k,x in enumerate(r['partner'])],
 'tensor-matrices':[[basis,int(q),i,j,x]for basis,ms in [('product',t['qops']),('coupled',t['transformed'])]for q,m in ms.items()for i,r in enumerate(m)for j,x in enumerate(r)],
 'tensor-commutators':[[r['q'],r['sign'],r['factor'],i,j,x,r['right'][i][j],r['residual'][i][j]]for r in t['commutators']for i,row in enumerate(r['left'])for j,x in enumerate(row)],
 'we-blocks':[[b['J'],b['Jp'],b['numerator'],b['denominator'],b['reduced'],t['convention']]for b in t['blocks']],
 'we-values':[fields(r,'initial final J M Jp Mp q triangle magnetic cg value predicted residual')for b in t['blocks']for r in b['rows']],
 'scan':[[r['hz'],i,x,r['maxResidual'],r['converged']]for r in s['scan']for i,x in enumerate(r['values'])]})
 summary=[p['j1'],p['j2'],n]+[float(s['parameters'][k])for k in ['coupling','dz','dx','hz','hx']]+[maxabs(cg['orthogonality']),d['squareSign'],d['timeReversalGuaranteed'],d['rotationGuaranteed'],maxabs(d['trResidual']),d['groupingTolerance'],d['spectrum']['converged'],d['spectrum']['threshold'],d['spectrum']['finalOffDiagonal'],s['scope']]
 ck([t['key']for t in v['tables']]==['summary']+list(expected));ck(len(v['formatted'])==15)
 for table,formatted in zip(v['tables'],v['formatted']):
  if table['key']=='summary':same([r[1]for r in table['rows']],summary);ck(all(len(r)==2 and r[0]for r in table['rows']))
  else:same(table['rows'],expected[table['key']])
  ck(len(formatted)==len(table['rows']));ck(all(len(r)==len(table['headers'])for r in table['rows']))
  for row,raw in zip(formatted,table['rows']):
   ck(len(row)==len(raw))
   for text,value in zip(row,raw):
    ck(isinstance(text,str))
    if isinstance(value,bool):ck(text==str(value).lower())
    elif isinstance(value,(int,float)):close(float(text),value,'formatted number',6e-8)
    elif value is None:ck(text=='不适用')
    else:ck(text==value)

for d,v in zip(bundle["states"],bundle["views"]):check_state(d);check_view(d,v)

import re,html,hashlib
from html.parser import HTMLParser
f=json.loads(FIXTURE.read_text());ck(f['schema']==1);ck(f['provenance']=={'date':'2026-09-12','node':'v24.14.0','platform':'darwin','arch':'arm64','jsSha256':hashlib.sha256(JS.read_bytes()).hexdigest()});ck(bundle['frozen']==4)
if not STAGING:
 src=(ROOT/'physics-course/lectures/aqm-01-symmetry.md').read_text();site=(ROOT/'physics-course/site/aqm-01-symmetry.html').read_text()
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
  if target and not re.match(r'^[a-zA-Z]+:',target)and not target.startswith('/'):ck((ROOT/'physics-course/site'/target).exists(),'local target '+target)
 for course in ['ai-course','grad-math','math-course','physics-course']:ck((ROOT/course/'site/assets/learning/labs/quantum-symmetry.js').read_bytes()==JS.read_bytes())
 ck((ROOT/'physics-course/site/assets/learning/projects/quantum-symmetry/run-snapshot.json').read_bytes()==FIXTURE.read_bytes());ck((ROOT/'.github/workflows/course-audit.yml').read_text().count('python tools/check_quantum_symmetry_full.py')==1)
 image=ROOT/'physics-course/images/aqm-01-symmetry-ledgers.svg';ck(image.read_bytes()==(ROOT/'physics-course/site/assets/img/aqm-01-symmetry-ledgers.svg').read_bytes());root=ET.parse(image).getroot();ck(root.attrib['viewBox']=='0 0 1000 2600');panels=root.findall('.//{http://www.w3.org/2000/svg}svg');ck(len(panels)==4)
 def compare(a,b):
  ck(a.tag==b.tag and set(a.attrib)==set(b.attrib));ck(a.text==b.text and a.tail==b.tail)
  for k,v in a.attrib.items():
   if k in ['x','y','x1','y1','x2','y2','cx','cy','r','width','height']:close(float(v),float(b.attrib[k]))
   else:ck(v==b.attrib[k])
  ck(len(a)==len(b))
  for x,y in zip(a,b):compare(x,y)
 # Frozen bundle order: default, kramers, integer, tiny.
 for i,(p,j,k)in enumerate(zip(panels,[-4,-3,-2,-1],[0,3,2,2])):
  ck(p.attrib.pop('x')=='50'and p.attrib.pop('y')==str([85,940,1495,2050][i]));compare(p,ET.fromstring(bundle['views'][j]['svgs'][k]))
 table=re.search(r'data-learning-lab="quantum-symmetry".*?<tbody>(.*?)</tbody>',site,re.S).group(1);vals=[html.unescape(x).strip()for x in re.findall(r'<tr>\s*<td>.*?</td>\s*<td[^>]*>(.*?)</td>\s*</tr>',table,re.S)]
 d=f['default'];k=f['kramers'];n=f['integer'];t=f['tiny']
 refs=[d['product']['dimension'],d['dynamics']['spectrum']['values'][0],d['dynamics']['spectrum']['values'][1],d['cg']['matrix'][1][3],d['cg']['matrix'][2][3],k['dynamics']['squareSign']]+k['dynamics']['spectrum']['values']+[n['dynamics']['squareSign']]+n['dynamics']['spectrum']['values']+t['dynamics']['spectrum']['values']+[t['dynamics']['groupingTolerance'],len(t['dynamics']['groups'])];ck(len(vals)==len(refs)==20)
 for v,r in zip(vals,refs):close(float(v),r)
 for word in ['射线','强连续性','最高权','Condon','重数空间','球张量','反线性','Kramers','分组容差','81','约化矩阵元','Schur']:ck(word in src,'proof and interpretation '+word)
 with tempfile.TemporaryDirectory()as td:
  out=Path(td)/'figure.svg';fallback=Path(td)/'fallback.md';subprocess.run(PREFIX+['python3',str(ROOT/'tools/build_quantum_symmetry_figure.py'),str(JS),str(out),str(FIXTURE),str(fallback)],check=True,stdout=subprocess.DEVNULL);compare(ET.parse(image).getroot(),ET.parse(out).getroot());ck(fallback.read_text()in src)
 print('formulas='+str(len(formulas)))
print(json.dumps({'status':'PASS','live':bundle['live'],'frozen':bundle['frozen'],'checks':checks,'invalid':bundle['invalid'],'mutationGuards':bundle['mutationGuards'],'self':bundle['self']['checks'],'invariance':bundle['invariance']}))
