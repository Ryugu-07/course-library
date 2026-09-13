#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Standard-library maximum-pivot spectrum and half-angle local-eigenvector reference."""
import math,cmath,itertools
from functools import lru_cache
checks=0
def close(a,b,label='',atol=2e-10,rtol=2e-8):
 global checks
 if isinstance(b,(list,tuple)):
  assert isinstance(a,(list,tuple))and len(a)==len(b),(label,'shape')
  for x,y in zip(a,b):close(x,y,label,atol,rtol)
 elif isinstance(b,dict):
  assert isinstance(a,dict)and list(a)==list(b),(label,'keys',list(a),list(b))
  for k in b:close(a[k],b[k],label+'.'+k,atol,rtol)
 elif b is None:assert a is None,(label,a,b)
 elif isinstance(b,(str,bool)):assert type(a)==type(b)and a==b,(label,a,b)
 else:assert type(a)in(int,float,complex)and math.isfinite(abs(a))and abs(a-b)<=atol+rtol*abs(b),(label,a,b)
 checks+=1
def dot(a,b):return math.fsum(x*y for x,y in zip(a,b))
def mv(A,v):return[dot(r,v)for r in A]
def norm(v):return math.sqrt(dot(v,v))
def zero(n):return[[0.]*n for _ in range(n)]
def parity(b):return 1 if b.bit_count()%2==0 else-1
def diagonalize(H):
 n=len(H);A=[r[:]for r in H];V=[[float(i==j)for j in range(n)]for i in range(n)]
 for iteration in range(120*n*n):
  magnitude,p,q=max((abs(A[i][j]),i,j)for i in range(n)for j in range(i+1,n))
  if magnitude<2e-14:break
  off=A[p][q];tau=(A[q][q]-A[p][p])/(2*off);t=math.copysign(1.,tau)/(abs(tau)+math.hypot(1,tau));c=1/math.sqrt(1+t*t);s=t*c;app=A[p][p];aqq=A[q][q]
  for k in range(n):
   if k!=p and k!=q:
    x=A[k][p];y=A[k][q];A[k][p]=A[p][k]=c*x-s*y;A[k][q]=A[q][k]=s*x+c*y
   x=V[k][p];y=V[k][q];V[k][p]=c*x-s*y;V[k][q]=s*x+c*y
  A[p][p]=app-t*off;A[q][q]=aqq+t*off;A[p][q]=A[q][p]=0.
 else:raise AssertionError('Reference Jacobi convergence')
 order=sorted(range(n),key=lambda i:A[i][i]);return[A[i][i]for i in order],[[r[i]for r in V]for i in order]
@lru_cache(None)
def exact(g):
 H=zero(16)
 for b in range(16):
  H[b][b]=-g*(4-2*b.bit_count())
  for j in range(3):H[b^(3<<j)][b]=-1
 E,V=diagonalize(H);v=V[0]
 if sum(v)<0:v=[-x for x in v]
 return H,E,v
def initial(angles):
 x=[];z=[]
 for d in angles:
  k=d%360
  zz,xx={0:(1.,0.),90:(0.,1.),180:(-1.,0.),270:(0.,-1.)}.get(k,(math.cos(math.radians(d)),math.sin(math.radians(d))))
  x.append(xx);z.append(zz)
 return x,z
def energy(x,z,g):return -math.fsum(x[j]*x[j+1]for j in range(3))-g*math.fsum(z)
def field(x,j):return sum(x[k]for k in range(4)if abs(j-k)==1)
def local(b,g):
 # Half-angle eigenvector, then Pauli expectations. Distinct from the
 # runtime's direct Bloch normalization; g is strictly positive here.
 t=math.atan2(b,g)/2;u=[math.cos(t),math.sin(t)]
 return u,2*u[0]*u[1],u[0]**2-u[1]**2
def residual(x,z,g):
 return max(math.hypot(x[j]-xx,z[j]-zz)for j in range(4)for _,xx,zz in [local(field(x,j),g)])
def physical(q,x,z,g,full=True):
 close(q['x'],x);close(q['z'],z);close(q['energy'],energy(x,z,g));close(q['localResidual'],residual(x,z,g))
 if not full:return
 H,E,v=exact(g);angles=[math.atan2(a,b)for a,b in zip(x,z)];angles=[math.pi if t==-math.pi else t for t in angles]
 U=[[math.cos(t/2),math.sin(t/2)]for t in angles];psi=[math.prod(U[j][b>>j&1]for j in range(4))for b in range(16)];acted=mv(H,psi);mean=dot(psi,acted);r=[a-mean*b for a,b in zip(acted,psi)]
 for key,value in dict(anglesRadians=angles,spinors=U,state=psi,acted=acted,norm=dot(psi,psi),matrixEnergy=mean,bonds=[-x[j]*x[j+1]for j in range(3)],fields=[-g*v for v in z],variance=dot(r,r),quantumResidual=norm(r),fidelity=dot(v,psi)**2,energyExcess=mean-E[0]).items():close(q[key],value,key)
 assert mean>=E[0]-1e-9
def run(q,g,angles,rounds,method):
 groups=([[0],[1],[2],[3],[3],[2],[1],[0]],[[0,1,2,3]]*2,[[0,2],[1,3],[1,3],[0,2]])[method]
 x,z=initial(angles);history=q['history'];assert len(history)==1+rounds*len(groups)
 h=history[0]
 for k,v in dict(batch=0,round=0,calls=0,sites=[],local=[],predictedDelta=0,internalCorrection=0,actualDelta=0,correctionResidual=0).items():close(h[k],v)
 physical(h['physical'],x,z,g);energies=[energy(x,z,g)];deltas=[0];idx=0;calls=0
 for r in range(1,rounds+1):
  for group in groups:
   idx+=1;h=history[idx];oldx=x[:];oldz=z[:];oldE=energy(x,z,g);assert len(h['local'])==len(group);pred=0
   for j,l in zip(group,h['local']):
    b=field(oldx,j);u,xx,zz=local(b,g);A=[[-g,-b],[-b,g]];ev=dot(u,mv(A,u));delta=ev+b*oldx[j]+g*oldz[j]
    for key,value in dict(site=j,b=b,matrix=A,eigenvalues=[-math.hypot(b,g),math.hypot(b,g)],spinor=u,before=[oldx[j],oldz[j]],after=[xx,zz],oldLocalEnergy=-b*oldx[j]-g*oldz[j],newLocalEnergy=ev,environmentEnergy=oldE+b*oldx[j]+g*oldz[j],isolatedCandidateEnergy=oldE+delta,predictedDelta=delta).items():close(l[key],value,key)
    close(mv(A,l['spinor']),[ev*v for v in l['spinor']]);x[j]=xx;z[j]=zz;pred+=delta
   inside=[];correction=0
   for j in range(3):
    if j in group and j+1 in group:
     dx=x[j]-oldx[j];dy=x[j+1]-oldx[j+1];inside.append(dict(j=j,k=j+1,deltaX=dx,deltaY=dy,correction=-dx*dy));correction-=dx*dy
   delta=energy(x,z,g)-oldE;calls+=len(group)
   for key,value in dict(batch=idx,round=r,calls=calls,sites=group,internalBonds=inside,predictedDelta=pred,internalCorrection=correction,actualDelta=delta,correctionResidual=delta-pred-correction).items():close(h[key],value,key)
   close(h['correctionResidual'],0);physical(h['physical'],x,z,g);energies.append(energy(x,z,g));deltas.append(delta)
   if method!=1:assert delta<=1e-10
 physical(q['final'],x,z,g)
 for key,value in dict(method=method,rounds=rounds,localCalls=8*rounds,lastRoundDrop=energies[-1-len(groups)]-energies[-1],maxBatchRise=max(deltas)).items():close(q[key],value,key)
def witness(q,g,eps,mode):
 v=[math.sqrt(.4)*math.sin(j*math.pi/5)for j in range(1,5)]if mode=='soft'else[.5]*4
 angles=[eps*a for a in v];x=list(map(math.sin,angles));z=list(map(math.cos,angles));E=energy(x,z,g);quad=.5*eps**2*(g*dot(v,v)-2*sum(v[j]*v[j+1]for j in range(3)))
 for key,value in dict(mode=mode,epsilon=eps,direction=v,anglesRadians=angles,x=x,z=z,energy=E,delta=E+4*g,quadratic=quad,quadraticRemainder=E+4*g-quad).items():close(q[key],value,key)
def review(s):
 c=s['parameters'];g=c['fieldTenths']/10;angles=[c['angle'+str(j)]for j in range(4)];rounds=c['rounds'];H,E,v=exact(g)
 close(s['model'],dict(L=4,g=g,J=1,openBoundary=True,bonds=[[0,1],[1,2],[2,3]],siteZeroLeastSignificant=True,chi=1,allSchedulesCallsPerRound=8,initialAnglesDegrees=angles))
 close(s['quantum'],dict(matrix=H,energies=E,groundEnergy=E[0],groundVector=v,groundResidual=norm([a-E[0]*b for a,b in zip(mv(H,v),v)])))
 assert len(s['runs'])==3
 for i,r in enumerate(s['runs']):run(r,g,angles,rounds,i)
 close(s['selected'],s['runs'][c['schedule']])
 h=s['hessian'];A=[[int(abs(i-j)==1)for j in range(4)]for i in range(4)];HH=[[g*(i==j)-A[i][j]for j in range(4)]for i in range(4)];E4,V4=diagonalize(HH);star=(1+math.sqrt(5))/2
 for key,value in dict(adjacency=A,matrix=HH,minimum=E4[0],threshold=star,productGlobalCertificate=g>=star,uniformCurvature=sum(map(sum,HH)),zeroPointEnergy=-4*g,zeroPointVariance=3).items():close(h[key],value,key)
 assert len(h['modes'])==4
 for i,q in enumerate(h['modes']):
  close(q['k'],i+1);close(q['eigenvalue'],E4[i]);close(q['adjacency'],g-E4[i]);vv=q['vector'];close([[a*b for b in vv]for a in vv],[[a*b for b in V4[i]]for a in V4[i]]);close(mv(HH,vv),[E4[i]*a for a in vv])
 eps=math.radians(c['perturbDegrees']);assert len(s['witnesses'])==2
 for q,mode in zip(s['witnesses'],['soft','uniform']):witness(q,g,eps,mode)
 assert len(s['perturbationScan'])==len(s['fieldScan'])==91
 for i,q in enumerate(s['perturbationScan']):
  close(q['degrees'],i/2)
  for mode in ['soft','uniform']:witness(q[mode],g,i*math.pi/360,mode)
 for i,q in enumerate(s['fieldScan']):
  gg=.2+i/50;close(q['g'],gg);close(q['modes'],[gg-g+ev for ev in E4]);close(q['uniformCurvature'],4*gg-6);close(q['productGlobalCertificate'],gg>=star)
  for mode in ['soft','uniform']:witness(q[mode],gg,eps,mode)
 seeds=[angles,[0]*4,[30]*4,[-30]*4,[30,-30,30,-30],[math.sqrt(.4)*math.sin(j*math.pi/5)*c['perturbDegrees']for j in range(1,5)]]
 names=['输入四角','全Z固定点','统一30度','统一负30度','交错正负30度','最低曲率方向'];assert len(s['initialComparisons'])==6
 for q,a,name in zip(s['initialComparisons'],seeds,names):
  x,z=initial(a)
  for r in range(rounds):
   before=energy(x,z,g)
   for j in [0,1,2,3,3,2,1,0]:_,x[j],z[j]=local(field(x,j),g)
  close(q['name'],name);close(q['angles'],a);physical(q['final'],x,z,g,False);close(q['lastRoundDrop'],before-energy(x,z,g));close(q['energyExcess'],energy(x,z,g)-E[0])
 assert len(s['boundaries'])==14 and all(s['boundaries'].values())

METHOD_NAMES=['依次单站点','四点同步','不相邻分组']
def display_control(k,v):return METHOD_NAMES[v]if k=='schedule'else str(v/10).removesuffix('.0')if k=='fieldTenths'else str(v)
def expected_plots(s):
 calls=8*s['parameters']['rounds'];trace=lambda key:[[[h['calls'],h['physical'][key]]for h in r['history']]for r in s['runs']]
 values=[
 ('energy',[0,calls],trace('energy')+[[[0,s['quantum']['groundEnergy']],[calls,s['quantum']['groundEnergy']]]]),
 ('local',[0,calls],trace('localResidual')),
 ('variance',[0,calls],trace('variance')+[[[0,3],[calls,3]]]),
 ('correction',[0,calls],[[[h['calls'],h[key]]for h in s['selected']['history']]for key in ['predictedDelta','internalCorrection','actualDelta']]),
 ('hessian',[.2,2],[[[q['g'],q['modes'][k]]for q in s['fieldScan']]for k in range(4)]+[[[q['g'],q['uniformCurvature']/4]for q in s['fieldScan']]]),
 ('perturb',[0,45],[[[q['degrees'],q[mode][key]]for q in s['perturbationScan']]for mode,key in [('soft','delta'),('uniform','delta'),('soft','quadratic'),('uniform','quadratic')]]),
 ('seeds',[0,8],[[[i+1,q['energyExcess']]]for i,q in enumerate(s['initialComparisons'])]+[[[0,0],[8,0]]])]
 out=[]
 for key,domain,series in values:
  ys=[p[1]for line in series for p in line];lo=min([0]+ys);hi=max([0]+ys)
  if lo==hi:hi=lo+1
  pad=.07*(hi-lo);out.append((key,domain,[lo-pad,hi+pad],series))
 return out
def expected_tables(s):
 at=lambda q,ks:[q[k]for k in ks];all=[(r['method'],h)for r in s['runs']for h in r['history']]
 return[
 ('parameters',[[k,display_control(k,v),v]for k,v in s['parameters'].items()]+[['边界','四站开放，三条键',None],['基矢整数','最低位对应站点1',None],['虚拟键维chi',1,None],['每轮局部求解次数',8,None]]),
 ('quantum',[[i,''.join(str(i>>j&1)for j in range(4)),r,s['quantum']['groundVector'][i]]for i,r in enumerate(s['quantum']['matrix'])]),
 ('spectrum',[[i,E,E-s['quantum']['groundEnergy']]for i,E in enumerate(s['quantum']['energies'])]),
 ('summary',[[METHOD_NAMES[r['method']],r['localCalls'],r['final']['energy'],r['lastRoundDrop'],r['maxBatchRise'],*at(r['final'],['localResidual','variance','quantumResidual','fidelity','energyExcess'])]for r in s['runs']]),
 ('history',[[METHOD_NAMES[method],h['round'],h['batch'],h['calls'],[j+1 for j in h['sites']],h['physical']['energy'],*at(h,['predictedDelta','internalCorrection','actualDelta','correctionResidual']),h['physical']['localResidual'],h['physical']['variance']]for method,h in all]),
 ('local',[[METHOD_NAMES[method],h['round'],h['batch'],q['site']+1,*at(q,['b','matrix','eigenvalues','spinor','before','after','oldLocalEnergy','newLocalEnergy','environmentEnergy','isolatedCandidateEnergy','predictedDelta'])]for method,h in all for q in h['local']]),
 ('cross',[[METHOD_NAMES[method],h['round'],h['batch'],[q['j']+1,q['k']+1],q['deltaX'],q['deltaY'],q['correction']]for method,h in all for q in h.get('internalBonds',[])]),
 ('bloch',[[METHOD_NAMES[method],h['batch'],h['calls'],*at(h['physical'],['x','z','anglesRadians','spinors','bonds','fields'])]for method,h in all]),
 ('states',[[METHOD_NAMES[method],h['batch'],h['calls'],i,v,h['physical']['acted'][i],h['physical']['acted'][i]-h['physical']['matrixEnergy']*v]for method,h in all for i,v in enumerate(h['physical']['state'])]),
 ('hessian',[[q['k'],s['hessian']['adjacency'][i],s['hessian']['matrix'][i],q['vector'],q['eigenvalue'],q['adjacency']]for i,q in enumerate(s['hessian']['modes'])]),
 ('certificate',[['乘积态阈值gstar',s['hessian']['threshold']],['最小Hessian曲率',s['hessian']['minimum']],['四点同转phi的二阶曲率',s['hessian']['uniformCurvature']],['解析全局乘积态证书适用',s['hessian']['productGlobalCertificate']],['全Z能量',s['hessian']['zeroPointEnergy']],['全Z量子方差',s['hessian']['zeroPointVariance']],['完整基态本征残差',s['quantum']['groundResidual']]]),
 ('perturbation',[[q['degrees'],*at(q['soft'],['delta','quadratic','quadraticRemainder']),*at(q['uniform'],['delta','quadratic','quadraticRemainder']),q['soft']['anglesRadians']]for q in s['perturbationScan']]),
 ('field',[[q['g'],q['modes'],q['uniformCurvature'],q['productGlobalCertificate'],q['soft']['delta'],q['uniform']['delta']]for q in s['fieldScan']]),
 ('seeds',[[q['name'],q['angles'],q['final']['x'],q['final']['z'],q['final']['energy'],q['final']['localResidual'],q['lastRoundDrop'],q['energyExcess']]for q in s['initialComparisons']]),
 ('boundaries',[list(q)for q in s['boundaries'].items()])]

NODE="const fs=require('fs'),a=require(process.argv[1]),f=require(process.argv[2]);\nfunction replay(x,y,path='root'){if(typeof y==='number'){if(typeof x!=='number'||!Number.isFinite(x)||Math.abs(x-y)>3e-11+5e-10*Math.abs(y))throw Error('Replay '+path);}else if(y!==null&&typeof y==='object'){if(!x||typeof x!=='object'||Array.isArray(x)!==Array.isArray(y)||JSON.stringify(Object.keys(x))!==JSON.stringify(Object.keys(y)))throw Error('Replay keys '+path);for(const k of Object.keys(y))replay(x[k],y[k],path+'.'+k);}else if(x!==y)throw Error('Replay scalar '+path);}\nconst cases=a.PRESETS.map(p=>a.compute(p.parameters));let invalid=0;\nfor(const[k,[lo,hi]]of Object.entries(a.LIMITS)){cases.push(a.compute({[k]:lo}),a.compute({[k]:hi}));for(const v of[lo-1,hi+1,lo+.5,'1',null,true,NaN,Infinity]){let bad=false;try{a.compute({[k]:v})}catch(e){bad=true}if(!bad)throw Error('Invalid accepted '+k);invalid++;}}\nfor(const v of[null,[],true,{unknown:1}]){let bad=false;try{a.compute(v)}catch(e){bad=true}if(!bad)throw Error('Bad object');invalid++;}\nfor(const r of f.records)replay(r.data,a.compute(r.data.parameters));\nconst observed=process.argv[3]?JSON.parse(fs.readFileSync(process.argv[3],'utf8')):[];for(const q of observed)replay(q,a.compute(q.parameters));\nlet feedback=0;for(let i=0;i<4;i++)for(let j=0;j<2;j++){if(a.feedback(i,j).correct!==(j===a.QUESTIONS[i][2]))throw Error('Feedback');feedback++;}\nconst snapshots=[...cases,...f.records.map(r=>r.data),...observed];const records=snapshots.map(snapshot=>({snapshot,plots:a.plots(snapshot),tables:a.tables(snapshot),svgs:a.plots(snapshot).map(a.svg)}));\nlet replayGuards=0;for(const change of[q=>q.schema='wrong',q=>q.parameters.rounds=99,q=>delete q.quantum,q=>q.model.g='0',q=>q.quantum.matrix[0][0]=NaN,q=>q.fieldScan.pop(),q=>q.boundaries.simultaneousCorrectionExplicit=false,q=>q.runs[0].final.state=null]){const q=JSON.parse(JSON.stringify(cases[0]));change(q);try{replay(q,cases[0])}catch(e){replayGuards++;}}if(replayGuards!==8)throw Error('Replay guard');\nlet mountControls=0;\nfunction mountPresetNames(api){class E{constructor(tag,doc){this.tag=tag;this.ownerDocument=doc;this.children=[];this.attrs={};this._text='';this.classList={add(){}};}set textContent(v){this._text=String(v);this.children=[];}get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}append(...xs){this.children.push(...xs);}replaceChildren(...xs){this._text='';this.children=[...xs];}setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return Object.hasOwn(this.attrs,k)?this.attrs[k]:null;}removeAttribute(k){delete this.attrs[k];}addEventListener(){}}const doc={createElement(t){return new E(t,this)},querySelector(){return null}};doc.head=new E('head',doc);const root=new E('div',doc);api.mount(root);const all=[];function visit(e){if(e.getAttribute('data-preset')!==null)all.push(e);e.children.forEach(visit)}visit(root);if(all.length!==api.PRESETS.length)throw Error('Preset count');all.forEach((b,i)=>{const name=api.PRESETS[i].name;if(typeof name!=='string'||!name.trim()||b.textContent.trim()!==name)throw Error('Missing name')});function checkControls(c){const labels=[];function walk(e){if(e.tag==='label'&&e.children.some(x=>x.tag==='input'))labels.push(e);e.children.forEach(walk)}walk(root);if(labels.length!==8)throw Error('Control count');for(const label of labels){const field=label.children.find(e=>e.tag==='input'),output=label.children.find(e=>e.tag==='output'),k=field.getAttribute('data-field'),v=c[k],expected=k==='schedule'?['依次单站点','四点同步','不相邻分组'][v]:String(k==='fieldTenths'?v/10:v);if(output.textContent!==expected||field.getAttribute('aria-valuetext')!==expected)throw Error('Physical control value '+k);if(api===a)mountControls++;}}checkControls(api.DEFAULTS);all.forEach((b,i)=>{b.onclick();checkControls(api.config(api.PRESETS[i].parameters));});return all.length;}\nconst mountLabels=mountPresetNames(a),source=fs.readFileSync(process.argv[1],'utf8'),needle='},p.name);';if(!source.includes(needle))throw Error('Name field');const sandbox={module:{exports:{}}};require('vm').runInNewContext(source.replace(needle,'},p.label);'),sandbox);let mountMutations=0;try{mountPresetNames(sandbox.module.exports)}catch(e){mountMutations++;}if(mountMutations!==1)throw Error('Name mutation');\nconst controlSandbox={module:{exports:{}}},controlNeedle='o.textContent=controlText(k,c[k]);';if(!source.includes(controlNeedle))throw Error('Control output expression');require('vm').runInNewContext(source.replace(controlNeedle,'o.textContent=fmt(c[k]);'),controlSandbox);let controlMutations=0;try{mountPresetNames(controlSandbox.module.exports)}catch(e){controlMutations++;}if(controlMutations!==1)throw Error('Control mutation');\nconsole.log(JSON.stringify({mountControls,controlMutations,records,live:cases.length,frozen:f.records.length,observed:observed.length,invalid,feedback,replayGuards,mountLabels,mountMutations,self:a.selfTest()}));\n"
def viewcheck(record):
 global coords,markers,ledgerRows
 s=record['snapshot'];wanted=expected_plots(s);assert len(record['plots'])==len(record['svgs'])==7
 for p,(key,domain,yrange,series),markup in zip(record['plots'],wanted,record['svgs']):
  assert p['key']==key and p['title']and p['xLabel']and p['yLabel'];close([p['xMin'],p['xMax']],domain)
  close([p['yMin'],p['yMax']],yrange);assert len(p['series'])==len(series)
  tree=ET.fromstring(markup);assert tree.attrib['viewBox']=='0 0 900 580'and tree.attrib['role']=='img'and tree.attrib['aria-label']==p['title'];paths=tree.findall('.//{*}path');circles=tree.findall('.//{*}circle');assert len(paths)==len(series)
  mark=0
  for i,(line,expected,path)in enumerate(zip(p['series'],series,paths)):
   close(line['points'],expected,'scientific plot');assert path.attrib['data-series']==str(i)and path.attrib['stroke']==line['color']
   commands=re.findall(r'([ML])([-+\deE.]+),([-+\deE.]+)',path.attrib['d']);points=[q for q in expected if q is not None];assert len(commands)==len(points)
   pen=False;idx=0
   for q in expected:
    if q is None:pen=False;continue
    kind,x,y=commands[idx];assert kind==('L'if pen else'M');pen=True;idx+=1
    assert domain[0]-1e-10<=q[0]<=domain[1]+1e-10 and p['yMin']<=q[1]<=p['yMax']
    X=100+(q[0]-domain[0])/(domain[1]-domain[0])*755;Y=385-(q[1]-p['yMin'])/(p['yMax']-p['yMin'])*290
    close([float(x),float(y)],[X,Y],'SVG coordinate',atol=6e-7,rtol=0);coords+=2
    if idx in [1,len(points)]:
     c=circles[mark];mark+=1;close([float(c.attrib['cx']),float(c.attrib['cy']),float(c.attrib['r'])],[X,Y,3.5+1.5*i]);assert c.attrib['stroke']==line['color']and c.attrib['fill']==('none'if i else line['color']);markers+=1
  assert mark==len(circles)
 for t,(key,rows)in zip(record['tables'],expected_tables(s)):
  assert t['key']==key and t['title'];close(t['rows'],rows,'full table '+key);assert all(len(r)==len(t['headers'])for r in t['rows']);ledgerRows+=len(rows)
 assert len(record['tables'])==15

if __name__=='__main__':
 import sys,json,hashlib,subprocess,shutil,re,copy
 import xml.etree.ElementTree as ET
 from pathlib import Path
 root=Path(__file__).resolve().parents[1];js=Path(sys.argv[1]).resolve()if len(sys.argv)>1 else root/'course-shared/labs/scalar-product-sweeps.js';fixture=Path(sys.argv[2]).resolve()if len(sys.argv)>2 else root/'course-shared/projects/sweeps-certificates/run-snapshot.json'
 f=json.loads(fixture.read_text());assert f['provenance']['sourceSha256']==hashlib.sha256(js.read_bytes()).hexdigest();assert len(f['records'])==6
 args=[str(js),str(fixture)]+([str(Path(sys.argv[3]).resolve())]if len(sys.argv)>3 else[]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
 result=json.loads(subprocess.check_output(prefix+['node','-e',NODE,*args],text=True));coords=markers=ledgerRows=0
 for r in result['records']:review(r['snapshot']);viewcheck(r)
 specimens={r['key']:r['data']for r in f['records']};mutations=0
 edits=[
 ('default',lambda q:q['quantum']['matrix'][0].__setitem__(0,0)),
 ('default',lambda q:q['quantum']['energies'].__setitem__(1,q['quantum']['energies'][0])),
 ('default',lambda q:q['quantum']['groundVector'].__setitem__(0,0)),
 ('default',lambda q:q['runs'][0]['history'][1]['local'][0]['matrix'][0].__setitem__(1,0)),
 ('default',lambda q:q['runs'][0]['history'][1]['local'][0].__setitem__('environmentEnergy',0)),
 ('default',lambda q:q['runs'][0]['history'][1]['local'][0].__setitem__('isolatedCandidateEnergy',0)),
 ('default',lambda q:q['runs'][0].__setitem__('localCalls',q['runs'][0]['rounds'])),
 ('default',lambda q:q['runs'][0]['history'][1]['physical']['state'].__setitem__(0,0)),
 ('jacobi',lambda q:q['runs'][1]['history'][1].__setitem__('internalCorrection',0)),
 ('jacobi',lambda q:q['runs'][1]['history'][1].__setitem__('actualDelta',-4)),
 ('jacobi',lambda q:q['runs'][1]['history'][1]['internalBonds'][0].__setitem__('correction',0)),
 ('fixed',lambda q:q['runs'][0]['final'].__setitem__('variance',0)),
 ('fixed',lambda q:q['runs'][0]['final'].__setitem__('quantumResidual',0)),
 ('hidden',lambda q:q['hessian'].__setitem__('minimum',.1)),
 ('hidden',lambda q:q['hessian'].__setitem__('productGlobalCertificate',True)),
 ('certified',lambda q:q['hessian'].__setitem__('zeroPointVariance',0)),
 ('hidden',lambda q:q['witnesses'][0].__setitem__('delta',q['witnesses'][1]['delta'])),
 ('default',lambda q:q['perturbationScan'][-1]['soft'].__setitem__('quadraticRemainder',0)),
 ('default',lambda q:q['initialComparisons'][1]['final'].__setitem__('energy',q['quantum']['groundEnergy'])),
 ('default',lambda q:q['boundaries'].__setitem__('multistartNotGlobalOptimalityProof',False))]
 for key,edit in edits:
  q=copy.deepcopy(specimens[key]);edit(q)
  try:review(q)
  except(AssertionError,TypeError,KeyError,ValueError,ZeroDivisionError):mutations+=1
  else:raise AssertionError('Undetected mutation '+key)
 assert result['mountControls']==104 and result['controlMutations']==1
 assert result['invalid']==68 and result['feedback']==8 and result['mountLabels']==12 and result['mountMutations']==1 and result['replayGuards']==8
 print(json.dumps(dict(status='PASS',records=result['live'],frozen=result['frozen'],observed=result['observed'],checks=checks,plotCoordinates=coords,markers=markers,ledgerRows=ledgerRows,invalid=result['invalid'],feedback=result['feedback'],mutations=mutations,mountControls=result['mountControls'],controlMutations=result['controlMutations'],mountLabels=result['mountLabels'],mountMutations=result['mountMutations'],replayGuards=result['replayGuards'],self=result['self']['checks'])))
