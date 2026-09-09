from pathlib import Path
import json,mpmath as m
m.mp.dps=60
ROOT=Path(__file__).resolve().parents[1]
def cross(a,b):return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def norm(a):return m.sqrt(dot(a,a))
rows=[]
for name in ['line','circle','helix','inflection']:
 for ttext in ['-3.2','-1','-0.5','-0.01','-0.000000000001','0','0.000000000001','0.01','0.5','1','3.2']:
  for rate in [-5,-3,-2,-1,-.5,-.1,.1,.5,1,2,3,5]:
   t=m.mpf(ttext);lam=m.mpf(str(rate));u=lam*t
   def f(q):
    v=lam*q
    return [v,0*v,0*v] if name=='line' else [v,v**3,0*v] if name=='inflection' else [2*m.cos(v),2*m.sin(v),v if name=='helix' else 0*v]
   ds=[[m.diff(lambda q:f(q)[j],t,n) for j in range(3)] for n in [1,2,3]]
   d1,d2,d3=ds;v=norm(d1);T=[x/v for x in d1];C=cross(d1,d2);cn=norm(C);k=cn/v**3
   defined=name!='line' and (name!='inflection' or u!=0)
   tau=dot(C,d3)/cn**2 if defined else None
   N0=[d2[i]-T[i]*dot(T,d2) for i in range(3)]
   N=[x/norm(N0) for x in N0] if defined else None;B=cross(T,N) if N else None
   arc=m.sign(lam)*m.quad(lambda q:m.sqrt(1+9*q**4),[0,u]) if name=='inflection' else abs(lam)*t*({'line':1,'circle':2,'helix':m.sqrt(5)}[name])
   def conv(x):return [float(v) for v in x] if isinstance(x,list) else None if x is None else float(x)
   rows.append(dict(id=name,t=float(t),rate=rate,point=conv(f(t)),speed=conv(v),curvature=conv(k),torsion=conv(tau),tangent=conv(T),normal=conv(N),binormal=conv(B),arcLength=conv(arc),defined=defined))
(ROOT/'tools/fixtures/frenet-reference.json').write_text(json.dumps(rows,indent=2)+'\n')
print('Independent 60-digit differentiated curves:',len(rows))
