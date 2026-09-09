from pathlib import Path
import mpmath as m,json,math
m.mp.dps=65
ROOT=Path(__file__).resolve().parents[1]
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def cross(a,b):return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
def norm(a):return m.sqrt(dot(a,a))
def convert(x):
 if isinstance(x,(list,tuple)):return [convert(a) for a in x]
 if isinstance(x,m.matrix):return [[float(x[i,j]) for j in range(x.cols)] for i in range(x.rows)]
 return float(x)
rows=[]
for name in ['plane','sphere','cylinder','saddle']:
 us=[-1,0,.3,1] if name=='plane' else [-1.4,-.7,0,.25,1.4,math.nextafter(math.pi/2,0)] if name=='sphere' else [-3.2,0,.8,3.2] if name=='cylinder' else [-100,-1,-.5,0,.5,1,100]
 vs=[-1,0,.2,1] if name=='plane' else [-3.2,-.5,0,.65,2.3] if name=='sphere' else [-2,0,.4,2] if name=='cylinder' else [-100,-1,-.5,0,.5,1,100]
 for uf in us:
  for vf in vs:
   for sign in [1,-1]:
    u=m.mpf(float(uf));v=m.mpf(float(vf))
    def f(u,v):
     return [u,v,0*u] if name=='plane' else [u,v,u*u-v*v] if name=='saddle' else [2*m.cos(u)*m.cos(v),2*m.cos(u)*m.sin(v),2*m.sin(u)] if name=='sphere' else [m.mpf('1.5')*m.cos(u),m.mpf('1.5')*m.sin(u),v]
    def derivative(i,j):return [m.diff(lambda u,v:f(u,v)[k],(u,v),(i,j)) for k in range(3)]
    ru,rv=derivative(1,0),derivative(0,1);ruu,ruv,rvv=derivative(2,0),derivative(1,1),derivative(0,2)
    n0=cross(ru,rv);sgn=sign*(-1 if name=='sphere' else 1);n=[sgn*x/norm(n0) for x in n0]
    E,F,G=dot(ru,ru),dot(ru,rv),dot(rv,rv);g=m.matrix([[E,F],[F,G]]);L,M,N=dot(ruu,n),dot(ruv,n),dot(rvv,n);h=m.matrix([[L,M],[M,N]])
    # Independent symmetric generalized eigensystem via Cholesky whitening.
    chol=m.cholesky(g);white=chol**-1*h*(chol.T)**-1;eigs,_=m.eigsy(white)
    S=g**-1*h;K=m.det(S);H=(S[0,0]+S[1,1])/2
    e1=[x/m.sqrt(E) for x in ru];other=[rv[i]-F/E*ru[i] for i in range(3)];e2=[x/norm(other) for x in other]
    directions=[]
    for angle in [0,math.pi/12,math.pi/4,math.pi/2,math.pi]:
     t=m.mpf(angle);co=m.cos(t)/m.sqrt(E)-m.sin(t)*F/(m.sqrt(E)*m.sqrt(m.det(g)));cv=m.sin(t)*m.sqrt(E)/m.sqrt(m.det(g))
     directions.append(dict(angle=angle,value=float(L*co*co+2*M*co*cv+N*cv*cv)))
    rows.append(dict(id=name,u=uf,v=vf,sign=sign,point=convert(f(u,v)),normal=convert(n),first=convert([E,F,G,m.det(g)]),second=convert([L,M,N]),K=float(K),H=float(H),principal=[float(eigs[1]),float(eigs[0])],directions=directions))
(ROOT/'tools/fixtures/surface-reference.json').write_text(json.dumps(rows,indent=2)+'\n')
print('Independent 65-digit surface derivatives and generalized eigenvalues:',len(rows))
