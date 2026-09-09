from pathlib import Path
import json,itertools,mpmath as m
ROOT=Path(__file__).resolve().parents[1];m.mp.dps=100
rows=[]
for deg,eta,direction,mode,scale in itertools.product([1e-12,1e-8,1e-4,2,5,17.5,45,89.5,90],[0,1e-18,1e-12,.001,.01,.1,1],['min','max'],['reference','small-b'],[1e-100,.25,1,2,1e100]):
 t=m.mpf(deg)*m.pi/180;c=m.cos(t)if deg!=90 else m.mpf(0);s=m.sin(t)if deg!=90 else m.mpf(1)
 A=m.matrix([[1,0],[c,s]]);x=m.matrix([scale,0]if mode=='reference'else[0,scale]);b=A*x
 eig,_=m.eigsy(A*A.T);low=m.sqrt(eig[0]);high=m.sqrt(eig[1]);u=m.matrix([-1,1]if direction=='min'else[1,1])/m.sqrt(2)
 db=m.mpf(eta)*m.norm(b)*u;dx=m.lu_solve(A,db);xh=x+dx;rho=m.norm(db)/m.norm(b)
 vals={'sigmaMin':low,'sigmaMax':high,'kappa':high/low,'bNorm':m.norm(b),'forward':m.norm(dx)/m.norm(x),'gain':1/(low if direction=='min'else high),'rho':rho,'backward':m.norm(db)/(high*m.norm(xh)+m.norm(b))}
 rows.append({'spec':{'thetaDeg':deg,'perturbation':eta,'direction':direction,'xMode':mode,'xScale':scale},'values':{k:float(v)for k,v in vals.items()},'deltaX':[float(v)for v in dx],'deltaB':[float(v)for v in db]})
(ROOT/'tools/fixtures/linear-conditioning-reference.json').write_text(json.dumps({'digits':100,'method':'eigsy(A A^T), LU solve of independent 100-digit model','rows':rows},indent=2)+'\n')
print('Built',len(rows),'independent linear conditioning references')
