"""Independent exact rational predicates and Gram-system construction."""
from pathlib import Path
from fractions import Fraction as F
import random,math,json
R=Path(__file__).resolve().parents[1]
if not (R/'math-course').exists(): R=Path('/Users/karasuakamatsu/course-library')
rng=random.Random(880902)
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def cross(a,b):return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
def conv(x):
 try:y=float(x)
 except OverflowError:return None
 return y if math.isfinite(y) else None
def v():return [math.ldexp(float(rng.randint(-8,8)),rng.choice([-900,-500,-10,0,10,500,900])) for _ in range(3)]
lines=[];planes=[]
def lp(s):
 n,p,q,d=[list(map(F,s[k])) for k in ['normal','planePoint','point','direction']]
 e={}
 if not any(n):e['relation']='degenerate-plane'
 elif not any(d):e['relation']='degenerate-line'
 else:
  a=dot(n,d);b=dot(n,[x-y for x,y in zip(q,p)])
  e.update(denominatorNonzero=bool(a),offsetNonzero=bool(b))
  if not a:e['relation']='parallel' if b else 'contained'
  else:e.update(relation='intersect',parameter=conv(-b/a),intersection=[conv(x-b*y/a) for x,y in zip(q,d)])
 lines.append({'input':s,'expected':e})
def pp(s):
 a,b=[list(map(F,s[k])) for k in ['normal1','normal2']];c,d=map(F,[s['constant1'],s['constant2']]);e={}
 if not any(a) or not any(b):e['relation']='degenerate-plane'
 else:
  w=cross(a,b)
  if not any(w):
   j=next(i for i,x in enumerate(a) if x);e['relation']='coincident' if d*a[j]==c*b[j] else 'parallel'
  else:
   # Solve the two-by-two normal Gram system, independently of the cross formula.
   aa,ab,bb=dot(a,a),dot(a,b),dot(b,b);det=aa*bb-ab*ab
   lam=(c*bb-d*ab)/det;mu=(d*aa-c*ab)/det
   scale=max(abs(x) for x in w);wd=[float(x/scale) for x in w];length=math.hypot(*wd)
   e.update(relation='intersect',intersectionPoint=[conv(lam*x+mu*y) for x,y in zip(a,b)],intersectionDirection=[x/length for x in wd])
 planes.append({'input':s,'expected':e})
for _ in range(900):
 lp(dict(zip(['normal','planePoint','point','direction'],[v() for _ in range(4)])))
 pp(dict(normal1=v(),normal2=v(),constant1=v()[0],constant2=v()[0]))
for scale in [0.,math.ulp(0.),1e-300,1e-12,1.,-1.,1e300,float.fromhex('0x1.fffffffffffffp1023')]:
 for k in [0.,math.ulp(0.),1e-300,-1e-12,1.,1e300]:
  lp(dict(normal=[0,0,scale],planePoint=[0,0,0],point=[1,1,1],direction=[1,0,k]))
  pp(dict(normal1=[0,0,scale],normal2=[k,0,scale],constant1=0,constant2=1))
for exponent in [-900,-100,0,100,900]:
 scale=math.ldexp(1.,exponent)
 for sign in [-1,1]:
  for c in [2,3]:pp(dict(normal1=[scale,scale,scale],normal2=[sign*2*scale]*3,constant1=scale,constant2=sign*c*scale))
for n,d in [([1e308,1e308,1], [1e308,-1e308,1e-300]),([1,1,1],[1,math.ulp(0.),-1]),([0,0,1],[0,0,0])]:lp(dict(normal=n,direction=d,point=[1,2,3],planePoint=[0,0,0]))
out={'method':'Python Fraction.from_float exact predicates; independent normal Gram solve','lines':lines,'planes':planes}
p=R/'tools/fixtures/vectors-reference.json';p.write_text(json.dumps(out,separators=(',',':'),allow_nan=False)+'\n');print(len(lines),len(planes))
